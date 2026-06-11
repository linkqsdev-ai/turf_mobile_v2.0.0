import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CoinTossModal } from '@/components/coin-toss-modal';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const FILTERS = ['Me', 'All', 'Live', 'Upcoming', 'Finished'];

export default function MatchesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [coinTossVisible, setCoinTossVisible] = useState(false);

  const handleMatchCenterSelect = (matchId: string) => {
    router.push({
      pathname: '/scoring',
      params: { matchId },
    });
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Top App Bar */}
        <View style={[styles.header, { backgroundColor: theme.background }]}>
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
                      ? { backgroundColor: theme.primary }
                      : { backgroundColor: theme.surfaceHigh, borderColor: theme.outlineVariant + '1a' },
                  ]}
                >
                  {filter === 'Live' && (
                    <View style={styles.liveIndicatorDot} />
                  )}
                  <ThemedText
                    type="labelSm"
                    style={{ color: isActive ? theme.onPrimary : theme.textSecondary }}
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
                  <View style={[styles.meBadge, { backgroundColor: theme.secondaryContainer + '22', borderColor: theme.secondaryContainer, borderWidth: 1, flexDirection: 'row', alignItems: 'center' }]}>
                    <Ionicons name="person" size={9} color={theme.secondary} style={{ marginRight: 3 }} />
                    <ThemedText type="labelSm" style={{ color: theme.secondary, fontWeight: '800', fontSize: 10 }}>Me</ThemedText>
                  </View>
                </View>

                {/* Match Teams & Live Score */}
                <View style={styles.liveScoreRow}>
                  {/* Left Column (RC) */}
                  <View style={styles.teamInfoCol}>
                    <View style={styles.teamLogoName}>
                      <View style={[styles.teamLetterLogo, { backgroundColor: theme.primaryContainer }]}>
                        <ThemedText type="labelMd" style={{ color: '#ffffff' }}>RC</ThemedText>
                      </View>
                      <ThemedText type="bodyMd" style={{ marginLeft: 6, fontWeight: '700', flex: 1, flexWrap: 'wrap' }}>
                        Royal Challengers
                      </ThemedText>
                    </View>
                    <ThemedText style={{ fontSize: 26, fontFamily: 'HankenGrotesk_800ExtraBold', color: theme.primary, marginTop: 4 }}>
                      172/4
                    </ThemedText>
                    <ThemedText style={{ color: theme.textSecondary, fontSize: 11, fontFamily: 'PlusJakartaSans_500Medium', marginTop: 2 }}>
                      18.2 overs
                    </ThemedText>
                  </View>

                  {/* Center vs Container */}
                  <View style={styles.vsContainer}>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'HankenGrotesk_500Medium' }}>vs</ThemedText>
                  </View>

                  {/* Right Column (KK - Symmetrical Right Alignment) */}
                  <View style={[styles.teamInfoCol, { alignItems: 'flex-end' }]}>
                    <View style={[styles.teamLogoName, { flexDirection: 'row-reverse' }]}>
                      <View style={[styles.teamLetterLogo, { backgroundColor: theme.outlineVariant, marginLeft: 6 }]}>
                        <ThemedText type="labelMd" style={{ color: '#ffffff' }}>KK</ThemedText>
                      </View>
                      <ThemedText type="bodyMd" style={{ color: theme.textSecondary, fontWeight: '700', textAlign: 'right', flex: 1, flexWrap: 'wrap' }}>
                        Kings XI
                      </ThemedText>
                    </View>
                    <ThemedText style={{ fontSize: 18, color: theme.textSecondary, fontFamily: 'HankenGrotesk_600SemiBold', marginTop: 10, textAlign: 'right' }}>
                      Yet to bat
                    </ThemedText>
                    <ThemedText style={{ color: theme.textSecondary, fontSize: 11, fontFamily: 'PlusJakartaSans_500Medium', marginTop: 2, textAlign: 'right' }}>
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
                    <ThemedText type="bodyMd" style={{ color: theme.textSecondary, fontFamily: 'HankenGrotesk_700Bold' }}>
                      Summer Futsal League
                    </ThemedText>
                  </View>
                  <View style={[styles.meBadge, { backgroundColor: theme.secondaryContainer + '22', borderColor: theme.secondaryContainer, borderWidth: 1, flexDirection: 'row', alignItems: 'center' }]}>
                    <Ionicons name="person" size={9} color={theme.secondary} style={{ marginRight: 3 }} />
                    <ThemedText type="labelSm" style={{ color: theme.secondary, fontWeight: '800', fontSize: 10 }}>Me</ThemedText>
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
                    <ThemedText type="bodyMd" style={{ color: theme.textSecondary, fontFamily: 'HankenGrotesk_700Bold' }}>
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

          {/* YESTERDAY Section */}
          <View style={[styles.section, { paddingBottom: 120 }]}>
            <ThemedText type="labelMd" style={[styles.sectionHeader, { color: theme.textSecondary, textTransform: 'none' }]}>
              Yesterday
            </ThemedText>

            {/* Match 1: T20 Blast */}
            <View style={[styles.matchCardShadowWrapper, Shadows.level2, { opacity: 0.9 }]}>
              <View style={[styles.matchCardContent, { backgroundColor: theme.surfaceLowest }]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.leagueTypeBadge, { backgroundColor: theme.secondary + '14', borderColor: theme.secondary + '33', borderWidth: 1 }]}>
                    <ThemedText type="labelSm" style={{ color: theme.secondary, fontWeight: '700' }}>
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
                    <ThemedText type="bodyMd" style={{ marginLeft: 8, fontFamily: 'HankenGrotesk_600SemiBold' }}>
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
                    <ThemedText type="bodyMd" style={{ marginLeft: 8, fontFamily: 'HankenGrotesk_600SemiBold' }}>
                      Sussex Sharks
                    </ThemedText>
                    <ThemedText type="bodyMd" style={{ marginLeft: 'auto', fontFamily: 'HankenGrotesk_700Bold', color: theme.textSecondary }}>
                      142/9
                    </ThemedText>
                  </View>
                </View>

                {/* Card Footer */}
                <View style={[styles.cardFooter, { borderTopColor: theme.outlineVariant + '33', paddingTop: 10, marginTop: 10 }]}>
                  <View style={[styles.finishedBadge, { backgroundColor: theme.surfaceHigh }]}>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontWeight: '700' }}>
                      Finished
                    </ThemedText>
                  </View>
                  <Pressable style={styles.matchCenterLink}>
                    <ThemedText type="labelSm" style={{ color: theme.text, fontFamily: 'PlusJakartaSans_700Bold' }}>
                      Scorecard
                    </ThemedText>
                    <Ionicons name="chevron-forward" size={12} color={theme.text} />
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Match 2: Champions League */}
            <View style={[styles.matchCardShadowWrapper, Shadows.level2, { opacity: 0.9, marginTop: 12 }]}>
              <View style={[styles.matchCardContent, { backgroundColor: theme.surfaceLowest }]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.leagueTypeBadge, { backgroundColor: '#e8f0fe', borderColor: '#d2e3fc', borderWidth: 1 }]}>
                    <ThemedText type="labelSm" style={{ color: '#1a73e8', fontWeight: '700' }}>
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
                    <ThemedText type="bodyMd" style={{ marginLeft: 8, fontFamily: 'HankenGrotesk_600SemiBold' }}>
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
                    <ThemedText type="bodyMd" style={{ marginLeft: 8, fontFamily: 'HankenGrotesk_600SemiBold' }}>
                      Manchester City
                    </ThemedText>
                    <ThemedText type="bodyMd" style={{ marginLeft: 'auto', fontFamily: 'HankenGrotesk_700Bold', color: theme.textSecondary }}>
                      2
                    </ThemedText>
                  </View>
                </View>

                {/* Card Footer */}
                <View style={[styles.cardFooter, { borderTopColor: theme.outlineVariant + '33', paddingTop: 10, marginTop: 10 }]}>
                  <View style={[styles.finishedBadge, { backgroundColor: theme.surfaceHigh }]}>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontWeight: '700' }}>
                      Finished
                    </ThemedText>
                  </View>
                  <Pressable style={styles.matchCenterLink}>
                    <ThemedText type="labelSm" style={{ color: theme.text, fontFamily: 'PlusJakartaSans_700Bold' }}>
                      Scorecard
                    </ThemedText>
                    <Ionicons name="chevron-forward" size={12} color={theme.text} />
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* FAB Actions */}
        <View style={styles.fabGroup}>
          <Pressable
            style={[styles.fabSecondary, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}
            onPress={() => router.push('/create-team')}
          >
            <Ionicons name="shield-outline" size={20} color={theme.secondary} />
            <ThemedText type="labelSm" style={{ color: theme.secondary, fontFamily: 'HankenGrotesk_700Bold', marginLeft: 6, fontSize: 11 }}>
              Team
            </ThemedText>
          </Pressable>
          <Pressable
            style={[styles.fab, { backgroundColor: theme.secondaryContainer }, Shadows.level3]}
            onPress={() => router.push('/new-match')}
          >
            <Ionicons name="add" size={28} color={theme.onSecondaryContainer} />
          </Pressable>
        </View>

      </SafeAreaView>
      <CoinTossModal visible={coinTossVisible} onClose={() => setCoinTossVisible(false)} />
    </ThemedView>
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
    borderColor: '#feae2c', // Gold ring around avatar
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
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  leagueTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.md,
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
    width: 24, // reduced from 28
    height: 24, // reduced from 28
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.default,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
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
  },
});
