import * as Switch from '@radix-ui/react-switch';

export interface ToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

/** The one toggle. 36x20 track, 12px thumb on a 4px inset. */
export function Toggle({ checked, onCheckedChange, ...rest }: ToggleProps) {
  return (
    <Switch.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      className="flex h-5 w-9 shrink-0 items-center rounded-lg bg-pressed transition-colors duration-fast focus-ring enabled:cursor-pointer enabled:hover:bg-border-strong disabled:cursor-not-allowed data-[state=checked]:bg-accent enabled:data-[state=checked]:hover:bg-accent-hover disabled:data-[state=checked]:bg-fg-disabled"
      {...rest}
    >
      <Switch.Thumb className="ml-1 block h-3 w-3 translate-x-0 rounded-md bg-fg-secondary transition-transform duration-fast data-[state=checked]:translate-x-4 data-[state=checked]:bg-fg-on-accent" />
    </Switch.Root>
  );
}
