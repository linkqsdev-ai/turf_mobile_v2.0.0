/**
 * motion/index.tsx — NATIVE (iOS / Android) implementation.
 * Built on Moti + Reanimated. The web build swaps in `index.web.tsx`
 * (Framer Motion + GSAP). Keep the two files API-compatible.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { MotiView } from 'moti';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type {
  AnimatedCounterProps,
  MotionPressableProps,
  MotionPreset,
  MotionViewProps,
  StaggerProps,
} from './types';

const EASE = Easing.bezier(0.22, 1, 0.36, 1);

function fromState(preset: MotionPreset, distance: number) {
  switch (preset) {
    case 'fade':
      return { opacity: 0 };
    case 'fade-down':
      return { opacity: 0, translateY: -distance };
    case 'scale-in':
      return { opacity: 0, scale: 0.94 };
    case 'slide-left':
      return { opacity: 0, translateX: distance };
    case 'slide-right':
      return { opacity: 0, translateX: -distance };
    case 'fade-up':
    default:
      return { opacity: 0, translateY: distance };
  }
}

export function MotionView({
  children,
  preset = 'fade-up',
  delay = 0,
  duration = 0.45,
  distance = 14,
  className,
  style,
  animateKey,
  pointerEvents,
}: MotionViewProps) {
  const from = useMemo(() => fromState(preset, distance), [preset, distance]);
  return (
    <MotiView
      key={animateKey}
      from={from}
      animate={{ opacity: 1, translateY: 0, translateX: 0, scale: 1 }}
      transition={{
        type: 'timing',
        duration: duration * 1000,
        delay: delay * 1000,
        easing: EASE,
      }}
      className={className}
      style={style}
      pointerEvents={pointerEvents}
    >
      {children}
    </MotiView>
  );
}

export function MotionPressable({
  children,
  onPress,
  disabled,
  className,
  style,
  pressScale = 0.96,
  accessibilityLabel,
  accessibilityRole = 'button',
  hitSlop = 6,
}: MotionPressableProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      hitSlop={hitSlop}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      onPressIn={() => {
        scale.value = withTiming(pressScale, { duration: 90, easing: EASE });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 160, easing: EASE });
      }}
    >
      <Animated.View className={className} style={[animatedStyle, style]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

export function Stagger({
  children,
  interval = 0.06,
  delay = 0,
  preset = 'fade-up',
  className,
  style,
}: StaggerProps) {
  const items = React.Children.toArray(children);
  return (
    <View className={className} style={style}>
      {items.map((child, i) => (
        <MotionView key={i} preset={preset} delay={delay + i * interval}>
          {child}
        </MotionView>
      ))}
    </View>
  );
}

export function AnimatedCounter({
  value,
  duration = 0.9,
  decimals = 0,
  prefix = '',
  suffix = '',
  className,
}: AnimatedCounterProps) {
  const [display, setDisplay] = useState(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    const start = display;
    const delta = value - start;
    progress.value = 0;
    progress.value = withTiming(1, { duration: duration * 1000, easing: EASE });
    const startedAt = Date.now();
    const id = setInterval(() => {
      const t = Math.min(1, (Date.now() - startedAt) / (duration * 1000));
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(start + delta * eased);
      if (t >= 1) clearInterval(id);
    }, 32);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <Text className={className}>
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </Text>
  );
}

/** A glowing pulse ring — used behind live-match dots and the tab "book" FAB. */
export function FloodlightPulse({
  size = 12,
  color = 'rgb(var(--floodlight))',
  className,
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0.7);

  useEffect(() => {
    const loop = () => {
      scale.value = withTiming(1.9, { duration: 1800, easing: EASE });
      opacity.value = withTiming(0, { duration: 1800, easing: EASE }, () => {
        scale.value = 0.9;
        opacity.value = 0.7;
      });
    };
    loop();
    const id = setInterval(loop, 1900);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ring = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View
      className={className}
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
          ring,
        ]}
      />
      <View
        style={{
          width: size * 0.6,
          height: size * 0.6,
          borderRadius: size,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

/** Web-only scroll reveal. No-op on native (returns a plain ref holder). */
export function useGsapReveal<T = any>(_opts?: { y?: number; stagger?: number; delay?: number }) {
  return { ref: React.useRef<T>(null) };
}

/** No-op on native — kept for API parity with the web build. */
export function AnimatePresence({ children }: { children?: React.ReactNode; mode?: string }) {
  return <>{children}</>;
}

export const Motion = { View: MotionView, Pressable: MotionPressable };
