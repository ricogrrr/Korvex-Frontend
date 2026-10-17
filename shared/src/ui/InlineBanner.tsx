import type { ReactNode } from 'react';
import { cn } from '../lib/cn';
import { severityStyles, type Severity } from '../lib/severity';
import { Icon } from './Icon';
import { Button } from './Button';

export interface InlineBannerProps {
  severity: Severity;
  title: string;
  children?: ReactNode;
  action?: { label: string; onClick: () => void };
}

/** Inline error/notice. Replaces native dialogs everywhere. */
export function InlineBanner({ severity, title, children, action }: InlineBannerProps) {
  const s = severityStyles[severity];
  return (
    <div
      role={severity === 'danger' || severity === 'warn' ? 'alert' : 'status'}
      className={cn('flex items-start gap-3 rounded-md border p-3', s.bg, s.border)}
    >
      <Icon icon={s.icon} size={20} className={s.text} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-body font-medium text-fg">{title}</p>
        {children && <p className="text-meta text-fg-secondary">{children}</p>}
      </div>
      {action && (
        <Button variant="secondary" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
