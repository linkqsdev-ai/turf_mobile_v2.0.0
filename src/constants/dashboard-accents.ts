/**
 * dashboard-accents.ts
 *
 * Accent pairs from the Home analytics cards (app/(tabs)/index.tsx): `main` for
 * bars, metrics and tints; `dark` for text sitting on a tinted ground. Shared by
 * every screen built in that card language — Own Board, Cups, tournament and
 * registration.
 */

export interface Accent {
  main: string;
  dark: string;
}

export const ACCENTS = {
  green: { main: '#10b981', dark: '#047857' },
  orange: { main: '#ff8c00', dark: '#c2410c' },
  red: { main: '#EF4444', dark: '#B91C1C' },
  primary: { main: '#5D68E8', dark: '#4552C4' },
  slate: { main: '#64748B', dark: '#475569' },
} satisfies Record<string, Accent>;
