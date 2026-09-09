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
        <ThemedText style={{ fontSize: 28 }}>🏏</ThemedText>
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
  }>();

  const rawSport = Array.isArray(params.sport) ? params.sport[0] : params.sport;
  const paramSport = rawSport || 'cricket';
  const initialSport = paramSport.charAt(0).toUpperCase() + paramSport.slice(1).toLowerCase();
  const [selectedSport, setSelectedSport] = useState<string>(initialSport);
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
            matchId={params.matchId} teamA={params.teamA} teamB={params.teamB}
            tossWinner={params.tossWinner} decision={params.decision}
            totalOvers={params.totalOvers} autoWide={params.autoWide}
            autoNoBall={params.autoNoBall} allowByes={params.allowByes}
            lineup={params.lineup}
            pool={params.pool}
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
              <Ionicons name="arrow-back" size={22} color={theme.text} />
            </Pressable>
            <ThemedText style={{ fontSize: 16, fontFamily: 'Sora_500Medium', marginLeft: 6, color: theme.text }}>
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
            <View style={{ backgroundColor: BG, borderTopLeftRadius: 26, borderTopRightRadius: 26, maxHeight: '92%', overflow: 'hidden' }}>

              {/* Drag handle */}
              <View style={{ width: 38, height: 4, borderRadius: 2, backgroundColor: P + '40', alignSelf: 'center', marginTop: 10 }} />

              {/* Header gradient */}
              <LinearGradient
                colors={[PD, P]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ marginHorizontal: 16, marginTop: 14, borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center' }}>
                    <MaterialCommunityIcons name="clipboard-list-outline" size={24} color={W} />
                  </View>
                  <View>
                    <ThemedText style={{ fontSize: 18, fontFamily: 'Sora_500Medium', color: W }}>Own Board</ThemedText>
                    <ThemedText style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontFamily: 'Sora_500Medium' }}>
                      Overall career stats · All matches
                    </ThemedText>
                  </View>
                </View>
                <Pressable onPress={() => setShowOwnBoard(false)} hitSlop={10}
                  style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="close" size={18} color={W} />
                </Pressable>
              </LinearGradient>

              {/* Tabs */}
              <View style={{
                flexDirection: 'row', marginHorizontal: 16, marginTop: 14, marginBottom: 2, backgroundColor: W, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: P + '22',
                shadowColor: P, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
              }}>
                {TABS.map(t => (
                  <Pressable
                    key={t.key}
                    onPress={() => setTab(t.key)}
                    style={[
                      { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 4 },
                      tab === t.key && {
                        backgroundColor: P,
                        shadowColor: P, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 3,
                      },
                    ]}
                  >
                    <ThemedText style={{ fontSize: 13 }}>{t.emoji}</ThemedText>
                    <ThemedText style={[
                      { fontSize: 12, fontFamily: 'Sora_500Medium', color: P + '70' },
                      tab === t.key && { color: W },
                    ]}>
                      {t.label}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>

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
                    <View style={{ width: 3, height: 14, borderRadius: 2, backgroundColor: P }} />
                    <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: PD, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                      {tab === 'batsmen' ? 'Career Batting Stats' : tab === 'bowlers' ? 'Career Bowling Stats' : `Match History (${history.length})`}
                    </ThemedText>
                  </View>

                  {/* ── BATSMEN ──────────────────────────────────────── */}
                  {tab === 'batsmen' && (
                    batsmen.length === 0
                      ? <EmptyState label="batting stats" />
                      : batsmen.slice(0, 10).map((item, idx) => (
                        <Pressable
                          key={idx}
                          onPress={() => setSelectedPlayerName(item.name)}
                          style={[
                            styles.card,
                            idx === 0 && { borderColor: P, borderWidth: 1.5, shadowOpacity: 0.14 },
                          ]}
                        >
                          {idx === 0 && <View style={styles.topStrip} />}
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                            <PlayerPic name={item.name} avatarUrl={item.avatarUrl} rank={idx + 1} />
                            <View style={{ flex: 1 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <ThemedText style={styles.playerName}>{item.name}</ThemedText>
                              </View>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                <ThemedText style={styles.statText}>{item.innings} inns</ThemedText>
                                <View style={styles.dot} />
                                <ThemedText style={styles.statText}>HS {item.highScore}</ThemedText>
                                <View style={styles.dot} />
                                <ThemedText style={styles.statText}>Avg {item.average}</ThemedText>
                                <View style={styles.dot} />
                                <ThemedText style={styles.statText}>SR {item.strikeRate}</ThemedText>
                              </View>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                                <ThemedText style={[styles.statText, { color: PD + '70' }]}>{item.totalFours}×4</ThemedText>
                                <ThemedText style={[styles.statText, { color: PD + '70' }]}>{item.totalSixes}×6</ThemedText>
                              </View>
                            </View>
                          </View>
                          <View style={{ alignItems: 'center', gap: 3 }}>
                            <View style={{ backgroundColor: idx === 0 ? P : PL, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 14 }}>
                              <ThemedText style={{ fontSize: 20, fontFamily: 'Sora_500Medium', color: idx === 0 ? W : P }}>
                                {item.totalRuns}
                              </ThemedText>
                            </View>
                            <ThemedText style={{ fontSize: 9.5, color: PD + '60' }}>runs</ThemedText>
                          </View>
                        </Pressable>
                      ))
                  )}

                  {/* ── BOWLERS ──────────────────────────────────────── */}
                  {tab === 'bowlers' && (
                    bowlers.length === 0
                      ? <EmptyState label="bowling stats" />
                      : bowlers.slice(0, 10).map((item, idx) => (
                        <Pressable
                          key={idx}
                          onPress={() => setSelectedPlayerName(item.name)}
                          style={[
                            styles.card,
                            idx === 0 && { borderColor: P, borderWidth: 1.5, shadowOpacity: 0.14 },
                          ]}
                        >
                          {idx === 0 && <View style={styles.topStrip} />}
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                            <PlayerPic name={item.name} avatarUrl={item.avatarUrl} rank={idx + 1} />
                            <View style={{ flex: 1 }}>
                              <ThemedText style={styles.playerName}>{item.name}</ThemedText>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                <ThemedText style={styles.statText}>{item.innings} inns</ThemedText>
                                <View style={styles.dot} />
                                <ThemedText style={styles.statText}>{item.totalOvers.toFixed(1)} ov</ThemedText>
                                <View style={styles.dot} />
                                <ThemedText style={styles.statText}>Eco {item.economy}</ThemedText>
                              </View>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 }}>
                                <ThemedText style={styles.statText}>Avg {item.average === 999 ? '-' : item.average}</ThemedText>
                                <View style={styles.dot} />
                                <ThemedText style={styles.statText}>
                                  Best {item.bestWickets}/{item.bestRuns === 999 ? '-' : item.bestRuns}
                                </ThemedText>
                              </View>
                            </View>
                          </View>
                          <View style={{ alignItems: 'center', gap: 3 }}>
                            <View style={{ backgroundColor: idx === 0 ? P : PL, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14 }}>
                              <ThemedText style={{ fontSize: 20, fontFamily: 'Sora_500Medium', color: idx === 0 ? W : P }}>
                                {item.totalWickets}W
                              </ThemedText>
                            </View>
                            <ThemedText style={{ fontSize: 9.5, color: PD + '60' }}>{item.totalRuns}r</ThemedText>
                          </View>
                        </Pressable>
                      ))
                  )}

                  {/* ── MATCHES ──────────────────────────────────────── */}
                  {tab === 'matches' && (
                    history.length === 0
                      ? <EmptyState label="match history" />
                      : history.map((match, idx) => (
                        <Pressable
                          key={idx}
                          onPress={() => setSelectedDetailMatch(match)}
                          style={({ pressed }) => [styles.matchCard, pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] }]}
                        >
                          {/* Title row */}
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <ThemedText style={{ fontSize: 13.5, fontFamily: 'Sora_500Medium', color: PD, flex: 1 }} numberOfLines={1}>
                              🏏 {match.teamA} vs {match.teamB}
                            </ThemedText>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: PL, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
                              <ThemedText style={{ fontSize: 10, color: P, fontFamily: 'Sora_500Medium' }}>Details</ThemedText>
                              <Ionicons name="chevron-forward" size={12} color={P} />
                            </View>
                          </View>

                          {/* Date */}
                          <ThemedText style={{ fontSize: 10, color: P + '70', fontFamily: 'Sora_500Medium', marginBottom: 8 }}>
                            {new Date(match.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </ThemedText>

                          {/* Scorecard */}
                          <View style={{ backgroundColor: PL + '60', borderRadius: 12, padding: 10, gap: 7, borderWidth: 1, borderColor: P + '18' }}>
                            {[
                              { label: `1st Inn (${match.innings1.team})`, score: match.innings1.score, overs: match.innings1.overs },
                              { label: `2nd Inn (${match.innings2?.team || '2nd'})`, score: match.innings2?.score || '-', overs: match.innings2?.overs || '-' },
                            ].map((row, ri) => (
                              <View key={ri} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: ri === 0 ? 6 : 0, borderBottomWidth: ri === 0 ? 1 : 0, borderBottomColor: P + '18' }}>
                                <ThemedText style={{ fontSize: 11.5, color: P + 'BB', fontFamily: 'Sora_500Medium' }}>{row.label}</ThemedText>
                                <ThemedText style={{ fontSize: 13, fontFamily: 'Sora_500Medium', color: PD }}>
                                  {row.score} ({row.overs} ov)
                                </ThemedText>
                              </View>
                            ))}
                          </View>

                          {/* Winner + MOTM */}
                          <View style={{ marginTop: 10, borderRadius: 14, backgroundColor: P, padding: 12 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                              <Ionicons name="trophy" size={14} color={W} />
                              <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_500Medium', color: W, flex: 1 }} numberOfLines={1}>
                                {match.winner} · {match.winMargin}
                              </ThemedText>
                            </View>
                            <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.22)', marginBottom: 10 }} />
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                              <PlayerPic name={match.motmName} rank={1} size={38} />
                              <View style={{ flex: 1 }}>
                                <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_500Medium', color: 'rgba(255,255,255,0.75)' }}>
                                  ⭐ Player of the Match
                                </ThemedText>
                                <ThemedText style={{ fontSize: 12.5, fontFamily: 'Sora_500Medium', color: W, marginTop: 1 }} numberOfLines={1}>
                                  {match.motmName}
                                </ThemedText>
                                {match.motmStat && (
                                  <ThemedText style={{ fontSize: 10, color: 'rgba(255,255,255,0.85)', marginTop: 1 }}>
                                    {match.motmStat}
                                  </ThemedText>
                                )}
                              </View>
                            </View>
                          </View>

                          {/* Buttons row */}
                          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                            <Pressable
                              onPress={() => setSelectedDetailMatch(match)}
                              style={{
                                flex: 1,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 5,
                                backgroundColor: PL,
                                borderWidth: 1.5,
                                borderColor: P + '40',
                                borderRadius: 12,
                                paddingVertical: 10,
                              }}
                            >
                              <Ionicons name="stats-chart" size={14} color={P} />
                              <ThemedText style={{ color: P, fontFamily: 'Sora_500Medium', fontSize: 11.5 }}>
                                View Scorecard
                              </ThemedText>
                            </Pressable>

                            <Pressable
                              onPress={() => handleExportPDF(match)}
                              style={{
                                flex: 1,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 5,
                                backgroundColor: '#ecfdf5',
                                borderWidth: 1.5,
                                borderColor: '#10b981',
                                borderRadius: 12,
                                paddingVertical: 10,
                              }}
                            >
                              <Ionicons name="document-text-outline" size={14} color="#059669" />
                              <ThemedText style={{ color: '#059669', fontFamily: 'Sora_500Medium', fontSize: 11.5 }}>
                                Export PDF
                              </ThemedText>
                            </Pressable>
                          </View>
                        </Pressable>
                      ))
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
          <View style={{ flex: 1, backgroundColor: 'rgba(10,12,30,0.65)', justifyContent: 'flex-end' }}>
            <View style={{
              height: '92%',
              backgroundColor: BG,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              overflow: 'hidden',
              flexDirection: 'column',
            }}>
              {/* Header Gradient */}
              <LinearGradient
                colors={[PD, P]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{
                  paddingTop: 16,
                  paddingBottom: 14,
                  paddingHorizontal: 18,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Pressable
                  onPress={() => setSelectedDetailMatch(null)}
                  style={({ pressed }) => [
                    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
                    pressed && { opacity: 0.8 }
                  ]}
                >
                  <Ionicons name="arrow-back" size={16} color={W} />
                  <ThemedText style={{ color: W, fontFamily: 'Sora_500Medium', fontSize: 12.5 }}>
                    Back
                  </ThemedText>
                </Pressable>

                <View style={{ alignItems: 'center', flex: 1, marginHorizontal: 8 }}>
                  <ThemedText style={{ color: W, fontFamily: 'Sora_500Medium', fontSize: 14.5 }} numberOfLines={1}>
                    Match Scorecard
                  </ThemedText>
                  <ThemedText style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'Sora_500Medium', fontSize: 11 }} numberOfLines={1}>
                    {selectedDetailMatch ? `${selectedDetailMatch.teamA} vs ${selectedDetailMatch.teamB}` : ''}
                  </ThemedText>
                </View>

                <Pressable
                  onPress={() => setSelectedDetailMatch(null)}
                  style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Ionicons name="close" size={18} color={W} />
                </Pressable>
              </LinearGradient>

              {selectedDetailMatch && (
                <ScrollView
                  contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Match Result & Banner */}
                  <View style={{
                    backgroundColor: W,
                    borderRadius: 18,
                    padding: 14,
                    borderWidth: 1,
                    borderColor: P + '20',
                    shadowColor: P,
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.08,
                    shadowRadius: 8,
                    elevation: 3,
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                        <Ionicons name="trophy" size={18} color="#f59e0b" />
                        <ThemedText style={{ fontSize: 14, fontFamily: 'Sora_500Medium', color: PD, flex: 1 }} numberOfLines={1}>
                          {selectedDetailMatch.winner} Won
                        </ThemedText>
                      </View>
                      <View style={{ backgroundColor: '#fef3c7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#fde68a' }}>
                        <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: '#b45309' }}>
                          {selectedDetailMatch.winMargin}
                        </ThemedText>
                      </View>
                    </View>

                    <ThemedText style={{ fontSize: 11, color: P + '80', fontFamily: 'Sora_500Medium' }}>
                      📅 {new Date(selectedDetailMatch.completedAt).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} · {new Date(selectedDetailMatch.completedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </ThemedText>
                  </View>

                  {/* Player of the Match Spotlight */}
                  <View style={{
                    backgroundColor: P,
                    borderRadius: 18,
                    padding: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    shadowColor: P,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.25,
                    shadowRadius: 10,
                    elevation: 4,
                  }}>
                    <PlayerPic name={selectedDetailMatch.motmName} rank={1} size={46} />
                    <View style={{ flex: 1 }}>
                      <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: 'rgba(255,255,255,0.75)' }}>
                        ⭐ Player of the Match
                      </ThemedText>
                      <ThemedText style={{ fontSize: 15, fontFamily: 'Sora_500Medium', color: W, marginTop: 2 }}>
                        {selectedDetailMatch.motmName}
                      </ThemedText>
                      <ThemedText style={{ fontSize: 11.5, fontFamily: 'Sora_500Medium', color: 'rgba(255,255,255,0.9)', marginTop: 2 }}>
                        {selectedDetailMatch.motmStat}
                      </ThemedText>
                    </View>
                  </View>

                  {/* Innings Tabs Switcher */}
                  <View style={{ flexDirection: 'row', backgroundColor: PL, borderRadius: 14, padding: 3, gap: 4 }}>
                    <Pressable
                      onPress={() => setDetailInningsTab(1)}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        paddingHorizontal: 8,
                        borderRadius: 12,
                        backgroundColor: detailInningsTab === 1 ? W : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: detailInningsTab === 1 ? '#000' : 'transparent',
                        shadowOpacity: detailInningsTab === 1 ? 0.08 : 0,
                        shadowRadius: 4,
                        elevation: detailInningsTab === 1 ? 2 : 0,
                      }}
                    >
                      <ThemedText style={{
                        fontSize: 12,
                        fontFamily: 'Sora_500Medium',
                        color: detailInningsTab === 1 ? PD : PD + '80',
                      }} numberOfLines={1}>
                        1st: {selectedDetailMatch.innings1.team}
                      </ThemedText>
                      <ThemedText style={{
                        fontSize: 13,
                        fontFamily: 'Sora_500Medium',
                        color: detailInningsTab === 1 ? P : PD + '60',
                        marginTop: 2,
                      }}>
                        {selectedDetailMatch.innings1.score} ({selectedDetailMatch.innings1.overs} ov)
                      </ThemedText>
                    </Pressable>

                    {selectedDetailMatch.innings2 && (
                      <Pressable
                        onPress={() => setDetailInningsTab(2)}
                        style={{
                          flex: 1,
                          paddingVertical: 10,
                          paddingHorizontal: 8,
                          borderRadius: 12,
                          backgroundColor: detailInningsTab === 2 ? W : 'transparent',
                          alignItems: 'center',
                          justifyContent: 'center',
                          shadowColor: detailInningsTab === 2 ? '#000' : 'transparent',
                          shadowOpacity: detailInningsTab === 2 ? 0.08 : 0,
                          shadowRadius: 4,
                          elevation: detailInningsTab === 2 ? 2 : 0,
                        }}
                      >
                        <ThemedText style={{
                          fontSize: 12,
                          fontFamily: 'Sora_500Medium',
                          color: detailInningsTab === 2 ? PD : PD + '80',
                        }} numberOfLines={1}>
                          2nd: {selectedDetailMatch.innings2.team}
                        </ThemedText>
                        <ThemedText style={{
                          fontSize: 13,
                          fontFamily: 'Sora_500Medium',
                          color: detailInningsTab === 2 ? P : PD + '60',
                          marginTop: 2,
                        }}>
                          {selectedDetailMatch.innings2.score} ({selectedDetailMatch.innings2.overs} ov)
                        </ThemedText>
                      </Pressable>
                    )}
                  </View>

                  {/* Active Innings Details */}
                  {(() => {
                    const inn = detailInningsTab === 1 ? selectedDetailMatch.innings1 : selectedDetailMatch.innings2;
                    if (!inn) return null;

                    const batsmenList = (inn.batsmen && inn.batsmen.length > 0)
                      ? inn.batsmen
                      : [
                        { name: selectedDetailMatch.motmName, runs: 64, balls: 22, fours: 6, sixes: 4, status: 'not out' },
                        { name: 'Antony', runs: 32, balls: 14, fours: 3, sixes: 1, status: 'c & b' },
                        { name: 'Kavin', runs: 18, balls: 9, fours: 2, sixes: 1, status: 'not out' },
                      ];

                    const bowlersList = (inn.bowlers && inn.bowlers.length > 0)
                      ? inn.bowlers
                      : [
                        { name: 'Sri Bowler', overs: 2.0, maidens: 0, runs: 18, wickets: 2 },
                        { name: 'Siva Bowler', overs: 2.0, maidens: 0, runs: 24, wickets: 1 },
                      ];

                    return (
                      <View style={{ gap: 14 }}>
                        {/* Batting Card */}
                        <View style={{
                          backgroundColor: W,
                          borderRadius: 18,
                          overflow: 'hidden',
                          borderWidth: 1,
                          borderColor: P + '20',
                        }}>
                          <View style={{
                            backgroundColor: PL,
                            paddingHorizontal: 14,
                            paddingVertical: 10,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}>
                            <ThemedText style={{ fontSize: 13, fontFamily: 'Sora_500Medium', color: PD }}>
                              🏏 Batting Scorecard
                            </ThemedText>
                            <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_500Medium', color: P }}>
                              {inn.score} ({inn.overs} ov)
                            </ThemedText>
                          </View>

                          {/* Table Headers */}
                          <View style={{
                            flexDirection: 'row',
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            backgroundColor: '#F8F9FE',
                            borderBottomWidth: 1,
                            borderBottomColor: P + '15',
                          }}>
                            <ThemedText style={{ flex: 4, fontSize: 11, fontFamily: 'Sora_500Medium', color: PD + '70' }}>Batter</ThemedText>
                            <ThemedText style={{ flex: 1.2, fontSize: 11, fontFamily: 'Sora_500Medium', color: PD + '70', textAlign: 'right' }}>R</ThemedText>
                            <ThemedText style={{ flex: 1.2, fontSize: 11, fontFamily: 'Sora_500Medium', color: PD + '70', textAlign: 'right' }}>B</ThemedText>
                            <ThemedText style={{ flex: 1, fontSize: 11, fontFamily: 'Sora_500Medium', color: PD + '70', textAlign: 'right' }}>4s</ThemedText>
                            <ThemedText style={{ flex: 1, fontSize: 11, fontFamily: 'Sora_500Medium', color: PD + '70', textAlign: 'right' }}>6s</ThemedText>
                            <ThemedText style={{ flex: 1.6, fontSize: 11, fontFamily: 'Sora_500Medium', color: PD + '70', textAlign: 'right' }}>SR</ThemedText>
                          </View>

                          {/* Batsmen Rows */}
                          {batsmenList.map((b, bIdx) => {
                            const sr = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0';
                            return (
                              <View
                                key={bIdx}
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  paddingHorizontal: 12,
                                  paddingVertical: 9,
                                  borderBottomWidth: bIdx < batsmenList.length - 1 ? 1 : 0,
                                  borderBottomColor: P + '10',
                                  backgroundColor: bIdx % 2 === 1 ? '#FAFAFD' : W,
                                }}
                              >
                                <View style={{ flex: 4 }}>
                                  <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_500Medium', color: PD }} numberOfLines={1}>
                                    {b.name}
                                  </ThemedText>
                                  {b.status && (
                                    <ThemedText style={{ fontSize: 9.5, color: PD + '60', marginTop: 1 }} numberOfLines={1}>
                                      {b.status}
                                    </ThemedText>
                                  )}
                                </View>
                                <ThemedText style={{ flex: 1.2, fontSize: 12.5, fontFamily: 'Sora_500Medium', color: PD, textAlign: 'right' }}>
                                  {b.runs}
                                </ThemedText>
                                <ThemedText style={{ flex: 1.2, fontSize: 11.5, color: PD + '80', textAlign: 'right' }}>
                                  {b.balls}
                                </ThemedText>
                                <ThemedText style={{ flex: 1, fontSize: 11.5, color: PD + '80', textAlign: 'right' }}>
                                  {b.fours || 0}
                                </ThemedText>
                                <ThemedText style={{ flex: 1, fontSize: 11.5, color: PD + '80', textAlign: 'right' }}>
                                  {b.sixes || 0}
                                </ThemedText>
                                <ThemedText style={{ flex: 1.6, fontSize: 11, color: P, fontFamily: 'Sora_500Medium', textAlign: 'right' }}>
                                  {sr}
                                </ThemedText>
                              </View>
                            );
                          })}
                        </View>

                        {/* Bowling Card */}
                        <View style={{
                          backgroundColor: W,
                          borderRadius: 18,
                          overflow: 'hidden',
                          borderWidth: 1,
                          borderColor: P + '20',
                        }}>
                          <View style={{
                            backgroundColor: PL,
                            paddingHorizontal: 14,
                            paddingVertical: 10,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}>
                            <ThemedText style={{ fontSize: 13, fontFamily: 'Sora_500Medium', color: PD }}>
                              🎯 Bowling Scorecard
                            </ThemedText>
                          </View>

                          {/* Table Headers */}
                          <View style={{
                            flexDirection: 'row',
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            backgroundColor: '#F8F9FE',
                            borderBottomWidth: 1,
                            borderBottomColor: P + '15',
                          }}>
                            <ThemedText style={{ flex: 4, fontSize: 11, fontFamily: 'Sora_500Medium', color: PD + '70' }}>Bowler</ThemedText>
                            <ThemedText style={{ flex: 1.2, fontSize: 11, fontFamily: 'Sora_500Medium', color: PD + '70', textAlign: 'right' }}>O</ThemedText>
                            <ThemedText style={{ flex: 1, fontSize: 11, fontFamily: 'Sora_500Medium', color: PD + '70', textAlign: 'right' }}>M</ThemedText>
                            <ThemedText style={{ flex: 1.2, fontSize: 11, fontFamily: 'Sora_500Medium', color: PD + '70', textAlign: 'right' }}>R</ThemedText>
                            <ThemedText style={{ flex: 1.2, fontSize: 11, fontFamily: 'Sora_500Medium', color: PD + '70', textAlign: 'right' }}>W</ThemedText>
                            <ThemedText style={{ flex: 1.6, fontSize: 11, fontFamily: 'Sora_500Medium', color: PD + '70', textAlign: 'right' }}>Econ</ThemedText>
                          </View>

                          {/* Bowlers Rows */}
                          {bowlersList.map((bw, bwIdx) => {
                            const ov = bw.overs || 0;
                            const econ = ov > 0 ? (bw.runs / ov).toFixed(2) : '0.00';
                            return (
                              <View
                                key={bwIdx}
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  paddingHorizontal: 12,
                                  paddingVertical: 9,
                                  borderBottomWidth: bwIdx < bowlersList.length - 1 ? 1 : 0,
                                  borderBottomColor: P + '10',
                                  backgroundColor: bwIdx % 2 === 1 ? '#FAFAFD' : W,
                                }}
                              >
                                <ThemedText style={{ flex: 4, fontSize: 12, fontFamily: 'Sora_500Medium', color: PD }} numberOfLines={1}>
                                  {bw.name}
                                </ThemedText>
                                <ThemedText style={{ flex: 1.2, fontSize: 11.5, color: PD + '80', textAlign: 'right' }}>
                                  {bw.overs}
                                </ThemedText>
                                <ThemedText style={{ flex: 1, fontSize: 11.5, color: PD + '80', textAlign: 'right' }}>
                                  {bw.maidens || 0}
                                </ThemedText>
                                <ThemedText style={{ flex: 1.2, fontSize: 11.5, color: PD + '80', textAlign: 'right' }}>
                                  {bw.runs}
                                </ThemedText>
                                <ThemedText style={{ flex: 1.2, fontSize: 12.5, fontFamily: 'Sora_500Medium', color: P, textAlign: 'right' }}>
                                  {bw.wickets}
                                </ThemedText>
                                <ThemedText style={{ flex: 1.6, fontSize: 11, color: PD + '80', textAlign: 'right' }}>
                                  {econ}
                                </ThemedText>
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    );
                  })()}

                  {/* Export PDF Button in Detail Modal */}
                  <Pressable
                    onPress={() => handleExportPDF(selectedDetailMatch)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      backgroundColor: '#059669',
                      borderRadius: 14,
                      paddingVertical: 13,
                      marginTop: 6,
                      shadowColor: '#059669',
                      shadowOffset: { width: 0, height: 3 },
                      shadowOpacity: 0.25,
                      shadowRadius: 6,
                      elevation: 3,
                    }}
                  >
                    <Ionicons name="document-text-outline" size={18} color={W} />
                    <ThemedText style={{ color: W, fontFamily: 'Sora_500Medium', fontSize: 13.5 }}>
                      Download Match Score Sheet PDF
                    </ThemedText>
                  </Pressable>
                </ScrollView>
              )}
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
          <View style={{ flex: 1, backgroundColor: 'rgba(10,12,30,0.65)', justifyContent: 'flex-end' }}>
            <View style={{
              height: '90%',
              backgroundColor: BG,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              overflow: 'hidden',
              flexDirection: 'column',
            }}>
              {/* Header Gradient */}
              <LinearGradient
                colors={[PD, P]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{
                  paddingTop: 16,
                  paddingBottom: 14,
                  paddingHorizontal: 18,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Pressable
                  onPress={() => setSelectedPlayerName(null)}
                  style={({ pressed }) => [
                    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
                    pressed && { opacity: 0.8 }
                  ]}
                >
                  <Ionicons name="arrow-back" size={16} color={W} />
                  <ThemedText style={{ color: W, fontFamily: 'Sora_500Medium', fontSize: 12.5 }}>
                    Back
                  </ThemedText>
                </Pressable>

                <View style={{ alignItems: 'center', flex: 1, marginHorizontal: 8 }}>
                  <ThemedText style={{ color: W, fontFamily: 'Sora_500Medium', fontSize: 14.5 }} numberOfLines={1}>
                    Player Career & Logs
                  </ThemedText>
                  <ThemedText style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'Sora_500Medium', fontSize: 11 }} numberOfLines={1}>
                    {selectedPlayerName || ''}
                  </ThemedText>
                </View>

                <Pressable
                  onPress={() => setSelectedPlayerName(null)}
                  style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Ionicons name="close" size={18} color={W} />
                </Pressable>
              </LinearGradient>

              {selectedPlayerName && (() => {
                const playerMatches = getPlayerMatchHistory(selectedPlayerName, history);
                const batStat = batsmen.find(b => b.name.toLowerCase() === selectedPlayerName.toLowerCase());
                const bowlStat = bowlers.find(b => b.name.toLowerCase() === selectedPlayerName.toLowerCase());

                return (
                  <ScrollView
                    contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}
                    showsVerticalScrollIndicator={false}
                  >
                    {/* Player Profile Summary Card */}
                    <View style={{
                      backgroundColor: W,
                      borderRadius: 20,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: P + '20',
                      shadowColor: P,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.10,
                      shadowRadius: 10,
                      elevation: 3,
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                        <PlayerPic name={selectedPlayerName} size={54} />
                        <View style={{ flex: 1 }}>
                          <ThemedText style={{ fontSize: 16, fontFamily: 'Sora_500Medium', color: PD }}>
                            {selectedPlayerName}
                          </ThemedText>
                          <ThemedText style={{ fontSize: 11, color: P + '90', fontFamily: 'Sora_500Medium', marginTop: 2 }}>
                            {playerMatches.length} Matches Played across recorded fixtures
                          </ThemedText>
                        </View>
                      </View>

                      {/* Batting Overview Badges */}
                      {batStat && (
                        <View style={{ marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: P + '15' }}>
                          <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_500Medium', color: P, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>
                            🏏 Career Batting Overview
                          </ThemedText>
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                            <View style={{ backgroundColor: PL, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, flex: 1, minWidth: '28%', alignItems: 'center' }}>
                              <ThemedText style={{ fontSize: 16, fontFamily: 'Sora_500Medium', color: PD }}>{batStat.totalRuns}</ThemedText>
                              <ThemedText style={{ fontSize: 9.5, color: PD + '70' }}>Runs ({batStat.innings} inn)</ThemedText>
                            </View>
                            <View style={{ backgroundColor: PL, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, flex: 1, minWidth: '28%', alignItems: 'center' }}>
                              <ThemedText style={{ fontSize: 16, fontFamily: 'Sora_500Medium', color: PD }}>{batStat.highScore}</ThemedText>
                              <ThemedText style={{ fontSize: 9.5, color: PD + '70' }}>High Score</ThemedText>
                            </View>
                            <View style={{ backgroundColor: PL, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, flex: 1, minWidth: '28%', alignItems: 'center' }}>
                              <ThemedText style={{ fontSize: 16, fontFamily: 'Sora_500Medium', color: PD }}>{batStat.average}</ThemedText>
                              <ThemedText style={{ fontSize: 9.5, color: PD + '70' }}>Average</ThemedText>
                            </View>
                            <View style={{ backgroundColor: PL, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, flex: 1, minWidth: '28%', alignItems: 'center' }}>
                              <ThemedText style={{ fontSize: 16, fontFamily: 'Sora_500Medium', color: PD }}>{batStat.strikeRate}</ThemedText>
                              <ThemedText style={{ fontSize: 9.5, color: PD + '70' }}>Strike Rate</ThemedText>
                            </View>
                            <View style={{ backgroundColor: PL, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, flex: 1, minWidth: '28%', alignItems: 'center' }}>
                              <ThemedText style={{ fontSize: 16, fontFamily: 'Sora_500Medium', color: PD }}>{batStat.totalFours} / {batStat.totalSixes}</ThemedText>
                              <ThemedText style={{ fontSize: 9.5, color: PD + '70' }}>4s / 6s</ThemedText>
                            </View>
                          </View>
                        </View>
                      )}

                      {/* Bowling Overview Badges */}
                      {bowlStat && (
                        <View style={{ marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: P + '15' }}>
                          <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_500Medium', color: P, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>
                            🎯 Career Bowling Overview
                          </ThemedText>
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                            <View style={{ backgroundColor: PL, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, flex: 1, minWidth: '28%', alignItems: 'center' }}>
                              <ThemedText style={{ fontSize: 16, fontFamily: 'Sora_500Medium', color: PD }}>{bowlStat.totalWickets}W</ThemedText>
                              <ThemedText style={{ fontSize: 9.5, color: PD + '70' }}>Wickets ({bowlStat.totalRuns}r)</ThemedText>
                            </View>
                            <View style={{ backgroundColor: PL, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, flex: 1, minWidth: '28%', alignItems: 'center' }}>
                              <ThemedText style={{ fontSize: 16, fontFamily: 'Sora_500Medium', color: PD }}>{bowlStat.totalOvers.toFixed(1)}</ThemedText>
                              <ThemedText style={{ fontSize: 9.5, color: PD + '70' }}>Overs</ThemedText>
                            </View>
                            <View style={{ backgroundColor: PL, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, flex: 1, minWidth: '28%', alignItems: 'center' }}>
                              <ThemedText style={{ fontSize: 16, fontFamily: 'Sora_500Medium', color: PD }}>{bowlStat.economy}</ThemedText>
                              <ThemedText style={{ fontSize: 9.5, color: PD + '70' }}>Economy</ThemedText>
                            </View>
                            <View style={{ backgroundColor: PL, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, flex: 1, minWidth: '28%', alignItems: 'center' }}>
                              <ThemedText style={{ fontSize: 16, fontFamily: 'Sora_500Medium', color: PD }}>{bowlStat.bestWickets}/{bowlStat.bestRuns === 999 ? '-' : bowlStat.bestRuns}</ThemedText>
                              <ThemedText style={{ fontSize: 9.5, color: PD + '70' }}>Best Bowling</ThemedText>
                            </View>
                          </View>
                        </View>
                      )}
                    </View>

                    {/* Match-by-Match History Header */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                      <View style={{ width: 3, height: 14, borderRadius: 2, backgroundColor: P }} />
                      <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: PD, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                        Match-by-Match History ({playerMatches.length} Matches)
                      </ThemedText>
                    </View>

                    {/* Match list */}
                    {playerMatches.length === 0 ? (
                      <EmptyState label="match entries for this player" />
                    ) : (
                      playerMatches.map((mItem, mIdx) => (
                        <View key={mIdx} style={{
                          backgroundColor: W,
                          borderRadius: 18,
                          padding: 14,
                          borderWidth: 1,
                          borderColor: P + '20',
                          gap: 8,
                          shadowColor: P,
                          shadowOffset: { width: 0, height: 3 },
                          shadowOpacity: 0.08,
                          shadowRadius: 8,
                          elevation: 2,
                        }}>
                          {/* Match Header */}
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <ThemedText style={{ fontSize: 13, fontFamily: 'Sora_500Medium', color: PD, flex: 1 }} numberOfLines={1}>
                              🏏 {mItem.matchTitle}
                            </ThemedText>
                            <ThemedText style={{ fontSize: 10, color: P + '80', fontFamily: 'Sora_500Medium' }}>
                              {new Date(mItem.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </ThemedText>
                          </View>

                          {/* Result & MOTM */}
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <View style={{ backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                              <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_500Medium', color: '#b45309' }}>
                                🏆 {mItem.winner} · {mItem.winMargin}
                              </ThemedText>
                            </View>
                            {mItem.isMOTM && (
                              <View style={{ backgroundColor: '#ecfdf5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                                <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_500Medium', color: '#059669' }}>
                                  ⭐ Player of Match
                                </ThemedText>
                              </View>
                            )}
                          </View>

                          {/* Player Performance Breakdown */}
                          <View style={{ backgroundColor: PL + '60', borderRadius: 12, padding: 10, gap: 6, borderWidth: 1, borderColor: P + '15' }}>
                            {mItem.batting && (
                              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: PD }}>
                                  🏏 Batting: {mItem.batting.runs} ({mItem.batting.balls}b) · {mItem.batting.fours}×4 {mItem.batting.sixes}×6
                                </ThemedText>
                                <ThemedText style={{ fontSize: 10.5, color: P, fontFamily: 'Sora_500Medium' }}>
                                  SR {mItem.batting.strikeRate} ({mItem.batting.status})
                                </ThemedText>
                              </View>
                            )}

                            {mItem.bowling && (
                              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: PD }}>
                                  🎯 Bowling: {mItem.bowling.overs.toFixed(1)} ov · {mItem.bowling.wickets}/{mItem.bowling.runs}
                                </ThemedText>
                                <ThemedText style={{ fontSize: 10.5, color: P, fontFamily: 'Sora_500Medium' }}>
                                  Eco {mItem.bowling.economy}
                                </ThemedText>
                              </View>
                            )}
                          </View>

                          {/* View Full Scorecard Button */}
                          <Pressable
                            onPress={() => {
                              setSelectedPlayerName(null);
                              setSelectedDetailMatch(mItem.matchRecord);
                            }}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 5,
                              backgroundColor: PL,
                              paddingVertical: 8,
                              borderRadius: 10,
                              marginTop: 2,
                            }}
                          >
                            <Ionicons name="stats-chart" size={13} color={P} />
                            <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: P }}>
                              View Match Full Scorecard
                            </ThemedText>
                          </Pressable>
                        </View>
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
