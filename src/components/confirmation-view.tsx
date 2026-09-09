import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Pressable, Platform, Clipboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * confirmation-view.tsx
 *
 * The "you're confirmed" screen: ringed tick, a copyable reference, a dashed
 * receipt of detail rows, a money summary and two actions.
 *
 * Written once and shared. Turf booking had this design; tournament
 * registration had a different, thinner one built inline — so the same moment
 * in the product looked like two different products, and the tournament copy
 * showed hard-coded amounts.
 */

export interface ConfirmationInfoRow {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}

export interface ConfirmationAction {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}

export interface ConfirmationViewProps {
  title: string;
  subtitle: string;
  /** Reference shown large and copyable, e.g. a booking or registration ref. */
  referenceLabel: string;
  reference: string;
  infoRows?: ConfirmationInfoRow[];
  /** Itemised money lines rendered above the total. */
  breakdown?: { label: string; value: string }[];
  leftSummary?: { label: string; value: string };
  rightSummary?: { label: string; value: string };
  notice?: string;
  /** Optional highlight card above the receipt (e.g. cashback). */
  highlight?: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string };
  secondaryAction?: ConfirmationAction;
  primaryAction: ConfirmationAction;
}

export function ConfirmationView({
  title,
  subtitle,
  referenceLabel,
  reference,
  infoRows = [],
  breakdown = [],
  leftSummary,
  rightSummary,
  notice,
  highlight,
  secondaryAction,
  primaryAction,
}: ConfirmationViewProps) {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(reference);
      } else {
        Clipboard.setString(reference);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard unavailable; the reference is still on screen to read.
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={styles.outerRing}>
            <View style={styles.middleRing}>
              <View style={[styles.innerCircle, { backgroundColor: '#10b981' }, Shadows.level3]}>
                <Ionicons name="checkmark" size={36} color="#ffffff" />
              </View>
            </View>
          </View>

          <ThemedText style={[styles.heroTitle, { color: theme.text }]}>{title}</ThemedText>
          <ThemedText style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
            {subtitle}
          </ThemedText>
        </View>

        {highlight && (
          <View style={[styles.highlightCard, { backgroundColor: '#10b98114', borderColor: '#10b98144' }]}>
            <View style={[styles.highlightIconBg, { backgroundColor: '#10b981' }]}>
              <Ionicons name={highlight.icon} size={18} color="#ffffff" />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.highlightTitle}>{highlight.title}</ThemedText>
              <ThemedText style={styles.highlightSub}>{highlight.subtitle}</ThemedText>
            </View>
          </View>
        )}

        <View
          style={[
            styles.ticketCard,
            { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' },
            Shadows.level2,
          ]}
        >
          <View style={styles.refRow}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <ThemedText style={[styles.refLabel, { color: theme.textSecondary }]}>
                {referenceLabel}
              </ThemedText>
              <ThemedText style={[styles.refValue, { color: theme.primary }]} numberOfLines={1}>
                {reference}
              </ThemedText>
            </View>
            <Pressable
              onPress={handleCopy}
              accessibilityRole="button"
              accessibilityLabel={`Copy reference ${reference}`}
              style={[styles.copyBtn, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '44' }]}
            >
              <Ionicons
                name={copied ? 'checkmark' : 'copy-outline'}
                size={13}
                color={copied ? '#10b981' : theme.textSecondary}
              />
              <ThemedText style={[styles.copyBtnText, { color: copied ? '#10b981' : theme.textSecondary }]}>
                {copied ? 'Copied' : 'Copy'}
              </ThemedText>
            </Pressable>
          </View>

          {infoRows.length > 0 && (
            <>
              <View style={[styles.dashedDivider, { borderColor: theme.outlineVariant + '44' }]} />
              <View style={styles.infoList}>
                {infoRows.map((row, i) => (
                  <View key={`${row.label}-${i}`} style={styles.infoRow}>
                    <View style={[styles.iconPill, { backgroundColor: theme.primary + '14' }]}>
                      <Ionicons name={row.icon} size={15} color={theme.primary} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>
                        {row.label}
                      </ThemedText>
                      <ThemedText style={[styles.infoValue, { color: theme.text }]} numberOfLines={2}>
                        {row.value}
                      </ThemedText>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          {breakdown.length > 0 && (
            <>
              <View style={[styles.dashedDivider, { borderColor: theme.outlineVariant + '44' }]} />
              <View style={styles.breakdown}>
                {breakdown.map((line, i) => (
                  <View key={`${line.label}-${i}`} style={styles.breakdownRow}>
                    <ThemedText style={[styles.breakdownLabel, { color: theme.textSecondary }]}>
                      {line.label}
                    </ThemedText>
                    <ThemedText style={[styles.breakdownValue, { color: theme.text }]}>
                      {line.value}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </>
          )}

          {(leftSummary || rightSummary) && (
            <>
              <View style={[styles.dashedDivider, { borderColor: theme.outlineVariant + '44' }]} />
              <View style={styles.priceRow}>
                {leftSummary ? (
                  <View>
                    <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>
                      {leftSummary.label}
                    </ThemedText>
                    <ThemedText style={[styles.paidAmount, { color: '#10b981' }]}>
                      {leftSummary.value}
                    </ThemedText>
                  </View>
                ) : <View />}

                {rightSummary && (
                  <View style={{ alignItems: 'flex-end' }}>
                    <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>
                      {rightSummary.label}
                    </ThemedText>
                    <ThemedText style={[styles.totalAmount, { color: theme.text }]}>
                      {rightSummary.value}
                    </ThemedText>
                  </View>
                )}
              </View>
            </>
          )}
        </View>

        {!!notice && (
          <View style={[styles.noticeCard, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33' }]}>
            <Ionicons name="information-circle" size={18} color={theme.primary} style={{ marginTop: 1 }} />
            <ThemedText style={[styles.noticeText, { color: theme.textSecondary }]}>{notice}</ThemedText>
          </View>
        )}
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          { backgroundColor: theme.surfaceLowest, borderTopColor: theme.outlineVariant + '33' },
          Shadows.level2,
        ]}
      >
        {secondaryAction && (
          <Pressable
            onPress={secondaryAction.onPress}
            accessibilityRole="button"
            style={[styles.outlineBtn, { borderColor: theme.outlineVariant + '88' }]}
          >
            <Ionicons name={secondaryAction.icon} size={16} color={theme.text} />
            <ThemedText style={[styles.outlineBtnText, { color: theme.text }]}>
              {secondaryAction.label}
            </ThemedText>
          </Pressable>
        )}

        <Pressable
          onPress={primaryAction.onPress}
          accessibilityRole="button"
          style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
        >
          <Ionicons name={primaryAction.icon} size={16} color="#ffffff" />
          <ThemedText style={styles.primaryBtnText}>{primaryAction.label}</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.containerMargin, paddingTop: 24, paddingBottom: 130 },

  heroSection: { alignItems: 'center', marginBottom: 24 },
  outerRing: {
    width: 116, height: 116, borderRadius: 58,
    backgroundColor: '#10b98114', alignItems: 'center', justifyContent: 'center',
  },
  middleRing: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#10b98122', alignItems: 'center', justifyContent: 'center',
  },
  innerCircle: { width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontSize: 19, fontFamily: 'Sora_500Medium', marginTop: 18, textAlign: 'center' },
  heroSubtitle: {
    fontSize: 12.5, lineHeight: 18, fontFamily: 'Sora_400Regular',
    marginTop: 6, textAlign: 'center', paddingHorizontal: 20,
  },

  highlightCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: BorderRadius.lg, borderWidth: 1, padding: 14, marginBottom: 16,
  },
  highlightIconBg: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  highlightTitle: { fontSize: 13, fontFamily: 'Sora_500Medium', color: '#047857' },
  highlightSub: { fontSize: 11, fontFamily: 'Sora_400Regular', color: '#059669', marginTop: 2 },

  ticketCard: { borderRadius: BorderRadius.lg, borderWidth: 1, padding: 16 },
  refRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  refLabel: { fontSize: 9.5, fontFamily: 'Sora_400Regular', letterSpacing: 0.6 },
  refValue: { fontSize: 16, fontFamily: 'Sora_500Medium', marginTop: 2 },
  copyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 0,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: BorderRadius.full, borderWidth: 1,
  },
  copyBtnText: { fontSize: 10.5, fontFamily: 'Sora_500Medium' },

  dashedDivider: { borderTopWidth: 1, borderStyle: 'dashed', marginVertical: 14 },

  infoList: { gap: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconPill: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  infoLabel: { fontSize: 9.5, fontFamily: 'Sora_400Regular', letterSpacing: 0.6 },
  infoValue: { fontSize: 13, lineHeight: 18, fontFamily: 'Sora_500Medium', marginTop: 2 },

  breakdown: { gap: 9 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  breakdownLabel: { fontSize: 12, fontFamily: 'Sora_400Regular', flexShrink: 1 },
  breakdownValue: { fontSize: 12, fontFamily: 'Sora_500Medium', flexShrink: 0 },

  priceRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 },
  paidAmount: { fontSize: 17, fontFamily: 'Sora_500Medium', marginTop: 2 },
  totalAmount: { fontSize: 17, fontFamily: 'Sora_500Medium', marginTop: 2 },

  noticeCard: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    borderRadius: BorderRadius.lg, borderWidth: 1, padding: 13, marginTop: 16,
  },
  noticeText: { flex: 1, fontSize: 11.5, lineHeight: 17, fontFamily: 'Sora_400Regular' },

  bottomBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    flexDirection: 'row', gap: 10, borderTopWidth: 1,
    paddingHorizontal: Spacing.containerMargin, paddingTop: 12, paddingBottom: 26,
  },
  outlineBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    height: 48, borderRadius: BorderRadius.full, borderWidth: 1,
  },
  outlineBtnText: { fontSize: 13, fontFamily: 'Sora_500Medium' },
  primaryBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    height: 48, borderRadius: BorderRadius.full,
  },
  primaryBtnText: { color: '#ffffff', fontSize: 13, fontFamily: 'Sora_500Medium' },
});
