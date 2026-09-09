import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { ThemedText } from '@/components/themed-text';

const { width: W } = Dimensions.get('window');

interface ScoreboardBoundaryWatermarkProps {
  boundaryType: 4 | 6 | null;
  onFinish?: () => void;
}

export function ScoreboardBoundaryWatermark({
  boundaryType,
  onFinish,
}: ScoreboardBoundaryWatermarkProps) {
  const slideX = useSharedValue(W);
  const opacityVal = useSharedValue(0);
  const bobY = useSharedValue(0);
  const numScale = useSharedValue(0.6);

  useEffect(() => {
    if (boundaryType) {
      slideX.value = withTiming(0, { duration: 480, easing: Easing.out(Easing.cubic) });
      opacityVal.value = withTiming(1, { duration: 300 });

      bobY.value = withRepeat(
        withSequence(
          withTiming(-6, { duration: 200, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 200, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );

      numScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 350 }),
          withTiming(0.85, { duration: 350 })
        ),
        -1,
        true
      );

      const timer = setTimeout(() => {
        opacityVal.value = withTiming(0, { duration: 400 });
        slideX.value = withTiming(W, { duration: 400, easing: Easing.in(Easing.cubic) });
        setTimeout(() => onFinish?.(), 420);
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      slideX.value = W;
      opacityVal.value = 0;
    }
  }, [boundaryType]);

  const animMonkey = useAnimatedStyle(() => ({
    opacity: opacityVal.value,
    transform: [{ translateX: slideX.value }, { translateY: bobY.value }],
  }));

  const animNum = useAnimatedStyle(() => ({
    opacity: interpolate(opacityVal.value, [0, 1], [0, 0.22]),
    transform: [{ scale: numScale.value }],
  }));

  if (!boundaryType) return null;

  const isSix = boundaryType === 6;

  return (
    <View style={styles.root} pointerEvents="none">
      <Animated.View style={[styles.numWrap, animNum]}>
        <ThemedText style={[styles.numText, { color: isSix ? '#fbbf24' : '#60a5fa' }]}>
          {isSix ? '6' : '4'}
        </ThemedText>
      </Animated.View>

      <Animated.View style={[styles.monkeyWrap, animMonkey]}>
        <Image
          source={require('@/assets/images/boundary_monkey.png')}
          style={styles.monkeyImg}
          contentFit="cover"
        />
        <View style={[styles.ribbon, { backgroundColor: isSix ? 'rgba(245,158,11,0.85)' : 'rgba(37,99,235,0.85)' }]}>
          <ThemedText style={styles.ribbonText}>
            {isSix ? '🔥 SIX! OUT OF THE PARK' : '⚡ FOUR! ACROSS THE ROPE'}
          </ThemedText>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    borderRadius: 20,
    zIndex: 0,
  },
  numWrap: {
    position: 'absolute',
    right: -8,
    top: -15,
    zIndex: 0,
  },
  numText: {
    fontSize: 130,
    fontFamily: 'Sora_500Medium',
    lineHeight: 140,
  },
  monkeyWrap: {
    position: 'absolute',
    bottom: 0,
    right: -6,
    zIndex: 1,
    alignItems: 'center',
  },
  monkeyImg: {
    width: 160,
    height: 115,
    opacity: 0.82,
  },
  ribbon: {
    position: 'absolute',
    bottom: 4,
    left: -80,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  ribbonText: {
    color: '#ffffff',
    fontSize: 9,
    fontFamily: 'Sora_500Medium',
    letterSpacing: 0.3,
  },
});
