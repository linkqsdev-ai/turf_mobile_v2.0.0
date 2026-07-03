import React from 'react';
import { StyleSheet, View, Pressable, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';

const { width } = Dimensions.get('window');

export default function ClubScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      {/* Top Banner Background */}
      <LinearGradient
        colors={['#1a1c29', '#0d0e15']}
        style={styles.gradientBg}
      >
        <Image
          source={require('@/assets/images/illustrations/athletes.png')}
          style={styles.watermarkBg}
          contentFit="contain"
        />

        <View style={styles.content}>
          {/* PRO Badge */}
          <LinearGradient
            colors={['#ffe259', '#ffa751']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.proBadge}
          >
            <Ionicons name="sparkles" size={12} color="#000000" style={{ marginRight: 4 }} />
            <ThemedText style={styles.proBadgeText}>PRO EXCLUSIVE</ThemedText>
          </LinearGradient>

          {/* Central Illustration container */}
          <View style={styles.illustrationContainer}>
            <View style={styles.shieldWrapper}>
              <Ionicons name="shield-checkmark" size={60} color="#ffd700" />
            </View>
          </View>

          {/* Texts */}
          <ThemedText style={styles.title}>
            Elite Clubs
          </ThemedText>

          <ThemedText style={styles.subtitle}>
            Organize matches, manage team rosters, and compete in localized leaderboards.
          </ThemedText>

          {/* Release status card */}
          <View style={styles.statusCard}>
            <Ionicons name="time" size={18} color="#ffa751" style={{ marginRight: 8 }} />
            <ThemedText style={styles.statusText}>
              RELEASING SOON
            </ThemedText>
          </View>

          {/* Back button */}
          <Pressable
            onPress={() => router.replace('/(tabs)')}
            style={styles.actionButton}
          >
            <ThemedText style={styles.actionButtonText}>
              Back to Home
            </ThemedText>
          </Pressable>
        </View>
      </LinearGradient>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0e15',
  },
  gradientBg: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  watermarkBg: {
    position: 'absolute',
    width: width * 0.9,
    height: width * 0.9,
    opacity: 0.05,
    top: Spacing.xxl * 2,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 340,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.lg,
  },
  proBadgeText: {
    color: '#000000',
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    letterSpacing: 1,
  },
  illustrationContainer: {
    marginBottom: Spacing.md,
  },
  shieldWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    shadowColor: '#ffd700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontFamily: 'HankenGrotesk_800ExtraBold',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_500Medium',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 167, 81, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 167, 81, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xxl,
  },
  statusText: {
    color: '#ffa751',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: 1.5,
  },
  actionButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: BorderRadius.full,
    width: '100%',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#0d0e15',
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
});
