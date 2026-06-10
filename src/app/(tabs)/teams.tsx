import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Mock Players Data
const PLAYERS = [
  { id: '1', name: 'Marcus J.', role: 'Midfielder • Lv. 10', image: require('@/assets/images/illustrations/athletes.png') },
  { id: '2', name: 'Elena S.', role: 'Forward • Lv. 14', image: require('@/assets/images/illustrations/tennis_player.png') },
  { id: '3', name: 'David W.', role: 'GK • Lv. 11', image: require('@/assets/images/illustrations/basketball_player.png') },
  { id: '4', name: 'Sarah K.', role: 'Defense • Lv. 12', image: require('@/assets/images/illustrations/athletes.png') },
];

export default function TeamsTab() {
  const theme = useTheme();
  const router = useRouter();

  // Button States for Interactive Join/Apply Buttons
  const [joinStates, setJoinStates] = useState<Record<string, string>>({
    'apex': 'Join Team',
    'vanguard': 'Join Team',
    'volt': 'Apply to Join',
  });

  // Invite Button States for horizontal player list
  const [inviteStates, setInviteStates] = useState<Record<string, boolean>>({});

  const handleJoinClick = (id: string, originalText: string) => {
    setJoinStates(prev => ({ ...prev, [id]: 'Request Sent' }));
    setTimeout(() => {
      setJoinStates(prev => ({ ...prev, [id]: originalText }));
    }, 2000);
  };

  const handleInviteClick = (id: string) => {
    setInviteStates(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setInviteStates(prev => ({ ...prev, [id]: false }));
    }, 2000);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Top App Bar */}
        <View style={[styles.header, { backgroundColor: theme.background }]}>
          <View style={styles.headerLeft}>
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
          <View style={styles.headerRightActions}>
            <Pressable style={styles.iconButton} onPress={() => router.push('/network')}>
              <Ionicons name="pulse" size={20} color={theme.secondary} />
            </Pressable>
            <Pressable style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={20} color={theme.secondary} />
            </Pressable>
            <Pressable style={styles.profileIconButton} onPress={() => router.push('/profile')}>
              <Image
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD906cwGePK5tZt4al07polQZxe4OW2sIJ-lhjDewDXct6IJtZetqa2i4lnO9-CMUT1oBiYhGj0BUqSwgzvIHynL-pG1kkY5KzzF9cvL0bxVNlPJEbfv2pHhgwd2mkejpG9vnC4b1XliECQQDedwmy8XfJ0AUw7fpdjFhLXiUdidhARSpLIkMeew198pOXaj0K9g0kbbWaDwJfBtYdJwqD1ztbzBAkeltwyKB0I_eTeM0ksi5qEbR6iQRPKqERd-3DOKAQez21qHyI' }}
                style={styles.headerAvatar}
              />
            </Pressable>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* User Analytics / Personal Ranking Bento Grid */}
          <View style={styles.section}>
            <View style={styles.rankingGrid}>
              
              {/* Global Ranking Card */}
              <View style={[styles.rankingCard, { backgroundColor: theme.primaryContainer }]}>
                <View style={styles.rankingCardDecor} />
                <View style={{ zIndex: 2 }}>
                  <ThemedText type="labelSm" style={{ color: theme.onPrimaryContainer, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                    Global Ranking
                  </ThemedText>
                  <ThemedText type="headlineMd" style={{ color: '#ffffff', marginTop: Spacing.half }}>
                    Elite Division • #428
                  </ThemedText>
                  
                  <View style={styles.badgeWrapper}>
                    <View style={[styles.skillBadge, { backgroundColor: theme.secondaryContainer }]}>
                      <ThemedText type="labelSm" style={{ color: theme.onSecondaryContainer, fontFamily: 'PlusJakartaSans_700Bold' }}>
                        Top 5% Skill Level
                      </ThemedText>
                    </View>
                  </View>

                  <View style={styles.statsRow}>
                    <View>
                      <ThemedText type="labelSm" style={{ color: theme.onPrimaryContainer }}>Win Rate</ThemedText>
                      <ThemedText type="headlineSm" style={{ color: '#ffffff', fontFamily: 'HankenGrotesk_700Bold' }}>78.4%</ThemedText>
                    </View>
                    <View>
                      <ThemedText type="labelSm" style={{ color: theme.onPrimaryContainer }}>Avg Score</ThemedText>
                      <ThemedText type="headlineSm" style={{ color: '#ffffff', fontFamily: 'HankenGrotesk_700Bold' }}>24.5</ThemedText>
                    </View>
                    <View>
                      <ThemedText type="labelSm" style={{ color: theme.onPrimaryContainer }}>Matches</ThemedText>
                      <ThemedText type="headlineSm" style={{ color: '#ffffff', fontFamily: 'HankenGrotesk_700Bold' }}>112</ThemedText>
                    </View>
                  </View>
                </View>
              </View>

              {/* AI Matcher Info Card */}
              <View style={[styles.matcherCard, { backgroundColor: theme.surfaceHigh, borderColor: theme.outlineVariant + '33' }]}>
                <View style={styles.matcherAvatarContainer}>
                  <View style={[styles.matcherAvatarRing, { borderColor: theme.secondaryContainer }]}>
                    <Ionicons name="star" size={24} color={theme.primary} />
                  </View>
                  <View style={[styles.levelBadge, { backgroundColor: theme.secondary }]}>
                    <ThemedText type="labelSm" style={{ color: '#ffffff', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 9 }}>
                      LVL 12
                    </ThemedText>
                  </View>
                </View>
                <ThemedText type="headlineSm" style={{ color: theme.text, marginTop: Spacing.sm }}>
                  AI Matcher Active
                </ThemedText>
                <ThemedText type="bodySm" style={{ color: theme.textSecondary, textAlign: 'center', marginTop: Spacing.half }}>
                  Analyzing 48 teams in your local metro area.
                </ThemedText>
              </View>

            </View>
          </View>

          {/* Top Matches for You */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <ThemedText type="headlineSm">Top Matches for You</ThemedText>
                <ThemedText type="bodySm" style={{ color: theme.textSecondary }}>
                  Recommended based on your Elite ranking
                </ThemedText>
              </View>
              <Pressable>
                <ThemedText type="labelMd" style={{ color: theme.secondary, letterSpacing: 0.5 }}>
                  SEE ALL
                </ThemedText>
              </Pressable>
            </View>

            {/* Team Grid */}
            <View style={styles.teamGrid}>
                    {/* Team Card 1 */}
              <View style={[styles.teamCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
                <View style={styles.teamCardHeader}>
                  <Image source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC-rGNcjfTOqIbCc14x83aW-UxvfwQbFlcyDJxfiI8ZW54ZEnoJj_6XMl36rA1HACKrvZtNCIXvr2C0OqBv5ofBMDmbIsSGwIrg2aJM6DZx1zCnA069mfIswX4BSiH74irw7LbjrSEwBGaYOv0_fpov0HxNwPi1B5BdSEpnDqfWgU_xCKwSaiqALibZA8IOqlYOz9imbDWNkZmSV8pARy8d4yXq8r-UQfa53HcEMorKjJfPcj6rcEJfGV2ObHglEC_gDfnRZFIpxEo' }} style={styles.teamLogo} contentFit="cover" />
                  <View style={[styles.matchPercentage, { backgroundColor: theme.secondaryContainer + '22' }]}>
                    <ThemedText type="labelSm" style={{ color: theme.secondary, fontFamily: 'PlusJakartaSans_700Bold' }}>
                      98% Match
                    </ThemedText>
                  </View>
                </View>
                <View style={{ marginTop: Spacing.md }}>
                  <ThemedText type="headlineSm">Apex Strikers</ThemedText>
                  <View style={styles.membersRow}>
                    <Ionicons name="people-outline" size={14} color={theme.textSecondary} />
                    <ThemedText type="bodySm" style={{ color: theme.textSecondary, marginLeft: 4 }}>
                      11/15 Members
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.teamCardActions}>
                  <Pressable
                    onPress={() => handleJoinClick('apex', 'Join Team')}
                    style={[
                      styles.joinBtn,
                      joinStates['apex'] === 'Request Sent' ? { backgroundColor: theme.secondaryContainer } : { backgroundColor: theme.primary }
                    ]}
                  >
                    <ThemedText type="labelMd" style={{ color: joinStates['apex'] === 'Request Sent' ? theme.onSecondaryContainer : '#ffffff' }}>
                      {joinStates['apex']}
                    </ThemedText>
                  </Pressable>
                  <Pressable style={[styles.optionsBtn, { borderColor: theme.outlineVariant }]}>
                    <Ionicons name="ellipsis-horizontal" size={18} color={theme.textSecondary} />
                  </Pressable>
                </View>
              </View>
 
              {/* Team Card 2 */}
              <View style={[styles.teamCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
                <View style={styles.teamCardHeader}>
                  <Image source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC27_sMupG-KKQYGExlCC6jh1Hz8MMwNB4ZLyAuvVT6GMSVNR8gR63WMVahWw2zVuH69vP6Xnmtd785xVgIpPIZhNp1FgG6oal0b6r7d3LRAjFIuSLJHC1J6wRU7zwYOOUIb7eWImHSqIQtNp7E1R5vzKBpYF3Jhu8-L6wUUpfi6gj6X3lqTzcfchjKo9PEhSxok_aJgpWJ6WPMVBuVPMy9OydQS16g3vXG9xyh3sCStFOe6od9nQNVfcMdy8sQnfE_24wh8FNOjZg' }} style={styles.teamLogo} contentFit="cover" />
                  <View style={[styles.matchPercentage, { backgroundColor: theme.secondaryContainer + '22' }]}>
                    <ThemedText type="labelSm" style={{ color: theme.secondary, fontFamily: 'PlusJakartaSans_700Bold' }}>
                      92% Match
                    </ThemedText>
                  </View>
                </View>
                <View style={{ marginTop: Spacing.md }}>
                  <ThemedText type="headlineSm">Vanguard FC</ThemedText>
                  <View style={styles.membersRow}>
                    <Ionicons name="people-outline" size={14} color={theme.textSecondary} />
                    <ThemedText type="bodySm" style={{ color: theme.textSecondary, marginLeft: 4 }}>
                      8/12 Members
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.teamCardActions}>
                  <Pressable
                    onPress={() => handleJoinClick('vanguard', 'Join Team')}
                    style={[
                      styles.joinBtn,
                      joinStates['vanguard'] === 'Request Sent' ? { backgroundColor: theme.secondaryContainer } : { backgroundColor: theme.primary }
                    ]}
                  >
                    <ThemedText type="labelMd" style={{ color: joinStates['vanguard'] === 'Request Sent' ? theme.onSecondaryContainer : '#ffffff' }}>
                      {joinStates['vanguard']}
                    </ThemedText>
                  </Pressable>
                  <Pressable style={[styles.optionsBtn, { borderColor: theme.outlineVariant }]}>
                    <Ionicons name="ellipsis-horizontal" size={18} color={theme.textSecondary} />
                  </Pressable>
                </View>
              </View>

              {/* Team Card 3 (Featured Pro Recommended) */}
              <View style={[styles.teamCard, { backgroundColor: theme.secondaryContainer, borderColor: theme.secondary }]}>
                <View style={styles.teamCardHeader}>
                  <View style={[styles.boltIconContainer, { backgroundColor: theme.primary }]}>
                    <Ionicons name="flash" size={20} color="#ffffff" />
                  </View>
                  <View style={[styles.matchPercentage, { backgroundColor: theme.primary }]}>
                    <ThemedText type="labelSm" style={{ color: '#ffffff', fontFamily: 'PlusJakartaSans_700Bold' }}>
                      Pro Recommended
                    </ThemedText>
                  </View>
                </View>
                <View style={{ marginTop: Spacing.md }}>
                  <ThemedText type="headlineSm" style={{ color: theme.onSecondaryContainer }}>Volt Titans</ThemedText>
                  <View style={styles.membersRow}>
                    <Ionicons name="people-outline" size={14} color={theme.onSecondaryContainer + 'aa'} />
                    <ThemedText type="bodySm" style={{ color: theme.onSecondaryContainer, marginLeft: 4 }}>
                      14/15 Members (1 Slot!)
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.teamCardActions}>
                  <Pressable
                    onPress={() => handleJoinClick('volt', 'Apply to Join')}
                    style={[
                      styles.joinBtn,
                      { width: '100%' },
                      joinStates['volt'] === 'Request Sent' ? { backgroundColor: theme.primaryContainer } : { backgroundColor: theme.primary }
                    ]}
                  >
                    <ThemedText type="labelMd" style={{ color: '#ffffff' }}>
                      {joinStates['volt']}
                    </ThemedText>
                  </Pressable>
                </View>
              </View>

            </View>
          </View>

          {/* Nearby Players */}
          <View style={[styles.section, { paddingBottom: 100 }]}>
            <View style={styles.sectionHeader}>
              <ThemedText type="headlineSm">Nearby Players</ThemedText>
              <View style={[styles.nearbyBadge, { backgroundColor: theme.surfaceHigh }]}>
                <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Within 5 miles</ThemedText>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.playersScroll}>
              {PLAYERS.map(player => (
                <Pressable
                  key={player.id}
                  onPress={() => router.push({ pathname: '/player-profile', params: { id: player.id } })}
                  style={[styles.playerCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}
                >
                  <Image source={player.image} style={styles.playerAvatar} contentFit="cover" />
                  <ThemedText type="labelMd" style={{ marginTop: Spacing.sm, fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>
                    {player.name}
                  </ThemedText>
                  <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: 10 }}>
                    {player.role}
                  </ThemedText>
                  <Pressable
                    onPress={() => handleInviteClick(player.id)}
                    style={[
                      styles.inviteBtn,
                      { borderColor: theme.secondary },
                      inviteStates[player.id] && { backgroundColor: theme.secondaryContainer, borderColor: theme.secondaryContainer }
                    ]}
                  >
                    <ThemedText type="labelSm" style={{ color: inviteStates[player.id] ? theme.onSecondaryContainer : theme.secondary, fontFamily: 'PlusJakartaSans_700Bold' }}>
                      {inviteStates[player.id] ? 'Invited!' : 'Invite'}
                    </ThemedText>
                  </Pressable>
                </Pressable>
              ))}
            </ScrollView>
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
    paddingHorizontal: Spacing.containerMargin,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#0000000a',
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  headerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#c3c7cb',
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
    padding: 4,
    marginLeft: 4,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.containerMargin,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: Spacing.md,
  },
  rankingGrid: {
    flexDirection: 'column',
    gap: Spacing.md,
  },
  rankingCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  rankingCardDecor: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#feae2c',
    opacity: 0.15,
  },
  badgeWrapper: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  skillBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: Spacing.md,
  },
  matcherCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  matcherAvatarContainer: {
    position: 'relative',
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matcherAvatarRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelBadge: {
    position: 'absolute',
    top: -2,
    right: -4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  teamGrid: {
    gap: Spacing.md,
  },
  teamCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
  },
  teamCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamLogo: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  boltIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchPercentage: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  membersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  teamCardActions: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  joinBtn: {
    flex: 1,
    height: 40,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nearbyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  playersScroll: {
    gap: Spacing.sm,
    paddingVertical: Spacing.base,
  },
  playerCard: {
    width: 130,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  playerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  inviteBtn: {
    width: '100%',
    height: 28,
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
});
