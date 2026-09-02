import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Platform,
  Alert,
  TextInput,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import Reanimated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { GradientContainer } from '@/components/gradient-container';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useBookings } from '@/store/app-store';
import { Booking } from '@/store/booking-store';
import { formatSlotsRange } from '@/utils/date-utils';
import { useToast } from '@/context/ToastContext';

type FilterTab = 'all' | 'upcoming' | 'completed' | 'cancelled';

export default function BookingHistoryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { bookings, cancelBooking } = useBookings();
  const { showSuccess, showInfo } = useToast();

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Categorize bookings
  const todayISO = new Date().toISOString().split('T')[0];

  const filteredBookings = useMemo(() => {
    return (bookings || []).filter((b) => {
      // Search query filter
      const matchesSearch =
        !searchQuery.trim() ||
        b.venueName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.bookingRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.venueLocation.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      const isFutureOrToday = b.date >= todayISO;
      const isPast = b.date < todayISO;

      if (activeTab === 'upcoming') {
        return b.status === 'confirmed' && isFutureOrToday;
      }
      if (activeTab === 'completed') {
        return b.status === 'completed' || (b.status === 'confirmed' && isPast);
      }
      if (activeTab === 'cancelled') {
        return b.status === 'cancelled';
      }
      return true; // 'all'
    });
  }, [bookings, activeTab, searchQuery, todayISO]);

  const counts = useMemo(() => {
    const all = bookings.length;
    const upcoming = bookings.filter((b) => b.status === 'confirmed' && b.date >= todayISO).length;
    const completed = bookings.filter((b) => b.status === 'completed' || (b.status === 'confirmed' && b.date < todayISO)).length;
    const cancelled = bookings.filter((b) => b.status === 'cancelled').length;
    const totalSpent = bookings
      .filter((b) => b.status !== 'cancelled')
      .reduce((sum, b) => sum + (b.advancePaid || b.totalAmount || 0), 0);

    return { all, upcoming, completed, cancelled, totalSpent };
  }, [bookings, todayISO]);

  const handleCancelBooking = (booking: Booking) => {
    Alert.alert(
      'Cancel Booking',
      `Are you sure you want to cancel your booking at ${booking.venueName} for ${booking.dayLabel}?\n\nRefund of ₹${booking.advancePaid.toFixed(2)} will be credited to your wallet balance.`,
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            cancelBooking(booking.id);
            showSuccess('Booking Cancelled', `Slot released for ${booking.venueName}.`);
          },
        },
      ]
    );
  };

  const handleShareBooking = async (booking: Booking) => {
    try {
      await Share.share({
        message: `🏏 Turf Booking Confirmed!\nVenue: ${booking.venueName}\nDate: ${booking.dayLabel}\nSlots: ${formatSlotsRange(booking.slots)}\nRef: ${booking.bookingRef}\nLocation: ${booking.venueLocation}`,
      });
    } catch {
      showInfo('Copied', 'Booking details copied!');
    }
  };

  return (
    <GradientContainer screenName="booking" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Navigation Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/explore'))}
            style={styles.backButton}
            hitSlop={8}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </Pressable>
          <View style={styles.headerTitleGroup}>
            <ThemedText style={[styles.headerTitle, { color: theme.text }]}>
              Booking History
            </ThemedText>
            <ThemedText style={[styles.headerSub, { color: theme.textSecondary }]}>
              {bookings.length} total reservations
            </ThemedText>
          </View>
          <Pressable
            onPress={() => router.push('/(tabs)/explore')}
            style={[styles.newBookingBtn, { backgroundColor: theme.primary + '18' }]}
            hitSlop={6}
          >
            <Ionicons name="add-circle-outline" size={16} color={theme.primary} />
            <ThemedText style={[styles.newBookingText, { color: theme.primary }]}>
              Book Turf
            </ThemedText>
          </Pressable>
        </View>

        {/* Metric Ribbon */}
        <View style={styles.statsRibbon}>
          <View style={[styles.statTile, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '22' }]}>
            <ThemedText style={[styles.statNum, { color: theme.primary }]}>
              {counts.upcoming}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Active
            </ThemedText>
          </View>
          <View style={[styles.statTile, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '22' }]}>
            <ThemedText style={[styles.statNum, { color: '#10b981' }]}>
              {counts.completed}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Played
            </ThemedText>
          </View>
          <View style={[styles.statTile, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '22' }]}>
            <ThemedText style={[styles.statNum, { color: '#f59e0b' }]}>
              ₹{counts.totalSpent.toFixed(0)}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Total Paid
            </ThemedText>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={[styles.searchBox, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33' }]}>
            <Ionicons name="search-outline" size={16} color={theme.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search by venue name, location, or ref..."
              placeholderTextColor={theme.textSecondary + '88'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
            {!!searchQuery && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={6}>
                <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Filter Pills */}
        <View style={styles.tabBar}>
          {(
            [
              { key: 'all', label: `All (${counts.all})` },
              { key: 'upcoming', label: `Upcoming (${counts.upcoming})` },
              { key: 'completed', label: `Completed (${counts.completed})` },
              { key: 'cancelled', label: `Cancelled (${counts.cancelled})` },
            ] as const
          ).map((tab) => {
            const isSelected = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[
                  styles.tabPill,
                  { backgroundColor: theme.surfaceLow },
                  isSelected && { backgroundColor: theme.primary },
                ]}
              >
                <ThemedText
                  style={[
                    styles.tabPillText,
                    { color: isSelected ? '#ffffff' : theme.textSecondary },
                  ]}
                >
                  {tab.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        {/* Bookings List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        >
          {filteredBookings.length === 0 ? (
            <View style={[styles.emptyContainer, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '22' }]}>
              <Ionicons name="calendar-outline" size={42} color={theme.textSecondary + '66'} />
              <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
                No {activeTab !== 'all' ? activeTab : ''} bookings found
              </ThemedText>
              <ThemedText style={[styles.emptySub, { color: theme.textSecondary }]}>
                {searchQuery
                  ? 'Try searching with a different venue name or booking reference.'
                  : 'Reserve prime morning or floodlit night slots at top-rated arenas.'}
              </ThemedText>
              <Pressable
                onPress={() => router.push('/(tabs)/explore')}
                style={[styles.exploreBtn, { backgroundColor: theme.primary }]}
              >
                <ThemedText style={styles.exploreBtnText}>Explore Arenas</ThemedText>
              </Pressable>
            </View>
          ) : (
            filteredBookings.map((b, idx) => {
              const isPast = b.date < todayISO;
              const isCancelled = b.status === 'cancelled';
              const isCompleted = b.status === 'completed' || (!isCancelled && isPast);
              const isUpcoming = b.status === 'confirmed' && !isPast;

              const statusBadgeColor = isCancelled
                ? '#ef4444'
                : isCompleted
                ? '#3b82f6'
                : '#10b981';

              const statusBgColor = isCancelled
                ? '#ef444414'
                : isCompleted
                ? '#3b82f614'
                : '#10b98114';

              const statusText = isCancelled
                ? 'Cancelled'
                : isCompleted
                ? 'Completed'
                : 'Confirmed';

              const fallbackImg = 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=600&q=80';
              const venueImg = b.venueImage && b.venueImage.startsWith('http') ? b.venueImage : fallbackImg;

              return (
                <Reanimated.View
                  key={b.id || `booking-${idx}`}
                  entering={FadeInDown.delay(idx * 50).duration(320)}
                  style={[
                    styles.card,
                    { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '28' },
                    Shadows.level1,
                  ]}
                >
                  {/* Top Row: Venue Image + Info + Status */}
                  <View style={styles.cardHeader}>
                    <Image
                      source={{ uri: venueImg }}
                      style={styles.venueThumb}
                      contentFit="cover"
                    />
                    <View style={styles.cardHeaderInfo}>
                      <View style={styles.titleStatusRow}>
                        <ThemedText style={[styles.venueTitle, { color: theme.text }]} numberOfLines={1}>
                          {b.venueName}
                        </ThemedText>
                        <View style={[styles.statusBadge, { backgroundColor: statusBgColor }]}>
                          <ThemedText style={[styles.statusBadgeText, { color: statusBadgeColor }]}>
                            {statusText}
                          </ThemedText>
                        </View>
                      </View>

                      <View style={styles.locRow}>
                        <Ionicons name="location-outline" size={12} color={theme.textSecondary} />
                        <ThemedText style={[styles.locText, { color: theme.textSecondary }]} numberOfLines={1}>
                          {b.venueLocation || 'Trichy, Tamil Nadu'}
                        </ThemedText>
                      </View>

                      <View style={styles.refRow}>
                        <ThemedText style={[styles.refText, { color: theme.textSecondary }]}>
                          Ref: <ThemedText style={{ color: theme.text, fontFamily: 'Sora_500Medium' }}>{b.bookingRef}</ThemedText>
                        </ThemedText>
                        <Pressable onPress={() => handleShareBooking(b)} hitSlop={6}>
                          <Ionicons name="share-outline" size={14} color={theme.primary} />
                        </Pressable>
                      </View>
                    </View>
                  </View>

                  {/* Schedule Details Box */}
                  <View style={[styles.scheduleBox, { backgroundColor: theme.surfaceLow }]}>
                    <View style={styles.scheduleRow}>
                      <Ionicons name="calendar-outline" size={14} color={theme.primary} />
                      <ThemedText style={[styles.scheduleDate, { color: theme.text }]}>
                        {b.dayLabel}
                      </ThemedText>
                    </View>
                    <View style={styles.scheduleRow}>
                      <Ionicons name="time-outline" size={14} color={theme.primary} />
                      <ThemedText style={[styles.scheduleTime, { color: theme.text }]}>
                        {formatSlotsRange(b.slots)} ({b.slots.length} {b.slots.length === 1 ? 'hr' : 'hrs'})
                      </ThemedText>
                    </View>
                  </View>

                  {/* Add-ons & Badges */}
                  {(b.coachAdded || b.recordingAdded) && (
                    <View style={styles.addonsRow}>
                      {b.coachAdded && (
                        <View style={[styles.addonPill, { backgroundColor: '#3b82f614' }]}>
                          <Ionicons name="fitness-outline" size={11} color="#3b82f6" />
                          <ThemedText style={[styles.addonText, { color: '#3b82f6' }]}>
                            Coach Session
                          </ThemedText>
                        </View>
                      )}
                      {b.recordingAdded && (
                        <View style={[styles.addonPill, { backgroundColor: '#8b5cf614' }]}>
                          <Ionicons name="videocam-outline" size={11} color="#8b5cf6" />
                          <ThemedText style={[styles.addonText, { color: '#8b5cf6' }]}>
                            HD Recording
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Pricing Breakdown */}
                  <View style={[styles.priceBreakdown, { borderTopColor: theme.outlineVariant + '15' }]}>
                    <View>
                      <ThemedText style={[styles.priceLabel, { color: theme.textSecondary }]}>
                        Total Amount
                      </ThemedText>
                      <ThemedText style={[styles.priceVal, { color: theme.text }]}>
                        ₹{b.totalAmount.toFixed(2)}
                      </ThemedText>
                    </View>
                    <View>
                      <ThemedText style={[styles.priceLabel, { color: theme.textSecondary }]}>
                        Advance Paid
                      </ThemedText>
                      <ThemedText style={[styles.priceVal, { color: '#10b981' }]}>
                        ₹{b.advancePaid.toFixed(2)}
                      </ThemedText>
                    </View>
                    <View>
                      <ThemedText style={[styles.priceLabel, { color: theme.textSecondary }]}>
                        Remaining Due
                      </ThemedText>
                      <ThemedText style={[styles.priceVal, { color: b.remaining > 0 ? '#f59e0b' : theme.textSecondary }]}>
                        ₹{b.remaining.toFixed(2)}
                      </ThemedText>
                    </View>
                  </View>

                  {/* Card Action Buttons */}
                  <View style={[styles.cardActions, { borderTopColor: theme.outlineVariant + '15' }]}>
                    <Pressable
                      onPress={() => router.push({ pathname: '/details', params: { id: b.venueId, name: b.venueName } })}
                      style={[styles.btnSecondary, { borderColor: theme.outlineVariant + '44' }]}
                    >
                      <ThemedText style={[styles.btnSecondaryText, { color: theme.text }]}>
                        {isCompleted || isCancelled ? 'Book Again' : 'View Arena'}
                      </ThemedText>
                    </Pressable>

                    {isUpcoming && (
                      <Pressable
                        onPress={() => handleCancelBooking(b)}
                        style={[styles.btnDanger, { backgroundColor: '#ef444414', borderColor: '#ef444444' }]}
                      >
                        <ThemedText style={styles.btnDangerText}>
                          Cancel
                        </ThemedText>
                      </Pressable>
                    )}
                  </View>
                </Reanimated.View>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </GradientContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleGroup: { flex: 1, marginLeft: 8 },
  headerTitle: { fontFamily: 'Sora_500Medium', fontSize: 16, letterSpacing: -0.2 },
  headerSub: { fontFamily: 'Sora_400Regular', fontSize: 10.5, marginTop: 1 },
  newBookingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  newBookingText: { fontFamily: 'Sora_500Medium', fontSize: 11 },

  // Stats Ribbon
  statsRibbon: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: Spacing.md,
    marginTop: 4,
    marginBottom: 8,
  },
  statTile: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNum: { fontFamily: 'Sora_500Medium', fontSize: 14 },
  statLabel: { fontFamily: 'Sora_400Regular', fontSize: 9.5, marginTop: 1 },

  // Search Box
  searchSection: { paddingHorizontal: Spacing.md, marginBottom: 8 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    height: 36,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Sora_400Regular',
    fontSize: 11.5,
    padding: 0,
  },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: Spacing.md,
    marginBottom: 10,
  },
  tabPill: {
    flex: 1,
    paddingVertical: 5.5,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPillText: { fontFamily: 'Sora_500Medium', fontSize: 9.5 },

  // List
  listContent: { paddingHorizontal: Spacing.md, paddingBottom: 40, gap: 10 },

  // Booking Card
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.sm,
    gap: 8,
  },
  cardHeader: { flexDirection: 'row', gap: 10 },
  venueThumb: {
    width: 68,
    height: 68,
    borderRadius: 8,
  },
  cardHeaderInfo: { flex: 1, justifyContent: 'space-between' },
  titleStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  venueTitle: { fontFamily: 'Sora_500Medium', fontSize: 13, flex: 1 },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  statusBadgeText: { fontFamily: 'Sora_500Medium', fontSize: 8.5 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  locText: { fontFamily: 'Sora_400Regular', fontSize: 10, flex: 1 },
  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 3,
  },
  refText: { fontFamily: 'Sora_400Regular', fontSize: 9.5 },

  // Schedule Box
  scheduleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: BorderRadius.sm,
  },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  scheduleDate: { fontFamily: 'Sora_500Medium', fontSize: 10.5 },
  scheduleTime: { fontFamily: 'Sora_500Medium', fontSize: 10.5 },

  // Addons
  addonsRow: { flexDirection: 'row', gap: 6 },
  addonPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 4,
  },
  addonText: { fontFamily: 'Sora_500Medium', fontSize: 8.5 },

  // Pricing
  priceBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 7,
    borderTopWidth: 1,
  },
  priceLabel: { fontFamily: 'Sora_400Regular', fontSize: 9 },
  priceVal: { fontFamily: 'Sora_500Medium', fontSize: 11.5, marginTop: 1 },

  // Card Actions
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 7,
    borderTopWidth: 1,
  },
  btnSecondary: {
    flex: 1,
    height: 30,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: { fontFamily: 'Sora_500Medium', fontSize: 10.5 },
  btnDanger: {
    paddingHorizontal: 14,
    height: 30,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDangerText: { color: '#ef4444', fontFamily: 'Sora_500Medium', fontSize: 10.5 },

  // Empty State
  emptyContainer: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
    gap: 8,
    marginTop: 20,
  },
  emptyTitle: { fontFamily: 'Sora_500Medium', fontSize: 14, marginTop: 4 },
  emptySub: { fontFamily: 'Sora_400Regular', fontSize: 11, textAlign: 'center', lineHeight: 16 },
  exploreBtn: {
    marginTop: 10,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
  },
  exploreBtnText: { color: '#ffffff', fontFamily: 'Sora_500Medium', fontSize: 11.5 },
});
