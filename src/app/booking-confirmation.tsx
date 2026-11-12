import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ConfirmationView } from '@/components/confirmation-view';
import { CashbackOutputCard } from '@/components/cashback-output-card';
import { useTheme } from '@/hooks/use-theme';

/**
 * booking-confirmation.tsx
 * The turf booking receipt.
 *
 * The layout lives in ConfirmationView, shared with tournament registration —
 * the two screens are the same moment in the product and previously looked
 * like two different apps.
 */
export default function BookingConfirmationScreen() {
  const router = useRouter();
  const theme = useTheme();

  const params = useLocalSearchParams<{
    bookingRef: string;
    venueName: string;
    dayLabel: string;
    slots: string;
    total: string;
    advancePaid: string;
    cashbackEarned?: string;
    cashbackName?: string;
    cashbackCode?: string;
    cashbackType?: 'flat' | 'percent';
    cashbackMaxAmount?: string;
    cashbackOneTime?: string;
  }>();

  const slots = params.slots ? params.slots.split(',') : [];
  const earnedAmount = params.cashbackEarned ? parseFloat(params.cashbackEarned) : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ConfirmationView
        title="Booking Confirmed!"
        subtitle="Your turf slot has been successfully reserved."
        referenceLabel="BOOKING REFERENCE"
        reference={params.bookingRef || 'BK-TURF8821'}
        extraContent={
          earnedAmount > 0 ? (
            <View style={{ marginBottom: 14 }}>
              <CashbackOutputCard
                entityName={params.venueName || 'Turf Venue'}
                entityType="turf"
                cashbackAmount={earnedAmount}
                cashbackType={params.cashbackType || 'flat'}
                cashbackName={params.cashbackName || `${params.venueName || 'Turf'} Cashback Reward`}
                cashbackCode={params.cashbackCode}
                cashbackMaxAmount={params.cashbackMaxAmount ? parseFloat(params.cashbackMaxAmount) : undefined}
                cashbackOneTime={params.cashbackOneTime === 'true'}
              />
            </View>
          ) : undefined
        }
        infoRows={[
          { icon: 'business-outline', label: 'VENUE', value: params.venueName || 'Turf' },
          { icon: 'calendar-outline', label: 'DATE', value: params.dayLabel || '—' },
          {
            icon: 'time-outline',
            label: 'TIME SLOTS',
            value: slots.length > 0 ? slots.join(' · ') : '02:00 PM',
          },
        ]}
        leftSummary={{ label: 'ADVANCE PAID', value: `₹${params.advancePaid || '0.00'}` }}
        rightSummary={{ label: 'TOTAL BOOKING DUE', value: `₹${params.total || '0.00'}` }}
        notice="A confirmation SMS & email have been sent to your registered contact. Please show this booking reference at the venue desk upon arrival."
        secondaryAction={{
          icon: 'search-outline',
          label: 'Browse More',
          onPress: () => router.replace('/(tabs)/explore'),
        }}
        primaryAction={{
          icon: 'home',
          label: 'Go Home',
          onPress: () => router.replace('/(tabs)'),
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
