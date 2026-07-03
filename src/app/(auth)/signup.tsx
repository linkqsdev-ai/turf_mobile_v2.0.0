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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── Design tokens (mirrors landing.tsx) ──────────────────────────────────────
const CREAM_BG   = '#FDF4EC';
const TEXT_DARK  = '#1a1a2e';
const TEXT_MID   = '#5a5a7a';
const ACCENT     = '#f59e0b';
const BLOB1      = '#a7f3d0';
const BLOB2      = '#fde68a';
const BLOB3      = '#c4b5fd';

const roleOptions = [
  { key: 'Player', label: 'PLAYER' },
  { key: 'Coach',  label: 'COACH'  },
  { key: 'Owner',  label: 'OWNER'  },
];

export default function SignUpScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { updateProfile } = useUserProfile();

  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [phone,    setPhone]    = useState('');
  const [location, setLocation] = useState('');
  const [selectedRole, setSelectedRole] = useState<'Player' | 'Coach' | 'Owner'>('Player');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading,    setIsLoading]    = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

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

  const handleSignUp = async () => {
    if (!name || !email || !password) {
      setErrorMessage('Full name, email, and password are required.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must contain at least 6 characters.');
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/register', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim() || undefined,
        role: selectedRole,
        location: location.trim() || undefined,
      });
      if (response && response.token) {
        await setAuthToken(response.token);
        updateProfile({
          name: response.user.name,
          role: response.user.role,
          location: response.user.location || 'London, UK',
          avatarUrl: response.user.avatarUrl || require('@/assets/images/avatars/avatar_1.png'),
        });
        router.replace('/(tabs)');
      } else {
        setErrorMessage('Failed to finalize registration.');
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Registration request failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFocused = (f: string) => focusedField === f;

  return (
    <View style={styles.container}>
      {/* ── Decorative Blobs ── */}
      <View style={[styles.blob, styles.blobTopLeft,   { backgroundColor: BLOB1 + 'CC' }]} />
      <View style={[styles.blob, styles.blobTopRight,  { backgroundColor: BLOB2 + 'AA' }]} />
      <View style={[styles.blob, styles.blobBottomRight,{ backgroundColor: BLOB3 + '88' }]} />

      {/* Dots */}
      <View style={[styles.dot, { top: SCREEN_HEIGHT * 0.08, left: 32,  backgroundColor: ACCENT + '66', width: 8,  height: 8  }]} />
      <View style={[styles.dot, { top: SCREEN_HEIGHT * 0.14, right: 24, backgroundColor: BLOB3 + '88', width: 12, height: 12 }]} />
      <View style={[styles.dot, { top: SCREEN_HEIGHT * 0.32, left: 20,  backgroundColor: BLOB2 + '88', width: 6,  height: 6  }]} />
      <View style={[styles.dot, { top: SCREEN_HEIGHT * 0.28, right: 18, backgroundColor: ACCENT + '55', width: 10, height: 10 }]} />
      <View style={[styles.pill, { top: SCREEN_HEIGHT * 0.10, right: 60, backgroundColor: TEXT_MID + '22', transform: [{ rotate: '45deg' }] }]} />
      <View style={[styles.pill, { top: SCREEN_HEIGHT * 0.38, left: 40, backgroundColor: BLOB1 + '44',   transform: [{ rotate: '-30deg' }] }]} />

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
            {/* ── Top area ── */}
            <Animated.View style={[styles.topArea, { opacity: logoAnim }]}>
              <Image
                source={require('@/assets/images/illustrations/nonstricker_auth_logo.png')}
                style={styles.logo}
                contentFit="contain"
              />
              <View style={styles.tagPill}>
                <ThemedText style={styles.tagText}>JOIN THE ARENA</ThemedText>
              </View>
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
                  <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
                  <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
                </View>
              )}

              {/* Role Picker */}
              <ThemedText style={styles.label}>Your Role</ThemedText>
              <View style={styles.segmented}>
                {roleOptions.map((r) => {
                  const active = selectedRole === r.key;
                  return (
                    <Pressable
                      key={r.key}
                      style={[styles.segment, active && { backgroundColor: ACCENT }]}
                      onPress={() => setSelectedRole(r.key as any)}
                    >
                      <ThemedText style={[styles.segmentText, { color: active ? '#fff' : TEXT_MID }]}>
                        {r.label}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>

              {/* Name */}
              <ThemedText style={styles.label}>Full Name</ThemedText>
              <View style={[styles.inputWrapper, isFocused('name') && styles.inputFocused]}>
                <Ionicons name="person-outline" size={18} color={isFocused('name') ? ACCENT : TEXT_MID} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Your full name"
                  placeholderTextColor={TEXT_MID + '88'}
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              {/* Email */}
              <ThemedText style={styles.label}>Email</ThemedText>
              <View style={[styles.inputWrapper, isFocused('email') && styles.inputFocused]}>
                <Ionicons name="mail-outline" size={18} color={isFocused('email') ? ACCENT : TEXT_MID} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Your email address"
                  placeholderTextColor={TEXT_MID + '88'}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              {/* Phone */}
              <ThemedText style={styles.label}>Phone (Optional)</ThemedText>
              <View style={[styles.inputWrapper, isFocused('phone') && styles.inputFocused]}>
                <Ionicons name="call-outline" size={18} color={isFocused('phone') ? ACCENT : TEXT_MID} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Your phone number"
                  placeholderTextColor={TEXT_MID + '88'}
                  value={phone}
                  onChangeText={(t) => setPhone(t.replace(/[^0-9+\s\-()]/g, ''))}
                  keyboardType="phone-pad"
                  onFocus={() => setFocusedField('phone')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              {/* Location */}
              <ThemedText style={styles.label}>Location (Optional)</ThemedText>
              <View style={[styles.inputWrapper, isFocused('location') && styles.inputFocused]}>
                <Ionicons name="location-outline" size={18} color={isFocused('location') ? ACCENT : TEXT_MID} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. London, New York"
                  placeholderTextColor={TEXT_MID + '88'}
                  value={location}
                  onChangeText={setLocation}
                  onFocus={() => setFocusedField('location')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              {/* Password */}
              <ThemedText style={styles.label}>Password</ThemedText>
              <View style={[styles.inputWrapper, isFocused('password') && styles.inputFocused]}>
                <Ionicons name="lock-closed-outline" size={18} color={isFocused('password') ? ACCENT : TEXT_MID} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Min 6 characters"
                  placeholderTextColor={TEXT_MID + '88'}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={TEXT_MID}
                  />
                </Pressable>
              </View>

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
                  <Ionicons name="logo-apple" size={22} color={TEXT_DARK} />
                </Pressable>
                <Pressable style={styles.socialBtn}>
                  <Ionicons name="logo-facebook" size={22} color="#1877F2" />
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
  blobBottomRight: {
    width: 100,
    height: 100,
    bottom: 120,
    right: -40,
  },
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

  topArea: {
    paddingHorizontal: Spacing.containerMargin,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    alignItems: 'flex-start',
  },
  logo: {
    width: 100,
    height: 100,
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
    fontSize: 28,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    color: TEXT_DARK,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  titleHighlightWrap: { position: 'relative' },
  titleHighlight: {
    fontSize: 28,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    color: TEXT_DARK,
    lineHeight: 36,
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

  card: {
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

  segmented: {
    flexDirection: 'row',
    backgroundColor: '#F2F1EE',
    borderRadius: BorderRadius.lg,
    padding: 4,
    height: 44,
    alignItems: 'center',
    marginBottom: 20,
  },
  segment: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  segmentText: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: 0.5,
  },

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
    marginBottom: 16,
  },
  inputFocused: {
    borderColor: ACCENT,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 15,
    color: TEXT_DARK,
    fontFamily: 'PlusJakartaSans_500Medium',
    height: '100%',
  },

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
    marginTop: 8,
  },
  ctaText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: 1.0,
  },

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
});
