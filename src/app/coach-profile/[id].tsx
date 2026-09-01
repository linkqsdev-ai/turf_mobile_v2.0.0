import React from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Screen } from '@/components/layout/screen';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Section } from '@/components/ui/section';
import { Stagger } from '@/components/motion';
import { useTokens } from '@/hooks/use-scheme';

const COACH_DATA = {
  name: 'Rohan Patel',
  sport: 'Football',
  experience: '10 Years',
  rating: 4.9,
  languages: 'English, Hindi, Marathi',
  location: 'Mumbai, Maharashtra',
  image: require('@/assets/images/illustrations/football_player.png'),
  bio: 'Passionate football coach with 10 years of experience training youth and competitive players. Specialised in modern football techniques and tactical awareness.',
  achievements: ['National Champion 2015', 'U-17 State Championship Coach', 'FIFA Certified', 'Youth Development Specialist'],
  specializations: ['Football', 'Speed Training', 'Tactical Training', 'Kids Coaching', 'Competitive Training'],
  programs: [
    { id: '1', title: 'Personal Training', desc: 'One-on-one coaching', price: '₹500/hr' },
    { id: '2', title: 'Group Training', desc: 'Team sessions (5-10 players)', price: '₹200/person' },
    { id: '3', title: 'Summer Camp', desc: '2-week intensive program', price: '₹5000' },
    { id: '4', title: 'Weekend Batch', desc: 'Sat-Sun sessions', price: '₹2000/month' },
  ],
  reviews: [
    { id: '1', name: 'Arjun Kumar', rating: 5, text: 'Excellent coach! Improved my game significantly.' },
    { id: '2', name: 'Priya Singh', rating: 4, text: 'Great technique teaching and very patient with kids.' },
  ],
};

export default function CoachProfile() {
  const router = useRouter();
  const t = useTokens();

  return (
    <Screen
      header={{
        title: COACH_DATA.name,
        onBack: () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/coach')),
        right: <Ionicons name="share-social-outline" size={20} color={t.foreground} />,
      }}
      footer={
        <View className="flex-row gap-2">
          <Button variant="outline" className="flex-1" leftIcon={<MaterialCommunityIcons name="phone" size={18} color={t.primary} />}>
            <Text className="font-bold text-primary">Call</Text>
          </Button>
          <Button variant="outline" className="flex-1" leftIcon={<MaterialCommunityIcons name="whatsapp" size={18} color={t.primary} />}>
            <Text className="font-bold text-primary">Chat</Text>
          </Button>
          <Button className="flex-[1.4]">Book session</Button>
        </View>
      }
    >
      <View className="items-center pb-2 pt-4">
        <View className="h-32 w-32 overflow-hidden rounded-full border-2 border-primary/30 bg-muted">
          <Image source={COACH_DATA.image} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        </View>
        <Text variant="heading" className="mt-3">
          {COACH_DATA.name}
        </Text>
        <Text variant="subtle" className="mt-0.5">
          {COACH_DATA.sport} · {COACH_DATA.experience}
        </Text>
        <View className="mt-2 flex-row items-center gap-2">
          <Badge variant="warning" dot>
            {COACH_DATA.rating} rating
          </Badge>
          <View className="flex-row items-center gap-1">
            <Ionicons name="location-outline" size={13} color={t.mutedForeground} />
            <Text variant="caption">{COACH_DATA.location}</Text>
          </View>
        </View>
      </View>

      <Section title="About" className="mt-4">
        <Card variant="surface">
          <Text variant="subtle">{COACH_DATA.bio}</Text>
        </Card>
      </Section>

      <Section title="Specialisations" className="mt-6">
        <View className="flex-row flex-wrap gap-2">
          {COACH_DATA.specializations.map((s) => (
            <Badge key={s} variant="muted">
              {s}
            </Badge>
          ))}
        </View>
      </Section>

      <Section title="Achievements" className="mt-6">
        <Card variant="surface" className="gap-2.5">
          {COACH_DATA.achievements.map((a) => (
            <View key={a} className="flex-row items-center gap-2">
              <Ionicons name="checkmark-done" size={16} color={t.success} />
              <Text variant="subtle">{a}</Text>
            </View>
          ))}
        </Card>
      </Section>

      <Section title="Training programs" className="mt-6">
        <Stagger className="gap-2.5">
          {COACH_DATA.programs.map((p) => (
            <Card key={p.id} variant="elevated" className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="font-bold text-foreground">{p.title}</Text>
                <Text variant="caption">{p.desc}</Text>
              </View>
              <Text className="font-bold text-primary">{p.price}</Text>
            </Card>
          ))}
        </Stagger>
      </Section>

      <Section title="Reviews" className="my-6">
        <View className="gap-2.5">
          {COACH_DATA.reviews.map((r) => (
            <Card key={r.id} variant="surface" className="gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="font-bold text-foreground">{r.name}</Text>
                <View className="flex-row gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Ionicons
                      key={i}
                      name="star"
                      size={13}
                      color={i < r.rating ? t.warning : t.border}
                    />
                  ))}
                </View>
              </View>
              <Text variant="subtle">{r.text}</Text>
            </Card>
          ))}
        </View>
      </Section>
    </Screen>
  );
}
