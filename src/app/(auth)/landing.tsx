import React, { useRef, useState } from 'react';
import { Animated, Dimensions, FlatList, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MotionView } from '@/components/motion';
import { cn } from '@/lib/utils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Slide = {
  id: string;
  tag: string;
  title: string;
  highlight: string;
  description: string;
  image: any;
  accent: string;
  features: string[];
};

const onboardingSlides: Slide[] = [
  {
    id: 'sports_os',
    tag: 'Multisport',
    title: 'Every sport,',
    highlight: 'one platform',
    description:
      'Performance trackers, schedulers and live scorecards for football, cricket, tennis, basketball and more.',
    image: require('@/assets/images/illustrations/sports_os_premium_cover.png'),
    accent: '#00C878',
    features: ['Football', 'Cricket', 'Tennis'],
  },
  {
    id: 'turf_booking',
    tag: 'Arena rentals',
    title: 'Instant turf',
    highlight: 'booking',
    description:
      'Search by location, compare amenities and pricing, and lock slots with collision-safe scheduling.',
    image: require('@/assets/images/illustrations/turf_booking_premium.png'),
    accent: '#12E68A',
    features: ['Find turf', 'Book slot', 'Confirm'],
  },
  {
    id: 'scoring',
    tag: 'Live scorecard',
    title: 'Live score,',
    highlight: 'any sport',
    description:
      'Track goals, wickets, runs and fouls as they happen on an adaptive dashboard that updates instantly.',
    image: require('@/assets/images/illustrations/score_input_premium.png'),
    accent: '#3B9EFF',
    features: ['Football', 'Cricket', 'Basketball'],
  },
  {
    id: 'tournaments',
    tag: 'Leagues & clubs',
    title: 'Tournaments',
    highlight: '& leagues',
    description:
      'Draft schedules, recruit and register squads, keep standings live and crown your champions.',
    image: require('@/assets/images/illustrations/tournament_bracket_premium.png'),
    accent: '#FF7A1A',
    features: ['Register', 'Brackets', 'Leaderboard'],
  },
  {
    id: 'quick_matches',
    tag: 'Instant play',
    title: 'Find and',
    highlight: 'play now',
    description:
      'Discover nearby players, spin up quick matches, build teams and get straight onto the pitch.',
    image: require('@/assets/images/illustrations/quick_matches_premium.png'),
    accent: '#C6FF3D',
    features: ['Find players', 'Form team', 'Kick off'],
  },
  {
    id: 'bid_matches',
    tag: 'Challenges',
    title: 'Bid and',
    highlight: 'challenge',
    description:
      'Place custom bids, challenge rival teams in your area and stake your claim on the leaderboards.',
    image: require('@/assets/images/illustrations/bid_matches_premium.png'),
    accent: '#FFB020',
    features: ['Bid', 'Challenge', 'Leaderboard'],
  },
  {
    id: 'coaching',
    tag: 'Coach academies',
    title: 'Expert',
    highlight: 'coaching',
    description:
      'Coaches publish structured batches; players enrol to sharpen tactics and athletic skill.',
    image: require('@/assets/images/illustrations/coaching_class_premium.png'),
    accent: '#A66BFF',
    features: ['Find coach', 'Enrol', 'Level up'],
  },
];

function SlideItem({
  item,
  index,
  scrollX,
}: {
  item: Slide;
  index: number;
  scrollX: Animated.Value;
}) {
  const inputRange = [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH];
  const imageScale = scrollX.interpolate({ inputRange, outputRange: [0.86, 1, 0.86], extrapolate: 'clamp' });
  const imageOpacity = scrollX.interpolate({ inputRange, outputRange: [0.4, 1, 0.4], extrapolate: 'clamp' });
  const textTranslate = scrollX.interpolate({ inputRange, outputRange: [36, 0, -36], extrapolate: 'clamp' });
  const textOpacity = scrollX.interpolate({ inputRange, outputRange: [0, 1, 0], extrapolate: 'clamp' });

  return (
    <View style={{ width: SCREEN_WIDTH }} className="flex-1 px-gutter">
      <View className="flex-1 items-center justify-center">
        <View
          className="absolute h-72 w-72 rounded-full opacity-20"
          style={{ backgroundColor: item.accent }}
        />
        <Animated.View
          style={{ transform: [{ scale: imageScale }], opacity: imageOpacity }}
          className="h-[42%] w-full"
        >
          <Image source={item.image} style={{ width: '100%', height: '100%' }} contentFit="contain" />
        </Animated.View>
      </View>

      <Animated.View
        style={{ opacity: textOpacity, transform: [{ translateY: textTranslate }] }}
        className="pb-4"
      >
        <View
          className="mb-3 self-start rounded-full border px-3 py-1"
          style={{ backgroundColor: item.accent + '22', borderColor: item.accent + '55' }}
        >
          <Text className="text-2xs font-bold uppercase tracking-widest" style={{ color: item.accent }}>
            {item.tag}
          </Text>
        </View>
        <Text variant="display" className="text-white">
          {item.title}{' '}
          <Text variant="display" style={{ color: item.accent }}>
            {item.highlight}
          </Text>
        </Text>
        <Text className="mt-3 text-base leading-6 text-white/60">{item.description}</Text>
        <View className="mt-4 flex-row flex-wrap gap-2">
          {item.features.map((f) => (
            <View key={f} className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">
              <Text className="text-xs font-semibold text-white/80">{f}</Text>
            </View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

export default function LandingScreen() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList<Slide>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleScroll = (e: any) => {
    setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH));
  };

  const handleNext = () => {
    if (activeIndex < onboardingSlides.length - 1) {
      listRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      router.push('/login');
    }
  };

  const isLast = activeIndex === onboardingSlides.length - 1;

  return (
    <View className="flex-1 bg-background">
      <LinearGradient colors={['#0A0F0D', '#0D1713', '#0A0F0D']} className="absolute inset-0" />
      <SafeAreaView edges={['top', 'bottom']} className="flex-1">
        <View className="flex-row items-center justify-between px-gutter pt-2">
          <Badge variant="primary">Turf</Badge>
          <Pressable onPress={() => router.push('/login')} hitSlop={8}>
            <Text className="text-sm font-semibold text-white/60">Skip</Text>
          </Pressable>
        </View>

        <FlatList
          ref={listRef}
          data={onboardingSlides}
          renderItem={({ item, index }) => <SlideItem item={item} index={index} scrollX={scrollX} />}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
            useNativeDriver: false,
            listener: handleScroll,
          })}
          scrollEventThrottle={16}
          className="flex-1"
        />

        <MotionView preset="fade-up" className="gap-4 px-gutter pb-2 pt-3">
          <View className="flex-row justify-center gap-1.5">
            {onboardingSlides.map((_, i) => (
              <Pressable
                key={i}
                onPress={() => listRef.current?.scrollToIndex({ index: i, animated: true })}
              >
                <View
                  className={cn(
                    'h-1.5 rounded-full',
                    i === activeIndex ? 'w-6 bg-primary' : 'w-1.5 bg-white/20',
                  )}
                />
              </Pressable>
            ))}
          </View>

          <Button block onPress={handleNext}>
            {isLast ? 'Get started' : 'Continue'}
          </Button>
          <View className="flex-row gap-3">
            <Button variant="outline" block className="flex-1 border-white/20" onPress={() => router.push('/login')}>
              <Text className="font-bold text-white">Sign in</Text>
            </Button>
            <Button variant="outline" block className="flex-1 border-white/20" onPress={() => router.push('/signup')}>
              <Text className="font-bold text-white">Register</Text>
            </Button>
          </View>
        </MotionView>
      </SafeAreaView>
    </View>
  );
}
