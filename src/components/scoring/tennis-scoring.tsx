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

export default function TennisScoring({ matchId, teamA = 'Lions FC', teamB = 'Titans Utd' }: { matchId?: string; teamA?: string; teamB?: string }) {
  const theme = useTheme();
  const router = useRouter();

  // Set scores: Array of sets [setA, setB]
  const [setsA, setSetsA] = useState<number[]>([]);
  const [setsB, setSetsB] = useState<number[]>([]);

  // Current Game Games Score
  const [gamesA, setGamesA] = useState(0);
  const [gamesB, setGamesB] = useState(0);

  // Current Game Points Score: index map (0 = 0, 1 = 15, 2 = 30, 3 = 40, 4 = Ad)
  const [pointsA, setPointsA] = useState(0); 
  const [pointsB, setPointsB] = useState(0); 

  // Server state
  const [server, setServer] = useState<'A' | 'B'>('A');

  // Stats counters
  const [acesA, setAcesA] = useState(0);
  const [acesB, setAcesB] = useState(0);
  const [doubleFaultsA, setDoubleFaultsA] = useState(0);
  const [doubleFaultsB, setDoubleFaultsB] = useState(0);
  const [unforcedErrorsA, setUnforcedErrorsA] = useState(0);
  const [unforcedErrorsB, setUnforcedErrorsB] = useState(0);

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
              if (gamesA > gamesB) setsWonA++;
              else if (gamesB > gamesA) setsWonB++;

              await matchApi.completeMatch(matchId, {
                homeScore: setsWonA,
                awayScore: setsWonB,
                events: [
                  {
                    minute: 90,
                    type: 'stats',
                    team: 'home',
                    playerName: 'Match Stats',
                    metadata: { acesA, acesB, doubleFaultsA, doubleFaultsB, unforcedErrorsA, unforcedErrorsB },
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
      gamesA,
      gamesB,
      pointsA,
      pointsB,
      server,
      acesA,
      acesB,
      doubleFaultsA,
      doubleFaultsB,
      unforcedErrorsA,
      unforcedErrorsB,
    };
    setHistory(prev => [...prev, state]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setSetsA(prev.setsA);
    setSetsB(prev.setsB);
    setGamesA(prev.gamesA);
    setGamesB(prev.gamesB);
    setPointsA(prev.pointsA);
    setPointsB(prev.pointsB);
    setServer(prev.server);
    setAcesA(prev.acesA);
    setAcesB(prev.acesB);
    setDoubleFaultsA(prev.doubleFaultsA);
    setDoubleFaultsB(prev.doubleFaultsB);
    setUnforcedErrorsA(prev.unforcedErrorsA);
    setUnforcedErrorsB(prev.unforcedErrorsB);
    setHistory(prevHistory => prevHistory.slice(0, -1));
  };

  const pointLabel = (pts: number) => {
    const labels = ['0', '15', '30', '40', 'Ad'];
    return labels[pts] || '0';
  };

  const winGame = (winner: 'A' | 'B') => {
    // Reset points
    setPointsA(0);
    setPointsB(0);
    // Switch server
    setServer(prev => (prev === 'A' ? 'B' : 'A'));

    if (winner === 'A') {
      const nextGames = gamesA + 1;
      if (nextGames >= 6 && nextGames - gamesB >= 2) {
        // Set completed
        setSetsA(prev => {
          const nextSets = [...prev];
          nextSets[nextSets.length - 1] = nextGames;
          nextSets.push(0); // Add next set slot
          return nextSets;
        });
        setSetsB(prev => [...prev, 0]);
        setGamesA(0);
        setGamesB(0);
      } else {
        setGamesA(nextGames);
      }
    } else {
      const nextGames = gamesB + 1;
      if (nextGames >= 6 && nextGames - gamesA >= 2) {
        // Set completed
        setSetsB(prev => {
          const nextSets = [...prev];
          nextSets[nextSets.length - 1] = nextGames;
          nextSets.push(0);
          return nextSets;
        });
        setSetsA(prev => [...prev, 0]);
        setGamesA(0);
        setGamesB(0);
      } else {
        setGamesB(nextGames);
      }
    }
  };

  const awardPoint = (player: 'A' | 'B') => {
    saveHistory();
    if (player === 'A') {
      if (pointsA === 3 && pointsB < 3) {
        // A wins game (from 40-0, 40-15, or 40-30)
        winGame('A');
      } else if (pointsA === 3 && pointsB === 3) {
        // A goes to Ad (from 40-40)
        setPointsA(4);
      } else if (pointsA === 3 && pointsB === 4) {
        // B had Ad, goes back to Deuce (40-40)
        setPointsB(3);
      } else if (pointsA === 4) {
        // A wins game (from Ad-40)
        winGame('A');
      } else {
        // standard point increment
        setPointsA(prev => prev + 1);
      }
    } else {
      if (pointsB === 3 && pointsA < 3) {
        // B wins game
        winGame('B');
      } else if (pointsB === 3 && pointsA === 3) {
        // B goes to Ad
        setPointsB(4);
      } else if (pointsB === 3 && pointsA === 4) {
        // A had Ad, goes back to Deuce
        setPointsA(3);
      } else if (pointsB === 4) {
        // B wins game
        winGame('B');
      } else {
        setPointsB(prev => prev + 1);
      }
    }
  };

  const toggleServer = () => {
    saveHistory();
    setServer(prev => (prev === 'A' ? 'B' : 'A'));
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Scoreboard Banner */}
        <View style={styles.bannerWrapper}>
          <View style={[styles.scoreboardBanner, { backgroundColor: theme.primaryContainer }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <ThemedText type="labelSm" style={{ color: '#ffffffaa', letterSpacing: 1 }}>
                Tennis Match Sets (Best of 3 Sets)
              </ThemedText>
              <View style={styles.liveBadgeAbsolute}>
                <View style={styles.liveDotRed} />
                <ThemedText style={styles.liveText}>Live</ThemedText>
              </View>
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
                      style={{ flex: 1, textAlign: 'center', color: isCurrent ? '#ffffff' : '#ffffffaa', fontFamily: isCurrent ? 'HankenGrotesk_700Bold' : 'HankenGrotesk_400Regular' }}
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
                      style={{ flex: 1, textAlign: 'center', color: isCurrent ? '#ffffff' : '#ffffffaa', fontFamily: isCurrent ? 'HankenGrotesk_700Bold' : 'HankenGrotesk_400Regular' }}
                    >
                      {isCurrent ? pointsB : val}
                    </ThemedText>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        {/* Serve Toggle & Active Controller */}
        <View style={styles.section}>
          <View style={[styles.card, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
            <ThemedText type="labelMd" style={{ color: theme.textSecondary, marginBottom: Spacing.md, letterSpacing: 0.5 }}>
              Match Point Controller
            </ThemedText>
            <View style={styles.pointsConsole}>
              {/* Player A Point Column */}
              <View style={styles.pointCol}>
                <View style={styles.headerWithServe}>
                  <ThemedText type="headlineSm">{teamA}</ThemedText>
                  {server === 'A' && (
                    <MaterialCommunityIcons name="tennis-ball" size={14} color="#ccff00" style={{ marginLeft: 4 }} />
                  )}
                </View>
                <ThemedText type="displayLg" style={{ fontSize: 60, fontFamily: 'HankenGrotesk_800ExtraBold', marginVertical: Spacing.sm }}>
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
                    <MaterialCommunityIcons name="tennis-ball" size={14} color="#ccff00" style={{ marginLeft: 4 }} />
                  )}
                </View>
                <ThemedText type="displayLg" style={{ fontSize: 60, fontFamily: 'HankenGrotesk_800ExtraBold', marginVertical: Spacing.sm }}>
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

            {/* Quick Serve Toggle */}
            <View style={{ marginTop: Spacing.md, borderTopWidth: 1, borderTopColor: '#00000005', paddingTop: Spacing.md }}>
              <Pressable
                onPress={toggleServer}
                style={[styles.serveToggleBtn, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33', borderWidth: 1 }]}
              >
                <Ionicons name="swap-horizontal" size={16} color={theme.text} style={{ marginRight: 6 }} />
                <ThemedText type="labelSm">Change Server (Active: {server === 'A' ? teamA : teamB})</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Match Statistics */}
        <View style={styles.section}>
          <View style={[styles.card, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
            <ThemedText type="labelMd" style={{ color: theme.textSecondary, marginBottom: Spacing.md, letterSpacing: 0.5 }}>
              Tennis Stats Adjuster
            </ThemedText>

            {/* Aces */}
            <View style={styles.statLine}>
              <ThemedText type="bodyMd" style={{ flex: 1 }} numberOfLines={1}>Service Aces</ThemedText>
              <View style={styles.adjustRow}>
                <Pressable onPress={() => setAcesA(prev => Math.max(0, prev - 1))} style={styles.adjustBtn}>
                  <Ionicons name="remove" size={14} color={theme.text} />
                </Pressable>
                <ThemedText style={{ fontSize: 13, textAlign: 'center', fontFamily: 'HankenGrotesk_700Bold', flex: 1 }}>
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

            {/* Double Faults */}
            <View style={[styles.statLine, { marginTop: Spacing.sm }]}>
              <ThemedText type="bodyMd" style={{ flex: 1 }} numberOfLines={1}>Double Faults</ThemedText>
              <View style={styles.adjustRow}>
                <Pressable onPress={() => setDoubleFaultsA(prev => Math.max(0, prev - 1))} style={styles.adjustBtn}>
                  <Ionicons name="remove" size={14} color={theme.text} />
                </Pressable>
                <ThemedText style={{ fontSize: 13, textAlign: 'center', fontFamily: 'HankenGrotesk_700Bold', flex: 1 }}>
                  {doubleFaultsA} | {doubleFaultsB}
                </ThemedText>
                <Pressable onPress={() => setDoubleFaultsB(prev => prev + 1)} style={styles.adjustBtn}>
                  <Ionicons name="add" size={14} color={theme.text} />
                </Pressable>
              </View>
              <Pressable onPress={() => setDoubleFaultsA(prev => prev + 1)} style={styles.quickAddLink}>
                <ThemedText type="labelSm" style={{ color: theme.secondary }} numberOfLines={1} ellipsizeMode="tail">+ {teamA} D-Fault</ThemedText>
              </Pressable>
            </View>

            {/* Unforced Errors */}
            <View style={[styles.statLine, { marginTop: Spacing.sm }]}>
              <ThemedText type="bodyMd" style={{ flex: 1 }} numberOfLines={1}>Errors</ThemedText>
              <View style={styles.adjustRow}>
                <Pressable onPress={() => setUnforcedErrorsA(prev => Math.max(0, prev - 1))} style={styles.adjustBtn}>
                  <Ionicons name="remove" size={14} color={theme.text} />
                </Pressable>
                <ThemedText style={{ fontSize: 13, textAlign: 'center', fontFamily: 'HankenGrotesk_700Bold', flex: 1 }}>
                  {unforcedErrorsA} | {unforcedErrorsB}
                </ThemedText>
                <Pressable onPress={() => setUnforcedErrorsB(prev => prev + 1)} style={styles.adjustBtn}>
                  <Ionicons name="add" size={14} color={theme.text} />
                </Pressable>
              </View>
              <Pressable onPress={() => setUnforcedErrorsA(prev => prev + 1)} style={styles.quickAddLink}>
                <ThemedText type="labelSm" style={{ color: theme.secondary }} numberOfLines={1} ellipsizeMode="tail">+ {teamA} Error</ThemedText>
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
  scoreboardBanner: {
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
  serveToggleBtn: {
    flexDirection: 'row',
    height: 38,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
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
  liveBadgeAbsolute: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff1744',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  liveDotRed: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ffffff',
  },
  liveText: {
    color: '#ffffff',
    fontSize: 8,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
