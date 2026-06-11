import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function NewMatchScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [matchFormat, setMatchFormat] = useState('T20');
  const [venue, setVenue] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [tossTime, setTossTime] = useState('');

  const FORMATS = ['T20', 'ODI', 'Test'];

  const handleStartToss = () => {
    Alert.alert(
      'Ready to start?',
      'This will lock the team selections and initiate the toss sequence.',
      [{ text: 'Start Toss', onPress: () => router.push('/(tabs)/matches') }]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.background }]}>
          <View style={styles.headerLeft}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="headlineSm" style={{ fontFamily: 'HankenGrotesk_800ExtraBold', letterSpacing: -0.5 }}>
              APEX VELOCITY
            </ThemedText>
          </View>
          <View style={styles.headerRight}>
            <Ionicons name="notifications-outline" size={24} color={theme.textSecondary} />
            <View style={styles.avatarMini}>
              <Ionicons name="person" size={16} color="#ffffff" />
            </View>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Page Title section */}
          <View style={styles.pageTitleContainer}>
            <View style={styles.newFixtureBadge}>
              <Ionicons name="add-circle" size={16} color={theme.textSecondary} />
              <ThemedText style={{ fontSize: 10, fontFamily: 'HankenGrotesk_700Bold', marginLeft: 4, letterSpacing: 1, color: theme.textSecondary, textTransform: 'uppercase' }}>
                New Fixture
              </ThemedText>
            </View>
            <ThemedText type="headlineLg" style={{ marginTop: 8 }}>Configure Match</ThemedText>
          </View>

          {/* Team Selection Cards */}
          <View style={styles.teamSelectionRow}>
            {/* Team A */}
            <Pressable style={[styles.teamCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '40' }, Shadows.level1]}>
              <View style={styles.teamCardHeader}>
                <View style={[styles.shieldIconContainer, { backgroundColor: theme.surfaceLow }]}>
                  <Ionicons name="shield" size={24} color={theme.primary} />
                </View>
                <View style={[styles.homeAwayBadge, { backgroundColor: theme.surfaceLow }]}>
                  <ThemedText style={{ fontSize: 10, fontFamily: 'HankenGrotesk_700Bold', color: theme.textSecondary }}>HOME</ThemedText>
                </View>
              </View>
              <ThemedText style={{ fontSize: 11, fontFamily: 'HankenGrotesk_600SemiBold', color: theme.textSecondary, marginBottom: 4 }}>TEAM A</ThemedText>
              <ThemedText type="headlineSm" style={{ marginBottom: Spacing.md }}>Select Home Team</ThemedText>
              <View style={styles.teamCardAction}>
                <Ionicons name="search" size={16} color={theme.textSecondary} />
                <ThemedText style={{ fontSize: 13, color: theme.textSecondary, marginLeft: 6 }}>Search from library...</ThemedText>
              </View>
            </Pressable>

            {/* Team B */}
            <Pressable style={[styles.teamCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '40' }, Shadows.level1]}>
              <View style={styles.teamCardHeader}>
                <View style={[styles.shieldIconContainer, { backgroundColor: theme.surfaceLow }]}>
                  <Ionicons name="shield" size={24} color={theme.primary} />
                </View>
                <View style={[styles.homeAwayBadge, { backgroundColor: theme.surfaceLow }]}>
                  <ThemedText style={{ fontSize: 10, fontFamily: 'HankenGrotesk_700Bold', color: theme.textSecondary }}>AWAY</ThemedText>
                </View>
              </View>
              <ThemedText style={{ fontSize: 11, fontFamily: 'HankenGrotesk_600SemiBold', color: theme.textSecondary, marginBottom: 4 }}>TEAM B</ThemedText>
              <ThemedText type="headlineSm" style={{ marginBottom: Spacing.md }}>Select Away Team</ThemedText>
              <View style={styles.teamCardAction}>
                <Ionicons name="add" size={18} color={theme.textSecondary} />
                <ThemedText style={{ fontSize: 13, color: theme.textSecondary, marginLeft: 4 }}>Create new team</ThemedText>
              </View>
            </Pressable>
          </View>

          {/* Settings Bento */}
          <View style={styles.settingsGrid}>
            {/* Format Card */}
            <View style={[styles.bentoCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '40' }, Shadows.level1]}>
              <ThemedText style={styles.bentoLabel}>FORMAT</ThemedText>
              <View style={styles.formatList}>
                {FORMATS.map(fmt => (
                  <Pressable
                    key={fmt}
                    onPress={() => setMatchFormat(fmt)}
                    style={[styles.formatRow, { borderColor: theme.outlineVariant + '40' }]}
                  >
                    <ThemedText style={{ fontFamily: 'HankenGrotesk_500Medium', fontSize: 16 }}>{fmt}</ThemedText>
                    <View style={[
                      styles.radioCircle,
                      matchFormat === fmt && styles.radioCircleActive
                    ]}>
                      {matchFormat === fmt && <View style={styles.radioInner} />}
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.settingsColumn}>
              {/* Venue Selection */}
              <View style={[styles.bentoCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '40' }, Shadows.level1]}>
                <ThemedText style={styles.bentoLabel}>VENUE SELECTION</ThemedText>
                <View style={[styles.searchInputContainer, { borderColor: theme.outlineVariant + '40' }]}>
                  <Ionicons name="location-outline" size={20} color={theme.outline} style={{ marginLeft: 12 }} />
                  <TextInput
                    style={[styles.searchInput, { color: theme.text }]}
                    placeholder="Search Stadium or Ground..."
                    placeholderTextColor={theme.outline}
                    value={venue}
                    onChangeText={setVenue}
                  />
                </View>
              </View>

              {/* Date & Time Row */}
              <View style={styles.dateTimeRow}>
                <View style={[styles.bentoCard, { flex: 1, backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '40' }, Shadows.level1]}>
                  <ThemedText style={styles.bentoLabel}>MATCH DATE</ThemedText>
                  <TextInput
                    style={[styles.dateInput, { color: theme.text }]}
                    placeholder="dd-mm-yyyy"
                    placeholderTextColor={theme.textSecondary}
                    value={matchDate}
                    onChangeText={setMatchDate}
                  />
                </View>
                <View style={{ width: 12 }} />
                <View style={[styles.bentoCard, { flex: 1, backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '40' }, Shadows.level1]}>
                  <ThemedText style={styles.bentoLabel}>TOSS TIME</ThemedText>
                  <TextInput
                    style={[styles.dateInput, { color: theme.text }]}
                    placeholder="--:--"
                    placeholderTextColor={theme.textSecondary}
                    value={tossTime}
                    onChangeText={setTossTime}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Match Finalization Card */}
          <View style={[styles.finalizationCard, { backgroundColor: '#001b3d' }, Shadows.level3]}>
            <View style={styles.finalizationContent}>
              <ThemedText type="headlineLg" style={{ color: '#ffffff', marginBottom: 8 }}>Match Finalization</ThemedText>
              <ThemedText style={{ color: '#6f84ac', fontFamily: 'HankenGrotesk_400Regular', fontSize: 15, lineHeight: 22, marginBottom: Spacing.xl }}>
                Ready to start the match? This will lock the team selections and initiate the toss sequence.
              </ThemedText>
              
              <Pressable style={styles.startTossBtn} onPress={handleStartToss}>
                <Ionicons name="cash-outline" size={20} color="#6b4500" />
                <ThemedText style={{ color: '#6b4500', fontFamily: 'HankenGrotesk_700Bold', fontSize: 18, marginLeft: 8 }}>
                  Start Toss
                </ThemedText>
              </Pressable>
            </View>
            {/* Background Icon/Image placeholder */}
            <View style={styles.finalizationBgIcon}>
              <MaterialCommunityIcons name="cricket" size={160} color="rgba(255,255,255,0.05)" />
            </View>
          </View>

          {/* Requirements Checklist */}
          <View style={[styles.requirementsCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '40' }, Shadows.level1]}>
            <View style={styles.reqHeader}>
              <MaterialCommunityIcons name="check-decagram" size={20} color={theme.primary} />
              <ThemedText style={{ fontFamily: 'HankenGrotesk_700Bold', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: theme.primary, marginLeft: 8 }}>
                Requirements
              </ThemedText>
            </View>
            <View style={styles.reqItem}>
              <View style={[styles.reqCheck, { backgroundColor: '#e6f4ea' }]}>
                <Ionicons name="checkmark" size={14} color="#1e8e3e" />
              </View>
              <ThemedText style={{ fontSize: 14, color: theme.text }}>Match format selected</ThemedText>
            </View>
            <View style={styles.reqItem}>
              <View style={[styles.reqCheck, { backgroundColor: theme.surface }]}>
                <Ionicons name="ellipse" size={8} color={theme.outlineVariant} />
              </View>
              <ThemedText style={{ fontSize: 14, color: theme.textSecondary }}>Home team identified</ThemedText>
            </View>
            <View style={[styles.reqItem, { opacity: 0.5 }]}>
              <View style={[styles.reqCheck, { backgroundColor: theme.surface }]}>
                <Ionicons name="ellipse" size={8} color={theme.outlineVariant} />
              </View>
              <ThemedText style={{ fontSize: 14, color: theme.textSecondary }}>Away team identified</ThemedText>
            </View>
          </View>

          {/* Pro Tip */}
          <View style={[styles.proTipCard, { backgroundColor: 'rgba(254, 174, 44, 0.1)', borderColor: 'rgba(254, 174, 44, 0.3)' }]}>
            <Ionicons name="bulb" size={24} color="#835500" style={{ marginBottom: 8 }} />
            <ThemedText style={{ fontSize: 13, lineHeight: 20, color: '#6b4500' }}>
              <ThemedText style={{ fontFamily: 'HankenGrotesk_700Bold', color: '#6b4500' }}>PRO TIP: </ThemedText>
              Use the ODI format for matches longer than 40 overs to enable advanced projection stats.
            </ThemedText>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.containerMargin,
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#0000000a',
    zIndex: 10,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 4 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarMini: {
    width: 32, height: 32,
    borderRadius: 16,
    backgroundColor: '#001b3d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: Spacing.containerMargin,
    paddingBottom: 80,
  },
  pageTitleContainer: {
    marginBottom: Spacing.xl,
    marginTop: Spacing.sm,
  },
  newFixtureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamSelectionRow: {
    flexDirection: 'column', // Keeping vertical for mobile screens to avoid crowding
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  teamCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  teamCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  shieldIconContainer: {
    width: 48, height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeAwayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  teamCardAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsGrid: {
    flexDirection: 'column',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  bentoCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  bentoLabel: {
    fontFamily: 'HankenGrotesk_600SemiBold',
    fontSize: 11,
    letterSpacing: 1,
    color: '#74777f',
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
  },
  formatList: {
    gap: 8,
  },
  formatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.sm,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
  },
  radioCircle: {
    width: 18, height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#c4c6cf',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleActive: {
    borderColor: '#000000',
  },
  radioInner: {
    width: 10, height: 10,
    borderRadius: 5,
    backgroundColor: '#000000',
  },
  settingsColumn: {
    flexDirection: 'column',
    gap: Spacing.md,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'HankenGrotesk_400Regular',
    fontSize: 16,
    paddingHorizontal: 12,
  },
  dateTimeRow: {
    flexDirection: 'row',
  },
  dateInput: {
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 20,
    padding: 0,
  },
  finalizationCard: {
    borderRadius: BorderRadius.premium,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    position: 'relative',
    overflow: 'hidden',
  },
  finalizationContent: {
    position: 'relative',
    zIndex: 2,
  },
  startTossBtn: {
    backgroundColor: '#feae2c',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: BorderRadius.full,
    shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 6,
  },
  finalizationBgIcon: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    zIndex: 1,
    transform: [{ rotate: '-15deg' }],
  },
  requirementsCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  reqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  reqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reqCheck: {
    width: 24, height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  proTipCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
});
