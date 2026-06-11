import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface Batsman {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  active: boolean;
}

interface Bowler {
  name: string;
  overs: number;
  ballsInOver: number;
  maidens: number;
  runs: number;
  wickets: number;
}

export default function CricketScoring() {
  const theme = useTheme();

  // Scoreboard State
  const [runs, setRuns] = useState(142);
  const [wickets, setWickets] = useState(4);
  const [overs, setOvers] = useState(18);
  const [ballsInCurrentOver, setBallsInCurrentOver] = useState(2); // 18.2 overs initially
  const [overLog, setOverLog] = useState<string[]>(['1', '0', '4', 'W', '2', '6']);
  const [history, setHistory] = useState<any[]>([]); // for undo support

  // Player Stats State
  const [batsmen, setBatsmen] = useState<Batsman[]>([
    { name: 'J. Root', runs: 42, balls: 28, fours: 5, sixes: 1, active: true },
    { name: 'O. Pope', runs: 18, balls: 14, fours: 2, sixes: 0, active: false },
  ]);

  const [bowler, setBowler] = useState<Bowler>(
    { name: 'Rashid Khan', overs: 3, ballsInOver: 2, maidens: 0, runs: 24, wickets: 1 }
  );

  // Helper Stats Calcs
  const totalBalls = overs * 6 + ballsInCurrentOver;
  const runRate = totalBalls > 0 ? (runs / (totalBalls / 6)) : 0;
  const projectedScore = runRate * 20; // 20 over match

  // State Updates
  const recordBall = (type: 'run' | 'extra' | 'wicket', value: number | string) => {
    // Save state history for undo
    const oldState = {
      runs,
      wickets,
      overs,
      ballsInCurrentOver,
      overLog: [...overLog],
      batsmen: batsmen.map(b => ({ ...b })),
      bowler: { ...bowler },
    };
    setHistory([...history, oldState]);

    if (type === 'run') {
      const runVal = value as number;
      setRuns(prev => prev + runVal);
      
      // Update batsman runs
      setBatsmen(prev =>
        prev.map(b => {
          if (b.active) {
            return {
              ...b,
              runs: b.runs + runVal,
              balls: b.balls + 1,
              fours: b.fours + (runVal === 4 ? 1 : 0),
              sixes: b.sixes + (runVal === 6 ? 1 : 0),
            };
          }
          return b;
        })
      );

      // Update bowler runs/balls
      setBowler(prev => ({
        ...prev,
        ballsInOver: prev.ballsInOver + 1,
        runs: prev.runs + runVal,
      }));

      // Add to current over log
      setOverLog(prev => [...prev, runVal.toString()]);
      incrementBallCount();
    } else if (type === 'wicket') {
      if (wickets >= 10) return;
      setWickets(prev => prev + 1);
      
      // Update active batsman balls
      setBatsmen(prev =>
        prev.map(b => (b.active ? { ...b, balls: b.balls + 1 } : b))
      );

      setBowler(prev => ({
        ...prev,
        ballsInOver: prev.ballsInOver + 1,
        wickets: prev.wickets + 1,
      }));

      setOverLog(prev => [...prev, 'W']);
      incrementBallCount();
    } else if (type === 'extra') {
      const extraType = value as string;
      setRuns(prev => prev + 1); // 1 run for extras

      setBowler(prev => ({
        ...prev,
        runs: prev.runs + 1,
        // Wide/No-ball doesn't count as legal ball
        ballsInOver: (extraType === 'B' || extraType === 'LB') ? prev.ballsInOver + 1 : prev.ballsInOver,
      }));

      setOverLog(prev => [...prev, extraType]);
      if (extraType === 'B' || extraType === 'LB') {
        incrementBallCount();
      }
    }
  };

  const incrementBallCount = () => {
    setBallsInCurrentOver(prev => {
      const next = prev + 1;
      if (next >= 6) {
        return 6;
      }
      return next;
    });
  };

  const handleCompleteOver = () => {
    // Save history
    const oldState = {
      runs,
      wickets,
      overs,
      ballsInCurrentOver,
      overLog: [...overLog],
      batsmen: batsmen.map(b => ({ ...b })),
      bowler: { ...bowler },
    };
    setHistory([...history, oldState]);

    setOvers(prev => prev + 1);
    setBallsInCurrentOver(0);
    setOverLog([]);
    setBowler(prev => ({
      ...prev,
      overs: prev.overs + 1,
      ballsInOver: 0,
    }));
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setRuns(previous.runs);
    setWickets(previous.wickets);
    setOvers(previous.overs);
    setBallsInCurrentOver(previous.ballsInCurrentOver);
    setOverLog(previous.overLog);
    setBatsmen(previous.batsmen);
    setBowler(previous.bowler);
    setHistory(prev => prev.slice(0, -1));
  };

  const toggleActiveBatsman = (idx: number) => {
    setBatsmen(prev => prev.map((b, i) => ({ ...b, active: i === idx })));
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      
      {/* Live Scorecard Banner */}
      <View style={styles.bannerWrapper}>
        <View style={[styles.scoreBanner, { backgroundColor: theme.primaryContainer }]}>
          {/* Cricket player watermark background */}
          <Image
            source={require('@/assets/images/illustrations/cricket_player.png')}
            style={styles.bannerWatermark}
            contentFit="contain"
          />

          <View style={styles.bannerRow}>
            <View style={styles.bannerLeftCol}>
              <View style={styles.liveBadgeAbsolute}>
                <View style={styles.liveDotRed} />
                <ThemedText style={styles.liveText}>Live</ThemedText>
              </View>
              <ThemedText type="labelMd" style={{ color: theme.secondaryContainer, fontWeight: '700', marginBottom: 4 }}>
                1st Innings
              </ThemedText>
              <ThemedText type="headlineLg" style={styles.teamTitle}>
                London Lions
              </ThemedText>
              <ThemedText type="bodyMd" style={{ color: theme.onPrimaryContainer }}>
                vs Kent Kings
              </ThemedText>
            </View>

            <View style={styles.bannerRightCol}>
              <ThemedText type="displayLg" style={[styles.scoreText, { color: theme.secondaryContainer }]}>
                {runs}/{wickets}
              </ThemedText>
              <ThemedText type="headlineSm" style={styles.oversText}>
                {overs}.{ballsInCurrentOver} Overs
              </ThemedText>
            </View>
          </View>

          <View style={styles.bannerStatsRow}>
            <View style={styles.bannerStatItem}>
              <ThemedText type="labelSm" style={{ color: theme.onPrimaryContainer }}>RUN RATE</ThemedText>
              <ThemedText type="headlineSm" style={{ color: '#ffffff', fontFamily: 'HankenGrotesk_700Bold' }}>
                {runRate.toFixed(2)}
              </ThemedText>
            </View>
            <View style={styles.bannerStatItem}>
              <ThemedText type="labelSm" style={{ color: theme.onPrimaryContainer }}>PROJECTED</ThemedText>
              <ThemedText type="headlineSm" style={{ color: theme.secondaryContainer, fontFamily: 'HankenGrotesk_700Bold' }}>
                {Math.round(projectedScore)}
              </ThemedText>
            </View>
          </View>
        </View>
      </View>

      {/* Current Over Log Card */}
      <View style={styles.section}>
        <View style={[styles.card, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
          <ThemedText type="labelMd" style={{ color: theme.textSecondary, marginBottom: Spacing.sm }}>
            Current Over Log
          </ThemedText>
          
          <View style={styles.logBallsRow}>
            {overLog.map((ball, idx) => {
              const isWicket = ball === 'W';
              const isBoundary = ball === '4' || ball === '6';
              const isDot = ball === '0';

              return (
                <View
                  key={idx}
                  style={[
                    styles.logBall,
                    { backgroundColor: theme.primary },
                    isWicket && { backgroundColor: theme.error },
                    isBoundary && { backgroundColor: theme.secondaryContainer },
                    isDot && { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33', borderWidth: 1 },
                  ]}
                >
                  <ThemedText
                    type="bodyMd"
                    style={{
                      color: (isWicket || (!isBoundary && !isDot)) ? theme.onPrimary : isBoundary ? theme.onSecondaryContainer : theme.text,
                      fontFamily: 'HankenGrotesk_700Bold',
                    }}
                  >
                    {ball}
                  </ThemedText>
                </View>
              );
            })}
            {overLog.length === 0 && (
              <ThemedText type="bodyMd" style={{ color: theme.textSecondary, italic: true } as any}>
                Starting new over...
              </ThemedText>
            )}
          </View>
          
          <View style={[styles.bowlerNameRow, { borderTopColor: theme.outlineVariant + '1a' }]}>
            <ThemedText type="bodySm" style={{ color: theme.textSecondary }}>
              Bowler: {bowler.name}
            </ThemedText>
            <View style={styles.bowlerOverDots}>
              {[1, 2, 3, 4, 5, 6].map((b) => (
                <View
                  key={b}
                  style={[
                    styles.bowlerDot,
                    b <= ballsInCurrentOver
                      ? { backgroundColor: theme.primary }
                      : { backgroundColor: theme.outlineVariant + '33' },
                  ]}
                />
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* Players Table Section */}
      <View style={styles.section}>
        <View style={[styles.tableCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
          <View style={[styles.tableHeader, { backgroundColor: theme.surfaceLow }]}>
            <ThemedText type="labelMd" style={{ color: theme.text }}>Current Batsmen</ThemedText>
            <Ionicons name="create-outline" size={16} color={theme.text} />
          </View>

          {batsmen.map((b, idx) => {
            const sr = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0';
            return (
              <Pressable
                key={idx}
                onPress={() => toggleActiveBatsman(idx)}
                style={[
                  styles.tableRow,
                  b.active && { backgroundColor: theme.secondaryContainer + '1a', borderLeftWidth: 4, borderLeftColor: theme.secondaryContainer },
                ]}
              >
                <View style={styles.batsmanNameCell}>
                  <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>
                    {b.name}
                  </ThemedText>
                  {b.active && (
                    <Ionicons name="star" size={14} color={theme.secondaryContainer} style={{ marginLeft: 4 }} />
                  )}
                </View>
                <View style={styles.batStatsCells}>
                  <View style={styles.statCell}>
                    <ThemedText type="labelSm" style={styles.statLabel}>R</ThemedText>
                    <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>{b.runs}</ThemedText>
                  </View>
                  <View style={styles.statCell}>
                    <ThemedText type="labelSm" style={styles.statLabel}>B</ThemedText>
                    <ThemedText type="bodyMd" style={{ color: theme.textSecondary }}>{b.balls}</ThemedText>
                  </View>
                  <View style={styles.statCell}>
                    <ThemedText type="labelSm" style={styles.statLabel}>4s</ThemedText>
                    <ThemedText type="bodyMd">{b.fours}</ThemedText>
                  </View>
                  <View style={styles.statCell}>
                    <ThemedText type="labelSm" style={styles.statLabel}>6s</ThemedText>
                    <ThemedText type="bodyMd">{b.sixes}</ThemedText>
                  </View>
                  <View style={[styles.statCell, { width: 50 }]}>
                    <ThemedText type="labelSm" style={styles.statLabel}>SR</ThemedText>
                    <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>{sr}</ThemedText>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.tableCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', marginTop: Spacing.md }]}>
          <View style={[styles.tableHeader, { backgroundColor: theme.surfaceLow }]}>
            <ThemedText type="labelMd" style={{ color: theme.text }}>Current Bowler</ThemedText>
            <Ionicons name="swap-horizontal-outline" size={16} color={theme.text} />
          </View>

          <View style={styles.tableRow}>
            <View style={styles.batsmanNameCell}>
              <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>
                {bowler.name}
              </ThemedText>
            </View>
            <View style={styles.batStatsCells}>
              <View style={styles.statCell}>
                <ThemedText type="labelSm" style={styles.statLabel}>O</ThemedText>
                <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>
                  {bowler.overs}.{bowler.ballsInOver}
                </ThemedText>
              </View>
              <View style={styles.statCell}>
                <ThemedText type="labelSm" style={styles.statLabel}>M</ThemedText>
                <ThemedText type="bodyMd" style={{ color: theme.textSecondary }}>{bowler.maidens}</ThemedText>
              </View>
              <View style={styles.statCell}>
                <ThemedText type="labelSm" style={styles.statLabel}>R</ThemedText>
                <ThemedText type="bodyMd">{bowler.runs}</ThemedText>
              </View>
              <View style={styles.statCell}>
                <ThemedText type="labelSm" style={styles.statLabel}>W</ThemedText>
                <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>{bowler.wickets}</ThemedText>
              </View>
              <View style={[styles.statCell, { width: 50 }]}>
                <ThemedText type="labelSm" style={styles.statLabel}>ECON</ThemedText>
                <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>
                  {((bowler.overs * 6 + bowler.ballsInOver) > 0 ? (bowler.runs / ((bowler.overs * 6 + bowler.ballsInOver) / 6)) : 0).toFixed(2)}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Interactive Scoring Console */}
      <View style={[styles.section, { paddingBottom: 120 }]}>
        <View style={[styles.consoleCard, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33' }]}>
          
          <ThemedText type="labelMd" style={{ color: theme.textSecondary, marginBottom: Spacing.md, letterSpacing: 0.5 }}>
            Runs Scored
          </ThemedText>

          <View style={styles.runsGrid}>
            {[0, 1, 2, 3, 4, 6].map((num) => {
              const isFourOrSix = num === 4 || num === 6;
              const label = num === 0 ? 'Dot' : num === 1 ? 'Single' : num === 2 ? 'Double' : num === 3 ? 'Triple' : num === 4 ? 'Four' : 'Six';
              
              return (
                <Pressable
                  key={num}
                  onPress={() => recordBall('run', num)}
                  style={({ pressed }) => [
                    styles.scoringButton,
                    isFourOrSix ? { backgroundColor: theme.secondaryContainer, borderBottomColor: theme.onSecondaryContainer } : { backgroundColor: theme.surfaceLowest, borderBottomColor: theme.primary },
                    pressed ? styles.scoringButtonPressed : styles.scoringButtonNormal,
                  ]}
                >
                  <ThemedText type="headlineLg" style={{ color: isFourOrSix ? theme.onSecondaryContainer : theme.text }}>
                    {num}
                  </ThemedText>
                  <ThemedText type="labelSm" style={{ color: isFourOrSix ? theme.onSecondaryContainer + 'bb' : theme.textSecondary }}>
                    {label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          <ThemedText type="labelMd" style={{ color: theme.textSecondary, marginTop: Spacing.lg, marginBottom: Spacing.sm, letterSpacing: 0.5 }}>
            Extras
          </ThemedText>

          <View style={styles.extrasRow}>
            {['WD', 'NB', 'BYE', 'LB'].map((extra) => (
              <Pressable
                key={extra}
                onPress={() => recordBall('extra', extra)}
                style={[styles.extraButton, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant }]}
              >
                <ThemedText type="labelMd" style={{ fontFamily: 'PlusJakartaSans_700Bold', color: theme.text }}>
                  {extra === 'WD' ? 'Wide' : extra === 'NB' ? 'No Ball' : extra}
                </ThemedText>
              </Pressable>
            ))}
          </View>

          <View style={styles.actionButtonsRow}>
            <Pressable
              onPress={() => recordBall('wicket', 'W')}
              style={[styles.wicketButton, { backgroundColor: theme.error }, Shadows.level2]}
            >
              <Ionicons name="skull-outline" size={18} color="#ffffff" />
              <ThemedText type="headlineSm" style={{ color: '#ffffff', marginLeft: 6 }}>
                Wicket
              </ThemedText>
            </Pressable>
            
            <Pressable
              onPress={handleUndo}
              disabled={history.length === 0}
              style={[styles.undoButton, { backgroundColor: theme.primaryContainer }, history.length === 0 && { opacity: 0.5 }]}
            >
              <Ionicons name="arrow-undo" size={20} color="#ffffff" />
            </Pressable>
          </View>

          <View style={[styles.consoleFooter, { borderTopColor: theme.outlineVariant + '33' }]}>
            <View style={styles.footerLinkRow}>
              <Pressable style={styles.footerLink}>
                <Ionicons name="help-circle-outline" size={16} color={theme.textSecondary} />
                <ThemedText type="labelMd" style={{ color: theme.textSecondary, marginLeft: 4 }}>
                  Guidelines
                </ThemedText>
              </Pressable>
              <Pressable style={styles.footerLink}>
                <Ionicons name="flag-outline" size={16} color={theme.textSecondary} />
                <ThemedText type="labelMd" style={{ color: theme.textSecondary, marginLeft: 4 }}>
                  Manual
                </ThemedText>
              </Pressable>
            </View>

            <Pressable
              onPress={handleCompleteOver}
              style={[styles.completeOverBtn, { backgroundColor: theme.primary }]}
            >
              <ThemedText type="labelMd" style={{ color: theme.onPrimary }}>
                Complete Over
              </ThemedText>
              <Ionicons name="arrow-forward" size={16} color={theme.onPrimary} style={{ marginLeft: 4 }} />
            </Pressable>
          </View>

        </View>
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
  scoreBanner: {
    borderRadius: BorderRadius.premium,
    padding: Spacing.lg,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#001b3d',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  bannerWatermark: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    width: '40%',
    height: '100%',
    opacity: 0.08,
  },
  bannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bannerLeftCol: {
    width: '60%',
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
  teamTitle: {
    color: '#ffffff',
    fontFamily: 'HankenGrotesk_800ExtraBold',
    fontSize: 22,
    lineHeight: 28,
  },
  bannerRightCol: {
    alignItems: 'flex-end',
  },
  scoreText: {
    color: '#feae2c',
    fontFamily: 'HankenGrotesk_800ExtraBold',
    fontSize: 32,
    lineHeight: 36,
  },
  oversText: {
    color: '#ffffffaa',
    fontSize: 14,
    marginTop: 2,
  },
  bannerStatsRow: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    gap: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: Spacing.md,
  },
  bannerStatItem: {
    flexDirection: 'column',
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
  logBallsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    paddingVertical: Spacing.base,
  },
  logBall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#05151e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bowlerNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
  },
  bowlerOverDots: {
    flexDirection: 'row',
    gap: 4,
  },
  bowlerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  tableCard: {
    borderRadius: BorderRadius.premium,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#00000005',
  },
  batsmanNameCell: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '35%',
  },
  batStatsCells: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-between',
  },
  statCell: {
    alignItems: 'center',
    width: 32,
  },
  statLabel: {
    fontSize: 9,
    opacity: 0.5,
    marginBottom: 2,
  },
  consoleCard: {
    borderRadius: BorderRadius.premium,
    borderWidth: 1,
    padding: Spacing.md,
  },
  runsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  scoringButton: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 9999, // Perfect circle
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
  extrasRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  extraButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#c4c6cf',
    paddingVertical: 10,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  wicketButton: {
    flex: 3,
    height: 48,
    borderRadius: BorderRadius.xl,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  undoButton: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  consoleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
  },
  footerLinkRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  footerLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completeOverBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
