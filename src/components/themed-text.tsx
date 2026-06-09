import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Typography, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?:
    | 'default'
    | 'title'
    | 'small'
    | 'smallBold'
    | 'subtitle'
    | 'link'
    | 'linkPrimary'
    | 'code'
    // Design System Specific Types
    | 'displayLg'
    | 'displayLgMobile'
    | 'headlineLg'
    | 'headlineMd'
    | 'headlineSm'
    | 'bodyLg'
    | 'bodyMd'
    | 'bodySm'
    | 'labelMd'
    | 'labelSm';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        type === 'default' && styles.bodyMd,
        type === 'title' && styles.displayLgMobile,
        type === 'small' && styles.labelSm,
        type === 'smallBold' && styles.labelMd,
        type === 'subtitle' && styles.headlineSm,
        
        // Brand tokens
        type === 'displayLg' && styles.displayLg,
        type === 'displayLgMobile' && styles.displayLgMobile,
        type === 'headlineLg' && styles.headlineLg,
        type === 'headlineMd' && styles.headlineMd,
        type === 'headlineSm' && styles.headlineSm,
        type === 'bodyLg' && styles.bodyLg,
        type === 'bodyMd' && styles.bodyMd,
        type === 'bodySm' && styles.bodySm,
        type === 'labelMd' && styles.labelMd,
        type === 'labelSm' && styles.labelSm,

        // Defaults/Fallback
        type === 'link' && styles.link,
        type === 'linkPrimary' && styles.linkPrimary,
        type === 'code' && styles.code,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  displayLg: {
    fontFamily: Typography.fontFamilies.hankenExtraBold,
    fontSize: Typography.displayLg.fontSize,
    lineHeight: Typography.displayLg.lineHeight,
    letterSpacing: Typography.displayLg.letterSpacing,
  },
  displayLgMobile: {
    fontFamily: Typography.fontFamilies.hankenBold,
    fontSize: Typography.displayLgMobile.fontSize,
    lineHeight: Typography.displayLgMobile.lineHeight,
    letterSpacing: Typography.displayLgMobile.letterSpacing,
  },
  headlineLg: {
    fontFamily: Typography.fontFamilies.hankenBold,
    fontSize: Typography.headlineLg.fontSize,
    lineHeight: Typography.headlineLg.lineHeight,
    letterSpacing: Typography.headlineLg.letterSpacing,
  },
  headlineMd: {
    fontFamily: Typography.fontFamilies.hankenSemiBold,
    fontSize: Typography.headlineMd.fontSize,
    lineHeight: Typography.headlineMd.lineHeight,
    letterSpacing: Typography.headlineMd.letterSpacing,
  },
  headlineSm: {
    fontFamily: Typography.fontFamilies.hankenSemiBold,
    fontSize: Typography.headlineSm.fontSize,
    lineHeight: Typography.headlineSm.lineHeight,
  },
  bodyLg: {
    fontFamily: Typography.fontFamilies.hankenRegular,
    fontSize: Typography.bodyLg.fontSize,
    lineHeight: Typography.bodyLg.lineHeight,
  },
  bodyMd: {
    fontFamily: Typography.fontFamilies.hankenRegular,
    fontSize: Typography.bodyMd.fontSize,
    lineHeight: Typography.bodyMd.lineHeight,
  },
  bodySm: {
    fontFamily: Typography.fontFamilies.hankenRegular,
    fontSize: Typography.bodySm.fontSize,
    lineHeight: Typography.bodySm.lineHeight,
  },
  labelMd: {
    fontFamily: Typography.fontFamilies.jakartaBold,
    fontSize: Typography.labelMd.fontSize,
    lineHeight: Typography.labelMd.lineHeight,
    letterSpacing: Typography.labelMd.letterSpacing,
    textTransform: 'uppercase', // Often stylized in small caps
  },
  labelSm: {
    fontFamily: Typography.fontFamilies.jakartaMedium,
    fontSize: Typography.labelSm.fontSize,
    lineHeight: Typography.labelSm.lineHeight,
  },
  link: {
    fontFamily: Typography.fontFamilies.hankenRegular,
    fontSize: 14,
    lineHeight: 20,
  },
  linkPrimary: {
    fontFamily: Typography.fontFamilies.hankenSemiBold,
    fontSize: 14,
    lineHeight: 20,
    color: '#3c87f7',
  },
  code: {
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    fontSize: 12,
  },
});
