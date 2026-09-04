// Updated cricket scoring console - auto scroll and pre-verification options
import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Modal,
  Alert,
  TextInput,
  ActivityIndicator,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getAvatarSource } from '@/constants/avatars';
import { matchApi } from '@/services/match-api';
import { useMatchStore, useWalletStore } from '@/store/app-store';
import { ScoreboardBoundaryWatermark } from '@/components/scoring/ScoreboardBoundaryWatermark';
import { saveMatchToOwnBoard } from '@/store/own-board-store';
import { exportScoreSheetPDF } from '@/services/score-sheet-pdf';
import { registerFoFPlayer } from '@/services/fof-network';
import { CoinTossModal } from '@/components/coin-toss-modal';
import { PlayerSelectionModal, strictDedupe } from '@/components/matches/PlayerSelectionModal';
import { Player } from '@/store/match-store';
import {
  ChangePlayerModal,
  EditPlayerModal,
  SwapPlayersModal,
  normalizePlayer,
  type SquadPlayer,
} from '@/components/scoring/squad-modals';

interface Batsman {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  active: boolean;
  avatar?: string;
  outInfo?: string;
}

interface Bowler {
  name: string;
  overs: number;
  ballsInOver: number;
  maidens: number;
  runs: number;
  wickets: number;
  avatar?: string;
}

import {
  isLegalDelivery,
  countsAsBallFaced,
  ranRuns,
  shouldRotateStrike,
  batsmanRunsFromExtra,
  extraLogSymbol,
  wicketLogSymbol,
  bowlerGetsCredit,
  dismissedBatsmanIndex,
  isTargetReached,
  BALLS_PER_OVER,
} from '@/lib/cricket-engine';

export function formatMobileNumber(phone?: string | null): string {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  if (digits.length >= 10) {
    const last10 = digits.slice(-10);
    return `+91 ${last10.slice(0, 5)} ${last10.slice(5)}`;
  }
  return phone;
}

export const shortCode = (name?: string, fallback: string = 'TM'): string => {
  const words = (name || '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return fallback;
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

function getTwoLetterLogo(name: string): string {
  if (!name || !name.trim()) return 'NP';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const PRESET_AVATARS = [
  'avatar_1',
  'avatar_2',
  'avatar_3',
  'avatar_4',
  'avatar_5',
  'avatar_6',
  'avatar_7',
  'avatar_8',
];

function NewPlayerModal({
  visible,
  onClose,
  onSave,
  theme,
  initialSearchQuery,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (player: { name: string; avatar?: string; mobile?: string; role?: string; details?: string }) => void;
  theme: any;
  initialSearchQuery?: string;
}) {
  const { addWalletFunds } = useWalletStore();
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [avatar, setAvatar] = useState<string>('avatar_1'); // Default as Avatar!
  const [role, setRole] = useState('Batsman');
  const [details, setDetails] = useState('Right-hand Bat');
  const [otpStatus, setOtpStatus] = useState<'idle' | 'sent' | 'verified'>('idle');
  const [otpCode, setOtpCode] = useState('');
  const [coinsClaimed, setCoinsClaimed] = useState(false);

  // Auto pre-fill from search query if passed
  React.useEffect(() => {
    if (visible) {
      if (initialSearchQuery && initialSearchQuery.trim()) {
        const q = initialSearchQuery.trim();
        if (/^\d+$/.test(q)) {
          setMobile(q.slice(0, 10));
        } else {
          setName(q.replace(/[^a-zA-Z\s]/g, '').slice(0, 25));
        }
      }
    }
  }, [visible, initialSearchQuery]);

  const twoLetterMonogram = React.useMemo(() => getTwoLetterLogo(name), [name]);

  const handlePickCustomImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatar(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Could not open photo library.');
    }
  };

  const handleSendOtp = () => {
    if (mobile.length !== 10) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    setOtpStatus('sent');
    setOtpCode('1234');
  };

  const handleVerifyOtp = () => {
    if (otpCode.trim() !== '1234' && otpCode.trim().length !== 4) {
      Alert.alert('Invalid OTP', 'Please enter the 4-digit code (Demo OTP: 1234).');
      return;
    }
    setOtpStatus('verified');
    if (!coinsClaimed) {
      addWalletFunds(5);
      setCoinsClaimed(true);
      Alert.alert('🎉 +5 Coins Added!', '5 Credit Coins deposited into your Turf Wallet.');
    }
  };

  const isSaveDisabled = !name.trim();

  const handleSavePlayer = () => {
    if (isSaveDisabled) {
      Alert.alert('Name Required', 'Please enter player full name.');
      return;
    }
    const trimmedName = name.trim();
    const trimmedMobile = mobile.trim() || undefined;

    // Register player under logged-in user in FoF chain database
    registerFoFPlayer({
      name: trimmedName,
      phone: trimmedMobile,
      avatar: avatar || undefined,
      role,
      sport: 'Cricket 🏏',
    });

    onSave({
      name: trimmedName,
      avatar: avatar || undefined,
      mobile: trimmedMobile,
      role,
      details,
    });
    setName('');
    setMobile('');
    setAvatar('avatar_1');
    setOtpStatus('idle');
    setOtpCode('');
    setCoinsClaimed(false);
    onClose();
  };

  const isCustomUri = avatar.startsWith('file://') || avatar.startsWith('http') || avatar.startsWith('data:');
  const isMonogram = avatar === 'monogram';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <View style={{ width: '100%', maxWidth: 380, maxHeight: '90%', backgroundColor: theme.background || '#ffffff', borderRadius: 20, borderWidth: 1, borderColor: theme.outlineVariant + '33', padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 15 }}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <View>
                <ThemedText type="headlineSm" style={{ fontSize: 16, fontFamily: 'Sora_500Medium', color: theme.text }}>
                  Add New Player
                </ThemedText>
                <ThemedText style={{ fontSize: 11, color: theme.textSecondary, marginTop: 1 }}>
                  Create profile & sync with match squad
                </ThemedText>
              </View>
              <Pressable onPress={onClose} style={{ padding: 4 }}>
                <Ionicons name="close-circle-outline" size={24} color={theme.textSecondary} />
              </Pressable>
            </View>

            {/* Profile Pic / Avatar Preview & Selector Section */}
            <View style={{ alignItems: 'center', marginVertical: 8 }}>
              <View style={{ position: 'relative' }}>
                {isCustomUri ? (
                  <Image source={{ uri: avatar }} style={{ width: 76, height: 76, borderRadius: 38, borderWidth: 2.5, borderColor: theme.primary }} contentFit="cover" />
                ) : isMonogram ? (
                  <View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2.5, borderColor: theme.primary + '44' }}>
                    <ThemedText style={{ fontSize: 26, fontFamily: 'Sora_500Medium', color: '#ffffff', letterSpacing: 1 }}>
                      {twoLetterMonogram}
                    </ThemedText>
                  </View>
                ) : (
                  <Image source={getAvatarSource(avatar)} style={{ width: 76, height: 76, borderRadius: 38, borderWidth: 2.5, borderColor: theme.primary }} contentFit="cover" />
                )}
                <Pressable
                  onPress={handlePickCustomImage}
                  style={{
                    position: 'absolute',
                    bottom: -2,
                    right: -2,
                    backgroundColor: theme.primary,
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 2,
                    borderColor: '#ffffff',
                  }}
                >
                  <Ionicons name="camera" size={13} color="#ffffff" />
                </Pressable>
              </View>

              {/* Avatar Preset & Upload Actions */}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' }}>
                <Pressable
                  onPress={handlePickCustomImage}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    backgroundColor: isCustomUri ? theme.primary + '18' : theme.surfaceLow,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: isCustomUri ? theme.primary : theme.outlineVariant + '44',
                  }}
                >
                  <Ionicons name="image-outline" size={13} color={theme.primary} />
                  <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_500Medium', color: theme.primary }}>
                    Upload Photo
                  </ThemedText>
                </Pressable>

                <Pressable
                  onPress={() => setAvatar('monogram')}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    backgroundColor: isMonogram ? theme.primary + '18' : theme.surfaceLow,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: isMonogram ? theme.primary : theme.outlineVariant + '44',
                  }}
                >
                  <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_500Medium', color: isMonogram ? theme.primary : theme.textSecondary }}>
                    2-Letter Logo
                  </ThemedText>
                </Pressable>
              </View>

              {/* Quick Preset Avatars Carousel */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingHorizontal: 4, marginTop: 8 }}
              >
                {PRESET_AVATARS.map((avKey) => {
                  const isSelected = avatar === avKey;
                  return (
                    <Pressable
                      key={avKey}
                      onPress={() => setAvatar(avKey)}
                      style={{
                        padding: 2,
                        borderRadius: 18,
                        borderWidth: 2,
                        borderColor: isSelected ? theme.primary : 'transparent',
                      }}
                    >
                      <Image
                        source={getAvatarSource(avKey)}
                        style={{ width: 32, height: 32, borderRadius: 16 }}
                        contentFit="cover"
                      />
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Input: Player Name with Red Mandatory Asterisk */}
            <View style={{ marginTop: 8 }}>
              <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: theme.text, marginBottom: 5 }}>
                Player Full Name <ThemedText style={{ color: '#ef4444', fontFamily: 'Sora_500Medium' }}>*</ThemedText>
              </ThemedText>
              <TextInput
                value={name}
                onChangeText={(val) => setName(val.replace(/[^a-zA-Z\s]/g, ''))}
                placeholder="e.g. Arun Prakash"
                placeholderTextColor="#94a3b8"
                maxLength={25}
                style={{
                  backgroundColor: theme.surfaceLowest || '#ffffff',
                  borderWidth: 1.5,
                  borderColor: theme.outlineVariant + '44',
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  height: 38,
                  fontSize: 13,
                  fontFamily: 'Sora_500Medium',
                  color: theme.text,
                }}
              />
            </View>

            {/* Input: Phone Number */}
            <View style={{ marginTop: 10 }}>
              <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: theme.text, marginBottom: 5 }}>
                Phone Number (Match Stats Sync)
              </ThemedText>
              <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                <View style={{ backgroundColor: theme.surfaceLow, paddingHorizontal: 10, height: 38, borderRadius: 10, justifyContent: 'center', borderWidth: 1.5, borderColor: theme.outlineVariant + '44' }}>
                  <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_500Medium', color: theme.text }}>
                    🇮🇳 +91
                  </ThemedText>
                </View>
                <TextInput
                  value={mobile}
                  onChangeText={(val) => {
                    setMobile(val.replace(/[^0-9]/g, ''));
                    if (otpStatus === 'verified') {
                      setOtpStatus('idle');
                    }
                  }}
                  placeholder="10-digit mobile number"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                  maxLength={10}
                  style={{
                    flex: 1,
                    backgroundColor: theme.surfaceLowest || '#ffffff',
                    borderWidth: 1.5,
                    borderColor: theme.outlineVariant + '44',
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    height: 38,
                    fontSize: 13,
                    fontFamily: 'Sora_500Medium',
                    color: theme.text,
                  }}
                />
              </View>
            </View>

            {/* Positive & Friendly 5 Free Coins Reward Card */}
            <View style={{ backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', padding: 11, marginTop: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <ThemedText style={{ fontSize: 11.5, fontFamily: 'Sora_500Medium', color: '#0f172a' }}>
                  Sync Phone for 5 Free Turf Coins
                </ThemedText>
                <View style={{ backgroundColor: '#f1f5f9', paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 4, borderWidth: 1, borderColor: '#e2e8f0' }}>
                  <ThemedText style={{ color: '#0f172a', fontSize: 9, fontFamily: 'Sora_500Medium' }}>
                    +5 COINS
                  </ThemedText>
                </View>
              </View>
              <ThemedText style={{ fontSize: 9.5, color: '#64748b', marginTop: 2, lineHeight: 14 }}>
                Add your phone number to sync match records and claim 5 wallet coins.
              </ThemedText>

              {/* OTP Actions */}
              {otpStatus === 'verified' ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, backgroundColor: '#ffffff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#cbd5e1' }}>
                  <Ionicons name="checkmark-circle" size={14} color="#10b981" />
                  <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_500Medium', color: '#0f172a' }}>
                    Verified · 5 Coins Credited to Wallet
                  </ThemedText>
                </View>
              ) : otpStatus === 'sent' ? (
                <View style={{ marginTop: 6, backgroundColor: '#ffffff', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#e2e8f0' }}>
                  <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_500Medium', color: '#0f172a', marginBottom: 4 }}>
                    Enter 4-Digit Code (Demo OTP: 1234)
                  </ThemedText>
                  <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                    <TextInput
                      value={otpCode}
                      onChangeText={(val) => setOtpCode(val.replace(/[^0-9]/g, ''))}
                      placeholder="1234"
                      keyboardType="number-pad"
                      maxLength={4}
                      style={{
                        flex: 1,
                        backgroundColor: '#f8fafc',
                        borderWidth: 1,
                        borderColor: '#cbd5e1',
                        borderRadius: 6,
                        height: 30,
                        paddingHorizontal: 8,
                        fontSize: 12,
                        fontFamily: 'Sora_500Medium',
                        textAlign: 'center',
                        letterSpacing: 4,
                      }}
                    />
                    <Pressable
                      onPress={handleVerifyOtp}
                      style={{
                        backgroundColor: theme.primary,
                        paddingHorizontal: 12,
                        height: 30,
                        borderRadius: 6,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <ThemedText style={{ color: '#ffffff', fontSize: 11, fontFamily: 'Sora_500Medium' }}>
                        Verify OTP
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable
                  onPress={handleSendOtp}
                  disabled={mobile.length !== 10}
                  style={{
                    backgroundColor: mobile.length === 10 ? theme.primary : theme.primary + '40',
                    borderRadius: 8,
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                    alignItems: 'center',
                    marginTop: 6,
                  }}
                >
                  <ThemedText style={{ color: '#ffffff', fontSize: 10.5, fontFamily: 'Sora_500Medium' }}>
                    Verify & Claim 5 Free Coins
                  </ThemedText>
                </Pressable>
              )}
            </View>

            {/* Playing Role Selection */}
            <View style={{ marginTop: 10 }}>
              <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: theme.text, marginBottom: 5 }}>
                Playing Role
              </ThemedText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {['Batsman', 'Bowler', 'All-Rounder', 'Wicket Keeper'].map((r) => {
                  const isSelected = role === r;
                  return (
                    <Pressable
                      key={r}
                      onPress={() => setRole(r)}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 8,
                        backgroundColor: isSelected ? theme.primary : '#f1f5f9',
                        borderWidth: 1,
                        borderColor: isSelected ? theme.primary : '#e2e8f0',
                      }}
                    >
                      <ThemedText
                        style={{
                          fontSize: 10.5,
                          fontFamily: isSelected ? 'Sora_600SemiBold' : 'Sora_600SemiBold',
                          color: isSelected ? '#ffffff' : '#475569',
                        }}
                      >
                        {r}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Batting Style / Details */}
            <View style={{ marginTop: 8 }}>
              <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: theme.text, marginBottom: 5 }}>
                Batting Style
              </ThemedText>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {['Right-hand Bat', 'Left-hand Bat'].map((d) => {
                  const isSelected = details === d;
                  return (
                    <Pressable
                      key={d}
                      onPress={() => setDetails(d)}
                      style={{
                        flex: 1,
                        paddingVertical: 6,
                        borderRadius: 8,
                        alignItems: 'center',
                        backgroundColor: isSelected ? theme.primary + '14' : '#f1f5f9',
                        borderWidth: 1,
                        borderColor: isSelected ? theme.primary : '#e2e8f0',
                      }}
                    >
                      <ThemedText
                        style={{
                          fontSize: 10.5,
                          fontFamily: isSelected ? 'Sora_600SemiBold' : 'Sora_600SemiBold',
                          color: isSelected ? theme.primary : '#475569',
                        }}
                      >
                        {d}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Bottom Modal Actions */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <Pressable
                onPress={onClose}
                style={{
                  flex: 1,
                  backgroundColor: '#f1f5f9',
                  borderRadius: 10,
                  paddingVertical: 9,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#e2e8f0',
                }}
              >
                <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_500Medium', color: '#64748b' }}>
                  Cancel
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={handleSavePlayer}
                disabled={isSaveDisabled}
                style={{
                  flex: 2,
                  backgroundColor: isSaveDisabled ? '#e2e8f0' : theme.primary,
                  borderRadius: 10,
                  paddingVertical: 9,
                  alignItems: 'center',
                }}
              >
                <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_500Medium', color: isSaveDisabled ? '#94a3b8' : '#ffffff' }}>
                  Save & Add Player
                </ThemedText>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function PlayerDropdownSelector({
  value,
  onSelectPlayer,
  onCustomNameChange,
  squadList,
  otherSelectedName,
  dismissedNames,
  retiredHurtNames,
  opposingTeamNames,
  maxBowlerOvers,
  placeholder,
  theme,
  isOpen,
  setIsOpen,
  onAddPlayerToSquad,
}: {
  value: string;
  onSelectPlayer: (name: string, avatar?: string, existingStats?: { runs: number; balls: number; fours: number; sixes: number }) => void;
  onCustomNameChange: (name: string) => void;
  squadList: Array<{ name: string; avatar?: string; mobile?: string; role?: string; details?: string; position?: string; phone?: string; isCaptain?: boolean; overs?: number; runs?: number; balls?: number; fours?: number; sixes?: number; [key: string]: any }>;
  otherSelectedName?: string;
  dismissedNames?: string[];
  retiredHurtNames?: string[];
  opposingTeamNames?: string[];
  maxBowlerOvers?: number;
  placeholder: string;
  theme: any;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onAddPlayerToSquad?: (player: { name: string; avatar?: string; mobile?: string; role?: string }) => void;
}) {
  const [showNewPlayerModal, setShowNewPlayerModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalSearchSeed, setModalSearchSeed] = useState('');

  // Filter squad list by name or mobile number, with available players at top and disabled/out players at bottom
  const filteredSquad = React.useMemo(() => {
    let list = [...squadList];
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((p) => {
        const nameMatch = Boolean(p.name && p.name.toLowerCase().includes(q));
        const mobileMatch = Boolean(p.mobile && String(p.mobile).includes(q));
        return nameMatch || mobileMatch;
      });
    }

    const getPlayerRank = (p: any) => {
      const pName = (p.name || '').trim().toLowerCase();
      const isSelectedInOtherSlot = Boolean(
        otherSelectedName &&
        otherSelectedName.trim().length > 0 &&
        pName === otherSelectedName.trim().toLowerCase()
      );
      const isRetiredHurt = Boolean(
        retiredHurtNames &&
        retiredHurtNames.some(rhName => rhName && rhName.trim().toLowerCase() === pName)
      );
      const isDismissedOut = Boolean(
        !isRetiredHurt &&
        dismissedNames &&
        dismissedNames.some(dName => dName && dName.trim().toLowerCase() === pName)
      );
      const isInOpposingTeam = Boolean(
        opposingTeamNames &&
        opposingTeamNames.some(oppName => oppName && oppName.trim().toLowerCase() === pName)
      );
      const isBowlerQuotaFull = Boolean(
        maxBowlerOvers !== undefined &&
        maxBowlerOvers !== Infinity &&
        (p.overs || 0) >= maxBowlerOvers
      );

      // Rank 0: Available & eligible squad / AI suggested player / Returning Retired Hurt -> TOP
      if (!isSelectedInOtherSlot && !isDismissedOut && !isInOpposingTeam && !isBowlerQuotaFull) return 0;
      // Rank 1: Selected in other slot -> BOTTOM
      if (isSelectedInOtherSlot) return 1;
      // Rank 2: Permanently out batsman -> BOTTOM
      if (isDismissedOut) return 2;
      // Rank 3: Bowler Quota full -> BOTTOM
      if (isBowlerQuotaFull) return 3;
      // Rank 4: In opposing team -> BOTTOM
      return 4;
    };

    return list.sort((a, b) => {
      const rankA = getPlayerRank(a);
      const rankB = getPlayerRank(b);
      if (rankA !== rankB) return rankA - rankB;
      return (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
    });
  }, [squadList, searchQuery, otherSelectedName, dismissedNames, retiredHurtNames, opposingTeamNames, maxBowlerOvers]);

  return (
    <View style={{ flex: 1, position: 'relative', zIndex: isOpen ? 99999 : 1 }}>
      <Pressable
        onPress={() => {
          setIsOpen(!isOpen);
          setSearchQuery('');
        }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: theme.surfaceLowest,
          borderWidth: 1.5,
          borderColor: isOpen ? theme.primary : (theme.outlineVariant + '55'),
          borderRadius: 12,
          paddingHorizontal: 12,
          height: 40,
        }}
      >
        <ThemedText
          style={{
            fontSize: 13.5,
            fontFamily: 'Sora_500Medium',
            color: value ? theme.text : theme.textSecondary,
          }}
          numberOfLines={1}
        >
          {value || placeholder}
        </ThemedText>
        <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={18} color={theme.primary} />
      </Pressable>

      {isOpen && (
        <View
          style={{
            position: 'absolute',
            top: 46,
            left: 0,
            right: 0,
            backgroundColor: theme.surfaceLowest,
            borderRadius: 14,
            borderWidth: 1.5,
            borderColor: theme.primary,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.25,
            shadowRadius: 12,
            elevation: 25,
            maxHeight: 250,
            zIndex: 99999,
            overflow: 'hidden',
          }}
        >
          {/* Live Search Bar for Name or 10-Digit Mobile */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 10,
              paddingVertical: 8,
              borderBottomWidth: 1,
              borderBottomColor: theme.outlineVariant + '22',
              backgroundColor: theme.surfaceLow,
            }}
          >
            <Ionicons name="search" size={14} color={theme.textSecondary} style={{ marginRight: 6 }} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by name or phone..."
              placeholderTextColor="#94a3b8"
              style={{
                flex: 1,
                height: 28,
                fontSize: 12.5,
                fontFamily: 'Sora_500Medium',
                color: theme.text,
                padding: 0,
              }}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
                <Ionicons name="close-circle" size={14} color="#94a3b8" />
              </Pressable>
            )}
          </View>

          <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={{ backgroundColor: '#ffffff' }}>
            {/* Option 1: + Add New Player (Pre-filled with search query) */}
            <Pressable
              onPress={() => {
                setModalSearchSeed(searchQuery);
                setIsOpen(false);
                setShowNewPlayerModal(true);
              }}
              style={({ pressed }) => [{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 9,
                paddingHorizontal: 12,
                borderBottomWidth: 1,
                borderBottomColor: '#f1f5f9',
                backgroundColor: pressed ? theme.primary + '18' : theme.primary + '0c',
              }]}
            >
              <Ionicons name="add-circle" size={16} color={theme.primary} style={{ marginRight: 8 }} />
              <ThemedText style={{ fontSize: 11.5, fontFamily: 'Sora_500Medium', color: theme.primary }} numberOfLines={1}>
                {searchQuery.trim() ? `+ Add "${searchQuery.trim()}" as New Player` : '+ Add New Player'}
              </ThemedText>
            </Pressable>

            {/* Squad List filtered by Name / Mobile & Sorted by Availability Priority */}
            {filteredSquad.map((p, idx) => {
              const isSelectedInOtherSlot = Boolean(
                otherSelectedName &&
                otherSelectedName.trim().length > 0 &&
                p.name.trim().toLowerCase() === otherSelectedName.trim().toLowerCase()
              );
              const isRetiredHurt = Boolean(
                (p.isRetiredHurt || (retiredHurtNames && retiredHurtNames.some(rhName => rhName && rhName.trim().toLowerCase() === p.name.trim().toLowerCase())))
              );
              const isDismissedOut = Boolean(
                !isRetiredHurt &&
                dismissedNames &&
                dismissedNames.some(dName => dName && dName.trim().toLowerCase() === p.name.trim().toLowerCase())
              );
              const isInOpposingTeam = Boolean(
                opposingTeamNames &&
                opposingTeamNames.some(oppName => oppName && oppName.trim().toLowerCase() === p.name.trim().toLowerCase())
              );
              const isBowlerQuotaFull = Boolean(
                maxBowlerOvers !== undefined &&
                maxBowlerOvers !== Infinity &&
                (p.overs || 0) >= maxBowlerOvers
              );
              const isDisabled = isSelectedInOtherSlot || isDismissedOut || isInOpposingTeam || isBowlerQuotaFull;
              const initials = getTwoLetterLogo(p.name);
              const isCustom = p.avatar && (p.avatar.startsWith('file://') || p.avatar.startsWith('http') || p.avatar.startsWith('data:'));
              const isMonog = p.avatar === 'monogram';
              const playerMobile = p.mobile || (p.phone ? p.phone : `987${((Math.abs(p.name.split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0)) * 97) % 9000000 + 1000000)}`);
              const isCaptain = Boolean(p.isCaptain || p.position?.includes('(C)') || p.role?.toLowerCase() === 'captain' || p.position?.toLowerCase().includes('captain'));
              const isResumingBatsman = Boolean(
                isRetiredHurt ||
                p.isReturningPlayer ||
                ((p.runs !== undefined && p.runs > 0) || (p.balls !== undefined && p.balls > 0))
              );

              return (
                <Pressable
                  key={`squad-item-${p.name}-${idx}`}
                  disabled={isDisabled}
                  onPress={() => {
                    if (isDisabled) return;
                    onSelectPlayer(
                      p.name,
                      p.avatar,
                      (p.runs !== undefined || p.balls !== undefined)
                        ? { runs: p.runs || 0, balls: p.balls || 0, fours: p.fours || 0, sixes: p.sixes || 0 }
                        : undefined
                    );
                    setIsOpen(false);
                    setSearchQuery('');
                  }}
                  style={({ pressed }) => [{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderBottomWidth: idx === filteredSquad.length - 1 ? 0 : 1,
                    borderBottomColor: '#f1f5f9',
                    backgroundColor: isDisabled ? '#f8fafc' : isResumingBatsman ? '#f0f9ff' : pressed ? '#f1f5f9' : '#ffffff',
                    opacity: isDisabled ? 0.45 : 1,
                  }]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 8 }}>
                    {isCustom ? (
                      <Image source={{ uri: p.avatar }} style={{ width: 30, height: 30, borderRadius: 15, marginRight: 10, borderWidth: 1, borderColor: '#e2e8f0' }} contentFit="cover" />
                    ) : isMonog ? (
                      <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginRight: 10, borderWidth: 1, borderColor: '#e2e8f0' }}>
                        <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_500Medium', color: '#334155' }}>
                          {initials}
                        </ThemedText>
                      </View>
                    ) : p.avatar ? (
                      <Image source={getAvatarSource(p.avatar)} style={{ width: 30, height: 30, borderRadius: 15, marginRight: 10, borderWidth: 1, borderColor: '#e2e8f0' }} contentFit="cover" />
                    ) : (
                      <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginRight: 10, borderWidth: 1, borderColor: '#e2e8f0' }}>
                        <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_500Medium', color: '#334155' }}>
                          {initials}
                        </ThemedText>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      {/* Profile Name & Captain Badge */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_500Medium', color: isDisabled ? '#94a3b8' : '#0f172a' }} numberOfLines={1}>
                          {p.name}
                        </ThemedText>
                        {isCaptain && (
                          <View style={{ backgroundColor: theme.primary + '18', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3 }}>
                            <ThemedText style={{ fontSize: 8.5, fontFamily: 'Sora_500Medium', color: theme.primary }}>
                              (C)
                            </ThemedText>
                          </View>
                        )}
                      </View>

                      {/* Clean Subtitle: Formatted Mobile Number or Resume Stats */}
                      <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_400Regular', color: isResumingBatsman ? '#0284c7' : isDisabled ? '#94a3b8' : '#64748b', marginTop: 1 }} numberOfLines={1}>
                        {isResumingBatsman ? `Resume: ${p.runs || 0} runs (${p.balls || 0} balls)` : formatMobileNumber(playerMobile)}
                      </ThemedText>
                    </View>
                  </View>
                  {isSelectedInOtherSlot && (
                    <View style={{ backgroundColor: '#fef3c7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                      <ThemedText style={{ fontSize: 8.5, color: '#92400e', fontFamily: 'Sora_500Medium' }}>Selected</ThemedText>
                    </View>
                  )}
                  {isResumingBatsman && !isSelectedInOtherSlot && (
                    <View style={{ backgroundColor: '#e0f2fe', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                      <ThemedText style={{ fontSize: 8.5, color: '#0369a1', fontFamily: 'Sora_500Medium' }}>
                        Resume ({p.runs || 0}r, {p.balls || 0}b)
                      </ThemedText>
                    </View>
                  )}
                  {isDismissedOut && (
                    <View style={{ backgroundColor: '#fee2e2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                      <ThemedText style={{ fontSize: 8.5, color: '#b91c1c', fontFamily: 'Sora_500Medium' }}>Already Out</ThemedText>
                    </View>
                  )}
                  {isBowlerQuotaFull && (
                    <View style={{ backgroundColor: '#fef3c7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                      <ThemedText style={{ fontSize: 8.5, color: '#b45309', fontFamily: 'Sora_500Medium' }}>Quota Full ({p.overs || 0}/{maxBowlerOvers} Ov)</ThemedText>
                    </View>
                  )}
                  {isInOpposingTeam && (
                    <View style={{ backgroundColor: '#f1f5f9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                      <ThemedText style={{ fontSize: 8.5, color: '#64748b', fontFamily: 'Sora_500Medium' }}>In Opp. Team</ThemedText>
                    </View>
                  )}
                </Pressable>
              );
            })}

            {filteredSquad.length === 0 && searchQuery.trim().length > 0 && (
              <View style={{ padding: 14, alignItems: 'center', backgroundColor: '#ffffff' }}>
                <ThemedText style={{ fontSize: 11, color: '#64748b', textAlign: 'center' }}>
                  No player found matching "{searchQuery}".
                </ThemedText>
                <Pressable
                  onPress={() => {
                    setModalSearchSeed(searchQuery);
                    setIsOpen(false);
                    setShowNewPlayerModal(true);
                  }}
                  style={{
                    backgroundColor: theme.primary,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                    marginTop: 8,
                  }}
                >
                  <ThemedText style={{ color: '#ffffff', fontSize: 11, fontFamily: 'Sora_500Medium' }}>
                    + Add New Player Now
                  </ThemedText>
                </Pressable>
              </View>
            )}

            {filteredSquad.length === 0 && !searchQuery.trim() && (
              <View style={{ padding: 12, alignItems: 'center', backgroundColor: '#ffffff' }}>
                <ThemedText style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>
                  No extra squad players available.
                </ThemedText>
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {/* New Player Modal with OTP and Coin Rewards */}
      <NewPlayerModal
        visible={showNewPlayerModal}
        onClose={() => {
          setShowNewPlayerModal(false);
          setModalSearchSeed('');
        }}
        theme={theme}
        initialSearchQuery={modalSearchSeed}
        onSave={(newPlayer) => {
          onSelectPlayer(newPlayer.name, newPlayer.avatar);
          onAddPlayerToSquad?.(newPlayer);
        }}
      />
    </View>
  );
}

const playVictoryAudienceSound = async () => {
  try {
    if (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();

      // Sound 1: Stadium Fanfare Chimes (C5 - E5 - G5 - C6)
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
        gain.gain.setValueAtTime(0.3, ctx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 0.6);
      });

      // Sound 2: Stadium Audience Clapping & Cheering Noise
      const bufferSize = ctx.sampleRate * 2.5;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1200;
      filter.Q.value = 1.2;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(ctx.currentTime);
    }
  } catch (err) {
    console.log('Victory audio sound effect:', err);
  }
};

export default function CricketScoring({
  matchId,
  teamA = 'London Lions',
  teamB = 'Kent Kings',
  tossWinner,
  decision,
  totalOvers = '5',
  autoWide = '1',
  autoNoBall = '1',
  allowByes = '1',
  lineup,
  pool,
}: {
  matchId?: string;
  teamA?: string;
  teamB?: string;
  tossWinner?: string;
  decision?: string;
  totalOvers?: string;
  autoWide?: string;
  autoNoBall?: string;
  allowByes?: string;
  /** JSON map of lowercased team name -> the Playing XI chosen pre-match. */
  lineup?: string;
  /** JSON array of unassigned / pool players chosen pre-match. */
  pool?: string;
}) {
  const theme = useTheme();
  const router = useRouter();

  const getInitialTossState = React.useCallback(() => {
    const rawWinner = (tossWinner || '').trim();
    const rawDecision = (decision || '').trim().toLowerCase();
    const isBowl = rawDecision.includes('bowl');

    const winnerName = rawWinner || teamA;
    const isWinnerA = rawWinner
      ? rawWinner.toLowerCase() === (teamA || '').toLowerCase()
      : true;

    let batTeam = teamA;
    let bowlTeam = teamB;
    let decisionWord = 'bat';

    if (isWinnerA) {
      if (isBowl) {
        batTeam = teamB;
        bowlTeam = teamA;
        decisionWord = 'bowl';
      } else {
        batTeam = teamA;
        bowlTeam = teamB;
        decisionWord = 'bat';
      }
    } else {
      if (isBowl) {
        batTeam = teamA;
        bowlTeam = teamB;
        decisionWord = 'bowl';
      } else {
        batTeam = teamB;
        bowlTeam = teamA;
        decisionWord = 'bat';
      }
    }

    const summary = `${winnerName} won toss & select ${decisionWord}`;
    return {
      batTeam,
      bowlTeam,
      summary,
      winnerName,
      decisionType: (isBowl ? 'Bowl' : 'Bat') as 'Bat' | 'Bowl',
    };
  }, [teamA, teamB, tossWinner, decision]);

  const initialToss = React.useMemo(() => getInitialTossState(), [getInitialTossState]);

  /**
   * Unassigned / draft pool passed from pre-match selection.
   */
  const initialUnassignedPool = React.useMemo<Player[]>(() => {
    if (!pool) return [];
    try {
      const parsed = JSON.parse(pool);
      return Array.isArray(parsed) ? strictDedupe(parsed) : [];
    } catch {
      return [];
    }
  }, [pool]);

  /**
   * The Playing XI picked before the toss, keyed by lowercased team name.
   * Parsed once; a malformed param degrades to "no lineup" rather than
   * crashing the console mid-match.
   */
  const selectedLineups = React.useMemo<Record<string, any[]>>(() => {
    if (!lineup) return {};
    try {
      const parsed = JSON.parse(lineup);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }, [lineup]);

  /** The squad to use for a side: its chosen XI if there is one, else its roster. */
  const squadFor = React.useCallback(
    (teamName: string, rosterPlayers?: any[]): any[] | null => {
      const xi = selectedLineups[(teamName || '').toLowerCase()];
      if (Array.isArray(xi) && xi.length > 0) return [...xi];
      if (rosterPlayers && rosterPlayers.length > 0) return [...rosterPlayers];
      return null;
    },
    [selectedLineups]
  );

  const [showScoringModal, setShowScoringModal] = useState(false);
  const [showScoringPad, setShowScoringPad] = useState(true);
  const [showBatsmenModal, setShowBatsmenModal] = useState(false);
  const [showBowlersModal, setShowBowlersModal] = useState(false);
  const [showEditPlayersModal, setShowEditPlayersModal] = useState(false);
  const [showEndMatchModal, setShowEndMatchModal] = useState(false);
  const [coinTossVisible, setCoinTossVisible] = useState(false);
  const [activeDropdownKey, setActiveDropdownKey] = useState<string | null>(null);
  const modalScrollRef = React.useRef<ScrollView>(null);

  React.useEffect(() => {
    if (activeDropdownKey && showEditPlayersModal) {
      setTimeout(() => {
        if (activeDropdownKey === 'bowler') {
          modalScrollRef.current?.scrollToEnd({ animated: true });
        } else if (activeDropdownKey === 'b2') {
          modalScrollRef.current?.scrollTo({ y: 260, animated: true });
        } else if (activeDropdownKey === 'b1') {
          modalScrollRef.current?.scrollTo({ y: 80, animated: true });
        }
      }, 100);
    }
  }, [activeDropdownKey, showEditPlayersModal]);

  React.useEffect(() => {
    if (totalOvers) {
      setCurrentTotalOvers(totalOvers);
      setEditTotalOversInput(totalOvers);
    }
  }, [totalOvers]);
  const [showOverCompleteModal, setShowOverCompleteModal] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [matchVictoryData, setMatchVictoryData] = useState<any>(null);
  const [showInnings1SuccessModal, setShowInnings1SuccessModal] = useState(false);
  const [innings1SuccessData, setInnings1SuccessData] = useState<{
    battingTeam: string;
    bowlingTeam: string;
    newBatting: string;
    newBowling: string;
    score: string;
    overs: string;
    runRate: string;
    target: number;
    maxOvers: number;
    reqRunRate: string;
    topBatsman?: { name: string; runs: number; balls: number; fours?: number; sixes?: number };
    topBowler?: { name: string; wickets: number; runs: number; overs?: number };
  } | null>(null);
  const [showRematchSquadChoiceModal, setShowRematchSquadChoiceModal] = useState(false);
  const [isRematchDrafting, setIsRematchDrafting] = useState(false);

  // Manage Players Modal Search & Add State
  const [manageSelectedTeamTab, setManageSelectedTeamTab] = useState<'bat' | 'bowl'>('bat');
  const [managePlayerSearchQuery, setManagePlayerSearchQuery] = useState('');
  const [showManageNewPlayerModal, setShowManageNewPlayerModal] = useState(false);
  const [managePlayerSearchSeed, setManagePlayerSearchSeed] = useState('');

  // 🪙 Rematch 3D Coin Flip Toss States
  const [showRematchTossModal, setShowRematchTossModal] = useState(false);
  const [rematchTossWinner, setRematchTossWinner] = useState<string>(initialToss.winnerName);
  const [rematchTossDecision, setRematchTossDecision] = useState<'Bat' | 'Bowl'>(initialToss.decisionType);
  const [isFlippingCoin, setIsFlippingCoin] = useState(false);
  const [coinSide, setCoinSide] = useState<'HEADS' | 'TAILS' | null>(null);

  const coinRotateAnim = React.useRef(new Animated.Value(0)).current;

  const playCoinFlipSound = async () => {
    try {
      if (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();

        // Metallic Coin Spin Sweep Sound (1200Hz -> 2400Hz -> 1800Hz)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + 0.3);
        osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.8);

        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.9);

        // Metallic Landing Ping Ring (2800Hz)
        setTimeout(() => {
          try {
            const pingOsc = ctx.createOscillator();
            const pingGain = ctx.createGain();
            pingOsc.type = 'triangle';
            pingOsc.frequency.setValueAtTime(2800, ctx.currentTime);
            pingGain.gain.setValueAtTime(0.5, ctx.currentTime);
            pingGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
            pingOsc.connect(pingGain);
            pingGain.connect(ctx.destination);
            pingOsc.start();
            pingOsc.stop(ctx.currentTime + 0.4);
          } catch (e) { }
        }, 950);
      }
    } catch (err) {
      console.log('Coin flip sound:', err);
    }
  };

  const flipCoinForToss = () => {
    if (isFlippingCoin) return;
    setIsFlippingCoin(true);
    setCoinSide(null);

    // Trigger metallic coin spin audio sound effect
    playCoinFlipSound();

    coinRotateAnim.setValue(0);
    Animated.timing(coinRotateAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start(() => {
      setIsFlippingCoin(false);
      const isHeads = Math.random() > 0.5;
      setCoinSide(isHeads ? 'HEADS' : 'TAILS');
      const randomWinner = Math.random() > 0.5 ? teamA : teamB;
      setRematchTossWinner(randomWinner);
    });
  };
  const trophyAnimScale = React.useRef(new Animated.Value(0.2)).current;
  const confettiBounceAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (showVictoryModal) {
      // Trigger audience cheering and clapping fanfare audio sound effect
      playVictoryAudienceSound();

      trophyAnimScale.setValue(0.2);
      Animated.spring(trophyAnimScale, {
        toValue: 1,
        friction: 3.5,
        tension: 140,
        useNativeDriver: true,
      }).start();

      // Continuous bounce loop for particle confetti
      Animated.loop(
        Animated.sequence([
          Animated.timing(confettiBounceAnim, {
            toValue: -8,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(confettiBounceAnim, {
            toValue: 4,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [showVictoryModal]);
  const [activeSubTab, setActiveSubTab] = useState<'live' | 'scorecard' | 'stats'>('live');
  const [scorecardTab, setScorecardTab] = useState<'batsmen' | 'bowlers'>('batsmen');

  // Scoreboard State
  const [boundaryAnim, setBoundaryAnim] = useState<{ type: 4 | 6; batsmanName: string } | null>(null);
  const [runs, setRuns] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [overs, setOvers] = useState(0);
  const [ballsInCurrentOver, setBallsInCurrentOver] = useState(0); // 0.0 overs initially
  const [overLog, setOverLog] = useState<string[]>([]);
  const [inningsDeliveries, setInningsDeliveries] = useState<string[]>([]);
  const [firstInningsDeliveries, setFirstInningsDeliveries] = useState<string[]>([]);
  // `handleOverCompletion` runs from a setTimeout inside incrementBallCount, so its
  // closure still holds the pre-6th-ball overLog. Mirroring it into a ref (updated
  // after commit, well before the 100ms timer) gives that path the real final over.
  const overLogRef = useRef<string[]>([]);
  useEffect(() => { overLogRef.current = overLog; }, [overLog]);
  const [history, setHistory] = useState<any[]>([]); // for undo support (capped at 20)
  // Fix #9: Guard flag to block recording after innings ends
  const [isInningsOver, setIsInningsOver] = useState(false);
  // Fix #6: Free-hit flag — next delivery ball is not counted against batsman
  const [lastWasNoBall, setLastWasNoBall] = useState(false);
  // Fix #7: Store second-innings score for real PDF export
  const [innings2ScoreRecord, setInnings2ScoreRecord] = useState<{ runs: number; wickets: number; overs: number; balls: number } | null>(null);

  // Innings & Target Chase State
  const [currentInnings, setCurrentInnings] = useState<1 | 2>(1);
  const [lastOverBowlerName, setLastOverBowlerName] = useState<string>('');
  const [firstInningsScore, setFirstInningsScore] = useState<{ runs: number; wickets: number; overs: number; balls: number } | null>(null);
  const [firstInningsScorecard, setFirstInningsScorecard] = useState<{
    battingTeam: string;
    bowlingTeam: string;
    totalRuns: number;
    totalWickets: number;
    totalOvers: string;
    batsmen: any[];
    bowlers: any[];
    extras?: {
      wides?: number;
      noBalls?: number;
      byes?: number;
      legByes?: number;
      total?: number;
    };
  } | null>(null);
  const [secondInningsScorecard, setSecondInningsScorecard] = useState<{
    battingTeam: string;
    bowlingTeam: string;
    totalRuns: number;
    totalWickets: number;
    totalOvers: string;
    batsmen: any[];
    bowlers: any[];
    extras?: {
      wides?: number;
      noBalls?: number;
      byes?: number;
      legByes?: number;
      total?: number;
    };
  } | null>(null);
  const [viewingScorecardInnings, setViewingScorecardInnings] = useState<1 | 2>(1);
  const [firstInningsPartnership, setFirstInningsPartnership] = useState<{
    bat1: { name: string; runs: number; balls: number };
    bat2: { name: string; runs: number; balls: number };
    runs: number;
    balls: number;
  } | null>(null);
  const [battingTeamName, setBattingTeamName] = useState<string>(initialToss.batTeam);
  const [bowlingTeamName, setBowlingTeamName] = useState<string>(initialToss.bowlTeam);

  const [showPlayingXIModal, setShowPlayingXIModal] = useState(false);
  const [showExtraModal, setShowExtraModal] = useState(false);
  const [activeExtraType, setActiveExtraType] = useState<'WD' | 'NB' | 'BYE' | 'LB' | null>(null);
  const [extraRunsInput, setExtraRunsInput] = useState<number>(0);
  const [extraCustomText, setExtraCustomText] = useState<string>('');
  const [isExtraCustomMode, setIsExtraCustomMode] = useState<boolean>(false);

  // Wicket detail sheet — records dismissal type (bowled, caught, lbw, stumped, run out, etc.),
  // fielder attribution, runs completed, and dismissed batsman.
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [wicketDismissalType, setWicketDismissalType] = useState<
    'bowled' | 'caught' | 'caught_and_bowled' | 'lbw' | 'stumped' | 'run_out' | 'hit_wicket' | 'retired'
  >('bowled');
  const [wicketFielderName, setWicketFielderName] = useState<string>('');
  const [customFielderInput, setCustomFielderInput] = useState<string>('');
  const [wicketRuns, setWicketRuns] = useState(0);
  const [wicketCustomRunsText, setWicketCustomRunsText] = useState<string>('');
  const [isWicketCustomRunsMode, setIsWicketCustomRunsMode] = useState<boolean>(false);
  const [wicketWhoIsOut, setWicketWhoIsOut] = useState<'striker' | 'non-striker'>('striker');

  // Full Squad Roster Modal States
  const [showFullSquadModal, setShowFullSquadModal] = useState(false);
  const [squadTab, setSquadTab] = useState<'A' | 'B'>('A');
  const [newSquadPlayerName, setNewSquadPlayerName] = useState('');
  const [newSquadPlayerMobile, setNewSquadPlayerMobile] = useState('');
  const [newSquadPlayerImage, setNewSquadPlayerImage] = useState<string | null>(null);
  const [newSquadPlayerRole, setNewSquadPlayerRole] = useState('Batsman');

  const pickSquadPlayerImage = () => {
    Alert.alert(
      'Upload Player Photo',
      'Choose an option to upload or capture player picture:',
      [
        {
          text: '📷 Take Photo (Camera)',
          onPress: async () => {
            try {
              const permission = await ImagePicker.requestCameraPermissionsAsync();
              if (!permission.granted) {
                Alert.alert('Permission Required', 'Camera access is needed to capture photo.');
                return;
              }
              const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });
              if (!result.canceled && result.assets && result.assets.length > 0) {
                setNewSquadPlayerImage(result.assets[0].uri);
              }
            } catch (err) {
              console.log('Error capturing photo', err);
            }
          },
        },
        {
          text: '🖼️ Choose from Gallery',
          onPress: async () => {
            try {
              const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (!permission.granted) {
                Alert.alert('Permission Required', 'Gallery access is needed to pick photo.');
                return;
              }
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });
              if (!result.canceled && result.assets && result.assets.length > 0) {
                setNewSquadPlayerImage(result.assets[0].uri);
              }
            } catch (err) {
              console.log('Error picking gallery image', err);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // Player Stats State (Empty by default for a clean start when starting a new match!)
  const [batsmen, setBatsmen] = useState<Batsman[]>([]);

  // Live Innings Master Archive: Keeps track of each batsman's cumulative runs/balls/4s/6s this innings
  const [inningsBatsmenArchive, setInningsBatsmenArchive] = useState<
    Record<string, { name: string; runs: number; balls: number; fours: number; sixes: number; avatar?: string }>
  >({});

  // Synchronize live batsmen stats to innings archive in real time
  React.useEffect(() => {
    if (batsmen && batsmen.length > 0) {
      setInningsBatsmenArchive(prev => {
        const next = { ...prev };
        batsmen.forEach(b => {
          if (b && b.name && b.name.trim() && b.name.trim() !== 'Batsman 1' && b.name.trim() !== 'Batsman 2') {
            const key = b.name.trim().toLowerCase();
            next[key] = {
              name: b.name.trim(),
              runs: b.runs || 0,
              balls: b.balls || 0,
              fours: b.fours || 0,
              sixes: b.sixes || 0,
              avatar: b.avatar || next[key]?.avatar,
            };
          }
        });
        return next;
      });
    }
  }, [batsmen]);

  const [bowler, setBowler] = useState<Bowler>(
    { name: '', overs: 0, ballsInOver: 0, maidens: 0, runs: 0, wickets: 0 }
  );

  // Squad Lists State
  const [dismissedBatsmen, setDismissedBatsmen] = useState<any[]>([]);
  const [yetToBatBatsmen, setYetToBatBatsmen] = useState<any[]>([]);
  const [otherBowlers, setOtherBowlers] = useState<any[]>([]);

  // Master persistent squad lists for Team A and Team B across both innings
  const [teamASquad, setTeamASquad] = useState<Player[]>([]);
  const [teamBSquad, setTeamBSquad] = useState<Player[]>([]);

  // Live Innings Bowler Master Archive: Keeps track of each bowler's cumulative overs/balls/maidens/runs/wickets this innings
  const [inningsBowlersArchive, setInningsBowlersArchive] = useState<
    Record<string, { name: string; overs: number; ballsInOver: number; maidens: number; runs: number; wickets: number; avatar?: string }>
  >({});

  // Synchronize live bowler stats to innings archive in real time
  React.useEffect(() => {
    if (bowler && bowler.name && bowler.name.trim()) {
      const key = bowler.name.trim().toLowerCase();
      setInningsBowlersArchive(prev => {
        const existing = prev[key];
        const newOvers = bowler.overs !== undefined ? Math.max(bowler.overs, existing?.overs ?? 0) : (existing?.overs ?? 0);
        const newBalls = bowler.ballsInOver !== undefined ? bowler.ballsInOver : (existing?.ballsInOver ?? 0);
        const newMaidens = bowler.maidens !== undefined ? Math.max(bowler.maidens, existing?.maidens ?? 0) : (existing?.maidens ?? 0);
        const newRuns = bowler.runs !== undefined ? Math.max(bowler.runs, existing?.runs ?? 0) : (existing?.runs ?? 0);
        const newWickets = bowler.wickets !== undefined ? Math.max(bowler.wickets, existing?.wickets ?? 0) : (existing?.wickets ?? 0);
        return {
          ...prev,
          [key]: {
            name: bowler.name.trim(),
            overs: newOvers,
            ballsInOver: newBalls,
            maidens: newMaidens,
            runs: newRuns,
            wickets: newWickets,
            avatar: bowler.avatar || existing?.avatar,
          },
        };
      });
    }
  }, [bowler.name, bowler.overs, bowler.ballsInOver, bowler.maidens, bowler.runs, bowler.wickets, bowler.avatar]);

  const { teams, addPlayerToTeam } = useMatchStore();

  // Initialize and merge master team squads from stored teams and selected lineups
  React.useEffect(() => {
    const teamAObj = teams.find(t => t.name.toLowerCase() === teamA.toLowerCase());
    const teamBObj = teams.find(t => t.name.toLowerCase() === teamB.toLowerCase());
    const hasLineupA = Boolean(selectedLineups[(teamA || '').toLowerCase()]);
    const hasLineupB = Boolean(selectedLineups[(teamB || '').toLowerCase()]);
    const xiA = selectedLineups[(teamA || '').toLowerCase()] || (hasLineupA ? [] : (teamAObj?.players || []));
    const xiB = selectedLineups[(teamB || '').toLowerCase()] || (hasLineupB ? [] : (teamBObj?.players || []));

    const officialTeamBNames = new Set(
      [...(xiB || []), ...(hasLineupB ? [] : (teamBObj?.players || []))].map((p: any) => (typeof p === 'string' ? p : p?.name).trim().toLowerCase())
    );
    const officialTeamANames = new Set(
      [...(xiA || []), ...(hasLineupA ? [] : (teamAObj?.players || []))].map((p: any) => (typeof p === 'string' ? p : p?.name).trim().toLowerCase())
    );

    setTeamASquad(prev => {
      const seen = new Set<string>();
      const out: Player[] = [];
      const add = (p: any, allowTeamBOverlap = false) => {
        const pName = typeof p === 'string' ? p : p?.name;
        if (!pName || !pName.trim()) return;
        const key = pName.trim().toLowerCase();
        if (seen.has(key)) return;
        if (!allowTeamBOverlap && officialTeamBNames.has(key)) return;
        seen.add(key);
        out.push(
          typeof p === 'string'
            ? { id: `ta_${pName}`, name: pName.trim(), position: 'Batsman', skillLevel: 'Intermediate' }
            : {
                id: p.id || `ta_${pName}`,
                name: pName.trim(),
                phone: p.phone || p.mobile,
                avatarUrl: p.avatarUrl || p.avatar,
                position: p.position || p.role || 'Batsman',
                skillLevel: p.skillLevel || 'Intermediate',
              }
        );
      };
      // 1. Core Team A players: use selected Playing XI if provided, otherwise team roster
      (xiA || []).forEach(p => add(p, true));
      if (!hasLineupA) {
        (teamAObj?.players || []).forEach(p => add(p, true));
      }
      // 2. Extra players in current squad state (if not part of Team B roster)
      (prev || []).forEach(p => add(p, false));
      return out;
    });

    setTeamBSquad(prev => {
      const seen = new Set<string>();
      const out: Player[] = [];
      const add = (p: any, allowTeamAOverlap = false) => {
        const pName = typeof p === 'string' ? p : p?.name;
        if (!pName || !pName.trim()) return;
        const key = pName.trim().toLowerCase();
        if (seen.has(key)) return;
        if (!allowTeamAOverlap && officialTeamANames.has(key)) return;
        seen.add(key);
        out.push(
          typeof p === 'string'
            ? { id: `tb_${pName}`, name: pName.trim(), position: 'Bowler', skillLevel: 'Intermediate' }
            : {
                id: p.id || `tb_${pName}`,
                name: pName.trim(),
                phone: p.phone || p.mobile,
                avatarUrl: p.avatarUrl || p.avatar,
                position: p.position || p.role || 'Bowler',
                skillLevel: p.skillLevel || 'Intermediate',
              }
        );
      };
      // 1. Core Team B players: use selected Playing XI if provided, otherwise team roster
      (xiB || []).forEach(p => add(p, true));
      if (!hasLineupB) {
        (teamBObj?.players || []).forEach(p => add(p, true));
      }
      // 2. Extra players in current squad state (if not part of Team A roster)
      (prev || []).forEach(p => add(p, false));
      return out;
    });
  }, [teamA, teamB, teams, selectedLineups]);

  // Canonical player registration helper to keep all squads, FoF network, and bench lists in perfect sync
  const registerPlayerToSquad = React.useCallback((targetTeam: 'A' | 'B' | string, player: any) => {
    if (!player || !player.name || !player.name.trim()) return;
    const pName = player.name.trim();
    const isTeamA = targetTeam === 'A' || targetTeam.toLowerCase() === teamA.toLowerCase();
    const actualTeamName = isTeamA ? teamA : teamB;
    const playerObj: Player = {
      id: player.id || (isTeamA ? `ta_${pName}` : `tb_${pName}`),
      name: pName,
      phone: player.phone || player.mobile,
      avatarUrl: player.avatarUrl || player.avatar,
      position: player.position || player.role || 'All-Rounder',
      skillLevel: player.skillLevel || 'Intermediate',
    };

    if (isTeamA) {
      setTeamASquad(prev => strictDedupe([...prev, playerObj]));
    } else {
      setTeamBSquad(prev => strictDedupe([...prev, playerObj]));
    }

    if (typeof addPlayerToTeam === 'function') {
      addPlayerToTeam(actualTeamName, playerObj);
    }

    registerFoFPlayer({
      name: playerObj.name,
      phone: playerObj.phone,
      avatar: playerObj.avatarUrl,
      sport: 'Cricket 🏏',
    });

    const isTargetBatting = (battingTeamName || teamA).trim().toLowerCase() === actualTeamName.trim().toLowerCase();
    if (isTargetBatting) {
      setYetToBatBatsmen(prev => {
        const exists = prev.some(p => (typeof p === 'string' ? p : p.name).trim().toLowerCase() === pName.toLowerCase());
        return exists ? prev : [...prev, playerObj];
      });
    } else {
      setOtherBowlers(prev => {
        const exists = prev.some(p => (typeof p === 'string' ? p : p.name).trim().toLowerCase() === pName.toLowerCase());
        return exists ? prev : [...prev, playerObj];
      });
    }
  }, [teamA, teamB, battingTeamName, addPlayerToTeam]);

  const [showPreRulesModal, setShowPreRulesModal] = useState(false);
  const [currentTotalOvers, setCurrentTotalOvers] = useState<string>(totalOvers);
  const [editTotalOversInput, setEditTotalOversInput] = useState(totalOvers);
  const [tossText, setTossText] = useState<string>(initialToss.summary);

  React.useEffect(() => {
    if (tossWinner || decision) {
      const nextToss = getInitialTossState();
      setBattingTeamName(nextToss.batTeam);
      setBowlingTeamName(nextToss.bowlTeam);
      setTossText(nextToss.summary);
      setRematchTossWinner(nextToss.winnerName);
      setRematchTossDecision(nextToss.decisionType);
    }
  }, [tossWinner, decision, getInitialTossState]);

  const [ruleAutoWide, setRuleAutoWide] = useState(autoWide === '1');
  const [ruleAutoNoBall, setRuleAutoNoBall] = useState(autoNoBall === '1');
  const [ruleAllowByes, setRuleAllowByes] = useState(allowByes === '1');
  const [ruleAllowWicketRuns, setRuleAllowWicketRuns] = useState(true);
  const defaultMaxOversPerBowler = Math.max(1, Math.ceil((parseInt(totalOvers) || 20) / 5)).toString();
  const [ruleMaxOversPerBowler, setRuleMaxOversPerBowler] = useState<string>(defaultMaxOversPerBowler);
  const [editMaxOversPerBowlerInput, setEditMaxOversPerBowlerInput] = useState<string>(defaultMaxOversPerBowler);

  // 🔔 Animated Toast Notification State (Success / Warning / Error / Info)
  const [toastConfig, setToastConfig] = useState<{
    visible: boolean;
    type: 'success' | 'warning' | 'error' | 'info';
    message: string;
  }>({ visible: false, type: 'info', message: '' });

  // 🥳 1st Innings Happy Celebration Toaster / Modal State
  const [showFirstInningsHappyModal, setShowFirstInningsHappyModal] = useState(false);
  const [firstInningsHappyData, setFirstInningsHappyData] = useState<{
    battingTeam: string;
    bowlingTeam: string;
    runs: number;
    wickets: number;
    overs: string;
    target: number;
    maxOvers: number;
    reqRunRate: string;
  } | null>(null);

  const toastAnimY = React.useRef(new Animated.Value(-100)).current;
  const toastOpacity = React.useRef(new Animated.Value(0)).current;
  const toastTimeoutRef = React.useRef<any>(null);

  const showToast = (type: 'success' | 'warning' | 'error' | 'info', message: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastConfig({ visible: true, type, message });
    toastAnimY.setValue(-80);
    toastOpacity.setValue(0);

    Animated.parallel([
      Animated.spring(toastAnimY, {
        toValue: 16,
        useNativeDriver: true,
        friction: 7,
        tension: 80,
      }),
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    toastTimeoutRef.current = setTimeout(() => {
      hideToast();
    }, 3000);
  };

  const hideToast = () => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    Animated.parallel([
      Animated.timing(toastAnimY, {
        toValue: -80,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToastConfig(prev => ({ ...prev, visible: false }));
    });
  };

  // Sync squad players from master team squads or persistent team store on mount
  React.useEffect(() => {
    const currentBatTeam = battingTeamName || teamA;
    const currentBowlTeam = bowlingTeamName || teamB;

    const batTeamObj = teams.find(t => t.name.toLowerCase() === currentBatTeam.toLowerCase());
    const bowlTeamObj = teams.find(t => t.name.toLowerCase() === currentBowlTeam.toLowerCase());

    const isBatTeamA = currentBatTeam.toLowerCase() === teamA.toLowerCase();
    const batSquad = (isBatTeamA ? teamASquad : teamBSquad).length > 0
      ? (isBatTeamA ? teamASquad : teamBSquad)
      : squadFor(currentBatTeam, batTeamObj?.players);
    const bowlSquad = (isBatTeamA ? teamBSquad : teamASquad).length > 0
      ? (isBatTeamA ? teamBSquad : teamASquad)
      : squadFor(currentBowlTeam, bowlTeamObj?.players);

    if (batSquad && batSquad.length > 0 && yetToBatBatsmen.length === 0 && batsmen.length === 0) {
      setYetToBatBatsmen(batSquad);
    }
    if (bowlSquad && bowlSquad.length > 0 && otherBowlers.length === 0 && (!bowler || !bowler.name)) {
      setOtherBowlers(bowlSquad);
    }
  }, [teamA, teamB, teams, teamASquad, teamBSquad]);

  // Computed bench batsmen (including available yet-to-bat squad AND previously batted/retired batsmen who can resume play!)
  const availableBenchBatsmen = React.useMemo(() => {
    const activeNames = new Set(
      batsmen
        .map(b => (b && b.name ? b.name.trim().toLowerCase() : ''))
        .filter(n => n !== '' && n !== 'batsman 1' && n !== 'batsman 2')
    );
    const permanentlyOutNames = new Set(
      dismissedBatsmen
        .filter(db => db && db.name && db.status !== 'Retired Hurt' && db.status !== 'Retired Not Out' && db.dismissalType !== 'retired_hurt')
        .map(db => db.name.trim().toLowerCase())
    );

    // Opponent players in bowling squad must NEVER be suggested as batsmen!
    const opponentNames = new Set(
      [
        bowler?.name,
        ...otherBowlers.map(p => (typeof p === 'string' ? p : p?.name)),
      ]
        .filter(Boolean)
        .map(n => n.trim().toLowerCase())
    );

    const map = new Map<string, any>();
    // 1. Yet to bat players in current batting squad
    for (const p of yetToBatBatsmen) {
      if (!p) continue;
      const bName = typeof p === 'string' ? p : (p.name || '');
      if (!bName) continue;
      const nameLower = bName.trim().toLowerCase();
      if (opponentNames.has(nameLower)) continue; // Never suggest opponent players
      if (!activeNames.has(nameLower) && !permanentlyOutNames.has(nameLower) && !map.has(nameLower)) {
        const archived = inningsBatsmenArchive[nameLower];
        if (archived && (archived.runs > 0 || archived.balls > 0)) {
          map.set(nameLower, {
            ...(typeof p === 'string' ? { name: p } : p),
            name: bName.trim(),
            runs: archived.runs,
            balls: archived.balls,
            fours: archived.fours,
            sixes: archived.sixes,
            isReturningPlayer: true,
            role: `Resume (${archived.runs} runs, ${archived.balls}b)`
          });
        } else {
          map.set(nameLower, typeof p === 'string' ? { name: p, runs: 0, balls: 0, fours: 0, sixes: 0 } : { ...p, runs: 0, balls: 0, fours: 0, sixes: 0 });
        }
      }
    }
    // 2. Previously batted players in this innings who retired/stepped down but belong to batting squad
    for (const [nameKey, archived] of Object.entries(inningsBatsmenArchive)) {
      if (!archived || !archived.name) continue;
      if (opponentNames.has(nameKey)) continue; // Never suggest opponent players
      if (!activeNames.has(nameKey) && !permanentlyOutNames.has(nameKey) && !map.has(nameKey)) {
        map.set(nameKey, {
          name: archived.name,
          runs: archived.runs,
          balls: archived.balls,
          fours: archived.fours,
          sixes: archived.sixes,
          avatar: archived.avatar,
          isReturningPlayer: true,
          role: `Resume (${archived.runs} runs, ${archived.balls}b)`
        });
      }
    }
    return Array.from(map.values());
  }, [yetToBatBatsmen, batsmen, dismissedBatsmen, inningsBatsmenArchive, otherBowlers, bowler]);

  // Current playing pools for PlayerSelectionModal
  const currentPoolA: Player[] = React.useMemo(() => {
    const list: Player[] = [];
    const seen = new Set<string>();
    const teamAObj = teams.find(t => t.name.toLowerCase() === teamA.toLowerCase());
    const teamBObj = teams.find(t => t.name.toLowerCase() === teamB.toLowerCase());
    const isTeamABatting = (battingTeamName || teamA).trim().toLowerCase() === teamA.trim().toLowerCase();
    const hasLineupA = Boolean(selectedLineups[(teamA || '').toLowerCase()]);
    const hasLineupB = Boolean(selectedLineups[(teamB || '').toLowerCase()]);

    // Official Team B roster names
    const officialTeamBNames = new Set([
      ...(hasLineupB ? [] : (teamBObj?.players || [])).map((p: any) => (typeof p === 'string' ? p : p?.name).trim().toLowerCase()),
      ...(selectedLineups[(teamB || '').toLowerCase()] || []).map((p: any) => (typeof p === 'string' ? p : p?.name).trim().toLowerCase()),
    ]);

    const addPlayer = (p: any, isTeamAPrimary = false) => {
      const pName = typeof p === 'string' ? p : p?.name;
      if (!pName || !pName.trim()) return;
      const key = pName.trim().toLowerCase();
      if (seen.has(key)) return;

      // If player is officially in Team B roster, only include in Team A if they are currently at the crease for Team A
      if (!isTeamAPrimary && officialTeamBNames.has(key)) {
        const isActivelyPlayingForA = isTeamABatting
          ? (batsmen || []).some(b => b && b.name && b.name.trim().toLowerCase() === key)
          : (bowler && bowler.name && bowler.name.trim().toLowerCase() === key);
        if (!isActivelyPlayingForA) return;
      }

      seen.add(key);
      list.push(
        typeof p === 'string'
          ? { id: `ta_${pName}`, name: pName.trim(), position: 'Batsman', skillLevel: 'Intermediate' }
          : {
              id: p.id || `ta_${pName}`,
              name: pName.trim(),
              phone: p.phone || p.mobile,
              avatarUrl: p.avatarUrl || p.avatar,
              position: p.position || p.role || 'Batsman',
              skillLevel: p.skillLevel || 'Intermediate',
            }
      );
    };

    // 1. Official Team A squad & selected lineup
    (selectedLineups[(teamA || '').toLowerCase()] || []).forEach((p: any) => addPlayer(p, true));
    if (!hasLineupA) {
      (teamAObj?.players || []).forEach(p => addPlayer(p, true));
    }
    (teamASquad || []).forEach(p => addPlayer(p, false));

    // 2. Active, dismissed, or yet-to-bat batsmen / bowlers currently in match for Team A
    const currentBatOrBowl = isTeamABatting
      ? [...batsmen, ...dismissedBatsmen, ...yetToBatBatsmen]
      : [bowler, ...otherBowlers];
    currentBatOrBowl.forEach(p => addPlayer(p, false));

    // 3. Innings archives for Team A
    if (isTeamABatting) {
      Object.values(inningsBatsmenArchive || {}).forEach(p => addPlayer(p, false));
    } else {
      Object.values(inningsBowlersArchive || {}).forEach(p => addPlayer(p, false));
    }

    return list;
  }, [teamA, teamB, battingTeamName, teamASquad, batsmen, dismissedBatsmen, yetToBatBatsmen, bowler, otherBowlers, inningsBatsmenArchive, inningsBowlersArchive, teams, selectedLineups]);

  const currentPoolB: Player[] = React.useMemo(() => {
    const list: Player[] = [];
    const seen = new Set<string>();
    const teamAObj = teams.find(t => t.name.toLowerCase() === teamA.toLowerCase());
    const teamBObj = teams.find(t => t.name.toLowerCase() === teamB.toLowerCase());
    const isTeamBBatting = (battingTeamName || teamA).trim().toLowerCase() === teamB.trim().toLowerCase();
    const hasLineupA = Boolean(selectedLineups[(teamA || '').toLowerCase()]);
    const hasLineupB = Boolean(selectedLineups[(teamB || '').toLowerCase()]);

    // Official Team A roster names
    const officialTeamANames = new Set([
      ...(hasLineupA ? [] : (teamAObj?.players || [])).map((p: any) => (typeof p === 'string' ? p : p?.name).trim().toLowerCase()),
      ...(selectedLineups[(teamA || '').toLowerCase()] || []).map((p: any) => (typeof p === 'string' ? p : p?.name).trim().toLowerCase()),
    ]);

    const addPlayer = (p: any, isTeamBPrimary = false) => {
      const pName = typeof p === 'string' ? p : p?.name;
      if (!pName || !pName.trim()) return;
      const key = pName.trim().toLowerCase();
      if (seen.has(key)) return;

      // If player is officially in Team A roster, only include in Team B if they are currently at the crease for Team B
      if (!isTeamBPrimary && officialTeamANames.has(key)) {
        const isActivelyPlayingForB = isTeamBBatting
          ? (batsmen || []).some(b => b && b.name && b.name.trim().toLowerCase() === key)
          : (bowler && bowler.name && bowler.name.trim().toLowerCase() === key);
        if (!isActivelyPlayingForB) return;
      }

      seen.add(key);
      list.push(
        typeof p === 'string'
          ? { id: `tb_${pName}`, name: pName.trim(), position: 'Bowler', skillLevel: 'Intermediate' }
          : {
              id: p.id || `tb_${pName}`,
              name: pName.trim(),
              phone: p.phone || p.mobile,
              avatarUrl: p.avatarUrl || p.avatar,
              position: p.position || p.role || 'Bowler',
              skillLevel: p.skillLevel || 'Intermediate',
            }
      );
    };

    // 1. Official Team B squad & selected lineup
    (selectedLineups[(teamB || '').toLowerCase()] || []).forEach((p: any) => addPlayer(p, true));
    if (!hasLineupB) {
      (teamBObj?.players || []).forEach(p => addPlayer(p, true));
    }
    (teamBSquad || []).forEach(p => addPlayer(p, false));

    // 2. Active, dismissed, or yet-to-bat batsmen / bowlers currently in match for Team B
    const currentBatOrBowl = isTeamBBatting
      ? [...batsmen, ...dismissedBatsmen, ...yetToBatBatsmen]
      : [bowler, ...otherBowlers];
    currentBatOrBowl.forEach(p => addPlayer(p, false));

    // 3. Innings archives for Team B
    if (isTeamBBatting) {
      Object.values(inningsBatsmenArchive || {}).forEach(p => addPlayer(p, false));
    } else {
      Object.values(inningsBowlersArchive || {}).forEach(p => addPlayer(p, false));
    }

    return list;
  }, [teamA, teamB, battingTeamName, teamBSquad, batsmen, dismissedBatsmen, yetToBatBatsmen, bowler, otherBowlers, inningsBatsmenArchive, inningsBowlersArchive, teams, selectedLineups]);

  // Master available pool for any unassigned / candidate players for this match only
  const allMatchPool: Player[] = React.useMemo(() => {
    const assigned = new Set([
      ...currentPoolA.map(p => p.name.trim().toLowerCase()),
      ...currentPoolB.map(p => p.name.trim().toLowerCase()),
    ]);
    const list: Player[] = [];
    const teamAObj = teams.find(t => t.name.toLowerCase() === teamA.toLowerCase());
    const teamBObj = teams.find(t => t.name.toLowerCase() === teamB.toLowerCase());

    const matchCandidates: any[] = [
      ...initialUnassignedPool,
      ...(teamAObj?.players || []),
      ...(teamBObj?.players || []),
    ];

    matchCandidates.forEach((p: any) => {
      const pName = typeof p === 'string' ? p : p?.name;
      if (pName && pName.trim() && !assigned.has(pName.trim().toLowerCase())) {
        assigned.add(pName.trim().toLowerCase());
        list.push(
          typeof p === 'string'
            ? { id: `pool_${pName}`, name: pName.trim(), position: 'All-Rounder', skillLevel: 'Intermediate' }
            : p
        );
      }
    });
    return list;
  }, [currentPoolA, currentPoolB, teams, teamA, teamB, initialUnassignedPool]);

  // Computed bench bowlers (strictly excluding current active bowler, active batsmen, dismissed batsmen, and identifying quota full)
  const availableBenchBowlers = React.useMemo(() => {
    const activeBowlerName = bowler && bowler.name ? bowler.name.trim().toLowerCase() : '';
    const activeBatNames = new Set(
      batsmen
        .map(b => (b && b.name ? b.name.trim().toLowerCase() : ''))
        .filter(n => n.length > 0)
    );
    const dismissedBatNames = new Set(
      dismissedBatsmen
        .map(b => (b && b.name ? b.name.trim().toLowerCase() : ''))
        .filter(n => n.length > 0)
    );
    const maxLimit = ruleMaxOversPerBowler === 'unlimited' ? Infinity : (parseInt(ruleMaxOversPerBowler) || Infinity);

    const map = new Map<string, any>();
    for (const b of otherBowlers) {
      if (!b) continue;
      const bName = typeof b === 'string' ? b : (b.name || '');
      if (!bName) continue;
      const nameLower = bName.trim().toLowerCase();
      const archivedOvers = inningsBowlersArchive[nameLower]?.overs || 0;
      const bOvers = Math.max(typeof b === 'string' ? 0 : (b.overs || 0), archivedOvers);
      const isQuotaFull = bOvers >= maxLimit;

      if (nameLower !== activeBowlerName && !activeBatNames.has(nameLower) && !dismissedBatNames.has(nameLower) && !map.has(nameLower)) {
        map.set(nameLower, typeof b === 'string' ? { name: b, overs: bOvers, isQuotaFull } : { ...b, overs: bOvers, isQuotaFull });
      }
    }
    return Array.from(map.values());
  }, [otherBowlers, bowler, batsmen, dismissedBatsmen, ruleMaxOversPerBowler, inningsBowlersArchive]);

  // Form edit states
  const [b1Name, setB1Name] = useState('');
  const [b1Runs, setB1Runs] = useState('');
  const [b1Balls, setB1Balls] = useState('');
  const [b1Fours, setB1Fours] = useState('');
  const [b1Sixes, setB1Sixes] = useState('');

  const [b2Name, setB2Name] = useState('');
  const [b2Runs, setB2Runs] = useState('');
  const [b2Balls, setB2Balls] = useState('');
  const [b2Fours, setB2Fours] = useState('');
  const [b2Sixes, setB2Sixes] = useState('');

  const [bowlName, setBowlName] = useState('');
  const [bowlOvers, setBowlOvers] = useState('');
  const [bowlRuns, setBowlRuns] = useState('');
  const [bowlWickets, setBowlWickets] = useState('');
  const [bowlMaidens, setBowlMaidens] = useState('');

  // Player Avatars State
  const [b1Avatar, setB1Avatar] = useState<string | undefined>(undefined);
  const [b2Avatar, setB2Avatar] = useState<string | undefined>(undefined);
  const [bowlAvatar, setBowlAvatar] = useState<string | undefined>(undefined);

  // Helper Sanitizers & Validators
  const sanitizePlayerName = (val: string) => {
    // Only letters, spaces, hyphens, and apostrophes allowed (NO NUMBERS)
    return val.replace(/[^a-zA-Z\s'-]/g, '').slice(0, 25);
  };

  const sanitizeNumericInput = (val: string, maxDigits: number = 3) => {
    if (!val || val === 'undefined' || val === 'NaN') return '0';
    const cleaned = val.replace(/[^0-9]/g, '').slice(0, maxDigits);
    return cleaned === '' ? '0' : cleaned;
  };

  const handlePickAvatar = async (target: 'b1' | 'b2' | 'bowler') => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Media library access is required to choose a player photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        if (target === 'b1') setB1Avatar(uri);
        else if (target === 'b2') setB2Avatar(uri);
        else if (target === 'bowler') setBowlAvatar(uri);
      }
    } catch (err: any) {
      Alert.alert('Error', 'Unable to pick image.');
    }
  };

  // Replacement/Retire sub-state inside edit modal
  const [actionTarget, setActionTarget] = useState<{ type: 'retire' | 'replace' | 'bowler'; batsmanIndex?: number } | null>(null);
  const [customNewName, setCustomNewName] = useState('');

  // ── Squad management popups (swap / change / edit) ──────────────────────
  // One shared modal family; see components/scoring/squad-modals.tsx.
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [changeSlot, setChangeSlot] = useState<number | null>(null);
  const [editSlot, setEditSlot] = useState<number | null>(null);

  const handleSwapStrike = () => {
    if (batsmen.length < 2 || !batsmen[0]?.name?.trim() || !batsmen[1]?.name?.trim()) {
      Alert.alert('Batsmen Required', 'Please assign 2 active opening batsmen before swapping strike ends.');
      return;
    }
    setSwapModalOpen(true);
  };

  /** Actually rotate the strike, once the swap popup is confirmed. */
  const confirmSwapStrike = () => {
    setSwapModalOpen(false);
    if (batsmen.length < 2) return;

    // Save history for undo support
    const oldState = {
      runs,
      wickets,
      overs,
      ballsInCurrentOver,
      overLog: [...overLog],
      batsmen: batsmen.map(b => ({ ...b })),
      bowler: { ...bowler },
      lastOverBowlerName,
    };
    setHistory(prev => [...prev.slice(-19), oldState]);

    setBatsmen(prev =>
      prev.map(b => ({
        ...b,
        active: !b.active,
      }))
    );
  };

  const getFullBatsmenScorecard = (
    batsmenOverride?: Batsman[],
    dismissedOverride?: any[],
    yetToBatOverride?: any[]
  ) => {
    const effectiveDismissed = dismissedOverride !== undefined ? dismissedOverride : dismissedBatsmen;
    const effectiveBatsmen = batsmenOverride !== undefined ? batsmenOverride : batsmen;
    const effectiveYetToBat = yetToBatOverride !== undefined ? yetToBatOverride : yetToBatBatsmen;

    const list: any[] = [...effectiveDismissed];
    const existingNames = new Set<string>(
      effectiveDismissed
        .map(db => (db && db.name ? db.name.trim().toLowerCase() : ''))
        .filter(Boolean)
    );

    if (effectiveBatsmen[0] && effectiveBatsmen[0].name && effectiveBatsmen[0].name.trim().length > 0) {
      const name0 = effectiveBatsmen[0].name.trim().toLowerCase();
      if (!existingNames.has(name0)) {
        list.push({ ...effectiveBatsmen[0], status: 'not out' });
        existingNames.add(name0);
      }
    }
    if (effectiveBatsmen[1] && effectiveBatsmen[1].name && effectiveBatsmen[1].name.trim().length > 0) {
      const name1 = effectiveBatsmen[1].name.trim().toLowerCase();
      if (!existingNames.has(name1)) {
        list.push({ ...effectiveBatsmen[1], status: 'not out' });
        existingNames.add(name1);
      }
    }
    effectiveYetToBat.forEach(b => {
      const bName = typeof b === 'string' ? b : (b && b.name ? b.name : '');
      if (bName && bName.trim().length > 0) {
        const nameLower = bName.trim().toLowerCase();
        if (!existingNames.has(nameLower)) {
          list.push({ ...(typeof b === 'string' ? { name: bName } : b), status: 'yet to bat' });
          existingNames.add(nameLower);
        }
      }
    });
    return list;
  };

  const getFullBowlerScorecard = (
    bowlerOverride?: Bowler | null,
    otherBowlersOverride?: any[],
    archiveOverride?: Record<string, any>
  ) => {
    const list: any[] = [];
    const existingNames = new Set<string>();
    const effectiveBowler = bowlerOverride !== undefined ? bowlerOverride : bowler;
    const effectiveOther = otherBowlersOverride !== undefined ? otherBowlersOverride : (otherBowlers || []);
    const effectiveArchive = archiveOverride !== undefined ? archiveOverride : (inningsBowlersArchive || {});

    if (effectiveBowler && effectiveBowler.name && effectiveBowler.name.trim().length > 0) {
      const bNameLower = effectiveBowler.name.trim().toLowerCase();
      const archived = effectiveArchive[bNameLower];
      list.push({
        ...effectiveBowler,
        overs: effectiveBowler.overs !== undefined ? effectiveBowler.overs : (archived?.overs || 0),
        ballsInOver: effectiveBowler.ballsInOver !== undefined ? effectiveBowler.ballsInOver : (archived?.ballsInOver || 0),
        maidens: effectiveBowler.maidens !== undefined ? effectiveBowler.maidens : (archived?.maidens || 0),
        runs: effectiveBowler.runs !== undefined ? effectiveBowler.runs : (archived?.runs || 0),
        wickets: effectiveBowler.wickets !== undefined ? effectiveBowler.wickets : (archived?.wickets || 0),
        active: true,
      });
      existingNames.add(bNameLower);
    }
    effectiveOther.forEach(b => {
      const bName = typeof b === 'string' ? b : (b && b.name ? b.name : '');
      if (bName && bName.trim().length > 0) {
        const nameLower = bName.trim().toLowerCase();
        if (!existingNames.has(nameLower)) {
          const archived = effectiveArchive[nameLower];
          const bObj = typeof b === 'string' ? { name: bName } : b;
          list.push({
            ...bObj,
            overs: (bObj.overs !== undefined && bObj.overs > 0) ? bObj.overs : (archived?.overs || 0),
            ballsInOver: (bObj.ballsInOver !== undefined && bObj.ballsInOver > 0) ? bObj.ballsInOver : (archived?.ballsInOver || 0),
            maidens: (bObj.maidens !== undefined && bObj.maidens > 0) ? bObj.maidens : (archived?.maidens || 0),
            runs: (bObj.runs !== undefined && bObj.runs > 0) ? bObj.runs : (archived?.runs || 0),
            wickets: (bObj.wickets !== undefined && bObj.wickets > 0) ? bObj.wickets : (archived?.wickets || 0),
            active: false,
          });
          existingNames.add(nameLower);
        }
      }
    });

    Object.keys(effectiveArchive || {}).forEach(nameLower => {
      if (!existingNames.has(nameLower)) {
        const archived = effectiveArchive[nameLower];
        if (archived && archived.name) {
          list.push({
            ...archived,
            active: false,
          });
          existingNames.add(nameLower);
        }
      }
    });

    return list;
  };

  // Helper Player Management Handlers
  const openEditPlayersModal = () => {
    setShowPlayingXIModal(true);
  };

  const savePlayersEdit = () => {
    // Perform strict field validations before saving!
    if (b1Name.trim() && b1Name.trim().length < 2) {
      showToast('warning', 'Batsman 1 name must be at least 2 characters long.');
      return;
    }
    if (b2Name.trim() && b2Name.trim().length < 2) {
      showToast('warning', 'Batsman 2 name must be at least 2 characters long.');
      return;
    }
    if (b1Name.trim() && b2Name.trim() && b1Name.trim().toLowerCase() === b2Name.trim().toLowerCase()) {
      showToast('error', `Batsman 1 and Batsman 2 cannot be the same player (${b1Name.trim()})!`);
      return;
    }
    if (bowlName.trim() && bowlName.trim().length < 2) {
      showToast('warning', 'Bowler name must be at least 2 characters long.');
      return;
    }

    // Dismissed Batsman Validation: Permanently out batsmen cannot be selected to bat again
    const isB1PermanentlyOut = dismissedBatsmen.some(db => db.name && db.name.trim().toLowerCase() === b1Name.trim().toLowerCase() && db.status !== 'Retired Hurt' && db.status !== 'Retired Not Out' && db.dismissalType !== 'retired_hurt');
    const isB2PermanentlyOut = dismissedBatsmen.some(db => db.name && db.name.trim().toLowerCase() === b2Name.trim().toLowerCase() && db.status !== 'Retired Hurt' && db.status !== 'Retired Not Out' && db.dismissalType !== 'retired_hurt');
    if (isB1PermanentlyOut) {
      showToast('error', `Batsman 1 (${b1Name.trim()}) is already Out and cannot bat again in this innings!`);
      return;
    }
    if (isB2PermanentlyOut) {
      showToast('error', `Batsman 2 (${b2Name.trim()}) is already Out and cannot bat again in this innings!`);
      return;
    }

    // Clean up Retired Hurt records from dismissed list if restored into active lineup
    setDismissedBatsmen(prev => prev.filter(db => {
      const nameLower = db.name.trim().toLowerCase();
      const isResumed = nameLower === b1Name.trim().toLowerCase() || nameLower === b2Name.trim().toLowerCase();
      return !isResumed || (db.status !== 'Retired Hurt' && db.status !== 'Retired Not Out' && db.dismissalType !== 'retired_hurt');
    }));

    // Bowler Max Overs Quota Validation
    const maxBowlerLimit = ruleMaxOversPerBowler === 'unlimited' ? Infinity : (parseInt(ruleMaxOversPerBowler) || Infinity);
    const existingBowler = otherBowlers.find(b => (typeof b === 'string' ? b : b.name).trim().toLowerCase() === bowlName.trim().toLowerCase());
    const bowlerOversSoFar = existingBowler && typeof existingBowler !== 'string' ? (existingBowler.overs || 0) : 0;
    if (bowlerOversSoFar >= maxBowlerLimit) {
      showToast('error', `Bowler (${bowlName.trim()}) has already bowled maximum allowed ${maxBowlerLimit} overs under match rules!`);
      return;
    }

    const oldState = {
      runs,
      wickets,
      overs,
      ballsInCurrentOver,
      overLog: [...overLog],
      batsmen: batsmen.map(b => ({ ...b })),
      bowler: { ...bowler },
      lastOverBowlerName,
    };
    setHistory(prev => [...prev.slice(-19), oldState]);

    // If outgoing batsman 1 was replaced, archive their stats
    if (batsmen[0] && batsmen[0].name && batsmen[0].name.trim().toLowerCase() !== b1Name.trim().toLowerCase()) {
      setInningsBatsmenArchive(prev => ({
        ...prev,
        [batsmen[0].name.trim().toLowerCase()]: {
          name: batsmen[0].name.trim(),
          runs: batsmen[0].runs || 0,
          balls: batsmen[0].balls || 0,
          fours: batsmen[0].fours || 0,
          sixes: batsmen[0].sixes || 0,
          avatar: batsmen[0].avatar,
        }
      }));
    }
    // If outgoing batsman 2 was replaced, archive their stats
    if (batsmen[1] && batsmen[1].name && batsmen[1].name.trim().toLowerCase() !== b2Name.trim().toLowerCase()) {
      setInningsBatsmenArchive(prev => ({
        ...prev,
        [batsmen[1].name.trim().toLowerCase()]: {
          name: batsmen[1].name.trim(),
          runs: batsmen[1].runs || 0,
          balls: batsmen[1].balls || 0,
          fours: batsmen[1].fours || 0,
          sixes: batsmen[1].sixes || 0,
          avatar: batsmen[1].avatar,
        }
      }));
    }

    const newBatsmen: Batsman[] = [];
    if (b1Name.trim()) {
      const b1R = parseInt(b1Runs) || 0;
      const b1B = parseInt(b1Balls) || 0;
      const b14 = parseInt(b1Fours) || 0;
      const b16 = parseInt(b1Sixes) || 0;
      newBatsmen.push({
        name: b1Name.trim(),
        runs: b1R,
        balls: b1B,
        fours: b14,
        sixes: b16,
        active: batsmen[0]?.active ?? true,
        avatar: b1Avatar,
      });
      setInningsBatsmenArchive(prev => ({
        ...prev,
        [b1Name.trim().toLowerCase()]: {
          name: b1Name.trim(),
          runs: b1R,
          balls: b1B,
          fours: b14,
          sixes: b16,
          avatar: b1Avatar,
        }
      }));
    }
    if (b2Name.trim()) {
      const b2R = parseInt(b2Runs) || 0;
      const b2B = parseInt(b2Balls) || 0;
      const b24 = parseInt(b2Fours) || 0;
      const b26 = parseInt(b2Sixes) || 0;
      newBatsmen.push({
        name: b2Name.trim(),
        runs: b2R,
        balls: b2B,
        fours: b24,
        sixes: b26,
        active: batsmen[1]?.active ?? false,
        avatar: b2Avatar,
      });
      setInningsBatsmenArchive(prev => ({
        ...prev,
        [b2Name.trim().toLowerCase()]: {
          name: b2Name.trim(),
          runs: b2R,
          balls: b2B,
          fours: b24,
          sixes: b26,
          avatar: b2Avatar,
        }
      }));
    }

    setBatsmen(newBatsmen);

    if (bowlName.trim()) {
      setBowler({
        name: bowlName.trim(),
        overs: parseInt(bowlOvers) || 0,
        maidens: parseInt(bowlMaidens) || 0,
        runs: parseInt(bowlRuns) || 0,
        wickets: parseInt(bowlWickets) || 0,
        ballsInOver: bowler.ballsInOver,
        avatar: bowlAvatar,
      });
    }

    setShowEditPlayersModal(false);
  };

  const executeRetireBatsman = (type: 'Retired Hurt' | 'Retired Out' = 'Retired Hurt') => {
    const idx = actionTarget?.batsmanIndex;
    if (idx === undefined || !batsmen[idx] || !batsmen[idx].name) return;

    const oldState = {
      runs,
      wickets,
      overs,
      ballsInCurrentOver,
      overLog: [...overLog],
      batsmen: batsmen.map(b => ({ ...b })),
      bowler: { ...bowler },
      dismissedBatsmen: dismissedBatsmen.map(db => ({ ...db })),
      lastOverBowlerName,
    };
    setHistory(prev => [...prev.slice(-19), oldState]);

    const retiringPlayer = batsmen[idx];
    if (!retiringPlayer || !retiringPlayer.name) return;

    // Add to dismissed batsmen with explicit type (deduped)
    setDismissedBatsmen(prev => [
      ...prev.filter(db => db && db.name && db.name.trim().toLowerCase() !== retiringPlayer.name.trim().toLowerCase()),
      {
        name: retiringPlayer.name,
        status: type,
        dismissalType: type === 'Retired Hurt' ? 'retired_hurt' : 'retired_out',
        runs: retiringPlayer.runs,
        balls: retiringPlayer.balls,
        fours: retiringPlayer.fours,
        sixes: retiringPlayer.sixes,
      }
    ]);

    // Clear the batsman slot
    setBatsmen(prev => {
      const next = [...prev];
      if (idx === 0) {
        next[0] = {
          name: '',
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          active: prev[0]?.active ?? true,
        };
      } else {
        next[1] = {
          name: '',
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          active: prev[1]?.active ?? false,
        };
      }
      return next;
    });

    if (idx === 0) {
      setB1Name('');
      setB1Runs('0');
      setB1Balls('0');
      setB1Fours('0');
      setB1Sixes('0');
    } else {
      setB2Name('');
      setB2Runs('0');
      setB2Balls('0');
      setB2Fours('0');
      setB2Sixes('0');
    }

    setActionTarget(null);
    setCustomNewName('');
    showToast('info', `${retiringPlayer.name} has retired (${type}).`);
  };

  const executeSubstituteBatsman = (replacementName: string) => {
    const idx = actionTarget?.batsmanIndex;
    if (idx === undefined || !replacementName.trim()) return;

    const trimmedReplacement = replacementName.trim();
    const replacementLower = trimmedReplacement.toLowerCase();

    // Dismissed Check: Permanently out batsmen cannot be selected
    const isPermanentlyOut = dismissedBatsmen.some(
      db => db && db.name && db.name.trim().toLowerCase() === replacementLower &&
            db.status !== 'Retired Hurt' && db.status !== 'Retired Not Out' && db.dismissalType !== 'retired_hurt'
    );
    if (isPermanentlyOut) {
      showToast('error', `${trimmedReplacement} is already Out and cannot bat again!`);
      return;
    }

    const oldPlayer = batsmen[idx];
    // Archive outgoing player's stats
    if (oldPlayer && oldPlayer.name && oldPlayer.name.trim()) {
      setInningsBatsmenArchive(prev => ({
        ...prev,
        [oldPlayer.name.trim().toLowerCase()]: {
          name: oldPlayer.name.trim(),
          runs: oldPlayer.runs || 0,
          balls: oldPlayer.balls || 0,
          fours: oldPlayer.fours || 0,
          sixes: oldPlayer.sixes || 0,
          avatar: oldPlayer.avatar,
        }
      }));
    }

    // Look up incoming player in archive or retired hurt list
    const retHurtRec = dismissedBatsmen.find(
      db => db && db.name && db.name.trim().toLowerCase() === replacementLower &&
            (db.status === 'Retired Hurt' || db.status === 'Retired Not Out' || db.dismissalType === 'retired_hurt')
    );
    const archived = inningsBatsmenArchive[replacementLower];
    const runsInit = archived ? (archived.runs || 0) : (retHurtRec ? (retHurtRec.runs || 0) : 0);
    const ballsInit = archived ? (archived.balls || 0) : (retHurtRec ? (retHurtRec.balls || 0) : 0);
    const foursInit = archived ? (archived.fours || 0) : (retHurtRec ? (retHurtRec.fours || 0) : 0);
    const sixesInit = archived ? (archived.sixes || 0) : (retHurtRec ? (retHurtRec.sixes || 0) : 0);

    if (retHurtRec) {
      setDismissedBatsmen(prev => prev.filter(db => db.name.trim().toLowerCase() !== replacementLower));
    }

    const oldState = {
      runs,
      wickets,
      overs,
      ballsInCurrentOver,
      overLog: [...overLog],
      batsmen: batsmen.map(b => ({ ...b })),
      bowler: { ...bowler },
      dismissedBatsmen: dismissedBatsmen.map(db => ({ ...db })),
      inningsBatsmenArchive: { ...inningsBatsmenArchive },
      lastOverBowlerName,
    };
    setHistory(prev => [...prev.slice(-19), oldState]);

    setBatsmen(prev => {
      const next = [...prev];
      if (next[idx]) {
        next[idx] = {
          ...next[idx],
          name: trimmedReplacement,
          runs: runsInit,
          balls: ballsInit,
          fours: foursInit,
          sixes: sixesInit,
        };
      }
      return next;
    });

    if (idx === 0) {
      setB1Name(trimmedReplacement);
      setB1Runs(String(runsInit));
      setB1Balls(String(ballsInit));
      setB1Fours(String(foursInit));
      setB1Sixes(String(sixesInit));
    } else {
      setB2Name(trimmedReplacement);
      setB2Runs(String(runsInit));
      setB2Balls(String(ballsInit));
      setB2Fours(String(foursInit));
      setB2Sixes(String(sixesInit));
    }

    setActionTarget(null);
    setCustomNewName('');
    if (runsInit > 0 || ballsInit > 0) {
      showToast('success', `${trimmedReplacement} resumed batting with ${runsInit} runs (${ballsInit}b)!`);
    } else {
      showToast('success', `${trimmedReplacement} is now batting!`);
    }
  };

  const sendInBatsman = (playerName: string, targetSlot?: number) => {
    const trimmed = playerName.trim();
    if (!trimmed) return;
    const nameLower = trimmed.toLowerCase();

    // Check if player is permanently dismissed
    const permanentlyDismissed = dismissedBatsmen.find(
      db => db && db.name && db.name.trim().toLowerCase() === nameLower &&
            db.status !== 'Retired Hurt' && db.status !== 'Retired Not Out' && db.dismissalType !== 'retired_hurt'
    );
    if (permanentlyDismissed) {
      showToast('error', `${trimmed} is already Out and cannot bat again in this innings!`);
      return;
    }

    // Look up incoming player in live batsmen, archive, or retired hurt list
    const currentlyBatting = batsmen.find(b => b && b.name && b.name.trim().toLowerCase() === nameLower);
    const retiredHurtRecord = dismissedBatsmen.find(
      db => db && db.name && db.name.trim().toLowerCase() === nameLower &&
            (db.status === 'Retired Hurt' || db.status === 'Retired Not Out' || db.dismissalType === 'retired_hurt')
    );
    const archived = inningsBatsmenArchive[nameLower];
    const initialRuns = currentlyBatting ? (currentlyBatting.runs || 0) : (archived ? (archived.runs || 0) : (retiredHurtRecord ? (retiredHurtRecord.runs || 0) : 0));
    const initialBalls = currentlyBatting ? (currentlyBatting.balls || 0) : (archived ? (archived.balls || 0) : (retiredHurtRecord ? (retiredHurtRecord.balls || 0) : 0));
    const initialFours = currentlyBatting ? (currentlyBatting.fours || 0) : (archived ? (archived.fours || 0) : (retiredHurtRecord ? (retiredHurtRecord.fours || 0) : 0));
    const initialSixes = currentlyBatting ? (currentlyBatting.sixes || 0) : (archived ? (archived.sixes || 0) : (retiredHurtRecord ? (retiredHurtRecord.sixes || 0) : 0));

    // Keep archive synced with latest runs & balls
    setInningsBatsmenArchive(prev => ({
      ...prev,
      [nameLower]: {
        name: trimmed,
        runs: initialRuns,
        balls: initialBalls,
        fours: initialFours,
        sixes: initialSixes,
        avatar: currentlyBatting?.avatar || prev[nameLower]?.avatar,
      },
    }));

    // If returning from retirement, remove from dismissed list so they can play again!
    setDismissedBatsmen(prev => prev.filter(db => db && db.name && db.name.trim().toLowerCase() !== nameLower));

    // Filter out from yet to bat list
    setYetToBatBatsmen(prev => prev.filter(p => (typeof p === 'string' ? p : p.name).toLowerCase() !== nameLower));

    // Sync player into batting squad and ensure removal from bowling squad
    const isTeamABat = (battingTeamName || teamA).trim().toLowerCase() === teamA.trim().toLowerCase();
    const newBatPlayer: Player = {
      id: `p_${Date.now()}_${nameLower.replace(/\s+/g, '_')}`,
      name: trimmed,
      position: 'Batsman',
      skillLevel: 'Intermediate',
    };
    if (isTeamABat) {
      setTeamASquad(prev => {
        if (prev.some(p => (typeof p === 'string' ? p : p.name).trim().toLowerCase() === nameLower)) return prev;
        return [...prev, newBatPlayer];
      });
      setTeamBSquad(prev => prev.filter(p => (typeof p === 'string' ? p : p.name).trim().toLowerCase() !== nameLower));
    } else {
      setTeamBSquad(prev => {
        if (prev.some(p => (typeof p === 'string' ? p : p.name).trim().toLowerCase() === nameLower)) return prev;
        return [...prev, newBatPlayer];
      });
      setTeamASquad(prev => prev.filter(p => (typeof p === 'string' ? p : p.name).trim().toLowerCase() !== nameLower));
    }

    if (targetSlot === 0) {
      // Explicitly assign as STRIKER (slot 0)
      // If player is already non-striker (slot 1), clear slot 1!
      setBatsmen(prev => {
        const otherIsSame = prev[1] && prev[1].name && prev[1].name.trim().toLowerCase() === nameLower;
        const other = otherIsSame ? { name: '', active: false, runs: 0, balls: 0, fours: 0, sixes: 0 } : (prev[1] || { name: '', active: false, runs: 0, balls: 0, fours: 0, sixes: 0 });
        return [
          { name: trimmed, runs: initialRuns, balls: initialBalls, fours: initialFours, sixes: initialSixes, active: true },
          other
        ];
      });
      setB1Name(trimmed);
      setB1Runs(String(initialRuns));
      setB1Balls(String(initialBalls));
      setB1Fours(String(initialFours));
      setB1Sixes(String(initialSixes));
      if (b2Name.trim().toLowerCase() === nameLower) {
        setB2Name('');
        setB2Runs('0');
        setB2Balls('0');
      }
      showToast('success', `${trimmed} is now on strike as Striker!`);
      return;
    }

    if (targetSlot === 1) {
      // Explicitly assign as NON-STRIKER (slot 1)
      // If player is already striker (slot 0), clear slot 0!
      setBatsmen(prev => {
        const otherIsSame = prev[0] && prev[0].name && prev[0].name.trim().toLowerCase() === nameLower;
        const other = otherIsSame ? { name: '', active: true, runs: 0, balls: 0, fours: 0, sixes: 0 } : (prev[0] || { name: '', active: true, runs: 0, balls: 0, fours: 0, sixes: 0 });
        return [
          other,
          { name: trimmed, runs: initialRuns, balls: initialBalls, fours: initialFours, sixes: initialSixes, active: false }
        ];
      });
      setB2Name(trimmed);
      setB2Runs(String(initialRuns));
      setB2Balls(String(initialBalls));
      setB2Fours(String(initialFours));
      setB2Sixes(String(initialSixes));
      if (b1Name.trim().toLowerCase() === nameLower) {
        setB1Name('');
        setB1Runs('0');
        setB1Balls('0');
      }
      showToast('success', `${trimmed} has taken crease as Non-Striker!`);
      return;
    }

    // Default targetSlot === undefined: check duplicate
    const alreadyBattingIdx = batsmen.findIndex(
      b => b && b.name && b.name.trim().toLowerCase() === nameLower
    );
    if (alreadyBattingIdx !== -1) {
      showToast('warning', `${trimmed} is already batting on the pitch!`);
      return;
    }

    const b1Valid = batsmen[0] && batsmen[0].name && batsmen[0].name.trim() !== '' && batsmen[0].name.trim() !== 'Batsman 1';
    const b2Valid = batsmen[1] && batsmen[1].name && batsmen[1].name.trim() !== '' && batsmen[1].name.trim() !== 'Batsman 2';

    if (!b1Valid) {
      setBatsmen(prev => [
        { name: trimmed, runs: initialRuns, balls: initialBalls, fours: initialFours, sixes: initialSixes, active: true },
        (prev[1] && prev[1].name && prev[1].name.trim().toLowerCase() !== nameLower) ? prev[1] : { name: '', runs: 0, balls: 0, fours: 0, sixes: 0, active: false }
      ]);
      setB1Name(trimmed);
      setB1Runs(String(initialRuns));
      setB1Balls(String(initialBalls));
      setB1Fours(String(initialFours));
      setB1Sixes(String(initialSixes));
    } else if (!b2Valid) {
      setBatsmen(prev => [
        prev[0],
        { name: trimmed, runs: initialRuns, balls: initialBalls, fours: initialFours, sixes: initialSixes, active: false }
      ]);
      setB2Name(trimmed);
      setB2Runs(String(initialRuns));
      setB2Balls(String(initialBalls));
      setB2Fours(String(initialFours));
      setB2Sixes(String(initialSixes));
    } else {
      const idx = batsmen[0].active ? 0 : 1;
      const oldPlayer = batsmen[idx];
      if (oldPlayer && oldPlayer.name && oldPlayer.name.trim()) {
        setInningsBatsmenArchive(prev => ({
          ...prev,
          [oldPlayer.name.trim().toLowerCase()]: {
            name: oldPlayer.name.trim(),
            runs: oldPlayer.runs || 0,
            balls: oldPlayer.balls || 0,
            fours: oldPlayer.fours || 0,
            sixes: oldPlayer.sixes || 0,
            avatar: oldPlayer.avatar,
          }
        }));
        setYetToBatBatsmen(prev => [
          ...prev.filter(p => (typeof p === 'string' ? p : p.name).toLowerCase() !== oldPlayer.name.toLowerCase()),
          { name: oldPlayer.name, status: 'yet to bat', runs: oldPlayer.runs, balls: oldPlayer.balls, fours: oldPlayer.fours, sixes: oldPlayer.sixes }
        ]);
      }
      setBatsmen(prev => {
        const next = [...prev];
        next[idx] = { name: trimmed, runs: initialRuns, balls: initialBalls, fours: initialFours, sixes: initialSixes, active: true };
        return next;
      });
      if (idx === 0) {
        setB1Name(trimmed);
        setB1Runs(String(initialRuns));
        setB1Balls(String(initialBalls));
      } else {
        setB2Name(trimmed);
        setB2Runs(String(initialRuns));
        setB2Balls(String(initialBalls));
      }
    }
    showToast('success', initialRuns > 0 || initialBalls > 0
      ? `${trimmed} resumed batting with ${initialRuns} (${initialBalls}b)!`
      : `${trimmed} is now batting!`
    );
  };

  const executeReplaceBatsman = (replacementName: string) => {
    sendInBatsman(replacementName);
  };

  const executeRetire = (type: 'Retired Hurt' | 'Retired Out', replacementName?: string) => {
    executeRetireBatsman(type);
    if (replacementName && replacementName.trim()) {
      sendInBatsman(replacementName);
    }
  };

  const executeReplaceBowler = (replacementName: string) => {
    if (!replacementName.trim()) {
      showToast('warning', 'Please select or enter a bowler name.');
      return;
    }

    const trimmedNewName = replacementName.trim();
    if (lastOverBowlerName && trimmedNewName.toLowerCase() === lastOverBowlerName.toLowerCase() && overs > 0 && ballsInCurrentOver === 0) {
      Alert.alert(
        'Consecutive Over Not Allowed',
        `${trimmedNewName} bowled the previous over. By cricket rules, the same bowler cannot bowl two consecutive overs. Please select a different bowler.`
      );
      return;
    }
    // Max Overs Check: Prevent bowler who reached quota from bowling again
    const maxLimit = ruleMaxOversPerBowler === 'unlimited' ? Infinity : (parseInt(ruleMaxOversPerBowler) || Infinity);
    const existingRec = otherBowlers.find(b => (typeof b === 'string' ? b : b.name).trim().toLowerCase() === trimmedNewName.toLowerCase());
    const archivedRec = inningsBowlersArchive[trimmedNewName.toLowerCase()];
    const oversBowled = Math.max(
      existingRec && typeof existingRec !== 'string' ? (existingRec.overs || 0) : 0,
      archivedRec?.overs || 0
    );
    if (oversBowled >= maxLimit) {
      showToast('error', `${trimmedNewName} has already bowled their maximum allowed ${maxLimit} overs!`);
      return;
    }

    const oldState = {
      runs,
      wickets,
      overs,
      ballsInCurrentOver,
      overLog: [...overLog],
      batsmen: batsmen.map(b => ({ ...b })),
      bowler: { ...bowler },
      otherBowlers: otherBowlers.map(ob => ({ ...ob })),
      dismissedBatsmen: dismissedBatsmen.map(db => ({ ...db })),
      lastOverBowlerName,
    };
    setHistory(prev => [...prev.slice(-19), oldState]);

    const oldBowler = bowler;

    // Deduplicate and register both old bowler and new bowler into bowling squad registry
    setOtherBowlers(prev => {
      const map = new Map<string, any>();
      for (const item of prev) {
        if (!item) continue;
        const n = typeof item === 'string' ? item : item.name;
        if (n && n.trim()) map.set(n.trim().toLowerCase(), typeof item === 'string' ? { name: n.trim(), overs: 0, maidens: 0, runs: 0, wickets: 0 } : item);
      }

      if (oldBowler && oldBowler.name && oldBowler.name.trim()) {
        map.set(oldBowler.name.trim().toLowerCase(), {
          name: oldBowler.name.trim(),
          overs: oldBowler.overs || 0,
          ballsInOver: oldBowler.ballsInOver || 0,
          maidens: oldBowler.maidens || 0,
          runs: oldBowler.runs || 0,
          wickets: oldBowler.wickets || 0,
          avatar: oldBowler.avatar,
        });
      }

      if (trimmedNewName && !map.has(trimmedNewName.toLowerCase())) {
        map.set(trimmedNewName.toLowerCase(), {
          name: trimmedNewName,
          overs: 0,
          ballsInOver: 0,
          maidens: 0,
          runs: 0,
          wickets: 0,
        });
      }

      return Array.from(map.values());
    });

    const nameKey = trimmedNewName.toLowerCase();
    const isFromBench = otherBowlers.find(p => (typeof p === 'string' ? p : p.name).toLowerCase() === nameKey);
    const archived = inningsBowlersArchive[nameKey];

    let newBowlerObj: Bowler;
    if (archived) {
      newBowlerObj = {
        name: archived.name || trimmedNewName,
        overs: archived.overs || 0,
        ballsInOver: archived.ballsInOver || 0,
        maidens: archived.maidens || 0,
        runs: archived.runs || 0,
        wickets: archived.wickets || 0,
        avatar: archived.avatar,
      };
    } else if (isFromBench && typeof isFromBench !== 'string') {
      newBowlerObj = {
        name: isFromBench.name,
        overs: isFromBench.overs || 0,
        ballsInOver: isFromBench.ballsInOver || 0,
        maidens: isFromBench.maidens || 0,
        runs: isFromBench.runs || 0,
        wickets: isFromBench.wickets || 0,
        avatar: isFromBench.avatar,
      };
    } else {
      newBowlerObj = {
        name: trimmedNewName,
        overs: 0,
        ballsInOver: 0,
        maidens: 0,
        runs: 0,
        wickets: 0,
      };
    }

    setBowler(newBowlerObj);

    setBowlName(newBowlerObj.name || '');
    setBowlOvers(String(newBowlerObj.overs || 0));
    setBowlRuns(String(newBowlerObj.runs || 0));
    setBowlWickets(String(newBowlerObj.wickets || 0));
    setBowlMaidens(String(newBowlerObj.maidens || 0));
    if (newBowlerObj.avatar) setBowlAvatar(newBowlerObj.avatar);

    setActionTarget(null);
    setCustomNewName('');

    // If a batsman slot is empty (e.g. from a wicket on the last ball of the over), prompt for Next Batsman now
    const missingIdx = batsmen.findIndex(b => !b || !b.name || !b.name.trim());
    if (missingIdx >= 0) {
      setTimeout(() => {
        setShowPlayingXIModal(true);
      }, 200);
    }
  };

  // Helper Stats Calcs
  // Fix #12: innings 2 always treated as underway (prevents toss unlock mid-innings)
  const isMatchUnderway = currentInnings === 2 || overs > 0 || ballsInCurrentOver > 0 || overLog.length > 0 || runs > 0 || wickets > 0 || firstInningsScore !== null;
  const totalBalls = overs * 6 + ballsInCurrentOver;
  const runRate = totalBalls > 0 ? (runs / (totalBalls / 6)) : 0;
  const totalMatchOvers = parseInt(currentTotalOvers) || 20;
  const projectedScore = totalBalls > 0 ? (runRate * totalMatchOvers) : 0;
  // Fix #D: totalExtrasCount sums actual extra RUNS (e.g. '3WD' = 3 runs, 'WD' = 1 run)
  const totalExtrasCount = overLog.reduce((sum, b) => {
    const m = b.match(/^(\d+)?(WD|NB|BYE|LB)$/);
    if (m) return sum + (m[1] !== undefined ? parseInt(m[1]) : 1);
    return sum;
  }, 0);

  // Target & Chase Calculations (2nd Innings)
  const targetRuns = (firstInningsScore?.runs || 0) + 1;
  const maxAllowedBalls = (parseInt(currentTotalOvers) || 20) * 6;
  const ballsRemaining = Math.max(0, maxAllowedBalls - totalBalls);
  const runsNeeded = Math.max(0, targetRuns - runs);
  const reqRunRate = ballsRemaining > 0 ? ((runsNeeded / ballsRemaining) * 6).toFixed(2) : '0.00';

  // Player Verification Validation Helper (Checks Bowler and Batsmen before bowling)
  const isBowlerMissing = !bowler.name || !bowler.name.trim();
  const isBatsmenMissing = batsmen.length < 2 || !batsmen[0]?.name?.trim() || !batsmen[1]?.name?.trim();
  const isPlayersIncomplete = isBowlerMissing || isBatsmenMissing;

  const validatePlayersBeforeScoring = (): boolean => {
    if (lastOverBowlerName && bowler?.name && bowler.name.trim().toLowerCase() === lastOverBowlerName.trim().toLowerCase() && overs > 0 && ballsInCurrentOver === 0) {
      Alert.alert(
        'Consecutive Over Not Allowed',
        `${bowler.name} bowled the previous over. In cricket, a bowler cannot bowl two consecutive overs. Please assign a different bowler.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Assign Bowler', onPress: () => { setShowPlayingXIModal(true); } },
        ]
      );
      return false;
    }

    if (isBowlerMissing && isBatsmenMissing) {
      Alert.alert(
        'Players Required Before Bowling',
        'Please assign an active bowler and 2 opening batsmen (Striker & Non-Striker) before recording a ball.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Assign Players Now', onPress: openEditPlayersModal },
        ]
      );
      return false;
    }

    if (isBowlerMissing) {
      Alert.alert(
        'Active Bowler Required',
        'Please assign an active bowler for this over before bowling.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Assign Bowler', onPress: () => { openEditPlayersModal(); setActionTarget({ type: 'bowler' }); } },
        ]
      );
      return false;
    }

    if (isBatsmenMissing) {
      Alert.alert(
        'Opening Batsmen Required',
        'Please assign 2 opening batsmen (Striker & Non-Striker) before bowling.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Assign Batsmen', onPress: openEditPlayersModal },
        ]
      );
      return false;
    }

    // Auto-verify one batsman is marked on strike
    const hasStriker = batsmen.some(b => b.active);
    if (!hasStriker && batsmen.length >= 2) {
      setBatsmen(prev => prev.map((b, i) => ({ ...b, active: i === 0 })));
    }

    return true;
  };


  // Details a wicket can carry beyond "someone is out".
  type WicketOptions = {
    dismissalType?: string;
    fielderName?: string;
    // Runs completed by the batsmen before the dismissal — the run-out case.
    runsCompleted?: number;
    // A run out can dismiss the batsman at either end.
    whoIsOut?: 'striker' | 'non-striker';
    // Run outs & retirements are not credited to the bowler's wicket column.
    creditBowler?: boolean;
  };

  // State Updates
  const recordBall = (
    type: 'run' | 'extra' | 'wicket',
    value: number | string,
    wicketOptions?: WicketOptions
  ) => {
    if (!validatePlayersBeforeScoring()) return;
    // Fix #9: Block recording after innings has ended
    if (isInningsOver) return;

    // Fix #5: Full undo snapshot including squad lists
    // Fix #F: Cap history at 20 to prevent memory jank
    const oldState = {
      runs,
      wickets,
      overs,
      ballsInCurrentOver,
      overLog: [...overLog],
      batsmen: batsmen.map(b => ({ ...b })),
      bowler: { ...bowler },
      dismissedBatsmen: dismissedBatsmen.map(db => ({ ...db })),
      yetToBatBatsmen: yetToBatBatsmen.map(y => (typeof y === 'string' ? y : { ...y })),
      otherBowlers: otherBowlers.map(ob => (typeof ob === 'string' ? ob : { ...ob })),
      lastOverBowlerName,
    };
    setHistory(prev => [...prev.slice(-19), oldState]);

    if (type === 'run') {
      const runVal = value as number;
      const newTotalRuns = runs + runVal;
      setRuns(newTotalRuns);

      // Clear the free-hit flag the no-ball raised. A free hit is still a legal
      // delivery, so it DOES count as a ball faced — only the dismissal rules
      // differ. (The ball is not counted on the no-ball itself, in
      // recordExtraWithRuns, which is where the delivery was illegal.)
      setLastWasNoBall(false);

      const updatedRunsBatsmen = batsmen.map(b => {
        if (b.active) {
          const updatedRuns = (b.runs || 0) + runVal;
          const updatedBalls = (b.balls || 0) + 1;
          const updatedFours = (b.fours || 0) + (runVal === 4 ? 1 : 0);
          const updatedSixes = (b.sixes || 0) + (runVal === 6 ? 1 : 0);

          if (b.name && b.name.trim()) {
            const sKey = b.name.trim().toLowerCase();
            setInningsBatsmenArchive(arc => ({
              ...arc,
              [sKey]: {
                name: b.name.trim(),
                runs: updatedRuns,
                balls: updatedBalls,
                fours: updatedFours,
                sixes: updatedSixes,
                avatar: b.avatar || arc[sKey]?.avatar,
              },
            }));
          }

          return {
            ...b,
            runs: updatedRuns,
            balls: updatedBalls,
            fours: updatedFours,
            sixes: updatedSixes,
          };
        }
        return b;
      });
      setBatsmen(updatedRunsBatsmen);

      // Update bowler runs/balls safely avoiding NaN
      const currBowlerOvers = typeof bowler.overs === 'number' ? bowler.overs : (parseInt(bowler.overs as any) || 0);
      const currBowlerBalls = typeof bowler.ballsInOver === 'number' ? bowler.ballsInOver : (parseInt(bowler.ballsInOver as any) || 0);
      const currBowlerRuns = typeof bowler.runs === 'number' ? bowler.runs : (parseInt(bowler.runs as any) || 0);
      const currBowlerWickets = typeof bowler.wickets === 'number' ? bowler.wickets : (parseInt(bowler.wickets as any) || 0);
      const currBowlerMaidens = typeof bowler.maidens === 'number' ? bowler.maidens : (parseInt(bowler.maidens as any) || 0);

      const updatedBowlerRuns = currBowlerRuns + runVal;
      const updatedBowlerBalls = currBowlerBalls + 1;
      const updatedBowlerObj = {
        ...bowler,
        overs: currBowlerOvers,
        ballsInOver: updatedBowlerBalls,
        runs: updatedBowlerRuns,
        wickets: currBowlerWickets,
        maidens: currBowlerMaidens,
      };
      setBowler(updatedBowlerObj);

      const bKey = bowler.name ? bowler.name.trim().toLowerCase() : '';
      const updatedBowlerArchive = bKey ? {
        ...inningsBowlersArchive,
        [bKey]: {
          name: bowler.name.trim(),
          overs: bowler.overs !== undefined ? Math.max(currBowlerOvers, inningsBowlersArchive[bKey]?.overs ?? 0) : (inningsBowlersArchive[bKey]?.overs ?? 0),
          ballsInOver: updatedBowlerBalls,
          maidens: bowler.maidens !== undefined ? Math.max(currBowlerMaidens, inningsBowlersArchive[bKey]?.maidens ?? 0) : (inningsBowlersArchive[bKey]?.maidens ?? 0),
          runs: Math.max(updatedBowlerRuns, inningsBowlersArchive[bKey]?.runs ?? 0),
          wickets: Math.max(currBowlerWickets, inningsBowlersArchive[bKey]?.wickets ?? 0),
          avatar: bowler.avatar || inningsBowlersArchive[bKey]?.avatar,
        },
      } : inningsBowlersArchive;
      if (bKey) setInningsBowlersArchive(updatedBowlerArchive);

      // Add to current over log & full innings deliveries
      setOverLog(prev => [...prev, runVal.toString()]);
      setInningsDeliveries(prev => [...prev, runVal.toString()]);

      // Strike Rotation: odd runs mean the batsmen finished at opposite ends.
      const rotatedRunsBatsmen = shouldRotateStrike(runVal)
        ? updatedRunsBatsmen.map(b => ({ ...b, active: !b.active }))
        : updatedRunsBatsmen;
      if (shouldRotateStrike(runVal)) {
        setBatsmen(rotatedRunsBatsmen);
      }

      // Check if 2nd Innings target reached to end match immediately
      if (currentInnings === 2 && firstInningsScore) {
        if (isTargetReached(newTotalRuns, firstInningsScore.runs)) {
          const updatedBalls = ballsInCurrentOver + 1;
          const updatedOvers = updatedBalls >= 6 ? overs + 1 : overs;
          const finalBalls = updatedBalls >= 6 ? 0 : updatedBalls;
          setBallsInCurrentOver(finalBalls);
          setOvers(updatedOvers);
          setIsInningsOver(true);
          const finalBatsmen = getFullBatsmenScorecard(rotatedRunsBatsmen, dismissedBatsmen, yetToBatBatsmen);
          const finalBowlers = getFullBowlerScorecard(updatedBowlerObj, otherBowlers, updatedBowlerArchive);
          setTimeout(() => {
            handleInningsEnd(2, updatedOvers, newTotalRuns, wickets, finalBalls, finalBatsmen, finalBowlers);
          }, 50);
          return;
        }
      }

      incrementBallCount(
        newTotalRuns,
        wickets,
        rotatedRunsBatsmen,
        updatedBowlerObj,
        otherBowlers,
        updatedBowlerArchive
      );
    } else if (type === 'wicket') {
      if (wickets >= 10) {
        Alert.alert('Innings Over', 'All 10 wickets have fallen!');
        return;
      }
      setLastWasNoBall(false);
      const newWickets = wickets + 1;
      setWickets(newWickets);

      const dismissalType = wicketOptions?.dismissalType || 'bowled';
      const fielderName = wicketOptions?.fielderName || '';
      const runsCompleted = Math.max(0, wicketOptions?.runsCompleted ?? 0);
      const whoIsOut = wicketOptions?.whoIsOut ?? 'striker';
      const creditBowler = wicketOptions?.creditBowler !== undefined
        ? wicketOptions.creditBowler
        : bowlerGetsCredit(dismissalType);
      // Odd runs means the batsmen crossed, so the striker's end changes.
      const crossed = runsCompleted % 2 !== 0;

      const strikerIdx = batsmen.findIndex(b => b.active);
      const safeStrikerIdx = strikerIdx >= 0 ? strikerIdx : 0;
      const nonStrikerIdx = safeStrikerIdx === 0 ? 1 : 0;
      const dismissedIdx = dismissedBatsmanIndex(strikerIdx, whoIsOut);
      // The striker faced the ball and scores whatever was run off it; the
      // dismissed player may be either of them on a run out.
      const targetIdx = dismissedIdx;
      const dismissedPlayer = batsmen[targetIdx];
      const isLastBallOfOver = ballsInCurrentOver >= 5;

      const newTotalRuns = runs + runsCompleted;
      if (runsCompleted > 0) setRuns(newTotalRuns);

      const logSymbol = wicketLogSymbol(dismissalType, runsCompleted);
      setOverLog(prev => [...prev, logSymbol]);
      setInningsDeliveries(prev => [...prev, logSymbol]);

      let updatedDismissedList = [...dismissedBatsmen];
      if (dismissedPlayer && dismissedPlayer.name) {
        let dismissalDesc = `b ${bowler.name}`;
        if (dismissalType === 'bowled') dismissalDesc = `b ${bowler.name}`;
        else if (dismissalType === 'caught') dismissalDesc = fielderName ? `c ${fielderName} b ${bowler.name}` : `c & b ${bowler.name}`;
        else if (dismissalType === 'caught_and_bowled') dismissalDesc = `c & b ${bowler.name}`;
        else if (dismissalType === 'lbw') dismissalDesc = `lbw b ${bowler.name}`;
        else if (dismissalType === 'stumped') dismissalDesc = fielderName ? `st ${fielderName} b ${bowler.name}` : `st b ${bowler.name}`;
        else if (dismissalType === 'run_out') dismissalDesc = fielderName ? `run out (${fielderName})` : `run out`;
        else if (dismissalType === 'hit_wicket') dismissalDesc = `hit wicket b ${bowler.name}`;
        else if (dismissalType === 'retired') dismissalDesc = `retired`;

        // The striker is credited with the runs completed and the ball faced;
        // a run-out non-striker gets neither.
        const isStrikerOut = targetIdx === safeStrikerIdx;
        const finalDismissedRuns = dismissedPlayer.runs + (isStrikerOut ? runsCompleted : 0);
        const finalDismissedBalls = dismissedPlayer.balls + (isStrikerOut ? 1 : 0);

        const newDismissedObj = {
          name: dismissedPlayer.name,
          status: dismissalDesc,
          dismissalType: dismissalType,
          dismissalDescription: dismissalDesc,
          fielder: fielderName,
          bowler: bowler.name,
          runs: finalDismissedRuns,
          balls: finalDismissedBalls,
          fours: dismissedPlayer.fours || 0,
          sixes: dismissedPlayer.sixes || 0,
          avatar: dismissedPlayer.avatar,
        };
        updatedDismissedList = [...dismissedBatsmen, newDismissedObj];
        setDismissedBatsmen(updatedDismissedList);

        // Keep master innings archive in sync with dismissed player's final runs & balls
        const dKey = dismissedPlayer.name.trim().toLowerCase();
        setInningsBatsmenArchive(prev => ({
          ...prev,
          [dKey]: {
            name: dismissedPlayer.name.trim(),
            runs: finalDismissedRuns,
            balls: finalDismissedBalls,
            fours: dismissedPlayer.fours || 0,
            sixes: dismissedPlayer.sixes || 0,
            avatar: dismissedPlayer.avatar || prev[dKey]?.avatar,
          },
        }));
      }

      const isStrikerOut = targetIdx === safeStrikerIdx;
      const updatedWicketBatsmen = batsmen.map((b, i) => {
        // The new batsman takes over the dismissed player's end. Whether that
        // end is on strike depends on whether the batsmen crossed.
        const endsUpOnStrike = crossed
          ? i !== safeStrikerIdx
          : i === safeStrikerIdx;
        if (i === targetIdx) {
          return { name: '', runs: 0, balls: 0, fours: 0, sixes: 0, active: endsUpOnStrike };
        }
        // Surviving batsman: credit the striker for runs run + ball faced.
        const isSurvivingStriker = i === safeStrikerIdx;
        const sRuns = isSurvivingStriker ? b.runs + runsCompleted : b.runs;
        const sBalls = isSurvivingStriker ? b.balls + 1 : b.balls;
        if (isSurvivingStriker && b.name && b.name.trim()) {
          const sKey = b.name.trim().toLowerCase();
          setInningsBatsmenArchive(arc => ({
            ...arc,
            [sKey]: {
              name: b.name.trim(),
              runs: sRuns,
              balls: sBalls,
              fours: b.fours || 0,
              sixes: b.sixes || 0,
              avatar: b.avatar || arc[sKey]?.avatar,
            },
          }));
        }
        return {
          ...b,
          runs: sRuns,
          balls: sBalls,
          active: endsUpOnStrike,
        };
      });
      setBatsmen(updatedWicketBatsmen);

      // Clear the dismissed batsman slot in dropdown inputs so it resets to placeholder
      if (targetIdx === 0) {
        setB1Name('');
        setB1Runs('0');
        setB1Balls('0');
        setB1Fours('0');
        setB1Sixes('0');
      } else if (targetIdx === 1) {
        setB2Name('');
        setB2Runs('0');
        setB2Balls('0');
        setB2Fours('0');
        setB2Sixes('0');
      }

      const currBowlerOvers = typeof bowler.overs === 'number' ? bowler.overs : (parseInt(bowler.overs as any) || 0);
      const currBowlerBalls = typeof bowler.ballsInOver === 'number' ? bowler.ballsInOver : (parseInt(bowler.ballsInOver as any) || 0);
      const currBowlerRuns = typeof bowler.runs === 'number' ? bowler.runs : (parseInt(bowler.runs as any) || 0);
      const currBowlerWkts = typeof bowler.wickets === 'number' ? bowler.wickets : (parseInt(bowler.wickets as any) || 0);
      const currBowlerMaidens = typeof bowler.maidens === 'number' ? bowler.maidens : (parseInt(bowler.maidens as any) || 0);

      const updatedWicketBowlerRuns = currBowlerRuns + runsCompleted;
      const updatedWicketBowlerBalls = currBowlerBalls + 1;
      const updatedWicketBowlerWkts = currBowlerWkts + (creditBowler ? 1 : 0);
      const updatedWicketBowlerObj = {
        ...bowler,
        overs: currBowlerOvers,
        ballsInOver: updatedWicketBowlerBalls,
        runs: updatedWicketBowlerRuns,
        wickets: updatedWicketBowlerWkts,
        maidens: currBowlerMaidens,
      };
      setBowler(updatedWicketBowlerObj);

      const bKey = bowler.name ? bowler.name.trim().toLowerCase() : '';
      const updatedWicketArchive = bKey ? {
        ...inningsBowlersArchive,
        [bKey]: {
          name: bowler.name.trim(),
          overs: bowler.overs !== undefined ? Math.max(currBowlerOvers, inningsBowlersArchive[bKey]?.overs ?? 0) : (inningsBowlersArchive[bKey]?.overs ?? 0),
          ballsInOver: updatedWicketBowlerBalls,
          maidens: bowler.maidens !== undefined ? Math.max(currBowlerMaidens, inningsBowlersArchive[bKey]?.maidens ?? 0) : (inningsBowlersArchive[bKey]?.maidens ?? 0),
          runs: Math.max(updatedWicketBowlerRuns, inningsBowlersArchive[bKey]?.runs ?? 0),
          wickets: Math.max(updatedWicketBowlerWkts, inningsBowlersArchive[bKey]?.wickets ?? 0),
          avatar: bowler.avatar || inningsBowlersArchive[bKey]?.avatar,
        },
      } : inningsBowlersArchive;
      if (bKey) setInningsBowlersArchive(updatedWicketArchive);

      if (newWickets >= 10) {
        // Fix #4: Don't call incrementBallCount after innings ends (avoids double-increment)
        // Fix #10: Pass overs + 1 as final over count (stale 'overs' is pre-increment)
        const updatedBalls = ballsInCurrentOver + 1;
        const updatedOvers = updatedBalls >= 6 ? overs + 1 : overs;
        const finalBalls = updatedBalls >= 6 ? 0 : updatedBalls;
        setBallsInCurrentOver(finalBalls);
        setOvers(updatedOvers);
        setIsInningsOver(true);

        const finalBatsmen = getFullBatsmenScorecard(updatedWicketBatsmen, updatedDismissedList, yetToBatBatsmen);
        const finalBowlers = getFullBowlerScorecard(updatedWicketBowlerObj, otherBowlers, updatedWicketArchive);

        handleInningsEnd(
          currentInnings,
          updatedOvers,
          newTotalRuns,
          newWickets,
          finalBalls,
          finalBatsmen,
          finalBowlers
        );
        return;
      }

      // A run out can be completed on the winning run, so the chase target has
      // to be checked here too — not just on the plain run/extra paths.
      if (currentInnings === 2 && firstInningsScore && runsCompleted > 0) {
        if (isTargetReached(newTotalRuns, firstInningsScore.runs)) {
          const updatedBalls = ballsInCurrentOver + 1;
          const updatedOvers = updatedBalls >= 6 ? overs + 1 : overs;
          const finalBalls = updatedBalls >= 6 ? 0 : updatedBalls;
          setBallsInCurrentOver(finalBalls);
          setOvers(updatedOvers);
          setIsInningsOver(true);
          const finalBatsmen = getFullBatsmenScorecard(updatedWicketBatsmen, updatedDismissedList, yetToBatBatsmen);
          const finalBowlers = getFullBowlerScorecard(updatedWicketBowlerObj, otherBowlers, updatedWicketArchive);
          setTimeout(() => {
            handleInningsEnd(2, updatedOvers, newTotalRuns, newWickets, finalBalls, finalBatsmen, finalBowlers);
          }, 50);
          return;
        }
      }

      // Fix #3: Always prompt new batsman — even on last ball of over
      // (on last ball we defer until AFTER over-end modal, using a flag)
      if (!isLastBallOfOver) {
        setTimeout(() => {
          setShowPlayingXIModal(true);
        }, 150);
      }
      // If last ball of over, new batsman prompt fires from handleOverCompletion after new bowler is selected

      incrementBallCount(
        newTotalRuns,
        newWickets,
        updatedWicketBatsmen,
        updatedWicketBowlerObj,
        otherBowlers,
        updatedWicketArchive,
        updatedDismissedList
      );
    } else if (type === 'extra') {
      handleExtraClick(value as 'WD' | 'NB' | 'BYE' | 'LB');
    }
  };


  const openExtraModal = (extraType: 'WD' | 'NB' | 'BYE' | 'LB') => {
    if (!validatePlayersBeforeScoring()) return;
    if (isInningsOver) return;

    setActiveExtraType(extraType);
    setExtraRunsInput(extraType === 'BYE' || extraType === 'LB' ? 1 : 0);
    setExtraCustomText('');
    setIsExtraCustomMode(false);
    setShowExtraModal(true);
  };

  const handleExtraClick = (extraType: 'WD' | 'NB' | 'BYE' | 'LB') => {
    if (!validatePlayersBeforeScoring()) return;
    if (isInningsOver) return;

    openExtraModal(extraType);
  };

  /**
   * `runCount` is the TOTAL runs added to the team for this delivery, including
   * the 1-run penalty for WD/NB. `runsOffBat` is how much of that total the
   * striker actually hit — only meaningful for a No Ball, where runs off the bat
   * are credited to the batsman while the 1-run penalty stays in extras. On a
   * Wide nothing can come off the bat by law, so it stays 0.
   */
  const recordExtraWithRuns = (
    extraType: 'WD' | 'NB' | 'BYE' | 'LB',
    runCount: number,
    isLegalOverride?: boolean,
    runsOffBat: number = 0
  ) => {
    if (!validatePlayersBeforeScoring()) return;
    // Fix #9: Block recording after innings has ended
    if (isInningsOver) return;

    // Fix #5: Full undo snapshot including squad lists; Fix #F: cap at 20
    const oldState = {
      runs,
      wickets,
      overs,
      ballsInCurrentOver,
      overLog: [...overLog],
      batsmen: batsmen.map(b => ({ ...b })),
      bowler: { ...bowler },
      dismissedBatsmen: dismissedBatsmen.map(db => ({ ...db })),
      yetToBatBatsmen: yetToBatBatsmen.map(y => (typeof y === 'string' ? y : { ...y })),
      otherBowlers: otherBowlers.map(ob => (typeof ob === 'string' ? ob : { ...ob })),
      lastOverBowlerName,
    };
    setHistory(prev => [...prev.slice(-19), oldState]);

    setRuns(prev => prev + runCount);

    const isLegal = isLegalDelivery(extraType, isLegalOverride);

    // Fix #6: Set free-hit flag for NB so the next run delivery doesn't add a ball to batsman stats
    if (extraType === 'NB') {
      setLastWasNoBall(true);
    } else {
      setLastWasNoBall(false);
    }

    const currBowlerOvers = typeof bowler.overs === 'number' ? bowler.overs : (parseInt(bowler.overs as any) || 0);
    const currBowlerBalls = typeof bowler.ballsInOver === 'number' ? bowler.ballsInOver : (parseInt(bowler.ballsInOver as any) || 0);
    const currBowlerRuns = typeof bowler.runs === 'number' ? bowler.runs : (parseInt(bowler.runs as any) || 0);
    const currBowlerWkts = typeof bowler.wickets === 'number' ? bowler.wickets : (parseInt(bowler.wickets as any) || 0);
    const currBowlerMaidens = typeof bowler.maidens === 'number' ? bowler.maidens : (parseInt(bowler.maidens as any) || 0);

    const updatedExtraBowlerRuns = currBowlerRuns + runCount;
    const updatedExtraBowlerBalls = isLegal ? currBowlerBalls + 1 : currBowlerBalls;
    const updatedExtraBowler = {
      ...bowler,
      overs: typeof bowler.overs === 'number' ? bowler.overs : (parseInt(bowler.overs as any) || 0),
      runs: updatedExtraBowlerRuns,
      ballsInOver: updatedExtraBowlerBalls,
      wickets: typeof bowler.wickets === 'number' ? bowler.wickets : (parseInt(bowler.wickets as any) || 0),
      maidens: typeof bowler.maidens === 'number' ? bowler.maidens : (parseInt(bowler.maidens as any) || 0),
    };
    setBowler(updatedExtraBowler);

    const bKey = bowler.name ? bowler.name.trim().toLowerCase() : '';
    const updatedExtraArchive = bKey ? {
      ...inningsBowlersArchive,
      [bKey]: {
        name: bowler.name.trim(),
        overs: bowler.overs !== undefined ? Math.max(currBowlerOvers, inningsBowlersArchive[bKey]?.overs ?? 0) : (inningsBowlersArchive[bKey]?.overs ?? 0),
        ballsInOver: updatedExtraBowlerBalls,
        maidens: bowler.maidens !== undefined ? Math.max(currBowlerMaidens, inningsBowlersArchive[bKey]?.maidens ?? 0) : (inningsBowlersArchive[bKey]?.maidens ?? 0),
        runs: Math.max(updatedExtraBowlerRuns, inningsBowlersArchive[bKey]?.runs ?? 0),
        wickets: Math.max(currBowlerWkts, inningsBowlersArchive[bKey]?.wickets ?? 0),
        avatar: bowler.avatar || inningsBowlersArchive[bKey]?.avatar,
      },
    } : inningsBowlersArchive;
    if (bKey) setInningsBowlersArchive(updatedExtraArchive);

    // Balls faced counts legal deliveries only. Byes and leg byes are legal, so
    // they count; wides and no-balls are not, so they don't — but on a no-ball
    // the striker still keeps whatever came off the bat (the 1-run penalty stays
    // in extras and never reaches a personal score).
    let updatedExtraBatsmen = batsmen;
    if (extraType === 'NB' || extraType === 'BYE' || extraType === 'LB') {
      const ballFaced = countsAsBallFaced(extraType);
      const batRuns = batsmanRunsFromExtra(extraType, runsOffBat);
      updatedExtraBatsmen = batsmen.map(b => {
        if (b.active) {
          const updatedBalls = ballFaced ? b.balls + 1 : b.balls;
          const updatedRuns = b.runs + batRuns;
          const updatedFours = b.fours + (extraType === 'NB' && runsOffBat === 4 ? 1 : 0);
          const updatedSixes = b.sixes + (extraType === 'NB' && runsOffBat === 6 ? 1 : 0);

          if (b.name && b.name.trim()) {
            const sKey = b.name.trim().toLowerCase();
            setInningsBatsmenArchive(arc => ({
              ...arc,
              [sKey]: {
                name: b.name.trim(),
                runs: updatedRuns,
                balls: updatedBalls,
                fours: updatedFours,
                sixes: updatedSixes,
                avatar: b.avatar || arc[sKey]?.avatar,
              },
            }));
          }

          return {
            ...b,
            balls: updatedBalls,
            runs: updatedRuns,
            fours: updatedFours,
            sixes: updatedSixes,
          };
        }
        return b;
      });
      setBatsmen(updatedExtraBatsmen);
    }

    // Strike Rotation for Extras — driven by how many runs the batsmen physically
    // RAN, not the team total, because the WD/NB penalty run is not run by anyone.
    //   BYE/LB      → every run counted was run, so the total is the ran count
    //   WD/NB       → total minus the 1-run penalty
    // Odd ran count means they finished at opposite ends, so strike swaps.
    const ran = ranRuns(extraType, runCount);
    const rotatedExtraBatsmen = shouldRotateStrike(ran)
      ? updatedExtraBatsmen.map(b => ({ ...b, active: !b.active }))
      : updatedExtraBatsmen;
    if (shouldRotateStrike(ran)) {
      setBatsmen(rotatedExtraBatsmen);
    }

    // Fix #E: Pure wide/NB with no extra runs logs as 'WD'/'NB', not '0WD'/'0NB'
    // e.g. 1 run wide → 'WD', 3 run wide → '3WD', pure NB → 'NB'
    const logString = extraLogSymbol(extraType, runCount);
    setOverLog(prev => [...prev, logString]);
    setInningsDeliveries(prev => [...prev, logString]);

    const newTotalRuns = runs + runCount;
    if (currentInnings === 2 && firstInningsScore) {
      if (isTargetReached(newTotalRuns, firstInningsScore.runs)) {
        const updatedBalls = isLegal ? ballsInCurrentOver + 1 : ballsInCurrentOver;
        const updatedOvers = updatedBalls >= 6 ? overs + 1 : overs;
        const finalBalls = updatedBalls >= 6 ? 0 : updatedBalls;
        if (isLegal) {
          setBallsInCurrentOver(finalBalls);
          setOvers(updatedOvers);
        }
        setIsInningsOver(true);
        const finalBatsmen = getFullBatsmenScorecard(rotatedExtraBatsmen, dismissedBatsmen, yetToBatBatsmen);
        const finalBowlers = getFullBowlerScorecard(updatedExtraBowler, otherBowlers, updatedExtraArchive);
        setTimeout(() => {
          handleInningsEnd(2, updatedOvers, newTotalRuns, wickets, finalBalls, finalBatsmen, finalBowlers);
        }, 50);
        return;
      }
    }

    if (isLegal) {
      incrementBallCount(
        newTotalRuns,
        wickets,
        rotatedExtraBatsmen,
        updatedExtraBowler,
        otherBowlers,
        updatedExtraArchive
      );
    }
  };


  const handleInningsEnd = (
    endedInnings: 1 | 2,
    finalOvers: number,
    finalRunsOverride?: number,
    finalWicketsOverride?: number,
    finalBallsOverride?: number,
    batsmenOverride?: any[],
    bowlersOverride?: any[]
  ) => {
    const currentRuns = finalRunsOverride !== undefined ? finalRunsOverride : runs;
    const currentWickets = finalWicketsOverride !== undefined ? finalWicketsOverride : wickets;
    const currentBalls = finalBallsOverride !== undefined ? finalBallsOverride : ballsInCurrentOver;

    if (endedInnings === 1) {
      const sumExtraRuns = (tag: string) => inningsDeliveries.reduce((acc, b) => {
        const m = b.match(/^(\d+)?/ + tag + '$/');
        if (m) return acc + (m[1] !== undefined ? parseInt(m[1]) : 1);
        return acc;
      }, 0);
      const totalWides1 = sumExtraRuns('WD');
      const totalNoBalls1 = sumExtraRuns('NB');
      const totalByes1 = sumExtraRuns('BYE');
      const totalLegByes1 = sumExtraRuns('LB');
      const totalExtras1 = totalWides1 + totalNoBalls1 + totalByes1 + totalLegByes1;

      const firstScore = { runs: currentRuns, wickets: currentWickets, overs: finalOvers, balls: currentBalls };
      setFirstInningsScore(firstScore);
      setFirstInningsDeliveries([...inningsDeliveries]);
      setInningsDeliveries([]);

      const fullBatsmenList = batsmenOverride !== undefined ? batsmenOverride : getFullBatsmenScorecard();
      const fullBowlerList = bowlersOverride !== undefined ? bowlersOverride : getFullBowlerScorecard();

      const activeBats = batsmenOverride !== undefined ? batsmenOverride : batsmen;
      const inn1Bat1 = activeBats.find((b: any) => b.active) || activeBats[0] || fullBatsmenList[0];
      const inn1Bat2 = activeBats.find((b: any) => !b.active) || activeBats[1] || fullBatsmenList[1];
      if (inn1Bat1 && inn1Bat2) {
        setFirstInningsPartnership({
          bat1: { name: inn1Bat1.name || 'Batsman 1', runs: inn1Bat1.runs || 0, balls: inn1Bat1.balls || 0 },
          bat2: { name: inn1Bat2.name || 'Batsman 2', runs: inn1Bat2.runs || 0, balls: inn1Bat2.balls || 0 },
          runs: (inn1Bat1.runs || 0) + (inn1Bat2.runs || 0),
          balls: (inn1Bat1.balls || 0) + (inn1Bat2.balls || 0),
        });
      }

      setFirstInningsScorecard({
        battingTeam: battingTeamName || teamA,
        bowlingTeam: bowlingTeamName || teamB,
        totalRuns: currentRuns,
        totalWickets: currentWickets,
        totalOvers: `${finalOvers}.${currentBalls}`,
        batsmen: fullBatsmenList,
        bowlers: fullBowlerList,
        extras: {
          wides: totalWides1,
          noBalls: totalNoBalls1,
          byes: totalByes1,
          legByes: totalLegByes1,
          total: totalExtras1,
        },
      });
      setCurrentInnings(2);
      setViewingScorecardInnings(2);
      setInningsBatsmenArchive({});
      setInningsBowlersArchive({});

      // Immediately swap teams & position (Batting Team -> Bowling Team, Bowling Team -> Batting Team)
      const newBatting = bowlingTeamName || teamB;
      const newBowling = battingTeamName || teamA;
      setBattingTeamName(newBatting);
      setBowlingTeamName(newBowling);

      // Reset innings scoring values
      setRuns(0);
      setWickets(0);
      setOvers(0);
      setBallsInCurrentOver(0);
      setOverLog([]);
      setHistory([]);
      setLastWasNoBall(false);
      setLastOverBowlerName('');
      // Fix #9: Allow recording balls again in 2nd innings
      setIsInningsOver(false);

      // Reset players
      setBatsmen([]);
      setBowler({ name: '', overs: 0, ballsInOver: 0, maidens: 0, runs: 0, wickets: 0 });
      setDismissedBatsmen([]);

      // Swap squad bench lists while preserving all accumulated players
      const teamAObj = teams.find(t => t.name.toLowerCase() === teamA.toLowerCase());
      const teamBObj = teams.find(t => t.name.toLowerCase() === teamB.toLowerCase());
      const isNewBatTeamA = newBatting.toLowerCase() === teamA.toLowerCase();

      const fullSquadA = (currentPoolA && currentPoolA.length > 0)
        ? currentPoolA
        : (teamASquad.length > 0 ? teamASquad : (teamAObj?.players || []));
      const fullSquadB = (currentPoolB && currentPoolB.length > 0)
        ? currentPoolB
        : (teamBSquad.length > 0 ? teamBSquad : (teamBObj?.players || []));

      setTeamASquad(fullSquadA);
      setTeamBSquad(fullSquadB);

      const nextBatSquad = isNewBatTeamA ? fullSquadA : fullSquadB;
      const nextBowlSquad = isNewBatTeamA ? fullSquadB : fullSquadA;
      if (nextBatSquad) setYetToBatBatsmen(nextBatSquad);
      if (nextBowlSquad) setOtherBowlers(nextBowlSquad);

      const target = firstScore.runs + 1;
      const maxOvers = parseInt(currentTotalOvers || totalOvers) || 20;
      const reqRR = maxOvers > 0 ? ((target) / maxOvers).toFixed(2) : '0.00';
      const firstBatTeam = battingTeamName || teamA;

      // 1. Trigger Happy 1st Innings Toaster notification banner
      showToast(
        'success',
        `🎉 1st Innings Done! ${firstBatTeam} scored ${firstScore.runs}/${firstScore.wickets} (${finalOvers}.${currentBalls} ov). ${newBatting} needs ${target} to win!`
      );

      // 2. Set Happy Celebration Modal data & show modal
      setFirstInningsHappyData({
        battingTeam: firstBatTeam,
        bowlingTeam: newBatting,
        runs: firstScore.runs,
        wickets: firstScore.wickets,
        overs: `${finalOvers}.${currentBalls}`,
        target: target,
        maxOvers: maxOvers,
        reqRunRate: reqRR,
      });
      setShowFirstInningsHappyModal(true);
    } else {
      // Fix #7: Store real 2nd innings score for PDF export
      const sumExtraRuns = (tag: string) => inningsDeliveries.reduce((acc, b) => {
        const m = b.match(/^(\d+)?/ + tag + '$/');
        if (m) return acc + (m[1] !== undefined ? parseInt(m[1]) : 1);
        return acc;
      }, 0);
      const totalWides2 = sumExtraRuns('WD');
      const totalNoBalls2 = sumExtraRuns('NB');
      const totalByes2 = sumExtraRuns('BYE');
      const totalLegByes2 = sumExtraRuns('LB');
      const totalExtras2 = totalWides2 + totalNoBalls2 + totalByes2 + totalLegByes2;

      const secondScore = { runs: currentRuns, wickets: currentWickets, overs: finalOvers, balls: currentBalls };
      setInnings2ScoreRecord(secondScore);

      const inn2Batsmen = batsmenOverride !== undefined ? batsmenOverride : getFullBatsmenScorecard();
      const inn2Bowlers = bowlersOverride !== undefined ? bowlersOverride : getFullBowlerScorecard();
      const inn2BatTeam = battingTeamName || (firstInningsScorecard?.battingTeam === teamA ? teamB : teamA);
      const inn2BowlTeam = bowlingTeamName || (firstInningsScorecard?.battingTeam === teamA ? teamA : teamB);

      const inn2Scorecard = {
        battingTeam: inn2BatTeam,
        bowlingTeam: inn2BowlTeam,
        totalRuns: currentRuns,
        totalWickets: currentWickets,
        totalOvers: `${finalOvers}.${currentBalls}`,
        batsmen: inn2Batsmen,
        bowlers: inn2Bowlers,
        extras: {
          wides: totalWides2,
          noBalls: totalNoBalls2,
          byes: totalByes2,
          legByes: totalLegByes2,
          total: totalExtras2,
        },
      };
      setSecondInningsScorecard(inn2Scorecard);

      // 2nd Innings Completed
      const target = (firstInningsScore?.runs || 0) + 1;
      let winnerName = '';
      let winMargin = '';

      if (currentRuns >= target) {
        winnerName = battingTeamName;
        winMargin = `Won by ${10 - currentWickets} wickets`;
      } else if (currentRuns < target - 1) {
        winnerName = bowlingTeamName;
        winMargin = `Won by ${(firstInningsScore?.runs || 0) - currentRuns} runs`;
      } else {
        winnerName = 'Match Tied';
        winMargin = '🤝 Match Tied!';
      }

      // Automatically determine Man of the Match (MOTM) from top performing player
      let motmName = 'Match Star';
      let motmStat = 'Outstanding Performance';

      const allBatsmen = [...batsmen, ...dismissedBatsmen].filter(b => b && b.name && b.name.trim());
      allBatsmen.sort((a, b) => (b.runs || 0) - (a.runs || 0));

      if (allBatsmen.length > 0 && (allBatsmen[0].runs || 0) > 0) {
        motmName = allBatsmen[0].name;
        motmStat = `${allBatsmen[0].runs} runs off ${allBatsmen[0].balls || 0} balls`;
      } else if (bowler && bowler.name) {
        motmName = bowler.name;
        motmStat = `${bowler.wickets} wickets (${bowler.runs} runs)`;
      }

      const firstTeamName = firstInningsScorecard?.battingTeam || (battingTeamName === teamA ? teamB : teamA);
      const secondTeamName = battingTeamName || (firstTeamName === teamA ? teamB : teamA);

      const victoryObj = {
        winnerName,
        winMargin,
        target,
        firstInningsTeam: firstTeamName,
        firstInningsScore: `${firstInningsScore?.runs || 0}/${firstInningsScore?.wickets || 0}`,
        firstInningsOvers: `${firstInningsScore?.overs || 0}.${firstInningsScore?.balls || 0}`,
        secondInningsTeam: secondTeamName,
        secondInningsScore: `${currentRuns}/${currentWickets}`,
        secondInningsOvers: `${finalOvers}.${currentBalls}`,
        motmName,
        motmStat,
      };

      setMatchVictoryData(victoryObj);
      setShowVictoryModal(true);

      // 💾 Persist completed match to Own Board history
      const matchRecord = {
        id: matchId || `match-${Date.now()}`,
        completedAt: new Date().toISOString(),
        teamA: teamA || 'Team A',
        teamB: teamB || 'Team B',
        innings1: {
          team: victoryObj.firstInningsTeam,
          score: victoryObj.firstInningsScore,
          overs: victoryObj.firstInningsOvers,
          batsmen: (firstInningsScorecard?.batsmen || []).map(b => ({
            name: b.name,
            avatarUrl: undefined,
            runs: b.runs || 0,
            balls: b.balls || 0,
            fours: b.fours || 0,
            sixes: b.sixes || 0,
            isOut: b.status === 'out' || !!b.dismissal,
            status: b.status || 'not out',
            strikeRate: b.balls > 0 ? parseFloat(((b.runs / b.balls) * 100).toFixed(1)) : 0,
          })),
          bowlers: (firstInningsScorecard?.bowlers || []).map(b => {
            const ovs = typeof b.overs === 'number' ? b.overs + (b.ballsInOver || 0) / 6 : parseFloat(b.overs || '0');
            return {
              name: b.name,
              avatarUrl: undefined,
              overs: ovs,
              runs: b.runs || 0,
              wickets: b.wickets || 0,
              maidens: b.maidens || 0,
              economy: ovs > 0 ? parseFloat((b.runs / ovs).toFixed(2)) : 0,
              dots: 0,
            };
          }),
        },
        innings2: {
          team: victoryObj.secondInningsTeam,
          score: victoryObj.secondInningsScore,
          overs: victoryObj.secondInningsOvers,
          batsmen: inn2Batsmen.map(b => ({
            name: b.name,
            avatarUrl: undefined,
            runs: b.runs || 0,
            balls: b.balls || 0,
            fours: b.fours || 0,
            sixes: b.sixes || 0,
            isOut: b.status === 'out' || !!b.dismissal,
            status: b.status || 'not out',
            strikeRate: b.balls > 0 ? parseFloat(((b.runs / b.balls) * 100).toFixed(1)) : 0,
          })),
          bowlers: inn2Bowlers.map(b => {
            const ovs = typeof b.overs === 'number' ? b.overs + (b.ballsInOver || 0) / 6 : parseFloat(b.overs || '0');
            return {
              name: b.name,
              avatarUrl: undefined,
              overs: ovs,
              runs: b.runs || 0,
              wickets: b.wickets || 0,
              maidens: b.maidens || 0,
              economy: ovs > 0 ? parseFloat((b.runs / ovs).toFixed(2)) : 0,
              dots: 0,
            };
          }),
        },
        winner: victoryObj.winnerName,
        winMargin: victoryObj.winMargin,
        motmName: victoryObj.motmName,
        motmStat: victoryObj.motmStat,
      };
      saveMatchToOwnBoard(matchRecord).catch(() => {});
    }
  };

  const resetMatchScoringState = () => {
    setRuns(0);
    setWickets(0);
    setOvers(0);
    setBallsInCurrentOver(0);
    setOverLog([]);
    setHistory([]);
    setLastOverBowlerName('');
    setCurrentInnings(1);
    setViewingScorecardInnings(1);
    setFirstInningsScore(null);
    setFirstInningsScorecard(null);
    setFirstInningsPartnership(null);
    setSecondInningsScorecard(null);
    setInnings2ScoreRecord(null);
    setIsInningsOver(false);

    const initialTossState = getInitialTossState();
    setBattingTeamName(initialTossState.batTeam);
    setBowlingTeamName(initialTossState.bowlTeam);
    setTossText(initialTossState.summary);
    setRematchTossWinner(initialTossState.winnerName);
    setRematchTossDecision(initialTossState.decisionType);

    setBatsmen([]);
    setBowler({ name: '', overs: 0, ballsInOver: 0, maidens: 0, runs: 0, wickets: 0 });
    setDismissedBatsmen([]);
    setInningsBatsmenArchive({});
    setInningsBowlersArchive({});
    setMatchVictoryData(null);
    setShowVictoryModal(false);
    setShowRematchSquadChoiceModal(false);
  };

  const handleRematchSameSquad = () => {
    setIsRematchDrafting(false);
    resetMatchScoringState();
    setShowRematchSquadChoiceModal(false);
    setShowVictoryModal(false);
    setRematchTossWinner(teamA);
    setRematchTossDecision('Bat');
    setCoinSide(null);
    setShowRematchTossModal(true);
  };

  const handleRematchNewSquad = () => {
    setIsRematchDrafting(true);
    resetMatchScoringState();
    setShowRematchSquadChoiceModal(false);
    setShowVictoryModal(false);
    setShowPlayingXIModal(true);
  };

  const confirmRematchToss = () => {
    if (isMatchUnderway) {
      Alert.alert('Match Underway 🔒', 'Toss cannot be altered once the match is in progress.');
      setShowRematchTossModal(false);
      return;
    }
    // Re-assign batting & bowling teams based on toss winner & selection
    const isWinnerTeamA = rematchTossWinner.trim().toLowerCase() === teamA.trim().toLowerCase();
    let newBatting = teamA;
    let newBowling = teamB;

    if (isWinnerTeamA) {
      if (rematchTossDecision === 'Bat') {
        newBatting = teamA;
        newBowling = teamB;
      } else {
        newBatting = teamB;
        newBowling = teamA;
      }
    } else {
      if (rematchTossDecision === 'Bat') {
        newBatting = teamB;
        newBowling = teamA;
      } else {
        newBatting = teamA;
        newBowling = teamB;
      }
    }

    setBattingTeamName(newBatting);
    setBowlingTeamName(newBowling);

    const tossSummary = `${rematchTossWinner} won toss & select ${rematchTossDecision === 'Bat' ? 'bat' : 'bowl'}`;
    setTossText(tossSummary);

    const battingObj = teams.find(t => t.name.toLowerCase() === newBatting.toLowerCase());
    const bowlingObj = teams.find(t => t.name.toLowerCase() === newBowling.toLowerCase());
    const rematchBatSquad = squadFor(newBatting, battingObj?.players);
    const rematchBowlSquad = squadFor(newBowling, bowlingObj?.players);
    if (rematchBatSquad) setYetToBatBatsmen(rematchBatSquad);
    if (rematchBowlSquad) setOtherBowlers(rematchBowlSquad);

    setShowRematchTossModal(false);
    openEditPlayersModal();
  };

  /**
   * A maiden is an over with no runs *charged to the bowler*. Byes and leg byes
   * are not charged, so they do not spoil one — but wides and no-balls are, so
   * they do. Reads the ref because the 6th ball is not yet in the state closure.
   */
  const detectMaidenOver = (log: string[]): boolean => {
    const bowlerWasCharged = log.some(b => b.includes('WD') || b.includes('NB'));
    if (bowlerWasCharged) return false;
    const offBat = log.filter(b => !/WD|NB|BYE|LB/.test(b));
    return offBat.length > 0 && offBat.every(b => b === '0' || b === 'W');
  };

  const handleOverCompletion = (
    explicitRuns?: number,
    explicitWickets?: number,
    explicitBatsmen?: any[],
    explicitBowler?: any,
    explicitOtherBowlers?: any[],
    explicitArchive?: Record<string, any>,
    explicitDismissed?: any[]
  ) => {
    const currentRuns = explicitRuns !== undefined ? explicitRuns : runs;
    const currentWickets = explicitWickets !== undefined ? explicitWickets : wickets;
    const currentBatsmen = explicitBatsmen !== undefined ? explicitBatsmen : batsmen;
    const currentBowler = explicitBowler !== undefined ? explicitBowler : bowler;
    const currentOtherBowlers = explicitOtherBowlers !== undefined ? explicitOtherBowlers : otherBowlers;
    const currentArchive = explicitArchive !== undefined ? explicitArchive : inningsBowlersArchive;
    const currentDismissed = explicitDismissed !== undefined ? explicitDismissed : dismissedBatsmen;

    const nextOvers = overs + 1;
    const maxOvers = parseInt(currentTotalOvers) || 20;
    const finalOverLog = overLogRef.current;

    // 2. Auto-detect maiden over from the true final over log.
    const isMaiden = detectMaidenOver(finalOverLog);

    const completedBowlerName = currentBowler?.name ? currentBowler.name.trim() : '';
    const uKey = completedBowlerName.toLowerCase();
    const updatedFinishedBowler = completedBowlerName ? {
      ...currentBowler,
      name: completedBowlerName,
      overs: (currentBowler.overs || 0) + 1,
      ballsInOver: 0,
      maidens: isMaiden ? (currentBowler.maidens || 0) + 1 : (currentBowler.maidens || 0),
    } : null;

    const updatedOtherBowlers = completedBowlerName ? [
      ...(currentOtherBowlers || []).filter((b: any) => {
        const n = typeof b === 'string' ? b : b?.name;
        return n && n.trim().toLowerCase() !== uKey;
      }),
      updatedFinishedBowler,
    ] : currentOtherBowlers;

    const updatedArchive = completedBowlerName ? {
      ...currentArchive,
      [uKey]: {
        ...updatedFinishedBowler,
        runs: Math.max(updatedFinishedBowler?.runs || 0, currentArchive[uKey]?.runs ?? 0),
        wickets: Math.max(updatedFinishedBowler?.wickets || 0, currentArchive[uKey]?.wickets ?? 0),
      },
    } : currentArchive;

    // The over that ends an innings is still a completed over: credit it to the
    // bowler (and its maiden) before the innings-end early return, otherwise the
    // last over of every innings silently vanishes from the bowling figures.
    if (nextOvers >= maxOvers) {
      setBowler(updatedFinishedBowler || { name: '', overs: 0, ballsInOver: 0, maidens: 0, runs: 0, wickets: 0 });
      setOvers(nextOvers);
      setBallsInCurrentOver(0);
      setIsInningsOver(true);

      const finalBatsmen = getFullBatsmenScorecard(currentBatsmen, currentDismissed, yetToBatBatsmen);
      const finalBowlers = getFullBowlerScorecard(updatedFinishedBowler, updatedOtherBowlers, updatedArchive);

      handleInningsEnd(currentInnings, nextOvers, currentRuns, currentWickets, 0, finalBatsmen, finalBowlers);
      return;
    }

    // 1. Save old state for undo history (Fix #5: include squad lists; Fix #F: cap at 20)
    const oldState = {
      runs: currentRuns,
      wickets: currentWickets,
      overs,
      ballsInCurrentOver: 6,
      overLog: [...finalOverLog],
      batsmen: currentBatsmen.map((b: any) => ({ ...b })),
      bowler: { ...currentBowler },
      otherBowlers: currentOtherBowlers.map((ob: any) => (typeof ob === 'string' ? ob : { ...ob })),
      dismissedBatsmen: currentDismissed.map((db: any) => ({ ...db })),
      yetToBatBatsmen: yetToBatBatsmen.map((y: any) => (typeof y === 'string' ? y : { ...y })),
      lastOverBowlerName,
    };
    setHistory(prev => [...prev.slice(-19), oldState]);

    // 3. Swap strike between batsmen at the end of the over
    setBatsmen(currentBatsmen.map((b: any) => ({ ...b, active: !b.active })));

    // 4. Increment overs count
    setOvers(nextOvers);
    setBallsInCurrentOver(0);
    setOverLog([]);
    setLastWasNoBall(false);

    // 5. Update completed bowler records & reset current bowler so next bowler must be chosen
    if (completedBowlerName && updatedFinishedBowler) {
      setLastOverBowlerName(completedBowlerName);
      setOtherBowlers(updatedOtherBowlers);
      setInningsBowlersArchive(updatedArchive);
    }

    setBowler({ name: '', overs: 0, ballsInOver: 0, maidens: 0, runs: 0, wickets: 0 });
    setBowlName('');

    // 6. Always show unified squad modal on over completion
    setShowPlayingXIModal(true);
  };

  const incrementBallCount = (
    explicitRuns?: number,
    explicitWickets?: number,
    explicitBatsmen?: any[],
    explicitBowler?: any,
    explicitOtherBowlers?: any[],
    explicitArchive?: Record<string, any>,
    explicitDismissed?: any[]
  ) => {
    setBallsInCurrentOver(prev => {
      const next = prev + 1;
      if (next >= 6) {
        handleOverCompletion(
          explicitRuns,
          explicitWickets,
          explicitBatsmen,
          explicitBowler,
          explicitOtherBowlers,
          explicitArchive,
          explicitDismissed
        );
        return 0;
      }
      return next;
    });
  };

  const handleCompleteOver = () => {
    handleOverCompletion();
  };


  const [isSyncing, setIsSyncing] = useState(false);

  const handleExportPDF = async () => {
    try {
      // Calculate current innings extras
      const sumExtraRuns = (tag: string) => inningsDeliveries.reduce((acc, b) => {
        const m = b.match(/^(\d+)?/ + tag + '$/');
        if (m) return acc + (m[1] !== undefined ? parseInt(m[1]) : 1);
        return acc;
      }, 0);
      const currWides = sumExtraRuns('WD');
      const currNoBalls = sumExtraRuns('NB');
      const currByes = sumExtraRuns('BYE');
      const currLegByes = sumExtraRuns('LB');
      const currExtrasTotal = currWides + currNoBalls + currByes + currLegByes;

      const currentBowlers = getFullBowlerScorecard().map(b => {
        const ovs = (b.overs || 0) + (b.ballsInOver || 0) / 6;
        return {
          name: b.name || 'Bowler',
          overs: ovs,
          maidens: b.maidens || 0,
          runs: b.runs || 0,
          wickets: b.wickets || 0,
          economy: ovs > 0 ? parseFloat((b.runs / ovs).toFixed(2)) : 0,
        };
      });

      const currentBatsmen = getFullBatsmenScorecard().map(b => ({
        name: b.name || 'Player',
        runs: b.runs || 0,
        balls: b.balls || 0,
        fours: b.fours || 0,
        sixes: b.sixes || 0,
        status: b.status || (b.active ? 'not out' : 'out'),
        strikeRate: b.balls > 0 ? parseFloat(((b.runs / b.balls) * 100).toFixed(1)) : '0.0',
      }));

      // Determine Innings 1 Data
      let inn1Data: any;
      if (firstInningsScorecard) {
        const inn1OvsParts = (firstInningsScorecard.totalOvers || '0.0').split('.');
        const inn1Ovs = parseInt(inn1OvsParts[0] || '0', 10);
        const inn1Balls = parseInt(inn1OvsParts[1] || '0', 10);
        inn1Data = {
          teamName: firstInningsScorecard.battingTeam,
          bowlingTeamName: firstInningsScorecard.bowlingTeam,
          score: firstInningsScorecard.totalRuns,
          wickets: firstInningsScorecard.totalWickets,
          overs: inn1Ovs,
          balls: inn1Balls,
          runRate: parseFloat((firstInningsScorecard.totalRuns / (inn1Ovs + inn1Balls / 6 || 1)).toFixed(2)),
          extras: firstInningsScorecard.extras || {
            wides: 0,
            noBalls: 0,
            byes: 0,
            legByes: 0,
            total: 0,
          },
          batsmen: (firstInningsScorecard.batsmen || []).map(b => ({
            name: b.name || 'Player',
            runs: b.runs || 0,
            balls: b.balls || 0,
            fours: b.fours || 0,
            sixes: b.sixes || 0,
            status: b.status || 'out',
            strikeRate: b.balls > 0 ? parseFloat(((b.runs / b.balls) * 100).toFixed(1)) : '0.0',
          })),
          bowlers: (firstInningsScorecard.bowlers || []).map(b => {
            const ovs = typeof b.overs === 'number' ? b.overs + (b.ballsInOver || 0) / 6 : parseFloat(b.overs || '0');
            return {
              name: b.name || 'Bowler',
              overs: ovs,
              maidens: b.maidens || 0,
              runs: b.runs || 0,
              wickets: b.wickets || 0,
              economy: ovs > 0 ? parseFloat((b.runs / ovs).toFixed(2)) : 0,
            };
          }),
        };
      } else {
        // Currently in Innings 1
        inn1Data = {
          teamName: battingTeamName || teamA,
          bowlingTeamName: bowlingTeamName || teamB,
          score: runs,
          wickets: wickets,
          overs: overs,
          balls: ballsInCurrentOver,
          runRate: parseFloat((runs / (overs + ballsInCurrentOver / 6 || 1)).toFixed(2)),
          extras: {
            wides: currWides,
            noBalls: currNoBalls,
            byes: currByes,
            legByes: currLegByes,
            total: currExtrasTotal,
          },
          batsmen: currentBatsmen,
          bowlers: currentBowlers.length > 0 ? currentBowlers : [{
            name: bowler.name || 'Bowler',
            overs: (bowler.overs || 0) + (bowler.ballsInOver || 0) / 6,
            maidens: bowler.maidens || 0,
            runs: bowler.runs || 0,
            wickets: bowler.wickets || 0,
            economy: 0,
          }],
        };
      }

      // Determine Innings 2 Data (if completed or in progress)
      let inn2Data: any = null;
      if (secondInningsScorecard) {
        const inn2OvsParts = (secondInningsScorecard.totalOvers || '0.0').split('.');
        const inn2Ovs = parseInt(inn2OvsParts[0] || '0', 10);
        const inn2Balls = parseInt(inn2OvsParts[1] || '0', 10);
        inn2Data = {
          teamName: secondInningsScorecard.battingTeam,
          bowlingTeamName: secondInningsScorecard.bowlingTeam,
          score: secondInningsScorecard.totalRuns,
          wickets: secondInningsScorecard.totalWickets,
          overs: inn2Ovs,
          balls: inn2Balls,
          runRate: parseFloat((secondInningsScorecard.totalRuns / (inn2Ovs + inn2Balls / 6 || 1)).toFixed(2)),
          extras: secondInningsScorecard.extras || {
            wides: 0,
            noBalls: 0,
            byes: 0,
            legByes: 0,
            total: 0,
          },
          batsmen: (secondInningsScorecard.batsmen || []).map(b => ({
            name: b.name || 'Player',
            runs: b.runs || 0,
            balls: b.balls || 0,
            fours: b.fours || 0,
            sixes: b.sixes || 0,
            status: b.status || (b.active ? 'not out' : 'out'),
            strikeRate: b.balls > 0 ? parseFloat(((b.runs / b.balls) * 100).toFixed(1)) : '0.0',
          })),
          bowlers: (secondInningsScorecard.bowlers || []).map(b => {
            const ovs = typeof b.overs === 'number' ? b.overs + (b.ballsInOver || 0) / 6 : parseFloat(b.overs || '0');
            return {
              name: b.name || 'Bowler',
              overs: ovs,
              maidens: b.maidens || 0,
              runs: b.runs || 0,
              wickets: b.wickets || 0,
              economy: ovs > 0 ? parseFloat((b.runs / ovs).toFixed(2)) : 0,
            };
          }),
        };
      } else if (currentInnings === 2 || firstInningsScore !== null) {
        // Currently in Innings 2 in progress
        inn2Data = {
          teamName: battingTeamName || teamB,
          bowlingTeamName: bowlingTeamName || teamA,
          score: runs,
          wickets: wickets,
          overs: overs,
          balls: ballsInCurrentOver,
          runRate: parseFloat((runs / (overs + ballsInCurrentOver / 6 || 1)).toFixed(2)),
          extras: {
            wides: currWides,
            noBalls: currNoBalls,
            byes: currByes,
            legByes: currLegByes,
            total: currExtrasTotal,
          },
          batsmen: currentBatsmen,
          bowlers: currentBowlers.length > 0 ? currentBowlers : [{
            name: bowler.name || 'Bowler',
            overs: (bowler.overs || 0) + (bowler.ballsInOver || 0) / 6,
            maidens: bowler.maidens || 0,
            runs: bowler.runs || 0,
            wickets: bowler.wickets || 0,
            economy: 0,
          }],
        };
      }

      await exportScoreSheetPDF({
        matchId: matchId || `MTH-${Date.now().toString().slice(-6)}`,
        sport: `Cricket Match (${currentTotalOvers || totalOvers || '8'} Overs)`,
        venueName: 'Emerald Green Arena Pitch 1',
        venueAddress: 'Trichy Bypass Road, Tiruchirappalli',
        contactNumber: '+91 98765 43210',
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        innings1: inn1Data,
        innings2: inn2Data || undefined,
        winner: matchVictoryData?.winnerName,
        winMargin: matchVictoryData?.winMargin,
        motmName: matchVictoryData?.motmName,
        motmStat: matchVictoryData?.motmStat,
        target: (firstInningsScore?.runs || 0) + 1,
        tossWinner: teamA,
        tossDecision: 'Bat',
      });
    } catch (err: any) {
      Alert.alert('PDF Export Error', err.message || 'Could not export score sheet.');
    }
  };

  const handleEndMatch = () => {
    if (matchId) {
      const rr = parseFloat((runs / (overs + ballsInCurrentOver / 6 || 1)).toFixed(2));
      matchApi.completeMatch(matchId, {
        homeScore: runs,
        awayScore: 0,
        events: [],
        cricketData: [
          {
            runs,
            wickets,
            overs,
            balls: ballsInCurrentOver,
            runRate: rr,
            batsmen: batsmen.map(b => ({
              playerName: b.name,
              runs: b.runs,
              balls: b.balls,
              fours: b.fours,
              sixes: b.sixes,
              isOut: !b.active,
              dismissalType: 'Caught',
            })),
            bowlers: [
              {
                playerName: bowler.name,
                overs: (bowler.overs || 0) + (bowler.ballsInOver || 0) / 6,
                maidens: bowler.maidens || 0,
                runs: bowler.runs || 0,
                wickets: bowler.wickets || 0,
              }
            ]
          }
        ],
      }).catch(err => console.warn('Sync on end match:', err));
    }
    setShowEndMatchModal(true);
  };

  const handleDropMatch = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Drop Match: Are you sure you want to abandon/cancel this match? Current scores will not be saved.')) {
        router.replace('/(tabs)');
      }
    } else {
      Alert.alert(
        'Drop Match',
        'Are you sure you want to abandon/cancel this match? Current scores will not be saved.',
        [
          { text: 'Keep Playing', style: 'cancel' },
          { text: 'Drop Match', style: 'destructive', onPress: () => router.replace('/(tabs)') },
        ]
      );
    }
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setRuns(previous.runs);
    setWickets(previous.wickets);
    setOvers(previous.overs);
    setBallsInCurrentOver(previous.ballsInCurrentOver);
    setOverLog(previous.overLog);
    if (previous.inningsDeliveries !== undefined) setInningsDeliveries(previous.inningsDeliveries);
    setBatsmen(previous.batsmen);
    setBowler(previous.bowler);
    // Fix #5: Restore squad lists so dismissals and bench are fully reversed
    if (previous.dismissedBatsmen !== undefined) setDismissedBatsmen(previous.dismissedBatsmen);
    if (previous.yetToBatBatsmen !== undefined) setYetToBatBatsmen(previous.yetToBatBatsmen);
    if (previous.otherBowlers !== undefined) setOtherBowlers(previous.otherBowlers);
    if (previous.lastOverBowlerName !== undefined) setLastOverBowlerName(previous.lastOverBowlerName);
    // Clear free-hit flag on undo
    setLastWasNoBall(false);
    // An innings that ended on the ball being undone must reopen, otherwise the
    // scoreboard stays permanently locked (recordBall early-returns on
    // isInningsOver) with no way back — the 2nd innings keeps its history, so
    // this is reachable after an accidental match-ending ball.
    setIsInningsOver(false);
    setHistory(prev => prev.slice(0, -1));
  };


  const toggleActiveBatsman = (idx: number) => {
    setBatsmen(prev => prev.map((b, i) => ({ ...b, active: i === idx })));
  };

  return (
    <View style={styles.container}>
      {/* ── Fixed Top Section: Live Scorecard Banner & Sub-Tab Bar ── */}
      <View style={{ backgroundColor: theme.background, zIndex: 10 }}>
        {/* Live Scorecard Banner */}
        <View style={styles.bannerWrapper}>
          <View style={[styles.scoreBanner, { backgroundColor: theme.primaryContainer }]}>
            {/* Cricket player watermark background */}
            <Image
              source={require('@/assets/images/illustrations/cricket_player.png')}
              style={styles.bannerWatermark}
              contentFit="contain"
            />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <ThemedText type="labelMd" style={{ color: '#ffffff', fontWeight: '500' }}>
                  {currentInnings === 1 ? '1st Innings' : '2nd Innings'}
                </ThemedText>

                {/* 🪙 Toss / Coin Re-Flip Action Chip (Locked once match starts) */}
                <Pressable
                  onPress={() => {
                    if (isMatchUnderway) {
                      Alert.alert(
                        'Toss Decision Locked 🔒',
                        `Toss was decided (${tossText}). In accordance with match rules, the toss cannot be altered once the match has commenced.`,
                        [{ text: 'OK' }]
                      );
                      return;
                    }
                    setShowRematchTossModal(true);
                  }}
                  style={({ pressed }) => [
                    {
                      backgroundColor: isMatchUnderway ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.25)',
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: isMatchUnderway ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.4)',
                    },
                    pressed && { opacity: 0.8 }
                  ]}
                >
                  <ThemedText style={{ fontSize: 10, color: '#ffffff', fontFamily: 'Sora_500Medium' }}>
                    {isMatchUnderway ? '🔒 Toss' : '🪙 Toss'}
                  </ThemedText>
                </Pressable>

                {/* ⚙️ Rules Verification Action Chip (Locked once match starts) */}
                <Pressable
                  onPress={() => setShowPreRulesModal(true)}
                  style={({ pressed }) => [
                    {
                      backgroundColor: isMatchUnderway ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.25)',
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: isMatchUnderway ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.4)',
                    },
                    pressed && { opacity: 0.8 }
                  ]}
                >
                  <ThemedText style={{ fontSize: 10, color: '#ffffff', fontFamily: 'Sora_500Medium' }}>
                    {isMatchUnderway ? '🔒 Rules' : '⚙️ Rules'}
                  </ThemedText>
                </Pressable>
              </View>
            </View>

            <View style={styles.bannerRow}>
              <View style={styles.bannerLeftCol}>
                <ThemedText type="headlineLg" style={styles.teamTitle} numberOfLines={1}>
                  {battingTeamName || teamA}
                </ThemedText>
                <ThemedText type="bodyMd" style={{ color: theme.onPrimaryContainer, fontSize: 11.5, fontFamily: 'Sora_500Medium', marginTop: 1 }} numberOfLines={1}>
                  vs {bowlingTeamName || teamB}
                </ThemedText>
                <ThemedText style={{ color: 'rgba(255, 255, 255, 0.90)', fontSize: 10.5, fontFamily: 'Sora_500Medium', marginTop: 6 }} numberOfLines={1}>
                  {tossText}
                </ThemedText>
              </View>

              <View style={styles.bannerRightCol}>
                <ThemedText type="displayLg" style={[styles.scoreText, { color: '#ffffff' }]}>
                  {runs}/{wickets}
                </ThemedText>
                <ThemedText type="headlineSm" style={styles.oversText}>
                  {overs}.{ballsInCurrentOver} / {currentTotalOvers} Overs
                </ThemedText>
              </View>
            </View>

            <View style={styles.bannerStatsRow}>
              <View style={styles.bannerStatItem}>
                <ThemedText type="labelSm" style={{ color: theme.onPrimaryContainer }}>RUN RATE</ThemedText>
                <ThemedText type="headlineSm" style={{ color: '#ffffff', fontFamily: 'Sora_500Medium' }}>
                  {runRate.toFixed(2)}
                </ThemedText>
              </View>
              <View style={styles.bannerStatItem}>
                <ThemedText type="labelSm" style={{ color: theme.onPrimaryContainer }}>
                  {currentInnings === 2 ? 'REQ RR' : 'PROJECTED'}
                </ThemedText>
                <ThemedText type="headlineSm" style={{ color: '#ffffff', fontFamily: 'Sora_500Medium' }}>
                  {currentInnings === 2 ? reqRunRate : (totalBalls > 0 ? Math.round(projectedScore) : 0)}
                </ThemedText>
              </View>
              <View style={styles.bannerStatItem}>
                <ThemedText type="labelSm" style={{ color: theme.onPrimaryContainer }}>EXTRAS</ThemedText>
                <ThemedText type="headlineSm" style={{ color: '#ffffff', fontFamily: 'Sora_500Medium' }}>
                  {totalExtrasCount}
                </ThemedText>
              </View>
            </View>

            {/* 2nd Innings Target Equation Bar */}
            {currentInnings === 2 && (
              <View style={{ marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.25)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                <ThemedText style={{ color: '#ffffff', fontSize: 12, fontFamily: 'Sora_500Medium' }}>
                  🎯 Target: <ThemedText style={{ fontSize: 14, fontFamily: 'Sora_500Medium', color: '#FDE047' }}>{targetRuns}</ThemedText>
                </ThemedText>
                {runs >= targetRuns ? (
                  <View style={{ backgroundColor: 'rgba(253, 224, 71, 0.25)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                    <ThemedText style={{ color: '#FDE047', fontSize: 11, fontFamily: 'Sora_500Medium' }}>
                      🎉 Target Achieved! {battingTeamName} Won!
                    </ThemedText>
                  </View>
                ) : (
                  <ThemedText style={{ color: 'rgba(255, 255, 255, 0.95)', fontSize: 11, fontFamily: 'Sora_500Medium' }}>
                    Need <ThemedText style={{ fontWeight: '500', color: '#ffffff' }}>{runsNeeded}</ThemedText> runs off <ThemedText style={{ fontWeight: '500', color: '#ffffff' }}>{ballsRemaining}</ThemedText> balls
                  </ThemedText>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Sub-tab Navigation */}
        <View style={styles.subTabBar}>
          <Pressable
            onPress={() => setActiveSubTab('live')}
            style={[styles.subTabItem, activeSubTab === 'live' && { borderBottomColor: theme.primary }]}
          >
            <Ionicons name="flash-outline" size={14} color={activeSubTab === 'live' ? theme.primary : theme.textSecondary} />
            <ThemedText style={[styles.subTabText, { color: activeSubTab === 'live' ? theme.primary : theme.textSecondary }, activeSubTab === 'live' && { fontFamily: 'Sora_500Medium' }]}>
              Live Scoring
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setActiveSubTab('scorecard')}
            style={[styles.subTabItem, activeSubTab === 'scorecard' && { borderBottomColor: theme.primary }]}
          >
            <Ionicons name="list-outline" size={14} color={activeSubTab === 'scorecard' ? theme.primary : theme.textSecondary} />
            <ThemedText style={[styles.subTabText, { color: activeSubTab === 'scorecard' ? theme.primary : theme.textSecondary }, activeSubTab === 'scorecard' && { fontFamily: 'Sora_500Medium' }]}>
              Scorecard
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setActiveSubTab('stats')}
            style={[styles.subTabItem, activeSubTab === 'stats' && { borderBottomColor: theme.primary }]}
          >
            <Ionicons name="bar-chart-outline" size={14} color={activeSubTab === 'stats' ? theme.primary : theme.textSecondary} />
            <ThemedText style={[styles.subTabText, { color: activeSubTab === 'stats' ? theme.primary : theme.textSecondary }, activeSubTab === 'stats' && { fontFamily: 'Sora_500Medium' }]}>
              Statistics
            </ThemedText>
          </Pressable>
        </View>
      </View>

      {/* ── Scrollable Tab Content ── */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, activeSubTab === 'scorecard' && { paddingBottom: 100 }]}>
        {activeSubTab === 'live' && (
          <>
            <View style={styles.section}>
              {/* ── Current Over Log & Embedded Compact Ball by Ball Keypad ── */}
              <View style={[styles.card, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', padding: 16, borderRadius: BorderRadius.xl, ...Shadows.level2 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="baseball-outline" size={16} color={theme.primary} />
                    <ThemedText style={{ fontSize: 14, fontFamily: 'Sora_500Medium', color: theme.text }}>
                      Current Over Log
                    </ThemedText>
                  </View>
                  <Pressable
                    onPress={() => setShowScoringPad(!showScoringPad)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: showScoringPad ? theme.primary : theme.primary + '15',
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: BorderRadius.full,
                      gap: 4,
                    }}
                  >
                    <Ionicons name={showScoringPad ? "chevron-up" : "add"} size={14} color={showScoringPad ? '#ffffff' : theme.primary} />
                    <ThemedText style={{ color: showScoringPad ? '#ffffff' : theme.primary, fontSize: 11, fontFamily: 'Sora_500Medium' }}>
                      {showScoringPad ? 'Hide Keypad' : 'Ball by Ball'}
                    </ThemedText>
                  </Pressable>
                </View>

                {/* Over log balls */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.logBallsRow}
                >
                  {overLog.map((ball, idx) => {
                    let bgColor: string = theme.primary;
                    let textColor: string = '#ffffff';
                    let borderWidth = 0;
                    let borderColor = 'transparent';

                    const isWicket = ball === 'W';
                    const isDot = ball === '0';
                    const isFour = ball === '4';
                    const isSix = ball === '6';

                    if (isWicket) {
                      bgColor = '#EF4444';
                      textColor = '#ffffff';
                    } else if (isDot) {
                      bgColor = theme.surfaceLow;
                      textColor = theme.textSecondary;
                      borderWidth = 1;
                      borderColor = theme.outlineVariant + '33';
                    } else if (isFour) {
                      bgColor = '#10B981';
                      textColor = '#ffffff';
                    } else if (isSix) {
                      bgColor = '#8B5CF6';
                      textColor = '#ffffff';
                    } else if (ball.includes('WD')) {
                      bgColor = '#F59E0B';
                      textColor = '#ffffff';
                    } else if (ball.includes('NB')) {
                      bgColor = '#F43F5E';
                      textColor = '#ffffff';
                    } else if (ball.includes('BYE') || ball.includes('LB')) {
                      bgColor = '#06B6D4';
                      textColor = '#ffffff';
                    }

                    const match = ball.match(/^(\d+)?(WD|NB|BYE|LB)$/);
                    let renderContent;

                    if (match) {
                      const num = match[1];
                      const type = match[2];
                      if (num === undefined) {
                        renderContent = (
                          <ThemedText style={{ color: textColor, fontFamily: 'Sora_500Medium', fontSize: 12 }}>
                            {type}
                          </ThemedText>
                        );
                      } else {
                        renderContent = (
                          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center' }}>
                            <ThemedText style={{ color: textColor, fontFamily: 'Sora_500Medium', fontSize: 14 }}>
                              {num}
                            </ThemedText>
                            <ThemedText style={{ color: textColor, fontFamily: 'Sora_500Medium', fontSize: 8, marginLeft: 1 }}>
                              {type}
                            </ThemedText>
                          </View>
                        );
                      }
                    } else {
                      renderContent = (
                        <ThemedText type="bodyMd" style={{ color: textColor, fontFamily: 'Sora_500Medium' }}>
                          {ball}
                        </ThemedText>
                      );
                    }

                    return (
                      <View key={idx} style={[styles.logBall, { backgroundColor: bgColor, borderWidth, borderColor }]}>
                        {renderContent}
                      </View>
                    );
                  })}
                  {overLog.length === 0 && (
                    <ThemedText type="bodyMd" style={{ color: theme.textSecondary, fontStyle: 'italic' }}>
                      Starting new over...
                    </ThemedText>
                  )}
                </ScrollView>

                {/* Bowler balls indicator row */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.outlineVariant + '22', marginTop: 4 }}>
                  <ThemedText style={{ color: theme.textSecondary, fontSize: 12, fontFamily: 'Sora_500Medium' }}>
                    Bowler: <ThemedText style={{ color: theme.text, fontFamily: 'Sora_500Medium' }}>{bowler.name || 'Not Selected'}</ThemedText> ({((Number(bowler.overs) || 0) * 6) + (Number(bowler.ballsInOver) || 0)} balls)
                  </ThemedText>
                  <View style={{ flexDirection: 'row', gap: 5 }}>
                    {[1, 2, 3, 4, 5, 6].map((b) => (
                      <View
                        key={b}
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: b <= ballsInCurrentOver ? theme.primary : theme.outlineVariant + '44',
                        }}
                      />
                    ))}
                  </View>
                </View>

                {/* ── INLINE COMPACT BALL-BY-BALL KEYPAD (Embedded Inside Screen Space) ── */}
                {showScoringPad && (
                  <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: theme.outlineVariant + '25', gap: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <ThemedText style={{ fontSize: 9, fontFamily: 'Sora_500Medium', color: theme.textSecondary, letterSpacing: 0.6, textTransform: 'uppercase' }}>
                        Ball-by-Ball Control Panel
                      </ThemedText>
                      <ThemedText style={{ fontSize: 9.5, fontFamily: 'Sora_500Medium', color: theme.textSecondary }}>
                        Score: <ThemedText style={{ fontFamily: 'Sora_500Medium', color: theme.text }}>{runs}/{wickets}</ThemedText> ({overs}.{ballsInCurrentOver} ov)
                      </ThemedText>
                    </View>

                    {/* Pre-ball Setup Warning Banner if Bowler or Batsmen are missing */}
                    {isPlayersIncomplete && (
                      <Pressable
                        onPress={openEditPlayersModal}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: '#FFFBEB',
                          borderColor: '#F59E0B',
                          borderWidth: 1.5,
                          borderRadius: 12,
                          padding: 10,
                          gap: 10,
                          marginBottom: 4,
                        }}
                      >
                        <Ionicons name="warning" size={20} color="#D97706" />
                        <View style={{ flex: 1 }}>
                          <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_500Medium', color: '#92400E' }}>
                            Verify Players Before Bowling
                          </ThemedText>
                          <ThemedText style={{ fontSize: 10, color: '#B45309', marginTop: 2 }}>
                            {isBowlerMissing && isBatsmenMissing
                              ? 'Assign Bowler & Opening Batsmen to start'
                              : isBowlerMissing
                                ? 'Assign Active Bowler for this over'
                                : 'Assign 2 Opening Batsmen to start'}
                          </ThemedText>
                        </View>
                        <View style={{ backgroundColor: '#F59E0B', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 }}>
                          <ThemedText style={{ color: '#ffffff', fontSize: 10.5, fontFamily: 'Sora_500Medium' }}>
                            Setup
                          </ThemedText>
                        </View>
                      </Pressable>
                    )}

                    {/* Compact 7-grid runs circle buttons (includes 5 for overthrows) */}
                    <View style={[{ flexDirection: 'row', justifyContent: 'space-between', gap: 5, flexWrap: 'wrap' }, isPlayersIncomplete && { opacity: 0.6 }]}>
                      {[0, 1, 2, 3, 4, 5, 6].map((num) => {
                        const isFourOrSix = num === 4 || num === 6;
                        const isFive = num === 5;
                        const label = num === 0 ? 'Dot' : num === 1 ? 'Single' : num === 2 ? 'Double' : num === 3 ? 'Triple' : num === 4 ? 'Four' : num === 5 ? 'Five' : 'Six';

                        return (
                          <Pressable
                            key={num}
                            onPress={() => recordBall('run', num)}
                            style={({ pressed }) => [{
                              flex: 1,
                              minWidth: 38,
                              aspectRatio: 1,
                              borderRadius: 50,
                              justifyContent: 'center',
                              alignItems: 'center',
                              backgroundColor: isFourOrSix
                                ? (num === 4 ? '#10B98118' : '#8B5CF618')
                                : isFive
                                  ? '#F59E0B18'
                                  : theme.surfaceLow,
                              borderWidth: 1.5,
                              borderColor: isFourOrSix
                                ? (num === 4 ? '#10B981' : '#8B5CF6')
                                : isFive
                                  ? '#F59E0B'
                                  : theme.primary + '30',
                            }, pressed && { opacity: 0.75 }]}
                          >
                            <ThemedText style={{ fontSize: 16, fontFamily: 'Sora_500Medium', color: isFourOrSix ? (num === 4 ? '#10B981' : '#8B5CF6') : isFive ? '#F59E0B' : theme.text }}>
                              {num}
                            </ThemedText>
                            <ThemedText style={{ fontSize: 8, fontFamily: 'Sora_500Medium', color: theme.textSecondary }}>
                              {label}
                            </ThemedText>
                          </Pressable>
                        );
                      })}
                    </View>

                    {/* Extras Row */}
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {['WD', 'NB', 'BYE', 'LB'].map((extra) => (
                        <Pressable
                          key={extra}
                          onPress={() => handleExtraClick(extra as 'WD' | 'NB' | 'BYE' | 'LB')}
                          onLongPress={() => {
                            setActiveExtraType(extra as 'WD' | 'NB' | 'BYE' | 'LB');
                            setShowExtraModal(true);
                          }}
                          style={({ pressed }) => [{
                            flex: 1,
                            paddingVertical: 7,
                            borderRadius: 8,
                            backgroundColor: theme.surfaceLow,
                            borderWidth: 1,
                            borderColor: theme.outlineVariant + '44',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }, pressed && { backgroundColor: theme.primary + '15' }]}
                        >
                          <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_500Medium', color: theme.text }}>
                            {extra === 'WD' ? 'Wide' : extra === 'NB' ? 'No Ball' : extra}
                          </ThemedText>
                        </Pressable>
                      ))}
                    </View>

                    {/* Action Buttons: Wicket + Undo */}
                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                      <Pressable
                        onPress={() => { setWicketRuns(0); setWicketWhoIsOut('striker'); setShowWicketModal(true); }}
                        style={({ pressed }) => [{
                          flex: 2,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#EF4444',
                          paddingVertical: 8,
                          borderRadius: 8,
                          gap: 6,
                        }, pressed && { opacity: 0.85 }]}
                      >
                        <Ionicons name="skull-outline" size={15} color="#ffffff" />
                        <ThemedText style={{ color: '#ffffff', fontSize: 12, fontFamily: 'Sora_500Medium' }}>
                          Wicket
                        </ThemedText>
                      </Pressable>

                      <Pressable
                        onPress={handleUndo}
                        disabled={history.length === 0}
                        style={({ pressed }) => [{
                          flex: 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: theme.surfaceLow,
                          borderWidth: 1,
                          borderColor: theme.outlineVariant + '44',
                          paddingVertical: 8,
                          borderRadius: 8,
                          opacity: history.length === 0 ? 0.4 : 1,
                          gap: 4,
                        }, pressed && { backgroundColor: theme.primary + '15' }]}
                      >
                        <Ionicons name="arrow-undo" size={14} color={theme.text} />
                        <ThemedText style={{ color: theme.text, fontSize: 11, fontFamily: 'Sora_500Medium' }}>
                          Undo
                        </ThemedText>
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Players Table Section */}
            <View style={styles.section}>
              <View style={[styles.tableCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
                <View style={[styles.tableHeader, { backgroundColor: theme.surfaceLow }]}>
                  <ThemedText type="labelMd" style={{ color: theme.text }}>Current Batsmen</ThemedText>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Pressable
                      onPress={handleSwapStrike}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: theme.primary + '10',
                        paddingHorizontal: 6,
                        paddingVertical: 4,
                        borderRadius: 4,
                      }}
                    >
                      <Ionicons name="swap-horizontal" size={12} color={theme.primary} />
                      <ThemedText style={{ fontSize: 10, color: theme.primary, marginLeft: 2, fontFamily: 'Sora_500Medium' }}>
                        Swap
                      </ThemedText>
                    </Pressable>

                    {/* CHANGE — swap this slot's holder for a bench player. */}
                    <Pressable
                      onPress={() => {
                        const idx = batsmen.findIndex(b => b.active);
                        setChangeSlot(idx >= 0 ? idx : 0);
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: theme.primary + '10',
                        paddingHorizontal: 6,
                        paddingVertical: 4,
                        borderRadius: 4,
                      }}
                    >
                      <Ionicons name="repeat" size={12} color={theme.primary} />
                      <ThemedText style={{ fontSize: 10, color: theme.primary, marginLeft: 2, fontFamily: 'Sora_500Medium' }}>
                        Change
                      </ThemedText>
                    </Pressable>

                    {/* EDIT — the striker's own details; nobody changes slots. */}
                    <Pressable
                      onPress={() => {
                        const idx = batsmen.findIndex(b => b.active);
                        setEditSlot(idx >= 0 ? idx : 0);
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: theme.primary + '10',
                        paddingHorizontal: 6,
                        paddingVertical: 4,
                        borderRadius: 4,
                      }}
                    >
                      <Ionicons name="create" size={12} color={theme.primary} />
                      <ThemedText style={{ fontSize: 10, color: theme.primary, marginLeft: 2, fontFamily: 'Sora_500Medium' }}>
                        Edit
                      </ThemedText>
                    </Pressable>

                    {/* Full squad editor (batsmen + bowler) stays available. */}
                    <Pressable
                      onPress={openEditPlayersModal}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: theme.primary + '10',
                        paddingHorizontal: 6,
                        paddingVertical: 4,
                        borderRadius: 4,
                      }}
                    >
                      <Ionicons name="people" size={12} color={theme.primary} />
                      <ThemedText style={{ fontSize: 10, color: theme.primary, marginLeft: 2, fontFamily: 'Sora_500Medium' }}>
                        Squad
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>

                {/* Sub-Header Row */}
                <View style={[styles.tableRow, { paddingVertical: 6, backgroundColor: theme.surfaceLow + '50', borderBottomWidth: 1, borderBottomColor: theme.outlineVariant + '33' }]}>
                  <View style={styles.batsmanNameCell}>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_500Medium' }}>Batsman</ThemedText>
                  </View>
                  <View style={styles.batStatsCells}>
                    <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_500Medium' }}>R</ThemedText></View>
                    <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_500Medium' }}>B</ThemedText></View>
                    <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_500Medium' }}>4s</ThemedText></View>
                    <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_500Medium' }}>6s</ThemedText></View>
                    <View style={[styles.statCell, { width: 50 }]}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_500Medium', textAlign: 'center' }}>SR</ThemedText></View>
                  </View>
                </View>

                {batsmen.length === 0 ? (
                  <View style={{ paddingVertical: 18, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="person-add-outline" size={22} color={theme.textSecondary} style={{ marginBottom: 6 }} />
                    <ThemedText style={{ fontSize: 12.5, fontFamily: 'Sora_500Medium', color: theme.textSecondary, marginBottom: 8, textAlign: 'center' }}>
                      No opening batsmen assigned yet
                    </ThemedText>
                    <Pressable
                      onPress={openEditPlayersModal}
                      style={{ backgroundColor: theme.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full }}
                    >
                      <ThemedText style={{ color: '#ffffff', fontSize: 10.5, fontFamily: 'Sora_500Medium' }}>
                        + Select Opening Batsmen
                      </ThemedText>
                    </Pressable>
                  </View>
                ) : (
                  batsmen.map((b, idx) => {
                    const sr = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0';
                    return (
                      <Pressable
                        key={idx}
                        onPress={() => toggleActiveBatsman(idx)}
                        style={[
                          styles.tableRow,
                          { paddingVertical: 8, borderLeftWidth: 4 },
                          b.active
                            ? { backgroundColor: theme.secondaryContainer + '1a', borderLeftColor: theme.secondaryContainer }
                            : { borderLeftColor: 'transparent' },
                        ]}
                      >
                        <Pressable
                          onPress={openEditPlayersModal}
                          style={styles.batsmanNameCell}
                        >
                          <View style={[styles.playerAvatar, { backgroundColor: theme.primary + '15' }]}>
                            <ThemedText style={{ color: theme.primary, fontSize: 9.5, fontFamily: 'Sora_700Bold' }}>
                              {getTwoLetterLogo(b.name || 'Player')}
                            </ThemedText>
                          </View>
                          <ThemedText numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 13, fontFamily: 'Sora_500Medium', color: theme.text, flexShrink: 1 }}>
                            {b.name}
                          </ThemedText>
                          {b.active && (
                            <Ionicons name="star" size={8} color={theme.error} style={{ marginLeft: 3 }} />
                          )}
                        </Pressable>
                        <View style={styles.batStatsCells}>
                          <View style={styles.statCell}>
                            <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_500Medium', color: theme.text }}>{b.runs}</ThemedText>
                          </View>
                          <View style={styles.statCell}>
                            <ThemedText style={{ fontSize: 12, color: theme.textSecondary }}>{b.balls}</ThemedText>
                          </View>
                          <View style={styles.statCell}>
                            <ThemedText style={{ fontSize: 12, color: theme.text }}>{b.fours}</ThemedText>
                          </View>
                          <View style={styles.statCell}>
                            <ThemedText style={{ fontSize: 12, color: theme.text }}>{b.sixes}</ThemedText>
                          </View>
                          <View style={[styles.statCell, { width: 50 }]}>
                            <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_500Medium', color: theme.text }}>{sr}</ThemedText>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })
                )}
              </View>

              <View style={[styles.tableCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', marginTop: Spacing.md }]}>
                <View style={[styles.tableHeader, { backgroundColor: theme.surfaceLow }]}>
                  <ThemedText type="labelMd" style={{ color: theme.text }}>Current Bowler</ThemedText>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Pressable
                      onPress={() => { openEditPlayersModal(); setActionTarget({ type: 'bowler' }); }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: theme.primary + '10',
                        paddingHorizontal: 6,
                        paddingVertical: 4,
                        borderRadius: 4,
                      }}
                    >
                      <Ionicons name="create" size={12} color={theme.primary} />
                      <ThemedText style={{ fontSize: 10, color: theme.primary, marginLeft: 2, fontFamily: 'Sora_500Medium' }}>
                        Edit
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>

                {/* Bowler Sub-Header Row */}
                <View style={[styles.tableRow, { paddingVertical: 6, backgroundColor: theme.surfaceLow + '50', borderBottomWidth: 1, borderBottomColor: theme.outlineVariant + '33' }]}>
                  <View style={styles.batsmanNameCell}>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_500Medium' }}>Bowler</ThemedText>
                  </View>
                  <View style={styles.batStatsCells}>
                    <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_500Medium' }}>O</ThemedText></View>
                    <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_500Medium' }}>M</ThemedText></View>
                    <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_500Medium' }}>R</ThemedText></View>
                    <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_500Medium' }}>W</ThemedText></View>
                    <View style={[styles.statCell, { width: 50 }]}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_500Medium', textAlign: 'center' }}>ECON</ThemedText></View>
                  </View>
                </View>

                {!bowler.name ? (
                  <View style={{ paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' }}>
                    <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_500Medium', color: theme.textSecondary, marginBottom: 6 }}>
                      No bowler assigned for current over
                    </ThemedText>
                    <Pressable
                      onPress={() => { openEditPlayersModal(); setActionTarget({ type: 'bowler' }); }}
                      style={{ backgroundColor: theme.primary + '18', paddingHorizontal: 12, paddingVertical: 5, borderRadius: BorderRadius.full }}
                    >
                      <ThemedText style={{ color: theme.primary, fontSize: 10.5, fontFamily: 'Sora_500Medium' }}>
                        + Assign Bowler
                      </ThemedText>
                    </Pressable>
                  </View>
                ) : (
                  <View style={[styles.tableRow, { paddingVertical: 8, borderLeftWidth: 4, borderLeftColor: 'transparent' }]}>
                    <Pressable
                      onPress={() => {
                        openEditPlayersModal();
                        setActionTarget({ type: 'bowler' });
                      }}
                      style={styles.batsmanNameCell}
                    >
                      <View style={[styles.playerAvatar, { backgroundColor: '#F59E0B18' }]}>
                        <ThemedText style={{ color: '#F59E0B', fontSize: 9.5, fontFamily: 'Sora_700Bold' }}>
                          {getTwoLetterLogo(bowler.name || 'Bowler')}
                        </ThemedText>
                      </View>
                      <ThemedText style={{ fontSize: 13, fontFamily: 'Sora_500Medium', color: theme.text }}>
                        {bowler.name}
                      </ThemedText>
                    </Pressable>
                    <View style={styles.batStatsCells}>
                      <View style={styles.statCell}>
                        <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_500Medium', color: theme.text }}>
                          {bowler.overs || 0}.{bowler.ballsInOver || 0}
                        </ThemedText>
                      </View>
                      <View style={styles.statCell}>
                        <ThemedText style={{ fontSize: 12, color: theme.textSecondary }}>{bowler.maidens || 0}</ThemedText>
                      </View>
                      <View style={styles.statCell}>
                        <ThemedText style={{ fontSize: 12, color: theme.text }}>{bowler.runs || 0}</ThemedText>
                      </View>
                      <View style={styles.statCell}>
                        <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_500Medium', color: theme.text }}>{bowler.wickets || 0}</ThemedText>
                      </View>
                      <View style={[styles.statCell, { width: 50 }]}>
                        <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_500Medium', color: theme.text }}>
                          {(((bowler.overs || 0) * 6 + (bowler.ballsInOver || 0)) > 0 ? ((bowler.runs || 0) / (((bowler.overs || 0) * 6 + (bowler.ballsInOver || 0)) / 6)) : 0).toFixed(2)}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Next Batsman Suggestion Card */}
            <View style={styles.section}>
              <View style={[styles.card, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', borderRadius: BorderRadius.xl, padding: 14, ...Shadows.level2 }]}>
                {/* Header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: theme.primary + '15', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="people-outline" size={14} color={theme.primary} />
                  </View>
                  <ThemedText style={{ fontSize: 13.5, fontFamily: 'Sora_500Medium', color: theme.text }}>
                    Next Batsman Suggestion
                  </ThemedText>
                </View>

                <View style={{ gap: 8 }}>
                  {availableBenchBatsmen.length === 0 ? (
                    <View style={{ paddingVertical: 14, alignItems: 'center', justifyContent: 'center' }}>
                      <ThemedText style={{ fontSize: 11.5, color: theme.textSecondary, fontFamily: 'Sora_500Medium', marginBottom: 8, textAlign: 'center' }}>
                        No upcoming batsmen in team bench yet.
                      </ThemedText>
                      <Pressable
                        onPress={() => setShowFullSquadModal(true)}
                        style={{ backgroundColor: theme.primary + '15', paddingHorizontal: 12, paddingVertical: 5, borderRadius: BorderRadius.full }}
                      >
                        <ThemedText style={{ color: theme.primary, fontSize: 10.5, fontFamily: 'Sora_500Medium' }}>
                          + Add Squad Players for Suggestions
                        </ThemedText>
                      </Pressable>
                    </View>
                  ) : (
                    availableBenchBatsmen.slice(0, 2).map((b, idx) => (
                      <Pressable
                        key={idx}
                        onPress={() => sendInBatsman(b.name)}
                        style={{ backgroundColor: theme.surfaceLow, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: theme.outlineVariant + '22' }}
                      >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <View style={{ flex: 1, paddingRight: 8 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <ThemedText numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 13, fontFamily: 'Sora_500Medium', color: theme.text, flexShrink: 1 }}>
                                {b.name}
                              </ThemedText>
                              <View style={{ backgroundColor: idx === 0 ? '#10B98118' : '#8B5CF618', paddingVertical: 1.5, paddingHorizontal: 6, borderRadius: BorderRadius.full }}>
                                <ThemedText style={{ fontSize: 7.5, color: idx === 0 ? '#10B981' : '#8B5CF6', fontFamily: 'Sora_500Medium', letterSpacing: 0.5 }}>
                                  {idx === 0 ? 'RECOMMENDED' : 'NEXT UP'}
                                </ThemedText>
                              </View>
                            </View>
                            <ThemedText style={{ fontSize: 9.5, color: theme.textSecondary, marginTop: 2, fontFamily: 'Sora_500Medium' }} numberOfLines={1}>
                              {b.role || 'Squad Batsman'} · In Team Bench
                            </ThemedText>
                          </View>

                          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                            <Pressable
                              onPress={() => sendInBatsman(b.name)}
                              style={{ backgroundColor: theme.primary, paddingHorizontal: 11, paddingVertical: 5, borderRadius: 8 }}
                            >
                              <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_500Medium', color: '#ffffff' }}>
                                Send In
                              </ThemedText>
                            </Pressable>
                          </View>
                        </View>
                      </Pressable>
                    ))
                  )}
                </View>
              </View>
            </View>
          </>
        )}

        {activeSubTab === 'scorecard' && (
          <View style={{ paddingHorizontal: Spacing.containerMargin, gap: Spacing.md, marginTop: Spacing.sm }}>
            {/* Full Team Playing Squad Management Header Bar (Perfect Alignment & Squad Text Only) */}
            <Pressable
              onPress={() => setShowPlayingXIModal(true)}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: theme.surfaceLowest,
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: BorderRadius.lg,
                borderWidth: 1,
                borderColor: theme.outlineVariant + '33',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, paddingRight: 6 }}>
                <Ionicons name="people" size={16} color={theme.primary} />
                <ThemedText style={{ fontSize: 13, fontFamily: 'Sora_500Medium', color: theme.text }} numberOfLines={1}>
                  Squad ({currentInnings === 1 ? (battingTeamName || teamA) : (battingTeamName || teamB)})
                </ThemedText>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: theme.primary,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: BorderRadius.full,
                  gap: 4,
                }}
              >
                <Ionicons name="person-add" size={12} color="#ffffff" />
                <ThemedText style={{ color: '#ffffff', fontSize: 10.5, fontFamily: 'Sora_500Medium' }}>
                  Manage Squad
                </ThemedText>
              </View>
            </Pressable>

            {/* 1st Innings / 2nd Innings Tabs Switcher */}
            <View style={{ flexDirection: 'row', backgroundColor: theme.surfaceLow, padding: 4, borderRadius: 12, width: '100%', gap: 4 }}>
              <Pressable
                onPress={() => setViewingScorecardInnings(1)}
                style={[
                  { flex: 1, paddingVertical: 8, paddingHorizontal: 6, alignItems: 'center', borderRadius: 9 },
                  viewingScorecardInnings === 1 && { backgroundColor: theme.surfaceLowest, ...Shadows.level1 },
                ]}
              >
                <ThemedText
                  style={{
                    fontSize: 12,
                    fontFamily: viewingScorecardInnings === 1 ? 'Sora_700Bold' : 'Sora_500Medium',
                    color: viewingScorecardInnings === 1 ? theme.primary : theme.textSecondary,
                  }}
                  numberOfLines={1}
                >
                  1st Innings {firstInningsScore ? `(${firstInningsScore.runs}/${firstInningsScore.wickets})` : currentInnings === 1 ? `(${runs}/${wickets})` : ''}
                </ThemedText>
                <ThemedText style={{ fontSize: 9.5, color: theme.textSecondary, marginTop: 1 }} numberOfLines={1}>
                  {currentInnings === 1 ? (battingTeamName || teamA) : (firstInningsScorecard?.battingTeam || teamA)}
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={() => {
                  if (currentInnings === 2 || firstInningsScore) {
                    setViewingScorecardInnings(2);
                  } else {
                    Alert.alert('2nd Innings', '2nd Innings has not started yet.');
                  }
                }}
                style={[
                  { flex: 1, paddingVertical: 8, paddingHorizontal: 6, alignItems: 'center', borderRadius: 9 },
                  viewingScorecardInnings === 2 && { backgroundColor: theme.surfaceLowest, ...Shadows.level1 },
                ]}
              >
                <ThemedText
                  style={{
                    fontSize: 12,
                    fontFamily: viewingScorecardInnings === 2 ? 'Sora_700Bold' : 'Sora_500Medium',
                    color: viewingScorecardInnings === 2 ? theme.primary : theme.textSecondary,
                    opacity: (currentInnings === 2 || firstInningsScore) ? 1 : 0.6,
                  }}
                  numberOfLines={1}
                >
                  2nd Innings {currentInnings === 2 ? `(${runs}/${wickets})` : '(Yet to Bat)'}
                </ThemedText>
                <ThemedText style={{ fontSize: 9.5, color: theme.textSecondary, marginTop: 1, opacity: (currentInnings === 2 || firstInningsScore) ? 1 : 0.6 }} numberOfLines={1}>
                  {currentInnings === 2 ? (battingTeamName || teamB) : (bowlingTeamName || teamB)}
                </ThemedText>
              </Pressable>
            </View>

            {/* Segment Selector Switcher (Batsmen / Bowlers) */}
            <View style={{ flexDirection: 'row', backgroundColor: theme.surfaceLow, padding: 4, borderRadius: 10, width: '100%', marginBottom: 4 }}>
              <Pressable
                onPress={() => setScorecardTab('batsmen')}
                style={[{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 }, scorecardTab === 'batsmen' && { backgroundColor: theme.surfaceLowest, ...Shadows.level1 }]}
              >
                <ThemedText style={{ fontSize: 13, fontFamily: scorecardTab === 'batsmen' ? 'Sora_600SemiBold' : 'Sora_600SemiBold', color: scorecardTab === 'batsmen' ? theme.primary : theme.textSecondary }}>
                  Batsmen
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={() => setScorecardTab('bowlers')}
                style={[{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 }, scorecardTab === 'bowlers' && { backgroundColor: theme.surfaceLowest, ...Shadows.level1 }]}
              >
                <ThemedText style={{ fontSize: 13, fontFamily: scorecardTab === 'bowlers' ? 'Sora_600SemiBold' : 'Sora_600SemiBold', color: scorecardTab === 'bowlers' ? theme.primary : theme.textSecondary }}>
                  Bowlers
                </ThemedText>
              </Pressable>
            </View>

            {/* Full Batsmen Scorecard */}
            {scorecardTab === 'batsmen' && (() => {
              const displayedBatsmen =
                viewingScorecardInnings === currentInnings
                  ? getFullBatsmenScorecard()
                  : viewingScorecardInnings === 1
                  ? (firstInningsScorecard?.batsmen || [])
                  : [];

              const teamTitle =
                viewingScorecardInnings === currentInnings
                  ? (battingTeamName || (currentInnings === 1 ? teamA : teamB))
                  : viewingScorecardInnings === 1
                  ? (firstInningsScorecard?.battingTeam || teamA)
                  : (bowlingTeamName || teamB);

              return (
                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="stats-chart-outline" size={16} color={theme.primary} />
                      <ThemedText style={{ fontSize: 14, fontFamily: 'Sora_500Medium', color: theme.text }}>
                        Batsmen ({teamTitle})
                      </ThemedText>
                    </View>
                    <ThemedText style={{ fontSize: 11, color: theme.textSecondary, fontFamily: 'Sora_500Medium' }}>
                      {viewingScorecardInnings === 1 ? '1st' : '2nd'} Innings
                    </ThemedText>
                  </View>

                  {/* Sub-Header Row */}
                  <View style={[styles.tableRow, { paddingVertical: 6, backgroundColor: theme.surfaceLow + '70', borderRadius: 8, borderBottomWidth: 0, borderLeftWidth: 4, borderLeftColor: 'transparent' }]}>
                    <View style={styles.batsmanNameCell}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_500Medium' }}>Batsman</ThemedText>
                    </View>
                    <View style={styles.batStatsCells}>
                      <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_500Medium' }}>R</ThemedText></View>
                      <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_500Medium' }}>B</ThemedText></View>
                      <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_500Medium' }}>4s</ThemedText></View>
                      <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_500Medium' }}>6s</ThemedText></View>
                      <View style={[styles.statCell, { width: 50 }]}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_500Medium', textAlign: 'center' }}>SR</ThemedText></View>
                    </View>
                  </View>

                  {displayedBatsmen.length === 0 ? (
                    <View style={{ paddingVertical: 20, alignItems: 'center', justifyContent: 'center' }}>
                      <ThemedText style={{ fontSize: 12, color: theme.textSecondary, fontFamily: 'Sora_500Medium', marginBottom: 8 }}>
                        {viewingScorecardInnings === 2 && currentInnings === 1
                          ? '2nd Innings has not started yet.'
                          : 'No active batsmen assigned yet.'}
                      </ThemedText>
                      {viewingScorecardInnings === currentInnings && (
                        <Pressable
                          onPress={() => setShowPlayingXIModal(true)}
                          style={{ backgroundColor: theme.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full }}
                        >
                          <ThemedText style={{ color: '#ffffff', fontSize: 11, fontFamily: 'Sora_500Medium' }}>
                            + Assign Squad Batsmen
                          </ThemedText>
                        </Pressable>
                      )}
                    </View>
                  ) : (
                    displayedBatsmen.map((b, idx) => {
                      const sr = (b.balls && b.balls > 0) ? ((b.runs / b.balls) * 100).toFixed(1) : (b.runs !== undefined ? '0.0' : '-');
                      return (
                        <View
                          key={idx}
                          style={[
                            styles.tableRow,
                            { paddingVertical: 10, borderLeftWidth: 4, borderBottomWidth: 1, borderBottomColor: theme.outlineVariant + '15' },
                            b.active
                              ? { backgroundColor: theme.secondaryContainer + '1a', borderLeftColor: theme.secondaryContainer, borderRadius: 8, borderBottomWidth: 0 }
                              : { borderLeftColor: 'transparent' },
                          ]}
                        >
                          <View style={[styles.batsmanNameCell, { gap: 8 }]}>
                            <View style={[styles.playerAvatar, { backgroundColor: theme.primary + '15' }]}>
                              <ThemedText style={{ color: theme.primary, fontSize: 10, fontFamily: 'Sora_500Medium' }}>
                                {b.name ? b.name.trim().charAt(0).toUpperCase() : 'P'}
                              </ThemedText>
                            </View>
                            <View style={{ flex: 1 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <ThemedText numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 13, fontFamily: 'Sora_500Medium', color: theme.text, flexShrink: 1 }}>
                                  {b.name}
                                </ThemedText>
                                {b.active && (
                                  <Ionicons name="star" size={8} color={theme.error} style={{ marginLeft: 3 }} />
                                )}
                              </View>
                              <ThemedText style={{ fontSize: 9, color: theme.textSecondary, marginTop: 1 }}>
                                {b.status || (b.outInfo ? b.outInfo : 'not out')}
                              </ThemedText>
                            </View>
                          </View>
                          <View style={styles.batStatsCells}>
                            <View style={styles.statCell}>
                              <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_500Medium', color: theme.text }}>{b.runs !== undefined ? b.runs : '-'}</ThemedText>
                            </View>
                            <View style={styles.statCell}>
                              <ThemedText style={{ fontSize: 12, color: theme.textSecondary }}>{b.balls !== undefined ? b.balls : '-'}</ThemedText>
                            </View>
                            <View style={styles.statCell}>
                              <ThemedText style={{ fontSize: 12, color: theme.text }}>{b.fours !== undefined ? b.fours : '-'}</ThemedText>
                            </View>
                            <View style={styles.statCell}>
                              <ThemedText style={{ fontSize: 12, color: theme.text }}>{b.sixes !== undefined ? b.sixes : '-'}</ThemedText>
                            </View>
                            <View style={[styles.statCell, { width: 50 }]}>
                              <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_500Medium', color: theme.text }}>{sr}</ThemedText>
                            </View>
                          </View>
                        </View>
                      );
                    })
                  )}
                </View>
              );
            })()}

            {/* Full Bowler Scorecard */}
            {scorecardTab === 'bowlers' && (() => {
              const displayedBowlers =
                viewingScorecardInnings === currentInnings
                  ? getFullBowlerScorecard()
                  : viewingScorecardInnings === 1
                  ? (firstInningsScorecard?.bowlers || [])
                  : [];

              const teamTitle =
                viewingScorecardInnings === currentInnings
                  ? (bowlingTeamName || (currentInnings === 1 ? teamB : teamA))
                  : viewingScorecardInnings === 1
                  ? (firstInningsScorecard?.bowlingTeam || teamB)
                  : (battingTeamName || teamA);

              return (
                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="analytics-outline" size={16} color={theme.primary} />
                      <ThemedText style={{ fontSize: 14, fontFamily: 'Sora_500Medium', color: theme.text }}>
                        Bowlers ({teamTitle})
                      </ThemedText>
                    </View>
                    <ThemedText style={{ fontSize: 11, color: theme.textSecondary, fontFamily: 'Sora_500Medium' }}>
                      {viewingScorecardInnings === 1 ? '1st' : '2nd'} Innings
                    </ThemedText>
                  </View>

                  {/* Sub-Header Row */}
                  <View style={[styles.tableRow, { paddingVertical: 6, backgroundColor: theme.surfaceLow + '70', borderRadius: 8, borderBottomWidth: 0, borderLeftWidth: 4, borderLeftColor: 'transparent' }]}>
                    <View style={styles.batsmanNameCell}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_500Medium' }}>Bowler</ThemedText>
                    </View>
                    <View style={styles.batStatsCells}>
                      <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_500Medium' }}>O</ThemedText></View>
                      <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_500Medium' }}>M</ThemedText></View>
                      <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_500Medium' }}>R</ThemedText></View>
                      <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_500Medium' }}>W</ThemedText></View>
                      <View style={[styles.statCell, { width: 50 }]}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_500Medium', textAlign: 'center' }}>ECON</ThemedText></View>
                    </View>
                  </View>

                  {displayedBowlers.length === 0 ? (
                    <View style={{ paddingVertical: 20, alignItems: 'center', justifyContent: 'center' }}>
                      <ThemedText style={{ fontSize: 12, color: theme.textSecondary, fontFamily: 'Sora_500Medium' }}>
                        {viewingScorecardInnings === 2 && currentInnings === 1
                          ? '2nd Innings has not started yet.'
                          : 'No bowler data recorded yet.'}
                      </ThemedText>
                    </View>
                  ) : (
                    displayedBowlers.map((b, idx) => {
                      const bowlerOvers = b.overs || 0;
                      const bowlerBallsInOver = b.ballsInOver || 0;
                      const totalBalls = bowlerOvers * 6 + bowlerBallsInOver;
                      const econ = totalBalls > 0 ? ((b.runs / (totalBalls / 6))).toFixed(2) : '0.00';
                      const oversDisplay = `${bowlerOvers}.${bowlerBallsInOver}`;

                      return (
                        <View
                          key={idx}
                          style={[
                            styles.tableRow,
                            { paddingVertical: 10, borderLeftWidth: 4, borderBottomWidth: 1, borderBottomColor: theme.outlineVariant + '15' },
                            b.active
                              ? { backgroundColor: theme.secondaryContainer + '1a', borderLeftColor: theme.secondaryContainer, borderRadius: 8, borderBottomWidth: 0 }
                              : { borderLeftColor: 'transparent' },
                          ]}
                        >
                          <View style={[styles.batsmanNameCell, { gap: 8 }]}>
                            <View style={[styles.playerAvatar, { backgroundColor: '#F59E0B18' }]}>
                              <ThemedText style={{ color: '#F59E0B', fontSize: 9.5, fontFamily: 'Sora_700Bold' }}>
                                {getTwoLetterLogo(b.name || 'Bowler')}
                              </ThemedText>
                            </View>
                            <View style={{ flex: 1 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <ThemedText numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 13, fontFamily: 'Sora_500Medium', color: theme.text, flexShrink: 1 }}>
                                  {b.name}
                                </ThemedText>
                                {b.active && (
                                  <Ionicons name="star" size={8} color={theme.error} style={{ marginLeft: 3 }} />
                                )}
                              </View>
                              {b.active && (
                                <ThemedText style={{ fontSize: 9, color: theme.textSecondary, marginTop: 1 }}>
                                  bowling
                                </ThemedText>
                              )}
                            </View>
                          </View>
                          <View style={styles.batStatsCells}>
                            <View style={styles.statCell}>
                              <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_500Medium', color: theme.text }}>{oversDisplay}</ThemedText>
                            </View>
                            <View style={styles.statCell}>
                              <ThemedText style={{ fontSize: 12, color: theme.textSecondary }}>{b.maidens || 0}</ThemedText>
                            </View>
                            <View style={styles.statCell}>
                              <ThemedText style={{ fontSize: 12, color: theme.text }}>{b.runs || 0}</ThemedText>
                            </View>
                            <View style={styles.statCell}>
                              <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_500Medium', color: theme.text }}>{b.wickets || 0}</ThemedText>
                            </View>
                            <View style={[styles.statCell, { width: 50 }]}>
                              <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_500Medium', color: theme.text }}>{econ}</ThemedText>
                            </View>
                          </View>
                        </View>
                      );
                    })
                  )}
                </View>
              );
            })()}
          </View>
        )}

        {activeSubTab === 'stats' && (
          <View style={{ paddingHorizontal: Spacing.containerMargin, gap: Spacing.md, marginTop: Spacing.sm }}>
            {/* 1st Innings / 2nd Innings Tabs Switcher */}
            {(currentInnings === 2 || firstInningsScore !== null) && (
              <View style={{ flexDirection: 'row', backgroundColor: theme.surfaceLow, padding: 4, borderRadius: 12, width: '100%', gap: 4 }}>
                <Pressable
                  onPress={() => setViewingScorecardInnings(1)}
                  style={[
                    { flex: 1, paddingVertical: 8, paddingHorizontal: 6, alignItems: 'center', borderRadius: 9 },
                    viewingScorecardInnings === 1 && { backgroundColor: theme.surfaceLowest, ...Shadows.level1 },
                  ]}
                >
                  <ThemedText
                    style={{
                      fontSize: 12,
                      fontFamily: viewingScorecardInnings === 1 ? 'Sora_700Bold' : 'Sora_500Medium',
                      color: viewingScorecardInnings === 1 ? theme.primary : theme.textSecondary,
                    }}
                    numberOfLines={1}
                  >
                    1st Innings {firstInningsScore ? `(${firstInningsScore.runs}/${firstInningsScore.wickets})` : currentInnings === 1 ? `(${runs}/${wickets})` : ''}
                  </ThemedText>
                  <ThemedText style={{ fontSize: 9.5, color: theme.textSecondary, marginTop: 1 }} numberOfLines={1}>
                    {currentInnings === 1 ? (battingTeamName || teamA) : (firstInningsScorecard?.battingTeam || teamA)}
                  </ThemedText>
                </Pressable>

                <Pressable
                  onPress={() => {
                    if (currentInnings === 2 || firstInningsScore) {
                      setViewingScorecardInnings(2);
                    } else {
                      Alert.alert('2nd Innings', '2nd Innings has not started yet.');
                    }
                  }}
                  style={[
                    { flex: 1, paddingVertical: 8, paddingHorizontal: 6, alignItems: 'center', borderRadius: 9 },
                    viewingScorecardInnings === 2 && { backgroundColor: theme.surfaceLowest, ...Shadows.level1 },
                  ]}
                >
                  <ThemedText
                    style={{
                      fontSize: 12,
                      fontFamily: viewingScorecardInnings === 2 ? 'Sora_700Bold' : 'Sora_500Medium',
                      color: viewingScorecardInnings === 2 ? theme.primary : theme.textSecondary,
                      opacity: (currentInnings === 2 || firstInningsScore) ? 1 : 0.6,
                    }}
                    numberOfLines={1}
                  >
                    2nd Innings {currentInnings === 2 ? `(${runs}/${wickets})` : '(Yet to Bat)'}
                  </ThemedText>
                  <ThemedText style={{ fontSize: 9.5, color: theme.textSecondary, marginTop: 1, opacity: (currentInnings === 2 || firstInningsScore) ? 1 : 0.6 }} numberOfLines={1}>
                    {currentInnings === 2 ? (battingTeamName || teamB) : (bowlingTeamName || teamB)}
                  </ThemedText>
                </Pressable>
              </View>
            )}

            {/* Quick Metrics Cards - Dynamic calculation based on selected innings */}
            {(() => {
              const isViewingInnings1 = viewingScorecardInnings === 1;
              const isCurrentInnings1 = currentInnings === 1;

              let totalMatchBalls = 0;
              let totalDotBalls = 0;
              let dotPercentage = 0;
              let totalFours = 0;
              let totalSixes = 0;
              let totalBoundariesCount = 0;
              let totalWides = 0;
              let totalNoBalls = 0;
              let totalByes = 0;
              let totalLegByes = 0;
              let totalExtrasCount = 0;

              let bat1: { name: string; runs: number; balls: number } | null = null;
              let bat2: { name: string; runs: number; balls: number } | null = null;
              let pRuns = 0;
              let pBalls = 0;
              let partnershipTitle = 'Active Partnership';

              if (isViewingInnings1) {
                if (isCurrentInnings1) {
                  totalMatchBalls = overs * 6 + ballsInCurrentOver;
                  totalDotBalls = inningsDeliveries.filter(b => b === '0').length;
                  dotPercentage = totalMatchBalls > 0 ? Math.round((totalDotBalls / totalMatchBalls) * 100) : 0;

                  const allBatsmen = getFullBatsmenScorecard();
                  totalFours = allBatsmen.reduce((sum, b) => sum + (b.fours || 0), 0);
                  totalSixes = allBatsmen.reduce((sum, b) => sum + (b.sixes || 0), 0);
                  totalBoundariesCount = totalFours + totalSixes;

                  const sumExtraDeliveries = (tag: string) => inningsDeliveries.reduce((acc, b) => {
                    const m = b.match(/^(\d+)?/ + tag + '$/');
                    if (m) return acc + (m[1] !== undefined ? parseInt(m[1]) : 1);
                    return acc;
                  }, 0);
                  totalWides = sumExtraDeliveries('WD');
                  totalNoBalls = sumExtraDeliveries('NB');
                  totalByes = sumExtraDeliveries('BYE');
                  totalLegByes = sumExtraDeliveries('LB');
                  totalExtrasCount = totalWides + totalNoBalls + totalByes + totalLegByes;

                  const activeBat1 = batsmen.find(b => b.active) || batsmen[0];
                  const activeBat2 = batsmen.find(b => !b.active) || batsmen[1];
                  bat1 = activeBat1 ? { name: activeBat1.name, runs: activeBat1.runs || 0, balls: activeBat1.balls || 0 } : null;
                  bat2 = activeBat2 ? { name: activeBat2.name, runs: activeBat2.runs || 0, balls: activeBat2.balls || 0 } : null;
                  pRuns = (bat1?.runs || 0) + (bat2?.runs || 0);
                  pBalls = (bat1?.balls || 0) + (bat2?.balls || 0);
                  partnershipTitle = 'Active Partnership';
                } else {
                  const inn1OvsParts = (firstInningsScorecard?.totalOvers || '0.0').split('.');
                  const inn1Ovs = parseInt(inn1OvsParts[0] || '0', 10);
                  const inn1Balls = parseInt(inn1OvsParts[1] || '0', 10);
                  totalMatchBalls = inn1Ovs * 6 + inn1Balls;
                  totalDotBalls = firstInningsDeliveries.filter(b => b === '0').length;
                  dotPercentage = totalMatchBalls > 0 ? Math.round((totalDotBalls / totalMatchBalls) * 100) : 0;

                  const allBatsmen = firstInningsScorecard?.batsmen || [];
                  totalFours = allBatsmen.reduce((sum, b) => sum + (b.fours || 0), 0);
                  totalSixes = allBatsmen.reduce((sum, b) => sum + (b.sixes || 0), 0);
                  totalBoundariesCount = totalFours + totalSixes;

                  totalWides = firstInningsScorecard?.extras?.wides || 0;
                  totalNoBalls = firstInningsScorecard?.extras?.noBalls || 0;
                  totalByes = firstInningsScorecard?.extras?.byes || 0;
                  totalLegByes = firstInningsScorecard?.extras?.legByes || 0;
                  totalExtrasCount = firstInningsScorecard?.extras?.total || (totalWides + totalNoBalls + totalByes + totalLegByes);

                  if (firstInningsPartnership) {
                    bat1 = firstInningsPartnership.bat1;
                    bat2 = firstInningsPartnership.bat2;
                    pRuns = firstInningsPartnership.runs;
                    pBalls = firstInningsPartnership.balls;
                  } else if (allBatsmen.length >= 2) {
                    bat1 = { name: allBatsmen[0].name, runs: allBatsmen[0].runs || 0, balls: allBatsmen[0].balls || 0 };
                    bat2 = { name: allBatsmen[1].name, runs: allBatsmen[1].runs || 0, balls: allBatsmen[1].balls || 0 };
                    pRuns = (bat1?.runs || 0) + (bat2?.runs || 0);
                    pBalls = (bat1?.balls || 0) + (bat2?.balls || 0);
                  }
                  partnershipTitle = '1st Innings Partnership';
                }
              } else {
                totalMatchBalls = overs * 6 + ballsInCurrentOver;
                totalDotBalls = inningsDeliveries.filter(b => b === '0').length;
                dotPercentage = totalMatchBalls > 0 ? Math.round((totalDotBalls / totalMatchBalls) * 100) : 0;

                const allBatsmen = getFullBatsmenScorecard();
                totalFours = allBatsmen.reduce((sum, b) => sum + (b.fours || 0), 0);
                totalSixes = allBatsmen.reduce((sum, b) => sum + (b.sixes || 0), 0);
                totalBoundariesCount = totalFours + totalSixes;

                const sumExtraDeliveries = (tag: string) => inningsDeliveries.reduce((acc, b) => {
                  const m = b.match(/^(\d+)?/ + tag + '$/');
                  if (m) return acc + (m[1] !== undefined ? parseInt(m[1]) : 1);
                  return acc;
                }, 0);
                totalWides = sumExtraDeliveries('WD');
                totalNoBalls = sumExtraDeliveries('NB');
                totalByes = sumExtraDeliveries('BYE');
                totalLegByes = sumExtraDeliveries('LB');
                totalExtrasCount = totalWides + totalNoBalls + totalByes + totalLegByes;

                const activeBat1 = batsmen.find(b => b.active) || batsmen[0];
                const activeBat2 = batsmen.find(b => !b.active) || batsmen[1];
                bat1 = activeBat1 ? { name: activeBat1.name, runs: activeBat1.runs || 0, balls: activeBat1.balls || 0 } : null;
                bat2 = activeBat2 ? { name: activeBat2.name, runs: activeBat2.runs || 0, balls: activeBat2.balls || 0 } : null;
                pRuns = (bat1?.runs || 0) + (bat2?.runs || 0);
                pBalls = (bat1?.balls || 0) + (bat2?.balls || 0);
                partnershipTitle = 'Active Partnership';
              }

              return (
                <>
                  <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                    <View style={[styles.card, { flex: 1, backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '22', alignItems: 'center', paddingVertical: 14, borderRadius: BorderRadius.xl, borderWidth: 1, borderTopColor: '#10B981', borderTopWidth: 3, ...Shadows.level1 }]}>
                      <View style={{ backgroundColor: '#10B98115', padding: 5, borderRadius: 20, marginBottom: 4 }}>
                        <Ionicons name="ellipse-outline" size={14} color="#10B981" />
                      </View>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: 9, fontFamily: 'Sora_500Medium' }}>DOT BALLS</ThemedText>
                      <ThemedText type="headlineLg" style={{ color: theme.text, fontFamily: 'Sora_500Medium', marginTop: 2 }}>
                        {dotPercentage}%
                      </ThemedText>
                      <ThemedText style={{ fontSize: 9, color: theme.textSecondary, marginTop: 2 }}>{totalDotBalls} of {totalMatchBalls} balls</ThemedText>
                    </View>

                    <View style={[styles.card, { flex: 1, backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '22', alignItems: 'center', paddingVertical: 14, borderRadius: BorderRadius.xl, borderWidth: 1, borderTopColor: '#F59E0B', borderTopWidth: 3, ...Shadows.level1 }]}>
                      <View style={{ backgroundColor: '#F59E0B15', padding: 5, borderRadius: 20, marginBottom: 4 }}>
                        <Ionicons name="flash-outline" size={14} color="#F59E0B" />
                      </View>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: 9, fontFamily: 'Sora_500Medium' }}>BOUNDARIES</ThemedText>
                      <ThemedText type="headlineLg" style={{ color: theme.text, fontFamily: 'Sora_500Medium', marginTop: 2 }}>
                        {totalBoundariesCount}
                      </ThemedText>
                      <ThemedText style={{ fontSize: 9, color: theme.textSecondary, marginTop: 2 }}>{totalFours} Fours • {totalSixes} Sixes</ThemedText>
                    </View>

                    <View style={[styles.card, { flex: 1, backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '22', alignItems: 'center', paddingVertical: 14, borderRadius: BorderRadius.xl, borderWidth: 1, borderTopColor: '#8B5CF6', borderTopWidth: 3, ...Shadows.level1 }]}>
                      <View style={{ backgroundColor: '#8B5CF615', padding: 5, borderRadius: 20, marginBottom: 4 }}>
                        <Ionicons name="gift-outline" size={14} color="#8B5CF6" />
                      </View>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: 9, fontFamily: 'Sora_500Medium' }}>EXTRAS</ThemedText>
                      <ThemedText type="headlineLg" style={{ color: theme.text, fontFamily: 'Sora_500Medium', marginTop: 2 }}>
                        {totalExtrasCount}
                      </ThemedText>
                      <ThemedText style={{ fontSize: 9, color: theme.textSecondary, marginTop: 2 }}>{totalWides}WD • {totalNoBalls}NB • {totalByes + totalLegByes}B</ThemedText>
                    </View>
                  </View>

                  {/* Partnership Card */}
                  <View style={[styles.card, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', borderRadius: BorderRadius.xl, borderWidth: 1, padding: 14, ...Shadows.level1 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                      <Ionicons name="people-outline" size={16} color={theme.primary} />
                      <ThemedText type="labelMd" style={{ color: theme.text, fontFamily: 'Sora_500Medium' }}>
                        {partnershipTitle}
                      </ThemedText>
                    </View>

                    {(!bat1?.name || !bat2?.name) ? (
                      <View style={{ paddingVertical: 14, alignItems: 'center', justifyContent: 'center' }}>
                        <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_500Medium', color: theme.textSecondary, fontStyle: 'italic' }}>
                          No partnership recorded yet
                        </ThemedText>
                      </View>
                    ) : (
                      <>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.surfaceLow + '30', padding: 12, borderRadius: BorderRadius.lg }}>
                          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <View style={[styles.playerAvatar, { backgroundColor: theme.primary + '15', width: 28, height: 28, borderRadius: 14 }]}>
                              <ThemedText style={{ color: theme.primary, fontSize: 10, fontFamily: 'Sora_500Medium' }}>
                                {bat1.name.trim().charAt(0).toUpperCase()}
                              </ThemedText>
                            </View>
                            <View style={{ flex: 1 }}>
                              <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_500Medium', color: theme.text }} numberOfLines={1}>{bat1.name}</ThemedText>
                              <ThemedText style={{ fontSize: 10, color: theme.textSecondary }}>{bat1.runs || 0} ({bat1.balls || 0})</ThemedText>
                            </View>
                          </View>

                          <View style={{ alignItems: 'center', paddingHorizontal: 12, backgroundColor: theme.primary + '10', paddingVertical: 4, borderRadius: BorderRadius.sm }}>
                            <ThemedText style={{ fontSize: 14, fontFamily: 'Sora_500Medium', color: theme.primary }}>{pRuns}</ThemedText>
                            <ThemedText style={{ fontSize: 8, color: theme.textSecondary, fontFamily: 'Sora_500Medium' }}>runs ({pBalls}b)</ThemedText>
                          </View>

                          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                            <View style={{ alignItems: 'flex-end', flex: 1 }}>
                              <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_500Medium', color: theme.text }} numberOfLines={1}>{bat2.name}</ThemedText>
                              <ThemedText style={{ fontSize: 10, color: theme.textSecondary }}>{bat2.runs || 0} ({bat2.balls || 0})</ThemedText>
                            </View>
                            <View style={[styles.playerAvatar, { backgroundColor: theme.secondary + '15', width: 28, height: 28, borderRadius: 14 }]}>
                              <ThemedText style={{ color: theme.secondary, fontSize: 10, fontFamily: 'Sora_500Medium' }}>
                                {bat2.name.trim().charAt(0).toUpperCase()}
                              </ThemedText>
                            </View>
                          </View>
                        </View>

                        {/* Visual Partnership Bar */}
                        <View style={{ height: 6, backgroundColor: theme.surfaceLow, borderRadius: 3, marginTop: 12, overflow: 'hidden', flexDirection: 'row' }}>
                          <View style={{ flex: Math.max(1, bat1.runs || 0), backgroundColor: theme.primary }} />
                          <View style={{ flex: Math.max(1, bat2.runs || 0), backgroundColor: theme.secondaryContainer }} />
                        </View>
                      </>
                    )}
                  </View>
                </>
              );
            })()}
          </View>
        )}



        {/* Spacer */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {activeSubTab === 'live' && (
        <View style={[styles.stickyBottomBar, { backgroundColor: theme.surfaceLowest, borderTopColor: theme.outlineVariant + '22', flexDirection: 'row', gap: 12, alignItems: 'center' }]}>
          {/* Drop Match (Abandon/Cancel) */}
          <Pressable
            onPress={handleDropMatch}
            style={({ pressed }) => [
              styles.mainEndMatchBtn,
              {
                flex: 1,
                backgroundColor: theme.surfaceLow,
                borderWidth: 1.5,
                borderColor: '#ef444455',
                opacity: pressed ? 0.8 : 1,
              }
            ]}
          >
            <Ionicons name="trash-outline" size={17} color="#ef4444" style={{ marginRight: 6 }} />
            <ThemedText type="labelMd" style={{ color: '#ef4444', fontFamily: 'Sora_500Medium', fontSize: 13 }}>
              Drop Match
            </ThemedText>
          </Pressable>

          {/* End Match (Finalize & Popup) */}
          <Pressable
            onPress={handleEndMatch}
            disabled={isSyncing}
            style={({ pressed }) => [
              styles.mainEndMatchBtn,
              {
                flex: 1,
                backgroundColor: theme.error,
                opacity: pressed ? 0.85 : 1,
              },
              isSyncing && { opacity: 0.7 }
            ]}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="checkmark-done" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                <ThemedText type="labelMd" style={{ color: '#ffffff', fontFamily: 'Sora_500Medium', fontSize: 13 }}>
                  End Match
                </ThemedText>
              </>
            )}
          </Pressable>
        </View>
      )}

      {activeSubTab === 'scorecard' && (
        <View style={[styles.stickyBottomBar, { backgroundColor: theme.surfaceLowest, borderTopColor: theme.outlineVariant + '22', zIndex: 100 }]}>
          <Pressable
            onPress={handleExportPDF}
            style={({ pressed }) => [
              styles.mainEndMatchBtn,
              {
                flex: 1,
                backgroundColor: '#059669',
                opacity: pressed ? 0.85 : 1,
                gap: 8,
              }
            ]}
          >
            <Ionicons name="download-outline" size={18} color="#ffffff" />
            <ThemedText style={{ color: '#ffffff', fontFamily: 'Sora_600SemiBold', fontSize: 13 }}>
              Download Score Sheet PDF
            </ThemedText>
          </Pressable>
        </View>
      )}

      {/* Interactive Scoring Console Modal */}
      <Modal
        visible={showScoringModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowScoringModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowScoringModal(false)} />
          <View style={[styles.modalContent, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
            <View style={[styles.modalHeader, { justifyContent: 'flex-end', marginBottom: 12 }]}>
              <Pressable onPress={() => setShowScoringModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScrollContent}>
              {/* Copy of Current Over Log */}
              <View style={[styles.card, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33', marginBottom: Spacing.md }]}>
                <ThemedText type="labelMd" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
                  Current Over Log
                </ThemedText>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.logBallsRow}
                >
                  {overLog.map((ball, idx) => {
                    // Determine Ball Type and Color Scheme
                    let bgColor: string = theme.primary;
                    let textColor: string = '#ffffff';
                    let borderWidth = 0;
                    let borderColor = 'transparent';

                    const isWicket = ball === 'W';
                    const isDot = ball === '0';
                    const isFour = ball === '4';
                    const isSix = ball === '6';

                    if (isWicket) {
                      bgColor = '#EF4444'; // Red
                      textColor = '#ffffff';
                    } else if (isDot) {
                      bgColor = theme.surfaceLowest;
                      textColor = theme.textSecondary;
                      borderWidth = 1;
                      borderColor = theme.outlineVariant + '33';
                    } else if (isFour) {
                      bgColor = '#10B981'; // Green for 4
                      textColor = '#ffffff';
                    } else if (isSix) {
                      bgColor = '#8B5CF6'; // Purple for 6
                      textColor = '#ffffff';
                    } else if (ball.includes('WD')) {
                      bgColor = '#F59E0B'; // Amber for Wides
                      textColor = '#ffffff';
                    } else if (ball.includes('NB')) {
                      bgColor = '#F43F5E'; // Pink-red for No Balls
                      textColor = '#ffffff';
                    } else if (ball.includes('BYE') || ball.includes('LB')) {
                      bgColor = '#06B6D4'; // Teal for Byes/Leg-byes
                      textColor = '#ffffff';
                    } else {
                      // Default runs 1, 2, 3
                      bgColor = theme.primary;
                      textColor = '#ffffff';
                    }

                    // Parse content for rendering
                    const match = ball.match(/^(\d+)?(WD|NB|BYE|LB)$/);
                    let renderContent;

                    if (match) {
                      const num = match[1];
                      const type = match[2];
                      if (num === undefined) {
                        renderContent = (
                          <ThemedText
                            style={{
                              color: textColor,
                              fontFamily: 'Sora_500Medium',
                              fontSize: 12,
                            }}
                          >
                            {type}
                          </ThemedText>
                        );
                      } else {
                        renderContent = (
                          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center' }}>
                            <ThemedText
                              style={{
                                color: textColor,
                                fontFamily: 'Sora_500Medium',
                                fontSize: 14,
                              }}
                            >
                              {num}
                            </ThemedText>
                            <ThemedText
                              style={{
                                color: textColor,
                                fontFamily: 'Sora_500Medium',
                                fontSize: 8,
                                marginLeft: 1,
                              }}
                            >
                              {type}
                            </ThemedText>
                          </View>
                        );
                      }
                    } else {
                      renderContent = (
                        <ThemedText
                          type="bodyMd"
                          style={{
                            color: textColor,
                            fontFamily: 'Sora_500Medium',
                          }}
                        >
                          {ball}
                        </ThemedText>
                      );
                    }

                    return (
                      <View
                        key={idx}
                        style={[
                          styles.logBall,
                          {
                            backgroundColor: bgColor,
                            borderWidth,
                            borderColor,
                          },
                        ]}
                      >
                        {renderContent}
                      </View>
                    );
                  })}
                  {overLog.length === 0 && (
                    <ThemedText type="bodyMd" style={{ color: theme.textSecondary, italic: true } as any}>
                      Starting new over...
                    </ThemedText>
                  )}
                </ScrollView>

                <View style={[styles.bowlerNameRow, { borderTopColor: theme.outlineVariant + '1a', marginTop: Spacing.sm, paddingTop: Spacing.sm }]}>
                  <ThemedText style={{ color: theme.textSecondary, fontSize: 12, fontFamily: 'Sora_500Medium' }}>
                    Bowler: {bowler.name} ({((Number(bowler.overs) || 0) * 6) + (Number(bowler.ballsInOver) || 0)} balls)
                  </ThemedText>
                  <View style={styles.bowlerOverDots}>
                    {[1, 2, 3, 4, 5, 6].map((b) => (
                      <View
                        key={b}
                        style={[
                          styles.bowlerDot,
                          b <= ballsInCurrentOver
                            ? { backgroundColor: theme.primary }
                            : { backgroundColor: theme.outlineVariant + '33' },
                        ]}
                      />
                    ))}
                  </View>
                </View>
              </View>

              <ThemedText type="labelMd" style={{ color: theme.textSecondary, marginBottom: Spacing.md, letterSpacing: 0.5 }}>
                Runs Scored
              </ThemedText>

              <View style={styles.runsGrid}>
                {[0, 1, 2, 3, 4, 5, 6].map((num) => {
                  const isFourOrSix = num === 4 || num === 6;
                  const isFive = num === 5;
                  const label = num === 0 ? 'Dot' : num === 1 ? 'Single' : num === 2 ? 'Double' : num === 3 ? 'Triple' : num === 4 ? 'Four' : num === 5 ? 'Five' : 'Six';

                  return (
                    <Pressable
                      key={num}
                      onPress={() => recordBall('run', num)}
                      style={({ pressed }) => [
                        styles.scoringButton,
                        isFourOrSix
                          ? { backgroundColor: theme.secondaryContainer, borderBottomColor: theme.onSecondaryContainer }
                          : isFive
                            ? { backgroundColor: '#F59E0B18', borderBottomColor: '#F59E0B' }
                            : { backgroundColor: theme.surfaceLow, borderBottomColor: theme.primary },
                        pressed ? styles.scoringButtonPressed : styles.scoringButtonNormal,
                      ]}
                    >
                      <ThemedText type="headlineLg" style={{ color: isFourOrSix ? theme.onSecondaryContainer : isFive ? '#F59E0B' : theme.text }}>
                        {num}
                      </ThemedText>
                      <ThemedText type="labelSm" style={{ color: isFourOrSix ? theme.onSecondaryContainer + 'bb' : isFive ? '#F59E0B99' : theme.textSecondary }}>
                        {label}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>


              <ThemedText type="labelMd" style={{ color: theme.textSecondary, marginTop: Spacing.lg, marginBottom: Spacing.sm, letterSpacing: 0.5 }}>
                Extras
              </ThemedText>

              <View style={styles.extrasRow}>
                {['WD', 'NB', 'BYE', 'LB'].map((extra) => (
                  <Pressable
                    key={extra}
                    onPress={() => handleExtraClick(extra as 'WD' | 'NB' | 'BYE' | 'LB')}
                    onLongPress={() => {
                      setActiveExtraType(extra as 'WD' | 'NB' | 'BYE' | 'LB');
                      setShowExtraModal(true);
                    }}
                    style={[styles.extraButton, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant }]}
                  >
                    <ThemedText type="labelMd" style={{ fontFamily: 'Sora_500Medium', color: theme.text }}>
                      {extra === 'WD' ? 'Wide' : extra === 'NB' ? 'No Ball' : extra}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>

              <View style={styles.actionButtonsRow}>
                <Pressable
                  onPress={() => { setWicketRuns(0); setWicketWhoIsOut('striker'); setShowWicketModal(true); }}
                  style={[styles.wicketButton, { backgroundColor: theme.error }, Shadows.level2]}
                >
                  <Ionicons name="skull-outline" size={18} color="#ffffff" />
                  <ThemedText type="headlineSm" style={{ color: '#ffffff', marginLeft: 6 }}>
                    Wicket
                  </ThemedText>
                </Pressable>

                <Pressable
                  onPress={handleUndo}
                  disabled={history.length === 0}
                  style={[styles.undoButton, { backgroundColor: theme.primaryContainer }, history.length === 0 && { opacity: 0.5 }]}
                >
                  <Ionicons name="arrow-undo" size={20} color="#ffffff" />
                </Pressable>
              </View>
            </ScrollView>

            {/* Sticky bottom footer inside Runs Scored modal */}
            <View style={[styles.consoleFooter, { borderTopColor: theme.outlineVariant + '33', borderTopWidth: 1, paddingTop: Spacing.sm, marginTop: Spacing.sm, paddingBottom: 10 }]}>
              <View style={styles.footerLinkRow}>
                <Pressable style={styles.footerLink}>
                  <Ionicons name="help-circle-outline" size={16} color={theme.textSecondary} />
                  <ThemedText type="labelMd" style={{ color: theme.textSecondary, marginLeft: 4 }}>
                    Guidelines
                  </ThemedText>
                </Pressable>
                <Pressable style={styles.footerLink}>
                  <Ionicons name="flag-outline" size={16} color={theme.textSecondary} />
                  <ThemedText type="labelMd" style={{ color: theme.textSecondary, marginLeft: 4 }}>
                    Manual
                  </ThemedText>
                </Pressable>
              </View>

              <Pressable
                onPress={() => {
                  handleCompleteOver();
                  setShowScoringModal(false);
                }}
                style={[styles.completeOverBtn, { backgroundColor: theme.primary }]}
              >
                <ThemedText type="labelMd" style={{ color: theme.onPrimary }}>
                  Complete Over
                </ThemedText>
                <Ionicons name="arrow-forward" size={16} color={theme.onPrimary} style={{ marginLeft: 4 }} />
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Batsmen Scorecard Modal */}
      <Modal
        visible={showBatsmenModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBatsmenModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowBatsmenModal(false)} />
          <View style={[styles.modalContent, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="headlineSm" style={{ color: theme.text }}>Batsmen Scorecard</ThemedText>
              <Pressable onPress={() => setShowBatsmenModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScrollContent}>
              <View style={[styles.tableRow, { paddingVertical: 6, backgroundColor: theme.surfaceLow + '50', borderBottomWidth: 1, borderBottomColor: theme.outlineVariant + '33' }]}>
                <View style={[styles.batsmanNameCell, { width: '45%' }]}>
                  <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_500Medium' }}>Batsman</ThemedText>
                </View>
                <View style={[styles.batStatsCells, { flex: 1 }]}>
                  <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_500Medium' }}>R</ThemedText></View>
                  <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_500Medium' }}>B</ThemedText></View>
                  <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_500Medium' }}>4s</ThemedText></View>
                  <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_500Medium' }}>6s</ThemedText></View>
                  <View style={[styles.statCell, { width: 50 }]}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_500Medium', textAlign: 'center' }}>SR</ThemedText></View>
                </View>
              </View>

              {getFullBatsmenScorecard().map((b, idx) => {
                const sr = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '-';
                return (
                  <View
                    key={idx}
                    style={[
                      styles.tableRow,
                      { paddingVertical: 10 },
                      b.active && { backgroundColor: theme.secondaryContainer + '1a' }
                    ]}
                  >
                    <View style={[styles.batsmanNameCell, { width: '45%' }]}>
                      <View style={{ flex: 1 }}>
                        <ThemedText numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 13, fontFamily: 'Sora_500Medium', color: theme.text, flexShrink: 1 }}>
                          {b.name}
                        </ThemedText>
                        <ThemedText style={{ fontSize: 10, color: theme.textSecondary }}>
                          {b.status}
                        </ThemedText>
                      </View>
                    </View>
                    <View style={styles.batStatsCells}>
                      <View style={styles.statCell}>
                        <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_500Medium', color: theme.text }}>{b.runs}</ThemedText>
                      </View>
                      <View style={styles.statCell}>
                        <ThemedText style={{ fontSize: 12, color: theme.textSecondary }}>{b.balls}</ThemedText>
                      </View>
                      <View style={styles.statCell}>
                        <ThemedText style={{ fontSize: 12, color: theme.text }}>{b.fours}</ThemedText>
                      </View>
                      <View style={styles.statCell}>
                        <ThemedText style={{ fontSize: 12, color: theme.text }}>{b.sixes}</ThemedText>
                      </View>
                      <View style={[styles.statCell, { width: 50 }]}>
                        <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_500Medium', color: theme.text }}>{sr}</ThemedText>
                      </View>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bowlers Scorecard Modal */}
      <Modal
        visible={showBowlersModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBowlersModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowBowlersModal(false)} />
          <View style={[styles.modalContent, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="headlineSm" style={{ color: theme.text }}>Bowlers Scorecard</ThemedText>
              <Pressable onPress={() => setShowBowlersModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScrollContent}>
              <View style={[styles.tableRow, { paddingVertical: 6, backgroundColor: theme.surfaceLow + '50', borderBottomWidth: 1, borderBottomColor: theme.outlineVariant + '33' }]}>
                <View style={[styles.batsmanNameCell, { width: '45%' }]}>
                  <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_500Medium' }}>Bowler</ThemedText>
                </View>
                <View style={[styles.batStatsCells, { flex: 1 }]}>
                  <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_500Medium' }}>O</ThemedText></View>
                  <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_500Medium' }}>M</ThemedText></View>
                  <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_500Medium' }}>R</ThemedText></View>
                  <View style={styles.statCell}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_500Medium' }}>W</ThemedText></View>
                  <View style={[styles.statCell, { width: 50 }]}><ThemedText type="labelSm" style={{ color: theme.textSecondary, fontFamily: 'Sora_500Medium', textAlign: 'center' }}>ECON</ThemedText></View>
                </View>
              </View>

              {getFullBowlerScorecard().map((b, idx) => {
                const totalBalls = b.ballsInOver !== undefined ? (b.overs * 6 + b.ballsInOver) : (b.overs * 6);
                const econ = totalBalls > 0 ? ((b.runs / (totalBalls / 6))).toFixed(2) : '0.00';
                const oversDisplay = b.ballsInOver !== undefined ? `${b.overs}.${b.ballsInOver}` : `${b.overs}.0`;

                return (
                  <View
                    key={idx}
                    style={[
                      styles.tableRow,
                      { paddingVertical: 10 },
                      b.active && { backgroundColor: theme.secondaryContainer + '1a' }
                    ]}
                  >
                    <View style={[styles.batsmanNameCell, { width: '45%' }]}>
                      <ThemedText numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 13, fontFamily: 'Sora_500Medium', color: theme.text, flexShrink: 1 }}>
                        {b.name}
                      </ThemedText>
                    </View>
                    <View style={styles.batStatsCells}>
                      <View style={styles.statCell}>
                        <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_500Medium', color: theme.text }}>{oversDisplay}</ThemedText>
                      </View>
                      <View style={styles.statCell}>
                        <ThemedText style={{ fontSize: 12, color: theme.textSecondary }}>{b.maidens}</ThemedText>
                      </View>
                      <View style={styles.statCell}>
                        <ThemedText style={{ fontSize: 12, color: theme.text }}>{b.runs}</ThemedText>
                      </View>
                      <View style={styles.statCell}>
                        <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_500Medium', color: theme.text }}>{b.wickets}</ThemedText>
                      </View>
                      <View style={[styles.statCell, { width: 50 }]}>
                        <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_500Medium', color: theme.text }}>{econ}</ThemedText>
                      </View>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Full Team Roster Modal */}
      <Modal
        visible={showFullSquadModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFullSquadModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowFullSquadModal(false)} />
          <View style={[styles.modalContent, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="people" size={20} color={theme.primary} />
                <ThemedText type="headlineSm" style={{ color: theme.text }}>Full Playing Squad Roster</ThemedText>
              </View>
              <Pressable onPress={() => setShowFullSquadModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={theme.text} />
              </Pressable>
            </View>

            {/* Team Toggle (Team A vs Team B) */}
            <View style={{ flexDirection: 'row', backgroundColor: theme.surfaceLow, padding: 4, borderRadius: 10, marginBottom: 14 }}>
              <Pressable
                onPress={() => setSquadTab('A')}
                style={[{ flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: 'center' }, squadTab === 'A' && { backgroundColor: theme.primary }]}
              >
                <ThemedText style={[{ fontSize: 12, fontFamily: 'Sora_500Medium', color: theme.textSecondary }, squadTab === 'A' && { color: '#ffffff' }]}>
                  {teamA} Squad
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={() => setSquadTab('B')}
                style={[{ flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: 'center' }, squadTab === 'B' && { backgroundColor: theme.primary }]}
              >
                <ThemedText style={[{ fontSize: 12, fontFamily: 'Sora_500Medium', color: theme.textSecondary }, squadTab === 'B' && { color: '#ffffff' }]}>
                  {teamB} Squad
                </ThemedText>
              </Pressable>
            </View>

            {/* Add New Player Form (Image Upload + Name + Mobile Number) */}
            <View style={{ backgroundColor: theme.surfaceLow, borderRadius: 12, padding: 12, marginBottom: 14 }}>
              <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_500Medium', color: theme.textSecondary, marginBottom: 10, textTransform: 'uppercase' }}>
                + Add Player to {squadTab === 'A' ? teamA : teamB}
              </ThemedText>

              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                {/* Photo Upload Avatar Button */}
                <Pressable
                  onPress={pickSquadPlayerImage}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: theme.primary + '14',
                    borderWidth: 1.5,
                    borderColor: theme.primary + '44',
                    justifyContent: 'center',
                    alignItems: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {newSquadPlayerImage ? (
                    <Image source={{ uri: newSquadPlayerImage }} style={{ width: 64, height: 64 }} contentFit="cover" />
                  ) : (
                    <View style={{ alignItems: 'center' }}>
                      <Ionicons name="camera" size={20} color={theme.primary} />
                      <ThemedText style={{ fontSize: 8.5, color: theme.primary, fontFamily: 'Sora_500Medium', marginTop: 2 }}>Photo</ThemedText>
                    </View>
                  )}
                </Pressable>

                {/* Name & Mobile Inputs Column */}
                <View style={{ flex: 1, gap: 8 }}>
                  <TextInput
                    value={newSquadPlayerName}
                    onChangeText={setNewSquadPlayerName}
                    placeholder="Full Player Name *"
                    placeholderTextColor="#94a3b8"
                    style={{
                      backgroundColor: theme.surfaceLowest,
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      height: 36,
                      fontSize: 12,
                      color: theme.text,
                      borderWidth: 1,
                      borderColor: theme.outlineVariant + '44',
                    }}
                  />

                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TextInput
                      value={newSquadPlayerMobile}
                      onChangeText={(val) => setNewSquadPlayerMobile(val.replace(/[^0-9]/g, ''))}
                      placeholder="Mobile (10 Digits) *"
                      placeholderTextColor="#94a3b8"
                      keyboardType="phone-pad"
                      maxLength={10}
                      style={{
                        flex: 1,
                        backgroundColor: theme.surfaceLowest,
                        borderRadius: 8,
                        paddingHorizontal: 10,
                        height: 36,
                        fontSize: 12,
                        color: theme.text,
                        borderWidth: 1,
                        borderColor: theme.outlineVariant + '44',
                      }}
                    />

                    <Pressable
                      onPress={() => {
                        if (!newSquadPlayerName.trim()) {
                          Alert.alert('Validation Error', 'Please enter player full name.');
                          return;
                        }
                        if (newSquadPlayerMobile.trim() && newSquadPlayerMobile.trim().length !== 10) {
                          Alert.alert('Validation Error', 'Mobile number must be exactly 10 digits.');
                          return;
                        }
                        const name = newSquadPlayerName.trim();
                        const mobile = newSquadPlayerMobile.trim();
                        const avatar = newSquadPlayerImage || undefined;
                        const playerObj = { name, mobile, avatar, role: newSquadPlayerRole };
                        const targetTeam = squadTab === 'A' ? teamA : teamB;

                        // Canonical squad registration helper
                        registerPlayerToSquad(targetTeam, playerObj);

                        setNewSquadPlayerName('');
                        setNewSquadPlayerMobile('');
                        setNewSquadPlayerImage(null);
                        Alert.alert('Success', `${name} added to ${targetTeam} squad!`);
                      }}
                      style={{
                        backgroundColor: theme.primary,
                        paddingHorizontal: 14,
                        height: 36,
                        borderRadius: 8,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <ThemedText style={{ color: '#ffffff', fontSize: 11.5, fontFamily: 'Sora_500Medium' }}>
                        + Add
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>

            {/* Full Squad Roster List */}
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 10 }}>
              {squadTab === 'A' ? (
                <View style={{ gap: 8 }}>
                  <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_500Medium', color: theme.primary, textTransform: 'uppercase', marginBottom: 2 }}>
                    Active Playing XI ({batsmen.length + yetToBatBatsmen.length} Players)
                  </ThemedText>

                  {/* Playing Batsmen */}
                  {batsmen.map((b, idx) => (
                    <View key={`bat-${idx}`} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.surfaceLow, padding: 10, borderRadius: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginRight: 8 }}>
                        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: theme.primary + '20', justifyContent: 'center', alignItems: 'center' }}>
                          <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_700Bold', color: theme.primary }}>{getTwoLetterLogo(b.name || 'Player')}</ThemedText>
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <ThemedText numberOfLines={1} style={{ fontSize: 13, fontFamily: 'Sora_500Medium', color: theme.text }}>{b.name} {b.active ? '★ (Striker)' : ''}</ThemedText>
                          <ThemedText numberOfLines={1} style={{ fontSize: 10, color: theme.textSecondary }}>{b.runs} runs ({b.balls} balls) · {b.fours}x4 {b.sixes}x6</ThemedText>
                        </View>
                      </View>
                      <View style={{ backgroundColor: theme.primary + '15', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 }}>
                        <ThemedText style={{ fontSize: 9, color: theme.primary, fontFamily: 'Sora_500Medium' }}>{b.outInfo ? b.outInfo : 'ON PITCH'}</ThemedText>
                      </View>
                    </View>
                  ))}

                  {/* Yet to Bat Squad */}
                  {yetToBatBatsmen.map((b, idx) => (
                    <View key={`bench-${idx}`} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.surfaceLow, padding: 10, borderRadius: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginRight: 8 }}>
                        {b.avatar ? (
                          <Image source={{ uri: b.avatar }} style={{ width: 30, height: 30, borderRadius: 15 }} contentFit="cover" />
                        ) : (
                          <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#64748b20', justifyContent: 'center', alignItems: 'center' }}>
                            <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_700Bold', color: '#64748b' }}>{getTwoLetterLogo(b.name || 'Player')}</ThemedText>
                          </View>
                        )}
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <ThemedText numberOfLines={1} style={{ fontSize: 13, fontFamily: 'Sora_500Medium', color: theme.text }}>{b.name}</ThemedText>
                          <ThemedText numberOfLines={1} style={{ fontSize: 10, color: theme.textSecondary }}>
                            {b.mobile ? `📱 ${b.mobile} · ` : ''}In Squad · Yet to bat
                          </ThemedText>
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        <Pressable
                          onPress={() => {
                            sendInBatsman(b.name, 0);
                            setShowFullSquadModal(false);
                          }}
                          style={{ backgroundColor: theme.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}
                        >
                          <ThemedText style={{ fontSize: 9.5, color: '#ffffff', fontFamily: 'Sora_500Medium' }}>Striker</ThemedText>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            sendInBatsman(b.name, 1);
                            setShowFullSquadModal(false);
                          }}
                          style={{ backgroundColor: theme.secondary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}
                        >
                          <ThemedText style={{ fontSize: 9.5, color: '#ffffff', fontFamily: 'Sora_500Medium' }}>Non-Striker</ThemedText>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                  {(batsmen.length === 0 && yetToBatBatsmen.length === 0) && (
                    <ThemedText style={{ color: theme.textSecondary, fontSize: 11, fontStyle: 'italic', paddingVertical: 8 }}>No squad members added yet for {teamA}.</ThemedText>
                  )}
                </View>
              ) : (
                <View style={{ gap: 8 }}>
                  <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_500Medium', color: theme.secondary, textTransform: 'uppercase', marginBottom: 2 }}>
                    Bowling Squad ({bowler.name ? 1 + otherBowlers.filter(b => b.name.toLowerCase() !== bowler.name.toLowerCase()).length : otherBowlers.length} Players)
                  </ThemedText>

                  {/* Current Bowler */}
                  {bowler.name ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.secondaryContainer + '1a', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: theme.secondaryContainer }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: theme.secondary, justifyContent: 'center', alignItems: 'center' }}>
                          <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_700Bold', color: '#ffffff' }}>{getTwoLetterLogo(bowler.name || 'Bowler')}</ThemedText>
                        </View>
                        <View>
                          <ThemedText style={{ fontSize: 13, fontFamily: 'Sora_500Medium', color: theme.text }}>{bowler.name} (Current Bowler)</ThemedText>
                          <ThemedText style={{ fontSize: 10, color: theme.textSecondary }}>{bowler.overs}.{bowler.ballsInOver} overs · {bowler.wickets} wickets · {bowler.runs} runs</ThemedText>
                        </View>
                      </View>
                      <View style={{ backgroundColor: theme.secondary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 }}>
                        <ThemedText style={{ fontSize: 9, color: '#ffffff', fontFamily: 'Sora_500Medium' }}>BOWLING</ThemedText>
                      </View>
                    </View>
                  ) : null}

                  {/* Other Bowlers Bench */}
                  {otherBowlers.filter(b => !bowler.name || b.name.toLowerCase() !== bowler.name.toLowerCase()).map((b, idx) => (
                    <View key={`bowler-${idx}`} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.surfaceLow, padding: 10, borderRadius: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginRight: 8 }}>
                        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#64748b20', justifyContent: 'center', alignItems: 'center' }}>
                          <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_700Bold', color: '#64748b' }}>{getTwoLetterLogo(b.name || 'Player')}</ThemedText>
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <ThemedText numberOfLines={1} style={{ fontSize: 13, fontFamily: 'Sora_500Medium', color: theme.text }}>{b.name}</ThemedText>
                          <ThemedText numberOfLines={1} style={{ fontSize: 10, color: theme.textSecondary }}>In Squad · Bowler</ThemedText>
                        </View>
                      </View>
                      <Pressable
                        onPress={() => {
                          executeReplaceBowler(b.name);
                          setShowFullSquadModal(false);
                        }}
                        style={{ backgroundColor: theme.secondary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}
                      >
                        <ThemedText style={{ fontSize: 9.5, color: '#ffffff', fontFamily: 'Sora_500Medium' }}>Assign Bowler</ThemedText>
                      </Pressable>
                    </View>
                  ))}
                  {(!bowler.name && otherBowlers.length === 0) && (
                    <ThemedText style={{ color: theme.textSecondary, fontSize: 11, fontStyle: 'italic', paddingVertical: 8 }}>No squad members added yet for {teamB}.</ThemedText>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Quick Add Player Modal from Manage Match Players Header Bar */}
      <NewPlayerModal
        visible={showManageNewPlayerModal}
        onClose={() => {
          setShowManageNewPlayerModal(false);
          setManagePlayerSearchSeed('');
        }}
        theme={theme}
        initialSearchQuery={managePlayerSearchSeed}
        onSave={(newPlayer) => {
          // Register in canonical squad and FoF network
          const currentBatTeam = battingTeamName || teamA;
          registerPlayerToSquad(currentBatTeam, newPlayer);

          // Auto-fill active pitch slots if empty
          if (!b1Name.trim()) {
            setB1Name(newPlayer.name);
            if (newPlayer.avatar) setB1Avatar(newPlayer.avatar);
          } else if (!b2Name.trim()) {
            setB2Name(newPlayer.name);
            if (newPlayer.avatar) setB2Avatar(newPlayer.avatar);
          } else if (!bowlName.trim()) {
            setBowlName(newPlayer.name);
            if (newPlayer.avatar) setBowlAvatar(newPlayer.avatar);
          }
        }}
      />

      {/* Wicket Detail Modal — one tap for a normal dismissal, or record a run
          out with the runs completed and which batsman was out. */}
      {/* Comprehensive Cricket Dismissal Modal */}
      <Modal
        visible={showWicketModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWicketModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowWicketModal(false)} />
          <View style={[styles.modalContent, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <ThemedText type="headlineSm" style={{ color: theme.text }}>Record Wicket</ThemedText>
                <ThemedText style={{ fontSize: 11, color: theme.textSecondary, marginTop: 2 }}>
                  Select dismissal type, fielder, and batsman out
                </ThemedText>
              </View>
              <Pressable onPress={() => setShowWicketModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
              {/* 1. DISMISSAL TYPE SELECTION */}
              <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_500Medium', color: theme.textSecondary, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>
                SELECT DISMISSAL TYPE:
              </ThemedText>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                {[
                  { key: 'bowled', label: 'Bowled', desc: `b ${bowler.name || 'Bowler'}`, icon: 'shield-outline' as const, color: '#EF4444' },
                  { key: 'caught', label: 'Caught', desc: 'c Fielder b Bowler', icon: 'hand-left-outline' as const, color: '#F59E0B' },
                  { key: 'caught_and_bowled', label: 'Caught & Bowled', desc: `c & b ${bowler.name || 'Bowler'}`, icon: 'fitness-outline' as const, color: '#8B5CF6' },
                  { key: 'lbw', label: 'LBW', desc: `lbw b ${bowler.name || 'Bowler'}`, icon: 'body-outline' as const, color: '#EC4899' },
                  { key: 'run_out', label: 'Run Out', desc: 'run out (Fielder)', icon: 'flash-outline' as const, color: '#3B82F6' },
                  { key: 'stumped', label: 'Stumped', desc: 'st Keeper b Bowler', icon: 'hand-right-outline' as const, color: '#10B981' },
                  { key: 'hit_wicket', label: 'Hit Wicket', desc: `hit wicket b ${bowler.name || 'Bowler'}`, icon: 'alert-circle-outline' as const, color: '#64748B' },
                  { key: 'retired', label: 'Retired', desc: 'Retired hurt / out', icon: 'exit-outline' as const, color: '#6B7280' },
                ].map(item => {
                  const isSelected = wicketDismissalType === item.key;
                  return (
                    <Pressable
                      key={item.key}
                      onPress={() => {
                        setWicketDismissalType(item.key as any);
                        if (item.key === 'caught_and_bowled') {
                          setWicketFielderName(bowler.name || 'Bowler');
                        } else if (item.key === 'bowled' || item.key === 'lbw' || item.key === 'hit_wicket') {
                          setWicketFielderName('');
                        }
                      }}
                      style={{
                        width: '48.5%',
                        paddingVertical: 10,
                        paddingHorizontal: 12,
                        borderRadius: 10,
                        borderWidth: 1.5,
                        borderColor: isSelected ? item.color : theme.outlineVariant + '33',
                        backgroundColor: isSelected ? item.color + '18' : theme.surfaceLow,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: isSelected ? item.color : item.color + '22', justifyContent: 'center', alignItems: 'center' }}>
                        <Ionicons name={item.icon} size={15} color={isSelected ? '#ffffff' : item.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <ThemedText numberOfLines={1} style={{ fontFamily: 'Sora_500Medium', fontSize: 12, color: isSelected ? item.color : theme.text }}>
                          {item.label}
                        </ThemedText>
                        <ThemedText numberOfLines={1} style={{ fontSize: 9.5, color: theme.textSecondary }}>
                          {item.desc}
                        </ThemedText>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {/* 2. CONTEXTUAL SECTIONS */}

              {/* A. CAUGHT FIELDER PICKER */}
              {wicketDismissalType === 'caught' && (
                <View style={{ backgroundColor: theme.surfaceLow, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: theme.outlineVariant + '33', marginBottom: 14 }}>
                  <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_500Medium', color: theme.textSecondary, textTransform: 'uppercase', marginBottom: 8 }}>
                    WHO TOOK THE CATCH?
                  </ThemedText>

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                    {/* Wicket-Keeper Chip */}
                    <Pressable
                      onPress={() => setWicketFielderName('Wicket-Keeper')}
                      style={{
                        paddingVertical: 6,
                        paddingHorizontal: 10,
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: wicketFielderName === 'Wicket-Keeper' ? '#F59E0B' : theme.outlineVariant + '44',
                        backgroundColor: wicketFielderName === 'Wicket-Keeper' ? '#F59E0B20' : theme.surfaceLowest,
                      }}
                    >
                      <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: wicketFielderName === 'Wicket-Keeper' ? '#D97706' : theme.text }}>
                        🧤 Wicket-Keeper
                      </ThemedText>
                    </Pressable>

                    {/* Bowler Chip */}
                    {bowler.name ? (
                      <Pressable
                        onPress={() => setWicketFielderName(bowler.name)}
                        style={{
                          paddingVertical: 6,
                          paddingHorizontal: 10,
                          borderRadius: 6,
                          borderWidth: 1,
                          borderColor: wicketFielderName === bowler.name ? '#F59E0B' : theme.outlineVariant + '44',
                          backgroundColor: wicketFielderName === bowler.name ? '#F59E0B20' : theme.surfaceLowest,
                        }}
                      >
                        <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: wicketFielderName === bowler.name ? '#D97706' : theme.text }}>
                          🎯 {bowler.name} (C&B)
                        </ThemedText>
                      </Pressable>
                    ) : null}

                    {/* Fielding Team Squad Chips */}
                    {otherBowlers.map((p, idx) => {
                      const pName = typeof p === 'string' ? p : p.name;
                      if (!pName || pName === bowler.name) return null;
                      const isChosen = wicketFielderName === pName;
                      return (
                        <Pressable
                          key={idx}
                          onPress={() => setWicketFielderName(pName)}
                          style={{
                            paddingVertical: 6,
                            paddingHorizontal: 10,
                            borderRadius: 6,
                            borderWidth: 1,
                            borderColor: isChosen ? '#F59E0B' : theme.outlineVariant + '44',
                            backgroundColor: isChosen ? '#F59E0B20' : theme.surfaceLowest,
                          }}
                        >
                          <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: isChosen ? '#D97706' : theme.text }}>
                            {pName}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>

                  <TextInput
                    style={{
                      height: 38,
                      borderWidth: 1,
                      borderColor: theme.outlineVariant + '55',
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      fontSize: 12,
                      color: theme.text,
                      backgroundColor: theme.surfaceLowest,
                    }}
                    placeholder="Or enter custom fielder name..."
                    placeholderTextColor={theme.textSecondary + '99'}
                    value={wicketFielderName}
                    onChangeText={setWicketFielderName}
                  />
                </View>
              )}

              {/* B. STUMPED KEEPER / FIELDER PICKER */}
              {wicketDismissalType === 'stumped' && (
                <View style={{ backgroundColor: theme.surfaceLow, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: theme.outlineVariant + '33', marginBottom: 14 }}>
                  <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_500Medium', color: theme.textSecondary, textTransform: 'uppercase', marginBottom: 8 }}>
                    STUMPED BY (WICKET-KEEPER)
                  </ThemedText>

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                    <Pressable
                      onPress={() => setWicketFielderName('Wicket-Keeper')}
                      style={{
                        paddingVertical: 6,
                        paddingHorizontal: 10,
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: wicketFielderName === 'Wicket-Keeper' ? '#10B981' : theme.outlineVariant + '44',
                        backgroundColor: wicketFielderName === 'Wicket-Keeper' ? '#10B98120' : theme.surfaceLowest,
                      }}
                    >
                      <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: wicketFielderName === 'Wicket-Keeper' ? '#059669' : theme.text }}>
                        🧤 Wicket-Keeper
                      </ThemedText>
                    </Pressable>

                    {otherBowlers.map((p, idx) => {
                      const pName = typeof p === 'string' ? p : p.name;
                      if (!pName) return null;
                      const isChosen = wicketFielderName === pName;
                      return (
                        <Pressable
                          key={idx}
                          onPress={() => setWicketFielderName(pName)}
                          style={{
                            paddingVertical: 6,
                            paddingHorizontal: 10,
                            borderRadius: 6,
                            borderWidth: 1,
                            borderColor: isChosen ? '#10B981' : theme.outlineVariant + '44',
                            backgroundColor: isChosen ? '#10B98120' : theme.surfaceLowest,
                          }}
                        >
                          <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: isChosen ? '#059669' : theme.text }}>
                            {pName}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>

                  <TextInput
                    style={{
                      height: 38,
                      borderWidth: 1,
                      borderColor: theme.outlineVariant + '55',
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      fontSize: 12,
                      color: theme.text,
                      backgroundColor: theme.surfaceLowest,
                    }}
                    placeholder="Or enter wicket-keeper name..."
                    placeholderTextColor={theme.textSecondary + '99'}
                    value={wicketFielderName}
                    onChangeText={setWicketFielderName}
                  />
                </View>
              )}

              {/* C. RUN OUT DETAILS */}
              {wicketDismissalType === 'run_out' && (
                <View style={{ backgroundColor: theme.surfaceLow, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: theme.outlineVariant + '33', marginBottom: 14 }}>
                  <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_500Medium', color: theme.textSecondary, textTransform: 'uppercase', marginBottom: 6 }}>
                    RUNS COMPLETED BEFORE RUN OUT:
                  </ThemedText>
                  <View style={{ flexDirection: 'row', gap: 6, marginBottom: isWicketCustomRunsMode ? 8 : 12 }}>
                    {[0, 1, 2, 3, 4].map((r) => {
                      const active = !isWicketCustomRunsMode && wicketRuns === r;
                      return (
                        <Pressable
                          key={r}
                          onPress={() => {
                            setIsWicketCustomRunsMode(false);
                            setWicketRuns(r);
                          }}
                          style={{
                            flex: 1,
                            paddingVertical: 8,
                            borderRadius: 8,
                            alignItems: 'center',
                            borderWidth: 1.5,
                            borderColor: active ? '#3B82F6' : theme.outlineVariant + '44',
                            backgroundColor: active ? '#3B82F6' : theme.surfaceLowest,
                          }}
                        >
                          <ThemedText style={{ fontFamily: 'Sora_500Medium', color: active ? '#ffffff' : theme.text }}>{r}</ThemedText>
                        </Pressable>
                      );
                    })}
                    <Pressable
                      onPress={() => setIsWicketCustomRunsMode(true)}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 8,
                        borderRadius: 8,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1.5,
                        borderColor: isWicketCustomRunsMode ? '#3B82F6' : theme.outlineVariant + '44',
                        backgroundColor: isWicketCustomRunsMode ? '#3B82F618' : theme.surfaceLowest,
                      }}
                    >
                      <ThemedText style={{ fontFamily: 'Sora_500Medium', fontSize: 11, color: isWicketCustomRunsMode ? '#2563EB' : theme.text }}>
                        Custom
                      </ThemedText>
                    </Pressable>
                  </View>

                  {isWicketCustomRunsMode && (
                    <TextInput
                      style={{
                        height: 38,
                        borderWidth: 1,
                        borderColor: '#3B82F6',
                        borderRadius: 8,
                        paddingHorizontal: 10,
                        fontSize: 13,
                        color: theme.text,
                        backgroundColor: theme.surfaceLowest,
                        marginBottom: 12,
                      }}
                      placeholder="Enter custom runs completed..."
                      placeholderTextColor={theme.textSecondary + '99'}
                      keyboardType="number-pad"
                      autoFocus
                      value={wicketCustomRunsText}
                      onChangeText={(t) => {
                        const cleaned = t.replace(/[^0-9]/g, '').slice(0, 2);
                        setWicketCustomRunsText(cleaned);
                        const n = parseInt(cleaned, 10);
                        setWicketRuns(isNaN(n) ? 0 : n);
                      }}
                    />
                  )}

                  <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_500Medium', color: theme.textSecondary, textTransform: 'uppercase', marginBottom: 6 }}>
                    WHO WAS RUN OUT?
                  </ThemedText>
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                    {(['striker', 'non-striker'] as const).map(who => {
                      const active = wicketWhoIsOut === who;
                      const player = batsmen.find(b => (who === 'striker' ? b.active : !b.active));
                      return (
                        <Pressable
                          key={who}
                          onPress={() => setWicketWhoIsOut(who)}
                          style={{
                            flex: 1,
                            paddingVertical: 8,
                            paddingHorizontal: 8,
                            borderRadius: 8,
                            alignItems: 'center',
                            borderWidth: 1.5,
                            borderColor: active ? '#3B82F6' : theme.outlineVariant + '44',
                            backgroundColor: active ? '#3B82F618' : theme.surfaceLowest,
                          }}
                        >
                          <ThemedText numberOfLines={1} style={{ fontFamily: 'Sora_500Medium', fontSize: 11.5, color: active ? '#2563EB' : theme.text }}>
                            {who === 'striker' ? 'Striker' : 'Non-striker'}
                          </ThemedText>
                          <ThemedText numberOfLines={1} style={{ fontSize: 10, color: theme.textSecondary }}>
                            {player?.name || '—'}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>

                  <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_500Medium', color: theme.textSecondary, textTransform: 'uppercase', marginBottom: 6 }}>
                    RUN OUT AFFECTED BY:
                  </ThemedText>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                    {['Direct Hit', 'Wicket-Keeper', bowler.name].filter(Boolean).map((specialName, sIdx) => {
                      const isChosen = wicketFielderName === specialName;
                      return (
                        <Pressable
                          key={sIdx}
                          onPress={() => setWicketFielderName(specialName!)}
                          style={{
                            paddingVertical: 6,
                            paddingHorizontal: 10,
                            borderRadius: 6,
                            borderWidth: 1,
                            borderColor: isChosen ? '#3B82F6' : theme.outlineVariant + '44',
                            backgroundColor: isChosen ? '#3B82F620' : theme.surfaceLowest,
                          }}
                        >
                          <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: isChosen ? '#2563EB' : theme.text }}>
                            {specialName}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                    {otherBowlers.map((p, idx) => {
                      const pName = typeof p === 'string' ? p : p.name;
                      if (!pName || pName === bowler.name) return null;
                      const isChosen = wicketFielderName === pName;
                      return (
                        <Pressable
                          key={idx}
                          onPress={() => setWicketFielderName(pName)}
                          style={{
                            paddingVertical: 6,
                            paddingHorizontal: 10,
                            borderRadius: 6,
                            borderWidth: 1,
                            borderColor: isChosen ? '#3B82F6' : theme.outlineVariant + '44',
                            backgroundColor: isChosen ? '#3B82F620' : theme.surfaceLowest,
                          }}
                        >
                          <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: isChosen ? '#2563EB' : theme.text }}>
                            {pName}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                  <TextInput
                    style={{
                      height: 38,
                      borderWidth: 1,
                      borderColor: theme.outlineVariant + '55',
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      fontSize: 12,
                      color: theme.text,
                      backgroundColor: theme.surfaceLowest,
                    }}
                    placeholder="Or enter fielder / thrower name..."
                    placeholderTextColor={theme.textSecondary + '99'}
                    value={wicketFielderName}
                    onChangeText={setWicketFielderName}
                  />
                </View>
              )}

              {/* D. RETIRED BATSMAN PICKER */}
              {wicketDismissalType === 'retired' && (
                <View style={{ backgroundColor: theme.surfaceLow, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: theme.outlineVariant + '33', marginBottom: 14 }}>
                  <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_500Medium', color: theme.textSecondary, textTransform: 'uppercase', marginBottom: 6 }}>
                    WHO IS RETIRING?
                  </ThemedText>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {(['striker', 'non-striker'] as const).map(who => {
                      const active = wicketWhoIsOut === who;
                      const player = batsmen.find(b => (who === 'striker' ? b.active : !b.active));
                      return (
                        <Pressable
                          key={who}
                          onPress={() => setWicketWhoIsOut(who)}
                          style={{
                            flex: 1,
                            paddingVertical: 8,
                            paddingHorizontal: 8,
                            borderRadius: 8,
                            alignItems: 'center',
                            borderWidth: 1.5,
                            borderColor: active ? '#6B7280' : theme.outlineVariant + '44',
                            backgroundColor: active ? '#6B728020' : theme.surfaceLowest,
                          }}
                        >
                          <ThemedText numberOfLines={1} style={{ fontFamily: 'Sora_500Medium', fontSize: 11.5, color: active ? '#374151' : theme.text }}>
                            {who === 'striker' ? 'Striker' : 'Non-striker'}
                          </ThemedText>
                          <ThemedText numberOfLines={1} style={{ fontSize: 10, color: theme.textSecondary }}>
                            {player?.name || '—'}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* 3. SCORECARD PREVIEW SUMMARY CARD */}
              <View style={{ backgroundColor: theme.primary + '12', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: theme.primary + '33', marginBottom: 16 }}>
                <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_500Medium', color: theme.primary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                  SCORECARD ENTRY PREVIEW
                </ThemedText>
                <ThemedText style={{ fontFamily: 'Sora_500Medium', fontSize: 14, color: theme.text }}>
                  {(() => {
                    const dismissed = batsmen.find(b => (wicketDismissalType === 'run_out' || wicketDismissalType === 'retired' ? (wicketWhoIsOut === 'striker' ? b.active : !b.active) : b.active));
                    return dismissed?.name || 'Striker';
                  })()}
                </ThemedText>
                <ThemedText style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2, fontStyle: 'italic' }}>
                  {(() => {
                    const fName = wicketFielderName.trim();
                    const bName = bowler.name || 'Bowler';
                    if (wicketDismissalType === 'bowled') return `b ${bName}`;
                    if (wicketDismissalType === 'caught') return fName ? `c ${fName} b ${bName}` : `c & b ${bName}`;
                    if (wicketDismissalType === 'caught_and_bowled') return `c & b ${bName}`;
                    if (wicketDismissalType === 'lbw') return `lbw b ${bName}`;
                    if (wicketDismissalType === 'stumped') return fName ? `st ${fName} b ${bName}` : `st b ${bName}`;
                    if (wicketDismissalType === 'run_out') return fName ? `run out (${fName})${wicketRuns > 0 ? ` · +${wicketRuns} run${wicketRuns === 1 ? '' : 's'}` : ''}` : `run out${wicketRuns > 0 ? ` · +${wicketRuns} run${wicketRuns === 1 ? '' : 's'}` : ''}`;
                    if (wicketDismissalType === 'hit_wicket') return `hit wicket b ${bName}`;
                    if (wicketDismissalType === 'retired') return `retired`;
                    return `b ${bName}`;
                  })()}
                </ThemedText>
              </View>

              {/* 4. CONFIRM BUTTON */}
              <Pressable
                style={[styles.extraOptionBtn, { backgroundColor: theme.primary, borderColor: theme.primary, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' }]}
                onPress={() => {
                  setShowWicketModal(false);
                  recordBall('wicket', 'W', {
                    dismissalType: wicketDismissalType,
                    fielderName: wicketFielderName.trim(),
                    runsCompleted: wicketDismissalType === 'run_out' ? wicketRuns : 0,
                    whoIsOut: wicketDismissalType === 'run_out' || wicketDismissalType === 'retired' ? wicketWhoIsOut : 'striker',
                    creditBowler: wicketDismissalType !== 'run_out' && wicketDismissalType !== 'retired',
                  });
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#ffffff" />
                  <ThemedText style={{ fontFamily: 'Sora_500Medium', color: '#ffffff', fontSize: 14 }}>
                    Confirm & Record Wicket
                  </ThemedText>
                </View>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Extra Runs Selection Modal with 1 2 3 Numeric Keypad & Custom Enter ── */}
      <Modal
        visible={showExtraModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowExtraModal(false);
          setActiveExtraType(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => {
              setShowExtraModal(false);
              setActiveExtraType(null);
            }}
          />
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.surfaceLowest,
                borderColor: theme.outlineVariant + '33',
                maxHeight: '85%',
                width: '92%',
                maxWidth: 440,
                alignSelf: 'center',
                borderRadius: 16,
                padding: 18,
              },
            ]}
          >
            <View style={[styles.modalHeader, { paddingBottom: 10, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.outlineVariant + '22' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    backgroundColor:
                      activeExtraType === 'WD' ? '#F59E0B20' :
                      activeExtraType === 'NB' ? '#EF444420' :
                      theme.primary + '20',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ThemedText
                    style={{
                      fontFamily: 'Sora_700Bold',
                      fontSize: 13,
                      color:
                        activeExtraType === 'WD' ? '#F59E0B' :
                        activeExtraType === 'NB' ? '#EF4444' :
                        theme.primary,
                    }}
                  >
                    {activeExtraType || 'EX'}
                  </ThemedText>
                </View>
                <View>
                  <ThemedText type="headlineSm" style={{ color: theme.text, fontSize: 16 }}>
                    {activeExtraType === 'WD' ? 'Record Wide Ball' :
                      activeExtraType === 'NB' ? 'Record No Ball' :
                        activeExtraType === 'BYE' ? 'Record Bye' : 'Record Leg Bye'}
                  </ThemedText>
                  <ThemedText style={{ fontSize: 11, color: theme.textSecondary, marginTop: 1 }}>
                    {activeExtraType === 'WD' ? '1 extra run + additional runs/overthrows' :
                      activeExtraType === 'NB' ? '1 extra run + runs scored off the bat' :
                        'Legal delivery with bye / leg-bye runs'}
                  </ThemedText>
                </View>
              </View>
              <Pressable
                onPress={() => {
                  setShowExtraModal(false);
                  setActiveExtraType(null);
                }}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 12 }} keyboardShouldPersistTaps="handled">
              {/* Numeric Keypad Grid */}
              <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: theme.textSecondary, textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.5 }}>
                {activeExtraType === 'WD' ? 'SELECT OVERTHROW / EXTRA RUNS:' :
                  activeExtraType === 'NB' ? 'SELECT RUNS OFF BAT (STRIKER):' :
                    'SELECT RUNS SCORED:'}
              </ThemedText>

              {/* Number Chips 0, 1, 2, 3, 4, 6, Custom */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                {(() => {
                  const options: { value: number; label: string; sub?: string }[] =
                    activeExtraType === 'WD'
                      ? [
                          { value: 0, label: '0', sub: 'WD Only' },
                          { value: 1, label: '1', sub: '+1 Run' },
                          { value: 2, label: '2', sub: '+2 Runs' },
                          { value: 3, label: '3', sub: '+3 Runs' },
                          { value: 4, label: '4', sub: 'Boundary' },
                        ]
                      : activeExtraType === 'NB'
                      ? [
                          { value: 0, label: '0', sub: 'NB Only' },
                          { value: 1, label: '1', sub: '1 Run' },
                          { value: 2, label: '2', sub: '2 Runs' },
                          { value: 3, label: '3', sub: '3 Runs' },
                          { value: 4, label: '4', sub: 'Four' },
                          { value: 6, label: '6', sub: 'Six!' },
                        ]
                      : [
                          { value: 1, label: '1', sub: '1 Run' },
                          { value: 2, label: '2', sub: '2 Runs' },
                          { value: 3, label: '3', sub: '3 Runs' },
                          { value: 4, label: '4', sub: 'Four' },
                          { value: 6, label: '6', sub: 'Six' },
                        ];

                  return options.map((opt) => {
                    const isSelected = !isExtraCustomMode && extraRunsInput === opt.value;
                    const accentColor =
                      activeExtraType === 'WD' ? '#F59E0B' :
                      activeExtraType === 'NB' ? '#EF4444' :
                      theme.primary;

                    return (
                      <Pressable
                        key={opt.value}
                        onPress={() => {
                          setIsExtraCustomMode(false);
                          setExtraRunsInput(opt.value);
                        }}
                        style={{
                          width: '30.5%',
                          paddingVertical: 10,
                          borderRadius: 10,
                          borderWidth: 1.5,
                          borderColor: isSelected ? accentColor : theme.outlineVariant + '44',
                          backgroundColor: isSelected ? accentColor + '18' : theme.surfaceLow,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <ThemedText
                          style={{
                            fontFamily: 'Sora_700Bold',
                            fontSize: 16,
                            color: isSelected ? accentColor : theme.text,
                          }}
                        >
                          {opt.label}
                        </ThemedText>
                        {opt.sub && (
                          <ThemedText
                            style={{
                              fontSize: 9.5,
                              color: isSelected ? accentColor : theme.textSecondary,
                              marginTop: 1,
                            }}
                          >
                            {opt.sub}
                          </ThemedText>
                        )}
                      </Pressable>
                    );
                  });
                })()}

                {/* Custom Enter Button */}
                <Pressable
                  onPress={() => {
                    setIsExtraCustomMode(true);
                  }}
                  style={{
                    width: '30.5%',
                    paddingVertical: 10,
                    borderRadius: 10,
                    borderWidth: 1.5,
                    borderColor: isExtraCustomMode ? theme.primary : theme.outlineVariant + '44',
                    backgroundColor: isExtraCustomMode ? theme.primary + '18' : theme.surfaceLow,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons
                    name="keypad-outline"
                    size={16}
                    color={isExtraCustomMode ? theme.primary : theme.text}
                  />
                  <ThemedText
                    style={{
                      fontFamily: 'Sora_500Medium',
                      fontSize: 11,
                      color: isExtraCustomMode ? theme.primary : theme.text,
                      marginTop: 2,
                    }}
                  >
                    Custom
                  </ThemedText>
                </Pressable>
              </View>

              {/* Custom Number Input when active */}
              {isExtraCustomMode && (
                <View
                  style={{
                    backgroundColor: theme.surfaceLow,
                    padding: 12,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: theme.primary + '66',
                    marginBottom: 14,
                  }}
                >
                  <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: theme.textSecondary, marginBottom: 6 }}>
                    ENTER CUSTOM RUNS:
                  </ThemedText>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <TextInput
                      style={{
                        flex: 1,
                        height: 42,
                        borderWidth: 1.5,
                        borderColor: theme.primary,
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        fontSize: 16,
                        fontFamily: 'Sora_700Bold',
                        color: theme.text,
                        backgroundColor: theme.surfaceLowest,
                        textAlign: 'center',
                      }}
                      placeholder="e.g. 5, 7, 8"
                      placeholderTextColor={theme.textSecondary + '88'}
                      keyboardType="number-pad"
                      autoFocus
                      value={extraCustomText}
                      onChangeText={(t) => {
                        const cleaned = t.replace(/[^0-9]/g, '').slice(0, 2);
                        setExtraCustomText(cleaned);
                        const num = parseInt(cleaned, 10);
                        setExtraRunsInput(isNaN(num) ? 0 : num);
                      }}
                    />
                    <Pressable
                      onPress={() => {
                        const cur = extraRunsInput > 0 ? extraRunsInput - 1 : 0;
                        setExtraRunsInput(cur);
                        setExtraCustomText(String(cur));
                      }}
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 8,
                        backgroundColor: theme.surfaceLowest,
                        borderWidth: 1,
                        borderColor: theme.outlineVariant + '66',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ThemedText style={{ fontSize: 18, fontFamily: 'Sora_700Bold', color: theme.text }}>-</ThemedText>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        const cur = extraRunsInput + 1;
                        setExtraRunsInput(cur);
                        setExtraCustomText(String(cur));
                      }}
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 8,
                        backgroundColor: theme.surfaceLowest,
                        borderWidth: 1,
                        borderColor: theme.outlineVariant + '66',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ThemedText style={{ fontSize: 18, fontFamily: 'Sora_700Bold', color: theme.text }}>+</ThemedText>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* Live Outcome Summary Box */}
              {(() => {
                const isWide = activeExtraType === 'WD';
                const isNoBall = activeExtraType === 'NB';
                const totalRuns = (isWide || isNoBall) ? extraRunsInput + 1 : extraRunsInput;
                const accentColor = isWide ? '#F59E0B' : isNoBall ? '#EF4444' : theme.primary;

                return (
                  <View
                    style={{
                      backgroundColor: accentColor + '12',
                      padding: 12,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: accentColor + '33',
                      marginBottom: 14,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_700Bold', color: accentColor, textTransform: 'uppercase' }}>
                        DELIVERY OUTCOME PREVIEW
                      </ThemedText>
                      <View
                        style={{
                          backgroundColor: accentColor,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 6,
                        }}
                      >
                        <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_700Bold', color: '#ffffff' }}>
                          +{totalRuns} {totalRuns === 1 ? 'Run' : 'Runs'}
                        </ThemedText>
                      </View>
                    </View>

                    <ThemedText style={{ fontSize: 13, fontFamily: 'Sora_500Medium', color: theme.text, marginTop: 6 }}>
                      {isWide ? (
                        `1 Extra (WD) + ${extraRunsInput} Overthrows = ${totalRuns} Runs`
                      ) : isNoBall ? (
                        `1 Extra (NB) + ${extraRunsInput} off bat = ${totalRuns} Runs`
                      ) : (
                        `${totalRuns} ${activeExtraType === 'BYE' ? 'Bye' : 'Leg Bye'} Runs`
                      )}
                    </ThemedText>

                    <ThemedText style={{ fontSize: 10.5, color: theme.textSecondary, marginTop: 3 }}>
                      {isWide
                        ? 'Delivery will be re-bowled · 1 run credited to team extras'
                        : isNoBall
                        ? `Delivery will be re-bowled · Free Hit next ball · ${extraRunsInput} credited to striker`
                        : 'Counts as 1 legal delivery in the current over'}
                    </ThemedText>
                  </View>
                );
              })()}

              {/* Correction Option */}
              <Pressable
                style={[styles.extraOptionBtn, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '44', paddingVertical: 10, marginBottom: 14 }]}
                onPress={() => {
                  if (activeExtraType) recordExtraWithRuns(activeExtraType, 0, true);
                  setShowExtraModal(false);
                  setActiveExtraType(null);
                }}
              >
                <ThemedText style={{ fontFamily: 'Sora_500Medium', fontSize: 12, color: theme.text }}>
                  Correction: Count as Legal Ball (0 Runs)
                </ThemedText>
                <ThemedText style={{ fontSize: 9.5, color: theme.textSecondary }}>
                  Use if called by mistake — consumes a legal ball, adds 0 runs
                </ThemedText>
              </Pressable>

              {/* Confirm Action Button */}
              <Pressable
                style={[
                  styles.extraOptionBtn,
                  {
                    backgroundColor:
                      activeExtraType === 'WD' ? '#F59E0B' :
                      activeExtraType === 'NB' ? '#EF4444' :
                      theme.primary,
                    borderColor:
                      activeExtraType === 'WD' ? '#F59E0B' :
                      activeExtraType === 'NB' ? '#EF4444' :
                      theme.primary,
                    paddingVertical: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 8,
                  },
                ]}
                onPress={() => {
                  if (activeExtraType) {
                    const isWide = activeExtraType === 'WD';
                    const isNoBall = activeExtraType === 'NB';
                    const total = (isWide || isNoBall) ? extraRunsInput + 1 : extraRunsInput;
                    const runsOffBat = isNoBall ? extraRunsInput : 0;
                    const isLegal = !isWide && !isNoBall;
                    recordExtraWithRuns(activeExtraType, total, isLegal, runsOffBat);
                  }
                  setShowExtraModal(false);
                  setActiveExtraType(null);
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="checkmark-circle-outline" size={17} color="#ffffff" />
                  <ThemedText style={{ fontFamily: 'Sora_700Bold', color: '#ffffff', fontSize: 13.5 }}>
                    {(() => {
                      const isWide = activeExtraType === 'WD';
                      const isNoBall = activeExtraType === 'NB';
                      const total = (isWide || isNoBall) ? extraRunsInput + 1 : extraRunsInput;
                      return `Confirm & Record (+${total} Runs)`;
                    })()}
                  </ThemedText>
                </View>
              </Pressable>

              <Pressable
                onPress={() => {
                  setShowExtraModal(false);
                  setActiveExtraType(null);
                }}
                style={[styles.cancelBtn, { borderColor: theme.outlineVariant + '44', width: '100%', paddingVertical: 9 }]}
              >
                <ThemedText type="labelMd" style={{ color: theme.textSecondary, textAlign: 'center' }}>
                  Cancel
                </ThemedText>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>


      {/* 🏆 MATCH VICTORY CELEBRATION MODAL */}
      <Modal
        visible={showVictoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowVictoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', padding: 20, alignItems: 'center', width: '92%', maxWidth: 420, borderRadius: 12, overflow: 'hidden', alignSelf: 'center' }]}>
            {/* 🐒 🌸 Festive Monkey & Flower Particle Header Row with Animated Bouncing */}
            <Animated.View style={{ transform: [{ translateY: confettiBounceAnim }], width: '100%', flexDirection: 'row', justifyContent: 'space-around', opacity: 0.95, marginBottom: 6 }}>
              <ThemedText style={{ fontSize: 24 }}>🐒</ThemedText>
              <ThemedText style={{ fontSize: 22 }}>🌸</ThemedText>
              <ThemedText style={{ fontSize: 26 }}>🎉</ThemedText>
              <ThemedText style={{ fontSize: 24 }}>🌺</ThemedText>
              <ThemedText style={{ fontSize: 26 }}>🏆</ThemedText>
              <ThemedText style={{ fontSize: 24 }}>🌻</ThemedText>
              <ThemedText style={{ fontSize: 22 }}>🐒</ThemedText>
            </Animated.View>

            {/* Animated Celebration Icon Badge flanked by Monkey and Flower */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 8 }}>
              <ThemedText style={{ fontSize: 28 }}>🐒</ThemedText>
              <Animated.View style={{ transform: [{ scale: trophyAnimScale }], width: 74, height: 74, borderRadius: 37, backgroundColor: '#F59E0B20', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#F59E0B', boxShadow: '0px 8px 24px rgba(245, 158, 11, 0.5)' }}>
                <Ionicons name="trophy" size={40} color="#F59E0B" />
              </Animated.View>
              <ThemedText style={{ fontSize: 28 }}>🌸</ThemedText>
            </View>

            <ThemedText style={{ fontSize: 22, fontFamily: 'Sora_500Medium', color: theme.text, textAlign: 'center', letterSpacing: 0.2 }}>
              🎉 {matchVictoryData?.winnerName} Won!
            </ThemedText>

            {/* 🐒 🌸 Festive Celebration Banner */}
            <View style={{ backgroundColor: '#F59E0B15', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#F59E0B33', marginVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <ThemedText style={{ fontSize: 13 }}>🌸</ThemedText>
              <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_500Medium', color: '#F59E0B' }}>
                🐒 Victory Flower & Monkey Celebration! 🌸
              </ThemedText>
              <ThemedText style={{ fontSize: 13 }}>🐒</ThemedText>
            </View>

            <View style={{ backgroundColor: '#10B98118', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 12, borderWidth: 1, borderColor: '#10B98133', marginVertical: 8 }}>
              <ThemedText style={{ fontSize: 13, fontFamily: 'Sora_500Medium', color: '#10B981' }}>
                🏆 {matchVictoryData?.winMargin}
              </ThemedText>
            </View>

            <ThemedText style={{ fontSize: 12, color: theme.textSecondary, textAlign: 'center', marginBottom: 16 }}>
              Target: {matchVictoryData?.target} runs · Completed in {matchVictoryData?.secondInningsOvers} overs
            </ThemedText>

            {/* Man of the Match Card */}
            <View style={{ width: '100%', backgroundColor: theme.surfaceLow, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: theme.outlineVariant + '33', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Ionicons name="star" size={15} color="#F59E0B" />
                <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: '#F59E0B', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Man of the Match
                </ThemedText>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.primary + '20', justifyContent: 'center', alignItems: 'center' }}>
                    <ThemedText style={{ fontSize: 13, fontFamily: 'Sora_700Bold', color: theme.primary }}>
                      {getTwoLetterLogo(matchVictoryData?.motmName || 'Player')}
                    </ThemedText>
                  </View>
                  <View>
                    <ThemedText style={{ fontSize: 14, fontFamily: 'Sora_500Medium', color: theme.text }}>
                      {matchVictoryData?.motmName}
                    </ThemedText>
                    <ThemedText style={{ fontSize: 11, color: theme.textSecondary, marginTop: 1 }}>
                      ⭐ {matchVictoryData?.motmStat}
                    </ThemedText>
                  </View>
                </View>
              </View>
            </View>

            {/* Score Summary Box */}
            <View style={{ width: '100%', backgroundColor: theme.primary + '10', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: theme.primary + '25', marginBottom: 20, gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_500Medium', color: theme.text }}>
                  1st Innings ({matchVictoryData?.firstInningsTeam}):
                </ThemedText>
                <ThemedText style={{ fontSize: 13, fontFamily: 'Sora_500Medium', color: theme.text }}>
                  {matchVictoryData?.firstInningsScore} ({matchVictoryData?.firstInningsOvers} ov)
                </ThemedText>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_500Medium', color: theme.text }}>
                  2nd Innings ({matchVictoryData?.secondInningsTeam}):
                </ThemedText>
                <ThemedText style={{ fontSize: 13, fontFamily: 'Sora_500Medium', color: theme.primary }}>
                  {matchVictoryData?.secondInningsScore} ({matchVictoryData?.secondInningsOvers} ov)
                </ThemedText>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={{ gap: 10, width: '100%' }}>
              <Pressable
                onPress={() => {
                  setShowVictoryModal(false);
                  setShowRematchSquadChoiceModal(true);
                }}
                style={({ pressed }) => [{
                  width: '100%',
                  paddingVertical: 13,
                  borderRadius: 12,
                  backgroundColor: '#F59E0B',
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                }, pressed && { opacity: 0.85 }]}
              >
                <ThemedText style={{ fontSize: 16 }}>🔄</ThemedText>
                <ThemedText style={{ fontSize: 14, fontFamily: 'Sora_600SemiBold', color: '#ffffff' }}>
                  Rematch?
                </ThemedText>
              </Pressable>

              <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
                <Pressable
                  onPress={() => {
                    setShowVictoryModal(false);
                    setActiveSubTab('scorecard');
                  }}
                  style={({ pressed }) => [{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: theme.surfaceLow, borderWidth: 1, borderColor: theme.outlineVariant + '44', alignItems: 'center' }, pressed && { opacity: 0.8 }]}
                >
                  <ThemedText style={{ fontSize: 12.5, fontFamily: 'Sora_500Medium', color: theme.text }}>
                    View Scorecard
                  </ThemedText>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setShowVictoryModal(false);
                    router.replace('/(tabs)/matches');
                  }}
                  style={({ pressed }) => [{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: theme.primary, alignItems: 'center' }, pressed && { opacity: 0.85 }]}
                >
                  <ThemedText style={{ fontSize: 12.5, fontFamily: 'Sora_500Medium', color: '#ffffff' }}>
                    Done / Matches
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* 👥 REMATCH SQUAD SELECTION MODAL (POPUP 2: SAME SQUAD vs NEW SQUAD) */}
      <Modal
        visible={showRematchSquadChoiceModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRematchSquadChoiceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.surfaceLowest,
                borderColor: theme.outlineVariant + '33',
                borderWidth: 1.5,
                borderRadius: 24,
                width: '92%',
                maxWidth: 440,
                alignSelf: 'center',
                padding: 0,
                overflow: 'hidden',
                ...Shadows.level3,
              },
            ]}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: theme.outlineVariant + '22',
                backgroundColor: theme.surfaceLowest,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    backgroundColor: theme.primary + '18',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Ionicons name="people" size={20} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={{ color: theme.text, fontFamily: 'Sora_700Bold', fontSize: 16 }}>
                    Rematch Squad Setup
                  </ThemedText>
                  <ThemedText style={{ fontSize: 11, color: theme.textSecondary, fontFamily: 'Sora_400Regular', marginTop: 1 }}>
                    Choose squad configuration for {teamA} vs {teamB}
                  </ThemedText>
                </View>
              </View>
              <Pressable
                onPress={() => setShowRematchSquadChoiceModal(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: theme.surfaceLow,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="close" size={18} color={theme.text} />
              </Pressable>
            </View>

            {/* Body Options */}
            <View style={{ padding: 16, gap: 14 }}>
              {/* Option 1: Same Squad */}
              <Pressable
                onPress={handleRematchSameSquad}
                style={({ pressed }) => [{
                  backgroundColor: theme.surfaceLow,
                  borderRadius: 16,
                  borderWidth: 1.5,
                  borderColor: theme.primary + '55',
                  padding: 16,
                  opacity: pressed ? 0.85 : 1,
                }]}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#10B98118', justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name="shield-checkmark" size={18} color="#10B981" />
                    </View>
                    <ThemedText style={{ fontSize: 15, fontFamily: 'Sora_700Bold', color: theme.text }}>
                      Same Squad
                    </ThemedText>
                  </View>
                  <View style={{ backgroundColor: '#10B98118', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                    <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_700Bold', color: '#10B981' }}>
                      ⚡ FAST START
                    </ThemedText>
                  </View>
                </View>
                <ThemedText style={{ fontSize: 11.5, color: theme.textSecondary, fontFamily: 'Sora_400Regular', lineHeight: 17, marginBottom: 12 }}>
                  Keep all existing players for {teamA} and {teamB}. Proceed directly to the coin toss & 1st innings setup.
                </ThemedText>
                <View style={{ backgroundColor: theme.primary, paddingVertical: 10, borderRadius: 10, alignItems: 'center' }}>
                  <ThemedText style={{ fontSize: 12.5, fontFamily: 'Sora_600SemiBold', color: '#ffffff' }}>
                    Continue with Same Squad
                  </ThemedText>
                </View>
              </Pressable>

              {/* Option 2: New Squad */}
              <Pressable
                onPress={handleRematchNewSquad}
                style={({ pressed }) => [{
                  backgroundColor: theme.surfaceLow,
                  borderRadius: 16,
                  borderWidth: 1.5,
                  borderColor: theme.outlineVariant + '44',
                  padding: 16,
                  opacity: pressed ? 0.85 : 1,
                }]}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: theme.primary + '18', justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name="person-add" size={18} color={theme.primary} />
                    </View>
                    <ThemedText style={{ fontSize: 15, fontFamily: 'Sora_700Bold', color: theme.text }}>
                      New Squad
                    </ThemedText>
                  </View>
                  <View style={{ backgroundColor: theme.primary + '18', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                    <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_700Bold', color: theme.primary }}>
                      ✨ SELECT XI
                    </ThemedText>
                  </View>
                </View>
                <ThemedText style={{ fontSize: 11.5, color: theme.textSecondary, fontFamily: 'Sora_400Regular', lineHeight: 17, marginBottom: 12 }}>
                  Open the Select Playing XI screen to re-select, draft, substitute or add new players before starting the match.
                </ThemedText>
                <View style={{ backgroundColor: theme.surfaceLowest, borderWidth: 1.2, borderColor: theme.primary, paddingVertical: 10, borderRadius: 10, alignItems: 'center' }}>
                  <ThemedText style={{ fontSize: 12.5, fontFamily: 'Sora_600SemiBold', color: theme.primary }}>
                    Choose / Modify Playing XI
                  </ThemedText>
                </View>
              </Pressable>
            </View>

            {/* Footer */}
            <View
              style={{
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderTopWidth: 1,
                borderTopColor: theme.outlineVariant + '22',
                backgroundColor: theme.surfaceLowest,
              }}
            >
              <Pressable
                onPress={() => setShowRematchSquadChoiceModal(false)}
                style={({ pressed }) => [{
                  height: 42,
                  borderRadius: 10,
                  borderWidth: 1.2,
                  borderColor: theme.outlineVariant + '55',
                  backgroundColor: theme.surfaceLow,
                  justifyContent: 'center',
                  alignItems: 'center',
                  opacity: pressed ? 0.8 : 1,
                }]}
              >
                <ThemedText style={{ color: theme.textSecondary, fontFamily: 'Sora_600SemiBold', fontSize: 12.5 }}>
                  Cancel
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* 🪙 REMATCH 3D COIN FLIP TOSS MODAL */}
      <Modal
        visible={showRematchTossModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRematchTossModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', padding: 20, alignItems: 'center', width: '92%', maxWidth: 420, borderRadius: 12 }]}>

            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
              <ThemedText style={{ fontSize: 18 }}>✨</ThemedText>
              <ThemedText style={{ fontSize: 18, fontFamily: 'Sora_500Medium', color: theme.text }}>
                Rematch Coin Toss
              </ThemedText>
            </View>

            <ThemedText style={{ fontSize: 12, color: theme.textSecondary, textAlign: 'center', marginBottom: 10 }}>
              Flip the 3D coin to decide who bats or bowls first in the rematch!
            </ThemedText>

            {/* 3D Animated Coin Display */}
            <Animated.View style={{
              transform: [{
                rotateY: coinRotateAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '1440deg'],
                })
              }],
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: '#F59E0B',
              justifyContent: 'center',
              alignItems: 'center',
              marginVertical: 8,
              borderWidth: 3.5,
              borderColor: '#FDE047',
              boxShadow: '0px 8px 24px rgba(245, 158, 11, 0.6)',
            }}>
              <ThemedText style={{ fontSize: 30 }}>
                {coinSide === 'HEADS' ? '🪙' : coinSide === 'TAILS' ? '🪙' : '🪙'}
              </ThemedText>
              <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_500Medium', color: '#ffffff', marginTop: 1 }}>
                {coinSide ? coinSide : 'FLIP!'}
              </ThemedText>
            </Animated.View>

            {/* Spin Coin Button */}
            <Pressable
              onPress={flipCoinForToss}
              disabled={isFlippingCoin}
              style={({ pressed }) => [{
                backgroundColor: '#F59E0B18',
                borderWidth: 1.5,
                borderColor: '#F59E0B',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                marginVertical: 8,
              }, pressed && { opacity: 0.8 }]}
            >
              <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_500Medium', color: '#F59E0B' }}>
                {isFlippingCoin ? '🌀 Flipping Coin...' : '🪙 Flip Coin Randomizer'}
              </ThemedText>
            </Pressable>

            {/* Select Toss Winner Team */}
            <View style={{ width: '100%', marginTop: 10, marginBottom: 8 }}>
              <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_500Medium', color: theme.textSecondary, textTransform: 'uppercase', marginBottom: 6 }}>
                Toss Winner:
              </ThemedText>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[teamA, teamB].map((tName) => (
                  <Pressable
                    key={tName}
                    onPress={() => setRematchTossWinner(tName)}
                    style={[{ flex: 1, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5, borderColor: theme.outlineVariant + '44', alignItems: 'center', backgroundColor: theme.surfaceLow }, rematchTossWinner === tName && { backgroundColor: theme.primary + '18', borderColor: theme.primary }]}
                  >
                    <ThemedText style={[{ fontSize: 12, fontFamily: 'Sora_500Medium', color: theme.text }, rematchTossWinner === tName && { color: theme.primary }]}>
                      {tName} {rematchTossWinner === tName ? '👑' : ''}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Select Decision (Bat / Bowl) */}
            <View style={{ width: '100%', marginBottom: 16 }}>
              <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_500Medium', color: theme.textSecondary, textTransform: 'uppercase', marginBottom: 6 }}>
                {rematchTossWinner} Decision:
              </ThemedText>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable
                  onPress={() => setRematchTossDecision('Bat')}
                  style={[{ flex: 1, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5, borderColor: theme.outlineVariant + '44', alignItems: 'center', backgroundColor: theme.surfaceLow }, rematchTossDecision === 'Bat' && { backgroundColor: '#10B98118', borderColor: '#10B981' }]}
                >
                  <ThemedText style={[{ fontSize: 12, fontFamily: 'Sora_500Medium', color: theme.text }, rematchTossDecision === 'Bat' && { color: '#10B981' }]}>
                    🏏 Bat First
                  </ThemedText>
                </Pressable>

                <Pressable
                  onPress={() => setRematchTossDecision('Bowl')}
                  style={[{ flex: 1, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5, borderColor: theme.outlineVariant + '44', alignItems: 'center', backgroundColor: theme.surfaceLow }, rematchTossDecision === 'Bowl' && { backgroundColor: '#3B82F618', borderColor: '#3B82F6' }]}
                >
                  <ThemedText style={[{ fontSize: 12, fontFamily: 'Sora_500Medium', color: theme.text }, rematchTossDecision === 'Bowl' && { color: '#3B82F6' }]}>
                    ⚾ Bowl First
                  </ThemedText>
                </Pressable>
              </View>
            </View>

            {/* Confirm Rematch Action */}
            <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
              <Pressable
                onPress={() => setShowRematchTossModal(false)}
                style={({ pressed }) => [{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: theme.surfaceLow, borderWidth: 1, borderColor: theme.outlineVariant + '44', alignItems: 'center' }, pressed && { opacity: 0.8 }]}
              >
                <ThemedText style={{ fontSize: 12.5, fontFamily: 'Sora_500Medium', color: theme.textSecondary }}>
                  Cancel
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={confirmRematchToss}
                style={({ pressed }) => [{ flex: 2, paddingVertical: 12, borderRadius: 10, backgroundColor: theme.primary, alignItems: 'center' }, pressed && { opacity: 0.85 }]}
              >
                <ThemedText style={{ fontSize: 12.5, fontFamily: 'Sora_500Medium', color: '#ffffff' }}>
                  🚀 Start Rematch
                </ThemedText>
              </Pressable>
            </View>

          </View>
        </View>
      </Modal>

      {/* ⚙️ PRE-MATCH RULES VERIFICATION EDIT MODAL */}
      <Modal
        visible={showPreRulesModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPreRulesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', padding: 18, width: '92%', maxWidth: 420, borderRadius: 12 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name={isMatchUnderway ? "lock-closed" : "options"} size={20} color={isMatchUnderway ? "#EF4444" : theme.primary} />
                <ThemedText style={{ fontSize: 16, fontFamily: 'Sora_500Medium', color: theme.text }}>
                  {isMatchUnderway ? 'Match Rules (Locked 🔒)' : 'Pre-Match Rules Verification'}
                </ThemedText>
              </View>
              <Pressable onPress={() => setShowPreRulesModal(false)}>
                <Ionicons name="close" size={20} color={theme.text} />
              </Pressable>
            </View>

            {/* In Progress Lock Notice */}
            {isMatchUnderway && (
              <View style={{ backgroundColor: '#EF444415', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#EF444433', marginBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="lock-closed" size={18} color="#EF4444" />
                <View style={{ flex: 1 }}>
                  <ThemedText style={{ fontSize: 11.5, fontFamily: 'Sora_500Medium', color: '#EF4444' }}>
                    Match In Progress • Rules Locked 🔒
                  </ThemedText>
                  <ThemedText style={{ fontSize: 10, color: theme.textSecondary, marginTop: 1 }}>
                    Overs and scoring rules are fixed once the match has commenced.
                  </ThemedText>
                </View>
              </View>
            )}

            {/* Total Overs Option Selector + Custom Overs TextInput */}
            <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_500Medium', color: theme.textSecondary, textTransform: 'uppercase', marginBottom: 6 }}>
              TOTAL MATCH OVERS: {isMatchUnderway ? `(LOCKED AT ${currentTotalOvers} OVERS)` : ''}
            </ThemedText>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
              {['5', '7', '12', '20'].map(ov => (
                <Pressable
                  key={ov}
                  disabled={isMatchUnderway}
                  onPress={() => setEditTotalOversInput(ov)}
                  style={[{ paddingHorizontal: 11, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: theme.outlineVariant + '44', backgroundColor: theme.surfaceLow }, editTotalOversInput === ov && { backgroundColor: theme.primary, borderColor: theme.primary }, isMatchUnderway && { opacity: 0.6 }]}
                >
                  <ThemedText style={[{ fontSize: 11.5, fontFamily: 'Sora_500Medium', color: theme.text }, editTotalOversInput === ov && { color: '#ffffff' }]}>
                    {ov} Ov
                  </ThemedText>
                </Pressable>
              ))}

              {/* Custom Overs TextInput */}
              <View style={[{
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: theme.outlineVariant + '44',
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 5,
                backgroundColor: theme.surfaceLow,
                gap: 4,
                opacity: isMatchUnderway ? 0.6 : 1,
              }, editTotalOversInput !== '' && !['5', '7', '12', '20'].includes(editTotalOversInput) && {
                backgroundColor: theme.primary + '18',
                borderColor: theme.primary,
              }]}>
                <TextInput
                  value={editTotalOversInput}
                  editable={!isMatchUnderway}
                  onChangeText={(val) => {
                    const digits = val.replace(/[^0-9]/g, '').slice(0, 2);
                    if (!digits) {
                      setEditTotalOversInput('');
                      return;
                    }
                    const num = parseInt(digits, 10);
                    const capped = num > 50 ? '50' : String(num);
                    setEditTotalOversInput(capped);
                  }}
                  placeholder="Custom"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  maxLength={2}
                  style={[{
                    fontSize: 11.5,
                    fontFamily: 'Sora_500Medium',
                    color: theme.text,
                    padding: 0,
                    minWidth: 32,
                    textAlign: 'center',
                  }, Platform.OS === 'web' && ({ outlineStyle: 'none', outlineWidth: 0 } as any)]}
                />
                {editTotalOversInput && !isMatchUnderway ? (
                  <Pressable onPress={() => setEditTotalOversInput('')}>
                    <Ionicons name="close-circle" size={14} color={theme.textSecondary} />
                  </Pressable>
                ) : null}
              </View>
            </View>

            {/* Max Overs Per Bowler Rule Selector */}
            <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_500Medium', color: theme.textSecondary, textTransform: 'uppercase', marginBottom: 6 }}>
              MAX OVERS PER BOWLER: {isMatchUnderway ? `(LOCKED AT ${ruleMaxOversPerBowler === 'unlimited' ? 'NO LIMIT' : `${ruleMaxOversPerBowler} OV/BOWLER`})` : ''}
            </ThemedText>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
              {['1', '2', '3', '4', '5', 'unlimited'].map(ov => (
                <Pressable
                  key={ov}
                  disabled={isMatchUnderway}
                  onPress={() => setEditMaxOversPerBowlerInput(ov)}
                  style={[
                    { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: theme.outlineVariant + '44', backgroundColor: theme.surfaceLow },
                    editMaxOversPerBowlerInput === ov && { backgroundColor: theme.primary, borderColor: theme.primary },
                    isMatchUnderway && { opacity: 0.6 }
                  ]}
                >
                  <ThemedText style={[{ fontSize: 11.5, fontFamily: 'Sora_500Medium', color: theme.text }, editMaxOversPerBowlerInput === ov && { color: '#ffffff' }]}>
                    {ov === 'unlimited' ? 'No Limit' : `${ov} Ov`}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            {/* Quick Scoring Rules Checkboxes */}
            <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_500Medium', color: theme.textSecondary, textTransform: 'uppercase', marginBottom: 6 }}>
              QUICK SCORING RULES (AUTO-RECORD EXTRAS & RUNS):
            </ThemedText>
            <View style={{ gap: 8, marginBottom: 12 }}>
              {/* Wide Ball */}
              <Pressable
                disabled={isMatchUnderway}
                onPress={() => setRuleAutoWide(!ruleAutoWide)}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: theme.outlineVariant + '33', backgroundColor: theme.surfaceLow, opacity: isMatchUnderway ? 0.65 : 1 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  <View style={{ backgroundColor: '#F59E0B20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                    <ThemedText style={{ fontSize: 9.5, fontFamily: 'Sora_500Medium', color: '#F59E0B' }}>WD</ThemedText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={{ fontSize: 11.5, fontFamily: 'Sora_500Medium', color: theme.text }}>
                      Wide Ball: +1 Extra Run (Auto)
                    </ThemedText>
                    <ThemedText style={{ fontSize: 9.5, color: theme.textSecondary, marginTop: 1 }}>
                      Tap = +1 run. Long-press 'WD' or uncheck to score Wide + 1, 2, 4 overthrows.
                    </ThemedText>
                  </View>
                </View>
                <Ionicons name={ruleAutoWide ? "checkbox" : "square-outline"} size={20} color={ruleAutoWide ? theme.primary : theme.textSecondary} />
              </Pressable>

              {/* No Ball */}
              <Pressable
                disabled={isMatchUnderway}
                onPress={() => setRuleAutoNoBall(!ruleAutoNoBall)}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: theme.outlineVariant + '33', backgroundColor: theme.surfaceLow, opacity: isMatchUnderway ? 0.65 : 1 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  <View style={{ backgroundColor: '#EF444420', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                    <ThemedText style={{ fontSize: 9.5, fontFamily: 'Sora_500Medium', color: '#EF4444' }}>NB</ThemedText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={{ fontSize: 11.5, fontFamily: 'Sora_500Medium', color: theme.text }}>
                      No Ball: +1 Extra Run & Free Hit (Auto)
                    </ThemedText>
                    <ThemedText style={{ fontSize: 9.5, color: theme.textSecondary, marginTop: 1 }}>
                      Tap = +1 run. Long-press 'NB' to score runs off bat (NB+1, +2, +4, +6).
                    </ThemedText>
                  </View>
                </View>
                <Ionicons name={ruleAutoNoBall ? "checkbox" : "square-outline"} size={20} color={ruleAutoNoBall ? theme.primary : theme.textSecondary} />
              </Pressable>

              {/* Byes & Leg Byes */}
              <Pressable
                disabled={isMatchUnderway}
                onPress={() => setRuleAllowByes(!ruleAllowByes)}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: theme.outlineVariant + '33', backgroundColor: theme.surfaceLow, opacity: isMatchUnderway ? 0.65 : 1 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  <View style={{ backgroundColor: '#3B82F620', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                    <ThemedText style={{ fontSize: 9.5, fontFamily: 'Sora_500Medium', color: '#3B82F6' }}>LB</ThemedText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={{ fontSize: 11.5, fontFamily: 'Sora_500Medium', color: theme.text }}>
                      Byes & Leg Byes: Count runs, legal ball
                    </ThemedText>
                    <ThemedText style={{ fontSize: 9.5, color: theme.textSecondary, marginTop: 1 }}>
                      Runs counted without wide penalty; legally bowled delivery.
                    </ThemedText>
                  </View>
                </View>
                <Ionicons name={ruleAllowByes ? "checkbox" : "square-outline"} size={20} color={ruleAllowByes ? theme.primary : theme.textSecondary} />
              </Pressable>

              {/* Wicket + Runs Rule */}
              <Pressable
                disabled={isMatchUnderway}
                onPress={() => setRuleAllowWicketRuns(!ruleAllowWicketRuns)}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: theme.outlineVariant + '33', backgroundColor: theme.surfaceLow, opacity: isMatchUnderway ? 0.65 : 1 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  <View style={{ backgroundColor: '#8B5CF620', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                    <ThemedText style={{ fontSize: 9.5, fontFamily: 'Sora_500Medium', color: '#8B5CF6' }}>WK</ThemedText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={{ fontSize: 11.5, fontFamily: 'Sora_500Medium', color: theme.text }}>
                      Wicket + Runs: Support Run Outs (W+1, W+2)
                    </ThemedText>
                    <ThemedText style={{ fontSize: 9.5, color: theme.textSecondary, marginTop: 1 }}>
                      Tap 'Wicket' on pad → pick 'W+1' or 'W+2' for completed runs on dismissals.
                    </ThemedText>
                  </View>
                </View>
                <Ionicons name={ruleAllowWicketRuns ? "checkbox" : "square-outline"} size={20} color={ruleAllowWicketRuns ? theme.primary : theme.textSecondary} />
              </Pressable>
            </View>

            {/* How Match Scenarios Are Handled Guide Box */}
            <View style={{ backgroundColor: theme.primary + '10', borderColor: theme.primary + '33', borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Ionicons name="flash" size={13} color={theme.primary} />
                <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: theme.primary }}>
                  Scoring Scenarios Handled During Match:
                </ThemedText>
              </View>
              <ThemedText style={{ fontSize: 9.5, color: theme.textSecondary, lineHeight: 14 }}>
                • <ThemedText style={{ fontFamily: 'Sora_500Medium', color: theme.text }}>Wide + 1 or 2 runs:</ThemedText> Long-press 'Wide' button on keypad to pick 1 penalty + runs.{'\n'}
                • <ThemedText style={{ fontFamily: 'Sora_500Medium', color: theme.text }}>Wicket + 1 or 2 runs:</ThemedText> Tap 'Wicket' → select 'Wicket + 1 Run' or 'Wicket + 2 Runs' (Run Out).{'\n'}
                • <ThemedText style={{ fontFamily: 'Sora_500Medium', color: theme.text }}>No Ball + Runs:</ThemedText> Long-press 'No Ball' to add runs off bat with Free Hit.
              </ThemedText>
            </View>

            {/* Save / Close Action Button */}
            {isMatchUnderway ? (
              <Pressable
                onPress={() => setShowPreRulesModal(false)}
                style={({ pressed }) => [{ width: '100%', paddingVertical: 12, borderRadius: 10, backgroundColor: theme.surfaceLow, borderWidth: 1, borderColor: theme.outlineVariant + '44', alignItems: 'center' }, pressed && { opacity: 0.85 }]}
              >
                <ThemedText style={{ fontSize: 13, fontFamily: 'Sora_500Medium', color: theme.text }}>
                  Close (Rules Locked)
                </ThemedText>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => {
                  const newOvers = editTotalOversInput || '20';
                  setCurrentTotalOvers(newOvers);
                  const newMaxBowler = editMaxOversPerBowlerInput || '2';
                  setRuleMaxOversPerBowler(newMaxBowler);
                  setShowPreRulesModal(false);
                  showToast('success', `Rules Applied: ${newOvers} Overs (${newMaxBowler === 'unlimited' ? 'No Limit' : `${newMaxBowler} Ov/Bowler`}).`);
                }}
                style={({ pressed }) => [{ width: '100%', paddingVertical: 12, borderRadius: 10, backgroundColor: theme.primary, alignItems: 'center' }, pressed && { opacity: 0.85 }]}
              >
                <ThemedText style={{ fontSize: 13, fontFamily: 'Sora_500Medium', color: '#ffffff' }}>
                  ✓ Save & Apply Rules
                </ThemedText>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>

      {/* 🔔 Animated Toast Banner (Success, Warning, Error, Info) */}
      {toastConfig.visible && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 14,
            left: '4%',
            right: '4%',
            maxWidth: 420,
            alignSelf: 'center',
            zIndex: 99999,
            transform: [{ translateY: toastAnimY }],
            opacity: toastOpacity,
          }}
        >
          <Pressable
            onPress={hideToast}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 14,
              paddingVertical: 11,
              borderRadius: 14,
              backgroundColor: theme.surfaceLowest,
              borderWidth: 1.5,
              borderColor:
                toastConfig.type === 'success'
                  ? '#10B981'
                  : toastConfig.type === 'warning'
                    ? '#F59E0B'
                    : toastConfig.type === 'error'
                      ? '#EF4444'
                      : theme.primary,
              boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.18)',
              elevation: 8,
              gap: 10,
            }}
          >
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor:
                  toastConfig.type === 'success'
                    ? '#10B98120'
                    : toastConfig.type === 'warning'
                      ? '#F59E0B20'
                      : toastConfig.type === 'error'
                        ? '#EF444420'
                        : theme.primary + '20',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons
                name={
                  toastConfig.type === 'success'
                    ? 'checkmark-circle'
                    : toastConfig.type === 'warning'
                      ? 'warning'
                      : toastConfig.type === 'error'
                        ? 'alert-circle'
                        : 'information-circle'
                }
                size={18}
                color={
                  toastConfig.type === 'success'
                    ? '#10B981'
                    : toastConfig.type === 'warning'
                      ? '#F59E0B'
                      : toastConfig.type === 'error'
                        ? '#EF4444'
                        : theme.primary
                }
              />
            </View>
            <ThemedText
              style={{
                flex: 1,
                fontSize: 12.5,
                fontFamily: 'Sora_500Medium',
                color: theme.text,
              }}
              numberOfLines={2}
            >
              {toastConfig.message}
            </ThemedText>
            <Ionicons name="close" size={16} color={theme.textSecondary} />
          </Pressable>
        </Animated.View>
      )}

      {/* 🥳 1st INNINGS COMPLETED HAPPY CELEBRATION MODAL */}
      <Modal
        visible={showFirstInningsHappyModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFirstInningsHappyModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View
            style={{
              backgroundColor: theme.surfaceLowest,
              borderRadius: 20,
              padding: 24,
              width: '100%',
              maxWidth: 380,
              alignItems: 'center',
              borderWidth: 1.5,
              borderColor: '#10B981',
              boxShadow: '0px 12px 32px rgba(0,0,0,0.3)',
              elevation: 12,
            }}
          >
            {/* Happy Badge / Emoji */}
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: '#10B98118',
                borderWidth: 2,
                borderColor: '#10B981',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 14,
              }}
            >
              <ThemedText style={{ fontSize: 32 }}>🎉</ThemedText>
            </View>

            <ThemedText style={{ fontSize: 18, fontFamily: 'Sora_700Bold', color: theme.text, textAlign: 'center', marginBottom: 4 }}>
              1st Innings Completed! 🏏
            </ThemedText>
            <ThemedText style={{ fontSize: 12.5, fontFamily: 'Sora_400Regular', color: theme.textSecondary, textAlign: 'center', marginBottom: 16 }}>
              Great first half! Here is the match status:
            </ThemedText>

            {/* Score Card Box */}
            <View
              style={{
                width: '100%',
                backgroundColor: theme.surfaceLow,
                borderRadius: 14,
                padding: 14,
                borderWidth: 1,
                borderColor: theme.outlineVariant + '33',
                marginBottom: 14,
                gap: 8,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <ThemedText style={{ fontSize: 12.5, fontFamily: 'Sora_500Medium', color: theme.textSecondary }}>
                  1st Innings ({firstInningsHappyData?.battingTeam}):
                </ThemedText>
                <ThemedText style={{ fontSize: 15, fontFamily: 'Sora_700Bold', color: theme.text }}>
                  {firstInningsHappyData?.runs}/{firstInningsHappyData?.wickets}{' '}
                  <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_400Regular', color: theme.textSecondary }}>
                    ({firstInningsHappyData?.overs} ov)
                  </ThemedText>
                </ThemedText>
              </View>

              <View style={{ height: 1, backgroundColor: theme.outlineVariant + '22', marginVertical: 2 }} />

              {/* Target Highlight */}
              <View
                style={{
                  backgroundColor: '#10B98115',
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: '#10B98140',
                  alignItems: 'center',
                }}
              >
                <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_600SemiBold', color: '#10B981', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>
                  🎯 Target for {firstInningsHappyData?.bowlingTeam}
                </ThemedText>
                <ThemedText style={{ fontSize: 20, fontFamily: 'Sora_700Bold', color: '#10B981' }}>
                  {firstInningsHappyData?.target} Runs
                </ThemedText>
                <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_400Regular', color: theme.textSecondary, marginTop: 2 }}>
                  Need {firstInningsHappyData?.target} off {firstInningsHappyData?.maxOvers} overs (Req. RR: {firstInningsHappyData?.reqRunRate})
                </ThemedText>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={{ width: '100%', gap: 10 }}>
              <Pressable
                onPress={() => {
                  setShowFirstInningsHappyModal(false);
                  openEditPlayersModal();
                }}
                style={({ pressed }) => [{
                  width: '100%',
                  paddingVertical: 13,
                  borderRadius: 12,
                  backgroundColor: theme.primary,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                }, pressed && { opacity: 0.85 }]}
              >
                <ThemedText style={{ fontSize: 16 }}>🚀</ThemedText>
                <ThemedText style={{ fontSize: 13.5, fontFamily: 'Sora_600SemiBold', color: '#ffffff' }}>
                  Start 2nd Innings
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={() => {
                  setShowFirstInningsHappyModal(false);
                  setViewingScorecardInnings(1);
                  setActiveSubTab('scorecard');
                }}
                style={({ pressed }) => [{
                  width: '100%',
                  paddingVertical: 11,
                  borderRadius: 12,
                  backgroundColor: theme.surfaceLow,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: theme.outlineVariant + '44',
                }, pressed && { opacity: 0.85 }]}
              >
                <ThemedText style={{ fontSize: 12.5, fontFamily: 'Sora_500Medium', color: theme.text }}>
                  📊 View 1st Innings Scorecard
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* 🏆 END MATCH POPUP MODAL */}
      <Modal
        visible={showEndMatchModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEndMatchModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{
            backgroundColor: theme.surfaceLowest,
            borderRadius: 12,
            padding: 24,
            width: '100%',
            maxWidth: 440,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.25,
            shadowRadius: 20,
            elevation: 25,
            borderWidth: 1,
            borderColor: theme.outlineVariant + '33',
          }}>
            {/* Trophy Icon Circle */}
            <View style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: '#FEF3C7',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 14,
              borderWidth: 2,
              borderColor: '#F59E0B',
            }}>
              <ThemedText style={{ fontSize: 30 }}>🏆</ThemedText>
            </View>

            {/* Title */}
            <ThemedText style={{ fontSize: 19, fontFamily: 'Sora_500Medium', color: theme.text, textAlign: 'center' }}>
              Match Concluded!
            </ThemedText>

            {/* Score Summary Box */}
            <View style={{ backgroundColor: theme.surfaceLow, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, marginVertical: 12, alignItems: 'center', width: '100%' }}>
              <ThemedText style={{ fontSize: 13.5, fontFamily: 'Sora_500Medium', color: theme.text }}>
                {battingTeamName}: {runs}/{wickets} ({overs}.{ballsInCurrentOver} Ov)
              </ThemedText>
              <ThemedText style={{ fontSize: 11, color: theme.textSecondary, marginTop: 2 }}>
                Run Rate: {runRate.toFixed(2)} · Extras: {totalExtrasCount}
              </ThemedText>
            </View>

            {/* Question */}
            <ThemedText style={{ fontSize: 13.5, fontFamily: 'Sora_500Medium', color: theme.textSecondary, textAlign: 'center', marginBottom: 18 }}>
              Would you like to start a new match with coin toss?
            </ThemedText>

            {/* Button 1: New Match Flip Coin Toss */}
            <Pressable
              onPress={() => {
                setShowEndMatchModal(false);
                setCoinTossVisible(true);
              }}
              style={({ pressed }) => [{
                width: '100%',
                backgroundColor: theme.primary,
                paddingVertical: 13,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
                marginBottom: 10,
                opacity: pressed ? 0.85 : 1,
              }]}
            >
              <ThemedText style={{ fontSize: 16 }}>🪙</ThemedText>
              <ThemedText style={{ color: '#ffffff', fontSize: 13.5, fontFamily: 'Sora_500Medium' }}>
                New Match (Flip Coin Toss)
              </ThemedText>
            </Pressable>

            {/* Button 2: No (back to Turf Book Page) */}
            <Pressable
              onPress={() => {
                setShowEndMatchModal(false);
                router.replace('/(tabs)');
              }}
              style={({ pressed }) => [{
                width: '100%',
                backgroundColor: theme.surfaceLow,
                borderWidth: 1.5,
                borderColor: theme.outlineVariant + '55',
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
                opacity: pressed ? 0.85 : 1,
              }]}
            >
              <ThemedText style={{ color: theme.text, fontSize: 13, fontFamily: 'Sora_500Medium' }}>
                No (Back to Turf Book Page)
              </ThemedText>
            </Pressable>

            {/* Quick Export PDF Shortcut */}
            <Pressable
              onPress={handleExportPDF}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingVertical: 4,
              }}
            >
              <Ionicons name="download-outline" size={15} color="#059669" />
              <ThemedText style={{ color: '#059669', fontSize: 12, fontFamily: 'Sora_500Medium' }}>
                Download Score Sheet PDF
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Coin Toss Modal when user chooses New Match Flip Coin Toss */}
      <CoinTossModal
        visible={coinTossVisible}
        onClose={() => setCoinTossVisible(false)}
      />

      {/* ── Squad management: swap / change / edit ───────────────────────── */}

      {/* SWAP — the two batsmen at the crease exchange ends. */}
      <SwapPlayersModal
        visible={swapModalOpen}
        onClose={() => setSwapModalOpen(false)}
        title="Swap Strike"
        leftLabel="On strike"
        rightLabel="Non-striker"
        left={(() => {
          const s = batsmen.find(b => b.active) || batsmen[0];
          return s?.name ? { name: s.name, role: 'Striker' } : null;
        })()}
        right={(() => {
          const ns = batsmen.find(b => !b.active) || batsmen[1];
          return ns?.name ? { name: ns.name, role: 'Non-striker' } : null;
        })()}
        onConfirm={confirmSwapStrike}
      />

      {/* CHANGE — replace the batsman in one slot with someone off the bench. */}
      <ChangePlayerModal
        visible={changeSlot !== null}
        onClose={() => setChangeSlot(null)}
        title="Substitute Batsman"
        slotLabel="Currently at the crease"
        reason="Pick who comes in to replace them"
        current={(() => {
          const b = changeSlot !== null ? batsmen[changeSlot] : null;
          return b?.name ? { name: b.name, role: b.active ? 'Striker' : 'Non-striker' } : null;
        })()}
        bench={availableBenchBatsmen
          .map(normalizePlayer)
          .filter((p): p is SquadPlayer => p !== null)}
        onConfirm={(incoming) => {
          const slot = changeSlot;
          setChangeSlot(null);
          if (slot !== null) sendInBatsman(incoming.name, slot);
        }}
      />

      {/* EDIT — change a player's own details; nobody moves slots. */}
      <EditPlayerModal
        visible={editSlot !== null}
        onClose={() => setEditSlot(null)}
        player={(() => {
          const b = editSlot !== null ? batsmen[editSlot] : null;
          return b?.name ? { name: b.name } : null;
        })()}
        onSave={(updated) => {
          const slot = editSlot;
          setEditSlot(null);
          if (slot === null) return;
          setBatsmen(prev => prev.map((b, i) => (i === slot ? { ...b, name: updated.name } : b)));
          if (slot === 0) setB1Name(updated.name);
          else if (slot === 1) setB2Name(updated.name);
        }}
      />

      {/* ── Select Playing XI Screen (unified squad manager) ── */}
      <PlayerSelectionModal
        visible={showPlayingXIModal}
        isInitialSetup={isRematchDrafting}
        maxOversPerBowler={ruleMaxOversPerBowler}
        teamAName={teamA}
        teamBName={teamB}
        teamAMascot={teams.find(t => t.name.toLowerCase() === teamA.toLowerCase())?.mascot}
        teamBMascot={teams.find(t => t.name.toLowerCase() === teamB.toLowerCase())?.mascot}
        battingTeamName={battingTeamName || teamA}
        bowlingTeamName={bowlingTeamName || teamB}
        activeStrikerName={(() => {
          const b0 = batsmen[0]?.name || '';
          const b1 = batsmen[1]?.name || '';
          if (batsmen[0]?.active && b0) return b0;
          if (batsmen[1]?.active && b1) return b1;
          return b0;
        })()}
        activeNonStrikerName={(() => {
          const striker = (batsmen[0]?.active && batsmen[0]?.name) ? batsmen[0].name : (batsmen[1]?.active && batsmen[1]?.name ? batsmen[1].name : batsmen[0]?.name || '');
          const strikerKey = striker.trim().toLowerCase();
          const candidate = (batsmen[0]?.active ? batsmen[1]?.name : (batsmen[1]?.active ? batsmen[0]?.name : batsmen[1]?.name)) || '';
          return candidate.trim().toLowerCase() === strikerKey ? '' : candidate;
        })()}
        activeBowlerName={bowler?.name || ''}
        lastOverBowlerName={lastOverBowlerName}
        batsmenStats={(() => {
          const map: Record<string, { runs: number; balls: number; fours: number; sixes: number; sr: string }> = {};
          const addStat = (name: string, runs: number, balls: number, fours: number, sixes: number) => {
            if (!name || !name.trim()) return;
            const sr = balls > 0 ? ((runs / balls) * 100).toFixed(1) : '0.0';
            map[name.trim().toLowerCase()] = { runs, balls, fours, sixes, sr };
          };
          // 1. Base / archive entries
          Object.values(inningsBatsmenArchive || {}).forEach((ab: any) => {
            if (ab && ab.name) addStat(ab.name, ab.runs || 0, ab.balls || 0, ab.fours || 0, ab.sixes || 0);
          });
          // 2. Dismissed batsmen
          (dismissedBatsmen || []).forEach(db => {
            if (db && db.name) addStat(db.name, db.runs || 0, db.balls || 0, db.fours || 0, db.sixes || 0);
          });
          // 3. Live active batsmen (highest precedence)
          (batsmen || []).forEach(b => {
            if (b && b.name) addStat(b.name, b.runs || 0, b.balls || 0, b.fours || 0, b.sixes || 0);
          });
          return map;
        })()}
        bowlerStats={(() => {
          const map: Record<string, { overs: string; maidens: number; runs: number; wickets: number; econ: string }> = {};
          const addBowl = (b: any) => {
            if (!b) return;
            const bName = typeof b === 'string' ? b : b.name;
            if (!bName || !bName.trim()) return;
            const bOvers = typeof b === 'string' ? 0 : (b.overs || 0);
            const bBalls = typeof b === 'string' ? 0 : (b.ballsInOver || 0);
            const bRuns = typeof b === 'string' ? 0 : (b.runs || 0);
            const bWickets = typeof b === 'string' ? 0 : (b.wickets || 0);
            const bMaidens = typeof b === 'string' ? 0 : (b.maidens || 0);
            const totalLegalBalls = bOvers * 6 + bBalls;
            if (totalLegalBalls === 0 && bRuns === 0 && bWickets === 0) return;
            const oversStr = `${bOvers}.${bBalls}`;
            const econ = totalLegalBalls > 0 ? (bRuns / (totalLegalBalls / 6)).toFixed(2) : '0.00';
            map[bName.trim().toLowerCase()] = {
              overs: oversStr,
              maidens: bMaidens,
              runs: bRuns,
              wickets: bWickets,
              econ,
            };
          };
          Object.values(inningsBowlersArchive || {}).forEach(b => addBowl(b));
          (otherBowlers || []).forEach(b => addBowl(b));
          if (bowler && bowler.name) addBowl(bowler);
          return map;
        })()}
        dismissedPlayers={dismissedBatsmen}
        initialPool={allMatchPool}
        initialTeamA={currentPoolA}
        initialTeamB={currentPoolB}
        onClose={() => {
          setShowPlayingXIModal(false);
          setIsRematchDrafting(false);
        }}
        onSkip={() => {
          setShowPlayingXIModal(false);
          if (isRematchDrafting) {
            setIsRematchDrafting(false);
            setRematchTossWinner(teamA);
            setRematchTossDecision('Bat');
            setCoinSide(null);
            setShowRematchTossModal(true);
          }
        }}
        onRetireBatsman={(player, type) => {
          const idx = batsmen.findIndex(b => b && b.name && b.name.trim().toLowerCase() === player.name.trim().toLowerCase());
          if (idx >= 0) {
            setActionTarget({ type: 'retire', batsmanIndex: idx });
            executeRetireBatsman(type);
          }
        }}
        onSwapStrike={() => {
          setBatsmen(prev => {
            if (!prev || prev.length < 2) return prev;
            return [
              { ...prev[0], active: !prev[0].active },
              { ...prev[1], active: !prev[1].active },
            ];
          });
          showToast('info', 'Strike swapped');
        }}
        onSetStriker={(player) => {
          sendInBatsman(player.name, 0);
        }}
        onSetNonStriker={(player) => {
          sendInBatsman(player.name, 1);
        }}
        onSetBowler={(player) => {
          const pNameKey = player.name.trim().toLowerCase();
          const maxBowlerLimit = ruleMaxOversPerBowler === 'unlimited' ? Infinity : (parseInt(ruleMaxOversPerBowler) || Infinity);
          const existingArchived = inningsBowlersArchive[pNameKey];
          const prevBowlRecord = (otherBowlers || []).find(b => b && (typeof b === 'string' ? b.trim().toLowerCase() : b.name && b.name.trim().toLowerCase()) === pNameKey);
          const prevOversCompleted = Math.max(
            existingArchived?.overs || 0,
            typeof prevBowlRecord === 'object' && prevBowlRecord !== null ? (prevBowlRecord.overs || 0) : 0
          );

          if (maxBowlerLimit < Infinity && prevOversCompleted >= maxBowlerLimit) {
            Alert.alert(
              'Max Overs Quota Reached',
              `${player.name} has already bowled ${prevOversCompleted} overs (max limit is ${maxBowlerLimit} ${maxBowlerLimit === 1 ? 'over' : 'overs'} per bowler). Please select a different bowler.`
            );
            return;
          }

          if (lastOverBowlerName && pNameKey === lastOverBowlerName.trim().toLowerCase() && overs > 0 && ballsInCurrentOver === 0) {
            Alert.alert(
              'Consecutive Over Not Allowed',
              `${player.name} bowled the previous over. By cricket rules, the same bowler cannot bowl two consecutive overs. Please assign a different bowler.`
            );
            return;
          }
          if (bowler?.name && bowler.name.trim().toLowerCase() === pNameKey) {
            return;
          }

          if (bowler?.name && bowler.name.trim()) {
            setOtherBowlers(prev => {
              const filtered = (prev || []).filter(b => {
                const bN = typeof b === 'string' ? b : b?.name;
                return bN && bN.trim().toLowerCase() !== bowler.name.trim().toLowerCase();
              });
              return [...filtered, bowler];
            });
          }

          if (existingArchived) {
            setBowler({
              name: player.name,
              overs: Number(existingArchived.overs) || 0,
              ballsInOver: Number(existingArchived.ballsInOver) || 0,
              runs: Number(existingArchived.runs) || 0,
              wickets: Number(existingArchived.wickets) || 0,
              maidens: Number(existingArchived.maidens) || 0,
              avatar: player.avatarUrl || existingArchived.avatar,
            });
          } else if (prevBowlRecord) {
            setBowler({
              name: player.name,
              overs: typeof prevBowlRecord === 'string' ? 0 : (Number(prevBowlRecord.overs) || 0),
              ballsInOver: typeof prevBowlRecord === 'string' ? 0 : (Number(prevBowlRecord.ballsInOver) || 0),
              runs: typeof prevBowlRecord === 'string' ? 0 : (Number(prevBowlRecord.runs) || 0),
              wickets: typeof prevBowlRecord === 'string' ? 0 : (Number(prevBowlRecord.wickets) || 0),
              maidens: typeof prevBowlRecord === 'string' ? 0 : (Number(prevBowlRecord.maidens) || 0),
              avatar: player.avatarUrl || (typeof prevBowlRecord === 'string' ? undefined : prevBowlRecord.avatar),
            });
          } else {
            setBowler({
              name: player.name,
              overs: 0,
              ballsInOver: 0,
              runs: 0,
              wickets: 0,
              maidens: 0,
              avatar: player.avatarUrl,
            });
          }
          setBowlName(player.name);
          showToast('info', `${player.name} is now bowling`);
        }}
        onRetireBowler={(player) => {
          if (bowler?.name) {
            setOtherBowlers(prev => {
              const filtered = (prev || []).filter(b => b && b.name && b.name.trim().toLowerCase() !== bowler.name.trim().toLowerCase());
              return [...filtered, bowler];
            });
          }
          setBowler(prev => ({ ...prev, name: '', avatar: undefined }));
          setBowlName('');
          showToast('info', `${player.name} stepped down from bowling`);
        }}
        onConfirm={(teamAPlayers, teamBPlayers, _unassigned, meta) => {
          const isRematch = isRematchDrafting || matchVictoryData !== null;
          if (isRematch) {
            resetMatchScoringState();
            setIsRematchDrafting(false);
          }

          // Always persist full squad lineups to prevent losing players
          setTeamASquad(teamAPlayers);
          setTeamBSquad(teamBPlayers);

          // Handle batting team swap if changed
          if (meta?.battingTeamName && meta.battingTeamName !== battingTeamName) {
            setBattingTeamName(meta.battingTeamName);
            setBowlingTeamName(meta.bowlingTeamName || (meta.battingTeamName === teamA ? teamB : teamA));
          }

          const effectiveBatTeam = (meta?.battingTeamName || battingTeamName || teamA).trim().toLowerCase();
          const isTeamABatting = effectiveBatTeam === teamA.trim().toLowerCase();
          const currentBatList = isTeamABatting ? teamAPlayers : teamBPlayers;
          const currentBowlList = isTeamABatting ? teamBPlayers : teamAPlayers;

          if (isRematch) {
            setYetToBatBatsmen(currentBatList);
            setOtherBowlers(currentBowlList);
            setShowPlayingXIModal(false);
            setRematchTossWinner(teamA);
            setRematchTossDecision('Bat');
            setCoinSide(null);
            setShowRematchTossModal(true);
            return;
          }

          // If striker or non-striker was explicitly set in modal
          if (meta?.strikerName || meta?.nonStrikerName) {
            const sName = meta?.strikerName?.trim() || '';
            const nsName = meta?.nonStrikerName?.trim() || '';
            const sKey = sName.toLowerCase();
            const nsKey = nsName.toLowerCase();

            setBatsmen(prev => {
              const currentBatsmen = prev || [];
              let newBat0 = currentBatsmen[0] || { name: '', active: true, runs: 0, balls: 0, fours: 0, sixes: 0 };
              let newBat1 = currentBatsmen[1] || { name: '', active: false, runs: 0, balls: 0, fours: 0, sixes: 0 };

              if (sName) {
                const existing = currentBatsmen.find(b => b && b.name && b.name.trim().toLowerCase() === sKey);
                const archived = inningsBatsmenArchive[sKey];
                const sPlayerObj = currentBatList.find(p => p.name.toLowerCase() === sKey);
                const runs = existing ? existing.runs : (archived ? archived.runs : 0);
                const balls = existing ? existing.balls : (archived ? archived.balls : 0);
                const fours = existing ? existing.fours : (archived ? archived.fours : 0);
                const sixes = existing ? existing.sixes : (archived ? archived.sixes : 0);
                const avatar = (sPlayerObj as any)?.avatarUrl || existing?.avatar || archived?.avatar;

                newBat0 = {
                  name: sName,
                  active: true,
                  runs,
                  balls,
                  fours,
                  sixes,
                  avatar,
                };
              }

              if (nsName && nsKey !== sKey) {
                const existing = currentBatsmen.find(b => b && b.name && b.name.trim().toLowerCase() === nsKey);
                const archived = inningsBatsmenArchive[nsKey];
                const nsPlayerObj = currentBatList.find(p => p.name.toLowerCase() === nsKey);
                const runs = existing ? existing.runs : (archived ? archived.runs : 0);
                const balls = existing ? existing.balls : (archived ? archived.balls : 0);
                const fours = existing ? existing.fours : (archived ? archived.fours : 0);
                const sixes = existing ? existing.sixes : (archived ? archived.sixes : 0);
                const avatar = (nsPlayerObj as any)?.avatarUrl || existing?.avatar || archived?.avatar;

                newBat1 = {
                  name: nsName,
                  active: false,
                  runs,
                  balls,
                  fours,
                  sixes,
                  avatar,
                };
              } else if (nsKey === sKey && sName) {
                newBat1 = { name: '', active: false, runs: 0, balls: 0, fours: 0, sixes: 0 };
              }

              return [newBat0, newBat1];
            });

            if (sName) setB1Name(sName);
            if (nsName && nsKey !== sKey) setB2Name(nsName);
            else if (nsKey === sKey) setB2Name('');
          }

          // If bowler was explicitly set in modal
          if (meta?.bowlerName) {
            const b = currentBowlList.find(p => p.name.toLowerCase() === meta.bowlerName?.toLowerCase()) || { name: meta.bowlerName };
            const pNameKey = b.name.trim().toLowerCase();
            const maxBowlerLimit = ruleMaxOversPerBowler === 'unlimited' ? Infinity : (parseInt(ruleMaxOversPerBowler) || Infinity);
            const existingArchived = inningsBowlersArchive[pNameKey];
            const prevBowlRecord = (otherBowlers || []).find(ob => ob && (typeof ob === 'string' ? ob.trim().toLowerCase() : ob.name?.trim().toLowerCase()) === pNameKey);
            const prevOversCompleted = Math.max(
              existingArchived?.overs || 0,
              typeof prevBowlRecord === 'object' && prevBowlRecord !== null ? (prevBowlRecord.overs || 0) : 0
            );

            if (maxBowlerLimit < Infinity && prevOversCompleted >= maxBowlerLimit) {
              showToast('error', `${b.name} has reached max overs quota (${maxBowlerLimit} ov)`);
            } else if (!bowler.name || bowler.name.trim().toLowerCase() !== pNameKey) {
              if (existingArchived) {
                setBowler({
                  name: b.name,
                  overs: Number(existingArchived.overs) || 0,
                  ballsInOver: Number(existingArchived.ballsInOver) || 0,
                  runs: Number(existingArchived.runs) || 0,
                  wickets: Number(existingArchived.wickets) || 0,
                  maidens: Number(existingArchived.maidens) || 0,
                  avatar: (b as any).avatarUrl || existingArchived.avatar,
                });
              } else if (prevBowlRecord) {
                setBowler({
                  name: b.name,
                  overs: typeof prevBowlRecord === 'string' ? 0 : (Number(prevBowlRecord.overs) || 0),
                  ballsInOver: typeof prevBowlRecord === 'string' ? 0 : (Number(prevBowlRecord.ballsInOver) || 0),
                  runs: typeof prevBowlRecord === 'string' ? 0 : (Number(prevBowlRecord.runs) || 0),
                  wickets: typeof prevBowlRecord === 'string' ? 0 : (Number(prevBowlRecord.wickets) || 0),
                  maidens: typeof prevBowlRecord === 'string' ? 0 : (Number(prevBowlRecord.maidens) || 0),
                  avatar: (b as any).avatarUrl || (typeof prevBowlRecord === 'string' ? undefined : prevBowlRecord.avatar),
                });
              } else {
                setBowler({
                  name: b.name,
                  overs: 0,
                  ballsInOver: 0,
                  runs: 0,
                  wickets: 0,
                  maidens: 0,
                  avatar: (b as any).avatarUrl,
                });
              }
              setBowlName(b.name);
            } else {
              setBowler(prev => ({
                ...prev,
                overs: Number(prev.overs) || 0,
                ballsInOver: Number(prev.ballsInOver) || 0,
                runs: Number(prev.runs) || 0,
                wickets: Number(prev.wickets) || 0,
                maidens: Number(prev.maidens) || 0,
              }));
            }
          }

          // If active batsmen are empty, auto-assign from the batting squad
          const activeBatNames = new Set(
            batsmen.map(b => (b && b.name ? b.name.trim().toLowerCase() : '')).filter(Boolean)
          );
          if (activeBatNames.size === 0 && currentBatList.length >= 1) {
            const b1 = currentBatList[0];
            const b2 = currentBatList[1];
            setBatsmen([
              { name: b1.name, active: true, runs: 0, balls: 0, fours: 0, sixes: 0, avatar: b1.avatarUrl },
              b2 ? { name: b2.name, active: false, runs: 0, balls: 0, fours: 0, sixes: 0, avatar: b2.avatarUrl } : { name: '', active: false, runs: 0, balls: 0, fours: 0, sixes: 0 },
            ]);
            setB1Name(b1.name);
            if (b2) setB2Name(b2.name);
          }

          const activeBowlerName = bowler?.name ? bowler.name.trim().toLowerCase() : '';
          if (!activeBowlerName && currentBowlList.length >= 1) {
            const b = currentBowlList[0];
            const bKey = b.name.trim().toLowerCase();
            const existingArchived = inningsBowlersArchive[bKey];
            if (existingArchived) {
              setBowler({
                name: b.name,
                overs: Number(existingArchived.overs) || 0,
                ballsInOver: Number(existingArchived.ballsInOver) || 0,
                runs: Number(existingArchived.runs) || 0,
                wickets: Number(existingArchived.wickets) || 0,
                maidens: Number(existingArchived.maidens) || 0,
                avatar: b.avatarUrl || existingArchived.avatar,
              });
            } else {
              setBowler({ name: b.name, overs: 0, ballsInOver: 0, runs: 0, wickets: 0, maidens: 0, avatar: b.avatarUrl });
            }
            setBowlName(b.name);
          }

          const updatedActiveBatNames = new Set(
            batsmen.map(b => (b && b.name ? b.name.trim().toLowerCase() : '')).filter(Boolean)
          );
          const dismissedNames = new Set(
            dismissedBatsmen.map(d => (d && d.name ? d.name.trim().toLowerCase() : '')).filter(Boolean)
          );

          const newYetToBat = currentBatList.filter(
            p => p.name && !updatedActiveBatNames.has(p.name.trim().toLowerCase()) && !dismissedNames.has(p.name.trim().toLowerCase())
          );
          setYetToBatBatsmen(newYetToBat);

          const updatedActiveBowlerName = bowler?.name ? bowler.name.trim().toLowerCase() : '';
          const newOtherBowlers = currentBowlList.filter(
            p => p.name && p.name.trim().toLowerCase() !== updatedActiveBowlerName
          );
          setOtherBowlers(newOtherBowlers);

          setShowPlayingXIModal(false);
          showToast('success', 'Squad lineups updated');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  bannerWrapper: {
    paddingHorizontal: Spacing.containerMargin,
    marginTop: Spacing.sm,
  },
  scoreBanner: {
    borderRadius: 12,
    padding: 10,
    position: 'relative',
    overflow: 'hidden',
    ...Shadows.level2,
  },
  bannerWatermark: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    width: '40%',
    height: '100%',
    opacity: 0.08,
  },
  bannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bannerLeftCol: {
    width: '60%',
  },
  teamTitle: {
    color: '#ffffff',
    fontFamily: 'Sora_500Medium',
    fontSize: 17,
    lineHeight: 22,
  },
  bannerRightCol: {
    alignItems: 'flex-end',
  },
  scoreText: {
    color: '#5D68E8',
    fontFamily: 'Sora_500Medium',
    fontSize: 26,
    lineHeight: 30,
  },
  oversText: {
    color: '#ffffffaa',
    fontSize: 12,
    marginTop: 1,
  },
  bannerStatsRow: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
    gap: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: Spacing.sm,
  },
  bannerStatItem: {
    flexDirection: 'column',
  },
  section: {
    marginTop: 10,
    paddingHorizontal: Spacing.containerMargin,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    ...Shadows.level2,
  },
  logBallsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    paddingVertical: 6,
  },
  logBall: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#05151e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bowlerNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  bowlerOverDots: {
    flexDirection: 'row',
    gap: 4,
  },
  bowlerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tableCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    ...Shadows.level2,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#00000005',
  },
  batsmanNameCell: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '38%',
  },
  batStatsCells: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-between',
  },
  statCell: {
    alignItems: 'center',
    width: 32,
  },
  statLabel: {
    fontSize: 9,
    opacity: 0.5,
    marginBottom: 2,
  },
  consoleCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    ...Shadows.level2,
  },
  runsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  scoringButton: {
    width: '31%',
    aspectRatio: 1.15,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  scoringButtonNormal: {
    borderBottomWidth: 3,
  },
  scoringButtonPressed: {
    borderBottomWidth: 1,
    transform: [{ translateY: 2 }],
  },
  extrasRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  extraButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#c4c6cf',
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  wicketButton: {
    flex: 3,
    height: 36,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  undoButton: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  consoleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
  },
  footerLinkRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  footerLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completeOverBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordBallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  playerAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 21, 30, 0.6)',
    width: '100%',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
  },
  modalContent: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    maxHeight: '88%',
    width: '94%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#0000000a',
    paddingBottom: 10,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalScrollContent: {
    paddingBottom: 80,
  },
  modalInput: {
    height: 38,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 10,
    fontSize: 13,
    marginBottom: 10,
    fontFamily: 'Sora_500Medium',
  },
  statsEditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  statEditCol: {
    flex: 1,
  },
  statInput: {
    height: 32,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    textAlign: 'center',
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Sora_500Medium',
  },
  smallActionChip: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  cancelBtn: {
    flex: 1,
    height: 40,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtn: {
    flex: 1,
    height: 40,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  squadChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subOptionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtn: {
    paddingHorizontal: 14,
    height: 38,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainActionButtons: {
    marginVertical: Spacing.sm,
  },
  mainUndoBtn: {
    flexDirection: 'row',
    height: 44,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainEndMatchBtn: {
    flexDirection: 'row',
    height: 44,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stickyBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.containerMargin,
    paddingTop: Spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? 24 : Spacing.md,
    borderTopWidth: 1,
    zIndex: 100,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
  rulesGroup: {
    marginBottom: Spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    padding: 12,
    borderRadius: BorderRadius.md,
  },
  rulesGroupLabel: {
    marginBottom: Spacing.sm,
    fontFamily: 'Sora_500Medium',
  },
  rulesOptionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  ruleOptionChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  ruleCheckbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  extraOptionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  subTabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: Spacing.sm,
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  subTabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 4,
    marginRight: 0,
  },
  subTabText: {
    fontSize: 11,
    fontFamily: 'Sora_500Medium',
    textAlign: 'center',
  },
});
