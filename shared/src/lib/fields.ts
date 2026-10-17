/* Shared text-field styling (search, hex input, later settings inputs). */
export const fieldBase =
  'h-ctl-md rounded-md border bg-base px-3 text-body text-fg placeholder:text-fg-tertiary transition-colors duration-fast focus-ring disabled:cursor-not-allowed disabled:text-fg-disabled';
export const fieldBorder = (invalid = false) =>
  invalid ? 'border-danger' : 'border-border enabled:hover:border-border-strong';
