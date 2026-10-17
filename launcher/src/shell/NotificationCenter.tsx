import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CheckCheck, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn, EmptyState, Icon, IconButton, useMotion, severityStyles } from '@korvex/ui';
import { useWsPush } from '../hooks/useService';
import { services, type NotificationItem } from '../services';

/** Notification center in the rail - popover list, severity-tinted rows. */
export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { transition } = useMotion();

  const unread = items.filter((n) => !n.read).length;

  useEffect(() => {
    void services.user.listNotifications().then(setItems).catch(() => setItems([]));
    setLoaded(true);
  }, []);

  useWsPush((m) => {
    if (m.service === 'user' && m.method === 'NotificationsChanged') {
      setItems((m.input as { notifications: NotificationItem[] }).notifications);
    }
  });

  const markAllRead = () => void services.user.markRead().catch(() => setItems((s) => s.map((n) => ({ ...n, read: true }))));
  const dismiss = (id: string) => void services.user.dismiss(id).catch(() => setItems((s) => s.filter((n) => n.id !== id)));

  // Close on outside pointer or Esc (overlay pattern, same as menus).
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex h-ctl-lg w-full items-center justify-center rounded-md transition-colors duration-fast focus-ring',
          open ? 'bg-hover text-fg' : 'text-fg-secondary hover:bg-hover hover:text-fg',
        )}
      >
        <span className="relative">
          <Icon icon={Bell} size={20} />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-sm bg-accent" aria-hidden="true" />
          )}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Notifications"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={transition(150)}
            className="absolute bottom-0 left-full z-floating ml-2 w-80 overflow-hidden rounded-md border border-border bg-floating shadow-floating"
          >
            <header className="flex items-center justify-between border-b border-border-subtle px-3 py-2">
              <span className="text-label font-semibold uppercase tracking-label text-fg-tertiary">Notifications</span>
              <IconButton label="Mark all read" icon={CheckCheck} size="sm" disabled={unread === 0} onClick={markAllRead} />
            </header>
            <div className="overflow-y-auto" style={{ maxHeight: '20rem' }}>
              {items.length === 0 ? (
                loaded && <EmptyState icon={Bell} message="You're all caught up." />
              ) : (
                items.map((n) => (
                  <div key={n.id} className={cn('flex gap-3 border-b border-border-subtle px-3 py-2 last:border-b-0', n.read && 'opacity-60')}>
                    <Icon icon={severityStyles[n.severity].icon} size={20} className={severityStyles[n.severity].text} />
                    <div className="min-w-0 flex-1">
                      <p className="text-body font-medium text-fg">{n.title}</p>
                      {n.description && <p className="text-meta text-fg-secondary">{n.description}</p>}
                      <p className="font-mono text-label tabular-nums text-fg-tertiary">
                        {new Date(n.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <IconButton label={`Dismiss ${n.title}`} icon={X} size="sm" onClick={() => dismiss(n.id)} />
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
