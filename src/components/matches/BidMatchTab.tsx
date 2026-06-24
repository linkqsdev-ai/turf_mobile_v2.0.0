import { ThemedText } from '@/components/themed-text';
import { Shadows, Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { SPORTS_LIST } from '@/constants/sports';

const BID_AMOUNTS = [50, 100, 200, 500];

const TEAMS = [
  { id: '1', name: 'Weekend Warriors', short: 'WW', image: require('@/assets/images/mascots/warrior.png'), winRate: 82, rating: 4.8, matches: 45 },
  { id: '2', name: 'FC Thunder', short: 'FCT', image: require('@/assets/images/mascots/eagle.png'), winRate: 68, rating: 4.5, matches: 32 },
  { id: '3', name: 'Neon Knights', short: 'NNK', image: require('@/assets/images/mascots/panther.png'), winRate: 91, rating: 4.9, matches: 128 },
  { id: '4', name: 'Urban Legends', short: 'URL', image: require('@/assets/images/mascots/tiger.png'), winRate: 54, rating: 4.2, matches: 15 },
];

export function BidMatchTab() {
  const theme = useTheme();
  const [bidAmount, setBidAmount] = useState(100);
  const [customBid, setCustomBid] = useState('');
  const [selectedSport, setSelectedSport] = useState('Football');
  const [searchText, setSearchText] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  // Focus states
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const filteredTeams = TEAMS.filter((t) =>
    t.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleAction = (type: 'open' | 'friend') => {
    if (type === 'friend' && !selectedTeam) {
      return Alert.alert('Required', 'Please select an opponent team to challenge.');
    }
    const amount = bidAmount || parseInt(customBid, 10) || 0;
    if (amount <= 0) {
      return Alert.alert('Required', 'Please enter a valid bid amount.');
    }

    const teamName = type === 'friend' ? TEAMS.find(t => t.id === selectedTeam)?.name : '';
    Alert.alert(
      'Success',
      type === 'open'
        ? `Broadcast Bid for ${selectedSport} with ₹${amount} has been published!`
        : `Challenge sent to ${teamName} for ${selectedSport} with ₹${amount}!`
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: 85 }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        style={styles.scrollArea}
        bounces={false}
      >
      {/* ── Stakes Header (Primary Container) ─────────────── */}
      <View style={[styles.stakeHeader, { backgroundColor: theme.primaryContainer }]}>
        <View style={styles.stakeTop}>
          <View>
            <ThemedText style={[styles.stakeLabel, { color: theme.onPrimaryContainer + 'b0' }]}>BID</ThemedText>
            <View style={styles.amountRow}>
              <ThemedText style={[styles.stakeAmount, { color: theme.onPrimaryContainer }]}>{bidAmount || customBid || 0}</ThemedText>
              <ThemedText style={[styles.stakeUnit, { color: theme.primary }]}>Rupees</ThemedText>
            </View>
          </View>
        </View>

        {/* Bid amount selector */}
        <View style={styles.bidRow}>
          {BID_AMOUNTS.map((amt) => {
            const isActive = bidAmount === amt;
            return (
              <Pressable
                key={amt}
                onPress={() => {
                  setBidAmount(amt);
                  setCustomBid('');
                }}
                style={[
                  styles.bidChip,
                  isActive
                    ? { backgroundColor: theme.primary, borderColor: theme.primary }
                    : { backgroundColor: theme.onPrimaryContainer + '11', borderColor: theme.onPrimaryContainer + '22' }
                ]}
              >
                <ThemedText
                  style={{
                    fontSize: 12,
                    fontFamily: isActive ? 'HankenGrotesk_700Bold' : 'HankenGrotesk_500Medium',
                    color: isActive ? '#ffffff' : theme.onPrimaryContainer,
                  }}
                >
                  {amt}
                </ThemedText>
              </Pressable>
            );
          })}
          <TextInput
            style={[styles.bidChip, { color: theme.onPrimaryContainer, borderColor: theme.onPrimaryContainer + '22', fontFamily: 'HankenGrotesk_500Medium', fontSize: 12, textAlign: 'center' }]}
            placeholder="Custom"
            placeholderTextColor={theme.onPrimaryContainer + '60'}
            keyboardType="number-pad"
            value={customBid}
            onChangeText={(val) => {
              setCustomBid(val);
              setBidAmount(0); // Clear preset selection when custom is typed
            }}
            onFocus={() => { setBidAmount(0); }}
          />
        </View>
      </View>

      {/* ── Form Body Bento Card ────────────────────────── */}
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
                  onPress={() => setSelectedSport(sport.name)}
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

        {/* Team list */}
        <View style={styles.inputGroup}>
          <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Find a Team</ThemedText>

          {/* Search Box */}
          <View
            style={[
              styles.searchBar,
              { backgroundColor: theme.surfaceLow, borderColor: isSearchFocused ? theme.primary : theme.outlineVariant + '44' }
            ]}
          >
            <Ionicons name="search" size={14} color={theme.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search by team name..."
              placeholderTextColor={theme.textSecondary + '80'}
              value={searchText}
              onChangeText={setSearchText}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
          </View>

          {/* Team list */}
          <View style={[styles.teamListContainer, { borderColor: theme.outlineVariant + '44', backgroundColor: theme.surfaceLowest }]}>
            {filteredTeams.map((team, idx) => {
              const isSelected = selectedTeam === team.id;
              return (
                <Pressable
                  key={team.id}
                  onPress={() => setSelectedTeam(team.id)}
                  style={[
                    styles.teamRow,
                    isSelected && { backgroundColor: theme.surfaceLow },
                    idx > 0 && { borderTopWidth: 1, borderTopColor: theme.outlineVariant + '44' }
                  ]}
                >
                  {/* Monogram Crest */}
                  <View
                    style={[
                      styles.teamMonogram,
                      {
                        backgroundColor: isSelected ? theme.primary + '11' : theme.surfaceLow,
                        borderColor: isSelected ? theme.primary : theme.outlineVariant + '44',
                        overflow: 'hidden'
                      }
                    ]}
                  >
                    <Image source={team.image} style={{ width: '100%', height: '100%' }} />
                  </View>

                  {/* Info */}
                  <View style={{ flex: 1 }}>
                    <ThemedText style={[styles.teamNameText, { color: theme.text }]}>{team.name}</ThemedText>
                    <View style={styles.teamStatsRow}>
                      <View style={styles.ratingBox}>
                        <Ionicons name="star" size={10} color={theme.secondary} />
                        <ThemedText style={[styles.ratingText, { color: theme.secondary }]}>{team.rating}</ThemedText>
                      </View>
                      <ThemedText style={[styles.statsDot, { color: theme.textSecondary }]}>·</ThemedText>
                      <ThemedText style={[styles.statsText, { color: theme.textSecondary }]}>{team.winRate}% wins</ThemedText>
                      <ThemedText style={[styles.statsDot, { color: theme.textSecondary }]}>·</ThemedText>
                      <ThemedText style={[styles.statsText, { color: theme.textSecondary }]}>{team.matches} matches</ThemedText>
                    </View>
                  </View>

                  {/* Selector */}
                  {isSelected ? (
                    <Ionicons name="checkmark-circle" size={18} color={theme.primary} />
                  ) : (
                    <Ionicons name="chevron-forward" size={14} color={theme.outlineVariant} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

      </View>
      </ScrollView>

      {/* ── Actions Row (Primary CTA) ────────────────────── */}
      <View style={[styles.actionsContainer, { backgroundColor: theme.surfaceLowest }]}>
        <Pressable
          onPress={() => handleAction('open')}
          style={[styles.secondaryButton, { borderColor: theme.primary, borderWidth: 1, marginBottom: 10 }]}
        >
          <ThemedText style={[styles.secondaryButtonText, { color: theme.primary }]}>
            Broadcast Open Bid
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={() => handleAction('friend')}
          style={[styles.primaryButton, { backgroundColor: theme.primary, opacity: selectedTeam ? 1 : 0.5 }]}
          disabled={!selectedTeam}
        >
          <View style={styles.btnContent}>
            <ThemedText style={styles.primaryButtonText}>
              {selectedTeam ? 'Send Challenge' : 'Select Opponent to Challenge'}
            </ThemedText>
            <Ionicons name="arrow-forward" size={16} color="#ffffff" />
          </View>
        </Pressable>
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

  /* Stake Header */
  stakeHeader: {
    borderRadius: BorderRadius.xl,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#1a2a33',
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
  bidRow: {
    flexDirection: 'row',
    gap: 8,
  },
  bidChip: {
    flex: 1,
    height: 34,
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
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

  /* Find Team Styles */
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'HankenGrotesk_500Medium',
    fontSize: 12,
    marginLeft: 8,
  },
  teamListContainer: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  teamMonogram: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monogramText: {
    fontFamily: 'HankenGrotesk_800ExtraBold',
    fontSize: 10,
  },
  teamNameText: {
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 12,
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
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#0000000a',
  },
  primaryButton: {
    height: 44,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.level2,
  },
  secondaryButton: {
    height: 44,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: {
    fontFamily: 'HankenGrotesk_800ExtraBold',
    fontSize: 13,
    color: '#ffffff',
  },
  secondaryButtonText: {
    fontFamily: 'HankenGrotesk_800ExtraBold',
    fontSize: 13,
  },
});
