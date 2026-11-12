/**
 * profile-drawer.tsx
 *
 * The left drawer the header avatar opens, in three sections: Profile (view and
 * edit), Functions (what this role does in the app — see
 * constants/drawer-links.ts) and Settings (notifications, theme, data & storage,
 * password, and the rest of the settings page).
 *
 * Every tab screen draws its own header, and several return early for other
 * roles, so rather than threading a hook into each one the drawer is mounted
 * once in the root layout and opened with `openProfileDrawer()` — a drop-in for
 * the `router.push('/profile')` those headers used.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/themed-text';
import { getAvatarSource } from '@/constants/avatars';
import {
  drawerFunctionLinks,
  DrawerLinkSpec,
  NOTIFICATION_SETTINGS,
  notificationsSummary,
  THEME_OPTIONS,
} from '@/constants/drawer-links';
import { useToast } from '@/context/ToastContext';
import { useTheme } from '@/hooks/use-theme';
import { useUserProfile, getShortLocation, UserProfile } from '@/hooks/use-user-profile';
import { useRemoteConfig } from '@/context/RemoteConfigContext';
import { DRAWER_FEATURES, filterByFeature } from '@/lib/remote-config';
import { useWalletStore } from '@/store/app-store';
import { cacheKeysToClear } from '@/utils/app-cache';
import { setAuthToken } from '@/services/api-client';

let setDrawerOpen: ((open: boolean) => void) | null = null;

/** Open the profile drawer from anywhere. Safe to pass straight to onPress. */
export function openProfileDrawer() {
  setDrawerOpen?.(true);
}

/** Mounted once in the root layout; owns whether the drawer is open. */
export function ProfileDrawerHost() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen = setOpen;
    return () => {
      if (setDrawerOpen === setOpen) setDrawerOpen = null;
    };
  }, []);

  return <ProfileDrawer open={open} onClose={() => setOpen(false)} />;
}

const EASE = Easing.bezier(0.22, 1, 0.36, 1);

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function ProfileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { profile, updateProfile } = useUserProfile();
  const { config: remoteConfig } = useRemoteConfig();
  const { walletBalance } = useWalletStore();
  const { showSuccess } = useToast();

  const panelWidth = Math.min(320, Math.round(width * 0.84));
  const [mounted, setMounted] = useState(open);
  const progress = useSharedValue(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  // Confirmed inline: a second modal over the drawer's own is unreliable on iOS.
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  /**
   * Where to go once the drawer has finished closing. Pushing straight away
   * opened the next screen underneath the still-visible modal on native.
   */
  const pendingPath = useRef<string | null>(null);

  const finishClose = useCallback(() => {
    setMounted(false);
    setNotificationsOpen(false);
    setConfirmClear(false);
    const path = pendingPath.current;
    pendingPath.current = null;
    if (path) router.push(path as Href);
  }, []);

  useEffect(() => {
    if (open) {
      setMounted(true);
      progress.value = withTiming(1, { duration: 260, easing: EASE });
    } else {
      progress.value = withTiming(0, { duration: 200, easing: EASE }, (finished) => {
        'worklet';
        if (finished) runOnJS(finishClose)();
      });
    }
  }, [open, progress, finishClose]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (progress.value - 1) * panelWidth }],
  }));

  const navigate = (path: string) => {
    pendingPath.current = path;
    onClose();
  };

  /** Saves the moment it changes, like the settings page did. */
  const saveSetting = (patch: Partial<UserProfile>) => {
    updateProfile(patch);
    showSuccess('Settings saved');
  };

  const handleClearCache = async () => {
    setClearing(true);
    try {
      const keys = await AsyncStorage.getAllKeys();
      await AsyncStorage.multiRemove(cacheKeysToClear(keys));
      setConfirmClear(false);
      showSuccess('Cache cleared');
    } catch (err) {
      console.error('Drawer: failed to clear cache', err);
      Alert.alert('Something went wrong', 'Could not clear the cache. Please try again.');
    } finally {
      setClearing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      if (Platform.OS === 'web') {
        try {
          localStorage.removeItem('@turf_auth_token');
          localStorage.removeItem('@turf_user_profile');
        } catch (e) {
          console.error('Drawer: localStorage error during sign out:', e);
        }
      }
      await AsyncStorage.removeItem('@turf_user_profile');
      await setAuthToken(null);
    } catch (err) {
      console.error('Drawer: Sign out failed, redirecting anyway:', err);
    } finally {
      onClose();
      router.replace('/(auth)/landing');
    }
  };

  if (!mounted) return null;

  const profileLinks: DrawerLinkSpec[] = [
    {
      key: 'profile', label: 'View Profile', hint: 'Stats, bio & activity',
      icon: 'person-circle-outline', tint: theme.primary, path: '/profile',
    },
    {
      key: 'edit', label: 'Edit Profile', hint: 'Photo, name, location & sports',
      icon: 'create-outline', tint: theme.primary, path: '/edit-profile',
    },
  ];

  // The wallet shortcut shows the live balance rather than a static hint.
  // Shortcuts to features the Super Admin switched off for this role are left out.
  const functionLinks = filterByFeature(drawerFunctionLinks(profile.role), (link) => link.key, DRAWER_FEATURES, remoteConfig).map((link) =>
    link.key === 'wallet'
      ? { ...link, hint: `Balance ₹${Number(walletBalance || 0).toFixed(2)} · vouchers & rewards` }
      : link
  );

  const rowStyle = ({ pressed }: { pressed: boolean }) => [styles.linkRow, pressed && { backgroundColor: theme.surfaceLow }];

  const renderRowBody = (icon: string, tint: string, label: string, hint: string, trailing: IoniconName) => (
    <>
      <View style={[styles.linkIcon, { backgroundColor: tint + '1A' }]}>
        <Ionicons name={icon as IoniconName} size={18} color={tint} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <ThemedText numberOfLines={1} style={[styles.linkLabel, { color: theme.text }]}>{label}</ThemedText>
        <ThemedText numberOfLines={1} style={[styles.linkHint, { color: theme.textSecondary }]}>{hint}</ThemedText>
      </View>
      <Ionicons name={trailing} size={16} color={theme.textSecondary} />
    </>
  );

  const renderLink = (link: DrawerLinkSpec) => (
    <Pressable
      key={link.key}
      onPress={() => navigate(link.path)}
      accessibilityRole="button"
      accessibilityLabel={link.label}
      accessibilityHint={link.hint}
      style={rowStyle}
    >
      {renderRowBody(link.icon, link.tint, link.label, link.hint, 'chevron-forward')}
    </Pressable>
  );

  const sectionHeading = (title: string, barColor: string) => (
    <View style={styles.sectionHeaderRow}>
      <View style={[styles.sectionIndicatorBar, { backgroundColor: barColor }]} />
      <ThemedText style={[styles.sectionLabel, { color: theme.textSecondary }]}>
        {title}
      </ThemedText>
    </View>
  );

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close menu"
          />
        </Animated.View>

        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.panel,
            {
              width: panelWidth,
              backgroundColor: theme.surfaceLowest,
              paddingTop: insets.top,
            },
            panelStyle,
          ]}
        >
          <LinearGradient
            colors={[theme.primary + '20', theme.primary + '06', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ambientWash}
            pointerEvents="none"
          />

          {/* User Profile Header Block */}
          <View style={styles.headerBlock}>
            <View style={styles.headerRow}>
              <View style={[styles.avatarRing, { borderColor: theme.primary + '55', backgroundColor: theme.surfaceLow }]}>
                <Image
                  source={getAvatarSource(profile.avatarUrl)}
                  style={styles.avatar}
                  contentFit="cover"
                />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <ThemedText numberOfLines={1} style={[styles.name, { color: theme.text }]}>
                  {profile.name}
                </ThemedText>
                <View style={styles.metaRow}>
                  <View style={[styles.roleChip, { backgroundColor: theme.primary + '18', borderColor: theme.primary + '35' }]}>
                    <ThemedText numberOfLines={1} style={[styles.roleText, { color: theme.primary }]}>
                      {profile.role}
                    </ThemedText>
                  </View>
                  {!!profile.location && (
                    <View style={styles.locationWrap}>
                      <Ionicons name="location-sharp" size={11} color={theme.textSecondary} />
                      <ThemedText numberOfLines={1} style={[styles.location, { color: theme.textSecondary }]}>
                        {getShortLocation(profile.location)}
                      </ThemedText>
                    </View>
                  )}
                </View>
              </View>
              <Pressable
                onPress={onClose}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Close menu"
                style={({ pressed }) => [
                  styles.closeBtn,
                  { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '35' },
                  pressed && { opacity: 0.8 }
                ]}
              >
                <Ionicons name="close" size={18} color={theme.text} />
              </Pressable>
            </View>
          </View>

          {/* Scrollable menu content */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
            {/* ── PROFILE SECTION ── */}
            <View style={styles.section}>
              {sectionHeading('PROFILE', theme.primary)}
              {profileLinks.map(renderLink)}
            </View>

            {/* ── FUNCTIONS SECTION ── */}
            <View style={[styles.section, { borderTopWidth: 1, borderTopColor: theme.outlineVariant + '22', paddingTop: 14 }]}>
              {sectionHeading('FUNCTIONS', '#10B981')}
              {functionLinks.map(renderLink)}
            </View>

            {/* ── SETTINGS SECTION ── */}
            <View style={[styles.section, { borderTopWidth: 1, borderTopColor: theme.outlineVariant + '22', paddingTop: 14 }]}>
              {sectionHeading('SETTINGS', '#F59E0B')}

              {/* Notifications Accordion */}
              <Pressable
                onPress={() => setNotificationsOpen((o) => !o)}
                accessibilityRole="button"
                accessibilityState={{ expanded: notificationsOpen }}
                accessibilityLabel="Notifications"
                style={rowStyle}
              >
                {renderRowBody(
                  'notifications-outline',
                  '#EF4444',
                  'Notifications',
                  notificationsSummary(profile),
                  notificationsOpen ? 'chevron-up' : 'chevron-down'
                )}
              </Pressable>
              {notificationsOpen && (
                <View style={[styles.subPanel, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '25' }]}>
                  {NOTIFICATION_SETTINGS.map((n, i) => (
                    <View
                      key={n.key}
                      style={[styles.switchRow, i > 0 && { borderTopWidth: 1, borderTopColor: theme.outlineVariant + '22' }]}
                    >
                      <View style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                        <ThemedText numberOfLines={1} style={[styles.switchLabel, { color: theme.text }]}>{n.label}</ThemedText>
                        <ThemedText numberOfLines={2} style={[styles.linkHint, { color: theme.textSecondary }]}>{n.hint}</ThemedText>
                      </View>
                      <Switch
                        value={profile[n.key] ?? n.defaultOn}
                        onValueChange={(v) => saveSetting({ [n.key]: v } as Partial<UserProfile>)}
                        trackColor={{ false: theme.outlineVariant + '66', true: theme.primary }}
                        thumbColor="#ffffff"
                        accessibilityLabel={n.label}
                      />
                    </View>
                  ))}
                </View>
              )}

              {/* Theme selector */}
              <View style={styles.linkRow}>
                <View style={[styles.linkIcon, { backgroundColor: '#8B5CF61A' }]}>
                  <Ionicons name="color-palette-outline" size={18} color="#8B5CF6" />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <ThemedText numberOfLines={1} style={[styles.linkLabel, { color: theme.text }]}>Theme</ThemedText>
                  <View style={styles.themeRow}>
                    {THEME_OPTIONS.map((opt) => {
                      const active = (profile.theme || 'blue') === opt.key;
                      return (
                        <Pressable
                          key={opt.key}
                          onPress={() => saveSetting({ theme: opt.key })}
                          accessibilityRole="radio"
                          accessibilityState={{ checked: active }}
                          accessibilityLabel={`${opt.label} theme`}
                          style={({ pressed }) => [
                            styles.themeChip,
                            active
                              ? { backgroundColor: theme.primary, borderColor: theme.primary }
                              : { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '35' },
                            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
                          ]}
                        >
                          <Ionicons name={opt.icon} size={13} color={active ? theme.onPrimary : theme.text} />
                          <ThemedText style={[styles.themeChipText, { color: active ? theme.onPrimary : theme.text }]}>
                            {opt.label}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </View>

              {/* Data & Storage */}
              <Pressable
                onPress={() => setConfirmClear((c) => !c)}
                accessibilityRole="button"
                accessibilityState={{ expanded: confirmClear }}
                accessibilityLabel="Data and storage"
                style={rowStyle}
              >
                {renderRowBody(
                  'server-outline',
                  '#0EA5E9',
                  'Data & Storage',
                  'Clear cached bookings, teams & matches',
                  confirmClear ? 'chevron-up' : 'chevron-down'
                )}
              </Pressable>
              {confirmClear && (
                <View style={[styles.subPanel, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '25', paddingVertical: 12 }]}>
                  <ThemedText style={[styles.switchLabel, { color: theme.text }]}>Clear Cache?</ThemedText>
                  <ThemedText style={[styles.linkHint, { color: theme.textSecondary, marginTop: 2 }]}>
                    This removes locally cached bookings, teams, matches and turfs. Your login and profile stay intact.
                  </ThemedText>
                  <View style={styles.confirmRow}>
                    <Pressable
                      onPress={() => setConfirmClear(false)}
                      accessibilityRole="button"
                      style={({ pressed }) => [
                        styles.confirmBtn,
                        { borderWidth: 1, borderColor: theme.outlineVariant + '55', backgroundColor: theme.surfaceLowest },
                        pressed && { opacity: 0.8 }
                      ]}
                    >
                      <ThemedText style={[styles.confirmText, { color: theme.text }]}>Cancel</ThemedText>
                    </Pressable>
                    <Pressable
                      onPress={handleClearCache}
                      disabled={clearing}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: clearing, busy: clearing }}
                      style={({ pressed }) => [
                        styles.confirmBtn,
                        { backgroundColor: theme.primary },
                        pressed && { opacity: 0.9 }
                      ]}
                    >
                      {clearing ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <ThemedText style={[styles.confirmText, { color: '#ffffff' }]}>Clear Cache</ThemedText>
                      )}
                    </Pressable>
                  </View>
                </View>
              )}

              {renderLink({
                key: 'password', label: 'Change Password', hint: 'Reset your account password',
                icon: 'key-outline', tint: '#F59E0B', path: '/change-password',
              })}
              {renderLink({
                key: 'settings', label: 'Settings', hint: 'Privacy, language, help & about',
                icon: 'settings-outline', tint: '#64748B', path: '/settings',
              })}

              {/* Sign Out Button */}
              <Pressable
                onPress={handleSignOut}
                accessibilityRole="button"
                accessibilityLabel="Sign out"
                style={rowStyle}
              >
                {renderRowBody(
                  'log-out-outline',
                  '#EF4444',
                  'Sign Out',
                  'Sign out of your account on this device',
                  'chevron-forward'
                )}
              </Pressable>
            </View>

            {/* Subtle Brand Watermark */}
            <View style={styles.brandWatermark}>
              <ThemedText style={[styles.brandText, { color: theme.textSecondary + '80' }]}>
                TURF CRICKET & SPORTS · V2.0
              </ThemedText>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backdrop: { backgroundColor: 'rgba(5, 21, 30, 0.50)' },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    paddingHorizontal: 16,
    borderTopRightRadius: 26,
    borderBottomRightRadius: 26,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 14,
    overflow: 'hidden',
  },
  ambientWash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
  },
  headerBlock: {
    marginBottom: 10,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  name: { fontSize: 15.5, fontFamily: 'Sora_500Medium' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  roleChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, borderWidth: 1 },
  roleText: { fontSize: 8.5, fontFamily: 'Sora_500Medium', letterSpacing: 0.6, textTransform: 'uppercase' },
  locationWrap: { flexDirection: 'row', alignItems: 'center', gap: 2, flexShrink: 1 },
  location: { fontSize: 10.5, fontFamily: 'Sora_400Regular', flexShrink: 1 },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { paddingTop: 14, paddingBottom: 6 },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionIndicatorBar: {
    width: 3.5,
    height: 14,
    borderRadius: 2,
  },
  sectionLabel: {
    fontSize: 10,
    letterSpacing: 0.9,
    fontFamily: 'Sora_500Medium',
    textTransform: 'uppercase',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 14,
  },
  linkIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkLabel: { fontSize: 13, fontFamily: 'Sora_500Medium' },
  linkHint: { fontSize: 10.5, fontFamily: 'Sora_400Regular', marginTop: 1, lineHeight: 14 },
  subPanel: {
    marginHorizontal: 6,
    marginVertical: 6,
    borderRadius: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  switchLabel: { fontSize: 12.5, fontFamily: 'Sora_500Medium' },
  themeRow: { flexDirection: 'row', gap: 6, marginTop: 7 },
  themeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5.5,
  },
  themeChipText: { fontSize: 11, fontFamily: 'Sora_500Medium' },
  confirmRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  confirmBtn: {
    flex: 1,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: { fontSize: 11.5, fontFamily: 'Sora_500Medium' },
  brandWatermark: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  brandText: {
    fontSize: 8.5,
    fontFamily: 'Sora_500Medium',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});

