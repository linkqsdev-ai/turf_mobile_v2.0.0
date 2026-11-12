/**
 * duck.ts
 *
 * Whether a dismissal is a duck, and which kind. Out for nought without facing
 * a ball is a diamond duck, first ball a golden duck, otherwise a plain duck.
 * Retiring on nought is not a dismissal, so it is not a duck.
 */

export type DuckKind = 'diamond' | 'golden' | 'duck';

const NOT_A_DISMISSAL = new Set(['retired', 'retired_hurt', 'retired_out', 'Retired Hurt', 'Retired Not Out']);

export function duckKind(runs: number, balls: number, dismissalType?: string): DuckKind | null {
  if (dismissalType && NOT_A_DISMISSAL.has(dismissalType)) return null;
  if ((Number(runs) || 0) !== 0) return null;
  const faced = Number(balls) || 0;
  if (faced <= 0) return 'diamond';
  if (faced === 1) return 'golden';
  return 'duck';
}

export const DUCK_LABEL: Record<DuckKind, string> = {
  diamond: 'Diamond Duck',
  golden: 'Golden Duck',
  duck: 'Duck',
};
