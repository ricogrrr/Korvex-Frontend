import type { ReactNode } from 'react';
import { TooltipProvider } from './Tooltip';
import { Toaster } from './Toaster';

export function UIProvider({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      {children}
      <Toaster />
    </TooltipProvider>
  );
}
