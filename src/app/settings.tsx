import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Switch,
  TextInput,
  Alert,
  Linking,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText, MAX_FONT_SCALE } from '@/components/themed-text';
import { GradientContainer } from '@/components/gradient-container';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useUserProfile } from '@/hooks/use-user-profile';
import { getAvatarSource } from '@/constants/avatars';
import { useToast } from '@/context/ToastContext';
import { setAuthToken } from '@/services/api-client';

const LANGUAGES: { name: string; comingSoon?: boolean }[] = [
  { name: 'English' },
  { name: 'Tamil', comingSoon: true },
  { name: 'Hindi', comingSoon: true },
];

function SwitchRow({
  icon,
  iconColor,
  title,
  subtitle,
  value,
  onValueChange,
  theme,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  theme: any;
}) {
  return (
    <View style={styles.switchRow}>
      {icon && (
        <View style={[styles.iconBadge, { backgroundColor: (iconColor || theme.primary) + '18' }]}>
          <Ionicons name={icon} size={17} color={iconColor || theme.primary} />
        </View>
      )}
      <View style={{ flex: 1, marginRight: Spacing.sm }}>
        <ThemedText style={[styles.rowTitle, { color: theme.text }]}>{title}</ThemedText>
        <ThemedText style={[styles.rowSubtitle, { color: theme.textSecondary }]}>{subtitle}</ThemedText>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.surfaceLow, true: theme.primary }}
        thumbColor="#ffffff"
      />
    </View>
  );
}

function LinkRow({
  icon,
  iconColor,
  title,
  subtitle,
  valueBadge,
  onPress,
  theme,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  subtitle?: string;
  valueBadge?: string;
  onPress: () => void;
  theme: any;
  danger?: boolean;
}) {
  const textColor = danger ? '#EF4444' : theme.text;
  const badgeColor = danger ? '#EF4444' : (iconColor || theme.primary);

  return (
    <Pressable
      style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.75 }]}
      onPress={onPress}
    >
      <View style={[styles.iconBadge, { backgroundColor: badgeColor + '18' }]}>
        <Ionicons name={icon} size={17} color={badgeColor} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <ThemedText style={[styles.rowTitle, { color: textColor }]}>{title}</ThemedText>
        {subtitle ? <ThemedText style={[styles.rowSubtitle, { color: theme.textSecondary }]}>{subtitle}</ThemedText> : null}
      </View>
      {valueBadge && (
        <View style={[styles.valueBadgeWrap, { backgroundColor: theme.surfaceLow }]}>
          <ThemedText style={[styles.valueBadgeText, { color: theme.textSecondary }]}>{valueBadge}</ThemedText>
        </View>
      )}
      <Ionicons name="chevron-forward" size={15} color={theme.outline} style={{ marginLeft: 6 }} />
    </Pressable>
  );
}

function SectionCard({
  title,
  indicatorColor = '#5D68E8',
  children,
  theme,
}: {
  title: string;
  indicatorColor?: string;
  children: React.ReactNode;
  theme: any;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <View style={[styles.verticalIndicator, { backgroundColor: indicatorColor }]} />
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>{title}</ThemedText>
      </View>
      <View
        style={[
          styles.sectionCard,
          {
            backgroundColor: theme.surfaceLowest,
            borderColor: theme.outlineVariant + '33',
          },
          Shadows.level1,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

function Divider({ theme }: { theme: any }) {
  return <View style={[styles.divider, { backgroundColor: theme.outlineVariant + '22' }]} />;
}

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { profile, updateProfile } = useUserProfile();
  const { showSuccess } = useToast();

  const [languagePickerOpen, setLanguagePickerOpen] = useState(false);
  const [signOutVisible, setSignOutVisible] = useState(false);
  const [deleteAccountVisible, setDeleteAccountVisible] = useState(false);
  const [geminiKey, setGeminiKey] = useState(profile.geminiApiKey ?? '');

  const set = (patch: Partial<typeof profile>) => {
    updateProfile(patch);
    showSuccess('Settings saved');
  };

  const logOut = async () => {
    try {
      await AsyncStorage.removeItem('@turf_user_profile');
      await setAuthToken(null);
    } catch (err) {
      console.error('Settings: Sign out failed, redirecting anyway:', err);
    } finally {
      router.replace('/(auth)/landing');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await AsyncStorage.clear();
      await setAuthToken(null);
    } catch (err) {
      console.error('Settings: Delete account cleanup failed, redirecting anyway:', err);
    } finally {
      router.replace('/(auth)/landing');
    }
  };

  return (
    <GradientContainer screenName="settings" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header Bar */}
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
          >
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </Pressable>
          <ThemedText style={[styles.headerTitle, { color: theme.text }]}>Settings</ThemedText>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
          {/* ── User Account Bento Card ── */}
          <View style={styles.section}>
            <Pressable
              style={({ pressed }) => [
                styles.accountCard,
                {
                  backgroundColor: theme.surfaceLowest,
                  borderColor: theme.outlineVariant + '33',
                },
                Shadows.level2,
                pressed && { opacity: 0.88 },
              ]}
              onPress={() => router.push('/edit-profile')}
            >
              <LinearGradient
                colors={['#5D68E812', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.avatarWrap}>
                <Image source={getAvatarSource(profile.avatarUrl)} style={styles.avatarImage} />
                <View style={[styles.avatarVerifiedBadge, { backgroundColor: '#10B981' }]}>
                  <Ionicons name="checkmark" size={10} color="#ffffff" />
                </View>
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <ThemedText style={[styles.accountName, { color: theme.text }]} numberOfLines={1}>
                  {profile.name}
                </ThemedText>
                <View style={styles.accountRoleRow}>
                  <View style={[styles.roleCapsule, { backgroundColor: theme.primary + '18' }]}>
                    <ThemedText style={[styles.roleCapsuleText, { color: theme.primary }]}>
                      {profile.role || 'Player'}
                    </ThemedText>
                  </View>
                  <ThemedText style={[styles.accountMeta, { color: theme.textSecondary }]}>
                    Edit Profile
                  </ThemedText>
                </View>
              </View>
              <View style={[styles.editPillBtn, { backgroundColor: theme.surfaceLow }]}>
                <Ionicons name="create-outline" size={14} color={theme.primary} />
                <Ionicons name="chevron-forward" size={14} color={theme.outline} style={{ marginLeft: 2 }} />
              </View>
            </Pressable>
          </View>

          {/* ── Privacy & Security ── */}
          <SectionCard title="PRIVACY & SECURITY" indicatorColor="#10B981" theme={theme}>
            <ThemedText style={[styles.rowTitle, { color: theme.text, marginBottom: 8 }]}>
              Profile Visibility
            </ThemedText>
            <View style={styles.visibilityRow}>
              {(['public', 'private'] as const).map((v) => {
                const active = (profile.profileVisibility || 'public') === v;
                return (
                  <Pressable
                    key={v}
                    onPress={() => set({ profileVisibility: v })}
                    style={[
                      styles.visibilityBtn,
                      active
                        ? { backgroundColor: theme.primary, borderColor: theme.primary }
                        : { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33' },
                    ]}
                  >
                    <Ionicons
                      name={v === 'public' ? 'globe-outline' : 'lock-closed-outline'}
                      size={14}
                      color={active ? theme.onPrimary : theme.text}
                    />
                    <ThemedText
                      style={[
                        styles.visibilityBtnText,
                        { color: active ? theme.onPrimary : theme.text },
                      ]}
                    >
                      {v === 'public' ? 'Public' : 'Private'}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
            <Divider theme={theme} />
            <SwitchRow
              icon="location-outline"
              iconColor="#10B981"
              theme={theme}
              title="Location Sharing"
              subtitle="Let the app detect your location for nearby turfs"
              value={profile.locationSharingEnabled ?? true}
              onValueChange={(v) => set({ locationSharingEnabled: v })}
            />
          </SectionCard>

          {/* ── Integrations (PRO) ── */}
          <SectionCard title="INTEGRATIONS" indicatorColor="#8B5CF6" theme={theme}>
            <Pressable
              onPress={() =>
                Alert.alert(
                  '🔒 PRO Feature',
                  'Integrations & API key configuration are exclusive PRO features. Upgrade to unlock!'
                )
              }
              style={{ opacity: 0.65 }}
            >
              <View pointerEvents="none">
                <ThemedText style={[styles.rowTitle, { color: theme.textSecondary, marginBottom: 8 }]}>
                  Service API Key
                </ThemedText>
                <TextInput
                  maxFontSizeMultiplier={MAX_FONT_SCALE}
                  value={geminiKey}
                  onChangeText={setGeminiKey}
                  editable={false}
                  secureTextEntry
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: theme.surfaceLow,
                      color: theme.textSecondary,
                      borderColor: theme.outlineVariant + '33',
                    },
                  ]}
                  placeholder="Enter API key…"
                  placeholderTextColor="#94a3b8"
                />
                <View style={[styles.switchRow, { marginTop: Spacing.md, paddingVertical: 0 }]}>
                  <ThemedText style={[styles.rowSubtitle, { color: theme.textSecondary, flex: 1 }]}>
                    AI suggestions & match analytics
                  </ThemedText>
                  <Switch
                    value
                    disabled
                    trackColor={{ false: theme.surfaceLow, true: theme.primary }}
                    thumbColor="#ffffff"
                  />
                </View>
              </View>
            </Pressable>
          </SectionCard>

          {/* ── Language & Region ── */}
          <SectionCard title="LANGUAGE & REGION" indicatorColor="#06B6D4" theme={theme}>
            <LinkRow
              icon="language-outline"
              iconColor="#06B6D4"
              theme={theme}
              title="App Language"
              valueBadge={profile.language || 'English'}
              onPress={() => setLanguagePickerOpen(true)}
            />
          </SectionCard>

          {/* ── Help & Support ── */}
          <SectionCard title="HELP & SUPPORT" indicatorColor="#F59E0B" theme={theme}>
            <LinkRow
              icon="help-buoy-outline"
              iconColor="#F59E0B"
              theme={theme}
              title="FAQs"
              subtitle="Answers to common questions"
              onPress={() =>
                Alert.alert('FAQs', 'Our FAQ center is coming soon. In the meantime, reach out via Contact Support.')
              }
            />
            <Divider theme={theme} />
            <LinkRow
              icon="mail-outline"
              iconColor="#5D68E8"
              theme={theme}
              title="Contact Support"
              subtitle="support@nonstricker.com"
              onPress={() => Linking.openURL('mailto:support@nonstricker.com')}
            />
            <Divider theme={theme} />
            <LinkRow
              icon="warning-outline"
              iconColor="#EF4444"
              theme={theme}
              title="Report a Problem"
              subtitle="Tell us what went wrong"
              onPress={() =>
                Alert.alert('Report a Problem', 'Please describe the issue to support@nonstricker.com and our team will follow up.')
              }
            />
          </SectionCard>

          {/* ── About ── */}
          <SectionCard title="ABOUT" indicatorColor="#64748B" theme={theme}>
            <View style={styles.switchRow}>
              <View style={[styles.iconBadge, { backgroundColor: '#64748B18' }]}>
                <Ionicons name="information-circle-outline" size={17} color="#64748B" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <ThemedText style={[styles.rowTitle, { color: theme.text }]}>App Version</ThemedText>
              </View>
              <View style={[styles.valueBadgeWrap, { backgroundColor: theme.surfaceLow }]}>
                <ThemedText style={[styles.valueBadgeText, { color: theme.textSecondary }]}>v2.0.0</ThemedText>
              </View>
            </View>
            <Divider theme={theme} />
            <LinkRow
              icon="document-text-outline"
              iconColor="#64748B"
              theme={theme}
              title="Terms of Service"
              onPress={() => Alert.alert('Terms of Service', 'Our Terms of Service will be available here soon.')}
            />
            <Divider theme={theme} />
            <LinkRow
              icon="shield-outline"
              iconColor="#64748B"
              theme={theme}
              title="Privacy Policy"
              onPress={() => Alert.alert('Privacy Policy', 'Our Privacy Policy will be available here soon.')}
            />
          </SectionCard>

          {/* ── Danger Zone ── */}
          <SectionCard title="ACCOUNT ACTIONS" indicatorColor="#EF4444" theme={theme}>
            <LinkRow
              icon="log-out-outline"
              iconColor="#EF4444"
              theme={theme}
              title="Sign Out"
              onPress={() => setSignOutVisible(true)}
              danger
            />
            <Divider theme={theme} />
            <LinkRow
              icon="trash-outline"
              iconColor="#EF4444"
              theme={theme}
              title="Delete Account"
              subtitle="Permanently remove your account and data"
              onPress={() => setDeleteAccountVisible(true)}
              danger
            />
          </SectionCard>
        </ScrollView>
      </SafeAreaView>

      {/* Language Picker Modal */}
      <Modal
        visible={languagePickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setLanguagePickerOpen(false)}
      >
        <Pressable style={styles.confirmModalBackdrop} onPress={() => setLanguagePickerOpen(false)}>
          <Pressable
            style={[
              styles.pickerSheet,
              { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' },
              Shadows.level2,
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeaderRow}>
              <View style={[styles.verticalIndicator, { backgroundColor: '#06B6D4' }]} />
              <ThemedText style={[styles.modalTitle, { color: theme.text }]}>App Language</ThemedText>
            </View>
            {LANGUAGES.map((lang, index) => {
              const isSelected = (profile.language || 'English') === lang.name;
              return (
                <Pressable
                  key={lang.name}
                  style={[
                    styles.languageOption,
                    isSelected && { backgroundColor: theme.primary + '12' },
                    lang.comingSoon && { opacity: 0.5 },
                  ]}
                  disabled={lang.comingSoon}
                  onPress={() => {
                    set({ language: lang.name });
                    setLanguagePickerOpen(false);
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <ThemedText
                      style={{
                        color: theme.text,
                        fontSize: 13.5,
                        fontFamily: isSelected ? 'Sora_600SemiBold' : 'Sora_400Regular',
                      }}
                    >
                      {lang.name}
                    </ThemedText>
                    {lang.comingSoon && (
                      <View style={[styles.comingSoonBadge, { backgroundColor: theme.surfaceLow }]}>
                        <ThemedText
                          style={{
                            fontSize: 8.5,
                            fontFamily: 'Sora_600SemiBold',
                            color: theme.textSecondary,
                            letterSpacing: 0.3,
                          }}
                        >
                          COMING SOON
                        </ThemedText>
                      </View>
                    )}
                  </View>
                  {isSelected && <Ionicons name="checkmark-circle" size={18} color={theme.primary} />}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Sign Out Confirmation Modal */}
      <Modal
        visible={signOutVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSignOutVisible(false)}
      >
        <View style={styles.confirmModalBackdrop}>
          <View
            style={[
              styles.confirmModalCard,
              { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' },
              Shadows.level2,
            ]}
          >
            <View style={[styles.confirmIconWrap, { backgroundColor: '#EF444415' }]}>
              <Ionicons name="power" size={20} color="#EF4444" />
            </View>
            <ThemedText style={[styles.confirmTitle, { color: theme.text }]}>Sign Out</ThemedText>
            <ThemedText style={[styles.confirmSubtitle, { color: theme.textSecondary }]}>
              Are you sure you want to sign out from NonStricker?
            </ThemedText>
            <View style={styles.confirmActionsRow}>
              <Pressable
                style={[
                  styles.confirmBtn,
                  styles.cancelBtn,
                  { borderColor: theme.outlineVariant + '55', backgroundColor: theme.surfaceLow },
                ]}
                onPress={() => setSignOutVisible(false)}
              >
                <ThemedText style={[styles.confirmBtnText, { color: theme.text }]}>Cancel</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.confirmBtn, { backgroundColor: '#EF4444' }]}
                onPress={() => {
                  setSignOutVisible(false);
                  logOut();
                }}
              >
                <ThemedText style={[styles.confirmBtnText, { color: '#ffffff' }]}>Sign Out</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Account Confirmation Modal */}
      <Modal
        visible={deleteAccountVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteAccountVisible(false)}
      >
        <View style={styles.confirmModalBackdrop}>
          <View
            style={[
              styles.confirmModalCard,
              { backgroundColor: theme.surfaceLowest, borderColor: '#EF444433' },
              Shadows.level2,
            ]}
          >
            <View style={[styles.confirmIconWrap, { backgroundColor: '#EF444415' }]}>
              <Ionicons name="warning" size={22} color="#EF4444" />
            </View>
            <ThemedText style={[styles.confirmTitle, { color: theme.text }]}>Delete Account?</ThemedText>
            <ThemedText style={[styles.confirmSubtitle, { color: theme.textSecondary }]}>
              This permanently deletes your profile, teams, bookings, and match history from this device. This action cannot be undone.
            </ThemedText>
            <View style={styles.confirmActionsRow}>
              <Pressable
                style={[
                  styles.confirmBtn,
                  styles.cancelBtn,
                  { borderColor: theme.outlineVariant + '55', backgroundColor: theme.surfaceLow },
                ]}
                onPress={() => setDeleteAccountVisible(false)}
              >
                <ThemedText style={[styles.confirmBtnText, { color: theme.text }]}>Cancel</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.confirmBtn, { backgroundColor: '#EF4444' }]}
                onPress={() => {
                  setDeleteAccountVisible(false);
                  handleDeleteAccount();
                }}
              >
                <ThemedText style={[styles.confirmBtnText, { color: '#ffffff' }]}>Delete</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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

  section: {
    paddingHorizontal: 16,
    marginTop: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
  sectionCard: {
    borderRadius: 18,
    borderWidth: 1.2,
    paddingHorizontal: 14,
    paddingVertical: 10,
    overflow: 'hidden',
  },

  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1.2,
    padding: 14,
    overflow: 'hidden',
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarVerifiedBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  accountName: {
    fontSize: 15.5,
    fontFamily: 'Sora_500Medium',
  },
  accountRoleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  roleCapsule: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  roleCapsuleText: {
    fontSize: 8.5,
    fontFamily: 'Sora_500Medium',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  accountMeta: {
    fontSize: 10.5,
    fontFamily: 'Sora_400Regular',
  },
  editPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 999,
  },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  rowTitle: {
    fontSize: 13,
    fontFamily: 'Sora_500Medium',
  },
  rowSubtitle: {
    fontSize: 10.5,
    fontFamily: 'Sora_400Regular',
    marginTop: 2,
    lineHeight: 14,
  },

  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },

  valueBadgeWrap: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  valueBadgeText: {
    fontSize: 10,
    fontFamily: 'Sora_500Medium',
  },

  visibilityRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
  },
  visibilityBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1.2,
  },
  visibilityBtnText: {
    fontSize: 11.5,
    fontFamily: 'Sora_500Medium',
    marginLeft: 6,
  },

  textInput: {
    height: 38,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 12.5,
    fontFamily: 'Sora_500Medium',
    borderWidth: 1,
  },

  // Modals
  confirmModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 21, 30, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmModalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    borderWidth: 1.2,
    padding: 20,
    alignItems: 'center',
  },
  confirmIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmTitle: {
    fontSize: 15.5,
    fontFamily: 'Sora_500Medium',
    textAlign: 'center',
  },
  confirmSubtitle: {
    fontSize: 11,
    fontFamily: 'Sora_400Regular',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 18,
    lineHeight: 16,
  },
  confirmActionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  confirmBtn: {
    flex: 1,
    height: 38,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    borderWidth: 1,
  },
  confirmBtnText: {
    fontSize: 11.5,
    fontFamily: 'Sora_500Medium',
  },

  pickerSheet: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    borderWidth: 1.2,
    padding: 18,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 14,
    fontFamily: 'Sora_500Medium',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginVertical: 2,
  },
  comingSoonBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
});
