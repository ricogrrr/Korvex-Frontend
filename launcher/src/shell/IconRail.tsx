import { useState } from 'react';
import { cn, Tooltip, Icon } from '@korvex/ui';
import { SCREENS, type ScreenId } from './screens';
import { useI18n } from '../services/i18n';
import { NotificationCenter } from './NotificationCenter';
import { AccountCard } from './AccountCard';
import { useService } from '../hooks/useService';
import { services } from '../services';

function RailItem({ id, label, icon, active, onNavigate }: { id: ScreenId; label: string; icon: typeof SCREENS[number]['icon']; active: boolean; onNavigate: (id: ScreenId) => void }) {
  return (
    <Tooltip content={label} side="right">
      <button
        type="button"
        aria-label={label}
        aria-current={active ? 'page' : undefined}
        onClick={() => onNavigate(id)}
        className={cn(
          'relative flex h-ctl-lg w-full items-center justify-center rounded-md transition-colors duration-fast focus-ring',
          active ? 'bg-hover text-accent' : 'text-fg-secondary hover:bg-hover hover:text-fg',
        )}
      >
        {active && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-sm bg-accent" aria-hidden="true" />}
        <Icon icon={icon} size={20} />
      </button>
    </Tooltip>
  );
}

/** Left icon rail: nav + notifications + user card pinned to the bottom. */
export function IconRail({ active, onNavigate }: { active: ScreenId; onNavigate: (id: ScreenId) => void }) {
  const { data: profile } = useService(() => services.user.getProfile(), []);
  const { t } = useI18n();
  const [accountOpen, setAccountOpen] = useState(false);
  const initial = profile?.player.username.slice(0, 1).toUpperCase() ?? 'K';

  return (
    <nav aria-label="Primary" className="relative flex w-16 shrink-0 flex-col items-center gap-1 border-r border-border-subtle bg-base px-2 py-2">
      <div className="flex w-full flex-col gap-1" role="list">
        {SCREENS.map((s) => (
          <RailItem key={s.id} id={s.id} label={t(`nav.${s.id}`)} icon={s.icon} active={active === s.id} onNavigate={onNavigate} />
        ))}
      </div>

      <div className="mt-auto flex w-full flex-col items-center gap-1">
        <NotificationCenter />
        <Tooltip content={profile ? `${profile.player.username} - account` : 'Account'} side="right">
          <button
            type="button"
            aria-label="Account"
            aria-expanded={accountOpen}
            onClick={() => setAccountOpen((v) => !v)}
            className="flex h-ctl-lg w-full items-center justify-center rounded-md text-fg-secondary transition-colors duration-fast focus-ring hover:bg-hover hover:text-fg"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-subtle text-body font-semibold text-accent">
              {initial}
            </span>
          </button>
        </Tooltip>
        {accountOpen && profile && (
          <AccountCard username={profile.player.username} uuid={profile.player.uuid} onClose={() => setAccountOpen(false)} />
        )}
      </div>
    </nav>
  );
}
