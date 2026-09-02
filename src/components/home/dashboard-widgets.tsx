import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Reanimated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const EASE = Easing.bezier(0.22, 1, 0.36, 1);

/* ──────────────────────────────────────────────────────────────────────────
   Press-scale wrapper — every tappable surface on the dashboard gets the
   same tactile response.
   ────────────────────────────────────────────────────────────────────── */
// A single animated Pressable rather than a Reanimated.View wrapping one:
// layout styles (`flex: 1`, `width: '47.8%'`) have to land on the outermost
// element, otherwise the wrapper shrink-wraps and the tile collapses.
const AnimatedPressable = Reanimated.createAnimatedComponent(Pressable);

export function PressCard({
  children,
  onPress,
  style,
  scaleTo = 0.97,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle | ViewStyle[];
  scaleTo?: number;
  accessibilityLabel?: string;
}) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel}
      onPressIn={() => {
        scale.value = withTiming(scaleTo, { duration: 90, easing: EASE });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 170, easing: EASE });
      }}
      style={[style as any, animated]}
    >
      {children}
    </AnimatedPressable>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Count-up number — stats land with motion instead of just appearing.
   ────────────────────────────────────────────────────────────────────── */
export function CountUp({
  value,
  prefix = '',
  suffix = '',
  duration = 900,
  style,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  style?: any;
}) {
  const [display, setDisplay] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    const start = from.current;
    const delta = value - start;
    const startedAt = Date.now();
    const id = setInterval(() => {
      const p = Math.min(1, (Date.now() - startedAt) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(start + delta * eased);
      if (p >= 1) {
        from.current = value;
        clearInterval(id);
      }
    }, 32);
    return () => clearInterval(id);
  }, [value, duration]);

  return (
    <ThemedText style={style}>
      {prefix}
      {Math.round(display)}
      {suffix}
    </ThemedText>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Live pulse dot — a ring that expands and fades, for "N live" indicators.
   ────────────────────────────────────────────────────────────────────── */
export function PulseDot({ color, size = 8 }: { color: string; size?: number }) {
  const p = useSharedValue(0);

  useEffect(() => {
    const tick = () => {
      p.value = 0;
      p.value = withTiming(1, { duration: 1600, easing: EASE });
    };
    tick();
    const id = setInterval(tick, 1700);
    return () => clearInterval(id);
  }, [p]);

  const ring = useAnimatedStyle(() => ({
    transform: [{ scale: 0.9 + p.value * 1.1 }],
    opacity: 0.7 * (1 - p.value),
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Reanimated.View
        style={[
          { position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: color },
          ring,
        ]}
      />
      <View
        style={{ width: size * 0.6, height: size * 0.6, borderRadius: size, backgroundColor: color }}
      />
    </View>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Stat tile — tinted ring + count-up, sitting on a translucent chip.
   ────────────────────────────────────────────────────────────────────── */
export function StatTile({
  label,
  value,
  prefix = '',
  suffix = '',
  icon,
  tint,
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.statTile,
        { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' },
        Shadows.level1,
      ]}
    >
      <View style={[styles.statRing, { backgroundColor: tint + '1F', borderColor: tint + '45' }]}>
        <Ionicons name={icon} size={15} color={tint} />
      </View>
      <CountUp
        value={value}
        prefix={prefix}
        suffix={suffix}
        style={[styles.statValue, { color: theme.text }]}
      />
      <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</ThemedText>
    </View>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Illustrated tile — artwork bleeds off the corner under a gradient wash so
   a tap target reads as a place, not a labelled rectangle.
   ────────────────────────────────────────────────────────────────────── */
export function IllustratedTile({
  title,
  subtitle,
  art,
  tint,
  icon,
  badge,
  onPress,
  height = 118,
  style,
}: {
  title: string;
  subtitle?: string;
  art: any;
  tint: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  badge?: string;
  onPress?: () => void;
  height?: number;
  style?: ViewStyle;
}) {
  const theme = useTheme();
  return (
    <PressCard
      onPress={onPress}
      accessibilityLabel={title}
      style={[
        styles.tile,
        { height, backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' },
        Shadows.level2,
        style as ViewStyle,
      ]}
    >
      <LinearGradient
        colors={[tint + '30', tint + '08']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Image
        source={art}
        style={{
          position: 'absolute',
          right: -14,
          bottom: -12,
          width: height * 0.88,
          height: height * 0.88,
          opacity: 0.92,
        }}
        contentFit="contain"
        transition={220}
      />
      <View style={styles.tileBody}>
        <View style={styles.tileTopRow}>
          {icon ? (
            <View style={[styles.tileIcon, { backgroundColor: tint + '2E' }]}>
              <MaterialCommunityIcons name={icon} size={15} color={tint} />
            </View>
          ) : null}
          {badge ? (
            <View style={[styles.tileBadge, { backgroundColor: tint }]}>
              <ThemedText style={styles.tileBadgeText}>{badge}</ThemedText>
            </View>
          ) : null}
        </View>
        <View style={{ width: '68%' }}>
          <ThemedText style={[styles.tileTitle, { color: theme.text }]} numberOfLines={1}>
            {title}
          </ThemedText>
          {subtitle ? (
            <ThemedText style={[styles.tileSub, { color: theme.textSecondary }]} numberOfLines={2}>
              {subtitle}
            </ThemedText>
          ) : null}
        </View>
      </View>
    </PressCard>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Voucher ticket — a real perforated stub: coloured value panel, punched
   notches top and bottom, dashed tear line.
   ────────────────────────────────────────────────────────────────────── */
export function VoucherTicket({
  value,
  suffix,
  title,
  brand,
  code,
  tint,
  onPress,
}: {
  value: string;
  suffix: string;
  title: string;
  brand: string;
  code: string;
  tint: string;
  onPress?: () => void;
}) {
  const theme = useTheme();
  return (
    <PressCard
      onPress={onPress}
      accessibilityLabel={`${title} voucher`}
      style={[
        styles.ticket,
        { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' },
        Shadows.level2,
      ]}
    >
      <LinearGradient colors={[tint, tint + 'CC']} style={styles.ticketStub}>
        <ThemedText style={styles.ticketValue}>{value}</ThemedText>
        <ThemedText style={styles.ticketSuffix}>{suffix}</ThemedText>
      </LinearGradient>

      {/* perforation */}
      <View style={styles.perforation}>
        <View
          style={[styles.notch, { top: -7, backgroundColor: theme.background }]}
        />
        <View
          style={[styles.notch, { bottom: -7, backgroundColor: theme.background }]}
        />
        <View style={[styles.tear, { borderColor: theme.outlineVariant }]} />
      </View>

      <View style={styles.ticketBody}>
        <ThemedText style={[styles.ticketTitle, { color: theme.text }]} numberOfLines={1}>
          {title}
        </ThemedText>
        <ThemedText style={[styles.ticketBrand, { color: theme.textSecondary }]} numberOfLines={1}>
          {brand}
        </ThemedText>
        <View style={[styles.codeChip, { borderColor: theme.outlineVariant }]}>
          <ThemedText style={[styles.codeText, { color: tint }]}>{code}</ThemedText>
        </View>
      </View>
    </PressCard>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Section heading with a leading accent rule.
   ────────────────────────────────────────────────────────────────────── */
export function SectionHeading({
  title,
  action,
  tint,
}: {
  title: string;
  action?: { label: string; onPress: () => void };
  tint?: string;
}) {
  const theme = useTheme();
  const rule = tint ?? theme.primary;
  return (
    <View style={styles.headingRow}>
      <View style={styles.headingLeft}>
        <View style={[styles.headingRule, { backgroundColor: rule }]} />
        <ThemedText style={[styles.headingText, { color: theme.textSecondary }]}>
          {title}
        </ThemedText>
      </View>
      {action ? (
        <Pressable onPress={action.onPress} hitSlop={8} style={styles.headingAction}>
          <ThemedText style={[styles.headingActionText, { color: theme.primary }]}>
            {action.label}
          </ThemedText>
          <Ionicons name="chevron-forward" size={12} color={theme.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Form pill — W / D / L chip for the form guide strip.
   ────────────────────────────────────────────────────────────────────── */
export function FormPill({ result }: { result: string }) {
  const theme = useTheme();
  const tone = result === 'W' ? '#10b981' : result === 'L' ? '#ef4444' : theme.textSecondary;
  return (
    <View style={[styles.formPill, { backgroundColor: tone + '22', borderColor: tone + '55' }]}>
      <ThemedText style={[styles.formPillText, { color: tone }]}>{result}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  // stat tile
  statTile: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: 5,
    paddingVertical: 11,
    paddingHorizontal: 4,
    borderRadius: BorderRadius.premium,
    borderWidth: 1,
  },
  statRing: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { fontFamily: 'Sora_600SemiBold', fontSize: 16 },
  statLabel: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 8.5,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },

  // illustrated tile
  tile: {
    borderRadius: BorderRadius.premium,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tileBody: { flex: 1, justifyContent: 'space-between', padding: Spacing.sm },
  tileTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tileIcon: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  tileBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 },
  tileBadgeText: {
    color: '#ffffff',
    fontFamily: 'Sora_600SemiBold',
    fontSize: 8.5,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  tileTitle: { fontFamily: 'Sora_500Medium', fontSize: 13 },
  tileSub: { fontFamily: 'Sora_400Regular', fontSize: 10.5, marginTop: 1, lineHeight: 14 },

  // voucher ticket
  ticket: {
    width: 246,
    height: 96,
    flexDirection: 'row',
    borderRadius: BorderRadius.premium,
    borderWidth: 1,
    overflow: 'hidden',
  },
  ticketStub: { width: 78, alignItems: 'center', justifyContent: 'center' },
  ticketValue: { color: '#ffffff', fontFamily: 'Sora_600SemiBold', fontSize: 19 },
  ticketSuffix: {
    color: 'rgba(255,255,255,0.85)',
    fontFamily: 'Sora_600SemiBold',
    fontSize: 8.5,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  perforation: { width: 0 },
  notch: { position: 'absolute', left: -7, width: 14, height: 14, borderRadius: 7 },
  tear: {
    position: 'absolute',
    left: -0.5,
    top: 10,
    bottom: 10,
    borderLeftWidth: 1,
    borderStyle: 'dashed',
  },
  ticketBody: { flex: 1, justifyContent: 'center', paddingHorizontal: 11, gap: 1 },
  ticketTitle: { fontFamily: 'Sora_500Medium', fontSize: 12.5 },
  ticketBrand: { fontFamily: 'Sora_400Regular', fontSize: 10 },
  codeChip: {
    alignSelf: 'flex-start',
    marginTop: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  codeText: { fontFamily: 'Sora_600SemiBold', fontSize: 9, letterSpacing: 1 },

  // section heading
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headingLeft: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  headingRule: { width: 3.5, height: 14, borderRadius: 2 },
  headingText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 10,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  headingAction: { flexDirection: 'row', alignItems: 'center', gap: 1 },
  headingActionText: { fontFamily: 'Sora_500Medium', fontSize: 11.5 },

  // form pill
  formPill: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formPillText: { fontFamily: 'Sora_600SemiBold', fontSize: 10 },
});
