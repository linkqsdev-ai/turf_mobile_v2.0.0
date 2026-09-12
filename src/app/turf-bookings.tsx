import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Reanimated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText, MAX_FONT_SCALE } from '@/components/themed-text';
import { GradientContainer } from '@/components/gradient-container';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useBookings, useTurfStore } from '@/store/app-store';
import { useToast } from '@/context/ToastContext';
import { getAvatarSource } from '@/constants/avatars';
import { RecordCard } from '@/components/record-card';
import { formatSlotsRange } from '@/utils/date-utils';
import type { Booking } from '@/store/booking-store';
import { SectionHeading, StatTile } from '@/components/home/dashboard-widgets';

type Filter = 'upcoming' | 'today' | 'past' | 'cancelled';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'today', label: 'Today' },
  { key: 'past', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

/**
 * The soft multi-colour wash behind each card. Per-card hues keep a long list
 * from reading as one flat block while staying within the same pastel family.
 */
export default function TurfBookingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { bookings } = useBookings();
  const { ownedTurfs } = useTurfStore();
  const { showInfo } = useToast();
  const params = useLocalSearchParams<{ turfId?: string; turfName?: string }>();

  const [filter, setFilter] = useState<Filter>('upcoming');
  const [query, setQuery] = useState('');

  const todayISO = new Date().toISOString().split('T')[0];

  /**
   * Bookings taken at this owner's venues.
   *
   * When opened from a specific turf we scope to that turf; otherwise we show
   * every venue the owner has published. Falls back to showing everything only
   * when the owner has no turfs recorded locally yet, so the screen is never
   * mysteriously empty during setup.
   */
  const ownerBookings = useMemo(() => {
    const all = bookings || [];
    if (params.turfId) {
      return all.filter(b => b.venueId === params.turfId);
    }
    const ownedIds = new Set((ownedTurfs || []).map((t: any) => t.id));
    const ownedNames = new Set(
      (ownedTurfs || []).map((t: any) => String(t.name || '').toLowerCase())
    );
    if (ownedIds.size === 0) return all;
    return all.filter(
      b => ownedIds.has(b.venueId) || ownedNames.has(String(b.venueName || '').toLowerCase())
    );
  }, [bookings, ownedTurfs, params.turfId]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ownerBookings
      .filter(b => {
        if (filter === 'cancelled') return b.status === 'cancelled';
        if (b.status === 'cancelled') return false;
        if (filter === 'today') return b.date === todayISO;
        if (filter === 'upcoming') return b.date >= todayISO;
        return b.date < todayISO || b.status === 'completed';
      })
      .filter(b => {
        if (!q) return true;
        return (
          String(b.customerName || '').toLowerCase().includes(q) ||
          String(b.bookingRef || '').toLowerCase().includes(q) ||
          String(b.venueName || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? 1 : -1));
  }, [ownerBookings, filter, query, todayISO]);

  const stats = useMemo(() => {
    const active = ownerBookings.filter(b => b.status !== 'cancelled');
    return {
      count: active.length,
      revenue: active.reduce((sum, b) => sum + (b.advancePaid || 0), 0),
      due: active.reduce((sum, b) => sum + (b.remaining || 0), 0),
    };
  }, [ownerBookings]);

  const callCustomer = (b: Booking) => {
    if (!b.customerPhone) {
      showInfo('No phone number', 'This booking was made without a contact number.');
      return;
    }
    Linking.openURL(`tel:${b.customerPhone}`).catch(() =>
      showInfo('Could not place call', b.customerPhone!)
    );
  };

  const messageCustomer = (b: Booking) => {
    if (!b.customerPhone) {
      showInfo('No phone number', 'This booking was made without a contact number.');
      return;
    }
    const text = encodeURIComponent(
      `Hi ${b.customerName || 'there'}, about your booking ${b.bookingRef} at ${b.venueName} on ${b.dayLabel}.`
    );
    const url =
      Platform.OS === 'ios'
        ? `sms:${b.customerPhone}&body=${text}`
        : `sms:${b.customerPhone}?body=${text}`;
    Linking.openURL(url).catch(() => showInfo('Could not open messages', b.customerPhone!));
  };

  const renderCard = (b: Booking, index: number) => {
    const isPaidUp = (b.remaining || 0) <= 0;
    const isCancelled = b.status === 'cancelled';
    const isToday = b.date === todayISO;

    return (
      <RecordCard
        key={b.id}
        delay={index * 0.06}
        dimmed={isCancelled}
        avatar={getAvatarSource(b.customerAvatar || 'avatar_1')}
        title={b.customerName || 'Guest booking'}
        chips={[
          {
            label: isCancelled ? 'Cancelled' : isPaidUp ? 'Paid' : `₹${b.remaining} due`,
            tone: isCancelled ? 'danger' : isPaidUp ? 'success' : 'warn',
          },
          ...(isToday && !isCancelled ? [{ label: 'Today', tone: 'info' as const }] : []),
          { label: b.bookingRef, tone: 'neutral' },
        ]}
        details={[
          { icon: 'calendar-outline', label: 'Date', value: b.dayLabel },
          { icon: 'time-outline', label: 'Slot', value: formatSlotsRange(b.slots) },
          { icon: 'call-outline', label: 'Phone', value: b.customerPhone },
          { icon: 'card-outline', label: 'Paid via', value: b.paymentMethod },
          { icon: 'location-outline', label: 'Venue', value: b.venueName, full: true },
        ]}
        statLeft={`₹${b.totalAmount} total`}
        statRight={
          b.remaining > 0 ? `₹${b.advancePaid} paid · ₹${b.remaining} due` : 'Fully settled'
        }
        primary={{
          icon: 'call',
          label: 'Call',
          accessibilityLabel: `Call ${b.customerName || 'customer'}`,
          onPress: () => callCustomer(b),
        }}
        actions={[
          {
            icon: 'mail-outline',
            accessibilityLabel: `Message ${b.customerName || 'customer'}`,
            onPress: () => messageCustomer(b),
          },
          {
            icon: 'receipt-outline',
            accessibilityLabel: 'Payment details',
            onPress: () =>
              showInfo(
                `₹${b.totalAmount} total`,
                `Paid ₹${b.advancePaid} · ${b.remaining > 0 ? `₹${b.remaining} due` : 'settled'} · ${b.paymentMethod}`
              ),
          },
        ]}
      />
    );
  };

  return (
    <GradientContainer screenName="explore" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
            hitSlop={10}
            style={[styles.roundBtn, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '40' }]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={18} color={theme.text} />
          </Pressable>
          <View style={{ flex: 1, minWidth: 0 }}>
            <ThemedText style={[styles.headerTitle, { color: theme.text }]}>Turf Bookings</ThemedText>
            <ThemedText style={[styles.headerSub, { color: theme.textSecondary }]} numberOfLines={1}>
              {params.turfName ? `${params.turfName}` : 'Who has booked your venues'}
            </ThemedText>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Summary — dashboard stat tiles */}
          <Reanimated.View entering={FadeInDown.duration(400)} style={styles.statRow}>
            <StatTile label="Bookings" value={stats.count} icon="calendar-outline" tint={theme.primary} />
            <StatTile label="Collected" value={stats.revenue} prefix="₹" icon="wallet-outline" tint="#10B981" />
            <StatTile label="Due" value={stats.due} prefix="₹" icon="time-outline" tint="#F59E0B" />
          </Reanimated.View>

          {/* Search */}
          <View style={[styles.searchBar, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '40' }]}>
            <Ionicons name="search" size={15} color={theme.textSecondary} />
            <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
              value={query}
              onChangeText={setQuery}
              placeholder="Search name, ref or venue"
              placeholderTextColor="#94a3b8"
              style={[styles.searchInput, { color: theme.text }]}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Clear search">
                <Ionicons name="close-circle" size={15} color={theme.textSecondary} />
              </Pressable>
            )}
          </View>

          {/* Filters — raised segmented control */}
          <View style={[styles.filterRow, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '26' }]}>
            {FILTERS.map(f => {
              const active = filter === f.key;
              return (
                <Pressable
                  key={f.key}
                  onPress={() => setFilter(f.key)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={[styles.filterChip, active && [{ backgroundColor: theme.surfaceLowest }, Shadows.level1]]}
                >
                  <ThemedText style={[styles.filterText, { color: active ? theme.primary : theme.textSecondary }]} numberOfLines={1}>
                    {f.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.headingWrap}>
            <SectionHeading
              title={`${FILTERS.find(f => f.key === filter)?.label ?? 'All'} bookings · ${visible.length}`}
              tint={theme.primary}
            />
          </View>

          {visible.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
              <View style={[styles.emptyIcon, { backgroundColor: theme.primary + '14' }]}>
                <Ionicons name="calendar-outline" size={20} color={theme.primary} />
              </View>
              <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
                {ownerBookings.length === 0 ? 'No bookings yet' : `No ${filter} bookings`}
              </ThemedText>
              <ThemedText style={[styles.emptyBody, { color: theme.textSecondary }]}>
                {ownerBookings.length === 0
                  ? 'When a player books one of your slots, they appear here with their contact details.'
                  : 'Try a different filter or clear your search.'}
              </ThemedText>
            </View>
          ) : (
            visible.map(renderCard)
          )}
        </ScrollView>
      </SafeAreaView>
    </GradientContainer>
  );
}

const GUTTER = Spacing.containerMargin;

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: GUTTER,
    height: 58,
    borderBottomWidth: 1,
    borderBottomColor: '#0000000a',
  },
  roundBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontFamily: 'Sora_500Medium', fontSize: 14.5 },
  headerSub: { fontFamily: 'Sora_400Regular', fontSize: 10.5, marginTop: 1 },
  scrollContent: { paddingHorizontal: GUTTER, paddingTop: 12, paddingBottom: 60 },

  statRow: { flexDirection: 'row', gap: 8 },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 38,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 13,
    marginTop: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 11.5,
    fontFamily: 'Sora_400Regular',
    paddingVertical: 0,
    includeFontPadding: false,
    ...({ outlineStyle: 'none' } as any),
  },

  filterRow: { flexDirection: 'row', gap: 3, padding: 3, borderRadius: 999, borderWidth: 1, marginTop: 10 },
  filterChip: { flex: 1, height: 30, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  filterText: { fontFamily: 'Sora_500Medium', fontSize: 10.5 },
  headingWrap: { marginTop: 16 },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.premium,
    borderWidth: 1,
    gap: 4,
  },
  emptyIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  emptyTitle: { fontSize: 13, fontFamily: 'Sora_500Medium', textAlign: 'center' },
  emptyBody: {
    fontSize: 11,
    lineHeight: 15,
    fontFamily: 'Sora_400Regular',
    textAlign: 'center',
  },
});
