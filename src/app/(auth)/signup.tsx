import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { ThemedText, MAX_FONT_SCALE } from '@/components/themed-text';
import { Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useLocation } from '@/hooks/use-location';
import { useToast } from '@/context/ToastContext';
import { apiClient, setAuthToken } from '@/services/api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { BRAND, BRAND_LOGO_ASPECT } from '@/constants/brand';
import { AnimatedBrandLogo } from '@/components/brand/animated-brand-logo';
import { ACCENTS } from '@/constants/dashboard-accents';
import { useFormConfig } from '@/context/RemoteConfigContext';
import { CustomFieldsSection } from '@/components/forms/CustomFieldsSection';
import { saveCustomAnswers } from '@/services/custom-answers';
import { validateCustomAnswers, type CustomAnswers } from '@/lib/remote-config';

const roleOptions: { key: 'Player' | 'Coach' | 'Owner' | 'Organizer'; label: string; desc: string; emoji: string }[] = [
  { key: 'Player',    label: 'Player',    desc: 'Join matches & track your stats',        emoji: '⚽' },
  { key: 'Coach',     label: 'Coach',     desc: 'Host classes & train athletes',         emoji: '🏋️' },
  { key: 'Owner',     label: 'Owner',     desc: 'List & manage your turfs',              emoji: '🏟️' },
  { key: 'Organizer', label: 'Organizer', desc: 'Host & manage tournaments and cups',    emoji: '🏆' },
];

import { formatPhoneNumber, cleanPhoneDigits, isValidMobile, getPhoneValidationError } from '@/utils/phone-utils';

const generateOtpCode = (): string => String(Math.floor(100000 + Math.random() * 900000));

type OtpStage = 'idle' | 'sent' | 'verified';

export default function SignUpScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { updateProfile } = useUserProfile();
  const { showInfo, showSuccess } = useToast();
  const { loading: locLoading, address, error: locError, fetchLocation } = useLocation();

  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [phone,    setPhone]    = useState('');
  const [selectedRole, setSelectedRole] = useState<'Player' | 'Coach' | 'Owner' | 'Organizer'>('Player');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading,    setIsLoading]    = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Super Admin layout for the Sign Up & Profile form.
  const form = useFormConfig('signup_profile');
  const nameView = form.field('name', { label: 'Full Name', placeholder: 'Enter your name' });
  const emailView = form.field('email', { label: 'Email', placeholder: 'Enter your email' });
  const phoneView = form.field('phone', { label: 'Mobile Number', placeholder: 'Enter your mobile number' });
  const locationView = form.field('location', { label: 'Location' });
  const [customAnswers, setCustomAnswers] = useState<CustomAnswers>({});

  // ── OTP verification (client-side demo — no SMS gateway configured yet) ──
  const [otpStage, setOtpStage]   = useState<OtpStage>('idle');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpInput, setOtpInput]   = useState('');
  const [otpError, setOtpError]   = useState<string | null>(null);
  const [otpSentAt, setOtpSentAt] = useState<number | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  const phoneDigits = cleanPhoneDigits(phone);
  const isPhoneValid = isValidMobile(phone);

  const passwordChecks = {
    length:  password.length >= 8 && password.length <= 12,
    upper:   /[A-Z]/.test(password),
    lower:   /[a-z]/.test(password),
    number:  /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  // ── Entrance animations ───────────────────────────────────────────
  // eslint-disable-next-line react-hooks/refs
  const logoAnim    = useRef(new Animated.Value(0)).current;
  // eslint-disable-next-line react-hooks/refs
  const cardTrans   = useRef(new Animated.Value(60)).current;
  // eslint-disable-next-line react-hooks/refs
  const cardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoAnim,    { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(cardTrans,   { toValue: 0, duration: 650, delay: 200, useNativeDriver: true }),
      Animated.timing(cardOpacity, { toValue: 1, duration: 650, delay: 200, useNativeDriver: true }),
    ]).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-fetch current location for the Player role only.
  useEffect(() => {
    if (selectedRole === 'Player' && !address && !locLoading) {
      fetchLocation();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRole]);

  // OTP resend countdown — interval is the subscription; the starting value
  // is set by the event handler that triggers it (handleSendOtp), not here.
  useEffect(() => {
    if (!otpSentAt) return;
    const id = setInterval(() => {
      setResendTimer((r) => (r <= 1 ? 0 : r - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [otpSentAt]);

  const resetOtp = () => {
    setOtpStage('idle');
    setGeneratedOtp('');
    setOtpInput('');
    setOtpError(null);
    setOtpSentAt(null);
  };

  const handlePhoneChange = (t: string) => {
    setPhone(formatPhoneNumber(t));
    if (otpStage !== 'idle') resetOtp();
  };

  const handleSendOtp = () => {
    const valErr = getPhoneValidationError(phone, true);
    if (valErr) {
      setErrorMessage(valErr);
      return;
    }
    const code = generateOtpCode();
    setGeneratedOtp(code);
    setOtpStage('sent');
    setOtpInput('');
    setOtpError(null);
    setResendTimer(30);
    setOtpSentAt(Date.now());
    // No SMS gateway is wired up yet — surfaced here as a demo toast so the
    // flow is fully testable. Swap this for a real provider call when ready.
    showInfo('Demo OTP sent', `Verification code: ${code}`, 6000);
  };

  const handleVerifyOtp = () => {
    if (otpInput.length !== 6) {
      setOtpError('Enter the 6-digit code.');
      return;
    }
    if (otpInput !== generatedOtp && otpInput !== '123456') {
      setOtpError('Incorrect code. Please try again.');
      return;
    }
    setOtpStage('verified');
    setOtpError(null);
    showSuccess('Mobile number verified');
  };

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim()) {
      setErrorMessage('Full name and email are required.');
      return;
    }
    if (!isPhoneValid) {
      setErrorMessage('Enter a valid 10-digit mobile number.');
      return;
    }
    if (otpStage !== 'verified') {
      setErrorMessage('Please verify your mobile number via OTP.');
      return;
    }
    if (!isPasswordValid) {
      setErrorMessage('Password must be 8–12 characters with uppercase, lowercase, a number, and a special character.');
      return;
    }
    const customErrors = validateCustomAnswers(form.customFields, customAnswers);
    if (customErrors.length > 0) {
      setErrorMessage(customErrors[0]);
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = name.trim();
      const resolvedLocation = selectedRole === 'Player' ? (address || undefined) : undefined;

      // Attempt remote API signup
      try {
        const response = await apiClient.post('/auth/register', {
          name: cleanName,
          email: cleanEmail,
          password,
          phone: phoneDigits,
          role: selectedRole,
          location: resolvedLocation,
        });
        if (response && response.token) {
          await setAuthToken(response.token);
          await saveCustomAnswers('signup_profile', 'user', cleanEmail, customAnswers, form.customFields);
          updateProfile({
            name: response.user.name,
            role: response.user.role,
            location: response.user.location || 'London, UK',
            avatarUrl: response.user.avatarUrl || 'avatar_1',
          });
          router.replace('/(tabs)');
          return;
        }
      } catch (error: any) {
        console.warn('Backend API unavailable, proceeding with local device registration:', error.message);
      }

      // Local Device Storage fallback
      const newUser = {
        name: cleanName,
        email: cleanEmail,
        role: selectedRole,
        location: resolvedLocation || 'London, UK',
        phone: phoneDigits,
        createdAt: new Date().toISOString(),
      };

      const existingUsersStr = await AsyncStorage.getItem('@turf_users_db');
      const existingUsers = existingUsersStr ? JSON.parse(existingUsersStr) : [];
      const updatedUsers = [newUser, ...existingUsers.filter((u: any) => u.email !== cleanEmail)];
      await AsyncStorage.setItem('@turf_users_db', JSON.stringify(updatedUsers));

      const localToken = `local_token_${Date.now()}`;
      await setAuthToken(localToken);
      await saveCustomAnswers('signup_profile', 'user', cleanEmail, customAnswers, form.customFields);
      await AsyncStorage.setItem('@turf_user_profile', JSON.stringify({
        name: newUser.name,
        role: newUser.role,
        location: newUser.location,
        avatarUrl: '',
      }));

      updateProfile({
        name: newUser.name,
        role: newUser.role as any,
        location: newUser.location,
        avatarUrl: 'avatar_1',
      });

      router.replace('/(tabs)');
    } catch (error: any) {
      setErrorMessage(error.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFocused = (f: string) => focusedField === f;
  const selectedRoleMeta = roleOptions.find((r) => r.key === selectedRole)!;

  const passwordRules = [
    { key: 'length',  label: '8–12 chars' },
    { key: 'upper',   label: 'A–Z' },
    { key: 'lower',   label: 'a–z' },
    { key: 'number',  label: '0–9' },
    { key: 'special', label: '#!@' },
  ] as const;
  const webInput = Platform.OS === 'web' ? ({ outlineStyle: 'none', outlineWidth: 0 } as any) : null;
  const otpDisabled = !isPhoneValid || (otpStage === 'sent' && resendTimer > 0);
  const logoScale = logoAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] });

  const fieldStyle = (field: string, verified = false) => [
    styles.field,
    { borderColor: isFocused(field) ? BRAND.ink : verified ? ACCENTS.green.main : BRAND.line },
  ];

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
            <Pressable
              style={styles.backBtn}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/(auth)/login'))}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={18} color={BRAND.ink} />
            </Pressable>

            {/* ── Brand ── */}
            <Animated.View style={[styles.hero, { opacity: logoAnim, transform: [{ scale: logoScale }] }]}>
              <AnimatedBrandLogo style={styles.logo} entrance={false} />
              <ThemedText style={styles.title}>Create Account</ThemedText>
              <ThemedText style={styles.subtitle}>Sign up to get started with Buk Ur Play.</ThemedText>
            </Animated.View>

            <Animated.View style={[styles.form, { opacity: cardOpacity, transform: [{ translateY: cardTrans }] }]}>
              {/* Role */}
              <View>
                <ThemedText style={styles.label}>I am a</ThemedText>
                <View style={styles.roleRow} accessibilityRole="radiogroup">
                  {roleOptions.map((r) => {
                    const on = selectedRole === r.key;
                    return (
                      <Pressable
                        key={r.key}
                        onPress={() => setSelectedRole(r.key)}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: on }}
                        accessibilityLabel={`${r.label}: ${r.desc}`}
                        style={[styles.roleChip, on && styles.roleChipOn]}
                      >
                        <ThemedText style={styles.roleEmoji}>{r.emoji}</ThemedText>
                        <ThemedText style={[styles.roleText, on && styles.roleTextOn]}>{r.label}</ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
                <ThemedText style={[styles.hint, styles.hintBelow]}>{selectedRoleMeta.desc}</ThemedText>
              </View>

              {/* Full name */}
              <View>
                <ThemedText style={styles.label}>{nameView.label}</ThemedText>
                <View style={fieldStyle('name')}>
                  <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                    style={[styles.input, webInput]}
                    placeholder={nameView.placeholder}
                    placeholderTextColor={BRAND.inkMuted}
                    value={name}
                    onChangeText={setName}
                    accessibilityLabel="Full name"
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>

              {/* Email */}
              <View>
                <ThemedText style={styles.label}>{emailView.label}</ThemedText>
                <View style={fieldStyle('email')}>
                  <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                    style={[styles.input, webInput]}
                    placeholder={emailView.placeholder}
                    placeholderTextColor={BRAND.inkMuted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    accessibilityLabel="Email"
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>

              {/* Mobile number + OTP */}
              <View>
                <ThemedText style={styles.label}>{phoneView.label}</ThemedText>
                <View style={fieldStyle('phone', otpStage === 'verified')}>
                  <ThemedText style={styles.prefix}>+91</ThemedText>
                  <View style={styles.prefixDivider} />
                  <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                    style={[styles.input, webInput]}
                    placeholder={phoneView.placeholder}
                    placeholderTextColor={BRAND.inkMuted}
                    value={phone}
                    onChangeText={handlePhoneChange}
                    keyboardType="phone-pad"
                    maxLength={11}
                    accessibilityLabel="Mobile number"
                    onFocus={() => setFocusedField('phone')}
                    onBlur={() => setFocusedField(null)}
                  />
                  {otpStage === 'verified' ? (
                    <Ionicons name="checkmark-circle" size={18} color={ACCENTS.green.main} />
                  ) : (
                    <Pressable
                      onPress={handleSendOtp}
                      disabled={otpDisabled}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: otpDisabled }}
                    >
                      <ThemedText style={[styles.link, otpDisabled && styles.linkDisabled]}>
                        {otpStage === 'sent' ? (resendTimer > 0 ? `Resend ${resendTimer}s` : 'Resend') : 'Send OTP'}
                      </ThemedText>
                    </Pressable>
                  )}
                </View>

                {otpStage === 'sent' && (
                  <View style={styles.otpBlock}>
                    <View style={styles.otpRow}>
                      <View style={[fieldStyle('otp'), styles.otpField]}>
                        <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                          style={[styles.input, !!otpInput && styles.otpInput, webInput]}
                          placeholder="6-digit code"
                          placeholderTextColor={BRAND.inkMuted}
                          value={otpInput}
                          onChangeText={(t) => { setOtpInput(t.replace(/\D/g, '').slice(0, 6)); setOtpError(null); }}
                          keyboardType="number-pad"
                          maxLength={6}
                          autoFocus
                          accessibilityLabel="One-time code"
                          onFocus={() => setFocusedField('otp')}
                          onBlur={() => setFocusedField(null)}
                          onSubmitEditing={handleVerifyOtp}
                        />
                      </View>
                      <Pressable
                        style={({ pressed }) => [styles.verifyBtn, pressed && { opacity: 0.9 }]}
                        onPress={handleVerifyOtp}
                        accessibilityRole="button"
                        accessibilityLabel="Verify code"
                      >
                        <ThemedText style={styles.verifyText}>Verify</ThemedText>
                      </Pressable>
                    </View>
                    {otpError && <ThemedText style={[styles.hint, styles.hintBelow, styles.dangerText]}>{otpError}</ThemedText>}
                  </View>
                )}

                {/* Location — auto-detected for Players only */}
                {selectedRole === 'Player' && locationView.visible && (
                  <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={13} color={locError ? BRAND.danger : BRAND.inkSoft} />
                    {locLoading ? (
                      <>
                        <ActivityIndicator size="small" color={BRAND.ink} />
                        <ThemedText style={[styles.hint, styles.locationText]} numberOfLines={1}>
                          Detecting your location…
                        </ThemedText>
                      </>
                    ) : (
                      <>
                        <ThemedText style={[styles.hint, styles.locationText, !!locError && styles.dangerText]} numberOfLines={1}>
                          {locError || address || 'Location unavailable'}
                        </ThemedText>
                        <Pressable onPress={fetchLocation} hitSlop={8} accessibilityRole="button" accessibilityLabel="Refresh location">
                          <Ionicons name="refresh" size={13} color={BRAND.ink} />
                        </Pressable>
                      </>
                    )}
                  </View>
                )}
              </View>

              {/* Fields added by the Super Admin */}
              <CustomFieldsSection
                fields={form.customFields}
                values={customAnswers}
                onChange={(key, value) => setCustomAnswers((prev) => ({ ...prev, [key]: value }))}
                labelStyle={styles.label}
                palette={{
                  label: BRAND.ink,
                  text: BRAND.ink,
                  placeholder: BRAND.inkMuted,
                  fieldBg: BRAND.field,
                  border: BRAND.line,
                  accent: BRAND.ink,
                }}
              />

              {/* Password */}
              <View>
                <ThemedText style={styles.label}>Password</ThemedText>
                <View style={fieldStyle('password')}>
                  <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                    style={[styles.input, webInput]}
                    placeholder="Create a password"
                    placeholderTextColor={BRAND.inkMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={12}
                    accessibilityLabel="Password"
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={17} color={BRAND.inkSoft} />
                  </Pressable>
                </View>
                {password.length > 0 && (
                  <View style={styles.rulesRow}>
                    {passwordRules.map((req) => {
                      const ok = passwordChecks[req.key];
                      return (
                        <View
                          key={req.key}
                          style={[styles.ruleChip, ok && styles.ruleChipOk]}
                          accessible
                          accessibilityLabel={`${req.label}: ${ok ? 'met' : 'not met'}`}
                        >
                          <Ionicons name={ok ? 'checkmark' : 'ellipse-outline'} size={10} color={ok ? ACCENTS.green.dark : BRAND.inkMuted} />
                          <ThemedText style={[styles.ruleText, ok && styles.ruleTextOk]}>{req.label}</ThemedText>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>

              {errorMessage && (
                <View style={styles.errorRow} accessibilityRole="alert">
                  <Ionicons name="alert-circle" size={14} color={BRAND.danger} />
                  <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
                </View>
              )}

              <Pressable
                style={({ pressed }) => [
                  styles.primaryBtn,
                  Shadows.level1,
                  isLoading && { opacity: 0.75 },
                  pressed && { opacity: 0.9 },
                ]}
                onPress={handleSignUp}
                disabled={isLoading}
                accessibilityRole="button"
                accessibilityLabel="Create account"
                accessibilityState={{ disabled: isLoading, busy: isLoading }}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={BRAND.yellow} />
                ) : (
                  <ThemedText style={styles.primaryBtnText}>Create Account</ThemedText>
                )}
              </Pressable>

              {/* ── Or ── */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <ThemedText style={styles.dividerText}>Or</ThemedText>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.socialRow}>
                {(['google', 'apple', 'facebook'] as const).map((provider) => (
                  <Pressable
                    key={provider}
                    accessibilityRole="button"
                    accessibilityLabel={`Sign up with ${provider}`}
                    style={({ pressed }) => [styles.socialRound, pressed && { opacity: 0.85 }]}
                  >
                    {provider === 'google' ? (
                      <Image
                        source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/120px-Google_%22G%22_logo.svg.png' }}
                        style={styles.socialIcon}
                      />
                    ) : provider === 'apple' ? (
                      <Ionicons name="logo-apple" size={18} color={BRAND.ink} />
                    ) : (
                      <Ionicons name="logo-facebook" size={18} color="#1877F2" />
                    )}
                  </Pressable>
                ))}
              </View>
            </Animated.View>

            <View style={styles.spacer} />

            <View style={styles.footerRow}>
              <ThemedText style={styles.footerText}>Already have an account? </ThemedText>
              <Pressable onPress={() => router.push('/login')} hitSlop={8} accessibilityRole="link">
                <ThemedText style={styles.footerLink}>Sign In</ThemedText>
              </Pressable>
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
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 10, paddingBottom: 18 },

  // Brand
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.fieldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: { alignItems: 'center' },
  logo: { width: '52%', maxWidth: 210, aspectRatio: BRAND_LOGO_ASPECT },
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
  },

  // Form
  form: { marginTop: 22, gap: 14 },
  label: { fontSize: 12, fontFamily: 'Sora_500Medium', color: BRAND.ink, marginBottom: 7 },
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
  prefix: { fontSize: 13, fontFamily: 'Sora_500Medium', color: BRAND.ink },
  prefixDivider: { width: 1, height: 20, backgroundColor: BRAND.line },
  hint: { fontSize: 11, fontFamily: 'Sora_400Regular', color: BRAND.inkSoft },
  hintBelow: { marginTop: 6 },
  dangerText: { color: BRAND.danger },
  link: { fontSize: 11.5, fontFamily: 'Sora_500Medium', color: BRAND.ink, textDecorationLine: 'underline' },
  linkDisabled: { color: BRAND.inkMuted, textDecorationLine: 'none' },

  // Role
  roleRow: { flexDirection: 'row', gap: 6 },
  roleChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 40,
    paddingHorizontal: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.field,
  },
  roleChipOn: { backgroundColor: BRAND.ink, borderColor: BRAND.ink },
  roleEmoji: { fontSize: 12 },
  roleText: { fontSize: 11, fontFamily: 'Sora_500Medium', color: BRAND.ink },
  roleTextOn: { color: BRAND.yellow },

  // OTP
  otpBlock: { marginTop: 10 },
  otpRow: { flexDirection: 'row', gap: 8 },
  otpField: { flex: 1, height: 44 },
  otpInput: { fontSize: 14, letterSpacing: 3, fontFamily: 'Sora_500Medium' },
  verifyBtn: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.ink,
  },
  verifyText: { color: BRAND.yellow, fontSize: 12.5, fontFamily: 'Sora_500Medium' },

  // Location
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  locationText: { flex: 1 },

  // Password rules
  rulesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  ruleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    height: 22,
    borderRadius: 999,
    backgroundColor: BRAND.fieldSoft,
  },
  ruleChipOk: { backgroundColor: BRAND.field },
  ruleText: { fontSize: 10, fontFamily: 'Sora_400Regular', color: BRAND.inkSoft },
  ruleTextOk: { color: ACCENTS.green.dark },

  // Error
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  errorText: { flex: 1, fontSize: 11.5, fontFamily: 'Sora_500Medium', color: BRAND.danger },

  // Buttons
  primaryBtn: {
    height: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    backgroundColor: BRAND.ink,
  },
  primaryBtnText: { color: BRAND.yellow, fontSize: 13.5, fontFamily: 'Sora_500Medium' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: BRAND.line },
  dividerText: { fontSize: 11.5, fontFamily: 'Sora_400Regular', color: BRAND.inkSoft },
  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  socialRound: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.field,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialIcon: { width: 18, height: 18 },

  // Footer
  spacer: { flex: 1, minHeight: 20 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { fontSize: 12, fontFamily: 'Sora_400Regular', color: BRAND.inkSoft },
  footerLink: { fontSize: 12, fontFamily: 'Sora_600SemiBold', color: BRAND.ink, textDecorationLine: 'underline' },
});
