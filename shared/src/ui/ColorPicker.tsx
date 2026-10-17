import * as Popover from '@radix-ui/react-popover';
import { useEffect, useState } from 'react';
import { cn } from '../lib/cn';
import { fieldBase, fieldBorder } from '../lib/fields';
import { SWATCHES } from './palette';

const HEX6 = /^[0-9a-f]{6}$/i;

export interface ColorPickerProps {
  value: string; // "#RRGGBB"
  onChange: (hex: string) => void;
  swatches?: readonly string[];
  disabled?: boolean;
  'aria-label': string;
}

/** The one colour picker: swatch grid + hex field. Solid swatches only, no saturation field. */
export function ColorPicker({ value, onChange, swatches = SWATCHES, disabled, 'aria-label': ariaLabel }: ColorPickerProps) {
  const [draft, setDraft] = useState(value.replace('#', ''));
  useEffect(() => setDraft(value.replace('#', '')), [value]);
  const invalid = draft.length > 0 && !HEX6.test(draft);

  return (
    <Popover.Root>
      <Popover.Trigger
        disabled={disabled}
        aria-label={ariaLabel}
        className="inline-flex h-ctl-md items-center gap-2 rounded-md border border-border bg-elevated px-2 transition-colors duration-fast focus-ring enabled:hover:border-border-strong enabled:hover:bg-hover disabled:cursor-not-allowed data-[state=open]:border-border-strong"
      >
        <span className="h-4 w-4 rounded-sm border border-border" style={{ backgroundColor: value }} />
        <span className="font-mono text-meta uppercase tabular-nums text-fg-secondary">{value}</span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          className="z-floating flex w-64 flex-col gap-3 rounded-md border border-border bg-floating p-3 shadow-floating"
        >
          <div className="grid grid-cols-8 gap-1">
            {swatches.map((hex) => {
              const selected = hex.toLowerCase() === value.toLowerCase();
              return (
                <button
                  key={hex}
                  type="button"
                  aria-label={hex}
                  aria-pressed={selected}
                  onClick={() => onChange(hex)}
                  style={{ backgroundColor: hex }}
                  className={cn(
                    'h-6 w-6 rounded-sm border border-border focus-ring',
                    selected && 'outline outline-2 outline-offset-1 outline-fg',
                  )}
                />
              );
            })}
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-meta text-fg-tertiary">#</span>
              <input
                value={draft}
                maxLength={6}
                aria-label="Hex colour"
                aria-invalid={invalid}
                onChange={(e) => {
                  const next = e.target.value.replace('#', '');
                  setDraft(next);
                  if (HEX6.test(next)) onChange(`#${next.toUpperCase()}`);
                }}
                className={cn(fieldBase, fieldBorder(invalid), 'w-full font-mono uppercase tabular-nums')}
              />
            </div>
            {invalid && <p className="text-meta text-danger">Enter six hex digits, like 9B6BFF.</p>}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
