import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Platform,
  Dimensions,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const { width } = Dimensions.get('window');

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
  payment: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Changes Requested';
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
    { id: 'at1', name: 'Red Devils FC', manager: 'John Doe', payment: 'Paid (£175)', status: 'Pending' },
    { id: 'at2', name: 'Blue Tigers', manager: 'Marcus Vance', payment: 'Paid (£175)', status: 'Approved' },
    { id: 'at3', name: 'London United', manager: 'Rob Miller', payment: 'Pending', status: 'Changes Requested' },
    { id: 'at4', name: 'Titans CC', manager: 'Sam Wilson', payment: 'Paid (£175)', status: 'Pending' },
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
    <ThemedView style={styles.container}>
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
            style={[styles.modeBtn, viewMode === 'user' && { backgroundColor: theme.secondaryContainer }]}
            onPress={() => setViewMode('user')}
          >
            <Ionicons name="create-outline" size={16} color={viewMode === 'user' ? '#6b4500' : '#ffffff'} style={{ marginRight: 6 }} />
            <ThemedText type="labelSm" style={{ color: viewMode === 'user' ? '#6b4500' : '#ffffff', fontWeight: 'bold' }}>Register Team</ThemedText>
          </Pressable>

          <Pressable 
            style={[styles.modeBtn, viewMode === 'admin' && { backgroundColor: theme.secondaryContainer }]}
            onPress={() => setViewMode('admin')}
          >
            <Ionicons name="shield-checkmark-outline" size={16} color={viewMode === 'admin' ? '#6b4500' : '#ffffff'} style={{ marginRight: 6 }} />
            <ThemedText type="labelSm" style={{ color: viewMode === 'admin' ? '#6b4500' : '#ffffff', fontWeight: 'bold' }}>Admin Console</ThemedText>
          </Pressable>
        </View>

        {viewMode === 'user' ? (
          // USER REGISTRATION FLOW
          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
            {paySuccess ? (
              // Success Screen
              <View style={styles.successContainer}>
                <Ionicons name="checkmark-circle" size={80} color="#0f9f58" />
                <ThemedText type="headlineLg" style={{ color: theme.text, marginTop: 16, textAlign: 'center' }}>
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
                    <ThemedText type="bodySm" style={{ color: theme.text, fontWeight: 'bold' }}>£150.00</ThemedText>
                  </View>
                  <View style={[styles.invoiceRow, { borderBottomColor: theme.outlineVariant + '22' }]}>
                    <ThemedText type="bodySm" style={{ color: theme.textSecondary }}>Admin Processing</ThemedText>
                    <ThemedText type="bodySm" style={{ color: theme.text, fontWeight: 'bold' }}>£25.00</ThemedText>
                  </View>
                  <View style={[styles.invoiceRow, { borderBottomWidth: 0 }]}>
                    <ThemedText type="bodySm" style={{ color: theme.textSecondary, fontWeight: 'bold' }}>Total Charged</ThemedText>
                    <ThemedText type="bodySm" style={{ color: theme.secondaryContainer, fontWeight: 'bold' }}>£175.00</ThemedText>
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
                    <View key={player.id} style={[styles.playerFormCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '44' }]}>
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
                <View style={[styles.paymentPortal, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant }]}>
                  <View style={styles.rowBetween}>
                    <ThemedText type="bodySm" style={{ color: theme.textSecondary }}>Entry Fee</ThemedText>
                    <ThemedText type="bodySm" style={{ color: theme.text, fontWeight: 'bold' }}>£150.00</ThemedText>
                  </View>
                  <View style={styles.rowBetween}>
                    <ThemedText type="bodySm" style={{ color: theme.textSecondary }}>Processing</ThemedText>
                    <ThemedText type="bodySm" style={{ color: theme.text, fontWeight: 'bold' }}>£25.00</ThemedText>
                  </View>
                  <View style={[styles.rowBetween, { borderTopWidth: 1, borderTopColor: theme.outlineVariant + '33', marginTop: 12, paddingTop: 8 }]}>
                    <ThemedText type="bodySm" style={{ color: theme.text, fontWeight: 'bold' }}>Total Due</ThemedText>
                    <ThemedText type="bodyLg" style={{ color: theme.secondaryContainer, fontWeight: 'bold' }}>£175.00</ThemedText>
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
                    <Pressable style={[styles.paySubmitBtn, { backgroundColor: theme.secondaryContainer }]} onPress={handlePayment}>
                      <ThemedText type="labelMd" style={{ color: '#6b4500', fontWeight: 'bold' }}>PAY & SUBMIT REGISTRATION</ThemedText>
                    </Pressable>
                  )}
                </View>
              </View>
            )}
          </ScrollView>
        ) : (
          // ADMIN CONTROL PANEL
          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
            <ThemedText type="headlineSm" style={styles.sectionTitle}>Registered Teams Requests</ThemedText>
            
            <View style={[styles.adminTable, { borderColor: theme.outlineVariant + '44' }]}>
              {adminTeams.map((t) => (
                <View key={t.id} style={[styles.adminCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '22' }]}>
                  <View style={styles.rowBetween}>
                    <View>
                      <ThemedText type="bodySm" style={{ fontWeight: 'bold', color: theme.text }}>{t.name}</ThemedText>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: 10 }}>Manager: {t.manager}</ThemedText>
                    </View>
                    
                    <View style={[
                      styles.statusLabel,
                      t.status === 'Pending' && { backgroundColor: '#fff4e5' },
                      t.status === 'Approved' && { backgroundColor: '#e2f9ec' },
                      t.status === 'Rejected' && { backgroundColor: '#ffdad6' },
                      t.status === 'Changes Requested' && { backgroundColor: '#e6f0fa' }
                    ]}>
                      <ThemedText type="labelSm" style={[
                        { fontSize: 9, fontWeight: '700' },
                        t.status === 'Pending' && { color: '#e67e22' },
                        t.status === 'Approved' && { color: '#0f9f58' },
                        t.status === 'Rejected' && { color: '#ba1a1a' },
                        t.status === 'Changes Requested' && { color: '#2980b9' }
                      ]}>
                        {t.status}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={[styles.adminCardMeta, { borderTopColor: theme.outlineVariant + '11' }]}>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: 10 }}>Fees Status: {t.payment}</ThemedText>
                  </View>

                  <View style={styles.adminActionsRow}>
                    <Pressable 
                      style={[styles.adminBtn, { backgroundColor: '#e2f9ec' }]}
                      onPress={() => handleAdminAction(t.id, 'Approve')}
                    >
                      <Ionicons name="checkmark" size={12} color="#0f9f58" style={{ marginRight: 2 }} />
                      <ThemedText type="labelSm" style={{ color: '#0f9f58', fontSize: 10 }}>Approve</ThemedText>
                    </Pressable>

                    <Pressable 
                      style={[styles.adminBtn, { backgroundColor: '#ffdad6' }]}
                      onPress={() => handleAdminAction(t.id, 'Reject')}
                    >
                      <Ionicons name="close" size={12} color="#ba1a1a" style={{ marginRight: 2 }} />
                      <ThemedText type="labelSm" style={{ color: '#ba1a1a', fontSize: 10 }}>Reject</ThemedText>
                    </Pressable>

                    <Pressable 
                      style={[styles.adminBtn, { backgroundColor: '#e6f0fa' }]}
                      onPress={() => handleAdminAction(t.id, 'Request Changes')}
                    >
                      <Ionicons name="refresh" size={12} color="#2980b9" style={{ marginRight: 2 }} />
                      <ThemedText type="labelSm" style={{ color: '#2980b9', fontSize: 10 }}>Request Info</ThemedText>
                    </Pressable>
                  </View>
                </View>
              ))}
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
    </ThemedView>
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
    color: '#05151e',
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
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
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
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginTop: Spacing.xs,
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
  },
  adminCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
  },
  statusLabel: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.md,
  },
  adminCardMeta: {
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 8,
  },
  adminActionsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
  },
  adminBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
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
});
