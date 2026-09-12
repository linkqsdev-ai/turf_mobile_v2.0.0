// Live scoring screen - Own Board with real persistent history + player profile pics
import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed-text';
import { GradientContainer } from '@/components/gradient-container';
import { BorderRadius, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  loadOwnBoardData,
  aggregateBatsmen,
  aggregateBowlers,
  getPlayerMatchHistory,
  INITIAL_SAMPLE_MATCHES,
  type PlayerMatchHistoryItem,
  type CompletedMatchRecord,
  type AggregatedBatsmanStat,
  type AggregatedBowlerStat,
} from '@/store/own-board-store';
import { exportScoreSheetPDF } from '@/services/score-sheet-pdf';
import { PlayerStatCard, MatchResultCard, StatTileRow } from '@/components/scoring/own-board-cards';
import {
  OwnBoardSheetHeader,
  OwnBoardSectionLabel,
  OwnBoardTabs,
  InningsTabs,
  ScoreTable,
  PlayerProfileCard,
  MatchLogCard,
} from '@/components/scoring/own-board-detail';
import {
  batsmanCard,
  bowlerCard,
  matchCard,
  battingSummary,
  bowlingSummary,
  matchesSummary,
  inningsBattingSummary,
  inningsBowlingSummary,
  battingRows,
  bowlingRows,
  playerCareerSummary,
  matchLogCard,
  formatPlayedDateTime,
  BATTING_COLUMNS,
  BOWLING_COLUMNS,
  ACCENTS,
} from '@/utils/own-board-display';
import { OwnBoardAnalyticsCard } from '@/components/scoring/own-board-analytics';

import CricketScoring from '@/components/scoring/cricket-scoring';
import FootballScoring from '@/components/scoring/football-scoring';
import BasketballScoring from '@/components/scoring/basketball-scoring';
import TennisScoring from '@/components/scoring/tennis-scoring';
import BadmintonScoring from '@/components/scoring/badminton-scoring';
import VolleyballScoring from '@/components/scoring/volleyball-scoring';
import { SPORTS_LIST } from '@/constants/sports';
import { MaterialIcons } from '@expo/vector-icons';

// ─── App Brand Colors (2 only: Primary + White) ───────────────────────────────
const P = '#5D68E8';       // App primary blue-purple
const PD = '#4552C4';      // Primary dark
const PL = '#EAEAFF';      // Primary light tint
const W = '#FFFFFF';
const BG = '#FDFCF7';

// ─── Local Player Profile Pictures (from assets) ──────────────────────────────
const LOCAL_PROFILE_PICS = [
  require('@/assets/images/avatars/avatar_1.png'),
  require('@/assets/images/avatars/avatar_2.png'),
  require('@/assets/images/avatars/avatar_3.png'),
  require('@/assets/images/avatars/avatar_4.png'),
  require('@/assets/images/avatars/avatar_5.png'),
  require('@/assets/images/avatars/avatar_6.png'),
  require('@/assets/images/avatars/avatar_7.png'),
  require('@/assets/images/avatars/avatar_8.png'),
  require('@/assets/images/avatars/avatar_9.png'),
  require('@/assets/images/avatars/avatar_10.png'),
  require('@/assets/images/avatars/avatar_11.png'),
  require('@/assets/images/avatars/avatar_12.png'),
  require('@/assets/images/avatars/avatar_13.png'),
  require('@/assets/images/avatars/avatar_14.png'),
  require('@/assets/images/avatars/avatar_15.png'),
  require('@/assets/images/avatars/avatar_16.png'),
  require('@/assets/images/avatars/avatar_17.png'),
  require('@/assets/images/avatars/avatar_18.png'),
  require('@/assets/images/avatars/avatar_19.png'),
  require('@/assets/images/avatars/avatar_20.png'),
];

// Specific known player image overrides
const PLAYER_AVATAR_MAP: Record<string, any> = {
  praveen: require('@/assets/images/avatars/avatar_1.png'),
  antony: require('@/assets/images/avatars/avatar_2.png'),
  kavin: require('@/assets/images/avatars/avatar_3.png'),
  sri: require('@/assets/images/avatars/avatar_4.png'),
  siva: require('@/assets/images/avatars/avatar_5.png'),
  dinesh: require('@/assets/images/avatars/avatar_6.png'),
  azar: require('@/assets/images/avatars/avatar_7.png'),
  yogi: require('@/assets/images/avatars/avatar_8.png'),
};

function getPlayerAvatar(name: string, explicitUrl?: string) {
  if (explicitUrl) {
    return typeof explicitUrl === 'string' ? { uri: explicitUrl } : explicitUrl;
  }
  const clean = (name || '').toLowerCase().trim();
  if (PLAYER_AVATAR_MAP[clean]) {
    return PLAYER_AVATAR_MAP[clean];
  }
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % LOCAL_PROFILE_PICS.length;
  return LOCAL_PROFILE_PICS[index];
}

// ─── Player avatar with real profile pic ──────────────────────────────────────
function PlayerPic({ name, avatarUrl, rank, size = 48 }: {
  name: string; avatarUrl?: string; rank?: number; size?: number;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const imageSource = (!imgFailed && avatarUrl)
    ? (typeof avatarUrl === 'string' ? { uri: avatarUrl } : avatarUrl)
    : getPlayerAvatar(name);
  const isTop1 = rank === 1;

  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      <Image
        source={imageSource}
        style={{
          width: size, height: size, borderRadius: size / 2,
          borderWidth: isTop1 ? 2.5 : 1.5,
          borderColor: isTop1 ? P : PL,
          backgroundColor: PL,
        }}
        contentFit="cover"
        onError={() => { if (!imgFailed) setImgFailed(true); }}
      />
    </View>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'batsmen' as const, emoji: '🏏', label: 'Batsmen' },
  { key: 'bowlers' as const, emoji: '⚾', label: 'Bowlers' },
  { key: 'matches' as const, emoji: '📋', label: 'Matches' },
];

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ label }: { label: string }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 40, gap: 10 }}>
      <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: PL, justifyContent: 'center', alignItems: 'center' }}>
        <ThemedText style={{ fontSize: 22 }}>🏏</ThemedText>
      </View>
      <ThemedText style={{ fontSize: 14, fontFamily: 'Sora_500Medium', color: PD, textAlign: 'center' }}>
        No {label} Yet
      </ThemedText>
      <ThemedText style={{ fontSize: 12, color: P + '80', fontFamily: 'Sora_500Medium', textAlign: 'center', paddingHorizontal: 20 }}>
        Complete a match to see your overall career stats here
      </ThemedText>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function LiveScoringScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    matchId: string; sport: string; teamA?: string; teamB?: string;
    totalOvers?: string; autoWide?: string; autoNoBall?: string; allowByes?: string;
    /** JSON map of lowercased team name -> selected Playing XI. */
    lineup?: string;
    /** JSON array of unassigned / pool players chosen pre-match. */
    pool?: string;
    tossWinner?: string;
    decision?: string;
    status?: string;
    innings1?: string;
    innings2?: string;
    motmName?: string;
    winner?: string;
    winMargin?: string;
  }>();

  const rawSport = Array.isArray(params.sport) ? params.sport[0] : params.sport;
  const paramSport = rawSport || 'cricket';
  const initialSport = paramSport.charAt(0).toUpperCase() + paramSport.slice(1).toLowerCase();
  const [selectedSport, setSelectedSport] = useState<string>(initialSport);

  useEffect(() => {
    if (params.sport) {
      const sp = Array.isArray(params.sport) ? params.sport[0] : params.sport;
      setSelectedSport(sp.charAt(0).toUpperCase() + sp.slice(1).toLowerCase());
    }
  }, [params.sport]);

  const [showOwnBoard, setShowOwnBoard] = useState(false);
  const [tab, setTab] = useState<'batsmen' | 'bowlers' | 'matches'>('batsmen');
  const [loading, setLoading] = useState(false);
  const [selectedDetailMatch, setSelectedDetailMatch] = useState<CompletedMatchRecord | null>(null);
  const [selectedPlayerName, setSelectedPlayerName] = useState<string | null>(null);
  const [detailInningsTab, setDetailInningsTab] = useState<1 | 2>(1);

  const [batsmen, setBatsmen] = useState<AggregatedBatsmanStat[]>(() => aggregateBatsmen(INITIAL_SAMPLE_MATCHES));
  const [bowlers, setBowlers] = useState<AggregatedBowlerStat[]>(() => aggregateBowlers(INITIAL_SAMPLE_MATCHES));
  const [history, setHistory] = useState<CompletedMatchRecord[]>(() => INITIAL_SAMPLE_MATCHES);

  // Load Own Board data whenever the modal opens
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await loadOwnBoardData();
      setBatsmen(aggregateBatsmen(data.matches));
      setBowlers(aggregateBowlers(data.matches));
      setHistory(data.matches);
    } catch (_) { }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (showOwnBoard) loadData();
  }, [showOwnBoard]);

  const handleExportPDF = async (match: CompletedMatchRecord) => {
    try {
      const inn1OvsParts = (match.innings1.overs || '0.0').toString().split('.');
      const inn1Ovs = parseInt(inn1OvsParts[0] || '0', 10);
      const inn1Balls = parseInt(inn1OvsParts[1] || '0', 10);
      const inn1ScoreParts = (match.innings1.score || '0/0').toString().split('/');
      const inn1Runs = parseInt(inn1ScoreParts[0] || '0', 10);
      const inn1Wkts = parseInt(inn1ScoreParts[1] || '0', 10);

      const inn2OvsParts = (match.innings2?.overs || '0.0').toString().split('.');
      const inn2Ovs = parseInt(inn2OvsParts[0] || '0', 10);
      const inn2Balls = parseInt(inn2OvsParts[1] || '0', 10);
      const inn2ScoreParts = (match.innings2?.score || '0/0').toString().split('/');
      const inn2Runs = parseInt(inn2ScoreParts[0] || '0', 10);
      const inn2Wkts = parseInt(inn2ScoreParts[1] || '0', 10);

      await exportScoreSheetPDF({
        matchId: match.id || `MTH-101`,
        sport: 'Cricket Match',
        venueName: 'Emerald Green Arena Pitch 1',
        venueAddress: 'Trichy Bypass Road, Tiruchirappalli',
        contactNumber: '+91 98765 43210',
        date: new Date(match.completedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: new Date(match.completedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        innings1: {
          teamName: match.innings1.team,
          score: inn1Runs,
          wickets: inn1Wkts,
          overs: inn1Ovs,
          balls: inn1Balls,
          runRate: parseFloat((inn1Runs / (inn1Ovs + inn1Balls / 6 || 1)).toFixed(2)),
          batsmen: (match.innings1.batsmen && match.innings1.batsmen.length > 0)
            ? match.innings1.batsmen
            : [
              { name: match.motmName, runs: 64, balls: 22, fours: 6, sixes: 4, status: 'not out' },
              { name: 'Antony', runs: 32, balls: 14, fours: 3, sixes: 1, status: 'c & b' },
              { name: 'Kavin', runs: 18, balls: 9, fours: 2, sixes: 1, status: 'not out' },
            ],
          bowlers: (match.innings1.bowlers && match.innings1.bowlers.length > 0)
            ? match.innings1.bowlers
            : [
              { name: 'Sri Bowler', overs: 2.0, maidens: 0, runs: 18, wickets: 2 },
              { name: 'Siva Bowler', overs: 2.0, maidens: 0, runs: 24, wickets: 1 },
            ],
        },
        innings2: match.innings2 ? {
          teamName: match.innings2.team,
          score: inn2Runs,
          wickets: inn2Wkts,
          overs: inn2Ovs,
          balls: inn2Balls,
          runRate: parseFloat((inn2Runs / (inn2Ovs + inn2Balls / 6 || 1)).toFixed(2)),
          batsmen: match.innings2.batsmen || [],
          bowlers: match.innings2.bowlers || [],
        } : undefined,
        winner: match.winner,
        winMargin: match.winMargin,
        motmName: match.motmName,
        motmStat: match.motmStat,
        tossWinner: match.innings1.team,
        tossDecision: 'Bat',
      });
    } catch (e: any) {
      Alert.alert('Export Error', e.message || 'Could not export score sheet');
    }
  };

  const renderScoringConsole = () => {
    switch (selectedSport.toLowerCase()) {
      case 'football': return <FootballScoring teamA={params.teamA} teamB={params.teamB} />;
      case 'basketball': return <BasketballScoring teamA={params.teamA} teamB={params.teamB} />;
      case 'tennis': return <TennisScoring teamA={params.teamA} teamB={params.teamB} />;
      case 'badminton': return <BadmintonScoring teamA={params.teamA} teamB={params.teamB} />;
      case 'volleyball': return <VolleyballScoring teamA={params.teamA} teamB={params.teamB} />;
      default:
        return (
          <CricketScoring
            matchId={params.matchId}
            teamA={params.teamA}
            teamB={params.teamB}
            tossWinner={params.tossWinner}
            decision={params.decision}
            totalOvers={params.totalOvers}
            autoWide={params.autoWide}
            autoNoBall={params.autoNoBall}
            allowByes={params.allowByes}
            lineup={params.lineup}
            pool={params.pool}
            status={params.status}
            innings1={params.innings1}
            innings2={params.innings2}
            motmName={params.motmName}
            winner={params.winner}
            winMargin={params.winMargin}
          />
        );
    }
  };

  return (
    <GradientContainer screenName="scoring" style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>

        {/* ── TopBar ─────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/matches')} style={{ padding: 6 }}>
              <Ionicons name="arrow-back" size={20} color={theme.text} />
            </Pressable>
            <ThemedText style={{ fontSize: 14.5, fontFamily: 'Sora_500Medium', marginLeft: 6, color: theme.text }}>
              Scoreboard
            </ThemedText>
          </View>
          <Pressable
            onPress={() => setShowOwnBoard(true)}
            style={({ pressed }) => [styles.ownBoardBtn, pressed && { opacity: 0.8 }]}
          >
            <MaterialCommunityIcons name="clipboard-list-outline" size={15} color={W} />
            <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_500Medium', color: W }}>
              Own Board
            </ThemedText>
          </Pressable>
        </View>

        {/* ── Sports switcher ─────────────────────────────── */}
        <View style={{ paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: theme.outlineVariant + '22' }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Spacing.containerMargin, gap: Spacing.xs }}>
            {SPORTS_LIST.map((sport) => {
              const isActive = sport.name === selectedSport;
              const isDisabled = sport.name !== 'Cricket';
              return (
                <Pressable
                  key={sport.name}
                  onPress={() => {
                    if (isDisabled) { Alert.alert('Cricket Only Mode', `${sport.name} scoring will be available soon.`); return; }
                    setSelectedSport(sport.name);
                  }}
                  style={[
                    styles.chip,
                    { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '44' },
                    isActive && { backgroundColor: P, borderColor: P },
                    isDisabled && { opacity: 0.4 },
                  ]}
                >
                  <MaterialIcons name={sport.icon as any} size={13} color={isActive ? W : theme.textSecondary} style={{ marginRight: 3 }} />
                  <ThemedText style={{ color: isActive ? W : theme.textSecondary, fontFamily: 'Sora_500Medium', fontSize: 11 }}>
                    {sport.name}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={{ flex: 1 }}>{renderScoringConsole()}</View>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* OWN BOARD — Real Historical Stats                                  */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <Modal visible={showOwnBoard} transparent animationType="slide" onRequestClose={() => setShowOwnBoard(false)}>
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(13,29,38,0.55)' }}>
            <View style={{ backgroundColor: theme.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92%', overflow: 'hidden' }}>

              <OwnBoardSheetHeader
                title="Own Board"
                subtitle="Overall career stats"
                tag={`📋 ${history.length} ${history.length === 1 ? 'match' : 'matches'}`}
                icon="clipboard-outline"
                onClose={() => setShowOwnBoard(false)}
              />

              {/* Batsmen / Bowlers / Matches — each tab takes its chart's accent */}
              <OwnBoardTabs
                options={TABS.map((t) => ({
                  key: t.key,
                  label: t.label,
                  emoji: t.emoji,
                  accent: t.key === 'batsmen' ? ACCENTS.green : t.key === 'bowlers' ? ACCENTS.orange : ACCENTS.primary,
                }))}
                active={tab}
                onChange={setTab}
              />

              {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 }}>
                  <ActivityIndicator size="large" color={P} />
                  <ThemedText style={{ marginTop: 12, color: P, fontFamily: 'Sora_500Medium', fontSize: 13 }}>
                    Loading stats…
                  </ThemedText>
                </View>
              ) : (
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 28 }}
                  refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={loadData} tintColor={P} />
                  }
                >

                  {/* Section label */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <View style={{ width: 3, height: 14, borderRadius: 2, backgroundColor: tab === 'batsmen' ? ACCENTS.green.main : tab === 'bowlers' ? ACCENTS.orange.main : ACCENTS.primary.main }} />
                    <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: PD, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                      {tab === 'batsmen' ? 'Career Batting Stats' : tab === 'bowlers' ? 'Career Bowling Stats' : `Match History (${history.length})`}
                    </ThemedText>
                  </View>

                  {/* Analytics summary — the Home dashboard's graph card, per tab */}
                  {tab === 'batsmen' && batsmen.length > 0 && <OwnBoardAnalyticsCard {...battingSummary(batsmen)} />}
                  {tab === 'bowlers' && bowlers.length > 0 && <OwnBoardAnalyticsCard {...bowlingSummary(bowlers)} />}
                  {tab === 'matches' && history.length > 0 && <OwnBoardAnalyticsCard {...matchesSummary(history)} />}

                  {/* ── BATSMEN ──────────────────────────────────────── */}
                  {tab === 'batsmen' && (
                    batsmen.length === 0
                      ? <EmptyState label="batting stats" />
                      : batsmen.slice(0, 10).map((item, idx) => {
                        const card = batsmanCard(item, idx + 1);
                        return (
                          <PlayerStatCard
                            key={item.name}
                            name={item.name}
                            role={card.role}
                            avatar={<PlayerPic name={item.name} avatarUrl={item.avatarUrl} rank={idx + 1} size={44} />}
                            badge={card.badge}
                            info={{ icon: 'bar-chart-outline', text: card.info }}
                            meta={card.meta}
                            chips={card.chips}
                            total={card.total}
                            actionLabel="View Profile"
                            onPress={() => setSelectedPlayerName(item.name)}
                          />
                        );
                      })
                  )}

                  {/* ── BOWLERS ──────────────────────────────────────── */}
                  {tab === 'bowlers' && (
                    bowlers.length === 0
                      ? <EmptyState label="bowling stats" />
                      : bowlers.slice(0, 10).map((item, idx) => {
                        const card = bowlerCard(item, idx + 1);
                        return (
                          <PlayerStatCard
                            key={item.name}
                            name={item.name}
                            role={card.role}
                            avatar={<PlayerPic name={item.name} avatarUrl={item.avatarUrl} rank={idx + 1} size={44} />}
                            badge={card.badge}
                            info={{ icon: 'baseball-outline', text: card.info }}
                            meta={card.meta}
                            chips={card.chips}
                            total={card.total}
                            actionLabel="View Profile"
                            onPress={() => setSelectedPlayerName(item.name)}
                          />
                        );
                      })
                  )}

                  {/* ── MATCHES ──────────────────────────────────────── */}
                  {tab === 'matches' && (
                    history.length === 0
                      ? <EmptyState label="match history" />
                      : history.map((match) => {
                        const card = matchCard(match);
                        return (
                          <MatchResultCard
                            key={match.id}
                            title={card.title}
                            pill={card.pill}
                            date={card.date}
                            innings={card.innings}
                            motm={card.motm}
                            avatar={<PlayerPic name={match.motmName} size={26} />}
                            onPress={() => setSelectedDetailMatch(match)}
                          />
                        );
                      })
                  )}
                </ScrollView>
              )}

              {/* Close button */}
              <View style={{ paddingHorizontal: 16, paddingBottom: 24, paddingTop: 8, backgroundColor: W, borderTopWidth: 1, borderTopColor: P + '18' }}>
                <Pressable
                  onPress={() => setShowOwnBoard(false)}
                  style={({ pressed }) => [{ borderRadius: 14, overflow: 'hidden' }, pressed && { opacity: 0.85 }]}
                >
                  <LinearGradient
                    colors={[PD, P]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 }}
                  >
                    <MaterialCommunityIcons name="clipboard-check-outline" size={18} color={W} />
                    <ThemedText style={{ fontSize: 14, fontFamily: 'Sora_500Medium', color: W }}>
                      Close Own Board
                    </ThemedText>
                  </LinearGradient>
                </Pressable>
              </View>

            </View>
          </View>
        </Modal>

        {/* ── MATCH DETAILS / FULL SCORECARD MODAL ───────────────────────── */}
        <Modal
          visible={!!selectedDetailMatch}
          animationType="slide"
          transparent
          onRequestClose={() => setSelectedDetailMatch(null)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(13,29,38,0.55)', justifyContent: 'flex-end' }}>
            <View style={{ height: '92%', backgroundColor: theme.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' }}>
              <OwnBoardSheetHeader
                title="Match Scorecard"
                subtitle={selectedDetailMatch ? `${selectedDetailMatch.teamA} vs ${selectedDetailMatch.teamB}` : ''}
                icon="document-text-outline"
                onBack={() => setSelectedDetailMatch(null)}
                onClose={() => setSelectedDetailMatch(null)}
              />

              {selectedDetailMatch && (() => {
                const match = selectedDetailMatch;
                const card = matchCard(match);
                // A match without a second innings always shows the first.
                const activeInnings: 1 | 2 = detailInningsTab === 2 && match.innings2?.score ? 2 : 1;
                const inn = activeInnings === 2 ? match.innings2 : match.innings1;
                const bowlingTeam = inn?.team === match.teamA ? match.teamB : match.teamA;
                const inningsOptions = [
                  { key: 1 as const, title: `1st · ${match.innings1.team}`, subtitle: `${match.innings1.score} (${match.innings1.overs} ov)` },
                  ...(match.innings2?.score
                    ? [{ key: 2 as const, title: `2nd · ${match.innings2.team}`, subtitle: `${match.innings2.score} (${match.innings2.overs} ov)` }]
                    : []),
                ];

                return (
                  <>
                  <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
                    <MatchResultCard
                      title={card.title}
                      pill={card.pill}
                      date={formatPlayedDateTime(match.completedAt)}
                      innings={card.innings}
                      motm={card.motm}
                      avatar={<PlayerPic name={match.motmName} size={26} />}
                      footerNote={card.motm.stat}
                    />

                    <OwnBoardSectionLabel label="Innings Breakdown" color={P} />
                    <InningsTabs options={inningsOptions} active={activeInnings} onChange={setDetailInningsTab} />

                    {/* No invented rows: an innings with nothing recorded says so. */}
                    {inn && (
                      <>
                        <OwnBoardAnalyticsCard {...inningsBattingSummary(inn)}>
                          <ScoreTable
                            firstColumn="Batter"
                            columns={BATTING_COLUMNS}
                            rows={battingRows(inn)}
                            accent={ACCENTS.green}
                            emphasis={0}
                            emptyLabel="No batting recorded for this innings"
                          />
                        </OwnBoardAnalyticsCard>
                        <OwnBoardAnalyticsCard {...inningsBowlingSummary(inn, bowlingTeam)}>
                          <ScoreTable
                            firstColumn="Bowler"
                            columns={BOWLING_COLUMNS}
                            rows={bowlingRows(inn)}
                            accent={ACCENTS.orange}
                            emphasis={3}
                            emptyLabel="No bowling recorded for this innings"
                          />
                        </OwnBoardAnalyticsCard>
                      </>
                    )}

                  </ScrollView>

                  {/* Fixed at the bottom, like Close Own Board, so it stays in reach
                      however long the scorecard is. */}
                  <View style={{ paddingHorizontal: 16, paddingBottom: 24, paddingTop: 10, backgroundColor: theme.surfaceLowest, borderTopWidth: 1, borderTopColor: theme.outlineVariant + '20' }}>
                    <Pressable
                      onPress={() => handleExportPDF(match)}
                      accessibilityRole="button"
                      accessibilityLabel="Download the match score sheet as a PDF"
                      style={({ pressed }) => [
                        { backgroundColor: theme.primary, borderRadius: 999, height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
                        Shadows.level2,
                        pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
                      ]}
                    >
                      <Ionicons name="document-text-outline" size={18} color={W} />
                      <ThemedText style={{ fontSize: 14, fontFamily: 'Sora_600SemiBold', color: W }}>
                        Download Score Sheet PDF
                      </ThemedText>
                    </Pressable>
                  </View>
                  </>
                );
              })()}
            </View>
          </View>
        </Modal>

        {/* ── PLAYER CAREER & MATCH-BY-MATCH LOGS MODAL ────────────────── */}
        <Modal
          visible={!!selectedPlayerName}
          animationType="slide"
          transparent
          onRequestClose={() => setSelectedPlayerName(null)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(13,29,38,0.55)', justifyContent: 'flex-end' }}>
            <View style={{ height: '92%', backgroundColor: theme.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' }}>
              <OwnBoardSheetHeader
                title="Player Career & Logs"
                subtitle={selectedPlayerName || ''}
                icon="person-circle-outline"
                onBack={() => setSelectedPlayerName(null)}
                onClose={() => setSelectedPlayerName(null)}
              />

              {selectedPlayerName && (() => {
                const logs = getPlayerMatchHistory(selectedPlayerName, history);
                const key = selectedPlayerName.toLowerCase();
                const batStat = batsmen.find(b => b.name.toLowerCase() === key);
                const bowlStat = bowlers.find(b => b.name.toLowerCase() === key);
                const career = playerCareerSummary(logs, batStat, bowlStat);

                return (
                  <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                    <PlayerProfileCard
                      name={selectedPlayerName}
                      avatar={<PlayerPic name={selectedPlayerName} avatarUrl={batStat?.avatarUrl || bowlStat?.avatarUrl} size={44} />}
                      metric={career.metric}
                      tag={career.tag}
                      footer={career.footer}
                    />

                    {career.batting && (
                      <OwnBoardAnalyticsCard {...career.batting}>
                        <StatTileRow chips={career.battingTiles} />
                      </OwnBoardAnalyticsCard>
                    )}

                    {career.bowling && (
                      <OwnBoardAnalyticsCard {...career.bowling}>
                        <StatTileRow chips={career.bowlingTiles} />
                      </OwnBoardAnalyticsCard>
                    )}

                    <OwnBoardSectionLabel label={`Match Logs (${logs.length})`} color={P} />

                    {logs.length === 0 ? (
                      <EmptyState label="match entries for this player" />
                    ) : (
                      logs.map((item) => (
                        <MatchLogCard
                          key={item.matchId}
                          log={matchLogCard(item)}
                          onScorecard={() => {
                            setSelectedPlayerName(null);
                            setDetailInningsTab(1);
                            setSelectedDetailMatch(item.matchRecord);
                          }}
                        />
                      ))
                    )}
                  </ScrollView>
                );
              })()}
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </GradientContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, height: 56,
    borderBottomWidth: 1, borderBottomColor: '#0000000a', zIndex: 10,
  },
  ownBoardBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: P, paddingHorizontal: 13, paddingVertical: 7, borderRadius: 20,
    shadowColor: P, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, height: 30, justifyContent: 'center',
  },
  card: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: W, borderRadius: 20, padding: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: P + '20',
    shadowColor: P, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 12, elevation: 4,
  },
  matchCard: {
    backgroundColor: W, borderRadius: 20, padding: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: P + '20',
    shadowColor: P, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 12, elevation: 4,
  },
  topStrip: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
    borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: P, opacity: 0.7,
  },
  playerName: {
    fontSize: 15, fontFamily: 'Sora_500Medium', color: PD,
  },
  statText: {
    fontSize: 11, color: PD + '80', fontFamily: 'Sora_500Medium',
  },
  dot: {
    width: 3, height: 3, borderRadius: 2, backgroundColor: P + '30',
  },
});
