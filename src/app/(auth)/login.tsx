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
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/themed-text';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useUserProfile } from '@/hooks/use-user-profile';
import { apiClient, setAuthToken } from '@/services/api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useToast } from '@/context/ToastContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── Design tokens (mirrors landing.tsx) ──────────────────────────────────────
const CREAM_BG   = '#FDF4EC';
const TEXT_DARK  = '#1a1a2e';
const TEXT_MID   = '#5a5a7a';
const ACCENT     = '#f59e0b';
const BLOB1      = '#fde68a';
const BLOB2      = '#bfdbfe';
const BLOB3      = '#fca5a5';

const DEMO_ACCOUNTS = [
  { role: 'Player', email: 'player@turf.com', phone: '9876543210', pass: 'password123', icon: 'person-outline' },
  { role: 'Coach', email: 'coach@turf.com', phone: '9876543211', pass: 'password123', icon: 'fitness-outline' },
  { role: 'Owner', email: 'owner@turf.com', phone: '9876543212', pass: 'password123', icon: 'business-outline' },
  { role: 'Organizer', email: 'organizer@turf.com', phone: '9876543213', pass: 'password123', icon: 'calendar-outline' },
  { role: 'Super Admin', email: 'admin@turf.com', phone: '9876543214', pass: 'password123', icon: 'shield-checkmark-outline' },
];

export default function LoginScreen() {
  const theme    = useTheme();
  const router   = useRouter();
  const { updateProfile } = useUserProfile();
  const { showInfo, showSuccess, showError } = useToast();

  // Auth Mode: OTP-based by default
  const [authMode, setAuthMode]     = useState<'otp' | 'password'>('otp');

  // OTP state
  const [phone, setPhone]           = useState('');
  const [otpStage, setOtpStage]     = useState<'phone' | 'otp_sent'>('phone');
  const [otpCode, setOtpCode]       = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [otpSentAt, setOtpSentAt]   = useState<number | null>(null);
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);
  const [isOtpFocused, setIsOtpFocused]     = useState(false);

  // Password state
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading]   = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

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
    const cleanPhone = targetPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
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

  const handlePasswordLogin = async () => {
    if (!email || !password) {
      setErrorMessage('Please fill in all fields.');
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const demoAccount = DEMO_ACCOUNTS.find(a => a.email === cleanEmail);

    try {
      // Attempt remote API authentication
      const response = await apiClient.post('/auth/login', {
        email: cleanEmail,
        password,
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
    } catch (error: any) {
      console.warn('Backend API connection failed, proceeding with local device storage:', error.message);
    }

    // Fallback to Local Device Storage Mode (AsyncStorage)
    try {
      const existingUsersStr = await AsyncStorage.getItem('@turf_users_db');
      const existingUsers = existingUsersStr ? JSON.parse(existingUsersStr) : [];
      const matchedUser = existingUsers.find((u: any) => u.email === cleanEmail);

      let role = demoAccount ? demoAccount.role : (matchedUser ? matchedUser.role : 'Player');
      let name = matchedUser ? matchedUser.name : (demoAccount ? demoAccount.role : cleanEmail.split('@')[0]);
      name = name.charAt(0).toUpperCase() + name.slice(1);

      const localToken = `local_token_${Date.now()}`;
      const userPayload = {
        name,
        role,
        location: matchedUser?.location || 'London, UK',
        avatarUrl: matchedUser?.avatarUrl || '',
      };

      await setAuthToken(localToken);
      await AsyncStorage.setItem('@turf_user_profile', JSON.stringify(userPayload));

      updateProfile({
        name: userPayload.name,
        role: userPayload.role as any,
        location: userPayload.location,
        avatarUrl: userPayload.avatarUrl || 'avatar_1',
      });

      router.replace('/(tabs)');
    } catch (err: any) {
      setErrorMessage('Failed to sign in locally: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* ── Decorative Blobs (mirrors landing.tsx) ── */}
      <View style={[styles.blob, styles.blobTopLeft,   { backgroundColor: BLOB1 + 'CC' }]} />
      <View style={[styles.blob, styles.blobTopRight,  { backgroundColor: BLOB2 + 'AA' }]} />
      <View style={[styles.blob, styles.blobBottomLeft,{ backgroundColor: BLOB3 + '88' }]} />

      {/* Decorative dots */}
      <View style={[styles.dot, { top: SCREEN_HEIGHT * 0.08, left: 32,  backgroundColor: ACCENT + '66', width: 8,  height: 8  }]} />
      <View style={[styles.dot, { top: SCREEN_HEIGHT * 0.14, right: 24, backgroundColor: BLOB3 + '88', width: 12, height: 12 }]} />
      <View style={[styles.dot, { top: SCREEN_HEIGHT * 0.44, left: 20,  backgroundColor: BLOB2 + '88', width: 6,  height: 6  }]} />
      <View style={[styles.dot, { top: SCREEN_HEIGHT * 0.38, right: 18, backgroundColor: ACCENT + '55', width: 10, height: 10 }]} />
      {/* Pill decorations */}
      <View style={[styles.pill, { top: SCREEN_HEIGHT * 0.10, right: 60, backgroundColor: TEXT_MID + '22', transform: [{ rotate: '45deg' }] }]} />
      <View style={[styles.pill, { top: SCREEN_HEIGHT * 0.50, left: 40, backgroundColor: ACCENT + '33',   transform: [{ rotate: '-30deg' }] }]} />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* ── Top area: Logo + Heading ── */}
            <Animated.View style={[styles.topArea, { opacity: logoAnim }]}>
              <Image
                source={require('@/assets/images/illustrations/nonstricker_auth_logo.png')}
                style={styles.logo}
                contentFit="contain"
              />
              {/* Tag pill */}
              <View style={styles.tagPill}>
                <ThemedText style={styles.tagText}>SPORTS PLATFORM</ThemedText>
              </View>
              {/* Title with highlight bar (like landing) */}
              <View style={styles.titleRow}>
                <ThemedText style={styles.titleNormal}>Welcome </ThemedText>
                <View style={styles.titleHighlightWrap}>
                  <ThemedText style={styles.titleHighlight}>Back</ThemedText>
                  <View style={[styles.highlightBar, { backgroundColor: ACCENT }]} />
                </View>
              </View>
              <ThemedText style={styles.subtitle}>Sign in to your NonStricker account</ThemedText>
            </Animated.View>

            {/* ── Bottom Card (mirrors landing footer panel) ── */}
            <Animated.View
              style={[
                styles.card,
                {
                  transform: [{ translateY: cardAnim }],
                  opacity: cardOpacity,
                },
              ]}
            >
              {/* Error box */}
              {errorMessage && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
                  <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
                </View>
              )}

              {/* Auth Mode Toggle: OTP vs Password */}
              <View style={styles.authModeContainer}>
                <Pressable
                  style={[styles.authModeChip, authMode === 'otp' && styles.authModeChipActive]}
                  onPress={() => {
                    setAuthMode('otp');
                    setErrorMessage(null);
                  }}
                >
                  <Ionicons name="phone-portrait-outline" size={13} color={authMode === 'otp' ? '#ffffff' : TEXT_DARK} style={{ marginRight: 6 }} />
                  <ThemedText style={[styles.authModeText, authMode === 'otp' && styles.authModeTextActive]}>
                    Mobile OTP
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.authModeChip, authMode === 'password' && styles.authModeChipActive]}
                  onPress={() => {
                    setAuthMode('password');
                    setErrorMessage(null);
                  }}
                >
                  <Ionicons name="mail-outline" size={13} color={authMode === 'password' ? '#ffffff' : TEXT_DARK} style={{ marginRight: 6 }} />
                  <ThemedText style={[styles.authModeText, authMode === 'password' && styles.authModeTextActive]}>
                    Password
                  </ThemedText>
                </Pressable>
              </View>

              {/* ── OTP AUTHENTICATION FLOW ── */}
              {authMode === 'otp' ? (
                otpStage === 'phone' ? (
                  <>
                    {/* Phone Number Input */}
                    <ThemedText style={styles.label}>Mobile Number *</ThemedText>
                    <View style={[styles.inputWrapper, isPhoneFocused && styles.inputFocused]}>
                      <Ionicons name="call-outline" size={18} color={isPhoneFocused ? ACCENT : TEXT_MID} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter 10-digit mobile number"
                        placeholderTextColor="#94a3b8"
                        value={phone}
                        onChangeText={(t) => setPhone(t.replace(/[^0-9]/g, ''))}
                        keyboardType="phone-pad"
                        maxLength={10}
                        onFocus={() => setIsPhoneFocused(true)}
                        onBlur={() => setIsPhoneFocused(false)}
                      />
                    </View>

                    {/* Send OTP CTA */}
                    <Pressable
                      style={[styles.ctaButton, isLoading && { opacity: 0.75 }]}
                      onPress={handleSendOtp}
                      disabled={isLoading}
                    >
                      {isLoading
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <ThemedText style={styles.ctaText}>GET OTP →</ThemedText>
                      }
                    </Pressable>
                  </>
                ) : (
                  <>
                    {/* Sent Phone Notification Banner */}
                    <View style={styles.sentPhoneBanner}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 6 }}>
                        <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                        <ThemedText style={styles.sentPhoneText}>
                          OTP sent to <ThemedText style={{ fontFamily: 'Sora_600SemiBold', color: TEXT_DARK }}>+91 {phone}</ThemedText>
                        </ThemedText>
                      </View>
                      <Pressable onPress={() => { setOtpStage('phone'); setOtpCode(''); setErrorMessage(null); }}>
                        <ThemedText style={styles.editPhoneBtn}>Edit</ThemedText>
                      </Pressable>
                    </View>

                    {/* OTP Code Input */}
                    <ThemedText style={styles.label}>Enter 6-Digit OTP Code *</ThemedText>
                    <View style={[styles.inputWrapper, isOtpFocused && styles.inputFocused]}>
                      <Ionicons name="key-outline" size={18} color={isOtpFocused ? ACCENT : TEXT_MID} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, { letterSpacing: 6, fontSize: 18, fontFamily: 'Sora_600SemiBold' }]}
                        placeholder="••••••"
                        placeholderTextColor="#cbd5e1"
                        value={otpCode}
                        onChangeText={(t) => setOtpCode(t.replace(/[^0-9]/g, ''))}
                        keyboardType="number-pad"
                        maxLength={6}
                        onFocus={() => setIsOtpFocused(true)}
                        onBlur={() => setIsOtpFocused(false)}
                      />
                    </View>

                    {/* Resend OTP Row */}
                    <View style={styles.resendRow}>
                      {resendTimer > 0 ? (
                        <ThemedText style={styles.resendTimerText}>
                          Resend code in {resendTimer}s
                        </ThemedText>
                      ) : (
                        <Pressable onPress={handleSendOtp}>
                          <ThemedText style={[styles.resendTimerText, { color: ACCENT, fontFamily: 'Sora_600SemiBold' }]}>
                            Resend OTP
                          </ThemedText>
                        </Pressable>
                      )}
                    </View>

                    {/* Verify & Sign In CTA */}
                    <Pressable
                      style={[styles.ctaButton, isLoading && { opacity: 0.75 }]}
                      onPress={handleVerifyOtp}
                      disabled={isLoading}
                    >
                      {isLoading
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <ThemedText style={styles.ctaText}>VERIFY & SIGN IN →</ThemedText>
                      }
                    </Pressable>
                  </>
                )
              ) : (
                /* ── PASSWORD AUTHENTICATION FLOW ── */
                <>
                  {/* Email */}
                  <ThemedText style={styles.label}>Email</ThemedText>
                  <View style={[styles.inputWrapper, isEmailFocused && styles.inputFocused]}>
                    <Ionicons name="mail-outline" size={18} color={isEmailFocused ? ACCENT : TEXT_MID} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your email"
                      placeholderTextColor="#94a3b8"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      onFocus={() => setIsEmailFocused(true)}
                      onBlur={() => setIsEmailFocused(false)}
                    />
                  </View>

                  {/* Password */}
                  <ThemedText style={styles.label}>Password</ThemedText>
                  <View style={[styles.inputWrapper, isPasswordFocused && styles.inputFocused]}>
                    <Ionicons name="lock-closed-outline" size={18} color={isPasswordFocused ? ACCENT : TEXT_MID} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your password"
                      placeholderTextColor="#94a3b8"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      onFocus={() => setIsPasswordFocused(true)}
                      onBlur={() => setIsPasswordFocused(false)}
                    />
                    <Pressable onPress={() => setShowPassword(!showPassword)}>
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color={TEXT_MID}
                      />
                    </Pressable>
                  </View>

                  {/* Options row */}
                  <View style={styles.optionsRow}>
                    <Pressable style={styles.checkRow} onPress={() => setRememberMe(!rememberMe)}>
                      <Ionicons
                        name={rememberMe ? 'checkbox' : 'square-outline'}
                        size={18}
                        color={rememberMe ? ACCENT : TEXT_MID}
                      />
                      <ThemedText style={styles.optionText}>Remember me</ThemedText>
                    </Pressable>
                    <Pressable onPress={() => router.push('/forgot-password')}>
                      <ThemedText style={[styles.optionText, { color: ACCENT, fontFamily: 'Sora_600SemiBold' }]}>
                        Forgot Password?
                      </ThemedText>
                    </Pressable>
                  </View>

                  {/* CTA Button */}
                  <Pressable
                    style={[styles.ctaButton, isLoading && { opacity: 0.75 }]}
                    onPress={handlePasswordLogin}
                    disabled={isLoading}
                  >
                    {isLoading
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <ThemedText style={styles.ctaText}>SIGN IN →</ThemedText>
                    }
                  </Pressable>
                </>
              )}

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <ThemedText style={styles.dividerText}>or continue with</ThemedText>
                <View style={styles.dividerLine} />
              </View>

              {/* Social buttons */}
              <View style={styles.socialRow}>
                <Pressable style={styles.socialBtn}>
                  <Image
                    source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/120px-Google_%22G%22_logo.svg.png' }}
                    style={styles.socialIcon}
                  />
                </Pressable>
                <Pressable style={styles.socialBtn}>
                  <Ionicons name="logo-apple" size={20} color={TEXT_DARK} />
                </Pressable>
                <Pressable style={styles.socialBtn}>
                  <Ionicons name="logo-facebook" size={20} color="#1877F2" />
                </Pressable>
              </View>

              {/* Quick Demo Login */}
              <View style={styles.demoSection}>
                <ThemedText style={styles.demoTitle}>QUICK DEV LOGIN</ThemedText>
                <View style={styles.demoGrid}>
                  {DEMO_ACCOUNTS.map((acc) => (
                    <Pressable
                      key={acc.role}
                      style={styles.demoPill}
                      onPress={() => {
                        setEmail(acc.email);
                        setPassword(acc.pass);
                        setPhone(acc.phone);
                        if (authMode === 'otp') {
                          handleSendOtp(acc.phone);
                        }
                      }}
                    >
                      <Ionicons name={acc.icon as any} size={13} color={ACCENT} />
                      <ThemedText style={styles.demoPillText}>{acc.role}</ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Footer */}
              <View style={styles.footerRow}>
                <ThemedText style={styles.footerText}>Don&apos;t have an account? </ThemedText>
                <Pressable onPress={() => router.push('/signup')}>
                  <ThemedText style={styles.footerLink}>Sign Up</ThemedText>
                </Pressable>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CREAM_BG,
    overflow: 'hidden',
  },
  flex: { flex: 1 },
  safeArea: { flex: 1 },

  // Blobs
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
  blobTopLeft: {
    width: 180,
    height: 180,
    top: -50,
    left: -70,
  },
  blobTopRight: {
    width: 160,
    height: 160,
    top: -30,
    right: -50,
  },
  blobBottomLeft: {
    width: 120,
    height: 120,
    bottom: 80,
    left: -40,
  },
  blobBottomRight: {
    width: 220,
    height: 220,
    bottom: -60,
    right: -80,
  },

  // Dots & pills
  dot: {
    position: 'absolute',
    borderRadius: 999,
  },
  pill: {
    position: 'absolute',
    width: 22,
    height: 7,
    borderRadius: 4,
  },

  scrollContent: {
    flexGrow: 1,
    paddingTop: Spacing.sm,
  },

  // Top area
  topArea: {
    paddingHorizontal: Spacing.containerMargin,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    alignItems: 'flex-start',
  },

  // Header
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    alignItems: 'flex-start',
  },
  logo: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  tagPill: {
    backgroundColor: ACCENT + '18',
    borderColor: ACCENT + '33',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: Spacing.sm,
  },
  tagText: {
    fontSize: 9,
    fontFamily: 'Sora_600SemiBold',
    color: ACCENT,
    letterSpacing: 1.4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    marginBottom: Spacing.xs,
  },
  titleNormal: {
    fontSize: 30,
    fontFamily: 'Sora_600SemiBold',
    color: TEXT_DARK,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  titleHighlightWrap: {
    position: 'relative',
  },
  titleHighlight: {
    fontSize: 30,
    fontFamily: 'Sora_600SemiBold',
    color: TEXT_DARK,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  highlightBar: {
    position: 'absolute',
    bottom: 3,
    left: 0,
    right: 0,
    height: 9,
    borderRadius: 4,
    opacity: 0.5,
    zIndex: -1,
  },
  subtitle: {
    fontSize: 13,
    color: TEXT_MID,
    fontFamily: 'Sora_400Regular',
    lineHeight: 20,
  },

  // Bottom card — standardized radius (12px top)
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 6,
  },

  // Auth Mode Container & Chips
  authModeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  authModeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    backgroundColor: '#F8F7F4',
  },
  authModeChipActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  authModeText: {
    fontSize: 12,
    fontFamily: 'Sora_600SemiBold',
    color: TEXT_DARK,
  },
  authModeTextActive: {
    color: '#ffffff',
    fontFamily: 'Sora_600SemiBold',
  },

  // Sent phone banner
  sentPhoneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  sentPhoneText: {
    fontSize: 12,
    color: '#15803d',
    fontFamily: 'Sora_500Medium',
  },
  editPhoneBtn: {
    fontSize: 12,
    color: ACCENT,
    fontFamily: 'Sora_600SemiBold',
    textDecorationLine: 'underline',
  },
  resendRow: {
    alignItems: 'flex-end',
    marginBottom: 20,
    marginTop: -8,
  },
  resendTimerText: {
    fontSize: 12,
    color: TEXT_MID,
    fontFamily: 'Sora_500Medium',
  },

  // Error
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    borderRadius: 6,
    padding: 10,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 12.5,
    color: '#ef4444',
    fontFamily: 'Sora_500Medium',
  },

  // Inputs
  label: {
    fontSize: 12.5,
    fontFamily: 'Sora_600SemiBold',
    color: TEXT_DARK,
    marginBottom: 6,
    marginLeft: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F7F4',
    borderWidth: 1.5,
    borderColor: '#EBEBEB',
    borderRadius: 8,
    height: 48,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  inputFocused: {
    borderColor: ACCENT,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: TEXT_DARK,
    fontFamily: 'Sora_500Medium',
    height: '100%',
  },

  // Options
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  optionText: {
    fontSize: 12.5,
    color: TEXT_MID,
    fontFamily: 'Sora_500Medium',
  },

  // CTA
  ctaButton: {
    backgroundColor: ACCENT,
    height: 46,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 22,
  },
  ctaText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Sora_600SemiBold',
    letterSpacing: 0.8,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#EBEBEB',
  },
  dividerText: {
    fontSize: 11.5,
    color: TEXT_MID,
    fontFamily: 'Sora_400Regular',
  },

  // Social
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginBottom: 22,
  },
  socialBtn: {
    width: 46,
    height: 46,
    borderRadius: 8,
    backgroundColor: '#F8F7F4',
    borderWidth: 1,
    borderColor: '#EBEBEB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialIcon: {
    width: 20,
    height: 20,
  },

  // Footer
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: TEXT_MID,
    fontFamily: 'Sora_500Medium',
  },
  footerLink: {
    fontSize: 13,
    color: TEXT_DARK,
    fontFamily: 'Sora_600SemiBold',
  },

  // Demo section
  demoSection: {
    backgroundColor: '#FDF4EC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1E5D8',
    marginBottom: 20,
  },
  demoTitle: {
    fontSize: 9.5,
    fontFamily: 'Sora_600SemiBold',
    color: TEXT_MID,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1.0,
  },
  demoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  demoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 6,
    paddingHorizontal: 9,
    paddingVertical: 5,
    gap: 5,
  },
  demoPillText: {
    color: TEXT_DARK,
  },
});
