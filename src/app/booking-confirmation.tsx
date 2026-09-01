import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Screen } from '@/components/layout/screen';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MotionView } from '@/components/motion';
import { useTokens } from '@/hooks/use-scheme';

function InfoRow({
  icon,
  bg,
  color,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  bg: string;
  color: string;
  label: string;
  value?: string;
}) {
  return (
    <View className="flex-row items-start gap-3">
      <View className={`h-8 w-8 items-center justify-center rounded-full ${bg}`}>
        <Ionicons name={icon} size={14} color={color} />
      </View>
      <View className="flex-1">
        <Text variant="overline">{label}</Text>
        <Text className="font-semibold text-foreground">{value}</Text>
      </View>
    </View>
  );
}

export default function BookingConfirmationScreen() {
  const router = useRouter();
  const t = useTokens();
  const params = useLocalSearchParams<{
    bookingRef: string;
    venueName: string;
    dayLabel: string;
    slots: string;
    total: string;
    advancePaid: string;
    cashbackEarned?: string;
  }>();

  const slots = params.slots ? params.slots.split(',') : [];

  return (
    <Screen
      header={false}
      edges={['top']}
      footer={
        <View className="flex-row gap-3">
          <Button
            variant="outline"
            className="flex-1"
            leftIcon={<Ionicons name="search-outline" size={16} color={t.foreground} />}
            onPress={() => router.replace('/(tabs)/explore')}
          >
            <Text className="font-bold text-foreground">Browse more</Text>
          </Button>
          <Button
            className="flex-1"
            leftIcon={<Ionicons name="home" size={16} color="#04140D" />}
            onPress={() => router.replace('/(tabs)')}
          >
            Go home
          </Button>
        </View>
      }
    >
      <View className="items-center pt-8">
        <MotionView preset="scale-in">
          <View className="h-24 w-24 items-center justify-center rounded-full border-2 border-primary/25">
            <View
              className="h-16 w-16 items-center justify-center rounded-full bg-primary"
              style={{ shadowColor: 'rgb(0,200,120)', shadowOpacity: 0.5, shadowRadius: 16, elevation: 10 }}
            >
              <Ionicons name="checkmark" size={30} color="#04140D" />
            </View>
          </View>
        </MotionView>
        <Text variant="title" className="mt-4">
          Booking confirmed
        </Text>
        <Text variant="subtle" className="mt-1">
          Your slot has been reserved.
        </Text>
      </View>

      {params.cashbackEarned ? (
        <MotionView preset="fade-up" delay={0.15} className="mt-5">
          <Card variant="primary" className="flex-row items-center gap-3">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-primary/20">
              <Ionicons name="gift" size={18} color={t.primary} />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-primary">₹{params.cashbackEarned} cashback received</Text>
              <Text variant="caption">Added to your wallet for future sessions.</Text>
            </View>
          </Card>
        </MotionView>
      ) : null}

      <MotionView preset="fade-up" delay={0.2} className="mt-5">
        <Card variant="elevated" className="gap-3.5">
          <Badge variant="primary" className="self-start">
            {params.bookingRef}
          </Badge>
          <Separator />
          <InfoRow icon="location" bg="bg-primary/15" color={t.primary} label="Venue" value={params.venueName} />
          <InfoRow icon="calendar" bg="bg-success/15" color={t.success} label="Date" value={params.dayLabel} />
          <InfoRow icon="time" bg="bg-accent/15" color={t.accent} label="Time slots" value={slots.join(' · ')} />
          <Separator />
          <View className="flex-row items-end justify-between">
            <View>
              <Text variant="overline">Amount paid</Text>
              <Text className="font-extrabold text-xl text-primary">₹{params.advancePaid}</Text>
            </View>
            <View className="items-end">
              <Text variant="overline">Total</Text>
              <Text className="font-bold text-foreground">₹{params.total}</Text>
            </View>
          </View>
        </Card>
      </MotionView>

      <MotionView preset="fade-up" delay={0.28} className="mb-6 mt-4">
        <Card variant="muted" className="flex-row items-start gap-3">
          <Ionicons name="information-circle" size={18} color={t.primary} />
          <Text variant="caption" className="flex-1">
            A confirmation has been sent to your registered contact. Show your booking reference at the
            venue.
          </Text>
        </Card>
      </MotionView>
    </Screen>
  );
}
