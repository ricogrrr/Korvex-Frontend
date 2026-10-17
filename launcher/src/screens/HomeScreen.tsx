import { Globe, Newspaper, Play, Square } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Dropdown, Icon, Skeleton, toast } from '@korvex/ui';
import { ScreenFrame } from '../shell/ScreenFrame';
import { useService, useWsPush } from '../hooks/useService';
import { onGameSession, services, type GameIpcState, type GameSession, type InstallProgress } from '../services';

export function HomeScreen() {
  const { data, loading, reload } = useService(() => services.game.listVersions(), []);
  const { data: launchState, reload: reloadState } = useService(() => services.game.state(), []);
  const versions = useMemo(() => data?.versions ?? [], [data]);
  const installed = useMemo(() => versions.filter((v) => v.installed), [versions]);
  const [selected, setSelected] = useState<string>();
  const [server, setServer] = useState('');
  const [progress, setProgress] = useState<InstallProgress>();
  const [busy, setBusy] = useState(false);
  const [running, setRunning] = useState(false);
  const [ipc, setIpc] = useState<GameIpcState>({ connected: false, info: null, telemetry: null });
  const [gameSession, setGameSession] = useState<GameSession | null>(null);

  const current = installed.find((v) => v.id === selected) ?? installed.find((v) => v.id === data?.activeId) ?? installed[0];

  /* Restore the persisted selection once the list lands. */
  useEffect(() => {
    if (!selected && data?.activeId) setSelected(data.activeId);
  }, [data, selected]);
  useEffect(() => {
    setRunning(launchState?.state === 'running');
  }, [launchState]);

  useWsPush((msg) => {
    if (msg.service !== 'game') return;
    if (msg.method === 'InstallProgress') {
      setProgress(msg.input as InstallProgress);
    } else if (msg.method === 'IpcState') {
      setIpc(msg.input as GameIpcState);
    } else if (msg.method === 'StatusChanged') {
      const s = msg.input as { id: string; state: string; code?: number };
      setRunning(s.state === 'launched');
      if (s.state === 'exited') {
        setBusy(false);
        toast.info('Game closed', { description: `exit code ${s.code ?? '?'}`, duration: 2500 });
        reload();
        reloadState();
      }
    }
  }, [reload, reloadState]);

  /* game.GameSession push - MinecraftIdentity proof result for the live game. */
  useEffect(() => onGameSession(setGameSession), []);

  const pickVersion = (id: string) => {
    setSelected(id);
    void services.game.setActive(id).catch(() => {});
  };

  const launch = async () => {
    if (!current || busy || running) return;
    setBusy(true);
    try {
      if (!current.installed) {
        toast.info(`Downloading ${current.name}…`, { duration: 3000 });
        await services.game.install(current.id);
        await services.game.waitInstall(current.id);
        reload();
      }
      toast.info('Launching', { description: current.name, duration: 2000 });
      await services.game.launch(current.id);
      setRunning(true);
      reloadState();
    } catch (e) {
      toast.danger('Launch failed', { description: e instanceof Error ? e.message : String(e), duration: 5000 });
      setBusy(false);
    }
  };

  const stop = async () => {
    await services.game.stop().catch(() => {});
    setRunning(false);
    setIpc({ connected: false, info: null, telemetry: null });
    reloadState();
  };

  /* Quick join - three cases:
     1. running + mod bus connected  → send launch.joinServer straight to game
     2. running, bus not up yet      → wait for IPC (mod still booting / vanilla)
     3. not running                  → launch first, wait for the bus, then join */
  const joinQuick = async () => {
    const address = server.trim();
    if (!address || busy) return;
    if (running && !ipc.connected) {
      toast.info('Game is still starting', { description: 'try again once the mod connects', duration: 3000 });
      return;
    }
    setBusy(true);
    try {
      if (!running) {
        if (!current) return;
        if (!current.installed) {
          toast.info(`Downloading ${current.name}…`, { duration: 3000 });
          await services.game.install(current.id);
          await services.game.waitInstall(current.id);
          reload();
        }
        toast.info('Launching', { description: current.name, duration: 2000 });
        const r = await services.game.launch(current.id);
        setRunning(true);
        reloadState();
        if (r.modded === false) {
          toast.info('Launched without the client mod - open Multiplayer to join', { duration: 4000 });
          return;
        }
      }
      /* Wait for the mod bus (≤90 s - client init is late in boot) then join. */
      const deadline = Date.now() + 90_000;
      for (;;) {
        const s = ipc.connected ? ipc : await services.game.ipcState();
        if (s.connected) {
          await services.game.joinServer(address);
          toast.success('Joining server', { description: address, duration: 3000 });
          break;
        }
        if (Date.now() > deadline) {
          toast.danger('Mod never came online - join from the Multiplayer menu', { duration: 5000 });
          break;
        }
        await new Promise((r) => setTimeout(r, 1500));
      }
    } catch (e) {
      toast.danger('Join failed', { description: e instanceof Error ? e.message : String(e), duration: 5000 });
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenFrame title="Play" meta="pick a version and go">
      <div className="flex h-full flex-col p-4">
        {loading ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-12 w-80" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <>
            {/* Play bar */}
            <div className="flex items-center gap-2">
              <div className="w-80">
                <Dropdown
                  value={current?.id ?? ''}
                  onValueChange={pickVersion}
                  options={installed.map((v) => ({
                    value: v.id,
                    label: v.name,
                    meta: v.mcVersion,
                    icon: Play,
                  }))}
                  aria-label="Select version"
                />
              </div>
              {running ? (
                <Button variant="danger" size="md" icon={Square} onClick={stop}>
                  Stop
                </Button>
              ) : (
                <Button variant="primary" size="md" icon={Play} onClick={launch} disabled={!current || busy}>
                  {busy ? (current?.installed ? 'Starting…' : 'Installing…') : 'Play'}
                </Button>
              )}
              {current?.lastPlayed && (
                <span className="text-meta text-fg-tertiary">
                  last played {new Date(current.lastPlayed).toLocaleDateString()}
                </span>
              )}
              {ipc.connected && (
                <span className="ml-auto">
                  <Badge tone="success">
                    mod connected{ipc.telemetry?.server ? ` · ${ipc.telemetry.server}` : ''}
                  </Badge>
                </span>
              )}
              {gameSession && (
                <Badge tone={gameSession.verified ? 'success' : 'warn'}>
                  {gameSession.verified ? `verified${gameSession.username ? ` · ${gameSession.username}` : ''}` : 'unverified game'}
                </Badge>
              )}
            </div>
            {!installed.length && (
              <p className="mt-2 text-meta text-fg-tertiary">
                No versions installed yet - grab one in the Versions tab.
              </p>
            )}

            {/* Install progress - pushed by the server while a version downloads */}
            {progress && progress.stage !== 'done' && (
              <div className="mt-3 w-80">
                <div className="flex items-center justify-between text-meta text-fg-tertiary">
                  <span>downloading {progress.stage}</span>
                  <span>{progress.total ? Math.round((progress.done / progress.total) * 100) : 0}%</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-elevated">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-300"
                    style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )}

            {/* Quick join */}
            <section className="mt-8 w-full max-w-lg">
              <h2 className="text-label font-semibold uppercase tracking-label text-fg-tertiary">Quick join</h2>
              <div className="mt-2 flex items-center gap-2">
                <div className="relative flex-1">
                  <Icon icon={Globe} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-tertiary" />
                  <input
                    type="text"
                    value={server}
                    onChange={(e) => setServer(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && void joinQuick()}
                    placeholder="server address, e.g. hypixel.net"
                    data-selectable
                    className="h-ctl-md w-full rounded-md border border-border bg-base pl-8 pr-3 text-body text-fg placeholder:text-fg-tertiary transition-colors duration-fast focus-ring hover:border-border-strong"
                  />
                </div>
                <Button variant="secondary" onClick={joinQuick} disabled={!server.trim() || busy}>
                  {running ? 'Join' : 'Launch & join'}
                </Button>
              </div>
              <p className="mt-2 text-meta text-fg-tertiary">
                {running
                  ? 'Sends the running game straight to the server.'
                  : 'Launches the selected version and connects on join.'}
              </p>
            </section>

            {/* News */}
            <section className="mt-auto w-full max-w-lg rounded-md border border-border-subtle bg-elevated p-4">
              <div className="flex items-center gap-2">
                <Icon icon={Newspaper} className="text-fg-tertiary" />
                <h2 className="text-body font-medium text-fg">Patch 0.9.3</h2>
                <Badge tone="accent">latest</Badge>
              </div>
              <ul className="mt-2 flex flex-col gap-1 text-meta text-fg-secondary">
                <li>Waypoints module - personal, server and death markers.</li>
                <li>Wardrobe canvas preview now live.</li>
                <li>HUD editor grid snap tuned to 8px.</li>
              </ul>
            </section>
          </>
        )}
      </div>
    </ScreenFrame>
  );
}
