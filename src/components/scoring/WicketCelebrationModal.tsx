import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
  FadeIn,
  FadeOut,
  ZoomIn,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Shadows } from '@/constants/theme';

interface WicketCelebrationModalProps {
  visible: boolean;
  batsmanName: string;
  bowlerName?: string;
  scoreText?: string;
  onClose: () => void;
}

export function WicketCelebrationModal({
  visible,
  batsmanName,
  bowlerName,
  scoreText,
  onClose,
}: WicketCelebrationModalProps) {
  const monkeyScale = useSharedValue(0.3);
  const monkeyJumpY = useSharedValue(0);
  const monkeyRotate = useSharedValue(-4);
  const sparksOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Entry pop
      monkeyScale.value = withSpring(1, { damping: 10, stiffness: 120 });

      // Energetic jumping animation for the happy monkey bowler
      monkeyJumpY.value = withRepeat(
        withSequence(
          withTiming(-16, { duration: 280, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 280, easing: Easing.in(Easing.quad) })
        ),
        -1,
        true
      );

      monkeyRotate.value = withRepeat(
        withSequence(
          withTiming(5, { duration: 320, easing: Easing.inOut(Easing.ease) }),
          withTiming(-5, { duration: 320, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );

      // Flashing celebration sparks
      sparksOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 350 }),
          withTiming(0.3, { duration: 350 })
        ),
        -1,
        true
      );

      // Auto dismiss after 3.2s
      const timer = setTimeout(() => {
        onClose();
      }, 3200);

      return () => clearTimeout(timer);
    } else {
      monkeyScale.value = 0.3;
      monkeyJumpY.value = 0;
    }
  }, [visible]);

  const animatedMonkeyStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: monkeyScale.value },
      { translateY: monkeyJumpY.value },
      { rotate: `${monkeyRotate.value}deg` },
    ],
  }));

  const animatedSparksStyle = useAnimatedStyle(() => ({
    opacity: sparksOpacity.value,
  }));

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View
          entering={ZoomIn.duration(260)}
          exiting={FadeOut.duration(180)}
          style={[styles.card, Shadows.level3]}
        >
          {/* Glowing Radial Backdrop */}
          <View style={styles.spotlightGlow} />

          {/* Floating Confetti Particles Header */}
          <Animated.View style={[styles.particlesRow, animatedSparksStyle]}>
            <ThemedText style={{ fontSize: 20 }}>💥</ThemedText>
            <ThemedText style={{ fontSize: 22 }}>⚡</ThemedText>
            <ThemedText style={{ fontSize: 24 }}>🎉</ThemedText>
            <ThemedText style={{ fontSize: 22 }}>🔥</ThemedText>
            <ThemedText style={{ fontSize: 20 }}>💥</ThemedText>
          </Animated.View>

          {/* Animated Monkey Bowler Illustration */}
          <Animated.View style={[styles.monkeyImageWrap, animatedMonkeyStyle]}>
            <Image
              source={require('@/assets/images/wicket_monkey.png')}
              style={styles.monkeyImage}
              contentFit="contain"
            />
          </Animated.View>

          {/* Dismissal Details */}
          <View style={styles.infoWrap}>
            <ThemedText style={styles.batsmanName} numberOfLines={1}>
              {batsmanName || 'Batsman'}
            </ThemedText>

            {bowlerName ? (
              <View style={styles.bowlerPill}>
                <Ionicons name="sparkles" size={12} color="#10b981" />
                <ThemedText style={styles.bowlerText}>
                  Wicket by <ThemedText style={{ fontFamily: 'Sora_600SemiBold', color: '#047857' }}>{bowlerName}</ThemedText>
                </ThemedText>
              </View>
            ) : null}

            {scoreText ? (
              <ThemedText style={styles.scoreSubtext}>
                Match Score: <ThemedText style={{ fontFamily: 'Sora_600SemiBold', color: '#0f172a' }}>{scoreText}</ThemedText>
              </ThemedText>
            ) : null}
          </View>

          {/* Next Batsman CTA Button */}
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onClose();
            }}
            style={({ pressed }) => [
              styles.dismissBtn,
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            ]}
          >
            <ThemedText style={styles.dismissBtnText}>
              Select Next Batsman ➔
            </ThemedText>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 9999,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f59e0b',
    position: 'relative',
    overflow: 'hidden',
  },
  spotlightGlow: {
    position: 'absolute',
    top: -40,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#fef3c7',
    opacity: 0.85,
  },
  particlesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 4,
  },
  monkeyImageWrap: {
    width: 210,
    height: 195,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
  monkeyImage: {
    width: '100%',
    height: '100%',
  },
  infoWrap: {
    alignItems: 'center',
    width: '100%',
    marginTop: 2,
    gap: 4,
  },
  batsmanName: {
    fontSize: 15,
    fontFamily: 'Sora_600SemiBold',
    color: '#991b1b',
  },
  bowlerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#d1fae5',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    marginTop: 2,
  },
  bowlerText: {
    color: '#065f46',
    fontSize: 11,
    fontFamily: 'Sora_600SemiBold',
  },
  scoreSubtext: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontFamily: 'Sora_600SemiBold',
  },
  dismissBtn: {
    marginTop: 14,
    backgroundColor: '#0f172a',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  dismissBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Sora_600SemiBold',
  },
});
