import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Platform,
  Animated,
  DimensionValue,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CoinTossModal } from '@/components/coin-toss-modal';
import Reanimated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { GradientContainer } from '@/components/gradient-container';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useUserProfile } from '@/hooks/use-user-profile';
import { MaterialIcons } from '@expo/vector-icons';
import { PromoBanner, AutoScrollingHorizontalBanners } from '@/components/promo-banner';
import { SPORTS_LIST } from '@/constants/sports';
import { useTournamentStore } from '@/store/app-store';

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
  const { publishedTournaments } = useTournamentStore();

  // State Management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState('All');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [coinTossVisible, setCoinTossVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [sortBy, setSortBy] = useState('Date'); // 'Date' or 'Prize'
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(['t1']);
  const [failedImageIds, setFailedImageIds] = useState<string[]>([]);
  
  const simulateLoading = false;
  const simulateEmpty = false;

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

  const handleProfilePress = () => router.push('/profile');
  const handleNetworkPress = () => router.push('/(tabs)/network');

  const toggleBookmark = (id: string) => {
    if (bookmarkedIds.includes(id)) {
      setBookmarkedIds(bookmarkedIds.filter(item => item !== id));
      triggerToast('Removed from bookmarks');
    } else {
      setBookmarkedIds([...bookmarkedIds, id]);
      triggerToast('Tournament bookmarked!');
    }
  };

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
    sport: t.sport.charAt(0).toUpperCase() + t.sport.slice(1).toLowerCase(), // Normalize e.g. "football" to "Football"
    type: t.type,
    location: t.location,
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
    banner: t.banner || require('@/assets/images/sports/tournament_football.png'),
  }));

  const allTournaments = [...mappedPublished, ...INITIAL_TOURNAMENTS];

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
    } else {
      // Sort by startDate
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    }
  });

  return (
    <GradientContainer screenName="tournaments" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Top App Bar */}
        <View style={[styles.header, { backgroundColor: 'transparent' }]}>
          <View style={styles.headerLeft}>
            <Pressable style={styles.profileIconButton} onPress={handleProfilePress}>
              <Image
                source={require('@/assets/images/avatars/avatar_1.png')}
                style={styles.headerAvatar}
              />
            </Pressable>
            <View style={styles.headerTextGroup}>
              <ThemedText type="bodyLg" style={{ color: theme.text, fontFamily: 'HankenGrotesk_700Bold', lineHeight: 18 }}>
                Azarudeen
              </ThemedText>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <Ionicons name="location-sharp" size={12} color={theme.secondaryContainer} />
                <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginLeft: 2, fontSize: 10 }}>
                  London, UK
                </ThemedText>
              </View>
            </View>
          </View>
          <View style={styles.headerRightActions}>

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
              {[{ name: 'All', icon: 'apps', color: theme.textSecondary }, ...SPORTS_LIST].map((sport) => {
                const isSelected = selectedSport === sport.name;
                return (
                  <Pressable
                    key={sport.name}
                    onPress={() => setSelectedSport(sport.name)}
                    style={[
                      styles.filterChip,
                      { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '44' },
                      isSelected && { backgroundColor: theme.primary, borderColor: theme.primary },
                    ]}
                  >
                    <MaterialIcons
                      name={sport.icon as any}
                      size={12}
                      color={isSelected ? '#ffffff' : theme.textSecondary}
                      style={{ marginRight: 4 }}
                    />
                    <ThemedText
                      type="labelMd"
                      style={{ 
                        color: isSelected ? '#ffffff' : theme.textSecondary,
                        fontFamily: 'HankenGrotesk_600SemiBold',
                        fontSize: 10,
                        letterSpacing: 0.2,
                      }}
                    >
                      {sport.name}
                    </ThemedText>
                  </Pressable>
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
              {['Registering', 'Ongoing', 'Finished', 'Upcoming'].map((status) => {
                const isSelected = selectedStatus === status;
                return (
                  <Pressable
                    key={status}
                    onPress={() => {
                      if (selectedStatus === status) {
                        setSelectedStatus('All');
                      } else {
                        setSelectedStatus(status);
                      }
                    }}
                    style={[
                      styles.statusPill,
                      isSelected
                        ? { backgroundColor: 'transparent', borderColor: theme.primary, borderWidth: 1.5 }
                        : { backgroundColor: 'transparent', borderColor: theme.outlineVariant + '33', borderWidth: 1.5 }
                    ]}
                  >
                    <ThemedText
                      type="labelSm"
                      style={{
                        color: isSelected ? theme.primary : theme.textSecondary,
                        fontWeight: isSelected ? '700' : '500',
                      }}
                    >
                      {status}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable 
              style={[styles.sortToggleButton, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}
              onPress={() => setSortBy(sortBy === 'Date' ? 'Prize' : 'Date')}
            >
              <Ionicons name="swap-vertical" size={12} color={theme.text} style={{ marginRight: 2 }} />
              <ThemedText type="labelSm" style={{ color: theme.text, fontWeight: '700' }}>
                {sortBy === 'Date' ? 'Date' : 'Prize'}
              </ThemedText>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Header section with description */}
            <View style={styles.welcomeSection}>
              <View style={styles.rowBetween}>
                <View style={{ flex: 1 }}>
                  <ThemedText type="headlineLg" style={{ color: theme.text }}>
                    Tournaments
                  </ThemedText>
                  <ThemedText type="bodySm" style={{ color: theme.textSecondary, marginTop: 4 }}>
                    Register your team, track brackets, and claim ultimate glory.
                  </ThemedText>
                </View>
                <Image
                  source={require('@/assets/images/illustrations/tournament_hero.png')}
                  style={{ width: 100, height: 100 }}
                  contentFit="contain"
                />
              </View>
            </View>

            {/* Offers & Gift Vouchers (Horizontal Card, Auto Scroll, Reduced Width & Gap) */}
            <View style={{ paddingHorizontal: 0, marginTop: Spacing.sm, marginBottom: Spacing.sm }}>
              <ThemedText type="labelSm" style={{ color: theme.textSecondary, paddingHorizontal: Spacing.containerMargin, marginBottom: 4, letterSpacing: 0.5 }}>
                SPECIAL DEALS & VOUCHERS
              </ThemedText>
              <AutoScrollingHorizontalBanners 
                cardWidth={270}
                gap={12}
                banners={[
                  {
                    title: "YAWAH Turf Special Offer",
                    subtitle: "Get flat 30% OFF on all bookings. Code: YAWAHTURF",
                    buttonText: "Book Now",
                    badgeText: "SPECIAL OFFER",
                    backgroundImage: require("@/assets/images/sports/sport_booking.png"),
                    buttonBackgroundColor: "#a3e635",
                    buttonTextColor: "#064e3b",
                    onPress: () => router.push('/(tabs)/explore'),
                  },
                  {
                    title: "Gift a Game to Your Loved Ones",
                    subtitle: "The easiest way to nail a gift for a sports lover",
                    buttonText: "Buy Gift Card",
                    badgeText: "GIFT VOUCHER",
                    backgroundImage: require("@/assets/images/sports/sport_all.png"),
                    buttonBackgroundColor: "#ffffff",
                    buttonTextColor: "#1e3a8a",
                    onPress: () => router.push('/booking'),
                  },
                  {
                    title: "Happy Hour Booking Deals",
                    subtitle: "Play for just ₹15/hr between 6 AM - 9 AM!",
                    buttonText: "Claim Deal",
                    badgeText: "PROMO OFFER",
                    backgroundImage: require("@/assets/images/sports/sport_booking.png"),
                    buttonBackgroundColor: "#ffffff",
                    buttonTextColor: "#ff8c00",
                    onPress: () => router.push('/(tabs)/explore'),
                  }
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
                <Ionicons name="search-outline" size={64} color={theme.outlineVariant} />
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
                {filteredTournaments.map((t) => {
                  const isBookmarked = bookmarkedIds.includes(t.id);
                  const progress = t.maxTeams > 0 ? (t.teamsCount / t.maxTeams) : 0;
                  const progressPercent = `${Math.min(progress * 100, 100)}%` as DimensionValue;

                  if (viewMode === 'list') {
                    return (
                      <Pressable
                        key={t.id}
                        style={[
                          styles.ticketCard,
                          { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' },
                          Shadows.level1
                        ]}
                        onPress={() => router.push({
                          pathname: '/tournament-details',
                          params: { id: t.id, name: t.name, sport: t.sport, prize: t.prizePool }
                        })}
                      >
                        {/* Cutout Notches */}
                        <View style={[styles.cutoutTop, { backgroundColor: theme.background }]} />
                        <View style={[styles.cutoutBottom, { backgroundColor: theme.background }]} />

                        {/* Flush Left Image Cover */}
                        <Image 
                          source={(!failedImageIds.includes(t.id) && t.banner) ? t.banner : require('@/assets/images/illustrations/stadium.png')} 
                          style={styles.ticketLeftImage} 
                          contentFit="cover" 
                          onError={() => setFailedImageIds(prev => [...prev, t.id])}
                        />

                        {/* Left Section (Details) */}
                        <View style={styles.ticketLeft}>
                          <View style={styles.sportAndStatus}>
                            <View style={styles.sportBadgeRow}>
                              {t.sport === 'Football' && <MaterialCommunityIcons name="soccer" size={11} color={theme.secondary} />}
                              {t.sport === 'Cricket' && <MaterialCommunityIcons name="cricket" size={11} color={theme.secondary} />}
                              {t.sport === 'Tennis' && <MaterialCommunityIcons name="tennis" size={11} color={theme.secondary} />}
                              <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: 8.5, marginLeft: 4 }}>
                                {t.sport}
                              </ThemedText>
                            </View>

                            {t.isLive ? (
                              <View style={[
                                styles.statusBadgeInline,
                                { backgroundColor: '#ff174414', borderColor: '#ff174433', borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 4 }
                              ]}>
                                <View style={styles.liveDot} />
                                <ThemedText style={styles.liveText}>Live</ThemedText>
                              </View>
                            ) : (
                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <ThemedText style={[
                                  { fontSize: 10, fontFamily: 'PlusJakartaSans_800ExtraBold', letterSpacing: 0.3 },
                                  t.registrationStatus === 'Registering' && { color: '#0f9f58' },
                                  t.registrationStatus === 'Filling Fast' && { color: '#e67e22' },
                                  t.registrationStatus === 'Upcoming' && { color: '#2980b9' },
                                  t.registrationStatus === 'Closed' && { color: '#7f8c8d' }
                                ]}>
                                  {t.registrationStatus}
                                </ThemedText>
                              </View>
                            )}
                          </View>

                          <ThemedText 
                            type="bodyLg" 
                            numberOfLines={1} 
                            style={{ color: theme.text, fontFamily: 'HankenGrotesk_700Bold', marginTop: 4 }}
                          >
                            {t.name}
                          </ThemedText>

                          <View style={styles.ticketMetaRow}>
                            <Ionicons name="location-outline" size={11} color={theme.textSecondary} />
                            <ThemedText type="labelSm" numberOfLines={1} style={{ color: theme.textSecondary, fontSize: 10, marginLeft: 2, flex: 1 }}>
                              {t.location}
                            </ThemedText>
                          </View>

                          <View style={styles.ticketMetaRow}>
                            <Ionicons name="calendar-outline" size={11} color={theme.textSecondary} />
                            <ThemedText type="labelSm" numberOfLines={1} style={{ color: theme.textSecondary, fontSize: 10, marginLeft: 2 }}>
                              {formatDateRange(t.startDate, t.endDate)}
                            </ThemedText>
                          </View>

                          {/* Team Progress Bar */}
                          <View style={styles.progressSection}>
                            <View style={styles.progressTextRow}>
                              <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: 9 }}>
                                Registration Progress
                              </ThemedText>
                              <ThemedText type="labelSm" style={{ color: theme.text, fontWeight: '700', fontSize: 10 }}>
                                {t.teamsCount}/{t.maxTeams} Teams
                              </ThemedText>
                            </View>
                            <View style={[styles.progressBarBg, { backgroundColor: theme.outlineVariant + '33' }]}>
                              <View style={[styles.progressBarFill, { width: progressPercent, backgroundColor: theme.secondaryContainer }]} />
                            </View>
                          </View>
                        </View>

                        {/* Dashed vertical separator line */}
                        <View style={[styles.verticalDivider, { borderColor: theme.outlineVariant + '22' }]} />
 
                        {/* Right Section (Stub) */}
                        <View style={styles.ticketRight}>
                          {/* Quick Action Overlay (Bookmark & Share) */}
                          <View style={styles.stubActions}>
                            <Pressable style={styles.ticketActionBtn} onPress={() => toggleBookmark(t.id)}>
                              <Ionicons name={isBookmarked ? 'bookmark' : 'bookmark-outline'} size={15} color={isBookmarked ? '#5D68E8' : theme.textSecondary} />
                            </Pressable>
                            <Pressable style={styles.ticketActionBtn} onPress={() => handleShare(t.name)}>
                              <Ionicons name="share-social-outline" size={15} color={theme.textSecondary} />
                            </Pressable>
                          </View>
 
                          <View style={{ width: '100%', gap: 4, marginTop: 'auto' }}>
                            <View style={[styles.ticketPriceHighlight, { backgroundColor: theme.primary + '0a', borderColor: theme.primary + '22' }]}>
                              <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: 7, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5 }}>Prize Pool</ThemedText>
                              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 1 }}>
                                <Image source={require('@/assets/images/illustrations/wallet_blue.png')} style={{ width: 16, height: 16 }} contentFit="contain" />
                                <ThemedText type="bodyMd" style={{ color: theme.secondary, fontFamily: 'HankenGrotesk_800ExtraBold', textAlign: 'center', fontSize: 13 }}>
                                  {t.prizePool}
                                </ThemedText>
                              </View>
                            </View>
                            
                            <Pressable 
                              style={[styles.ticketRegisterBtn, { backgroundColor: theme.primary }]}
                              onPress={() => router.push({
                                pathname: '/team-registration',
                                params: { id: t.id, name: t.name }
                              })}
                            >
                              <ThemedText type="labelSm" style={{ color: '#ffffff', fontWeight: '700', fontSize: 10 }}>Register</ThemedText>
                            </Pressable>
                          </View>
                        </View>
                      </Pressable>
                    );
                  } else {
                    // Grid View
                    return (
                      <Pressable
                        key={t.id}
                        style={[
                          styles.ticketGridCard,
                          { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' },
                          Shadows.level1
                        ]}
                        onPress={() => router.push({
                          pathname: '/tournament-details',
                          params: { id: t.id, name: t.name, sport: t.sport, prize: t.prizePool }
                        })}
                      >
                        {/* Cutout Notches at grid divider height */}
                        <View style={[styles.gridCutoutLeft, { backgroundColor: theme.background }]} />
                        <View style={[styles.gridCutoutRight, { backgroundColor: theme.background }]} />

                        {/* Top Image banner */}
                        <View style={styles.gridCardHeader}>
                          <Image 
                            source={(!failedImageIds.includes(t.id) && t.banner) ? t.banner : require('@/assets/images/illustrations/stadium.png')} 
                            style={styles.gridCardImage} 
                            contentFit="cover" 
                            onError={() => setFailedImageIds(prev => [...prev, t.id])}
                          />
                          {t.isSponsored && (
                            <View style={styles.gridSponsoredBadge}>
                              <ThemedText type="labelSm" style={{ color: '#5D68E8', fontSize: 8, fontWeight: '800' }}>Sponsored</ThemedText>
                            </View>
                          )}
                          
                          {/* Quick Actions (Bookmark & Share) */}
                          <View style={{ position: 'absolute', top: 6, right: 6, flexDirection: 'row', gap: 4 }}>
                            <Pressable style={styles.ticketActionBtnCircle} onPress={() => toggleBookmark(t.id)}>
                              <Ionicons name={isBookmarked ? 'bookmark' : 'bookmark-outline'} size={12} color={isBookmarked ? '#5D68E8' : '#ffffff'} />
                            </Pressable>
                            <Pressable style={styles.ticketActionBtnCircle} onPress={() => handleShare(t.name)}>
                              <Ionicons name="share-social-outline" size={12} color="#ffffff" />
                            </Pressable>
                          </View>
                        </View>

                        {/* Details */}
                        <View style={styles.gridCardDetails}>
                          <View style={styles.gridSportRow}>
                            <View style={styles.gridSportBadge}>
                              {t.sport === 'Football' && <MaterialCommunityIcons name="soccer" size={10} color={theme.secondary} />}
                              {t.sport === 'Cricket' && <MaterialCommunityIcons name="cricket" size={10} color={theme.secondary} />}
                              {t.sport === 'Tennis' && <MaterialCommunityIcons name="tennis" size={10} color={theme.secondary} />}
                              <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: 8.5, marginLeft: 2 }}>
                                {t.sport}
                              </ThemedText>
                            </View>
                            
                            {t.isLive ? (
                              <View style={styles.statusBadgeInlineNoBg}>
                                <View style={styles.liveDot} />
                                <ThemedText style={styles.liveText}>Live</ThemedText>
                              </View>
                            ) : (
                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <ThemedText style={[
                                  { fontSize: 10, fontFamily: 'PlusJakartaSans_800ExtraBold', letterSpacing: 0.3 },
                                  t.registrationStatus === 'Registering' && { color: '#0f9f58' },
                                  t.registrationStatus === 'Filling Fast' && { color: '#e67e22' },
                                  t.registrationStatus === 'Upcoming' && { color: '#2980b9' },
                                  t.registrationStatus === 'Closed' && { color: '#7f8c8d' }
                                ]}>
                                  {t.registrationStatus}
                                </ThemedText>
                              </View>
                            )}
                          </View>

                          <ThemedText 
                            type="bodyMd" 
                            numberOfLines={1} 
                            style={{ color: theme.text, fontFamily: 'HankenGrotesk_700Bold', marginTop: 4 }}
                          >
                            {t.name}
                          </ThemedText>

                          <View style={styles.gridMetaRow}>
                            <Ionicons name="location-outline" size={10} color={theme.textSecondary} />
                            <ThemedText type="labelSm" numberOfLines={1} style={{ color: theme.textSecondary, fontSize: 9, marginLeft: 2, flex: 1 }}>
                              {t.location.split(',')[0]}
                            </ThemedText>
                          </View>

                          <View style={styles.gridMetaRow}>
                            <Ionicons name="calendar-outline" size={10} color={theme.textSecondary} />
                            <ThemedText type="labelSm" numberOfLines={1} style={{ color: theme.textSecondary, fontSize: 9, marginLeft: 2 }}>
                              {formatDateRange(t.startDate, t.endDate)}
                            </ThemedText>
                          </View>

                          {/* Progress Bar */}
                          <View style={{ marginTop: 6 }}>
                            <View style={styles.progressTextRow}>
                              <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: 8 }}>Progress</ThemedText>
                              <ThemedText type="labelSm" style={{ color: theme.text, fontWeight: '700', fontSize: 9 }}>
                                {t.teamsCount}/{t.maxTeams}
                              </ThemedText>
                            </View>
                            <View style={[styles.progressBarBg, { height: 3, backgroundColor: theme.outlineVariant + '33' }]}>
                              <View style={[styles.progressBarFill, { width: progressPercent, backgroundColor: theme.secondaryContainer }]} />
                            </View>
                          </View>
                        </View>

                        {/* Dashed divider */}
                        <View style={[styles.horizontalDivider, { borderColor: theme.outlineVariant + '22' }]} />

                        {/* Footer / Stub section */}
                        <View style={styles.gridCardFooter}>
                          <View style={[styles.gridPriceHighlight, { backgroundColor: theme.primary + '0a', borderColor: theme.primary + '22' }]}>
                            <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: 7 }}>Prize</ThemedText>
                            <ThemedText type="bodySm" style={{ color: theme.secondary, fontFamily: 'HankenGrotesk_800ExtraBold', fontSize: 11 }}>
                              {t.prizePool}
                            </ThemedText>
                          </View>
                          
                          <Pressable 
                            style={[styles.gridRegisterBtn, { backgroundColor: theme.primary }]}
                            onPress={() => router.push({
                              pathname: '/team-registration',
                              params: { id: t.id, name: t.name }
                            })}
                          >
                            <ThemedText type="labelSm" style={{ color: '#ffffff', fontWeight: '700', fontSize: 9 }}>Register</ThemedText>
                          </Pressable>
                        </View>
                      </Pressable>
                    );
                  }
                })}
              </View>
            )}
          </View>
        </ScrollView>
        </Reanimated.View>
        
        {/* Create Tournament FAB */}
        <Pressable
          style={[styles.fabTop, { backgroundColor: 'rgb(16, 185, 129)', shadowColor: 'rgb(16, 185, 129)' }]}
          onPress={() => router.push('/create-tournament')}
        >
          <Ionicons name="trophy-outline" size={24} color="#fff" />
        </Pressable>
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
    fontFamily: 'HankenGrotesk_400Regular',
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
    paddingRight: 8,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    flexShrink: 0,
  },
  sortToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignSelf: 'center',
  },
  listSection: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.containerMargin,
  },
  listContainer: {
    gap: 20,
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
    bottom: 90,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: BorderRadius.premium,
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

  // Premium Ticket Pass Styles (List View)
  ticketCard: {
    flexDirection: 'row',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    position: 'relative',
    height: 180,
  },
  cutoutTop: {
    position: 'absolute',
    top: -8,
    right: '30%',
    width: 16,
    height: 16,
    borderRadius: 8,
    zIndex: 10,
  },
  cutoutBottom: {
    position: 'absolute',
    bottom: -8,
    right: '30%',
    width: 16,
    height: 16,
    borderRadius: 8,
    zIndex: 10,
  },
  ticketLeftImage: {
    width: 100,
    height: '100%',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  ticketLeft: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
    position: 'relative',
  },
  sportAndStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sportBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadgeInline: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  ticketMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  progressSection: {
    marginTop: 4,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  verticalDivider: {
    width: 1,
    height: '100%',
    borderWidth: 0.5,
    position: 'absolute',
    right: '30%',
  },
  ticketRight: {
    width: '30%',
    paddingHorizontal: 8,
    paddingTop: 32,
    paddingBottom: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  ticketRegisterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.full,
    width: '100%',
    alignItems: 'center',
  },
  ticketActionBtn: {
    padding: 2,
  },
  stubActions: {
    flexDirection: 'row',
    gap: 6,
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
  },

  // Premium Grid Ticket Styles (Grid View)
  ticketGridCard: {
    width: '48%',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    position: 'relative',
    marginBottom: Spacing.sm,
  },
  gridCutoutLeft: {
    position: 'absolute',
    left: -8,
    bottom: 50,
    width: 16,
    height: 16,
    borderRadius: 8,
    zIndex: 10,
  },
  gridCutoutRight: {
    position: 'absolute',
    right: -8,
    bottom: 50,
    width: 16,
    height: 16,
    borderRadius: 8,
    zIndex: 10,
  },
  gridCardHeader: {
    height: 80,
    position: 'relative',
  },
  gridCardImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  statusBadgeAbsolute: {
    position: 'absolute',
    top: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff174414',
    borderColor: '#ff174433',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    gap: 4,
    zIndex: 20,
  },
  statusBadgeInlineNoBg: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ff1744',
  },
  liveText: {
    color: '#ff1744',
    fontSize: 7,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  gridSponsoredBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#05151e',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: BorderRadius.default,
    borderWidth: 1,
    borderColor: '#5D68E833',
  },
  ticketActionBtnCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(5, 21, 30, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridCardDetails: {
    padding: 8,
  },
  gridSportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridSportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  horizontalDivider: {
    width: '100%',
    height: 1,
    borderWidth: 0.5,
    position: 'absolute',
    bottom: 58,
  },
  gridCardFooter: {
    height: 58,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  gridRegisterBtn: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.full,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    height: 30,
    justifyContent: 'center',
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
  ticketPriceHighlight: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  gridPriceHighlight: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginRight: 6,
  },
  fabTop: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 110 : 90,
    right: Spacing.md,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 999,
  },
});
