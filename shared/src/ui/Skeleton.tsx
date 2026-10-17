import { cn } from '../lib/cn';

/** Solid block with a slow opacity pulse. Compose to match the final layout. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('animate-skeleton rounded-md bg-pressed', className)} />;
}
