import { useEffect, useState } from 'react';
import { Copy, Minus, Square, X, type LucideIcon } from 'lucide-react';
import { cn, Icon, Tooltip } from '@korvex/ui';

function WindowButton({ label, icon, onClick, danger }: { label: string; icon: LucideIcon; onClick?: () => void; danger?: boolean }) {
  return (
    <Tooltip content={label} side="bottom">
      <button
        type="button"
        aria-label={label}
        onClick={onClick}
        className={cn(
          'app-no-drag flex h-full w-12 items-center justify-center text-fg-secondary transition-colors duration-fast focus-ring-inset',
          danger
            ? 'hover:bg-danger hover:text-fg-on-accent active:bg-danger-active'
            : 'hover:bg-hover hover:text-fg active:bg-pressed',
        )}
      >
        <Icon icon={icon} />
      </button>
    </Tooltip>
  );
}

export function Titlebar() {
  const api = window.korvex?.window;
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    if (!api) return;
    let alive = true;
    void api.isMaximized().then((v) => alive && setMaximized(v));
    const off = api.onMaximizeChange(setMaximized);
    return () => {
      alive = false;
      off();
    };
  }, [api]);

  return (
    <header className="app-drag flex h-ctl-md shrink-0 items-center justify-between border-b border-border-subtle bg-base">
      <span className="px-3 text-meta font-semibold text-fg">Korvex</span>
      <div className="flex h-full">
        <WindowButton label="Minimize" icon={Minus} onClick={api?.minimize} />
        <WindowButton label={maximized ? 'Restore' : 'Maximize'} icon={maximized ? Copy : Square} onClick={api?.toggleMaximize} />
        <WindowButton label="Close" icon={X} onClick={api?.close} danger />
      </div>
    </header>
  );
}
