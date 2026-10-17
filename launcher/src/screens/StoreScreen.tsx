import { ShoppingBag, Star } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge, Button, EmptyState, Icon, Skeleton, toast, cn } from '@korvex/ui';
import { ScreenFrame } from '../shell/ScreenFrame';
import { useService } from '../hooks/useService';
import { assetUrl, services, type Bundle, type CatalogItem, type Cosmetic, type CosmeticType } from '../services';
import { bustUrl, CapeFaceImg } from '../components/CapeFaceImg';

const TABS: (CosmeticType | 'all' | 'featured' | 'bundles')[] = ['all', 'featured', 'bundles', 'cloak', 'hat', 'pet', 'body', 'emote', 'spray'];
const RARITY_TONE = { common: 'neutral', uncommon: 'info', rare: 'info', epic: 'accent', legendary: 'warn', limited: 'danger' } as const;

function price(cents?: number) {
  return cents == null ? '-' : `$${(cents / 100).toFixed(2)}`;
}

/** "ends in 3d" style countdown for limited cosmetics. */
function limitedCountdown(iso?: string) {
  if (!iso) return null;
  const ms = Date.parse(iso) - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return 'ended';
  const d = Math.floor(ms / 86400000), h = Math.floor((ms % 86400000) / 3600000);
  return d > 0 ? `ends in ${d}d ${h}h` : `ends in ${h}h`;
}

export function StoreScreen() {
  const { data, loading, reload } = useService(() => services.cosmetics.catalog(), []);
  const { data: bundleData, reload: reloadBundles } = useService(() => services.cosmetics.bundles(), []);
  const [tab, setTab] = useState<(typeof TABS)[number]>('all');
  const [buying, setBuying] = useState<string | null>(null);

  const buy = async (c: Cosmetic) => {
    setBuying(c.id);
    try {
      await services.cosmetics.purchase(c.id);
      toast.success(`${c.name} added to your wardrobe`);
      void reload();
    } catch {
      toast.danger('Purchase failed');
    } finally {
      setBuying(null);
    }
  };
  const buyBundle = async (b: Bundle) => {
    setBuying(b.id);
    try {
      const res = await services.cosmetics.purchaseBundle(b.id);
      toast.success(`${b.name} - ${res.granted} item${res.granted === 1 ? '' : 's'} added to your wardrobe`);
      void reload();
      void reloadBundles();
    } catch {
      toast.danger('Purchase failed');
    } finally {
      setBuying(null);
    }
  };

  const items = useMemo(() => {
    const list = data ?? [];
    if (tab === 'all') return list;
    if (tab === 'featured') return list.filter((i) => i.featured);
    if (tab === 'bundles') return [];
    return list.filter((i) => i.cosmetic.type === tab);
  }, [data, tab]);

  const bundles = useMemo(() => {
    const list = bundleData ?? [];
    if (tab === 'bundles' || tab === 'all') return list;
    if (tab === 'featured') return list.filter((b) => b.featured);
    return [];
  }, [bundleData, tab]);

  return (
    <ScreenFrame title="Store" meta={`${items.length} items`}>
      <div className="flex flex-col py-2">
        <div className="flex gap-1 border-b border-border-subtle px-4 pb-2" role="tablist" aria-label="Store categories">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn(
                'rounded-sm px-2 py-1 text-meta font-medium capitalize transition-colors duration-fast focus-ring',
                tab === t ? 'bg-accent-subtle text-accent' : 'text-fg-secondary hover:bg-hover hover:text-fg',
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="grid gap-3 p-4" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))' }}>
          {loading ? (
            [0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-40 w-full" />)
          ) : items.length === 0 && bundles.length === 0 ? (
            <div className="col-span-full"><EmptyState icon={ShoppingBag} message="Nothing in this category right now." /></div>
          ) : (
            <>
            {bundles.map(({ bundle: b, featured }) => (
              <article key={b.id} className="col-span-2 flex flex-col overflow-hidden rounded-md border border-border bg-elevated transition-colors duration-fast hover:border-border-strong">
                <div className="relative flex h-32 items-center justify-center gap-1 bg-base" aria-hidden="true">
                  {/* Item thumbs - first 3, cape-aware */}
                  {b.items.slice(0, 3).map((it, idx) =>
                    assetUrl(it.resource) ? (
                      it.type === 'cloak' ? (
                        <CapeFaceImg key={it.id} src={bustUrl(assetUrl(it.resource) ?? '')} alt={it.name} w={40} h={64} />
                      ) : (
                        <img key={it.id} src={bustUrl(assetUrl(it.resource) ?? '')} alt={it.name} className="h-12 w-12 rounded-md object-contain" style={{ transform: `rotate(${(idx - 1) * 8}deg)` }} />
                      )
                    ) : (
                      <span key={it.id} className="h-12 w-12 rounded-md border border-border-subtle" style={{ background: it.previewColor, transform: `rotate(${(idx - 1) * 8}deg)` }} />
                    ),
                  )}
                  {b.items.length > 3 && <span className="ml-1 text-xs text-fg-subtle">+{b.items.length - 3}</span>}
                  {featured && (
                    <span className="absolute left-2 top-2"><Badge tone="warn"><Icon icon={Star} size={16} className="mr-1" />featured</Badge></span>
                  )}
                  <span className="absolute right-2 top-2 flex gap-1">
                    {b.rarity && <Badge tone={RARITY_TONE[b.rarity]}>{b.rarity}</Badge>}
                    <Badge>{b.items.length} item{b.items.length === 1 ? '' : 's'}</Badge>
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-medium leading-tight">{b.name}</h3>
                    <span className="shrink-0 text-xs text-fg-subtle">{price(b.priceCents)}</span>
                  </div>
                  <p className="line-clamp-2 text-xs text-fg-subtle">{b.blurb ?? b.items.map((i) => i.name).join(', ')}</p>
                  <Button
                    size="sm"
                    disabled={buying === b.id || b.priceCents === undefined}
                    onClick={() => void buyBundle(b)}
                    className="mt-auto w-fit"
                  >
                    {buying === b.id ? 'Getting…' : 'Get bundle'}
                  </Button>
                </div>
              </article>
            ))}
            {items.map((item) => {
              const c = item.cosmetic;
              return (
                <article key={c.id} className="flex flex-col overflow-hidden rounded-md border border-border bg-elevated transition-colors duration-fast hover:border-border-strong">
                  <div className="relative flex h-32 items-center justify-center bg-base" aria-hidden="true">
                    {assetUrl(c.resource) ? (
                      c.type === 'cloak' ? (
                        /* cape PNGs are 64x32 atlases - show only the face art */
                        <CapeFaceImg src={bustUrl(assetUrl(c.resource) ?? '')} alt={c.name} w={64} h={100} />
                      ) : (
                        <img src={bustUrl(assetUrl(c.resource) ?? '')} alt={c.name} className="h-16 w-16 rounded-md object-contain" />
                      )
                    ) : (
                      <span className="h-12 w-12 rounded-md" style={{ background: c.previewColor }} />
                    )}
                    {item.featured && (
                      <span className="absolute left-2 top-2"><Badge tone="warn"><Icon icon={Star} size={16} className="mr-1" />featured</Badge></span>
                    )}
                    <span className="absolute right-2 top-2"><Badge>{c.type}</Badge></span>
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate text-body font-medium text-fg">{c.name}</h3>
                        <p className="text-meta text-fg-secondary">{item.blurb}</p>
                      </div>
                      <Badge tone={RARITY_TONE[c.rarity]}>{c.rarity}</Badge>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex flex-col">
                        <span className="font-mono text-ui tabular-nums text-fg">{price(c.priceCents)}</span>
                        {c.rarity === 'limited' && (
                          <span className="text-[11px] text-fg-subtle">
                            {c.soldCount ?? 0} sold{limitedCountdown(c.limitedUntil) ? ` · ${limitedCountdown(c.limitedUntil)}` : ''}
                          </span>
                        )}
                      </div>
                      <Button size="sm" variant="primary" disabled={buying === c.id} onClick={() => void buy(c)}>
                        {buying === c.id ? '…' : 'Get'}
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
            </>
          )}
        </div>
      </div>
    </ScreenFrame>
  );
}
