import { forwardRef, type ButtonHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../lib/cn';
import { Icon, type IconSize } from './Icon';
import { Tooltip } from './Tooltip';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md';

const base =
  'inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-md border font-medium transition-colors duration-fast focus-ring enabled:cursor-pointer disabled:cursor-not-allowed';

const variants: Record<ButtonVariant, string> = {
  primary:
    'border-transparent bg-accent text-fg-on-accent enabled:hover:bg-accent-hover enabled:active:bg-accent-active disabled:bg-pressed disabled:text-fg-disabled',
  secondary:
    'border-border bg-elevated text-fg enabled:hover:border-border-strong enabled:hover:bg-hover enabled:active:bg-pressed disabled:text-fg-disabled',
  ghost:
    'border-transparent bg-transparent text-fg-secondary enabled:hover:bg-hover enabled:hover:text-fg enabled:active:bg-pressed disabled:text-fg-disabled',
  danger:
    'border-transparent bg-danger text-fg-on-accent enabled:hover:bg-danger-hover enabled:active:bg-danger-active disabled:bg-pressed disabled:text-fg-disabled',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-ctl-sm gap-2 px-3 text-meta',
  md: 'h-ctl-md gap-2 px-4 text-body',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', icon, className, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      {icon && <Icon icon={icon} />}
      {children}
    </button>
  );
});

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  label: string; // required: drives aria-label and the styled tooltip
  icon: LucideIcon;
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconSize?: IconSize;
  tooltipSide?: 'top' | 'right' | 'bottom' | 'left';
  shortcut?: string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, icon, variant = 'ghost', size = 'md', iconSize = 16, tooltipSide, shortcut, className, type = 'button', ...rest },
  ref,
) {
  const box = size === 'sm' ? 'h-ctl-sm w-ctl-sm' : 'h-ctl-md w-ctl-md';
  return (
    <Tooltip content={label} side={tooltipSide} shortcut={shortcut}>
      <button ref={ref} type={type} aria-label={label} className={cn(base, variants[variant], box, className)} {...rest}>
        <Icon icon={icon} size={iconSize} />
      </button>
    </Tooltip>
  );
});
