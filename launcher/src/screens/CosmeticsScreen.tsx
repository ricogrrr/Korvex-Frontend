import { Check, Lock } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as skinview3d from 'skinview3d';
import { Badge, EmptyState, Icon, Skeleton, toast, cn } from '@korvex/ui';
import { ScreenFrame } from '../shell/ScreenFrame';
import { useService, useWsPush } from '../hooks/useService';
import { assetUrl, services, type Cosmetic, type CosmeticType } from '../services';
import { bustUrl, CapeFaceImg } from '../components/CapeFaceImg';
import { attachPetOrbit } from '../shell/petOrbit';

const TYPES: CosmeticType[] = ['cloak', 'hat', 'pet', 'body', 'emote', 'spray'];
const RARITY_TONE = { common: 'neutral', uncommon: 'info', rare: 'info', epic: 'accent', legendary: 'warn', limited: 'danger' } as const;

/** Skin texture through our /skin/:uuid proxy - sessionserver has no CORS. */
function skinUrl(uuid: string): string {
  return `http://localhost:8787/skin/${uuid.replaceAll('-', '')}`;
}

/** Real player preview - skinview3d renders the player's skin plus the
    equipped cloak texture, so the preview matches what the mod shows in-game. */
function SkinPreview({ uuid, equipped, cosmetics }: { uuid?: string; equipped: Partial<Record<CosmeticType, string[]>>; cosmetics: Cosmetic[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<skinview3d.SkinViewer | undefined>(undefined);
  const equippedCount = useMemo(() => Object.values(equipped).flat().length, [equipped]);

  /* last equipped cloak wins - same rule the game mod applies */
  const capeUrl = useMemo(() => {
    const ids = equipped['cloak'] ?? [];
    for (let i = ids.length - 1; i >= 0; i--) {
      const res = cosmetics.find((c) => c.id === ids[i])?.resource;
      if (res && (res.endsWith('.png') || res.endsWith('.jpg') || res.endsWith('.webp'))) {
        return bustUrl(assetUrl(res) ?? '');
      }
    }
    return undefined;
  }, [equipped, cosmetics]);

  /* last equipped pet wins - same rule as the cloak */
  const petUrl = useMemo(() => {
    const ids = equipped['pet'] ?? [];
    for (let i = ids.length - 1; i >= 0; i--) {
      const res = cosmetics.find((c) => c.id === ids[i])?.resource;
      if (res) return bustUrl(assetUrl(res) ?? '');
    }
    return undefined;
  }, [equipped, cosmetics]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !uuid) return;
    const viewer = new skinview3d.SkinViewer({ canvas, width: 240, height: 280, skin: skinUrl(uuid) });
    viewer.animation = new skinview3d.IdleAnimation();
    viewer.autoRotate = false; /* drag to rotate - auto-spin annoys users */
    viewer.playerObject.rotation.y = Math.PI * 0.8; /* start on the cape side */
    viewerRef.current = viewer;
    return () => {
      viewerRef.current = undefined;
      viewer.dispose();
    };
  }, [uuid]);

  useEffect(() => {
    const v = viewerRef.current;
    if (!v) return;
    if (capeUrl) void v.loadCape(capeUrl).catch(() => {}); else v.resetCape();
  }, [capeUrl, uuid]);

  /* pet sprite orbit - attach/detach when the equipped pet changes */
  useEffect(() => {
    const v = viewerRef.current;
    if (!v || !petUrl) return;
    return attachPetOrbit(v);
  }, [petUrl, uuid]);

  return (
    <div className="flex flex-col items-center gap-3">
      {uuid ? (
        <canvas ref={ref} width={240} height={280} className="rounded-md border border-border-subtle" />
      ) : (
        <div className="flex h-[280px] w-[240px] items-center justify-center rounded-md border border-border-subtle bg-elevated text-meta text-fg-tertiary">
          loading skin…
        </div>
      )}
      <span className="text-meta text-fg-tertiary">
        {equippedCount ? `${equippedCount} equipped` : 'nothing equipped'}
      </span>
    </div>
  );
}

export function CosmeticsScreen() {
  const { data: profile } = useService(() => services.user.getProfile(), []);
  const { data: allCosmetics, loading } = useService(() => services.cosmetics.list(), []);
  const { data: equippedData, reload } = useService(() => services.cosmetics.getEquipped(), []);
  const [type, setType] = useState<CosmeticType>('cloak');
  const [equipped, setEquipped] = useState(equippedData?.equipped ?? {});
  useEffect(() => {
    if (equippedData) setEquipped(equippedData.equipped);
  }, [equippedData]);
  useWsPush(() => reload(), [reload]);

  const list = (allCosmetics ?? []).filter((c) => c.type === type);

  const toggleEquip = async (c: Cosmetic) => {
    if (!c.owned) return;
    const ids = new Set(equipped[type] ?? []);
    if (ids.has(c.id)) {
      ids.delete(c.id);
    } else {
      /* cloaks are single-equip - a new pick replaces the current one */
      if (type === 'cloak') ids.clear();
      ids.add(c.id);
    }
    const next = { ...equipped, [type]: [...ids] };
    setEquipped(next);
    await services.cosmetics.equip(type, [...ids]);
    toast.success(ids.has(c.id) ? `${c.name} equipped` : `${c.name} removed`, { duration: 2000 });
  };

  return (
    <ScreenFrame title="Wardrobe" meta={`${(allCosmetics ?? []).filter((c) => c.owned).length} owned`}>
      <div className="flex h-full">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex gap-1 border-b border-border-subtle px-4 py-2" role="tablist" aria-label="Cosmetic types">
            {TYPES.map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={type === t}
                onClick={() => setType(t)}
                className={cn(
                  'rounded-sm px-2 py-1 text-meta font-medium capitalize transition-colors duration-fast focus-ring',
                  type === t ? 'bg-accent-subtle text-accent' : 'text-fg-secondary hover:bg-hover hover:text-fg',
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="grid gap-3 overflow-y-auto p-4" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))' }}>
            {loading ? (
              [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-64 w-full" />)
            ) : list.length === 0 ? (
              <div className="col-span-full"><EmptyState icon={Lock} message="No cosmetics in this category." /></div>
            ) : (
              list.map((c) => {
                const active = (equipped[type] ?? []).includes(c.id);
                const src = assetUrl(c.resource);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => void toggleEquip(c)}
                    aria-pressed={active}
                    className={cn(
                      'group flex flex-col overflow-hidden rounded-md border text-left transition-colors duration-fast focus-ring',
                      active ? 'border-accent bg-accent-subtle' : 'border-border bg-elevated hover:border-border-strong hover:bg-hover',
                      !c.owned && 'cursor-not-allowed opacity-50',
                    )}
                  >
                    {/* product shot - Lunar-style: large preview, slight 3D tilt */}
                    <div className="relative flex h-48 items-center justify-center bg-gradient-to-b from-elevated to-base">
                      {src ? (
                        c.type === 'cloak' ? (
                          /* cape PNGs are 64x32 atlases - CapeFaceImg crops to
                             the art's real bounds inside the face region */
                          <div style={{ transform: 'perspective(600px) rotateY(-14deg)' }} className="drop-shadow-xl transition-transform duration-normal group-hover:scale-105">
                            <CapeFaceImg src={bustUrl(src)} alt={c.name} w={100} h={160} />
                          </div>
                        ) : (
                          <img
                            src={bustUrl(src)}
                            alt={c.name}
                            className="h-24 w-24 object-contain drop-shadow-lg transition-transform duration-normal group-hover:scale-105"
                          />
                        )
                      ) : (
                        <span className="h-16 w-16 rounded-md" style={{ background: c.previewColor }} aria-hidden="true" />
                      )}
                      {active ? (
                        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-base">
                          <Icon icon={Check} className="h-3 w-3" />
                        </span>
                      ) : !c.owned && (
                        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-elevated text-fg-tertiary">
                          <Icon icon={Lock} className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                    {/* info row - name, rarity, price */}
                    <div className="flex flex-col gap-1.5 border-t border-border-subtle p-3">
                      <p className="text-body font-semibold text-fg">{c.name}</p>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Badge tone={RARITY_TONE[c.rarity]}>{c.rarity}</Badge>
                          {c.ownedSerial != null && <Badge tone="danger">#{c.ownedSerial}</Badge>}
                        </span>
                        <span className="text-meta text-fg-tertiary">
                          {(c.priceCents ?? 0) === 0 ? 'Free' : `€${((c.priceCents ?? 0) / 100).toFixed(2)}`}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
        <aside className="w-80 shrink-0 border-r border-border-subtle bg-base p-4">
          <h2 className="mb-4 text-label font-semibold uppercase tracking-label text-fg-tertiary">Preview</h2>
          <SkinPreview uuid={profile?.player.uuid} equipped={equipped} cosmetics={allCosmetics ?? []} />
        </aside>
      </div>
    </ScreenFrame>
  );
}
