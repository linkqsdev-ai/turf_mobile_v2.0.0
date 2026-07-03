import React from 'react';
import {
  StyleSheet,
  View,
  Pressable,
} from 'react-native';
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
    <GradientContainer screenName="booking" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable
              onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/matches')}
              style={styles.backBtn}
            >
              <Ionicons name="arrow-back" size={22} color={theme.text} />
            </Pressable>
            <ThemedText style={styles.headerText}>
              Quick Match
            </ThemedText>
          </View>
          <View style={styles.headerRight}>
            {/* Temporarily Hidden Network Activity Icon */}
            {/* <Pressable style={styles.iconBtn} onPress={() => router.push('/network')}>
              <Ionicons name="pulse" size={20} color={theme.secondary} />
            </Pressable> */}
            <Pressable style={styles.iconBtn}>
              <Ionicons name="notifications-outline" size={20} color={theme.secondary} />
            </Pressable>
          </View>
        </View>

        {/* Content Tab Component */}
        <View style={{ flex: 1 }}>
          <QuickMatchTab />
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
    height: 52,
    borderBottomWidth: 1,
    borderBottomColor: '#eceef0',
    backgroundColor: '#ffffff',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    padding: 4,
  },
  headerText: {
    fontSize: 16,
    fontFamily: 'HankenGrotesk_700Bold',
    color: '#191c1e',
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
