import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GradientContainer } from '@/components/gradient-container';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface RosterPlayer {
  id: string;
  name: string;
  role: string;
  idUploaded: boolean;
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
  logo: string;
  requestDate: string;
}

export default function TeamRegistrationScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();

  // Mode state: 'user' or 'admin'
  const [viewMode, setViewMode] = useState<'user' | 'admin'>('user');

  // Form State
  const [teamName, setTeamName] = useState('');
  const [managerName, setManagerName] = useState('John Doe');
  const [managerPhone, setManagerPhone] = useState('+44 7911 123456');
  const [managerEmail, setManagerEmail] = useState('john.doe@example.com');
  const [paymentMethod, setPaymentMethod] = useState<'Card' | 'ApplePay' | 'Transfer'>('Card');
  
  // Roster players state
  const [roster, setRoster] = useState<RosterPlayer[]>([
    { id: 'p1', name: 'Marcus Vance', role: 'Captain / Forward', idUploaded: true },
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
      paymentMethod: 'Card', 
      status: 'Pending', 
      requestDate: '10m ago', 
      logo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&q=80' 
    },
    { 
      id: 'at2', 
      name: 'Blue Tigers', 
      manager: 'Marcus Vance', 
      phone: '+44 7911 234567', 
      email: 'marcus.vance@example.com', 
      rosterCount: 7, 
      payment: 'Paid (₹175)', 
      paymentMethod: 'ApplePay', 
      status: 'Approved', 
      requestDate: '2h ago', 
      logo: 'https://images.unsplash.com/photo-1531415080290-bc98545ab3ef?auto=format&fit=crop&w=120&q=80' 
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
      logo: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=120&q=80' 
    },
    { 
      id: 'at4', 
      name: 'Titans CC', 
      manager: 'Sam Wilson', 
      phone: '+44 7911 456789', 
      email: 'sam.wilson@example.com', 
      rosterCount: 11, 
      payment: 'Paid (₹175)', 
      paymentMethod: 'Transfer', 
      status: 'Pending', 
      requestDate: '3d ago', 
      logo: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=120&q=80' 
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
      Animated.delay(1800),
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => setToastMsg(null));
  };

  const handleAddPlayer = () => {
    const newId = `p_${Date.now()}`;
    setRoster([...roster, { id: newId, name: '', role: 'Player', idUploaded: false }]);
  };

  const handleRemovePlayer = (id: string) => {
    setRoster(roster.filter(p => p.id !== id));
  };

  const updatePlayerName = (id: string, name: string) => {
    setRoster(roster.map(p => p.id === id ? { ...p, name } : p));
  };

  const updatePlayerRole = (id: string, role: string) => {
    setRoster(roster.map(p => p.id === id ? { ...p, role } : p));
  };

  const handleUploadId = (id: string) => {
    setRoster(roster.map(p => p.id === id ? { ...p, idUploaded: true } : p));
    triggerToast('Player ID Document uploaded successfully!');
  };

  const handlePayment = () => {
    if (!teamName) {
      triggerToast('Please enter a Team Name.');
      return;
    }
    setIsPaying(true);
    // Simulate payment api latency
    setTimeout(() => {
      setIsPaying(false);
      setPaySuccess(true);
      triggerToast('Payment & Registration Successful!');
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
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header Stack Bar */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </Pressable>
          <ThemedText type="headlineMd" numberOfLines={1} style={{ color: theme.text, flex: 1, marginLeft: 12 }}>
            Register for {tournamentName}
          </ThemedText>
        </View>

        {/* User / Admin View Swapper HUD */}
        <View style={[styles.modeSwapper, { backgroundColor: theme.primaryContainer }]}>
          <Pressable 
            style={[styles.modeBtn, viewMode === 'user' && { backgroundColor: '#ffffff' }]}
            onPress={() => setViewMode('user')}
          >
            <Ionicons name="create-outline" size={16} color={viewMode === 'user' ? theme.primary : '#ffffff'} style={{ marginRight: 6 }} />
            <ThemedText type="labelSm" style={{ color: viewMode === 'user' ? theme.primary : '#ffffff', fontWeight: 'bold' }}>Register Team</ThemedText>
          </Pressable>

          <Pressable 
            style={[styles.modeBtn, viewMode === 'admin' && { backgroundColor: '#ffffff' }]}
            onPress={() => setViewMode('admin')}
          >
            <Ionicons name="shield-checkmark-outline" size={16} color={viewMode === 'admin' ? theme.primary : '#ffffff'} style={{ marginRight: 6 }} />
            <ThemedText type="labelSm" style={{ color: viewMode === 'admin' ? theme.primary : '#ffffff', fontWeight: 'bold' }}>Admin Console</ThemedText>
          </Pressable>
        </View>

        {viewMode === 'user' ? (
          // USER REGISTRATION FLOW
          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
            {paySuccess ? (
              // Success Screen
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

                <ThemedText type="headlineLg" style={{ color: theme.text, marginTop: 24, textAlign: 'center', fontWeight: 'bold' }}>
                  Registration Confirmed!
                </ThemedText>
                <ThemedText type="bodySm" style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 8, paddingHorizontal: 20 }}>
                  Your team, <ThemedText type="bodySm" style={{ fontWeight: 'bold', color: theme.text }}>{teamName}</ThemedText>, is registered for {tournamentName}. You can now view fixtures and manage your team roster.
                </ThemedText>

                <View style={[styles.invoiceMock, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant }]}>
                  <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontWeight: 'bold' }}>REGISTRATION RECEIPT</ThemedText>
                  <View style={[styles.invoiceRow, { borderBottomColor: theme.outlineVariant + '22', marginTop: 12 }]}>
                    <ThemedText type="bodySm" style={{ color: theme.textSecondary }}>Tournament</ThemedText>
                    <ThemedText type="bodySm" style={{ color: theme.text, fontWeight: 'bold' }}>{tournamentName}</ThemedText>
                  </View>
                  <View style={[styles.invoiceRow, { borderBottomColor: theme.outlineVariant + '22' }]}>
                    <ThemedText type="bodySm" style={{ color: theme.textSecondary }}>Entry Fee</ThemedText>
                    <ThemedText type="bodySm" style={{ color: theme.text, fontWeight: 'bold' }}>₹150.00</ThemedText>
                  </View>
                  <View style={[styles.invoiceRow, { borderBottomColor: theme.outlineVariant + '22' }]}>
                    <ThemedText type="bodySm" style={{ color: theme.textSecondary }}>Admin Processing</ThemedText>
                    <ThemedText type="bodySm" style={{ color: theme.text, fontWeight: 'bold' }}>₹25.00</ThemedText>
                  </View>
                  <View style={[styles.invoiceRow, { borderBottomWidth: 0 }]}>
                    <ThemedText type="bodySm" style={{ color: theme.textSecondary, fontWeight: 'bold' }}>Total Charged</ThemedText>
                    <ThemedText type="bodySm" style={{ color: theme.secondaryContainer, fontWeight: 'bold' }}>₹175.00</ThemedText>
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
              // Registration Fields Form
              <View>
                {/* HERO BANNER */}
                <View style={styles.heroBannerContainer}>
                  <Image 
                    source="https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80" 
                    style={styles.heroBannerImage}
                    contentFit="cover"
                  />
                  <LinearGradient
                    colors={['rgba(5, 21, 30, 0.1)', 'rgba(5, 21, 30, 0.85)']}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.heroContent}>
                    <View style={styles.heroBadge}>
                      <ThemedText style={styles.heroBadgeText}>TOURNAMENT REGISTRATION</ThemedText>
                    </View>
                    <ThemedText style={styles.heroTitle}>{tournamentName}</ThemedText>
                    <View style={styles.heroRow}>
                      <View style={styles.heroMetaItem}>
                        <Ionicons name="calendar-outline" size={12} color="#5D68E8" style={{ marginRight: 4 }} />
                        <ThemedText style={styles.heroMetaText}>Starts July 15, 2026</ThemedText>
                      </View>
                      <View style={styles.heroMetaItem}>
                        <Ionicons name="location-outline" size={12} color="#5D68E8" style={{ marginRight: 4 }} />
                        <ThemedText style={styles.heroMetaText}>London Arena</ThemedText>
                      </View>
                    </View>
                  </View>
                </View>

                <ThemedText type="headlineSm" style={styles.sectionTitle}>1. Team Details</ThemedText>
                <View style={styles.inputGroup}>
                  <ThemedText type="labelSm" style={styles.inputLabel}>Team Name *</ThemedText>
                  <TextInput
                    style={[styles.textInput, { borderColor: theme.outlineVariant, color: theme.text }]}
                    placeholder="Enter team name"
                    placeholderTextColor={theme.textSecondary}
                    value={teamName}
                    onChangeText={setTeamName}
                  />
                </View>

                <ThemedText type="headlineSm" style={[styles.sectionTitle, { marginTop: Spacing.md }]}>2. Manager Credentials</ThemedText>
                <View style={styles.inputGroup}>
                  <ThemedText type="labelSm" style={styles.inputLabel}>Manager Full Name</ThemedText>
                  <TextInput
                    style={[styles.textInput, { borderColor: theme.outlineVariant, color: theme.text }]}
                    placeholder="Manager Name"
                    value={managerName}
                    onChangeText={setManagerName}
                  />
                </View>
                <View style={styles.rowBetween}>
                  <View style={[styles.inputGroup, { width: '48%' }]}>
                    <ThemedText type="labelSm" style={styles.inputLabel}>Manager Phone</ThemedText>
                    <TextInput
                      style={[styles.textInput, { borderColor: theme.outlineVariant, color: theme.text }]}
                      placeholder="Phone"
                      value={managerPhone}
                      onChangeText={setManagerPhone}
                    />
                  </View>
                  <View style={[styles.inputGroup, { width: '48%' }]}>
                    <ThemedText type="labelSm" style={styles.inputLabel}>Manager Email</ThemedText>
                    <TextInput
                      style={[styles.textInput, { borderColor: theme.outlineVariant, color: theme.text }]}
                      placeholder="Email"
                      value={managerEmail}
                      onChangeText={setManagerEmail}
                    />
                  </View>
                </View>

                <ThemedText type="headlineSm" style={[styles.sectionTitle, { marginTop: Spacing.md }]}>3. Member Roster</ThemedText>
                <View style={styles.rosterSection}>
                  {roster.map((player, idx) => (
                    <View key={player.id} style={[styles.playerFormCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '22' }, Shadows.level1]}>
                      <View style={styles.rowBetween}>
                        <ThemedText type="labelSm" style={{ color: theme.text, fontWeight: 'bold' }}>Player #{idx + 1}</ThemedText>
                        <Pressable onPress={() => handleRemovePlayer(player.id)}>
                          <Ionicons name="trash-outline" size={16} color={theme.error} />
                        </Pressable>
                      </View>
                      
                      <View style={styles.playerInputRow}>
                        <TextInput
                          style={[styles.playerInput, { borderColor: theme.outlineVariant, color: theme.text }]}
                          placeholder="Player Full Name"
                          placeholderTextColor={theme.textSecondary}
                          value={player.name}
                          onChangeText={(v) => updatePlayerName(player.id, v)}
                        />
                        <TextInput
                          style={[styles.playerInput, { borderColor: theme.outlineVariant, color: theme.text }]}
                          placeholder="Role (e.g. Forward)"
                          placeholderTextColor={theme.textSecondary}
                          value={player.role}
                          onChangeText={(v) => updatePlayerRole(player.id, v)}
                        />
                      </View>

                      {/* Mock Upload Document Button */}
                      <Pressable 
                        style={[
                          styles.uploadBtn, 
                          { backgroundColor: theme.surfaceLow },
                          player.idUploaded && { backgroundColor: '#e2f9ec' }
                        ]}
                        onPress={() => handleUploadId(player.id)}
                      >
                        <Ionicons 
                          name={player.idUploaded ? 'checkmark-circle' : 'cloud-upload-outline'} 
                          size={14} 
                          color={player.idUploaded ? '#0f9f58' : theme.text} 
                          style={{ marginRight: 6 }} 
                        />
                        <ThemedText type="labelSm" style={{ color: player.idUploaded ? '#0f9f58' : theme.text, fontSize: 10 }}>
                          {player.idUploaded ? 'ID Verification Uploaded' : 'Upload ID Verification'}
                        </ThemedText>
                      </Pressable>
                    </View>
                  ))}

                  <Pressable style={[styles.addPlayerBtn, { borderColor: theme.outlineVariant }]} onPress={handleAddPlayer}>
                    <Ionicons name="add" size={16} color={theme.text} />
                    <ThemedText type="labelSm" style={{ color: theme.text, marginLeft: 4 }}>Add Roster Player</ThemedText>
                  </Pressable>
                </View>

                <ThemedText type="headlineSm" style={[styles.sectionTitle, { marginTop: Spacing.md }]}>4. Fees & Payments</ThemedText>
                <View style={[styles.paymentPortal, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '22' }, Shadows.level1]}>
                  <View style={styles.rowBetween}>
                    <ThemedText type="bodySm" style={{ color: theme.textSecondary }}>Entry Fee</ThemedText>
                    <ThemedText type="bodySm" style={{ color: theme.text, fontWeight: 'bold' }}>₹150.00</ThemedText>
                  </View>
                  <View style={styles.rowBetween}>
                    <ThemedText type="bodySm" style={{ color: theme.textSecondary }}>Processing</ThemedText>
                    <ThemedText type="bodySm" style={{ color: theme.text, fontWeight: 'bold' }}>₹25.00</ThemedText>
                  </View>
                  <View style={[styles.rowBetween, { borderTopWidth: 1, borderTopColor: theme.outlineVariant + '33', marginTop: 12, paddingTop: 8 }]}>
                    <ThemedText type="bodySm" style={{ color: theme.text, fontWeight: 'bold' }}>Total Due</ThemedText>
                    <ThemedText type="bodyLg" style={{ color: theme.secondaryContainer, fontWeight: 'bold' }}>₹175.00</ThemedText>
                  </View>

                  <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginTop: Spacing.md, marginBottom: 8 }}>Select Payment Method</ThemedText>
                  <View style={styles.paymentMethodsRow}>
                    {[
                      { id: 'Card', name: 'Credit Card', icon: 'card-outline' },
                      { id: 'ApplePay', name: 'Apple Pay', icon: 'logo-apple' },
                      { id: 'Transfer', name: 'Bank Trans.', icon: 'business-outline' },
                    ].map(method => (
                      <Pressable
                        key={method.id}
                        style={[
                          styles.payMethodCard,
                          { borderColor: theme.outlineVariant },
                          paymentMethod === method.id && { backgroundColor: theme.primary, borderColor: theme.primary }
                        ]}
                        onPress={() => setPaymentMethod(method.id as any)}
                      >
                        <Ionicons name={method.icon as any} size={16} color={paymentMethod === method.id ? '#ffffff' : theme.text} />
                        <ThemedText type="labelSm" style={{ color: paymentMethod === method.id ? '#ffffff' : theme.text, fontSize: 10, marginTop: 4 }}>
                          {method.name}
                        </ThemedText>
                      </Pressable>
                    ))}
                  </View>

                  {isPaying ? (
                    <ActivityIndicator size="small" color={theme.secondaryContainer} style={{ marginTop: 20 }} />
                  ) : (
                    <Pressable onPress={handlePayment} style={Shadows.level2}>
                      <LinearGradient
                        colors={['#5D68E8', '#ff8c00']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.paySubmitBtnGradient}
                      >
                        <ThemedText type="labelMd" style={{ color: '#ffffff', fontWeight: 'bold' }}>PAY & SUBMIT REGISTRATION</ThemedText>
                      </LinearGradient>
                    </Pressable>
                  )}
                </View>
              </View>
            )}
          </ScrollView>
        ) : (
          // ADMIN CONTROL PANEL
          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
            {/* HERO BANNER */}
            <View style={styles.heroBannerContainer}>
              <Image 
                source="https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80" 
                style={styles.heroBannerImage}
                contentFit="cover"
              />
              <LinearGradient
                colors={['rgba(5, 21, 30, 0.1)', 'rgba(5, 21, 30, 0.85)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.heroContent}>
                <View style={styles.heroBadge}>
                  <ThemedText style={styles.heroBadgeText}>ADMIN CONTROL PANEL</ThemedText>
                </View>
                <ThemedText style={styles.heroTitle}>{tournamentName}</ThemedText>
                <View style={styles.heroRow}>
                  <View style={styles.heroMetaItem}>
                    <Ionicons name="shield-checkmark-outline" size={12} color="#5D68E8" style={{ marginRight: 4 }} />
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
                        <Image source={t.logo} style={styles.adminTeamLogo} contentFit="cover" />
                        <ThemedText style={styles.mockTitleText} numberOfLines={1}>
                          {t.name}
                        </ThemedText>
                      </View>
                      
                      <View style={[
                        styles.statusLabel,
                        t.status === 'Pending' && { backgroundColor: '#fff4e5' },
                        t.status === 'Approved' && { backgroundColor: '#e2f9ec' },
                        t.status === 'Rejected' && { backgroundColor: '#ffdad6' },
                        t.status === 'Changes Requested' && { backgroundColor: '#e6f0fa' }
                      ]}>
                        <ThemedText type="labelSm" style={[
                          { fontSize: 8, fontWeight: '800' },
                          t.status === 'Pending' && { color: '#e67e22' },
                          t.status === 'Approved' && { color: '#0f9f58' },
                          t.status === 'Rejected' && { color: '#ba1a1a' },
                          t.status === 'Changes Requested' && { color: '#2980b9' }
                        ]}>
                          {t.status.toUpperCase()}
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

                    {/* Main Row: (8) Roster Players left, Manager right */}
                    <View style={styles.mockMainRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="people-outline" size={14} color={theme.text} style={{ marginRight: 6 }} />
                        <ThemedText style={styles.mockMainLeftText}>
                          ({(t.rosterCount !== undefined ? t.rosterCount : 8)}) Roster Players
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
                        <ThemedText type="labelSm" style={{ color: '#ba1a1a', fontWeight: 'bold' }}>Reject</ThemedText>
                      </Pressable>

                      <Pressable 
                        style={[styles.adminBtnSecondary, { borderColor: '#adc6ff', backgroundColor: '#e6f0fa66' }]}
                        onPress={() => handleAdminAction(t.id, 'Request Changes')}
                      >
                        <Ionicons name="chatbubble-ellipses-outline" size={14} color="#2980b9" style={{ marginRight: 4 }} />
                        <ThemedText type="labelSm" style={{ color: '#2980b9', fontWeight: 'bold' }}>Request Info</ThemedText>
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
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 48,
    fontSize: 14,
    fontFamily: 'HankenGrotesk_400Regular',
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
    fontFamily: 'HankenGrotesk_400Regular',
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
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    paddingVertical: 10,
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
  statusLabel: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.md,
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
    fontWeight: 'bold',
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
    fontWeight: 'bold',
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
    fontWeight: '700',
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
    fontWeight: '600',
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
    fontWeight: '600',
    color: '#43474b',
  },
  mockTotalVal: {
    fontSize: 13,
    fontWeight: '700',
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
    fontWeight: 'bold',
    color: '#6b4500',
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
    fontWeight: 'bold',
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
    height: 150,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  heroBannerImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  heroContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  heroBadge: {
    backgroundColor: '#5D68E8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  heroBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6b4500',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'HankenGrotesk_700Bold',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroMetaText: {
    fontSize: 11,
    color: '#dee8ff',
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
});
