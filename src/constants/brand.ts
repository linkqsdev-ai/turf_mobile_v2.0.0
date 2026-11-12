/**
 * brand.ts
 *
 * Buk Ur Play brand colours, sampled from the logo artwork, and the logo
 * itself. The sign-in and sign-up screens sit on the full-bleed brand yellow.
 */

export const BRAND = {
  yellow: '#FDD305',
  ink: '#1C2939',
  inkSoft: 'rgba(28, 41, 57, 0.72)',
  inkMuted: 'rgba(28, 41, 57, 0.45)',
  line: 'rgba(28, 41, 57, 0.16)',
  field: '#FFFFFF',
  fieldSoft: 'rgba(255, 255, 255, 0.6)',
  danger: '#B91C1C',
} as const;

/** Navy line-art logo on a transparent background, 1200 × 1107. */
export const BRAND_LOGO = require('@/assets/images/branding/buk_ur_play_logo.png');
export const BRAND_LOGO_ASPECT = 1200 / 1107;

/**
 * The logo cut into layers on the same 1200 × 1107 canvas, so stacked they line
 * up exactly with the flat logo — used by the animated logo.
 */
export const BRAND_LOGO_LAYERS = {
  monkey: require('@/assets/images/branding/buk_ur_play_monkey.png'),
  ball: require('@/assets/images/branding/buk_ur_play_ball.png'),
  wordmark: require('@/assets/images/branding/buk_ur_play_wordmark.png'),
};
