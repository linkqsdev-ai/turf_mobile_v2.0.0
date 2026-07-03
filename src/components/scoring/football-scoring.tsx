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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface MatchEvent {
  minute: number;
  type: 'goal' | 'yellow' | 'red' | 'save' | 'foul';
  team: 'A' | 'B';
  playerName: string;
  assistName?: string;
}

export default function FootballScoring({ teamA = 'Lions FC', teamB = 'Titans Utd' }: { teamA?: string; teamB?: string }) {
  const theme = useTheme();

  // Timer state
  const [seconds, setSeconds] = useState(0); // Starts at 0 for a new match
  const [isRunning, setIsRunning] = useState(false);

  // Score state
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);

  // Stats state
  const [possessionA, setPossessionA] = useState(50); // Balanced 50% start
  const [shotsA, setShotsA] = useState(0);
  const [shotsB, setShotsB] = useState(0);
  const [cornersA, setCornersA] = useState(0);
  const [cornersB, setCornersB] = useState(0);
  const [foulsA, setFoulsA] = useState(0);
  const [foulsB, setFoulsB] = useState(0);
  const [yellowA, setYellowA] = useState(0);
  const [yellowB, setYellowB] = useState(0);
  const [redA, setRedA] = useState(0);
  const [redB, setRedB] = useState(0);

  // Event Log
  const [events, setEvents] = useState<MatchEvent[]>([]);

  // Undo History
  const [history, setHistory] = useState<any[]>([]);
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

  useEffect(() => {
    let interval: any;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const currentMinute = Math.floor(seconds / 60);

  const saveHistory = () => {
    const state = {
      scoreA,
      scoreB,
      possessionA,
      shotsA,
      shotsB,
      cornersA,
      cornersB,
      foulsA,
      foulsB,
      yellowA,
      yellowB,
      redA,
      redB,
      events: [...events],
    };
    setHistory(prev => [...prev, state]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setScoreA(prev.scoreA);
    setScoreB(prev.scoreB);
    setPossessionA(prev.possessionA);
    setShotsA(prev.shotsA);
    setShotsB(prev.shotsB);
    setCornersA(prev.cornersA);
    setCornersB(prev.cornersB);
    setFoulsA(prev.foulsA);
    setFoulsB(prev.foulsB);
    setYellowA(prev.yellowA);
    setYellowB(prev.yellowB);
    setRedA(prev.redA);
    setRedB(prev.redB);
    setEvents(prev.events);
    setHistory(prevHistory => prevHistory.slice(0, -1));
  };

  const addGoal = (team: 'A' | 'B') => {
    saveHistory();
    const promptTitle = team === 'A' ? `${teamA} Goal` : `${teamB} Goal`;
    Alert.prompt(
      promptTitle,
      'Enter Scorer Name:',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: (scorer?: string) => {
            const scorerName = scorer || 'Player';
            if (team === 'A') {
              setScoreA(prev => prev + 1);
            } else {
              setScoreB(prev => prev + 1);
            }
            setEvents(prev => [
              {
                minute: currentMinute,
                type: 'goal',
                team,
                playerName: scorerName,
              },
              ...prev,
            ]);
          },
        },
      ],
      'plain-text'
    );
  };

  const addCard = (team: 'A' | 'B', cardType: 'yellow' | 'red') => {
    saveHistory();
    Alert.prompt(
      cardType === 'yellow' ? 'Yellow Card' : 'Red Card',
      'Enter Player Name:',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: (player?: string) => {
            const playerName = player || 'Player';
            if (cardType === 'yellow') {
              if (team === 'A') setYellowA(prev => prev + 1);
              else setYellowB(prev => prev + 1);
            } else {
              if (team === 'A') setRedA(prev => prev + 1);
              else setRedB(prev => prev + 1);
            }
            setEvents(prev => [
              {
                minute: currentMinute,
                type: cardType,
                team,
                playerName,
              },
              ...prev,
            ]);
          },
        },
      ],
      'plain-text'
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      {/* Live Timer Controls Banner */}
      <View style={styles.bannerWrapper}>
        <View style={[styles.timerBanner, { backgroundColor: theme.primaryContainer }]}>
          <View style={styles.timerRow}>
            <View style={styles.timerBlock}>
              <ThemedText type="labelSm" style={{ color: '#ffffffaa', letterSpacing: 1 }}>
                Match Time
              </ThemedText>
              <ThemedText type="displayLg" style={{ color: '#ffffff', fontSize: 40, fontFamily: 'HankenGrotesk_800ExtraBold', marginTop: 4 }}>
                {String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}
              </ThemedText>
            </View>
            <View style={styles.timerActions}>
              <Pressable
                onPress={() => setIsRunning(!isRunning)}
                style={[styles.timerBtn, { backgroundColor: isRunning ? theme.error : theme.secondaryContainer }]}
              >
                <Ionicons name={isRunning ? 'pause' : 'play'} size={20} color={isRunning ? '#ffffff' : theme.onSecondaryContainer} />
              </Pressable>
              <Pressable
                onPress={() => {
                  setIsRunning(false);
                  setSeconds(0);
                }}
                style={[styles.timerBtn, { backgroundColor: theme.surfaceLow + '30' }]}
              >
                <Ionicons name="refresh" size={20} color="#ffffff" />
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      {/* Main Scoring Console */}
      <View style={styles.section}>
        <View style={[styles.card, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
            <ThemedText type="labelMd" style={{ color: theme.textSecondary, letterSpacing: 0.5 }}>
              Scores & Goals
            </ThemedText>
            <View style={styles.liveBadgeAbsolute}>
              <View style={styles.liveDotRed} />
              <ThemedText style={styles.liveText}>Live</ThemedText>
            </View>
          </View>
          <View style={styles.teamsRow}>
            {/* Team A Goal Button */}
            <View style={styles.teamCol}>
              <ThemedText type="headlineSm" style={{ textAlign: 'center', marginBottom: Spacing.sm }}>
                {teamA}
              </ThemedText>
              <Pressable
                onPress={() => addGoal('A')}
                style={({ pressed }) => [
                  styles.goalButton,
                  { backgroundColor: theme.secondaryContainer, borderColor: theme.onSecondaryContainer },
                  pressed ? styles.scoringButtonPressed : styles.scoringButtonNormal,
                ]}
              >
                <ThemedText type="displayLg" style={{ color: theme.onSecondaryContainer }}>{scoreA}</ThemedText>
                <ThemedText type="labelSm" style={{ color: theme.onSecondaryContainer + 'bb', marginTop: 2 }}>+ GOAL</ThemedText>
              </Pressable>
            </View>

            <View style={styles.vsContainer}>
              <ThemedText type="headlineMd" style={{ color: theme.textSecondary }}>:</ThemedText>
            </View>

            {/* Team B Goal Button */}
            <View style={styles.teamCol}>
              <ThemedText type="headlineSm" style={{ textAlign: 'center', marginBottom: Spacing.sm }}>
                {teamB}
              </ThemedText>
              <Pressable
                onPress={() => addGoal('B')}
                style={({ pressed }) => [
                  styles.goalButton,
                  { backgroundColor: theme.primaryContainer, borderColor: theme.primary },
                  pressed ? styles.scoringButtonPressed : styles.scoringButtonNormal,
                ]}
              >
                <ThemedText type="displayLg" style={{ color: '#ffffff' }}>{scoreB}</ThemedText>
                <ThemedText type="labelSm" style={{ color: theme.onPrimaryContainer, marginTop: 2 }}>+ GOAL</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      {/* Statistics Management Bento Grid */}
      <View style={styles.section}>
        <View style={[styles.card, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
          <ThemedText type="labelMd" style={{ color: theme.textSecondary, marginBottom: Spacing.md, letterSpacing: 0.5 }}>
            Match Stats Adjuster
          </ThemedText>

          {/* Possession Bar */}
          <View style={styles.statAdjusterRow}>
            <View style={styles.statLabelRow}>
              <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>Possession</ThemedText>
              <ThemedText type="bodyMd" style={{ color: theme.secondaryContainer, fontFamily: 'HankenGrotesk_700Bold' }}>{possessionA}% - {100 - possessionA}%</ThemedText>
            </View>
            <View style={styles.sliderButtons}>
              <Pressable
                onPress={() => setPossessionA(prev => Math.max(0, prev - 1))}
                style={[styles.smallAdjustBtn, { backgroundColor: theme.surfaceLow }]}
              >
                <Ionicons name="remove" size={16} color={theme.text} />
              </Pressable>
              <View style={styles.sliderTrack}>
                <View style={[styles.sliderFill, { width: `${possessionA}%`, backgroundColor: theme.secondaryContainer }]} />
              </View>
              <Pressable
                onPress={() => setPossessionA(prev => Math.min(100, prev + 1))}
                style={[styles.smallAdjustBtn, { backgroundColor: theme.surfaceLow }]}
              >
                <Ionicons name="add" size={16} color={theme.text} />
              </Pressable>
            </View>
          </View>

          {/* Quick Counter Row: Shots, Corners, Fouls */}
          <View style={styles.counterGrid}>
            {/* Shots */}
            <View style={[styles.counterBox, { backgroundColor: theme.surfaceLow }]}>
              <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Shots</ThemedText>
              <View style={[styles.boxActionRow, { gap: 4, justifyContent: 'center', width: '100%' }]}>
                <Pressable onPress={() => setShotsA(prev => Math.max(0, prev - 1))} style={styles.iconBtn}>
                  <Ionicons name="remove-circle-outline" size={16} color={theme.text} />
                </Pressable>
                <ThemedText style={{ fontSize: 13, fontFamily: 'HankenGrotesk_700Bold' }}>{shotsA}|{shotsB}</ThemedText>
                <Pressable onPress={() => setShotsB(prev => prev + 1)} style={styles.iconBtn}>
                  <Ionicons name="add-circle-outline" size={16} color={theme.text} />
                </Pressable>
              </View>
              <Pressable onPress={() => setShotsA(prev => prev + 1)} style={styles.quickAddBtn}>
                <ThemedText type="labelSm" style={{ color: theme.secondary }}>+ Shot A</ThemedText>
              </Pressable>
            </View>

            {/* Corners */}
            <View style={[styles.counterBox, { backgroundColor: theme.surfaceLow }]}>
              <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Corners</ThemedText>
              <View style={[styles.boxActionRow, { gap: 4, justifyContent: 'center', width: '100%' }]}>
                <Pressable onPress={() => setCornersA(prev => Math.max(0, prev - 1))} style={styles.iconBtn}>
                  <Ionicons name="remove-circle-outline" size={16} color={theme.text} />
                </Pressable>
                <ThemedText style={{ fontSize: 13, fontFamily: 'HankenGrotesk_700Bold' }}>{cornersA}|{cornersB}</ThemedText>
                <Pressable onPress={() => setCornersB(prev => prev + 1)} style={styles.iconBtn}>
                  <Ionicons name="add-circle-outline" size={16} color={theme.text} />
                </Pressable>
              </View>
              <Pressable onPress={() => setCornersA(prev => prev + 1)} style={styles.quickAddBtn}>
                <ThemedText type="labelSm" style={{ color: theme.secondary }}>+ Corner A</ThemedText>
              </Pressable>
            </View>

            {/* Fouls */}
            <View style={[styles.counterBox, { backgroundColor: theme.surfaceLow }]}>
              <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Fouls</ThemedText>
              <View style={[styles.boxActionRow, { gap: 4, justifyContent: 'center', width: '100%' }]}>
                <Pressable onPress={() => setFoulsA(prev => Math.max(0, prev - 1))} style={styles.iconBtn}>
                  <Ionicons name="remove-circle-outline" size={16} color={theme.text} />
                </Pressable>
                <ThemedText style={{ fontSize: 13, fontFamily: 'HankenGrotesk_700Bold' }}>{foulsA}|{foulsB}</ThemedText>
                <Pressable onPress={() => setFoulsB(prev => prev + 1)} style={styles.iconBtn}>
                  <Ionicons name="add-circle-outline" size={16} color={theme.text} />
                </Pressable>
              </View>
              <Pressable onPress={() => setFoulsA(prev => prev + 1)} style={styles.quickAddBtn}>
                <ThemedText type="labelSm" style={{ color: theme.secondary }}>+ Foul A</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      {/* Cards & Discipline Control */}
      <View style={styles.section}>
        <View style={styles.disciplineRow}>
          {/* Yellow Card buttons */}
          <Pressable
            onPress={() => addCard('A', 'yellow')}
            style={[styles.disciplineBtn, { borderLeftColor: '#f1c40f', borderLeftWidth: 4, backgroundColor: theme.surfaceLowest }]}
          >
            <MaterialCommunityIcons name="cards-playing-outline" size={20} color="#f1c40f" />
            <ThemedText type="labelMd" style={{ color: theme.text, marginLeft: 8 }}>+ {teamA} Yellow</ThemedText>
          </Pressable>

          <Pressable
            onPress={() => addCard('B', 'yellow')}
            style={[styles.disciplineBtn, { borderLeftColor: '#f1c40f', borderLeftWidth: 4, backgroundColor: theme.surfaceLowest }]}
          >
            <MaterialCommunityIcons name="cards-playing-outline" size={20} color="#f1c40f" />
            <ThemedText type="labelMd" style={{ color: theme.text, marginLeft: 8 }}>+ {teamB} Yellow</ThemedText>
          </Pressable>
        </View>

        <View style={[styles.disciplineRow, { marginTop: Spacing.sm }]}>
          {/* Red Card buttons */}
          <Pressable
            onPress={() => addCard('A', 'red')}
            style={[styles.disciplineBtn, { borderLeftColor: theme.error, borderLeftWidth: 4, backgroundColor: theme.surfaceLowest }]}
          >
            <MaterialCommunityIcons name="cards-playing-outline" size={20} color={theme.error} />
            <ThemedText type="labelMd" style={{ color: theme.text, marginLeft: 8 }}>+ {teamA} Red</ThemedText>
          </Pressable>

          <Pressable
            onPress={() => addCard('B', 'red')}
            style={[styles.disciplineBtn, { borderLeftColor: theme.error, borderLeftWidth: 4, backgroundColor: theme.surfaceLowest }]}
          >
            <MaterialCommunityIcons name="cards-playing-outline" size={20} color={theme.error} />
            <ThemedText type="labelMd" style={{ color: theme.text, marginLeft: 8 }}>+ {teamB} Red</ThemedText>
          </Pressable>
        </View>
      </View>

      {/* (Action Buttons moved to sticky footer) */}

      {/* Match Events Timeline */}
      <View style={[styles.section, { paddingBottom: 120 }]}>
        <View style={[styles.card, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
          <ThemedText type="labelMd" style={{ color: theme.textSecondary, marginBottom: Spacing.md, letterSpacing: 0.5 }}>
            Match Timeline
          </ThemedText>
          
          <View style={styles.timelineList}>
            {events.map((event, idx) => {
              const isGoal = event.type === 'goal';
              const isCard = event.type === 'yellow' || event.type === 'red';
              return (
                <View key={idx} style={styles.timelineItem}>
                  <View style={styles.timelineTimeCol}>
                    <ThemedText type="headlineSm" style={{ color: theme.secondary }}>{event.minute}{"'"}</ThemedText>
                  </View>
                  <View style={[styles.timelineIconCol, { backgroundColor: isGoal ? theme.secondaryContainer + '20' : theme.surfaceLow }]}>
                    <Ionicons
                      name={isGoal ? 'football' : 'card'}
                      size={16}
                      color={isGoal ? theme.secondaryContainer : event.type === 'yellow' ? '#f1c40f' : theme.error}
                    />
                  </View>
                  <View style={styles.timelineDescCol}>
                    <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>
                      {isGoal ? 'GOAL!' : event.type === 'yellow' ? 'Yellow Card' : 'Red Card'}
                    </ThemedText>
                    <ThemedText type="bodySm" style={{ color: theme.textSecondary }}>
                      {event.playerName} ({event.team === 'A' ? teamA : teamB})
                      {event.assistName ? ` · Assist: ${event.assistName}` : ''}
                    </ThemedText>
                  </View>
                </View>
              );
            })}
            {events.length === 0 && (
              <ThemedText type="bodyMd" style={{ color: theme.textSecondary, textAlign: 'center', paddingVertical: Spacing.md }}>
                No events recorded. Kickoff the match!
              </ThemedText>
            )}
          </View>
        </View>
      </View>
    </ScrollView>

      {/* Action Buttons: Undo & End Match (Sticky Bottom) */}
      <View style={[styles.stickyBottomBar, { backgroundColor: theme.surfaceLowest, borderTopColor: theme.outlineVariant + '22' }]}>
        <Pressable
          onPress={handleUndo}
          disabled={history.length === 0}
          style={[styles.undoButton, { flex: 1, backgroundColor: theme.primaryContainer }, history.length === 0 && { opacity: 0.5 }]}
        >
          <Ionicons name="arrow-undo" size={18} color="#ffffff" style={{ marginRight: 6 }} />
          <ThemedText type="labelMd" style={{ color: '#ffffff' }}>Undo</ThemedText>
        </Pressable>

        <Pressable
          onPress={handleEndMatch}
          disabled={isSyncing}
          style={[styles.endMatchButton, { flex: 1, backgroundColor: theme.error }, isSyncing && { opacity: 0.7 }]}
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
  teamsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  teamCol: {
    flex: 1,
    alignItems: 'center',
  },
  vsContainer: {
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  scoringButtonNormal: {
    borderBottomWidth: 4,
  },
  scoringButtonPressed: {
    borderBottomWidth: 1,
    transform: [{ translateY: 3 }],
  },
  statAdjusterRow: {
    marginBottom: Spacing.md,
  },
  statLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  sliderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  smallAdjustBtn: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.default,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
  },
  counterGrid: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  counterBox: {
    flex: 1,
    borderRadius: BorderRadius.xl,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 110,
    ...Shadows.level2,
  },
  boxActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xs,
  },
  iconBtn: {
    padding: 2,
  },
  quickAddBtn: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#ffffff80',
  },
  disciplineRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  disciplineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: '#c3c7cb33',
    ...Shadows.level2,
  },
  undoButton: {
    flexDirection: 'row',
    height: 40,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  endMatchButton: {
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
  timelineList: {
    gap: Spacing.md,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineTimeCol: {
    width: 40,
  },
  timelineIconCol: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.default,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  timelineDescCol: {
    flex: 1,
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
