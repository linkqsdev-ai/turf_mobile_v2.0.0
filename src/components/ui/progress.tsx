import * as React from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { cn } from '@/lib/utils';

export interface ProgressProps {
  /** 0–1 */
  value: number;
  className?: string;
  indicatorClassName?: string;
  height?: number;
}

export function Progress({ value, className, indicatorClassName, height = 8 }: ProgressProps) {
  const clamped = Math.max(0, Math.min(1, value));
  const width = useSharedValue(0);

  React.useEffect(() => {
    width.value = withTiming(clamped, { duration: 600, easing: Easing.bezier(0.22, 1, 0.36, 1) });
  }, [clamped, width]);

  const style = useAnimatedStyle(() => ({ width: `${width.value * 100}%` }));

  return (
    <View
      className={cn('w-full overflow-hidden rounded-full bg-muted', className)}
      style={{ height }}
    >
      <Animated.View
        className={cn('h-full rounded-full bg-primary', indicatorClassName)}
        style={style}
      />
    </View>
  );
}

/** Circular ring — used on the profile "match fitness" and tournament fill. */
export function ProgressRing({
  value,
  size = 64,
  stroke = 6,
  className,
  trackClassName = 'text-muted',
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  className?: string;
  trackClassName?: string;
  children?: React.ReactNode;
}) {
  // Lightweight ring without SVG: rotated border halves.
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View
      className={cn('items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <View
        className={cn('absolute rounded-full border', trackClassName)}
        style={{ width: size, height: size, borderWidth: stroke, borderColor: 'rgb(var(--muted))' }}
      />
      <View
        className="absolute rounded-full border-primary"
        style={{
          width: size,
          height: size,
          borderWidth: stroke,
          borderTopColor: 'rgb(var(--primary))',
          borderRightColor: pct > 0.25 ? 'rgb(var(--primary))' : 'transparent',
          borderBottomColor: pct > 0.5 ? 'rgb(var(--primary))' : 'transparent',
          borderLeftColor: pct > 0.75 ? 'rgb(var(--primary))' : 'transparent',
          transform: [{ rotate: '-45deg' }],
        }}
      />
      {children}
    </View>
  );
}
