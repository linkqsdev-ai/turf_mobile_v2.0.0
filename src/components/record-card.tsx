import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { EditIcon } from '@/components/ui/edit-icon';
import { MotionView } from '@/components/motion';
import { BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * record-card.tsx
 *
 * The shared card for a "record with a person attached" — a coaching class, a
 * turf booking. One implementation, because this design was previously
 * hand-built twice and immediately began to drift.
 *
 * Details are laid out as a two-column grid rather than a single stacked list:
 * six one-per-line rows made the card tall enough to push the actions off
 * screen, and paired short values (day / time, level / fee) read faster
 * side by side. Long values opt into a full-width cell via `full`.
 *
 * Typography follows the Player Home Dashboard: `Sora_500Medium` and
 * `Sora_400Regular` only, nothing above 15px. `components/ui/text.tsx` states
 * the rule — bold is for page-level headings, and nested titles step down.
 */

export type ChipTone = 'info' | 'warn' | 'danger' | 'success' | 'neutral';

const CHIP_TONES: Record<ChipTone, { bg: string; fg: string }> = {
  info: { bg: '#E0E7FF', fg: '#4338CA' },
  warn: { bg: '#FEF3C7', fg: '#B45309' },
  danger: { bg: '#FEE2E2', fg: '#B91C1C' },
  success: { bg: '#DCFCE7', fg: '#15803D' },
  neutral: { bg: '#F1F5F9', fg: '#475569' },
};

export interface RecordCardChip {
  label: string;
  tone?: ChipTone;
}

export interface RecordCardAction {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accessibilityLabel: string;
  destructive?: boolean;
}

/** One cell in the detail grid. Cells with no value are dropped, not blanked. */
export interface RecordCardDetail {
  icon: keyof typeof Ionicons.glyphMap;
  /** Short caption above the value, e.g. "Schedule". */
  label: string;
  value?: string | null;
  /** Span both columns — for values too long to sit in half the width. */
  full?: boolean;
  /** Action handler when tapping this detail cell (e.g. Map direction) */
  onPress?: () => void;
  /** Custom icon when the cell is interactive */
  actionIcon?: keyof typeof Ionicons.glyphMap;
}

export interface RecordCardProps {
  avatar?: any;
  title: string;
  chips?: RecordCardChip[];
  /** Free text under the header, e.g. the class description. */
  description?: string;
  details?: RecordCardDetail[];
  /** Footer line: emphasised left value, muted right value. */
  statLeft?: string;
  statRight?: string;
  primary?: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress: () => void;
    accessibilityLabel?: string;
  };
  actions?: RecordCardAction[];
  /** Dims the card — used for inactive/cancelled records. */
  dimmed?: boolean;
  /** Seconds before the entrance animation starts. */
  delay?: number;
}

export function RecordCard({
  avatar,
  title,
  chips = [],
  description,
  details = [],
  statLeft,
  statRight,
  primary,
  actions = [],
  dimmed = false,
  delay = 0,
}: RecordCardProps) {
  const theme = useTheme();

  // Callers pass cells unconditionally and let empty fields fall out here, so a
  // class with no end date shows one fewer cell rather than an empty one.
  const cells = details.filter((d) => !!d.value && String(d.value).trim().length > 0);

  return (
    <MotionView preset="fade-up" delay={delay}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.surfaceLowest,
            borderColor: theme.outlineVariant + '44',
            opacity: dimmed ? 0.6 : 1,
          },
        ]}
      >
        <View style={styles.head}>
          {!!avatar && (
            <View style={[styles.avatarRing, { borderColor: theme.outlineVariant + '33' }]}>
              <Image source={avatar} style={styles.avatar} contentFit="cover" />
            </View>
          )}

          <View style={styles.headText}>
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
          <ThemedText style={[styles.description, { color: theme.textSecondary }]} numberOfLines={3}>
            {description}
          </ThemedText>
        )}

        {cells.length > 0 && (
          <View style={[styles.grid, { borderTopColor: theme.outlineVariant + '33' }]}>
            {cells.map((d, i) => {
              const isPressable = typeof d.onPress === 'function';
              if (isPressable) {
                return (
                  <Pressable
                    key={`${d.icon}-${i}`}
                    onPress={d.onPress}
                    accessibilityRole="button"
                    accessibilityLabel={`${d.label}: ${d.value}. Tap for directions.`}
                    style={({ pressed }) => [
                      styles.cellFull,
                      styles.venueDirectionCard,
                      {
                        backgroundColor: pressed ? theme.primary + '18' : theme.primary + '0A',
                        borderColor: theme.primary + '35',
                      },
                    ]}
                  >
                    <View style={styles.venueDirectionHeader}>
                      <View style={styles.venueBadge}>
                        <Ionicons name="location-sharp" size={11} color={theme.primary} />
                        <ThemedText style={[styles.venueBadgeText, { color: theme.primary }]}>
                          VENUE LOCATION
                        </ThemedText>
                      </View>
                      <View style={[styles.directionPill, { backgroundColor: theme.primary }]}>
                        <Ionicons name="navigate" size={10} color="#ffffff" style={{ marginRight: 3 }} />
                        <ThemedText style={styles.directionPillText}>Get Directions</ThemedText>
                        <Ionicons name="arrow-forward" size={10} color="#ffffff" style={{ marginLeft: 2 }} />
                      </View>
                    </View>
                    <View style={styles.venueDirectionBody}>
                      <ThemedText style={[styles.venueNameText, { color: theme.text }]} numberOfLines={2}>
                        {d.value}
                      </ThemedText>
                    </View>
                  </Pressable>
                );
              }

              return (
                <View
                  key={`${d.icon}-${i}`}
                  style={[styles.cell, d.full ? styles.cellFull : styles.cellHalf]}
                >
                  <View style={[styles.cellIcon, { backgroundColor: theme.primary + '14' }]}>
                    <Ionicons name={d.icon} size={13} color={theme.primary} />
                  </View>
                  <View style={styles.cellText}>
                    <ThemedText style={[styles.cellLabel, { color: theme.textSecondary }]}>
                      {d.label}
                    </ThemedText>
                    <ThemedText style={[styles.cellValue, { color: theme.text }]} numberOfLines={2}>
                      {d.value}
                    </ThemedText>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {(statLeft || statRight) && (
          <View style={[styles.statRow, { borderTopColor: theme.outlineVariant + '33' }]}>
            {!!statLeft && (
              <ThemedText style={[styles.statStrong, { color: theme.text }]} numberOfLines={1}>
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
                  { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Ionicons name={primary.icon} size={15} color="#ffffff" />
                <ThemedText style={styles.primaryPillText}>{primary.label}</ThemedText>
              </Pressable>
            )}

            {actions.map((a, i) => {
              const isDestructive = a.destructive || a.icon === 'trash-outline' || a.icon === 'trash';
              const isEdit = a.icon === 'create-outline' || a.icon === 'create' || a.icon === 'pencil' || a.icon === 'pencil-outline';
              return (
                <Pressable
                  key={`${a.icon}-${i}`}
                  onPress={a.onPress}
                  accessibilityRole="button"
                  accessibilityLabel={a.accessibilityLabel}
                  style={({ pressed }) => [
                    styles.circleBtn,
                    {
                      borderColor: isDestructive ? '#ef444444' : theme.outlineVariant + '66',
                      backgroundColor: isDestructive ? '#ef444410' : 'transparent',
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  {isEdit ? (
                    <EditIcon size={16} />
                  ) : (
                    <Ionicons
                      name={a.icon}
                      size={17}
                      color={isDestructive ? '#ef4444' : theme.text}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    </MotionView>
  );
}

const AVATAR = 40;

const styles = StyleSheet.create({
  card: {
    width: '100%',
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarRing: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    borderWidth: 1,
    overflow: 'hidden',
  },
  avatar: { width: '100%', height: '100%' },
  headText: { flex: 1, minWidth: 0 },

  // ── Type scale, matched to the Player Home Dashboard ──────────────────────
  title: { fontSize: 13.5, lineHeight: 17, fontFamily: 'Sora_500Medium' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  chip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: BorderRadius.full },
  chipText: { fontSize: 9.5, fontFamily: 'Sora_500Medium' },
  description: { fontSize: 10.5, lineHeight: 15, fontFamily: 'Sora_400Regular', marginTop: 8 },

  // ── Detail grid ───────────────────────────────────────────────────────────
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  cell: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, paddingRight: 6 },
  cellHalf: { width: '50%' },
  cellFull: { width: '100%' },
  venueDirectionCard: {
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 2,
    gap: 6,
  },
  venueDirectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  venueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  venueBadgeText: {
    fontSize: 9,
    fontFamily: 'Sora_600SemiBold',
    letterSpacing: 0.5,
  },
  directionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  directionPillText: {
    fontSize: 9,
    fontFamily: 'Sora_600SemiBold',
    color: '#ffffff',
  },
  venueDirectionBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  venueNameText: {
    fontSize: 12.5,
    lineHeight: 16,
    fontFamily: 'Sora_600SemiBold',
  },
  cellIcon: {
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: { flex: 1, minWidth: 0 },
  cellLabel: { fontSize: 8.5, lineHeight: 12, fontFamily: 'Sora_400Regular', letterSpacing: 0.2 },
  cellValue: { fontSize: 11.5, lineHeight: 15, fontFamily: 'Sora_500Medium' },

  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  statStrong: { fontSize: 11.5, fontFamily: 'Sora_500Medium', flexShrink: 1 },
  statMuted: { fontSize: 9.5, fontFamily: 'Sora_400Regular' },

  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  primaryPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 32,
    borderRadius: 16,
  },
  primaryPillText: { color: '#ffffff', fontSize: 11.5, fontFamily: 'Sora_500Medium' },
  circleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
