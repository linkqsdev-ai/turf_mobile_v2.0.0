import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useUserProfile } from '@/hooks/use-user-profile';

const BANNERS: Record<string, any> = {
  football: { uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC9H8hZV1gCxBOC9fWHjQyhn5ukWJhiNGuP6cNDATeIj2gP6JceuAOrhkqeTXWFS75Y0nw0QANCmhRdo0NYvbdmh4Xrs2itBjykGtZr0Y91KEzjUMyOoM-B-owetUT1u8vwmIZlGJkcKdkgVfU0TIGzuVVlTN3lhwfdg5OWwHMCKOyPJGWWdIKySwofsCUjnq9pJi4WH0BMDAi73A53u0OeKj_Ufmh6V4PVwghrjz5aX16NlvQZLOkQRC51252maP-4ZXwNw3MwVfU' }, // Premium Football Arena
  multisport: { uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYH5UnRgCz_j_xsBoTCePAImR1ZHOP1RfajoZLHKUgxQwU2qFlQ8NWyiYz_-6zqqufh9YnYe3jfTI8tuaUrjmH6obvvea2p2vYA7ndyut0M5-lxcOtwTVQQwh58VRPis3197lvVOpVGsJ6YCx55CCy4Q_1CqZxk1rVqp9mBGHM-rDNwh7PGYSDJt6Vq4tmn6G1gXGiZsm13J0D1BFkKFRb8WvrWqqyLWxu-oSZsnMp6YXOONRG89ypF-GKlh96WMcF3HOikmE9l-g' }, // Indoor Multisport Hub
  cricket: { uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBgd1vfTA0Wj7Aw7aa0JRKzQ5y-6py-pQtMBI-gst90jIWFZoLSiIKBngPK1pn2UxzH_X3pN_lyCt75AnQxS2ssN4J4LUIYpph_JK48kGmSoO16OFhs5uLgsc_Yu3PIrOEneDELuLpKY8BDiUsatTLvRSu0sukxSfAxInyA2XknjvcswWPyUJA2YeNlJ2Vg2t7N807Cydno4uUCtypPyLkI0hi7Xl4DnWaNBueVN4jqiXqkqrc8MEPwQF24g45uu8z8gsXQ9IL87oI' }, // Cricket Pitch Night
  checkout: { uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBrIeKWYsLxon2GlQroYjnKVPqbeEnzeZiUZZ66CS06N5lbQ6MVSfOE-hColTE6vO6R5n1-bbL_cX-FjW9ejhGGsOeF-oZuoniI7zrrjF_Im8cMeI1IQaIPPl2Mm_XTP52C0Hkood--_ZK22d3Y_tQbO8xBHh5eS8yONy6ot93tgSxXVz2H18xWI0l2EBv6WrOWm8NhnH_-kSXo0bhv0p-MeWPtkT0mEOuYpzsvJ9LUe3eu3QC6YZZU6zVrz5F5A68HtNAmq_qmBOw' }, // Cricket Pitch Daylight
  community: { uri: 'https://lh3.googleusercontent.com/aida/AP1WRLsc-p9LNafOZ1s0XNvsry058SauJeeElNyBuxym6ZhiCwUG-0KP3qZ9-Sv9OP3OVnhWKioZVSoN3EOcZ2Kc1OJKGOZSB9ioEnBSpLCgsYN-AgQXrVnc2O42rAutO6l6aFEvLsUgBHN57i3-AzCKTfZRam7oDm5L2CnDWRLIXfdFRBK8iz2MsaYQVAdtk0OH1XwkBTPbr18Wr5zuBBhvwfiVQv44xHBz7SD6kBdiyxqkNCP8zmwoVF8DaWI' }, // Club Community
};

const TABS = ['Performance', 'Feed', 'Ranking', 'Profile'] as const;
type TabType = typeof TABS[number];

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { profile, updateProfile } = useUserProfile();
  const [activeTab, setActiveTab] = useState<TabType>('Profile');

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

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header Bar */}
        <View style={[styles.header, { backgroundColor: theme.background }]}>
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
            Player Profile
          </ThemedText>
          <Pressable style={styles.iconButton}>
            <Ionicons name="share-outline" size={22} color={theme.text} />
          </Pressable>
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
            
            {/* Avatar & Floating Actions Overlap Banner */}
            <View style={styles.avatarRow}>
              {/* Left Action Button (Edit Profile - moved from bottom) */}
              <Pressable 
                onPress={() => router.push('/edit-profile')}
                style={[styles.circularActionBtn, { backgroundColor: 'rgba(15, 23, 33, 0.85)', borderColor: 'rgba(255, 255, 255, 0.2)' }]}
              >
                <Ionicons name="create-outline" size={18} color="#ffffff" />
              </Pressable>

              {/* Central Avatar */}
              <View style={styles.avatarWrapper}>
                <Image
                  source={{ uri: profile.avatarUrl }}
                  style={styles.avatarImage}
                />
                <Pressable 
                  onPress={() => router.push('/edit-profile')}
                  style={[styles.avatarUploadBtn, { backgroundColor: theme.secondaryContainer }]}
                >
                  <Ionicons name="camera" size={10} color={theme.onSecondaryContainer} />
                </Pressable>
              </View>

              {/* Right Action Button (Share Stats - moved from bottom) */}
              <Pressable 
                onPress={() => {
                  Alert.alert('Share Stats', 'Your profile stats link has been copied to your clipboard!');
                }}
                style={[styles.circularActionBtn, { backgroundColor: 'rgba(15, 23, 33, 0.85)', borderColor: 'rgba(255, 255, 255, 0.2)' }]}
              >
                <Ionicons name="share-social-outline" size={18} color="#ffffff" />
              </Pressable>
            </View>

            {/* Badges Row */}
            <View style={styles.badgeRow}>
              <View style={[styles.proBadgeCard, { backgroundColor: theme.secondaryContainer }]}>
                <ThemedText type="labelSm" style={{ color: theme.onSecondaryContainer, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 9 }}>
                  PRO ELITE
                </ThemedText>
              </View>
              <View style={[styles.diamondBadgeCard, { backgroundColor: 'rgba(255, 255, 255, 0.08)', borderColor: 'rgba(255, 255, 255, 0.15)', borderWidth: 1 }]}>
                <Ionicons name="diamond-outline" size={10} color="#ffffff" style={{ marginRight: 4 }} />
                <ThemedText type="labelSm" style={{ color: '#ffffff', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 9, letterSpacing: 0.5 }}>
                  DIAMOND TIER
                </ThemedText>
              </View>
            </View>

            {/* Member Date */}
            <ThemedText type="bodySm" style={{ color: '#94a3b8', marginTop: Spacing.sm }}>
              Member since {profile.memberSince.split(' ')[0]} {profile.memberSince.split(' ')[1]}
            </ThemedText>

            {/* Profile Info */}
            <View style={styles.heroInfo}>
              <ThemedText type="headlineLg" style={{ color: '#ffffff' }}>{profile.name}</ThemedText>
              <ThemedText type="bodySm" style={{ color: '#94a3b8', marginTop: 2 }}>
                {profile.position} • {profile.location}
              </ThemedText>
            </View>

            {/* Card Stats Grid (Mock Reference Alignment) */}
            <View style={[styles.cardStatsRow, { borderTopColor: 'rgba(255, 255, 255, 0.08)', borderBottomColor: 'rgba(255, 255, 255, 0.08)' }]}>
              <View style={styles.cardStatItem}>
                <ThemedText type="headlineSm" style={{ color: '#ffffff' }}>142</ThemedText>
                <ThemedText type="labelSm" style={{ color: '#94a3b8', marginTop: 2, fontSize: 10 }}>Matches</ThemedText>
              </View>
              <View style={[styles.verticalDivider, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]} />
              <View style={styles.cardStatItem}>
                <ThemedText type="headlineSm" style={{ color: '#ffffff' }}>12.4k</ThemedText>
                <ThemedText type="labelSm" style={{ color: '#94a3b8', marginTop: 2, fontSize: 10 }}>Followers</ThemedText>
              </View>
              <View style={[styles.verticalDivider, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]} />
              <View style={styles.cardStatItem}>
                <ThemedText type="headlineSm" style={{ color: '#ffffff' }}>89</ThemedText>
                <ThemedText type="labelSm" style={{ color: '#94a3b8', marginTop: 2, fontSize: 10 }}>Wins</ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* Fixed Dynamic Tab Navigation Bar */}
        <View style={[styles.tabsContainer, { borderBottomColor: theme.outlineVariant + '22' }]}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[
                  styles.tabButton,
                  isActive 
                    ? { borderBottomColor: theme.primary } 
                    : { borderBottomColor: 'transparent' }
                ]}
              >
                <ThemedText
                  type="labelMd"
                  style={[
                    styles.tabText,
                    { 
                      color: isActive ? theme.primary : theme.textSecondary,
                      fontFamily: isActive ? 'PlusJakartaSans_700Bold' : 'PlusJakartaSans_500Medium',
                    }
                  ]}
                >
                  {tab.toUpperCase()}
                </ThemedText>
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
          >
            {/* Vector Illustration Banner */}
            <View style={styles.section}>
              <Image 
                source={require('@/assets/images/illustrations/stadium.png')} 
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
                  PERFORMANCE OVERVIEW
                </ThemedText>
              </View>

              <View style={styles.bentoContainer}>
                <View style={styles.bentoRow}>
                  <View style={[styles.bentoCell, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>MATCHES PLAYED</ThemedText>
                    <View style={styles.bentoValRow}>
                      <ThemedText type="displayLgMobile" style={{ color: theme.text }}>142</ThemedText>
                      <ThemedText type="labelSm" style={{ color: theme.secondary, fontFamily: 'PlusJakartaSans_700Bold' }}>+12% LY</ThemedText>
                    </View>
                  </View>
                  <View style={[styles.bentoCell, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>TOTAL WINS</ThemedText>
                    <View style={styles.bentoValRow}>
                      <ThemedText type="displayLgMobile" style={{ color: theme.text }}>89</ThemedText>
                      <ThemedText type="labelSm" style={{ color: '#16a34a', fontFamily: 'PlusJakartaSans_700Bold' }}>62.6% WR</ThemedText>
                    </View>
                  </View>
                </View>

                {/* Skill Rating Card */}
                <View style={[styles.skillCard, { backgroundColor: theme.primaryContainer }]}>
                  <Ionicons name="medal" size={80} color="rgba(255,255,255,0.03)" style={styles.skillCardDecor} />
                  <ThemedText type="labelSm" style={{ color: theme.onPrimaryContainer, letterSpacing: 0.5 }}>SKILL RATING</ThemedText>
                  <View style={styles.skillValRow}>
                    <ThemedText type="displayLgMobile" style={{ color: '#ffffff' }}>2,840</ThemedText>
                    <ThemedText type="headlineSm" style={{ color: theme.secondaryContainer, marginLeft: Spacing.sm }}>PLATINUM</ThemedText>
                  </View>
                  <View style={styles.progressContainer}>
                    <View style={[styles.progressTrack, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                      <View style={[styles.progressBar, { backgroundColor: theme.secondaryContainer, width: '85%' }]} />
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Health Vitals */}
            <View style={[styles.section, { paddingBottom: 40 }]}>
              <View style={[styles.vitalsCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
                <View style={styles.rowBetween}>
                  <ThemedText type="headlineSm">Health Vitals</ThemedText>
                  <Ionicons name="pulse" size={18} color={theme.secondary} />
                </View>
                <View style={styles.vitalsRow}>
                  <View style={styles.vitalItem}>
                    <ThemedText type="bodySm" style={{ color: theme.textSecondary }}>Recovery Score</ThemedText>
                    <ThemedText type="headlineSm" style={{ color: '#16a34a' }}>92%</ThemedText>
                  </View>
                  <View style={styles.vitalItem}>
                    <ThemedText type="bodySm" style={{ color: theme.textSecondary }}>Heart Rate (Avg)</ThemedText>
                    <ThemedText type="headlineSm" style={{ color: theme.text }}>54 BPM</ThemedText>
                  </View>
                  <View style={styles.vitalItem}>
                    <ThemedText type="bodySm" style={{ color: theme.textSecondary }}>Sleep Quality</ThemedText>
                    <ThemedText type="headlineSm" style={{ color: theme.secondary }}>Optimal</ThemedText>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        )}

        {activeTab === 'Feed' && (
          <ScrollView 
            style={styles.tabScrollView} 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={styles.scrollContent}
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
                {/* Feed Item 1: Victory */}
                <View style={[styles.feedItemCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
                  <View style={[styles.feedIconBadge, { backgroundColor: theme.primaryContainer + '11' }]}>
                    <Ionicons name="trophy-outline" size={20} color={theme.primary} />
                  </View>
                  <View style={styles.feedContent}>
                    <View style={styles.rowBetween}>
                      <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>Victory vs Titans XI</ThemedText>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>5 hrs ago</ThemedText>
                    </View>
                    <ThemedText type="bodySm" style={{ color: theme.textSecondary, marginTop: 2 }}>
                      Led Blue Falcons FC to a 4-2 win. Scored 2 goals and assisted 1. Named Match MVP!
                    </ThemedText>
                    <View style={styles.feedStatsBadgeRow}>
                      <View style={[styles.miniBadge, { backgroundColor: theme.surfaceLow }]}>
                        <ThemedText type="labelSm" style={{ color: theme.text, fontSize: 10 }}>2 Goals</ThemedText>
                      </View>
                      <View style={[styles.miniBadge, { backgroundColor: theme.surfaceLow }]}>
                        <ThemedText type="labelSm" style={{ color: theme.text, fontSize: 10 }}>1 Assist</ThemedText>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Feed Item 2: Training */}
                <View style={[styles.feedItemCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
                  <View style={[styles.feedIconBadge, { backgroundColor: theme.secondaryContainer + '11' }]}>
                    <Ionicons name="barbell-outline" size={20} color={theme.secondary} />
                  </View>
                  <View style={styles.feedContent}>
                    <View style={styles.rowBetween}>
                      <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>Strength Training</ThemedText>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Yesterday</ThemedText>
                    </View>
                    <ThemedText type="bodySm" style={{ color: theme.textSecondary, marginTop: 2 }}>
                      Completed 75-minute explosive power session targeting fast-twitch leg muscle groups.
                    </ThemedText>
                  </View>
                </View>

                {/* Feed Item 3: Achievement */}
                <View style={[styles.feedItemCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
                  <View style={[styles.feedIconBadge, { backgroundColor: theme.secondaryContainer + '11' }]}>
                    <Ionicons name="ribbon-outline" size={20} color={theme.secondary} />
                  </View>
                  <View style={styles.feedContent}>
                    <View style={styles.rowBetween}>
                      <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>Achievement Unlocked</ThemedText>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>3 days ago</ThemedText>
                    </View>
                    <ThemedText type="bodySm" style={{ color: theme.textSecondary, marginTop: 2 }}>
                      {"Earned the \"Centurion\" badge for completing 100 competitive bookings this season."}
                    </ThemedText>
                  </View>
                </View>
              </View>

              <Pressable style={[styles.loadMoreBtn, { borderColor: theme.outline }]}>
                <ThemedText type="labelMd" style={{ color: theme.text }}>LOAD MORE ACTIVITIES</ThemedText>
              </Pressable>

              {/* Vector Illustration Footer */}
              <View style={[styles.feedFooterCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
                <Image 
                  source={require('@/assets/images/illustrations/team_huddle.png')} 
                  style={styles.huddleIllustration} 
                  contentFit="contain"
                />
                <ThemedText type="bodySm" style={{ color: theme.textSecondary, textAlign: 'center', marginTop: Spacing.sm }}>
                  Stay active and coordinate with your squad for upcoming league games.
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
          >
            <View style={[styles.section, { paddingBottom: 40 }]}>
              {/* Ranking Header Row with Illustration */}
              <View style={styles.rankingHeaderRow}>
                {/* Tab Header with Icon */}
                <View style={styles.tabHeaderRow}>
                  <Ionicons name="trophy-outline" size={18} color={theme.secondary} />
                  <ThemedText type="labelMd" style={[styles.tabHeaderTitle, { color: theme.text }]}>
                    DIAMOND LEAGUE LEADERBOARD
                  </ThemedText>
                </View>
                <Image 
                  source={require('@/assets/images/illustrations/trophy.png')} 
                  style={styles.trophyIllustration} 
                  contentFit="contain"
                />
              </View>

              <View style={styles.leaderboardList}>
                {/* Leaderboard Item 1: Marcus */}
                <Pressable 
                  onPress={() => router.push('/player-profile')}
                  style={[styles.leaderboardRow, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '22' }, Shadows.level1]}
                >
                  <ThemedText type="headlineSm" style={[styles.rankNumber, { color: '#eab308' }]}>1</ThemedText>
                  <Image
                    source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuArAOIUhE03Lj1tb66WvRYbrDl7KgoGi5vi2XdzpRBJZXrgyquUa_Wcq1_1Xw_y_rivR86-gT3hvD_AMDC0AToCv2TlfFvJkAEgCCRIzrnuCYHY1x2qNK5KPcaR0rKKYurjgdOgv-arR6X5hantltjIX11HyFp-SaPyvvlS4_TamcTrufMiKMYoe3DFI6op6vuXrM76Hm-3wwSxa3XmAFKyPN_IHA9hYsDChsVIawl-XafxniTDyhS1p3Bw61Jtfdp7r-0TBw35WHI' }}
                    style={styles.rankAvatar}
                  />
                  <View style={{ flex: 1, marginLeft: Spacing.md }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>Marcus V.</ThemedText>
                      <Ionicons name="checkmark-circle" size={14} color={theme.secondaryContainer} style={{ marginLeft: 4 }} />
                    </View>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Forward • London</ThemedText>
                  </View>
                  <View style={styles.rankScoreCol}>
                    <ThemedText type="bodyMd" style={{ fontFamily: 'PlusJakartaSans_700Bold', color: theme.text }}>2,980</ThemedText>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>PTS</ThemedText>
                  </View>
                </Pressable>

                {/* Leaderboard Item 2: Sarah */}
                <View style={[styles.leaderboardRow, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '22' }, Shadows.level1]}>
                  <ThemedText type="headlineSm" style={[styles.rankNumber, { color: '#94a3b8' }]}>2</ThemedText>
                  <Image
                    source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYH5UnRgCz_j_xsBoTCePAImR1ZHOP1RfajoZLHKUgxQwU2qFlQ8NWyiYz_-6zqqufh9YnYe3jfTI8tuaUrjmH6obvvea2p2vYA7ndyut0M5-lxcOtwTVQQwh58VRPis3197lvVOpVGsJ6YCx55CCy4Q_1CqZxk1rVqp9mBGHM-rDNwh7PGYSDJt6Vq4tmn6G1gXGiZsm13J0D1BFkKFRb8WvrWqqyLWxu-oSZsnMp6YXOONRG89ypF-GKlh96WMcF3HOikmE9l-g' }}
                    style={styles.rankAvatar}
                  />
                  <View style={{ flex: 1, marginLeft: Spacing.md }}>
                    <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>Sarah K.</ThemedText>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Midfielder • Bristol</ThemedText>
                  </View>
                  <View style={styles.rankScoreCol}>
                    <ThemedText type="bodyMd" style={{ fontFamily: 'PlusJakartaSans_700Bold', color: theme.text }}>2,910</ThemedText>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>PTS</ThemedText>
                  </View>
                </View>

                {/* Leaderboard Item 3: Azarudeen (Me) */}
                <View style={[styles.leaderboardRow, { backgroundColor: theme.primaryContainer + '11', borderColor: theme.primary, borderWidth: 1.5 }, Shadows.level1]}>
                  <ThemedText type="headlineSm" style={[styles.rankNumber, { color: theme.primary }]}>3</ThemedText>
                  <Image
                    source={profile.avatarUrl}
                    style={styles.rankAvatar}
                  />
                  <View style={{ flex: 1, marginLeft: Spacing.md }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold', color: theme.primary }}>{profile.name} (You)</ThemedText>
                      <View style={[styles.youTag, { backgroundColor: theme.primary }]}>
                        <ThemedText type="labelSm" style={{ color: '#ffffff', fontSize: 8, fontFamily: 'PlusJakartaSans_700Bold' }}>YOU</ThemedText>
                      </View>
                    </View>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>{profile.position} • {profile.location.split(',')[0]}</ThemedText>
                  </View>
                  <View style={styles.rankScoreCol}>
                    <ThemedText type="bodyMd" style={{ fontFamily: 'PlusJakartaSans_700Bold', color: theme.primary }}>2,840</ThemedText>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>PTS</ThemedText>
                  </View>
                </View>

                {/* Leaderboard Item 4: Elena */}
                <View style={[styles.leaderboardRow, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '22' }, Shadows.level1]}>
                  <ThemedText type="headlineSm" style={[styles.rankNumber, { color: '#b45309' }]}>4</ThemedText>
                  <Image
                    source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBgd1vfTA0Wj7Aw7aa0JRKzQ5y-6py-pQtMBI-gst90jIWFZoLSiIKBngPK1pn2UxzH_X3pN_lyCt75AnQxS2ssN4J4LUIYpph_JK48kGmSoO16OFhs5uLgsc_Yu3PIrOEneDELuLpKY8BDiUsatTLvRSu0sukxSfAxInyA2XknjvcswWPyUJA2YeNlJ2Vg2t7N807Cydno4uUCtypPyLkI0hi7Xl4DnWaNBueVN4jqiXqkqrc8MEPwQF24g45uu8z8gsXQ9IL87oI' }}
                    style={styles.rankAvatar}
                  />
                  <View style={{ flex: 1, marginLeft: Spacing.md }}>
                    <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>Elena S.</ThemedText>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Midfielder • London</ThemedText>
                  </View>
                  <View style={styles.rankScoreCol}>
                    <ThemedText type="bodyMd" style={{ fontFamily: 'PlusJakartaSans_700Bold', color: theme.text }}>2,780</ThemedText>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>PTS</ThemedText>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        )}

          {activeTab === 'Profile' && (
            <ScrollView 
              style={styles.tabScrollView} 
              showsVerticalScrollIndicator={false} 
              contentContainerStyle={styles.scrollContent}
            >
              {/* Bio Details Card */}
              <View style={styles.section}>
                {/* Tab Header with Icon */}
                <View style={styles.tabHeaderRow}>
                  <Ionicons name="person-outline" size={18} color={theme.secondary} />
                  <ThemedText type="labelMd" style={[styles.tabHeaderTitle, { color: theme.text }]}>
                    BIO DETAILS & TEAMS
                  </ThemedText>
                </View>

                <View style={[styles.bioDetailsCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
                  <View style={styles.bioHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <ThemedText type="headlineSm">Bio Details</ThemedText>
                    </View>
                    <Image 
                      source={require('@/assets/images/illustrations/football_player.png')} 
                      style={styles.bioIllustration} 
                      contentFit="contain"
                    />
                  </View>
                  
                  <View style={styles.bioGrid}>
                    <View style={styles.bioGridItem}>
                      <ThemedText type="bodySm" style={{ color: theme.textSecondary }}>Preferred Foot</ThemedText>
                      <ThemedText type="bodyMd" style={{ fontFamily: 'PlusJakartaSans_700Bold', marginTop: 2 }}>{profile.preferredFoot}</ThemedText>
                    </View>
                    <View style={styles.bioGridItem}>
                      <ThemedText type="bodySm" style={{ color: theme.textSecondary }}>Playing Position</ThemedText>
                      <ThemedText type="bodyMd" style={{ fontFamily: 'PlusJakartaSans_700Bold', marginTop: 2 }}>{profile.position}</ThemedText>
                    </View>
                    <View style={styles.bioGridItem}>
                      <ThemedText type="bodySm" style={{ color: theme.textSecondary }}>Preferred Style</ThemedText>
                      <ThemedText type="bodyMd" style={{ fontFamily: 'PlusJakartaSans_700Bold', marginTop: 2 }}>{profile.playingStyle}</ThemedText>
                    </View>
                    <View style={styles.bioGridItem}>
                      <ThemedText type="bodySm" style={{ color: theme.textSecondary }}>Member Since</ThemedText>
                      <ThemedText type="bodyMd" style={{ fontFamily: 'PlusJakartaSans_700Bold', marginTop: 2 }}>{profile.memberSince}</ThemedText>
                    </View>
                  </View>
                  
                  <View style={{ borderTopWidth: 1, borderTopColor: theme.outlineVariant + '33', paddingTop: Spacing.md, marginTop: Spacing.md }}>
                    <ThemedText type="bodySm" style={{ color: theme.textSecondary, marginBottom: Spacing.xs, fontFamily: 'PlusJakartaSans_700Bold' }}>BIO DESCRIPTION</ThemedText>
                    <ThemedText type="bodyMd" style={{ color: theme.textSecondary, lineHeight: 20 }}>
                      {profile.bio}
                    </ThemedText>
                  </View>
                </View>
              </View>

              {/* Teams Section */}
              <View style={styles.section}>
                <View style={styles.rowBetween}>
                  <ThemedText type="headlineSm">My Teams</ThemedText>
                  <Pressable>
                    <ThemedText type="labelMd" style={{ color: theme.secondary }}>VIEW ALL</ThemedText>
                  </Pressable>
                </View>

                <View style={styles.teamList}>
                  <View style={[styles.teamItemCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
                    <Image source={require('@/assets/images/illustrations/athletes.png')} style={styles.teamItemLogo} contentFit="cover" />
                    <View style={{ flex: 1, marginLeft: Spacing.md }}>
                      <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>Elite Tennis Club</ThemedText>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Lead Member • Tier 1</ThemedText>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={theme.outline} />
                  </View>

                  <View style={[styles.teamItemCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
                    <Image source={require('@/assets/images/illustrations/tennis_player.png')} style={styles.teamItemLogo} contentFit="cover" />
                    <View style={{ flex: 1, marginLeft: Spacing.md }}>
                      <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>Imperial Badminton</ThemedText>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Active Pro • Regional</ThemedText>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={theme.outline} />
                  </View>
                </View>
              </View>

              {/* Upcoming Matches */}
              <View style={[styles.section, { paddingBottom: 60 }]}>
                <View style={[styles.upcomingCard, { backgroundColor: theme.primaryContainer }]}>
                  <ThemedText type="labelSm" style={{ color: theme.onPrimaryContainer }}>UPCOMING MATCH</ThemedText>
                  <ThemedText type="labelMd" style={{ color: theme.secondaryContainer, marginTop: Spacing.half, fontFamily: 'PlusJakartaSans_700Bold' }}>
                    SATURDAY, 18:30 GMT
                  </ThemedText>
                  
                  <View style={versusContainerStyle()}>
                    <View style={styles.versusTeam}>
                      <View style={styles.teamBadgeText}><ThemedText type="bodySm" style={{ color: '#ffffff', fontWeight: '800' }}>BF</ThemedText></View>
                      <ThemedText type="labelSm" style={{ color: '#ffffff', marginTop: 4 }}>Falcons</ThemedText>
                    </View>
                    <ThemedText type="headlineSm" style={{ color: theme.secondaryContainer }}>VS</ThemedText>
                    <View style={styles.versusTeam}>
                      <View style={styles.teamBadgeText}><ThemedText type="bodySm" style={{ color: '#ffffff', fontWeight: '800' }}>WS</ThemedText></View>
                      <ThemedText type="labelSm" style={{ color: '#ffffff', marginTop: 4 }}>Wolves</ThemedText>
                    </View>
                  </View>

                  <Pressable style={[styles.briefBtn, { backgroundColor: theme.secondaryContainer }]}>
                    <ThemedText type="labelMd" style={{ color: theme.onSecondaryContainer, fontWeight: '700' }}>
                      VIEW PRE-MATCH BRIEF
                    </ThemedText>
                  </Pressable>
                </View>
              </View>
            </ScrollView>
          )}

      </SafeAreaView>
    </ThemedView>
  );
}

// Helper to resolve scope check
function versusContainerStyle() {
  return styles.versusContainer;
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
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 16,
  },
  iconButton: {
    padding: 6,
  },
  heroSection: {
    paddingHorizontal: Spacing.containerMargin,
    marginTop: Spacing.md,
  },
  heroCard: {
    borderRadius: BorderRadius.premium,
    padding: Spacing.lg,
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
    height: 120,
    width: '100%',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    zIndex: 10,
  },
  circularActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  avatarUploadBtn: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  proBadgeCard: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: BorderRadius.md,
  },
  diamondBadgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: BorderRadius.md,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  heroInfo: {
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  cardStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.md,
  },
  cardStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  verticalDivider: {
    width: 1,
    height: 24,
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
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(15, 23, 33, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    zIndex: 30,
  },
  
  // Tab Bar Styles
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.containerMargin,
    marginBottom: Spacing.xs,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2.5,
  },
  tabText: {
    fontSize: 11,
    letterSpacing: 0.5,
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
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10,
    letterSpacing: 1.0,
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
    padding: Spacing.md,
  },
  bentoValRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: Spacing.half,
  },
  skillCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
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
    padding: Spacing.lg,
  },
  vitalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  vitalItem: {
    alignItems: 'center',
  },

  // Feed Styles
  feedList: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  feedItemCard: {
    flexDirection: 'row',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  feedIconBadge: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  feedContent: {
    flex: 1,
  },
  feedStatsBadgeRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  miniBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  loadMoreBtn: {
    width: '100%',
    height: 48,
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
    padding: Spacing.md,
    borderWidth: 1,
  },
  rankNumber: {
    width: 24,
    textAlign: 'center',
    fontFamily: 'HankenGrotesk_700Bold',
    marginRight: Spacing.xs,
  },
  rankAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  rankScoreCol: {
    alignItems: 'flex-end',
  },
  leagueBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  },
  youTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Bio Details Styles
  bioHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bioDetailsCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    marginTop: Spacing.xs,
  },
  bioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: Spacing.md,
    marginTop: Spacing.md,
  },
  bioGridItem: {
    width: '50%',
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
    padding: Spacing.md,
    borderWidth: 1,
  },
  teamItemLogo: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  
  // Upcoming Styles
  upcomingCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  versusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
    marginVertical: Spacing.lg,
  },
  versusTeam: {
    alignItems: 'center',
  },
  teamBadgeText: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  briefBtn: {
    width: '100%',
    height: 48,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
