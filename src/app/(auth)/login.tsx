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
  { role: 'Player', email: 'player@turf.com', pass: 'password123', icon: 'person-outline' },
  { role: 'Coach', email: 'coach@turf.com', pass: 'password123', icon: 'fitness-outline' },
  { role: 'Owner', email: 'owner@turf.com', pass: 'password123', icon: 'business-outline' },
  { role: 'Organizer', email: 'organizer@turf.com', pass: 'password123', icon: 'calendar-outline' },
];

export default function LoginScreen() {
  const theme    = useTheme();
  const router   = useRouter();
  const { updateProfile } = useUserProfile();

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

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage('Please fill in all fields.');
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/login', {
        email: email.trim().toLowerCase(),
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
          avatarUrl: userPayload.avatarUrl || require('@/assets/images/avatars/avatar_1.png'),
        });
        router.replace('/(tabs)');
      } else {
        setErrorMessage('Failed to initiate login session.');
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Invalid email or password.');
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

              {/* Email */}
              <ThemedText style={styles.label}>Email</ThemedText>
              <View style={[styles.inputWrapper, isEmailFocused && styles.inputFocused]}>
                <Ionicons name="mail-outline" size={18} color={isEmailFocused ? ACCENT : TEXT_MID} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor={TEXT_MID + '88'}
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
                  placeholderTextColor={TEXT_MID + '88'}
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
                  <ThemedText style={[styles.optionText, { color: ACCENT, fontFamily: 'PlusJakartaSans_600SemiBold' }]}>
                    Forgot Password?
                  </ThemedText>
                </Pressable>
              </View>

              {/* CTA Button — amber pill like landing */}
              <Pressable
                style={[styles.ctaButton, isLoading && { opacity: 0.75 }]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <ThemedText style={styles.ctaText}>SIGN IN →</ThemedText>
                }
              </Pressable>

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
                  <Ionicons name="logo-apple" size={22} color={TEXT_DARK} />
                </Pressable>
                <Pressable style={styles.socialBtn}>
                  <Ionicons name="logo-facebook" size={22} color="#1877F2" />
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
    width: 130,
    height: 130,
    top: -30,
    right: -50,
  },
  blobBottomLeft: {
    width: 100,
    height: 100,
    bottom: 80,
    left: -40,
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
    borderRadius: BorderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: Spacing.sm,
  },
  tagText: {
    fontSize: 9,
    fontFamily: 'PlusJakartaSans_700Bold',
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
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    color: TEXT_DARK,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  titleHighlightWrap: {
    position: 'relative',
  },
  titleHighlight: {
    fontSize: 30,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
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
    fontFamily: 'PlusJakartaSans_400Regular',
    lineHeight: 20,
  },

  // Bottom card — flex:1 ensures it fills remaining screen, no scroll gap
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 6,
  },

  // Error
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#ef4444',
    fontFamily: 'PlusJakartaSans_500Medium',
  },

  // Inputs
  label: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: TEXT_DARK,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F7F4',
    borderWidth: 1.5,
    borderColor: '#EBEBEB',
    borderRadius: BorderRadius.lg,
    height: 52,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  // Only border color change on focus — no bg change to avoid browser autofill blue bleed
  inputFocused: {
    borderColor: ACCENT,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: TEXT_DARK,
    fontFamily: 'PlusJakartaSans_500Medium',
    height: '100%',
  },

  // Options
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  optionText: {
    fontSize: 13,
    color: TEXT_MID,
    fontFamily: 'PlusJakartaSans_500Medium',
  },

  // CTA — mirrors landing primaryButton
  ctaButton: {
    backgroundColor: ACCENT,
    height: 50,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 28,
  },
  ctaText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: 1.0,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#EBEBEB',
  },
  dividerText: {
    fontSize: 12,
    color: TEXT_MID,
    fontFamily: 'PlusJakartaSans_400Regular',
  },

  // Social
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 28,
  },
  socialBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F8F7F4',
    borderWidth: 1,
    borderColor: '#EBEBEB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialIcon: {
    width: 22,
    height: 22,
  },

  // Footer
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: TEXT_MID,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  footerLink: {
    fontSize: 14,
    color: TEXT_DARK,
    fontFamily: 'PlusJakartaSans_700Bold',
  },

  // Demo section
  demoSection: {
    backgroundColor: '#FDF4EC',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#F1E5D8',
    marginBottom: 24,
  },
  demoTitle: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: TEXT_MID,
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 1.0,
  },
  demoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  demoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 5,
  },
  demoPillText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: TEXT_DARK,
  },
});
