import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GradientContainer } from '@/components/gradient-container';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/context/ToastContext';
import { useNotifications } from '@/context/NotificationContext';
import { PromoBanner } from '@/components/promo-banner';
import { useBookings, useWalletStore, useClassStore, useTurfStore } from '@/store/app-store';
import { getCalendarGrid, formatDateFull, formatDateShort, formatDateISO, MONTH_NAMES, advanceMonth, isTimeSlotPassed, formatSlotsRange } from '@/utils/date-utils';
import { turfApi } from '@/services/turf-api';
import { cleanLocation } from '@/utils/location';

// Slots details (Full 6 AM - 11 PM range in 12-hour AM/PM format)
const TIME_SLOTS = [
  { time: '06:00 AM', icon: 'sunny-outline', disabled: false },
  { time: '07:00 AM', icon: 'sunny-outline', disabled: false },
  { time: '08:00 AM', icon: 'sunny-outline', disabled: false },
  { time: '09:00 AM', icon: 'sunny-outline', disabled: false },
  { time: '10:00 AM', icon: 'sunny-outline', disabled: false },
  { time: '11:00 AM', icon: 'sunny-outline', disabled: false },
  { time: '12:00 PM', icon: 'sunny', disabled: false },
  { time: '01:00 PM', icon: 'sunny', disabled: false },
  { time: '02:00 PM', icon: 'sunny', disabled: false },
  { time: '03:00 PM', icon: 'sunny', disabled: false },
  { time: '04:00 PM', icon: 'sunny', disabled: false },
  { time: '05:00 PM', icon: 'sunny', disabled: false },
  { time: '06:00 PM', icon: 'moon-outline', disabled: false },
  { time: '07:00 PM', icon: 'moon-outline', disabled: false },
  { time: '08:00 PM', icon: 'moon', disabled: false },
  { time: '09:00 PM', icon: 'moon', disabled: false },
  { time: '10:00 PM', icon: 'moon', disabled: false },
  { time: '11:00 PM', icon: 'moon', disabled: false },
];

const DAYS_OF_WEEK = [
  { short: 'Mon', full: 'Monday' },
  { short: 'Tue', full: 'Tuesday' },
  { short: 'Wed', full: 'Wednesday' },
  { short: 'Thu', full: 'Thursday' },
  { short: 'Fri', full: 'Friday' },
  { short: 'Sat', full: 'Saturday' },
  { short: 'Sun', full: 'Sunday' },
];

const PAYMENT_METHODS = [
  { id: 'apple',  label: 'Apple Pay',   icon: 'logo-apple',   family: 'Ionicons', color: '#000000' },
  { id: 'paypal', label: 'PayPal',      icon: 'paypal',       family: 'FontAwesome5', color: '#003087' },
  { id: 'gpay',   label: 'Google Pay',  icon: 'logo-google',  family: 'Ionicons', color: '#ea4335' },
  { id: 'credit', label: 'Credit Card', icon: 'card',         family: 'Ionicons', color: '#ff5722' },
  { id: 'debit',  label: 'Debit Card',  icon: 'card-outline', family: 'Ionicons', color: '#0f9d58' },
];

const ADVANCE_OPTIONS = [
  { pct: 25, label: '25%' },
  { pct: 50, label: '50%' },
  { pct: 100, label: 'Full' },
];

const VENUE_LOOKUP: Record<string, {
  name: string;
  location: string;
  rating: string;
  reviews: string;
  image: any;
  basePrice: number;
}> = {
  'skyline': {
    name: 'Skyline Arena Elite',
    location: 'Canary Wharf, East London',
    rating: '4.9',
    reviews: '184 Reviews',
    image: require('@/assets/images/sports/sport_football.png'),
    basePrice: 150,
  },
  'the-grid': {
    name: 'The Grid Multisport',
    location: 'Stratford Central, London',
    rating: '4.7',
    reviews: '96 Reviews',
    image: require('@/assets/images/sports/sport_basketball.png'),
    basePrice: 110,
  },
  'lords': {
    name: "Lord's View Pavillion",
    location: "St John's Wood, London",
    rating: '4.9',
    reviews: '248 Reviews',
    image: require('@/assets/images/sports/sport_cricket.png'),
    basePrice: 120,
  },
};

export default function BookingConfigurationScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; name?: string; price?: string; date?: string }>();
  const { addBooking } = useBookings();
  const { walletBalance, addWalletFunds, deductWalletFunds } = useWalletStore();
  const { classes } = useClassStore();
  const { ownedTurfs } = useTurfStore();
  const { showSuccess, showError } = useToast();
  const { addNotification } = useNotifications();

  const [remoteTurf, setRemoteTurf] = React.useState<any>(null);
  const [refreshing, setRefreshing] = React.useState(false);

  const fetchTurf = React.useCallback(async () => {
    if (params.id) {
      try {
        const t = await turfApi.getTurfDetails(params.id);
        if (t) setRemoteTurf(t);
      } catch {}
    }
  }, [params.id]);

  React.useEffect(() => {
    fetchTurf();
  }, [fetchTurf]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchTurf();
    setTimeout(() => setRefreshing(false), 600);
  }, [fetchTurf]);

  // Dynamic Venue lookup with robust fallbacks
  const userTurf = remoteTurf || (ownedTurfs || []).find(t => t.id === params.id);
  const venue = userTurf ? {
    name: userTurf.name,
    location: cleanLocation(userTurf.address || 'Local Arena'),
    rating: `${userTurf.rating || 5.0}`,
    reviews: '12 Reviews',
    image: userTurf.thumbnailImage || (userTurf.images && userTurf.images[0]) || require('@/assets/images/sports/sport_football.png'),
    basePrice: Number(userTurf.pricePerSlot) || 120,
  } : (params.id && VENUE_LOOKUP[params.id] ? {
    ...VENUE_LOOKUP[params.id],
    location: cleanLocation(VENUE_LOOKUP[params.id].location),
  } : {
    name: params.name || "Lord's View Pavillion",
    location: cleanLocation('St John\'s Wood, London'),
    rating: '4.9',
    reviews: '248 Reviews',
    image: require('@/assets/images/sports/sport_cricket.png'),
    basePrice: params.price ? Number(String(params.price).replace(/[^0-9.]/g, '')) || 120 : 120,
  });

  const galleryImages = React.useMemo(() => {
    const list: (string | any)[] = [];
    if (userTurf) {
      if (Array.isArray(userTurf.images) && userTurf.images.length > 0) {
        userTurf.images.forEach((img: any) => {
          const uri = typeof img === 'string' ? img : img?.uri;
          if (uri && !list.includes(uri)) list.push(uri);
        });
      }
      if (userTurf.thumbnailImage && !list.includes(userTurf.thumbnailImage)) {
        list.unshift(userTurf.thumbnailImage);
      }
    }
    if (list.length === 0) {
      if (venue.image) list.push(venue.image);
    }
    return list;
  }, [userTurf, venue.image]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [heroCardWidth, setHeroCardWidth] = useState(0);

  const venueId = params.id || 'lords';

  // Calendar state — real date aware
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<string>(
    today.toLocaleDateString('en-US', { weekday: 'long' })
  );

  const selectedDayOfMonth = selectedDate ? selectedDate.getDate() : today.getDate();

  const calendarGrid = useMemo(() => getCalendarGrid(calYear, calMonth), [calYear, calMonth]);

  const handlePrevMonth = () => {
    // Don't allow going to past months
    const prev = advanceMonth(calYear, calMonth, -1);
    const prevDate = new Date(prev.year, prev.month, 1);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    if (prevDate >= thisMonth) {
      setCalYear(prev.year);
      setCalMonth(prev.month);
    }
  };

  const handleNextMonth = () => {
    const next = advanceMonth(calYear, calMonth, 1);
    setCalYear(next.year);
    setCalMonth(next.month);
  };

  // Booking states
  const [selectedSlots, setSelectedSlots] = useState<string[]>(() => {
    const upcoming = TIME_SLOTS.find(s => !isTimeSlotPassed(s.time, new Date()));
    return upcoming ? [upcoming.time] : [];
  });
  const [isSlotsExpanded, setIsSlotsExpanded] = useState<boolean>(true);
  const [coachAdded, setCoachAdded] = useState(false);
  const [recordingAdded, setRecordingAdded] = useState(false);
  const [advancePct, setAdvancePct] = useState<number>(100); // 25 | 50 | 100
  const [paymentMethod, setPaymentMethod] = useState<string>('apple');
  const [useWallet, setUseWallet] = useState<boolean>(false);

  // Coupon / Promo Code states
  const [couponCode, setCouponCode] = useState<string>('');
  const [couponInput, setCouponInput] = useState<string>('');
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [couponError, setCouponError] = useState<string>('');
  const [couponApplied, setCouponApplied] = useState<boolean>(false);
  const [cashbackOffer, setCashbackOffer] = useState<{ code: string; cashback: number } | null>(null);

  // Valid coupon codes
  const VALID_COUPONS: Record<string, { discount: number; type: 'flat' | 'percent'; cashback: number }> = {
    'YAWAH30':   { discount: 30,  type: 'percent', cashback: 50  },
    'FIRST50':   { discount: 50,  type: 'flat',    cashback: 100 },
    'TURF20':    { discount: 20,  type: 'percent', cashback: 0   },
    'HAPPYHOUR': { discount: 15,  type: 'flat',    cashback: 20  },
  };

  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    const found = VALID_COUPONS[code];
    if (!found) {
      setCouponError('Invalid coupon code. Try YAWAH30 or FIRST50.');
      setCouponDiscount(0);
      setCouponApplied(false);
      setCashbackOffer(null);
      return;
    }
    const disc = found.type === 'percent'
      ? Math.round((total * found.discount) / 100)
      : found.discount;
    setCouponCode(code);
    setCouponDiscount(disc);
    setCouponApplied(true);
    setCouponError('');
    if (found.cashback > 0) {
      setCashbackOffer({ code, cashback: found.cashback });
    } else {
      setCashbackOffer(null);
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setCouponInput('');
    setCouponDiscount(0);
    setCouponApplied(false);
    setCouponError('');
    setCashbackOffer(null);
  };

  // Split Bill states
  const [isSplitEnabled, setIsSplitEnabled] = useState<boolean>(false);
  const [splitPlayers, setSplitPlayers] = useState<Array<{ id: string; name: string; hours: number }>>([
    { id: '1', name: 'You', hours: 1 },
    { id: '2', name: 'Alen', hours: 1 },
  ]);
  const [newPlayerName, setNewPlayerName] = useState<string>('');

  // Constants
  const courtFee = venue.basePrice * selectedSlots.length;
  const serviceCharge = 12.00;
  const coachFee = coachAdded ? 45.00 : 0.00;
  const recordingFee = recordingAdded ? 25.00 : 0.00;
  const total = courtFee + serviceCharge + coachFee + recordingFee;
  const advanceAmount = Math.round((total * advancePct) / 100);

  // Wallet deductions
  const walletDeduction = useWallet ? Math.min(walletBalance, advanceAmount) : 0;
  const finalPayable = advanceAmount - walletDeduction - couponDiscount;
  const remainingAmount = total - advanceAmount;

  const toggleSlot = (time: string) => {
    const effectiveDate = selectedDate || selectedDayOfWeek;
    if (isTimeSlotPassed(time, effectiveDate)) return;
    if (selectedSlots.includes(time)) {
      setSelectedSlots(selectedSlots.filter(s => s !== time));
    } else {
      setSelectedSlots([...selectedSlots, time].sort());
    }
  };

  const handleConfirmBooking = () => {
    if (!selectedDate) {
      // Show a gentle inline nudge instead of Alert
      return;
    }

    // Deduct funds from wallet if applied
    if (useWallet && walletDeduction > 0) {
      deductWalletFunds(walletDeduction);
    }

    // Add ₹100 Cashback reward to wallet balance
    addWalletFunds(100);

    // Save booking to global store
    const booking = addBooking({
      venueId,
      venueName: venue.name,
      venueLocation: venue.location,
      venueImage: typeof venue.image === 'string' ? venue.image : '',
      date: formatDateISO(selectedDate),
      dayLabel: formatDateFull(selectedDate),
      slots: selectedSlots,
      totalAmount: total,
      advancePaid: finalPayable,
      remaining: remainingAmount,
      paymentMethod: finalPayable === 0 ? 'wallet' : paymentMethod,
      coachAdded,
      recordingAdded,
    });

    // Show attractive success toast
    showSuccess('Booking Confirmed! 🎉', `Ref: ${booking.bookingRef} at ${venue.name}`);

    // Trigger role-targeted notifications
    addNotification({
      title: 'Booking Confirmed!',
      body: `Your booking at ${venue.name} for ${formatDateFull(selectedDate)} is confirmed. Ref: ${booking.bookingRef}`,
      targetRole: 'Player',
      type: 'booking',
    });

    addNotification({
      title: `New Booking at ${venue.name}`,
      body: `A slot was booked for ${formatDateFull(selectedDate)}. ₹${finalPayable.toFixed(2)} received.`,
      targetRole: 'Owner',
      type: 'booking',
    });

    // Navigate to confirmation screen with cashback parameters
    router.push({
      pathname: '/booking-confirmation',
      params: {
        bookingRef: booking.bookingRef,
        venueName: venue.name,
        dayLabel: formatDateFull(selectedDate),
        slots: selectedSlots.join(','),
        total: total.toFixed(2),
        advancePaid: finalPayable.toFixed(2),
        cashbackEarned: '100', // Pass cashback amount to display success splash
      },
    });
  };

  return (
    <GradientContainer screenName="booking" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Top App Bar */}
        <View style={[styles.header, { backgroundColor: 'transparent' }]}>
          <Pressable 
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)');
              }
            }} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </Pressable>
          <ThemedText type="headlineSm" style={styles.headerTitle}>
            Book Venue
          </ThemedText>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
          }
        >
          {/* Hero Card */}
          <View style={styles.heroWrapper}>
            <View 
              style={[styles.heroCard, { backgroundColor: theme.primaryContainer }]}
              onLayout={(e) => {
                const { width } = e.nativeEvent.layout;
                if (width > 0) setHeroCardWidth(width);
              }}
            >
              {galleryImages.length > 1 ? (
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={(e) => {
                    const w = heroCardWidth || 1;
                    const page = Math.round(e.nativeEvent.contentOffset.x / w);
                    setActiveImageIndex(page);
                  }}
                  style={{ width: '100%', height: '100%' }}
                >
                  {galleryImages.map((img, idx) => (
                    <Image
                      key={idx}
                      source={
                        typeof img === 'string' && !/^\d+$/.test(img)
                          ? { uri: img }
                          : typeof img === 'number'
                          ? img
                          : typeof img === 'string'
                          ? parseInt(img, 10)
                          : img?.uri ? { uri: img.uri } : venue.image
                      }
                      style={{ width: heroCardWidth || '100%', height: '100%' }}
                      contentFit="cover"
                    />
                  ))}
                </ScrollView>
              ) : (
                <Image
                  source={
                    typeof venue.image === 'string' && !/^\d+$/.test(venue.image)
                      ? { uri: venue.image }
                      : typeof venue.image === 'number'
                      ? venue.image
                      : parseInt(venue.image || '1', 10)
                  }
                  style={styles.heroImage}
                  contentFit="cover"
                />
              )}

              {/* Pagination Dots & Counter when multiple images exist */}
              {galleryImages.length > 1 && (
                <View style={[styles.sliderDotsRow, { bottom: 90 }]}>
                  {galleryImages.map((_, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.sliderDot,
                        idx === activeImageIndex && styles.sliderDotActive,
                      ]}
                    />
                  ))}
                </View>
              )}
              
              {/* Fav Button top right */}
              <Pressable style={[styles.favFab, { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 }]}>
                <Ionicons name="heart" size={20} color="#ff4757" />
              </Pressable>

              <View style={styles.heroOverlay}>
                <ThemedText type="headlineLg" style={styles.heroTitle}>
                  {venue.name}
                </ThemedText>
                <View style={styles.heroSubRow}>
                  <View style={styles.heroSubItem}>
                    <Ionicons name="location-outline" size={14} color="#ffffffaa" />
                    <ThemedText type="bodySm" style={styles.heroSubText}>
                      {(venue.location || 'Local Arena').split(',')[0]}
                    </ThemedText>
                  </View>
                  <View style={[styles.heroSubItem, { borderLeftWidth: 1, borderLeftColor: '#ffffff22', paddingLeft: 12, marginLeft: 12 }]}>
                    <Ionicons name="star" size={14} color="#ffffff" />
                    <ThemedText type="bodySm" style={[styles.heroSubText, { color: '#ffffff', fontWeight: 'bold' }]}>
                      {venue.rating || '5.0'} <ThemedText type="labelSm" style={{ color: '#ffffffaa' }}>({(venue.reviews || '10+').split(' ')[0]})</ThemedText>
                    </ThemedText>
                  </View>
                </View>
              </View>
            </View>
          </View>



          {/* Published Class Advertisement Promo Banner */}
          {classes && classes.length > 0 && (
            <View style={styles.section}>
              <PromoBanner
                title={classes[0].className || 'Featured Coaching Class'}
                subtitle={`Join ${classes[0].sportType || 'Sports'} Batch • ${classes[0].classType || 'Regular Class'} at ${classes[0].venue || 'Local Turf'}`}
                buttonText="Enroll in Class →"
                onPress={() => router.push('/(tabs)/coach')}
                isGradient={true}
                gradientColors={['rgba(16, 185, 129, 0.7)', 'rgba(5, 150, 105, 0.9)']}
                borderColor="rgba(16, 185, 129, 0.3)"
                titleColor="#ffffff"
                subtitleColor="rgba(255, 255, 255, 0.92)"
                buttonBackgroundColor="#ffffff"
                buttonTextColor="#059669"
                backgroundImage={require("@/assets/images/illustrations/coaching_class_premium.png")}
              />
            </View>
          )}

          {/* Date Picker Grid */}
          <View style={styles.section}>
            <View style={[styles.formCard, { backgroundColor: theme.surfaceLowest }, Shadows.level2]}>
              <View style={styles.monthHeader}>
                <ThemedText type="headlineSm" style={{ color: theme.text }}>
                  {MONTH_NAMES[calMonth]} {calYear}
                </ThemedText>
                <View style={styles.monthNav}>
                  <Pressable style={styles.monthNavBtn} onPress={handlePrevMonth}>
                    <Ionicons name="chevron-back" size={18} color={theme.text} />
                  </Pressable>
                  <Pressable style={styles.monthNavBtn} onPress={handleNextMonth}>
                    <Ionicons name="chevron-forward" size={18} color={theme.text} />
                  </Pressable>
                </View>
              </View>

              {/* Date not selected nudge */}
              {!selectedDate && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, paddingHorizontal: 4, backgroundColor: theme.error + '15', borderRadius: 8, padding: 8 }}>
                  <Ionicons name="calendar-outline" size={13} color={theme.error} />
                  <ThemedText style={{ fontSize: 11, color: theme.error, fontFamily: 'Sora_600SemiBold' }}>Please select a date to continue</ThemedText>
                </View>
              )}

              {/* Day Labels */}
              <View style={styles.dayLabelsRow}>
                {['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'].map((d) => (
                  <ThemedText key={d} type="labelSm" style={[styles.dayLabelText, { color: theme.textSecondary }]}>
                    {d}
                  </ThemedText>
                ))}
              </View>

              {/* Month Grid — real date-aware */}
              <View style={styles.calendarGrid}>
                {calendarGrid.map((item, idx) => {
                  if (item.isPadding) {
                    return <View key={`pad-${idx}`} style={styles.calendarDayCell} />;
                  }

                  const isSelected = selectedDate && item.date &&
                    selectedDate.toDateString() === item.date.toDateString();
                  const isToday = item.isToday;
                  const isPast = item.isPast;

                  return (
                    <Pressable
                      key={`day-${item.dayNumber}`}
                      disabled={isPast}
                      onPress={() => {
                        if (item.date) {
                          setSelectedDate(item.date);
                          setSelectedDayOfWeek(item.date.toLocaleDateString('en-US', { weekday: 'long' }));
                          setSelectedSlots(prev => prev.filter(s => !isTimeSlotPassed(s, item.date)));
                        }
                      }}
                      style={[
                        styles.calendarDayCell,
                        isSelected && { backgroundColor: theme.secondaryContainer, borderRadius: BorderRadius.md },
                        isToday && !isSelected && { borderWidth: 1.5, borderColor: theme.primary, borderRadius: BorderRadius.md },
                      ]}
                    >
                      <ThemedText
                        type="bodyMd"
                        style={{
                          color: isSelected ? theme.onSecondaryContainer : isPast ? theme.textSecondary : isToday ? theme.primary : theme.text,
                          fontFamily: isSelected ? 'Sora_700Bold' : 'Sora_400Regular',
                          opacity: isPast ? 0.35 : 1,
                        }}
                      >
                        {item.dayNumber}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Time & Duration Config */}
          <View style={styles.section}>
            <View style={[styles.formCard, { backgroundColor: theme.surfaceLowest }, Shadows.level1]}>
              {/* Collapse/Expand Section Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="time" size={15} color={theme.primary} />
                  <ThemedText type="labelMd" style={{ fontSize: 12.5, fontFamily: 'Sora_700Bold', color: theme.text }}>
                    Select Day & Time Slot
                  </ThemedText>
                </View>
                <Pressable
                  onPress={() => setIsSlotsExpanded(!isSlotsExpanded)}
                  style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: theme.primary + '15', justifyContent: 'center', alignItems: 'center' }}
                  hitSlop={8}
                >
                  <Ionicons 
                    name={isSlotsExpanded ? "chevron-up" : "chevron-down"} 
                    size={16} 
                    color={theme.primary} 
                  />
                </Pressable>
              </View>

              {isSlotsExpanded ? (
                <>
                  {/* Day Selector — Short names (Mon-Sun) in one row */}
                  <View style={styles.daySelectorGrid}>
                    {DAYS_OF_WEEK.map((d, dayIdx) => {
                      const isActive = d.full === selectedDayOfWeek;
                      const todayIndex = (new Date().getDay() + 6) % 7; // Mon=0 ... Sun=6
                      const isPastDay = dayIdx < todayIndex;

                      return (
                        <Pressable
                          key={d.full}
                          disabled={isPastDay}
                          onPress={() => {
                            if (isPastDay) return;
                            setSelectedDayOfWeek(d.full);
                            const matched = calendarGrid.find(cell => 
                              cell.date && cell.date.toLocaleDateString('en-US', { weekday: 'long' }) === d.full
                            );
                            if (matched && matched.date) {
                              setSelectedDate(matched.date);
                              setSelectedSlots(prev => prev.filter(s => !isTimeSlotPassed(s, matched.date)));
                            } else {
                              setSelectedSlots(prev => prev.filter(s => !isTimeSlotPassed(s, d.full)));
                            }
                          }}
                          style={[
                            styles.daySelectorTab,
                            isActive
                              ? [styles.daySelectorTabActive, { backgroundColor: theme.secondaryContainer, borderColor: theme.secondary + '44' }]
                              : { backgroundColor: theme.surfaceLow, borderColor: 'transparent' },
                            isPastDay && { opacity: 0.35, backgroundColor: theme.surfaceLow + '80' },
                          ]}
                        >
                          <ThemedText
                            type="labelMd"
                            style={{
                              color: isActive ? theme.onSecondaryContainer : isPastDay ? theme.textSecondary : theme.textSecondary,
                              fontFamily: isActive ? 'Sora_700Bold' : 'Sora_600SemiBold',
                              fontSize: 11.5,
                              letterSpacing: 0.1,
                            }}
                          >
                            {d.short}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Time Slots Grid */}
                  <View style={styles.slotsGrid}>
                    {TIME_SLOTS.map((slot) => {
                      const effectiveDate = selectedDate || selectedDayOfWeek;
                      const isPassed = isTimeSlotPassed(slot.time, effectiveDate);
                      const isSelected = selectedSlots.includes(slot.time);
                      const isDisabled = slot.disabled || isPassed;
                      
                      return (
                        <Pressable
                          key={slot.time}
                          disabled={isDisabled}
                          onPress={() => toggleSlot(slot.time)}
                          style={[
                            styles.slotItem,
                            { backgroundColor: theme.surfaceLow },
                            isSelected && { backgroundColor: theme.primary },
                            isDisabled && { opacity: 0.35, backgroundColor: theme.surfaceLow + '60' },
                          ]}
                        >
                          <Ionicons
                            name={slot.icon as any}
                            size={14}
                            color={isSelected ? '#ffffff' : isDisabled ? theme.textSecondary + '40' : theme.textSecondary}
                          />
                          <ThemedText
                            type="bodyMd"
                            style={{
                              color: isSelected ? '#ffffff' : isDisabled ? theme.textSecondary + '60' : theme.text,
                              fontFamily: 'Sora_700Bold',
                              fontSize: 11,
                              marginLeft: 3,
                              textDecorationLine: isDisabled ? 'line-through' : 'none',
                            }}
                          >
                            {slot.time}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Notice */}
                  <View style={styles.noticeRow}>
                    <Ionicons name="information-circle-outline" size={16} color={theme.textSecondary} />
                    <ThemedText type="bodySm" style={{ color: theme.textSecondary, marginLeft: 4, flex: 1 }}>
                      The time slots are in local time. Free cancellation up to 24h before.
                    </ThemedText>
                  </View>
                </>
              ) : (
                <Pressable onPress={() => setIsSlotsExpanded(true)} style={{ padding: 10, backgroundColor: theme.primary + '0A', borderRadius: BorderRadius.lg, alignItems: 'center' }}>
                  <ThemedText style={{ color: theme.primary, fontFamily: 'Sora_700Bold', fontSize: 12 }}>
                    📅 {selectedDayOfWeek} • {selectedSlots.length > 0 ? `${selectedSlots.length} slot(s) selected (${selectedSlots[0]})` : 'Tap to select slot'}
                  </ThemedText>
                </Pressable>
              )}
            </View>
          </View>

          {/* Additional Services (Disabled Gray State - Pro Plan Required) */}
          <View style={styles.section}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <ThemedText type="labelMd" style={{ color: theme.textSecondary, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                  PROFESSIONAL SERVICES
                </ThemedText>
              </View>
              <ThemedText type="labelSm" style={{ color: theme.textSecondary, opacity: 0.7 }}>Disabled in Free Plan</ThemedText>
            </View>

            {/* Pro Net Coach Card (Disabled State) */}
            <Pressable
              disabled={true}
              onPress={() => showError('🔒 Pro Plan Required: Upgrade to Pro Plan to enable Trainer Coaching.')}
              style={[
                styles.serviceRow,
                {
                  backgroundColor: theme.surfaceLow,
                  borderColor: theme.outlineVariant + '25',
                  borderWidth: 1,
                  opacity: 0.5,
                }
              ]}
            >
              <View style={styles.serviceLeft}>
                <View style={[styles.serviceIconWrap, { backgroundColor: theme.outlineVariant + '20' }]}>
                  <Ionicons name="fitness" size={20} color={theme.textSecondary} />
                </View>
                <View style={{ marginLeft: Spacing.sm }}>
                  <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold', fontSize: 14, color: theme.textSecondary }}>
                    Pro Net Coach
                  </ThemedText>
                  <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginTop: 2, fontSize: 10 }}>
                    Included with Pro Plan (Disabled)
                  </ThemedText>
                </View>
              </View>
            </Pressable>

            {/* HD Match Recording Card (Disabled State) */}
            <Pressable
              disabled={true}
              onPress={() => showError('🔒 Pro Plan Required: Upgrade to Pro Plan for 4K Match Recording.')}
              style={[
                styles.serviceRow,
                {
                  backgroundColor: theme.surfaceLow,
                  borderColor: theme.outlineVariant + '25',
                  borderWidth: 1,
                  marginTop: Spacing.xs,
                  opacity: 0.5,
                }
              ]}
            >
              <View style={styles.serviceLeft}>
                <View style={[styles.serviceIconWrap, { backgroundColor: theme.outlineVariant + '20' }]}>
                  <Ionicons name="videocam" size={20} color={theme.textSecondary} />
                </View>
                <View style={{ marginLeft: Spacing.sm }}>
                  <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold', fontSize: 14, color: theme.textSecondary }}>
                    HD Match Recording
                  </ThemedText>
                  <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginTop: 2, fontSize: 10 }}>
                    Included with Pro Plan (Disabled)
                  </ThemedText>
                </View>
              </View>
            </Pressable>
          </View>

          {/* ── Advance Pay Option ── */}
          <View style={styles.section}>
            <ThemedText type="labelMd" style={{ color: theme.textSecondary, marginBottom: Spacing.sm, letterSpacing: 0.5 }}>
              ADVANCE PAYMENT
            </ThemedText>
            <View style={[styles.formCard, { backgroundColor: theme.surfaceLowest }, Shadows.level1]}>
              <View style={styles.advanceHeader}>
                <View style={styles.advanceHeaderLeft}>
                  <View style={[styles.advanceIconWrap, { backgroundColor: '#5D68E822' }]}>
                    <Ionicons name="cash" size={18} color="#5D68E8" />
                  </View>
                  <View style={{ marginLeft: Spacing.sm }}>
                    <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold', color: theme.text }}>Pay in Advance</ThemedText>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Remaining due at venue</ThemedText>
                  </View>
                </View>
                <ThemedText type="headlineSm" style={{ color: '#5D68E8', fontFamily: 'Sora_800ExtraBold' }}>
                  ₹{advanceAmount}
                </ThemedText>
              </View>

              {/* Advance % toggle row */}
              <View style={styles.advanceOptions}>
                {ADVANCE_OPTIONS.map((opt) => {
                  const isActive = opt.pct === advancePct;
                  return (
                    <Pressable
                      key={opt.pct}
                      onPress={() => setAdvancePct(opt.pct)}
                      style={[
                        styles.advanceOptBtn,
                        isActive
                          ? { backgroundColor: '#5D68E8', borderColor: '#5D68E8' }
                          : { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33' },
                      ]}
                    >
                      <ThemedText style={{
                        color: isActive ? '#05151e' : theme.textSecondary,
                        fontFamily: 'Sora_700Bold',
                        fontSize: 12,
                      }}>{opt.label}</ThemedText>
                    </Pressable>
                  );
                })}
              </View>

              {advancePct < 100 && (
                <View style={[styles.advanceRemainder, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '22' }]}>
                  <Ionicons name="information-circle-outline" size={14} color={theme.textSecondary} />
                  <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginLeft: 6, flex: 1 }}>
                    ₹{remainingAmount.toFixed(2)} remaining to be paid at the venue before your session.
                  </ThemedText>
                </View>
              )}
            </View>
          </View>

          {/* ── Payment Method ── */}
          <View style={styles.section}>
            <View style={{ marginBottom: Spacing.md }}>
              <ThemedText type="headlineSm" style={{ color: theme.text, marginBottom: 4 }}>
                Payment Methods
              </ThemedText>
              <ThemedText type="bodyMd" style={{ color: theme.textSecondary }}>
                Confirm your booking details
              </ThemedText>
            </View>

            {/* Cashback Offer Card */}
            <View style={{ backgroundColor: '#10B98115', borderColor: '#10B98133', borderWidth: 1, borderRadius: BorderRadius.lg, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: Spacing.md }}>
              <View style={{ backgroundColor: '#10B98125', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="gift" size={16} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={{ fontSize: 12.5, fontFamily: 'Sora_700Bold', color: '#10B981' }}>
                  Cashback Offer Activated!
                </ThemedText>
                <ThemedText style={{ fontSize: 10.5, color: theme.textSecondary, marginTop: 1 }}>
                  Get ₹100.00 Cashback instantly added to your wallet on completing this booking.
                </ThemedText>
              </View>
            </View>

            {/* Wallet Option Card */}
            <View style={{ backgroundColor: theme.surfaceLowest, borderRadius: BorderRadius.lg, padding: 14, marginBottom: Spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', ...Shadows.level1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.primary + '10', justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="wallet-outline" size={20} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={{ fontSize: 13, fontFamily: 'Sora_700Bold', color: theme.text }}>
                    Pay with Wallet Balance
                  </ThemedText>
                  <ThemedText style={{ fontSize: 11, color: theme.textSecondary }}>
                    Available Balance: ₹{walletBalance.toFixed(2)}
                  </ThemedText>
                </View>
              </View>
              {walletBalance > 0 ? (
                <Pressable 
                  onPress={() => setUseWallet(!useWallet)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: useWallet ? theme.primary : theme.surfaceLow, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 }}
                >
                  <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_700Bold', color: useWallet ? '#ffffff' : theme.textSecondary }}>
                    {useWallet ? 'Applied' : 'Apply'}
                  </ThemedText>
                  <Ionicons name={useWallet ? 'checkmark-circle' : 'add-circle-outline'} size={14} color={useWallet ? '#ffffff' : theme.textSecondary} />
                </Pressable>
              ) : (
                <ThemedText style={{ fontSize: 11, color: theme.textSecondary, fontStyle: 'italic' }}>
                  Empty
                </ThemedText>
              )}
            </View>

            {finalPayable === 0 ? (
              <View style={{ backgroundColor: theme.primary + '10', padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: theme.primary + '22', alignItems: 'center', marginVertical: Spacing.sm }}>
                <Ionicons name="shield-checkmark-outline" size={32} color={theme.primary} />
                <ThemedText style={{ fontSize: 13, fontFamily: 'Sora_700Bold', color: theme.text, marginTop: 8 }}>
                  Wallet Balance Applied Fully
                </ThemedText>
                <ThemedText style={{ fontSize: 11, color: theme.textSecondary, textAlign: 'center', marginTop: 4, paddingHorizontal: Spacing.md }}>
                  Your advance amount of ₹{advanceAmount.toFixed(2)} is completely covered by your wallet balance.
                </ThemedText>
              </View>
            ) : (
              <View style={{ gap: Spacing.sm }}>
                {PAYMENT_METHODS.map(pm => {
                  const isSelected = paymentMethod === pm.id;
                  return (
                    <Pressable
                      key={pm.id}
                      onPress={() => setPaymentMethod(pm.id)}
                      style={[{ flexDirection: 'column', padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: theme.outlineVariant + '40', backgroundColor: theme.surfaceLowest }, isSelected && { borderColor: theme.primary, backgroundColor: theme.primaryContainer }]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          {pm.id === 'gpay' ? (
                            <Image source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/120px-Google_%22G%22_logo.svg.png' }} style={{ width: 24, height: 24, marginHorizontal: 4 }} />
                          ) : pm.family === 'Ionicons' ? (
                            <Ionicons name={pm.icon as any} size={24} color={isSelected ? theme.surfaceLowest : (pm.color === '#000000' ? theme.text : pm.color)} style={{ width: 32, textAlign: 'center' }} />
                          ) : (
                            <FontAwesome5 name={pm.icon as any} size={24} color={isSelected ? theme.surfaceLowest : (pm.color === '#000000' ? theme.text : pm.color)} style={{ width: 32, textAlign: 'center' }} />
                          )}
                          <ThemedText type="bodyMd" style={{ marginLeft: 12, color: isSelected ? theme.surfaceLowest : theme.text }}>{pm.label}</ThemedText>
                        </View>
                        <View style={[{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: theme.outlineVariant, justifyContent: 'center', alignItems: 'center' }, isSelected && { borderColor: theme.surfaceLowest }]}>
                          {isSelected && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: theme.surfaceLowest }} />}
                        </View>
                      </View>

                      {/* Expanded Payment Details */}
                      {isSelected && (pm.id === 'credit' || pm.id === 'debit') && (
                        <View style={{ marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: theme.surfaceLowest + '30', alignSelf: 'stretch' }}>
                          <TextInput 
                            placeholder="Card Number" 
                            placeholderTextColor="#94a3b8"
                            style={{ backgroundColor: theme.surfaceLowest, color: theme.text, padding: Spacing.sm, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: theme.outlineVariant, marginBottom: Spacing.sm, alignSelf: 'stretch' }} 
                          />
                          <View style={{ flexDirection: 'row', gap: Spacing.sm, alignSelf: 'stretch' }}>
                            <TextInput 
                              placeholder="MM/YY" 
                              placeholderTextColor="#94a3b8"
                              style={{ flex: 1, backgroundColor: theme.surfaceLowest, color: theme.text, padding: Spacing.sm, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: theme.outlineVariant }} 
                            />
                            <TextInput 
                              placeholder="CVV" 
                              placeholderTextColor="#94a3b8"
                              style={{ flex: 1, backgroundColor: theme.surfaceLowest, color: theme.text, padding: Spacing.sm, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: theme.outlineVariant }} 
                              secureTextEntry
                            />
                          </View>
                        </View>
                      )}
                      {isSelected && pm.id === 'gpay' && (
                        <View style={{ marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: theme.surfaceLowest + '30', alignItems: 'center' }}>
                          <ThemedText type="bodySm" style={{ color: theme.surfaceLowest, marginBottom: Spacing.sm, textAlign: 'center' }}>You will be redirected to Google Pay to complete the transaction securely.</ThemedText>
                        </View>
                      )}
                      {isSelected && pm.id === 'paypal' && (
                        <View style={{ marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: theme.surfaceLowest + '30', alignItems: 'center' }}>
                          <ThemedText type="bodySm" style={{ color: theme.surfaceLowest, marginBottom: Spacing.sm, textAlign: 'center' }}>You will be redirected to PayPal to complete the transaction securely.</ThemedText>
                        </View>
                      )}
                      {isSelected && pm.id === 'apple' && (
                        <View style={{ marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: theme.surfaceLowest + '30', alignItems: 'center' }}>
                          <ThemedText type="bodySm" style={{ color: theme.surfaceLowest, marginBottom: Spacing.sm, textAlign: 'center' }}>Secure transaction via Apple Pay. Authenticate with Touch ID or Face ID.</ThemedText>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          {/* ── Split Booking Amount ── */}
          <View style={styles.section}>
            <View style={[styles.formCard, { backgroundColor: theme.surfaceLowest, borderRadius: BorderRadius.lg, padding: 16, ...Shadows.level1 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <ThemedText style={{ fontSize: 14, fontFamily: 'Sora_700Bold', color: theme.text }}>
                    Split Cost among Players
                  </ThemedText>
                  <ThemedText style={{ fontSize: 11, color: theme.textSecondary, marginTop: 2 }}>
                    Split booking fee based on play hours (e.g., 1 hr, 2 hrs)
                  </ThemedText>
                </View>
                <Pressable 
                  onPress={() => setIsSplitEnabled(!isSplitEnabled)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: isSplitEnabled ? theme.primary : theme.surfaceLow, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 }}
                >
                  <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_700Bold', color: isSplitEnabled ? '#ffffff' : theme.textSecondary }}>
                    {isSplitEnabled ? 'Active' : 'Enable'}
                  </ThemedText>
                  <Ionicons name={isSplitEnabled ? 'checkmark-circle' : 'add-circle-outline'} size={14} color={isSplitEnabled ? '#ffffff' : theme.textSecondary} />
                </Pressable>
              </View>

              {isSplitEnabled && (
                <View style={{ marginTop: Spacing.xs }}>
                  {/* Players list */}
                  <View style={{ gap: Spacing.sm, marginBottom: Spacing.md }}>
                    {splitPlayers.map((player) => {
                      const totalHours = splitPlayers.reduce((sum, p) => sum + p.hours, 0) || 1;
                      const shareOfTotal = (player.hours / totalHours) * total;
                      const shareOfAdvance = (player.hours / totalHours) * finalPayable;

                      return (
                        <View key={player.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.outlineVariant + '15' }}>
                          <View style={{ flex: 1 }}>
                            <ThemedText style={{ fontSize: 13, fontFamily: 'Sora_700Bold', color: theme.text }}>
                              {player.name}
                            </ThemedText>
                            <ThemedText style={{ fontSize: 10.5, color: theme.textSecondary, marginTop: 1 }}>
                              Share: ₹{shareOfAdvance.toFixed(2)} Pay Now · ₹{shareOfTotal.toFixed(2)} Total
                            </ThemedText>
                          </View>

                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                            {/* Hours Selector */}
                            <Pressable 
                              onPress={() => {
                                if (player.hours > 1) {
                                  setSplitPlayers(splitPlayers.map(p => p.id === player.id ? { ...p, hours: p.hours - 1 } : p));
                                } else if (player.name !== 'You') {
                                  // Remove player if hours decremented to 0
                                  setSplitPlayers(splitPlayers.filter(p => p.id !== player.id));
                                }
                              }}
                              style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: theme.surfaceLow, justifyContent: 'center', alignItems: 'center' }}
                            >
                              <Ionicons name={player.hours > 1 ? "remove" : "trash-outline"} size={14} color={theme.text} />
                            </Pressable>

                            <ThemedText style={{ width: 32, textAlign: 'center', fontSize: 12, fontFamily: 'Sora_700Bold', color: theme.text }}>
                              {player.hours} {player.hours === 1 ? 'hr' : 'hrs'}
                            </ThemedText>

                            <Pressable 
                              onPress={() => {
                                setSplitPlayers(splitPlayers.map(p => p.id === player.id ? { ...p, hours: p.hours + 1 } : p));
                              }}
                              style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: theme.surfaceLow, justifyContent: 'center', alignItems: 'center' }}
                            >
                              <Ionicons name="add" size={14} color={theme.text} />
                            </Pressable>
                          </View>
                        </View>
                      );
                    })}
                  </View>

                  {/* Add Friend Input */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md }}>
                    <TextInput
                      value={newPlayerName}
                      onChangeText={setNewPlayerName}
                      placeholder="Enter player/friend's name..."
                      placeholderTextColor="#94a3b8"
                      style={[{ flex: 1, backgroundColor: theme.surfaceLow, color: theme.text, paddingHorizontal: 12, height: 38, borderRadius: BorderRadius.md, fontSize: 12.5 }, ...({ outlineStyle: 'none' } as any)]}
                    />
                    <Pressable
                      onPress={() => {
                        if (newPlayerName.trim()) {
                          setSplitPlayers([...splitPlayers, {
                            id: Date.now().toString(),
                            name: newPlayerName.trim(),
                            hours: 1
                          }]);
                          setNewPlayerName('');
                        }
                      }}
                      style={{ backgroundColor: theme.primary, height: 38, paddingHorizontal: 14, borderRadius: BorderRadius.md, justifyContent: 'center', alignItems: 'center' }}
                    >
                      <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_700Bold', color: '#ffffff' }}>
                        + Add
                      </ThemedText>
                    </Pressable>
                  </View>

                  {/* Proportional Split Info summary card */}
                  <View style={{ backgroundColor: theme.primary + '10', borderRadius: BorderRadius.md, padding: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                    <Ionicons name="calculator-outline" size={16} color={theme.primary} style={{ marginTop: 1 }} />
                    <View style={{ flex: 1 }}>
                      <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_700Bold', color: theme.primary }}>
                        Proportional Split Calculation
                      </ThemedText>
                      <ThemedText style={{ fontSize: 10.5, color: theme.textSecondary, marginTop: 3, lineHeight: 15 }}>
                        The total booking cost is dynamically split based on individual hours played. Players playing 2 hrs pay double the share of players playing 1 hr.
                      </ThemedText>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Booking Summary Ticket Card */}
          <View style={[styles.section, { paddingBottom: 60 }]}>
            <View style={[styles.ticketContainer, { backgroundColor: theme.surfaceLowest }, Shadows.level3]}>
              
              {/* Top part: Rounded banner/hero image */}
              <View style={styles.ticketTopSection}>
                <Image source={venue.image} style={styles.ticketHeroImage} contentFit="cover" />
                <View style={styles.ticketHeroOverlay}>
                  <ThemedText type="headlineLg" style={styles.ticketHeroTitle}>
                    {venue.name}
                  </ThemedText>
                </View>
              </View>

              {/* Dotted line with left & right notches */}
              <View style={styles.ticketDottedLineContainer}>
                <View style={[styles.ticketNotchLeft, { backgroundColor: theme.background, borderColor: theme.outlineVariant + '44' }]} />
                <View style={[styles.ticketDottedLine, { borderColor: theme.outlineVariant + '66' }]} />
                <View style={[styles.ticketNotchRight, { backgroundColor: theme.background, borderColor: theme.outlineVariant + '44' }]} />
              </View>

              {/* Middle Section: Details grid */}
              <View style={styles.ticketMiddleSection}>
                {/* Bookmark icon */}
                <View style={[styles.ticketChipAndActionRow, { justifyContent: 'flex-end' }]}>
                  <Pressable style={[styles.ticketBookmarkBtn, { borderColor: theme.outlineVariant + '33' }]}>
                    <Ionicons name="bookmark-outline" size={14} color={theme.textSecondary} />
                  </Pressable>
                </View>

                {/* Bold title & location */}
                <ThemedText type="bodyLg" style={{ color: theme.text, marginTop: 10, fontFamily: 'Sora_700Bold' }}>
                  {venue.name}
                </ThemedText>
                <ThemedText type="bodySm" style={{ color: theme.textSecondary, marginTop: 2 }}>
                  {venue.location}
                </ThemedText>

                {/* Flat separator line */}
                <View style={[styles.ticketSeparator, { backgroundColor: theme.outlineVariant + '33' }]} />

                {/* Details Grid (3 rows, 2 columns) */}
                <View style={styles.ticketDetailsGrid}>
                  <View style={styles.ticketGridRow}>
                    <View style={styles.ticketGridCol}>
                      <ThemedText style={styles.ticketGridLabel}>Date</ThemedText>
                      <ThemedText style={[styles.ticketGridValue, { color: theme.text }]}>
                        {formatDateShort(selectedDate || today)}
                      </ThemedText>
                    </View>
                    <View style={styles.ticketGridCol}>
                      <ThemedText style={styles.ticketGridLabel}>Time</ThemedText>
                      <ThemedText style={[styles.ticketGridValue, { color: theme.text }]}>
                        {formatSlotsRange(selectedSlots)}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={styles.ticketGridRow}>
                    <View style={styles.ticketGridCol}>
                      <ThemedText style={styles.ticketGridLabel}>Location</ThemedText>
                      <ThemedText numberOfLines={1} style={[styles.ticketGridValue, { color: theme.text }]}>
                        {venue.location.split(',')[0]}
                      </ThemedText>
                    </View>
                    <View style={styles.ticketGridCol}>
                      <ThemedText style={styles.ticketGridLabel}>Services</ThemedText>
                      <ThemedText numberOfLines={1} style={[styles.ticketGridValue, { color: theme.text }]}>
                        {coachAdded ? 'Coach' : ''}{coachAdded && recordingAdded ? ' & ' : ''}{recordingAdded ? 'HD Video' : ''}{!coachAdded && !recordingAdded ? 'None Added' : ''}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={styles.ticketGridRow}>
                    <View style={styles.ticketGridCol}>
                      <ThemedText style={styles.ticketGridLabel}>Ticket holder</ThemedText>
                      <ThemedText numberOfLines={1} style={[styles.ticketGridValue, { color: theme.text }]}>
                        Azarudeen
                      </ThemedText>
                    </View>
                    <View style={styles.ticketGridCol}>
                      <ThemedText style={styles.ticketGridLabel}>Issued to</ThemedText>
                      <ThemedText numberOfLines={1} style={[styles.ticketGridValue, { color: theme.text }]}>
                        ID: TXN-{1000 + selectedDayOfMonth}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              </View>

              {/* Second dotted line with notches */}
              <View style={styles.ticketDottedLineContainer}>
                <View style={[styles.ticketNotchLeft, { backgroundColor: theme.background, borderColor: theme.outlineVariant + '44' }]} />
                <View style={[styles.ticketDottedLine, { borderColor: theme.outlineVariant + '66' }]} />
                <View style={[styles.ticketNotchRight, { backgroundColor: theme.background, borderColor: theme.outlineVariant + '44' }]} />
              </View>

              {/* Bottom part: Pricing, Barcode & Action Button */}
              <View style={styles.ticketBottomSection}>

                {/* ── Coupon / Promo Code Section ── */}
                <View style={[styles.couponSection, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <Ionicons name="pricetag" size={14} color={theme.primary} />
                    <ThemedText style={{ color: theme.text, fontFamily: 'Sora_700Bold', fontSize: 13 }}>Coupon & Offers</ThemedText>
                  </View>

                  {couponApplied ? (
                    // Applied state
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#dcfce7', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
                        <View>
                          <ThemedText style={{ color: '#15803d', fontFamily: 'Sora_700Bold', fontSize: 12 }}>{couponCode} applied!</ThemedText>
                          <ThemedText style={{ color: '#16a34a', fontSize: 10, marginTop: 2 }}>You save ₹{couponDiscount}</ThemedText>
                        </View>
                      </View>
                      <Pressable onPress={removeCoupon} style={{ padding: 4 }}>
                        <Ionicons name="close-circle" size={18} color="#16a34a" />
                      </Pressable>
                    </View>
                  ) : (
                    // Input state
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TextInput
                        style={[
                          styles.couponInput,
                          { backgroundColor: theme.surfaceLowest, color: theme.text, borderColor: couponError ? '#ef4444' : theme.outlineVariant + '44' }
                        ]}
                        placeholder="Enter promo / coupon code"
                        placeholderTextColor="#94a3b8"
                        value={couponInput}
                        onChangeText={(t) => { setCouponInput(t.toUpperCase()); setCouponError(''); }}
                        autoCapitalize="characters"
                        returnKeyType="done"
                        onSubmitEditing={applyCoupon}
                      />
                      <Pressable
                        onPress={applyCoupon}
                        style={[styles.couponApplyBtn, { backgroundColor: theme.primary }]}
                      >
                        <ThemedText style={{ color: '#ffffff', fontFamily: 'Sora_700Bold', fontSize: 12 }}>Apply</ThemedText>
                      </Pressable>
                    </View>
                  )}

                  {couponError !== '' && (
                    <ThemedText style={{ color: '#ef4444', fontSize: 10, marginTop: 6 }}>{couponError}</ThemedText>
                  )}

                  {/* Cashback Offer banner */}
                  {cashbackOffer && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#eff6ff', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginTop: 8 }}>
                      <Ionicons name="wallet" size={14} color="#2563eb" />
                      <ThemedText style={{ color: '#1d4ed8', fontSize: 10, fontFamily: 'Sora_600SemiBold', flex: 1 }}>
                        🎉 Cashback ₹{cashbackOffer.cashback} will be credited to your wallet after booking!
                      </ThemedText>
                    </View>
                  )}

                  {/* Available offer hints */}
                  {!couponApplied && (
                    <View style={{ marginTop: 8 }}>
                      <ThemedText style={{ color: theme.textSecondary, fontSize: 9, letterSpacing: 0.4 }}>AVAILABLE CODES</ThemedText>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                        {[{ code: 'YAWAH30', label: '30% OFF + ₹50 cashback' }, { code: 'FIRST50', label: '₹50 flat + ₹100 cashback' }, { code: 'TURF20', label: '20% OFF' }].map(({ code, label }) => (
                          <Pressable key={code} onPress={() => { setCouponInput(code); setCouponError(''); }} style={[styles.offerPill, { borderColor: theme.primary + '44', backgroundColor: theme.primary + '0a' }]}>
                            <ThemedText style={{ color: theme.primary, fontSize: 9, fontFamily: 'Sora_700Bold' }}>{code}</ThemedText>
                            <ThemedText style={{ color: theme.textSecondary, fontSize: 8 }}>{label}</ThemedText>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  )}
                </View>

                {/* Pricing Tally inside a clean breakdown container */}
                <View style={[styles.ticketPriceBreakdown, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '22' }]}>
                  <View style={styles.ticketPriceRow}>
                    <ThemedText style={styles.ticketPriceLabel}>Court Hire ({selectedSlots.length} hrs)</ThemedText>
                    <ThemedText style={[styles.ticketPriceValue, { color: theme.text }]}>₹{courtFee.toFixed(2)}</ThemedText>
                  </View>
                  {coachAdded && (
                    <View style={styles.ticketPriceRow}>
                      <ThemedText style={styles.ticketPriceLabel}>Pro Net Coach</ThemedText>
                      <ThemedText style={[styles.ticketPriceValue, { color: theme.text }]}>₹{coachFee.toFixed(2)}</ThemedText>
                    </View>
                  )}
                  {recordingAdded && (
                    <View style={styles.ticketPriceRow}>
                      <ThemedText style={styles.ticketPriceLabel}>HD Match Recording</ThemedText>
                      <ThemedText style={[styles.ticketPriceValue, { color: theme.text }]}>₹{recordingFee.toFixed(2)}</ThemedText>
                    </View>
                  )}
                  <View style={styles.ticketPriceRow}>
                    <ThemedText style={styles.ticketPriceLabel}>Service Charge</ThemedText>
                    <ThemedText style={[styles.ticketPriceValue, { color: theme.text }]}>₹{serviceCharge.toFixed(2)}</ThemedText>
                  </View>
                  
                  {couponApplied && couponDiscount > 0 && (
                    <View style={styles.ticketPriceRow}>
                      <ThemedText style={[styles.ticketPriceLabel, { color: '#16a34a', fontWeight: 'bold' }]}>Coupon Discount ({couponCode})</ThemedText>
                      <ThemedText style={{ fontSize: 12, color: '#16a34a', fontWeight: 'bold' }}>-₹{couponDiscount.toFixed(2)}</ThemedText>
                    </View>
                  )}

                  <View style={styles.ticketPriceTotalRow}>
                    <ThemedText style={[styles.ticketPriceTotalLabel, { color: theme.text }]}>Total Due</ThemedText>
                    <ThemedText style={[styles.ticketPriceTotalVal, { color: theme.secondary }]}>₹{total.toFixed(2)}</ThemedText>
                  </View>
                  {useWallet && walletDeduction > 0 && (
                    <View style={styles.ticketPriceRow}>
                      <ThemedText style={[styles.ticketPriceLabel, { color: '#10B981', fontWeight: 'bold' }]}>Wallet Discount</ThemedText>
                      <ThemedText style={{ fontSize: 12, color: '#10B981', fontWeight: 'bold' }}>-₹{walletDeduction.toFixed(2)}</ThemedText>
                    </View>
                  )}
                  <View style={[styles.ticketPriceRow, { marginTop: 6, borderTopWidth: 1, borderTopColor: theme.outlineVariant + '15', paddingTop: 6 }]}>
                    <ThemedText style={{ color: theme.text, fontSize: 12, fontWeight: 'bold' }}>
                      {advancePct < 100 ? `Amount to Pay Now (${advancePct}%)` : 'Amount to Pay Now'}
                    </ThemedText>
                    <ThemedText style={{ color: theme.primary, fontSize: 13, fontWeight: 'bold' }}>
                      ₹{finalPayable.toFixed(2)}
                    </ThemedText>
                  </View>
                </View>

                {/* Mock Barcode Element */}
                <View style={styles.barcodeWrapper}>
                  <View style={styles.barcodeLines}>
                    {[2, 1, 3, 1, 4, 2, 1, 2, 3, 1, 2, 4, 1, 3, 2, 1, 1, 3, 2, 4, 1, 2, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 4, 2, 1, 3, 1, 1, 2].map((w, idx) => (
                      <View
                        key={idx}
                        style={{
                          width: w,
                          height: 40,
                          backgroundColor: theme.text,
                          marginRight: idx % 2 === 0 ? 1 : 2,
                        }}
                      />
                    ))}
                  </View>
                  <ThemedText style={[styles.barcodeSubText, { color: theme.textSecondary }]}>
                    BK-{(venueId + selectedDayOfMonth).toUpperCase()}-{new Date().getFullYear()}
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Sticky Fixed Bottom Action Bar */}
        <View style={[styles.fixedBottomBar, { backgroundColor: theme.surfaceLowest, borderTopColor: theme.outlineVariant + '22' }, Shadows.level3]}>
          <Pressable
            onPress={handleConfirmBooking}
            disabled={selectedSlots.length === 0}
            style={[
              styles.ticketConfirmBtn,
              { backgroundColor: theme.primary },
              selectedSlots.length === 0 && { opacity: 0.45 }
            ]}
          >
            <View style={styles.ticketConfirmBtnIconWrap}>
              <Ionicons name="shield-checkmark" size={18} color={theme.primary} />
            </View>
            <View style={{ flex: 1, paddingLeft: 8 }}>
              <ThemedText style={styles.ticketConfirmBtnTitle}>CONFIRM BOOKING</ThemedText>
              <ThemedText style={styles.ticketConfirmBtnSub}>
                ₹{finalPayable.toFixed(2)} via {finalPayable === 0 ? 'Wallet Balance' : (PAYMENT_METHODS.find(p => p.id === paymentMethod)?.label ?? 'Apple Pay')}
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#ffffff" />
          </Pressable>

          <ThemedText type="labelSm" style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 6, fontSize: 10 }}>
            🔒 Secure payment · Free cancellation 24h before
          </ThemedText>
        </View>
      </SafeAreaView>
    </GradientContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#0000000a',
    zIndex: 10,
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontFamily: 'Sora_700Bold',
    fontSize: 16,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  fixedBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.containerMargin,
    paddingTop: Spacing.xs,
    paddingBottom: Platform.OS === 'ios' ? 24 : Spacing.md,
    borderTopWidth: 1,
    zIndex: 100,
  },
  heroWrapper: {
    paddingHorizontal: Spacing.containerMargin,
    marginTop: Spacing.md,
  },
  heroCard: {
    width: '100%',
    height: 180,
    borderRadius: BorderRadius.premium,
    overflow: 'hidden',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    opacity: 0.6,
  },
  heroOverlay: {
    position: 'absolute',
    inset: 0,
    justifyContent: 'flex-end',
    padding: Spacing.md,
  },
  heroTitle: {
    color: '#ffffff',
    fontFamily: 'Sora_800ExtraBold',
    fontSize: 20,
    lineHeight: 24,
  },
  heroSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  heroSubItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroSubText: {
    color: '#ffffffaa',
    fontSize: 12,
    marginLeft: 4,
  },
  section: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.containerMargin,
  },
  formCard: {
    borderRadius: BorderRadius.premium,
    padding: Spacing.md,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  monthNav: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  monthNavBtn: {
    padding: 6,
    borderRadius: BorderRadius.full,
  },
  dayLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  dayLabelText: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontWeight: '700',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDayCell: {
    width: `${100 / 7}%`,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
  daySelectorGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: Spacing.xs,
  },
  daySelectorTab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySelectorTabActive: {
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: Spacing.md,
  },
  slotItem: {
    width: '31%',
    height: 44,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 4,
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
  },
  serviceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ticketContainer: {
    borderRadius: BorderRadius.premium,
    paddingVertical: 0,
  },
  ticketTopSection: {
    height: 140,
    width: '100%',
    position: 'relative',
  },
  ticketHeroImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: BorderRadius.premium - 1,
    borderTopRightRadius: BorderRadius.premium - 1,
  },
  ticketHeroOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(5, 21, 30, 0.45)',
    justifyContent: 'flex-end',
    padding: Spacing.md,
  },
  ticketHeroTitle: {
    color: '#ffffff',
    fontFamily: 'Sora_800ExtraBold',
    fontSize: 20,
  },
  ticketDottedLineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    height: 20,
    width: '100%',
  },
  ticketNotchLeft: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginLeft: -8,
    borderWidth: 1,
    zIndex: 10,
  },
  ticketNotchRight: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: -8,
    borderWidth: 1,
    zIndex: 10,
  },
  ticketDottedLine: {
    flex: 1,
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
  },
  ticketMiddleSection: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
  },
  ticketChipAndActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketBookmarkBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ticketSeparator: {
    height: 1,
    marginVertical: 12,
    alignSelf: 'stretch',
  },
  ticketDetailsGrid: {
    gap: 12,
  },
  ticketGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ticketGridCol: {
    flex: 1,
  },
  ticketGridLabel: {
    color: 'rgba(128, 128, 128, 0.6)',
    fontSize: 10,
    fontFamily: 'Sora_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ticketGridValue: {
    fontSize: 12.5,
    fontFamily: 'Sora_700Bold',
    marginTop: 2,
  },
  ticketBottomSection: {
    padding: Spacing.md,
  },
  ticketPriceBreakdown: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    marginBottom: 16,
    gap: 6,
  },
  ticketPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketPriceLabel: {
    color: 'rgba(128, 128, 128, 0.7)',
    fontSize: 12,
    fontFamily: 'Sora_600SemiBold',
  },
  ticketPriceValue: {
    fontSize: 12,
    fontFamily: 'Sora_700Bold',
  },
  ticketPriceTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
    paddingTop: 8,
    marginTop: 4,
  },
  ticketPriceTotalLabel: {
    fontSize: 14,
    fontFamily: 'Sora_700Bold',
  },
  ticketPriceTotalVal: {
    fontSize: 16,
    fontFamily: 'Sora_800ExtraBold',
  },
  barcodeWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  barcodeLines: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
  },
  barcodeSubText: {
    fontSize: 10,
    fontFamily: 'Sora_600SemiBold',
    marginTop: 4,
    letterSpacing: 1.5,
  },
  ticketConfirmBtn: {
    height: 56,
    borderRadius: BorderRadius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    marginTop: 8,
  },
  ticketConfirmBtnIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ticketConfirmBtnTitle: {
    color: '#ffffff',
    fontFamily: 'Sora_800ExtraBold',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  ticketConfirmBtnSub: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Sora_600SemiBold',
    fontSize: 10,
    marginTop: 1,
  },
  // Advance Pay styles
  advanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  advanceHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  advanceIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  advanceOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  advanceOptBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    alignItems: 'center',
  },
  advanceRemainder: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.default,
    borderWidth: 1,
  },
  // Payment Method styles
  paymentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  paymentItem: {
    width: '13%',
    flex: 1,
    minWidth: 68,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    alignItems: 'center',
    position: 'relative',
  },
  paymentIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favFab: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  couponSection: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  couponInput: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 12,
    fontFamily: 'Sora_500Medium',
  },
  couponApplyBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 8,
  },
  offerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sliderDotsRow: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    zIndex: 10,
  },
  sliderDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  sliderDotActive: {
    width: 16,
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
});
