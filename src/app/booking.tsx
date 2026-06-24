import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  TextInput,
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
import { PromoBanner } from '@/components/promo-banner';
import { useBookings } from '@/store/app-store';
import { getCalendarGrid, formatDateFull, formatDateISO, MONTH_NAMES, advanceMonth } from '@/utils/date-utils';

// Slots details
const TIME_SLOTS = [
  { time: '08:00', icon: 'sunny-outline', disabled: false },
  { time: '09:00', icon: 'sunny-outline', disabled: false },
  { time: '10:00', icon: 'sunny-outline', disabled: false },
  { time: '11:00', icon: 'sunny-outline', disabled: false },
  { time: '12:00', icon: 'sunny', disabled: false },
  { time: '13:00', icon: 'sunny', disabled: false },
  { time: '14:00', icon: 'sunny', disabled: false },
  { time: '15:00', icon: 'sunny', disabled: false },
  { time: '16:00', icon: 'sunny', disabled: true },
  { time: '17:00', icon: 'sunny', disabled: true },
  { time: '18:00', icon: 'sunny', disabled: true },
  { time: '19:00', icon: 'moon', disabled: true },
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
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC9H8hZV1gCxBOC9fWHjQyhn5ukWJhiNGuP6cNDATeIj2gP6JceuAOrhkqeTXWFS75Y0nw0QANCmhRdo0NYvbdmh4Xrs2itBjykGtZr0Y91KEzjUMyOoM-B-owetUT1u8vwmIZlGJkcKdkgVfU0TIGzuVVlTN3lhwfdg5OWwHMCKOyPJGWWdIKySwofsCUjnq9pJi4WH0BMDAi73A53u0OeKj_Ufmh6V4PVwghrjz5aX16NlvQZLOkQRC51252maP-4ZXwNw3MwVfU',
    basePrice: 150,
  },
  'the-grid': {
    name: 'The Grid Multisport',
    location: 'Stratford Central, London',
    rating: '4.7',
    reviews: '96 Reviews',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYH5UnRgCz_j_xsBoTCePAImR1ZHOP1RfajoZLHKUgxQwU2qFlQ8NWyiYz_-6zqqufh9YnYe3jfTI8tuaUrjmH6obvvea2p2vYA7ndyut0M5-lxcOtwTVQQwh58VRPis3197lvVOpVGsJ6YCx55CCy4Q_1CqZxk1rVqp9mBGHM-rDNwh7PGYSDJt6Vq4tmn6G1gXGiZsm13J0D1BFkKFRb8WvrWqqyLWxu-oSZsnMp6YXOONRG89ypF-GKlh96WMcF3HOikmE9l-g',
    basePrice: 110,
  },
  'lords': {
    name: "Lord's View Pavillion",
    location: "St John's Wood, London",
    rating: '4.9',
    reviews: '248 Reviews',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBgd1vfTA0Wj7Aw7aa0JRKzQ5y-6py-pQtMBI-gst90jIWFZoLSiIKBngPK1pn2UxzH_X3pN_lyCt75AnQxS2ssN4J4LUIYpph_JK48kGmSoO16OFhs5uLgsc_Yu3PIrOEneDELuLpKY8BDiUsatTLvRSu0sukxSfAxInyA2XknjvcswWPyUJA2YeNlJ2Vg2t7N807Cydno4uUCtypPyLkI0hi7Xl4DnWaNBueVN4jqiXqkqrc8MEPwQF24g45uu8z8gsXQ9IL87oI',
    basePrice: 120,
  },
};

export default function BookingConfigurationScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { addBooking } = useBookings();

  // Lookup details
  const venueId = params.id && VENUE_LOOKUP[params.id] ? params.id : 'lords';
  const venue = VENUE_LOOKUP[venueId];

  // Calendar state — real date aware
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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
  const [selectedSlots, setSelectedSlots] = useState<string[]>(['12:00', '13:00']);
  const [coachAdded, setCoachAdded] = useState(false);
  const [recordingAdded, setRecordingAdded] = useState(false);
  const [advancePct, setAdvancePct] = useState<number>(100); // 25 | 50 | 100
  const [paymentMethod, setPaymentMethod] = useState<string>('apple');

  // Constants
  const courtFee = venue.basePrice * selectedSlots.length;
  const serviceCharge = 12.00;
  const coachFee = coachAdded ? 45.00 : 0.00;
  const recordingFee = recordingAdded ? 25.00 : 0.00;
  const total = courtFee + serviceCharge + coachFee + recordingFee;
  const advanceAmount = Math.round((total * advancePct) / 100);
  const remainingAmount = total - advanceAmount;

  const toggleSlot = (time: string) => {
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
      advancePaid: advanceAmount,
      remaining: remainingAmount,
      paymentMethod,
      coachAdded,
      recordingAdded,
    });

    // Navigate to confirmation screen
    router.push({
      pathname: '/booking-confirmation',
      params: {
        bookingRef: booking.bookingRef,
        venueName: venue.name,
        dayLabel: formatDateFull(selectedDate),
        slots: selectedSlots.join(','),
        total: total.toFixed(2),
        advancePaid: advanceAmount.toFixed(2),
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

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Hero Card */}
          <View style={styles.heroWrapper}>
            <View style={[styles.heroCard, { backgroundColor: theme.primaryContainer }]}>
              <Image source={venue.image} style={styles.heroImage} contentFit="cover" />
              
              {/* Fav Button top right */}
              <Pressable style={[styles.favFab, { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 }]}>
                <Ionicons name="heart" size={20} color="#ff4757" />
              </Pressable>

              <View style={styles.heroOverlay}>
                <View style={[styles.badgeContainer, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
                  <ThemedText type="labelSm" style={[styles.badgeText, { color: '#ffffff' }]}>PREMIUM VENUE</ThemedText>
                </View>
                <ThemedText type="headlineLg" style={styles.heroTitle}>
                  {venue.name}
                </ThemedText>
                <View style={styles.heroSubRow}>
                  <View style={styles.heroSubItem}>
                    <Ionicons name="location-outline" size={14} color="#ffffffaa" />
                    <ThemedText type="bodySm" style={styles.heroSubText}>
                      {venue.location.split(',')[0]}
                    </ThemedText>
                  </View>
                  <View style={[styles.heroSubItem, { borderLeftWidth: 1, borderLeftColor: '#ffffff22', paddingLeft: 12, marginLeft: 12 }]}>
                    <Ionicons name="star" size={14} color="#ffffff" />
                    <ThemedText type="bodySm" style={[styles.heroSubText, { color: '#ffffff', fontWeight: 'bold' }]}>
                      {venue.rating} <ThemedText type="labelSm" style={{ color: '#ffffffaa' }}>({venue.reviews.split(' ')[0]})</ThemedText>
                    </ThemedText>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Gift Card Promo Banner */}
          <View style={styles.section}>
            <PromoBanner 
              title="Gift a Game"
              subtitle="Know someone who loves playing here? Get them a gift card!"
              buttonText="Buy Gift Card"
              badgeText="GIFT CARDS"
              backgroundColor="#0b4d24"
              buttonBackgroundColor="#a3e635"
              buttonTextColor="#064e3b"
              backgroundImage="https://images.unsplash.com/photo-1549451371-64aa98a6f660?auto=format&fit=crop&w=600&q=80"
            />
          </View>

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
                  <ThemedText style={{ fontSize: 11, color: theme.error, fontFamily: 'HankenGrotesk_600SemiBold' }}>Please select a date to continue</ThemedText>
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
                      onPress={() => item.date && setSelectedDate(item.date)}
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
                          fontFamily: isSelected ? 'HankenGrotesk_700Bold' : 'HankenGrotesk_400Regular',
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
              {/* Day Selector — Short names (Mon-Sun) in one row, no scroll */}
              <View style={styles.daySelectorGrid}>
                {DAYS_OF_WEEK.map((d) => {
                  const isActive = d.full === selectedDayOfWeek;
                  return (
                    <Pressable
                      key={d.full}
                      onPress={() => setSelectedDayOfWeek(d.full)}
                      style={[
                        styles.daySelectorTab,
                        isActive
                          ? [styles.daySelectorTabActive, { backgroundColor: theme.secondaryContainer, borderColor: theme.secondary + '44' }]
                          : { backgroundColor: theme.surfaceLow, borderColor: 'transparent' },
                      ]}
                    >
                      <ThemedText
                        type="labelMd"
                        style={{
                          color: isActive ? theme.onSecondaryContainer : theme.textSecondary,
                          fontFamily: isActive ? 'HankenGrotesk_700Bold' : 'HankenGrotesk_600SemiBold',
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
                  const isSelected = selectedSlots.includes(slot.time);
                  const isDisabled = slot.disabled;
                  
                  return (
                    <Pressable
                      key={slot.time}
                      disabled={isDisabled}
                      onPress={() => toggleSlot(slot.time)}
                      style={[
                        styles.slotItem,
                        { backgroundColor: theme.surfaceLow },
                        isSelected && { backgroundColor: theme.primary },
                        isDisabled && { opacity: 0.4 },
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
                          fontFamily: 'HankenGrotesk_700Bold',
                          marginLeft: 4,
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
            </View>
          </View>

          {/* Additional Services */}
          <View style={styles.section}>
            <ThemedText type="labelMd" style={{ color: theme.textSecondary, marginBottom: Spacing.sm, letterSpacing: 0.5 }}>
              PROFESSIONAL SERVICES
            </ThemedText>

            <View style={[styles.serviceRow, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
              <View style={styles.serviceLeft}>
                <View style={[styles.serviceIconWrap, { backgroundColor: theme.secondaryContainer + '1a' }]}>
                  <Ionicons name="fitness" size={18} color={theme.secondaryContainer} />
                </View>
                <View style={{ marginLeft: Spacing.sm }}>
                  <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>Pro Net Coach</ThemedText>
                  <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>+₹45.00 / Session</ThemedText>
                </View>
              </View>
              <Pressable
                onPress={() => setCoachAdded(!coachAdded)}
                style={[
                  styles.serviceAddBtn,
                  coachAdded ? { backgroundColor: theme.primary } : { backgroundColor: theme.secondaryContainer }
                ]}
              >
                <ThemedText type="labelMd" style={{ color: coachAdded ? '#ffffff' : theme.onSecondaryContainer }}>
                  {coachAdded ? 'ADDED' : '+ ADD'}
                </ThemedText>
              </Pressable>
            </View>

            <View style={[styles.serviceRow, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', marginTop: Spacing.sm }]}>
              <View style={styles.serviceLeft}>
                <View style={[styles.serviceIconWrap, { backgroundColor: theme.secondaryContainer + '1a' }]}>
                  <Ionicons name="videocam" size={18} color={theme.secondaryContainer} />
                </View>
                <View style={{ marginLeft: Spacing.sm }}>
                  <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>HD Match Recording</ThemedText>
                  <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>+₹25.00 / Session</ThemedText>
                </View>
              </View>
              <Pressable
                onPress={() => setRecordingAdded(!recordingAdded)}
                style={[
                  styles.serviceAddBtn,
                  recordingAdded ? { backgroundColor: theme.primary } : { backgroundColor: theme.secondaryContainer }
                ]}
              >
                <ThemedText type="labelMd" style={{ color: recordingAdded ? '#ffffff' : theme.onSecondaryContainer }}>
                  {recordingAdded ? 'ADDED' : '+ ADD'}
                </ThemedText>
              </Pressable>
            </View>
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
                    <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>Pay in Advance</ThemedText>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Remaining due at venue</ThemedText>
                  </View>
                </View>
                <ThemedText type="headlineSm" style={{ color: '#5D68E8', fontFamily: 'HankenGrotesk_800ExtraBold' }}>
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
                        fontFamily: 'HankenGrotesk_700Bold',
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
                          placeholderTextColor={theme.onPrimaryContainer}
                          style={{ backgroundColor: theme.surfaceLowest, color: theme.text, padding: Spacing.sm, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: theme.outlineVariant, marginBottom: Spacing.sm, alignSelf: 'stretch' }} 
                        />
                        <View style={{ flexDirection: 'row', gap: Spacing.sm, alignSelf: 'stretch' }}>
                          <TextInput 
                            placeholder="MM/YY" 
                            placeholderTextColor={theme.onPrimaryContainer}
                            style={{ flex: 1, backgroundColor: theme.surfaceLowest, color: theme.text, padding: Spacing.sm, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: theme.outlineVariant }} 
                          />
                          <TextInput 
                            placeholder="CVV" 
                            placeholderTextColor={theme.onPrimaryContainer}
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
                        <ThemedText type="bodySm" style={{ color: theme.surfaceLowest, marginBottom: Spacing.sm, textAlign: 'center' }}>Pay securely with Apple Pay.</ThemedText>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Booking Summary Ticket Card */}
          <View style={[styles.section, { paddingBottom: 60 }]}>
            <View style={[styles.ticketContainer, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '44' }, Shadows.level3]}>
              
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
                {/* Chip & Bookmark icon */}
                <View style={styles.ticketChipAndActionRow}>
                  <View style={[styles.ticketChip, { backgroundColor: theme.primary + '15' }]}>
                    <ThemedText type="labelSm" style={{ color: theme.primary, fontWeight: '700', fontSize: 10, textTransform: 'uppercase' }}>
                      Court Booking
                    </ThemedText>
                  </View>
                  <Pressable style={[styles.ticketBookmarkBtn, { borderColor: theme.outlineVariant + '33' }]}>
                    <Ionicons name="bookmark-outline" size={14} color={theme.textSecondary} />
                  </Pressable>
                </View>

                {/* Bold title & location */}
                <ThemedText type="bodyLg" style={{ color: theme.text, marginTop: 10, fontFamily: 'HankenGrotesk_700Bold' }}>
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
                        {selectedDayOfMonth} Feb. 2024
                      </ThemedText>
                    </View>
                    <View style={styles.ticketGridCol}>
                      <ThemedText style={styles.ticketGridLabel}>Time</ThemedText>
                      <ThemedText style={[styles.ticketGridValue, { color: theme.text }]}>
                        {selectedSlots.length > 0 ? `${selectedSlots[0]} - ${selectedSlots[selectedSlots.length - 1]}` : 'TBD'}
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
                  
                  <View style={styles.ticketPriceTotalRow}>
                    <ThemedText style={[styles.ticketPriceTotalLabel, { color: theme.text }]}>Total Due</ThemedText>
                    <ThemedText style={[styles.ticketPriceTotalVal, { color: theme.secondary }]}>₹{total.toFixed(2)}</ThemedText>
                  </View>
                  {advancePct < 100 && (
                    <View style={[styles.ticketPriceRow, { marginTop: 4 }]}>
                      <ThemedText style={{ color: theme.textSecondary, fontSize: 11, fontWeight: 'bold' }}>Pay Now ({advancePct}%)</ThemedText>
                      <ThemedText style={{ color: theme.primary, fontSize: 12, fontWeight: 'bold' }}>₹{advanceAmount.toFixed(2)}</ThemedText>
                    </View>
                  )}
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
                    BK-{(venueId + selectedDayOfMonth).toUpperCase()}-2024
                  </ThemedText>
                </View>

                {/* Secure Confirm Booking Button */}
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
                      ₹{advanceAmount} via {PAYMENT_METHODS.find(p => p.id === paymentMethod)?.label ?? 'Apple Pay'}
                    </ThemedText>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#ffffff" />
                </Pressable>

                <ThemedText type="labelSm" style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 10 }}>
                  🔒 Secure payment · Free cancellation 24h before
                </ThemedText>
              </View>

            </View>
          </View>
        </ScrollView>
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
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 16,
  },
  scrollContent: {
    paddingBottom: 40,
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
  badgeContainer: {
    backgroundColor: '#5D68E8',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.xs,
  },
  badgeText: {
    color: '#6b4500',
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10,
  },
  heroTitle: {
    color: '#ffffff',
    fontFamily: 'HankenGrotesk_800ExtraBold',
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
    borderWidth: 1,
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
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  slotItem: {
    width: '23%',
    height: 48,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
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
    padding: Spacing.md,
    borderRadius: BorderRadius.premium,
    borderWidth: 1,
  },
  serviceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceAddBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.default,
  },
  ticketContainer: {
    borderRadius: BorderRadius.premium,
    borderWidth: 1,
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
    fontFamily: 'HankenGrotesk_800ExtraBold',
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
  ticketChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
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
    fontFamily: 'HankenGrotesk_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ticketGridValue: {
    fontSize: 12.5,
    fontFamily: 'HankenGrotesk_700Bold',
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
    fontFamily: 'HankenGrotesk_600SemiBold',
  },
  ticketPriceValue: {
    fontSize: 12,
    fontFamily: 'HankenGrotesk_700Bold',
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
    fontFamily: 'HankenGrotesk_700Bold',
  },
  ticketPriceTotalVal: {
    fontSize: 16,
    fontFamily: 'HankenGrotesk_800ExtraBold',
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
    fontFamily: 'HankenGrotesk_600SemiBold',
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
    fontFamily: 'HankenGrotesk_800ExtraBold',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  ticketConfirmBtnSub: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'HankenGrotesk_600SemiBold',
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
});
