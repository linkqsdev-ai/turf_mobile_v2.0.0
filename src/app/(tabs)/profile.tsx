import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function ProfileTab() {
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <ThemedText type="headlineLg">Player Profile</ThemedText>
        </View>
        <View style={styles.content}>
          <Ionicons name="person-outline" size={64} color={theme.textSecondary} />
          <ThemedText type="headlineSm" style={{ marginTop: Spacing.md, color: theme.text }}>
            Player Stats & Dashboard
          </ThemedText>
          <ThemedText type="bodyMd" style={{ color: theme.textSecondary, textAlign: 'center', marginTop: Spacing.xs }}>
            View your player rating, match history, bookings, and active memberships in Sports OS.
          </ThemedText>
        </View>
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
    paddingHorizontal: Spacing.containerMargin,
  },
  header: {
    paddingVertical: Spacing.md,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
});
