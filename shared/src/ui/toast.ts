import { create } from 'zustand';
import type { Severity } from '../lib/severity';

export interface ToastItem {
  id: string;
  severity: Severity;
  title: string;
  description?: string;
  duration: number; // ms; 0 = sticky
  action?: { label: string; onClick: () => void };
}

type ToastInput = Omit<ToastItem, 'id' | 'duration'> & { duration?: number };

const DEFAULT_DURATION: Record<Severity, number> = { info: 4000, success: 4000, warn: 6000, danger: 8000 };
const MAX_VISIBLE = 4;
let seq = 0;

interface ToastState {
  toasts: ToastItem[];
  push: (input: ToastInput) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (input) => {
    const id = `toast-${++seq}`;
    const item: ToastItem = { ...input, id, duration: input.duration ?? DEFAULT_DURATION[input.severity] };
    set((s) => ({ toasts: [...s.toasts, item].slice(-MAX_VISIBLE) }));
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}));

type Opts = Omit<ToastInput, 'severity' | 'title'>;
const make = (severity: Severity) => (title: string, opts: Opts = {}) =>
  useToastStore.getState().push({ severity, title, ...opts });

/** The one toast API: toast.success('Profile saved'). */
export const toast = {
  info: make('info'),
  success: make('success'),
  warn: make('warn'),
  danger: make('danger'),
  dismiss: (id: string) => useToastStore.getState().dismiss(id),
};
