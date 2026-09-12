/**
 * DuckWalkOffModal.tsx
 *
 * Out for nought: the Buk Ur Play monkey trudges back to the pavilion — head
 * down, a tear rolling, a rain cloud overhead, the bat dragging behind in the
 * dust and a little duck waddling on ahead with the "0".
 *
 * Vector line art in the logo's navy-on-yellow style. Each moving part (legs,
 * arms and bat, tail, head, tear, rain, duck) is its own layer on a shared
 * 240 × 240 canvas, rotated about its joint, so the walk cycle runs on the UI
 * thread. Motion is skipped when the OS asks to reduce motion.
 */

import React, { useEffect, useRef } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, Line, Path, Text as SvgText } from 'react-native-svg';
import Animated, {
  Easing,
  FadeOut,
  ZoomIn,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Shadows } from '@/constants/theme';
import { BRAND } from '@/constants/brand';
import { DUCK_LABEL, type DuckKind } from '@/utils/duck';

const INK = BRAND.ink;
const FUR = BRAND.yellow;
const TEAR = '#60A5FA';
const BEAK = '#F59E0B';

/** Canvas units, and how large the scene draws on screen. */
const VIEW = 240;
const SCENE = 230;
const PX = SCENE / VIEW;

/** One slow, sad stride (both legs). */
const STRIDE_MS = 1100;
/** Long enough to see the walk-off, short enough not to hold up the match. */
const AUTO_CLOSE_MS = 5200;

const COMMENTARY: Record<DuckKind, string> = {
  golden: 'First ball, and straight back to the pavilion.',
  diamond: 'Out without facing a ball — tough luck!',
  duck: 'Walking back without opening the account.',
};

/** A joint on the canvas as a CSS transform-origin. */
const joint = (x: number, y: number) => `${(x / VIEW) * 100}% ${(y / VIEW) * 100}%`;

function Layer({ children }: { children: React.ReactNode }) {
  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${VIEW} ${VIEW}`} style={StyleSheet.absoluteFill}>
      {children}
    </Svg>
  );
}

/** A limb drawn as an outlined stroke: navy edge, yellow fill — like the logo. */
function Limb({ d, width = 8 }: { d: string; width?: number }) {
  return (
    <>
      <Path d={d} stroke={INK} strokeWidth={width + 5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d={d} stroke={FUR} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  );
}

const line = { stroke: INK, strokeWidth: 3, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export function DuckWalkOffModal({
  visible,
  batsmanName,
  balls,
  kind,
  dismissal,
  onClose,
}: {
  visible: boolean;
  batsmanName: string;
  balls: number;
  kind: DuckKind;
  /** e.g. "c Rahul b Arjun". */
  dismissal?: string;
  onClose: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const stride = useSharedValue(0);
  const tear = useSharedValue(0);
  const drift = useSharedValue(0);
  // The parent passes a fresh closure each render; the timer must not restart for it.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!visible) return;
    if (!reduceMotion) {
      stride.value = 0;
      stride.value = withRepeat(withTiming(1, { duration: STRIDE_MS, easing: Easing.linear }), -1, false);
      tear.value = 0;
      tear.value = withRepeat(withTiming(1, { duration: 1500, easing: Easing.in(Easing.quad) }), -1, false);
      drift.value = 0;
      drift.value = withTiming(1, { duration: AUTO_CLOSE_MS - 400, easing: Easing.inOut(Easing.sin) });
    }
    const timer = setTimeout(() => closeRef.current(), AUTO_CLOSE_MS);
    return () => {
      clearTimeout(timer);
      cancelAnimation(stride);
      cancelAnimation(tear);
      cancelAnimation(drift);
    };
  }, [visible, reduceMotion, stride, tear, drift]);

  // Whole figure: drifts off to the left with a heavy up-and-down plod.
  const walkerStyle = useAnimatedStyle(() => {
    const a = stride.value * Math.PI * 2;
    return {
      transform: [
        { translateX: -drift.value * 34 * PX },
        { translateY: -((1 - Math.cos(a * 2)) / 2) * 4 * PX },
      ],
    };
  });
  const frontLegStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${Math.sin(stride.value * Math.PI * 2) * 16}deg` }],
  }));
  const backLegStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-Math.sin(stride.value * Math.PI * 2) * 16}deg` }],
  }));
  const frontArmStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-Math.sin(stride.value * Math.PI * 2) * 10}deg` }],
  }));
  const batArmStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${Math.sin(stride.value * Math.PI * 2) * 3}deg` }],
  }));
  const tailStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${Math.sin(stride.value * Math.PI * 2) * 6}deg` }],
  }));
  // Head hangs low and nods with each step.
  const headStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-4 + Math.sin(stride.value * Math.PI * 4) * 2}deg` }],
  }));
  const tearStyle = useAnimatedStyle(() => ({
    opacity: interpolate(tear.value, [0, 0.15, 0.7, 1], [0, 1, 1, 0]),
    transform: [{ translateY: tear.value * 14 * PX }],
  }));
  const rainStyle = useAnimatedStyle(() => {
    const r = (stride.value * 2) % 1;
    return {
      opacity: interpolate(r, [0, 0.2, 0.8, 1], [0, 1, 1, 0]),
      transform: [{ translateY: r * 12 * PX }],
    };
  });
  const dustStyle = useAnimatedStyle(() => {
    const r = (stride.value * 2) % 1;
    return { opacity: interpolate(r, [0, 0.3, 1], [0, 0.9, 0]), transform: [{ scale: 0.6 + r * 0.8 }] };
  });
  const duckStyle = useAnimatedStyle(() => {
    const a = stride.value * Math.PI * 4;
    return { transform: [{ rotate: `${Math.sin(a) * 7}deg` }, { translateY: -Math.abs(Math.sin(a)) * 2 * PX }] };
  });

  if (!visible) return null;

  const label = DUCK_LABEL[kind];
  const name = batsmanName || 'Batter';

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      {/* Tapping anywhere continues. Not given a button role: it contains the
          Next Batter button, and a button inside a button is invalid on web. */}
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View entering={ZoomIn.duration(260)} exiting={FadeOut.duration(180)} style={[styles.card, Shadows.level3]}>
          {/* ── The walk-off ── */}
          <View
            style={styles.scene}
            accessible
            accessibilityRole="image"
            accessibilityLabel={`${name} is out for a ${label.toLowerCase()} and walks sadly back to the pavilion`}
          >
            {/* Ground stays put while the figure walks away. */}
            <Layer>
              <Line x1={8} y1={214} x2={232} y2={214} {...line} strokeWidth={2.5} />
              <Line x1={30} y1={224} x2={58} y2={224} {...line} strokeWidth={2} />
              <Line x1={150} y1={226} x2={186} y2={226} {...line} strokeWidth={2} />
            </Layer>

            <Animated.View style={[StyleSheet.absoluteFill, walkerStyle]}>
              {/* Rain cloud */}
              <Layer>
                <Path
                  d="M70 46 C56 46 56 30 69 29 C69 16 86 12 93 21 C99 11 118 13 119 26 C132 24 137 38 127 45 C124 46 121 46 118 46 Z"
                  fill="#FFFFFF"
                  {...line}
                />
              </Layer>
              <Animated.View style={[StyleSheet.absoluteFill, rainStyle]}>
                <Layer>
                  <Line x1={84} y1={54} x2={82} y2={62} {...line} strokeWidth={2.2} stroke={TEAR} />
                  <Line x1={100} y1={56} x2={98} y2={64} {...line} strokeWidth={2.2} stroke={TEAR} />
                  <Line x1={116} y1={53} x2={114} y2={61} {...line} strokeWidth={2.2} stroke={TEAR} />
                </Layer>
              </Animated.View>

              {/* Tail, drooping */}
              <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: joint(140, 140) }, tailStyle]}>
                <Layer>
                  <Limb d="M140 140 Q168 146 162 176 Q158 190 148 184" width={5} />
                </Layer>
              </Animated.View>

              {/* Back leg */}
              <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: joint(126, 150) }, backLegStyle]}>
                <Layer>
                  <Limb d="M126 148 Q130 176 132 202" />
                  <Limb d="M132 202 Q124 204 117 201" width={6} />
                </Layer>
              </Animated.View>

              {/* Back arm, dragging the bat */}
              <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: joint(132, 114) }, batArmStyle]}>
                <Layer>
                  <Limb d="M132 114 Q146 128 150 150" width={7} />
                  <Path d="M152 162 L162 152 L212 198 Q215 206 207 209 Z" fill={FUR} {...line} />
                  <Line x1={166} y1={162} x2={203} y2={199} {...line} strokeWidth={1.6} />
                  <Limb d="M146 147 L158 157" width={4} />
                  <Circle cx={150} cy={152} r={5.5} fill={FUR} {...line} strokeWidth={2.5} />
                </Layer>
              </Animated.View>

              {/* Dust kicked up by the dragging bat */}
              <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: joint(214, 204) }, dustStyle]}>
                <Layer>
                  <Circle cx={218} cy={204} r={3.5} fill="none" {...line} strokeWidth={1.8} />
                  <Circle cx={227} cy={199} r={2.4} fill="none" {...line} strokeWidth={1.6} />
                  <Circle cx={224} cy={209} r={1.8} fill="none" {...line} strokeWidth={1.4} />
                </Layer>
              </Animated.View>

              {/* Body */}
              <Layer>
                <Ellipse cx={122} cy={134} rx={20} ry={25} fill={FUR} {...line} />
                <Ellipse cx={117} cy={139} rx={10.5} ry={15} fill="none" {...line} strokeWidth={2} />
              </Layer>

              {/* Front leg */}
              <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: joint(116, 152) }, frontLegStyle]}>
                <Layer>
                  <Limb d="M116 150 Q112 178 108 202" />
                  <Limb d="M108 202 Q99 204 92 200" width={6} />
                </Layer>
              </Animated.View>

              {/* Head, hanging low */}
              <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: joint(112, 108) }, headStyle]}>
                <Layer>
                  {/* Ears */}
                  <Circle cx={80} cy={86} r={9} fill={FUR} {...line} />
                  <Path d="M76.5 87 Q80 82 83.5 87" fill="none" {...line} strokeWidth={2} />
                  <Circle cx={130} cy={80} r={9} fill={FUR} {...line} />
                  <Path d="M126.5 81 Q130 76 133.5 81" fill="none" {...line} strokeWidth={2} />
                  {/* Head and hair tuft */}
                  <Circle cx={105} cy={82} r={25} fill={FUR} {...line} />
                  <Path d="M97 58 Q99 49 105 53 Q107 45 114 51" fill="none" {...line} strokeWidth={2.6} />
                  {/* Muzzle */}
                  <Ellipse cx={100} cy={93} rx={15} ry={11} fill={FUR} {...line} strokeWidth={2.4} />
                  {/* Glasses */}
                  <Circle cx={94} cy={80} r={7.5} fill="rgba(255,255,255,0.35)" {...line} strokeWidth={2.4} />
                  <Circle cx={111} cy={79} r={7.5} fill="rgba(255,255,255,0.35)" {...line} strokeWidth={2.4} />
                  <Line x1={101.5} y1={80} x2={103.5} y2={79.5} {...line} strokeWidth={2.2} />
                  <Line x1={118.5} y1={78.5} x2={127} y2={76} {...line} strokeWidth={2.2} />
                  {/* Eyes looking down, brows raised at the middle */}
                  <Circle cx={93} cy={84} r={1.9} fill={INK} />
                  <Circle cx={110} cy={83} r={1.9} fill={INK} />
                  <Line x1={86} y1={71} x2={98} y2={66.5} {...line} strokeWidth={2.4} />
                  <Line x1={106} y1={66} x2={118} y2={69.5} {...line} strokeWidth={2.4} />
                  {/* Nose and frown */}
                  <Circle cx={97.5} cy={90} r={1.1} fill={INK} />
                  <Circle cx={102.5} cy={90} r={1.1} fill={INK} />
                  <Path d="M93 99.5 Q100 94 107 99.5" fill="none" {...line} strokeWidth={2.4} />
                </Layer>
                <Animated.View style={[StyleSheet.absoluteFill, tearStyle]}>
                  <Layer>
                    <Path d="M88 88 C85 93 86 96.5 88.5 96.5 C91 96.5 92 93 88 88 Z" fill={TEAR} stroke={INK} strokeWidth={1.2} />
                  </Layer>
                </Animated.View>
              </Animated.View>

              {/* Front arm, hanging */}
              <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: joint(110, 114) }, frontArmStyle]}>
                <Layer>
                  <Limb d="M110 114 Q102 134 104 152" width={7} />
                  <Circle cx={104} cy={155} r={5.5} fill={FUR} {...line} strokeWidth={2.5} />
                </Layer>
              </Animated.View>

              {/* The duck, waddling on ahead with the score */}
              <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: joint(50, 208) }, duckStyle]}>
                <Layer>
                  <Line x1={49} y1={207} x2={47} y2={214} stroke={BEAK} strokeWidth={2.2} strokeLinecap="round" />
                  <Line x1={56} y1={207} x2={58} y2={214} stroke={BEAK} strokeWidth={2.2} strokeLinecap="round" />
                  <Ellipse cx={53} cy={198} rx={15} ry={10} fill="#FFFFFF" {...line} strokeWidth={2.4} />
                  <Path d="M47 196 Q54 203 61 196" fill="none" {...line} strokeWidth={2} />
                  <Circle cx={40} cy={185} r={8} fill="#FFFFFF" {...line} strokeWidth={2.4} />
                  <Circle cx={37.5} cy={183} r={1.5} fill={INK} />
                  <Path d="M32 185 L24 188 L32 191 Z" fill={BEAK} stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />
                  <Circle cx={30} cy={159} r={11} fill="#FFFFFF" {...line} strokeWidth={2.2} />
                  <SvgText x={30} y={164} fontSize={14} fontWeight="bold" fill={INK} textAnchor="middle">
                    0
                  </SvgText>
                </Layer>
              </Animated.View>
            </Animated.View>
          </View>

          {/* ── The dismissal ── */}
          <View style={styles.badge}>
            <ThemedText style={styles.badgeText}>🦆 {label}</ThemedText>
          </View>
          <ThemedText style={styles.name} numberOfLines={1}>
            {name}
          </ThemedText>
          <View style={styles.scorePill}>
            <ThemedText style={styles.scoreText} numberOfLines={1}>
              0 ({balls}b){dismissal ? ` · ${dismissal}` : ''}
            </ThemedText>
          </View>
          <ThemedText style={styles.commentary}>{COMMENTARY[kind]}</ThemedText>

          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Next batter"
            style={({ pressed }) => [styles.nextBtn, pressed && { opacity: 0.9 }]}
          >
            <ThemedText style={styles.nextText}>Next Batter</ThemedText>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 330,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: INK,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
    alignItems: 'center',
    gap: 8,
  },
  scene: {
    width: SCENE,
    height: SCENE,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: INK,
    backgroundColor: FUR,
    overflow: 'hidden',
    marginBottom: 4,
  },
  badge: { backgroundColor: INK, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { color: FUR, fontSize: 11, fontFamily: 'Sora_500Medium' },
  name: { fontSize: 15, fontFamily: 'Sora_600SemiBold', color: INK, textAlign: 'center' },
  scorePill: {
    backgroundColor: '#FEE2E2',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 3,
    maxWidth: '100%',
  },
  scoreText: { color: BRAND.danger, fontSize: 11.5, fontFamily: 'Sora_500Medium' },
  commentary: {
    fontSize: 11.5,
    lineHeight: 17,
    fontFamily: 'Sora_400Regular',
    color: BRAND.inkSoft,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  nextBtn: {
    marginTop: 6,
    height: 46,
    width: '100%',
    borderRadius: 999,
    backgroundColor: INK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextText: { color: FUR, fontSize: 13.5, fontFamily: 'Sora_500Medium' },
});
