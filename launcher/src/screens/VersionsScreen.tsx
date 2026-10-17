import { ChevronDown, ChevronRight, Download, FolderOpen, MemoryStick, Play, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge, Button, Icon, Skeleton, Slider, toast } from '@korvex/ui';
import { ScreenFrame } from '../shell/ScreenFrame';
import { useService, useWsPush } from '../hooks/useService';
import { services, type GameVersion } from '../services';

function VersionRow({ v, onChanged, onPatch }: { v: GameVersion; onChanged: (v: GameVersion) => void; onPatch: (patch: Partial<GameVersion>) => void }) {
  const [busy, setBusy] = useState<'install' | 'launch' | null>(null);
  const [ram, setRam] = useState(v.ramMb);

  const install = async () => {
    setBusy('install');
    try {
      await services.game.install(v.id);
      await services.game.waitInstall(v.id);
      onPatch({ installed: true });
      toast.success(`${v.name} installed`, { duration: 2500 });
    } catch (e) {
      toast.danger('Install failed', { description: e instanceof Error ? e.message : String(e), duration: 5000 });
    }
    setBusy(null);
  };

  const play = async () => {
    setBusy('launch');
    try {
      await services.game.launch(v.id);
      toast.success(`${v.name} started`, { duration: 2500 });
    } catch (e) {
      toast.danger('Launch failed', { description: e instanceof Error ? e.message : String(e), duration: 5000 });
    }
    setBusy(null);
  };

  const saveRam = async (next: number) => {
    setRam(next);
    await services.game.setRam(v.id, next);
    onPatch({ ramMb: next });
  };

  return (
    <div className="flex items-center gap-4 border-b border-border-subtle px-4 py-3 last:border-b-0">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-elevated text-fg-secondary">
        <Icon icon={MemoryStick} size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-body font-medium text-fg">{v.name}</span>
          <Badge mono>{v.mcVersion}</Badge>
          {!v.installed && <Badge tone="warn">not installed</Badge>}
        </div>
        <div className="mt-1 flex items-center gap-3 text-meta text-fg-tertiary">
          <span className="flex items-center gap-1 font-mono"><FolderOpen size={16} strokeWidth={1.5} />{v.gameDir}</span>
          {v.lastPlayed && <span>last played {new Date(v.lastPlayed).toLocaleDateString()}</span>}
        </div>
      </div>
      <div className="flex w-48 items-center gap-2">
        <span className="text-label font-semibold uppercase tracking-label text-fg-tertiary">RAM</span>
        <Slider value={ram} onValueChange={(n) => setRam(n)} min={1024} max={12288} step={512} unit=" MB" aria-label={`RAM for ${v.name}`} />
      </div>
      {ram !== v.ramMb ? (
        <Button size="sm" variant="secondary" onClick={() => void saveRam(ram)}>Apply</Button>
      ) : !v.installed ? (
        <Button size="sm" variant="secondary" icon={Download} onClick={install} disabled={busy !== null}>
          {busy === 'install' ? 'Installing…' : 'Install'}
        </Button>
      ) : (
        <div className="flex items-center gap-2">
          <Badge tone="success">ready</Badge>
          <Button size="sm" variant="primary" icon={Play} onClick={play} disabled={busy !== null}>
            {busy === 'launch' ? 'Starting…' : 'Play'}
          </Button>
        </div>
      )}
    </div>
  );
}

/* Lunar groups versions by family (1.8.x, 1.21.x, 26.x) - same here: one
   collapsible section per minor, newest first, installed count badge. */
function familyOf(id: string): string {
  const m = /^(\d+)\.(\d+)/.exec(id);
  return m ? `${m[1]}.${m[2]}` : 'other';
}

export function VersionsScreen() {
  const { data, loading, reload } = useService(() => services.game.listVersions(), []);
  const [versions, setVersions] = useState<GameVersion[]>();
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useWsPush((msg) => {
    if (msg.service === 'game' && msg.method === 'InstallFinished') reload();
  }, [reload]);

  const list = versions ?? data?.versions ?? [];

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q ? list.filter((v) => v.id.toLowerCase().includes(q) || v.name.toLowerCase().includes(q)) : list;
    const byFamily = new Map<string, GameVersion[]>();
    for (const v of filtered) {
      const f = familyOf(v.id);
      if (!byFamily.has(f)) byFamily.set(f, []);
      byFamily.get(f)!.push(v);
    }
    return [...byFamily.entries()];
  }, [list, query]);

  const patchRow = (id: string, patch: Partial<GameVersion>) =>
    setVersions((prev) => (prev ?? list).map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const toggle = (f: string) => setCollapsed((c) => ({ ...c, [f]: !c[f] }));

  return (
    <ScreenFrame title="Versions" meta={`${list.length} releases · 1.7 → latest`}>
      <div className="py-2">
        {loading ? (
          <div className="flex flex-col gap-2 p-4">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : (
          <>
            {/* Search - the full 1.7→latest list is 100+ rows */}
            <div className="relative mx-4 mb-3 w-72">
              <Icon icon={Search} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-tertiary" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="filter versions…"
                data-selectable
                className="h-ctl-sm w-full rounded-md border border-border bg-base pl-8 pr-3 text-body text-fg placeholder:text-fg-tertiary transition-colors duration-fast focus-ring hover:border-border-strong"
              />
            </div>

            {groups.map(([family, members], gi) => {
              const installedCount = members.filter((v) => v.installed).length;
              const closed = collapsed[family] ?? gi > 0;
              return (
                <section key={family} className="mb-1">
                  <button
                    type="button"
                    onClick={() => toggle(family)}
                    className="flex w-full items-center gap-2 border-b border-border-subtle px-4 py-2 text-left transition-colors duration-fast hover:bg-elevated"
                  >
                    <Icon icon={closed ? ChevronRight : ChevronDown} size={16} className="text-fg-tertiary" />
                    <span className="text-label font-semibold uppercase tracking-label text-fg">
                      {family === 'other' ? 'Other' : `Minecraft ${family}.x`}
                    </span>
                    <span className="text-meta text-fg-tertiary">{members.length} release{members.length !== 1 ? 's' : ''}</span>
                    {installedCount > 0 && <Badge tone="success">{installedCount} installed</Badge>}
                  </button>
                  {!closed && members.map((v) => (
                    <VersionRow
                      key={v.id}
                      v={v}
                      onChanged={(next) => patchRow(next.id, next)}
                      onPatch={(patch) => patchRow(v.id, patch)}
                    />
                  ))}
                </section>
              );
            })}
          </>
        )}
      </div>
    </ScreenFrame>
  );
}
