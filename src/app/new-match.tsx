import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AppHeader } from '@/components/layout/app-header';
import { QuickMatchTab } from '@/components/matches/QuickMatchTab';
import { useScheme } from '@/hooks/use-scheme';

export default function NewMatchScreen() {
  const router = useRouter();
  const scheme = useScheme();

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <AppHeader
        title="Quick match"
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/matches'))}
      />
      <View className="flex-1">
        <QuickMatchTab />
      </View>
    </SafeAreaView>
  );
}
