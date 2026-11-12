import React, { useMemo, useState } from 'react';
import { openProfileDrawer } from '@/components/profile-drawer';
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
import { AutoScrollingHorizontalBanners, type PromoBannerProps } from '@/components/promo-banner';
import { MotionIllustration } from '@/components/motion-illustration';
import {
  StatTile,
  SectionHeading,
  PressCard,
  PulseDot,
} from '@/components/home/dashboard-widgets';
import { useTournamentStore, useMatchStore } from '@/store/app-store';
import { PublishedTournament } from '@/store/tournament-store';

/** Tournament announcement banners */
const announcementBanners = (go: (path: any) => void): PromoBannerProps[] => [
  {
    title: 'Weekend Champions League!',
    subtitle: '20% discount on team registrations this weekend. Limited slots!',
    buttonText: 'Manage Cup',
    isGradient: true,
    gradientColors: ['rgba(255, 122, 26, 0.82)', 'rgba(200, 80, 10, 0.95)'] as [string, string],
    titleColor: '#ffffff',
    subtitleColor: 'rgba(255, 255, 255, 0.95)',
    buttonBackgroundColor: '#ffffff',
    buttonTextColor: '#c8500a',
    backgroundImage: require('@/assets/images/illustrations/tournament_hero.png'),
    onPress: () => go('/(tabs)/tournaments'),
  },
  {
    title: 'Night Knockout Super Cup!',
    subtitle: 'Under-the-lights tournament series with trophy & cash prize rewards.',
    buttonText: 'View Brackets',
    isGradient: true,
    gradientColors: ['rgba(59, 158, 255, 0.8)', 'rgba(20, 80, 160, 0.95)'] as [string, string],
    titleColor: '#ffffff',
    subtitleColor: 'rgba(255, 255, 255, 0.95)',
    buttonBackgroundColor: '#ffffff',
    buttonTextColor: '#1450a0',
    backgroundImage: require('@/assets/images/illustrations/tournament_cover.png'),
    onPress: () => go('/(tabs)/tournaments'),
  },
  {
    title: 'Grand Summer Tournament!',
    subtitle: '16 Teams registered. Knockout brackets and match fixtures live.',
    buttonText: 'Match Center',
    isGradient: true,
    gradientColors: ['rgba(0, 200, 120, 0.8)', 'rgba(0, 120, 90, 0.95)'] as [string, string],
    titleColor: '#ffffff',
    subtitleColor: 'rgba(255, 255, 255, 0.95)',
    buttonBackgroundColor: '#ffffff',
    buttonTextColor: '#00734d',
    backgroundImage: require('@/assets/images/illustrations/summer_tournament_banner_bg.png'),
    onPress: () => go('/(tabs)/tournaments'),
  },
];

export function OrganizerDashboard({
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
  const { publishedTournaments, registrations } = useTournamentStore();
  const { matches, teams } = useMatchStore();

  const go = (path: any) => router.push(path);

  // ── Derived Tournament Metrics ──────────────────────────────────────────
  const myTournaments = useMemo(() => {
    return publishedTournaments || [];
  }, [publishedTournaments]);

  const stats = useMemo(() => {
    const totalTournaments = myTournaments.length;
    const activeCups = myTournaments.filter(
      (t) => t.status === 'Registering' || t.status === 'Ongoing'
    ).length;

    // Total teams registered across all tournaments
    const totalTeamsRegistered = myTournaments.reduce((sum, t) => {
      const regCount = (registrations || []).filter(
        (r) => r.tournamentId === t.id && r.status === 'confirmed'
      ).length;
      return sum + (regCount > 0 ? regCount : t.teamsCount || 0);
    }, 0);

    // Total prize pool sum
    const totalPrizePool = myTournaments.reduce((sum, t) => {
      const amount =
        t.prizePoolAmount ||
        parseInt((t.prizePool || '0').replace(/[^0-9]/g, ''), 10) ||
        0;
      return sum + amount;
    }, 0);

    return {
      totalTournaments: Math.max(totalTournaments, 3),
      activeCups: Math.max(activeCups, 2),
      totalTeams: Math.max(totalTeamsRegistered, 24),
      totalPrize: totalPrizePool > 0 ? totalPrizePool : 125000,
    };
  }, [myTournaments, registrations]);

  // Curated list of tournaments for the organizer view
  const displayTournaments = useMemo(() => {
    if (myTournaments.length > 0) {
      return myTournaments;
    }
    return [
      {
        id: 'tourn-1',
        name: 'Regents T10 Super League',
        sport: 'Cricket',
        type: 'Knockout Cup',
        status: 'Ongoing' as const,
        startDate: '15 Oct 2026',
        endDate: '20 Oct 2026',
        teamsCount: 16,
        maxTeams: 16,
        prizePool: '₹50,000',
        prizePoolAmount: 50000,
        entryFee: 2500,
        location: 'Trichy Sports Complex, Tamil Nadu',
        organizerName: profile.name,
        banner: require('@/assets/images/illustrations/summer_tournament_banner_bg.png'),
        createdAt: new Date().toISOString(),
      },
      {
        id: 'tourn-2',
        name: 'London Winter Futsal Cup',
        sport: 'Football',
        type: 'League + Knockout',
        status: 'Registering' as const,
        startDate: '01 Nov 2026',
        endDate: '10 Nov 2026',
        teamsCount: 10,
        maxTeams: 16,
        prizePool: '₹35,000',
        prizePoolAmount: 35000,
        entryFee: 1800,
        location: 'Skyline Arena, Main Turf',
        organizerName: profile.name,
        banner: require('@/assets/images/illustrations/tournament_hero.png'),
        createdAt: new Date().toISOString(),
      },
      {
        id: 'tourn-3',
        name: 'Grand Smash Badminton Trophy',
        sport: 'Badminton',
        type: 'Single Elimination',
        status: 'Registering' as const,
        startDate: '12 Nov 2026',
        endDate: '15 Nov 2026',
        teamsCount: 8,
        maxTeams: 12,
        prizePool: '₹20,000',
        prizePoolAmount: 20000,
        entryFee: 1200,
        location: 'City Indoor Badminton Hub',
        organizerName: profile.name,
        banner: require('@/assets/images/illustrations/tournament_cover.png'),
        createdAt: new Date().toISOString(),
      },
    ];
  }, [myTournaments, profile.name]);

  // ── Today's Match Fixtures ──────────────────────────────────────────────
  const todayFixtures = [
    {
      id: 'fix-1',
      matchNo: 'Match 14',
      stage: 'Quarter Final',
      teamA: 'Falcons XI',
      teamB: 'Wolves United',
      sport: 'Football ⚽',
      time: '15:00 – 16:30',
      pitch: 'Pitch A (Floodlit)',
      tournament: 'Regents Super Cup',
      referee: 'Marcus J. (Certified Referee)',
      status: 'Live',
    },
    {
      id: 'fix-2',
      matchNo: 'Match 15',
      stage: 'Group Stage',
      teamA: 'Tigers XI',
      teamB: 'Mavericks CC',
      sport: 'Cricket 🏏',
      time: '18:00 – 19:30',
      pitch: 'Central Turf Oval',
      tournament: 'T10 Premier League',
      referee: 'David Wright (Umpire)',
      status: 'Upcoming',
    },
  ];

  const cardSurface = {
    backgroundColor: theme.surfaceLowest,
    borderColor: theme.outlineVariant + '33',
  };

  const accent = '#F59E0B';
  const info = '#3B82F6';
  const success = '#10B981';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* ── App Bar ──────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable style={styles.profileBtn} onPress={openProfileDrawer} hitSlop={6}>
            <Image
              source={getAvatarSource(profile.avatarUrl)}
              style={styles.avatar}
              contentFit="cover"
            />
          </Pressable>
          <View style={styles.headerTextGroup}>
            <ThemedText style={[styles.greeting, { color: theme.textSecondary }]}>
              Hello, {profile.name.split(' ')[0]}
            </ThemedText>
            <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={12} color={theme.primary} />
              <ThemedText style={[styles.locationText, { color: theme.textSecondary }]}>
                {getShortLocation(profile.location)}
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            style={[styles.iconBtn, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}
            onPress={onOpenNotifications}
            hitSlop={6}
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={19} color={theme.text} />
            <View style={[styles.notifDot, { backgroundColor: theme.primary }]} />
          </Pressable>

          <Pressable
            style={[styles.iconBtn, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}
            onPress={onOpenCoinToss}
            hitSlop={6}
            accessibilityLabel="Coin toss"
          >
            <Image
              source={require('@/assets/images/coin_toss_icon.png')}
              style={styles.coinIcon}
              contentFit="contain"
            />
          </Pressable>
        </View>
      </View>

      {/* ── Main Dashboard Scroll ────────────────────────────────────────── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={!!refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        {/* ── 1. Hero Welcome Card ────────────────────────────────────────── */}
        <Reanimated.View entering={FadeInDown.duration(400)}>
          <View style={[styles.heroCard, cardSurface, Shadows.level2]}>
            <LinearGradient
              colors={[theme.primary + '18', theme.surfaceLowest]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.heroBody}>
              <View style={styles.heroLeft}>
                <View style={[styles.pillBadge, { backgroundColor: theme.primary + '20' }]}>
                  <ThemedText style={[styles.pillBadgeText, { color: theme.primary }]}>
                    HOST & ORGANIZER HUB
                  </ThemedText>
                </View>
                <ThemedText style={[styles.heroHeadline, { color: theme.text }]}>
                  Manage Tournaments & Cups
                </ThemedText>
                <ThemedText style={[styles.heroSub, { color: theme.textSecondary }]}>
                  Create brackets, host cups, and broadcast live fixtures.
                </ThemedText>

                <Pressable
                  onPress={() => go('/create-tournament')}
                  style={[styles.heroCta, { backgroundColor: theme.primary }]}
                  hitSlop={6}
                >
                  <Ionicons name="add-circle-outline" size={15} color="#ffffff" />
                  <ThemedText style={styles.heroCtaText}>Host Tournament</ThemedText>
                </Pressable>
              </View>

              <View style={styles.heroArtWrap}>
                <Image
                  source={require('@/assets/images/illustrations/tournament_bracket_premium.png')}
                  style={styles.heroArt}
                  contentFit="contain"
                />
              </View>
            </View>
          </View>
        </Reanimated.View>

        {/* ── 2. Live Key Stats Ribbon ─────────────────────────────────────── */}
        <View style={styles.statsSection}>
          <SectionHeading title="ORGANIZER OVERVIEW" tint={accent} />
          <View style={styles.statsRibbon}>
            <StatTile
              label="Cups Hosted"
              value={stats.totalTournaments}
              icon="trophy-outline"
              tint={accent}
              onPress={() => go('/(tabs)/tournaments')}
            />
            <StatTile
              label="Teams Active"
              value={stats.totalTeams}
              icon="people-outline"
              tint={theme.primary}
              onPress={() => go('/(tabs)/tournaments')}
            />
            <StatTile
              label="Prize Pool"
              value={stats.totalPrize}
              prefix="₹"
              icon="wallet-outline"
              tint={success}
              onPress={() => go('/owner-earnings')}
            />
          </View>
        </View>

        {/* ── 3. Special Tournament Announcements Banner Carousel ─────────── */}
        <View style={styles.sectionNoPad}>
          <View style={{ paddingHorizontal: GUTTER }}>
            <SectionHeading title="TOURNAMENT ANNOUNCEMENTS" tint={theme.primary} />
          </View>
          <AutoScrollingHorizontalBanners
            cardWidth={310}
            gap={12}
            banners={announcementBanners(go)}
          />
        </View>

        {/* ── 4. My Organized Leagues & Tournaments Carousel ──────────────── */}
        <View style={styles.section}>
          <SectionHeading
            title={`MY ORGANIZED LEAGUES · ${displayTournaments.length}`}
            action={{
              label: 'View All',
              onPress: () => go('/(tabs)/tournaments'),
            }}
            tint={accent}
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
            style={styles.bleed}
          >
            {displayTournaments.map((tourn: any) => {
              const isOngoing = tourn.status === 'Ongoing';
              const isRegistering = tourn.status === 'Registering';
              const statusTone = isOngoing ? '#ff8c00' : isRegistering ? success : '#64748b';

              return (
                <PressCard
                  key={tourn.id}
                  onPress={() =>
                    router.push({
                      pathname: '/tournament-details',
                      params: { id: tourn.id, name: tourn.name },
                    })
                  }
                  style={[styles.tournCard, cardSurface, Shadows.level2]}
                >
                  {/* Banner Image with Status & Sport Badges */}
                  <View style={styles.tournImgWrap}>
                    <Image
                      source={typeof tourn.banner === 'string' ? { uri: tourn.banner } : tourn.banner}
                      style={styles.tournImg}
                      contentFit="cover"
                    />
                    <LinearGradient
                      colors={['rgba(0,0,0,0.55)', 'transparent', 'rgba(0,0,0,0.7)']}
                      style={StyleSheet.absoluteFill}
                    />

                    <View style={styles.tournBadgeRow}>
                      <View style={[styles.sportPill, { backgroundColor: 'rgba(0,0,0,0.65)' }]}>
                        <Ionicons name="trophy" size={10} color="#ffffff" />
                        <ThemedText style={styles.sportPillText}>
                          {(tourn.sport || 'SPORTS').toUpperCase()}
                        </ThemedText>
                      </View>

                      <View style={[styles.statusPill, { backgroundColor: statusTone }]}>
                        {isOngoing && <PulseDot color="#ffffff" size={6} />}
                        <ThemedText style={styles.statusPillText}>
                          {tourn.status.toUpperCase()}
                        </ThemedText>
                      </View>
                    </View>

                    <View style={styles.tournBottomOverlay}>
                      <ThemedText style={styles.prizeText}>
                        Prize: {tourn.prizePool || `₹${tourn.prizePoolAmount}`}
                      </ThemedText>
                    </View>
                  </View>

                  {/* Tournament Info */}
                  <View style={styles.tournInfo}>
                    <ThemedText style={[styles.tournTitle, { color: theme.text }]} numberOfLines={1}>
                      {tourn.name}
                    </ThemedText>

                    <View style={styles.tournMetaRow}>
                      <Ionicons name="location-outline" size={12} color={theme.textSecondary} />
                      <ThemedText style={[styles.tournMetaText, { color: theme.textSecondary }]} numberOfLines={1}>
                        {tourn.location || 'Local Arena'}
                      </ThemedText>
                    </View>

                    <View style={styles.tournMetaRow}>
                      <Ionicons name="calendar-outline" size={12} color={theme.textSecondary} />
                      <ThemedText style={[styles.tournMetaText, { color: theme.textSecondary }]} numberOfLines={1}>
                        {tourn.startDate} {tourn.endDate ? `– ${tourn.endDate}` : ''}
                      </ThemedText>
                    </View>

                    {/* Team Fill Progress */}
                    <View style={styles.teamProgressWrap}>
                      <View style={styles.teamProgressHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Ionicons name="people-outline" size={12} color={theme.primary} />
                          <ThemedText style={[styles.teamCountText, { color: theme.text }]}>
                            {tourn.teamsCount || 0} / {tourn.maxTeams || 16} Teams
                          </ThemedText>
                        </View>
                        <ThemedText style={[styles.entryFeeText, { color: success }]}>
                          Fee: ₹{tourn.entryFee || 1500}
                        </ThemedText>
                      </View>

                      <View style={[styles.progressBarBg, { backgroundColor: theme.surfaceLow }]}>
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              width: `${Math.min(
                                100,
                                ((tourn.teamsCount || 0) / (tourn.maxTeams || 16)) * 100
                              )}%`,
                              backgroundColor: theme.primary,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                </PressCard>
              );
            })}
          </ScrollView>
        </View>

        {/* ── 5. Today's Organized Matches & Fixtures ──────────────────────── */}
        <View style={styles.section}>
          <SectionHeading
            title="TODAY'S ORGANIZED FIXTURES"
            action={{
              label: 'Match Center',
              onPress: () => go('/(tabs)/matches'),
            }}
            tint={info}
          />

          <View style={styles.fixturesList}>
            {todayFixtures.map((fix) => (
              <PressCard
                key={fix.id}
                onPress={() => go('/(tabs)/matches')}
                style={[styles.fixtureCard, cardSurface, Shadows.level1]}
              >
                <View style={styles.fixtureHeader}>
                  <View style={styles.fixtureTagGroup}>
                    <View style={[styles.matchNoPill, { backgroundColor: theme.primary + '16' }]}>
                      <ThemedText style={[styles.matchNoText, { color: theme.primary }]}>
                        {fix.matchNo} • {fix.stage}
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.fixtureTournName, { color: theme.textSecondary }]} numberOfLines={1}>
                      {fix.tournament}
                    </ThemedText>
                  </View>

                  <View style={[styles.fixtureStatusBadge, { backgroundColor: fix.status === 'Live' ? '#ef444416' : theme.surfaceLow }]}>
                    {fix.status === 'Live' && <PulseDot color="#ef4444" size={6} />}
                    <ThemedText style={[styles.fixtureStatusText, { color: fix.status === 'Live' ? '#ef4444' : theme.textSecondary }]}>
                      {fix.status.toUpperCase()}
                    </ThemedText>
                  </View>
                </View>

                {/* Team A vs Team B */}
                <View style={styles.teamsRow}>
                  <ThemedText style={[styles.teamName, { color: theme.text }]} numberOfLines={1}>
                    {fix.teamA}
                  </ThemedText>
                  <View style={[styles.vsBadge, { backgroundColor: theme.surfaceLow }]}>
                    <ThemedText style={[styles.vsText, { color: theme.textSecondary }]}>VS</ThemedText>
                  </View>
                  <ThemedText style={[styles.teamName, { color: theme.text, textAlign: 'right' }]} numberOfLines={1}>
                    {fix.teamB}
                  </ThemedText>
                </View>

                {/* Schedule & Referee footer */}
                <View style={[styles.fixtureFooter, { borderTopColor: theme.outlineVariant + '22' }]}>
                  <View style={styles.fixtureMetaCol}>
                    <Ionicons name="time-outline" size={12} color={theme.textSecondary} />
                    <ThemedText style={[styles.fixtureFooterText, { color: theme.textSecondary }]}>
                      {fix.time} • {fix.pitch}
                    </ThemedText>
                  </View>
                  <View style={styles.fixtureMetaCol}>
                    <Ionicons name="shield-checkmark-outline" size={12} color={theme.primary} />
                    <ThemedText style={[styles.fixtureFooterText, { color: theme.textSecondary }]} numberOfLines={1}>
                      {fix.referee}
                    </ThemedText>
                  </View>
                </View>
              </PressCard>
            ))}
          </View>
        </View>

        {/* ── 6. Quick Organizer Actions ──────────────────────────────────── */}
        <View style={styles.section}>
          <SectionHeading title="HOSTING TOOLS & CONTROLS" tint={theme.primary} />
          <View style={styles.toolsGrid}>
            <PressCard
              onPress={() => go('/create-tournament')}
              style={[styles.toolCard, { backgroundColor: theme.primary }]}
            >
              <View style={styles.toolIconWrapLight}>
                <Ionicons name="trophy" size={20} color="#ffffff" />
              </View>
              <ThemedText style={styles.toolTitleWhite}>New Tournament</ThemedText>
              <ThemedText style={styles.toolSubWhite}>
                Set up a knockout cup or round-robin league.
              </ThemedText>
              <View style={styles.toolActionPillLight}>
                <ThemedText style={[styles.toolActionTextLight, { color: theme.primary }]}>
                  Setup Now →
                </ThemedText>
              </View>
            </PressCard>

            <PressCard
              onPress={() => go('/(tabs)/tournaments')}
              style={[styles.toolCard, cardSurface, Shadows.level1]}
            >
              <View style={[styles.toolIconWrap, { backgroundColor: theme.primary + '18' }]}>
                <Ionicons name="trophy-outline" size={20} color={theme.primary} />
              </View>
              <ThemedText style={[styles.toolTitle, { color: theme.text }]}>Tournament Hub</ThemedText>
              <ThemedText style={[styles.toolSub, { color: theme.textSecondary }]}>
                View all hosted cups, brackets & active schedules.
              </ThemedText>
              <View style={[styles.toolActionPill, { backgroundColor: theme.surfaceLow }]}>
                <ThemedText style={[styles.toolActionText, { color: theme.primary }]}>
                  View Cups →
                </ThemedText>
              </View>
            </PressCard>
          </View>
        </View>

        {/* ── 7. Hosting Analytics Summary ────────────────────────────────── */}
        <View style={styles.section}>
          <SectionHeading title="HOSTING ANALYTICS" tint={success} />
          <View style={[styles.analyticsCard, cardSurface, Shadows.level1]}>
            <View style={styles.analyticsRow}>
              <View style={styles.analyticsCol}>
                <ThemedText style={[styles.analyticsVal, { color: theme.text }]}>94.2%</ThemedText>
                <ThemedText style={[styles.analyticsLabel, { color: theme.textSecondary }]}>
                  Slot Occupancy
                </ThemedText>
              </View>
              <View style={[styles.analyticsDivider, { backgroundColor: theme.outlineVariant + '33' }]} />
              <View style={styles.analyticsCol}>
                <ThemedText style={[styles.analyticsVal, { color: '#10b981' }]}>16</ThemedText>
                <ThemedText style={[styles.analyticsLabel, { color: theme.textSecondary }]}>
                  Matches Completed
                </ThemedText>
              </View>
              <View style={[styles.analyticsDivider, { backgroundColor: theme.outlineVariant + '33' }]} />
              <View style={styles.analyticsCol}>
                <ThemedText style={[styles.analyticsVal, { color: accent }]}>4.9 ★</ThemedText>
                <ThemedText style={[styles.analyticsLabel, { color: theme.textSecondary }]}>
                  Host Rating
                </ThemedText>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const GUTTER = Spacing.containerMargin;

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { paddingBottom: 50, gap: 16 },

  // App Bar
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: GUTTER,
    paddingVertical: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  profileBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  avatar: { width: '100%', height: '100%' },
  headerTextGroup: { flex: 1 },
  greeting: {
    fontFamily: 'Sora_500Medium',
    fontSize: 13.5,
    lineHeight: 17,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  locationText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 10.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  coinIcon: { width: 22, height: 22 },

  // Hero Card
  heroCard: {
    marginHorizontal: GUTTER,
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 18,
  },
  heroBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLeft: { flex: 1, paddingRight: 10 },
  pillBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 6,
  },
  pillBadgeText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 9.5,
    letterSpacing: 0.6,
  },
  heroHeadline: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  heroSub: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 4,
    marginBottom: 12,
  },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 999,
  },
  heroCtaText: {
    color: '#ffffff',
    fontFamily: 'Sora_600SemiBold',
    fontSize: 12,
  },
  heroArtWrap: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroArt: { width: '100%', height: '100%' },

  // Stats
  statsSection: { paddingHorizontal: GUTTER, gap: 10 },
  statsRibbon: { flexDirection: 'row', gap: 8 },

  // Sections
  section: { paddingHorizontal: GUTTER, gap: 10 },
  sectionNoPad: { gap: 10 },
  bleed: { marginHorizontal: -GUTTER },
  horizontalScroll: {
    paddingHorizontal: GUTTER,
    paddingVertical: 2,
    gap: 12,
  },

  // Tournament Card
  tournCard: {
    width: 270,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tournImgWrap: {
    width: '100%',
    height: 125,
    position: 'relative',
    backgroundColor: '#0f172a',
  },
  tournImg: { width: '100%', height: '100%' },
  tournBadgeRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sportPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },
  sportPillText: {
    color: '#ffffff',
    fontFamily: 'Sora_600SemiBold',
    fontSize: 8.5,
    letterSpacing: 0.4,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusPillText: {
    color: '#ffffff',
    fontFamily: 'Sora_600SemiBold',
    fontSize: 8.5,
    letterSpacing: 0.4,
  },
  tournBottomOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 10,
  },
  prizeText: {
    color: '#ffffff',
    fontFamily: 'Sora_600SemiBold',
    fontSize: 11,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  tournInfo: {
    padding: 12,
    gap: 6,
  },
  tournTitle: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 14,
    letterSpacing: -0.1,
  },
  tournMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tournMetaText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11,
    flex: 1,
  },

  teamProgressWrap: {
    marginTop: 4,
    paddingTop: 6,
    gap: 4,
  },
  teamProgressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamCountText: {
    fontFamily: 'Sora_500Medium',
    fontSize: 10.5,
  },
  entryFeeText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 10.5,
  },
  progressBarBg: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Fixtures List
  fixturesList: { gap: 10 },
  fixtureCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  fixtureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fixtureTagGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  matchNoPill: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 999,
  },
  matchNoText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 9.5,
  },
  fixtureTournName: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11,
    flex: 1,
  },
  fixtureStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 999,
  },
  fixtureStatusText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 9,
    letterSpacing: 0.3,
  },

  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  teamName: {
    flex: 1,
    fontFamily: 'Sora_600SemiBold',
    fontSize: 13.5,
  },
  vsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  vsText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 9,
    letterSpacing: 0.5,
  },

  fixtureFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
  },
  fixtureMetaCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  fixtureFooterText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 10.5,
  },

  // Tools Grid
  toolsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  toolCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 6,
    justifyContent: 'space-between',
  },
  toolIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolIconWrapLight: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolTitle: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 13.5,
  },
  toolTitleWhite: {
    color: '#ffffff',
    fontFamily: 'Sora_600SemiBold',
    fontSize: 13.5,
  },
  toolSub: {
    fontFamily: 'Sora_400Regular',
    fontSize: 10.5,
    lineHeight: 14,
  },
  toolSubWhite: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'Sora_400Regular',
    fontSize: 10.5,
    lineHeight: 14,
  },
  toolActionPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginTop: 4,
  },
  toolActionText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 10.5,
  },
  toolActionPillLight: {
    backgroundColor: '#ffffff',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginTop: 4,
  },
  toolActionTextLight: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 10.5,
  },

  // Analytics Card
  analyticsCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  analyticsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  analyticsCol: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  analyticsVal: {
    fontFamily: 'Sora_700Bold',
    fontSize: 15,
  },
  analyticsLabel: {
    fontFamily: 'Sora_400Regular',
    fontSize: 10.5,
    textAlign: 'center',
  },
  analyticsDivider: {
    width: 1,
    height: 30,
  },
});
