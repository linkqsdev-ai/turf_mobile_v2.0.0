import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { matchApi } from '@/services/match-api';

export default function VolleyballScoring({ matchId, teamA = 'Team A', teamB = 'Team B' }: { matchId?: string; teamA?: string; teamB?: string }) {
  const theme = useTheme();
  const router = useRouter();

  // Set scores (Best of 5)
  const [setsA, setSetsA] = useState<number[]>([]);
  const [setsB, setSetsB] = useState<number[]>([]);

  // Current set points (0-25, or 0-15 in Set 5)
  const [pointsA, setPointsA] = useState(0);
  const [pointsB, setPointsB] = useState(0);

  // Serve Indicator
  const [server, setServer] = useState<'A' | 'B'>('A');

  // Stats
  const [acesA, setAcesA] = useState(0);
  const [acesB, setAcesB] = useState(0);
  const [blocksA, setBlocksA] = useState(0);
  const [blocksB, setBlocksB] = useState(0);
  const [errorsA, setErrorsA] = useState(0);
  const [errorsB, setErrorsB] = useState(0);

  // Undo History
  const [history, setHistory] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleEndMatch = () => {
    Alert.alert(
      'End Match',
      'Are you sure you want to end this match and sync the scores to the database?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End & Sync',
          style: 'destructive',
          onPress: async () => {
            if (!matchId) {
              Alert.alert('Success', 'Match completed locally! (No matchId to sync)', [
                { text: 'OK', onPress: () => router.replace('/(tabs)/matches') }
              ]);
              return;
            }
            try {
              setIsSyncing(true);
              let setsWonA = 0;
              let setsWonB = 0;
              for (let i = 0; i < setsA.length; i++) {
                if (setsA[i] > setsB[i]) setsWonA++;
                else if (setsB[i] > setsA[i]) setsWonB++;
              }
              if (pointsA > pointsB) setsWonA++;
              else if (pointsB > pointsA) setsWonB++;

              await matchApi.completeMatch(matchId, {
                homeScore: setsWonA,
                awayScore: setsWonB,
                events: [
                  {
                    minute: 90,
                    type: 'stats',
                    team: 'home',
                    playerName: 'Match Stats',
                    metadata: { acesA, acesB, blocksA, blocksB, errorsA, errorsB },
                  }
                ],
              });

              Alert.alert('Match Synced', 'Scores successfully synchronized to the database!', [
                {
                  text: 'OK',
                  onPress: () => {
                    router.replace('/(tabs)/matches');
                  },
                },
              ]);
            } catch (err: any) {
              Alert.alert('Sync Failed', err.message || 'Could not sync match.');
            } finally {
              setIsSyncing(false);
            }
          },
        },
      ]
    );
  };

  const saveHistory = () => {
    const state = {
      setsA: [...setsA],
      setsB: [...setsB],
      pointsA,
      pointsB,
      server,
      acesA,
      acesB,
      blocksA,
      blocksB,
      errorsA,
      errorsB,
    };
    setHistory(prev => [...prev, state]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setSetsA(prev.setsA);
    setSetsB(prev.setsB);
    setPointsA(prev.pointsA);
    setPointsB(prev.pointsB);
    setServer(prev.server);
    setAcesA(prev.acesA);
    setAcesB(prev.acesB);
    setBlocksA(prev.blocksA);
    setBlocksB(prev.blocksB);
    setErrorsA(prev.errorsA);
    setErrorsB(prev.errorsB);
    setHistory(prevHistory => prevHistory.slice(0, -1));
  };

  const winSet = (winner: 'A' | 'B', finalPointsA: number, finalPointsB: number) => {
    setPointsA(0);
    setPointsB(0);
    
    if (winner === 'A') {
      setSetsA(prev => {
        const nextSets = [...prev];
        nextSets[nextSets.length - 1] = finalPointsA;
        if (nextSets.length < 5) nextSets.push(0);
        return nextSets;
      });
      setSetsB(prev => {
        const nextSets = [...prev];
        nextSets[nextSets.length - 1] = finalPointsB;
        if (nextSets.length < 5) nextSets.push(0);
        return nextSets;
      });
    } else {
      setSetsB(prev => {
        const nextSets = [...prev];
        nextSets[nextSets.length - 1] = finalPointsB;
        if (nextSets.length < 5) nextSets.push(0);
        return nextSets;
      });
      setSetsA(prev => {
        const nextSets = [...prev];
        nextSets[nextSets.length - 1] = finalPointsA;
        if (nextSets.length < 5) nextSets.push(0);
        return nextSets;
      });
    }
  };

  const awardPoint = (player: 'A' | 'B') => {
    saveHistory();
    setServer(player);

    const nextA = player === 'A' ? pointsA + 1 : pointsA;
    const nextB = player === 'B' ? pointsB + 1 : pointsB;

    const setNumber = setsA.length;
    const targetPoints = setNumber === 5 ? 15 : 25;

    // Volleyball rule: Win set at 25 (or 15 in 5th set) with 2 point margin.
    const hasWon = (score: number, opponent: number) => {
      return score >= targetPoints && score - opponent >= 2;
    };

    if (player === 'A' && hasWon(nextA, nextB)) {
      winSet('A', nextA, nextB);
    } else if (player === 'B' && hasWon(nextB, nextA)) {
      winSet('B', nextA, nextB);
    } else {
      setPointsA(nextA);
      setPointsB(nextB);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Set Score Banner */}
        <View style={styles.bannerWrapper}>
          <View style={[styles.timerBanner, { backgroundColor: theme.primaryContainer }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <ThemedText type="labelSm" style={{ color: '#ffffffaa', letterSpacing: 1 }}>
                Volleyball Match Sets (Best of 5)
              </ThemedText>
            </View>
            <View style={styles.setsTable}>
              <View style={styles.setsHeaderRow}>
                <View style={{ flex: 2 }} />
                {setsA.map((_, idx) => (
                  <ThemedText key={idx} type="labelSm" style={{ flex: 1, textAlign: 'center', color: '#ffffffaa' }}>
                    Set {idx + 1}
                  </ThemedText>
                ))}
              </View>

              <View style={styles.setsRow}>
                <ThemedText type="headlineSm" style={{ flex: 2, color: '#ffffff' }}>{teamA}</ThemedText>
                {setsA.map((val, idx) => {
                  const isCurrent = idx === setsA.length - 1;
                  return (
                    <ThemedText
                      key={idx}
                      type="headlineSm"
                      style={{ flex: 1, textAlign: 'center', color: isCurrent ? '#ffffff' : '#ffffffaa', fontFamily: isCurrent ? 'Sora_600SemiBold' : 'Sora_400Regular' }}
                    >
                      {isCurrent ? pointsA : val}
                    </ThemedText>
                  );
                })}
              </View>

              <View style={styles.setsRow}>
                <ThemedText type="headlineSm" style={{ flex: 2, color: '#ffffff' }}>{teamB}</ThemedText>
                {setsB.map((val, idx) => {
                  const isCurrent = idx === setsB.length - 1;
                  return (
                    <ThemedText
                      key={idx}
                      type="headlineSm"
                      style={{ flex: 1, textAlign: 'center', color: isCurrent ? '#ffffff' : '#ffffffaa', fontFamily: isCurrent ? 'Sora_600SemiBold' : 'Sora_400Regular' }}
                    >
                      {isCurrent ? pointsB : val}
                    </ThemedText>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        {/* Point scoring input */}
        <View style={styles.section}>
          <View style={[styles.card, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
            <ThemedText type="labelMd" style={{ color: theme.textSecondary, marginBottom: Spacing.md, letterSpacing: 0.5 }}>
              Point Controllers
            </ThemedText>
            <View style={styles.pointsConsole}>
              {/* Player A Point Column */}
              <View style={styles.pointCol}>
                <View style={styles.headerWithServe}>
                  <ThemedText type="headlineSm">{teamA}</ThemedText>
                  {server === 'A' && (
                    <MaterialCommunityIcons name="volleyball" size={14} color="#ffdd33" style={{ marginLeft: 4 }} />
                  )}
                </View>
                <ThemedText type="displayLg" style={{ fontSize: 60, fontFamily: 'Sora_600SemiBold', marginVertical: Spacing.sm }}>
                  {pointsA}
                </ThemedText>
                <Pressable
                  onPress={() => awardPoint('A')}
                  style={[styles.pointIncrementBtn, { backgroundColor: theme.secondaryContainer }]}
                >
                  <ThemedText type="labelMd" style={{ color: theme.onSecondaryContainer }}>+1 Point</ThemedText>
                </Pressable>
              </View>

              <View style={styles.pointsDivider} />

              {/* Player B Point Column */}
              <View style={styles.pointCol}>
                <View style={styles.headerWithServe}>
                  <ThemedText type="headlineSm">{teamB}</ThemedText>
                  {server === 'B' && (
                    <MaterialCommunityIcons name="volleyball" size={14} color="#ffdd33" style={{ marginLeft: 4 }} />
                  )}
                </View>
                <ThemedText type="displayLg" style={{ fontSize: 60, fontFamily: 'Sora_600SemiBold', marginVertical: Spacing.sm }}>
                  {pointsB}
                </ThemedText>
                <Pressable
                  onPress={() => awardPoint('B')}
                  style={[styles.pointIncrementBtn, { backgroundColor: theme.primaryContainer }]}
                >
                  <ThemedText type="labelMd" style={{ color: '#ffffff' }}>+1 Point</ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        {/* Match Statistics */}
        <View style={styles.section}>
          <View style={[styles.card, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
            <ThemedText type="labelMd" style={{ color: theme.textSecondary, marginBottom: Spacing.md, letterSpacing: 0.5 }}>
              Volleyball Stats Adjuster
            </ThemedText>

            {/* Aces */}
            <View style={styles.statLine}>
              <ThemedText type="bodyMd" style={{ flex: 1 }} numberOfLines={1}>Service Aces</ThemedText>
              <View style={styles.adjustRow}>
                <Pressable onPress={() => setAcesA(prev => Math.max(0, prev - 1))} style={styles.adjustBtn}>
                  <Ionicons name="remove" size={14} color={theme.text} />
                </Pressable>
                <ThemedText style={{ fontSize: 13, textAlign: 'center', fontFamily: 'Sora_600SemiBold', flex: 1 }}>
                  {acesA} | {acesB}
                </ThemedText>
                <Pressable onPress={() => setAcesB(prev => prev + 1)} style={styles.adjustBtn}>
                  <Ionicons name="add" size={14} color={theme.text} />
                </Pressable>
              </View>
              <Pressable onPress={() => setAcesA(prev => prev + 1)} style={styles.quickAddLink}>
                <ThemedText type="labelSm" style={{ color: theme.secondary }} numberOfLines={1} ellipsizeMode="tail">+ {teamA} Ace</ThemedText>
              </Pressable>
            </View>

            {/* Blocks */}
            <View style={[styles.statLine, { marginTop: Spacing.sm }]}>
              <ThemedText type="bodyMd" style={{ flex: 1 }} numberOfLines={1}>Blocks</ThemedText>
              <View style={styles.adjustRow}>
                <Pressable onPress={() => setBlocksA(prev => Math.max(0, prev - 1))} style={styles.adjustBtn}>
                  <Ionicons name="remove" size={14} color={theme.text} />
                </Pressable>
                <ThemedText style={{ fontSize: 13, textAlign: 'center', fontFamily: 'Sora_600SemiBold', flex: 1 }}>
                  {blocksA} | {blocksB}
                </ThemedText>
                <Pressable onPress={() => setBlocksB(prev => prev + 1)} style={styles.adjustBtn}>
                  <Ionicons name="add" size={14} color={theme.text} />
                </Pressable>
              </View>
              <Pressable onPress={() => setBlocksA(prev => prev + 1)} style={styles.quickAddLink}>
                <ThemedText type="labelSm" style={{ color: theme.secondary }} numberOfLines={1} ellipsizeMode="tail">+ {teamA} Block</ThemedText>
              </Pressable>
            </View>

            {/* Errors */}
            <View style={[styles.statLine, { marginTop: Spacing.sm }]}>
              <ThemedText type="bodyMd" style={{ flex: 1 }} numberOfLines={1}>Errors</ThemedText>
              <View style={styles.adjustRow}>
                <Pressable onPress={() => setErrorsA(prev => Math.max(0, prev - 1))} style={styles.adjustBtn}>
                  <Ionicons name="remove" size={14} color={theme.text} />
                </Pressable>
                <ThemedText style={{ fontSize: 13, textAlign: 'center', fontFamily: 'Sora_600SemiBold', flex: 1 }}>
                  {errorsA} | {errorsB}
                </ThemedText>
                <Pressable onPress={() => setErrorsB(prev => prev + 1)} style={styles.adjustBtn}>
                  <Ionicons name="add" size={14} color={theme.text} />
                </Pressable>
              </View>
              <Pressable onPress={() => setErrorsA(prev => prev + 1)} style={styles.quickAddLink}>
                <ThemedText type="labelSm" style={{ color: theme.secondary }} numberOfLines={1} ellipsizeMode="tail">+ {teamA} Err</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons: Undo & End Match (Sticky Bottom) */}
      <View style={[styles.stickyBottomBar, { backgroundColor: theme.surfaceLowest, borderTopColor: theme.outlineVariant + '22' }]}>
        <Pressable
          onPress={handleUndo}
          disabled={history.length === 0}
          style={[styles.undoBtn, { flex: 1, backgroundColor: theme.primaryContainer }, history.length === 0 && { opacity: 0.5 }]}
        >
          <Ionicons name="arrow-undo" size={18} color="#ffffff" style={{ marginRight: 6 }} />
          <ThemedText type="labelMd" style={{ color: '#ffffff' }}>Undo</ThemedText>
        </Pressable>

        <Pressable
          onPress={handleEndMatch}
          disabled={isSyncing}
          style={[styles.endMatchBtn, { flex: 1, backgroundColor: theme.error }, isSyncing && { opacity: 0.7 }]}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Ionicons name="checkmark-done" size={18} color="#ffffff" style={{ marginRight: 6 }} />
              <ThemedText type="labelMd" style={{ color: '#ffffff' }}>End Match</ThemedText>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  bannerWrapper: {
    paddingHorizontal: Spacing.containerMargin,
    marginTop: Spacing.md,
  },
  timerBanner: {
    borderRadius: BorderRadius.xl,
    padding: 12,
    position: 'relative',
    ...Shadows.level2,
  },
  setsTable: {
    flexDirection: 'column',
    marginTop: Spacing.sm,
  },
  setsHeaderRow: {
    flexDirection: 'row',
    marginBottom: Spacing.base,
  },
  setsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  section: {
    marginTop: 14,
    paddingHorizontal: Spacing.containerMargin,
  },
  card: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: 12,
    ...Shadows.level2,
  },
  pointsConsole: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointCol: {
    flex: 1,
    alignItems: 'center',
  },
  headerWithServe: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointIncrementBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.xl,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  pointsDivider: {
    width: 1,
    height: '60%',
    backgroundColor: '#c3c7cb',
    marginHorizontal: Spacing.md,
  },
  statLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#00000008',
  },
  adjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: 90,
    justifyContent: 'center',
  },
  adjustBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#f0f3ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickAddLink: {
    paddingVertical: 4,
    width: 110,
    alignItems: 'flex-end',
  },
  undoBtn: {
    flexDirection: 'row',
    height: 40,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  endMatchBtn: {
    flexDirection: 'row',
    height: 40,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stickyBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.containerMargin,
    paddingTop: Spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? 24 : Spacing.md,
    borderTopWidth: 1,
    zIndex: 100,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
});
