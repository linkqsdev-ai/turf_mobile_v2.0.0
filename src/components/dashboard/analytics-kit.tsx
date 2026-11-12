/**
 * analytics-kit.tsx
 *
 * The Home dashboard's analytics card language (app/(tabs)/index.tsx) as
 * reusable pieces, shared by the Own Board, Cups, tournament and registration
 * screens so they read as one product:
 *
 *   DashboardCard          white 12px card — title, accent metric + tag, icon tile, hairline footer
 *   DashboardSectionLabel  uppercase label behind an accent bar
 *   DashboardTabs          grey track; the active tab is a raised white segment in its accent
 *   DashboardChip          filter chip that raises white when selected, never a solid fill
 *   DashboardStepper       wizard steps: done ticks green, the current step raised white
 *   StatTiles              value-over-label tiles
 *   ProgressPill           slim rounded progress bar
 */

import React from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { PressCard } from '@/components/home/dashboard-widgets';
import { ACCENTS, type Accent } from '@/constants/dashboard-accents';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

// ─── Card ─────────────────────────────────────────────────────────────────────

export interface DashboardFooter {
  label?: string;
  value?: string;
  /** Right side: a status string in the accent's dark tone, or any node (e.g. a button). */
  status?: React.ReactNode;
  statusColor?: string;
  /** Replaces the label/value text on the left. */
  left?: React.ReactNode;
}

export function DashboardCard({
  title,
  metric,
  tag,
  icon,
  accent = ACCENTS.primary,
  media,
  leading,
  trailing,
  footer,
  children,
  onPress,
  style,
  accessibilityLabel,
  titleLines = 1,
}: {
  title: string;
  metric?: string;
  tag?: string;
  icon?: IoniconName;
  accent?: Accent;
  /** Full-width artwork above the header, e.g. a grid card's banner. */
  media?: React.ReactNode;
  /** Before the title, e.g. a thumbnail or avatar. */
  leading?: React.ReactNode;
  /** Replaces the icon tile. */
  trailing?: React.ReactNode;
  footer?: DashboardFooter;
  children?: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  titleLines?: number;
}) {
  const theme = useTheme();

  const body = (
    <>
      {media}
      <View style={styles.header}>
        {leading}
        <View style={{ flex: 1, minWidth: 0 }}>
          <ThemedText style={[styles.title, { color: theme.text }]} numberOfLines={titleLines}>
            {title}
          </ThemedText>
          {(!!metric || !!tag) && (
            <View style={styles.metricRow}>
              {!!metric && (
                <ThemedText style={[styles.metric, { color: accent.main }]} numberOfLines={1}>
                  {metric}
                </ThemedText>
              )}
              {!!tag && (
                <View style={[styles.tag, { backgroundColor: accent.main + '1F' }]}>
                  <ThemedText style={[styles.tagText, { color: accent.dark }]} numberOfLines={1}>
                    {tag}
                  </ThemedText>
                </View>
              )}
            </View>
          )}
        </View>
        {trailing ??
          (icon ? (
            <View style={[styles.iconTile, { backgroundColor: accent.main + '1A' }]}>
              <Ionicons name={icon} size={18} color={accent.main} />
            </View>
          ) : null)}
      </View>

      {children}

      {footer && (
        <View style={[styles.footer, { borderTopColor: theme.outlineVariant + '1A' }]}>
          {footer.left ??
            (footer.label !== undefined || footer.value !== undefined ? (
              <ThemedText style={[styles.footerText, { color: theme.textSecondary, flexShrink: 1 }]} numberOfLines={1}>
                {footer.label}
                {footer.label !== undefined && footer.value !== undefined ? ': ' : ''}
                {footer.value !== undefined && (
                  <ThemedText style={[styles.footerText, { color: theme.text, fontFamily: 'Sora_500Medium' }]}>
                    {footer.value}
                  </ThemedText>
                )}
              </ThemedText>
            ) : (
              <View />
            ))}
          {typeof footer.status === 'string' ? (
            <ThemedText
              style={[styles.footerText, styles.footerStatus, { color: footer.statusColor ?? accent.dark }]}
              numberOfLines={1}
            >
              {footer.status}
            </ThemedText>
          ) : (
            footer.status
          )}
        </View>
      )}
    </>
  );

  const cardStyle = StyleSheet.flatten([
    styles.card,
    { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' },
    Shadows.level2,
    style,
  ]);

  return onPress ? (
    <PressCard onPress={onPress} scaleTo={0.98} accessibilityLabel={accessibilityLabel} style={cardStyle}>
      {body}
    </PressCard>
  ) : (
    <View style={cardStyle} accessibilityLabel={accessibilityLabel}>
      {body}
    </View>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────

export function DashboardSectionLabel({
  label,
  color,
  right,
  style,
}: {
  label: string;
  color?: string;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.sectionRow, style]}>
      <View style={styles.sectionLeft} accessibilityRole="header">
        <View style={[styles.sectionBar, { backgroundColor: color ?? theme.primary }]} />
        <ThemedText style={[styles.sectionText, { color: theme.textSecondary }]} numberOfLines={1}>
          {label}
        </ThemedText>
      </View>
      {right}
    </View>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

export interface DashboardTabOption<K extends string> {
  key: K;
  label: string;
  emoji?: string;
  accent?: Accent;
  disabled?: boolean;
}

export function DashboardTabs<K extends string>({
  options,
  active,
  onChange,
  compact = false,
  style,
}: {
  options: DashboardTabOption<K>[];
  active: K;
  onChange: (key: K) => void;
  /** Tighter labels, for rows of many tabs. */
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  return (
    <View
      style={[styles.tabs, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '25' }, style]}
      accessibilityRole="tablist"
    >
      {options.map((option) => {
        const on = option.key === active;
        const accent = option.accent ?? ACCENTS.primary;
        return (
          <Pressable
            key={option.key}
            onPress={() => {
              if (!option.disabled) onChange(option.key);
            }}
            disabled={option.disabled}
            accessibilityRole="tab"
            accessibilityState={{ selected: on, disabled: !!option.disabled }}
            accessibilityLabel={option.label}
            style={[
              styles.tab,
              compact ? styles.tabCompact : styles.tabInline,
              on && { backgroundColor: theme.surfaceLowest },
              on && Shadows.level1,
              option.disabled && { opacity: 0.4 },
            ]}
          >
            {!!option.emoji && <ThemedText style={styles.tabEmoji}>{option.emoji}</ThemedText>}
            <ThemedText
              style={[
                compact ? styles.tabLabelCompact : styles.tabLabel,
                { color: on ? accent.dark : theme.textSecondary, fontFamily: on ? 'Sora_600SemiBold' : 'Sora_500Medium' },
              ]}
              numberOfLines={1}
            >
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Chip ─────────────────────────────────────────────────────────────────────

export function DashboardChip({
  label,
  icon,
  selected,
  disabled = false,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  /** Receives the colour the label is drawn in. */
  icon?: (color: string) => React.ReactNode;
  selected: boolean;
  /** Dimmed but still pressable, so a "coming soon" chip can explain itself. */
  disabled?: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  const theme = useTheme();
  const color = selected ? ACCENTS.primary.dark : theme.textSecondary;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={accessibilityLabel ?? label}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? theme.surfaceLowest : theme.surfaceLow,
          borderColor: selected ? ACCENTS.primary.main + '40' : theme.outlineVariant + '33',
        },
        selected && Shadows.level1,
        disabled && { opacity: 0.45 },
      ]}
    >
      {icon?.(color)}
      <ThemedText
        style={[styles.chipText, { color, fontFamily: selected ? 'Sora_600SemiBold' : 'Sora_500Medium' }]}
        numberOfLines={1}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

// ─── Stepper ──────────────────────────────────────────────────────────────────

/**
 * Wizard steps as segments on the tab track: a finished step shows a green
 * tick, the current one is the raised white segment, later ones stay numbered.
 * `onSelect` decides whether a jump is allowed.
 */
export function DashboardStepper({
  steps,
  current,
  onSelect,
}: {
  steps: string[];
  current: number;
  onSelect: (index: number) => void;
}) {
  const theme = useTheme();
  return (
    <View
      style={[styles.tabs, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '25' }]}
      accessibilityRole="tablist"
    >
      {steps.map((label, idx) => {
        const on = idx === current;
        const done = idx < current;
        const color = on ? ACCENTS.primary.dark : done ? ACCENTS.green.dark : theme.textSecondary;
        return (
          <Pressable
            key={`${label}-${idx}`}
            onPress={() => onSelect(idx)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`Step ${idx + 1} of ${steps.length}: ${label}${done ? ', done' : on ? ', current' : ''}`}
            style={[styles.tab, styles.stepSegment, on && { backgroundColor: theme.surfaceLowest }, on && Shadows.level1]}
          >
            {done ? (
              <Ionicons name="checkmark-circle" size={15} color={ACCENTS.green.main} />
            ) : (
              <View style={[styles.stepNumber, { borderColor: color + '66', backgroundColor: on ? ACCENTS.primary.main + '14' : 'transparent' }]}>
                <ThemedText style={[styles.stepNumberText, { color }]}>{idx + 1}</ThemedText>
              </View>
            )}
            <ThemedText
              style={[styles.tabLabelCompact, { color, fontFamily: on ? 'Sora_600SemiBold' : 'Sora_500Medium' }]}
              numberOfLines={1}
            >
              {label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Stat tiles & progress ────────────────────────────────────────────────────

export function StatTiles({ items }: { items: { value: string; label: string; color?: string }[] }) {
  const theme = useTheme();
  if (items.length === 0) return null;
  return (
    <View style={styles.tileRow}>
      {items.map((item) => (
        <View
          key={item.label}
          accessible
          accessibilityLabel={`${item.label}: ${item.value}`}
          style={[styles.tile, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '1A' }]}
        >
          <ThemedText style={[styles.tileValue, { color: item.color ?? theme.text }]} numberOfLines={1}>
            {item.value}
          </ThemedText>
          <ThemedText style={[styles.tileLabel, { color: theme.textSecondary }]} numberOfLines={1}>
            {item.label}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

export function ProgressPill({
  progress,
  accent,
  label,
  value,
}: {
  /** 0–1. */
  progress: number;
  accent: Accent;
  label?: string;
  value?: string;
}) {
  const theme = useTheme();
  const pct = Math.round(Math.max(0, Math.min(1, progress || 0)) * 100);
  return (
    <View style={styles.progressBlock}>
      {(!!label || !!value) && (
        <View style={styles.progressText}>
          <ThemedText style={[styles.footerText, { color: theme.textSecondary }]} numberOfLines={1}>
            {label}
          </ThemedText>
          <ThemedText style={[styles.footerText, { color: theme.text, fontFamily: 'Sora_500Medium' }]} numberOfLines={1}>
            {value}
          </ThemedText>
        </View>
      )}
      <View
        style={[styles.progressTrack, { backgroundColor: accent.main + '1F' }]}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: pct }}
      >
        <View style={{ width: `${pct}%` as `${number}%`, height: '100%', borderRadius: 3, backgroundColor: accent.main }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Card
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
  footerStatus: { fontFamily: 'Sora_500Medium', flexShrink: 1, textAlign: 'right' },

  // Section label
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', gap: 7, flexShrink: 1 },
  sectionBar: { width: 3.5, height: 14, borderRadius: 2 },
  sectionText: { fontSize: 11.5, fontFamily: 'Sora_700Bold', letterSpacing: 0.9, textTransform: 'uppercase' },

  // Tabs
  tabs: { flexDirection: 'row', borderRadius: BorderRadius.premium, padding: 4, borderWidth: 1, gap: 4 },
  tab: { flex: 1, minWidth: 0, paddingVertical: 8, borderRadius: BorderRadius.md, alignItems: 'center' },
  tabInline: { flexDirection: 'row', justifyContent: 'center', gap: 5, paddingHorizontal: 6 },
  tabCompact: { justifyContent: 'center', paddingHorizontal: 2 },
  tabEmoji: { fontSize: 13 },
  tabLabel: { fontSize: 12 },
  tabLabelCompact: { fontSize: 10, textAlign: 'center' },

  // Stepper
  stepSegment: { justifyContent: 'center', paddingHorizontal: 2, paddingVertical: 6, gap: 3 },
  stepNumber: { width: 15, height: 15, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { fontSize: 8.5, fontFamily: 'Sora_600SemiBold', lineHeight: 11 },

  // Chip
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, height: 30, borderRadius: BorderRadius.md, borderWidth: 1 },
  chipText: { fontSize: 10.5 },

  // Tiles & progress
  tileRow: { flexDirection: 'row', gap: 8 },
  tile: { flex: 1, minWidth: 0, alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4, borderRadius: 10, borderWidth: 1 },
  tileValue: { fontSize: 12, fontFamily: 'Sora_500Medium' },
  tileLabel: { fontSize: 9, fontFamily: 'Sora_500Medium', marginTop: 1 },
  progressBlock: { gap: 5 },
  progressText: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
});
