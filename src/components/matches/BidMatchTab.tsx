import { ThemedText } from '@/components/themed-text';
import { Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

const SPORTS = ['Football', 'Cricket', 'Tennis'];
const BID_AMOUNTS = [50, 100, 200, 500];

const TEAMS = [
  { id: '1', name: 'Weekend Warriors', short: 'WW', winRate: 82, rating: 4.8, matches: 45 },
  { id: '2', name: 'FC Thunder', short: 'FCT', winRate: 68, rating: 4.5, matches: 32 },
  { id: '3', name: 'Neon Knights', short: 'NNK', winRate: 91, rating: 4.9, matches: 128 },
  { id: '4', name: 'Urban Legends', short: 'URL', winRate: 54, rating: 4.2, matches: 15 },
];

export function BidMatchTab() {
  const theme = useTheme();
  const [matchType, setMatchType] = useState<'open' | 'friend'>('open');
  const [bidAmount, setBidAmount] = useState(100);
  const [selectedSport, setSelectedSport] = useState('Football');
  const [searchText, setSearchText] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  // Focus states
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const filteredTeams = TEAMS.filter((t) =>
    t.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleAction = () => {
    if (matchType === 'friend' && !selectedTeam) {
      return Alert.alert('Required', 'Please select an opponent team to challenge.');
    }
    const teamName = matchType === 'friend' ? TEAMS.find(t => t.id === selectedTeam)?.name : '';
    Alert.alert(
      'Success',
      matchType === 'open'
        ? `Broadcast Bid for ${selectedSport} with ${bidAmount} coins has been published!`
        : `Challenge sent to ${teamName} for ${selectedSport} with ${bidAmount} coins!`
    );
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
      style={{ backgroundColor: '#f7f9fb' }}
      bounces={false}
    >
      {/* ── Stakes Header (Technical Navy) ─────────────── */}
      <View style={styles.stakeHeader}>
        <View style={styles.stakeTop}>
          <View>
            <ThemedText style={styles.stakeLabel}>STAKE</ThemedText>
            <View style={styles.amountRow}>
              <ThemedText style={styles.stakeAmount}>{bidAmount}</ThemedText>
              <ThemedText style={styles.stakeUnit}>coins</ThemedText>
            </View>
          </View>
          <View style={styles.balanceWrap}>
            <FontAwesome5 name="coins" size={10} color="#ffc703" />
            <ThemedText style={styles.balanceText}>Balance: 850</ThemedText>
          </View>
        </View>

        {/* Bid amount selector */}
        <View style={styles.bidRow}>
          {BID_AMOUNTS.map((amt) => {
            const isActive = bidAmount === amt;
            return (
              <Pressable
                key={amt}
                onPress={() => setBidAmount(amt)}
                style={[
                  styles.bidChip,
                  isActive
                    ? { backgroundColor: '#ffc703', borderColor: '#ffc703' }
                    : { backgroundColor: 'rgba(255, 255, 255, 0.08)', borderColor: 'rgba(255, 255, 255, 0.15)' }
                ]}
              >
                <ThemedText
                  style={{
                    fontSize: 12,
                    fontFamily: isActive ? 'HankenGrotesk_700Bold' : 'HankenGrotesk_500Medium',
                    color: isActive ? '#594400' : '#cbd5e1',
                  }}
                >
                  {amt}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── Form Body Bento Card ────────────────────────── */}
      <View style={[styles.bentoCard, Shadows.level2]}>

        {/* Match type toggle */}
        <View style={styles.inputGroup}>
          <ThemedText style={styles.fieldLabel}>CHALLENGE TYPE</ThemedText>
          <View style={styles.toggleContainer}>
            {(['open', 'friend'] as const).map((t) => {
              const isActive = matchType === t;
              const label = t === 'open' ? 'Open Bid' : 'Friend Match';
              const icon = t === 'open' ? 'public' : 'group';
              return (
                <Pressable
                  key={t}
                  onPress={() => setMatchType(t)}
                  style={[
                    styles.toggleBtn,
                    isActive
                      ? { backgroundColor: '#001b3d' }
                      : { backgroundColor: 'transparent' }
                  ]}
                >
                  <MaterialIcons
                    name={icon as any}
                    size={14}
                    color={isActive ? '#ffffff' : '#74777f'}
                  />
                  <ThemedText
                    style={[
                      styles.toggleBtnText,
                      { color: isActive ? '#ffffff' : '#74777f' }
                    ]}
                  >
                    {label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
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
                  onPress={() => setSelectedSport(s)}
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

        {/* Team list (only in friend mode) */}
        {matchType === 'friend' && (
          <>
            <View style={styles.formDivider} />

            <View style={styles.inputGroup}>
              <ThemedText style={styles.fieldLabel}>FIND A TEAM</ThemedText>

              {/* Search Box */}
              <View
                style={[
                  styles.searchBar,
                  { borderColor: isSearchFocused ? '#001b3d' : '#c4c6cf' }
                ]}
              >
                <Ionicons name="search" size={14} color="#74777f" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by team name..."
                  placeholderTextColor="#74777f80"
                  value={searchText}
                  onChangeText={setSearchText}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                />
              </View>

              {/* Team list */}
              <View style={styles.teamListContainer}>
                {filteredTeams.map((team, idx) => {
                  const isSelected = selectedTeam === team.id;
                  return (
                    <Pressable
                      key={team.id}
                      onPress={() => setSelectedTeam(team.id)}
                      style={[
                        styles.teamRow,
                        isSelected && { backgroundColor: '#f2f4f6' },
                        idx > 0 && { borderTopWidth: 1, borderTopColor: '#eceef0' }
                      ]}
                    >
                      {/* Monogram Crest */}
                      <View
                        style={[
                          styles.teamMonogram,
                          {
                            backgroundColor: isSelected ? '#ffc70318' : '#f7f9fb',
                            borderColor: isSelected ? '#ffc703' : '#c4c6cf'
                          }
                        ]}
                      >
                        <ThemedText
                          style={[
                            styles.monogramText,
                            { color: isSelected ? '#594400' : '#44474e' }
                          ]}
                        >
                          {team.short}
                        </ThemedText>
                      </View>

                      {/* Info */}
                      <View style={{ flex: 1 }}>
                        <ThemedText style={styles.teamNameText}>{team.name}</ThemedText>
                        <View style={styles.teamStatsRow}>
                          <View style={styles.ratingBox}>
                            <Ionicons name="star" size={10} color="#ffc703" />
                            <ThemedText style={styles.ratingText}>{team.rating}</ThemedText>
                          </View>
                          <ThemedText style={styles.statsDot}>·</ThemedText>
                          <ThemedText style={styles.statsText}>{team.winRate}% wins</ThemedText>
                          <ThemedText style={styles.statsDot}>·</ThemedText>
                          <ThemedText style={styles.statsText}>{team.matches} matches</ThemedText>
                        </View>
                      </View>

                      {/* Selector */}
                      {isSelected ? (
                        <Ionicons name="checkmark-circle" size={18} color="#001b3d" />
                      ) : (
                        <Ionicons name="chevron-forward" size={14} color="#cbd5e1" />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </>
        )}

      </View>

      {/* ── Actions Row (Gold CTA) ────────────────────── */}
      <View style={styles.actionsContainer}>
        <Pressable
          onPress={handleAction}
          style={[styles.primaryButton, { backgroundColor: '#ffc703' }]}
        >
          <View style={styles.btnContent}>
            <ThemedText style={styles.primaryButtonText}>
              {matchType === 'open'
                ? 'Broadcast Bid'
                : selectedTeam
                  ? 'Send Challenge'
                  : 'Select Opponent'}
            </ThemedText>
            <Ionicons name="arrow-forward" size={16} color="#594400" />
          </View>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: Spacing.containerMargin,
    paddingBottom: 48,
  },

  /* Stake Header */
  stakeHeader: {
    backgroundColor: '#001b3d',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#001b3d',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  stakeTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stakeLabel: {
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 9,
    letterSpacing: 1.2,
    color: '#cbd5e1b0',
    marginBottom: 4,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  stakeAmount: {
    fontFamily: 'HankenGrotesk_800ExtraBold',
    fontSize: 36,
    lineHeight: 40,
    color: '#ffffff',
  },
  stakeUnit: {
    fontFamily: 'HankenGrotesk_500Medium',
    fontSize: 12,
    color: '#ffc703',
    marginBottom: 4,
  },
  balanceWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  balanceText: {
    fontFamily: 'HankenGrotesk_600SemiBold',
    fontSize: 10,
    color: '#cbd5e1b0',
  },
  bidRow: {
    flexDirection: 'row',
    gap: 8,
  },
  bidChip: {
    flex: 1,
    height: 38,
    borderWidth: 1.5,
    borderRadius: 4, // 4px sharp radius for chips/buttons
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f2f4f6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e3e5',
    padding: 3,
    gap: 3,
  },
  toggleBtn: {
    flex: 1,
    height: 36,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    borderRadius: 6,
  },
  toggleBtnText: {
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 12,
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
    borderRadius: 4, // 4px border radius per shape rules
    justifyContent: 'center',
    alignItems: 'center',
  },
  sportPillText: {
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 12,
  },

  /* Find Team Styles */
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 4,
    borderWidth: 1.5,
    paddingHorizontal: 10,
    backgroundColor: '#f7f9fb',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'HankenGrotesk_500Medium',
    fontSize: 13,
    color: '#191c1e',
    marginLeft: 8,
  },
  teamListContainer: {
    borderWidth: 1,
    borderColor: '#e0e3e5',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  teamMonogram: {
    width: 38,
    height: 38,
    borderRadius: 4,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monogramText: {
    fontFamily: 'HankenGrotesk_800ExtraBold',
    fontSize: 10,
  },
  teamNameText: {
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 13,
    color: '#191c1e',
  },
  teamStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontFamily: 'HankenGrotesk_600SemiBold',
    fontSize: 10,
    color: '#765b00',
  },
  statsDot: {
    fontSize: 10,
    color: '#c4c6cf',
    marginHorizontal: 4,
  },
  statsText: {
    fontFamily: 'HankenGrotesk_400Regular',
    fontSize: 10,
    color: '#74777f',
  },

  /* Actions container */
  actionsContainer: {
    flexDirection: 'column',
  },
  primaryButton: {
    height: 48,
    borderRadius: 4, // consistent 4px radius for buttons
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ffc703',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: {
    fontFamily: 'HankenGrotesk_800ExtraBold',
    fontSize: 14,
    color: '#594400',
  },
});
