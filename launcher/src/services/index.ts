/* Domain services - the only way components touch data.
   Every call goes through wsClient.call(service, method, input) so the real
   backend drops in by swapping the client, not the call sites. */

import { wsClient, MockWsClient } from '../ws/client';
import * as fx from './fixtures';
import type {
  BundleItem, CatalogItem, ClientSettings, Cosmetic, CosmeticType, DeviceLoginInfo, FriendEntry, FriendRequest, GameIpcState, GameSession, GameTelemetry, GameVersion, GameVersionList,
  ChatMessage, InstalledMod, LoginPoll, ModSetting, ModSettingValue, NotificationItem, PlayerCosmetics, PopupLoginInfo, Presence, PresenceState, ServerEntry, ServerPing, UpdateCheckResult, UserProfile,
} from './types';

export * from './types';
export { wsClient };

/* Cosmetic art lives on the backend HTTP port - derive it from the ws URL
   (ws→http) so dev/prod hosts follow the same knob; falls back to localhost
   like the skin proxy in AccountCard. */
const API_BASE =
  (import.meta.env?.VITE_API_URL as string | undefined) ??
  (import.meta.env?.VITE_WS_URL as string | undefined)?.replace(/^ws(s?):/, 'http$1:') ??
  'http://localhost:8787';

export function assetUrl(resource: string | undefined): string | undefined {
  return resource ? `${API_BASE}/assets/${resource}` : undefined;
}

/* Installs finish via game.InstallFinished pushes - the request returns
   immediately server-side since a full download outlives any call timeout. */
const installWaiters = new Map<string, { resolve: () => void; reject: (e: Error) => void }>();
wsClient.onPush((m) => {
  if (m.service !== 'game' || m.method !== 'InstallFinished') return;
  const p = m.input as { id: string; ok: boolean; error?: string };
  const w = installWaiters.get(p.id);
  if (!w) return;
  installWaiters.delete(p.id);
  if (p.ok) w.resolve();
  else w.reject(new Error(p.error ?? 'install failed'));
});

/* Game<->launcher IPC pushes - the mod reports connection state (IpcState) and
   2s telemetry ticks (Telemetry). Subscribe components via these listeners. */
const telemetryListeners = new Set<(t: GameTelemetry) => void>();
const ipcStateListeners = new Set<(s: GameIpcState) => void>();
const gameSessionListeners = new Set<(s: GameSession) => void>();
wsClient.onPush((m) => {
  if (m.service !== 'game') return;
  if (m.method === 'Telemetry') telemetryListeners.forEach((fn) => fn(m.input as GameTelemetry));
  if (m.method === 'IpcState') ipcStateListeners.forEach((fn) => fn(m.input as GameIpcState));
  if (m.method === 'GameSession') gameSessionListeners.forEach((fn) => fn(m.input as GameSession));
});

export const onGameTelemetry = (fn: (t: GameTelemetry) => void) => {
  telemetryListeners.add(fn);
  return () => { telemetryListeners.delete(fn); };
};
export const onGameIpcState = (fn: (s: GameIpcState) => void) => {
  ipcStateListeners.add(fn);
  return () => { ipcStateListeners.delete(fn); };
};
export const onGameSession = (fn: (s: GameSession) => void) => {
  gameSessionListeners.add(fn);
  return () => { gameSessionListeners.delete(fn); };
};

/* ---- register mock service methods on the shared client ---- */

const mock = wsClient instanceof MockWsClient ? wsClient : null;

let friends = fx.FRIENDS.map((f) => ({ ...f }));
let friendRequests = fx.FRIEND_REQUESTS.map((r) => ({ ...r }));
let mods = fx.MODS.map((m) => ({ ...m }));
const modSettings: Record<string, ModSetting[]> = Object.fromEntries(
  Object.entries(fx.MOD_SETTINGS).map(([id, list]) => [id, list.map((s) => ({ ...s }))]),
);
let cosmetics = fx.COSMETICS.map((c) => ({ ...c }));
let equipped = structuredClone(fx.EQUIPPED.equipped);
let versions = fx.VERSIONS.map((v) => ({ ...v }));
let notifications = fx.NOTIFICATIONS.map((n) => ({ ...n }));
let chatMessages = fx.CHAT_MESSAGES.map((m) => ({ ...m }));
let chatSeq = chatMessages.length;

/* Mock persistence: localStorage stands in for the backend's settings store so
   values survive reloads in dev. Absent storage (tests, SSR) falls back to
   in-memory. The real client persists server-side. */
const SETTINGS_KEY = 'korvex.settings';
const storage: Pick<Storage, 'getItem' | 'setItem'> | null = (() => {
  try {
    const s = typeof localStorage === 'undefined' ? null : localStorage;
    return s && typeof s.getItem === 'function' && typeof s.setItem === 'function' ? s : null;
  } catch {
    return null;
  }
})();
let settings: ClientSettings = (() => {
  try {
    const raw = storage?.getItem(SETTINGS_KEY);
    return raw ? { ...fx.DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<ClientSettings>) } : fx.DEFAULT_SETTINGS;
  } catch {
    return fx.DEFAULT_SETTINGS;
  }
})();

if (mock) {
  mock.register('auth', 'StartLogin', () => ({
    authorizeUri: 'https://microsoft.com/link',
    state: 'mock',
  }));
  mock.register('auth', 'CompleteLogin', () => ({
    status: 'ok',
    player: { uuid: fx.PROFILE.player.uuid, username: fx.PROFILE.player.username },
    token: 'mock-token',
  }));
  mock.register('auth', 'PollLogin', () => ({
    status: 'ok',
    player: { uuid: fx.PROFILE.player.uuid, username: fx.PROFILE.player.username },
    token: 'mock-token',
  }));
  mock.register('auth', 'StartDeviceLogin', () => ({
    userCode: 'MOCK-1234',
    verificationUri: 'https://microsoft.com/link',
    deviceCode: 'mock',
    intervalSeconds: 1,
  }));
  mock.register('auth', 'PollDeviceLogin', () => ({
    status: 'ok',
    player: { uuid: fx.PROFILE.player.uuid, username: fx.PROFILE.player.username },
    token: 'mock-token',
  }));
  mock.register('auth', 'Logout', () => ({}));

  mock.register('user', 'GetProfile', () => ({ ...fx.PROFILE, friendsCount: friends.length, cosmeticsOwned: cosmetics.filter((c) => c.owned).length }));
  mock.register('user', 'ListNotifications', () => notifications.map((n) => ({ ...n })));
  mock.register('user', 'MarkNotificationsRead', () => {
    notifications = notifications.map((n) => ({ ...n, read: true }));
    mock.emit('user', 'NotificationsChanged', { notifications: notifications.map((n) => ({ ...n })) });
    return { notifications: notifications.map((n) => ({ ...n })) };
  });
  mock.register('user', 'DismissNotification', (input) => {
    const { id } = input as { id: string };
    notifications = notifications.filter((n) => n.id !== id);
    mock.emit('user', 'NotificationsChanged', { notifications: notifications.map((n) => ({ ...n })) });
    return { notifications: notifications.map((n) => ({ ...n })) };
  });

  mock.register('friend', 'ListFriends', () => friends.map((f) => ({ ...f })));
  mock.register('friend', 'ListRequests', () => friendRequests.map((r) => ({ ...r })));
  mock.register('friend', 'AcceptRequest', (input) => {
    const { uuid } = input as { uuid: string };
    const req = friendRequests.find((r) => r.player.uuid === uuid);
    if (!req) throw new Error('no such request');
    friendRequests = friendRequests.filter((r) => r.player.uuid !== uuid);
    const entry: FriendEntry = { player: req.player, presence: { state: 'online' }, addedAt: new Date().toISOString() };
    friends = [entry, ...friends];
    mock.emit('friend', 'PresenceChanged', { player: entry.player, presence: entry.presence });
    return { friend: entry };
  });
  mock.register('friend', 'DeclineRequest', (input) => {
    const { uuid } = input as { uuid: string };
    friendRequests = friendRequests.filter((r) => r.player.uuid !== uuid);
    return {};
  });
  mock.register('friend', 'SendRequest', (input) => {
    const { username } = input as { username: string };
    const name = username.trim();
    if (!name) throw new Error('no player by that name');
    if (name.toLowerCase() === fx.PROFILE.player.username.toLowerCase()) throw new Error('cannot add yourself');
    friendRequests = [...friendRequests, { player: { uuid: `u-${name.toLowerCase()}`, username: name }, at: new Date().toISOString() }];
    return {};
  });
  mock.register('friend', 'RemoveFriend', (input) => {
    const { uuid } = input as { uuid: string };
    friends = friends.filter((f) => f.player.uuid !== uuid);
    return {};
  });

  mock.register('chat', 'ListMessages', (input) => {
    const { uuid } = input as { uuid: string };
    return { messages: chatMessages.filter((m) => m.threadId === uuid).map((m) => ({ ...m })) };
  });
  mock.register('chat', 'SendMessage', (input) => {
    const { uuid, text } = input as { uuid: string; text: string };
    const message: ChatMessage = { id: `m${++chatSeq}`, threadId: uuid, from: 'self', text, at: new Date().toISOString() };
    chatMessages = [...chatMessages, message];
    mock.emit('chat', 'MessageReceived', { uuid, message });
    return { message };
  });

  mock.register('mod', 'ListMods', () => mods.map((m) => ({ ...m })));
  mock.register('mod', 'SetModEnabled', (input) => {
    const { id, enabled } = input as { id: string; enabled: boolean };
    mods = mods.map((m) => (m.id === id ? { ...m, enabled } : m));
    return { mod: mods.find((m) => m.id === id) };
  });
  mock.register('mod', 'GetModSettings', (input) => {
    const { id } = input as { id: string };
    return { settings: (modSettings[id] ?? []).map((s) => ({ ...s })) };
  });
  mock.register('mod', 'SetModSetting', (input) => {
    const { id, key, value } = input as { id: string; key: string; value: ModSettingValue };
    const list = modSettings[id];
    if (!list) throw new Error(`no settings for mod ${id}`);
    const i = list.findIndex((s) => s.key === key);
    if (i === -1) throw new Error(`no setting ${key} for mod ${id}`);
    list[i] = { ...list[i], value } as ModSetting;
    return { settings: list.map((s) => ({ ...s })) };
  });

  mock.register('cosmetic', 'ListCosmetics', () => cosmetics.map((c) => ({ ...c })));
  mock.register('cosmetic', 'GetPlayerCosmetics', () => ({ equipped: { ...equipped } }));
  mock.register('cosmetic', 'EquipCosmetic', (input) => {
    const { type, ids } = input as { type: CosmeticType; ids: string[] };
    equipped = { ...equipped, [type]: ids };
    mock.emit('cosmetic', 'PlayerCosmeticsChanged', { equipped: { ...equipped } });
    return { equipped: { ...equipped } };
  });
  const catalogInfo = new Map(fx.CATALOG.map((c) => [c.cosmetic.id, { blurb: c.blurb, featured: c.featured }]));
  mock.register('catalog', 'ListCatalog', () =>
    cosmetics.filter((c) => !c.owned).map((c) => ({ cosmetic: { ...c }, ...(catalogInfo.get(c.id) ?? { blurb: '' }) })),
  );
  mock.register('catalog', 'PurchaseCosmetic', (input) => {
    const { id } = input as { id: string };
    const c = cosmetics.find((x) => x.id === id);
    if (!c) throw new Error(`no cosmetic ${id}`);
    if (c.owned) throw new Error('already owned');
    if (c.priceCents == null) throw new Error('not for sale');
    cosmetics = cosmetics.map((x) => (x.id === id ? { ...x, owned: true, priceCents: undefined } : x));
    mock.emit('cosmetic', 'OwnedChanged', { id });
    return { cosmetic: { ...cosmetics.find((x) => x.id === id) } };
  });
  mock.register('catalog', 'ListBundles', () => []);
  mock.register('catalog', 'PurchaseBundle', () => {
    throw new Error('no bundles in mock');
  });

  let activeVersion: string | null = versions[0]?.id ?? null;
  let runningVersion: string | null = null;
  mock.register('game', 'ListVersions', () => ({
    versions: versions.map((v) => ({ ...v })),
    activeId: activeVersion,
  }));
  mock.register('game', 'SetActiveVersion', (input) => {
    activeVersion = (input as { id: string }).id;
    return {};
  });
  mock.register('game', 'InstallVersion', (input) => {
    const { id } = input as { id: string };
    versions = versions.map((v) => (v.id === id ? { ...v, installed: true } : v));
    /* Match the real server: install finishes via a push, not the response. */
    setTimeout(() => mock.emit('game', 'InstallFinished', { id, ok: true }), 10);
    return { started: true };
  });
  mock.register('game', 'SetVersionRam', (input) => {
    const { id, ramMb } = input as { id: string; ramMb: number };
    versions = versions.map((v) => (v.id === id ? { ...v, ramMb } : v));
    return { id, ramMb };
  });
  mock.register('game', 'JoinServer', (input) => ({ joined: (input as { address: string }).address }));
  mock.register('game', 'IpcState', () => ({ connected: false, info: null, telemetry: null }));
  mock.register('game', 'LaunchVersion', (input) => {
    const { id } = input as { id: string };
    runningVersion = id;
    versions = versions.map((v) => (v.id === id ? { ...v, lastPlayed: new Date().toISOString() } : v));
    mock.emit('game', 'StatusChanged', { id, state: 'launched', pid: 1 });
    return { pid: 1, version: id };
  });
  mock.register('game', 'StopGame', () => {
    runningVersion = null;
    return { stopped: true };
  });
  mock.register('game', 'LaunchState', () =>
    runningVersion ? { state: 'running', version: runningVersion, pid: 1, startedAt: Date.now() } : { state: 'idle' });

  mock.register('settings', 'GetSettings', () => ({ settings: { ...settings } }));
  mock.register('settings', 'SetSettings', (input) => {
    settings = { ...settings, ...(input as Partial<ClientSettings>) };
    try {
      storage?.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      /* in-memory only in this environment */
    }
    mock.emit('settings', 'SettingsChanged', { settings: { ...settings } });
    return { settings: { ...settings } };
  });

  /* Saved multiplayer servers + fake pings in mock mode. */
  const SERVERS_KEY = 'korvex.mock.servers';
  let savedServers: ServerEntry[] = (() => {
    try {
      return JSON.parse(storage?.getItem(SERVERS_KEY) ?? '[]') as ServerEntry[];
    } catch {
      return [];
    }
  })();
  const saveServers = () => {
    try {
      storage?.setItem(SERVERS_KEY, JSON.stringify(savedServers));
    } catch { /* in-memory only */ }
  };
  mock.register('server', 'ListServers', () => ({ servers: savedServers.map((s) => ({ ...s })) }));
  mock.register('server', 'AddServer', (input) => {
    const { address, name } = input as { address: string; name?: string };
    const entry: ServerEntry = { address, name: name || address, addedAt: new Date().toISOString() };
    savedServers = [...savedServers.filter((s) => s.address !== address), entry];
    saveServers();
    return { server: entry };
  });
  mock.register('server', 'RemoveServer', (input) => {
    const { address } = input as { address: string };
    savedServers = savedServers.filter((s) => s.address !== address);
    saveServers();
    return { removed: address };
  });
  mock.register('server', 'PingServer', (input) => {
    const { address } = input as { address: string };
    const fake = Math.random() < 0.85;
    return fake
      ? { online: true, motd: 'A Korvex test server', playersOnline: 12, playersMax: 100, version: '1.21.x', pingMs: 15 + Math.floor(Math.random() * 60), address }
      : { online: false, error: 'timeout', pingMs: 4000, address };
  });

  mock.register('update', 'Check', () => ({ channel: settings.channel, current: '0.1.0', update: false, feed: 'mock' }));

  /* Presence simulation: flips a random friend's presence and emits a push so the
     Social screen exercises live updates in dev. Skipped under tests (the
     interval would hold the process open); the real backend owns this signal. */
  if (import.meta.env.MODE !== 'test') {
    setInterval(() => {
      if (friends.length === 0) return;
      const i = Math.floor(Math.random() * friends.length);
      const states: PresenceState[] = ['ingame', 'online', 'away', 'offline'];
      const state = states[Math.floor(Math.random() * states.length)];
      const presence: Presence = state === 'ingame' ? { state, server: 'hypixel.net' } : { state };
      friends = friends.map((f, j) => (j === i ? { ...f, presence } : f));
      mock.emit('friend', 'PresenceChanged', { uuid: friends[i].player.uuid, presence });
    }, 45_000);
  }
}

/* ---- call-site helpers ---- */

const latency = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export const services = {
  auth: {
    startLogin: () => wsClient.call<undefined, PopupLoginInfo>('auth', 'StartLogin', undefined),
    pollLogin: (state: string) => wsClient.call<{ state: string }, LoginPoll>('auth', 'PollLogin', { state }),
    completeLogin: (state: string, code: string) =>
      wsClient.call<{ state: string; code: string }, Exclude<LoginPoll, { status: 'pending' }>>('auth', 'CompleteLogin', { state, code }),
    startDeviceLogin: () => wsClient.call<undefined, DeviceLoginInfo>('auth', 'StartDeviceLogin', undefined),
    pollDeviceLogin: (deviceCode: string) => wsClient.call<{ deviceCode: string }, LoginPoll>('auth', 'PollDeviceLogin', { deviceCode }),
    logout: () => wsClient.call<undefined, {}>('auth', 'Logout', undefined),
  },
  user: {
    getProfile: () => wsClient.call<undefined, UserProfile>('user', 'GetProfile', undefined),
    listNotifications: () => wsClient.call<undefined, NotificationItem[]>('user', 'ListNotifications', undefined),
    markRead: () => wsClient.call<undefined, { notifications: NotificationItem[] }>('user', 'MarkNotificationsRead', undefined),
    dismiss: (id: string) => wsClient.call<{ id: string }, { notifications: NotificationItem[] }>('user', 'DismissNotification', { id }),
  },
  friends: {
    list: () => wsClient.call<undefined, FriendEntry[]>('friend', 'ListFriends', undefined),
    listRequests: () => wsClient.call<undefined, FriendRequest[]>('friend', 'ListRequests', undefined),
    accept: (uuid: string) => wsClient.call<{ uuid: string }, { friend: FriendEntry }>('friend', 'AcceptRequest', { uuid }),
    decline: (uuid: string) => wsClient.call<{ uuid: string }, {}>('friend', 'DeclineRequest', { uuid }),
    remove: (uuid: string) => wsClient.call<{ uuid: string }, {}>('friend', 'RemoveFriend', { uuid }),
    sendRequest: (username: string) => wsClient.call<{ username: string }, {}>('friend', 'SendRequest', { username }),
  },
  chat: {
    list: (uuid: string) => wsClient.call<{ uuid: string }, { messages: ChatMessage[] }>('chat', 'ListMessages', { uuid }),
    send: (uuid: string, text: string) => wsClient.call<{ uuid: string; text: string }, { message: ChatMessage }>('chat', 'SendMessage', { uuid, text }),
  },
  mods: {
    list: () => wsClient.call<undefined, InstalledMod[]>('mod', 'ListMods', undefined),
    setEnabled: (id: string, enabled: boolean) =>
      wsClient.call<{ id: string; enabled: boolean }, { mod: InstalledMod }>('mod', 'SetModEnabled', { id, enabled }),
    getSettings: (id: string) => wsClient.call<{ id: string }, { settings: ModSetting[] }>('mod', 'GetModSettings', { id }),
    setSetting: (id: string, key: string, value: ModSettingValue) =>
      wsClient.call<{ id: string; key: string; value: ModSettingValue }, { settings: ModSetting[] }>(
        'mod',
        'SetModSetting',
        { id, key, value },
      ),
  },
  cosmetics: {
    list: () => wsClient.call<undefined, Cosmetic[]>('cosmetic', 'ListCosmetics', undefined),
    getEquipped: () => wsClient.call<undefined, PlayerCosmetics>('cosmetic', 'GetPlayerCosmetics', undefined),
    equip: (type: CosmeticType, ids: string[]) =>
      wsClient.call<{ type: CosmeticType; ids: string[] }, PlayerCosmetics>('cosmetic', 'EquipCosmetic', { type, ids }),
    catalog: () => wsClient.call<undefined, CatalogItem[]>('catalog', 'ListCatalog', undefined),
    bundles: () => wsClient.call<undefined, BundleItem[]>('catalog', 'ListBundles', undefined),
    purchase: (id: string) => wsClient.call<{ id: string }, { cosmetic: Cosmetic }>('catalog', 'PurchaseCosmetic', { id }),
    purchaseBundle: (id: string) => wsClient.call<{ id: string }, { granted: number }>('catalog', 'PurchaseBundle', { id }),
  },
  game: {
    listVersions: () => wsClient.call<undefined, GameVersionList>('game', 'ListVersions', undefined),
    setActive: (id: string) => wsClient.call<{ id: string }, Record<string, never>>('game', 'SetActiveVersion', { id }),
    install: (id: string) => wsClient.call<{ id: string }, { started: boolean; alreadyInstalling?: boolean }>('game', 'InstallVersion', { id }),
    /** Resolves when the server pushes game.InstallFinished for this version. */
    waitInstall: (id: string) => new Promise<void>((resolve, reject) => {
      installWaiters.set(id, { resolve, reject });
      setTimeout(() => {
        if (installWaiters.delete(id)) reject(new Error('install timed out'));
      }, 30 * 60 * 1000);
    }),
    setRam: (id: string, ramMb: number) =>
      wsClient.call<{ id: string; ramMb: number }, { id: string; ramMb: number }>('game', 'SetVersionRam', { id, ramMb }),
    launch: (id: string) => wsClient.call<{ id: string }, { pid: number; version: string; gameDir: string; modded?: boolean }>('game', 'LaunchVersion', { id }),
    stop: () => wsClient.call<undefined, { stopped: boolean }>('game', 'StopGame', undefined),
    state: () => wsClient.call<undefined, { state: 'idle' | 'running'; version?: string; pid?: number; startedAt?: number }>('game', 'LaunchState', undefined),
    /** Quick-join - a running modded game connects in place; with nothing
        running the server launches the last-played version with --server. */
    joinServer: (address: string) => wsClient.call<{ address: string }, { joined: string; launched?: string }>('game', 'JoinServer', { address }),
    /** Current mod IPC link state - connected flag + mod info + last telemetry. */
    ipcState: () => wsClient.call<undefined, GameIpcState>('game', 'IpcState', undefined),
  },
  settings: {
    get: () => wsClient.call<undefined, { settings: ClientSettings }>('settings', 'GetSettings', undefined),
    set: (patch: Partial<ClientSettings>) =>
      wsClient.call<Partial<ClientSettings>, { settings: ClientSettings }>('settings', 'SetSettings', patch),
  },
  servers: {
    list: () => wsClient.call<undefined, { servers: ServerEntry[] }>('server', 'ListServers', undefined),
    add: (address: string, name?: string) =>
      wsClient.call<{ address: string; name?: string }, { server: ServerEntry }>('server', 'AddServer', { address, name }),
    remove: (address: string) => wsClient.call<{ address: string }, { removed: string }>('server', 'RemoveServer', { address }),
    ping: (address: string) => wsClient.call<{ address: string }, ServerPing>('server', 'PingServer', { address }),
  },
  update: {
    check: () => wsClient.call<undefined, UpdateCheckResult>('update', 'Check', undefined),
  },
};
