/** @type {import('tailwindcss').Config} */
// ─────────────────────────────────────────────────────────────────────────────
// Turf — "Floodlight" design system
// A premium, nocturnal sports-booking aesthetic: deep ink grounds, an electric
// pitch-green primary, and a warm amber accent reserved for money / rewards.
// All colours resolve through CSS variables (see global.css) so light / dark
// swap cleanly on every platform via NativeWind.
// ─────────────────────────────────────────────────────────────────────────────

/** Wrap a CSS var so Tailwind can apply opacity modifiers (bg-primary/20). */
const v = (name) => `rgb(var(${name}) / <alpha-value>)`;

module.exports = {
  darkMode: 'class',
  content: [
    './App.js',
    './src/app/**/*.{js,jsx,ts,tsx}',
    './src/components/**/*.{js,jsx,ts,tsx}',
    './src/screens_design/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // ── shadcn-compatible roles ──────────────────────────────────────────
        background: v('--background'),
        foreground: v('--foreground'),
        card: {
          DEFAULT: v('--card'),
          foreground: v('--card-foreground'),
          elevated: v('--card-elevated'),
        },
        popover: {
          DEFAULT: v('--popover'),
          foreground: v('--popover-foreground'),
        },
        primary: {
          DEFAULT: v('--primary'),
          foreground: v('--primary-foreground'),
          muted: v('--primary-muted'),
        },
        secondary: {
          DEFAULT: v('--secondary'),
          foreground: v('--secondary-foreground'),
        },
        muted: {
          DEFAULT: v('--muted'),
          foreground: v('--muted-foreground'),
        },
        accent: {
          DEFAULT: v('--accent'),
          foreground: v('--accent-foreground'),
        },
        destructive: {
          DEFAULT: v('--destructive'),
          foreground: v('--destructive-foreground'),
        },
        success: {
          DEFAULT: v('--success'),
          foreground: v('--success-foreground'),
        },
        warning: {
          DEFAULT: v('--warning'),
          foreground: v('--warning-foreground'),
        },
        info: {
          DEFAULT: v('--info'),
          foreground: v('--info-foreground'),
        },
        border: v('--border'),
        input: v('--input'),
        ring: v('--ring'),
        // ── brand extras ─────────────────────────────────────────────────────
        floodlight: v('--floodlight'), // hero glow / neon edges
        pitch: v('--pitch'),           // deep turf green for illustrations
      },
      borderRadius: {
        // Fresh scale — generous, confident corners.
        none: '0px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '22px',
        '2xl': '28px',
        '3xl': '36px',
        full: '9999px',
      },
      fontFamily: {
        // Sora is already bundled via @expo-google-fonts/sora.
        sans: ['Sora_400Regular', 'system-ui', 'sans-serif'],
        medium: ['Sora_500Medium'],
        semibold: ['Sora_600SemiBold'],
        bold: ['Sora_700Bold'],
        extrabold: ['Sora_800ExtraBold'],
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px', letterSpacing: '0.4px' }],
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['13px', { lineHeight: '18px' }],
        base: ['15px', { lineHeight: '22px' }],
        lg: ['17px', { lineHeight: '24px', letterSpacing: '-0.2px' }],
        xl: ['20px', { lineHeight: '26px', letterSpacing: '-0.3px' }],
        '2xl': ['24px', { lineHeight: '30px', letterSpacing: '-0.5px' }],
        '3xl': ['30px', { lineHeight: '36px', letterSpacing: '-0.7px' }],
        '4xl': ['38px', { lineHeight: '42px', letterSpacing: '-1px' }],
        '5xl': ['48px', { lineHeight: '52px', letterSpacing: '-1.4px' }],
      },
      spacing: {
        gutter: '20px',
        header: '56px',
      },
      boxShadow: {
        card: '0 8px 24px -8px rgb(0 0 0 / 0.18)',
        elevated: '0 16px 40px -12px rgb(0 0 0 / 0.28)',
        glow: '0 0 32px -4px rgb(var(--floodlight) / 0.55)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { opacity: '0.45' },
          '50%': { opacity: '1' },
          '100%': { opacity: '0.45' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '70%': { transform: 'scale(1.4)', opacity: '0' },
          '100%': { transform: 'scale(1.4)', opacity: '0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out both',
        'fade-up': 'fade-up 0.45s cubic-bezier(0.22,1,0.36,1) both',
        shimmer: 'shimmer 1.4s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2s cubic-bezier(0.22,1,0.36,1) infinite',
      },
    },
  },
  plugins: [],
};
