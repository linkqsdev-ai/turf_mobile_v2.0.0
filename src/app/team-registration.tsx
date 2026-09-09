import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Animated,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

import { ThemedText, MAX_FONT_SCALE } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GradientContainer } from '@/components/gradient-container';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useTournamentStore, useOfferStore, useWalletStore } from '@/store/app-store';
import {
  registrationBlocker,
  registrationBlockedMessage,
  spotsRemaining,
} from '@/store/tournament-store';
import { getOffersForTurf, isRedeemable, OwnerOffer } from '@/store/offer-store';
import { OfferCoupon, LocationCard } from '@/components/offer-coupon';
import { ConfirmationView } from '@/components/confirmation-view';
import { SectionHeading, FormCard } from '@/components/form-section';
import { MASCOT_KEYS, getMascotImage } from '@/constants/mascots';
import { toAmount } from '@/constants/tournament';
import { formatPhoneNumber, cleanPhoneDigits, getPhoneValidationError, isValidMobile } from '@/utils/phone-utils';

interface SquadPlayer {
  id: string;
  name: string;
  role: string;
  /** Optional contact for this player. */
  phone?: string;
  idUploaded: boolean;
  idType?: string;
}

const PAYMENT_METHODS = [
  { id: 'apple',  label: 'Apple Pay',   icon: 'logo-apple',   family: 'Ionicons', color: '#000000' },
  { id: 'gpay',   label: 'Google Pay',  icon: 'logo-google',  family: 'Ionicons', color: '#ea4335' },
  { id: 'credit', label: 'Credit Card', icon: 'card',         family: 'Ionicons', color: '#ff5722' },
  { id: 'debit',  label: 'Debit Card',  icon: 'card-outline', family: 'Ionicons', color: '#0f9d58' },
  { id: 'transfer', label: 'Bank Transfer', icon: 'business-outline', family: 'Ionicons', color: '#5D68E8' },
];

export default function TeamRegistrationScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();

  // Derived from route params, declared here because the pricing lookup below
  // reads them during render — a `const` used above its declaration is in the
  // temporal dead zone and throws rather than reading as undefined.
  const tournamentName = (params.name as string) || 'London Cup 2026';
  const tournamentId = (params.id as string) || '';
  const { profile } = useUserProfile();
  const { publishedTournaments, registrations, registerForTournament } = useTournamentStore();
  const { offers, redeemOffer } = useOfferStore();
  const { walletBalance, deductWalletFunds } = useWalletStore();
  const role = profile.role || 'Player';

  // Mode state: 'user' or 'admin'
  const [registrationRef, setRegistrationRef] = useState('');
  const [appliedOffer, setAppliedOffer] = useState<OwnerOffer | null>(null);
  /** Team crest. Registrations carried no logo, so every team showed the same
      sport emoji on the tournament's Teams tab. */
  const [teamMascot, setTeamMascot] = useState<string>(MASCOT_KEYS[0]);

  // Mandatory Form Fields & Input States
  const [teamName, setTeamName] = useState('');
  const [managerName, setManagerName] = useState(profile.name || '');
  const [managerPhone, setManagerPhone] = useState(profile.phone || '');
  const [managerEmail, setManagerEmail] = useState(profile.email || '');

  // Error state for mandatory fields
  const [errors, setErrors] = useState<{ teamName?: boolean; managerName?: boolean; managerPhone?: boolean }>({});

  // Payment Options (matching booking.tsx)
  const [useWallet, setUseWallet] = useState(false);
  const [walletInputAmount, setWalletInputAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('apple');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Squad Players state (Each item = 1 Person)
  const [squad, setSquad] = useState<SquadPlayer[]>([
    { id: 'p1', name: 'Marcus Vance', role: 'Captain / Forward', idUploaded: true, idType: 'Driving License' },
    { id: 'p2', name: 'Rob Miller', role: 'Goalkeeper', idUploaded: false },
  ]);

  // Loading / Processing states
  const [isPaying, setIsPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);

  // Admin Data State

  // Custom Toast State
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastOpacity = useState(new Animated.Value(0))[0];

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    Animated.sequence([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.delay(2200),
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => setToastMsg(null));
  };

  // Field Input Sanitizers & Constraints
  const handleTeamNameChange = (text: string) => {
    // Characters/letters & spaces ONLY up to 30 chars
    const sanitized = text.replace(/[^a-zA-Z\s]/g, '').slice(0, 30);
    setTeamName(sanitized);
    if (sanitized.trim()) setErrors(prev => ({ ...prev, teamName: false }));
  };

  const handleManagerNameChange = (text: string) => {
    // Characters/letters & spaces ONLY up to 40 chars
    const sanitized = text.replace(/[^a-zA-Z\s]/g, '').slice(0, 40);
    setManagerName(sanitized);
    if (sanitized.trim()) setErrors(prev => ({ ...prev, managerName: false }));
  };

  const handleManagerPhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setManagerPhone(formatted);
    if (formatted.trim()) setErrors(prev => ({ ...prev, managerPhone: false }));
  };

  const handleManagerEmailChange = (text: string) => {
    // Max 50 chars, no spaces
    const sanitized = text.replace(/\s/g, '').slice(0, 50);
    setManagerEmail(sanitized);
  };

  const handleAddPlayer = () => {
    const newId = `p_${Date.now()}`;
    setSquad([...squad, { id: newId, name: '', role: 'Player', phone: '', idUploaded: false }]);
  };

  const handleRemovePlayer = (id: string) => {
    setSquad(squad.filter(p => p.id !== id));
  };

  const updatePlayerName = (id: string, name: string) => {
    // Characters/letters & spaces ONLY up to 40 chars
    const sanitized = name.replace(/[^a-zA-Z\s]/g, '').slice(0, 40);
    setSquad(squad.map(p => p.id === id ? { ...p, name: sanitized } : p));
  };

  const updatePlayerPhone = (id: string, phone: string) => {
    // Digits only, capped at a 10-digit mobile — the same rule the manager
    // contact field uses.
    const digits = phone.replace(/\D/g, '').slice(0, 10);
    setSquad(squad.map(p => (p.id === id ? { ...p, phone: digits } : p)));
  };

  const updatePlayerRole = (id: string, role: string) => {
    // Alphanumeric, spaces, slashes up to 30 chars
    const sanitized = role.replace(/[^a-zA-Z0-9\s/]/g, '').slice(0, 30);
    setSquad(squad.map(p => p.id === id ? { ...p, role: sanitized } : p));
  };

  const handleUploadId = (id: string) => {
    setSquad(squad.map(p => p.id === id ? { ...p, idUploaded: true, idType: 'National ID / Driving License' } : p));
    triggerToast('✅ Player ID Document attached successfully!');
  };

  // Pricing read from the tournament being registered for. The receipt showed
  // ₹150 / ₹25 / ₹175 for every tournament regardless of what the organiser
  // had actually set.
  const tournament = (publishedTournaments || []).find((t: any) => t.id === tournamentId);
  // Parsed rather than coerced: `registrationFee` is stored as the raw form
  // string, so a tournament created before the fee inputs became digits-only
  // holds "₹25" — and Number("₹25") is NaN, which then poisoned the subtotal
  // and rendered "Total Payable ₹NaN".
  /**
   * Offers a team can use here. Keyed on the tournament's venue because that
   * is what owners publish offers against — `getOffersForTurf` also folds in
   * platform-wide ("All Turfs") codes.
   */
  /**
   * Vouchers for this tournament only.
   *
   * This also pulled in the venue's offers, which folds in platform-wide
   * "All Turfs" codes — so a "20% off weekday slots" turf promo appeared
   * beside the tournament's own voucher, branded identically and reading as a
   * duplicate. A slot discount does not apply to a tournament entry fee.
   */
  const tournamentOffers = useMemo(() => {
    const wanted = tournamentName.trim().toLowerCase();
    if (!wanted) return [];
    return (offers || []).filter(
      (o: OwnerOffer) =>
        isRedeemable(o) && (o.appliesTo || '').trim().toLowerCase() === wanted
    );
  }, [tournamentName, offers]);

  /** Registrations already taken for this tournament. */
  const takenCount = useMemo(
    () => (registrations || []).filter((r: any) => r.tournamentId === tournamentId).length,
    [registrations, tournamentId]
  );
  const blocker = registrationBlocker(tournament, takenCount);
  const spotsLeft = spotsRemaining(tournament, takenCount);

  const entryFee = toAmount(tournament?.entryFee, 150);
  const processingFee = toAmount(tournament?.registrationFee, 25);
  const subtotal = entryFee + processingFee;

  // A voucher comes off the bill first, then the wallet covers what is left —
  // otherwise the wallet could pay for a discount that was about to be applied.
  const voucherDiscount = useMemo(() => {
    if (!appliedOffer) return 0;
    if (appliedOffer.discountType === 'percent') {
      return Math.round((subtotal * appliedOffer.discountValue) / 100);
    }
    return Math.min(subtotal, appliedOffer.discountValue);
  }, [appliedOffer, subtotal]);

  const afterVoucher = Math.max(0, subtotal - voucherDiscount);
  const maxAllowedFromAmount = Math.max(1, Math.round(afterVoucher * 0.25));
  const maxWalletDeductible = Math.min(walletBalance, maxAllowedFromAmount);
  const parsedWalletAmount = walletInputAmount === '' ? maxWalletDeductible : Math.min(maxWalletDeductible, Math.max(0, parseFloat(walletInputAmount) || 0));
  const discount = useWallet ? parsedWalletAmount : 0;
  const finalPayable = Math.max(0, afterVoucher - discount);

  const applyOffer = (code: string) => {
    const found = (offers || []).find(
      (o: OwnerOffer) => o.code.toUpperCase() === code.trim().toUpperCase() && isRedeemable(o)
    );
    if (!found) {
      triggerToast('⚠️ That voucher is no longer available');
      return;
    }
    if (found.minBooking > 0 && subtotal < found.minBooking) {
      triggerToast(`⚠️ Minimum ₹${found.minBooking} required for ${found.code}`);
      return;
    }
    setAppliedOffer(found);
    triggerToast(`🎟️ ${found.code} applied`);
  };

  const handlePayment = () => {
    const newErrors: { teamName?: boolean; managerName?: boolean; managerPhone?: boolean } = {};

    if (!teamName.trim()) newErrors.teamName = true;
    if (!managerName.trim()) newErrors.managerName = true;
    if (!managerPhone.trim()) newErrors.managerPhone = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      triggerToast('⚠️ Please fill in all mandatory fields (*)');
      return;
    }

    const phoneErr = getPhoneValidationError(managerPhone, true);
    if (phoneErr) {
      setErrors(prev => ({ ...prev, managerPhone: true }));
      triggerToast(`⚠️ ${phoneErr}`);
      return;
    }

    if (managerEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(managerEmail.trim())) {
      triggerToast('⚠️ Please enter a valid email address');
      return;
    }

    // Re-checked here, not just on render: the last place can be taken while
    // this form is open, and a refusal must stop before anything is charged.
    const blockedNow = registrationBlocker(tournament, takenCount);
    if (blockedNow) {
      triggerToast(`⚠️ ${registrationBlockedMessage(blockedNow, tournamentName)}`);
      return;
    }

    setIsPaying(true);
    // Simulate payment API latency
    setTimeout(() => {
      // Record the registration. This step did not exist — the screen showed a
      // confirmation without writing anything, so the organiser never saw the
      // team and the tournament's team count never moved.
      const reg = registerForTournament({
        tournamentId: tournamentId || 'unknown',
        tournamentName,
        teamId: `team-${Date.now()}`,
        teamName: teamName.trim(),
        teamMascot,
        // Optional: only rows the user actually filled in are kept, so an
        // untouched placeholder never becomes a nameless squad member.
        squad: squad
          .filter(pl => pl.name.trim().length > 0)
          .map((pl, i) => ({
            id: pl.id,
            name: pl.name.trim(),
            role: pl.role?.trim() || 'Player',
            jersey: String(i + 1),
            ...(pl.phone?.trim() ? { phone: pl.phone.trim() } : {}),
          })),
        sport: tournament?.sport || 'Cricket',
        status: 'confirmed',
        paymentStatus: 'paid',
        entryFee,
      });
      // Claim the code now that the registration exists. Applying it above
      // only previews the discount, so an abandoned form never burns a slot.
      if (appliedOffer) {
        const claim = redeemOffer(appliedOffer.code);
        if (!claim.ok) triggerToast('⚠️ That voucher was fully claimed — charged at full price');
      }
      if (useWallet && discount > 0) {
        deductWalletFunds(discount);
      }
      setRegistrationRef(reg.id.toUpperCase());
      setIsPaying(false);
      setPaySuccess(true);
      triggerToast('🎉 Payment & Registration Successful!');
    }, 2000);
  };



  return (
    <GradientContainer screenName="team-registration" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Header Stack Bar */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/tournaments')}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </Pressable>
          <ThemedText numberOfLines={1} style={{ color: theme.text, flex: 1, marginLeft: 12, fontSize: 13, fontFamily: 'Sora_500Medium' }}>
            Register for {tournamentName}
          </ThemedText>
        </View>


          <>
          {/* USER REGISTRATION FLOW */}
          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
            {paySuccess ? (
              /* Same confirmation design as a turf booking — one component, so
                 the two do not drift into looking like different products. */
              <ConfirmationView
                title="Registration Confirmed!"
                subtitle={`${teamName} is registered for ${tournamentName}. You can now view fixtures and manage your squad.`}
                referenceLabel="REGISTRATION REFERENCE"
                reference={registrationRef || 'REG-PENDING'}
                infoRows={[
                  { icon: 'trophy-outline', label: 'TOURNAMENT', value: tournamentName },
                  { icon: 'people-outline', label: 'TEAM', value: teamName },
                  { icon: 'person-outline', label: 'MANAGER', value: managerName },
                  { icon: 'call-outline', label: 'CONTACT', value: managerPhone },
                ]}
                breakdown={[
                  { label: 'Entry fee', value: `₹${entryFee.toFixed(2)}` },
                  { label: 'Admin processing', value: `₹${processingFee.toFixed(2)}` },
                  ...(discount > 0
                    ? [{ label: 'Wallet applied', value: `-₹${discount.toFixed(2)}` }]
                    : []),
                ]}
                leftSummary={{ label: 'TOTAL CHARGED', value: `₹${finalPayable.toFixed(2)}` }}
                rightSummary={{ label: 'TEAM SIZE', value: `${squad.length} players` }}
                notice="A confirmation has been sent to your registered contact. Show this reference at the venue desk on match day."
                secondaryAction={{
                  icon: 'trophy-outline',
                  label: 'Back to Cups',
                  onPress: () => router.replace('/(tabs)/tournaments'),
                }}
                primaryAction={{
                  icon: 'home',
                  label: 'Go Home',
                  onPress: () => router.replace('/(tabs)'),
                }}
              />
            ) : (
              <View>
                {/* REDESIGNED HERO BANNER */}
                <View style={styles.heroBannerContainer}>
                  <Image 
                    source={require('@/assets/images/illustrations/tournament_cover.png')} 
                    style={styles.heroBannerImage}
                    contentFit="cover"
                  />
                  <LinearGradient
                    colors={['rgba(15, 23, 42, 0.15)', 'rgba(15, 23, 42, 0.65)', 'rgba(15, 23, 42, 0.9)']}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.heroContent}>
                    <ThemedText style={styles.heroTitle}>{tournamentName}</ThemedText>
                    <View style={styles.heroRow}>
                      <View style={styles.heroMetaPill}>
                        <Ionicons name="calendar-outline" size={11} color="#A5B4FC" style={{ marginRight: 4 }} />
                        <ThemedText style={styles.heroMetaText}>Starts July 15, 2026</ThemedText>
                      </View>
                      <View style={styles.heroMetaPill}>
                        <Ionicons name="location-outline" size={11} color="#A5B4FC" style={{ marginRight: 4 }} />
                        <ThemedText style={styles.heroMetaText}>London Arena</ThemedText>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Stated up front rather than only on submit — filling the
                    whole form to be told it is full is the worst version. */}
                {!!blocker && (
                  <View style={[styles.blockedBanner, { borderColor: '#EF444455', backgroundColor: '#EF444414' }]}>
                    <Ionicons name="alert-circle" size={17} color="#EF4444" />
                    <ThemedText type="bodySm" style={{ color: '#B91C1C', flex: 1, marginLeft: 8 }}>
                      {registrationBlockedMessage(blocker, tournamentName)}
                    </ThemedText>
                  </View>
                )}
                {!blocker && spotsLeft !== null && spotsLeft <= 3 && (
                  <View style={[styles.blockedBanner, { borderColor: '#F59E0B55', backgroundColor: '#F59E0B14' }]}>
                    <Ionicons name="flame" size={17} color="#D97706" />
                    <ThemedText type="bodySm" style={{ color: '#B45309', flex: 1, marginLeft: 8 }}>
                      Only {spotsLeft} {spotsLeft === 1 ? 'place' : 'places'} left in {tournamentName}.
                    </ThemedText>
                  </View>
                )}

                <View style={{ marginTop: 4 }}>
                <SectionHeading title="Team Details" />
                <FormCard>
                <View style={styles.inputGroup}>
                  <ThemedText type="labelSm" style={styles.inputLabel}>Team crest</ThemedText>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
                  >
                    {MASCOT_KEYS.map((key) => {
                      const active = key === teamMascot;
                      return (
                        <Pressable
                          key={key}
                          onPress={() => setTeamMascot(key)}
                          accessibilityRole="button"
                          accessibilityState={{ selected: active }}
                          accessibilityLabel={`Use the ${key} crest`}
                          style={[
                            styles.mascotChip,
                            {
                              borderColor: active ? theme.primary : theme.outlineVariant + '44',
                              backgroundColor: active ? theme.primary + '14' : theme.surfaceLow,
                            },
                          ]}
                        >
                          <Image source={getMascotImage(key)} style={styles.mascotImg} contentFit="contain" />
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>

                <View style={styles.inputGroup}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <ThemedText type="labelSm" style={styles.inputLabel}>
                      Team name <ThemedText style={{ color: theme.error, fontWeight: '500' }}>*</ThemedText>
                    </ThemedText>
                    {errors.teamName ? (
                      <ThemedText type="labelSm" style={{ color: theme.error, fontSize: 10 }}>Required</ThemedText>
                    ) : (
                      <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_500Medium', color: teamName.length >= 30 ? theme.error : theme.textSecondary }}>
                        {teamName.length}/30
                      </ThemedText>
                    )}
                  </View>
                  <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                    style={[styles.textInput, { backgroundColor: theme.surfaceLow, borderColor: errors.teamName ? theme.error : '#00000033', color: theme.text }]}
                    placeholder="Enter team name"
                    placeholderTextColor="#94a3b8"
                    value={teamName}
                    onChangeText={handleTeamNameChange}
                    maxLength={30}
                  />
                </View>
                </FormCard>
                </View>

                <View style={{ marginTop: 16 }}>
                <SectionHeading title="Captain / Manager Details" />
                <FormCard>
                <View style={styles.inputGroup}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <ThemedText type="labelSm" style={styles.inputLabel}>
                      Captain / Manager full name <ThemedText style={{ color: theme.error, fontWeight: '500' }}>*</ThemedText>
                    </ThemedText>
                    {errors.managerName ? (
                      <ThemedText type="labelSm" style={{ color: theme.error, fontSize: 10 }}>Required</ThemedText>
                    ) : (
                      <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_500Medium', color: managerName.length >= 40 ? theme.error : theme.textSecondary }}>
                        {managerName.length}/40
                      </ThemedText>
                    )}
                  </View>
                  <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                    style={[styles.textInput, { backgroundColor: theme.surfaceLow, borderColor: errors.managerName ? theme.error : '#00000033', color: theme.text }]}
                    placeholder="Enter full name"
                    placeholderTextColor="#94a3b8"
                    value={managerName}
                    onChangeText={handleManagerNameChange}
                    maxLength={40}
                  />
                </View>

                <View style={styles.rowBetween}>
                  <View style={[styles.inputGroup, { width: '48%' }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <ThemedText type="labelSm" style={styles.inputLabel}>
                        Phone <ThemedText style={{ color: theme.error, fontWeight: '500' }}>*</ThemedText>
                      </ThemedText>
                      {errors.managerPhone && (
                        <ThemedText type="labelSm" style={{ color: theme.error, fontSize: 10 }}>Required</ThemedText>
                      )}
                    </View>
                    <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                      style={[styles.textInput, { backgroundColor: theme.surfaceLow, borderColor: errors.managerPhone ? theme.error : '#00000033', color: theme.text }]}
                      placeholder="98765 43210"
                      placeholderTextColor="#94a3b8"
                      keyboardType="phone-pad"
                      value={managerPhone}
                      onChangeText={handleManagerPhoneChange}
                      maxLength={11}
                    />
                  </View>
                  <View style={[styles.inputGroup, { width: '48%' }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <ThemedText type="labelSm" style={styles.inputLabel}>Email (Optional)</ThemedText>
                      <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_500Medium', color: managerEmail.length >= 50 ? theme.error : theme.textSecondary }}>
                        {managerEmail.length}/50
                      </ThemedText>
                    </View>
                    <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                      style={[styles.textInput, { backgroundColor: theme.surfaceLow, borderColor: '#00000033', color: theme.text }]}
                      placeholder="john.doe@example.com"
                      placeholderTextColor="#94a3b8"
                      keyboardType="email-address"
                      value={managerEmail}
                      onChangeText={handleManagerEmailChange}
                      maxLength={50}
                    />
                  </View>
                </View>
                </FormCard>
                </View>

                {/* 3. Fees & payments */}
                {/* Vouchers for this tournament's venue. Same coupon card the
                    turf detail screen uses — see components/offer-coupon.tsx. */}
                {tournamentOffers.length > 0 && (
                  <View style={{ marginTop: 16 }}>
                    <SectionHeading
                      title="Vouchers & Offers"
                      right={
                        <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_500Medium', color: '#10b981' }}>
                          {tournamentOffers.length} Active{' '}
                          {tournamentOffers.length === 1 ? 'Offer' : 'Offers'}
                        </ThemedText>
                      }
                    />
                    <FormCard>
                      {appliedOffer && (
                        <View style={[styles.appliedOfferRow, { borderColor: '#10b98155', backgroundColor: '#10b98114' }]}>
                          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                          <ThemedText type="bodySm" style={{ color: '#047857', flex: 1, marginLeft: 8 }}>
                            {appliedOffer.code} applied — you save ₹{voucherDiscount}
                          </ThemedText>
                          <Pressable
                            onPress={() => setAppliedOffer(null)}
                            hitSlop={8}
                            accessibilityRole="button"
                            accessibilityLabel={`Remove voucher ${appliedOffer.code}`}
                          >
                            <ThemedText type="labelSm" style={{ color: theme.primary }}>Remove</ThemedText>
                          </Pressable>
                        </View>
                      )}

                      {tournamentOffers.map((offer) => (
                        <OfferCoupon
                          key={offer.id}
                          offer={offer}
                          brand={tournamentName.toUpperCase()}
                          onApply={applyOffer}
                        />
                      ))}
                    </FormCard>
                  </View>
                )}

                {/* Where to play — the tournament's venue, with directions. */}
                {!!tournament?.location && (
                  <View style={{ marginTop: 16 }}>
                    <SectionHeading title="Location" />
                    <FormCard>
                      <LocationCard name={tournamentName} location={tournament.location} />
                    </FormCard>
                  </View>
                )}

                {/* Squad — optional. A team can register now and name players
                    later, so this never blocks the flow. */}
                <View style={{ marginTop: 16 }}>
                  <SectionHeading
                    title="Squad"
                    right={
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: 10 }}>
                        Optional · {squad.filter(p => p.name.trim()).length} named
                      </ThemedText>
                    }
                  />
                  <FormCard>
                    {squad.map((pl, idx) => (
                      <View key={pl.id} style={styles.squadPlayerRow}>
                        <View style={[styles.squadPlayerNo, { backgroundColor: theme.primary + '14' }]}>
                          <ThemedText type="labelSm" style={{ color: theme.primary, fontSize: 10 }}>
                            {idx + 1}
                          </ThemedText>
                        </View>

                        <View style={{ flex: 1, gap: 6 }}>
                          <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                            style={[
                              styles.textInput,
                              { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33', color: theme.text },
                            ]}
                            placeholder={`Player ${idx + 1} name`}
                            placeholderTextColor="#94a3b8"
                            value={pl.name}
                            maxLength={40}
                            onChangeText={(t) => updatePlayerName(pl.id, t)}
                          />
                          <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                            style={[
                              styles.textInput,
                              { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33', color: theme.text },
                            ]}
                            placeholder="Phone (optional)"
                            placeholderTextColor="#94a3b8"
                            keyboardType="number-pad"
                            maxLength={10}
                            value={pl.phone || ''}
                            onChangeText={(t) => updatePlayerPhone(pl.id, t)}
                          />
                        </View>

                        <Pressable
                          onPress={() => handleRemovePlayer(pl.id)}
                          hitSlop={8}
                          accessibilityRole="button"
                          accessibilityLabel={`Remove player ${idx + 1}`}
                        >
                          <Ionicons name="close-circle" size={19} color={theme.textSecondary} />
                        </Pressable>
                      </View>
                    ))}

                    <Pressable
                      onPress={handleAddPlayer}
                      accessibilityRole="button"
                      accessibilityLabel="Add a player to the squad"
                      style={({ pressed }) => [
                        styles.addPlayerRow,
                        { borderColor: theme.primary + '55', opacity: pressed ? 0.7 : 1 },
                      ]}
                    >
                      <Ionicons name="add" size={16} color={theme.primary} />
                      <ThemedText type="labelSm" style={{ color: theme.primary }}>
                        Add player
                      </ThemedText>
                    </Pressable>

                    <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: 10, marginTop: 8 }}>
                      Players can be added later from the tournament's Teams tab.
                    </ThemedText>
                  </FormCard>
                </View>

                <SectionHeading title="Fees & Payments" style={{ marginTop: 18 }} />
                <View style={[styles.paymentPortal, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
                  
                  {/* Cashback Offer Activation Card */}
                  <View style={styles.cashbackCard}>
                    <View style={styles.cashbackIconBg}>
                      <Ionicons name="gift" size={18} color="#10B981" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={styles.cashbackTitle}>Cashback Offer Activated!</ThemedText>
                      <ThemedText style={styles.cashbackSubtitle}>
                        Get ₹25.00 Cashback credited instantly to your Turf Wallet upon registration.
                      </ThemedText>
                    </View>
                  </View>

                  {/* Wallet Option Card with Enter Amount to Reduce */}
                  <View style={[styles.walletCard, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33', flexDirection: 'column', alignItems: 'stretch' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 8 }}>
                        <View style={styles.walletIconCircle}>
                          <Ionicons name="wallet-outline" size={18} color={theme.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <ThemedText style={{ fontSize: 13, fontWeight: '500', color: theme.text }}>
                            Pay with Wallet Balance
                          </ThemedText>
                          <ThemedText style={{ fontSize: 11, color: theme.textSecondary, marginTop: 1 }}>
                            Available Balance: ₹{walletBalance.toFixed(2)}
                          </ThemedText>
                        </View>
                      </View>
                      {walletBalance > 0 ? (
                        <Pressable 
                          onPress={() => {
                            if (!useWallet && walletInputAmount === '') {
                              setWalletInputAmount(String(maxWalletDeductible));
                            }
                            setUseWallet(!useWallet);
                          }}
                          style={[styles.applyWalletBtn, { backgroundColor: useWallet ? theme.primary : theme.surfaceLowest }]}
                        >
                          <ThemedText style={{ fontSize: 11, fontWeight: '500', color: useWallet ? '#ffffff' : theme.text }}>
                            {useWallet ? 'Applied' : 'Apply'}
                          </ThemedText>
                          <Ionicons name={useWallet ? 'checkmark-circle' : 'add-circle-outline'} size={14} color={useWallet ? '#ffffff' : theme.textSecondary} />
                        </Pressable>
                      ) : (
                        <ThemedText style={{ fontSize: 11, color: theme.textSecondary, fontStyle: 'italic' }}>
                          Empty
                        </ThemedText>
                      )}
                    </View>

                    {useWallet && walletBalance > 0 && (
                      <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.outlineVariant + '22' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <ThemedText style={{ fontSize: 11.5, color: theme.textSecondary }}>
                            Enter amount to reduce (Max 25%):
                          </ThemedText>
                          <ThemedText style={{ fontSize: 11, color: theme.primary, fontWeight: '600' }}>
                            Max: ₹{maxWalletDeductible.toFixed(2)}
                          </ThemedText>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surfaceLowest, borderRadius: 8, borderWidth: 1, borderColor: theme.outlineVariant + '33', paddingHorizontal: 10, height: 36 }}>
                            <ThemedText style={{ fontSize: 13, fontWeight: '500', color: theme.textSecondary, marginRight: 4 }}>₹</ThemedText>
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
                              style={{ flex: 1, fontSize: 13, color: theme.text, height: 34, ...({ outlineStyle: 'none' } as any) }}
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
                            <ThemedText style={{ fontSize: 11, fontWeight: '600', color: theme.primary }}>
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
                                  backgroundColor: isSelected ? theme.primary : theme.surfaceLowest,
                                  borderWidth: 1,
                                  borderColor: isSelected ? theme.primary : theme.outlineVariant + '22',
                                }}
                              >
                                <ThemedText style={{ fontSize: 10, fontWeight: '500', color: isSelected ? '#ffffff' : theme.textSecondary }}>
                                  {ratio === 1 ? 'Use Max 25%' : `Use ${(ratio * 25).toFixed(0)}%`} (₹{amount})
                                </ThemedText>
                              </Pressable>
                            );
                          })}
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
                          <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                          <ThemedText style={{ fontSize: 10.5, color: '#10B981', fontWeight: '500' }}>
                            ₹{discount.toFixed(2)} will be reduced from your registration fee (Max 25% wallet limit).
                          </ThemedText>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Payment Methods Selection Grid */}
                  <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginBottom: 8, marginTop: 4, fontWeight: '500', fontSize: 10 }}>Select Payment Method</ThemedText>
                  <View style={{ gap: 10 }}>
                    {PAYMENT_METHODS.map(pm => {
                      const isSelected = paymentMethod === pm.id;
                      return (
                        <Pressable
                          key={pm.id}
                          onPress={() => setPaymentMethod(pm.id)}
                          style={[
                            styles.payMethodCard,
                            { borderColor: theme.outlineVariant + '40', backgroundColor: theme.surfaceLowest },
                            isSelected && { borderColor: theme.primary, backgroundColor: theme.primaryContainer + '20' }
                          ]}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                              {pm.id === 'gpay' ? (
                                <Ionicons name="logo-google" size={20} color="#ea4335" style={{ width: 28, textAlign: 'center' }} />
                              ) : pm.family === 'Ionicons' ? (
                                <Ionicons name={pm.icon as any} size={20} color={isSelected ? theme.primary : pm.color} style={{ width: 28, textAlign: 'center' }} />
                              ) : (
                                <FontAwesome5 name={pm.icon as any} size={18} color={isSelected ? theme.primary : pm.color} style={{ width: 28, textAlign: 'center' }} />
                              )}
                              <ThemedText type="bodySm" style={{ marginLeft: 10, fontWeight: isSelected ? 'bold' : '500', color: theme.text, fontSize: 13 }}>
                                {pm.label}
                              </ThemedText>
                            </View>
                            <View style={[styles.radioOuter, isSelected && { borderColor: theme.primary }]}>
                              {isSelected && <View style={[styles.radioInner, { backgroundColor: theme.primary }]} />}
                            </View>
                          </View>

                          {/* Expanded Card Form for Credit & Debit Card */}
                          {isSelected && (pm.id === 'credit' || pm.id === 'debit') && (
                            <View style={styles.cardInputGroup}>
                              <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE} 
                                placeholder="Card Number (4000 1234 5678 9010)" 
                                placeholderTextColor="#94a3b8"
                                style={[styles.cardTextInput, { borderColor: '#00000033', color: theme.text }]} 
                                keyboardType="number-pad"
                                value={cardNumber}
                                onChangeText={setCardNumber}
                                maxLength={19}
                              />
                              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                                <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE} 
                                  placeholder="MM/YY" 
                                  placeholderTextColor="#94a3b8"
                                  style={[styles.cardTextInput, { flex: 1, borderColor: '#00000033', color: theme.text }]} 
                                  value={cardExpiry}
                                  onChangeText={setCardExpiry}
                                  maxLength={5}
                                />
                                <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE} 
                                  placeholder="CVV" 
                                  placeholderTextColor="#94a3b8"
                                  style={[styles.cardTextInput, { flex: 1, borderColor: '#00000033', color: theme.text }]} 
                                  keyboardType="number-pad"
                                  secureTextEntry
                                  value={cardCvv}
                                  onChangeText={setCardCvv}
                                  maxLength={4}
                                />
                              </View>
                            </View>
                          )}

                          {isSelected && (pm.id === 'apple' || pm.id === 'gpay') && (
                            <View style={styles.payRedirectNote}>
                              <Ionicons name="shield-checkmark" size={14} color="#10B981" style={{ marginRight: 6 }} />
                              <ThemedText style={{ fontSize: 11, color: theme.textSecondary, flex: 1 }}>
                                Fast 1-Touch Checkout via {pm.label}. Authenticate with Touch/Face ID.
                              </ThemedText>
                            </View>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Fee Breakdown Summary */}
                  <View style={[styles.feeBreakdown, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '22' }]}>
                    <View style={styles.rowBetween}>
                      <ThemedText type="bodySm" style={{ color: theme.textSecondary }}>Tournament Entry Fee</ThemedText>
                      <ThemedText type="bodySm" style={{ color: theme.text, fontWeight: '500' }}>₹{entryFee.toFixed(2)}</ThemedText>
                    </View>
                    <View style={[styles.rowBetween, { marginTop: 8 }]}>
                      <ThemedText type="bodySm" style={{ color: theme.textSecondary }}>Admin & Processing Fee</ThemedText>
                      <ThemedText type="bodySm" style={{ color: theme.text, fontWeight: '500' }}>₹{processingFee.toFixed(2)}</ThemedText>
                    </View>
                    {useWallet && (
                      <View style={[styles.rowBetween, { marginTop: 8 }]}>
                        <ThemedText type="bodySm" style={{ color: '#10B981', fontWeight: '500' }}>Wallet Balance Applied</ThemedText>
                        <ThemedText type="bodySm" style={{ color: '#10B981', fontWeight: '500' }}>-₹{discount.toFixed(2)}</ThemedText>
                      </View>
                    )}
                    <View style={[styles.rowBetween, { borderTopWidth: 1, borderTopColor: theme.outlineVariant + '33', marginTop: 12, paddingTop: 10 }]}>
                      <ThemedText type="bodySm" style={{ color: theme.text, fontWeight: '500' }}>Total Payable Amount</ThemedText>
                      <ThemedText type="bodyLg" style={{ color: theme.secondaryContainer, fontWeight: '500', fontSize: 16 }}>₹{finalPayable.toFixed(2)}</ThemedText>
                    </View>
                  </View>

                  <View style={styles.securityBadge}>
                    <Ionicons name="lock-closed" size={12} color="#10B981" style={{ marginRight: 6 }} />
                    <ThemedText style={{ fontSize: 10.5, color: theme.textSecondary }}>
                      256-Bit SSL Encrypted Payment · Official League Authorization
                    </ThemedText>
                  </View>

                </View>
              </View>
            )}
          </ScrollView>

          {/* Sticky Bottom Footer for Pay & Submit Registration */}
          {!paySuccess && (
            <View style={[styles.fixedSubmitFooter, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: 10 }}>Total Payable</ThemedText>
                <ThemedText type="headlineSm" style={{ color: theme.secondaryContainer, fontWeight: '500' }}>₹{finalPayable.toFixed(2)}</ThemedText>
              </View>

              {isPaying ? (
                <View style={[styles.paySubmitBtnGradient, { justifyContent: 'center', width: 220 }]}>
                  <ActivityIndicator size="small" color="#ffffff" />
                </View>
              ) : (
                <Pressable
                  onPress={handlePayment}
                  disabled={!!blocker}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !!blocker }}
                  accessibilityLabel={
                    blocker
                      ? registrationBlockedMessage(blocker, tournamentName)
                      : 'Pay and submit registration'
                  }
                  style={[Shadows.level2, { width: 220, opacity: blocker ? 0.5 : 1 }]}
                >
                  <LinearGradient
                    colors={blocker ? ['#94A3B8', '#64748B'] : ['#5D68E8', '#ff8c00']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.paySubmitBtnGradient}
                  >
                    <ThemedText type="labelMd" style={{ color: '#ffffff', fontWeight: '500', fontSize: 12, letterSpacing: 0.5 }}>
                      {blocker === 'full'
                        ? 'TOURNAMENT FULL'
                        : blocker
                          ? 'REGISTRATION CLOSED'
                          : 'PAY & SUBMIT REGISTRATION'}
                    </ThemedText>
                  </LinearGradient>
                </Pressable>
              )}
            </View>
          )}
        </>
      </SafeAreaView>

      {/* Floating Toast Notification */}
      {toastMsg && (
        <Animated.View style={[styles.toastContainer, { opacity: toastOpacity, backgroundColor: theme.primaryContainer }]}>
          <ThemedText type="labelSm" style={{ color: '#ffffff' }}>{toastMsg}</ThemedText>
        </Animated.View>
      )}
    </GradientContainer>
  );
}

const styles = StyleSheet.create({
  squadPlayerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10 },
  squadPlayerNo: {
    marginTop: 9,
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  mascotChip: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotImg: { width: 34, height: 34 },
  blockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginBottom: 12,
  },
  appliedOfferRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginBottom: 12,
  },
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.containerMargin,
    paddingVertical: Spacing.md,
    zIndex: 10,
  },
  backBtn: {
    padding: 4,
  },
  modeSwapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.containerMargin,
    borderRadius: BorderRadius.xl,
    padding: 6,
    marginBottom: Spacing.md,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
  },
  formScroll: {
    flex: 1,
    paddingHorizontal: Spacing.containerMargin,
  },
  // Metrics matched to the enrolment form so the two registration flows read
  // as one product — see components/form-section.tsx.
  inputGroup: {
    marginBottom: 10,
  },
  inputLabel: {
    marginBottom: 5,
    fontSize: 11.5,
    fontFamily: 'Sora_500Medium',
    color: '#64748b',
  },
  textInput: {
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 12.5,
    fontFamily: 'Sora_400Regular',
    includeFontPadding: false,
    paddingVertical: 0,
    ...({ outlineStyle: 'none' } as any),
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rosterSection: {
    gap: Spacing.sm,
  },
  playerFormCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 24,
    padding: Spacing.md,
    backgroundColor: '#ffffff',
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  playerInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  playerInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.sm,
    height: 40,
    fontSize: 12,
    fontFamily: 'Sora_400Regular',
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
    marginTop: 8,
  },
  addPlayerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: Spacing.xs,
  },
  paymentPortal: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 24,
    padding: Spacing.md,
    marginTop: Spacing.xs,
    backgroundColor: '#ffffff',
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 12,
  },
  payMethodCard: {
    width: '100%',
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignSelf: 'stretch',
  },
  paySubmitBtn: {
    height: 48,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  paySubmitBtnGradient: {
    height: 48,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  invoiceMock: {
    width: '100%',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    marginTop: 24,
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  invoiceBackBtn: {
    marginTop: 24,
    height: 48,
    width: '100%',
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Admin Styles
  adminTable: {
    gap: 12,
    marginTop: Spacing.xs,
  },
  adminCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 24,
    shadowColor: '#1a2a33',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
    backgroundColor: '#ffffff',
    marginBottom: 16,
  },
  adminTeamLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#5D68E8',
  },
  mockHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  mockTitleText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10,
    flex: 1,
  },
  mockSubheaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  mockSubheaderLeft: {
    fontSize: 10,
    fontWeight: '500',
    color: '#81919c',
    letterSpacing: 0.5,
  },
  mockSubheaderRightBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5D68E815',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  },
  mockSubheaderRight: {
    fontSize: 10,
    fontWeight: '500',
    color: '#5D68E8',
  },
  mockSeparator: {
    height: 1,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  mockMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  mockMainLeftText: {
    fontSize: 13,
    fontWeight: '500',
  },
  mockMainRightText: {
    fontSize: 12,
    color: '#43474b',
  },
  mockInvoiceBox: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    marginBottom: 16,
  },
  mockInvoiceTop: {
    padding: 12,
    backgroundColor: '#f8fafc',
  },
  mockInvoiceDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mockInvoiceLabel: {
    fontSize: 11,
    color: '#43474b',
    width: 50,
  },
  mockInvoiceVal: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  mockInvoiceBottom: {
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mockInvoiceBottomGradient: {
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  mockTotalLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#43474b',
  },
  mockTotalVal: {
    fontSize: 13,
    fontWeight: '500',
  },
  mockBtnRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  adminBtnSecondary: {
    flex: 1,
    height: 38,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  mockFullWidthBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 44,
    borderRadius: BorderRadius.xl,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  mockFullWidthBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  mockFullWidthBtnContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#ff8c00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  mockFullWidthBtnGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 44,
  },
  mockFullWidthBtnTextGradient: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  toastContainer: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: BorderRadius.premium,
    zIndex: 999,
  },
  heroBannerContainer: {
    height: 160,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    width: '100%',
  },
  heroBannerImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    borderRadius: 20,
  },
  heroContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 14,
  },
  heroTitle: {
    fontSize: 19,
    fontWeight: '500',
    color: '#ffffff',
    fontFamily: 'Sora_500Medium',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderColor: 'rgba(255, 255, 255, 0.28)',
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 14,
  },
  heroMetaText: {
    fontSize: 10.5,
    color: '#ffffff',
    fontWeight: '500',
  },
  trophyIllustrationContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 12,
  },
  trophyOuterRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#5D68E812',
    borderWidth: 1,
    borderColor: '#5D68E833',
    borderStyle: 'dashed',
  },
  trophyMidRing: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#5D68E818',
  },
  trophyInnerCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ff8c00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sparkle: {
    position: 'absolute',
  },
  cashbackCard: {
    backgroundColor: '#10B98115',
    borderColor: '#10B98133',
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.md,
  },
  cashbackIconBg: {
    backgroundColor: '#10B98125',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cashbackTitle: {
    fontSize: 12.5,
    fontFamily: 'Sora_500Medium',
    color: '#10B981',
  },
  cashbackSubtitle: {
    fontSize: 10.5,
    color: '#64748b',
    marginTop: 1,
  },
  walletCard: {
    borderRadius: BorderRadius.lg,
    padding: 12,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  walletIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(93, 104, 232, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyWalletBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(93, 104, 232, 0.3)',
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  cardInputGroup: {
    width: '100%',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
  },
  cardTextInput: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: 12,
    fontFamily: 'Sora_400Regular',
    includeFontPadding: false,
  },
  payRedirectNote: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
  },
  feeBreakdown: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  fixedSubmitFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.containerMargin,
    paddingVertical: 14,
    borderTopWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 12,
  },
});
