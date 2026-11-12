import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { ThemedText, MAX_FONT_SCALE } from '@/components/themed-text';
import { Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useUserProfile } from '@/hooks/use-user-profile';
import { apiClient, setAuthToken } from '@/services/api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useToast } from '@/context/ToastContext';
import { formatPhoneNumber, cleanPhoneDigits, getPhoneValidationError, isValidMobile } from '@/utils/phone-utils';
import { StatusBar } from 'expo-status-bar';
import { BRAND, BRAND_LOGO_ASPECT } from '@/constants/brand';
import { AnimatedBrandLogo } from '@/components/brand/animated-brand-logo';
import { ACCENTS } from '@/constants/dashboard-accents';

const DEMO_ACCOUNTS = [
  { role: 'Player', phone: '9876543210', icon: 'person-outline' },
  { role: 'Coach', phone: '9876543211', icon: 'fitness-outline' },
  { role: 'Owner', phone: '9876543212', icon: 'business-outline' },
  { role: 'Organizer', phone: '9876543213', icon: 'calendar-outline' },
  { role: 'Super Admin', phone: '9876543214', icon: 'shield-checkmark-outline' },
];

export default function LoginScreen() {
  const theme    = useTheme();
  const router   = useRouter();
  const { updateProfile } = useUserProfile();
  const { showInfo, showSuccess, showError } = useToast();

  // OTP state
  const [phone, setPhone]           = useState('');
  const [otpStage, setOtpStage]     = useState<'phone' | 'otp_sent'>('phone');
  const [otpCode, setOtpCode]       = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [otpSentAt, setOtpSentAt]   = useState<number | null>(null);
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);
  const [isOtpFocused, setIsOtpFocused]     = useState(false);

  const [isLoading, setIsLoading]   = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ── Entrance animations (same pattern as landing.tsx) ──────────────────────
  // eslint-disable-next-line react-hooks/refs
  const logoAnim    = useRef(new Animated.Value(0)).current;
  // eslint-disable-next-line react-hooks/refs
  const cardAnim    = useRef(new Animated.Value(60)).current;
  // eslint-disable-next-line react-hooks/refs
  const cardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(cardAnim, {
        toValue: 0,
        duration: 850,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 850,
        useNativeDriver: true,
      }),
    ]).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // OTP countdown timer
  useEffect(() => {
    if (!otpSentAt) return;
    const id = setInterval(() => {
      setResendTimer((r) => (r <= 1 ? 0 : r - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [otpSentAt]);

  const handleSendOtp = async (overridePhone?: string | any) => {
    const targetPhone = typeof overridePhone === 'string' ? overridePhone : phone;
    const cleanPhone = cleanPhoneDigits(targetPhone);
    const valErr = getPhoneValidationError(cleanPhone, true);
    if (valErr) {
      setErrorMessage(valErr);
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);

    const demoCode = String(Math.floor(100000 + Math.random() * 900000));
    let finalOtp = demoCode;

    try {
      const res = await apiClient.post('/auth/otp/send', { phone: cleanPhone });
      if (res && res.code) {
        finalOtp = res.code;
      }
    } catch {
      // Demo fallback continues seamlessly
    }

    setGeneratedOtp(finalOtp);
    setIsLoading(false);
    setOtpStage('otp_sent');
    setOtpCode('');
    setResendTimer(30);
    setOtpSentAt(Date.now());
    showInfo('OTP Sent', `Verification code: ${finalOtp}`, 7000);
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      setErrorMessage('Please enter the 6-digit OTP code.');
      return;
    }
    if (otpCode !== generatedOtp && otpCode !== '123456') {
      setErrorMessage('Incorrect OTP code. Please try again.');
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);

    const cleanPhone = phone.replace(/[^0-9]/g, '');

    try {
      const response = await apiClient.post('/auth/otp/verify', {
        phone: cleanPhone,
        otp: otpCode,
      });

      if (response && response.token) {
        await setAuthToken(response.token);
        const userPayload = {
          name: response.user.name,
          role: response.user.role,
          location: response.user.location || 'London, UK',
          avatarUrl: response.user.avatarUrl || '',
        };
        await AsyncStorage.setItem('@turf_user_profile', JSON.stringify(userPayload));
        updateProfile({
          name: userPayload.name,
          role: userPayload.role as any,
          location: userPayload.location,
          avatarUrl: userPayload.avatarUrl || 'avatar_1',
        });
        showSuccess('Signed in successfully');
        router.replace('/(tabs)');
        return;
      }
    } catch (err: any) {
      console.warn('Remote OTP verify failed, fallback to local user profile:', err.message);
    }

    // Local device fallback
    try {
      const existingUsersStr = await AsyncStorage.getItem('@turf_users_db');
      const existingUsers = existingUsersStr ? JSON.parse(existingUsersStr) : [];
      const matchedUser = existingUsers.find((u: any) => u.phone && u.phone.replace(/[^0-9]/g, '') === cleanPhone);

      const demoUser = DEMO_ACCOUNTS.find(a => a.phone === cleanPhone);
      const role = demoUser ? demoUser.role : (matchedUser ? matchedUser.role : 'Player');
      const name = matchedUser ? matchedUser.name : (demoUser ? demoUser.role : `User ${cleanPhone.slice(-4)}`);

      const localToken = `local_token_${Date.now()}`;
      await setAuthToken(localToken);
      const userPayload = {
        name,
        role: role as any,
        location: 'London, UK',
        avatarUrl: '',
      };
      await AsyncStorage.setItem('@turf_user_profile', JSON.stringify(userPayload));
      updateProfile({
        name: userPayload.name,
        role: userPayload.role as any,
        location: userPayload.location,
        avatarUrl: 'avatar_1',
      });
      showSuccess('Signed in successfully');
      router.replace('/(tabs)');
    } catch {
      setErrorMessage('Failed to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Shared pieces ─────────────────────────────────────────────────────────
  const webInput = Platform.OS === 'web' ? ({ outlineStyle: 'none', outlineWidth: 0 } as any) : null;
  const fieldStyle = (focused: boolean) => [styles.field, { borderColor: focused ? BRAND.ink : BRAND.line }];
  const logoScale = logoAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] });

  const renderPrimary = (label: string, onPress: () => void, disabled: boolean) => (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, busy: isLoading }}
      style={({ pressed }) => [
        styles.primaryBtn,
        // A see-through navy reads as muddy olive on the yellow, so a disabled
        // button turns soft white instead; it stays navy while loading.
        disabled && !isLoading ? styles.primaryBtnDisabled : Shadows.level1,
        pressed && { opacity: 0.9 },
      ]}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={BRAND.yellow} />
      ) : (
        <ThemedText style={[styles.primaryBtnText, disabled && styles.primaryBtnTextDisabled]}>{label}</ThemedText>
      )}
    </Pressable>
  );

  const socialProviders = [
    { key: 'google', label: 'Google' },
    { key: 'apple', label: 'Apple' },
    { key: 'facebook', label: 'Facebook' },
  ] as const;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Brand ── */}
            <Animated.View style={[styles.hero, { opacity: logoAnim, transform: [{ scale: logoScale }] }]}>
              <AnimatedBrandLogo style={styles.logo} entrance={false} />
              <ThemedText style={styles.title}>Welcome back</ThemedText>
              <ThemedText style={styles.subtitle}>
                {otpStage === 'otp_sent'
                  ? `Enter the 6-digit code we sent to +91 ${formatPhoneNumber(phone).replace(/ /g, ' ')}`
                  : 'Sign in with your mobile number to book turfs, score matches and join tournaments.'}
              </ThemedText>
            </Animated.View>

            {/* ── Mobile OTP ── */}
            <Animated.View style={[styles.form, { opacity: cardOpacity, transform: [{ translateY: cardAnim }] }]}>
              {otpStage === 'phone' ? (
                <View>
                  <ThemedText style={styles.label}>Mobile Number</ThemedText>
                  <View style={fieldStyle(isPhoneFocused)}>
                    <ThemedText style={styles.prefix}>+91</ThemedText>
                    <View style={styles.prefixDivider} />
                    <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                      style={[styles.input, webInput]}
                      placeholder="Enter your mobile number"
                      placeholderTextColor={BRAND.inkMuted}
                      value={phone}
                      onChangeText={(t) => { setPhone(formatPhoneNumber(t)); setErrorMessage(null); }}
                      keyboardType="phone-pad"
                      maxLength={11}
                      accessibilityLabel="Mobile number"
                      onFocus={() => setIsPhoneFocused(true)}
                      onBlur={() => setIsPhoneFocused(false)}
                      onSubmitEditing={() => isValidMobile(phone) && handleSendOtp()}
                    />
                    {isValidMobile(phone) && <Ionicons name="checkmark-circle" size={18} color={ACCENTS.green.main} />}
                  </View>
                </View>
              ) : (
                <View>
                  <View style={styles.labelRow}>
                    <ThemedText style={[styles.label, styles.labelInline]}>Verification Code</ThemedText>
                    <Pressable
                      onPress={() => { setOtpStage('phone'); setOtpCode(''); setErrorMessage(null); }}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel="Change mobile number"
                    >
                      <ThemedText style={styles.link}>Change number</ThemedText>
                    </Pressable>
                  </View>
                  <View style={fieldStyle(isOtpFocused)}>
                    <Ionicons name="keypad-outline" size={17} color={isOtpFocused ? BRAND.ink : BRAND.inkMuted} />
                    <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                      style={[styles.input, !!otpCode && styles.otpInput, webInput]}
                      placeholder="Enter 6-digit code"
                      placeholderTextColor={BRAND.inkMuted}
                      value={otpCode}
                      onChangeText={(t) => { setOtpCode(t.replace(/[^0-9]/g, '')); setErrorMessage(null); }}
                      keyboardType="number-pad"
                      maxLength={6}
                      accessibilityLabel="One-time code"
                      onFocus={() => setIsOtpFocused(true)}
                      onBlur={() => setIsOtpFocused(false)}
                      onSubmitEditing={handleVerifyOtp}
                    />
                  </View>
                  <View style={styles.resendRow}>
                    {resendTimer > 0 ? (
                      <ThemedText style={styles.hint}>Resend code in {resendTimer}s</ThemedText>
                    ) : (
                      <Pressable onPress={() => handleSendOtp()} hitSlop={8} accessibilityRole="button">
                        <ThemedText style={styles.link}>Resend code</ThemedText>
                      </Pressable>
                    )}
                  </View>
                </View>
              )}

              {errorMessage && (
                <View style={styles.errorRow} accessibilityRole="alert">
                  <Ionicons name="alert-circle" size={14} color={BRAND.danger} />
                  <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
                </View>
              )}

              {otpStage === 'phone'
                ? renderPrimary('Get OTP', () => handleSendOtp(), !isValidMobile(phone) || isLoading)
                : renderPrimary('Verify & Sign In', handleVerifyOtp, isLoading)}

              {/* ── Or ── */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <ThemedText style={styles.dividerText}>Or</ThemedText>
                <View style={styles.dividerLine} />
              </View>

              {socialProviders.map((provider) => (
                <Pressable
                  key={provider.key}
                  accessibilityRole="button"
                  accessibilityLabel={`Continue with ${provider.label}`}
                  style={({ pressed }) => [styles.socialBtn, pressed && { opacity: 0.85 }]}
                >
                  {provider.key === 'google' ? (
                    <Image
                      source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/120px-Google_%22G%22_logo.svg.png' }}
                      style={styles.socialIcon}
                    />
                  ) : provider.key === 'apple' ? (
                    <Ionicons name="logo-apple" size={18} color={BRAND.ink} />
                  ) : (
                    <Ionicons name="logo-facebook" size={18} color="#1877F2" />
                  )}
                  <ThemedText style={styles.socialText}>Continue with {provider.label}</ThemedText>
                </Pressable>
              ))}
            </Animated.View>

            <View style={styles.spacer} />

            {/* ── Quick dev login + footer ── */}
            <View style={styles.bottom}>
              <ThemedText style={styles.devLabel}>Quick dev login</ThemedText>
              <View style={styles.devRow}>
                {DEMO_ACCOUNTS.map((acc) => {
                  const selected = cleanPhoneDigits(phone) === acc.phone;
                  return (
                    <Pressable
                      key={acc.role}
                      onPress={() => {
                        setPhone(formatPhoneNumber(acc.phone));
                        handleSendOtp(acc.phone);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Send the ${acc.role} demo OTP`}
                      style={[styles.devChip, selected && styles.devChipSelected]}
                    >
                      <Ionicons name={acc.icon as any} size={12} color={selected ? BRAND.yellow : BRAND.inkSoft} />
                      <ThemedText style={[styles.devChipText, selected && styles.devChipTextSelected]}>{acc.role}</ThemedText>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.footerRow}>
                <ThemedText style={styles.footerText}>Don&apos;t have an account? </ThemedText>
                <Pressable onPress={() => router.push('/signup')} hitSlop={8} accessibilityRole="link">
                  <ThemedText style={styles.footerLink}>Sign Up</ThemedText>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.yellow },
  flex: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 6, paddingBottom: 18 },

  // Brand
  hero: { alignItems: 'center' },
  logo: { width: '72%', maxWidth: 290, aspectRatio: BRAND_LOGO_ASPECT },
  title: {
    fontSize: 18,
    lineHeight: 30,
    fontFamily: 'Sora_600SemiBold',
    color: BRAND.ink,
    textAlign: 'center',
    letterSpacing: -0.2,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 12.5,
    lineHeight: 19,
    fontFamily: 'Sora_400Regular',
    color: BRAND.inkSoft,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 300,
  },

  // Form
  form: { marginTop: 22, gap: 14 },
  label: { fontSize: 12, fontFamily: 'Sora_500Medium', color: BRAND.ink, marginBottom: 7 },
  labelInline: { marginBottom: 0 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: BRAND.field,
  },
  input: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    fontSize: 13,
    fontFamily: 'Sora_400Regular',
    color: BRAND.ink,
    includeFontPadding: false,
  },
  otpInput: { fontSize: 15, letterSpacing: 4, fontFamily: 'Sora_500Medium' },
  prefix: { fontSize: 13, fontFamily: 'Sora_500Medium', color: BRAND.ink },
  prefixDivider: { width: 1, height: 20, backgroundColor: BRAND.line },
  resendRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
  hint: { fontSize: 11.5, fontFamily: 'Sora_400Regular', color: BRAND.inkSoft },
  link: { fontSize: 11.5, fontFamily: 'Sora_500Medium', color: BRAND.ink, textDecorationLine: 'underline' },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -4 },
  errorText: { flex: 1, fontSize: 11.5, fontFamily: 'Sora_500Medium', color: BRAND.danger },

  // Buttons
  primaryBtn: {
    height: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    backgroundColor: BRAND.ink,
  },
  primaryBtnText: { color: BRAND.yellow, fontSize: 13.5, fontFamily: 'Sora_500Medium' },
  primaryBtnDisabled: { backgroundColor: BRAND.fieldSoft },
  primaryBtnTextDisabled: { color: BRAND.inkMuted },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: BRAND.line },
  dividerText: { fontSize: 11.5, fontFamily: 'Sora_400Regular', color: BRAND.inkSoft },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 46,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.field,
  },
  socialIcon: { width: 18, height: 18 },
  socialText: { fontSize: 12.5, fontFamily: 'Sora_400Regular', color: BRAND.ink },

  // Bottom
  spacer: { flex: 1, minHeight: 20 },
  bottom: { gap: 10, alignItems: 'center' },
  devLabel: {
    fontSize: 9.5,
    fontFamily: 'Sora_500Medium',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: BRAND.inkSoft,
  },
  devRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
  devChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.fieldSoft,
  },
  devChipSelected: { backgroundColor: BRAND.ink, borderColor: BRAND.ink },
  devChipText: { fontSize: 10.5, fontFamily: 'Sora_400Regular', color: BRAND.inkSoft },
  devChipTextSelected: { color: BRAND.yellow },
  footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 6 },
  footerText: { fontSize: 12, fontFamily: 'Sora_400Regular', color: BRAND.inkSoft },
  footerLink: { fontSize: 12, fontFamily: 'Sora_600SemiBold', color: BRAND.ink, textDecorationLine: 'underline' },
});
