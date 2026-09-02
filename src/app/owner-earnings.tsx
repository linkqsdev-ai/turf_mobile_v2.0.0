/**
 * owner-earnings.tsx
 *
 * The owner's money view: every booking's payment, where it sits in the 24-hour
 * escrow, and a downloadable statement for each.
 *
 * The player's payment is held by the platform and auto-credits at T+24h, so
 * the important thing this screen answers is "when do I actually get paid" —
 * hence the live countdown on every held row rather than a bare status word.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { GradientContainer } from '@/components/gradient-container';
import { BorderRadius, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTypeRamp } from '@/lib/typography';
import { useToast } from '@/context/ToastContext';
import { useBookingStore } from '@/store/app-store';
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

const PROFILE_KEY = '@turf_payout_profile';

const STATUS_META: Record<string, { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  held: { label: 'In escrow', color: '#E08A3C', icon: 'time-outline' },
  payable: { label: 'Crediting', color: '#4F46E5', icon: 'sync-outline' },
  processing: { label: 'Processing', color: '#4F46E5', icon: 'sync-outline' },
  paid: { label: 'Credited', color: '#10B981', icon: 'checkmark-circle' },
  failed: { label: 'Failed', color: '#EF4444', icon: 'alert-circle' },
  on_hold: { label: 'On hold', color: '#EF4444', icon: 'pause-circle' },
  refunded: { label: 'Refunded', color: '#6B7280', icon: 'return-down-back' },
};

export default function OwnerEarningsScreen() {
  const theme = useTheme();
  const type = useTypeRamp();
  const router = useRouter();
  const { showSuccess, showWarning } = useToast();
  const { bookings } = useBookingStore();

  const [profile, setProfile] = useState<PayeeProfile | null>(null);
  // Ticks the countdown so a row flips from "In escrow" to "Crediting" while
  // the screen is open, rather than only on a re-mount.
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
      .filter((b) => b.status !== 'cancelled')
      .map((b) => {
        const slotCount = b.slots?.length || 1;
        const settlement = computeSettlement({
          slotCount,
          pricePerSlot: slotCount > 0 ? b.totalAmount / slotCount : b.totalAmount,
        });
        const status: PayoutStatus = escrowStatus(b.createdAt, null, now);
        return { booking: b, settlement, status };
      })
      .sort((a, b) => (a.booking.createdAt < b.booking.createdAt ? 1 : -1));
  }, [bookings, now]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        if (r.status === 'held') acc.inEscrow = money(acc.inEscrow + r.settlement.ownerPayout);
        else if (r.status === 'paid') acc.credited = money(acc.credited + r.settlement.ownerPayout);
        else acc.crediting = money(acc.crediting + r.settlement.ownerPayout);
        return acc;
      },
      { inEscrow: 0, crediting: 0, credited: 0 }
    );
  }, [rows]);

  const handleInvoice = async (row: (typeof rows)[number]) => {
    if (!profile) {
      showWarning('Add your payout details first', 'A statement needs your billing address and GSTIN.');
      router.push('/payout-settings');
      return;
    }
    const b = row.booking;
    const addr = [profile.address?.line1, profile.address?.city, profile.address?.state, profile.address?.pincode]
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

  return (
    <GradientContainer screenName="settings" style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: theme.outlineVariant + '33' }]}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
            hitSlop={8}
            style={styles.backBtn}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </Pressable>
          <ThemedText style={[type.title, { color: theme.text }]}>Earnings & Payments</ThemedText>
          <Pressable onPress={() => router.push('/payout-settings')} hitSlop={8} style={styles.backBtn} accessibilityLabel="Payout settings">
            <Ionicons name="settings-outline" size={18} color={theme.textSecondary} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {/* Money at a glance */}
          <View style={styles.totalsRow}>
            <TotalCard label="In escrow" value={totals.inEscrow} color="#E08A3C" hint={`Releases ${HOLD_PERIOD_HOURS}h after booking`} />
            <TotalCard label="Crediting" value={totals.crediting} color="#4F46E5" hint="On the way to your account" />
            <TotalCard label="Credited" value={totals.credited} color="#10B981" hint="Settled" />
          </View>

          {!profile && (
            <Pressable
              onPress={() => router.push('/payout-settings')}
              style={[styles.warnCard, { backgroundColor: theme.error + '12', borderColor: theme.error + '44' }]}
            >
              <Ionicons name="alert-circle" size={16} color={theme.error} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <ThemedText style={[type.bodyStrong, { color: theme.error }]}>Payouts on hold</ThemedText>
                <ThemedText style={[type.micro, { color: theme.textSecondary, marginTop: 1 }]}>
                  Add your account details once — you can edit them any time.
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={15} color={theme.error} />
            </Pressable>
          )}

          <ThemedText style={[type.micro, styles.sectionTitle, { color: theme.textSecondary }]}>
            PAYMENTS ({rows.length})
          </ThemedText>

          {rows.length === 0 && (
            <View style={[styles.empty, { borderColor: theme.outlineVariant + '55' }]}>
              <ThemedText style={[type.small, { color: theme.textSecondary }]}>
                No bookings yet. Payments appear here as soon as a player books.
              </ThemedText>
            </View>
          )}

          {rows.map((row) => {
            const meta = STATUS_META[row.status] || STATUS_META.held;
            const held = row.status === 'held';
            return (
              <View
                key={row.booking.id}
                style={[styles.card, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}
              >
                <View style={styles.cardTop}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <ThemedText style={[type.bodyStrong, { color: theme.text }]} numberOfLines={1}>
                      {row.booking.venueName}
                    </ThemedText>
                    <ThemedText style={[type.micro, { color: theme.textSecondary, marginTop: 1 }]} numberOfLines={1}>
                      {row.booking.bookingRef} · {row.booking.dayLabel} · {row.booking.slots?.length || 0} slot
                      {(row.booking.slots?.length || 0) === 1 ? '' : 's'}
                    </ThemedText>
                  </View>
                  <View style={[styles.badge, { backgroundColor: meta.color + '1F' }]}>
                    <Ionicons name={meta.icon} size={11} color={meta.color} />
                    <ThemedText style={[type.micro, { color: meta.color }]}>{meta.label}</ThemedText>
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: theme.outlineVariant + '33' }]} />

                <Row label="Player paid" value={`₹${row.settlement.playerPays.toFixed(2)}`} />
                <Row label="Platform fee + GST" value={`− ₹${row.settlement.platformDeduction.toFixed(2)}`} />
                {row.settlement.ownerReimbursement > 0 && (
                  <Row label="Voucher reimbursed" value={`+ ₹${row.settlement.ownerReimbursement.toFixed(2)}`} positive />
                )}
                <Row label="You receive" value={`₹${row.settlement.ownerPayout.toFixed(2)}`} strong />

                <View style={styles.cardFooter}>
                  {held ? (
                    <View style={styles.countdown}>
                      <Ionicons name="hourglass-outline" size={12} color="#E08A3C" />
                      <ThemedText style={[type.micro, { color: '#E08A3C' }]}>
                        Auto-credits in {formatTimeUntilRelease(row.booking.createdAt, now)}
                      </ThemedText>
                    </View>
                  ) : (
                    <View style={styles.countdown}>
                      <Ionicons name="checkmark-circle-outline" size={12} color={meta.color} />
                      <ThemedText style={[type.micro, { color: theme.textSecondary }]}>
                        Released to your account
                      </ThemedText>
                    </View>
                  )}
                  <Pressable
                    onPress={() => handleInvoice(row)}
                    style={[styles.invoiceBtn, { borderColor: theme.primary + '55' }]}
                  >
                    <Ionicons name="document-text-outline" size={12} color={theme.primary} />
                    <ThemedText style={[type.micro, { color: theme.primary }]}>Statement</ThemedText>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </GradientContainer>
  );
}

function TotalCard({ label, value, color, hint }: { label: string; value: number; color: string; hint: string }) {
  const theme = useTheme();
  const type = useTypeRamp();
  return (
    <View style={[styles.totalCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
      <ThemedText style={[type.micro, { color: theme.textSecondary }]} numberOfLines={1}>{label}</ThemedText>
      <ThemedText style={[type.display, { color }]} numberOfLines={1}>₹{value.toFixed(0)}</ThemedText>
      <ThemedText style={[type.micro, { color: theme.textSecondary }]} numberOfLines={2}>{hint}</ThemedText>
    </View>
  );
}

function Row({ label, value, strong, positive }: { label: string; value: string; strong?: boolean; positive?: boolean }) {
  const theme = useTheme();
  const type = useTypeRamp();
  return (
    <View style={styles.row}>
      <ThemedText style={[strong ? type.bodyStrong : type.small, { color: theme.text, flex: 1, minWidth: 0 }]} numberOfLines={1}>
        {label}
      </ThemedText>
      <ThemedText style={[strong ? type.bodyStrong : type.small, { color: positive ? '#10B981' : theme.text }]}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    height: 52,
    borderBottomWidth: 1,
  },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  body: { padding: Spacing.base, paddingBottom: Spacing.xl },

  totalsRow: { flexDirection: 'row', gap: 8 },
  totalCard: {
    flex: 1,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: 10,
    gap: 2,
    ...Shadows.level1,
  },

  warnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginTop: Spacing.md,
  },

  sectionTitle: { letterSpacing: 0.6, marginTop: Spacing.lg, marginBottom: Spacing.sm },

  card: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: 12,
    marginBottom: Spacing.md,
    ...Shadows.level1,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  divider: { height: 1, marginVertical: 9 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 3 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 10 },
  countdown: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 },
  invoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },

  empty: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 18,
    alignItems: 'center',
  },
});
