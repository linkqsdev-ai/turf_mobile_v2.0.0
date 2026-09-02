import React from 'react';
import {
  StyleSheet,
  View,
  Modal,
  Pressable,
  ScrollView,
  Platform,
  Alert,
  Clipboard,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { BorderRadius, Shadows, Spacing } from '@/constants/theme';
import { FoFConnectionResult, getFoFConnection } from '@/services/fof-network';

interface FoFChainVisualizerModalProps {
  visible: boolean;
  targetQuery: string; // Phone or Player Name
  onClose: () => void;
  onSelectAction?: (phone: string, name: string) => void;
  actionButtonText?: string;
}

export function FoFChainVisualizerModal({
  visible,
  targetQuery,
  onClose,
  onSelectAction,
  actionButtonText = 'Challenge Player / Squad',
}: FoFChainVisualizerModalProps) {
  const theme = useTheme();
  const conn: FoFConnectionResult = getFoFConnection(targetQuery);

  const copyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied!', `${label} (${text}) copied to clipboard.`);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level3]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.networkIconBg, { backgroundColor: conn.badgeBg }]}>
                <Ionicons name="git-network" size={20} color={conn.badgeColor} />
              </View>
              <View>
                <ThemedText style={{ fontSize: 16, fontFamily: 'Sora_500Medium', color: theme.text }}>
                  3-Chain FoF Network
                </ThemedText>
                <ThemedText style={{ fontSize: 11, color: theme.textSecondary, fontFamily: 'Sora_500Medium' }}>
                  Phone-Number Verified Social Graph
                </ThemedText>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={theme.text} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }}>
            {/* Target Profile Highlight */}
            <View style={[styles.targetCard, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33' }]}>
              <Image source={{ uri: conn.targetAvatar }} style={styles.targetAvatar} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <ThemedText style={{ fontSize: 15, fontFamily: 'Sora_500Medium', color: theme.text }}>
                    {conn.targetName}
                  </ThemedText>
                </View>

                <Pressable
                  onPress={() => copyToClipboard(conn.targetPhone, 'Phone Number')}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}
                >
                  <Ionicons name="call-outline" size={13} color={theme.primary} />
                  <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_500Medium', color: theme.primary }}>
                    {conn.targetPhone}
                  </ThemedText>
                  <Ionicons name="copy-outline" size={11} color={theme.textSecondary} style={{ marginLeft: 2 }} />
                </Pressable>

                <ThemedText style={{ fontSize: 11, color: theme.textSecondary, marginTop: 2 }}>
                  {conn.targetRole} • {conn.targetTeam}
                </ThemedText>
              </View>
            </View>

            {/* Trust Meter Box */}
            <View style={[styles.trustBox, { backgroundColor: '#10B98112', borderColor: '#10B98133' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="shield-checkmark" size={18} color="#10B981" />
                  <ThemedText style={{ fontSize: 12.5, fontFamily: 'Sora_500Medium', color: '#10B981' }}>
                    {conn.trustScore}% Network Trust Verified
                  </ThemedText>
                </View>
                <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_500Medium', color: '#10B981' }}>
                  {conn.degree === 1 ? 'Direct Contact' : conn.degree === 2 ? '2-Hop Connection' : '3-Chain FoF'}
                </ThemedText>
              </View>
              <ThemedText style={{ fontSize: 10.5, color: theme.textSecondary, marginTop: 4, lineHeight: 15 }}>
                {conn.description}
              </ThemedText>
            </View>

            {/* 3-Chain Visual Flow Diagram */}
            <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: theme.textSecondary, textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.5, marginTop: 6 }}>
              3-CHAIN PHONE CONNECTION PATH
            </ThemedText>

            <View style={styles.chainContainer}>
              {conn.chainPath.map((node, index) => {
                const isFirst = index === 0;
                const isLast = index === conn.chainPath.length - 1;
                const isIntermediate = !isFirst && !isLast;

                return (
                  <View key={`node-${index}`} style={styles.chainNodeWrapper}>
                    {/* Node Row */}
                    <View style={[
                      styles.nodeCard,
                      { backgroundColor: theme.surfaceLow, borderColor: isLast ? conn.badgeColor : theme.outlineVariant + '44' },
                      isLast && { borderWidth: 1.5, backgroundColor: conn.badgeBg }
                    ]}>
                      {/* Avatar / Icon */}
                      {node.avatar ? (
                        <Image source={{ uri: node.avatar }} style={styles.nodeAvatar} />
                      ) : (
                        <View style={[styles.nodeIconFallback, { backgroundColor: isFirst ? theme.primary + '20' : '#8b5cf620' }]}>
                          <Ionicons name={isFirst ? "person" : "people"} size={16} color={isFirst ? theme.primary : '#8b5cf6'} />
                        </View>
                      )}

                      {/* Info */}
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <ThemedText style={{ fontSize: 13, fontFamily: 'Sora_500Medium', color: theme.text }}>
                            {node.name} {isFirst ? '(You)' : ''}
                          </ThemedText>
                        </View>

                        {/* Phone Row */}
                        <Pressable
                          onPress={() => copyToClipboard(node.phone, `${node.name}'s Phone`)}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}
                        >
                          <Ionicons name="call" size={11} color={theme.textSecondary} />
                          <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: theme.textSecondary }}>
                            {node.phone}
                          </ThemedText>
                          <Ionicons name="copy-outline" size={10} color={theme.textSecondary} />
                        </Pressable>
                      </View>
                    </View>

                    {/* Connecting Vertical Link / Arrow */}
                    {!isLast && (
                      <View style={styles.connectorRow}>
                        <View style={[styles.connectorLine, { backgroundColor: conn.badgeColor }]} />
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <Pressable
              onPress={onClose}
              style={[{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: theme.surfaceLow, borderWidth: 1, borderColor: theme.outlineVariant + '44', alignItems: 'center' }]}
            >
              <ThemedText style={{ fontSize: 13, fontFamily: 'Sora_500Medium', color: theme.text }}>
                Close
              </ThemedText>
            </Pressable>

            {onSelectAction && (
              <Pressable
                onPress={() => {
                  onSelectAction(conn.targetPhone, conn.targetName);
                  onClose();
                }}
                style={[{ flex: 2, paddingVertical: 12, borderRadius: 10, backgroundColor: theme.primary, alignItems: 'center' }]}
              >
                <ThemedText style={{ fontSize: 13, fontFamily: 'Sora_500Medium', color: '#ffffff' }}>
                  {actionButtonText}
                </ThemedText>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    maxHeight: '88%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 18,
    paddingBottom: Platform.OS === 'ios' ? 32 : 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  networkIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    padding: 4,
  },
  targetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  targetAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  trustBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  chainContainer: {
    gap: 0,
  },
  chainNodeWrapper: {
    alignItems: 'stretch',
  },
  nodeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  nodeAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  nodeIconFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectorRow: {
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  connectorLine: {
    position: 'absolute',
    width: 2,
    height: '100%',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
});
