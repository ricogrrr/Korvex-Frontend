import * as T from '@radix-ui/react-tooltip';
import type { ReactNode } from 'react';

export const TooltipProvider = ({ children }: { children: ReactNode }) => (
  <T.Provider delayDuration={400} skipDelayDuration={150}>{children}</T.Provider>
);

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  shortcut?: string;
}

export function Tooltip({ content, children, side = 'top', shortcut }: TooltipProps) {
  return (
    <T.Root>
      <T.Trigger asChild>{children}</T.Trigger>
      <T.Portal>
        <T.Content
          side={side}
          sideOffset={8}
          className="z-floating flex items-center gap-2 rounded-sm border border-border bg-floating px-2 py-1 text-meta text-fg shadow-floating"
        >
          {content}
          {shortcut && <span className="font-mono text-label text-fg-tertiary">{shortcut}</span>}
        </T.Content>
      </T.Portal>
    </T.Root>
  );
}
