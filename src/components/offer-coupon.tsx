import React from 'react';
import { StyleSheet, View, Pressable, Linking, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { BorderRadius, Spacing } from '@/constants/theme';
import { OwnerOffer, formatDiscount } from '@/store/offer-store';

/**
 * offer-coupon.tsx
 *
 * The perforated coupon card and the map/directions card from the turf detail
 * screen, extracted so tournament registration can show the same two things
 * without a second copy of ~200 lines of markup and 28 styles.
 */

export function OfferCoupon({
  offer,
  brand,
  applied = false,
  onApply,
}: {
  offer: OwnerOffer;
  /** True once this code is applied — the button turns green with a tick. */
  applied?: boolean;
  /** Shown on the coupon's brand block, e.g. the venue or "TURF PASS". */
  brand: string;
  onApply: (code: string) => void;
}) {
  const discountText = formatDiscount(offer);

  return (
    <View style={styles.kakaoCouponCard}>
      <View style={styles.kakaoTeethRow}>
        {Array.from({ length: 18 }).map((_, i) => (
          <View key={i} style={styles.kakaoTooth} />
        ))}
      </View>

      <View style={styles.kakaoPinkBody}>
        {offer.bannerImage ? (
          <>
            <Image source={{ uri: offer.bannerImage }} style={StyleSheet.absoluteFill} contentFit="cover" />
            <LinearGradient
              colors={['rgba(255, 30, 112, 0.84)', 'rgba(219, 10, 85, 0.95)']}
              style={StyleSheet.absoluteFill}
            />
          </>
        ) : null}

        <ThemedText style={styles.kakaoWatermark}>SALE</ThemedText>

        <View style={styles.kakaoHeaderRow}>
          <View style={styles.kakaoBrandBlock}>
            <ThemedText style={styles.kakaoBrandTitle} numberOfLines={1}>{brand}</ThemedText>
            <ThemedText style={styles.kakaoBrandSub}>STYLE</ThemedText>
            <ThemedText style={styles.kakaoBrandCoupon}>X COUPON</ThemedText>
            <View style={styles.kakaoBrandLine} />
          </View>

          <Pressable
            onPress={() => onApply(offer.code)}
            accessibilityRole="button"
            accessibilityLabel={`Claim coupon ${offer.code}`}
            style={styles.kakaoYellowBadge}
          >
            <ThemedText style={styles.kakaoYellowBadgeText}>COUPON</ThemedText>
            <ThemedText style={styles.kakaoYellowBadgeText}>CLAIM</ThemedText>
            <Ionicons name="arrow-down" size={13} color="#000000" style={{ marginTop: 1 }} />
          </Pressable>
        </View>

        <View style={styles.kakaoDiscountCenter}>
          <ThemedText style={styles.kakaoBigDiscount}>{discountText.replace(' OFF', '')}</ThemedText>
          <ThemedText style={styles.kakaoBigOff}>OFF</ThemedText>
        </View>
      </View>

      <View style={styles.kakaoWhiteStub}>
        <ThemedText style={styles.kakaoStubLabel}>VALIDITY PERIOD</ThemedText>
        <ThemedText style={styles.kakaoStubDays}>
          Valid Offer · {offer.maxRedemptions > 0 ? `Limited to 1st ${offer.maxRedemptions} Users` : 'Open for All Users'}
        </ThemedText>

        <View style={styles.kakaoStubFooter}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <ThemedText style={styles.kakaoStubCode}>
              Code: <ThemedText style={{ fontFamily: 'Sora_500Medium', color: '#FF1E70' }}>{offer.code}</ThemedText>
              {offer.minBooking > 0 ? ` · Min ₹${offer.minBooking}` : ''}
            </ThemedText>
            <ThemedText style={styles.kakaoStubDesc} numberOfLines={1}>
              {offer.description || 'Claim this voucher discount during booking checkout.'}
            </ThemedText>
          </View>

          <Pressable
            onPress={() => onApply(offer.code)}
            disabled={applied}
            accessibilityRole="button"
            accessibilityState={{ selected: applied, disabled: applied }}
            accessibilityLabel={applied ? `Coupon ${offer.code} applied` : `Apply coupon ${offer.code}`}
            style={[styles.kakaoApplyBtn, applied && styles.kakaoAppliedBtn]}
          >
            {applied && <Ionicons name="checkmark-circle" size={13} color="#ffffff" />}
            <ThemedText style={styles.kakaoApplyBtnText}>{applied ? 'Applied' : 'Apply →'}</ThemedText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const MAP_PREVIEW =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAs7ZFxpDuTY0Y20RzzsmBGxAjht8U5AihgJyskprBmTPKVYrEOab08NWaF-4BFy3UjwPr46PMa9oRy0TqoklyqETyaI3T9xbHvBGj0vyYb99qgZn6w5StHhG9_NAMWkvZiyjhoW9QJ4TVDCuUjWD2x6xrp0HlAaAIVRu2xmLKg6V1CrRxUQiNFhiU_n_PBx9V6T9ZF5x3yGwizSIx_I4x5fTWBozUqBJ77o8N5RyeuxUvrf6uWewzXD86IF4X_G5brMzCocIakM-w';

/** Map preview, address and a Google Maps hand-off. */
export function LocationCard({ name, location }: { name: string; location: string }) {
  const theme = useTheme();

  const openMaps = () => {
    const query = encodeURIComponent([name, location].filter(Boolean).join(', '));
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`).catch(() => {
      Alert.alert('Maps Error', 'Could not open Google Maps.');
    });
  };

  const primary = location.split(',')[0];
  const rest = location.split(',').slice(1).join(',').trim();

  return (
    <View>
      <Pressable onPress={openMaps} style={styles.mapContainer} accessibilityRole="button" accessibilityLabel={`Open ${name} in maps`}>
        <Image source={{ uri: MAP_PREVIEW }} style={styles.mapImage} contentFit="cover" />
        <View style={styles.mapMarkerContainer}>
          <View style={[styles.mapMarker, { backgroundColor: theme.primaryContainer }]}>
            <Ionicons name="location" size={20} color="#ffffff" />
          </View>
        </View>
      </Pressable>

      <View style={{ marginTop: 10 }}>
        <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_500Medium' }}>{primary}</ThemedText>
        <ThemedText type="bodySm" style={{ color: theme.textSecondary, marginTop: 2 }}>
          {rest || location}
        </ThemedText>
      </View>

      <Pressable onPress={openMaps} style={styles.directionsLink} accessibilityRole="button">
        <ThemedText type="labelMd" style={{ color: theme.secondary, fontWeight: '500' }}>
          Get Directions
        </ThemedText>
        <Ionicons name="arrow-forward" size={14} color={theme.secondary} style={{ marginLeft: 4 }} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  kakaoCouponCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#FF1E70',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
    marginVertical: 8,
  },
  kakaoTeethRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FF1E70',
    height: 8,
    overflow: 'hidden',
  },
  kakaoTooth: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#f1f5f9',
  },
  kakaoPinkBody: {
    backgroundColor: '#FF1E70',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 22,
    position: 'relative',
    overflow: 'hidden',
  },
  kakaoWatermark: {
    position: 'absolute',
    right: -10,
    bottom: -15,
    fontSize: 88,
    fontFamily: 'Sora_500Medium',
    color: 'rgba(255, 255, 255, 0.13)',
    letterSpacing: 2,
    transform: [{ rotate: '-12deg' }],
  },
  kakaoHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 2,
  },
  kakaoBrandBlock: {
    alignItems: 'flex-start',
    maxWidth: '65%',
  },
  kakaoBrandTitle: {
    fontSize: 12.5,
    fontFamily: 'Sora_500Medium',
    color: '#18181b',
    letterSpacing: 0.5,
  },
  kakaoBrandSub: {
    fontSize: 11,
    fontFamily: 'Sora_500Medium',
    color: '#18181b',
    lineHeight: 13,
  },
  kakaoBrandCoupon: {
    fontSize: 10,
    fontFamily: 'Sora_500Medium',
    color: '#18181b',
    lineHeight: 12,
  },
  kakaoBrandLine: {
    width: 42,
    height: 2.5,
    backgroundColor: '#18181b',
    marginTop: 3,
  },
  kakaoYellowBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFDE00',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  kakaoYellowBadgeText: {
    fontSize: 8.5,
    fontFamily: 'Sora_500Medium',
    color: '#18181b',
    lineHeight: 10.5,
    textAlign: 'center',
  },
  kakaoDiscountCenter: {
    marginTop: 12,
    zIndex: 2,
  },
  kakaoBigDiscount: {
    fontSize: 36,
    fontFamily: 'Sora_500Medium',
    color: '#ffffff',
    lineHeight: 48,
    letterSpacing: -1,
  },
  kakaoBigOff: {
    fontSize: 32,
    fontFamily: 'Sora_500Medium',
    color: '#ffffff',
    lineHeight: 40,
    letterSpacing: 0.5,
  },
  kakaoWhiteStub: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1.5,
    borderTopColor: '#f1f5f9',
    borderStyle: 'dashed',
  },
  kakaoStubLabel: {
    fontSize: 9.5,
    fontFamily: 'Sora_500Medium',
    color: '#FF1E70',
    letterSpacing: 0.4,
  },
  kakaoStubDays: {
    fontSize: 12,
    fontFamily: 'Sora_500Medium',
    color: '#0f172a',
    marginTop: 2,
  },
  kakaoStubFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  kakaoStubCode: {
    fontSize: 10.5,
    fontFamily: 'Sora_500Medium',
    color: '#334155',
  },
  kakaoStubDesc: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 2,
    maxWidth: 210,
  },
  kakaoApplyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FF1E70',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  kakaoAppliedBtn: { backgroundColor: '#16A34A' },
  kakaoApplyBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontFamily: 'Sora_500Medium',
  },
  mapContainer: {
    height: 160,
    borderRadius: 12,
    backgroundColor: '#eceef0',
    overflow: 'hidden',
    position: 'relative',
  },
  mapImage: {
    width: '100%',
    height: '100%',
    opacity: 0.5,
  },
  mapMarker: {
    padding: 8,
    borderRadius: BorderRadius.full,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  mapMarkerContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  directionsLink: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
});
