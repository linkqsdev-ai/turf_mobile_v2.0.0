import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Clipboard,
  Platform,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Reanimated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemedText, MAX_FONT_SCALE } from '@/components/themed-text';
import { GradientContainer } from '@/components/gradient-container';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useClassStore, useOfferStore, useWalletStore } from '@/store/app-store';
import { paymentApi, PaymentsUnavailableError } from '@/services/payment-api';
import { useToast } from '@/context/ToastContext';
import { VOUCHERS, VOUCHER_CATEGORIES, vouchersByCategory } from '@/constants/vouchers';
import { CASHBACK_DEALS, TOURNAMENT_PASSES } from '@/constants/platform-deals';
import {
  OFFER_GROUPS,
  liveOfferDeals,
  resolveCashbackCode,
  type OfferDeal,
  type OfferGroup,
} from '@/utils/wallet-deals';
import {
  DashboardCard,
  DashboardChip,
  DashboardSectionLabel,
  DashboardTabs,
  StatTiles,
} from '@/components/dashboard/analytics-kit';
import { ACCENTS, type Accent } from '@/constants/dashboard-accents';

interface Transaction {
  id: string;
  title: string;
  type: 'credit' | 'debit';
  amount: number;
  date: string;
  category: string;
}


const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 'tx-1', title: 'Welcome Bonus Credited', type: 'credit', amount: 200, date: '06 Aug 2026, 02:30 PM', category: 'Bonus' },
  { id: 'tx-2', title: 'Skyline Arena Slot Booking', type: 'debit', amount: 150, date: '05 Aug 2026, 07:15 PM', category: 'Booking' },
  { id: 'tx-3', title: 'Tournament Cashback Reward', type: 'credit', amount: 100, date: '03 Aug 2026, 11:00 AM', category: 'Cashback' },
  { id: 'tx-4', title: 'Wallet Top-up via UPI', type: 'credit', amount: 500, date: '01 Aug 2026, 04:45 PM', category: 'Topup' },
  { id: 'tx-5', title: 'Grid Futsal Advance Payment', type: 'debit', amount: 300, date: '28 Jul 2026, 09:20 AM', category: 'Booking' },
];

/** Cashback codes already credited on this device. */
const REDEEMED_CASHBACK_KEY = '@turf_redeemed_cashback';

const OFFER_LOOK: Record<OfferGroup, { accent: Accent; icon: keyof typeof Ionicons.glyphMap; emoji: string }> = {
  'Venue Offers': { accent: ACCENTS.primary, icon: 'football', emoji: '🏟️' },
  'Class Offers': { accent: ACCENTS.green, icon: 'school', emoji: '🎓' },
  'Tournament Passes': { accent: ACCENTS.orange, icon: 'trophy', emoji: '🏆' },
};

export default function WalletScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { showSuccess, showError, showInfo } = useToast();
  const { walletBalance, addWalletFunds, cashbackCredits } = useWalletStore();
  const { offers } = useOfferStore();
  const { classes } = useClassStore();

  const [activeTab, setActiveTab] = useState<'vouchers' | 'offers' | 'cashback' | 'history'>('vouchers');

  // Cashback codes already credited, so each code pays out once. Redemption
  // checks the ref, so a quick double tap can't credit the same code twice.
  const [redeemedCashback, setRedeemedCashback] = useState<string[]>([]);
  const redeemedRef = useRef<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(REDEEMED_CASHBACK_KEY)
      .then((raw) => {
        const stored = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(stored)) return;
        const merged = Array.from(new Set([...stored, ...redeemedRef.current]));
        redeemedRef.current = merged;
        setRedeemedCashback(merged);
      })
      .catch(() => {});
  }, []);

  // Every offer a player can use right now: venue and class offers, and tournament passes.
  const offerDeals = useMemo(() => liveOfferDeals(offers || [], classes || [], TOURNAMENT_PASSES), [offers, classes]);
  // Discount codes, which the redeem box sends to checkout instead of crediting.
  const bookingCodes = useMemo(
    () => [...VOUCHERS.map((v) => v.code), ...(offers || []).map((o) => o.code), ...offerDeals.map((d) => d.code)],
    [offers, offerDeals]
  );
  const cashbackLeft = CASHBACK_DEALS.filter((d) => !redeemedCashback.includes(d.code)).length;
  const dealsCount = VOUCHERS.length + offerDeals.length + CASHBACK_DEALS.length;
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'credit' | 'debit'>('all');

  // Top Up Modal State
  const [topUpModalVisible, setTopUpModalVisible] = useState(false);
  const [isToppingUp, setIsToppingUp] = useState(false);
  const [customAmount, setCustomAmount] = useState('200');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');

  // Voucher Input State
  const [promoCodeInput, setPromoCodeInput] = useState('');

  // Toast Banner State
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(toastOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setToastMsg(null));
  };

  /**
   * Top up the wallet.
   *
   * This used to call `addWalletFunds` directly, so tapping "Add money"
   * credited the balance without charging anything. Money may only enter the
   * wallet against a payment the server has verified, so the credit now happens
   * after `paymentApi`, never before it.
   */
  const handleTopUp = async (amountToAdd: number) => {
    if (isNaN(amountToAdd) || amountToAdd <= 0) {
      showError('Please enter a valid amount');
      triggerToast('⚠️ Please enter a valid amount');
      return;
    }
    if (isToppingUp) return;

    setIsToppingUp(true);
    try {
      const order = await paymentApi.createOrder('wallet_topup', undefined, amountToAdd);

      // Checkout itself is not wired up yet, so stop here rather than crediting
      // an order nobody has paid. The balance moves only once the gateway
      // returns a signature and /payments/verify accepts it.
      setTopUpModalVisible(false);
      showError(
        'Payment not completed',
        `Order ${order.orderId} was created for ₹${amountToAdd}, but checkout is not connected yet. ` +
          'Your wallet has not been credited and you have not been charged.'
      );
    } catch (err: any) {
      setTopUpModalVisible(false);
      if (err instanceof PaymentsUnavailableError) {
        showError('Payments unavailable', err.message);
      } else {
        showError('Top-up failed', err?.message || 'Could not reach the payment service.');
      }
    } finally {
      setIsToppingUp(false);
    }
  };

  /**
   * Redeem — cashback only. A cashback code credits its fixed amount once.
   * Vouchers and offers are booking discounts taken at checkout, so they are
   * turned away here rather than paid out as wallet cash (which also used to
   * spend one of a capped offer's claims for nothing).
   */
  const redeemCashback = (input: string) => {
    const result = resolveCashbackCode(input, CASHBACK_DEALS, redeemedRef.current, bookingCodes);
    switch (result.status) {
      case 'empty':
        showError('Enter a cashback code');
        triggerToast('⚠️ Enter a cashback code');
        return;
      case 'already_redeemed':
        showError('Already redeemed', `${result.deal.code} has already been credited to your wallet.`);
        triggerToast(`❌ ${result.deal.code} was already redeemed`);
        return;
      case 'not_cashback':
        showInfo(
          'Use this code at checkout',
          `${result.code} is a booking voucher, not cashback — apply it when you book or register.`
        );
        triggerToast(`🎟️ ${result.code} applies at checkout`);
        return;
      case 'invalid':
        showError('Invalid cashback code', 'Check the code, or pick one from the Cashback tab.');
        triggerToast('❌ Invalid cashback code');
        return;
      case 'credit': {
        const { deal } = result;
        const next = [...redeemedRef.current, deal.code];
        redeemedRef.current = next;
        setRedeemedCashback(next);
        AsyncStorage.setItem(REDEEMED_CASHBACK_KEY, JSON.stringify(next)).catch(() => {});
        addWalletFunds(deal.amount);
        setTransactions((prev) => [
          {
            id: `tx-${Date.now()}`,
            title: `${deal.title} (${deal.code})`,
            type: 'credit',
            amount: deal.amount,
            date: 'Just Now',
            category: 'Cashback',
          },
          ...prev,
        ]);
        setPromoCodeInput('');
        showSuccess(`💰 ₹${deal.amount} cashback credited`, `${deal.code} · ${deal.title}`);
        triggerToast(`💰 ₹${deal.amount} cashback credited to your wallet`);
        return;
      }
    }
  };

  const copyCode = (code: string) => {
    if (Platform.OS === 'web') {
      navigator.clipboard?.writeText(code);
    } else {
      Clipboard.setString(code);
    }
    showInfo(`📋 Code '${code}' copied`, 'Apply it at checkout when you book.');
    triggerToast(`📋 Code '${code}' copied`);
  };

  const openOffer = (deal: OfferDeal) => {
    if (deal.classId) {
      router.push({ pathname: '/enroll', params: { classId: deal.classId, title: deal.appliesTo } });
    } else if (deal.group === 'Tournament Passes') {
      router.push('/(tabs)/tournaments');
    } else if (deal.appliesTo && deal.appliesTo !== 'All Turfs') {
      router.push({ pathname: '/explore', params: { search: deal.appliesTo } });
    } else {
      router.push('/(tabs)/explore');
    }
  };

  const renderCodePill = (code: string, color: string) => (
    <View style={[styles.codePill, { borderColor: color + '66' }]}>
      <ThemedText style={[styles.codePillText, { color }]} numberOfLines={1}>
        {code}
      </ThemedText>
    </View>
  );

  const filteredTransactions = transactions.filter(t => {
    if (historyFilter === 'credit') return t.type === 'credit';
    if (historyFilter === 'debit') return t.type === 'debit';
    return true;
  });

  const credits = transactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);
  const debits = transactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0);
  const filteredNet = filteredTransactions.reduce((sum, t) => sum + (t.type === 'credit' ? t.amount : -t.amount), 0);

  return (
    <GradientContainer screenName="wallet" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Floating Toast Notification Overlay */}
        {toastMsg && (
          <Animated.View style={[styles.toastBanner, { opacity: toastOpacity, backgroundColor: theme.surfaceLowest, borderColor: theme.primary + '55' }]}>
            <Ionicons name="information-circle" size={16} color={theme.primary} />
            <ThemedText style={[styles.toastText, { color: theme.text }]}>{toastMsg}</ThemedText>
          </Animated.View>
        )}

        {/* Top Header */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}>
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <ThemedText style={[styles.headerTitle, { color: theme.text }]}>Wallet & Offers</ThemedText>
            <ThemedText style={{ fontSize: 11, color: theme.textSecondary, fontFamily: 'Sora_500Medium', marginTop: 1 }}>
              Instant Cashback • Digital Vouchers
            </ThemedText>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPad}>
          <View style={{ paddingHorizontal: Spacing.containerMargin }}>

            {/* Balance — the dashboard card, with money in and out at a glance */}
            <Reanimated.View entering={FadeInDown.duration(500)}>
              <DashboardCard
                style={styles.heroCard}
                title="Wallet Balance"
                metric={`₹${walletBalance.toFixed(2)} available`}
                tag="💳 Instant cashback"
                icon="wallet"
                accent={ACCENTS.primary}
                footer={{
                  label: 'Transactions',
                  value: String(transactions.length),
                  status: '🔒 Credited only after payment',
                }}
              >
                <StatTiles
                  items={[
                    { value: `+₹${credits.toFixed(0)}`, label: 'Credits', color: ACCENTS.green.dark },
                    { value: `−₹${debits.toFixed(0)}`, label: 'Spent', color: ACCENTS.red.dark },
                    { value: String(dealsCount), label: 'Deals', color: ACCENTS.primary.dark },
                  ]}
                />
                <View style={styles.heroActionRow}>
                  <Pressable
                    onPress={() => setTopUpModalVisible(true)}
                    accessibilityRole="button"
                    accessibilityLabel="Add money to wallet"
                    style={({ pressed }) => [styles.heroAddBtn, { backgroundColor: theme.primary }, pressed && { opacity: 0.9 }]}
                  >
                    <Ionicons name="add-circle" size={16} color="#ffffff" />
                    <ThemedText style={styles.heroAddBtnText}>Add Money</ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={() => setActiveTab('vouchers')}
                    accessibilityRole="button"
                    accessibilityLabel="Show vouchers"
                    style={({ pressed }) => [
                      styles.heroVoucherBtn,
                      { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33' },
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <Ionicons name="ticket-outline" size={15} color={ACCENTS.primary.dark} />
                    <ThemedText style={[styles.heroVoucherBtnText, { color: ACCENTS.primary.dark }]}>Vouchers</ThemedText>
                  </Pressable>
                </View>
              </DashboardCard>
            </Reanimated.View>

            {/* Dedicated Class/Turf Cashback Breakdown */}
            {cashbackCredits && cashbackCredits.length > 0 && (
              <View style={[styles.cardGap, { backgroundColor: theme.surfaceLowest, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: '#10b98144', padding: 14 }, Shadows.level1]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="wallet" size={16} color="#10b981" />
                    <ThemedText style={{ fontSize: 12.5, fontFamily: 'Sora_700Bold', color: theme.text }}>
                      Cashback Rewards Earned
                    </ThemedText>
                  </View>
                  <View style={{ backgroundColor: '#10b98118', paddingHorizontal: 7, paddingVertical: 2, borderRadius: BorderRadius.full }}>
                    <ThemedText style={{ fontSize: 9.5, fontFamily: 'Sora_600SemiBold', color: '#10b981' }}>
                      {cashbackCredits.length} Active {cashbackCredits.length === 1 ? 'Reward' : 'Rewards'}
                    </ThemedText>
                  </View>
                </View>

                <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_400Regular', color: theme.textSecondary, marginBottom: 10 }}>
                  Cashback earned is added directly to your universal wallet and can be used on any turf booking or class enrollment.
                </ThemedText>

                <View style={{ gap: 8 }}>
                  {cashbackCredits.map((c) => (
                    <View
                      key={c.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: theme.surfaceLow,
                        padding: 10,
                        borderRadius: BorderRadius.md,
                        borderWidth: 1,
                        borderColor: theme.outlineVariant + '25',
                      }}
                    >
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Ionicons
                            name={c.entityType === 'class' ? 'school-outline' : 'football-outline'}
                            size={12}
                            color="#10b981"
                          />
                          <ThemedText style={{ fontSize: 11.5, fontFamily: 'Sora_600SemiBold', color: theme.text }} numberOfLines={1}>
                            {c.entityName}
                          </ThemedText>
                        </View>
                        <ThemedText style={{ fontSize: 9.5, fontFamily: 'Sora_400Regular', color: theme.textSecondary, marginTop: 2 }}>
                          Earned from {c.entityName} · Usable anywhere
                        </ThemedText>
                      </View>

                      <ThemedText style={{ fontSize: 13, fontFamily: 'Sora_700Bold', color: '#10b981' }}>
                        +₹{c.amount}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Redeem — cashback codes only */}
            <DashboardCard
              style={styles.cardGap}
              title="Redeem Cashback"
              metric="Cashback codes credit your wallet"
              tag={cashbackLeft > 0 ? `💰 ${cashbackLeft} to redeem` : '✅ All redeemed'}
              icon="cash"
              accent={ACCENTS.green}
            >
              <View style={[styles.promoRow, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33' }]}>
                <Ionicons name="cash-outline" size={16} color={theme.textSecondary} />
                <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                  value={promoCodeInput}
                  onChangeText={setPromoCodeInput}
                  onSubmitEditing={() => redeemCashback(promoCodeInput)}
                  returnKeyType="done"
                  placeholder={`Cashback code (e.g. ${CASHBACK_DEALS[0]?.code ?? 'WALLETCASH100'})`}
                  placeholderTextColor={theme.textSecondary + '77'}
                  autoCapitalize="characters"
                  accessibilityLabel="Cashback code"
                  style={[styles.promoInput, { color: theme.text }]}
                />
                <Pressable
                  onPress={() => redeemCashback(promoCodeInput)}
                  accessibilityRole="button"
                  accessibilityLabel="Redeem cashback code"
                  style={({ pressed }) => [styles.applyBtn, { backgroundColor: ACCENTS.green.main }, pressed && { opacity: 0.9 }]}
                >
                  <ThemedText style={styles.applyBtnText}>Apply</ThemedText>
                </Pressable>
              </View>
              <View style={styles.redeemHint}>
                <Ionicons name="information-circle-outline" size={13} color={theme.textSecondary} />
                <ThemedText style={[styles.redeemHintText, { color: theme.textSecondary }]}>
                  Vouchers and offers are booking discounts — apply them at checkout.
                </ThemedText>
              </View>
            </DashboardCard>

            {/* Tabs */}
            <DashboardTabs
              compact
              style={styles.tabs}
              options={[
                { key: 'vouchers', label: 'Vouchers', emoji: '🎟️', accent: ACCENTS.primary },
                { key: 'offers', label: 'Offers', emoji: '🔥', accent: ACCENTS.orange },
                { key: 'cashback', label: 'Cashback', emoji: '💰', accent: ACCENTS.green },
                { key: 'history', label: 'History', emoji: '📜', accent: ACCENTS.primary },
              ]}
              active={activeTab}
              onChange={setActiveTab}
            />

            {/* 🎟️ Vouchers Tab — the whole catalogue, every category */}
            {activeTab === 'vouchers' && (
              <View style={styles.tabSectionContainer}>
                {VOUCHER_CATEGORIES.map((category, ci) => {
                  const items = vouchersByCategory(category);
                  if (items.length === 0) return null;

                  return (
                    <View key={category} style={styles.dealGroup}>
                      <DashboardSectionLabel
                        label={category}
                        color={ACCENTS.primary.main}
                        style={styles.couponSectionHeader}
                        right={
                          <ThemedText style={[styles.sectionCount, { color: theme.textSecondary }]}>
                            {items.length} {items.length === 1 ? 'voucher' : 'vouchers'}
                          </ThemedText>
                        }
                      />

                      <View style={styles.couponGrid}>
                        {items.map((v, i) => (
                          <Reanimated.View
                            key={v.id}
                            entering={FadeInUp.delay(ci * 60 + i * 60).duration(380)}
                            style={styles.couponCell}
                          >
                            <Pressable
                              onPress={() => router.push({ pathname: '/voucher-redeem', params: { id: v.id } })}
                              accessibilityRole="button"
                              accessibilityLabel={`${v.title}, ${v.discountLabel} ${v.discountSuffix}, valid until ${v.validUntil}`}
                              style={({ pressed }) => [
                                styles.couponCard,
                                { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' },
                                Shadows.level2,
                                pressed && { transform: [{ scale: 0.98 }] },
                              ]}
                            >
                              {/* Discount flag in the corner */}
                              <View style={[styles.couponBadge, { backgroundColor: ACCENTS.green.main }]}>
                                <ThemedText style={styles.couponBadgeText}>{v.discountLabel}</ThemedText>
                              </View>

                              <View style={styles.couponLogoBox}>
                                <Image source={v.logo} style={styles.couponLogo} contentFit="contain" />
                              </View>

                              <ThemedText style={[styles.couponTitle, { color: theme.text }]} numberOfLines={2}>
                                {v.title}
                              </ThemedText>
                              <View style={[styles.couponFooter, { borderTopColor: theme.outlineVariant + '1A' }]}>
                                <Ionicons name="time-outline" size={11} color={theme.textSecondary} />
                                <ThemedText style={[styles.couponValid, { color: theme.textSecondary }]} numberOfLines={1}>
                                  Valid until {v.validUntil}
                                </ThemedText>
                              </View>
                            </Pressable>
                          </Reanimated.View>
                        ))}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* 🔥 Offers Tab — every live venue offer, class voucher and tournament pass */}
            {activeTab === 'offers' && (
              <View style={styles.tabSectionContainer}>
                {offerDeals.length === 0 ? (
                  <DashboardCard
                    title="No live offers right now"
                    metric="New venue and class offers appear here"
                    icon="pricetags-outline"
                    accent={ACCENTS.slate}
                  />
                ) : (
                  OFFER_GROUPS.map((group) => {
                    const items = offerDeals.filter((d) => d.group === group);
                    if (items.length === 0) return null;
                    const look = OFFER_LOOK[group];

                    return (
                      <View key={group} style={styles.dealGroup}>
                        <DashboardSectionLabel
                          label={group}
                          color={look.accent.main}
                          style={styles.couponSectionHeader}
                          right={
                            <ThemedText style={[styles.sectionCount, { color: theme.textSecondary }]}>
                              {items.length} {items.length === 1 ? 'offer' : 'offers'}
                            </ThemedText>
                          }
                        />
                        <View style={styles.dealList}>
                          {items.map((deal, idx) => (
                            <Reanimated.View key={deal.id} entering={FadeInUp.delay(idx * 60).duration(360)}>
                              <DashboardCard
                                title={deal.title}
                                metric={deal.appliesTo}
                                tag={`${look.emoji} ${deal.headline}`}
                                icon={look.icon}
                                accent={look.accent}
                                onPress={() => openOffer(deal)}
                                accessibilityLabel={`${deal.title}, ${deal.headline}, ${deal.appliesTo}. Code ${deal.code}`}
                                footer={{
                                  left: renderCodePill(deal.code, look.accent.dark),
                                  status: (
                                    <Pressable
                                      onPress={() => copyCode(deal.code)}
                                      hitSlop={6}
                                      accessibilityRole="button"
                                      accessibilityLabel={`Copy code ${deal.code}`}
                                      style={({ pressed }) => [
                                        styles.copyBtn,
                                        { backgroundColor: look.accent.main + '1A' },
                                        pressed && { opacity: 0.8 },
                                      ]}
                                    >
                                      <Ionicons name="copy-outline" size={12} color={look.accent.dark} />
                                      <ThemedText style={[styles.copyBtnText, { color: look.accent.dark }]}>Copy</ThemedText>
                                    </Pressable>
                                  ),
                                }}
                              >
                                {!!deal.detail && (
                                  <ThemedText style={[styles.offerSub, { color: theme.textSecondary }]}>{deal.detail}</ThemedText>
                                )}
                              </DashboardCard>
                            </Reanimated.View>
                          ))}
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            )}

            {/* 💰 Cashback Tab — the only codes the redeem box credits */}
            {activeTab === 'cashback' && (
              <View style={styles.tabSectionContainer}>
                <DashboardSectionLabel
                  label="Wallet Cashback"
                  color={ACCENTS.green.main}
                  style={styles.couponSectionHeader}
                  right={
                    <ThemedText style={[styles.sectionCount, { color: theme.textSecondary }]}>
                      {cashbackLeft} of {CASHBACK_DEALS.length} left
                    </ThemedText>
                  }
                />
                <View style={styles.dealList}>
                  {CASHBACK_DEALS.map((deal, idx) => {
                    const redeemed = redeemedCashback.includes(deal.code);
                    const accent = redeemed ? ACCENTS.slate : ACCENTS.green;
                    return (
                      <Reanimated.View key={deal.id} entering={FadeInUp.delay(idx * 60).duration(360)}>
                        <DashboardCard
                          title={deal.title}
                          metric={`₹${deal.amount} to your wallet`}
                          tag={redeemed ? '✅ Redeemed' : `💰 ₹${deal.amount} BACK`}
                          icon="cash"
                          accent={accent}
                          footer={{
                            left: renderCodePill(deal.code, accent.dark),
                            status: redeemed ? (
                              'Credited to your wallet'
                            ) : (
                              <Pressable
                                onPress={() => redeemCashback(deal.code)}
                                hitSlop={6}
                                accessibilityRole="button"
                                accessibilityLabel={`Redeem ${deal.code} for ₹${deal.amount}`}
                                style={({ pressed }) => [
                                  styles.copyBtn,
                                  { backgroundColor: ACCENTS.green.main },
                                  pressed && { opacity: 0.85 },
                                ]}
                              >
                                <Ionicons name="wallet-outline" size={12} color="#ffffff" />
                                <ThemedText style={[styles.copyBtnText, { color: '#ffffff' }]}>Redeem</ThemedText>
                              </Pressable>
                            ),
                          }}
                        >
                          <ThemedText style={[styles.offerSub, { color: theme.textSecondary }]}>{deal.description}</ThemedText>
                        </DashboardCard>
                      </Reanimated.View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* 📜 Wallet History Tab */}
            {activeTab === 'history' && (
              <View style={styles.tabSectionContainer}>
                <View style={styles.chipRow}>
                  {([
                    { key: 'all', label: 'All' },
                    { key: 'credit', label: 'Credits (+)' },
                    { key: 'debit', label: 'Debits (−)' },
                  ] as const).map(f => (
                    <DashboardChip
                      key={f.key}
                      label={f.label}
                      selected={historyFilter === f.key}
                      onPress={() => setHistoryFilter(f.key)}
                    />
                  ))}
                </View>

                <DashboardCard
                  title="Wallet Activity"
                  metric={`${filteredTransactions.length} ${filteredTransactions.length === 1 ? 'transaction' : 'transactions'}`}
                  icon="time"
                  accent={ACCENTS.green}
                  footer={{
                    label: 'Net',
                    value: `${filteredNet >= 0 ? '+' : '−'}₹${Math.abs(filteredNet).toFixed(2)}`,
                    status: historyFilter === 'all' ? 'All activity' : historyFilter === 'credit' ? 'Credits only' : 'Debits only',
                  }}
                >
                  {filteredTransactions.length === 0 ? (
                    <ThemedText style={[styles.txEmpty, { color: theme.textSecondary }]}>
                      No transactions for this filter.
                    </ThemedText>
                  ) : (
                    <View>
                      {filteredTransactions.map((tx, i) => {
                        const isCredit = tx.type === 'credit';
                        const accent = isCredit ? ACCENTS.green : ACCENTS.red;
                        return (
                          <View
                            key={tx.id}
                            style={[styles.txRow, i > 0 && { borderTopWidth: 1, borderTopColor: theme.outlineVariant + '1A' }]}
                          >
                            <View style={[styles.txIconTile, { backgroundColor: accent.main + '1A' }]}>
                              <Ionicons name={isCredit ? 'arrow-down' : 'arrow-up'} size={15} color={accent.main} />
                            </View>
                            <View style={{ flex: 1, minWidth: 0 }}>
                              <ThemedText numberOfLines={1} style={[styles.txTitle, { color: theme.text }]}>{tx.title}</ThemedText>
                              <ThemedText numberOfLines={1} style={[styles.txDate, { color: theme.textSecondary }]}>
                                {tx.date} · {tx.category}
                              </ThemedText>
                            </View>
                            <ThemedText style={[styles.txAmount, { color: accent.dark }]}>
                              {isCredit ? '+' : '−'}₹{tx.amount.toFixed(2)}
                            </ThemedText>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </DashboardCard>
              </View>
            )}

          </View>
        </ScrollView>

        {/* 💳 Top-Up Wallet Modal */}
        <Modal
          visible={topUpModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setTopUpModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <Pressable style={styles.modalBackdrop} onPress={() => setTopUpModalVisible(false)} />
            <View style={[styles.modalSheet, { backgroundColor: theme.surfaceLowest }]}>
              <View style={styles.modalHeader}>
                <ThemedText type="headlineSm" style={{ color: theme.text, fontFamily: 'Sora_500Medium' }}>
                  + Add Wallet Funds
                </ThemedText>
                <Pressable onPress={() => setTopUpModalVisible(false)}>
                  <Ionicons name="close" size={20} color={theme.textSecondary} />
                </Pressable>
              </View>

              {/* Amount Input */}
              <ThemedText style={[styles.modalLabel, { color: theme.textSecondary }]}>Enter Amount (₹)</ThemedText>
              <View style={[styles.modalInputRow, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '44' }]}>
                <ThemedText style={[styles.currencyPrefix, { color: theme.text }]}>₹</ThemedText>
                <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                  value={customAmount}
                  onChangeText={setCustomAmount}
                  keyboardType="number-pad"
                  style={[styles.modalInput, { color: theme.text }]}
                />
              </View>

              {/* Quick Amount Chips */}
              <View style={{ flexDirection: 'row', gap: 8, marginVertical: Spacing.sm }}>
                {[100, 250, 500, 1000].map(amt => (
                  <Pressable
                    key={amt}
                    onPress={() => setCustomAmount(String(amt))}
                    style={[
                      styles.quickAmtChip,
                      customAmount === String(amt)
                        ? [{ backgroundColor: theme.surfaceLowest, borderColor: ACCENTS.primary.main + '40' }, Shadows.level1]
                        : { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33' },
                    ]}
                  >
                    <ThemedText style={{ fontSize: 12, fontFamily: customAmount === String(amt) ? 'Sora_600SemiBold' : 'Sora_500Medium', color: customAmount === String(amt) ? ACCENTS.primary.dark : theme.text }}>
                      +₹{amt}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>

              {/* Payment Methods */}
              <ThemedText style={[styles.modalLabel, { color: theme.textSecondary, marginTop: Spacing.xs }]}>Select Payment Option</ThemedText>
              <View style={{ gap: 8, marginVertical: Spacing.xs }}>
                {[
                  { key: 'upi', label: 'UPI / GPay / PhonePe / Paytm', icon: 'qr-code-outline' },
                  { key: 'card', label: 'Credit / Debit Card', icon: 'card-outline' },
                  { key: 'netbanking', label: 'Net Banking', icon: 'business-outline' },
                ].map(p => (
                  <Pressable
                    key={p.key}
                    onPress={() => setPaymentMethod(p.key as any)}
                    style={[
                      styles.paymentOptionRow,
                      { backgroundColor: theme.surfaceLow, borderColor: paymentMethod === p.key ? theme.primary : theme.outlineVariant + '33' }
                    ]}
                  >
                    <Ionicons name={p.icon as any} size={18} color={paymentMethod === p.key ? theme.primary : theme.textSecondary} />
                    <ThemedText style={{ flex: 1, fontSize: 12, fontFamily: 'Sora_500Medium', color: theme.text }}>
                      {p.label}
                    </ThemedText>
                    {paymentMethod === p.key && <Ionicons name="checkmark-circle" size={16} color={theme.primary} />}
                  </Pressable>
                ))}
              </View>

              {/* Submit Top-up */}
              <Pressable
                onPress={() => handleTopUp(parseFloat(customAmount))}
                style={[styles.modalSubmitBtn, { backgroundColor: theme.primary }]}
              >
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                <ThemedText style={styles.modalSubmitText}>
                  Proceed to Pay ₹{customAmount || '0'}
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </GradientContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  toastBanner: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 5,
  },
  toastText: {
    fontSize: 10,
    fontFamily: 'Sora_500Medium',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.containerMargin,
    paddingVertical: Spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Sora_500Medium',
    fontSize: 14.5,
  },
  scrollPad: {
    paddingBottom: Spacing.xl * 2,
  },
  heroCard: { marginTop: Spacing.xs },
  heroActionRow: { flexDirection: 'row', gap: 10 },
  heroAddBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 38, borderRadius: BorderRadius.md },
  heroAddBtnText: { color: '#ffffff', fontFamily: 'Sora_600SemiBold', fontSize: 12 },
  heroVoucherBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 38, borderRadius: BorderRadius.md, borderWidth: 1 },
  heroVoucherBtnText: { fontFamily: 'Sora_600SemiBold', fontSize: 12 },
  promoInput: { flex: 1, minWidth: 0, fontSize: 12, fontFamily: 'Sora_500Medium', paddingVertical: 0, includeFontPadding: false },
  applyBtn: { paddingHorizontal: 16, height: 36, justifyContent: 'center', borderRadius: BorderRadius.md },
  applyBtnText: { color: '#ffffff', fontFamily: 'Sora_600SemiBold', fontSize: 12 },
  tabSectionContainer: {
    marginTop: Spacing.md,
  },

  // ── Coupon grid (category sections of two-up cards) ──────────────────────
  couponSectionHeader: { marginBottom: Spacing.sm },
  couponGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  // Two per row, accounting for the gap between them.
  couponCell: {
    width: '48%',
    flexGrow: 1,
  },
  couponCard: { borderRadius: BorderRadius.premium, borderWidth: 1, padding: Spacing.sm, paddingTop: Spacing.md, minHeight: 168 },
  couponBadge: { position: 'absolute', top: -1, right: -1, paddingHorizontal: 9, paddingVertical: 4, borderBottomLeftRadius: 10, borderTopRightRadius: BorderRadius.premium },
  couponBadgeText: { color: '#ffffff', fontSize: 10.5, fontFamily: 'Sora_600SemiBold' },
  couponLogoBox: {
    height: 66,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  couponLogo: {
    width: '78%',
    height: '100%',
  },
  couponTitle: {
    fontSize: 12.5,
    lineHeight: 17,
    fontFamily: 'Sora_500Medium',
    textAlign: 'center',
  },
  couponValid: { fontSize: 9.5, fontFamily: 'Sora_400Regular', flexShrink: 1 },

  offerSub: { fontSize: 11, fontFamily: 'Sora_400Regular', lineHeight: 16, marginTop: -4 },
  txTitle: { fontFamily: 'Sora_500Medium', fontSize: 12.5 },
  txDate: { fontSize: 10, fontFamily: 'Sora_400Regular', marginTop: 2 },
  txAmount: { fontFamily: 'Sora_600SemiBold', fontSize: 12.5 },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalSheet: { borderTopLeftRadius: BorderRadius.premium, borderTopRightRadius: BorderRadius.premium, padding: Spacing.lg, paddingBottom: Spacing.xl },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  modalLabel: {
    fontSize: 11.5,
    fontFamily: 'Sora_500Medium',
    marginBottom: 6,
  },
  modalInputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderRadius: BorderRadius.md, borderWidth: 1, height: 44 },
  currencyPrefix: {
    fontSize: 14.5,
    fontFamily: 'Sora_500Medium',
    marginRight: 4,
  },
  modalInput: {
    flex: 1,
    fontSize: 14.5,
    fontFamily: 'Sora_500Medium',
    includeFontPadding: false,
  },
  quickAmtChip: { flex: 1, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: BorderRadius.md, borderWidth: 1 },
  paymentOptionRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 44, borderRadius: BorderRadius.md, borderWidth: 1, gap: 8 },
  modalSubmitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 46, borderRadius: BorderRadius.premium, marginTop: Spacing.sm },
  modalSubmitText: { color: '#ffffff', fontFamily: 'Sora_600SemiBold', fontSize: 13 },
  cardGap: { marginTop: 12 },
  promoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, paddingLeft: 12, paddingRight: 4, borderRadius: BorderRadius.md, borderWidth: 1 },
  tabs: { marginTop: Spacing.md },
  couponFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 8, paddingTop: 6, borderTopWidth: 1 },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: Spacing.sm },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  txIconTile: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  txEmpty: { fontSize: 11, fontFamily: 'Sora_400Regular', textAlign: 'center', paddingVertical: 12 },
  redeemHint: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: -4 },
  redeemHintText: { fontSize: 10, fontFamily: 'Sora_400Regular', flexShrink: 1 },
  sectionCount: { fontSize: 10.5, fontFamily: 'Sora_500Medium' },
  dealGroup: { marginBottom: Spacing.lg },
  dealList: { gap: 12 },
  codePill: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, flexShrink: 1 },
  codePillText: { fontSize: 10.5, fontFamily: 'Sora_600SemiBold', letterSpacing: 0.8 },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, height: 28, borderRadius: BorderRadius.md },
  copyBtnText: { fontFamily: 'Sora_600SemiBold', fontSize: 11 },
});
