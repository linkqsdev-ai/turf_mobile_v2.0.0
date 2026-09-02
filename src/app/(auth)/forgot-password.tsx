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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── Design tokens (mirrors landing.tsx) ──────────────────────────────────────
const CREAM_BG  = '#FDF4EC';
const TEXT_DARK = '#1a1a2e';
const TEXT_MID  = '#5a5a7a';
const ACCENT    = '#f59e0b';
const BLOB1     = '#fca5a5';
const BLOB2     = '#fde68a';
const BLOB3     = '#a5f3fc';

export default function ForgotPasswordScreen() {
  const theme  = useTheme();
  const router = useRouter();

  const [email,        setEmail]        = useState('');
  const [isLoading,    setIsLoading]    = useState(false);
  const [isSuccess,    setIsSuccess]    = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isEmailFocused, setIsEmailFocused] = useState(false);

  // ── Entrance animations ───────────────────────────────────────────────────
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

  const handleRecover = () => {
    if (!email) {
      setErrorMessage('Email address is required.');
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
    }, 1500);
  };

  return (
    <View style={styles.container}>
      {/* ── Decorative Blobs ── */}
      <View style={[styles.blob, styles.blobTopLeft,    { backgroundColor: BLOB1 + 'CC' }]} />
      <View style={[styles.blob, styles.blobTopRight,   { backgroundColor: BLOB2 + 'AA' }]} />
      <View style={[styles.blob, styles.blobBottomLeft, { backgroundColor: BLOB3 + '88' }]} />

      {/* Dots */}
      <View style={[styles.dot, { top: SCREEN_HEIGHT * 0.08, left: 32,  backgroundColor: ACCENT + '66', width: 8,  height: 8  }]} />
      <View style={[styles.dot, { top: SCREEN_HEIGHT * 0.14, right: 24, backgroundColor: BLOB1 + '88', width: 12, height: 12 }]} />
      <View style={[styles.dot, { top: SCREEN_HEIGHT * 0.50, left: 20,  backgroundColor: BLOB2 + '88', width: 6,  height: 6  }]} />
      <View style={[styles.dot, { top: SCREEN_HEIGHT * 0.44, right: 18, backgroundColor: ACCENT + '55', width: 10, height: 10 }]} />
      <View style={[styles.pill, { top: SCREEN_HEIGHT * 0.10, right: 60, backgroundColor: TEXT_MID + '22', transform: [{ rotate: '45deg' }] }]} />
      <View style={[styles.pill, { top: SCREEN_HEIGHT * 0.58, left: 40, backgroundColor: ACCENT + '33',   transform: [{ rotate: '-30deg' }] }]} />

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
              <View style={styles.titleRow}>
                <ThemedText style={styles.titleNormal}>Reset </ThemedText>
                <View style={styles.titleHighlightWrap}>
                  <ThemedText style={styles.titleHighlight}>Password</ThemedText>
                  <View style={[styles.highlightBar, { backgroundColor: BLOB1 }]} />
                </View>
              </View>
              <ThemedText style={styles.subtitle}>
                We&apos;ll send recovery instructions to your email
              </ThemedText>
            </Animated.View>

            {/* ── Bottom Card ── */}
            <Animated.View
              style={[
                styles.card,
                { transform: [{ translateY: cardTrans }], opacity: cardOpacity },
              ]}
            >
              {isSuccess ? (
                // ── Success State ──────────────────────────────────────────
                <View style={styles.successState}>
                  <View style={styles.successIconRing}>
                    <Ionicons name="checkmark-circle" size={56} color={ACCENT} />
                  </View>
                  <ThemedText style={styles.successTitle}>Instructions Sent!</ThemedText>
                  <ThemedText style={styles.successBody}>
                    Password recovery instructions have been dispatched to:
                  </ThemedText>
                  <View style={styles.emailBadge}>
                    <Ionicons name="mail-outline" size={16} color={ACCENT} />
                    <ThemedText style={styles.emailBadgeText}>{email.trim().toLowerCase()}</ThemedText>
                  </View>
                  <ThemedText style={styles.successHint}>
                    Check your inbox or spam folder.
                  </ThemedText>

                  <Pressable style={styles.ctaButton} onPress={() => router.push('/login')}>
                    <ThemedText style={styles.ctaText}>BACK TO LOGIN →</ThemedText>
                  </Pressable>
                </View>
              ) : (
                // ── Form State ────────────────────────────────────────────
                <View>
                  <ThemedText style={styles.cardDesc}>
                    Enter the email address linked to your account and we&apos;ll send you a reset link.
                  </ThemedText>

                  {errorMessage && (
                    <View style={styles.errorBox}>
                      <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
                      <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
                    </View>
                  )}

                  <ThemedText style={styles.label}>Email Address</ThemedText>
                  <View style={[styles.inputWrapper, isEmailFocused && styles.inputFocused]}>
                    <Ionicons name="mail-outline" size={18} color={isEmailFocused ? ACCENT : TEXT_MID} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter registered email"
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

                  <Pressable
                    style={[styles.ctaButton, isLoading && { opacity: 0.75 }]}
                    onPress={handleRecover}
                    disabled={isLoading}
                  >
                    {isLoading
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <ThemedText style={styles.ctaText}>SEND RESET LINK →</ThemedText>
                    }
                  </Pressable>

                  <View style={styles.footerRow}>
                    <Ionicons name="arrow-back-outline" size={14} color={TEXT_MID} />
                    <Pressable onPress={() => router.push('/login')}>
                      <ThemedText style={styles.backLink}> Back to Sign In</ThemedText>
                    </Pressable>
                  </View>
                </View>
              )}
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
  blobBottomLeft: {
    width: 100,
    height: 100,
    bottom: 80,
    left: -40,
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
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: Spacing.md,
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
  titleHighlightWrap: { position: 'relative' },
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

  cardDesc: {
    fontSize: 14,
    color: TEXT_MID,
    fontFamily: 'Sora_400Regular',
    lineHeight: 22,
    marginBottom: 28,
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
    fontFamily: 'Sora_500Medium',
  },

  label: {
    fontSize: 13,
    fontFamily: 'Sora_600SemiBold',
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
    marginBottom: 28,
  },
  inputFocused: {
    borderColor: ACCENT,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 15,
    color: TEXT_DARK,
    fontFamily: 'Sora_500Medium',
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
    marginBottom: 24,
  },
  ctaText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Sora_600SemiBold',
    letterSpacing: 1.0,
  },

  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backLink: {
    fontSize: 14,
    color: TEXT_DARK,
    fontFamily: 'Sora_600SemiBold',
  },

  // Success state
  successState: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  successIconRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: ACCENT + '18',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontFamily: 'Sora_600SemiBold',
    color: TEXT_DARK,
    marginTop: 12,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  successBody: {
    fontSize: 14,
    color: TEXT_MID,
    fontFamily: 'Sora_400Regular',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  emailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ACCENT + '15',
    borderWidth: 1,
    borderColor: ACCENT + '33',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    marginBottom: 16,
  },
  emailBadgeText: {
    fontSize: 14,
    fontFamily: 'Sora_600SemiBold',
    color: TEXT_DARK,
  },
  successHint: {
    fontSize: 12,
    color: TEXT_MID,
    fontFamily: 'Sora_400Regular',
    textAlign: 'center',
    marginBottom: 32,
  },
});
