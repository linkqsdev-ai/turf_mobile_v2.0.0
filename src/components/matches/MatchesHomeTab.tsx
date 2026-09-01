import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Platform,
  Animated,
  Alert,
  Modal,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CoinTossModal } from '@/components/coin-toss-modal';
import Reanimated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GradientContainer } from '@/components/gradient-container';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { PromoBanner } from '@/components/promo-banner';
import { BidAcceptModal } from '@/components/matches/BidAcceptModal';
import { useNotifications } from '@/context/NotificationContext';
import { useToast } from '@/context/ToastContext';
import { useBidStore, useClassStore } from '@/store/app-store';
import { useUserProfile } from '@/hooks/use-user-profile';
import { isTimeSlotPassed } from '@/utils/date-utils';
import { FoFAvatarStack } from '@/components/fof/FoFAvatarStack';
import { getSportIllustration } from '@/constants/sports';
import { MotionIllustration } from '@/components/motion-illustration';

const FILTERS = ['Me', 'All', 'Turf', 'Ground', 'Bid', 'Coaching', 'Tournament', 'Finished'];

export function MatchesHomeTab() {
  const theme = useTheme();
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState('Me');
  const [refreshing, setRefreshing] = useState(false);
  const { classes } = useClassStore();
  const { bids, addBid, removeBid } = useBidStore();
  const { profile } = useUserProfile();

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  // Modals state for Book, Bid Match, and Scorecard Details
  const [selectedBookMatch, setSelectedBookMatch] = useState<any>(null);
  const [selectedBidMatch, setSelectedBidMatch] = useState<any>(null);
  const [selectedScorecardMatch, setSelectedScorecardMatch] = useState<any>(null);
  const [acceptBidMatch, setAcceptBidMatch] = useState<any>(null);
  const [bookTimeSlot, setBookTimeSlot] = useState('6:00 PM - 7:00 PM (₹150)');
  const [bidCoins, setBidCoins] = useState(100);

  const renderFinishedBadge = (sport: string) => {
    let iconName: any = 'sports-kabaddi';
    let badgeColor = '#5D68E8';
    
    const s = sport.toLowerCase();
    if (s === 'cricket') {
      iconName = 'cricket';
      badgeColor = '#eab308'; // Amber/Gold
    } else if (s === 'football' || s === 'soccer') {
      iconName = 'soccer';
      badgeColor = '#10b981'; // Green
    } else if (s === 'basketball') {
      iconName = 'basketball';
      badgeColor = '#f97316'; // Orange
    } else if (s === 'tennis') {
      iconName = 'tennis';
      badgeColor = '#84cc16'; // Tennis ball green/lime
    } else if (s === 'badminton') {
      iconName = 'badminton';
      badgeColor = '#06b6d4'; // Cyan
    } else if (s === 'squash') {
      iconName = 'racket' as any;
      badgeColor = '#8b5cf6'; // Purple
    }

    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 2.5 }}>
        <MaterialCommunityIcons name={iconName} size={12} color={badgeColor} />
        <ThemedText style={{ color: badgeColor, fontFamily: 'Sora_700Bold', fontSize: 10, letterSpacing: 0.5 }}>
          Finished
        </ThemedText>
      </View>
    );
  };

  // Spring scale animations for floating buttons
  const scaleAnimTeam = useState(new Animated.Value(1))[0];
  const scaleAnimMatch = useState(new Animated.Value(1))[0];

  const handlePressIn = (anim: Animated.Value) => {
    Animated.spring(anim, {
      toValue: 0.92,
      useNativeDriver: true,
      tension: 100,
      friction: 5,
    }).start();
  };

  const handlePressOut = (anim: Animated.Value) => {
    Animated.spring(anim, {
      toValue: 1.0,
      useNativeDriver: true,
      tension: 100,
      friction: 5,
    }).start();
  };

  const handleMatchCenterSelect = (matchItem: any, sport: string = 'cricket') => {
    if (typeof matchItem === 'object' && matchItem?.isBid) {
      const isOpponentFinalized = Boolean(
        matchItem.team2 &&
        matchItem.team2 !== 'Open Opponent' &&
        matchItem.team2 !== 'VS' &&
        matchItem.status !== 'Requested' &&
        matchItem.status !== 'Challenge' &&
        matchItem.status !== 'Accept Bid'
      );
      if (!isOpponentFinalized) {
        Alert.alert(
          'Opponent Not Finalized ⏳',
          'This bid match is waiting for an opponent to accept the challenge. The scoreboard will be unlocked once an opponent has accepted and finalized the match.'
        );
        return;
      }
    }

    const matchId = typeof matchItem === 'string' ? matchItem : matchItem?.id || 'cricket-live-1';
    router.push({
      pathname: '/scoring',
      params: { matchId, sport },
    });
  };

  return (
    <View style={styles.container}>
      {/* Fixed Filter Tabs at the top */}
      <View style={{ backgroundColor: theme.background, borderBottomWidth: 1, borderColor: theme.outlineVariant + '15', paddingVertical: 4 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.filtersContainer, { paddingVertical: 8 }]}
        >
          {FILTERS.map((filter) => {
            const isActive = filter === selectedFilter;
            return (
              <Pressable
                key={filter}
                onPress={() => setSelectedFilter(filter)}
                style={[
                  styles.filterChip,
                  { paddingHorizontal: 12, paddingVertical: 4.5 },
                  isActive
                    ? { backgroundColor: 'transparent', borderColor: theme.primary, borderWidth: 1.5 }
                    : { backgroundColor: 'transparent', borderColor: theme.outlineVariant + '33', borderWidth: 1.5 },
                ]}
              >
                <ThemedText
                  style={{ 
                    color: isActive ? theme.primary : theme.textSecondary,
                    fontFamily: isActive ? 'Sora_600SemiBold' : 'Sora_500Medium',
                    fontSize: 10.5,
                  }}
                >
                  {filter}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
      <Reanimated.View entering={FadeInDown.duration(600).damping(14)} style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
          }
        >
          {/* Matches Hero Banner */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.containerMargin, paddingTop: Spacing.sm, marginBottom: Spacing.xs }}>
            <View style={{ flex: 1 }}>
              <ThemedText type="headlineLg" style={{ color: theme.text }}>Matches</ThemedText>
              <ThemedText type="bodySm" style={{ color: theme.textSecondary, marginTop: 6, lineHeight: 18 }}>
                Track live scores and upcoming fixtures.
              </ThemedText>
            </View>
            <MotionIllustration
              scenario="matches"
              size={104}
              accessibilityLabel="Live match scoreboard illustration"
            />
          </View>

          {/* LIVE NOW Section temporarily removed */}
          {/* 
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="labelMd" style={{ color: theme.textSecondary, textTransform: 'none' }}>
                Live Now
              </ThemedText>
              <View style={[styles.pulseDot, { backgroundColor: theme.error }]} />
            </View>

            <Pressable
              onPress={() => handleMatchCenterSelect('rcb-ipl')}
              style={[styles.matchCardShadowWrapper, Shadows.level2]}
            >
              <View style={[styles.matchCardContent, { backgroundColor: theme.surfaceLowest }]}>
                <Image
                  source={require('@/assets/images/illustrations/cricket_player.png')}
                  style={styles.cardWatermark}
                  contentFit="contain"
                />

                 <View style={styles.cardHeader}>
                  <View style={styles.badgeRow}>
                    <Ionicons name="podium-outline" size={12} color={theme.error} />
                    <ThemedText type="labelSm" style={{ color: theme.error, fontWeight: '700', marginLeft: 4 }}>
                      IPL 2026
                    </ThemedText>
                  </View>
                  <View style={[styles.meBadge, { backgroundColor: theme.secondaryContainer + '22', borderColor: theme.secondaryContainer, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 4 }]}>
                    <Ionicons name="person" size={8} color={theme.secondary} style={{ marginRight: 2 }} />
                    <ThemedText style={{ color: theme.secondary, fontFamily: 'Sora_800ExtraBold', fontSize: 8, letterSpacing: 0.5 }}>ME</ThemedText>
                  </View>
                </View>

                <View style={styles.liveScoreRow}>
                  <View style={styles.teamInfoCol}>
                    <View style={styles.teamLogoName}>
                      <View style={[styles.teamLetterLogo, { backgroundColor: theme.primaryContainer }]}>
                        <ThemedText type="labelSm" style={{ color: '#ffffff', fontSize: 10, fontWeight: '700' }}>RCB</ThemedText>
                      </View>
                      <ThemedText type="bodyMd" style={{ marginLeft: 8, fontFamily: 'Sora_700Bold', color: theme.text }}>
                        RCB
                      </ThemedText>
                    </View>
                    <ThemedText style={{ fontSize: 20, fontFamily: 'Sora_800ExtraBold', color: theme.primary, marginTop: 2 }}>
                      172/4
                    </ThemedText>
                    <ThemedText style={{ color: theme.textSecondary, fontSize: 10, fontFamily: 'Sora_500Medium', marginTop: 1 }}>
                      18.2 overs
                    </ThemedText>
                  </View>

                  <View style={styles.vsContainer}>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_500Medium' }}>vs</ThemedText>
                  </View>

                  <View style={[styles.teamInfoCol, { alignItems: 'flex-end' }]}>
                    <View style={[styles.teamLogoName, { flexDirection: 'row-reverse' }]}>
                      <View style={[styles.teamLetterLogo, { backgroundColor: theme.outlineVariant, marginLeft: 6 }]}>
                        <ThemedText type="labelSm" style={{ color: '#ffffff', fontSize: 10, fontWeight: '700' }}>KXI</ThemedText>
                      </View>
                      <ThemedText type="bodyMd" style={{ color: theme.text, fontFamily: 'Sora_700Bold', textAlign: 'right', marginRight: 8 }}>
                        KXI
                      </ThemedText>
                    </View>
                    <ThemedText style={{ fontSize: 20, color: theme.textSecondary, fontFamily: 'Sora_800ExtraBold', marginTop: 2, textAlign: 'right' }}>
                      -
                    </ThemedText>
                    <ThemedText style={{ color: theme.textSecondary, fontSize: 10, fontFamily: 'Sora_500Medium', marginTop: 1, textAlign: 'right' }}>
                      2nd innings
                    </ThemedText>
                  </View>
                </View>

                <View style={[styles.cardFooter, { borderTopColor: theme.outlineVariant + '33' }]}>
                  <View style={styles.footerVenue}>
                    <Ionicons name="football-outline" size={14} color={theme.textSecondary} />
                    <ThemedText type="bodyMd" style={styles.footerVenueText}>
                      M. Chinnaswamy Stadium
                    </ThemedText>
                  </View>
                  <View style={styles.matchCenterLink}>
                    <ThemedText type="labelSm" style={{ color: theme.text, fontFamily: 'Sora_700Bold' }}>
                      Match Center
                    </ThemedText>
                    <Ionicons name="arrow-forward" size={12} color={theme.text} style={{ marginLeft: 2 }} />
                  </View>
                </View>
              </View>
            </Pressable>
          </View>
          */}

          {/* Coaching: the whole feed becomes the classes coaches have published */}
          {selectedFilter === 'Coaching' ? (
            <View style={[styles.section, { marginBottom: Spacing.sm }]}>
              <ThemedText type="labelMd" style={{ color: theme.textSecondary, textTransform: 'none', marginBottom: Spacing.xs }}>
                Academy Coaching Classes
              </ThemedText>
              {classes.length > 0 ? (
                <View style={{ gap: 12 }}>
                  {classes.map((cls: any, idx: number) => {
                    const sport = cls.sportType || 'Sports';
                    const fee = cls.feeAmount
                      ? `₹${cls.feeAmount}/${cls.feeType === 'Per Session' ? 'sess' : 'mo'}`
                      : 'Free';
                    const certificate =
                      cls.certificateName ||
                      (cls.certificates && cls.certificates.length > 0 ? cls.certificates[0] : null);

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
                          rate: fee,
                          location: cls.venue,
                          match: 'Your Class',
                          sports: sport.toLowerCase(),
                          avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
                          badge: 'OWNER',
                        },
                      });
                    };

                    return (
                      <Pressable
                        key={cls.id || `match-class-${idx}`}
                        style={[
                          styles.advertisementCard,
                          {
                            backgroundColor: theme.surfaceLowest,
                            borderColor: theme.outlineVariant + '33',
                            overflow: 'hidden',
                          },
                        ]}
                        onPress={navigateToProfile}
                      >
                        {/* Subtle watermark vector illustration */}
                        <Image
                          source={getSportIllustration(sport)}
                          style={{ position: 'absolute', right: -12, bottom: -12, width: 104, height: 104, opacity: 0.12 }}
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
                            <ThemedText style={{ color: theme.textSecondary, fontSize: 11, marginTop: 1 }} numberOfLines={1}>
                              {cls.classType} · {String(sport).toUpperCase()}
                            </ThemedText>
                          </View>
                          <View style={{ backgroundColor: theme.primary + '18', paddingHorizontal: 9, paddingVertical: 4, borderRadius: BorderRadius.full }}>
                            <ThemedText style={{ color: theme.primary, fontFamily: 'Sora_700Bold', fontSize: 11 }}>{fee}</ThemedText>
                          </View>
                        </View>

                        <ThemedText style={{ color: theme.text, fontFamily: 'Sora_700Bold', fontSize: 15, lineHeight: 20 }} numberOfLines={1}>
                          {cls.className}
                        </ThemedText>

                        <ThemedText style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4 }} numberOfLines={1}>
                          {cls.ageGroup || 'All ages'} · {cls.skillLevel || 'All levels'} · {cls.sessionDuration}
                        </ThemedText>

                        {/* Only shown when the coach actually recorded one — no invented credentials */}
                        {certificate ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                            <Ionicons name="ribbon-outline" size={12} color="#10b981" style={{ marginRight: 4 }} />
                            <ThemedText style={{ color: '#10b981', fontSize: 10, fontFamily: 'Sora_700Bold' }} numberOfLines={1}>
                              {certificate}
                            </ThemedText>
                          </View>
                        ) : null}

                        <View style={{ borderTopWidth: 1, borderTopColor: theme.outlineVariant + '1a', marginTop: 10, paddingTop: 10, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <Ionicons name="location-outline" size={13} color={theme.textSecondary} style={{ marginRight: 4 }} />
                            <ThemedText style={{ color: theme.textSecondary, fontSize: 11, flex: 1 }} numberOfLines={1}>{cls.venue}</ThemedText>
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
                </View>
              ) : (
                <View style={{ paddingVertical: 28, alignItems: 'center' }}>
                  <MotionIllustration scenario="coaching" size={92} accessibilityLabel="No coaching classes" />
                  <ThemedText style={{ color: theme.text, fontFamily: 'Sora_600SemiBold', fontSize: 13, marginTop: 6 }}>
                    No coaching classes yet
                  </ThemedText>
                  <ThemedText style={{ color: theme.textSecondary, fontSize: 11.5, marginTop: 2, textAlign: 'center' }}>
                    Classes published by coaches will appear here.
                  </ThemedText>
                </View>
              )}
            </View>
          ) : (
            <>
              {(() => {
                const currentUserName = (profile?.name && profile.name !== 'Owner') ? profile.name : 'Rahul Sharma';

                const defaultMatchesList = [
                  {
                    id: 'cricket-upcoming-1',
                    tournament: 'Friendly Turf League',
                    location: 'Skyline Turf Arena, Court #2',
                    category: 'Turf',
                    type: 'Friendly',
                    status: 'Upcoming',
                    isMe: true,
                    playerName: currentUserName,
                    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
                    team1: 'Skyline Strikers',
                    team1Code: 'SA',
                    team2: 'City Victors',
                    team2Code: 'CV',
                    timeText: 'Today, 6:00 PM',
                    subText: 'Match Starts at 6:00 PM (Skyline Turf)',
                    statusColor: '#10b981',
                    section: 'Today',
                  },
                  {
                    id: 'cricket-1',
                    tournament: 'T20 Cricket Premier League',
                    location: 'Lords Cricket Ground, London',
                    category: 'Turf',
                    type: 'Tournament',
                    status: 'Finished',
                    isMe: true,
                    playerName: currentUserName,
                    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
                    team1: 'London Lions CC',
                    team1Code: 'LL',
                    team1Score: '178/4',
                    team1Overs: '(20.0 ov)',
                    team1TopScorer: `${currentUserName} 64* (38b)`,
                    team1BestBowler: 'Antony Das 2/28 (4.0 ov)',
                    team2: 'Kent Kings CC',
                    team2Code: 'KK',
                    team2Score: '164/8',
                    team2Overs: '(19.2 ov)',
                    team2TopScorer: 'Siva Kumar 48 (29b)',
                    team2BestBowler: `${currentUserName} 3/22 (4.0 ov)`,
                    playerOfTheMatch: currentUserName,
                    resultText: 'London Lions won by 14 runs',
                    section: 'Today',
                  },
                  {
                    id: 'cricket-2',
                    tournament: 'IPL T20 Super League',
                    location: 'Chinnaswamy Stadium, Bengaluru',
                    category: 'Ground',
                    type: 'Tournament',
                    status: 'Finished',
                    isMe: false,
                    playerName: 'Siva Kumar',
                    avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
                    team1: 'Siva Eleven',
                    team1Code: 'SE',
                    team1Score: '152/3',
                    team1Overs: '(16.4 ov)',
                    team1TopScorer: 'Siva Kumar 72* (42b)',
                    team1BestBowler: 'Antony Das 2/30 (4.0 ov)',
                    team2: 'Antony Warriors',
                    team2Code: 'AW',
                    team2Score: '148/9',
                    team2Overs: '(20.0 ov)',
                    team2TopScorer: 'Antony Das 54 (36b)',
                    team2BestBowler: 'Siva Kumar 3/18 (4.0 ov)',
                    playerOfTheMatch: 'Siva Kumar',
                    resultText: 'Siva Eleven won by 7 wickets (20 balls remaining)',
                    section: 'Today',
                  },
                  {
                    id: 'cricket-upcoming-2',
                    tournament: 'National Ground Championship',
                    location: 'Central Sports Complex, Delhi',
                    category: 'Ground',
                    type: 'Tournament',
                    status: 'Upcoming',
                    isMe: false,
                    playerName: 'Vikram Verma',
                    avatar: 'https://randomuser.me/api/portraits/men/52.jpg',
                    team1: 'Vikram Titans',
                    team1Code: 'VT',
                    team2: 'Deccan Chargers',
                    team2Code: 'DC',
                    timeText: 'Tomorrow, 4:30 PM',
                    subText: 'Quarter Final Match at Central Ground',
                    statusColor: '#3b82f6',
                    section: 'Upcoming Fixtures',
                  },
                  {
                    id: 'yesterday-cricket-1',
                    tournament: 'T20 Blast Cricket',
                    location: 'Ovals Turf Arena, London',
                    category: 'Turf',
                    type: 'Tournament',
                    status: 'Finished',
                    isMe: false,
                    playerName: 'Antony Das',
                    avatar: 'https://randomuser.me/api/portraits/men/68.jpg',
                    team1: 'Middlesex Titans',
                    team1Code: 'MT',
                    team1Score: '145/6',
                    team1Overs: '(20.0 ov)',
                    team1TopScorer: 'Antony Das 58 (40b)',
                    team1BestBowler: 'Priya Patel 2/25 (4.0 ov)',
                    team2: 'Sussex Sharks',
                    team2Code: 'SS',
                    team2Score: '142/9',
                    team2Overs: '(19.4 ov)',
                    team2TopScorer: 'Vikram Verma 42 (30b)',
                    team2BestBowler: 'Antony Das 3/20 (4.0 ov)',
                    playerOfTheMatch: 'Antony Das',
                    resultText: 'Middlesex Titans won by 3 runs',
                    section: 'Yesterday',
                  },
                  {
                    id: 'yesterday-cricket-2',
                    tournament: 'County Cricket League',
                    location: 'Yorkshire County Ground, Leeds',
                    category: 'Ground',
                    type: 'Tournament',
                    status: 'Finished',
                    isMe: false,
                    playerName: 'Priya Patel',
                    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
                    team1: 'London Giants',
                    team1Code: 'LG',
                    team1Score: '188/3',
                    team1Overs: '(20.0 ov)',
                    team1TopScorer: 'Priya Patel 81* (52b)',
                    team1BestBowler: 'Vikram Verma 2/34 (4.0 ov)',
                    team2: 'York Knights',
                    team2Code: 'YK',
                    team2Score: '185/8',
                    team2Overs: '(20.0 ov)',
                    team2TopScorer: 'Anish Hegde 66 (38b)',
                    team2BestBowler: 'Priya Patel 2/29 (4.0 ov)',
                    playerOfTheMatch: 'Priya Patel',
                    resultText: 'London Giants won by 3 runs',
                    section: 'Yesterday',
                  },
                  {
                    id: 'cricket-upcoming-3',
                    tournament: 'Night Turf Challenge',
                    location: 'Skyline Turf Arena, Floodlight Pitch',
                    category: 'Turf',
                    type: 'Friendly',
                    status: 'Upcoming',
                    isMe: false,
                    playerName: 'Anish Hegde',
                    avatar: 'https://randomuser.me/api/portraits/men/76.jpg',
                    team1: 'Night Strikers',
                    team1Code: 'NS',
                    team2: 'Turf Blasters',
                    team2Code: 'TB',
                    timeText: 'Tomorrow, 9:00 PM',
                    subText: 'Floodlight Match at Skyline Turf Arena',
                    statusColor: '#8b5cf6',
                    section: 'Upcoming Fixtures',
                  },
                  {
                    id: 'corporate-cricket-1',
                    tournament: 'Corporate Cricket Trophy',
                    location: 'Chepauk Stadium, Chennai',
                    category: 'Ground',
                    type: 'Tournament',
                    status: 'Finished',
                    isMe: true,
                    playerName: currentUserName,
                    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
                    team1: 'Chennai Super Kings',
                    team1Code: 'CSK',
                    team1Score: '192/4',
                    team1Overs: '(20.0 ov)',
                    team1TopScorer: `${currentUserName} 88* (49b)`,
                    team1BestBowler: 'Chennai Kings 2/36 (4.0 ov)',
                    team2: 'Mumbai Indians',
                    team2Code: 'MI',
                    team2Score: '189/7',
                    team2Overs: '(20.0 ov)',
                    team2TopScorer: 'Karthik Raj 74 (41b)',
                    team2BestBowler: `${currentUserName} 3/28 (4.0 ov)`,
                    playerOfTheMatch: currentUserName,
                    resultText: 'Chennai Super Kings won by 3 runs',
                    section: 'Past Matches',
                  },
                  {
                    id: 'cricket-upcoming-4',
                    tournament: 'City Champions Trophy',
                    location: 'Marina Sports Ground, Chennai',
                    category: 'Ground',
                    type: 'Tournament',
                    status: 'Upcoming',
                    isMe: false,
                    playerName: 'Karthik Raj',
                    avatar: 'https://randomuser.me/api/portraits/men/85.jpg',
                    team1: 'Karthik Royals',
                    team1Code: 'KR',
                    team2: 'Metro Warriors',
                    team2Code: 'MW',
                    timeText: 'This Weekend, 3:00 PM',
                    subText: 'Grand Final Match at Marina Sports Ground',
                    statusColor: '#f59e0b',
                    section: 'Upcoming Fixtures',
                  },
                  /* ── Live Open Bid Challenges (Shown under 'Bid' Tab with 'Accept Bid' Action) ── */
                  {
                    id: 'bid-challenge-cricket-1',
                    tournament: 'Bid Challenge: Cricket',
                    location: 'Skyline Turf Arena, Court #1',
                    category: 'Turf',
                    sport: 'Cricket',
                    type: 'Bid',
                    status: 'Accept Bid',
                    isMe: false,
                    isBid: true,
                    playerName: 'Rahul Sharma',
                    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
                    team1: 'Rahul XI',
                    team1Code: 'RX',
                    team2: 'Open Opponent',
                    opponentTeam: 'Open Opponent',
                    timeText: 'Today, 8:00 PM',
                    subText: 'Bid Active • Stake: ₹200 (200 Coins)',
                    bidCoins: 200,
                    statusColor: '#8b5cf6',
                    section: 'Today',
                  },
                  {
                    id: 'bid-challenge-football-1',
                    tournament: 'Bid Challenge: Football',
                    location: 'Apex Turf Arena, Court #2',
                    category: 'Turf',
                    sport: 'Football',
                    type: 'Bid',
                    status: 'Accept Bid',
                    isMe: false,
                    isBid: true,
                    playerName: 'Alex Rivera',
                    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
                    team1: 'Weekend Warriors',
                    team1Code: 'WW',
                    team2: 'Open Opponent',
                    opponentTeam: 'Open Opponent',
                    timeText: 'Today, 9:30 PM',
                    subText: 'Bid Active • Stake: ₹500 (500 Coins)',
                    bidCoins: 500,
                    statusColor: '#8b5cf6',
                    section: 'Today',
                  },
                  {
                    id: 'bid-challenge-badminton-1',
                    tournament: 'Bid Challenge: Badminton',
                    location: 'Skyline Badminton Arena',
                    category: 'Turf',
                    sport: 'Badminton',
                    type: 'Bid',
                    status: 'Accept Bid',
                    isMe: false,
                    isBid: true,
                    playerName: 'Sarah Jenkins',
                    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
                    team1: 'Smash Masters',
                    team1Code: 'SM',
                    team2: 'Open Opponent',
                    opponentTeam: 'Open Opponent',
                    timeText: 'Tomorrow, 7:00 AM',
                    subText: 'Bid Active • Stake: ₹100 (100 Coins)',
                    bidCoins: 100,
                    statusColor: '#8b5cf6',
                    section: 'Upcoming Fixtures',
                  },
                  {
                    id: 'bid-challenge-cricket-2',
                    tournament: 'Bid Challenge: Super 11',
                    location: 'Marina Turf Grounds',
                    category: 'Ground',
                    sport: 'Cricket',
                    type: 'Bid',
                    status: 'Accept Bid',
                    isMe: false,
                    isBid: true,
                    playerName: 'Siva Kumar',
                    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
                    team1: 'Marina Blasters',
                    team1Code: 'MB',
                    team2: 'Open Opponent',
                    opponentTeam: 'Open Opponent',
                    timeText: 'Tomorrow, 6:00 PM',
                    subText: 'Bid Active • Stake: ₹350 (350 Coins)',
                    bidCoins: 350,
                    statusColor: '#8b5cf6',
                    section: 'Upcoming Fixtures',
                  },
                ];

                const fullMatchesList = [...bids, ...defaultMatchesList];

                const filterMatch = (item: any) => {
                  if (selectedFilter === 'Bid') {
                    // Under "Bid" tab, show ALL Bid matches with Accept Bid status!
                    return item.isBid === true || item.type === 'Bid';
                  }

                  // Under all other tabs (Me, All, Turf, Ground, Tournament, Upcoming, Finished):
                  // Exclude open/unaccepted Bid matches (so normal tabs remain clean with finalized fixtures only)
                  if (item.isBid === true || item.type === 'Bid') {
                    return false;
                  }

                  if (selectedFilter === 'All') return true;
                  if (selectedFilter === 'Me') return item.isMe;
                  if (selectedFilter === 'Turf') return item.category === 'Turf';
                  if (selectedFilter === 'Ground') return item.category === 'Ground';
                  if (selectedFilter === 'Tournament') return item.type === 'Tournament';
                  if (selectedFilter === 'Finished') return item.status === 'Finished';
                  return true;
                };

                const visibleMatches = fullMatchesList.filter(filterMatch);

                // Group by section
                const sections = ['Today', 'Upcoming Fixtures', 'Yesterday', 'Past Matches'];

                return (
                  <>
                    {visibleMatches.length > 0 ? (
                      sections.map((secName) => {
                        const items = visibleMatches.filter(m => m.section === secName);
                        if (items.length === 0) return null;

                        return (
                          <View key={secName} style={styles.section}>
                            <ThemedText type="labelMd" style={[styles.sectionHeader, { color: theme.textSecondary, textTransform: 'none' }]}>
                              {secName}
                            </ThemedText>

                            {items.map((item, idx) => (
                              <Pressable
                                key={item.id}
                                onPress={() => handleMatchCenterSelect(item, 'cricket')}
                                style={[styles.matchCardShadowWrapper, Shadows.level2, idx > 0 ? { marginTop: 12 } : null]}
                              >
                                <View style={[styles.matchCardContent, { backgroundColor: theme.surfaceLowest }]}>
                                  <View style={styles.cardHeader}>
                                    <View style={{ flex: 1, marginRight: 8 }}>
                                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <ThemedText style={{ color: theme.primary, fontFamily: 'Sora_700Bold', fontSize: 10.5 }}>
                                          {item.tournament}
                                        </ThemedText>
                                      </View>
                                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
                                        <Ionicons name="location-outline" size={11} color={theme.textSecondary} />
                                        <ThemedText style={{ color: theme.textSecondary, fontSize: 9.5, fontFamily: 'Sora_500Medium' }} numberOfLines={1}>
                                          {item.location}
                                        </ThemedText>
                                      </View>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                       <FoFAvatarStack
                                         teamName={item.team1 || item.tournament}
                                         captainName={item.playerName}
                                         size={22}
                                         showCountBadge={true}
                                       />
                                       <ThemedText style={{ color: theme.textSecondary, fontSize: 10, fontFamily: 'Sora_600SemiBold' }}>
                                         {item.playerName}
                                       </ThemedText>
                                     </View>
                                  </View>

                                  <View style={{ marginVertical: 8, gap: 8 }}>
                                    {item.isBid ? (
                                      /* Open Bid Challenge — Single Challenger Team Layout */
                                      <>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                                            <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: theme.primary + '18', justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
                                              <ThemedText style={{ color: theme.primary, fontSize: 11, fontFamily: 'Sora_800ExtraBold' }}>{item.team1Code}</ThemedText>
                                            </View>
                                            <View style={{ flex: 1 }}>
                                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                <ThemedText style={{ fontSize: 13, fontFamily: 'Sora_700Bold', color: theme.text }} numberOfLines={1}>
                                                  {item.team1}
                                                </ThemedText>
                                              </View>
                                              <ThemedText style={{ color: theme.textSecondary, fontSize: 10, marginTop: 1 }}>
                                                Challenger Team
                                              </ThemedText>
                                            </View>
                                          </View>
                                          <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_700Bold', color: theme.primary }}>
                                            {item.timeText}
                                          </ThemedText>
                                        </View>
                                      </>
                                    ) : (
                                      /* Standard 2-Team Match Layout */
                                      <>
                                        {/* Team 1 */}
                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                                            <View style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: theme.surfaceHigh, justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
                                              <ThemedText style={{ color: theme.text, fontSize: 10, fontFamily: 'Sora_800ExtraBold' }}>{item.team1Code}</ThemedText>
                                            </View>
                                            <ThemedText style={{ fontSize: 13, fontFamily: 'Sora_700Bold', color: theme.text }} numberOfLines={1}>
                                              {item.team1}
                                            </ThemedText>
                                          </View>
                                          {item.status === 'Finished' ? (
                                            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                                              <ThemedText style={{ fontSize: 13, fontFamily: 'Sora_800ExtraBold', color: theme.text }}>
                                                {item.team1Score}
                                              </ThemedText>
                                              <ThemedText style={{ fontSize: 10, color: theme.textSecondary, fontFamily: 'Sora_500Medium' }}>
                                                {item.team1Overs}
                                              </ThemedText>
                                            </View>
                                          ) : (
                                            <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_600SemiBold', color: theme.primary }}>
                                              {item.timeText}
                                            </ThemedText>
                                          )}
                                        </View>

                                        {/* Team 2 */}
                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                                            <View style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: theme.surfaceHigh, justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
                                              <ThemedText style={{ color: theme.text, fontSize: 10, fontFamily: 'Sora_800ExtraBold' }}>{item.team2Code}</ThemedText>
                                            </View>
                                            <ThemedText style={{ fontSize: 13, fontFamily: 'Sora_700Bold', color: theme.text }} numberOfLines={1}>
                                              {item.team2}
                                            </ThemedText>
                                          </View>
                                          {item.status === 'Finished' ? (
                                            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                                              <ThemedText style={{ fontSize: 13, fontFamily: 'Sora_800ExtraBold', color: theme.textSecondary }}>
                                                {item.team2Score}
                                              </ThemedText>
                                              <ThemedText style={{ fontSize: 10, color: theme.textSecondary, fontFamily: 'Sora_500Medium' }}>
                                                {item.team2Overs}
                                              </ThemedText>
                                            </View>
                                          ) : (
                                            <ThemedText style={{ fontSize: 10, color: theme.textSecondary, fontFamily: 'Sora_500Medium' }}>
                                              Upcoming
                                            </ThemedText>
                                          )}
                                        </View>
                                      </>
                                    )}
                                  </View>

                                  <View style={[styles.cardFooter, { borderTopColor: theme.outlineVariant + '20', paddingTop: 8, marginTop: 4, flexWrap: 'wrap', gap: 6 }]}>
                                    {item.status === 'Finished' ? (
                                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 4, flex: 1, minWidth: '100%' }}>
                                        <MaterialCommunityIcons name="cricket" size={13} color="#eab308" style={{ marginTop: 1 }} />
                                        <ThemedText style={{ color: '#d97706', fontSize: 10, fontFamily: 'Sora_700Bold', flexShrink: 1 }}>
                                          {item.resultText}
                                        </ThemedText>
                                      </View>
                                    ) : (
                                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 4, flex: 1, minWidth: '100%' }}>
                                        <Ionicons name="time-outline" size={13} color={item.statusColor || '#10b981'} style={{ marginTop: 1 }} />
                                        <ThemedText style={{ color: item.statusColor || '#10b981', fontSize: 10, fontFamily: 'Sora_700Bold', flexShrink: 1 }}>
                                          {item.subText}
                                        </ThemedText>
                                      </View>
                                    )}

                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                       {item.status !== 'Finished' && item.section !== 'Past Matches' && item.section !== 'Yesterday' && (
                                         item.isBid ? (
                                           item.isMe ? null : (
                                             <Pressable
                                               onPress={(e) => {
                                                 e.stopPropagation();
                                                 setAcceptBidMatch(item);
                                               }}
                                               style={{
                                                 backgroundColor: '#10b981',
                                                 paddingHorizontal: 10,
                                                 paddingVertical: 3.5,
                                                 borderRadius: 6,
                                               }}
                                             >
                                               <ThemedText style={{ color: '#ffffff', fontSize: 9.5, fontFamily: 'Sora_700Bold' }}>
                                                 Accept Bid
                                               </ThemedText>
                                             </Pressable>
                                           )
                                         ) : (
                                           item.isMe ? (
                                             <>
                                               {item.category === 'Turf' && (
                                                 <Pressable
                                                   onPress={(e) => {
                                                     e.stopPropagation();
                                                     router.push({
                                                       pathname: '/booking',
                                                       params: { matchId: item.id, venue: item.location, title: item.tournament },
                                                     });
                                                   }}
                                                   style={{
                                                     backgroundColor: theme.primary,
                                                     paddingHorizontal: 8,
                                                     paddingVertical: 3.5,
                                                     borderRadius: 6,
                                                   }}
                                                 >
                                                   <ThemedText style={{ color: '#ffffff', fontSize: 9.5, fontFamily: 'Sora_700Bold' }}>
                                                     Book
                                                   </ThemedText>
                                                 </Pressable>
                                               )}

                                               {(item.category === 'Ground' || item.category === 'Turf') && (
                                                 <Pressable
                                                   onPress={(e) => {
                                                     e.stopPropagation();
                                                     setSelectedBidMatch(item);
                                                   }}
                                                   style={{
                                                     backgroundColor: '#8b5cf6',
                                                     paddingHorizontal: 8,
                                                     paddingVertical: 3.5,
                                                     borderRadius: 6,
                                                   }}
                                                 >
                                                   <ThemedText style={{ color: '#ffffff', fontSize: 9.5, fontFamily: 'Sora_700Bold' }}>
                                                     Bid Match
                                                   </ThemedText>
                                                 </Pressable>
                                               )}
                                             </>
                                           ) : null
                                         )
                                       )}

                                      <Pressable
                                        onPress={(e) => {
                                          e.stopPropagation();
                                          handleMatchCenterSelect(item, 'cricket');
                                        }}
                                        style={styles.matchCenterLink}
                                      >
                                        <ThemedText style={{ color: theme.text, fontSize: 10.5, fontFamily: 'Sora_700Bold' }}>
                                          {item.status === 'Finished' ? 'Scorecard' : 'Details'}
                                        </ThemedText>
                                        <Ionicons name="chevron-forward" size={12} color={theme.text} />
                                      </Pressable>
                                    </View>
                                  </View>
                                </View>
                              </Pressable>
                            ))}
                          </View>
                        );
                      })
                    ) : (
                      <View style={{ paddingVertical: 40, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="funnel-outline" size={38} color={theme.textSecondary + '60'} />
                        <ThemedText style={{ color: theme.textSecondary, fontSize: 13, fontFamily: 'Sora_600SemiBold', marginTop: 10 }}>
                          No matches available for "{selectedFilter}"
                        </ThemedText>
                      </View>
                    )}
                  </>
                );
              })()}

              {/* Tournament Offer Zone Row */}
              {(selectedFilter === 'Me' || selectedFilter === 'All') && (
                <View style={[styles.section, { paddingBottom: 120 }]}>
                  <ThemedText type="labelMd" style={{ color: theme.textSecondary, textTransform: 'none', marginBottom: Spacing.xs }}>
                    Tournament Offer Zone
                  </ThemedText>
                  <ScrollView 
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingVertical: 4, gap: 16, paddingHorizontal: 4 }}
                  >
                    <View style={{ width: 305 }}>
                      <PromoBanner 
                        title="Grand Summer Tournament!"
                        subtitle="Win up to ₹50,000 in prizes + kit gifts. Slots filling fast!"
                        buttonText="Register Team"
                        badgeText="TOURNAMENT OFFER"
                        isGradient={true}
                        gradientColors={['rgba(99, 102, 241, 0.65)', 'rgba(168, 85, 247, 0.85)']}
                        titleColor="#ffffff"
                        subtitleColor="rgba(255, 255, 255, 0.92)"
                        badgeBackgroundColor="rgba(255, 255, 255, 0.25)"
                        badgeTextColor="#ffffff"
                        badgeBorderColor="rgba(255, 255, 255, 0.4)"
                        buttonBackgroundColor="#ffffff"
                        buttonTextColor="#4f46e5"
                        backgroundImage={require('@/assets/images/illustrations/summer_tournament_banner_bg.png')}
                        onPress={() => router.push('/(tabs)/tournaments')}
                      />
                    </View>
                    <View style={{ width: 305 }}>
                      <PromoBanner 
                        title="Weekend Champions League"
                        subtitle="20% Discount on Team Registrations this week!"
                        buttonText="Join Tournament"
                        badgeText="SPECIAL LEAGUE"
                        isGradient={true}
                        gradientColors={['rgba(245, 158, 11, 0.75)', 'rgba(217, 119, 6, 0.95)']}
                        titleColor="#ffffff"
                        subtitleColor="rgba(255, 255, 255, 0.92)"
                        badgeBackgroundColor="rgba(255, 255, 255, 0.25)"
                        badgeTextColor="#ffffff"
                        badgeBorderColor="rgba(255, 255, 255, 0.4)"
                        buttonBackgroundColor="#ffffff"
                        buttonTextColor="#d97706"
                        backgroundImage={require('@/assets/images/illustrations/tournament_hero.png')}
                        onPress={() => router.push('/(tabs)/tournaments')}
                      />
                    </View>
                  </ScrollView>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </Reanimated.View>

      {/* 1. Book Turf Slot Popup Modal */}
      <Modal
        visible={!!selectedBookMatch}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedBookMatch(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedBookMatch(null)}>
          <Pressable style={[styles.modalCard, { backgroundColor: theme.surfaceLowest }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <ThemedText style={{ fontSize: 16, fontFamily: 'Sora_800ExtraBold', color: theme.text }}>
                  Book Turf Slot
                </ThemedText>
                <ThemedText style={{ fontSize: 11, color: theme.textSecondary, fontFamily: 'Sora_500Medium', marginTop: 2 }}>
                  {selectedBookMatch?.location}
                </ThemedText>
              </View>
              <Pressable onPress={() => setSelectedBookMatch(null)}>
                <Ionicons name="close-circle" size={24} color={theme.textSecondary} />
              </Pressable>
            </View>

            <View style={{ marginVertical: 16, gap: 12 }}>
              <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_700Bold', color: theme.text }}>
                Select Preferred Timing Slot:
              </ThemedText>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                {['6:00 PM - 7:00 PM (₹150)', '7:00 PM - 8:00 PM (₹180)', '8:00 PM - 9:00 PM (₹200)'].map((slot, i) => {
                  const isPassed = isTimeSlotPassed(slot, new Date());
                  const isSelected = bookTimeSlot === slot;

                  return (
                    <Pressable
                      key={i}
                      disabled={isPassed}
                      onPress={() => setBookTimeSlot(slot)}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 6,
                        backgroundColor: isSelected ? theme.primary + '15' : theme.surfaceHigh,
                        borderWidth: 1,
                        borderColor: isSelected ? theme.primary : 'transparent',
                        opacity: isPassed ? 0.35 : 1,
                      }}
                    >
                      <ThemedText
                        style={{
                          fontSize: 11,
                          fontFamily: 'Sora_600SemiBold',
                          color: isSelected ? theme.primary : isPassed ? theme.textSecondary : theme.text,
                          textDecorationLine: isPassed ? 'line-through' : 'none',
                        }}
                      >
                        {slot}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>

              <View style={{ backgroundColor: theme.surfaceHigh, padding: 12, borderRadius: 8, marginTop: 4 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <ThemedText style={{ fontSize: 11, color: theme.textSecondary }}>Slot Rent:</ThemedText>
                  <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_700Bold', color: theme.text }}>₹150.00</ThemedText>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <ThemedText style={{ fontSize: 11, color: theme.textSecondary }}>Convenience Fee:</ThemedText>
                  <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_700Bold', color: theme.text }}>₹0.00 (FREE)</ThemedText>
                </View>
              </View>
            </View>

            <Pressable
              onPress={() => {
                Alert.alert('Booking Confirmed!', `Slot booked successfully at ${selectedBookMatch?.location} for ${bookTimeSlot}!`);
                setSelectedBookMatch(null);
              }}
              style={{
                backgroundColor: theme.primary,
                paddingVertical: 12,
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              <ThemedText style={{ color: '#ffffff', fontFamily: 'Sora_700Bold', fontSize: 13 }}>
                Confirm Booking & Pay ₹150
              </ThemedText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 2. Bid Match Challenge Popup Modal */}
      <Modal
        visible={!!selectedBidMatch}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedBidMatch(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedBidMatch(null)}>
          <Pressable style={[styles.modalCard, { backgroundColor: theme.surfaceLowest }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <ThemedText style={{ fontSize: 16, fontFamily: 'Sora_800ExtraBold', color: theme.text }}>
                  Bid Match Challenge
                </ThemedText>
                <ThemedText style={{ fontSize: 11, color: theme.textSecondary, fontFamily: 'Sora_500Medium', marginTop: 2 }}>
                  Challenge {selectedBidMatch?.team1} @ {selectedBidMatch?.location}
                </ThemedText>
              </View>
              <Pressable onPress={() => setSelectedBidMatch(null)}>
                <Ionicons name="close-circle" size={24} color={theme.textSecondary} />
              </Pressable>
            </View>

            <View style={{ marginVertical: 16, gap: 12 }}>
              <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_700Bold', color: theme.text }}>
                Select Coin Bid Amount:
              </ThemedText>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[50, 100, 250, 500].map((coins) => (
                  <Pressable
                    key={coins}
                    onPress={() => setBidCoins(coins)}
                    style={{
                      flex: 1,
                      paddingVertical: 8,
                      borderRadius: 6,
                      alignItems: 'center',
                      backgroundColor: bidCoins === coins ? '#8b5cf615' : theme.surfaceHigh,
                      borderWidth: 1,
                      borderColor: bidCoins === coins ? '#8b5cf6' : 'transparent',
                    }}
                  >
                    <MaterialCommunityIcons name="circle-multiple" size={14} color={bidCoins === coins ? '#8b5cf6' : theme.textSecondary} />
                    <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_700Bold', color: bidCoins === coins ? '#8b5cf6' : theme.text, marginTop: 2 }}>
                      {coins}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>

              <View style={{ backgroundColor: theme.surfaceHigh, padding: 12, borderRadius: 8, marginTop: 4 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <ThemedText style={{ fontSize: 11, color: theme.textSecondary }}>Your Challenge Bid:</ThemedText>
                  <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_700Bold', color: '#8b5cf6' }}>{bidCoins} Coins</ThemedText>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <ThemedText style={{ fontSize: 11, color: theme.textSecondary }}>Winning Reward Pool:</ThemedText>
                  <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_700Bold', color: '#10b981' }}>{bidCoins * 2} Coins</ThemedText>
                </View>
              </View>
            </View>

            <Pressable
              onPress={() => {
                if (selectedBidMatch) {
                  const currentUserName = (profile?.name && profile.name !== 'Owner') ? profile.name : 'Rahul Sharma';
                  const newBid = {
                    id: `bid-${Date.now()}`,
                    tournament: `Bid Challenge: ${selectedBidMatch.team1}`,
                    location: selectedBidMatch.location,
                    category: selectedBidMatch.category,
                    type: 'Bid',
                    status: 'Upcoming',
                    isMe: true,
                    isBid: true,
                    playerName: currentUserName,
                    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
                    team1: `${currentUserName} XI`,
                    team1Code: 'MY',
                    team2: selectedBidMatch.team1,
                    team2Code: selectedBidMatch.team1Code || 'OP',
                    timeText: 'Challenge Live',
                    subText: `Bid Placed • Stake: ${bidCoins} Coins`,
                    statusColor: '#8b5cf6',
                    section: 'Today',
                    bidCoins: bidCoins,
                  };
                  addBid(newBid);
                  setSelectedBidMatch(null);
                  setSelectedFilter('Bid');
                  Alert.alert('Bid Challenge Placed!', `Your ${bidCoins} Coins challenge against ${selectedBidMatch.team1} has been placed and added to your Bid filter!`);
                }
              }}
              style={{
                backgroundColor: '#8b5cf6',
                paddingVertical: 12,
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              <ThemedText style={{ color: '#ffffff', fontFamily: 'Sora_700Bold', fontSize: 13 }}>
                Place Challenge Bid ({bidCoins} Coins)
              </ThemedText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 3. Match Scorecard Details Popup Modal */}
      <Modal
        visible={!!selectedScorecardMatch}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedScorecardMatch(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedScorecardMatch(null)}>
          <Pressable style={[styles.modalCard, { backgroundColor: theme.surfaceLowest, maxHeight: '85%' }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <ThemedText style={{ fontSize: 15, fontFamily: 'Sora_800ExtraBold', color: theme.text }}>
                  {selectedScorecardMatch?.tournament}
                </ThemedText>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
                  <Ionicons name="location-outline" size={12} color={theme.textSecondary} />
                  <ThemedText style={{ fontSize: 10.5, color: theme.textSecondary, fontFamily: 'Sora_500Medium' }}>
                    {selectedScorecardMatch?.location}
                  </ThemedText>
                </View>
              </View>
              <Pressable onPress={() => setSelectedScorecardMatch(null)}>
                <Ionicons name="close-circle" size={24} color={theme.textSecondary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginVertical: 12 }}>
              {selectedScorecardMatch?.status === 'Finished' ? (
                <>
                  {/* Result Banner */}
                  <View style={{ backgroundColor: '#eab30815', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#eab30840', marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <MaterialCommunityIcons name="trophy" size={16} color="#d97706" />
                      <ThemedText style={{ color: '#d97706', fontSize: 11, fontFamily: 'Sora_700Bold', flex: 1 }}>
                        {selectedScorecardMatch?.resultText}
                      </ThemedText>
                    </View>
                  </View>

                  {/* Team 1 Scorecard Card */}
                  <View style={{ backgroundColor: theme.surfaceHigh, padding: 12, borderRadius: 8, marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <ThemedText style={{ fontSize: 13, fontFamily: 'Sora_700Bold', color: theme.text }}>
                        {selectedScorecardMatch?.team1}
                      </ThemedText>
                      <ThemedText style={{ fontSize: 13, fontFamily: 'Sora_800ExtraBold', color: theme.primary }}>
                        {selectedScorecardMatch?.team1Score} <ThemedText style={{ fontSize: 10, color: theme.textSecondary }}>{selectedScorecardMatch?.team1Overs}</ThemedText>
                      </ThemedText>
                    </View>
                    <View style={{ borderTopWidth: 1, borderTopColor: theme.outlineVariant + '20', paddingTop: 6, gap: 4 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <ThemedText style={{ fontSize: 10.5, color: theme.textSecondary }}>Top Batsman:</ThemedText>
                        <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_600SemiBold', color: theme.text }}>{selectedScorecardMatch?.team1TopScorer || `${selectedScorecardMatch?.playerName} 64*`}</ThemedText>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <ThemedText style={{ fontSize: 10.5, color: theme.textSecondary }}>Best Bowler:</ThemedText>
                        <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_600SemiBold', color: theme.text }}>{selectedScorecardMatch?.team1BestBowler || '2/28 (4.0 ov)'}</ThemedText>
                      </View>
                    </View>
                  </View>

                  {/* Team 2 Scorecard Card */}
                  <View style={{ backgroundColor: theme.surfaceHigh, padding: 12, borderRadius: 8, marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <ThemedText style={{ fontSize: 13, fontFamily: 'Sora_700Bold', color: theme.text }}>
                        {selectedScorecardMatch?.team2}
                      </ThemedText>
                      <ThemedText style={{ fontSize: 13, fontFamily: 'Sora_800ExtraBold', color: theme.textSecondary }}>
                        {selectedScorecardMatch?.team2Score} <ThemedText style={{ fontSize: 10, color: theme.textSecondary }}>{selectedScorecardMatch?.team2Overs}</ThemedText>
                      </ThemedText>
                    </View>
                    <View style={{ borderTopWidth: 1, borderTopColor: theme.outlineVariant + '20', paddingTop: 6, gap: 4 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <ThemedText style={{ fontSize: 10.5, color: theme.textSecondary }}>Top Batsman:</ThemedText>
                        <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_600SemiBold', color: theme.text }}>{selectedScorecardMatch?.team2TopScorer || 'Top Scorer 48'}</ThemedText>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <ThemedText style={{ fontSize: 10.5, color: theme.textSecondary }}>Best Bowler:</ThemedText>
                        <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_600SemiBold', color: theme.text }}>{selectedScorecardMatch?.team2BestBowler || '3/22 (4.0 ov)'}</ThemedText>
                      </View>
                    </View>
                  </View>

                  {/* Match Info Summary */}
                  <View style={{ backgroundColor: theme.surfaceHigh, padding: 12, borderRadius: 8, gap: 4 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <ThemedText style={{ fontSize: 10.5, color: theme.textSecondary }}>Player of the Match:</ThemedText>
                      <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_700Bold', color: theme.primary }}>{selectedScorecardMatch?.playerOfTheMatch || selectedScorecardMatch?.playerName}</ThemedText>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <ThemedText style={{ fontSize: 10.5, color: theme.textSecondary }}>Match Format:</ThemedText>
                      <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_600SemiBold', color: theme.text }}>{selectedScorecardMatch?.type} ({selectedScorecardMatch?.category})</ThemedText>
                    </View>
                  </View>
                </>
              ) : (
                <>
                  {/* Upcoming Status Banner */}
                  <View style={{ backgroundColor: (selectedScorecardMatch?.statusColor || theme.primary) + '15', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: (selectedScorecardMatch?.statusColor || theme.primary) + '40', marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="time-outline" size={16} color={selectedScorecardMatch?.statusColor || theme.primary} />
                      <ThemedText style={{ color: selectedScorecardMatch?.statusColor || theme.primary, fontSize: 11, fontFamily: 'Sora_700Bold', flex: 1 }}>
                        {selectedScorecardMatch?.subText || selectedScorecardMatch?.timeText || 'Match Fixture Upcoming'}
                      </ThemedText>
                    </View>
                  </View>

                  {/* Match Fixture Teams Card */}
                  <View style={{ backgroundColor: theme.surfaceHigh, padding: 14, borderRadius: 8, marginBottom: 10 }}>
                    <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_700Bold', color: theme.textSecondary, marginBottom: 8 }}>
                      Match Lineup:
                    </ThemedText>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
                      <View style={{ alignItems: 'center' }}>
                        <View style={{ width: 38, height: 38, borderRadius: 8, backgroundColor: theme.primary + '20', justifyContent: 'center', alignItems: 'center', marginBottom: 4 }}>
                          <ThemedText style={{ color: theme.primary, fontSize: 12, fontFamily: 'Sora_800ExtraBold' }}>
                            {selectedScorecardMatch?.team1Code || 'T1'}
                          </ThemedText>
                        </View>
                        <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_700Bold', color: theme.text }}>
                          {selectedScorecardMatch?.team1}
                        </ThemedText>
                      </View>

                      <ThemedText style={{ fontSize: 14, fontFamily: 'Sora_800ExtraBold', color: theme.primary }}>VS</ThemedText>

                      <View style={{ alignItems: 'center' }}>
                        <View style={{ width: 38, height: 38, borderRadius: 8, backgroundColor: theme.surfaceLowest, justifyContent: 'center', alignItems: 'center', marginBottom: 4, borderWidth: 1, borderColor: theme.outlineVariant + '30' }}>
                          <ThemedText style={{ color: theme.text, fontSize: 12, fontFamily: 'Sora_800ExtraBold' }}>
                            {selectedScorecardMatch?.team2Code || 'T2'}
                          </ThemedText>
                        </View>
                        <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_700Bold', color: theme.text }}>
                          {selectedScorecardMatch?.team2}
                        </ThemedText>
                      </View>
                    </View>
                  </View>

                  {/* Fixture Details Summary */}
                  <View style={{ backgroundColor: theme.surfaceHigh, padding: 12, borderRadius: 8, gap: 6 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <ThemedText style={{ fontSize: 11, color: theme.textSecondary }}>Scheduled Time:</ThemedText>
                      <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_700Bold', color: theme.text }}>{selectedScorecardMatch?.timeText || 'Today, 6:00 PM'}</ThemedText>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <ThemedText style={{ fontSize: 11, color: theme.textSecondary }}>Venue Location:</ThemedText>
                      <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_600SemiBold', color: theme.text }}>{selectedScorecardMatch?.location}</ThemedText>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <ThemedText style={{ fontSize: 11, color: theme.textSecondary }}>Match Format:</ThemedText>
                      <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_600SemiBold', color: theme.text }}>{selectedScorecardMatch?.type} ({selectedScorecardMatch?.category})</ThemedText>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <ThemedText style={{ fontSize: 11, color: theme.textSecondary }}>Host Player:</ThemedText>
                      <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_600SemiBold', color: theme.text }}>{selectedScorecardMatch?.playerName}</ThemedText>
                    </View>
                  </View>
                </>
              )}
            </ScrollView>

            <Pressable
              onPress={() => setSelectedScorecardMatch(null)}
              style={{
                backgroundColor: theme.surfaceHigh,
                paddingVertical: 10,
                borderRadius: 8,
                alignItems: 'center',
                marginTop: 4,
              }}
            >
              <ThemedText style={{ color: theme.text, fontFamily: 'Sora_700Bold', fontSize: 12 }}>
                {selectedScorecardMatch?.status === 'Finished' ? 'Close Scorecard' : 'Close Details'}
              </ThemedText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Bid Challenge Confirmation Popup Modal */}
      <BidAcceptModal
        visible={!!acceptBidMatch}
        match={acceptBidMatch}
        onClose={() => setAcceptBidMatch(null)}
        onConfirm={(matchId) => {
          removeBid(matchId);
        }}
      />

    </View>
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
    paddingVertical: 10,
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
  filtersContainer: {
    gap: Spacing.xs - 2, // 6px gap
    paddingHorizontal: Spacing.containerMargin,
    paddingVertical: 12,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  liveIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ba1a1a',
    marginRight: 6,
  },
  section: {
    marginTop: 14, // compacted from Spacing.lg (24)
    paddingHorizontal: Spacing.containerMargin,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs, // compacted from Spacing.sm
    letterSpacing: 0.5,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  matchCardShadowWrapper: {
    borderRadius: BorderRadius['2xl'],
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  matchCardContent: {
    borderRadius: BorderRadius['2xl'],
    padding: 12, // compacted from Spacing.md (16)
    borderWidth: 1,
    borderColor: '#c3c7cb33',
    overflow: 'hidden',
    position: 'relative',
  },
  cardWatermark: {
    position: 'absolute',
    right: -40,
    bottom: -40,
    width: 160,
    height: 160,
    opacity: 0.03,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8, // compacted from Spacing.md
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  meBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  leagueTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  liveScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: Spacing.xs,
  },
  teamInfoCol: {
    flex: 1,
  },
  teamLogoName: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamLetterLogo: {
    paddingHorizontal: 6, // dynamic capsule size for 3-letter abbreviations
    height: 24,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamLetterLogoSmall: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.default,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vsContainer: {
    paddingHorizontal: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    marginTop: 10, // compacted from Spacing.md (16)
    paddingTop: 10, // compacted from Spacing.md (16)
  },
  footerVenue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerVenueText: {
    color: '#43474b',
    fontSize: 12,
    marginLeft: 4,
  },
  matchCenterLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduledMatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10, // compacted vertical space
  },
  scheduledTeamLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  scheduledTeamRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  crestContainerSmall: {
    width: 32, // reduced from 44
    height: 32, // reduced from 44
    borderRadius: BorderRadius.lg,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c3c7cb33',
  },
  timeBadgeSmall: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    marginHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  finishedMatchTeamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  finishedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    // Gold Glow Shadow
    shadowColor: '#5D68E8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  fabGroup: {
    position: 'absolute',
    right: Spacing.gutter,
    bottom: Platform.OS === 'ios' ? 104 : 88,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 100,
  },
  fabSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    // Soft Navy Shadow
    shadowColor: '#1a2a33',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  // Offers Banner
  offerBannerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: BorderRadius.premium,
    marginTop: 6,
    overflow: 'hidden',
  },
  offerBannerLeft: {
    flex: 1,
    paddingRight: 8,
  },
  offerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginBottom: 4,
  },
  offerBadgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontFamily: 'Sora_800ExtraBold',
    letterSpacing: 0.8,
  },
  offerTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Sora_700Bold',
  },
  offerSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 10,
    fontFamily: 'Sora_500Medium',
    marginTop: 2,
  },
  offerBookBtn: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  offerBookBtnText: {
    color: '#5D68E8',
    fontSize: 11,
    fontFamily: 'Sora_700Bold',
  },

  // Tourney Ad Card
  tourneyAdCard: {
    padding: 14,
    borderRadius: BorderRadius.premium,
    borderWidth: 1,
    marginTop: 6,
  },
  tourneyAdHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tourneyAdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  tourneyAdSlots: {
    fontSize: 10,
    color: '#E05A47',
    fontFamily: 'Sora_700Bold',
  },
  tourneyAdBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tourneyAdInfo: {
    flex: 1,
    paddingRight: 8,
  },
  tourneyAdTitle: {
    fontSize: 14,
    fontFamily: 'Sora_700Bold',
  },
  tourneyAdMeta: {
    fontSize: 11,
    color: '#43474b',
    fontFamily: 'Sora_500Medium',
    marginTop: 2,
  },
  tourneyAdBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  tourneyAdBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: 'Sora_700Bold',
  },

  challengeShadowWrapper: {
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 12,
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  challengeCard: {
    padding: 14,
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  challengeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#feae2c14',
    borderColor: '#feae2c33',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  challengeBadgeText: {
    color: '#feae2c',
    fontSize: 8,
    fontFamily: 'Sora_800ExtraBold',
    marginLeft: 3,
  },
  challengeBidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5D68E814',
    borderColor: '#5D68E833',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  challengeBidText: {
    color: '#5D68E8',
    fontSize: 8,
    fontFamily: 'Sora_800ExtraBold',
    marginLeft: 4,
  },
  challengeTeamInfo: {
    marginBottom: 10,
  },
  challengeTeamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  challengeTeamLogo: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  challengeTeamName: {
    fontSize: 13,
    fontFamily: 'Sora_700Bold',
  },
  challengeTeamRank: {
    fontSize: 10,
    color: '#43474b',
    fontFamily: 'Sora_500Medium',
  },
  challengeDescription: {
    fontSize: 11,
    color: '#43474b',
    fontFamily: 'Sora_500Medium',
    lineHeight: 15,
  },
  challengeBtn: {
    width: '100%',
    height: 34,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  challengeBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Sora_700Bold',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#0000000d',
  },
});
