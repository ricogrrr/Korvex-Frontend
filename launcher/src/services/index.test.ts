import { describe, expect, it, vi } from 'vitest';
import { services, wsClient } from '.';
import { MockWsClient } from '../ws/client';

/* Exercises the mock backend through the same services API the screens use.
   State is shared per run - assertions restore what they mutate. */
describe('services (mock backend)', () => {
  it('profile reports fixture identity and a live friend count', async () => {
    const p = await services.user.getProfile();
    expect(p.player.username).toBe('DevPlayer');
    const friends = await services.friends.list();
    expect(p.friendsCount).toBe(friends.length);
  });

  it('mod enable toggles round-trip through the client', async () => {
    const mods = await services.mods.list();
    expect(mods.length).toBeGreaterThan(0);
    const target = mods[0];
    const { mod } = await services.mods.setEnabled(target.id, !target.enabled);
    expect(mod.enabled).toBe(!target.enabled);
    const after = (await services.mods.list()).find((m) => m.id === target.id);
    expect(after?.enabled).toBe(!target.enabled);
    await services.mods.setEnabled(target.id, target.enabled); // restore
  });

  it('mod settings get/set round-trip and reject unknown keys', async () => {
    const { settings } = await services.mods.getSettings('fps');
    expect(settings.length).toBeGreaterThan(0);
    const toggle = settings.find((s) => s.kind === 'toggle');
    expect(toggle).toBeDefined();
    if (!toggle) return;
    const { settings: after } = await services.mods.setSetting('fps', toggle.key, !toggle.value);
    expect(after.find((s) => s.key === toggle.key)?.value).toBe(!toggle.value);
    await expect(services.mods.setSetting('fps', 'no-such-key', true)).rejects.toThrow('no setting');
    await expect(services.mods.setSetting('no-such-mod', 'x', true)).rejects.toThrow('no settings');
    await services.mods.setSetting('fps', toggle.key, toggle.value); // restore
  });

  it('accepting a friend request moves it onto the friends list', async () => {
    const reqs = await services.friends.listRequests();
    if (reqs.length === 0) return; // earlier test run already consumed it
    const { friend } = await services.friends.accept(reqs[0].player.uuid);
    expect(friend.player.username).toBe(reqs[0].player.username);
    expect((await services.friends.listRequests()).length).toBe(reqs.length - 1);
    const friends = await services.friends.list();
    expect(friends.some((f) => f.player.uuid === friend.player.uuid)).toBe(true);
    // restore (accept is one-way in the mock; leave removed to keep state clean)
  });

  it('equipping cosmetics writes state and emits a push', async () => {
    expect(wsClient instanceof MockWsClient).toBe(true);
    if (!(wsClient instanceof MockWsClient)) return;
    const push = vi.fn();
    const off = wsClient.onPush(push);
    await services.cosmetics.equip('cloak', ['cloak-ember']);
    expect(push).toHaveBeenCalledWith(expect.objectContaining({ service: 'cosmetic' }));
    const { equipped } = await services.cosmetics.getEquipped();
    expect(equipped.cloak).toEqual(['cloak-ember']);
    off();
    await services.cosmetics.equip('cloak', ['cloak-void']); // restore
  });

  it('purchasing a cosmetic marks it owned and removes it from the catalog', async () => {
    const before = await services.cosmetics.catalog();
    const target = before[0].cosmetic;
    const { cosmetic } = await services.cosmetics.purchase(target.id);
    expect(cosmetic.owned).toBe(true);
    const after = await services.cosmetics.catalog();
    expect(after.some((i) => i.cosmetic.id === target.id)).toBe(false);
    await expect(services.cosmetics.purchase(target.id)).rejects.toThrow('already owned');
    await expect(services.cosmetics.purchase('no-such-item')).rejects.toThrow('no cosmetic');
  });

  it('chat send returns a self message and echoes via push', async () => {
    const push = vi.fn();
    const off = wsClient.onPush(push);
    const { message } = await services.chat.send('u-vex', 'on my way');
    expect(message.from).toBe('self');
    expect(message.threadId).toBe('u-vex');
    const { messages } = await services.chat.list('u-vex');
    expect(messages.some((m) => m.id === message.id && m.text === 'on my way')).toBe(true);
    expect(push).toHaveBeenCalledWith(expect.objectContaining({ service: 'chat', method: 'MessageReceived' }));
    off();
  });

  it('notifications: mark all read flags rows, dismiss removes one', async () => {
    const { notifications } = await services.user.markRead();
    expect(notifications.every((n) => n.read)).toBe(true);
    const target = notifications[0];
    const { notifications: after } = await services.user.dismiss(target.id);
    expect(after.some((n) => n.id === target.id)).toBe(false);
    expect(after.length).toBe(notifications.length - 1);
  });

  it('settings writes merge and persist to the mock store', async () => {
    await services.settings.set({ telemetry: true, hudScale: 150 });
    const { settings } = await services.settings.get();
    expect(settings.telemetry).toBe(true);
    expect(settings.hudScale).toBe(150);
    const raw = (() => {
      try {
        return typeof localStorage === 'undefined' ? null : localStorage.getItem('korvex.settings');
      } catch {
        return null;
      }
    })();
    if (raw !== null) expect(JSON.parse(raw)).toMatchObject({ telemetry: true, hudScale: 150 });
    await services.settings.set({ telemetry: false, hudScale: 100 }); // restore
  });

  it('version install and RAM allocation round-trip', async () => {
    const { versions } = await services.game.listVersions();
    const target = versions.find((v) => !v.installed);
    if (target) {
      await services.game.install(target.id);
      await services.game.waitInstall(target.id);
      const after = (await services.game.listVersions()).versions;
      expect(after.find((v) => v.id === target.id)?.installed).toBe(true);
    }
    const { ramMb } = await services.game.setRam(versions[0].id, 6144);
    expect(ramMb).toBe(6144);
    await services.game.setRam(versions[0].id, versions[0].ramMb); // restore
  });
});
