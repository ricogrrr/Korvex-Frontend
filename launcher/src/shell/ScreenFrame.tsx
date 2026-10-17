import type { ReactNode } from 'react';

/** Uniform screen chrome: title row + scrollable content on the 4pt grid. */
export function ScreenFrame({ title, meta, actions, children }: { title: string; meta?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border-subtle px-4 py-3">
        <div className="flex min-w-0 items-baseline gap-2">
          <h1 className="text-xl font-semibold text-fg">{title}</h1>
          {meta && <span className="truncate text-meta text-fg-tertiary">{meta}</span>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
