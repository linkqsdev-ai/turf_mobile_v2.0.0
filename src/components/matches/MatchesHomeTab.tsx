import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Platform,
  Animated,
  Alert,
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
import { useClassStore } from '@/store/app-store';
import { useUserProfile } from '@/hooks/use-user-profile';

const FILTERS = ['Me', 'All', 'Upcoming', 'Finished', 'Classes'];

export function MatchesHomeTab() {
  const theme = useTheme();
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState('Me');
  const { classes } = useClassStore();
  const { profile } = useUserProfile();

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
        <ThemedText style={{ color: badgeColor, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 10, letterSpacing: 0.5 }}>
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

  const handleMatchCenterSelect = (matchId: string, sport: string = 'cricket') => {
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
                {filter === 'Live' && (
                  <View style={styles.liveIndicatorDot} />
                )}
                <ThemedText
                  style={{ 
                    color: isActive ? theme.primary : theme.textSecondary,
                    fontFamily: isActive ? 'PlusJakartaSans_600SemiBold' : 'PlusJakartaSans_500Medium',
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
        >
          {/* Matches Hero Banner */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.containerMargin, paddingTop: Spacing.sm, marginBottom: Spacing.xs }}>
            <View style={{ flex: 1 }}>
              <ThemedText type="headlineLg" style={{ color: theme.text }}>Matches</ThemedText>
              <ThemedText type="bodySm" style={{ color: theme.textSecondary, marginTop: 4 }}>
                Track live scores and upcoming fixtures.
              </ThemedText>
            </View>
            <Image
              source={require('@/assets/images/illustrations/matches_hero.png')}
              style={{ width: 100, height: 100 }}
              contentFit="contain"
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
                    <ThemedText style={{ color: theme.secondary, fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 8, letterSpacing: 0.5 }}>ME</ThemedText>
                  </View>
                </View>

                <View style={styles.liveScoreRow}>
                  <View style={styles.teamInfoCol}>
                    <View style={styles.teamLogoName}>
                      <View style={[styles.teamLetterLogo, { backgroundColor: theme.primaryContainer }]}>
                        <ThemedText type="labelSm" style={{ color: '#ffffff', fontSize: 10, fontWeight: '700' }}>RCB</ThemedText>
                      </View>
                      <ThemedText type="bodyMd" style={{ marginLeft: 8, fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>
                        RCB
                      </ThemedText>
                    </View>
                    <ThemedText style={{ fontSize: 20, fontFamily: 'HankenGrotesk_800ExtraBold', color: theme.primary, marginTop: 2 }}>
                      172/4
                    </ThemedText>
                    <ThemedText style={{ color: theme.textSecondary, fontSize: 10, fontFamily: 'PlusJakartaSans_500Medium', marginTop: 1 }}>
                      18.2 overs
                    </ThemedText>
                  </View>

                  <View style={styles.vsContainer}>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'HankenGrotesk_500Medium' }}>vs</ThemedText>
                  </View>

                  <View style={[styles.teamInfoCol, { alignItems: 'flex-end' }]}>
                    <View style={[styles.teamLogoName, { flexDirection: 'row-reverse' }]}>
                      <View style={[styles.teamLetterLogo, { backgroundColor: theme.outlineVariant, marginLeft: 6 }]}>
                        <ThemedText type="labelSm" style={{ color: '#ffffff', fontSize: 10, fontWeight: '700' }}>KXI</ThemedText>
                      </View>
                      <ThemedText type="bodyMd" style={{ color: theme.text, fontFamily: 'HankenGrotesk_700Bold', textAlign: 'right', marginRight: 8 }}>
                        KXI
                      </ThemedText>
                    </View>
                    <ThemedText style={{ fontSize: 20, color: theme.textSecondary, fontFamily: 'HankenGrotesk_800ExtraBold', marginTop: 2, textAlign: 'right' }}>
                      -
                    </ThemedText>
                    <ThemedText style={{ color: theme.textSecondary, fontSize: 10, fontFamily: 'PlusJakartaSans_500Medium', marginTop: 1, textAlign: 'right' }}>
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
                    <ThemedText type="labelSm" style={{ color: theme.text, fontFamily: 'PlusJakartaSans_700Bold' }}>
                      Match Center
                    </ThemedText>
                    <Ionicons name="arrow-forward" size={12} color={theme.text} style={{ marginLeft: 2 }} />
                  </View>
                </View>
              </View>
            </Pressable>
          </View>
          */}

          {/* If the filter is 'Classes', only show the coaching classes */}
          {selectedFilter === 'Classes' ? (
            <View style={[styles.section, { marginBottom: Spacing.sm }]}>
              <ThemedText type="labelMd" style={{ color: theme.textSecondary, textTransform: 'none', marginBottom: Spacing.xs }}>
                Academy Coaching Classes
              </ThemedText>
              {classes.length > 0 ? (
                <ScrollView 
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingVertical: 4, gap: 12 }}
                >
                  {classes.map((cls: any, idx: number) => {
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
                          avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
                          badge: 'OWNER',
                        }
                      });
                    };
                    const sportLower = cls.sportType.toLowerCase();
                    const watermarkSource = sportLower.includes('cricket') ? require('@/assets/images/illustrations/cricket_player.png') : (sportLower.includes('football') || sportLower.includes('futsal') ? require('@/assets/images/illustrations/football_player.png') : (sportLower.includes('badminton') ? require('@/assets/images/illustrations/athletes.png') : require('@/assets/images/illustrations/tennis_player.png')));

                    return (
                      <Pressable
                        key={cls.id || `match-class-${idx}`}
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
                            <ThemedText style={{ color: theme.primary, fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 10, letterSpacing: 0.5 }}>COACHING CLASS</ThemedText>
                            <ThemedText style={{ color: theme.textSecondary, fontSize: 11, marginTop: 1 }}>{cls.classType} · {cls.sportType.toUpperCase()}</ThemedText>
                          </View>
                        </View>

                        <ThemedText type="title" style={{ color: theme.text, fontFamily: 'HankenGrotesk_700Bold', fontSize: 15, lineHeight: 20 }} numberOfLines={1}>
                          {cls.className}
                        </ThemedText>
                        
                        <ThemedText type="bodyMd" style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4 }} numberOfLines={1}>
                          Session Duration · {cls.sessionDuration}
                        </ThemedText>

                        <View style={{ borderTopWidth: 1, borderTopColor: theme.outlineVariant + '1a', marginTop: 10, paddingTop: 10 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                            <Ionicons name="location-outline" size={13} color={theme.textSecondary} style={{ marginRight: 4 }} />
                            <ThemedText style={{ color: theme.textSecondary, fontSize: 11 }} numberOfLines={1}>{cls.venue}</ThemedText>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="time-outline" size={13} color={theme.textSecondary} style={{ marginRight: 4 }} />
                            <ThemedText style={{ fontSize: 10, fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>
                              {cls.sessionTime}
                            </ThemedText>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              ) : (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <ThemedText type="bodyMd" style={{ color: theme.textSecondary }}>No Coaching Classes available.</ThemedText>
                </View>
              )}
            </View>
          ) : (
            <>
              {/* TODAY Section */}
              {(selectedFilter === 'Me' || selectedFilter === 'All' || selectedFilter === 'Upcoming') && (
                <View style={styles.section}>
                  <ThemedText type="labelMd" style={[styles.sectionHeader, { color: theme.textSecondary, textTransform: 'none' }]}>
                    Today
                  </ThemedText>

                  {/* Match Card 1: Futsal */}
                  <Pressable
                    onPress={() => router.push({ pathname: '/scoring', params: { matchId: 'futsal-1', sport: 'football' } })}
                    style={[styles.matchCardShadowWrapper, Shadows.level2]}
                  >
                    <View style={[styles.matchCardContent, { backgroundColor: theme.surfaceLowest }]}>
                      <Image
                        source={require('@/assets/images/illustrations/football_player.png')}
                        style={styles.cardWatermark}
                        contentFit="contain"
                      />

                      <View style={styles.cardHeader}>
                        <View style={styles.badgeRow}>
                          <ThemedText style={{ color: theme.textSecondary, fontFamily: 'HankenGrotesk_700Bold', fontSize: 12 }}>
                            Summer Futsal League
                          </ThemedText>
                        </View>
                        <View style={[styles.meBadge, { backgroundColor: theme.secondaryContainer + '22', borderColor: theme.secondaryContainer, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 4 }]}>
                          <Ionicons name="person" size={8} color={theme.secondary} style={{ marginRight: 2 }} />
                          <ThemedText style={{ color: theme.secondary, fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 8, letterSpacing: 0.5 }}>ME</ThemedText>
                        </View>
                      </View>

                      <View style={styles.scheduledMatchRow}>
                        <View style={styles.scheduledTeamLeft}>
                          <View style={styles.crestContainerSmall}>
                            <Ionicons name="shield-half" size={18} color={theme.primary} />
                          </View>
                          <ThemedText type="bodyMd" style={{ marginLeft: 8, fontFamily: 'HankenGrotesk_700Bold', flex: 1 }} numberOfLines={1}>
                            London Lions
                          </ThemedText>
                        </View>

                        <View style={[styles.timeBadgeSmall, { backgroundColor: theme.surfaceHigh }]}>
                          <ThemedText style={{ fontSize: 13, fontFamily: 'HankenGrotesk_800ExtraBold', color: theme.text }}>19:00</ThemedText>
                        </View>

                        <View style={styles.scheduledTeamRight}>
                          <ThemedText type="bodyMd" style={{ marginRight: 8, fontFamily: 'HankenGrotesk_700Bold', flex: 1, textAlign: 'right' }} numberOfLines={1}>
                            Kent Kings
                          </ThemedText>
                          <View style={styles.crestContainerSmall}>
                            <Ionicons name="shield-half" size={18} color={theme.secondaryContainer} />
                          </View>
                        </View>
                      </View>

                      <View style={[styles.cardFooter, { borderTopColor: theme.outlineVariant + '33' }]}>
                        <View style={styles.footerVenue}>
                          <Ionicons name="location-outline" size={14} color={theme.textSecondary} />
                          <ThemedText type="bodyMd" style={styles.footerVenueText}>
                            O2 Arena Turf
                          </ThemedText>
                        </View>
                        <View style={styles.matchCenterLink}>
                          <ThemedText type="labelSm" style={{ color: theme.text, fontFamily: 'PlusJakartaSans_700Bold' }}>
                            Match Center
                          </ThemedText>
                          <Ionicons name="arrow-forward" size={12} color={theme.text} style={{ marginLeft: 2 }} />
                        </View>
                      </View>
                    </View>
                  </Pressable>

                  {/* Match Card 2: Arsenal vs Chelsea */}
                  <Pressable
                    onPress={() => router.push({ pathname: '/scoring', params: { matchId: 'pl-1', sport: 'football' } })}
                    style={[styles.matchCardShadowWrapper, Shadows.level2, { marginTop: 12 }]}
                  >
                    <View style={[styles.matchCardContent, { backgroundColor: theme.surfaceLowest }]}>
                      <Image
                        source={require('@/assets/images/illustrations/football_player.png')}
                        style={styles.cardWatermark}
                        contentFit="contain"
                      />

                      <View style={styles.cardHeader}>
                        <View style={styles.badgeRow}>
                          <ThemedText style={{ color: theme.textSecondary, fontFamily: 'HankenGrotesk_700Bold', fontSize: 12 }}>
                            Premier League
                          </ThemedText>
                        </View>
                      </View>

                      <View style={styles.scheduledMatchRow}>
                        <View style={styles.scheduledTeamLeft}>
                          <View style={styles.crestContainerSmall}>
                            <Ionicons name="shield-half" size={18} color="#ef0107" />
                          </View>
                          <ThemedText type="bodyMd" style={{ marginLeft: 8, fontFamily: 'HankenGrotesk_700Bold', flex: 1 }} numberOfLines={1}>
                            Arsenal
                          </ThemedText>
                        </View>

                        <View style={[styles.timeBadgeSmall, { backgroundColor: theme.surfaceHigh }]}>
                          <ThemedText style={{ fontSize: 13, fontFamily: 'HankenGrotesk_800ExtraBold', color: theme.text }}>21:00</ThemedText>
                        </View>

                        <View style={styles.scheduledTeamRight}>
                          <ThemedText type="bodyMd" style={{ marginRight: 8, fontFamily: 'HankenGrotesk_700Bold', flex: 1, textAlign: 'right' }} numberOfLines={1}>
                            Chelsea
                          </ThemedText>
                          <View style={styles.crestContainerSmall}>
                            <Ionicons name="shield-half" size={18} color="#034694" />
                          </View>
                        </View>
                      </View>

                      <View style={[styles.cardFooter, { borderTopColor: theme.outlineVariant + '33' }]}>
                        <View style={styles.footerVenue}>
                          <Ionicons name="location-outline" size={14} color={theme.textSecondary} />
                          <ThemedText type="bodyMd" style={styles.footerVenueText}>
                            Emirates Stadium
                          </ThemedText>
                        </View>
                        <View style={styles.matchCenterLink}>
                          <ThemedText type="labelSm" style={{ color: theme.text, fontFamily: 'PlusJakartaSans_700Bold' }}>
                            Match Center
                          </ThemedText>
                          <Ionicons name="arrow-forward" size={12} color={theme.text} style={{ marginLeft: 2 }} />
                        </View>
                      </View>
                    </View>
                  </Pressable>
                </View>
              )}

              {/* After Match Card 2 Promo Card Row */}
              {(selectedFilter === 'Me' || selectedFilter === 'All') && (
                <View style={[styles.section, { marginBottom: Spacing.sm }]}>
                  <ThemedText type="labelMd" style={{ color: theme.textSecondary, textTransform: 'none', marginBottom: Spacing.xs }}>
                    Special Promotions
                  </ThemedText>
                  <ScrollView 
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingVertical: 4, gap: 16, paddingHorizontal: 4 }}
                  >
                    {/* Turf Ground Ad Card */}
                    <View style={{ width: 280 }}>
                      <PromoBanner 
                        title="Book Premium Turf!"
                        subtitle="Save up to 20% on your slot booking today."
                        buttonText="Book Ground"
                        badgeText="TURF BOOKING"
                        isGradient={false}
                        backgroundImage={require('@/assets/images/sports/skyline_turf.png')}
                        buttonBackgroundColor="#ffffff"
                        buttonTextColor="#059669"
                        illustrationImage={require('@/assets/images/illustrations/athletes.png')}
                        onPress={() => router.push('/(tabs)/explore')}
                      />
                    </View>

                    {/* Bid Match Ad Card */}
                    <View style={{ width: 280 }}>
                      <PromoBanner 
                        title="Bid to Play Elite Teams"
                        subtitle="Use your Coins to bid and challenge top-tier squads."
                        buttonText="Bid Challenge"
                        badgeText="BID MATCH"
                        isGradient={false}
                        backgroundImage={require('@/assets/images/sports/wembley_stadium_turf.png')}
                        buttonBackgroundColor="#ffffff"
                        buttonTextColor="#5D68E8"
                        illustrationImage={require('@/assets/images/illustrations/football_player.png')}
                        onPress={() => {
                          Alert.alert('Bid Match', 'Quick match bidding is now active. Scroll down to Open Challenges.');
                        }}
                      />
                    </View>
                  </ScrollView>
                </View>
              )}

              {/* YESTERDAY Section */}
              {(selectedFilter === 'Me' || selectedFilter === 'All' || selectedFilter === 'Finished') && (
                <View style={styles.section}>
                  <ThemedText type="labelMd" style={[styles.sectionHeader, { color: theme.textSecondary, textTransform: 'none' }]}>
                    Yesterday
                  </ThemedText>

                  {/* Match Card 3: Cricket T20 Blast */}
                  <Pressable
                    onPress={() => handleMatchCenterSelect('yesterday-cricket-1', 'cricket')}
                    style={[styles.matchCardShadowWrapper, Shadows.level2, { opacity: 0.9 }]}
                  >
                    <View style={[styles.matchCardContent, { backgroundColor: theme.surfaceLowest }]}>
                      <View style={styles.cardHeader}>
                        <View style={[styles.leagueTypeBadge, { backgroundColor: theme.secondary + '14', borderColor: theme.secondary + '33', borderWidth: 1, paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 4 }]}>
                          <ThemedText style={{ color: theme.secondary, fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 8, letterSpacing: 0.5 }}>
                            T20 Blast
                          </ThemedText>
                        </View>
                      </View>

                      <View style={{ marginVertical: 6, gap: 6 }}>
                        <View style={styles.finishedMatchTeamRow}>
                          <View style={[styles.teamLetterLogoSmall, { backgroundColor: theme.surfaceHigh }]}>
                            <ThemedText type="labelSm" style={{ color: theme.text }}>MT</ThemedText>
                          </View>
                          <ThemedText type="bodyMd" style={{ marginLeft: 8, fontFamily: 'HankenGrotesk_700Bold' }}>
                            Middlesex Titans
                          </ThemedText>
                          <ThemedText type="bodyMd" style={{ marginLeft: 'auto', fontFamily: 'HankenGrotesk_700Bold' }}>
                            145/6
                          </ThemedText>
                        </View>
                        <View style={styles.finishedMatchTeamRow}>
                          <View style={[styles.teamLetterLogoSmall, { backgroundColor: theme.surfaceHigh }]}>
                            <ThemedText type="labelSm" style={{ color: theme.text }}>SS</ThemedText>
                          </View>
                          <ThemedText type="bodyMd" style={{ marginLeft: 8, fontFamily: 'HankenGrotesk_700Bold' }}>
                            Sussex Sharks
                          </ThemedText>
                          <ThemedText type="bodyMd" style={{ marginLeft: 'auto', fontFamily: 'HankenGrotesk_700Bold', color: theme.textSecondary }}>
                            142/9
                          </ThemedText>
                        </View>
                      </View>

                      <View style={[styles.cardFooter, { borderTopColor: theme.outlineVariant + '33', paddingTop: 10, marginTop: 10 }]}>
                        {renderFinishedBadge('cricket')}
                        <View style={styles.matchCenterLink}>
                          <ThemedText type="labelSm" style={{ color: theme.text, fontFamily: 'PlusJakartaSans_700Bold' }}>
                            Scorecard
                          </ThemedText>
                          <Ionicons name="chevron-forward" size={12} color={theme.text} />
                        </View>
                      </View>
                    </View>
                  </Pressable>

                  {/* Match Card 4: Champions League */}
                  <Pressable
                    onPress={() => handleMatchCenterSelect('yesterday-football-1', 'football')}
                    style={[styles.matchCardShadowWrapper, Shadows.level2, { opacity: 0.9, marginTop: 12 }]}
                  >
                    <View style={[styles.matchCardContent, { backgroundColor: theme.surfaceLowest }]}>
                      <View style={styles.cardHeader}>
                        <View style={[styles.leagueTypeBadge, { backgroundColor: '#e8f0fe', borderColor: '#d2e3fc33', borderWidth: 1, paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 4 }]}>
                          <ThemedText style={{ color: '#1a73e8', fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 8, letterSpacing: 0.5 }}>
                            Champions League
                          </ThemedText>
                        </View>
                      </View>

                      <View style={{ marginVertical: 6, gap: 6 }}>
                        <View style={styles.finishedMatchTeamRow}>
                          <View style={[styles.teamLetterLogoSmall, { backgroundColor: theme.surfaceHigh }]}>
                            <ThemedText type="labelSm" style={{ color: theme.text }}>RM</ThemedText>
                          </View>
                          <ThemedText type="bodyMd" style={{ marginLeft: 8, fontFamily: 'HankenGrotesk_700Bold' }}>
                            Real Madrid
                          </ThemedText>
                          <ThemedText type="bodyMd" style={{ marginLeft: 'auto', fontFamily: 'HankenGrotesk_700Bold' }}>
                            3
                          </ThemedText>
                        </View>
                        <View style={styles.finishedMatchTeamRow}>
                          <View style={[styles.teamLetterLogoSmall, { backgroundColor: theme.surfaceHigh }]}>
                            <ThemedText type="labelSm" style={{ color: theme.text }}>MC</ThemedText>
                          </View>
                          <ThemedText type="bodyMd" style={{ marginLeft: 8, fontFamily: 'HankenGrotesk_700Bold' }}>
                            Manchester City
                          </ThemedText>
                          <ThemedText type="bodyMd" style={{ marginLeft: 'auto', fontFamily: 'HankenGrotesk_700Bold', color: theme.textSecondary }}>
                            2
                          </ThemedText>
                        </View>
                      </View>

                      <View style={[styles.cardFooter, { borderTopColor: theme.outlineVariant + '33', paddingTop: 10, marginTop: 10 }]}>
                        {renderFinishedBadge('football')}
                        <View style={styles.matchCenterLink}>
                          <ThemedText type="labelSm" style={{ color: theme.text, fontFamily: 'PlusJakartaSans_700Bold' }}>
                            Scorecard
                          </ThemedText>
                          <Ionicons name="chevron-forward" size={12} color={theme.text} />
                        </View>
                      </View>
                    </View>
                  </Pressable>

                  {/* Match Card 5: Championship Football */}
                  <Pressable
                    onPress={() => handleMatchCenterSelect('yesterday-football-2', 'football')}
                    style={[styles.matchCardShadowWrapper, Shadows.level2, { opacity: 0.9, marginTop: 12 }]}
                  >
                    <View style={[styles.matchCardContent, { backgroundColor: theme.surfaceLowest }]}>
                      <View style={styles.cardHeader}>
                        <View style={[styles.leagueTypeBadge, { backgroundColor: '#e8f0fe', borderColor: '#d2e3fc33', borderWidth: 1, paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 4 }]}>
                          <ThemedText style={{ color: '#1a73e8', fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 8, letterSpacing: 0.5 }}>
                            Championship
                          </ThemedText>
                        </View>
                      </View>
                      <View style={{ marginVertical: 6, gap: 6 }}>
                        <View style={styles.finishedMatchTeamRow}>
                          <View style={[styles.teamLetterLogoSmall, { backgroundColor: theme.surfaceHigh }]}>
                            <ThemedText type="labelSm" style={{ color: theme.text }}>BF</ThemedText>
                          </View>
                          <ThemedText type="bodyMd" style={{ marginLeft: 8, fontFamily: 'HankenGrotesk_700Bold' }}>
                            Blue Falcons
                          </ThemedText>
                          <ThemedText type="bodyMd" style={{ marginLeft: 'auto', fontFamily: 'HankenGrotesk_700Bold' }}>
                            2
                          </ThemedText>
                        </View>
                        <View style={styles.finishedMatchTeamRow}>
                          <View style={[styles.teamLetterLogoSmall, { backgroundColor: theme.surfaceHigh }]}>
                            <ThemedText type="labelSm" style={{ color: theme.text }}>RH</ThemedText>
                          </View>
                          <ThemedText type="bodyMd" style={{ marginLeft: 8, fontFamily: 'HankenGrotesk_700Bold' }}>
                            Red Hawks
                          </ThemedText>
                          <ThemedText type="bodyMd" style={{ marginLeft: 'auto', fontFamily: 'HankenGrotesk_700Bold', color: theme.textSecondary }}>
                            1
                          </ThemedText>
                        </View>
                      </View>
                      <View style={[styles.cardFooter, { borderTopColor: theme.outlineVariant + '33', paddingTop: 10, marginTop: 10 }]}>
                        {renderFinishedBadge('football')}
                        <View style={styles.matchCenterLink}>
                          <ThemedText type="labelSm" style={{ color: theme.text, fontFamily: 'PlusJakartaSans_700Bold' }}>
                            Scorecard
                          </ThemedText>
                          <Ionicons name="chevron-forward" size={12} color={theme.text} />
                        </View>
                      </View>
                    </View>
                  </Pressable>
                </View>
              )}

              {/* After Match Card 5: Coach promo banner horizontal Scroll ONLY */}
              {(selectedFilter === 'Me' || selectedFilter === 'All') && classes.length > 0 && (
                <View style={[styles.section, { marginBottom: Spacing.sm }]}>
                  <ThemedText type="labelMd" style={{ color: theme.textSecondary, textTransform: 'none', marginBottom: Spacing.xs }}>
                    Academy Coaching Classes
                  </ThemedText>
                  <ScrollView 
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingVertical: 4, gap: 12 }}
                  >
                    {classes.map((cls: any, idx: number) => {
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
                            avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
                            badge: 'OWNER',
                          }
                        });
                      };

                      const sportLower = cls.sportType.toLowerCase();
                      const watermarkSource = sportLower.includes('cricket') ? require('@/assets/images/illustrations/cricket_player.png') : (sportLower.includes('football') || sportLower.includes('futsal') ? require('@/assets/images/illustrations/football_player.png') : (sportLower.includes('badminton') ? require('@/assets/images/illustrations/athletes.png') : require('@/assets/images/illustrations/tennis_player.png')));

                      return (
                        <Pressable
                          key={cls.id || `match-class-${idx}`}
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
                              <ThemedText style={{ color: theme.primary, fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 10, letterSpacing: 0.5 }}>COACHING CLASS</ThemedText>
                              <ThemedText style={{ color: theme.textSecondary, fontSize: 11, marginTop: 1 }}>{cls.classType} · {cls.sportType.toUpperCase()}</ThemedText>
                            </View>
                          </View>

                          <ThemedText type="title" style={{ color: theme.text, fontFamily: 'HankenGrotesk_700Bold', fontSize: 15, lineHeight: 20 }} numberOfLines={1}>
                            {cls.className}
                          </ThemedText>
                          
                          <ThemedText type="bodyMd" style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4 }} numberOfLines={1}>
                            Session Duration · {cls.sessionDuration}
                          </ThemedText>

                          <View style={{ borderTopWidth: 1, borderTopColor: theme.outlineVariant + '1a', marginTop: 10, paddingTop: 10 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                              <Ionicons name="location-outline" size={13} color={theme.textSecondary} style={{ marginRight: 4 }} />
                              <ThemedText style={{ color: theme.textSecondary, fontSize: 11 }} numberOfLines={1}>{cls.venue}</ThemedText>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Ionicons name="time-outline" size={13} color={theme.textSecondary} style={{ marginRight: 4 }} />
                              <ThemedText style={{ fontSize: 10, fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>
                                {cls.sessionTime}
                              </ThemedText>
                            </View>
                          </View>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* Additional Matches Section */}
              {(selectedFilter === 'Me' || selectedFilter === 'All' || selectedFilter === 'Finished') && (
                <View style={styles.section}>
                  {/* Match Card 6: London Giants vs York Knights */}
                  <Pressable
                    onPress={() => handleMatchCenterSelect('yesterday-cricket-2', 'cricket')}
                    style={[styles.matchCardShadowWrapper, Shadows.level2, { opacity: 0.9 }]}
                  >
                    <View style={[styles.matchCardContent, { backgroundColor: theme.surfaceLowest }]}>
                      <View style={styles.cardHeader}>
                        <View style={[styles.leagueTypeBadge, { backgroundColor: theme.secondary + '14', borderColor: theme.secondary + '33', borderWidth: 1, paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 4 }]}>
                          <ThemedText style={{ color: theme.secondary, fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 8, letterSpacing: 0.5 }}>
                            County League
                          </ThemedText>
                        </View>
                      </View>
                      <View style={{ marginVertical: 6, gap: 6 }}>
                        <View style={styles.finishedMatchTeamRow}>
                          <View style={[styles.teamLetterLogoSmall, { backgroundColor: theme.surfaceHigh }]}>
                            <ThemedText type="labelSm" style={{ color: theme.text }}>LG</ThemedText>
                          </View>
                          <ThemedText type="bodyMd" style={{ marginLeft: 8, fontFamily: 'HankenGrotesk_700Bold' }}>
                            London Giants
                          </ThemedText>
                          <ThemedText type="bodyMd" style={{ marginLeft: 'auto', fontFamily: 'HankenGrotesk_700Bold' }}>
                            188/3
                          </ThemedText>
                        </View>
                        <View style={styles.finishedMatchTeamRow}>
                          <View style={[styles.teamLetterLogoSmall, { backgroundColor: theme.surfaceHigh }]}>
                            <ThemedText type="labelSm" style={{ color: theme.text }}>YK</ThemedText>
                          </View>
                          <ThemedText type="bodyMd" style={{ marginLeft: 8, fontFamily: 'HankenGrotesk_700Bold' }}>
                            York Knights
                          </ThemedText>
                          <ThemedText type="bodyMd" style={{ marginLeft: 'auto', fontFamily: 'HankenGrotesk_700Bold', color: theme.textSecondary }}>
                            185/8
                          </ThemedText>
                        </View>
                      </View>
                      <View style={[styles.cardFooter, { borderTopColor: theme.outlineVariant + '33', paddingTop: 10, marginTop: 10 }]}>
                        {renderFinishedBadge('cricket')}
                        <View style={styles.matchCenterLink}>
                          <ThemedText type="labelSm" style={{ color: theme.text, fontFamily: 'PlusJakartaSans_700Bold' }}>
                            Scorecard
                          </ThemedText>
                          <Ionicons name="chevron-forward" size={12} color={theme.text} />
                        </View>
                      </View>
                    </View>
                  </Pressable>

                  {/* Match Card 7: Golden State vs Boston Celtics */}
                  <Pressable
                    onPress={() => handleMatchCenterSelect('yesterday-basketball-1', 'basketball')}
                    style={[styles.matchCardShadowWrapper, Shadows.level2, { opacity: 0.9, marginTop: 12 }]}
                  >
                    <View style={[styles.matchCardContent, { backgroundColor: theme.surfaceLowest }]}>
                      <View style={styles.cardHeader}>
                        <View style={[styles.leagueTypeBadge, { backgroundColor: '#fef3c7', borderColor: '#fde68a', borderWidth: 1, paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 4 }]}>
                          <ThemedText style={{ color: '#d97706', fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 8, letterSpacing: 0.5 }}>
                            NBA Classic
                          </ThemedText>
                        </View>
                      </View>
                      <View style={{ marginVertical: 6, gap: 6 }}>
                        <View style={styles.finishedMatchTeamRow}>
                          <View style={[styles.teamLetterLogoSmall, { backgroundColor: theme.surfaceHigh }]}>
                            <ThemedText type="labelSm" style={{ color: theme.text }}>GS</ThemedText>
                          </View>
                          <ThemedText type="bodyMd" style={{ marginLeft: 8, fontFamily: 'HankenGrotesk_700Bold' }}>
                            Golden State
                          </ThemedText>
                          <ThemedText type="bodyMd" style={{ marginLeft: 'auto', fontFamily: 'HankenGrotesk_700Bold' }}>
                            108
                          </ThemedText>
                        </View>
                        <View style={styles.finishedMatchTeamRow}>
                          <View style={[styles.teamLetterLogoSmall, { backgroundColor: theme.surfaceHigh }]}>
                            <ThemedText type="labelSm" style={{ color: theme.text }}>BC</ThemedText>
                          </View>
                          <ThemedText type="bodyMd" style={{ marginLeft: 8, fontFamily: 'HankenGrotesk_700Bold' }}>
                            Boston Celtics
                          </ThemedText>
                          <ThemedText type="bodyMd" style={{ marginLeft: 'auto', fontFamily: 'HankenGrotesk_700Bold', color: theme.textSecondary }}>
                            102
                          </ThemedText>
                        </View>
                      </View>
                      <View style={[styles.cardFooter, { borderTopColor: theme.outlineVariant + '33', paddingTop: 10, marginTop: 10 }]}>
                        {renderFinishedBadge('basketball')}
                        <View style={styles.matchCenterLink}>
                          <ThemedText type="labelSm" style={{ color: theme.text, fontFamily: 'PlusJakartaSans_700Bold' }}>
                            Scorecard
                          </ThemedText>
                          <Ionicons name="chevron-forward" size={12} color={theme.text} />
                        </View>
                      </View>
                    </View>
                  </Pressable>

                  {/* Match Card 8: Badminton Open */}
                  <Pressable
                    onPress={() => handleMatchCenterSelect('yesterday-badminton-1', 'badminton')}
                    style={[styles.matchCardShadowWrapper, Shadows.level2, { opacity: 0.9, marginTop: 12 }]}
                  >
                    <View style={[styles.matchCardContent, { backgroundColor: theme.surfaceLowest }]}>
                      <View style={styles.cardHeader}>
                        <View style={[styles.leagueTypeBadge, { backgroundColor: '#e0f2fe', borderColor: '#bae6fd', borderWidth: 1, paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 4 }]}>
                          <ThemedText style={{ color: '#0369a1', fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 8, letterSpacing: 0.5 }}>
                            Badminton Open
                          </ThemedText>
                        </View>
                      </View>
                      <View style={{ marginVertical: 6, gap: 6 }}>
                        <View style={styles.finishedMatchTeamRow}>
                          <View style={[styles.teamLetterLogoSmall, { backgroundColor: theme.surfaceHigh }]}>
                            <ThemedText type="labelSm" style={{ color: theme.text }}>VR</ThemedText>
                          </View>
                          <ThemedText type="bodyMd" style={{ marginLeft: 8, fontFamily: 'HankenGrotesk_700Bold' }}>
                            Vikram Rao
                          </ThemedText>
                          <ThemedText type="bodyMd" style={{ marginLeft: 'auto', fontFamily: 'HankenGrotesk_700Bold' }}>
                            2
                          </ThemedText>
                        </View>
                        <View style={styles.finishedMatchTeamRow}>
                          <View style={[styles.teamLetterLogoSmall, { backgroundColor: theme.surfaceHigh }]}>
                            <ThemedText type="labelSm" style={{ color: theme.text }}>LD</ThemedText>
                          </View>
                          <ThemedText type="bodyMd" style={{ marginLeft: 8, fontFamily: 'HankenGrotesk_700Bold' }}>
                            Lin Dan
                          </ThemedText>
                          <ThemedText type="bodyMd" style={{ marginLeft: 'auto', fontFamily: 'HankenGrotesk_700Bold', color: theme.textSecondary }}>
                            1
                          </ThemedText>
                        </View>
                      </View>
                      <View style={[styles.cardFooter, { borderTopColor: theme.outlineVariant + '33', paddingTop: 10, marginTop: 10 }]}>
                        {renderFinishedBadge('badminton')}
                        <View style={styles.matchCenterLink}>
                          <ThemedText type="labelSm" style={{ color: theme.text, fontFamily: 'PlusJakartaSans_700Bold' }}>
                            Scorecard
                          </ThemedText>
                          <Ionicons name="chevron-forward" size={12} color={theme.text} />
                        </View>
                      </View>
                    </View>
                  </Pressable>

                  {/* Match Card 9: Tennis Grand Slam */}
                  <Pressable
                    onPress={() => handleMatchCenterSelect('yesterday-tennis-1', 'tennis')}
                    style={[styles.matchCardShadowWrapper, Shadows.level2, { opacity: 0.9, marginTop: 12 }]}
                  >
                    <View style={[styles.matchCardContent, { backgroundColor: theme.surfaceLowest }]}>
                      <View style={styles.cardHeader}>
                        <View style={[styles.leagueTypeBadge, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', borderWidth: 1, paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 4 }]}>
                          <ThemedText style={{ color: '#15803d', fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 8, letterSpacing: 0.5 }}>
                            Tennis Grand Slam
                          </ThemedText>
                        </View>
                      </View>
                      <View style={{ marginVertical: 6, gap: 6 }}>
                        <View style={styles.finishedMatchTeamRow}>
                          <View style={[styles.teamLetterLogoSmall, { backgroundColor: theme.surfaceHigh }]}>
                            <ThemedText type="labelSm" style={{ color: theme.text }}>RF</ThemedText>
                          </View>
                          <ThemedText type="bodyMd" style={{ marginLeft: 8, fontFamily: 'HankenGrotesk_700Bold' }}>
                            Roger Federer
                          </ThemedText>
                          <ThemedText type="bodyMd" style={{ marginLeft: 'auto', fontFamily: 'HankenGrotesk_700Bold' }}>
                            2
                          </ThemedText>
                        </View>
                        <View style={styles.finishedMatchTeamRow}>
                          <View style={[styles.teamLetterLogoSmall, { backgroundColor: theme.surfaceHigh }]}>
                            <ThemedText type="labelSm" style={{ color: theme.text }}>RN</ThemedText>
                          </View>
                          <ThemedText type="bodyMd" style={{ marginLeft: 8, fontFamily: 'HankenGrotesk_700Bold' }}>
                            Rafael Nadal
                          </ThemedText>
                          <ThemedText type="bodyMd" style={{ marginLeft: 'auto', fontFamily: 'HankenGrotesk_700Bold', color: theme.textSecondary }}>
                            0
                          </ThemedText>
                        </View>
                      </View>
                      <View style={[styles.cardFooter, { borderTopColor: theme.outlineVariant + '33', paddingTop: 10, marginTop: 10 }]}>
                        {renderFinishedBadge('tennis')}
                        <View style={styles.matchCenterLink}>
                          <ThemedText type="labelSm" style={{ color: theme.text, fontFamily: 'PlusJakartaSans_700Bold' }}>
                            Scorecard
                          </ThemedText>
                          <Ionicons name="chevron-forward" size={12} color={theme.text} />
                        </View>
                      </View>
                    </View>
                  </Pressable>

                  {/* Match Card 10: Squash League */}
                  <Pressable
                    onPress={() => handleMatchCenterSelect('yesterday-squash-1', 'squash')}
                    style={[styles.matchCardShadowWrapper, Shadows.level2, { opacity: 0.9, marginTop: 12 }]}
                  >
                    <View style={[styles.matchCardContent, { backgroundColor: theme.surfaceLowest }]}>
                      <View style={styles.cardHeader}>
                        <View style={[styles.leagueTypeBadge, { backgroundColor: '#faf5ff', borderColor: '#f3e8ff', borderWidth: 1, paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 4 }]}>
                          <ThemedText style={{ color: '#7e22ce', fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 8, letterSpacing: 0.5 }}>
                            Squash League
                          </ThemedText>
                        </View>
                      </View>
                      <View style={{ marginVertical: 6, gap: 6 }}>
                        <View style={styles.finishedMatchTeamRow}>
                          <View style={[styles.teamLetterLogoSmall, { backgroundColor: theme.surfaceHigh }]}>
                            <ThemedText type="labelSm" style={{ color: theme.text }}>SL</ThemedText>
                          </View>
                          <ThemedText type="bodyMd" style={{ marginLeft: 8, fontFamily: 'HankenGrotesk_700Bold' }}>
                            Sara Lee
                          </ThemedText>
                          <ThemedText type="bodyMd" style={{ marginLeft: 'auto', fontFamily: 'HankenGrotesk_700Bold' }}>
                            3
                          </ThemedText>
                        </View>
                        <View style={styles.finishedMatchTeamRow}>
                          <View style={[styles.teamLetterLogoSmall, { backgroundColor: theme.surfaceHigh }]}>
                            <ThemedText type="labelSm" style={{ color: theme.text }}>ND</ThemedText>
                          </View>
                          <ThemedText type="bodyMd" style={{ marginLeft: 8, fontFamily: 'HankenGrotesk_700Bold' }}>
                            Nicol David
                          </ThemedText>
                          <ThemedText type="bodyMd" style={{ marginLeft: 'auto', fontFamily: 'HankenGrotesk_700Bold', color: theme.textSecondary }}>
                            1
                          </ThemedText>
                        </View>
                      </View>
                      <View style={[styles.cardFooter, { borderTopColor: theme.outlineVariant + '33', paddingTop: 10, marginTop: 10 }]}>
                        {renderFinishedBadge('squash')}
                        <View style={styles.matchCenterLink}>
                          <ThemedText type="labelSm" style={{ color: theme.text, fontFamily: 'PlusJakartaSans_700Bold' }}>
                            Scorecard
                          </ThemedText>
                          <Ionicons name="chevron-forward" size={12} color={theme.text} />
                        </View>
                      </View>
                    </View>
                  </Pressable>
                </View>
              )}

              {/* After Match Card 7 Promo Card Row */}
              {(selectedFilter === 'Me' || selectedFilter === 'All') && (
                <View style={[styles.section, { paddingBottom: 120 }]}>
                  <ThemedText type="labelMd" style={{ color: theme.textSecondary, textTransform: 'none', marginBottom: Spacing.xs }}>
                    Featured Tournament
                  </ThemedText>
                  <View style={{ width: 280 }}>
                    <PromoBanner 
                      title="Grand Summer Tournament!"
                      subtitle="Win up to ₹50,000 in prizes. Slots filling fast!"
                      buttonText="Register Team"
                      badgeText="FEATURED TOURNAMENT"
                      isGradient={true}
                      gradientColors={['#ff8c00', '#f97316']}
                      buttonBackgroundColor="#ffffff"
                      buttonTextColor="#ff8c00"
                      illustrationImage={require('@/assets/images/illustrations/cricket_player.png')}
                      onPress={() => router.push('/(tabs)/tournaments')}
                    />
                  </View>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </Reanimated.View>

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
    borderRadius: BorderRadius.full,
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
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    letterSpacing: 0.8,
  },
  offerTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'HankenGrotesk_700Bold',
  },
  offerSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_500Medium',
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
    fontFamily: 'HankenGrotesk_700Bold',
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
    fontFamily: 'PlusJakartaSans_700Bold',
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
    fontFamily: 'HankenGrotesk_700Bold',
  },
  tourneyAdMeta: {
    fontSize: 11,
    color: '#43474b',
    fontFamily: 'PlusJakartaSans_500Medium',
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
    fontFamily: 'HankenGrotesk_700Bold',
  },

  challengeShadowWrapper: {
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 24,
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  challengeCard: {
    padding: 14,
    borderRadius: 24,
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
    fontFamily: 'PlusJakartaSans_800ExtraBold',
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
    fontFamily: 'PlusJakartaSans_800ExtraBold',
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
    fontFamily: 'HankenGrotesk_700Bold',
  },
  challengeTeamRank: {
    fontSize: 10,
    color: '#43474b',
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  challengeDescription: {
    fontSize: 11,
    color: '#43474b',
    fontFamily: 'PlusJakartaSans_500Medium',
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
    fontFamily: 'HankenGrotesk_700Bold',
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
});
