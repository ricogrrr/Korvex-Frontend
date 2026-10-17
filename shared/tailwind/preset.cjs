const plugin = require('tailwindcss/plugin');

/* Padding / margin / gap / inset / translate: ONLY these steps (4pt grid). */
const spacing = {
  0: '0px', 1: '4px', 2: '8px', 3: '12px', 4: '16px', 6: '24px', 8: '32px', 12: '48px', 16: '64px',
};

/* Width / height may also use a few extra 4pt steps and the control tokens. */
const sizeBase = {
  ...spacing,
  px: '1px', 5: '20px', 7: '28px', 9: '36px', 10: '40px', 20: '80px', 24: '96px', 32: '128px',
  40: '160px', 48: '192px', 64: '256px', 80: '320px', 96: '384px',
  auto: 'auto', full: '100%', min: 'min-content', max: 'max-content', fit: 'fit-content',
  'ctl-sm': 'var(--control-sm)', 'ctl-md': 'var(--control-md)', 'ctl-lg': 'var(--control-lg)',
};

const v = (name) => `var(--${name})`;

module.exports = {
  theme: {
    spacing,
    width: { ...sizeBase, screen: '100vw' },
    height: { ...sizeBase, screen: '100vh' },
    size: sizeBase,
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      base: v('surface-base'),
      elevated: v('surface-elevated'),
      floating: v('surface-floating'),
      hover: v('surface-hover'),
      pressed: v('surface-active'),
      border: { DEFAULT: v('border-default'), subtle: v('border-subtle'), strong: v('border-strong') },
      fg: {
        DEFAULT: v('text-primary'), secondary: v('text-secondary'), tertiary: v('text-tertiary'),
        disabled: v('text-disabled'), 'on-accent': v('text-on-accent'),
      },
      accent: { DEFAULT: v('accent'), hover: v('accent-hover'), active: v('accent-active'), subtle: v('accent-subtle') },
      success: { DEFAULT: v('success'), subtle: v('success-subtle') },
      warn: { DEFAULT: v('warn'), subtle: v('warn-subtle') },
      danger: { DEFAULT: v('danger'), hover: v('danger-hover'), active: v('danger-active'), subtle: v('danger-subtle') },
      info: { DEFAULT: v('info'), subtle: v('info-subtle') },
      presence: { online: v('presence-online'), ingame: v('presence-ingame'), away: v('presence-away'), offline: v('presence-offline') },
    },
    borderColor: ({ theme }) => ({ ...theme('colors'), DEFAULT: v('border-default') }),
    borderRadius: { none: '0px', sm: v('radius-1'), md: v('radius-2'), lg: v('radius-3'), full: '9999px' },
    boxShadow: { none: 'none', floating: v('shadow-floating') },
    fontFamily: { sans: v('font-sans'), mono: v('font-mono') },
    fontSize: {
      label: ['11px', '16px'], meta: ['12px', '16px'], body: ['13px', '20px'], ui: ['14px', '20px'],
      lg: ['16px', '24px'], xl: ['20px', '28px'], display: ['28px', '32px'],
    },
    fontWeight: { regular: '400', medium: '500', semibold: '600' },
    letterSpacing: { tight: '-0.01em', normal: '0em', label: '0.06em' },
    transitionDuration: { 0: '0ms', fast: v('dur-fast'), base: v('dur-base'), slow: v('dur-slow') },
    transitionTimingFunction: { DEFAULT: v('ease') },
    zIndex: { 0: '0', raised: '10', overlay: '40', floating: '50', toast: '60' },
    extend: {
      keyframes: { 'kx-pulse': { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.5' } } },
      animation: { skeleton: 'kx-pulse 1.6s var(--ease) infinite' },
    },
  },
  plugins: [
    plugin(({ addBase, addUtilities }) => {
      addBase({
        'html, body, #root': { height: '100%' },
        body: {
          background: v('surface-base'), color: v('text-primary'), fontFamily: v('font-sans'),
          fontSize: '13px', lineHeight: '20px', fontOpticalSizing: 'auto',
          WebkitFontSmoothing: 'antialiased', overflow: 'hidden', userSelect: 'none',
        },
        'input, textarea, [data-selectable]': { userSelect: 'text' },
        '::selection': { background: v('accent-subtle') },

        /* Safety net: focus is never removed without replacement. */
        ':focus-visible': { outline: '2px solid var(--accent)', outlineOffset: '2px' },
        ':focus:not(:focus-visible)': { outline: 'none' },

        /* Scrollbars: 8px, transparent track, thumb appears on hover. */
        '::-webkit-scrollbar': { width: '8px', height: '8px' },
        '::-webkit-scrollbar-track, ::-webkit-scrollbar-corner': { background: 'transparent' },
        '::-webkit-scrollbar-thumb': { background: 'transparent', borderRadius: v('radius-1') },
        '*:hover::-webkit-scrollbar-thumb': { background: v('scroll-thumb') },
        '::-webkit-scrollbar-thumb:hover': { background: v('scroll-thumb-hover') },

        '@media (prefers-reduced-motion: reduce)': {
          '*, *::before, *::after': {
            animationDuration: '0.01ms !important', animationIterationCount: '1 !important',
            transitionDuration: '0.01ms !important', scrollBehavior: 'auto !important',
          },
        },
      });
      addUtilities({
        /* 2px accent ring, offset 2. Use .focus-ring-inset inside overflow-hidden
           containers (lists, menus) where an outer ring would be clipped. */
        '.focus-ring:focus-visible': { outline: '2px solid var(--accent)', outlineOffset: '2px' },
        '.focus-ring-inset:focus-visible': { outline: '2px solid var(--accent)', outlineOffset: '-2px' },
        '.app-drag': { '-webkit-app-region': 'drag' },
        '.app-no-drag': { '-webkit-app-region': 'no-drag' },
      });
    }),
  ],
};
