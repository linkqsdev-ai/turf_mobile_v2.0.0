import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GradientContainer } from '@/components/gradient-container';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Import sport components
import CricketScoring from '@/components/scoring/cricket-scoring';
import FootballScoring from '@/components/scoring/football-scoring';
import BasketballScoring from '@/components/scoring/basketball-scoring';
import TennisScoring from '@/components/scoring/tennis-scoring';
import BadmintonScoring from '@/components/scoring/badminton-scoring';
import VolleyballScoring from '@/components/scoring/volleyball-scoring';

import { SPORTS_LIST } from '@/constants/sports';
import { MaterialIcons } from '@expo/vector-icons';

export default function LiveScoringScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ matchId: string; sport: string; teamA?: string; teamB?: string }>();

  // Determine initial sport from route params (defaults to Cricket)
  const paramSport = params.sport || 'cricket';
  const initialSport = paramSport.charAt(0).toUpperCase() + paramSport.slice(1);
  const [selectedSport, setSelectedSport] = useState<string>(initialSport);

  const renderScoringConsole = () => {
    switch (selectedSport.toLowerCase()) {
      case 'football':
        return <FootballScoring teamA={params.teamA} teamB={params.teamB} />;
      case 'basketball':
        return <BasketballScoring teamA={params.teamA} teamB={params.teamB} />;
      case 'tennis':
        return <TennisScoring teamA={params.teamA} teamB={params.teamB} />;
      case 'badminton':
        return <BadmintonScoring teamA={params.teamA} teamB={params.teamB} />;
      case 'volleyball':
        return <VolleyballScoring teamA={params.teamA} teamB={params.teamB} />;
      case 'cricket':
      default:
        return <CricketScoring teamA={params.teamA} teamB={params.teamB} />;
    }
  };

  return (
    <GradientContainer screenName="scoring" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        
        {/* Navigation TopAppBar */}
        <View style={[styles.header, { backgroundColor: 'transparent' }]}>
          <View style={styles.headerLeft}>
            <Pressable 
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(tabs)/matches');
                }
              }} 
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="headlineSm" style={styles.headerTitle}>
              Match Console
            </ThemedText>
          </View>
          <View style={styles.headerRight}>
            <Image
              source={require('@/assets/images/illustrations/trophy.png')}
              style={styles.headerTrophy}
              contentFit="contain"
            />
            <Pressable style={[styles.infoButton, { backgroundColor: theme.primary }]}>
              <ThemedText type="labelMd" style={{ color: theme.onPrimary }}>MATCH INFO</ThemedText>
            </Pressable>
          </View>
        </View>

        {/* Sports Console Switcher Bar */}
        <View style={[styles.switcherContainer, { borderBottomColor: theme.outlineVariant + '22' }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.switcherScroll}
          >
            {SPORTS_LIST.map((sport) => {
              const isActive = sport.name === selectedSport;
              return (
                <Pressable
                  key={sport.name}
                  onPress={() => setSelectedSport(sport.name)}
                  style={[
                    styles.switcherChip,
                    { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '44' },
                    isActive && { backgroundColor: theme.primary, borderColor: theme.primary },
                  ]}
                >
                  <MaterialIcons
                    name={sport.icon as any}
                    size={15}
                    color={isActive ? '#ffffff' : theme.textSecondary}
                    style={{ marginRight: 4 }}
                  />
                  <ThemedText
                    type="labelMd"
                    style={{
                      color: isActive ? '#ffffff' : theme.textSecondary,
                      fontFamily: 'HankenGrotesk_700Bold',
                    }}
                  >
                    {sport.name}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Main console content */}
        <View style={styles.consoleBody}>
          {renderScoringConsole()}
        </View>

      </SafeAreaView>
    </GradientContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#0000000a',
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 16,
    marginLeft: 6,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTrophy: {
    width: 24,
    height: 24,
    marginRight: Spacing.sm,
  },
  infoButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  switcherContainer: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  switcherScroll: {
    paddingHorizontal: Spacing.containerMargin,
    gap: Spacing.xs,
  },
  switcherChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  consoleBody: {
    flex: 1,
  },
});
