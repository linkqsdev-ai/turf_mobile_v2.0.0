import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { GradientContainer } from '@/components/gradient-container';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { QuickMatchTab } from '@/components/matches/QuickMatchTab';

export default function NewMatchScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <GradientContainer screenName="matches" style={styles.container}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: theme.outlineVariant + '33' }]}>
          <Pressable
            style={styles.backBtn}
            hitSlop={8}
            accessibilityLabel="Go back"
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace('/(tabs)/matches')
            }
          >
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </Pressable>
          <ThemedText style={[styles.headerTitle, { color: theme.text }]}>Quick Match</ThemedText>
          <View style={styles.backBtn} />
        </View>

        {/* No floating tab bar on this stack screen, so the tab-bar inset
            QuickMatchTab reserves by default would leave dead space. */}
        <View style={styles.body}>
          <QuickMatchTab bottomInset={Spacing.md} />
        </View>
      </SafeAreaView>
    </GradientContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.containerMargin,
    height: 52,
    borderBottomWidth: 1,
  },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Sora_500Medium', fontSize: 14, letterSpacing: -0.2 },
  body: { flex: 1 },
});
