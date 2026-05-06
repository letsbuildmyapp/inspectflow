/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      // HIG-aligned scale, with mono-aware floors.
      // text-xs is intentionally raised to 13px because mono perceives ~1px smaller.
      // No size below 12px is exposed; mono floor is 13px.
      fontSize: {
        // [size, { lineHeight, letterSpacing? }]
        '2xs': ['12px', { lineHeight: '16px' }],          // caption (proportional only)
        xs: ['13px', { lineHeight: '18px' }],             // footnote / mono floor
        sm: ['15px', { lineHeight: '22px' }],             // subheadline / dense rows
        base: ['16px', { lineHeight: '24px' }],           // body
        lg: ['17px', { lineHeight: '24px' }],             // headline
        xl: ['20px', { lineHeight: '26px' }],             // title3
        '2xl': ['22px', { lineHeight: '28px' }],          // title2
        '3xl': ['28px', { lineHeight: '34px', letterSpacing: '-0.01em' }], // title1
        '4xl': ['34px', { lineHeight: '41px', letterSpacing: '-0.015em' }], // largeTitle
        '5xl': ['48px', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        '6xl': ['64px', { lineHeight: '1.05', letterSpacing: '-0.025em' }],
        '7xl': ['80px', { lineHeight: '1', letterSpacing: '-0.03em' }],
        '8xl': ['96px', { lineHeight: '1', letterSpacing: '-0.03em' }],
      },
      colors: {
        ink: 'oklch(0.15 0 0 / <alpha-value>)',
        paper: 'oklch(0.99 0 0 / <alpha-value>)',
        smoke: 'oklch(0.92 0 0 / <alpha-value>)',
        bone: 'oklch(0.96 0 0 / <alpha-value>)',
        coal: 'oklch(0.20 0 0 / <alpha-value>)',
        slate900: 'oklch(0.25 0 0 / <alpha-value>)',
        hazard: 'oklch(0.74 0.19 60 / <alpha-value>)',
        hazardDeep: 'oklch(0.62 0.21 50 / <alpha-value>)',
        warn: 'oklch(0.65 0.22 25 / <alpha-value>)',
        ok: 'oklch(0.70 0.16 145 / <alpha-value>)',
      },
      borderWidth: {
        3: '3px',
      },
      boxShadow: {
        brut: '4px 4px 0 0 oklch(0.15 0 0)',
        brutLg: '6px 6px 0 0 oklch(0.15 0 0)',
        brutHazard: '4px 4px 0 0 oklch(0.74 0.19 60)',
      },
    },
  },
  plugins: [],
};
