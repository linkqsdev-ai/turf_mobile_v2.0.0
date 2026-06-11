import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Alert,
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

  // Lookup details
  const venueId = params.id && VENUE_LOOKUP[params.id] ? params.id : 'lords';
  const venue = VENUE_LOOKUP[venueId];

  // Booking states
  const [selectedDayOfMonth, setSelectedDayOfMonth] = useState<number>(14);
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<string>('Wednesday');
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
    Alert.alert(
      "Booking Confirmed",
      `Your session at ${venue.name} on Wed, Feb ${selectedDayOfMonth} is confirmed.\nTotal: ₹${total.toFixed(2)}`,
      [
        {
          text: "Back to Home",
          onPress: () => {
            router.dismissAll();
            router.replace('/(tabs)');
          }
        }
      ]
    );
  };

  // Generate calendar days for Feb 2024 (29 days, starts Thursday)
  // Thursday is index 3 in grid (Monday = 0)
  const calendarGrid = [];
  // Add 3 padding items
  for (let i = 0; i < 3; i++) {
    calendarGrid.push({ dayNumber: 0, disabled: true });
  }
  for (let day = 1; day <= 29; day++) {
    calendarGrid.push({ dayNumber: day, disabled: false });
  }

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
              <View style={styles.heroOverlay}>
                <View style={[styles.badgeContainer, { backgroundColor: theme.secondaryContainer }]}>
                  <ThemedText type="labelSm" style={[styles.badgeText, { color: theme.onSecondaryContainer }]}>PREMIUM VENUE</ThemedText>
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
                    <Ionicons name="star" size={14} color={theme.secondaryContainer} />
                    <ThemedText type="bodySm" style={[styles.heroSubText, { color: '#ffffff', fontWeight: 'bold' }]}>
                      {venue.rating} <ThemedText type="labelSm" style={{ color: '#ffffffaa' }}>({venue.reviews.split(' ')[0]})</ThemedText>
                    </ThemedText>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Date Picker Grid */}
          <View style={styles.section}>
            <View style={[styles.formCard, { backgroundColor: theme.surfaceLowest }, Shadows.level1]}>
              <View style={styles.monthHeader}>
                <ThemedText type="headlineSm" style={{ color: theme.text }}>
                  February 2024
                </ThemedText>
                <View style={styles.monthNav}>
                  <Pressable style={styles.monthNavBtn}>
                    <Ionicons name="chevron-back" size={18} color={theme.text} />
                  </Pressable>
                  <Pressable style={styles.monthNavBtn}>
                    <Ionicons name="chevron-forward" size={18} color={theme.text} />
                  </Pressable>
                </View>
              </View>

              {/* Day Labels */}
              <View style={styles.dayLabelsRow}>
                {['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'].map((d) => (
                  <ThemedText key={d} type="labelSm" style={[styles.dayLabelText, { color: theme.textSecondary }]}>
                    {d}
                  </ThemedText>
                ))}
              </View>

              {/* Month Grid */}
              <View style={styles.calendarGrid}>
                {calendarGrid.map((item, idx) => {
                  if (item.dayNumber === 0) {
                    return <View key={`pad-${idx}`} style={styles.calendarDayCell} />;
                  }

                  const isSelected = item.dayNumber === selectedDayOfMonth;
                  const isCurrent = item.dayNumber === 12; // Muted style for '12' in the mock

                  return (
                    <Pressable
                      key={`day-${item.dayNumber}`}
                      onPress={() => setSelectedDayOfMonth(item.dayNumber)}
                      style={[
                        styles.calendarDayCell,
                        isSelected && { backgroundColor: theme.secondaryContainer, borderRadius: BorderRadius.md },
                      ]}
                    >
                      <ThemedText
                        type="bodyMd"
                        style={{
                          color: isSelected ? theme.onSecondaryContainer : isCurrent ? theme.textSecondary : theme.text,
                          fontFamily: isSelected ? 'HankenGrotesk_700Bold' : 'HankenGrotesk_400Regular',
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

          {/* Booking Summary Card */}
          <View style={[styles.section, { paddingBottom: 60 }]}>
            <View style={[styles.summaryCard, { backgroundColor: theme.primaryContainer }, Shadows.level3]}>
              <View style={{ marginBottom: Spacing.md }}>
                <ThemedText type="headlineSm" style={{ color: '#ffffff' }}>Booking Summary</ThemedText>
                <ThemedText type="bodySm" style={{ color: theme.onPrimaryContainer }}>
                  Review your session details before final confirmation.
                </ThemedText>
              </View>

              {/* Date details */}
              <View style={styles.summaryItemRow}>
                <View style={styles.summaryItemIcon}>
                  <Ionicons name="calendar" size={18} color={theme.secondaryContainer} />
                </View>
                <View style={{ marginLeft: Spacing.md }}>
                  <ThemedText type="labelSm" style={{ color: theme.onPrimaryContainer }}>DATE</ThemedText>
                  <ThemedText type="bodyMd" style={{ color: '#ffffff', fontFamily: 'HankenGrotesk_700Bold' }}>
                    {selectedDayOfWeek}, Feb {selectedDayOfMonth}, 2024
                  </ThemedText>
                </View>
              </View>

              {/* Time slot details */}
              <View style={styles.summaryItemRow}>
                <View style={styles.summaryItemIcon}>
                  <Ionicons name="time" size={18} color={theme.secondaryContainer} />
                </View>
                <View style={{ marginLeft: Spacing.md }}>
                  <ThemedText type="labelSm" style={{ color: theme.onPrimaryContainer }}>TIME SLOT</ThemedText>
                  <ThemedText type="bodyMd" style={{ color: '#ffffff', fontFamily: 'HankenGrotesk_700Bold' }}>
                    {selectedSlots.length > 0 ? `${selectedSlots[0]} - ${selectedSlots[selectedSlots.length - 1]}` : 'No slots selected'}
                  </ThemedText>
                  <ThemedText type="bodySm" style={{ color: theme.onPrimaryContainer }}>
                    {selectedSlots.length} Hours Session
                  </ThemedText>
                </View>
              </View>

              {/* Area details */}
              <View style={styles.summaryItemRow}>
                <View style={styles.summaryItemIcon}>
                  <Ionicons name="football" size={18} color={theme.secondaryContainer} />
                </View>
                <View style={{ marginLeft: Spacing.md }}>
                  <ThemedText type="labelSm" style={{ color: theme.onPrimaryContainer }}>COURT / AREA</ThemedText>
                  <ThemedText type="bodyMd" style={{ color: '#ffffff', fontFamily: 'HankenGrotesk_700Bold' }}>
                    Pavillion Main Wing
                  </ThemedText>
                </View>
              </View>

              {/* Pricing tally */}
              <View style={styles.priceBreakdown}>
                <View style={styles.priceRow}>
                  <ThemedText type="bodyMd" style={{ color: theme.onPrimaryContainer }}>Court Hire Fee</ThemedText>
                  <ThemedText type="bodyMd" style={{ color: '#ffffff' }}>₹{courtFee.toFixed(2)}</ThemedText>
                </View>
                {coachAdded && (
                  <View style={styles.priceRow}>
                    <ThemedText type="bodyMd" style={{ color: theme.onPrimaryContainer }}>Pro Net Coach</ThemedText>
                    <ThemedText type="bodyMd" style={{ color: '#ffffff' }}>₹{coachFee.toFixed(2)}</ThemedText>
                  </View>
                )}
                {recordingAdded && (
                  <View style={styles.priceRow}>
                    <ThemedText type="bodyMd" style={{ color: theme.onPrimaryContainer }}>HD Match Recording</ThemedText>
                    <ThemedText type="bodyMd" style={{ color: '#ffffff' }}>₹{recordingFee.toFixed(2)}</ThemedText>
                  </View>
                )}
                <View style={styles.priceRow}>
                  <ThemedText type="bodyMd" style={{ color: theme.onPrimaryContainer }}>Service Charge</ThemedText>
                  <ThemedText type="bodyMd" style={{ color: '#ffffff' }}>₹{serviceCharge.toFixed(2)}</ThemedText>
                </View>
                <View style={[styles.priceRow, { borderTopWidth: 1, borderTopColor: '#ffffff1a', paddingTop: Spacing.md, marginTop: Spacing.sm }]}>
                  <ThemedText type="headlineSm" style={{ color: '#ffffff' }}>Total</ThemedText>
                  <ThemedText type="headlineSm" style={{ color: theme.secondaryContainer, fontFamily: 'HankenGrotesk_800ExtraBold' }}>
                    ₹{total.toFixed(2)}
                  </ThemedText>
                </View>
                {advancePct < 100 && (
                  <View style={[styles.priceRow, { marginTop: 4 }]}>
                    <ThemedText type="labelSm" style={{ color: theme.onPrimaryContainer }}>Pay Now ({advancePct}%)</ThemedText>
                    <ThemedText type="labelSm" style={{ color: '#5D68E8', fontFamily: 'HankenGrotesk_700Bold' }}>₹{advanceAmount}</ThemedText>
                  </View>
                )}
              </View>

              {/* Action Button — Premium redesigned */}
              <Pressable
                onPress={handleConfirmBooking}
                disabled={selectedSlots.length === 0}
                style={[
                  styles.confirmBtn,
                  selectedSlots.length === 0 && { opacity: 0.45 }
                ]}
              >
                {/* Left icon block */}
                <View style={styles.confirmBtnIconWrap}>
                  <Ionicons name="shield-checkmark" size={20} color={'#5D68E8'} />
                </View>

                {/* Center label */}
                <View style={styles.confirmBtnLabelWrap}>
                  <ThemedText style={styles.confirmBtnTitle}>
                    CONFIRM BOOKING
                  </ThemedText>
                  <ThemedText style={styles.confirmBtnSub}>
                    ₹{advanceAmount} via {PAYMENT_METHODS.find(p => p.id === paymentMethod)?.label ?? 'UPI'}
                  </ThemedText>
                </View>

                {/* Right arrow */}
                <View style={styles.confirmBtnArrow}>
                  <Ionicons name="chevron-forward" size={20} color={'#ffffff'} />
                </View>
              </Pressable>

              <ThemedText type="labelSm" style={{ color: theme.onPrimaryContainer, textAlign: 'center', marginTop: Spacing.sm }}>
                🔒 Secure payment · Free cancellation 24h before
              </ThemedText>
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
  summaryCard: {
    borderRadius: BorderRadius.premium,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  summaryItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  summaryItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceBreakdown: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: Spacing.md,
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confirmBtn: {
    backgroundColor: '#0a1929',
    height: 68,
    borderRadius: BorderRadius.premium,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(93, 104, 232, 0.3)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  confirmBtnIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(93, 104, 232, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(93, 104, 232, 0.3)',
  },
  confirmBtnLabelWrap: {
    flex: 1,
  },
  confirmBtnTitle: {
    color: '#ffffff',
    fontFamily: 'HankenGrotesk_800ExtraBold',
    fontSize: 15,
    letterSpacing: 0.8,
  },
  confirmBtnSub: {
    color: '#5D68E8',
    fontFamily: 'HankenGrotesk_600SemiBold',
    fontSize: 11,
    marginTop: 2,
    letterSpacing: 0.2,
  },
  confirmBtnArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
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
});
