import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  Linking,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText, MAX_FONT_SCALE } from '@/components/themed-text';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useOfferStore, useClassStore, useWalletStore } from '@/store/app-store';
import { getOffersForTurf, formatDiscount, isRedeemable, OwnerOffer, OfferDiscountType, OfferStatus } from '@/store/offer-store';
import { formatPhoneNumber, getPhoneValidationError } from '@/utils/phone-utils';
import { normaliseScheduleList, formatClassDateRange, formatDaysShort, formatSessionsShort } from '@/utils/class-schedule';

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
  const { profile } = useUserProfile();
  const { offers, redeemOffer } = useOfferStore();
  const { classes, enrollInClass } = useClassStore();
  const { walletBalance, deductWalletFunds } = useWalletStore();

  const title = (params.title as string) || 'Featured Coaching Camp';
  const priceRaw = (params.price as string) || '2500';
  const dates = (params.dates as string) || 'Summer 2026';
  const location = (params.location as string) || 'Main Arena';
  const classId = (params.classId as string) || '';
  const turfId = (params.turfId as string) || '';
  const image =
    (params.image as string) || require('@/assets/images/illustrations/coaching_class_premium.png');

  // Form states auto-populated from logged-in user profile
  const [name, setName] = useState(profile?.name || '');
  const [age, setAge] = useState('16');
  const [phone, setPhone] = useState(
    profile?.phone ? formatPhoneNumber(profile.phone) : ''
  );
  const [skillLevel, setSkillLevel] = useState('Beginner');
  const [formError, setFormError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmationData, setConfirmationData] = useState<{
    bookingId: string;
    className: string;
    studentName: string;
    studentAge: string;
    contactNumber: string;
    skillLevel: string;
    dates: string;
    location: string;
    amountPaid: number;
    paymentMethodLabel: string;
    discountSaved: number;
    code?: string;
  } | null>(null);

  // Keep state updated if profile loads asynchronously
  React.useEffect(() => {
    if (profile?.name && !name) {
      setName(profile.name);
    }
    if (profile?.phone && !phone) {
      setPhone(formatPhoneNumber(profile.phone));
    }
  }, [profile]);

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState('gpay');
  const [useWallet, setUseWallet] = useState(false);
  const [walletInputAmount, setWalletInputAmount] = useState<string>('');

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
  const maxAllowedFromAmount = Math.max(1, Math.round(grossTotal * 0.25));
  const maxWalletDeductible = Math.min(walletBalance, maxAllowedFromAmount);
  const parsedWalletAmount = walletInputAmount === '' ? maxWalletDeductible : Math.min(maxWalletDeductible, Math.max(0, parseFloat(walletInputAmount) || 0));
  const walletDeduction = useWallet ? parsedWalletAmount : 0;
  const netPayable = Math.max(0, grossTotal - walletDeduction);

  const selectedClass = useMemo(() => {
    return (classes || []).find(
      (c: any) =>
        (classId && c.id === classId) ||
        (c.className && c.className.toLowerCase() === title.toLowerCase())
    );
  }, [classId, title, classes]);

  const displaySchedule = useMemo(() => {
    if (selectedClass?.startDate || selectedClass?.endDate) {
      return formatClassDateRange(selectedClass.startDate, selectedClass.endDate);
    }
    return dates || 'Upcoming Season 2026';
  }, [selectedClass, dates]);

  const displayDays = useMemo(() => {
    if (selectedClass?.selectedDays) {
      const short = formatDaysShort(selectedClass.selectedDays);
      if (short) return short;
    }
    return (params.days as string) || 'Mon, Wed, Fri';
  }, [selectedClass, params.days]);

  const displaySessionTime = useMemo(() => {
    if (selectedClass?.sessionTime) {
      const short = formatSessionsShort(selectedClass.sessionTime);
      if (short) return short;
    }
    return (params.sessionTime as string) || '06:00 AM – 07:30 AM';
  }, [selectedClass, params.sessionTime]);

  const displayFee = useMemo(() => {
    if (selectedClass?.feeAmount) {
      const typeLabel =
        selectedClass.feeType === 'Per Session'
          ? 'Session'
          : selectedClass.feeType === 'Monthly'
            ? 'Month'
            : 'Package';
      return `₹${selectedClass.feeAmount} / ${typeLabel}`;
    }
    return `₹${basePrice} / Registration`;
  }, [selectedClass, basePrice]);

  const displayLevel = useMemo(() => {
    const parts = [selectedClass?.skillLevel, selectedClass?.ageGroup].filter(Boolean);
    if (parts.length > 0) return parts.join(' · ');
    return (params.level as string) || 'Beginner to Advanced · All Ages';
  }, [selectedClass, params.level]);

  const displayVenue = useMemo(() => {
    return selectedClass?.venue || location || 'Trichy Zone IV, Tiruchirappalli';
  }, [selectedClass, location]);

  const displayCoach = useMemo(() => {
    return selectedClass?.coachName || (params.coach as string) || 'Certified Head Coach';
  }, [selectedClass, params.coach]);

  const displayCertifications = useMemo(() => {
    if (selectedClass?.certificates && Array.isArray(selectedClass.certificates)) {
      const list = selectedClass.certificates.filter(Boolean);
      if (list.length > 0) return list.join(' · ');
    }
    return (params.certificates as string) || '';
  }, [selectedClass, params.certificates]);

  // Filter and strictly deduplicate available vouchers for this class
  const classOffers = useMemo(() => {
    let list: any[] = [];

    if (selectedClass?.vouchers && Array.isArray(selectedClass.vouchers) && selectedClass.vouchers.length > 0) {
      list = selectedClass.vouchers.map((v: any) => ({
        id: v.offerId || v.localId || `class-voucher-${v.code}`,
        code: String(v.code || '').trim().toUpperCase(),
        title: v.title || `${selectedClass.className} Voucher`,
        description: v.description || `Special coaching voucher for ${selectedClass.className}`,
        discountType: (v.discountType === 'flat' ? 'flat' : 'percent') as OfferDiscountType,
        discountValue: parseFloat(v.discountValue) || 15,
        minBooking: parseFloat(v.minBooking) || 0,
        maxRedemptions: parseInt(v.maxRedemptions, 10) || 0,
        redeemedCount: 0,
        validTill: new Date(Date.now() + 30 * 86400000).toISOString(),
        appliesTo: selectedClass.className || 'Coaching Class',
        status: 'active' as OfferStatus,
        createdAt: new Date().toISOString(),
        bannerImage: v.bannerImage,
      }));
    } else {
      const matched = offers.filter(
        o => isRedeemable(o) && o.appliesTo && selectedClass?.className && o.appliesTo.toLowerCase() === selectedClass.className.toLowerCase()
      );
      if (matched.length > 0) {
        list = matched;
      } else {
        const clsName = selectedClass?.className || title || 'CLASS';
        const cleanPrefix = clsName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
        const promoCode = `${cleanPrefix || 'CLASS'}10`;
        list = [
          {
            id: `class-promo-${clsName}`,
            code: promoCode,
            title: `${clsName} Special Discount`,
            description: `Enjoy 15% off your enrollment in ${clsName}`,
            discountType: 'percent' as OfferDiscountType,
            discountValue: 15,
            minBooking: 0,
            maxRedemptions: 100,
            redeemedCount: 0,
            validTill: new Date(Date.now() + 60 * 86400000).toISOString(),
            appliesTo: clsName,
            status: 'active' as OfferStatus,
            createdAt: new Date().toISOString(),
          },
        ];
      }
    }

    // Strict deduplication by uppercase promo code so duplicate cards are never rendered
    const seen = new Set<string>();
    return list.filter((item: any) => {
      const code = String(item.code || '').trim().toUpperCase();
      if (!code || seen.has(code)) return false;
      seen.add(code);
      return true;
    });
  }, [selectedClass, title, offers]);

  const initialPromoCode = (params.promoCode as string) || '';

  React.useEffect(() => {
    if (initialPromoCode && classOffers.length > 0 && !appliedOffer) {
      handleApplyPromo(initialPromoCode);
    }
  }, [initialPromoCode, classOffers]);

  const handleApplyPromo = (codeToApply?: string) => {
    const code = (codeToApply || promoInput).trim().toUpperCase();
    if (!code) {
      setPromoError('Please enter a voucher code.');
      return;
    }

    const allAvailable = [...classOffers, ...offers];
    const found = allAvailable.find(o => o.code.toUpperCase() === code);
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
    setFormError(null);
    const trimmedName = (name || profile?.name || '').trim();
    const trimmedAge = (age || '16').trim();
    const trimmedPhone = (phone || profile?.phone || '').trim();

    if (!trimmedName) {
      setFormError('Please enter the participant full name.');
      return;
    }
    if (!trimmedAge) {
      setFormError('Please enter the participant age.');
      return;
    }
    if (!trimmedPhone) {
      setFormError('Please enter a contact phone number.');
      return;
    }

    const phoneErr = getPhoneValidationError(trimmedPhone, true);
    if (phoneErr) {
      setFormError(phoneErr);
      return;
    }

    setIsProcessing(true);

    const targetClassId =
      classId ||
      (classes || []).find(
        (c: any) => c.className && c.className.toLowerCase() === title.toLowerCase()
      )?.id ||
      `class_${Date.now()}`;

    const result = enrollInClass({
      classId: targetClassId,
      className: title,
      studentName: trimmedName,
      studentAge: trimmedAge,
      contactNumber: trimmedPhone,
      amountPaid: netPayable,
      appliedCode: appliedOffer?.code,
    });

    if (result && !result.ok) {
      setIsProcessing(false);
      setFormError(
        `${title} has reached its limit of ${result.capacity} students. Please pick another class.`
      );
      Alert.alert(
        'Class Full',
        `${title} has reached its limit of ${result.capacity} students. Nothing has been charged.`
      );
      return;
    }

    if (appliedOffer) {
      redeemOffer(appliedOffer.code);
    }

    if (useWallet && walletDeduction > 0) {
      deductWalletFunds(walletDeduction);
    }

    const selectedPmObj = PAYMENT_METHODS.find(p => p.id === paymentMethod);
    const bookingRef = `ENR-${Math.floor(100000 + Math.random() * 900000)}`;

    setIsProcessing(false);
    setConfirmationData({
      bookingId: bookingRef,
      className: title,
      studentName: trimmedName,
      studentAge: trimmedAge,
      contactNumber: trimmedPhone,
      skillLevel: skillLevel || 'Beginner',
      dates,
      location,
      amountPaid: netPayable,
      paymentMethodLabel: selectedPmObj?.label || 'Online Payment',
      discountSaved: discountAmount,
      code: appliedOffer?.code,
    });
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

        {/* ── Section: Camp & Schedule Details ── */}
        <View style={styles.section}>
          <View style={styles.headingRow}>
            <View style={styles.headingLeft}>
              <View style={[styles.headingRule, { backgroundColor: theme.primary }]} />
              <ThemedText style={[styles.headingText, { color: theme.textSecondary }]}>
                CAMP & SCHEDULE DETAILS
              </ThemedText>
            </View>
            <View style={[styles.sportBadge, { backgroundColor: theme.primary + '18' }]}>
              <ThemedText style={[styles.sportBadgeText, { color: theme.primary }]}>
                {selectedClass?.sportType || (params.sport as string) || 'Football'}
              </ThemedText>
            </View>
          </View>

          <View style={[styles.classDetailsCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
            {/* Coach & Camp Top Summary */}
            <View style={styles.classDetailsTopRow}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <ThemedText style={[styles.classDetailsCampName, { color: theme.text }]} numberOfLines={1}>
                  {title}
                </ThemedText>
                <ThemedText style={[styles.classDetailsCoachName, { color: theme.textSecondary }]} numberOfLines={1}>
                  Coach: <ThemedText style={{ color: theme.primary, fontFamily: 'Sora_600SemiBold' }}>{displayCoach}</ThemedText>
                </ThemedText>
              </View>
              {selectedClass?.maxStudents ? (
                <View style={[styles.seatPill, { backgroundColor: '#10B98118' }]}>
                  <Ionicons name="people" size={11} color="#10B981" />
                  <ThemedText style={[styles.seatPillText, { color: '#10B981' }]}>
                    Max {selectedClass.maxStudents}
                  </ThemedText>
                </View>
              ) : null}
            </View>

            <View style={[styles.classDetailsDivider, { backgroundColor: theme.outlineVariant + '20' }]} />

            {/* 2-Column Metadata Grid */}
            <View style={styles.classGridContainer}>
              {/* Runs / Schedule */}
              <View style={[styles.classGridCell, styles.classGridCellFull]}>
                <View style={[styles.classGridIcon, { backgroundColor: theme.primary + '15' }]}>
                  <Ionicons name="calendar-outline" size={13} color={theme.primary} />
                </View>
                <View style={styles.classGridTextCol}>
                  <ThemedText style={[styles.classGridLabel, { color: theme.textSecondary }]}>Schedule / Runs</ThemedText>
                  <ThemedText style={[styles.classGridValue, { color: theme.text }]}>{displaySchedule}</ThemedText>
                </View>
              </View>

              {/* Days */}
              <View style={[styles.classGridCell, styles.classGridCellHalf]}>
                <View style={[styles.classGridIcon, { backgroundColor: '#f59e0b18' }]}>
                  <Ionicons name="repeat-outline" size={13} color="#f59e0b" />
                </View>
                <View style={styles.classGridTextCol}>
                  <ThemedText style={[styles.classGridLabel, { color: theme.textSecondary }]}>Days</ThemedText>
                  <ThemedText style={[styles.classGridValue, { color: theme.text }]} numberOfLines={2}>{displayDays}</ThemedText>
                </View>
              </View>

              {/* Session Time */}
              <View style={[styles.classGridCell, styles.classGridCellHalf]}>
                <View style={[styles.classGridIcon, { backgroundColor: '#3b82f618' }]}>
                  <Ionicons name="time-outline" size={13} color="#3b82f6" />
                </View>
                <View style={styles.classGridTextCol}>
                  <ThemedText style={[styles.classGridLabel, { color: theme.textSecondary }]}>Sessions</ThemedText>
                  <ThemedText style={[styles.classGridValue, { color: theme.text }]} numberOfLines={2}>{displaySessionTime}</ThemedText>
                </View>
              </View>

              {/* Fee */}
              <View style={[styles.classGridCell, styles.classGridCellHalf]}>
                <View style={[styles.classGridIcon, { backgroundColor: '#10b98118' }]}>
                  <Ionicons name="pricetag-outline" size={13} color="#10b981" />
                </View>
                <View style={styles.classGridTextCol}>
                  <ThemedText style={[styles.classGridLabel, { color: theme.textSecondary }]}>Program Fee</ThemedText>
                  <ThemedText style={[styles.classGridValue, { color: '#10b981', fontFamily: 'Sora_600SemiBold' }]}>{displayFee}</ThemedText>
                </View>
              </View>

              {/* Level & Group */}
              <View style={[styles.classGridCell, styles.classGridCellHalf]}>
                <View style={[styles.classGridIcon, { backgroundColor: '#8b5cf618' }]}>
                  <Ionicons name="trending-up-outline" size={13} color="#8b5cf6" />
                </View>
                <View style={styles.classGridTextCol}>
                  <ThemedText style={[styles.classGridLabel, { color: theme.textSecondary }]}>Level & Group</ThemedText>
                  <ThemedText style={[styles.classGridValue, { color: theme.text }]} numberOfLines={2}>{displayLevel}</ThemedText>
                </View>
              </View>

              {/* Venue */}
              <View style={[styles.classGridCell, styles.classGridCellFull]}>
                <View style={[styles.classGridIcon, { backgroundColor: '#ef444418' }]}>
                  <Ionicons name="location-outline" size={13} color="#ef4444" />
                </View>
                <View style={styles.classGridTextCol}>
                  <ThemedText style={[styles.classGridLabel, { color: theme.textSecondary }]}>Venue / Turf</ThemedText>
                  <ThemedText style={[styles.classGridValue, { color: theme.text }]} numberOfLines={2}>{displayVenue}</ThemedText>
                </View>
              </View>

              {/* Coach Certifications */}
              {displayCertifications ? (
                <View style={[styles.classGridCell, styles.classGridCellFull]}>
                  <View style={[styles.classGridIcon, { backgroundColor: '#05966918' }]}>
                    <Ionicons name="ribbon-outline" size={13} color="#059669" />
                  </View>
                  <View style={styles.classGridTextCol}>
                    <ThemedText style={[styles.classGridLabel, { color: theme.textSecondary }]}>Coach Certifications</ThemedText>
                    <ThemedText style={[styles.classGridValue, { color: '#059669', fontFamily: 'Sora_600SemiBold' }]} numberOfLines={2}>
                      {displayCertifications}
                    </ThemedText>
                  </View>
                </View>
              ) : null}
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
              <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
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
                <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
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
                <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
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

        {/* ── Section 2: Vouchers & Offers (Kakao Style Matching Screenshot) ── */}
        {classOffers.length > 0 && (
          <View style={styles.section}>
            <View style={[styles.headingRow, { marginBottom: 8 }]}>
              <ThemedText style={{ fontFamily: 'Sora_600SemiBold', fontSize: 13.5, color: theme.text }}>
                Vouchers & Offers
              </ThemedText>
              <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_500Medium', color: '#10b981' }}>
                {classOffers.length} Active {classOffers.length === 1 ? 'Offer' : 'Offers'}
              </ThemedText>
            </View>

            {classOffers.map((offer, idx) => {
              const isApplied = appliedOffer?.code === offer.code;
              const discountText = formatDiscount(offer);
              const brand = (offer.appliesTo || 'TURF PASS').toUpperCase();

              return (
                <View key={offer.id || `offer-${idx}`} style={styles.kakaoCouponCard}>
                  {/* Serrated Perforated Top Teeth Row */}
                  <View style={styles.kakaoTeethRow}>
                    {Array.from({ length: 22 }).map((_, i) => (
                      <View key={i} style={styles.kakaoTooth} />
                    ))}
                  </View>

                  {/* Main Body with Pink Gradient or Banner Image */}
                  <View style={styles.kakaoPinkBody}>
                    {offer.bannerImage ? (
                      <>
                        <Image
                          source={{ uri: offer.bannerImage }}
                          style={StyleSheet.absoluteFill}
                          contentFit="cover"
                        />
                        <LinearGradient
                          colors={['rgba(255, 30, 112, 0.84)', 'rgba(219, 10, 85, 0.95)']}
                          style={StyleSheet.absoluteFill}
                        />
                      </>
                    ) : null}

                    {/* Subtle Watermark "SALE" */}
                    <ThemedText style={styles.kakaoWatermark}>SALE</ThemedText>

                    {/* Header Row: Brand block on left, Yellow circle badge on right */}
                    <View style={styles.kakaoHeaderRow}>
                      <View style={styles.kakaoBrandBlock}>
                        <ThemedText style={styles.kakaoBrandTitle} numberOfLines={1}>
                          {brand}
                        </ThemedText>
                        <ThemedText style={styles.kakaoBrandSub}>STYLE</ThemedText>
                        <ThemedText style={styles.kakaoBrandCoupon}>X COUPON</ThemedText>
                        <View style={styles.kakaoBrandLine} />
                      </View>

                      {/* Floating Yellow Circle Badge - Tap to Apply */}
                      <Pressable
                        onPress={() => (isApplied ? handleRemovePromo() : handleApplyPromo(offer.code))}
                        style={styles.kakaoYellowBadge}
                      >
                        <ThemedText style={styles.kakaoYellowBadgeText}>COUPON</ThemedText>
                        <ThemedText style={styles.kakaoYellowBadgeText}>CLAIM</ThemedText>
                        <Ionicons name={isApplied ? "checkmark" : "arrow-down"} size={13} color="#000000" style={{ marginTop: 1 }} />
                      </Pressable>
                    </View>

                    {/* Center Discount Typography: 20% OFF */}
                    <View style={styles.kakaoDiscountCenter}>
                      <ThemedText style={styles.kakaoBigDiscount}>
                        {discountText.replace(' OFF', '')}
                      </ThemedText>
                      <ThemedText style={styles.kakaoBigOff}>OFF</ThemedText>
                    </View>
                  </View>

                  {/* Bottom Tear-Off Stub (White) */}
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
                          {offer.description || 'Claim this voucher discount during enrollment checkout.'}
                        </ThemedText>
                      </View>

                      <Pressable
                        onPress={() => (isApplied ? handleRemovePromo() : handleApplyPromo(offer.code))}
                        style={[styles.kakaoApplyBtn, isApplied && { backgroundColor: '#16a34a' }]}
                      >
                        <ThemedText style={styles.kakaoApplyBtnText}>
                          {isApplied ? 'Applied ✓' : 'Apply →'}
                        </ThemedText>
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Section 3: Location (Matching Screenshot) ── */}
        <View style={styles.section}>
          <View style={[styles.formCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', padding: 12 }, Shadows.level1]}>
            <ThemedText style={{ fontFamily: 'Sora_600SemiBold', fontSize: 13.5, color: theme.text, marginBottom: 8 }}>
              Location
            </ThemedText>

            {/* Map Placeholder Graphic with Center Pin */}
            <Pressable
              onPress={() => {
                const query = encodeURIComponent((title || 'Class') + ', ' + location);
                Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`).catch(() => {
                  Alert.alert('Maps Error', 'Could not open Google Maps.');
                });
              }}
              style={styles.mapContainer}
            >
              <Image
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAs7ZFxpDuTY0Y20RzzsmBGxAjht8U5AihgJyskprBmTPKVYrEOab08NWaF-4BFy3UjwPr46PMa9oRy0TqoklyqETyaI3T9xbHvBGj0vyYb99qgZn6w5StHhG9_NAMWkvZiyjhoW9QJ4TVDCuUjWD2x6xrp0HlAaAIVRu2xmLKg6V1CrRxUQiNFhiU_n_PBx9V6T9ZF5x3yGwizSIx_I4x5fTWBozUqBJ77o8N5RyeuxUvrf6uWewzXD86IF4X_G5brMzCocIakM-w' }}
                style={styles.mapImage}
                contentFit="cover"
              />
              <View style={styles.mapMarkerContainer}>
                <View style={[styles.mapMarker, { backgroundColor: theme.primaryContainer }]}>
                  <Ionicons name="location" size={24} color="#ffffff" />
                </View>
              </View>
            </Pressable>

            <View style={{ marginTop: 8 }}>
              <ThemedText style={{ fontFamily: 'Sora_600SemiBold', fontSize: 12, color: theme.text }}>
                {location.split(',')[0]}
              </ThemedText>
              <ThemedText style={{ color: theme.textSecondary, fontSize: 10.5, fontFamily: 'Sora_400Regular', marginTop: 2 }}>
                {location.split(',').slice(1).join(',').trim() || location}
              </ThemedText>
            </View>

            <Pressable
              onPress={() => {
                const query = encodeURIComponent((title || 'Class') + ', ' + location);
                Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`).catch(() => {
                  Alert.alert('Maps Error', 'Could not open Google Maps.');
                });
              }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 }}
            >
              <ThemedText style={{ color: theme.secondary, fontSize: 11.5, fontFamily: 'Sora_500Medium' }}>
                Get Directions
              </ThemedText>
              <Ionicons name="arrow-forward" size={13} color={theme.secondary} />
            </Pressable>
          </View>
        </View>

        {/* ── Section 4: Payment Method ── */}
        <View style={styles.section}>
          <View style={styles.headingRow}>
            <View style={styles.headingLeft}>
              <View style={[styles.headingRule, { backgroundColor: theme.primary }]} />
              <ThemedText style={[styles.headingText, { color: theme.textSecondary }]}>
                PAYMENT METHODS
              </ThemedText>
            </View>
          </View>

          {/* Wallet Toggle with Enter Amount to Reduce */}
          {walletBalance > 0 && (
            <View style={[styles.walletCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', flexDirection: 'column', alignItems: 'stretch' }, Shadows.level1]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
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
                  onPress={() => {
                    if (!useWallet && walletInputAmount === '') {
                      setWalletInputAmount(String(maxWalletDeductible));
                    }
                    setUseWallet(!useWallet);
                  }}
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

              {useWallet && (
                <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.outlineVariant + '22' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <ThemedText style={{ fontSize: 11.5, color: theme.textSecondary, fontFamily: 'Sora_500Medium' }}>
                      Enter amount to reduce (Max 25%):
                    </ThemedText>
                    <ThemedText style={{ fontSize: 11, color: theme.primary, fontFamily: 'Sora_500Medium' }}>
                      Max: ₹{maxWalletDeductible.toFixed(2)}
                    </ThemedText>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surfaceLow, borderRadius: 8, borderWidth: 1, borderColor: theme.outlineVariant + '33', paddingHorizontal: 10, height: 36 }}>
                      <ThemedText style={{ fontSize: 13, fontFamily: 'Sora_500Medium', color: theme.textSecondary, marginRight: 4 }}>₹</ThemedText>
                      <TextInput
                        maxFontSizeMultiplier={MAX_FONT_SCALE}
                        keyboardType="decimal-pad"
                        placeholder={String(maxWalletDeductible)}
                        placeholderTextColor="#94a3b8"
                        value={walletInputAmount}
                        onChangeText={(txt) => {
                          const sanitized = txt.replace(/[^0-9.]/g, '');
                          setWalletInputAmount(sanitized);
                        }}
                        style={{ flex: 1, fontSize: 13, fontFamily: 'Sora_500Medium', color: theme.text, height: 34, ...({ outlineStyle: 'none' } as any) }}
                      />
                      {walletInputAmount !== '' && (
                        <Pressable onPress={() => setWalletInputAmount('')}>
                          <Ionicons name="close-circle" size={15} color={theme.textSecondary} />
                        </Pressable>
                      )}
                    </View>

                    <Pressable
                      onPress={() => setWalletInputAmount(String(maxWalletDeductible))}
                      style={{ backgroundColor: theme.primary + '15', borderWidth: 1, borderColor: theme.primary + '44', paddingHorizontal: 12, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}
                    >
                      <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: theme.primary }}>
                        Max
                      </ThemedText>
                    </Pressable>
                  </View>

                  {/* Quick chips */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {[0.25, 0.5, 0.75, 1].map((ratio) => {
                      const amount = Math.min(maxWalletDeductible, Math.max(1, Math.round(maxWalletDeductible * ratio)));
                      if (amount <= 0) return null;
                      const isSelected = parsedWalletAmount === amount;
                      return (
                        <Pressable
                          key={ratio}
                          onPress={() => setWalletInputAmount(String(amount))}
                          style={{
                            paddingVertical: 3,
                            paddingHorizontal: 8,
                            borderRadius: 6,
                            backgroundColor: isSelected ? theme.primary : theme.surfaceLow,
                            borderWidth: 1,
                            borderColor: isSelected ? theme.primary : theme.outlineVariant + '22',
                          }}
                        >
                          <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_500Medium', color: isSelected ? '#ffffff' : theme.textSecondary }}>
                            {ratio === 1 ? 'Use Max 25%' : `Use ${(ratio * 25).toFixed(0)}%`} (₹{amount})
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
                    <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                    <ThemedText style={{ fontSize: 10.5, color: '#10B981', fontFamily: 'Sora_500Medium' }}>
                      ₹{walletDeduction.toFixed(2)} will be reduced from your enrollment fee (Max 25% wallet limit).
                    </ThemedText>
                  </View>
                </View>
              )}
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
                      backgroundColor: isSelected ? (theme.primary + '18') : theme.surfaceLowest,
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
                    <ThemedText
                      style={[
                        styles.pmLabel,
                        {
                          color: isSelected ? theme.primary : theme.text,
                          fontFamily: isSelected ? 'Sora_600SemiBold' : 'Sora_500Medium',
                        },
                      ]}
                    >
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
        {formError ? (
          <View style={styles.errorBannerRow}>
            <Ionicons name="alert-circle" size={14} color="#ef4444" />
            <ThemedText style={styles.errorBannerText} numberOfLines={1}>
              {formError}
            </ThemedText>
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
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
            disabled={isProcessing}
            style={[styles.payBtn, { backgroundColor: theme.primary, opacity: isProcessing ? 0.7 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel={`Pay ₹${netPayable} and enrol`}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 6 }} />
            ) : (
              <Ionicons name="card-outline" size={16} color="#ffffff" style={{ marginRight: 6 }} />
            )}
            <ThemedText style={styles.payBtnText}>
              {isProcessing ? 'Processing...' : 'Pay & enrol'}
            </ThemedText>
          </Pressable>
        </View>
      </View>

      {/* ── Enrollment Confirmation Modal / Screen ── */}
      <Modal
        visible={!!confirmationData}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setConfirmationData(null);
          router.replace('/(tabs)/coach');
        }}
      >
        <View style={styles.confirmOverlay}>
          <View style={[styles.confirmModalBox, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level3]}>
            {/* Success Ring & Icon */}
            <View style={[styles.confirmBadgeRing, { backgroundColor: '#10B9811A' }]}>
              <View style={styles.confirmBadgeCircle}>
                <Ionicons name="checkmark" size={28} color="#ffffff" />
              </View>
            </View>

            <ThemedText style={[styles.confirmTitle, { color: theme.text }]}>
              Enrollment Confirmed! 🎉
            </ThemedText>
            <ThemedText style={[styles.confirmSub, { color: theme.textSecondary }]}>
              You have successfully registered for {confirmationData?.className}
            </ThemedText>

            {/* Pass / Receipt Summary Card */}
            <View style={[styles.confirmReceiptCard, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33' }]}>
              <View style={styles.confirmReceiptRow}>
                <ThemedText style={[styles.confirmReceiptLabel, { color: theme.textSecondary }]}>
                  Booking Ref
                </ThemedText>
                <ThemedText style={[styles.confirmReceiptVal, { color: theme.primary, fontFamily: 'Sora_600SemiBold' }]}>
                  {confirmationData?.bookingId}
                </ThemedText>
              </View>

              <View style={styles.confirmReceiptRow}>
                <ThemedText style={[styles.confirmReceiptLabel, { color: theme.textSecondary }]}>
                  Participant
                </ThemedText>
                <ThemedText style={[styles.confirmReceiptVal, { color: theme.text }]}>
                  {confirmationData?.studentName} ({confirmationData?.studentAge} yrs · {confirmationData?.skillLevel})
                </ThemedText>
              </View>

              <View style={styles.confirmReceiptRow}>
                <ThemedText style={[styles.confirmReceiptLabel, { color: theme.textSecondary }]}>
                  Contact
                </ThemedText>
                <ThemedText style={[styles.confirmReceiptVal, { color: theme.text }]}>
                  {confirmationData?.contactNumber}
                </ThemedText>
              </View>

              <View style={styles.confirmReceiptRow}>
                <ThemedText style={[styles.confirmReceiptLabel, { color: theme.textSecondary }]}>
                  Schedule
                </ThemedText>
                <ThemedText style={[styles.confirmReceiptVal, { color: theme.text }]}>
                  {confirmationData?.dates}
                </ThemedText>
              </View>

              <View style={styles.confirmReceiptRow}>
                <ThemedText style={[styles.confirmReceiptLabel, { color: theme.textSecondary }]}>
                  Payment Method
                </ThemedText>
                <ThemedText style={[styles.confirmReceiptVal, { color: theme.text }]}>
                  {confirmationData?.paymentMethodLabel}
                </ThemedText>
              </View>

              <View style={[styles.confirmDivider, { backgroundColor: theme.outlineVariant + '25' }]} />

              <View style={styles.confirmReceiptRow}>
                <ThemedText style={[styles.confirmTotalLabel, { color: theme.text }]}>
                  Total Paid
                </ThemedText>
                <View style={{ alignItems: 'flex-end' }}>
                  <ThemedText style={[styles.confirmTotalVal, { color: '#10B981' }]}>
                    ₹{confirmationData?.amountPaid.toFixed(2)}
                  </ThemedText>
                  {(confirmationData?.discountSaved || 0) > 0 && (
                    <ThemedText style={{ fontSize: 10, color: '#FF1E70', fontFamily: 'Sora_500Medium' }}>
                      Saved ₹{confirmationData?.discountSaved} ({confirmationData?.code})
                    </ThemedText>
                  )}
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.confirmActionRow}>
              <Pressable
                onPress={() => {
                  setConfirmationData(null);
                  router.dismissAll();
                  router.replace('/(tabs)/coach');
                }}
                style={[styles.confirmPrimaryBtn, { backgroundColor: theme.primary }]}
              >
                <ThemedText style={styles.confirmPrimaryBtnText}>
                  Go to Coaching Camps
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={() => {
                  setConfirmationData(null);
                  router.dismissAll();
                  router.replace('/(tabs)');
                }}
                style={[styles.confirmSecondaryBtn, { borderColor: theme.outlineVariant + '44' }]}
              >
                <ThemedText style={[styles.confirmSecondaryBtnText, { color: theme.text }]}>
                  Home Screen
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    includeFontPadding: false,
    paddingVertical: 0,
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
    includeFontPadding: false,
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

  // ── Kakao Trendy Ticket Voucher ──
  kakaoCouponCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#FF1E70',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
    marginVertical: 4,
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
    fontSize: 48,
    fontFamily: 'Sora_500Medium',
    color: '#ffffff',
    lineHeight: 48,
    letterSpacing: -1,
  },
  kakaoBigOff: {
    fontSize: 40,
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
    backgroundColor: '#FF1E70',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  kakaoApplyBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontFamily: 'Sora_600SemiBold',
  },

  // ── Location Section & Map Container ──
  mapContainer: {
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#cbd5e1',
    marginVertical: 4,
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  mapMarkerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },

  // ── Error Banner ──
  errorBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fee2e2',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 8,
    width: '100%',
  },
  errorBannerText: {
    color: '#b91c1c',
    fontSize: 11,
    fontFamily: 'Sora_500Medium',
  },

  // ── Confirmation Modal Styles ──
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmModalBox: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
  },
  confirmBadgeRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  confirmBadgeCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level2,
  },
  confirmTitle: {
    fontSize: 19,
    fontFamily: 'Sora_600SemiBold',
    letterSpacing: -0.3,
    textAlign: 'center',
    marginBottom: 4,
  },
  confirmSub: {
    fontSize: 12,
    fontFamily: 'Sora_400Regular',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  confirmReceiptCard: {
    width: '100%',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    gap: 8,
    marginBottom: 20,
  },
  confirmReceiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confirmReceiptLabel: {
    fontSize: 11.5,
    fontFamily: 'Sora_400Regular',
  },
  confirmReceiptVal: {
    fontSize: 12,
    fontFamily: 'Sora_500Medium',
    maxWidth: '62%',
    textAlign: 'right',
  },
  confirmDivider: {
    height: 1,
    marginVertical: 4,
  },
  confirmTotalLabel: {
    fontSize: 13,
    fontFamily: 'Sora_600SemiBold',
  },
  confirmTotalVal: {
    fontSize: 16,
    fontFamily: 'Sora_600SemiBold',
  },
  confirmActionRow: {
    width: '100%',
    gap: 10,
  },
  confirmPrimaryBtn: {
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level1,
  },
  confirmPrimaryBtnText: {
    color: '#ffffff',
    fontFamily: 'Sora_600SemiBold',
    fontSize: 13.5,
  },
  confirmSecondaryBtn: {
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  confirmSecondaryBtnText: {
    fontFamily: 'Sora_500Medium',
    fontSize: 12.5,
  },

  // ── Camp & Schedule Details Styles ──
  sportBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sportBadgeText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 10.5,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  classDetailsCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginVertical: 4,
  },
  classDetailsTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  classDetailsCampName: {
    fontSize: 14,
    fontFamily: 'Sora_600SemiBold',
    letterSpacing: -0.2,
  },
  classDetailsCoachName: {
    fontSize: 11,
    fontFamily: 'Sora_400Regular',
    marginTop: 2,
  },
  seatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  seatPillText: {
    fontSize: 10,
    fontFamily: 'Sora_600SemiBold',
  },
  classDetailsDivider: {
    height: 1,
    marginVertical: 10,
  },
  classGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  classGridCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    padding: 8,
    borderRadius: 10,
  },
  classGridCellHalf: {
    width: '48.5%',
  },
  classGridCellFull: {
    width: '100%',
  },
  classGridIcon: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  classGridTextCol: {
    flex: 1,
  },
  classGridLabel: {
    fontSize: 9.5,
    fontFamily: 'Sora_400Regular',
    letterSpacing: 0.2,
  },
  classGridValue: {
    fontSize: 11.5,
    fontFamily: 'Sora_500Medium',
    marginTop: 1,
  },
});
