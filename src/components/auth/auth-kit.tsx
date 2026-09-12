/**
 * auth-kit.tsx
 *
 * Shared pieces of the landing, sign-in and sign-up screens, in the dashboard
 * card language (components/dashboard/analytics-kit.tsx): the brand mark, a
 * labelled input, the primary button, the error banner, the divider and the
 * social row.
 */

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText, MAX_FONT_SCALE } from '@/components/themed-text';
import { BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ACCENTS } from '@/constants/dashboard-accents';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

// ─── Brand ────────────────────────────────────────────────────────────────────

export function AuthBrand({ compact = false }: { compact?: boolean }) {
  const theme = useTheme();
  return (
    <View style={styles.brand} accessibilityRole="header" accessibilityLabel="NonStricker">
      <View
        style={[
          compact ? styles.brandTileCompact : styles.brandTile,
          { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' },
          Shadows.level1,
        ]}
      >
        <Image
          source={require('@/assets/images/illustrations/nonstricker_auth_logo.png')}
          style={compact ? styles.brandImageCompact : styles.brandImage}
          contentFit="contain"
        />
      </View>
      <View>
        <ThemedText style={[compact ? styles.brandNameCompact : styles.brandName, { color: theme.text }]}>
          NonStricker
        </ThemedText>
        {!compact && (
          <ThemedText style={[styles.brandTag, { color: theme.textSecondary }]}>YOUR SPORTS PLATFORM</ThemedText>
        )}
      </View>
    </View>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────

export function AuthInput({
  label,
  icon,
  right,
  verified = false,
  invalid = false,
  style,
  onFocus,
  onBlur,
  ...props
}: TextInputProps & {
  label: string;
  icon: IoniconName;
  /** After the text, e.g. a show-password toggle or a Send OTP link. */
  right?: React.ReactNode;
  verified?: boolean;
  invalid?: boolean;
}) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const borderColor = invalid
    ? ACCENTS.red.main
    : verified
      ? ACCENTS.green.main + '99'
      : focused
        ? theme.primary
        : theme.outlineVariant + '44';

  return (
    <View>
      <ThemedText style={[styles.label, { color: theme.textSecondary }]}>{label}</ThemedText>
      <View style={[styles.inputRow, { backgroundColor: theme.surfaceLow, borderColor }]}>
        <Ionicons name={icon} size={17} color={focused ? theme.primary : theme.textSecondary} />
        <TextInput
          maxFontSizeMultiplier={MAX_FONT_SCALE}
          placeholderTextColor={theme.textSecondary + '88'}
          accessibilityLabel={label}
          {...props}
          style={[
            styles.input,
            { color: theme.text },
            Platform.OS === 'web' && ({ outlineStyle: 'none', outlineWidth: 0 } as any),
            style,
          ]}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
        />
        {right}
      </View>
    </View>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────

export function AuthButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  icon,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: IoniconName;
}) {
  const theme = useTheme();
  const blocked = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={blocked}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: blocked, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: theme.primary, opacity: disabled && !loading ? 0.5 : pressed ? 0.9 : 1 },
        Shadows.level2,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#ffffff" />
      ) : (
        <>
          <ThemedText style={styles.buttonText}>{label}</ThemedText>
          {icon && <Ionicons name={icon} size={16} color="#ffffff" />}
        </>
      )}
    </Pressable>
  );
}

// ─── Error, divider, social ───────────────────────────────────────────────────

export function AuthError({ message }: { message: string }) {
  return (
    <View
      style={[styles.error, { backgroundColor: ACCENTS.red.main + '14', borderColor: ACCENTS.red.main + '33' }]}
      accessibilityRole="alert"
    >
      <Ionicons name="alert-circle" size={16} color={ACCENTS.red.main} />
      <ThemedText style={[styles.errorText, { color: ACCENTS.red.dark }]}>{message}</ThemedText>
    </View>
  );
}

export function AuthDivider({ label }: { label: string }) {
  const theme = useTheme();
  return (
    <View style={styles.divider}>
      <View style={[styles.dividerLine, { backgroundColor: theme.outlineVariant + '44' }]} />
      <ThemedText style={[styles.dividerText, { color: theme.textSecondary }]}>{label}</ThemedText>
      <View style={[styles.dividerLine, { backgroundColor: theme.outlineVariant + '44' }]} />
    </View>
  );
}

export function SocialRow() {
  const theme = useTheme();
  const tile = [
    styles.social,
    { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' },
    Shadows.level1,
  ];
  return (
    <View style={styles.socialRow}>
      <Pressable style={tile} accessibilityRole="button" accessibilityLabel="Continue with Google">
        <Image
          source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/120px-Google_%22G%22_logo.svg.png' }}
          style={styles.socialImage}
        />
      </Pressable>
      <Pressable style={tile} accessibilityRole="button" accessibilityLabel="Continue with Apple">
        <Ionicons name="logo-apple" size={20} color={theme.text} />
      </Pressable>
      <Pressable style={tile} accessibilityRole="button" accessibilityLabel="Continue with Facebook">
        <Ionicons name="logo-facebook" size={20} color="#1877F2" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandTile: { width: 48, height: 48, borderRadius: BorderRadius.premium, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  brandTileCompact: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  brandImage: { width: 36, height: 36 },
  brandImageCompact: { width: 24, height: 24 },
  brandName: { fontSize: 15, fontFamily: 'Sora_600SemiBold', letterSpacing: 0.2 },
  brandNameCompact: { fontSize: 14, fontFamily: 'Sora_600SemiBold', letterSpacing: 0.2 },
  brandTag: { fontSize: 9, fontFamily: 'Sora_700Bold', letterSpacing: 1.2, marginTop: 1 },

  label: { fontSize: 10.5, fontFamily: 'Sora_500Medium', letterSpacing: 0.2, marginBottom: 5, marginLeft: 2 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 46,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
  },
  input: { flex: 1, minWidth: 0, height: '100%', fontSize: 13.5, fontFamily: 'Sora_500Medium', includeFontPadding: false },

  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: BorderRadius.premium,
  },
  buttonText: { color: '#ffffff', fontSize: 13.5, fontFamily: 'Sora_600SemiBold', letterSpacing: 0.2 },

  error: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, padding: 10 },
  errorText: { flex: 1, fontSize: 11.5, lineHeight: 16, fontFamily: 'Sora_500Medium' },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 11, fontFamily: 'Sora_400Regular' },

  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 14 },
  social: { width: 48, height: 48, borderRadius: BorderRadius.premium, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  socialImage: { width: 20, height: 20 },
});
