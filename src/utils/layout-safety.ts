/**
 * layout-safety.ts
 *
 * Guards against the two rendering faults that show up as "text is cut off" and
 * "labels run together" on real devices but look fine in a wide simulator.
 */

/**
 * Android reserves extra vertical space inside a text box for the font's
 * ascenders and descenders (`includeFontPadding`, on by default). Inside a
 * `TextInput` with a fixed `height`, that reserved space plus the platform's
 * own default padding can exceed the box, and the glyphs are clipped —
 * typically shaving the top off capitals.
 *
 * Sora has tall ascenders, so it clips sooner than the system font the fixed
 * heights in this app were originally eyeballed against.
 *
 * Spread this into any single-line `TextInput` that sets an explicit height.
 */
export const singleLineInputFix = {
  includeFontPadding: false,
  paddingVertical: 0,
  // Android-only; React Native ignores it on iOS, so no platform branch is
  // needed — and keeping this module free of react-native imports is what lets
  // the test runner load it.
  textAlignVertical: 'center' as const,
};

/**
 * The same guard for multi-line inputs, which must keep their padding and
 * align text to the top rather than centring it.
 */
export const multiLineInputFix = {
  includeFontPadding: false,
  textAlignVertical: 'top' as const,
};

/**
 * Smallest size that stays legible on a high-density phone screen.
 *
 * Sizes as low as 6.5px had crept in. Below roughly this, glyph rasterisation
 * differs enough between densities that the same label wraps on one device and
 * not another — which is what makes "it looks fine on my phone" misleading.
 */
export const MIN_READABLE_FONT_SIZE = 9;

/** Clamp a font size to the legible floor. */
export function readableFontSize(size: number): number {
  if (!Number.isFinite(size)) return MIN_READABLE_FONT_SIZE;
  return Math.max(size, MIN_READABLE_FONT_SIZE);
}

/**
 * A label/value row where the value must stay whole and the label may shrink.
 *
 * `justifyContent: 'space-between'` alone gives no minimum separation, so once
 * the pair no longer fits the two strings butt together — "Registration
 * Progress8/8 Teams" — and then overflow their container. The label shrinks and
 * ellipsises; the value never does.
 */
export const labelValueRow = {
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    gap: 8,
  },
  /** Apply to the label, together with numberOfLines={1}. */
  label: { flexShrink: 1, minWidth: 0 },
  /** Apply to the value — it is the part that must remain readable. */
  value: { flexShrink: 0 },
};
