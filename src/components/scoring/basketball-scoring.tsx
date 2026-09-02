import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface PointsEvent {
  quarter: number;
  time: string;
  team: 'A' | 'B';
  type: 'freeThrow' | 'fieldGoal' | 'threePointer' | 'foul';
  points: number;
  playerName: string;
}

export default function BasketballScoring({ teamA = 'Lions FC', teamB = 'Titans Utd' }: { teamA?: string; teamB?: string }) {
  const theme = useTheme();

  // Timer & Quarter state
  const [seconds, setSeconds] = useState(12 * 60); // 12 minutes per quarter
  const [isRunning, setIsRunning] = useState(false);
  const [quarter, setQuarter] = useState(1);

  // Score state
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);

  // Stats state
  const [foulsA, setFoulsA] = useState(0);
  const [foulsB, setFoulsB] = useState(0);
  const [timeoutsA, setTimeoutsA] = useState(0);
  const [timeoutsB, setTimeoutsB] = useState(0);

  // Event log
  const [events, setEvents] = useState<PointsEvent[]>([]);

  // Undo History
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    let interval: any;
    if (isRunning && seconds > 0) {
      interval = setInterval(() => {
        setSeconds(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const saveHistory = () => {
    const state = {
      scoreA,
      scoreB,
      foulsA,
      foulsB,
      timeoutsA,
      timeoutsB,
      events: [...events],
    };
    setHistory(prev => [...prev, state]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setScoreA(prev.scoreA);
    setScoreB(prev.scoreB);
    setFoulsA(prev.foulsA);
    setFoulsB(prev.foulsB);
    setTimeoutsA(prev.timeoutsA);
    setTimeoutsB(prev.timeoutsB);
    setEvents(prev.events);
    setHistory(prevHistory => prevHistory.slice(0, -1));
  };

  const formatTimer = () => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const addScore = (team: 'A' | 'B', type: 'freeThrow' | 'fieldGoal' | 'threePointer', points: number) => {
    saveHistory();
    if (team === 'A') setScoreA(prev => prev + points);
    else setScoreB(prev => prev + points);

    setEvents(prev => [
      {
        quarter,
        time: formatTimer(),
        team,
        type,
        points,
        playerName: team === 'A' ? `${teamA} Shooter` : `${teamB} Shooter`,
      },
      ...prev,
    ]);
  };

  const [isSyncing, setIsSyncing] = useState(false);
  const handleEndMatch = () => {
    Alert.alert(
      'End Match',
      'Are you sure you want to end this match?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'End Match', style: 'destructive', onPress: () => console.log('Match ended') }
      ]
    );
  };

  const addFoul = (team: 'A' | 'B') => {
    saveHistory();
    if (team === 'A') setFoulsA(prev => prev + 1);
    else setFoulsB(prev => prev + 1);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      {/* Live Timer / Quarter Banner */}
      <View style={styles.bannerWrapper}>
        <View style={[styles.timerBanner, { backgroundColor: theme.primaryContainer }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <ThemedText type="labelSm" style={{ color: '#ffffffaa', letterSpacing: 1 }}>
              Quarter {quarter} Timer
            </ThemedText>
          </View>
          <View style={styles.timerRow}>
            <View style={styles.timerBlock}>
              <ThemedText type="displayLg" style={{ color: '#ffffff', fontSize: 38, fontFamily: 'Sora_500Medium', marginTop: 4 }}>
                {formatTimer()}
              </ThemedText>
            </View>
            <View style={styles.timerActions}>
              <Pressable
                onPress={() => {
                  if (seconds > 0) {
                    setIsRunning(!isRunning);
                  }
                }}
                style={[styles.timerBtn, { backgroundColor: isRunning ? theme.error : theme.secondaryContainer }]}
              >
                <Ionicons name={isRunning ? 'pause' : 'play'} size={20} color={isRunning ? '#ffffff' : theme.onSecondaryContainer} />
              </Pressable>
              {/* Quarter Selector */}
              <Pressable
                onPress={() => setQuarter(prev => (prev === 4 ? 1 : prev + 1))}
                style={[styles.timerBtn, { backgroundColor: theme.surfaceLow + '30' }]}
              >
                <ThemedText type="labelSm" style={{ color: '#ffffff', fontWeight: '500' }}>Q{quarter}</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      {/* Main Points Console */}
      <View style={styles.section}>
        <View style={[styles.card, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
          <View style={styles.scoreboardRow}>
            <View style={styles.teamScoreSection}>
              <ThemedText type="headlineSm">{teamA}</ThemedText>
              <ThemedText type="displayLg" style={{ fontSize: 50, fontFamily: 'Sora_500Medium', marginVertical: Spacing.sm }}>
                {scoreA}
              </ThemedText>
              <View style={styles.scoreButtonsRow}>
                <Pressable onPress={() => addScore('A', 'freeThrow', 1)} style={[styles.scoreBtn, { backgroundColor: theme.surfaceLow }]}>
                  <ThemedText type="labelMd">+1</ThemedText>
                </Pressable>
                <Pressable onPress={() => addScore('A', 'fieldGoal', 2)} style={[styles.scoreBtn, { backgroundColor: theme.secondaryContainer }]}>
                  <ThemedText type="labelMd" style={{ color: theme.onSecondaryContainer }}>+2</ThemedText>
                </Pressable>
                <Pressable onPress={() => addScore('A', 'threePointer', 3)} style={[styles.scoreBtn, { backgroundColor: theme.primary }]}>
                  <ThemedText type="labelMd" style={{ color: '#ffffff' }}>+3</ThemedText>
                </Pressable>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.teamScoreSection}>
              <ThemedText type="headlineSm">{teamB}</ThemedText>
              <ThemedText type="displayLg" style={{ fontSize: 50, fontFamily: 'Sora_500Medium', marginVertical: Spacing.sm }}>
                {scoreB}
              </ThemedText>
              <View style={styles.scoreButtonsRow}>
                <Pressable onPress={() => addScore('B', 'freeThrow', 1)} style={[styles.scoreBtn, { backgroundColor: theme.surfaceLow }]}>
                  <ThemedText type="labelMd">+1</ThemedText>
                </Pressable>
                <Pressable onPress={() => addScore('B', 'fieldGoal', 2)} style={[styles.scoreBtn, { backgroundColor: theme.secondaryContainer }]}>
                  <ThemedText type="labelMd" style={{ color: theme.onSecondaryContainer }}>+2</ThemedText>
                </Pressable>
                <Pressable onPress={() => addScore('B', 'threePointer', 3)} style={[styles.scoreBtn, { backgroundColor: theme.primary }]}>
                  <ThemedText type="labelMd" style={{ color: '#ffffff' }}>+3</ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Team Fouls & Timeouts */}
      <View style={styles.section}>
        <View style={styles.statsRow}>
          {/* Team A stats */}
          <View style={[styles.statBox, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
            <ThemedText type="labelSm" style={{ color: theme.textSecondary }} numberOfLines={1} ellipsizeMode="tail">{teamA} Fouls</ThemedText>
            <View style={styles.counterRow}>
              <Pressable onPress={() => setFoulsA(prev => Math.max(0, prev - 1))} style={styles.smallIconBtn}>
                <Ionicons name="remove-circle-outline" size={20} color={theme.text} />
              </Pressable>
              <ThemedText type="headlineSm">{foulsA}</ThemedText>
              <Pressable onPress={() => addFoul('A')} style={styles.smallIconBtn}>
                <Ionicons name="add-circle-outline" size={20} color={theme.text} />
              </Pressable>
            </View>
            <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>Timeouts Left</ThemedText>
            <View style={styles.counterRow}>
              <Pressable onPress={() => setTimeoutsA(prev => Math.max(0, prev - 1))} style={styles.smallIconBtn}>
                <Ionicons name="remove-circle-outline" size={20} color={theme.text} />
              </Pressable>
              <ThemedText type="headlineSm">{timeoutsA}</ThemedText>
              <Pressable onPress={() => setTimeoutsA(prev => prev + 1)} style={styles.smallIconBtn}>
                <Ionicons name="add-circle-outline" size={20} color={theme.text} />
              </Pressable>
            </View>
          </View>

          {/* Team B stats */}
          <View style={[styles.statBox, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
            <ThemedText type="labelSm" style={{ color: theme.textSecondary }} numberOfLines={1} ellipsizeMode="tail">{teamB} Fouls</ThemedText>
            <View style={styles.counterRow}>
              <Pressable onPress={() => setFoulsB(prev => Math.max(0, prev - 1))} style={styles.smallIconBtn}>
                <Ionicons name="remove-circle-outline" size={20} color={theme.text} />
              </Pressable>
              <ThemedText type="headlineSm">{foulsB}</ThemedText>
              <Pressable onPress={() => addFoul('B')} style={styles.smallIconBtn}>
                <Ionicons name="add-circle-outline" size={20} color={theme.text} />
              </Pressable>
            </View>
            <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>Timeouts Left</ThemedText>
            <View style={styles.counterRow}>
              <Pressable onPress={() => setTimeoutsB(prev => Math.max(0, prev - 1))} style={styles.smallIconBtn}>
                <Ionicons name="remove-circle-outline" size={20} color={theme.text} />
              </Pressable>
              <ThemedText type="headlineSm">{timeoutsB}</ThemedText>
              <Pressable onPress={() => setTimeoutsB(prev => prev + 1)} style={styles.smallIconBtn}>
                <Ionicons name="add-circle-outline" size={20} color={theme.text} />
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      {/* Undo Button moved to sticky footer */}

      {/* Scoring Timeline */}
      <View style={[styles.section, { paddingBottom: 120 }]}>
        <View style={[styles.card, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
          <ThemedText type="labelMd" style={{ color: theme.textSecondary, marginBottom: Spacing.md, letterSpacing: 0.5 }}>
            Match Play Log
          </ThemedText>
          <View style={styles.logContainer}>
            {events.map((event, idx) => (
              <View key={idx} style={styles.logItem}>
                <View style={styles.logTimeCol}>
                  <ThemedText type="bodySm" style={{ color: theme.textSecondary }}>Q{event.quarter} - {event.time}</ThemedText>
                </View>
                <View style={styles.logDescCol}>
                  <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_500Medium' }}>
                    {event.points > 0 ? `+${event.points} PTS` : 'FOUL'} - {event.playerName}
                  </ThemedText>
                  <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>
                    {event.team === 'A' ? teamA : teamB} · {event.type === 'threePointer' ? '3 Point Shot' : event.type === 'fieldGoal' ? 'Field Goal' : 'Free Throw'}
                  </ThemedText>
                </View>
              </View>
            ))}
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
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerBlock: {
    flexDirection: 'column',
  },
  timerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  timerBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
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
  scoreboardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamScoreSection: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: '80%',
    backgroundColor: '#c3c7cb',
    marginHorizontal: Spacing.md,
  },
  scoreButtonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  scoreBtn: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    padding: 12,
    alignItems: 'center',
    ...Shadows.level2,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  smallIconBtn: {
    padding: 2,
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
  logContainer: {
    gap: Spacing.sm,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#00000008',
  },
  logTimeCol: {
    width: 80,
  },
  logDescCol: {
    flex: 1,
  },
});
