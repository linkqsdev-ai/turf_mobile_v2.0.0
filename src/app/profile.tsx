import React from 'react';
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

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header Bar */}
        <View style={[styles.header, { backgroundColor: theme.background }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </Pressable>
          <ThemedText type="headlineSm" style={styles.headerTitle}>
            Player Profile
          </ThemedText>
          <Pressable style={styles.iconButton}>
            <Ionicons name="share-outline" size={22} color={theme.text} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Hero Profile Card */}
          <View style={styles.section}>
            <View style={[styles.heroCard, { backgroundColor: theme.surfaceLowest }, Shadows.level2]}>
              <View style={styles.avatarWrapper}>
                <Image
                  source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD906cwGePK5tZt4al07polQZxe4OW2sIJ-lhjDewDXct6IJtZetqa2i4lnO9-CMUT1oBiYhGj0BUqSwgzvIHynL-pG1kkY5KzzF9cvL0bxVNlPJEbfv2pHhgwd2mkejpG9vnC4b1XliECQQDedwmy8XfJ0AUw7fpdjFhLXiUdidhARSpLIkMeew198pOXaj0K9g0kbbWaDwJfBtYdJwqD1ztbzBAkeltwyKB0I_eTeM0ksi5qEbR6iQRPKqERd-3DOKAQez21qHyI' }}
                  style={styles.avatarImage}
                />
                <View style={[styles.proBadge, { backgroundColor: theme.secondaryContainer }]}>
                  <ThemedText type="labelSm" style={{ color: theme.onSecondaryContainer, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 9 }}>
                    PRO ELITE
                  </ThemedText>
                </View>
              </View>

              <View style={styles.heroInfo}>
                <ThemedText type="headlineLg" style={{ color: theme.text }}>Azarudeen</ThemedText>
                <ThemedText type="bodySm" style={{ color: theme.textSecondary, marginTop: Spacing.half }}>
                  Forward • London, UK
                </ThemedText>
                <ThemedText type="bodyMd" style={{ color: theme.textSecondary, textAlign: 'center', marginTop: Spacing.md }}>
                  Dedicated performance athlete focusing on tactical execution and explosive power. Currently competing in the Diamond League and lead captain of Blue Falcons FC.
                </ThemedText>
              </View>

              <View style={styles.heroActions}>
                <Pressable style={[styles.primaryActionBtn, { backgroundColor: theme.primary }]}>
                  <ThemedText type="labelMd" style={{ color: '#ffffff' }}>EDIT PROFILE</ThemedText>
                </Pressable>
                <Pressable style={[styles.secondaryActionBtn, { borderColor: theme.outline }]}>
                  <ThemedText type="labelMd" style={{ color: theme.text }}>SHARE STATS</ThemedText>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Stats Bento Grid */}
          <View style={styles.section}>
            <ThemedText type="labelMd" style={{ color: theme.textSecondary, marginBottom: Spacing.sm, letterSpacing: 0.5 }}>
              PERFORMANCE OVERVIEW
            </ThemedText>

            <View style={styles.bentoContainer}>
              <View style={styles.bentoRow}>
                <View style={[styles.bentoCell, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
                  <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>MATCHES PLAYED</ThemedText>
                  <View style={styles.bentoValRow}>
                    <ThemedText type="displayLgMobile" style={{ color: theme.text }}>142</ThemedText>
                    <ThemedText type="labelSm" style={{ color: theme.secondary, fontFamily: 'PlusJakartaSans_700Bold' }}>+12% LY</ThemedText>
                  </View>
                </View>
                <View style={[styles.bentoCell, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
                  <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>TOTAL WINS</ThemedText>
                  <View style={styles.bentoValRow}>
                    <ThemedText type="displayLgMobile" style={{ color: theme.text }}>89</ThemedText>
                    <ThemedText type="labelSm" style={{ color: '#16a34a', fontFamily: 'PlusJakartaSans_700Bold' }}>62.6% WR</ThemedText>
                  </View>
                </View>
              </View>

              {/* Skill Rating Card */}
              <View style={[styles.skillCard, { backgroundColor: theme.primaryContainer }]}>
                <Ionicons name="medal" size={80} color="rgba(255,255,255,0.03)" style={styles.skillCardDecor} />
                <ThemedText type="labelSm" style={{ color: theme.onPrimaryContainer, letterSpacing: 0.5 }}>SKILL RATING</ThemedText>
                <View style={styles.skillValRow}>
                  <ThemedText type="displayLgMobile" style={{ color: '#ffffff' }}>2,840</ThemedText>
                  <ThemedText type="headlineSm" style={{ color: theme.secondaryContainer, marginLeft: Spacing.sm }}>PLATINUM</ThemedText>
                </View>
                <View style={styles.progressContainer}>
                  <View style={[styles.progressTrack, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                    <View style={[styles.progressBar, { backgroundColor: theme.secondaryContainer, width: '85%' }]} />
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Teams Section */}
          <View style={styles.section}>
            <View style={styles.rowBetween}>
              <ThemedText type="headlineSm">My Teams</ThemedText>
              <Pressable>
                <ThemedText type="labelMd" style={{ color: theme.secondary }}>VIEW ALL</ThemedText>
              </Pressable>
            </View>

            <View style={styles.teamList}>
              <View style={[styles.teamItemCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
                <Image source={require('@/assets/images/illustrations/athletes.png')} style={styles.teamItemLogo} contentFit="cover" />
                <View style={{ flex: 1, marginLeft: Spacing.md }}>
                  <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>Elite Tennis Club</ThemedText>
                  <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Lead Member • Tier 1</ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.outline} />
              </View>

              <View style={[styles.teamItemCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
                <Image source={require('@/assets/images/illustrations/tennis_player.png')} style={styles.teamItemLogo} contentFit="cover" />
                <View style={{ flex: 1, marginLeft: Spacing.md }}>
                  <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>Imperial Badminton</ThemedText>
                  <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Active Pro • Regional</ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.outline} />
              </View>
            </View>
          </View>

          {/* Health Vitals & Upcoming Matches split */}
          <View style={styles.section}>
            <View style={[styles.vitalsCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
              <View style={styles.rowBetween}>
                <ThemedText type="headlineSm">Health Vitals</ThemedText>
                <Ionicons name="pulse" size={18} color={theme.secondary} />
              </View>
              <View style={styles.vitalsRow}>
                <View style={styles.vitalItem}>
                  <ThemedText type="bodySm" style={{ color: theme.textSecondary }}>Recovery Score</ThemedText>
                  <ThemedText type="headlineSm" style={{ color: '#16a34a' }}>92%</ThemedText>
                </View>
                <View style={styles.vitalItem}>
                  <ThemedText type="bodySm" style={{ color: theme.textSecondary }}>Heart Rate (Avg)</ThemedText>
                  <ThemedText type="headlineSm" style={{ color: theme.text }}>54 BPM</ThemedText>
                </View>
                <View style={styles.vitalItem}>
                  <ThemedText type="bodySm" style={{ color: theme.textSecondary }}>Sleep Quality</ThemedText>
                  <ThemedText type="headlineSm" style={{ color: theme.secondary }}>Optimal</ThemedText>
                </View>
              </View>
            </View>
          </View>

          {/* Upcoming Matches */}
          <View style={[styles.section, { paddingBottom: 60 }]}>
            <View style={[styles.upcomingCard, { backgroundColor: theme.primaryContainer }]}>
              <ThemedText type="labelSm" style={{ color: theme.onPrimaryContainer }}>UPCOMING MATCH</ThemedText>
              <ThemedText type="labelMd" style={{ color: theme.secondaryContainer, marginTop: Spacing.half, fontFamily: 'PlusJakartaSans_700Bold' }}>
                SATURDAY, 18:30 GMT
              </ThemedText>
              
              <View style={styles.versusContainer}>
                <View style={styles.versusTeam}>
                  <View style={styles.teamBadgeText}><ThemedText type="bodySm" style={{ color: '#ffffff', fontWeight: '800' }}>BF</ThemedText></View>
                  <ThemedText type="labelSm" style={{ color: '#ffffff', marginTop: 4 }}>Falcons</ThemedText>
                </View>
                <ThemedText type="headlineSm" style={{ color: theme.secondaryContainer }}>VS</ThemedText>
                <View style={styles.versusTeam}>
                  <View style={styles.teamBadgeText}><ThemedText type="bodySm" style={{ color: '#ffffff', fontWeight: '800' }}>WS</ThemedText></View>
                  <ThemedText type="labelSm" style={{ color: '#ffffff', marginTop: 4 }}>Wolves</ThemedText>
                </View>
              </View>

              <Pressable style={[styles.briefBtn, { backgroundColor: theme.secondaryContainer }]}>
                <ThemedText type="labelMd" style={{ color: theme.onSecondaryContainer, fontWeight: '700' }}>
                  VIEW PRE-MATCH BRIEF
                </ThemedText>
              </Pressable>
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
    paddingHorizontal: Spacing.md,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#0000000a',
    zIndex: 10,
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 16,
  },
  iconButton: {
    padding: 6,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.containerMargin,
  },
  heroCard: {
    borderRadius: BorderRadius.premium,
    borderWidth: 1,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  proBadge: {
    position: 'absolute',
    bottom: -6,
    alignSelf: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  heroInfo: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  heroActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.lg,
  },
  primaryActionBtn: {
    flex: 1,
    height: 40,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryActionBtn: {
    flex: 1,
    height: 40,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bentoContainer: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  bentoCell: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
  },
  bentoValRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: Spacing.half,
  },
  skillCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  skillCardDecor: {
    position: 'absolute',
    right: -10,
    bottom: -10,
  },
  skillValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: Spacing.xs,
  },
  progressContainer: {
    marginTop: Spacing.md,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  teamList: {
    gap: Spacing.sm,
  },
  teamItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
  },
  teamItemLogo: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  vitalsCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  vitalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  vitalItem: {
    alignItems: 'center',
  },
  upcomingCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  versusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
    marginVertical: Spacing.lg,
  },
  versusTeam: {
    alignItems: 'center',
  },
  teamBadgeText: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  briefBtn: {
    width: '100%',
    height: 48,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
