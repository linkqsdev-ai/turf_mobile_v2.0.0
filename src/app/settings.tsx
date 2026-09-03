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

import { ThemedText } from '@/components/themed-text';
import { GradientContainer } from '@/components/gradient-container';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useUserProfile } from '@/hooks/use-user-profile';
import { getAvatarSource } from '@/constants/avatars';
import { useWalletStore } from '@/store/app-store';
import { useToast } from '@/context/ToastContext';
import { setAuthToken } from '@/services/api-client';

// Tamil and Hindi are shown so people know they're planned, but are
// temporarily disabled until translations are ready.
const LANGUAGES: { name: string; comingSoon?: boolean }[] = [
  { name: 'English' },
  { name: 'Tamil', comingSoon: true },
  { name: 'Hindi', comingSoon: true },
];

// A settings row that saves the moment it changes — no separate Save button,
// matching the platform convention (iOS/Android Settings) rather than the
// old modal's manual Save/Cancel.
function SwitchRow({
  title,
  subtitle,
  value,
  onValueChange,
  theme,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  theme: any;
}) {
  return (
    <View style={styles.switchRow}>
      <View style={{ flex: 1, marginRight: Spacing.md }}>
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
  title,
  subtitle,
  onPress,
  theme,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  theme: any;
  danger?: boolean;
}) {
  const color = danger ? '#ba1a1a' : theme.text;
  return (
    <Pressable style={styles.linkRow} onPress={onPress}>
      <View style={[styles.linkIconWrap, { backgroundColor: danger ? '#ba1a1a15' : theme.surfaceLow }]}>
        <Ionicons name={icon} size={17} color={danger ? '#ba1a1a' : theme.primary} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <ThemedText style={[styles.rowTitle, { color }]}>{title}</ThemedText>
        {subtitle ? <ThemedText style={[styles.rowSubtitle, { color: theme.textSecondary }]}>{subtitle}</ThemedText> : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.outline} />
    </Pressable>
  );
}

function SectionCard({ title, icon, children, theme }: { title: string; icon: keyof typeof Ionicons.glyphMap; children: React.ReactNode; theme: any }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <Ionicons name={icon} size={15} color={theme.secondary} />
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>{title}</ThemedText>
      </View>
      <View style={[styles.sectionCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
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
  const { walletBalance } = useWalletStore();
  const { showSuccess } = useToast();

  const [languagePickerOpen, setLanguagePickerOpen] = useState(false);
  const [signOutVisible, setSignOutVisible] = useState(false);
  const [deleteAccountVisible, setDeleteAccountVisible] = useState(false);
  const [clearCacheVisible, setClearCacheVisible] = useState(false);
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

  const handleClearCache = async () => {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      // Keep auth + profile, wipe everything else the app has cached
      // (bookings, teams, matches, turfs, classes, bids, offers, drafts…).
      const keep = new Set(['@turf_auth_token', '@turf_user_profile']);
      const toRemove = allKeys.filter((k) => !keep.has(k));
      await AsyncStorage.multiRemove(toRemove);
      setClearCacheVisible(false);
      showSuccess('Cache cleared');
    } catch (err) {
      console.error('Settings: Failed to clear cache', err);
      Alert.alert('Something went wrong', 'Could not clear the cache. Please try again.');
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
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </Pressable>
          <ThemedText type="headlineMd" style={{ color: theme.text, flex: 1, marginLeft: 12 }}>
            Settings
          </ThemedText>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
          {/* ── Account ── */}
          <View style={styles.section}>
            <Pressable
              style={[styles.accountCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}
              onPress={() => router.push('/edit-profile')}
            >
              <Image
                source={getAvatarSource(profile.avatarUrl)}
                style={styles.avatarImage}
              />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <ThemedText style={[styles.accountName, { color: theme.text }]} numberOfLines={1}>{profile.name}</ThemedText>
                <ThemedText style={[styles.accountMeta, { color: theme.textSecondary }]}>{profile.role} · Edit profile</ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.outline} />
            </Pressable>
          </View>

          {/* ── Appearance ── */}
          <SectionCard title="APPEARANCE" icon="color-palette-outline" theme={theme}>
            <ThemedText style={[styles.rowTitle, { color: theme.text, marginBottom: 10 }]}>Application Theme</ThemedText>
            <View style={styles.themeRow}>
              {([
                { key: 'light', label: 'Light', icon: 'sunny-outline' as const },
                { key: 'dark', label: 'Dark', icon: 'moon-outline' as const },
                { key: 'blue', label: 'Blue', icon: 'color-fill-outline' as const },
              ]).map((opt) => {
                const active = (profile.theme || 'blue') === opt.key;
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => set({ theme: opt.key as 'light' | 'dark' | 'blue' })}
                    style={[
                      styles.themeOptionBtn,
                      active ? { backgroundColor: theme.primary, borderColor: theme.primary } : { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33' },
                    ]}
                  >
                    <Ionicons name={opt.icon} size={16} color={active ? theme.onPrimary : theme.text} />
                    <ThemedText style={{ color: active ? theme.onPrimary : theme.text, fontSize: 11, fontFamily: 'Sora_500Medium' }}>{opt.label}</ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </SectionCard>

          {/* ── Notifications ── */}
          <SectionCard title="NOTIFICATIONS" icon="notifications-outline" theme={theme}>
            <SwitchRow theme={theme} title="Push Notifications" subtitle="Alerts for matches, bookings, and chats" value={profile.pushNotifications ?? true} onValueChange={(v) => set({ pushNotifications: v })} />
            <Divider theme={theme} />
            <SwitchRow theme={theme} title="Email Alerts" subtitle="Weekly summaries and invoicing" value={profile.emailAlerts ?? false} onValueChange={(v) => set({ emailAlerts: v })} />
            <Divider theme={theme} />
            <SwitchRow theme={theme} title="SMS Alerts" subtitle="Text message reminders for urgent updates" value={profile.smsAlerts ?? false} onValueChange={(v) => set({ smsAlerts: v })} />
            <Divider theme={theme} />
            <SwitchRow theme={theme} title="Match Reminders" subtitle="Reminders before your scheduled matches" value={profile.matchReminders ?? true} onValueChange={(v) => set({ matchReminders: v })} />
            <Divider theme={theme} />
            <SwitchRow theme={theme} title="Promotional Offers" subtitle="Discounts, vouchers, and seasonal deals" value={profile.promoOffers ?? false} onValueChange={(v) => set({ promoOffers: v })} />
          </SectionCard>

          {/* ── Privacy & Security ── */}
          <SectionCard title="PRIVACY & SECURITY" icon="shield-checkmark-outline" theme={theme}>
            <ThemedText style={[styles.rowTitle, { color: theme.text, marginBottom: 10 }]}>Profile Visibility</ThemedText>
            <View style={styles.visibilityRow}>
              {(['public', 'private'] as const).map((v) => {
                const active = (profile.profileVisibility || 'public') === v;
                return (
                  <Pressable
                    key={v}
                    onPress={() => set({ profileVisibility: v })}
                    style={[
                      styles.visibilityBtn,
                      active ? { backgroundColor: theme.primary, borderColor: theme.primary } : { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33' },
                    ]}
                  >
                    <Ionicons name={v === 'public' ? 'globe-outline' : 'lock-closed-outline'} size={14} color={active ? theme.onPrimary : theme.text} />
                    <ThemedText style={{ color: active ? theme.onPrimary : theme.text, fontSize: 12, fontFamily: 'Sora_500Medium', marginLeft: 6 }}>
                      {v === 'public' ? 'Public' : 'Private'}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
            <Divider theme={theme} />
            <SwitchRow theme={theme} title="Location Sharing" subtitle="Let the app detect your location for nearby turfs" value={profile.locationSharingEnabled ?? true} onValueChange={(v) => set({ locationSharingEnabled: v })} />
            <Divider theme={theme} />
            <LinkRow theme={theme} icon="key-outline" title="Change Password" subtitle="Reset your account password" onPress={() => router.push('/forgot-password')} />
          </SectionCard>

          {/* ── Integrations (PRO) ── */}
          <SectionCard title="INTEGRATIONS" icon="extension-puzzle-outline" theme={theme}>
            <Pressable
              onPress={() => Alert.alert('🔒 PRO Feature', 'Integrations & API key configuration are exclusive PRO features. Upgrade to unlock!')}
              style={{ opacity: 0.55 }}
            >
              <View pointerEvents="none">
                <ThemedText style={[styles.rowTitle, { color: theme.textSecondary, marginBottom: 6 }]}>Service API Key</ThemedText>
                <TextInput
                  value={geminiKey}
                  onChangeText={setGeminiKey}
                  editable={false}
                  secureTextEntry
                  style={[styles.textInput, { backgroundColor: theme.surfaceLow, color: theme.textSecondary, borderColor: theme.outlineVariant + '33' }]}
                  placeholder="Enter API key…"
                  placeholderTextColor="#94a3b8"
                />
                <View style={[styles.switchRow, { marginTop: Spacing.md, paddingVertical: 0 }]}>
                  <ThemedText style={[styles.rowSubtitle, { color: theme.textSecondary, flex: 1 }]}>Suggestions & auto-generation</ThemedText>
                  <Switch value disabled trackColor={{ false: theme.surfaceLow, true: theme.primary }} thumbColor="#ffffff" />
                </View>
              </View>
            </Pressable>
          </SectionCard>

          {/* ── Bookings & Wallet ── */}
          <SectionCard title="BOOKINGS & PAYMENTS" icon="calendar-outline" theme={theme}>
            <LinkRow theme={theme} icon="calendar-outline" title="Booking History" subtitle="View active, completed & cancelled reservations" onPress={() => router.push('/booking-history')} />
            <Divider theme={theme} />
            <LinkRow theme={theme} icon="wallet-outline" title="My Sports Wallet" subtitle={`Balance: ₹${walletBalance.toFixed(2)}`} onPress={() => router.push('/wallet')} />
            <Divider theme={theme} />
            {/* Reachable from Settings rather than only the owner hub, because
                coaches and organizers get paid through the same profile. */}
            <LinkRow theme={theme} icon="cash-outline" title="Earnings & Payments" subtitle="Payment status, escrow and statements" onPress={() => router.push('/owner-earnings')} />
            <Divider theme={theme} />
            <LinkRow theme={theme} icon="card-outline" title="Payout & Tax Details" subtitle="Address, GST and how you get paid" onPress={() => router.push('/payout-settings')} />
          </SectionCard>

          {/* ── Language & Region ── */}
          <SectionCard title="LANGUAGE & REGION" icon="language-outline" theme={theme}>
            <LinkRow theme={theme} icon="language-outline" title="App Language" subtitle={profile.language || 'English'} onPress={() => setLanguagePickerOpen(true)} />
          </SectionCard>

          {/* ── Data & Storage ── */}
          <SectionCard title="DATA & STORAGE" icon="server-outline" theme={theme}>
            <LinkRow theme={theme} icon="trash-bin-outline" title="Clear Cache" subtitle="Free up space by clearing cached bookings, teams & matches" onPress={() => setClearCacheVisible(true)} />
          </SectionCard>

          {/* ── Help & Support ── */}
          <SectionCard title="HELP & SUPPORT" icon="help-circle-outline" theme={theme}>
            <LinkRow theme={theme} icon="help-buoy-outline" title="FAQs" subtitle="Answers to common questions" onPress={() => Alert.alert('FAQs', 'Our FAQ center is coming soon. In the meantime, reach out via Contact Support.')} />
            <Divider theme={theme} />
            <LinkRow theme={theme} icon="mail-outline" title="Contact Support" subtitle="support@nonstricker.com" onPress={() => Linking.openURL('mailto:support@nonstricker.com')} />
            <Divider theme={theme} />
            <LinkRow theme={theme} icon="warning-outline" title="Report a Problem" subtitle="Tell us what went wrong" onPress={() => Alert.alert('Report a Problem', 'Please describe the issue to support@nonstricker.com and our team will follow up.')} />
          </SectionCard>

          {/* ── About ── */}
          <SectionCard title="ABOUT" icon="information-circle-outline" theme={theme}>
            <View style={styles.switchRow}>
              <ThemedText style={[styles.rowTitle, { color: theme.text }]}>App Version</ThemedText>
              <ThemedText style={[styles.rowSubtitle, { color: theme.textSecondary }]}>1.0.0</ThemedText>
            </View>
            <Divider theme={theme} />
            <LinkRow theme={theme} icon="document-text-outline" title="Terms of Service" onPress={() => Alert.alert('Terms of Service', 'Our Terms of Service will be available here soon.')} />
            <Divider theme={theme} />
            <LinkRow theme={theme} icon="lock-closed-outline" title="Privacy Policy" onPress={() => Alert.alert('Privacy Policy', 'Our Privacy Policy will be available here soon.')} />
          </SectionCard>

          {/* ── Danger Zone ── */}
          <View style={styles.section}>
            <View style={[styles.sectionCard, { backgroundColor: theme.surfaceLowest, borderColor: '#ba1a1a22' }, Shadows.level1]}>
              <LinkRow theme={theme} icon="power-outline" title="Sign Out" onPress={() => setSignOutVisible(true)} danger />
              <Divider theme={theme} />
              <LinkRow theme={theme} icon="trash-outline" title="Delete Account" subtitle="Permanently remove your account and data" onPress={() => setDeleteAccountVisible(true)} danger />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Language Picker */}
      <Modal visible={languagePickerOpen} transparent animationType="fade" onRequestClose={() => setLanguagePickerOpen(false)}>
        <Pressable style={styles.confirmModalBackdrop} onPress={() => setLanguagePickerOpen(false)}>
          <Pressable style={[styles.pickerSheet, { backgroundColor: theme.surfaceLowest }]} onPress={(e) => e.stopPropagation()}>
            <ThemedText type="headlineSm" style={{ color: theme.text, marginBottom: Spacing.sm }}>App Language</ThemedText>
            {LANGUAGES.map((lang) => {
              const isSelected = (profile.language || 'English') === lang.name;
              return (
                <Pressable
                  key={lang.name}
                  style={[styles.languageOption, lang.comingSoon && { opacity: 0.45 }]}
                  disabled={lang.comingSoon}
                  onPress={() => { set({ language: lang.name }); setLanguagePickerOpen(false); }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ThemedText style={{ color: theme.text, fontSize: 14, fontFamily: isSelected ? 'Sora_600SemiBold' : 'Sora_500Medium' }}>{lang.name}</ThemedText>
                    {lang.comingSoon && (
                      <View style={[styles.comingSoonBadge, { backgroundColor: theme.surfaceLow }]}>
                        <ThemedText style={{ fontSize: 8.5, fontFamily: 'Sora_500Medium', color: theme.textSecondary, letterSpacing: 0.3 }}>COMING SOON</ThemedText>
                      </View>
                    )}
                  </View>
                  {isSelected && <Ionicons name="checkmark" size={18} color={theme.primary} />}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Clear Cache Confirmation */}
      <Modal visible={clearCacheVisible} transparent animationType="fade" onRequestClose={() => setClearCacheVisible(false)}>
        <View style={styles.confirmModalBackdrop}>
          <View style={[styles.confirmModalCard, { backgroundColor: theme.surfaceLowest }]}>
            <Ionicons name="trash-bin" size={44} color={theme.primary} style={{ alignSelf: 'center', marginBottom: 12 }} />
            <ThemedText type="headlineSm" style={{ textAlign: 'center', color: theme.text }}>Clear Cache?</ThemedText>
            <ThemedText type="bodySm" style={{ textAlign: 'center', color: theme.textSecondary, marginVertical: 12 }}>
              This removes locally cached bookings, teams, matches, and turfs. Your login and profile stay intact.
            </ThemedText>
            <View style={styles.confirmActionsRow}>
              <Pressable style={[styles.confirmBtn, styles.cancelBtn, { borderColor: theme.outlineVariant + '55' }]} onPress={() => setClearCacheVisible(false)}>
                <ThemedText type="labelMd" style={{ color: theme.text }}>Cancel</ThemedText>
              </Pressable>
              <Pressable style={[styles.confirmBtn, { backgroundColor: theme.primary }]} onPress={handleClearCache}>
                <ThemedText type="labelMd" style={{ color: '#ffffff' }}>Clear Cache</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sign Out Confirmation */}
      <Modal visible={signOutVisible} transparent animationType="fade" onRequestClose={() => setSignOutVisible(false)}>
        <View style={styles.confirmModalBackdrop}>
          <View style={[styles.confirmModalCard, { backgroundColor: theme.surfaceLowest }]}>
            <View style={[styles.confirmIconWrap, { backgroundColor: theme.error + '15' }]}>
              <Ionicons name="power" size={26} color={theme.error} />
            </View>
            <ThemedText type="headlineSm" style={{ textAlign: 'center', color: theme.text }}>Sign Out</ThemedText>
            <ThemedText type="bodySm" style={{ textAlign: 'center', color: theme.textSecondary, marginVertical: 12 }}>
              Are you sure you want to sign out from NonStricker?
            </ThemedText>
            <View style={styles.confirmActionsRow}>
              <Pressable style={[styles.confirmBtn, styles.cancelBtn, { borderColor: theme.outlineVariant + '55' }]} onPress={() => setSignOutVisible(false)}>
                <ThemedText type="labelMd" style={{ color: theme.text }}>Cancel</ThemedText>
              </Pressable>
              <Pressable style={[styles.confirmBtn, { backgroundColor: theme.error }]} onPress={() => { setSignOutVisible(false); logOut(); }}>
                <ThemedText type="labelMd" style={{ color: '#ffffff' }}>Sign Out</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Account Confirmation */}
      <Modal visible={deleteAccountVisible} transparent animationType="fade" onRequestClose={() => setDeleteAccountVisible(false)}>
        <View style={styles.confirmModalBackdrop}>
          <View style={[styles.confirmModalCard, { backgroundColor: theme.surfaceLowest }]}>
            <Ionicons name="warning" size={44} color="#ba1a1a" style={{ alignSelf: 'center', marginBottom: 12 }} />
            <ThemedText type="headlineSm" style={{ textAlign: 'center', color: theme.text }}>Delete Account?</ThemedText>
            <ThemedText type="bodySm" style={{ textAlign: 'center', color: theme.textSecondary, marginVertical: 12 }}>
              This permanently deletes your profile, teams, bookings, and matches from this device. This cannot be undone.
            </ThemedText>
            <View style={styles.confirmActionsRow}>
              <Pressable style={[styles.confirmBtn, styles.cancelBtn, { borderColor: theme.outlineVariant + '55' }]} onPress={() => setDeleteAccountVisible(false)}>
                <ThemedText type="labelMd" style={{ color: theme.text }}>Cancel</ThemedText>
              </Pressable>
              <Pressable style={[styles.confirmBtn, { backgroundColor: '#ba1a1a' }]} onPress={() => { setDeleteAccountVisible(false); handleDeleteAccount(); }}>
                <ThemedText type="labelMd" style={{ color: '#ffffff' }}>Delete</ThemedText>
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
    paddingHorizontal: Spacing.containerMargin,
    paddingVertical: Spacing.md,
    zIndex: 10,
  },
  backBtn: { padding: 4 },

  section: {
    paddingHorizontal: Spacing.containerMargin,
    marginTop: Spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Sora_500Medium',
    letterSpacing: 0.6,
  },
  sectionCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.md,
  },

  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.md,
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  accountName: {
    fontSize: 15,
    fontFamily: 'Sora_500Medium',
  },
  accountMeta: {
    fontSize: 11,
    marginTop: 2,
    fontFamily: 'Sora_500Medium',
  },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  divider: {
    height: 1,
  },
  rowTitle: {
    fontSize: 13,
    fontFamily: 'Sora_500Medium',
  },
  rowSubtitle: {
    fontSize: 11,
    fontFamily: 'Sora_500Medium',
    marginTop: 2,
  },

  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  linkIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  themeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  themeOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
  },

  visibilityRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  visibilityBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
  },

  textInput: {
    height: 44,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 13,
    fontFamily: 'Sora_500Medium',
    borderWidth: 1,
  },

  // Modals
  confirmModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 21, 30, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  confirmModalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  confirmIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.sm,
  },
  confirmActionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  confirmBtn: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    borderWidth: 1,
  },

  pickerSheet: {
    width: '100%',
    maxWidth: 340,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  comingSoonBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
});
