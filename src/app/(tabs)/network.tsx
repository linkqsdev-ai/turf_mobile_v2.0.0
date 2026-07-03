import React from 'react';
import {
  StyleSheet,
  View,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { GradientContainer } from '@/components/gradient-container';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function NetworkScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <GradientContainer screenName="network" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Top App Bar */}
        <View style={[styles.header, { backgroundColor: 'transparent' }]}>
          <ThemedText type="headlineSm" style={[styles.headerTitle, { marginLeft: 0 }]}>
            Connect
          </ThemedText>
        </View>

        <View style={styles.content}>
          <View style={styles.card}>
            <Image
              source={require('@/assets/images/illustrations/athletes.png')}
              style={styles.illustration}
              contentFit="contain"
            />
            
            <View style={styles.badge}>
              <Ionicons name="sparkles" size={12} color="#FFA751" />
              <ThemedText type="labelSm" style={{ color: '#FFA751', fontWeight: '800', marginLeft: 4, letterSpacing: 1.5 }}>
                COMMUNITY NETWORK
              </ThemedText>
            </View>

            <ThemedText type="headlineLg" style={{ color: theme.text, marginTop: Spacing.md, textAlign: 'center' }}>
              Connect is coming soon!
            </ThemedText>

            <ThemedText type="bodySm" style={{ color: theme.textSecondary, marginTop: Spacing.sm, textAlign: 'center', lineHeight: 18, paddingHorizontal: 12 }}>
              We are cooking up an elite instant messaging and sports community experience. You will soon be able to chat with players, find local matches, and form groups effortlessly.
            </ThemedText>

            <Pressable 
              style={[styles.primaryButton, { backgroundColor: theme.primary }]}
              onPress={() => router.replace('/(tabs)')}
            >
              <ThemedText type="labelSm" style={{ color: '#ffffff', fontFamily: 'PlusJakartaSans_700Bold' }}>
                BACK TO HOME
              </ThemedText>
            </Pressable>
          </View>
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
    paddingHorizontal: Spacing.containerMargin,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#0000000a',
  },
  headerTitle: {
    flex: 1,
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 18,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.containerMargin,
  },
  card: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: BorderRadius.premium,
    padding: Spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  illustration: {
    width: 220,
    height: 180,
    marginBottom: Spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE25920',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  primaryButton: {
    width: '100%',
    height: 48,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
});
