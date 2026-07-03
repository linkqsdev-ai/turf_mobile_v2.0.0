import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Modal,
  Alert,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { matchApi } from '@/services/match-api';

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

export default function CricketScoring({ matchId, teamA = 'London Lions', teamB = 'Kent Kings' }: { matchId?: string; teamA?: string; teamB?: string }) {
  const theme = useTheme();
  const router = useRouter();

  const [showScoringModal, setShowScoringModal] = useState(false);
  const [showBatsmenModal, setShowBatsmenModal] = useState(false);
  const [showBowlersModal, setShowBowlersModal] = useState(false);
  const [showEditPlayersModal, setShowEditPlayersModal] = useState(false);
  const [showOverCompleteModal, setShowOverCompleteModal] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'live' | 'scorecard' | 'stats' | 'details'>('live');
  const [scorecardTab, setScorecardTab] = useState<'batsmen' | 'bowlers'>('batsmen');

  // Scoreboard State
  const [runs, setRuns] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [overs, setOvers] = useState(0);
  const [ballsInCurrentOver, setBallsInCurrentOver] = useState(0); // 0.0 overs initially
  const [overLog, setOverLog] = useState<string[]>([]);
  const [history, setHistory] = useState<any[]>([]); // for undo support

  const [showExtraModal, setShowExtraModal] = useState(false);
  const [activeExtraType, setActiveExtraType] = useState<'WD' | 'NB' | 'BYE' | 'LB' | null>(null);

  // Player Stats State
  const [batsmen, setBatsmen] = useState<Batsman[]>([
    { name: 'Azar', runs: 0, balls: 0, fours: 0, sixes: 0, active: true },
    { name: 'Jaffer', runs: 0, balls: 0, fours: 0, sixes: 0, active: false },
  ]);

  const [bowler, setBowler] = useState<Bowler>(
    { name: 'Dinesh', overs: 0, ballsInOver: 0, maidens: 0, runs: 0, wickets: 0 }
  );

  // Squad Lists State
  const [dismissedBatsmen, setDismissedBatsmen] = useState<any[]>([]);

  const [yetToBatBatsmen, setYetToBatBatsmen] = useState<any[]>([
    { name: 'Kaja', runs: 0, balls: 0, fours: 0, sixes: 0, active: false },
    { name: 'Messi', runs: 0, balls: 0, fours: 0, sixes: 0, active: false },
    { name: 'Ronaldo', runs: 0, balls: 0, fours: 0, sixes: 0, active: false },
  ]);

  const [otherBowlers, setOtherBowlers] = useState<any[]>([
    { name: 'Carter', overs: 0, ballsInOver: 0, maidens: 0, runs: 0, wickets: 0 },
    { name: 'Williams', overs: 0, ballsInOver: 0, maidens: 0, runs: 0, wickets: 0 },
    { name: 'Apex', overs: 0, ballsInOver: 0, maidens: 0, runs: 0, wickets: 0 },
    { name: 'Vanguard', overs: 0, ballsInOver: 0, maidens: 0, runs: 0, wickets: 0 },
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
      ...yetToBatBatsmen.map(b => ({ ...b, status: 'yet to bat' })),
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
    setActiveExtraType(extraType);
    setShowExtraModal(true);
  };

  const recordExtraWithRuns = (extraType: 'WD' | 'NB' | 'BYE' | 'LB', runCount: number, isLegalOverride?: boolean) => {
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

    const isLegal = isLegalOverride !== undefined ? isLegalOverride : (extraType === 'BYE' || extraType === 'LB');

    setBowler(prev => ({
      ...prev,
      runs: prev.runs + runCount,
      ballsInOver: isLegal ? prev.ballsInOver + 1 : prev.ballsInOver,
    }));

    // Update batsman balls faced for No Ball, Bye, Leg Bye, and free/legal Wides
    if (extraType === 'NB' || extraType === 'BYE' || extraType === 'LB' || (extraType === 'WD' && isLegal)) {
      setBatsmen(prev =>
        prev.map(b => (b.active ? { ...b, balls: b.balls + 1 } : b))
      );
    }

    // Determine string in log: e.g. WD, 0WD, 1WD, 2WD, etc.
    const logString = runCount === 0 ? `0${extraType}` : runCount === 1 ? extraType : `${runCount}${extraType}`;
    setOverLog(prev => [...prev, logString]);

    if (isLegal) {
      incrementBallCount();
    }
  };

  const handleOverCompletion = () => {
    // 1. Save old state for undo history
    const oldState = {
      runs,
      wickets,
      overs,
      ballsInCurrentOver: 6,
      overLog: [...overLog],
      batsmen: batsmen.map(b => ({ ...b })),
      bowler: { ...bowler },
      otherBowlers: otherBowlers.map(ob => ({ ...ob })),
    };
    setHistory(prev => [...prev, oldState]);

    // 2. Automatically swap batsman ends (striker/non-striker end rotation)
    setBatsmen(prev => prev.map(b => ({ ...b, active: !b.active })));

    // 3. Increment overs count
    setOvers(prev => prev + 1);
    setBallsInCurrentOver(0);
    setOverLog([]);

    // 4. Update current bowler overs
    setBowler(prev => ({
      ...prev,
      overs: prev.overs + 1,
      ballsInOver: 0,
    }));

    // 5. Trigger next bowler selection modal
    setShowOverCompleteModal(true);
  };

  const incrementBallCount = () => {
    setBallsInCurrentOver(prev => {
      const next = prev + 1;
      if (next >= 6) {
        setTimeout(() => {
          handleOverCompletion();
        }, 100);
        return 0;
      }
      return next;
    });
  };

  const handleCompleteOver = () => {
    handleOverCompletion();
  };

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
              const rr = parseFloat((runs / (overs + ballsInCurrentOver / 6 || 1)).toFixed(2));

              await matchApi.completeMatch(matchId, {
                homeScore: runs,
                awayScore: 0,
                events: [],
                cricketData: [
                  {
                    runs,
                    wickets,
                    overs,
                    balls: ballsInCurrentOver,
                    runRate: rr,
                    batsmen: batsmen.map(b => ({
                      playerName: b.name,
                      runs: b.runs,
                      balls: b.balls,
                      fours: b.fours,
                      sixes: b.sixes,
                      isOut: !b.active,
                      dismissalType: 'Caught',
                    })),
                    bowlers: [
                      {
                        playerName: bowler.name,
                        overs: bowler.overs + bowler.ballsInOver / 6,
                        maidens: bowler.maidens,
                        runs: bowler.runs,
                        wickets: bowler.wickets,
                      }
                    ]
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
    <View style={styles.container}>
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

        {/* Sub-tab Navigation */}
        <View style={styles.subTabBar}>
          <Pressable
            onPress={() => setActiveSubTab('live')}
            style={[styles.subTabItem, activeSubTab === 'live' && { borderBottomColor: theme.primary }]}
          >
            <Ionicons name="flash-outline" size={14} color={activeSubTab === 'live' ? theme.primary : theme.textSecondary} />
            <ThemedText style={[styles.subTabText, { color: activeSubTab === 'live' ? theme.primary : theme.textSecondary }, activeSubTab === 'live' && { fontFamily: 'HankenGrotesk_700Bold' }]}>
              Live Scoring
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setActiveSubTab('scorecard')}
            style={[styles.subTabItem, activeSubTab === 'scorecard' && { borderBottomColor: theme.primary }]}
          >
            <Ionicons name="list-outline" size={14} color={activeSubTab === 'scorecard' ? theme.primary : theme.textSecondary} />
            <ThemedText style={[styles.subTabText, { color: activeSubTab === 'scorecard' ? theme.primary : theme.textSecondary }, activeSubTab === 'scorecard' && { fontFamily: 'HankenGrotesk_700Bold' }]}>
              Scorecard
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setActiveSubTab('stats')}
            style={[styles.subTabItem, activeSubTab === 'stats' && { borderBottomColor: theme.primary }]}
          >
            <Ionicons name="bar-chart-outline" size={14} color={activeSubTab === 'stats' ? theme.primary : theme.textSecondary} />
            <ThemedText style={[styles.subTabText, { color: activeSubTab === 'stats' ? theme.primary : theme.textSecondary }, activeSubTab === 'stats' && { fontFamily: 'HankenGrotesk_700Bold' }]}>
              Statistics
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setActiveSubTab('details')}
            style={[styles.subTabItem, activeSubTab === 'details' && { borderBottomColor: theme.primary }]}
          >
            <Ionicons name="information-circle-outline" size={14} color={activeSubTab === 'details' ? theme.primary : theme.textSecondary} />
            <ThemedText style={[styles.subTabText, { color: activeSubTab === 'details' ? theme.primary : theme.textSecondary }, activeSubTab === 'details' && { fontFamily: 'HankenGrotesk_700Bold' }]}>
              Details
            </ThemedText>
          </Pressable>
        </View>

        {activeSubTab === 'live' && (
          <>
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

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.logBallsRow}
                >
                  {overLog.map((ball, idx) => {
                    // Determine Ball Type and Color Scheme
                    let bgColor = theme.primary;
                    let textColor = '#ffffff';
                    let borderWidth = 0;
                    let borderColor = 'transparent';

                    const isWicket = ball === 'W';
                    const isDot = ball === '0';
                    const isFour = ball === '4';
                    const isSix = ball === '6';

                    if (isWicket) {
                      bgColor = '#EF4444'; // Red
                      textColor = '#ffffff';
                    } else if (isDot) {
                      bgColor = theme.surfaceLow;
                      textColor = theme.textSecondary;
                      borderWidth = 1;
                      borderColor = theme.outlineVariant + '33';
                    } else if (isFour) {
                      bgColor = '#10B981'; // Green for 4
                      textColor = '#ffffff';
                    } else if (isSix) {
                      bgColor = '#8B5CF6'; // Purple for 6
                      textColor = '#ffffff';
                    } else if (ball.includes('WD')) {
                      bgColor = '#F59E0B'; // Amber for Wides
                      textColor = '#ffffff';
                    } else if (ball.includes('NB')) {
                      bgColor = '#F43F5E'; // Pink-red for No Balls
                      textColor = '#ffffff';
                    } else if (ball.includes('BYE') || ball.includes('LB')) {
                      bgColor = '#06B6D4'; // Teal for Byes/Leg-byes
                      textColor = '#ffffff';
                    } else {
                      // Default runs 1, 2, 3
                      bgColor = theme.primary;
                      textColor = '#ffffff';
                    }

                    // Parse content for rendering
                    const match = ball.match(/^(\d+)?(WD|NB|BYE|LB)$/);
                    let renderContent;

                    if (match) {
                      const num = match[1];
                      const type = match[2];
                      if (num === undefined) {
                        renderContent = (
                          <ThemedText
                            style={{
                              color: textColor,
                              fontFamily: 'HankenGrotesk_700Bold',
                              fontSize: 12,
                            }}
                          >
                            {type}
                          </ThemedText>
                        );
                      } else {
                        renderContent = (
                          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center' }}>
                            <ThemedText
                              style={{
                                color: textColor,
                                fontFamily: 'HankenGrotesk_800ExtraBold',
                                fontSize: 14,
                              }}
                            >
                              {num}
                            </ThemedText>
                            <ThemedText
                              style={{
                                color: textColor,
                                fontFamily: 'HankenGrotesk_700Bold',
                                fontSize: 8,
                                marginLeft: 1,
                              }}
                            >
                              {type}
                            </ThemedText>
                          </View>
                        );
                      }
                    } else {
                      renderContent = (
                        <ThemedText
                          type="bodyMd"
                          style={{
                            color: textColor,
                            fontFamily: 'HankenGrotesk_700Bold',
                          }}
                        >
                          {ball}
                        </ThemedText>
                      );
                    }

                    return (
                      <View
                        key={idx}
                        style={[
                          styles.logBall,
                          {
                            backgroundColor: bgColor,
                            borderWidth,
                            borderColor,
                          },
                        ]}
                      >
                        {renderContent}
                      </View>
                    );
                  })}
                  {overLog.length === 0 && (
                    <ThemedText type="bodyMd" style={{ color: theme.textSecondary, italic: true } as any}>
                      Starting new over...
                    </ThemedText>
                  )}
                </ScrollView>

                <View style={[styles.bowlerNameRow, { borderTopColor: theme.outlineVariant + '1a' }]}>
                  <ThemedText style={{ color: theme.textSecondary, fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold' }}>
                    Bowler: {bowler.name} ({bowler.overs * 6 + bowler.ballsInOver} balls)
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
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Pressable
                      onPress={handleSwapStrike}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: theme.primary + '10',
                        paddingHorizontal: 6,
                        paddingVertical: 4,
                        borderRadius: 4,
                      }}
                    >
                      <Ionicons name="swap-horizontal" size={12} color={theme.primary} />
                      <ThemedText style={{ fontSize: 10, color: theme.primary, marginLeft: 2, fontFamily: 'PlusJakartaSans_700Bold' }}>
                        Swap
                      </ThemedText>
                    </Pressable>

                    <Pressable
                      onPress={() => {
                        openEditPlayersModal();
                        setActionTarget({ type: 'replace', batsmanIndex: 0 });
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: theme.primary + '10',
                        paddingHorizontal: 6,
                        paddingVertical: 4,
                        borderRadius: 4,
                      }}
                    >
                      <Ionicons name="person-add" size={12} color={theme.primary} />
                      <ThemedText style={{ fontSize: 10, color: theme.primary, marginLeft: 2, fontFamily: 'PlusJakartaSans_700Bold' }}>
                        + Add New
                      </ThemedText>
                    </Pressable>

                    <Pressable
                      onPress={openEditPlayersModal}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: theme.primary + '10',
                        paddingHorizontal: 6,
                        paddingVertical: 4,
                        borderRadius: 4,
                      }}
                    >
                      <Ionicons name="create" size={12} color={theme.primary} />
                      <ThemedText style={{ fontSize: 10, color: theme.primary, marginLeft: 2, fontFamily: 'PlusJakartaSans_700Bold' }}>
                        Edit
                      </ThemedText>
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
                      <Pressable 
                        onPress={openEditPlayersModal}
                        style={styles.batsmanNameCell}
                      >
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
                      </Pressable>
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
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Pressable
                      onPress={() => { openEditPlayersModal(); setActionTarget({ type: 'bowler' }); }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: theme.primary + '10',
                        paddingHorizontal: 6,
                        paddingVertical: 4,
                        borderRadius: 4,
                      }}
                    >
                      <Ionicons name="create" size={12} color={theme.primary} />
                      <ThemedText style={{ fontSize: 10, color: theme.primary, marginLeft: 2, fontFamily: 'PlusJakartaSans_700Bold' }}>
                        Edit
                      </ThemedText>
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
                  <Pressable 
                    onPress={() => {
                      openEditPlayersModal();
                      setActionTarget({ type: 'bowler' });
                    }}
                    style={styles.batsmanNameCell}
                  >
                    <View style={[styles.playerAvatar, { backgroundColor: theme.primary + '15' }]}>
                      <ThemedText style={{ color: theme.primary, fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold' }}>
                        {bowler.name ? bowler.name.trim().charAt(0).toUpperCase() : 'P'}
                      </ThemedText>
                    </View>
                    <ThemedText style={{ fontSize: 13, fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>
                      {bowler.name}
                    </ThemedText>
                  </Pressable>
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
              <View style={[styles.card, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', borderRadius: BorderRadius.xl, padding: 16, ...Shadows.level2 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Ionicons name="sparkles" size={18} color={theme.primary} />
                  <ThemedText style={{ fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: theme.text }}>
                    AI Next Batsman Suggestion
                  </ThemedText>
                </View>

                <View style={{ gap: Spacing.sm }}>
                  {/* Suggestion 1: Ben Stokes */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.surfaceLow, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12 }}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <ThemedText style={{ fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: theme.text }}>
                        Ben Stokes
                      </ThemedText>
                      <ThemedText style={{ fontSize: 10.5, color: theme.textSecondary, marginTop: 2, fontFamily: 'PlusJakartaSans_500Medium' }}>
                        Death Overs Specialist
                      </ThemedText>
                      <View style={{ flexDirection: 'row', marginTop: 6 }}>
                        <View style={{ backgroundColor: '#10B98115', paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4 }}>
                          <ThemedText style={{ fontSize: 9, color: '#10B981', fontFamily: 'PlusJakartaSans_700Bold' }}>
                            RECOMMENDED
                          </ThemedText>
                        </View>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                      <View style={{ alignItems: 'flex-end', width: 70 }}>
                        <ThemedText style={{ fontSize: 9, color: theme.textSecondary, fontFamily: 'PlusJakartaSans_600SemiBold', textTransform: 'uppercase', marginBottom: 2 }}>SR / HS</ThemedText>
                        <ThemedText style={{ fontSize: 12, fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>
                          148.5 / 135*
                        </ThemedText>
                      </View>
                      <View style={{ alignItems: 'flex-end', width: 45 }}>
                        <ThemedText style={{ fontSize: 9, color: theme.textSecondary, fontFamily: 'PlusJakartaSans_600SemiBold', textTransform: 'uppercase', marginBottom: 2 }}>Runs</ThemedText>
                        <ThemedText style={{ fontSize: 12, fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>
                          2840
                        </ThemedText>
                      </View>
                    </View>
                  </View>

                  {/* Suggestion 2: Jos Buttler */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.surfaceLow, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12 }}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <ThemedText style={{ fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: theme.text }}>
                        Jos Buttler
                      </ThemedText>
                      <ThemedText style={{ fontSize: 10.5, color: theme.textSecondary, marginTop: 2, fontFamily: 'PlusJakartaSans_500Medium' }}>
                        Accelerate Run Rate
                      </ThemedText>
                      <View style={{ flexDirection: 'row', marginTop: 6 }}>
                        <View style={{ backgroundColor: '#8B5CF615', paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4 }}>
                          <ThemedText style={{ fontSize: 9, color: '#8B5CF6', fontFamily: 'PlusJakartaSans_700Bold' }}>
                            HIGH INTENT
                          </ThemedText>
                        </View>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                      <View style={{ alignItems: 'flex-end', width: 70 }}>
                        <ThemedText style={{ fontSize: 9, color: theme.textSecondary, fontFamily: 'PlusJakartaSans_600SemiBold', textTransform: 'uppercase', marginBottom: 2 }}>SR / HS</ThemedText>
                        <ThemedText style={{ fontSize: 12, fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>
                          144.2 / 116
                        </ThemedText>
                      </View>
                      <View style={{ alignItems: 'flex-end', width: 45 }}>
                        <ThemedText style={{ fontSize: 9, color: theme.textSecondary, fontFamily: 'PlusJakartaSans_600SemiBold', textTransform: 'uppercase', marginBottom: 2 }}>Runs</ThemedText>
                        <ThemedText style={{ fontSize: 12, fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>
                          3120
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </>
        )}

      {activeSubTab === 'scorecard' && (
        <View style={{ paddingHorizontal: Spacing.containerMargin, gap: Spacing.md, marginTop: Spacing.sm }}>
          
          {/* Segment Selector Switcher */}
          <View style={{ flexDirection: 'row', backgroundColor: theme.surfaceLow, padding: 4, borderRadius: 10, width: '100%', marginBottom: 4 }}>
            <Pressable 
              onPress={() => setScorecardTab('batsmen')}
              style={[{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 }, scorecardTab === 'batsmen' && { backgroundColor: theme.surfaceLowest, ...Shadows.level1 }]}
            >
              <ThemedText style={{ fontSize: 13, fontFamily: scorecardTab === 'batsmen' ? 'PlusJakartaSans_700Bold' : 'PlusJakartaSans_600SemiBold', color: scorecardTab === 'batsmen' ? theme.primary : theme.textSecondary }}>
                Batsmen
              </ThemedText>
            </Pressable>
            <Pressable 
              onPress={() => setScorecardTab('bowlers')}
              style={[{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 }, scorecardTab === 'bowlers' && { backgroundColor: theme.surfaceLowest, ...Shadows.level1 }]}
            >
              <ThemedText style={{ fontSize: 13, fontFamily: scorecardTab === 'bowlers' ? 'PlusJakartaSans_700Bold' : 'PlusJakartaSans_600SemiBold', color: scorecardTab === 'bowlers' ? theme.primary : theme.textSecondary }}>
                Bowlers
              </ThemedText>
            </Pressable>
          </View>

          {/* Full Batsmen Scorecard */}
          {scorecardTab === 'batsmen' && (
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 }}>
                <Ionicons name="stats-chart-outline" size={16} color={theme.primary} />
                <ThemedText style={{ fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: theme.text }}>
                  Batsmen Scorecard
                </ThemedText>
              </View>

              {/* Sub-Header Row */}
              <View style={[styles.tableRow, { paddingVertical: 6, backgroundColor: theme.surfaceLow + '70', borderRadius: 8, borderBottomWidth: 0, borderLeftWidth: 4, borderLeftColor: 'transparent' }]}>
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

              {getFullBatsmenScorecard().map((b, idx) => {
                const sr = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '-';
                return (
                  <View
                    key={idx}
                    style={[
                      styles.tableRow,
                      { paddingVertical: 10, borderLeftWidth: 4, borderBottomWidth: 1, borderBottomColor: theme.outlineVariant + '15' },
                      b.active
                        ? { backgroundColor: theme.secondaryContainer + '1a', borderLeftColor: theme.secondaryContainer, borderRadius: 8, borderBottomWidth: 0 }
                        : { borderLeftColor: 'transparent' },
                    ]}
                  >
                    <View style={[styles.batsmanNameCell, { gap: 8 }]}>
                      <View style={[styles.playerAvatar, { backgroundColor: theme.primary + '15' }]}>
                        <ThemedText style={{ color: theme.primary, fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold' }}>
                          {b.name ? b.name.trim().charAt(0).toUpperCase() : 'P'}
                        </ThemedText>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <ThemedText style={{ fontSize: 13, fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>
                            {b.name}
                          </ThemedText>
                          {b.active && (
                            <Ionicons name="star" size={8} color={theme.error} style={{ marginLeft: 3 }} />
                          )}
                        </View>
                        <ThemedText style={{ fontSize: 9, color: theme.textSecondary, marginTop: 1 }}>
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
            </View>
          )}

          {/* Full Bowler Scorecard */}
          {scorecardTab === 'bowlers' && (
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 }}>
                <Ionicons name="analytics-outline" size={16} color={theme.primary} />
                <ThemedText style={{ fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: theme.text }}>
                  Bowlers Scorecard
                </ThemedText>
              </View>

              {/* Sub-Header Row */}
              <View style={[styles.tableRow, { paddingVertical: 6, backgroundColor: theme.surfaceLow + '70', borderRadius: 8, borderBottomWidth: 0, borderLeftWidth: 4, borderLeftColor: 'transparent' }]}>
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

              {getFullBowlerScorecard().map((b, idx) => {
                const totalBalls = b.ballsInOver !== undefined ? (b.overs * 6 + b.ballsInOver) : (b.overs * 6);
                const econ = totalBalls > 0 ? ((b.runs / (totalBalls / 6))).toFixed(2) : '0.00';
                const oversDisplay = b.ballsInOver !== undefined ? `${b.overs}.${b.ballsInOver}` : `${b.overs}.0`;

                return (
                  <View
                    key={idx}
                    style={[
                      styles.tableRow,
                      { paddingVertical: 10, borderLeftWidth: 4, borderBottomWidth: 1, borderBottomColor: theme.outlineVariant + '15' },
                      b.active
                        ? { backgroundColor: theme.secondaryContainer + '1a', borderLeftColor: theme.secondaryContainer, borderRadius: 8, borderBottomWidth: 0 }
                        : { borderLeftColor: 'transparent' },
                    ]}
                  >
                    <View style={[styles.batsmanNameCell, { gap: 8 }]}>
                      <View style={[styles.playerAvatar, { backgroundColor: theme.primary + '15' }]}>
                        <ThemedText style={{ color: theme.primary, fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold' }}>
                          {b.name ? b.name.trim().charAt(0).toUpperCase() : 'P'}
                        </ThemedText>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <ThemedText style={{ fontSize: 13, fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>
                            {b.name}
                          </ThemedText>
                          {b.active && (
                            <Ionicons name="star" size={8} color={theme.error} style={{ marginLeft: 3 }} />
                          )}
                        </View>
                        {b.active && (
                          <ThemedText style={{ fontSize: 9, color: theme.textSecondary, marginTop: 1 }}>
                            bowling
                          </ThemedText>
                        )}
                      </View>
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
            </View>
          )}
        </View>
      )}

      {activeSubTab === 'stats' && (
        <View style={{ paddingHorizontal: Spacing.containerMargin, gap: Spacing.md, marginTop: Spacing.sm }}>
          {/* Quick Metrics Cards */}
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <View style={[styles.card, { flex: 1, backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '22', alignItems: 'center', paddingVertical: 14, borderRadius: BorderRadius.xl, borderWidth: 1, borderTopColor: '#10B981', borderTopWidth: 3, ...Shadows.level1 }]}>
              <View style={{ backgroundColor: '#10B98115', padding: 5, borderRadius: 20, marginBottom: 4 }}>
                <Ionicons name="ellipse-outline" size={14} color="#10B981" />
              </View>
              <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: 9, fontFamily: 'PlusJakartaSans_700Bold' }}>DOT BALLS</ThemedText>
              <ThemedText type="headlineLg" style={{ color: theme.text, fontFamily: 'HankenGrotesk_800ExtraBold', marginTop: 2 }}>
                45%
              </ThemedText>
              <ThemedText style={{ fontSize: 9, color: theme.textSecondary, marginTop: 2 }}>9 of 20 balls</ThemedText>
            </View>

            <View style={[styles.card, { flex: 1, backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '22', alignItems: 'center', paddingVertical: 14, borderRadius: BorderRadius.xl, borderWidth: 1, borderTopColor: '#F59E0B', borderTopWidth: 3, ...Shadows.level1 }]}>
              <View style={{ backgroundColor: '#F59E0B15', padding: 5, borderRadius: 20, marginBottom: 4 }}>
                <Ionicons name="flash-outline" size={14} color="#F59E0B" />
              </View>
              <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: 9, fontFamily: 'PlusJakartaSans_700Bold' }}>BOUNDARIES</ThemedText>
              <ThemedText type="headlineLg" style={{ color: theme.text, fontFamily: 'HankenGrotesk_800ExtraBold', marginTop: 2 }}>
                3
              </ThemedText>
              <ThemedText style={{ fontSize: 9, color: theme.textSecondary, marginTop: 2 }}>2 Fours • 1 Six</ThemedText>
            </View>

            <View style={[styles.card, { flex: 1, backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '22', alignItems: 'center', paddingVertical: 14, borderRadius: BorderRadius.xl, borderWidth: 1, borderTopColor: '#8B5CF6', borderTopWidth: 3, ...Shadows.level1 }]}>
              <View style={{ backgroundColor: '#8B5CF615', padding: 5, borderRadius: 20, marginBottom: 4 }}>
                <Ionicons name="gift-outline" size={14} color="#8B5CF6" />
              </View>
              <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: 9, fontFamily: 'PlusJakartaSans_700Bold' }}>EXTRAS</ThemedText>
              <ThemedText type="headlineLg" style={{ color: theme.text, fontFamily: 'HankenGrotesk_800ExtraBold', marginTop: 2 }}>
                7
              </ThemedText>
              <ThemedText style={{ fontSize: 9, color: theme.textSecondary, marginTop: 2 }}>1 WD • 1 NB • 1 B</ThemedText>
            </View>
          </View>

          {/* Active Partnership Card */}
          <View style={[styles.card, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', borderRadius: BorderRadius.xl, borderWidth: 1, padding: 14, ...Shadows.level1 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <Ionicons name="people-outline" size={16} color={theme.primary} />
              <ThemedText type="labelMd" style={{ color: theme.text, fontFamily: 'PlusJakartaSans_700Bold' }}>
                Active Partnership
              </ThemedText>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.surfaceLow + '30', padding: 12, borderRadius: BorderRadius.lg }}>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.playerAvatar, { backgroundColor: theme.primary + '15', width: 28, height: 28, borderRadius: 14 }]}>
                  <ThemedText style={{ color: theme.primary, fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold' }}>A</ThemedText>
                </View>
                <View>
                  <ThemedText style={{ fontSize: 12, fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>Azar</ThemedText>
                  <ThemedText style={{ fontSize: 10, color: theme.textSecondary }}>10 (5)</ThemedText>
                </View>
              </View>

              <View style={{ alignItems: 'center', paddingHorizontal: 12, backgroundColor: theme.primary + '10', paddingVertical: 4, borderRadius: BorderRadius.sm }}>
                <ThemedText style={{ fontSize: 14, fontFamily: 'HankenGrotesk_800ExtraBold', color: theme.primary }}>16</ThemedText>
                <ThemedText style={{ fontSize: 8, color: theme.textSecondary, fontFamily: 'PlusJakartaSans_600SemiBold' }}>runs (9b)</ThemedText>
              </View>

              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                <View style={{ alignItems: 'flex-end' }}>
                  <ThemedText style={{ fontSize: 12, fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>Jaffer</ThemedText>
                  <ThemedText style={{ fontSize: 10, color: theme.textSecondary }}>0 (0)</ThemedText>
                </View>
                <View style={[styles.playerAvatar, { backgroundColor: theme.secondary + '15', width: 28, height: 28, borderRadius: 14 }]}>
                  <ThemedText style={{ color: theme.secondary, fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold' }}>J</ThemedText>
                </View>
              </View>
            </View>

            {/* Visual Partnership Bar */}
            <View style={{ height: 6, backgroundColor: theme.surfaceLow, borderRadius: 3, marginTop: 12, overflow: 'hidden', flexDirection: 'row' }}>
              <View style={{ flex: 10, backgroundColor: theme.primary }} />
              <View style={{ flex: 7, backgroundColor: theme.secondaryContainer }} />
            </View>
          </View>

          {/* Over-by-Over Run Rate Progress Chart */}
          <View style={[styles.card, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', borderRadius: BorderRadius.xl, borderWidth: 1, padding: 14, ...Shadows.level1 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <Ionicons name="bar-chart-outline" size={16} color={theme.primary} />
              <ThemedText type="labelMd" style={{ color: theme.text, fontFamily: 'PlusJakartaSans_700Bold' }}>
                Over-by-Over Run Rate
              </ThemedText>
            </View>

            <View style={{ height: 130, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: theme.outlineVariant + '15' }}>
              {[
                { over: 1, runs: 6, label: '6' },
                { over: 2, runs: 12, label: '12' },
                { over: 3, runs: 8, label: '8' },
                { over: 4, runs: 16, label: '16' },
              ].map((item, idx) => {
                const maxVal = 20;
                const heightPct = (item.runs / maxVal) * 100;
                return (
                  <View key={idx} style={{ alignItems: 'center', flex: 1 }}>
                    <ThemedText style={{ fontSize: 9, color: theme.primary, fontFamily: 'PlusJakartaSans_700Bold', marginBottom: 4 }}>
                      {item.label}
                    </ThemedText>
                    <View style={{ width: 20, height: `${heightPct}%`, backgroundColor: theme.primary, borderTopLeftRadius: 6, borderTopRightRadius: 6, opacity: 0.85 }} />
                    <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: theme.surfaceLow, justifyContent: 'center', alignItems: 'center', marginTop: 8 }}>
                      <ThemedText style={{ fontSize: 7, color: theme.textSecondary, fontFamily: 'PlusJakartaSans_700Bold' }}>
                        {item.over}
                      </ThemedText>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Wagon Wheel Diagram Card */}
          <View style={[styles.card, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', alignItems: 'center', borderRadius: BorderRadius.xl, borderWidth: 1, padding: 14, ...Shadows.level1 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, alignSelf: 'flex-start' }}>
              <Ionicons name="color-palette-outline" size={16} color={theme.primary} />
              <ThemedText type="labelMd" style={{ color: theme.text, fontFamily: 'PlusJakartaSans_700Bold' }}>
                Wagon Wheel
              </ThemedText>
            </View>

            <View style={{ width: 180, height: 180, borderRadius: 90, borderWidth: 2, borderColor: '#10B98144', backgroundColor: '#10B98108', justifyContent: 'center', alignItems: 'center', position: 'relative', marginVertical: 8, overflow: 'hidden' }}>
              <View style={{ width: 32, height: 60, borderRadius: 2, backgroundColor: '#E2E8F0', borderWidth: 1, borderColor: '#CBD5E0', position: 'absolute', opacity: 0.6 }} />
              <View style={{ width: 100, height: 100, borderRadius: 50, borderWidth: 1, borderColor: '#10B98122', borderStyle: 'dashed', position: 'absolute' }} />
              <ThemedText style={{ position: 'absolute', top: 10, fontSize: 8, color: theme.textSecondary, fontFamily: 'PlusJakartaSans_600SemiBold' }}>Off Side</ThemedText>
              <ThemedText style={{ position: 'absolute', bottom: 10, fontSize: 8, color: theme.textSecondary, fontFamily: 'PlusJakartaSans_600SemiBold' }}>Leg Side</ThemedText>
              <ThemedText style={{ position: 'absolute', left: 10, fontSize: 8, color: theme.textSecondary, fontFamily: 'PlusJakartaSans_600SemiBold' }}>Third Man</ThemedText>
              <ThemedText style={{ position: 'absolute', right: 10, fontSize: 8, color: theme.textSecondary, fontFamily: 'PlusJakartaSans_600SemiBold' }}>Fine Leg</ThemedText>

              <View style={{ position: 'absolute', width: 2, height: 75, backgroundColor: '#5D68E8', transform: [{ rotate: '45deg' }], transformOrigin: 'bottom center', bottom: 90, left: 89 }} />
              <View style={{ position: 'absolute', width: 2, height: 90, backgroundColor: '#10B981', transform: [{ rotate: '-60deg' }], transformOrigin: 'bottom center', bottom: 90, left: 89 }} />
              <View style={{ position: 'absolute', width: 2.5, height: 90, backgroundColor: '#8B5CF6', transform: [{ rotate: '120deg' }], transformOrigin: 'bottom center', bottom: 90, left: 89 }} />
            </View>

            <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#5D68E8' }} />
                <ThemedText style={{ fontSize: 9, color: theme.textSecondary, fontFamily: 'PlusJakartaSans_600SemiBold' }}>Singles</ThemedText>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' }} />
                <ThemedText style={{ fontSize: 9, color: theme.textSecondary, fontFamily: 'PlusJakartaSans_600SemiBold' }}>Fours</ThemedText>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#8B5CF6' }} />
                <ThemedText style={{ fontSize: 9, color: theme.textSecondary, fontFamily: 'PlusJakartaSans_600SemiBold' }}>Sixes</ThemedText>
              </View>
            </View>
          </View>
        </View>
      )}

      {activeSubTab === 'details' && (
        <View style={{ paddingHorizontal: Spacing.containerMargin, gap: Spacing.md, marginTop: Spacing.sm }}>
          {/* Match Info Bento Box Card */}
          <View style={[styles.card, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', borderRadius: BorderRadius.xl, borderWidth: 1, padding: 14, ...Shadows.level1 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 }}>
              <Ionicons name="information-circle-outline" size={16} color={theme.primary} />
              <ThemedText type="labelMd" style={{ color: theme.text, fontFamily: 'PlusJakartaSans_700Bold' }}>
                Match Information
              </ThemedText>
            </View>

            {/* Bento Grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {/* Venue (Full Width) */}
              <View style={{ width: '100%', backgroundColor: theme.surfaceLow + '30', padding: 10, borderRadius: BorderRadius.md, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: theme.primary + '15', justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="location-outline" size={14} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={{ fontSize: 9, color: theme.textSecondary, fontFamily: 'PlusJakartaSans_600SemiBold' }}>VENUE</ThemedText>
                  <ThemedText style={{ fontSize: 12, fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>Lord's Turf Ground, Pitch A</ThemedText>
                </View>
              </View>

              {/* Date / Time */}
              <View style={{ width: '48.5%', backgroundColor: theme.surfaceLow + '30', padding: 10, borderRadius: BorderRadius.md, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: theme.primary + '15', justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="calendar-outline" size={12} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={{ fontSize: 8, color: theme.textSecondary, fontFamily: 'PlusJakartaSans_600SemiBold' }}>DATE & TIME</ThemedText>
                  <ThemedText style={{ fontSize: 11, fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>July 2, 2026 • 10:00 AM</ThemedText>
                </View>
              </View>

              {/* Match Format */}
              <View style={{ width: '48.5%', backgroundColor: theme.surfaceLow + '30', padding: 10, borderRadius: BorderRadius.md, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: theme.primary + '15', justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="trophy-outline" size={12} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={{ fontSize: 8, color: theme.textSecondary, fontFamily: 'PlusJakartaSans_600SemiBold' }}>FORMAT</ThemedText>
                  <ThemedText style={{ fontSize: 11, fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>T20 (20 Overs)</ThemedText>
                </View>
              </View>

              {/* Match Type */}
              <View style={{ width: '48.5%', backgroundColor: theme.surfaceLow + '30', padding: 10, borderRadius: BorderRadius.md, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: theme.primary + '15', justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="ribbon-outline" size={12} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={{ fontSize: 8, color: theme.textSecondary, fontFamily: 'PlusJakartaSans_600SemiBold' }}>MATCH TYPE</ThemedText>
                  <ThemedText style={{ fontSize: 11, fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>Quick Match</ThemedText>
                </View>
              </View>

              {/* Umpires */}
              <View style={{ width: '48.5%', backgroundColor: theme.surfaceLow + '30', padding: 10, borderRadius: BorderRadius.md, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: theme.primary + '15', justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="people-outline" size={12} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={{ fontSize: 8, color: theme.textSecondary, fontFamily: 'PlusJakartaSans_600SemiBold' }}>UMPIRES</ThemedText>
                  <ThemedText style={{ fontSize: 11, fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>J. Doe • Kettleboro</ThemedText>
                </View>
              </View>
            </View>
          </View>

          {/* Squad Details Card */}
          <View style={[styles.card, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', borderRadius: BorderRadius.xl, borderWidth: 1, padding: 14, ...Shadows.level1 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 }}>
              <Ionicons name="shield-outline" size={16} color={theme.primary} />
              <ThemedText type="labelMd" style={{ color: theme.text, fontFamily: 'PlusJakartaSans_700Bold' }}>
                Playing Squads
              </ThemedText>
            </View>

            <View style={{ flexDirection: 'row', gap: Spacing.md }}>
              {/* Team A List */}
              <View style={{ flex: 1 }}>
                <View style={{ backgroundColor: theme.primary, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, marginBottom: 10 }}>
                  <ThemedText style={{ fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold', color: '#ffffff', textAlign: 'center' }}>
                    {teamA}
                  </ThemedText>
                </View>
                {[
                  { name: 'Azar', role: 'Capt / Batsman' },
                  { name: 'Jaffer', role: 'Batsman' },
                  { name: 'Kaja', role: 'Batsman' },
                  { name: 'Messi', role: 'All-Rounder' },
                  { name: 'Ronaldo', role: 'All-Rounder' },
                ].map((p, idx) => (
                  <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, borderBottomWidth: idx === 4 ? 0 : 1, borderBottomColor: theme.outlineVariant + '15' }}>
                    <View style={[styles.playerAvatar, { width: 22, height: 22, borderRadius: 11, backgroundColor: theme.primary + '10' }]}>
                      <ThemedText style={{ fontSize: 8, fontFamily: 'PlusJakartaSans_700Bold', color: theme.primary }}>
                        {p.name.charAt(0)}
                      </ThemedText>
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={{ fontSize: 11, color: theme.text, fontFamily: 'HankenGrotesk_700Bold' }}>{p.name}</ThemedText>
                      <ThemedText style={{ fontSize: 8, color: theme.textSecondary }}>{p.role}</ThemedText>
                    </View>
                  </View>
                ))}
              </View>

              {/* Divider line */}
              <View style={{ width: 1, backgroundColor: theme.outlineVariant + '1a' }} />

              {/* Team B List */}
              <View style={{ flex: 1 }}>
                <View style={{ backgroundColor: theme.secondary, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, marginBottom: 10 }}>
                  <ThemedText style={{ fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold', color: '#ffffff', textAlign: 'center' }}>
                    {teamB}
                  </ThemedText>
                </View>
                {[
                  { name: 'Dinesh', role: 'Bowler' },
                  { name: 'Carter', role: 'Bowler' },
                  { name: 'Williams', role: 'All-Rounder' },
                  { name: 'Apex', role: 'All-Rounder' },
                  { name: 'Vanguard', role: 'Bowler' },
                ].map((p, idx) => (
                  <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, borderBottomWidth: idx === 4 ? 0 : 1, borderBottomColor: theme.outlineVariant + '15' }}>
                    <View style={[styles.playerAvatar, { width: 22, height: 22, borderRadius: 11, backgroundColor: theme.secondary + '10' }]}>
                      <ThemedText style={{ fontSize: 8, fontFamily: 'PlusJakartaSans_700Bold', color: theme.secondary }}>
                        {p.name.charAt(0)}
                      </ThemedText>
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={{ fontSize: 11, color: theme.text, fontFamily: 'HankenGrotesk_700Bold' }}>{p.name}</ThemedText>
                      <ThemedText style={{ fontSize: 8, color: theme.textSecondary }}>{p.role}</ThemedText>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
      )}

        {/* Spacer */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {activeSubTab === 'live' && (
        <View style={[styles.stickyBottomBar, { backgroundColor: theme.surfaceLowest, borderTopColor: theme.outlineVariant + '22' }]}>
          <Pressable
            onPress={handleUndo}
            disabled={history.length === 0}
            style={[styles.mainUndoBtn, { flex: 1, backgroundColor: theme.primaryContainer }, history.length === 0 && { opacity: 0.5 }]}
          >
            <Ionicons name="arrow-undo" size={18} color="#ffffff" style={{ marginRight: 6 }} />
            <ThemedText type="labelMd" style={{ color: '#ffffff' }}>Undo Ball</ThemedText>
          </Pressable>

          <Pressable
            onPress={handleEndMatch}
            disabled={isSyncing}
            style={[styles.mainEndMatchBtn, { flex: 1, backgroundColor: theme.error }, isSyncing && { opacity: 0.7 }]}
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
      )}

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

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.logBallsRow}
                >
                  {overLog.map((ball, idx) => {
                    // Determine Ball Type and Color Scheme
                    let bgColor = theme.primary;
                    let textColor = '#ffffff';
                    let borderWidth = 0;
                    let borderColor = 'transparent';

                    const isWicket = ball === 'W';
                    const isDot = ball === '0';
                    const isFour = ball === '4';
                    const isSix = ball === '6';

                    if (isWicket) {
                      bgColor = '#EF4444'; // Red
                      textColor = '#ffffff';
                    } else if (isDot) {
                      bgColor = theme.surfaceLowest;
                      textColor = theme.textSecondary;
                      borderWidth = 1;
                      borderColor = theme.outlineVariant + '33';
                    } else if (isFour) {
                      bgColor = '#10B981'; // Green for 4
                      textColor = '#ffffff';
                    } else if (isSix) {
                      bgColor = '#8B5CF6'; // Purple for 6
                      textColor = '#ffffff';
                    } else if (ball.includes('WD')) {
                      bgColor = '#F59E0B'; // Amber for Wides
                      textColor = '#ffffff';
                    } else if (ball.includes('NB')) {
                      bgColor = '#F43F5E'; // Pink-red for No Balls
                      textColor = '#ffffff';
                    } else if (ball.includes('BYE') || ball.includes('LB')) {
                      bgColor = '#06B6D4'; // Teal for Byes/Leg-byes
                      textColor = '#ffffff';
                    } else {
                      // Default runs 1, 2, 3
                      bgColor = theme.primary;
                      textColor = '#ffffff';
                    }

                    // Parse content for rendering
                    const match = ball.match(/^(\d+)?(WD|NB|BYE|LB)$/);
                    let renderContent;

                    if (match) {
                      const num = match[1];
                      const type = match[2];
                      if (num === undefined) {
                        renderContent = (
                          <ThemedText
                            style={{
                              color: textColor,
                              fontFamily: 'HankenGrotesk_700Bold',
                              fontSize: 12,
                            }}
                          >
                            {type}
                          </ThemedText>
                        );
                      } else {
                        renderContent = (
                          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center' }}>
                            <ThemedText
                              style={{
                                color: textColor,
                                fontFamily: 'HankenGrotesk_800ExtraBold',
                                fontSize: 14,
                              }}
                            >
                              {num}
                            </ThemedText>
                            <ThemedText
                              style={{
                                color: textColor,
                                fontFamily: 'HankenGrotesk_700Bold',
                                fontSize: 8,
                                marginLeft: 1,
                              }}
                            >
                              {type}
                            </ThemedText>
                          </View>
                        );
                      }
                    } else {
                      renderContent = (
                        <ThemedText
                          type="bodyMd"
                          style={{
                            color: textColor,
                            fontFamily: 'HankenGrotesk_700Bold',
                          }}
                        >
                          {ball}
                        </ThemedText>
                      );
                    }

                    return (
                      <View
                        key={idx}
                        style={[
                          styles.logBall,
                          {
                            backgroundColor: bgColor,
                            borderWidth,
                            borderColor,
                          },
                        ]}
                      >
                        {renderContent}
                      </View>
                    );
                  })}
                  {overLog.length === 0 && (
                    <ThemedText type="bodyMd" style={{ color: theme.textSecondary, italic: true } as any}>
                      Starting new over...
                    </ThemedText>
                  )}
                </ScrollView>

                <View style={[styles.bowlerNameRow, { borderTopColor: theme.outlineVariant + '1a', marginTop: Spacing.sm, paddingTop: Spacing.sm }]}>
                  <ThemedText style={{ color: theme.textSecondary, fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold' }}>
                    Bowler: {bowler.name} ({bowler.overs * 6 + bowler.ballsInOver} balls)
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

      {/* Over Completed / Change Bowler Modal */}
      <Modal
        visible={showOverCompleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOverCompleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowOverCompleteModal(false)} />
          <View style={[styles.modalContent, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#10B98115', justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                </View>
                <View>
                  <ThemedText style={{ fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: theme.text }}>
                    Over Completed!
                  </ThemedText>
                  <ThemedText style={{ fontSize: 11, color: theme.textSecondary, marginTop: 1 }}>
                    Batsmen have automatically swapped ends.
                  </ThemedText>
                </View>
              </View>
              <Pressable onPress={() => setShowOverCompleteModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={theme.text} />
              </Pressable>
            </View>

            <View style={{ padding: Spacing.md, gap: Spacing.md }}>
              <View>
                <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginBottom: 8, fontFamily: 'PlusJakartaSans_700Bold' }}>
                  SELECT NEXT BOWLER
                </ThemedText>

                {/* List of other bowlers on the bench */}
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
                >
                  {otherBowlers.map((b) => (
                    <Pressable
                      key={b.name}
                      onPress={() => {
                        executeReplaceBowler(b.name);
                        setShowOverCompleteModal(false);
                      }}
                      style={({ pressed }) => [
                        {
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                          backgroundColor: theme.surfaceLow,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 20,
                          borderWidth: 1,
                          borderColor: theme.outlineVariant + '33',
                        },
                        pressed && { opacity: 0.7 }
                      ]}
                    >
                      <Ionicons name="shirt-outline" size={12} color={theme.primary} />
                      <ThemedText style={{ fontSize: 12, fontFamily: 'HankenGrotesk_600SemiBold', color: theme.text }}>
                        {b.name}
                      </ThemedText>
                    </Pressable>
                  ))}
                  {otherBowlers.length === 0 && (
                    <ThemedText style={{ color: theme.textSecondary, fontSize: 11, fontStyle: 'italic', paddingVertical: 8 }}>
                      No bench bowlers available.
                    </ThemedText>
                  )}
                </ScrollView>
              </View>

              <View>
                <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginBottom: 6, fontFamily: 'PlusJakartaSans_700Bold' }}>
                  OR ADD NEW CUSTOM BOWLER
                </ThemedText>

                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <TextInput
                    style={[styles.modalInput, { flex: 1, color: theme.text, borderColor: theme.outlineVariant, marginBottom: 0 }]}
                    value={customNewName}
                    onChangeText={setCustomNewName}
                    placeholder="Enter new bowler's name..."
                    placeholderTextColor={theme.textSecondary + '70'}
                  />
                  <Pressable
                    onPress={() => {
                      if (!customNewName.trim()) {
                        Alert.alert('Error', 'Please enter a bowler name.');
                        return;
                      }
                      executeReplaceBowler(customNewName);
                      setShowOverCompleteModal(false);
                    }}
                    style={[styles.addBtn, { backgroundColor: theme.primary, height: 40 }]}
                  >
                    <ThemedText type="labelMd" style={{ color: '#ffffff' }}>Set Bowler</ThemedText>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Extra Runs Selection Modal */}
      <Modal
        visible={showExtraModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowExtraModal(false);
          setActiveExtraType(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => {
              setShowExtraModal(false);
              setActiveExtraType(null);
            }}
          />
          <View style={[styles.modalContent, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', maxHeight: '70%' }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="headlineSm" style={{ color: theme.text }}>
                {activeExtraType === 'WD' ? 'Record Wide Ball' :
                  activeExtraType === 'NB' ? 'Record No Ball' :
                    activeExtraType === 'BYE' ? 'Record Bye' : 'Record Leg Bye'}
              </ThemedText>
              <Pressable
                onPress={() => {
                  setShowExtraModal(false);
                  setActiveExtraType(null);
                }}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              <ThemedText style={{ color: theme.textSecondary, marginBottom: 16, fontSize: 13 }}>
                Select the runs and over configuration for this extra delivery:
              </ThemedText>

              {/* Wide & No Ball options */}
              {(activeExtraType === 'WD' || activeExtraType === 'NB') && (
                <View style={{ gap: 10 }}>
                  <Pressable
                    style={[styles.extraOptionBtn, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '22' }]}
                    onPress={() => {
                      if (activeExtraType) recordExtraWithRuns(activeExtraType, 1, false);
                      setShowExtraModal(false);
                    }}
                  >
                    <ThemedText style={{ fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>1 Run (Re-bowl)</ThemedText>
                    <ThemedText style={{ fontSize: 10, color: theme.textSecondary }}>Standard extra penalty run, delivery re-bowled</ThemedText>
                  </Pressable>

                  <Pressable
                    style={[styles.extraOptionBtn, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '22' }]}
                    onPress={() => {
                      if (activeExtraType) recordExtraWithRuns(activeExtraType, 2, false);
                      setShowExtraModal(false);
                    }}
                  >
                    <ThemedText style={{ fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>2 Runs (Re-bowl)</ThemedText>
                    <ThemedText style={{ fontSize: 10, color: theme.textSecondary }}>2 extra runs, delivery re-bowled</ThemedText>
                  </Pressable>

                  <Pressable
                    style={[styles.extraOptionBtn, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '22' }]}
                    onPress={() => {
                      if (activeExtraType) recordExtraWithRuns(activeExtraType, 3, false);
                      setShowExtraModal(false);
                    }}
                  >
                    <ThemedText style={{ fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>3 Runs (Re-bowl)</ThemedText>
                    <ThemedText style={{ fontSize: 10, color: theme.textSecondary }}>3 extra runs, delivery re-bowled</ThemedText>
                  </Pressable>

                  <Pressable
                    style={[styles.extraOptionBtn, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '22' }]}
                    onPress={() => {
                      if (activeExtraType) recordExtraWithRuns(activeExtraType, 0, false);
                      setShowExtraModal(false);
                    }}
                  >
                    <ThemedText style={{ fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>0 Runs (Re-bowl)</ThemedText>
                    <ThemedText style={{ fontSize: 10, color: theme.textSecondary }}>No penalty runs, but delivery re-bowled</ThemedText>
                  </Pressable>

                  <Pressable
                    style={[styles.extraOptionBtn, { backgroundColor: theme.primaryContainer + '22', borderColor: theme.primary }]}
                    onPress={() => {
                      if (activeExtraType) recordExtraWithRuns(activeExtraType, 0, true);
                      setShowExtraModal(false);
                    }}
                  >
                    <ThemedText style={{ fontFamily: 'HankenGrotesk_700Bold', color: theme.primary }}>Ball Count & 0 Runs</ThemedText>
                    <ThemedText style={{ fontSize: 10, color: theme.textSecondary }}>Counts as a legal ball in the over, 0 runs added</ThemedText>
                  </Pressable>
                </View>
              )}

              {/* Bye & Leg Bye options */}
              {(activeExtraType === 'BYE' || activeExtraType === 'LB') && (
                <View style={{ gap: 10 }}>
                  <Pressable
                    style={[styles.extraOptionBtn, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '22' }]}
                    onPress={() => {
                      if (activeExtraType) recordExtraWithRuns(activeExtraType, 1, true);
                      setShowExtraModal(false);
                    }}
                  >
                    <ThemedText style={{ fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>1 Run</ThemedText>
                    <ThemedText style={{ fontSize: 10, color: theme.textSecondary }}>1 bye/leg-bye run, counts as a legal ball</ThemedText>
                  </Pressable>

                  <Pressable
                    style={[styles.extraOptionBtn, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '22' }]}
                    onPress={() => {
                      if (activeExtraType) recordExtraWithRuns(activeExtraType, 2, true);
                      setShowExtraModal(false);
                    }}
                  >
                    <ThemedText style={{ fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>2 Runs</ThemedText>
                    <ThemedText style={{ fontSize: 10, color: theme.textSecondary }}>2 bye/leg-bye runs, counts as a legal ball</ThemedText>
                  </Pressable>

                  <Pressable
                    style={[styles.extraOptionBtn, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '22' }]}
                    onPress={() => {
                      if (activeExtraType) recordExtraWithRuns(activeExtraType, 3, true);
                      setShowExtraModal(false);
                    }}
                  >
                    <ThemedText style={{ fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>3 Runs</ThemedText>
                    <ThemedText style={{ fontSize: 10, color: theme.textSecondary }}>3 bye/leg-bye runs, counts as a legal ball</ThemedText>
                  </Pressable>

                  <Pressable
                    style={[styles.extraOptionBtn, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '22' }]}
                    onPress={() => {
                      if (activeExtraType) recordExtraWithRuns(activeExtraType, 4, true);
                      setShowExtraModal(false);
                    }}
                  >
                    <ThemedText style={{ fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>4 Runs</ThemedText>
                    <ThemedText style={{ fontSize: 10, color: theme.textSecondary }}>4 bye/leg-bye runs (boundary), counts as a legal ball</ThemedText>
                  </Pressable>

                  <Pressable
                    style={[styles.extraOptionBtn, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '22' }]}
                    onPress={() => {
                      if (activeExtraType) recordExtraWithRuns(activeExtraType, 0, true);
                      setShowExtraModal(false);
                    }}
                  >
                    <ThemedText style={{ fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>0 Runs (Dot Ball)</ThemedText>
                    <ThemedText style={{ fontSize: 10, color: theme.textSecondary }}>Counts as a legal ball, 0 runs added</ThemedText>
                  </Pressable>
                </View>
              )}

              <Pressable
                onPress={() => {
                  setShowExtraModal(false);
                  setActiveExtraType(null);
                }}
                style={[styles.cancelBtn, { borderColor: theme.outlineVariant, width: '100%', marginTop: 20, paddingVertical: 10 }]}
              >
                <ThemedText type="labelMd" style={{ color: theme.textSecondary, textAlign: 'center' }}>
                  Cancel
                </ThemedText>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  mainActionButtons: {
    marginVertical: Spacing.sm,
  },
  mainUndoBtn: {
    flexDirection: 'row',
    height: 44,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainEndMatchBtn: {
    flexDirection: 'row',
    height: 44,
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
  rulesGroup: {
    marginBottom: Spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    padding: 12,
    borderRadius: BorderRadius.md,
  },
  rulesGroupLabel: {
    marginBottom: Spacing.sm,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  rulesOptionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  ruleOptionChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  ruleCheckbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  extraOptionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  subTabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: Spacing.containerMargin,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  subTabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    marginRight: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 4,
  },
  subTabText: {
    fontSize: 10.5,
    fontFamily: 'HankenGrotesk_600SemiBold',
  },
});
