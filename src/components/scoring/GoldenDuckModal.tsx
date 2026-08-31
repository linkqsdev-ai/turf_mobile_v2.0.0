import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  Pressable,
  Platform,
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
import { BorderRadius, Shadows } from '@/constants/theme';

interface GoldenDuckModalProps {
  visible: boolean;
  batsmanName: string;
  bowlerName?: string;
  onClose: () => void;
}

export function GoldenDuckModal({
  visible,
  batsmanName,
  bowlerName,
  onClose,
}: GoldenDuckModalProps) {
  const duckTranslateX = useSharedValue(-40);
  const duckBobY = useSharedValue(0);
  const duckRotate = useSharedValue(-3);
  const tearOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Walking animation sequence
      duckTranslateX.value = withSpring(0, { damping: 12, stiffness: 90 });

      // Sad waddle / walking head bob animation
      duckBobY.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 400, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );

      duckRotate.value = withRepeat(
        withSequence(
          withTiming(3, { duration: 450, easing: Easing.inOut(Easing.ease) }),
          withTiming(-3, { duration: 450, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );

      // Crying tear animation
      tearOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0.2, { duration: 500 })
        ),
        -1,
        true
      );

      // Auto dismiss after 3.8 seconds so match continues smoothly
      const timer = setTimeout(() => {
        onClose();
      }, 3800);

      return () => clearTimeout(timer);
    } else {
      duckTranslateX.value = -40;
      duckBobY.value = 0;
    }
  }, [visible]);

  const animatedDuckStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: duckTranslateX.value },
      { translateY: duckBobY.value },
      { rotate: `${duckRotate.value}deg` },
    ],
  }));

  const animatedTearStyle = useAnimatedStyle(() => ({
    opacity: tearOpacity.value,
  }));

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View
          entering={ZoomIn.duration(280)}
          exiting={FadeOut.duration(200)}
          style={[styles.card, Shadows.level3]}
        >
          {/* Spotlight Glow Behind Duck */}
          <View style={styles.spotlightGlow} />

          {/* Animated Duck Illustration */}
          <Animated.View style={[styles.duckImageWrap, animatedDuckStyle]}>
            <Image
              source={require('@/assets/images/golden_duck.png')}
              style={styles.duckImage}
              contentFit="contain"
            />

            {/* Crying Tears Icon Indicator */}
            <Animated.View style={[styles.tearOverlay, animatedTearStyle]}>
              <ThemedText style={{ fontSize: 18 }}>💧</ThemedText>
            </Animated.View>
          </Animated.View>

          {/* Batsman Info */}
          <View style={styles.infoWrap}>
            <ThemedText style={styles.batsmanName} numberOfLines={1}>
              {batsmanName || 'Batsman'}
            </ThemedText>

            <View style={styles.scorePill}>
              <ThemedText style={styles.scoreText}>
                0 (1b) • Out on 1st Ball
              </ThemedText>
            </View>

            {bowlerName ? (
              <ThemedText style={styles.bowlerSubtext}>
                Dismissed by <ThemedText style={{ fontFamily: 'Sora_800ExtraBold', color: '#d97706' }}>{bowlerName}</ThemedText>
              </ThemedText>
            ) : null}

            <ThemedText style={styles.commentary}>
              "Back to the pavilion without opening the account! 💔"
            </ThemedText>
          </View>

          {/* Tap to Continue Button */}
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
              Next Batsman ➔
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
    paddingTop: 20,
    paddingBottom: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fbbf24',
    position: 'relative',
    overflow: 'hidden',
  },
  spotlightGlow: {
    position: 'absolute',
    top: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#fef3c7',
    opacity: 0.8,
  },
  duckImageWrap: {
    width: 200,
    height: 190,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
    position: 'relative',
  },
  duckImage: {
    width: '100%',
    height: '100%',
  },
  tearOverlay: {
    position: 'absolute',
    top: 36,
    left: 78,
  },
  infoWrap: {
    alignItems: 'center',
    width: '100%',
    marginTop: 2,
  },
  batsmanName: {
    fontSize: 18,
    fontFamily: 'Sora_800ExtraBold',
    color: '#0f172a',
    textAlign: 'center',
  },
  scorePill: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  scoreText: {
    color: '#dc2626',
    fontSize: 11.5,
    fontFamily: 'Sora_700Bold',
  },
  bowlerSubtext: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 4,
    fontFamily: 'Sora_500Medium',
  },
  commentary: {
    fontSize: 11,
    color: '#94a3b8',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 12,
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
    fontFamily: 'Sora_700Bold',
  },
});
