import { useMemo } from 'react';
import { Crown, Package, Users } from 'lucide-react';
import { Badge, Skeleton } from '@korvex/ui';
import { ScreenFrame } from '../shell/ScreenFrame';
import { SkinPreview } from '../shell/SkinPreview';
import { assetUrl, services } from '../services';
import { useService } from '../hooks/useService';
import { bustUrl, CapeFaceImg } from '../components/CapeFaceImg';

/* Own-profile page - reachable via the account popover ("View profile").
   Stats row, 3D skin preview wearing the equipped cloak, and the equipped
   set underneath. Player cosmetics come from the same services the
   Cosmetics screen uses. */
export function ProfileScreen() {
  const { data: profile, loading } = useService(services.user.getProfile);
  const { data: equipped } = useService(services.cosmetics.getEquipped);
  const { data: cosmetics } = useService(services.cosmetics.list);

  const byId = useMemo(() => new Map((cosmetics ?? []).map((c) => [c.id, c])), [cosmetics]);
  const equippedItems = useMemo(
    () => Object.entries(equipped?.equipped ?? {}).flatMap(([type, ids]) =>
      ids.map((id) => ({ type, cosmetic: byId.get(id) })),
    ),
    [equipped, byId],
  );
  /* The cloak drives the cape layer on the 3D preview; the pet flies around it. */
  const cloakResource = byId.get(equipped?.equipped.cloak?.[0] ?? '')?.resource;
  const petResource = byId.get(equipped?.equipped.pet?.[0] ?? '')?.resource;

  if (loading || !profile) {
    return (
      <ScreenFrame title="Profile">
        <div className="flex flex-col gap-3 px-4 py-4">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      </ScreenFrame>
    );
  }

  return (
    <ScreenFrame title="Profile" meta={profile.plus ? 'Korvex+' : undefined}>
      <div className="flex flex-col gap-4 px-4 py-4">
        <div className="flex flex-wrap items-start gap-4">
          <SkinPreview
            uuid={profile.player.uuid}
            username={profile.player.username}
            pet={assetUrl(petResource)}
            cape={assetUrl(cloakResource)}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-title font-semibold text-fg">{profile.player.username}</h1>
                {profile.plus && (
                  <Badge tone="accent"><Crown className="mr-1 inline h-3 w-3" aria-hidden />Plus</Badge>
                )}
              </div>
              <p className="text-meta text-fg-tertiary">{profile.player.uuid}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Stat label="Friends" value={profile.friendsCount} icon={Users} />
              <Stat label="Cosmetics owned" value={profile.cosmeticsOwned} icon={Package} />
              <Stat label="Rank" value={profile.plus ? 'Plus' : 'Member'} icon={Crown} />
            </div>
          </div>
        </div>

        <section>
          <h2 className="pb-2 text-label font-semibold uppercase tracking-label text-fg-tertiary">Equipped</h2>
          {equippedItems.length === 0 ? (
            <p className="text-meta text-fg-tertiary">Nothing equipped - pick cosmetics on the Cosmetics screen.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {equippedItems.map(({ type, cosmetic }) => {
                const src = assetUrl(cosmetic?.resource);
                return (
                  <div key={`${type}-${cosmetic?.id ?? '?'}`} className="rounded-md border border-border-subtle bg-elevated p-3">
                    {src ? (
                      /* cape PNGs are 64x32 atlases - crop to the face art */
                      type === 'cloak' ? (
                        <CapeFaceImg src={bustUrl(src)} alt={cosmetic?.name ?? ''} w={40} h={62} />
                      ) : (
                        <img src={bustUrl(src)} alt={cosmetic?.name ?? ''} className="mb-2 h-10 w-10 rounded-md object-contain" />
                      )
                    ) : (
                      <div
                        className="mb-2 h-10 w-10 rounded-md"
                        style={{ background: cosmetic?.previewColor ?? 'var(--color-pressed)' }}
                      />
                    )}
                    <p className="truncate text-body font-medium text-fg">{cosmetic?.name ?? 'Unknown'}</p>
                    <p className="text-meta capitalize text-fg-tertiary">{type}</p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </ScreenFrame>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: number | string; icon: typeof Users }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border-subtle bg-elevated p-3">
      <Icon className="h-4 w-4 shrink-0 text-fg-tertiary" aria-hidden />
      <div className="min-w-0">
        <p className="text-body font-semibold text-fg">{value}</p>
        <p className="text-meta text-fg-tertiary">{label}</p>
      </div>
    </div>
  );
}
