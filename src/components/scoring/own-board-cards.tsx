/**
 * own-board-cards.tsx
 *
 * The Own Board's player and match cards, in the Home dashboard's analytics
 * card language (app/(tabs)/index.tsx): Sora Medium 14 titles, an accent metric
 * with a tinted tag, an icon tile, pill bars, and a hairline label/value footer.
 *
 * Presentation only — what each card says comes from utils/own-board-display.ts.
 */

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { PressCard } from '@/components/home/dashboard-widgets';
import { splitStat, toneAccent, type Tone } from '@/utils/own-board-display';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TONE_EMOJI: Record<Tone, string> = { good: '🔥', fair: '⚡', poor: '📉' };

// ─── Player stat card ─────────────────────────────────────────────────────────

export interface PlayerStatCardProps {
  name: string;
  role: string;
  avatar: React.ReactNode;
  badge: { label: string; tone: Tone };
  info: { icon: IoniconName; text: string };
  meta: string[];
  chips: string[];
  total: { value: string; caption: string };
  actionLabel: string;
  onPress: () => void;
}

export function PlayerStatCard({ name, role, avatar, badge, info, meta, chips, total, actionLabel, onPress }: PlayerStatCardProps) {
  const theme = useTheme();
  const accent = toneAccent(badge.tone);

  return (
    <PressCard
      onPress={onPress}
      scaleTo={0.98}
      accessibilityLabel={`${name}, ${role}. ${total.value}. ${badge.label}. ${info.text}`}
      style={[styles.card, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}
    >
      {/* Header — title, accent metric with tag, icon tile */}
      <View style={styles.header}>
        <View style={[styles.avatarRing, { borderColor: accent.main + '45' }]}>{avatar}</View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <ThemedText style={[styles.title, { color: theme.text }]} numberOfLines={1}>{name}</ThemedText>
          <View style={styles.metricRow}>
            <ThemedText style={[styles.metric, { color: accent.main }]} numberOfLines={1}>{total.value}</ThemedText>
            <View style={[styles.tag, { backgroundColor: accent.main + '1F' }]}>
              <ThemedText style={[styles.tagText, { color: accent.dark }]} numberOfLines={1}>
                {TONE_EMOJI[badge.tone]} {badge.label}
              </ThemedText>
            </View>
          </View>
          <ThemedText style={[styles.subText, { color: theme.textSecondary }]} numberOfLines={1}>
            {role} · {info.text}
          </ThemedText>
        </View>
        <View style={[styles.iconTile, { backgroundColor: accent.main + '1A' }]}>
          <Ionicons name={info.icon} size={18} color={accent.main} />
        </View>
      </View>

      {/* Stat tiles — value over label */}
      <StatTileRow chips={chips} />

      {/* Summary footer */}
      <View style={[styles.footer, { borderTopColor: theme.outlineVariant + '1A' }]}>
        <ThemedText style={[styles.footerText, { color: theme.textSecondary, flex: 1 }]} numberOfLines={1}>
          {meta.join(' · ')}
        </ThemedText>
        <Pressable
          onPress={onPress}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={`${actionLabel} for ${name}`}
          style={styles.link}
        >
          <ThemedText style={[styles.footerText, styles.linkText, { color: theme.primary }]}>{actionLabel}</ThemedText>
          <Ionicons name="chevron-forward" size={12} color={theme.primary} />
        </Pressable>
      </View>
    </PressCard>
  );
}

/** Stats as value-over-label tiles, side by side. Shared by the list and career cards. */
export function StatTileRow({ chips }: { chips: string[] }) {
  const theme = useTheme();
  if (chips.length === 0) return null;
  return (
    <View style={styles.tileRow}>
      {chips.map((chip) => {
        const { label, value } = splitStat(chip);
        return (
          <View key={chip} style={[styles.tile, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '1A' }]}>
            <ThemedText style={[styles.tileValue, { color: theme.text }]} numberOfLines={1}>{value}</ThemedText>
            <ThemedText style={[styles.tileLabel, { color: theme.textSecondary }]} numberOfLines={1}>{label}</ThemedText>
          </View>
        );
      })}
    </View>
  );
}

// ─── Match result card ────────────────────────────────────────────────────────

export interface MatchResultCardProps {
  title: string;
  pill: { label: string; tone: Tone };
  date: string;
  innings: { team: string; score: string; overs: string; runs: number; won: boolean }[];
  motm: { name: string; stat: string };
  avatar: React.ReactNode;
  /** Omit inside the scorecard itself, where there is nothing further to open. */
  onPress?: () => void;
  /** Shown in place of the Scorecard link when there is no onPress, e.g. the MOTM figures. */
  footerNote?: string;
}

export function MatchResultCard({ title, pill, date, innings, motm, avatar, onPress, footerNote }: MatchResultCardProps) {
  const theme = useTheme();
  const accent = toneAccent(pill.tone);
  const maxRuns = Math.max(1, ...innings.map((inn) => inn.runs));

  return (
    <PressCard
      onPress={onPress}
      scaleTo={0.98}
      accessibilityLabel={`${title}. ${pill.label}. ${innings.map((i) => `${i.team} ${i.score}`).join(', ')}. Player of the match ${motm.name}. ${date}`}
      style={[styles.card, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}
    >
      {/* Header — teams, result metric with date tag, icon tile */}
      <View style={styles.header}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <ThemedText style={[styles.title, { color: theme.text }]} numberOfLines={1}>{title}</ThemedText>
          <View style={styles.metricRow}>
            <ThemedText style={[styles.metric, { color: accent.main }]} numberOfLines={1}>{pill.label}</ThemedText>
            <View style={[styles.tag, { backgroundColor: accent.main + '1F' }]}>
              <ThemedText style={[styles.tagText, { color: accent.dark }]} numberOfLines={1}>📅 {date}</ThemedText>
            </View>
          </View>
        </View>
        <View style={[styles.iconTile, { backgroundColor: accent.main + '1A' }]}>
          <Ionicons name="trophy" size={18} color={accent.main} />
        </View>
      </View>

      {/* Innings as horizontal pill bars, the winner in full accent */}
      <View style={styles.inningsBlock}>
        {innings.map((inn) => (
          <View key={`${inn.team}-${inn.score}`} style={styles.inningsRow}>
            <ThemedText
              style={[
                styles.inningsTeam,
                { color: inn.won ? theme.text : theme.textSecondary, fontFamily: inn.won ? 'Sora_600SemiBold' : 'Sora_500Medium' },
              ]}
              numberOfLines={1}
            >
              {inn.team}
            </ThemedText>
            <View style={[styles.track, { backgroundColor: accent.main + '14' }]}>
              <View
                style={{
                  width: `${Math.max(8, Math.round((inn.runs / maxRuns) * 100))}%` as `${number}%`,
                  height: '100%',
                  borderRadius: 5,
                  backgroundColor: inn.won ? accent.main : accent.main + '38',
                }}
              />
            </View>
            <ThemedText style={[styles.inningsScore, { color: inn.won ? accent.dark : theme.textSecondary }]} numberOfLines={1}>
              {inn.score} <ThemedText style={[styles.inningsOvers, { color: theme.textSecondary }]}>({inn.overs})</ThemedText>
            </ThemedText>
          </View>
        ))}
      </View>

      {/* Summary footer */}
      <View style={[styles.footer, { borderTopColor: theme.outlineVariant + '1A' }]}>
        <View style={styles.motm}>
          <View style={styles.motmAvatar}>{avatar}</View>
          <ThemedText style={[styles.footerText, { color: theme.textSecondary, flexShrink: 1 }]} numberOfLines={1}>
            Player of the match:{' '}
            <ThemedText style={[styles.footerText, { color: theme.text, fontFamily: 'Sora_500Medium' }]}>{motm.name}</ThemedText>
          </ThemedText>
        </View>
        {onPress ? (
          <Pressable
            onPress={onPress}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={`View scorecard for ${title}`}
            style={styles.link}
          >
            <ThemedText style={[styles.footerText, styles.linkText, { color: theme.primary }]}>Scorecard</ThemedText>
            <Ionicons name="chevron-forward" size={12} color={theme.primary} />
          </Pressable>
        ) : footerNote ? (
          <ThemedText style={[styles.footerText, styles.linkText, { color: accent.dark, flexShrink: 1, textAlign: 'right' }]} numberOfLines={1}>
            {footerNote}
          </ThemedText>
        ) : null}
      </View>
    </PressCard>
  );
}

const styles = StyleSheet.create({
  // Shared — the Home analytics card
  card: { borderRadius: BorderRadius.premium, borderWidth: 1, padding: 16, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 14, fontFamily: 'Sora_500Medium', letterSpacing: 0.5 },
  metricRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 },
  metric: { fontSize: 12, fontFamily: 'Sora_500Medium', flexShrink: 1 },
  tag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, flexShrink: 1 },
  tagText: { fontSize: 9, fontFamily: 'Sora_500Medium' },
  iconTile: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingTop: 8, borderTopWidth: 1 },
  footerText: { fontSize: 10 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  linkText: { fontFamily: 'Sora_500Medium' },

  // Player card
  avatarRing: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  subText: { fontSize: 10, fontFamily: 'Sora_500Medium', marginTop: 3 },
  tileRow: { flexDirection: 'row', gap: 8 },
  tile: { flex: 1, minWidth: 0, alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4, borderRadius: 10, borderWidth: 1 },
  tileValue: { fontSize: 12, fontFamily: 'Sora_500Medium' },
  tileLabel: { fontSize: 9, fontFamily: 'Sora_500Medium', marginTop: 1 },

  // Match card
  inningsBlock: { gap: 8 },
  inningsRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  inningsTeam: { width: 92, fontSize: 10 },
  track: { flex: 1, height: 10, borderRadius: 5, overflow: 'hidden' },
  inningsScore: { minWidth: 64, fontSize: 10, fontFamily: 'Sora_500Medium', textAlign: 'right' },
  inningsOvers: { fontSize: 9 },
  motm: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 },
  motmAvatar: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
});
