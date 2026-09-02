/**
 * typography.ts
 *
 * One responsive type ramp for dense, data-heavy surfaces (scoring console,
 * squad management).
 *
 * Why this exists: the scoring console had grown 26 distinct font sizes between
 * 7 and 32, including eight half-point steps that served no design purpose.
 * Sizes below 10 are not reliably legible at arm's length, and because every
 * size was a hard-coded literal, nothing responded to viewport width — the same
 * 8px label rendered on a 320px iPhone SE and a 430px Pro Max.
 *
 * This module fixes both: a five-step ramp with a hard legibility floor, scaled
 * by viewport bucket so compact phones lose a little and large phones/tablets
 * gain a little, without any step ever dropping under the floor.
 */

import { useMemo } from 'react';
import { useWindowDimensions, type TextStyle } from 'react-native';

/** Never render body/label text below this, whatever the viewport. */
export const MIN_LEGIBLE_FONT_SIZE = 10;

/** Baseline widths the ramp is tuned against (iPhone 11/12/13/14 class). */
const COMPACT_MAX = 360;  // SE, mini, small Androids
const REGULAR_MAX = 400;  // 12/13/14/15 standard
const LARGE_MAX = 600;    // Plus / Pro Max

export type TypeStep = 'micro' | 'small' | 'body' | 'bodyStrong' | 'title' | 'display';

interface Step {
  size: number;
  line: number;
  family: string;
}

/** The ramp at the 375px baseline. Five text steps plus one display step. */
const BASE_RAMP: Record<TypeStep, Step> = {
  micro: { size: 10, line: 13, family: 'Sora_600SemiBold' },
  small: { size: 11, line: 15, family: 'Sora_500Medium' },
  body: { size: 12.5, line: 17, family: 'Sora_500Medium' },
  bodyStrong: { size: 12.5, line: 17, family: 'Sora_600SemiBold' },
  title: { size: 14, line: 19, family: 'Sora_600SemiBold' },
  display: { size: 17, line: 22, family: 'Sora_700Bold' },
};

/**
 * Viewport bucket -> multiplier. Buckets rather than a continuous ratio so text
 * doesn't shift by fractions of a pixel between similar devices, which is what
 * produced the half-point sizes in the first place.
 */
export function scaleFactorForWidth(width: number): number {
  if (width <= COMPACT_MAX) return 0.94;
  if (width <= REGULAR_MAX) return 1;
  if (width <= LARGE_MAX) return 1.04;
  return 1.08;
}

/** Rounds to the nearest half point and clamps to the legibility floor. */
function resolve(step: Step, factor: number): TextStyle {
  const raw = step.size * factor;
  const size = Math.max(MIN_LEGIBLE_FONT_SIZE, Math.round(raw * 2) / 2);
  // Keep the original line-height ratio so density scales with the text.
  const line = Math.round(size * (step.line / step.size));
  return { fontFamily: step.family, fontSize: size, lineHeight: line };
}

export type TypeRamp = Record<TypeStep, TextStyle>;

export function buildTypeRamp(width: number): TypeRamp {
  const factor = scaleFactorForWidth(width);
  return (Object.keys(BASE_RAMP) as TypeStep[]).reduce((acc, key) => {
    acc[key] = resolve(BASE_RAMP[key], factor);
    return acc;
  }, {} as TypeRamp);
}

/**
 * Viewport-aware type ramp. Use instead of literal `fontSize` on dense screens.
 *
 *   const type = useTypeRamp();
 *   <Text style={type.body}>…</Text>
 */
export function useTypeRamp(): TypeRamp {
  const { width } = useWindowDimensions();
  return useMemo(() => buildTypeRamp(width), [width]);
}

/** True on the narrowest phones, where dense rows should drop to one column. */
export function useIsCompactViewport(): boolean {
  const { width } = useWindowDimensions();
  return width <= COMPACT_MAX;
}
