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
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  loadOwnBoardData,
  aggregateBatsmen,
  aggregateBowlers,
  INITIAL_SAMPLE_MATCHES,
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
  name: string; avatarUrl?: string; rank: number; size?: number;
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
  }>();

  const rawSport = Array.isArray(params.sport) ? params.sport[0] : params.sport;
  const paramSport = rawSport || 'cricket';
  const initialSport = paramSport.charAt(0).toUpperCase() + paramSport.slice(1).toLowerCase();
  const [selectedSport, setSelectedSport] = useState<string>(initialSport);
  const [showOwnBoard, setShowOwnBoard] = useState(false);
  const [tab, setTab] = useState<'batsmen' | 'bowlers' | 'matches'>('batsmen');
  const [loading, setLoading] = useState(false);

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
    } catch (_) {}
    setLoading(false);
  }, []);

  useEffect(() => {
    if (showOwnBoard) loadData();
  }, [showOwnBoard]);

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
            totalOvers={params.totalOvers} autoWide={params.autoWide}
            autoNoBall={params.autoNoBall} allowByes={params.allowByes}
            lineup={params.lineup}
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
              <View style={{ flexDirection: 'row', marginHorizontal: 16, marginTop: 14, marginBottom: 2, backgroundColor: W, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: P + '22',
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
                        <View key={idx} style={[
                          styles.card,
                          idx === 0 && { borderColor: P, borderWidth: 1.5, shadowOpacity: 0.14 },
                        ]}>
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
                        </View>
                      ))
                  )}

                  {/* ── BOWLERS ──────────────────────────────────────── */}
                  {tab === 'bowlers' && (
                    bowlers.length === 0
                      ? <EmptyState label="bowling stats" />
                      : bowlers.slice(0, 10).map((item, idx) => (
                        <View key={idx} style={[
                          styles.card,
                          idx === 0 && { borderColor: P, borderWidth: 1.5, shadowOpacity: 0.14 },
                        ]}>
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
                        </View>
                      ))
                  )}

                  {/* ── MATCHES ──────────────────────────────────────── */}
                  {tab === 'matches' && (
                    history.length === 0
                      ? <EmptyState label="match history" />
                      : history.map((match, idx) => (
                        <View key={idx} style={styles.matchCard}>
                          {/* Title row */}
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                            <ThemedText style={{ fontSize: 13, fontFamily: 'Sora_500Medium', color: PD, flex: 1 }} numberOfLines={1}>
                              🏏 {match.teamA} vs {match.teamB}
                            </ThemedText>
                          </View>

                          {/* Date */}
                          <ThemedText style={{ fontSize: 10, color: P + '70', fontFamily: 'Sora_500Medium', marginBottom: 8 }}>
                            {new Date(match.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </ThemedText>

                          {/* Scorecard */}
                          <View style={{ backgroundColor: PL + '60', borderRadius: 12, padding: 10, gap: 7, borderWidth: 1, borderColor: P + '18' }}>
                            {[
                              { label: `1st Inn (${match.innings1.team})`, score: match.innings1.score, overs: match.innings1.overs },
                              { label: `2nd Inn (${match.innings2.team})`, score: match.innings2.score, overs: match.innings2.overs },
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
                              <View>
                                <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_500Medium', color: 'rgba(255,255,255,0.75)' }}>
                                  ⭐ Player of the Match
                                </ThemedText>
                                <ThemedText style={{ fontSize: 12.5, fontFamily: 'Sora_500Medium', color: W, marginTop: 1 }}>
                                  {match.motmName}
                                </ThemedText>
                              </View>
                            </View>
                          </View>

                          {/* Export PDF Button */}
                          <Pressable
                            onPress={async () => {
                              try {
                                await exportScoreSheetPDF({
                                  matchId: `MTH-${idx + 101}`,
                                  sport: 'T20 Cricket Match (8 Overs)',
                                  venueName: 'Emerald Green Arena Pitch 1',
                                  venueAddress: 'Trichy Bypass Road, Tiruchirappalli',
                                  contactNumber: '+91 98765 43210',
                                  date: new Date(match.completedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                                  time: '06:30 PM',
                                  teamA: {
                                    name: match.innings1.team,
                                    captain: match.motmName + ' (C)',
                                    score: parseInt(match.innings1.score.split('/')[0] || '120', 10),
                                    wickets: parseInt(match.innings1.score.split('/')[1] || '4', 10),
                                    overs: parseFloat(match.innings1.overs || '8.0'),
                                    balls: 0,
                                    batsmen: [
                                      { name: match.motmName, runs: 64, balls: 22, fours: 6, sixes: 4, status: 'not out' },
                                      { name: 'Antony', runs: 32, balls: 14, fours: 3, sixes: 1, status: 'c & b' },
                                      { name: 'Kavin', runs: 18, balls: 9, fours: 2, sixes: 1, status: 'not out' },
                                    ],
                                    bowlers: [
                                      { name: 'Sri Bowler', overs: 2.0, maidens: 0, runs: 18, wickets: 2 },
                                      { name: 'Siva Bowler', overs: 2.0, maidens: 0, runs: 24, wickets: 1 },
                                    ]
                                  },
                                  teamB: {
                                    name: match.innings2.team,
                                    captain: 'Dinesh (C)',
                                    score: parseInt(match.innings2.score.split('/')[0] || '106', 10),
                                    wickets: parseInt(match.innings2.score.split('/')[1] || '6', 10),
                                    overs: parseFloat(match.innings2.overs || '8.0'),
                                    balls: 0,
                                  },
                                  winner: match.winner,
                                  winMargin: match.winMargin,
                                  mvpPlayer: match.motmName,
                                  mvpPerformance: match.motmStat,
                                  tossWinner: match.innings1.team,
                                  tossDecision: 'bat first',
                                });
                              } catch (e: any) {
                                Alert.alert('Export Error', e.message || 'Could not export score sheet');
                              }
                            }}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                              marginTop: 10,
                              backgroundColor: '#ecfdf5',
                              borderWidth: 1.5,
                              borderColor: '#10b981',
                              borderRadius: 12,
                              paddingVertical: 10,
                            }}
                          >
                            <Ionicons name="document-text-outline" size={16} color="#059669" />
                            <ThemedText style={{ color: '#059669', fontFamily: 'Sora_500Medium', fontSize: 12 }}>
                              📄 Download Score Sheet PDF
                            </ThemedText>
                          </Pressable>
                        </View>
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
