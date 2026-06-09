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
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const FILTERS = ['Me', 'All', 'Live', 'Upcoming', 'Finished'];

export default function MatchesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState('All');

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
          <Pressable style={styles.userProfileBtn} onPress={() => router.push('/profile')}>
            <Image
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD906cwGePK5tZt4al07polQZxe4OW2sIJ-lhjDewDXct6IJtZetqa2i4lnO9-CMUT1oBiYhGj0BUqSwgzvIHynL-pG1kkY5KzzF9cvL0bxVNlPJEbfv2pHhgwd2mkejpG9vnC4b1XliECQQDedwmy8XfJ0AUw7fpdjFhLXiUdidhARSpLIkMeew198pOXaj0K9g0kbbWaDwJfBtYdJwqD1ztbzBAkeltwyKB0I_eTeM0ksi5qEbR6iQRPKqERd-3DOKAQez21qHyI' }}
              style={styles.headerAvatar}
            />
            <ThemedText type="labelMd" style={{ color: theme.text, marginLeft: Spacing.xs, fontFamily: 'HankenGrotesk_700Bold' }}>
              Azarudeen
            </ThemedText>
          </Pressable>
          <ThemedText type="displayLgMobile" style={styles.headerTitle}>
            SPORTS OS
          </ThemedText>
          <View style={styles.headerRightActions}>
            <Pressable style={styles.iconButton} onPress={() => router.push('/network-activity')}>
              <Ionicons name="pulse" size={20} color={theme.secondary} />
            </Pressable>
            <Pressable style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={20} color={theme.secondary} />
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
                    type="labelMd"
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
              <ThemedText type="labelMd" style={{ color: theme.textSecondary }}>
                LIVE NOW
              </ThemedText>
              <View style={[styles.pulseDot, { backgroundColor: theme.error }]} />
            </View>

            <Pressable
              onPress={() => handleMatchCenterSelect('rcb-ipl')}
              style={[styles.matchCard, { backgroundColor: theme.surfaceLowest }, Shadows.level2]}
            >
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
                <View style={[styles.meBadge, { backgroundColor: theme.secondaryContainer }]}>
                  <ThemedText type="labelSm" style={{ color: theme.onSecondaryContainer, fontWeight: '800' }}>ME</ThemedText>
                </View>
              </View>

              {/* Match Teams & Live Score */}
              <View style={styles.liveScoreRow}>
                <View style={styles.teamInfoCol}>
                  <View style={styles.teamLogoName}>
                    <View style={[styles.teamLetterLogo, { backgroundColor: theme.primaryContainer }]}>
                      <ThemedText type="labelMd" style={{ color: '#ffffff' }}>RC</ThemedText>
                    </View>
                    <ThemedText type="headlineSm" style={{ marginLeft: Spacing.xs }}>
                      Royal Challengers
                    </ThemedText>
                  </View>
                  <ThemedText type="displayLgMobile" style={{ marginTop: 8 }}>
                    172/4
                  </ThemedText>
                  <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>
                    18.2 OVERS
                  </ThemedText>
                </View>

                <View style={styles.vsContainer}>
                  <ThemedText type="labelMd" style={{ color: theme.textSecondary }}>VS</ThemedText>
                </View>

                <View style={styles.teamInfoCol}>
                  <View style={styles.teamLogoName}>
                    <View style={[styles.teamLetterLogo, { backgroundColor: theme.outlineVariant }]}>
                      <ThemedText type="labelMd" style={{ color: '#ffffff' }}>KK</ThemedText>
                    </View>
                    <ThemedText type="headlineSm" style={{ marginLeft: Spacing.xs, color: theme.textSecondary }}>
                      Kings XI
                    </ThemedText>
                  </View>
                  <ThemedText type="headlineSm" style={{ marginTop: 12, color: theme.textSecondary }}>
                    Yet to bat
                  </ThemedText>
                  <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginTop: 4 }}>
                    2ND INNINGS
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
                  <ThemedText type="labelMd" style={{ color: theme.text }}>
                    MATCH CENTER
                  </ThemedText>
                  <Ionicons name="arrow-forward" size={14} color={theme.text} style={{ marginLeft: 2 }} />
                </Pressable>
              </View>
            </Pressable>
          </View>

          {/* TODAY Section */}
          <View style={styles.section}>
            <ThemedText type="labelMd" style={[styles.sectionHeader, { color: theme.textSecondary }]}>
              TODAY
            </ThemedText>

            <View style={[styles.matchCard, { backgroundColor: theme.surfaceLowest }, Shadows.level2]}>
              <Image
                source={require('@/assets/images/illustrations/football_player.png')}
                style={styles.cardWatermark}
                contentFit="contain"
              />

              <View style={styles.cardHeader}>
                <View style={styles.badgeRow}>
                  <View style={[styles.todayBadge, { backgroundColor: theme.primaryContainer }]}>
                    <ThemedText type="labelSm" style={{ color: '#ffffff', fontWeight: '800' }}>TODAY</ThemedText>
                  </View>
                  <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontWeight: '700', marginLeft: 6 }}>
                    SUMMER FUTSAL LEAGUE
                  </ThemedText>
                </View>
                <View style={[styles.meBadge, { backgroundColor: theme.secondaryContainer }]}>
                  <ThemedText type="labelSm" style={{ color: theme.onSecondaryContainer, fontWeight: '800' }}>ME</ThemedText>
                </View>
              </View>

              {/* Match Teams & Time */}
              <View style={[styles.vsMatchRow, { marginVertical: Spacing.md }]}>
                <View style={styles.vsTeamCol}>
                  <View style={[styles.crestContainer, Shadows.level2]}>
                    <Ionicons name="shield-half" size={22} color={theme.primary} />
                  </View>
                  <ThemedText type="bodyMd" style={{ textAlign: 'center', marginTop: 4, fontFamily: 'HankenGrotesk_700Bold' }}>
                    London Lions
                  </ThemedText>
                </View>

                <View style={[styles.timeBadge, { backgroundColor: theme.surfaceHigh }]}>
                  <ThemedText type="headlineSm" style={{ fontFamily: 'HankenGrotesk_800ExtraBold' }}>19:00</ThemedText>
                </View>

                <View style={styles.vsTeamCol}>
                  <View style={[styles.crestContainer, Shadows.level2]}>
                    <Ionicons name="shield-half" size={22} color={theme.secondaryContainer} />
                  </View>
                  <ThemedText type="bodyMd" style={{ textAlign: 'center', marginTop: 4, fontFamily: 'HankenGrotesk_700Bold' }}>
                    Kent Kings
                  </ThemedText>
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
                <Pressable style={styles.matchCenterLink}>
                  <ThemedText type="labelMd" style={{ color: theme.text }}>
                    MATCH CENTER
                  </ThemedText>
                  <Ionicons name="arrow-forward" size={14} color={theme.text} style={{ marginLeft: 2 }} />
                </Pressable>
              </View>
            </View>
          </View>

          {/* YESTERDAY Section */}
          <View style={[styles.section, { paddingBottom: 120 }]}>
            <ThemedText type="labelMd" style={[styles.sectionHeader, { color: theme.textSecondary }]}>
              YESTERDAY
            </ThemedText>

            <View style={[styles.matchCard, { backgroundColor: theme.surfaceLowest, opacity: 0.9, borderWidth: 1, borderColor: theme.outlineVariant + '33' }]}>
              <View style={styles.cardHeader}>
                <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontWeight: '700' }}>
                  T20 BLAST
                </ThemedText>
              </View>

              {/* Finished Match Rows */}
              <View style={{ marginVertical: Spacing.sm, gap: Spacing.xs }}>
                <View style={styles.finishedMatchTeamRow}>
                  <View style={[styles.teamLetterLogoSmall, { backgroundColor: theme.surfaceHigh }]}>
                    <ThemedText type="labelSm" style={{ color: theme.text }}>MT</ThemedText>
                  </View>
                  <ThemedText type="bodyMd" style={{ marginLeft: Spacing.xs, fontFamily: 'HankenGrotesk_600SemiBold' }}>
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
                  <ThemedText type="bodyMd" style={{ marginLeft: Spacing.xs, fontFamily: 'HankenGrotesk_600SemiBold' }}>
                    Sussex Sharks
                  </ThemedText>
                  <ThemedText type="bodyMd" style={{ marginLeft: 'auto', fontFamily: 'HankenGrotesk_700Bold', color: theme.textSecondary }}>
                    142/9
                  </ThemedText>
                </View>
              </View>

              {/* Card Footer */}
              <View style={[styles.cardFooter, { borderTopColor: theme.outlineVariant + '33', paddingTop: Spacing.sm }]}>
                <View style={[styles.finishedBadge, { backgroundColor: theme.surfaceHigh }]}>
                  <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontWeight: '700' }}>
                    FINISHED
                  </ThemedText>
                </View>
                <Pressable style={styles.matchCenterLink}>
                  <ThemedText type="labelMd" style={{ color: theme.text }}>
                    SCORECARD
                  </ThemedText>
                  <Ionicons name="chevron-forward" size={16} color={theme.text} />
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Floating Action Button (FAB) */}
        <Pressable
          style={[styles.fab, { backgroundColor: theme.secondaryContainer }, Shadows.level3]}
          onPress={() => handleMatchCenterSelect('new')}
        >
          <Ionicons name="add" size={28} color={theme.onSecondaryContainer} />
        </Pressable>

      </SafeAreaView>
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
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#0000000a',
    zIndex: 10,
  },
  userProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  headerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#c3c7cb',
  },
  headerTitle: {
    fontFamily: 'HankenGrotesk_800ExtraBold',
    fontSize: 20,
    letterSpacing: -0.5,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  iconButton: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  filtersContainer: {
    gap: Spacing.xs,
    paddingHorizontal: Spacing.containerMargin,
    paddingVertical: Spacing.md,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
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
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.containerMargin,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    letterSpacing: 0.5,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  matchCard: {
    borderRadius: BorderRadius.xl * 2, // 2xl is 16px, times 2 for premium soft rounding
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#c3c7cb33',
    position: 'relative',
    overflow: 'hidden',
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
    marginBottom: Spacing.md,
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
    width: 28,
    height: 28,
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
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
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
  vsMatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vsTeamCol: {
    flex: 1,
    alignItems: 'center',
  },
  crestContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.xl,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.xl,
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
    position: 'absolute',
    right: Spacing.gutter,
    bottom: Platform.OS === 'ios' ? 104 : 88,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
});
