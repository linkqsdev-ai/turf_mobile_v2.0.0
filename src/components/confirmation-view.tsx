import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Pressable, Platform, Clipboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * confirmation-view.tsx
 *
 * The "you're confirmed" screen: ringed tick, a copyable reference, a
 * perforated receipt of detail rows, a money summary and two actions.
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
  /** Optional custom content rendered above the receipt (e.g. Cashback Output Card). */
  extraContent?: React.ReactNode;
  secondaryAction?: ConfirmationAction;
  primaryAction: ConfirmationAction;
}

const SUCCESS = '#10b981';

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
  extraContent,
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

  // Punched notches on both edges with a dashed tear line — the receipt reads
  // as a ticket, matching the dashboard voucher tickets.
  const perforation = (
    <View style={styles.perforation}>
      <View style={[styles.notch, styles.notchLeft, { backgroundColor: theme.background }]} />
      <View style={[styles.tearLine, { borderColor: theme.outlineVariant + '88' }]} />
      <View style={[styles.notch, styles.notchRight, { backgroundColor: theme.background }]} />
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={styles.outerRing}>
            <View style={styles.middleRing}>
              <View style={[styles.innerCircle, { backgroundColor: SUCCESS }, Shadows.level3]}>
                <Ionicons name="checkmark" size={26} color="#ffffff" />
              </View>
            </View>
          </View>

          <View style={[styles.statusPill, { backgroundColor: SUCCESS + '1A' }]}>
            <View style={[styles.statusDot, { backgroundColor: SUCCESS }]} />
            <ThemedText style={[styles.statusText, { color: '#047857' }]}>Confirmed</ThemedText>
          </View>
          <ThemedText style={[styles.heroTitle, { color: theme.text }]}>{title}</ThemedText>
          <ThemedText style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
            {subtitle}
          </ThemedText>
        </View>

        {highlight && (
          <View style={[styles.highlightCard, { backgroundColor: SUCCESS + '12', borderColor: SUCCESS + '40' }]}>
            <View style={[styles.highlightIconBg, { backgroundColor: SUCCESS }]}>
              <Ionicons name={highlight.icon} size={16} color="#ffffff" />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.highlightTitle}>{highlight.title}</ThemedText>
              <ThemedText style={styles.highlightSub}>{highlight.subtitle}</ThemedText>
            </View>
          </View>
        )}

        {extraContent}

        <View
          style={[
            styles.ticketCard,
            { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' },
            Shadows.level2,
          ]}
        >
          <View style={styles.refRow}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <ThemedText style={[styles.microLabel, { color: theme.textSecondary }]}>
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
              style={[
                styles.copyBtn,
                copied
                  ? { backgroundColor: SUCCESS + '14', borderColor: SUCCESS + '44' }
                  : { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '44' },
              ]}
            >
              <Ionicons
                name={copied ? 'checkmark' : 'copy-outline'}
                size={13}
                color={copied ? SUCCESS : theme.textSecondary}
              />
              <ThemedText style={[styles.copyBtnText, { color: copied ? SUCCESS : theme.textSecondary }]}>
                {copied ? 'Copied' : 'Copy'}
              </ThemedText>
            </Pressable>
          </View>

          {infoRows.length > 0 && (
            <>
              {perforation}
              <View style={styles.infoList}>
                {infoRows.map((row, i) => (
                  <View key={`${row.label}-${i}`} style={styles.infoRow}>
                    <View style={[styles.iconPill, { backgroundColor: theme.primary + '14' }]}>
                      <Ionicons name={row.icon} size={14} color={theme.primary} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <ThemedText style={[styles.microLabel, { color: theme.textSecondary }]}>
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
              {perforation}
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
              {perforation}
              <View style={[styles.priceRow, { backgroundColor: theme.surfaceLow }]}>
                {leftSummary ? (
                  <View>
                    <ThemedText style={[styles.microLabel, { color: theme.textSecondary }]}>
                      {leftSummary.label}
                    </ThemedText>
                    <ThemedText style={[styles.paidAmount, { color: '#047857' }]}>
                      {leftSummary.value}
                    </ThemedText>
                  </View>
                ) : <View />}

                {rightSummary && (
                  <View style={{ alignItems: 'flex-end' }}>
                    <ThemedText style={[styles.microLabel, { color: theme.textSecondary }]}>
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
          <View style={[styles.noticeCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
            <View style={[styles.noticeIcon, { backgroundColor: theme.primary + '14' }]}>
              <Ionicons name="information" size={14} color={theme.primary} />
            </View>
            <ThemedText style={[styles.noticeText, { color: theme.textSecondary }]}>{notice}</ThemedText>
          </View>
        )}
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          { backgroundColor: theme.surfaceLowest, borderTopColor: theme.outlineVariant + '33' },
        ]}
      >
        {secondaryAction && (
          <Pressable
            onPress={secondaryAction.onPress}
            accessibilityRole="button"
            style={({ pressed }) => [styles.outlineBtn, { borderColor: theme.outlineVariant + '88', opacity: pressed ? 0.85 : 1 }]}
          >
            <Ionicons name={secondaryAction.icon} size={15} color={theme.text} />
            <ThemedText style={[styles.outlineBtnText, { color: theme.text }]}>
              {secondaryAction.label}
            </ThemedText>
          </Pressable>
        )}

        <Pressable
          onPress={primaryAction.onPress}
          accessibilityRole="button"
          style={({ pressed }) => [styles.primaryBtn, { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 }, Shadows.level2]}
        >
          <Ionicons name={primaryAction.icon} size={15} color="#ffffff" />
          <ThemedText style={styles.primaryBtnText}>{primaryAction.label}</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const CARD_PADDING = 16;
const NOTCH = 18;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.containerMargin, paddingTop: 22, paddingBottom: 130 },

  heroSection: { alignItems: 'center', marginBottom: 20 },
  outerRing: {
    width: 104, height: 104, borderRadius: 52,
    backgroundColor: SUCCESS + '14', alignItems: 'center', justifyContent: 'center',
  },
  middleRing: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: SUCCESS + '22', alignItems: 'center', justifyContent: 'center',
  },
  innerCircle: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center' },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 16,
    paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontFamily: 'Sora_500Medium', fontSize: 8.5, letterSpacing: 0.8, textTransform: 'uppercase' },
  heroTitle: { fontSize: 15, fontFamily: 'Sora_500Medium', marginTop: 8, textAlign: 'center' },
  heroSubtitle: {
    fontSize: 11.5, lineHeight: 16, fontFamily: 'Sora_400Regular',
    marginTop: 4, textAlign: 'center', paddingHorizontal: 20,
  },

  highlightCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: BorderRadius.premium, borderWidth: 1, padding: 12, marginBottom: 14,
  },
  highlightIconBg: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  highlightTitle: { fontSize: 12.5, fontFamily: 'Sora_500Medium', color: '#047857' },
  highlightSub: { fontSize: 10.5, fontFamily: 'Sora_400Regular', color: '#059669', marginTop: 1 },

  ticketCard: { borderRadius: 20, borderWidth: 1, padding: CARD_PADDING, overflow: 'hidden' },
  refRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  microLabel: { fontSize: 8.5, fontFamily: 'Sora_500Medium', letterSpacing: 0.7, textTransform: 'uppercase' },
  refValue: { fontSize: 14.5, fontFamily: 'Sora_500Medium', marginTop: 2, letterSpacing: 0.3 },
  copyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0,
    height: 30, paddingHorizontal: 11, borderRadius: 999, borderWidth: 1,
  },
  copyBtnText: { fontSize: 10.5, fontFamily: 'Sora_500Medium' },

  perforation: {
    flexDirection: 'row', alignItems: 'center', height: NOTCH,
    marginHorizontal: -CARD_PADDING, marginVertical: 12,
  },
  notch: { width: NOTCH, height: NOTCH, borderRadius: NOTCH / 2 },
  notchLeft: { marginLeft: -NOTCH / 2 },
  notchRight: { marginRight: -NOTCH / 2 },
  tearLine: { flex: 1, borderTopWidth: 1.5, borderStyle: 'dashed', marginHorizontal: 6 },

  infoList: { gap: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconPill: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  infoValue: { fontSize: 12.5, lineHeight: 17, fontFamily: 'Sora_500Medium', marginTop: 1 },

  breakdown: { gap: 8 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  breakdownLabel: { fontSize: 11, fontFamily: 'Sora_400Regular', flexShrink: 1 },
  breakdownValue: { fontSize: 11.5, fontFamily: 'Sora_500Medium', flexShrink: 0 },

  priceRow: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10,
    borderRadius: BorderRadius.premium, paddingHorizontal: 12, paddingVertical: 10,
  },
  paidAmount: { fontSize: 14.5, fontFamily: 'Sora_500Medium', marginTop: 2 },
  totalAmount: { fontSize: 14.5, fontFamily: 'Sora_500Medium', marginTop: 2 },

  noticeCard: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    borderRadius: BorderRadius.premium, borderWidth: 1, padding: 12, marginTop: 14,
  },
  noticeIcon: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  noticeText: { flex: 1, fontSize: 11, lineHeight: 16, fontFamily: 'Sora_400Regular' },

  bottomBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    flexDirection: 'row', gap: 10, borderTopWidth: 1,
    paddingHorizontal: Spacing.containerMargin, paddingTop: 12, paddingBottom: 26,
  },
  outlineBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    height: 48, borderRadius: 999, borderWidth: 1,
  },
  outlineBtnText: { fontSize: 12.5, fontFamily: 'Sora_500Medium' },
  primaryBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    height: 48, borderRadius: 999,
  },
  primaryBtnText: { color: '#ffffff', fontSize: 12.5, fontFamily: 'Sora_500Medium' },
});
