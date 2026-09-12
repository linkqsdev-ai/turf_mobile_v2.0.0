import React, { useState, useMemo, useEffect } from 'react';
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

import { ThemedText, MAX_FONT_SCALE } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GradientContainer } from '@/components/gradient-container';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/context/ToastContext';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useNotifications } from '@/context/NotificationContext';
import { PromoBanner } from '@/components/promo-banner';
import { useBookings, useWalletStore, useClassStore, useTurfStore, useOfferStore } from '@/store/app-store';
import { getOffersForTurf, formatDiscount, isRedeemable } from '@/store/offer-store';
import { getCalendarGrid, formatDateFull, formatDateShort, formatDateISO, MONTH_NAMES, advanceMonth, isTimeSlotPassed, formatSlotsRange } from '@/utils/date-utils';
import { turfApi } from '@/services/turf-api';
import { cleanLocation } from '@/utils/location';
import { computeTurfSlotMetrics } from '@/utils/turf-slot-sync';
import { LinearGradient } from 'expo-linear-gradient';
import { SectionHeading } from '@/components/home/dashboard-widgets';

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
  { id: 'apple', label: 'Apple Pay', icon: 'logo-apple', family: 'Ionicons', color: '#000000' },
  { id: 'paypal', label: 'PayPal', icon: 'paypal', family: 'FontAwesome5', color: '#003087' },
  { id: 'gpay', label: 'Google Pay', icon: 'logo-google', family: 'Ionicons', color: '#ea4335' },
  { id: 'credit', label: 'Credit Card', icon: 'card', family: 'Ionicons', color: '#ff5722' },
  { id: 'debit', label: 'Debit Card', icon: 'card-outline', family: 'Ionicons', color: '#0f9d58' },
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
  const params = useLocalSearchParams<{ id?: string; name?: string; price?: string; date?: string; coupon?: string }>();
  const { bookings, addBooking } = useBookings();
  const { profile } = useUserProfile();
  const {
    walletBalance,
    addWalletFunds,
    deductWalletFunds,
    cashbackCredits,
    addCashbackCredit,
    deductCashbackCredit,
    getCashbackBalanceForEntity,
  } = useWalletStore();
  const { classes } = useClassStore();
  const { ownedTurfs } = useTurfStore();
  const { offers } = useOfferStore();
  const { showSuccess, showError } = useToast();
  const { addNotification } = useNotifications();

  const [remoteTurf, setRemoteTurf] = React.useState<any>(null);
  const [refreshing, setRefreshing] = React.useState(false);

  const fetchTurf = React.useCallback(async () => {
    if (params.id) {
      try {
        const t = await turfApi.getTurfDetails(params.id);
        if (t) setRemoteTurf(t);
      } catch { }
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

  // Calendar state — real date aware with parameter sync
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const initialDate = useMemo(() => {
    if (params.date) {
      const raw = String(params.date).trim();
      // 1. Full ISO date string e.g. "2026-09-01"
      if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
        const [y, m, d] = raw.split('-').map(Number);
        return new Date(y, m - 1, d);
      }
      // 2. Format with month name and day e.g. "Tue, Sep 1", "Sep 1, 2026", "1 Sep 2026"
      const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const clean = raw.replace(/,/g, ' ').toLowerCase();
      const parts = clean.split(/\s+/).filter(Boolean);

      let foundMonth = -1;
      let foundDay = -1;
      let foundYear = new Date().getFullYear();

      for (const part of parts) {
        const mIndex = monthNames.findIndex(m => part.startsWith(m));
        if (mIndex !== -1 && foundMonth === -1) {
          foundMonth = mIndex;
        } else if (/^\d{4}$/.test(part)) {
          const y = parseInt(part, 10);
          if (y >= new Date().getFullYear()) foundYear = y;
        } else if (/^\d{1,2}$/.test(part)) {
          if (foundDay === -1) {
            foundDay = parseInt(part, 10);
          }
        }
      }

      if (foundMonth !== -1 && foundDay !== -1) {
        const d = new Date(foundYear, foundMonth, foundDay);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        if (d < now && d.getMonth() < now.getMonth()) {
          d.setFullYear(now.getFullYear() + 1);
        }
        return d;
      }
    }
    return new Date();
  }, [params.date]);

  const [calYear, setCalYear] = useState(initialDate.getFullYear());
  const [calMonth, setCalMonth] = useState(initialDate.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<string>(
    initialDate.toLocaleDateString('en-US', { weekday: 'long' })
  );

  useEffect(() => {
    setCalYear(initialDate.getFullYear());
    setCalMonth(initialDate.getMonth());
    setSelectedDate(initialDate);
    setSelectedDayOfWeek(initialDate.toLocaleDateString('en-US', { weekday: 'long' }));
  }, [initialDate]);

  const selectedDayOfMonth = selectedDate ? selectedDate.getDate() : new Date().getDate();

  const calendarGrid = useMemo(() => getCalendarGrid(calYear, calMonth), [calYear, calMonth]);

  // Synchronized slot metrics: availability, booked status, and active counts
  const slotMetrics = useMemo(() => {
    const targetTurf = userTurf || remoteTurf || { id: venueId, name: venue.name };
    return computeTurfSlotMetrics(targetTurf, selectedDate, bookings || []);
  }, [userTurf, remoteTurf, venueId, venue.name, selectedDate, bookings]);

  const activeAvailableSlots = useMemo(() => {
    return slotMetrics.slots.filter(s => s.isAvailable);
  }, [slotMetrics]);

  const handlePrevMonth = () => {
    const prev = advanceMonth(calYear, calMonth, -1);
    const prevDate = new Date(prev.year, prev.month, 1);
    const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
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

  // Booking states: DO NOT pre-select slots on initial load!
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
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

  // Available offers for this specific venue
  const turfOffers = useMemo(() => getOffersForTurf(venue.name, offers), [venue.name, offers]);

  // Constants
  const courtFee = venue.basePrice * selectedSlots.length;
  const serviceCharge = 12.00;
  const coachFee = coachAdded ? 45.00 : 0.00;
  const recordingFee = recordingAdded ? 25.00 : 0.00;
  const total = courtFee + serviceCharge + coachFee + recordingFee;
  const advanceAmount = Math.round((total * advancePct) / 100);

  const applyCoupon = (codeOverride?: string) => {
    const code = (codeOverride || couponInput).trim().toUpperCase();
    if (!code) return;

    // Check store owner offers
    const matchedOffer = offers.find(
      o => o.code.toUpperCase() === code && isRedeemable(o)
    );

    if (matchedOffer) {
      if (matchedOffer.minBooking > 0 && total > 0 && total < matchedOffer.minBooking) {
        setCouponError(`Min booking ₹${matchedOffer.minBooking} required for ${code}`);
        setCouponDiscount(0);
        setCouponApplied(false);
        setCashbackOffer(null);
        return;
      }

      const disc =
        matchedOffer.discountType === 'percent'
          ? Math.round(((total > 0 ? total : venue.basePrice) * matchedOffer.discountValue) / 100)
          : matchedOffer.discountValue;

      setCouponCode(code);
      setCouponDiscount(disc);
      setCouponApplied(true);
      setCouponError('');
      setCashbackOffer(null);
      return;
    }

    setCouponError('Invalid or expired voucher code.');
    setCouponDiscount(0);
    setCouponApplied(false);
    setCashbackOffer(null);
  };

  React.useEffect(() => {
    if (params.coupon) {
      setCouponInput(params.coupon);
      applyCoupon(params.coupon);
    }
  }, [params.coupon, offers, total]);

  const removeCoupon = () => {
    setCouponCode('');
    setCouponInput('');
    setCouponDiscount(0);
    setCouponApplied(false);
    setCouponError('');
    setCashbackOffer(null);
  };

  // Split Bill states (Disabled in Free Plan)
  const [isSplitEnabled, setIsSplitEnabled] = useState<boolean>(false);
  const [splitPlayers, setSplitPlayers] = useState<Array<{ id: string; name: string; hours: number }>>([
    { id: '1', name: 'You', hours: 1 },
    { id: '2', name: 'Alen', hours: 1 },
  ]);
  const [newPlayerName, setNewPlayerName] = useState<string>('');

  // Wallet deductions with custom amount input (Max 25% cap) - usable from universal wallet balance
  const [walletInputAmount, setWalletInputAmount] = useState<string>('');
  const maxAllowedFromAmount = Math.max(1, Math.round(advanceAmount * 0.25));
  const maxWalletDeductible = Math.min(walletBalance, maxAllowedFromAmount);
  const parsedWalletAmount = walletInputAmount === '' ? maxWalletDeductible : Math.min(maxWalletDeductible, Math.max(0, parseFloat(walletInputAmount) || 0));
  const walletDeduction = useWallet ? parsedWalletAmount : 0;
  const finalPayable = Math.max(0, advanceAmount - walletDeduction - couponDiscount);
  const remainingAmount = total - advanceAmount;

  const currentTurfRecord = userTurf || remoteTurf || (ownedTurfs || []).find((t: any) => t.id === params.id || t.name === venue.name);

  // Calculate cashback earned for this turf booking
  const turfCashbackEarned = useMemo(() => {
    if (!currentTurfRecord) return 0;
    const isEnabled = currentTurfRecord.cashbackEnabled ?? (Number(currentTurfRecord.cashbackAmount) > 0);
    if (!isEnabled) return 0;
    const amountVal = parseFloat(String(currentTurfRecord.cashbackAmount || 0));
    if (isNaN(amountVal) || amountVal <= 0) return 0;

    let earned = 0;
    if (currentTurfRecord.cashbackType === 'percent') {
      earned = Math.round((courtFee * amountVal) / 100);
    } else {
      earned = Math.round(amountVal);
    }

    if (currentTurfRecord.cashbackMaxAmount && Number(currentTurfRecord.cashbackMaxAmount) > 0) {
      earned = Math.min(earned, Number(currentTurfRecord.cashbackMaxAmount));
    }
    return earned;
  }, [currentTurfRecord, courtFee]);

  const toggleSlot = (time: string) => {
    const slot = slotMetrics.slots.find(s => s.time === time);
    if (slot && !slot.isAvailable) {
      if (slot.isBooked) {
        showError('Slot Unavailable', 'This slot is already booked by another player.');
      } else if (slot.isConfigBlocked) {
        showError('Slot Blocked', 'This slot is unavailable for maintenance or blocked by owner.');
      } else if (slot.isPassed) {
        showError('Slot Expired', 'This time slot has already passed for today.');
      }
      return;
    }
    if (selectedSlots.includes(time)) {
      setSelectedSlots(selectedSlots.filter(s => s !== time));
    } else {
      setSelectedSlots([...selectedSlots, time].sort());
    }
  };

  const handleConfirmBooking = () => {
    if (!selectedDate) {
      return;
    }
    if (selectedSlots.length === 0) {
      showError('No Slot Selected', 'Please select at least one time slot before proceeding.');
      return;
    }

    // Deduct wallet balance from universal wallet
    if (useWallet && walletDeduction > 0) {
      deductWalletFunds(walletDeduction);
    }

    // Auto-credit cashback directly to universal wallet balance
    if (turfCashbackEarned > 0) {
      addWalletFunds(turfCashbackEarned);
    }

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
      // Stamp who booked, so the turf owner can identify and contact them.
      customerName: profile.name,
      customerPhone: profile.phone,
      customerAvatar: typeof profile.avatarUrl === 'string' ? profile.avatarUrl : undefined,
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
        cashbackEarned: String(turfCashbackEarned || 0),
        cashbackName: currentTurfRecord?.cashbackName || `${venue.name} Cashback Reward`,
        cashbackCode: currentTurfRecord?.cashbackCode || '',
        cashbackType: currentTurfRecord?.cashbackType || 'flat',
        cashbackMaxAmount: currentTurfRecord?.cashbackMaxAmount ? String(currentTurfRecord.cashbackMaxAmount) : '',
        cashbackOneTime: currentTurfRecord?.cashbackOneTime ? 'true' : 'false',
      },
    });
  };

  // Home-dashboard palette — the same accents the player dashboard tints with.
  const accent = '#F59E0B';
  const info = '#3B82F6';
  const success = '#10B981';
  const danger = '#ef4444';

  const cardSurface = {
    backgroundColor: theme.surfaceLowest,
    borderColor: theme.outlineVariant + '33',
  };
  const selectedMethodLabel = PAYMENT_METHODS.find(p => p.id === paymentMethod)?.label ?? 'Apple Pay';
  const venueSource =
    typeof venue.image === 'string' && !/^\d+$/.test(venue.image)
      ? { uri: venue.image }
      : typeof venue.image === 'number'
        ? venue.image
        : parseInt(venue.image || '1', 10);

  const renderPriceRow = (label: string, value: string, tone?: string) => (
    <View style={styles.priceRow}>
      <ThemedText style={[styles.priceLabel, { color: tone ?? theme.textSecondary }]}>{label}</ThemedText>
      <ThemedText style={[styles.priceValue, { color: tone ?? theme.text }]}>{value}</ThemedText>
    </View>
  );

  return (
    <GradientContainer screenName="booking" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Top app bar */}
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)');
              }
            }}
            hitSlop={6}
            style={[styles.roundBtn, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '40' }]}
          >
            <Ionicons name="arrow-back" size={18} color={theme.text} />
          </Pressable>
          <View style={styles.headerCenter}>
            <ThemedText style={[styles.headerEyebrow, { color: theme.textSecondary }]}>BOOK VENUE</ThemedText>
            <ThemedText style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
              {venue.name}
            </ThemedText>
          </View>
          <View style={styles.roundSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
          }
        >
          {/* Hero card */}
          <View style={styles.heroWrapper}>
            <View
              style={[styles.heroCard, cardSurface, Shadows.level2]}
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
                <Image source={venueSource} style={styles.heroImage} contentFit="cover" />
              )}

              <LinearGradient
                colors={['rgba(0,0,0,0.25)', 'transparent', 'rgba(0,0,0,0.72)']}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />

              {/* Pagination dots when multiple images exist */}
              {galleryImages.length > 1 && (
                <View style={styles.sliderDotsRow}>
                  {galleryImages.map((_, idx) => (
                    <View
                      key={idx}
                      style={[styles.sliderDot, idx === activeImageIndex && styles.sliderDotActive]}
                    />
                  ))}
                </View>
              )}

              {/* Fav button top right */}
              <Pressable style={[styles.favFab, Shadows.level2]}>
                <Ionicons name="heart" size={18} color="#ff4757" />
              </Pressable>

              <View style={styles.heroOverlay} pointerEvents="box-none">
                <ThemedText style={styles.heroTitle} numberOfLines={1}>{venue.name}</ThemedText>
                <View style={styles.heroChipRow}>
                  <View style={styles.heroChip}>
                    <Ionicons name="location-outline" size={11} color="#ffffff" />
                    <ThemedText style={styles.heroChipText} numberOfLines={1}>
                      {(venue.location || 'Local Arena').split(',')[0]}
                    </ThemedText>
                  </View>
                  <View style={styles.heroChip}>
                    <Ionicons name="star" size={11} color="#FBBF24" />
                    <ThemedText style={styles.heroChipText}>
                      {venue.rating || '5.0'} ({(venue.reviews || '10+').split(' ')[0]})
                    </ThemedText>
                  </View>
                  <View style={styles.heroChip}>
                    <Ionicons name="cash-outline" size={11} color="#ffffff" />
                    <ThemedText style={styles.heroChipText}>₹{venue.basePrice}/slot</ThemedText>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Published class advertisement promo banner */}
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

          {/* ── Date picker ── */}
          <View style={styles.section}>
            <SectionHeading title="Pick a date" tint={theme.primary} />
            <View style={[styles.card, cardSurface, Shadows.level1]}>
              <View style={styles.monthHeader}>
                <View>
                  <ThemedText style={[styles.cardTitle, { color: theme.text }]}>
                    {MONTH_NAMES[calMonth]} {calYear}
                  </ThemedText>
                  <ThemedText style={[styles.cardSub, { color: theme.textSecondary }]}>
                    {formatDateFull(selectedDate)}
                  </ThemedText>
                </View>
                <View style={styles.monthNav}>
                  <Pressable
                    style={[styles.monthNavBtn, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33' }]}
                    onPress={handlePrevMonth}
                  >
                    <Ionicons name="chevron-back" size={15} color={theme.text} />
                  </Pressable>
                  <Pressable
                    style={[styles.monthNavBtn, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33' }]}
                    onPress={handleNextMonth}
                  >
                    <Ionicons name="chevron-forward" size={15} color={theme.text} />
                  </Pressable>
                </View>
              </View>

              {/* Date not selected nudge */}
              {!selectedDate && (
                <View style={[styles.inlineAlert, { backgroundColor: theme.error + '15' }]}>
                  <Ionicons name="calendar-outline" size={13} color={theme.error} />
                  <ThemedText style={[styles.inlineAlertText, { color: theme.error }]}>Please select a date to continue</ThemedText>
                </View>
              )}

              {/* Day labels */}
              <View style={styles.dayLabelsRow}>
                {['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'].map((d) => (
                  <ThemedText key={d} style={[styles.dayLabelText, { color: theme.textSecondary }]}>
                    {d}
                  </ThemedText>
                ))}
              </View>

              {/* Month grid — real date-aware */}
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
                      style={styles.calendarDayCell}
                    >
                      <View
                        style={[
                          styles.calendarDayInner,
                          isSelected && { backgroundColor: theme.primary },
                          isToday && !isSelected && { borderWidth: 1.5, borderColor: theme.primary },
                        ]}
                      >
                        <ThemedText
                          style={[
                            styles.calendarDayText,
                            {
                              color: isSelected ? '#ffffff' : isPast ? theme.textSecondary : isToday ? theme.primary : theme.text,
                              fontFamily: isSelected || isToday ? 'Sora_500Medium' : 'Sora_400Regular',
                              opacity: isPast ? 0.35 : 1,
                            },
                          ]}
                        >
                          {item.dayNumber}
                        </ThemedText>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          {/* ── Day & time slots ── */}
          <View style={styles.section}>
            <SectionHeading title="Time slots" tint={accent} />
            <View style={[styles.card, cardSurface, Shadows.level1]}>
              <View style={styles.slotHeader}>
                <View style={styles.slotHeaderLeft}>
                  <View style={[styles.cardIcon, { backgroundColor: accent + '1F' }]}>
                    <Ionicons name="time-outline" size={15} color="#B45309" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={[styles.cardTitle, { color: theme.text }]}>Select Day & Time Slot</ThemedText>
                    <ThemedText style={[styles.cardSub, { color: theme.textSecondary }]} numberOfLines={1}>
                      {selectedSlots.length > 0 ? `${selectedSlots.length} selected · ${formatSlotsRange(selectedSlots)}` : 'Tap one or more slots'}
                    </ThemedText>
                  </View>
                </View>
                <Pressable
                  onPress={() => setIsSlotsExpanded(!isSlotsExpanded)}
                  style={[styles.monthNavBtn, { backgroundColor: theme.primary + '14', borderColor: 'transparent' }]}
                  hitSlop={8}
                >
                  <Ionicons name={isSlotsExpanded ? 'chevron-up' : 'chevron-down'} size={15} color={theme.primary} />
                </Pressable>
              </View>

              {isSlotsExpanded ? (
                <>
                  {/* Day selector — short names (Mon-Sun) in one row */}
                  <View style={styles.daySelectorGrid}>
                    {DAYS_OF_WEEK.map((d, dayIdx) => {
                      const isActive = d.full === selectedDayOfWeek;
                      const currentDayIdx = selectedDate.getDay(); // 0 (Sun) .. 6 (Sat)
                      const targetIdx = d.short === 'Sun' ? 0 : dayIdx + 1;
                      const diff = targetIdx - currentDayIdx;
                      const candidate = new Date(selectedDate);
                      candidate.setDate(selectedDate.getDate() + diff);
                      const isPastDay = candidate.getTime() < today.getTime();

                      return (
                        <Pressable
                          key={d.full}
                          disabled={isPastDay}
                          onPress={() => {
                            if (isPastDay) return;
                            setSelectedDate(candidate);
                            setSelectedDayOfWeek(d.full);
                            setCalYear(candidate.getFullYear());
                            setCalMonth(candidate.getMonth());
                            setSelectedSlots(prev => prev.filter(s => !isTimeSlotPassed(s, candidate)));
                          }}
                          style={[
                            styles.daySelectorTab,
                            isActive
                              ? { backgroundColor: theme.primary, borderColor: theme.primary }
                              : { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33' },
                            isPastDay && { opacity: 0.35 },
                          ]}
                        >
                          <ThemedText style={[styles.daySelectorText, { color: isActive ? '#ffffff' : theme.textSecondary }]}>
                            {d.short}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Live occupancy */}
                  <View style={styles.occupancyRow}>
                    <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Select time slots</ThemedText>
                    <View style={styles.pillRow}>
                      {slotMetrics.totalBooked > 0 && (
                        <View style={[styles.statusPill, { backgroundColor: danger + '18' }]}>
                          <ThemedText style={[styles.statusText, { color: danger }]}>{slotMetrics.totalBooked} Booked</ThemedText>
                        </View>
                      )}
                      <View style={[styles.statusPill, { backgroundColor: success + '1A' }]}>
                        <ThemedText style={[styles.statusText, { color: '#047857' }]}>{slotMetrics.totalAvailable} Available</ThemedText>
                      </View>
                    </View>
                  </View>

                  {/* Time slots grid */}
                  <View style={styles.slotsGrid}>
                    {slotMetrics.slots.map((slot) => {
                      const isSelected = selectedSlots.includes(slot.time);
                      const isBooked = slot.isBooked;
                      const isPassed = slot.isPassed;
                      const isDisabled = !slot.isAvailable;

                      return (
                        <Pressable
                          key={slot.time}
                          disabled={isDisabled}
                          onPress={() => toggleSlot(slot.time)}
                          style={[
                            styles.slotItem,
                            { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33' },
                            isSelected && { backgroundColor: theme.primary, borderColor: theme.primary },
                            isDisabled && { opacity: isPassed ? 0.35 : 0.45 },
                          ]}
                        >
                          <Ionicons
                            name={isBooked ? 'lock-closed-outline' : (slot.icon as any)}
                            size={12}
                            color={isSelected ? '#ffffff' : theme.textSecondary}
                          />
                          <ThemedText
                            style={[
                              styles.slotText,
                              {
                                color: isSelected ? '#ffffff' : isDisabled ? theme.textSecondary : theme.text,
                                textDecorationLine: isPassed ? 'line-through' : 'none',
                              },
                            ]}
                          >
                            {slot.time}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Notice */}
                  <View style={[styles.noticeRow, { backgroundColor: theme.surfaceLow }]}>
                    <Ionicons name="information-circle-outline" size={14} color={theme.textSecondary} />
                    <ThemedText style={[styles.noticeText, { color: theme.textSecondary }]}>
                      The time slots are in local time. Free cancellation up to 24h before.
                    </ThemedText>
                  </View>
                </>
              ) : (
                <Pressable
                  onPress={() => setIsSlotsExpanded(true)}
                  style={[styles.collapsedPill, { backgroundColor: theme.primary + '0F' }]}
                >
                  <ThemedText style={[styles.collapsedText, { color: theme.primary }]}>
                    📅 {selectedDayOfWeek} • {selectedSlots.length > 0 ? `${selectedSlots.length} slot(s) selected (${selectedSlots[0]})` : 'Tap to select slot'}
                  </ThemedText>
                </Pressable>
              )}
            </View>
          </View>

          {/* ── Professional services (disabled — Pro plan required) ── */}
          <View style={styles.section}>
            <SectionHeading title="Professional services" tint={info} />
            <View style={[styles.card, cardSurface, Shadows.level1, styles.lockedCard]}>
              {[
                { key: 'coach', icon: 'fitness' as const, title: 'Pro Net Coach', message: '🔒 Pro Plan Required: Upgrade to Pro Plan to enable Trainer Coaching.' },
                { key: 'recording', icon: 'videocam' as const, title: 'HD Match Recording', message: '🔒 Pro Plan Required: Upgrade to Pro Plan for 4K Match Recording.' },
              ].map((service, idx) => (
                <Pressable
                  key={service.key}
                  disabled={true}
                  onPress={() => showError(service.message)}
                  style={[styles.serviceRow, idx > 0 && { borderTopWidth: 1, borderTopColor: theme.outlineVariant + '26' }]}
                >
                  <View style={[styles.cardIcon, { backgroundColor: theme.outlineVariant + '26' }]}>
                    <Ionicons name={service.icon} size={15} color={theme.textSecondary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={[styles.cardTitle, { color: theme.textSecondary }]}>{service.title}</ThemedText>
                    <ThemedText style={[styles.cardSub, { color: theme.textSecondary }]}>Included with Pro Plan (Disabled)</ThemedText>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: theme.outlineVariant + '33' }]}>
                    <Ionicons name="lock-closed" size={9} color={theme.textSecondary} />
                    <ThemedText style={[styles.statusText, { color: theme.textSecondary }]}>Pro</ThemedText>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          {/* ── Advance payment ── */}
          <View style={styles.section}>
            <SectionHeading title="Advance payment" tint={success} />
            <View style={[styles.card, cardSurface, Shadows.level1]}>
              <View style={styles.advanceHeader}>
                <View style={[styles.cardIcon, { backgroundColor: theme.primary + '1A' }]}>
                  <Ionicons name="cash-outline" size={15} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={[styles.cardTitle, { color: theme.text }]}>Pay in Advance</ThemedText>
                  <ThemedText style={[styles.cardSub, { color: theme.textSecondary }]}>Remaining due at venue</ThemedText>
                </View>
                <ThemedText style={[styles.amountText, { color: theme.primary }]}>₹{advanceAmount}</ThemedText>
              </View>

              {/* Advance % toggle row */}
              <View style={styles.segmentRow}>
                {ADVANCE_OPTIONS.map((opt) => {
                  const isActive = opt.pct === advancePct;
                  return (
                    <Pressable
                      key={opt.pct}
                      onPress={() => setAdvancePct(opt.pct)}
                      style={[
                        styles.segmentPill,
                        isActive
                          ? { backgroundColor: theme.primary, borderColor: theme.primary }
                          : { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33' },
                      ]}
                    >
                      <ThemedText style={[styles.segmentText, { color: isActive ? '#ffffff' : theme.textSecondary }]}>
                        {opt.label}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>

              {advancePct < 100 && (
                <View style={[styles.noticeRow, { backgroundColor: theme.surfaceLow, marginTop: 10 }]}>
                  <Ionicons name="information-circle-outline" size={14} color={theme.textSecondary} />
                  <ThemedText style={[styles.noticeText, { color: theme.textSecondary }]}>
                    ₹{remainingAmount.toFixed(2)} remaining to be paid at the venue before your session.
                  </ThemedText>
                </View>
              )}
            </View>
          </View>

          {/* ── Payment ── */}
          <View style={styles.section}>
            <SectionHeading title="Payment" tint={theme.primary} />

            {/* Cashback — shown only when this venue actually credits one */}
            {turfCashbackEarned > 0 && (
              <View style={[styles.cashbackCard, { backgroundColor: success + '12', borderColor: success + '33' }]}>
                <View style={[styles.cardIcon, { backgroundColor: success + '22' }]}>
                  <Ionicons name="gift" size={15} color={success} />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={[styles.cardTitle, { color: '#047857' }]}>Cashback Offer Activated!</ThemedText>
                  <ThemedText style={[styles.cardSub, { color: theme.textSecondary }]}>
                    Get ₹{turfCashbackEarned.toFixed(2)} Cashback instantly added to your wallet on completing this booking.
                  </ThemedText>
                </View>
              </View>
            )}

            {/* Wallet option with amount to reduce */}
            <View style={[styles.card, cardSurface, Shadows.level1]}>
              <View style={styles.walletHeader}>
                <View style={[styles.cardIcon, { backgroundColor: accent + '1F' }]}>
                  <Ionicons name="wallet-outline" size={15} color="#B45309" />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={[styles.cardTitle, { color: theme.text }]}>Pay with Wallet Balance</ThemedText>
                  <ThemedText style={[styles.cardSub, { color: theme.textSecondary }]}>
                    Available Balance: ₹{walletBalance.toFixed(2)}
                  </ThemedText>
                </View>
                {walletBalance > 0 ? (
                  <Pressable
                    onPress={() => {
                      if (!useWallet && walletInputAmount === '') {
                        setWalletInputAmount(String(maxWalletDeductible));
                      }
                      setUseWallet(!useWallet);
                    }}
                    style={[
                      styles.smallPill,
                      useWallet
                        ? { backgroundColor: theme.primary, borderColor: theme.primary }
                        : { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '44' },
                    ]}
                  >
                    <ThemedText style={[styles.smallPillText, { color: useWallet ? '#ffffff' : theme.textSecondary }]}>
                      {useWallet ? 'Applied' : 'Apply'}
                    </ThemedText>
                    <Ionicons name={useWallet ? 'checkmark-circle' : 'add-circle-outline'} size={13} color={useWallet ? '#ffffff' : theme.textSecondary} />
                  </Pressable>
                ) : (
                  <View style={[styles.statusPill, { backgroundColor: theme.outlineVariant + '33' }]}>
                    <ThemedText style={[styles.statusText, { color: theme.textSecondary }]}>Empty</ThemedText>
                  </View>
                )}
              </View>

              {useWallet && walletBalance > 0 && (
                <View style={[styles.walletBody, { borderTopColor: theme.outlineVariant + '26' }]}>
                  <View style={styles.labelRow}>
                    <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Amount to reduce (max 25%)</ThemedText>
                    <ThemedText style={[styles.fieldHint, { color: theme.primary }]}>Max ₹{maxWalletDeductible.toFixed(2)}</ThemedText>
                  </View>

                  <View style={styles.walletInputRow}>
                    <View style={[styles.inputShell, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33' }]}>
                      <ThemedText style={[styles.currency, { color: theme.textSecondary }]}>₹</ThemedText>
                      <TextInput
                        maxFontSizeMultiplier={MAX_FONT_SCALE}
                        keyboardType="decimal-pad"
                        placeholder={String(maxWalletDeductible)}
                        placeholderTextColor="#94a3b8"
                        value={walletInputAmount}
                        onChangeText={(txt) => {
                          const sanitized = txt.replace(/[^0-9.]/g, '');
                          setWalletInputAmount(sanitized);
                        }}
                        style={[styles.inputField, { color: theme.text }]}
                      />
                      {walletInputAmount !== '' && (
                        <Pressable onPress={() => setWalletInputAmount('')} hitSlop={6}>
                          <Ionicons name="close-circle" size={15} color={theme.textSecondary} />
                        </Pressable>
                      )}
                    </View>

                    <Pressable
                      onPress={() => setWalletInputAmount(String(maxWalletDeductible))}
                      style={[styles.maxPill, { backgroundColor: theme.primary + '14', borderColor: theme.primary + '44' }]}
                    >
                      <ThemedText style={[styles.smallPillText, { color: theme.primary }]}>Max</ThemedText>
                    </Pressable>
                  </View>

                  {/* Quick deduction chips */}
                  <View style={styles.chipWrap}>
                    {[0.25, 0.5, 0.75, 1].map((ratio) => {
                      const amount = Math.min(maxWalletDeductible, Math.max(1, Math.round(maxWalletDeductible * ratio)));
                      if (amount <= 0) return null;
                      const isSelected = parsedWalletAmount === amount;
                      return (
                        <Pressable
                          key={ratio}
                          onPress={() => setWalletInputAmount(String(amount))}
                          style={[
                            styles.quickChip,
                            isSelected
                              ? { backgroundColor: theme.primary, borderColor: theme.primary }
                              : { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33' },
                          ]}
                        >
                          <ThemedText style={[styles.quickChipText, { color: isSelected ? '#ffffff' : theme.textSecondary }]}>
                            {ratio === 1 ? 'Use Max 25%' : `Use ${(ratio * 25).toFixed(0)}%`} (₹{amount})
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>

                  <View style={styles.successLine}>
                    <Ionicons name="checkmark-circle" size={12} color={success} />
                    <ThemedText style={[styles.successText, { color: '#047857' }]}>
                      ₹{walletDeduction.toFixed(2)} will be reduced from your booking fee (Max 25% wallet limit).
                    </ThemedText>
                  </View>
                </View>
              )}
            </View>

            {finalPayable === 0 ? (
              <View style={[styles.coveredCard, { backgroundColor: theme.primary + '0D', borderColor: theme.primary + '26' }]}>
                <View style={[styles.coveredIcon, { backgroundColor: theme.primary + '1A' }]}>
                  <Ionicons name="shield-checkmark-outline" size={20} color={theme.primary} />
                </View>
                <ThemedText style={[styles.cardTitle, { color: theme.text, textAlign: 'center' }]}>
                  Wallet Balance Applied Fully
                </ThemedText>
                <ThemedText style={[styles.cardSub, { color: theme.textSecondary, textAlign: 'center' }]}>
                  Your advance amount of ₹{advanceAmount.toFixed(2)} is completely covered by your wallet balance.
                </ThemedText>
              </View>
            ) : (
              <View style={styles.methodList}>
                <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary, marginTop: 4 }]}>Select payment method</ThemedText>
                {PAYMENT_METHODS.map(pm => {
                  const isSelected = paymentMethod === pm.id;
                  const iconColor = pm.color === '#000000' ? theme.text : pm.color;
                  return (
                    <Pressable
                      key={pm.id}
                      onPress={() => setPaymentMethod(pm.id)}
                      style={[
                        styles.methodCard,
                        isSelected
                          ? { borderColor: theme.primary, backgroundColor: theme.primary + '0D' }
                          : { borderColor: theme.outlineVariant + '33', backgroundColor: theme.surfaceLowest },
                      ]}
                    >
                      <View style={styles.methodRow}>
                        <View style={[styles.methodIcon, { backgroundColor: theme.surfaceLow }]}>
                          {pm.id === 'gpay' ? (
                            <Image source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/120px-Google_%22G%22_logo.svg.png' }} style={styles.methodLogo} />
                          ) : pm.family === 'Ionicons' ? (
                            <Ionicons name={pm.icon as any} size={17} color={iconColor} />
                          ) : (
                            <FontAwesome5 name={pm.icon as any} size={16} color={iconColor} />
                          )}
                        </View>
                        <ThemedText style={[styles.methodLabel, { color: isSelected ? theme.primary : theme.text }]}>{pm.label}</ThemedText>
                        <View style={[styles.radio, { borderColor: isSelected ? theme.primary : theme.outlineVariant }]}>
                          {isSelected && <View style={[styles.radioDot, { backgroundColor: theme.primary }]} />}
                        </View>
                      </View>

                      {/* Expanded payment details */}
                      {isSelected && (pm.id === 'credit' || pm.id === 'debit') && (
                        <View style={[styles.methodExpand, { borderTopColor: theme.outlineVariant + '26' }]}>
                          <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                            placeholder="Card Number"
                            placeholderTextColor="#94a3b8"
                            style={[styles.cardInput, { backgroundColor: theme.surfaceLowest, color: theme.text, borderColor: theme.outlineVariant + '66' }]}
                          />
                          <View style={styles.cardInputRow}>
                            <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                              placeholder="MM/YY"
                              placeholderTextColor="#94a3b8"
                              style={[styles.cardInput, styles.cardInputHalf, { backgroundColor: theme.surfaceLowest, color: theme.text, borderColor: theme.outlineVariant + '66' }]}
                            />
                            <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                              placeholder="CVV"
                              placeholderTextColor="#94a3b8"
                              style={[styles.cardInput, styles.cardInputHalf, { backgroundColor: theme.surfaceLowest, color: theme.text, borderColor: theme.outlineVariant + '66' }]}
                              secureTextEntry
                            />
                          </View>
                        </View>
                      )}
                      {isSelected && pm.id === 'gpay' && (
                        <ThemedText style={[styles.methodNote, { color: theme.textSecondary, borderTopColor: theme.outlineVariant + '26' }]}>
                          You will be redirected to Google Pay to complete the transaction securely.
                        </ThemedText>
                      )}
                      {isSelected && pm.id === 'paypal' && (
                        <ThemedText style={[styles.methodNote, { color: theme.textSecondary, borderTopColor: theme.outlineVariant + '26' }]}>
                          You will be redirected to PayPal to complete the transaction securely.
                        </ThemedText>
                      )}
                      {isSelected && pm.id === 'apple' && (
                        <ThemedText style={[styles.methodNote, { color: theme.textSecondary, borderTopColor: theme.outlineVariant + '26' }]}>
                          Secure transaction via Apple Pay. Authenticate with Touch ID or Face ID.
                        </ThemedText>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          {/* ── Split booking amount (disabled in free plan) ── */}
          <View style={styles.section}>
            <Pressable
              onPress={() => showError('🔒 Pro Plan Required: Upgrade to Pro Plan to enable Split Cost among Players.')}
              style={[styles.card, cardSurface, Shadows.level1, styles.lockedCard]}
            >
              <View style={styles.serviceRowTight}>
                <View style={[styles.cardIcon, { backgroundColor: theme.outlineVariant + '26' }]}>
                  <Ionicons name="people" size={15} color={theme.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={[styles.cardTitle, { color: theme.text }]}>Split Cost among Players</ThemedText>
                  <ThemedText style={[styles.cardSub, { color: theme.textSecondary }]}>
                    Upgrade to Pro Plan to invite players & split payments dynamically.
                  </ThemedText>
                </View>
                <View style={[styles.statusPill, { backgroundColor: theme.outlineVariant + '33' }]}>
                  <Ionicons name="lock-closed" size={9} color={theme.textSecondary} />
                  <ThemedText style={[styles.statusText, { color: theme.textSecondary }]}>Pro Only</ThemedText>
                </View>
              </View>
            </Pressable>
          </View>

          {/* ── Booking summary ticket ── */}
          <View style={[styles.section, { paddingBottom: 24 }]}>
            <SectionHeading title="Booking summary" tint={accent} />
            <View style={[styles.ticketContainer, cardSurface, Shadows.level2]}>
              {/* Top: banner image */}
              <View style={styles.ticketTopSection}>
                <Image source={venueSource} style={styles.ticketHeroImage} contentFit="cover" />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.7)']}
                  style={StyleSheet.absoluteFill}
                  pointerEvents="none"
                />
                <View style={styles.ticketHeroOverlay}>
                  <View style={[styles.statusPill, { backgroundColor: 'rgba(255,255,255,0.22)' }]}>
                    <ThemedText style={[styles.statusText, { color: '#ffffff' }]}>Turf Ticket</ThemedText>
                  </View>
                  <ThemedText style={styles.ticketHeroTitle} numberOfLines={1}>{venue.name}</ThemedText>
                  <ThemedText style={styles.ticketHeroSub} numberOfLines={1}>{venue.location}</ThemedText>
                </View>
              </View>

              {/* Perforation */}
              <View style={styles.ticketPerforation}>
                <View style={[styles.ticketNotch, styles.ticketNotchLeft, { backgroundColor: theme.background }]} />
                <View style={[styles.ticketDottedLine, { borderColor: theme.outlineVariant + '88' }]} />
                <View style={[styles.ticketNotch, styles.ticketNotchRight, { backgroundColor: theme.background }]} />
              </View>

              {/* Details grid */}
              <View style={styles.ticketDetailsGrid}>
                {[
                  { label: 'Date', value: formatDateShort(selectedDate || today) },
                  { label: 'Time', value: formatSlotsRange(selectedSlots) },
                  { label: 'Location', value: venue.location.split(',')[0] },
                  {
                    label: 'Services',
                    value: `${coachAdded ? 'Coach' : ''}${coachAdded && recordingAdded ? ' & ' : ''}${recordingAdded ? 'HD Video' : ''}${!coachAdded && !recordingAdded ? 'None Added' : ''}`,
                  },
                  { label: 'Ticket holder', value: profile.name || 'You' },
                  { label: 'Issued to', value: `ID: TXN-${1000 + selectedDayOfMonth}` },
                ].map((cell) => (
                  <View key={cell.label} style={styles.ticketGridCol}>
                    <ThemedText style={[styles.ticketGridLabel, { color: theme.textSecondary }]}>{cell.label}</ThemedText>
                    <ThemedText numberOfLines={1} style={[styles.ticketGridValue, { color: theme.text }]}>
                      {cell.value}
                    </ThemedText>
                  </View>
                ))}
              </View>

              {/* Perforation */}
              <View style={styles.ticketPerforation}>
                <View style={[styles.ticketNotch, styles.ticketNotchLeft, { backgroundColor: theme.background }]} />
                <View style={[styles.ticketDottedLine, { borderColor: theme.outlineVariant + '88' }]} />
                <View style={[styles.ticketNotch, styles.ticketNotchRight, { backgroundColor: theme.background }]} />
              </View>

              <View style={styles.ticketBottomSection}>
                {/* ── Coupon / promo code ── */}
                <View style={[styles.innerPanel, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '26' }]}>
                  <View style={styles.panelTitleRow}>
                    <Ionicons name="pricetag-outline" size={13} color={theme.primary} />
                    <ThemedText style={[styles.panelTitle, { color: theme.text }]}>Coupon & Offers</ThemedText>
                  </View>

                  {couponApplied ? (
                    // Applied state
                    <View style={[styles.appliedPill, { backgroundColor: success + '1A', borderColor: success + '40' }]}>
                      <Ionicons name="checkmark-circle" size={17} color="#16a34a" />
                      <View style={{ flex: 1 }}>
                        <ThemedText style={[styles.appliedTitle, { color: '#15803d' }]}>{couponCode} applied!</ThemedText>
                        <ThemedText style={[styles.appliedSub, { color: '#16a34a' }]}>You save ₹{couponDiscount}</ThemedText>
                      </View>
                      <Pressable onPress={removeCoupon} hitSlop={6} style={{ padding: 2 }}>
                        <Ionicons name="close-circle" size={17} color="#16a34a" />
                      </Pressable>
                    </View>
                  ) : (
                    // Input state
                    <View style={styles.couponRow}>
                      <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                        style={[
                          styles.couponInput,
                          { backgroundColor: theme.surfaceLowest, color: theme.text, borderColor: couponError ? danger : theme.outlineVariant + '55' },
                        ]}
                        placeholder="Enter promo / coupon code"
                        placeholderTextColor="#94a3b8"
                        value={couponInput}
                        onChangeText={(t) => { setCouponInput(t.toUpperCase()); setCouponError(''); }}
                        autoCapitalize="characters"
                        returnKeyType="done"
                        onSubmitEditing={() => applyCoupon()}
                      />
                      <Pressable
                        onPress={() => applyCoupon()}
                        style={({ pressed }) => [styles.couponApplyBtn, { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 }]}
                      >
                        <ThemedText style={styles.couponApplyText}>Apply</ThemedText>
                      </Pressable>
                    </View>
                  )}

                  {couponError !== '' && (
                    <ThemedText style={[styles.errorText, { color: danger }]}>{couponError}</ThemedText>
                  )}

                  {/* The cashback banner that stood here promised a credit the
                      app never paid: checkout minted a flat ₹100 regardless of
                      the coupon's stated value, and that mint has been removed.
                      Re-add this only alongside a real cashback ledger. */}

                  {/* Available turf offers & voucher codes */}
                  {!couponApplied && turfOffers.length > 0 && (
                    <View style={styles.offerList}>
                      <ThemedText style={[styles.fieldLabel, { color: '#047857' }]} numberOfLines={1}>
                        Exclusive offers for {venue.name}
                      </ThemedText>
                      {turfOffers.map((o) => (
                        <Pressable
                          key={o.id}
                          onPress={() => {
                            setCouponInput(o.code);
                            applyCoupon(o.code);
                          }}
                          style={({ pressed }) => [
                            styles.offerRow,
                            { backgroundColor: theme.surfaceLowest, borderColor: success + '40', opacity: pressed ? 0.85 : 1 },
                          ]}
                        >
                          <View style={[styles.offerBadge, { backgroundColor: success }]}>
                            <ThemedText style={styles.offerBadgeText}>{formatDiscount(o)}</ThemedText>
                          </View>
                          <View style={{ flex: 1 }}>
                            <ThemedText style={[styles.offerTitle, { color: theme.text }]} numberOfLines={1}>
                              {o.title || `${o.code} Voucher`}
                            </ThemedText>
                            <ThemedText style={[styles.offerSub, { color: theme.textSecondary }]} numberOfLines={1}>
                              Use code <ThemedText style={[styles.offerSub, { fontFamily: 'Sora_500Medium', color: '#047857' }]}>{o.code}</ThemedText>
                              {o.minBooking > 0 ? ` • Min ₹${o.minBooking}` : ''}
                            </ThemedText>
                          </View>
                          <View style={[styles.offerApply, { backgroundColor: success }]}>
                            <ThemedText style={styles.offerApplyText}>Apply</ThemedText>
                          </View>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>

                {/* Price breakdown */}
                <View style={[styles.innerPanel, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '26' }]}>
                  {renderPriceRow(`Court Hire (${selectedSlots.length} hrs)`, `₹${courtFee.toFixed(2)}`)}
                  {coachAdded && renderPriceRow('Pro Net Coach', `₹${coachFee.toFixed(2)}`)}
                  {recordingAdded && renderPriceRow('HD Match Recording', `₹${recordingFee.toFixed(2)}`)}
                  {renderPriceRow('Service Charge', `₹${serviceCharge.toFixed(2)}`)}
                  {couponApplied && couponDiscount > 0 && renderPriceRow(`Coupon Discount (${couponCode})`, `-₹${couponDiscount.toFixed(2)}`, '#16a34a')}

                  <View style={[styles.totalRow, { borderTopColor: theme.outlineVariant + '33' }]}>
                    <ThemedText style={[styles.totalLabel, { color: theme.text }]}>Total Due</ThemedText>
                    <ThemedText style={[styles.totalValue, { color: theme.text }]}>₹{Math.max(0, total - couponDiscount).toFixed(2)}</ThemedText>
                  </View>
                  {useWallet && walletDeduction > 0 && renderPriceRow('Wallet Discount', `-₹${walletDeduction.toFixed(2)}`, success)}

                  <View style={[styles.payNowRow, { backgroundColor: theme.primary + '12' }]}>
                    <ThemedText style={[styles.payNowLabel, { color: theme.text }]}>
                      {advancePct < 100 ? `Amount to Pay Now (${advancePct}%)` : 'Amount to Pay Now'}
                    </ThemedText>
                    <ThemedText style={[styles.payNowValue, { color: theme.primary }]}>
                      ₹{finalPayable.toFixed(2)}
                    </ThemedText>
                  </View>
                </View>

                {/* Mock barcode */}
                <View style={styles.barcodeWrapper}>
                  <View style={styles.barcodeLines}>
                    {[2, 1, 3, 1, 4, 2, 1, 2, 3, 1, 2, 4, 1, 3, 2, 1, 1, 3, 2, 4, 1, 2, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 4, 2, 1, 3, 1, 1, 2].map((w, idx) => (
                      <View
                        key={idx}
                        style={{
                          width: w,
                          height: 36,
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

        {/* Sticky bottom action bar */}
        <View style={[styles.fixedBottomBar, { backgroundColor: theme.surfaceLowest, borderTopColor: theme.outlineVariant + '33' }]}>
          <Pressable
            onPress={handleConfirmBooking}
            disabled={selectedSlots.length === 0}
            style={({ pressed }) => [
              styles.confirmBtn,
              { backgroundColor: theme.primary },
              Shadows.level2,
              selectedSlots.length === 0 && { opacity: 0.45 },
              pressed && { opacity: 0.85 },
            ]}
          >
            <View style={styles.confirmIconWrap}>
              <Ionicons name="shield-checkmark" size={16} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.confirmTitle}>Confirm Booking</ThemedText>
              <ThemedText style={styles.confirmSub} numberOfLines={1}>
                ₹{finalPayable.toFixed(2)} via {finalPayable === 0 ? 'Wallet Balance' : selectedMethodLabel}
              </ThemedText>
            </View>
            <View style={styles.confirmArrow}>
              <Ionicons name="chevron-forward" size={16} color="#ffffff" />
            </View>
          </Pressable>

          <ThemedText style={[styles.secureNote, { color: theme.textSecondary }]}>
            🔒 Secure payment · Free cancellation 24h before
          </ThemedText>
        </View>
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
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: GUTTER,
    height: 58,
    borderBottomWidth: 1,
    borderBottomColor: '#0000000a',
    zIndex: 10,
  },
  roundBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundSpacer: { width: 36 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerEyebrow: { fontFamily: 'Sora_500Medium', fontSize: 8.5, letterSpacing: 0.9 },
  headerTitle: { fontFamily: 'Sora_500Medium', fontSize: 13.5, marginTop: 1 },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  section: { paddingHorizontal: GUTTER, marginTop: Spacing.lg },

  // hero
  heroWrapper: { paddingHorizontal: GUTTER, marginTop: 12 },
  heroCard: { height: 196, borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  heroImage: { width: '100%', height: '100%' },
  sliderDotsRow: {
    position: 'absolute',
    top: 14,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  sliderDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255, 255, 255, 0.45)' },
  sliderDotActive: { width: 16, backgroundColor: '#ffffff' },
  favFab: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  heroOverlay: { position: 'absolute', left: 14, right: 14, bottom: 13 },
  heroTitle: { color: '#ffffff', fontFamily: 'Sora_500Medium', fontSize: 15, lineHeight: 22 },
  heroChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 6 },
  heroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  heroChipText: { color: '#ffffff', fontFamily: 'Sora_500Medium', fontSize: 10 },

  // shared card language
  card: { borderRadius: CARD_RADIUS, borderWidth: 1, padding: 12 },
  lockedCard: { opacity: 0.75 },
  cardIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: 'Sora_500Medium', fontSize: 12.5 },
  cardSub: { fontFamily: 'Sora_400Regular', fontSize: 10.5, marginTop: 1, lineHeight: 14 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  fieldLabel: {
    fontFamily: 'Sora_500Medium',
    fontSize: 9,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  fieldHint: { fontFamily: 'Sora_500Medium', fontSize: 10 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 999,
  },
  statusText: {
    fontFamily: 'Sora_500Medium',
    fontSize: 8.5,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  pillRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  inlineAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },
  inlineAlertText: { fontFamily: 'Sora_500Medium', fontSize: 10.5 },

  // calendar
  monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  monthNav: { flexDirection: 'row', gap: 6 },
  monthNavBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLabelsRow: { flexDirection: 'row', marginBottom: 2 },
  dayLabelText: {
    width: '14.28%',
    textAlign: 'center',
    fontFamily: 'Sora_500Medium',
    fontSize: 8.5,
    letterSpacing: 0.6,
  },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarDayCell: { width: '14.28%', height: 40, alignItems: 'center', justifyContent: 'center' },
  calendarDayInner: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  calendarDayText: { fontSize: 12 },

  // slots
  slotHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  slotHeaderLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9 },
  daySelectorGrid: { flexDirection: 'row', gap: 4, marginBottom: 12 },
  daySelectorTab: {
    flex: 1,
    height: 30,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySelectorText: { fontFamily: 'Sora_500Medium', fontSize: 10.5 },
  occupancyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  slotItem: {
    flexBasis: '31%',
    flexGrow: 1,
    height: 34,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  slotText: { fontFamily: 'Sora_500Medium', fontSize: 10.5 },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: CARD_RADIUS,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 12,
  },
  noticeText: { flex: 1, fontFamily: 'Sora_400Regular', fontSize: 10.5, lineHeight: 14 },
  collapsedPill: { borderRadius: 999, paddingVertical: 10, paddingHorizontal: 12, alignItems: 'center' },
  collapsedText: { fontFamily: 'Sora_500Medium', fontSize: 11.5 },

  // services
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  serviceRowTight: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  // advance
  advanceHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  amountText: { fontFamily: 'Sora_500Medium', fontSize: 14.5 },
  segmentRow: { flexDirection: 'row', gap: 6 },
  segmentPill: {
    flex: 1,
    height: 32,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: { fontFamily: 'Sora_500Medium', fontSize: 11.5 },

  // payment
  cashbackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  walletHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  smallPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  smallPillText: { fontFamily: 'Sora_500Medium', fontSize: 10.5 },
  walletBody: { marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  walletInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  inputShell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 38,
    borderRadius: 999,
    borderWidth: 1,
    paddingLeft: 14,
    paddingRight: 10,
  },
  currency: { fontFamily: 'Sora_500Medium', fontSize: 13 },
  inputField: {
    flex: 1,
    height: 36,
    fontFamily: 'Sora_500Medium',
    fontSize: 13,
    paddingVertical: 0,
    ...({ outlineStyle: 'none' } as any),
  },
  maxPill: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  quickChip: { height: 28, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1, justifyContent: 'center' },
  quickChipText: { fontFamily: 'Sora_500Medium', fontSize: 10 },
  successLine: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  successText: { flex: 1, fontFamily: 'Sora_500Medium', fontSize: 10.5 },
  coveredCard: {
    alignItems: 'center',
    gap: 3,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    padding: Spacing.md,
    marginTop: 10,
  },
  coveredIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 5 },
  methodList: { gap: 7, marginTop: 10 },
  methodCard: { borderRadius: CARD_RADIUS, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 9 },
  methodRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  methodIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  methodLogo: { width: 18, height: 18 },
  methodLabel: { flex: 1, fontFamily: 'Sora_500Medium', fontSize: 12 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 9, height: 9, borderRadius: 4.5 },
  methodExpand: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, gap: 7 },
  cardInputRow: { flexDirection: 'row', gap: 7 },
  cardInput: {
    height: 38,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontFamily: 'Sora_400Regular',
    fontSize: 11.5,
    paddingVertical: 0,
    includeFontPadding: false,
  },
  cardInputHalf: { flex: 1 },
  methodNote: {
    fontFamily: 'Sora_400Regular',
    fontSize: 10.5,
    lineHeight: 14,
    textAlign: 'center',
    marginTop: 9,
    paddingTop: 9,
    borderTopWidth: 1,
  },

  // ticket
  ticketContainer: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  ticketTopSection: { height: 118 },
  ticketHeroImage: { width: '100%', height: '100%' },
  ticketHeroOverlay: { position: 'absolute', left: 14, right: 14, bottom: 11, gap: 2 },
  ticketHeroTitle: { color: '#ffffff', fontFamily: 'Sora_500Medium', fontSize: 15, marginTop: 4 },
  ticketHeroSub: { color: 'rgba(255,255,255,0.85)', fontFamily: 'Sora_400Regular', fontSize: 10.5 },
  ticketPerforation: { flexDirection: 'row', alignItems: 'center', height: 18 },
  ticketNotch: { width: 18, height: 18, borderRadius: 9 },
  ticketNotchLeft: { marginLeft: -9 },
  ticketNotchRight: { marginRight: -9 },
  ticketDottedLine: { flex: 1, borderStyle: 'dashed', borderBottomWidth: 1.5, marginHorizontal: 6 },
  ticketDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  ticketGridCol: { width: '50%', paddingRight: 8 },
  ticketGridLabel: {
    fontFamily: 'Sora_500Medium',
    fontSize: 8.5,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  ticketGridValue: { fontFamily: 'Sora_500Medium', fontSize: 12, marginTop: 2 },
  ticketBottomSection: { paddingHorizontal: 12, paddingTop: 6, paddingBottom: 14, gap: 10 },
  innerPanel: { borderRadius: CARD_RADIUS, borderWidth: 1, padding: 11 },
  panelTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 9 },
  panelTitle: { fontFamily: 'Sora_500Medium', fontSize: 12.5 },
  appliedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    paddingLeft: 10,
    paddingRight: 8,
    paddingVertical: 7,
  },
  appliedTitle: { fontFamily: 'Sora_500Medium', fontSize: 11.5 },
  appliedSub: { fontFamily: 'Sora_400Regular', fontSize: 10, marginTop: 1 },
  couponRow: { flexDirection: 'row', gap: 8 },
  couponInput: {
    flex: 1,
    height: 38,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontFamily: 'Sora_500Medium',
    fontSize: 11.5,
    letterSpacing: 0.5,
    paddingVertical: 0,
    includeFontPadding: false,
    ...({ outlineStyle: 'none' } as any),
  },
  couponApplyBtn: { height: 38, paddingHorizontal: 18, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  couponApplyText: { color: '#ffffff', fontFamily: 'Sora_500Medium', fontSize: 11.5 },
  errorText: { fontFamily: 'Sora_400Regular', fontSize: 10, marginTop: 6 },
  offerList: { marginTop: 10, gap: 6 },
  offerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  offerBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999 },
  offerBadgeText: { color: '#ffffff', fontFamily: 'Sora_500Medium', fontSize: 9 },
  offerTitle: { fontFamily: 'Sora_500Medium', fontSize: 11 },
  offerSub: { fontFamily: 'Sora_400Regular', fontSize: 9.5 },
  offerApply: { height: 26, paddingHorizontal: 11, borderRadius: 999, justifyContent: 'center' },
  offerApplyText: { color: '#ffffff', fontFamily: 'Sora_500Medium', fontSize: 10 },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 3 },
  priceLabel: { flex: 1, fontFamily: 'Sora_400Regular', fontSize: 11 },
  priceValue: { fontFamily: 'Sora_500Medium', fontSize: 11.5 },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  totalLabel: { fontFamily: 'Sora_500Medium', fontSize: 12.5 },
  totalValue: { fontFamily: 'Sora_500Medium', fontSize: 14 },
  payNowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
  },
  payNowLabel: { flex: 1, fontFamily: 'Sora_500Medium', fontSize: 11.5 },
  payNowValue: { fontFamily: 'Sora_500Medium', fontSize: 14 },
  barcodeWrapper: { alignItems: 'center', paddingTop: 4 },
  barcodeLines: { flexDirection: 'row', alignItems: 'flex-end' },
  barcodeSubText: { fontFamily: 'Sora_500Medium', fontSize: 9.5, letterSpacing: 1.2, marginTop: 5 },

  // sticky bar
  fixedBottomBar: {
    paddingHorizontal: GUTTER,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 22 : 10,
    borderTopWidth: 1,
  },
  confirmBtn: {
    height: 54,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 8,
    paddingRight: 8,
  },
  confirmIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmTitle: { color: '#ffffff', fontFamily: 'Sora_500Medium', fontSize: 13.5 },
  confirmSub: { color: 'rgba(255,255,255,0.88)', fontFamily: 'Sora_400Regular', fontSize: 10, marginTop: 1 },
  confirmArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secureNote: { fontFamily: 'Sora_400Regular', fontSize: 10, textAlign: 'center', marginTop: 6 },
});
