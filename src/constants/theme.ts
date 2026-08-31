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
    hankenSemiBold: 'Sora_600SemiBold',
    hankenBold: 'Sora_700Bold',
    hankenExtraBold: 'Sora_800ExtraBold',
    jakartaMedium: 'Sora_500Medium',
    jakartaBold: 'Sora_700Bold',
  },
  // Scale styles mapped from DESIGN.md
  displayLg: {
    fontFamily: 'Sora_800ExtraBold',
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.56,
  },
  displayLgMobile: {
    fontFamily: 'Sora_700Bold',
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.3,
  },
  headlineLg: {
    fontFamily: 'Sora_700Bold',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  headlineMd: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 13.5,
    lineHeight: 18,
    letterSpacing: -0.1,
  },
  headlineSm: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 11.5,
    lineHeight: 16,
  },
  bodyLg: {
    fontFamily: 'Sora_400Regular',
    fontSize: 13,
    lineHeight: 18,
  },
  bodyMd: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11,
    lineHeight: 15,
  },
  bodySm: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11,
    lineHeight: 15,
  },
  labelMd: {
    fontFamily: 'Sora_700Bold',
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 0.45,
  },
  labelSm: {
    fontFamily: 'Sora_500Medium',
    fontSize: 8,
    lineHeight: 10,
  },
};

export const Shadows = {
  // Subtle border-only (for dividers / outlined cards)
  level1: {
    shadowColor: '#1a2a33',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  // Standard elevated card
  level2: {
    shadowColor: '#1a2a33',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.09,
    shadowRadius: 16,
    elevation: 4,
  },
  // Hero / prominent card
  level3: {
    shadowColor: '#1a2a33',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
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
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
  base: 4,
  xs: 8,
  sm: 12,
  md: 16,
  gutter: 16,
  lg: 24,
  xl: 32,
  xxl: 64,
  containerMargin: 20,
};

export const BorderRadius = {
  xs: 3,
  sm: 4,
  default: 6,
  md: 6,       // Standardized selections & badge radius (6px)
  lg: 8,       // Standardized button & input radius (8px)
  xl: 8,       // Standardized action button radius (8px)
  '2xl': 10,   // Standardized card radius (10px)
  premium: 12, // Standardized container & modal radius (12px)
  full: 6,     // Standardized selection chips & pills to 6px
};

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
