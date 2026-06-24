import { CoinTossModal } from '@/components/coin-toss-modal';
import { ThemedText } from '@/components/themed-text';
import { Shadows, Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { SPORTS_LIST } from '@/constants/sports';
import { MaterialIcons } from '@expo/vector-icons';

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

export function QuickMatchTab({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const theme = useTheme();
  const router = useRouter();
  const [selectedSport, setSelectedSport] = useState('Football');
  const [selectedFormat, setSelectedFormat] = useState('5-a-side');
  const [customFormat, setCustomFormat] = useState('');

  // Team configuration states
  const [teamAName, setTeamAName] = useState('Lions FC');
  const [teamBName, setTeamBName] = useState('Titans Utd');

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

  const spinCoin = () => {
    if (isFlipping) return;
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
    });
  };

  const coinSpin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '2880deg'],
  });

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
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        style={styles.scrollArea}
        bounces={false}
      >
      {/* ── Coin Hero (Primary Container banner) ────────── */}
      <View style={[styles.coinHero, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '44', borderWidth: 1 }]}>
        <View style={styles.vsRow}>
          {/* Team A Slot */}
          <View style={styles.teamSide}>
            <View style={[styles.teamShield, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant }]}>
              <ThemedText style={[styles.shieldText, { color: theme.primary }]}>
                {teamAName ? teamAName.substring(0, 3).toUpperCase() : 'T1'}
              </ThemedText>
            </View>
            <TextInput
              style={[styles.teamInput, { color: theme.text, borderBottomColor: theme.outlineVariant }]}
              value={teamAName}
              onChangeText={(txt) => {
                setTeamAName(txt);
                setTossResult(null);
                setTossDecision('');
              }}
              placeholder="Team A"
              placeholderTextColor={theme.textSecondary + '70'}
              maxLength={15}
            />
          </View>

          {/* Coin Toss Center */}
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
            <ThemedText style={[styles.vsLabel, { color: theme.textSecondary }]}>vs</ThemedText>
          </View>

          {/* Team B Slot */}
          <View style={styles.teamSide}>
            <View style={[styles.teamShield, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant }]}>
              <ThemedText style={[styles.shieldText, { color: theme.primary }]}>
                {teamBName ? teamBName.substring(0, 3).toUpperCase() : 'T2'}
              </ThemedText>
            </View>
            <TextInput
              style={[styles.teamInput, { color: theme.text, borderBottomColor: theme.outlineVariant }]}
              value={teamBName}
              onChangeText={(txt) => {
                setTeamBName(txt);
                setTossResult(null);
                setTossDecision('');
              }}
              placeholder="Team B"
              placeholderTextColor={theme.textSecondary + '70'}
              maxLength={15}
            />
          </View>
        </View>

        {/* Call config setup */}
        <View style={[styles.tossCallConfig, { borderTopColor: theme.outlineVariant + '44' }]}>
          <View style={styles.configHeader}>
            <Ionicons name="cog-outline" size={12} color={theme.textSecondary} />
            <ThemedText style={[styles.configLabel, { color: theme.textSecondary }]}>TOSS CALL SETUP</ThemedText>
          </View>
          
          <View style={styles.configControlRow}>
            {/* Caller */}
            <View style={styles.configItem}>
              <ThemedText style={[styles.configSubLabel, { color: theme.textSecondary }]}>CALLER:</ThemedText>
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
              <ThemedText style={[styles.configSubLabel, { color: theme.textSecondary }]}>CALL:</ThemedText>
              <View style={styles.chipRow}>
                <Pressable
                  onPress={() => setTossCall('HEADS')}
                  style={[styles.smallChip, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant }, tossCall === 'HEADS' && styles.smallChipActive]}
                >
                  <ThemedText style={[styles.chipText, { color: theme.textSecondary }, tossCall === 'HEADS' && styles.chipTextActive]}>HEADS</ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => setTossCall('TAILS')}
                  style={[styles.smallChip, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant }, tossCall === 'TAILS' && styles.smallChipActive]}
                >
                  <ThemedText style={[styles.chipText, { color: theme.textSecondary }, tossCall === 'TAILS' && styles.chipTextActive]}>TAILS</ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* ── Toss Result Banner ─────────────────────────── */}
      {tossResult && (
        <View style={[styles.resultBanner, Shadows.level2, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '44' }]}>
          <View style={styles.resultTitleRow}>
            <Ionicons name="medal-outline" size={18} color={theme.secondary} />
            <ThemedText style={styles.resultTitle}>
              Coin landed: <ThemedText style={{ color: theme.secondary, fontFamily: 'HankenGrotesk_800ExtraBold' }}>{tossResult}</ThemedText>
            </ThemedText>
          </View>
          
          <ThemedText style={styles.resultSub}>
            🎉 {tossWinnerName} won the toss!
          </ThemedText>
          
          <View style={styles.decisionBox}>
            <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary, marginBottom: 6 }]}>Choose Decision Action</ThemedText>
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
        </View>
      )}

      {/* ── Bento Form Container ───────────────────────── */}
      <View style={[styles.bentoCard, Shadows.level2, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '44' }]}>
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
                  fontFamily: 'HankenGrotesk_700Bold', 
                  fontSize: 11, 
                  minWidth: 80,
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

  /* Coin Hero */
  coinHero: {
    borderRadius: BorderRadius.xl,
    padding: 16,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#1a2a33',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
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
    fontFamily: 'HankenGrotesk_800ExtraBold',
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
    fontFamily: 'HankenGrotesk_700Bold',
    paddingVertical: 4,
    marginTop: 6,
  },
  coinCenter: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
  coin: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffd700',
    borderWidth: 3,
    borderColor: '#e5c000',
    shadowColor: '#ffd700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
    overflow: 'hidden',
  },
  coinFace: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinSymbol: {
    fontSize: 26,
    fontWeight: '900',
    fontFamily: 'HankenGrotesk_800ExtraBold',
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  vsLabel: {
    fontSize: 10,
    fontFamily: 'HankenGrotesk_800ExtraBold',
    letterSpacing: 2,
    textTransform: 'uppercase',
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
    fontFamily: 'HankenGrotesk_800ExtraBold',
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
    fontFamily: 'HankenGrotesk_700Bold',
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
    fontFamily: 'HankenGrotesk_700Bold',
    textAlign: 'center',
  },
  chipTextActive: {
    color: '#0d1d26',
    fontFamily: 'HankenGrotesk_800ExtraBold',
  },

  /* Result Banner */
  resultBanner: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  resultTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resultTitle: {
    fontSize: 13,
    fontFamily: 'HankenGrotesk_700Bold',
  },
  resultSub: {
    fontSize: 14,
    fontFamily: 'HankenGrotesk_800ExtraBold',
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
    fontFamily: 'HankenGrotesk_700Bold',
    color: '#64748b',
  },

  /* Bento Card Container */
  bentoCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  inputGroup: {
    flexDirection: 'column',
  },
  fieldLabel: {
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 10,
    letterSpacing: 0.5,
    marginBottom: 4,
    textTransform: 'uppercase',
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
    fontFamily: 'HankenGrotesk_600SemiBold',
    fontSize: 10,
    marginLeft: 4,
  },
  formatList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  formatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  formatDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  formatChipText: {
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 11,
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
    fontFamily: 'HankenGrotesk_800ExtraBold',
    fontSize: 14,
  },
  tossBtnSub: {
    fontFamily: 'HankenGrotesk_500Medium',
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
