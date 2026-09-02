import React, { useState, useRef } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import Reanimated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { GradientContainer } from '@/components/gradient-container';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useWalletStore, useOfferStore } from '@/store/app-store';
import { useToast } from '@/context/ToastContext';
import {
  VOUCHERS,
  VOUCHER_CATEGORIES,
  VoucherCategory,
  vouchersByCategory,
  getVoucherByCode,
} from '@/constants/vouchers';

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


export default function WalletScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { showSuccess, showError, showInfo } = useToast();
  const { walletBalance, addWalletFunds } = useWalletStore();
  const { redeemOffer } = useOfferStore();

  const [activeTab, setActiveTab] = useState<'vouchers' | 'offers' | 'history'>('vouchers');
  // Each category shows two coupons until "View All" expands it.
  const [expandedCategory, setExpandedCategory] = useState<VoucherCategory | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'credit' | 'debit'>('all');

  // Top Up Modal State
  const [topUpModalVisible, setTopUpModalVisible] = useState(false);
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

  const handleTopUp = (amountToAdd: number) => {
    if (isNaN(amountToAdd) || amountToAdd <= 0) {
      showError('Please enter a valid amount');
      triggerToast('⚠️ Please enter a valid amount');
      return;
    }
    addWalletFunds(amountToAdd);
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      title: `Wallet Top-up via ${paymentMethod.toUpperCase()}`,
      type: 'credit',
      amount: amountToAdd,
      date: 'Just Now',
      category: 'Topup',
    };
    setTransactions([newTx, ...transactions]);
    setTopUpModalVisible(false);
    showSuccess(`🎉 ₹${amountToAdd} successfully added to your wallet!`);
    triggerToast(`🎉 ₹${amountToAdd} added to wallet!`);
  };

  const handleApplyPromoCode = () => {
    const clean = promoCodeInput.trim().toUpperCase();
    if (!clean) {
      showError('Please enter a coupon or promo code');
      triggerToast('⚠️ Enter a valid coupon code');
      return;
    }
    const creditVoucher = (label: string, note?: string) => {
      addWalletFunds(100);
      const newTx: Transaction = {
        id: `tx-${Date.now()}`,
        title: `Voucher Applied (${label})`,
        type: 'credit',
        amount: 100,
        date: 'Just Now',
        category: 'Voucher',
      };
      setTransactions(prev => [newTx, ...prev]);
      setPromoCodeInput('');
      showSuccess(`🎟️ Voucher '${label}' applied! ₹100 credited to wallet.`, note);
      triggerToast(`🎟️ Voucher '${label}' applied! ₹100 credited.`);
    };

    // Owner-published codes are checked first, because those carry a real
    // "first N users" cap that has to be claimed atomically.
    const claim = redeemOffer(clean);
    if (claim.ok) {
      const left = claim.remaining;
      creditVoucher(
        clean,
        left === null || left === undefined
          ? undefined
          : left > 0
            ? `${left} redemption${left === 1 ? '' : 's'} left on this code.`
            : 'That was the last one — this code is now fully claimed.'
      );
      return;
    }

    if (claim.reason === 'exhausted') {
      const cap = claim.offer?.maxRedemptions ?? 0;
      showError(
        'Offer fully claimed',
        `'${clean}' was limited to the first ${cap} user${cap === 1 ? '' : 's'}.`
      );
      triggerToast('❌ This code has been fully claimed');
      return;
    }
    if (claim.reason === 'expired') {
      showError('Offer expired', `'${clean}' is past its valid-until date.`);
      triggerToast('❌ This code has expired');
      return;
    }
    if (claim.reason === 'paused') {
      showError('Offer paused', `'${clean}' has been paused by the venue.`);
      triggerToast('❌ This code is currently paused');
      return;
    }

    // Fall back to the sample catalogue shown in the vouchers grid.
    if (getVoucherByCode(clean)) {
      creditVoucher(clean);
      return;
    }

    showError('Invalid or expired promo code. Try SALE50 or NIGHTOWL40');
    triggerToast('❌ Invalid code. Try SALE50 or NIGHTOWL40');
  };

  const copyToClipboard = (code: string) => {
    if (Platform.OS === 'web') {
      navigator.clipboard?.writeText(code);
    } else {
      Clipboard.setString(code);
    }
    setPromoCodeInput(code);
    showInfo(`📋 Code '${code}' copied & applied below!`);
    triggerToast(`📋 Code '${code}' copied & applied!`);
  };

  const filteredTransactions = transactions.filter(t => {
    if (historyFilter === 'credit') return t.type === 'credit';
    if (historyFilter === 'debit') return t.type === 'debit';
    return true;
  });

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
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={theme.text} />
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

            {/* Vibrant Hero Wallet Card */}
            <Reanimated.View entering={FadeInDown.duration(600).damping(14)}>
              <LinearGradient
                colors={['#3b3691', '#211d57', '#16143b']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroCard}
              >
                <Image
                  source={require('@/assets/images/illustrations/wallet_blue.png')}
                  style={styles.heroCardIllustration}
                  contentFit="contain"
                />

                <View style={styles.heroCardHeader}>
                  <View>
                    <ThemedText style={styles.heroCardLabel}>AVAILABLE WALLET BALANCE</ThemedText>
                    <ThemedText style={styles.heroCardBalance}>₹{walletBalance.toFixed(2)}</ThemedText>
                  </View>
                </View>

                {/* Quick Action Buttons */}
                <View style={styles.heroActionRow}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.heroAddBtn,
                      pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] }
                    ]}
                    onPress={() => setTopUpModalVisible(true)}
                  >
                    <Ionicons name="add-circle" size={17} color="#3b3691" />
                    <ThemedText style={styles.heroAddBtnText}>+ Add Money</ThemedText>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.heroVoucherBtn,
                      pressed && { opacity: 0.9 }
                    ]}
                    onPress={() => setActiveTab('vouchers')}
                  >
                    <Ionicons name="ticket" size={15} color="#ffffff" />
                    <ThemedText style={styles.heroVoucherBtnText}>Vouchers</ThemedText>
                  </Pressable>
                </View>
              </LinearGradient>
            </Reanimated.View>

            {/* Quick Redeem Promo Bar */}
            <View style={[styles.promoBarCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
              <Ionicons name="pricetag-outline" size={18} color={theme.primary} />
              <TextInput
                value={promoCodeInput}
                onChangeText={setPromoCodeInput}
                placeholder="Have a voucher code? (e.g. TURF100)"
                placeholderTextColor={theme.textSecondary + '77'}
                autoCapitalize="characters"
                style={[styles.promoInput, { color: theme.text }]}
              />
              <Pressable
                onPress={handleApplyPromoCode}
                style={[styles.applyBtn, { backgroundColor: theme.primary }]}
              >
                <ThemedText style={styles.applyBtnText}>Apply</ThemedText>
              </Pressable>
            </View>

            {/* Tab Filter Bar */}
            <View style={[styles.tabBarContainer, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '22' }]}>
              {[
                { key: 'vouchers', label: '🎟️ Vouchers' },
                { key: 'offers', label: '🔥 Offers' },
                { key: 'history', label: '📜 History' },
              ].map(t => {
                const isActive = activeTab === t.key;
                return (
                  <Pressable
                    key={t.key}
                    onPress={() => setActiveTab(t.key as any)}
                    style={[
                      styles.tabItem,
                      isActive && { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', ...Shadows.level1 }
                    ]}
                  >
                    <ThemedText style={[styles.tabItemText, { color: isActive ? theme.primary : theme.textSecondary, fontFamily: isActive ? 'Sora_600SemiBold' : 'Sora_600SemiBold' }]}>
                      {t.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>

            {/* 🎟️ Active Vouchers Tab */}
            {activeTab === 'vouchers' && (
              <View style={styles.tabSectionContainer}>
                {VOUCHER_CATEGORIES.map((category, ci) => {
                  const items = vouchersByCategory(category);
                  if (items.length === 0) return null;
                  const shown = expandedCategory === category ? items : items.slice(0, 2);

                  return (
                    <View key={category} style={{ marginBottom: Spacing.lg }}>
                      <View style={styles.couponSectionHeader}>
                        <ThemedText style={[styles.couponSectionTitle, { color: theme.text }]}>
                          {category}
                        </ThemedText>
                        {items.length > 2 && (
                          <Pressable
                            onPress={() =>
                              setExpandedCategory(prev => (prev === category ? null : category))
                            }
                            hitSlop={8}
                            accessibilityRole="button"
                            accessibilityLabel={
                              expandedCategory === category
                                ? `Show fewer ${category} vouchers`
                                : `View all ${category} vouchers`
                            }
                            style={styles.viewAllBtn}
                          >
                            <ThemedText style={[styles.viewAllText, { color: theme.textSecondary }]}>
                              {expandedCategory === category ? 'Show Less' : 'View All'}
                            </ThemedText>
                            <Ionicons
                              name={expandedCategory === category ? 'chevron-up' : 'chevron-forward'}
                              size={13}
                              color={theme.textSecondary}
                            />
                          </Pressable>
                        )}
                      </View>

                      <View style={styles.couponGrid}>
                        {shown.map((v, i) => (
                          <Reanimated.View
                            key={v.id}
                            entering={FadeInUp.delay(ci * 60 + i * 60).duration(380)}
                            style={styles.couponCell}
                          >
                            <Pressable
                              onPress={() =>
                                router.push({ pathname: '/voucher-redeem', params: { id: v.id } })
                              }
                              accessibilityRole="button"
                              accessibilityLabel={`${v.title}, ${v.discountLabel} ${v.discountSuffix}, valid until ${v.validUntil}`}
                              style={[
                                styles.couponCard,
                                {
                                  backgroundColor: theme.surfaceLowest,
                                  borderColor: theme.outlineVariant + '22',
                                },
                              ]}
                            >
                              {/* Discount flag, mirroring the reference's corner badge */}
                              <View style={[styles.couponBadge, { backgroundColor: theme.primary }]}>
                                <ThemedText style={styles.couponBadgeText}>
                                  {v.discountLabel}
                                </ThemedText>
                              </View>

                              <View style={styles.couponLogoBox}>
                                <Image
                                  source={v.logo}
                                  style={styles.couponLogo}
                                  contentFit="contain"
                                />
                              </View>

                              <ThemedText
                                style={[styles.couponTitle, { color: theme.text }]}
                                numberOfLines={2}
                              >
                                {v.title}
                              </ThemedText>
                              <ThemedText style={[styles.couponValid, { color: theme.textSecondary }]}>
                                Valid until: {v.validUntil}
                              </ThemedText>
                            </Pressable>
                          </Reanimated.View>
                        ))}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* 🔥 Special Offers Tab */}
            {activeTab === 'offers' && (
              <View style={styles.tabSectionContainer}>
                <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginBottom: Spacing.xs, letterSpacing: 0.5 }}>
                  HOT CASHBACK & REFERRAL DEALS
                </ThemedText>

                {[
                  {
                    title: '₹50 Auto Wallet Cashback',
                    sub: 'Use Turf Wallet on any booking & get ₹50 credited back instantly!',
                    badge: 'WALLET DEAL',
                    icon: 'wallet-outline',
                    color: ['#10b981', '#059669'],
                  },
                  {
                    title: 'Refer a Teammate & Earn ₹100',
                    sub: 'Share your referral code with sports friends & earn ₹100 per signup.',
                    badge: 'REFERRAL',
                    icon: 'people-outline',
                    color: ['#8b5cf6', '#7c3aed'],
                  },
                  {
                    title: '3-Match Streak Pass',
                    sub: 'Book 3 turf slots this week to unlock a 100% Free Booking Voucher!',
                    badge: 'STREAK',
                    icon: 'trophy-outline',
                    color: ['#f59e0b', '#d97706'],
                  },
                ].map((offer, idx) => (
                  <Reanimated.View key={idx} entering={FadeInUp.delay(idx * 80).duration(400)}>
                    <LinearGradient
                      colors={offer.color as [string, string]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.offerCard}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
                        <Ionicons name={offer.icon as any} size={22} color="#ffffff" />
                      </View>

                      <ThemedText style={styles.offerTitle}>{offer.title}</ThemedText>
                      <ThemedText style={styles.offerSub}>{offer.sub}</ThemedText>

                      <Pressable
                        onPress={() => showSuccess('🔥 Offer activated! Apply at checkout.')}
                        style={styles.claimBtn}
                      >
                        <ThemedText style={styles.claimBtnText}>Claim Offer →</ThemedText>
                      </Pressable>
                    </LinearGradient>
                  </Reanimated.View>
                ))}
              </View>
            )}

            {/* 📜 Wallet History Tab */}
            {activeTab === 'history' && (
              <View style={styles.tabSectionContainer}>
                {/* Filter Pills */}
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: Spacing.sm }}>
                  {[
                    { key: 'all', label: 'All' },
                    { key: 'credit', label: 'Credits (+)' },
                    { key: 'debit', label: 'Debits (-)' },
                  ].map(f => (
                    <Pressable
                      key={f.key}
                      onPress={() => setHistoryFilter(f.key as any)}
                      style={[
                        styles.historyFilterChip,
                        { backgroundColor: historyFilter === f.key ? theme.primary : theme.surfaceLow, borderColor: historyFilter === f.key ? theme.primary : theme.outlineVariant + '33' }
                      ]}
                    >
                      <ThemedText style={{ fontSize: 11, color: historyFilter === f.key ? '#fff' : theme.textSecondary, fontFamily: 'Sora_500Medium' }}>
                        {f.label}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>

                {filteredTransactions.map((tx) => {
                  const isCredit = tx.type === 'credit';
                  return (
                    <View
                      key={tx.id}
                      style={[styles.txItemCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}
                    >
                      <View style={[styles.txIconCircle, { backgroundColor: isCredit ? '#10b98115' : '#ef444415' }]}>
                        <Ionicons
                          name={isCredit ? 'arrow-down' : 'arrow-up'}
                          size={16}
                          color={isCredit ? '#10b981' : '#ef4444'}
                        />
                      </View>

                      <View style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                        <ThemedText numberOfLines={1} style={[styles.txTitle, { color: theme.text }]}>{tx.title}</ThemedText>
                        <ThemedText numberOfLines={1} style={[styles.txDate, { color: theme.textSecondary }]}>{tx.date}</ThemedText>
                      </View>

                      <ThemedText style={[styles.txAmount, { color: isCredit ? '#10b981' : '#ef4444' }]}>
                        {isCredit ? '+' : '-'}₹{tx.amount.toFixed(2)}
                      </ThemedText>
                    </View>
                  );
                })}
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
                  <Ionicons name="close" size={22} color={theme.textSecondary} />
                </Pressable>
              </View>

              {/* Amount Input */}
              <ThemedText style={[styles.modalLabel, { color: theme.textSecondary }]}>Enter Amount (₹)</ThemedText>
              <View style={[styles.modalInputRow, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '44' }]}>
                <ThemedText style={[styles.currencyPrefix, { color: theme.text }]}>₹</ThemedText>
                <TextInput
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
                      { backgroundColor: customAmount === String(amt) ? theme.primary + '18' : theme.surfaceLow, borderColor: customAmount === String(amt) ? theme.primary : theme.outlineVariant + '33' }
                    ]}
                  >
                    <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_500Medium', color: customAmount === String(amt) ? theme.primary : theme.text }}>
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
    fontSize: 16,
  },
  vipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  vipBadgeText: {
    fontSize: 10,
    fontFamily: 'Sora_500Medium',
    letterSpacing: 0.4,
  },
  scrollPad: {
    paddingBottom: Spacing.xl * 2,
  },
  heroCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginTop: Spacing.xs,
    position: 'relative',
    overflow: 'hidden',
    ...Shadows.level3,
  },
  heroCardIllustration: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    width: 145,
    height: 145,
    opacity: 0.25,
  },
  heroCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  heroCardLabel: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 9,
    fontFamily: 'Sora_500Medium',
    letterSpacing: 0.6,
  },
  heroCardBalance: {
    color: '#ffffff',
    fontSize: 20,
    fontFamily: 'Sora_500Medium',
    marginTop: 2,
  },
  heroActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: Spacing.md,
  },
  heroAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: BorderRadius.lg,
  },
  heroAddBtnText: {
    color: '#3b3691',
    fontFamily: 'Sora_500Medium',
    fontSize: 11.5,
  },
  heroVoucherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  heroVoucherBtnText: {
    color: '#ffffff',
    fontFamily: 'Sora_500Medium',
    fontSize: 11.5,
  },
  promoBarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginTop: Spacing.sm,
  },
  promoInput: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Sora_500Medium',
    marginLeft: 8,
    paddingVertical: 4,
  },
  applyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: BorderRadius.md,
  },
  applyBtnText: {
    color: '#ffffff',
    fontFamily: 'Sora_500Medium',
    fontSize: 11.5,
  },
  tabBarContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    marginTop: Spacing.md,
    gap: 4,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabItemText: {
    fontSize: 12,
  },
  tabSectionContainer: {
    marginTop: Spacing.md,
  },

  // ── Coupon grid (category sections of two-up cards) ──────────────────────
  couponSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  couponSectionTitle: {
    fontSize: 15,
    fontFamily: 'Sora_500Medium',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  viewAllText: {
    fontSize: 11.5,
    fontFamily: 'Sora_500Medium',
  },
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
  couponCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.sm,
    paddingTop: Spacing.md,
    overflow: 'hidden',
    minHeight: 168,
  },
  couponBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderBottomLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
  },
  couponBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: 'Sora_500Medium',
  },
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
  couponValid: {
    fontSize: 10,
    fontFamily: 'Sora_400Regular',
    textAlign: 'center',
    marginTop: 5,
  },

  voucherCard: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  voucherLeftBanner: {
    width: 105,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voucherDiscountText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Sora_500Medium',
    textAlign: 'center',
  },
  dashedDivider: {
    borderLeftWidth: 1.5,
    borderStyle: 'dashed',
  },
  voucherRightContent: {
    flex: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  voucherTitle: {
    fontFamily: 'Sora_500Medium',
    fontSize: 12.5,
  },
  voucherSub: {
    fontSize: 11,
    fontFamily: 'Sora_500Medium',
    marginTop: 2,
    lineHeight: 15,
  },
  copyCodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginLeft: 8,
  },
  copyCodeText: {
    fontSize: 10.5,
    fontFamily: 'Sora_500Medium',
  },
  offerCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  offerTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Sora_500Medium',
    marginTop: 8,
  },
  offerSub: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11,
    fontFamily: 'Sora_500Medium',
    marginTop: 3,
    lineHeight: 16,
  },
  claimBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.md,
    marginTop: 10,
  },
  claimBtnText: {
    color: '#111827',
    fontFamily: 'Sora_500Medium',
    fontSize: 11.5,
  },
  historyFilterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  txItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: 8,
    gap: 10,
  },
  txIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txTitle: {
    fontFamily: 'Sora_500Medium',
    fontSize: 13,
  },
  txDate: {
    fontSize: 10.5,
    fontFamily: 'Sora_400Regular',
    marginTop: 2,
  },
  txAmount: {
    fontFamily: 'Sora_500Medium',
    fontSize: 13.5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalSheet: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
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
  modalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    height: 48,
  },
  currencyPrefix: {
    fontSize: 18,
    fontFamily: 'Sora_500Medium',
    marginRight: 6,
  },
  modalInput: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'Sora_500Medium',
  },
  quickAmtChip: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  paymentOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: 10,
  },
  modalSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
  },
  modalSubmitText: {
    color: '#ffffff',
    fontFamily: 'Sora_500Medium',
    fontSize: 13,
  },
});
