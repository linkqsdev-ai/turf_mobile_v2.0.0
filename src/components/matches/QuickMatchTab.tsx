import { ThemedText } from '@/components/themed-text';
import { Shadows, Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useMatchStore } from '@/store/app-store';

import { SPORTS_LIST } from '@/constants/sports';

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

export function QuickMatchTab({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const theme = useTheme();
  const router = useRouter();
  const { teams, addTeam } = useMatchStore();
  const [selectedSport, setSelectedSport] = useState('Cricket');
  const [selectedFormat, setSelectedFormat] = useState('T20');
  const [customFormat, setCustomFormat] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  // Team configuration states
  const [teamAName, setTeamAName] = useState('Lions FC');
  const [teamBName, setTeamBName] = useState('Titans Utd');

  const [dropdownAOpen, setDropdownAOpen] = useState(false);
  const [dropdownBOpen, setDropdownBOpen] = useState(false);

  const [searchQueryA, setSearchQueryA] = useState('Lions FC');
  const [searchQueryB, setSearchQueryB] = useState('Titans Utd');

  const [isNewTeamModalOpen, setIsNewTeamModalOpen] = useState(false);
  const [addingForTeam, setAddingForTeam] = useState<'A' | 'B' | null>(null);

  // Modal form states
  const [newTeamName, setNewTeamName] = useState('');
  const [newShortName, setNewShortName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newMascot, setNewMascot] = useState('lion');
  const [newIsFavourite, setNewIsFavourite] = useState(false);

  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isShortFocused, setIsShortFocused] = useState(false);
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);

  const handleCreateTeamFromModal = () => {
    if (!newTeamName.trim() || !newShortName.trim() || !newPhone.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }

    const created = addTeam({
      name: newTeamName.trim(),
      sport: selectedSport,
      mascot: newMascot,
      players: [],
      isFavourite: newIsFavourite,
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

  const filteredTeamsA = sortedTeams.filter(team =>
    team.name.toLowerCase().includes(searchQueryA.toLowerCase())
  );

  const filteredTeamsB = sortedTeams.filter(team =>
    team.name.toLowerCase().includes(searchQueryB.toLowerCase())
  );

  // Toss Configuration
  const [tossCaller, setTossCaller] = useState<'A' | 'B'>('A');
  const [tossCall, setTossCall] = useState<'HEADS' | 'TAILS'>('HEADS');

  // Toss Result states
  const [tossResult, setTossResult] = useState<'HEADS' | 'TAILS' | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [tossDecision, setTossDecision] = useState<string>('');

  // Local display side for coin face during visual spin
  const [displaySide, setDisplaySide] = useState<'HEADS' | 'TAILS'>('HEADS');

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

  const handleToss = () => {
    spinCoin();
  };

  const handleStartMatch = () => {
    if (!teamAName.trim() || !teamBName.trim()) {
      Alert.alert('Error', 'Please enter team names for both slots.');
      return;
    }
    const winner = tossResult === tossCall ? tossCaller : (tossCaller === 'A' ? 'B' : 'A');
    const tossWinnerName = winner === 'A' ? teamAName : teamBName;

    router.push({
      pathname: '/scoring',
      params: {
        sport: selectedSport.toLowerCase(),
        teamA: teamAName.trim(),
        teamB: teamBName.trim(),
        tossWinner: tossWinnerName.trim(),
        decision: tossDecision,
      },
    });
  };

  const winner = tossResult === tossCall ? tossCaller : (tossCaller === 'A' ? 'B' : 'A');
  const tossWinnerName = winner === 'A' ? teamAName : teamBName;

  return (
    <View style={[styles.container, { paddingBottom: 85 }]}>
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        style={styles.scrollArea}
        bounces={false}
      >
        {/* ── Bento Form Container (Sport & Format selection at the top!) ── */}
        <View style={[styles.bentoCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', borderLeftColor: theme.primary }]}>
          {/* Sport selection */}
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Sport</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sportList}>
              {SPORTS_LIST.map((sport) => {
                const isActive = selectedSport === sport.name;
                return (
                  <Pressable
                    key={sport.name}
                    onPress={() => handleSportChange(sport.name)}
                    style={[
                      styles.sportChip,
                      { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '44' },
                      isActive && { backgroundColor: theme.primary, borderColor: theme.primary },
                    ]}
                  >
                    <MaterialIcons
                      name={sport.icon as any}
                      size={12}
                      color={isActive ? '#ffffff' : theme.textSecondary}
                    />
                    <ThemedText
                      style={[
                        styles.sportChipText,
                        { color: theme.textSecondary },
                        isActive && { color: '#ffffff' }
                      ]}
                    >
                      {sport.name}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <View style={[styles.formDivider, { backgroundColor: theme.outlineVariant + '44' }]} />

          {/* Format Selection */}
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Format</ThemedText>
            <View style={styles.formatList}>
              {FORMATS[selectedSport]?.map((f) => {
                const isActive = selectedFormat === f && !customFormat;
                return (
                  <Pressable
                    key={f}
                    onPress={() => {
                      setSelectedFormat(f);
                      setCustomFormat('');
                    }}
                    style={[
                      styles.formatChip,
                      isActive
                        ? { backgroundColor: theme.primary + '1a', borderColor: theme.primary }
                        : { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '44' }
                    ]}
                  >
                    {isActive && <View style={[styles.formatDot, { backgroundColor: theme.primary }]} />}
                    <ThemedText
                      style={[
                        styles.formatChipText,
                        { color: isActive ? theme.primary : theme.textSecondary }
                      ]}
                    >
                      {f}
                    </ThemedText>
                  </Pressable>
                );
              })}

              {/* Custom Format Input */}
              <TextInput
                style={[
                  styles.formatChip,
                  {
                    color: customFormat ? theme.primary : theme.text,
                    borderColor: customFormat ? theme.primary : theme.outlineVariant + '44',
                    backgroundColor: customFormat ? theme.primary + '1a' : theme.surfaceLow,
                    fontFamily: 'PlusJakartaSans_500Medium',
                    fontSize: 11,
                    width: 75,
                    paddingVertical: 0,
                    height: 36
                  }
                ]}
                placeholder="Custom..."
                placeholderTextColor={theme.textSecondary + '80'}
                value={customFormat}
                onChangeText={(val) => {
                  setCustomFormat(val);
                  setSelectedFormat('');
                }}
                onFocus={() => setSelectedFormat('')}
              />
            </View>
          </View>
        </View>

        {/* ── REDESIGNED Match Setup Hero Card ────────────── */}
        <LinearGradient
          colors={['#0f172a', '#1e293b', '#1a237e']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.coinHero, { zIndex: (dropdownAOpen || dropdownBOpen) ? 100 : 1, padding: 0, overflow: 'hidden' }]}
        >
          {/* Decorative glow circles */}
          <View style={{ position: 'absolute', top: -40, left: -40, width: 130, height: 130, borderRadius: 65, backgroundColor: '#5D68E820' }} />
          <View style={{ position: 'absolute', bottom: -30, right: -20, width: 110, height: 110, borderRadius: 55, backgroundColor: '#3b4fd820' }} />
          <View style={{ position: 'absolute', top: 10, right: 30, width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFB80015' }} />

          <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6, width: '100%' }}>
            {/* Match info header row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ backgroundColor: '#5D68E830', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                  <ThemedText style={{ color: '#a5b4fc', fontSize: 9, fontFamily: 'PlusJakartaSans_700Bold', letterSpacing: 1 }}>QUICK MATCH</ThemedText>
                </View>
                <View style={{ backgroundColor: '#FFB80020', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 }}>
                  <ThemedText style={{ color: '#FFB800', fontSize: 9, fontFamily: 'PlusJakartaSans_700Bold' }}>{selectedSport}</ThemedText>
                </View>
              </View>
              <ThemedText style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontFamily: 'PlusJakartaSans_500Medium' }}>
                {customFormat || selectedFormat}
              </ThemedText>
            </View>

          <View style={[styles.vsRow, { zIndex: (dropdownAOpen || dropdownBOpen) ? 100 : 1 }]}>
            {/* Team A Slot */}
            <View style={[styles.teamSide, { zIndex: dropdownAOpen ? 100 : 1 }]}>
              {/* Glowing shield */}
              <View style={{
                width: 64, height: 64, borderRadius: 18,
                backgroundColor: teamAName ? '#5D68E825' : 'rgba(255,255,255,0.05)',
                borderWidth: 1.5,
                borderColor: teamAName ? '#5D68E870' : 'rgba(255,255,255,0.12)',
                justifyContent: 'center', alignItems: 'center',
                shadowColor: '#5D68E8', shadowOffset: { width: 0, height: 0 }, shadowOpacity: teamAName ? 0.6 : 0, shadowRadius: 10,
                elevation: teamAName ? 4 : 0,
                marginBottom: 8,
              }}>
                <ThemedText style={{ fontSize: 18, fontFamily: 'PlusJakartaSans_700Bold', color: teamAName ? '#a5b4fc' : 'rgba(255,255,255,0.25)', letterSpacing: 1 }}>
                  {teamAName ? teamAName.substring(0, 3).toUpperCase() : 'T1'}
                </ThemedText>
              </View>

              <View style={{ width: '90%', position: 'relative' }}>
                <TextInput
                  style={[styles.dropdownSelectorInput, {
                    backgroundColor: 'rgba(255,255,255,0.07)',
                    borderColor: dropdownAOpen ? '#5D68E8' : 'rgba(255,255,255,0.12)',
                    color: '#ffffff',
                    textAlign: 'center',
                    fontSize: 11,
                  }]}
                  value={searchQueryA}
                  placeholder="Team A"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  onChangeText={(val) => {
                    setSearchQueryA(val);
                    setTeamAName(val);
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
                    setTimeout(() => setDropdownAOpen(false), 200);
                  }}
                />
                <Pressable
                  style={styles.chevronBtn}
                  onPress={() => {
                    setDropdownAOpen(!dropdownAOpen);
                    setDropdownBOpen(false);
                  }}
                >
                  <Ionicons name={dropdownAOpen ? "chevron-up" : "chevron-down"} size={12} color="rgba(255,255,255,0.4)" />
                </Pressable>
              </View>

              {dropdownAOpen && (
                <View style={[styles.dropdownMenu, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant, zIndex: 110, top: 108 }]}>
                  {/* Add New Team - Moved to the very top! */}
                  <Pressable
                    style={({ pressed }) => [
                      styles.dropdownItem,
                      styles.addTeamItem,
                      pressed && { backgroundColor: theme.surfaceLow }
                    ]}
                    onPress={() => {
                      setAddingForTeam('A');
                      setIsNewTeamModalOpen(true);
                    }}
                  >
                    <Ionicons name="add-circle-outline" size={14} color={theme.primary} />
                    <ThemedText style={[styles.dropdownItemText, { color: theme.primary, fontFamily: 'PlusJakartaSans_500Medium' }]}>
                      Add New Team
                    </ThemedText>
                  </Pressable>

                  <ScrollView style={{ maxHeight: 110 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                    {filteredTeamsA.map((team) => (
                      <Pressable
                        key={team.id}
                        style={({ pressed }) => [
                          styles.dropdownItem,
                          pressed && { backgroundColor: theme.surfaceLow }
                        ]}
                        onPress={() => {
                          setTeamAName(team.name);
                          setSearchQueryA(team.name);
                          setDropdownAOpen(false);
                          setTossResult(null);
                          setTossDecision('');
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                          <Image source={getMascotAsset(team.mascot || 'lion')} style={{ width: 16, height: 16, borderRadius: 2 }} contentFit="contain" />
                          <ThemedText style={[styles.dropdownItemText, { color: theme.text, flex: 1 }]} numberOfLines={1}>
                            {team.name}
                          </ThemedText>
                          {team.isFavourite && (
                            <Ionicons name="star" size={10} color="#FFA751" />
                          )}
                        </View>
                      </Pressable>
                    ))}
                    {filteredTeamsA.length === 0 && (
                      <View style={{ padding: 12, alignItems: 'center' }}>
                        <ThemedText style={{ fontSize: 10, color: theme.textSecondary }}>No matching teams</ThemedText>
                      </View>
                    )}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* VS Coin Center */}
            <View style={styles.coinCenter}>
              <Pressable onPress={spinCoin} disabled={isFlipping}>
                <Animated.View
                  style={[
                    styles.coin,
                    {
                      transform: [
                        { rotateY: coinSpin },
                        { translateY: coinLift }
                      ]
                    }
                  ]}
                >
                  <LinearGradient
                    colors={['#FFE259', '#FFA751', '#FFE259']}
                    style={styles.coinFace}
                  >
                    <ThemedText style={[styles.coinSymbol, { color: '#0d1d26' }]}>
                      {displaySide === 'HEADS' ? 'H' : 'T'}
                    </ThemedText>
                  </LinearGradient>
                </Animated.View>
              </Pressable>
              {/* Bold VS badge */}
              <View style={{
                marginTop: 6,
                backgroundColor: '#ffffff15',
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 3,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.15)',
              }}>
                <ThemedText style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold', letterSpacing: 3 }}>VS</ThemedText>
              </View>
            </View>

            {/* Team B Slot */}
            <View style={[styles.teamSide, { zIndex: dropdownBOpen ? 100 : 1 }]}>
              <View style={{
                width: 64, height: 64, borderRadius: 18,
                backgroundColor: teamBName ? '#10b98125' : 'rgba(255,255,255,0.05)',
                borderWidth: 1.5,
                borderColor: teamBName ? '#10b98170' : 'rgba(255,255,255,0.12)',
                justifyContent: 'center', alignItems: 'center',
                shadowColor: '#10b981', shadowOffset: { width: 0, height: 0 }, shadowOpacity: teamBName ? 0.6 : 0, shadowRadius: 10,
                elevation: teamBName ? 4 : 0,
                marginBottom: 8,
              }}>
                <ThemedText style={{ fontSize: 18, fontFamily: 'PlusJakartaSans_700Bold', color: teamBName ? '#6ee7b7' : 'rgba(255,255,255,0.25)', letterSpacing: 1 }}>
                  {teamBName ? teamBName.substring(0, 3).toUpperCase() : 'T2'}
                </ThemedText>
              </View>

              <View style={{ width: '90%', position: 'relative' }}>
                <TextInput
                  style={[styles.dropdownSelectorInput, {
                    backgroundColor: 'rgba(255,255,255,0.07)',
                    borderColor: dropdownBOpen ? '#10b981' : 'rgba(255,255,255,0.12)',
                    color: '#ffffff',
                    textAlign: 'center',
                    fontSize: 11,
                  }]}
                  value={searchQueryB}
                  placeholder="Team B"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  onChangeText={(val) => {
                    setSearchQueryB(val);
                    setTeamBName(val);
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
                    setTimeout(() => setDropdownBOpen(false), 200);
                  }}
                />
                <Pressable
                  style={styles.chevronBtn}
                  onPress={() => {
                    setDropdownBOpen(!dropdownBOpen);
                    setDropdownAOpen(false);
                  }}
                >
                  <Ionicons name={dropdownBOpen ? "chevron-up" : "chevron-down"} size={12} color="rgba(255,255,255,0.4)" />
                </Pressable>
              </View>

              {dropdownBOpen && (
                <View style={[styles.dropdownMenu, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant, zIndex: 110, top: 108 }]}>
                  {/* Add New Team - Moved to the very top! */}
                  <Pressable
                    style={({ pressed }) => [
                      styles.dropdownItem,
                      styles.addTeamItem,
                      pressed && { backgroundColor: theme.surfaceLow }
                    ]}
                    onPress={() => {
                      setAddingForTeam('B');
                      setIsNewTeamModalOpen(true);
                    }}
                  >
                    <Ionicons name="add-circle-outline" size={14} color={theme.primary} />
                    <ThemedText style={[styles.dropdownItemText, { color: theme.primary, fontFamily: 'PlusJakartaSans_500Medium' }]}>
                      Add New Team
                    </ThemedText>
                  </Pressable>

                  <ScrollView style={{ maxHeight: 110 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                    {filteredTeamsB.map((team) => (
                      <Pressable
                        key={team.id}
                        style={({ pressed }) => [
                          styles.dropdownItem,
                          pressed && { backgroundColor: theme.surfaceLow }
                        ]}
                        onPress={() => {
                          setTeamBName(team.name);
                          setSearchQueryB(team.name);
                          setDropdownBOpen(false);
                          setTossResult(null);
                          setTossDecision('');
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                          <Image source={getMascotAsset(team.mascot || 'lion')} style={{ width: 16, height: 16, borderRadius: 2 }} contentFit="contain" />
                          <ThemedText style={[styles.dropdownItemText, { color: theme.text, flex: 1 }]} numberOfLines={1}>
                            {team.name}
                          </ThemedText>
                          {team.isFavourite && (
                            <Ionicons name="star" size={10} color="#FFA751" />
                          )}
                        </View>
                      </Pressable>
                    ))}
                    {filteredTeamsB.length === 0 && (
                      <View style={{ padding: 12, alignItems: 'center' }}>
                        <ThemedText style={{ fontSize: 10, color: theme.textSecondary }}>No matching teams</ThemedText>
                      </View>
                    )}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          {/* Tap to toss hint */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', marginTop: 6, width: '100%' }}>
            <Ionicons name="information-circle-outline" size={12} color="rgba(255,255,255,0.3)" />
            <ThemedText style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'PlusJakartaSans_500Medium' }}>
              Tap the coin below to flip · Select call config
            </ThemedText>
          </View>
          </View>
        </LinearGradient>

        {/* Call config setup — separate card below hero */}
        <View style={[styles.coinHero, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', borderLeftColor: theme.primary, marginTop: 12, paddingVertical: 12 }]}>
          <View style={[styles.tossCallConfig, { borderTopColor: theme.outlineVariant + '22', paddingTop: 0, marginTop: 0 }]}>
            <View style={styles.configHeader}>
              <Ionicons name="cog-outline" size={12} color={theme.textSecondary} />
              <ThemedText style={[styles.configLabel, { color: theme.textSecondary }]}>Toss call setup</ThemedText>
            </View>

            <View style={styles.configControlRow}>
              {/* Caller */}
              <View style={styles.configItem}>
                <ThemedText style={[styles.configSubLabel, { color: theme.textSecondary }]}>Caller:</ThemedText>
                <View style={styles.chipRow}>
                  <Pressable
                    onPress={() => setTossCaller('A')}
                    style={[styles.smallChip, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant }, tossCaller === 'A' && styles.smallChipActive]}
                  >
                    <ThemedText style={[styles.chipText, { color: theme.textSecondary }, tossCaller === 'A' && styles.chipTextActive]} numberOfLines={1}>
                      {teamAName || 'Team A'}
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={() => setTossCaller('B')}
                    style={[styles.smallChip, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant }, tossCaller === 'B' && styles.smallChipActive]}
                  >
                    <ThemedText style={[styles.chipText, { color: theme.textSecondary }, tossCaller === 'B' && styles.chipTextActive]} numberOfLines={1}>
                      {teamBName || 'Team B'}
                    </ThemedText>
                  </Pressable>
                </View>
              </View>

              {/* H / T */}
              <View style={styles.configItem}>
                <ThemedText style={[styles.configSubLabel, { color: theme.textSecondary }]}>Call:</ThemedText>
                <View style={styles.chipRow}>
                  <Pressable
                    onPress={() => setTossCall('HEADS')}
                    style={[styles.smallChip, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant }, tossCall === 'HEADS' && styles.smallChipActive]}
                  >
                    <ThemedText style={[styles.chipText, { color: theme.textSecondary }, tossCall === 'HEADS' && styles.chipTextActive]}>Heads</ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={() => setTossCall('TAILS')}
                    style={[styles.smallChip, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant }, tossCall === 'TAILS' && styles.smallChipActive]}
                  >
                    <ThemedText style={[styles.chipText, { color: theme.textSecondary }, tossCall === 'TAILS' && styles.chipTextActive]}>Tails</ThemedText>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ── Toss Result Banner ─────────────────────────── */}
        {tossResult && (
          <LinearGradient
            colors={[theme.surfaceLowest, '#5D68E80c']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.resultBanner, { borderColor: theme.outlineVariant + '33', borderLeftColor: theme.primary }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="sparkles" size={16} color="#FFB800" />
                <ThemedText style={[styles.resultTitle, { color: theme.textSecondary }]}>Coin landed</ThemedText>
              </View>
              <View style={{ backgroundColor: theme.primary + '15', paddingHorizontal: 10, paddingVertical: 3, borderRadius: BorderRadius.md }}>
                <ThemedText style={{ color: theme.primary, fontSize: 10, fontFamily: 'PlusJakartaSans_600SemiBold', letterSpacing: 0.5 }}>{tossResult}</ThemedText>
              </View>
            </View>

            <ThemedText style={[styles.resultSub, { fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: theme.text }]}>
              🎉 {tossWinnerName} won the toss!
            </ThemedText>

            <View style={styles.decisionBox}>
              <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary, marginBottom: 6 }]}>Choose decision action</ThemedText>
              <View style={styles.decisionOptions}>
                {selectedSport.toLowerCase() === 'cricket' ? (
                  <>
                    <Pressable
                      onPress={() => setTossDecision('Bat')}
                      style={[styles.choiceChip, tossDecision === 'Bat' && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                    >
                      <ThemedText style={[styles.choiceChipText, tossDecision === 'Bat' && { color: '#ffffff' }]}>🏏 Batting</ThemedText>
                    </Pressable>
                    <Pressable
                      onPress={() => setTossDecision('Bowl')}
                      style={[styles.choiceChip, tossDecision === 'Bowl' && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                    >
                      <ThemedText style={[styles.choiceChipText, tossDecision === 'Bowl' && { color: '#ffffff' }]}>🥎 Bowling</ThemedText>
                    </Pressable>
                  </>
                ) : (
                  <>
                    <Pressable
                      onPress={() => setTossDecision('Kickoff')}
                      style={[styles.choiceChip, tossDecision === 'Kickoff' && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                    >
                      <ThemedText style={[styles.choiceChipText, tossDecision === 'Kickoff' && { color: '#ffffff' }]}>⚽ Serve / Kickoff</ThemedText>
                    </Pressable>
                    <Pressable
                      onPress={() => setTossDecision('Receive')}
                      style={[styles.choiceChip, tossDecision === 'Receive' && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                    >
                      <ThemedText style={[styles.choiceChipText, tossDecision === 'Receive' && { color: '#ffffff' }]}>🛡️ Receive / Side</ThemedText>
                    </Pressable>
                  </>
                )}
              </View>
            </View>
          </LinearGradient>
        )}
      </ScrollView>

      {/* ── Toss or Start Action Button ─────────────────────────── */}
      <View style={[styles.actionsContainer, { backgroundColor: theme.surfaceLowest }]}>
        {tossResult && tossDecision ? (
          <Pressable onPress={handleStartMatch} style={[styles.tossBtn, { backgroundColor: theme.secondaryContainer }]}>
            <View style={styles.tossBtnLeft}>
              <ThemedText style={[styles.tossBtnTitle, { color: theme.onSecondaryContainer }]}>Start the Match</ThemedText>
              <ThemedText style={[styles.tossBtnSub, { color: theme.onSecondaryContainer + 'dd' }]} numberOfLines={1}>
                {tossWinnerName} won the toss · Choose to {tossDecision}
              </ThemedText>
            </View>
            <View style={[styles.tossCoinCircle, { backgroundColor: theme.secondary }]}>
              <Ionicons name="play" size={14} color="#ffffff" />
            </View>
          </Pressable>
        ) : (
          <Pressable
            onPress={handleToss}
            disabled={isFlipping}
            style={[styles.tossBtn, { backgroundColor: theme.primary }, isFlipping && { opacity: 0.75 }]}
          >
            <View style={styles.tossBtnLeft}>
              <ThemedText style={[styles.tossBtnTitle, { color: '#ffffff' }]}>
                {isFlipping ? 'Flipping Coin...' : 'Toss the Coin'}
              </ThemedText>
              <ThemedText style={[styles.tossBtnSub, { color: 'rgba(255,255,255,0.8)' }]}>
                {selectedSport} · {customFormat || selectedFormat}
              </ThemedText>
            </View>
            <View style={[styles.tossCoinCircle, { backgroundColor: theme.primaryContainer }]}>
              <ThemedText style={{ fontSize: 16 }}>🪙</ThemedText>
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
              {/* Team Name Input */}
              <View style={styles.modalInputGroup}>
                <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Team name *</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: theme.surfaceLow, color: theme.text, borderColor: isNameFocused ? theme.primary : theme.outlineVariant + '44' }
                  ]}
                  placeholder="e.g. London Strikers"
                  placeholderTextColor={theme.textSecondary + '80'}
                  value={newTeamName}
                  onChangeText={setNewTeamName}
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
                    placeholder="LSR"
                    placeholderTextColor={theme.textSecondary + '80'}
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
                    placeholder="+447000"
                    placeholderTextColor={theme.textSecondary + '80'}
                    value={newPhone}
                    onChangeText={(t) => setNewPhone(t.replace(/[^0-9+\s\-()]/g, ''))}
                    onFocus={() => setIsPhoneFocused(true)}
                    onBlur={() => setIsPhoneFocused(false)}
                    keyboardType="phone-pad"
                  />
                  {newPhone !== '' && newPhone.replace(/[^0-9]/g, '').length < 7 && (
                    <ThemedText style={{ color: '#ef4444', fontSize: 10, marginTop: 3 }}>Min 7 digits required</ThemedText>
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
                  onPress={() => setNewIsFavourite(!newIsFavourite)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    alignSelf: 'flex-start',
                    gap: 6,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: BorderRadius.full,
                    backgroundColor: newIsFavourite ? '#FFE25920' : theme.surfaceLow,
                    borderWidth: 1,
                    borderColor: newIsFavourite ? '#FFA751' : theme.outlineVariant + '44',
                    marginTop: 8
                  }}
                >
                  <Ionicons
                    name={newIsFavourite ? "star" : "star-outline"}
                    size={13}
                    color={newIsFavourite ? "#FFA751" : theme.textSecondary}
                  />
                  <ThemedText style={{
                    fontFamily: 'PlusJakartaSans_500Medium',
                    fontSize: 10,
                    color: newIsFavourite ? "#FFA751" : theme.textSecondary
                  }}>
                    Favourite Team
                  </ThemedText>
                </Pressable>
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={[styles.modalActions, { borderTopColor: theme.outlineVariant + '44' }]}>
              <Pressable
                onPress={() => setIsNewTeamModalOpen(false)}
                style={[styles.modalBtn, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant, borderWidth: 1 }]}
              >
                <ThemedText style={{ color: theme.text, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13 }}>Cancel</ThemedText>
              </Pressable>
              <Pressable
                onPress={handleCreateTeamFromModal}
                style={[styles.modalBtn, { backgroundColor: theme.primary }]}
              >
                <ThemedText style={{ color: '#ffffff', fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13 }}>Create Team</ThemedText>
              </Pressable>
            </View>

          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollArea: { flex: 1 },
  scroll: {
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
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
    fontFamily: 'PlusJakartaSans_600SemiBold',
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
    fontFamily: 'PlusJakartaSans_500Medium',
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
    fontFamily: 'PlusJakartaSans_600SemiBold',
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  vsLabel: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_500Medium',
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
    fontFamily: 'PlusJakartaSans_500Medium',
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
    fontFamily: 'PlusJakartaSans_500Medium',
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
    fontFamily: 'PlusJakartaSans_500Medium',
    textAlign: 'center',
  },
  chipTextActive: {
    color: '#0d1d26',
    fontFamily: 'PlusJakartaSans_600SemiBold',
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
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  resultSub: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
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
    fontFamily: 'PlusJakartaSans_500Medium',
    color: '#64748b',
  },
 
  /* Bento Card Container */
  bentoCard: {
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
  inputGroup: {
    flexDirection: 'column',
  },
  fieldLabel: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 10,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  input: {
    height: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontFamily: 'HankenGrotesk_500Medium',
    fontSize: 13,
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
    fontFamily: 'PlusJakartaSans_500Medium',
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
    fontFamily: 'PlusJakartaSans_500Medium',
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
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 11,
    flex: 1,
    marginRight: 4,
  },
  dropdownMenu: {
    position: 'absolute',
    left: 4,
    right: 4,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    maxHeight: 200,
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
    fontFamily: 'PlusJakartaSans_500Medium',
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
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 11,
    height: 32,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingLeft: 8,
    paddingRight: 24,
    marginTop: 8,
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
    fontFamily: 'PlusJakartaSans_500Medium',
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
    fontFamily: 'PlusJakartaSans_600SemiBold',
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
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
  },
  tossBtnSub: {
    fontFamily: 'PlusJakartaSans_500Medium',
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
});
