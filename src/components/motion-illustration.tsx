import React, { useEffect, useState } from 'react';
import { StyleSheet, View, AccessibilityInfo, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';

type Scenario =
  | 'matches'
  | 'tournaments'
  | 'booking'
  | 'coaching'
  | 'home'
  | 'wallet'
  | 'network';

type AccentIcon = { name: keyof typeof Ionicons.glyphMap; color: string };

// Each screen gets artwork + accent motes that match what the screen is about,
// so the hero reads as "this is the matches screen" before any text is read.
const SCENARIOS: Record<
  Scenario,
  { source: any; glow: [string, string]; accents: AccentIcon[] }
> = {
  matches: {
    source: require('@/assets/images/illustrations/matches_hero.png'),
    glow: ['rgba(93, 104, 232, 0.20)', 'rgba(93, 104, 232, 0)'],
    accents: [
      { name: 'flash', color: '#F59E0B' },
      { name: 'football', color: '#5D68E8' },
      { name: 'timer', color: '#10B981' },
    ],
  },
  tournaments: {
    source: require('@/assets/images/illustrations/tournament_hero.png'),
    glow: ['rgba(245, 158, 11, 0.22)', 'rgba(245, 158, 11, 0)'],
    accents: [
      { name: 'trophy', color: '#F59E0B' },
      { name: 'ribbon', color: '#8B5CF6' },
      { name: 'sparkles', color: '#FFA751' },
    ],
  },
  booking: {
    source: require('@/assets/images/illustrations/booking_hero.png'),
    glow: ['rgba(16, 185, 129, 0.20)', 'rgba(16, 185, 129, 0)'],
    accents: [
      { name: 'calendar', color: '#10B981' },
      { name: 'location', color: '#EF4444' },
      { name: 'time', color: '#5D68E8' },
    ],
  },
  coaching: {
    source: require('@/assets/images/illustrations/coaching_class_premium.png'),
    glow: ['rgba(139, 92, 246, 0.20)', 'rgba(139, 92, 246, 0)'],
    accents: [
      { name: 'school', color: '#8B5CF6' },
      { name: 'megaphone', color: '#F59E0B' },
      { name: 'people', color: '#5D68E8' },
    ],
  },
  home: {
    source: require('@/assets/images/illustrations/home_dashboard_hero.png'),
    glow: ['rgba(93, 104, 232, 0.18)', 'rgba(93, 104, 232, 0)'],
    accents: [
      { name: 'trending-up', color: '#10B981' },
      { name: 'flame', color: '#F59E0B' },
      { name: 'star', color: '#5D68E8' },
    ],
  },
  wallet: {
    source: require('@/assets/images/illustrations/wallet_blue.png'),
    glow: ['rgba(16, 185, 129, 0.20)', 'rgba(16, 185, 129, 0)'],
    accents: [
      { name: 'cash', color: '#10B981' },
      { name: 'gift', color: '#EC4899' },
      { name: 'pricetag', color: '#F59E0B' },
    ],
  },
  network: {
    source: require('@/assets/images/illustrations/connect_network.png'),
    glow: ['rgba(139, 92, 246, 0.20)', 'rgba(139, 92, 246, 0)'],
    accents: [
      { name: 'people', color: '#8B5CF6' },
      { name: 'chatbubbles', color: '#5D68E8' },
      { name: 'sparkles', color: '#FFA751' },
    ],
  },
};

// Where each accent mote sits, as a fraction of the illustration box.
const ACCENT_SLOTS = [
  { x: 0.04, y: 0.16, size: 15 },
  { x: 0.82, y: 0.06, size: 13 },
  { x: 0.86, y: 0.66, size: 14 },
];

function AccentMote({
  icon,
  slot,
  index,
  box,
  animate,
}: {
  icon: AccentIcon;
  slot: (typeof ACCENT_SLOTS)[number];
  index: number;
  box: number;
  animate: boolean;
}) {
  const drift = useSharedValue(0);

  useEffect(() => {
    if (!animate) return;
    drift.value = withDelay(
      index * 260,
      withRepeat(
        withSequence(
          withTiming(-1, { duration: 1700 + index * 180, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 1700 + index * 180, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );
  }, [animate]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: drift.value * 5 }],
    opacity: 0.75 + Math.abs(drift.value) * 0.25,
  }));

  const pad = slot.size * 0.42;

  return (
    <Reanimated.View
      pointerEvents="none"
      style={[
        styles.mote,
        {
          left: box * slot.x,
          top: box * slot.y,
          padding: pad,
          borderRadius: (slot.size + pad * 2) / 2,
          backgroundColor: '#ffffff',
        },
        style,
      ]}
    >
      <Ionicons name={icon.name} size={slot.size} color={icon.color} />
    </Reanimated.View>
  );
}

export function MotionIllustration({
  scenario,
  size = 104,
  accessibilityLabel,
  glow,
  accents,
}: {
  scenario: Scenario;
  size?: number;
  accessibilityLabel?: string;
  /** Override the halo gradient — lets a themed screen tint the artwork. */
  glow?: [string, string];
  /** Override the floating accent motes. */
  accents?: AccentIcon[];
}) {
  const base = SCENARIOS[scenario];
  const config = {
    ...base,
    ...(glow ? { glow } : null),
    ...(accents ? { accents } : null),
  };
  const [animate, setAnimate] = useState(true);

  // Ambient looping motion is exactly what "reduce motion" is meant to silence.
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduced) => {
        if (alive && reduced) setAnimate(false);
      })
      .catch(() => {});

    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (reduced) => {
      setAnimate(!reduced);
    });
    return () => {
      alive = false;
      sub?.remove?.();
    };
  }, []);

  const float = useSharedValue(0);
  const breathe = useSharedValue(0);
  const halo = useSharedValue(0);

  useEffect(() => {
    if (!animate) return;

    float.value = withRepeat(
      withSequence(
        withTiming(-1, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    breathe.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 2800, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );

    halo.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, [animate]);

  const artStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: float.value * 4.5 },
      { scale: 1 + breathe.value * 0.028 },
    ],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.45 + halo.value * 0.4,
    transform: [{ scale: 0.92 + halo.value * 0.12 }],
  }));

  return (
    <View
      style={[styles.wrap, { width: size, height: size }]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? `${scenario} illustration`}
    >
      <Reanimated.View style={[styles.halo, { borderRadius: size / 2 }, haloStyle]}>
        <LinearGradient
          colors={config.glow}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0.1 }}
          end={{ x: 0.5, y: 1 }}
        />
      </Reanimated.View>

      <Reanimated.View style={[styles.art, artStyle]}>
        <Image source={config.source} style={styles.image} contentFit="contain" transition={250} />
      </Reanimated.View>

      {config.accents.map((icon, i) => (
        <AccentMote
          key={icon.name}
          icon={icon}
          slot={ACCENT_SLOTS[i]}
          index={i}
          box={size}
          animate={animate}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    top: '8%',
    left: '8%',
    right: '8%',
    bottom: '8%',
    overflow: 'hidden',
  },
  art: {
    width: '86%',
    height: '86%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  mote: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0 2px 6px rgba(15, 23, 42, 0.16)' },
      default: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.16,
        shadowRadius: 5,
        elevation: 3,
      },
    }),
  },
});
