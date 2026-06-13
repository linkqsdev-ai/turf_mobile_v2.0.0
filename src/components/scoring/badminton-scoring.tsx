import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function BadmintonScoring() {
  const theme = useTheme();

  // Set scores (Best of 3)
  const [setsA, setSetsA] = useState<number[]>([21, 12]);
  const [setsB, setSetsB] = useState<number[]>([18, 15]);

  // Current points (0-21, or deuce)
  const [pointsA, setPointsA] = useState(12);
  const [pointsB, setPointsB] = useState(15);

  // Serve Indicator
  const [server, setServer] = useState<'A' | 'B'>('B');

  // Stats
  const [smashWinnersA, setSmashWinnersA] = useState(8);
  const [smashWinnersB, setSmashWinnersB] = useState(6);
  const [serviceErrorsA, setServiceErrorsA] = useState(1);
  const [serviceErrorsB, setServiceErrorsB] = useState(3);

  // Undo History
  const [history, setHistory] = useState<any[]>([]);

  const saveHistory = () => {
    const state = {
      setsA: [...setsA],
      setsB: [...setsB],
      pointsA,
      pointsB,
      server,
      smashWinnersA,
      smashWinnersB,
      serviceErrorsA,
      serviceErrorsB,
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
    setSmashWinnersA(prev.smashWinnersA);
    setSmashWinnersB(prev.smashWinnersB);
    setServiceErrorsA(prev.serviceErrorsA);
    setServiceErrorsB(prev.serviceErrorsB);
    setHistory(prevHistory => prevHistory.slice(0, -1));
  };

  const winSet = (winner: 'A' | 'B', finalPointsA: number, finalPointsB: number) => {
    setPointsA(0);
    setPointsB(0);
    
    if (winner === 'A') {
      setSetsA(prev => {
        const nextSets = [...prev];
        nextSets[nextSets.length - 1] = finalPointsA;
        if (nextSets.length < 3) nextSets.push(0);
        return nextSets;
      });
      setSetsB(prev => {
        const nextSets = [...prev];
        nextSets[nextSets.length - 1] = finalPointsB;
        if (nextSets.length < 3) nextSets.push(0);
        return nextSets;
      });
    } else {
      setSetsB(prev => {
        const nextSets = [...prev];
        nextSets[nextSets.length - 1] = finalPointsB;
        if (nextSets.length < 3) nextSets.push(0);
        return nextSets;
      });
      setSetsA(prev => {
        const nextSets = [...prev];
        nextSets[nextSets.length - 1] = finalPointsA;
        if (nextSets.length < 3) nextSets.push(0);
        return nextSets;
      });
    }
  };

  const awardPoint = (player: 'A' | 'B') => {
    saveHistory();
    // Server is set to player who won point
    setServer(player);

    const nextA = player === 'A' ? pointsA + 1 : pointsA;
    const nextB = player === 'B' ? pointsB + 1 : pointsB;

    // Badminton rule: Winner is first to 21. If 20-20, must win by 2 up to max of 30 points.
    const hasWon = (score: number, opponent: number) => {
      if (score >= 21 && score - opponent >= 2) return true;
      if (score === 30) return true;
      return false;
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
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      {/* Set Score Banner */}
      <View style={styles.bannerWrapper}>
        <View style={[styles.timerBanner, { backgroundColor: theme.primaryContainer }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <ThemedText type="labelSm" style={{ color: '#ffffffaa', letterSpacing: 1 }}>
              Badminton Match Sets (Best of 3)
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
              <ThemedText type="headlineSm" style={{ flex: 2, color: '#ffffff' }}>Lions FC</ThemedText>
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
              <ThemedText type="headlineSm" style={{ flex: 2, color: '#ffffff' }}>Titans Utd</ThemedText>
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
                <ThemedText type="headlineSm">Lions FC</ThemedText>
                {server === 'A' && (
                  <MaterialCommunityIcons name="badminton" size={14} color="#ffdd33" style={{ marginLeft: 4 }} />
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
                <ThemedText type="headlineSm">Titans Utd</ThemedText>
                {server === 'B' && (
                  <MaterialCommunityIcons name="badminton" size={14} color="#ffdd33" style={{ marginLeft: 4 }} />
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
        </View>
      </View>

      {/* Match Statistics */}
      <View style={styles.section}>
        <View style={[styles.card, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
          <ThemedText type="labelMd" style={{ color: theme.textSecondary, marginBottom: Spacing.md, letterSpacing: 0.5 }}>
            Badminton Stats Adjuster
          </ThemedText>

          {/* Smash Winners */}
          <View style={styles.statLine}>
            <ThemedText type="bodyMd" style={{ width: 100 }}>Smash Winners</ThemedText>
            <View style={styles.adjustRow}>
              <Pressable onPress={() => setSmashWinnersA(prev => Math.max(0, prev - 1))} style={styles.adjustBtn}>
                <Ionicons name="remove" size={14} color={theme.text} />
              </Pressable>
              <ThemedText type="bodyLg" style={{ minWidth: 40, textAlign: 'center', fontFamily: 'HankenGrotesk_700Bold' }}>
                {smashWinnersA} | {smashWinnersB}
              </ThemedText>
              <Pressable onPress={() => setSmashWinnersB(prev => prev + 1)} style={styles.adjustBtn}>
                <Ionicons name="add" size={14} color={theme.text} />
              </Pressable>
            </View>
            <Pressable onPress={() => setSmashWinnersA(prev => prev + 1)} style={styles.quickAddLink}>
              <ThemedText type="labelSm" style={{ color: theme.secondary }}>+ Lions Smash</ThemedText>
            </Pressable>
          </View>

          {/* Service Errors */}
          <View style={[styles.statLine, { marginTop: Spacing.sm }]}>
            <ThemedText type="bodyMd" style={{ width: 100 }}>Service Errors</ThemedText>
            <View style={styles.adjustRow}>
              <Pressable onPress={() => setServiceErrorsA(prev => Math.max(0, prev - 1))} style={styles.adjustBtn}>
                <Ionicons name="remove" size={14} color={theme.text} />
              </Pressable>
              <ThemedText type="bodyLg" style={{ minWidth: 40, textAlign: 'center', fontFamily: 'HankenGrotesk_700Bold' }}>
                {serviceErrorsA} | {serviceErrorsB}
              </ThemedText>
              <Pressable onPress={() => setServiceErrorsB(prev => prev + 1)} style={styles.adjustBtn}>
                <Ionicons name="add" size={14} color={theme.text} />
              </Pressable>
            </View>
            <Pressable onPress={() => setServiceErrorsA(prev => prev + 1)} style={styles.quickAddLink}>
              <ThemedText type="labelSm" style={{ color: theme.secondary }}>+ Lions Err</ThemedText>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Undo/Reset */}
      <View style={[styles.section, { paddingBottom: 100 }]}>
        <Pressable
          onPress={handleUndo}
          disabled={history.length === 0}
          style={[styles.undoBtn, { backgroundColor: theme.primaryContainer }, history.length === 0 && { opacity: 0.5 }]}
        >
          <Ionicons name="arrow-undo" size={20} color="#ffffff" style={{ marginRight: 8 }} />
          <ThemedText type="labelMd" style={{ color: '#ffffff' }}>Undo Last Point</ThemedText>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 40,
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
    gap: 8,
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
  },
  undoBtn: {
    flexDirection: 'row',
    height: 40,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.level2,
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
