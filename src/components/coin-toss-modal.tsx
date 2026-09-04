import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { isTimeSlotPassed } from '@/utils/date-utils';
import { turfApi } from '@/services/turf-api';

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
  const [newPhone, setNewPhone] = useState(profile.phone || '9876543210');
  const [newMascot, setNewMascot] = useState('lion');
  const [newIsFavourite, setNewIsFavourite] = useState(false);
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isShortFocused, setIsShortFocused] = useState(false);
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);

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
      autoScrollToBottom(180);
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
        
          <View style={[styles.modalBox, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
            <Pressable onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={theme.textSecondary} />
            </Pressable>

            <ScrollView
              ref={tossScrollRef}
              showsVerticalScrollIndicator={false}
              style={{ width: '100%' }}
              contentContainerStyle={styles.scrollContent}
              bounces={false}
            >
              {/* Modal Header */}
              <View style={styles.header}>
                <FontAwesome5 name="coins" size={18} color="#5D68E8" style={{ marginBottom: 3 }} />
                <ThemedText style={{ color: theme.text, fontFamily: 'Sora_500Medium', fontSize: 14 }}>
                  Kickoff Coin Toss
                </ThemedText>
                <ThemedText style={{ color: theme.textSecondary, textAlign: 'center', fontSize: 9.5, marginTop: 1 }}>
                  Configure and start match live scoring
                </ThemedText>
              </View>

              {/* Feedback banner (favourite preselected / already selected) */}
              <InlineNotice notice={notice} onDismiss={clearNotice} />

              {/* Sport selector */}
              <View style={{ width: '100%', marginBottom: 8 }}>
                <ThemedText style={{ fontSize: 9, fontFamily: 'Sora_500Medium', color: '#64748b', marginBottom: 4, letterSpacing: 0.8 }}>
                  SPORT
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
                            Alert.alert('Cricket Only Mode', `${sport.name} toss will be enabled in a future update.`);
                            return;
                          }
                          setSelectedSport(sport.name);
                          setResult(null);
                          setTossDecision('');
                        }}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingHorizontal: 9,
                          paddingVertical: 4.5,
                          borderRadius: 6,
                          borderWidth: 1.5,
                          backgroundColor: isActive ? '#5D68E8' : '#ffffff',
                          borderColor: isActive ? '#5D68E8' : '#e2e8f0',
                          gap: 5,
                          opacity: isDisabled ? 0.45 : 1,
                        }}
                      >
                        <MaterialIcons
                          name={sport.icon as any}
                          size={12}
                          color={isActive ? '#ffffff' : '#64748b'}
                        />
                        <ThemedText
                          style={{
                            fontSize: 10,
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
                  width: '100%',
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
                        style={{
                          backgroundColor: '#ffffff',
                          borderWidth: 1.5,
                          borderColor: teamAError ? '#ef4444' : (!teamAName.trim() ? '#cbd5e1' : '#5D68E8'),
                          color: '#0f172a',
                          textAlign: 'center',
                          fontSize: 10.5,
                          fontFamily: 'Sora_500Medium',
                          height: 30,
                          borderRadius: 6,
                          paddingHorizontal: 6,
                        }}
                        value={teamAName}
                        placeholder="Team A Name *"
                        placeholderTextColor="#94a3b8"
                        onChangeText={(val) => {
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
                          setResult(null);
                          setTossDecision('');
                        }}
                        onFocus={() => {
                          setDropdownAOpen(true);
                          setDropdownBOpen(false);
                        }}
                      />
                      {teamAError !== '' && (
                        <ThemedText style={{ color: '#ef4444', fontSize: 8, textAlign: 'center', marginTop: 1, fontFamily: 'Sora_500Medium' }}>
                          {teamAError}
                        </ThemedText>
                      )}

                      {dropdownAOpen && (
                        <View style={{
                          position: 'absolute',
                          left: 0,
                          // Anchor input is only 125px wide in this compact two-column
                          // layout; a full 200px panel spilled into the "VS" divider.
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
                        }}>
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
                              + Add New Team
                            </ThemedText>
                          </Pressable>

                          <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                            {suggestionsA.map((team) => (
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
                                {team.mascot ? (
                                  <Image source={getMascotAsset(team.mascot)} style={{ width: 14, height: 14, borderRadius: 2 }} contentFit="contain" />
                                ) : (
                                  <Ionicons name="shield" size={12} color="#5D68E8" />
                                )}
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
                        style={{
                          backgroundColor: '#ffffff',
                          borderWidth: 1.5,
                          borderColor: teamBError ? '#ef4444' : (!teamBName.trim() ? '#cbd5e1' : '#5D68E8'),
                          color: '#0f172a',
                          textAlign: 'center',
                          fontSize: 10.5,
                          fontFamily: 'Sora_500Medium',
                          height: 30,
                          borderRadius: 6,
                          paddingHorizontal: 6,
                        }}
                        value={teamBName}
                        placeholder="Team B Name *"
                        placeholderTextColor="#94a3b8"
                        onChangeText={(val) => {
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
                          setResult(null);
                          setTossDecision('');
                        }}
                        onFocus={() => {
                          setDropdownBOpen(true);
                          setDropdownAOpen(false);
                        }}
                      />
                      {teamBError !== '' && (
                        <ThemedText style={{ color: '#ef4444', fontSize: 8, textAlign: 'center', marginTop: 1, fontFamily: 'Sora_500Medium' }}>
                          {teamBError}
                        </ThemedText>
                      )}

                      {dropdownBOpen && (
                        <View style={{
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
                        }}>
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
                              + Add New Team
                            </ThemedText>
                          </Pressable>

                          <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                            {suggestionsB.map((team) => (
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
                                {team.mascot ? (
                                  <Image source={getMascotAsset(team.mascot)} style={{ width: 14, height: 14, borderRadius: 2 }} contentFit="contain" />
                                ) : (
                                  <Ionicons name="shield" size={12} color="#5D68E8" />
                                )}
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
              <View style={{ width: '100%', marginBottom: 8, backgroundColor: theme.surfaceLow, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: theme.outlineVariant + '44' }}>
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
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surfaceLowest, borderRadius: 6, borderWidth: 1, borderColor: showTurfDropdown ? theme.primary : theme.outlineVariant + '40', paddingHorizontal: 10, height: 32 }}>
                      <Ionicons name="search-outline" size={14} color={theme.primary} style={{ marginRight: 6 }} />
                      <TextInput
                        style={{ flex: 1, color: theme.text, fontFamily: 'Sora_500Medium', fontSize: 11 }}
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
                      <View style={{
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
                      }}>
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
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surfaceLowest, borderRadius: 6, borderWidth: 1, borderColor: theme.outlineVariant + '40', paddingHorizontal: 10, height: 32 }}>
                      <Ionicons name="location-outline" size={14} color={theme.textSecondary} style={{ marginRight: 6 }} />
                      <TextInput
                        style={{ flex: 1, color: theme.text, fontFamily: 'Sora_500Medium', fontSize: 11 }}
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
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 6, width: '100%' }}>
                {/* CALLER */}
                <View style={{ flex: 1 }}>
                  <ThemedText style={{ fontSize: 9, fontFamily: 'Sora_500Medium', color: '#64748b', marginBottom: 3, letterSpacing: 0.5, textTransform: 'uppercase' }}>
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
                      <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_500Medium', color: tossCaller === 'A' ? '#000000' : '#475569' }} numberOfLines={1}>
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
                      <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_500Medium', color: tossCaller === 'B' ? '#000000' : '#475569' }} numberOfLines={1}>
                        {teamBName.trim() || 'Team B'}
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>

                {/* CALL */}
                <View style={{ flex: 1 }}>
                  <ThemedText style={{ fontSize: 9, fontFamily: 'Sora_500Medium', color: '#64748b', marginBottom: 3, letterSpacing: 0.5, textTransform: 'uppercase' }}>
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
              <View style={{ alignItems: 'center', marginVertical: 4, width: '100%' }}>
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
                          { translateY: lift },
                          { rotateY: spin }
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
              {result && (
                <LinearGradient
                  colors={[theme.surfaceLowest, '#5D68E80c']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: '100%',
                    borderRadius: 6,
                    borderWidth: 1,
                    borderLeftWidth: 4,
                    borderColor: theme.outlineVariant + '33',
                    borderLeftColor: theme.primary,
                    padding: 8,
                    marginVertical: 4,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="sparkles" size={13} color="#FFB800" />
                      <ThemedText style={{ color: theme.textSecondary, fontSize: 10.5, fontFamily: 'Sora_500Medium' }}>Coin landed</ThemedText>
                    </View>
                    <View style={{ backgroundColor: theme.primary + '15', paddingHorizontal: 7, paddingVertical: 1.5, borderRadius: 4 }}>
                      <ThemedText style={{ color: theme.primary, fontSize: 9, fontFamily: 'Sora_500Medium', letterSpacing: 0.5 }}>{result}</ThemedText>
                    </View>
                  </View>

                  <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_500Medium', color: theme.text }}>
                    🎉 {tossWinnerName} won the toss!
                  </ThemedText>

                  <View style={{ marginTop: 4, borderTopWidth: 1, borderTopColor: '#00000008', paddingTop: 4 }}>
                    <ThemedText style={{ color: theme.textSecondary, marginBottom: 4, fontSize: 9, fontFamily: 'Sora_500Medium' }}>Choose decision action</ThemedText>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {selectedSport.toLowerCase() === 'cricket' ? (
                        <>
                          <Pressable
                            onPress={() => {
                              setTossDecision('Bat');
                              autoScrollToBottom(120);
                            }}
                            style={[
                              { flex: 1, borderWidth: 1.5, borderColor: '#cbd5e1', borderRadius: 6, paddingVertical: 5, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F6FA' },
                              tossDecision === 'Bat' && { backgroundColor: theme.primary, borderColor: theme.primary }
                            ]}
                          >
                            <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_500Medium', color: tossDecision === 'Bat' ? '#ffffff' : '#64748b' }}>🏏 Batting</ThemedText>
                          </Pressable>
                          <Pressable
                            onPress={() => {
                              setTossDecision('Bowl');
                              autoScrollToBottom(120);
                            }}
                            style={[
                              { flex: 1, borderWidth: 1.5, borderColor: '#cbd5e1', borderRadius: 6, paddingVertical: 5, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F6FA' },
                              tossDecision === 'Bowl' && { backgroundColor: theme.primary, borderColor: theme.primary }
                            ]}
                          >
                            <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_500Medium', color: tossDecision === 'Bowl' ? '#ffffff' : '#64748b' }}>🥎 Bowling</ThemedText>
                          </Pressable>
                        </>
                      ) : (
                        <>
                          <Pressable
                            onPress={() => {
                              setTossDecision('Kickoff');
                              autoScrollToBottom(120);
                            }}
                            style={[
                              { flex: 1, borderWidth: 1.5, borderColor: '#cbd5e1', borderRadius: 6, paddingVertical: 5, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F6FA' },
                              tossDecision === 'Kickoff' && { backgroundColor: theme.primary, borderColor: theme.primary }
                            ]}
                          >
                            <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_500Medium', color: tossDecision === 'Kickoff' ? '#ffffff' : '#64748b' }}>⚽ Serve / Kickoff</ThemedText>
                          </Pressable>
                          <Pressable
                            onPress={() => {
                              setTossDecision('Receive');
                              autoScrollToBottom(120);
                            }}
                            style={[
                              { flex: 1, borderWidth: 1.5, borderColor: '#cbd5e1', borderRadius: 6, paddingVertical: 5, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F6FA' },
                              tossDecision === 'Receive' && { backgroundColor: theme.primary, borderColor: theme.primary }
                            ]}
                          >
                            <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_500Medium', color: tossDecision === 'Receive' ? '#ffffff' : '#64748b' }}>🛡️ Receive / Side</ThemedText>
                          </Pressable>
                        </>
                      )}
                    </View>
                  </View>
                </LinearGradient>
              )}

              {/* ── PRE-MATCH RULES & OVER VERIFICATION CARD (Shown after Batting/Bowling picked) ── */}
              {Boolean(result && tossDecision) && (
                <View style={{
                  backgroundColor: '#f8fafc',
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#e2e8f0',
                  padding: 8,
                  marginTop: 6,
                  marginBottom: 4,
                  width: '100%',
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <Ionicons name="options-outline" size={13} color="#5D68E8" />
                      <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: '#1e293b' }}>
                        Pre-Match Rules Verification
                      </ThemedText>
                    </View>
                  </View>

                  {/* Total Overs Selector */}
                  <View style={{ marginBottom: 6 }}>
                    <ThemedText style={{ fontSize: 8.5, fontFamily: 'Sora_500Medium', color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>
                      Total Match Overs:
                    </ThemedText>
                    <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
                      {['5', '10', '20'].map((ov) => {
                        const isSelected = !isCustomOversSelected && totalOversInput === ov;
                        return (
                          <Pressable
                            key={ov}
                            onPress={() => {
                              setIsCustomOversSelected(false);
                              setTotalOversInput(ov);
                            }}
                            style={{
                              paddingHorizontal: 7,
                              paddingVertical: 3.5,
                              borderRadius: 5,
                              backgroundColor: isSelected ? '#5D68E8' : '#ffffff',
                              borderWidth: 1,
                              borderColor: isSelected ? '#5D68E8' : '#cbd5e1',
                            }}
                          >
                            <ThemedText style={{ fontSize: 9.5, fontFamily: 'Sora_500Medium', color: isSelected ? '#ffffff' : '#334155' }}>
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
                            paddingHorizontal: 7,
                            paddingVertical: 3.5,
                            borderRadius: 5,
                            backgroundColor: '#ffffff',
                            borderWidth: 1,
                            borderColor: '#5D68E8',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 2,
                          }}
                        >
                          <ThemedText style={{ fontSize: 9.5, fontFamily: 'Sora_500Medium', color: '#5D68E8' }}>
                            Custom +
                          </ThemedText>
                        </Pressable>
                      ) : (
                        <View style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: '#ffffff',
                          borderWidth: 1.5,
                          borderColor: '#5D68E8',
                          borderRadius: 5,
                          paddingHorizontal: 5,
                          paddingVertical: 1,
                          gap: 3,
                        }}>
                          <TextInput
                            style={{
                              fontFamily: 'Sora_500Medium',
                              fontSize: 10,
                              color: '#1e293b',
                              minWidth: 26,
                              paddingVertical: 1,
                              paddingHorizontal: 0,
                              textAlign: 'center',
                            }}
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
                          <ThemedText style={{ fontSize: 8.5, fontFamily: 'Sora_500Medium', color: '#5D68E8' }}>
                            Ov
                          </ThemedText>
                          <Pressable
                            onPress={() => {
                              setIsCustomOversSelected(false);
                              setTotalOversInput('20');
                            }}
                            style={{ padding: 1 }}
                          >
                            <Ionicons name="close-circle" size={11} color="#94a3b8" />
                          </Pressable>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Pre-Match Rules Verification Switches */}
                  <View style={{ gap: 4 }}>
                    <Pressable
                      onPress={() => setAutoWideRule(!autoWideRule)}
                      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 1 }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <Ionicons name={autoWideRule ? 'checkbox' : 'square-outline'} size={14} color={autoWideRule ? '#5D68E8' : '#94a3b8'} />
                        <ThemedText style={{ fontSize: 9.5, fontFamily: 'Sora_500Medium', color: '#334155' }}>
                          Wide Ball = 1 Extra Run (Supports Wide + 1, 2 runs)
                        </ThemedText>
                      </View>
                      <ThemedText style={{ fontSize: 8, fontFamily: 'Sora_500Medium', color: autoWideRule ? '#5D68E8' : '#94a3b8' }}>
                        {autoWideRule ? 'ACTIVE' : 'OFF'}
                      </ThemedText>
                    </Pressable>

                    <Pressable
                      onPress={() => setAutoNoBallRule(!autoNoBallRule)}
                      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 1 }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <Ionicons name={autoNoBallRule ? 'checkbox' : 'square-outline'} size={14} color={autoNoBallRule ? '#5D68E8' : '#94a3b8'} />
                        <ThemedText style={{ fontSize: 9.5, fontFamily: 'Sora_500Medium', color: '#334155' }}>
                          No Ball = 1 Extra Run & Free Hit
                        </ThemedText>
                      </View>
                      <ThemedText style={{ fontSize: 8, fontFamily: 'Sora_500Medium', color: autoNoBallRule ? '#5D68E8' : '#94a3b8' }}>
                        {autoNoBallRule ? 'ACTIVE' : 'OFF'}
                      </ThemedText>
                    </Pressable>

                    <Pressable
                      onPress={() => setAllowByesRule(!allowByesRule)}
                      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 1 }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <Ionicons name={allowByesRule ? 'checkbox' : 'square-outline'} size={14} color={allowByesRule ? '#5D68E8' : '#94a3b8'} />
                        <ThemedText style={{ fontSize: 9.5, fontFamily: 'Sora_500Medium', color: '#334155' }}>
                          Byes & Leg Byes Allowed
                        </ThemedText>
                      </View>
                      <ThemedText style={{ fontSize: 8, fontFamily: 'Sora_500Medium', color: allowByesRule ? '#5D68E8' : '#94a3b8' }}>
                        {allowByesRule ? 'ACTIVE' : 'OFF'}
                      </ThemedText>
                    </Pressable>

                    <Pressable
                      onPress={() => setAllowWicketRunsRule(!allowWicketRunsRule)}
                      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 1 }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <Ionicons name={allowWicketRunsRule ? 'checkbox' : 'square-outline'} size={14} color={allowWicketRunsRule ? '#5D68E8' : '#94a3b8'} />
                        <ThemedText style={{ fontSize: 9.5, fontFamily: 'Sora_500Medium', color: '#334155' }}>
                          Wicket + Runs Allowed (Run Outs: W+1, W+2)
                        </ThemedText>
                      </View>
                      <ThemedText style={{ fontSize: 8, fontFamily: 'Sora_500Medium', color: allowWicketRunsRule ? '#5D68E8' : '#94a3b8' }}>
                        {allowWicketRunsRule ? 'ACTIVE' : 'OFF'}
                      </ThemedText>
                    </Pressable>
                  </View>

                  {/* Guide Pill */}
                  <View style={{ backgroundColor: '#5D68E812', borderRadius: 6, padding: 6, marginTop: 5 }}>
                    <ThemedText style={{ fontSize: 8.5, color: '#475569', lineHeight: 12 }}>
                      💡 <ThemedText style={{ fontFamily: 'Sora_500Medium', color: '#5D68E8' }}>Match Scenarios:</ThemedText> Long-press 'WD' on pad for Wide + 1, 2 runs. Tap 'Wicket' → pick 'W+1' or 'W+2' for Run Outs.
                    </ThemedText>
                  </View>
                </View>
              )}

              {/* ── Toss or Start Action Button ─────────────────────────── */}
              <View style={{ width: '100%', marginTop: 4 }}>
                {!result ? (
                  <Pressable
                    onPress={handleToss}
                    disabled={isFlipping}
                    style={[styles.tossBtn, { backgroundColor: areTeamsValid ? theme.primary : '#94a3b8' }, isFlipping && { opacity: 0.75 }]}
                  >
                    <View style={styles.tossBtnLeft}>
                      <ThemedText style={[styles.tossBtnTitle, { color: '#ffffff' }]}>
                        {isFlipping ? 'Flipping Coin...' : 'Toss the Coin 🪙'}
                      </ThemedText>
                      <ThemedText style={[styles.tossBtnSub, { color: 'rgba(255,255,255,0.85)' }]}>
                        {!areTeamsValid ? 'Enter both team names to toss' : `${selectedSport} · Quick Match`}
                      </ThemedText>
                    </View>
                    <View style={[styles.tossCoinCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                      <ThemedText style={{ fontSize: 15 }}>🪙</ThemedText>
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
                      <Ionicons name="lock-closed" size={13} color="#64748b" />
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
                      <Ionicons name="play" size={15} color="#ffffff" />
                    </View>
                  </Pressable>
                )}
              </View>
            </ScrollView>
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
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
    zIndex: 20,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 4,
  },
  header: {
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 2,
  },
  tossBtn: {
    height: 44,
    borderRadius: BorderRadius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    width: '100%',
    ...Shadows.level2,
  },
  tossBtnLeft: {
    flexDirection: 'column',
    flex: 1,
  },
  tossBtnTitle: {
    fontFamily: 'Sora_500Medium',
    fontSize: 12.5,
  },
  tossBtnSub: {
    fontFamily: 'Sora_500Medium',
    fontSize: 8.5,
    marginTop: 1,
  },
  tossCoinCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
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
  fieldLabel: {
    fontFamily: 'Sora_500Medium',
    fontSize: 11,
  },
  input: {
    fontFamily: 'Sora_500Medium',
    fontSize: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    width: '100%',
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
  favToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
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
