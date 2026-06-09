import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function TeamsTab() {
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <ThemedText type="headlineLg">Team Finder</ThemedText>
        </View>
        <View style={styles.content}>
          <Ionicons name="people-outline" size={64} color={theme.textSecondary} />
          <ThemedText type="headlineSm" style={{ marginTop: Spacing.md, color: theme.text }}>
            Find Your Squad
          </ThemedText>
          <ThemedText type="bodyMd" style={{ color: theme.textSecondary, textAlign: 'center', marginTop: Spacing.xs }}>
            Connect with local players, create a new team, or recruit members for your upcoming tournaments.
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
