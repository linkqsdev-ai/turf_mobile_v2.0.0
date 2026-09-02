import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Platform,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function BookingConfirmationScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [copied, setCopied] = useState(false);

  const params = useLocalSearchParams<{
    bookingRef: string;
    venueName: string;
    dayLabel: string;
    slots: string;
    total: string;
    advancePaid: string;
    cashbackEarned?: string;
  }>();

  const slots = params.slots ? params.slots.split(',') : [];
  const bookingRef = params.bookingRef || 'BK-TURF8821';

  const handleCopyRef = () => {
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(bookingRef);
      } else {
        Clipboard.setString(bookingRef);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.surface }]} edges={['top', 'bottom']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Celebratory Hero Animation / Icon */}
        <View style={styles.heroSection}>
          <View style={styles.outerRing}>
            <View style={styles.middleRing}>
              <View style={[styles.innerCircle, { backgroundColor: '#10b981' }, Shadows.level3]}>
                <Ionicons name="checkmark" size={36} color="#ffffff" />
              </View>
            </View>
          </View>

          <ThemedText style={[styles.heroTitle, { color: theme.text }]}>
            Booking Confirmed!
          </ThemedText>
          <ThemedText style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
            Your turf slot has been successfully reserved.
          </ThemedText>
        </View>

        {/* Cashback Banner (if earned) */}
        {params.cashbackEarned ? (
          <View style={[styles.cashbackCard, { backgroundColor: '#10b98114', borderColor: '#10b98144' }]}>
            <View style={[styles.cashbackIconBg, { backgroundColor: '#10b981' }]}>
              <Ionicons name="gift" size={18} color="#ffffff" />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.cashbackTitle}>
                ₹{params.cashbackEarned} Cashback Received!
              </ThemedText>
              <ThemedText style={styles.cashbackSub}>
                Added to your turf wallet for future sessions.
              </ThemedText>
            </View>
          </View>
        ) : null}

        {/* Main Booking Details Card */}
        <View style={[styles.ticketCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
          {/* Reference Header */}
          <View style={styles.refRow}>
            <View style={{ flex: 1 }}>
              <ThemedText style={[styles.refLabel, { color: theme.textSecondary }]}>
                BOOKING REFERENCE
              </ThemedText>
              <ThemedText style={[styles.refValue, { color: theme.primary }]}>
                {bookingRef}
              </ThemedText>
            </View>
            <Pressable
              onPress={handleCopyRef}
              style={[styles.copyBtn, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '44' }]}
            >
              <Ionicons
                name={copied ? 'checkmark' : 'copy-outline'}
                size={13}
                color={copied ? '#10b981' : theme.textSecondary}
              />
              <ThemedText style={[styles.copyBtnText, { color: copied ? '#10b981' : theme.textSecondary }]}>
                {copied ? 'Copied' : 'Copy'}
              </ThemedText>
            </Pressable>
          </View>

          {/* Dotted Separator */}
          <View style={[styles.dashedDivider, { borderColor: theme.outlineVariant + '44' }]} />

          {/* Info Rows */}
          <View style={styles.infoList}>
            {/* Venue */}
            <View style={styles.infoRow}>
              <View style={[styles.iconPill, { backgroundColor: '#5D68E818' }]}>
                <Ionicons name="location" size={15} color="#5D68E8" />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>
                  VENUE
                </ThemedText>
                <ThemedText style={[styles.infoValue, { color: theme.text }]} numberOfLines={1}>
                  {params.venueName || 'Grand Turf'}
                </ThemedText>
              </View>
            </View>

            {/* Date */}
            <View style={styles.infoRow}>
              <View style={[styles.iconPill, { backgroundColor: '#10B98118' }]}>
                <Ionicons name="calendar" size={15} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>
                  DATE
                </ThemedText>
                <ThemedText style={[styles.infoValue, { color: theme.text }]}>
                  {params.dayLabel || 'Today'}
                </ThemedText>
              </View>
            </View>

            {/* Time Slots */}
            <View style={styles.infoRow}>
              <View style={[styles.iconPill, { backgroundColor: '#F59E0B18' }]}>
                <Ionicons name="time" size={15} color="#F59E0B" />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>
                  TIME SLOTS
                </ThemedText>
                <ThemedText style={[styles.infoValue, { color: theme.text }]}>
                  {slots.length > 0 ? slots.join(' · ') : '02:00 PM'}
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Dotted Separator */}
          <View style={[styles.dashedDivider, { borderColor: theme.outlineVariant + '44' }]} />

          {/* Price Summary */}
          <View style={styles.priceRow}>
            <View>
              <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>
                ADVANCE PAID
              </ThemedText>
              <ThemedText style={[styles.paidAmount, { color: '#10b981' }]}>
                ₹{params.advancePaid || '0.00'}
              </ThemedText>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>
                TOTAL BOOKING DUE
              </ThemedText>
              <ThemedText style={[styles.totalAmount, { color: theme.text }]}>
                ₹{params.total || '0.00'}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Helpful Venue Notice Card */}
        <View style={[styles.noticeCard, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33' }]}>
          <Ionicons name="information-circle" size={18} color={theme.primary} style={{ marginTop: 1 }} />
          <ThemedText style={[styles.noticeText, { color: theme.textSecondary }]}>
            A confirmation SMS & email have been sent to your registered contact. Please show this booking reference at the venue desk upon arrival.
          </ThemedText>
        </View>
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={[styles.bottomBar, { backgroundColor: theme.surfaceLowest, borderTopColor: theme.outlineVariant + '33' }, Shadows.level2]}>
        <Pressable
          onPress={() => router.replace('/(tabs)/explore')}
          style={[styles.outlineBtn, { borderColor: theme.outlineVariant + '88' }]}
        >
          <Ionicons name="search-outline" size={16} color={theme.text} />
          <ThemedText style={[styles.outlineBtnText, { color: theme.text }]}>
            Browse More
          </ThemedText>
        </Pressable>

        <Pressable
          onPress={() => router.replace('/(tabs)')}
          style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
        >
          <Ionicons name="home" size={16} color="#ffffff" />
          <ThemedText style={styles.primaryBtnText}>
            Go Home
          </ThemedText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.containerMargin,
    paddingTop: 24,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  outerRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  middleRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(16, 185, 129, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 22,
    fontFamily: 'Sora_600SemiBold',
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 12.5,
    fontFamily: 'Sora_500Medium',
    marginTop: 4,
    textAlign: 'center',
  },
  cashbackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: 16,
  },
  cashbackIconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cashbackTitle: {
    fontSize: 13,
    fontFamily: 'Sora_600SemiBold',
    color: '#059669',
  },
  cashbackSub: {
    fontSize: 11,
    fontFamily: 'Sora_400Regular',
    color: '#047857',
    marginTop: 1,
  },
  ticketCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  refRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  refLabel: {
    fontSize: 9.5,
    fontFamily: 'Sora_600SemiBold',
    letterSpacing: 0.5,
  },
  refValue: {
    fontSize: 17,
    fontFamily: 'Sora_600SemiBold',
    letterSpacing: 1,
    marginTop: 2,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  copyBtnText: {
    fontSize: 11,
    fontFamily: 'Sora_600SemiBold',
  },
  dashedDivider: {
    height: 1,
    borderWidth: 0.8,
    borderStyle: 'dashed',
    marginVertical: 14,
  },
  infoList: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconPill: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: 9,
    fontFamily: 'Sora_600SemiBold',
    letterSpacing: 0.4,
  },
  infoValue: {
    fontSize: 12.5,
    fontFamily: 'Sora_600SemiBold',
    marginTop: 1,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  paidAmount: {
    fontSize: 19,
    fontFamily: 'Sora_600SemiBold',
    marginTop: 2,
  },
  totalAmount: {
    fontSize: 17,
    fontFamily: 'Sora_600SemiBold',
    marginTop: 2,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  noticeText: {
    fontSize: 11,
    fontFamily: 'Sora_400Regular',
    lineHeight: 16,
    flex: 1,
  },
  bottomBar: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: Spacing.containerMargin,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  outlineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
  },
  outlineBtnText: {
    fontSize: 13,
    fontFamily: 'Sora_600SemiBold',
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: BorderRadius.xl,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Sora_600SemiBold',
  },
});
