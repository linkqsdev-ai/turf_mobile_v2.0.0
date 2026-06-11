import { Platform } from 'react-native';

export const Colors = {
  light: {
    background: '#f4f4f7', // Premium Technical Light
    text: '#111c2c', // on-surface
    textSecondary: '#43474b', // on-surface-variant
    
    backgroundElement: '#f0f3ff', // Compatibility link to surfaceLow
    backgroundSelected: '#e7eeff', // Compatibility link to surface
    
    primary: '#05151e', // Navy/Black anchor
    onPrimary: '#ffffff',
    primaryContainer: '#1a2a33', // Deep Navy
    onPrimaryContainer: '#81919c',
    
    secondary: '#835500', // Gold/Bronze highlight
    secondaryContainer: '#feae2c', // Vibrant Gold
    onSecondaryContainer: '#6b4500',
    
    surfaceLowest: '#ffffff', // Lowest container (cards)
    surfaceLow: '#f0f3ff',
    surface: '#e7eeff',
    surfaceHigh: '#dee8ff',
    surfaceHighest: '#d8e3fa',
    
    outline: '#73787b',
    outlineVariant: '#c3c7cb',
    error: '#ba1a1a',
    errorContainer: '#ffdad6',
  },
  dark: {
    background: '#f4f4f7', // Premium Technical Light
    text: '#111c2c', // on-surface
    textSecondary: '#43474b', // on-surface-variant
    
    backgroundElement: '#f0f3ff', // Compatibility link to surfaceLow
    backgroundSelected: '#e7eeff', // Compatibility link to surface
    
    primary: '#05151e', // Navy/Black anchor
    onPrimary: '#ffffff',
    primaryContainer: '#1a2a33', // Deep Navy
    onPrimaryContainer: '#81919c',
    
    secondary: '#835500', // Gold/Bronze highlight
    secondaryContainer: '#feae2c', // Vibrant Gold
    onSecondaryContainer: '#6b4500',
    
    surfaceLowest: '#ffffff', // Lowest container (cards)
    surfaceLow: '#f0f3ff',
    surface: '#e7eeff',
    surfaceHigh: '#dee8ff',
    surfaceHighest: '#d8e3fa',
    
    outline: '#73787b',
    outlineVariant: '#c3c7cb',
    error: '#ba1a1a',
    errorContainer: '#ffdad6',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;

export const Typography = {
  fontFamilies: {
    hankenRegular: 'HankenGrotesk_400Regular',
    hankenMedium: 'HankenGrotesk_500Medium',
    hankenSemiBold: 'HankenGrotesk_600SemiBold',
    hankenBold: 'HankenGrotesk_700Bold',
    hankenExtraBold: 'HankenGrotesk_800ExtraBold',
    jakartaMedium: 'PlusJakartaSans_500Medium',
    jakartaBold: 'PlusJakartaSans_700Bold',
  },
  // Scale styles mapped from DESIGN.md
  displayLg: {
    fontFamily: 'HankenGrotesk_800ExtraBold',
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.64, // -0.02em
  },
  displayLgMobile: {
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.52,
  },
  headlineLg: {
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.28, // -0.01em
  },
  headlineMd: {
    fontFamily: 'HankenGrotesk_600SemiBold',
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  headlineSm: {
    fontFamily: 'HankenGrotesk_600SemiBold',
    fontSize: 18,
    lineHeight: 24,
  },
  bodyLg: {
    fontFamily: 'HankenGrotesk_400Regular',
    fontSize: 16,
    lineHeight: 24,
  },
  bodyMd: {
    fontFamily: 'HankenGrotesk_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  bodySm: {
    fontFamily: 'HankenGrotesk_400Regular',
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
