import * as S from '@radix-ui/react-slider';

export interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
  'aria-label': string;
}

/** The one slider: track + mono numeric readout. */
export function Slider({ value, onValueChange, min, max, step = 1, unit, disabled, 'aria-label': ariaLabel }: SliderProps) {
  return (
    <div className="flex w-full items-center gap-3">
      <S.Root
        value={[value]}
        onValueChange={([next]) => onValueChange(next ?? value)}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className="relative flex h-5 w-full touch-none select-none items-center"
      >
        <S.Track className="relative h-1 grow rounded-sm bg-pressed">
          <S.Range className="absolute h-full rounded-sm bg-accent data-[disabled]:bg-fg-disabled" />
        </S.Track>
        <S.Thumb
          aria-label={ariaLabel}
          className="block h-4 w-4 rounded-md border-2 border-accent bg-fg transition-colors duration-fast focus-ring hover:border-accent-hover active:border-accent-active data-[disabled]:cursor-not-allowed data-[disabled]:border-fg-disabled"
        />
      </S.Root>
      <output className="w-auto shrink-0 whitespace-nowrap text-right font-mono text-meta tabular-nums text-fg-secondary">
        {value}
        {unit}
      </output>
    </div>
  );
}
