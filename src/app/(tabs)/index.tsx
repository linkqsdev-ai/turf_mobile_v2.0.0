import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { CoinTossModal } from '@/components/coin-toss-modal';
import Reanimated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GradientContainer } from '@/components/gradient-container';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { getSportIllustration } from '@/constants/sports';
import { useTheme } from '@/hooks/use-theme';
import { useUserProfile, getShortLocation } from '@/hooks/use-user-profile';
import { getAvatarSource } from '@/constants/avatars';
import { PromoBanner, AutoScrollingHorizontalBanners, BANNER_DESIGNS_10 } from '@/components/promo-banner';
import { useClassStore, useTurfStore, useOfferStore } from '@/store/app-store';
import { isExpired } from '@/store/offer-store';
import { turfApi } from '@/services/turf-api';
import { cleanLocation } from '@/utils/location';

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { profile } = useUserProfile();
  const { classes } = useClassStore();
  const { ownedTurfs } = useTurfStore();
  const { offers } = useOfferStore();
  const [backendTurfs, setBackendTurfs] = useState<any[]>([]);

  // Summary shown on the owner's Vouchers & Offers entry card. An offer that has
  // lapsed by date isn't "live" even though its stored status still says active.
  const ownerLiveOfferCount = React.useMemo(
    () => offers.filter(o => o.status === 'active' && !isExpired(o)).length,
    [offers]
  );
  const ownerRedemptionCount = React.useMemo(
    () => offers.reduce((sum, o) => sum + o.redeemedCount, 0),
    [offers]
  );
  const [refreshing, setRefreshing] = useState(false);

  const fetchTurfs = React.useCallback(async () => {
    try {
      const data = await turfApi.listTurfs();
      if (Array.isArray(data)) {
        setBackendTurfs(data);
      }
    } catch (err) {
      console.log('Failed to fetch backend turfs in home:', err);
    }
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchTurfs();
    setTimeout(() => setRefreshing(false), 600);
  }, [fetchTurfs]);

  useFocusEffect(
    React.useCallback(() => {
      fetchTurfs();
    }, [fetchTurfs])
  );
  const role: string = profile.role || 'Player';
  const [coinTossVisible, setCoinTossVisible] = useState(false);


  // Interactive Chart & Heatmap Selected States
  const [selectedBar, setSelectedBar] = useState<{ day: string; fullDay: string; revenue: string; label: string; height: number; bookings: string; peak: string } | null>({
    day: 'F',
    fullDay: 'Friday',
    revenue: '₹28,000',
    label: '28k',
    height: 95,
    bookings: '12 Turf Bookings + 4 Coaching Sessions',
    peak: '5:00 PM - 10:00 PM',
  });

const CALENDAR_WEEKS = [
  [1, 2, 3, 4, 5, 6, 7],
  [8, 9, 10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19, 20, 21],
  [22, 23, 24, 25, 26, 27, 28],
];

const CALENDAR_DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const [selectedHeatmapDay, setSelectedHeatmapDay] = useState<{ day: number; label: string; occupancy: string; bookings: string; revenue: string; level: 'Low' | 'Medium' | 'Peak' } | null>({
    day: 14,
    label: 'Sunday, Day 14',
    occupancy: '94%',
    bookings: '16 Slots Booked (1 Free Slot)',
    revenue: '₹36,500 Total Revenue',
    level: 'Peak',
  });

  const handleProfilePress = () => router.push('/profile');
  const handleNetworkPress = () => router.push('/(tabs)/network');

  return (
    <GradientContainer screenName="home" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Top App Bar */}
        <View style={[styles.header, { backgroundColor: 'transparent' }]}>
          <View style={styles.headerLeft}>
            <Pressable style={styles.profileIconButton} onPress={handleProfilePress}>
              <Image
                source={getAvatarSource(profile.avatarUrl)}
                style={styles.headerAvatar}
                contentFit="cover"
              />
            </Pressable>
            <View style={styles.headerTextGroup}>
              <ThemedText type="bodyMd" style={{ color: theme.text, fontFamily: 'Sora_700Bold', lineHeight: 18 }}>
                {profile.name}
              </ThemedText>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <Ionicons name="location-sharp" size={12} color={theme.secondary} />
                <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginLeft: 2, fontSize: 10 }}>
                  {getShortLocation(profile.location)}
                </ThemedText>
              </View>
            </View>
          </View>
          <View style={styles.headerRightActions}>

            <Pressable style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={20} color={theme.secondary} />
            </Pressable>
            <Pressable style={styles.iconButton} onPress={() => setCoinTossVisible(true)}>
              <Image
                source={require('@/assets/images/coin_toss_icon.png')}
                style={{ width: 26, height: 26 }}
                contentFit="contain"
              />
            </Pressable>
          </View>
        </View>

        <Reanimated.View entering={FadeInDown.duration(600).damping(14)} style={{ flex: 1 }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
            }
          >
            {/* Welcome Header Section - Compact height */}
            <View style={styles.welcomeSection}>
              <View style={styles.welcomeTextContainer}>
                <ThemedText type="headlineMd" style={{ color: theme.textSecondary, fontSize: 13 }}>
                  Hello, {profile.name.split(' ')[0]}
                </ThemedText>
                <ThemedText type="headlineLg" style={[styles.welcomeHeadline, { fontSize: 20, lineHeight: 24 }]}>
                  {role === 'Owner'
                    ? "Manage Your Arena"
                    : role === 'Coach'
                      ? "Academy Dashboard"
                      : role === 'Organizer'
                        ? "Host Premium Leagues"
                        : "Let's become more Productive"}
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
                        : require('@/assets/images/illustrations/home_dashboard_hero.png')
                }
                style={[
                  styles.welcomeIllustration,
                  role === 'Owner' && { width: 75, height: 60, right: 0 },
                  role === 'Coach' && { width: 70, height: 70, right: 0 },
                  role === 'Organizer' && { width: 65, height: 65, right: 0 }
                ]}
                contentFit="contain"
              />
            </View>

            {/* Special Deals & Vouchers (10 High-Converting Designs) */}
            <View style={[styles.section, { paddingHorizontal: 0, marginTop: 10, marginBottom: 4 }]}>
              <ThemedText type="labelSm" style={{ color: theme.textSecondary, paddingHorizontal: Spacing.containerMargin, marginBottom: 8, letterSpacing: 0.5 }}>
                SPECIAL DEALS & VOUCHERS
              </ThemedText>
              <AutoScrollingHorizontalBanners
                cardWidth={310}
                gap={14}
                banners={[
                  BANNER_DESIGNS_10.SALE_50_OFF_TURF(() => router.push('/booking')),
                  BANNER_DESIGNS_10.BIG_SALE_80_OFF(() => router.push('/booking')),
                  BANNER_DESIGNS_10.EXPLORE_YOUR_WORLD(() => router.push('/(tabs)/explore')),
                  BANNER_DESIGNS_10.PRO_CHAMPIONSHIP_DISCOUNT(() => router.push('/(tabs)/tournaments')),
                  BANNER_DESIGNS_10.MIDNIGHT_MADNESS_SLOTS(() => router.push('/booking')),
                  BANNER_DESIGNS_10.GIFT_GAME_VOUCHER(() => router.push('/wallet')),
                  BANNER_DESIGNS_10.COACH_MASTERCLASS_FREE(() => router.push('/(tabs)/coach')),
                  BANNER_DESIGNS_10.STUDENT_YOUTH_PASS(() => router.push('/booking')),
                  BANNER_DESIGNS_10.SUPER_BID_2X_REWARDS(() => router.push('/(tabs)/matches')),
                  BANNER_DESIGNS_10.REFER_EARN_CASH(() => router.push('/wallet')),
                ]}
              />
            </View>

            {role === 'Coach' ? (
              <>
                {/* 1. Coach Analytics - Dual Graphs (Green & Orange) */}
                <View style={styles.section}>
                  <ThemedText type="headlineSm" style={{ marginBottom: Spacing.md }}>
                    Academy Analytics Dashboard
                  </ThemedText>

                  {/* Activity Class Graph (Green) */}
                  <View style={[styles.graphCard, { backgroundColor: theme.surfaceLowest, marginBottom: Spacing.md, padding: 16 }, Shadows.level2]}>
                    {/* Header */}
                    <View style={styles.graphHeader}>
                      <View style={{ flex: 1 }}>
                        <ThemedText type="labelMd" style={{ color: theme.text, fontFamily: 'Sora_700Bold', letterSpacing: 0.5, fontSize: 14 }}>
                          Weekly Coached Hours (Activity Load)
                        </ThemedText>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 8 }}>
                          <ThemedText type="labelSm" style={{ color: '#10b981', fontFamily: 'Sora_800ExtraBold', fontSize: 12 }}>
                            32.5 Hours Total
                          </ThemedText>
                          <View style={{ backgroundColor: '#10b9811F', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                            <ThemedText style={{ color: '#047857', fontSize: 9, fontFamily: 'Sora_700Bold' }}>
                              🔥 Peak: Fri (7.0h)
                            </ThemedText>
                          </View>
                        </View>
                      </View>
                      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#10b9811A', justifyContent: 'center', alignItems: 'center' }}>
                        <Ionicons name="stats-chart" size={18} color="#10b981" />
                      </View>
                    </View>

                    {/* Dotted Guideline & Graph Bars */}
                    <View style={{ position: 'relative', marginTop: 16, marginBottom: 8, height: 115 }}>
                      <View style={{ position: 'absolute', top: 12, left: 0, right: 0, borderWidth: 0.5, borderColor: theme.outlineVariant + '30', borderStyle: 'dashed' }} />
                      <View style={{ position: 'absolute', top: 52, left: 0, right: 0, borderWidth: 0.5, borderColor: theme.outlineVariant + '30', borderStyle: 'dashed' }} />
                      
                      {/* Bars Container */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 115 }}>
                        {[
                          { label: 'Mon', val: 4.5, display: '4.5h', max: 8 },
                          { label: 'Tue', val: 6.0, display: '6.0h', max: 8 },
                          { label: 'Wed', val: 3.5, display: '3.5h', max: 8 },
                          { label: 'Thu', val: 5.5, display: '5.5h', max: 8 },
                          { label: 'Fri', val: 7.0, display: '7.0h', max: 8 },
                          { label: 'Sat', val: 4.0, display: '4.0h', max: 8 },
                          { label: 'Sun', val: 2.0, display: '2.0h', max: 8 },
                        ].map((bar, idx) => {
                          const barPixelHeight = Math.max(16, Math.round((bar.val / bar.max) * 70));
                          const isActive = bar.val >= 6.0;
                          return (
                            <View key={idx} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                              {/* Explicit Value Label on Top of Bar */}
                              <ThemedText style={{ color: isActive ? '#047857' : theme.textSecondary, fontSize: 9, fontFamily: 'Sora_700Bold', marginBottom: 4 }}>
                                {bar.display}
                              </ThemedText>
                              
                              <View style={{ height: barPixelHeight, width: 18, borderRadius: 9, backgroundColor: isActive ? '#10b981' : '#10b98135' }} />
                              
                              <ThemedText type="labelSm" style={{ marginTop: 6, fontSize: 10, color: isActive ? theme.text : theme.textSecondary, fontFamily: isActive ? 'Sora_700Bold' : 'Sora_500Medium' }}>
                                {bar.label}
                              </ThemedText>
                            </View>
                          );
                        })}
                      </View>
                    </View>

                    {/* Summary Footer */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: theme.outlineVariant + '1A' }}>
                      <ThemedText style={{ color: theme.textSecondary, fontSize: 10 }}>
                        Daily Avg: <ThemedText style={{ color: theme.text, fontFamily: 'Sora_700Bold' }}>4.6 hrs/day</ThemedText>
                      </ThemedText>
                      <ThemedText style={{ color: '#047857', fontSize: 10, fontFamily: 'Sora_700Bold' }}>
                        Target Met: 5/7 Days (71%)
                      </ThemedText>
                    </View>
                  </View>

                  {/* High Demand Class Graph (Orange) */}
                  <View style={[styles.graphCard, { backgroundColor: theme.surfaceLowest, padding: 16 }, Shadows.level2]}>
                    {/* Header */}
                    <View style={styles.graphHeader}>
                      <View style={{ flex: 1 }}>
                        <ThemedText type="labelMd" style={{ color: theme.text, fontFamily: 'Sora_700Bold', letterSpacing: 0.5, fontSize: 14 }}>
                          Batch Occupancy Rate (High Demand)
                        </ThemedText>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 8 }}>
                          <ThemedText type="labelSm" style={{ color: '#ff8c00', fontFamily: 'Sora_800ExtraBold', fontSize: 12 }}>
                            Avg. 82% Enrollment
                          </ThemedText>
                          <View style={{ backgroundColor: '#ff8c001F', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                            <ThemedText style={{ color: '#c2410c', fontSize: 9, fontFamily: 'Sora_700Bold' }}>
                              🏆 Top: Weekend (95%)
                            </ThemedText>
                          </View>
                        </View>
                      </View>
                      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#ff8c001A', justifyContent: 'center', alignItems: 'center' }}>
                        <Ionicons name="trending-up" size={18} color="#ff8c00" />
                      </View>
                    </View>

                    {/* Dotted Guideline & Graph Bars */}
                    <View style={{ position: 'relative', marginTop: 16, marginBottom: 8, height: 115 }}>
                      <View style={{ position: 'absolute', top: 12, left: 0, right: 0, borderWidth: 0.5, borderColor: theme.outlineVariant + '30', borderStyle: 'dashed' }} />
                      <View style={{ position: 'absolute', top: 52, left: 0, right: 0, borderWidth: 0.5, borderColor: theme.outlineVariant + '30', borderStyle: 'dashed' }} />

                      {/* Bars Container */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 115 }}>
                        {[
                          { label: 'U-12', fullName: 'Under-12', val: 90, display: '90%', max: 100 },
                          { label: 'U-16', fullName: 'Under-16', val: 85, display: '85%', max: 100 },
                          { label: 'Adults', fullName: 'Adult Batch', val: 65, display: '65%', max: 100 },
                          { label: 'Weekend', fullName: 'Weekend Camp', val: 95, display: '95%', max: 100 },
                          { label: 'Girls', fullName: 'Girls Batch', val: 75, display: '75%', max: 100 },
                        ].map((bar, idx) => {
                          const barPixelHeight = Math.max(16, Math.round((bar.val / bar.max) * 70));
                          const isActive = bar.val >= 85;
                          return (
                            <View key={idx} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                              {/* Explicit Percentage Badge on Top */}
                              <ThemedText style={{ color: isActive ? '#c2410c' : theme.textSecondary, fontSize: 9, fontFamily: 'Sora_800ExtraBold', marginBottom: 4 }}>
                                {bar.display}
                              </ThemedText>
                              
                              <View style={{ height: barPixelHeight, width: 22, borderRadius: 10, backgroundColor: isActive ? '#ff8c00' : '#ff8c0038' }} />
                              
                              <ThemedText type="labelSm" style={{ marginTop: 6, fontSize: 9.5, color: isActive ? theme.text : theme.textSecondary, fontFamily: isActive ? 'Sora_700Bold' : 'Sora_500Medium' }} numberOfLines={1}>
                                {bar.label}
                              </ThemedText>
                            </View>
                          );
                        })}
                      </View>
                    </View>

                    {/* Summary Footer */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: theme.outlineVariant + '1A' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#ff8c00' }} />
                        <ThemedText style={{ color: theme.textSecondary, fontSize: 10 }}>High Demand (≥85%)</ThemedText>
                      </View>
                      <ThemedText style={{ color: '#c2410c', fontSize: 10, fontFamily: 'Sora_700Bold' }}>
                        3 Batches Almost Full!
                      </ThemedText>
                    </View>
                  </View>
                </View>

                {/* 2. Daily Progress Card */}
                <View style={styles.section}>
                  <Pressable
                    style={[styles.dailyPlanCard, { backgroundColor: theme.primaryContainer }, Shadows.level3]}
                    onPress={() => router.push('/coach-students')}
                  >
                    <View style={styles.planInfo}>
                      <ThemedText type="headlineSm" style={{ color: '#ffffff' }}>
                        Academy Schedule
                      </ThemedText>
                      <ThemedText type="bodyMd" style={{ color: 'rgba(255, 255, 255, 0.85)', marginTop: 4 }}>
                        4 of 6 classes completed
                      </ThemedText>
                      <Pressable
                        style={[styles.viewTasksButton, { backgroundColor: '#ffffff' }]}
                        onPress={() => router.push('/coach-students')}
                      >
                        <ThemedText type="labelMd" style={{ color: theme.primary, fontFamily: 'Sora_700Bold' }}>
                          View Students
                        </ThemedText>
                      </Pressable>
                    </View>

                    <View style={[styles.progressRing, { borderColor: 'rgba(255, 255, 255, 0.15)' }]}>
                      {/* Vibrant Emerald Green 67% Fill Arc */}
                      <View style={[styles.progressRingInner, { borderColor: '#4ade80', borderLeftColor: 'transparent', transform: [{ rotate: '45deg' }] }]} />
                      {/* Straight Aligned Text Container */}
                      <View style={{ position: 'absolute', justifyContent: 'center', alignItems: 'center' }}>
                        <ThemedText type="headlineSm" style={{ color: '#4ade80', fontFamily: 'Sora_800ExtraBold', fontSize: 18 }}>
                          67%
                        </ThemedText>
                      </View>
                    </View>
                  </Pressable>
                </View>

                {/* 2. Academy Analytics Section (Premium Presentation with Background Image) */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <ThemedText type="headlineSm">Academy Analytics</ThemedText>
                    <Pressable onPress={() => router.push('/coach-home')}>
                      <ThemedText type="labelMd" style={{ color: theme.secondary, fontFamily: 'Sora_700Bold' }}>
                        View Details
                      </ThemedText>
                    </Pressable>
                  </View>

                  <View style={[styles.analyticsPremiumCard, Shadows.level3]}>
                    {/* Attractive Premium Background Image */}
                    <Image
                      source={require('@/assets/images/illustrations/coaching_class_premium.png')}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                    />
                    
                    {/* Dark Glass Overlay Mask */}
                    <View style={styles.analyticsOverlay} />

                    {/* Interactive 4-Cell Glass Analytics Grid */}
                    <View style={styles.analyticsGrid}>
                      {/* Metric 1: Weekly Hours Coached */}
                      <Pressable
                        style={styles.analyticsGlassCell}
                        onPress={() => router.push('/coach-home')}
                      >
                        <View style={[styles.analyticsIconBg, { backgroundColor: 'rgba(59, 130, 246, 0.25)' }]}>
                          <Ionicons name="time" size={18} color="#60a5fa" />
                        </View>
                        <View style={{ marginLeft: 8, flex: 1 }}>
                          <ThemedText style={styles.analyticsLabel}>Weekly Hours</ThemedText>
                          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 1 }}>
                            <ThemedText style={styles.analyticsValue}>32.5</ThemedText>
                            <ThemedText style={styles.analyticsUnit}> hrs</ThemedText>
                          </View>
                          <View style={styles.trendRow}>
                            <Ionicons name="trending-up" size={10} color="#4ade80" />
                            <ThemedText style={styles.trendText}>+12.4% vs last wk</ThemedText>
                          </View>
                        </View>
                      </Pressable>

                      {/* Metric 2: Active Enrolled Trainees */}
                      <Pressable
                        style={styles.analyticsGlassCell}
                        onPress={() => router.push('/coach-students')}
                      >
                        <View style={[styles.analyticsIconBg, { backgroundColor: 'rgba(34, 197, 94, 0.25)' }]}>
                          <Ionicons name="people" size={18} color="#4ade80" />
                        </View>
                        <View style={{ marginLeft: 8, flex: 1 }}>
                          <ThemedText style={styles.analyticsLabel}>Active Trainees</ThemedText>
                          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 1 }}>
                            <ThemedText style={styles.analyticsValue}>18</ThemedText>
                            <ThemedText style={styles.analyticsUnit}> Students</ThemedText>
                          </View>
                          <View style={styles.trendRow}>
                            <Ionicons name="school" size={10} color="#60a5fa" />
                            <ThemedText style={[styles.trendText, { color: '#93c5fd' }]}>4 Class Batches</ThemedText>
                          </View>
                        </View>
                      </Pressable>

                      {/* Metric 3: Avg Attendance Rate */}
                      <Pressable
                        style={styles.analyticsGlassCell}
                        onPress={() => router.push('/coach-students')}
                      >
                        <View style={[styles.analyticsIconBg, { backgroundColor: 'rgba(245, 158, 11, 0.25)' }]}>
                          <Ionicons name="shield-checkmark" size={18} color="#fbbf24" />
                        </View>
                        <View style={{ marginLeft: 8, flex: 1 }}>
                          <ThemedText style={styles.analyticsLabel}>Avg Attendance</ThemedText>
                          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 1 }}>
                            <ThemedText style={styles.analyticsValue}>94.2%</ThemedText>
                          </View>
                          <View style={styles.trendRow}>
                            <Ionicons name="star" size={10} color="#fbbf24" />
                            <ThemedText style={[styles.trendText, { color: '#fcd34d' }]}>Top Discipline</ThemedText>
                          </View>
                        </View>
                      </Pressable>

                      {/* Metric 4: Monthly Fee Revenue */}
                      <Pressable
                        style={styles.analyticsGlassCell}
                        onPress={() => router.push('/coach-students')}
                      >
                        <View style={[styles.analyticsIconBg, { backgroundColor: 'rgba(168, 85, 247, 0.25)' }]}>
                          <Ionicons name="wallet" size={18} color="#c084fc" />
                        </View>
                        <View style={{ marginLeft: 8, flex: 1 }}>
                          <ThemedText style={styles.analyticsLabel}>Monthly Fee</ThemedText>
                          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 1 }}>
                            <ThemedText style={styles.analyticsValue}>₹48.5K</ThemedText>
                          </View>
                          <View style={styles.trendRow}>
                            <Ionicons name="checkmark-circle" size={10} color="#4ade80" />
                            <ThemedText style={styles.trendText}>88% Collected</ThemedText>
                          </View>
                        </View>
                      </Pressable>
                    </View>
                  </View>
                </View>

                {/* 3. Today's Academy Sessions */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <ThemedText type="headlineSm">{"Today's Academy Sessions"}</ThemedText>
                    <Pressable onPress={() => router.push('/(tabs)/coach')}>
                      <ThemedText type="labelMd" style={{ color: theme.secondary, fontFamily: 'Sora_700Bold' }}>
                        Full Calendar
                      </ThemedText>
                    </Pressable>
                  </View>

                  {classes.length > 0 && (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ paddingBottom: 16, gap: 12 }}
                    >
                      {classes.map((cls, idx) => {
                        const navigateToProfile = () => {
                          router.push({
                            pathname: '/coach/[id]',
                            params: {
                              id: cls.id || `class-${idx}`,
                              name: profile.name || 'Coach',
                              specialty: cls.className,
                              experience: `${cls.classType} • ${cls.ageGroup || 'All Ages'}`,
                              trainees: '18',
                              rating: '5.0',
                              reviews: '1',
                              rate: cls.feeAmount ? `₹${cls.feeAmount}/${cls.feeType === 'Per Session' ? 'sess' : 'mo'}` : 'Free',
                              location: cls.venue,
                              match: 'Your Class',
                              sports: [cls.sportType.toLowerCase()].join(','),
                              avatar: typeof profile.avatarUrl === 'string' ? profile.avatarUrl : 'avatar_1',
                              badge: 'OWNER',
                            }
                          });
                        };

                        const watermarkSource = getSportIllustration(cls.sportType);

                        return (
                          <Pressable
                            key={cls.id || idx}
                            style={[styles.advertisementCard, { backgroundColor: '#f5f6ff', borderColor: theme.outlineVariant + '33', width: 220, overflow: 'hidden' }]}
                            onPress={navigateToProfile}
                          >
                            {/* Subtle watermark vector illustration */}
                            <Image
                              source={watermarkSource}
                              style={{ position: 'absolute', right: -10, bottom: -10, width: 90, height: 90, opacity: 0.12 }}
                              contentFit="contain"
                            />
                            {/* Banner Top Accent */}
                            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: theme.primary, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl }} />

                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                              <Image
                                source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }}
                                style={{ width: 44, height: 44, borderRadius: BorderRadius.full }}
                              />
                              <View style={{ flex: 1, marginLeft: 10 }}>
                                <ThemedText style={{ color: theme.primary, fontFamily: 'Sora_800ExtraBold', fontSize: 10, letterSpacing: 0.5 }}>COACHING CLASS</ThemedText>
                                <ThemedText style={{ color: theme.textSecondary, fontSize: 11, marginTop: 1 }}>{cls.classType} · {cls.sportType.toUpperCase()}</ThemedText>
                              </View>
                            </View>

                            <ThemedText type="title" style={{ color: theme.text, fontFamily: 'Sora_700Bold', fontSize: 15, lineHeight: 20 }} numberOfLines={1}>
                              {cls.className}
                            </ThemedText>

                            <ThemedText type="bodyMd" style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4 }} numberOfLines={1}>
                              Session Duration · {cls.sessionDuration}
                            </ThemedText>

                            {/* Certificate Accreditation */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                              <Ionicons name="ribbon-outline" size={12} color="#10b981" style={{ marginRight: 4 }} />
                              <ThemedText style={{ color: '#10b981', fontSize: 10, fontFamily: 'Sora_700Bold' }} numberOfLines={1}>
                                {cls.certificateName || (cls.certificates && cls.certificates.length > 0 ? cls.certificates[0] : 'BWF Level 2 Certified Coach')}
                              </ThemedText>
                            </View>

                            <View style={{ borderTopWidth: 1, borderTopColor: theme.outlineVariant + '1a', marginTop: 10, paddingTop: 10 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                                <Ionicons name="location-outline" size={13} color={theme.textSecondary} style={{ marginRight: 4 }} />
                                <ThemedText style={{ color: theme.textSecondary, fontSize: 11 }} numberOfLines={1}>{cls.venue}</ThemedText>
                              </View>
                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="time-outline" size={13} color={theme.textSecondary} style={{ marginRight: 4 }} />
                                <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_700Bold', color: theme.text }}>
                                  {cls.sessionTime}
                                </ThemedText>
                              </View>
                            </View>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  )}

                  <View style={{ gap: 12 }} />
                </View>

                {/* 6. Premium Action Cards (Create Class & My Availability) */}
                <View style={styles.section}>
                  <View style={styles.actionCardsRow}>
                    
                    {/* 1. Create Class (Academy Batch Creator Card) */}
                    <Pressable
                      style={[
                        styles.actionCard, 
                        { 
                          borderRadius: 12, 
                          position: 'relative', 
                          overflow: 'hidden', 
                          minHeight: 190, 
                          padding: 14, 
                          borderWidth: 1, 
                          borderColor: 'rgba(255, 255, 255, 0.2)' 
                        }, 
                        Shadows.level3
                      ]}
                      onPress={() => router.push('/create-class')}
                    >
                      {/* Premium Background Illustration Image */}
                      <Image
                        source={require('@/assets/images/illustrations/coaching_class_premium.png')}
                        style={StyleSheet.absoluteFill}
                        contentFit="cover"
                      />
                      {/* Dark Indigo Overlay Mask */}
                      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(30, 27, 75, 0.86)' }]} />

                      <View style={{ zIndex: 2, flex: 1, justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(99, 102, 241, 0.35)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(165, 180, 252, 0.4)' }}>
                            <Ionicons name="add-circle" size={20} color="#a5b4fc" />
                          </View>
                          <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' }}>
                            <ThemedText style={{ color: '#ffffff', fontSize: 8.5, fontFamily: 'Sora_800ExtraBold', letterSpacing: 0.6 }}>
                              BATCH CREATOR
                            </ThemedText>
                          </View>
                        </View>

                        <View style={{ marginVertical: 8 }}>
                          <ThemedText type="headlineSm" style={{ color: '#ffffff', fontFamily: 'Sora_800ExtraBold', fontSize: 16, marginBottom: 2 }}>
                            Create Class
                          </ThemedText>
                          <ThemedText style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 10.5, lineHeight: 14 }}>
                            Schedule direct coaching batches, student limits & fee plans.
                          </ThemedText>
                        </View>

                        <Pressable
                          onPress={() => router.push('/create-class')}
                          style={{
                            backgroundColor: '#ffffff',
                            paddingHorizontal: 12,
                            paddingVertical: 7,
                            borderRadius: BorderRadius.full,
                            alignSelf: 'flex-start',
                            flexDirection: 'row',
                            alignItems: 'center',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.15,
                            shadowRadius: 4,
                            elevation: 3,
                          }}
                        >
                          <ThemedText style={{ color: '#4338ca', fontSize: 11, fontFamily: 'Sora_800ExtraBold', marginRight: 4 }}>
                            + Add Class
                          </ThemedText>
                          <Ionicons name="arrow-forward" size={12} color="#4338ca" />
                        </Pressable>
                      </View>
                    </Pressable>

                    {/* 2. My Availability (Slot Management Card) */}
                    <Pressable
                      style={[
                        styles.actionCard, 
                        { 
                          borderRadius: 12, 
                          position: 'relative', 
                          overflow: 'hidden', 
                          minHeight: 190, 
                          padding: 14, 
                          borderWidth: 1, 
                          borderColor: 'rgba(255, 255, 255, 0.2)' 
                        }, 
                        Shadows.level3
                      ]}
                      onPress={() => router.push('/(tabs)/coach')}
                    >
                      {/* Premium Background Illustration Image */}
                      <Image
                        source={require('@/assets/images/illustrations/booking_hero.png')}
                        style={StyleSheet.absoluteFill}
                        contentFit="cover"
                      />
                      {/* Dark Amber/Slate Overlay Mask */}
                      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(15, 23, 42, 0.86)' }]} />

                      <View style={{ zIndex: 2, flex: 1, justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(245, 158, 11, 0.35)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(252, 211, 77, 0.4)' }}>
                            <Ionicons name="time" size={20} color="#fcd34d" />
                          </View>
                          <View style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: 'rgba(251, 191, 36, 0.3)' }}>
                            <ThemedText style={{ color: '#fbbf24', fontSize: 8.5, fontFamily: 'Sora_800ExtraBold', letterSpacing: 0.6 }}>
                              COACH SLOTS
                            </ThemedText>
                          </View>
                        </View>

                        <View style={{ marginVertical: 8 }}>
                          <ThemedText type="headlineSm" style={{ color: '#ffffff', fontFamily: 'Sora_800ExtraBold', fontSize: 16, marginBottom: 2 }}>
                            My Availability
                          </ThemedText>
                          <ThemedText style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 10.5, lineHeight: 14 }}>
                            Manage your weekly open slots & instant student bookings.
                          </ThemedText>
                        </View>

                        <Pressable
                          onPress={() => router.push('/(tabs)/coach')}
                          style={{
                            backgroundColor: '#f59e0b',
                            paddingHorizontal: 12,
                            paddingVertical: 7,
                            borderRadius: BorderRadius.full,
                            alignSelf: 'flex-start',
                            flexDirection: 'row',
                            alignItems: 'center',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.15,
                            shadowRadius: 4,
                            elevation: 3,
                          }}
                        >
                          <ThemedText style={{ color: '#ffffff', fontSize: 11, fontFamily: 'Sora_800ExtraBold', marginRight: 4 }}>
                            Set Slots
                          </ThemedText>
                          <Ionicons name="arrow-forward" size={12} color="#ffffff" />
                        </Pressable>
                      </View>
                    </Pressable>

                  </View>
                </View>

                {/* 7. Tournament Announcements Banner Carousel */}
                <View style={[styles.section, { paddingHorizontal: 0 }]}>
                  <ThemedText type="labelSm" style={{ color: theme.textSecondary, paddingHorizontal: Spacing.containerMargin, marginBottom: 8, letterSpacing: 0.5 }}>
                    TOURNAMENT ANNOUNCEMENTS
                  </ThemedText>
                  <AutoScrollingHorizontalBanners
                    cardWidth={310}
                    gap={16}
                    banners={[
                      {
                        title: "Grand Summer Tournament!",
                        subtitle: "Register your Team, compete in the League and win ₹50,000 + kit gifts!",
                        buttonText: "Register Team",
                        isGradient: true,
                        gradientColors: ['rgba(99, 102, 241, 0.7)', 'rgba(168, 85, 247, 0.9)'],
                        titleColor: "#ffffff",
                        subtitleColor: "rgba(255, 255, 255, 0.95)",
                        buttonBackgroundColor: "#ffffff",
                        buttonTextColor: "#4f46e5",
                        backgroundImage: require("@/assets/images/illustrations/summer_tournament_banner_bg.png"),
                        onPress: () => router.push('/(tabs)/tournaments'),
                      },
                      {
                        title: "Weekend Champions League!",
                        subtitle: "20% Discount on Team Registrations this weekend. Limited slots!",
                        buttonText: "Join Tournament",
                        isGradient: true,
                        gradientColors: ['rgba(245, 158, 11, 0.75)', 'rgba(217, 119, 6, 0.95)'],
                        titleColor: "#ffffff",
                        subtitleColor: "rgba(255, 255, 255, 0.95)",
                        buttonBackgroundColor: "#ffffff",
                        buttonTextColor: "#d97706",
                        backgroundImage: require("@/assets/images/illustrations/tournament_hero.png"),
                        onPress: () => router.push('/(tabs)/tournaments'),
                      },
                      {
                        title: "Night Knockout Super Cup!",
                        subtitle: "Under-the-lights tournament series with trophy & cash prize rewards!",
                        buttonText: "Compete Now",
                        isGradient: true,
                        gradientColors: ['rgba(16, 185, 129, 0.75)', 'rgba(5, 150, 105, 0.95)'],
                        titleColor: "#ffffff",
                        subtitleColor: "rgba(255, 255, 255, 0.95)",
                        buttonBackgroundColor: "#ffffff",
                        buttonTextColor: "#059669",
                        backgroundImage: require("@/assets/images/illustrations/tournament_cover.png"),
                        onPress: () => router.push('/(tabs)/tournaments'),
                      }
                    ]}
                  />
                </View>
              </>
            ) : role === 'Owner' ? (
              <>
                {/* 1. Weekly Revenue Trend Graph (Bar Graph) - Interactive with Bar Values & Hover/Press Details */}
                <View style={styles.section}>
                  <View style={[styles.graphCard, { backgroundColor: theme.surfaceLowest, padding: 16, borderRadius: 12 }, Shadows.level2]}>
                    <View style={styles.graphHeader}>
                      <View style={{ flex: 1 }}>
                        <ThemedText type="labelMd" style={{ color: theme.text, fontFamily: 'Sora_700Bold', letterSpacing: 0.5, fontSize: 13.5 }}>
                          Weekly Revenue Trend (₹)
                        </ThemedText>
                        <ThemedText style={{ color: '#10b981', fontSize: 10, fontFamily: 'Sora_700Bold', marginTop: 2 }}>
                          Total: ₹1,35,000 · +18.4% vs Last Week
                        </ThemedText>
                      </View>
                      <Ionicons name="stats-chart" size={18} color={theme.primary} />
                    </View>

                    {/* Interactive Bar Chart with Values Above Bars */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 110, marginTop: 14, marginBottom: 8 }}>
                      {[
                        { day: 'M', fullDay: 'Monday', revenue: '₹12,000', label: '12k', height: 45, bookings: '5 Turf Bookings + 2 Coaching Sessions', peak: '5:00 PM - 7:00 PM' },
                        { day: 'T', fullDay: 'Tuesday', revenue: '₹15,000', label: '15k', height: 55, bookings: '7 Turf Bookings + 3 Coaching Sessions', peak: '6:00 PM - 8:00 PM' },
                        { day: 'W', fullDay: 'Wednesday', revenue: '₹8,500', label: '8.5k', height: 35, bookings: '4 Turf Bookings + 1 Coaching Session', peak: '7:00 PM - 8:00 PM' },
                        { day: 'T', fullDay: 'Thursday', revenue: '₹24,000', label: '24k', height: 80, bookings: '10 Turf Bookings + 3 Coaching Sessions', peak: '6:00 PM - 9:00 PM' },
                        { day: 'F', fullDay: 'Friday', revenue: '₹28,000', label: '28k', height: 95, bookings: '12 Turf Bookings + 4 Coaching Sessions', peak: '5:00 PM - 10:00 PM' },
                        { day: 'S', fullDay: 'Saturday', revenue: '₹22,500', label: '22.5k', height: 82, bookings: '11 Turf Bookings + 2 Coaching Sessions', peak: '4:00 PM - 9:00 PM' },
                        { day: 'S', fullDay: 'Sunday', revenue: '₹18,000', label: '18k', height: 68, bookings: '9 Turf Bookings + 2 Coaching Sessions', peak: '3:00 PM - 8:00 PM' },
                      ].map((bar, idx) => {
                        const isSelected = selectedBar?.fullDay === bar.fullDay;
                        return (
                          <Pressable
                            key={idx}
                            onPress={() => setSelectedBar(bar)}
                            style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}
                          >
                            <ThemedText style={{ color: isSelected ? theme.primary : theme.textSecondary, fontSize: 8.5, fontFamily: 'Sora_800ExtraBold', marginBottom: 3 }}>
                              {bar.label}
                            </ThemedText>
                            <View
                              style={{
                                height: bar.height,
                                width: 18,
                                borderRadius: 9,
                                backgroundColor: isSelected ? theme.primary : (bar.height > 75 ? theme.secondaryContainer : theme.primary + '25'),
                                borderWidth: isSelected ? 1.5 : 0,
                                borderColor: theme.primary,
                              }}
                            />
                            <ThemedText style={{ marginTop: 4, fontSize: 9.5, color: isSelected ? theme.primary : theme.textSecondary, fontFamily: isSelected ? 'Sora_800ExtraBold' : 'Sora_600SemiBold' }}>
                              {bar.day}
                            </ThemedText>
                          </Pressable>
                        );
                      })}
                    </View>

                    {/* Selected Bar Detail Tooltip Box */}
                    {selectedBar && (
                      <View style={{ backgroundColor: theme.surfaceHigh + '90', padding: 10, borderRadius: 10, marginTop: 6, borderLeftWidth: 3, borderLeftColor: theme.primary }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_700Bold', color: theme.text }}>
                            {selectedBar.fullDay}: <ThemedText style={{ color: theme.primary, fontFamily: 'Sora_800ExtraBold' }}>{selectedBar.revenue}</ThemedText>
                          </ThemedText>
                          <ThemedText style={{ fontSize: 9, color: theme.textSecondary, fontFamily: 'Sora_700Bold' }}>
                            🔥 Peak: {selectedBar.peak}
                          </ThemedText>
                        </View>
                        <ThemedText style={{ fontSize: 9.5, color: theme.textSecondary, fontFamily: 'Sora_500Medium', marginTop: 2 }}>
                          📊 {selectedBar.bookings}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                </View>

                {/* 2. Calendar View Turf Booking Graph (Heatmap) - Interactive with Hover/Press Details */}
                <View style={styles.section}>
                  <View style={[styles.graphCard, { backgroundColor: theme.surfaceLowest, padding: 16, borderRadius: 12 }, Shadows.level2]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <View style={{ flex: 1 }}>
                        <ThemedText type="labelMd" style={{ color: theme.text, fontFamily: 'Sora_700Bold', letterSpacing: 0.5, fontSize: 13.5 }}>
                          Monthly Booking Heatmap (Calendar View)
                        </ThemedText>
                        <ThemedText style={{ color: '#10b981', fontSize: 10, fontFamily: 'Sora_700Bold', marginTop: 2 }}>
                          82% Average Daily Occupancy · 384 Total Bookings
                        </ThemedText>
                      </View>
                      <Ionicons name="calendar-outline" size={18} color={theme.secondary} />
                    </View>

                    {/* Selected Heatmap Day Details Box */}
                    {selectedHeatmapDay && (
                      <View style={{ backgroundColor: theme.surfaceHigh + '90', padding: 10, borderRadius: 10, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: selectedHeatmapDay.level === 'Peak' ? '#ef4444' : selectedHeatmapDay.level === 'Medium' ? '#f59e0b' : '#94a3b8' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_700Bold', color: theme.text }}>
                            {selectedHeatmapDay.label}
                          </ThemedText>
                          <View style={{ backgroundColor: selectedHeatmapDay.level === 'Peak' ? '#ef444420' : selectedHeatmapDay.level === 'Medium' ? '#f59e0b20' : '#94a3b820', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                            <ThemedText style={{ fontSize: 8.5, fontFamily: 'Sora_800ExtraBold', color: selectedHeatmapDay.level === 'Peak' ? '#ef4444' : selectedHeatmapDay.level === 'Medium' ? '#d97706' : '#64748b' }}>
                              {selectedHeatmapDay.occupancy} {selectedHeatmapDay.level}
                            </ThemedText>
                          </View>
                        </View>
                        <ThemedText style={{ fontSize: 9.5, color: theme.textSecondary, fontFamily: 'Sora_500Medium', marginTop: 3 }}>
                          📅 {selectedHeatmapDay.bookings} · 💰 {selectedHeatmapDay.revenue}
                        </ThemedText>
                      </View>
                    )}

                    {/* Calendar Grid Header (Strict 7 equal columns) */}
                    <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                        <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                          <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_700Bold', color: theme.textSecondary }}>
                            {d}
                          </ThemedText>
                        </View>
                      ))}
                    </View>

                    {/* Grid Weeks (Strict 7 columns per row, aligned directly under headers) */}
                    {CALENDAR_WEEKS.map((week, wIdx) => (
                      <View key={wIdx} style={{ flexDirection: 'row', gap: 6, marginBottom: 6 }}>
                        {week.map((dayNum, dIdx) => {
                          const isPeak = [1, 4, 5, 8, 10, 11, 14, 15, 17, 18, 21, 22, 24, 25, 28].includes(dayNum);
                          const isMed = [2, 6, 9, 12, 16, 20, 23, 26].includes(dayNum);
                          const level = isPeak ? 'Peak' : isMed ? 'Medium' : 'Low';
                          const bgColor = isPeak ? '#ef4444' : isMed ? '#f59e0b' : theme.surfaceHigh;
                          const textColor = isPeak || isMed ? '#ffffff' : theme.textSecondary;
                          const isSelected = selectedHeatmapDay?.day === dayNum;
                          const dayName = CALENDAR_DAY_NAMES[dIdx];

                          return (
                            <View key={dayNum} style={{ flex: 1, alignItems: 'center' }}>
                              <Pressable
                                onPress={() => setSelectedHeatmapDay({
                                  day: dayNum,
                                  label: `${dayName}, Day ${dayNum}`,
                                  occupancy: isPeak ? '94%' : isMed ? '72%' : '45%',
                                  bookings: isPeak ? '16 Slots Booked (1 Free Slot)' : isMed ? '12 Slots Booked (5 Free)' : '7 Slots Booked (10 Free)',
                                  revenue: isPeak ? '₹36,500' : isMed ? '₹24,000' : '₹14,000',
                                  level,
                                })}
                                style={{
                                  width: '100%',
                                  maxWidth: 42,
                                  height: 38,
                                  borderRadius: 8,
                                  backgroundColor: bgColor,
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  borderWidth: isSelected ? 2.5 : 0,
                                  borderColor: isSelected ? theme.text : 'transparent',
                                }}
                              >
                                <ThemedText style={{ color: textColor, fontSize: 11, fontFamily: 'Sora_700Bold' }}>
                                  {dayNum}
                                </ThemedText>
                              </Pressable>
                            </View>
                          );
                        })}
                      </View>
                    ))}

                    {/* Legend Footer */}
                    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 14, marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.outlineVariant + '1A' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: theme.surfaceHigh }} />
                        <ThemedText style={{ fontSize: 9.5, color: theme.textSecondary }}>Low (45%)</ThemedText>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#f59e0b' }} />
                        <ThemedText style={{ fontSize: 9.5, color: theme.textSecondary }}>Medium (72%)</ThemedText>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#ef4444' }} />
                        <ThemedText style={{ fontSize: 9.5, color: theme.textSecondary }}>Peak (94%)</ThemedText>
                      </View>
                    </View>
                  </View>
                </View>

                {/* 3. Today's Occupancy Progress Card */}
                <View style={styles.section}>
                  <View style={[styles.dailyPlanCard, { backgroundColor: theme.primaryContainer }, Shadows.level3]}>
                    <View style={styles.planInfo}>
                      <ThemedText type="headlineSm" style={{ color: '#ffffff' }}>
                        {"Today's Occupancy"}
                      </ThemedText>
                      <ThemedText type="bodyMd" style={{ color: 'rgba(255, 255, 255, 0.85)', marginTop: 4 }}>
                        8 of 12 slots booked
                      </ThemedText>
                      <Pressable style={[styles.viewTasksButton, { backgroundColor: '#ffffff' }]}>
                        <ThemedText type="labelMd" style={{ color: theme.primary, fontFamily: 'Sora_700Bold' }}>
                          View Queue
                        </ThemedText>
                      </Pressable>
                    </View>

                    <View style={[styles.progressRing, { borderColor: 'rgba(255, 255, 255, 0.15)' }]}>
                      <View style={[styles.progressRingInner, { borderColor: '#ffffff' }]}>
                        <ThemedText type="headlineSm" style={{ color: '#ffffff', fontFamily: 'Sora_700Bold' }}>
                          67%
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                </View>

                {/* 4. Business Analytics Bento Grid - Enhanced with background graphics & extra details */}
                <View style={styles.section}>
                  <ThemedText type="headlineSm" style={{ marginBottom: Spacing.md }}>
                    Business Analytics
                  </ThemedText>
                  <View style={styles.bentoRow}>
                    {/* Revenue Card */}
                    <View style={[{ flex: 1, borderRadius: 12, padding: 14, minHeight: 145, justifyContent: 'space-between', backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', borderWidth: 1, position: 'relative', overflow: 'hidden' }, Shadows.level2]}>
                      {/* Background Illustration Overlay */}
                      <Image
                        source={require('@/assets/images/illustrations/business_analytics_revenue_bg.png')}
                        style={{ position: 'absolute', right: -12, bottom: -12, width: 115, height: 115, opacity: 0.18 }}
                        contentFit="contain"
                      />

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
                        <View style={[styles.bentoIconWrap, { backgroundColor: theme.surface }]}>
                          <Ionicons name="cash-outline" size={18} color={theme.primary} />
                        </View>
                        <ThemedText style={{ color: '#10b981', fontSize: 10, fontFamily: 'Sora_800ExtraBold' }}>
                          +15% vs Wk
                        </ThemedText>
                      </View>

                      <View style={{ zIndex: 2, marginTop: 10 }}>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary, letterSpacing: 0.5, fontSize: 10 }}>
                          {"Today's Revenue"}
                        </ThemedText>
                        <ThemedText type="headlineSm" style={{ marginTop: 2, fontSize: 16, fontFamily: 'Sora_800ExtraBold' }}>
                          ₹18,500
                        </ThemedText>
                      </View>

                      <View style={{ borderTopWidth: 1, borderTopColor: theme.outlineVariant + '20', paddingTop: 6, marginTop: 6, zIndex: 2 }}>
                        <ThemedText style={{ fontSize: 9, color: theme.textSecondary, fontFamily: 'Sora_600SemiBold' }}>
                          8 Slots Completed · Avg ₹2.3k/slot
                        </ThemedText>
                        <ThemedText style={{ fontSize: 8.5, color: '#10b981', fontFamily: 'Sora_700Bold', marginTop: 2 }}>
                          🔥 Peak Demand: 6 - 9 PM
                        </ThemedText>
                      </View>
                    </View>

                    {/* Pending Payments Card */}
                    <View style={[{ flex: 1, borderRadius: 12, padding: 14, minHeight: 145, justifyContent: 'space-between', backgroundColor: theme.primaryContainer, position: 'relative', overflow: 'hidden' }, Shadows.level3]}>
                      {/* Background Illustration Overlay */}
                      <Image
                        source={require('@/assets/images/illustrations/business_analytics_dues_bg.png')}
                        style={{ position: 'absolute', right: -12, bottom: -12, width: 115, height: 115, opacity: 0.22 }}
                        contentFit="contain"
                      />

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
                        <View style={[styles.bentoIconWrap, { backgroundColor: 'rgba(255, 255, 255, 0.18)' }]}>
                          <Ionicons name="wallet-outline" size={18} color="#ffffff" />
                        </View>
                        <ThemedText style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 9.5, fontFamily: 'Sora_700Bold' }}>
                          3 Pending
                        </ThemedText>
                      </View>

                      <View style={{ zIndex: 2, marginTop: 10 }}>
                        <ThemedText type="labelSm" style={{ color: 'rgba(255, 255, 255, 0.85)', letterSpacing: 0.5, fontSize: 10 }}>
                          Unpaid Dues
                        </ThemedText>
                        <ThemedText type="headlineSm" style={{ color: '#ffffff', marginTop: 2, fontSize: 16, fontFamily: 'Sora_800ExtraBold' }}>
                          ₹2,400
                        </ThemedText>
                      </View>

                      <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.15)', paddingTop: 6, marginTop: 6, zIndex: 2 }}>
                        <ThemedText style={{ fontSize: 9, color: 'rgba(255, 255, 255, 0.85)', fontFamily: 'Sora_600SemiBold' }}>
                          Overdue: ₹1,400 (2 Reminders Sent)
                        </ThemedText>
                        <ThemedText style={{ fontSize: 8.5, color: '#fbbf24', fontFamily: 'Sora_700Bold', marginTop: 2 }}>
                          ⚡ Action Required
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                </View>

                {/* 5. Facility status: Pitches (Temporarily Hidden) */}
                {/* <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <ThemedText type="headlineSm">Facility status: Pitches</ThemedText>
                    <Pressable>
                      <ThemedText type="labelMd" style={{ color: theme.secondary, fontFamily: 'Sora_700Bold' }}>
                        Edit Pitches
                      </ThemedText>
                    </Pressable>
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.featuredTurfsScroll}
                  >
                    {[
                      {
                        id: 'pitch-1',
                        name: 'Main Football Arena',
                        status: 'BOOKED',
                        statusColor: '#ff8c00',
                        time: '17:00 - 18:00',
                        image: require('@/assets/images/sports/sport_football.png'),
                        desc: '5G Rubber Infill Turf'
                      },
                      {
                        id: 'pitch-2',
                        name: 'Cricket Pitch Nets',
                        status: 'AVAILABLE',
                        statusColor: '#10b981',
                        time: 'Free to book',
                        image: require('@/assets/images/sports/sport_cricket.png'),
                        desc: 'AstroTurf wicket nets'
                      },
                      {
                        id: 'pitch-3',
                        name: 'Indoor Badminton Court',
                        status: 'MAINTENANCE',
                        statusColor: '#ef4444',
                        time: 'Unavailable today',
                        image: require('@/assets/images/sports/sport_all.png'),
                        desc: 'Polished teakwood court'
                      }
                    ].map((pitch) => (
                      <View
                        key={pitch.id}
                        style={[styles.featuredTurfCard, { backgroundColor: theme.surfaceLowest }, Shadows.level2]}
                      >
                        <Image source={typeof pitch.image === 'string' ? { uri: pitch.image } : pitch.image} style={styles.featuredTurfImage} contentFit="cover" />
                        <View style={styles.featuredTurfContent}>
                          <View style={styles.featuredTurfHeader}>
                            <ThemedText type="labelSm" style={{ color: theme.secondary, fontWeight: '700', fontSize: 9 }} numberOfLines={1}>
                              {pitch.desc.toUpperCase()}
                            </ThemedText>
                          </View>
                          <ThemedText type="headlineSm" style={[styles.featuredTurfTitle, { color: theme.text }]} numberOfLines={1}>
                            {pitch.name}
                          </ThemedText>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 8 }}>
                            <Ionicons name="time-outline" size={10} color={theme.textSecondary} />
                            <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginLeft: 2, fontSize: 10 }} numberOfLines={1}>
                              {pitch.time}
                            </ThemedText>
                          </View>
                          <View style={styles.featuredTurfFooter}>
                            <View style={{ backgroundColor: pitch.statusColor + '15', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                              <ThemedText type="labelSm" style={{ color: pitch.statusColor, fontSize: 9, fontFamily: 'Sora_800ExtraBold' }}>
                                {pitch.status}
                              </ThemedText>

                {/* 6. Today's Turf Bookings Timeline - Spacable Content & Extra Details */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <ThemedText type="headlineSm" style={{ fontSize: 14 }}>{"Today's Turf Bookings"}</ThemedText>
                    <Pressable>
                      <ThemedText type="labelMd" style={{ color: theme.secondary, fontFamily: 'Sora_700Bold', fontSize: 10.5 }}>
                        Full Schedule
                      </ThemedText>
                    </Pressable>
                  </View>

                  <View style={{ gap: 12 }}>
                    {/* Booking 1: Live & Fully Paid */}
                    <View style={[{ flexDirection: 'row', alignItems: 'flex-start', padding: 14, borderRadius: 10, backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '25', borderWidth: 1 }, Shadows.level2]}>
                      <View style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: theme.primaryContainer + '20', justifyContent: 'center', alignItems: 'center', marginTop: 2 }}>
                        <Ionicons name="football" size={17} color={theme.primary} />
                      </View>

                      <View style={{ flex: 1, marginHorizontal: 8, gap: 4 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <ThemedText type="headlineSm" style={{ fontSize: 12, fontFamily: 'Sora_700Bold', color: theme.text, flex: 1, marginRight: 6 }} numberOfLines={1}>
                            Footy Club Match Booking
                          </ThemedText>
                          <ThemedText style={{ fontSize: 8, fontFamily: 'Sora_700Bold', color: theme.textSecondary }}>#B902</ThemedText>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name="time-outline" size={10} color={theme.textSecondary} style={{ marginRight: 3 }} />
                          <ThemedText type="bodySm" style={{ color: theme.textSecondary, fontSize: 9.5 }}>
                            17:00 - 18:30 • Pitch A (90 mins)
                          </ThemedText>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name="person-outline" size={10} color={theme.textSecondary} style={{ marginRight: 3 }} />
                          <ThemedText style={{ color: theme.textSecondary, fontSize: 9, fontFamily: 'Sora_500Medium' }}>
                            Booked by: Alex Turner (UPI Paid)
                          </ThemedText>
                        </View>

                        {/* Payment Breakdown Row */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 5, marginTop: 3, paddingTop: 4, borderTopWidth: 1, borderTopColor: theme.outlineVariant + '15' }}>
                          <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_800ExtraBold', color: theme.text }}>
                            ₹2,500
                          </ThemedText>
                          <ThemedText style={{ color: '#10b981', fontSize: 8.5, fontFamily: 'Sora_800ExtraBold' }}>
                            Fully Paid
                          </ThemedText>
                          <ThemedText style={{ color: theme.textSecondary, fontSize: 8.5, fontFamily: 'Sora_500Medium' }}>
                            · Last Paid: ₹2,500 (Online)
                          </ThemedText>
                        </View>
                      </View>

                      <ThemedText style={{ fontSize: 8, fontFamily: 'Sora_800ExtraBold', color: '#ef4444', letterSpacing: 0.5, alignSelf: 'flex-start' }}>LIVE</ThemedText>
                    </View>

                    {/* Booking 2: Partially Paid (Advance) */}
                    <View style={[{ flexDirection: 'row', alignItems: 'flex-start', padding: 14, borderRadius: 10, backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '25', borderWidth: 1 }, Shadows.level2]}>
                      <View style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: '#f59e0b20', justifyContent: 'center', alignItems: 'center', marginTop: 2 }}>
                        <MaterialCommunityIcons name="cricket" size={17} color="#d97706" />
                      </View>

                      <View style={{ flex: 1, marginHorizontal: 8, gap: 4 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <ThemedText type="headlineSm" style={{ fontSize: 12, fontFamily: 'Sora_700Bold', color: theme.text, flex: 1, marginRight: 6 }} numberOfLines={1}>
                            Corporate Cricket Match
                          </ThemedText>
                          <ThemedText style={{ fontSize: 8, fontFamily: 'Sora_700Bold', color: theme.textSecondary }}>#B211</ThemedText>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name="time-outline" size={10} color={theme.textSecondary} style={{ marginRight: 3 }} />
                          <ThemedText type="bodySm" style={{ color: theme.textSecondary, fontSize: 9.5 }}>
                            19:00 - 21:00 • Pitch B (120 mins)
                          </ThemedText>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name="person-outline" size={10} color={theme.textSecondary} style={{ marginRight: 3 }} />
                          <ThemedText style={{ color: theme.textSecondary, fontSize: 9, fontFamily: 'Sora_500Medium' }}>
                            Booked by: Suresh Raina (Partial Advance)
                          </ThemedText>
                        </View>

                        {/* Payment Breakdown Row */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 5, marginTop: 3, paddingTop: 4, borderTopWidth: 1, borderTopColor: theme.outlineVariant + '15' }}>
                          <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_800ExtraBold', color: theme.text }}>
                            ₹3,600
                          </ThemedText>
                          <ThemedText style={{ color: '#d97706', fontSize: 8.5, fontFamily: 'Sora_800ExtraBold' }}>
                            Advance Paid (₹1,000)
                          </ThemedText>
                          <ThemedText style={{ color: '#ef4444', fontSize: 8.5, fontFamily: 'Sora_800ExtraBold' }}>
                            · ₹2,600 Due at Turf
                          </ThemedText>
                        </View>
                      </View>

                      <ThemedText style={{ fontSize: 8, fontFamily: 'Sora_800ExtraBold', color: '#f59e0b', letterSpacing: 0.5, alignSelf: 'flex-start' }}>UPCOMING</ThemedText>
                    </View>
                  </View>
                </View>

                {/* 7. Action Cards - Clean text badges without chip box design */}
                <View style={styles.section}>
                  <View style={styles.actionCardsRow}>
                    {/* Create Slot Card */}
                    <Pressable
                      onPress={() => router.push('/create-turf')}
                      style={({ pressed }) => [
                        { flex: 1, borderRadius: 12, overflow: 'hidden' },
                        Shadows.level3,
                        pressed && { opacity: 0.95, transform: [{ scale: 0.98 }] },
                      ]}
                    >
                      <LinearGradient
                        colors={['#3c397b', '#252150']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ padding: 14, height: 190, justifyContent: 'space-between', position: 'relative' }}
                      >
                        {/* New Generated Background Illustration */}
                        <Image
                          source={require('@/assets/images/illustrations/create_slot_card_bg.png')}
                          style={{ position: 'absolute', right: -15, bottom: -15, width: 135, height: 135, opacity: 0.35, borderRadius: 20 }}
                          contentFit="contain"
                        />

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
                          <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center' }}>
                            <Ionicons name="add" size={18} color="#ffffff" />
                          </View>
                          <ThemedText style={{ color: 'rgba(255, 255, 255, 0.9)', fontFamily: 'Sora_800ExtraBold', fontSize: 8.5, letterSpacing: 0.5 }}>
                            SLOT CREATOR
                          </ThemedText>
                        </View>

                        <View style={{ marginVertical: 4, zIndex: 2 }}>
                          <ThemedText style={{ color: '#ffffff', fontSize: 15, fontFamily: 'Sora_800ExtraBold', lineHeight: 19 }}>
                            Create Slot
                          </ThemedText>
                          <ThemedText style={{ color: 'rgba(255, 255, 255, 0.88)', fontSize: 9.5, fontFamily: 'Sora_500Medium', marginTop: 3, lineHeight: 13.5 }}>
                            Manually open peak timing slots for booking reservations.
                          </ThemedText>
                        </View>

                        <View style={{ alignSelf: 'flex-start', backgroundColor: '#ffffff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, zIndex: 2 }}>
                          <ThemedText style={{ color: '#3c397b', fontFamily: 'Sora_800ExtraBold', fontSize: 9.5 }}>
                            + Add Slot →
                          </ThemedText>
                        </View>
                      </LinearGradient>
                    </Pressable>

                    {/* Pricing / Rates Card */}
                    <Pressable
                      onPress={() => router.push('/create-turf')}
                      style={({ pressed }) => [
                        { flex: 1, borderRadius: 12, overflow: 'hidden' },
                        Shadows.level3,
                        pressed && { opacity: 0.95, transform: [{ scale: 0.98 }] },
                      ]}
                    >
                      <LinearGradient
                        colors={['#27303f', '#181e29']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ padding: 14, height: 190, justifyContent: 'space-between', position: 'relative' }}
                      >
                        {/* New Generated Background Illustration */}
                        <Image
                          source={require('@/assets/images/illustrations/pricing_rates_card_bg.png')}
                          style={{ position: 'absolute', right: -15, bottom: -15, width: 135, height: 135, opacity: 0.35, borderRadius: 20 }}
                          contentFit="contain"
                        />

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
                          <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: 'rgba(245, 158, 11, 0.28)', justifyContent: 'center', alignItems: 'center' }}>
                            <Ionicons name="time" size={17} color="#f59e0b" />
                          </View>
                          <ThemedText style={{ color: '#fbbf24', fontFamily: 'Sora_800ExtraBold', fontSize: 8.5, letterSpacing: 0.5 }}>
                            COACH SLOTS
                          </ThemedText>
                        </View>

                        <View style={{ marginVertical: 4, zIndex: 2 }}>
                          <ThemedText style={{ color: '#ffffff', fontSize: 15, fontFamily: 'Sora_800ExtraBold', lineHeight: 19 }}>
                            Pricing / Rates
                          </ThemedText>
                          <ThemedText style={{ color: 'rgba(255, 255, 255, 0.88)', fontSize: 9.5, fontFamily: 'Sora_500Medium', marginTop: 3, lineHeight: 13.5 }}>
                            Configure peak hours and custom pricing slot configurations.
                          </ThemedText>
                        </View>

                        <View style={{ alignSelf: 'flex-start', backgroundColor: '#f59e0b', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, zIndex: 2 }}>
                          <ThemedText style={{ color: '#ffffff', fontFamily: 'Sora_800ExtraBold', fontSize: 9.5 }}>
                            Set Rates →
                          </ThemedText>
                        </View>
                      </LinearGradient>
                    </Pressable>
                  </View>
                </View>

                {/* 8. Tournament Announcements Banner Carousel - Compact Spacing */}
                <View style={[styles.section, { paddingHorizontal: 0, paddingBottom: 12 }]}>
                  <ThemedText type="labelSm" style={{ color: theme.textSecondary, paddingHorizontal: Spacing.containerMargin, marginBottom: 8, letterSpacing: 0.5 }}>
                    TOURNAMENT ANNOUNCEMENTS
                  </ThemedText>
                  <AutoScrollingHorizontalBanners
                    cardWidth={310}
                    gap={16}
                    banners={[
                      {
                        title: "Grand Summer Tournament!",
                        subtitle: "Register your Team, compete in the League and win ₹50,000 + kit gifts!",
                        buttonText: "Register Team",
                        isGradient: true,
                        gradientColors: ['rgba(99, 102, 241, 0.7)', 'rgba(168, 85, 247, 0.9)'],
                        titleColor: "#ffffff",
                        subtitleColor: "rgba(255, 255, 255, 0.95)",
                        buttonBackgroundColor: "#ffffff",
                        buttonTextColor: "#4f46e5",
                        backgroundImage: require("@/assets/images/illustrations/summer_tournament_banner_bg.png"),
                        onPress: () => router.push('/(tabs)/tournaments'),
                      },
                      {
                        title: "Weekend Champions League!",
                        subtitle: "20% Discount on Team Registrations this weekend. Limited slots!",
                        buttonText: "Join Tournament",
                        isGradient: true,
                        gradientColors: ['rgba(245, 158, 11, 0.75)', 'rgba(217, 119, 6, 0.95)'],
                        titleColor: "#ffffff",
                        subtitleColor: "rgba(255, 255, 255, 0.95)",
                        buttonBackgroundColor: "#ffffff",
                        buttonTextColor: "#d97706",
                        backgroundImage: require("@/assets/images/illustrations/tournament_hero.png"),
                        onPress: () => router.push('/(tabs)/tournaments'),
                      },
                      {
                        title: "Night Knockout Super Cup!",
                        subtitle: "Under-the-lights tournament series with trophy & cash prize rewards!",
                        buttonText: "Compete Now",
                        isGradient: true,
                        gradientColors: ['rgba(16, 185, 129, 0.75)', 'rgba(5, 150, 105, 0.95)'],
                        titleColor: "#ffffff",
                        subtitleColor: "rgba(255, 255, 255, 0.95)",
                        buttonBackgroundColor: "#ffffff",
                        buttonTextColor: "#059669",
                        backgroundImage: require("@/assets/images/illustrations/tournament_cover.png"),
                        onPress: () => router.push('/(tabs)/tournaments'),
                      }
                    ]}
                  />
                </View>
              </>
            ) : (
              <>
                {/* Top Progress/Status Card */}
                <View style={styles.section}>
                  {role === 'Owner' ? (
                    <View style={[styles.dailyPlanCard, { backgroundColor: theme.primaryContainer }, Shadows.level3]}>
                      <View style={styles.planInfo}>
                        <ThemedText type="headlineSm" style={{ color: '#ffffff' }}>
                          {"Today's Occupancy"}
                        </ThemedText>
                        <ThemedText type="bodyMd" style={{ color: 'rgba(255, 255, 255, 0.85)', marginTop: 4 }}>
                          8 of 12 slots booked
                        </ThemedText>
                        <Pressable style={[styles.viewTasksButton, { backgroundColor: '#ffffff' }]}>
                          <ThemedText type="labelMd" style={{ color: theme.primary, fontFamily: 'Sora_700Bold' }}>
                            View Queue
                          </ThemedText>
                        </Pressable>
                      </View>

                      <View style={[styles.progressRing, { borderColor: 'rgba(255, 255, 255, 0.15)' }]}>
                        <View style={[styles.progressRingInner, { borderColor: '#ffffff' }]}>
                          <ThemedText type="headlineSm" style={{ color: '#ffffff', fontFamily: 'Sora_700Bold' }}>
                            67%
                          </ThemedText>
                        </View>
                      </View>
                    </View>
                  ) : role === 'Coach' ? (
                    <View style={[styles.dailyPlanCard, { backgroundColor: theme.primaryContainer }, Shadows.level3]}>
                      <View style={styles.planInfo}>
                        <ThemedText type="headlineSm" style={{ color: '#ffffff' }}>
                          Academy Schedule
                        </ThemedText>
                        <ThemedText type="bodyMd" style={{ color: 'rgba(255, 255, 255, 0.85)', marginTop: 4 }}>
                          4 of 6 classes completed
                        </ThemedText>
                        <Pressable style={[styles.viewTasksButton, { backgroundColor: '#ffffff' }]}>
                          <ThemedText type="labelMd" style={{ color: theme.primary, fontFamily: 'Sora_700Bold' }}>
                            View Students
                          </ThemedText>
                        </Pressable>
                      </View>

                      <View style={[styles.progressRing, { borderColor: 'rgba(255, 255, 255, 0.15)' }]}>
                        <View style={[styles.progressRingInner, { borderColor: '#ffffff' }]}>
                          <ThemedText type="headlineSm" style={{ color: '#ffffff', fontFamily: 'Sora_700Bold' }}>
                            67%
                          </ThemedText>
                        </View>
                      </View>
                    </View>
                  ) : role === 'Organizer' ? (
                    <View style={[styles.dailyPlanCard, { backgroundColor: theme.primaryContainer }, Shadows.level3]}>
                      <View style={styles.planInfo}>
                        <ThemedText type="headlineSm" style={{ color: '#ffffff' }}>
                          Active Tournaments
                        </ThemedText>
                        <ThemedText type="bodyMd" style={{ color: 'rgba(255, 255, 255, 0.85)', marginTop: 4 }}>
                          3 of 4 leagues live
                        </ThemedText>
                        <Pressable style={[styles.viewTasksButton, { backgroundColor: '#ffffff' }]} onPress={() => router.push('/(tabs)/tournaments')}>
                          <ThemedText type="labelMd" style={{ color: theme.primary, fontFamily: 'Sora_700Bold' }}>
                            Manage Leagues
                          </ThemedText>
                        </Pressable>
                      </View>

                      <View style={[styles.progressRing, { borderColor: 'rgba(255, 255, 255, 0.15)' }]}>
                        <View style={[styles.progressRingInner, { borderColor: '#ffffff' }]}>
                          <ThemedText type="headlineSm" style={{ color: '#ffffff', fontFamily: 'Sora_700Bold' }}>
                            75%
                          </ThemedText>
                        </View>
                      </View>
                    </View>
                  ) : (
                    <View style={[styles.dailyPlanCard, { backgroundColor: theme.primaryContainer }, Shadows.level3]}>
                      <View style={styles.planInfo}>
                        <ThemedText type="headlineSm" style={{ color: '#ffffff' }}>
                          Daily Plan
                        </ThemedText>
                        <ThemedText type="bodyMd" style={{ color: 'rgba(255, 255, 255, 0.85)', marginTop: 4 }}>
                          4 of 5 targets reached
                        </ThemedText>
                        <Pressable style={[styles.viewTasksButton, { backgroundColor: '#ffffff' }]}>
                          <ThemedText type="labelMd" style={{ color: theme.primary, fontFamily: 'Sora_700Bold' }}>
                            View Tasks
                          </ThemedText>
                        </Pressable>
                      </View>

                      <View style={[styles.progressRing, { borderColor: 'rgba(255, 255, 255, 0.15)' }]}>
                        <View style={[styles.progressRingInner, { borderColor: '#ffffff' }]}>
                          <ThemedText type="headlineSm" style={{ color: '#ffffff', fontFamily: 'Sora_700Bold' }}>
                            80%
                          </ThemedText>
                        </View>
                      </View>
                    </View>
                  )}
                </View>

                {/* Tournament Announcements Banner Carousel */}
                <View style={[styles.section, { paddingHorizontal: 0 }]}>
                  <ThemedText type="labelSm" style={{ color: theme.textSecondary, paddingHorizontal: Spacing.containerMargin, marginBottom: 8, letterSpacing: 0.5 }}>
                    TOURNAMENT ANNOUNCEMENTS
                  </ThemedText>
                  <AutoScrollingHorizontalBanners
                    cardWidth={310}
                    gap={16}
                    banners={[
                      {
                        title: "Grand Summer Tournament!",
                        subtitle: "Register your Team, compete in the League and win ₹50,000 + kit gifts!",
                        buttonText: "Register Team",
                        isGradient: true,
                        gradientColors: ['rgba(99, 102, 241, 0.7)', 'rgba(168, 85, 247, 0.9)'],
                        titleColor: "#ffffff",
                        subtitleColor: "rgba(255, 255, 255, 0.95)",
                        buttonBackgroundColor: "#ffffff",
                        buttonTextColor: "#4f46e5",
                        backgroundImage: require("@/assets/images/illustrations/summer_tournament_banner_bg.png"),
                        onPress: () => router.push('/(tabs)/tournaments'),
                      },
                      {
                        title: "Weekend Champions League!",
                        subtitle: "20% Discount on Team Registrations this weekend. Limited slots!",
                        buttonText: "Join Tournament",
                        isGradient: true,
                        gradientColors: ['rgba(245, 158, 11, 0.75)', 'rgba(217, 119, 6, 0.95)'],
                        titleColor: "#ffffff",
                        subtitleColor: "rgba(255, 255, 255, 0.95)",
                        buttonBackgroundColor: "#ffffff",
                        buttonTextColor: "#d97706",
                        backgroundImage: require("@/assets/images/illustrations/tournament_hero.png"),
                        onPress: () => router.push('/(tabs)/tournaments'),
                      },
                      {
                        title: "Night Knockout Super Cup!",
                        subtitle: "Under-the-lights tournament series with trophy & cash prize rewards!",
                        buttonText: "Compete Now",
                        isGradient: true,
                        gradientColors: ['rgba(16, 185, 129, 0.75)', 'rgba(5, 150, 105, 0.95)'],
                        titleColor: "#ffffff",
                        subtitleColor: "rgba(255, 255, 255, 0.95)",
                        buttonBackgroundColor: "#ffffff",
                        buttonTextColor: "#059669",
                        backgroundImage: require("@/assets/images/illustrations/tournament_cover.png"),
                        onPress: () => router.push('/(tabs)/tournaments'),
                      }
                    ]}
                  />
                </View>

                {/* Highlights / Pitch status / Trainees / Organized Scroll */}
                {role === 'Owner' ? (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <ThemedText type="headlineSm">Facility status: Pitches</ThemedText>
                      <Pressable>
                        <ThemedText type="labelMd" style={{ color: theme.secondary, fontFamily: 'Sora_700Bold' }}>
                          Edit Pitches
                        </ThemedText>
                      </Pressable>
                    </View>

                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.featuredTurfsScroll}
                    >
                      {[
                        {
                          id: 'pitch-1',
                          name: 'Main Football Arena',
                          status: 'BOOKED',
                          statusColor: '#ff8c00',
                          time: '17:00 - 18:00',
                          image: require('@/assets/images/sports/sport_football.png'),
                          desc: '5G Rubber Infill Turf'
                        },
                        {
                          id: 'pitch-2',
                          name: 'Cricket Pitch Nets',
                          status: 'AVAILABLE',
                          statusColor: '#10b981',
                          time: 'Free to book',
                          image: require('@/assets/images/sports/sport_cricket.png'),
                          desc: 'AstroTurf wicket nets'
                        },
                        {
                          id: 'pitch-3',
                          name: 'Indoor Badminton Court',
                          status: 'MAINTENANCE',
                          statusColor: '#ef4444',
                          time: 'Unavailable today',
                          image: require('@/assets/images/sports/sport_all.png'),
                          desc: 'Polished teakwood court'
                        }
                      ].map((pitch) => (
                        <View
                          key={pitch.id}
                          style={[styles.featuredTurfCard, { backgroundColor: theme.surfaceLowest }, Shadows.level2]}
                        >
                          <Image source={typeof pitch.image === 'string' ? { uri: pitch.image } : pitch.image} style={styles.featuredTurfImage} contentFit="cover" />
                          <View style={styles.featuredTurfContent}>
                            <View style={styles.featuredTurfHeader}>
                              <ThemedText type="labelSm" style={{ color: theme.secondary, fontWeight: '700', fontSize: 9 }} numberOfLines={1}>
                                {pitch.desc.toUpperCase()}
                              </ThemedText>
                            </View>
                            <ThemedText type="headlineSm" style={[styles.featuredTurfTitle, { color: theme.text }]} numberOfLines={1}>
                              {pitch.name}
                            </ThemedText>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 8 }}>
                              <Ionicons name="time-outline" size={10} color={theme.textSecondary} />
                              <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginLeft: 2, fontSize: 10 }} numberOfLines={1}>
                                {pitch.time}
                              </ThemedText>
                            </View>
                          </View>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                ) : role === 'Coach' ? (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <ThemedText type="headlineSm">Registered Academy Students</ThemedText>
                      <Pressable onPress={() => router.push('/(tabs)/coach')}>
                        <ThemedText type="labelMd" style={{ color: theme.secondary, fontFamily: 'Sora_700Bold' }}>
                          View Roster (18)
                        </ThemedText>
                      </Pressable>
                    </View>

                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.featuredTurfsScroll}
                    >
                      {[
                        {
                          id: 'student-1',
                          name: 'Marcus Vance',
                          registeredClass: 'Under-16 Advanced Drill',
                          sport: 'Football ⚽',
                          role: 'Forward • Level 10',
                          attendance: '95%',
                          feeStatus: 'Paid (Monthly)',
                          notes: 'Excellent explosive speed',
                          rating: '4.9',
                          image: require('@/assets/images/avatars/avatar_8.png'),
                          focus: 'FOOTBALL DRILL'
                        },
                        {
                          id: 'student-2',
                          name: 'Elena Rostova',
                          registeredClass: 'Individual Mentoring: Power',
                          sport: 'Fitness & Tactics 🏋️',
                          role: 'Midfielder • Level 14',
                          attendance: '98%',
                          feeStatus: 'Paid (Quarterly)',
                          notes: 'Great ball possession control',
                          rating: '4.8',
                          image: require('@/assets/images/sports/sport_all.png'),
                          focus: 'MENTORING BATCH'
                        },
                        {
                          id: 'student-3',
                          name: 'Rob Miller',
                          registeredClass: 'Under-16 Advanced Drill',
                          sport: 'Football ⚽',
                          role: 'Goalkeeper • Level 8',
                          attendance: '88%',
                          feeStatus: 'Paid (Monthly)',
                          notes: 'Needs reflex response practice',
                          rating: '4.5',
                          image: require('@/assets/images/avatars/avatar_10.png'),
                          focus: 'GK ACADEMY'
                        },
                        {
                          id: 'student-4',
                          name: 'Sarah Connor',
                          registeredClass: 'Junior Cricket Academy',
                          sport: 'Cricket 🏏',
                          role: 'All-Rounder • Level 12',
                          attendance: '92%',
                          feeStatus: 'Paid (Annual)',
                          notes: 'Outstanding spin bowling accuracy',
                          rating: '4.9',
                          image: require('@/assets/images/avatars/avatar_3.png'),
                          focus: 'CRICKET BATCH'
                        },
                        {
                          id: 'student-5',
                          name: 'David Wright',
                          registeredClass: 'Weekend Tennis Camp',
                          sport: 'Tennis 🎾',
                          role: 'Baseline Player • Level 11',
                          attendance: '90%',
                          feeStatus: 'Paid (Per Session)',
                          notes: 'Topspin forehand precision',
                          rating: '4.7',
                          image: require('@/assets/images/avatars/avatar_4.png'),
                          focus: 'TENNIS CAMP'
                        }
                      ].map((student) => (
                        <Pressable
                          key={student.id}
                          style={[
                            styles.featuredTurfCard, 
                            { 
                              backgroundColor: theme.surfaceLowest, 
                              width: 250, 
                              paddingBottom: 12 
                            }, 
                            Shadows.level2
                          ]}
                          onPress={() => router.push({
                            pathname: '/player-profile',
                            params: {
                              name: student.name,
                              role: student.role,
                              notes: student.notes,
                              rating: student.rating,
                              focus: student.focus,
                              registeredClass: student.registeredClass,
                              attendance: student.attendance,
                              feeStatus: student.feeStatus,
                            }
                          })}
                        >
                          <View style={{ height: 110, position: 'relative', overflow: 'hidden', borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl }}>
                            <Image source={typeof student.image === 'string' ? { uri: student.image } : student.image} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                          </View>

                          <View style={{ paddingHorizontal: 12, paddingTop: 10 }}>
                            <ThemedText type="headlineSm" style={{ color: theme.text, fontFamily: 'Sora_700Bold', fontSize: 15 }} numberOfLines={1}>
                              {student.name}
                            </ThemedText>

                            <ThemedText style={{ color: theme.primary, fontSize: 11, fontFamily: 'Sora_700Bold', marginTop: 2 }} numberOfLines={1}>
                              Class: {student.registeredClass}
                            </ThemedText>

                            <ThemedText style={{ color: theme.textSecondary, fontSize: 10, marginTop: 2 }} numberOfLines={1}>
                              {student.sport} • {student.role}
                            </ThemedText>

                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: theme.outlineVariant + '1F' }}>
                              <Ionicons name="calendar-outline" size={12} color={theme.textSecondary} style={{ marginRight: 3 }} />
                              <ThemedText style={{ color: theme.textSecondary, fontSize: 10 }}>
                                Att: <ThemedText style={{ color: theme.text, fontFamily: 'Sora_700Bold', fontSize: 10 }}>{student.attendance}</ThemedText>
                              </ThemedText>
                            </View>
                          </View>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                ) : role === 'Organizer' ? (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <ThemedText type="headlineSm">My Organized Leagues</ThemedText>
                      <Pressable onPress={() => router.push('/(tabs)/tournaments')}>
                        <ThemedText type="labelMd" style={{ color: theme.secondary, fontFamily: 'Sora_700Bold' }}>
                          View All
                        </ThemedText>
                      </Pressable>
                    </View>

                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.featuredTurfsScroll}
                    >
                      {[
                        {
                          id: 'tourn-1',
                          name: 'Regents T10 Super League',
                          status: 'LIVE NOW',
                          statusColor: '#ff8c00',
                          teams: '16 Teams Registered',
                          image: require('@/assets/images/avatars/avatar_8.png'),
                          sport: 'CRICKET'
                        },
                        {
                          id: 'tourn-2',
                          name: 'London Winter Futsal Cup',
                          status: 'REGISTERING',
                          statusColor: '#10b981',
                          teams: '8 Teams Registered',
                          image: require('@/assets/images/sports/sport_football.png'),
                          sport: 'FOOTBALL'
                        },
                        {
                          id: 'tourn-3',
                          name: 'UK Tennis Singles Arena',
                          status: 'COMPLETED',
                          statusColor: '#81919c',
                          teams: '32 Players Bracket',
                          image: require('@/assets/images/sports/sport_all.png'),
                          sport: 'TENNIS'
                        }
                      ].map((tourn) => (
                        <Pressable
                          key={tourn.id}
                          onPress={() => router.push('/(tabs)/tournaments')}
                          style={[styles.featuredTurfCard, { backgroundColor: theme.surfaceLowest }, Shadows.level2]}
                        >
                          <Image source={typeof tourn.image === 'string' ? { uri: tourn.image } : tourn.image} style={styles.featuredTurfImage} contentFit="cover" />
                          <View style={styles.featuredTurfContent}>
                            <View style={styles.featuredTurfHeader}>
                              <ThemedText type="labelSm" style={{ color: theme.secondary, fontWeight: '700', fontSize: 9 }} numberOfLines={1}>
                                {tourn.sport}
                              </ThemedText>
                            </View>
                            <ThemedText type="headlineSm" style={[styles.featuredTurfTitle, { color: theme.text }]} numberOfLines={1}>
                              {tourn.name}
                            </ThemedText>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 8 }}>
                              <Ionicons name="people-outline" size={10} color={theme.textSecondary} />
                              <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginLeft: 2, fontSize: 10 }} numberOfLines={1}>
                                {tourn.teams}
                              </ThemedText>
                            </View>
                          </View>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                ) : (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <ThemedText type="headlineSm">Highlights: Book Turf</ThemedText>
                      <Pressable onPress={() => router.push('/(tabs)/explore')}>
                        <ThemedText type="labelMd" style={{ color: theme.secondary, fontFamily: 'Sora_700Bold' }}>
                          View All
                        </ThemedText>
                      </Pressable>
                    </View>

                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.featuredTurfsScroll}
                    >
                      {(() => {
                        const SPORT_PITCH_IMAGES: Record<string, string> = {
                          cricket: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=500',
                          football: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=500',
                          badminton: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=500',
                          basketball: 'https://images.unsplash.com/photo-1505666287802-931dc83948e9?w=500',
                          tennis: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=500',
                          volleyball: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=500',
                        };

                        const backendList = (backendTurfs || []).map((t: any) => {
                          const sType = (t.sportType || 'football').toLowerCase();
                          const fallback = SPORT_PITCH_IMAGES[sType] || SPORT_PITCH_IMAGES.football;
                          return {
                            id: t.id,
                            name: t.name,
                            location: cleanLocation(t.address || 'Local Arena'),
                            price: `₹${t.pricePerSlot || 1000}`,
                            rating: `${t.rating || '5.0'}`,
                            image: { uri: t.thumbnailImage || t.images?.[0] || fallback },
                            pitch: `${t.surfaceType || t.sportType || 'Artificial Turf'}`,
                            createdAt: t.createdAt || new Date().toISOString(),
                          };
                        });

                        const userList = (ownedTurfs || []).map(t => {
                          const sType = (t.sportType || 'football').toLowerCase();
                          const fallback = SPORT_PITCH_IMAGES[sType] || SPORT_PITCH_IMAGES.football;
                          return {
                            id: t.id,
                            name: t.name,
                            location: cleanLocation(t.address || 'Local Arena'),
                            price: `₹${t.pricePerSlot || 1000}`,
                            rating: `${t.rating || '5.0'}`,
                            image: { uri: t.thumbnailImage || t.images?.[0] || fallback },
                            pitch: `${t.surfaceType || t.sportType || 'Artificial Turf'}`,
                            createdAt: (t as any).createdAt || new Date().toISOString(),
                          };
                        });

                        const staticList = [
                          {
                            id: 'skyline',
                            name: 'Skyline Arena Elite',
                            location: 'Canary Wharf, East London',
                            price: '₹2500',
                            rating: '4.9',
                            image: { uri: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=500' },
                            pitch: '5G Rubber Infill',
                            createdAt: '2025-01-01T00:00:00.000Z',
                          },
                          {
                            id: 'lords',
                            name: "Lord's View Pavillion",
                            location: "St John's Wood, London",
                            price: '₹2000',
                            rating: '4.8',
                            image: { uri: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=500' },
                            pitch: 'Hybrid Grass Turf',
                            createdAt: '2025-01-02T00:00:00.000Z',
                          },
                          {
                            id: 'the-grid',
                            name: 'The Grid Multisport',
                            location: 'Stratford Central, London',
                            price: '₹1800',
                            rating: '4.7',
                            image: { uri: 'https://images.unsplash.com/photo-1505666287802-931dc83948e9?w=500' },
                            pitch: 'Indoor Woodcourt',
                            createdAt: '2025-01-03T00:00:00.000Z',
                          }
                        ];

                        const seen = new Set<string>();
                        const merged: any[] = [];
                        [...backendList, ...userList, ...staticList].forEach(t => {
                          if (t && t.id && !seen.has(t.id)) {
                            seen.add(t.id);
                            merged.push(t);
                          }
                        });

                        // Sort newest turfs to the top
                        merged.sort((a, b) => {
                          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : (a.id?.startsWith('turf-') ? parseInt(a.id.replace('turf-', '')) || 0 : 0);
                          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : (b.id?.startsWith('turf-') ? parseInt(b.id.replace('turf-', '')) || 0 : 0);
                          return bTime - aTime;
                        });

                        return merged;
                      })().map((turf) => (
                        <Pressable
                          key={turf.id}
                          onPress={() => router.push({ pathname: '/details', params: { id: turf.id, name: turf.name } })}
                          style={[styles.featuredTurfCard, { backgroundColor: theme.surfaceLowest }, Shadows.level2]}
                        >
                          <Image source={typeof turf.image === 'string' ? { uri: turf.image } : turf.image} style={styles.featuredTurfImage} contentFit="cover" />
                          <View style={styles.featuredTurfContent}>
                            <View style={styles.featuredTurfHeader}>
                              <ThemedText type="labelSm" style={{ color: theme.secondary, fontWeight: '700', fontSize: 9 }} numberOfLines={1}>
                                {turf.pitch.toUpperCase()}
                              </ThemedText>
                              <View style={styles.featuredTurfRating}>
                                <Ionicons name="star" size={10} color="#5D68E8" />
                                <ThemedText type="labelSm" style={{ marginLeft: 2, fontFamily: 'Sora_700Bold', fontSize: 10 }}>{turf.rating}</ThemedText>
                              </View>
                            </View>
                            <ThemedText type="headlineSm" style={[styles.featuredTurfTitle, { color: theme.text }]} numberOfLines={1}>
                              {turf.name}
                            </ThemedText>
                            <View style={styles.featuredTurfLocation}>
                              <Ionicons name="location-outline" size={10} color={theme.textSecondary} />
                              <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginLeft: 2, fontSize: 10 }} numberOfLines={1}>
                                {turf.location}
                              </ThemedText>
                            </View>
                            <View style={styles.featuredTurfFooter}>
                              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                                <ThemedText type="headlineSm" style={{ color: theme.secondary, fontSize: 13, fontFamily: 'Sora_700Bold' }}>{turf.price}</ThemedText>
                                <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: 9, marginLeft: 1 }}>/hr</ThemedText>
                              </View>
                              <Pressable
                                onPress={() => router.push({ pathname: '/details', params: { id: turf.id, name: turf.name } })}
                                style={[styles.featuredTurfBookBtn, { backgroundColor: theme.secondaryContainer }]}
                              >
                                <ThemedText type="labelSm" style={{ color: theme.onSecondaryContainer, fontSize: 10, fontFamily: 'Sora_700Bold' }}>Book</ThemedText>
                              </Pressable>
                            </View>
                          </View>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Today's Schedule timeline */}
                {role === 'Owner' ? (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <ThemedText type="headlineSm">{"Today's Turf Bookings"}</ThemedText>
                      <Pressable>
                        <ThemedText type="labelMd" style={{ color: theme.secondary, fontFamily: 'Sora_700Bold' }}>
                          View Schedule
                        </ThemedText>
                      </Pressable>
                    </View>

                    <View style={styles.scheduleList}>
                      {/* Booking 1 */}
                      <View style={[styles.scheduleCard, { backgroundColor: theme.surfaceLowest }, Shadows.level1]}>
                        <View style={[styles.scheduleIconWrap, { backgroundColor: theme.primaryContainer + '1a' }]}>
                          <Ionicons name="football" size={24} color={theme.primary} />
                        </View>
                        <View style={styles.scheduleInfo}>
                          <ThemedText type="headlineSm" style={styles.scheduleTitle}>
                            Footy Club Booking (#B204)
                          </ThemedText>
                          <View style={styles.scheduleTimeRow}>
                            <Ionicons name="time-outline" size={14} color={theme.textSecondary} style={styles.scheduleTimeIcon} />
                            <ThemedText type="bodyMd" style={styles.scheduleTimeText}>
                              17:00 - 18:00 • Pitch A
                            </ThemedText>
                          </View>
                          <View style={styles.scheduleDetailsRow}>
                            <ThemedText type="bodyMd" style={styles.scheduleDetailsText}>
                              ₹1,200 • <ThemedText type="bodyMd" style={{ color: '#10b981', fontFamily: 'Sora_700Bold' }}>Paid</ThemedText>
                            </ThemedText>
                          </View>
                        </View>
                      </View>

                      {/* Booking 2 */}
                      <View style={[styles.scheduleCard, { backgroundColor: theme.surfaceLowest }, Shadows.level1]}>
                        <View style={[styles.scheduleIconWrap, { backgroundColor: theme.surface }]}>
                          <MaterialCommunityIcons name="cricket" size={24} color={theme.secondary} />
                        </View>
                        <View style={styles.scheduleInfo}>
                          <ThemedText type="headlineSm" style={styles.scheduleTitle}>
                            Corporate Cricket Match (#B211)
                          </ThemedText>
                          <View style={styles.scheduleTimeRow}>
                            <Ionicons name="time-outline" size={14} color={theme.textSecondary} style={styles.scheduleTimeIcon} />
                            <ThemedText type="bodyMd" style={styles.scheduleTimeText}>
                              18:30 - 20:00 • Pitch B
                            </ThemedText>
                          </View>
                          <View style={styles.scheduleDetailsRow}>
                            <ThemedText type="bodyMd" style={styles.scheduleDetailsText}>
                              ₹1,800 • <ThemedText type="bodyMd" style={{ color: '#ff1744', fontFamily: 'Sora_700Bold' }}>Unpaid</ThemedText>
                            </ThemedText>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                ) : role === 'Coach' ? (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <ThemedText type="headlineSm">{"Today's Academy Sessions"}</ThemedText>
                      <Pressable>
                        <ThemedText type="labelMd" style={{ color: theme.secondary, fontFamily: 'Sora_700Bold' }}>
                          Full Calendar
                        </ThemedText>
                      </Pressable>
                    </View>

                    {classes.length > 0 && (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 16, gap: 12 }}
                      >
                        {classes.map((cls, idx) => {
                          const navigateToProfile = () => {
                            router.push({
                              pathname: '/coach/[id]',
                              params: {
                                id: cls.id || `class-${idx}`,
                                name: profile.name || 'Coach',
                                specialty: cls.className,
                                experience: `${cls.classType} • ${cls.ageGroup || 'All Ages'}`,
                                trainees: '18',
                                rating: '5.0',
                                reviews: '1',
                                rate: cls.feeAmount ? `₹${cls.feeAmount}/${cls.feeType === 'Per Session' ? 'sess' : 'mo'}` : 'Free',
                                location: cls.venue,
                                match: 'Your Class',
                                sports: [cls.sportType.toLowerCase()].join(','),
                                avatar: typeof profile.avatarUrl === 'string' ? profile.avatarUrl : 'avatar_1',
                                badge: 'OWNER',
                              }
                            });
                          };

                          const watermarkSource = getSportIllustration(cls.sportType);

                          return (
                            <Pressable
                              key={cls.id || idx}
                              style={[styles.advertisementCard, { backgroundColor: '#f5f6ff', borderColor: theme.outlineVariant + '33', width: 220, overflow: 'hidden' }]}
                              onPress={navigateToProfile}
                            >
                              {/* Subtle watermark vector illustration */}
                              <Image
                                source={watermarkSource}
                                style={{ position: 'absolute', right: -10, bottom: -10, width: 90, height: 90, opacity: 0.12 }}
                                contentFit="contain"
                              />
                              {/* Banner Top Accent */}
                              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: theme.primary, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl }} />

                              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                                <Image
                                  source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }}
                                  style={{ width: 44, height: 44, borderRadius: BorderRadius.full }}
                                />
                                <View style={{ flex: 1, marginLeft: 10 }}>
                                  <ThemedText style={{ color: theme.primary, fontFamily: 'Sora_800ExtraBold', fontSize: 10, letterSpacing: 0.5 }}>COACHING CLASS</ThemedText>
                                  <ThemedText style={{ color: theme.textSecondary, fontSize: 11, marginTop: 1 }}>{cls.classType} · {cls.sportType.toUpperCase()}</ThemedText>
                                </View>
                              </View>

                              <ThemedText type="title" style={{ color: theme.text, fontFamily: 'Sora_700Bold', fontSize: 15, lineHeight: 20 }} numberOfLines={1}>
                                {cls.className}
                              </ThemedText>

                              <ThemedText type="bodyMd" style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4 }} numberOfLines={1}>
                                {/* Certificate Accreditation */}
                             <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                               <Ionicons name="ribbon-outline" size={12} color="#10b981" style={{ marginRight: 4 }} />
                               <ThemedText style={{ color: '#10b981', fontSize: 10, fontFamily: 'Sora_700Bold' }} numberOfLines={1}>
                                 {cls.certificateName || (cls.certificates && cls.certificates.length > 0 ? cls.certificates[0] : 'BWF Level 2 Certified Coach')}
                               </ThemedText>
                             </View>
                              </ThemedText>

                              <View style={{ borderTopWidth: 1, borderTopColor: theme.outlineVariant + '1a', marginTop: 10, paddingTop: 10 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                                  <Ionicons name="location-outline" size={13} color={theme.textSecondary} style={{ marginRight: 4 }} />
                                  <ThemedText style={{ color: theme.textSecondary, fontSize: 11 }} numberOfLines={1}>{cls.venue}</ThemedText>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                  <Ionicons name="time-outline" size={13} color={theme.textSecondary} style={{ marginRight: 4 }} />
                                  <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_700Bold', color: theme.text }}>
                                    {cls.sessionTime}
                                  </ThemedText>
                                </View>
                              </View>
                            </Pressable>
                          );
                        })}
                      </ScrollView>
                    )}

                    <View style={styles.scheduleList} />
                  </View>
                ) : role === 'Organizer' ? (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <ThemedText type="headlineSm">{"Today's Organized Matches"}</ThemedText>
                      <Pressable>
                        <ThemedText type="labelMd" style={{ color: theme.secondary, fontFamily: 'Sora_700Bold' }}>
                          Full Bracket
                        </ThemedText>
                      </Pressable>
                    </View>

                    <View style={styles.scheduleList}>
                      {/* Match 1 */}
                      <View style={[styles.scheduleCard, { backgroundColor: theme.surfaceLowest }, Shadows.level1]}>
                        <View style={[styles.scheduleIconWrap, { backgroundColor: theme.primaryContainer + '1a' }]}>
                          <Ionicons name="trophy" size={24} color={theme.primary} />
                        </View>
                        <View style={styles.scheduleInfo}>
                          <ThemedText type="headlineSm" style={styles.scheduleTitle}>
                            Falcons FC vs Wolves (Quarter Final)
                          </ThemedText>
                          <View style={styles.scheduleTimeRow}>
                            <Ionicons name="time-outline" size={14} color={theme.textSecondary} style={styles.scheduleTimeIcon} />
                            <ThemedText type="bodyMd" style={styles.scheduleTimeText}>
                              15:00 - 16:30 • Stadium A
                            </ThemedText>
                          </View>
                          <View style={styles.scheduleDetailsRow}>
                            <ThemedText type="bodyMd" style={styles.scheduleDetailsText}>
                              Ref: Marcus J.
                            </ThemedText>
                          </View>
                        </View>
                      </View>

                      {/* Match 2 */}
                      <View style={[styles.scheduleCard, { backgroundColor: theme.surfaceLowest }, Shadows.level1]}>
                        <View style={[styles.scheduleIconWrap, { backgroundColor: theme.surface }]}>
                          <Ionicons name="flag" size={24} color={theme.secondary} />
                        </View>
                        <View style={styles.scheduleInfo}>
                          <ThemedText type="headlineSm" style={styles.scheduleTitle}>
                            Tigers XI vs Mavericks (Group Stage)
                          </ThemedText>
                          <View style={styles.scheduleTimeRow}>
                            <Ionicons name="time-outline" size={14} color={theme.textSecondary} style={styles.scheduleTimeIcon} />
                            <ThemedText type="bodyMd" style={styles.scheduleTimeText}>
                              18:00 - 19:30 • Stadium B
                            </ThemedText>
                          </View>
                          <View style={styles.scheduleDetailsRow}>
                            <ThemedText type="bodyMd" style={styles.scheduleDetailsText}>
                              Ref: Self
                            </ThemedText>
                          </View>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={theme.outlineVariant} />
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <ThemedText type="headlineSm">{"Today's Schedule"}</ThemedText>
                      <Pressable>
                        <ThemedText type="labelMd" style={{ color: theme.secondary, fontFamily: 'Sora_700Bold' }}>
                          View Calendar
                        </ThemedText>
                      </Pressable>
                    </View>

                    <View style={styles.scheduleList}>
                      {/* Live Match Card */}
                      <View style={[styles.scheduleCard, { backgroundColor: theme.surfaceLowest }, Shadows.level1]}>
                        <View style={[styles.scheduleIconWrap, { backgroundColor: theme.secondaryContainer + '1a' }]}>
                          <Image
                            source={require('@/assets/images/sports/sport_matches.png')}
                            style={styles.scheduleIllustration}
                          />
                        </View>
                        <View style={styles.scheduleInfo}>
                          <ThemedText type="headlineSm" style={styles.scheduleTitle}>
                            Match vs Tigers
                          </ThemedText>
                          <View style={styles.scheduleTimeRow}>
                            <Ionicons name="time-outline" size={14} color={theme.textSecondary} style={styles.scheduleTimeIcon} />
                            <ThemedText type="bodyMd" style={styles.scheduleTimeText}>
                              14:30 - 16:00 • Stadium A
                            </ThemedText>
                          </View>
                        </View>
                      </View>

                      {/* Practice Session Card */}
                      <View style={[styles.scheduleCard, { backgroundColor: theme.surfaceLowest }, Shadows.level1]}>
                        <View style={[styles.scheduleIconWrap, { backgroundColor: theme.surface }]}>
                          <Ionicons name="barbell" size={24} color={theme.primary} />
                        </View>
                        <View style={styles.scheduleInfo}>
                          <ThemedText type="headlineSm" style={styles.scheduleTitle}>
                            Practice Session
                          </ThemedText>
                          <View style={styles.scheduleTimeRow}>
                            <Ionicons name="time-outline" size={14} color={theme.textSecondary} style={styles.scheduleTimeIcon} />
                            <ThemedText type="bodyMd" style={styles.scheduleTimeText}>
                              18:00 - 19:30 • Gym
                            </ThemedText>
                          </View>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={theme.outlineVariant} />
                      </View>
                    </View>
                  </View>
                )}

                {/* Quick Tools & Actions */}
                {role === 'Owner' ? (
                  <View style={styles.section}>
                    <View style={styles.actionCardsRow}>
                      {/* Add Direct Booking */}
                      <Pressable
                        style={[styles.actionCard, { backgroundColor: theme.primaryContainer }, Shadows.level3]}
                      >
                        <View style={styles.actionCardHeader}>
                          <View style={[styles.actionIconBg, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
                            <Ionicons name="add-circle" size={18} color="#ffffff" />
                          </View>
                        </View>
                        <View style={styles.actionCardBody}>
                          <ThemedText type="headlineSm" style={styles.actionCardTitle}>
                            Direct Booking
                          </ThemedText>
                          <ThemedText type="bodySm" style={styles.actionCardDesc}>
                            Manually add phone/walk-in slot bookings for customers.
                          </ThemedText>
                        </View>
                        <Pressable
                          style={[styles.actionCardBtn, { backgroundColor: '#ffffff' }]}
                        >
                          <ThemedText type="labelMd" style={{ color: theme.primary, fontFamily: 'Sora_700Bold', fontSize: 11 }}>
                            Add Slot
                          </ThemedText>
                        </Pressable>
                      </Pressable>

                      {/* Configure Slot Rates */}
                      <Pressable
                        style={[styles.actionCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', borderWidth: 1 }, Shadows.level2]}
                      >
                        <View style={styles.actionCardHeader}>
                          <View style={[styles.actionIconBg, { backgroundColor: theme.secondaryContainer }]}>
                            <FontAwesome5 name="percentage" size={14} color={theme.onSecondaryContainer} />
                          </View>
                        </View>
                        <View style={styles.actionCardBody}>
                          <ThemedText type="headlineSm" style={[styles.actionCardTitle, { color: theme.text }]}>
                            Pricing / Rates
                          </ThemedText>
                          <ThemedText type="bodySm" style={[styles.actionCardDesc, { color: theme.textSecondary }]}>
                            Configure peak hours and custom pricing slot configurations.
                          </ThemedText>
                        </View>
                        <Pressable
                          style={[styles.actionCardBtn, { backgroundColor: theme.secondary }]}
                        >
                          <ThemedText type="labelMd" style={{ color: '#ffffff', fontFamily: 'Sora_700Bold', fontSize: 11 }}>
                            Set Rates
                          </ThemedText>
                        </Pressable>
                      </Pressable>
                    </View>

                    {/* Vouchers & Offers — owner-published promo codes */}
                    <Pressable
                      onPress={() => router.push('/owner-offers')}
                      accessibilityRole="button"
                      accessibilityLabel="Open vouchers and offers"
                      style={[
                        styles.offersEntryCard,
                        { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' },
                        Shadows.level2,
                      ]}
                    >
                      <View style={[styles.offersEntryIcon, { backgroundColor: theme.primary + '18' }]}>
                        <MaterialCommunityIcons name="ticket-percent" size={20} color={theme.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <ThemedText style={{ color: theme.text, fontSize: 13.5, fontFamily: 'Sora_700Bold' }}>
                          Vouchers & Offers
                        </ThemedText>
                        <ThemedText
                          style={{ color: theme.textSecondary, fontSize: 11, lineHeight: 16, marginTop: 3 }}
                        >
                          {ownerLiveOfferCount > 0
                            ? `${ownerLiveOfferCount} live ${ownerLiveOfferCount === 1 ? 'offer' : 'offers'} · ${ownerRedemptionCount} redeemed`
                            : 'Create promo codes to fill your quiet slots.'}
                        </ThemedText>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={theme.outlineVariant} />
                    </Pressable>
                  </View>
                ) : role === 'Coach' ? (
                  <View style={styles.section}>
                    <View style={styles.actionCardsRow}>
                      {/* Add Direct Class */}
                      <Pressable
                        style={[styles.actionCard, { backgroundColor: theme.primaryContainer }, Shadows.level3]}
                      >
                        <View style={styles.actionCardHeader}>
                          <View style={[styles.actionIconBg, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
                            <Ionicons name="calendar" size={18} color="#ffffff" />
                          </View>
                        </View>
                        <View style={styles.actionCardBody}>
                          <ThemedText type="headlineSm" style={styles.actionCardTitle}>
                            Create Class
                          </ThemedText>
                          <ThemedText type="bodySm" style={styles.actionCardDesc}>
                            Schedule direct coaching classes or student batches.
                          </ThemedText>
                        </View>
                        <Pressable
                          style={[styles.actionCardBtn, { backgroundColor: '#ffffff' }]}
                        >
                          <ThemedText type="labelMd" style={{ color: theme.primary, fontFamily: 'Sora_700Bold', fontSize: 11 }}>
                            Add Class
                          </ThemedText>
                        </Pressable>
                      </Pressable>

                      {/* Manage Availability */}
                      <Pressable
                        style={[styles.actionCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', borderWidth: 1 }, Shadows.level2]}
                      >
                        <View style={styles.actionCardHeader}>
                          <View style={[styles.actionIconBg, { backgroundColor: theme.secondaryContainer }]}>
                            <Ionicons name="time" size={16} color={theme.onSecondaryContainer} />
                          </View>
                        </View>
                        <View style={styles.actionCardBody}>
                          <ThemedText type="headlineSm" style={[styles.actionCardTitle, { color: theme.text }]}>
                            My Availability
                          </ThemedText>
                          <ThemedText type="bodySm" style={[styles.actionCardDesc, { color: theme.textSecondary }]}>
                            Update your weekly coaching hour slots for student booking.
                          </ThemedText>
                        </View>
                        <Pressable
                          style={[styles.actionCardBtn, { backgroundColor: theme.secondary }]}
                        >
                          <ThemedText type="labelMd" style={{ color: '#ffffff', fontFamily: 'Sora_700Bold', fontSize: 11 }}>
                            Set Slots
                          </ThemedText>
                        </Pressable>
                      </Pressable>
                    </View>
                  </View>
                ) : role === 'Organizer' ? (
                  <View style={styles.section}>
                    <View style={styles.actionCardsRow}>
                      {/* Create Tournament */}
                      <Pressable
                        onPress={() => router.push('/create-tournament')}
                        style={[styles.actionCard, { backgroundColor: theme.primaryContainer }, Shadows.level3]}
                      >
                        <View style={styles.actionCardHeader}>
                          <View style={[styles.actionIconBg, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
                            <Ionicons name="trophy-sharp" size={18} color="#ffffff" />
                          </View>
                        </View>
                        <View style={styles.actionCardBody}>
                          <ThemedText type="headlineSm" style={styles.actionCardTitle}>
                            New Tournament
                          </ThemedText>
                          <ThemedText type="bodySm" style={styles.actionCardDesc}>
                            Set up a new knockout tournament or round-robin league.
                          </ThemedText>
                        </View>
                        <Pressable
                          onPress={() => router.push('/create-tournament')}
                          style={[styles.actionCardBtn, { backgroundColor: '#ffffff' }]}
                        >
                          <ThemedText type="labelMd" style={{ color: theme.primary, fontFamily: 'Sora_700Bold', fontSize: 11 }}>
                            Setup Now
                          </ThemedText>
                        </Pressable>
                      </Pressable>

                      {/* Manage Referees */}
                      <Pressable
                        style={[styles.actionCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', borderWidth: 1 }, Shadows.level2]}
                      >
                        <View style={styles.actionCardHeader}>
                          <View style={[styles.actionIconBg, { backgroundColor: theme.secondaryContainer }]}>
                            <Ionicons name="shield-checkmark" size={16} color={theme.onSecondaryContainer} />
                          </View>
                        </View>
                        <View style={styles.actionCardBody}>
                          <ThemedText type="headlineSm" style={[styles.actionCardTitle, { color: theme.text }]}>
                            Manage Referees
                          </ThemedText>
                          <ThemedText type="bodySm" style={[styles.actionCardDesc, { color: theme.textSecondary }]}>
                            Assign referees and line judges to upcoming tournament fixtures.
                          </ThemedText>
                        </View>
                        <Pressable
                          style={[styles.actionCardBtn, { backgroundColor: theme.secondary }]}
                        >
                          <ThemedText type="labelMd" style={{ color: '#ffffff', fontFamily: 'Sora_700Bold', fontSize: 11 }}>
                            Assign Refs
                          </ThemedText>
                        </Pressable>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View style={styles.section}>
                    <View style={styles.actionCardsRow}>
                      {/* Coach Information Card */}
                      <Pressable
                        onPress={() => router.push('/(tabs)/coach')}
                        style={[styles.actionCard, { backgroundColor: theme.primaryContainer }, Shadows.level3]}
                      >
                        <View style={styles.actionCardHeader}>
                          <View style={[styles.actionIconBg, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
                            <Ionicons name="school" size={18} color="#ffffff" />
                          </View>
                        </View>
                        <View style={styles.actionCardBody}>
                          <ThemedText type="headlineSm" style={styles.actionCardTitle}>
                            Academy Coaching
                          </ThemedText>
                          <ThemedText type="bodySm" style={styles.actionCardDesc}>
                            Book 1-on-1 sessions with certified professional trainers.
                          </ThemedText>
                        </View>
                        <Pressable
                          onPress={() => router.push('/(tabs)/coach')}
                          style={[styles.actionCardBtn, { backgroundColor: '#ffffff' }]}
                        >
                          <ThemedText type="labelMd" style={{ color: theme.primary, fontFamily: 'Sora_700Bold', fontSize: 11 }}>
                            Book Coach
                          </ThemedText>
                        </Pressable>
                      </Pressable>

                      {/* Bid Match Card */}
                      <Pressable
                        onPress={() => router.push({ pathname: '/(tabs)/matches', params: { tab: 'Bid Match' } })}
                        style={[styles.actionCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', borderWidth: 1 }, Shadows.level2]}
                      >
                        <View style={styles.actionCardHeader}>
                          <View style={[styles.actionIconBg, { backgroundColor: theme.secondaryContainer }]}>
                            <FontAwesome5 name="handshake" size={14} color={theme.onSecondaryContainer} />
                          </View>
                        </View>
                        <View style={styles.actionCardBody}>
                          <ThemedText type="headlineSm" style={[styles.actionCardTitle, { color: theme.text }]}>
                            Bid Match Challenge
                          </ThemedText>
                          <ThemedText type="bodySm" style={[styles.actionCardDesc, { color: theme.textSecondary }]}>
                            Create split-cost match challenges with local opponent teams.
                          </ThemedText>
                        </View>
                        <Pressable
                          onPress={() => router.push({ pathname: '/(tabs)/matches', params: { tab: 'Bid Match' } })}
                          style={[styles.actionCardBtn, { backgroundColor: theme.secondary }]}
                        >
                          <ThemedText type="labelMd" style={{ color: '#ffffff', fontFamily: 'Sora_700Bold', fontSize: 11 }}>
                            Enter Bids
                          </ThemedText>
                        </Pressable>
                      </Pressable>
                    </View>
                  </View>
                )}

                {/* Quick Analytics Grid */}
                {role === 'Owner' ? (
                  <View style={styles.section}>
                    <ThemedText type="headlineSm" style={{ marginBottom: Spacing.md }}>
                      Business Analytics
                    </ThemedText>
                    <View style={styles.bentoRow}>
                      {/* Revenue Card */}
                      <View style={[styles.bentoCell, { backgroundColor: theme.surfaceLowest }, Shadows.level1]}>
                        <View style={[styles.bentoIconWrap, { backgroundColor: theme.surface }]}>
                          <Ionicons name="cash-outline" size={20} color={theme.primary} />
                        </View>
                        <View style={styles.bentoTextWrap}>
                          <ThemedText type="labelSm" style={{ color: theme.textSecondary, letterSpacing: 0.5 }}>
                            {"Today's Revenue"}
                          </ThemedText>
                          <ThemedText type="headlineSm" style={{ marginTop: 2 }}>
                            ₹18,500 <ThemedText type="labelSm" style={{ fontWeight: 'normal', color: '#10b981' }}>+15%</ThemedText>
                          </ThemedText>
                        </View>
                      </View>

                      {/* Pending Payments Card */}
                      <View style={[styles.bentoCell, { backgroundColor: theme.primaryContainer }, Shadows.level3]}>
                        <View style={[styles.bentoIconWrap, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
                          <Ionicons name="wallet-outline" size={20} color="#ffffff" />
                        </View>
                        <View style={styles.bentoTextWrap}>
                          <ThemedText type="labelSm" style={{ color: 'rgba(255, 255, 255, 0.85)', letterSpacing: 0.5 }}>
                            Unpaid Dues
                          </ThemedText>
                          <ThemedText type="headlineSm" style={{ color: '#ffffff', marginTop: 2 }}>
                            ₹2,400 <ThemedText type="labelSm" style={{ color: 'rgba(255, 255, 255, 0.85)', fontWeight: 'normal' }}>Pending</ThemedText>
                          </ThemedText>
                        </View>
                      </View>
                    </View>
                  </View>
                ) : role === 'Coach' ? (
                  <View style={styles.section}>
                    <ThemedText type="headlineSm" style={{ marginBottom: Spacing.md }}>
                      Academy Analytics
                    </ThemedText>
                    <View style={styles.bentoRow}>
                      {/* Hours Coached Card */}
                      <View style={[styles.bentoCell, { backgroundColor: theme.surfaceLowest }, Shadows.level1]}>
                        <View style={[styles.bentoIconWrap, { backgroundColor: theme.surface }]}>
                          <Ionicons name="time-outline" size={20} color={theme.primary} />
                        </View>
                        <View style={styles.bentoTextWrap}>
                          <ThemedText type="labelSm" style={{ color: theme.textSecondary, letterSpacing: 0.5 }}>
                            Weekly Hours
                          </ThemedText>
                          <ThemedText type="headlineSm" style={{ marginTop: 2 }}>
                            32.5 <ThemedText type="labelSm" style={{ fontWeight: 'normal' }}>hrs</ThemedText>
                          </ThemedText>
                        </View>
                      </View>

                      {/* Active Students Card */}
                      <View style={[styles.bentoCell, { backgroundColor: theme.primaryContainer }, Shadows.level3]}>
                        <View style={[styles.bentoIconWrap, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
                          <Ionicons name="people-outline" size={20} color="#ffffff" />
                        </View>
                        <View style={styles.bentoTextWrap}>
                          <ThemedText type="labelSm" style={{ color: 'rgba(255, 255, 255, 0.85)', letterSpacing: 0.5 }}>
                            Active Trainees
                          </ThemedText>
                          <ThemedText type="headlineSm" style={{ color: '#ffffff', marginTop: 2 }}>
                            18 <ThemedText type="labelSm" style={{ color: 'rgba(255, 255, 255, 0.85)', fontWeight: 'normal' }}>Students</ThemedText>
                          </ThemedText>
                        </View>
                      </View>
                    </View>
                  </View>
                ) : role === 'Organizer' ? (
                  <View style={styles.section}>
                    <ThemedText type="headlineSm" style={{ marginBottom: Spacing.md }}>
                      Hosting Analytics
                    </ThemedText>
                    <View style={styles.bentoRow}>
                      {/* Teams Registered */}
                      <View style={[styles.bentoCell, { backgroundColor: theme.surfaceLowest }, Shadows.level1]}>
                        <View style={[styles.bentoIconWrap, { backgroundColor: theme.surface }]}>
                          <Ionicons name="people-outline" size={20} color={theme.primary} />
                        </View>
                        <View style={styles.bentoTextWrap}>
                          <ThemedText type="labelSm" style={{ color: theme.textSecondary, letterSpacing: 0.5 }}>
                            Registered Teams
                          </ThemedText>
                          <ThemedText type="headlineSm" style={{ marginTop: 2 }}>
                            24 <ThemedText type="labelSm" style={{ fontWeight: 'normal', color: '#10b981' }}>+4 New</ThemedText>
                          </ThemedText>
                        </View>
                      </View>

                      {/* Matches Hosted */}
                      <View style={[styles.bentoCell, { backgroundColor: theme.primaryContainer }, Shadows.level3]}>
                        <View style={[styles.bentoIconWrap, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
                          <Ionicons name="calendar-outline" size={20} color="#ffffff" />
                        </View>
                        <View style={styles.bentoTextWrap}>
                          <ThemedText type="labelSm" style={{ color: 'rgba(255, 255, 255, 0.85)', letterSpacing: 0.5 }}>
                            Matches Hosted
                          </ThemedText>
                          <ThemedText type="headlineSm" style={{ color: '#ffffff', marginTop: 2 }}>
                            142 <ThemedText type="labelSm" style={{ color: 'rgba(255, 255, 255, 0.85)', fontWeight: 'normal' }}>Games</ThemedText>
                          </ThemedText>
                        </View>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={styles.section}>
                    <ThemedText type="headlineSm" style={{ marginBottom: Spacing.md }}>
                      Quick Analytics
                    </ThemedText>
                    <View style={styles.bentoRow}>
                      {/* Top Speed Card */}
                      <View style={[styles.bentoCell, { backgroundColor: theme.surfaceLowest }, Shadows.level1]}>
                        <View style={[styles.bentoIconWrap, { backgroundColor: theme.surface }]}>
                          <Ionicons name="speedometer-outline" size={20} color={theme.primary} />
                        </View>
                        <View style={styles.bentoTextWrap}>
                          <ThemedText type="labelSm" style={{ color: theme.textSecondary, letterSpacing: 0.5 }}>
                            Top Speed
                          </ThemedText>
                          <ThemedText type="headlineSm" style={{ marginTop: 2 }}>
                            34.2 <ThemedText type="labelSm" style={{ fontWeight: 'normal' }}>km/h</ThemedText>
                          </ThemedText>
                        </View>
                      </View>

                      {/* Avg Power Card */}
                      <View style={[styles.bentoCell, { backgroundColor: theme.primaryContainer }, Shadows.level3]}>
                        <View style={[styles.bentoIconWrap, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
                          <Ionicons name="flash" size={20} color="#ffffff" />
                        </View>
                        <View style={styles.bentoTextWrap}>
                          <ThemedText type="labelSm" style={{ color: 'rgba(255, 255, 255, 0.85)', letterSpacing: 0.5 }}>
                            Avg. Power
                          </ThemedText>
                          <ThemedText type="headlineSm" style={{ color: '#ffffff', marginTop: 2 }}>
                            280 <ThemedText type="labelSm" style={{ color: 'rgba(255, 255, 255, 0.85)', fontWeight: 'normal' }}>W</ThemedText>
                          </ThemedText>
                        </View>
                      </View>
                    </View>
                  </View>
                )}

                {/* Performance / Revenue Graph Card - Interactive with Details on Press/Hover */}
                <View style={[styles.section, { paddingBottom: 100 }]}>
                  {role === 'Owner' ? (
                    <View style={{ gap: 12 }}>
                      <View style={[styles.graphCard, { backgroundColor: theme.surfaceLowest, padding: 16, borderRadius: 12 }, Shadows.level2]}>
                        <View style={styles.graphHeader}>
                          <View style={{ flex: 1 }}>
                            <ThemedText type="labelMd" style={{ color: theme.text, fontFamily: 'Sora_700Bold', letterSpacing: 0.5, fontSize: 13.5 }}>
                              Weekly Revenue Trend (₹)
                            </ThemedText>
                            <ThemedText style={{ color: '#10b981', fontSize: 10, fontFamily: 'Sora_700Bold', marginTop: 2 }}>
                              Total: ₹1,35,000 · +18.4% vs Last Week
                            </ThemedText>
                          </View>
                          <Ionicons name="stats-chart" size={18} color={theme.primary} />
                        </View>

                        {/* Interactive Bar Chart with Values Above Bars */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 110, marginTop: 14, marginBottom: 8 }}>
                          {[
                            { day: 'M', fullDay: 'Monday', revenue: '₹12,000', label: '12k', height: 45, bookings: '5 Turf Bookings + 2 Coaching Sessions', peak: '5:00 PM - 7:00 PM' },
                            { day: 'T', fullDay: 'Tuesday', revenue: '₹15,000', label: '15k', height: 55, bookings: '7 Turf Bookings + 3 Coaching Sessions', peak: '6:00 PM - 8:00 PM' },
                            { day: 'W', fullDay: 'Wednesday', revenue: '₹8,500', label: '8.5k', height: 35, bookings: '4 Turf Bookings + 1 Coaching Session', peak: '7:00 PM - 8:00 PM' },
                            { day: 'T', fullDay: 'Thursday', revenue: '₹24,000', label: '24k', height: 80, bookings: '10 Turf Bookings + 3 Coaching Sessions', peak: '6:00 PM - 9:00 PM' },
                            { day: 'F', fullDay: 'Friday', revenue: '₹28,000', label: '28k', height: 95, bookings: '12 Turf Bookings + 4 Coaching Sessions', peak: '5:00 PM - 10:00 PM' },
                            { day: 'S', fullDay: 'Saturday', revenue: '₹22,500', label: '22.5k', height: 82, bookings: '11 Turf Bookings + 2 Coaching Sessions', peak: '4:00 PM - 9:00 PM' },
                            { day: 'S', fullDay: 'Sunday', revenue: '₹18,000', label: '18k', height: 68, bookings: '9 Turf Bookings + 2 Coaching Sessions', peak: '3:00 PM - 8:00 PM' },
                          ].map((bar, idx) => {
                            const isSelected = selectedBar?.fullDay === bar.fullDay;
                            return (
                              <Pressable
                                key={idx}
                                onPress={() => setSelectedBar(bar)}
                                style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}
                              >
                                <ThemedText style={{ color: isSelected ? theme.primary : theme.textSecondary, fontSize: 8.5, fontFamily: 'Sora_800ExtraBold', marginBottom: 3 }}>
                                  {bar.label}
                                </ThemedText>
                                <View
                                  style={{
                                    height: bar.height,
                                    width: 18,
                                    borderRadius: 9,
                                    backgroundColor: isSelected ? theme.primary : (bar.height > 75 ? theme.secondaryContainer : theme.primary + '25'),
                                    borderWidth: isSelected ? 1.5 : 0,
                                    borderColor: theme.primary,
                                  }}
                                />
                                <ThemedText style={{ marginTop: 4, fontSize: 9.5, color: isSelected ? theme.primary : theme.textSecondary, fontFamily: isSelected ? 'Sora_800ExtraBold' : 'Sora_600SemiBold' }}>
                                  {bar.day}
                                </ThemedText>
                              </Pressable>
                            );
                          })}
                        </View>

                        {/* Selected Bar Detail Tooltip Box */}
                        {selectedBar && (
                          <View style={{ backgroundColor: theme.surfaceHigh + '90', padding: 10, borderRadius: 10, marginTop: 6, borderLeftWidth: 3, borderLeftColor: theme.primary }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                              <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_700Bold', color: theme.text }}>
                                {selectedBar.fullDay}: <ThemedText style={{ color: theme.primary, fontFamily: 'Sora_800ExtraBold' }}>{selectedBar.revenue}</ThemedText>
                              </ThemedText>
                              <ThemedText style={{ fontSize: 9, color: theme.textSecondary, fontFamily: 'Sora_700Bold' }}>
                                🔥 Peak: {selectedBar.peak}
                              </ThemedText>
                            </View>
                            <ThemedText style={{ fontSize: 9.5, color: theme.textSecondary, fontFamily: 'Sora_500Medium', marginTop: 2 }}>
                              📊 {selectedBar.bookings}
                            </ThemedText>
                          </View>
                        )}
                      </View>

                      {/* Monthly Booking Heatmap (Calendar View) Card - Interactive */}
                      <View style={[styles.graphCard, { backgroundColor: theme.surfaceLowest, padding: 16, borderRadius: 12 }, Shadows.level2]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <View style={{ flex: 1 }}>
                            <ThemedText type="labelMd" style={{ color: theme.text, fontFamily: 'Sora_700Bold', letterSpacing: 0.5, fontSize: 13.5 }}>
                              Monthly Booking Heatmap (Calendar View)
                            </ThemedText>
                            <ThemedText style={{ color: '#10b981', fontSize: 10, fontFamily: 'Sora_700Bold', marginTop: 2 }}>
                              82% Average Daily Occupancy · 384 Total Bookings
                            </ThemedText>
                          </View>
                          <Ionicons name="calendar-outline" size={18} color={theme.secondary} />
                        </View>

                        {/* Selected Heatmap Day Details Box */}
                        {selectedHeatmapDay && (
                          <View style={{ backgroundColor: theme.surfaceHigh + '90', padding: 10, borderRadius: 10, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: selectedHeatmapDay.level === 'Peak' ? '#ef4444' : selectedHeatmapDay.level === 'Medium' ? '#f59e0b' : '#94a3b8' }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                              <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_700Bold', color: theme.text }}>
                                {selectedHeatmapDay.label}
                              </ThemedText>
                              <View style={{ backgroundColor: selectedHeatmapDay.level === 'Peak' ? '#ef444420' : selectedHeatmapDay.level === 'Medium' ? '#f59e0b20' : '#94a3b820', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                <ThemedText style={{ fontSize: 8.5, fontFamily: 'Sora_800ExtraBold', color: selectedHeatmapDay.level === 'Peak' ? '#ef4444' : selectedHeatmapDay.level === 'Medium' ? '#d97706' : '#64748b' }}>
                                  {selectedHeatmapDay.occupancy} {selectedHeatmapDay.level}
                                </ThemedText>
                              </View>
                            </View>
                            <ThemedText style={{ fontSize: 9.5, color: theme.textSecondary, fontFamily: 'Sora_500Medium', marginTop: 3 }}>
                              📅 {selectedHeatmapDay.bookings} · 💰 {selectedHeatmapDay.revenue}
                            </ThemedText>
                          </View>
                        )}

                        {/* Calendar Grid Header (Strict 7 equal columns) */}
                        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                            <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                              <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_700Bold', color: theme.textSecondary }}>
                                {d}
                              </ThemedText>
                            </View>
                          ))}
                        </View>

                        {/* Grid Weeks (Strict 7 columns per row, aligned directly under headers) */}
                        {CALENDAR_WEEKS.map((week, wIdx) => (
                          <View key={wIdx} style={{ flexDirection: 'row', gap: 6, marginBottom: 6 }}>
                            {week.map((dayNum, dIdx) => {
                              const isPeak = [1, 4, 5, 8, 10, 11, 14, 15, 17, 18, 21, 22, 24, 25, 28].includes(dayNum);
                              const isMed = [2, 6, 9, 12, 16, 20, 23, 26].includes(dayNum);
                              const level = isPeak ? 'Peak' : isMed ? 'Medium' : 'Low';
                              const bgColor = isPeak ? '#ef4444' : isMed ? '#f59e0b' : theme.surfaceHigh;
                              const textColor = isPeak || isMed ? '#ffffff' : theme.textSecondary;
                              const isSelected = selectedHeatmapDay?.day === dayNum;
                              const dayName = CALENDAR_DAY_NAMES[dIdx];

                              return (
                                <View key={dayNum} style={{ flex: 1, alignItems: 'center' }}>
                                  <Pressable
                                    onPress={() => setSelectedHeatmapDay({
                                      day: dayNum,
                                      label: `${dayName}, Day ${dayNum}`,
                                      occupancy: isPeak ? '94%' : isMed ? '72%' : '45%',
                                      bookings: isPeak ? '16 Slots Booked (1 Free Slot)' : isMed ? '12 Slots Booked (5 Free)' : '7 Slots Booked (10 Free)',
                                      revenue: isPeak ? '₹36,500' : isMed ? '₹24,000' : '₹14,000',
                                      level,
                                    })}
                                    style={{
                                      width: '100%',
                                      maxWidth: 42,
                                      height: 38,
                                      borderRadius: 8,
                                      backgroundColor: bgColor,
                                      justifyContent: 'center',
                                      alignItems: 'center',
                                      borderWidth: isSelected ? 2.5 : 0,
                                      borderColor: isSelected ? theme.text : 'transparent',
                                    }}
                                  >
                                    <ThemedText style={{ color: textColor, fontSize: 11, fontFamily: 'Sora_700Bold' }}>
                                      {dayNum}
                                    </ThemedText>
                                  </Pressable>
                                </View>
                              );
                            })}
                          </View>
                        ))}

                        {/* Legend Footer */}
                        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 14, marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.outlineVariant + '1A' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: theme.surfaceHigh }} />
                            <ThemedText style={{ fontSize: 9.5, color: theme.textSecondary }}>Low (45%)</ThemedText>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#f59e0b' }} />
                            <ThemedText style={{ fontSize: 9.5, color: theme.textSecondary }}>Medium (72%)</ThemedText>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#ef4444' }} />
                            <ThemedText style={{ fontSize: 9.5, color: theme.textSecondary }}>Peak (94%)</ThemedText>
                          </View>
                        </View>
                      </View>
                    </View>
                  ) : role === 'Coach' ? (
                    <View style={[styles.graphCard, { backgroundColor: theme.surfaceLowest }, Shadows.level2]}>
                      <View style={styles.graphHeader}>
                        <ThemedText type="labelMd" style={{ color: theme.text, fontFamily: 'Sora_700Bold', letterSpacing: 0.5 }}>
                          Weekly Trainee Attendance
                        </ThemedText>
                        <Ionicons name="ellipsis-horizontal" size={20} color={theme.textSecondary} />
                      </View>
                      <View style={styles.graphBarsContainer}>
                        <View style={styles.graphBarCol}>
                          <View style={[styles.graphBar, { height: 40, backgroundColor: theme.primary + '1a' }]} />
                          <ThemedText type="labelSm" style={styles.graphBarLabel}>M</ThemedText>
                        </View>
                        <View style={styles.graphBarCol}>
                          <View style={[styles.graphBar, { height: 50, backgroundColor: theme.primary + '1a' }]} />
                          <ThemedText type="labelSm" style={styles.graphBarLabel}>T</ThemedText>
                        </View>
                        <View style={styles.graphBarCol}>
                          <View style={[styles.graphBar, { height: 75, backgroundColor: theme.primary + '1a' }]} />
                          <ThemedText type="labelSm" style={styles.graphBarLabel}>W</ThemedText>
                        </View>
                        <View style={styles.graphBarCol}>
                          <View style={[styles.graphBar, { height: 60, backgroundColor: theme.primary + '1a' }]} />
                          <ThemedText type="labelSm" style={styles.graphBarLabel}>T</ThemedText>
                        </View>
                        <View style={styles.graphBarCol}>
                          <View style={[styles.graphBar, { height: 90, backgroundColor: theme.primary }]} />
                          <ThemedText type="labelSm" style={styles.graphBarLabel}>F</ThemedText>
                        </View>
                        <View style={styles.graphBarCol}>
                          <View style={[styles.graphBar, { height: 80, backgroundColor: theme.secondaryContainer }]} />
                          <ThemedText type="labelSm" style={[styles.graphBarLabel, { color: theme.secondary, fontFamily: 'Sora_700Bold' }]}>S</ThemedText>
                        </View>
                        <View style={styles.graphBarCol}>
                          <View style={[styles.graphBar, { height: 55, backgroundColor: theme.primary + '1a' }]} />
                          <ThemedText type="labelSm" style={styles.graphBarLabel}>S</ThemedText>
                        </View>
                      </View>
                    </View>
                  ) : role === 'Organizer' ? (
                    <View style={[styles.graphCard, { backgroundColor: theme.surfaceLowest }, Shadows.level2]}>
                      <View style={styles.graphHeader}>
                        <ThemedText type="labelMd" style={{ color: theme.text, fontFamily: 'Sora_700Bold', letterSpacing: 0.5 }}>
                          Weekly Tournament Attendance
                        </ThemedText>
                        <Ionicons name="ellipsis-horizontal" size={20} color={theme.textSecondary} />
                      </View>
                      <View style={styles.graphBarsContainer}>
                        <View style={styles.graphBarCol}>
                          <View style={[styles.graphBar, { height: 60, backgroundColor: theme.primary + '1a' }]} />
                          <ThemedText type="labelSm" style={styles.graphBarLabel}>M</ThemedText>
                        </View>
                        <View style={styles.graphBarCol}>
                          <View style={[styles.graphBar, { height: 75, backgroundColor: theme.primary + '1a' }]} />
                          <ThemedText type="labelSm" style={styles.graphBarLabel}>T</ThemedText>
                        </View>
                        <View style={styles.graphBarCol}>
                          <View style={[styles.graphBar, { height: 80, backgroundColor: theme.primary + '1a' }]} />
                          <ThemedText type="labelSm" style={styles.graphBarLabel}>W</ThemedText>
                        </View>
                        <View style={styles.graphBarCol}>
                          <View style={[styles.graphBar, { height: 95, backgroundColor: theme.secondaryContainer }]} />
                          <ThemedText type="labelSm" style={[styles.graphBarLabel, { color: theme.secondary, fontFamily: 'Sora_700Bold' }]}>T</ThemedText>
                        </View>
                        <View style={styles.graphBarCol}>
                          <View style={[styles.graphBar, { height: 85, backgroundColor: theme.primary }]} />
                          <ThemedText type="labelSm" style={styles.graphBarLabel}>F</ThemedText>
                        </View>
                        <View style={styles.graphBarCol}>
                          <View style={[styles.graphBar, { height: 50, backgroundColor: theme.primary + '1a' }]} />
                          <ThemedText type="labelSm" style={styles.graphBarLabel}>S</ThemedText>
                        </View>
                        <View style={styles.graphBarCol}>
                          <View style={[styles.graphBar, { height: 40, backgroundColor: theme.primary + '1a' }]} />
                          <ThemedText type="labelSm" style={styles.graphBarLabel}>S</ThemedText>
                        </View>
                      </View>
                    </View>
                  ) : (
                    <View style={[styles.graphCard, { backgroundColor: theme.surfaceLowest }, Shadows.level2]}>
                      <View style={styles.graphHeader}>
                        <ThemedText type="labelMd" style={{ color: theme.text, fontFamily: 'Sora_700Bold', letterSpacing: 0.5 }}>
                          Weekly Performance
                        </ThemedText>
                        <Ionicons name="ellipsis-horizontal" size={20} color={theme.textSecondary} />
                      </View>
                      <View style={styles.graphBarsContainer}>
                        <View style={styles.graphBarCol}>
                          <View style={[styles.graphBar, { height: 40, backgroundColor: theme.primary + '1a' }]} />
                          <ThemedText type="labelSm" style={styles.graphBarLabel}>M</ThemedText>
                        </View>
                        <View style={styles.graphBarCol}>
                          <View style={[styles.graphBar, { height: 55, backgroundColor: theme.primary + '1a' }]} />
                          <ThemedText type="labelSm" style={styles.graphBarLabel}>T</ThemedText>
                        </View>
                        <View style={styles.graphBarCol}>
                          <View style={[styles.graphBar, { height: 75, backgroundColor: theme.secondaryContainer }]} />
                          <ThemedText type="labelSm" style={[styles.graphBarLabel, { color: theme.secondary, fontFamily: 'Sora_700Bold' }]}>W</ThemedText>
                        </View>
                        <View style={styles.graphBarCol}>
                          <View style={[styles.graphBar, { height: 90, backgroundColor: theme.primary }]} />
                          <ThemedText type="labelSm" style={styles.graphBarLabel}>T</ThemedText>
                        </View>
                        <View style={styles.graphBarCol}>
                          <View style={[styles.graphBar, { height: 35, backgroundColor: theme.primary + '1a' }]} />
                          <ThemedText type="labelSm" style={styles.graphBarLabel}>F</ThemedText>
                        </View>
                        <View style={styles.graphBarCol}>
                          <View style={[styles.graphBar, { height: 50, backgroundColor: theme.primary + '1a' }]} />
                          <ThemedText type="labelSm" style={styles.graphBarLabel}>S</ThemedText>
                        </View>
                        <View style={styles.graphBarCol}>
                          <View style={[styles.graphBar, { height: 60, backgroundColor: theme.primary + '1a' }]} />
                          <ThemedText type="labelSm" style={styles.graphBarLabel}>S</ThemedText>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              </>
            )}
          </ScrollView>
        </Reanimated.View>
      </SafeAreaView>
      <CoinTossModal visible={coinTossVisible} onClose={() => setCoinTossVisible(false)} />
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
    paddingHorizontal: Spacing.containerMargin,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#0000000a',
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#5D68E8', // Gold ring around avatar
  },
  headerTextGroup: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  iconButton: {
    padding: 4,
  },
  profileIconButton: {
    padding: 2,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.containerMargin,
  },
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.containerMargin,
    position: 'relative',
    minHeight: 65,
  },
  welcomeTextContainer: {
    width: '65%',
    justifyContent: 'center',
  },
  welcomeHeadline: {
    marginTop: Spacing.xs,
    fontFamily: 'Sora_700Bold',
    lineHeight: 32,
  },
  welcomeIllustration: {
    width: 110,
    height: 110,
    position: 'absolute',
    right: Spacing.containerMargin,
    opacity: 0.95,
  },
  dailyPlanCard: {
    borderRadius: 12,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  planInfo: {
    flex: 1,
  },
  viewTasksButton: {
    marginTop: Spacing.sm,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  progressRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRingInner: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 7,
    position: 'absolute',
    top: -7,
    left: -7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: Spacing.md,
  },
  scheduleList: {
    gap: Spacing.sm,
  },
  scheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#c3c7cb33',
    position: 'relative',
  },
  scheduleIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    overflow: 'hidden',
  },
  scheduleIllustration: {
    width: 32,
    height: 32,
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleTitle: {
    fontSize: 13.8,
    fontFamily: 'Sora_700Bold',
  },
  scheduleTimeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,
    gap: 4,
  },
  scheduleTimeText: {
    color: '#43474b',
    fontSize: 12,
    flex: 1,
  },
  scheduleTimeIcon: {
    marginTop: 1.5,
  },
  scheduleDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    paddingLeft: 18,
  },
  scheduleDetailsText: {
    color: '#43474b',
    fontSize: 11.5,
    fontFamily: 'Sora_600SemiBold',
  },
  bentoRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  bentoCell: {
    flex: 1,
    borderRadius: BorderRadius.premium,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#c3c7cb33',
    aspectRatio: 1,
    justifyContent: 'space-between',
  },
  bentoIconWrap: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  bentoTextWrap: {
    marginTop: Spacing.lg,
  },
  graphCard: {
    borderRadius: BorderRadius.premium,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#c3c7cb33',
  },
  graphHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  graphBarsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
    paddingHorizontal: Spacing.xs,
  },
  graphBarCol: {
    alignItems: 'center',
    flex: 1,
  },
  graphBar: {
    width: 14,
    borderRadius: 4,
  },
  graphBarLabel: {
    marginTop: Spacing.sm,
    color: '#81919c',
    fontSize: 10,
  },
  featuredTurfsScroll: {
    paddingHorizontal: Spacing.xs,
    gap: 12,
    paddingBottom: Spacing.xs,
  },
  featuredTurfCard: {
    width: 170,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#c3c7cb33',
  },
  featuredTurfImage: {
    width: '100%',
    height: 100,
  },
  featuredTurfContent: {
    padding: 10,
  },
  featuredTurfHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  featuredTurfRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredTurfTitle: {
    fontSize: 12.5,
    fontFamily: 'Sora_700Bold',
    marginBottom: 2,
  },
  featuredTurfLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featuredTurfFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  featuredTurfBookBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  },
  actionCardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    borderRadius: 12,
    padding: Spacing.md,
    justifyContent: 'space-between',
    minHeight: 170,
  },
  actionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionCardBody: {
    marginVertical: Spacing.sm,
  },
  actionCardTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Sora_700Bold',
    marginBottom: 2,
  },
  actionCardDesc: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10.5,
    lineHeight: 14,
  },
  actionCardBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.xs,
  },
  offersEntryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: 14,
    marginTop: Spacing.sm,
  },
  offersEntryIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  advertisementCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: 16,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  analyticsPremiumCard: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    minHeight: 210,
  },
  analyticsOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    zIndex: 2,
  },
  analyticsGlassCell: {
    width: '48.2%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: BorderRadius.lg,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  analyticsIconBg: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyticsLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    fontFamily: 'Sora_700Bold',
  },
  analyticsValue: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Sora_800ExtraBold',
  },
  analyticsUnit: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    fontFamily: 'Sora_500Medium',
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 3,
  },
  trendText: {
    color: '#4ade80',
    fontSize: 9,
    fontFamily: 'Sora_700Bold',
  },
});
