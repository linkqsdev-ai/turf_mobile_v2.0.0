import { Platform } from 'react-native';

export const Colors = {
  light: {
    background: '#FDFCF7', // App background
    text: '#2D2D2D', // Primary text
    textSecondary: '#64748b', // Secondary text

    backgroundElement: '#FFFFFF',
    backgroundSelected: '#EAEAFF', // Soft brand blue tint

    primary: '#5D68E8', // Primary Blue
    onPrimary: '#ffffff',
    primaryContainer: '#4552C4', // Primary Dark Blue
    onPrimaryContainer: '#ffffff',

    secondary: '#5D68E8', // Primary Blue
    secondaryContainer: '#5D68E8', // Primary Blue
    onSecondaryContainer: '#ffffff',

    surfaceLowest: '#FFFFFF', // Cards & components
    surfaceLow: '#F5F6FA',
    surface: '#FFFFFF',
    surfaceHigh: '#e2e8f0',
    surfaceHighest: '#cbd5e1',

    outline: '#94a3b8',
    outlineVariant: '#cbd5e1',
    placeholder: '#94a3b8',
    error: '#FF9500', // Accent Orange (Alerts/Status)
    errorContainer: '#ffe6cc',
  },
  dark: {
    background: '#0d1d26', // Premium Technical Dark
    text: '#f9f9ff', // on-surface dark
    textSecondary: '#94a3b8', // on-surface-variant dark

    backgroundElement: '#12202a', // Compatibility link to surfaceLow dark
    backgroundSelected: '#1a2d3b', // Compatibility link to surface dark

    primary: '#5D68E8', // Primary Blue
    onPrimary: '#ffffff',
    primaryContainer: '#1a2a33', // Deep Navy container
    onPrimaryContainer: '#cbd5e1',

    secondary: '#5D68E8', // Primary Blue
    secondaryContainer: '#5D68E8', // Primary Blue
    onSecondaryContainer: '#ffffff',

    surfaceLowest: '#12202a', // Darkest container card
    surfaceLow: '#1a2d3b',
    surface: '#223b4e',
    surfaceHigh: '#2a4961',
    surfaceHighest: '#325774',

    outline: '#64748b',
    outlineVariant: '#475569',
    placeholder: '#94a3b8',
    error: '#cf6679',
    errorContainer: '#400009',
  },
  blue: {
    background: '#FDFCF7', // App background
    text: '#2D2D2D', // Primary text
    textSecondary: '#64748b', // Secondary text
    placeholder: '#94a3b8',

    backgroundElement: '#FFFFFF',
    backgroundSelected: '#EAEAFF', // Soft brand blue tint

    primary: '#5D68E8', // Primary Blue
    onPrimary: '#ffffff',
    primaryContainer: '#4552C4', // Primary Dark Blue
    onPrimaryContainer: '#ffffff',

    secondary: '#5D68E8', // Primary Blue
    secondaryContainer: '#5D68E8', // Primary Blue
    onSecondaryContainer: '#ffffff',

    surfaceLowest: '#FFFFFF', // Cards & components
    surfaceLow: '#F5F6FA',
    surface: '#FFFFFF',
    surfaceHigh: '#e2e8f0',
    surfaceHighest: '#cbd5e1',

    outline: '#94a3b8',
    outlineVariant: '#cbd5e1',
    error: '#FF9500', // Accent Orange (Alerts/Status)
    errorContainer: '#ffe6cc',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;

export const Typography = {
  fontFamilies: {
    hankenRegular: 'Sora_400Regular',
    hankenMedium: 'Sora_500Medium',
    hankenSemiBold: 'Sora_500Medium',
    hankenBold: 'Sora_500Medium',
    hankenExtraBold: 'Sora_600SemiBold',
    jakartaMedium: 'Sora_500Medium',
    jakartaBold: 'Sora_500Medium',
  },
  // Scaled down by 3-4px for compact, ultra-clean mobile view resolution
  displayLg: {
    fontFamily: 'Sora_500Medium',
    fontSize: 18,
    lineHeight: 23,
    letterSpacing: -0.3,
  },
  displayLgMobile: {
    fontFamily: 'Sora_500Medium',
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: -0.2,
  },
  headlineLg: {
    fontFamily: 'Sora_500Medium',
    fontSize: 12.5,
    lineHeight: 16,
    letterSpacing: -0.1,
  },
  headlineMd: {
    fontFamily: 'Sora_500Medium',
    fontSize: 11.5,
    lineHeight: 15,
    letterSpacing: -0.1,
  },
  headlineSm: {
    fontFamily: 'Sora_500Medium',
    fontSize: 10.5,
    lineHeight: 14,
  },
  bodyLg: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11.5,
    lineHeight: 16,
  },
  bodyMd: {
    fontFamily: 'Sora_400Regular',
    fontSize: 10.5,
    lineHeight: 14,
  },
  bodySm: {
    fontFamily: 'Sora_400Regular',
    fontSize: 9.5,
    lineHeight: 13,
  },
  labelMd: {
    fontFamily: 'Sora_500Medium',
    fontSize: 9.5,
    lineHeight: 13,
    letterSpacing: 0.2,
  },
  labelSm: {
    fontFamily: 'Sora_500Medium',
    fontSize: 8.5,
    lineHeight: 11,
  },

  // Semantic Type Styles
  subheading: {
    fontFamily: 'Sora_500Medium',
    fontSize: 13,
    lineHeight: 17,
  },
  heading: {
    fontFamily: 'Sora_500Medium',
    fontSize: 12,
    lineHeight: 16,
  },
  body: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11,
    lineHeight: 15,
  },
  smallBody: {
    fontFamily: 'Sora_400Regular',
    fontSize: 10,
    lineHeight: 14,
  },
  caption: {
    fontFamily: 'Sora_400Regular',
    fontSize: 9,
    lineHeight: 12,
  },
  small: {
    fontFamily: 'Sora_500Medium',
    fontSize: 8.5,
    lineHeight: 11,
  },
  micro: {
    fontFamily: 'Sora_500Medium',
    fontSize: 7.5,
    lineHeight: 10,
  },
};

export const Shadows = {
  // Peek Low Ambient Elevation (0px 1px 2px)
  level1: {
    shadowColor: '#181817',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  // Peek Medium Card Elevation (0px 4px 16px)
  level2: {
    shadowColor: '#181817',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  // Peek High Elevation (0px 12px 28px)
  level3: {
    shadowColor: '#181817',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 28,
    elevation: 8,
  },
  // FAB floating button glow (green tint)
  fab: {
    shadowColor: 'rgb(16, 185, 129)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
  // Card with colored primary tint
  primary: {
    shadowColor: '#5D68E8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 6,
  },
  // Subtle input focus shadow
  input: {
    shadowColor: '#5D68E8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
};

export const Spacing = {
  px: 1,
  half: 2,
  xxs: 2,
  one: 3,
  xs: 3,
  micro: 4,
  compact: 5,
  two: 6,
  sm: 6,
  regular: 8,
  three: 12,
  md: 10,
  base: 12,
  gutter: 12,
  intermediate: 14,
  four: 18,
  lg: 18,
  five: 24,
  xl: 24,
  six: 48,
  xxl: 48,
  containerMargin: 14,
};

export const BorderRadius = {
  xs: 4,
  sm: 6,       // Peek 6px shape
  default: 7,  // Peek 7px shape
  md: 8,       // Peek 8px shape (cards & inputs)
  lg: 8,       // Peek 8px shape (buttons)
  xl: 12,      // Peek 12px shape (modals & panels)
  '2xl': 12,   // Peek 12px shape
  premium: 12, // Peek 12px shape
  full: 9999,  // Peek 9999px pill
  pill: 9999,  // Peek 9999px pill
};

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
