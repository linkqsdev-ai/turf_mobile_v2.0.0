import React, { useState } from 'react';
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

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GradientContainer } from '@/components/gradient-container';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useUserProfile } from '@/hooks/use-user-profile';

interface SquadPlayer {
  id: string;
  name: string;
  role: string;
  idUploaded: boolean;
  idType?: string;
}

interface AdminTeam {
  id: string;
  name: string;
  manager: string;
  phone: string;
  email: string;
  rosterCount: number;
  payment: string;
  paymentMethod: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Changes Requested';
  logo: any;
  requestDate: string;
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
  const { profile } = useUserProfile();
  const role = profile.role || 'Player';

  // Mode state: 'user' or 'admin'
  const [viewMode, setViewMode] = useState<'user' | 'admin'>('user');

  // Mandatory Form Fields & Input States
  const [teamName, setTeamName] = useState('');
  const [managerName, setManagerName] = useState('John Doe');
  const [managerPhone, setManagerPhone] = useState('+44 7911 123456');
  const [managerEmail, setManagerEmail] = useState('john.doe@example.com');

  // Error state for mandatory fields
  const [errors, setErrors] = useState<{ teamName?: boolean; managerName?: boolean; managerPhone?: boolean }>({});

  // Payment Options (matching booking.tsx)
  const [useWallet, setUseWallet] = useState(false);
  const walletBalance = 50.0;
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
  const [adminTeams, setAdminTeams] = useState<AdminTeam[]>([
    { 
      id: 'at1', 
      name: 'Red Devils FC', 
      manager: 'John Doe', 
      phone: '+44 7911 123456', 
      email: 'john.doe@example.com', 
      rosterCount: 8, 
      payment: 'Paid (₹175)', 
      paymentMethod: 'Credit Card', 
      status: 'Pending', 
      requestDate: '10m ago', 
      logo: require('@/assets/images/mascots/bear.png') 
    },
    { 
      id: 'at2', 
      name: 'Blue Tigers', 
      manager: 'Marcus Vance', 
      phone: '+44 7911 234567', 
      email: 'marcus.vance@example.com', 
      rosterCount: 7, 
      payment: 'Paid (₹175)', 
      paymentMethod: 'Apple Pay', 
      status: 'Approved', 
      requestDate: '2h ago', 
      logo: require('@/assets/images/mascots/stallion.png') 
    },
    { 
      id: 'at3', 
      name: 'London United', 
      manager: 'Rob Miller', 
      phone: '+44 7911 345678', 
      email: 'rob.miller@example.com', 
      rosterCount: 5, 
      payment: 'Pending', 
      paymentMethod: 'None', 
      status: 'Changes Requested', 
      requestDate: '1d ago', 
      logo: require('@/assets/images/mascots/eagle.png') 
    },
    { 
      id: 'at4', 
      name: 'Titans CC', 
      manager: 'Sam Wilson', 
      phone: '+44 7911 456789', 
      email: 'sam.wilson@example.com', 
      rosterCount: 11, 
      payment: 'Paid (₹175)', 
      paymentMethod: 'Bank Transfer', 
      status: 'Pending', 
      requestDate: '3d ago', 
      logo: require('@/assets/images/mascots/cobra.png'),
    },
  ]);

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
    // Numbers and leading '+' only up to 15 chars
    const sanitized = text.replace(/[^\d+]/g, '').slice(0, 15);
    setManagerPhone(sanitized);
    if (sanitized.trim()) setErrors(prev => ({ ...prev, managerPhone: false }));
  };

  const handleManagerEmailChange = (text: string) => {
    // Max 50 chars, no spaces
    const sanitized = text.replace(/\s/g, '').slice(0, 50);
    setManagerEmail(sanitized);
  };

  const handleAddPlayer = () => {
    const newId = `p_${Date.now()}`;
    setSquad([...squad, { id: newId, name: '', role: 'Player', idUploaded: false }]);
  };

  const handleRemovePlayer = (id: string) => {
    setSquad(squad.filter(p => p.id !== id));
  };

  const updatePlayerName = (id: string, name: string) => {
    // Characters/letters & spaces ONLY up to 40 chars
    const sanitized = name.replace(/[^a-zA-Z\s]/g, '').slice(0, 40);
    setSquad(squad.map(p => p.id === id ? { ...p, name: sanitized } : p));
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

  // Pricing Calculations
  const entryFee = 150.00;
  const processingFee = 25.00;
  const subtotal = entryFee + processingFee;
  const discount = useWallet ? Math.min(walletBalance, subtotal) : 0;
  const finalPayable = subtotal - discount;

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

    if (managerPhone.trim().replace(/[^\d]/g, '').length < 7) {
      setErrors(prev => ({ ...prev, managerPhone: true }));
      triggerToast('⚠️ Please enter a valid phone number (min 7 digits)');
      return;
    }

    if (managerEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(managerEmail.trim())) {
      triggerToast('⚠️ Please enter a valid email address');
      return;
    }

    setIsPaying(true);
    // Simulate payment API latency
    setTimeout(() => {
      setIsPaying(false);
      setPaySuccess(true);
      triggerToast('🎉 Payment & Registration Successful!');
    }, 2000);
  };

  // Admin Actions
  const handleAdminAction = (id: string, action: 'Approve' | 'Reject' | 'Request Changes') => {
    let statusText: AdminTeam['status'] = 'Approved';
    if (action === 'Reject') statusText = 'Rejected';
    if (action === 'Request Changes') statusText = 'Changes Requested';

    setAdminTeams(adminTeams.map(t => t.id === id ? { ...t, status: statusText } : t));
    triggerToast(`Team is now ${statusText}!`);
  };

  const tournamentName = (params.name as string) || 'London Cup 2026';

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

        {/* User / Admin View Swapper HUD */}
        {(role === 'Organizer' || role === 'Super Admin') && (
          <View style={[styles.modeSwapper, { backgroundColor: theme.primaryContainer }]}>
            <Pressable 
              style={[styles.modeBtn, viewMode === 'user' && { backgroundColor: '#ffffff' }]}
              onPress={() => setViewMode('user')}
            >
              <Ionicons name="create-outline" size={16} color={viewMode === 'user' ? theme.primary : '#ffffff'} style={{ marginRight: 6 }} />
              <ThemedText type="labelSm" style={{ color: viewMode === 'user' ? theme.primary : '#ffffff', fontWeight: '500' }}>Register Team</ThemedText>
            </Pressable>

            <Pressable 
              style={[styles.modeBtn, viewMode === 'admin' && { backgroundColor: '#ffffff' }]}
              onPress={() => setViewMode('admin')}
            >
              <Ionicons name="shield-checkmark-outline" size={16} color={viewMode === 'admin' ? theme.primary : '#ffffff'} style={{ marginRight: 6 }} />
              <ThemedText type="labelSm" style={{ color: viewMode === 'admin' ? theme.primary : '#ffffff', fontWeight: '500' }}>Admin Console</ThemedText>
            </Pressable>
          </View>
        )}

        {viewMode === 'user' ? (
          <>
          {/* USER REGISTRATION FLOW */}
          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
            {paySuccess ? (
              <View style={styles.successContainer}>
                {/* Layered Trophy Illustration */}
                <View style={styles.trophyIllustrationContainer}>
                  <View style={styles.trophyOuterRing} />
                  <View style={styles.trophyMidRing} />
                  <LinearGradient
                    colors={['#5D68E8', '#ff8c00']}
                    style={styles.trophyInnerCircle}
                  >
                    <Ionicons name="trophy" size={36} color="#ffffff" />
                  </LinearGradient>
                  
                  {/* Decorative Sparkles */}
                  <View style={[styles.sparkle, { top: 10, left: 15 }]}>
                    <Ionicons name="star" size={12} color="#5D68E8" />
                  </View>
                  <View style={[styles.sparkle, { bottom: 15, right: 10 }]}>
                    <Ionicons name="star" size={10} color="#5D68E8" />
                  </View>
                  <View style={[styles.sparkle, { top: 25, right: 20 }]}>
                    <Ionicons name="checkmark-circle" size={14} color="#0f9f58" />
                  </View>
                </View>

                <ThemedText type="headlineLg" style={{ color: theme.text, marginTop: 24, textAlign: 'center', fontWeight: '500' }}>
                  Registration Confirmed!
                </ThemedText>
                <ThemedText type="bodySm" style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 8, paddingHorizontal: 20 }}>
                  Your team, <ThemedText type="bodySm" style={{ fontWeight: '500', color: theme.text }}>{teamName}</ThemedText>, is registered for {tournamentName}. You can now view fixtures and manage your team squad.
                </ThemedText>

                <View style={[styles.invoiceMock, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant }]}>
                  <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontWeight: '500' }}>REGISTRATION RECEIPT</ThemedText>
                  <View style={[styles.invoiceRow, { borderBottomColor: theme.outlineVariant + '22', marginTop: 12 }]}>
                    <ThemedText type="bodySm" style={{ color: theme.textSecondary }}>Tournament</ThemedText>
                    <ThemedText type="bodySm" style={{ color: theme.text, fontWeight: '500' }}>{tournamentName}</ThemedText>
                  </View>
                  <View style={[styles.invoiceRow, { borderBottomColor: theme.outlineVariant + '22' }]}>
                    <ThemedText type="bodySm" style={{ color: theme.textSecondary }}>Entry Fee</ThemedText>
                    <ThemedText type="bodySm" style={{ color: theme.text, fontWeight: '500' }}>₹150.00</ThemedText>
                  </View>
                  <View style={[styles.invoiceRow, { borderBottomColor: theme.outlineVariant + '22' }]}>
                    <ThemedText type="bodySm" style={{ color: theme.textSecondary }}>Admin Processing</ThemedText>
                    <ThemedText type="bodySm" style={{ color: theme.text, fontWeight: '500' }}>₹25.00</ThemedText>
                  </View>
                  <View style={[styles.invoiceRow, { borderBottomWidth: 0 }]}>
                    <ThemedText type="bodySm" style={{ color: theme.textSecondary, fontWeight: '500' }}>Total Charged</ThemedText>
                    <ThemedText type="bodySm" style={{ color: theme.secondaryContainer, fontWeight: '500' }}>₹175.00</ThemedText>
                  </View>
                </View>

                <Pressable 
                  style={[styles.invoiceBackBtn, { backgroundColor: theme.primary }]}
                  onPress={() => router.replace('/tournaments')}
                >
                  <ThemedText type="labelSm" style={{ color: '#ffffff' }}>Back to Tournaments</ThemedText>
                </Pressable>
              </View>
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

                <ThemedText type="headlineSm" style={styles.sectionTitle}>1. Team Details</ThemedText>
                <View style={styles.inputGroup}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <ThemedText type="labelSm" style={styles.inputLabel}>
                      Team name <ThemedText style={{ color: theme.error, fontWeight: '500' }}>*</ThemedText>
                    </ThemedText>
                    {errors.teamName && (
                      <ThemedText type="labelSm" style={{ color: theme.error, fontSize: 10 }}>Required</ThemedText>
                    )}
                  </View>
                  <TextInput
                    style={[
                      styles.textInput,
                      { borderColor: errors.teamName ? theme.error : '#00000033', color: theme.text }
                    ]}
                    placeholder="Enter team name"
                    placeholderTextColor="#94a3b8"
                    value={teamName}
                    onChangeText={handleTeamNameChange}
                    maxLength={30}
                  />
                </View>

                <ThemedText type="headlineSm" style={[styles.sectionTitle, { marginTop: Spacing.md }]}>2. Captain / Manager Details</ThemedText>
                <View style={styles.inputGroup}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <ThemedText type="labelSm" style={styles.inputLabel}>
                      Captain / Manager full name <ThemedText style={{ color: theme.error, fontWeight: '500' }}>*</ThemedText>
                    </ThemedText>
                    {errors.managerName && (
                      <ThemedText type="labelSm" style={{ color: theme.error, fontSize: 10 }}>Required</ThemedText>
                    )}
                  </View>
                  <TextInput
                    style={[
                      styles.textInput,
                      { borderColor: errors.managerName ? theme.error : '#00000033', color: theme.text }
                    ]}
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
                    <TextInput
                      style={[
                        styles.textInput,
                        { borderColor: errors.managerPhone ? theme.error : '#00000033', color: theme.text }
                      ]}
                      placeholder="+44 7911 123456"
                      placeholderTextColor="#94a3b8"
                      keyboardType="phone-pad"
                      value={managerPhone}
                      onChangeText={handleManagerPhoneChange}
                      maxLength={15}
                    />
                  </View>
                  <View style={[styles.inputGroup, { width: '48%' }]}>
                    <ThemedText type="labelSm" style={styles.inputLabel}>Email (Optional)</ThemedText>
                    <TextInput
                      style={[styles.textInput, { borderColor: '#00000033', color: theme.text }]}
                      placeholder="john.doe@example.com"
                      placeholderTextColor="#94a3b8"
                      keyboardType="email-address"
                      value={managerEmail}
                      onChangeText={handleManagerEmailChange}
                      maxLength={50}
                    />
                  </View>
                </View>

                {/* 3. FEES AND PAYMENTS (Matching booking.tsx) */}
                <ThemedText type="headlineSm" style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>3. Fees & Payments</ThemedText>
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

                  {/* Wallet Option Card */}
                  <View style={[styles.walletCard, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33' }]}>
                    <View style={styles.walletIconCircle}>
                      <Ionicons name="wallet-outline" size={18} color={theme.primary} />
                    </View>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <ThemedText style={{ fontSize: 13, fontWeight: '500', color: theme.text }}>
                        Pay with Wallet Balance
                      </ThemedText>
                      <ThemedText style={{ fontSize: 11, color: theme.textSecondary, marginTop: 1 }}>
                        Available Balance: ₹{walletBalance.toFixed(2)}
                      </ThemedText>
                    </View>
                    <Pressable 
                      onPress={() => setUseWallet(!useWallet)}
                      style={[styles.applyWalletBtn, { backgroundColor: useWallet ? theme.primary : theme.surfaceLowest }]}
                    >
                      <ThemedText style={{ fontSize: 11, fontWeight: '500', color: useWallet ? '#ffffff' : theme.text }}>
                        {useWallet ? 'Applied (-₹50)' : 'Apply'}
                      </ThemedText>
                      <Ionicons name={useWallet ? 'checkmark-circle' : 'add-circle-outline'} size={14} color={useWallet ? '#ffffff' : theme.textSecondary} />
                    </Pressable>
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
                              <TextInput 
                                placeholder="Card Number (4000 1234 5678 9010)" 
                                placeholderTextColor="#94a3b8"
                                style={[styles.cardTextInput, { borderColor: '#00000033', color: theme.text }]} 
                                keyboardType="number-pad"
                                value={cardNumber}
                                onChangeText={setCardNumber}
                                maxLength={19}
                              />
                              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                                <TextInput 
                                  placeholder="MM/YY" 
                                  placeholderTextColor="#94a3b8"
                                  style={[styles.cardTextInput, { flex: 1, borderColor: '#00000033', color: theme.text }]} 
                                  value={cardExpiry}
                                  onChangeText={setCardExpiry}
                                  maxLength={5}
                                />
                                <TextInput 
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
                <Pressable onPress={handlePayment} style={[Shadows.level2, { width: 220 }]}>
                  <LinearGradient
                    colors={['#5D68E8', '#ff8c00']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.paySubmitBtnGradient}
                  >
                    <ThemedText type="labelMd" style={{ color: '#ffffff', fontWeight: '500', fontSize: 12, letterSpacing: 0.5 }}>PAY & SUBMIT REGISTRATION</ThemedText>
                  </LinearGradient>
                </Pressable>
              )}
            </View>
          )}
        </>
        ) : (
          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
            {/* REDESIGNED HERO BANNER & ADMIN CONTROL PANEL */}
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
                    <Ionicons name="shield-checkmark-outline" size={11} color="#A5B4FC" style={{ marginRight: 4 }} />
                    <ThemedText style={styles.heroMetaText}>Requests Management</ThemedText>
                  </View>
                </View>
              </View>
            </View>

            <ThemedText type="headlineSm" style={styles.sectionTitle}>Registered Teams Requests</ThemedText>
            <View style={styles.adminTable}>
              {adminTeams.map((t) => {
                const method = t.paymentMethod || 'Card';

                return (
                  <View 
                    key={t.id} 
                    style={[
                      styles.adminCard,
                      { backgroundColor: theme.surfaceLowest }
                    ]}
                  >
                    {/* Header: Team name left, status label right */}
                    <View style={styles.mockHeaderRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <Image source={typeof t.logo === 'string' ? { uri: t.logo } : t.logo} style={styles.adminTeamLogo} contentFit="cover" />
                        <ThemedText style={styles.mockTitleText} numberOfLines={1}>
                          {t.name}
                        </ThemedText>
                      </View>
                      
                    </View>

                    {/* Subheader: REGISTRATION INFO left, time right (like + Add Session) */}
                    <View style={styles.mockSubheaderRow}>
                      <ThemedText style={styles.mockSubheaderLeft}>
                        REGISTRATION INFO
                      </ThemedText>
                      <View style={styles.mockSubheaderRightBtn}>
                        <Ionicons name="time-outline" size={11} color="#5D68E8" style={{ marginRight: 4 }} />
                        <ThemedText style={styles.mockSubheaderRight}>
                          Requested {t.requestDate || '10m ago'}
                        </ThemedText>
                      </View>
                    </View>

                    {/* Thin separator line */}
                    <View style={[styles.mockSeparator, { backgroundColor: theme.outlineVariant + '22' }]} />

                    {/* Main Row: (8) Squad Players left, Manager right */}
                    <View style={styles.mockMainRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="people-outline" size={14} color={theme.text} style={{ marginRight: 6 }} />
                        <ThemedText style={styles.mockMainLeftText}>
                          ({(t.rosterCount !== undefined ? t.rosterCount : 8)}) Squad Players
                        </ThemedText>
                      </View>
                      <ThemedText style={styles.mockMainRightText}>
                        Manager: {t.manager}
                      </ThemedText>
                    </View>

                    {/* Invoice Box */}
                    <View style={[styles.mockInvoiceBox, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
                      {/* Top part: Manager contact info */}
                      <View style={[styles.mockInvoiceTop, { backgroundColor: theme.surfaceLow }]}>
                        <View style={styles.mockInvoiceDetailRow}>
                          <Ionicons name="call-outline" size={12} color={theme.textSecondary} style={{ marginRight: 6 }} />
                          <ThemedText style={styles.mockInvoiceLabel}>Phone</ThemedText>
                          <ThemedText style={styles.mockInvoiceVal}>{t.phone || '+44 7911 123456'}</ThemedText>
                        </View>
                        <View style={[styles.mockInvoiceDetailRow, { marginTop: 6 }]}>
                          <Ionicons name="mail-outline" size={12} color={theme.textSecondary} style={{ marginRight: 6 }} />
                          <ThemedText style={styles.mockInvoiceLabel}>Email</ThemedText>
                          <ThemedText style={styles.mockInvoiceVal} numberOfLines={1}>{t.email || 'manager@example.com'}</ThemedText>
                        </View>
                      </View>

                      {/* Bottom part: sky blue invoice total bar with gradient */}
                      <LinearGradient
                        colors={['#e7eeff', '#cce0ff']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.mockInvoiceBottomGradient}
                      >
                        <ThemedText style={styles.mockTotalLabel}>Fees Status ({method})</ThemedText>
                        <ThemedText 
                          style={[
                            styles.mockTotalVal, 
                            { color: t.payment === 'Pending' ? theme.error : '#0f9f58' }
                          ]}
                        >
                          {t.payment}
                        </ThemedText>
                      </LinearGradient>
                    </View>

                    {/* Buttons Section */}
                    {/* Row 1: Secondary Reject and Request Info */}
                    <View style={styles.mockBtnRow}>
                      <Pressable 
                        style={[styles.adminBtnSecondary, { borderColor: '#ffb4ab', backgroundColor: '#ffdad633' }]}
                        onPress={() => handleAdminAction(t.id, 'Reject')}
                      >
                        <Ionicons name="close-circle-outline" size={14} color="#ba1a1a" style={{ marginRight: 4 }} />
                        <ThemedText type="labelSm" style={{ color: '#ba1a1a', fontWeight: '500' }}>Reject</ThemedText>
                      </Pressable>

                      <Pressable 
                        style={[styles.adminBtnSecondary, { borderColor: '#adc6ff', backgroundColor: '#e6f0fa66' }]}
                        onPress={() => handleAdminAction(t.id, 'Request Changes')}
                      >
                        <Ionicons name="chatbubble-ellipses-outline" size={14} color="#2980b9" style={{ marginRight: 4 }} />
                        <ThemedText type="labelSm" style={{ color: '#2980b9', fontWeight: '500' }}>Request Info</ThemedText>
                      </Pressable>
                    </View>

                    {/* Row 2: Full-width Gold Primary Button with LinearGradient */}
                    <Pressable 
                      style={styles.mockFullWidthBtnContainer}
                      onPress={() => handleAdminAction(t.id, 'Approve')}
                    >
                      <LinearGradient
                        colors={['#5D68E8', '#ff8c00']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.mockFullWidthBtnGradient}
                      >
                        <Ionicons name="checkmark-circle-outline" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                        <ThemedText style={styles.mockFullWidthBtnTextGradient}>Approve Registration</ThemedText>
                      </LinearGradient>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        )}
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
  sectionTitle: {
    fontFamily: 'Sora_500Medium',
    fontSize: 10.5,
    marginBottom: 4,
    color: '#64748b',
    letterSpacing: 0.3,
  },
  inputGroup: {
    marginBottom: Spacing.sm + 2,
  },
  inputLabel: {
    marginBottom: 3,
    fontSize: 9,
    fontFamily: 'Sora_500Medium',
    color: '#64748b',
    letterSpacing: 0.1,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 10,
    height: 35,
    fontSize: 11.5,
    fontFamily: 'Sora_400Regular',
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
