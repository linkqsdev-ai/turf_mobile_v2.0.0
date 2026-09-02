import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Reanimated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useOfferStore, useClassStore } from '@/store/app-store';
import { getOffersForTurf, formatDiscount, isRedeemable, OwnerOffer } from '@/store/offer-store';

export default function EnrollScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const theme = useTheme();
  const { offers } = useOfferStore();
  const { enrollInClass } = useClassStore();

  const title = (params.title as string) || 'Summer Camp Enrollment';
  const priceRaw = (params.price as string) || '4999';
  const dates = (params.dates as string) || 'Summer 2026';
  const location = (params.location as string) || 'TBD';
  const classId = (params.classId as string) || '';
  const image =
    (params.image as string) || require('@/assets/images/illustrations/coaching_class_premium.png');

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [skillLevel, setSkillLevel] = useState('Beginner');

  // Promo code / voucher state
  const [promoInput, setPromoInput] = useState('');
  const [appliedOffer, setAppliedOffer] = useState<OwnerOffer | null>(null);
  const [promoError, setPromoError] = useState('');

  const basePrice = parseInt(String(priceRaw).replace(/[^0-9]/g, ''), 10) || 0;
  const serviceFee = 150;

  // Calculate discount
  const discountAmount = useMemo(() => {
    if (!appliedOffer) return 0;
    if (appliedOffer.discountType === 'percent') {
      return Math.round((basePrice * appliedOffer.discountValue) / 100);
    }
    return Math.min(basePrice, appliedOffer.discountValue);
  }, [appliedOffer, basePrice]);

  const total = Math.max(0, basePrice + serviceFee - discountAmount);

  // Filter available vouchers for this class
  const classOffers = useMemo(() => {
    const matched = getOffersForTurf(title, offers);
    if (matched.length > 0) return matched;
    return offers.filter(o => isRedeemable(o));
  }, [title, offers]);

  const handleApplyPromo = (codeToApply?: string) => {
    const code = (codeToApply || promoInput).trim().toUpperCase();
    if (!code) {
      setPromoError('Please enter a voucher code.');
      return;
    }

    const found = offers.find(o => o.code.toUpperCase() === code && isRedeemable(o));
    if (!found) {
      setPromoError('Invalid or expired promo code.');
      setAppliedOffer(null);
      return;
    }

    if (found.minBooking > 0 && basePrice < found.minBooking) {
      setPromoError(`Minimum fee of ₹${found.minBooking} required for this code.`);
      setAppliedOffer(null);
      return;
    }

    setAppliedOffer(found);
    setPromoInput(found.code);
    setPromoError('');
  };

  const handleRemovePromo = () => {
    setAppliedOffer(null);
    setPromoInput('');
    setPromoError('');
  };

  const handleEnroll = () => {
    if (!name.trim() || !age.trim() || !phone.trim()) {
      Alert.alert('Missing fields', 'Please fill out all participant details before enrolling.');
      return;
    }

    if (classId) {
      enrollInClass({
        classId,
        className: title,
        studentName: name.trim(),
        studentAge: age.trim(),
        contactNumber: phone.trim(),
        amountPaid: total,
        appliedCode: appliedOffer?.code,
      });
    }

    Alert.alert(
      'Enrollment Confirmed! 🎉',
      `You have successfully enrolled ${name} in ${title}.\nTotal paid: ₹${total}${appliedOffer ? ` (Saved ₹${discountAmount} with code ${appliedOffer.code})` : ''}`,
      [
        {
          text: 'Back to Home',
          onPress: () => {
            router.dismissAll();
            router.replace('/(tabs)');
          },
        },
      ],
    );
  };

  const imageSource =
    typeof image === 'string' && /^\d+$/.test(image)
      ? parseInt(image, 10)
      : typeof image === 'string'
        ? { uri: image }
        : image;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      {/* App Header */}
      <View style={[styles.header, { borderBottomColor: theme.outlineVariant + '25' }]}>
        <Pressable
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)');
            }
          }}
          style={[styles.backBtn, { backgroundColor: theme.surfaceLow }]}
          hitSlop={8}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={20} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>
          Registration
        </ThemedText>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero Class Banner Card */}
        <Reanimated.View
          entering={FadeInDown.duration(350)}
          style={[styles.heroCard, Shadows.level2]}
        >
          <Image source={imageSource} style={StyleSheet.absoluteFill} contentFit="cover" />
          <LinearGradient
            colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.8)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroContent}>
            <ThemedText style={styles.heroTitle} numberOfLines={2}>
              {title}
            </ThemedText>
            <View style={styles.heroMetaRow}>
              <View style={styles.heroMetaBadge}>
                <Ionicons name="calendar-outline" size={12} color="#ffffff" style={{ marginRight: 4 }} />
                <ThemedText style={styles.heroMetaText}>{dates}</ThemedText>
              </View>
              <View style={styles.heroMetaBadge}>
                <Ionicons name="location-outline" size={12} color="#ffffff" style={{ marginRight: 4 }} />
                <ThemedText style={styles.heroMetaText} numberOfLines={1}>{location}</ThemedText>
              </View>
            </View>
          </View>
        </Reanimated.View>

        {/* Section 1: Participant Details */}
        <Reanimated.View entering={FadeInDown.delay(60).duration(350)} style={styles.section}>
          <ThemedText style={styles.sectionHeader}>
            PARTICIPANT DETAILS
          </ThemedText>

          <View style={[styles.card, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Full name</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '40', color: theme.text }]}
                placeholder="e.g. Rahul Sharma"
                placeholderTextColor={theme.placeholder}
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Age & Phone Row */}
            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { width: 90 }]}>
                <ThemedText style={styles.inputLabel}>Age</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '40', color: theme.text }]}
                  placeholder="14"
                  placeholderTextColor={theme.placeholder}
                  keyboardType="numeric"
                  value={age}
                  onChangeText={v => setAge(v.replace(/[^0-9]/g, ''))}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <ThemedText style={styles.inputLabel}>Contact phone</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '40', color: theme.text }]}
                  placeholder="+91 98765 43210"
                  placeholderTextColor={theme.placeholder}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={v => setPhone(v.replace(/[^0-9+\s\-()]/g, ''))}
                />
              </View>
            </View>

            {/* Skill Level Selection */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Skill level</ThemedText>
              <View style={styles.skillRow}>
                {['Beginner', 'Intermediate', 'Advanced'].map(lvl => {
                  const isSelected = skillLevel === lvl;
                  return (
                    <Pressable
                      key={lvl}
                      onPress={() => setSkillLevel(lvl)}
                      style={[
                        styles.skillChip,
                        isSelected
                          ? { backgroundColor: theme.primary, borderColor: theme.primary }
                          : { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '40' },
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.skillChipText,
                          { color: isSelected ? '#ffffff' : theme.textSecondary, fontFamily: isSelected ? 'Sora_600SemiBold' : 'Sora_500Medium' },
                        ]}
                      >
                        {lvl}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        </Reanimated.View>

        {/* Section 2: Promotions & Vouchers */}
        <Reanimated.View entering={FadeInDown.delay(120).duration(350)} style={styles.section}>
          <ThemedText style={styles.sectionHeader}>
            PROMOTIONS & VOUCHERS
          </ThemedText>

          <View style={[styles.card, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
            {/* Promo Input Row */}
            <View style={styles.promoInputRow}>
              <View style={[styles.promoInputContainer, { backgroundColor: theme.surfaceLow, borderColor: promoError ? theme.error : theme.outlineVariant + '40' }]}>
                <Ionicons name="pricetag-outline" size={16} color={theme.primary} style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.promoInput, { color: theme.text }]}
                  placeholder="Enter promo code"
                  placeholderTextColor={theme.placeholder}
                  autoCapitalize="characters"
                  value={promoInput}
                  onChangeText={v => {
                    setPromoInput(v);
                    if (promoError) setPromoError('');
                  }}
                />
                {appliedOffer && (
                  <Pressable onPress={handleRemovePromo} hitSlop={8}>
                    <Ionicons name="close-circle" size={18} color="#ef4444" />
                  </Pressable>
                )}
              </View>

              <Pressable
                onPress={() => handleApplyPromo()}
                disabled={!!appliedOffer}
                style={[
                  styles.promoApplyBtn,
                  { backgroundColor: appliedOffer ? theme.outlineVariant + '60' : theme.primary },
                ]}
              >
                <ThemedText style={styles.promoApplyBtnText}>
                  {appliedOffer ? 'Applied' : 'Apply'}
                </ThemedText>
              </Pressable>
            </View>

            {/* Promo Error */}
            {!!promoError && (
              <ThemedText style={styles.promoErrorText}>
                {promoError}
              </ThemedText>
            )}

            {/* Applied Offer Banner */}
            {appliedOffer && (
              <View style={[styles.appliedBanner, { backgroundColor: theme.primary + '12', borderColor: theme.primary + '33' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                  <Ionicons name="checkmark-circle" size={16} color={theme.primary} />
                  <ThemedText style={[styles.appliedBannerCode, { color: theme.primary }]} numberOfLines={1}>
                    {appliedOffer.code} applied ({formatDiscount(appliedOffer)})
                  </ThemedText>
                </View>
                <ThemedText style={[styles.appliedBannerDiscount, { color: theme.primary }]}>
                  -₹{discountAmount}
                </ThemedText>
              </View>
            )}

            {/* Available Offers Horizontal Scroll */}
            {classOffers.length > 0 && !appliedOffer && (
              <View style={{ marginTop: 12 }}>
                <ThemedText style={styles.availableOffersLabel}>
                  AVAILABLE OFFERS
                </ThemedText>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingTop: 6 }}
                >
                  {classOffers.map(o => (
                    <Pressable
                      key={o.id}
                      onPress={() => handleApplyPromo(o.code)}
                      style={[styles.offerPill, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '40' }]}
                    >
                      <View style={[styles.offerDiscountTag, { backgroundColor: theme.primary + '18' }]}>
                        <ThemedText style={[styles.offerDiscountText, { color: theme.primary }]}>
                          {formatDiscount(o)}
                        </ThemedText>
                      </View>
                      <ThemedText style={[styles.offerCodeText, { color: theme.text }]}>
                        {o.code}
                      </ThemedText>
                      <Ionicons name="arrow-forward-circle-outline" size={14} color={theme.primary} />
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </Reanimated.View>

        {/* Section 3: Payment Summary */}
        <Reanimated.View entering={FadeInDown.delay(180).duration(350)} style={styles.section}>
          <ThemedText style={styles.sectionHeader}>
            PAYMENT SUMMARY
          </ThemedText>

          <View style={[styles.card, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
            <View style={styles.summaryRow}>
              <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                Enrollment fee
              </ThemedText>
              <ThemedText style={[styles.summaryValue, { color: theme.text }]}>
                ₹{basePrice}
              </ThemedText>
            </View>

            <View style={styles.summaryRow}>
              <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                Taxes & service fee
              </ThemedText>
              <ThemedText style={[styles.summaryValue, { color: theme.text }]}>
                ₹{serviceFee}
              </ThemedText>
            </View>

            {discountAmount > 0 && (
              <View style={styles.summaryRow}>
                <ThemedText style={[styles.summaryLabel, { color: '#10b981' }]} numberOfLines={1}>
                  Voucher discount ({appliedOffer?.code})
                </ThemedText>
                <ThemedText style={[styles.summaryValue, { color: '#10b981' }]}>
                  -₹{discountAmount}
                </ThemedText>
              </View>
            )}

            <View style={[styles.divider, { backgroundColor: theme.outlineVariant + '25' }]} />

            <View style={styles.summaryRow}>
              <ThemedText style={[styles.summaryTotalLabel, { color: theme.text }]}>
                Total due
              </ThemedText>
              <ThemedText style={[styles.summaryTotalValue, { color: theme.primary }]}>
                ₹{total}
              </ThemedText>
            </View>
          </View>
        </Reanimated.View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={[styles.footer, { backgroundColor: theme.surfaceLowest, borderTopColor: theme.outlineVariant + '25' }, Shadows.level2]}>
        <View style={{ flex: 1 }}>
          <ThemedText style={[styles.footerSubtext, { color: theme.textSecondary }]}>
            Total incl. taxes
          </ThemedText>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
            <ThemedText style={[styles.footerPrice, { color: theme.text }]}>
              ₹{total}
            </ThemedText>
            {discountAmount > 0 && (
              <ThemedText style={[styles.footerStrikethrough, { color: theme.textSecondary }]}>
                ₹{basePrice + serviceFee}
              </ThemedText>
            )}
          </View>
        </View>

        <Pressable
          onPress={handleEnroll}
          style={[styles.payBtn, { backgroundColor: theme.primary }]}
          accessibilityRole="button"
          accessibilityLabel={`Pay ₹${total} and enrol`}
        >
          <Ionicons name="card-outline" size={17} color="#ffffff" style={{ marginRight: 6 }} />
          <ThemedText style={styles.payBtnText}>
            Pay & enrol
          </ThemedText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 16,
    letterSpacing: -0.2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  heroCard: {
    height: 170,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end',
  },
  heroContent: {
    padding: 16,
  },
  heroTitle: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 18,
    lineHeight: 23,
    color: '#ffffff',
  },
  heroMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  heroMetaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 999,
  },
  heroMetaText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11,
    color: '#ffffff',
  },
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 11.5,
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 2,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inputLabel: {
    fontFamily: 'Sora_500Medium',
    fontSize: 12,
    marginBottom: 6,
  },
  input: {
    height: 42,
    borderRadius: 11,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontFamily: 'Sora_400Regular',
    fontSize: 13,
    ...({ outlineStyle: 'none' } as any),
  },
  skillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  skillChip: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skillChipText: {
    fontSize: 11.5,
  },
  promoInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  promoInputContainer: {
    flex: 1,
    height: 42,
    borderRadius: 11,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  promoInput: {
    flex: 1,
    height: '100%',
    fontFamily: 'Sora_500Medium',
    fontSize: 13,
    ...({ outlineStyle: 'none' } as any),
  },
  promoApplyBtn: {
    height: 42,
    paddingHorizontal: 18,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoApplyBtnText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 12.5,
    color: '#ffffff',
  },
  promoErrorText: {
    color: '#ef4444',
    fontFamily: 'Sora_400Regular',
    fontSize: 11,
    marginTop: 6,
  },
  appliedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 10,
  },
  appliedBannerCode: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 11.5,
  },
  appliedBannerDiscount: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 12,
  },
  availableOffersLabel: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 10,
    color: '#64748b',
    letterSpacing: 0.6,
  },
  offerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  offerDiscountTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  offerDiscountText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 10,
  },
  offerCodeText: {
    fontFamily: 'Sora_500Medium',
    fontSize: 11.5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12.5,
  },
  summaryValue: {
    fontFamily: 'Sora_500Medium',
    fontSize: 13,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  summaryTotalLabel: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 14,
  },
  summaryTotalValue: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 16,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  footerSubtext: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11,
  },
  footerPrice: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 20,
    letterSpacing: -0.3,
  },
  footerStrikethrough: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: 22,
    borderRadius: 999,
    ...Shadows.level1,
  },
  payBtnText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 13.5,
    color: '#ffffff',
  },
});
