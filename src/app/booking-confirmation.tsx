import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  const params = useLocalSearchParams<{
    bookingRef: string;
    venueName: string;
    dayLabel: string;
    slots: string;
    total: string;
    advancePaid: string;
  }>();

  const slots = params.slots ? params.slots.split(',') : [];

  return (
    <GradientContainer screenName="booking-confirmation" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Success Icon */}
          <Reanimated.View entering={ZoomIn.delay(100).duration(600)} style={styles.iconWrapper}>
            <View style={[styles.successRing, { borderColor: '#10b98133' }]}>
              <View style={[styles.successCircle, { backgroundColor: '#10b981' }, Shadows.fab]}>
                <Ionicons name="checkmark" size={40} color="#ffffff" />
              </View>
            </View>
          </Reanimated.View>

          {/* Heading */}
          <Reanimated.View entering={FadeInDown.delay(200).duration(500)} style={{ alignItems: 'center', marginBottom: Spacing.xl }}>
            <ThemedText style={styles.heading}>Booking Confirmed!</ThemedText>
            <ThemedText style={[styles.subheading, { color: theme.textSecondary }]}>
              Your slot has been successfully reserved
            </ThemedText>
          </Reanimated.View>

          {/* Booking Card */}
          <Reanimated.View 
            entering={FadeInDown.delay(300).duration(500)}
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
              <View style={[styles.infoIcon, { backgroundColor: '#10b981' + '15' }]}>
                <Ionicons name="calendar" size={14} color="#10b981" />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>Date</ThemedText>
                <ThemedText style={[styles.infoValue, { color: theme.text }]}>{params.dayLabel}</ThemedText>
              </View>
            </View>

            {/* Slots */}
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: '#f59e0b' + '15' }]}>
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
                <ThemedText style={[styles.infoValue, { color: theme.text }]}>₹{params.total}</ThemedText>
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

          {/* Actions */}
          <Reanimated.View entering={FadeInDown.delay(500).duration(500)} style={styles.actionsRow}>
            <Pressable
              style={[styles.secondaryBtn, { borderColor: theme.outlineVariant, backgroundColor: theme.surfaceLowest }]}
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
          </Reanimated.View>
        </ScrollView>
      </SafeAreaView>
    </GradientContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: {
    padding: Spacing.containerMargin,
    paddingTop: Spacing.xl,
    paddingBottom: 48,
    alignItems: 'center',
  },
  iconWrapper: {
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  successRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 26,
    marginBottom: 8,
    textAlign: 'center',
  },
  subheading: {
    fontFamily: 'HankenGrotesk_400Regular',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  bookingCard: {
    width: '100%',
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
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
    marginBottom: Spacing.md,
  },
  refText: {
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 13,
    letterSpacing: 1.2,
  },
  divider: { height: 1, marginVertical: Spacing.md },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    fontFamily: 'HankenGrotesk_400Regular',
    fontSize: 10,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontFamily: 'HankenGrotesk_600SemiBold',
    fontSize: 13,
    lineHeight: 18,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  amountBig: {
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 22,
    marginTop: 2,
  },
  noteCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  noteText: {
    flex: 1,
    fontFamily: 'HankenGrotesk_400Regular',
    fontSize: 12,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    width: '100%',
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 50,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontFamily: 'HankenGrotesk_600SemiBold',
    fontSize: 13,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 50,
    borderRadius: BorderRadius.xl,
  },
  primaryBtnText: {
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 13,
    color: '#ffffff',
  },
});
