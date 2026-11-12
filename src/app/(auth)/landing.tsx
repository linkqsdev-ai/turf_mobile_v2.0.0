import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  Pressable,
  Platform,
  Animated,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemedText } from '@/components/themed-text';
import { Shadows } from '@/constants/theme';
import { BRAND } from '@/constants/brand';
import { AnimatedBrandLogo } from '@/components/brand/animated-brand-logo';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

/** How long a slide shows before the carousel moves on by itself. */
const AUTOPLAY_MS = 4500;

interface OnboardingSlide {
  id: string;
  /** Card header: what this part of the app is. */
  label: string;
  titleNormal: string;
  titleHighlight: string;
  description: string;
  image: any;
  icon: IoniconName;
  emoji: string;
  features: string[];
}

const onboardingSlides: OnboardingSlide[] = [
  {
    id: 'sports_os',
    label: 'Multisport Support',
    titleNormal: 'We Provide',
    titleHighlight: 'All Sports',
    description: 'Unlock peak performance trackers, schedule organizers, and live scoring sheets for soccer, cricket, tennis, basketball, and more.',
    image: require('@/assets/images/illustrations/sports_os_premium_cover.png'),
    icon: 'trophy',
    emoji: '🏅',
    features: ['Football', 'Cricket', 'Tennis'],
  },
  {
    id: 'turf_booking',
    label: 'Arena Rentals',
    titleNormal: 'Instant Turf',
    titleHighlight: 'Booking',
    description: 'Search by location, explore amenities, review pricing grids, and secure slots with our collision-safe scheduling system.',
    image: require('@/assets/images/illustrations/turf_booking_premium.png'),
    icon: 'football',
    emoji: '🌿',
    features: ['Find Turf', 'Book Slot', 'Confirm'],
  },
  {
    id: 'scoring',
    label: 'Live Scorecard',
    titleNormal: 'Live Score',
    titleHighlight: 'All Sports',
    description: 'Keep track of goals, wickets, runs, and fouls as they happen. An adaptive dashboard updates the live feed instantly.',
    image: require('@/assets/images/illustrations/score_input_premium.png'),
    icon: 'stats-chart',
    emoji: '🔴',
    features: ['Football', 'Cricket', 'Basketball'],
  },
  {
    id: 'tournaments',
    label: 'Leagues & Clubs',
    titleNormal: 'Tournaments',
    titleHighlight: '& Leagues',
    description: 'Draft active tournament schedules, recruit teams, register team squads, keep match standings updated, and crown champions.',
    image: require('@/assets/images/illustrations/tournament_bracket_premium.png'),
    icon: 'git-network',
    emoji: '🏆',
    features: ['Register', 'Brackets', 'Leaderboard'],
  },
  {
    id: 'quick_matches',
    label: 'Instant Play',
    titleNormal: 'Find &',
    titleHighlight: 'Play Now',
    description: 'Find nearby players, initiate quick matches, build teams, and jump straight onto the pitch without wait times.',
    image: require('@/assets/images/illustrations/quick_matches_premium.png'),
    icon: 'flash',
    emoji: '⚡',
    features: ['Find Players', 'Form Team', 'Kick Off'],
  },
  {
    id: 'bid_matches',
    label: 'Match Challenges',
    titleNormal: 'Bid &',
    titleHighlight: 'Challenge',
    description: 'Place custom bids, challenge rival teams in your area, select odds, and stake claims on the competitive arena leaderboards.',
    image: require('@/assets/images/illustrations/bid_matches_premium.png'),
    icon: 'pricetags',
    emoji: '🎯',
    features: ['Bid', 'Challenge', 'Leaderboard'],
  },
  {
    id: 'coaching',
    label: 'Coach Academies',
    titleNormal: 'Expert',
    titleHighlight: 'Coaching',
    description: 'Coaches register course batches, and students enroll in structured programs to level up tactical execution and athletic skill.',
    image: require('@/assets/images/illustrations/coaching_class_premium.png'),
    icon: 'school',
    emoji: '🎓',
    features: ['Find Coach', 'Enroll', 'Level Up'],
  },
];

// ── Slide ─────────────────────────────────────────────────────────────────────
function SlideItem({
  item,
  index,
  scrollX,
  width,
  illustrationHeight,
}: {
  item: OnboardingSlide;
  index: number;
  scrollX: Animated.Value;
  width: number;
  illustrationHeight: number;
}) {
  const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

  // Parallax as the carousel moves: the art settles in, the copy slides up.
  const imageScale = scrollX.interpolate({ inputRange, outputRange: [0.9, 1, 0.9], extrapolate: 'clamp' });
  const imageOpacity = scrollX.interpolate({ inputRange, outputRange: [0.4, 1, 0.4], extrapolate: 'clamp' });
  const textTranslate = scrollX.interpolate({ inputRange, outputRange: [40, 0, -40], extrapolate: 'clamp' });
  const textOpacity = scrollX.interpolate({ inputRange, outputRange: [0, 1, 0], extrapolate: 'clamp' });

  return (
    <View style={[styles.slide, { width }]}>
      {/* Illustration, outlined in the logo's navy line */}
      <Animated.View
        style={[
          styles.illustrationCard,
          { height: illustrationHeight },
          Shadows.level2,
          { transform: [{ scale: imageScale }], opacity: imageOpacity },
        ]}
      >
        <Image source={item.image} style={styles.illustration} contentFit="cover" />
        <View style={styles.slideCounter}>
          <ThemedText style={styles.slideCounterText}>
            {item.emoji} {index + 1}/{onboardingSlides.length}
          </ThemedText>
        </View>
      </Animated.View>

      {/* Headline card */}
      <Animated.View
        style={[styles.textCard, Shadows.level1, { opacity: textOpacity, transform: [{ translateY: textTranslate }] }]}
      >
        <View style={styles.textCardHeader}>
          <View style={styles.iconTile}>
            <Ionicons name={item.icon} size={17} color={BRAND.ink} />
          </View>
          <View style={styles.textCardHeading}>
            <ThemedText style={styles.cardLabel} numberOfLines={1}>{item.label}</ThemedText>
            <ThemedText style={styles.cardFeatures} numberOfLines={1}>{item.features.join(' · ')}</ThemedText>
          </View>
        </View>
        <ThemedText style={styles.headline}>
          {item.titleNormal}{' '}
          <ThemedText style={[styles.headline, styles.headlineMark]}> {item.titleHighlight} </ThemedText>
        </ThemedText>
        <ThemedText style={styles.description} numberOfLines={3}>
          {item.description}
        </ThemedText>
      </Animated.View>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function LandingScreen() {
  const router = useRouter();
  // Measured live, so paging stays aligned when the window size changes (web, rotation).
  const { width, height } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<OnboardingSlide>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  /** Autoplay stops for good once the person touches the carousel or a button. */
  const [autoplay, setAutoplay] = useState(true);

  const isLast = activeIndex === onboardingSlides.length - 1;
  // Sized from the screen height too, so short phones keep the buttons in view.
  const logoWidth = Math.min(width * 0.42, height * 0.19, 190);
  const illustrationHeight = Math.round(height * 0.26);

  /**
   * Moves to a slide by offset. `scrollToIndex` needs every slide measured
   * first, and on web it fell back to offset 0 — Continue jumped back to the
   * first slide instead of forward.
   */
  const goTo = useCallback(
    (index: number) => {
      const next = Math.max(0, Math.min(onboardingSlides.length - 1, index));
      flatListRef.current?.scrollToOffset({ offset: next * width, animated: true });
      setActiveIndex(next);
    },
    [width]
  );

  useEffect(() => {
    if (!autoplay || isLast) return;
    const timer = setTimeout(() => goTo(activeIndex + 1), AUTOPLAY_MS);
    return () => clearTimeout(timer);
  }, [autoplay, isLast, activeIndex, goTo]);

  const stopAutoplay = () => setAutoplay(false);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width <= 0) return;
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    const clamped = Math.max(0, Math.min(onboardingSlides.length - 1, index));
    if (clamped !== activeIndex) setActiveIndex(clamped);
  };

  const handleNext = () => {
    stopAutoplay();
    if (!isLast) goTo(activeIndex + 1);
    else router.push('/login');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Brand */}
        <View style={styles.brandBar}>
          <View style={styles.brandSide} />
          <AnimatedBrandLogo style={{ width: logoWidth }} />
          <View style={[styles.brandSide, styles.brandSideRight]}>
            {!isLast && (
              <Pressable
                onPress={() => {
                  stopAutoplay();
                  router.push('/login');
                }}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Skip to sign in"
                style={styles.skipBtn}
              >
                <ThemedText style={styles.skipText}>Skip</ThemedText>
              </Pressable>
            )}
          </View>
        </View>

        {/* Carousel */}
        <FlatList
          ref={flatListRef}
          data={onboardingSlides}
          renderItem={({ item, index }) => (
            <SlideItem
              item={item}
              index={index}
              scrollX={scrollX}
              width={width}
              illustrationHeight={illustrationHeight}
            />
          )}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
            useNativeDriver: false,
            listener: handleScroll,
          })}
          onTouchStart={stopAutoplay}
          onScrollBeginDrag={stopAutoplay}
          scrollEventThrottle={16}
          keyExtractor={(item) => item.id}
          extraData={`${width}x${height}`}
          style={styles.flatList}
        />

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.dotsRow}>
            {onboardingSlides.map((slide, i) => {
              const isActive = i === activeIndex;
              return (
                <Pressable
                  key={slide.id}
                  onPress={() => {
                    stopAutoplay();
                    goTo(i);
                  }}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel={`Go to ${slide.label}`}
                  accessibilityState={{ selected: isActive }}
                >
                  <View style={[styles.dot, isActive && styles.dotActive]} />
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={handleNext}
            accessibilityRole="button"
            accessibilityLabel={isLast ? 'Get started' : 'Continue'}
            style={({ pressed }) => [styles.primaryButton, Shadows.level2, pressed && { opacity: 0.9 }]}
          >
            <ThemedText style={styles.primaryButtonText}>{isLast ? 'Get Started' : 'Continue'}</ThemedText>
            <Ionicons name="arrow-forward" size={15} color={BRAND.yellow} />
          </Pressable>

          <View style={styles.secondaryRow}>
            <Pressable
              onPress={() => {
                stopAutoplay();
                router.push('/login');
              }}
              accessibilityRole="button"
              accessibilityLabel="Sign in"
              style={({ pressed }) => [styles.secondaryButton, pressed && { opacity: 0.85 }]}
            >
              <Ionicons name="log-in-outline" size={15} color={BRAND.ink} />
              <ThemedText style={styles.secondaryButtonText}>Sign In</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => {
                stopAutoplay();
                router.push('/signup');
              }}
              accessibilityRole="button"
              accessibilityLabel="Register a new account"
              style={({ pressed }) => [styles.secondaryButton, pressed && { opacity: 0.85 }]}
            >
              <Ionicons name="person-add-outline" size={15} color={BRAND.ink} />
              <ThemedText style={styles.secondaryButtonText}>Register</ThemedText>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.yellow },
  safeArea: { flex: 1 },

  // Brand
  brandBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 6,
  },
  brandSide: { width: 64 },
  brandSideRight: { alignItems: 'flex-end' },
  skipBtn: {
    paddingHorizontal: 14,
    height: 30,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.fieldSoft,
    justifyContent: 'center',
  },
  skipText: { fontSize: 11.5, fontFamily: 'Sora_500Medium', color: BRAND.ink },

  // Carousel
  flatList: { flex: 1 },
  slide: { flex: 1, paddingHorizontal: 16, gap: 12 },

  // Illustration
  illustrationCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: BRAND.ink,
    backgroundColor: BRAND.field,
    overflow: 'hidden',
  },
  illustration: { width: '100%', height: '100%' },
  slideCounter: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: BRAND.ink,
  },
  slideCounterText: { fontSize: 9.5, fontFamily: 'Sora_500Medium', color: BRAND.yellow },

  // Headline card
  textCard: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: BRAND.ink,
    backgroundColor: BRAND.field,
    padding: 16,
    gap: 10,
  },
  textCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  textCardHeading: { flex: 1, minWidth: 0 },
  iconTile: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: BRAND.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: { fontSize: 13, fontFamily: 'Sora_500Medium', color: BRAND.ink },
  cardFeatures: { fontSize: 11, fontFamily: 'Sora_400Regular', color: BRAND.inkSoft, marginTop: 1 },
  headline: { fontSize: 16, lineHeight: 27, fontFamily: 'Sora_500Medium', color: BRAND.ink, letterSpacing: -0.2 },
  headlineMark: { backgroundColor: 'rgba(253, 211, 5, 0.6)' },
  description: { fontSize: 11.5, lineHeight: 17, fontFamily: 'Sora_400Regular', color: BRAND.inkSoft },

  // Footer
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'web' ? 20 : 12,
    gap: 10,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(28, 41, 57, 0.25)' },
  dotActive: { width: 22, backgroundColor: BRAND.ink },

  // Buttons
  primaryButton: {
    flexDirection: 'row',
    gap: 8,
    height: 48,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BRAND.ink,
  },
  primaryButtonText: { color: BRAND.yellow, fontSize: 13.5, fontFamily: 'Sora_500Medium' },
  secondaryRow: { flexDirection: 'row', gap: 10 },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    height: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.field,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: { fontSize: 12.5, fontFamily: 'Sora_500Medium', color: BRAND.ink },
});
