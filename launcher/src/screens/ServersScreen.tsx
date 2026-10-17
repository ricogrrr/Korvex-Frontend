import { useCallback, useEffect, useState } from 'react';
import { Play, Plus, RefreshCw, Server as ServerIcon, Trash2 } from 'lucide-react';
import { Badge, Button, EmptyState, SearchField, Skeleton, toast } from '@korvex/ui';
import { ScreenFrame } from '../shell/ScreenFrame';
import { services, type ServerEntry, type ServerPing } from '../services';
import { useService } from '../hooks/useService';

/* Saved multiplayer servers - the backend owns the list and runs the SLP
   ping (status handshake), so this works for vanilla launches too; the
   Join button quick-joins a running modded game via the IPC bus. */
export function ServersScreen() {
  const { data, loading, reload } = useService(services.servers.list);
  const [pings, setPings] = useState<Record<string, ServerPing | 'loading'>>({});
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [adding, setAdding] = useState(false);

  const pingAll = useCallback(async (servers: ServerEntry[]) => {
    for (const s of servers) {
      setPings((p) => ({ ...p, [s.address]: 'loading' }));
      try {
        const r = await services.servers.ping(s.address);
        setPings((p) => ({ ...p, [s.address]: r }));
      } catch (e) {
        setPings((p) => ({ ...p, [s.address]: { online: false, pingMs: 0, error: e instanceof Error ? e.message : String(e) } }));
      }
    }
  }, []);

  const servers = data?.servers ?? [];
  useEffect(() => {
    void pingAll(servers);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ping once per list change, not per ping result
  }, [data]);

  const add = async () => {
    if (!address.trim()) return;
    setAdding(true);
    try {
      await services.servers.add(address.trim(), name.trim() || undefined);
      setName('');
      setAddress('');
      reload();
    } catch (e) {
      toast.warn('Could not add server', { description: e instanceof Error ? e.message : String(e) });
    } finally {
      setAdding(false);
    }
  };

  const join = (a: string) =>
    void services.game
      .joinServer(a)
      .then((r) =>
        toast.success(r?.launched ? `Launching ${r.launched}` : 'Joining server', { description: a }),
      )
      .catch((e) => toast.warn('Join failed', { description: e instanceof Error ? e.message : String(e) }));

  const remove = (a: string) => void services.servers.remove(a).then(reload);

  return (
    <ScreenFrame
      title="Servers"
      meta={`${servers.length} saved`}
      actions={
        <Button variant="ghost" size="sm" onClick={() => void pingAll(servers)} aria-label="Refresh pings">
          <RefreshCw className="h-4 w-4" aria-hidden />
        </Button>
      }
    >
      <div className="flex flex-col gap-3 px-4 py-4">
        <div className="flex gap-2">
          <SearchField value={name} onChange={setName} placeholder="Server name" className="w-40" />
          <SearchField value={address} onChange={setAddress} placeholder="play.example.net or host:port" className="flex-1" />
          <Button variant="primary" size="sm" onClick={() => void add()} disabled={adding || !address.trim()}>
            <Plus className="h-4 w-4" aria-hidden />
            Add
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : servers.length === 0 ? (
          <EmptyState icon={ServerIcon} message="No servers saved yet - add one above." />
        ) : (
          <div className="flex flex-col gap-2">
            {servers.map((s) => <ServerRow key={s.address} entry={s} ping={pings[s.address]} onJoin={join} onRemove={remove} />)}
          </div>
        )}
      </div>
    </ScreenFrame>
  );
}

function ServerRow({
  entry,
  ping,
  onJoin,
  onRemove,
}: {
  entry: ServerEntry;
  ping?: ServerPing | 'loading';
  onJoin: (a: string) => void;
  onRemove: (a: string) => void;
}) {
  const p = ping && ping !== 'loading' ? ping : undefined;
  return (
    <div className="flex items-center gap-3 rounded-md border border-border-subtle bg-elevated px-3 py-2.5">
      {p?.favicon ? (
        <img src={p.favicon} alt="" className="h-10 w-10 shrink-0 rounded-sm" />
      ) : (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-pressed">
          <ServerIcon className="h-5 w-5 text-fg-tertiary" aria-hidden />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-body font-medium text-fg">{entry.name}</p>
          {p?.online ? (
            <Badge tone="success" mono>{p.pingMs}ms</Badge>
          ) : ping === 'loading' ? (
            <Badge tone="neutral">…</Badge>
          ) : (
            <Badge tone="danger">offline</Badge>
          )}
        </div>
        <p className="truncate text-meta text-fg-tertiary">
          {p?.online
            ? `${p.playersOnline ?? '?'}/${p.playersMax ?? '?'} - ${stripMotd(p.motd) || p.version || entry.address}`
            : p?.error ?? entry.address}
        </p>
      </div>
      <Button variant="ghost" size="sm" onClick={() => onJoin(entry.address)} aria-label={`Join ${entry.name}`}>
        <Play className="h-4 w-4" aria-hidden />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onRemove(entry.address)} aria-label={`Remove ${entry.name}`}>
        <Trash2 className="h-4 w-4 text-fg-tertiary" aria-hidden />
      </Button>
    </div>
  );
}

/* MOTD can be a JSON chat tree - collapse to plain text for the row. */
function stripMotd(motd: unknown): string {
  if (!motd) return '';
  if (typeof motd === 'string') return motd.replace(/§[0-9a-fk-or]/gi, '').trim();
  if (typeof motd === 'object') {
    const m = motd as { text?: string; extra?: unknown[] };
    return [m.text ?? '', ...(m.extra ?? []).map(stripMotd)].join('').trim();
  }
  return '';
}
