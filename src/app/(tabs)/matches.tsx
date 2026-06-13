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

const FILTERS = ['Me', 'All', 'Live', 'Upcoming', 'Finished'];

export default function MatchesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState('Me');
  const [coinTossVisible, setCoinTossVisible] = useState(false);

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
    <GradientContainer screenName="matches" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Top App Bar */}
        <View style={[styles.header, { backgroundColor: 'transparent' }]}>
          <View style={styles.headerLeft}>
            <Pressable style={styles.profileIconButton} onPress={() => router.push('/profile')}>
              <Image
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD906cwGePK5tZt4al07polQZxe4OW2sIJ-lhjDewDXct6IJtZetqa2i4lnO9-CMUT1oBiYhGj0BUqSwgzvIHynL-pG1kkY5KzzF9cvL0bxVNlPJEbfv2pHhgwd2mkejpG9vnC4b1XliECQQDedwmy8XfJ0AUw7fpdjFhLXiUdidhARSpLIkMeew198pOXaj0K9g0kbbWaDwJfBtYdJwqD1ztbzBAkeltwyKB0I_eTeM0ksi5qEbR6iQRPKqERd-3DOKAQez21qHyI' }}
                style={styles.headerAvatar}
              />
            </Pressable>
            <View style={styles.headerTextGroup}>
              <ThemedText type="bodyLg" style={{ color: theme.text, fontFamily: 'HankenGrotesk_700Bold', lineHeight: 18 }}>
                Azarudeen
              </ThemedText>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <Ionicons name="location-sharp" size={12} color={theme.secondary} />
                <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginLeft: 2, fontSize: 10 }}>
                  London, UK
                </ThemedText>
              </View>
            </View>
          </View>
          <View style={styles.headerRightActions}>
            <Pressable style={styles.iconButton} onPress={() => router.push('/network')}>
              <Ionicons name="pulse" size={20} color={theme.secondary} />
            </Pressable>
            <Pressable style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={20} color={theme.secondary} />
            </Pressable>
            <Pressable style={styles.iconButton} onPress={() => setCoinTossVisible(true)}>
              <FontAwesome5 name="coins" size={16} color={theme.secondary} />
            </Pressable>
          </View>
        </View>

        <Reanimated.View entering={FadeInDown.duration(600).damping(14)} style={{ flex: 1 }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
          {/* Filter Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContainer}
          >
            {FILTERS.map((filter) => {
              const isActive = filter === selectedFilter;
              return (
                <Pressable
                  key={filter}
                  onPress={() => setSelectedFilter(filter)}
                  style={[
                    styles.filterChip,
                    isActive
                      ? { backgroundColor: 'transparent', borderColor: theme.primary, borderWidth: 1.5 }
                      : { backgroundColor: 'transparent', borderColor: theme.outlineVariant + '33', borderWidth: 1.5 },
                  ]}
                >
                  {filter === 'Live' && (
                    <View style={styles.liveIndicatorDot} />
                  )}
                  <ThemedText
                    type="labelSm"
                    style={{ 
                      color: isActive ? theme.primary : theme.textSecondary,
                      fontFamily: isActive ? 'PlusJakartaSans_700Bold' : 'PlusJakartaSans_500Medium' 
                    }}
                  >
                    {filter}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* LIVE NOW Section */}
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
                {/* Subtle vector watermark */}
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

                {/* Match Teams & Live Score */}
                <View style={styles.liveScoreRow}>
                  {/* Left Column (RCB) */}
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

                  {/* Center vs Container */}
                  <View style={styles.vsContainer}>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'HankenGrotesk_500Medium' }}>vs</ThemedText>
                  </View>

                  {/* Right Column (KXI - Symmetrical Right Alignment) */}
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

                {/* Card Footer */}
                <View style={[styles.cardFooter, { borderTopColor: theme.outlineVariant + '33' }]}>
                  <View style={styles.footerVenue}>
                    <Ionicons name="football-outline" size={14} color={theme.textSecondary} />
                    <ThemedText type="bodyMd" style={styles.footerVenueText}>
                      M. Chinnaswamy Stadium
                    </ThemedText>
                  </View>
                  <Pressable
                    onPress={() => handleMatchCenterSelect('rcb-ipl')}
                    style={styles.matchCenterLink}
                  >
                    <ThemedText type="labelSm" style={{ color: theme.text, fontFamily: 'PlusJakartaSans_700Bold' }}>
                      Match Center
                    </ThemedText>
                    <Ionicons name="arrow-forward" size={12} color={theme.text} style={{ marginLeft: 2 }} />
                  </Pressable>
                </View>
              </View>
            </Pressable>
          </View>

          {/* Announcements & Matches Banners (Vertical Banners - Single Cards) */}
          <View style={styles.section}>
            <PromoBanner 
              title="Grand Summer Tournament!"
              subtitle="Win up to ₹50,000 in prizes. Slots filling fast!"
              buttonText="Register Team"
              badgeText="ANNOUNCEMENT"
              backgroundImage="https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80"
              buttonBackgroundColor="#ff8c00"
              buttonTextColor="#ffffff"
              onPress={() => router.push('/(tabs)/tournaments')}
              variant="vertical"
            />
            <PromoBanner 
              title="Bid to Play Elite Teams"
              subtitle="Use your Coins to bid and challenge high ranked squads."
              buttonText="Bid Match"
              badgeText="BID MATCH"
              backgroundImage="https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=600&q=80"
              buttonBackgroundColor="#5D68E8"
              buttonTextColor="#ffffff"
              onPress={() => {
                Alert.alert('Bid Match', 'Quick match bidding is now active. Scroll down to Open Challenges.');
              }}
              variant="vertical"
            />
          </View>

          {/* TODAY Section */}
          <View style={styles.section}>
            <ThemedText type="labelMd" style={[styles.sectionHeader, { color: theme.textSecondary, textTransform: 'none' }]}>
              Today
            </ThemedText>

            {/* Futsal Match Card */}
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

                {/* Match Teams & Time (Symmetrical Compact Row Layout) */}
                <View style={styles.scheduledMatchRow}>
                  {/* Left Team */}
                  <View style={styles.scheduledTeamLeft}>
                    <View style={styles.crestContainerSmall}>
                      <Ionicons name="shield-half" size={18} color={theme.primary} />
                    </View>
                    <ThemedText type="bodyMd" style={{ marginLeft: 8, fontFamily: 'HankenGrotesk_700Bold', flex: 1 }} numberOfLines={1}>
                      London Lions
                    </ThemedText>
                  </View>

                  {/* Center Time Pill */}
                  <View style={[styles.timeBadgeSmall, { backgroundColor: theme.surfaceHigh }]}>
                    <ThemedText style={{ fontSize: 13, fontFamily: 'HankenGrotesk_800ExtraBold', color: theme.text }}>19:00</ThemedText>
                  </View>

                  {/* Right Team */}
                  <View style={styles.scheduledTeamRight}>
                    <ThemedText type="bodyMd" style={{ marginRight: 8, fontFamily: 'HankenGrotesk_700Bold', flex: 1, textAlign: 'right' }} numberOfLines={1}>
                      Kent Kings
                    </ThemedText>
                    <View style={styles.crestContainerSmall}>
                      <Ionicons name="shield-half" size={18} color={theme.secondaryContainer} />
                    </View>
                  </View>
                </View>

                {/* Card Footer */}
                <View style={[styles.cardFooter, { borderTopColor: theme.outlineVariant + '33' }]}>
                  <View style={styles.footerVenue}>
                    <Ionicons name="location-outline" size={14} color={theme.textSecondary} />
                    <ThemedText type="bodyMd" style={styles.footerVenueText}>
                      O2 Arena Turf
                    </ThemedText>
                  </View>
                  <Pressable
                    onPress={() => router.push({ pathname: '/scoring', params: { matchId: 'futsal-1', sport: 'football' } })}
                    style={styles.matchCenterLink}
                  >
                    <ThemedText type="labelSm" style={{ color: theme.text, fontFamily: 'PlusJakartaSans_700Bold' }}>
                      Match Center
                    </ThemedText>
                    <Ionicons name="arrow-forward" size={12} color={theme.text} style={{ marginLeft: 2 }} />
                  </Pressable>
                </View>
              </View>
            </Pressable>

            {/* Expanded Match: Premier League (Arsenal vs Chelsea) */}
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

                {/* Match Teams & Time */}
                <View style={styles.scheduledMatchRow}>
                  {/* Left Team */}
                  <View style={styles.scheduledTeamLeft}>
                    <View style={styles.crestContainerSmall}>
                      <Ionicons name="shield-half" size={18} color="#ef0107" />
                    </View>
                    <ThemedText type="bodyMd" style={{ marginLeft: 8, fontFamily: 'HankenGrotesk_700Bold', flex: 1 }} numberOfLines={1}>
                      Arsenal
                    </ThemedText>
                  </View>

                  {/* Center Time Pill */}
                  <View style={[styles.timeBadgeSmall, { backgroundColor: theme.surfaceHigh }]}>
                    <ThemedText style={{ fontSize: 13, fontFamily: 'HankenGrotesk_800ExtraBold', color: theme.text }}>21:00</ThemedText>
                  </View>

                  {/* Right Team */}
                  <View style={styles.scheduledTeamRight}>
                    <ThemedText type="bodyMd" style={{ marginRight: 8, fontFamily: 'HankenGrotesk_700Bold', flex: 1, textAlign: 'right' }} numberOfLines={1}>
                      Chelsea
                    </ThemedText>
                    <View style={styles.crestContainerSmall}>
                      <Ionicons name="shield-half" size={18} color="#034694" />
                    </View>
                  </View>
                </View>

                {/* Card Footer */}
                <View style={[styles.cardFooter, { borderTopColor: theme.outlineVariant + '33' }]}>
                  <View style={styles.footerVenue}>
                    <Ionicons name="location-outline" size={14} color={theme.textSecondary} />
                    <ThemedText type="bodyMd" style={styles.footerVenueText}>
                      Emirates Stadium
                    </ThemedText>
                  </View>
                  <Pressable
                    onPress={() => router.push({ pathname: '/scoring', params: { matchId: 'pl-1', sport: 'football' } })}
                    style={styles.matchCenterLink}
                  >
                    <ThemedText type="labelSm" style={{ color: theme.text, fontFamily: 'PlusJakartaSans_700Bold' }}>
                      Match Center
                    </ThemedText>
                    <Ionicons name="arrow-forward" size={12} color={theme.text} style={{ marginLeft: 2 }} />
                  </Pressable>
                </View>
              </View>
            </Pressable>
          </View>

          {/* Tournaments Ad Banner */}
          <View style={styles.section}>
            <View style={[styles.tourneyAdCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
              <View style={styles.tourneyAdHeader}>
                <View style={[styles.tourneyAdBadge, { backgroundColor: theme.secondaryContainer + '22', borderColor: theme.secondaryContainer + '33', borderWidth: 1, paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 4 }]}>
                  <Ionicons name="trophy-outline" size={10} color={theme.secondary} />
                  <ThemedText style={{ color: theme.secondary, fontSize: 8, fontFamily: 'PlusJakartaSans_800ExtraBold', marginLeft: 4, letterSpacing: 0.5 }}>Upcoming Tournament</ThemedText>
                </View>
                <ThemedText style={styles.tourneyAdSlots}>12/16 Slots Filled</ThemedText>
              </View>
              
              <View style={styles.tourneyAdBody}>
                <View style={styles.tourneyAdInfo}>
                  <ThemedText style={styles.tourneyAdTitle}>Canary Wharf Cup 2026</ThemedText>
                  <ThemedText style={styles.tourneyAdMeta}>Cricket Knockout • ₹5,000 Prize Pool</ThemedText>
                </View>
                <Pressable 
                  style={[styles.tourneyAdBtn, { backgroundColor: theme.primary }]}
                  onPress={() => router.push('/(tabs)/tournaments')}
                >
                  <ThemedText style={styles.tourneyAdBtnText}>Register Team</ThemedText>
                </Pressable>
              </View>
            </View>
          </View>

          {/* YESTERDAY Section */}
          <View style={[styles.section, { paddingBottom: 120 }]}>
            <ThemedText type="labelMd" style={[styles.sectionHeader, { color: theme.textSecondary, textTransform: 'none' }]}>
              Yesterday
            </ThemedText>

            {/* Match 1: T20 Blast */}
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

                {/* Finished Match Rows */}
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

                {/* Card Footer */}
                <View style={[styles.cardFooter, { borderTopColor: theme.outlineVariant + '33', paddingTop: 10, marginTop: 10 }]}>
                  <View style={[styles.finishedBadge, { backgroundColor: theme.surfaceHigh, borderColor: theme.outlineVariant + '33', borderWidth: 1 }]}>
                    <ThemedText style={{ color: theme.textSecondary, fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 8, letterSpacing: 0.5 }}>
                      Finished
                    </ThemedText>
                  </View>
                  <Pressable
                    onPress={() => handleMatchCenterSelect('yesterday-cricket-1', 'cricket')}
                    style={styles.matchCenterLink}
                  >
                    <ThemedText type="labelSm" style={{ color: theme.text, fontFamily: 'PlusJakartaSans_700Bold' }}>
                      Scorecard
                    </ThemedText>
                    <Ionicons name="chevron-forward" size={12} color={theme.text} />
                  </Pressable>
                </View>
              </View>
            </Pressable>

            {/* Open Challenge / Bid Match Card */}
            <View style={[styles.challengeShadowWrapper, Shadows.level3]}>
              <View style={styles.challengeCard}>
                <Image 
                  source="https://images.unsplash.com/photo-1518605368461-1ee71165b400?auto=format&fit=crop&w=600&q=80" 
                  style={StyleSheet.absoluteFill} 
                  contentFit="cover" 
                />
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(11, 59, 96, 0.85)' }]} />
                
                <View style={styles.challengeHeader}>
                  <View style={[styles.challengeBadge, { backgroundColor: 'rgba(254, 174, 44, 0.15)', borderColor: 'rgba(254, 174, 44, 0.3)', borderWidth: 1, paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 4 }]}>
                    <Ionicons name="flash-outline" size={10} color="#feae2c" />
                    <ThemedText style={[styles.challengeBadgeText, { color: '#feae2c', fontSize: 8, letterSpacing: 0.5 }]}>Open Challenge</ThemedText>
                  </View>
                  <View style={[styles.challengeBidBadge, { backgroundColor: 'rgba(255, 255, 255, 0.15)', borderColor: 'rgba(255, 255, 255, 0.3)', borderWidth: 1, paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 4 }]}>
                    <FontAwesome5 name="coins" size={9} color="#ffffff" style={{ marginRight: 4 }} />
                    <ThemedText style={[styles.challengeBidText, { color: '#ffffff', fontSize: 8, letterSpacing: 0.5 }]}>100 Coins Bid</ThemedText>
                  </View>
                </View>
                
                <View style={styles.challengeTeamInfo}>
                  <View style={styles.challengeTeamHeader}>
                    <Image source={{ uri: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=80&q=80' }} style={styles.challengeTeamLogo} contentFit="cover" />
                    <View style={{ marginLeft: 8 }}>
                      <ThemedText style={[styles.challengeTeamName, { color: '#ffffff' }]}>Apex Strikers</ThemedText>
                      <ThemedText style={[styles.challengeTeamRank, { color: '#e2e8f0' }]}>Elite Div • Rank #42</ThemedText>
                    </View>
                  </View>
                  <ThemedText style={[styles.challengeDescription, { color: '#f8fafc' }]}>
                    Looking for a competitive 7v7 Football match today at 19:30. Accepting bids from Elite tier teams.
                  </ThemedText>
                </View>
                
                <Pressable 
                  style={[styles.challengeBtn, { backgroundColor: '#ffffff' }]}
                  onPress={() => Alert.alert('Bid Match', 'You have bid 100 coins to play Apex Strikers. Your challenge request is pending.')}
                >
                  <ThemedText style={[styles.challengeBtnText, { color: '#0b3b60' }]}>Bid to Play</ThemedText>
                </Pressable>
              </View>
            </View>

            {/* Match 2: Champions League */}
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

                {/* Finished Match Rows */}
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

                {/* Card Footer */}
                <View style={[styles.cardFooter, { borderTopColor: theme.outlineVariant + '33', paddingTop: 10, marginTop: 10 }]}>
                  <View style={[styles.finishedBadge, { backgroundColor: theme.surfaceHigh, borderColor: theme.outlineVariant + '33', borderWidth: 1 }]}>
                    <ThemedText style={{ color: theme.textSecondary, fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 8, letterSpacing: 0.5 }}>
                      Finished
                    </ThemedText>
                  </View>
                  <Pressable
                    onPress={() => handleMatchCenterSelect('yesterday-football-1', 'football')}
                    style={styles.matchCenterLink}
                  >
                    <ThemedText type="labelSm" style={{ color: theme.text, fontFamily: 'PlusJakartaSans_700Bold' }}>
                      Scorecard
                    </ThemedText>
                    <Ionicons name="chevron-forward" size={12} color={theme.text} />
                  </Pressable>
                </View>
              </View>
            </Pressable>
          </View>
        </ScrollView>
      </Reanimated.View>

        {/* FAB Actions */}
        <View style={styles.fabGroup}>
          <Animated.View style={{ transform: [{ scale: scaleAnimTeam }] }}>
            <Pressable
              onPressIn={() => handlePressIn(scaleAnimTeam)}
              onPressOut={() => handlePressOut(scaleAnimTeam)}
              style={[styles.fabSecondary, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}
              onPress={() => router.push('/create-team')}
            >
              <Ionicons name="shield-outline" size={20} color={theme.secondary} />
              <ThemedText type="labelSm" style={{ color: theme.secondary, fontFamily: 'HankenGrotesk_700Bold', marginLeft: 6, fontSize: 11 }}>
                Team
              </ThemedText>
            </Pressable>
          </Animated.View>

          <Animated.View style={{ transform: [{ scale: scaleAnimMatch }] }}>
            <Pressable
              onPressIn={() => handlePressIn(scaleAnimMatch)}
              onPressOut={() => handlePressOut(scaleAnimMatch)}
              style={[styles.fab, { backgroundColor: theme.secondaryContainer }]}
              onPress={() => router.push('/new-match')}
            >
              <Ionicons name="add" size={28} color={theme.onSecondaryContainer} />
            </Pressable>
          </Animated.View>
        </View>

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
    paddingVertical: Spacing.xs, // compacted from Spacing.md
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
});
