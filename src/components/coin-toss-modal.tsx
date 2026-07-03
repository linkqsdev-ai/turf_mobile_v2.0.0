import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  Animated,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
let Audio: any = null;
try {
  Audio = require('expo-av').Audio;
} catch (e) {
  console.warn('expo-av is not available in this environment');
}
import { ThemedText } from './themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { SPORTS_LIST } from '@/constants/sports';
import { LinearGradient } from 'expo-linear-gradient';
import { useMatchStore } from '@/store/app-store';

interface CoinTossModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CoinTossModal({ visible, onClose }: CoinTossModalProps) {
  const theme = useTheme();
  const router = useRouter();
  const { teams, addTeam } = useMatchStore();

  // Setup states
  const [selectedSport, setSelectedSport] = useState('Cricket');
  const [teamAName, setTeamAName] = useState('Lions FC');
  const [teamBName, setTeamBName] = useState('Titans Utd');
  const [tossCaller, setTossCaller] = useState<'A' | 'B'>('A');
  const [tossCall, setTossCall] = useState<'HEADS' | 'TAILS'>('HEADS');
  const [tossDecision, setTossDecision] = useState<string>('');

  const [result, setResult] = useState<'HEADS' | 'TAILS' | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  
  const [displaySide, setDisplaySide] = useState<'HEADS' | 'TAILS'>('HEADS');
  const [spinAnim] = useState(() => new Animated.Value(0));
  const [activeField, setActiveField] = useState<'A' | 'B' | null>(null);

  const getSuggestions = (query: string) => {
    const sportTeams = teams.filter(t => t.sport.toLowerCase() === selectedSport.toLowerCase());
    if (!query.trim()) return sportTeams.slice(0, 5);
    return sportTeams.filter(t => t.name.toLowerCase().includes(query.toLowerCase()));
  };

  const hasExactMatch = (query: string, suggestions: any[]) => {
    return suggestions.some(s => s.name.toLowerCase() === query.trim().toLowerCase());
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
    } else {
      setTeamBName(newTeam.name);
    }
    setActiveField(null);
  };

  const renderSuggestions = (field: 'A' | 'B') => {
    if (activeField !== field) return null;
    const query = field === 'A' ? teamAName : teamBName;
    const suggestions = getSuggestions(query);
    const exactMatch = hasExactMatch(query, suggestions);
    
    return (
      <View style={[
        styles.suggestionsContainer, 
        { 
          backgroundColor: theme.surfaceLowest, 
          borderColor: theme.outlineVariant + '66',
        }
      ]}>
        <ScrollView nestedScrollEnabled style={{ maxHeight: 120 }}>
          {suggestions.map((t) => (
            <Pressable
              key={t.id}
              style={({ pressed }) => [
                styles.suggestionItem,
                pressed && { backgroundColor: theme.surfaceLow }
              ]}
              onPress={() => {
                if (field === 'A') {
                  setTeamAName(t.name);
                } else {
                  setTeamBName(t.name);
                }
                setActiveField(null);
              }}
            >
              <Ionicons name="shield" size={12} color={theme.primary} style={{ marginRight: 6 }} />
              <ThemedText style={[styles.suggestionText, { color: theme.text }]} numberOfLines={1}>
                {t.name}
              </ThemedText>
            </Pressable>
          ))}
          
          {query.trim().length > 0 && !exactMatch && (
            <Pressable
              style={({ pressed }) => [
                styles.suggestionItem,
                styles.addNewSuggestionItem,
                pressed && { backgroundColor: theme.primary + '11' }
              ]}
              onPress={() => handleAddNewTeam(query, field)}
            >
              <Ionicons name="add-circle" size={14} color={theme.primary} style={{ marginRight: 6 }} />
              <ThemedText style={[styles.suggestionText, { color: theme.primary, fontFamily: 'HankenGrotesk_700Bold' }]} numberOfLines={1}>
                Add "{query.trim()}"
              </ThemedText>
            </Pressable>
          )}
          
          {suggestions.length === 0 && (!query.trim() || exactMatch) && (
            <View style={{ padding: 10, alignItems: 'center' }}>
              <ThemedText style={{ fontSize: 10, color: theme.textSecondary }}>
                No teams found. Type to add!
              </ThemedText>
            </View>
          )}
        </ScrollView>
      </View>
    );
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

  const handleToss = () => {
    if (isFlipping) return;

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
    });
  };

  const handleClose = () => {
    setResult(null);
    setIsFlipping(false);
    setTossDecision('');
    spinAnim.setValue(0);
    onClose();
  };

  const handleStartMatch = () => {
    if (!teamAName.trim() || !teamBName.trim()) {
      Alert.alert('Error', 'Please enter team names for both slots.');
      return;
    }
    const winner = result === tossCall ? tossCaller : (tossCaller === 'A' ? 'B' : 'A');
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
    handleClose();
  };

  const spin = spinAnim.interpolate({
    inputRange: [0, 8, 9],
    outputRange: ['0deg', '2880deg', '3060deg'],
  });

  const lift = spinAnim.interpolate({
    inputRange: [0, 4.5, 8, 9],
    outputRange: [0, -80, 0, 0],
  });

  const winner = result === tossCall ? tossCaller : (tossCaller === 'A' ? 'B' : 'A');
  const tossWinnerName = winner === 'A' ? teamAName : teamBName;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />
        
        <View style={[styles.modalBox, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant }]}>
          {/* Static close button */}
          <Pressable style={styles.closeBtn} onPress={handleClose}>
            <Ionicons name="close" size={22} color={theme.textSecondary} />
          </Pressable>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ width: '100%' }}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.header}>
              <FontAwesome5 name="coins" size={20} color={theme.secondary} style={{ marginBottom: Spacing.sm }} />
              <ThemedText type="headlineSm" style={{ color: theme.text, fontFamily: 'HankenGrotesk_700Bold' }}>
                Kickoff Coin Toss
              </ThemedText>
              <ThemedText type="labelSm" style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 2 }}>
                Configure and start match live scoring
              </ThemedText>
            </View>

            {/* Sport selector */}
            <View style={styles.section}>
              <ThemedText style={[styles.labelTitle, { color: theme.textSecondary }]}>SPORT</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sportList}>
                {SPORTS_LIST.map((sport) => {
                  const isActive = selectedSport === sport.name;
                  return (
                    <Pressable
                      key={sport.name}
                      onPress={() => {
                        setSelectedSport(sport.name);
                        setResult(null);
                        setTossDecision('');
                      }}
                      style={[
                        styles.sportChip,
                        { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '44' },
                        isActive && { backgroundColor: theme.primary, borderColor: theme.primary },
                      ]}
                    >
                      <MaterialIcons
                        name={sport.icon as any}
                        size={11}
                        color={isActive ? '#ffffff' : theme.textSecondary}
                      />
                      <ThemedText style={[styles.sportChipText, { color: theme.textSecondary }, isActive && { color: '#ffffff' }]}>
                        {sport.name}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Team details input */}
            <View style={[styles.vsRow, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '44', zIndex: 10 }]}>
              <View style={[styles.teamInputCol, { zIndex: 20 }]}>
                <View style={[styles.shieldWrap, { backgroundColor: theme.background, borderColor: theme.outlineVariant }]}>
                  <ThemedText style={[styles.shieldText, { color: theme.primary }]}>
                    {teamAName ? teamAName.substring(0, 3).toUpperCase() : 'T1'}
                  </ThemedText>
                </View>
                <TextInput
                  style={[styles.teamInput, { color: theme.text, borderBottomColor: theme.outlineVariant }]}
                  value={teamAName}
                  onChangeText={(txt) => {
                    setTeamAName(txt);
                    setResult(null);
                    setTossDecision('');
                  }}
                  onFocus={() => setActiveField('A')}
                  onBlur={() => {
                    setTimeout(() => setActiveField(null), 200);
                  }}
                  placeholder="Team A"
                  placeholderTextColor={theme.textSecondary + '70'}
                  maxLength={15}
                />
                {renderSuggestions('A')}
              </View>

              <ThemedText style={[styles.vsCenterText, { color: theme.textSecondary + '70' }]}>VS</ThemedText>

              <View style={[styles.teamInputCol, { zIndex: 20 }]}>
                <View style={[styles.shieldWrap, { backgroundColor: theme.background, borderColor: theme.outlineVariant }]}>
                  <ThemedText style={[styles.shieldText, { color: theme.primary }]}>
                    {teamBName ? teamBName.substring(0, 3).toUpperCase() : 'T2'}
                  </ThemedText>
                </View>
                <TextInput
                  style={[styles.teamInput, { color: theme.text, borderBottomColor: theme.outlineVariant }]}
                  value={teamBName}
                  onChangeText={(txt) => {
                    setTeamBName(txt);
                    setResult(null);
                    setTossDecision('');
                  }}
                  onFocus={() => setActiveField('B')}
                  onBlur={() => {
                    setTimeout(() => setActiveField(null), 200);
                  }}
                  placeholder="Team B"
                  placeholderTextColor={theme.textSecondary + '70'}
                  maxLength={15}
                />
                {renderSuggestions('B')}
              </View>
            </View>

            {/* Toss callers setup */}
            <View style={styles.tossSetup}>
              <ThemedText style={[styles.labelTitle, { color: theme.textSecondary }]}>TOSS CALL SETUP</ThemedText>
              
              <View style={styles.tossSetupRow}>
                {/* Caller choice */}
                <View style={styles.tossSetupCol}>
                  <ThemedText style={[styles.setupSubLabel, { color: theme.textSecondary }]}>CALLER:</ThemedText>
                  <View style={styles.setupRow}>
                    <Pressable
                      onPress={() => setTossCaller('A')}
                      style={[styles.smallSetupChip, { backgroundColor: theme.background, borderColor: theme.outlineVariant }, tossCaller === 'A' && styles.smallSetupChipActive]}
                    >
                      <ThemedText style={[styles.setupChipText, { color: theme.textSecondary }, tossCaller === 'A' && styles.setupChipTextActive]} numberOfLines={1}>
                        {teamAName || 'Team A'}
                      </ThemedText>
                    </Pressable>
                    <Pressable
                      onPress={() => setTossCaller('B')}
                      style={[styles.smallSetupChip, { backgroundColor: theme.background, borderColor: theme.outlineVariant }, tossCaller === 'B' && styles.smallSetupChipActive]}
                    >
                      <ThemedText style={[styles.setupChipText, { color: theme.textSecondary }, tossCaller === 'B' && styles.setupChipTextActive]} numberOfLines={1}>
                        {teamBName || 'Team B'}
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>

                {/* Call choice */}
                <View style={styles.tossSetupCol}>
                  <ThemedText style={[styles.setupSubLabel, { color: theme.textSecondary }]}>CALL:</ThemedText>
                  <View style={styles.setupRow}>
                    <Pressable
                      onPress={() => setTossCall('HEADS')}
                      style={[styles.smallSetupChip, { backgroundColor: theme.background, borderColor: theme.outlineVariant }, tossCall === 'HEADS' && styles.smallSetupChipActive]}
                    >
                      <ThemedText style={[styles.setupChipText, { color: theme.textSecondary }, tossCall === 'HEADS' && styles.setupChipTextActive]}>H</ThemedText>
                    </Pressable>
                    <Pressable
                      onPress={() => setTossCall('TAILS')}
                      style={[styles.smallSetupChip, { backgroundColor: theme.background, borderColor: theme.outlineVariant }, tossCall === 'TAILS' && styles.smallSetupChipActive]}
                    >
                      <ThemedText style={[styles.setupChipText, { color: theme.textSecondary }, tossCall === 'TAILS' && styles.setupChipTextActive]}>T</ThemedText>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>

            {/* Coin flip visual section */}
            <View style={styles.coinArea}>
              <Animated.View
                style={[
                  styles.coinContainer,
                  {
                    transform: [
                      { translateY: lift },
                      { rotateY: spin }
                    ]
                  }
                ]}
              >
                <Pressable onPress={handleToss} disabled={isFlipping}>
                  <LinearGradient
                    colors={['#FFE259', '#FFA751', '#FFE259']}
                    style={styles.coinOuter}
                  >
                    <View style={styles.coinInner}>
                      <ThemedText style={styles.coinText}>
                        {displaySide === 'HEADS' ? 'H' : 'T'}
                      </ThemedText>
                    </View>
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            </View>

            {/* Outcomes & Decision Selection */}
            <View style={styles.resultContainer}>
              {isFlipping && (
                <ThemedText type="bodyMd" style={{ color: theme.secondary, fontFamily: 'HankenGrotesk_700Bold' }}>
                  Flipping Coin...
                </ThemedText>
              )}
              {!isFlipping && result && (
                <View style={styles.tossResolutionBox}>
                  <ThemedText style={[styles.tossResolutionTitle, { color: theme.text }]}>
                    Landed: <ThemedText style={{ color: theme.secondary, fontFamily: 'HankenGrotesk_800ExtraBold' }}>{result}</ThemedText>
                  </ThemedText>
                  <ThemedText style={styles.tossResolutionWinner}>
                    🎉 {tossWinnerName} won the toss!
                  </ThemedText>

                  <View style={[styles.decisionDivider, { backgroundColor: theme.outlineVariant + '44' }]} />

                  {/* Decision Options */}
                  <ThemedText style={[styles.labelTitle, { color: theme.textSecondary }]}>Choose Decision Action</ThemedText>
                  <View style={styles.decisionOptionsRow}>
                    {selectedSport.toLowerCase() === 'cricket' ? (
                      <>
                        <Pressable
                          onPress={() => setTossDecision('Bat')}
                          style={[styles.decisionOptionChip, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '44' }, tossDecision === 'Bat' && styles.decisionOptionChipActive]}
                        >
                          <ThemedText style={[styles.decisionOptionText, { color: theme.textSecondary }, tossDecision === 'Bat' && styles.decisionOptionTextActive]}>🏏 Batting</ThemedText>
                        </Pressable>
                        <Pressable
                          onPress={() => setTossDecision('Bowl')}
                          style={[styles.decisionOptionChip, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '44' }, tossDecision === 'Bowl' && styles.decisionOptionChipActive]}
                        >
                          <ThemedText style={[styles.decisionOptionText, { color: theme.textSecondary }, tossDecision === 'Bowl' && styles.decisionOptionTextActive]}>🥎 Bowling</ThemedText>
                        </Pressable>
                      </>
                    ) : (
                      <>
                        <Pressable
                          onPress={() => setTossDecision('Kickoff')}
                          style={[styles.decisionOptionChip, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '44' }, tossDecision === 'Kickoff' && styles.decisionOptionChipActive]}
                        >
                          <ThemedText style={[styles.decisionOptionText, { color: theme.textSecondary }, tossDecision === 'Kickoff' && styles.decisionOptionTextActive]}>⚽ Serve / Kickoff</ThemedText>
                        </Pressable>
                        <Pressable
                          onPress={() => setTossDecision('Receive')}
                          style={[styles.decisionOptionChip, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '44' }, tossDecision === 'Receive' && styles.decisionOptionChipActive]}
                        >
                          <ThemedText style={[styles.decisionOptionText, { color: theme.textSecondary }, tossDecision === 'Receive' && styles.decisionOptionTextActive]}>🛡️ Receive / Side</ThemedText>
                        </Pressable>
                      </>
                    )}
                  </View>
                </View>
              )}
              {!isFlipping && !result && (
                <ThemedText type="bodyMd" style={{ color: theme.textSecondary }}>
                  Tap coin or Flip button below to toss
                </ThemedText>
              )}
            </View>

            {/* Stepper active action button */}
            {!isFlipping && result && tossDecision ? (
              <Pressable
                style={[styles.actionBtn, { backgroundColor: theme.secondaryContainer }]}
                onPress={handleStartMatch}
              >
                <ThemedText type="labelMd" style={{ color: theme.onSecondaryContainer, fontFamily: 'HankenGrotesk_800ExtraBold' }}>
                  START THE MATCH
                </ThemedText>
              </Pressable>
            ) : (
              <Pressable
                style={[styles.actionBtn, { backgroundColor: theme.primary }, isFlipping && styles.actionBtnDisabled]}
                onPress={handleToss}
                disabled={isFlipping}
              >
                <ThemedText type="labelMd" style={[styles.actionBtnText, { color: '#ffffff' }]}>
                  {isFlipping ? 'TOSSING...' : 'FLIP COIN'}
                </ThemedText>
              </Pressable>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
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
    width: '90%',
    maxWidth: 360,
    maxHeight: '85%',
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    padding: Spacing.md,
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    padding: 4,
    zIndex: 20,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: Spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.md,
    marginTop: 10,
  },
  section: {
    width: '100%',
    marginBottom: 12,
  },
  labelTitle: {
    fontSize: 9,
    fontFamily: 'HankenGrotesk_800ExtraBold',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  sportList: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  sportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginRight: 6,
  },
  sportChipText: {
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 9,
    marginLeft: 3,
  },
  vsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: 8,
    marginBottom: 12,
  },
  teamInputCol: {
    flex: 2,
    alignItems: 'center',
  },
  shieldWrap: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shieldText: {
    fontSize: 12,
    fontFamily: 'HankenGrotesk_800ExtraBold',
  },
  teamInput: {
    borderBottomWidth: 1,
    width: '100%',
    textAlign: 'center',
    fontSize: 11,
    fontFamily: 'HankenGrotesk_700Bold',
    paddingVertical: 2,
    marginTop: 4,
  },
  vsCenterText: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'HankenGrotesk_800ExtraBold',
    fontSize: 12,
  },
  tossSetup: {
    width: '100%',
    marginBottom: 12,
  },
  tossSetupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  tossSetupCol: {
    flex: 1,
  },
  setupSubLabel: {
    fontSize: 8,
    fontFamily: 'HankenGrotesk_700Bold',
    marginBottom: 4,
  },
  setupRow: {
    flexDirection: 'row',
    gap: 6,
  },
  smallSetupChip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallSetupChipActive: {
    backgroundColor: '#FFE259',
    borderColor: '#FFE259',
  },
  setupChipText: {
    fontSize: 9,
    fontFamily: 'HankenGrotesk_700Bold',
    textAlign: 'center',
  },
  setupChipTextActive: {
    color: '#0a1622',
    fontFamily: 'HankenGrotesk_800ExtraBold',
  },
  coinArea: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginVertical: 4,
  },
  coinContainer: {
    width: 68,
    height: 68,
  },
  coinOuter: {
    width: '100%',
    height: '100%',
    borderRadius: 34,
    borderWidth: 3,
    borderColor: '#e5c000',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ffd700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  coinInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinText: {
    color: '#0a1622',
    fontSize: 22,
    fontFamily: 'HankenGrotesk_800ExtraBold',
  },
  resultContainer: {
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    width: '100%',
  },
  tossResolutionBox: {
    alignItems: 'center',
    width: '100%',
  },
  tossResolutionTitle: {
    fontSize: 13,
    fontFamily: 'HankenGrotesk_700Bold',
  },
  tossResolutionWinner: {
    fontSize: 14,
    fontFamily: 'HankenGrotesk_800ExtraBold',
    color: '#5D68E8',
    marginTop: 2,
  },
  decisionDivider: {
    height: 1,
    width: '100%',
    marginVertical: 10,
  },
  decisionOptionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    width: '100%',
  },
  decisionOptionChip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  decisionOptionChipActive: {
    backgroundColor: '#5D68E8',
    borderColor: '#5D68E8',
  },
  decisionOptionText: {
    fontSize: 11,
    fontFamily: 'HankenGrotesk_700Bold',
  },
  decisionOptionTextActive: {
    color: '#ffffff',
    fontFamily: 'HankenGrotesk_800ExtraBold',
  },
  actionBtn: {
    height: 42,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    shadowColor: '#5D68E8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  actionBtnDisabled: {
    backgroundColor: 'rgba(93, 104, 232, 0.4)',
  },
  actionBtnText: {
    fontFamily: 'HankenGrotesk_800ExtraBold',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '105%',
    left: -20,
    right: -20,
    zIndex: 100,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  addNewSuggestionItem: {
    borderBottomWidth: 0,
  },
  suggestionText: {
    fontSize: 11,
    fontFamily: 'HankenGrotesk_500Medium',
  },
});
