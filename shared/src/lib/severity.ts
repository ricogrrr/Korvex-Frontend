import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from 'lucide-react';

export type Severity = 'info' | 'success' | 'warn' | 'danger';

/* Full class strings so Tailwind can see them. Purple is never a severity. */
export const severityStyles: Record<Severity, { icon: LucideIcon; text: string; bg: string; border: string }> = {
  info: { icon: Info, text: 'text-info', bg: 'bg-info-subtle', border: 'border-info' },
  success: { icon: CircleCheck, text: 'text-success', bg: 'bg-success-subtle', border: 'border-success' },
  warn: { icon: TriangleAlert, text: 'text-warn', bg: 'bg-warn-subtle', border: 'border-warn' },
  danger: { icon: CircleAlert, text: 'text-danger', bg: 'bg-danger-subtle', border: 'border-danger' },
};
