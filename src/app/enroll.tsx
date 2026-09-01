import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Screen } from '@/components/layout/screen';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Section } from '@/components/ui/section';
import { Separator } from '@/components/ui/separator';
import { MotionView } from '@/components/motion';

export default function EnrollScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const title = (params.title as string) || 'Summer Camp Enrollment';
  const priceRaw = (params.price as string) || '4999';
  const dates = (params.dates as string) || 'Summer 2024';
  const location = (params.location as string) || 'TBD';
  const image =
    (params.image as string) || require('@/assets/images/illustrations/coaching_class_premium.png');

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [skillLevel, setSkillLevel] = useState('Beginner');

  const basePrice = parseInt(String(priceRaw).replace(/[^0-9]/g, ''), 10) || 0;
  const serviceFee = 150;
  const total = basePrice + serviceFee;

  const handleEnroll = () => {
    if (!name || !age || !phone) {
      Alert.alert('Missing fields', 'Please fill out all participant details before enrolling.');
      return;
    }
    Alert.alert(
      'Enrollment confirmed',
      `You have successfully enrolled ${name} in ${title}.\nTotal paid: ₹${total}`,
      [
        {
          text: 'Back to home',
          onPress: () => {
            router.dismissAll();
            router.replace('/(tabs)');
          },
        },
      ],
    );
  };

  const imageSource =
    typeof image === 'string' && /^\d+$/.test(image)
      ? parseInt(image, 10)
      : typeof image === 'string'
        ? { uri: image }
        : image;

  return (
    <Screen
      header={{ title: 'Registration' }}
      footer={
        <View className="flex-row items-center gap-3">
          <View className="flex-1">
            <Text variant="caption">Total incl. taxes</Text>
            <Text className="font-extrabold text-xl text-foreground">₹{total}</Text>
          </View>
          <Button className="px-7" leftIcon={<Ionicons name="card-outline" size={17} color="#04140D" />} onPress={handleEnroll}>
            Pay &amp; enrol
          </Button>
        </View>
      }
    >
      <MotionView preset="fade-up" className="mt-3 h-48 overflow-hidden rounded-2xl">
        <Image source={imageSource} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        <View className="absolute inset-0 justify-end bg-black/45 p-4">
          <Text className="font-extrabold text-xl text-white">{title}</Text>
          <View className="mt-2 flex-row gap-4">
            <View className="flex-row items-center gap-1">
              <Ionicons name="calendar-outline" size={13} color="#ffffffaa" />
              <Text className="text-xs text-white/80">{dates}</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Ionicons name="location-outline" size={13} color="#ffffffaa" />
              <Text className="text-xs text-white/80">{location}</Text>
            </View>
          </View>
        </View>
      </MotionView>

      <Section title="Participant details" className="mt-6">
        <Card variant="elevated" className="gap-4">
          <Input label="Full name" placeholder="e.g. Rahul Sharma" value={name} onChangeText={setName} />
          <View className="flex-row gap-3">
            <Input
              containerClassName="w-24"
              label="Age"
              placeholder="14"
              keyboardType="numeric"
              value={age}
              onChangeText={(v) => setAge(v.replace(/[^0-9]/g, ''))}
            />
            <Input
              containerClassName="flex-1"
              label="Contact phone"
              placeholder="+91 98765 43210"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={(v) => setPhone(v.replace(/[^0-9+\s\-()]/g, ''))}
            />
          </View>
          <View className="gap-2">
            <Text variant="caption" className="text-foreground">
              Skill level
            </Text>
            <View className="flex-row gap-2">
              {['Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
                <Chip
                  key={lvl}
                  label={lvl}
                  selected={skillLevel === lvl}
                  onPress={() => setSkillLevel(lvl)}
                  className="flex-1 justify-center"
                />
              ))}
            </View>
          </View>
        </Card>
      </Section>

      <Section title="Payment summary" className="my-6">
        <Card variant="elevated" className="gap-2.5">
          <View className="flex-row justify-between">
            <Text variant="subtle">Enrollment fee</Text>
            <Text className="font-bold text-foreground">₹{basePrice}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text variant="subtle">Taxes &amp; service fee</Text>
            <Text className="font-bold text-foreground">₹{serviceFee}</Text>
          </View>
          <Separator className="my-1" />
          <View className="flex-row justify-between">
            <Text variant="subheading">Total due</Text>
            <Text className="font-extrabold text-lg text-primary">₹{total}</Text>
          </View>
        </Card>
      </Section>
    </Screen>
  );
}
