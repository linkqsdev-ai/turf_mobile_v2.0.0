import React, { useMemo, useState } from 'react';
import { StyleSheet, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Reanimated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useUserProfile, getShortLocation } from '@/hooks/use-user-profile';
import { getAvatarSource } from '@/constants/avatars';
import { AutoScrollingHorizontalBanners, BANNER_DESIGNS_10, type PromoBannerProps } from '@/components/promo-banner';
import { MotionIllustration } from '@/components/motion-illustration';
import {
  StatTile,
  IllustratedTile,
  SectionHeading,
  PressCard,
  PulseDot,
} from '@/components/home/dashboard-widgets';
import { useOfferStore, useBookings, useTurfStore } from '@/store/app-store';
import { isExpired } from '@/store/offer-store';

/** Announcement banners — tournament news surfaced in the feed. */
const announcementBanners = (go: (path: any) => void): PromoBannerProps[] => [
  {
    title: 'Grand Summer Tournament!',
    subtitle: 'Register your team, compete in the League and win ₹50,000 + kit gifts!',
    buttonText: 'Register Team',
    isGradient: true,
    gradientColors: ['rgba(0, 200, 120, 0.75)', 'rgba(0, 120, 90, 0.95)'] as [string, string],
    titleColor: '#ffffff',
    subtitleColor: 'rgba(255, 255, 255, 0.95)',
    buttonBackgroundColor: '#ffffff',
    buttonTextColor: '#00734d',
    backgroundImage: require('@/assets/images/illustrations/summer_tournament_banner_bg.png'),
    onPress: () => go('/(tabs)/tournaments'),
  },
  {
    title: 'Weekend Champions League!',
    subtitle: '20% discount on team registrations this weekend. Limited slots!',
    buttonText: 'Join Tournament',
    isGradient: true,
    gradientColors: ['rgba(255, 122, 26, 0.78)', 'rgba(200, 80, 10, 0.95)'] as [string, string],
    titleColor: '#ffffff',
    subtitleColor: 'rgba(255, 255, 255, 0.95)',
    buttonBackgroundColor: '#ffffff',
    buttonTextColor: '#c8500a',
    backgroundImage: require('@/assets/images/illustrations/tournament_hero.png'),
    onPress: () => go('/(tabs)/tournaments'),
  },
  {
    title: 'Night Knockout Super Cup!',
    subtitle: 'Under-the-lights series with trophy and cash prize rewards.',
    buttonText: 'Compete Now',
    isGradient: true,
    gradientColors: ['rgba(59, 158, 255, 0.75)', 'rgba(20, 80, 160, 0.95)'] as [string, string],
    titleColor: '#ffffff',
    subtitleColor: 'rgba(255, 255, 255, 0.95)',
    buttonBackgroundColor: '#ffffff',
    buttonTextColor: '#1450a0',
    backgroundImage: require('@/assets/images/illustrations/tournament_cover.png'),
    onPress: () => go('/(tabs)/tournaments'),
  },
];

const CALENDAR_WEEKS = [
  [1, 2, 3, 4, 5, 6, 7],
  [8, 9, 10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19, 20, 21],
  [22, 23, 24, 25, 26, 27, 28],
];

const CALENDAR_DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function OwnerDashboard({
  refreshing,
  onRefresh,
  onOpenNotifications,
  onOpenCoinToss,
}: {
  refreshing?: boolean;
  onRefresh?: () => void;
  onOpenNotifications?: () => void;
  onOpenCoinToss?: () => void;
}) {
  const router = useRouter();
  const theme = useTheme();
  const { profile } = useUserProfile();
  const { offers } = useOfferStore();
  const { bookings } = useBookings();
  const { ownedTurfs } = useTurfStore();

  const go = (path: any) => router.push(path);

  const ownerLiveOfferCount = useMemo(
    () => offers.filter(o => o.status === 'active' && !isExpired(o)).length,
    [offers]
  );
  const ownerRedemptionCount = useMemo(
    () => offers.reduce((sum, o) => sum + o.redeemedCount, 0),
    [offers]
  );

  // Weekly bar selection state
  const [selectedBar, setSelectedBar] = useState<{
    day: string;
    fullDay: string;
    revenue: string;
    label: string;
    height: number;
    bookings: string;
    peak: string;
  } | null>({
    day: 'F',
    fullDay: 'Friday',
    revenue: '₹28,000',
    label: '28k',
    height: 95,
    bookings: '12 Turf Bookings + 4 Coaching Sessions',
    peak: '5:00 PM - 10:00 PM',
  });

  // Heatmap day selection state
  const [selectedHeatmapDay, setSelectedHeatmapDay] = useState<{
    day: number;
    label: string;
    occupancy: string;
    bookings: string;
    revenue: string;
    level: 'Low' | 'Medium' | 'Peak';
  } | null>({
    day: 14,
    label: 'Sunday, Day 14',
    occupancy: '94%',
    bookings: '16 Slots Booked (1 Free Slot)',
    revenue: '₹36,500 Total Revenue',
    level: 'Peak',
  });

  const accent = '#F59E0B';
  const info = '#3B82F6';
  const success = '#10B981';

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Ambient floodlight wash */}
      <LinearGradient
        colors={[theme.primary + '26', theme.primary + '0A', 'transparent']}
        style={styles.ambient}
        pointerEvents="none"
      />

      <SafeAreaView edges={['top']} style={styles.flex}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={!!refreshing}
                onRefresh={onRefresh}
                tintColor={theme.primary}
                colors={[theme.primary]}
              />
            ) : undefined
          }
        >
          {/* ── Top App Bar (Consistent across tabs) ────────────────── */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Pressable style={styles.profileIconButton} onPress={() => go('/profile')}>
                <Image
                  source={getAvatarSource(profile.avatarUrl)}
                  style={styles.headerAvatar}
                  contentFit="cover"
                />
              </Pressable>
              <View style={styles.headerTextGroup}>
                <ThemedText
                  type="bodyMd"
                  style={{ color: theme.text, fontFamily: 'Sora_700Bold', lineHeight: 18 }}
                >
                  {profile.name}
                </ThemedText>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                  <Ionicons name="location-sharp" size={12} color={theme.secondary} />
                  <ThemedText
                    type="labelSm"
                    style={{ color: theme.textSecondary, marginLeft: 2, fontSize: 10 }}
                  >
                    {getShortLocation(profile.location)}
                  </ThemedText>
                </View>
              </View>
            </View>
            <View style={styles.headerRightActions}>
              <Pressable
                style={styles.iconButton}
                onPress={onOpenNotifications}
                accessibilityLabel="Notifications"
              >
                <Ionicons name="notifications-outline" size={20} color={theme.secondary} />
              </Pressable>
              <Pressable
                style={styles.iconButton}
                onPress={onOpenCoinToss}
                accessibilityLabel="Coin toss"
              >
                <Image
                  source={require('@/assets/images/coin_toss_icon.png')}
                  style={{ width: 26, height: 26 }}
                  contentFit="contain"
                />
              </Pressable>
            </View>
          </View>

          {/* ── Hero Band ───────────────────────────────────────────── */}
          <Reanimated.View entering={FadeInDown.delay(110).duration(460)} style={styles.section}>
            <View
              style={[
                styles.heroCard,
                { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' },
                Shadows.level2,
              ]}
            >
              <LinearGradient
                colors={[theme.primary + '26', info + '10', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.heroBody}>
                <View style={styles.heroText}>
                  <View style={[styles.heroBadge, { backgroundColor: theme.primary + '22' }]}>
                    <ThemedText style={[styles.heroBadgeText, { color: theme.primary }]}>
                      ARENA MANAGER
                    </ThemedText>
                  </View>
                  <ThemedText style={[styles.heroTitle, { color: theme.text }]}>
                    Manage Your Arena
                  </ThemedText>
                  <ThemedText style={[styles.heroSub, { color: theme.textSecondary }]}>
                    8 of 12 slots booked today (67% occupancy)
                  </ThemedText>
                </View>
                <MotionIllustration
                  scenario="home"
                  size={104}
                  glow={[theme.primary + '33', theme.primary + '00']}
                  accents={[
                    { name: 'trending-up', color: theme.primary },
                    { name: 'flame', color: accent },
                    { name: 'star', color: info },
                  ]}
                  accessibilityLabel="Owner dashboard hero"
                />
              </View>
            </View>
          </Reanimated.View>

          {/* ── Stat Ribbon ─────────────────────────────────────────── */}
          <Reanimated.View entering={FadeInDown.delay(170).duration(460)} style={styles.statRow}>
            <StatTile label="Revenue" value={18500} prefix="₹" icon="trending-up-outline" tint={success} />
            <StatTile label="Occupancy" value={67} suffix="%" icon="pie-chart-outline" tint={theme.primary} />
            <StatTile label="Bookings" value={8} icon="time-outline" tint={info} />
            <StatTile label="Dues" value={2400} prefix="₹" icon="wallet-outline" tint={accent} />
          </Reanimated.View>

          {/* ── Quick Action Destination Tiles ──────────────────────── */}
          <Reanimated.View entering={FadeInDown.delay(220).duration(460)} style={styles.section}>
            <SectionHeading title="Venue Management" />
            <View style={styles.tileGrid}>
              <View style={styles.gridTile}>
                <IllustratedTile
                  title="Create Slot"
                  subtitle="Open peak slots & court timings"
                  art={require('@/assets/images/illustrations/turf_booking_premium.png')}
                  tint="#00C878"
                  icon="clock-plus-outline"
                  badge="Slots"
                  onPress={() => go('/create-turf')}
                />
              </View>
              <View style={styles.gridTile}>
                <IllustratedTile
                  title="Pricing / Rates"
                  subtitle="Configure peak & off-peak rates"
                  art={require('@/assets/images/illustrations/quick_matches_premium.png')}
                  tint="#FFB020"
                  icon="currency-inr"
                  badge="Rates"
                  onPress={() => go('/create-turf')}
                />
              </View>
              <View style={styles.gridTile}>
                <IllustratedTile
                  title="My Pitches"
                  subtitle="Facility status & maintenance"
                  art={require('@/assets/images/illustrations/coaching_class_premium.png')}
                  tint="#3B9EFF"
                  icon="stadium-variant"
                  badge="Courts"
                  onPress={() => go('/(tabs)/coach')}
                />
              </View>
              <View style={styles.gridTile}>
                <IllustratedTile
                  title="Vouchers"
                  subtitle={`${ownerLiveOfferCount} live · ${ownerRedemptionCount} redeemed`}
                  art={require('@/assets/images/illustrations/tournament_bracket_premium.png')}
                  tint="#A66BFF"
                  icon="ticket-percent-outline"
                  badge="Promo"
                  onPress={() => go('/owner-offers')}
                />
              </View>
            </View>
          </Reanimated.View>

          {/* ── Business Analytics Bento Cards ──────────────────────── */}
          <Reanimated.View entering={FadeInDown.delay(260).duration(460)} style={styles.section}>
            <SectionHeading title="Business Analytics" />
            <View style={styles.bentoRow}>
              {/* Revenue Card */}
              <View style={[styles.bentoCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                <Image
                  source={require('@/assets/images/illustrations/business_analytics_revenue_bg.png')}
                  style={styles.bentoArt}
                  contentFit="contain"
                />
                <View style={styles.bentoHeader}>
                  <View style={[styles.bentoIconWrap, { backgroundColor: theme.surface }]}>
                    <Ionicons name="cash-outline" size={17} color={theme.primary} />
                  </View>
                  <ThemedText style={{ color: success, fontSize: 9.5, fontFamily: 'Sora_700Bold' }}>
                    +15% vs Wk
                  </ThemedText>
                </View>
                <View style={{ marginTop: 8 }}>
                  <ThemedText style={[styles.bentoLabel, { color: theme.textSecondary }]}>
                    Today's Revenue
                  </ThemedText>
                  <ThemedText style={[styles.bentoValue, { color: theme.text }]}>
                    ₹18,500
                  </ThemedText>
                </View>
                <View style={[styles.bentoFooter, { borderTopColor: theme.outlineVariant + '20' }]}>
                  <ThemedText style={[styles.bentoFooterText, { color: theme.textSecondary }]}>
                    8 Slots · Avg ₹2.3k/slot
                  </ThemedText>
                  <ThemedText style={[styles.bentoTag, { color: success }]}>
                    🔥 Peak: 6 - 9 PM
                  </ThemedText>
                </View>
              </View>

              {/* Pending Payments Card */}
              <View style={[styles.bentoCard, { backgroundColor: theme.primaryContainer }, Shadows.level3]}>
                <Image
                  source={require('@/assets/images/illustrations/business_analytics_dues_bg.png')}
                  style={styles.bentoArt}
                  contentFit="contain"
                />
                <View style={styles.bentoHeader}>
                  <View style={[styles.bentoIconWrap, { backgroundColor: 'rgba(255, 255, 255, 0.18)' }]}>
                    <Ionicons name="wallet-outline" size={17} color="#ffffff" />
                  </View>
                  <ThemedText style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 9.5, fontFamily: 'Sora_700Bold' }}>
                    3 Pending
                  </ThemedText>
                </View>
                <View style={{ marginTop: 8 }}>
                  <ThemedText style={[styles.bentoLabel, { color: 'rgba(255, 255, 255, 0.85)' }]}>
                    Unpaid Dues
                  </ThemedText>
                  <ThemedText style={[styles.bentoValue, { color: '#ffffff' }]}>
                    ₹2,400
                  </ThemedText>
                </View>
                <View style={[styles.bentoFooter, { borderTopColor: 'rgba(255, 255, 255, 0.15)' }]}>
                  <ThemedText style={[styles.bentoFooterText, { color: 'rgba(255, 255, 255, 0.85)' }]}>
                    Overdue: ₹1,400
                  </ThemedText>
                  <ThemedText style={[styles.bentoTag, { color: '#fbbf24' }]}>
                    ⚡ 2 Reminders Sent
                  </ThemedText>
                </View>
              </View>
            </View>
          </Reanimated.View>

          {/* ── Weekly Revenue Trend Graph ──────────────────────────── */}
          <Reanimated.View entering={FadeInDown.delay(300).duration(460)} style={styles.section}>
            <SectionHeading title="Weekly Revenue Trend" />
            <View style={[styles.card, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
              <View style={styles.graphHeader}>
                <View style={{ flex: 1 }}>
                  <ThemedText style={[styles.cardHeading, { color: theme.text }]}>
                    Weekly Revenue Trend (₹)
                  </ThemedText>
                  <ThemedText style={{ color: success, fontSize: 10.5, fontFamily: 'Sora_600SemiBold', marginTop: 2 }}>
                    Total: ₹1,35,000 · +18.4% vs Last Week
                  </ThemedText>
                </View>
                <Ionicons name="stats-chart" size={18} color={theme.primary} />
              </View>

              {/* Interactive Bar Chart */}
              <View style={styles.barChartRow}>
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
                      style={styles.barColumn}
                    >
                      <ThemedText style={{ color: isSelected ? theme.primary : theme.textSecondary, fontSize: 8.5, fontFamily: 'Sora_700Bold', marginBottom: 3 }}>
                        {bar.label}
                      </ThemedText>
                      <View
                        style={[
                          styles.barPill,
                          {
                            height: bar.height,
                            backgroundColor: isSelected ? theme.primary : (bar.height > 75 ? theme.secondaryContainer : theme.primary + '25'),
                            borderWidth: isSelected ? 1.5 : 0,
                            borderColor: theme.primary,
                          }
                        ]}
                      />
                      <ThemedText style={{ marginTop: 4, fontSize: 9.5, color: isSelected ? theme.primary : theme.textSecondary, fontFamily: isSelected ? 'Sora_700Bold' : 'Sora_500Medium' }}>
                        {bar.day}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>

              {/* Selected Bar Detail Tooltip */}
              {selectedBar && (
                <View style={[styles.tooltipBox, { backgroundColor: theme.surfaceLow, borderLeftColor: theme.primary }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_600SemiBold', color: theme.text }}>
                      {selectedBar.fullDay}: <ThemedText style={{ color: theme.primary, fontFamily: 'Sora_700Bold' }}>{selectedBar.revenue}</ThemedText>
                    </ThemedText>
                    <ThemedText style={{ fontSize: 9, color: theme.textSecondary, fontFamily: 'Sora_600SemiBold' }}>
                      🔥 Peak: {selectedBar.peak}
                    </ThemedText>
                  </View>
                  <ThemedText style={{ fontSize: 9.5, color: theme.textSecondary, fontFamily: 'Sora_400Regular', marginTop: 2 }}>
                    📊 {selectedBar.bookings}
                  </ThemedText>
                </View>
              )}
            </View>
          </Reanimated.View>

          {/* ── Monthly Booking Heatmap ─────────────────────────────── */}
          <Reanimated.View entering={FadeInDown.delay(340).duration(460)} style={styles.section}>
            <SectionHeading title="Monthly Booking Heatmap" />
            <View style={[styles.card, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <View style={{ flex: 1 }}>
                  <ThemedText style={[styles.cardHeading, { color: theme.text }]}>
                    Calendar Heatmap
                  </ThemedText>
                  <ThemedText style={{ color: success, fontSize: 10.5, fontFamily: 'Sora_600SemiBold', marginTop: 2 }}>
                    82% Average Daily Occupancy · 384 Bookings
                  </ThemedText>
                </View>
                <Ionicons name="calendar-outline" size={18} color={theme.secondary} />
              </View>

              {/* Selected Heatmap Day Details */}
              {selectedHeatmapDay && (
                <View style={[styles.tooltipBox, { backgroundColor: theme.surfaceLow, borderLeftColor: selectedHeatmapDay.level === 'Peak' ? '#ef4444' : selectedHeatmapDay.level === 'Medium' ? '#f59e0b' : '#94a3b8' }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_600SemiBold', color: theme.text }}>
                      {selectedHeatmapDay.label}
                    </ThemedText>
                    <View style={{ backgroundColor: selectedHeatmapDay.level === 'Peak' ? '#ef444420' : selectedHeatmapDay.level === 'Medium' ? '#f59e0b20' : '#94a3b820', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                      <ThemedText style={{ fontSize: 8.5, fontFamily: 'Sora_700Bold', color: selectedHeatmapDay.level === 'Peak' ? '#ef4444' : selectedHeatmapDay.level === 'Medium' ? '#d97706' : '#64748b' }}>
                        {selectedHeatmapDay.occupancy} {selectedHeatmapDay.level}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText style={{ fontSize: 9.5, color: theme.textSecondary, fontFamily: 'Sora_400Regular', marginTop: 3 }}>
                    📅 {selectedHeatmapDay.bookings} · 💰 {selectedHeatmapDay.revenue}
                  </ThemedText>
                </View>
              )}

              {/* Calendar Grid Header */}
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                  <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                    <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_600SemiBold', color: theme.textSecondary }}>
                      {d}
                    </ThemedText>
                  </View>
                ))}
              </View>

              {/* Grid Weeks */}
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
                          <ThemedText style={{ color: textColor, fontSize: 11, fontFamily: 'Sora_600SemiBold' }}>
                            {dayNum}
                          </ThemedText>
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              ))}

              {/* Legend Footer */}
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendBox, { backgroundColor: theme.surfaceHigh }]} />
                  <ThemedText style={styles.legendText}>Low (45%)</ThemedText>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendBox, { backgroundColor: '#f59e0b' }]} />
                  <ThemedText style={styles.legendText}>Medium (72%)</ThemedText>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendBox, { backgroundColor: '#ef4444' }]} />
                  <ThemedText style={styles.legendText}>Peak (94%)</ThemedText>
                </View>
              </View>
            </View>
          </Reanimated.View>

          {/* ── Today's Turf Bookings Timeline ──────────────────────── */}
          <Reanimated.View entering={FadeInDown.delay(380).duration(460)} style={styles.section}>
            <SectionHeading
              title="Today's Turf Bookings"
              action={{ label: 'Full schedule', onPress: () => go('/(tabs)/coach') }}
            />
            <View style={{ gap: 10 }}>
              {/* Booking 1 */}
              <View style={[styles.bookingCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '25' }, Shadows.level2]}>
                <View style={[styles.bookingIconWrap, { backgroundColor: theme.primary + '18' }]}>
                  <Ionicons name="football" size={17} color={theme.primary} />
                </View>
                <View style={{ flex: 1, marginHorizontal: 8, gap: 3 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <ThemedText style={[styles.bookingTitle, { color: theme.text }]} numberOfLines={1}>
                      Footy Club Match Booking
                    </ThemedText>
                    <ThemedText style={[styles.bookingRef, { color: theme.textSecondary }]}>#B902</ThemedText>
                  </View>
                  <View style={styles.metaRow}>
                    <Ionicons name="time-outline" size={11} color={theme.textSecondary} />
                    <ThemedText style={[styles.metaText, { color: theme.textSecondary }]}>
                      17:00 - 18:30 • Pitch A (90 mins)
                    </ThemedText>
                  </View>
                  <View style={styles.metaRow}>
                    <Ionicons name="person-outline" size={11} color={theme.textSecondary} />
                    <ThemedText style={[styles.metaText, { color: theme.textSecondary }]}>
                      Booked by: Alex Turner (UPI Paid)
                    </ThemedText>
                  </View>
                  <View style={styles.paymentRow}>
                    <ThemedText style={[styles.priceTag, { color: theme.text }]}>₹2,500</ThemedText>
                    <ThemedText style={{ color: success, fontSize: 9, fontFamily: 'Sora_700Bold' }}>
                      Fully Paid
                    </ThemedText>
                    <ThemedText style={{ color: theme.textSecondary, fontSize: 9, fontFamily: 'Sora_400Regular' }}>
                      · Online
                    </ThemedText>
                  </View>
                </View>
                <View style={[styles.statusTag, { backgroundColor: '#ef444415' }]}>
                  <PulseDot color="#ef4444" size={6} />
                  <ThemedText style={{ fontSize: 8.5, fontFamily: 'Sora_700Bold', color: '#ef4444' }}>LIVE</ThemedText>
                </View>
              </View>

              {/* Booking 2 */}
              <View style={[styles.bookingCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '25' }, Shadows.level2]}>
                <View style={[styles.bookingIconWrap, { backgroundColor: accent + '18' }]}>
                  <MaterialCommunityIcons name="cricket" size={17} color="#d97706" />
                </View>
                <View style={{ flex: 1, marginHorizontal: 8, gap: 3 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <ThemedText style={[styles.bookingTitle, { color: theme.text }]} numberOfLines={1}>
                      Corporate Cricket Match
                    </ThemedText>
                    <ThemedText style={[styles.bookingRef, { color: theme.textSecondary }]}>#B211</ThemedText>
                  </View>
                  <View style={styles.metaRow}>
                    <Ionicons name="time-outline" size={11} color={theme.textSecondary} />
                    <ThemedText style={[styles.metaText, { color: theme.textSecondary }]}>
                      19:00 - 21:00 • Pitch B (120 mins)
                    </ThemedText>
                  </View>
                  <View style={styles.metaRow}>
                    <Ionicons name="person-outline" size={11} color={theme.textSecondary} />
                    <ThemedText style={[styles.metaText, { color: theme.textSecondary }]}>
                      Booked by: Suresh Raina (Partial Advance)
                    </ThemedText>
                  </View>
                  <View style={styles.paymentRow}>
                    <ThemedText style={[styles.priceTag, { color: theme.text }]}>₹3,600</ThemedText>
                    <ThemedText style={{ color: '#d97706', fontSize: 9, fontFamily: 'Sora_700Bold' }}>
                      Advance Paid (₹1,000)
                    </ThemedText>
                    <ThemedText style={{ color: '#ef4444', fontSize: 9, fontFamily: 'Sora_600SemiBold' }}>
                      · ₹2,600 Due
                    </ThemedText>
                  </View>
                </View>
                <View style={[styles.statusTag, { backgroundColor: accent + '15' }]}>
                  <ThemedText style={{ fontSize: 8.5, fontFamily: 'Sora_700Bold', color: '#d97706' }}>UPCOMING</ThemedText>
                </View>
              </View>
            </View>
          </Reanimated.View>

          {/* ── Special Deals & Vouchers ────────────────────────────── */}
          <Reanimated.View entering={FadeInDown.delay(420).duration(460)} style={styles.sectionBleed}>
            <View style={styles.sectionInset}>
              <SectionHeading title="Special Deals & Vouchers" />
            </View>
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
          </Reanimated.View>

          {/* ── Tournament Announcements ───────────────────────────── */}
          <Reanimated.View entering={FadeInDown.delay(460).duration(460)} style={[styles.sectionBleed, { paddingBottom: 16 }]}>
            <View style={styles.sectionInset}>
              <SectionHeading title="Tournament Announcements" tint={accent} />
            </View>
            <AutoScrollingHorizontalBanners
              cardWidth={310}
              gap={14}
              banners={announcementBanners(go)}
            />
          </Reanimated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const GUTTER = Spacing.containerMargin;

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  ambient: { position: 'absolute', top: 0, left: 0, right: 0, height: 340 },
  scrollContent: { paddingBottom: 130 },

  section: { paddingHorizontal: GUTTER, marginTop: Spacing.lg },
  sectionBleed: { marginTop: Spacing.lg },
  sectionInset: { paddingHorizontal: GUTTER },

  // top app bar
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: GUTTER,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#0000000a',
    zIndex: 10,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#5D68E8',
  },
  headerTextGroup: { flexDirection: 'column', justifyContent: 'center' },
  headerRightActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  iconButton: { padding: 4 },
  profileIconButton: { padding: 2 },

  // hero
  heroCard: { borderRadius: BorderRadius.premium, borderWidth: 1, overflow: 'hidden' },
  heroBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  heroText: { flex: 1, paddingRight: 8 },
  heroBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 7,
  },
  heroBadgeText: { fontFamily: 'Sora_700Bold', fontSize: 8.5, letterSpacing: 0.8 },
  heroTitle: { fontFamily: 'Sora_600SemiBold', fontSize: 17, letterSpacing: -0.2 },
  heroSub: { fontFamily: 'Sora_400Regular', fontSize: 11.5, marginTop: 3, lineHeight: 16 },

  // stats
  statRow: { flexDirection: 'row', gap: 8, paddingHorizontal: GUTTER, marginTop: 12 },

  // tiles
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridTile: { width: '47.8%' },

  // bento
  bentoRow: { flexDirection: 'row', gap: 10 },
  bentoCard: {
    flex: 1,
    borderRadius: BorderRadius.premium,
    padding: Spacing.md,
    minHeight: 140,
    justifyContent: 'space-between',
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  bentoArt: { position: 'absolute', right: -12, bottom: -12, width: 115, height: 115, opacity: 0.18 },
  bentoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 },
  bentoIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  bentoLabel: { fontFamily: 'Sora_500Medium', fontSize: 10.5 },
  bentoValue: { fontFamily: 'Sora_600SemiBold', fontSize: 16, marginTop: 2 },
  bentoFooter: { borderTopWidth: 1, paddingTop: 6, marginTop: 6, zIndex: 2 },
  bentoFooterText: { fontFamily: 'Sora_400Regular', fontSize: 9.5 },
  bentoTag: { fontFamily: 'Sora_600SemiBold', fontSize: 8.5, marginTop: 2 },

  // card & graphs
  card: { borderRadius: BorderRadius.premium, padding: Spacing.md, borderWidth: 1 },
  graphHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardHeading: { fontFamily: 'Sora_500Medium', fontSize: 14, letterSpacing: -0.1 },
  barChartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 110, marginTop: 14, marginBottom: 8 },
  barColumn: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  barPill: { width: 18, borderRadius: 9 },
  tooltipBox: { padding: 10, borderRadius: 10, marginTop: 6, borderLeftWidth: 3 },

  // legend
  legendRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 14, marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#0000000f' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendBox: { width: 10, height: 10, borderRadius: 2 },
  legendText: { fontSize: 9.5, fontFamily: 'Sora_400Regular', color: '#64748b' },

  // bookings timeline
  bookingCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: BorderRadius.premium,
    borderWidth: 1,
  },
  bookingIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  bookingTitle: { fontFamily: 'Sora_500Medium', fontSize: 13 },
  bookingRef: { fontFamily: 'Sora_400Regular', fontSize: 9.5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  metaText: { fontFamily: 'Sora_400Regular', fontSize: 10.5 },
  paymentRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, paddingTop: 4, borderTopWidth: 1, borderTopColor: '#0000000f' },
  priceTag: { fontFamily: 'Sora_600SemiBold', fontSize: 12 },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },
});
