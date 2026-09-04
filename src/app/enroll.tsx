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
import { formatPhoneNumber, getPhoneValidationError } from '@/utils/phone-utils';

const PAYMENT_METHODS = [
  { id: 'gpay',   label: 'Google Pay',       icon: 'google',       family: 'FontAwesome5', color: '#EA4335' },
  { id: 'apple',  label: 'Apple Pay',        icon: 'logo-apple',   family: 'Ionicons',     color: '#000000' },
  { id: 'card',   label: 'Credit / Debit',   icon: 'card',         family: 'Ionicons',     color: '#5D68E8' },
  { id: 'upi',    label: 'UPI / NetBanking', icon: 'flash',        family: 'Ionicons',     color: '#10B981' },
];

export default function EnrollScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const theme = useTheme();
  const { offers, redeemOffer } = useOfferStore();
  const { enrollInClass } = useClassStore();
  const { walletBalance } = useWalletStore();

  const title = (params.title as string) || 'Featured Coaching Camp';
  const priceRaw = (params.price as string) || '2500';
  const dates = (params.dates as string) || 'Summer 2026';
  const location = (params.location as string) || 'Main Arena';
  const classId = (params.classId as string) || '';
  const turfId = (params.turfId as string) || '';
  const image =
    (params.image as string) || require('@/assets/images/illustrations/coaching_class_premium.png');

  // Form states
  const [name, setName] = useState('');
  const [age, setAge] = useState('14');
  const [phone, setPhone] = useState('98765 43210');
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

    const phoneErr = getPhoneValidationError(phone, true);
    if (phoneErr) {
      Alert.alert('Invalid Mobile Number', phoneErr);
      return;
    }

    if (classId) {
      const result = enrollInClass({
        classId,
        className: title,
        studentName: name.trim(),
        studentAge: age.trim(),
        contactNumber: phone.trim(),
        amountPaid: netPayable,
        appliedCode: appliedOffer?.code,
      });

      // The class can fill up between opening this form and submitting it, so
      // a refusal has to stop the flow rather than fall through to a success
      // dialog for an enrolment that was never recorded.
      if (!result.ok) {
        Alert.alert(
          'Class Full',
          `${title} has reached its limit of ${result.capacity} students. ` +
            `Nothing has been charged — please pick another class or contact the coach.`
        );
        return;
      }

      // Claim the voucher only now that the enrolment is committed. Applying a
      // code above merely previews the discount; this is what actually spends
      // one of the "first N users" slots, so an abandoned form doesn't burn one.
      if (appliedOffer) {
        const claim = redeemOffer(appliedOffer.code);
        if (!claim.ok) {
          Alert.alert(
            'Voucher No Longer Available',
            'This code was fully claimed while you were filling the form. ' +
              `Your enrolment is confirmed at the full fee of ₹${grossTotal}.`
          );
        }
      }
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
          <Ionicons name="arrow-back" size={20} color={theme.text} />
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
        {/* ── Top Hero Class Card (Compact & Sleek) ── */}
        <View style={[styles.heroCard, Shadows.level2]}>
          <Image source={imageSource} style={styles.heroImage} contentFit="cover" />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroOverlay}>
            <ThemedText style={styles.heroTitle} numberOfLines={2}>
              {title}
            </ThemedText>
            <View style={styles.heroSubRow}>
              <View style={styles.heroSubItem}>
                <Ionicons name="calendar-outline" size={12} color="#ffffffcc" />
                <ThemedText style={styles.heroSubText}>{dates}</ThemedText>
              </View>
              <View style={[styles.heroSubItem, { borderLeftWidth: 1, borderLeftColor: '#ffffff33', paddingLeft: 8, marginLeft: 8 }]}>
                <Ionicons name="location-outline" size={12} color="#ffffffcc" />
                <ThemedText style={styles.heroSubText} numberOfLines={1}>{location.split(',')[0]}</ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* ── Section 1: Participant Details (Dashboard Style Heading) ── */}
        <View style={styles.section}>
          <View style={styles.headingRow}>
            <View style={styles.headingLeft}>
              <View style={[styles.headingRule, { backgroundColor: theme.primary }]} />
              <ThemedText style={[styles.headingText, { color: theme.textSecondary }]}>
                PARTICIPANT DETAILS
              </ThemedText>
            </View>
          </View>

          <View style={[styles.formCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.inputLabel, { color: theme.text }]}>Full name</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33', color: theme.text }]}
                placeholder="e.g. Rahul Sharma"
                placeholderTextColor={theme.placeholder}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { width: 85 }]}>
                <ThemedText style={[styles.inputLabel, { color: theme.text }]}>Age</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33', color: theme.text }]}
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
                  style={[styles.input, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33', color: theme.text }]}
                  placeholder="98765 43210"
                  placeholderTextColor={theme.placeholder}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={v => setPhone(formatPhoneNumber(v))}
                  maxLength={11}
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

        {/* ── Section 2: Promotions & Vouchers ── */}
        <View style={styles.section}>
          <View style={styles.headingRow}>
            <View style={styles.headingLeft}>
              <View style={[styles.headingRule, { backgroundColor: theme.primary }]} />
              <ThemedText style={[styles.headingText, { color: theme.textSecondary }]}>
                PROMOTIONS & VOUCHERS
              </ThemedText>
            </View>
          </View>

          <View style={[styles.formCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
            <View style={styles.promoInputRow}>
              <View style={[styles.promoInputWrap, { backgroundColor: theme.surfaceLow, borderColor: promoError ? '#ef4444' : theme.outlineVariant + '33' }]}>
                <Ionicons name="pricetag-outline" size={15} color={theme.primary} style={{ marginRight: 8 }} />
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
                  <Pressable onPress={handleRemovePromo} hitSlop={6}>
                    <Ionicons name="close-circle" size={17} color="#ef4444" />
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

            {!!promoError && (
              <ThemedText style={styles.promoErrorText}>{promoError}</ThemedText>
            )}

            {appliedOffer && (
              <View style={[styles.appliedBanner, { backgroundColor: '#dcfce7', borderColor: '#86efac' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                  <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                  <ThemedText style={styles.appliedBannerText} numberOfLines={1}>
                    {appliedOffer.code} applied ({formatDiscount(appliedOffer)})
                  </ThemedText>
                </View>
                <ThemedText style={styles.appliedBannerDiscount}>
                  -₹{discountAmount}
                </ThemedText>
              </View>
            )}

            {!appliedOffer && classOffers.length > 0 && (
              <View style={{ marginTop: 10 }}>
                <ThemedText style={styles.offersSubheading}>AVAILABLE OFFERS</ThemedText>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 6, paddingTop: 4 }}
                >
                  {classOffers.map(o => (
                    <Pressable
                      key={o.id}
                      onPress={() => handleApplyPromo(o.code)}
                      style={[styles.offerChip, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33' }]}
                    >
                      <View style={[styles.offerTag, { backgroundColor: theme.primary + '15' }]}>
                        <ThemedText style={[styles.offerTagText, { color: theme.primary }]}>
                          {formatDiscount(o)}
                        </ThemedText>
                      </View>
                      <ThemedText style={[styles.offerCodeText, { color: theme.text }]}>
                        {o.code}
                      </ThemedText>
                      <Ionicons name="arrow-forward-circle-outline" size={13} color={theme.primary} />
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>

        {/* ── Section 3: Payment Method ── */}
        <View style={styles.section}>
          <View style={styles.headingRow}>
            <View style={styles.headingLeft}>
              <View style={[styles.headingRule, { backgroundColor: theme.primary }]} />
              <ThemedText style={[styles.headingText, { color: theme.textSecondary }]}>
                PAYMENT METHODS
              </ThemedText>
            </View>
          </View>

          {/* Wallet Toggle */}
          {walletBalance > 0 && (
            <View style={[styles.walletCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <View style={[styles.walletIconWrap, { backgroundColor: theme.primary + '15' }]}>
                  <Ionicons name="wallet-outline" size={18} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={[styles.walletTitle, { color: theme.text }]}>
                    Pay with Wallet
                  </ThemedText>
                  <ThemedText style={[styles.walletSubtext, { color: theme.textSecondary }]}>
                    Balance: ₹{walletBalance.toFixed(2)}
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
                <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_500Medium', color: useWallet ? '#ffffff' : theme.textSecondary }}>
                  {useWallet ? 'Applied' : 'Apply'}
                </ThemedText>
                <Ionicons
                  name={useWallet ? 'checkmark-circle' : 'add-circle-outline'}
                  size={13}
                  color={useWallet ? '#ffffff' : theme.textSecondary}
                />
              </Pressable>
            </View>
          )}

          {/* Payment Methods */}
          <View style={{ gap: 6 }}>
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
                        style={{ width: 20, height: 20, marginHorizontal: 4 }}
                      />
                    ) : pm.family === 'Ionicons' ? (
                      <Ionicons
                        name={pm.icon as any}
                        size={20}
                        color={isSelected ? theme.primary : (pm.color === '#000000' ? theme.text : pm.color)}
                        style={{ width: 28, textAlign: 'center' }}
                      />
                    ) : (
                      <FontAwesome5
                        name={pm.icon as any}
                        size={18}
                        color={isSelected ? theme.primary : pm.color}
                        style={{ width: 28, textAlign: 'center' }}
                      />
                    )}
                    <ThemedText style={[styles.pmLabel, { color: theme.text }]}>
                      {pm.label}
                    </ThemedText>
                  </View>

                  <View
                    style={[
                      styles.pmRadio,
                      { borderColor: isSelected ? theme.primary : theme.outlineVariant + '55' },
                    ]}
                  >
                    {isSelected && <View style={[styles.pmRadioInner, { backgroundColor: theme.primary }]} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── Section 4: Payment Summary (Clean Dashboard Card) ── */}
        <View style={styles.section}>
          <View style={styles.headingRow}>
            <View style={styles.headingLeft}>
              <View style={[styles.headingRule, { backgroundColor: theme.primary }]} />
              <ThemedText style={[styles.headingText, { color: theme.textSecondary }]}>
                PAYMENT SUMMARY
              </ThemedText>
            </View>
          </View>

          <View style={[styles.formCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
            <View style={styles.summaryRow}>
              <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                Enrollment fee
              </ThemedText>
              <ThemedText style={[styles.summaryValue, { color: theme.text }]}>
                ₹{basePrice.toFixed(2)}
              </ThemedText>
            </View>

            <View style={styles.summaryRow}>
              <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                Taxes & service fee
              </ThemedText>
              <ThemedText style={[styles.summaryValue, { color: theme.text }]}>
                ₹{serviceFee.toFixed(2)}
              </ThemedText>
            </View>

            {discountAmount > 0 && (
              <View style={styles.summaryRow}>
                <ThemedText style={[styles.summaryLabel, { color: '#16a34a' }]}>
                  Voucher discount ({appliedOffer?.code})
                </ThemedText>
                <ThemedText style={[styles.summaryValue, { color: '#16a34a' }]}>
                  -₹{discountAmount.toFixed(2)}
                </ThemedText>
              </View>
            )}

            {walletDeduction > 0 && (
              <View style={styles.summaryRow}>
                <ThemedText style={[styles.summaryLabel, { color: theme.primary }]}>
                  Wallet balance applied
                </ThemedText>
                <ThemedText style={[styles.summaryValue, { color: theme.primary }]}>
                  -₹{walletDeduction.toFixed(2)}
                </ThemedText>
              </View>
            )}

            <View style={[styles.divider, { backgroundColor: theme.outlineVariant + '25' }]} />

            <View style={styles.summaryRow}>
              <ThemedText style={[styles.summaryTotalLabel, { color: theme.text }]}>
                Total payable
              </ThemedText>
              <ThemedText style={[styles.summaryTotalValue, { color: theme.primary }]}>
                ₹{netPayable.toFixed(2)}
              </ThemedText>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ── Sticky Bottom Bar ── */}
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
          style={[styles.payBtn, { backgroundColor: theme.primary }]}
          accessibilityRole="button"
          accessibilityLabel={`Pay ₹${netPayable} and enrol`}
        >
          <Ionicons name="card-outline" size={16} color="#ffffff" style={{ marginRight: 6 }} />
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
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 15.5,
    letterSpacing: -0.2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
  },
  heroCard: {
    height: 150,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end',
    marginBottom: 4,
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
  heroOverlay: {
    padding: 14,
  },
  heroTitle: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 17,
    lineHeight: 22,
    color: '#ffffff',
  },
  heroSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  heroSubItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
  },
  heroSubText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11,
    color: '#ffffffcc',
  },
  section: {
    marginTop: 16,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginLeft: 2,
  },
  headingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headingRule: {
    width: 3.5,
    height: 13,
    borderRadius: 2,
  },
  headingText: {
    fontFamily: 'Sora_500Medium',
    fontSize: 10,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  formCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  inputGroup: {
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inputLabel: {
    fontFamily: 'Sora_500Medium',
    fontSize: 11.5,
    marginBottom: 5,
  },
  input: {
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontFamily: 'Sora_400Regular',
    fontSize: 12.5,
    ...({ outlineStyle: 'none' } as any),
  },
  skillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  skillChip: {
    flex: 1,
    height: 36,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skillChipText: {
    fontSize: 11,
  },
  promoInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  promoInputWrap: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  promoInput: {
    flex: 1,
    height: '100%',
    fontFamily: 'Sora_500Medium',
    fontSize: 12.5,
    ...({ outlineStyle: 'none' } as any),
  },
  promoApplyBtn: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoApplyBtnText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 12,
    color: '#ffffff',
  },
  promoErrorText: {
    color: '#ef4444',
    fontFamily: 'Sora_400Regular',
    fontSize: 10.5,
    marginTop: 4,
  },
  appliedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  appliedBannerText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 11.5,
    color: '#15803d',
  },
  appliedBannerDiscount: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 12,
    color: '#16a34a',
  },
  offersSubheading: {
    fontFamily: 'Sora_500Medium',
    fontSize: 9.5,
    color: '#64748b',
    letterSpacing: 0.6,
  },
  offerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  offerTag: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  offerTagText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 9.5,
  },
  offerCodeText: {
    fontFamily: 'Sora_500Medium',
    fontSize: 11,
  },
  walletCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  walletIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletTitle: {
    fontFamily: 'Sora_500Medium',
    fontSize: 12.5,
  },
  walletSubtext: {
    fontFamily: 'Sora_400Regular',
    fontSize: 10.5,
    marginTop: 1,
  },
  walletApplyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 7,
  },
  pmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  pmLabel: {
    fontFamily: 'Sora_500Medium',
    fontSize: 12.5,
    marginLeft: 8,
  },
  pmRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pmRadioInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryLabel: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
  },
  summaryValue: {
    fontFamily: 'Sora_500Medium',
    fontSize: 12,
  },
  divider: {
    height: 1,
    marginVertical: 6,
  },
  summaryTotalLabel: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 13,
  },
  summaryTotalValue: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 15,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  bottomSubtext: {
    fontFamily: 'Sora_400Regular',
    fontSize: 10.5,
  },
  bottomPrice: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 19,
    letterSpacing: -0.3,
  },
  bottomStrikethrough: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11.5,
    textDecorationLine: 'line-through',
  },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    paddingHorizontal: 20,
    borderRadius: 999,
    ...Shadows.level1,
  },
  payBtnText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 13,
    color: '#ffffff',
  },
});
