import * as React from 'react';
import { Pressable } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { cn } from '@/lib/utils';

export interface SwitchProps {
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
  className?: string;
}

const EASE = Easing.bezier(0.22, 1, 0.36, 1);

export function Switch({ value, onValueChange, disabled, className }: SwitchProps) {
  const progress = useSharedValue(value ? 1 : 0);

  React.useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, { duration: 180, easing: EASE });
  }, [value, progress]);

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * 20 }],
  }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled: !!disabled }}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      className={cn(
        'h-7 w-12 justify-center rounded-full px-0.5',
        value ? 'bg-primary' : 'bg-muted',
        disabled && 'opacity-50',
        className,
      )}
    >
      <Animated.View
        className="h-6 w-6 rounded-full bg-background shadow-card"
        style={knobStyle}
      />
    </Pressable>
  );
}
