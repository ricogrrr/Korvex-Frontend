import * as Select from '@radix-ui/react-select';
import { Check, ChevronDown, type LucideIcon } from 'lucide-react';
import { cn } from '../lib/cn';
import { Icon } from './Icon';

export interface DropdownOption<T extends string = string> {
  value: T;
  label: string;
  meta?: string; // rendered mono, right-aligned
  icon?: LucideIcon;
  disabled?: boolean;
}

export interface DropdownProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  options: readonly DropdownOption<T>[];
  placeholder?: string;
  size?: 'sm' | 'md';
  disabled?: boolean;
  id?: string;
  'aria-label'?: string;
}

/** The one dropdown. Rows are icon + name + meta, so version pickers reuse it. */
export function Dropdown<T extends string>({
  value, onValueChange, options, placeholder = 'Select', size = 'md', disabled, id, 'aria-label': ariaLabel,
}: DropdownProps<T>) {
  const selected = options.find((o) => o.value === value);
  return (
    <Select.Root value={value} onValueChange={(next) => onValueChange(next as T)} disabled={disabled}>
      <Select.Trigger
        id={id}
        aria-label={ariaLabel}
        className={cn(
          'inline-flex w-full items-center gap-2 rounded-md border border-border bg-elevated px-3 text-left text-body text-fg transition-colors duration-fast focus-ring',
          size === 'sm' ? 'h-ctl-sm' : 'h-ctl-md',
          'enabled:hover:border-border-strong enabled:hover:bg-hover data-[state=open]:border-border-strong data-[state=open]:bg-hover disabled:cursor-not-allowed disabled:text-fg-disabled',
        )}
      >
        {selected?.icon && <Icon icon={selected.icon} className="text-fg-secondary" />}
        <span className="min-w-0 flex-1 truncate">
          <Select.Value placeholder={placeholder} />
        </span>
        {selected?.meta && <span className="font-mono text-meta tabular-nums text-fg-tertiary">{selected.meta}</span>}
        <Select.Icon asChild>
          <Icon icon={ChevronDown} className="text-fg-tertiary" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={4}
          className="z-floating overflow-hidden rounded-md border border-border bg-floating shadow-floating"
          style={{ minWidth: 'var(--radix-select-trigger-width)', maxHeight: 'var(--radix-select-content-available-height)' }}
        >
          <Select.Viewport className="p-1">
            {options.map((o) => (
              <Select.Item
                key={o.value}
                value={o.value}
                disabled={o.disabled}
                className="flex h-ctl-lg cursor-pointer select-none items-center gap-2 rounded-sm px-2 text-body text-fg focus-ring-inset data-[disabled]:pointer-events-none data-[disabled]:text-fg-disabled data-[highlighted]:bg-hover"
              >
                {o.icon && <Icon icon={o.icon} className="text-fg-secondary" />}
                <span className="min-w-0 flex-1 truncate">
                  <Select.ItemText>{o.label}</Select.ItemText>
                </span>
                {o.meta && <span className="font-mono text-meta tabular-nums text-fg-tertiary">{o.meta}</span>}
                <span className="flex w-4 justify-center">
                  <Select.ItemIndicator>
                    <Icon icon={Check} className="text-accent" />
                  </Select.ItemIndicator>
                </span>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
