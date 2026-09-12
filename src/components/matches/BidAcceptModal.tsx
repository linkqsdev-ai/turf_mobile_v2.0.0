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
import { PulseDot } from '@/components/home/dashboard-widgets';

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
          
          {/* Section Eyebrow: BID MATCH */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, alignSelf: 'flex-start' }}>
            <View style={{ width: 3, height: 13, borderRadius: 2, backgroundColor: '#10B981' }} />
            <ThemedText style={{ fontFamily: 'Sora_500Medium', fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase', color: theme.textSecondary }}>
              ACCEPT CHALLENGE
            </ThemedText>
          </View>

          {/* Header Title Row */}
          <View style={{ width: '100%', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <ThemedText style={{ fontFamily: 'Sora_500Medium', fontSize: 15.5, color: theme.text }}>
                  Accept match challenge
                </ThemedText>
                <PulseDot color="#10B981" size={8} />
              </View>
              <ThemedText style={{ fontFamily: 'Sora_400Regular', fontSize: 10.5, marginTop: 2, lineHeight: 14, color: theme.textSecondary }}>
                You are about to accept the match challenge proposed by <ThemedText style={{ fontFamily: 'Sora_500Medium', color: theme.text }}>{challenger}</ThemedText>.
              </ThemedText>
            </View>
            <Pressable
              onPress={onClose}
              style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: theme.surfaceHigh, justifyContent: 'center', alignItems: 'center' }}
            >
              <Ionicons name="close" size={16} color={theme.textSecondary} />
            </Pressable>
          </View>

          {/* 🌐 3-Chain Friend of Friend Trust & Phone Verification Card */}
          <Pressable
            onPress={() => setShowChainModal(true)}
            style={({ pressed }) => [
              styles.fofTrustCard,
              { backgroundColor: '#8b5cf60c', borderColor: '#8b5cf633' },
              pressed && { opacity: 0.9 },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="git-network" size={14} color="#8b5cf6" />
                <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: '#8b5cf6' }}>
                  {fofConn.degreeLabel}
                </ThemedText>
              </View>

              <View style={{ backgroundColor: '#10b98122', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 }}>
                <ThemedText style={{ fontSize: 9.5, fontFamily: 'Sora_500Medium', color: '#10b981' }}>
                  ✓ {fofConn.trustScore}% Trust
                </ThemedText>
              </View>
            </View>

            {/* Challenger Phone + Chain Path */}
            <View style={{ marginTop: 5 }}>
              <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_500Medium', color: theme.text }}>
                Challenger Phone: <ThemedText style={{ color: theme.primary, fontFamily: 'Sora_500Medium' }}>{fofConn.targetPhone}</ThemedText>
              </ThemedText>
              <ThemedText style={{ fontSize: 9.5, color: theme.textSecondary, marginTop: 2, fontFamily: 'Sora_400Regular' }} numberOfLines={1}>
                {fofConn.chainSummary}
              </ThemedText>
            </View>
          </Pressable>

          {/* Section Eyebrow: MATCH & VENUE DETAILS */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, marginBottom: 8, alignSelf: 'flex-start' }}>
            <View style={{ width: 3, height: 13, borderRadius: 2, backgroundColor: '#3B82F6' }} />
            <ThemedText style={{ fontFamily: 'Sora_500Medium', fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase', color: theme.textSecondary }}>
              MATCH & VENUE DETAILS
            </ThemedText>
          </View>

          {/* Details Card */}
          <View style={[styles.detailsBox, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
            <View style={styles.detailRow}>
              <ThemedText style={styles.labelCol}>MATCH</ThemedText>
              <ThemedText style={styles.valueCol}>
                {match.tournament || 'Bid Challenge Match'}
              </ThemedText>
            </View>

            <View style={styles.detailRow}>
              <ThemedText style={styles.labelCol}>CHALLENGER</ThemedText>
              <ThemedText style={[styles.valueCol, { color: theme.primary }]}>
                {match.team1} (by {challenger})
              </ThemedText>
            </View>

            <View style={styles.detailRow}>
              <ThemedText style={styles.labelCol}>VENUE</ThemedText>
              <ThemedText style={styles.valueCol}>
                {match.location || 'Skyline Turf Arena, Court #1'}
              </ThemedText>
            </View>

            <View style={styles.detailRow}>
              <ThemedText style={styles.labelCol}>SCHEDULE</ThemedText>
              <ThemedText style={styles.valueCol}>
                {match.time || 'Today, 8:00 PM'}
              </ThemedText>
            </View>

            <View style={[styles.detailRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <ThemedText style={styles.labelCol}>BID STAKE</ThemedText>
              <View style={styles.coinBadge}>
                <Ionicons name="sparkles" size={12} color="#d97706" />
                <ThemedText style={{ color: '#d97706', fontFamily: 'Sora_500Medium', fontSize: 11, marginLeft: 4 }}>
                  ₹{stakeCoins} ({stakeCoins} Coins)
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Buttons matching Dashboard Buttons */}
          <View style={styles.buttonRow}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.cancelBtn,
                { borderColor: theme.outlineVariant, opacity: pressed ? 0.8 : 1 }
              ]}
            >
              <ThemedText style={{ color: theme.text, fontFamily: 'Sora_500Medium', fontSize: 12 }}>
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
              <Ionicons name="checkmark" size={15} color="#ffffff" style={{ marginRight: 4 }} />
              <ThemedText style={{ color: '#ffffff', fontFamily: 'Sora_500Medium', fontSize: 12 }}>
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
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    padding: 18,
    alignItems: 'center',
  },
  fofTrustCard: {
    width: '100%',
    padding: 11,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 10,
  },
  detailsBox: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 13,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 7,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  labelCol: {
    color: '#64748b',
    fontFamily: 'Sora_500Medium',
    fontSize: 10.5,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  valueCol: {
    fontFamily: 'Sora_500Medium',
    fontSize: 12,
  },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 38,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtn: {
    flex: 1.3,
    height: 38,
    borderRadius: 999,
    backgroundColor: '#10b981',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
