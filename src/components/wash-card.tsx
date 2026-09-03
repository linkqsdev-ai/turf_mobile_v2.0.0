import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/themed-text';
import { MotionView } from '@/components/motion';
import { BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * wash-card.tsx
 *
 * The soft-gradient profile card: a pastel wash with a white card inset over
 * it and a circular avatar straddling the top-left edge.
 *
 * Written once and shared, because the same card was hand-built twice (coach
 * classes and turf bookings) with two copies of the geometry and colours — a
 * guaranteed source of drift the moment either was tweaked.
 *
 * Typography follows the Player Home Dashboard, which is the app's reference
 * voice: only `Sora_500Medium` and `Sora_400Regular`, nothing above ~15px.
 * That is not a stylistic preference — `components/ui/text.tsx` states the rule
 * outright: bold is reserved for page-level headings, and anything nested
 * (a card title included) steps down to medium so a screen has one dominant
 * voice rather than competing bold text.
 */

/** Pastel washes, rotated per card so a long list isn't one flat block. */
export const WASHES: [string, string, string][] = [
  ['#BFD4F2', '#F6C9A8', '#E3C9F0'],
  ['#C9E5D8', '#F7D6B0', '#C3D8F5'],
  ['#EBD0E8', '#FAD9B4', '#C6DDF2'],
  ['#D3D9F5', '#F8CBB8', '#CDE8DC'],
];

export type ChipTone = 'info' | 'warn' | 'danger' | 'success' | 'neutral';

const CHIP_TONES: Record<ChipTone, { bg: string; fg: string }> = {
  info: { bg: '#E0E7FF', fg: '#4338CA' },
  warn: { bg: '#FEF3C7', fg: '#B45309' },
  danger: { bg: '#FEE2E2', fg: '#B91C1C' },
  success: { bg: '#DCFCE7', fg: '#15803D' },
  neutral: { bg: '#F1F5F9', fg: '#475569' },
};

export interface WashCardChip {
  label: string;
  tone?: ChipTone;
}

export interface WashCardAction {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accessibilityLabel: string;
}

/** An icon + value row in the card's detail block. Falsy rows are dropped. */
export interface WashCardMeta {
  icon: keyof typeof Ionicons.glyphMap;
  text?: string | null;
}

export interface WashCardProps {
  /** Any integer; the wash is picked by rotation so callers can pass an index. */
  washIndex?: number;
  avatar?: any;
  title: string;
  chips?: WashCardChip[];
  /** Supporting line under the chips — the "what and where". */
  description?: string;
  /** Icon rows carrying the record's real detail (dates, times, venue…). */
  meta?: WashCardMeta[];
  /** Footer line above the actions: emphasised left value, muted right value. */
  statLeft?: string;
  statRight?: string;
  primary?: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress: () => void;
    accessibilityLabel?: string;
  };
  actions?: WashCardAction[];
  /** Dims the whole card — used for inactive/cancelled records. */
  dimmed?: boolean;
  /** Seconds before the entrance animation starts. */
  delay?: number;
}

export function WashCard({
  washIndex = 0,
  avatar,
  title,
  chips = [],
  description,
  meta = [],
  statLeft,
  statRight,
  primary,
  actions = [],
  dimmed = false,
  delay = 0,
}: WashCardProps) {
  const theme = useTheme();
  const wash = WASHES[Math.abs(washIndex) % WASHES.length];
  // Callers pass rows unconditionally and let empty fields fall out here, so a
  // class with no end date simply shows one fewer row rather than a blank one.
  const metaRows = meta.filter((m) => !!m.text && String(m.text).trim().length > 0);

  return (
    <MotionView preset="fade-up" delay={delay} style={styles.outer}>
      <LinearGradient
        colors={wash}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={[styles.wash, dimmed && { opacity: 0.4 }]}
      />

      <View style={[styles.card, { backgroundColor: theme.surfaceLowest }]}>
        <View style={styles.head}>
          {!!avatar && (
            <View style={styles.avatarRing}>
              <Image source={avatar} style={styles.avatar} contentFit="cover" />
            </View>
          )}

          <View style={[styles.headText, !avatar && { marginLeft: 0 }]}>
            <ThemedText style={[styles.title, { color: theme.text }]} numberOfLines={2}>
              {title}
            </ThemedText>

            {chips.length > 0 && (
              <View style={styles.chipRow}>
                {chips.map((c, i) => {
                  const tone = CHIP_TONES[c.tone ?? 'neutral'];
                  return (
                    <View key={`${c.label}-${i}`} style={[styles.chip, { backgroundColor: tone.bg }]}>
                      <ThemedText style={[styles.chipText, { color: tone.fg }]}>{c.label}</ThemedText>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {!!description && (
          <ThemedText style={[styles.description, { color: theme.textSecondary }]} numberOfLines={2}>
            {description}
          </ThemedText>
        )}

        {metaRows.length > 0 && (
          <View style={styles.metaBlock}>
            {metaRows.map((m, i) => (
              <View key={`${m.icon}-${i}`} style={styles.metaRow}>
                <Ionicons name={m.icon} size={14} color={theme.textSecondary} style={styles.metaIcon} />
                <ThemedText
                  style={[styles.metaText, { color: theme.textSecondary }]}
                  numberOfLines={2}
                >
                  {m.text}
                </ThemedText>
              </View>
            ))}
          </View>
        )}

        {(statLeft || statRight) && (
          <View
            style={[
              styles.statRow,
              metaRows.length > 0 && { borderTopWidth: 1, borderTopColor: theme.outlineVariant + '55' },
            ]}
          >
            {!!statLeft && (
              <ThemedText style={[styles.statStrong, { color: theme.primary }]} numberOfLines={1}>
                {statLeft}
              </ThemedText>
            )}
            {!!statRight && (
              <ThemedText style={[styles.statMuted, { color: theme.textSecondary }]} numberOfLines={1}>
                {statRight}
              </ThemedText>
            )}
          </View>
        )}

        {(primary || actions.length > 0) && (
          <View style={styles.actionRow}>
            {primary && (
              <Pressable
                onPress={primary.onPress}
                accessibilityRole="button"
                accessibilityLabel={primary.accessibilityLabel ?? primary.label}
                style={({ pressed }) => [
                  styles.primaryPill,
                  { backgroundColor: dimmed ? '#94A3B8' : '#0F172A', opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Ionicons name={primary.icon} size={17} color="#ffffff" />
                <ThemedText style={styles.primaryPillText}>{primary.label}</ThemedText>
              </Pressable>
            )}

            {actions.map((a, i) => (
              <Pressable
                key={`${a.icon}-${i}`}
                onPress={a.onPress}
                accessibilityRole="button"
                accessibilityLabel={a.accessibilityLabel}
                style={({ pressed }) => [
                  styles.circleBtn,
                  { borderColor: theme.outlineVariant + '66', opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Ionicons name={a.icon} size={18} color={theme.text} />
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </MotionView>
  );
}

const AVATAR = 78;

const styles = StyleSheet.create({
  outer: {
    width: '100%',
    marginBottom: 18,
    borderRadius: 30,
    position: 'relative',
    // The wash is the card's backdrop, so the shadow belongs on the outer shell.
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 6,
  },
  wash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 30,
  },
  card: {
    borderRadius: 26,
    // Asymmetric inset: a wider band of wash at the top-left is what gives the
    // avatar something to overlap.
    marginTop: 34,
    marginLeft: 26,
    marginRight: 10,
    marginBottom: 10,
    paddingTop: 16,
    paddingHorizontal: 18,
    paddingBottom: 16,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarRing: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    borderWidth: 4,
    borderColor: '#ffffff',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    marginTop: -46,
    marginLeft: -44,
  },
  avatar: { width: '100%', height: '100%' },
  // No negative margin here. The avatar's `marginLeft: -44` means it consumes
  // only (78 - 44) = 34px of flex width but still *paints* out to x=34, so the
  // 12px row gap puts this column at x=46 — just clear of it. Pulling the
  // column back any further slides the title underneath the avatar.
  headText: { flex: 1, minWidth: 0 },

  // ── Type scale, matched to the Player Home Dashboard ──────────────────────
  // Medium at 15, not bold at 19: a card title is a nested heading.
  title: { fontSize: 15, lineHeight: 20, fontFamily: 'Sora_500Medium' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 7 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full },
  chipText: { fontSize: 10.5, fontFamily: 'Sora_500Medium' },
  description: { fontSize: 12.5, lineHeight: 18, fontFamily: 'Sora_400Regular', marginTop: 14 },

  metaBlock: { marginTop: 12, gap: 7 },
  metaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  // Nudged down so the icon sits on the text's optical centre, not its cap line.
  metaIcon: { marginTop: 1.5 },
  metaText: { flex: 1, fontSize: 12, lineHeight: 17, fontFamily: 'Sora_400Regular' },

  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 12,
    paddingTop: 11,
  },
  statStrong: { fontSize: 12, fontFamily: 'Sora_500Medium', flexShrink: 1 },
  statMuted: { fontSize: 11, fontFamily: 'Sora_400Regular' },

  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  primaryPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 26,
  },
  primaryPillText: { color: '#ffffff', fontSize: 14, fontFamily: 'Sora_500Medium' },
  circleBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
