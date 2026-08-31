import React from 'react';
import {
  StyleSheet,
  View,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Shadows, Spacing } from '@/constants/theme';
import { useToast } from '@/context/ToastContext';
import { useNotifications } from '@/context/NotificationContext';
import { useWalletStore } from '@/store/app-store';

import { getFoFConnection } from '@/services/fof-network';
import { FoFChainVisualizerModal } from '@/components/fof/FoFChainVisualizerModal';

export interface BidMatchDetails {
  id: string;
  tournament?: string;
  location?: string;
  team1: string;
  team2: string;
  time?: string;
  status?: string;
  bidCoins?: number;
  challengerName?: string;
  challengerPhone?: string;
}

interface BidAcceptModalProps {
  visible: boolean;
  match: BidMatchDetails | null;
  onClose: () => void;
  onConfirm: (matchId: string) => void;
}

export function BidAcceptModal({ visible, match, onClose, onConfirm }: BidAcceptModalProps) {
  const theme = useTheme();
  const { showSuccess, showError } = useToast();
  const { addNotification } = useNotifications();
  const { walletBalance, deductWalletFunds } = useWalletStore();
  const [showChainModal, setShowChainModal] = React.useState(false);

  if (!match) return null;

  const stakeCoins = match.bidCoins || 200;
  const challenger = match.challengerName || match.team1 || 'Rahul Sharma';
  const fofConn = getFoFConnection(match.challengerPhone || challenger);

  const handleConfirm = () => {
    // Check wallet balance if required
    if (walletBalance < stakeCoins) {
      showError('Insufficient Balance', `You need at least ${stakeCoins} coins in your wallet.`);
      return;
    }

    // Deduct coins
    deductWalletFunds(stakeCoins);

    // Call onConfirm callback
    onConfirm(match.id);

    // Show attractive success toast
    showSuccess(
      'Bid Challenge Accepted! 🎉',
      `Match against ${match.team1} is confirmed! ${stakeCoins} Coins stake locked.`
    );

    // Add role-targeted notification
    addNotification({
      title: 'Bid Challenge Accepted!',
      body: `You accepted the ${stakeCoins} Coins match challenge against ${match.team1} (${fofConn.targetPhone}) at ${match.location || 'Skyline Turf'}.`,
      targetRole: 'Player',
      type: 'bid',
    });

    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, Shadows.level3, { backgroundColor: theme.surfaceLowest }]}>
          {/* Header Icon */}
          <View style={styles.headerIconWrap}>
            <Ionicons name="hand-left" size={28} color="#10B981" />
          </View>

          <ThemedText type="headlineLg" style={styles.titleText}>
            Accept Bid Challenge?
          </ThemedText>

          <ThemedText type="bodySm" style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 4, paddingHorizontal: 10 }}>
            You are about to accept the match challenge proposed by <ThemedText type="bodySm" style={{ fontFamily: 'Sora_700Bold', color: theme.text }}>{challenger}</ThemedText>.
          </ThemedText>

          {/* 🌐 3-Chain Friend of Friend Trust & Phone Verification Card */}
          <Pressable
            onPress={() => setShowChainModal(true)}
            style={({ pressed }) => [
              styles.fofTrustCard,
              { backgroundColor: fofConn.badgeBg, borderColor: fofConn.badgeColor + '35' },
              pressed && { opacity: 0.9 },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="git-network" size={15} color={fofConn.badgeColor} />
                <ThemedText style={{ fontSize: 11.5, fontFamily: 'Sora_700Bold', color: fofConn.badgeColor }}>
                  {fofConn.degreeLabel}
                </ThemedText>
              </View>

              <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_700Bold', color: '#10B981' }}>
                ✓ {fofConn.trustScore}% Trust
              </ThemedText>
            </View>

            {/* Challenger Phone + Chain Path */}
            <View style={{ marginTop: 4 }}>
              <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_600SemiBold', color: theme.text }}>
                Challenger Phone: <ThemedText style={{ color: theme.primary, fontFamily: 'Sora_700Bold' }}>{fofConn.targetPhone}</ThemedText>
              </ThemedText>
              <ThemedText style={{ fontSize: 9.5, color: theme.textSecondary, marginTop: 2 }} numberOfLines={1}>
                {fofConn.chainSummary}
              </ThemedText>
            </View>
          </Pressable>

          {/* Details Card */}
          <View style={[styles.detailsBox, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33' }]}>
            <View style={styles.detailRow}>
              <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>MATCH</ThemedText>
              <ThemedText type="bodySm" style={{ fontFamily: 'Sora_700Bold' }}>
                {match.tournament || 'Bid Challenge Match'}
              </ThemedText>
            </View>

            <View style={styles.detailRow}>
              <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>CHALLENGER</ThemedText>
              <ThemedText type="bodySm" style={{ fontFamily: 'Sora_700Bold', color: theme.primary }}>
                {match.team1} (by {challenger})
              </ThemedText>
            </View>

            <View style={styles.detailRow}>
              <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>VENUE</ThemedText>
              <ThemedText type="bodySm" style={{ fontFamily: 'Sora_600SemiBold', color: theme.text }}>
                {match.location || 'Skyline Turf Arena, Court #1'}
              </ThemedText>
            </View>

            <View style={styles.detailRow}>
              <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>SCHEDULE</ThemedText>
              <ThemedText type="bodySm" style={{ fontFamily: 'Sora_600SemiBold', color: theme.text }}>
                {match.time || 'Today, 8:00 PM'}
              </ThemedText>
            </View>

            <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
              <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>BID STAKE</ThemedText>
              <View style={styles.coinBadge}>
                <Ionicons name="sparkles" size={12} color="#F59E0B" />
                <ThemedText type="labelMd" style={{ color: '#D97706', fontFamily: 'Sora_800ExtraBold', marginLeft: 4 }}>
                  ₹{stakeCoins} ({stakeCoins} Coins)
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.cancelBtn,
                { backgroundColor: theme.surfaceLow, opacity: pressed ? 0.8 : 1 }
              ]}
            >
              <ThemedText type="labelMd" style={{ color: theme.textSecondary, fontFamily: 'Sora_700Bold' }}>
                Cancel
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={handleConfirm}
              style={({ pressed }) => [
                styles.confirmBtn,
                { opacity: pressed ? 0.9 : 1 }
              ]}
            >
              <Ionicons name="checkmark" size={16} color="#ffffff" style={{ marginRight: 4 }} />
              <ThemedText type="labelMd" style={{ color: '#ffffff', fontFamily: 'Sora_700Bold' }}>
                Accept Bid
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </View>

      {/* 🌐 3-Chain Graph Inspection Modal */}
      <FoFChainVisualizerModal
        visible={showChainModal}
        targetQuery={match.challengerPhone || challenger}
        onClose={() => setShowChainModal(false)}
        actionButtonText="Confirm & Accept Challenge"
        onSelectAction={() => handleConfirm()}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
  },
  headerIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#10B9811A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleText: {
    fontFamily: 'Sora_800ExtraBold',
    fontSize: 18,
    textAlign: 'center',
  },
  fofTrustCard: {
    width: '100%',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
  },
  detailsBox: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginTop: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B1A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtn: {
    flex: 1.2,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
