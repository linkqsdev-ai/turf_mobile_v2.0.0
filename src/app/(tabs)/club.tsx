import React from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MotionView } from '@/components/motion';

const PERKS = [
  { icon: 'calendar-outline', label: 'Organise fixtures & venues' },
  { icon: 'people-outline', label: 'Manage multiple squads' },
  { icon: 'podium-outline', label: 'Localised leaderboards' },
] as const;

export default function ClubScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-background">
      <LinearGradient colors={['#0A0F0D', '#0E1A15', '#0A0F0D']} className="absolute inset-0" />
      <View className="absolute -right-16 top-24 h-64 w-64 rounded-full bg-primary/15" />
      <Image
        source={require('@/assets/images/illustrations/athletes.png')}
        style={{ position: 'absolute', bottom: 40, alignSelf: 'center', width: '90%', height: '55%', opacity: 0.06 }}
        contentFit="contain"
      />
      <SafeAreaView edges={['top', 'bottom']} className="flex-1 items-center justify-center px-gutter">
        <MotionView preset="scale-in" className="w-full max-w-[360px] items-center">
          <View className="h-28 w-28 items-center justify-center rounded-full border-2 border-primary/30 bg-primary/10">
            <Ionicons name="shield-checkmark" size={56} color="#12E68A" />
          </View>
          <Badge variant="primary" className="mt-5">
            Elite clubs
          </Badge>
          <Text variant="title" className="mt-3 text-center text-white">
            Run your club like a pro
          </Text>
          <Text className="mt-2 text-center text-white/60">
            Organise matches, manage squads and compete on localised leaderboards.
          </Text>

          <View className="mt-6 w-full gap-2.5">
            {PERKS.map((p) => (
              <View
                key={p.label}
                className="flex-row items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <Ionicons name={p.icon} size={18} color="#12E68A" />
                <Text className="text-sm text-white/80">{p.label}</Text>
              </View>
            ))}
          </View>

          <Button block className="mt-7" onPress={() => router.replace('/(tabs)')}>
            Back to home
          </Button>
        </MotionView>
      </SafeAreaView>
    </View>
  );
}
