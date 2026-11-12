/**
 * change-password.tsx
 *
 * Change the password of a signed-in account.
 * Follows Player Home Dashboard typography, vertical indicator bars, and bento surface architecture.
 */

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText, MAX_FONT_SCALE } from '@/components/themed-text';
import { GradientContainer } from '@/components/gradient-container';
import { Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/context/ToastContext';
import { apiClient, getAuthToken } from '@/services/api-client';
import { changePasswordIssue, isLocalSession, passwordRuleResults } from '@/utils/password-rules';

type FieldKey = 'current' | 'next' | 'confirm';

export default function ChangePasswordScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { showSuccess } = useToast();

  const [values, setValues] = useState<Record<FieldKey, string>>({ current: '', next: '', confirm: '' });
  const [visible, setVisible] = useState<Record<FieldKey, boolean>>({ current: false, next: false, confirm: false });
  const [focused, setFocused] = useState<FieldKey | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  /** null while checking; true for a session with no server account. */
  const [localSession, setLocalSession] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    getAuthToken()
      .then((token) => {
        if (alive) setLocalSession(isLocalSession(token));
      })
      .catch(() => {
        if (alive) setLocalSession(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const rules = passwordRuleResults(values.next);
  const issue = changePasswordIssue(values);
  const confirmMismatch = values.confirm.length > 0 && values.confirm !== values.next;
  const canSubmit = !issue && !submitting && localSession === false;
  const anyTyped = values.current + values.next + values.confirm !== '';

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  const setField = (key: FieldKey, text: string) => {
    setValues((prev) => ({ ...prev, [key]: text }));
    setServerError(null);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setServerError(null);
    try {
      await apiClient.put('/auth/password', { currentPassword: values.current, newPassword: values.next });
      showSuccess('Password updated successfully');
      goBack();
    } catch (err: any) {
      setServerError(
        err?.fromServer ? err.message : 'Could not reach the server. Check your connection and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (
    key: FieldKey,
    label: string,
    placeholder: string,
    icon: keyof typeof Ionicons.glyphMap,
    maxLength: number
  ) => {
    const isFocus = focused === key;
    const isMismatch = key === 'confirm' && confirmMismatch;

    return (
      <View style={styles.field}>
        <ThemedText style={[styles.label, { color: theme.textSecondary }]}>{label}</ThemedText>
        <View
          style={[
            styles.inputBox,
            {
              backgroundColor: theme.surfaceLow,
              borderColor: isMismatch
                ? '#EF4444'
                : isFocus
                ? theme.primary
                : theme.outlineVariant + '35',
            },
          ]}
        >
          <View
            style={[
              styles.fieldIconBadge,
              {
                backgroundColor: isFocus
                  ? theme.primary + '18'
                  : theme.outlineVariant + '20',
              },
            ]}
          >
            <Ionicons
              name={icon}
              size={16}
              color={isMismatch ? '#EF4444' : isFocus ? theme.primary : theme.textSecondary}
            />
          </View>
          <TextInput
            maxFontSizeMultiplier={MAX_FONT_SCALE}
            style={[
              styles.input,
              { color: theme.text },
              Platform.OS === 'web' && ({ outlineStyle: 'none', outlineWidth: 0 } as any),
            ]}
            value={values[key]}
            onChangeText={(t) => setField(key, t)}
            placeholder={placeholder}
            placeholderTextColor="#94a3b8"
            secureTextEntry={!visible[key]}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType={key === 'current' ? 'password' : 'newPassword'}
            maxLength={maxLength}
            editable={localSession === false && !submitting}
            onFocus={() => setFocused(key)}
            onBlur={() => setFocused(null)}
            returnKeyType={key === 'confirm' ? 'done' : 'next'}
            onSubmitEditing={key === 'confirm' ? handleSubmit : undefined}
            accessibilityLabel={label}
          />
          <Pressable
            onPress={() => setVisible((prev) => ({ ...prev, [key]: !prev[key] }))}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={visible[key] ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          >
            <Ionicons
              name={visible[key] ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={theme.textSecondary}
            />
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <GradientContainer screenName="settings" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header Bar */}
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
            onPress={goBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </Pressable>
          <ThemedText style={[styles.headerTitle, { color: theme.text }]}>Change Password</ThemedText>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {localSession && (
              <View style={[styles.notice, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
                <Ionicons name="cloud-offline-outline" size={20} color="#B45309" />
                <View style={{ flex: 1 }}>
                  <ThemedText style={[styles.noticeTitle, { color: '#92400E' }]}>
                    Signed in on this device only
                  </ThemedText>
                  <ThemedText style={[styles.noticeBody, { color: '#92400E' }]}>
                    This session was started without the server, so there is no account password to change. Sign
                    in with your registered email and password, then change it here.
                  </ThemedText>
                </View>
              </View>
            )}

            {/* Section Header */}
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.verticalIndicator, { backgroundColor: '#5D68E8' }]} />
              <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                SECURITY CREDENTIALS
              </ThemedText>
            </View>

            {/* Bento Form Card */}
            <View
              style={[
                styles.card,
                { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' },
                Shadows.level2,
              ]}
            >
              <LinearGradient
                colors={['#5D68E80A', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />

              {renderField('current', 'Current Password', 'Enter current password', 'lock-closed-outline', 64)}
              {renderField('next', 'New Password', 'Enter new password (min 6 chars)', 'key-outline', 12)}

              {/* Live checklist — server enforced requirements */}
              <View style={[styles.rulesContainer, { backgroundColor: theme.surfaceLow }]}>
                <ThemedText style={[styles.rulesHeader, { color: theme.textSecondary }]}>
                  PASSWORD REQUIREMENTS
                </ThemedText>
                <View style={styles.rulesList}>
                  {rules.map((r) => (
                    <View
                      key={r.key}
                      style={styles.ruleRow}
                      accessible
                      accessibilityLabel={`${r.label}: ${r.met ? 'met' : 'not met'}`}
                    >
                      <Ionicons
                        name={r.met ? 'checkmark-circle' : 'ellipse-outline'}
                        size={14}
                        color={r.met ? '#10B981' : theme.textSecondary}
                      />
                      <ThemedText
                        style={[
                          styles.ruleText,
                          {
                            color: r.met ? theme.text : theme.textSecondary,
                            fontFamily: r.met ? 'Sora_600SemiBold' : 'Sora_400Regular',
                          },
                        ]}
                      >
                        {r.label}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              </View>

              {renderField('confirm', 'Confirm New Password', 'Re-enter new password', 'shield-checkmark-outline', 12)}
              {confirmMismatch && (
                <View style={styles.inlineErrorRow}>
                  <Ionicons name="alert-circle" size={13} color="#EF4444" />
                  <ThemedText style={styles.errorText}>Passwords do not match</ThemedText>
                </View>
              )}

              {!!serverError && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color="#DC2626" />
                  <ThemedText style={[styles.errorText, { flex: 1 }]}>{serverError}</ThemedText>
                </View>
              )}
            </View>

            {/* Submit CTA */}
            <Pressable
              onPress={handleSubmit}
              disabled={!canSubmit}
              accessibilityRole="button"
              accessibilityState={{ disabled: !canSubmit, busy: submitting }}
              style={({ pressed }) => [
                styles.submit,
                {
                  backgroundColor: theme.primary,
                  opacity: !canSubmit ? 0.45 : pressed ? 0.85 : 1,
                },
                Shadows.level2,
              ]}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <ThemedText style={styles.submitText}>Update Password</ThemedText>
                  <Ionicons name="arrow-forward" size={16} color="#ffffff" />
                </View>
              )}
            </Pressable>

            {!!issue && localSession === false && anyTyped && !confirmMismatch && (
              <ThemedText style={[styles.hint, { color: theme.textSecondary }]}>{issue}</ThemedText>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 14.5,
    fontFamily: 'Sora_500Medium',
    marginLeft: 8,
  },
  body: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 4,
  },
  verticalIndicator: {
    width: 3.5,
    height: 14,
    borderRadius: 2,
    marginRight: 7,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Sora_500Medium',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  notice: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  noticeTitle: {
    fontSize: 13,
    fontFamily: 'Sora_500Medium',
  },
  noticeBody: {
    fontSize: 10.5,
    fontFamily: 'Sora_400Regular',
    marginTop: 3,
    lineHeight: 15,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1.2,
    padding: 16,
    gap: 14,
    overflow: 'hidden',
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 10,
    fontFamily: 'Sora_500Medium',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.2,
    borderRadius: 14,
    paddingHorizontal: 10,
    height: 48,
  },
  fieldIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    fontFamily: 'Sora_500Medium',
  },
  rulesContainer: {
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  rulesHeader: {
    fontSize: 9,
    fontFamily: 'Sora_500Medium',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  rulesList: {
    gap: 6,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  ruleText: {
    fontSize: 11,
    fontFamily: 'Sora_400Regular',
  },
  inlineErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: -4,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 11,
    fontFamily: 'Sora_500Medium',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
  },
  submit: {
    height: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontFamily: 'Sora_500Medium',
  },
  hint: {
    fontSize: 10.5,
    fontFamily: 'Sora_400Regular',
    textAlign: 'center',
    marginTop: 2,
  },
});
