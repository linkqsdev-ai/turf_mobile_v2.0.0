// Updated cricket scoring console - auto scroll and pre-verification options
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
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { matchApi } from '@/services/match-api';
import { useMatchStore } from '@/store/app-store';
import { ScoreboardBoundaryWatermark } from '@/components/scoring/ScoreboardBoundaryWatermark';
import { saveMatchToOwnBoard } from '@/store/own-board-store';
import { exportScoreSheetPDF } from '@/services/score-sheet-pdf';
import { CoinTossModal } from '@/components/coin-toss-modal';

interface Batsman {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  active: boolean;
  avatar?: string;
  outInfo?: string;
}

interface Bowler {
  name: string;
  overs: number;
  ballsInOver: number;
  maidens: number;
  runs: number;
  wickets: number;
  avatar?: string;
}

function PlayerDropdownSelector({
  value,
  onSelectPlayer,
  onCustomNameChange,
  squadList,
  otherSelectedName,
  dismissedNames,
  placeholder,
  theme,
  isOpen,
  setIsOpen,
}: {
  value: string;
  onSelectPlayer: (name: string, avatar?: string) => void;
  onCustomNameChange: (name: string) => void;
  squadList: Array<{ name: string; avatar?: string; mobile?: string }>;
  otherSelectedName?: string;
  dismissedNames?: string[];
  placeholder: string;
  theme: any;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) {
  const [isCustomMode, setIsCustomMode] = useState(false);

  if (isCustomMode) {
    return (
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <TextInput
          style={[styles.modalInput, { flex: 1, color: '#0f172a', borderColor: theme.primary, backgroundColor: '#ffffff', marginBottom: 0 }]}
          value={value}
          onChangeText={(val) => onCustomNameChange(val.replace(/[^a-zA-Z\s]/g, ''))}
          placeholder="Enter player name..."
          placeholderTextColor="#94a3b8"
          maxLength={25}
          autoFocus
        />
        <Pressable
          onPress={() => setIsCustomMode(false)}
          style={{ backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1' }}
        >
          <Ionicons name="list" size={16} color={theme.primary} />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, position: 'relative', zIndex: isOpen ? 99999 : 1 }}>
      <Pressable
        onPress={() => setIsOpen(!isOpen)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#ffffff',
          borderWidth: 1.5,
          borderColor: isOpen ? theme.primary : '#cbd5e1',
          borderRadius: 8,
          paddingHorizontal: 10,
          height: 36,
        }}
      >
        <ThemedText
          style={{
            fontSize: 13,
            fontFamily: 'Sora_700Bold',
            color: value ? '#0f172a' : '#94a3b8',
          }}
          numberOfLines={1}
        >
          {value || placeholder}
        </ThemedText>
        <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={18} color={theme.primary} />
      </Pressable>

      {isOpen && (
        <View
          style={{
            position: 'absolute',
            top: 46,
            left: 0,
            right: 0,
            backgroundColor: '#ffffff',
            borderRadius: 10,
            borderWidth: 1.5,
            borderColor: theme.primary,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.25,
            shadowRadius: 12,
            elevation: 25,
            maxHeight: 190,
            zIndex: 99999,
            overflow: 'hidden',
          }}
        >
          <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={{ backgroundColor: '#ffffff' }}>
            {/* Option 1: + Add New Player */}
            <Pressable
              onPress={() => {
                setIsOpen(false);
                setIsCustomMode(true);
              }}
              style={({ pressed }) => [{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderBottomWidth: 1,
                borderBottomColor: '#e2e8f0',
                backgroundColor: pressed ? theme.primary + '20' : theme.primary + '10',
              }]}
            ><Ionicons name="add-circle" size={18} color={theme.primary} style={{ marginRight: 8 }} /><ThemedText style={{ fontSize: 12, fontFamily: 'Sora_700Bold', color: theme.primary }}>+ Add New Player</ThemedText></Pressable>

            {/* Squad List */}
            {squadList.map((p, idx) => {
              const isSelectedInOtherSlot = Boolean(
                otherSelectedName &&
                otherSelectedName.trim().length > 0 &&
                p.name.trim().toLowerCase() === otherSelectedName.trim().toLowerCase()
              );
              const isDismissedOut = Boolean(
                dismissedNames &&
                dismissedNames.some(dName => dName && dName.trim().toLowerCase() === p.name.trim().toLowerCase())
              );
              const isDisabled = isSelectedInOtherSlot || isDismissedOut;

              return (
                <Pressable
                  key={idx}
                  disabled={isDisabled}
                  onPress={() => {
                    if (isDisabled) return;
                    setIsOpen(false);
                    onSelectPlayer(p.name, p.avatar);
                  }}
                  style={({ pressed }) => [{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 9,
                    paddingHorizontal: 12,
                    borderBottomWidth: idx === squadList.length - 1 ? 0 : 1,
                    borderBottomColor: '#f1f5f9',
                    backgroundColor: isDisabled ? '#f8fafc' : pressed ? '#f1f5f9' : '#ffffff',
                    opacity: isDisabled ? 0.45 : 1,
                  }]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 6 }}>
                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: isDisabled ? '#94a3b830' : theme.primary + '15', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                      <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_700Bold', color: isDisabled ? '#64748b' : theme.primary }}>
                        {p.name ? p.name.charAt(0).toUpperCase() : 'P'}
                      </ThemedText>
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_600SemiBold', color: isDisabled ? '#64748b' : '#0f172a' }} numberOfLines={1}>
                        {p.name}
                      </ThemedText>
                      {p.mobile ? <ThemedText style={{ fontSize: 9, color: '#94a3b8' }}>{`📱 ${p.mobile}`}</ThemedText> : null}
                    </View>
                  </View>
                  {isSelectedInOtherSlot && (
                    <View style={{ backgroundColor: '#fef3c7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                      <ThemedText style={{ fontSize: 8.5, color: '#d97706', fontFamily: 'Sora_700Bold' }}>Selected</ThemedText>
                    </View>
                  )}
                  {isDismissedOut && (
                    <View style={{ backgroundColor: '#fee2e2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                      <ThemedText style={{ fontSize: 8.5, color: '#dc2626', fontFamily: 'Sora_700Bold' }}>Out</ThemedText>
                    </View>
                  )}
                </Pressable>
              );
            })}

            {squadList.length === 0 && (
              <View style={{ padding: 12, alignItems: 'center', backgroundColor: '#ffffff' }}>
                <ThemedText style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>
                  No extra squad players available.
                </ThemedText>
              </View>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const playVictoryAudienceSound = async () => {
  try {
    if (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();

      // Sound 1: Stadium Fanfare Chimes (C5 - E5 - G5 - C6)
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
        gain.gain.setValueAtTime(0.3, ctx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 0.6);
      });

      // Sound 2: Stadium Audience Clapping & Cheering Noise
      const bufferSize = ctx.sampleRate * 2.5;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1200;
      filter.Q.value = 1.2;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(ctx.currentTime);
    }
  } catch (err) {
    console.log('Victory audio sound effect:', err);
  }
};

export default function CricketScoring({
  matchId,
  teamA = 'London Lions',
  teamB = 'Kent Kings',
  totalOvers = '20',
  autoWide = '1',
  autoNoBall = '1',
  allowByes = '1',
}: {
  matchId?: string;
  teamA?: string;
  teamB?: string;
  totalOvers?: string;
  autoWide?: string;
  autoNoBall?: string;
  allowByes?: string;
}) {
  const theme = useTheme();
  const router = useRouter();

  const [showScoringModal, setShowScoringModal] = useState(false);
  const [showScoringPad, setShowScoringPad] = useState(true);
  const [showBatsmenModal, setShowBatsmenModal] = useState(false);
  const [showBowlersModal, setShowBowlersModal] = useState(false);
  const [showEditPlayersModal, setShowEditPlayersModal] = useState(false);
  const [showEndMatchModal, setShowEndMatchModal] = useState(false);
  const [coinTossVisible, setCoinTossVisible] = useState(false);
  const [activeDropdownKey, setActiveDropdownKey] = useState<string | null>(null);
  const modalScrollRef = React.useRef<ScrollView>(null);

  React.useEffect(() => {
    if (activeDropdownKey && showEditPlayersModal) {
      setTimeout(() => {
        if (activeDropdownKey === 'bowler' || activeDropdownKey === 'b2') {
          modalScrollRef.current?.scrollToEnd({ animated: true });
        } else if (activeDropdownKey === 'b1') {
          modalScrollRef.current?.scrollTo({ y: 140, animated: true });
        }
      }, 100);
    }
  }, [activeDropdownKey, showEditPlayersModal]);
  const [showPreRulesModal, setShowPreRulesModal] = useState(false);
  const [currentTotalOvers, setCurrentTotalOvers] = useState<string>(totalOvers);
  const [editTotalOversInput, setEditTotalOversInput] = useState(totalOvers);
  const [tossText, setTossText] = useState<string>(`${teamA} won toss & select bat`);
  const [ruleAutoWide, setRuleAutoWide] = useState(autoWide === '1');
  const [ruleAutoNoBall, setRuleAutoNoBall] = useState(autoNoBall === '1');
  const [ruleAllowByes, setRuleAllowByes] = useState(allowByes === '1');

  // 🔔 Animated Toast Notification State (Success / Warning / Error / Info)
  const [toastConfig, setToastConfig] = useState<{
    visible: boolean;
    type: 'success' | 'warning' | 'error' | 'info';
    message: string;
  }>({ visible: false, type: 'info', message: '' });

  const toastAnimY = React.useRef(new Animated.Value(-100)).current;
  const toastOpacity = React.useRef(new Animated.Value(0)).current;
  const toastTimeoutRef = React.useRef<any>(null);

  const showToast = (type: 'success' | 'warning' | 'error' | 'info', message: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastConfig({ visible: true, type, message });
    toastAnimY.setValue(-80);
    toastOpacity.setValue(0);

    Animated.parallel([
      Animated.spring(toastAnimY, {
        toValue: 16,
        useNativeDriver: true,
        friction: 7,
        tension: 80,
      }),
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    toastTimeoutRef.current = setTimeout(() => {
      hideToast();
    }, 3200);
  };

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(toastAnimY, {
        toValue: -80,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToastConfig(prev => ({ ...prev, visible: false }));
    });
  };

  React.useEffect(() => {
    if (totalOvers) {
      setCurrentTotalOvers(totalOvers);
      setEditTotalOversInput(totalOvers);
    }
  }, [totalOvers]);
  const [showOverCompleteModal, setShowOverCompleteModal] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [matchVictoryData, setMatchVictoryData] = useState<any>(null);

  // 🪙 Rematch 3D Coin Flip Toss States
  const [showRematchTossModal, setShowRematchTossModal] = useState(false);
  const [rematchTossWinner, setRematchTossWinner] = useState<string>(teamA);
  const [rematchTossDecision, setRematchTossDecision] = useState<'Bat' | 'Bowl'>('Bat');
  const [isFlippingCoin, setIsFlippingCoin] = useState(false);
  const [coinSide, setCoinSide] = useState<'HEADS' | 'TAILS' | null>(null);

  const coinRotateAnim = React.useRef(new Animated.Value(0)).current;

  const playCoinFlipSound = async () => {
    try {
      if (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();

        // Metallic Coin Spin Sweep Sound (1200Hz -> 2400Hz -> 1800Hz)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + 0.3);
        osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.8);

        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.9);

        // Metallic Landing Ping Ring (2800Hz)
        setTimeout(() => {
          try {
            const pingOsc = ctx.createOscillator();
            const pingGain = ctx.createGain();
            pingOsc.type = 'triangle';
            pingOsc.frequency.setValueAtTime(2800, ctx.currentTime);
            pingGain.gain.setValueAtTime(0.5, ctx.currentTime);
            pingGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
            pingOsc.connect(pingGain);
            pingGain.connect(ctx.destination);
            pingOsc.start();
            pingOsc.stop(ctx.currentTime + 0.4);
          } catch (e) { }
        }, 950);
      }
    } catch (err) {
      console.log('Coin flip sound:', err);
    }
  };

  const flipCoinForToss = () => {
    if (isFlippingCoin) return;
    setIsFlippingCoin(true);
    setCoinSide(null);

    // Trigger metallic coin spin audio sound effect
    playCoinFlipSound();

    coinRotateAnim.setValue(0);
    Animated.timing(coinRotateAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start(() => {
      setIsFlippingCoin(false);
      const isHeads = Math.random() > 0.5;
      setCoinSide(isHeads ? 'HEADS' : 'TAILS');
      const randomWinner = Math.random() > 0.5 ? teamA : teamB;
      setRematchTossWinner(randomWinner);
    });
  };
  const trophyAnimScale = React.useRef(new Animated.Value(0.2)).current;
  const confettiBounceAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (showVictoryModal) {
      // Trigger audience cheering and clapping fanfare audio sound effect
      playVictoryAudienceSound();

      trophyAnimScale.setValue(0.2);
      Animated.spring(trophyAnimScale, {
        toValue: 1,
        friction: 3.5,
        tension: 140,
        useNativeDriver: true,
      }).start();

      // Continuous bounce loop for particle confetti
      Animated.loop(
        Animated.sequence([
          Animated.timing(confettiBounceAnim, {
            toValue: -8,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(confettiBounceAnim, {
            toValue: 4,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [showVictoryModal]);
  const [activeSubTab, setActiveSubTab] = useState<'live' | 'scorecard' | 'stats' | 'details'>('live');
  const [scorecardTab, setScorecardTab] = useState<'batsmen' | 'bowlers'>('batsmen');

  // Scoreboard State
  const [boundaryAnim, setBoundaryAnim] = useState<{ type: 4 | 6; batsmanName: string } | null>(null);
  const [runs, setRuns] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [overs, setOvers] = useState(0);
  const [ballsInCurrentOver, setBallsInCurrentOver] = useState(0); // 0.0 overs initially
  const [overLog, setOverLog] = useState<string[]>([]);
  const [history, setHistory] = useState<any[]>([]); // for undo support (capped at 20)
  // Fix #9: Guard flag to block recording after innings ends
  const [isInningsOver, setIsInningsOver] = useState(false);
  // Fix #6: Free-hit flag — next delivery ball is not counted against batsman
  const [lastWasNoBall, setLastWasNoBall] = useState(false);
  // Fix #7: Store second-innings score for real PDF export
  const [innings2ScoreRecord, setInnings2ScoreRecord] = useState<{ runs: number; wickets: number; overs: number; balls: number } | null>(null);

  // Innings & Target Chase State
  const [currentInnings, setCurrentInnings] = useState<1 | 2>(1);
  const [firstInningsScore, setFirstInningsScore] = useState<{ runs: number; wickets: number; overs: number; balls: number } | null>(null);
  const [battingTeamName, setBattingTeamName] = useState<string>(teamA);
  const [bowlingTeamName, setBowlingTeamName] = useState<string>(teamB);

  const [showExtraModal, setShowExtraModal] = useState(false);
  const [activeExtraType, setActiveExtraType] = useState<'WD' | 'NB' | 'BYE' | 'LB' | null>(null);

  // Wicket detail sheet — lets a run out record the runs completed before the
  // dismissal and which batsman was actually out.
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [wicketRuns, setWicketRuns] = useState(0);
  const [wicketWhoIsOut, setWicketWhoIsOut] = useState<'striker' | 'non-striker'>('striker');

  // Full Squad Roster Modal States
  const [showFullSquadModal, setShowFullSquadModal] = useState(false);
  const [squadTab, setSquadTab] = useState<'A' | 'B'>('A');
  const [newSquadPlayerName, setNewSquadPlayerName] = useState('');
  const [newSquadPlayerMobile, setNewSquadPlayerMobile] = useState('');
  const [newSquadPlayerImage, setNewSquadPlayerImage] = useState<string | null>(null);
  const [newSquadPlayerRole, setNewSquadPlayerRole] = useState('Batsman');

  const pickSquadPlayerImage = () => {
    Alert.alert(
      'Upload Player Photo',
      'Choose an option to upload or capture player picture:',
      [
        {
          text: '📷 Take Photo (Camera)',
          onPress: async () => {
            try {
              const permission = await ImagePicker.requestCameraPermissionsAsync();
              if (!permission.granted) {
                Alert.alert('Permission Required', 'Camera access is needed to capture photo.');
                return;
              }
              const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });
              if (!result.canceled && result.assets && result.assets.length > 0) {
                setNewSquadPlayerImage(result.assets[0].uri);
              }
            } catch (err) {
              console.log('Error capturing photo', err);
            }
          },
        },
        {
          text: '🖼️ Choose from Gallery',
          onPress: async () => {
            try {
              const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (!permission.granted) {
                Alert.alert('Permission Required', 'Gallery access is needed to pick photo.');
                return;
              }
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });
              if (!result.canceled && result.assets && result.assets.length > 0) {
                setNewSquadPlayerImage(result.assets[0].uri);
              }
            } catch (err) {
              console.log('Error picking gallery image', err);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // Player Stats State (Empty by default for a clean start when starting a new match!)
  const [batsmen, setBatsmen] = useState<Batsman[]>([]);

  const [bowler, setBowler] = useState<Bowler>(
    { name: '', overs: 0, ballsInOver: 0, maidens: 0, runs: 0, wickets: 0 }
  );

  // Squad Lists State
  const [dismissedBatsmen, setDismissedBatsmen] = useState<any[]>([]);
  const [yetToBatBatsmen, setYetToBatBatsmen] = useState<any[]>([]);
  const [otherBowlers, setOtherBowlers] = useState<any[]>([]);

  const { teams, addPlayerToTeam } = useMatchStore();

  // Sync squad players from persistent team store on mount or team change
  React.useEffect(() => {
    const currentBatTeam = battingTeamName || teamA;
    const currentBowlTeam = bowlingTeamName || teamB;

    const batTeamObj = teams.find(t => t.name.toLowerCase() === currentBatTeam.toLowerCase());
    const bowlTeamObj = teams.find(t => t.name.toLowerCase() === currentBowlTeam.toLowerCase());

    if (batTeamObj && batTeamObj.players && batTeamObj.players.length > 0) {
      setYetToBatBatsmen([...batTeamObj.players]);
    }
    if (bowlTeamObj && bowlTeamObj.players && bowlTeamObj.players.length > 0) {
      setOtherBowlers([...bowlTeamObj.players]);
    }
  }, [battingTeamName, bowlingTeamName, teamA, teamB, teams, currentInnings]);

  // Computed bench batsmen (strictly excluding currently active batsmen, dismissed batsmen, and deduplicated by name)
  const availableBenchBatsmen = React.useMemo(() => {
    const activeNames = new Set(
      batsmen
        .map(b => (b && b.name ? b.name.trim().toLowerCase() : ''))
        .filter(n => n !== '' && n !== 'batsman 1' && n !== 'batsman 2')
    );
    const dismissedNames = new Set(
      dismissedBatsmen.map(db => (db && db.name ? db.name.trim().toLowerCase() : ''))
    );

    const map = new Map<string, any>();
    for (const p of yetToBatBatsmen) {
      if (!p) continue;
      const bName = typeof p === 'string' ? p : (p.name || '');
      if (!bName) continue;
      const nameLower = bName.trim().toLowerCase();
      if (!activeNames.has(nameLower) && !dismissedNames.has(nameLower) && !map.has(nameLower)) {
        map.set(nameLower, typeof p === 'string' ? { name: p } : p);
      }
    }
    return Array.from(map.values());
  }, [yetToBatBatsmen, batsmen, dismissedBatsmen]);

  // Computed bench bowlers (strictly excluding current active bowler, active batsmen, dismissed batsmen, and deduplicated by name)
  const availableBenchBowlers = React.useMemo(() => {
    const activeBowlerName = bowler && bowler.name ? bowler.name.trim().toLowerCase() : '';
    const activeBatNames = new Set(
      batsmen
        .map(b => (b && b.name ? b.name.trim().toLowerCase() : ''))
        .filter(n => n.length > 0)
    );
    const dismissedBatNames = new Set(
      dismissedBatsmen
        .map(b => (b && b.name ? b.name.trim().toLowerCase() : ''))
        .filter(n => n.length > 0)
    );

    const map = new Map<string, any>();
    for (const b of otherBowlers) {
      if (!b) continue;
      const bName = typeof b === 'string' ? b : (b.name || '');
      if (!bName) continue;
      const nameLower = bName.trim().toLowerCase();
      if (nameLower !== activeBowlerName && !activeBatNames.has(nameLower) && !dismissedBatNames.has(nameLower) && !map.has(nameLower)) {
        map.set(nameLower, typeof b === 'string' ? { name: b } : b);
      }
    }
    return Array.from(map.values());
  }, [otherBowlers, bowler, batsmen, dismissedBatsmen]);

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

  // Player Avatars State
  const [b1Avatar, setB1Avatar] = useState<string | undefined>(undefined);
  const [b2Avatar, setB2Avatar] = useState<string | undefined>(undefined);
  const [bowlAvatar, setBowlAvatar] = useState<string | undefined>(undefined);

  // Helper Sanitizers & Validators
  const sanitizePlayerName = (val: string) => {
    // Only letters, spaces, hyphens, and apostrophes allowed (NO NUMBERS)
    return val.replace(/[^a-zA-Z\s'-]/g, '').slice(0, 25);
  };

  const sanitizeNumericInput = (val: string, maxDigits: number = 3) => {
    if (!val || val === 'undefined' || val === 'NaN') return '0';
    const cleaned = val.replace(/[^0-9]/g, '').slice(0, maxDigits);
    return cleaned === '' ? '0' : cleaned;
  };

  const handlePickAvatar = async (target: 'b1' | 'b2' | 'bowler') => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Media library access is required to choose a player photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        if (target === 'b1') setB1Avatar(uri);
        else if (target === 'b2') setB2Avatar(uri);
        else if (target === 'bowler') setBowlAvatar(uri);
      }
    } catch (err: any) {
      Alert.alert('Error', 'Unable to pick image.');
    }
  };

  // Replacement/Retire sub-state inside edit modal
  const [actionTarget, setActionTarget] = useState<{ type: 'retire' | 'replace' | 'bowler'; batsmanIndex?: number } | null>(null);
  const [customNewName, setCustomNewName] = useState('');

  const handleSwapStrike = () => {
    if (batsmen.length < 2 || !batsmen[0]?.name?.trim() || !batsmen[1]?.name?.trim()) {
      Alert.alert('Batsmen Required', 'Please assign 2 active opening batsmen before swapping strike ends.');
      return;
    }

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
    const list: any[] = [...dismissedBatsmen];
    const existingNames = new Set<string>(
      dismissedBatsmen
        .map(db => (db && db.name ? db.name.trim().toLowerCase() : ''))
        .filter(Boolean)
    );

    if (batsmen[0] && batsmen[0].name && batsmen[0].name.trim().length > 0) {
      const name0 = batsmen[0].name.trim().toLowerCase();
      if (!existingNames.has(name0)) {
        list.push({ ...batsmen[0], status: 'not out' });
        existingNames.add(name0);
      }
    }
    if (batsmen[1] && batsmen[1].name && batsmen[1].name.trim().length > 0) {
      const name1 = batsmen[1].name.trim().toLowerCase();
      if (!existingNames.has(name1)) {
        list.push({ ...batsmen[1], status: 'not out' });
        existingNames.add(name1);
      }
    }
    yetToBatBatsmen.forEach(b => {
      const bName = typeof b === 'string' ? b : (b && b.name ? b.name : '');
      if (bName && bName.trim().length > 0) {
        const nameLower = bName.trim().toLowerCase();
        if (!existingNames.has(nameLower)) {
          list.push({ ...(typeof b === 'string' ? { name: bName } : b), status: 'yet to bat' });
          existingNames.add(nameLower);
        }
      }
    });
    return list;
  };

  const getFullBowlerScorecard = () => {
    const list: any[] = [];
    const existingNames = new Set<string>();

    if (bowler && bowler.name && bowler.name.trim().length > 0) {
      const bNameLower = bowler.name.trim().toLowerCase();
      list.push({
        ...bowler,
        overs: bowler.overs || 0,
        ballsInOver: bowler.ballsInOver || 0,
        maidens: bowler.maidens || 0,
        runs: bowler.runs || 0,
        wickets: bowler.wickets || 0,
        active: true,
      });
      existingNames.add(bNameLower);
    }
    otherBowlers.forEach(b => {
      const bName = typeof b === 'string' ? b : (b && b.name ? b.name : '');
      if (bName && bName.trim().length > 0) {
        const nameLower = bName.trim().toLowerCase();
        if (!existingNames.has(nameLower)) {
          list.push({
            ...(typeof b === 'string' ? { name: bName } : b),
            overs: b.overs || 0,
            ballsInOver: b.ballsInOver || 0,
            maidens: b.maidens || 0,
            runs: b.runs || 0,
            wickets: b.wickets || 0,
            active: false,
          });
          existingNames.add(nameLower);
        }
      }
    });
    return list;
  };

  // Helper Player Management Handlers
  const openEditPlayersModal = () => {
    setB1Name(batsmen[0]?.name || '');
    setB1Runs(String(batsmen[0]?.runs || 0));
    setB1Balls(String(batsmen[0]?.balls || 0));
    setB1Fours(String(batsmen[0]?.fours || 0));
    setB1Sixes(String(batsmen[0]?.sixes || 0));
    setB1Avatar(batsmen[0]?.avatar);

    setB2Name(batsmen[1]?.name || '');
    setB2Runs(String(batsmen[1]?.runs || 0));
    setB2Balls(String(batsmen[1]?.balls || 0));
    setB2Fours(String(batsmen[1]?.fours || 0));
    setB2Sixes(String(batsmen[1]?.sixes || 0));
    setB2Avatar(batsmen[1]?.avatar);

    setBowlName(bowler?.name || '');
    setBowlOvers(bowler && typeof bowler.overs === 'number' && !isNaN(bowler.overs) ? String(bowler.overs) : '0');
    setBowlRuns(bowler && typeof bowler.runs === 'number' && !isNaN(bowler.runs) ? String(bowler.runs) : '0');
    setBowlWickets(bowler && typeof bowler.wickets === 'number' && !isNaN(bowler.wickets) ? String(bowler.wickets) : '0');
    setBowlMaidens(bowler && typeof bowler.maidens === 'number' && !isNaN(bowler.maidens) ? String(bowler.maidens) : '0');
    setBowlAvatar(bowler?.avatar);

    setActionTarget(null);
    setCustomNewName('');
    setShowEditPlayersModal(true);
  };

  const savePlayersEdit = () => {
    // Perform strict field validations before saving!
    if (b1Name.trim() && b1Name.trim().length < 2) {
      showToast('warning', 'Batsman 1 name must be at least 2 characters long.');
      return;
    }
    if (b2Name.trim() && b2Name.trim().length < 2) {
      showToast('warning', 'Batsman 2 name must be at least 2 characters long.');
      return;
    }
    if (b1Name.trim() && b2Name.trim() && b1Name.trim().toLowerCase() === b2Name.trim().toLowerCase()) {
      showToast('error', `Batsman 1 and Batsman 2 cannot be the same player (${b1Name.trim()})!`);
      return;
    }
    if (bowlName.trim() && bowlName.trim().length < 2) {
      showToast('warning', 'Bowler name must be at least 2 characters long.');
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
    };
    setHistory(prev => [...prev, oldState]);

    const newBatsmen: Batsman[] = [];
    if (b1Name.trim()) {
      newBatsmen.push({
        name: b1Name.trim(),
        runs: parseInt(b1Runs) || 0,
        balls: parseInt(b1Balls) || 0,
        fours: parseInt(b1Fours) || 0,
        sixes: parseInt(b1Sixes) || 0,
        active: batsmen[0]?.active ?? true,
        avatar: b1Avatar,
      });
    }
    if (b2Name.trim()) {
      newBatsmen.push({
        name: b2Name.trim(),
        runs: parseInt(b2Runs) || 0,
        balls: parseInt(b2Balls) || 0,
        fours: parseInt(b2Fours) || 0,
        sixes: parseInt(b2Sixes) || 0,
        active: batsmen[1]?.active ?? false,
        avatar: b2Avatar,
      });
    }

    setBatsmen(newBatsmen);

    const trimmedBowlName = bowlName.trim();
    setBowler(prev => ({
      ...prev,
      name: trimmedBowlName,
      overs: parseInt(bowlOvers) || 0,
      maidens: parseInt(bowlMaidens) || 0,
      runs: parseInt(bowlRuns) || 0,
      wickets: parseInt(bowlWickets) || 0,
      avatar: bowlAvatar,
    }));

    if (trimmedBowlName) {
      setOtherBowlers(prev => {
        const existingNames = new Set(prev.map((p: any) => (typeof p === 'string' ? p : p.name).trim().toLowerCase()));
        if (!existingNames.has(trimmedBowlName.toLowerCase())) {
          return [...prev, { name: trimmedBowlName, overs: parseInt(bowlOvers) || 0, maidens: parseInt(bowlMaidens) || 0, runs: parseInt(bowlRuns) || 0, wickets: parseInt(bowlWickets) || 0 }];
        }
        return prev;
      });
    }

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
      if (next.length === 0) {
        return [{
          name: replacementName.trim(),
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          active: true,
        }];
      } else if (next.length === 1 && idx === 1) {
        return [
          next[0],
          {
            name: replacementName.trim(),
            runs: 0,
            balls: 0,
            fours: 0,
            sixes: 0,
            active: false,
          }
        ];
      } else {
        next[idx] = {
          name: replacementName.trim(),
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          active: retiringPlayer ? retiringPlayer.active : (idx === 0),
        };
        return next;
      }
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

  const sendInBatsman = (playerName: string, targetSlot?: number) => {
    const trimmed = playerName.trim();
    if (!trimmed) return;

    // Duplicate Player Check: Prevent assigning a player who is already at the crease
    const alreadyBattingIdx = batsmen.findIndex(
      b => b && b.name && b.name.trim().toLowerCase() === trimmed.toLowerCase()
    );

    if (alreadyBattingIdx !== -1) {
      showToast('warning', `${trimmed} is already batting on the pitch!`);
      return;
    }

    // Filter out from yet to bat list
    setYetToBatBatsmen(prev => prev.filter(p => p.name.toLowerCase() !== trimmed.toLowerCase()));

    const b1Valid = batsmen[0] && batsmen[0].name && batsmen[0].name.trim() !== '' && batsmen[0].name.trim() !== 'Batsman 1';
    const b2Valid = batsmen[1] && batsmen[1].name && batsmen[1].name.trim() !== '' && batsmen[1].name.trim() !== 'Batsman 2';

    if (!b1Valid) {
      setBatsmen(prev => [
        { name: trimmed, runs: 0, balls: 0, fours: 0, sixes: 0, active: true },
        (prev[1] && prev[1].name) ? prev[1] : { name: '', runs: 0, balls: 0, fours: 0, sixes: 0, active: false }
      ]);
      setB1Name(trimmed);
      setB1Runs('0');
      setB1Balls('0');
      setB1Fours('0');
      setB1Sixes('0');
      showToast('success', `${trimmed} is now on strike as Striker!`);
    } else if (!b2Valid) {
      setBatsmen(prev => [
        prev[0],
        { name: trimmed, runs: 0, balls: 0, fours: 0, sixes: 0, active: false }
      ]);
      setB2Name(trimmed);
      setB2Runs('0');
      setB2Balls('0');
      setB2Fours('0');
      setB2Sixes('0');
      showToast('success', `${trimmed} has taken crease as Non-Striker!`);
    } else {
      const idx = targetSlot !== undefined ? targetSlot : (batsmen[0].active ? 0 : 1);
      const oldPlayer = batsmen[idx];

      if (oldPlayer && oldPlayer.name && oldPlayer.name.trim()) {
        setYetToBatBatsmen(prev => [
          ...prev,
          { name: oldPlayer.name, status: 'yet to bat', runs: oldPlayer.runs, balls: oldPlayer.balls, fours: oldPlayer.fours, sixes: oldPlayer.sixes }
        ]);
      }

      setBatsmen(prev => {
        const next = [...prev];
        next[idx] = { name: trimmed, runs: 0, balls: 0, fours: 0, sixes: 0, active: true };
        return next;
      });

      if (idx === 0) {
        setB1Name(trimmed);
        setB1Runs('0');
        setB1Balls('0');
        setB1Fours('0');
        setB1Sixes('0');
      } else {
        setB2Name(trimmed);
        setB2Runs('0');
        setB2Balls('0');
        setB2Fours('0');
        setB2Sixes('0');
      }
      showToast('success', `${trimmed} is now batting!`);
    }
  };

  const executeReplaceBatsman = (replacementName: string) => {
    sendInBatsman(replacementName);
  };

  const executeReplaceBowler = (replacementName: string) => {
    if (!replacementName.trim()) {
      showToast('warning', 'Please select or enter a bowler name.');
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
    const trimmedNewName = replacementName.trim();

    // Deduplicate and register both old bowler and new bowler into bowling squad registry
    setOtherBowlers(prev => {
      const map = new Map<string, any>();
      for (const item of prev) {
        if (!item) continue;
        const n = typeof item === 'string' ? item : item.name;
        if (n && n.trim()) map.set(n.trim().toLowerCase(), typeof item === 'string' ? { name: n.trim(), overs: 0, maidens: 0, runs: 0, wickets: 0 } : item);
      }

      if (oldBowler && oldBowler.name && oldBowler.name.trim()) {
        map.set(oldBowler.name.trim().toLowerCase(), {
          name: oldBowler.name.trim(),
          overs: oldBowler.overs || 0,
          ballsInOver: oldBowler.ballsInOver || 0,
          maidens: oldBowler.maidens || 0,
          runs: oldBowler.runs || 0,
          wickets: oldBowler.wickets || 0,
          avatar: oldBowler.avatar,
        });
      }

      if (trimmedNewName && !map.has(trimmedNewName.toLowerCase())) {
        map.set(trimmedNewName.toLowerCase(), {
          name: trimmedNewName,
          overs: 0,
          ballsInOver: 0,
          maidens: 0,
          runs: 0,
          wickets: 0,
        });
      }

      return Array.from(map.values());
    });

    const isFromBench = otherBowlers.find(p => (typeof p === 'string' ? p : p.name).toLowerCase() === trimmedNewName.toLowerCase());
    let newBowlerObj: Bowler;
    if (isFromBench && typeof isFromBench !== 'string') {
      newBowlerObj = {
        name: isFromBench.name,
        overs: isFromBench.overs || 0,
        ballsInOver: isFromBench.ballsInOver || 0,
        maidens: isFromBench.maidens || 0,
        runs: isFromBench.runs || 0,
        wickets: isFromBench.wickets || 0,
        avatar: isFromBench.avatar,
      };
    } else {
      newBowlerObj = {
        name: trimmedNewName,
        overs: 0,
        ballsInOver: 0,
        maidens: 0,
        runs: 0,
        wickets: 0,
      };
    }

    setBowler(newBowlerObj);

    setBowlName(newBowlerObj.name || '');
    setBowlOvers(String(newBowlerObj.overs || 0));
    setBowlRuns(String(newBowlerObj.runs || 0));
    setBowlWickets(String(newBowlerObj.wickets || 0));
    setBowlMaidens(String(newBowlerObj.maidens || 0));
    if (newBowlerObj.avatar) setBowlAvatar(newBowlerObj.avatar);

    setActionTarget(null);
    setCustomNewName('');

    // If a batsman slot is empty (e.g. from a wicket on the last ball of the over), prompt for Next Batsman now
    const missingIdx = batsmen.findIndex(b => !b || !b.name || !b.name.trim());
    if (missingIdx >= 0) {
      setTimeout(() => {
        setActionTarget({ type: 'replace', batsmanIndex: missingIdx });
        setShowEditPlayersModal(true);
      }, 200);
    }
  };

  // Helper Stats Calcs
  // Fix #12: innings 2 always treated as underway (prevents toss unlock mid-innings)
  const isMatchUnderway = currentInnings === 2 || overs > 0 || ballsInCurrentOver > 0 || overLog.length > 0 || runs > 0 || wickets > 0 || firstInningsScore !== null;
  const totalBalls = overs * 6 + ballsInCurrentOver;
  const runRate = totalBalls > 0 ? (runs / (totalBalls / 6)) : 0;
  const totalMatchOvers = parseInt(currentTotalOvers) || 20;
  const projectedScore = totalBalls > 0 ? (runRate * totalMatchOvers) : 0;
  // Fix #D: totalExtrasCount sums actual extra RUNS (e.g. '3WD' = 3 runs, 'WD' = 1 run)
  const totalExtrasCount = overLog.reduce((sum, b) => {
    const m = b.match(/^(\d+)?(WD|NB|BYE|LB)$/);
    if (m) return sum + (m[1] !== undefined ? parseInt(m[1]) : 1);
    return sum;
  }, 0);

  // Target & Chase Calculations (2nd Innings)
  const targetRuns = (firstInningsScore?.runs || 0) + 1;
  const maxAllowedBalls = (parseInt(currentTotalOvers) || 20) * 6;
  const ballsRemaining = Math.max(0, maxAllowedBalls - totalBalls);
  const runsNeeded = Math.max(0, targetRuns - runs);
  const reqRunRate = ballsRemaining > 0 ? ((runsNeeded / ballsRemaining) * 6).toFixed(2) : '0.00';

  // Player Verification Validation Helper (Checks Bowler and Batsmen before bowling)
  const isBowlerMissing = !bowler.name || !bowler.name.trim();
  const isBatsmenMissing = batsmen.length < 2 || !batsmen[0]?.name?.trim() || !batsmen[1]?.name?.trim();
  const isPlayersIncomplete = isBowlerMissing || isBatsmenMissing;

  const validatePlayersBeforeScoring = (): boolean => {
    if (isBowlerMissing && isBatsmenMissing) {
      Alert.alert(
        'Players Required Before Bowling',
        'Please assign an active bowler and 2 opening batsmen (Striker & Non-Striker) before recording a ball.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Assign Players Now', onPress: openEditPlayersModal },
        ]
      );
      return false;
    }

    if (isBowlerMissing) {
      Alert.alert(
        'Active Bowler Required',
        'Please assign an active bowler for this over before bowling.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Assign Bowler', onPress: () => { openEditPlayersModal(); setActionTarget({ type: 'bowler' }); } },
        ]
      );
      return false;
    }

    if (isBatsmenMissing) {
      Alert.alert(
        'Opening Batsmen Required',
        'Please assign 2 opening batsmen (Striker & Non-Striker) before bowling.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Assign Batsmen', onPress: openEditPlayersModal },
        ]
      );
      return false;
    }

    // Auto-verify one batsman is marked on strike
    const hasStriker = batsmen.some(b => b.active);
    if (!hasStriker && batsmen.length >= 2) {
      setBatsmen(prev => prev.map((b, i) => ({ ...b, active: i === 0 })));
    }

    return true;
  };


  // Details a wicket can carry beyond "someone is out". Defaults reproduce the
  // old one-tap behaviour (striker out, nobody ran, credited to the bowler).
  type WicketOptions = {
    // Runs completed by the batsmen before the dismissal — the run-out case.
    runsCompleted?: number;
    // A run out can dismiss the batsman at either end.
    whoIsOut?: 'striker' | 'non-striker';
    // Run outs are not credited to the bowler's wicket column.
    creditBowler?: boolean;
  };

  // State Updates
  const recordBall = (
    type: 'run' | 'extra' | 'wicket',
    value: number | string,
    wicketOptions?: WicketOptions
  ) => {
    if (!validatePlayersBeforeScoring()) return;
    // Fix #9: Block recording after innings has ended
    if (isInningsOver) return;

    // Fix #5: Full undo snapshot including squad lists
    // Fix #F: Cap history at 20 to prevent memory jank
    const oldState = {
      runs,
      wickets,
      overs,
      ballsInCurrentOver,
      overLog: [...overLog],
      batsmen: batsmen.map(b => ({ ...b })),
      bowler: { ...bowler },
      dismissedBatsmen: dismissedBatsmen.map(db => ({ ...db })),
      yetToBatBatsmen: yetToBatBatsmen.map(y => (typeof y === 'string' ? y : { ...y })),
      otherBowlers: otherBowlers.map(ob => (typeof ob === 'string' ? ob : { ...ob })),
    };
    setHistory(prev => [...prev.slice(-19), oldState]);

    if (type === 'run') {
      const runVal = value as number;
      const newTotalRuns = runs + runVal;
      setRuns(newTotalRuns);

      // Fix #6: On NB free-hit delivery, do NOT count this ball against batsman
      const isFreeHit = lastWasNoBall;
      setLastWasNoBall(false);

      // Update batsman runs; skip ball-count increment if free-hit from NB
      setBatsmen(prev =>
        prev.map(b => {
          if (b.active) {
            return {
              ...b,
              runs: b.runs + runVal,
              balls: isFreeHit ? b.balls : b.balls + 1,
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

      // Strike Rotation: Rotate strike on odd runs (1, 3, 5), keep strike on even (0, 2, 4, 6)
      if (runVal % 2 !== 0) {
        setBatsmen(prev => prev.map(b => ({ ...b, active: !b.active })));
      }

      // Check if 2nd Innings target reached to end match immediately
      if (currentInnings === 2 && firstInningsScore) {
        const target = firstInningsScore.runs + 1;
        if (newTotalRuns >= target) {
          const updatedBalls = ballsInCurrentOver + 1;
          const updatedOvers = updatedBalls >= 6 ? overs + 1 : overs;
          const finalBalls = updatedBalls >= 6 ? 0 : updatedBalls;
          setIsInningsOver(true);
          setTimeout(() => {
            handleInningsEnd(2, updatedOvers, newTotalRuns, wickets, finalBalls);
          }, 50);
          return;
        }
      }

      incrementBallCount();
    } else if (type === 'wicket') {
      if (wickets >= 10) {
        Alert.alert('Innings Over', 'All 10 wickets have fallen!');
        return;
      }
      setLastWasNoBall(false);
      const newWickets = wickets + 1;
      setWickets(newWickets);

      const runsCompleted = Math.max(0, wicketOptions?.runsCompleted ?? 0);
      const whoIsOut = wicketOptions?.whoIsOut ?? 'striker';
      const creditBowler = wicketOptions?.creditBowler ?? true;
      // Odd runs means the batsmen crossed, so the striker's end changes.
      const crossed = runsCompleted % 2 !== 0;

      const strikerIdx = batsmen.findIndex(b => b.active);
      const safeStrikerIdx = strikerIdx >= 0 ? strikerIdx : 0;
      const nonStrikerIdx = safeStrikerIdx === 0 ? 1 : 0;
      // The striker faced the ball and scores whatever was run off it; the
      // dismissed player may be either of them on a run out.
      const targetIdx = whoIsOut === 'non-striker' ? nonStrikerIdx : safeStrikerIdx;
      const dismissedPlayer = batsmen[targetIdx];
      const isLastBallOfOver = ballsInCurrentOver >= 5;

      const newTotalRuns = runs + runsCompleted;
      if (runsCompleted > 0) setRuns(newTotalRuns);

      setOverLog(prev => [...prev, runsCompleted > 0 ? `${runsCompleted}W` : 'W']);

      if (dismissedPlayer && dismissedPlayer.name) {
        // The striker is credited with the runs completed and the ball faced;
        // a run-out non-striker gets neither.
        const isStrikerOut = targetIdx === safeStrikerIdx;
        setDismissedBatsmen(prev => [
          ...prev,
          {
            name: dismissedPlayer.name,
            status: 'Out',
            runs: dismissedPlayer.runs + (isStrikerOut ? runsCompleted : 0),
            balls: dismissedPlayer.balls + (isStrikerOut ? 1 : 0),
            fours: dismissedPlayer.fours,
            sixes: dismissedPlayer.sixes,
          }
        ]);
      }

      setBatsmen(prev =>
        prev.map((b, i) => {
          // The new batsman takes over the dismissed player's end. Whether that
          // end is on strike depends on whether the batsmen crossed.
          const endsUpOnStrike = crossed
            ? i !== safeStrikerIdx
            : i === safeStrikerIdx;
          if (i === targetIdx) {
            return { name: '', runs: 0, balls: 0, fours: 0, sixes: 0, active: endsUpOnStrike };
          }
          // Surviving batsman: credit the striker for runs run + ball faced.
          const isSurvivingStriker = i === safeStrikerIdx;
          return {
            ...b,
            runs: isSurvivingStriker ? b.runs + runsCompleted : b.runs,
            balls: isSurvivingStriker ? b.balls + 1 : b.balls,
            active: endsUpOnStrike,
          };
        })
      );

      setBowler(prev => ({
        ...prev,
        ballsInOver: prev.ballsInOver + 1,
        // Runs conceded still count against the bowler even on a run out.
        runs: prev.runs + runsCompleted,
        // A run out is not the bowler's wicket.
        wickets: creditBowler ? prev.wickets + 1 : prev.wickets,
      }));

      if (newWickets >= 10) {
        // Fix #4: Don't call incrementBallCount after innings ends (avoids double-increment)
        // Fix #10: Pass overs + 1 as final over count (stale 'overs' is pre-increment)
        setIsInningsOver(true);
        handleInningsEnd(
          currentInnings,
          ballsInCurrentOver >= 5 ? overs + 1 : overs,
          newTotalRuns,
          newWickets
        );
        return;
      }

      // A run out can be completed on the winning run, so the chase target has
      // to be checked here too — not just on the plain run/extra paths.
      if (currentInnings === 2 && firstInningsScore && runsCompleted > 0) {
        const target = firstInningsScore.runs + 1;
        if (newTotalRuns >= target) {
          const updatedBalls = ballsInCurrentOver + 1;
          const updatedOvers = updatedBalls >= 6 ? overs + 1 : overs;
          const finalBalls = updatedBalls >= 6 ? 0 : updatedBalls;
          setIsInningsOver(true);
          setTimeout(() => {
            handleInningsEnd(2, updatedOvers, newTotalRuns, newWickets, finalBalls);
          }, 50);
          return;
        }
      }

      // Fix #3: Always prompt new batsman — even on last ball of over
      // (on last ball we defer until AFTER over-end modal, using a flag)
      if (!isLastBallOfOver) {
        setTimeout(() => {
          setActionTarget({ type: 'replace', batsmanIndex: targetIdx });
          setShowEditPlayersModal(true);
        }, 150);
      }
      // If last ball of over, new batsman prompt fires from handleOverCompletion after new bowler is selected

      incrementBallCount();
    } else if (type === 'extra') {
      handleExtraClick(value as 'WD' | 'NB' | 'BYE' | 'LB');
    }
  };


  const handleExtraClick = (extraType: 'WD' | 'NB' | 'BYE' | 'LB') => {
    if (!validatePlayersBeforeScoring()) return;

    // Auto-record pre-verified extras to avoid repetitive selection popups during live scoring
    if (extraType === 'WD' && autoWide === '1') {
      recordExtraWithRuns('WD', 1, false);
      return;
    }
    if (extraType === 'NB' && autoNoBall === '1') {
      recordExtraWithRuns('NB', 1, false);
      return;
    }
    if (extraType === 'BYE' && allowByes === '1') {
      recordExtraWithRuns('BYE', 1, true);
      return;
    }
    if (extraType === 'LB' && allowByes === '1') {
      recordExtraWithRuns('LB', 1, true);
      return;
    }

    setActiveExtraType(extraType);
    setShowExtraModal(true);
  };

  /**
   * `runCount` is the TOTAL runs added to the team for this delivery, including
   * the 1-run penalty for WD/NB. `runsOffBat` is how much of that total the
   * striker actually hit — only meaningful for a No Ball, where runs off the bat
   * are credited to the batsman while the 1-run penalty stays in extras. On a
   * Wide nothing can come off the bat by law, so it stays 0.
   */
  const recordExtraWithRuns = (
    extraType: 'WD' | 'NB' | 'BYE' | 'LB',
    runCount: number,
    isLegalOverride?: boolean,
    runsOffBat: number = 0
  ) => {
    if (!validatePlayersBeforeScoring()) return;
    // Fix #9: Block recording after innings has ended
    if (isInningsOver) return;

    // Fix #5: Full undo snapshot including squad lists; Fix #F: cap at 20
    const oldState = {
      runs,
      wickets,
      overs,
      ballsInCurrentOver,
      overLog: [...overLog],
      batsmen: batsmen.map(b => ({ ...b })),
      bowler: { ...bowler },
      dismissedBatsmen: dismissedBatsmen.map(db => ({ ...db })),
      yetToBatBatsmen: yetToBatBatsmen.map(y => (typeof y === 'string' ? y : { ...y })),
      otherBowlers: otherBowlers.map(ob => (typeof ob === 'string' ? ob : { ...ob })),
    };
    setHistory(prev => [...prev.slice(-19), oldState]);

    setRuns(prev => prev + runCount);

    const isLegal = isLegalOverride !== undefined ? isLegalOverride : (extraType === 'BYE' || extraType === 'LB');

    // Fix #6: Set free-hit flag for NB so the next run delivery doesn't add a ball to batsman stats
    if (extraType === 'NB') {
      setLastWasNoBall(true);
    } else {
      setLastWasNoBall(false);
    }

    setBowler(prev => ({
      ...prev,
      runs: prev.runs + runCount,
      ballsInOver: isLegal ? prev.ballsInOver + 1 : prev.ballsInOver,
    }));

    // Update batsman balls faced for No Ball, Bye, Leg Bye (WD does NOT count as ball faced).
    // On a No Ball the striker is also credited with whatever came off the bat —
    // the 1-run penalty stays in extras and is never added to a personal score.
    if (extraType === 'NB' || extraType === 'BYE' || extraType === 'LB') {
      setBatsmen(prev =>
        prev.map(b =>
          b.active
            ? {
                ...b,
                balls: b.balls + 1,
                runs: b.runs + (extraType === 'NB' ? runsOffBat : 0),
                fours: b.fours + (extraType === 'NB' && runsOffBat === 4 ? 1 : 0),
                sixes: b.sixes + (extraType === 'NB' && runsOffBat === 6 ? 1 : 0),
              }
            : b
        )
      );
    }

    // Strike Rotation for Extras — driven by how many runs the batsmen physically
    // RAN, not the team total, because the WD/NB penalty run is not run by anyone.
    //   BYE/LB      → every run counted was run, so the total is the ran count
    //   WD/NB       → total minus the 1-run penalty
    // Odd ran count means they finished at opposite ends, so strike swaps.
    const ranRuns =
      extraType === 'BYE' || extraType === 'LB'
        ? runCount
        : Math.max(0, runCount - 1);
    if (ranRuns % 2 !== 0) {
      setBatsmen(prev => prev.map(b => ({ ...b, active: !b.active })));
    }

    // Fix #E: Pure wide/NB with no extra runs logs as 'WD'/'NB', not '0WD'/'0NB'
    // e.g. 1 run wide → 'WD', 3 run wide → '3WD', pure NB → 'NB'
    const logString = runCount <= 1 ? extraType : `${runCount}${extraType}`;
    setOverLog(prev => [...prev, logString]);

    const newTotalRuns = runs + runCount;
    if (currentInnings === 2 && firstInningsScore) {
      const target = firstInningsScore.runs + 1;
      if (newTotalRuns >= target) {
        const updatedBalls = isLegal ? ballsInCurrentOver + 1 : ballsInCurrentOver;
        const updatedOvers = updatedBalls >= 6 ? overs + 1 : overs;
        const finalBalls = updatedBalls >= 6 ? 0 : updatedBalls;
        setIsInningsOver(true);
        setTimeout(() => {
          handleInningsEnd(2, updatedOvers, newTotalRuns, wickets, finalBalls);
        }, 50);
        return;
      }
    }

    if (isLegal) {
      incrementBallCount();
    }
  };


  const handleInningsEnd = (
    endedInnings: 1 | 2,
    finalOvers: number,
    finalRunsOverride?: number,
    finalWicketsOverride?: number,
    finalBallsOverride?: number
  ) => {
    const currentRuns = finalRunsOverride !== undefined ? finalRunsOverride : runs;
    const currentWickets = finalWicketsOverride !== undefined ? finalWicketsOverride : wickets;
    const currentBalls = finalBallsOverride !== undefined ? finalBallsOverride : ballsInCurrentOver;

    if (endedInnings === 1) {
      const firstScore = { runs: currentRuns, wickets: currentWickets, overs: finalOvers, balls: currentBalls };
      setFirstInningsScore(firstScore);
      setCurrentInnings(2);

      // Immediately swap teams & position (Batting Team -> Bowling Team, Bowling Team -> Batting Team)
      const newBatting = bowlingTeamName || teamB;
      const newBowling = battingTeamName || teamA;
      setBattingTeamName(newBatting);
      setBowlingTeamName(newBowling);

      // Reset innings scoring values
      setRuns(0);
      setWickets(0);
      setOvers(0);
      setBallsInCurrentOver(0);
      setOverLog([]);
      setHistory([]);
      setLastWasNoBall(false);
      // Fix #9: Allow recording balls again in 2nd innings
      setIsInningsOver(false);

      // Reset players
      setBatsmen([]);
      setBowler({ name: '', overs: 0, ballsInOver: 0, maidens: 0, runs: 0, wickets: 0 });
      setDismissedBatsmen([]);

      // Swap squad bench lists
      const teamAObj = teams.find(t => t.name.toLowerCase() === teamA.toLowerCase());
      const teamBObj = teams.find(t => t.name.toLowerCase() === teamB.toLowerCase());
      if (teamBObj && teamBObj.players) setYetToBatBatsmen([...teamBObj.players]);
      if (teamAObj && teamAObj.players) setOtherBowlers([...teamAObj.players]);

      const target = firstScore.runs + 1;
      const maxOvers = parseInt(totalOvers) || 20;

      Alert.alert(
        '🏏 1st Innings Completed!',
        `${battingTeamName} scored ${firstScore.runs}/${firstScore.wickets} in ${finalOvers} overs.\n\n${newBatting} needs ${target} runs to win off ${maxOvers} overs!`,
        [
          {
            text: 'Setup 2nd Innings Players',
            onPress: () => {
              openEditPlayersModal();
            }
          }
        ]
      );
    } else {
      // Fix #7: Store real 2nd innings score for PDF export
      const secondScore = { runs: currentRuns, wickets: currentWickets, overs: finalOvers, balls: currentBalls };
      setInnings2ScoreRecord(secondScore);
      // 2nd Innings Completed
      const target = (firstInningsScore?.runs || 0) + 1;
      let winnerName = '';
      let winMargin = '';

      if (currentRuns >= target) {
        winnerName = battingTeamName;
        winMargin = `Won by ${10 - currentWickets} wickets`;
      } else if (currentRuns < target - 1) {
        winnerName = bowlingTeamName;
        winMargin = `Won by ${(firstInningsScore?.runs || 0) - currentRuns} runs`;
      } else {
        winnerName = 'Match Tied';
        winMargin = '🤝 Match Tied!';
      }

      // Automatically determine Man of the Match (MOTM) from top performing player
      let motmName = 'Match Star';
      let motmStat = 'Outstanding Performance';

      const allBatsmen = [...batsmen, ...dismissedBatsmen].filter(b => b && b.name && b.name.trim());
      allBatsmen.sort((a, b) => (b.runs || 0) - (a.runs || 0));

      if (allBatsmen.length > 0 && (allBatsmen[0].runs || 0) > 0) {
        motmName = allBatsmen[0].name;
        motmStat = `${allBatsmen[0].runs} runs off ${allBatsmen[0].balls || 0} balls`;
      } else if (bowler && bowler.name) {
        motmName = bowler.name;
        motmStat = `${bowler.wickets} wickets (${bowler.runs} runs)`;
      }

      const victoryObj = {
        winnerName,
        winMargin,
        target,
        firstInningsTeam: teamA,
        firstInningsScore: `${firstInningsScore?.runs || 0}/${firstInningsScore?.wickets || 0}`,
        firstInningsOvers: `${firstInningsScore?.overs || 0}.${firstInningsScore?.balls || 0}`,
        secondInningsTeam: battingTeamName,
        secondInningsScore: `${currentRuns}/${currentWickets}`,
        secondInningsOvers: `${finalOvers}.${currentBalls}`,
        motmName,
        motmStat,
      };

      setMatchVictoryData(victoryObj);
      setShowVictoryModal(true);

      // 💾 Persist completed match to Own Board history
      const matchRecord = {
        id: matchId || `match-${Date.now()}`,
        completedAt: new Date().toISOString(),
        teamA: teamA || 'Team A',
        teamB: teamB || 'Team B',
        innings1: {
          team: victoryObj.firstInningsTeam,
          score: victoryObj.firstInningsScore,
          overs: victoryObj.firstInningsOvers,
          batsmen: [...batsmen, ...dismissedBatsmen]
            .filter(b => b?.name?.trim())
            .map(b => ({
              name: b.name,
              avatarUrl: undefined,
              runs: b.runs,
              balls: b.balls,
              fours: b.fours,
              sixes: b.sixes,
              isOut: !!b.balls && dismissedBatsmen.some(d => d.name === b.name),
              strikeRate: b.balls > 0 ? parseFloat(((b.runs / b.balls) * 100).toFixed(1)) : 0,
            })),
          bowlers: [{
            name: bowler.name,
            avatarUrl: undefined,
            overs: bowler.overs,
            runs: bowler.runs,
            wickets: bowler.wickets,
            maidens: bowler.maidens,
            economy: bowler.overs > 0 ? parseFloat((bowler.runs / bowler.overs).toFixed(2)) : 0,
            dots: 0,
          }].filter(b => b.name?.trim()),
        },
        innings2: {
          team: victoryObj.secondInningsTeam,
          score: victoryObj.secondInningsScore,
          overs: victoryObj.secondInningsOvers,
          batsmen: [],
          bowlers: [],
        },
        winner: victoryObj.winnerName,
        winMargin: victoryObj.winMargin,
        motmName: victoryObj.motmName,
        motmStat: victoryObj.motmStat,
      };
      saveMatchToOwnBoard(matchRecord).catch(() => {});
    }
  };

  const handleRematchSameTeams = () => {
    setRuns(0);
    setWickets(0);
    setOvers(0);
    setBallsInCurrentOver(0);
    setOverLog([]);
    setHistory([]);
    setCurrentInnings(1);
    setFirstInningsScore(null);

    setBatsmen([]);
    setBowler({ name: '', overs: 0, ballsInOver: 0, maidens: 0, runs: 0, wickets: 0 });
    setDismissedBatsmen([]);

    setRematchTossWinner(teamA);
    setRematchTossDecision('Bat');
    setCoinSide(null);

    setShowVictoryModal(false);
    setShowRematchTossModal(true);
  };

  const confirmRematchToss = () => {
    if (isMatchUnderway) {
      Alert.alert('Match Underway 🔒', 'Toss cannot be altered once the match is in progress.');
      setShowRematchTossModal(false);
      return;
    }
    // Re-assign batting & bowling teams based on toss winner & selection
    let newBatting = teamA;
    let newBowling = teamB;

    if (rematchTossWinner === teamA) {
      if (rematchTossDecision === 'Bat') {
        newBatting = teamA;
        newBowling = teamB;
      } else {
        newBatting = teamB;
        newBowling = teamA;
      }
    } else {
      if (rematchTossDecision === 'Bat') {
        newBatting = teamB;
        newBowling = teamA;
      } else {
        newBatting = teamA;
        newBowling = teamB;
      }
    }

    setBattingTeamName(newBatting);
    setBowlingTeamName(newBowling);

    const tossSummary = `${rematchTossWinner} won toss & select ${rematchTossDecision === 'Bat' ? 'bat' : 'bowl'}`;
    setTossText(tossSummary);

    const battingObj = teams.find(t => t.name.toLowerCase() === newBatting.toLowerCase());
    const bowlingObj = teams.find(t => t.name.toLowerCase() === newBowling.toLowerCase());
    if (battingObj && battingObj.players) setYetToBatBatsmen([...battingObj.players]);
    if (bowlingObj && bowlingObj.players) setOtherBowlers([...bowlingObj.players]);

    setShowRematchTossModal(false);
    openEditPlayersModal();
  };

  const handleOverCompletion = () => {
    const nextOvers = overs + 1;
    const maxOvers = parseInt(currentTotalOvers) || 20;

    // Check if 1st Innings total overs reached
    if (currentInnings === 1 && nextOvers >= maxOvers) {
      setIsInningsOver(true);
      handleInningsEnd(1, nextOvers);
      return;
    }
    // Check if 2nd Innings total overs reached
    if (currentInnings === 2 && nextOvers >= maxOvers) {
      setIsInningsOver(true);
      handleInningsEnd(2, nextOvers);
      return;
    }

    // 1. Save old state for undo history (Fix #5: include squad lists; Fix #F: cap at 20)
    const oldState = {
      runs,
      wickets,
      overs,
      ballsInCurrentOver: 6,
      overLog: [...overLog],
      batsmen: batsmen.map(b => ({ ...b })),
      bowler: { ...bowler },
      otherBowlers: otherBowlers.map(ob => (typeof ob === 'string' ? ob : { ...ob })),
      dismissedBatsmen: dismissedBatsmen.map(db => ({ ...db })),
      yetToBatBatsmen: yetToBatBatsmen.map(y => (typeof y === 'string' ? y : { ...y })),
    };
    setHistory(prev => [...prev.slice(-19), oldState]);

    // 2. Fix #1: Auto-detect maiden over — if all scoring events in overLog produced 0 batting runs
    // A maiden has no wides or leg byes, just dots and wickets. Filter to balls-only entries:
    const scoringEntries = overLog.filter(b => !b.includes('WD') && !b.includes('NB') && !b.includes('BYE') && !b.includes('LB'));
    const isMaiden = scoringEntries.length > 0 && scoringEntries.every(b => b === '0' || b === 'W');

    // 3. Automatically swap batsman ends (striker/non-striker end rotation) & put active striker at top (index 0)
    setBatsmen(prev => {
      if (!prev || prev.length < 2) return prev ? prev.map(b => ({ ...b, active: !b.active })) : [];
      const currStrikerIdx = prev.findIndex(b => b.active);
      const currNonStrikerIdx = prev.findIndex(b => !b.active);

      const updated = [...prev];
      if (currStrikerIdx >= 0 && currNonStrikerIdx >= 0) {
        // Rotate strike
        updated[currStrikerIdx] = { ...prev[currStrikerIdx], active: false };
        updated[currNonStrikerIdx] = { ...prev[currNonStrikerIdx], active: true };
        // Position active striker at index 0 (top of table)
        return [updated[currNonStrikerIdx], updated[currStrikerIdx]];
      }
      return prev.map(b => ({ ...b, active: !b.active }));
    });

    // 4. Increment overs count
    setOvers(prev => prev + 1);
    setBallsInCurrentOver(0);
    setOverLog([]);
    setLastWasNoBall(false);

    // 5. Update current bowler overs — Fix #1: increment maidens if maiden over detected
    setBowler(prev => ({
      ...prev,
      overs: (prev.overs || 0) + 1,
      ballsInOver: 0,
      maidens: isMaiden ? (prev.maidens || 0) + 1 : (prev.maidens || 0),
    }));

    // 6. Always show Next Bowler modal on over completion
    setShowOverCompleteModal(true);
  };

  const incrementBallCount = () => {
    setBallsInCurrentOver(prev => {
      const next = prev + 1;
      if (next >= 6) {
        // Fix #2: Keep counter at 6 (not 0) so the scoreboard banner briefly shows X.6
        // handleOverCompletion resets it to 0 after running
        setTimeout(() => {
          handleOverCompletion();
        }, 100);
        return 6;
      }
      return next;
    });
  };

  const handleCompleteOver = () => {
    handleOverCompletion();
  };


  const [isSyncing, setIsSyncing] = useState(false);

  const handleExportPDF = async () => {
    try {
      const bowlerList = getFullBowlerScorecard().map(b => {
        const ovs = (b.overs || 0) + (b.ballsInOver || 0) / 6;
        return {
          name: b.name || 'Bowler',
          overs: ovs,
          maidens: b.maidens || 0,
          runs: b.runs || 0,
          wickets: b.wickets || 0,
          economy: ovs > 0 ? parseFloat((b.runs / ovs).toFixed(2)) : 0,
        };
      });

      // Fix #7: Compute real extra RUNS per type (sum numeric prefix, not count events)
      const sumExtraRuns = (tag: string) => overLog.reduce((acc, b) => {
        const m = b.match(/^(\d+)?/ + tag + '$/');
        if (m) return acc + (m[1] !== undefined ? parseInt(m[1]) : 1);
        return acc;
      }, 0);
      const totalWides = sumExtraRuns('WD');
      const totalNoBalls = sumExtraRuns('NB');
      const totalByes = sumExtraRuns('BYE');
      const totalLegByes = sumExtraRuns('LB');
      const totalExtrasForPDF = totalWides + totalNoBalls + totalByes + totalLegByes;

      // Determine which innings each team batted
      // If innings 2 is complete, firstInningsScore = innings 1 team (teamA batting first)
      const inn1 = firstInningsScore;
      const inn2 = innings2ScoreRecord;
      const inn1BattingTeam = inn1 ? (battingTeamName !== teamA ? teamA : teamB) : (battingTeamName || teamA);
      const inn2BattingTeam = battingTeamName || teamB;

      await exportScoreSheetPDF({
        matchId: matchId || `MTH-${Date.now().toString().slice(-6)}`,
        sport: `Cricket Match (${currentTotalOvers || '8'} Overs)`,
        venueName: 'Emerald Green Arena Pitch 1',
        venueAddress: 'Trichy Bypass Road, Tiruchirappalli',
        contactNumber: '+91 98765 43210',
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        teamA: {
          name: inn1BattingTeam,
          captain: 'Captain A',
          score: inn1 ? inn1.runs : runs,
          wickets: inn1 ? inn1.wickets : wickets,
          overs: inn1 ? inn1.overs : overs,
          balls: inn1 ? inn1.balls : ballsInCurrentOver,
          runRate: inn1
            ? parseFloat(((inn1.runs) / (inn1.overs + inn1.balls / 6 || 1)).toFixed(2))
            : parseFloat((runs / (overs + ballsInCurrentOver / 6 || 1)).toFixed(2)),
          extras: {
            wides: totalWides,
            noBalls: totalNoBalls,
            byes: totalByes,
            total: totalExtrasForPDF,
          },
          batsmen: batsmen.map(b => ({
            name: b.name,
            runs: b.runs,
            balls: b.balls,
            fours: b.fours,
            sixes: b.sixes,
            status: b.active ? 'not out' : 'out',
          })),
          bowlers: bowlerList.length > 0 ? bowlerList : [
            {
              name: bowler.name || 'Bowler',
              overs: (bowler.overs || 0) + (bowler.ballsInOver || 0) / 6,
              maidens: bowler.maidens || 0,
              runs: bowler.runs || 0,
              wickets: bowler.wickets || 0,
            }
          ]
        },
        // Fix #7: Real 2nd innings score — not fabricated
        teamB: {
          name: inn2BattingTeam,
          captain: 'Captain B',
          score: inn2 ? inn2.runs : (currentInnings === 2 ? runs : 0),
          wickets: inn2 ? inn2.wickets : (currentInnings === 2 ? wickets : 0),
          overs: inn2 ? inn2.overs : (currentInnings === 2 ? overs : 0),
          balls: inn2 ? inn2.balls : (currentInnings === 2 ? ballsInCurrentOver : 0),
        },
        extrasSummary: {
          wides: totalWides,
          noBalls: totalNoBalls,
          byes: totalByes,
          legByes: totalLegByes,
          total: totalExtrasForPDF,
        },
      });
    } catch (err: any) {
      Alert.alert('PDF Export Error', err.message || 'Could not export score sheet.');
    }

  };

  const handleEndMatch = () => {
    if (matchId) {
      const rr = parseFloat((runs / (overs + ballsInCurrentOver / 6 || 1)).toFixed(2));
      matchApi.completeMatch(matchId, {
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
                overs: (bowler.overs || 0) + (bowler.ballsInOver || 0) / 6,
                maidens: bowler.maidens || 0,
                runs: bowler.runs || 0,
                wickets: bowler.wickets || 0,
              }
            ]
          }
        ],
      }).catch(err => console.warn('Sync on end match:', err));
    }
    setShowEndMatchModal(true);
  };

  const handleDropMatch = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Drop Match: Are you sure you want to abandon/cancel this match? Current scores will not be saved.')) {
        router.replace('/(tabs)');
      }
    } else {
      Alert.alert(
        'Drop Match',
        'Are you sure you want to abandon/cancel this match? Current scores will not be saved.',
        [
          { text: 'Keep Playing', style: 'cancel' },
          { text: 'Drop Match', style: 'destructive', onPress: () => router.replace('/(tabs)') },
        ]
      );
    }
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
    // Fix #5: Restore squad lists so dismissals and bench are fully reversed
    if (previous.dismissedBatsmen !== undefined) setDismissedBatsmen(previous.dismissedBatsmen);
    if (previous.yetToBatBatsmen !== undefined) setYetToBatBatsmen(previous.yetToBatBatsmen);
    if (previous.otherBowlers !== undefined) setOtherBowlers(previous.otherBowlers);
    // Clear free-hit flag on undo
    setLastWasNoBall(false);
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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <ThemedText type="labelMd" style={{ color: '#ffffff', fontWeight: '700' }}>
                  {currentInnings === 1 ? '1st Innings' : '2nd Innings'}
                </ThemedText>

                {/* 🪙 Toss / Coin Re-Flip Action Chip (Locked once match starts) */}
                <Pressable
                  onPress={() => {
                    if (isMatchUnderway) {
                      Alert.alert(
                        'Toss Decision Locked 🔒',
                        `Toss was decided (${tossText}). In accordance with match rules, the toss cannot be altered once the match has commenced.`,
                        [{ text: 'OK' }]
                      );
                      return;
                    }
                    setShowRematchTossModal(true);
                  }}
                  style={({ pressed }) => [
                    {
                      backgroundColor: isMatchUnderway ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.25)',
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: isMatchUnderway ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.4)',
                    },
                    pressed && { opacity: 0.8 }
                  ]}
                >
                  <ThemedText style={{ fontSize: 10, color: '#ffffff', fontFamily: 'Sora_700Bold' }}>
                    {isMatchUnderway ? '🔒 Toss' : '🪙 Toss'}
                  </ThemedText>
                </Pressable>

                {/* ⚙️ Rules Verification Action Chip (Locked once match starts) */}
                <Pressable
                  onPress={() => setShowPreRulesModal(true)}
                  style={({ pressed }) => [
                    {
                      backgroundColor: isMatchUnderway ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.25)',
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: isMatchUnderway ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.4)',
                    },
                    pressed && { opacity: 0.8 }
                  ]}
                >
                  <ThemedText style={{ fontSize: 10, color: '#ffffff', fontFamily: 'Sora_700Bold' }}>
                    {isMatchUnderway ? '🔒 Rules' : '⚙️ Rules'}
                  </ThemedText>
                </Pressable>
              </View>
            </View>

            <View style={styles.bannerRow}>
              <View style={styles.bannerLeftCol}>
                <ThemedText type="headlineLg" style={styles.teamTitle} numberOfLines={1}>
                  {battingTeamName || teamA}
                </ThemedText>
                <ThemedText type="bodyMd" style={{ color: theme.onPrimaryContainer, fontSize: 11.5, fontFamily: 'Sora_600SemiBold', marginTop: 1 }} numberOfLines={1}>
                  vs {bowlingTeamName || teamB}
                </ThemedText>
                <ThemedText style={{ color: 'rgba(255, 255, 255, 0.90)', fontSize: 10.5, fontFamily: 'Sora_500Medium', marginTop: 6 }} numberOfLines={1}>
                  {tossText}
                </ThemedText>
              </View>

              <View style={styles.bannerRightCol}>
                <ThemedText type="displayLg" style={[styles.scoreText, { color: '#ffffff' }]}>
                  {runs}/{wickets}
                </ThemedText>
                <ThemedText type="headlineSm" style={styles.oversText}>
                  {overs}.{ballsInCurrentOver} / {currentTotalOvers} Overs
                </ThemedText>
              </View>
            </View>

            <View style={styles.bannerStatsRow}>
              <View style={styles.bannerStatItem}>
                <ThemedText type="labelSm" style={{ color: theme.onPrimaryContainer }}>RUN RATE</ThemedText>
                <ThemedText type="headlineSm" style={{ color: '#ffffff', fontFamily: 'Sora_700Bold' }}>
                  {runRate.toFixed(2)}
                </ThemedText>
              </View>
              <View style={styles.bannerStatItem}>
                <ThemedText type="labelSm" style={{ color: theme.onPrimaryContainer }}>
                  {currentInnings === 2 ? 'REQ RR' : 'PROJECTED'}
                </ThemedText>
                <ThemedText type="headlineSm" style={{ color: '#ffffff', fontFamily: 'Sora_700Bold' }}>
                  {currentInnings === 2 ? reqRunRate : (totalBalls > 0 ? Math.round(projectedScore) : 0)}
                </ThemedText>
              </View>
              <View style={styles.bannerStatItem}>
                <ThemedText type="labelSm" style={{ color: theme.onPrimaryContainer }}>EXTRAS</ThemedText>
                <ThemedText type="headlineSm" style={{ color: '#ffffff', fontFamily: 'Sora_700Bold' }}>
                  {totalExtrasCount}
                </ThemedText>
              </View>
            </View>

            {/* 2nd Innings Target Equation Bar */}
            {currentInnings === 2 && (
              <View style={{ marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.25)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                <ThemedText style={{ color: '#ffffff', fontSize: 12, fontFamily: 'Sora_700Bold' }}>
                  🎯 Target: <ThemedText style={{ fontSize: 14, fontFamily: 'Sora_800ExtraBold', color: '#FDE047' }}>{targetRuns}</ThemedText>
                </ThemedText>
                {runs >= targetRuns ? (
                  <View style={{ backgroundColor: 'rgba(253, 224, 71, 0.25)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                    <ThemedText style={{ color: '#FDE047', fontSize: 11, fontFamily: 'Sora_800ExtraBold' }}>
                      🎉 Target Achieved! {battingTeamName} Won!
                    </ThemedText>
                  </View>
                ) : (
                  <ThemedText style={{ color: 'rgba(255, 255, 255, 0.95)', fontSize: 11, fontFamily: 'Sora_600SemiBold' }}>
                    Need <ThemedText style={{ fontWeight: '700', color: '#ffffff' }}>{runsNeeded}</ThemedText> runs off <ThemedText style={{ fontWeight: '700', color: '#ffffff' }}>{ballsRemaining}</ThemedText> balls
                  </ThemedText>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Sub-tab Navigation */}
        <View style={styles.subTabBar}>
          <Pressable
            onPress={() => setActiveSubTab('live')}
            style={[styles.subTabItem, activeSubTab === 'live' && { borderBottomColor: theme.primary }]}
          >
            <Ionicons name="flash-outline" size={14} color={activeSubTab === 'live' ? theme.primary : theme.textSecondary} />
            <ThemedText style={[styles.subTabText, { color: activeSubTab === 'live' ? theme.primary : theme.textSecondary }, activeSubTab === 'live' && { fontFamily: 'Sora_700Bold' }]}>
              Live Scoring
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setActiveSubTab('scorecard')}
            style={[styles.subTabItem, activeSubTab === 'scorecard' && { borderBottomColor: theme.primary }]}
          >
            <Ionicons name="list-outline" size={14} color={activeSubTab === 'scorecard' ? theme.primary : theme.textSecondary} />
            <ThemedText style={[styles.subTabText, { color: activeSubTab === 'scorecard' ? theme.primary : theme.textSecondary }, activeSubTab === 'scorecard' && { fontFamily: 'Sora_700Bold' }]}>
              Scorecard
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setActiveSubTab('stats')}
            style={[styles.subTabItem, activeSubTab === 'stats' && { borderBottomColor: theme.primary }]}
          >
            <Ionicons name="bar-chart-outline" size={14} color={activeSubTab === 'stats' ? theme.primary : theme.textSecondary} />
            <ThemedText style={[styles.subTabText, { color: activeSubTab === 'stats' ? theme.primary : theme.textSecondary }, activeSubTab === 'stats' && { fontFamily: 'Sora_700Bold' }]}>
              Statistics
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setActiveSubTab('details')}
            style={[styles.subTabItem, activeSubTab === 'details' && { borderBottomColor: theme.primary }]}
          >
            <Ionicons name="information-circle-outline" size={14} color={activeSubTab === 'details' ? theme.primary : theme.textSecondary} />
            <ThemedText style={[styles.subTabText, { color: activeSubTab === 'details' ? theme.primary : theme.textSecondary }, activeSubTab === 'details' && { fontFamily: 'Sora_700Bold' }]}>
              Details
            </ThemedText>
          </Pressable>
        </View>

        {activeSubTab === 'live' && (
          <>
            <View style={styles.section}>
              {/* ── Current Over Log & Embedded Compact Ball by Ball Keypad ── */}
              <View style={[styles.card, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', padding: 16, borderRadius: BorderRadius.xl, ...Shadows.level2 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="baseball-outline" size={16} color={theme.primary} />
                    <ThemedText style={{ fontSize: 14, fontFamily: 'Sora_700Bold', color: theme.text }}>
                      Current Over Log
                    </ThemedText>
                  </View>
                  <Pressable
                    onPress={() => setShowScoringPad(!showScoringPad)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: showScoringPad ? theme.primary : theme.primary + '15',
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: BorderRadius.full,
                      gap: 4,
                    }}
                  >
                    <Ionicons name={showScoringPad ? "chevron-up" : "add"} size={14} color={showScoringPad ? '#ffffff' : theme.primary} />
                    <ThemedText style={{ color: showScoringPad ? '#ffffff' : theme.primary, fontSize: 11, fontFamily: 'Sora_700Bold' }}>
                      {showScoringPad ? 'Hide Keypad' : 'Ball by Ball'}
                    </ThemedText>
                  </Pressable>
                </View>

                {/* Over log balls */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.logBallsRow}
                >
                  {overLog.map((ball, idx) => {
                    let bgColor: string = theme.primary;
                    let textColor: string = '#ffffff';
                    let borderWidth = 0;
                    let borderColor = 'transparent';

                    const isWicket = ball === 'W';
                    const isDot = ball === '0';
                    const isFour = ball === '4';
                    const isSix = ball === '6';

                    if (isWicket) {
                      bgColor = '#EF4444';
                      textColor = '#ffffff';
                    } else if (isDot) {
                      bgColor = theme.surfaceLow;
                      textColor = theme.textSecondary;
                      borderWidth = 1;
                      borderColor = theme.outlineVariant + '33';
                    } else if (isFour) {
                      bgColor = '#10B981';
                      textColor = '#ffffff';
                    } else if (isSix) {
                      bgColor = '#8B5CF6';
                      textColor = '#ffffff';
                    } else if (ball.includes('WD')) {
                      bgColor = '#F59E0B';
                      textColor = '#ffffff';
                    } else if (ball.includes('NB')) {
                      bgColor = '#F43F5E';
                      textColor = '#ffffff';
                    } else if (ball.includes('BYE') || ball.includes('LB')) {
                      bgColor = '#06B6D4';
                      textColor = '#ffffff';
                    }

                    const match = ball.match(/^(\d+)?(WD|NB|BYE|LB)$/);
                    let renderContent;

                    if (match) {
                      const num = match[1];
                      const type = match[2];
                      if (num === undefined) {
                        renderContent = (
                          <ThemedText style={{ color: textColor, fontFamily: 'Sora_700Bold', fontSize: 12 }}>
                            {type}
                          </ThemedText>
                        );
                      } else {
                        renderContent = (
                          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center' }}>
                            <ThemedText style={{ color: textColor, fontFamily: 'Sora_800ExtraBold', fontSize: 14 }}>
                              {num}
                            </ThemedText>
                            <ThemedText style={{ color: textColor, fontFamily: 'Sora_700Bold', fontSize: 8, marginLeft: 1 }}>
                              {type}
                            </ThemedText>
                          </View>
                        );
                      }
                    } else {
                      renderContent = (
                        <ThemedText type="bodyMd" style={{ color: textColor, fontFamily: 'Sora_700Bold' }}>
                          {ball}
                        </ThemedText>
                      );
                    }

                    return (
                      <View key={idx} style={[styles.logBall, { backgroundColor: bgColor, borderWidth, borderColor }]}>
                        {renderContent}
                      </View>
                    );
                  })}
                  {overLog.length === 0 && (
                    <ThemedText type="bodyMd" style={{ color: theme.textSecondary, fontStyle: 'italic' }}>
                      Starting new over...
                    </ThemedText>
                  )}
                </ScrollView>

                {/* Bowler balls indicator row */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.outlineVariant + '22', marginTop: 4 }}>
                  <ThemedText style={{ color: theme.textSecondary, fontSize: 12, fontFamily: 'Sora_600SemiBold' }}>
                    Bowler: <ThemedText style={{ color: theme.text, fontFamily: 'Sora_700Bold' }}>{bowler.name || 'Not Selected'}</ThemedText> ({bowler.overs * 6 + bowler.ballsInOver} balls)
                  </ThemedText>
                  <View style={{ flexDirection: 'row', gap: 5 }}>
                    {[1, 2, 3, 4, 5, 6].map((b) => (
                      <View
                        key={b}
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: b <= ballsInCurrentOver ? theme.primary : theme.outlineVariant + '44',
                        }}
                      />
                    ))}
                  </View>
                </View>

                {/* ── INLINE COMPACT BALL-BY-BALL KEYPAD (Embedded Inside Screen Space) ── */}
                {showScoringPad && (
                  <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: theme.outlineVariant + '25', gap: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <ThemedText style={{ fontSize: 9, fontFamily: 'Sora_700Bold', color: theme.textSecondary, letterSpacing: 0.6, textTransform: 'uppercase' }}>
                        Ball-by-Ball Control Panel
                      </ThemedText>
                      <ThemedText style={{ fontSize: 9.5, fontFamily: 'Sora_600SemiBold', color: theme.textSecondary }}>
                        Score: <ThemedText style={{ fontFamily: 'Sora_700Bold', color: theme.text }}>{runs}/{wickets}</ThemedText> ({overs}.{ballsInCurrentOver} ov)
                      </ThemedText>
                    </View>

                    {/* Pre-ball Setup Warning Banner if Bowler or Batsmen are missing */}
                    {isPlayersIncomplete && (
                      <Pressable
                        onPress={openEditPlayersModal}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: '#FFFBEB',
                          borderColor: '#F59E0B',
                          borderWidth: 1.5,
                          borderRadius: 12,
                          padding: 10,
                          gap: 10,
                          marginBottom: 4,
                        }}
                      >
                        <Ionicons name="warning" size={20} color="#D97706" />
                        <View style={{ flex: 1 }}>
                          <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_700Bold', color: '#92400E' }}>
                            Verify Players Before Bowling
                          </ThemedText>
                          <ThemedText style={{ fontSize: 10, color: '#B45309', marginTop: 2 }}>
                            {isBowlerMissing && isBatsmenMissing
                              ? 'Assign Bowler & Opening Batsmen to start'
                              : isBowlerMissing
                                ? 'Assign Active Bowler for this over'
                                : 'Assign 2 Opening Batsmen to start'}
                          </ThemedText>
                        </View>
                        <View style={{ backgroundColor: '#F59E0B', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 }}>
                          <ThemedText style={{ color: '#ffffff', fontSize: 10.5, fontFamily: 'Sora_700Bold' }}>
                            Setup
                          </ThemedText>
                        </View>
                      </Pressable>
                    )}

                    {/* Compact 7-grid runs circle buttons (includes 5 for overthrows) */}
                    <View style={[{ flexDirection: 'row', justifyContent: 'space-between', gap: 5, flexWrap: 'wrap' }, isPlayersIncomplete && { opacity: 0.6 }]}>
                      {[0, 1, 2, 3, 4, 5, 6].map((num) => {
                        const isFourOrSix = num === 4 || num === 6;
                        const isFive = num === 5;
                        const label = num === 0 ? 'Dot' : num === 1 ? 'Single' : num === 2 ? 'Double' : num === 3 ? 'Triple' : num === 4 ? 'Four' : num === 5 ? 'Five' : 'Six';

                        return (
                          <Pressable
                            key={num}
                            onPress={() => recordBall('run', num)}
                            style={({ pressed }) => [{
                              flex: 1,
                              minWidth: 38,
                              aspectRatio: 1,
                              borderRadius: 50,
                              justifyContent: 'center',
                              alignItems: 'center',
                              backgroundColor: isFourOrSix
                                ? (num === 4 ? '#10B98118' : '#8B5CF618')
                                : isFive
                                  ? '#F59E0B18'
                                  : theme.surfaceLow,
                              borderWidth: 1.5,
                              borderColor: isFourOrSix
                                ? (num === 4 ? '#10B981' : '#8B5CF6')
                                : isFive
                                  ? '#F59E0B'
                                  : theme.primary + '30',
                            }, pressed && { opacity: 0.75 }]}
                          >
                            <ThemedText style={{ fontSize: 16, fontFamily: 'Sora_800ExtraBold', color: isFourOrSix ? (num === 4 ? '#10B981' : '#8B5CF6') : isFive ? '#F59E0B' : theme.text }}>
                              {num}
                            </ThemedText>
                            <ThemedText style={{ fontSize: 8, fontFamily: 'Sora_600SemiBold', color: theme.textSecondary }}>
                              {label}
                            </ThemedText>
                          </Pressable>
                        );
                      })}
                    </View>

                    {/* Extras Row */}
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {['WD', 'NB', 'BYE', 'LB'].map((extra) => (
                        <Pressable
                          key={extra}
                          onPress={() => handleExtraClick(extra as 'WD' | 'NB' | 'BYE' | 'LB')}
                          style={({ pressed }) => [{
                            flex: 1,
                            paddingVertical: 7,
                            borderRadius: 8,
                            backgroundColor: theme.surfaceLow,
                            borderWidth: 1,
                            borderColor: theme.outlineVariant + '44',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }, pressed && { backgroundColor: theme.primary + '15' }]}
                        >
                          <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_700Bold', color: theme.text }}>
                            {extra === 'WD' ? 'Wide' : extra === 'NB' ? 'No Ball' : extra}
                          </ThemedText>
                        </Pressable>
                      ))}
                    </View>

                    {/* Action Buttons: Wicket + Undo */}
                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                      <Pressable
                        onPress={() => { setWicketRuns(0); setWicketWhoIsOut('striker'); setShowWicketModal(true); }}
                        style={({ pressed }) => [{
                          flex: 2,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#EF4444',
                          paddingVertical: 8,
                          borderRadius: 8,
                          gap: 6,
                        }, pressed && { opacity: 0.85 }]}
                      >
                        <Ionicons name="skull-outline" size={15} color="#ffffff" />
                        <ThemedText style={{ color: '#ffffff', fontSize: 12, fontFamily: 'Sora_700Bold' }}>
                          Wicket
                        </ThemedText>
                      </Pressable>

                      <Pressable
                        onPress={handleUndo}
                        disabled={history.length === 0}
                        style={({ pressed }) => [{
                          flex: 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: theme.surfaceLow,
                          borderWidth: 1,
                          borderColor: theme.outlineVariant + '44',
                          paddingVertical: 8,
                          borderRadius: 8,
                          opacity: history.length === 0 ? 0.4 : 1,
                          gap: 4,
                        }, pressed && { backgroundColor: theme.primary + '15' }]}
                      >
                        <Ionicons name="arrow-undo" size={14} color={theme.text} />
                        <ThemedText style={{ color: theme.text, fontSize: 11, fontFamily: 'Sora_700Bold' }}>
                          Undo
                        </ThemedText>
                      </Pressable>
                    </View>
                  </View>
                )}
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
                      <ThemedText style={{ fontSize: 10, color: theme.primary, marginLeft: 2, fontFamily: 'Sora_700Bold' }}>
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
                      <ThemedText style={{ fontSize: 10, color: theme.primary, marginLeft: 2, fontFamily: 'Sora_700Bold' }}>
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
                      <ThemedText style={{ fontSize: 10, color: theme.primary, marginLeft: 2, fontFamily: 'Sora_700Bold' }}>
                        Edit
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>

                {/* Sub-Header Row */}
                <View style={[styles.tableRow, { paddingVertical: 6, backgroundColor: theme.surfaceLow + '50', borderBottomWidth: 1, borderBottomColor: theme.outlineVariant + '33' }]}>
                  <View style={styles.batsmanNameCell}>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_700Bold' }}>Batsman</ThemedText>
                  </View>
                  <View style={styles.batStatsCells}>
                    <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_700Bold' }}>R</ThemedText></View>
                    <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_700Bold' }}>B</ThemedText></View>
                    <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_700Bold' }}>4s</ThemedText></View>
                    <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_700Bold' }}>6s</ThemedText></View>
                    <View style={[styles.statCell, { width: 50 }]}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_700Bold', textAlign: 'center' }}>SR</ThemedText></View>
                  </View>
                </View>

                {batsmen.length === 0 ? (
                  <View style={{ paddingVertical: 18, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="person-add-outline" size={22} color={theme.textSecondary} style={{ marginBottom: 6 }} />
                    <ThemedText style={{ fontSize: 12.5, fontFamily: 'Sora_600SemiBold', color: theme.textSecondary, marginBottom: 8, textAlign: 'center' }}>
                      No opening batsmen assigned yet
                    </ThemedText>
                    <Pressable
                      onPress={openEditPlayersModal}
                      style={{ backgroundColor: theme.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full }}
                    >
                      <ThemedText style={{ color: '#ffffff', fontSize: 10.5, fontFamily: 'Sora_700Bold' }}>
                        + Select Opening Batsmen
                      </ThemedText>
                    </Pressable>
                  </View>
                ) : (
                  batsmen.map((b, idx) => {
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
                            <ThemedText style={{ color: theme.primary, fontSize: 10, fontFamily: 'Sora_700Bold' }}>
                              {b.name ? b.name.trim().charAt(0).toUpperCase() : 'P'}
                            </ThemedText>
                          </View>
                          <ThemedText numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 13, fontFamily: 'Sora_700Bold', color: theme.text, flexShrink: 1 }}>
                            {b.name}
                          </ThemedText>
                          {b.active && (
                            <Ionicons name="star" size={8} color={theme.error} style={{ marginLeft: 3 }} />
                          )}
                        </Pressable>
                        <View style={styles.batStatsCells}>
                          <View style={styles.statCell}>
                            <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_700Bold', color: theme.text }}>{b.runs}</ThemedText>
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
                            <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_700Bold', color: theme.text }}>{sr}</ThemedText>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })
                )}
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
                      <ThemedText style={{ fontSize: 10, color: theme.primary, marginLeft: 2, fontFamily: 'Sora_700Bold' }}>
                        Edit
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>

                {/* Bowler Sub-Header Row */}
                <View style={[styles.tableRow, { paddingVertical: 6, backgroundColor: theme.surfaceLow + '50', borderBottomWidth: 1, borderBottomColor: theme.outlineVariant + '33' }]}>
                  <View style={styles.batsmanNameCell}>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_700Bold' }}>Bowler</ThemedText>
                  </View>
                  <View style={styles.batStatsCells}>
                    <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_700Bold' }}>O</ThemedText></View>
                    <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_700Bold' }}>M</ThemedText></View>
                    <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_700Bold' }}>R</ThemedText></View>
                    <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_700Bold' }}>W</ThemedText></View>
                    <View style={[styles.statCell, { width: 50 }]}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_700Bold', textAlign: 'center' }}>ECON</ThemedText></View>
                  </View>
                </View>

                {!bowler.name ? (
                  <View style={{ paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' }}>
                    <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_500Medium', color: theme.textSecondary, marginBottom: 6 }}>
                      No bowler assigned for current over
                    </ThemedText>
                    <Pressable
                      onPress={() => { openEditPlayersModal(); setActionTarget({ type: 'bowler' }); }}
                      style={{ backgroundColor: theme.primary + '18', paddingHorizontal: 12, paddingVertical: 5, borderRadius: BorderRadius.full }}
                    >
                      <ThemedText style={{ color: theme.primary, fontSize: 10.5, fontFamily: 'Sora_700Bold' }}>
                        + Assign Bowler
                      </ThemedText>
                    </Pressable>
                  </View>
                ) : (
                  <View style={[styles.tableRow, { paddingVertical: 8, borderLeftWidth: 4, borderLeftColor: 'transparent' }]}>
                    <Pressable
                      onPress={() => {
                        openEditPlayersModal();
                        setActionTarget({ type: 'bowler' });
                      }}
                      style={styles.batsmanNameCell}
                    >
                      <View style={[styles.playerAvatar, { backgroundColor: theme.primary + '15' }]}>
                        <ThemedText style={{ color: theme.primary, fontSize: 10, fontFamily: 'Sora_700Bold' }}>
                          {bowler.name ? bowler.name.trim().charAt(0).toUpperCase() : 'P'}
                        </ThemedText>
                      </View>
                      <ThemedText style={{ fontSize: 13, fontFamily: 'Sora_700Bold', color: theme.text }}>
                        {bowler.name}
                      </ThemedText>
                    </Pressable>
                    <View style={styles.batStatsCells}>
                      <View style={styles.statCell}>
                        <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_700Bold', color: theme.text }}>
                          {bowler.overs || 0}.{bowler.ballsInOver || 0}
                        </ThemedText>
                      </View>
                      <View style={styles.statCell}>
                        <ThemedText style={{ fontSize: 12, color: theme.textSecondary }}>{bowler.maidens || 0}</ThemedText>
                      </View>
                      <View style={styles.statCell}>
                        <ThemedText style={{ fontSize: 12, color: theme.text }}>{bowler.runs || 0}</ThemedText>
                      </View>
                      <View style={styles.statCell}>
                        <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_700Bold', color: theme.text }}>{bowler.wickets || 0}</ThemedText>
                      </View>
                      <View style={[styles.statCell, { width: 50 }]}>
                        <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_700Bold', color: theme.text }}>
                          {(((bowler.overs || 0) * 6 + (bowler.ballsInOver || 0)) > 0 ? ((bowler.runs || 0) / (((bowler.overs || 0) * 6 + (bowler.ballsInOver || 0)) / 6)) : 0).toFixed(2)}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* AI Suggestion Card */}
            <View style={styles.section}>
              <View style={[styles.card, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', borderRadius: BorderRadius.xl, padding: 14, ...Shadows.level2 }]}>
                {/* Header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: theme.primary + '15', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="sparkles" size={14} color={theme.primary} />
                  </View>
                  <ThemedText style={{ fontSize: 13.5, fontFamily: 'Sora_700Bold', color: theme.text }}>
                    AI Next Batsman Suggestion
                  </ThemedText>
                </View>

                <View style={{ gap: 8 }}>
                  {availableBenchBatsmen.length === 0 ? (
                    <View style={{ paddingVertical: 14, alignItems: 'center', justifyContent: 'center' }}>
                      <ThemedText style={{ fontSize: 11.5, color: theme.textSecondary, fontFamily: 'Sora_500Medium', marginBottom: 8, textAlign: 'center' }}>
                        No upcoming batsmen in team bench yet.
                      </ThemedText>
                      <Pressable
                        onPress={() => setShowFullSquadModal(true)}
                        style={{ backgroundColor: theme.primary + '15', paddingHorizontal: 12, paddingVertical: 5, borderRadius: BorderRadius.full }}
                      >
                        <ThemedText style={{ color: theme.primary, fontSize: 10.5, fontFamily: 'Sora_700Bold' }}>
                          + Add Squad Players for AI Suggestions
                        </ThemedText>
                      </Pressable>
                    </View>
                  ) : (
                    availableBenchBatsmen.slice(0, 2).map((b, idx) => (
                      <Pressable
                        key={idx}
                        onPress={() => sendInBatsman(b.name)}
                        style={{ backgroundColor: theme.surfaceLow, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: theme.outlineVariant + '22' }}
                      >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <View style={{ flex: 1, paddingRight: 8 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <ThemedText numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 13, fontFamily: 'Sora_700Bold', color: theme.text, flexShrink: 1 }}>
                                {b.name}
                              </ThemedText>
                              <View style={{ backgroundColor: idx === 0 ? '#10B98118' : '#8B5CF618', paddingVertical: 1.5, paddingHorizontal: 6, borderRadius: BorderRadius.full }}>
                                <ThemedText style={{ fontSize: 7.5, color: idx === 0 ? '#10B981' : '#8B5CF6', fontFamily: 'Sora_800ExtraBold', letterSpacing: 0.5 }}>
                                  {idx === 0 ? 'RECOMMENDED' : 'NEXT UP'}
                                </ThemedText>
                              </View>
                            </View>
                            <ThemedText style={{ fontSize: 9.5, color: theme.textSecondary, marginTop: 2, fontFamily: 'Sora_500Medium' }} numberOfLines={1}>
                              {b.role || 'Squad Batsman'} · In Team Bench
                            </ThemedText>
                          </View>

                          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                            <Pressable
                              onPress={() => sendInBatsman(b.name)}
                              style={{ backgroundColor: theme.primary, paddingHorizontal: 11, paddingVertical: 5, borderRadius: 8 }}
                            >
                              <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_700Bold', color: '#ffffff' }}>
                                Send In
                              </ThemedText>
                            </Pressable>
                          </View>
                        </View>
                      </Pressable>
                    ))
                  )}
                </View>
              </View>
            </View>
          </>
        )}

        {activeSubTab === 'scorecard' && (
          <View style={{ paddingHorizontal: Spacing.containerMargin, gap: Spacing.md, marginTop: Spacing.sm }}>
            {/* Full Team Playing Squad Management Header Bar (Perfect Alignment & Squad Text Only) */}
            <Pressable
              onPress={() => setShowFullSquadModal(true)}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: theme.surfaceLowest,
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: BorderRadius.lg,
                borderWidth: 1,
                borderColor: theme.outlineVariant + '33',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, paddingRight: 6 }}>
                <Ionicons name="people" size={16} color={theme.primary} />
                <ThemedText style={{ fontSize: 13, fontFamily: 'Sora_700Bold', color: theme.text }} numberOfLines={1}>
                  Squad ({teamA})
                </ThemedText>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: theme.primary,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: BorderRadius.full,
                  gap: 4,
                }}
              >
                <Ionicons name="person-add" size={12} color="#ffffff" />
                <ThemedText style={{ color: '#ffffff', fontSize: 10.5, fontFamily: 'Sora_700Bold' }}>
                  Manage Squad
                </ThemedText>
              </View>
            </Pressable>

            {/* Segment Selector Switcher */}
            <View style={{ flexDirection: 'row', backgroundColor: theme.surfaceLow, padding: 4, borderRadius: 10, width: '100%', marginBottom: 4 }}>
              <Pressable
                onPress={() => setScorecardTab('batsmen')}
                style={[{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 }, scorecardTab === 'batsmen' && { backgroundColor: theme.surfaceLowest, ...Shadows.level1 }]}
              >
                <ThemedText style={{ fontSize: 13, fontFamily: scorecardTab === 'batsmen' ? 'Sora_700Bold' : 'Sora_600SemiBold', color: scorecardTab === 'batsmen' ? theme.primary : theme.textSecondary }}>
                  Batsmen
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={() => setScorecardTab('bowlers')}
                style={[{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 }, scorecardTab === 'bowlers' && { backgroundColor: theme.surfaceLowest, ...Shadows.level1 }]}
              >
                <ThemedText style={{ fontSize: 13, fontFamily: scorecardTab === 'bowlers' ? 'Sora_700Bold' : 'Sora_600SemiBold', color: scorecardTab === 'bowlers' ? theme.primary : theme.textSecondary }}>
                  Bowlers
                </ThemedText>
              </Pressable>
            </View>

            {/* Full Batsmen Scorecard */}
            {scorecardTab === 'batsmen' && (
              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 }}>
                  <Ionicons name="stats-chart-outline" size={16} color={theme.primary} />
                  <ThemedText style={{ fontSize: 14, fontFamily: 'Sora_700Bold', color: theme.text }}>
                    Batsmen Scorecard
                  </ThemedText>
                </View>

                {/* Sub-Header Row */}
                <View style={[styles.tableRow, { paddingVertical: 6, backgroundColor: theme.surfaceLow + '70', borderRadius: 8, borderBottomWidth: 0, borderLeftWidth: 4, borderLeftColor: 'transparent' }]}>
                  <View style={styles.batsmanNameCell}>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_700Bold' }}>Batsman</ThemedText>
                  </View>
                  <View style={styles.batStatsCells}>
                    <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_700Bold' }}>R</ThemedText></View>
                    <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_700Bold' }}>B</ThemedText></View>
                    <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_700Bold' }}>4s</ThemedText></View>
                    <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_700Bold' }}>6s</ThemedText></View>
                    <View style={[styles.statCell, { width: 50 }]}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_700Bold', textAlign: 'center' }}>SR</ThemedText></View>
                  </View>
                </View>

                {getFullBatsmenScorecard().length === 0 ? (
                  <View style={{ paddingVertical: 20, alignItems: 'center', justifyContent: 'center' }}>
                    <ThemedText style={{ fontSize: 12, color: theme.textSecondary, fontFamily: 'Sora_500Medium', marginBottom: 8 }}>
                      No active batsmen assigned yet.
                    </ThemedText>
                    <Pressable
                      onPress={() => setShowFullSquadModal(true)}
                      style={{ backgroundColor: theme.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full }}
                    >
                      <ThemedText style={{ color: '#ffffff', fontSize: 11, fontFamily: 'Sora_700Bold' }}>
                        + Assign Squad Batsmen
                      </ThemedText>
                    </Pressable>
                  </View>
                ) : (
                  getFullBatsmenScorecard().map((b, idx) => {
                    const sr = (b.balls && b.balls > 0) ? ((b.runs / b.balls) * 100).toFixed(1) : (b.runs !== undefined ? '0.0' : '-');
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
                            <ThemedText style={{ color: theme.primary, fontSize: 10, fontFamily: 'Sora_700Bold' }}>
                              {b.name ? b.name.trim().charAt(0).toUpperCase() : 'P'}
                            </ThemedText>
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <ThemedText numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 13, fontFamily: 'Sora_700Bold', color: theme.text, flexShrink: 1 }}>
                                {b.name}
                              </ThemedText>
                              {b.active && (
                                <Ionicons name="star" size={8} color={theme.error} style={{ marginLeft: 3 }} />
                              )}
                            </View>
                            <ThemedText style={{ fontSize: 9, color: theme.textSecondary, marginTop: 1 }}>
                              {b.status || 'not out'}
                            </ThemedText>
                          </View>
                        </View>
                        <View style={styles.batStatsCells}>
                          <View style={styles.statCell}>
                            <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_700Bold', color: theme.text }}>{b.runs !== undefined ? b.runs : '-'}</ThemedText>
                          </View>
                          <View style={styles.statCell}>
                            <ThemedText style={{ fontSize: 12, color: theme.textSecondary }}>{b.balls !== undefined ? b.balls : '-'}</ThemedText>
                          </View>
                          <View style={styles.statCell}>
                            <ThemedText style={{ fontSize: 12, color: theme.text }}>{b.fours !== undefined ? b.fours : '-'}</ThemedText>
                          </View>
                          <View style={styles.statCell}>
                            <ThemedText style={{ fontSize: 12, color: theme.text }}>{b.sixes !== undefined ? b.sixes : '-'}</ThemedText>
                          </View>
                          <View style={[styles.statCell, { width: 50 }]}>
                            <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_700Bold', color: theme.text }}>{sr}</ThemedText>
                          </View>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            )}

            {/* Full Bowler Scorecard */}
            {scorecardTab === 'bowlers' && (
              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 }}>
                  <Ionicons name="analytics-outline" size={16} color={theme.primary} />
                  <ThemedText style={{ fontSize: 14, fontFamily: 'Sora_700Bold', color: theme.text }}>
                    Bowlers Scorecard
                  </ThemedText>
                </View>

                {/* Sub-Header Row */}
                <View style={[styles.tableRow, { paddingVertical: 6, backgroundColor: theme.surfaceLow + '70', borderRadius: 8, borderBottomWidth: 0, borderLeftWidth: 4, borderLeftColor: 'transparent' }]}>
                  <View style={styles.batsmanNameCell}>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_700Bold' }}>Bowler</ThemedText>
                  </View>
                  <View style={styles.batStatsCells}>
                    <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_700Bold' }}>O</ThemedText></View>
                    <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_700Bold' }}>M</ThemedText></View>
                    <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_700Bold' }}>R</ThemedText></View>
                    <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_700Bold' }}>W</ThemedText></View>
                    <View style={[styles.statCell, { width: 50 }]}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_700Bold', textAlign: 'center' }}>ECON</ThemedText></View>
                  </View>
                </View>

                {getFullBowlerScorecard().map((b, idx) => {
                  const bowlerOvers = b.overs || 0;
                  const bowlerBallsInOver = b.ballsInOver || 0;
                  const totalBalls = bowlerOvers * 6 + bowlerBallsInOver;
                  const econ = totalBalls > 0 ? ((b.runs / (totalBalls / 6))).toFixed(2) : '0.00';
                  const oversDisplay = `${bowlerOvers}.${bowlerBallsInOver}`;

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
                          <ThemedText style={{ color: theme.primary, fontSize: 10, fontFamily: 'Sora_700Bold' }}>
                            {b.name ? b.name.trim().charAt(0).toUpperCase() : 'P'}
                          </ThemedText>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <ThemedText numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 13, fontFamily: 'Sora_700Bold', color: theme.text, flexShrink: 1 }}>
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
                          <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_700Bold', color: theme.text }}>{oversDisplay}</ThemedText>
                        </View>
                        <View style={styles.statCell}>
                          <ThemedText style={{ fontSize: 12, color: theme.textSecondary }}>{b.maidens}</ThemedText>
                        </View>
                        <View style={styles.statCell}>
                          <ThemedText style={{ fontSize: 12, color: theme.text }}>{b.runs}</ThemedText>
                        </View>
                        <View style={styles.statCell}>
                          <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_700Bold', color: theme.text }}>{b.wickets}</ThemedText>
                        </View>
                        <View style={[styles.statCell, { width: 50 }]}>
                          <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_700Bold', color: theme.text }}>{econ}</ThemedText>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* 📄 Download Score Sheet PDF Button */}
            <Pressable
              onPress={handleExportPDF}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#059669',
                paddingVertical: 12,
                borderRadius: BorderRadius.lg,
                gap: 8,
                marginTop: 8,
              }}
            >
              <Ionicons name="download-outline" size={18} color="#ffffff" />
              <ThemedText style={{ color: '#ffffff', fontFamily: 'Sora_700Bold', fontSize: 13 }}>
                Download Score Sheet PDF
              </ThemedText>
            </Pressable>
          </View>
        )}

        {activeSubTab === 'stats' && (
          <View style={{ paddingHorizontal: Spacing.containerMargin, gap: Spacing.md, marginTop: Spacing.sm }}>
            {/* Quick Metrics Cards - Dynamic live calculation */}
            {(() => {
              const totalMatchBalls = overs * 6 + ballsInCurrentOver;
              const totalDotBalls = history.filter(h => h.overLog && h.overLog.slice(-1)[0] === '0').length + overLog.filter(b => b === '0').length;
              const dotPercentage = totalMatchBalls > 0 ? Math.round((totalDotBalls / totalMatchBalls) * 100) : 0;

              const totalFours = batsmen.reduce((sum, b) => sum + (b.fours || 0), 0);
              const totalSixes = batsmen.reduce((sum, b) => sum + (b.sixes || 0), 0);
              const totalBoundariesCount = totalFours + totalSixes;

              const totalWides = overLog.filter(b => b.includes('WD')).length;
              const totalNoBalls = overLog.filter(b => b.includes('NB')).length;
              const totalByes = overLog.filter(b => b.includes('BYE') || b.includes('LB')).length;
              const totalExtrasCount = totalWides + totalNoBalls + totalByes;

              const activeBat1 = batsmen[0];
              const activeBat2 = batsmen[1];
              const partnershipRuns = (activeBat1?.runs || 0) + (activeBat2?.runs || 0);
              const partnershipBalls = (activeBat1?.balls || 0) + (activeBat2?.balls || 0);

              return (
                <>
                  <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                    <View style={[styles.card, { flex: 1, backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '22', alignItems: 'center', paddingVertical: 14, borderRadius: BorderRadius.xl, borderWidth: 1, borderTopColor: '#10B981', borderTopWidth: 3, ...Shadows.level1 }]}>
                      <View style={{ backgroundColor: '#10B98115', padding: 5, borderRadius: 20, marginBottom: 4 }}>
                        <Ionicons name="ellipse-outline" size={14} color="#10B981" />
                      </View>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: 9, fontFamily: 'Sora_700Bold' }}>DOT BALLS</ThemedText>
                      <ThemedText type="headlineLg" style={{ color: theme.text, fontFamily: 'Sora_800ExtraBold', marginTop: 2 }}>
                        {dotPercentage}%
                      </ThemedText>
                      <ThemedText style={{ fontSize: 9, color: theme.textSecondary, marginTop: 2 }}>{totalDotBalls} of {totalMatchBalls} balls</ThemedText>
                    </View>

                    <View style={[styles.card, { flex: 1, backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '22', alignItems: 'center', paddingVertical: 14, borderRadius: BorderRadius.xl, borderWidth: 1, borderTopColor: '#F59E0B', borderTopWidth: 3, ...Shadows.level1 }]}>
                      <View style={{ backgroundColor: '#F59E0B15', padding: 5, borderRadius: 20, marginBottom: 4 }}>
                        <Ionicons name="flash-outline" size={14} color="#F59E0B" />
                      </View>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: 9, fontFamily: 'Sora_700Bold' }}>BOUNDARIES</ThemedText>
                      <ThemedText type="headlineLg" style={{ color: theme.text, fontFamily: 'Sora_800ExtraBold', marginTop: 2 }}>
                        {totalBoundariesCount}
                      </ThemedText>
                      <ThemedText style={{ fontSize: 9, color: theme.textSecondary, marginTop: 2 }}>{totalFours} Fours • {totalSixes} Sixes</ThemedText>
                    </View>

                    <View style={[styles.card, { flex: 1, backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '22', alignItems: 'center', paddingVertical: 14, borderRadius: BorderRadius.xl, borderWidth: 1, borderTopColor: '#8B5CF6', borderTopWidth: 3, ...Shadows.level1 }]}>
                      <View style={{ backgroundColor: '#8B5CF615', padding: 5, borderRadius: 20, marginBottom: 4 }}>
                        <Ionicons name="gift-outline" size={14} color="#8B5CF6" />
                      </View>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: 9, fontFamily: 'Sora_700Bold' }}>EXTRAS</ThemedText>
                      <ThemedText type="headlineLg" style={{ color: theme.text, fontFamily: 'Sora_800ExtraBold', marginTop: 2 }}>
                        {totalExtrasCount}
                      </ThemedText>
                      <ThemedText style={{ fontSize: 9, color: theme.textSecondary, marginTop: 2 }}>{totalWides}WD • {totalNoBalls}NB • {totalByes}B</ThemedText>
                    </View>
                  </View>

                  {/* Active Partnership Card */}
                  <View style={[styles.card, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', borderRadius: BorderRadius.xl, borderWidth: 1, padding: 14, ...Shadows.level1 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                      <Ionicons name="people-outline" size={16} color={theme.primary} />
                      <ThemedText type="labelMd" style={{ color: theme.text, fontFamily: 'Sora_700Bold' }}>
                        Active Partnership
                      </ThemedText>
                    </View>

                    {(!activeBat1?.name || !activeBat2?.name) ? (
                      <View style={{ paddingVertical: 14, alignItems: 'center', justifyContent: 'center' }}>
                        <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_500Medium', color: theme.textSecondary, fontStyle: 'italic' }}>
                          No active partnership assigned yet
                        </ThemedText>
                      </View>
                    ) : (
                      <>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.surfaceLow + '30', padding: 12, borderRadius: BorderRadius.lg }}>
                          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <View style={[styles.playerAvatar, { backgroundColor: theme.primary + '15', width: 28, height: 28, borderRadius: 14 }]}>
                              <ThemedText style={{ color: theme.primary, fontSize: 10, fontFamily: 'Sora_700Bold' }}>
                                {activeBat1.name.trim().charAt(0).toUpperCase()}
                              </ThemedText>
                            </View>
                            <View style={{ flex: 1 }}>
                              <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_700Bold', color: theme.text }} numberOfLines={1}>{activeBat1.name}</ThemedText>
                              <ThemedText style={{ fontSize: 10, color: theme.textSecondary }}>{activeBat1.runs} ({activeBat1.balls})</ThemedText>
                            </View>
                          </View>

                          <View style={{ alignItems: 'center', paddingHorizontal: 12, backgroundColor: theme.primary + '10', paddingVertical: 4, borderRadius: BorderRadius.sm }}>
                            <ThemedText style={{ fontSize: 14, fontFamily: 'Sora_800ExtraBold', color: theme.primary }}>{partnershipRuns}</ThemedText>
                            <ThemedText style={{ fontSize: 8, color: theme.textSecondary, fontFamily: 'Sora_600SemiBold' }}>runs ({partnershipBalls}b)</ThemedText>
                          </View>

                          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                            <View style={{ alignItems: 'flex-end', flex: 1 }}>
                              <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_700Bold', color: theme.text }} numberOfLines={1}>{activeBat2.name}</ThemedText>
                              <ThemedText style={{ fontSize: 10, color: theme.textSecondary }}>{activeBat2.runs} ({activeBat2.balls})</ThemedText>
                            </View>
                            <View style={[styles.playerAvatar, { backgroundColor: theme.secondary + '15', width: 28, height: 28, borderRadius: 14 }]}>
                              <ThemedText style={{ color: theme.secondary, fontSize: 10, fontFamily: 'Sora_700Bold' }}>
                                {activeBat2.name.trim().charAt(0).toUpperCase()}
                              </ThemedText>
                            </View>
                          </View>
                        </View>

                        {/* Visual Partnership Bar */}
                        <View style={{ height: 6, backgroundColor: theme.surfaceLow, borderRadius: 3, marginTop: 12, overflow: 'hidden', flexDirection: 'row' }}>
                          <View style={{ flex: Math.max(1, activeBat1.runs), backgroundColor: theme.primary }} />
                          <View style={{ flex: Math.max(1, activeBat2.runs), backgroundColor: theme.secondaryContainer }} />
                        </View>
                      </>
                    )}
                  </View>

                  {/* Over-by-Over Run Rate Progress Chart */}
                  <View style={[styles.card, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', borderRadius: BorderRadius.xl, borderWidth: 1, padding: 14, ...Shadows.level1 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                      <Ionicons name="bar-chart-outline" size={16} color={theme.primary} />
                      <ThemedText type="labelMd" style={{ color: theme.text, fontFamily: 'Sora_700Bold' }}>
                        Over-by-Over Run Rate
                      </ThemedText>
                    </View>

                    {overs === 0 && overLog.length === 0 ? (
                      <View style={{ paddingVertical: 18, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="stats-chart-outline" size={24} color={theme.textSecondary} style={{ marginBottom: 6 }} />
                        <ThemedText style={{ fontSize: 12, color: theme.textSecondary, fontFamily: 'Sora_500Medium', textAlign: 'center' }}>
                          No overs completed yet
                        </ThemedText>
                      </View>
                    ) : (
                      <View style={{ height: 130, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: theme.outlineVariant + '15' }}>
                        <View style={{ alignItems: 'center', flex: 1 }}>
                          <ThemedText style={{ fontSize: 9, color: theme.primary, fontFamily: 'Sora_700Bold', marginBottom: 4 }}>
                            {runs}
                          </ThemedText>
                          <View style={{ width: 20, height: `${Math.min(100, Math.max(10, (runs / 20) * 100))}%`, backgroundColor: theme.primary, borderTopLeftRadius: 6, borderTopRightRadius: 6, opacity: 0.85 }} />
                          <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: theme.surfaceLow, justifyContent: 'center', alignItems: 'center', marginTop: 8 }}>
                            <ThemedText style={{ fontSize: 7, color: theme.textSecondary, fontFamily: 'Sora_700Bold' }}>
                              {overs + 1}
                            </ThemedText>
                          </View>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Shot Placement Diagram Card */}
                  <View style={[styles.card, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', alignItems: 'center', borderRadius: BorderRadius.xl, borderWidth: 1, padding: 14, ...Shadows.level1 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, alignSelf: 'flex-start' }}>
                      <Ionicons name="color-palette-outline" size={16} color={theme.primary} />
                      <ThemedText type="labelMd" style={{ color: theme.text, fontFamily: 'Sora_700Bold' }}>
                        Wagon Wheel
                      </ThemedText>
                    </View>

                    {runs === 0 ? (
                      <View style={{ paddingVertical: 20, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="pie-chart-outline" size={26} color={theme.textSecondary} style={{ marginBottom: 6 }} />
                        <ThemedText style={{ fontSize: 12, color: theme.textSecondary, fontFamily: 'Sora_500Medium', fontStyle: 'italic' }}>
                          No shots recorded yet
                        </ThemedText>
                      </View>
                    ) : (
                      <View style={{ width: 180, height: 180, borderRadius: 90, borderWidth: 2, borderColor: '#10B98144', backgroundColor: '#10B98108', justifyContent: 'center', alignItems: 'center', position: 'relative', marginVertical: 8, overflow: 'hidden' }}>
                        <View style={{ width: 32, height: 60, borderRadius: 2, backgroundColor: '#E2E8F0', borderWidth: 1, borderColor: '#CBD5E0', position: 'absolute', opacity: 0.6 }} />
                        <View style={{ width: 100, height: 100, borderRadius: 50, borderWidth: 1, borderColor: '#10B98122', borderStyle: 'dashed', position: 'absolute' }} />
                        <ThemedText style={{ position: 'absolute', top: 10, fontSize: 8, color: theme.textSecondary, fontFamily: 'Sora_600SemiBold' }}>Off Side</ThemedText>
                        <ThemedText style={{ position: 'absolute', bottom: 10, fontSize: 8, color: theme.textSecondary, fontFamily: 'Sora_600SemiBold' }}>Leg Side</ThemedText>
                        <ThemedText style={{ position: 'absolute', left: 10, fontSize: 8, color: theme.textSecondary, fontFamily: 'Sora_600SemiBold' }}>Third Man</ThemedText>
                        <ThemedText style={{ position: 'absolute', right: 10, fontSize: 8, color: theme.textSecondary, fontFamily: 'Sora_600SemiBold' }}>Fine Leg</ThemedText>

                        <View style={{ position: 'absolute', width: 2, height: 75, backgroundColor: '#5D68E8', transform: [{ rotate: '45deg' }], transformOrigin: 'bottom center', bottom: 90, left: 89 }} />
                        <View style={{ position: 'absolute', width: 2, height: 90, backgroundColor: '#10B981', transform: [{ rotate: '-60deg' }], transformOrigin: 'bottom center', bottom: 90, left: 89 }} />
                        <View style={{ position: 'absolute', width: 2.5, height: 90, backgroundColor: '#8B5CF6', transform: [{ rotate: '120deg' }], transformOrigin: 'bottom center', bottom: 90, left: 89 }} />
                      </View>
                    )}
                  </View>
                </>
              );
            })()}
          </View>
        )}

        {activeSubTab === 'details' && (
          <View style={{ paddingHorizontal: Spacing.containerMargin, gap: Spacing.md, marginTop: Spacing.sm }}>
            {/* Match Info Bento Box Card */}
            <View style={[styles.card, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', borderRadius: BorderRadius.xl, borderWidth: 1, padding: 14, ...Shadows.level1 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                <Ionicons name="information-circle-outline" size={16} color={theme.primary} />
                <ThemedText type="labelMd" style={{ color: theme.text, fontFamily: 'Sora_700Bold' }}>
                  Match Information
                </ThemedText>
              </View>

              {/* Bento Grid */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {/* Venue */}
                <View style={{ width: '100%', backgroundColor: theme.surfaceLow + '30', padding: 10, borderRadius: BorderRadius.md, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: theme.primary + '15', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="location-outline" size={14} color={theme.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={{ fontSize: 9, color: theme.textSecondary, fontFamily: 'Sora_600SemiBold' }}>VENUE</ThemedText>
                    <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_700Bold', color: theme.text }}>Turf Pitch 1</ThemedText>
                  </View>
                </View>

                {/* Date / Time */}
                <View style={{ width: '48.5%', backgroundColor: theme.surfaceLow + '30', padding: 10, borderRadius: BorderRadius.md, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: theme.primary + '15', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="calendar-outline" size={12} color={theme.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={{ fontSize: 8, color: theme.textSecondary, fontFamily: 'Sora_600SemiBold' }}>DATE & TIME</ThemedText>
                    <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_700Bold', color: theme.text }}>Live Match</ThemedText>
                  </View>
                </View>

                {/* Match Format */}
                <View style={{ width: '48.5%', backgroundColor: theme.surfaceLow + '30', padding: 10, borderRadius: BorderRadius.md, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: theme.primary + '15', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="trophy-outline" size={12} color={theme.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={{ fontSize: 8, color: theme.textSecondary, fontFamily: 'Sora_600SemiBold' }}>FORMAT</ThemedText>
                    <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_700Bold', color: theme.text }}>{totalOvers} Overs Match</ThemedText>
                  </View>
                </View>

                {/* Match Type */}
                <View style={{ width: '48.5%', backgroundColor: theme.surfaceLow + '30', padding: 10, borderRadius: BorderRadius.md, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: theme.primary + '15', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="ribbon-outline" size={12} color={theme.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={{ fontSize: 8, color: theme.textSecondary, fontFamily: 'Sora_600SemiBold' }}>MATCH TYPE</ThemedText>
                    <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_700Bold', color: theme.text }}>Quick Match</ThemedText>
                  </View>
                </View>

                {/* Umpires */}
                <View style={{ width: '48.5%', backgroundColor: theme.surfaceLow + '30', padding: 10, borderRadius: BorderRadius.md, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: theme.primary + '15', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="people-outline" size={12} color={theme.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={{ fontSize: 8, color: theme.textSecondary, fontFamily: 'Sora_600SemiBold' }}>UMPIRES</ThemedText>
                    <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_700Bold', color: theme.text }}>Self-Scored</ThemedText>
                  </View>
                </View>
              </View>
            </View>

            {/* Squad Details Card */}
            <View style={[styles.card, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', borderRadius: BorderRadius.xl, borderWidth: 1, padding: 14, ...Shadows.level1 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                <Ionicons name="shield-outline" size={16} color={theme.primary} />
                <ThemedText type="labelMd" style={{ color: theme.text, fontFamily: 'Sora_700Bold' }}>
                  Playing Squads
                </ThemedText>
              </View>

              <View style={{ flexDirection: 'row', gap: Spacing.md }}>
                {/* Team A List (Batsmen + Yet to Bat Squad) */}
                <View style={{ flex: 1 }}>
                  <View style={{ backgroundColor: theme.primary, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, marginBottom: 10 }}>
                    <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_700Bold', color: '#ffffff', textAlign: 'center' }}>
                      {teamA}
                    </ThemedText>
                  </View>
                  {(() => {
                    const teamASquad = [...batsmen, ...yetToBatBatsmen].filter(p => p && p.name && p.name.trim().length > 0);
                    if (teamASquad.length === 0) {
                      return (
                        <ThemedText style={{ fontSize: 11, color: theme.textSecondary, fontStyle: 'italic', textAlign: 'center', paddingVertical: 12 }}>
                          No squad members added yet
                        </ThemedText>
                      );
                    }
                    return teamASquad.map((p, idx) => (
                      <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, borderBottomWidth: idx === teamASquad.length - 1 ? 0 : 1, borderBottomColor: theme.outlineVariant + '15' }}>
                        <View style={[styles.playerAvatar, { width: 22, height: 22, borderRadius: 11, backgroundColor: theme.primary + '10' }]}>
                          <ThemedText style={{ fontSize: 8, fontFamily: 'Sora_700Bold', color: theme.primary }}>
                            {p.name ? p.name.trim().charAt(0).toUpperCase() : 'P'}
                          </ThemedText>
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <ThemedText numberOfLines={1} style={{ fontSize: 11, color: theme.text, fontFamily: 'Sora_700Bold' }}>{p.name}</ThemedText>
                          <ThemedText numberOfLines={1} style={{ fontSize: 8, color: theme.textSecondary }}>{p.role || p.status || 'Batsman'}</ThemedText>
                        </View>
                      </View>
                    ));
                  })()}
                </View>

                {/* Divider line */}
                <View style={{ width: 1, backgroundColor: theme.outlineVariant + '1a' }} />

                {/* Team B List (Bowler + Other Bowlers Squad) */}
                <View style={{ flex: 1 }}>
                  <View style={{ backgroundColor: theme.secondary, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, marginBottom: 10 }}>
                    <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_700Bold', color: '#ffffff', textAlign: 'center' }}>
                      {teamB}
                    </ThemedText>
                  </View>
                  {(() => {
                    const teamBSquad = [bowler, ...otherBowlers].filter(p => p && p.name && p.name.trim().length > 0);
                    if (teamBSquad.length === 0) {
                      return (
                        <ThemedText style={{ fontSize: 11, color: theme.textSecondary, fontStyle: 'italic', textAlign: 'center', paddingVertical: 12 }}>
                          No squad members added yet
                        </ThemedText>
                      );
                    }
                    return teamBSquad.map((p, idx) => (
                      <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, borderBottomWidth: idx === teamBSquad.length - 1 ? 0 : 1, borderBottomColor: theme.outlineVariant + '15' }}>
                        <View style={[styles.playerAvatar, { width: 22, height: 22, borderRadius: 11, backgroundColor: theme.secondary + '10' }]}>
                          <ThemedText style={{ fontSize: 8, fontFamily: 'Sora_700Bold', color: theme.secondary }}>
                            {p.name ? p.name.trim().charAt(0).toUpperCase() : 'P'}
                          </ThemedText>
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <ThemedText numberOfLines={1} style={{ fontSize: 11, color: theme.text, fontFamily: 'Sora_700Bold' }}>{p.name}</ThemedText>
                          <ThemedText numberOfLines={1} style={{ fontSize: 8, color: theme.textSecondary }}>{p.role || 'Bowler'}</ThemedText>
                        </View>
                      </View>
                    ));
                  })()}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Spacer */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {activeSubTab === 'live' && (
        <View style={[styles.stickyBottomBar, { backgroundColor: theme.surfaceLowest, borderTopColor: theme.outlineVariant + '22', flexDirection: 'row', gap: 12, alignItems: 'center' }]}>
          {/* Drop Match (Abandon/Cancel) */}
          <Pressable
            onPress={handleDropMatch}
            style={({ pressed }) => [
              styles.mainEndMatchBtn,
              {
                flex: 1,
                backgroundColor: theme.surfaceLow,
                borderWidth: 1.5,
                borderColor: '#ef444455',
                opacity: pressed ? 0.8 : 1,
              }
            ]}
          >
            <Ionicons name="trash-outline" size={17} color="#ef4444" style={{ marginRight: 6 }} />
            <ThemedText type="labelMd" style={{ color: '#ef4444', fontFamily: 'Sora_700Bold', fontSize: 13 }}>
              Drop Match
            </ThemedText>
          </Pressable>

          {/* End Match (Finalize & Popup) */}
          <Pressable
            onPress={handleEndMatch}
            disabled={isSyncing}
            style={({ pressed }) => [
              styles.mainEndMatchBtn,
              {
                flex: 1,
                backgroundColor: theme.error,
                opacity: pressed ? 0.85 : 1,
              },
              isSyncing && { opacity: 0.7 }
            ]}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="checkmark-done" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                <ThemedText type="labelMd" style={{ color: '#ffffff', fontFamily: 'Sora_700Bold', fontSize: 13 }}>
                  End Match
                </ThemedText>
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
                    let bgColor: string = theme.primary;
                    let textColor: string = '#ffffff';
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
                              fontFamily: 'Sora_700Bold',
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
                                fontFamily: 'Sora_800ExtraBold',
                                fontSize: 14,
                              }}
                            >
                              {num}
                            </ThemedText>
                            <ThemedText
                              style={{
                                color: textColor,
                                fontFamily: 'Sora_700Bold',
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
                            fontFamily: 'Sora_700Bold',
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
                  <ThemedText style={{ color: theme.textSecondary, fontSize: 12, fontFamily: 'Sora_600SemiBold' }}>
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
                {[0, 1, 2, 3, 4, 5, 6].map((num) => {
                  const isFourOrSix = num === 4 || num === 6;
                  const isFive = num === 5;
                  const label = num === 0 ? 'Dot' : num === 1 ? 'Single' : num === 2 ? 'Double' : num === 3 ? 'Triple' : num === 4 ? 'Four' : num === 5 ? 'Five' : 'Six';

                  return (
                    <Pressable
                      key={num}
                      onPress={() => recordBall('run', num)}
                      style={({ pressed }) => [
                        styles.scoringButton,
                        isFourOrSix
                          ? { backgroundColor: theme.secondaryContainer, borderBottomColor: theme.onSecondaryContainer }
                          : isFive
                            ? { backgroundColor: '#F59E0B18', borderBottomColor: '#F59E0B' }
                            : { backgroundColor: theme.surfaceLow, borderBottomColor: theme.primary },
                        pressed ? styles.scoringButtonPressed : styles.scoringButtonNormal,
                      ]}
                    >
                      <ThemedText type="headlineLg" style={{ color: isFourOrSix ? theme.onSecondaryContainer : isFive ? '#F59E0B' : theme.text }}>
                        {num}
                      </ThemedText>
                      <ThemedText type="labelSm" style={{ color: isFourOrSix ? theme.onSecondaryContainer + 'bb' : isFive ? '#F59E0B99' : theme.textSecondary }}>
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
                    <ThemedText type="labelMd" style={{ fontFamily: 'Sora_700Bold', color: theme.text }}>
                      {extra === 'WD' ? 'Wide' : extra === 'NB' ? 'No Ball' : extra}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>

              <View style={styles.actionButtonsRow}>
                <Pressable
                  onPress={() => { setWicketRuns(0); setWicketWhoIsOut('striker'); setShowWicketModal(true); }}
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
                  <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_700Bold' }}>Batsman</ThemedText>
                </View>
                <View style={[styles.batStatsCells, { flex: 1 }]}>
                  <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_700Bold' }}>R</ThemedText></View>
                  <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_700Bold' }}>B</ThemedText></View>
                  <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_700Bold' }}>4s</ThemedText></View>
                  <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_700Bold' }}>6s</ThemedText></View>
                  <View style={[styles.statCell, { width: 50 }]}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_700Bold', textAlign: 'center' }}>SR</ThemedText></View>
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
                        <ThemedText numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 13, fontFamily: 'Sora_700Bold', color: theme.text, flexShrink: 1 }}>
                          {b.name}
                        </ThemedText>
                        <ThemedText style={{ fontSize: 10, color: theme.textSecondary }}>
                          {b.status}
                        </ThemedText>
                      </View>
                    </View>
                    <View style={styles.batStatsCells}>
                      <View style={styles.statCell}>
                        <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_700Bold', color: theme.text }}>{b.runs}</ThemedText>
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
                        <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_700Bold', color: theme.text }}>{sr}</ThemedText>
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
                  <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_700Bold' }}>Bowler</ThemedText>
                </View>
                <View style={[styles.batStatsCells, { flex: 1 }]}>
                  <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_700Bold' }}>O</ThemedText></View>
                  <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_700Bold' }}>M</ThemedText></View>
                  <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_700Bold' }}>R</ThemedText></View>
                  <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_700Bold' }}>W</ThemedText></View>
                  <View style={[styles.statCell, { width: 50 }]}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_700Bold', textAlign: 'center' }}>ECON</ThemedText></View>
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
                      <ThemedText numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 13, fontFamily: 'Sora_700Bold', color: theme.text, flexShrink: 1 }}>
                        {b.name}
                      </ThemedText>
                    </View>
                    <View style={styles.batStatsCells}>
                      <View style={styles.statCell}>
                        <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_700Bold', color: theme.text }}>{oversDisplay}</ThemedText>
                      </View>
                      <View style={styles.statCell}>
                        <ThemedText style={{ fontSize: 12, color: theme.textSecondary }}>{b.maidens}</ThemedText>
                      </View>
                      <View style={styles.statCell}>
                        <ThemedText style={{ fontSize: 12, color: theme.text }}>{b.runs}</ThemedText>
                      </View>
                      <View style={styles.statCell}>
                        <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_700Bold', color: theme.text }}>{b.wickets}</ThemedText>
                      </View>
                      <View style={[styles.statCell, { width: 50 }]}>
                        <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_700Bold', color: theme.text }}>{econ}</ThemedText>
                      </View>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Full Team Roster Modal */}
      <Modal
        visible={showFullSquadModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFullSquadModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowFullSquadModal(false)} />
          <View style={[styles.modalContent, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="people" size={20} color={theme.primary} />
                <ThemedText type="headlineSm" style={{ color: theme.text }}>Full Playing Squad Roster</ThemedText>
              </View>
              <Pressable onPress={() => setShowFullSquadModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={theme.text} />
              </Pressable>
            </View>

            {/* Team Toggle (Team A vs Team B) */}
            <View style={{ flexDirection: 'row', backgroundColor: theme.surfaceLow, padding: 4, borderRadius: 10, marginBottom: 14 }}>
              <Pressable
                onPress={() => setSquadTab('A')}
                style={[{ flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: 'center' }, squadTab === 'A' && { backgroundColor: theme.primary }]}
              >
                <ThemedText style={[{ fontSize: 12, fontFamily: 'Sora_700Bold', color: theme.textSecondary }, squadTab === 'A' && { color: '#ffffff' }]}>
                  {teamA} Squad
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={() => setSquadTab('B')}
                style={[{ flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: 'center' }, squadTab === 'B' && { backgroundColor: theme.primary }]}
              >
                <ThemedText style={[{ fontSize: 12, fontFamily: 'Sora_700Bold', color: theme.textSecondary }, squadTab === 'B' && { color: '#ffffff' }]}>
                  {teamB} Squad
                </ThemedText>
              </Pressable>
            </View>

            {/* Add New Player Form (Image Upload + Name + Mobile Number) */}
            <View style={{ backgroundColor: theme.surfaceLow, borderRadius: 12, padding: 12, marginBottom: 14 }}>
              <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_700Bold', color: theme.textSecondary, marginBottom: 10, textTransform: 'uppercase' }}>
                + Add Player to {squadTab === 'A' ? teamA : teamB}
              </ThemedText>

              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                {/* Photo Upload Avatar Button */}
                <Pressable
                  onPress={pickSquadPlayerImage}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: theme.primary + '14',
                    borderWidth: 1.5,
                    borderColor: theme.primary + '44',
                    justifyContent: 'center',
                    alignItems: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {newSquadPlayerImage ? (
                    <Image source={{ uri: newSquadPlayerImage }} style={{ width: 64, height: 64 }} contentFit="cover" />
                  ) : (
                    <View style={{ alignItems: 'center' }}>
                      <Ionicons name="camera" size={20} color={theme.primary} />
                      <ThemedText style={{ fontSize: 8.5, color: theme.primary, fontFamily: 'Sora_700Bold', marginTop: 2 }}>Photo</ThemedText>
                    </View>
                  )}
                </Pressable>

                {/* Name & Mobile Inputs Column */}
                <View style={{ flex: 1, gap: 8 }}>
                  <TextInput
                    value={newSquadPlayerName}
                    onChangeText={setNewSquadPlayerName}
                    placeholder="Full Player Name *"
                    placeholderTextColor="#94a3b8"
                    style={{
                      backgroundColor: theme.surfaceLowest,
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      height: 36,
                      fontSize: 12,
                      color: theme.text,
                      borderWidth: 1,
                      borderColor: theme.outlineVariant + '44',
                    }}
                  />

                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TextInput
                      value={newSquadPlayerMobile}
                      onChangeText={(val) => setNewSquadPlayerMobile(val.replace(/[^0-9]/g, ''))}
                      placeholder="Mobile (10 Digits) *"
                      placeholderTextColor="#94a3b8"
                      keyboardType="phone-pad"
                      maxLength={10}
                      style={{
                        flex: 1,
                        backgroundColor: theme.surfaceLowest,
                        borderRadius: 8,
                        paddingHorizontal: 10,
                        height: 36,
                        fontSize: 12,
                        color: theme.text,
                        borderWidth: 1,
                        borderColor: theme.outlineVariant + '44',
                      }}
                    />

                    <Pressable
                      onPress={() => {
                        if (!newSquadPlayerName.trim()) {
                          Alert.alert('Validation Error', 'Please enter player full name.');
                          return;
                        }
                        if (newSquadPlayerMobile.trim() && newSquadPlayerMobile.trim().length !== 10) {
                          Alert.alert('Validation Error', 'Mobile number must be exactly 10 digits.');
                          return;
                        }
                        const name = newSquadPlayerName.trim();
                        const mobile = newSquadPlayerMobile.trim();
                        const avatar = newSquadPlayerImage || undefined;
                        const playerObj = { name, mobile, avatar, role: newSquadPlayerRole };
                        const targetTeam = squadTab === 'A' ? teamA : teamB;

                        if (squadTab === 'A') {
                          setYetToBatBatsmen(prev => [...prev, playerObj]);
                        } else {
                          setOtherBowlers(prev => [...prev, playerObj]);
                        }

                        // Save player into persistent match store
                        if (typeof addPlayerToTeam === 'function') {
                          addPlayerToTeam(targetTeam, playerObj);
                        }

                        setNewSquadPlayerName('');
                        setNewSquadPlayerMobile('');
                        setNewSquadPlayerImage(null);
                        Alert.alert('Success', `${name} added to ${targetTeam} squad!`);
                      }}
                      style={{
                        backgroundColor: theme.primary,
                        paddingHorizontal: 14,
                        height: 36,
                        borderRadius: 8,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <ThemedText style={{ color: '#ffffff', fontSize: 11.5, fontFamily: 'Sora_700Bold' }}>
                        + Add
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>

            {/* Full Squad Roster List */}
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 10 }}>
              {squadTab === 'A' ? (
                <View style={{ gap: 8 }}>
                  <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_700Bold', color: theme.primary, textTransform: 'uppercase', marginBottom: 2 }}>
                    Active Playing XI ({batsmen.length + yetToBatBatsmen.length} Players)
                  </ThemedText>

                  {/* Playing Batsmen */}
                  {batsmen.map((b, idx) => (
                    <View key={`bat-${idx}`} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.surfaceLow, padding: 10, borderRadius: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginRight: 8 }}>
                        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: theme.primary + '20', justifyContent: 'center', alignItems: 'center' }}>
                          <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_700Bold', color: theme.primary }}>{b.name ? b.name.charAt(0).toUpperCase() : 'P'}</ThemedText>
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <ThemedText numberOfLines={1} style={{ fontSize: 13, fontFamily: 'Sora_700Bold', color: theme.text }}>{b.name} {b.active ? '★ (Striker)' : ''}</ThemedText>
                          <ThemedText numberOfLines={1} style={{ fontSize: 10, color: theme.textSecondary }}>{b.runs} runs ({b.balls} balls) · {b.fours}x4 {b.sixes}x6</ThemedText>
                        </View>
                      </View>
                      <View style={{ backgroundColor: theme.primary + '15', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 }}>
                        <ThemedText style={{ fontSize: 9, color: theme.primary, fontFamily: 'Sora_700Bold' }}>{b.outInfo ? b.outInfo : 'ON PITCH'}</ThemedText>
                      </View>
                    </View>
                  ))}

                  {/* Yet to Bat Squad */}
                  {yetToBatBatsmen.map((b, idx) => (
                    <View key={`bench-${idx}`} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.surfaceLow, padding: 10, borderRadius: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginRight: 8 }}>
                        {b.avatar ? (
                          <Image source={{ uri: b.avatar }} style={{ width: 30, height: 30, borderRadius: 15 }} contentFit="cover" />
                        ) : (
                          <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#64748b20', justifyContent: 'center', alignItems: 'center' }}>
                            <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_700Bold', color: '#64748b' }}>{b.name ? b.name.charAt(0).toUpperCase() : 'P'}</ThemedText>
                          </View>
                        )}
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <ThemedText numberOfLines={1} style={{ fontSize: 13, fontFamily: 'Sora_700Bold', color: theme.text }}>{b.name}</ThemedText>
                          <ThemedText numberOfLines={1} style={{ fontSize: 10, color: theme.textSecondary }}>
                            {b.mobile ? `📱 ${b.mobile} · ` : ''}In Squad · Yet to bat
                          </ThemedText>
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        <Pressable
                          onPress={() => {
                            sendInBatsman(b.name, 0);
                            setShowFullSquadModal(false);
                          }}
                          style={{ backgroundColor: theme.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}
                        >
                          <ThemedText style={{ fontSize: 9.5, color: '#ffffff', fontFamily: 'Sora_700Bold' }}>Striker</ThemedText>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            sendInBatsman(b.name, 1);
                            setShowFullSquadModal(false);
                          }}
                          style={{ backgroundColor: theme.secondary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}
                        >
                          <ThemedText style={{ fontSize: 9.5, color: '#ffffff', fontFamily: 'Sora_700Bold' }}>Non-Striker</ThemedText>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                  {(batsmen.length === 0 && yetToBatBatsmen.length === 0) && (
                    <ThemedText style={{ color: theme.textSecondary, fontSize: 11, fontStyle: 'italic', paddingVertical: 8 }}>No squad members added yet for {teamA}.</ThemedText>
                  )}
                </View>
              ) : (
                <View style={{ gap: 8 }}>
                  <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_700Bold', color: theme.secondary, textTransform: 'uppercase', marginBottom: 2 }}>
                    Bowling Squad ({bowler.name ? 1 + otherBowlers.filter(b => b.name.toLowerCase() !== bowler.name.toLowerCase()).length : otherBowlers.length} Players)
                  </ThemedText>

                  {/* Current Bowler */}
                  {bowler.name ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.secondaryContainer + '1a', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: theme.secondaryContainer }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: theme.secondary, justifyContent: 'center', alignItems: 'center' }}>
                          <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_700Bold', color: '#ffffff' }}>{bowler.name.charAt(0)}</ThemedText>
                        </View>
                        <View>
                          <ThemedText style={{ fontSize: 13, fontFamily: 'Sora_700Bold', color: theme.text }}>{bowler.name} (Current Bowler)</ThemedText>
                          <ThemedText style={{ fontSize: 10, color: theme.textSecondary }}>{bowler.overs}.{bowler.ballsInOver} overs · {bowler.wickets} wickets · {bowler.runs} runs</ThemedText>
                        </View>
                      </View>
                      <View style={{ backgroundColor: theme.secondary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 }}>
                        <ThemedText style={{ fontSize: 9, color: '#ffffff', fontFamily: 'Sora_700Bold' }}>BOWLING</ThemedText>
                      </View>
                    </View>
                  ) : null}

                  {/* Other Bowlers Bench */}
                  {otherBowlers.filter(b => !bowler.name || b.name.toLowerCase() !== bowler.name.toLowerCase()).map((b, idx) => (
                    <View key={`bowler-${idx}`} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.surfaceLow, padding: 10, borderRadius: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginRight: 8 }}>
                        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#64748b20', justifyContent: 'center', alignItems: 'center' }}>
                          <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_700Bold', color: '#64748b' }}>{b.name ? b.name.charAt(0).toUpperCase() : 'P'}</ThemedText>
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <ThemedText numberOfLines={1} style={{ fontSize: 13, fontFamily: 'Sora_700Bold', color: theme.text }}>{b.name}</ThemedText>
                          <ThemedText numberOfLines={1} style={{ fontSize: 10, color: theme.textSecondary }}>In Squad · Bowler</ThemedText>
                        </View>
                      </View>
                      <Pressable
                        onPress={() => {
                          executeReplaceBowler(b.name);
                          setShowFullSquadModal(false);
                        }}
                        style={{ backgroundColor: theme.secondary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}
                      >
                        <ThemedText style={{ fontSize: 9.5, color: '#ffffff', fontFamily: 'Sora_700Bold' }}>Assign Bowler</ThemedText>
                      </Pressable>
                    </View>
                  ))}
                  {(!bowler.name && otherBowlers.length === 0) && (
                    <ThemedText style={{ color: theme.textSecondary, fontSize: 11, fontStyle: 'italic', paddingVertical: 8 }}>No squad members added yet for {teamB}.</ThemedText>
                  )}
                </View>
              )}
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
          <View style={[styles.modalContent, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', width: '92%', maxWidth: 420, alignSelf: 'center', maxHeight: '90%', paddingBottom: 12 }]}>
            {/* Manage Match Players Header */}
            <View style={[styles.modalHeader, { marginBottom: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: theme.outlineVariant + '22' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: theme.primary + '18', justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="people" size={18} color={theme.primary} />
                </View>
                <View>
                  <ThemedText type="headlineSm" style={{ color: theme.text, fontFamily: 'Sora_700Bold', fontSize: 15.5 }}>
                    Manage Match Players
                  </ThemedText>
                  <ThemedText style={{ fontSize: 10, color: theme.textSecondary, fontFamily: 'Sora_500Medium' }}>
                    Configure active batsmen and current bowler
                  </ThemedText>
                </View>
              </View>
              <Pressable onPress={() => setShowEditPlayersModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView
              ref={modalScrollRef}
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: activeDropdownKey !== null ? 220 : 20 }}
            >

              {/* Inline replacement options */}
              {actionTarget !== null && (
                <View style={[styles.card, { backgroundColor: theme.surfaceLowest, borderColor: theme.outline, borderWidth: 1.5, marginBottom: 16, padding: 12 }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <ThemedText type="labelMd" style={{ color: theme.secondary, fontFamily: 'Sora_700Bold' }}>
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

                  {/* Selection lists (Cards) */}
                  <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginBottom: 8, fontFamily: 'Sora_700Bold' }}>
                    Select player from squad bench ({actionTarget.type === 'bowler' ? availableBenchBowlers.length : availableBenchBatsmen.length} available):
                  </ThemedText>

                  <View style={{ gap: 6, marginBottom: 12 }}>
                    {actionTarget.type === 'bowler'
                      ? availableBenchBowlers.map((b, idx) => {
                        const bName = typeof b === 'string' ? b : (b && b.name ? b.name : '');
                        if (!bName) return null;
                        return (
                          <Pressable
                            key={`${bName}_${idx}`}
                            onPress={() => {
                              executeReplaceBowler(bName);
                              setActionTarget(null);
                            }}
                            style={({ pressed }) => [{
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              backgroundColor: theme.surfaceLow,
                              paddingHorizontal: 12,
                              paddingVertical: 10,
                              borderRadius: 8,
                              borderWidth: 1,
                              borderColor: theme.outlineVariant + '33',
                            }, pressed && { backgroundColor: theme.primary + '15' }]}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: theme.primary + '20', justifyContent: 'center', alignItems: 'center' }}>
                                <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_700Bold', color: theme.primary }}>
                                  {bName.charAt(0).toUpperCase()}
                                </ThemedText>
                              </View>
                              <ThemedText style={{ fontSize: 13, fontFamily: 'Sora_700Bold', color: theme.text }}>
                                {bName}
                              </ThemedText>
                            </View>
                            <View style={{ backgroundColor: theme.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
                              <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_700Bold', color: '#ffffff' }}>
                                Select Bowler
                              </ThemedText>
                            </View>
                          </Pressable>
                        );
                      })
                      : availableBenchBatsmen.map((b, idx) => {
                        const bName = typeof b === 'string' ? b : (b && b.name ? b.name : '');
                        if (!bName) return null;
                        return (
                          <Pressable
                            key={`${bName}_${idx}`}
                            onPress={() => {
                              if (actionTarget.type === 'retire') {
                                executeRetire('Retired Hurt', bName);
                              } else {
                                sendInBatsman(bName, actionTarget.batsmanIndex);
                              }
                              setActionTarget(null);
                            }}
                            style={({ pressed }) => [{
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              backgroundColor: theme.surfaceLow,
                              paddingHorizontal: 12,
                              paddingVertical: 10,
                              borderRadius: 8,
                              borderWidth: 1,
                              borderColor: theme.outlineVariant + '33',
                            }, pressed && { backgroundColor: theme.primary + '15' }]}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: theme.primary + '20', justifyContent: 'center', alignItems: 'center' }}>
                                <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_700Bold', color: theme.primary }}>
                                  {bName.charAt(0).toUpperCase()}
                                </ThemedText>
                              </View>
                              <View>
                                <ThemedText style={{ fontSize: 13, fontFamily: 'Sora_700Bold', color: theme.text }}>
                                  {bName}
                                </ThemedText>
                                {b && b.mobile ? (
                                  <ThemedText style={{ fontSize: 9.5, color: theme.textSecondary }}>
                                    {`📱 ${b.mobile}`}
                                  </ThemedText>
                                ) : null}
                              </View>
                            </View>
                            <View style={{ backgroundColor: theme.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
                              <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_700Bold', color: '#ffffff' }}>
                                Send In
                              </ThemedText>
                            </View>
                          </Pressable>
                        );
                      })}
                    {((actionTarget.type === 'bowler' ? availableBenchBowlers : availableBenchBatsmen).length === 0) && (
                      <ThemedText style={{ color: theme.textSecondary, fontSize: 11, fontStyle: 'italic', paddingVertical: 4 }}>No players available on squad bench.</ThemedText>
                    )}
                  </View>

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
                      placeholderTextColor="#94a3b8"
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

              {/* DYNAMIC SECTION ORDER: Show Bowler at top if actionTarget is bowler, else show Batsmen at top */}
              {actionTarget?.type === 'bowler' ? (
                <>
                  {/* BOWLER MANAGEMENT SECTION */}
                  <ThemedText type="labelMd" style={{ color: theme.primary, marginTop: 4, marginBottom: 10, letterSpacing: 0.5 }}>
                    CURRENT BOWLER
                  </ThemedText>

                  <View style={[styles.card, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33', marginBottom: 16, zIndex: activeDropdownKey === 'bowler' ? 9999 : 1 }]}>
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

                    {/* Avatar Picker & Name Input */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4, zIndex: activeDropdownKey === 'bowler' ? 9999 : 1 }}>
                      <Pressable
                        onPress={() => handlePickAvatar('bowler')}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: theme.primary + '15',
                          borderWidth: 1.5,
                          borderColor: theme.primary + '40',
                          justifyContent: 'center',
                          alignItems: 'center',
                          overflow: 'hidden',
                        }}
                      >
                        {bowlAvatar ? (
                          <Image source={{ uri: bowlAvatar }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                        ) : (
                          <Ionicons name="camera-outline" size={20} color={theme.primary} />
                        )}
                      </Pressable>
                      <PlayerDropdownSelector
                        value={bowlName}
                        placeholder="Select Active Bowler..."
                        squadList={otherBowlers}
                        theme={theme}
                        isOpen={activeDropdownKey === 'bowler'}
                        setIsOpen={(val) => setActiveDropdownKey(val ? 'bowler' : null)}
                        onSelectPlayer={(name, avatar) => {
                          setBowlName(name);
                          if (avatar) setBowlAvatar(avatar);
                        }}
                        onCustomNameChange={(name) => setBowlName(name)}
                      />
                    </View>
                    <ThemedText style={{ fontSize: 9.5, color: theme.textSecondary, marginBottom: 8, fontStyle: 'italic' }}>
                      * No numbers allowed · Max 25 chars · Tap icon to upload photo
                    </ThemedText>

                    <View style={styles.statsEditRow}>
                      <View style={styles.statEditCol}>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Overs</ThemedText>
                        <TextInput
                          style={[styles.statInput, { color: theme.text, borderColor: theme.outlineVariant }]}
                          value={bowlOvers}
                          onChangeText={(val) => setBowlOvers(sanitizeNumericInput(val, 2))}
                          keyboardType="numeric"
                          maxLength={2}
                        />
                      </View>
                      <View style={styles.statEditCol}>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Maidens</ThemedText>
                        <TextInput
                          style={[styles.statInput, { color: theme.text, borderColor: theme.outlineVariant }]}
                          value={bowlMaidens}
                          onChangeText={(val) => setBowlMaidens(sanitizeNumericInput(val, 2))}
                          keyboardType="numeric"
                          maxLength={2}
                        />
                      </View>
                      <View style={styles.statEditCol}>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Runs</ThemedText>
                        <TextInput
                          style={[styles.statInput, { color: theme.text, borderColor: theme.outlineVariant }]}
                          value={bowlRuns}
                          onChangeText={(val) => setBowlRuns(sanitizeNumericInput(val, 3))}
                          keyboardType="numeric"
                          maxLength={3}
                        />
                      </View>
                      <View style={styles.statEditCol}>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Wickets</ThemedText>
                        <TextInput
                          style={[styles.statInput, { color: theme.text, borderColor: theme.outlineVariant }]}
                          value={bowlWickets}
                          onChangeText={(val) => setBowlWickets(sanitizeNumericInput(val, 2))}
                          keyboardType="numeric"
                          maxLength={2}
                        />
                      </View>
                    </View>
                  </View>

                  {/* BATSMEN MANAGEMENT SECTION */}
                  <ThemedText type="labelMd" style={{ color: theme.primary, marginBottom: 10, letterSpacing: 0.5 }}>
                    ACTIVE BATSMEN
                  </ThemedText>

                  {/* Batsman 1 */}
                  <View style={[styles.card, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33', marginBottom: 12, zIndex: activeDropdownKey === 'b1' ? 9999 : 3 }]}>
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

                    {/* Avatar Picker & Name Input */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4, zIndex: activeDropdownKey === 'b1' ? 9999 : 1 }}>
                      <Pressable
                        onPress={() => handlePickAvatar('b1')}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: theme.primary + '15',
                          borderWidth: 1.5,
                          borderColor: theme.primary + '40',
                          justifyContent: 'center',
                          alignItems: 'center',
                          overflow: 'hidden',
                        }}
                      >
                        {b1Avatar ? (
                          <Image source={{ uri: b1Avatar }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                        ) : (
                          <Ionicons name="camera-outline" size={20} color={theme.primary} />
                        )}
                      </Pressable>
                      <PlayerDropdownSelector
                        value={b1Name}
                        placeholder="Select Batsman 1..."
                        squadList={yetToBatBatsmen}
                        otherSelectedName={b2Name}
                        dismissedNames={dismissedBatsmen.map(db => db.name)}
                        theme={theme}
                        isOpen={activeDropdownKey === 'b1'}
                        setIsOpen={(val) => setActiveDropdownKey(val ? 'b1' : null)}
                        onSelectPlayer={(name, avatar) => {
                          setB1Name(name);
                          if (avatar) setB1Avatar(avatar);
                        }}
                        onCustomNameChange={(name) => setB1Name(name)}
                      />
                    </View>
                    <ThemedText style={{ fontSize: 9.5, color: theme.textSecondary, marginBottom: 8, fontStyle: 'italic' }}>
                      * No numbers allowed · Max 25 chars · Tap icon to upload photo
                    </ThemedText>

                    <View style={styles.statsEditRow}>
                      <View style={styles.statEditCol}>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Runs</ThemedText>
                        <TextInput
                          style={[styles.statInput, { color: theme.text, borderColor: theme.outlineVariant }]}
                          value={b1Runs}
                          onChangeText={(val) => setB1Runs(sanitizeNumericInput(val, 3))}
                          keyboardType="numeric"
                          maxLength={3}
                        />
                      </View>
                      <View style={styles.statEditCol}>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Balls</ThemedText>
                        <TextInput
                          style={[styles.statInput, { color: theme.text, borderColor: theme.outlineVariant }]}
                          value={b1Balls}
                          onChangeText={(val) => setB1Balls(sanitizeNumericInput(val, 3))}
                          keyboardType="numeric"
                          maxLength={3}
                        />
                      </View>
                      <View style={styles.statEditCol}>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>4s</ThemedText>
                        <TextInput
                          style={[styles.statInput, { color: theme.text, borderColor: theme.outlineVariant }]}
                          value={b1Fours}
                          onChangeText={(val) => setB1Fours(sanitizeNumericInput(val, 2))}
                          keyboardType="numeric"
                          maxLength={2}
                        />
                      </View>
                      <View style={styles.statEditCol}>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>6s</ThemedText>
                        <TextInput
                          style={[styles.statInput, { color: theme.text, borderColor: theme.outlineVariant }]}
                          value={b1Sixes}
                          onChangeText={(val) => setB1Sixes(sanitizeNumericInput(val, 2))}
                          keyboardType="numeric"
                          maxLength={2}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Batsman 2 */}
                  <View style={[styles.card, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33', marginBottom: 12, zIndex: activeDropdownKey === 'b2' ? 9999 : 2 }]}>
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

                    {/* Avatar Picker & Name Input */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4, zIndex: activeDropdownKey === 'b2' ? 9999 : 1 }}>
                      <Pressable
                        onPress={() => handlePickAvatar('b2')}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: theme.primary + '15',
                          borderWidth: 1.5,
                          borderColor: theme.primary + '40',
                          justifyContent: 'center',
                          alignItems: 'center',
                          overflow: 'hidden',
                        }}
                      >
                        {b2Avatar ? (
                          <Image source={{ uri: b2Avatar }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                        ) : (
                          <Ionicons name="camera-outline" size={20} color={theme.primary} />
                        )}
                      </Pressable>
                      <PlayerDropdownSelector
                        value={b2Name}
                        placeholder="Select Batsman 2..."
                        squadList={yetToBatBatsmen}
                        otherSelectedName={b1Name}
                        dismissedNames={dismissedBatsmen.map(db => db.name)}
                        theme={theme}
                        isOpen={activeDropdownKey === 'b2'}
                        setIsOpen={(val) => setActiveDropdownKey(val ? 'b2' : null)}
                        onSelectPlayer={(name, avatar) => {
                          setB2Name(name);
                          if (avatar) setB2Avatar(avatar);
                        }}
                        onCustomNameChange={(name) => setB2Name(name)}
                      />
                    </View>
                    <ThemedText style={{ fontSize: 9.5, color: theme.textSecondary, marginBottom: 8, fontStyle: 'italic' }}>
                      * No numbers allowed · Max 25 chars · Tap icon to upload photo
                    </ThemedText>

                    <View style={styles.statsEditRow}>
                      <View style={styles.statEditCol}>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Runs</ThemedText>
                        <TextInput
                          style={[styles.statInput, { color: theme.text, borderColor: theme.outlineVariant }]}
                          value={b2Runs}
                          onChangeText={(val) => setB2Runs(sanitizeNumericInput(val, 3))}
                          keyboardType="numeric"
                          maxLength={3}
                        />
                      </View>
                      <View style={styles.statEditCol}>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Balls</ThemedText>
                        <TextInput
                          style={[styles.statInput, { color: theme.text, borderColor: theme.outlineVariant }]}
                          value={b2Balls}
                          onChangeText={(val) => setB2Balls(sanitizeNumericInput(val, 3))}
                          keyboardType="numeric"
                          maxLength={3}
                        />
                      </View>
                      <View style={styles.statEditCol}>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>4s</ThemedText>
                        <TextInput
                          style={[styles.statInput, { color: theme.text, borderColor: theme.outlineVariant }]}
                          value={b2Fours}
                          onChangeText={(val) => setB2Fours(sanitizeNumericInput(val, 2))}
                          keyboardType="numeric"
                          maxLength={2}
                        />
                      </View>
                      <View style={styles.statEditCol}>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>6s</ThemedText>
                        <TextInput
                          style={[styles.statInput, { color: theme.text, borderColor: theme.outlineVariant }]}
                          value={b2Sixes}
                          onChangeText={(val) => setB2Sixes(sanitizeNumericInput(val, 2))}
                          keyboardType="numeric"
                          maxLength={2}
                        />
                      </View>
                    </View>
                  </View>
                </>
              ) : (
                <>
                  {/* BATSMEN MANAGEMENT SECTION */}
                  <ThemedText type="labelMd" style={{ color: theme.primary, marginBottom: 10, letterSpacing: 0.5 }}>
                    ACTIVE BATSMEN
                  </ThemedText>

                  {/* Batsman 1 */}
                  <View style={[styles.card, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33', marginBottom: 12, zIndex: activeDropdownKey === 'b1' ? 9999 : 3 }]}>
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

                    {/* Avatar Picker & Name Input */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4, zIndex: activeDropdownKey === 'b1' ? 9999 : 1 }}>
                      <Pressable
                        onPress={() => handlePickAvatar('b1')}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: theme.primary + '15',
                          borderWidth: 1.5,
                          borderColor: theme.primary + '40',
                          justifyContent: 'center',
                          alignItems: 'center',
                          overflow: 'hidden',
                        }}
                      >
                        {b1Avatar ? (
                          <Image source={{ uri: b1Avatar }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                        ) : (
                          <Ionicons name="camera-outline" size={20} color={theme.primary} />
                        )}
                      </Pressable>
                      <PlayerDropdownSelector
                        value={b1Name}
                        placeholder="Select Batsman 1..."
                        squadList={yetToBatBatsmen}
                        otherSelectedName={b2Name}
                        dismissedNames={dismissedBatsmen.map(db => db.name)}
                        theme={theme}
                        isOpen={activeDropdownKey === 'b1'}
                        setIsOpen={(val) => setActiveDropdownKey(val ? 'b1' : null)}
                        onSelectPlayer={(name, avatar) => {
                          setB1Name(name);
                          if (avatar) setB1Avatar(avatar);
                        }}
                        onCustomNameChange={(name) => setB1Name(name)}
                      />
                    </View>
                    <ThemedText style={{ fontSize: 9.5, color: theme.textSecondary, marginBottom: 8, fontStyle: 'italic' }}>
                      * No numbers allowed · Max 25 chars · Tap icon to upload photo
                    </ThemedText>

                    <View style={styles.statsEditRow}>
                      <View style={styles.statEditCol}>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Runs</ThemedText>
                        <TextInput
                          style={[styles.statInput, { color: theme.text, borderColor: theme.outlineVariant }]}
                          value={b1Runs}
                          onChangeText={(val) => setB1Runs(sanitizeNumericInput(val, 3))}
                          keyboardType="numeric"
                          maxLength={3}
                        />
                      </View>
                      <View style={styles.statEditCol}>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Balls</ThemedText>
                        <TextInput
                          style={[styles.statInput, { color: theme.text, borderColor: theme.outlineVariant }]}
                          value={b1Balls}
                          onChangeText={(val) => setB1Balls(sanitizeNumericInput(val, 3))}
                          keyboardType="numeric"
                          maxLength={3}
                        />
                      </View>
                      <View style={styles.statEditCol}>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>4s</ThemedText>
                        <TextInput
                          style={[styles.statInput, { color: theme.text, borderColor: theme.outlineVariant }]}
                          value={b1Fours}
                          onChangeText={(val) => setB1Fours(sanitizeNumericInput(val, 2))}
                          keyboardType="numeric"
                          maxLength={2}
                        />
                      </View>
                      <View style={styles.statEditCol}>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>6s</ThemedText>
                        <TextInput
                          style={[styles.statInput, { color: theme.text, borderColor: theme.outlineVariant }]}
                          value={b1Sixes}
                          onChangeText={(val) => setB1Sixes(sanitizeNumericInput(val, 2))}
                          keyboardType="numeric"
                          maxLength={2}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Batsman 2 */}
                  <View style={[styles.card, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33', marginBottom: 12, zIndex: activeDropdownKey === 'b2' ? 9999 : 2 }]}>
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

                    {/* Avatar Picker & Name Input */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4, zIndex: activeDropdownKey === 'b2' ? 9999 : 1 }}>
                      <Pressable
                        onPress={() => handlePickAvatar('b2')}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: theme.primary + '15',
                          borderWidth: 1.5,
                          borderColor: theme.primary + '40',
                          justifyContent: 'center',
                          alignItems: 'center',
                          overflow: 'hidden',
                        }}
                      >
                        {b2Avatar ? (
                          <Image source={{ uri: b2Avatar }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                        ) : (
                          <Ionicons name="camera-outline" size={20} color={theme.primary} />
                        )}
                      </Pressable>
                      <PlayerDropdownSelector
                        value={b2Name}
                        placeholder="Select Batsman 2..."
                        squadList={yetToBatBatsmen}
                        otherSelectedName={b1Name}
                        dismissedNames={dismissedBatsmen.map(db => db.name)}
                        theme={theme}
                        isOpen={activeDropdownKey === 'b2'}
                        setIsOpen={(val) => setActiveDropdownKey(val ? 'b2' : null)}
                        onSelectPlayer={(name, avatar) => {
                          setB2Name(name);
                          if (avatar) setB2Avatar(avatar);
                        }}
                        onCustomNameChange={(name) => setB2Name(name)}
                      />
                    </View>
                    <ThemedText style={{ fontSize: 9.5, color: theme.textSecondary, marginBottom: 8, fontStyle: 'italic' }}>
                      * No numbers allowed · Max 25 chars · Tap icon to upload photo
                    </ThemedText>

                    <View style={styles.statsEditRow}>
                      <View style={styles.statEditCol}>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Runs</ThemedText>
                        <TextInput
                          style={[styles.statInput, { color: theme.text, borderColor: theme.outlineVariant }]}
                          value={b2Runs}
                          onChangeText={(val) => setB2Runs(sanitizeNumericInput(val, 3))}
                          keyboardType="numeric"
                          maxLength={3}
                        />
                      </View>
                      <View style={styles.statEditCol}>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Balls</ThemedText>
                        <TextInput
                          style={[styles.statInput, { color: theme.text, borderColor: theme.outlineVariant }]}
                          value={b2Balls}
                          onChangeText={(val) => setB2Balls(sanitizeNumericInput(val, 3))}
                          keyboardType="numeric"
                          maxLength={3}
                        />
                      </View>
                      <View style={styles.statEditCol}>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>4s</ThemedText>
                        <TextInput
                          style={[styles.statInput, { color: theme.text, borderColor: theme.outlineVariant }]}
                          value={b2Fours}
                          onChangeText={(val) => setB2Fours(sanitizeNumericInput(val, 2))}
                          keyboardType="numeric"
                          maxLength={2}
                        />
                      </View>
                      <View style={styles.statEditCol}>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>6s</ThemedText>
                        <TextInput
                          style={[styles.statInput, { color: theme.text, borderColor: theme.outlineVariant }]}
                          value={b2Sixes}
                          onChangeText={(val) => setB2Sixes(sanitizeNumericInput(val, 2))}
                          keyboardType="numeric"
                          maxLength={2}
                        />
                      </View>
                    </View>
                  </View>

                  {/* BOWLER MANAGEMENT SECTION */}
                  <ThemedText type="labelMd" style={{ color: theme.primary, marginTop: 8, marginBottom: 10, letterSpacing: 0.5 }}>
                    CURRENT BOWLER
                  </ThemedText>

                  <View style={[styles.card, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33', marginBottom: 16, zIndex: activeDropdownKey === 'bowler' ? 9999 : 1 }]}>
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

                    {/* Avatar Picker & Name Input */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4, zIndex: activeDropdownKey === 'bowler' ? 9999 : 1 }}>
                      <Pressable
                        onPress={() => handlePickAvatar('bowler')}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: theme.primary + '15',
                          borderWidth: 1.5,
                          borderColor: theme.primary + '40',
                          justifyContent: 'center',
                          alignItems: 'center',
                          overflow: 'hidden',
                        }}
                      >
                        {bowlAvatar ? (
                          <Image source={{ uri: bowlAvatar }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                        ) : (
                          <Ionicons name="camera-outline" size={20} color={theme.primary} />
                        )}
                      </Pressable>
                      <PlayerDropdownSelector
                        value={bowlName}
                        placeholder="Select Active Bowler..."
                        squadList={otherBowlers}
                        theme={theme}
                        isOpen={activeDropdownKey === 'bowler'}
                        setIsOpen={(val) => setActiveDropdownKey(val ? 'bowler' : null)}
                        onSelectPlayer={(name, avatar) => {
                          setBowlName(name);
                          if (avatar) setBowlAvatar(avatar);
                        }}
                        onCustomNameChange={(name) => setBowlName(name)}
                      />
                    </View>
                    <ThemedText style={{ fontSize: 9.5, color: theme.textSecondary, marginBottom: 8, fontStyle: 'italic' }}>
                      * No numbers allowed · Max 25 chars · Tap icon to upload photo
                    </ThemedText>

                    <View style={styles.statsEditRow}>
                      <View style={styles.statEditCol}>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Overs</ThemedText>
                        <TextInput
                          style={[styles.statInput, { color: theme.text, borderColor: theme.outlineVariant }]}
                          value={bowlOvers}
                          onChangeText={(val) => setBowlOvers(sanitizeNumericInput(val, 2))}
                          keyboardType="numeric"
                          maxLength={2}
                        />
                      </View>
                      <View style={styles.statEditCol}>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Maidens</ThemedText>
                        <TextInput
                          style={[styles.statInput, { color: theme.text, borderColor: theme.outlineVariant }]}
                          value={bowlMaidens}
                          onChangeText={(val) => setBowlMaidens(sanitizeNumericInput(val, 2))}
                          keyboardType="numeric"
                          maxLength={2}
                        />
                      </View>
                      <View style={styles.statEditCol}>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Runs</ThemedText>
                        <TextInput
                          style={[styles.statInput, { color: theme.text, borderColor: theme.outlineVariant }]}
                          value={bowlRuns}
                          onChangeText={(val) => setBowlRuns(sanitizeNumericInput(val, 3))}
                          keyboardType="numeric"
                          maxLength={3}
                        />
                      </View>
                      <View style={styles.statEditCol}>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Wickets</ThemedText>
                        <TextInput
                          style={[styles.statInput, { color: theme.text, borderColor: theme.outlineVariant }]}
                          value={bowlWickets}
                          onChangeText={(val) => setBowlWickets(sanitizeNumericInput(val, 2))}
                          keyboardType="numeric"
                          maxLength={2}
                        />
                      </View>
                    </View>
                  </View>
                </>
              )}
            </ScrollView>

            {/* FIXED STICKY ACTION FOOTER - ALWAYS FULLY VISIBLE & ATTRACTIVE */}
            <View style={{
              flexDirection: 'row',
              gap: 12,
              paddingTop: 12,
              paddingBottom: 4,
              borderTopWidth: 1,
              borderTopColor: theme.outlineVariant + '22',
              backgroundColor: theme.surfaceLowest,
            }}>
              <Pressable
                onPress={() => setShowEditPlayersModal(false)}
                style={({ pressed }) => [
                  styles.cancelBtn,
                  {
                    borderColor: theme.outlineVariant + '66',
                    height: 44,
                    borderRadius: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    backgroundColor: theme.surfaceLow,
                    opacity: pressed ? 0.8 : 1,
                  }
                ]}
              >
                <Ionicons name="close-circle-outline" size={16} color={theme.textSecondary} />
                <ThemedText type="labelMd" style={{ color: theme.textSecondary, fontFamily: 'Sora_700Bold' }}>Cancel</ThemedText>
              </Pressable>

              <Pressable
                onPress={savePlayersEdit}
                style={({ pressed }) => [
                  styles.saveBtn,
                  {
                    backgroundColor: theme.primary,
                    height: 44,
                    borderRadius: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    elevation: 3,
                    boxShadow: `0px 4px 12px ${theme.primary}40`,
                    opacity: pressed ? 0.85 : 1,
                  }
                ]}
              >
                <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
                <ThemedText type="labelMd" style={{ color: '#ffffff', fontFamily: 'Sora_700Bold', fontSize: 13.5 }}>Save Changes</ThemedText>
              </Pressable>
            </View>
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
                  <ThemedText style={{ fontSize: 16, fontFamily: 'Sora_700Bold', color: theme.text }}>
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
                <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginBottom: 8, fontFamily: 'Sora_700Bold' }}>
                  SELECT NEXT BOWLER
                </ThemedText>

                {/* List of other bowlers on the bench */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
                >
                  {availableBenchBowlers.map((b, idx) => {
                    const bName = typeof b === 'string' ? b : (b && b.name ? b.name : '');
                    if (!bName) return null;
                    return (
                      <Pressable
                        key={`${bName}_${idx}`}
                        onPress={() => {
                          executeReplaceBowler(bName);
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
                        <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_600SemiBold', color: theme.text }}>
                          {bName}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                  {availableBenchBowlers.length === 0 && (
                    <ThemedText style={{ color: theme.textSecondary, fontSize: 11, fontStyle: 'italic', paddingVertical: 8 }}>
                      No bench bowlers available.
                    </ThemedText>
                  )}
                </ScrollView>
              </View>

              <View>
                <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginBottom: 6, fontFamily: 'Sora_700Bold' }}>
                  OR ADD NEW CUSTOM BOWLER
                </ThemedText>

                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <TextInput
                    style={[styles.modalInput, { flex: 1, color: theme.text, borderColor: theme.outlineVariant, marginBottom: 0 }]}
                    value={customNewName}
                    onChangeText={setCustomNewName}
                    placeholder="Enter new bowler's name..."
                    placeholderTextColor="#94a3b8"
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

      {/* Wicket Detail Modal — one tap for a normal dismissal, or record a run
          out with the runs completed and which batsman was out. */}
      <Modal
        visible={showWicketModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWicketModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowWicketModal(false)} />
          <View style={[styles.modalContent, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', maxHeight: '75%' }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="headlineSm" style={{ color: theme.text }}>Record Wicket</ThemedText>
              <Pressable onPress={() => setShowWicketModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              <Pressable
                style={[styles.extraOptionBtn, { backgroundColor: '#EF444415', borderColor: '#EF4444' }]}
                onPress={() => {
                  setShowWicketModal(false);
                  recordBall('wicket', 'W');
                }}
              >
                <ThemedText style={{ fontFamily: 'Sora_700Bold', color: '#EF4444' }}>Wicket — no runs</ThemedText>
                <ThemedText style={{ fontSize: 10, color: theme.textSecondary }}>
                  Bowled, caught, LBW, stumped · striker out, credited to the bowler
                </ThemedText>
              </Pressable>

              <View style={{ height: 1, backgroundColor: theme.outlineVariant + '33', marginVertical: 16 }} />

              <ThemedText style={{ fontFamily: 'Sora_700Bold', color: theme.text, marginBottom: 4 }}>Run out</ThemedText>
              <ThemedText style={{ color: theme.textSecondary, marginBottom: 12, fontSize: 12 }}>
                Runs completed before the dismissal are added to the total and to the striker. Not credited to the bowler.
              </ThemedText>

              <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_700Bold', color: theme.textSecondary, marginBottom: 6 }}>
                RUNS COMPLETED
              </ThemedText>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                {[0, 1, 2, 3].map(r => {
                  const active = wicketRuns === r;
                  return (
                    <Pressable
                      key={r}
                      onPress={() => setWicketRuns(r)}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 8,
                        alignItems: 'center',
                        borderWidth: 1.5,
                        borderColor: active ? theme.primary : theme.outlineVariant + '44',
                        backgroundColor: active ? theme.primary : 'transparent',
                      }}
                    >
                      <ThemedText style={{ fontFamily: 'Sora_700Bold', color: active ? '#ffffff' : theme.text }}>{r}</ThemedText>
                    </Pressable>
                  );
                })}
              </View>

              <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_700Bold', color: theme.textSecondary, marginBottom: 6 }}>
                WHO IS OUT
              </ThemedText>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                {(['striker', 'non-striker'] as const).map(who => {
                  const active = wicketWhoIsOut === who;
                  const player = batsmen.find(b => (who === 'striker' ? b.active : !b.active));
                  return (
                    <Pressable
                      key={who}
                      onPress={() => setWicketWhoIsOut(who)}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        paddingHorizontal: 8,
                        borderRadius: 8,
                        alignItems: 'center',
                        borderWidth: 1.5,
                        borderColor: active ? theme.primary : theme.outlineVariant + '44',
                        backgroundColor: active ? theme.primary + '15' : 'transparent',
                      }}
                    >
                      <ThemedText numberOfLines={1} style={{ fontFamily: 'Sora_700Bold', fontSize: 12, color: active ? theme.primary : theme.text }}>
                        {who === 'striker' ? 'Striker' : 'Non-striker'}
                      </ThemedText>
                      <ThemedText numberOfLines={1} style={{ fontSize: 10, color: theme.textSecondary }}>
                        {player?.name || '—'}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                style={[styles.extraOptionBtn, { backgroundColor: theme.primary, borderColor: theme.primary }]}
                onPress={() => {
                  setShowWicketModal(false);
                  recordBall('wicket', 'W', {
                    runsCompleted: wicketRuns,
                    whoIsOut: wicketWhoIsOut,
                    creditBowler: false,
                  });
                }}
              >
                <ThemedText style={{ fontFamily: 'Sora_700Bold', color: '#ffffff' }}>
                  Record run out{wicketRuns > 0 ? ` + ${wicketRuns} run${wicketRuns === 1 ? '' : 's'}` : ''}
                </ThemedText>
                <ThemedText style={{ fontSize: 10, color: '#ffffffcc' }}>
                  {wicketWhoIsOut === 'striker' ? 'Striker' : 'Non-striker'} out
                  {wicketRuns > 0 ? ` · +${wicketRuns} to the total` : ''}
                </ThemedText>
              </Pressable>
            </ScrollView>
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
                  {/* Options are expressed as "runs the batsmen RAN", with the
                      1-run penalty added automatically and the resulting team
                      total spelled out — picking "2 runs" for a wide previously
                      scored 2 in total instead of the correct 3. */}
                  {[0, 1, 2, 3].map(ran => {
                    const total = ran + 1;
                    const isWide = activeExtraType === 'WD';
                    const label =
                      ran === 0
                        ? isWide ? 'Wide only' : 'No ball only'
                        : `${isWide ? 'Wide' : 'No ball'} + ${ran} run${ran === 1 ? '' : 's'} ${isWide ? 'run' : 'off the bat'}`;
                    const sub =
                      ran === 0
                        ? `Adds ${total} run to the total · delivery re-bowled`
                        : `Adds ${total} runs to the total (1 penalty + ${ran})${
                            isWide ? '' : ` · ${ran} credited to the striker`
                          } · delivery re-bowled`;
                    return (
                      <Pressable
                        key={ran}
                        style={[styles.extraOptionBtn, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '22' }]}
                        onPress={() => {
                          if (activeExtraType) {
                            // Wides can't be hit, so nothing is credited off the bat.
                            recordExtraWithRuns(activeExtraType, total, false, isWide ? 0 : ran);
                          }
                          setShowExtraModal(false);
                        }}
                      >
                        <ThemedText style={{ fontFamily: 'Sora_700Bold', color: theme.text }}>{label}</ThemedText>
                        <ThemedText style={{ fontSize: 10, color: theme.textSecondary }}>{sub}</ThemedText>
                      </Pressable>
                    );
                  })}

                  <Pressable
                    style={[styles.extraOptionBtn, { backgroundColor: theme.primaryContainer + '22', borderColor: theme.primary }]}
                    onPress={() => {
                      if (activeExtraType) recordExtraWithRuns(activeExtraType, 0, true);
                      setShowExtraModal(false);
                    }}
                  >
                    <ThemedText style={{ fontFamily: 'Sora_700Bold', color: theme.primary }}>Correction: count as legal ball, 0 runs</ThemedText>
                    <ThemedText style={{ fontSize: 10, color: theme.textSecondary }}>Use if this was called in error — consumes a ball, adds nothing</ThemedText>
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
                    <ThemedText style={{ fontFamily: 'Sora_700Bold', color: theme.text }}>1 Run</ThemedText>
                    <ThemedText style={{ fontSize: 10, color: theme.textSecondary }}>1 bye/leg-bye run, counts as a legal ball</ThemedText>
                  </Pressable>

                  <Pressable
                    style={[styles.extraOptionBtn, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '22' }]}
                    onPress={() => {
                      if (activeExtraType) recordExtraWithRuns(activeExtraType, 2, true);
                      setShowExtraModal(false);
                    }}
                  >
                    <ThemedText style={{ fontFamily: 'Sora_700Bold', color: theme.text }}>2 Runs</ThemedText>
                    <ThemedText style={{ fontSize: 10, color: theme.textSecondary }}>2 bye/leg-bye runs, counts as a legal ball</ThemedText>
                  </Pressable>

                  <Pressable
                    style={[styles.extraOptionBtn, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '22' }]}
                    onPress={() => {
                      if (activeExtraType) recordExtraWithRuns(activeExtraType, 3, true);
                      setShowExtraModal(false);
                    }}
                  >
                    <ThemedText style={{ fontFamily: 'Sora_700Bold', color: theme.text }}>3 Runs</ThemedText>
                    <ThemedText style={{ fontSize: 10, color: theme.textSecondary }}>3 bye/leg-bye runs, counts as a legal ball</ThemedText>
                  </Pressable>

                  <Pressable
                    style={[styles.extraOptionBtn, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '22' }]}
                    onPress={() => {
                      if (activeExtraType) recordExtraWithRuns(activeExtraType, 4, true);
                      setShowExtraModal(false);
                    }}
                  >
                    <ThemedText style={{ fontFamily: 'Sora_700Bold', color: theme.text }}>4 Runs</ThemedText>
                    <ThemedText style={{ fontSize: 10, color: theme.textSecondary }}>4 bye/leg-bye runs (boundary), counts as a legal ball</ThemedText>
                  </Pressable>

                  <Pressable
                    style={[styles.extraOptionBtn, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '22' }]}
                    onPress={() => {
                      if (activeExtraType) recordExtraWithRuns(activeExtraType, 0, true);
                      setShowExtraModal(false);
                    }}
                  >
                    <ThemedText style={{ fontFamily: 'Sora_700Bold', color: theme.text }}>0 Runs (Dot Ball)</ThemedText>
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


      {/* 🏆 MATCH VICTORY CELEBRATION MODAL */}
      <Modal
        visible={showVictoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowVictoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', padding: 20, alignItems: 'center', width: '92%', maxWidth: 420, borderRadius: 12, overflow: 'hidden', alignSelf: 'center' }]}>
            {/* 🐒 🌸 Festive Monkey & Flower Particle Header Row with Animated Bouncing */}
            <Animated.View style={{ transform: [{ translateY: confettiBounceAnim }], width: '100%', flexDirection: 'row', justifyContent: 'space-around', opacity: 0.95, marginBottom: 6 }}>
              <ThemedText style={{ fontSize: 24 }}>🐒</ThemedText>
              <ThemedText style={{ fontSize: 22 }}>🌸</ThemedText>
              <ThemedText style={{ fontSize: 26 }}>🎉</ThemedText>
              <ThemedText style={{ fontSize: 24 }}>🌺</ThemedText>
              <ThemedText style={{ fontSize: 26 }}>🏆</ThemedText>
              <ThemedText style={{ fontSize: 24 }}>🌻</ThemedText>
              <ThemedText style={{ fontSize: 22 }}>🐒</ThemedText>
            </Animated.View>

            {/* Animated Celebration Icon Badge flanked by Monkey and Flower */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 8 }}>
              <ThemedText style={{ fontSize: 28 }}>🐒</ThemedText>
              <Animated.View style={{ transform: [{ scale: trophyAnimScale }], width: 74, height: 74, borderRadius: 37, backgroundColor: '#F59E0B20', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#F59E0B', boxShadow: '0px 8px 24px rgba(245, 158, 11, 0.5)' }}>
                <Ionicons name="trophy" size={40} color="#F59E0B" />
              </Animated.View>
              <ThemedText style={{ fontSize: 28 }}>🌸</ThemedText>
            </View>

            <ThemedText style={{ fontSize: 22, fontFamily: 'Sora_800ExtraBold', color: theme.text, textAlign: 'center', letterSpacing: 0.2 }}>
              🎉 {matchVictoryData?.winnerName} Won!
            </ThemedText>

            {/* 🐒 🌸 Festive Celebration Banner */}
            <View style={{ backgroundColor: '#F59E0B15', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#F59E0B33', marginVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <ThemedText style={{ fontSize: 13 }}>🌸</ThemedText>
              <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_700Bold', color: '#F59E0B' }}>
                🐒 Victory Flower & Monkey Celebration! 🌸
              </ThemedText>
              <ThemedText style={{ fontSize: 13 }}>🐒</ThemedText>
            </View>

            <View style={{ backgroundColor: '#10B98118', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 12, borderWidth: 1, borderColor: '#10B98133', marginVertical: 8 }}>
              <ThemedText style={{ fontSize: 13, fontFamily: 'Sora_700Bold', color: '#10B981' }}>
                🏆 {matchVictoryData?.winMargin}
              </ThemedText>
            </View>

            <ThemedText style={{ fontSize: 12, color: theme.textSecondary, textAlign: 'center', marginBottom: 16 }}>
              Target: {matchVictoryData?.target} runs · Completed in {matchVictoryData?.secondInningsOvers} overs
            </ThemedText>

            {/* Man of the Match Card */}
            <View style={{ width: '100%', backgroundColor: theme.surfaceLow, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: theme.outlineVariant + '33', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Ionicons name="star" size={15} color="#F59E0B" />
                <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_700Bold', color: '#F59E0B', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Man of the Match
                </ThemedText>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.primary + '20', justifyContent: 'center', alignItems: 'center' }}>
                    <ThemedText style={{ fontSize: 14, fontFamily: 'Sora_700Bold', color: theme.primary }}>
                      {matchVictoryData?.motmName?.charAt(0).toUpperCase()}
                    </ThemedText>
                  </View>
                  <View>
                    <ThemedText style={{ fontSize: 14, fontFamily: 'Sora_700Bold', color: theme.text }}>
                      {matchVictoryData?.motmName}
                    </ThemedText>
                    <ThemedText style={{ fontSize: 11, color: theme.textSecondary, marginTop: 1 }}>
                      ⭐ {matchVictoryData?.motmStat}
                    </ThemedText>
                  </View>
                </View>
              </View>
            </View>

            {/* Score Summary Box */}
            <View style={{ width: '100%', backgroundColor: theme.primary + '10', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: theme.primary + '25', marginBottom: 20, gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_600SemiBold', color: theme.text }}>
                  1st Innings ({matchVictoryData?.firstInningsTeam}):
                </ThemedText>
                <ThemedText style={{ fontSize: 13, fontFamily: 'Sora_700Bold', color: theme.text }}>
                  {matchVictoryData?.firstInningsScore} ({matchVictoryData?.firstInningsOvers} ov)
                </ThemedText>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_600SemiBold', color: theme.text }}>
                  2nd Innings ({matchVictoryData?.secondInningsTeam}):
                </ThemedText>
                <ThemedText style={{ fontSize: 13, fontFamily: 'Sora_700Bold', color: theme.primary }}>
                  {matchVictoryData?.secondInningsScore} ({matchVictoryData?.secondInningsOvers} ov)
                </ThemedText>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={{ gap: 10, width: '100%' }}>
              <Pressable
                onPress={handleRematchSameTeams}
                style={({ pressed }) => [{ width: '100%', paddingVertical: 12, borderRadius: 10, backgroundColor: '#F59E0B', alignItems: 'center' }, pressed && { opacity: 0.85 }]}
              >
                <ThemedText style={{ fontSize: 13, fontFamily: 'Sora_700Bold', color: '#ffffff' }}>
                  🔄 Rematch (Start New Match with Same Teams)
                </ThemedText>
              </Pressable>

              <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
                <Pressable
                  onPress={() => {
                    setShowVictoryModal(false);
                    setActiveSubTab('scorecard');
                  }}
                  style={({ pressed }) => [{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: theme.surfaceLow, borderWidth: 1, borderColor: theme.outlineVariant + '44', alignItems: 'center' }, pressed && { opacity: 0.8 }]}
                >
                  <ThemedText style={{ fontSize: 12.5, fontFamily: 'Sora_700Bold', color: theme.text }}>
                    View Scorecard
                  </ThemedText>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setShowVictoryModal(false);
                    router.replace('/(tabs)/matches');
                  }}
                  style={({ pressed }) => [{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: theme.primary, alignItems: 'center' }, pressed && { opacity: 0.85 }]}
                >
                  <ThemedText style={{ fontSize: 12.5, fontFamily: 'Sora_700Bold', color: '#ffffff' }}>
                    Done / Matches
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* 🪙 REMATCH 3D COIN FLIP TOSS MODAL */}
      <Modal
        visible={showRematchTossModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRematchTossModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', padding: 20, alignItems: 'center', width: '92%', maxWidth: 420, borderRadius: 12 }]}>

            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
              <ThemedText style={{ fontSize: 18 }}>✨</ThemedText>
              <ThemedText style={{ fontSize: 18, fontFamily: 'Sora_800ExtraBold', color: theme.text }}>
                Rematch Coin Toss
              </ThemedText>
            </View>

            <ThemedText style={{ fontSize: 12, color: theme.textSecondary, textAlign: 'center', marginBottom: 10 }}>
              Flip the 3D coin to decide who bats or bowls first in the rematch!
            </ThemedText>

            {/* 3D Animated Coin Display */}
            <Animated.View style={{
              transform: [{
                rotateY: coinRotateAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '1440deg'],
                })
              }],
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: '#F59E0B',
              justifyContent: 'center',
              alignItems: 'center',
              marginVertical: 8,
              borderWidth: 3.5,
              borderColor: '#FDE047',
              boxShadow: '0px 8px 24px rgba(245, 158, 11, 0.6)',
            }}>
              <ThemedText style={{ fontSize: 30 }}>
                {coinSide === 'HEADS' ? '🪙' : coinSide === 'TAILS' ? '🪙' : '🪙'}
              </ThemedText>
              <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_800ExtraBold', color: '#ffffff', marginTop: 1 }}>
                {coinSide ? coinSide : 'FLIP!'}
              </ThemedText>
            </Animated.View>

            {/* Spin Coin Button */}
            <Pressable
              onPress={flipCoinForToss}
              disabled={isFlippingCoin}
              style={({ pressed }) => [{
                backgroundColor: '#F59E0B18',
                borderWidth: 1.5,
                borderColor: '#F59E0B',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                marginVertical: 8,
              }, pressed && { opacity: 0.8 }]}
            >
              <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_700Bold', color: '#F59E0B' }}>
                {isFlippingCoin ? '🌀 Flipping Coin...' : '🪙 Flip Coin Randomizer'}
              </ThemedText>
            </Pressable>

            {/* Select Toss Winner Team */}
            <View style={{ width: '100%', marginTop: 10, marginBottom: 8 }}>
              <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_700Bold', color: theme.textSecondary, textTransform: 'uppercase', marginBottom: 6 }}>
                Toss Winner:
              </ThemedText>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[teamA, teamB].map((tName) => (
                  <Pressable
                    key={tName}
                    onPress={() => setRematchTossWinner(tName)}
                    style={[{ flex: 1, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5, borderColor: theme.outlineVariant + '44', alignItems: 'center', backgroundColor: theme.surfaceLow }, rematchTossWinner === tName && { backgroundColor: theme.primary + '18', borderColor: theme.primary }]}
                  >
                    <ThemedText style={[{ fontSize: 12, fontFamily: 'Sora_700Bold', color: theme.text }, rematchTossWinner === tName && { color: theme.primary }]}>
                      {tName} {rematchTossWinner === tName ? '👑' : ''}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Select Decision (Bat / Bowl) */}
            <View style={{ width: '100%', marginBottom: 16 }}>
              <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_700Bold', color: theme.textSecondary, textTransform: 'uppercase', marginBottom: 6 }}>
                {rematchTossWinner} Decision:
              </ThemedText>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable
                  onPress={() => setRematchTossDecision('Bat')}
                  style={[{ flex: 1, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5, borderColor: theme.outlineVariant + '44', alignItems: 'center', backgroundColor: theme.surfaceLow }, rematchTossDecision === 'Bat' && { backgroundColor: '#10B98118', borderColor: '#10B981' }]}
                >
                  <ThemedText style={[{ fontSize: 12, fontFamily: 'Sora_700Bold', color: theme.text }, rematchTossDecision === 'Bat' && { color: '#10B981' }]}>
                    🏏 Bat First
                  </ThemedText>
                </Pressable>

                <Pressable
                  onPress={() => setRematchTossDecision('Bowl')}
                  style={[{ flex: 1, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5, borderColor: theme.outlineVariant + '44', alignItems: 'center', backgroundColor: theme.surfaceLow }, rematchTossDecision === 'Bowl' && { backgroundColor: '#3B82F618', borderColor: '#3B82F6' }]}
                >
                  <ThemedText style={[{ fontSize: 12, fontFamily: 'Sora_700Bold', color: theme.text }, rematchTossDecision === 'Bowl' && { color: '#3B82F6' }]}>
                    ⚾ Bowl First
                  </ThemedText>
                </Pressable>
              </View>
            </View>

            {/* Confirm Rematch Action */}
            <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
              <Pressable
                onPress={() => setShowRematchTossModal(false)}
                style={({ pressed }) => [{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: theme.surfaceLow, borderWidth: 1, borderColor: theme.outlineVariant + '44', alignItems: 'center' }, pressed && { opacity: 0.8 }]}
              >
                <ThemedText style={{ fontSize: 12.5, fontFamily: 'Sora_700Bold', color: theme.textSecondary }}>
                  Cancel
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={confirmRematchToss}
                style={({ pressed }) => [{ flex: 2, paddingVertical: 12, borderRadius: 10, backgroundColor: theme.primary, alignItems: 'center' }, pressed && { opacity: 0.85 }]}
              >
                <ThemedText style={{ fontSize: 12.5, fontFamily: 'Sora_700Bold', color: '#ffffff' }}>
                  🚀 Start Rematch
                </ThemedText>
              </Pressable>
            </View>

          </View>
        </View>
      </Modal>

      {/* ⚙️ PRE-MATCH RULES VERIFICATION EDIT MODAL */}
      <Modal
        visible={showPreRulesModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPreRulesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', padding: 18, width: '92%', maxWidth: 420, borderRadius: 12 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name={isMatchUnderway ? "lock-closed" : "options"} size={20} color={isMatchUnderway ? "#EF4444" : theme.primary} />
                <ThemedText style={{ fontSize: 16, fontFamily: 'Sora_700Bold', color: theme.text }}>
                  {isMatchUnderway ? 'Match Rules (Locked 🔒)' : 'Pre-Match Rules Verification'}
                </ThemedText>
              </View>
              <Pressable onPress={() => setShowPreRulesModal(false)}>
                <Ionicons name="close" size={20} color={theme.text} />
              </Pressable>
            </View>

            {/* In Progress Lock Notice */}
            {isMatchUnderway && (
              <View style={{ backgroundColor: '#EF444415', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#EF444433', marginBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="lock-closed" size={18} color="#EF4444" />
                <View style={{ flex: 1 }}>
                  <ThemedText style={{ fontSize: 11.5, fontFamily: 'Sora_700Bold', color: '#EF4444' }}>
                    Match In Progress • Rules Locked 🔒
                  </ThemedText>
                  <ThemedText style={{ fontSize: 10, color: theme.textSecondary, marginTop: 1 }}>
                    Overs and scoring rules are fixed once the match has commenced.
                  </ThemedText>
                </View>
              </View>
            )}

            {/* Total Overs Option Selector + Custom Overs TextInput */}
            <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_700Bold', color: theme.textSecondary, textTransform: 'uppercase', marginBottom: 6 }}>
              TOTAL MATCH OVERS: {isMatchUnderway ? `(LOCKED AT ${currentTotalOvers} OVERS)` : ''}
            </ThemedText>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
              {['5', '7', '12', '20'].map(ov => (
                <Pressable
                  key={ov}
                  disabled={isMatchUnderway}
                  onPress={() => setEditTotalOversInput(ov)}
                  style={[{ paddingHorizontal: 11, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: theme.outlineVariant + '44', backgroundColor: theme.surfaceLow }, editTotalOversInput === ov && { backgroundColor: theme.primary, borderColor: theme.primary }, isMatchUnderway && { opacity: 0.6 }]}
                >
                  <ThemedText style={[{ fontSize: 11.5, fontFamily: 'Sora_700Bold', color: theme.text }, editTotalOversInput === ov && { color: '#ffffff' }]}>
                    {ov} Ov
                  </ThemedText>
                </Pressable>
              ))}

              {/* Custom Overs TextInput */}
              <View style={[{
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: theme.outlineVariant + '44',
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 5,
                backgroundColor: theme.surfaceLow,
                gap: 4,
                opacity: isMatchUnderway ? 0.6 : 1,
              }, editTotalOversInput !== '' && !['5', '7', '12', '20'].includes(editTotalOversInput) && {
                backgroundColor: theme.primary + '18',
                borderColor: theme.primary,
              }]}>
                <TextInput
                  value={editTotalOversInput}
                  editable={!isMatchUnderway}
                  onChangeText={(val) => {
                    const digits = val.replace(/[^0-9]/g, '').slice(0, 2);
                    if (!digits) {
                      setEditTotalOversInput('');
                      return;
                    }
                    const num = parseInt(digits, 10);
                    const capped = num > 50 ? '50' : String(num);
                    setEditTotalOversInput(capped);
                  }}
                  placeholder="Custom"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  maxLength={2}
                  style={[{
                    fontSize: 11.5,
                    fontFamily: 'Sora_700Bold',
                    color: theme.text,
                    padding: 0,
                    minWidth: 32,
                    textAlign: 'center',
                  }, Platform.OS === 'web' && ({ outlineStyle: 'none', outlineWidth: 0 } as any)]}
                />
                {editTotalOversInput && !isMatchUnderway ? (
                  <Pressable onPress={() => setEditTotalOversInput('')}>
                    <Ionicons name="close-circle" size={14} color={theme.textSecondary} />
                  </Pressable>
                ) : null}
              </View>
            </View>

            {/* Quick Scoring Rules Checkboxes */}
            <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_700Bold', color: theme.textSecondary, textTransform: 'uppercase', marginBottom: 6 }}>
              QUICK SCORING RULES (AUTO-RECORD EXTRAS):
            </ThemedText>
            <View style={{ gap: 8, marginBottom: 14 }}>
              <Pressable
                disabled={isMatchUnderway}
                onPress={() => setRuleAutoWide(!ruleAutoWide)}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: theme.outlineVariant + '33', backgroundColor: theme.surfaceLow, opacity: isMatchUnderway ? 0.65 : 1 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ backgroundColor: '#F59E0B20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                    <ThemedText style={{ fontSize: 9.5, fontFamily: 'Sora_700Bold', color: '#F59E0B' }}>WD</ThemedText>
                  </View>
                  <ThemedText style={{ fontSize: 11.5, fontFamily: 'Sora_600SemiBold', color: theme.text }}>
                    Wide Ball: +1 Run & Re-bowl (Auto)
                  </ThemedText>
                </View>
                <Ionicons name={ruleAutoWide ? "checkbox" : "square-outline"} size={20} color={ruleAutoWide ? theme.primary : theme.textSecondary} />
              </Pressable>

              <Pressable
                disabled={isMatchUnderway}
                onPress={() => setRuleAutoNoBall(!ruleAutoNoBall)}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: theme.outlineVariant + '33', backgroundColor: theme.surfaceLow, opacity: isMatchUnderway ? 0.65 : 1 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ backgroundColor: '#EF444420', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                    <ThemedText style={{ fontSize: 9.5, fontFamily: 'Sora_700Bold', color: '#EF4444' }}>NB</ThemedText>
                  </View>
                  <ThemedText style={{ fontSize: 11.5, fontFamily: 'Sora_600SemiBold', color: theme.text }}>
                    No Ball: +1 Run & Re-bowl (Auto)
                  </ThemedText>
                </View>
                <Ionicons name={ruleAutoNoBall ? "checkbox" : "square-outline"} size={20} color={ruleAutoNoBall ? theme.primary : theme.textSecondary} />
              </Pressable>

              <Pressable
                disabled={isMatchUnderway}
                onPress={() => setRuleAllowByes(!ruleAllowByes)}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: theme.outlineVariant + '33', backgroundColor: theme.surfaceLow, opacity: isMatchUnderway ? 0.65 : 1 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ backgroundColor: '#3B82F620', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                    <ThemedText style={{ fontSize: 9.5, fontFamily: 'Sora_700Bold', color: '#3B82F6' }}>LB</ThemedText>
                  </View>
                  <ThemedText style={{ fontSize: 11.5, fontFamily: 'Sora_600SemiBold', color: theme.text }}>
                    Byes & Leg Byes: Count runs, legal ball
                  </ThemedText>
                </View>
                <Ionicons name={ruleAllowByes ? "checkbox" : "square-outline"} size={20} color={ruleAllowByes ? theme.primary : theme.textSecondary} />
              </Pressable>
            </View>

            {/* Save / Close Action Button */}
            {isMatchUnderway ? (
              <Pressable
                onPress={() => setShowPreRulesModal(false)}
                style={({ pressed }) => [{ width: '100%', paddingVertical: 12, borderRadius: 10, backgroundColor: theme.surfaceLow, borderWidth: 1, borderColor: theme.outlineVariant + '44', alignItems: 'center' }, pressed && { opacity: 0.85 }]}
              >
                <ThemedText style={{ fontSize: 13, fontFamily: 'Sora_700Bold', color: theme.text }}>
                  Close (Rules Locked)
                </ThemedText>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => {
                  const newOvers = editTotalOversInput || '20';
                  setCurrentTotalOvers(newOvers);
                  setShowPreRulesModal(false);
                  showToast('success', `Rules Verified: Match overs updated to ${newOvers} Overs.`);
                }}
                style={({ pressed }) => [{ width: '100%', paddingVertical: 12, borderRadius: 10, backgroundColor: theme.primary, alignItems: 'center' }, pressed && { opacity: 0.85 }]}
              >
                <ThemedText style={{ fontSize: 13, fontFamily: 'Sora_700Bold', color: '#ffffff' }}>
                  ✓ Save & Apply Rules
                </ThemedText>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>

      {/* 🔔 Animated Toast Banner (Success, Warning, Error, Info) */}
      {toastConfig.visible && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 14,
            left: '4%',
            right: '4%',
            maxWidth: 420,
            alignSelf: 'center',
            zIndex: 99999,
            transform: [{ translateY: toastAnimY }],
            opacity: toastOpacity,
          }}
        >
          <Pressable
            onPress={hideToast}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 14,
              paddingVertical: 11,
              borderRadius: 14,
              backgroundColor: theme.surfaceLowest,
              borderWidth: 1.5,
              borderColor:
                toastConfig.type === 'success'
                  ? '#10B981'
                  : toastConfig.type === 'warning'
                    ? '#F59E0B'
                    : toastConfig.type === 'error'
                      ? '#EF4444'
                      : theme.primary,
              boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.18)',
              elevation: 8,
              gap: 10,
            }}
          >
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor:
                  toastConfig.type === 'success'
                    ? '#10B98120'
                    : toastConfig.type === 'warning'
                      ? '#F59E0B20'
                      : toastConfig.type === 'error'
                        ? '#EF444420'
                        : theme.primary + '20',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons
                name={
                  toastConfig.type === 'success'
                    ? 'checkmark-circle'
                    : toastConfig.type === 'warning'
                      ? 'warning'
                      : toastConfig.type === 'error'
                        ? 'alert-circle'
                        : 'information-circle'
                }
                size={18}
                color={
                  toastConfig.type === 'success'
                    ? '#10B981'
                    : toastConfig.type === 'warning'
                      ? '#F59E0B'
                      : toastConfig.type === 'error'
                        ? '#EF4444'
                        : theme.primary
                }
              />
            </View>
            <ThemedText
              style={{
                flex: 1,
                fontSize: 12.5,
                fontFamily: 'Sora_700Bold',
                color: theme.text,
              }}
              numberOfLines={2}
            >
              {toastConfig.message}
            </ThemedText>
            <Ionicons name="close" size={16} color={theme.textSecondary} />
          </Pressable>
        </Animated.View>
      )}

      {/* 🏆 END MATCH POPUP MODAL */}
      <Modal
        visible={showEndMatchModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEndMatchModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{
            backgroundColor: theme.surfaceLowest,
            borderRadius: 12,
            padding: 24,
            width: '100%',
            maxWidth: 440,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.25,
            shadowRadius: 20,
            elevation: 25,
            borderWidth: 1,
            borderColor: theme.outlineVariant + '33',
          }}>
            {/* Trophy Icon Circle */}
            <View style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: '#FEF3C7',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 14,
              borderWidth: 2,
              borderColor: '#F59E0B',
            }}>
              <ThemedText style={{ fontSize: 30 }}>🏆</ThemedText>
            </View>

            {/* Title */}
            <ThemedText style={{ fontSize: 19, fontFamily: 'Sora_800ExtraBold', color: theme.text, textAlign: 'center' }}>
              Match Concluded!
            </ThemedText>

            {/* Score Summary Box */}
            <View style={{ backgroundColor: theme.surfaceLow, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, marginVertical: 12, alignItems: 'center', width: '100%' }}>
              <ThemedText style={{ fontSize: 13.5, fontFamily: 'Sora_700Bold', color: theme.text }}>
                {battingTeamName}: {runs}/{wickets} ({overs}.{ballsInCurrentOver} Ov)
              </ThemedText>
              <ThemedText style={{ fontSize: 11, color: theme.textSecondary, marginTop: 2 }}>
                Run Rate: {runRate.toFixed(2)} · Extras: {totalExtrasCount}
              </ThemedText>
            </View>

            {/* Question */}
            <ThemedText style={{ fontSize: 13.5, fontFamily: 'Sora_600SemiBold', color: theme.textSecondary, textAlign: 'center', marginBottom: 18 }}>
              Would you like to start a new match with coin toss?
            </ThemedText>

            {/* Button 1: New Match Flip Coin Toss */}
            <Pressable
              onPress={() => {
                setShowEndMatchModal(false);
                setCoinTossVisible(true);
              }}
              style={({ pressed }) => [{
                width: '100%',
                backgroundColor: theme.primary,
                paddingVertical: 13,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
                marginBottom: 10,
                opacity: pressed ? 0.85 : 1,
              }]}
            >
              <ThemedText style={{ fontSize: 16 }}>🪙</ThemedText>
              <ThemedText style={{ color: '#ffffff', fontSize: 13.5, fontFamily: 'Sora_800ExtraBold' }}>
                New Match (Flip Coin Toss)
              </ThemedText>
            </Pressable>

            {/* Button 2: No (back to Turf Book Page) */}
            <Pressable
              onPress={() => {
                setShowEndMatchModal(false);
                router.replace('/(tabs)');
              }}
              style={({ pressed }) => [{
                width: '100%',
                backgroundColor: theme.surfaceLow,
                borderWidth: 1.5,
                borderColor: theme.outlineVariant + '55',
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
                opacity: pressed ? 0.85 : 1,
              }]}
            >
              <ThemedText style={{ color: theme.text, fontSize: 13, fontFamily: 'Sora_700Bold' }}>
                No (Back to Turf Book Page)
              </ThemedText>
            </Pressable>

            {/* Quick Export PDF Shortcut */}
            <Pressable
              onPress={handleExportPDF}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingVertical: 4,
              }}
            >
              <Ionicons name="download-outline" size={15} color="#059669" />
              <ThemedText style={{ color: '#059669', fontSize: 12, fontFamily: 'Sora_700Bold' }}>
                Download Score Sheet PDF
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Coin Toss Modal when user chooses New Match Flip Coin Toss */}
      <CoinTossModal
        visible={coinTossVisible}
        onClose={() => setCoinTossVisible(false)}
      />
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
  teamTitle: {
    color: '#ffffff',
    fontFamily: 'Sora_800ExtraBold',
    fontSize: 22,
    lineHeight: 28,
  },
  bannerRightCol: {
    alignItems: 'flex-end',
  },
  scoreText: {
    color: '#5D68E8',
    fontFamily: 'Sora_800ExtraBold',
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 21, 30, 0.6)',
    width: '100%',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
  },
  modalContent: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    maxHeight: '88%',
    width: '94%',
    maxWidth: 480,
    alignSelf: 'center',
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
    fontFamily: 'Sora_500Medium',
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
    fontFamily: 'Sora_500Medium',
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
    fontFamily: 'Sora_700Bold',
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
    fontFamily: 'Sora_600SemiBold',
  },
});
