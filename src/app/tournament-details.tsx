import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GradientContainer } from '@/components/gradient-container';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const TABS = [
  'Overview',
  'Teams',
  'Fixtures',
  'Standings',
  'Live Matches',
  'Stats',
  'Sponsors',
  'Media'
];

export default function TournamentDetailsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();

  // Selected Tab State
  const [activeTab, setActiveTab] = useState('Overview');

  // Custom Toast State
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastOpacity = useState(new Animated.Value(0))[0];

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    Animated.sequence([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.delay(1800),
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => setToastMsg(null));
  };

  const handleShare = () => {
    triggerToast('Tournament link copied to clipboard!');
  };

  // Mock Info based on params or default
  const tournamentName = (params.name as string) || 'London Cup 2026';
  const tournamentSport = (params.sport as string) || 'Football';
  const tournamentPrize = (params.prize as string) || '₹2,500';

  // Sub-renders for each tab
  const renderOverview = () => (
    <View style={styles.tabContent}>
      <ThemedText type="headlineSm" style={styles.sectionHeader}>Ground Directions</ThemedText>
      <View style={[styles.infoCard, { backgroundColor: theme.surfaceLow }]}>
        <Ionicons name="map-outline" size={20} color={theme.primary} />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <ThemedText type="bodySm" style={{ fontWeight: 'bold', color: theme.text }}>Elms Field Ground A</ThemedText>
          <ThemedText type="bodySm" style={{ color: theme.textSecondary }}>Elms Road, London SE1 (Next to Central Station)</ThemedText>
          <Pressable style={styles.directionLink} onPress={() => triggerToast('Opening Map Navigation...')}>
            <ThemedText type="labelSm" style={{ color: theme.secondaryContainer }}>GET DIRECTIONS</ThemedText>
            <Ionicons name="chevron-forward" size={12} color={theme.secondaryContainer} />
          </Pressable>
        </View>
      </View>

      <ThemedText type="headlineSm" style={[styles.sectionHeader, { marginTop: Spacing.lg }]}>Tournament Rules</ThemedText>
      <View style={[styles.rulesList, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
        {[
          'Teams must report 15 mins before kick-off.',
          'Standard FIFA rules apply for 11v11 matches.',
          'Match length is 90 mins (45 mins each half).',
          'A maximum of 5 substitutions are allowed per game.',
          'Shin guards are mandatory for all players.',
          'Organizer decisions are final and binding.'
        ].map((rule, idx) => (
          <View key={idx} style={styles.ruleItem}>
            <Ionicons name="checkmark-circle" size={16} color={theme.secondaryContainer} style={{ marginRight: 8, marginTop: 2 }} />
            <ThemedText type="bodySm" style={{ color: theme.text, flex: 1 }}>{rule}</ThemedText>
          </View>
        ))}
      </View>

      <ThemedText type="headlineSm" style={[styles.sectionHeader, { marginTop: Spacing.lg }]}>Organizer Contacts</ThemedText>
      <View style={[styles.infoCard, { backgroundColor: theme.surfaceLow }]}>
        <Ionicons name="call-outline" size={20} color={theme.primary} />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <ThemedText type="bodySm" style={{ fontWeight: 'bold', color: theme.text }}>Apex Sports Club</ThemedText>
          <ThemedText type="bodySm" style={{ color: theme.textSecondary }}>Phone: +44 20 7946 0958</ThemedText>
          <ThemedText type="bodySm" style={{ color: theme.textSecondary }}>Email: admin@apexsports.com</ThemedText>
        </View>
      </View>
    </View>
  );

  const renderTeams = () => (
    <View style={styles.tabContent}>
      <View style={styles.rowBetween}>
        <ThemedText type="headlineSm" style={styles.sectionHeader}>Registered Teams (12)</ThemedText>
        <Pressable 
          style={[styles.manageBtn, { borderColor: theme.outlineVariant }]}
          onPress={() => router.push('/team-management')}
        >
          <ThemedText type="labelSm" style={{ color: theme.text }}>Manage Teams</ThemedText>
        </Pressable>
      </View>
      <View style={styles.teamsGrid}>
        {[
          { name: 'Red Devils FC', logo: '⚽', matches: 3, manager: 'John Doe' },
          { name: 'Apex Warriors', logo: '🏆', matches: 3, manager: 'Alex Smith' },
          { name: 'Blue Tigers', logo: '🐯', matches: 3, manager: 'Marcus Vance' },
          { name: 'Strikers City', logo: '⚡', matches: 3, manager: 'Leo Carter' },
          { name: 'London United', logo: '🦁', matches: 3, manager: 'Rob Miller' },
          { name: 'Titans CC', logo: '🛡️', matches: 3, manager: 'Sam Wilson' },
        ].map((team, idx) => (
          <View key={idx} style={[styles.teamCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
            <ThemedText style={styles.teamLogo}>{team.logo}</ThemedText>
            <ThemedText type="bodySm" style={{ fontWeight: 'bold', marginTop: 8, color: theme.text }} numberOfLines={1}>
              {team.name}
            </ThemedText>
            <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: 10, marginTop: 2 }}>
              Manager: {team.manager}
            </ThemedText>
          </View>
        ))}
      </View>
    </View>
  );

  const renderFixtures = () => (
    <View style={styles.tabContent}>
      <View style={styles.rowBetween}>
        <ThemedText type="headlineSm" style={styles.sectionHeader}>Upcoming Fixtures</ThemedText>
        <Pressable 
          style={[styles.manageBtn, { backgroundColor: theme.primary }]}
          onPress={() => router.push('/fixture-management')}
        >
          <ThemedText type="labelSm" style={{ color: '#ffffff' }}>Open Fixtures Planner</ThemedText>
        </Pressable>
      </View>
      <View style={styles.fixturesList}>
        {[
          { match: 'Match 1', teamA: 'Red Devils FC', teamB: 'Blue Tigers', time: '10:00 AM', pitch: 'Pitch A', date: 'June 15' },
          { match: 'Match 2', teamA: 'Apex Warriors', teamB: 'Strikers City', time: '12:30 PM', pitch: 'Pitch B', date: 'June 15' },
          { match: 'Match 3', teamA: 'London United', teamB: 'Titans CC', time: '03:00 PM', pitch: 'Pitch A', date: 'June 15' },
        ].map((fix, idx) => (
          <View key={idx} style={[styles.fixtureCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
            <View style={styles.rowBetween}>
              <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontWeight: 'bold' }}>{fix.match} • {fix.date}</ThemedText>
              <ThemedText type="labelSm" style={{ color: theme.secondaryContainer }}>{fix.time}</ThemedText>
            </View>
            <View style={styles.matchTeamsRow}>
              <ThemedText type="bodySm" style={[styles.fixtureTeamName, { color: theme.text }]}>{fix.teamA}</ThemedText>
              <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginHorizontal: 10 }}>VS</ThemedText>
              <ThemedText type="bodySm" style={[styles.fixtureTeamName, { color: theme.text, textAlign: 'right' }]}>{fix.teamB}</ThemedText>
            </View>
            <View style={[styles.fixtureCardFooter, { borderTopColor: theme.outlineVariant + '22' }]}>
              <Ionicons name="location-outline" size={12} color={theme.textSecondary} />
              <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginLeft: 4 }}>{fix.pitch}</ThemedText>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderStandings = () => (
    <View style={styles.tabContent}>
      <ThemedText type="headlineSm" style={styles.sectionHeader}>Group A Point Table</ThemedText>
      <View style={[styles.tableContainer, { borderColor: theme.outlineVariant + '33' }]}>
        {/* Table Header */}
        <View style={[styles.tableRow, styles.tableHeaderRow, { backgroundColor: theme.surfaceLow }]}>
          <ThemedText type="labelSm" style={[styles.colName, { fontWeight: 'bold', color: theme.text }]}>TEAM</ThemedText>
          <ThemedText type="labelSm" style={[styles.colVal, { fontWeight: 'bold', color: theme.text }]}>P</ThemedText>
          <ThemedText type="labelSm" style={[styles.colVal, { fontWeight: 'bold', color: theme.text }]}>W</ThemedText>
          <ThemedText type="labelSm" style={[styles.colVal, { fontWeight: 'bold', color: theme.text }]}>L</ThemedText>
          <ThemedText type="labelSm" style={[styles.colVal, { fontWeight: 'bold', color: theme.text }]}>PTS</ThemedText>
          <ThemedText type="labelSm" style={[styles.colVal, { fontWeight: 'bold', color: theme.text, width: 50 }]}>NRR</ThemedText>
        </View>
        {/* Table Rows */}
        {[
          { name: 'Red Devils FC', p: 3, w: 3, l: 0, pts: 9, nrr: '+1.45' },
          { name: 'Apex Warriors', p: 3, w: 2, l: 1, pts: 6, nrr: '+0.88' },
          { name: 'Blue Tigers', p: 3, w: 1, l: 2, pts: 3, nrr: '-0.32' },
          { name: 'Strikers City', p: 3, w: 0, l: 3, pts: 0, nrr: '-1.89' },
        ].map((row, idx) => (
          <View key={idx} style={[styles.tableRow, { borderBottomColor: theme.outlineVariant + '22' }]}>
            <ThemedText type="bodySm" numberOfLines={1} style={[styles.colName, { color: theme.text, fontWeight: '500' }]}>{row.name}</ThemedText>
            <ThemedText type="bodySm" style={[styles.colVal, { color: theme.text }]}>{row.p}</ThemedText>
            <ThemedText type="bodySm" style={[styles.colVal, { color: theme.text }]}>{row.w}</ThemedText>
            <ThemedText type="bodySm" style={[styles.colVal, { color: theme.text }]}>{row.l}</ThemedText>
            <ThemedText type="bodySm" style={[styles.colVal, { color: theme.text, fontWeight: 'bold' }]}>{row.pts}</ThemedText>
            <ThemedText type="bodySm" style={[styles.colVal, { color: row.nrr.startsWith('+') ? '#0f9f58' : '#ba1a1a', width: 50 }]}>{row.nrr}</ThemedText>
          </View>
        ))}
      </View>
    </View>
  );

  const renderLiveMatches = () => (
    <View style={styles.tabContent}>
      <ThemedText type="headlineSm" style={styles.sectionHeader}>Active Match</ThemedText>
      
      {/* Dynamic format selection score card */}
      {tournamentSport === 'Cricket' ? (
        // Cricket Scoring Layout
        <View style={[styles.liveScoreCard, { backgroundColor: theme.primaryContainer }]}>
          <View style={styles.rowBetween}>
            <ThemedText type="labelSm" style={{ color: theme.onPrimaryContainer }}>Pitch A • London</ThemedText>
            <View style={styles.liveBadgeCompact}>
              <View style={styles.liveDotRed} />
              <ThemedText style={styles.liveText}>Live Cricket</ThemedText>
            </View>
          </View>

          <View style={styles.cricketScores}>
            <View style={{ flex: 1 }}>
              <ThemedText type="bodyLg" style={{ color: '#ffffff', fontWeight: 'bold' }}>Apex Warriors</ThemedText>
              <ThemedText type="displayLgMobile" style={{ color: '#ffffff', marginVertical: 4 }}>164/4</ThemedText>
              <ThemedText type="labelSm" style={{ color: theme.onPrimaryContainer }}>Overs: 17.4</ThemedText>
            </View>
            <View style={styles.versusDivider} />
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <ThemedText type="bodyLg" style={{ color: '#ffffff', fontWeight: 'bold' }}>Titans CC</ThemedText>
              <ThemedText type="bodySm" style={{ color: theme.onPrimaryContainer, marginTop: 8 }}>Yet to Bat</ThemedText>
            </View>
          </View>

          <View style={[styles.liveFooterStats, { borderTopColor: '#ffffff1a' }]}>
            <View style={{ flex: 1 }}>
              <ThemedText type="labelSm" style={{ color: theme.onPrimaryContainer }}>Batsmen</ThemedText>
              <ThemedText type="bodySm" style={{ color: '#ffffff' }}>M. Vance: 45* (28)</ThemedText>
              <ThemedText type="bodySm" style={{ color: '#ffffff' }}>S. Wilson: 18 (14)</ThemedText>
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <ThemedText type="labelSm" style={{ color: theme.onPrimaryContainer }}>Bowler</ThemedText>
              <ThemedText type="bodySm" style={{ color: '#ffffff' }}>J. Carter: 2/32 (3.4)</ThemedText>
            </View>
          </View>
        </View>
      ) : (
        // Football Scoring Layout
        <View style={[styles.liveScoreCard, { backgroundColor: theme.primaryContainer }]}>
          <View style={styles.rowBetween}>
            <ThemedText type="labelSm" style={{ color: theme.onPrimaryContainer }}>{"85' Second Half"}</ThemedText>
            <View style={styles.liveBadgeCompact}>
              <View style={styles.liveDotRed} />
              <ThemedText style={styles.liveText}>Live Football</ThemedText>
            </View>
          </View>

          <View style={styles.footballScores}>
            <View style={styles.footballScoreTeam}>
              <ThemedText style={{ fontSize: 24 }}>⚽</ThemedText>
              <ThemedText type="headlineSm" style={{ color: '#ffffff', marginTop: 4 }}>Red Devils</ThemedText>
            </View>
            <View style={styles.scoreNumberContainer}>
              <ThemedText type="displayLg" style={{ color: '#ffffff' }}>2</ThemedText>
              <ThemedText type="headlineSm" style={{ color: '#ffffff', marginHorizontal: 8 }}>-</ThemedText>
              <ThemedText type="displayLg" style={{ color: '#ffffff' }}>1</ThemedText>
            </View>
            <View style={[styles.footballScoreTeam, { alignItems: 'flex-end' }]}>
              <ThemedText style={{ fontSize: 24 }}>🦁</ThemedText>
              <ThemedText type="headlineSm" style={{ color: '#ffffff', marginTop: 4, textAlign: 'right' }}>London Utd</ThemedText>
            </View>
          </View>

          <View style={[styles.liveFooterStats, { borderTopColor: '#ffffff1a' }]}>
            <ThemedText type="labelSm" style={{ color: theme.onPrimaryContainer, width: '100%', textAlign: 'center', marginBottom: 4 }}>Goals Timeline</ThemedText>
            <ThemedText type="bodySm" style={{ color: '#ffffff', width: '100%', textAlign: 'center' }}>
              {"Red Devils: M. Rashford (24'), Bruno (56')  •  London Utd: H. Kane (72')"}
            </ThemedText>
          </View>
        </View>
      )}
    </View>
  );

  const renderStats = () => (
    <View style={styles.tabContent}>
      <ThemedText type="headlineSm" style={styles.sectionHeader}>Top Players (MVP Rankings)</ThemedText>
      <View style={styles.statsList}>
        {[
          { rank: 1, name: 'Marcus Rashford', team: 'Red Devils FC', value: '8 Goals', rating: '9.2' },
          { rank: 2, name: 'Harry Kane', team: 'London United', value: '6 Goals', rating: '8.7' },
          { rank: 3, name: 'Bruno Fernandes', team: 'Red Devils FC', value: '4 Assists', rating: '8.5' },
          { rank: 4, name: 'Alex Smith', team: 'Apex Warriors', value: '3 Goals', rating: '8.1' },
        ].map((p, idx) => (
          <View key={idx} style={[styles.statRowCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
            <View style={[styles.rankBadge, { backgroundColor: theme.surfaceLow }]}>
              <ThemedText type="labelSm" style={{ color: theme.text, fontWeight: 'bold' }}>#{p.rank}</ThemedText>
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <ThemedText type="bodySm" style={{ fontWeight: 'bold', color: theme.text }}>{p.name}</ThemedText>
              <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: 10 }}>{p.team}</ThemedText>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <ThemedText type="bodySm" style={{ fontWeight: 'bold', color: theme.secondaryContainer }}>{p.value}</ThemedText>
              <ThemedText type="labelSm" style={{ color: '#0f9f58', fontSize: 10 }}>Rating: {p.rating}</ThemedText>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderSponsors = () => (
    <View style={styles.tabContent}>
      <ThemedText type="headlineSm" style={styles.sectionHeader}>Event Sponsors</ThemedText>
      <View style={styles.sponsorsGrid}>
        {[
          { name: 'Nike Football', type: 'Title Sponsor', logo: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=150&q=80' },
          { name: 'Gatorade UK', type: 'Energy Partner', logo: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=150&q=80' },
          { name: 'Apex Sports', type: 'Ground Sponsor', logo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=150&q=80' },
          { name: 'PlayStation', type: 'Gaming Partner', logo: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=150&q=80' },
        ].map((sp, idx) => (
          <View key={idx} style={[styles.sponsorCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
            <Image source={sp.logo} style={styles.sponsorLogo} contentFit="contain" />
            <ThemedText type="bodySm" style={{ fontWeight: 'bold', marginTop: 8, color: theme.text, textAlign: 'center' }}>
              {sp.name}
            </ThemedText>
            <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: 10, textAlign: 'center' }}>
              {sp.type}
            </ThemedText>
          </View>
        ))}
      </View>
    </View>
  );

  const renderMedia = () => (
    <View style={styles.tabContent}>
      <ThemedText type="headlineSm" style={styles.sectionHeader}>Highlights & Photos</ThemedText>
      <View style={styles.mediaGrid}>
        {[
          'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=300&q=80',
          'https://images.unsplash.com/photo-1531415080290-bc98545ab3ef?auto=format&fit=crop&w=300&q=80',
          'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=300&q=80',
          'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=300&q=80',
        ].map((url, idx) => (
          <Pressable key={idx} style={styles.mediaFrame} onPress={() => triggerToast('Opening full-screen photo...')}>
            <Image source={url} style={styles.mediaImage} contentFit="cover" />
            <View style={styles.playOverlay}>
              <Ionicons name="camera" size={24} color="#ffffff" />
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'Overview': return renderOverview();
      case 'Teams': return renderTeams();
      case 'Fixtures': return renderFixtures();
      case 'Standings': return renderStandings();
      case 'Live Matches': return renderLiveMatches();
      case 'Stats': return renderStats();
      case 'Sponsors': return renderSponsors();
      case 'Media': return renderMedia();
      default: return null;
    }
  };

  return (
    <GradientContainer screenName="tournament-details" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Detail Header Navigation */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </Pressable>
          <ThemedText type="headlineMd" numberOfLines={1} style={{ color: theme.text, flex: 1, marginLeft: 12 }}>
            {tournamentName}
          </ThemedText>
          <Pressable style={styles.iconBtn} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={20} color={theme.text} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Banner with Registration Countdown */}
          <View style={styles.bannerContainer}>
            <Image 
              source="https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80" 
              style={styles.bannerImage} 
              contentFit="cover" 
            />
            <View style={styles.gradientOverlay} />
            <View style={styles.countdownBadge}>
              <Ionicons name="hourglass-outline" size={14} color="#ffffff" style={{ marginRight: 6 }} />
              <ThemedText type="labelSm" style={{ color: '#ffffff', fontWeight: 'bold' }}>
                Reg Ends In: 02d : 14h : 45m
              </ThemedText>
            </View>
          </View>

          {/* Quick Metrics Statistics Grid */}
          <View style={styles.metricsGrid}>
            <View style={[styles.metricCard, { backgroundColor: theme.surfaceLow }]}>
              <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Teams</ThemedText>
              <ThemedText type="headlineMd" style={{ color: theme.text }}>12/16</ThemedText>
            </View>
            <View style={[styles.metricCard, { backgroundColor: theme.surfaceLow }]}>
              <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Prize</ThemedText>
              <ThemedText type="headlineMd" style={{ color: theme.secondaryContainer }}>{tournamentPrize}</ThemedText>
            </View>
            <View style={[styles.metricCard, { backgroundColor: theme.surfaceLow }]}>
              <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Matches</ThemedText>
              <ThemedText type="headlineMd" style={{ color: theme.text }}>32</ThemedText>
            </View>
          </View>

          {/* Segmented Horizontal Tab Bar */}
          <View style={styles.tabsSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
              {TABS.map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <Pressable
                     key={tab}
                     onPress={() => setActiveTab(tab)}
                     style={[
                       styles.tabPill,
                       isActive && { backgroundColor: theme.primary }
                     ]}
                  >
                    <ThemedText
                      type="labelSm"
                      style={{
                        color: isActive ? '#ffffff' : theme.textSecondary,
                        fontWeight: isActive ? '700' : '500',
                      }}
                    >
                      {tab}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Tab Sub-View Render */}
          {renderActiveTabContent()}
        </ScrollView>

        {/* Floating Call to Action Register Button */}
        <View style={[styles.ctaFooter, { backgroundColor: theme.surfaceLowest, borderTopColor: theme.outlineVariant + '33' }]}>
          <Pressable 
            style={[styles.registerCtaBtn, { backgroundColor: theme.secondaryContainer }]}
            onPress={() => router.push({
              pathname: '/team-registration',
              params: { id: params.id || 't1', name: tournamentName }
            })}
          >
            <Ionicons name="medal" size={20} color="#6b4500" style={{ marginRight: 8 }} />
            <ThemedText type="labelMd" style={{ color: '#6b4500', fontWeight: 'bold' }}>Register Team Now</ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Floating Toast Notification */}
      {toastMsg && (
        <Animated.View style={[styles.toastContainer, { opacity: toastOpacity, backgroundColor: theme.primaryContainer }]}>
          <ThemedText type="labelSm" style={{ color: '#ffffff' }}>{toastMsg}</ThemedText>
        </Animated.View>
      )}
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
    paddingHorizontal: Spacing.containerMargin,
    paddingVertical: Spacing.md,
    zIndex: 10,
  },
  backBtn: {
    padding: 4,
  },
  iconBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  bannerContainer: {
    height: 180,
    width: '100%',
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(5, 21, 30, 0.4)',
  },
  countdownBadge: {
    position: 'absolute',
    bottom: 12,
    left: Spacing.containerMargin,
    backgroundColor: 'rgba(186, 26, 26, 0.85)', // Vibrant error-like red
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.containerMargin,
    marginTop: Spacing.md,
    gap: 8,
  },
  metricCard: {
    flex: 1,
    padding: 12,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
  },
  tabsSection: {
    marginTop: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#0000000a',
    paddingBottom: 8,
  },
  tabsScroll: {
    paddingHorizontal: Spacing.containerMargin,
    gap: 6,
  },
  tabPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  tabContent: {
    paddingHorizontal: Spacing.containerMargin,
    paddingTop: Spacing.md,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
  },
  directionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  rulesList: {
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  manageBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  teamsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: Spacing.sm,
  },
  teamCard: {
    width: '48%',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
  },
  teamLogo: {
    fontSize: 32,
  },
  fixturesList: {
    gap: 12,
    marginTop: Spacing.sm,
  },
  fixtureCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
  },
  matchTeamsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
  },
  fixtureTeamName: {
    flex: 1,
    fontWeight: 'bold',
  },
  fixtureCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: Spacing.xs,
  },
  tableContainer: {
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginTop: Spacing.sm,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  tableHeaderRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#0000000a',
  },
  colName: {
    flex: 2,
  },
  colVal: {
    width: 35,
    textAlign: 'center',
  },
  liveScoreCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  liveBadgeCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveDotRed: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ff1744',
  },
  liveText: {
    color: '#ff1744',
    fontSize: 10,
    fontFamily: 'HankenGrotesk_700Bold',
  },
  cricketScores: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  versusDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#ffffff33',
    marginHorizontal: 16,
  },
  liveFooterStats: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 8,
  },
  footballScores: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  footballScoreTeam: {
    flex: 1,
  },
  scoreNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
  },
  statsList: {
    gap: 10,
    marginTop: Spacing.sm,
  },
  statRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sponsorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: Spacing.sm,
  },
  sponsorCard: {
    width: '48%',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
  },
  sponsorLogo: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.lg,
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: Spacing.sm,
  },
  mediaFrame: {
    width: '48%',
    height: 100,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(5, 21, 30, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.containerMargin,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
  },
  registerCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
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
  },
});
