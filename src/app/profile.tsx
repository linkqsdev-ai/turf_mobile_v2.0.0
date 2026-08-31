import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Platform,
  Alert,
  Modal,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { setAuthToken } from '@/services/api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GradientContainer } from '@/components/gradient-container';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useUserProfile, getShortLocation } from '@/hooks/use-user-profile';
import { getAvatarSource } from '@/constants/avatars';
import { useAppStore, useWalletStore } from '@/store/app-store';
import { FavouriteTeamIcon } from '@/components/favourite-team-icon';
import { getMascotImage } from '@/constants/mascots';
import type { Team } from '@/store/match-store';

const BANNERS: Record<string, any> = {
  football: { uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC9H8hZV1gCxBOC9fWHjQyhn5ukWJhiNGuP6cNDATeIj2gP6JceuAOrhkqeTXWFS75Y0nw0QANCmhRdo0NYvbdmh4Xrs2itBjykGtZr0Y91KEzjUMyOoM-B-owetUT1u8vwmIZlGJkcKdkgVfU0TIGzuVVlTN3lhwfdg5OWwHMCKOyPJGWWdIKySwofsCUjnq9pJi4WH0BMDAi73A53u0OeKj_Ufmh6V4PVwghrjz5aX16NlvQZLOkQRC51252maP-4ZXwNw3MwVfU' }, // Premium Football Arena
  multisport: { uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYH5UnRgCz_j_xsBoTCePAImR1ZHOP1RfajoZLHKUgxQwU2qFlQ8NWyiYz_-6zqqufh9YnYe3jfTI8tuaUrjmH6obvvea2p2vYA7ndyut0M5-lxcOtwTVQQwh58VRPis3197lvVOpVGsJ6YCx55CCy4Q_1CqZxk1rVqp9mBGHM-rDNwh7PGYSDJt6Vq4tmn6G1gXGiZsm13J0D1BFkKFRb8WvrWqqyLWxu-oSZsnMp6YXOONRG89ypF-GKlh96WMcF3HOikmE9l-g' }, // Indoor Multisport Hub
  cricket: { uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBgd1vfTA0Wj7Aw7aa0JRKzQ5y-6py-pQtMBI-gst90jIWFZoLSiIKBngPK1pn2UxzH_X3pN_lyCt75AnQxS2ssN4J4LUIYpph_JK48kGmSoO16OFhs5uLgsc_Yu3PIrOEneDELuLpKY8BDiUsatTLvRSu0sukxSfAxInyA2XknjvcswWPyUJA2YeNlJ2Vg2t7N807Cydno4uUCtypPyLkI0hi7Xl4DnWaNBueVN4jqiXqkqrc8MEPwQF24g45uu8z8gsXQ9IL87oI' }, // Cricket Pitch Night
  checkout: { uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBrIeKWYsLxon2GlQroYjnKVPqbeEnzeZiUZZ66CS06N5lbQ6MVSfOE-hColTE6vO6R5n1-bbL_cX-FjW9ejhGGsOeF-oZuoniI7zrrjF_Im8cMeI1IQaIPPl2Mm_XTP52C0Hkood--_ZK22d3Y_tQbO8xBHh5eS8yONy6ot93tgSxXVz2H18xWI0l2EBv6WrOWm8NhnH_-kSXo0bhv0p-MeWPtkT0mEOuYpzsvJ9LUe3eu3QC6YZZU6zVrz5F5A68HtNAmq_qmBOw' }, // Cricket Pitch Daylight
  community: { uri: 'https://lh3.googleusercontent.com/aida/AP1WRLsc-p9LNafOZ1s0XNvsry058SauJeeElNyBuxym6ZhiCwUG-0KP3qZ9-Sv9OP3OVnhWKioZVSoN3EOcZ2Kc1OJKGOZSB9ioEnBSpLCgsYN-AgQXrVnc2O42rAutO6l6aFEvLsUgBHN57i3-AzCKTfZRam7oDm5L2CnDWRLIXfdFRBK8iz2MsaYQVAdtk0OH1XwkBTPbr18Wr5zuBBhvwfiVQv44xHBz7SD6kBdiyxqkNCP8zmwoVF8DaWI' }, // Club Community
};

// Teams this player has faced in past matches (view-only — not the player's own roster).
// Reuses the same fictional league as the "Recent Matches" mock data on player-profile.tsx.
const PLAYED_TEAMS: { name: string; sport: string; mascot: string; runs: number; wickets: number; hr: number }[] = [
  { name: 'London Lions', sport: 'Cricket', mascot: 'falcon', runs: 342, wickets: 8, hr: 76 },
  { name: 'Kent Kings', sport: 'Cricket', mascot: 'warrior', runs: 289, wickets: 11, hr: 64 },
  { name: 'Sussex Sharks', sport: 'Cricket', mascot: 'shark', runs: 210, wickets: 6, hr: 58 },
  { name: 'Yorkshire Vikings', sport: 'Cricket', mascot: 'wolf', runs: 198, wickets: 9, hr: 45 },
  { name: 'Essex Eagles', sport: 'Cricket', mascot: 'eagle', runs: 176, wickets: 5, hr: 52 },
];

const TABS = ['Profile', 'Performance', 'Feed', 'Ranking'] as const;
type TabType = typeof TABS[number];

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { profile, updateProfile } = useUserProfile();
  const { walletBalance, addWalletFunds } = useWalletStore();
  const { teams } = useAppStore();
  const favouriteTeams = teams.filter((t) => t.isFavourite);
  const [activeTab, setActiveTab] = useState<TabType>('Profile');
  const [refreshing, setRefreshing] = useState(false);
  const [squadTeam, setSquadTeam] = useState<Team | null>(null);
  const role = profile.role || 'Player';

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);
  // Settings state
  const [signOutModalVisible, setSignOutModalVisible] = useState(false);

  const handleSelectBanner = () => {
    Alert.alert(
      'Change Profile Banner',
      'Select a realistic mock arena cover for your banner:',
      [
        { text: 'Premium Football Arena', onPress: () => updateProfile({ bannerImage: 'football' }) },
        { text: 'Indoor Multisport Hub', onPress: () => updateProfile({ bannerImage: 'multisport' }) },
        { text: 'Cricket Pitch Night', onPress: () => updateProfile({ bannerImage: 'cricket' }) },
        { text: 'Cricket Pitch Daylight', onPress: () => updateProfile({ bannerImage: 'checkout' }) },
        { text: 'Club Community', onPress: () => updateProfile({ bannerImage: 'community' }) },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };


  const logOut = async () => {
    try {
      if (Platform.OS === 'web') {
        try {
          localStorage.removeItem('@turf_auth_token');
          localStorage.removeItem('@turf_user_profile');
        } catch (e) {
          console.error('localStorage error during sign out:', e);
        }
      }
      await AsyncStorage.removeItem('@turf_user_profile');
      await setAuthToken(null);
    } catch (err) {
      console.error('Sign out client call failed, redirecting anyway:', err);
    } finally {
      router.replace('/(auth)/landing');
    }
  };

  const handleSignOut = () => {
    setSignOutModalVisible(true);
  };

  return (
    <GradientContainer screenName="profile" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header Bar */}
        <View style={[styles.header, { backgroundColor: 'transparent' }]}>
          <Pressable 
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)');
              }
            }} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </Pressable>
          <ThemedText type="headlineSm" style={styles.headerTitle}>
            {role === 'Owner' 
              ? 'Arena Owner Profile' 
              : role === 'Coach' 
              ? 'Coach Profile' 
              : role === 'Organizer' 
              ? 'Organizer Profile' 
              : 'Player Profile'}
          </ThemedText>
          <View style={styles.headerActionsRow}>
            <Pressable
              onPress={() => router.push('/wallet')}
              style={[styles.iconButtonSmall, { backgroundColor: '#f59e0b1f' }]}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Wallet & offers"
            >
              <Ionicons name="pricetag-outline" size={16} color="#f59e0b" />
            </Pressable>
            <Pressable
              onPress={() => router.push('/settings')}
              style={[styles.iconButtonSmall, { backgroundColor: theme.surfaceLow }]}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Settings"
            >
              <Ionicons name="settings-outline" size={16} color={theme.text} />
            </Pressable>
            <Pressable
              onPress={handleSignOut}
              style={[styles.iconButtonSmall, { backgroundColor: '#ef44441f' }]}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Sign out"
            >
              <Ionicons name="power-outline" size={16} color="#ef4444" />
            </Pressable>
          </View>
        </View>

        {/* Fixed Hero Profile Card (Mock-Matched Premium Layout) */}
        <View style={styles.heroSection}>
          <View style={[styles.heroCard, { backgroundColor: '#0f1721', borderWidth: 0 }, Shadows.level2]}>
            {/* Banner Image */}
            <Image 
              source={BANNERS[profile.bannerImage || 'football']} 
              style={styles.heroBannerImage} 
              contentFit="cover"
            />
            
            {/* Edit Banner Option */}
            <Pressable 
              onPress={handleSelectBanner}
              style={styles.editBannerBtn}
            >
              <Ionicons name="camera" size={14} color="#ffffff" />
            </Pressable>
            
            {/* Scrim so the avatar edge and banner meet cleanly instead of cutting hard */}
            <LinearGradient
              colors={['rgba(15, 23, 33, 0)', 'rgba(15, 23, 33, 0.55)', '#0f1721']}
              style={styles.bannerScrim}
              pointerEvents="none"
            />

            {/* Profile identity block — avatar overlaps the banner, text sits clear below it */}
            <View style={styles.profileHeaderBlock}>
              <View style={styles.avatarWrapper}>
                <Image
                  source={getAvatarSource(profile.avatarUrl)}
                  style={styles.avatarImage}
                />
                <Pressable
                  onPress={() => router.push('/edit-profile')}
                  style={[styles.avatarUploadBtn, { backgroundColor: theme.secondaryContainer }]}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Change profile photo"
                >
                  <Ionicons name="camera" size={11} color={theme.onSecondaryContainer} />
                </Pressable>
              </View>

              <View style={styles.profileTextDetails}>
                <ThemedText
                  type="headlineMd"
                  numberOfLines={2}
                  style={styles.profileNameText}
                >
                  {profile.name}
                </ThemedText>

                <View style={styles.profileMetaRow}>
                  <Ionicons name="location-sharp" size={13} color="#cbd5e1" style={{ marginTop: 1 }} />
                  <ThemedText type="bodySm" style={styles.profileMetaText} numberOfLines={2}>
                    {getShortLocation(profile.location)}
                  </ThemedText>
                  <View style={styles.metaDot} />
                  <ThemedText type="labelSm" style={styles.profileMemberText} numberOfLines={2}>
                    Since {profile.memberSince.split(' ')[0]} {profile.memberSince.split(' ')[1]}
                  </ThemedText>
                </View>
              </View>
            </View>

            {/* Pill Action Button Row */}
            <View style={styles.pillActionRow}>
              <Pressable 
                onPress={() => router.push('/edit-profile')}
                style={[styles.pillActionBtn, { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.15)', borderWidth: 1 }]}
              >
                <Ionicons name="create-outline" size={14} color="#ffffff" style={{ marginRight: 6 }} />
                <ThemedText type="labelSm" style={{ color: '#ffffff', fontWeight: 'bold' }}>Edit Profile</ThemedText>
              </Pressable>

              <Pressable 
                onPress={() => {
                  Alert.alert('Share Stats', 'Your profile stats link has been copied to your clipboard!');
                }}
                style={[styles.pillActionBtn, { flex: 1, backgroundColor: theme.secondaryContainer }]}
              >
                <Ionicons name="share-social-outline" size={14} color={theme.onSecondaryContainer} style={{ marginRight: 6 }} />
                <ThemedText type="labelSm" style={{ color: theme.onSecondaryContainer, fontWeight: 'bold' }}>Share Stats</ThemedText>
              </Pressable>
            </View>

            {/* Card Stats Grid (Mock Reference Alignment) */}
            <View style={[styles.cardStatsRow, { borderTopColor: 'rgba(255, 255, 255, 0.08)', borderBottomColor: 'rgba(255, 255, 255, 0.08)' }]}>
              {role === 'Owner' ? (
                <>
                  <View style={styles.cardStatItem}>
                    <ThemedText type="displayLgMobile" style={{ color: '#ffffff' }}>1.2k</ThemedText>
                    <ThemedText type="labelSm" style={{ color: '#94a3b8', marginTop: 3, fontSize: 9, letterSpacing: 0.3 }}>Bookings</ThemedText>
                  </View>
                  <View style={[styles.verticalDivider, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]} />
                  <View style={styles.cardStatItem}>
                    <ThemedText type="displayLgMobile" style={{ color: '#ffffff' }}>8.4k</ThemedText>
                    <ThemedText type="labelSm" style={{ color: '#94a3b8', marginTop: 3, fontSize: 9, letterSpacing: 0.3 }}>Visitors</ThemedText>
                  </View>
                  <View style={[styles.verticalDivider, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]} />
                  <View style={styles.cardStatItem}>
                    <ThemedText type="displayLgMobile" style={{ color: '#ffffff' }}>3</ThemedText>
                    <ThemedText type="labelSm" style={{ color: '#94a3b8', marginTop: 3, fontSize: 9, letterSpacing: 0.3 }}>Pitches</ThemedText>
                  </View>
                </>
              ) : role === 'Coach' ? (
                <>
                  <View style={styles.cardStatItem}>
                    <ThemedText type="displayLgMobile" style={{ color: '#ffffff' }}>48</ThemedText>
                    <ThemedText type="labelSm" style={{ color: '#94a3b8', marginTop: 3, fontSize: 9, letterSpacing: 0.3 }}>Trainees</ThemedText>
                  </View>
                  <View style={[styles.verticalDivider, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]} />
                  <View style={styles.cardStatItem}>
                    <ThemedText type="displayLgMobile" style={{ color: '#ffffff' }}>320</ThemedText>
                    <ThemedText type="labelSm" style={{ color: '#94a3b8', marginTop: 3, fontSize: 9, letterSpacing: 0.3 }}>Coached Hrs</ThemedText>
                  </View>
                  <View style={[styles.verticalDivider, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]} />
                  <View style={styles.cardStatItem}>
                    <ThemedText type="displayLgMobile" style={{ color: '#ffffff' }}>18</ThemedText>
                    <ThemedText type="labelSm" style={{ color: '#94a3b8', marginTop: 3, fontSize: 9, letterSpacing: 0.3 }}>Batches</ThemedText>
                  </View>
                </>
              ) : role === 'Organizer' ? (
                <>
                  <View style={styles.cardStatItem}>
                    <ThemedText type="displayLgMobile" style={{ color: '#ffffff' }}>12</ThemedText>
                    <ThemedText type="labelSm" style={{ color: '#94a3b8', marginTop: 3, fontSize: 9, letterSpacing: 0.3 }}>Leagues</ThemedText>
                  </View>
                  <View style={[styles.verticalDivider, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]} />
                  <View style={styles.cardStatItem}>
                    <ThemedText type="displayLgMobile" style={{ color: '#ffffff' }}>96</ThemedText>
                    <ThemedText type="labelSm" style={{ color: '#94a3b8', marginTop: 3, fontSize: 9, letterSpacing: 0.3 }}>Teams</ThemedText>
                  </View>
                  <View style={[styles.verticalDivider, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]} />
                  <View style={styles.cardStatItem}>
                    <ThemedText type="displayLgMobile" style={{ color: '#ffffff' }}>24</ThemedText>
                    <ThemedText type="labelSm" style={{ color: '#94a3b8', marginTop: 3, fontSize: 9, letterSpacing: 0.3 }}>Hosted</ThemedText>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.cardStatItem}>
                    <ThemedText type="displayLgMobile" style={{ color: '#ffffff' }}>142</ThemedText>
                    <ThemedText type="labelSm" style={{ color: '#94a3b8', marginTop: 3, fontSize: 9, letterSpacing: 0.3 }}>Matches</ThemedText>
                  </View>
                  <View style={[styles.verticalDivider, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]} />
                  <View style={styles.cardStatItem}>
                    <ThemedText type="displayLgMobile" style={{ color: '#ffffff' }}>12.4k</ThemedText>
                    <ThemedText type="labelSm" style={{ color: '#94a3b8', marginTop: 3, fontSize: 9, letterSpacing: 0.3 }}>Followers</ThemedText>
                  </View>
                  <View style={[styles.verticalDivider, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]} />
                  <View style={styles.cardStatItem}>
                    <ThemedText type="displayLgMobile" style={{ color: '#ffffff' }}>89</ThemedText>
                    <ThemedText type="labelSm" style={{ color: '#94a3b8', marginTop: 3, fontSize: 9, letterSpacing: 0.3 }}>Wins</ThemedText>
                  </View>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Fixed Dynamic Tab Navigation Bar — segmented control, Profile leads and is prominent by default */}
        <View style={[styles.tabsContainer, { backgroundColor: theme.surfaceLow }]}>
          {TABS.map((tab) => {
            const isProDisabled = tab !== 'Profile';
            const isActive = activeTab === tab;
            const iconMap: Record<string, string> = {
              'Profile': isActive ? 'person' : 'person-outline',
              'Performance': 'bar-chart-outline',
              'Feed': 'layers-outline',
              'Ranking': 'trophy-outline',
            };
            return (
              <Pressable
                key={tab}
                onPress={() => {
                  if (isProDisabled) {
                    Alert.alert('🔒 PRO Feature', `${tab} analytics is an exclusive PRO feature. Upgrade to unlock!`);
                  } else {
                    setActiveTab(tab);
                  }
                }}
                style={[
                  styles.tabButton,
                  isActive && [styles.tabButtonActive, { backgroundColor: theme.primary }],
                ]}
              >
                <Ionicons
                  name={iconMap[tab] as any}
                  size={isActive ? 14 : 12}
                  color={isActive ? '#ffffff' : theme.textSecondary}
                />
                <ThemedText
                  style={{
                    color: isActive ? '#ffffff' : theme.textSecondary,
                    fontFamily: isActive ? 'Sora_700Bold' : 'Sora_600SemiBold',
                    fontSize: isActive ? 10.5 : 9,
                    marginLeft: 3,
                    letterSpacing: 0.2,
                  }}
                >
                  {tab}
                </ThemedText>
                {isProDisabled && (
                  <Ionicons name="lock-closed" size={8} color={theme.textSecondary} style={{ marginLeft: 3, opacity: 0.7 }} />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Scrollable Tab Contents (Separate scroll zones for each tab) */}
        {activeTab === 'Performance' && (
          <ScrollView 
            style={styles.tabScrollView} 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
            }
          >
            {/* Vector Illustration Banner */}
            <View style={styles.section}>
              <Image 
                source={
                  role === 'Owner' 
                    ? require('@/assets/images/illustrations/stadium.png')
                    : role === 'Coach'
                    ? require('@/assets/images/illustrations/athletes.png')
                    : role === 'Organizer'
                    ? require('@/assets/images/illustrations/trophy.png')
                    : require('@/assets/images/illustrations/stadium.png')
                } 
                style={styles.illustrationBanner} 
                contentFit="cover"
              />
            </View>

            {/* Stats Bento Grid */}
            <View style={[styles.section, { marginTop: 0 }]}>
              {/* Tab Header with Icon */}
              <View style={styles.tabHeaderRow}>
                <Ionicons name="stats-chart-outline" size={18} color={theme.secondary} />
                <ThemedText type="labelMd" style={[styles.tabHeaderTitle, { color: theme.text }]}>
                  {role === 'Owner' 
                    ? 'BUSINESS OVERVIEW' 
                    : role === 'Coach' 
                    ? 'COACHING OVERVIEW' 
                    : role === 'Organizer' 
                    ? 'LEAGUE HOST OVERVIEW' 
                    : 'PERFORMANCE OVERVIEW'}
                </ThemedText>
              </View>

              {role === 'Owner' ? (
                <View style={styles.bentoContainer}>
                  <View style={styles.bentoRow}>
                    <View style={[styles.bentoCell, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>TURF OCCUPANCY</ThemedText>
                      <View style={styles.bentoValRow}>
                        <ThemedText type="displayLgMobile" style={{ color: theme.text }}>82%</ThemedText>
                        <ThemedText type="labelSm" style={{ color: '#16a34a', fontFamily: 'Sora_700Bold' }}>+8% W/W</ThemedText>
                      </View>
                    </View>
                    <View style={[styles.bentoCell, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>TOTAL BOOKINGS</ThemedText>
                      <View style={styles.bentoValRow}>
                        <ThemedText type="displayLgMobile" style={{ color: theme.text }}>312</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.secondary, fontFamily: 'Sora_700Bold' }}>58 New</ThemedText>
                      </View>
                    </View>
                  </View>

                  <View style={[styles.skillCard, { backgroundColor: theme.primaryContainer }]}>
                    <Ionicons name="medal" size={80} color="rgba(255,255,255,0.03)" style={styles.skillCardDecor} />
                    <ThemedText type="labelSm" style={{ color: '#ffffff', letterSpacing: 0.5 }}>FACILITY STATUS</ThemedText>
                    <View style={styles.skillValRow}>
                      <ThemedText type="displayLgMobile" style={{ color: '#ffffff' }}>PLATINUM</ThemedText>
                      <ThemedText type="headlineSm" style={{ color: '#ffffff', marginLeft: Spacing.sm }}>HOST</ThemedText>
                    </View>
                    <View style={styles.progressContainer}>
                      <View style={[styles.progressTrack, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                        <View style={[styles.progressBar, { backgroundColor: '#ffffff', width: '90%' }]} />
                      </View>
                    </View>
                  </View>
                </View>
              ) : role === 'Coach' ? (
                <View style={styles.bentoContainer}>
                  <View style={styles.bentoRow}>
                    <View style={[styles.bentoCell, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>HOURS COACHED</ThemedText>
                      <View style={styles.bentoValRow}>
                        <ThemedText type="displayLgMobile" style={{ color: theme.text }}>180</ThemedText>
                        <ThemedText type="labelSm" style={{ color: '#16a34a', fontFamily: 'Sora_700Bold' }}>+15h Mo</ThemedText>
                      </View>
                    </View>
                    <View style={[styles.bentoCell, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>ACTIVE STUDENTS</ThemedText>
                      <View style={styles.bentoValRow}>
                        <ThemedText type="displayLgMobile" style={{ color: theme.text }}>24</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.secondary, fontFamily: 'Sora_700Bold' }}>Pro Badge</ThemedText>
                      </View>
                    </View>
                  </View>

                  <View style={[styles.skillCard, { backgroundColor: theme.primaryContainer }]}>
                    <Ionicons name="medal" size={80} color="rgba(255,255,255,0.03)" style={styles.skillCardDecor} />
                    <ThemedText type="labelSm" style={{ color: '#ffffff', letterSpacing: 0.5 }}>COACH RATING</ThemedText>
                    <View style={styles.skillValRow}>
                      <ThemedText type="displayLgMobile" style={{ color: '#ffffff' }}>4.8</ThemedText>
                      <ThemedText type="headlineSm" style={{ color: '#ffffff', marginLeft: Spacing.sm }}>UEFA A</ThemedText>
                    </View>
                    <View style={styles.progressContainer}>
                      <View style={[styles.progressTrack, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                        <View style={[styles.progressBar, { backgroundColor: '#ffffff', width: '75%' }]} />
                      </View>
                    </View>
                  </View>
                </View>
              ) : role === 'Organizer' ? (
                <View style={styles.bentoContainer}>
                  <View style={styles.bentoRow}>
                    <View style={[styles.bentoCell, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>LEAGUES HOSTED</ThemedText>
                      <View style={styles.bentoValRow}>
                        <ThemedText type="displayLgMobile" style={{ color: theme.text }}>18</ThemedText>
                        <ThemedText type="labelSm" style={{ color: '#16a34a', fontFamily: 'Sora_700Bold' }}>3 Active</ThemedText>
                      </View>
                    </View>
                    <View style={[styles.bentoCell, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>TEAMS MANAGED</ThemedText>
                      <View style={styles.bentoValRow}>
                        <ThemedText type="displayLgMobile" style={{ color: theme.text }}>112</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.secondary, fontFamily: 'Sora_700Bold' }}>16 New</ThemedText>
                      </View>
                    </View>
                  </View>

                  <View style={[styles.skillCard, { backgroundColor: theme.primaryContainer }]}>
                    <Ionicons name="medal" size={80} color="rgba(255,255,255,0.03)" style={styles.skillCardDecor} />
                    <ThemedText type="labelSm" style={{ color: '#ffffff', letterSpacing: 0.5 }}>ORGANIZER RANK</ThemedText>
                    <View style={styles.skillValRow}>
                      <ThemedText type="displayLgMobile" style={{ color: '#ffffff' }}>GOLD</ThemedText>
                      <ThemedText type="headlineSm" style={{ color: '#ffffff', marginLeft: Spacing.sm }}>COMMISH</ThemedText>
                    </View>
                    <View style={styles.progressContainer}>
                      <View style={[styles.progressTrack, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                        <View style={[styles.progressBar, { backgroundColor: '#ffffff', width: '80%' }]} />
                      </View>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.bentoContainer}>
                  <View style={styles.bentoRow}>
                    <View style={[styles.bentoCell, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>MATCHES PLAYED</ThemedText>
                      <View style={styles.bentoValRow}>
                        <ThemedText type="displayLgMobile" style={{ color: theme.text }}>142</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.secondary, fontFamily: 'Sora_700Bold' }}>+12% LY</ThemedText>
                      </View>
                    </View>
                    <View style={[styles.bentoCell, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>TOTAL WINS</ThemedText>
                      <View style={styles.bentoValRow}>
                        <ThemedText type="displayLgMobile" style={{ color: theme.text }}>89</ThemedText>
                        <ThemedText type="labelSm" style={{ color: '#16a34a', fontFamily: 'Sora_700Bold' }}>62.6% WR</ThemedText>
                      </View>
                    </View>
                  </View>

                  <View style={[styles.skillCard, { backgroundColor: theme.primaryContainer }]}>
                    <Ionicons name="medal" size={80} color="rgba(255,255,255,0.03)" style={styles.skillCardDecor} />
                    <ThemedText type="labelSm" style={{ color: '#ffffff', letterSpacing: 0.5 }}>SKILL RATING</ThemedText>
                    <View style={styles.skillValRow}>
                      <ThemedText type="displayLgMobile" style={{ color: '#ffffff' }}>2,840</ThemedText>
                      <ThemedText type="headlineSm" style={{ color: '#ffffff', marginLeft: Spacing.sm }}>PLATINUM</ThemedText>
                    </View>
                    <View style={styles.progressContainer}>
                      <View style={[styles.progressTrack, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                        <View style={[styles.progressBar, { backgroundColor: '#ffffff', width: '85%' }]} />
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Health Vitals */}
            <View style={[styles.section, { paddingBottom: 40 }]}>
              <View style={[styles.vitalsCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                <View style={styles.rowBetween}>
                  <ThemedText type="headlineSm">
                    {role === 'Owner' 
                      ? 'Financial Vitals' 
                      : role === 'Coach' 
                      ? 'Class Analytics' 
                      : role === 'Organizer' 
                      ? 'Hosting Vitals' 
                      : 'Health Vitals'}
                  </ThemedText>
                  <Ionicons name="pulse" size={18} color={theme.secondary} />
                </View>
                {role === 'Owner' ? (
                  <View style={styles.vitalsRow}>
                    <View style={styles.vitalItem}>
                      <ThemedText style={[styles.vitalLabel, { color: theme.textSecondary }]} numberOfLines={1} adjustsFontSizeToFit>Monthly Revenue</ThemedText>
                      <ThemedText style={[styles.vitalValue, { color: '#16a34a' }]} numberOfLines={1} adjustsFontSizeToFit>₹1,82,500</ThemedText>
                    </View>
                    <View style={styles.vitalItem}>
                      <ThemedText style={[styles.vitalLabel, { color: theme.textSecondary }]} numberOfLines={1} adjustsFontSizeToFit>Unpaid Dues</ThemedText>
                      <ThemedText style={[styles.vitalValue, { color: '#ef4444' }]} numberOfLines={1} adjustsFontSizeToFit>₹8,400</ThemedText>
                    </View>
                    <View style={styles.vitalItem}>
                      <ThemedText style={[styles.vitalLabel, { color: theme.textSecondary }]} numberOfLines={1} adjustsFontSizeToFit>Expenses (Avg)</ThemedText>
                      <ThemedText style={[styles.vitalValue, { color: theme.secondary }]} numberOfLines={1} adjustsFontSizeToFit>₹42,000</ThemedText>
                    </View>
                  </View>
                ) : role === 'Coach' ? (
                  <View style={styles.vitalsRow}>
                    <View style={styles.vitalItem}>
                      <ThemedText style={[styles.vitalLabel, { color: theme.textSecondary }]} numberOfLines={1} adjustsFontSizeToFit>Avg Attendance</ThemedText>
                      <ThemedText style={[styles.vitalValue, { color: '#16a34a' }]} numberOfLines={1} adjustsFontSizeToFit>94%</ThemedText>
                    </View>
                    <View style={styles.vitalItem}>
                      <ThemedText style={[styles.vitalLabel, { color: theme.textSecondary }]} numberOfLines={1} adjustsFontSizeToFit>Success Rate</ThemedText>
                      <ThemedText style={[styles.vitalValue, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>88%</ThemedText>
                    </View>
                    <View style={styles.vitalItem}>
                      <ThemedText style={[styles.vitalLabel, { color: theme.textSecondary }]} numberOfLines={1} adjustsFontSizeToFit>Weekly Classes</ThemedText>
                      <ThemedText style={[styles.vitalValue, { color: theme.secondary }]} numberOfLines={1} adjustsFontSizeToFit>14 Sessions</ThemedText>
                    </View>
                  </View>
                ) : role === 'Organizer' ? (
                  <View style={styles.vitalsRow}>
                    <View style={styles.vitalItem}>
                      <ThemedText style={[styles.vitalLabel, { color: theme.textSecondary }]} numberOfLines={1} adjustsFontSizeToFit>Avg Attendance</ThemedText>
                      <ThemedText style={[styles.vitalValue, { color: '#16a34a' }]} numberOfLines={1} adjustsFontSizeToFit>91%</ThemedText>
                    </View>
                    <View style={styles.vitalItem}>
                      <ThemedText style={[styles.vitalLabel, { color: theme.textSecondary }]} numberOfLines={1} adjustsFontSizeToFit>Fair Play Score</ThemedText>
                      <ThemedText style={[styles.vitalValue, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>4.9/5</ThemedText>
                    </View>
                    <View style={styles.vitalItem}>
                      <ThemedText style={[styles.vitalLabel, { color: theme.textSecondary }]} numberOfLines={1} adjustsFontSizeToFit>Dispute Rate</ThemedText>
                      <ThemedText style={[styles.vitalValue, { color: theme.secondary }]} numberOfLines={1} adjustsFontSizeToFit>1.2%</ThemedText>
                    </View>
                  </View>
                ) : (
                  <View style={styles.vitalsRow}>
                    <View style={styles.vitalItem}>
                      <ThemedText style={[styles.vitalLabel, { color: theme.textSecondary }]} numberOfLines={1} adjustsFontSizeToFit>Recovery Score</ThemedText>
                      <ThemedText style={[styles.vitalValue, { color: '#16a34a' }]} numberOfLines={1} adjustsFontSizeToFit>92%</ThemedText>
                    </View>
                    <View style={styles.vitalItem}>
                      <ThemedText style={[styles.vitalLabel, { color: theme.textSecondary }]} numberOfLines={1} adjustsFontSizeToFit>Heart Rate (Avg)</ThemedText>
                      <ThemedText style={[styles.vitalValue, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>54 BPM</ThemedText>
                    </View>
                    <View style={styles.vitalItem}>
                      <ThemedText style={[styles.vitalLabel, { color: theme.textSecondary }]} numberOfLines={1} adjustsFontSizeToFit>Sleep Quality</ThemedText>
                      <ThemedText style={[styles.vitalValue, { color: theme.secondary }]} numberOfLines={1} adjustsFontSizeToFit>Optimal</ThemedText>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>
        )}

        {activeTab === 'Feed' && (
          <ScrollView 
            style={styles.tabScrollView} 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
            }
          >
            <View style={[styles.section, { paddingBottom: 40 }]}>
              {/* Tab Header with Icon */}
              <View style={styles.tabHeaderRow}>
                <Ionicons name="time-outline" size={18} color={theme.secondary} />
                <ThemedText type="labelMd" style={[styles.tabHeaderTitle, { color: theme.text }]}>
                  RECENT ACTIVITY
                </ThemedText>
              </View>
              
              <View style={styles.feedList}>
                {role === 'Owner' ? (
                  <>
                    <View style={[styles.feedItemCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                      <View style={[styles.feedIconBadge, { backgroundColor: theme.primaryContainer + '11' }]}>
                        <Ionicons name="construct-outline" size={16} color={theme.primary} />
                      </View>
                      <View style={styles.feedContent}>
                        <View style={styles.rowBetween}>
                          <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold' }}>Arena Pitch Refurbished</ThemedText>
                          <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>5 hrs ago</ThemedText>
                        </View>
                        <ThemedText style={{ color: theme.textSecondary, marginTop: 2, fontSize: 12.5, lineHeight: 18 }}>
                          Pitch B has been successfully upgraded to high-grade FIFA-pro astro turf. Open for booking!
                        </ThemedText>
                      </View>
                    </View>
 
                    <View style={[styles.feedItemCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                      <View style={[styles.feedIconBadge, { backgroundColor: theme.secondaryContainer + '11' }]}>
                        <Ionicons name="cash-outline" size={16} color={theme.secondary} />
                      </View>
                      <View style={styles.feedContent}>
                        <View style={styles.rowBetween}>
                          <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold' }}>Summer Promo Success</ThemedText>
                          <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Yesterday</ThemedText>
                        </View>
                        <ThemedText style={{ color: theme.textSecondary, marginTop: 2, fontSize: 12.5, lineHeight: 18 }}>
                          Our Happy Hour Weekday Promo saw a record 45 slot bookings this week, boosting morning occupancy by 32%.
                        </ThemedText>
                      </View>
                    </View>
 
                    <View style={[styles.feedItemCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                      <View style={[styles.feedIconBadge, { backgroundColor: theme.secondaryContainer + '11' }]}>
                        <Ionicons name="people-outline" size={16} color={theme.secondary} />
                      </View>
                      <View style={styles.feedContent}>
                        <View style={styles.rowBetween}>
                          <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold' }}>Staff Training Complete</ThemedText>
                          <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>3 days ago</ThemedText>
                        </View>
                        <ThemedText style={{ color: theme.textSecondary, marginTop: 2, fontSize: 12.5, lineHeight: 18 }}>
                          Completed match coordinator training for all 6 weekend staff members for better user onboarding.
                        </ThemedText>
                      </View>
                    </View>
                  </>
                ) : role === 'Coach' ? (
                  <>
                    <View style={[styles.feedItemCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                      <View style={[styles.feedIconBadge, { backgroundColor: theme.primaryContainer + '11' }]}>
                        <Ionicons name="school-outline" size={16} color={theme.primary} />
                      </View>
                      <View style={styles.feedContent}>
                        <View style={styles.rowBetween}>
                          <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold' }}>U-16 Striking Clinic Complete</ThemedText>
                          <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>5 hrs ago</ThemedText>
                        </View>
                        <ThemedText style={{ color: theme.textSecondary, marginTop: 2, fontSize: 12.5, lineHeight: 18 }}>
                          Successful 90-minute session training forwards in high-press scenarios and ball placement.
                        </ThemedText>
                      </View>
                    </View>
 
                    <View style={[styles.feedItemCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                      <View style={[styles.feedIconBadge, { backgroundColor: theme.secondaryContainer + '11' }]}>
                        <Ionicons name="trending-up-outline" size={16} color={theme.secondary} />
                      </View>
                      <View style={styles.feedContent}>
                        <View style={styles.rowBetween}>
                          <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold' }}>Marcus Vance Level Up</ThemedText>
                          <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Yesterday</ThemedText>
                        </View>
                        <ThemedText style={{ color: theme.textSecondary, marginTop: 2, fontSize: 12.5, lineHeight: 18 }}>
                          Marcus achieved elite tactical level in target man drills, now preparing for division finals.
                        </ThemedText>
                      </View>
                    </View>
 
                    <View style={[styles.feedItemCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                      <View style={[styles.feedIconBadge, { backgroundColor: theme.secondaryContainer + '11' }]}>
                        <Ionicons name="git-branch-outline" size={16} color={theme.secondary} />
                      </View>
                      <View style={styles.feedContent}>
                        <View style={styles.rowBetween}>
                          <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold' }}>Tactical Blueprint Shared</ThemedText>
                          <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>3 days ago</ThemedText>
                        </View>
                        <ThemedText style={{ color: theme.textSecondary, marginTop: 2, fontSize: 12.5, lineHeight: 18 }}>
                          Coach shared a new 4-3-3 counter-attacking schema with all academy members.
                        </ThemedText>
                      </View>
                    </View>
                  </>
                ) : role === 'Organizer' ? (
                  <>
                    <View style={[styles.feedItemCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                      <View style={[styles.feedIconBadge, { backgroundColor: theme.primaryContainer + '11' }]}>
                        <Ionicons name="calendar-outline" size={16} color={theme.primary} />
                      </View>
                      <View style={styles.feedContent}>
                        <View style={styles.rowBetween}>
                          <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold' }}>Regents T10 Schedule</ThemedText>
                          <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>5 hrs ago</ThemedText>
                        </View>
                        <ThemedText style={{ color: theme.textSecondary, marginTop: 2, fontSize: 12.5, lineHeight: 18 }}>
                          Falcons FC vs Wolves match bracket and referee assignments finalized. Saturday, 15:00.
                        </ThemedText>
                      </View>
                    </View>
 
                    <View style={[styles.feedItemCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                      <View style={[styles.feedIconBadge, { backgroundColor: theme.secondaryContainer + '11' }]}>
                        <Ionicons name="document-text-outline" size={16} color={theme.secondary} />
                      </View>
                      <View style={styles.feedContent}>
                        <View style={styles.rowBetween}>
                          <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold' }}>Rules Update: Player Subs</ThemedText>
                          <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Yesterday</ThemedText>
                        </View>
                        <ThemedText style={{ color: theme.textSecondary, marginTop: 2, fontSize: 12.5, lineHeight: 18 }}>
                          Official tournament guidelines updated: 5 substitutions now allowed in all futsal cups.
                        </ThemedText>
                      </View>
                    </View>
 
                    <View style={[styles.feedItemCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                      <View style={[styles.feedIconBadge, { backgroundColor: theme.secondaryContainer + '11' }]}>
                        <Ionicons name="shield-checkmark-outline" size={16} color={theme.secondary} />
                      </View>
                      <View style={styles.feedContent}>
                        <View style={styles.rowBetween}>
                          <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold' }}>Referee Appointments</ThemedText>
                          <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>3 days ago</ThemedText>
                        </View>
                        <ThemedText style={{ color: theme.textSecondary, marginTop: 2, fontSize: 12.5, lineHeight: 18 }}>
                          Marcus J. and Alan T. appointed for the upcoming weekend league games.
                        </ThemedText>
                      </View>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={[styles.feedItemCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                      <View style={[styles.feedIconBadge, { backgroundColor: theme.primaryContainer + '11' }]}>
                        <Ionicons name="trophy-outline" size={16} color={theme.primary} />
                      </View>
                      <View style={styles.feedContent}>
                        <View style={styles.rowBetween}>
                          <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold' }}>Victory vs Titans XI</ThemedText>
                          <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>5 hrs ago</ThemedText>
                        </View>
                        <ThemedText style={{ color: theme.textSecondary, marginTop: 2, fontSize: 12.5, lineHeight: 18 }}>
                          Led Blue Falcons FC to a 4-2 win. Scored 2 goals and assisted 1. Named Match MVP!
                        </ThemedText>
                      </View>
                    </View>
 
                    <View style={[styles.feedItemCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                      <View style={[styles.feedIconBadge, { backgroundColor: theme.secondaryContainer + '11' }]}>
                        <Ionicons name="barbell-outline" size={16} color={theme.secondary} />
                      </View>
                      <View style={styles.feedContent}>
                        <View style={styles.rowBetween}>
                          <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold' }}>Strength Training</ThemedText>
                          <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Yesterday</ThemedText>
                        </View>
                        <ThemedText style={{ color: theme.textSecondary, marginTop: 2, fontSize: 12.5, lineHeight: 18 }}>
                          Completed 75-minute explosive power session targeting fast-twitch leg muscle groups.
                        </ThemedText>
                      </View>
                    </View>
 
                    <View style={[styles.feedItemCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                      <View style={[styles.feedIconBadge, { backgroundColor: theme.secondaryContainer + '11' }]}>
                        <Ionicons name="ribbon-outline" size={16} color={theme.secondary} />
                      </View>
                      <View style={styles.feedContent}>
                        <View style={styles.rowBetween}>
                          <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold' }}>Achievement Unlocked</ThemedText>
                          <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>3 days ago</ThemedText>
                        </View>
                        <ThemedText style={{ color: theme.textSecondary, marginTop: 2, fontSize: 12.5, lineHeight: 18 }}>
                          {"Earned the \"Centurion\" badge for completing 100 competitive bookings this season."}
                        </ThemedText>
                      </View>
                    </View>
                  </>
                )}
              </View>

              <Pressable style={[styles.loadMoreBtn, { borderColor: theme.outline }]}>
                <ThemedText type="labelMd" style={{ color: theme.text }}>LOAD MORE ACTIVITIES</ThemedText>
              </Pressable>

              {/* Vector Illustration Footer */}
              <View style={[styles.feedFooterCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                <Image 
                  source={require('@/assets/images/illustrations/team_huddle.png')} 
                  style={styles.huddleIllustration} 
                  contentFit="contain"
                />
                <ThemedText type="bodySm" style={{ color: theme.textSecondary, textAlign: 'center', marginTop: Spacing.sm }}>
                  {role === 'Owner'
                    ? "Ensure regular arena sanitation and pitch maintenance for optimal customer reviews."
                    : role === 'Coach'
                    ? "Schedule weekly performance evaluations for your active squad."
                    : role === 'Organizer'
                    ? "Maintain fair play guidelines and referee integrity across all fixtures."
                    : "Stay active and coordinate with your squad for upcoming league games."}
                </ThemedText>
              </View>
            </View>
          </ScrollView>
        )}

        {activeTab === 'Ranking' && (
          <ScrollView 
            style={styles.tabScrollView} 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
            }
          >
            <View style={[styles.section, { paddingBottom: 40 }]}>
              {/* Ranking Header Row with Illustration */}
              <View style={styles.rankingHeaderRow}>
                {/* Tab Header with Icon */}
                <View style={styles.tabHeaderRow}>
                  <Ionicons name="trophy-outline" size={18} color={theme.secondary} />
                  <ThemedText type="labelMd" style={[styles.tabHeaderTitle, { color: theme.text }]}>
                    {role === 'Owner' 
                      ? 'TOP ARENA BOOKINGS RATING' 
                      : role === 'Coach' 
                      ? 'CERTIFIED PRO COACHES RATING' 
                      : role === 'Organizer' 
                      ? 'TOP LEAGUE ORGANIZERS RATING' 
                      : 'DIAMOND LEAGUE LEADERBOARD'}
                  </ThemedText>
                </View>
                <Image 
                  source={require('@/assets/images/illustrations/trophy.png')} 
                  style={styles.trophyIllustration} 
                  contentFit="contain"
                />
              </View>

              <View style={styles.leaderboardList}>
                {role === 'Owner' ? (
                  <>
                    <View style={[styles.leaderboardRow, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '22' }, Shadows.level2]}>
                      <ThemedText type="headlineSm" style={[styles.rankNumber, { color: '#eab308' }]}>1</ThemedText>
                      <Image source={require('@/assets/images/sports/sport_football.png')} style={styles.rankAvatar} />
                      <View style={{ flex: 1, marginLeft: Spacing.md }}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold' }}>Wembley Indoor Hub</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>4.9 Rating • London</ThemedText>
                      </View>
                      <View style={styles.rankScoreCol}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold', color: theme.text }}>4,920</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>BKS</ThemedText>
                      </View>
                    </View>
                    <View style={[styles.leaderboardRow, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '22' }, Shadows.level2]}>
                      <ThemedText type="headlineSm" style={[styles.rankNumber, { color: '#94a3b8' }]}>2</ThemedText>
                      <Image source={require('@/assets/images/sports/sport_booking.png')} style={styles.rankAvatar} />
                      <View style={{ flex: 1, marginLeft: Spacing.md }}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold' }}>Chelsea Astro Arena</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>4.8 Rating • London</ThemedText>
                      </View>
                      <View style={styles.rankScoreCol}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold', color: theme.text }}>4,810</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>BKS</ThemedText>
                      </View>
                    </View>
                    <View style={[styles.leaderboardRow, { backgroundColor: theme.primaryContainer + '11', borderColor: theme.primary, borderWidth: 1.5 }, Shadows.level2]}>
                      <ThemedText type="headlineSm" style={[styles.rankNumber, { color: theme.primary }]}>3</ThemedText>
                      <Image source={getAvatarSource(profile.avatarUrl)} style={styles.rankAvatar} />
                      <View style={{ flex: 1, marginLeft: Spacing.md }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <ThemedText type="bodyMd" numberOfLines={1} style={{ fontFamily: 'Sora_700Bold', color: theme.primary }}>{profile.name} Arena (You)</ThemedText>
                        </View>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>4.7 Rating • London</ThemedText>
                      </View>
                      <View style={styles.rankScoreCol}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold', color: theme.primary }}>4,240</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>BKS</ThemedText>
                      </View>
                    </View>
                    <View style={[styles.leaderboardRow, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '22' }, Shadows.level2]}>
                      <ThemedText type="headlineSm" style={[styles.rankNumber, { color: '#b45309' }]}>4</ThemedText>
                      <Image source={require('@/assets/images/sports/sport_all.png')} style={styles.rankAvatar} />
                      <View style={{ flex: 1, marginLeft: Spacing.md }}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold' }}>Stratford Green Fields</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>4.6 Rating • London</ThemedText>
                      </View>
                      <View style={styles.rankScoreCol}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold', color: theme.text }}>3,780</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>BKS</ThemedText>
                      </View>
                    </View>
                  </>
                ) : role === 'Coach' ? (
                  <>
                    <View style={[styles.leaderboardRow, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '22' }, Shadows.level2]}>
                      <ThemedText type="headlineSm" style={[styles.rankNumber, { color: '#eab308' }]}>1</ThemedText>
                      <Image source={require('@/assets/images/avatars/avatar_2.png')} style={styles.rankAvatar} />
                      <View style={{ flex: 1, marginLeft: Spacing.md }}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold' }}>Coach Alan Shearer</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>UEFA Pro • London</ThemedText>
                      </View>
                      <View style={styles.rankScoreCol}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold', color: theme.text }}>340</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>STUDENTS</ThemedText>
                      </View>
                    </View>
                    <View style={[styles.leaderboardRow, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '22' }, Shadows.level2]}>
                      <ThemedText type="headlineSm" style={[styles.rankNumber, { color: '#94a3b8' }]}>2</ThemedText>
                      <Image source={require('@/assets/images/avatars/avatar_3.png')} style={styles.rankAvatar} />
                      <View style={{ flex: 1, marginLeft: Spacing.md }}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold' }}>Coach Alex Ferguson</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>UEFA Pro • London</ThemedText>
                      </View>
                      <View style={styles.rankScoreCol}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold', color: theme.text }}>290</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>STUDENTS</ThemedText>
                      </View>
                    </View>
                    <View style={[styles.leaderboardRow, { backgroundColor: theme.primaryContainer + '11', borderColor: theme.primary, borderWidth: 1.5 }, Shadows.level2]}>
                      <ThemedText type="headlineSm" style={[styles.rankNumber, { color: theme.primary }]}>3</ThemedText>
                      <Image source={getAvatarSource(profile.avatarUrl)} style={styles.rankAvatar} />
                      <View style={{ flex: 1, marginLeft: Spacing.md }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold', color: theme.primary }}>Coach {profile.name} (You)</ThemedText>
                        </View>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>UEFA A • London</ThemedText>
                      </View>
                      <View style={styles.rankScoreCol}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold', color: theme.primary }}>240</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>STUDENTS</ThemedText>
                      </View>
                    </View>
                    <View style={[styles.leaderboardRow, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '22' }, Shadows.level2]}>
                      <ThemedText type="headlineSm" style={[styles.rankNumber, { color: '#b45309' }]}>4</ThemedText>
                      <Image source={require('@/assets/images/avatars/avatar_4.png')} style={styles.rankAvatar} />
                      <View style={{ flex: 1, marginLeft: Spacing.md }}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold' }}>Coach Pep Guardiola</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>UEFA Pro • Manchester</ThemedText>
                      </View>
                      <View style={styles.rankScoreCol}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold', color: theme.text }}>210</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>STUDENTS</ThemedText>
                      </View>
                    </View>
                  </>
                ) : role === 'Organizer' ? (
                  <>
                    <View style={[styles.leaderboardRow, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '22' }, Shadows.level2]}>
                      <ThemedText type="headlineSm" style={[styles.rankNumber, { color: '#eab308' }]}>1</ThemedText>
                      <Image source={require('@/assets/images/sports/sport_tournament.png')} style={styles.rankAvatar} />
                      <View style={{ flex: 1, marginLeft: Spacing.md }}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold' }}>Premier League Org</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Gold Status • London</ThemedText>
                      </View>
                      <View style={styles.rankScoreCol}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold', color: theme.text }}>142</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>LEAGUES</ThemedText>
                      </View>
                    </View>
                    <View style={[styles.leaderboardRow, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '22' }, Shadows.level2]}>
                      <ThemedText type="headlineSm" style={[styles.rankNumber, { color: '#94a3b8' }]}>2</ThemedText>
                      <Image source={require('@/assets/images/sports/sport_football.png')} style={styles.rankAvatar} />
                      <View style={{ flex: 1, marginLeft: Spacing.md }}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold' }}>London Futsal Comm.</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Gold Status • London</ThemedText>
                      </View>
                      <View style={styles.rankScoreCol}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold', color: theme.text }}>98</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>LEAGUES</ThemedText>
                      </View>
                    </View>
                    <View style={[styles.leaderboardRow, { backgroundColor: theme.primaryContainer + '11', borderColor: theme.primary, borderWidth: 1.5 }, Shadows.level2]}>
                      <ThemedText type="headlineSm" style={[styles.rankNumber, { color: theme.primary }]}>3</ThemedText>
                      <Image source={getAvatarSource(profile.avatarUrl)} style={styles.rankAvatar} />
                      <View style={{ flex: 1, marginLeft: Spacing.md }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <ThemedText type="bodyMd" numberOfLines={1} style={{ fontFamily: 'Sora_700Bold', color: theme.primary }}>{profile.name} (You)</ThemedText>
                        </View>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Silver Status • London</ThemedText>
                      </View>
                      <View style={styles.rankScoreCol}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold', color: theme.primary }}>89</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>LEAGUES</ThemedText>
                      </View>
                    </View>
                    <View style={[styles.leaderboardRow, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '22' }, Shadows.level2]}>
                      <ThemedText type="headlineSm" style={[styles.rankNumber, { color: '#b45309' }]}>4</ThemedText>
                      <Image source={require('@/assets/images/sports/sport_all.png')} style={styles.rankAvatar} />
                      <View style={{ flex: 1, marginLeft: Spacing.md }}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold' }}>City Sports Assoc.</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Silver Status • Bristol</ThemedText>
                      </View>
                      <View style={styles.rankScoreCol}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold', color: theme.text }}>76</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>LEAGUES</ThemedText>
                      </View>
                    </View>
                  </>
                ) : (
                  <>
                    <Pressable 
                      onPress={() => router.push('/player-profile')}
                      style={[styles.leaderboardRow, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '22' }, Shadows.level2]}
                    >
                      <ThemedText type="headlineSm" style={[styles.rankNumber, { color: '#eab308' }]}>1</ThemedText>
                      <Image
                        source={require('@/assets/images/avatars/avatar_5.png')}
                        style={styles.rankAvatar}
                      />
                      <View style={{ flex: 1, marginLeft: Spacing.md }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold' }}>Marcus V.</ThemedText>
                        </View>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Forward • London</ThemedText>
                      </View>
                      <View style={styles.rankScoreCol}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold', color: theme.text }}>2,980</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>PTS</ThemedText>
                      </View>
                    </Pressable>

                    <View style={[styles.leaderboardRow, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '22' }, Shadows.level2]}>
                      <ThemedText type="headlineSm" style={[styles.rankNumber, { color: '#94a3b8' }]}>2</ThemedText>
                      <Image
                        source={require('@/assets/images/avatars/avatar_6.png')}
                        style={styles.rankAvatar}
                      />
                      <View style={{ flex: 1, marginLeft: Spacing.md }}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold' }}>Sarah K.</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Midfielder • Bristol</ThemedText>
                      </View>
                      <View style={styles.rankScoreCol}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold', color: theme.text }}>2,910</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>PTS</ThemedText>
                      </View>
                    </View>

                    <View style={[styles.leaderboardRow, { backgroundColor: theme.primaryContainer + '11', borderColor: theme.primary, borderWidth: 1.5 }, Shadows.level2]}>
                      <ThemedText type="headlineSm" style={[styles.rankNumber, { color: theme.primary }]}>3</ThemedText>
                      <Image
                        source={getAvatarSource(profile.avatarUrl)}
                        style={styles.rankAvatar}
                      />
                      <View style={{ flex: 1, marginLeft: Spacing.md }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <ThemedText type="bodyMd" numberOfLines={1} style={{ fontFamily: 'Sora_700Bold', color: theme.primary }}>{profile.name} (You)</ThemedText>
                        </View>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>{profile.position} • {profile.location.split(',')[0]}</ThemedText>
                      </View>
                      <View style={styles.rankScoreCol}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold', color: theme.primary }}>2,840</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>PTS</ThemedText>
                      </View>
                    </View>

                    <View style={[styles.leaderboardRow, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '22' }, Shadows.level2]}>
                      <ThemedText type="headlineSm" style={[styles.rankNumber, { color: '#b45309' }]}>4</ThemedText>
                      <Image
                        source={require('@/assets/images/avatars/avatar_7.png')}
                        style={styles.rankAvatar}
                      />
                      <View style={{ flex: 1, marginLeft: Spacing.md }}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold' }}>Elena S.</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Midfielder • London</ThemedText>
                      </View>
                      <View style={styles.rankScoreCol}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold', color: theme.text }}>2,780</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>PTS</ThemedText>
                      </View>
                    </View>
                  </>
                )}
              </View>
            </View>
          </ScrollView>
        )}

        {activeTab === 'Profile' && (
          <ScrollView 
            style={styles.tabScrollView} 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
            }
          >
            {/* ── Redesigned Wallet Card Section ── */}
            <View style={styles.section}>
              <View style={styles.tabHeaderRow}>
                <Ionicons name="wallet-outline" size={18} color={theme.secondary} />
                <ThemedText type="labelMd" style={[styles.tabHeaderTitle, { color: theme.text }]}>
                  MY SPORTS WALLET
                </ThemedText>
              </View>

              <View
                style={{
                  backgroundColor: theme.surfaceLowest,
                  borderRadius: BorderRadius.premium,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderWidth: 1,
                  borderColor: theme.outlineVariant + '33',
                  ...Shadows.level2,
                }}
              >
                <View style={{ flex: 1, marginRight: 8 }}>
                  <ThemedText style={{ color: theme.textSecondary, fontSize: 9, fontFamily: 'Sora_700Bold', letterSpacing: 0.6 }}>
                    WALLET BALANCE
                  </ThemedText>
                  <ThemedText style={{ color: theme.text, fontSize: 20, fontFamily: 'Sora_800ExtraBold', marginTop: 2 }}>
                    ₹{walletBalance.toFixed(2)}
                  </ThemedText>

                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                    <Pressable 
                      onPress={() => router.push('/wallet')}
                      style={{
                        backgroundColor: theme.primary,
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                      }}
                    >
                      <ThemedText style={{ color: '#ffffff', fontSize: 10, fontFamily: 'Sora_700Bold' }}>
                        View Wallet & Offers →
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>

                {/* New Blue Wallet Illustration */}
                <Image 
                  source={require('@/assets/images/illustrations/wallet_blue.png')}
                  style={{ width: 75, height: 75 }}
                  contentFit="contain"
                />
              </View>

              {/* Offers & Vouchers Action Card */}
              <Pressable
                onPress={() => router.push('/wallet')}
                style={{
                  backgroundColor: theme.surfaceLowest,
                  borderRadius: BorderRadius.lg,
                  padding: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderWidth: 1,
                  borderColor: theme.outlineVariant + '33',
                  marginTop: 10,
                  ...Shadows.level1,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#f59e0b18', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="pricetag" size={17} color="#f59e0b" />
                  </View>
                  <View>
                    <ThemedText style={{ fontFamily: 'Sora_700Bold', fontSize: 12.5, color: theme.text }}>
                      Offers, Vouchers & Rewards
                    </ThemedText>
                    <ThemedText style={{ fontSize: 10, color: theme.textSecondary, marginTop: 1, fontFamily: 'Sora_500Medium' }}>
                      4 Active Vouchers Available • Up to 50% Cashback
                    </ThemedText>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
              </Pressable>
            </View>

            {/* Bio Details Card */}
            <View style={styles.section}>
              {/* Tab Header with Icon */}
              <View style={styles.tabHeaderRow}>
                <Ionicons name="person-outline" size={18} color={theme.secondary} />
                <ThemedText type="labelMd" style={[styles.tabHeaderTitle, { color: theme.text }]}>
                  {role === 'Owner' 
                    ? 'FACILITY DETAILS & ANNOUNCEMENTS' 
                    : role === 'Coach' 
                    ? 'ACADEMY COACHING DETAILS' 
                    : role === 'Organizer' 
                    ? 'LEAGUE HOSTING DETAILS' 
                    : 'BIO DETAILS & TEAMS'}
                </ThemedText>
              </View>

              <View style={[styles.bioDetailsCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                <View style={styles.bioHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <ThemedText type="headlineSm">
                      {role === 'Owner' 
                        ? 'Business Details' 
                        : role === 'Coach' 
                        ? 'Coaching Details' 
                        : role === 'Organizer' 
                        ? 'Tournament Scope' 
                        : 'Bio Details'}
                    </ThemedText>
                  </View>
                  <Image 
                    source={
                      role === 'Owner'
                        ? require('@/assets/images/illustrations/stadium.png')
                        : role === 'Coach'
                        ? require('@/assets/images/illustrations/football_player.png')
                        : role === 'Organizer'
                        ? require('@/assets/images/illustrations/trophy.png')
                        : require('@/assets/images/illustrations/football_player.png')
                    } 
                    style={styles.bioIllustration} 
                    contentFit="contain"
                  />
                </View>
                
                {role === 'Owner' ? (
                  <View style={styles.bioGrid}>
                    <View style={styles.bioGridItem}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary, letterSpacing: 0.5, fontSize: 9 }}>FACILITY PITCHES</ThemedText>
                      <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold', marginTop: 4, fontSize: 12 }}>3 Astro, 1 Woodcourt</ThemedText>
                    </View>
                    <View style={styles.bioGridItem}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary, letterSpacing: 0.5, fontSize: 9 }}>CATEGORY</ThemedText>
                      <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold', marginTop: 4, fontSize: 12 }}>Turf Provider</ThemedText>
                    </View>
                    <View style={styles.bioGridItem}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary, letterSpacing: 0.5, fontSize: 9 }}>PEAK HOURS</ThemedText>
                      <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold', marginTop: 4, fontSize: 12 }}>17:00-22:00 Daily</ThemedText>
                    </View>
                    <View style={styles.bioGridItem}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary, letterSpacing: 0.5, fontSize: 9 }}>OPERATING SINCE</ThemedText>
                      <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold', marginTop: 4, fontSize: 12 }}>March 2023</ThemedText>
                    </View>
                  </View>
                ) : role === 'Coach' ? (
                  <View style={styles.bioGrid}>
                    <View style={styles.bioGridItem}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary, letterSpacing: 0.5, fontSize: 9 }}>FOCUS AGE GROUP</ThemedText>
                      <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold', marginTop: 4, fontSize: 12 }}>U12, U16, Adults</ThemedText>
                    </View>
                    <View style={styles.bioGridItem}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary, letterSpacing: 0.5, fontSize: 9 }}>CERTIFICATIONS</ThemedText>
                      <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold', marginTop: 4, fontSize: 12 }}>UEFA A, FA L3</ThemedText>
                    </View>
                    <View style={styles.bioGridItem}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary, letterSpacing: 0.5, fontSize: 9 }}>TRAINING RATE</ThemedText>
                      <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold', marginTop: 4, fontSize: 12 }}>₹800/hr (Indiv)</ThemedText>
                    </View>
                    <View style={styles.bioGridItem}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary, letterSpacing: 0.5, fontSize: 9 }}>COACHING EXP</ThemedText>
                      <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold', marginTop: 4, fontSize: 12 }}>8+ Years</ThemedText>
                    </View>
                  </View>
                ) : role === 'Organizer' ? (
                  <View style={styles.bioGrid}>
                    <View style={styles.bioGridItem}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary, letterSpacing: 0.5, fontSize: 9 }}>TOURNAMENT TYPES</ThemedText>
                      <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold', marginTop: 4, fontSize: 12 }}>Knockout, Leagues</ThemedText>
                    </View>
                    <View style={styles.bioGridItem}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary, letterSpacing: 0.5, fontSize: 9 }}>HOSTING SCOPE</ThemedText>
                      <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold', marginTop: 4, fontSize: 12 }}>Local, Corporate</ThemedText>
                    </View>
                    <View style={styles.bioGridItem}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary, letterSpacing: 0.5, fontSize: 9 }}>ENTRY FEE RULES</ThemedText>
                      <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold', marginTop: 4, fontSize: 12 }}>Paid / Sponsored</ThemedText>
                    </View>
                    <View style={styles.bioGridItem}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary, letterSpacing: 0.5, fontSize: 9 }}>EQUIPMENT</ThemedText>
                      <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold', marginTop: 4, fontSize: 12 }}>Refs, Balls, Kits</ThemedText>
                    </View>
                  </View>
                ) : (
                  <View style={styles.bioGrid}>
                    <View style={styles.bioGridItem}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary, letterSpacing: 0.5, fontSize: 9 }}>PREFERRED FOOT</ThemedText>
                      <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold', marginTop: 4, fontSize: 12 }}>{profile.preferredFoot}</ThemedText>
                    </View>
                    <View style={styles.bioGridItem}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary, letterSpacing: 0.5, fontSize: 9 }}>PLAYING POSITION</ThemedText>
                      <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold', marginTop: 4, fontSize: 12 }}>{profile.position}</ThemedText>
                    </View>
                    <View style={styles.bioGridItem}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary, letterSpacing: 0.5, fontSize: 9 }}>PREFERRED STYLE</ThemedText>
                      <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold', marginTop: 4, fontSize: 12 }}>{profile.playingStyle}</ThemedText>
                    </View>
                    <View style={styles.bioGridItem}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary, letterSpacing: 0.5, fontSize: 9 }}>MEMBER SINCE</ThemedText>
                      <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold', marginTop: 4, fontSize: 12 }}>{profile.memberSince}</ThemedText>
                    </View>
                  </View>
                )}
                
                <View style={{ borderTopWidth: 1, borderTopColor: theme.outlineVariant + '33', paddingTop: Spacing.md, marginTop: Spacing.md }}>
                  <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginBottom: Spacing.sm, fontFamily: 'Sora_700Bold', letterSpacing: 0.5, fontSize: 9 }}>
                    {role === 'Owner' 
                      ? 'FACILITY DESCRIPTION' 
                      : role === 'Coach' 
                      ? 'ACADEMY PHILOSOPHY' 
                      : role === 'Organizer' 
                      ? 'LEAGUE STATEMENT' 
                      : 'BIO DESCRIPTION'}
                  </ThemedText>
                  <ThemedText type="bodyMd" style={{ color: theme.textSecondary, lineHeight: 18, fontSize: 12 }}>
                    {role === 'Owner' 
                      ? 'Providing premium, state-of-the-art sports facilities with high-grade infill turf and high-intensity LED floodlights for night play. Our courts are sanitized daily.' 
                      : role === 'Coach' 
                      ? 'Passionate about youth athlete development and tactical execution. Specializing in advanced attacking drills, visual positioning, and cognitive speed training.' 
                      : role === 'Organizer' 
                      ? 'Professional organizer dedicated to building clean, competitive leagues. Offering full match-day operations including referee assignments, live score tracking, and tournament brackets.' 
                      : profile.bio}
                  </ThemedText>
                </View>
              </View>
            </View>

            {role === 'Owner' ? (
              <>
                <View style={styles.section}>
                  <View style={styles.rowBetween}>
                    <ThemedText type="headlineSm">Active Pitch Reservations</ThemedText>
                    <Pressable>
                      <ThemedText type="labelMd" style={{ color: theme.secondary }}>VIEW ALL</ThemedText>
                    </Pressable>
                  </View>

                  <View style={styles.teamList}>
                    <View style={[styles.teamItemCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                      <View style={[styles.feedIconBadge, { backgroundColor: theme.primaryContainer + '11', borderRadius: 6, marginRight: Spacing.md, width: 34, height: 34, justifyContent: 'center', alignItems: 'center' }]}>
                        <Ionicons name="football" size={18} color={theme.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold' }}>Footy Club Match Booking</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Pitch A • 17:00 - 18:00</ThemedText>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={theme.outline} />
                    </View>

                    <View style={[styles.teamItemCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                      <View style={[styles.feedIconBadge, { backgroundColor: theme.secondaryContainer + '11', borderRadius: 6, marginRight: Spacing.md, width: 34, height: 34, justifyContent: 'center', alignItems: 'center' }]}>
                        <MaterialCommunityIcons name="cricket" size={18} color={theme.secondary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold' }}>Corporate Cricket Match</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Pitch B • 18:30 - 20:00</ThemedText>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={theme.outline} />
                    </View>
                  </View>
                </View>

                <View style={[styles.section, { paddingBottom: 60 }]}>
                  <View style={[styles.upcomingCard, { backgroundColor: theme.primaryContainer }]}>
                    <ThemedText type="labelSm" style={{ color: '#ffffff' }}>TODAY&apos;S ESTIMATED REVENUE</ThemedText>
                    <ThemedText type="headlineLg" style={{ color: '#ffffff', marginTop: Spacing.half, fontFamily: 'Sora_800ExtraBold' }}>
                      ₹20,900
                    </ThemedText>
                    <ThemedText type="bodySm" style={{ color: '#ffffff', opacity: 0.8, marginTop: 4 }}>
                      12/12 Slots Fully Reserved Today
                    </ThemedText>
                    
                    <Pressable style={[styles.briefBtn, { backgroundColor: '#ffffff', marginTop: Spacing.md }]}>
                      <ThemedText type="labelMd" style={{ color: theme.primary, fontWeight: '700' }}>
                        VIEW DAILY INVOICES
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>
              </>
            ) : role === 'Coach' ? (
              <>
                <View style={styles.section}>
                  <View style={styles.rowBetween}>
                    <ThemedText type="headlineSm">Active Trainee Batches</ThemedText>
                    <Pressable>
                      <ThemedText type="labelMd" style={{ color: theme.secondary }}>VIEW ALL</ThemedText>
                    </Pressable>
                  </View>

                  <View style={styles.teamList}>
                    <View style={[styles.teamItemCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                      <View style={[styles.feedIconBadge, { backgroundColor: theme.primaryContainer + '11', borderRadius: 6, marginRight: Spacing.md, width: 34, height: 34, justifyContent: 'center', alignItems: 'center' }]}>
                        <Ionicons name="people-outline" size={18} color={theme.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold' }}>Under-16 Advanced Class</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Pitch A • 15:30 - 17:00</ThemedText>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={theme.outline} />
                    </View>

                    <View style={[styles.teamItemCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                      <View style={[styles.feedIconBadge, { backgroundColor: theme.secondaryContainer + '11', borderRadius: 6, marginRight: Spacing.md, width: 34, height: 34, justifyContent: 'center', alignItems: 'center' }]}>
                        <Ionicons name="person-outline" size={18} color={theme.secondary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold' }}>Individual Mentoring Class</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Gym Area • 18:00 - 19:30</ThemedText>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={theme.outline} />
                    </View>
                  </View>
                </View>

                <View style={[styles.section, { paddingBottom: 60 }]}>
                  <View style={[styles.upcomingCard, { backgroundColor: theme.primaryContainer }]}>
                    <ThemedText type="labelSm" style={{ color: '#ffffff' }}>UPCOMING ACADEMY WORKSHOP</ThemedText>
                    <ThemedText type="labelMd" style={{ color: '#ffffff', marginTop: Spacing.half, fontFamily: 'Sora_700Bold' }}>
                      SUNDAY, 10:00 GMT
                    </ThemedText>
                    <ThemedText type="bodySm" style={{ color: '#ffffff', opacity: 0.8, marginTop: 4 }}>
                      Trainee Orientation & Tactical Breakdown
                    </ThemedText>
                    
                    <Pressable style={[styles.briefBtn, { backgroundColor: '#ffffff', marginTop: Spacing.md }]}>
                      <ThemedText type="labelMd" style={{ color: theme.primary, fontWeight: '700' }}>
                        SHARE SIGNUP LINK
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>
              </>
            ) : role === 'Organizer' ? (
              <>
                <View style={styles.section}>
                  <View style={styles.rowBetween}>
                    <ThemedText type="headlineSm">Active Tournament Brackets</ThemedText>
                    <Pressable>
                      <ThemedText type="labelMd" style={{ color: theme.secondary }}>VIEW ALL</ThemedText>
                    </Pressable>
                  </View>

                  <View style={styles.teamList}>
                    <View style={[styles.teamItemCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                      <View style={[styles.feedIconBadge, { backgroundColor: theme.primaryContainer + '11', borderRadius: 6, marginRight: Spacing.md, width: 34, height: 34, justifyContent: 'center', alignItems: 'center' }]}>
                        <Ionicons name="trophy-outline" size={18} color={theme.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold' }}>Regents T10 Super League</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Falcons FC vs Wolves (Bracket)</ThemedText>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={theme.outline} />
                    </View>

                    <View style={[styles.teamItemCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                      <View style={[styles.feedIconBadge, { backgroundColor: theme.secondaryContainer + '11', borderRadius: 6, marginRight: Spacing.md, width: 34, height: 34, justifyContent: 'center', alignItems: 'center' }]}>
                        <Ionicons name="flag-outline" size={18} color={theme.secondary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold' }}>London Futsal Fete Cup</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Tigers XI vs Mavericks (Futsal)</ThemedText>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={theme.outline} />
                    </View>
                  </View>
                </View>

                <View style={[styles.section, { paddingBottom: 60 }]}>
                  <View style={[styles.upcomingCard, { backgroundColor: theme.primaryContainer }]}>
                    <ThemedText type="labelSm" style={{ color: '#ffffff' }}>UPCOMING LEAGUE FINALS</ThemedText>
                    <ThemedText type="labelMd" style={{ color: '#ffffff', marginTop: Spacing.half, fontFamily: 'Sora_700Bold' }}>
                      SATURDAY, 15:00 GMT
                    </ThemedText>
                    <ThemedText type="bodySm" style={{ color: '#ffffff', opacity: 0.8, marginTop: 4 }}>
                      Regents T10 Super League Championship Cup
                    </ThemedText>
                    
                    <Pressable style={[styles.briefBtn, { backgroundColor: '#ffffff', marginTop: Spacing.md }]}>
                      <ThemedText type="labelMd" style={{ color: theme.primary, fontWeight: '700' }}>
                        VIEW BRACKET & RULES
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>
              </>
            ) : (
              <>
                {/* Favourite Team List — tap a team to view its squad */}
                <View style={styles.section}>
                  <View style={styles.rowBetween}>
                    <ThemedText type="headlineSm">Favourite Team List</ThemedText>
                    <Pressable onPress={() => router.push('/team-management')}>
                      <ThemedText type="labelMd" style={{ color: theme.secondary }}>MANAGE</ThemedText>
                    </Pressable>
                  </View>

                  {favouriteTeams.length > 0 ? (
                    <View style={styles.teamList}>
                      {favouriteTeams.map((team) => (
                        <Pressable
                          key={team.id}
                          style={[styles.teamItemCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}
                          onPress={() => setSquadTeam(team)}
                        >
                          <Image source={getMascotImage(team.mascot)} style={styles.teamItemLogo} contentFit="cover" />
                          <View style={{ flex: 1, marginLeft: Spacing.md }}>
                            <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold' }} numberOfLines={1}>{team.name}</ThemedText>
                            <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>
                              {team.sport} • {team.players.length} squad members
                            </ThemedText>
                          </View>
                          <FavouriteTeamIcon size={16} />
                          <Ionicons name="chevron-forward" size={16} color={theme.outline} style={{ marginLeft: 8 }} />
                        </Pressable>
                      ))}
                    </View>
                  ) : (
                    <Pressable
                      style={[styles.favTeamEmptyCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}
                      onPress={() => router.push('/team-management')}
                    >
                      <Ionicons name="bookmark-outline" size={22} color={theme.textSecondary} />
                      <ThemedText type="bodyMd" style={{ color: theme.textSecondary, marginTop: 6, textAlign: 'center' }}>
                        Mark a team as your favourite to see it here
                      </ThemedText>
                    </Pressable>
                  )}
                </View>

                {/* Played Teams — top 5 previous opponents, stats only, view-only (not tappable) */}
                <View style={[styles.section, { paddingBottom: 60 }]}>
                  <ThemedText type="headlineSm">Played Teams</ThemedText>
                  <View style={styles.playedTeamList}>
                    {PLAYED_TEAMS.slice(0, 5).map((pt) => (
                      <View
                        key={pt.name}
                        style={[styles.playedTeamRow, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}
                      >
                        <Image source={getMascotImage(pt.mascot)} style={styles.playedTeamCrest} contentFit="contain" />
                        <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                          <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold' }} numberOfLines={1}>{pt.name}</ThemedText>
                          <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>{pt.sport}</ThemedText>
                        </View>
                        <View style={styles.playedTeamStats}>
                          <View style={styles.playedTeamStatCol}>
                            <ThemedText style={[styles.playedTeamStatValue, { color: theme.text }]}>{pt.runs}</ThemedText>
                            <ThemedText style={[styles.playedTeamStatLabel, { color: theme.textSecondary }]}>R</ThemedText>
                          </View>
                          <View style={styles.playedTeamStatCol}>
                            <ThemedText style={[styles.playedTeamStatValue, { color: theme.text }]}>{pt.wickets}</ThemedText>
                            <ThemedText style={[styles.playedTeamStatLabel, { color: theme.textSecondary }]}>WKT</ThemedText>
                          </View>
                          <View style={styles.playedTeamStatCol}>
                            <ThemedText style={[styles.playedTeamStatValue, { color: theme.text }]}>{pt.hr}</ThemedText>
                            <ThemedText style={[styles.playedTeamStatLabel, { color: theme.textSecondary }]}>HR</ThemedText>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        )}

      </SafeAreaView>

      {/* Sign Out Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={signOutModalVisible}
        onRequestClose={() => setSignOutModalVisible(false)}
      >
        <View style={styles.confirmModalBackdrop}>
          <View style={[styles.confirmModalCard, { backgroundColor: theme.surfaceLowest }]}>
            <View style={[styles.confirmIconContainer, { backgroundColor: theme.error + '15' }]}>
              <Ionicons name="power" size={26} color={theme.error} />
            </View>
            <ThemedText type="headlineSm" style={styles.confirmTitle}>
              Sign Out
            </ThemedText>
            <ThemedText type="bodyMd" style={[styles.confirmText, { color: theme.textSecondary }]}>
              Are you sure you want to sign out from NonStricker?
            </ThemedText>
            <View style={styles.confirmActionsRow}>
              <Pressable
                onPress={() => setSignOutModalVisible(false)}
                style={[styles.confirmBtn, styles.cancelBtn, { borderColor: theme.outlineVariant + '55' }]}
              >
                <ThemedText type="labelMd" style={{ color: theme.text }}>
                  Cancel
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={() => {
                  setSignOutModalVisible(false);
                  logOut();
                }}
                style={[styles.confirmBtn, styles.actionConfirmBtn, { backgroundColor: theme.error }]}
              >
                <ThemedText type="labelMd" style={{ color: '#ffffff' }}>
                  Sign Out
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Favourite Team Squad Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={squadTeam !== null}
        onRequestClose={() => setSquadTeam(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: theme.surfaceLowest }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {squadTeam && (
                  <Image
                    source={getMascotImage(squadTeam.mascot)}
                    style={{ width: 32, height: 32 }}
                    contentFit="contain"
                  />
                )}
                <View>
                  <ThemedText type="headlineSm">{squadTeam?.name}</ThemedText>
                  <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>{squadTeam?.sport} Squad</ThemedText>
                </View>
              </View>
              <Pressable onPress={() => setSquadTeam(null)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
              {squadTeam && squadTeam.players.length > 0 ? (
                squadTeam.players.map((player, playerIdx) => {
                  const initials = player.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
                  return (
                    <View
                      key={`${player.id}-${playerIdx}`}
                      style={[styles.squadPlayerRow, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33' }]}
                    >
                      <View style={[styles.squadAvatarCircle, { backgroundColor: theme.primary }]}>
                        <ThemedText style={styles.squadAvatarText}>{initials}</ThemedText>
                      </View>
                      <View style={styles.squadPlayerInfo}>
                        <ThemedText style={[styles.squadPlayerName, { color: theme.text }]} numberOfLines={1}>
                          {player.name}
                        </ThemedText>
                        <ThemedText style={[styles.squadPlayerPosition, { color: theme.textSecondary }]} numberOfLines={1}>
                          {player.position} • {player.skillLevel}
                        </ThemedText>
                      </View>
                      {player.jerseyNumber !== undefined && (
                        <View style={[styles.squadJerseyChip, { backgroundColor: theme.primaryContainer }]}>
                          <ThemedText style={[styles.squadJerseyText, { color: '#ffffff' }]}>#{player.jerseyNumber}</ThemedText>
                        </View>
                      )}
                    </View>
                  );
                })
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                  <Ionicons name="people-outline" size={24} color={theme.textSecondary} />
                  <ThemedText type="bodyMd" style={{ color: theme.textSecondary, marginTop: 8, textAlign: 'center' }}>
                    No squad members added yet
                  </ThemedText>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </GradientContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#0000000a',
    zIndex: 10,
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontFamily: 'Sora_700Bold',
    fontSize: 16,
  },
  iconButton: {
    padding: 6,
  },
  headerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButtonSmall: {
    width: 33,
    height: 33,
    borderRadius: 16.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSection: {
    paddingHorizontal: Spacing.containerMargin,
    marginTop: Spacing.xs,
  },
  heroCard: {
    borderRadius: BorderRadius.premium,
    padding: Spacing.md,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    paddingTop: 80, // Allow banner height layout offset
  },
  heroBannerImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 115,
    width: '100%',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    zIndex: 10,
  },
  profileHeaderBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    zIndex: 10,
    paddingHorizontal: Spacing.xs,
  },
  profileTextDetails: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: 'center',
  },
  pillActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    width: '100%',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    zIndex: 10,
  },
  pillActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: BorderRadius.xl,
  },
  circularActionBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  avatarUploadBtn: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: 8,
    alignItems: 'center',
  },
  heroInfo: {
    alignItems: 'center',
    marginTop: 6,
  },
  cardStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 12,
    marginTop: Spacing.sm,
  },
  cardStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  verticalDivider: {
    width: 1,
    height: 30,
  },
  heroActionIconsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIconBtnOutline: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  editBannerBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 33, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    zIndex: 30,
  },
  
  // Tab Bar Styles — compact segmented control (mirrors the app's other segmented pickers)
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: Spacing.containerMargin,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    padding: 4,
    borderRadius: BorderRadius.lg,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: BorderRadius.md,
  },
  tabButtonActive: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  tabText: {
    fontSize: 10,
    letterSpacing: 0.2,
  },

  // Independent Scroll Tab style
  tabScrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  section: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.containerMargin,
  },

  // Tab Content Header Style
  tabHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  tabHeaderTitle: {
    fontFamily: 'Sora_700Bold',
    fontSize: 12,
    letterSpacing: 0.6,
  },

  // Vector Illustration Styles
  illustrationBanner: {
    width: '100%',
    height: 100,
    borderRadius: BorderRadius.xl,
  },
  trophyIllustration: {
    width: 48,
    height: 48,
  },
  bioIllustration: {
    width: 44,
    height: 44,
    marginTop: -Spacing.xs,
  },
  huddleIllustration: {
    width: 100,
    height: 60,
  },
  feedFooterCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
    borderWidth: 1,
  },

  // Bento Styles
  bentoContainer: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  bentoCell: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    padding: 12,
  },
  bentoValRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: Spacing.half,
  },
  skillCard: {
    borderRadius: BorderRadius.xl,
    padding: 14,
    position: 'relative',
    overflow: 'hidden',
  },
  skillCardDecor: {
    position: 'absolute',
    right: -10,
    bottom: -10,
  },
  skillValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: Spacing.xs,
  },
  progressContainer: {
    marginTop: Spacing.md,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  
  // Vitals Styles
  vitalsCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: 12,
  },
  vitalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  vitalItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(93, 104, 232, 0.05)',
    borderRadius: BorderRadius.lg,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(93, 104, 232, 0.08)',
  },
  vitalLabel: {
    fontFamily: 'Sora_700Bold',
    fontSize: 9.5,
    textTransform: 'uppercase',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  vitalValue: {
    fontFamily: 'Sora_700Bold',
    fontSize: 13.5,
    marginTop: 4,
    textAlign: 'center',
  },
 
  // Feed Styles
  feedList: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  feedItemCard: {
    flexDirection: 'row',
    borderRadius: BorderRadius.xl,
    padding: 12,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  feedIconBadge: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  feedContent: {
    flex: 1,
  },
  loadMoreBtn: {
    width: '100%',
    height: 38,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
 
  // Leaderboard Styles
  rankingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leaderboardList: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.xl,
    padding: 12,
    borderWidth: 1,
  },
  rankNumber: {
    width: 24,
    textAlign: 'center',
    fontFamily: 'Sora_700Bold',
    marginRight: Spacing.xs,
  },
  rankAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  rankScoreCol: {
    alignItems: 'flex-end',
  },
  leagueBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  },

  // Bio Details Styles
  bioHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  bioDetailsCard: {
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    padding: 14,
    marginTop: Spacing.xs,
  },
  bioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: Spacing.md,
    marginTop: Spacing.xs,
  },
  bioGridItem: {
    width: '50%',
    paddingRight: Spacing.sm,
  },
 
  // Team Styles
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  teamList: {
    gap: Spacing.sm,
  },
  teamItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.xl,
    padding: 12,
    borderWidth: 1,
  },
  teamItemLogo: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  
  // Upcoming Styles
  upcomingCard: {
    borderRadius: BorderRadius.xl,
    padding: 14,
    alignItems: 'center',
  },
  briefBtn: {
    width: '100%',
    height: 38,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Favourite Team Styles
  favTeamEmptyCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },

  // Played Teams Styles — view-only stat rows (no chevron, not pressable)
  playedTeamList: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  playedTeamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: 10,
  },
  playedTeamCrest: {
    width: 30,
    height: 30,
  },
  playedTeamStats: {
    flexDirection: 'row',
    gap: 14,
  },
  playedTeamStatCol: {
    alignItems: 'center',
    minWidth: 26,
  },
  playedTeamStatValue: {
    fontSize: 13,
    fontFamily: 'Sora_700Bold',
  },
  playedTeamStatLabel: {
    fontSize: 8,
    fontFamily: 'Sora_600SemiBold',
    letterSpacing: 0.3,
    marginTop: 1,
  },

  // Squad Modal Styles
  squadPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    padding: 10,
    marginBottom: Spacing.xs,
    borderWidth: 1,
  },
  squadAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  squadAvatarText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Sora_700Bold',
  },
  squadPlayerInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  squadPlayerName: {
    fontSize: 13,
    fontFamily: 'Sora_700Bold',
  },
  squadPlayerPosition: {
    fontSize: 11,
    marginTop: 1,
  },
  squadJerseyChip: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  squadJerseyText: {
    fontSize: 10.5,
    fontFamily: 'Sora_700Bold',
  },
  themeCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
  },
  themeSelectorRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
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
  themeOptionText: {
    fontSize: 11,
    fontFamily: 'Sora_700Bold',
  },

  // Modal Sheet Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 33, 0.7)',
    justifyContent: 'flex-end',
  },
  modalKeyboardAvoiding: {
    width: '100%',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: BorderRadius.premium,
    borderTopRightRadius: BorderRadius.premium,
    padding: Spacing.lg,
    maxHeight: '85%',
    width: '100%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#0000000a',
    paddingBottom: Spacing.sm,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalScrollContent: {
    paddingBottom: Spacing.xl,
  },
  modalSection: {
    marginTop: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#00000005',
    paddingBottom: Spacing.md,
  },
  modalSectionLabel: {
    fontFamily: 'Sora_700Bold',
    fontSize: 10,
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
  },
  modalSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontFamily: 'Sora_700Bold',
    fontSize: 10,
    letterSpacing: 0.6,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
  },
  textInput: {
    height: 44,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 13,
    fontFamily: 'Sora_500Medium',
    borderWidth: 1,
    borderColor: '#0000000a',
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  primaryActionBtn: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryActionBtn: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownTrigger: {
    height: 44,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownValue: {
    fontSize: 13,
    fontFamily: 'Sora_500Medium',
  },
  dropdownList: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownItemText: {
    fontSize: 13,
    fontFamily: 'Sora_500Medium',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    width: '100%',
  },
  confirmModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 33, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  confirmModalCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 12,
    padding: Spacing.lg,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  confirmIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  confirmTitle: {
    fontFamily: 'Sora_700Bold',
    fontSize: 18,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  confirmText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  confirmActionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    width: '100%',
  },
  confirmBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    borderWidth: 1,
  },
  actionConfirmBtn: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bannerScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 48,
  },
  profileNameText: {
    color: '#ffffff',
    fontSize: 20,
    fontFamily: 'Sora_700Bold',
  },
  profileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  profileMetaText: {
    color: '#cbd5e1',
    fontSize: 12,
    marginLeft: 3,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#94a3b8',
    marginHorizontal: 6,
  },
  profileMemberText: {
    color: '#94a3b8',
    fontSize: 11,
  },
});

