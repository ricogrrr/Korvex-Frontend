import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '../lib/cn';
import { severityStyles } from '../lib/severity';
import { useMotion } from '../hooks/useMotion';
import { Icon } from './Icon';
import { Button, IconButton } from './Button';
import { useToastStore, type ToastItem } from './toast';

function ToastCard({ item }: { item: ToastItem }) {
  const dismiss = useToastStore((s) => s.dismiss);
  const { transition } = useMotion();
  const [paused, setPaused] = useState(false);
  const remaining = useRef(item.duration);
  const s = severityStyles[item.severity];

  // Auto-dismiss; hover/focus pauses the countdown and resumes with what's left.
  useEffect(() => {
    if (paused || item.duration <= 0) return;
    const startedAt = Date.now();
    const timer = setTimeout(() => dismiss(item.id), remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current -= Date.now() - startedAt;
    };
  }, [paused, item.id, item.duration, dismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={transition(200)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      role={item.severity === 'danger' ? 'alert' : 'status'}
      className="pointer-events-auto flex items-start gap-3 rounded-md border border-border bg-floating p-3 shadow-floating"
    >
      <Icon icon={s.icon} size={20} className={cn(s.text)} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-body font-medium text-fg">{item.title}</p>
        {item.description && <p className="text-meta text-fg-secondary">{item.description}</p>}
        {item.action && (
          <div className="pt-1">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                item.action?.onClick();
                dismiss(item.id);
              }}
            >
              {item.action.label}
            </Button>
          </div>
        )}
      </div>
      <IconButton label="Dismiss" icon={X} size="sm" onClick={() => dismiss(item.id)} />
    </motion.div>
  );
}

/** Mounted once by UIProvider. Bottom-right, clear of the frameless titlebar. */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div
      role="region"
      aria-label="Notifications"
      className="pointer-events-none fixed bottom-4 right-4 z-toast flex w-80 flex-col items-stretch gap-2"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <ToastCard key={t.id} item={t} />
        ))}
      </AnimatePresence>
    </div>
  );
}
