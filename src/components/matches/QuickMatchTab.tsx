import React, { useRef, useState, useEffect } from 'react';
import { ThemedText } from '@/components/themed-text';
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

import { SPORTS_LIST } from '@/constants/sports';
import { isTimeSlotPassed } from '@/utils/date-utils';

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
  const scrollViewRef = useRef<ScrollView>(null);

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
  const [newPhone, setNewPhone] = useState(profile.phone || '9876543210');
  const [newMascot, setNewMascot] = useState('lion');
  const [newIsFavourite, setNewIsFavourite] = useState(false);

  const openNewTeamModal = (slot: 'A' | 'B') => {
    setAddingForTeam(slot);
    // Allow user to enter custom team name (do not prefill from user profile)
    setNewTeamName('');
    setNewShortName('');
    // Automatically place logged-in user phone
    const autoPhone = profile.phone || '9876543210';
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
    if (!newTeamName.trim() || !newShortName.trim() || !newPhone.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
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
  const [totalOversInput, setTotalOversInput] = useState('20');
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
      // Auto-scroll layout to ensure the result banner and decision options are fully focused
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
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

  const proceedToScoring = (teamA: Player[] = teamALineup, teamB: Player[] = teamBLineup) => {
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
        totalOvers: totalOversInput.trim() || '20',
        autoWide: autoWideRule ? '1' : '0',
        autoNoBall: autoNoBallRule ? '1' : '0',
        allowByes: allowByesRule ? '1' : '0',
        ...(Object.keys(lineup).length > 0 ? { lineup: JSON.stringify(lineup) } : {}),
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

  // Draft pool for the player-selection sheet: the saved-team rosters for
  // whichever teams are currently matched, plus anything already in the pool
  // (manually-added guests, previously confirmed picks) so re-opening the
  // sheet doesn't drop them.
  // Deduped by person, not by id: the logged-in captain is auto-seeded into
  // every team they create, so the same human carries a different synthetic id
  // in each roster and an id-only merge listed them once per team.
  const matchedTeamA = teams.find((t) => t.name.toLowerCase() === teamAName.trim().toLowerCase());
  const matchedTeamB = teams.find((t) => t.name.toLowerCase() === teamBName.trim().toLowerCase());
  const draftPlayerPool: Player[] = dedupePlayers([
    ...playerPool,
    ...(matchedTeamA?.players || []),
    ...(matchedTeamB?.players || []),
  ]);

  return (
    <View style={[styles.container, { paddingBottom: bottomInset }]}>
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingVertical: 6 }]}
        style={styles.scrollArea}
        bounces={false}
      >
        {/* ── SPORT SELECTION (Top horizontal chips) ── */}
        <View style={{ marginBottom: 8 }}>
          <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: '#64748b', marginBottom: 4 }}>
            Sports
          </ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 1 }}>
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
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: 6,
                    borderWidth: 1.5,
                    backgroundColor: isActive ? '#5D68E8' : '#ffffff',
                    borderColor: isActive ? '#5D68E8' : '#e2e8f0',
                    gap: 6,
                    opacity: isDisabled ? 0.45 : 1,
                  }}
                >
                  <MaterialIcons
                    name={sport.icon as any}
                    size={14}
                    color={isActive ? '#ffffff' : '#64748b'}
                  />
                  <ThemedText
                    style={{
                      fontSize: 11,
                      fontFamily: isActive ? 'Sora_600SemiBold' : 'Sora_600SemiBold',
                      color: isActive ? '#ffffff' : '#475569',
                    }}
                  >
                    {sport.name}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
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
                <ThemedText style={{ fontSize: 16, fontFamily: 'Sora_500Medium', color: theme.text }}>
                  Select Start Date
                </ThemedText>
              </View>
              <Pressable onPress={() => setShowDateTimePicker(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={22} color={theme.text} />
              </Pressable>
            </View>

            {/* Month Navigation Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, marginTop: 4 }}>
              <Pressable style={{ padding: 6 }}>
                <Ionicons name="chevron-back" size={20} color={theme.text} />
              </Pressable>
              <ThemedText style={{ fontSize: 16, fontFamily: 'Sora_500Medium', color: theme.text }}>
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
              <ThemedText style={{ fontSize: 11.5, fontFamily: 'Sora_500Medium', color: theme.textSecondary, marginBottom: 8 }}>
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
                        borderRadius: 6,
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
              style={{ backgroundColor: theme.primary, paddingVertical: 13, borderRadius: 8, alignItems: 'center', marginTop: 4 }}
            >
              <ThemedText style={{ color: '#ffffff', fontSize: 13.5, fontFamily: 'Sora_500Medium' }}>
                Confirm Timing ({selectedDay} Aug 2026, {tempTime})
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>

        {/* ── MATCH VS CARD ── */}
        <View
          style={{
            backgroundColor: '#f8fafc',
            borderRadius: 10,
            borderWidth: 1,
            borderColor: '#e2e8f0',
            paddingHorizontal: 10,
            paddingVertical: 8,
            marginBottom: 8,
            zIndex: (dropdownAOpen || dropdownBOpen) ? 100 : 1,
            overflow: (dropdownAOpen || dropdownBOpen) ? 'visible' : 'hidden',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: (dropdownAOpen || dropdownBOpen) ? 100 : 1 }}>
            {/* Team A Slot */}
            <View style={{ flex: 1, alignItems: 'center', zIndex: dropdownAOpen ? 100 : 1 }}>
              <Pressable
                onPress={() => openNewTeamModal('A')}
                style={{
                  width: 40, height: 40, borderRadius: 6,
                  backgroundColor: '#ffffff',
                  borderWidth: 1.5,
                  borderColor: '#5D68E8',
                  justifyContent: 'center', alignItems: 'center',
                  marginBottom: 2,
                  position: 'relative',
                }}
              >
                {(() => {
                  const matchedTeam = teams.find(t => t.name.toLowerCase() === teamAName.trim().toLowerCase());
                  if (matchedTeam?.mascot) {
                    return <Image source={getMascotAsset(matchedTeam.mascot)} style={{ width: 26, height: 26 }} contentFit="contain" />;
                  }
                  return (
                    <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: '#5D68E8', letterSpacing: 0.5 }}>
                      {generateShortName(teamAName) || 'TA'}
                    </ThemedText>
                  );
                })()}
                <View style={{ position: 'absolute', bottom: -2, right: -2, backgroundColor: '#5D68E8', borderRadius: 3, padding: 1.5 }}>
                  <Ionicons name="add" size={8} color="#ffffff" />
                </View>
              </Pressable>
              <Pressable
                onPress={() => openNewTeamModal('A')}
                style={{ marginBottom: 3 }}
              >
                <ThemedText style={{ fontSize: 8.5, color: '#5D68E8', fontFamily: 'Sora_500Medium' }}>
                  + New Team
                </ThemedText>
              </Pressable>

              <View style={{ width: 125, position: 'relative', zIndex: 100 }}>
                <TextInput
                  style={[
                    {
                      backgroundColor: '#ffffff',
                      borderWidth: 1.5,
                      borderColor: teamAError ? '#ef4444' : (teamAName ? '#5D68E8' : '#cbd5e1'),
                      color: '#0f172a',
                      textAlign: 'center',
                      fontSize: 10.5,
                      fontFamily: 'Sora_500Medium',
                      height: 30,
                      borderRadius: 6,
                      paddingHorizontal: 6,
                    },
                    Platform.select({ web: { outlineStyle: 'none', outlineWidth: 0 } as any }),
                  ]}
                  value={searchQueryA}
                  placeholder="Team A Name *"
                  placeholderTextColor="#94a3b8"
                  onChangeText={(val) => {
                    setSearchQueryA(val);
                    setTeamAName(val);
                    if (val.trim()) {
                      setTeamAError('');
                      if (teamBName.trim() && val.trim().toLowerCase() === teamBName.trim().toLowerCase()) {
                        setTeamAError('Teams must be different');
                      } else {
                        setTeamBError('');
                      }
                    }
                    setDropdownAOpen(true);
                    setDropdownBOpen(false);
                    setTossResult(null);
                    setTossDecision('');
                  }}
                  onFocus={() => {
                    setDropdownAOpen(true);
                    setDropdownBOpen(false);
                  }}
                  onBlur={() => {
                    setTimeout(() => setDropdownAOpen(false), 250);
                  }}
                />
                {teamAError !== '' && (
                  <ThemedText style={{ color: '#ef4444', fontSize: 8.5, textAlign: 'center', marginTop: 1, fontFamily: 'Sora_500Medium' }}>
                    {teamAError}
                  </ThemedText>
                )}

                {dropdownAOpen && (
                  <View style={[
                    {
                      position: 'absolute',
                      left: 0,
                      // Narrower than before — the anchor input is only 125px wide in
                      // this compact two-column layout, and a full 200px panel spilled
                      // 75px past it into the "VS" divider on narrow phones.
                      width: 170,
                      top: 34,
                      backgroundColor: '#ffffff',
                      borderRadius: 6,
                      borderWidth: 1.5,
                      borderColor: '#e2e8f0',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.15,
                      shadowRadius: 10,
                      elevation: 10,
                      zIndex: 999,
                      overflow: 'hidden',
                    },
                    Platform.select({ web: { outlineStyle: 'none', outlineWidth: 0 } as any }),
                  ]}>
                    <Pressable
                      style={({ pressed }) => [{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingVertical: 8,
                        paddingHorizontal: 10,
                        borderBottomWidth: 1,
                        borderBottomColor: '#f1f5f9',
                        backgroundColor: pressed ? '#f0f3ff' : '#f8fafc',
                      }]}
                      onPress={() => openNewTeamModal('A')}
                    >
                      <Ionicons name="add-circle" size={14} color="#5D68E8" />
                      <ThemedText style={{ color: '#5D68E8', fontFamily: 'Sora_500Medium', fontSize: 10.5 }}>
                        Add New Team
                      </ThemedText>
                    </Pressable>

                    <ScrollView style={{ maxHeight: 160 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                      {filteredTeamsA.map((team) => (
                        <Pressable
                          key={team.id}
                          style={({ pressed }) => [{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                            paddingVertical: 7,
                            paddingHorizontal: 10,
                            borderBottomWidth: 1,
                            borderBottomColor: '#f1f5f9',
                            backgroundColor: team.isFavourite
                              ? pressed ? '#fef3c7' : '#fffdf5'
                              : pressed ? '#f8fafc' : '#ffffff',
                          }]}
                          onPress={() => selectTeamForSlot('A', team.name)}
                        >
                          <Image source={getMascotAsset(team.mascot || 'lion')} style={{ width: 16, height: 16, borderRadius: 3 }} contentFit="contain" />
                          <ThemedText style={{ color: '#0f172a', fontSize: 10.5, fontFamily: team.isFavourite ? 'Sora_600SemiBold' : 'Sora_500Medium', flex: 1 }} numberOfLines={1}>
                            {team.name}
                          </ThemedText>
                          {team.isFavourite && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: '#fef3c7', paddingHorizontal: 4, paddingVertical: 1.5, borderRadius: 3 }}>
                              <FavouriteTeamIcon size={9} />
                              <ThemedText style={{ color: '#d97706', fontSize: 7.5, fontFamily: 'Sora_500Medium' }}>FAV</ThemedText>
                            </View>
                          )}
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>

            {/* VS Center */}
            <ThemedText style={{ color: '#94a3b8', fontSize: 11, fontFamily: 'Sora_500Medium', letterSpacing: 1, marginHorizontal: 2 }}>
              VS
            </ThemedText>

            {/* Team B Slot */}
            <View style={{ flex: 1, alignItems: 'center', zIndex: dropdownBOpen ? 100 : 1 }}>
              <Pressable
                onPress={() => openNewTeamModal('B')}
                style={{
                  width: 40, height: 40, borderRadius: 6,
                  backgroundColor: '#ffffff',
                  borderWidth: 1.5,
                  borderColor: '#5D68E8',
                  justifyContent: 'center', alignItems: 'center',
                  marginBottom: 2,
                  position: 'relative',
                }}
              >
                {(() => {
                  const matchedTeam = teams.find(t => t.name.toLowerCase() === teamBName.trim().toLowerCase());
                  if (matchedTeam?.mascot) {
                    return <Image source={getMascotAsset(matchedTeam.mascot)} style={{ width: 26, height: 26 }} contentFit="contain" />;
                  }
                  return (
                    <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: '#5D68E8', letterSpacing: 0.5 }}>
                      {generateShortName(teamBName) || 'TB'}
                    </ThemedText>
                  );
                })()}
                <View style={{ position: 'absolute', bottom: -2, right: -2, backgroundColor: '#5D68E8', borderRadius: 3, padding: 1.5 }}>
                  <Ionicons name="add" size={8} color="#ffffff" />
                </View>
              </Pressable>
              <Pressable
                onPress={() => openNewTeamModal('B')}
                style={{ marginBottom: 3 }}
              >
                <ThemedText style={{ fontSize: 8.5, color: '#5D68E8', fontFamily: 'Sora_500Medium' }}>
                  + New Team
                </ThemedText>
              </Pressable>

              <View style={{ width: 125, position: 'relative', zIndex: 100 }}>
                <TextInput
                  style={[
                    {
                      backgroundColor: '#ffffff',
                      borderWidth: 1.5,
                      borderColor: teamBError ? '#ef4444' : (teamBName ? '#5D68E8' : '#cbd5e1'),
                      color: '#0f172a',
                      textAlign: 'center',
                      fontSize: 10.5,
                      fontFamily: 'Sora_500Medium',
                      height: 30,
                      borderRadius: 6,
                      paddingHorizontal: 6,
                    },
                    Platform.select({ web: { outlineStyle: 'none', outlineWidth: 0 } as any }),
                  ]}
                  value={searchQueryB}
                  placeholder="Team B Name *"
                  placeholderTextColor="#94a3b8"
                  onChangeText={(val) => {
                    setSearchQueryB(val);
                    setTeamBName(val);
                    if (val.trim()) {
                      setTeamBError('');
                      if (teamAName.trim() && val.trim().toLowerCase() === teamAName.trim().toLowerCase()) {
                        setTeamBError('Teams must be different');
                      } else {
                        setTeamAError('');
                      }
                    }
                    setDropdownBOpen(true);
                    setDropdownAOpen(false);
                    setTossResult(null);
                    setTossDecision('');
                  }}
                  onFocus={() => {
                    setDropdownBOpen(true);
                    setDropdownAOpen(false);
                  }}
                  onBlur={() => {
                    setTimeout(() => setDropdownBOpen(false), 250);
                  }}
                />
                {teamBError !== '' && (
                  <ThemedText style={{ color: '#ef4444', fontSize: 8.5, textAlign: 'center', marginTop: 1, fontFamily: 'Sora_500Medium' }}>
                    {teamBError}
                  </ThemedText>
                )}

                {dropdownBOpen && (
                  <View style={[
                    {
                      position: 'absolute',
                      right: 0,
                      width: 170,
                      top: 34,
                      backgroundColor: '#ffffff',
                      borderRadius: 6,
                      borderWidth: 1.5,
                      borderColor: '#e2e8f0',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.15,
                      shadowRadius: 10,
                      elevation: 10,
                      zIndex: 999,
                      overflow: 'hidden',
                    },
                    Platform.select({ web: { outlineStyle: 'none', outlineWidth: 0 } as any }),
                  ]}>
                    <Pressable
                      style={({ pressed }) => [{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingVertical: 8,
                        paddingHorizontal: 10,
                        borderBottomWidth: 1,
                        borderBottomColor: '#f1f5f9',
                        backgroundColor: pressed ? '#f0f3ff' : '#f8fafc',
                      }]}
                      onPress={() => openNewTeamModal('B')}
                    >
                      <Ionicons name="add-circle" size={14} color="#5D68E8" />
                      <ThemedText style={{ color: '#5D68E8', fontFamily: 'Sora_500Medium', fontSize: 10.5 }}>
                        Add New Team
                      </ThemedText>
                    </Pressable>

                    <ScrollView style={{ maxHeight: 160 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                      {filteredTeamsB.map((team) => (
                        <Pressable
                          key={team.id}
                          style={({ pressed }) => [{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                            paddingVertical: 7,
                            paddingHorizontal: 10,
                            borderBottomWidth: 1,
                            borderBottomColor: '#f1f5f9',
                            backgroundColor: team.isFavourite
                              ? pressed ? '#fef3c7' : '#fffdf5'
                              : pressed ? '#f8fafc' : '#ffffff',
                          }]}
                          onPress={() => selectTeamForSlot('B', team.name)}
                        >
                          <Image source={getMascotAsset(team.mascot || 'lion')} style={{ width: 16, height: 16, borderRadius: 3 }} contentFit="contain" />
                          <ThemedText style={{ color: '#0f172a', fontSize: 10.5, fontFamily: team.isFavourite ? 'Sora_600SemiBold' : 'Sora_500Medium', flex: 1 }} numberOfLines={1}>
                            {team.name}
                          </ThemedText>
                          {team.isFavourite && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: '#fef3c7', paddingHorizontal: 4, paddingVertical: 1.5, borderRadius: 3 }}>
                              <FavouriteTeamIcon size={9} />
                              <ThemedText style={{ color: '#d97706', fontSize: 7.5, fontFamily: 'Sora_500Medium' }}>FAV</ThemedText>
                            </View>
                          )}
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* ── MATCH TIMING, TYPE, & GROUND NAME CONTROLS ── */}
        <View style={{ marginBottom: 8, backgroundColor: theme.surfaceLow, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: theme.outlineVariant + '44' }}>
          {/* Match Timing */}
          <View style={{ marginBottom: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: theme.textSecondary }}>Match Timing</ThemedText>
                <ThemedText style={{ color: '#ef4444', fontSize: 12, fontFamily: 'Sora_500Medium', marginLeft: 3 }}>*</ThemedText>
              </View>

              <Pressable
                onPress={() => setShowDateTimePicker(true)}
                style={({ pressed }) => [
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    backgroundColor: theme.primary + '14',
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 6,
                    opacity: pressed ? 0.85 : 1,
                  }
                ]}
              >
                <Ionicons name="time-outline" size={12} color={theme.primary} />
                <ThemedText style={{ color: theme.primary, fontSize: 11, fontFamily: 'Sora_500Medium' }}>
                  {selectedTiming}
                </ThemedText>
                <Ionicons name="chevron-forward" size={11} color={theme.primary} />
              </Pressable>
            </View>
          </View>

          {/* Type Toggle */}
          <View style={{ marginBottom: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
              <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: theme.textSecondary }}>Type</ThemedText>
              <ThemedText style={{ color: '#ef4444', fontSize: 12, fontFamily: 'Sora_500Medium', marginLeft: 3 }}>*</ThemedText>
            </View>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {[
                { label: 'Turf 🌿', value: 'Turf' as const },
                { label: 'Ground 🏟️', value: 'Ground' as const }
              ].map((tType) => {
                const isActive = selectedTurfType === tType.value;
                return (
                  <Pressable
                    key={tType.value}
                    onPress={() => handleTurfTypeChange(tType.value)}
                    style={({ pressed }) => [
                      {
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingVertical: 4.5,
                        borderRadius: 6,
                        backgroundColor: isActive ? theme.primary + '18' : theme.surfaceLowest,
                        borderColor: isActive ? theme.primary : theme.outlineVariant + '40',
                        borderWidth: isActive ? 1.5 : 1,
                        opacity: pressed ? 0.85 : 1,
                      }
                    ]}
                  >
                    <ThemedText style={{ color: isActive ? theme.primary : theme.text, fontSize: 11, fontFamily: isActive ? 'Sora_600SemiBold' : 'Sora_600SemiBold', textAlign: 'center', width: '100%' }}>
                      {tType.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Turf Name (Searchable Dropdown) or Ground Name */}
          {selectedTurfType === 'Turf' ? (
            <View style={{ zIndex: 30, position: 'relative' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: theme.textSecondary }}>Turf Name</ThemedText>
                <ThemedText style={{ color: theme.primary, fontSize: 9.5, fontFamily: 'Sora_500Medium' }}>Search & Select</ThemedText>
              </View>
              <View style={[
                { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surfaceLowest, borderRadius: 6, borderWidth: 1, borderColor: showTurfDropdown ? theme.primary : theme.outlineVariant + '40', paddingHorizontal: 10, height: 32 },
                Platform.select({ web: { outlineStyle: 'none', outlineWidth: 0 } as any }),
              ]}>
                <Ionicons name="search-outline" size={14} color={theme.primary} style={{ marginRight: 6 }} />
                <TextInput
                  style={[
                    { flex: 1, color: theme.text, fontFamily: 'Sora_500Medium', fontSize: 11 },
                    Platform.select({ web: { outlineStyle: 'none', outlineWidth: 0 } as any }),
                  ]}
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
                <Pressable onPress={() => setShowTurfDropdown(!showTurfDropdown)} style={{ padding: 3 }}>
                  <Ionicons name={showTurfDropdown ? "chevron-up" : "chevron-down"} size={13} color={theme.textSecondary} />
                </Pressable>
              </View>

              {/* Dropdown Suggestions */}
              {showTurfDropdown && (
                <View style={[
                  {
                    marginTop: 6,
                    backgroundColor: '#ffffff',
                    borderRadius: 6,
                    borderWidth: 1.5,
                    borderColor: theme.primary,
                    maxHeight: 140,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.12,
                    shadowRadius: 8,
                    elevation: 8,
                    overflow: 'hidden',
                  },
                  Platform.select({ web: { outlineStyle: 'none', outlineWidth: 0 } as any }),
                ]}>
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
                            {
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 6,
                              paddingHorizontal: 10,
                              paddingVertical: 7,
                              borderBottomWidth: idx < turfsList.length - 1 ? 1 : 0,
                              borderBottomColor: '#f1f5f9',
                              backgroundColor: pressed ? '#f1f5f9' : '#ffffff',
                            }
                          ]}
                        >
                          <Ionicons name="location-sharp" size={13} color={theme.primary} />
                          <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: '#0f172a' }}>
                            {tName}
                          </ThemedText>
                        </Pressable>
                      ))}
                  </ScrollView>
                </View>
              )}
            </View>
          ) : (
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: theme.textSecondary }}>Ground Name</ThemedText>
                <ThemedText style={{ color: theme.textSecondary, fontSize: 9.5 }}>Optional</ThemedText>
              </View>
              <View style={[
                { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surfaceLowest, borderRadius: 6, borderWidth: 1, borderColor: theme.outlineVariant + '40', paddingHorizontal: 10, height: 32 },
                Platform.select({ web: { outlineStyle: 'none', outlineWidth: 0 } as any }),
              ]}>
                <Ionicons name="location-outline" size={14} color={theme.textSecondary} style={{ marginRight: 6 }} />
                <TextInput
                  style={[
                    { flex: 1, color: theme.text, fontFamily: 'Sora_500Medium', fontSize: 11 },
                    Platform.select({ web: { outlineStyle: 'none', outlineWidth: 0 } as any }),
                  ]}
                  placeholder="e.g. Marina Cricket Ground"
                  placeholderTextColor="#94a3b8"
                  value={groundName}
                  onChangeText={(text) => {
                    setCustomGroundName(text);
                    setGroundName(text);
                  }}
                />
              </View>
            </View>
          )}
        </View>

        {/* ── CALLER & CALL CONFIGURATION ── */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 6 }}>
          {/* CALLER */}
          <View style={{ flex: 1 }}>
            <ThemedText style={{ fontSize: 9, fontFamily: 'Sora_500Medium', color: '#64748b', marginBottom: 3, textTransform: 'uppercase' }}>
              CALLER:
            </ThemedText>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <Pressable
                onPress={() => setTossCaller('A')}
                style={{
                  flex: 1,
                  paddingVertical: 5,
                  borderRadius: 6,
                  backgroundColor: tossCaller === 'A' ? '#FFE259' : '#ffffff',
                  borderWidth: 1.5,
                  borderColor: tossCaller === 'A' ? '#FFE259' : '#cbd5e1',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_500Medium', color: tossCaller === 'A' ? '#000000' : '#475569' }} numberOfLines={1}>
                  {teamAName.trim() || 'Team A'}
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={() => setTossCaller('B')}
                style={{
                  flex: 1,
                  paddingVertical: 5,
                  borderRadius: 6,
                  backgroundColor: tossCaller === 'B' ? '#FFE259' : '#ffffff',
                  borderWidth: 1.5,
                  borderColor: tossCaller === 'B' ? '#FFE259' : '#cbd5e1',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_500Medium', color: tossCaller === 'B' ? '#000000' : '#475569' }} numberOfLines={1}>
                  {teamBName.trim() || 'Team B'}
                </ThemedText>
              </Pressable>
            </View>
          </View>

          {/* CALL */}
          <View style={{ flex: 1 }}>
            <ThemedText style={{ fontSize: 9, fontFamily: 'Sora_500Medium', color: '#64748b', marginBottom: 3, textTransform: 'uppercase' }}>
              CALL:
            </ThemedText>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <Pressable
                onPress={() => setTossCall('HEADS')}
                style={{
                  flex: 1,
                  paddingVertical: 5,
                  borderRadius: 6,
                  backgroundColor: tossCall === 'HEADS' ? '#FFE259' : '#ffffff',
                  borderWidth: 1.5,
                  borderColor: tossCall === 'HEADS' ? '#FFE259' : '#cbd5e1',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_500Medium', color: tossCall === 'HEADS' ? '#000000' : '#475569' }}>
                  H
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={() => setTossCall('TAILS')}
                style={{
                  flex: 1,
                  paddingVertical: 5,
                  borderRadius: 6,
                  backgroundColor: tossCall === 'TAILS' ? '#FFE259' : '#ffffff',
                  borderWidth: 1.5,
                  borderColor: tossCall === 'TAILS' ? '#FFE259' : '#cbd5e1',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_500Medium', color: tossCall === 'TAILS' ? '#000000' : '#475569' }}>
                  T
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </View>

        {/* ── COIN FLIP CENTER ── */}
        <View style={{ alignItems: 'center', marginVertical: 4 }}>
          <Pressable onPress={handleToss} disabled={isFlipping}>
            <Animated.View
              style={[
                {
                  width: 58,
                  height: 58,
                  borderRadius: 29,
                  backgroundColor: '#FFE259',
                  borderWidth: 3,
                  borderColor: '#EAB308',
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: '#FFE259',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.35,
                  shadowRadius: 8,
                  elevation: 6,
                },
                {
                  transform: [
                    { rotateY: coinSpin },
                    { translateY: coinLift }
                  ]
                }
              ]}
            >
              <LinearGradient
                colors={['#FFE259', '#FACC15', '#FFE259']}
                style={{ width: '100%', height: '100%', borderRadius: 29, justifyContent: 'center', alignItems: 'center' }}
              >
                <ThemedText style={{ fontSize: 24, fontFamily: 'Sora_500Medium', color: '#000000' }}>
                  {displaySide === 'HEADS' ? 'H' : 'T'}
                </ThemedText>
              </LinearGradient>
            </Animated.View>
          </Pressable>

          <ThemedText style={{ fontSize: 9, fontFamily: 'Sora_500Medium', color: '#64748b', marginTop: 3 }}>
            Tap coin or Flip button below to toss
          </ThemedText>
        </View>

        {/* ── Toss Result Banner ─────────────────────────── */}
        {tossResult && (
          <LinearGradient
            colors={[theme.surfaceLowest, '#5D68E80c']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.resultBanner, { borderColor: theme.outlineVariant + '33', borderLeftColor: theme.primary, padding: 8, marginVertical: 4 }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="sparkles" size={14} color="#FFB800" />
                <ThemedText style={[styles.resultTitle, { color: theme.textSecondary, fontSize: 11 }]}>Coin landed</ThemedText>
              </View>
              <View style={{ backgroundColor: theme.primary + '15', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
                <ThemedText style={{ color: theme.primary, fontSize: 9.5, fontFamily: 'Sora_500Medium', letterSpacing: 0.5 }}>{tossResult}</ThemedText>
              </View>
            </View>

            <ThemedText style={[styles.resultSub, { fontSize: 12.5, fontFamily: 'Sora_500Medium', color: theme.text }]}>
              🎉 {tossWinnerName} won the toss!
            </ThemedText>

            <View style={[styles.decisionBox, { marginTop: 4 }]}>
              <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary, marginBottom: 4, fontSize: 9.5 }]}>Choose decision action</ThemedText>
              <View style={styles.decisionOptions}>
                {selectedSport.toLowerCase() === 'cricket' ? (
                  <>
                    <Pressable
                      onPress={() => {
                        setTossDecision('Bat');
                        setTimeout(() => {
                          scrollViewRef.current?.scrollToEnd({ animated: true });
                        }, 120);
                      }}
                      style={[styles.choiceChip, { paddingVertical: 5 }, tossDecision === 'Bat' && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                    >
                      <ThemedText style={[styles.choiceChipText, tossDecision === 'Bat' && { color: '#ffffff' }]}>🏏 Batting</ThemedText>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setTossDecision('Bowl');
                        setTimeout(() => {
                          scrollViewRef.current?.scrollToEnd({ animated: true });
                        }, 120);
                      }}
                      style={[styles.choiceChip, { paddingVertical: 5 }, tossDecision === 'Bowl' && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                    >
                      <ThemedText style={[styles.choiceChipText, tossDecision === 'Bowl' && { color: '#ffffff' }]}>🥎 Bowling</ThemedText>
                    </Pressable>
                  </>
                ) : (
                  <>
                    <Pressable
                      onPress={() => setTossDecision('Kickoff')}
                      style={[styles.choiceChip, { paddingVertical: 5 }, tossDecision === 'Kickoff' && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                    >
                      <ThemedText style={[styles.choiceChipText, tossDecision === 'Kickoff' && { color: '#ffffff' }]}>⚽ Serve / Kickoff</ThemedText>
                    </Pressable>
                    <Pressable
                      onPress={() => setTossDecision('Receive')}
                      style={[styles.choiceChip, { paddingVertical: 5 }, tossDecision === 'Receive' && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                    >
                      <ThemedText style={[styles.choiceChipText, tossDecision === 'Receive' && { color: '#ffffff' }]}>🛡️ Receive / Side</ThemedText>
                    </Pressable>
                  </>
                )}
              </View>
            </View>
          </LinearGradient>
        )}

        {/* ── PRE-MATCH RULES & OVER VERIFICATION CARD (Shown ONLY after Batting or Bowling selection) ── */}
        {Boolean(tossResult && tossDecision) && (
          <View style={{
            backgroundColor: '#f8fafc',
            borderRadius: 12,
            borderWidth: 1.5,
            borderColor: '#e2e8f0',
            padding: 14,
            marginTop: 16,
            marginBottom: 10,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="options-outline" size={16} color="#5D68E8" />
                <ThemedText style={{ fontSize: 13, fontFamily: 'Sora_500Medium', color: '#1e293b' }}>
                  Pre-Match Rules Verification
                </ThemedText>
              </View>
            </View>

            {/* 1. Total Overs Selector (All Options & Custom Input on Same Line) */}
            <View style={{ marginBottom: 12 }}>
              <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_500Medium', color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>
                Total Match Overs:
              </ThemedText>
              <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
                {['5', '7', '12', '20'].map((ov) => {
                  const isSelected = !isCustomOversSelected && totalOversInput === ov;
                  return (
                    <Pressable
                      key={ov}
                      onPress={() => {
                        setIsCustomOversSelected(false);
                        setTotalOversInput(ov);
                      }}
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 5,
                        borderRadius: 6,
                        backgroundColor: isSelected ? '#5D68E8' : '#ffffff',
                        borderWidth: 1,
                        borderColor: isSelected ? '#5D68E8' : '#cbd5e1',
                      }}
                    >
                      <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_500Medium', color: isSelected ? '#ffffff' : '#334155' }}>
                        {ov} Ov
                      </ThemedText>
                    </Pressable>
                  );
                })}

                {/* Custom Over Chip / Inline Input on Same Line */}
                {!isCustomOversSelected ? (
                  <Pressable
                    onPress={() => {
                      setIsCustomOversSelected(true);
                      if (customOversValue) {
                        setTotalOversInput(customOversValue);
                      }
                    }}
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 5,
                      borderRadius: 6,
                      backgroundColor: '#ffffff',
                      borderWidth: 1,
                      borderColor: '#5D68E8',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 3,
                    }}
                  >
                    <Ionicons name="create-outline" size={11} color="#5D68E8" />
                    <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_500Medium', color: '#5D68E8' }}>
                      Custom
                    </ThemedText>
                  </Pressable>
                ) : (
                  <View style={{ width: 75, flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 6, borderWidth: 1.5, borderColor: '#5D68E8', paddingHorizontal: 5, paddingVertical: 2 }}>
                    <TextInput
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
                      style={[
                        {
                          width: 46,
                          fontSize: 10,
                          fontFamily: 'Sora_500Medium',
                          color: '#0f172a',
                          padding: 0,
                          height: 20,
                        },
                        Platform.OS === 'web' && ({ outlineStyle: 'none' } as any),
                      ]}
                    />
                    <Pressable onPress={() => setIsCustomOversSelected(false)} style={{ padding: 1 }}>
                      <Ionicons name="close-circle" size={14} color="#94a3b8" />
                    </Pressable>
                  </View>
                )}
              </View>
            </View>

            {/* 2. Extra Rules Toggles */}
            <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_500Medium', color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>
              Quick Scoring Rules (Auto-Record Extras):
            </ThemedText>

            <View style={{ gap: 6 }}>
              {/* Wide Rule */}
              <Pressable
                onPress={() => setAutoWideRule(!autoWideRule)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#ffffff',
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#e2e8f0',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#F59E0B18', justifyContent: 'center', alignItems: 'center' }}>
                    <ThemedText style={{ fontSize: 8, fontFamily: 'Sora_500Medium', color: '#F59E0B' }}>WD</ThemedText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: '#1e293b' }}>
                      Wide Ball: +1 Extra Run (Auto)
                    </ThemedText>
                    <ThemedText style={{ fontSize: 9, color: '#64748b' }}>
                      Tap = +1 run. Long-press 'WD' to score Wide + 1, 2, 4 overthrows.
                    </ThemedText>
                  </View>
                </View>
                <Ionicons name={autoWideRule ? "checkbox" : "square-outline"} size={18} color={autoWideRule ? '#5D68E8' : '#94a3b8'} />
              </Pressable>

              {/* No Ball Rule */}
              <Pressable
                onPress={() => setAutoNoBallRule(!autoNoBallRule)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#ffffff',
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#e2e8f0',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#F43F5E18', justifyContent: 'center', alignItems: 'center' }}>
                    <ThemedText style={{ fontSize: 8, fontFamily: 'Sora_500Medium', color: '#F43F5E' }}>NB</ThemedText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: '#1e293b' }}>
                      No Ball: +1 Extra Run & Free Hit
                    </ThemedText>
                    <ThemedText style={{ fontSize: 9, color: '#64748b' }}>
                      Tap = +1 run. Long-press 'NB' to credit runs off the bat.
                    </ThemedText>
                  </View>
                </View>
                <Ionicons name={autoNoBallRule ? "checkbox" : "square-outline"} size={18} color={autoNoBallRule ? '#5D68E8' : '#94a3b8'} />
              </Pressable>

              {/* Bye & Leg Bye Rule */}
              <Pressable
                onPress={() => setAllowByesRule(!allowByesRule)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#ffffff',
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#e2e8f0',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#06B6D418', justifyContent: 'center', alignItems: 'center' }}>
                    <ThemedText style={{ fontSize: 8, fontFamily: 'Sora_500Medium', color: '#06B6D4' }}>LB</ThemedText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: '#1e293b' }}>
                      Byes & Leg Byes: Count runs, legal ball
                    </ThemedText>
                    <ThemedText style={{ fontSize: 9, color: '#64748b' }}>
                      Runs counted without extra wide penalty.
                    </ThemedText>
                  </View>
                </View>
                <Ionicons name={allowByesRule ? "checkbox" : "square-outline"} size={18} color={allowByesRule ? '#5D68E8' : '#94a3b8'} />
              </Pressable>

              {/* Wicket + Runs Rule */}
              <Pressable
                onPress={() => setAllowWicketRunsRule(!allowWicketRunsRule)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#ffffff',
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#e2e8f0',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#8B5CF618', justifyContent: 'center', alignItems: 'center' }}>
                    <ThemedText style={{ fontSize: 8, fontFamily: 'Sora_500Medium', color: '#8B5CF6' }}>WK</ThemedText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: '#1e293b' }}>
                      Wicket + Runs Allowed (Run Outs: W+1, W+2)
                    </ThemedText>
                    <ThemedText style={{ fontSize: 9, color: '#64748b' }}>
                      Tap 'Wicket' → pick 'W+1' or 'W+2' for completed runs on dismissals.
                    </ThemedText>
                  </View>
                </View>
                <Ionicons name={allowWicketRunsRule ? "checkbox" : "square-outline"} size={18} color={allowWicketRunsRule ? '#5D68E8' : '#94a3b8'} />
              </Pressable>

              {/* Scenario Guide Pill */}
              <View style={{ backgroundColor: '#5D68E810', borderColor: '#5D68E825', borderWidth: 1, borderRadius: 8, padding: 8, marginTop: 4 }}>
                <ThemedText style={{ fontSize: 9, color: '#475569', lineHeight: 13 }}>
                  💡 <ThemedText style={{ fontFamily: 'Sora_500Medium', color: '#5D68E8' }}>Match Scenarios:</ThemedText> Long-press 'WD' on pad for Wide + 1, 2 runs. Tap 'Wicket' → pick 'Wicket + 1' or 'Wicket + 2' for Run Outs with runs.
                </ThemedText>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Toss or Start Action Button ─────────────────────────── */}


      {/* ── Toss or Start Action Button ─────────────────────────── */}
      <View style={[styles.actionsContainer, { backgroundColor: theme.surfaceLowest }]}>
        {!tossResult ? (
          <Pressable
            onPress={handleToss}
            disabled={isFlipping}
            style={[styles.tossBtn, { backgroundColor: areTeamsValid ? theme.primary : '#94a3b8' }, isFlipping && { opacity: 0.75 }]}
          >
            <View style={styles.tossBtnLeft}>
              <ThemedText style={[styles.tossBtnTitle, { color: '#ffffff' }]}>
                {isFlipping ? 'Flipping Coin...' : 'Toss the Coin'}
              </ThemedText>
              <ThemedText style={[styles.tossBtnSub, { color: 'rgba(255,255,255,0.85)' }]}>
                {!areTeamsValid ? 'Enter both team names to toss' : `${selectedSport} · ${totalOversInput ? `${totalOversInput} Overs` : (customFormat || selectedFormat)}`}
              </ThemedText>
            </View>
            <View style={[styles.tossCoinCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <ThemedText style={{ fontSize: 16 }}>🪙</ThemedText>
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
            style={[styles.tossBtn, { backgroundColor: '#cbd5e1' }]}
          >
            <View style={styles.tossBtnLeft}>
              <ThemedText style={[styles.tossBtnTitle, { color: '#475569' }]}>
                Start the Match
              </ThemedText>
              <ThemedText style={[styles.tossBtnSub, { color: '#64748b' }]} numberOfLines={1}>
                {!areTeamsValid
                  ? 'Team names required to enable'
                  : 'Select Batting or Bowling above to start'}
              </ThemedText>
            </View>
            <View style={[styles.tossCoinCircle, { backgroundColor: '#e2e8f0' }]}>
              <Ionicons name="lock-closed" size={14} color="#64748b" />
            </View>
          </Pressable>
        ) : (
          <Pressable onPress={handleStartMatch} style={[styles.tossBtn, { backgroundColor: theme.primary }]}>
            <View style={styles.tossBtnLeft}>
              <ThemedText style={[styles.tossBtnTitle, { color: '#ffffff' }]}>Start the Match</ThemedText>
              <ThemedText style={[styles.tossBtnSub, { color: 'rgba(255,255,255,0.9)' }]} numberOfLines={1}>
                {tossWinnerName} won toss · Choose to {tossDecision} · Verified ({totalOversInput} Ov)
              </ThemedText>
            </View>
            <View style={[styles.tossCoinCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name="play" size={16} color="#ffffff" />
            </View>
          </Pressable>
        )}
      </View>
      {/* ── Add New Team Modal ── */}
      <Modal
        visible={isNewTeamModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsNewTeamModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant }]}>

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
                <TextInput
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
                  <TextInput
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
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: theme.surfaceLow, color: theme.text, borderColor: isPhoneFocused ? theme.primary : theme.outlineVariant + '44' }
                    ]}
                    placeholder={profile.phone || '9876543210'}
                    placeholderTextColor="#94a3b8"
                    value={newPhone}
                    onChangeText={(t) => setNewPhone(t.replace(/[^0-9+\s\-()]/g, ''))}
                    onFocus={() => setIsPhoneFocused(true)}
                    onBlur={() => setIsPhoneFocused(false)}
                    keyboardType="phone-pad"
                  />
                  {newPhone !== '' && newPhone.replace(/[^0-9]/g, '').length < 7 ? (
                    <ThemedText style={{ color: '#ef4444', fontSize: 10, marginTop: 3 }}>Min 7 digits required</ThemedText>
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
                style={[styles.modalBtn, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant, borderWidth: 1 }]}
              >
                <ThemedText style={{ color: theme.text, fontFamily: 'Sora_500Medium', fontSize: 13 }}>Cancel</ThemedText>
              </Pressable>
              <Pressable
                onPress={handleCreateTeamFromModal}
                style={[styles.modalBtn, { backgroundColor: theme.primary }]}
              >
                <ThemedText style={{ color: '#ffffff', fontFamily: 'Sora_500Medium', fontSize: 13 }}>Create Team</ThemedText>
              </Pressable>
            </View>

          </View>
        </View>
      </Modal>

      {/* ── Playing XI Selection (drag-and-drop, skippable) ── */}
      <PlayerSelectionModal
        visible={isPlayerSelectionOpen}
        teamAName={teamAName}
        teamBName={teamBName}
        initialPool={draftPlayerPool}
        initialTeamA={teamALineup}
        initialTeamB={teamBLineup}
        onClose={() => setIsPlayerSelectionOpen(false)}
        onSkip={() => {
          setIsPlayerSelectionOpen(false);
          proceedToScoring([], []);
        }}
        onConfirm={(teamA, teamB, unassigned) => {
          setTeamALineup(teamA);
          setTeamBLineup(teamB);
          setPlayerPool([...teamA, ...teamB, ...unassigned]);
          setLineupConfigured(teamA.length > 0 || teamB.length > 0);
          setIsPlayerSelectionOpen(false);
          proceedToScoring(teamA, teamB);
        }}
      />
    </View>
  );
}

const styles_playingXi = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: 'Sora_500Medium', fontSize: 12 },
  subtitle: { fontFamily: 'Sora_400Regular', fontSize: 10.5, marginTop: 1 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollArea: { flex: 1 },
  scroll: {
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 4,
  },
  coinHero: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderLeftWidth: 5,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#1a2a33',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  vsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 6,
  },
  teamSide: {
    flex: 1,
    alignItems: 'center',
  },
  teamShield: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shieldText: {
    fontSize: 16,
    fontFamily: 'Sora_500Medium',
    color: '#ffffff',
    letterSpacing: 0.8,
  },
  teamInput: {
    color: '#ffffff',
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.35)',
    width: '105%',
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Sora_500Medium',
    paddingVertical: 4,
    marginTop: 6,
  },
  coinCenter: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
  coin: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
    backgroundColor: '#ffd700',
    borderWidth: 3.5,
    borderColor: '#e5c000',
    shadowColor: '#ffd700',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  coinFace: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinSymbol: {
    fontSize: 36,
    fontWeight: 'normal',
    fontFamily: 'Sora_500Medium',
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  vsLabel: {
    fontSize: 10,
    fontFamily: 'Sora_500Medium',
    letterSpacing: 2,
    marginTop: 4,
  },
 
  /* Toss call setup styles */
  tossCallConfig: {
    width: '100%',
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    paddingTop: 12,
  },
  configHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    justifyContent: 'center',
    marginBottom: 8,
  },
  configLabel: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 9,
    fontFamily: 'Sora_500Medium',
    letterSpacing: 0.8,
  },
  configControlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  configItem: {
    flex: 1,
  },
  configSubLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 9,
    fontFamily: 'Sora_500Medium',
    marginBottom: 4,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 6,
  },
  smallChip: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.md,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallChipActive: {
    backgroundColor: '#FFE259',
    borderColor: '#FFE259',
  },
  chipText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 9,
    fontFamily: 'Sora_500Medium',
    textAlign: 'center',
  },
  chipTextActive: {
    color: '#0d1d26',
    fontFamily: 'Sora_500Medium',
  },
 
  /* Result Banner */
  resultBanner: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderLeftWidth: 5,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#1a2a33',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  resultTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resultTitle: {
    fontSize: 13,
    fontFamily: 'Sora_500Medium',
  },
  resultSub: {
    fontSize: 14,
    fontFamily: 'Sora_500Medium',
    marginTop: 6,
    color: '#5D68E8',
  },
  decisionBox: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#00000008',
    paddingTop: 10,
  },
  decisionOptions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  choiceChip: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: BorderRadius.full,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F6FA',
  },
  choiceChipText: {
    fontSize: 11,
    fontFamily: 'Sora_500Medium',
    color: '#64748b',
  },
 
  /* Bento Card Container */
  bentoCard: {
    padding: 0,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  cardIconWrap: {
    width: 26,
    height: 26,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontFamily: 'Sora_500Medium',
    fontSize: 12.5,
  },
  cardSubtitle: {
    fontFamily: 'Sora_400Regular',
    fontSize: 9.5,
    marginTop: 1,
  },
  inputGroup: {
    flexDirection: 'column',
  },
  fieldLabel: {
    fontFamily: 'Sora_500Medium',
    fontSize: 9,
    letterSpacing: 0.1,
    marginBottom: 3,
    color: '#64748b',
  },
  input: {
    height: 32,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontFamily: 'Sora_400Regular',
    fontSize: 11,
  },
  formDivider: {
    height: 1,
    marginVertical: 12,
  },
  sportList: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  sportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginRight: 6,
    justifyContent: 'center',
  },
  sportChipText: {
    fontFamily: 'Sora_500Medium',
    fontSize: 10,
    marginLeft: 4,
  },
  formatList: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  formatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  formatDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  formatChipText: {
    fontFamily: 'Sora_500Medium',
    fontSize: 11,
  },

  /* Dropdown Styles */
  dropdownSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '90%',
    height: 32,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: 8,
    marginTop: 8,
  },
  dropdownSelectorText: {
    fontFamily: 'Sora_500Medium',
    fontSize: 11,
    flex: 1,
    marginRight: 4,
  },
  dropdownMenu: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 20,
    maxHeight: 180,
    zIndex: 999,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  dropdownItemText: {
    fontFamily: 'Sora_500Medium',
    fontSize: 11,
  },
  addTeamItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  dropdownSelectorInput: {
    fontFamily: 'Sora_500Medium',
    fontSize: 11,
    height: 30,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingLeft: 8,
    paddingRight: 24,
    marginTop: 6,
    width: '100%',
  },
  chevronBtn: {
    position: 'absolute',
    right: 8,
    top: 18,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchInput: {
    fontFamily: 'Sora_500Medium',
    fontSize: 11,
    flex: 1,
    height: 24,
    padding: 0,
  },

  /* Modal Styles */
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
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: 20,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: 'Sora_500Medium',
    fontSize: 16,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalScroll: {
    gap: 16,
    paddingBottom: 10,
  },
  modalInputGroup: {
    flexDirection: 'column',
    gap: 4,
  },
  modalRow: {
    flexDirection: 'row',
    gap: 10,
  },
  mascotThumbBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  mascotThumbImg: {
    width: '100%',
    height: '100%',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Actions container */
  actionsContainer: {
    flexDirection: 'column',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#0000000a',
  },
  tossBtn: {
    height: 48,
    borderRadius: BorderRadius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    ...Shadows.level2,
  },
  tossBtnLeft: {
    flexDirection: 'column',
    flex: 1,
  },
  tossBtnTitle: {
    fontFamily: 'Sora_500Medium',
    fontSize: 14,
  },
  tossBtnSub: {
    fontFamily: 'Sora_500Medium',
    fontSize: 9,
    marginTop: 2,
  },
  tossCoinCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userLinkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: BorderRadius.md,
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
  userLinkName: {
    fontFamily: 'Sora_500Medium',
    fontSize: 12.5,
  },
  userLinkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  userLinkBadgeText: {
    fontSize: 9.5,
    fontFamily: 'Sora_500Medium',
    color: '#10B981',
  },
  userLinkSub: {
    fontFamily: 'Sora_400Regular',
    fontSize: 10,
    marginTop: 2,
  },
});
