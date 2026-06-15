import { CoinTossModal } from '@/components/coin-toss-modal';
import { ThemedText } from '@/components/themed-text';
import { Shadows, Spacing } from '@/constants/theme';
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

const SPORTS = ['Football', 'Cricket', 'Basketball', 'Tennis'];
const FORMATS: Record<string, string[]> = {
  Football: ['5-a-side', '7-a-side', '11-a-side'],
  Cricket: ['T10', 'T20', 'ODI'],
  Basketball: ['Half Court', 'Full Court'],
  Tennis: ['Singles', 'Doubles'],
};

export function QuickMatchTab() {
  const theme = useTheme();
  const [teamName, setTeamName] = useState('');
  const [shortName, setShortName] = useState('');
  const [selectedSport, setSelectedSport] = useState('Football');
  const [selectedFormat, setSelectedFormat] = useState('5-a-side');
  const [coinTossVisible, setCoinTossVisible] = useState(false);

  // Focus states
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isShortFocused, setIsShortFocused] = useState(false);

  const spinAnim = useRef(new Animated.Value(0)).current;

  const spinCoin = () => {
    spinAnim.setValue(0);
    Animated.timing(spinAnim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();
  };

  const coinSpin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '720deg'],
  });

  const handleSportChange = (sport: string) => {
    setSelectedSport(sport);
    setSelectedFormat(FORMATS[sport][0]);
  };

  const handleToss = () => {
    if (!teamName.trim()) {
      Alert.alert('Required', 'Enter your team name first.');
      return;
    }
    spinCoin();
    setTimeout(() => setCoinTossVisible(true), 500);
  };

  const displayShort = shortName || teamName.slice(0, 3).toUpperCase() || 'NEW';

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
      style={{ backgroundColor: '#f7f9fb' }}
      bounces={false}
    >
      {/* ── Coin Hero (Navy watermarked banner) ────────── */}
      <View style={styles.coinHero}>
        <View style={styles.vsRow}>
          {/* Your team */}
          <View style={styles.teamSide}>
            <View style={[styles.teamShield, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)' }]}>
              <ThemedText style={styles.shieldText}>{displayShort}</ThemedText>
            </View>
            <ThemedText style={styles.teamSideLabel} numberOfLines={1}>
              {teamName || 'Your Team'}
            </ThemedText>
          </View>

          {/* Coin Spin Center */}
          <View style={styles.coinCenter}>
            <Pressable onPress={spinCoin}>
              <Animated.View style={[styles.coin, { transform: [{ rotateY: coinSpin }] }]}>
                <LinearGradient
                  colors={['#ffc703', '#feae2c', '#ffc703']}
                  style={styles.coinFace}
                >
                  <ThemedText style={styles.coinSymbol}>₵</ThemedText>
                </LinearGradient>
              </Animated.View>
            </Pressable>
            <ThemedText style={styles.vsLabel}>vs</ThemedText>
          </View>

          {/* Opponent */}
          <View style={styles.teamSide}>
            <View style={[styles.teamShield, { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', borderStyle: 'dashed' }]}>
              <Ionicons name="help-outline" size={20} color="rgba(255,255,255,0.25)" />
            </View>
            <ThemedText style={[styles.teamSideLabel, { color: 'rgba(255,255,255,0.3)' }]}>
              Opponent
            </ThemedText>
          </View>
        </View>

        <ThemedText style={styles.heroHint}>Tap coin to preview spin</ThemedText>
      </View>

      {/* ── Bento Form Container ───────────────────────── */}
      <View style={[styles.bentoCard, Shadows.level2]}>

        {/* Team name input */}
        <View style={styles.inputGroup}>
          <ThemedText style={styles.fieldLabel}>TEAM NAME</ThemedText>
          <TextInput
            style={[
              styles.underlinedInput,
              { borderBottomColor: isNameFocused ? '#001b3d' : '#c4c6cf' }
            ]}
            placeholder="e.g. Weekend Warriors"
            placeholderTextColor="#74777f80"
            value={teamName}
            onChangeText={setTeamName}
            onFocus={() => setIsNameFocused(true)}
            onBlur={() => setIsNameFocused(false)}
          />
        </View>

        {/* Short Name Input */}
        <View style={[styles.inputGroup, { marginTop: 18 }]}>
          <ThemedText style={styles.fieldLabel}>SHORT NAME</ThemedText>
          <TextInput
            style={[
              styles.underlinedInput,
              { borderBottomColor: isShortFocused ? '#001b3d' : '#c4c6cf' }
            ]}
            placeholder="WW (max 4 characters)"
            placeholderTextColor="#74777f80"
            value={shortName}
            onChangeText={setShortName}
            maxLength={4}
            autoCapitalize="characters"
            onFocus={() => setIsShortFocused(true)}
            onBlur={() => setIsShortFocused(false)}
          />
        </View>

        <View style={styles.formDivider} />

        {/* Sport selection */}
        <View style={styles.inputGroup}>
          <ThemedText style={styles.fieldLabel}>SPORT</ThemedText>
          <View style={styles.sportList}>
            {SPORTS.map((s) => {
              const isActive = selectedSport === s;
              return (
                <Pressable
                  key={s}
                  onPress={() => handleSportChange(s)}
                  style={[
                    styles.sportPill,
                    isActive
                      ? { backgroundColor: '#001b3d', borderColor: '#001b3d' }
                      : { backgroundColor: '#ffffff', borderColor: '#c4c6cf' }
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.sportPillText,
                      { color: isActive ? '#ffffff' : '#44474e' }
                    ]}
                  >
                    {s}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.formDivider} />

        {/* Format Selection */}
        <View style={styles.inputGroup}>
          <ThemedText style={styles.fieldLabel}>FORMAT</ThemedText>
          <View style={styles.formatList}>
            {FORMATS[selectedSport].map((f) => {
              const isActive = selectedFormat === f;
              return (
                <Pressable
                  key={f}
                  onPress={() => setSelectedFormat(f)}
                  style={[
                    styles.formatChip,
                    isActive
                      ? { backgroundColor: 'rgba(255, 199, 3, 0.15)', borderColor: '#ffc703' }
                      : { backgroundColor: '#ffffff', borderColor: '#c4c6cf' }
                  ]}
                >
                  {isActive && <View style={styles.formatDot} />}
                  <ThemedText
                    style={[
                      styles.formatChipText,
                      { color: isActive ? '#594400' : '#44474e' }
                    ]}
                  >
                    {f}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>

      </View>

      {/* ── Toss Action Button ─────────────────────────── */}
      <View style={styles.actionsContainer}>
        <Pressable onPress={handleToss} style={[styles.tossBtn, { backgroundColor: '#001b3d' }]}>
          <View style={styles.tossBtnLeft}>
            <ThemedText style={styles.tossBtnTitle}>Toss the Coin</ThemedText>
            <ThemedText style={styles.tossBtnSub}>{selectedSport} · {selectedFormat}</ThemedText>
          </View>
          <View style={styles.tossCoinCircle}>
            <ThemedText style={{ fontSize: 16 }}>🪙</ThemedText>
          </View>
        </Pressable>
      </View>

      <CoinTossModal visible={coinTossVisible} onClose={() => setCoinTossVisible(false)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: Spacing.containerMargin,
    paddingBottom: 48,
  },

  /* Coin Hero */
  coinHero: {
    backgroundColor: '#001b3d',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#001b3d',
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
    marginBottom: 10,
  },
  teamSide: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  teamShield: {
    width: 64,
    height: 64,
    borderRadius: 8,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shieldText: {
    fontSize: 15,
    fontFamily: 'HankenGrotesk_800ExtraBold',
    color: '#ffffff',
    letterSpacing: 0.8,
  },
  teamSideLabel: {
    fontSize: 11,
    fontFamily: 'HankenGrotesk_600SemiBold',
    color: '#cbd5e1b0',
    textAlign: 'center',
  },
  coinCenter: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
  },
  coin: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#ffc703',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  coinFace: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinSymbol: {
    fontSize: 22,
    color: '#594400',
    fontFamily: 'HankenGrotesk_800ExtraBold',
  },
  vsLabel: {
    fontSize: 10,
    fontFamily: 'HankenGrotesk_800ExtraBold',
    color: 'rgba(255,255,255,0.25)',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  heroHint: {
    fontSize: 10,
    fontFamily: 'HankenGrotesk_400Regular',
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 0.3,
  },

  /* Bento Card Container */
  bentoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 32, // premium 32px borders
    borderWidth: 1,
    borderColor: '#e0e3e5',
    padding: 20,
    marginBottom: 24,
  },
  inputGroup: {
    flexDirection: 'column',
  },
  fieldLabel: {
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 10,
    letterSpacing: 0.8,
    color: '#74777f',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  underlinedInput: {
    fontFamily: 'HankenGrotesk_500Medium',
    fontSize: 14,
    color: '#191c1e',
    paddingVertical: 8,
    borderBottomWidth: 1.5,
  },
  formDivider: {
    height: 1,
    backgroundColor: '#eceef0',
    marginVertical: 18,
  },
  sportList: {
    flexDirection: 'row',
    gap: 8,
  },
  sportPill: {
    flex: 1,
    height: 36,
    borderWidth: 1.5,
    borderRadius: 4, // 4px sharp radius per shape system
    justifyContent: 'center',
    alignItems: 'center',
  },
  sportPillText: {
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 12,
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
    borderRadius: 4, // 4px radius
    borderWidth: 1.5,
  },
  formatDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffc703',
  },
  formatChipText: {
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 11,
  },

  /* Actions container */
  actionsContainer: {
    flexDirection: 'column',
  },
  tossBtn: {
    height: 52,
    borderRadius: 4, // 4px sharp border radius
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    shadowColor: '#001b3d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  tossBtnLeft: {
    flexDirection: 'column',
  },
  tossBtnTitle: {
    fontFamily: 'HankenGrotesk_800ExtraBold',
    fontSize: 15,
    color: '#ffffff',
  },
  tossBtnSub: {
    fontFamily: 'HankenGrotesk_500Medium',
    fontSize: 10,
    color: '#cbd5e1b0',
    marginTop: 2,
  },
  tossCoinCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ffc703',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
