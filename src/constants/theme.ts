import { Platform } from 'react-native';

export const Colors = {
  light: {
    background: '#FFFFFF', // App background
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
    background: '#F5F6FA', // App background
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
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.64, // -0.02em
  },
  displayLgMobile: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.52,
  },
  headlineLg: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.28, // -0.01em
  },
  headlineMd: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  headlineSm: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 18,
    lineHeight: 24,
  },
  bodyLg: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 16,
    lineHeight: 24,
  },
  bodyMd: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  bodySm: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  labelMd: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6, // 0.05em
  },
  labelSm: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 11,
    lineHeight: 14,
  },
};

export const Shadows = {
  // Soft ambient shadows using Deep Navy #1a2a33
  level1: {
    borderWidth: 1,
    borderColor: '#c3c7cb22',
  },
  level2: {
    shadowColor: '#1a2a33',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
  },
  level3: {
    shadowColor: '#1a2a33',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 6,
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
