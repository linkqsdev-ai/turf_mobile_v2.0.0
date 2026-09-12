/**
 * owner-earnings.tsx
 *
 * The owner's money view: every booking's payment, where it sits in the 24-hour
 * escrow, and a downloadable statement for each.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { GradientContainer } from '@/components/gradient-container';
import { BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/context/ToastContext';
import { useBookings } from '@/store/app-store';
import {
  HOLD_PERIOD_HOURS,
  computeSettlement,
  escrowStatus,
  formatTimeUntilRelease,
  money,
  type PayoutStatus,
} from '@/lib/settlement';
import { exportInvoicePDF, invoiceNumberFor } from '@/services/payout-invoice';
import { type PayeeProfile } from '@/store/payout-store';
import { type Booking } from '@/store/booking-store';
import {
  DashboardCard,
  DashboardSectionLabel,
  ProgressPill,
  StatTiles,
} from '@/components/dashboard/analytics-kit';
import { ACCENTS, type Accent } from '@/constants/dashboard-accents';

const PROFILE_KEY = '@turf_payout_profile';

interface EarningRow {
  booking: Booking;
  settlement: ReturnType<typeof computeSettlement>;
  status: PayoutStatus;
}

interface Totals {
  inEscrow: number;
  crediting: number;
  credited: number;
}

const STATUS_META: Record<
  string,
  { label: string; emoji: string; accent: Accent; icon: keyof typeof Ionicons.glyphMap }
> = {
  held: { label: 'In escrow', emoji: '⏳', accent: ACCENTS.orange, icon: 'time-outline' },
  payable: { label: 'Crediting', emoji: '🔄', accent: ACCENTS.primary, icon: 'sync-outline' },
  processing: { label: 'Processing', emoji: '🔄', accent: ACCENTS.primary, icon: 'sync-outline' },
  paid: { label: 'Credited', emoji: '✅', accent: ACCENTS.green, icon: 'checkmark-circle' },
  failed: { label: 'Failed', emoji: '⚠️', accent: ACCENTS.red, icon: 'alert-circle' },
  on_hold: { label: 'On hold', emoji: '⏸️', accent: ACCENTS.red, icon: 'pause-circle' },
  refunded: { label: 'Refunded', emoji: '↩️', accent: ACCENTS.slate, icon: 'return-down-back' },
};

/** Whole rupees in Indian grouping, e.g. ₹1,24,500. */
const rupees = (n: number, digits = 0) =>
  `₹${n.toLocaleString('en-IN', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;

export default function OwnerEarningsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { showSuccess, showWarning } = useToast();
  const { bookings } = useBookings();

  const [profile, setProfile] = useState<PayeeProfile | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(PROFILE_KEY);
        if (raw) setProfile(JSON.parse(raw));
      } catch {
        // A corrupt profile shouldn't block the earnings list.
      }
    })();
  }, []);

  const rows = useMemo(() => {
    return (bookings || [])
      .filter((b: Booking) => b.status !== 'cancelled')
      .map((b: Booking) => {
        const slotCount = b.slots?.length || 1;
        const settlement = computeSettlement({
          slotCount,
          pricePerSlot: slotCount > 0 ? b.totalAmount / slotCount : b.totalAmount,
        });
        const status: PayoutStatus = escrowStatus(b.createdAt, null, now);
        return { booking: b, settlement, status };
      })
      .sort((a: EarningRow, b: EarningRow) =>
        a.booking.createdAt < b.booking.createdAt ? 1 : -1
      );
  }, [bookings, now]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc: Totals, r: EarningRow) => {
        if (r.status === 'held') acc.inEscrow = money(acc.inEscrow + r.settlement.ownerPayout);
        else if (r.status === 'paid')
          acc.credited = money(acc.credited + r.settlement.ownerPayout);
        else acc.crediting = money(acc.crediting + r.settlement.ownerPayout);
        return acc;
      },
      { inEscrow: 0, crediting: 0, credited: 0 }
    );
  }, [rows]);

  const handleInvoice = async (row: EarningRow) => {
    if (!profile) {
      showWarning(
        'Add your payout details first',
        'A statement needs your billing address and GSTIN.'
      );
      router.push('/payout-settings');
      return;
    }
    const b = row.booking;
    const addr = [
      profile.address?.line1,
      profile.address?.city,
      profile.address?.state,
      profile.address?.pincode,
    ]
      .filter(Boolean)
      .join(', ');
    try {
      await exportInvoicePDF({
        invoiceNumber: invoiceNumberFor(b.bookingRef, b.createdAt),
        issuedOn: new Date(b.createdAt).toLocaleDateString(),
        bookingRef: b.bookingRef,
        venueName: b.venueName,
        slotDate: b.dayLabel,
        slots: b.slots || [],
        settlement: row.settlement,
        payee: { legalName: profile.legalName, address: addr, gstin: profile.gstin },
        status: STATUS_META[row.status]?.label || row.status,
      });
      showSuccess('Statement ready');
    } catch {
      showWarning('Could not generate the statement');
    }
  };

  const totalPayout = money(totals.inEscrow + totals.crediting + totals.credited);
  const settledShare = totalPayout > 0 ? totals.credited / totalPayout : 0;

  return (
    <GradientContainer screenName="settings" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header Stack Bar */}
        <View style={styles.header}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
            hitSlop={8}
            style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </Pressable>
          <ThemedText style={[styles.headerTitle, { color: theme.text }]}>
            Payment Transactions
          </ThemedText>
          <Pressable
            onPress={() => router.push('/payout-settings')}
            hitSlop={8}
            style={({ pressed }) => [
              styles.headerActionBtn,
              { backgroundColor: theme.surfaceLow },
              pressed && { opacity: 0.7 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Payout settings"
          >
            <Ionicons name="settings-outline" size={17} color={theme.textSecondary} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Money at a glance — where every rupee sits in the escrow cycle */}
          <DashboardCard
            title="Earnings at a Glance"
            metric={`${rupees(totalPayout)} across ${rows.length} ${rows.length === 1 ? 'payment' : 'payments'}`}
            tag={totals.inEscrow > 0 ? `⏳ ${rupees(totals.inEscrow)} in escrow` : '✅ Nothing on hold'}
            icon="wallet"
            accent={ACCENTS.green}
            footer={{
              label: 'Hold period',
              value: `${HOLD_PERIOD_HOURS}h`,
              status: 'Auto-credits after each booking',
            }}
          >
            <StatTiles
              items={[
                { value: rupees(totals.inEscrow), label: 'In escrow', color: ACCENTS.orange.dark },
                { value: rupees(totals.crediting), label: 'Crediting', color: ACCENTS.primary.dark },
                { value: rupees(totals.credited), label: 'Credited', color: ACCENTS.green.dark },
              ]}
            />
            <ProgressPill
              progress={settledShare}
              accent={ACCENTS.green}
              label="Settled to your account"
              value={`${Math.round(settledShare * 100)}%`}
            />
          </DashboardCard>

          {/* Nothing can be paid out until the payee details exist. */}
          {!profile && (
            <DashboardCard
              style={styles.cardGap}
              title="Payouts on hold"
              metric="Add bank or UPI details to get paid"
              tag="⚠️ Action needed"
              icon="alert-circle"
              accent={ACCENTS.red}
              onPress={() => router.push('/payout-settings')}
              accessibilityLabel="Payouts on hold. Add your payout details"
              footer={{ label: 'Needed for', value: 'settlements & statements', status: 'Add details ›' }}
            />
          )}

          <DashboardSectionLabel
            label="Transactions"
            color={ACCENTS.primary.main}
            style={styles.sectionLabel}
            right={
              <View style={[styles.countBadge, { backgroundColor: theme.surfaceLow }]}>
                <ThemedText style={[styles.countBadgeText, { color: theme.textSecondary }]}>
                  {rows.length}
                </ThemedText>
              </View>
            }
          />

          {rows.length === 0 ? (
            <DashboardCard
              title="No transactions yet"
              metric="Booking payments and settlements appear here"
              icon="receipt-outline"
              accent={ACCENTS.slate}
            />
          ) : (
            <View style={styles.cardsList}>
              {rows.map((row) => {
                const meta = STATUS_META[row.status] || STATUS_META.held;
                const held = row.status === 'held';
                const slots = row.booking.slots?.length || 1;

                return (
                  <DashboardCard
                    key={row.booking.id}
                    title={row.booking.venueName}
                    metric={`${rupees(row.settlement.ownerPayout, 2)} payout`}
                    tag={`${meta.emoji} ${meta.label}`}
                    icon={meta.icon}
                    accent={meta.accent}
                    footer={{
                      left: (
                        <View style={styles.footerNote}>
                          <Ionicons
                            name={held ? 'hourglass-outline' : 'checkmark-circle-outline'}
                            size={12}
                            color={held ? ACCENTS.orange.dark : meta.accent.dark}
                          />
                          <ThemedText
                            style={[styles.footerNoteText, { color: held ? ACCENTS.orange.dark : theme.textSecondary }]}
                            numberOfLines={1}
                          >
                            {held
                              ? `Auto-credits in ${formatTimeUntilRelease(row.booking.createdAt, now)}`
                              : 'Released to your account'}
                          </ThemedText>
                        </View>
                      ),
                      status: (
                        <Pressable
                          onPress={() => handleInvoice(row)}
                          hitSlop={6}
                          style={({ pressed }) => [
                            styles.invoiceBtn,
                            { borderColor: ACCENTS.primary.main + '40', backgroundColor: ACCENTS.primary.main + '0D' },
                            pressed && { opacity: 0.75 },
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel={`Download statement for ${row.booking.bookingRef}`}
                        >
                          <Ionicons name="document-text-outline" size={12} color={ACCENTS.primary.dark} />
                          <ThemedText style={[styles.invoiceBtnText, { color: ACCENTS.primary.dark }]}>
                            Statement
                          </ThemedText>
                        </Pressable>
                      ),
                    }}
                  >
                    <ThemedText style={[styles.metaLine, { color: theme.textSecondary }]} numberOfLines={1}>
                      {row.booking.bookingRef} · {row.booking.dayLabel} · {slots} {slots === 1 ? 'slot' : 'slots'}
                    </ThemedText>

                    {/* Settlement breakdown */}
                    <View
                      style={[
                        styles.breakdown,
                        { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '1A' },
                      ]}
                    >
                      <BreakdownRow label="Player paid" value={`₹${row.settlement.playerPays.toFixed(2)}`} />
                      <BreakdownRow
                        label="Platform fee + GST"
                        value={`− ₹${row.settlement.platformDeduction.toFixed(2)}`}
                        negative
                      />
                      {row.settlement.ownerReimbursement > 0 && (
                        <BreakdownRow
                          label="Voucher reimbursed"
                          value={`+ ₹${row.settlement.ownerReimbursement.toFixed(2)}`}
                          positive
                        />
                      )}
                      <View style={[styles.breakdownDivider, { backgroundColor: theme.outlineVariant + '33' }]} />
                      <BreakdownRow label="You receive" value={`₹${row.settlement.ownerPayout.toFixed(2)}`} strong />
                    </View>
                  </DashboardCard>
                );
              })}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </GradientContainer>
  );
}

function BreakdownRow({
  label,
  value,
  strong,
  positive,
  negative,
}: {
  label: string;
  value: string;
  strong?: boolean;
  positive?: boolean;
  negative?: boolean;
}) {
  const theme = useTheme();
  const valueColor = positive ? ACCENTS.green.dark : negative ? ACCENTS.red.dark : theme.text;
  return (
    <View style={styles.breakdownRow}>
      <ThemedText
        style={[
          strong ? styles.breakdownLabelStrong : styles.breakdownLabel,
          { color: strong ? theme.text : theme.textSecondary, flex: 1 },
        ]}
        numberOfLines={1}
      >
        {label}
      </ThemedText>
      <ThemedText style={[strong ? styles.breakdownValueStrong : styles.breakdownValue, { color: valueColor }]}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 48,
    zIndex: 10,
  },
  backButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  headerActionBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontFamily: 'Sora_500Medium', fontSize: 14.5 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },
  cardGap: { marginTop: 12 },
  sectionLabel: { marginTop: 22, marginBottom: 10 },
  countBadge: { paddingHorizontal: 7, paddingVertical: 1, borderRadius: 999 },
  countBadgeText: { fontFamily: 'Sora_500Medium', fontSize: 10 },
  cardsList: { gap: 12 },
  metaLine: { fontFamily: 'Sora_400Regular', fontSize: 10.5, marginTop: -4 },
  breakdown: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8, gap: 4 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  breakdownLabel: { fontFamily: 'Sora_400Regular', fontSize: 11 },
  breakdownLabelStrong: { fontFamily: 'Sora_500Medium', fontSize: 12 },
  breakdownValue: { fontFamily: 'Sora_500Medium', fontSize: 11 },
  breakdownValueStrong: { fontFamily: 'Sora_600SemiBold', fontSize: 12.5 },
  breakdownDivider: { height: 1, marginVertical: 3 },
  footerNote: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 },
  footerNoteText: { fontFamily: 'Sora_500Medium', fontSize: 10, flexShrink: 1 },
  invoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 10,
    height: 28,
  },
  invoiceBtnText: { fontFamily: 'Sora_500Medium', fontSize: 10.5 },
});
