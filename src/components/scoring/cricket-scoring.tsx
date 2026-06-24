import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Modal,
  Alert,
  TextInput,
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

export default function CricketScoring({ teamA = 'London Lions', teamB = 'Kent Kings' }: { teamA?: string; teamB?: string }) {
  const theme = useTheme();

  const [showScoringModal, setShowScoringModal] = useState(false);
  const [showBatsmenModal, setShowBatsmenModal] = useState(false);
  const [showBowlersModal, setShowBowlersModal] = useState(false);
  const [showEditPlayersModal, setShowEditPlayersModal] = useState(false);

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

  // Squad Lists State
  const [dismissedBatsmen, setDismissedBatsmen] = useState<any[]>([
    { name: 'Zak Crawley', status: 'c & b Rashid Khan', runs: 28, balls: 18, fours: 4, sixes: 1, active: false },
    { name: 'Ben Duckett', status: 'lbw b Rashid Khan', runs: 15, balls: 11, fours: 2, sixes: 0, active: false },
    { name: 'Harry Brook', status: 'c Smith b Starc', runs: 34, balls: 22, fours: 3, sixes: 2, active: false },
  ]);

  const [yetToBatBatsmen, setYetToBatBatsmen] = useState<any[]>([
    { name: 'Ben Stokes', status: 'yet to bat', runs: 0, balls: 0, fours: 0, sixes: 0, active: false },
    { name: 'Jos Buttler', status: 'yet to bat', runs: 0, balls: 0, fours: 0, sixes: 0, active: false },
    { name: 'Moeen Ali', status: 'yet to bat', runs: 0, balls: 0, fours: 0, sixes: 0, active: false },
    { name: 'Chris Woakes', status: 'yet to bat', runs: 0, balls: 0, fours: 0, sixes: 0, active: false },
  ]);

  const [otherBowlers, setOtherBowlers] = useState<any[]>([
    { name: 'Mitchell Starc', overs: 4, ballsInOver: 0, maidens: 0, runs: 35, wickets: 1 },
    { name: 'Jofra Archer', overs: 4, ballsInOver: 0, maidens: 1, runs: 22, wickets: 2 },
    { name: 'Adil Rashid', overs: 3, ballsInOver: 0, maidens: 0, runs: 28, wickets: 0 },
  ]);

  // Form edit states
  const [b1Name, setB1Name] = useState('');
  const [b1Runs, setB1Runs] = useState('');
  const [b1Balls, setB1Balls] = useState('');
  const [b1Fours, setB1Fours] = useState('');
  const [b1Sixes, setB1Sixes] = useState('');

  const [b2Name, setB2Name] = useState('');
  const [b2Runs, setB2Runs] = useState('');
  const [b2Balls, setB2Balls] = useState('');
  const [b2Fours, setB2Fours] = useState('');
  const [b2Sixes, setB2Sixes] = useState('');

  const [bowlName, setBowlName] = useState('');
  const [bowlOvers, setBowlOvers] = useState('');
  const [bowlRuns, setBowlRuns] = useState('');
  const [bowlWickets, setBowlWickets] = useState('');
  const [bowlMaidens, setBowlMaidens] = useState('');

  // Replacement/Retire sub-state inside edit modal
  const [actionTarget, setActionTarget] = useState<{ type: 'retire' | 'replace' | 'bowler'; batsmanIndex?: number } | null>(null);
  const [customNewName, setCustomNewName] = useState('');

  const handleSwapStrike = () => {
    // Save history for undo support
    const oldState = {
      runs,
      wickets,
      overs,
      ballsInCurrentOver,
      overLog: [...overLog],
      batsmen: batsmen.map(b => ({ ...b })),
      bowler: { ...bowler },
    };
    setHistory(prev => [...prev, oldState]);

    setBatsmen(prev =>
      prev.map(b => ({
        ...b,
        active: !b.active,
      }))
    );
  };

  const getFullBatsmenScorecard = () => {
    return [
      ...dismissedBatsmen,
      { ...batsmen[0], status: 'not out' },
      { ...batsmen[1], status: 'not out' },
      ...yetToBatBatsmen,
    ];
  };

  const getFullBowlerScorecard = () => {
    return [
      { ...bowler, active: true },
      ...otherBowlers.map(b => ({ ...b, active: false })),
    ];
  };

  // Helper Player Management Handlers
  const openEditPlayersModal = () => {
    setB1Name(batsmen[0]?.name || '');
    setB1Runs(String(batsmen[0]?.runs || 0));
    setB1Balls(String(batsmen[0]?.balls || 0));
    setB1Fours(String(batsmen[0]?.fours || 0));
    setB1Sixes(String(batsmen[0]?.sixes || 0));

    setB2Name(batsmen[1]?.name || '');
    setB2Runs(String(batsmen[1]?.runs || 0));
    setB2Balls(String(batsmen[1]?.balls || 0));
    setB2Fours(String(batsmen[1]?.fours || 0));
    setB2Sixes(String(batsmen[1]?.sixes || 0));

    setBowlName(bowler.name || '');
    setBowlOvers(String(bowler.overs || 0));
    setBowlRuns(String(bowler.runs || 0));
    setBowlWickets(String(bowler.wickets || 0));
    setBowlMaidens(String(bowler.maidens || 0));

    setActionTarget(null);
    setCustomNewName('');
    setShowEditPlayersModal(true);
  };

  const savePlayersEdit = () => {
    const oldState = {
      runs,
      wickets,
      overs,
      ballsInCurrentOver,
      overLog: [...overLog],
      batsmen: batsmen.map(b => ({ ...b })),
      bowler: { ...bowler },
    };
    setHistory(prev => [...prev, oldState]);

    setBatsmen([
      {
        name: b1Name,
        runs: parseInt(b1Runs) || 0,
        balls: parseInt(b1Balls) || 0,
        fours: parseInt(b1Fours) || 0,
        sixes: parseInt(b1Sixes) || 0,
        active: batsmen[0]?.active ?? true,
      },
      {
        name: b2Name,
        runs: parseInt(b2Runs) || 0,
        balls: parseInt(b2Balls) || 0,
        fours: parseInt(b2Fours) || 0,
        sixes: parseInt(b2Sixes) || 0,
        active: batsmen[1]?.active ?? false,
      },
    ]);

    setBowler(prev => ({
      ...prev,
      name: bowlName,
      overs: parseInt(bowlOvers) || 0,
      maidens: parseInt(bowlMaidens) || 0,
      runs: parseInt(bowlRuns) || 0,
      wickets: parseInt(bowlWickets) || 0,
    }));

    setShowEditPlayersModal(false);
  };

  const executeRetire = (type: 'Retired Hurt' | 'Retired Out', replacementName: string) => {
    if (!replacementName.trim()) {
      Alert.alert('Error', 'Please select or enter a replacement name.');
      return;
    }
    const idx = actionTarget?.batsmanIndex;
    if (idx === undefined) return;

    const oldState = {
      runs,
      wickets,
      overs,
      ballsInCurrentOver,
      overLog: [...overLog],
      batsmen: batsmen.map(b => ({ ...b })),
      bowler: { ...bowler },
      dismissedBatsmen: dismissedBatsmen.map(db => ({ ...db })),
      yetToBatBatsmen: yetToBatBatsmen.map(y => ({ ...y })),
    };
    setHistory(prev => [...prev, oldState]);

    const retiringPlayer = batsmen[idx];

    setDismissedBatsmen(prev => [
      ...prev,
      {
        name: retiringPlayer.name,
        status: type,
        runs: retiringPlayer.runs,
        balls: retiringPlayer.balls,
        fours: retiringPlayer.fours,
        sixes: retiringPlayer.sixes,
      }
    ]);

    const isFromSquad = yetToBatBatsmen.find(p => p.name.toLowerCase() === replacementName.toLowerCase());
    if (isFromSquad) {
      setYetToBatBatsmen(prev => prev.filter(p => p.name.toLowerCase() !== replacementName.toLowerCase()));
    }

    setBatsmen(prev => {
      const next = [...prev];
      next[idx] = {
        name: replacementName.trim(),
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        active: retiringPlayer.active,
      };
      return next;
    });

    if (idx === 0) {
      setB1Name(replacementName.trim());
      setB1Runs('0');
      setB1Balls('0');
      setB1Fours('0');
      setB1Sixes('0');
    } else {
      setB2Name(replacementName.trim());
      setB2Runs('0');
      setB2Balls('0');
      setB2Fours('0');
      setB2Sixes('0');
    }

    setActionTarget(null);
    setCustomNewName('');
  };

  const executeReplaceBatsman = (replacementName: string) => {
    if (!replacementName.trim()) {
      Alert.alert('Error', 'Please select or enter a replacement name.');
      return;
    }
    const idx = actionTarget?.batsmanIndex;
    if (idx === undefined) return;

    const oldState = {
      runs,
      wickets,
      overs,
      ballsInCurrentOver,
      overLog: [...overLog],
      batsmen: batsmen.map(b => ({ ...b })),
      bowler: { ...bowler },
      yetToBatBatsmen: yetToBatBatsmen.map(y => ({ ...y })),
    };
    setHistory(prev => [...prev, oldState]);

    const swappedPlayer = batsmen[idx];

    setYetToBatBatsmen(prev => [
      ...prev,
      {
        name: swappedPlayer.name,
        status: 'yet to bat',
        runs: swappedPlayer.runs,
        balls: swappedPlayer.balls,
        fours: swappedPlayer.fours,
        sixes: swappedPlayer.sixes,
      }
    ]);

    const isFromSquad = yetToBatBatsmen.find(p => p.name.toLowerCase() === replacementName.toLowerCase());
    if (isFromSquad) {
      setYetToBatBatsmen(prev => prev.filter(p => p.name.toLowerCase() !== replacementName.toLowerCase()));
    }

    setBatsmen(prev => {
      const next = [...prev];
      next[idx] = {
        name: replacementName.trim(),
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        active: swappedPlayer.active,
      };
      return next;
    });

    if (idx === 0) {
      setB1Name(replacementName.trim());
      setB1Runs('0');
      setB1Balls('0');
      setB1Fours('0');
      setB1Sixes('0');
    } else {
      setB2Name(replacementName.trim());
      setB2Runs('0');
      setB2Balls('0');
      setB2Fours('0');
      setB2Sixes('0');
    }

    setActionTarget(null);
    setCustomNewName('');
  };

  const executeReplaceBowler = (replacementName: string) => {
    if (!replacementName.trim()) {
      Alert.alert('Error', 'Please select or enter a bowler name.');
      return;
    }

    const oldState = {
      runs,
      wickets,
      overs,
      ballsInCurrentOver,
      overLog: [...overLog],
      batsmen: batsmen.map(b => ({ ...b })),
      bowler: { ...bowler },
      otherBowlers: otherBowlers.map(ob => ({ ...ob })),
    };
    setHistory(prev => [...prev, oldState]);

    const oldBowler = bowler;

    setOtherBowlers(prev => [
      ...prev,
      {
        name: oldBowler.name,
        overs: oldBowler.overs,
        ballsInOver: oldBowler.ballsInOver,
        maidens: oldBowler.maidens,
        runs: oldBowler.runs,
        wickets: oldBowler.wickets,
      }
    ]);

    const isFromBench = otherBowlers.find(p => p.name.toLowerCase() === replacementName.toLowerCase());
    let newBowlerObj: Bowler;
    if (isFromBench) {
      setOtherBowlers(prev => prev.filter(p => p.name.toLowerCase() !== replacementName.toLowerCase()));
      newBowlerObj = {
        name: isFromBench.name,
        overs: isFromBench.overs,
        ballsInOver: isFromBench.ballsInOver || 0,
        maidens: isFromBench.maidens || 0,
        runs: isFromBench.runs || 0,
        wickets: isFromBench.wickets || 0,
      };
    } else {
      newBowlerObj = {
        name: replacementName.trim(),
        overs: 0,
        ballsInOver: 0,
        maidens: 0,
        runs: 0,
        wickets: 0,
      };
    }

    setBowler(newBowlerObj);

    setBowlName(newBowlerObj.name);
    setBowlOvers(String(newBowlerObj.overs));
    setBowlRuns(String(newBowlerObj.runs));
    setBowlWickets(String(newBowlerObj.wickets));
    setBowlMaidens(String(newBowlerObj.maidens));

    setActionTarget(null);
    setCustomNewName('');
  };

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
      handleExtraClick(value as 'WD' | 'NB' | 'BYE' | 'LB');
    }
  };

  const handleExtraClick = (extraType: 'WD' | 'NB' | 'BYE' | 'LB') => {
    if (extraType === 'WD' || extraType === 'NB') {
      Alert.alert(
        `Runs for ${extraType === 'WD' ? 'Wide' : 'No Ball'}`,
        `Select the number of runs to award for this ${extraType === 'WD' ? 'wide' : 'no ball'}:`,
        [
          { text: '0 Runs', onPress: () => recordExtraWithRuns(extraType, 0) },
          { text: '1 Run', onPress: () => recordExtraWithRuns(extraType, 1) },
          { text: '2 Runs', onPress: () => recordExtraWithRuns(extraType, 2) },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } else {
      Alert.alert(
        `Runs for ${extraType === 'BYE' ? 'Bye' : 'Leg Bye'}`,
        `Select the number of ${extraType === 'BYE' ? 'bye' : 'leg bye'} runs:`,
        [
          { text: '1 Run', onPress: () => recordExtraWithRuns(extraType, 1) },
          { text: '2 Runs', onPress: () => recordExtraWithRuns(extraType, 2) },
          { text: '3 Runs', onPress: () => recordExtraWithRuns(extraType, 3) },
          { text: '4 Runs', onPress: () => recordExtraWithRuns(extraType, 4) },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  const recordExtraWithRuns = (extraType: 'WD' | 'NB' | 'BYE' | 'LB', runCount: number) => {
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
    setHistory(prev => [...prev, oldState]);

    setRuns(prev => prev + runCount);

    setBowler(prev => ({
      ...prev,
      runs: prev.runs + runCount,
      // Wide/No-ball doesn't count as a legal ball. Bye/Leg bye does.
      ballsInOver: (extraType === 'BYE' || extraType === 'LB') ? prev.ballsInOver + 1 : prev.ballsInOver,
    }));

    // Update batsman balls faced for No Ball, Bye, and Leg Bye
    if (extraType === 'NB' || extraType === 'BYE' || extraType === 'LB') {
      setBatsmen(prev =>
        prev.map(b => (b.active ? { ...b, balls: b.balls + 1 } : b))
      );
    }

    const logString = runCount === 1 ? extraType : `${runCount}${extraType}`;
    setOverLog(prev => [...prev, logString]);

    if (extraType === 'BYE' || extraType === 'LB') {
      incrementBallCount();
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
    <>
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

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <ThemedText type="labelMd" style={{ color: '#ffffff', fontWeight: '700' }}>
              1st Innings
            </ThemedText>
            <View style={styles.liveBadgeAbsolute}>
              <View style={styles.liveDotRed} />
              <ThemedText style={styles.liveText}>Live</ThemedText>
            </View>
          </View>

          <View style={styles.bannerRow}>
            <View style={styles.bannerLeftCol}>
              <ThemedText type="headlineLg" style={styles.teamTitle}>
                {teamA}
              </ThemedText>
              <ThemedText type="bodyMd" style={{ color: theme.onPrimaryContainer }}>
                vs {teamB}
              </ThemedText>
            </View>

            <View style={styles.bannerRightCol}>
              <ThemedText type="displayLg" style={[styles.scoreText, { color: '#ffffff' }]}>
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
              <ThemedText type="headlineSm" style={{ color: '#ffffff', fontFamily: 'HankenGrotesk_700Bold' }}>
                {Math.round(projectedScore)}
              </ThemedText>
            </View>
          </View>
        </View>
      </View>

      {/* Current Over Log Card */}
      <View style={styles.section}>
        <View style={[styles.card, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm }}>
            <ThemedText type="labelMd" style={{ color: theme.textSecondary }}>
              Current Over Log
            </ThemedText>
            <Pressable
              onPress={() => setShowScoringModal(true)}
              style={[styles.recordBallBtn, { backgroundColor: theme.primaryContainer + '15' }]}
            >
              <Ionicons name="add" size={14} color={theme.primary} />
              <ThemedText type="labelSm" style={{ color: theme.primary, marginLeft: 2, fontFamily: 'PlusJakartaSans_700Bold' }}>
                Ball by Ball
              </ThemedText>
            </Pressable>
          </View>
          
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
            <ThemedText style={{ color: theme.textSecondary, fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold' }}>
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Pressable onPress={handleSwapStrike}>
                <Ionicons name="swap-horizontal-outline" size={16} color={theme.text} />
              </Pressable>
              <Pressable onPress={() => setShowBatsmenModal(true)}>
                <Ionicons name="list-outline" size={16} color={theme.text} />
              </Pressable>
              <Pressable onPress={openEditPlayersModal}>
                <Ionicons name="create-outline" size={16} color={theme.text} />
              </Pressable>
            </View>
          </View>

          {/* Sub-Header Row */}
          <View style={[styles.tableRow, { paddingVertical: 6, backgroundColor: theme.surfaceLow + '50', borderBottomWidth: 1, borderBottomColor: theme.outlineVariant + '33' }]}>
            <View style={styles.batsmanNameCell}>
              <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'PlusJakartaSans_700Bold' }}>Batsman</ThemedText>
            </View>
            <View style={styles.batStatsCells}>
              <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'PlusJakartaSans_700Bold' }}>R</ThemedText></View>
              <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'PlusJakartaSans_700Bold' }}>B</ThemedText></View>
              <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'PlusJakartaSans_700Bold' }}>4s</ThemedText></View>
              <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'PlusJakartaSans_700Bold' }}>6s</ThemedText></View>
              <View style={[styles.statCell, { width: 50 }]}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'PlusJakartaSans_700Bold', textAlign: 'center' }}>SR</ThemedText></View>
            </View>
          </View>

          {batsmen.map((b, idx) => {
            const sr = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0';
            return (
              <Pressable
                key={idx}
                onPress={() => toggleActiveBatsman(idx)}
                style={[
                  styles.tableRow,
                  { paddingVertical: 8, borderLeftWidth: 4 },
                  b.active 
                    ? { backgroundColor: theme.secondaryContainer + '1a', borderLeftColor: theme.secondaryContainer }
                    : { borderLeftColor: 'transparent' },
                ]}
              >
                <View style={styles.batsmanNameCell}>
                  <View style={[styles.playerAvatar, { backgroundColor: theme.primary + '15' }]}>
                    <ThemedText style={{ color: theme.primary, fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold' }}>
                      {b.name ? b.name.trim().charAt(0).toUpperCase() : 'P'}
                    </ThemedText>
                  </View>
                  <ThemedText style={{ fontSize: 13, fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>
                    {b.name}
                  </ThemedText>
                  {b.active && (
                    <Ionicons name="star" size={8} color={theme.error} style={{ marginLeft: 3 }} />
                  )}
                </View>
                <View style={styles.batStatsCells}>
                  <View style={styles.statCell}>
                    <ThemedText style={{ fontSize: 12, fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>{b.runs}</ThemedText>
                  </View>
                  <View style={styles.statCell}>
                    <ThemedText style={{ fontSize: 12, color: theme.textSecondary }}>{b.balls}</ThemedText>
                  </View>
                  <View style={styles.statCell}>
                    <ThemedText style={{ fontSize: 12, color: theme.text }}>{b.fours}</ThemedText>
                  </View>
                  <View style={styles.statCell}>
                    <ThemedText style={{ fontSize: 12, color: theme.text }}>{b.sixes}</ThemedText>
                  </View>
                  <View style={[styles.statCell, { width: 50 }]}>
                    <ThemedText style={{ fontSize: 12, fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>{sr}</ThemedText>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.tableCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', marginTop: Spacing.md }]}>
          <View style={[styles.tableHeader, { backgroundColor: theme.surfaceLow }]}>
            <ThemedText type="labelMd" style={{ color: theme.text }}>Current Bowler</ThemedText>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Pressable onPress={() => { openEditPlayersModal(); setActionTarget({ type: 'bowler' }); }}>
                <Ionicons name="swap-horizontal-outline" size={16} color={theme.text} />
              </Pressable>
              <Pressable onPress={() => setShowBowlersModal(true)}>
                <Ionicons name="list-outline" size={16} color={theme.text} />
              </Pressable>
              <Pressable onPress={openEditPlayersModal}>
                <Ionicons name="create-outline" size={16} color={theme.text} />
              </Pressable>
            </View>
          </View>

          {/* Bowler Sub-Header Row */}
          <View style={[styles.tableRow, { paddingVertical: 6, backgroundColor: theme.surfaceLow + '50', borderBottomWidth: 1, borderBottomColor: theme.outlineVariant + '33' }]}>
            <View style={styles.batsmanNameCell}>
              <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'PlusJakartaSans_700Bold' }}>Bowler</ThemedText>
            </View>
            <View style={styles.batStatsCells}>
              <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'PlusJakartaSans_700Bold' }}>O</ThemedText></View>
              <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'PlusJakartaSans_700Bold' }}>M</ThemedText></View>
              <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'PlusJakartaSans_700Bold' }}>R</ThemedText></View>
              <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'PlusJakartaSans_700Bold' }}>W</ThemedText></View>
              <View style={[styles.statCell, { width: 50 }]}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'PlusJakartaSans_700Bold', textAlign: 'center' }}>ECON</ThemedText></View>
            </View>
          </View>

          <View style={[styles.tableRow, { paddingVertical: 8, borderLeftWidth: 4, borderLeftColor: 'transparent' }]}>
            <View style={styles.batsmanNameCell}>
              <View style={[styles.playerAvatar, { backgroundColor: theme.primary + '15' }]}>
                <ThemedText style={{ color: theme.primary, fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold' }}>
                  {bowler.name ? bowler.name.trim().charAt(0).toUpperCase() : 'P'}
                </ThemedText>
              </View>
              <ThemedText style={{ fontSize: 13, fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>
                {bowler.name}
              </ThemedText>
            </View>
            <View style={styles.batStatsCells}>
              <View style={styles.statCell}>
                <ThemedText style={{ fontSize: 12, fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>
                  {bowler.overs}.{bowler.ballsInOver}
                </ThemedText>
              </View>
              <View style={styles.statCell}>
                <ThemedText style={{ fontSize: 12, color: theme.textSecondary }}>{bowler.maidens}</ThemedText>
              </View>
              <View style={styles.statCell}>
                <ThemedText style={{ fontSize: 12, color: theme.text }}>{bowler.runs}</ThemedText>
              </View>
              <View style={styles.statCell}>
                <ThemedText style={{ fontSize: 12, fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>{bowler.wickets}</ThemedText>
              </View>
              <View style={[styles.statCell, { width: 50 }]}>
                <ThemedText style={{ fontSize: 12, fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>
                  {((bowler.overs * 6 + bowler.ballsInOver) > 0 ? (bowler.runs / ((bowler.overs * 6 + bowler.ballsInOver) / 6)) : 0).toFixed(2)}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* AI Suggestion Card */}
      <View style={styles.section}>
        <View style={[styles.card, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <Ionicons name="sparkles" size={16} color={theme.primary} />
            <ThemedText type="labelMd" style={{ color: theme.text, fontFamily: 'PlusJakartaSans_700Bold' }}>
              AI Next Batsman Suggestion
            </ThemedText>
          </View>
          
          <View style={{ gap: Spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.surfaceLow, padding: 10, borderRadius: BorderRadius.md }}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <ThemedText style={{ fontSize: 13, fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>
                  Ben Stokes
                </ThemedText>
                <ThemedText style={{ fontSize: 10, color: theme.textSecondary, marginTop: 2 }}>
                  Death Overs Specialist • Recommended
                </ThemedText>
              </View>
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <View style={{ alignItems: 'flex-end' }}>
                  <ThemedText style={{ fontSize: 9, color: theme.textSecondary }}>SR / HS</ThemedText>
                  <ThemedText style={{ fontSize: 11, fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>
                    148.5 / 135*
                  </ThemedText>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <ThemedText style={{ fontSize: 9, color: theme.textSecondary }}>Runs</ThemedText>
                  <ThemedText style={{ fontSize: 11, fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>
                    2840
                  </ThemedText>
                </View>
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.surfaceLow, padding: 10, borderRadius: BorderRadius.md }}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <ThemedText style={{ fontSize: 13, fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>
                  Jos Buttler
                </ThemedText>
                <ThemedText style={{ fontSize: 10, color: theme.textSecondary, marginTop: 2 }}>
                  Accelerate Run Rate • High Intent
                </ThemedText>
              </View>
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <View style={{ alignItems: 'flex-end' }}>
                  <ThemedText style={{ fontSize: 9, color: theme.textSecondary }}>SR / HS</ThemedText>
                  <ThemedText style={{ fontSize: 11, fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>
                    144.2 / 116
                  </ThemedText>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <ThemedText style={{ fontSize: 9, color: theme.textSecondary }}>Runs</ThemedText>
                  <ThemedText style={{ fontSize: 11, fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>
                    3120
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Spacer */}
      <View style={{ height: 40 }} />
    </ScrollView>

      {/* Interactive Scoring Console Modal */}
      <Modal
        visible={showScoringModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowScoringModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowScoringModal(false)} />
          <View style={[styles.modalContent, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
            <View style={[styles.modalHeader, { justifyContent: 'flex-end', marginBottom: 12 }]}>
              <Pressable onPress={() => setShowScoringModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScrollContent}>
              {/* Copy of Current Over Log */}
              <View style={[styles.card, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33', marginBottom: Spacing.md }]}>
                <ThemedText type="labelMd" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
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
                          isDot && { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', borderWidth: 1 },
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
                
                <View style={[styles.bowlerNameRow, { borderTopColor: theme.outlineVariant + '1a', marginTop: Spacing.sm, paddingTop: Spacing.sm }]}>
                  <ThemedText style={{ color: theme.textSecondary, fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold' }}>
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
                        isFourOrSix ? { backgroundColor: theme.secondaryContainer, borderBottomColor: theme.onSecondaryContainer } : { backgroundColor: theme.surfaceLow, borderBottomColor: theme.primary },
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
                    onPress={() => handleExtraClick(extra as 'WD' | 'NB' | 'BYE' | 'LB')}
                    style={[styles.extraButton, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant }]}
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
            </ScrollView>

            {/* Sticky bottom footer inside Runs Scored modal */}
            <View style={[styles.consoleFooter, { borderTopColor: theme.outlineVariant + '33', borderTopWidth: 1, paddingTop: Spacing.sm, marginTop: Spacing.sm, paddingBottom: 10 }]}>
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
                onPress={() => {
                  handleCompleteOver();
                  setShowScoringModal(false);
                }}
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
      </Modal>

      {/* Batsmen Scorecard Modal */}
      <Modal
        visible={showBatsmenModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBatsmenModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowBatsmenModal(false)} />
          <View style={[styles.modalContent, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="headlineSm" style={{ color: theme.text }}>Batsmen Scorecard</ThemedText>
              <Pressable onPress={() => setShowBatsmenModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScrollContent}>
              <View style={[styles.tableRow, { paddingVertical: 6, backgroundColor: theme.surfaceLow + '50', borderBottomWidth: 1, borderBottomColor: theme.outlineVariant + '33' }]}>
                <View style={[styles.batsmanNameCell, { width: '45%' }]}>
                  <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'PlusJakartaSans_700Bold' }}>Batsman</ThemedText>
                </View>
                <View style={[styles.batStatsCells, { flex: 1 }]}>
                  <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'PlusJakartaSans_700Bold' }}>R</ThemedText></View>
                  <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'PlusJakartaSans_700Bold' }}>B</ThemedText></View>
                  <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'PlusJakartaSans_700Bold' }}>4s</ThemedText></View>
                  <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'PlusJakartaSans_700Bold' }}>6s</ThemedText></View>
                  <View style={[styles.statCell, { width: 50 }]}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'PlusJakartaSans_700Bold', textAlign: 'center' }}>SR</ThemedText></View>
                </View>
              </View>

              {getFullBatsmenScorecard().map((b, idx) => {
                const sr = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '-';
                return (
                  <View
                    key={idx}
                    style={[
                      styles.tableRow,
                      { paddingVertical: 10 },
                      b.active && { backgroundColor: theme.secondaryContainer + '1a' }
                    ]}
                  >
                    <View style={[styles.batsmanNameCell, { width: '45%' }]}>
                      <View style={{ flex: 1 }}>
                        <ThemedText style={{ fontSize: 13, fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>
                          {b.name}
                        </ThemedText>
                        <ThemedText style={{ fontSize: 10, color: theme.textSecondary }}>
                          {b.status}
                        </ThemedText>
                      </View>
                    </View>
                    <View style={styles.batStatsCells}>
                      <View style={styles.statCell}>
                        <ThemedText style={{ fontSize: 12, fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>{b.runs}</ThemedText>
                      </View>
                      <View style={styles.statCell}>
                        <ThemedText style={{ fontSize: 12, color: theme.textSecondary }}>{b.balls}</ThemedText>
                      </View>
                      <View style={styles.statCell}>
                        <ThemedText style={{ fontSize: 12, color: theme.text }}>{b.fours}</ThemedText>
                      </View>
                      <View style={styles.statCell}>
                        <ThemedText style={{ fontSize: 12, color: theme.text }}>{b.sixes}</ThemedText>
                      </View>
                      <View style={[styles.statCell, { width: 50 }]}>
                        <ThemedText style={{ fontSize: 12, fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>{sr}</ThemedText>
                      </View>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bowlers Scorecard Modal */}
      <Modal
        visible={showBowlersModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBowlersModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowBowlersModal(false)} />
          <View style={[styles.modalContent, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="headlineSm" style={{ color: theme.text }}>Bowlers Scorecard</ThemedText>
              <Pressable onPress={() => setShowBowlersModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScrollContent}>
              <View style={[styles.tableRow, { paddingVertical: 6, backgroundColor: theme.surfaceLow + '50', borderBottomWidth: 1, borderBottomColor: theme.outlineVariant + '33' }]}>
                <View style={[styles.batsmanNameCell, { width: '45%' }]}>
                  <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'PlusJakartaSans_700Bold' }}>Bowler</ThemedText>
                </View>
                <View style={[styles.batStatsCells, { flex: 1 }]}>
                  <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'PlusJakartaSans_700Bold' }}>O</ThemedText></View>
                  <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'PlusJakartaSans_700Bold' }}>M</ThemedText></View>
                  <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'PlusJakartaSans_700Bold' }}>R</ThemedText></View>
                  <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'PlusJakartaSans_700Bold' }}>W</ThemedText></View>
                  <View style={[styles.statCell, { width: 50 }]}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'PlusJakartaSans_700Bold', textAlign: 'center' }}>ECON</ThemedText></View>
                </View>
              </View>

              {getFullBowlerScorecard().map((b, idx) => {
                const totalBalls = b.ballsInOver !== undefined ? (b.overs * 6 + b.ballsInOver) : (b.overs * 6);
                const econ = totalBalls > 0 ? ((b.runs / (totalBalls / 6))).toFixed(2) : '0.00';
                const oversDisplay = b.ballsInOver !== undefined ? `${b.overs}.${b.ballsInOver}` : `${b.overs}.0`;

                return (
                  <View
                    key={idx}
                    style={[
                      styles.tableRow,
                      { paddingVertical: 10 },
                      b.active && { backgroundColor: theme.secondaryContainer + '1a' }
                    ]}
                  >
                    <View style={[styles.batsmanNameCell, { width: '45%' }]}>
                      <ThemedText style={{ fontSize: 13, fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>
                        {b.name}
                      </ThemedText>
                    </View>
                    <View style={styles.batStatsCells}>
                      <View style={styles.statCell}>
                        <ThemedText style={{ fontSize: 12, fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>{oversDisplay}</ThemedText>
                      </View>
                      <View style={styles.statCell}>
                        <ThemedText style={{ fontSize: 12, color: theme.textSecondary }}>{b.maidens}</ThemedText>
                      </View>
                      <View style={styles.statCell}>
                        <ThemedText style={{ fontSize: 12, color: theme.text }}>{b.runs}</ThemedText>
                      </View>
                      <View style={styles.statCell}>
                        <ThemedText style={{ fontSize: 12, fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>{b.wickets}</ThemedText>
                      </View>
                      <View style={[styles.statCell, { width: 50 }]}>
                        <ThemedText style={{ fontSize: 12, fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>{econ}</ThemedText>
                      </View>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Players Modal */}
      <Modal
        visible={showEditPlayersModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditPlayersModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowEditPlayersModal(false)} />
          <View style={[styles.modalContent, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="headlineSm" style={{ color: theme.text }}>Manage Match Players</ThemedText>
              <Pressable onPress={() => setShowEditPlayersModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScrollContent}>
              
              {/* Inline replacement options */}
              {actionTarget !== null && (
                <View style={[styles.card, { backgroundColor: theme.surfaceLowest, borderColor: theme.outline, borderWidth: 1.5, marginBottom: 16, padding: 12 }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <ThemedText type="labelMd" style={{ color: theme.secondary, fontFamily: 'PlusJakartaSans_700Bold' }}>
                      {actionTarget.type === 'retire' ? 'RETIRE & REPLACE BATSMAN' : actionTarget.type === 'replace' ? 'SUBSTITUTE BATSMAN' : 'CHANGE BOWLER'}
                    </ThemedText>
                    <Pressable onPress={() => setActionTarget(null)}>
                      <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
                    </Pressable>
                  </View>

                  {actionTarget.type === 'retire' && (
                    <View style={{ marginBottom: 12 }}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginBottom: 4 }}>Select Dismissal Type:</ThemedText>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        {['Retired Hurt', 'Retired Out'].map((type) => (
                          <Pressable
                            key={type}
                            onPress={() => executeRetire(type as any, customNewName || 'New Batsman')}
                            style={[styles.subOptionBtn, { backgroundColor: theme.surfaceLow }]}
                          >
                            <ThemedText type="labelSm" style={{ color: theme.text }}>{type}</ThemedText>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Selection lists (Chips) */}
                  <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginBottom: 6 }}>
                    Select from squad bench:
                  </ThemedText>
                  
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }} contentContainerStyle={{ gap: 8 }}>
                    {actionTarget.type === 'bowler' ? (
                      otherBowlers.map((b) => (
                        <Pressable
                          key={b.name}
                          onPress={() => {
                            executeReplaceBowler(b.name);
                          }}
                          style={[styles.squadChip, { backgroundColor: theme.surfaceLow }]}
                        >
                          <ThemedText style={{ fontSize: 11, color: theme.text }}>{b.name}</ThemedText>
                        </Pressable>
                      ))
                    ) : (
                      yetToBatBatsmen.map((b) => (
                        <Pressable
                          key={b.name}
                          onPress={() => {
                            if (actionTarget.type === 'retire') {
                              executeRetire('Retired Hurt', b.name);
                            } else {
                              executeReplaceBatsman(b.name);
                            }
                          }}
                          style={[styles.squadChip, { backgroundColor: theme.surfaceLow }]}
                        >
                          <ThemedText style={{ fontSize: 11, color: theme.text }}>{b.name}</ThemedText>
                        </Pressable>
                      ))
                    )}
                    {((actionTarget.type === 'bowler' ? otherBowlers : yetToBatBatsmen).length === 0) && (
                      <ThemedText style={{ color: theme.textSecondary, fontSize: 11, fontStyle: 'italic', paddingVertical: 4 }}>No players available on bench.</ThemedText>
                    )}
                  </ScrollView>

                  {/* Direct Custom Type-in Input */}
                  <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginBottom: 6 }}>
                    Or enter custom name (without list):
                  </ThemedText>
                  
                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    <TextInput
                      style={[styles.modalInput, { flex: 1, color: theme.text, borderColor: theme.outlineVariant, marginBottom: 0 }]}
                      value={customNewName}
                      onChangeText={setCustomNewName}
                      placeholder="E.g. Virat Kohli"
                      placeholderTextColor={theme.textSecondary + '70'}
                    />
                    <Pressable
                      onPress={() => {
                        if (!customNewName.trim()) {
                          Alert.alert('Error', 'Please enter a name.');
                          return;
                        }
                        if (actionTarget.type === 'bowler') {
                          executeReplaceBowler(customNewName);
                        } else if (actionTarget.type === 'retire') {
                          executeRetire('Retired Hurt', customNewName);
                        } else {
                          executeReplaceBatsman(customNewName);
                        }
                      }}
                      style={[styles.addBtn, { backgroundColor: theme.primary }]}
                    >
                      <ThemedText type="labelMd" style={{ color: '#ffffff' }}>Add & Set</ThemedText>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* BATSMEN MANAGEMENT SECTION */}
              <ThemedText type="labelMd" style={{ color: theme.primary, marginBottom: 10, letterSpacing: 0.5 }}>
                ACTIVE BATSMEN
              </ThemedText>

              {/* Batsman 1 */}
              <View style={[styles.card, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33', marginBottom: 12 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <ThemedText type="labelMd" style={{ color: theme.text }}>
                    Batsman 1 {batsmen[0]?.active ? '🏏 (On Strike)' : '(Non-Strike)'}
                  </ThemedText>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <Pressable
                      onPress={() => setActionTarget({ type: 'replace', batsmanIndex: 0 })}
                      style={[styles.smallActionChip, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant }]}
                    >
                      <ThemedText style={{ fontSize: 10, color: theme.text }}>Swap/Sub</ThemedText>
                    </Pressable>
                    <Pressable
                      onPress={() => setActionTarget({ type: 'retire', batsmanIndex: 0 })}
                      style={[styles.smallActionChip, { backgroundColor: theme.error + '22', borderColor: theme.error + '44' }]}
                    >
                      <ThemedText style={{ fontSize: 10, color: theme.error }}>Retire</ThemedText>
                    </Pressable>
                  </View>
                </View>
                <TextInput
                  style={[styles.modalInput, { color: theme.text, borderColor: theme.outlineVariant }]}
                  value={b1Name}
                  onChangeText={setB1Name}
                  placeholder="Player Name"
                  placeholderTextColor={theme.textSecondary + '70'}
                />
                <View style={styles.statsEditRow}>
                  <View style={styles.statEditCol}>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Runs</ThemedText>
                    <TextInput
                      style={[styles.statInput, { color: theme.text, borderColor: theme.outlineVariant }]}
                      value={b1Runs}
                      onChangeText={setB1Runs}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.statEditCol}>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Balls</ThemedText>
                    <TextInput
                      style={[styles.statInput, { color: theme.text, borderColor: theme.outlineVariant }]}
                      value={b1Balls}
                      onChangeText={setB1Balls}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.statEditCol}>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>4s</ThemedText>
                    <TextInput
                      style={[styles.statInput, { color: theme.text, borderColor: theme.outlineVariant }]}
                      value={b1Fours}
                      onChangeText={setB1Fours}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.statEditCol}>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>6s</ThemedText>
                    <TextInput
                      style={[styles.statInput, { color: theme.text, borderColor: theme.outlineVariant }]}
                      value={b1Sixes}
                      onChangeText={setB1Sixes}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>

              {/* Batsman 2 */}
              <View style={[styles.card, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33', marginBottom: 12 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <ThemedText type="labelMd" style={{ color: theme.text }}>
                    Batsman 2 {batsmen[1]?.active ? '🏏 (On Strike)' : '(Non-Strike)'}
                  </ThemedText>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <Pressable
                      onPress={() => setActionTarget({ type: 'replace', batsmanIndex: 1 })}
                      style={[styles.smallActionChip, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant }]}
                    >
                      <ThemedText style={{ fontSize: 10, color: theme.text }}>Swap/Sub</ThemedText>
                    </Pressable>
                    <Pressable
                      onPress={() => setActionTarget({ type: 'retire', batsmanIndex: 1 })}
                      style={[styles.smallActionChip, { backgroundColor: theme.error + '22', borderColor: theme.error + '44' }]}
                    >
                      <ThemedText style={{ fontSize: 10, color: theme.error }}>Retire</ThemedText>
                    </Pressable>
                  </View>
                </View>
                <TextInput
                  style={[styles.modalInput, { color: theme.text, borderColor: theme.outlineVariant }]}
                  value={b2Name}
                  onChangeText={setB2Name}
                  placeholder="Player Name"
                  placeholderTextColor={theme.textSecondary + '70'}
                />
                <View style={styles.statsEditRow}>
                  <View style={styles.statEditCol}>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Runs</ThemedText>
                    <TextInput
                      style={[styles.statInput, { color: theme.text, borderColor: theme.outlineVariant }]}
                      value={b2Runs}
                      onChangeText={setB2Runs}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.statEditCol}>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Balls</ThemedText>
                    <TextInput
                      style={[styles.statInput, { color: theme.text, borderColor: theme.outlineVariant }]}
                      value={b2Balls}
                      onChangeText={setB2Balls}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.statEditCol}>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>4s</ThemedText>
                    <TextInput
                      style={[styles.statInput, { color: theme.text, borderColor: theme.outlineVariant }]}
                      value={b2Fours}
                      onChangeText={setB2Fours}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.statEditCol}>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>6s</ThemedText>
                    <TextInput
                      style={[styles.statInput, { color: theme.text, borderColor: theme.outlineVariant }]}
                      value={b2Sixes}
                      onChangeText={setB2Sixes}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>

              {/* BOWLER MANAGEMENT SECTION */}
              <ThemedText type="labelMd" style={{ color: theme.primary, marginTop: 8, marginBottom: 10, letterSpacing: 0.5 }}>
                CURRENT BOWLER
              </ThemedText>

              <View style={[styles.card, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33', marginBottom: 16 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <ThemedText type="labelMd" style={{ color: theme.text }}>
                    Active Bowler
                  </ThemedText>
                  <Pressable
                    onPress={() => setActionTarget({ type: 'bowler' })}
                    style={[styles.smallActionChip, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant }]}
                  >
                    <ThemedText style={{ fontSize: 10, color: theme.text }}>Change Bowler</ThemedText>
                  </Pressable>
                </View>
                <TextInput
                  style={[styles.modalInput, { color: theme.text, borderColor: theme.outlineVariant }]}
                  value={bowlName}
                  onChangeText={setBowlName}
                  placeholder="Bowler Name"
                  placeholderTextColor={theme.textSecondary + '70'}
                />
                <View style={styles.statsEditRow}>
                  <View style={styles.statEditCol}>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Overs</ThemedText>
                    <TextInput
                      style={[styles.statInput, { color: theme.text, borderColor: theme.outlineVariant }]}
                      value={bowlOvers}
                      onChangeText={setBowlOvers}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.statEditCol}>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Maidens</ThemedText>
                    <TextInput
                      style={[styles.statInput, { color: theme.text, borderColor: theme.outlineVariant }]}
                      value={bowlMaidens}
                      onChangeText={setBowlMaidens}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.statEditCol}>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Runs</ThemedText>
                    <TextInput
                      style={[styles.statInput, { color: theme.text, borderColor: theme.outlineVariant }]}
                      value={bowlRuns}
                      onChangeText={setBowlRuns}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.statEditCol}>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Wickets</ThemedText>
                    <TextInput
                      style={[styles.statInput, { color: theme.text, borderColor: theme.outlineVariant }]}
                      value={bowlWickets}
                      onChangeText={setBowlWickets}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>

              {/* SAVE / CANCEL ACTION BUTTONS */}
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
                <Pressable
                  onPress={() => setShowEditPlayersModal(false)}
                  style={[styles.cancelBtn, { borderColor: theme.outlineVariant }]}
                >
                  <ThemedText type="labelMd" style={{ color: theme.textSecondary }}>Cancel</ThemedText>
                </Pressable>
                <Pressable
                  onPress={savePlayersEdit}
                  style={[styles.saveBtn, { backgroundColor: theme.primary }]}
                >
                  <ThemedText type="labelMd" style={{ color: '#ffffff' }}>Save Changes</ThemedText>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
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
    borderRadius: BorderRadius.xl,
    padding: 12,
    position: 'relative',
    overflow: 'hidden',
    ...Shadows.level2,
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
    color: '#5D68E8',
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
    marginTop: 14,
    paddingHorizontal: Spacing.containerMargin,
  },
  card: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: 12,
    ...Shadows.level2,
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
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...Shadows.level2,
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
    width: '38%',
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
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: 12,
    ...Shadows.level2,
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
    height: 40,
    borderRadius: BorderRadius.xl,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  undoButton: {
    flex: 1,
    height: 40,
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
  recordBallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  playerAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(5, 21, 30, 0.6)',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 16,
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#0000000a',
    paddingBottom: 10,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalScrollContent: {
    paddingBottom: 80,
  },
  modalInput: {
    height: 38,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 10,
    fontSize: 13,
    marginBottom: 10,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  statsEditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  statEditCol: {
    flex: 1,
  },
  statInput: {
    height: 32,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    textAlign: 'center',
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  smallActionChip: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  cancelBtn: {
    flex: 1,
    height: 40,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtn: {
    flex: 1,
    height: 40,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  squadChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subOptionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtn: {
    paddingHorizontal: 14,
    height: 38,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
