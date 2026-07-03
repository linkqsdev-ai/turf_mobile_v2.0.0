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
    error: '#cf6679',
    errorContainer: '#400009',
  },
  blue: {
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
    error: '#FF9500', // Accent Orange (Alerts/Status)
    errorContainer: '#ffe6cc',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;

export const Typography = {
  fontFamilies: {
    hankenRegular: 'PlusJakartaSans_400Regular',
    hankenMedium: 'PlusJakartaSans_500Medium',
    hankenSemiBold: 'PlusJakartaSans_600SemiBold',
    hankenBold: 'PlusJakartaSans_700Bold',
    hankenExtraBold: 'PlusJakartaSans_800ExtraBold',
    jakartaMedium: 'PlusJakartaSans_500Medium',
    jakartaBold: 'PlusJakartaSans_700Bold',
  },
  // Scale styles mapped from DESIGN.md
  displayLg: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.56,
  },
  displayLgMobile: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: -0.44,
  },
  headlineLg: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.24,
  },
  headlineMd: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.16,
  },
  headlineSm: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
    lineHeight: 18,
  },
  bodyLg: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    lineHeight: 18,
  },
  bodyMd: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 11,
    lineHeight: 15,
  },
  bodySm: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 11,
    lineHeight: 15,
  },
  labelMd: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 0.45,
  },
  labelSm: {
    fontFamily: 'PlusJakartaSans_500Medium',
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
  sm: 2,
  default: 4,
  md: 6,
  lg: 8,
  xl: 16,      // Upgraded to 16px
  '2xl': 24,   // Upgraded to 24px (Mockup visual styling)
  premium: 32, // Rounded-3xl in Tailwind
  full: 9999,
};

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
