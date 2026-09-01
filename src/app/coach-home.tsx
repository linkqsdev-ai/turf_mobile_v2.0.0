import React, { useState } from 'react';
import { Dimensions, FlatList, Image, Pressable, ScrollView, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Screen } from '@/components/layout/screen';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Section } from '@/components/ui/section';
import { Chip } from '@/components/ui/chip';
import { Carousel } from '@/components/carousel';
import { useTokens } from '@/hooks/use-scheme';
import { SPORTS_LIST } from '@/constants/sports';

const FEATURED_BANNERS = [
  { id: '1', title: 'Summer Football Camp 2026', image: require('@/assets/images/illustrations/football_player.png'), color: '#00C878' },
  { id: '2', title: 'Kids Cricket Academy', image: require('@/assets/images/illustrations/cricket_player.png'), color: '#3B9EFF' },
  { id: '3', title: 'Weekend Fitness Training', image: require('@/assets/images/illustrations/athletes.png'), color: '#FF7A1A' },
  { id: '4', title: "Women's Badminton Camp", image: require('@/assets/images/illustrations/athletes.png'), color: '#FF5CA8' },
];

const QUICK_CATEGORIES = [
  { id: '1', title: 'Summer Classes', icon: 'school' },
  { id: '2', title: 'Personal Coaching', icon: 'account' },
  { id: '3', title: 'Group Training', icon: 'account-group' },
  { id: '4', title: 'Kids Academy', icon: 'emoticon-happy' },
  { id: '5', title: 'Fitness Training', icon: 'dumbbell' },
  { id: '6', title: 'Weekend Camps', icon: 'calendar' },
];

const FEATURED_COACHES = [
  { id: '1', name: 'Rohan Patel', sport: 'Football', experience: '10 yrs', rating: 4.9, price: '₹500/hr', image: require('@/assets/images/illustrations/football_player.png') },
  { id: '2', name: 'Maya Singh', sport: 'Cricket', experience: '8 yrs', rating: 4.8, price: '₹600/hr', image: require('@/assets/images/illustrations/cricket_player.png') },
  { id: '3', name: 'Vikram Rao', sport: 'Badminton', experience: '12 yrs', rating: 4.7, price: '₹400/hr', image: require('@/assets/images/illustrations/athletes.png') },
  { id: '4', name: 'Sara Lee', sport: 'Tennis', experience: '9 yrs', rating: 4.9, price: '₹700/hr', image: require('@/assets/images/illustrations/tennis_player.png') },
];

export default function CoachHomeScreen() {
  const router = useRouter();
  const t = useTokens();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const bannerWidth = Dimensions.get('window').width - 40;

  return (
    <Screen header={{ title: 'Discover coaches', large: true, subtitle: 'Find your perfect training match' }}>
      <View className="gap-3 pt-1">
        <Input
          placeholder="Search football coach, cricket academy…"
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftSlot={<Ionicons name="search" size={17} color={t.mutedForeground} />}
          rightSlot={
            searchQuery ? (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={17} color={t.mutedForeground} />
              </Pressable>
            ) : undefined
          }
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {SPORTS_LIST.map((sport: any) => (
            <Chip
              key={sport.name}
              label={sport.name}
              selected={selectedSport === sport.name}
              onPress={() => setSelectedSport(selectedSport === sport.name ? null : sport.name)}
              leftIcon={
                <MaterialIcons
                  name={sport.icon}
                  size={13}
                  color={selectedSport === sport.name ? t.primaryForeground : sport.color}
                />
              }
            />
          ))}
        </ScrollView>
      </View>

      <Section title="Featured" className="mt-6">
        <Carousel
          data={FEATURED_BANNERS}
          height={160}
          renderItem={(item: (typeof FEATURED_BANNERS)[number]) => (
            <Pressable
              style={{ width: bannerWidth, backgroundColor: item.color }}
              className="mx-5 flex-row items-center justify-between rounded-2xl p-5"
              onPress={() =>
                router.push({
                  pathname: '/enroll',
                  params: {
                    title: item.title,
                    price: '₹4,999',
                    dates: 'June - Aug 2026',
                    location: 'Apex Arena',
                    themeColor: item.color,
                  },
                })
              }
            >
              <View className="flex-1 pr-3">
                <Text className="font-extrabold text-lg text-white">{item.title}</Text>
                <View className="mt-3 self-start rounded-full bg-white px-3 py-1.5">
                  <Text className="text-2xs font-bold" style={{ color: item.color }}>
                    Join now
                  </Text>
                </View>
              </View>
              <Image source={item.image} style={{ width: 78, height: 78, borderRadius: 16 }} />
            </Pressable>
          )}
        />
      </Section>

      <Section title="Quick categories" className="mt-6">
        <View className="flex-row flex-wrap justify-between gap-3">
          {QUICK_CATEGORIES.map((cat) => (
            <Card key={cat.id} variant="elevated" className="w-[31%] items-center py-4" padded={false}>
              <MaterialCommunityIcons name={cat.icon as any} size={26} color={t.primary} />
              <Text variant="caption" className="mt-2 text-center">
                {cat.title}
              </Text>
            </Card>
          ))}
        </View>
      </Section>

      <Section title="Featured coaches" action={{ label: 'See all', onPress: () => router.push('/coach') }} className="my-6">
        <FlatList
          data={FEATURED_COACHES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ gap: 12 }}
          renderItem={({ item }) => (
            <Card
              variant="elevated"
              className="w-44"
              onPress={() => router.push({ pathname: '/coach-profile/[id]', params: { id: item.id } })}
            >
              <Image source={item.image} style={{ width: '100%', height: 110, borderRadius: 14 }} />
              <Text className="mt-2 font-bold text-foreground" numberOfLines={1}>
                {item.name}
              </Text>
              <Text variant="caption">{item.sport}</Text>
              <View className="mt-1.5 flex-row items-center justify-between">
                <Text variant="caption">{item.experience}</Text>
                <View className="flex-row items-center gap-1">
                  <Ionicons name="star" size={12} color={t.warning} />
                  <Text className="text-xs font-bold text-foreground">{item.rating}</Text>
                </View>
              </View>
              <Text className="mt-2 font-bold text-primary">{item.price}</Text>
              <View className="mt-2.5 flex-row gap-2">
                <Button variant="outline" size="sm" className="flex-1 px-0">
                  <Text className="text-xs font-bold text-foreground">Profile</Text>
                </Button>
                <Button size="sm" className="flex-1 px-0">
                  Book
                </Button>
              </View>
            </Card>
          )}
        />
      </Section>
    </Screen>
  );
}
