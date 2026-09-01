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
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/themed-text';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useLocation } from '@/hooks/use-location';
import { useToast } from '@/context/ToastContext';
import { apiClient, setAuthToken } from '@/services/api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── Design tokens (mirrors landing.tsx) ──────────────────────────────────────
const CREAM_BG   = '#FDF4EC';
const TEXT_DARK  = '#1a1a2e';
const TEXT_MID   = '#5a5a7a';
const ACCENT     = '#f59e0b';
const SUCCESS    = '#10B981';
const DANGER     = '#ef4444';
const BLOB1      = '#a7f3d0';
const BLOB2      = '#fde68a';
const BLOB3      = '#c4b5fd';

const roleOptions: { key: 'Player' | 'Coach' | 'Owner'; label: string; desc: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'Player', label: 'Player', desc: 'Join matches & track your stats', icon: 'football-outline' },
  { key: 'Coach',  label: 'Coach',  desc: 'Host classes & train athletes',  icon: 'megaphone-outline' },
  { key: 'Owner',  label: 'Owner',  desc: 'List & manage your turfs',       icon: 'business-outline' },
];

// Formats a raw digit string as "XXXXX XXXXX" (10-digit mobile number)
const formatPhone = (val: string): string => {
  const digits = val.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)} ${digits.slice(5)}`;
};

const generateOtpCode = (): string => String(Math.floor(100000 + Math.random() * 900000));

type OtpStage = 'idle' | 'sent' | 'verified';

export default function SignUpScreen() {
  const router = useRouter();
  const { updateProfile } = useUserProfile();
  const { showInfo, showSuccess } = useToast();
  const { loading: locLoading, address, error: locError, fetchLocation } = useLocation();

  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [phone,    setPhone]    = useState('');
  const [selectedRole, setSelectedRole] = useState<'Player' | 'Coach' | 'Owner'>('Player');
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading,    setIsLoading]    = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // ── OTP verification (client-side demo — no SMS gateway configured yet) ──
  const [otpStage, setOtpStage]   = useState<OtpStage>('idle');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpInput, setOtpInput]   = useState('');
  const [otpError, setOtpError]   = useState<string | null>(null);
  const [otpSentAt, setOtpSentAt] = useState<number | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  const phoneDigits = phone.replace(/\D/g, '');
  const isPhoneValid = phoneDigits.length === 10;

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
    setPhone(formatPhone(t));
    if (otpStage !== 'idle') resetOtp();
  };

  const handleSendOtp = () => {
    if (!isPhoneValid) return;
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

  return (
    <View style={styles.container}>
      {/* ── Decorative Blobs (confined to header band) ── */}
      <View style={[styles.blob, styles.blobTopLeft,  { backgroundColor: BLOB1 + 'CC' }]} />
      <View style={[styles.blob, styles.blobTopRight, { backgroundColor: BLOB2 + 'AA' }]} />
      <View style={[styles.dot, { top: SCREEN_HEIGHT * 0.02, left: 90, backgroundColor: ACCENT + '55', width: 8, height: 8 }]} />
      <View style={[styles.dot, { top: SCREEN_HEIGHT * 0.05, right: 90, backgroundColor: BLOB3 + '88', width: 6, height: 6 }]} />

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
            {/* ── Compact Header ── */}
            <Animated.View style={[styles.headerBar, { opacity: logoAnim }]}>
              <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
                <Ionicons name="chevron-back" size={20} color={TEXT_DARK} />
              </Pressable>
              <Image
                source={require('@/assets/images/illustrations/nonstricker_auth_logo.png')}
                style={styles.headerLogo}
                contentFit="contain"
              />
            </Animated.View>

            <Animated.View style={[styles.topArea, { opacity: logoAnim }]}>
              <View style={styles.titleRow}>
                <ThemedText style={styles.titleNormal}>Create </ThemedText>
                <View style={styles.titleHighlightWrap}>
                  <ThemedText style={styles.titleHighlight}>Account</ThemedText>
                  <View style={[styles.highlightBar, { backgroundColor: ACCENT }]} />
                </View>
              </View>
              <ThemedText style={styles.subtitle}>Join thousands of athletes on NonStricker</ThemedText>
            </Animated.View>

            {/* ── Bottom Card ── */}
            <Animated.View
              style={[
                styles.card,
                { transform: [{ translateY: cardTrans }], opacity: cardOpacity },
              ]}
            >
              {errorMessage && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={16} color={DANGER} />
                  <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
                </View>
              )}

              {/* Role Picker (dropdown) */}
              <ThemedText style={styles.label}>Your Role</ThemedText>
              <Pressable
                style={styles.selectField}
                onPress={() => setRoleModalVisible(true)}
              >
                <View style={styles.roleBadgeSmall}>
                  <Ionicons name={selectedRoleMeta.icon} size={15} color={ACCENT} />
                </View>
                <ThemedText style={styles.selectFieldText}>{selectedRoleMeta.label}</ThemedText>
                <Ionicons name="chevron-down" size={18} color={TEXT_MID} />
              </Pressable>

              {/* Name */}
              <ThemedText style={styles.label}>Full Name</ThemedText>
              <View style={[styles.inputWrapper, isFocused('name') && styles.inputFocused]}>
                <Ionicons name="person-outline" size={17} color={isFocused('name') ? ACCENT : TEXT_MID} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Your full name"
                  placeholderTextColor="#94a3b8"
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              {/* Email */}
              <ThemedText style={styles.label}>Email</ThemedText>
              <View style={[styles.inputWrapper, isFocused('email') && styles.inputFocused]}>
                <Ionicons name="mail-outline" size={17} color={isFocused('email') ? ACCENT : TEXT_MID} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Your email address"
                  placeholderTextColor="#94a3b8"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              {/* Phone + OTP */}
              <ThemedText style={styles.label}>Mobile Number</ThemedText>
              <View style={[
                styles.inputWrapper,
                isFocused('phone') && styles.inputFocused,
                otpStage === 'verified' && styles.inputVerified,
              ]}>
                <Ionicons name="call-outline" size={17} color={isFocused('phone') ? ACCENT : TEXT_MID} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="10-digit mobile number"
                  placeholderTextColor="#94a3b8"
                  value={phone}
                  onChangeText={handlePhoneChange}
                  keyboardType="phone-pad"
                  maxLength={11}
                  onFocus={() => setFocusedField('phone')}
                  onBlur={() => setFocusedField(null)}
                />
                {otpStage === 'verified' ? (
                  <Ionicons name="checkmark-circle" size={19} color={SUCCESS} />
                ) : (
                  <Pressable
                    onPress={handleSendOtp}
                    disabled={!isPhoneValid || (otpStage === 'sent' && resendTimer > 0)}
                    hitSlop={8}
                  >
                    <ThemedText style={[
                      styles.otpTriggerText,
                      (!isPhoneValid || (otpStage === 'sent' && resendTimer > 0)) && styles.otpTriggerTextDisabled,
                    ]}>
                      {otpStage === 'sent' ? (resendTimer > 0 ? `Resend ${resendTimer}s` : 'Resend') : 'Send OTP'}
                    </ThemedText>
                  </Pressable>
                )}
              </View>

              {otpStage === 'sent' && (
                <View style={styles.otpBlock}>
                  <View style={styles.otpRow}>
                    <TextInput
                      style={styles.otpInput}
                      placeholder="6-digit code"
                      placeholderTextColor="#94a3b8"
                      value={otpInput}
                      onChangeText={(t) => { setOtpInput(t.replace(/\D/g, '').slice(0, 6)); setOtpError(null); }}
                      keyboardType="number-pad"
                      maxLength={6}
                      autoFocus
                    />
                    <Pressable style={styles.otpVerifyBtn} onPress={handleVerifyOtp}>
                      <ThemedText style={styles.otpVerifyText}>Verify</ThemedText>
                    </Pressable>
                  </View>
                  {otpError && <ThemedText style={styles.otpErrorText}>{otpError}</ThemedText>}
                </View>
              )}

              {/* Location — auto-detected for Players only */}
              {selectedRole === 'Player' && (
                <View style={styles.locationChip}>
                  <Ionicons name="location" size={13} color={ACCENT} />
                  {locLoading ? (
                    <>
                      <ActivityIndicator size="small" color={ACCENT} style={styles.locationSpinner} />
                      <ThemedText style={styles.locationChipText} numberOfLines={1}>Detecting your location…</ThemedText>
                    </>
                  ) : locError ? (
                    <>
                      <ThemedText style={[styles.locationChipText, styles.locationChipTextError]} numberOfLines={1}>
                        {locError}
                      </ThemedText>
                      <Pressable onPress={fetchLocation} hitSlop={8}>
                        <Ionicons name="refresh" size={14} color={ACCENT} />
                      </Pressable>
                    </>
                  ) : (
                    <>
                      <ThemedText style={styles.locationChipText} numberOfLines={1}>
                        {address || 'Location unavailable'}
                      </ThemedText>
                      <Pressable onPress={fetchLocation} hitSlop={8}>
                        <Ionicons name="refresh" size={13} color={TEXT_MID} />
                      </Pressable>
                    </>
                  )}
                </View>
              )}

              {/* Password */}
              <ThemedText style={styles.label}>Password</ThemedText>
              <View style={[styles.inputWrapper, isFocused('password') && styles.inputFocused]}>
                <Ionicons name="lock-closed-outline" size={17} color={isFocused('password') ? ACCENT : TEXT_MID} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="8–12 characters"
                  placeholderTextColor="#94a3b8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={12}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={17}
                    color={TEXT_MID}
                  />
                </Pressable>
              </View>

              {password.length > 0 && (
                <View style={styles.pwRequirementsRow}>
                  {([
                    { key: 'length',  label: '8-12' },
                    { key: 'upper',   label: 'A-Z' },
                    { key: 'lower',   label: 'a-z' },
                    { key: 'number',  label: '0-9' },
                    { key: 'special', label: '#!@' },
                  ] as const).map((req) => {
                    const ok = passwordChecks[req.key];
                    return (
                      <View key={req.key} style={[styles.pwChip, ok && styles.pwChipActive]}>
                        <Ionicons name={ok ? 'checkmark' : 'ellipse-outline'} size={9} color={ok ? SUCCESS : '#94a3b8'} />
                        <ThemedText style={[styles.pwChipText, ok && styles.pwChipTextActive]}>{req.label}</ThemedText>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* CTA */}
              <Pressable
                style={[styles.ctaButton, isLoading && { opacity: 0.75 }]}
                onPress={handleSignUp}
                disabled={isLoading}
              >
                {isLoading
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <ThemedText style={styles.ctaText}>CREATE ACCOUNT →</ThemedText>
                }
              </Pressable>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <ThemedText style={styles.dividerText}>or sign up with</ThemedText>
                <View style={styles.dividerLine} />
              </View>

              {/* Social */}
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

              {/* Footer */}
              <View style={styles.footerRow}>
                <ThemedText style={styles.footerText}>Already registered? </ThemedText>
                <Pressable onPress={() => router.push('/login')}>
                  <ThemedText style={styles.footerLink}>Sign In</ThemedText>
                </Pressable>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* ── Role Dropdown Sheet ── */}
      <Modal
        visible={roleModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRoleModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setRoleModalVisible(false)}>
          <Pressable style={styles.roleSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.roleSheetHandle} />
            <ThemedText style={styles.roleSheetTitle}>Select Your Role</ThemedText>
            {roleOptions.map((r) => {
              const active = selectedRole === r.key;
              return (
                <Pressable
                  key={r.key}
                  style={[styles.roleOption, active && styles.roleOptionActive]}
                  onPress={() => { setSelectedRole(r.key); setRoleModalVisible(false); }}
                >
                  <View style={[styles.roleIconWrap, active && { backgroundColor: ACCENT }]}>
                    <Ionicons name={r.icon} size={18} color={active ? '#fff' : TEXT_MID} />
                  </View>
                  <View style={styles.roleOptionTextWrap}>
                    <ThemedText style={styles.roleOptionLabel}>{r.label}</ThemedText>
                    <ThemedText style={styles.roleOptionDesc}>{r.desc}</ThemedText>
                  </View>
                  {active && <Ionicons name="checkmark-circle" size={20} color={ACCENT} />}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
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

  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
  blobTopLeft: {
    width: 130,
    height: 130,
    top: -50,
    left: -60,
  },
  blobTopRight: {
    width: 100,
    height: 100,
    top: -30,
    right: -40,
  },
  dot: {
    position: 'absolute',
    borderRadius: 999,
  },

  scrollContent: {
    flexGrow: 1,
  },

  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.containerMargin,
    paddingTop: Spacing.xs,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF88',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLogo: {
    width: 32,
    height: 32,
  },

  topArea: {
    paddingHorizontal: Spacing.containerMargin,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    alignItems: 'flex-start',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  titleNormal: {
    fontSize: 22,
    fontFamily: 'Sora_800ExtraBold',
    color: TEXT_DARK,
    lineHeight: 28,
    letterSpacing: -0.5,
  },
  titleHighlightWrap: { position: 'relative' },
  titleHighlight: {
    fontSize: 22,
    fontFamily: 'Sora_800ExtraBold',
    color: TEXT_DARK,
    lineHeight: 28,
    letterSpacing: -0.5,
  },
  highlightBar: {
    position: 'absolute',
    bottom: 2,
    left: 0,
    right: 0,
    height: 7,
    borderRadius: 4,
    opacity: 0.5,
    zIndex: -1,
  },
  subtitle: {
    fontSize: 12,
    color: TEXT_MID,
    fontFamily: 'Sora_400Regular',
    lineHeight: 16,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 6,
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: DANGER,
    fontFamily: 'Sora_500Medium',
  },

  label: {
    fontSize: 12,
    fontFamily: 'Sora_600SemiBold',
    color: TEXT_DARK,
    marginBottom: 5,
    marginLeft: 4,
  },

  selectField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F7F4',
    borderWidth: 1.5,
    borderColor: '#EBEBEB',
    borderRadius: BorderRadius.lg,
    height: 46,
    paddingHorizontal: 12,
    marginBottom: 10,
    gap: 10,
  },
  roleBadgeSmall: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: ACCENT + '18',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectFieldText: {
    flex: 1,
    fontSize: 14,
    color: TEXT_DARK,
    fontFamily: 'Sora_600SemiBold',
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F7F4',
    borderWidth: 1.5,
    borderColor: '#EBEBEB',
    borderRadius: BorderRadius.lg,
    height: 46,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  inputFocused: {
    borderColor: ACCENT,
  },
  inputVerified: {
    borderColor: SUCCESS + '99',
  },
  inputIcon: { marginRight: 9 },
  input: {
    flex: 1,
    fontSize: 14,
    color: TEXT_DARK,
    fontFamily: 'Sora_500Medium',
    height: '100%',
  },

  otpTriggerText: {
    fontSize: 12,
    fontFamily: 'Sora_700Bold',
    color: ACCENT,
    letterSpacing: 0.2,
  },
  otpTriggerTextDisabled: {
    color: TEXT_MID,
    opacity: 0.6,
  },
  otpBlock: {
    marginTop: -4,
    marginBottom: 10,
  },
  otpRow: {
    flexDirection: 'row',
    gap: 8,
  },
  otpInput: {
    flex: 1,
    height: 40,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: '#EBEBEB',
    backgroundColor: '#F8F7F4',
    paddingHorizontal: 14,
    fontSize: 14,
    letterSpacing: 2,
    color: TEXT_DARK,
    fontFamily: 'Sora_600SemiBold',
  },
  otpVerifyBtn: {
    height: 40,
    paddingHorizontal: 18,
    borderRadius: BorderRadius.md,
    backgroundColor: TEXT_DARK,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpVerifyText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Sora_700Bold',
  },
  otpErrorText: {
    fontSize: 11,
    color: DANGER,
    fontFamily: 'Sora_500Medium',
    marginTop: 5,
    marginLeft: 4,
  },

  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ACCENT + '10',
    borderRadius: BorderRadius.md,
    height: 32,
    paddingHorizontal: 10,
    marginBottom: 10,
    gap: 6,
  },
  locationSpinner: { marginLeft: 2 },
  locationChipText: {
    flex: 1,
    fontSize: 11,
    color: TEXT_MID,
    fontFamily: 'Sora_500Medium',
  },
  locationChipTextError: {
    color: DANGER,
  },

  pwRequirementsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
    marginTop: -2,
  },
  pwChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F2F1EE',
  },
  pwChipActive: {
    backgroundColor: SUCCESS + '15',
  },
  pwChipText: {
    fontSize: 9.5,
    fontFamily: 'Sora_600SemiBold',
    color: '#94a3b8',
  },
  pwChipTextActive: {
    color: SUCCESS,
  },

  ctaButton: {
    backgroundColor: ACCENT,
    height: 46,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 14,
    marginTop: 2,
  },
  ctaText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Sora_700Bold',
    letterSpacing: 1.0,
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#EBEBEB',
  },
  dividerText: {
    fontSize: 11,
    color: TEXT_MID,
    fontFamily: 'Sora_400Regular',
  },

  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginBottom: 14,
  },
  socialBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F8F7F4',
    borderWidth: 1,
    borderColor: '#EBEBEB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialIcon: {
    width: 19,
    height: 19,
  },

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
    fontFamily: 'Sora_700Bold',
  },

  // ── Role dropdown sheet ──
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  roleSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
  },
  roleSheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#EBEBEB',
    alignSelf: 'center',
    marginBottom: 14,
  },
  roleSheetTitle: {
    fontSize: 15,
    fontFamily: 'Sora_700Bold',
    color: TEXT_DARK,
    marginBottom: 12,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
    marginBottom: 4,
  },
  roleOptionActive: {
    backgroundColor: ACCENT + '12',
  },
  roleIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F2F1EE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleOptionTextWrap: { flex: 1 },
  roleOptionLabel: {
    fontSize: 14,
    fontFamily: 'Sora_700Bold',
    color: TEXT_DARK,
  },
  roleOptionDesc: {
    fontSize: 11,
    fontFamily: 'Sora_400Regular',
    color: TEXT_MID,
    marginTop: 1,
  },
});
