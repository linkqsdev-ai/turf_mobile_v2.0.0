import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  Pressable,
  ScrollView,
  Alert,
  Clipboard,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { BorderRadius, Shadows, Spacing } from '@/constants/theme';
import { FoFConnectionResult, setFoFCurrentUser } from '@/services/fof-network';
import { useUserProfile } from '@/hooks/use-user-profile';

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
  const { profile } = useUserProfile();

  useEffect(() => {
    if (profile?.name) {
      setFoFCurrentUser({
        name: profile.name,
        phone: profile.phone || '+91 98765 00001',
        avatar: typeof profile.avatarUrl === 'string' ? profile.avatarUrl : undefined,
        role: profile.role || 'Host / Player',
      });
    }
  }, [profile]);

  const copyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied!', `${label} (${text}) copied to clipboard.`);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.backdropPressable} onPress={onClose} />

        <View style={[styles.modalContent, { backgroundColor: theme.surfaceLowest }, Shadows.level3]}>
          {/* Top Drag Indicator */}
          <View style={[styles.dragHandle, { backgroundColor: theme.outlineVariant + '44' }]} />

          {/* ── Premium Sports Header Banner ─────────────────── */}
          <View
            style={[
              styles.headerContainer,
              {
                backgroundColor: theme.surfaceLowest,
                borderBottomColor: theme.outlineVariant + '20',
              },
            ]}
          >
            <LinearGradient
              colors={[theme.primary + '14', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.headerTopRow}>
              <View
                style={[
                  styles.headerIconWrap,
                  {
                    backgroundColor: theme.primary + '15',
                    borderColor: theme.primary + '35',
                  },
                ]}
              >
                <Ionicons name="git-network" size={20} color={theme.primary} />
              </View>

              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <ThemedText style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
                    {teamName || 'Opponent Team'}
                  </ThemedText>
                  <View style={[styles.squadBadge, { backgroundColor: theme.primary + '18', borderColor: theme.primary + '33' }]}>
                    <ThemedText style={[styles.squadBadgeText, { color: theme.primary }]}>
                      FoF Network
                    </ThemedText>
                  </View>
                </View>

                <ThemedText style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                  3-Chain Social Graph • {connections.length} Mutual Player{connections.length !== 1 ? 's' : ''} in Squad
                </ThemedText>
              </View>

              <Pressable
                onPress={onClose}
                style={[styles.closeBtn, { backgroundColor: theme.surfaceHigh }]}
                hitSlop={8}
              >
                <Ionicons name="close" size={18} color={theme.text} />
              </Pressable>
            </View>

            {/* Social Graph Insight Bar */}
            <View
              style={[
                styles.graphInsightBar,
                {
                  backgroundColor: theme.surfaceLow,
                  borderColor: theme.outlineVariant + '25',
                },
              ]}
            >
              <Ionicons name="shield-checkmark" size={14} color={theme.primary} />
              <ThemedText style={[styles.graphInsightText, { color: theme.textSecondary }]}>
                Phone-number verified trust graph linked to <ThemedText style={{ color: theme.primary, fontFamily: 'Sora_600SemiBold', fontSize: 10.5 }}>{profile.name || 'You'}</ThemedText>
              </ThemedText>
            </View>
          </View>

          {/* ── Player Connections List ────────────────────────── */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {connections.map((conn, idx) => {
              const safeAvatar =
                typeof conn.targetAvatar === 'string' &&
                (conn.targetAvatar.startsWith('http') || conn.targetAvatar.startsWith('data:'))
                  ? { uri: conn.targetAvatar }
                  : { uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=85' };

              const degreeLabel =
                conn.degree === 1
                  ? '1st Degree • Direct Friend'
                  : conn.degree === 2
                  ? '2nd Degree • Mutual Friend'
                  : '3rd Degree • 3-Chain Network';

              return (
                <View
                  key={`${conn.targetPhone}-${idx}`}
                  style={[
                    styles.playerCard,
                    {
                      backgroundColor: theme.surfaceLowest,
                      borderColor: theme.outlineVariant + '24',
                    },
                    Shadows.level2,
                  ]}
                >
                  {/* Subtle Top Card Gradient */}
                  <LinearGradient
                    colors={[theme.primary + '0c', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0.6 }}
                    style={StyleSheet.absoluteFill}
                  />

                  {/* Card Header: Avatar, Name, Degree Badge, Phone Pill */}
                  <View style={styles.playerCardHeader}>
                    <View style={styles.avatarWrap}>
                      <Image
                        source={safeAvatar}
                        style={[styles.playerAvatar, { borderColor: theme.primary }]}
                        contentFit="cover"
                        transition={150}
                      />
                      <View style={[styles.degreeRingDot, { backgroundColor: theme.primary }]} />
                    </View>

                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <View style={styles.nameRow}>
                        <ThemedText style={[styles.playerName, { color: theme.text }]} numberOfLines={1}>
                          {conn.targetName}
                        </ThemedText>
                        <View
                          style={[
                            styles.degreeBadge,
                            {
                              backgroundColor: theme.primary + '15',
                              borderColor: theme.primary + '35',
                            },
                          ]}
                        >
                          <ThemedText style={[styles.degreeBadgeText, { color: theme.primary }]}>
                            {degreeLabel}
                          </ThemedText>
                        </View>
                      </View>

                      <View style={styles.playerMetaRow}>
                        <ThemedText style={[styles.playerRoleText, { color: theme.textSecondary }]} numberOfLines={1}>
                          {conn.targetRole || 'Squad Member'} • {conn.targetTeam || teamName}
                        </ThemedText>

                        <Pressable
                          onPress={() => copyToClipboard(conn.targetPhone, `${conn.targetName}'s Phone`)}
                          style={[
                            styles.phonePill,
                            {
                              backgroundColor: theme.primary + '10',
                              borderColor: theme.primary + '28',
                            },
                          ]}
                        >
                          <Ionicons name="call" size={10} color={theme.primary} />
                          <ThemedText style={[styles.phoneText, { color: theme.primary }]}>
                            {conn.targetPhone}
                          </ThemedText>
                          <Ionicons name="copy-outline" size={10} color={theme.primary} />
                        </Pressable>
                      </View>
                    </View>
                  </View>

                  {/* ── Connection Chain Route Box ─────────────────── */}
                  <View
                    style={[
                      styles.chainRouteContainer,
                      {
                        backgroundColor: theme.surfaceLow,
                        borderColor: theme.outlineVariant + '22',
                      },
                    ]}
                  >
                    {/* Eyebrow Header with Colored Vertical Pill Rule */}
                    <View style={styles.chainHeaderRow}>
                      <View style={[styles.eyebrowRule, { backgroundColor: theme.primary }]} />
                      <ThemedText style={[styles.chainHeaderTitle, { color: theme.primary }]}>
                        CONNECTION CHAIN ROUTE
                      </ThemedText>
                    </View>

                    {/* Step-by-Step Chain Node Cards Flow */}
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.chainNodesRow}
                    >
                      {conn.chainPath.map((node, nodeIdx) => {
                        const isFirst = nodeIdx === 0;
                        const isLast = nodeIdx === conn.chainPath.length - 1;

                        const stepRole = isFirst
                          ? 'You (Host)'
                          : isLast
                          ? 'Target Player'
                          : `Player ${nodeIdx} (Mutual)`;

                        const stepName = isFirst ? (profile.name || 'You') : node.name;

                        return (
                          <React.Fragment key={`${node.phone}-${nodeIdx}`}>
                            <View
                              style={[
                                styles.nodeCard,
                                {
                                  backgroundColor: theme.surfaceLowest,
                                  borderColor: isLast ? theme.primary : theme.outlineVariant + '40',
                                },
                              ]}
                            >
                              <View style={styles.nodeCardTop}>
                                <View style={[styles.nodeIndexCircle, { backgroundColor: theme.primary }]}>
                                  <ThemedText style={styles.nodeIndexText}>
                                    {nodeIdx + 1}
                                  </ThemedText>
                                </View>
                                <ThemedText style={[styles.nodeRoleBadge, { color: theme.primary }]}>
                                  {stepRole}
                                </ThemedText>
                              </View>

                              <ThemedText style={[styles.nodeNameText, { color: theme.text }]} numberOfLines={1}>
                                {stepName}
                              </ThemedText>

                              <ThemedText style={[styles.nodePhoneHint, { color: theme.textSecondary }]}>
                                {isFirst ? 'Logged In User' : node.phone}
                              </ThemedText>
                            </View>

                            {!isLast && (
                              <View style={styles.arrowWrap}>
                                <View style={[styles.connectorLine, { backgroundColor: theme.outlineVariant + '66' }]} />
                                <View
                                  style={[
                                    styles.connectorBadge,
                                    {
                                      backgroundColor: theme.surfaceLowest,
                                      borderColor: theme.outlineVariant + '44',
                                    },
                                  ]}
                                >
                                  <Ionicons name="arrow-forward" size={10} color={theme.textSecondary} />
                                </View>
                                <View style={[styles.connectorLine, { backgroundColor: theme.outlineVariant + '66' }]} />
                              </View>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </ScrollView>

                    {/* Explanatory Relationship Summary Banner */}
                    <View
                      style={[
                        styles.chainExplainBox,
                        {
                          backgroundColor: theme.primary + '0c',
                          borderColor: theme.primary + '22',
                        },
                      ]}
                    >
                      <Ionicons name="git-branch" size={13} color={theme.primary} style={{ marginTop: 1 }} />
                      <ThemedText style={[styles.chainExplainText, { color: theme.text }]}>
                        {conn.description}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* ── Footer CTA Button ──────────────────────────────── */}
          <View
            style={[
              styles.footerWrap,
              {
                backgroundColor: theme.surfaceLowest,
                borderTopColor: theme.outlineVariant + '20',
              },
            ]}
          >
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.doneBtn,
                { backgroundColor: theme.primary },
                pressed && { opacity: 0.9 },
                Shadows.level2,
              ]}
            >
              <Ionicons name="checkmark-circle" size={18} color="#ffffff" style={{ marginRight: 6 }} />
              <ThemedText style={styles.doneBtnText}>
                Close Directory
              </ThemedText>
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
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  backdropPressable: {
    flex: 1,
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
    overflow: 'hidden',
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  headerContainer: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 14.5,
    fontFamily: 'Sora_600SemiBold',
    letterSpacing: 0.2,
  },
  squadBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  squadBadgeText: {
    fontSize: 9.5,
    fontFamily: 'Sora_600SemiBold',
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: 'Sora_400Regular',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  graphInsightBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 10,
  },
  graphInsightText: {
    fontSize: 10.5,
    fontFamily: 'Sora_400Regular',
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    gap: 12,
  },
  playerCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  playerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    position: 'relative',
  },
  playerAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
  },
  degreeRingDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  playerName: {
    fontSize: 14,
    fontFamily: 'Sora_600SemiBold',
    flex: 1,
  },
  degreeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  degreeBadgeText: {
    fontSize: 9.5,
    fontFamily: 'Sora_600SemiBold',
  },
  playerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 4,
  },
  playerRoleText: {
    fontSize: 11,
    fontFamily: 'Sora_400Regular',
    flex: 1,
  },
  phonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
  },
  phoneText: {
    fontSize: 10,
    fontFamily: 'Sora_500Medium',
  },
  chainRouteContainer: {
    marginTop: 12,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  chainHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  eyebrowRule: {
    width: 3.5,
    height: 12,
    borderRadius: 2,
  },
  chainHeaderTitle: {
    fontSize: 10,
    fontFamily: 'Sora_600SemiBold',
    letterSpacing: 0.6,
  },
  chainNodesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  nodeCard: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1.5,
    minWidth: 110,
  },
  nodeCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
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
  nodeRoleBadge: {
    fontSize: 9,
    fontFamily: 'Sora_600SemiBold',
    letterSpacing: 0.2,
  },
  nodeNameText: {
    fontSize: 11.5,
    fontFamily: 'Sora_600SemiBold',
  },
  nodePhoneHint: {
    fontSize: 9,
    fontFamily: 'Sora_400Regular',
    marginTop: 1,
  },
  arrowWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
    marginHorizontal: 2,
  },
  connectorLine: {
    width: 8,
    height: 1.5,
  },
  connectorBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chainExplainBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  chainExplainText: {
    fontSize: 10.5,
    fontFamily: 'Sora_400Regular',
    flex: 1,
    lineHeight: 15,
  },
  footerWrap: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    borderTopWidth: 1,
  },
  doneBtn: {
    flexDirection: 'row',
    height: 46,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontFamily: 'Sora_600SemiBold',
    letterSpacing: 0.2,
  },
});
