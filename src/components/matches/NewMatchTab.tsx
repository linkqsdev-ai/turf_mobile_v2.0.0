import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { CoinTossModal } from '@/components/coin-toss-modal';

const FORMATS = ['T20', 'ODI', 'Test', 'Custom'];

export function NewMatchTab() {
  const theme = useTheme();
  
  const [matchFormat, setMatchFormat] = useState('T20');
  const [venue, setVenue] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [tossTime, setTossTime] = useState('');
  const [coinTossVisible, setCoinTossVisible] = useState(false);
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');

  // Focus states
  const [isVenueFocused, setIsVenueFocused] = useState(false);
  const [isDateFocused, setIsDateFocused] = useState(false);
  const [isTimeFocused, setIsTimeFocused] = useState(false);
  const [isHomeFocused, setIsHomeFocused] = useState(false);
  const [isAwayFocused, setIsAwayFocused] = useState(false);

  const handleStartToss = () => {
    if (!homeTeam.trim() || !awayTeam.trim()) {
      return Alert.alert('Required', 'Please enter both Home and Away team names to start the toss.');
    }
    setCoinTossVisible(true);
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
      style={{ backgroundColor: '#f7f9fb' }}
      bounces={false}
    >
      {/* ── Page Header Section ────────────────────────── */}
      <View style={styles.headerLabelRow}>
        <ThemedText style={styles.headerTitle}>Configure Match</ThemedText>
      </View>

      {/* ── Side-by-Side Team Selection ────────────────── */}
      <View style={styles.teamRow}>
        {/* Team A (Home) */}
        <View style={[styles.teamCard, Shadows.level2]}>
          <View style={styles.teamCardHeader}>
            <View style={styles.shieldWrap}>
              <Ionicons name="shield-outline" size={16} color="#001b3d" />
            </View>
          </View>
          <ThemedText style={styles.teamSubLabel}>TEAM A</ThemedText>
          <TextInput
            style={[
              styles.teamInput,
              { borderBottomColor: isHomeFocused ? '#001b3d' : '#c4c6cf' }
            ]}
            placeholder="Select Home Team"
            placeholderTextColor="#94a3b8"
            value={homeTeam}
            onChangeText={setHomeTeam}
            onFocus={() => setIsHomeFocused(true)}
            onBlur={() => setIsHomeFocused(false)}
          />
          <View style={styles.teamActionFooter}>
            <Ionicons name="search" size={12} color="#74777f" />
            <ThemedText style={styles.teamActionText}>Search library...</ThemedText>
          </View>
        </View>

        {/* Team B (Away) */}
        <View style={[styles.teamCard, Shadows.level2]}>
          <View style={styles.teamCardHeader}>
            <View style={styles.shieldWrap}>
              <Ionicons name="shield-outline" size={16} color="#001b3d" />
            </View>
          </View>
          <ThemedText style={styles.teamSubLabel}>TEAM B</ThemedText>
          <TextInput
            style={[
              styles.teamInput,
              { borderBottomColor: isAwayFocused ? '#001b3d' : '#c4c6cf' }
            ]}
            placeholder="Select Away Team"
            placeholderTextColor="#94a3b8"
            value={awayTeam}
            onChangeText={setAwayTeam}
            onFocus={() => setIsAwayFocused(true)}
            onBlur={() => setIsAwayFocused(false)}
          />
          <View style={styles.teamActionFooter}>
            <Ionicons name="add" size={12} color="#74777f" />
            <ThemedText style={styles.teamActionText}>Create team...</ThemedText>
          </View>
        </View>
      </View>

      {/* ── Match Format Bento Module ─────────────────── */}
      <View style={[styles.bentoModule, Shadows.level2]}>
        <ThemedText style={styles.bentoLabel}>FORMAT</ThemedText>
        <View style={styles.formatList}>
          {FORMATS.map((fmt) => {
            const isActive = matchFormat === fmt;
            return (
              <Pressable
                key={fmt}
                onPress={() => setMatchFormat(fmt)}
                style={[
                  styles.formatPill,
                  isActive
                    ? { backgroundColor: '#001b3d', borderColor: '#001b3d' }
                    : { backgroundColor: '#ffffff', borderColor: '#c4c6cf' }
                ]}
              >
                <ThemedText
                  style={[
                    styles.formatPillText,
                    { color: isActive ? '#ffffff' : '#191c1e' }
                  ]}
                >
                  {fmt}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── Date & Venue Bento Module ──────────────────── */}
      <View style={[styles.bentoModule, Shadows.level2]}>
        {/* Venue Selection */}
        <View style={styles.inputGroup}>
          <ThemedText style={styles.bentoLabel}>VENUE SELECTION</ThemedText>
          <View style={styles.searchInputContainer}>
            <Ionicons name="location-outline" size={16} color="#74777f" style={styles.searchIcon} />
            <TextInput
              style={[
                styles.searchInput,
                { color: '#191c1e' }
              ]}
              placeholder="Search Stadium or Ground..."
              placeholderTextColor="#94a3b8"
              value={venue}
              onChangeText={setVenue}
              onFocus={() => setIsVenueFocused(true)}
              onBlur={() => setIsVenueFocused(false)}
            />
          </View>
        </View>

        {/* Date and Time Column Row */}
        <View style={styles.twoColumnInputs}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <ThemedText style={styles.bentoLabel}>MATCH DATE</ThemedText>
            <TextInput
              style={[
                styles.underlinedInput,
                { borderBottomColor: isDateFocused ? '#001b3d' : '#c4c6cf' }
              ]}
              placeholder="dd-mm-yyyy"
              placeholderTextColor="#94a3b8"
              value={matchDate}
              onChangeText={setMatchDate}
              onFocus={() => setIsDateFocused(true)}
              onBlur={() => setIsDateFocused(false)}
            />
          </View>

          <View style={[styles.inputGroup, { flex: 1 }]}>
            <ThemedText style={styles.bentoLabel}>TOSS TIME</ThemedText>
            <TextInput
              style={[
                styles.underlinedInput,
                { borderBottomColor: isTimeFocused ? '#001b3d' : '#c4c6cf' }
              ]}
              placeholder="hh:mm am/pm"
              placeholderTextColor="#94a3b8"
              value={tossTime}
              onChangeText={setTossTime}
              onFocus={() => setIsTimeFocused(true)}
              onBlur={() => setIsTimeFocused(false)}
            />
          </View>
        </View>
      </View>

      {/* ── Match Finalization Hero Card ───────────────── */}
      <View style={styles.finalizationCard}>
        <Image
          source={require('@/assets/images/illustrations/trophy.png')}
          style={styles.finalizationWatermark}
          contentFit="contain"
        />
        <View style={styles.finalizationContent}>
          <ThemedText style={styles.finalizationTitle}>Match Finalization</ThemedText>
          <ThemedText style={styles.finalizationDescription}>
            Ready to start the match? This will lock the team selections and initiate the toss sequence.
          </ThemedText>

          <Pressable onPress={handleStartToss} style={styles.tossBtn}>
            <FontAwesome5 name="coins" size={14} color="#594400" />
            <ThemedText style={styles.tossBtnText}>Start Toss</ThemedText>
          </Pressable>
        </View>
      </View>

      {/* ── Requirements Checklist ─────────────────────── */}
      <View style={[styles.bentoModule, Shadows.level2]}>
        <View style={styles.reqHeader}>
          <Ionicons name="checkmark-done-circle" size={16} color="#001b3d" />
          <ThemedText style={styles.reqTitle}>Requirements</ThemedText>
        </View>

        <View style={styles.checklistList}>
          <View style={styles.reqCheckRow}>
            <View style={[styles.checkboxDot, { backgroundColor: '#e6f4ea' }]}>
              <Ionicons name="checkmark" size={10} color="#1e8e3e" />
            </View>
            <ThemedText style={styles.reqCheckText}>Match format selected</ThemedText>
          </View>

          <View style={styles.reqCheckRow}>
            <View style={[styles.checkboxDot, { backgroundColor: '#eceef0' }]}>
              <Ionicons name="ellipse" size={5} color={homeTeam.trim() ? '#1e8e3e' : '#cbd5e1'} />
            </View>
            <ThemedText style={[styles.reqCheckText, !homeTeam.trim() && { color: '#74777f' }]}>
              Home team identified
            </ThemedText>
          </View>

          <View style={styles.reqCheckRow}>
            <View style={[styles.checkboxDot, { backgroundColor: '#eceef0' }]}>
              <Ionicons name="ellipse" size={5} color={awayTeam.trim() ? '#1e8e3e' : '#cbd5e1'} />
            </View>
            <ThemedText style={[styles.reqCheckText, !awayTeam.trim() && { color: '#74777f' }]}>
              Away team identified
            </ThemedText>
          </View>
        </View>
      </View>

      {/* ── Pro Tip ────────────────────────────────────── */}
      <View style={styles.proTipCard}>
        <Ionicons name="bulb-outline" size={16} color="#765b00" />
        <ThemedText style={styles.proTipText}>
          <ThemedText style={{ fontFamily: 'Sora_600SemiBold' }}>PRO TIP:</ThemedText> Use the ODI format for matches longer than 40 overs to enable advanced projection stats.
        </ThemedText>
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
  headerLabelRow: {
    marginBottom: 16,
  },
  headerTitle: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 22,
    color: '#191c1e',
  },

  /* Team Selection Cards */
  teamRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  teamCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e3e5',
    padding: 12,
  },
  teamCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  shieldWrap: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#f2f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamSubLabel: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 9,
    color: '#74777f',
    marginBottom: 2,
  },
  teamInput: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 13,
    color: '#191c1e',
    paddingVertical: 4,
    borderBottomWidth: 1.5,
    marginBottom: 8,
  },
  teamActionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f9fb',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
  },
  teamActionText: {
    fontFamily: 'Sora_500Medium',
    fontSize: 10,
    color: '#74777f',
    marginLeft: 4,
  },

  /* Bento Layout Containers */
  bentoModule: {
    backgroundColor: '#ffffff',
    borderRadius: 24, // custom premium 24px/32px radius
    borderWidth: 1,
    borderColor: '#e0e3e5',
    padding: 16,
    marginBottom: 16,
  },
  bentoLabel: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 10,
    letterSpacing: 0.8,
    color: '#74777f',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  formatList: {
    flexDirection: 'row',
    gap: 8,
  },
  formatPill: {
    flex: 1,
    height: 38,
    borderWidth: 1.5,
    borderRadius: 8, // sharp 8px corners matching guidelines
    justifyContent: 'center',
    alignItems: 'center',
  },
  formatPillText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 13,
  },
  inputGroup: {
    flexDirection: 'column',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#c4c6cf',
    borderRadius: 8,
    height: 42,
    backgroundColor: '#f7f9fb',
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Sora_500Medium',
    fontSize: 13,
  },
  twoColumnInputs: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 14,
  },
  underlinedInput: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 13,
    color: '#191c1e',
    paddingVertical: 6,
    borderBottomWidth: 1.5,
  },

  /* Finalization Hero Card */
  finalizationCard: {
    backgroundColor: '#001b3d',
    borderRadius: 8,
    padding: 20,
    height: 170,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#001b3d',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 16,
  },
  finalizationWatermark: {
    position: 'absolute',
    right: -10,
    bottom: -20,
    width: 170,
    height: 170,
    opacity: 0.25,
  },
  finalizationContent: {
    flex: 1,
    justifyContent: 'center',
    zIndex: 2,
  },
  finalizationTitle: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 4,
  },
  finalizationDescription: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11,
    lineHeight: 15,
    color: '#cbd5e1e0',
    maxWidth: '75%',
    marginBottom: 12,
  },
  tossBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ffc703',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999, // coin button is fully rounded in markup
    alignSelf: 'flex-start',
    shadowColor: '#ffc703',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  tossBtnText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 12,
    color: '#594400',
  },

  /* Requirements section */
  reqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  reqTitle: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 10,
    letterSpacing: 0.8,
    color: '#191c1e',
    textTransform: 'uppercase',
  },
  checklistList: {
    gap: 8,
  },
  reqCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkboxDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reqCheckText: {
    fontFamily: 'Sora_500Medium',
    fontSize: 12,
    color: '#191c1e',
  },

  /* Pro Tip */
  proTipCard: {
    backgroundColor: 'rgba(255, 199, 3, 0.12)',
    borderColor: 'rgba(255, 199, 3, 0.3)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  proTipText: {
    flex: 1,
    fontFamily: 'Sora_400Regular',
    fontSize: 11,
    lineHeight: 15,
    color: '#6e5400',
  },
});
