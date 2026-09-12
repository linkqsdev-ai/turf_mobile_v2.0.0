/**
 * own-board-analytics.tsx
 *
 * The Own Board's summary chart, built to the Home dashboard's analytics card
 * (app/(tabs)/index.tsx — "Weekly Coached Hours"): a title, an accent metric
 * with a tinted tag, an icon tile, pill bars over dashed guides with the
 * leaders in full accent, and a label/value footer with a status on the right.
 *
 * What it shows comes from utils/own-board-display.ts (battingSummary etc.).
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { AnalyticsSummary } from '@/utils/own-board-display';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export function OwnBoardAnalyticsCard({
  title,
  metric,
  tag,
  icon,
  accent,
  bars,
  footer,
  children,
}: AnalyticsSummary & {
  /** Extra content between the chart and the footer, e.g. a scorecard table. */
  children?: React.ReactNode;
}) {
  const theme = useTheme();
  const max = Math.max(1, ...bars.map((b) => b.value));

  return (
    <View
      // Read as one summary only when there's nothing inside; a scorecard table
      // in `children` must stay navigable row by row.
      accessible={!children}
      accessibilityLabel={
        children
          ? undefined
          : `${title}. ${metric}. ${bars.map((b) => `${b.label} ${b.display}`).join(', ')}. ${footer.label} ${footer.value}. ${footer.status}`
      }
      style={[styles.card, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <ThemedText style={[styles.title, { color: theme.text }]} numberOfLines={1}>{title}</ThemedText>
          <View style={styles.metricRow}>
            <ThemedText style={[styles.metric, { color: accent.main }]} numberOfLines={1}>{metric}</ThemedText>
            {!!tag && (
              <View style={[styles.tag, { backgroundColor: accent.main + '1F' }]}>
                <ThemedText style={[styles.tagText, { color: accent.dark }]} numberOfLines={1}>{tag}</ThemedText>
              </View>
            )}
          </View>
        </View>
        <View style={[styles.iconTile, { backgroundColor: accent.main + '1A' }]}>
          <Ionicons name={icon as IoniconName} size={18} color={accent.main} />
        </View>
      </View>

      {/* Dashed guides and pill bars — skipped when there is nothing to chart */}
      {bars.length > 0 && (
        <View style={styles.chart}>
          <View style={[styles.guide, { top: 12, borderColor: theme.outlineVariant + '30' }]} />
          <View style={[styles.guide, { top: 52, borderColor: theme.outlineVariant + '30' }]} />
          <View style={styles.bars}>
            {bars.map((bar, idx) => {
              const height = Math.max(16, Math.round((bar.value / max) * 70));
              return (
                <View key={`${bar.label}-${idx}`} style={styles.barColumn}>
                  <ThemedText style={[styles.barValue, { color: bar.active ? accent.dark : theme.textSecondary }]} numberOfLines={1}>
                    {bar.display}
                  </ThemedText>
                  <View style={{ height, width: 20, borderRadius: 10, backgroundColor: bar.active ? accent.main : accent.main + '38' }} />
                  <ThemedText
                    style={[
                      styles.barLabel,
                      { color: bar.active ? theme.text : theme.textSecondary, fontFamily: bar.active ? 'Sora_600SemiBold' : 'Sora_500Medium' },
                    ]}
                    numberOfLines={1}
                  >
                    {bar.label}
                  </ThemedText>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {children}

      {/* Summary footer */}
      <View style={[styles.footer, { borderTopColor: theme.outlineVariant + '1A' }]}>
        <ThemedText style={[styles.footerText, { color: theme.textSecondary }]} numberOfLines={1}>
          {footer.label}:{' '}
          <ThemedText style={[styles.footerText, { color: theme.text, fontFamily: 'Sora_500Medium' }]}>{footer.value}</ThemedText>
        </ThemedText>
        <ThemedText style={[styles.footerText, styles.footerStatus, { color: accent.dark }]} numberOfLines={1}>
          {footer.status}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: BorderRadius.premium, borderWidth: 1, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: Spacing.sm },
  title: { fontSize: 14, fontFamily: 'Sora_500Medium', letterSpacing: 0.5 },
  metricRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 },
  metric: { fontSize: 12, fontFamily: 'Sora_500Medium' },
  tag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, flexShrink: 1 },
  tagText: { fontSize: 9, fontFamily: 'Sora_500Medium' },
  iconTile: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  chart: { position: 'relative', marginTop: 16, marginBottom: 8, height: 115 },
  guide: { position: 'absolute', left: 0, right: 0, borderWidth: 0.5, borderStyle: 'dashed' },
  bars: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 115 },
  barColumn: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  barValue: { fontSize: 9, fontFamily: 'Sora_500Medium', marginBottom: 4 },
  barLabel: { marginTop: 6, fontSize: 10 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  footerText: { fontSize: 10 },
  footerStatus: { fontFamily: 'Sora_500Medium', flexShrink: 1, textAlign: 'right' },
});
