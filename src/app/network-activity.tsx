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
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Mock Pending Requests
const PENDING_REQUESTS = [
  { id: 'req1', name: 'Alex Mercer', type: 'Connection Request', detail: 'Midfielder • Lv. 9', image: require('@/assets/images/illustrations/athletes.png') },
  { id: 'req2', name: 'Blue Falcons FC', type: 'Match Invitation', detail: 'Sat, 18:30 vs Wolves', image: require('@/assets/images/illustrations/team_huddle.png') },
];

// Mock Connection Logs
const CONNECTION_LOGS = [
  { id: 'log1', text: 'Marcus J. accepted your match invite.', time: '2 hours ago', icon: 'checkmark-circle-outline', color: '#16a34a' },
  { id: 'log2', text: 'Elena S. sent a challenge request to Vanguard FC.', time: '1 day ago', icon: 'flash-outline', color: '#feae2c' },
  { id: 'log3', text: 'You connected with David W.', time: '3 days ago', icon: 'people-outline', color: '#05151e' },
];

const CHART_DATA = [
  { day: 'M', height: '40%', active: false },
  { day: 'T', height: '60%', active: false },
  { day: 'W', height: '95%', active: true },
  { day: 'T', height: '75%', active: false },
  { day: 'F', height: '55%', active: false },
  { day: 'S', height: '85%', active: false },
  { day: 'S', height: '45%', active: false },
];

export default function NetworkActivityScreen() {
  const theme = useTheme();
  const router = useRouter();

  // Tab State
  const [activeTab, setActiveTab] = useState<'feed' | 'pending' | 'logs'>('feed');

  // Interactivity States for Social Feed
  const [congratulated, setCongratulated] = useState(false);
  const [victoryLiked, setVictoryLiked] = useState(false);
  const [victoryLikesCount, setVictoryLikesCount] = useState(1240);
  const [followingAlex, setFollowingAlex] = useState(false);

  // Request State
  const [requests, setRequests] = useState(PENDING_REQUESTS);

  const handleAction = (id: string, action: 'accept' | 'decline') => {
    setRequests(prev => prev.filter(r => r.id !== id));
  };

  const handleVictoryLike = () => {
    if (victoryLiked) {
      setVictoryLiked(false);
      setVictoryLikesCount(prev => prev - 1);
    } else {
      setVictoryLiked(true);
      setVictoryLikesCount(prev => prev + 1);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Top Header */}
        <View style={[styles.header, { backgroundColor: theme.background }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </Pressable>
          <ThemedText type="headlineSm" style={styles.headerTitle}>
            Network Activity
          </ThemedText>
          <View style={{ width: 36 }} />
        </View>

        {/* Tab Selector */}
        <View style={styles.tabSelectorRow}>
          <Pressable
            onPress={() => setActiveTab('feed')}
            style={[
              styles.tabBtn,
              activeTab === 'feed' && { borderBottomColor: theme.secondary }
            ]}
          >
            <ThemedText
              type="labelMd"
              style={{
                color: activeTab === 'feed' ? theme.text : theme.textSecondary,
                fontFamily: activeTab === 'feed' ? 'HankenGrotesk_700Bold' : 'HankenGrotesk_400Regular'
              }}
            >
              SOCIAL FEED
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('pending')}
            style={[
              styles.tabBtn,
              activeTab === 'pending' && { borderBottomColor: theme.secondary }
            ]}
          >
            <ThemedText
              type="labelMd"
              style={{
                color: activeTab === 'pending' ? theme.text : theme.textSecondary,
                fontFamily: activeTab === 'pending' ? 'HankenGrotesk_700Bold' : 'HankenGrotesk_400Regular'
              }}
            >
              PENDING ({requests.length})
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('logs')}
            style={[
              styles.tabBtn,
              activeTab === 'logs' && { borderBottomColor: theme.secondary }
            ]}
          >
            <ThemedText
              type="labelMd"
              style={{
                color: activeTab === 'logs' ? theme.text : theme.textSecondary,
                fontFamily: activeTab === 'logs' ? 'HankenGrotesk_700Bold' : 'HankenGrotesk_400Regular'
              }}
            >
              ACTIVITY LOGS
            </ThemedText>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Tab Content: Social Feed */}
          {activeTab === 'feed' && (
            <View style={styles.section}>
              
              {/* Introduction Card */}
              <View style={styles.welcomeContainer}>
                <ThemedText type="headlineLg" style={{ color: theme.text }}>
                  Network <ThemedText type="headlineLg" style={{ color: theme.secondary }}>Activity</ThemedText>
                </ThemedText>
                <ThemedText type="bodySm" style={{ color: theme.textSecondary, marginTop: Spacing.half }}>
                  Stay updated with the latest achievements, match highlights, and global rankings from the professional athlete ecosystem.
                </ThemedText>
              </View>

              {/* Feed Item 1: Milestone Rank Update (Dark Bento theme) */}
              <View style={[styles.milestoneCard, { backgroundColor: '#001b3d' }, Shadows.level2]}>
                <Image
                  source={require('@/assets/images/illustrations/trophy.png')}
                  style={styles.milestoneTrophyImage}
                  contentFit="contain"
                />
                
                <View style={styles.milestoneBadge}>
                  <Ionicons name="star" size={12} color="#feae2c" />
                  <ThemedText type="labelSm" style={{ color: '#feae2c', fontWeight: '800', marginLeft: 4, letterSpacing: 1.5 }}>
                    GLOBAL MILESTONE
                  </ThemedText>
                </View>

                <ThemedText type="headlineSm" style={{ color: '#ffffff', marginTop: Spacing.md, lineHeight: 22 }}>
                  Marcus V. just climbed to Rank #3 in the Premier League
                </ThemedText>

                <View style={styles.rankContainer}>
                  <View>
                    <ThemedText type="labelSm" style={{ color: 'rgba(255,255,255,0.6)' }}>PREVIOUS</ThemedText>
                    <ThemedText type="headlineSm" style={{ color: '#ffffff', fontFamily: 'HankenGrotesk_800ExtraBold', marginTop: 2 }}>#7</ThemedText>
                  </View>
                  <View style={styles.divider} />
                  <View>
                    <ThemedText type="labelSm" style={{ color: '#feae2c' }}>CURRENT</ThemedText>
                    <ThemedText type="headlineSm" style={{ color: '#feae2c', fontFamily: 'HankenGrotesk_800ExtraBold', marginTop: 2 }}>#3</ThemedText>
                  </View>
                </View>

                <View style={styles.milestoneActions}>
                  <Pressable 
                    style={[styles.milestoneBtn, { backgroundColor: '#feae2c' }]}
                    onPress={() => router.push('/profile')}
                  >
                    <ThemedText type="labelSm" style={{ color: '#001b3d', fontFamily: 'PlusJakartaSans_700Bold' }}>
                      VIEW PROFILE
                    </ThemedText>
                  </Pressable>
                  <Pressable 
                    style={[styles.milestoneBtnSec, { borderColor: 'rgba(255,255,255,0.2)' }]}
                    onPress={() => setCongratulated(!congratulated)}
                  >
                    <ThemedText type="labelSm" style={{ color: congratulated ? '#feae2c' : '#ffffff', fontFamily: 'PlusJakartaSans_700Bold' }}>
                      {congratulated ? 'CONGRATULATED! ✓' : 'CONGRATULATE'}
                    </ThemedText>
                  </Pressable>
                </View>
              </View>

              {/* Feed Item 2: Team Victory (Square Bento theme) */}
              <View style={[styles.feedCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <View style={[styles.sportsBadge, { backgroundColor: theme.surface }]}>
                      <Ionicons name="football" size={14} color={theme.text} />
                    </View>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginLeft: Spacing.sm }}>
                      Match Result
                    </ThemedText>
                  </View>
                  <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>2h ago</ThemedText>
                </View>

                <ThemedText type="headlineSm" style={{ marginTop: Spacing.sm }}>
                  London Lions secured a victory
                </ThemedText>
                
                <ThemedText type="bodySm" style={{ color: theme.textSecondary, marginTop: Spacing.half, lineHeight: 18 }}>
                  A dominant 3-1 performance at the Wembley Stadium moves them to the top of the qualifiers.
                </ThemedText>

                <View style={[styles.scoreboardBlock, { backgroundColor: theme.surface }]}>
                  <View style={styles.scoreboardTeam}>
                    <View style={styles.teamShield}>
                      <Ionicons name="shield" size={20} color={theme.secondary} />
                    </View>
                    <ThemedText type="labelSm" style={{ fontSize: 9, marginTop: 4 }}>LIONS</ThemedText>
                  </View>
                  
                  <ThemedText type="headlineSm" style={{ fontFamily: 'HankenGrotesk_800ExtraBold' }}>3 - 1</ThemedText>
                  
                  <View style={styles.scoreboardTeam}>
                    <View style={[styles.teamShield, { opacity: 0.4 }]}>
                      <Ionicons name="shield" size={20} color={theme.outline} />
                    </View>
                    <ThemedText type="labelSm" style={{ fontSize: 9, marginTop: 4, opacity: 0.4 }}>REDS</ThemedText>
                  </View>
                </View>

                <View style={styles.socialFooter}>
                  <Pressable style={styles.socialFooterBtn} onPress={handleVictoryLike}>
                    <Ionicons name={victoryLiked ? 'heart' : 'heart-outline'} size={18} color={victoryLiked ? theme.error : theme.textSecondary} />
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginLeft: 4 }}>
                      {victoryLikesCount.toLocaleString()}
                    </ThemedText>
                  </Pressable>
                  <View style={styles.socialFooterBtn}>
                    <Ionicons name="chatbubble-outline" size={16} color={theme.textSecondary} />
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginLeft: 4 }}>84</ThemedText>
                  </View>
                  <Pressable style={styles.socialFooterBtn}>
                    <Ionicons name="share-social-outline" size={16} color={theme.textSecondary} />
                  </Pressable>
                </View>
              </View>

              {/* Feed Item 3: Player Update (Asymmetric theme) */}
              <View style={[styles.feedCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
                <Image
                  source={require('@/assets/images/illustrations/stadium.png')}
                  style={styles.postBannerImage}
                  contentFit="cover"
                />
                
                <View style={styles.postUserRow}>
                  <Image
                    source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCRtc7deNfm7005lF1RdF2CJmbEzSZIe8dBLuXymDoVclm0iIX64Mgu_bGOf6CF2rD6V5wG2py8YE5dkhiOVHyg74HgdDmK6MKZ7x_I8O9dq-FDDLVN4kBVw3fNPHGNIaBbKUFsssC5zHbCUEWukVviimhuoErEYOJrDJ8cAmy0zBw_7imDJgSyE5xPpfLbe7bQ0q7HSjQRLgM8Ikh9EjoIMV9_-UKm3gDBn6qWd4_ZjL8FOM0Ge4gYsEIiQwf82CYXqtqvNdnMBDM' }}
                    style={styles.postAvatar}
                  />
                  <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                    <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>Alex Rivers</ThemedText>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Elite Sprinter</ThemedText>
                  </View>
                  <Pressable
                    style={[
                      styles.followBtn,
                      followingAlex ? { backgroundColor: theme.surface, borderColor: theme.outlineVariant } : { backgroundColor: theme.primary, borderColor: theme.primary }
                    ]}
                    onPress={() => setFollowingAlex(!followingAlex)}
                  >
                    <ThemedText type="labelSm" style={{ color: followingAlex ? theme.text : '#ffffff' }}>
                      {followingAlex ? 'Following' : 'Follow'}
                    </ThemedText>
                  </Pressable>
                </View>

                <View style={{ paddingHorizontal: Spacing.md, paddingBottom: Spacing.md }}>
                  <ThemedText type="bodyMd" style={{ color: theme.text, lineHeight: 20 }}>
                    {"\"Just smashed my 100m personal best at the altitude camp. The new AI-driven training cycle is definitely paying off. #ElitePerformance #DataDriven\""}
                  </ThemedText>
                  
                  <View style={styles.hashtagRow}>
                    <View style={[styles.hashtagBadge, { backgroundColor: theme.surface }]}>
                      <ThemedText type="labelSm" style={{ fontSize: 9 }}>#Sprinting</ThemedText>
                    </View>
                    <View style={[styles.hashtagBadge, { backgroundColor: theme.surface }]}>
                      <ThemedText type="labelSm" style={{ fontSize: 9 }}>#PB</ThemedText>
                    </View>
                  </View>
                </View>
              </View>

              {/* Feed Item 4: Weekly Training Stats (Metric Card theme) */}
              <View style={[styles.feedCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
                <View style={styles.cardHeader}>
                  <ThemedText type="headlineSm">Weekly High-Intensity Volume</ThemedText>
                  <Ionicons name="ellipsis-vertical" size={16} color={theme.textSecondary} />
                </View>

                {/* Simple Bar Chart */}
                <View style={styles.chartContainer}>
                  {CHART_DATA.map((item, index) => (
                    <View key={index} style={styles.chartBarCol}>
                      <View style={styles.chartBarTrack}>
                        <View
                          style={[
                            styles.chartBarFill,
                            {
                              height: item.height as any,
                              backgroundColor: item.active ? theme.secondaryContainer : theme.surfaceLow,
                            },
                          ]}
                        />
                      </View>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginTop: 6, fontSize: 10 }}>
                        {item.day}
                      </ThemedText>
                    </View>
                  ))}
                </View>

                {/* Bottom Stats Footer */}
                <View style={[styles.chartStatsFooter, { backgroundColor: theme.primaryContainer }]}>
                  <View>
                    <ThemedText type="labelSm" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9 }}>PEAK HEART RATE</ThemedText>
                    <ThemedText type="headlineSm" style={{ color: '#ffffff', fontFamily: 'HankenGrotesk_700Bold', marginTop: 2 }}>
                      184 <ThemedText type="labelSm" style={{ color: 'rgba(255,255,255,0.7)' }}>BPM</ThemedText>
                    </ThemedText>
                  </View>
                  
                  <View style={{ alignItems: 'flex-end' }}>
                    <ThemedText type="labelSm" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9 }}>STATUS</ThemedText>
                    <View style={styles.optimalBadge}>
                      <View style={styles.optimalDot} />
                      <ThemedText type="labelSm" style={{ color: '#4ade80', fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold' }}>OPTIMAL</ThemedText>
                    </View>
                  </View>
                </View>
              </View>

              <View style={{ height: 40 }} />
            </View>
          )}

          {/* Tab Content: Pending Invites */}
          {activeTab === 'pending' && (
            <View style={styles.section}>
              {requests.map(req => (
                <View key={req.id} style={[styles.requestCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
                  <View style={styles.requestRow}>
                    <Image source={req.image} style={styles.requestAvatarImage} contentFit="cover" />
                    <View style={{ flex: 1, marginLeft: Spacing.md }}>
                      <ThemedText type="labelSm" style={{ color: theme.secondary, letterSpacing: 0.5 }}>
                        {req.type.toUpperCase()}
                      </ThemedText>
                      <ThemedText type="headlineSm" style={{ marginTop: 2 }}>{req.name}</ThemedText>
                      <ThemedText type="bodySm" style={{ color: theme.textSecondary }}>{req.detail}</ThemedText>
                    </View>
                  </View>

                  <View style={styles.cardActions}>
                    <Pressable
                      onPress={() => handleAction(req.id, 'accept')}
                      style={[styles.acceptBtn, { backgroundColor: theme.primary }]}
                    >
                      <ThemedText type="labelMd" style={{ color: '#ffffff' }}>Accept</ThemedText>
                    </Pressable>
                    <Pressable
                      onPress={() => handleAction(req.id, 'decline')}
                      style={[styles.declineBtn, { borderColor: theme.outlineVariant }]}
                    >
                      <ThemedText type="labelMd" style={{ color: theme.textSecondary }}>Decline</ThemedText>
                    </Pressable>
                  </View>
                </View>
              ))}

              {requests.length === 0 && (
                <View style={styles.emptyContainer}>
                  <Ionicons name="mail-open-outline" size={48} color={theme.textSecondary + '66'} />
                  <ThemedText type="bodyMd" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
                    All caught up! No pending requests.
                  </ThemedText>
                </View>
              )}
            </View>
          )}

          {/* Tab Content: Activity Logs */}
          {activeTab === 'logs' && (
            <View style={styles.section}>
              <View style={[styles.logsCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
                {CONNECTION_LOGS.map((log, idx) => (
                  <View key={log.id} style={[styles.logRow, idx > 0 && { borderTopWidth: 1, borderTopColor: '#0000000a' }]}>
                    <View style={[styles.logIconWrap, { backgroundColor: log.color + '1a' }]}>
                      <Ionicons name={log.icon as any} size={18} color={log.color} />
                    </View>
                    <View style={{ flex: 1, marginLeft: Spacing.md }}>
                      <ThemedText type="bodyMd" style={{ color: theme.text }}>{log.text}</ThemedText>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginTop: 2 }}>{log.time}</ThemedText>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

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
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.containerMargin,
  },
  tabSelectorRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#0000000a',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  welcomeContainer: {
    marginBottom: Spacing.lg,
  },
  
  // Milestone Card Styles
  milestoneCard: {
    borderRadius: BorderRadius.premium,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  milestoneTrophyImage: {
    position: 'absolute',
    right: -20,
    bottom: -10,
    width: 130,
    height: 130,
    opacity: 0.15,
  },
  milestoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  milestoneActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  milestoneBtn: {
    flex: 1,
    height: 38,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  milestoneBtnSec: {
    flex: 1,
    height: 38,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Feed Card Styles
  feedCard: {
    borderRadius: BorderRadius.premium,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sportsBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreboardBlock: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  scoreboardTeam: {
    alignItems: 'center',
  },
  teamShield: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  socialFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#0000000a',
    paddingTop: Spacing.md,
    marginTop: Spacing.sm,
  },
  socialFooterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },

  // Post Specific Styles
  postBannerImage: {
    width: '100%',
    height: 140,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
  },
  postUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  postAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  followBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hashtagRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  hashtagBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  },

  // Chart Specific Styles
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingHorizontal: Spacing.sm,
    marginVertical: Spacing.md,
  },
  chartBarCol: {
    alignItems: 'center',
    flex: 1,
  },
  chartBarTrack: {
    height: '100%',
    width: 14,
    justifyContent: 'flex-end',
  },
  chartBarFill: {
    width: '100%',
    borderRadius: BorderRadius.full,
  },
  chartStatsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  optimalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginTop: 2,
  },
  optimalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ade80',
    marginRight: 4,
  },

  // Pending Invite Styles
  requestCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  cardActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  acceptBtn: {
    flex: 1,
    height: 36,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineBtn: {
    flex: 1,
    height: 36,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },

  // Log Card Styles
  logsCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  logIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
