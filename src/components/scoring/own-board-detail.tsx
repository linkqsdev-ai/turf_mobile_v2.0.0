/**
 * own-board-detail.tsx
 *
 * Building blocks for the Own Board's Match Scorecard and Player Career & Logs
 * sheets, in the Home dashboard's analytics card language: Sora Medium 14
 * titles, accent metrics with tinted tags, icon tiles, and hairline
 * label/value footers — headers and tabs included, so nothing in the Own Board
 * uses a solid blue fill.
 *
 * Presentation only — every figure comes from utils/own-board-display.ts.
 */

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { PressCard } from '@/components/home/dashboard-widgets';
import { DashboardTabs, DashboardSectionLabel, type DashboardTabOption } from '@/components/dashboard/analytics-kit';
import {
  ACCENTS,
  toneAccent,
  type Accent,
  type MatchLogContent,
  type ScoreRow,
} from '@/utils/own-board-display';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const STAR = '#F59E0B';

// ─── Sheet header ─────────────────────────────────────────────────────────────

export function OwnBoardSheetHeader({
  title,
  subtitle,
  tag,
  icon,
  onBack,
  onClose,
}: {
  title: string;
  subtitle: string;
  tag?: string;
  icon: IoniconName;
  /** A back tile replaces the icon tile when the sheet sits on top of another. */
  onBack?: () => void;
  onClose: () => void;
}) {
  const theme = useTheme();
  const accent = ACCENTS.primary;
  return (
    <>
      <View style={[styles.handle, { backgroundColor: theme.outlineVariant + '60' }]} />
      <View style={[styles.headerCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={[styles.headerTile, { backgroundColor: theme.surfaceLow }]}
          >
            <Ionicons name="arrow-back" size={18} color={theme.text} />
          </Pressable>
        ) : (
          <View style={[styles.headerTile, { backgroundColor: accent.main + '1A' }]}>
            <Ionicons name={icon} size={18} color={accent.main} />
          </View>
        )}

        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={styles.headerTitleRow}>
            {onBack && <Ionicons name={icon} size={14} color={accent.main} />}
            <ThemedText style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1} accessibilityRole="header">
              {title}
            </ThemedText>
          </View>
          <View style={styles.metricRow}>
            <ThemedText style={[styles.metric, { color: accent.main }]} numberOfLines={1}>{subtitle}</ThemedText>
            {!!tag && (
              <View style={[styles.tag, { backgroundColor: accent.main + '1F' }]}>
                <ThemedText style={[styles.tagText, { color: accent.dark }]} numberOfLines={1}>{tag}</ThemedText>
              </View>
            )}
          </View>
        </View>

        <Pressable
          onPress={onClose}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={[styles.headerClose, { backgroundColor: theme.surfaceLow }]}
        >
          <Ionicons name="close" size={18} color={theme.textSecondary} />
        </Pressable>
      </View>
    </>
  );
}

// ─── Board tabs & section label ───────────────────────────────────────────────

/** The shared dashboard tabs, inset for a sheet. */
export function OwnBoardTabs<K extends string>(props: {
  options: DashboardTabOption<K>[];
  active: K;
  onChange: (key: K) => void;
}) {
  return <DashboardTabs {...props} style={styles.tabsInset} />;
}

/** The shared dashboard section label, spaced for a sheet. */
export function OwnBoardSectionLabel({ label, color }: { label: string; color: string }) {
  return <DashboardSectionLabel label={label} color={color} style={styles.sectionInset} />;
}

// ─── Innings tabs ─────────────────────────────────────────────────────────────

export function InningsTabs({
  options,
  active,
  onChange,
}: {
  options: { key: 1 | 2; title: string; subtitle: string }[];
  active: 1 | 2;
  onChange: (key: 1 | 2) => void;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.tabs, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '25' }]} accessibilityRole="tablist">
      {options.map((option) => {
        const on = option.key === active;
        return (
          <Pressable
            key={option.key}
            onPress={() => onChange(option.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${option.title}, ${option.subtitle}`}
            style={[styles.tab, on && { backgroundColor: theme.surfaceLowest }, on && Shadows.level1]}
          >
            <ThemedText style={[styles.tabTitle, { color: theme.textSecondary }]} numberOfLines={1}>
              {option.title}
            </ThemedText>
            <ThemedText style={[styles.tabSubtitle, { color: on ? ACCENTS.primary.dark : theme.text }]} numberOfLines={1}>
              {option.subtitle}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Score table ──────────────────────────────────────────────────────────────

export function ScoreTable({
  firstColumn,
  columns,
  rows,
  accent,
  emphasis,
  emptyLabel,
}: {
  firstColumn: string;
  columns: string[];
  rows: ScoreRow[];
  accent: Accent;
  /** Index into `columns` drawn in the accent — runs for batting, wickets for bowling. */
  emphasis: number;
  emptyLabel: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.table}>
      <View style={[styles.tableHead, { borderBottomColor: theme.outlineVariant + '1A' }]}>
        <ThemedText style={[styles.headCell, styles.nameCell, { color: theme.textSecondary }]}>{firstColumn}</ThemedText>
        {columns.map((column) => (
          <ThemedText key={column} style={[styles.headCell, styles.numCell, { color: theme.textSecondary }]}>{column}</ThemedText>
        ))}
      </View>

      {rows.length === 0 ? (
        <ThemedText style={[styles.empty, { color: theme.textSecondary }]}>{emptyLabel}</ThemedText>
      ) : (
        rows.map((row, i) => (
          <View
            key={row.key}
            accessible
            accessibilityLabel={`${row.title}, ${row.subtitle}. ${columns.map((c, idx) => `${c} ${row.cells[idx]}`).join(', ')}`}
            style={[
              styles.tableRow,
              i < rows.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.outlineVariant + '14' },
              row.highlight && { backgroundColor: accent.main + '0F' },
            ]}
          >
            <View style={styles.nameCell}>
              <ThemedText
                style={[styles.rowTitle, { color: theme.text, fontFamily: row.highlight ? 'Sora_600SemiBold' : 'Sora_500Medium' }]}
                numberOfLines={1}
              >
                {row.title}
              </ThemedText>
              <ThemedText style={[styles.rowSubtitle, { color: theme.textSecondary }]} numberOfLines={1}>{row.subtitle}</ThemedText>
            </View>
            {row.cells.map((cell, c) => (
              <ThemedText
                key={`${row.key}-${c}`}
                style={[
                  styles.numCell,
                  styles.cell,
                  { color: c === emphasis ? accent.dark : theme.text, fontFamily: c === emphasis ? 'Sora_600SemiBold' : 'Sora_500Medium' },
                ]}
                numberOfLines={1}
              >
                {cell}
              </ThemedText>
            ))}
          </View>
        ))
      )}
    </View>
  );
}

// ─── Player profile ───────────────────────────────────────────────────────────

export function PlayerProfileCard({
  name,
  avatar,
  metric,
  tag,
  footer,
}: {
  name: string;
  avatar: React.ReactNode;
  metric: string;
  tag: string;
  footer: { label: string; value: string; status: string };
}) {
  const theme = useTheme();
  const accent = ACCENTS.primary;
  return (
    <View
      accessible
      accessibilityLabel={`${name}. ${metric}. ${tag}. ${footer.label} ${footer.value}. ${footer.status}`}
      style={[styles.card, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}
    >
      <View style={styles.header}>
        <View style={[styles.avatarRing, { borderColor: accent.main + '45' }]}>{avatar}</View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <ThemedText style={[styles.title, { color: theme.text }]} numberOfLines={1}>{name}</ThemedText>
          <View style={styles.metricRow}>
            <ThemedText style={[styles.metric, { color: accent.main }]} numberOfLines={1}>{metric}</ThemedText>
            <View style={[styles.tag, { backgroundColor: accent.main + '1F' }]}>
              <ThemedText style={[styles.tagText, { color: accent.dark }]} numberOfLines={1}>{tag}</ThemedText>
            </View>
          </View>
        </View>
        <View style={[styles.iconTile, { backgroundColor: accent.main + '1A' }]}>
          <Ionicons name="person" size={18} color={accent.main} />
        </View>
      </View>

      <View style={[styles.footer, { borderTopColor: theme.outlineVariant + '1A' }]}>
        <ThemedText style={[styles.footerText, { color: theme.textSecondary }]} numberOfLines={1}>
          {footer.label}:{' '}
          <ThemedText style={[styles.footerText, { color: theme.text, fontFamily: 'Sora_500Medium' }]}>{footer.value}</ThemedText>
        </ThemedText>
        <ThemedText style={[styles.footerText, styles.linkText, { color: accent.dark }]} numberOfLines={1}>{footer.status}</ThemedText>
      </View>
    </View>
  );
}

// ─── Match log ────────────────────────────────────────────────────────────────

function LogRow({ kind, accent, line, note }: { kind: string; accent: Accent; line: string; note: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.logRow, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '1A' }]}>
      <View style={[styles.kindPill, { backgroundColor: accent.main + '1F' }]}>
        <ThemedText style={[styles.kindText, { color: accent.dark }]}>{kind}</ThemedText>
      </View>
      <ThemedText style={[styles.logLine, { color: theme.text }]} numberOfLines={1}>{line}</ThemedText>
      <ThemedText style={[styles.logNote, { color: theme.textSecondary }]} numberOfLines={1}>{note}</ThemedText>
    </View>
  );
}

export function MatchLogCard({ log, onScorecard }: { log: MatchLogContent; onScorecard: () => void }) {
  const theme = useTheme();
  const accent = toneAccent(log.result.tone);
  const iconTint = log.isMOTM ? STAR : theme.primary;

  return (
    <PressCard
      onPress={onScorecard}
      scaleTo={0.98}
      accessibilityLabel={`${log.title}. ${log.result.label}. ${log.date}.${log.batting ? ` Batting ${log.batting.line}.` : ''}${log.bowling ? ` Bowling ${log.bowling.line}.` : ''}${log.isMOTM ? ' Player of the match.' : ''}`}
      style={[styles.card, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}
    >
      <View style={styles.header}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <ThemedText style={[styles.title, { color: theme.text }]} numberOfLines={1}>{log.title}</ThemedText>
          <View style={styles.metricRow}>
            <ThemedText style={[styles.metric, { color: accent.main }]} numberOfLines={1}>{log.result.label}</ThemedText>
            <View style={[styles.tag, { backgroundColor: accent.main + '1F' }]}>
              <ThemedText style={[styles.tagText, { color: accent.dark }]} numberOfLines={1}>📅 {log.date}</ThemedText>
            </View>
          </View>
        </View>
        <View style={[styles.iconTile, { backgroundColor: iconTint + '1A' }]}>
          <Ionicons name={log.isMOTM ? 'star' : 'baseball-outline'} size={18} color={iconTint} />
        </View>
      </View>

      <View style={styles.logRows}>
        {log.batting && <LogRow kind="BAT" accent={ACCENTS.green} line={log.batting.line} note={log.batting.note} />}
        {log.bowling && <LogRow kind="BOWL" accent={ACCENTS.orange} line={log.bowling.line} note={log.bowling.note} />}
        {!log.batting && !log.bowling && (
          <ThemedText style={[styles.footerText, { color: theme.textSecondary }]}>Played without batting or bowling</ThemedText>
        )}
      </View>

      <View style={[styles.footer, { borderTopColor: theme.outlineVariant + '1A' }]}>
        <ThemedText
          style={[
            styles.footerText,
            { flex: 1, color: log.isMOTM ? '#B45309' : theme.textSecondary, fontFamily: log.isMOTM ? 'Sora_500Medium' : 'Sora_400Regular' },
          ]}
          numberOfLines={1}
        >
          {log.isMOTM ? '⭐ Player of the match' : log.batting ? `Batting: ${log.batting.status}` : 'Bowled in this match'}
        </ThemedText>
        <Pressable
          onPress={onScorecard}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={`Open the scorecard for ${log.title}`}
          style={styles.link}
        >
          <ThemedText style={[styles.footerText, styles.linkText, { color: theme.primary }]}>Scorecard</ThemedText>
          <Ionicons name="chevron-forward" size={12} color={theme.primary} />
        </Pressable>
      </View>
    </PressCard>
  );
}

const styles = StyleSheet.create({
  // Sheet header — the dashboard analytics card header
  handle: { width: 40, height: 4.5, borderRadius: 3, alignSelf: 'center', marginTop: 10, marginBottom: 2 },
  headerCard: {
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: BorderRadius.premium,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTile: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 15, fontFamily: 'Sora_500Medium', letterSpacing: 0.3, flexShrink: 1 },
  headerClose: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

  // Section label spacing
  sectionInset: { marginTop: 4 },

  // Tabs — grey track, raised white active segment
  tabs: { flexDirection: 'row', borderRadius: BorderRadius.premium, padding: 4, borderWidth: 1, gap: 4 },
  tabsInset: { marginHorizontal: 16, marginTop: 12, marginBottom: 2 },
  tab: { flex: 1, minWidth: 0, paddingVertical: 8, paddingHorizontal: 6, borderRadius: BorderRadius.md, alignItems: 'center' },
  tabTitle: { fontSize: 10, fontFamily: 'Sora_500Medium' },
  tabSubtitle: { fontSize: 12.5, fontFamily: 'Sora_600SemiBold', marginTop: 1 },

  // Score table
  table: { marginTop: 4 },
  tableHead: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingBottom: 6, borderBottomWidth: 1 },
  headCell: { fontSize: 9, fontFamily: 'Sora_600SemiBold', letterSpacing: 0.5, textTransform: 'uppercase' },
  nameCell: { flex: 3.2, minWidth: 0 },
  numCell: { flex: 1, textAlign: 'right' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 8, borderRadius: 8 },
  rowTitle: { fontSize: 12 },
  rowSubtitle: { fontSize: 9.5, fontFamily: 'Sora_400Regular', marginTop: 1 },
  cell: { fontSize: 11.5 },
  empty: { fontSize: 11, fontFamily: 'Sora_400Regular', textAlign: 'center', paddingVertical: 14 },

  // Shared card — the Home analytics card
  card: { borderRadius: BorderRadius.premium, borderWidth: 1, padding: 16, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarRing: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
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

  // Match log rows
  logRows: { gap: 8 },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1 },
  kindPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  kindText: { fontSize: 9, fontFamily: 'Sora_600SemiBold', letterSpacing: 0.5 },
  logLine: { fontSize: 12, fontFamily: 'Sora_500Medium' },
  logNote: { flex: 1, minWidth: 0, fontSize: 10, fontFamily: 'Sora_400Regular', textAlign: 'right' },
});
