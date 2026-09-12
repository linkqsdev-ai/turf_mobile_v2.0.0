import React, { useRef, useState, useEffect } from 'react';
import { ThemedText, MAX_FONT_SCALE } from '@/components/themed-text';
import { FavouriteTeamIcon } from '@/components/favourite-team-icon';
import { Shadows, Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { turfApi } from '@/services/turf-api';
let Audio: any = null;
try {
  Audio = require('expo-av').Audio;
} catch (e) {
  console.warn('expo-av is not available in this environment');
}
import {
  Alert,
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  Modal,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useMatchStore } from '@/store/app-store';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useToast } from '@/context/ToastContext';
import { favouriteTeamDefaults, isSameTeam } from '@/lib/favourite-teams';
import { PlayerSelectionModal } from '@/components/matches/PlayerSelectionModal';
import { dedupePlayers, generatePlayerId, type Player } from '@/store/match-store';
import { formatPhoneNumber, getPhoneValidationError } from '@/utils/phone-utils';

import { SPORTS_LIST } from '@/constants/sports';
import { isTimeSlotPassed } from '@/utils/date-utils';
import { MotionIllustration } from '@/components/motion-illustration';
import { SectionHeading } from '@/components/home/dashboard-widgets';

const FORMATS: Record<string, string[]> = {
  Football: ['5-a-side', '7-a-side', '11-a-side'],
  Cricket: ['T10', 'T20', 'ODI'],
  Basketball: ['Half Court', 'Full Court'],
  Tennis: ['Singles', 'Doubles'],
  Badminton: ['Singles', 'Doubles'],
  Volleyball: ['Standard', 'Beach'],
  Swimming: ['Freestyle', 'Medley'],
  Shuttlecock: ['Singles', 'Doubles'],
};

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

export function QuickMatchTab({
  onNavigate,
  bottomInset = 68,
}: {
  onNavigate?: (tab: string) => void;
  /** Space reserved below the form. Defaults to clearing the floating tab
   *  bar; a stack screen that has no tab bar should pass a small value. */
  bottomInset?: number;
}) {
  const theme = useTheme();
  const router = useRouter();
  const { teams, addTeam } = useMatchStore();
  const { profile } = useUserProfile();
  const { showInfo, showWarning } = useToast();
  const [selectedSport, setSelectedSport] = useState('Cricket');
  const [selectedFormat, setSelectedFormat] = useState('T20');
  const [customFormat, setCustomFormat] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
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

  useEffect(() => {
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
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
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

  // Team configuration states
  const [teamAName, setTeamAName] = useState('');
  const [teamBName, setTeamBName] = useState('');
  const [teamAError, setTeamAError] = useState('');
  const [teamBError, setTeamBError] = useState('');
  const [oversError, setOversError] = useState('');

  // Pre-match player selection (drag-and-drop lineup draft — optional, can be skipped)
  const [isPlayerSelectionOpen, setIsPlayerSelectionOpen] = useState(false);
  const [teamALineup, setTeamALineup] = useState<Player[]>([]);
  const [teamBLineup, setTeamBLineup] = useState<Player[]>([]);
  const [lineupConfigured, setLineupConfigured] = useState(false);
  // Full draft pool (matched-team rosters + any manually added guests) — kept
  // across sheet close/reopen so guests don't get lost when re-editing.
  const [playerPool, setPlayerPool] = useState<Player[]>([]);

  const [dropdownAOpen, setDropdownAOpen] = useState(false);
  const [dropdownBOpen, setDropdownBOpen] = useState(false);

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

  const [searchQueryA, setSearchQueryA] = useState('');
  const [searchQueryB, setSearchQueryB] = useState('');

  const [isNewTeamModalOpen, setIsNewTeamModalOpen] = useState(false);
  const [addingForTeam, setAddingForTeam] = useState<'A' | 'B' | null>(null);

  // Modal form states
  const [newTeamName, setNewTeamName] = useState('');
  const [newShortName, setNewShortName] = useState('');
  const [newPhone, setNewPhone] = useState(profile?.phone ? formatPhoneNumber(profile.phone) : '');
  const [newMascot, setNewMascot] = useState('lion');
  const [newIsFavourite, setNewIsFavourite] = useState(false);

  const openNewTeamModal = (slot: 'A' | 'B') => {
    setAddingForTeam(slot);
    // Allow user to enter custom team name (do not prefill from user profile)
    setNewTeamName('');
    setNewShortName('');
    // Automatically place logged-in user phone
    const autoPhone = profile?.phone ? formatPhoneNumber(profile.phone) : '';
    setNewPhone(autoPhone);
    setNewIsFavourite(false);
    setIsNewTeamModalOpen(true);
  };

  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isShortFocused, setIsShortFocused] = useState(false);
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);

  // Computed favorite count for phone: max 2 favorite teams allowed per mobile number
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
      Alert.alert('Missing Fields', 'Please enter team name and short name.');
      return;
    }

    const phoneErr = getPhoneValidationError(newPhone, true);
    if (phoneErr) {
      Alert.alert('Invalid Mobile Number', phoneErr);
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
          // generatePlayerId() adds a random suffix — two teams created in the
          // same millisecond would otherwise mint the identical player id.
          id: generatePlayerId(),
          name: profile.name || 'Captain',
          skillLevel: profile.skillLevel || 'Intermediate',
        } as any,
      ],
      isFavourite: newIsFavourite && !isFavLimitReached,
    });

    // Select it automatically!
    if (addingForTeam === 'A') {
      setTeamAName(created.name);
    } else if (addingForTeam === 'B') {
      setTeamBName(created.name);
    }

    // Reset form & close
    setNewTeamName('');
    setNewShortName('');
    setNewPhone('');
    setNewMascot('lion');
    setNewIsFavourite(false);
    setIsNewTeamModalOpen(false);
    setAddingForTeam(null);
    setTossResult(null);
    setTossDecision('');

    // Auto-scroll to toss coin card after adding team
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 150, animated: true });
    }, 300);
  };

  const sortedTeams = [...teams].sort((a, b) => {
    if (a.isFavourite && !b.isFavourite) return -1;
    if (!a.isFavourite && b.isFavourite) return 1;
    return a.name.localeCompare(b.name);
  });

  // The team taken by the other slot stays in the list rather than silently
  // vanishing — tapping it raises an "already selected" notification instead.
  const filteredTeamsA = sortedTeams.filter(team =>
    (!team.sport || team.sport.toLowerCase() === selectedSport.toLowerCase()) &&
    team.name.toLowerCase().includes(searchQueryA.toLowerCase())
  );

  const filteredTeamsB = sortedTeams.filter(team =>
    (!team.sport || team.sport.toLowerCase() === selectedSport.toLowerCase()) &&
    team.name.toLowerCase().includes(searchQueryB.toLowerCase())
  );

  // Toss Configuration
  const [tossCaller, setTossCaller] = useState<'A' | 'B'>('A');
  const [tossCall, setTossCall] = useState<'HEADS' | 'TAILS'>('HEADS');

  // Pre-Match Rules Verification States (Total Overs, Wides, No-Balls, Byes)
  const [totalOversInput, setTotalOversInput] = useState('5');
  const [isCustomOversSelected, setIsCustomOversSelected] = useState(false);
  const [customOversValue, setCustomOversValue] = useState('');
  const [autoWideRule, setAutoWideRule] = useState(true);
  const [autoNoBallRule, setAutoNoBallRule] = useState(true);
  const [allowByesRule, setAllowByesRule] = useState(true);
  const [allowWicketRunsRule, setAllowWicketRunsRule] = useState(true);

  // Toss Result states
  const [tossResult, setTossResult] = useState<'HEADS' | 'TAILS' | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [tossDecision, setTossDecision] = useState<string>('');

  // Local display side for coin face during visual spin
  const [displaySide, setDisplaySide] = useState<'HEADS' | 'TAILS'>('HEADS');

  // ── Favourite team defaults ───────────────────────────────────────────────
  // Drop the player's starred team(s) straight into the empty slots so a quick
  // match is one tap from ready. Only fills blanks — never overwrites a choice.
  const prefilledRef = useRef(false);
  useEffect(() => {
    if (prefilledRef.current) return;
    if (teams.length === 0) return;

    const { teamA, teamB } = favouriteTeamDefaults(teams, selectedSport);
    if (!teamA) return;

    prefilledRef.current = true;
    const slotAEmpty = !teamAName.trim();
    if (slotAEmpty) {
      setTeamAName(teamA);
      setSearchQueryA(teamA);
    }
    if (teamB && !teamBName.trim() && !isSameTeam(teamA, teamB)) {
      setTeamBName(teamB);
      setSearchQueryB(teamB);
    }

    if (slotAEmpty) {
      showInfo('Favourite team ready', `${teamA} is preselected as Team A.`);
    } else if (isSameTeam(teamAName, teamA)) {
      showInfo('Already selected', `${teamA} is already your Team A.`);
    }
  }, [teams, selectedSport, teamAName, teamBName, showInfo]);

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
      showInfo('Already selected', `${name} is already your Team ${slot}.`);
      return;
    }
    if (isSameTeam(other, name)) {
      showWarning(
        'Already selected',
        `${name} is playing as Team ${slot === 'A' ? 'B' : 'A'}. Pick a different side.`,
      );
      return;
    }

    if (slot === 'A') {
      setTeamAName(name);
      setSearchQueryA(name);
    } else {
      setTeamBName(name);
      setSearchQueryB(name);
    }
    setTeamAError('');
    setTeamBError('');
    setTossResult(null);
    setTossDecision('');
  };

  // Animation values
  const spinAnim = useRef(new Animated.Value(0)).current;

  const playCoinSound = async () => {
    try {
      if (!Audio || !Audio.Sound) {
        console.log('Audio playing skipped (expo-av not available)');
        return;
      }
      const { sound } = await Audio.Sound.createAsync(
        require('../../../assets/coin.mp3')
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

  const spinCoin = () => {
    if (isFlipping) return;
    playCoinSound();
    setIsFlipping(true);
    setTossResult(null);
    setTossDecision('');
    spinAnim.setValue(0);

    // Speedily cycle H / T coin text in rendering loop during spin
    let currentSide = displaySide;
    const intervalId = setInterval(() => {
      currentSide = currentSide === 'HEADS' ? 'TAILS' : 'HEADS';
      setDisplaySide(currentSide);
    }, 70);

    // eslint-disable-next-line react-hooks/purity
    const resultSide = Math.random() < 0.5 ? 'HEADS' : 'TAILS';

    Animated.timing(spinAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start(() => {
      clearInterval(intervalId);
      setIsFlipping(false);
      setTossResult(resultSide);
      setDisplaySide(resultSide);
      // The result and decision pills sit in the match card beside the coin —
      // bring that card back into view rather than scrolling past it.
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }, 100);
    });
  };

  // eslint-disable-next-line react-hooks/refs
  const coinSpin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '2880deg'],
  });

  // eslint-disable-next-line react-hooks/refs
  const coinLift = spinAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -80, 0],
  });

  const handleSportChange = (sport: string) => {
    setSelectedSport(sport);
    setSelectedFormat(FORMATS[sport][0]);
    setCustomFormat('');
    // Reset toss on sport swap
    setTossResult(null);
    setTossDecision('');
    // Auto-scroll scrollview to top to align selectors
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const validateTeamsAndMatch = (): boolean => {
    let isValid = true;
    if (!teamAName.trim()) {
      setTeamAError('Team A name required');
      isValid = false;
    } else {
      setTeamAError('');
    }

    if (!teamBName.trim()) {
      setTeamBError('Team B name required');
      isValid = false;
    } else {
      setTeamBError('');
    }

    if (teamAName.trim() && teamBName.trim() && teamAName.trim().toLowerCase() === teamBName.trim().toLowerCase()) {
      setTeamBError('Teams must be different');
      isValid = false;
    }

    const oversNum = parseInt(totalOversInput);
    if (!totalOversInput.trim() || isNaN(oversNum) || oversNum <= 0) {
      setOversError('Valid overs required');
      isValid = false;
    } else {
      setOversError('');
    }

    return isValid;
  };

  const handleToss = () => {
    if (!validateTeamsAndMatch()) {
      Alert.alert(
        'Validation Required',
        'Please enter or select valid team names for both Team A and Team B before tossing the coin.'
      );
      return;
    }
    spinCoin();
  };

  const proceedToScoring = (
    teamA: Player[] = teamALineup,
    teamB: Player[] = teamBLineup,
    unassigned: Player[] = draftPlayerPool
  ) => {
    const winner = tossResult === tossCall ? tossCaller : (tossCaller === 'A' ? 'B' : 'A');
    const tossWinnerName = winner === 'A' ? teamAName.trim() : teamBName.trim();

    // Carry the selected Playing XI through to the console. Keyed by team NAME
    // rather than A/B, because the console re-resolves squads on every innings
    // swap and would otherwise hand the wrong list to the wrong side.
    const lineup: Record<string, Player[]> = {};
    if (teamA.length > 0) lineup[teamAName.trim().toLowerCase()] = teamA;
    if (teamB.length > 0) lineup[teamBName.trim().toLowerCase()] = teamB;

    router.push({
      pathname: '/scoring',
      params: {
        sport: selectedSport.toLowerCase(),
        teamA: teamAName.trim(),
        teamB: teamBName.trim(),
        tossWinner: tossWinnerName,
        decision: tossDecision,
        totalOvers: totalOversInput.trim() || '5',
        autoWide: autoWideRule ? '1' : '0',
        autoNoBall: autoNoBallRule ? '1' : '0',
        allowByes: allowByesRule ? '1' : '0',
        ...(Object.keys(lineup).length > 0 ? { lineup: JSON.stringify(lineup) } : {}),
        ...(unassigned && unassigned.length > 0 ? { pool: JSON.stringify(unassigned) } : {}),
      },
    });
  };

  const handleStartMatch = () => {
    if (!validateTeamsAndMatch()) {
      Alert.alert('Validation Error', 'Please specify valid team names and overs before starting.');
      return;
    }

    if (!tossResult) {
      Alert.alert('Toss Required', 'Please tap "Toss the Coin" to determine the toss winner first.');
      return;
    }

    if (!tossDecision) {
      Alert.alert('Decision Required', 'Please select whether the toss winner chooses to Bat or Bowl.');
      return;
    }

    // Automatically show Select Playing XI when clicking Start the Match
    setIsPlayerSelectionOpen(true);
  };

  const isTeamAValid = Boolean(teamAName && teamAName.trim().length > 0);
  const isTeamBValid = Boolean(teamBName && teamBName.trim().length > 0);
  const areTeamsValid = isTeamAValid && isTeamBValid && teamAName.trim().toLowerCase() !== teamBName.trim().toLowerCase();
  const isTossDone = Boolean(tossResult);
  const isRolePicked = Boolean(tossDecision && tossDecision.trim().length > 0);
  const canStartMatch = areTeamsValid && isTossDone && isRolePicked;

  const winner = tossResult === tossCall ? tossCaller : (tossCaller === 'A' ? 'B' : 'A');
  const tossWinnerName = winner === 'A' ? (teamAName.trim() || 'Team A') : (teamBName.trim() || 'Team B');

  const matchedTeamA = teams.find((t) => t.name.toLowerCase() === teamAName.trim().toLowerCase());
  const matchedTeamB = teams.find((t) => t.name.toLowerCase() === teamBName.trim().toLowerCase());

  const userPlayer: Player[] = profile?.name ? [{
    id: 'logged-in-user',
    name: profile.name,
    skillLevel: profile.skillLevel || 'Intermediate',
    phone: profile.phone,
    avatarUrl: profile.avatarUrl,
  } as Player] : [];

  const allCandidatePool: Player[] = dedupePlayers([
    ...userPlayer,
    ...playerPool,
    ...(matchedTeamA?.players || []),
    ...(matchedTeamB?.players || []),
  ]);

  const assignedSet = new Set([
    ...teamALineup.map((p) => (typeof p === 'string' ? p : p.name).trim().toLowerCase()),
    ...teamBLineup.map((p) => (typeof p === 'string' ? p : p.name).trim().toLowerCase()),
  ]);

  const draftPlayerPool: Player[] = allCandidatePool.filter(
    (p) => !assignedSet.has((typeof p === 'string' ? p : p.name).trim().toLowerCase())
  );

  // Home-dashboard palette — the same accents the player dashboard tints with.
  const accent = '#F59E0B';
  const info = '#3B82F6';
  const success = '#10B981';
  const danger = '#ef4444';

  const setupSteps = [areTeamsValid, isTossDone, isRolePicked].filter(Boolean).length;
  const oversLabel = totalOversInput.trim() || '5';

  const heroTone = canStartMatch ? success : theme.primary;
  const heroBadge = canStartMatch
    ? 'READY TO START'
    : isTossDone
      ? 'TOSS DONE'
      : areTeamsValid
        ? 'TEAMS SET'
        : 'QUICK MATCH';
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
        { value: 'Bat', label: '🏏 Batting', scroll: true },
        { value: 'Bowl', label: '🥎 Bowling', scroll: true },
      ]
    : [
        { value: 'Kickoff', label: '⚽ Serve / Kickoff', scroll: false },
        { value: 'Receive', label: '🛡️ Receive / Side', scroll: false },
      ];

  const cardSurface = {
    backgroundColor: theme.surfaceLowest,
    borderColor: theme.outlineVariant + '33',
  };
  const webNoOutline = Platform.select({ web: { outlineStyle: 'none', outlineWidth: 0 } as any });

  const renderLabel = (
    label: string,
    opts?: { required?: boolean; hint?: string; hintTone?: string },
  ) => (
    <View style={styles.labelRow}>
      <View style={styles.labelLeft}>
        <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>{label}</ThemedText>
        {opts?.required ? (
          <ThemedText style={[styles.required, { color: danger }]}>*</ThemedText>
        ) : null}
      </View>
      {opts?.hint ? (
        <ThemedText style={[styles.fieldHint, { color: opts.hintTone ?? theme.textSecondary }]}>
          {opts.hint}
        </ThemedText>
      ) : null}
    </View>
  );

  const renderTeamSlot = (slot: 'A' | 'B') => {
    const isA = slot === 'A';
    const name = isA ? teamAName : teamBName;
    const otherName = isA ? teamBName : teamAName;
    const error = isA ? teamAError : teamBError;
    const query = isA ? searchQueryA : searchQueryB;
    const open = isA ? dropdownAOpen : dropdownBOpen;
    const options = isA ? filteredTeamsA : filteredTeamsB;
    const matched = isA ? matchedTeamA : matchedTeamB;
    const setName = isA ? setTeamAName : setTeamBName;
    const setQuery = isA ? setSearchQueryA : setSearchQueryB;
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
                borderColor: error ? danger : name ? theme.primary : theme.outlineVariant + '99',
              },
              webNoOutline,
            ]}
            value={query}
            placeholder={`Team ${slot} name *`}
            placeholderTextColor="#94a3b8"
            onChangeText={(val) => {
              setQuery(val);
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
              setTossResult(null);
              setTossDecision('');
            }}
            onFocus={() => {
              setOpen(true);
              setOtherOpen(false);
            }}
            onBlur={() => {
              setTimeout(() => setOpen(false), 250);
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
                webNoOutline,
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

              <ScrollView style={{ maxHeight: 160 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
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
                    <Image source={getMascotAsset(team.mascot || 'lion')} style={styles.menuMascot} contentFit="contain" />
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
    <View style={[styles.container, { paddingBottom: bottomInset, backgroundColor: theme.background }]}>
      {/* Ambient wash behind the hero band, as on the player home dashboard */}
      <LinearGradient
        colors={[theme.primary + '1F', theme.primary + '08', 'transparent']}
        style={styles.ambient}
        pointerEvents="none"
      />

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        style={styles.scrollArea}
        bounces={true}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        {/* ── MATCH HERO: status, teams with the coin between them, toss call ──
            Everything needed to toss lives in this first card so the coin is
            on screen without scrolling. */}
        <View style={[styles.section, styles.firstSection, { zIndex: (dropdownAOpen || dropdownBOpen) ? 100 : 1 }]}>
          <View style={[styles.heroCard, cardSurface, Shadows.level2]}>
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
                size={64}
                glow={[theme.primary + '33', theme.primary + '00']}
                accents={[
                  { name: 'flash', color: theme.primary },
                  { name: 'trophy', color: accent },
                  { name: 'star', color: info },
                ]}
                accessibilityLabel="Quick match illustration"
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
                      { transform: [{ rotateY: coinSpin }, { translateY: coinLift }] },
                    ]}
                  >
                    <LinearGradient colors={['#FFE259', '#FACC15', '#FFE259']} style={styles.coinFace}>
                      <ThemedText style={styles.coinSymbol}>{displaySide === 'HEADS' ? 'H' : 'T'}</ThemedText>
                    </LinearGradient>
                  </Animated.View>
                </Pressable>
                <ThemedText style={[styles.coinHint, { color: isFlipping ? accent : theme.textSecondary }]}>
                  {isFlipping ? 'Flipping…' : tossResult ? (tossResult === 'HEADS' ? 'Heads' : 'Tails') : 'Tap to toss'}
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

            {tossResult && (
              <View style={[styles.resultPanel, { backgroundColor: theme.primary + '0A', borderColor: theme.primary + '26' }]}>
                <View style={styles.resultHead}>
                  <View style={[styles.statusPill, { backgroundColor: accent + '22' }]}>
                    <Ionicons name="sparkles" size={10} color={accent} />
                    <ThemedText style={[styles.statusText, { color: '#B45309' }]}>Landed {tossResult}</ThemedText>
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
                          if (opt.scroll) {
                            setTimeout(() => {
                              scrollViewRef.current?.scrollToEnd({ animated: true });
                            }, 120);
                          }
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
        </View>

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
                      Alert.alert('Cricket Only Mode', `${sport.name} matches will be enabled in a future update.`);
                      return;
                    }
                    handleSportChange(sport.name);
                  }}
                  style={({ pressed }) => [
                    styles.sportPill,
                    isActive
                      ? { backgroundColor: theme.primary, borderColor: theme.primary }
                      : { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '55' },
                    !isActive && Shadows.level1,
                    { opacity: isDisabled ? 0.45 : pressed ? 0.85 : 1 },
                  ]}
                >
                  <MaterialIcons
                    name={sport.icon as any}
                    size={14}
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
                  <ThemedText style={[styles.fieldHint, { color: theme.textSecondary, marginLeft: 5 }]}>Optional</ThemedText>
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
                    webNoOutline,
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
                  <View
                    style={[
                      styles.turfMenu,
                      { backgroundColor: theme.surfaceLowest, borderColor: theme.primary + '55' },
                      webNoOutline,
                    ]}
                  >
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
                  webNoOutline,
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
        {Boolean(tossResult && tossDecision) && (
          <View style={styles.section}>
            <SectionHeading title="Match rules" tint={theme.primary} />
            <View style={[styles.card, cardSurface, Shadows.level1]}>
              <View style={styles.cardTitleRow}>
                <View style={[styles.cardIcon, { backgroundColor: theme.primary + '1A' }]}>
                  <Ionicons name="options-outline" size={15} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={[styles.cardTitle, { color: theme.text }]}>Pre-match rules</ThemedText>
                  <ThemedText style={[styles.cardSub, { color: theme.textSecondary }]}>
                    Confirm the overs before you start
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
                      value={customOversValue}
                      onChangeText={(val) => {
                        const cleaned = val.replace(/[^0-9]/g, '').slice(0, 2);
                        if (!cleaned) {
                          setCustomOversValue('');
                          return;
                        }
                        const num = parseInt(cleaned, 10);
                        const capped = num > 50 ? '50' : String(num);
                        setCustomOversValue(capped);
                        setTotalOversInput(capped);
                      }}
                      placeholder="Overs (≤50)"
                      placeholderTextColor="#94a3b8"
                      keyboardType="number-pad"
                      maxLength={2}
                      autoFocus
                      style={[styles.customOversInput, { color: theme.text }, webNoOutline]}
                    />
                    <Pressable onPress={() => setIsCustomOversSelected(false)} hitSlop={6} style={{ padding: 1 }}>
                      <Ionicons name="close-circle" size={14} color="#94a3b8" />
                    </Pressable>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Toss or Start Action Button ─────────────────────────── */}
      <View style={[styles.actionsContainer, { backgroundColor: theme.surfaceLowest, borderTopColor: theme.outlineVariant + '33' }]}>
        {!tossResult ? (
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
                {!areTeamsValid ? 'Enter both team names to toss' : `${selectedSport} · ${totalOversInput ? `${totalOversInput} Overs` : (customFormat || selectedFormat)}`}
              </ThemedText>
            </View>
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <ThemedText style={{ fontSize: 15 }}>🪙</ThemedText>
            </View>
          </Pressable>
        ) : !canStartMatch ? (
          <Pressable
            onPress={() => {
              if (!areTeamsValid) {
                validateTeamsAndMatch();
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
              <Ionicons name="lock-closed" size={14} color={theme.textSecondary} />
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
              <Ionicons name="play" size={15} color="#ffffff" />
            </View>
          </Pressable>
        )}
      </View>

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

            {/* Day Names Row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginVertical: 4 }}>
              {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day) => (
                <ThemedText key={day} style={{ width: 36, textAlign: 'center', fontSize: 12, fontFamily: 'Sora_500Medium', color: theme.textSecondary }}>
                  {day}
                </ThemedText>
              ))}
            </View>

            {/* Calendar Days Grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
              {[...Array(5)].map((_, i) => (
                <View key={`empty-${i}`} style={{ width: '14.28%', height: 38 }} />
              ))}
              {[...Array(31)].map((_, i) => {
                const dayNum = i + 1;
                const isSelected = selectedDay === dayNum;
                const todayDate = new Date().getDate();
                const isPastDay = dayNum < todayDate;
                return (
                  <View key={dayNum} style={{ width: '14.28%', height: 38, justifyContent: 'center', alignItems: 'center' }}>
                    <Pressable
                      disabled={isPastDay}
                      onPress={() => {
                        setSelectedDay(dayNum);
                        const matchTimes = ['6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM'];
                        const targetD = new Date(new Date().getFullYear(), new Date().getMonth(), dayNum);
                        if (isTimeSlotPassed(tempTime, targetD)) {
                          const firstValid = matchTimes.find(t => !isTimeSlotPassed(t, targetD));
                          if (firstValid) setTempTime(firstValid);
                        }
                      }}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: isSelected ? theme.primary : 'transparent',
                        justifyContent: 'center',
                        alignItems: 'center',
                        opacity: isPastDay ? 0.35 : 1,
                      }}
                    >
                      <ThemedText
                        style={{
                          color: isSelected ? '#ffffff' : isPastDay ? theme.textSecondary : theme.text,
                          fontSize: 13,
                          fontFamily: isSelected ? 'Sora_600SemiBold' : 'Sora_500Medium',
                        }}
                      >
                        {dayNum}
                      </ThemedText>
                    </Pressable>
                  </View>
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

              {/* Favourite Team Toggle (Max 2 allowed per user) */}
              <View style={styles.modalInputGroup}>
                <Pressable
                  onPress={() => {
                    if (isFavLimitReached) {
                      if (Platform.OS === 'web') {
                        alert('Per user allowed to create up to 2 teams as Favourite Team.');
                      } else {
                        Alert.alert('Favourite Limit Reached', 'Per user allowed to create up to 2 teams as Favourite Team.');
                      }
                      return;
                    }
                    setNewIsFavourite(!newIsFavourite);
                  }}
                  disabled={isFavLimitReached}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    alignSelf: 'flex-start',
                    gap: 6,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 8,
                    backgroundColor: isFavLimitReached
                      ? '#f1f5f9'
                      : newIsFavourite ? '#FFE25920' : theme.surfaceLow,
                    borderWidth: 1,
                    borderColor: isFavLimitReached
                      ? '#cbd5e1'
                      : newIsFavourite ? '#FFA751' : theme.outlineVariant + '44',
                    marginTop: 8,
                    opacity: isFavLimitReached ? 0.6 : 1,
                  }}
                >
                  <Ionicons
                    name={isFavLimitReached ? "star-outline" : newIsFavourite ? "star" : "star-outline"}
                    size={13}
                    color={isFavLimitReached ? "#94a3b8" : newIsFavourite ? "#FFA751" : theme.textSecondary}
                  />
                  <ThemedText style={{
                    fontFamily: 'Sora_500Medium',
                    fontSize: 10.5,
                    color: isFavLimitReached ? "#94a3b8" : newIsFavourite ? "#FFA751" : theme.textSecondary
                  }}>
                    {isFavLimitReached
                      ? 'Favourite Limit Reached (2/2)'
                      : newIsFavourite
                      ? `Favourite Team (${favTeamsForNewPhone.length + 1}/2)`
                      : `Favourite Team (${favTeamsForNewPhone.length}/2)`}
                  </ThemedText>
                </Pressable>
                {isFavLimitReached ? (
                  <ThemedText style={{ color: '#ef4444', fontSize: 9.5, marginTop: 4, fontFamily: 'Sora_500Medium' }}>
                    ⚠️ Limit reached: Per user allowed to create up to 2 teams as Favourite Team.
                  </ThemedText>
                ) : (
                  <ThemedText style={{ color: theme.textSecondary, fontSize: 9.5, marginTop: 4, fontFamily: 'Sora_500Medium' }}>
                    💡 Per user allowed to create up to 2 teams as Favourite Team (shown at top of selection lists).
                  </ThemedText>
                )}
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={[styles.modalActions, { borderTopColor: theme.outlineVariant + '44' }]}>
              <Pressable
                onPress={() => setIsNewTeamModalOpen(false)}
                style={[styles.modalBtn, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '66', borderWidth: 1 }]}
              >
                <ThemedText style={{ color: theme.text, fontFamily: 'Sora_500Medium', fontSize: 12 }}>Cancel</ThemedText>
              </Pressable>
              <Pressable
                onPress={handleCreateTeamFromModal}
                style={[styles.modalBtn, { backgroundColor: theme.primary }]}
              >
                <ThemedText style={{ color: '#ffffff', fontFamily: 'Sora_500Medium', fontSize: 12 }}>Create Team</ThemedText>
              </Pressable>
            </View>

          </View>
        </View>
      </Modal>

      {/* ── Playing XI Selection (drag-and-drop, skippable) ── */}
      <PlayerSelectionModal
        visible={isPlayerSelectionOpen}
        isInitialSetup={true}
        teamAName={teamAName}
        teamBName={teamBName}
        initialPool={draftPlayerPool}
        initialTeamA={teamALineup}
        initialTeamB={teamBLineup}
        onClose={() => setIsPlayerSelectionOpen(false)}
        onSkip={() => {
          setIsPlayerSelectionOpen(false);
          proceedToScoring(teamALineup, teamBLineup);
        }}
        onConfirm={(teamA, teamB, unassigned) => {
          setTeamALineup(teamA);
          setTeamBLineup(teamB);
          setPlayerPool(unassigned);
          setLineupConfigured(teamA.length > 0 || teamB.length > 0);
          setIsPlayerSelectionOpen(false);
          proceedToScoring(teamA, teamB, unassigned);
        }}
      />
    </View>
  );
}

const GUTTER = Spacing.containerMargin;
const CARD_RADIUS = BorderRadius.premium;
const HERO_RADIUS = 20;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollArea: { flex: 1 },
  scroll: { paddingTop: 6, paddingBottom: 18 },
  ambient: { position: 'absolute', top: 0, left: 0, right: 0, height: 300 },

  section: { paddingHorizontal: GUTTER, marginTop: 14 },
  firstSection: { marginTop: 4 },

  // hero match card — dashboard hero band with the toss built in
  heroCard: { borderRadius: HERO_RADIUS, borderWidth: 1, padding: 12 },
  heroHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  heroText: { flex: 1, paddingRight: 8 },
  heroBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 5,
  },
  heroBadgeText: { fontFamily: 'Sora_500Medium', fontSize: 8.5, letterSpacing: 0.8 },
  heroTitle: { fontFamily: 'Sora_500Medium', fontSize: 15.5 },
  heroSub: { fontFamily: 'Sora_400Regular', fontSize: 11, marginTop: 1, lineHeight: 15 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 7 },
  progressTrack: { flex: 1, height: 5, borderRadius: 999, overflow: 'hidden', flexDirection: 'row' },
  progressFill: { borderRadius: 999 },
  progressText: { fontFamily: 'Sora_500Medium', fontSize: 9.5 },

  // cards
  card: {
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    padding: 12,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  cardIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: 'Sora_500Medium', fontSize: 13 },
  cardSub: { fontFamily: 'Sora_400Regular', fontSize: 10.5, marginTop: 1 },
  divider: { height: 1, marginVertical: 10 },

  // labels
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  labelLeft: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  fieldLabel: {
    fontFamily: 'Sora_500Medium',
    fontSize: 9,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  required: { fontFamily: 'Sora_500Medium', fontSize: 11, marginLeft: 3 },
  fieldHint: { fontFamily: 'Sora_400Regular', fontSize: 10 },

  // sport chips
  chipStrip: { gap: 6, paddingVertical: 2, paddingRight: GUTTER },
  sportPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 32,
    borderRadius: 999,
    borderWidth: 1,
  },
  sportPillText: { fontFamily: 'Sora_500Medium', fontSize: 11 },

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
    textAlign: 'center',
    fontFamily: 'Sora_500Medium',
    fontSize: 10.5,
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
  menuMascot: { width: 16, height: 16, borderRadius: 3 },
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
  coinCol: { width: 76, alignItems: 'center' },
  vsText: { fontFamily: 'Sora_500Medium', fontSize: 8.5, letterSpacing: 1, marginBottom: 3 },
  coin: {
    width: 58,
    height: 58,
    borderRadius: 29,
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
  coinFace: { width: '100%', height: '100%', borderRadius: 29, alignItems: 'center', justifyContent: 'center' },
  coinSymbol: { fontFamily: 'Sora_500Medium', fontSize: 18.5, color: '#1C2939' },
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
  togglePillText: { fontFamily: 'Sora_500Medium', fontSize: 11, textAlign: 'center' },
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
  inputField: { flex: 1, fontFamily: 'Sora_400Regular', fontSize: 11, paddingVertical: 0 },
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
  resultPanel: {
    marginTop: 10,
    padding: 9,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
  },
  resultHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
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
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  oversPillText: { fontFamily: 'Sora_500Medium', fontSize: 10.5 },
  customOvers: { width: 96, paddingHorizontal: 10 },
  customOversInput: {
    flex: 1,
    fontFamily: 'Sora_500Medium',
    fontSize: 10.5,
    padding: 0,
    height: 20,
  },

  // fixed action bar
  actionsContainer: {
    paddingHorizontal: GUTTER,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  actionBtn: {
    height: 50,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 20,
    paddingRight: 8,
    ...Shadows.level2,
  },
  actionBtnLocked: { borderWidth: 1, shadowOpacity: 0, elevation: 0 },
  actionText: { flex: 1 },
  actionTitle: { fontFamily: 'Sora_500Medium', fontSize: 13.5 },
  actionSub: { fontFamily: 'Sora_400Regular', fontSize: 9.5, marginTop: 1 },
  actionIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // new-team modal
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
  modalRow: { flexDirection: 'row', gap: 10 },
  input: {
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontFamily: 'Sora_400Regular',
    fontSize: 11,
    includeFontPadding: false,
    paddingVertical: 0,
  },
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
