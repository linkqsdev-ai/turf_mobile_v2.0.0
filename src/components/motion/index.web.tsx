/**
 * motion/index.web.tsx — WEB implementation.
 * Framer Motion for component transitions + GSAP for richer hero/scroll reveals.
 * API-compatible with the native `index.tsx` (Moti/Reanimated).
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { motion, AnimatePresence as FMAnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import type {
  AnimatedCounterProps,
  MotionPressableProps,
  MotionPreset,
  MotionViewProps,
  StaggerProps,
} from './types';

const EASE = [0.22, 1, 0.36, 1] as const;

const MView = motion.create(View);
const MPressable = motion.create(Pressable);

function variants(preset: MotionPreset, distance: number) {
  const map: Record<MotionPreset, { hidden: any; visible: any }> = {
    fade: { hidden: { opacity: 0 }, visible: { opacity: 1 } },
    'fade-up': { hidden: { opacity: 0, y: distance }, visible: { opacity: 1, y: 0 } },
    'fade-down': { hidden: { opacity: 0, y: -distance }, visible: { opacity: 1, y: 0 } },
    'scale-in': { hidden: { opacity: 0, scale: 0.94 }, visible: { opacity: 1, scale: 1 } },
    'slide-left': { hidden: { opacity: 0, x: distance }, visible: { opacity: 1, x: 0 } },
    'slide-right': { hidden: { opacity: 0, x: -distance }, visible: { opacity: 1, x: 0 } },
  };
  return map[preset];
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
  const v = useMemo(() => variants(preset, distance), [preset, distance]);
  const flatStyle = useMemo(() => StyleSheet.flatten(style) || {}, [style]);
  return (
    <MView
      key={animateKey}
      initial="hidden"
      animate="visible"
      variants={v}
      transition={{ duration, delay, ease: EASE }}
      className={className}
      style={flatStyle as any}
      pointerEvents={pointerEvents}
    >
      {children}
    </MView>
  );
}

export function MotionPressable({
  children,
  onPress,
  disabled,
  className,
  style,
  pressScale = 0.96,
  hoverScale = 1.02,
  accessibilityLabel,
  accessibilityRole = 'button',
}: MotionPressableProps) {
  const resolvedStyle = useMemo(() => {
    const flattened = StyleSheet.flatten(
      typeof style === 'function' ? (style as any)({ pressed: false }) : style
    ) || {};
    return {
      ...flattened,
      cursor: disabled ? 'not-allowed' : 'pointer',
    };
  }, [style, disabled]);

  return (
    <MPressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      whileHover={disabled ? undefined : { scale: hoverScale }}
      whileTap={disabled ? undefined : { scale: pressScale }}
      transition={{ type: 'spring', stiffness: 420, damping: 26 }}
      className={className}
      style={resolvedStyle as any}
    >
      {children}
    </MPressable>
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
  const v = variants(preset, 14);
  const flatStyle = useMemo(() => StyleSheet.flatten(style) || {}, [style]);
  return (
    <MView
      className={className}
      style={flatStyle as any}
      initial="hidden"
      animate="visible"
      transition={{ staggerChildren: interval, delayChildren: delay }}
    >
      {items.map((child, i) => (
        <motion.div key={i} variants={v} transition={{ duration: 0.45, ease: EASE }}>
          {child}
        </motion.div>
      ))}
    </MView>
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
  const prev = useRef(0);

  useEffect(() => {
    const start = prev.current;
    const delta = value - start;
    const startedAt = Date.now();
    const id = setInterval(() => {
      const t = Math.min(1, (Date.now() - startedAt) / (duration * 1000));
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(start + delta * eased);
      if (t >= 1) {
        prev.current = value;
        clearInterval(id);
      }
    }, 16);
    return () => clearInterval(id);
  }, [value, duration]);

  return (
    <Text className={className}>
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </Text>
  );
}

export function FloodlightPulse({
  size = 12,
  color = 'rgb(var(--floodlight))',
  className,
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <View
      className={className}
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      <motion.span
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size,
          backgroundColor: color,
          display: 'block',
        }}
        animate={{ scale: [0.9, 1.9], opacity: [0.7, 0] }}
        transition={{ duration: 1.8, ease: EASE, repeat: Infinity }}
      />
      <View
        style={{ width: size * 0.6, height: size * 0.6, borderRadius: size, backgroundColor: color }}
      />
    </View>
  );
}

/**
 * GSAP entrance timeline. Attach `ref` to a container; its direct element
 * children fly up and fade in with a stagger on mount. Respects reduced motion.
 */
export function useGsapReveal<T = any>(opts?: { y?: number; stagger?: number; delay?: number }) {
  const ref = useRef<T>(null);
  const { y = 24, stagger = 0.08, delay = 0.05 } = opts ?? {};

  useEffect(() => {
    const node: any = ref.current;
    if (!node || typeof window === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const targets = node.children;
    if (!targets || !targets.length) return;
    const ctx = gsap.context(() => {
      gsap.from(targets, {
        y,
        autoAlpha: 0,
        duration: 0.7,
        ease: 'power3.out',
        stagger,
        delay,
      });
    }, node);
    return () => ctx.revert();
  }, [y, stagger, delay]);

  return { ref };
}

export const AnimatePresence = FMAnimatePresence;
export const Motion = { View: MotionView, Pressable: MotionPressable };
