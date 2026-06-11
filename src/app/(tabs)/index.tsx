import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CoinTossModal } from '@/components/coin-toss-modal';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useUserProfile } from '@/hooks/use-user-profile';

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { profile } = useUserProfile();
  const [coinTossVisible, setCoinTossVisible] = useState(false);

  const handleProfilePress = () => router.push('/profile');
  const handleNetworkPress = () => router.push('/network');

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Top App Bar */}
        <View style={[styles.header, { backgroundColor: theme.background }]}>
          <View style={styles.headerLeft}>
            <Pressable style={styles.profileIconButton} onPress={handleProfilePress}>
              <Image
                source={{ uri: profile.avatarUrl }}
                style={styles.headerAvatar}
              />
            </Pressable>
            <View style={styles.headerTextGroup}>
              <ThemedText type="bodyLg" style={{ color: theme.text, fontFamily: 'HankenGrotesk_700Bold', lineHeight: 18 }}>
                {profile.name}
              </ThemedText>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <Ionicons name="location-sharp" size={12} color={theme.secondary} />
                <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginLeft: 2, fontSize: 10 }}>
                  {profile.location}
                </ThemedText>
              </View>
            </View>
          </View>
          <View style={styles.headerRightActions}>
            <Pressable style={styles.iconButton} onPress={handleNetworkPress}>
              <Ionicons name="pulse" size={20} color={theme.secondary} />
            </Pressable>
            <Pressable style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={20} color={theme.secondary} />
            </Pressable>
            <Pressable style={styles.iconButton} onPress={() => setCoinTossVisible(true)}>
              <FontAwesome5 name="coins" size={16} color={theme.secondary} />
            </Pressable>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Welcome Header Section */}
          <View style={styles.welcomeSection}>
            <View style={styles.welcomeTextContainer}>
              <ThemedText type="headlineMd" style={{ color: theme.textSecondary }}>
                Hello, {profile.name.split(' ')[0]}
              </ThemedText>
              <ThemedText type="headlineLg" style={styles.welcomeHeadline}>
                {"Let's become more Productive"}
              </ThemedText>
            </View>
            <Image
              source={{ uri: 'https://lh3.googleusercontent.com/aida/AP1WRLsrliF0Cd3A1noW1I-8QmrA86jnUIhi367jWWnWwX_4cOBZvy0pEfT2NOP469vVIgcettV0_tGsG8CLAVsU4gpyVZYJY30Ms2S9po_TAFCHtuZGlN0TfD6UKPJL-W4zBAou4QiM6fwBAoQ70des2-UtAfllHZdyG7TSX_arZ0Gj7rIEGoIjW_lyUG2y-nnju08P3-ZpQxYURos2c2MwDDLdxzAOYHCf2_wzduUmBoMEaIV3RjBJMlYV2MM' }}
              style={styles.welcomeIllustration}
              contentFit="contain"
            />
          </View>

          {/* Daily Plan Card */}
          <View style={styles.section}>
            <View style={[styles.dailyPlanCard, { backgroundColor: theme.primaryContainer }, Shadows.level3]}>
              <View style={styles.planInfo}>
                <ThemedText type="headlineSm" style={{ color: theme.secondaryContainer }}>
                  Daily Plan
                </ThemedText>
                <ThemedText type="bodyMd" style={{ color: theme.onPrimaryContainer, marginTop: 4 }}>
                  4 of 5 targets reached
                </ThemedText>
                <Pressable style={[styles.viewTasksButton, { backgroundColor: theme.secondaryContainer }]}>
                  <ThemedText type="labelMd" style={{ color: theme.onSecondaryContainer, fontFamily: 'HankenGrotesk_700Bold' }}>
                    View Tasks
                  </ThemedText>
                </Pressable>
              </View>
              
              {/* Custom Circular Progress */}
              <View style={[styles.progressRing, { borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
                <View style={[styles.progressRingInner, { borderColor: theme.secondaryContainer }]}>
                  <ThemedText type="headlineSm" style={{ color: theme.secondaryContainer, fontFamily: 'HankenGrotesk_700Bold' }}>
                    80%
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>

          {/* Today's Schedule */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="headlineSm">{"Today's Schedule"}</ThemedText>
              <Pressable>
                <ThemedText type="labelMd" style={{ color: theme.secondary, fontFamily: 'HankenGrotesk_700Bold' }}>
                  View Calendar
                </ThemedText>
              </Pressable>
            </View>

            <View style={styles.scheduleList}>
              {/* Live Match Card */}
              <View style={[styles.scheduleCard, { backgroundColor: theme.surfaceLowest }, Shadows.level1]}>
                <View style={[styles.scheduleIconWrap, { backgroundColor: theme.secondaryContainer + '1a' }]}>
                  <Image
                    source={{ uri: 'https://lh3.googleusercontent.com/aida/AP1WRLtktV94nJFc0U5ggptbWUmJdSyDpzbXQmz0_Q8mx0mGuM0jwTvOYvB8NJV5PiYkP9f7ZvujLKNMFqOAPGdU64Qf9kcw9LBrrNmqyA5SjFWCFo74KLUo6y9pQIsIzQqXje9l_-qoQw07AzB9s9fy4ANoskUlqNfHpM6Ef8ELcIqwSXwbJuToojtZEvvCDg9-2XbE-mNw9LGBe8tgJp6rRCzHknvrnmculyjYWwW0eukUl3qTOYtxBH8daw' }}
                    style={styles.scheduleIllustration}
                  />
                </View>
                <View style={styles.scheduleInfo}>
                  <ThemedText type="headlineSm" style={styles.scheduleTitle}>
                    Match vs Tigers
                  </ThemedText>
                  <View style={styles.scheduleTimeRow}>
                    <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
                    <ThemedText type="bodyMd" style={styles.scheduleTimeText}>
                      14:30 - 16:00 • Stadium A
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <ThemedText style={styles.liveText}>Live</ThemedText>
                </View>
              </View>

              {/* Practice Session Card */}
              <View style={[styles.scheduleCard, { backgroundColor: theme.surfaceLowest }, Shadows.level1]}>
                <View style={[styles.scheduleIconWrap, { backgroundColor: theme.surface }]}>
                  <Ionicons name="barbell" size={24} color={theme.primary} />
                </View>
                <View style={styles.scheduleInfo}>
                  <ThemedText type="headlineSm" style={styles.scheduleTitle}>
                    Practice Session
                  </ThemedText>
                  <View style={styles.scheduleTimeRow}>
                    <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
                    <ThemedText type="bodyMd" style={styles.scheduleTimeText}>
                      18:00 - 19:30 • Gym
                    </ThemedText>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.outlineVariant} />
              </View>
            </View>
          </View>

          {/* Stats Preview Section */}
          <View style={styles.section}>
            <ThemedText type="headlineSm" style={{ marginBottom: Spacing.md }}>
              Quick Analytics
            </ThemedText>
            <View style={styles.bentoRow}>
              {/* Top Speed Card */}
              <View style={[styles.bentoCell, { backgroundColor: theme.surfaceLowest }, Shadows.level1]}>
                <View style={[styles.bentoIconWrap, { backgroundColor: theme.surface }]}>
                  <Ionicons name="speedometer-outline" size={20} color={theme.primary} />
                </View>
                <View style={styles.bentoTextWrap}>
                  <ThemedText type="labelSm" style={{ color: theme.textSecondary, letterSpacing: 0.5 }}>
                    Top Speed
                  </ThemedText>
                  <ThemedText type="headlineSm" style={{ marginTop: 2 }}>
                    34.2 <ThemedText type="labelSm" style={{ fontWeight: 'normal' }}>km/h</ThemedText>
                  </ThemedText>
                </View>
              </View>

              {/* Avg Power Card */}
              <View style={[styles.bentoCell, { backgroundColor: theme.primaryContainer }, Shadows.level3]}>
                <View style={[styles.bentoIconWrap, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}>
                  <Ionicons name="flash" size={20} color={theme.secondaryContainer} />
                </View>
                <View style={styles.bentoTextWrap}>
                  <ThemedText type="labelSm" style={{ color: theme.onPrimaryContainer, opacity: 0.6, letterSpacing: 0.5 }}>
                    Avg. Power
                  </ThemedText>
                  <ThemedText type="headlineSm" style={{ color: theme.secondaryContainer, marginTop: 2 }}>
                    280 <ThemedText type="labelSm" style={{ color: theme.onPrimaryContainer, fontWeight: 'normal' }}>W</ThemedText>
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>

          {/* Performance Graph Card */}
          <View style={[styles.section, { paddingBottom: 100 }]}>
            <View style={[styles.graphCard, { backgroundColor: theme.surfaceLowest }, Shadows.level2]}>
              <View style={styles.graphHeader}>
                <ThemedText type="labelMd" style={{ color: theme.text, fontFamily: 'HankenGrotesk_700Bold', letterSpacing: 0.5 }}>
                  Weekly Performance
                </ThemedText>
                <Ionicons name="ellipsis-horizontal" size={20} color={theme.textSecondary} />
              </View>
              <View style={styles.graphBarsContainer}>
                <View style={styles.graphBarCol}>
                  <View style={[styles.graphBar, { height: 40, backgroundColor: theme.primary + '1a' }]} />
                  <ThemedText type="labelSm" style={styles.graphBarLabel}>M</ThemedText>
                </View>
                <View style={styles.graphBarCol}>
                  <View style={[styles.graphBar, { height: 55, backgroundColor: theme.primary + '1a' }]} />
                  <ThemedText type="labelSm" style={styles.graphBarLabel}>T</ThemedText>
                </View>
                <View style={styles.graphBarCol}>
                  <View style={[styles.graphBar, { height: 75, backgroundColor: theme.secondaryContainer }]} />
                  <ThemedText type="labelSm" style={[styles.graphBarLabel, { color: theme.secondary, fontFamily: 'HankenGrotesk_700Bold' }]}>W</ThemedText>
                </View>
                <View style={styles.graphBarCol}>
                  <View style={[styles.graphBar, { height: 90, backgroundColor: theme.primary }]} />
                  <ThemedText type="labelSm" style={styles.graphBarLabel}>T</ThemedText>
                </View>
                <View style={styles.graphBarCol}>
                  <View style={[styles.graphBar, { height: 35, backgroundColor: theme.primary + '1a' }]} />
                  <ThemedText type="labelSm" style={styles.graphBarLabel}>F</ThemedText>
                </View>
                <View style={styles.graphBarCol}>
                  <View style={[styles.graphBar, { height: 50, backgroundColor: theme.primary + '1a' }]} />
                  <ThemedText type="labelSm" style={styles.graphBarLabel}>S</ThemedText>
                </View>
                <View style={styles.graphBarCol}>
                  <View style={[styles.graphBar, { height: 60, backgroundColor: theme.primary + '1a' }]} />
                  <ThemedText type="labelSm" style={styles.graphBarLabel}>S</ThemedText>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
      <CoinTossModal visible={coinTossVisible} onClose={() => setCoinTossVisible(false)} />
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#feae2c', // Gold ring around avatar
  },
  headerTextGroup: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  iconButton: {
    padding: 4,
  },
  profileIconButton: {
    padding: 2,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.containerMargin,
  },
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.containerMargin,
    position: 'relative',
    height: 120,
  },
  welcomeTextContainer: {
    width: '65%',
    justifyContent: 'center',
  },
  welcomeHeadline: {
    marginTop: Spacing.xs,
    fontFamily: 'HankenGrotesk_700Bold',
    lineHeight: 32,
  },
  welcomeIllustration: {
    width: 110,
    height: 110,
    position: 'absolute',
    right: Spacing.containerMargin,
    opacity: 0.95,
  },
  dailyPlanCard: {
    borderRadius: BorderRadius.premium,
    padding: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  planInfo: {
    flex: 1,
  },
  viewTasksButton: {
    marginTop: Spacing.md,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  progressRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRingInner: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 8,
    position: 'absolute',
    top: -8,
    left: -8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: Spacing.md,
  },
  scheduleList: {
    gap: Spacing.sm,
  },
  scheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.premium,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#c3c7cb33',
    position: 'relative',
  },
  scheduleIconWrap: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    overflow: 'hidden',
  },
  scheduleIllustration: {
    width: 32,
    height: 32,
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleTitle: {
    fontSize: 15,
    fontFamily: 'HankenGrotesk_700Bold',
  },
  scheduleTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  scheduleTimeText: {
    color: '#43474b',
    fontSize: 12,
  },
  liveBadge: {
    position: 'absolute',
    top: 8,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ff1744',
  },
  liveText: {
    color: '#ff1744',
    fontSize: 10,
    fontFamily: 'HankenGrotesk_700Bold',
  },
  bentoRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  bentoCell: {
    flex: 1,
    borderRadius: BorderRadius.premium,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#c3c7cb33',
    aspectRatio: 1,
    justifyContent: 'space-between',
  },
  bentoIconWrap: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  bentoTextWrap: {
    marginTop: Spacing.lg,
  },
  graphCard: {
    borderRadius: BorderRadius.premium,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#c3c7cb33',
  },
  graphHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  graphBarsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
    paddingHorizontal: Spacing.xs,
  },
  graphBarCol: {
    alignItems: 'center',
    flex: 1,
  },
  graphBar: {
    width: 14,
    borderRadius: 4,
  },
  graphBarLabel: {
    marginTop: Spacing.sm,
    color: '#81919c',
    fontSize: 10,
  },
});
