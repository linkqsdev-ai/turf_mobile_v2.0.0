/**
 * platform-helpers.ts
 * Cross-platform utilities for React Native styling.
 * Handles iOS vs Android differences transparently.
 */

import { Platform, ViewStyle } from 'react-native';

export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
export const isWeb = Platform.OS === 'web';

/**
 * Returns the appropriate shadow style for a given level.
 * iOS: uses shadowColor/Offset/Opacity/Radius
 * Android: uses elevation only
 */
export function getShadow(level: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'fab' | 'primary'): ViewStyle {
  if (isAndroid) {
    const elevationMap = { xs: 1, sm: 2, md: 4, lg: 6, xl: 10, fab: 10, primary: 6 };
    return { elevation: elevationMap[level] };
  }

  switch (level) {
    case 'xs':
      return { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 };
    case 'sm':
      return { shadowColor: '#1a2a33', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 };
    case 'md':
      return { shadowColor: '#1a2a33', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.09, shadowRadius: 16 };
    case 'lg':
      return { shadowColor: '#1a2a33', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.14, shadowRadius: 24 };
    case 'xl':
      return { shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.18, shadowRadius: 32 };
    case 'fab':
      return { shadowColor: 'rgb(16, 185, 129)', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 16 };
    case 'primary':
      return { shadowColor: '#5D68E8', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 14 };
    default:
      return {};
  }
}

/**
 * Returns card style — white card with rounded corners and shadow
 */
export function getCardStyle(backgroundColor = '#ffffff', radius = 16): ViewStyle {
  return {
    backgroundColor,
    borderRadius: radius,
    ...getShadow('md'),
  };
}

/**
 * Returns focused input shadow style
 */
export function getInputFocusStyle(focused: boolean, primaryColor: string): ViewStyle {
  if (!focused) return {};
  return isIOS
    ? { shadowColor: primaryColor, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: 6, borderColor: primaryColor }
    : { elevation: 2, borderColor: primaryColor };
}
