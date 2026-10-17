import type { LucideIcon } from 'lucide-react';
import { Icon } from './Icon';
import { Button } from './Button';

export interface EmptyStateProps {
  icon: LucideIcon;
  message: string; // one line: why it's empty
  action?: { label: string; onClick: () => void; icon?: LucideIcon };
}

export function EmptyState({ icon, message, action }: EmptyStateProps) {
  return (
    <div className="flex h-full min-h-48 w-full flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-elevated text-fg-tertiary">
        <Icon icon={icon} size={24} />
      </div>
      <p className="text-body text-fg-secondary">{message}</p>
      {action && (
        <Button variant="secondary" size="sm" icon={action.icon} onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
