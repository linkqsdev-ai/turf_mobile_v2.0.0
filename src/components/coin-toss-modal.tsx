import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MAX_FONT_SCALE } from '@/components/themed-text';
import {
  StyleSheet,
  View,
  Pressable,
  Animated,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
let Audio: any = null;
try {
  Audio = require('expo-av').Audio;
} catch (e) {
  console.warn('expo-av is not available in this environment');
}
import { ThemedText } from './themed-text';
import { FavouriteTeamIcon } from './favourite-team-icon';
import { useTheme } from '@/hooks/use-theme';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { SPORTS_LIST } from '@/constants/sports';
import { LinearGradient } from 'expo-linear-gradient';
import { useMatchStore } from '@/store/app-store';
import { InlineNotice, type Notice } from '@/components/ui/inline-notice';
import { favouriteTeamDefaults, isSameTeam } from '@/lib/favourite-teams';
import { formatPhoneNumber, getPhoneValidationError } from '@/utils/phone-utils';
import { isTimeSlotPassed } from '@/utils/date-utils';
import { turfApi } from '@/services/turf-api';
import { MotionIllustration } from '@/components/motion-illustration';
import { SectionHeading } from '@/components/home/dashboard-widgets';

const MASCOTS_LIST = [
  { name: 'lion', asset: require('@/assets/images/mascots/lion.png') },
  { name: 'warrior', asset: require('@/assets/images/mascots/warrior.png') },
  { name: 'wolf', asset: require('@/assets/images/mascots/wolf.png') },
  { name: 'eagle', asset: require('@/assets/images/mascots/eagle.png') },
  { name: 'panther', asset: require('@/assets/images/mascots/panther.png') },
  { name: 'shark', asset: require('@/assets/images/mascots/shark.png') },
  { name: 'bear', asset: require('@/assets/images/mascots/bear.png') },
  { name: 'rhino', asset: require('@/assets/images/mascots/rhino.png') },
  { name: 'dragon', asset: require('@/assets/images/mascots/dragon.png') },
  { name: 'cobra', asset: require('@/assets/images/mascots/cobra.png') },
  { name: 'tiger', asset: require('@/assets/images/mascots/tiger.png') },
  { name: 'leopard', asset: require('@/assets/images/mascots/leopard.png') },
  { name: 'gorilla', asset: require('@/assets/images/mascots/gorilla.png') },
  { name: 'falcon', asset: require('@/assets/images/mascots/falcon.png') },
  { name: 'stallion', asset: require('@/assets/images/mascots/stallion.png') },
  { name: 'bull', asset: require('@/assets/images/mascots/bull.png') },
  { name: 'crocodile', asset: require('@/assets/images/mascots/crocodile.png') },
];

const getMascotAsset = (name: string) => {
  const found = MASCOTS_LIST.find(m => m.name === name);
  return found ? found.asset : require('@/assets/images/mascots/lion.png');
};

const generateShortName = (name: string): string => {
  if (!name || !name.trim()) return '';
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase();
};

interface CoinTossModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CoinTossModal({ visible, onClose }: CoinTossModalProps) {
  const theme = useTheme();
  const router = useRouter();
  const { teams, addTeam } = useMatchStore();
  const { profile } = useUserProfile();
  // Feedback banner shown inside the popup — a global toast would render
  // behind this modal's window and never be seen.
  const [notice, setNotice] = useState<Notice | null>(null);
  const noticeSeq = useRef(0);
  const notify = useCallback((tone: Notice['tone'], title: string, message?: string) => {
    noticeSeq.current += 1;
    setNotice({ tone, title, message, key: noticeSeq.current });
  }, []);
  const clearNotice = useCallback(() => setNotice(null), []);

  // Setup states
  const [selectedSport, setSelectedSport] = useState('Cricket');
  // Left blank so the favourite-team effect below can seed them on open;
  // these used to be hardcoded placeholder names ("Lions FC" / "Titans Utd").
  const [teamAName, setTeamAName] = useState('');
  const [teamBName, setTeamBName] = useState('');
  const [tossCaller, setTossCaller] = useState<'A' | 'B'>('A');
  const [tossCall, setTossCall] = useState<'HEADS' | 'TAILS'>('HEADS');
  const [tossDecision, setTossDecision] = useState<string>('');
  const [dropdownAOpen, setDropdownAOpen] = useState(false);
  const [dropdownBOpen, setDropdownBOpen] = useState(false);
  const [teamAError, setTeamAError] = useState('');
  const [teamBError, setTeamBError] = useState('');

  // Rules & Overs
  const [totalOversInput, setTotalOversInput] = useState('5');
  const [isCustomOversSelected, setIsCustomOversSelected] = useState(false);
  const [customOversValue, setCustomOversValue] = useState('');
  const [autoWideRule, setAutoWideRule] = useState(true);
  const [autoNoBallRule, setAutoNoBallRule] = useState(true);
  const [allowByesRule, setAllowByesRule] = useState(true);
  const [allowWicketRunsRule, setAllowWicketRunsRule] = useState(true);

  // New Team Modal states
  const [isNewTeamModalOpen, setIsNewTeamModalOpen] = useState(false);
  const [addingForTeam, setAddingForTeam] = useState<'A' | 'B' | null>(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [newShortName, setNewShortName] = useState('');
  const [newPhone, setNewPhone] = useState(profile?.phone ? formatPhoneNumber(profile.phone) : '');
  const [newMascot, setNewMascot] = useState('lion');
  const [newIsFavourite, setNewIsFavourite] = useState(false);
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isShortFocused, setIsShortFocused] = useState(false);
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);

  const openNewTeamModal = (slot: 'A' | 'B') => {
    setAddingForTeam(slot);
    setNewTeamName('');
    setNewShortName('');
    const autoPhone = profile?.phone ? formatPhoneNumber(profile.phone) : '';
    setNewPhone(autoPhone);
    setNewIsFavourite(false);
    setIsNewTeamModalOpen(true);
    setDropdownAOpen(false);
    setDropdownBOpen(false);
  };

  const cleanedNewPhone = newPhone.replace(/[^0-9]/g, '');
  const favTeamsForNewPhone = teams.filter(t => {
    if (!t.isFavourite) return false;
    const p = (t.phone || '').replace(/[^0-9]/g, '');
    return p === cleanedNewPhone && p.length > 0;
  });
  const isFavLimitReached = cleanedNewPhone.length >= 7 && favTeamsForNewPhone.length >= 2;

  useEffect(() => {
    if (isFavLimitReached && newIsFavourite) {
      setNewIsFavourite(false);
    }
  }, [isFavLimitReached, newIsFavourite]);

  const handleCreateTeamFromModal = () => {
    if (!newTeamName.trim() || !newShortName.trim()) {
      notify('error', 'Missing Fields', 'Please enter team name and short name.');
      return;
    }

    const phoneErr = getPhoneValidationError(newPhone, true);
    if (phoneErr) {
      notify('error', 'Invalid Mobile Number', phoneErr);
      return;
    }

    if (newIsFavourite && isFavLimitReached) {
      Alert.alert('Favourite Limit Reached', 'Per user allowed to create up to 2 teams as Favourite Team.');
      return;
    }

    const created = addTeam({
      name: newTeamName.trim(),
      sport: selectedSport,
      mascot: newMascot,
      phone: newPhone.trim(),
      players: [
        {
          id: `player-${Date.now()}`,
          name: profile.name || 'Captain',
          skillLevel: profile.skillLevel || 'Intermediate',
        } as any,
      ],
      isFavourite: newIsFavourite && !isFavLimitReached,
    });

    if (addingForTeam === 'A') {
      setTeamAName(created.name);
      setTeamAError('');
    } else if (addingForTeam === 'B') {
      setTeamBName(created.name);
      setTeamBError('');
    }

    setNewTeamName('');
    setNewShortName('');
    setNewPhone('');
    setNewMascot('lion');
    setNewIsFavourite(false);
    setIsNewTeamModalOpen(false);
    setAddingForTeam(null);
    setResult(null);
    setTossDecision('');
  };

  const getCurrentFormattedTiming = () => {
    const now = new Date();
    const day = now.getDate();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[now.getMonth()];
    const year = now.getFullYear();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
  };

  // Match Timing, Type, & Ground states
  const [selectedTiming, setSelectedTiming] = useState(getCurrentFormattedTiming());
  const [selectedTurfType, setSelectedTurfType] = useState<'Turf' | 'Ground' | ''>('Turf');
  const [turfName, setTurfName] = useState('Unais Turf');
  const [customGroundName, setCustomGroundName] = useState('');
  const [groundName, setGroundName] = useState('Unais Turf');
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [turfsList, setTurfsList] = useState<string[]>([]);
  const [showTurfDropdown, setShowTurfDropdown] = useState(false);

  const handleTurfTypeChange = (type: 'Turf' | 'Ground') => {
    setSelectedTurfType(type);
    setShowTurfDropdown(false);
    if (type === 'Turf') {
      const currentTurf = turfName || (turfsList[0] || 'Unais Turf');
      setTurfName(currentTurf);
      setGroundName(currentTurf);
    } else {
      setGroundName(customGroundName);
    }
  };

  // Close turf & team dropdowns on outside clicks
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handleOutsideClick = () => {
      setShowTurfDropdown(false);
      setDropdownAOpen(false);
      setDropdownBOpen(false);
    };
    if (showTurfDropdown || dropdownAOpen || dropdownBOpen) {
      const timer = setTimeout(() => {
        document.addEventListener('click', handleOutsideClick);
      }, 50);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('click', handleOutsideClick);
      };
    }
  }, [showTurfDropdown, dropdownAOpen, dropdownBOpen]);

  React.useEffect(() => {
    turfApi.listTurfs().then((res: any) => {
      const list = Array.isArray(res) ? res : res?.turfs || [];
      const names = list.map((t: any) => t.name).filter(Boolean);
      const standard = [
        'Unais Turf',
        'Ravi Turf',
        'Emerald Green Arena',
        'Skyline Arena Elite',
        'The Grid Sports Complex',
        "Lord's View Pavillion",
      ];
      setTurfsList(Array.from(new Set([...names, ...standard])));
    }).catch(() => {
      setTurfsList([
        'Unais Turf',
        'Ravi Turf',
        'Emerald Green Arena',
        'Skyline Arena Elite',
        'The Grid Sports Complex',
      ]);
    });
  }, []);

  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [tempTime, setTempTime] = useState(() => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  });

  const [result, setResult] = useState<'HEADS' | 'TAILS' | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  
  const [displaySide, setDisplaySide] = useState<'HEADS' | 'TAILS'>('HEADS');
  const [spinAnim] = useState(() => new Animated.Value(0));
  const tossScrollRef = useRef<ScrollView>(null);

  const autoScrollToBottom = (delay = 150) => {
    setTimeout(() => {
      tossScrollRef.current?.scrollToEnd({ animated: true });
    }, delay);
  };

  // The team taken by the other slot stays listed rather than silently
  // vanishing — tapping it raises an "already selected" notification instead.
  const suggestionsA = teams
    .filter(t => (!t.sport || t.sport.toLowerCase() === selectedSport.toLowerCase()) && t.name.toLowerCase().includes(teamAName.toLowerCase()))
    .sort((a, b) => {
      if (a.isFavourite && !b.isFavourite) return -1;
      if (!a.isFavourite && b.isFavourite) return 1;
      return a.name.localeCompare(b.name);
    });

  const suggestionsB = teams
    .filter(t => (!t.sport || t.sport.toLowerCase() === selectedSport.toLowerCase()) && t.name.toLowerCase().includes(teamBName.toLowerCase()))
    .sort((a, b) => {
      if (a.isFavourite && !b.isFavourite) return -1;
      if (!a.isFavourite && b.isFavourite) return 1;
      return a.name.localeCompare(b.name);
    });

  // ── Favourite team defaults ───────────────────────────────────────────────
  // Re-runs each time the popup opens so it always lands on the player's
  // current favourites, but never overwrites a slot they've already filled.
  useEffect(() => {
    if (!visible) {
      setNotice(null);
      return;
    }
    if (teams.length === 0) return;

    const { teamA, teamB } = favouriteTeamDefaults(teams, selectedSport);
    if (!teamA) return;

    const slotAEmpty = !teamAName.trim();
    const slotBEmpty = !teamBName.trim();
    if (slotAEmpty) setTeamAName(teamA);
    if (teamB && slotBEmpty && !isSameTeam(teamA, teamB)) setTeamBName(teamB);

    if (slotAEmpty) {
      notify('success', 'Favourite team ready', `${teamA} is preselected as Team A.`);
    } else if (isSameTeam(teamAName, teamA)) {
      notify('info', 'Already selected', `${teamA} is already your Team A.`);
    }
    // Intentionally keyed on `visible` only: this is an on-open default, not a
    // live binding that should fight the user as they edit the slots.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  /**
   * Single entry point for picking a team from a dropdown. Notifies instead of
   * silently no-oping when the tapped team is already in play.
   */
  const selectTeamForSlot = (slot: 'A' | 'B', name: string) => {
    const current = slot === 'A' ? teamAName : teamBName;
    const other = slot === 'A' ? teamBName : teamAName;

    if (slot === 'A') setDropdownAOpen(false);
    else setDropdownBOpen(false);

    if (isSameTeam(current, name)) {
      notify('info', 'Already selected', `${name} is already your Team ${slot}.`);
      return;
    }
    if (isSameTeam(other, name)) {
      notify(
        'warning',
        'Already selected',
        `${name} is playing as Team ${slot === 'A' ? 'B' : 'A'}. Pick a different side.`,
      );
      return;
    }

    if (slot === 'A') setTeamAName(name);
    else setTeamBName(name);
    setTeamAError('');
    setTeamBError('');
    setResult(null);
    setTossDecision('');
  };

  const handleAddNewTeam = (name: string, field: 'A' | 'B') => {
    const cleanName = name.trim();
    if (!cleanName) return;
    const newTeam = addTeam({
      name: cleanName,
      sport: selectedSport.toLowerCase(),
      players: [],
    });
    if (field === 'A') {
      setTeamAName(newTeam.name);
      setTeamAError('');
      setDropdownAOpen(false);
    } else {
      setTeamBName(newTeam.name);
      setTeamBError('');
      setDropdownBOpen(false);
    }
  };

  const playCoinSound = async () => {
    try {
      if (!Audio || !Audio.Sound) {
        console.log('Audio playing skipped (expo-av not available)');
        return;
      }
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/coin.mp3')
      );
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.error('Failed to play coin flip sound', error);
    }
  };

  const isTeamAValid = Boolean(teamAName && teamAName.trim().length > 0);
  const isTeamBValid = Boolean(teamBName && teamBName.trim().length > 0);
  const areTeamsValid = isTeamAValid && isTeamBValid && teamAName.trim().toLowerCase() !== teamBName.trim().toLowerCase();
  const isTossDone = Boolean(result);
  const isRolePicked = Boolean(tossDecision && tossDecision.trim().length > 0);
  const canStartMatch = areTeamsValid && isTossDone && isRolePicked;

  const winner = result === tossCall ? tossCaller : (tossCaller === 'A' ? 'B' : 'A');
  const tossWinnerName = winner === 'A' ? (teamAName.trim() || 'Team A') : (teamBName.trim() || 'Team B');

  const handleToss = () => {
    if (isFlipping) return;
    if (!areTeamsValid) {
      if (!teamAName.trim()) setTeamAError('Team A name required');
      if (!teamBName.trim()) setTeamBError('Team B name required');
      if (teamAName.trim() && teamBName.trim() && teamAName.trim().toLowerCase() === teamBName.trim().toLowerCase()) {
        setTeamBError('Teams must be different');
      }
      Alert.alert('Validation Required', 'Please enter valid team names for both Team A and Team B before tossing the coin.');
      return;
    }
    setTeamAError('');
    setTeamBError('');

    playCoinSound();

    setIsFlipping(true);
    setResult(null);
    setTossDecision('');
    spinAnim.setValue(0);

    let currentSide = displaySide;
    const intervalId = setInterval(() => {
      currentSide = currentSide === 'HEADS' ? 'TAILS' : 'HEADS';
      setDisplaySide(currentSide);
    }, 70);

    const tossResult = Math.random() < 0.5 ? 'HEADS' : 'TAILS';
    const targetValue = tossResult === 'HEADS' ? 8 : 9;

    Animated.timing(spinAnim, {
      toValue: targetValue,
      duration: 1200,
      useNativeDriver: true,
    }).start(() => {
      clearInterval(intervalId);
      setIsFlipping(false);
      setResult(tossResult);
      setDisplaySide(tossResult);
      // The result and decision pills sit beside the coin in the hero card —
      // bring it back into view rather than scrolling past it.
      setTimeout(() => {
        tossScrollRef.current?.scrollTo({ y: 0, animated: true });
      }, 180);
    });
  };

  const handleClose = () => {
    setResult(null);
    setIsFlipping(false);
    setTossDecision('');
    setDropdownAOpen(false);
    setDropdownBOpen(false);
    setTeamAError('');
    setTeamBError('');
    spinAnim.setValue(0);
    onClose();
  };

  const handleStartMatch = () => {
    if (!canStartMatch) {
      if (!areTeamsValid) {
        Alert.alert('Error', 'Please enter valid team names for both slots.');
      } else if (!isRolePicked) {
        Alert.alert('Role Required', 'Please pick Batting or Bowling role above before starting the match.');
      }
      return;
    }

    router.push({
      pathname: '/scoring',
      params: {
        sport: selectedSport.toLowerCase(),
        teamA: teamAName.trim(),
        teamB: teamBName.trim(),
        tossWinner: tossWinnerName.trim(),
        decision: tossDecision,
        totalOvers: totalOversInput.trim() || '5',
        autoWide: autoWideRule ? '1' : '0',
        autoNoBall: autoNoBallRule ? '1' : '0',
        allowByes: allowByesRule ? '1' : '0',
        timing: selectedTiming,
        turfType: selectedTurfType,
        turfName: groundName.trim() || (selectedTurfType === 'Turf' ? "Lord's View Pavillion" : "Marina Cricket Ground"),
      },
    });
    handleClose();
  };

  const spin = spinAnim.interpolate({
    inputRange: [0, 8, 9],
    outputRange: ['0deg', '2880deg', '3060deg'],
  });

  const lift = spinAnim.interpolate({
    inputRange: [0, 4.5, 8, 9],
    outputRange: [0, -50, 0, 0],
  });

  // Home-dashboard palette — the same accents the player dashboard tints with.
  const accent = '#F59E0B';
  const info = '#3B82F6';
  const success = '#10B981';
  const danger = '#ef4444';

  const setupSteps = [areTeamsValid, isTossDone, isRolePicked].filter(Boolean).length;
  const oversLabel = totalOversInput.trim() || '5';
  const matchedTeamA = teams.find(t => t.name.toLowerCase() === teamAName.trim().toLowerCase());
  const matchedTeamB = teams.find(t => t.name.toLowerCase() === teamBName.trim().toLowerCase());

  const heroTone = canStartMatch ? success : theme.primary;
  const heroBadge = canStartMatch
    ? 'READY TO START'
    : isTossDone
      ? 'TOSS DONE'
      : areTeamsValid
        ? 'TEAMS SET'
        : 'KICKOFF TOSS';
  const heroTitle = canStartMatch
    ? 'All set to start'
    : isTossDone
      ? `${tossWinnerName} won the toss`
      : areTeamsValid
        ? 'Call it and flip the coin'
        : 'Ready for a quick game?';
  const heroSub = canStartMatch
    ? `${tossWinnerName} · ${tossDecision} first · ${oversLabel} overs`
    : isTossDone
      ? 'Choose what they do first.'
      : areTeamsValid
        ? `${teamAName.trim()} vs ${teamBName.trim()}`
        : 'Pick two teams, then tap the coin.';

  const decisionOptions = selectedSport.toLowerCase() === 'cricket'
    ? [
        { value: 'Bat', label: '🏏 Batting' },
        { value: 'Bowl', label: '🥎 Bowling' },
      ]
    : [
        { value: 'Kickoff', label: '⚽ Serve / Kickoff' },
        { value: 'Receive', label: '🛡️ Receive / Side' },
      ];

  const scoringRules = [
    { key: 'wide', on: autoWideRule, toggle: () => setAutoWideRule(!autoWideRule), label: 'Wide Ball = 1 Extra Run (Supports Wide + 1, 2 runs)' },
    { key: 'noball', on: autoNoBallRule, toggle: () => setAutoNoBallRule(!autoNoBallRule), label: 'No Ball = 1 Extra Run & Free Hit' },
    { key: 'byes', on: allowByesRule, toggle: () => setAllowByesRule(!allowByesRule), label: 'Byes & Leg Byes Allowed' },
    { key: 'wicketRuns', on: allowWicketRunsRule, toggle: () => setAllowWicketRunsRule(!allowWicketRunsRule), label: 'Wicket + Runs Allowed (Run Outs: W+1, W+2)' },
  ];

  const cardSurface = {
    backgroundColor: theme.surfaceLowest,
    borderColor: theme.outlineVariant + '33',
  };
  const webNoOutline = Platform.select({ web: { outlineStyle: 'none', outlineWidth: 0 } as any });

  const renderLabel = (label: string, opts?: { required?: boolean }) => (
    <View style={styles.labelRow}>
      <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>{label}</ThemedText>
      {opts?.required ? (
        <ThemedText style={[styles.required, { color: danger }]}>*</ThemedText>
      ) : null}
    </View>
  );

  const renderTeamSlot = (slot: 'A' | 'B') => {
    const isA = slot === 'A';
    const name = isA ? teamAName : teamBName;
    const otherName = isA ? teamBName : teamAName;
    const error = isA ? teamAError : teamBError;
    const open = isA ? dropdownAOpen : dropdownBOpen;
    const options = isA ? suggestionsA : suggestionsB;
    const matched = isA ? matchedTeamA : matchedTeamB;
    const setName = isA ? setTeamAName : setTeamBName;
    const setError = isA ? setTeamAError : setTeamBError;
    const setOtherError = isA ? setTeamBError : setTeamAError;
    const setOpen = isA ? setDropdownAOpen : setDropdownBOpen;
    const setOtherOpen = isA ? setDropdownBOpen : setDropdownAOpen;

    return (
      <View style={[styles.teamSlot, { zIndex: open ? 100 : 1 }]}>
        <Pressable
          onPress={() => openNewTeamModal(slot)}
          style={[styles.crest, { backgroundColor: theme.primary + '14', borderColor: theme.primary + '40' }]}
        >
          {matched?.mascot ? (
            <Image source={getMascotAsset(matched.mascot)} style={styles.crestMascot} contentFit="contain" />
          ) : (
            <ThemedText style={[styles.crestText, { color: theme.primary }]}>
              {generateShortName(name) || `T${slot}`}
            </ThemedText>
          )}
          <View style={[styles.crestAdd, { backgroundColor: theme.primary, borderColor: theme.surfaceLowest }]}>
            <Ionicons name="add" size={9} color="#ffffff" />
          </View>
        </Pressable>
        <Pressable onPress={() => openNewTeamModal(slot)} hitSlop={6}>
          <ThemedText style={[styles.newTeamLink, { color: theme.primary }]}>+ New team</ThemedText>
        </Pressable>

        <View style={styles.teamInputWrap}>
          <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
            style={[
              styles.teamInput,
              {
                backgroundColor: theme.surfaceLowest,
                color: theme.text,
                borderColor: error ? danger : !name.trim() ? theme.outlineVariant + '99' : theme.primary,
              },
              webNoOutline,
            ]}
            value={name}
            placeholder={`Team ${slot} name *`}
            placeholderTextColor="#94a3b8"
            onChangeText={(val) => {
              setName(val);
              if (val.trim()) {
                setError('');
                if (otherName.trim() && val.trim().toLowerCase() === otherName.trim().toLowerCase()) {
                  setError('Teams must be different');
                } else {
                  setOtherError('');
                }
              }
              setOpen(true);
              setOtherOpen(false);
              setResult(null);
              setTossDecision('');
            }}
            onFocus={() => {
              setOpen(true);
              setOtherOpen(false);
            }}
          />
          {error !== '' && (
            <ThemedText style={[styles.teamError, { color: danger }]}>{error}</ThemedText>
          )}

          {open && (
            // Narrower than a full panel — the anchor input sits in a compact
            // three-column row, so a wide menu would bury the coin.
            <View
              style={[
                styles.teamMenu,
                isA ? { left: 0 } : { right: 0 },
                { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '40' },
              ]}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.menuItem,
                  {
                    paddingVertical: 8,
                    borderBottomColor: theme.outlineVariant + '26',
                    backgroundColor: pressed ? theme.primary + '1A' : theme.primary + '0A',
                  },
                ]}
                onPress={() => openNewTeamModal(slot)}
              >
                <Ionicons name="add-circle" size={14} color={theme.primary} />
                <ThemedText style={[styles.menuAddText, { color: theme.primary }]}>Add new team</ThemedText>
              </Pressable>

              <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                {options.map((team) => (
                  <Pressable
                    key={team.id}
                    style={({ pressed }) => [
                      styles.menuItem,
                      {
                        borderBottomColor: theme.outlineVariant + '1F',
                        backgroundColor: team.isFavourite
                          ? pressed ? accent + '2E' : accent + '0F'
                          : pressed ? theme.surfaceLow : 'transparent',
                      },
                    ]}
                    onPress={() => selectTeamForSlot(slot, team.name)}
                  >
                    {team.mascot ? (
                      <Image source={getMascotAsset(team.mascot)} style={styles.menuMascot} contentFit="contain" />
                    ) : (
                      <Ionicons name="shield" size={12} color={theme.primary} />
                    )}
                    <ThemedText style={[styles.menuItemText, { color: theme.text }]} numberOfLines={1}>
                      {team.name}
                    </ThemedText>
                    {team.isFavourite && (
                      <View style={[styles.favPill, { backgroundColor: accent + '22' }]}>
                        <FavouriteTeamIcon size={9} />
                        <ThemedText style={[styles.favPillText, { color: '#d97706' }]}>FAV</ThemedText>
                      </View>
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <>
      <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />

          <View style={[styles.modalBox, { backgroundColor: theme.background, borderColor: theme.outlineVariant + '33' }]}>
            {/* Popup title bar */}
            <View style={styles.sheetHead}>
              <View style={[styles.sheetIcon, { backgroundColor: theme.primary + '1A' }]}>
                <FontAwesome5 name="coins" size={13} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.sheetTitle, { color: theme.text }]}>Kickoff Coin Toss</ThemedText>
                <ThemedText style={[styles.sheetSub, { color: theme.textSecondary }]} numberOfLines={1}>
                  Configure and start match live scoring
                </ThemedText>
              </View>
              <Pressable
                onPress={handleClose}
                hitSlop={8}
                style={[styles.sheetClose, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '40' }]}
              >
                <Ionicons name="close" size={16} color={theme.textSecondary} />
              </Pressable>
            </View>

            <ScrollView
              ref={tossScrollRef}
              showsVerticalScrollIndicator={false}
              style={styles.sheetScroll}
              contentContainerStyle={styles.scrollContent}
              bounces={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Transparent Overlay for outside click closing on native */}
              {(showTurfDropdown || dropdownAOpen || dropdownBOpen) && (
                <Pressable
                  style={[StyleSheet.absoluteFill, { zIndex: 40 }]}
                  onPress={() => {
                    setShowTurfDropdown(false);
                    setDropdownAOpen(false);
                    setDropdownBOpen(false);
                  }}
                />
              )}

              {/* ── MATCH HERO: status, teams with the coin between them, toss call ──
                  Everything needed to toss lives in this first card so the coin is
                  on screen without scrolling. */}
              <View style={[styles.heroCard, cardSurface, Shadows.level2, { zIndex: (dropdownAOpen || dropdownBOpen) ? 100 : 1 }]}>
                {/* The wash carries its own radius so the card can stay
                    overflow-visible for the team dropdowns. */}
                <LinearGradient
                  colors={[theme.primary + '26', info + '10', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[StyleSheet.absoluteFill, { borderRadius: HERO_RADIUS }]}
                  pointerEvents="none"
                />

                <View style={styles.heroHead}>
                  <View style={styles.heroText}>
                    <View style={[styles.heroBadge, { backgroundColor: heroTone + '22' }]}>
                      <ThemedText style={[styles.heroBadgeText, { color: heroTone }]}>{heroBadge}</ThemedText>
                    </View>
                    <ThemedText style={[styles.heroTitle, { color: theme.text }]} numberOfLines={1}>
                      {heroTitle}
                    </ThemedText>
                    <ThemedText style={[styles.heroSub, { color: theme.textSecondary }]} numberOfLines={1}>
                      {heroSub}
                    </ThemedText>
                    <View style={styles.progressRow}>
                      <View style={[styles.progressTrack, { backgroundColor: theme.outlineVariant + '40' }]}>
                        <View style={[styles.progressFill, { flex: setupSteps, backgroundColor: heroTone }]} />
                        <View style={{ flex: 3 - setupSteps }} />
                      </View>
                      <ThemedText style={[styles.progressText, { color: theme.textSecondary }]}>
                        {setupSteps}/3
                      </ThemedText>
                    </View>
                  </View>
                  <MotionIllustration
                    scenario="matches"
                    size={58}
                    glow={[theme.primary + '33', theme.primary + '00']}
                    accents={[
                      { name: 'flash', color: theme.primary },
                      { name: 'trophy', color: accent },
                      { name: 'star', color: info },
                    ]}
                    accessibilityLabel="Coin toss illustration"
                  />
                </View>

                <View style={styles.vsRow}>
                  {renderTeamSlot('A')}

                  <View style={styles.coinCol}>
                    <ThemedText style={[styles.vsText, { color: theme.textSecondary }]}>VS</ThemedText>
                    <Pressable onPress={handleToss} disabled={isFlipping}>
                      <Animated.View
                        style={[
                          styles.coin,
                          { transform: [{ translateY: lift }, { rotateY: spin }] },
                        ]}
                      >
                        <LinearGradient colors={['#FFE259', '#FACC15', '#FFE259']} style={styles.coinFace}>
                          <ThemedText style={styles.coinSymbol}>{displaySide === 'HEADS' ? 'H' : 'T'}</ThemedText>
                        </LinearGradient>
                      </Animated.View>
                    </Pressable>
                    <ThemedText style={[styles.coinHint, { color: isFlipping ? accent : theme.textSecondary }]}>
                      {isFlipping ? 'Flipping…' : result ? (result === 'HEADS' ? 'Heads' : 'Tails') : 'Tap to toss'}
                    </ThemedText>
                  </View>

                  {renderTeamSlot('B')}
                </View>

                <View style={[styles.divider, { backgroundColor: theme.outlineVariant + '33' }]} />

                <View style={styles.tossConfigRow}>
                  <View style={styles.tossConfigCol}>
                    {renderLabel('Caller')}
                    <View style={styles.segmentRow}>
                      {(['A', 'B'] as const).map((side) => {
                        const active = tossCaller === side;
                        return (
                          <Pressable
                            key={side}
                            onPress={() => setTossCaller(side)}
                            style={({ pressed }) => [
                              styles.togglePill,
                              active
                                ? { backgroundColor: theme.primary, borderColor: theme.primary }
                                : { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '55' },
                              { opacity: pressed ? 0.85 : 1 },
                            ]}
                          >
                            <ThemedText
                              style={[styles.togglePillText, { color: active ? '#ffffff' : theme.text }]}
                              numberOfLines={1}
                            >
                              {side === 'A' ? (teamAName.trim() || 'Team A') : (teamBName.trim() || 'Team B')}
                            </ThemedText>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  <View style={styles.tossConfigCol}>
                    {renderLabel('Call')}
                    <View style={styles.segmentRow}>
                      {(['HEADS', 'TAILS'] as const).map((side) => {
                        const active = tossCall === side;
                        return (
                          <Pressable
                            key={side}
                            onPress={() => setTossCall(side)}
                            style={({ pressed }) => [
                              styles.togglePill,
                              active
                                ? { backgroundColor: theme.primary, borderColor: theme.primary }
                                : { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '55' },
                              { opacity: pressed ? 0.85 : 1 },
                            ]}
                          >
                            <ThemedText style={[styles.togglePillText, { color: active ? '#ffffff' : theme.text }]}>
                              {side === 'HEADS' ? 'Heads' : 'Tails'}
                            </ThemedText>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                </View>

                {result && (
                  <View style={[styles.resultPanel, { backgroundColor: theme.primary + '0A', borderColor: theme.primary + '26' }]}>
                    <View style={styles.resultHead}>
                      <View style={[styles.statusPill, { backgroundColor: accent + '22' }]}>
                        <Ionicons name="sparkles" size={10} color={accent} />
                        <ThemedText style={[styles.statusText, { color: '#B45309' }]}>Landed {result}</ThemedText>
                      </View>
                      <ThemedText style={[styles.resultSub, { color: theme.textSecondary }]} numberOfLines={1}>
                        🎉 {tossWinnerName} chooses
                      </ThemedText>
                    </View>
                    <View style={styles.segmentRow}>
                      {decisionOptions.map((opt) => {
                        const active = tossDecision === opt.value;
                        return (
                          <Pressable
                            key={opt.value}
                            onPress={() => {
                              setTossDecision(opt.value);
                              autoScrollToBottom(120);
                            }}
                            style={({ pressed }) => [
                              styles.togglePill,
                              active
                                ? { backgroundColor: theme.primary, borderColor: theme.primary }
                                : { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '55' },
                              { opacity: pressed ? 0.85 : 1 },
                            ]}
                          >
                            <ThemedText style={[styles.togglePillText, { color: active ? '#ffffff' : theme.text }]}>
                              {opt.label}
                            </ThemedText>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>

              {/* Feedback banner (favourite preselected / already selected) —
                  below the hero so it never pushes the coin off screen. */}
              {notice ? (
                <View style={styles.noticeWrap}>
                  <InlineNotice notice={notice} onDismiss={clearNotice} />
                </View>
              ) : null}

              {/* ── SPORT ── */}
              <View style={styles.section}>
                <SectionHeading title="Sport" tint={theme.primary} />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipStrip}>
                  {SPORTS_LIST.map((sport) => {
                    const isActive = selectedSport === sport.name;
                    const isDisabled = sport.name !== 'Cricket';
                    return (
                      <Pressable
                        key={sport.name}
                        onPress={() => {
                          if (isDisabled) {
                            Alert.alert('Cricket Only Mode', `${sport.name} toss will be enabled in a future update.`);
                            return;
                          }
                          setSelectedSport(sport.name);
                          setResult(null);
                          setTossDecision('');
                        }}
                        style={({ pressed }) => [
                          styles.sportPill,
                          isActive
                            ? { backgroundColor: theme.primary, borderColor: theme.primary }
                            : { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '55' },
                          { opacity: isDisabled ? 0.45 : pressed ? 0.85 : 1 },
                        ]}
                      >
                        <MaterialIcons
                          name={sport.icon as any}
                          size={13}
                          color={isActive ? '#ffffff' : theme.textSecondary}
                        />
                        <ThemedText style={[styles.sportPillText, { color: isActive ? '#ffffff' : theme.text }]}>
                          {sport.name}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              {/* ── MATCH DETAILS: timing, venue type, ground ── */}
              <View style={[styles.section, { zIndex: showTurfDropdown ? 50 : 0 }]}>
                <SectionHeading title="Match details" tint={success} />
                <View style={[styles.card, cardSurface, Shadows.level1]}>
                  <View style={styles.inlineRow}>
                    <View style={styles.labelLeft}>
                      <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Match timing</ThemedText>
                      <ThemedText style={[styles.required, { color: danger }]}>*</ThemedText>
                    </View>
                    <Pressable
                      onPress={() => setShowDateTimePicker(true)}
                      style={({ pressed }) => [
                        styles.valuePill,
                        { backgroundColor: theme.primary + '14', opacity: pressed ? 0.85 : 1 },
                      ]}
                    >
                      <Ionicons name="time-outline" size={12} color={theme.primary} />
                      <ThemedText style={[styles.valuePillText, { color: theme.primary }]}>{selectedTiming}</ThemedText>
                      <Ionicons name="chevron-forward" size={11} color={theme.primary} />
                    </Pressable>
                  </View>

                  <View style={[styles.divider, { backgroundColor: theme.outlineVariant + '33' }]} />

                  <View style={[styles.inlineRow, styles.venueRow]}>
                    <View style={styles.labelLeft}>
                      <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                        {selectedTurfType === 'Turf' ? 'Turf name' : 'Ground name'}
                      </ThemedText>
                      {selectedTurfType !== 'Turf' ? (
                        <ThemedText style={[styles.fieldHint, { color: theme.textSecondary }]}>Optional</ThemedText>
                      ) : null}
                    </View>
                    <View style={styles.miniSegment}>
                      {[
                        { label: 'Turf 🌿', value: 'Turf' as const },
                        { label: 'Ground 🏟️', value: 'Ground' as const },
                      ].map((tType) => {
                        const isActive = selectedTurfType === tType.value;
                        return (
                          <Pressable
                            key={tType.value}
                            onPress={() => handleTurfTypeChange(tType.value)}
                            style={({ pressed }) => [
                              styles.miniPill,
                              isActive
                                ? { backgroundColor: theme.primary, borderColor: theme.primary }
                                : { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33' },
                              { opacity: pressed ? 0.85 : 1 },
                            ]}
                          >
                            <ThemedText style={[styles.miniPillText, { color: isActive ? '#ffffff' : theme.text }]}>
                              {tType.label}
                            </ThemedText>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  {selectedTurfType === 'Turf' ? (
                    <View style={{ zIndex: 30, position: 'relative' }}>
                      <View
                        style={[
                          styles.inputShell,
                          { backgroundColor: theme.surfaceLow, borderColor: showTurfDropdown ? theme.primary : theme.outlineVariant + '33' },
                        ]}
                      >
                        <Ionicons name="search-outline" size={14} color={theme.primary} />
                        <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                          style={[styles.inputField, { color: theme.text }, webNoOutline]}
                          placeholder="Search or select turf..."
                          placeholderTextColor="#94a3b8"
                          value={groundName}
                          onFocus={() => setShowTurfDropdown(true)}
                          onChangeText={(text) => {
                            setTurfName(text);
                            setGroundName(text);
                            setShowTurfDropdown(true);
                          }}
                        />
                        <Pressable onPress={() => setShowTurfDropdown(!showTurfDropdown)} hitSlop={6} style={{ padding: 3 }}>
                          <Ionicons name={showTurfDropdown ? 'chevron-up' : 'chevron-down'} size={13} color={theme.textSecondary} />
                        </Pressable>
                      </View>

                      {showTurfDropdown && (
                        <View style={[styles.turfMenu, { backgroundColor: theme.surfaceLowest, borderColor: theme.primary + '55' }]}>
                          <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                            {turfsList
                              .filter(t => !groundName.trim() || t.toLowerCase().includes(groundName.toLowerCase()))
                              .map((tName, idx) => (
                                <Pressable
                                  key={idx}
                                  onPress={() => {
                                    setTurfName(tName);
                                    setGroundName(tName);
                                    setShowTurfDropdown(false);
                                  }}
                                  style={({ pressed }) => [
                                    styles.menuItem,
                                    {
                                      borderBottomWidth: idx < turfsList.length - 1 ? 1 : 0,
                                      borderBottomColor: theme.outlineVariant + '1F',
                                      backgroundColor: pressed ? theme.surfaceLow : 'transparent',
                                    },
                                  ]}
                                >
                                  <Ionicons name="location-sharp" size={13} color={theme.primary} />
                                  <ThemedText style={[styles.menuItemText, { color: theme.text }]}>{tName}</ThemedText>
                                </Pressable>
                              ))}
                          </ScrollView>
                        </View>
                      )}
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.inputShell,
                        { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33' },
                      ]}
                    >
                      <Ionicons name="location-outline" size={14} color={theme.textSecondary} />
                      <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                        style={[styles.inputField, { color: theme.text }, webNoOutline]}
                        placeholder="e.g. Marina Cricket Ground"
                        placeholderTextColor="#94a3b8"
                        value={groundName}
                        onChangeText={(text) => {
                          setCustomGroundName(text);
                          setGroundName(text);
                        }}
                      />
                    </View>
                  )}
                </View>
              </View>

              {/* ── MATCH RULES (shown once Batting or Bowling is picked) ── */}
              {Boolean(result && tossDecision) && (
                <View style={styles.section}>
                  <SectionHeading title="Match rules" tint={theme.primary} />
                  <View style={[styles.card, cardSurface, Shadows.level1]}>
                    <View style={styles.cardTitleRow}>
                      <View style={[styles.cardIcon, { backgroundColor: theme.primary + '1A' }]}>
                        <Ionicons name="options-outline" size={14} color={theme.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <ThemedText style={[styles.cardTitle, { color: theme.text }]}>Pre-match rules</ThemedText>
                        <ThemedText style={[styles.cardSub, { color: theme.textSecondary }]}>
                          Confirm overs and scoring rules
                        </ThemedText>
                      </View>
                    </View>

                    {renderLabel('Total match overs')}
                    <View style={styles.oversRow}>
                      {['5', '10', '20'].map((ov) => {
                        const isSelected = !isCustomOversSelected && totalOversInput === ov;
                        return (
                          <Pressable
                            key={ov}
                            onPress={() => {
                              setIsCustomOversSelected(false);
                              setTotalOversInput(ov);
                            }}
                            style={({ pressed }) => [
                              styles.oversPill,
                              isSelected
                                ? { backgroundColor: theme.primary, borderColor: theme.primary }
                                : { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33' },
                              { opacity: pressed ? 0.85 : 1 },
                            ]}
                          >
                            <ThemedText style={[styles.oversPillText, { color: isSelected ? '#ffffff' : theme.text }]}>
                              {ov} Ov
                            </ThemedText>
                          </Pressable>
                        );
                      })}

                      {!isCustomOversSelected ? (
                        <Pressable
                          onPress={() => {
                            setIsCustomOversSelected(true);
                            if (customOversValue) {
                              setTotalOversInput(customOversValue);
                            }
                          }}
                          style={({ pressed }) => [
                            styles.oversPill,
                            { backgroundColor: theme.surfaceLowest, borderColor: theme.primary, opacity: pressed ? 0.85 : 1 },
                          ]}
                        >
                          <Ionicons name="create-outline" size={11} color={theme.primary} />
                          <ThemedText style={[styles.oversPillText, { color: theme.primary }]}>Custom</ThemedText>
                        </Pressable>
                      ) : (
                        <View style={[styles.oversPill, styles.customOvers, { backgroundColor: theme.surfaceLowest, borderColor: theme.primary }]}>
                          <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                            style={[styles.customOversInput, { color: theme.text }, webNoOutline]}
                            placeholder="e.g. 15"
                            placeholderTextColor="#94a3b8"
                            keyboardType="numeric"
                            maxLength={3}
                            autoFocus
                            value={customOversValue}
                            onChangeText={(val) => {
                              const clean = val.replace(/[^0-9]/g, '');
                              setCustomOversValue(clean);
                              if (clean) {
                                setTotalOversInput(clean);
                              }
                            }}
                          />
                          <ThemedText style={[styles.oversPillText, { color: theme.primary }]}>Ov</ThemedText>
                          <Pressable
                            onPress={() => {
                              setIsCustomOversSelected(false);
                              setTotalOversInput('20');
                            }}
                            hitSlop={6}
                            style={{ padding: 1 }}
                          >
                            <Ionicons name="close-circle" size={13} color="#94a3b8" />
                          </Pressable>
                        </View>
                      )}
                    </View>

                    <View style={[styles.divider, { backgroundColor: theme.outlineVariant + '33' }]} />

                    {renderLabel('Scoring rules')}
                    <View style={styles.ruleList}>
                      {scoringRules.map((rule) => (
                        <Pressable
                          key={rule.key}
                          onPress={rule.toggle}
                          style={({ pressed }) => [styles.ruleRow, { opacity: pressed ? 0.8 : 1 }]}
                        >
                          <Ionicons
                            name={rule.on ? 'checkbox' : 'square-outline'}
                            size={15}
                            color={rule.on ? theme.primary : '#94a3b8'}
                          />
                          <ThemedText style={[styles.ruleText, { color: theme.text }]}>{rule.label}</ThemedText>
                          <View style={[styles.statusPill, { backgroundColor: (rule.on ? success : '#94a3b8') + '22' }]}>
                            <ThemedText style={[styles.statusText, { color: rule.on ? '#047857' : theme.textSecondary }]}>
                              {rule.on ? 'Active' : 'Off'}
                            </ThemedText>
                          </View>
                        </Pressable>
                      ))}
                    </View>

                    {/* Guide Pill */}
                    <View style={[styles.guidePill, { backgroundColor: theme.primary + '0F' }]}>
                      <ThemedText style={[styles.guideText, { color: theme.textSecondary }]}>
                        💡 <ThemedText style={[styles.guideText, { fontFamily: 'Sora_500Medium', color: theme.primary }]}>Match Scenarios:</ThemedText> Long-press 'WD' on pad for Wide + 1, 2 runs. Tap 'Wicket' → pick 'W+1' or 'W+2' for Run Outs.
                      </ThemedText>
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* ── Toss or Start Action Button — pinned under the scroll ── */}
            <View style={[styles.actionsBar, { borderTopColor: theme.outlineVariant + '33' }]}>
              {!result ? (
                <Pressable
                  onPress={handleToss}
                  disabled={isFlipping}
                  style={({ pressed }) => [
                    styles.actionBtn,
                    { backgroundColor: areTeamsValid ? theme.primary : '#94a3b8' },
                    (isFlipping || pressed) && { opacity: 0.8 },
                  ]}
                >
                  <View style={styles.actionText}>
                    <ThemedText style={[styles.actionTitle, { color: '#ffffff' }]}>
                      {isFlipping ? 'Flipping Coin...' : 'Toss the Coin'}
                    </ThemedText>
                    <ThemedText style={[styles.actionSub, { color: 'rgba(255,255,255,0.85)' }]} numberOfLines={1}>
                      {!areTeamsValid ? 'Enter both team names to toss' : `${selectedSport} · Quick Match`}
                    </ThemedText>
                  </View>
                  <View style={[styles.actionIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <ThemedText style={{ fontSize: 14 }}>🪙</ThemedText>
                  </View>
                </Pressable>
              ) : !canStartMatch ? (
                <Pressable
                  onPress={() => {
                    if (!areTeamsValid) {
                      Alert.alert('Validation Required', 'Please enter valid team names for both Team A and Team B.');
                    } else if (!isRolePicked) {
                      Alert.alert('Role Required', 'Please pick Batting or Bowling role above before starting the match.');
                    }
                  }}
                  style={[styles.actionBtn, styles.actionBtnLocked, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '55' }]}
                >
                  <View style={styles.actionText}>
                    <ThemedText style={[styles.actionTitle, { color: theme.textSecondary }]}>Start the Match</ThemedText>
                    <ThemedText style={[styles.actionSub, { color: theme.textSecondary }]} numberOfLines={1}>
                      {!areTeamsValid
                        ? 'Team names required to enable'
                        : 'Select Batting or Bowling above to start'}
                    </ThemedText>
                  </View>
                  <View style={[styles.actionIcon, { backgroundColor: theme.outlineVariant + '40' }]}>
                    <Ionicons name="lock-closed" size={13} color={theme.textSecondary} />
                  </View>
                </Pressable>
              ) : (
                <Pressable
                  onPress={handleStartMatch}
                  style={({ pressed }) => [styles.actionBtn, { backgroundColor: theme.primary }, pressed && { opacity: 0.85 }]}
                >
                  <View style={styles.actionText}>
                    <ThemedText style={[styles.actionTitle, { color: '#ffffff' }]}>Start the Match</ThemedText>
                    <ThemedText style={[styles.actionSub, { color: 'rgba(255,255,255,0.9)' }]} numberOfLines={1}>
                      {tossWinnerName} won toss · Choose to {tossDecision} · Verified ({totalOversInput} Ov)
                    </ThemedText>
                  </View>
                  <View style={[styles.actionIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <Ionicons name="play" size={14} color="#ffffff" />
                  </View>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Monthly Calendar + Time Picker Modal Component ── */}
      <Modal visible={showDateTimePicker} transparent animationType="slide" onRequestClose={() => setShowDateTimePicker(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: theme.surfaceLowest, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 14 }}>
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: theme.primary + '18', justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="calendar" size={18} color={theme.primary} />
                </View>
                <ThemedText style={{ fontSize: 14.5, fontFamily: 'Sora_500Medium', color: theme.text }}>
                  Select Start Date
                </ThemedText>
              </View>
              <Pressable onPress={() => setShowDateTimePicker(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={20} color={theme.text} />
              </Pressable>
            </View>

            {/* Month Navigation Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, marginTop: 4 }}>
              <Pressable style={{ padding: 6 }}>
                <Ionicons name="chevron-back" size={20} color={theme.text} />
              </Pressable>
              <ThemedText style={{ fontSize: 14.5, fontFamily: 'Sora_500Medium', color: theme.text }}>
                August 2026
              </ThemedText>
              <Pressable style={{ padding: 6 }}>
                <Ionicons name="chevron-forward" size={20} color={theme.text} />
              </Pressable>
            </View>

            {/* Days Grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                const isSelected = selectedDay === day;
                const isToday = day === new Date().getDate();
                const isPast = day < new Date().getDate();

                return (
                  <Pressable
                    key={day}
                    disabled={isPast}
                    onPress={() => setSelectedDay(day)}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: isSelected ? theme.primary : isToday ? theme.primary + '20' : 'transparent',
                      borderWidth: isToday && !isSelected ? 1 : 0,
                      borderColor: theme.primary,
                      opacity: isPast ? 0.3 : 1,
                    }}
                  >
                    <ThemedText
                      style={{
                        color: isSelected ? '#ffffff' : isPast ? theme.textSecondary : theme.text,
                        fontFamily: isSelected || isToday ? 'Sora_600SemiBold' : 'Sora_400Regular',
                        fontSize: 13,
                      }}
                    >
                      {day}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: theme.outlineVariant + '30', marginVertical: 2 }} />

            {/* Time Selection Header & Slots */}
            <View>
              <ThemedText style={{ fontSize: 9, fontFamily: 'Sora_500Medium', letterSpacing: 0.6, color: theme.textSecondary, marginBottom: 8 }}>
                SELECT MATCH TIME
              </ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
                {['6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM'].map((t) => {
                  const targetDate = new Date(new Date().getFullYear(), new Date().getMonth(), selectedDay);
                  const isPassed = isTimeSlotPassed(t, targetDate);
                  const isSelected = tempTime === t;

                  return (
                    <Pressable
                      key={t}
                      disabled={isPassed}
                      onPress={() => setTempTime(t)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 7,
                        borderRadius: 999,
                        backgroundColor: isSelected ? theme.primary + '20' : theme.surfaceLow,
                        borderWidth: 1,
                        borderColor: isSelected ? theme.primary : theme.outlineVariant + '40',
                        opacity: isPassed ? 0.35 : 1,
                      }}
                    >
                      <ThemedText
                        style={{
                          color: isSelected ? theme.primary : isPassed ? theme.textSecondary : theme.text,
                          fontSize: 11.5,
                          fontFamily: 'Sora_500Medium',
                          textDecorationLine: isPassed ? 'line-through' : 'none',
                        }}
                      >
                        {t}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Confirm Button */}
            <Pressable
              onPress={() => {
                setSelectedTiming(`${selectedDay} Aug 2026, ${tempTime}`);
                setShowDateTimePicker(false);
              }}
              style={{ backgroundColor: theme.primary, paddingVertical: 13, borderRadius: 999, alignItems: 'center', marginTop: 4 }}
            >
              <ThemedText style={{ color: '#ffffff', fontSize: 13, fontFamily: 'Sora_500Medium' }}>
                Confirm Timing ({selectedDay} Aug 2026, {tempTime})
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ── Add New Team Modal ── */}
      <Modal
        visible={isNewTeamModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsNewTeamModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Create New Team</ThemedText>
              <Pressable onPress={() => setIsNewTeamModalOpen(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
              {/* Linked Logged-In User Badge */}
              <View style={[styles.userLinkCard, { backgroundColor: theme.primary + '12', borderColor: theme.primary + '33' }]}>
                <View style={[styles.userLinkAvatar, { backgroundColor: theme.primary }]}>
                  <Ionicons name="person" size={14} color="#ffffff" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <ThemedText style={[styles.userLinkName, { color: theme.text }]}>
                      {profile.name || 'Account User'}
                    </ThemedText>
                    <View style={[styles.userLinkBadge, { backgroundColor: '#10B98122' }]}>
                      <Ionicons name="shield-checkmark" size={11} color="#10B981" />
                      <ThemedText style={styles.userLinkBadgeText}>Logged User Linked</ThemedText>
                    </View>
                  </View>
                  <ThemedText style={[styles.userLinkSub, { color: theme.textSecondary }]}>
                    Manager &amp; Phone ({newPhone || profile.phone || '9876543210'}) automatically linked
                  </ThemedText>
                </View>
              </View>

              {/* Team Name Input */}
              <View style={styles.modalInputGroup}>
                <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Team name *</ThemedText>
                <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                  style={[
                    styles.input,
                    { backgroundColor: theme.surfaceLow, color: theme.text, borderColor: isNameFocused ? theme.primary : theme.outlineVariant + '44' }
                  ]}
                  placeholder="e.g. London Strikers"
                  placeholderTextColor="#94a3b8"
                  value={newTeamName}
                  onChangeText={(val) => {
                    setNewTeamName(val);
                    setNewShortName(generateShortName(val));
                  }}
                  onFocus={() => setIsNameFocused(true)}
                  onBlur={() => setIsNameFocused(false)}
                />
              </View>

              {/* Short Name & Phone */}
              <View style={styles.modalRow}>
                <View style={[styles.modalInputGroup, { flex: 1 }]}>
                  <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Short name *</ThemedText>
                  <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                    style={[
                      styles.input,
                      { backgroundColor: theme.surfaceLow, color: theme.text, borderColor: isShortFocused ? theme.primary : theme.outlineVariant + '44' }
                    ]}
                    placeholder="LS"
                    placeholderTextColor="#94a3b8"
                    value={newShortName}
                    onChangeText={setNewShortName}
                    onFocus={() => setIsShortFocused(true)}
                    onBlur={() => setIsShortFocused(false)}
                    autoCapitalize="characters"
                    maxLength={5}
                  />
                </View>
                <View style={[styles.modalInputGroup, { flex: 2 }]}>
                  <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Phone *</ThemedText>
                  <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                    style={[
                      styles.input,
                      { backgroundColor: theme.surfaceLow, color: theme.text, borderColor: isPhoneFocused ? theme.primary : theme.outlineVariant + '44' }
                    ]}
                    placeholder="98765 43210"
                    placeholderTextColor="#94a3b8"
                    value={newPhone}
                    onChangeText={(t) => setNewPhone(formatPhoneNumber(t))}
                    onFocus={() => setIsPhoneFocused(true)}
                    onBlur={() => setIsPhoneFocused(false)}
                    keyboardType="phone-pad"
                    maxLength={11}
                  />
                  {newPhone !== '' && getPhoneValidationError(newPhone, true) ? (
                    <ThemedText style={{ color: '#ef4444', fontSize: 10, marginTop: 3 }}>
                      {getPhoneValidationError(newPhone, true)}
                    </ThemedText>
                  ) : (
                    <ThemedText style={{ color: '#10B981', fontSize: 10, fontFamily: 'Sora_500Medium', marginTop: 3 }}>
                      ✓ Auto-placed from logged user
                    </ThemedText>
                  )}
                </View>
              </View>

              {/* Mascot Selector */}
              <View style={styles.modalInputGroup}>
                <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary, marginBottom: 6 }]}>Pick a mascot</ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
                  {MASCOTS_LIST.map((m) => (
                    <Pressable
                      key={m.name}
                      onPress={() => setNewMascot(m.name)}
                      style={[
                        styles.mascotThumbBtn,
                        {
                          borderColor: newMascot === m.name ? theme.primary : theme.outlineVariant + '44',
                          backgroundColor: theme.surfaceLow
                        }
                      ]}
                    >
                      <Image source={m.asset} style={styles.mascotThumbImg} contentFit="contain" />
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {/* Favourite Team Toggle */}
              <View style={styles.modalInputGroup}>
                <Pressable
                  onPress={() => {
                    if (isFavLimitReached && !newIsFavourite) {
                      Alert.alert(
                        'Favourite Limit Reached',
                        'Per user allowed to create up to 2 teams as Favourite Team.'
                      );
                      return;
                    }
                    setNewIsFavourite(!newIsFavourite);
                  }}
                  style={[
                    styles.favToggleContainer,
                    {
                      backgroundColor: theme.surfaceLow,
                      borderColor: newIsFavourite ? '#FACC15' : theme.outlineVariant + '44',
                      opacity: isFavLimitReached && !newIsFavourite ? 0.6 : 1,
                    }
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <Ionicons
                      name={newIsFavourite ? 'star' : 'star-outline'}
                      size={20}
                      color={newIsFavourite ? '#FACC15' : theme.textSecondary}
                    />
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <ThemedText style={{ fontFamily: 'Sora_500Medium', fontSize: 12, color: theme.text }}>
                          Mark as Favourite Team
                        </ThemedText>
                        <View style={{ backgroundColor: '#FACC1525', paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 4 }}>
                          <ThemedText style={{ fontFamily: 'Sora_500Medium', fontSize: 9.5, color: '#D97706' }}>
                            {newIsFavourite ? `${favTeamsForNewPhone.length + 1}/2` : `${favTeamsForNewPhone.length}/2`}
                          </ThemedText>
                        </View>
                      </View>
                      <ThemedText style={{ fontFamily: 'Sora_500Medium', fontSize: 10, color: theme.textSecondary, marginTop: 2 }}>
                        {isFavLimitReached
                          ? 'Limit reached: Per user allowed to create up to 2 teams as Favourite Team'
                          : 'Per user allowed to create up to 2 teams as Favourite Team (shown at top of selection lists)'}
                      </ThemedText>
                    </View>
                  </View>
                  <Ionicons
                    name={newIsFavourite ? 'checkmark-circle' : 'ellipse-outline'}
                    size={20}
                    color={newIsFavourite ? '#10B981' : theme.outlineVariant}
                  />
                </Pressable>
              </View>

              {/* Actions */}
              <View style={[styles.modalActions, { borderTopColor: theme.outlineVariant + '22' }]}>
                <Pressable
                  onPress={() => setIsNewTeamModalOpen(false)}
                  style={[styles.modalBtn, { backgroundColor: theme.surfaceLow }]}
                >
                  <ThemedText style={{ color: theme.textSecondary, fontFamily: 'Sora_500Medium', fontSize: 12 }}>Cancel</ThemedText>
                </Pressable>
                <Pressable
                  onPress={handleCreateTeamFromModal}
                  style={[styles.modalBtn, { backgroundColor: theme.primary }]}
                >
                  <ThemedText style={{ color: '#ffffff', fontFamily: 'Sora_500Medium', fontSize: 12 }}>Create Team</ThemedText>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const CARD_RADIUS = BorderRadius.premium;
const HERO_RADIUS = 18;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 21, 30, 0.75)',
  },
  backdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  modalBox: {
    width: '94%',
    maxWidth: 440,
    maxHeight: '92%',
    borderRadius: 22,
    borderWidth: 1,
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 12,
    ...Shadows.level3,
  },

  // popup title bar
  sheetHead: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 10 },
  sheetIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sheetTitle: { fontFamily: 'Sora_500Medium', fontSize: 14 },
  sheetSub: { fontFamily: 'Sora_400Regular', fontSize: 10, marginTop: 1 },
  sheetClose: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetScroll: { flexGrow: 0, flexShrink: 1 },
  scrollContent: { paddingBottom: 4 },

  section: { marginTop: 12 },
  noticeWrap: { marginTop: 10, marginBottom: -10 },

  // hero match card — dashboard hero band with the toss built in
  heroCard: { borderRadius: HERO_RADIUS, borderWidth: 1, padding: 11 },
  heroHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  heroText: { flex: 1, paddingRight: 8 },
  heroBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 5,
  },
  heroBadgeText: { fontFamily: 'Sora_500Medium', fontSize: 8.5, letterSpacing: 0.8 },
  heroTitle: { fontFamily: 'Sora_500Medium', fontSize: 14.5 },
  heroSub: { fontFamily: 'Sora_400Regular', fontSize: 10.5, marginTop: 1, lineHeight: 14 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  progressTrack: { flex: 1, height: 5, borderRadius: 999, overflow: 'hidden', flexDirection: 'row' },
  progressFill: { borderRadius: 999 },
  progressText: { fontFamily: 'Sora_500Medium', fontSize: 9.5 },

  // cards
  card: { borderRadius: CARD_RADIUS, borderWidth: 1, padding: 11 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 10 },
  cardIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: 'Sora_500Medium', fontSize: 13 },
  cardSub: { fontFamily: 'Sora_400Regular', fontSize: 10.5, marginTop: 1 },
  divider: { height: 1, marginVertical: 9 },

  // labels
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  labelLeft: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 },
  fieldLabel: {
    fontFamily: 'Sora_500Medium',
    fontSize: 9,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  required: { fontFamily: 'Sora_500Medium', fontSize: 11, marginLeft: -2 },
  fieldHint: { fontFamily: 'Sora_400Regular', fontSize: 10 },

  // sport chips
  chipStrip: { gap: 6, paddingVertical: 2 },
  sportPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    height: 30,
    borderRadius: 999,
    borderWidth: 1,
  },
  sportPillText: { fontFamily: 'Sora_500Medium', fontSize: 10.5 },

  // teams + coin row
  vsRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  teamSlot: { flex: 1, alignItems: 'center' },
  crest: {
    width: 40,
    height: 40,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crestMascot: { width: 26, height: 26 },
  crestText: { fontFamily: 'Sora_500Medium', fontSize: 12, letterSpacing: 0.5 },
  crestAdd: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newTeamLink: { fontFamily: 'Sora_500Medium', fontSize: 9.5, marginTop: 5, marginBottom: 5 },
  teamInputWrap: { width: '100%', maxWidth: 132, position: 'relative', zIndex: 100 },
  teamInput: {
    height: 30,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 0,
    textAlign: 'center',
    fontFamily: 'Sora_500Medium',
    fontSize: 10.5,
    includeFontPadding: false,
  },
  teamError: { fontFamily: 'Sora_500Medium', fontSize: 9, textAlign: 'center', marginTop: 3 },
  teamMenu: {
    position: 'absolute',
    width: 170,
    top: 34,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    shadowColor: '#181817',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 10,
    zIndex: 999,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
  },
  menuAddText: { fontFamily: 'Sora_500Medium', fontSize: 11 },
  menuMascot: { width: 14, height: 14, borderRadius: 2 },
  menuItemText: { fontFamily: 'Sora_400Regular', fontSize: 11, flex: 1 },
  favPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 999,
  },
  favPillText: { fontFamily: 'Sora_500Medium', fontSize: 8.5, letterSpacing: 0.4 },
  coinCol: { width: 74, alignItems: 'center' },
  vsText: { fontFamily: 'Sora_500Medium', fontSize: 8.5, letterSpacing: 1, marginBottom: 3 },
  coin: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFE259',
    borderWidth: 3,
    borderColor: '#EAB308',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EAB308',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  coinFace: { width: '100%', height: '100%', borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  coinSymbol: { fontFamily: 'Sora_500Medium', fontSize: 18, color: '#1C2939' },
  coinHint: { fontFamily: 'Sora_500Medium', fontSize: 9, marginTop: 5 },

  // match details
  inlineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  venueRow: { marginBottom: 8 },
  valuePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    flexShrink: 1,
  },
  valuePillText: { fontFamily: 'Sora_500Medium', fontSize: 10.5 },
  miniSegment: { flexDirection: 'row', gap: 5 },
  miniPill: {
    height: 26,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniPillText: { fontFamily: 'Sora_500Medium', fontSize: 10 },
  segmentRow: { flexDirection: 'row', gap: 6 },
  togglePill: {
    flex: 1,
    height: 30,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  togglePillText: { fontFamily: 'Sora_500Medium', fontSize: 10.5, textAlign: 'center' },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    borderRadius: 999,
    borderWidth: 1,
    paddingLeft: 12,
    paddingRight: 8,
  },
  inputField: {
    flex: 1,
    fontFamily: 'Sora_400Regular',
    fontSize: 11,
    paddingVertical: 0,
    includeFontPadding: false,
  },
  turfMenu: {
    marginTop: 6,
    maxHeight: 140,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    overflow: 'hidden',
    ...Shadows.level2,
  },

  // toss
  tossConfigRow: { flexDirection: 'row', gap: 10 },
  tossConfigCol: { flex: 1 },
  resultPanel: { marginTop: 9, padding: 8, borderRadius: CARD_RADIUS, borderWidth: 1 },
  resultHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 7,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 999,
  },
  statusText: {
    fontFamily: 'Sora_500Medium',
    fontSize: 8.5,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  resultSub: { fontFamily: 'Sora_400Regular', fontSize: 10.5, flexShrink: 1 },

  // match rules
  oversRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  oversPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 28,
    paddingHorizontal: 11,
    borderRadius: 999,
    borderWidth: 1,
  },
  oversPillText: { fontFamily: 'Sora_500Medium', fontSize: 10 },
  customOvers: { paddingHorizontal: 9 },
  customOversInput: {
    minWidth: 30,
    fontFamily: 'Sora_500Medium',
    fontSize: 10.5,
    padding: 0,
    height: 20,
    textAlign: 'center',
    includeFontPadding: false,
  },
  ruleList: { gap: 7 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  ruleText: { flex: 1, fontFamily: 'Sora_400Regular', fontSize: 10.5, lineHeight: 14 },
  guidePill: { borderRadius: CARD_RADIUS, padding: 8, marginTop: 10 },
  guideText: { fontFamily: 'Sora_400Regular', fontSize: 9.5, lineHeight: 13 },

  // pinned action bar
  actionsBar: { paddingTop: 10, marginTop: 2, borderTopWidth: 1 },
  actionBtn: {
    height: 48,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 18,
    paddingRight: 7,
    ...Shadows.level2,
  },
  actionBtnLocked: { borderWidth: 1, shadowOpacity: 0, elevation: 0 },
  actionText: { flex: 1 },
  actionTitle: { fontFamily: 'Sora_500Medium', fontSize: 13 },
  actionSub: { fontFamily: 'Sora_400Regular', fontSize: 9.5, marginTop: 1 },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* New Team Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 1000,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    maxHeight: '90%',
    ...Shadows.level3,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: { fontFamily: 'Sora_500Medium', fontSize: 15.5 },
  modalCloseBtn: { padding: 4 },
  modalScroll: { gap: 14, paddingBottom: 10 },
  modalInputGroup: { flexDirection: 'column', gap: 2 },
  input: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11,
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 0,
    width: '100%',
    includeFontPadding: false,
  },
  modalRow: { flexDirection: 'row', gap: 10 },
  mascotThumbBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  mascotThumbImg: { width: '100%', height: '100%' },
  favToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 11,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  modalBtn: {
    height: 36,
    paddingHorizontal: 18,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userLinkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    marginBottom: 4,
  },
  userLinkAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userLinkName: { fontFamily: 'Sora_500Medium', fontSize: 12.5 },
  userLinkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  userLinkBadgeText: { fontSize: 9, fontFamily: 'Sora_500Medium', color: '#10B981' },
  userLinkSub: { fontFamily: 'Sora_400Regular', fontSize: 10, marginTop: 2 },
});
