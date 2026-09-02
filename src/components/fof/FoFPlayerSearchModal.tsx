import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  TextInput,
  Pressable,
  ScrollView,
  Platform,
  Clipboard,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { BorderRadius, Shadows, Spacing } from '@/constants/theme';
import {
  FoFPlayer,
  searchFoFDirectory,
  CURRENT_USER_NODE,
} from '@/services/fof-network';
import { FoFChainVisualizerModal } from '@/components/fof/FoFChainVisualizerModal';

interface FoFPlayerSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectPlayer?: (player: FoFPlayer) => void;
}

export function FoFPlayerSearchModal({
  visible,
  onClose,
  onSelectPlayer,
}: FoFPlayerSearchModalProps) {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [degreeFilter, setDegreeFilter] = useState<number | undefined>(undefined);
  const [selectedChainPlayer, setSelectedChainPlayer] = useState<string | null>(null);

  const players = searchFoFDirectory(searchQuery, degreeFilter);

  const copyPhone = (phone: string, name: string) => {
    Clipboard.setString(phone);
    Alert.alert('Phone Copied', `${name}'s phone (${phone}) copied.`);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level3]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.headerIconBg, { backgroundColor: theme.primary + '18' }]}>
                <Ionicons name="people" size={20} color={theme.primary} />
              </View>
              <View>
                <ThemedText style={{ fontSize: 16, fontFamily: 'Sora_500Medium', color: theme.text }}>
                  Find Players by Phone & FoF
                </ThemedText>
                <ThemedText style={{ fontSize: 11, color: theme.textSecondary, fontFamily: 'Sora_500Medium' }}>
                  3-Chain Social Network Search (Azar ➔ Guna ➔ Siva ➔ Asif)
                </ThemedText>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={theme.text} />
            </Pressable>
          </View>

          {/* Search Input */}
          <View style={[styles.searchBox, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '44' }]}>
            <Ionicons name="search" size={18} color={theme.textSecondary} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by Phone (+91 98765...) or Name..."
              placeholderTextColor="#94a3b8"
              style={[styles.searchInput, { color: theme.text }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
            />
            {searchQuery ? (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
              </Pressable>
            ) : null}
          </View>

          {/* 3-Chain Degree Filter Pills */}
          <View style={styles.filterRow}>
            {[
              { label: 'All 3-Chain Network', val: undefined },
              { label: '1st Degree (Direct)', val: 1 },
              { label: '2nd Degree (Mutuals)', val: 2 },
              { label: '3rd Degree (3-Chain)', val: 3 },
            ].map((f) => {
              const active = degreeFilter === f.val;
              return (
                <Pressable
                  key={f.label}
                  onPress={() => setDegreeFilter(f.val)}
                  style={[
                    styles.filterPill,
                    { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33' },
                    active && { backgroundColor: theme.primary, borderColor: theme.primary },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.filterText,
                      { color: theme.textSecondary },
                      active && { color: '#ffffff', fontFamily: 'Sora_500Medium' },
                    ]}
                  >
                    {f.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          {/* Results List */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 6, gap: 10 }}>
            {players.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="person-outline" size={36} color={theme.textSecondary} />
                <ThemedText style={{ color: theme.textSecondary, marginTop: 8, fontSize: 13, textAlign: 'center' }}>
                  No players found matching "{searchQuery}". Try searching by name (Guna, Siva, Asif) or phone digits (11111, 22222, 33333).
                </ThemedText>
              </View>
            ) : (
              players.map((player: FoFPlayer) => {
                return (
                  <View
                    key={player.id}
                    style={[styles.playerCard, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33' }]}
                  >
                    <Image source={{ uri: player.avatar }} style={styles.playerAvatar} />

                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <ThemedText style={{ fontSize: 14, fontFamily: 'Sora_500Medium', color: theme.text }}>
                          {player.name}
                        </ThemedText>
                      </View>

                      {/* Phone + Team Row */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                        <Pressable
                          onPress={() => copyPhone(player.phone, player.name)}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                        >
                          <Ionicons name="call" size={11} color={theme.primary} />
                          <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: theme.primary }}>
                            {player.phone}
                          </ThemedText>
                        </Pressable>

                        <ThemedText style={{ fontSize: 10.5, color: theme.textSecondary }}>
                          {player.sport} • {player.rating} ★
                        </ThemedText>
                      </View>

                      {/* Action Buttons */}
                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                        <Pressable
                          onPress={() => setSelectedChainPlayer(player.phone)}
                          style={[{ flex: 1, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: theme.outlineVariant + '44', alignItems: 'center', backgroundColor: theme.surfaceLowest }]}
                        >
                          <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: theme.text }}>
                            Inspect Chain 🔍
                          </ThemedText>
                        </Pressable>

                        {onSelectPlayer && (
                          <Pressable
                            onPress={() => {
                              onSelectPlayer(player);
                              onClose();
                            }}
                            style={[{ flex: 1, paddingVertical: 6, borderRadius: 6, backgroundColor: theme.primary, alignItems: 'center' }]}
                          >
                            <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: '#ffffff' }}>
                              Select Player
                            </ThemedText>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>

      {/* Chain Visualizer Modal if inspected */}
      {selectedChainPlayer && (
        <FoFChainVisualizerModal
          visible={!!selectedChainPlayer}
          targetQuery={selectedChainPlayer}
          onClose={() => setSelectedChainPlayer(null)}
        />
      )}
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
    maxHeight: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    padding: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: 'Sora_500Medium',
    padding: 0,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  filterPill: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 10.5,
    fontFamily: 'Sora_500Medium',
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  playerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
  },
});
