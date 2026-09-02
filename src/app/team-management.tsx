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
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { GradientContainer } from '@/components/gradient-container';
import { FavouriteTeamIcon } from '@/components/favourite-team-icon';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { SPORTS_LIST } from '@/constants/sports';
import { MASCOT_KEYS, getMascotImage } from '@/constants/mascots';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/store/app-store';
import type { Team, Player } from '@/store/match-store';

const { width, height } = Dimensions.get('window');

const SKILL_LEVELS: Player['skillLevel'][] = ['Beginner', 'Intermediate', 'Advanced', 'Pro'];

export default function TeamManagementScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { teams, updateTeam, deleteTeam, toggleTeamFavourite, addPlayerToTeamById, removePlayerFromTeam, MAX_FAVOURITE_TEAMS } = useAppStore();
  const favouriteCount = teams.filter(t => t.isFavourite).length;
  const favouritesAtCap = favouriteCount >= MAX_FAVOURITE_TEAMS;

  // Modal Control States
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [isEditVisible, setIsEditVisible] = useState(false);
  const [isPlayersVisible, setIsPlayersVisible] = useState(false);
  const [isDeleteVisible, setIsDeleteVisible] = useState(false);

  // Edit Fields State
  const [editName, setEditName] = useState('');
  const [editSport, setEditSport] = useState('');
  const [editMascot, setEditMascot] = useState('lion');

  // Add Player Fields State
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerPosition, setNewPlayerPosition] = useState('');
  const [newPlayerJersey, setNewPlayerJersey] = useState('');
  const [newPlayerSkill, setNewPlayerSkill] = useState<Player['skillLevel']>('Intermediate');

  // Toast States
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastOpacity = useState(new Animated.Value(0))[0];

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(toastOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setToastMsg(null));
  };

  // Keep the modal's "active team" pointed at the live store record so
  // edits/removals reflect immediately without needing to close & reopen.
  const liveActiveTeam = activeTeam ? teams.find(t => t.id === activeTeam.id) || null : null;

  // ── Edit ──────────────────────────────────────────────────────────────────
  const openEditModal = (team: Team) => {
    setActiveTeam(team);
    setEditName(team.name);
    setEditSport(team.sport);
    setEditMascot(team.mascot || 'lion');
    setIsEditVisible(true);
  };

  const handleSaveEdit = () => {
    if (!activeTeam || !editName.trim()) return;
    updateTeam(activeTeam.id, { name: editName.trim(), sport: editSport, mascot: editMascot });
    setIsEditVisible(false);
    triggerToast('Team details updated!');
  };

  // ── Squad (players) ──────────────────────────────────────────────────────
  const openPlayersModal = (team: Team) => {
    setActiveTeam(team);
    setShowAddPlayer(false);
    setIsPlayersVisible(true);
  };

  const resetAddPlayerForm = () => {
    setNewPlayerName('');
    setNewPlayerPosition('');
    setNewPlayerJersey('');
    setNewPlayerSkill('Intermediate');
    setShowAddPlayer(false);
  };

  const handleAddPlayer = () => {
    if (!activeTeam || !newPlayerName.trim()) return;
    addPlayerToTeamById(activeTeam.id, {
      name: newPlayerName.trim(),
      position: newPlayerPosition.trim() || 'Player',
      jerseyNumber: newPlayerJersey.trim() ? parseInt(newPlayerJersey.trim(), 10) : undefined,
      skillLevel: newPlayerSkill,
    });
    resetAddPlayerForm();
    triggerToast('Player added to squad!');
  };

  const handleRemovePlayer = (playerId: string, playerName: string) => {
    if (!activeTeam) return;
    removePlayerFromTeam(activeTeam.id, playerId);
    triggerToast(`${playerName} removed from squad.`);
  };

  // ── Favourite (capped at MAX_FAVOURITE_TEAMS) ────────────────────────────
  const handleToggleFavourite = (team: Team) => {
    const success = toggleTeamFavourite(team.id);
    if (!success) {
      triggerToast(`You can only favourite up to ${MAX_FAVOURITE_TEAMS} teams. Remove one first.`);
      return;
    }
    triggerToast(team.isFavourite ? `${team.name} removed from Favourites.` : `${team.name} added to Favourites!`);
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const openDeleteModal = (team: Team) => {
    setActiveTeam(team);
    setIsDeleteVisible(true);
  };

  const handleDeleteConfirm = () => {
    if (!activeTeam) return;
    deleteTeam(activeTeam.id);
    setIsDeleteVisible(false);
    triggerToast(`${activeTeam.name} removed successfully.`);
  };

  return (
    <GradientContainer screenName="team-management" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header Stack Bar */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </Pressable>
          <ThemedText type="headlineMd" style={{ color: theme.text, flex: 1, marginLeft: 12 }}>
            Manage Teams
          </ThemedText>
        </View>

        <ScrollView style={styles.listScroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.welcomeSection}>
            <View style={styles.welcomeRow}>
              <View style={{ flex: 1 }}>
                <ThemedText type="headlineSm" style={{ color: theme.text }}>Squad Management</ThemedText>
                <ThemedText type="bodySm" style={{ color: theme.textSecondary, marginTop: 4 }}>
                  Edit your teams, manage squads, and mark favourites.
                </ThemedText>
              </View>
              <View style={[styles.favCountPill, { backgroundColor: favouritesAtCap ? '#fef2f2' : theme.surfaceLow, borderColor: favouritesAtCap ? '#fecaca' : theme.outlineVariant + '33' }]}>
                <FavouriteTeamIcon size={14} />
                <ThemedText style={[styles.favCountText, { color: favouritesAtCap ? '#b91c1c' : theme.text }]}>
                  {favouriteCount}/{MAX_FAVOURITE_TEAMS}
                </ThemedText>
              </View>
            </View>
          </View>

          {teams.length > 0 ? (
            <View style={styles.cardsContainer}>
              {teams.map(team => {
                const played = team.wins + team.losses + team.draws;
                const sportMeta = SPORTS_LIST.find(s => s.name.toLowerCase() === team.sport.toLowerCase());
                const sportColor = sportMeta?.color || theme.primary;
                const canFavourite = team.isFavourite || !favouritesAtCap;
                return (
                  <View
                    key={team.id}
                    style={[
                      styles.teamCard,
                      { backgroundColor: theme.surfaceLowest, borderColor: team.isFavourite ? '#F0453D55' : theme.outlineVariant + '33' },
                      Shadows.level1,
                    ]}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.crestWrap}>
                        <View style={[styles.logoCircle, { backgroundColor: theme.surfaceLow, borderColor: sportColor + '55' }]}>
                          <Image source={getMascotImage(team.mascot)} style={styles.logoImage} contentFit="contain" />
                        </View>
                        {sportMeta && (
                          <View style={[styles.sportBadge, { backgroundColor: sportColor }]}>
                            <MaterialIcons name={sportMeta.icon as any} size={11} color="#ffffff" />
                          </View>
                        )}
                        {team.isFavourite && (
                          <View style={styles.crestFavBadge}>
                            <FavouriteTeamIcon size={18} />
                          </View>
                        )}
                      </View>
                      <View style={{ flex: 1, marginLeft: 14 }}>
                        <ThemedText type="headlineSm" style={{ color: theme.text }} numberOfLines={1}>{team.name}</ThemedText>
                        <View style={[styles.sportPill, { backgroundColor: sportColor + '18' }]}>
                          <ThemedText style={[styles.sportPillText, { color: sportColor }]}>{team.sport}</ThemedText>
                        </View>
                      </View>
                      <Pressable
                        onPress={() => handleToggleFavourite(team)}
                        style={[styles.favToggleBtn, { backgroundColor: theme.surfaceLow, opacity: canFavourite ? 1 : 0.4 }]}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel={team.isFavourite ? 'Remove from favourites' : 'Add to favourites'}
                      >
                        {team.isFavourite ? (
                          <FavouriteTeamIcon size={18} />
                        ) : (
                          <Ionicons name="bookmark-outline" size={16} color={theme.textSecondary} />
                        )}
                      </Pressable>
                    </View>

                    {/* Stats Grid — icon-led */}
                    <View style={[styles.statsGrid, { backgroundColor: theme.surfaceLow }]}>
                      <View style={styles.statCell}>
                        <Ionicons name="stats-chart" size={13} color={theme.textSecondary} />
                        <ThemedText type="bodySm" style={{ color: theme.text, fontWeight: '600', marginTop: 3 }}>{played}</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: 8.5 }}>PLAYED</ThemedText>
                      </View>
                      <View style={styles.statCell}>
                        <Ionicons name="trophy" size={13} color="#0f9f58" />
                        <ThemedText type="bodySm" style={{ color: '#0f9f58', fontWeight: '600', marginTop: 3 }}>{team.wins}</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: 8.5 }}>WINS</ThemedText>
                      </View>
                      <View style={styles.statCell}>
                        <Ionicons name="close-circle" size={13} color="#ba1a1a" />
                        <ThemedText type="bodySm" style={{ color: '#ba1a1a', fontWeight: '600', marginTop: 3 }}>{team.losses}</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: 8.5 }}>LOSSES</ThemedText>
                      </View>
                      <View style={styles.statCell}>
                        <Ionicons name="remove-circle" size={13} color={theme.secondaryContainer} />
                        <ThemedText type="bodySm" style={{ color: theme.secondaryContainer, fontWeight: '600', marginTop: 3 }}>{team.draws}</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: 8.5 }}>DRAWS</ThemedText>
                      </View>
                    </View>

                    {/* Inline Action Buttons */}
                    <View style={[styles.actionsRow, { borderTopColor: theme.outlineVariant + '22' }]}>
                      <Pressable
                        style={[styles.cardBtn, { borderColor: theme.outlineVariant }]}
                        onPress={() => openPlayersModal(team)}
                      >
                        <Ionicons name="people-outline" size={14} color={theme.text} />
                        <ThemedText type="labelSm" style={{ color: theme.text, marginLeft: 4 }}>Squad ({team.players.length})</ThemedText>
                      </Pressable>

                      <Pressable
                        style={[styles.cardBtn, { borderColor: theme.outlineVariant }]}
                        onPress={() => openEditModal(team)}
                      >
                        <Ionicons name="create-outline" size={14} color={theme.text} />
                        <ThemedText type="labelSm" style={{ color: theme.text, marginLeft: 4 }}>Edit</ThemedText>
                      </Pressable>

                      <Pressable
                        style={[styles.cardBtn, { borderColor: theme.outlineVariant, backgroundColor: '#ffdad6' }]}
                        onPress={() => openDeleteModal(team)}
                      >
                        <Ionicons name="trash-outline" size={14} color="#ba1a1a" />
                        <ThemedText type="labelSm" style={{ color: '#ba1a1a', marginLeft: 4 }}>Remove</ThemedText>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={28} color={theme.textSecondary} />
              <ThemedText type="bodyMd" style={{ color: theme.textSecondary, marginTop: 8, textAlign: 'center' }}>
                You don&apos;t have any teams yet. Create one from the Matches tab to manage it here.
              </ThemedText>
            </View>
          )}
        </ScrollView>

        {/* MODAL 1: EDIT TEAM */}
        <Modal visible={isEditVisible} transparent animationType="slide" onRequestClose={() => setIsEditVisible(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.surfaceLowest }]}>
              <ThemedText type="headlineSm" style={styles.modalTitle}>Edit Team</ThemedText>

              <View style={styles.inputGroup}>
                <ThemedText type="labelSm" style={styles.inputLabel}>Team name</ThemedText>
                <TextInput
                  style={[styles.textInput, { borderColor: theme.outlineVariant, color: theme.text }]}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Team name"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText type="labelSm" style={styles.inputLabel}>Sport</ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {SPORTS_LIST.map((s) => {
                    const active = editSport.toLowerCase() === s.name.toLowerCase();
                    return (
                      <Pressable
                        key={s.name}
                        onPress={() => setEditSport(s.name)}
                        style={[
                          styles.sportChip,
                          { borderColor: active ? theme.primary : theme.outlineVariant, backgroundColor: active ? theme.primary : 'transparent' },
                        ]}
                      >
                        <ThemedText type="labelSm" style={{ color: active ? '#ffffff' : theme.text }}>{s.name}</ThemedText>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText type="labelSm" style={styles.inputLabel}>Team crest</ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                  {MASCOT_KEYS.map((key) => {
                    const active = editMascot === key;
                    return (
                      <Pressable
                        key={key}
                        onPress={() => setEditMascot(key)}
                        style={[
                          styles.mascotOption,
                          { borderColor: active ? theme.primary : theme.outlineVariant, backgroundColor: theme.surfaceLow },
                        ]}
                      >
                        <Image source={getMascotImage(key)} style={styles.mascotOptionImage} contentFit="contain" />
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.modalButtons}>
                <Pressable style={[styles.modalBtn, { borderColor: theme.outlineVariant }]} onPress={() => setIsEditVisible(false)}>
                  <ThemedText type="labelSm" style={{ color: theme.text }}>Cancel</ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.modalBtn, { backgroundColor: editName.trim() ? theme.primary : theme.outlineVariant }]}
                  onPress={handleSaveEdit}
                  disabled={!editName.trim()}
                >
                  <ThemedText type="labelSm" style={{ color: '#ffffff' }}>Save Changes</ThemedText>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* MODAL 2: SQUAD — view, add & remove players */}
        <Modal visible={isPlayersVisible} transparent animationType="slide" onRequestClose={() => setIsPlayersVisible(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
            <View style={[styles.modalContent, styles.squadModalContent, { backgroundColor: theme.surfaceLowest }]}>
              <View style={styles.rowBetween}>
                <ThemedText type="headlineSm" style={styles.modalTitle}>{liveActiveTeam?.name} Squad</ThemedText>
                <Pressable onPress={() => setIsPlayersVisible(false)} hitSlop={8}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </Pressable>
              </View>

              <ScrollView style={{ maxHeight: height * 0.42 }} showsVerticalScrollIndicator={false}>
                {liveActiveTeam && liveActiveTeam.players.length > 0 ? (
                  liveActiveTeam.players.map((p, playerIdx) => {
                    const initials = p.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
                    return (
                      <View key={`${p.id}-${playerIdx}`} style={[styles.squadPlayerRow, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33' }]}>
                        <View style={[styles.squadAvatarCircle, { backgroundColor: theme.primary }]}>
                          <ThemedText style={styles.squadAvatarText}>{initials}</ThemedText>
                        </View>
                        <View style={styles.squadPlayerInfo}>
                          <ThemedText style={[styles.squadPlayerName, { color: theme.text }]} numberOfLines={1}>{p.name}</ThemedText>
                          <ThemedText style={[styles.squadPlayerPosition, { color: theme.textSecondary }]} numberOfLines={1}>
                            {p.position} • {p.skillLevel}{p.jerseyNumber !== undefined ? ` • #${p.jerseyNumber}` : ''}
                          </ThemedText>
                        </View>
                        <Pressable
                          onPress={() => handleRemovePlayer(p.id, p.name)}
                          style={styles.squadRemoveBtn}
                          hitSlop={8}
                          accessibilityRole="button"
                          accessibilityLabel={`Remove ${p.name}`}
                        >
                          <Ionicons name="trash-outline" size={16} color="#ba1a1a" />
                        </Pressable>
                      </View>
                    );
                  })
                ) : (
                  <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                    <Ionicons name="people-outline" size={22} color={theme.textSecondary} />
                    <ThemedText type="bodySm" style={{ color: theme.textSecondary, marginTop: 6, textAlign: 'center' }}>
                      No squad members yet — add your first player below.
                    </ThemedText>
                  </View>
                )}
              </ScrollView>

              {showAddPlayer ? (
                <View style={[styles.addPlayerForm, { borderColor: theme.outlineVariant + '55', backgroundColor: theme.surfaceLow }]}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TextInput
                      style={[styles.textInput, styles.addPlayerNameInput, { borderColor: theme.outlineVariant, color: theme.text }]}
                      value={newPlayerName}
                      onChangeText={setNewPlayerName}
                      placeholder="Player name"
                      placeholderTextColor={theme.textSecondary}
                    />
                    <TextInput
                      style={[styles.textInput, styles.addPlayerJerseyInput, { borderColor: theme.outlineVariant, color: theme.text }]}
                      value={newPlayerJersey}
                      onChangeText={(t) => setNewPlayerJersey(t.replace(/\D/g, '').slice(0, 3))}
                      placeholder="#"
                      placeholderTextColor={theme.textSecondary}
                      keyboardType="number-pad"
                    />
                  </View>
                  <TextInput
                    style={[styles.textInput, { borderColor: theme.outlineVariant, color: theme.text, marginTop: 8 }]}
                    value={newPlayerPosition}
                    onChangeText={setNewPlayerPosition}
                    placeholder="Position (e.g. Batsman, Midfielder)"
                    placeholderTextColor={theme.textSecondary}
                  />
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                    {SKILL_LEVELS.map((lvl) => {
                      const active = newPlayerSkill === lvl;
                      return (
                        <Pressable
                          key={lvl}
                          onPress={() => setNewPlayerSkill(lvl)}
                          style={[
                            styles.skillChip,
                            { borderColor: active ? theme.primary : theme.outlineVariant, backgroundColor: active ? theme.primary : 'transparent' },
                          ]}
                        >
                          <ThemedText style={{ fontSize: 9.5, color: active ? '#ffffff' : theme.textSecondary, fontWeight: '600' }}>{lvl}</ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                  <View style={styles.modalButtons}>
                    <Pressable style={[styles.modalBtn, { borderColor: theme.outlineVariant, height: 40 }]} onPress={resetAddPlayerForm}>
                      <ThemedText type="labelSm" style={{ color: theme.text }}>Cancel</ThemedText>
                    </Pressable>
                    <Pressable
                      style={[styles.modalBtn, { backgroundColor: newPlayerName.trim() ? theme.primary : theme.outlineVariant, height: 40 }]}
                      onPress={handleAddPlayer}
                      disabled={!newPlayerName.trim()}
                    >
                      <ThemedText type="labelSm" style={{ color: '#ffffff' }}>Add Player</ThemedText>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable style={[styles.addPlayerTrigger, { borderColor: theme.primary }]} onPress={() => setShowAddPlayer(true)}>
                  <Ionicons name="add-circle" size={16} color={theme.primary} />
                  <ThemedText type="labelSm" style={{ color: theme.primary, marginLeft: 6 }}>Add Player</ThemedText>
                </Pressable>
              )}
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* MODAL 3: DELETE CONFIRMATION — favourite-aware */}
        <Modal visible={isDeleteVisible} transparent animationType="fade" onRequestClose={() => setIsDeleteVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.deleteModalContent, { backgroundColor: theme.surfaceLowest }]}>
              <Ionicons name="warning" size={48} color="#ba1a1a" style={{ alignSelf: 'center', marginBottom: 12 }} />
              <ThemedText type="headlineSm" style={{ textAlign: 'center', color: theme.text }}>Remove Team?</ThemedText>
              <ThemedText type="bodySm" style={{ textAlign: 'center', color: theme.textSecondary, marginVertical: 12 }}>
                Are you sure you want to remove <ThemedText style={{ fontWeight: '600', color: theme.text }}>{activeTeam?.name}</ThemedText>? This action will delete their squad and match logs.
              </ThemedText>

              {activeTeam?.isFavourite && (
                <View style={styles.favWarningBox}>
                  <FavouriteTeamIcon size={16} />
                  <ThemedText type="labelSm" style={{ color: '#92400e', marginLeft: 8, flex: 1 }}>
                    This is one of your Favourite Teams — removing it also removes it from Favourites.
                  </ThemedText>
                </View>
              )}

              <View style={styles.modalButtons}>
                <Pressable style={[styles.modalBtn, { borderColor: theme.outlineVariant }]} onPress={() => setIsDeleteVisible(false)}>
                  <ThemedText type="labelSm" style={{ color: theme.text }}>Cancel</ThemedText>
                </Pressable>
                <Pressable style={[styles.modalBtn, { backgroundColor: '#ffdad6' }]} onPress={handleDeleteConfirm}>
                  <ThemedText type="labelSm" style={{ color: '#ba1a1a', fontWeight: '600' }}>Yes, Remove</ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

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
  listScroll: {
    flex: 1,
  },
  welcomeSection: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.containerMargin,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  favCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  favCountText: {
    fontSize: 11,
    fontFamily: 'Sora_600SemiBold',
  },
  cardsContainer: {
    paddingHorizontal: Spacing.containerMargin,
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  emptyState: {
    marginHorizontal: Spacing.containerMargin,
    marginTop: Spacing.xl,
    alignItems: 'center',
    paddingVertical: 30,
  },
  teamCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    padding: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  crestWrap: {
    position: 'relative',
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: 38,
    height: 38,
  },
  sportBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  crestFavBadge: {
    position: 'absolute',
    top: -6,
    left: -6,
  },
  sportPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginTop: 3,
  },
  sportPillText: {
    fontSize: 9.5,
    fontFamily: 'Sora_600SemiBold',
    letterSpacing: 0.2,
  },
  favToggleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: BorderRadius.lg,
    paddingVertical: 12,
    paddingHorizontal: Spacing.sm,
    marginTop: Spacing.md,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    paddingTop: Spacing.md,
    marginTop: Spacing.md,
  },
  cardBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: BorderRadius.full,
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
  // Modal Overlays
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 21, 30, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.premium,
    borderTopRightRadius: BorderRadius.premium,
    paddingHorizontal: Spacing.containerMargin,
    paddingTop: Spacing.lg,
    paddingBottom: 40,
    gap: 16,
  },
  squadModalContent: {
    gap: 10,
  },
  deleteModalContent: {
    borderRadius: BorderRadius.xl,
    marginHorizontal: Spacing.containerMargin,
    padding: Spacing.lg,
    alignSelf: 'center',
    width: width - 40,
    position: 'absolute',
    bottom: height / 3,
  },
  modalTitle: {
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: Spacing.sm,
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
  },
  sportChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
  },
  mascotOption: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mascotOptionImage: {
    width: 30,
    height: 30,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: Spacing.sm,
  },
  modalBtn: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  favWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderRadius: BorderRadius.md,
    padding: 10,
    marginBottom: 4,
  },

  // Squad Styles
  squadPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    padding: 10,
    marginBottom: Spacing.xs,
    borderWidth: 1,
  },
  squadAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  squadAvatarText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Sora_600SemiBold',
  },
  squadPlayerInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  squadPlayerName: {
    fontSize: 13,
    fontFamily: 'Sora_600SemiBold',
  },
  squadPlayerPosition: {
    fontSize: 11,
    marginTop: 1,
  },
  squadRemoveBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPlayerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  addPlayerForm: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: 10,
  },
  addPlayerNameInput: {
    flex: 1,
  },
  addPlayerJerseyInput: {
    width: 56,
    textAlign: 'center',
  },
  skillChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    alignItems: 'center',
  },
});
