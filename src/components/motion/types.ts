import type { ReactNode } from 'react';
import type { ViewStyle } from 'react-native';

export type MotionPreset =
  | 'fade'
  | 'fade-up'
  | 'fade-down'
  | 'scale-in'
  | 'slide-left'
  | 'slide-right';

export interface MotionViewProps {
  children?: ReactNode;
  /** Entrance animation. Defaults to `fade-up`. */
  preset?: MotionPreset;
  /** Seconds before the animation starts. */
  delay?: number;
  /** Seconds the animation runs. Defaults to ~0.45s. */
  duration?: number;
  /** Travel distance in px for slide/fade-directional presets. */
  distance?: number;
  className?: string;
  style?: ViewStyle | ViewStyle[];
  /** Replay the entrance whenever this key changes. */
  animateKey?: string | number;
  pointerEvents?: 'auto' | 'none' | 'box-none' | 'box-only';
}

export interface MotionPressableProps {
  children?: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  className?: string;
  style?: ViewStyle | ViewStyle[];
  /** Scale applied while pressed. Defaults to 0.96. */
  pressScale?: number;
  /** Scale applied on hover (web only). Defaults to 1.02. */
  hoverScale?: number;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'link';
  hitSlop?: number;
}

export interface StaggerProps {
  children: ReactNode;
  /** Seconds between each child's entrance. Defaults to 0.06s. */
  interval?: number;
  /** Seconds before the first child animates. */
  delay?: number;
  preset?: MotionPreset;
  className?: string;
  style?: ViewStyle | ViewStyle[];
}

export interface AnimatedCounterProps {
  value: number;
  /** Seconds for the count-up. Defaults to 0.9s. */
  duration?: number;
  /** Fixed decimal places. */
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}
