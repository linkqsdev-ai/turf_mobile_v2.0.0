import React, { useState, useEffect } from 'react';
import { openProfileDrawer } from '@/components/profile-drawer';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Platform,
  Animated,
  DimensionValue,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { CoinTossModal } from '@/components/coin-toss-modal';
import Reanimated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { GradientContainer } from '@/components/gradient-container';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useUserProfile, getShortLocation } from '@/hooks/use-user-profile';
import { registrationBlocker, RegistrationBlocker, nextFixture, describeFixture } from '@/store/tournament-store';
import { getAvatarSource } from '@/constants/avatars';
import { MaterialIcons } from '@expo/vector-icons';
import { PromoBanner, AutoScrollingHorizontalBanners, BANNER_DESIGNS_10 } from '@/components/promo-banner';
import { SPORTS_LIST } from '@/constants/sports';
import { TOURNAMENT_SPORTS, isTournamentSport } from '@/constants/tournament';
import { useTournamentStore } from '@/store/app-store';
import { MotionIllustration } from '@/components/motion-illustration';
import { DashboardCard, DashboardChip, DashboardSectionLabel, StatTiles } from '@/components/dashboard/analytics-kit';
import { CupListCard, CupGridCard } from '@/components/cups/cup-cards';
import { cupStatus, cupsSummary, prizeLabel } from '@/utils/cup-display';
import { ACCENTS } from '@/constants/dashboard-accents';

// Mock Tournaments Data
const INITIAL_TOURNAMENTS = [
  {
    id: 't1',
    name: 'London Cup 2026',
    sport: 'Football',
    type: 'Knockout',
    location: 'Elms Field Arena, London',
    startDate: '2026-06-15',
    endDate: '2026-06-22',
    registrationStatus: 'Registering',
    teamsCount: 12,
    maxTeams: 16,
    prizePool: '₹2,500',
    prizePoolAmount: 2500,
    status: 'Registering',
    isLive: false,
    isSponsored: true,
    banner: require('@/assets/images/sports/tournament_football.png'),
  },
  {
    id: 't2',
    name: 'T20 Cricket Blast League',
    sport: 'Cricket',
    type: 'League + Playoffs',
    location: 'Regents Cricket Ground, London',
    startDate: '2026-07-01',
    endDate: '2026-07-20',
    registrationStatus: 'Filling Fast',
    teamsCount: 8,
    maxTeams: 8,
    prizePool: '₹5,000',
    prizePoolAmount: 5000,
    status: 'Ongoing',
    isLive: true,
    isSponsored: false,
    banner: require('@/assets/images/sports/tournament_cricket.png'),
  },
  {
    id: 't3',
    name: 'Futsal Summer Championship',
    sport: 'Football',
    type: 'Group + Knockout',
    location: 'Urban Turf Center, London',
    startDate: '2026-06-25',
    endDate: '2026-06-28',
    registrationStatus: 'Registering',
    teamsCount: 6,
    maxTeams: 10,
    prizePool: '₹1,000',
    prizePoolAmount: 1000,
    status: 'Registering',
    isLive: false,
    isSponsored: false,
    banner: require('@/assets/images/sports/tournament_futsal.png'),
  },
  {
    id: 't4',
    name: 'Wimbledon Amateur Open',
    sport: 'Tennis',
    type: 'Single Elimination',
    location: 'West London Tennis Club',
    startDate: '2026-07-10',
    endDate: '2026-07-12',
    registrationStatus: 'Upcoming',
    teamsCount: 0,
    maxTeams: 32,
    prizePool: '₹1,500',
    prizePoolAmount: 1500,
    status: 'Upcoming',
    isLive: false,
    isSponsored: true,
    banner: require('@/assets/images/sports/tournament_tennis.png'),
  },
  {
    id: 't5',
    name: 'City Corporate Cricket Cup',
    sport: 'Cricket',
    type: 'Knockout',
    location: 'Hyde Park Oval, London',
    startDate: '2026-05-10',
    endDate: '2026-05-15',
    registrationStatus: 'Closed',
    teamsCount: 16,
    maxTeams: 16,
    prizePool: '₹3,000',
    prizePoolAmount: 3000,
    status: 'Finished',
    isLive: false,
    isSponsored: false,
    banner: require('@/assets/images/sports/tournament_cricket.png'),
  }
];

const formatDateRange = (start: string, end: string) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return `${start} - ${end}`;
  }
  const startMonth = months[startDate.getMonth()];
  const startDay = startDate.getDate();
  const endMonth = months[endDate.getMonth()];
  const endDay = endDate.getDate();

  if (startMonth === endMonth) {
    return `${startDay} - ${endDay} ${startMonth}`;
  }
  return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
};

export default function TournamentsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { profile } = useUserProfile();
  const role = profile.role || 'Player';
  const { publishedTournaments, registrations } = useTournamentStore();

  /** Why a tournament can't take another team, counted from real registrations. */
  const blockFor = (t: any): RegistrationBlocker | null =>
    registrationBlocker(
      t,
      (registrations || []).filter((r: any) => r.tournamentId === t.id && r.status !== 'rejected').length
    );
  const BLOCK_SHORT: Record<RegistrationBlocker, string> = {
    full: 'Full',
    closed: 'Closed',
    cancelled: 'Cancelled',
    not_open: 'Soon',
  };

  // State Management
  const [searchQuery, setSearchQuery] = useState('');
  // Defaults to every sport: a tournament the organiser just published must be
// visible immediately, and defaulting to one sport hid newly created ones in
// the other until the player happened to switch chips.
  const [selectedSport, setSelectedSport] = useState('All');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [coinTossVisible, setCoinTossVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [sortBy, setSortBy] = useState('Date'); // 'Date' or 'Prize'
  const [failedImageIds, setFailedImageIds] = useState<string[]>([]);

  const simulateLoading = false;
  const simulateEmpty = false;

  // Infinite Scroll Pagination State
  const [visibleTournamentsCount, setVisibleTournamentsCount] = useState(4);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setVisibleTournamentsCount(4);
  }, [searchQuery, selectedSport, selectedStatus, sortBy]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    setVisibleTournamentsCount(4);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 220;
    if (isCloseToBottom && visibleTournamentsCount < filteredTournaments.length && !isLoadingMore) {
      setIsLoadingMore(true);
      setTimeout(() => {
        setVisibleTournamentsCount((prev) => Math.min(prev + 4, filteredTournaments.length));
        setIsLoadingMore(false);
      }, 300);
    }
  };

  // Custom Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastOpacity = useState(new Animated.Value(0))[0];

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    Animated.sequence([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setToastMessage(null));
  };

  const handleProfilePress = openProfileDrawer;
  const handleNetworkPress = () => router.push('/(tabs)/network');


  const handleShare = (name: string) => {
    triggerToast(`Shared tournament: ${name}`);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedSport('All');
    setSelectedStatus('All');
    setSortBy('Date');
  };

  // Map dynamically added tournaments from global store to fit list schema
  const mappedPublished = (publishedTournaments || []).map((t: any) => ({
    id: t.id,
    name: t.name,
    // Normalise e.g. "football" to "Football". Guarded: a record with no
    // sport used to throw here and blank the whole list.
    sport: t.sport ? t.sport.charAt(0).toUpperCase() + t.sport.slice(1).toLowerCase() : 'Cricket',
    type: t.type,
    // Venue with its address, so a turf picked in the wizard reads as a place.
    // The grid card shows only the part before the first comma — the venue name.
    location: [t.location, t.venueAddress]
      .map((part: string | undefined) => String(part ?? '').trim())
      .filter((part: string, i: number, all: string[]) => part && (i === 0 || !all[0].includes(part)))
      .join(', ') || 'TBD',
    startDate: t.startDate,
    endDate: t.endDate,
    registrationStatus: t.status === 'Draft' ? 'Upcoming' : t.status,
    teamsCount: t.teamsCount,
    maxTeams: t.maxTeams,
    prizePool: t.prizePool,
    prizePoolAmount: t.prizePoolAmount,
    status: t.status === 'Draft' ? 'Upcoming' : (t.status === 'Completed' ? 'Finished' : t.status),
    isLive: t.status === 'Ongoing',
    isSponsored: false,
    createdAt: t.createdAt,
    banner: t.banner || require('@/assets/images/sports/tournament_football.png'),
    // From the draw itself, so a host's reschedule shows on the card at once.
    nextFixture: nextFixture(t.fixtures),
  }));

  const allTournaments = [...mappedPublished, ...INITIAL_TOURNAMENTS];
  /** Counts for the "Cups at a Glance" card, across every listed cup. */
  const summary = cupsSummary(allTournaments);

  // Filter and Sort Logic
  const filteredTournaments = allTournaments.filter(t => {
    if (simulateEmpty) return false;

    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSport = selectedSport === 'All' || t.sport === selectedSport;

    const matchesStatus = selectedStatus === 'All' ||
      (selectedStatus === 'Registering' && t.status === 'Registering') ||
      (selectedStatus === 'Ongoing' && t.status === 'Ongoing') ||
      (selectedStatus === 'Finished' && t.status === 'Finished') ||
      (selectedStatus === 'Upcoming' && t.status === 'Upcoming');

    return matchesSearch && matchesSport && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'Prize') {
      return b.prizePoolAmount - a.prizePoolAmount;
    }
    // Newest first. Sorting by startDate put a cup starting next week above one
    // published minutes ago, so a freshly created tournament landed mid-list.
    const created = (t: any) =>
      t.createdAt ? new Date(t.createdAt).getTime() : new Date(t.startDate).getTime();
    const diff = created(b) - created(a);
    return diff !== 0 ? diff : String(b.id ?? '').localeCompare(String(a.id ?? ''));
  });

  return (
    <GradientContainer screenName="tournaments" style={styles.container}>
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
              <ThemedText type="bodyLg" style={{ color: theme.text, fontFamily: 'Sora_500Medium', lineHeight: 18 }}>
                {profile.name}
              </ThemedText>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <Ionicons name="location-sharp" size={12} color={theme.secondaryContainer} />
                <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginLeft: 2, fontSize: 10 }}>
                  {getShortLocation(profile.location)}
                </ThemedText>
              </View>
            </View>
          </View>
          <View style={styles.headerRightActions}>
            {/* Straight to the host screen. Organisers had to leave Cups and
                find the Host tab to reach their own tournaments and drafts. */}
            {(role === 'Organizer' || role === 'Super Admin') && (
              <Pressable
                style={styles.iconButton}
                onPress={() => router.push('/(tabs)/club')}
                accessibilityRole="button"
                accessibilityLabel="Go to your host screen"
              >
                <Ionicons name="megaphone-outline" size={20} color={theme.secondaryContainer} />
              </Pressable>
            )}

            <Pressable style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={20} color={theme.secondaryContainer} />
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
          {/* Sport Categories Row (Fixed) */}
          <View style={[styles.categoriesSection, { paddingVertical: 10, marginTop: Spacing.sm }]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 6, paddingHorizontal: Spacing.containerMargin }}
            >
              {/* Supported sports lead the row; the rest stay visible but
                  disabled so the roadmap is legible. Kept in step with the
                  create form via TOURNAMENT_SPORTS — a sport you can create a
                  tournament in must be one you can filter for. */}
              {[
                { name: 'All', icon: 'apps', color: '#64748b' },
                ...TOURNAMENT_SPORTS.map(
                  name => SPORTS_LIST.find(s => s.name === name) || { name, icon: 'sports', color: '#64748b' }
                ),
                ...SPORTS_LIST.filter(s => !isTournamentSport(s.name)),
              ].map((sport) => {
                const isSelected = selectedSport === sport.name;
                const isDisabled = sport.name !== 'All' && !isTournamentSport(sport.name);
                return (
                  <DashboardChip
                    key={sport.name}
                    label={sport.name}
                    selected={isSelected}
                    disabled={isDisabled}
                    accessibilityLabel={isDisabled ? `${sport.name}, coming soon` : `Show ${sport.name} tournaments`}
                    icon={(color) => <MaterialIcons name={sport.icon as any} size={12} color={color} />}
                    onPress={() => {
                      if (isDisabled) {
                        Alert.alert('Not yet available', `${sport.name} tournaments will be enabled in a future update.`);
                        return;
                      }
                      setSelectedSport(sport.name);
                    }}
                  />
                );
              })}
            </ScrollView>
          </View>

          {/* Status Filters & Sort Toggle Row (Fixed) */}
          <View style={[styles.filtersRow, { paddingHorizontal: Spacing.containerMargin, paddingBottom: 10 }]}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.statusScrollContainer}
              style={styles.statusScrollView}
            >
              {['All', 'Registering', 'Ongoing', 'Finished', 'Upcoming'].map((status) => {
                const isSelected = selectedStatus === status;
                return (
                  <DashboardChip
                    key={status}
                    label={status}
                    selected={isSelected}
                    accessibilityLabel={`Show ${status === 'All' ? 'all' : status.toLowerCase()} tournaments`}
                    onPress={() => setSelectedStatus(status)}
                  />
                );
              })}
            </ScrollView>

            <Pressable
              style={[styles.sortToggleButton, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}
              onPress={() => setSortBy(sortBy === 'Date' ? 'Prize' : 'Date')}
            >
              <Ionicons name="swap-vertical" size={12} color={theme.text} style={{ marginRight: 2 }} />
              <ThemedText type="labelSm" style={{ color: theme.text, fontWeight: '500' }}>
                {sortBy === 'Date' ? 'Date' : 'Prize'}
              </ThemedText>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.primary}
                colors={[theme.primary]}
              />
            }
          >
            {/* Title, then the at-a-glance card — the Home analytics card */}
            <View style={styles.welcomeSection}>
              <View style={[styles.rowBetween, { gap: Spacing.sm, alignItems: 'center' }]}>
                <View style={{ flex: 1 }}>
                  <ThemedText type="headlineSm" style={{ color: theme.text }}>
                    Tournaments
                  </ThemedText>
                  <ThemedText type="bodySm" style={{ color: theme.textSecondary, marginTop: 4, lineHeight: 18 }}>
                    Register your team, track brackets, and claim ultimate glory.
                  </ThemedText>
                </View>
                <MotionIllustration
                  scenario="tournaments"
                  size={72}
                  accessibilityLabel="Tournament champion trophy illustration"
                />
              </View>

              <DashboardCard
                style={{ marginTop: Spacing.md }}
                title="Cups at a Glance"
                metric={`${summary.open} Open for Registration`}
                tag={summary.live > 0 ? `🔴 ${summary.live} live now` : summary.topPrize > 0 ? `🏆 Top prize ${prizeLabel(summary.topPrize)}` : `📋 ${summary.total} listed`}
                icon="trophy"
                accent={ACCENTS.green}
                footer={{
                  label: 'Showing',
                  value: `${filteredTournaments.length} of ${summary.total}`,
                  status: selectedSport === 'All' ? 'All sports' : selectedSport,
                }}
              >
                <StatTiles
                  items={[
                    { value: String(summary.open), label: 'Open', color: ACCENTS.green.dark },
                    { value: String(summary.live), label: 'Live', color: ACCENTS.red.dark },
                    { value: String(summary.upcoming), label: 'Upcoming', color: ACCENTS.primary.dark },
                    { value: String(summary.finished), label: 'Finished' },
                  ]}
                />
              </DashboardCard>
            </View>

            {/* Offers & Gift Vouchers (Horizontal Card, Auto Scroll, Reduced Width & Gap) */}
            <View style={{ paddingHorizontal: 0, marginTop: Spacing.sm, marginBottom: Spacing.sm }}>
              <DashboardSectionLabel
                label="Special Deals & Vouchers"
                color={ACCENTS.orange.main}
                style={{ paddingHorizontal: Spacing.containerMargin, marginBottom: 8 }}
              />
              <AutoScrollingHorizontalBanners
                cardWidth={310}
                gap={14}
                banners={[
                  BANNER_DESIGNS_10.PRO_CHAMPIONSHIP_DISCOUNT(() => router.push('/(tabs)/tournaments')),
                  BANNER_DESIGNS_10.BIG_SALE_80_OFF(() => router.push('/(tabs)/tournaments')),
                  BANNER_DESIGNS_10.SUPER_BID_2X_REWARDS(() => router.push('/(tabs)/matches')),
                  BANNER_DESIGNS_10.SALE_50_OFF_TURF(() => router.push('/booking')),
                ]}
              />
            </View>

            {/* Main Content Area */}
            <View style={[styles.listSection, { paddingBottom: 110 }]}>
              {simulateLoading ? (
                // Beautiful Skeleton Cards
                <View style={viewMode === 'grid' ? styles.gridContainer : styles.listContainer}>
                  {[1, 2, 3].map((key) => (
                    <View
                      key={key}
                      style={[
                        styles.skeletonCard,
                        { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' },
                        viewMode === 'grid' ? styles.gridCardWidth : null
                      ]}
                    >
                      <View style={[styles.skeletonImage, { backgroundColor: theme.surfaceLow }, viewMode === 'grid' && { height: 80 }]} />
                      <View style={styles.skeletonContent}>
                        <View style={[styles.skeletonTextLine, { width: '40%', backgroundColor: theme.surfaceLow }]} />
                        <View style={[styles.skeletonTextLine, { width: '80%', marginTop: 8, backgroundColor: theme.surfaceLow }]} />
                        <View style={[styles.skeletonTextLine, { width: '60%', marginTop: 8, backgroundColor: theme.surfaceLow }]} />
                        <View style={[styles.skeletonButton, { marginTop: 12, backgroundColor: theme.surfaceLow }]} />
                      </View>
                    </View>
                  ))}
                </View>
              ) : filteredTournaments.length === 0 ? (
                // Empty State
                <View style={styles.emptyContainer}>
                  <Ionicons name="search-outline" size={48} color={theme.outlineVariant} />
                  <ThemedText type="headlineSm" style={{ marginTop: 16, color: theme.text }}>
                    No Tournaments Found
                  </ThemedText>
                  <ThemedText type="bodySm" style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 8, paddingHorizontal: 32 }}>
                    {"We couldn't find any matches. Try resetting your search filters or check back later!"}
                  </ThemedText>
                  <Pressable style={[styles.resetBtn, { backgroundColor: theme.primary }]} onPress={handleResetFilters}>
                    <ThemedText type="labelSm" style={{ color: '#ffffff' }}>Reset Filters</ThemedText>
                  </Pressable>
                </View>
              ) : (
                // List / Grid Render
                <View style={viewMode === 'grid' ? styles.gridContainer : styles.listContainer}>
                  {filteredTournaments.slice(0, visibleTournamentsCount).map((t) => {
                    // Real registrations where the cup has any; the stored counter otherwise.
                    const taken =
                      (registrations || []).filter((r: any) => r.tournamentId === t.id && r.status !== 'rejected').length ||
                      t.teamsCount ||
                      0;
                    const block = blockFor(t);
                    const next = (t as any).nextFixture;
                    const hasCashback = ((t as any).cashbackEnabled ?? (Number((t as any).cashbackAmount) > 0)) && Number((t as any).cashbackAmount) > 0;
                    const cashbackTag = hasCashback
                      ? ((t as any).cashbackType === 'percent' ? `${(t as any).cashbackAmount}% Cashback` : `₹${(t as any).cashbackAmount} Cashback`)
                      : undefined;
                    const cardProps = {
                      name: t.name,
                      sport: t.sport,
                      banner:
                        !failedImageIds.includes(t.id) && t.banner
                          ? t.banner
                          : require('@/assets/images/illustrations/stadium.png'),
                      onBannerError: () => setFailedImageIds((prev) => [...prev, t.id]),
                      status: cupStatus(t),
                      location: t.location,
                      dateRange: formatDateRange(t.startDate, t.endDate),
                      nextFixture: next ? { label: describeFixture(next), live: next.status === 'Live' } : null,
                      teams: { taken, max: t.maxTeams },
                      prize: prizeLabel(t.prizePoolAmount, t.prizePool),
                      cashbackTag,
                      register: {
                        label: block ? BLOCK_SHORT[block] : 'Register',
                        blocked: !!block,
                        accessibilityLabel: block
                          ? `${t.name}: registration ${BLOCK_SHORT[block].toLowerCase()}`
                          : `Register for ${t.name}`,
                        onPress: () => router.push({ pathname: '/team-registration', params: { id: t.id, name: t.name } }),
                      },
                      onPress: () =>
                        router.push({
                          pathname: '/tournament-details',
                          params: { id: t.id, name: t.name, sport: t.sport, prize: t.prizePool },
                        }),
                    };
                    return viewMode === 'list' ? (
                      <CupListCard key={t.id} {...cardProps} />
                    ) : (
                      <CupGridCard key={t.id} {...cardProps} />
                    );
                  })}
                </View>
              )}

              {/* ── Auto-Load More Indicator / End of Tournaments List ── */}
              {filteredTournaments.length > visibleTournamentsCount ? (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: 12,
                    backgroundColor: theme.surfaceLowest,
                    borderWidth: 1,
                    borderColor: theme.outlineVariant + '35',
                    marginTop: 10,
                    marginBottom: 6,
                    gap: 8,
                  }}
                >
                  <ActivityIndicator size="small" color={theme.primary} />
                  <ThemedText style={{ color: theme.textSecondary, fontSize: 11, fontFamily: 'Sora_500Medium' }}>
                    {isLoadingMore ? 'Loading more tournaments...' : `Scroll to auto-load (${filteredTournaments.length - visibleTournamentsCount} remaining)`}
                  </ThemedText>
                </View>
              ) : filteredTournaments.length > 4 ? (
                <View style={{ alignItems: 'center', paddingVertical: 8 }}>
                  <ThemedText style={{ color: theme.textSecondary + '80', fontSize: 10, fontFamily: 'Sora_400Regular' }}>
                    ✓ All {filteredTournaments.length} tournaments loaded
                  </ThemedText>
                </View>
              ) : null}
            </View>
          </ScrollView>
        </Reanimated.View>

        {/* Create Tournament FAB – Organizer & Super Admin only */}
        {(role === 'Organizer' || role === 'Super Admin') && (
          <Pressable
            style={({ pressed }) => [
              styles.fabTop,
              pressed && { transform: [{ scale: 0.92 }] },
            ]}
            onPress={() => router.push('/create-tournament')}
          >
            <LinearGradient
              colors={['#10b981', '#047857']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.fabGradient}
            >
              <Ionicons name="trophy" size={22} color="#ffffff" />
            </LinearGradient>
          </Pressable>
        )}
      </SafeAreaView>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <Animated.View style={[styles.toastContainer, { opacity: toastOpacity, backgroundColor: theme.primaryContainer }]}>
          <ThemedText type="labelSm" style={{ color: '#ffffff' }}>{toastMessage}</ThemedText>
        </Animated.View>
      )}
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
    borderColor: '#5D68E8',
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
  welcomeSection: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.containerMargin,
  },
  viewToggle: {
    padding: 4,
  },
  searchBarSection: {
    paddingHorizontal: Spacing.containerMargin,
    marginTop: Spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    height: 44,
    borderRadius: BorderRadius.xl,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Sora_400Regular',
    fontSize: 14,
    paddingVertical: 8,
  },
  categoriesSection: {
    marginTop: 12,
  },
  categoriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: Spacing.containerMargin,
  },
  categoriesScroll: {
    paddingHorizontal: Spacing.containerMargin,
    gap: Spacing.sm,
  },
  sportIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.containerMargin,
    marginTop: 12,
    gap: 8,
  },
  statusScrollView: {
    flex: 1,
  },
  statusScrollContainer: {
    gap: 6,
    alignItems: 'center',
    // Enough trailing room that the final chip scrolls clear of the sort
    // button rather than stopping half-visible against it.
    paddingRight: 14,
  },
  sortToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignSelf: 'center',
    // Never compressed by the chip row next to it, and never overlapped by
    // chips scrolling underneath.
    flexShrink: 0,
    zIndex: 1,
  },
  listSection: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.containerMargin,
  },
  listContainer: {
    gap: 14,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  gridCardWidth: {
    width: '48%',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  resetBtn: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  toastContainer: {
    position: 'absolute',
    top: 56,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    zIndex: 999,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  // Skeleton styles
  skeletonCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  skeletonImage: {
    height: 120,
    width: '100%',
    borderRadius: BorderRadius.lg,
    opacity: 0.6,
  },
  skeletonContent: {
    marginTop: 12,
  },
  skeletonTextLine: {
    height: 12,
    borderRadius: 6,
    opacity: 0.6,
  },
  skeletonButton: {
    height: 32,
    width: 100,
    borderRadius: BorderRadius.full,
    opacity: 0.6,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },


  createTournamentHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  fabTop: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 108 : 88,
    right: Spacing.md,
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2.5,
    borderColor: '#ffffff',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 12,
    zIndex: 999,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
