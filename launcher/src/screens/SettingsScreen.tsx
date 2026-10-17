import { Settings2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ColorPicker, Dropdown, EmptyState, SearchField, Skeleton, Slider, Toggle, toast } from '@korvex/ui';
import { ScreenFrame } from '../shell/ScreenFrame';
import { services, type ClientSettings } from '../services';
import { signOut as signOutAccount } from '../services/accounts';
import { useService, useWsPush } from '../hooks/useService';

type ControlKind =
  | { kind: 'toggle'; value: boolean; onChange: (v: boolean) => void }
  | { kind: 'slider'; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void }
  | { kind: 'dropdown'; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }
  | { kind: 'color'; value: string; onChange: (v: string) => void }
  | { kind: 'text'; value: string; placeholder?: string; onChange: (v: string) => void }
  | { kind: 'action'; label: string; onClick: () => void };

interface SettingItem {
  id: string;
  label: string;
  description?: string;
  group: string;
  control: ControlKind;
}

function Row({ item }: { item: SettingItem }) {
  const c = item.control;
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border-subtle px-4 py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="text-body font-medium text-fg">{item.label}</p>
        {item.description && <p className="text-meta text-fg-tertiary">{item.description}</p>}
      </div>
      <div className="flex w-64 shrink-0 items-center justify-end">
        {c.kind === 'toggle' && <Toggle checked={c.value} onCheckedChange={c.onChange} aria-label={item.label} />}
        {c.kind === 'slider' && <Slider value={c.value} onValueChange={c.onChange} min={c.min} max={c.max} step={c.step} unit={c.unit} aria-label={item.label} />}
        {c.kind === 'dropdown' && <Dropdown value={c.value} onValueChange={c.onChange} options={c.options} aria-label={item.label} />}
        {c.kind === 'color' && <ColorPicker value={c.value} onChange={c.onChange} aria-label={item.label} />}
        {c.kind === 'text' && (
          <SearchField value={c.value} onChange={c.onChange} placeholder={c.placeholder} aria-label={item.label} />
        )}
        {c.kind === 'action' && (
          <button
            type="button"
            onClick={c.onClick}
            className="h-ctl-sm rounded-md border border-border bg-elevated px-3 text-meta font-medium text-fg transition-colors duration-fast focus-ring hover:border-border-strong hover:bg-hover"
          >
            {c.label}
          </button>
        )}
      </div>
    </div>
  );
}

export function SettingsScreen() {
  const [query, setQuery] = useState('');
  const { data, loading, reload } = useService(services.settings.get);
  const { data: profile } = useService(services.user.getProfile, []);
  const [vals, setVals] = useState<ClientSettings | undefined>(undefined);

  /* Multi-account-aware: drops the current account but keeps the others
     remembered, and switches to one when it exists. */
  const signOut = () => signOutAccount(() => services.auth.logout());

  // Hydrate local state from the service, and re-hydrate on push sync.
  useEffect(() => {
    if (data) setVals(data.settings);
  }, [data]);

  useWsPush(() => reload());

  // Debounce writes so sliders don't fire an RPC per pixel moved.
  const timers = useRef(new Map<keyof ClientSettings, ReturnType<typeof setTimeout>>());
  const set = <K extends keyof ClientSettings>(k: K, v: ClientSettings[K]) => {
    setVals((s) => (s ? { ...s, [k]: v } : s));
    clearTimeout(timers.current.get(k));
    timers.current.set(k, setTimeout(() => void services.settings.set({ [k]: v }), 350));
  };

  const groups = useMemo<Record<string, SettingItem[]>>(
    () => (!vals ? ({} as Record<string, SettingItem[]>) : {
      General: [
        { id: 'channel', label: 'Release channel', description: 'Which Korvex update line to follow.', group: 'General', control: { kind: 'dropdown', value: vals.channel, options: [{ value: 'stable', label: 'Stable' }, { value: 'beta', label: 'Beta' }], onChange: (v) => set('channel', v) } },
        { id: 'autoUpdate', label: 'Auto-update', description: 'Download and apply updates on launch.', group: 'General', control: { kind: 'toggle', value: vals.autoUpdate, onChange: (v) => set('autoUpdate', v) } },
        { id: 'telemetry', label: 'Usage telemetry', description: 'Anonymous module-usage stats.', group: 'General', control: { kind: 'toggle', value: vals.telemetry, onChange: (v) => set('telemetry', v) } },
        { id: 'gameDir', label: 'Game directory', description: 'Custom .minecraft-equivalent root (versions, libraries, saves). Leave empty for the default.', group: 'General', control: { kind: 'text', value: vals.gameDir, placeholder: 'C:\\Games\\minecraft', onChange: (v) => set('gameDir', v) } },
        { id: 'locale', label: 'Language', description: 'Launcher interface language.', group: 'General', control: { kind: 'dropdown', value: vals.locale, options: [{ value: 'en', label: 'English' }], onChange: (v) => set('locale', v) } },
      ],
      'In game': [
        { id: 'autoSprint', label: 'Auto sprint', description: 'Sprint without double-tapping W.', group: 'In game', control: { kind: 'toggle', value: vals.autoSprint, onChange: (v) => set('autoSprint', v) } },
        { id: 'showOwnName', label: 'Show own nametag', description: 'Render your own name above your head.', group: 'In game', control: { kind: 'toggle', value: vals.showOwnName, onChange: (v) => set('showOwnName', v) } },
      ],
      HUD: [
        { id: 'hudScale', label: 'HUD scale', description: 'Scale of HUD modules (independent of MC GUI scale).', group: 'HUD', control: { kind: 'slider', value: vals.hudScale, min: 50, max: 200, step: 5, unit: '%', onChange: (v) => set('hudScale', v) } },
        { id: 'hudBg', label: 'HUD backgrounds', description: 'Show the background plate behind modules.', group: 'HUD', control: { kind: 'toggle', value: vals.hudBg, onChange: (v) => set('hudBg', v) } },
        { id: 'accentColor', label: 'Accent colour', description: 'HUD accent used by Korvex modules.', group: 'HUD', control: { kind: 'color', value: vals.accentColor, onChange: (v) => set('accentColor', v) } },
      ],
      Accounts: [
        { id: 'account', label: profile ? `Signed in as ${profile.player.username}` : 'Signed in', description: profile?.player.uuid, group: 'Accounts', control: { kind: 'action', label: 'Sign out', onClick: signOut } },
      ],
      Updates: [
        { id: 'check', label: 'Check for updates', description: 'Query the update feed for the selected channel.', group: 'Updates', control: { kind: 'action', label: 'Check now', onClick: () => {
          void services.update.check().then((r) => {
            if (r.update) {
              toast.success(`Update available: ${r.version}`, { description: r.notes ?? `Channel: ${r.channel}`, duration: 5000 });
            } else {
              toast.success('Up to date', { description: `Korvex ${r.current} on ${r.channel} is the latest.`, duration: 2500 });
            }
          }).catch((e: unknown) => toast.warn('Update check failed', { description: e instanceof Error ? e.message : String(e), duration: 4000 }));
        } } },
      ],
    }),
    [vals],
  );

  const flat = useMemo(() => Object.values(groups).flat(), [groups]);
  const filtered = useMemo(
    () => flat.filter((i) => (i.label + ' ' + (i.description ?? '')).toLowerCase().includes(query.toLowerCase())),
    [flat, query],
  );
  const filteredGroups = useMemo(() => {
    const out = new Map<string, SettingItem[]>();
    for (const item of filtered) {
      out.set(item.group, [...(out.get(item.group) ?? []), item]);
    }
    return [...out.entries()];
  }, [filtered]);

  return (
    <ScreenFrame
      title="Settings"
      meta={query ? `${filtered.length} match${filtered.length === 1 ? '' : 'es'}` : undefined}
      actions={<SearchField value={query} onChange={setQuery} placeholder="Search settings" className="w-64" />}
    >
      <div className="py-2">
        {!vals || loading ? (
          <div className="flex flex-col gap-2 px-4 py-2">
            {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : filteredGroups.length === 0 ? (
          <EmptyState icon={Settings2} message={`No settings matching "${query}".`} />
        ) : (
          filteredGroups.map(([group, items]) => (
            <section key={group}>
              <h2 className="px-4 pb-1 pt-4 text-label font-semibold uppercase tracking-label text-fg-tertiary">{group}</h2>
              {items.map((item) => <Row key={item.id} item={item} />)}
            </section>
          ))
        )}
      </div>
    </ScreenFrame>
  );
}
