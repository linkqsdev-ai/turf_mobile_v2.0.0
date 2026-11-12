import React, { useState, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
  Share,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import Reanimated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText, MAX_FONT_SCALE } from '@/components/themed-text';
import { GradientContainer } from '@/components/gradient-container';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useBookings, useClassStore, useTournamentStore } from '@/store/app-store';
import { Booking } from '@/store/booking-store';
import { useToast } from '@/context/ToastContext';
import {
  buildUnifiedHistoryList,
  filterUnifiedHistory,
  computeHistoryMetrics,
  getRoleAllowedHistoryTypes,
  HistoryTypeFilter,
  HistoryStatusFilter,
  UnifiedHistoryItem,
} from '@/utils/booking-history-utils';
import { SectionHeading, StatTile } from '@/components/home/dashboard-widgets';

export default function BookingHistoryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { profile } = useUserProfile();
  const { bookings, cancelBooking } = useBookings();
  const { classes, enrollments } = useClassStore();
  const { publishedTournaments, registrations } = useTournamentStore();
  const { showSuccess, showInfo } = useToast();

  const userRole = profile?.role || 'Player';

  // Role-based allowed history tabs:
  // - Player: 3 categories (turf, class, tournament)
  // - Organizer: 2 categories (turf, class) - excludes tournament
  // - Coach: 2 categories (turf, tournament)
  // - Turf Owner: 1 category (tournament)
  const allowedTypes = useMemo(() => getRoleAllowedHistoryTypes(userRole), [userRole]);

  // Initial filter: if role has only 1 type, default to it; else default to 'all'
  const initialType: HistoryTypeFilter = allowedTypes.length === 1 ? allowedTypes[0] : 'all';
  const [typeFilter, setTypeFilter] = useState<HistoryTypeFilter>(initialType);
  const [statusFilter, setStatusFilter] = useState<HistoryStatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected item for popup details modal
  const [selectedItem, setSelectedItem] = useState<UnifiedHistoryItem | null>(null);

  // Keep typeFilter in sync if role changes
  useEffect(() => {
    if (allowedTypes.length === 1) {
      setTypeFilter(allowedTypes[0]);
    } else if (typeFilter !== 'all' && !allowedTypes.includes(typeFilter)) {
      setTypeFilter('all');
    }
  }, [allowedTypes, typeFilter]);

  // Infinite Scroll Pagination State
  const [visibleItemsCount, setVisibleItemsCount] = useState(6);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setVisibleItemsCount(6);
  }, [typeFilter, statusFilter, searchQuery]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    setVisibleItemsCount(6);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 220;
    if (isCloseToBottom && visibleItemsCount < filteredList.length && !isLoadingMore) {
      setIsLoadingMore(true);
      setTimeout(() => {
        setVisibleItemsCount((prev) => Math.min(prev + 6, filteredList.length));
        setIsLoadingMore(false);
      }, 300);
    }
  };

  const todayISO = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Build full unified list across Turfs, Classes, and Tournaments
  const allUnifiedItems = useMemo(() => {
    return buildUnifiedHistoryList({
      bookings,
      enrollments,
      classes,
      registrations,
      tournaments: publishedTournaments,
      todayISO,
    });
  }, [bookings, enrollments, classes, registrations, publishedTournaments, todayISO]);

  // Filter items allowed by role
  const roleFilteredItems = useMemo(() => {
    return allUnifiedItems.filter((i) => allowedTypes.includes(i.type));
  }, [allUnifiedItems, allowedTypes]);

  // Filtered by Category Type, Status, and Search Query
  const filteredList = useMemo(() => {
    return filterUnifiedHistory({
      items: allUnifiedItems,
      typeFilter,
      statusFilter,
      searchQuery,
      allowedTypes,
    });
  }, [allUnifiedItems, typeFilter, statusFilter, searchQuery, allowedTypes]);

  // Metrics for the active role
  const roleMetrics = useMemo(() => {
    return computeHistoryMetrics(roleFilteredItems);
  }, [roleFilteredItems]);

  const statusMetrics = useMemo(() => {
    const itemsForType = typeFilter === 'all'
      ? roleFilteredItems
      : roleFilteredItems.filter((i) => i.type === typeFilter);
    return computeHistoryMetrics(itemsForType);
  }, [roleFilteredItems, typeFilter]);

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
            setSelectedItem(null);
            showSuccess('Booking Cancelled', `Slot released for ${booking.venueName}.`);
          },
        },
      ]
    );
  };

  const handleShareItem = async (item: UnifiedHistoryItem) => {
    try {
      let message = '';
      if (item.type === 'turf') {
        message = `🏏 Turf Booking Confirmed!\nVenue: ${item.title}\nDate: ${item.dateLabel}\nSlots: ${item.timeLabel}\nRef: ${item.bookingRef}\nLocation: ${item.location}`;
      } else if (item.type === 'class') {
        const student = item.rawClass?.enrollment.studentName;
        message = `🎓 Coaching Class Enrollment Confirmed!\nClass: ${item.title}\n${student ? `Student: ${student}\n` : ''}Schedule: ${item.dateLabel} (${item.timeLabel})\nRef: ${item.bookingRef}\nLocation: ${item.location}`;
      } else {
        const team = item.rawTournament?.registration.teamName;
        message = `🏆 Tournament Entry Confirmed!\nTournament: ${item.title}\n${team ? `Team: ${team}\n` : ''}Sport: ${item.sport || 'Sports'}\nSchedule: ${item.dateLabel}\nRef: ${item.bookingRef}\nLocation: ${item.location}`;
      }
      await Share.share({ message });
    } catch {
      showInfo('Copied', 'Reference details copied!');
    }
  };

  // Accents
  const accent = '#F59E0B';
  const info = '#3B82F6';
  const success = '#10B981';
  const danger = '#ef4444';

  const cardSurface = {
    backgroundColor: theme.surfaceLowest,
    borderColor: theme.outlineVariant + '33',
  };

  const renderTypeChip = (type: HistoryTypeFilter, label: string, icon: any, count: number) => {
    const isSelected = typeFilter === type;
    return (
      <Pressable
        key={type}
        onPress={() => setTypeFilter(type)}
        style={[
          styles.typePill,
          isSelected
            ? { backgroundColor: theme.primary, borderColor: theme.primary }
            : { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '40' },
        ]}
        hitSlop={4}
      >
        <Ionicons name={icon} size={13} color={isSelected ? '#ffffff' : theme.textSecondary} />
        <ThemedText style={[styles.typePillText, { color: isSelected ? '#ffffff' : theme.text }]}>
          {label}
        </ThemedText>
        <View style={[styles.countBadge, { backgroundColor: isSelected ? 'rgba(255,255,255,0.22)' : theme.surfaceLow }]}>
          <ThemedText style={[styles.countBadgeText, { color: isSelected ? '#ffffff' : theme.textSecondary }]}>
            {count}
          </ThemedText>
        </View>
      </Pressable>
    );
  };

  const browseTarget = () => {
    if (typeFilter === 'class') router.push('/(tabs)/coach');
    else if (typeFilter === 'tournament') router.push('/(tabs)/tournaments');
    else router.push('/(tabs)/explore');
  };

  // Header Subtitle summarizing the active view
  const headerSubtitle = useMemo(() => {
    if (allowedTypes.length === 1) {
      if (allowedTypes[0] === 'turf') return `${roleMetrics.turfCount} turf slot bookings`;
      if (allowedTypes[0] === 'tournament') return `${roleMetrics.tournamentCount} tournament hosted records`;
    }
    const parts: string[] = [];
    if (allowedTypes.includes('turf')) parts.push(`${roleMetrics.turfCount} turfs`);
    if (allowedTypes.includes('class')) parts.push(`${roleMetrics.classCount} classes`);
    if (allowedTypes.includes('tournament')) parts.push(`${roleMetrics.tournamentCount} tournaments`);
    return `${roleMetrics.totalCount} reservations (${parts.join(', ')})`;
  }, [allowedTypes, roleMetrics]);

  return (
    <GradientContainer screenName="booking" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Navigation header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/explore'))}
            style={[styles.roundBtn, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '40' }]}
            hitSlop={8}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={18} color={theme.text} />
          </Pressable>
          <View style={styles.headerTitleGroup}>
            <ThemedText style={[styles.headerTitle, { color: theme.text }]}>Booking History</ThemedText>
            <ThemedText style={[styles.headerSub, { color: theme.textSecondary }]} numberOfLines={1}>
              {headerSubtitle}
            </ThemedText>
          </View>
          <Pressable
            onPress={browseTarget}
            style={[styles.newBookingBtn, { backgroundColor: theme.primary }]}
            hitSlop={6}
          >
            <Ionicons name="add" size={14} color="#ffffff" />
            <ThemedText style={styles.newBookingText}>
              {typeFilter === 'class' ? 'Find Class' : typeFilter === 'tournament' ? 'Join Cup' : 'Book Turf'}
            </ThemedText>
          </Pressable>
        </View>

        {/* Bookings & history list */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
        >
          {/* Stat ribbon */}
          <View style={styles.statsRibbon}>
            <StatTile label="Upcoming" value={statusMetrics.upcomingCount} icon="calendar-outline" tint={theme.primary} />
            <StatTile label="Completed" value={statusMetrics.completedCount} icon="checkmark-done-outline" tint={success} />
            <StatTile label="Total Paid" value={Math.round(statusMetrics.totalSpent)} prefix="₹" icon="wallet-outline" tint={accent} />
          </View>

          {/* Category type filter bar (only when the role has several categories) */}
          {allowedTypes.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.typeFilterScroll}
              style={styles.bleed}
            >
              {renderTypeChip('all', 'All', 'grid-outline', roleMetrics.totalCount)}
              {allowedTypes.includes('turf') &&
                renderTypeChip('turf', 'Turfs', 'football-outline', roleMetrics.turfCount)}
              {allowedTypes.includes('class') &&
                renderTypeChip('class', 'Classes', 'school-outline', roleMetrics.classCount)}
              {allowedTypes.includes('tournament') &&
                renderTypeChip('tournament', 'Tournaments', 'trophy-outline', roleMetrics.tournamentCount)}
            </ScrollView>
          )}

          {/* Search bar */}
          <View style={[styles.searchBox, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '40' }]}>
            <Ionicons name="search-outline" size={15} color={theme.textSecondary} />
            <TextInput
              maxFontSizeMultiplier={MAX_FONT_SCALE}
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search by venue, class, team, student, or ref..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
            {!!searchQuery && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={6}>
                <Ionicons name="close-circle" size={15} color={theme.textSecondary} />
              </Pressable>
            )}
          </View>

          {/* Status filter — raised segmented control */}
          <View style={[styles.tabBar, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '26' }]}>
            {(
              [
                { key: 'all', label: 'All', count: statusMetrics.totalCount },
                { key: 'upcoming', label: 'Upcoming', count: statusMetrics.upcomingCount },
                { key: 'completed', label: 'Done', count: statusMetrics.completedCount },
                { key: 'cancelled', label: 'Cancelled', count: statusMetrics.cancelledCount },
              ] as const
            ).map((tab) => {
              const isSelected = statusFilter === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => setStatusFilter(tab.key)}
                  style={[styles.tabPill, isSelected && [{ backgroundColor: theme.surfaceLowest }, Shadows.level1]]}
                >
                  <ThemedText
                    style={[styles.tabPillText, { color: isSelected ? theme.primary : theme.textSecondary }]}
                    numberOfLines={1}
                  >
                    {tab.label} {tab.count}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.headingWrap}>
            <SectionHeading
              title={`${statusFilter === 'all' ? 'All' : statusFilter} ${typeFilter === 'all' ? 'bookings' : typeFilter + 's'} · ${filteredList.length}`}
              tint={theme.primary}
            />
          </View>

          {filteredList.length === 0 ? (
            <View style={[styles.emptyContainer, cardSurface]}>
              <View style={[styles.emptyIcon, { backgroundColor: theme.primary + '14' }]}>
                <Ionicons
                  name={
                    typeFilter === 'class'
                      ? 'school-outline'
                      : typeFilter === 'tournament'
                      ? 'trophy-outline'
                      : 'calendar-outline'
                  }
                  size={20}
                  color={theme.primary}
                />
              </View>
              <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
                No {statusFilter !== 'all' ? statusFilter : ''} {typeFilter !== 'all' ? typeFilter : 'booking'} records found
              </ThemedText>
              <ThemedText style={[styles.emptySub, { color: theme.textSecondary }]}>
                {searchQuery
                  ? 'Try searching with a different name, location, or reference.'
                  : typeFilter === 'class'
                  ? 'Enroll in expert coach-led masterclasses and coaching programs.'
                  : typeFilter === 'tournament'
                  ? 'Register your squad for live cups and community championships.'
                  : 'Reserve prime morning or floodlit night slots at top-rated arenas.'}
              </ThemedText>
              <Pressable onPress={browseTarget} style={[styles.exploreBtn, { backgroundColor: theme.primary }]}>
                <ThemedText style={styles.exploreBtnText}>
                  {typeFilter === 'class'
                    ? 'Explore Classes'
                    : typeFilter === 'tournament'
                    ? 'Explore Tournaments'
                    : 'Explore Arenas'}
                </ThemedText>
              </Pressable>
            </View>
          ) : (
            filteredList.slice(0, visibleItemsCount).map((item, idx) => {
              const isCancelled = item.status === 'cancelled';
              const isCompleted = item.status === 'completed';

              const statusTone = isCancelled
                ? danger
                : isCompleted
                ? info
                : item.status === 'pending'
                ? accent
                : success;

              const typeTone =
                item.type === 'turf'
                  ? success
                  : item.type === 'class'
                  ? '#6366f1'
                  : accent;

              return (
                <Reanimated.View
                  key={item.id || `history-${idx}`}
                  entering={FadeInDown.delay(idx * 35).duration(260)}
                >
                  <Pressable
                    onPress={() => setSelectedItem(item)}
                    style={({ pressed }) => [
                      styles.cleanCard,
                      cardSurface,
                      Shadows.level1,
                      { opacity: pressed ? 0.92 : 1 },
                    ]}
                  >
                    {/* Top Row: Category + Status Badges + Dashed Ref */}
                    <View style={styles.cardTopRow}>
                      <View style={styles.badgeCluster}>
                        <View style={[styles.categoryBadge, { backgroundColor: typeTone + '16' }]}>
                          <Ionicons
                            name={item.type === 'turf' ? 'football' : item.type === 'class' ? 'school' : 'trophy'}
                            size={10}
                            color={typeTone}
                          />
                          <ThemedText style={[styles.categoryBadgeText, { color: typeTone }]}>
                            {item.typeLabel}
                          </ThemedText>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: statusTone + '16' }]}>
                          <View style={[styles.statusDot, { backgroundColor: statusTone }]} />
                          <ThemedText style={[styles.statusBadgeText, { color: statusTone }]}>
                            {item.statusLabel}
                          </ThemedText>
                        </View>
                      </View>

                      {/* Dashed Ref Code Chip */}
                      <View style={[styles.refChip, { borderColor: theme.outlineVariant + '60' }]}>
                        <ThemedText style={[styles.refChipText, { color: theme.textSecondary }]}>
                          {item.bookingRef}
                        </ThemedText>
                      </View>
                    </View>

                    {/* Middle: Title & Subtitle / Location */}
                    <View style={styles.cardBody}>
                      <ThemedText style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
                        {item.title}
                      </ThemedText>

                      <View style={styles.locRow}>
                        <Ionicons
                          name={
                            item.type === 'class'
                              ? 'person-outline'
                              : item.type === 'tournament'
                              ? 'shield-outline'
                              : 'location-outline'
                          }
                          size={12}
                          color={theme.textSecondary}
                        />
                        <ThemedText style={[styles.locText, { color: theme.textSecondary }]} numberOfLines={1}>
                          {item.subtitle}
                        </ThemedText>
                      </View>
                    </View>

                    {/* Info Strip: Date & Time */}
                    <View style={[styles.infoStrip, { backgroundColor: theme.surfaceLow }]}>
                      <View style={styles.infoCol}>
                        <Ionicons name="calendar-outline" size={13} color={theme.primary} />
                        <ThemedText style={[styles.infoVal, { color: theme.text }]} numberOfLines={1}>
                          {item.dateLabel}
                        </ThemedText>
                      </View>
                      <View style={styles.infoCol}>
                        <Ionicons
                          name={item.type === 'tournament' ? 'people-outline' : 'time-outline'}
                          size={13}
                          color={theme.primary}
                        />
                        <ThemedText style={[styles.infoVal, { color: theme.text }]} numberOfLines={1}>
                          {item.timeLabel}
                        </ThemedText>
                      </View>
                    </View>

                    {/* Card Footer: Summary & Tap hint */}
                    <View style={styles.cardFooter}>
                      <View>
                        <ThemedText style={[styles.paidLabel, { color: theme.textSecondary }]}>
                          Paid Amount
                        </ThemedText>
                        <ThemedText style={[styles.paidVal, { color: '#10b981' }]}>
                          ₹{item.advancePaid.toFixed(2)}
                        </ThemedText>
                      </View>

                      <View style={styles.viewDetailsRow}>
                        <ThemedText style={[styles.viewDetailsText, { color: theme.primary }]}>
                          View details
                        </ThemedText>
                        <Ionicons name="chevron-forward" size={13} color={theme.primary} />
                      </View>
                    </View>
                  </Pressable>
                </Reanimated.View>
              );
            })
          )}

          {/* ── Auto-load more indicator / end of bookings list ── */}
          {filteredList.length > visibleItemsCount ? (
            <View style={[styles.loadMore, cardSurface]}>
              <ActivityIndicator size="small" color={theme.primary} />
              <ThemedText style={[styles.loadMoreText, { color: theme.textSecondary }]}>
                {isLoadingMore
                  ? 'Loading more records...'
                  : `Scroll to auto-load (${filteredList.length - visibleItemsCount} remaining)`}
              </ThemedText>
            </View>
          ) : filteredList.length > 6 ? (
            <ThemedText style={[styles.listEnd, { color: theme.textSecondary }]}>
              ✓ All {filteredList.length} records loaded
            </ThemedText>
          ) : null}
        </ScrollView>

        {/* ── Reservation Details Popup Modal ── */}
        <Modal
          visible={!!selectedItem}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setSelectedItem(null)}
        >
          {selectedItem && (
            <View style={styles.modalBackdrop}>
              <SafeAreaView style={[styles.modalCard, { backgroundColor: theme.background }]}>
                {/* Modal Header */}
                <View style={[styles.modalHeader, { borderBottomColor: theme.outlineVariant + '33' }]}>
                  <View style={styles.modalHeaderTitleGroup}>
                    <ThemedText style={[styles.modalTitle, { color: theme.text }]}>
                      Reservation Details
                    </ThemedText>
                    <ThemedText style={[styles.modalRef, { color: theme.textSecondary }]}>
                      Ref: <ThemedText style={{ color: theme.text, fontFamily: 'Sora_600SemiBold' }}>{selectedItem.bookingRef}</ThemedText>
                    </ThemedText>
                  </View>
                  <Pressable
                    onPress={() => setSelectedItem(null)}
                    style={[styles.modalCloseBtn, { backgroundColor: theme.surfaceLow }]}
                    hitSlop={8}
                  >
                    <Ionicons name="close" size={18} color={theme.text} />
                  </Pressable>
                </View>

                {/* Modal Body */}
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.modalContent}
                >
                  {/* Hero Image */}
                  <Image
                    source={{ uri: selectedItem.image }}
                    style={styles.modalHeroImg}
                    contentFit="cover"
                  />

                  {/* Badges & Title */}
                  <View style={styles.modalSection}>
                    <View style={styles.badgeCluster}>
                      <View
                        style={[
                          styles.categoryBadge,
                          {
                            backgroundColor:
                              selectedItem.type === 'turf'
                                ? success + '18'
                                : selectedItem.type === 'class'
                                ? '#6366f118'
                                : accent + '18',
                          },
                        ]}
                      >
                        <ThemedText
                          style={[
                            styles.categoryBadgeText,
                            {
                              color:
                                selectedItem.type === 'turf'
                                  ? success
                                  : selectedItem.type === 'class'
                                  ? '#6366f1'
                                  : accent,
                            },
                          ]}
                        >
                          {selectedItem.typeLabel}
                        </ThemedText>
                      </View>

                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor:
                              selectedItem.status === 'cancelled'
                                ? danger + '18'
                                : selectedItem.status === 'completed'
                                ? info + '18'
                                : success + '18',
                          },
                        ]}
                      >
                        <ThemedText
                          style={[
                            styles.statusBadgeText,
                            {
                              color:
                                selectedItem.status === 'cancelled'
                                  ? danger
                                  : selectedItem.status === 'completed'
                                  ? info
                                  : success,
                            },
                          ]}
                        >
                          {selectedItem.statusLabel}
                        </ThemedText>
                      </View>
                    </View>

                    <ThemedText style={[styles.modalItemTitle, { color: theme.text }]}>
                      {selectedItem.title}
                    </ThemedText>

                    <View style={styles.locRow}>
                      <Ionicons name="location-outline" size={13} color={theme.textSecondary} />
                      <ThemedText style={[styles.locText, { color: theme.textSecondary }]}>
                        {selectedItem.location || selectedItem.subtitle}
                      </ThemedText>
                    </View>
                  </View>

                  {/* Schedule Box */}
                  <View style={[styles.modalBox, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
                    <ThemedText style={[styles.boxHeader, { color: theme.textSecondary }]}>
                      SCHEDULE & TIMINGS
                    </ThemedText>

                    <View style={styles.boxRow}>
                      <View style={styles.boxIconWrap}>
                        <Ionicons name="calendar-outline" size={15} color={theme.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <ThemedText style={[styles.boxLabel, { color: theme.textSecondary }]}>Date / Range</ThemedText>
                        <ThemedText style={[styles.boxValue, { color: theme.text }]}>
                          {selectedItem.dateLabel}
                        </ThemedText>
                      </View>
                    </View>

                    <View style={styles.boxRow}>
                      <View style={styles.boxIconWrap}>
                        <Ionicons
                          name={selectedItem.type === 'tournament' ? 'trophy-outline' : 'time-outline'}
                          size={15}
                          color={theme.primary}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <ThemedText style={[styles.boxLabel, { color: theme.textSecondary }]}>
                          {selectedItem.type === 'tournament' ? 'Sport / Format' : 'Session Timings'}
                        </ThemedText>
                        <ThemedText style={[styles.boxValue, { color: theme.text }]}>
                          {selectedItem.timeLabel}
                        </ThemedText>
                      </View>
                    </View>
                  </View>

                  {/* Domain-specific info */}
                  {selectedItem.type === 'class' && selectedItem.rawClass && (
                    <View style={[styles.modalBox, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
                      <ThemedText style={[styles.boxHeader, { color: theme.textSecondary }]}>
                        STUDENT DETAILS
                      </ThemedText>
                      <View style={styles.metaRow}>
                        <ThemedText style={[styles.boxLabel, { color: theme.textSecondary }]}>Enrolled Student</ThemedText>
                        <ThemedText style={[styles.boxValue, { color: theme.text }]}>
                          {selectedItem.rawClass.enrollment.studentName || 'Player'}
                          {selectedItem.rawClass.enrollment.studentAge ? ` (${selectedItem.rawClass.enrollment.studentAge} yrs)` : ''}
                        </ThemedText>
                      </View>
                      {selectedItem.rawClass.cls?.coachName && (
                        <View style={styles.metaRow}>
                          <ThemedText style={[styles.boxLabel, { color: theme.textSecondary }]}>Lead Coach</ThemedText>
                          <ThemedText style={[styles.boxValue, { color: theme.text }]}>
                            Coach {selectedItem.rawClass.cls.coachName}
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  )}

                  {selectedItem.type === 'tournament' && selectedItem.rawTournament && (
                    <View style={[styles.modalBox, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
                      <ThemedText style={[styles.boxHeader, { color: theme.textSecondary }]}>
                        TEAM & SQUAD
                      </ThemedText>
                      <View style={styles.metaRow}>
                        <ThemedText style={[styles.boxLabel, { color: theme.textSecondary }]}>Registered Team</ThemedText>
                        <ThemedText style={[styles.boxValue, { color: theme.text }]}>
                          {selectedItem.rawTournament.registration.teamName}
                        </ThemedText>
                      </View>
                      <View style={styles.metaRow}>
                        <ThemedText style={[styles.boxLabel, { color: theme.textSecondary }]}>Squad Members</ThemedText>
                        <ThemedText style={[styles.boxValue, { color: theme.text }]}>
                          {selectedItem.rawTournament.registration.squad?.length || 0} Registered Players
                        </ThemedText>
                      </View>
                    </View>
                  )}

                  {selectedItem.type === 'turf' && selectedItem.rawTurf && (selectedItem.rawTurf.coachAdded || selectedItem.rawTurf.recordingAdded) && (
                    <View style={[styles.modalBox, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
                      <ThemedText style={[styles.boxHeader, { color: theme.textSecondary }]}>
                        ADD-ON SERVICES
                      </ThemedText>
                      {selectedItem.rawTurf.coachAdded && (
                        <View style={styles.metaRow}>
                          <ThemedText style={[styles.boxValue, { color: info }]}>✓ Personal Coach Session Included</ThemedText>
                        </View>
                      )}
                      {selectedItem.rawTurf.recordingAdded && (
                        <View style={styles.metaRow}>
                          <ThemedText style={[styles.boxValue, { color: '#8b5cf6' }]}>✓ 4K/HD Video Match Recording Enabled</ThemedText>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Financial Breakdown */}
                  <View style={[styles.modalBox, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
                    <ThemedText style={[styles.boxHeader, { color: theme.textSecondary }]}>
                      PAYMENT SUMMARY
                    </ThemedText>
                    <View style={styles.metaRow}>
                      <ThemedText style={[styles.boxLabel, { color: theme.textSecondary }]}>Total Booking Fee</ThemedText>
                      <ThemedText style={[styles.boxValue, { color: theme.text }]}>
                        ₹{selectedItem.totalAmount.toFixed(2)}
                      </ThemedText>
                    </View>
                    <View style={styles.metaRow}>
                      <ThemedText style={[styles.boxLabel, { color: theme.textSecondary }]}>Paid Amount</ThemedText>
                      <ThemedText style={[styles.boxValue, { color: '#10b981', fontFamily: 'Sora_600SemiBold' }]}>
                        ₹{selectedItem.advancePaid.toFixed(2)}
                      </ThemedText>
                    </View>
                    <View style={styles.metaRow}>
                      <ThemedText style={[styles.boxLabel, { color: theme.textSecondary }]}>Remaining Due</ThemedText>
                      <ThemedText
                        style={[
                          styles.boxValue,
                          {
                            color: selectedItem.remaining > 0 ? '#b45309' : theme.textSecondary,
                            fontFamily: selectedItem.remaining > 0 ? 'Sora_600SemiBold' : 'Sora_400Regular',
                          },
                        ]}
                      >
                        ₹{selectedItem.remaining.toFixed(2)}
                      </ThemedText>
                    </View>
                  </View>
                </ScrollView>

                {/* Modal Footer Actions */}
                <View style={[styles.modalFooter, { borderTopColor: theme.outlineVariant + '26', backgroundColor: theme.surfaceLowest }]}>
                  {/* Share Action */}
                  <Pressable
                    onPress={() => handleShareItem(selectedItem)}
                    style={[styles.modalShareBtn, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '50' }]}
                    hitSlop={6}
                  >
                    <Ionicons name="share-social-outline" size={16} color={theme.text} />
                  </Pressable>

                  {/* Contextual Target Button */}
                  <Pressable
                    onPress={() => {
                      const item = selectedItem;
                      setSelectedItem(null);
                      if (item.type === 'turf') {
                        router.push({
                          pathname: '/details',
                          params: { id: item.rawTurf?.venueId, name: item.rawTurf?.venueName },
                        });
                      } else if (item.type === 'class') {
                        router.push('/(tabs)/coach');
                      } else {
                        router.push({
                          pathname: '/tournament-details',
                          params: {
                            id: item.rawTournament?.registration.tournamentId,
                            name: item.rawTournament?.registration.tournamentName,
                          },
                        });
                      }
                    }}
                    style={[styles.modalPrimaryBtn, { backgroundColor: theme.primary }]}
                  >
                    <ThemedText style={styles.modalPrimaryBtnText}>
                      {selectedItem.type === 'turf'
                        ? selectedItem.status === 'completed' || selectedItem.status === 'cancelled'
                          ? 'Book Turf Again'
                          : 'View Arena'
                        : selectedItem.type === 'class'
                        ? 'View Classes'
                        : 'View Tournament'}
                    </ThemedText>
                  </Pressable>

                  {/* Cancel Button if upcoming turf */}
                  {selectedItem.type === 'turf' && (selectedItem.status === 'confirmed' || selectedItem.status === 'pending') && selectedItem.rawTurf && (
                    <Pressable
                      onPress={() => handleCancelBooking(selectedItem.rawTurf!)}
                      style={[styles.modalDangerBtn, { borderColor: danger + '55' }]}
                    >
                      <ThemedText style={[styles.modalDangerBtnText, { color: danger }]}>
                        Cancel
                      </ThemedText>
                    </Pressable>
                  )}
                </View>
              </SafeAreaView>
            </View>
          )}
        </Modal>
      </SafeAreaView>
    </GradientContainer>
  );
}

const GUTTER = Spacing.containerMargin;
const CARD_RADIUS = BorderRadius.premium;

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },

  // header
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
  headerTitleGroup: { flex: 1, minWidth: 0 },
  headerTitle: { fontFamily: 'Sora_500Medium', fontSize: 14.5 },
  headerSub: { fontFamily: 'Sora_400Regular', fontSize: 10, marginTop: 1 },
  newBookingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 30,
    paddingHorizontal: 11,
    borderRadius: 999,
  },
  newBookingText: { color: '#ffffff', fontFamily: 'Sora_500Medium', fontSize: 10.5 },

  // list
  listContent: { paddingHorizontal: GUTTER, paddingTop: 12, paddingBottom: 40, gap: 12 },
  bleed: { marginHorizontal: -GUTTER },
  statsRibbon: { flexDirection: 'row', gap: 8 },
  typeFilterScroll: { flexDirection: 'row', paddingHorizontal: GUTTER, paddingVertical: 2, gap: 6 },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 32,
    paddingLeft: 11,
    paddingRight: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  typePillText: { fontFamily: 'Sora_500Medium', fontSize: 10.5 },
  countBadge: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center' },
  countBadgeText: { fontFamily: 'Sora_500Medium', fontSize: 9.5 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 13,
    height: 38,
    borderRadius: 999,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Sora_400Regular',
    fontSize: 11.5,
    padding: 0,
    includeFontPadding: false,
    ...({ outlineStyle: 'none' } as any),
  },
  tabBar: {
    flexDirection: 'row',
    gap: 3,
    padding: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  tabPill: {
    flex: 1,
    height: 30,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabPillText: { fontFamily: 'Sora_500Medium', fontSize: 10 },
  headingWrap: { marginTop: 4, marginBottom: -6 },

  // Redesigned Spacious Clean Card
  cleanCard: {
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  badgeCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  categoryBadgeText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 9.5,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusDot: { width: 5, height: 5, borderRadius: 2.5 },
  statusBadgeText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 9.5,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  refChip: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  refChipText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 10,
    letterSpacing: 0.5,
  },

  cardBody: {
    gap: 4,
  },
  cardTitle: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 15,
    letterSpacing: -0.1,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11.5,
    flex: 1,
  },

  infoStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
  },
  infoCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  infoVal: {
    fontFamily: 'Sora_500Medium',
    fontSize: 11,
    flexShrink: 1,
  },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  paidLabel: {
    fontFamily: 'Sora_400Regular',
    fontSize: 10,
  },
  paidVal: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 14,
    marginTop: 1,
  },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewDetailsText: {
    fontFamily: 'Sora_500Medium',
    fontSize: 11.5,
  },

  // Empty state
  emptyContainer: {
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    gap: 4,
  },
  emptyIcon: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyTitle: { fontFamily: 'Sora_600SemiBold', fontSize: 14, textAlign: 'center' },
  emptySub: { fontFamily: 'Sora_400Regular', fontSize: 11.5, textAlign: 'center', lineHeight: 16, marginTop: 2 },
  exploreBtn: { marginTop: 12, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 999 },
  exploreBtnText: { color: '#ffffff', fontFamily: 'Sora_600SemiBold', fontSize: 11.5 },

  loadMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
  },
  loadMoreText: { fontFamily: 'Sora_500Medium', fontSize: 11 },
  listEnd: { fontFamily: 'Sora_400Regular', fontSize: 10, textAlign: 'center', paddingVertical: 8, opacity: 0.7 },

  // Modal Backdrop & Card
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    maxHeight: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalHeaderTitleGroup: {
    flex: 1,
  },
  modalTitle: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 14.5,
    letterSpacing: -0.2,
  },
  modalRef: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11,
    marginTop: 1,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 24,
    gap: 14,
  },
  modalHeroImg: {
    width: '100%',
    height: 140,
    borderRadius: 16,
  },
  modalSection: {
    gap: 6,
  },
  modalItemTitle: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 15.5,
    letterSpacing: -0.2,
    marginTop: 4,
  },
  modalBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  boxHeader: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 10,
    letterSpacing: 0.8,
  },
  boxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  boxIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxLabel: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11,
  },
  boxValue: {
    fontFamily: 'Sora_500Medium',
    fontSize: 12.5,
    marginTop: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },

  // Modal Footer
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  modalShareBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryBtnText: {
    color: '#ffffff',
    fontFamily: 'Sora_600SemiBold',
    fontSize: 13,
  },
  modalDangerBtn: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDangerBtnText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 12.5,
  },
});
