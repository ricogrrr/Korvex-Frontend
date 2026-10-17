import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warn' | 'danger' | 'info';

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-pressed text-fg-secondary',
  accent: 'bg-accent-subtle text-accent',
  success: 'bg-success-subtle text-success',
  warn: 'bg-warn-subtle text-warn',
  danger: 'bg-danger-subtle text-danger',
  info: 'bg-info-subtle text-info',
};

/** `mono` for version strings, sizes, ping. `accent` is for selected/current only. */
export function Badge({ tone = 'neutral', mono, children }: { tone?: BadgeTone; mono?: boolean; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex h-4 items-center rounded-sm px-2 text-label font-medium',
        tones[tone],
        mono && 'font-mono tabular-nums',
      )}
    >
      {children}
    </span>
  );
}
