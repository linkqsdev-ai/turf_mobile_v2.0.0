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
            router.dismissAll();
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

  return (
    <GradientContainer screenName="booking" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Top App Bar */}
        <View style={styles.header}>
          <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/coach')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </Pressable>
          <ThemedText type="headlineSm" style={styles.headerTitle}>
            Book Coach
          </ThemedText>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Hero Card */}
          <View style={styles.section}>
            <View style={[styles.heroCard, { backgroundColor: theme.surfaceLowest }, Shadows.level1]}>
              <View style={styles.heroRow}>
                <Image source={typeof coachAvatar === 'string' && !/^\d+$/.test(coachAvatar) ? { uri: coachAvatar } : (typeof coachAvatar === 'number' ? coachAvatar : parseInt(coachAvatar, 10))} style={styles.heroAvatar} contentFit="cover" />
                <View style={styles.heroDetails}>
                  <ThemedText type="labelSm" style={{ color: theme.secondary, letterSpacing: 0.5 }}>COACH SESSION</ThemedText>
                  <ThemedText type="headlineMd" style={{ color: theme.text, marginTop: 4 }}>{coachName}</ThemedText>
                  <ThemedText type="bodySm" style={{ color: theme.textSecondary, marginTop: 4 }}>
                    Base rate: {coachRateStr}
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>

          {/* Date Picker Grid */}
          <View style={styles.section}>
            <View style={[styles.formCard, { backgroundColor: theme.surfaceLowest }, Shadows.level1]}>
              <View style={styles.monthHeader}>
                <ThemedText type="headlineSm" style={{ color: theme.text }}>February 2024</ThemedText>
                <View style={styles.monthNav}>
                  <Pressable style={styles.monthNavBtn}>
                    <Ionicons name="chevron-back" size={18} color={theme.text} />
                  </Pressable>
                  <Pressable style={styles.monthNavBtn}>
                    <Ionicons name="chevron-forward" size={18} color={theme.text} />
                  </Pressable>
                </View>
              </View>

              <View style={styles.dayLabelsRow}>
                {['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'].map((d) => (
                  <ThemedText key={d} type="labelSm" style={[styles.dayLabelText, { color: theme.textSecondary }]}>
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
                      style={[
                        styles.calendarDayCell,
                        isSelected && { backgroundColor: theme.secondaryContainer, borderRadius: BorderRadius.md },
                      ]}
                    >
                      <ThemedText
                        type="bodyMd"
                        style={{
                          color: isSelected ? theme.onSecondaryContainer : isCurrent ? theme.textSecondary : theme.text,
                          fontFamily: isSelected ? 'Sora_700Bold' : 'Sora_400Regular',
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

          {/* Predefined Sessions List */}
          <View style={styles.section}>
            <View style={[styles.formCard, { backgroundColor: theme.surfaceLowest }, Shadows.level1]}>
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
                        }}
                      >
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
                        { backgroundColor: theme.surfaceLow },
                        isSelected && { backgroundColor: theme.primary, borderColor: theme.primary },
                        isDisabled && { opacity: 0.35, backgroundColor: theme.surfaceLow + '60' },
                      ]}
                    >
                      <View style={styles.sessionItemLeft}>
                        <ThemedText
                          type="headlineSm"
                          style={{
                            color: isSelected ? '#ffffff' : isDisabled ? theme.textSecondary : theme.text,
                            fontSize: 15,
                            textDecorationLine: isDisabled ? 'line-through' : 'none',
                          }}
                        >
                          {session.title}
                        </ThemedText>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                          <Ionicons
                            name="time-outline"
                            size={14}
                            color={isSelected ? '#ffffffcc' : isDisabled ? theme.textSecondary + '60' : theme.textSecondary}
                          />
                          <ThemedText
                            type="labelSm"
                            style={{
                              color: isSelected ? '#ffffffcc' : isDisabled ? theme.textSecondary + '60' : theme.textSecondary,
                              marginLeft: 4,
                              textDecorationLine: isDisabled ? 'line-through' : 'none',
                            }}
                          >
                            {session.time}
                          </ThemedText>
                        </View>
                      </View>
                      
                      <View style={[styles.radioCircle, isSelected && { borderColor: '#ffffff' }, isDisabled && { opacity: 0.3 }]}>
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.noticeRow}>
                <Ionicons name="information-circle-outline" size={16} color={theme.textSecondary} />
                <ThemedText type="bodySm" style={{ color: theme.textSecondary, marginLeft: 4, flex: 1 }}>
                  Select one session. Free cancellation up to 24h before.
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Coach Add-ons */}
          <View style={styles.section}>
            <ThemedText type="labelMd" style={{ color: theme.textSecondary, marginBottom: Spacing.sm, letterSpacing: 0.5 }}>
              COACH ADD-ONS
            </ThemedText>

            <View style={[styles.serviceRow, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
              <View style={styles.serviceLeft}>
                <View style={[styles.serviceIconWrap, { backgroundColor: theme.secondaryContainer + '1a' }]}>
                  <Ionicons name="videocam" size={18} color={theme.secondaryContainer} />
                </View>
                <View style={{ marginLeft: Spacing.sm }}>
                  <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold' }}>Detailed Video Analysis</ThemedText>
                  <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>+₹500 / Session</ThemedText>
                </View>
              </View>
              <Pressable
                onPress={() => setVideoAnalysis(!videoAnalysis)}
                style={[
                  styles.serviceAddBtn,
                  videoAnalysis ? { backgroundColor: theme.primary } : { backgroundColor: theme.secondaryContainer }
                ]}
              >
                <ThemedText type="labelMd" style={{ color: videoAnalysis ? '#ffffff' : theme.onSecondaryContainer }}>
                  {videoAnalysis ? 'ADDED' : '+ ADD'}
                </ThemedText>
              </Pressable>
            </View>

            <View style={[styles.serviceRow, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', marginTop: Spacing.sm }]}>
              <View style={styles.serviceLeft}>
                <View style={[styles.serviceIconWrap, { backgroundColor: theme.secondaryContainer + '1a' }]}>
                  <Ionicons name="nutrition" size={18} color={theme.secondaryContainer} />
                </View>
                <View style={{ marginLeft: Spacing.sm }}>
                  <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold' }}>Personalized Diet Plan</ThemedText>
                  <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>+₹300</ThemedText>
                </View>
              </View>
              <Pressable
                onPress={() => setDietPlan(!dietPlan)}
                style={[
                  styles.serviceAddBtn,
                  dietPlan ? { backgroundColor: theme.primary } : { backgroundColor: theme.secondaryContainer }
                ]}
              >
                <ThemedText type="labelMd" style={{ color: dietPlan ? '#ffffff' : theme.onSecondaryContainer }}>
                  {dietPlan ? 'ADDED' : '+ ADD'}
                </ThemedText>
              </Pressable>
            </View>
          </View>

          {/* Payment Method */}
          <View style={[styles.section, { paddingBottom: 100 }]}>
            <ThemedText type="headlineSm" style={{ color: theme.text, marginBottom: 4 }}>
              Payment Method
            </ThemedText>
            <View style={{ gap: Spacing.sm, marginTop: Spacing.sm }}>
              {PAYMENT_METHODS.map(pm => {
                const isSelected = paymentMethod === pm.id;
                return (
                  <Pressable
                    key={pm.id}
                    onPress={() => setPaymentMethod(pm.id)}
                    style={[{ padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: theme.outlineVariant + '40', backgroundColor: theme.surfaceLowest }, isSelected && { borderColor: theme.primary, backgroundColor: theme.primaryContainer }]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name={pm.icon as any} size={24} color={isSelected ? theme.surfaceLowest : pm.color} />
                        <ThemedText type="bodyMd" style={{ marginLeft: 12, color: isSelected ? theme.surfaceLowest : theme.text }}>{pm.label}</ThemedText>
                      </View>
                      <View style={[{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: theme.outlineVariant, justifyContent: 'center', alignItems: 'center' }, isSelected && { borderColor: theme.surfaceLowest }]}>
                        {isSelected && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: theme.surfaceLowest }} />}
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

        </ScrollView>

        {/* Sticky Footer */}
        <View style={[styles.stickyFooter, { backgroundColor: theme.surfaceLowest, borderTopColor: theme.outlineVariant + '22' }, Shadows.level3]}>
          <View style={styles.footerLeft}>
            <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Total Due</ThemedText>
            <ThemedText type="headlineMd" style={{ color: theme.primary, fontFamily: 'Sora_800ExtraBold' }}>
              ₹{total.toLocaleString()}
            </ThemedText>
          </View>
          <Pressable 
            style={[styles.confirmBtn, !selectedSessionId && { opacity: 0.5 }]} 
            onPress={handleConfirmBooking}
            disabled={!selectedSessionId}
          >
            <ThemedText type="labelMd" style={{ color: '#ffffff', fontFamily: 'Sora_700Bold', fontSize: 14 }}>
              Confirm Booking
            </ThemedText>
            <Ionicons name="chevron-forward" size={16} color="#ffffff" style={{ marginLeft: 4 }} />
          </Pressable>
        </View>

      </SafeAreaView>
    </GradientContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    height: 56,
  },
  backButton: { padding: 6 },
  headerTitle: { fontFamily: 'Sora_700Bold', fontSize: 16 },
  scrollContent: { paddingBottom: 40 },
  section: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.containerMargin,
  },
  heroCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  heroDetails: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  formCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'transparent',
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
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  daySelectorGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  daySelectorTab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  daySelectorTabActive: {
    borderWidth: 1,
  },
  sessionsList: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sessionItemLeft: {
    flex: 1,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ffffff',
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  serviceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceIconWrap: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceAddBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.containerMargin,
    paddingVertical: Spacing.md,
    paddingBottom: 28,
    borderTopWidth: 1,
  },
  footerLeft: {
    flex: 1,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5D68E8',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: BorderRadius.full,
  },
});
