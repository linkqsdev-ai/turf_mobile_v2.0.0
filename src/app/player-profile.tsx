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
import { Spacing, BorderRadius, Shadows, Colors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function PlayerProfileScreen() {
  const theme = useTheme();
  const router = useRouter();

  // Interactivity state
  const [following, setFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(12400);

  const handleFollowToggle = () => {
    if (following) {
      setFollowing(false);
      setFollowersCount(prev => prev - 1);
    } else {
      setFollowing(true);
      setFollowersCount(prev => prev + 1);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Navigation TopAppBar */}
        <View style={[styles.header, { backgroundColor: theme.background }]}>
          <Pressable 
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)');
              }
            }} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </Pressable>
          <ThemedText type="headlineSm" style={styles.headerTitle}>
            Player Profile
          </ThemedText>
          <Pressable style={styles.iconButton}>
            <Ionicons name="share-outline" size={22} color={theme.text} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Hero Profile Card */}
          <View style={styles.section}>
            <View style={[styles.heroCard, { backgroundColor: theme.surfaceLowest }, Shadows.level2]}>
              <View style={styles.avatarWrapper}>
                <Image
                  source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuArAOIUhE03Lj1tb66WvRYbrDl7KgoGi5vi2XdzpRBJZXrgyquUa_Wcq1_1Xw_y_rivR86-gT3hvD_AMDC0AToCv2TlfFvJkAEgCCRIzrnuCYHY1x2qNK5KPcaR0rKKYurjgdOgv-arR6X5hantltjIX11HyFp-SaPyvvlS4_TamcTrufMiKMYoe3DFI6op6vuXrM76Hm-3wwSxa3XmAFKyPN_IHA9hYsDChsVIawl-XafxniTDyhS1p3Bw61Jtfdp7r-0TBw35WHI' }}
                  style={styles.avatarImage}
                />
                <View style={[styles.proBadge, { backgroundColor: theme.secondaryContainer }]}>
                  <ThemedText type="labelSm" style={{ color: theme.onSecondaryContainer, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 9 }}>
                    VERIFIED PRO
                  </ThemedText>
                </View>
              </View>

              <View style={styles.heroInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <ThemedText type="headlineLg" style={{ color: theme.text }}>Marcus V.</ThemedText>
                  <Ionicons name="checkmark-circle" size={18} color={theme.secondaryContainer} style={{ marginLeft: 6 }} />
                </View>
                
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={14} color={theme.textSecondary} />
                  <ThemedText type="bodySm" style={{ color: theme.textSecondary, marginLeft: 4 }}>
                    London, United Kingdom
                  </ThemedText>
                  <View style={[styles.dot, { backgroundColor: theme.outlineVariant }]} />
                  <ThemedText type="labelMd" style={{ color: theme.secondary }}>
                    ELITE TIER
                  </ThemedText>
                </View>

                {/* Follower Stats */}
                <View style={styles.statsRow}>
                  <View style={styles.statCol}>
                    <ThemedText type="headlineSm" style={{ color: theme.text, fontFamily: 'HankenGrotesk_700Bold' }}>
                      {(followersCount / 1000).toFixed(1)}k
                    </ThemedText>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Followers</ThemedText>
                  </View>
                  <View style={[styles.statsDivider, { backgroundColor: theme.outlineVariant + '33' }]} />
                  <View style={styles.statCol}>
                    <ThemedText type="headlineSm" style={{ color: theme.text, fontFamily: 'HankenGrotesk_700Bold' }}>
                      842
                    </ThemedText>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Following</ThemedText>
                  </View>
                </View>
              </View>

              <View style={styles.heroActions}>
                <Pressable
                  onPress={handleFollowToggle}
                  style={[
                    styles.primaryActionBtn,
                    following ? { backgroundColor: theme.surfaceLow, borderWidth: 1, borderColor: theme.outlineVariant } : { backgroundColor: theme.primary }
                  ]}
                >
                  <ThemedText type="labelMd" style={{ color: following ? theme.text : '#ffffff' }}>
                    {following ? 'FOLLOWING' : 'FOLLOW'}
                  </ThemedText>
                </Pressable>
                <Pressable style={[styles.secondaryActionBtn, { borderColor: theme.outline }]}>
                  <ThemedText type="labelMd" style={{ color: theme.text }}>MESSAGE</ThemedText>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Bento Stats Grid */}
          <View style={styles.section}>
            <ThemedText type="labelMd" style={{ color: theme.textSecondary, marginBottom: Spacing.sm, letterSpacing: 0.5 }}>
              PERFORMANCE OVERVIEW
            </ThemedText>

            <View style={styles.bentoContainer}>
              <View style={styles.bentoRow}>
                {/* AI Skill Assessment circle progress */}
                <View style={[styles.skillRatingCell, { backgroundColor: theme.primaryContainer }]}>
                  <ThemedText type="labelSm" style={{ color: 'rgba(255, 255, 255, 0.7)', letterSpacing: 0.5, marginBottom: Spacing.sm }}>
                    AI SKILL RATING
                  </ThemedText>
                  
                  <View style={styles.circularProgressContainer}>
                    {/* Ring circles using nested views */}
                    <View style={styles.circularProgressTrack} />
                    <View style={styles.circularProgressFill} />
                    <ThemedText style={styles.circularProgressText}>94</ThemedText>
                  </View>

                  <View style={[styles.optimalBadge, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
                    <ThemedText type="labelSm" style={{ color: theme.secondaryContainer, fontFamily: 'PlusJakartaSans_700Bold' }}>
                      PEAK PERFORMANCE
                    </ThemedText>
                  </View>
                </View>

                {/* Batting Stats */}
                <View style={[styles.bentoCell, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
                  <View style={styles.bentoCellHeader}>
                    <ThemedText type="headlineSm" style={{ fontSize: 16 }}>Batting</ThemedText>
                    <Ionicons name="fitness" size={18} color={theme.secondaryContainer} />
                  </View>
                  <View style={styles.metricsGrid}>
                    <View style={styles.metricItem}>
                      <ThemedText type="labelSm" style={styles.metricLabel}>AVG</ThemedText>
                      <ThemedText type="headlineSm" style={styles.metricValue}>54.2</ThemedText>
                    </View>
                    <View style={styles.metricItem}>
                      <ThemedText type="labelSm" style={styles.metricLabel}>SR</ThemedText>
                      <ThemedText type="headlineSm" style={styles.metricValue}>142.8</ThemedText>
                    </View>
                    <View style={styles.metricItem}>
                      <ThemedText type="labelSm" style={styles.metricLabel}>HS</ThemedText>
                      <ThemedText type="headlineSm" style={styles.metricValue}>124*</ThemedText>
                    </View>
                    <View style={styles.metricItem}>
                      <ThemedText type="labelSm" style={styles.metricLabel}>50s/100s</ThemedText>
                      <ThemedText type="headlineSm" style={styles.metricValue}>12/4</ThemedText>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.bentoRow}>
                {/* Bowling Stats */}
                <View style={[styles.bentoCell, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
                  <View style={styles.bentoCellHeader}>
                    <ThemedText type="headlineSm" style={{ fontSize: 16 }}>Bowling</ThemedText>
                    <Ionicons name="baseball" size={18} color={theme.secondaryContainer} />
                  </View>
                  <View style={styles.metricsGrid}>
                    <View style={styles.metricItem}>
                      <ThemedText type="labelSm" style={styles.metricLabel}>WICKETS</ThemedText>
                      <ThemedText type="headlineSm" style={styles.metricValue}>48</ThemedText>
                    </View>
                    <View style={styles.metricItem}>
                      <ThemedText type="labelSm" style={styles.metricLabel}>ECON</ThemedText>
                      <ThemedText type="headlineSm" style={styles.metricValue}>6.42</ThemedText>
                    </View>
                    <View style={styles.metricItem}>
                      <ThemedText type="labelSm" style={styles.metricLabel}>BEST</ThemedText>
                      <ThemedText type="headlineSm" style={styles.metricValue}>5/22</ThemedText>
                    </View>
                    <View style={styles.metricItem}>
                      <ThemedText type="labelSm" style={styles.metricLabel}>5-FERS</ThemedText>
                      <ThemedText type="headlineSm" style={styles.metricValue}>2</ThemedText>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Dynamic action banner */}
          <View style={styles.section}>
            <View style={[styles.actionBanner, { backgroundColor: theme.surfaceLow }]}>
              <View style={styles.bannerTextContainer}>
                <ThemedText type="headlineSm" style={{ color: theme.text }}>
                  Mastering the Pitch with Precision
                </ThemedText>
                <ThemedText type="bodySm" style={{ color: theme.textSecondary, marginTop: Spacing.half }}>
                  Data-driven performance tracking for the modern professional athlete.
                </ThemedText>
              </View>
              <Pressable style={[styles.bannerBtn, { backgroundColor: theme.primary }]}>
                <ThemedText type="labelSm" style={{ color: '#ffffff' }}>VIEW ANALYTICS</ThemedText>
                <Ionicons name="arrow-forward" size={12} color="#ffffff" style={{ marginLeft: 4 }} />
              </Pressable>
            </View>
          </View>

          {/* Achievements Section */}
          <View style={styles.section}>
            <View style={styles.rowBetween}>
              <ThemedText type="headlineSm">Achievements</ThemedText>
              <Pressable>
                <ThemedText type="labelSm" style={{ color: theme.secondary, fontWeight: '700' }}>SEE ALL</ThemedText>
              </Pressable>
            </View>

            <View style={styles.achievementRow}>
              <View style={[styles.achievementCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
                <View style={[styles.achievementIconContainer, { backgroundColor: theme.secondaryContainer + '22' }]}>
                  <Ionicons name="trophy" size={24} color={theme.secondaryContainer} />
                </View>
                <ThemedText type="labelSm" style={{ marginTop: Spacing.sm, fontFamily: 'HankenGrotesk_700Bold', color: theme.text, fontSize: 9 }}>
                  MVP 2024
                </ThemedText>
              </View>

              <View style={[styles.achievementCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
                <View style={[styles.achievementIconContainer, { backgroundColor: theme.secondaryContainer + '22' }]}>
                  <Ionicons name="ribbon" size={24} color={theme.secondaryContainer} />
                </View>
                <ThemedText type="labelSm" style={{ marginTop: Spacing.sm, fontFamily: 'HankenGrotesk_700Bold', color: theme.text, fontSize: 9 }}>
                  CENTURY CLUB
                </ThemedText>
              </View>

              <View style={[styles.achievementCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
                <View style={[styles.achievementIconContainer, { backgroundColor: theme.secondaryContainer + '22' }]}>
                  <Ionicons name="medal" size={24} color={theme.secondaryContainer} />
                </View>
                <ThemedText type="labelSm" style={{ marginTop: Spacing.sm, fontFamily: 'HankenGrotesk_700Bold', color: theme.text, fontSize: 9 }}>
                  TOP BOWLER
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Match History */}
          <View style={[styles.section, { paddingBottom: 60 }]}>
            <ThemedText type="headlineSm" style={{ marginBottom: Spacing.md }}>Match History</ThemedText>
            
            <View style={[styles.historyCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
              {/* History Item 1 */}
              <View style={styles.historyRow}>
                <View style={[styles.teamInitials, { backgroundColor: theme.primaryContainer }]}>
                  <ThemedText style={{ color: theme.secondaryContainer, fontWeight: '700', fontSize: 11 }}>LL</ThemedText>
                </View>
                <View style={{ flex: 1, marginLeft: Spacing.md }}>
                  <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>London Lions vs Kent Kings</ThemedText>
                  <ThemedText type="bodySm" style={{ color: theme.textSecondary, fontSize: 11 }}>T20 Blast • 12 Feb 2024</ThemedText>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>42 Runs (28b)</ThemedText>
                  <ThemedText type="bodySm" style={{ color: theme.textSecondary, fontSize: 11 }}>1 Wicket (2/18)</ThemedText>
                </View>
              </View>

              <View style={[styles.rowDivider, { backgroundColor: theme.outlineVariant + '22' }]} />

              {/* History Item 2 */}
              <View style={styles.historyRow}>
                <View style={[styles.teamInitials, { backgroundColor: theme.surfaceHigh }]}>
                  <ThemedText style={{ color: theme.text, fontWeight: '700', fontSize: 11 }}>KS</ThemedText>
                </View>
                <View style={{ flex: 1, marginLeft: Spacing.md }}>
                  <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>Kent Kings vs Sussex Sharks</ThemedText>
                  <ThemedText type="bodySm" style={{ color: theme.textSecondary, fontSize: 11 }}>One Day Cup • 08 Feb 2024</ThemedText>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>15 Runs (12b)</ThemedText>
                  <ThemedText type="bodySm" style={{ color: theme.textSecondary, fontSize: 11 }}>3 Wickets (3/42)</ThemedText>
                </View>
              </View>

              <View style={[styles.rowDivider, { backgroundColor: theme.outlineVariant + '22' }]} />

              {/* History Item 3 */}
              <View style={styles.historyRow}>
                <View style={[styles.teamInitials, { backgroundColor: theme.primaryContainer }]}>
                  <ThemedText style={{ color: theme.secondaryContainer, fontWeight: '700', fontSize: 11 }}>LL</ThemedText>
                </View>
                <View style={{ flex: 1, marginLeft: Spacing.md }}>
                  <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>London Lions vs Yorkshire Vikings</ThemedText>
                  <ThemedText type="bodySm" style={{ color: theme.textSecondary, fontSize: 11 }}>T20 Blast • 05 Feb 2024</ThemedText>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold', color: theme.secondaryContainer }}>112* Runs (54b)</ThemedText>
                  <ThemedText type="bodySm" style={{ color: theme.textSecondary, fontSize: 11 }}>0 Wickets (0/24)</ThemedText>
                </View>
              </View>
            </View>
          </View>

        </ScrollView>
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
    paddingHorizontal: Spacing.md,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#0000000a',
    zIndex: 10,
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 16,
  },
  iconButton: {
    padding: 6,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.containerMargin,
  },
  heroCard: {
    borderRadius: BorderRadius.premium,
    borderWidth: 1,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  proBadge: {
    position: 'absolute',
    bottom: -6,
    alignSelf: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  heroInfo: {
    alignItems: 'center',
    marginTop: Spacing.md,
    width: '100%',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
    width: '100%',
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statsDivider: {
    width: 1,
    height: 28,
  },
  heroActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.lg,
    width: '100%',
  },
  primaryActionBtn: {
    flex: 1,
    height: 40,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryActionBtn: {
    flex: 1,
    height: 40,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bentoContainer: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  bentoCell: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
  },
  bentoCellHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#0000000a',
    paddingBottom: Spacing.xs,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  metricItem: {
    width: '46%',
    marginBottom: Spacing.sm,
  },
  metricLabel: {
    color: '#73787b',
    fontSize: 9,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 18,
    marginTop: 2,
    fontFamily: 'HankenGrotesk_700Bold',
  },
  skillRatingCell: {
    flex: 1,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularProgressContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: Spacing.xs,
  },
  circularProgressTrack: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 6,
    borderColor: 'rgba(255,255,255,0.08)',
    position: 'absolute',
  },
  circularProgressFill: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 6,
    borderColor: '#feae2c',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    position: 'absolute',
    transform: [{ rotate: '45deg' }],
  },
  circularProgressText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: 'HankenGrotesk_800ExtraBold',
  },
  optimalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
  },
  actionBanner: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerTextContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },
  bannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.xl,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  achievementRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  achievementCard: {
    flex: 1,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    alignItems: 'center',
  },
  achievementIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  teamInitials: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowDivider: {
    height: 1,
    width: '100%',
  },
});
