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
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { GradientContainer } from '@/components/gradient-container';
import { Spacing, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { CoinTossModal } from '@/components/coin-toss-modal';

export default function NewMatchScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [matchFormat, setMatchFormat] = useState('T20');
  const [venue, setVenue] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [tossTime, setTossTime] = useState('');
  const [coinTossVisible, setCoinTossVisible] = useState(false);

  const FORMATS = ['T20', 'ODI', 'Test', 'Custom'];

  return (
    <GradientContainer screenName="booking" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: 'transparent' }]}>
          <View style={styles.headerLeft}>
            <Pressable
              onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/matches')}
              style={styles.backBtn}
            >
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </Pressable>
            <ThemedText style={{ fontSize: 17, fontFamily: 'HankenGrotesk_700Bold', color: theme.text, letterSpacing: -0.3 }}>
              New Match
            </ThemedText>
          </View>
          <View style={styles.headerRight}>
            <Pressable style={styles.iconBtn} onPress={() => router.push('/network')}>
              <Ionicons name="pulse" size={20} color={theme.secondary} />
            </Pressable>
            <Pressable style={styles.iconBtn}>
              <Ionicons name="notifications-outline" size={20} color={theme.secondary} />
            </Pressable>
            <Pressable style={styles.iconBtn} onPress={() => setCoinTossVisible(true)}>
              <FontAwesome5 name="coins" size={16} color={theme.secondary} />
            </Pressable>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Page Title Section */}
          <View style={styles.pageTitleContainer}>
            <View style={styles.newFixtureBadge}>
              <Ionicons name="add-circle" size={14} color={theme.textSecondary} />
              <ThemedText style={{ fontSize: 9, fontFamily: 'HankenGrotesk_800ExtraBold', marginLeft: 4, letterSpacing: 0.5, color: theme.textSecondary, textTransform: 'uppercase' }}>
                New Fixture
              </ThemedText>
            </View>
            <ThemedText style={{ fontSize: 20, fontFamily: 'HankenGrotesk_800ExtraBold', color: theme.text, marginTop: 2 }}>Configure Match</ThemedText>
          </View>

          {/* Side-by-Side Team Selection Cards */}
          <View style={styles.teamSelectionRow}>
            {/* Team A */}
            <Pressable 
              onPress={() => router.push('/create-team')}
              style={[styles.teamCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '40', ...styles.navyShadow }]}>
              <View style={styles.teamCardHeader}>
                <View style={[styles.shieldIconContainer, { backgroundColor: theme.surfaceLow }]}>
                  <Ionicons name="shield" size={16} color={theme.primary} />
                </View>
                <View style={[styles.homeAwayBadge, { backgroundColor: theme.surfaceLow }]}>
                  <ThemedText style={{ fontSize: 8, fontFamily: 'HankenGrotesk_800ExtraBold', color: theme.textSecondary }}>HOME</ThemedText>
                </View>
              </View>
              <ThemedText style={{ fontSize: 9, fontFamily: 'HankenGrotesk_700Bold', color: theme.textSecondary, marginBottom: 2 }}>TEAM A</ThemedText>
              <ThemedText style={{ fontSize: 13, fontFamily: 'HankenGrotesk_800ExtraBold', color: theme.text, marginBottom: 6 }}>Select Home Team</ThemedText>
              <View style={styles.teamCardAction}>
                <Ionicons name="search" size={12} color={theme.textSecondary} />
                <ThemedText style={{ fontSize: 11, color: theme.textSecondary, marginLeft: 4, fontFamily: 'HankenGrotesk_500Medium' }}>Search library...</ThemedText>
              </View>
            </Pressable>

            {/* Team B */}
            <Pressable 
              onPress={() => router.push('/create-team')}
              style={[styles.teamCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '40', ...styles.navyShadow }]}>
              <View style={styles.teamCardHeader}>
                <View style={[styles.shieldIconContainer, { backgroundColor: theme.surfaceLow }]}>
                  <Ionicons name="shield" size={16} color={theme.primary} />
                </View>
                <View style={[styles.homeAwayBadge, { backgroundColor: theme.surfaceLow }]}>
                  <ThemedText style={{ fontSize: 8, fontFamily: 'HankenGrotesk_800ExtraBold', color: theme.textSecondary }}>AWAY</ThemedText>
                </View>
              </View>
              <ThemedText style={{ fontSize: 9, fontFamily: 'HankenGrotesk_700Bold', color: theme.textSecondary, marginBottom: 2 }}>TEAM B</ThemedText>
              <ThemedText style={{ fontSize: 13, fontFamily: 'HankenGrotesk_800ExtraBold', color: theme.text, marginBottom: 6 }}>Select Away Team</ThemedText>
              <View style={styles.teamCardAction}>
                <Ionicons name="add" size={14} color={theme.textSecondary} />
                <ThemedText style={{ fontSize: 11, color: theme.textSecondary, marginLeft: 2, fontFamily: 'HankenGrotesk_500Medium' }}>Create new...</ThemedText>
              </View>
            </Pressable>
          </View>

          {/* Settings Bento */}
          <View style={styles.settingsGrid}>
            {/* Format Card - Horizontal Pills */}
            <View style={[styles.bentoCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '40', ...styles.navyShadow }]}>
              <ThemedText style={styles.bentoLabel}>FORMAT</ThemedText>
              <View style={styles.formatList}>
                {FORMATS.map(fmt => {
                  const isActive = matchFormat === fmt;
                  return (
                    <Pressable
                      key={fmt}
                      onPress={() => setMatchFormat(fmt)}
                      style={[
                        styles.formatPill,
                        {
                          borderColor: isActive ? '#001b3d' : theme.outlineVariant + '40',
                          backgroundColor: isActive ? '#001b3d' : theme.background,
                        }
                      ]}
                    >
                      <ThemedText
                        style={{
                          fontFamily: isActive ? 'HankenGrotesk_700Bold' : 'HankenGrotesk_500Medium',
                          fontSize: 13,
                          color: isActive ? '#ffffff' : theme.text,
                        }}
                      >
                        {fmt}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.settingsColumn}>
              {/* Date & Time Row */}
              <View style={styles.dateTimeRow}>
                <View style={[styles.bentoCard, { flex: 1, backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '40', ...styles.navyShadow }]}>
                  <ThemedText style={styles.bentoLabel}>MATCH DATE</ThemedText>
                  <TextInput
                    style={[styles.dateInput, { color: theme.text, borderColor: theme.outlineVariant + '40', backgroundColor: theme.background }]}
                    placeholder="dd-mm-yyyy"
                    placeholderTextColor={theme.textSecondary + '80'}
                    value={matchDate}
                    onChangeText={setMatchDate}
                  />
                </View>
                <View style={{ width: 10 }} />
                <View style={[styles.bentoCard, { flex: 1, backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '40', ...styles.navyShadow }]}>
                  <ThemedText style={styles.bentoLabel}>TOSS TIME</ThemedText>
                  <TextInput
                    style={[styles.dateInput, { color: theme.text, borderColor: theme.outlineVariant + '40', backgroundColor: theme.background }]}
                    placeholder="--:--"
                    placeholderTextColor={theme.textSecondary + '80'}
                    value={tossTime}
                    onChangeText={setTossTime}
                  />
                </View>
              </View>

              {/* Venue Selection */}
              <View style={[styles.bentoCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '40', ...styles.navyShadow }]}>
                <ThemedText style={styles.bentoLabel}>VENUE SELECTION</ThemedText>
                <View style={[styles.searchInputContainer, { borderColor: theme.outlineVariant + '40' }]}>
                  <Ionicons name="location-outline" size={16} color={theme.outline} style={{ marginLeft: 10 }} />
                  <TextInput
                    style={[styles.searchInput, { color: theme.text }]}
                    placeholder="Search Stadium or Ground..."
                    placeholderTextColor={theme.outline}
                    value={venue}
                    onChangeText={setVenue}
                  />
                </View>
              </View>
            </View>
          </View>


          {/* Requirements Checklist */}
          <View style={[styles.requirementsCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '40', ...styles.navyShadow }]}>
            <View style={styles.reqHeader}>
              <MaterialCommunityIcons name="check-decagram" size={16} color={theme.primary} />
              <ThemedText style={{ fontFamily: 'HankenGrotesk_700Bold', fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase', color: theme.primary, marginLeft: 6 }}>
                Requirements
              </ThemedText>
            </View>
            <View style={styles.reqItem}>
              <View style={[styles.reqCheck, { backgroundColor: '#e6f4ea' }]}>
                <Ionicons name="checkmark" size={12} color="#1e8e3e" />
              </View>
              <ThemedText style={{ fontSize: 12, color: theme.text, fontFamily: 'HankenGrotesk_500Medium' }}>Match format selected</ThemedText>
            </View>
            <View style={styles.reqItem}>
              <View style={[styles.reqCheck, { backgroundColor: theme.surface }]}>
                <Ionicons name="ellipse" size={6} color={theme.outlineVariant} />
              </View>
              <ThemedText style={{ fontSize: 12, color: theme.textSecondary, fontFamily: 'HankenGrotesk_400Regular' }}>Home team identified</ThemedText>
            </View>
            <View style={[styles.reqItem, { marginBottom: 0, opacity: 0.5 }]}>
              <View style={[styles.reqCheck, { backgroundColor: theme.surface }]}>
                <Ionicons name="ellipse" size={6} color={theme.outlineVariant} />
              </View>
              <ThemedText style={{ fontSize: 12, color: theme.textSecondary, fontFamily: 'HankenGrotesk_400Regular' }}>Away team identified</ThemedText>
            </View>
          </View>

          {/* Pro Tip */}
          <View style={[styles.proTipCard, { backgroundColor: 'rgba(93, 104, 232, 0.08)', borderColor: 'rgba(93, 104, 232, 0.2)' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Ionicons name="bulb" size={16} color="#835500" />
              <ThemedText style={{ fontFamily: 'HankenGrotesk_700Bold', color: '#6b4500', fontSize: 11, marginLeft: 6 }}>PRO TIP</ThemedText>
            </View>
            <ThemedText style={{ fontSize: 12, lineHeight: 16, color: '#6b4500', fontFamily: 'HankenGrotesk_400Regular' }}>
              Use the ODI format for matches longer than 40 overs to enable advanced projection stats.
            </ThemedText>
          </View>

        </ScrollView>
      </SafeAreaView>
      <CoinTossModal visible={coinTossVisible} onClose={() => setCoinTossVisible(false)} />
    </GradientContainer>
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
    height: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#0000000a',
    zIndex: 10,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backBtn: { padding: 4 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarMini: {
    width: 28, height: 28,
    borderRadius: 14,
    backgroundColor: '#001b3d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: Spacing.containerMargin,
    paddingBottom: 24,
    gap: 12,
  },
  pageTitleContainer: {
    marginBottom: 4,
    marginTop: 4,
  },
  newFixtureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamSelectionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  teamCard: {
    flex: 1,
    padding: 12,
    borderRadius: 24,
    borderWidth: 1,
  },
  navyShadow: {
    shadowColor: '#1a2a33',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  teamCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  shieldIconContainer: {
    width: 32, height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeAwayBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  teamCardAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
  },
  settingsGrid: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 4,
  },
  bentoCard: {
    padding: 12,
    borderRadius: 24,
    borderWidth: 1,
  },
  bentoLabel: {
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 10,
    letterSpacing: 0.5,
    color: '#74777f',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  formatList: {
    flexDirection: 'row',
    gap: 8,
  },
  formatPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 12,
  },
  settingsColumn: {
    flexDirection: 'column',
    gap: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    height: 38,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'HankenGrotesk_400Regular',
    fontSize: 14,
    paddingHorizontal: 8,
  },
  dateTimeRow: {
    flexDirection: 'row',
  },
  dateInput: {
    fontFamily: 'HankenGrotesk_600SemiBold',
    fontSize: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
  },
  finalizationCard: {
    borderRadius: 24,
    padding: 14,
    marginBottom: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  finalizationContent: {
    position: 'relative',
    zIndex: 2,
  },
  startTossBtnContainer: {
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
    // Premium soft gold shadow glow
    shadowColor: '#5D68E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  startTossBtnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  finalizationBgIcon: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    zIndex: 1,
    transform: [{ rotate: '-15deg' }],
  },
  requirementsCard: {
    padding: 12,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 4,
  },
  reqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  reqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reqCheck: {
    width: 20, height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  proTipCard: {
    padding: 12,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 12,
  },
});

