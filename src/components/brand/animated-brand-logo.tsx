/**
 * animated-brand-logo.tsx
 *
 * The Buk Ur Play monkey in motion: it winds up and swings, the ball flies off
 * on the hit with a sparkle, then the ball comes back for the next swing. The
 * wordmark stays still so the name always reads.
 *
 * The artwork is three stacked layers cut from the logo on one canvas (see
 * BRAND_LOGO_LAYERS), so at rest it is pixel-identical to the flat logo. Motion
 * runs on the UI thread and is skipped when the OS asks to reduce motion.
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  Extrapolation,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { BRAND, BRAND_LOGO_ASPECT, BRAND_LOGO_LAYERS } from '@/constants/brand';

/** One wind-up, swing, ball flight and return. */
const CYCLE_MS = 2600;

/** Centre of the ball on the canvas, as fractions of width and height. */
const BALL = { x: 0.9096, y: 0.3966 };

/** The moment the bat meets the ball, as a fraction of the cycle. */
const HIT = 0.26;

// ── Keyframes along one cycle (0 → 1) ─────────────────────────────────────────
// The monkey leans back to wind up, snaps through the swing, then settles.
const SWING_T = [0, 0.16, HIT, 0.4, 0.52, 1];
const SWING_DEG = [0, -8, 7, -1.5, 0, 0];
const PULSE_T = [0, HIT - 0.02, HIT + 0.02, 0.4, 1];
const PULSE_SCALE = [1, 1, 1.035, 1, 1];

// The ball leaves on the hit, spins away and fades; it is reset while hidden
// and fades back in before the next swing.
const BALL_T = [0, HIT, 0.5, 0.79, 0.8, 1];
const BALL_X = [0, 0, 0.16, 0.16, 0, 0];
const BALL_Y = [0, 0, -0.14, -0.14, 0, 0];
const BALL_SPIN_T = [0, HIT, 0.5, 0.79, 0.8, 1];
const BALL_SPIN = [0, 0, 540, 540, 720, 720];
const BALL_SCALE_T = [0, HIT, 0.5, 0.79, 0.8, 0.92, 1];
const BALL_SCALE = [1, 1, 0.5, 0.5, 0.6, 1, 1];
const BALL_OPACITY_T = [0, HIT, 0.48, 0.8, 0.92, 1];
const BALL_OPACITY = [1, 1, 0, 0, 1, 1];

// A sparkle pops at the point of impact.
const SPARK_T = [0, HIT - 0.01, HIT + 0.04, 0.42, 1];
const SPARK_OPACITY = [0, 0, 1, 0, 0];
const SPARK_SCALE = [0.4, 0.4, 1.2, 0.8, 0.8];
const SPARK_SPIN = [0, 0, 0, 25, 25];

const CLAMP = Extrapolation.CLAMP;

export function AnimatedBrandLogo({
  style,
  entrance = true,
  accessibilityLabel = 'Buk Ur Play',
}: {
  /** Size it with a width (or maxWidth); the height follows the logo's aspect ratio. */
  style?: StyleProp<ViewStyle>;
  /** Spring the logo in on mount. Off where the screen already animates its header. */
  entrance?: boolean;
  accessibilityLabel?: string;
}) {
  const reduceMotion = useReducedMotion();
  const cycle = useSharedValue(0);
  const width = useSharedValue(0);
  const enter = useSharedValue(entrance && !reduceMotion ? 0 : 1);
  const [boxWidth, setBoxWidth] = useState(0);

  useEffect(() => {
    if (reduceMotion) {
      enter.value = 1;
      return;
    }
    if (entrance) enter.value = withSpring(1, { damping: 12, stiffness: 120 });
    cycle.value = 0;
    cycle.value = withRepeat(withTiming(1, { duration: CYCLE_MS, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(cycle);
  }, [reduceMotion, entrance, cycle, enter]);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    width.value = w;
    if (Math.abs(w - boxWidth) > 0.5) setBoxWidth(w);
  };

  const containerStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ scale: interpolate(enter.value, [0, 1], [0.8, 1]) }],
  }));

  const monkeyStyle = useAnimatedStyle(() => {
    const t = cycle.value;
    const h = width.value / BRAND_LOGO_ASPECT;
    return {
      transform: [
        { translateY: Math.sin(t * Math.PI * 2) * h * 0.012 },
        { rotate: `${interpolate(t, SWING_T, SWING_DEG, CLAMP)}deg` },
        { scale: interpolate(t, PULSE_T, PULSE_SCALE, CLAMP) },
      ],
    };
  });

  const ballStyle = useAnimatedStyle(() => {
    const t = cycle.value;
    const h = width.value / BRAND_LOGO_ASPECT;
    return {
      opacity: interpolate(t, BALL_OPACITY_T, BALL_OPACITY, CLAMP),
      transform: [
        { translateX: interpolate(t, BALL_T, BALL_X, CLAMP) * width.value },
        { translateY: interpolate(t, BALL_T, BALL_Y, CLAMP) * h },
        { rotate: `${interpolate(t, BALL_SPIN_T, BALL_SPIN, CLAMP)}deg` },
        { scale: interpolate(t, BALL_SCALE_T, BALL_SCALE, CLAMP) },
      ],
    };
  });

  const sparkleStyle = useAnimatedStyle(() => {
    const t = cycle.value;
    return {
      opacity: interpolate(t, SPARK_T, SPARK_OPACITY, CLAMP),
      transform: [
        { scale: interpolate(t, SPARK_T, SPARK_SCALE, CLAMP) },
        { rotate: `${interpolate(t, SPARK_T, SPARK_SPIN, CLAMP)}deg` },
      ],
    };
  });

  return (
    <Animated.View
      onLayout={onLayout}
      style={[styles.box, style, containerStyle]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View style={[StyleSheet.absoluteFill, styles.monkeyPivot, monkeyStyle]}>
        <Image source={BRAND_LOGO_LAYERS.monkey} style={styles.layer} contentFit="contain" />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, styles.ballPivot, ballStyle]}>
        <Image source={BRAND_LOGO_LAYERS.ball} style={styles.layer} contentFit="contain" />
      </Animated.View>
      <Image source={BRAND_LOGO_LAYERS.wordmark} style={[StyleSheet.absoluteFill, styles.layer]} contentFit="contain" />
      {boxWidth > 0 && !reduceMotion && (
        <Animated.View style={[styles.sparkle, sparkleStyle]}>
          <Ionicons name="sparkles" size={Math.max(12, Math.round(boxWidth * 0.075))} color={BRAND.ink} />
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: { aspectRatio: BRAND_LOGO_ASPECT },
  layer: { width: '100%', height: '100%' },
  // The monkey leans around its middle, just behind the hands.
  monkeyPivot: { transformOrigin: '48% 58%' },
  ballPivot: { transformOrigin: `${BALL.x * 100}% ${BALL.y * 100}%` },
  sparkle: { position: 'absolute', left: '80%', top: '24%', pointerEvents: 'none' },
});
