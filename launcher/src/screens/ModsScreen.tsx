import { AnimatePresence, motion } from 'framer-motion';
import { Settings2, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Badge, ColorPicker, Dropdown, EmptyState, IconButton, SearchField, Skeleton,
  Slider, Toggle, cn, toast, useMotion,
} from '@korvex/ui';
import { ScreenFrame } from '../shell/ScreenFrame';
import { useService } from '../hooks/useService';
import { services, type InstalledMod, type ModCategory, type ModSetting, type ModSettingValue } from '../services';

const CATEGORIES: (ModCategory | 'all')[] = ['all', 'hud', 'combat', 'motion', 'world', 'chat', 'performance', 'cosmetics'];

function ModRow({
  mod,
  onToggle,
  onSettings,
}: {
  mod: InstalledMod;
  onToggle: (id: string, enabled: boolean) => void;
  onSettings: (mod: InstalledMod) => void;
}) {
  const [busy, setBusy] = useState(false);
  const flip = async (next: boolean) => {
    setBusy(true);
    await onToggle(mod.id, next);
    setBusy(false);
  };
  return (
    <div className={cn('flex items-center gap-3 border-b border-border-subtle px-4 py-3 last:border-b-0 transition-colors duration-fast hover:bg-hover', !mod.enabled && 'opacity-60')}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-body font-medium text-fg">{mod.name}</span>
          <Badge mono>{mod.version}</Badge>
          <Badge>{mod.category}</Badge>
        </div>
        <p className="mt-1 truncate text-meta text-fg-secondary">{mod.description}</p>
      </div>
      {mod.hasSettings && <IconButton label={`${mod.name} settings`} icon={Settings2} size="sm" onClick={() => onSettings(mod)} />}
      <Toggle checked={mod.enabled} onCheckedChange={(v) => void flip(v)} disabled={busy} aria-label={`Enable ${mod.name}`} />
    </div>
  );
}

function SettingRow({ setting, onChange }: { setting: ModSetting; onChange: (key: string, value: ModSettingValue, debounce?: boolean) => void }) {
  const control = () => {
    switch (setting.kind) {
      case 'toggle':
        return <Toggle checked={setting.value} onCheckedChange={(v) => onChange(setting.key, v)} aria-label={setting.label} />;
      case 'dropdown':
        return <Dropdown value={setting.value} options={setting.options} onValueChange={(v) => onChange(setting.key, v)} aria-label={setting.label} size="sm" />;
      case 'color':
        return <ColorPicker value={setting.value} onChange={(v) => onChange(setting.key, v, true)} aria-label={setting.label} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-2 border-b border-border-subtle px-4 py-3 last:border-b-0">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-body font-medium text-fg">{setting.label}</p>
          {setting.description && <p className="text-meta text-fg-secondary">{setting.description}</p>}
        </div>
        {control()}
      </div>
      {setting.kind === 'slider' && (
        <Slider
          value={setting.value}
          min={setting.min}
          max={setting.max}
          step={setting.step}
          unit={setting.unit}
          onValueChange={(v) => onChange(setting.key, v, true)}
          aria-label={setting.label}
        />
      )}
    </div>
  );
}

function ModSettingsPanel({ mod, onClose }: { mod: InstalledMod; onClose: () => void }) {
  const { data, loading } = useService(() => services.mods.getSettings(mod.id), [mod.id]);
  const [settings, setSettings] = useState<ModSetting[]>();
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    if (data) setSettings(data.settings);
  }, [data]);

  const set = (key: string, value: ModSettingValue, debounce = false) => {
    setSettings((prev) => prev?.map((s) => (s.key === key ? { ...s, value } as ModSetting : s)));
    const write = () => {
      void services.mods.setSetting(mod.id, key, value).catch(() => toast.danger('Failed to save setting'));
    };
    if (!debounce) return write();
    clearTimeout(timers.current.get(key));
    timers.current.set(key, setTimeout(write, 300));
  };

  return (
    <div className="flex h-full w-80 flex-col" role="complementary" aria-label={`${mod.name} settings`}>
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border-subtle px-4 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-body font-semibold text-fg">{mod.name}</h2>
          <p className="text-meta text-fg-tertiary">Module settings</p>
        </div>
        <IconButton label="Close settings" icon={X} size="sm" onClick={onClose} />
      </header>
      <div className="flex-1 overflow-y-auto">
        {loading || !settings ? (
          <div className="flex flex-col gap-2 p-4">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : settings.length === 0 ? (
          <EmptyState icon={Settings2} message="This mod has no configurable options." />
        ) : (
          settings.map((s) => <SettingRow key={s.key} setting={s} onChange={set} />)
        )}
      </div>
    </div>
  );
}

export function ModsScreen() {
  const { data, loading } = useService(() => services.mods.list(), []);
  const [mods, setMods] = useState<InstalledMod[]>();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('all');
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const { transition } = useMotion();

  const list = mods ?? data ?? [];
  const enabledCount = list.filter((m) => m.enabled).length;

  const openMod = settingsId ? list.find((m) => m.id === settingsId) : undefined;

  const filtered = useMemo(
    () =>
      list.filter(
        (m) =>
          (category === 'all' || m.category === category) &&
          (m.name.toLowerCase().includes(query.toLowerCase()) || m.description.toLowerCase().includes(query.toLowerCase())),
      ),
    [list, category, query],
  );

  const toggle = async (id: string, enabled: boolean) => {
    const { mod } = await services.mods.setEnabled(id, enabled);
    setMods((prev) => (prev ?? list).map((m) => (m.id === mod.id ? mod : m)));
  };

  return (
    <ScreenFrame
      title="Mods"
      meta={`${enabledCount} of ${list.length} enabled`}
      actions={<SearchField value={query} onChange={setQuery} placeholder="Search mods" className="w-64" />}
    >
      <div className="flex h-full min-h-0">
        <div className="min-w-0 flex-1 overflow-y-auto">
          <div className="flex flex-col py-2">
            <div className="flex gap-1 border-b border-border-subtle px-4 pb-2" role="tablist" aria-label="Mod categories">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={category === c}
              onClick={() => setCategory(c)}
              className={cn(
                'rounded-sm px-2 py-1 text-meta font-medium capitalize transition-colors duration-fast focus-ring',
                category === c ? 'bg-accent-subtle text-accent' : 'text-fg-secondary hover:bg-hover hover:text-fg',
              )}
            >
              {c}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="flex flex-col gap-2 p-4">
            {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Settings2} message={query ? `No mods matching "${query}".` : 'No mods in this category.'} />
        ) : (
          filtered.map((m) => <ModRow key={m.id} mod={m} onToggle={toggle} onSettings={(x) => setSettingsId(x.id)} />)
        )}
          </div>
        </div>
      <AnimatePresence initial={false}>
        {openMod && (
          <motion.div
            key={openMod.id}
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: '20rem', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={transition(200)}
            className="shrink-0 overflow-hidden border-l border-border-subtle"
          >
            <ModSettingsPanel mod={openMod} onClose={() => setSettingsId(null)} />
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </ScreenFrame>
  );
}
