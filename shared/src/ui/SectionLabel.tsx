import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

/** 11px uppercase section header. The only place uppercase is used. */
export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={cn('text-label font-medium uppercase tracking-label text-fg-tertiary', className)}>{children}</h3>;
}
