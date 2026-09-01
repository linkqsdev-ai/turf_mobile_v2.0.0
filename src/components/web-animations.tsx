/**
 * web-animations.tsx
 * Platform-safe Framer Motion wrappers.
 * - On web: full Framer Motion motion.div / AnimatePresence
 * - On native (iOS/Android): plain passthrough View — no crash, no bundle cost
 */
import React from 'react';
import { Platform, View, Pressable, ViewStyle } from 'react-native';

type AnimationProps = {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[] | any;
  delay?: number;
  duration?: number;
  hoverScale?: number;
  tapScale?: number;
  index?: number;
};

// ─── Web Motion Components (lazy-loaded) ────────────────────────────────────
let MotionDiv: any = null;
let MotionButton: any = null;
let AnimatePresenceComp: any = null;

if (Platform.OS === 'web') {
  try {
    const fm = require('framer-motion');
    MotionDiv = fm.motion.div;
    MotionButton = fm.motion.button;
    AnimatePresenceComp = fm.AnimatePresence;
  } catch (e) { }
}

// ─── FadeUpView ──────────────────────────────────────────────────────────────
export const FadeUpView: React.FC<AnimationProps> = ({
  children, style, delay = 0, duration = 0.45, index = 0,
}) => {
  if (Platform.OS !== 'web' || !MotionDiv) return <View style={style}>{children}</View>;
  return (
    <MotionDiv
      style={style}
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay: delay + index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </MotionDiv>
  );
};

// ─── FadeInView ──────────────────────────────────────────────────────────────
export const FadeInView: React.FC<AnimationProps> = ({
  children, style, delay = 0, duration = 0.4, index = 0,
}) => {
  if (Platform.OS !== 'web' || !MotionDiv) return <View style={style}>{children}</View>;
  return (
    <MotionDiv
      style={style}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration, delay: delay + index * 0.06, ease: 'easeOut' }}
    >
      {children}
    </MotionDiv>
  );
};

// ─── SlideInView ─────────────────────────────────────────────────────────────
export const SlideInView: React.FC<AnimationProps & { from?: 'left' | 'right' }> = ({
  children, style, delay = 0, duration = 0.4, from = 'left', index = 0,
}) => {
  if (Platform.OS !== 'web' || !MotionDiv) return <View style={style}>{children}</View>;
  return (
    <MotionDiv
      style={style}
      initial={{ opacity: 0, x: from === 'left' ? -40 : 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration, delay: delay + index * 0.07, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </MotionDiv>
  );
};

// ─── HoverCard ───────────────────────────────────────────────────────────────
export const HoverCard: React.FC<AnimationProps & { onPress?: () => void }> = ({
  children, style, hoverScale = 1.02, tapScale = 0.97, onPress, delay = 0, index = 0,
}) => {
  if (Platform.OS !== 'web' || !MotionDiv) {
    return onPress
      ? <Pressable style={style} onPress={onPress}>{children}</Pressable>
      : <View style={style}>{children}</View>;
  }
  const Comp = onPress ? MotionButton : MotionDiv;
  return (
    <Comp
      style={{ ...((style as any) || {}), cursor: onPress ? 'pointer' : 'default', border: 'none', background: 'none', padding: 0, textAlign: 'left', display: 'block', width: '100%' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: hoverScale, y: -3 }}
      whileTap={{ scale: tapScale }}
      transition={{ duration: 0.35, delay: delay + index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
      onClick={onPress}
    >
      {children}
    </Comp>
  );
};

// ─── WebAnimatePresence ──────────────────────────────────────────────────────
export const WebAnimatePresence: React.FC<{ children: React.ReactNode; mode?: 'wait' | 'sync' | 'popLayout' }> = ({
  children, mode = 'wait',
}) => {
  if (Platform.OS !== 'web' || !AnimatePresenceComp) return <>{children}</>;
  return <AnimatePresenceComp mode={mode}>{children}</AnimatePresenceComp>;
};

// ─── ScalePressable ──────────────────────────────────────────────────────────
export const ScalePressable: React.FC<AnimationProps & { onPress?: () => void; disabled?: boolean }> = ({
  children, style, onPress, disabled, hoverScale = 1.04, tapScale = 0.95,
}) => {
  if (Platform.OS !== 'web' || !MotionButton) {
    return <Pressable style={style} onPress={onPress} disabled={disabled}>{children}</Pressable>;
  }
  return (
    <MotionButton
      style={{ ...((style as any) || {}), cursor: disabled ? 'not-allowed' : 'pointer', border: 'none', background: 'none', padding: 0, display: 'block', width: '100%' }}
      whileHover={!disabled ? { scale: hoverScale } : undefined}
      whileTap={!disabled ? { scale: tapScale } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      onClick={!disabled ? onPress : undefined}
    >
      {children}
    </MotionButton>
  );
};
