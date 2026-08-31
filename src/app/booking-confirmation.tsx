import React from 'react';
import { View, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Reanimated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { GradientContainer } from '@/components/gradient-container';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function BookingConfirmationScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  return (
    <GradientContainer screenName="booking-confirmation" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Success Icon */}
          <Reanimated.View entering={ZoomIn.delay(100).duration(600)} style={styles.iconWrapper}>
            <View style={[styles.successRing, { borderColor: '#10b98133' }]}>
              <View style={[styles.successCircle, { backgroundColor: '#10b981' }, Shadows.fab]}>
                <Ionicons name="checkmark" size={32} color="#ffffff" />
              </View>
            </View>
          </Reanimated.View>

          {/* Heading */}
          <Reanimated.View entering={FadeInDown.delay(200).duration(500)} style={styles.headingContainer}>
            <ThemedText style={[styles.heading, { color: theme.text }]}>
              Booking Confirmed!
            </ThemedText>
            <ThemedText style={[styles.subheading, { color: theme.textSecondary }]}>
              Your slot has been successfully reserved
            </ThemedText>
          </Reanimated.View>

          {/* Cashback Earned Card */}
          {params.cashbackEarned ? (
            <Reanimated.View 
              entering={ZoomIn.delay(300).duration(500)}
              style={[styles.cashbackCard, { backgroundColor: '#10b98115', borderColor: '#10b98133' }]}
            >
              <View style={[styles.cashbackIconBox, { backgroundColor: '#10b98125' }]}>
                <Ionicons name="gift" size={20} color="#10b981" />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.cashbackTitle}>
                  ₹{params.cashbackEarned} Cashback Received!
                </ThemedText>
                <ThemedText style={[styles.cashbackDesc, { color: theme.textSecondary }]}>
                  Successfully added to your wallet for future sessions.
                </ThemedText>
              </View>
            </Reanimated.View>
          ) : null}

          {/* Booking Card */}
          <Reanimated.View 
            entering={FadeInDown.delay(350).duration(500)}
            style={[styles.bookingCard, { backgroundColor: theme.surfaceLowest }, Shadows.level2]}
          >
            {/* Booking Ref */}
            <View style={[styles.refBadge, { backgroundColor: theme.primary + '15' }]}>
              <Ionicons name="qr-code-outline" size={14} color={theme.primary} />
              <ThemedText style={[styles.refText, { color: theme.primary }]}>
                {params.bookingRef}
              </ThemedText>
            </View>

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: theme.outlineVariant + '33' }]} />

            {/* Venue */}
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: theme.primary + '15' }]}>
                <Ionicons name="location" size={14} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>Venue</ThemedText>
                <ThemedText style={[styles.infoValue, { color: theme.text }]}>{params.venueName}</ThemedText>
              </View>
            </View>

            {/* Date */}
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: '#10b98115' }]}>
                <Ionicons name="calendar" size={14} color="#10b981" />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>Date</ThemedText>
                <ThemedText style={[styles.infoValue, { color: theme.text }]}>{params.dayLabel}</ThemedText>
              </View>
            </View>

            {/* Slots */}
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: '#f59e0b15' }]}>
                <Ionicons name="time" size={14} color="#f59e0b" />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>Time Slots</ThemedText>
                <ThemedText style={[styles.infoValue, { color: theme.text }]}>
                  {slots.join(' • ')}
                </ThemedText>
              </View>
            </View>

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: theme.outlineVariant + '33' }]} />

            {/* Amount Row */}
            <View style={styles.amountRow}>
              <View>
                <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>Amount Paid</ThemedText>
                <ThemedText style={[styles.amountBig, { color: '#10b981' }]}>₹{params.advancePaid}</ThemedText>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>Total</ThemedText>
                <ThemedText style={[styles.amountTotal, { color: theme.text }]}>₹{params.total}</ThemedText>
              </View>
            </View>
          </Reanimated.View>

          {/* Info note */}
          <Reanimated.View 
            entering={FadeInDown.delay(400).duration(500)}
            style={[styles.noteCard, { backgroundColor: theme.primary + '0d', borderColor: theme.primary + '22' }]}
          >
            <Ionicons name="information-circle" size={18} color={theme.primary} />
            <ThemedText style={[styles.noteText, { color: theme.textSecondary }]}>
              A confirmation has been sent to your registered contact. Show your booking reference at the venue.
            </ThemedText>
          </Reanimated.View>
        </ScrollView>

        {/* ── Fixed Bottom Actions Bar ── */}
        <View style={[
          styles.fixedBottomBar,
          { 
            backgroundColor: theme.surfaceLowest,
            borderTopColor: theme.outlineVariant + '33',
            paddingBottom: Math.max(insets.bottom, 12) + 4,
          },
          Shadows.level2
        ]}>
          <Pressable
            style={[styles.secondaryBtn, { borderColor: theme.outlineVariant, backgroundColor: theme.surfaceLow }]}
            onPress={() => router.replace('/(tabs)/explore')}
          >
            <Ionicons name="search-outline" size={16} color={theme.text} />
            <ThemedText style={[styles.secondaryBtnText, { color: theme.text }]}>Browse More</ThemedText>
          </Pressable>

          <Pressable
            style={[styles.primaryBtn, { backgroundColor: '#10b981' }, Shadows.fab]}
            onPress={() => router.replace('/(tabs)')}
          >
            <Ionicons name="home" size={16} color="#ffffff" />
            <ThemedText style={styles.primaryBtnText}>Go Home</ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </GradientContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.containerMargin,
    paddingTop: Spacing.md,
    alignItems: 'center',
  },
  iconWrapper: {
    marginTop: 6,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  successRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headingContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingHorizontal: 16,
  },
  heading: {
    fontFamily: 'Sora_700Bold',
    fontSize: 24,
    lineHeight: 32,
    paddingTop: 4,
    paddingBottom: 2,
    textAlign: 'center',
  },
  subheading: {
    fontFamily: 'Sora_500Medium',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 2,
  },
  cashbackCard: {
    width: '100%',
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: Spacing.md,
  },
  cashbackIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cashbackTitle: {
    fontSize: 13,
    fontFamily: 'Sora_700Bold',
    lineHeight: 18,
    color: '#10b981',
  },
  cashbackDesc: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 1,
  },
  bookingCard: {
    width: '100%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  refBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
  },
  refText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 12.5,
    lineHeight: 17,
    letterSpacing: 1.1,
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: 10,
  },
  infoIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    fontFamily: 'Sora_500Medium',
    fontSize: 10.5,
    lineHeight: 14,
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  infoValue: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 13,
    lineHeight: 18,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 2,
  },
  amountBig: {
    fontFamily: 'Sora_700Bold',
    fontSize: 20,
    lineHeight: 26,
    marginTop: 2,
  },
  amountTotal: {
    fontFamily: 'Sora_700Bold',
    fontSize: 14,
    lineHeight: 20,
  },
  noteCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: 12,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  noteText: {
    flex: 1,
    fontFamily: 'Sora_500Medium',
    fontSize: 11.5,
    lineHeight: 17,
  },
  fixedBottomBar: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: Spacing.containerMargin,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 46,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 13,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 46,
    borderRadius: BorderRadius.lg,
  },
  primaryBtnText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 13,
    color: '#ffffff',
  },
});

