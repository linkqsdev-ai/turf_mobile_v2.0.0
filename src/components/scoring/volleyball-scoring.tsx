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

export default function VolleyballScoring() {
  const theme = useTheme();

  // Set scores (Best of 5)
  const [setsA, setSetsA] = useState<number[]>([25, 23, 18]);
  const [setsB, setSetsB] = useState<number[]>([21, 25, 12]);

  // Current set points (0-25, or 0-15 in Set 5)
  const [pointsA, setPointsA] = useState(18);
  const [pointsB, setPointsB] = useState(12);

  // Serve Indicator
  const [server, setServer] = useState<'A' | 'B'>('A');

  // Stats
  const [acesA, setAcesA] = useState(3);
  const [acesB, setAcesB] = useState(2);
  const [blocksA, setBlocksA] = useState(6);
  const [blocksB, setBlocksB] = useState(4);
  const [errorsA, setErrorsA] = useState(8);
  const [errorsB, setErrorsB] = useState(11);

  // Undo History
  const [history, setHistory] = useState<any[]>([]);

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
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      {/* Set Score Banner */}
      <View style={styles.bannerWrapper}>
        <View style={[styles.timerBanner, { backgroundColor: theme.primaryContainer }]}>
          <View style={styles.liveBadgeAbsolute}>
            <View style={styles.liveDotRed} />
            <ThemedText style={styles.liveText}>Live</ThemedText>
          </View>
          <ThemedText type="labelSm" style={{ color: theme.onPrimaryContainer, letterSpacing: 1, marginBottom: 8 }}>
            Volleyball Match Sets (Best of 5)
          </ThemedText>
          <View style={styles.setsTable}>
            <View style={styles.setsHeaderRow}>
              <View style={{ flex: 2 }} />
              {setsA.map((_, idx) => (
                <ThemedText key={idx} type="labelSm" style={{ flex: 1, textAlign: 'center', color: theme.onPrimaryContainer }}>
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
                    style={{ flex: 1, textAlign: 'center', color: isCurrent ? theme.secondaryContainer : '#ffffffaa', fontFamily: isCurrent ? 'HankenGrotesk_700Bold' : 'HankenGrotesk_400Regular' }}
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
                  <MaterialCommunityIcons name="volleyball" size={14} color="#ffdd33" style={{ marginLeft: 4 }} />
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
                  <MaterialCommunityIcons name="volleyball" size={14} color="#ffdd33" style={{ marginLeft: 4 }} />
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
            Volleyball Stats Adjuster
          </ThemedText>

          {/* Aces */}
          <View style={styles.statLine}>
            <ThemedText type="bodyMd" style={{ width: 100 }}>Service Aces</ThemedText>
            <View style={styles.adjustRow}>
              <Pressable onPress={() => setAcesA(prev => Math.max(0, prev - 1))} style={styles.adjustBtn}>
                <Ionicons name="remove" size={14} color={theme.text} />
              </Pressable>
              <ThemedText type="bodyLg" style={{ minWidth: 40, textAlign: 'center', fontFamily: 'HankenGrotesk_700Bold' }}>
                {acesA} | {acesB}
              </ThemedText>
              <Pressable onPress={() => setAcesB(prev => prev + 1)} style={styles.adjustBtn}>
                <Ionicons name="add" size={14} color={theme.text} />
              </Pressable>
            </View>
            <Pressable onPress={() => setAcesA(prev => prev + 1)} style={styles.quickAddLink}>
              <ThemedText type="labelSm" style={{ color: theme.secondary }}>+ Lions Ace</ThemedText>
            </Pressable>
          </View>

          {/* Blocks */}
          <View style={[styles.statLine, { marginTop: Spacing.sm }]}>
            <ThemedText type="bodyMd" style={{ width: 100 }}>Blocks</ThemedText>
            <View style={styles.adjustRow}>
              <Pressable onPress={() => setBlocksA(prev => Math.max(0, prev - 1))} style={styles.adjustBtn}>
                <Ionicons name="remove" size={14} color={theme.text} />
              </Pressable>
              <ThemedText type="bodyLg" style={{ minWidth: 40, textAlign: 'center', fontFamily: 'HankenGrotesk_700Bold' }}>
                {blocksA} | {blocksB}
              </ThemedText>
              <Pressable onPress={() => setBlocksB(prev => prev + 1)} style={styles.adjustBtn}>
                <Ionicons name="add" size={14} color={theme.text} />
              </Pressable>
            </View>
            <Pressable onPress={() => setBlocksA(prev => prev + 1)} style={styles.quickAddLink}>
              <ThemedText type="labelSm" style={{ color: theme.secondary }}>+ Lions Block</ThemedText>
            </Pressable>
          </View>

          {/* Errors */}
          <View style={[styles.statLine, { marginTop: Spacing.sm }]}>
            <ThemedText type="bodyMd" style={{ width: 100 }}>Errors</ThemedText>
            <View style={styles.adjustRow}>
              <Pressable onPress={() => setErrorsA(prev => Math.max(0, prev - 1))} style={styles.adjustBtn}>
                <Ionicons name="remove" size={14} color={theme.text} />
              </Pressable>
              <ThemedText type="bodyLg" style={{ minWidth: 40, textAlign: 'center', fontFamily: 'HankenGrotesk_700Bold' }}>
                {errorsA} | {errorsB}
              </ThemedText>
              <Pressable onPress={() => setErrorsB(prev => prev + 1)} style={styles.adjustBtn}>
                <Ionicons name="add" size={14} color={theme.text} />
              </Pressable>
            </View>
            <Pressable onPress={() => setErrorsA(prev => prev + 1)} style={styles.quickAddLink}>
              <ThemedText type="labelSm" style={{ color: theme.secondary }}>+ Lions Err</ThemedText>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Undo */}
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
    borderRadius: BorderRadius.premium,
    padding: Spacing.lg,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    position: 'relative',
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
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.containerMargin,
  },
  card: {
    borderRadius: BorderRadius.premium,
    borderWidth: 1,
    padding: Spacing.md,
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
    height: 48,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveBadgeAbsolute: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    zIndex: 20,
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
});
