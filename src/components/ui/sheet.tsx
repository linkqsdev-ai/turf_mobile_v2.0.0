import * as React from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { cn } from '@/lib/utils';
import { Text } from './text';

const EASE = Easing.bezier(0.22, 1, 0.36, 1);

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  /** Disable the tap-to-dismiss backdrop. */
  dismissable?: boolean;
  className?: string;
}

export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  dismissable = true,
  className,
}: SheetProps) {
  const [mounted, setMounted] = React.useState(open);
  const progress = useSharedValue(0);
  const insets = useSafeAreaInsets();

  const unmount = React.useCallback(() => setMounted(false), []);

  React.useEffect(() => {
    if (open) {
      setMounted(true);
      progress.value = withTiming(1, { duration: 260, easing: EASE });
    } else {
      progress.value = withTiming(0, { duration: 200, easing: EASE }, (finished) => {
        'worklet';
        if (finished) runOnJS(unmount)();
      });
    }
  }, [open, progress, unmount]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * 480 }],
  }));

  if (!mounted) return null;

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View className="flex-1 justify-end">
        <Animated.View style={backdropStyle} className="absolute inset-0 bg-black/55">
          <Pressable className="flex-1" onPress={dismissable ? onClose : undefined} />
        </Animated.View>
        <Animated.View
          style={[sheetStyle, { paddingBottom: insets.bottom + 16 }]}
          className={cn('rounded-t-3xl border border-b-0 border-border bg-card px-5 pt-3', className)}
        >
          <View className="mb-3 h-1.5 w-10 self-center rounded-full bg-border" />
          {title ? (
            <Text variant="subheading" className="mb-1">
              {title}
            </Text>
          ) : null}
          {description ? (
            <Text variant="subtle" className="mb-3">
              {description}
            </Text>
          ) : null}
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}
