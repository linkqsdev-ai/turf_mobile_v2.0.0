import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Dimensions,
  FlatList,
  Pressable,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { Spacing, BorderRadius } from '@/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── Cream Design Color Palette ────────────────────────────────────────────────
const CREAM_BG = '#FDF4EC';
const CREAM_CARD = '#FFFFFF';
const TEXT_DARK = '#1a1a2e';
const TEXT_MID = '#5a5a7a';

const onboardingSlides = [
  {
    id: 'sports_os',
    tag: 'MULTISPORT SUPPORT',
    titleNormal: 'We Provide',
    titleHighlight: 'All Sports',
    highlightColor: '#fbbf24',
    description: 'Unlock peak performance trackers, schedule organizers, and live scoring sheets for soccer, cricket, tennis, basketball, and more.',
    image: require('@/assets/images/illustrations/sports_os_premium_cover.png'),
    blobColor1: '#fde68a',
    blobColor2: '#bfdbfe',
    blobColor3: '#fca5a5',
    accentColor: '#f59e0b',
    features: ['Football', 'Cricket', 'Tennis'],
  },
  {
    id: 'turf_booking',
    tag: 'ARENA RENTALS',
    titleNormal: 'Instant Turf',
    titleHighlight: 'Booking',
    highlightColor: '#6ee7b7',
    description: 'Search by location, explore amenities, review pricing grids, and secure slots with our collision-safe scheduling system.',
    image: require('@/assets/images/illustrations/turf_booking_premium.png'),
    blobColor1: '#a7f3d0',
    blobColor2: '#fde68a',
    blobColor3: '#c4b5fd',
    accentColor: '#10b981',
    features: ['Find Turf', 'Book Slot', 'Confirm'],
  },
  {
    id: 'scoring',
    tag: 'LIVE SCORECARD',
    titleNormal: 'Live Score',
    titleHighlight: 'All Sports',
    highlightColor: '#fca5a5',
    description: 'Keep track of goals, wickets, runs, and fouls as they happen. An adaptive dashboard updates the live feed instantly.',
    image: require('@/assets/images/illustrations/score_input_premium.png'),
    blobColor1: '#fca5a5',
    blobColor2: '#fde68a',
    blobColor3: '#a5f3fc',
    accentColor: '#ef4444',
    features: ['Football', 'Cricket', 'Basketball'],
  },
  {
    id: 'tournaments',
    tag: 'LEAGUES & CLUBS',
    titleNormal: 'Tournaments',
    titleHighlight: '& Leagues',
    highlightColor: '#fde68a',
    description: 'Draft active tournament schedules, recruit teams, register rosters, keep match standings updated, and crown champions.',
    image: require('@/assets/images/illustrations/tournament_bracket_premium.png'),
    blobColor1: '#fde68a',
    blobColor2: '#c4b5fd',
    blobColor3: '#6ee7b7',
    accentColor: '#f59e0b',
    features: ['Register', 'Brackets', 'Leaderboard'],
  },
  {
    id: 'quick_matches',
    tag: 'INSTANT PLAY',
    titleNormal: 'Find &',
    titleHighlight: 'Play Now',
    highlightColor: '#a5f3fc',
    description: 'Find nearby players, initiate quick matches, build teams, and jump straight onto the pitch without wait times.',
    image: require('@/assets/images/illustrations/quick_matches_premium.png'),
    blobColor1: '#a5f3fc',
    blobColor2: '#fca5a5',
    blobColor3: '#fde68a',
    accentColor: '#06b6d4',
    features: ['Find Players', 'Form Team', 'Kick Off'],
  },
  {
    id: 'bid_matches',
    tag: 'MATCH CHALLENGES',
    titleNormal: 'Bid &',
    titleHighlight: 'Challenge',
    highlightColor: '#fde68a',
    description: 'Place custom bids, challenge rival teams in your area, select odds, and stake claims on the competitive arena leaderboards.',
    image: require('@/assets/images/illustrations/bid_matches_premium.png'),
    blobColor1: '#fde68a',
    blobColor2: '#fca5a5',
    blobColor3: '#c4b5fd',
    accentColor: '#eab308',
    features: ['Bid', 'Challenge', 'Leaderboard'],
  },
  {
    id: 'coaching',
    tag: 'COACH ACADEMIES',
    titleNormal: 'Expert',
    titleHighlight: 'Coaching',
    highlightColor: '#c4b5fd',
    description: 'Coaches register course batches, and students enroll in structured programs to level up tactical execution and athletic skill.',
    image: require('@/assets/images/illustrations/coaching_class_premium.png'),
    blobColor1: '#c4b5fd',
    blobColor2: '#6ee7b7',
    blobColor3: '#fde68a',
    accentColor: '#a855f7',
    features: ['Find Coach', 'Enroll', 'Level Up'],
  },
];

// ── Slide Renderer ────────────────────────────────────────────────────────────
function SlideItem({ item, index, scrollX }: { item: typeof onboardingSlides[0]; index: number; scrollX: Animated.Value }) {
  const inputRange = [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH];

  const imageScale = scrollX.interpolate({ inputRange, outputRange: [0.85, 1, 0.85], extrapolate: 'clamp' });
  const imageOpacity = scrollX.interpolate({ inputRange, outputRange: [0.5, 1, 0.5], extrapolate: 'clamp' });
  const textTranslate = scrollX.interpolate({ inputRange, outputRange: [40, 0, -40], extrapolate: 'clamp' });
  const textOpacity = scrollX.interpolate({ inputRange, outputRange: [0, 1, 0], extrapolate: 'clamp' });

  return (
    <View style={styles.slide}>
      {/* Decorative Organic Blobs */}
      <View style={[styles.blob, styles.blobTopLeft, { backgroundColor: item.blobColor1 + 'CC' }]} />
      <View style={[styles.blob, styles.blobTopRight, { backgroundColor: item.blobColor2 + 'AA' }]} />
      <View style={[styles.blob, styles.blobBottomRight, { backgroundColor: item.blobColor3 + '99' }]} />

      {/* Decorative Dots */}
      <View style={[styles.decorDot, { top: SCREEN_HEIGHT * 0.12, left: 30, backgroundColor: item.accentColor + '66', width: 8, height: 8 }]} />
      <View style={[styles.decorDot, { top: SCREEN_HEIGHT * 0.18, right: 24, backgroundColor: item.blobColor3 + '88', width: 12, height: 12 }]} />
      <View style={[styles.decorDot, { top: SCREEN_HEIGHT * 0.55, left: 20, backgroundColor: item.blobColor2 + '88', width: 6, height: 6 }]} />
      <View style={[styles.decorDot, { top: SCREEN_HEIGHT * 0.48, right: 18, backgroundColor: item.accentColor + '55', width: 10, height: 10 }]} />
      {/* Small pill/dash decorations */}
      <View style={[styles.decorPill, { top: SCREEN_HEIGHT * 0.14, right: 60, backgroundColor: TEXT_MID + '22', transform: [{ rotate: '45deg' }] }]} />
      <View style={[styles.decorPill, { top: SCREEN_HEIGHT * 0.62, left: 40, backgroundColor: item.accentColor + '33', transform: [{ rotate: '-30deg' }] }]} />

      {/* Illustration Area */}
      <Animated.View style={[styles.illustrationWrapper, { transform: [{ scale: imageScale }], opacity: imageOpacity }]}>
        <Image source={item.image} style={styles.illustration} contentFit="cover" />
      </Animated.View>

      {/* Text Content */}
      <Animated.View style={[styles.textBlock, { opacity: textOpacity, transform: [{ translateY: textTranslate }] }]}>
        {/* Tag pill */}
        <View style={[styles.tagPill, { backgroundColor: item.accentColor + '18', borderColor: item.accentColor + '33' }]}>
          <ThemedText style={[styles.tagText, { color: item.accentColor }]}>{item.tag}</ThemedText>
        </View>

        {/* Title with highlight underline effect */}
        <View style={styles.titleRow}>
          <ThemedText style={styles.titleNormal}>{item.titleNormal}{' '}</ThemedText>
          <View style={styles.titleHighlightWrap}>
            <ThemedText style={styles.titleHighlight}>{item.titleHighlight}</ThemedText>
            {/* Yellow underline bar (like reference design) */}
            <View style={[styles.highlightBar, { backgroundColor: item.highlightColor }]} />
          </View>
        </View>

        {/* Description */}
        <ThemedText style={styles.description}>{item.description}</ThemedText>

        {/* Feature Pills Row */}
        <View style={styles.featurePills}>
          {item.features.map((f, i) => (
            <View key={i} style={[styles.featurePill, { backgroundColor: item.accentColor + '15', borderColor: item.accentColor + '30' }]}>
              <ThemedText style={[styles.featurePillText, { color: item.accentColor }]}>{f}</ThemedText>
            </View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function LandingScreen() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;


  const handleScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(index);
  };

  const handleNext = () => {
    if (activeIndex < onboardingSlides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      router.push('/login');
    }
  };

  const currentSlide = onboardingSlides[activeIndex];

  return (
    <View style={[styles.container, { backgroundColor: CREAM_BG }]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>


        {/* Carousel */}
        <FlatList
          ref={flatListRef}
          data={onboardingSlides}
          renderItem={({ item, index }) => (
            <SlideItem item={item} index={index} scrollX={scrollX} />
          )}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
            useNativeDriver: false,
            listener: handleScroll,
          })}
          scrollEventThrottle={16}
          keyExtractor={(item) => item.id}
          style={styles.flatList}
        />

        {/* Footer */}
        <View style={styles.footer}>
          {/* Capsule Dot Indicators */}
          <View style={styles.dotsRow}>
            {onboardingSlides.map((slide, i) => {
              const isActive = i === activeIndex;
              return (
                <Pressable key={i} onPress={() => flatListRef.current?.scrollToIndex({ index: i, animated: true })}>
                  <Animated.View
                    style={[
                      styles.dot,
                      isActive
                        ? [styles.dotActive, { backgroundColor: currentSlide.accentColor }]
                        : { backgroundColor: TEXT_MID + '33' },
                    ]}
                  />
                </Pressable>
              );
            })}
          </View>

          {/* CTA Buttons */}
          <View style={styles.buttonGroup}>
            {/* Primary - Animated accent color */}
            <Pressable
              style={[styles.primaryButton, { backgroundColor: currentSlide.accentColor }]}
              onPress={handleNext}
            >
              <ThemedText style={styles.primaryButtonText}>
                {activeIndex === onboardingSlides.length - 1 ? 'GET STARTED →' : 'CONTINUE →'}
              </ThemedText>
            </Pressable>

            {/* Secondary row */}
            <View style={styles.secondaryRow}>
              <Pressable
                style={[styles.secondaryButton, { borderColor: TEXT_DARK + '22' }]}
                onPress={() => router.push('/login')}
              >
                <ThemedText style={[styles.secondaryButtonText, { color: TEXT_DARK }]}>SIGN IN</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.secondaryButton, { borderColor: TEXT_DARK + '22' }]}
                onPress={() => router.push('/signup')}
              >
                <ThemedText style={[styles.secondaryButtonText, { color: TEXT_DARK }]}>REGISTER</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },


  // Carousel
  flatList: {
    flex: 1,
  },

  // Slide
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    position: 'relative',
    paddingHorizontal: Spacing.containerMargin,
  },

  // Blobs
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
  blobTopLeft: {
    width: 160,
    height: 160,
    top: -40,
    left: -60,
  },
  blobTopRight: {
    width: 120,
    height: 120,
    top: -20,
    right: -40,
  },
  blobBottomRight: {
    width: 90,
    height: 90,
    bottom: 20,
    right: -30,
  },

  // Decorative dots & pills
  decorDot: {
    position: 'absolute',
    borderRadius: 999,
  },
  decorPill: {
    position: 'absolute',
    width: 20,
    height: 6,
    borderRadius: 3,
  },

  // Illustration
  illustrationWrapper: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.34,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    borderRadius: 20,
    overflow: 'hidden',
  },
  illustration: {
    width: '100%',
    height: '100%',
  },

  // Text block
  textBlock: {
    flex: 1,
    paddingTop: Spacing.xs,
  },
  tagPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  tagText: {
    fontSize: 9,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: 1.4,
  },

  // Title
  titleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    marginBottom: Spacing.sm,
  },
  titleNormal: {
    fontSize: 28,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    color: TEXT_DARK,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  titleHighlightWrap: {
    position: 'relative',
  },
  titleHighlight: {
    fontSize: 28,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    color: TEXT_DARK,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  highlightBar: {
    position: 'absolute',
    bottom: 2,
    left: 0,
    right: 0,
    height: 8,
    borderRadius: 4,
    opacity: 0.55,
    zIndex: -1,
  },

  // Description
  description: {
    fontSize: 13,
    lineHeight: 21,
    color: TEXT_MID,
    fontFamily: 'PlusJakartaSans_400Regular',
    marginBottom: Spacing.md,
  },

  // Feature pills
  featurePills: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  featurePill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  featurePillText: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    letterSpacing: 0.3,
  },

  // Footer
  footer: {
    paddingHorizontal: Spacing.containerMargin,
    paddingBottom: Platform.OS === 'web' ? Spacing.lg : Spacing.md,
    alignItems: 'center',
  },

  // Dots
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 20,
    height: 6,
    borderRadius: 3,
  },

  // Buttons
  buttonGroup: {
    width: '100%',
    gap: Spacing.sm,
  },
  primaryButton: {
    width: '100%',
    height: 50,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: 1.0,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  secondaryButton: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: CREAM_CARD,
  },
  secondaryButtonText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    letterSpacing: 0.8,
  },
});
