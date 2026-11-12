import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { GradientContainer } from '@/components/gradient-container';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { isTimeSlotPassed } from '@/utils/date-utils';
import { LinearGradient } from 'expo-linear-gradient';
import { SectionHeading } from '@/components/home/dashboard-widgets';

// Predefined coach sessions
const COACH_SESSIONS = [
  { id: 's1', time: '09:00 AM - 10:30 AM', title: 'Morning Focus Drill', disabled: false },
  { id: 's2', time: '11:00 AM - 12:30 PM', title: 'Midday Mastery', disabled: true },
  { id: 's3', time: '02:00 PM - 03:30 PM', title: 'Afternoon Tactical', disabled: false },
  { id: 's4', time: '04:30 PM - 06:30 PM', title: 'Evening Scrimmage', disabled: false },
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
  { id: 'card',   label: 'Credit/Debit',icon: 'card',         family: 'Ionicons', color: '#5D68E8' },
];

export default function BookCoachScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();

  // Params from coach screen
  const coachName = (params.coachName as string) || 'Coach Volt';
  const coachRateStr = (params.coachRate as string) || '₹1,200/hr';
  const coachAvatar = (params.coachAvatar as string) || 'https://randomuser.me/api/portraits/men/32.jpg';
  
  // Extract rate number
  const rateMatch = coachRateStr.match(/\d+(,\d+)?/);
  const baseRate = rateMatch ? parseInt(rateMatch[0].replace(',', ''), 10) : 1200;

  // Booking states
  const today = new Date();
  const [selectedDayOfMonth, setSelectedDayOfMonth] = useState<number>(today.getDate());
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<string>(
    today.toLocaleDateString('en-US', { weekday: 'long' })
  );
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(() => {
    const todayWeekday = today.toLocaleDateString('en-US', { weekday: 'long' });
    const firstValid = COACH_SESSIONS.find(s => !s.disabled && !isTimeSlotPassed(s.time, todayWeekday));
    return firstValid ? firstValid.id : null;
  });
  
  // Add-ons
  const [videoAnalysis, setVideoAnalysis] = useState(false);
  const [dietPlan, setDietPlan] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('apple');

  // Constants
  const sessionFee = baseRate * 1.5; // Assuming a 1.5 hr session
  const serviceCharge = Math.round(sessionFee * 0.05); // 5% service fee
  const videoFee = videoAnalysis ? 500 : 0;
  const dietFee = dietPlan ? 300 : 0;
  
  const total = selectedSessionId ? sessionFee + serviceCharge + videoFee + dietFee : 0;

  const handleConfirmBooking = () => {
    Alert.alert(
      "Booking Confirmed",
      `Your session with ${coachName} on Wed, Feb ${selectedDayOfMonth} is confirmed.\nTotal: ₹${total.toLocaleString()}`,
      [
        {
          text: "Back to Home",
          onPress: () => {
            router.replace('/(tabs)');
          }
        }
      ]
    );
  };

  // Generate calendar days for Feb 2024
  const calendarGrid = [];
  for (let i = 0; i < 3; i++) calendarGrid.push({ dayNumber: 0, disabled: true });
  for (let day = 1; day <= 29; day++) calendarGrid.push({ dayNumber: day, disabled: false });

  const selectedSession = COACH_SESSIONS.find(s => s.id === selectedSessionId);

  // Home-dashboard palette — the same accents the player dashboard tints with.
  const accent = '#F59E0B';
  const info = '#3B82F6';
  const success = '#10B981';

  const cardSurface = {
    backgroundColor: theme.surfaceLowest,
    borderColor: theme.outlineVariant + '33',
  };

  const addOns = [
    { key: 'video', icon: 'videocam' as const, title: 'Detailed Video Analysis', price: '+₹500 / Session', on: videoAnalysis, toggle: () => setVideoAnalysis(!videoAnalysis), tint: info },
    { key: 'diet', icon: 'nutrition' as const, title: 'Personalized Diet Plan', price: '+₹300', on: dietPlan, toggle: () => setDietPlan(!dietPlan), tint: success },
  ];

  return (
    <GradientContainer screenName="booking" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Top app bar */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/coach')}
            hitSlop={6}
            style={[styles.roundBtn, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '40' }]}
          >
            <Ionicons name="arrow-back" size={18} color={theme.text} />
          </Pressable>
          <View style={styles.headerCenter}>
            <ThemedText style={[styles.headerEyebrow, { color: theme.textSecondary }]}>BOOK COACH</ThemedText>
            <ThemedText style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>{coachName}</ThemedText>
          </View>
          <View style={styles.roundSpacer} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Hero card */}
          <View style={[styles.section, { marginTop: 12 }]}>
            <View style={[styles.heroCard, cardSurface, Shadows.level2]}>
              <LinearGradient
                colors={[theme.primary + '26', info + '10', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.heroRow}>
                <View style={[styles.avatarRing, { borderColor: theme.primary }]}>
                  <Image
                    source={typeof coachAvatar === 'string' && !/^\d+$/.test(coachAvatar) ? { uri: coachAvatar } : (typeof coachAvatar === 'number' ? coachAvatar : parseInt(coachAvatar, 10))}
                    style={styles.heroAvatar}
                    contentFit="cover"
                  />
                </View>
                <View style={styles.heroDetails}>
                  <View style={[styles.heroBadge, { backgroundColor: theme.primary + '22' }]}>
                    <ThemedText style={[styles.heroBadgeText, { color: theme.primary }]}>COACH SESSION</ThemedText>
                  </View>
                  <ThemedText style={[styles.heroTitle, { color: theme.text }]} numberOfLines={1}>{coachName}</ThemedText>
                  <ThemedText style={[styles.heroSub, { color: theme.textSecondary }]}>
                    Base rate: {coachRateStr}
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>

          {/* Date picker */}
          <View style={styles.section}>
            <SectionHeading title="Pick a date" tint={theme.primary} />
            <View style={[styles.card, cardSurface, Shadows.level1]}>
              <View style={styles.monthHeader}>
                <ThemedText style={[styles.cardTitle, { color: theme.text }]}>February 2024</ThemedText>
                <View style={styles.monthNav}>
                  <Pressable style={[styles.monthNavBtn, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33' }]}>
                    <Ionicons name="chevron-back" size={15} color={theme.text} />
                  </Pressable>
                  <Pressable style={[styles.monthNavBtn, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33' }]}>
                    <Ionicons name="chevron-forward" size={15} color={theme.text} />
                  </Pressable>
                </View>
              </View>

              <View style={styles.dayLabelsRow}>
                {['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'].map((d) => (
                  <ThemedText key={d} style={[styles.dayLabelText, { color: theme.textSecondary }]}>
                    {d}
                  </ThemedText>
                ))}
              </View>

              <View style={styles.calendarGrid}>
                {calendarGrid.map((item, idx) => {
                  if (item.dayNumber === 0) return <View key={`pad-${idx}`} style={styles.calendarDayCell} />;
                  const isSelected = item.dayNumber === selectedDayOfMonth;
                  const isCurrent = item.dayNumber === 12;

                  return (
                    <Pressable
                      key={`day-${item.dayNumber}`}
                      onPress={() => setSelectedDayOfMonth(item.dayNumber)}
                      style={styles.calendarDayCell}
                    >
                      <View style={[styles.calendarDayInner, isSelected && { backgroundColor: theme.primary }]}>
                        <ThemedText
                          style={[
                            styles.calendarDayText,
                            {
                              color: isSelected ? '#ffffff' : isCurrent ? theme.textSecondary : theme.text,
                              fontFamily: isSelected ? 'Sora_500Medium' : 'Sora_400Regular',
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

          {/* Predefined sessions */}
          <View style={styles.section}>
            <SectionHeading title="Sessions" tint={accent} />
            <View style={[styles.card, cardSurface, Shadows.level1]}>
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
                        setSelectedDayOfWeek(d.full);
                        // Check if current selected session is past on the new day
                        if (selectedSessionId) {
                          const currentSession = COACH_SESSIONS.find(s => s.id === selectedSessionId);
                          if (currentSession && isTimeSlotPassed(currentSession.time, d.full)) {
                            const firstValid = COACH_SESSIONS.find(s => !s.disabled && !isTimeSlotPassed(s.time, d.full));
                            setSelectedSessionId(firstValid ? firstValid.id : null);
                          }
                        }
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

              <View style={styles.sessionsList}>
                {COACH_SESSIONS.map((session) => {
                  const isPassed = isTimeSlotPassed(session.time, selectedDayOfWeek);
                  const isSelected = selectedSessionId === session.id;
                  const isDisabled = session.disabled || isPassed;

                  return (
                    <Pressable
                      key={session.id}
                      disabled={isDisabled}
                      onPress={() => setSelectedSessionId(session.id)}
                      style={[
                        styles.sessionItem,
                        isSelected
                          ? { backgroundColor: theme.primary + '0D', borderColor: theme.primary }
                          : { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '26' },
                        isDisabled && { opacity: 0.4 },
                      ]}
                    >
                      <View style={[styles.sessionIcon, { backgroundColor: isSelected ? theme.primary : theme.surfaceLowest }]}>
                        <Ionicons name="time-outline" size={14} color={isSelected ? '#ffffff' : theme.textSecondary} />
                      </View>
                      <View style={styles.sessionItemLeft}>
                        <ThemedText
                          style={[
                            styles.sessionTitle,
                            {
                              color: isSelected ? theme.primary : theme.text,
                              textDecorationLine: isDisabled ? 'line-through' : 'none',
                            },
                          ]}
                        >
                          {session.title}
                        </ThemedText>
                        <ThemedText
                          style={[
                            styles.sessionTime,
                            { color: theme.textSecondary, textDecorationLine: isDisabled ? 'line-through' : 'none' },
                          ]}
                        >
                          {session.time}
                        </ThemedText>
                      </View>

                      <View style={[styles.radioCircle, { borderColor: isSelected ? theme.primary : theme.outlineVariant }]}>
                        {isSelected && <View style={[styles.radioInner, { backgroundColor: theme.primary }]} />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              <View style={[styles.noticeRow, { backgroundColor: theme.surfaceLow }]}>
                <Ionicons name="information-circle-outline" size={14} color={theme.textSecondary} />
                <ThemedText style={[styles.noticeText, { color: theme.textSecondary }]}>
                  Select one session. Free cancellation up to 24h before.
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Coach add-ons */}
          <View style={styles.section}>
            <SectionHeading title="Coach add-ons" tint={success} />
            <View style={[styles.card, cardSurface, Shadows.level1, { paddingVertical: 4 }]}>
              {addOns.map((addOn, idx) => (
                <View
                  key={addOn.key}
                  style={[styles.serviceRow, idx > 0 && { borderTopWidth: 1, borderTopColor: theme.outlineVariant + '26' }]}
                >
                  <View style={[styles.cardIcon, { backgroundColor: addOn.tint + '1A' }]}>
                    <Ionicons name={addOn.icon} size={15} color={addOn.tint} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={[styles.cardTitle, { color: theme.text }]}>{addOn.title}</ThemedText>
                    <ThemedText style={[styles.cardSub, { color: theme.textSecondary }]}>{addOn.price}</ThemedText>
                  </View>
                  <Pressable
                    onPress={addOn.toggle}
                    style={[
                      styles.serviceAddBtn,
                      addOn.on
                        ? { backgroundColor: theme.primary, borderColor: theme.primary }
                        : { backgroundColor: theme.surfaceLowest, borderColor: theme.primary + '66' },
                    ]}
                  >
                    <Ionicons name={addOn.on ? 'checkmark' : 'add'} size={12} color={addOn.on ? '#ffffff' : theme.primary} />
                    <ThemedText style={[styles.serviceAddText, { color: addOn.on ? '#ffffff' : theme.primary }]}>
                      {addOn.on ? 'Added' : 'Add'}
                    </ThemedText>
                  </Pressable>
                </View>
              ))}
            </View>
          </View>

          {/* Payment method */}
          <View style={[styles.section, { paddingBottom: 110 }]}>
            <SectionHeading title="Payment method" tint={theme.primary} />
            <View style={styles.methodList}>
              {PAYMENT_METHODS.map(pm => {
                const isSelected = paymentMethod === pm.id;
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
                    <View style={[styles.methodIcon, { backgroundColor: theme.surfaceLow }]}>
                      <Ionicons name={pm.icon as any} size={17} color={pm.color === '#000000' ? theme.text : pm.color} />
                    </View>
                    <ThemedText style={[styles.methodLabel, { color: isSelected ? theme.primary : theme.text }]}>{pm.label}</ThemedText>
                    <View style={[styles.radioCircle, { borderColor: isSelected ? theme.primary : theme.outlineVariant }]}>
                      {isSelected && <View style={[styles.radioInner, { backgroundColor: theme.primary }]} />}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Sticky footer */}
        <View style={[styles.stickyFooter, { backgroundColor: theme.surfaceLowest, borderTopColor: theme.outlineVariant + '33' }]}>
          <View style={styles.footerLeft}>
            <ThemedText style={[styles.footerLabel, { color: theme.textSecondary }]}>TOTAL DUE</ThemedText>
            <ThemedText style={[styles.footerAmount, { color: theme.text }]}>
              ₹{total.toLocaleString()}
            </ThemedText>
            <ThemedText style={[styles.footerSub, { color: theme.textSecondary }]} numberOfLines={1}>
              {selectedSession ? selectedSession.title : 'Pick a session'}
            </ThemedText>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.confirmBtn,
              { backgroundColor: theme.primary },
              Shadows.level2,
              !selectedSessionId && { opacity: 0.5 },
              pressed && { opacity: 0.85 },
            ]}
            onPress={handleConfirmBooking}
            disabled={!selectedSessionId}
          >
            <ThemedText style={styles.confirmText}>Confirm Booking</ThemedText>
            <View style={styles.confirmArrow}>
              <Ionicons name="chevron-forward" size={15} color="#ffffff" />
            </View>
          </Pressable>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  roundSpacer: { width: 36 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerEyebrow: { fontFamily: 'Sora_500Medium', fontSize: 8.5, letterSpacing: 0.9 },
  headerTitle: { fontFamily: 'Sora_500Medium', fontSize: 13.5, marginTop: 1 },
  scrollContent: { paddingBottom: 40 },
  section: { marginTop: Spacing.lg, paddingHorizontal: GUTTER },

  // hero
  heroCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden', padding: Spacing.md },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarRing: { width: 66, height: 66, borderRadius: 33, borderWidth: 2, padding: 2 },
  heroAvatar: { width: '100%', height: '100%', borderRadius: 30 },
  heroDetails: { flex: 1, minWidth: 0 },
  heroBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, marginBottom: 6 },
  heroBadgeText: { fontFamily: 'Sora_500Medium', fontSize: 8.5, letterSpacing: 0.8 },
  heroTitle: { fontFamily: 'Sora_500Medium', fontSize: 15.5 },
  heroSub: { fontFamily: 'Sora_400Regular', fontSize: 11, marginTop: 2 },

  // cards
  card: { borderRadius: CARD_RADIUS, borderWidth: 1, padding: 12 },
  cardIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: 'Sora_500Medium', fontSize: 12.5 },
  cardSub: { fontFamily: 'Sora_400Regular', fontSize: 10.5, marginTop: 1 },

  // calendar
  monthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
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
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontFamily: 'Sora_500Medium',
    fontSize: 8.5,
    letterSpacing: 0.6,
  },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarDayCell: { width: `${100 / 7}%`, height: 40, justifyContent: 'center', alignItems: 'center' },
  calendarDayInner: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  calendarDayText: { fontSize: 12 },

  // sessions
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
  sessionsList: { gap: 7 },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
  },
  sessionIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  sessionItemLeft: { flex: 1 },
  sessionTitle: { fontFamily: 'Sora_500Medium', fontSize: 12.5 },
  sessionTime: { fontFamily: 'Sora_400Regular', fontSize: 10.5, marginTop: 1 },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: { width: 9, height: 9, borderRadius: 4.5 },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: CARD_RADIUS,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 10,
  },
  noticeText: { flex: 1, fontFamily: 'Sora_400Regular', fontSize: 10.5, lineHeight: 14 },

  // add-ons
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 },
  serviceAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  serviceAddText: { fontFamily: 'Sora_500Medium', fontSize: 10.5 },

  // payment
  methodList: { gap: 7 },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  methodIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  methodLabel: { flex: 1, fontFamily: 'Sora_500Medium', fontSize: 12 },

  // footer
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: GUTTER,
    paddingTop: 10,
    paddingBottom: 26,
    borderTopWidth: 1,
  },
  footerLeft: { flex: 1, minWidth: 0 },
  footerLabel: { fontFamily: 'Sora_500Medium', fontSize: 8.5, letterSpacing: 0.8 },
  footerAmount: { fontFamily: 'Sora_500Medium', fontSize: 15.5, marginTop: 1 },
  footerSub: { fontFamily: 'Sora_400Regular', fontSize: 10 },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 50,
    paddingLeft: 20,
    paddingRight: 8,
    borderRadius: 999,
  },
  confirmText: { color: '#ffffff', fontFamily: 'Sora_500Medium', fontSize: 13.5 },
  confirmArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
