import React from 'react';
import {
  StyleSheet,
  View,
  Modal,
  Pressable,
  ScrollView,
  Alert,
  Clipboard,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { BorderRadius, Shadows } from '@/constants/theme';
import { FoFConnectionResult } from '@/services/fof-network';

interface FoFTeamConnectionsModalProps {
  visible: boolean;
  teamName: string;
  connections: FoFConnectionResult[];
  onClose: () => void;
}

export function FoFTeamConnectionsModal({
  visible,
  teamName,
  connections,
  onClose,
}: FoFTeamConnectionsModalProps) {
  const theme = useTheme();

  const copyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied!', `${label} (${text}) copied to clipboard.`);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: '#f8fafc' }, Shadows.level3]}>
          {/* Top Drag Indicator */}
          <View style={styles.dragHandle} />

          {/* Premium Gradient Header Banner */}
          <LinearGradient
            colors={['#4338ca', '#6366f1', '#8b5cf6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <View style={styles.headerTopRow}>
              <View style={styles.headerIconWrap}>
                <Ionicons name="git-network" size={20} color="#ffffff" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <ThemedText style={styles.headerTitle} numberOfLines={1}>
                    {teamName || 'Team'}
                  </ThemedText>
                </View>
                <ThemedText style={styles.headerSubtitle}>
                  3-Chain FoF Network • {connections.length} Mutual Player{connections.length !== 1 ? 's' : ''} in Squad
                </ThemedText>
              </View>
              <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
                <Ionicons name="close-circle" size={26} color="rgba(255, 255, 255, 0.85)" />
              </Pressable>
            </View>
          </LinearGradient>

          {/* Player Cards List */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {connections.map((conn, idx) => {
              const safeAvatar =
                typeof conn.targetAvatar === 'string' &&
                (conn.targetAvatar.startsWith('http') || conn.targetAvatar.startsWith('data:'))
                  ? { uri: conn.targetAvatar }
                  : { uri: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80' };

              const cardBorderColor =
                conn.degree === 1 ? '#10b981' : conn.degree === 2 ? '#6366f1' : '#8b5cf6';

              return (
                <View
                  key={`${conn.targetPhone}-${idx}`}
                  style={[styles.playerCard, { borderLeftColor: cardBorderColor }]}
                >
                  {/* Card Top: Avatar, Name */}
                  <View style={styles.playerCardHeader}>
                    <View style={styles.avatarWrap}>
                      <Image source={safeAvatar} style={styles.playerAvatar} contentFit="cover" />
                    </View>

                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <View style={styles.nameRow}>
                        <ThemedText style={styles.playerName} numberOfLines={1}>
                          {conn.targetName}
                        </ThemedText>
                      </View>

                      <View style={styles.playerMetaRow}>
                        <ThemedText style={styles.playerRoleText} numberOfLines={1}>
                          {conn.targetRole || 'Squad Member'}
                        </ThemedText>
                        <ThemedText style={styles.metaDot}>•</ThemedText>
                        <Pressable
                          onPress={() => copyToClipboard(conn.targetPhone, 'Phone Number')}
                          style={styles.phonePill}
                        >
                          <Ionicons name="call" size={10} color="#4338ca" />
                          <ThemedText style={styles.phoneText}>
                            {conn.targetPhone}
                          </ThemedText>
                          <Ionicons name="copy-outline" size={10} color="#6366f1" />
                        </Pressable>
                      </View>
                    </View>
                  </View>

                  {/* Subway-Style Connection Chain Route Map */}
                  <View style={styles.chainRouteContainer}>
                    <View style={styles.chainHeaderRow}>
                      <MaterialCommunityIcons name="transit-connection-variant" size={12} color="#6366f1" />
                      <ThemedText style={styles.chainHeaderTitle}>
                        CONNECTION CHAIN ROUTE
                      </ThemedText>
                    </View>

                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.chainNodesRow}
                    >
                      {conn.chainPath.map((node, nodeIdx) => {
                        const isFirst = nodeIdx === 0;
                        const isLast = nodeIdx === conn.chainPath.length - 1;
                        const nodeColor = isFirst ? '#10b981' : isLast ? conn.badgeColor : '#6366f1';

                        return (
                          <React.Fragment key={`${node.phone}-${nodeIdx}`}>
                            <View style={[styles.nodeCard, { borderColor: nodeColor + '40' }]}>
                              <View style={[styles.nodeIndexCircle, { backgroundColor: nodeColor }]}>
                                <ThemedText style={styles.nodeIndexText}>
                                  {nodeIdx + 1}
                                </ThemedText>
                              </View>
                              <View>
                                <ThemedText style={styles.nodeNameText} numberOfLines={1}>
                                  {node.name}
                                </ThemedText>
                                <ThemedText style={styles.nodePhoneHint}>
                                  {isFirst ? 'You' : node.phone.slice(-5)}
                                </ThemedText>
                              </View>
                            </View>

                            {!isLast && (
                              <View style={styles.arrowWrap}>
                                <View style={styles.connectorLine} />
                                <Ionicons name="chevron-forward" size={12} color="#6366f1" />
                              </View>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </ScrollView>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Footer Action Button */}
          <View style={styles.footerWrap}>
            <Pressable onPress={onClose} style={({ pressed }) => [pressed && { opacity: 0.9 }]}>
              <LinearGradient
                colors={['#4f46e5', '#6366f1', '#7c3aed']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.doneBtn}
              >
                <Ionicons name="checkmark-circle" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                <ThemedText style={styles.doneBtnText}>
                  Close Directory
                </ThemedText>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '84%',
    overflow: 'hidden',
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  headerGradient: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Sora_600SemiBold',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    fontFamily: 'Sora_600SemiBold',
    marginTop: 2,
  },
  closeBtn: {
    padding: 2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 12,
  },
  playerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  playerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    position: 'relative',
  },
  playerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  playerName: {
    fontSize: 14.5,
    fontFamily: 'Sora_600SemiBold',
    color: '#0f172a',
    flex: 1,
  },
  playerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  playerRoleText: {
    fontSize: 11,
    color: '#64748b',
    fontFamily: 'Sora_600SemiBold',
  },
  metaDot: {
    fontSize: 10,
    color: '#94a3b8',
  },
  phonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#eef2ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  phoneText: {
    fontSize: 10.5,
    fontFamily: 'Sora_600SemiBold',
    color: '#3730a3',
  },
  chainRouteContainer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  chainHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  chainHeaderTitle: {
    fontSize: 9.5,
    fontFamily: 'Sora_600SemiBold',
    color: '#6366f1',
    letterSpacing: 0.6,
  },
  chainNodesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nodeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  nodeIndexCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodeIndexText: {
    fontSize: 9,
    fontFamily: 'Sora_600SemiBold',
    color: '#ffffff',
  },
  nodeNameText: {
    fontSize: 11,
    fontFamily: 'Sora_600SemiBold',
    color: '#0f172a',
  },
  nodePhoneHint: {
    fontSize: 9,
    color: '#64748b',
    fontFamily: 'Sora_500Medium',
  },
  arrowWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  connectorLine: {
    width: 4,
    height: 1.5,
    backgroundColor: '#c7d2fe',
  },
  footerWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 22,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  doneBtn: {
    flexDirection: 'row',
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  doneBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontFamily: 'Sora_600SemiBold',
    letterSpacing: 0.3,
  },
});
