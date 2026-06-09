import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Mock Tournaments Data
const TOURNAMENTS = [
  { id: 't1', name: 'London Community Cup 2024', sport: 'Football', format: 'Knockout (16 Teams)', prize: '£1,000 + Trophy', date: 'June 15 - June 20', status: 'Registering', image: require('@/assets/images/illustrations/stadium.png') },
  { id: 't2', name: 'T20 Cricket Blast League', sport: 'Cricket', format: 'League + Playoffs', prize: '£1,500 + Medal', date: 'July 01 - July 20', status: 'Filling Fast', image: require('@/assets/images/illustrations/cricket_player.png') },
  { id: 't3', name: 'Futsal Summer Championship', sport: 'Futsal', format: 'Group + Knockout', prize: '£800', date: 'June 25 - June 28', status: 'Ongoing', image: require('@/assets/images/illustrations/football_player.png') },
  { id: 't4', name: 'Wimbledon Amateur Open', sport: 'Tennis', format: 'Single Elimination', prize: 'Trophy + Gear Bag', date: 'July 10 - July 12', status: 'Upcoming', image: require('@/assets/images/illustrations/tennis_player.png') },
];

export default function TournamentsTab() {
  const theme = useTheme();
  const router = useRouter();

  const handleProfilePress = () => router.push('/profile');
  const handleNetworkPress = () => router.push('/network-activity');

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Top App Bar with new layout specifications */}
        <View style={[styles.header, { backgroundColor: theme.background }]}>
          <Pressable style={styles.userProfileBtn} onPress={handleProfilePress}>
            <Image
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD906cwGePK5tZt4al07polQZxe4OW2sIJ-lhjDewDXct6IJtZetqa2i4lnO9-CMUT1oBiYhGj0BUqSwgzvIHynL-pG1kkY5KzzF9cvL0bxVNlPJEbfv2pHhgwd2mkejpG9vnC4b1XliECQQDedwmy8XfJ0AUw7fpdjFhLXiUdidhARSpLIkMeew198pOXaj0K9g0kbbWaDwJfBtYdJwqD1ztbzBAkeltwyKB0I_eTeM0ksi5qEbR6iQRPKqERd-3DOKAQez21qHyI' }}
              style={styles.headerAvatar}
            />
            <ThemedText type="labelMd" style={{ color: theme.text, marginLeft: Spacing.xs, fontFamily: 'HankenGrotesk_700Bold' }}>
              Azarudeen
            </ThemedText>
          </Pressable>
          <ThemedText type="displayLgMobile" style={styles.headerTitle}>
            SPORTS OS
          </ThemedText>
          <View style={styles.headerRightActions}>
            <Pressable style={styles.iconButton} onPress={handleNetworkPress}>
              <Ionicons name="pulse" size={20} color={theme.secondary} />
            </Pressable>
            <Pressable style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={20} color={theme.secondary} />
            </Pressable>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Main Tournament Banner Card */}
          <View style={styles.section}>
            <View style={[styles.featuredCard, { backgroundColor: theme.primaryContainer }]}>
              <Image source={require('@/assets/images/illustrations/trophy.png')} style={styles.featuredCardIllustration} contentFit="contain" />
              <View style={styles.featuredCardContent}>
                <View style={styles.featuredBadge}>
                  <ThemedText type="labelSm" style={{ color: theme.onSecondaryContainer, fontWeight: '800' }}>FEATURED CUP</ThemedText>
                </View>
                <ThemedText type="headlineLg" style={{ color: '#ffffff', marginTop: Spacing.xs }}>
                  London Cup 2026
                </ThemedText>
                <ThemedText type="bodySm" style={{ color: theme.onPrimaryContainer, marginTop: Spacing.half }}>
                  {"Compete with London's top-seeded teams and claim the ultimate trophy."}
                </ThemedText>
                <Pressable style={[styles.registerBtn, { backgroundColor: theme.secondaryContainer }]}>
                  <ThemedText type="labelMd" style={{ color: theme.onSecondaryContainer }}>Register Team</ThemedText>
                </Pressable>
              </View>
            </View>
          </View>

          {/* All Leagues & Tournaments */}
          <View style={[styles.section, { paddingBottom: 100 }]}>
            <ThemedText type="headlineSm" style={{ marginBottom: Spacing.md }}>Leagues & Tournaments</ThemedText>

            <View style={styles.tournamentList}>
              {TOURNAMENTS.map(t => (
                <View key={t.id} style={[styles.tournamentCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
                  <Image source={t.image} style={styles.tournamentCardImage} contentFit="cover" />
                  <View style={styles.tournamentCardInfo}>
                    <View style={styles.rowBetween}>
                      <View style={[styles.sportBadge, { backgroundColor: theme.surface }]}>
                        <ThemedText type="labelSm" style={{ color: theme.text, textTransform: 'uppercase', fontSize: 9 }}>
                          {t.sport}
                        </ThemedText>
                      </View>
                      <ThemedText type="labelSm" style={{ color: t.status === 'Ongoing' ? theme.error : theme.secondary, fontWeight: '700' }}>
                        {t.status}
                      </ThemedText>
                    </View>
                    <ThemedText type="headlineSm" numberOfLines={1} style={{ marginTop: Spacing.xs }}>
                      {t.name}
                    </ThemedText>
                    <ThemedText type="bodySm" style={{ color: theme.textSecondary, marginTop: Spacing.half }}>
                      Format: {t.format}
                    </ThemedText>
                    <View style={styles.tournamentCardFooter}>
                      <View>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>PRIZE POOL</ThemedText>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>{t.prize}</ThemedText>
                      </View>
                      <Pressable style={[styles.viewDetailsBtn, { borderColor: theme.outlineVariant }]}>
                        <ThemedText type="labelSm" style={{ color: theme.text, fontFamily: 'PlusJakartaSans_700Bold' }}>Details</ThemedText>
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
    </ThemedView>
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
    paddingHorizontal: Spacing.containerMargin,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#0000000a',
    zIndex: 10,
  },
  userProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  headerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#c3c7cb',
  },
  headerTitle: {
    fontFamily: 'HankenGrotesk_800ExtraBold',
    fontSize: 20,
    letterSpacing: -0.5,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  iconButton: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.containerMargin,
  },
  featuredCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  featuredCardIllustration: {
    position: 'absolute',
    right: -20,
    top: 0,
    width: '45%',
    height: '100%',
    opacity: 0.25,
  },
  featuredCardContent: {
    zIndex: 2,
    width: '70%',
  },
  featuredBadge: {
    backgroundColor: '#feae2c',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.default,
  },
  registerBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
  },
  tournamentList: {
    gap: Spacing.md,
  },
  tournamentCard: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
  },
  tournamentCardImage: {
    width: '100%',
    height: 120,
  },
  tournamentCardInfo: {
    padding: Spacing.md,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sportBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.default,
  },
  tournamentCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#0000000a',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
  },
  viewDetailsBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: BorderRadius.full,
  },
});
