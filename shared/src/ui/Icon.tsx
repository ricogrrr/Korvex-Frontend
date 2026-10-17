import type { LucideIcon } from 'lucide-react';
import { cn } from '../lib/cn';

export type IconSize = 16 | 20 | 24;

/** The only way icons are rendered: fixed stroke 1.5, sizes 16/20/24. */
export function Icon({ icon: Glyph, size = 16, className }: { icon: LucideIcon; size?: IconSize; className?: string }) {
  return <Glyph size={size} strokeWidth={1.5} className={cn('shrink-0', className)} aria-hidden="true" />;
}
