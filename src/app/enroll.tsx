import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useOfferStore, useClassStore, useWalletStore } from '@/store/app-store';
import { getOffersForTurf, formatDiscount, isRedeemable, OwnerOffer } from '@/store/offer-store';

const PAYMENT_METHODS = [
  { id: 'gpay',   label: 'Google Pay',  icon: 'google',       family: 'FontAwesome5', color: '#EA4335' },
  { id: 'apple',  label: 'Apple Pay',   icon: 'logo-apple',   family: 'Ionicons',     color: '#000000' },
  { id: 'card',   label: 'Credit/Debit',icon: 'card',         family: 'Ionicons',     color: '#5D68E8' },
  { id: 'upi',    label: 'UPI / NetBanking', icon: 'flash',   family: 'Ionicons',     color: '#10B981' },
];

export default function EnrollScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const theme = useTheme();
  const { offers } = useOfferStore();
  const { enrollInClass } = useClassStore();
  const { walletBalance } = useWalletStore();

  const title = (params.title as string) || 'Featured Coaching Camp';
  const priceRaw = (params.price as string) || '2500';
  const dates = (params.dates as string) || 'Summer 2026';
  const location = (params.location as string) || 'Main Arena';
  const classId = (params.classId as string) || '';
  const image =
    (params.image as string) || require('@/assets/images/illustrations/coaching_class_premium.png');

  // Form states
  const [name, setName] = useState('');
  const [age, setAge] = useState('14');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [skillLevel, setSkillLevel] = useState('Beginner');

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState('gpay');
  const [useWallet, setUseWallet] = useState(false);

  // Promo code / voucher state
  const [promoInput, setPromoInput] = useState('');
  const [appliedOffer, setAppliedOffer] = useState<OwnerOffer | null>(null);
  const [promoError, setPromoError] = useState('');

  const basePrice = parseInt(String(priceRaw).replace(/[^0-9]/g, ''), 10) || 2500;
  const serviceFee = 150;

  // Calculate discount
  const discountAmount = useMemo(() => {
    if (!appliedOffer) return 0;
    if (appliedOffer.discountType === 'percent') {
      return Math.round((basePrice * appliedOffer.discountValue) / 100);
    }
    return Math.min(basePrice, appliedOffer.discountValue);
  }, [appliedOffer, basePrice]);

  const grossTotal = Math.max(0, basePrice + serviceFee - discountAmount);
  const walletDeduction = useWallet ? Math.min(walletBalance, grossTotal) : 0;
  const netPayable = Math.max(0, grossTotal - walletDeduction);

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
        amountPaid: netPayable,
        appliedCode: appliedOffer?.code,
      });
    }

    Alert.alert(
      'Enrollment Confirmed! 🎉',
      `You have successfully enrolled ${name} in ${title}.\nTotal paid: ₹${netPayable}${appliedOffer ? ` (Saved ₹${discountAmount} with code ${appliedOffer.code})` : ''}`,
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
      {/* ── Top Header ── */}
      <View style={[styles.header, { borderBottomColor: theme.outlineVariant + '25' }]}>
        <Pressable
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)');
            }
          }}
          style={[styles.backButton, { backgroundColor: theme.surfaceLow }]}
          hitSlop={8}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </Pressable>
        <ThemedText style={[styles.headerTitle, { color: theme.text }]}>
          Registration
        </ThemedText>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Hero Card ── */}
        <View style={styles.heroWrapper}>
          <View style={[styles.heroCard, { backgroundColor: theme.primaryContainer }, Shadows.level2]}>
            <Image source={imageSource} style={styles.heroImage} contentFit="cover" />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={StyleSheet.absoluteFill}
            />

            {/* Favorite / Bookmark badge top right */}
            <View style={styles.favFab}>
              <Ionicons name="heart" size={18} color="#ff4757" />
            </View>

            <View style={styles.heroOverlay}>
              <ThemedText style={styles.heroTitle} numberOfLines={2}>
                {title}
              </ThemedText>
              <View style={styles.heroSubRow}>
                <View style={styles.heroSubItem}>
                  <Ionicons name="calendar-outline" size={13} color="#ffffffcc" />
                  <ThemedText style={styles.heroSubText}>{dates}</ThemedText>
                </View>
                <View style={[styles.heroSubItem, { borderLeftWidth: 1, borderLeftColor: '#ffffff33', paddingLeft: 10, marginLeft: 10 }]}>
                  <Ionicons name="location-outline" size={13} color="#ffffffcc" />
                  <ThemedText style={styles.heroSubText} numberOfLines={1}>{location.split(',')[0]}</ThemedText>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ── Section 1: Participant Details ── */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>
            PARTICIPANT DETAILS
          </ThemedText>

          <View style={[styles.formCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.inputLabel, { color: theme.text }]}>Full name</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '40', color: theme.text }]}
                placeholder="e.g. Rahul Sharma"
                placeholderTextColor={theme.placeholder}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { width: 90 }]}>
                <ThemedText style={[styles.inputLabel, { color: theme.text }]}>Age</ThemedText>
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
                <ThemedText style={[styles.inputLabel, { color: theme.text }]}>Contact phone</ThemedText>
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

            <View style={styles.inputGroup}>
              <ThemedText style={[styles.inputLabel, { color: theme.text }]}>Skill level</ThemedText>
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
                          : { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33' },
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.skillChipText,
                          {
                            color: isSelected ? '#ffffff' : theme.textSecondary,
                            fontFamily: isSelected ? 'Sora_600SemiBold' : 'Sora_500Medium',
                          },
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
        </View>

        {/* ── Section 2: Payment Methods & Wallet ── */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>
            PAYMENT METHODS
          </ThemedText>

          {/* Wallet Balance Card */}
          <View style={[styles.walletCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <View style={[styles.walletIconWrap, { backgroundColor: theme.primary + '15' }]}>
                <Ionicons name="wallet-outline" size={20} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.walletTitle, { color: theme.text }]}>
                  Pay with Wallet Balance
                </ThemedText>
                <ThemedText style={[styles.walletSubtext, { color: theme.textSecondary }]}>
                  Available Balance: ₹{walletBalance.toFixed(2)}
                </ThemedText>
              </View>
            </View>

            <Pressable
              onPress={() => setUseWallet(!useWallet)}
              style={[
                styles.walletApplyBtn,
                { backgroundColor: useWallet ? theme.primary : theme.surfaceLow },
              ]}
            >
              <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: useWallet ? '#ffffff' : theme.textSecondary }}>
                {useWallet ? 'Applied' : 'Apply'}
              </ThemedText>
              <Ionicons
                name={useWallet ? 'checkmark-circle' : 'add-circle-outline'}
                size={14}
                color={useWallet ? '#ffffff' : theme.textSecondary}
              />
            </Pressable>
          </View>

          {/* Payment Method Selector Grid */}
          <View style={{ gap: 8 }}>
            {PAYMENT_METHODS.map(pm => {
              const isSelected = paymentMethod === pm.id;
              return (
                <Pressable
                  key={pm.id}
                  onPress={() => setPaymentMethod(pm.id)}
                  style={[
                    styles.pmRow,
                    {
                      backgroundColor: isSelected ? theme.primaryContainer : theme.surfaceLowest,
                      borderColor: isSelected ? theme.primary : theme.outlineVariant + '33',
                    },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {pm.id === 'gpay' ? (
                      <Image
                        source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/120px-Google_%22G%22_logo.svg.png' }}
                        style={{ width: 22, height: 22, marginHorizontal: 4 }}
                      />
                    ) : pm.family === 'Ionicons' ? (
                      <Ionicons
                        name={pm.icon as any}
                        size={22}
                        color={isSelected ? theme.primary : (pm.color === '#000000' ? theme.text : pm.color)}
                        style={{ width: 30, textAlign: 'center' }}
                      />
                    ) : (
                      <FontAwesome5
                        name={pm.icon as any}
                        size={20}
                        color={isSelected ? theme.primary : pm.color}
                        style={{ width: 30, textAlign: 'center' }}
                      />
                    )}
                    <ThemedText style={[styles.pmLabel, { color: theme.text }]}>
                      {pm.label}
                    </ThemedText>
                  </View>

                  <View
                    style={[
                      styles.pmRadio,
                      { borderColor: isSelected ? theme.primary : theme.outlineVariant + '66' },
                    ]}
                  >
                    {isSelected && <View style={[styles.pmRadioInner, { backgroundColor: theme.primary }]} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── Section 3: Booking Ticket & Breakdown ── */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>
            BOOKING CONFIRMATION & BREAKDOWN
          </ThemedText>

          <View style={[styles.ticketCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
            {/* Ticket Hero Banner */}
            <View style={styles.ticketHero}>
              <Image source={imageSource} style={styles.ticketHeroImage} contentFit="cover" />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.85)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.ticketHeroOverlay}>
                <ThemedText style={styles.ticketHeroTitle} numberOfLines={1}>
                  {title}
                </ThemedText>
                <ThemedText style={styles.ticketHeroSub}>
                  {dates} • {location.split(',')[0]}
                </ThemedText>
              </View>
            </View>

            {/* Perforated Dotted Line with Notches */}
            <View style={styles.ticketDottedLineContainer}>
              <View style={[styles.ticketNotchLeft, { backgroundColor: theme.background, borderColor: theme.outlineVariant + '33' }]} />
              <View style={[styles.ticketDottedLine, { borderColor: theme.outlineVariant + '66' }]} />
              <View style={[styles.ticketNotchRight, { backgroundColor: theme.background, borderColor: theme.outlineVariant + '33' }]} />
            </View>

            {/* Ticket Middle Section: Details Grid */}
            <View style={styles.ticketMiddleSection}>
              <View style={styles.ticketDetailsGrid}>
                <View style={styles.ticketGridRow}>
                  <View style={styles.ticketGridCol}>
                    <ThemedText style={styles.ticketGridLabel}>Student</ThemedText>
                    <ThemedText numberOfLines={1} style={[styles.ticketGridValue, { color: theme.text }]}>
                      {name || 'Participant'}
                    </ThemedText>
                  </View>
                  <View style={styles.ticketGridCol}>
                    <ThemedText style={styles.ticketGridLabel}>Level</ThemedText>
                    <ThemedText style={[styles.ticketGridValue, { color: theme.text }]}>
                      {skillLevel}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.ticketGridRow}>
                  <View style={styles.ticketGridCol}>
                    <ThemedText style={styles.ticketGridLabel}>Contact</ThemedText>
                    <ThemedText numberOfLines={1} style={[styles.ticketGridValue, { color: theme.text }]}>
                      {phone}
                    </ThemedText>
                  </View>
                  <View style={styles.ticketGridCol}>
                    <ThemedText style={styles.ticketGridLabel}>Pass ID</ThemedText>
                    <ThemedText numberOfLines={1} style={[styles.ticketGridValue, { color: theme.text }]}>
                      PASS-#{Math.floor(1000 + Math.random() * 9000)}
                    </ThemedText>
                  </View>
                </View>
              </View>
            </View>

            {/* Second Perforated Line */}
            <View style={styles.ticketDottedLineContainer}>
              <View style={[styles.ticketNotchLeft, { backgroundColor: theme.background, borderColor: theme.outlineVariant + '33' }]} />
              <View style={[styles.ticketDottedLine, { borderColor: theme.outlineVariant + '66' }]} />
              <View style={[styles.ticketNotchRight, { backgroundColor: theme.background, borderColor: theme.outlineVariant + '33' }]} />
            </View>

            {/* Ticket Bottom Section: Coupons & Pricing */}
            <View style={styles.ticketBottomSection}>
              {/* Coupon / Voucher Section */}
              <View style={[styles.couponSection, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Ionicons name="pricetag" size={13} color={theme.primary} />
                  <ThemedText style={[styles.couponTitle, { color: theme.text }]}>
                    Coupon & Offers
                  </ThemedText>
                </View>

                {appliedOffer ? (
                  <View style={styles.couponAppliedBanner}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                      <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
                      <View style={{ flex: 1 }}>
                        <ThemedText style={styles.couponAppliedCode}>{appliedOffer.code} applied!</ThemedText>
                        <ThemedText style={styles.couponAppliedSavings}>You save ₹{discountAmount}</ThemedText>
                      </View>
                    </View>
                    <Pressable onPress={handleRemovePromo} hitSlop={6}>
                      <Ionicons name="close-circle" size={18} color="#16a34a" />
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.couponInputRow}>
                    <TextInput
                      style={[
                        styles.couponInput,
                        { backgroundColor: theme.surfaceLowest, color: theme.text, borderColor: promoError ? '#ef4444' : theme.outlineVariant + '44' },
                      ]}
                      placeholder="Enter promo code"
                      placeholderTextColor={theme.placeholder}
                      value={promoInput}
                      onChangeText={t => {
                        setPromoInput(t.toUpperCase());
                        setPromoError('');
                      }}
                      autoCapitalize="characters"
                    />
                    <Pressable
                      onPress={() => handleApplyPromo()}
                      style={[styles.couponApplyBtn, { backgroundColor: theme.primary }]}
                    >
                      <ThemedText style={styles.couponApplyBtnText}>Apply</ThemedText>
                    </Pressable>
                  </View>
                )}

                {!!promoError && (
                  <ThemedText style={styles.couponErrorText}>{promoError}</ThemedText>
                )}

                {/* Available Offers Pills */}
                {!appliedOffer && classOffers.length > 0 && (
                  <View style={{ marginTop: 8 }}>
                    <ThemedText style={styles.availableOffersTitle}>
                      AVAILABLE OFFERS
                    </ThemedText>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: 6, paddingTop: 4 }}
                    >
                      {classOffers.map(o => (
                        <Pressable
                          key={o.id}
                          onPress={() => handleApplyPromo(o.code)}
                          style={[styles.offerPill, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}
                        >
                          <View style={[styles.offerBadge, { backgroundColor: theme.primary + '18' }]}>
                            <ThemedText style={[styles.offerBadgeText, { color: theme.primary }]}>
                              {formatDiscount(o)}
                            </ThemedText>
                          </View>
                          <ThemedText style={[styles.offerCode, { color: theme.text }]}>
                            {o.code}
                          </ThemedText>
                          <Ionicons name="arrow-forward-circle-outline" size={13} color={theme.primary} />
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Price Breakdown Line Items */}
              <View style={styles.priceBreakdown}>
                <View style={styles.priceRow}>
                  <ThemedText style={[styles.priceLabel, { color: theme.textSecondary }]}>
                    Class enrollment fee
                  </ThemedText>
                  <ThemedText style={[styles.priceValue, { color: theme.text }]}>
                    ₹{basePrice.toFixed(2)}
                  </ThemedText>
                </View>

                <View style={styles.priceRow}>
                  <ThemedText style={[styles.priceLabel, { color: theme.textSecondary }]}>
                    Taxes & service fee
                  </ThemedText>
                  <ThemedText style={[styles.priceValue, { color: theme.text }]}>
                    ₹{serviceFee.toFixed(2)}
                  </ThemedText>
                </View>

                {discountAmount > 0 && (
                  <View style={styles.priceRow}>
                    <ThemedText style={[styles.priceLabel, { color: '#16a34a' }]}>
                      Voucher discount ({appliedOffer?.code})
                    </ThemedText>
                    <ThemedText style={[styles.priceValue, { color: '#16a34a' }]}>
                      -₹{discountAmount.toFixed(2)}
                    </ThemedText>
                  </View>
                )}

                {walletDeduction > 0 && (
                  <View style={styles.priceRow}>
                    <ThemedText style={[styles.priceLabel, { color: theme.primary }]}>
                      Wallet balance applied
                    </ThemedText>
                    <ThemedText style={[styles.priceValue, { color: theme.primary }]}>
                      -₹{walletDeduction.toFixed(2)}
                    </ThemedText>
                  </View>
                )}

                <View style={[styles.ticketSeparator, { backgroundColor: theme.outlineVariant + '25' }]} />

                <View style={styles.priceRow}>
                  <ThemedText style={[styles.priceTotalLabel, { color: theme.text }]}>
                    Total payable
                  </ThemedText>
                  <ThemedText style={[styles.priceTotalValue, { color: theme.primary }]}>
                    ₹{netPayable.toFixed(2)}
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ── Sticky Bottom Action Bar ── */}
      <View style={[styles.bottomBar, { backgroundColor: theme.surfaceLowest, borderTopColor: theme.outlineVariant + '25' }, Shadows.level2]}>
        <View style={{ flex: 1 }}>
          <ThemedText style={[styles.bottomSubtext, { color: theme.textSecondary }]}>
            Total incl. taxes
          </ThemedText>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
            <ThemedText style={[styles.bottomPrice, { color: theme.text }]}>
              ₹{netPayable}
            </ThemedText>
            {discountAmount > 0 && (
              <ThemedText style={[styles.bottomStrikethrough, { color: theme.textSecondary }]}>
                ₹{basePrice + serviceFee}
              </ThemedText>
            )}
          </View>
        </View>

        <Pressable
          onPress={handleEnroll}
          style={[styles.bookNowBtn, { backgroundColor: theme.primary }]}
          accessibilityRole="button"
          accessibilityLabel={`Pay ₹${netPayable} and enrol`}
        >
          <Ionicons name="card-outline" size={17} color="#ffffff" style={{ marginRight: 6 }} />
          <ThemedText style={styles.bookNowBtnText}>
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
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
  heroWrapper: {
    marginBottom: Spacing.sm,
  },
  heroCard: {
    height: 180,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end',
  },
  heroImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  favFab: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  heroOverlay: {
    padding: 16,
  },
  heroTitle: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 18,
    lineHeight: 23,
    color: '#ffffff',
  },
  heroSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  heroSubItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroSubText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11.5,
    color: '#ffffffcc',
  },
  section: {
    marginTop: 20,
  },
  sectionLabel: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 11.5,
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 2,
  },
  formCard: {
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
  walletCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  walletIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletTitle: {
    fontFamily: 'Sora_500Medium',
    fontSize: 13,
  },
  walletSubtext: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11,
    marginTop: 1,
  },
  walletApplyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  pmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  pmLabel: {
    fontFamily: 'Sora_500Medium',
    fontSize: 13,
    marginLeft: 10,
  },
  pmRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pmRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  ticketCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  ticketHero: {
    height: 110,
    position: 'relative',
    justifyContent: 'flex-end',
    padding: 14,
  },
  ticketHeroImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  ticketHeroOverlay: {
    zIndex: 2,
  },
  ticketHeroTitle: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 16,
    color: '#ffffff',
  },
  ticketHeroSub: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11,
    color: '#ffffffbb',
    marginTop: 2,
  },
  ticketDottedLineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
    marginVertical: 4,
    position: 'relative',
  },
  ticketNotchLeft: {
    width: 16,
    height: 20,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    borderWidth: 1,
    borderLeftWidth: 0,
    position: 'absolute',
    left: -1,
  },
  ticketDottedLine: {
    flex: 1,
    marginHorizontal: 22,
    borderStyle: 'dashed',
    borderBottomWidth: 1.5,
  },
  ticketNotchRight: {
    width: 16,
    height: 20,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    borderWidth: 1,
    borderRightWidth: 0,
    position: 'absolute',
    right: -1,
  },
  ticketMiddleSection: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  ticketDetailsGrid: {
    gap: 10,
  },
  ticketGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ticketGridCol: {
    flex: 1,
  },
  ticketGridLabel: {
    fontFamily: 'Sora_400Regular',
    fontSize: 10.5,
    color: '#94a3b8',
    marginBottom: 2,
  },
  ticketGridValue: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 12.5,
  },
  ticketBottomSection: {
    padding: 16,
    paddingTop: 8,
  },
  couponSection: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
  },
  couponTitle: {
    fontFamily: 'Sora_500Medium',
    fontSize: 12.5,
  },
  couponAppliedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#dcfce7',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  couponAppliedCode: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 12,
    color: '#15803d',
  },
  couponAppliedSavings: {
    fontFamily: 'Sora_400Regular',
    fontSize: 10,
    color: '#16a34a',
    marginTop: 1,
  },
  couponInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  couponInput: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontFamily: 'Sora_500Medium',
    fontSize: 12.5,
    ...({ outlineStyle: 'none' } as any),
  },
  couponApplyBtn: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  couponApplyBtnText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 12,
    color: '#ffffff',
  },
  couponErrorText: {
    color: '#ef4444',
    fontFamily: 'Sora_400Regular',
    fontSize: 10.5,
    marginTop: 4,
  },
  availableOffersTitle: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 9.5,
    color: '#64748b',
    letterSpacing: 0.6,
  },
  offerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  offerBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  offerBadgeText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 9.5,
  },
  offerCode: {
    fontFamily: 'Sora_500Medium',
    fontSize: 11,
  },
  priceBreakdown: {
    gap: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12.5,
  },
  priceValue: {
    fontFamily: 'Sora_500Medium',
    fontSize: 12.5,
  },
  ticketSeparator: {
    height: 1,
    marginVertical: 4,
  },
  priceTotalLabel: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 13.5,
  },
  priceTotalValue: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 16,
  },
  bottomBar: {
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
  bottomSubtext: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11,
  },
  bottomPrice: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 20,
    letterSpacing: -0.3,
  },
  bottomStrikethrough: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  bookNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: 22,
    borderRadius: 999,
    ...Shadows.level1,
  },
  bookNowBtnText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 13.5,
    color: '#ffffff',
  },
});
