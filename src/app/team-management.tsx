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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedText, MAX_FONT_SCALE } from '@/components/themed-text';
import { EditIcon } from '@/components/ui/edit-icon';
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
  const {
    teams,
    updateTeam,
    deleteTeam,
    toggleTeamFavourite,
    addPlayerToTeamById,
    removePlayerFromTeam,
    MAX_FAVOURITE_TEAMS,
  } = useAppStore();

  const favouriteCount = teams.filter((t) => t.isFavourite).length;
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
      Animated.timing(toastOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(toastOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => setToastMsg(null));
  };

  // Live active team tracking
  const liveActiveTeam = activeTeam ? teams.find((t) => t.id === activeTeam.id) || null : null;

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
    triggerToast(`${activeTeam.name} removed.`);
  };

  return (
    <GradientContainer screenName="team-management" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header Stack Bar */}
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </Pressable>
          <ThemedText style={[styles.headerTitle, { color: theme.text }]}>
            Manage Teams
          </ThemedText>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          style={styles.listScroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Ambient Header Floodlight Wash */}
          <LinearGradient
            colors={[theme.primary + '18', theme.primary + '04', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ambientWash}
            pointerEvents="none"
          />

          {/* Hero Bento Summary Card */}
          <View
            style={[
              styles.heroSummaryCard,
              {
                backgroundColor: theme.surfaceLowest,
                borderColor: theme.outlineVariant + '33',
              },
              Shadows.level1,
            ]}
          >
            <View style={styles.heroSummaryRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <ThemedText style={[styles.heroSummaryTitle, { color: theme.text }]}>
                  Squad Management
                </ThemedText>
                <ThemedText style={[styles.heroSummarySubtitle, { color: theme.textSecondary }]}>
                  Organize rosters, track stats, and manage favorite clubs.
                </ThemedText>
              </View>

              <View
                style={[
                  styles.favCountPill,
                  {
                    backgroundColor: favouritesAtCap ? '#EF444415' : theme.surfaceLow,
                    borderColor: favouritesAtCap ? '#EF444440' : theme.outlineVariant + '33',
                  },
                ]}
              >
                <FavouriteTeamIcon size={14} />
                <ThemedText
                  style={[
                    styles.favCountText,
                    { color: favouritesAtCap ? '#EF4444' : theme.text },
                  ]}
                >
                  {favouriteCount}/{MAX_FAVOURITE_TEAMS}
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Section Indicator Bar Header */}
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIndicatorBar, { backgroundColor: theme.primary }]} />
            <ThemedText style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              YOUR TEAMS
            </ThemedText>
            <View style={[styles.countBadge, { backgroundColor: theme.surfaceLow }]}>
              <ThemedText style={[styles.countBadgeText, { color: theme.textSecondary }]}>
                {teams.length}
              </ThemedText>
            </View>
          </View>

          {/* Teams List or Clean Empty State */}
          {teams.length > 0 ? (
            <View style={styles.cardsContainer}>
              {teams.map((team) => {
                const played = team.wins + team.losses + team.draws;
                const sportMeta = SPORTS_LIST.find(
                  (s) => s.name.toLowerCase() === team.sport.toLowerCase()
                );
                const sportColor = sportMeta?.color || theme.primary;
                const canFavourite = team.isFavourite || !favouritesAtCap;

                return (
                  <View
                    key={team.id}
                    style={[
                      styles.teamCard,
                      {
                        backgroundColor: theme.surfaceLowest,
                        borderColor: team.isFavourite ? '#F0453D55' : theme.outlineVariant + '33',
                      },
                      Shadows.level1,
                    ]}
                  >
                    {/* Card Top: Crest, Name, Sport, Favourite Toggle */}
                    <View style={styles.cardHeader}>
                      <View style={styles.crestWrap}>
                        <View
                          style={[
                            styles.logoSquircle,
                            { backgroundColor: theme.surfaceLow, borderColor: sportColor + '40' },
                          ]}
                        >
                          <Image
                            source={getMascotImage(team.mascot)}
                            style={styles.logoImage}
                            contentFit="contain"
                          />
                        </View>
                        {sportMeta && (
                          <View
                            style={[
                              styles.sportBadge,
                              { backgroundColor: sportColor, borderColor: theme.surfaceLowest },
                            ]}
                          >
                            <MaterialIcons name={sportMeta.icon as any} size={10} color="#ffffff" />
                          </View>
                        )}
                        {team.isFavourite && (
                          <View style={styles.crestFavBadge}>
                            <FavouriteTeamIcon size={16} />
                          </View>
                        )}
                      </View>

                      <View style={styles.teamMetaCol}>
                        <ThemedText
                          style={[styles.teamNameText, { color: theme.text }]}
                          numberOfLines={1}
                        >
                          {team.name}
                        </ThemedText>
                        <View
                          style={[
                            styles.sportPill,
                            { backgroundColor: sportColor + '18' },
                          ]}
                        >
                          <ThemedText style={[styles.sportPillText, { color: sportColor }]}>
                            {team.sport}
                          </ThemedText>
                        </View>
                      </View>

                      <Pressable
                        onPress={() => handleToggleFavourite(team)}
                        style={({ pressed }) => [
                          styles.favToggleBtn,
                          {
                            backgroundColor: theme.surfaceLow,
                            opacity: canFavourite ? (pressed ? 0.7 : 1) : 0.35,
                          },
                        ]}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel={
                          team.isFavourite ? 'Remove from favourites' : 'Add to favourites'
                        }
                      >
                        {team.isFavourite ? (
                          <FavouriteTeamIcon size={18} />
                        ) : (
                          <Ionicons
                            name="bookmark-outline"
                            size={16}
                            color={theme.textSecondary}
                          />
                        )}
                      </Pressable>
                    </View>

                    {/* Stats Grid — 4 Columns Bento Ribbon */}
                    <View style={[styles.statsGrid, { backgroundColor: theme.surfaceLow }]}>
                      <View style={styles.statCell}>
                        <ThemedText style={[styles.statValue, { color: theme.text }]}>
                          {played}
                        </ThemedText>
                        <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
                          PLAYED
                        </ThemedText>
                      </View>
                      <View
                        style={[
                          styles.statDivider,
                          { backgroundColor: theme.outlineVariant + '22' },
                        ]}
                      />
                      <View style={styles.statCell}>
                        <ThemedText style={[styles.statValue, { color: '#10B981' }]}>
                          {team.wins}
                        </ThemedText>
                        <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
                          WINS
                        </ThemedText>
                      </View>
                      <View
                        style={[
                          styles.statDivider,
                          { backgroundColor: theme.outlineVariant + '22' },
                        ]}
                      />
                      <View style={styles.statCell}>
                        <ThemedText style={[styles.statValue, { color: '#EF4444' }]}>
                          {team.losses}
                        </ThemedText>
                        <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
                          LOSSES
                        </ThemedText>
                      </View>
                      <View
                        style={[
                          styles.statDivider,
                          { backgroundColor: theme.outlineVariant + '22' },
                        ]}
                      />
                      <View style={styles.statCell}>
                        <ThemedText style={[styles.statValue, { color: '#F59E0B' }]}>
                          {team.draws}
                        </ThemedText>
                        <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
                          DRAWS
                        </ThemedText>
                      </View>
                    </View>

                    {/* Action Buttons Row */}
                    <View style={styles.actionsRow}>
                      <Pressable
                        style={({ pressed }) => [
                          styles.cardBtn,
                          {
                            borderColor: theme.outlineVariant + '44',
                            backgroundColor: theme.surfaceLow,
                          },
                          pressed && { opacity: 0.75 },
                        ]}
                        onPress={() => openPlayersModal(team)}
                        accessibilityRole="button"
                        accessibilityLabel={`Manage squad for ${team.name}`}
                      >
                        <Ionicons
                          name="people-outline"
                          size={14}
                          color={theme.text}
                          style={{ marginRight: 5 }}
                        />
                        <ThemedText style={[styles.cardBtnText, { color: theme.text }]}>
                          Squad ({team.players.length})
                        </ThemedText>
                      </Pressable>

                      <Pressable
                        style={({ pressed }) => [
                          styles.cardBtn,
                          {
                            borderColor: theme.outlineVariant + '44',
                            backgroundColor: theme.surfaceLow,
                          },
                          pressed && { opacity: 0.75 },
                        ]}
                        onPress={() => openEditModal(team)}
                        accessibilityRole="button"
                        accessibilityLabel={`Edit ${team.name}`}
                      >
                        <View style={{ marginRight: 5 }}>
                          <EditIcon size={13} />
                        </View>
                        <ThemedText style={[styles.cardBtnText, { color: theme.text }]}>
                          Edit
                        </ThemedText>
                      </Pressable>

                      <Pressable
                        style={({ pressed }) => [
                          styles.cardBtn,
                          {
                            borderColor: '#EF444433',
                            backgroundColor: '#EF444415',
                          },
                          pressed && { opacity: 0.75 },
                        ]}
                        onPress={() => openDeleteModal(team)}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${team.name}`}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={14}
                          color="#EF4444"
                          style={{ marginRight: 5 }}
                        />
                        <ThemedText style={[styles.cardBtnText, { color: '#EF4444' }]}>
                          Remove
                        </ThemedText>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View
              style={[
                styles.emptyStateCard,
                {
                  backgroundColor: theme.surfaceLowest,
                  borderColor: theme.outlineVariant + '33',
                },
              ]}
            >
              <View style={[styles.emptyIconCircle, { backgroundColor: theme.surfaceLow }]}>
                <Ionicons name="people-outline" size={22} color={theme.textSecondary} />
              </View>
              <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
                No Teams Created Yet
              </ThemedText>
              <ThemedText style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Create a team from the Matches or Community tab to manage rosters and track statistics here.
              </ThemedText>
            </View>
          )}
        </ScrollView>

        {/* MODAL 1: EDIT TEAM */}
        <Modal
          visible={isEditVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setIsEditVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalOverlay}
          >
            <View style={[styles.modalContent, { backgroundColor: theme.surfaceLowest }]}>
              <View style={styles.modalHeaderRow}>
                <ThemedText style={[styles.modalTitle, { color: theme.text }]}>
                  Edit Team
                </ThemedText>
                <Pressable
                  onPress={() => setIsEditVisible(false)}
                  hitSlop={8}
                  style={({ pressed }) => [styles.modalCloseBtn, pressed && { opacity: 0.7 }]}
                >
                  <Ionicons name="close" size={20} color={theme.textSecondary} />
                </Pressable>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  Team Name
                </ThemedText>
                <TextInput
                  maxFontSizeMultiplier={MAX_FONT_SCALE}
                  style={[
                    styles.textInput,
                    {
                      borderColor: theme.outlineVariant + '44',
                      backgroundColor: theme.surfaceLow,
                      color: theme.text,
                    },
                  ]}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Team name"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  Sport
                </ThemedText>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
                >
                  {SPORTS_LIST.map((s) => {
                    const active = editSport.toLowerCase() === s.name.toLowerCase();
                    return (
                      <Pressable
                        key={s.name}
                        onPress={() => setEditSport(s.name)}
                        style={[
                          styles.sportChip,
                          {
                            borderColor: active ? theme.primary : theme.outlineVariant + '44',
                            backgroundColor: active ? theme.primary : theme.surfaceLow,
                          },
                        ]}
                      >
                        <ThemedText
                          style={[
                            styles.sportChipText,
                            { color: active ? '#ffffff' : theme.text },
                          ]}
                        >
                          {s.name}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  Team Crest Mascot
                </ThemedText>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 10, paddingVertical: 2 }}
                >
                  {MASCOT_KEYS.map((key) => {
                    const active = editMascot === key;
                    return (
                      <Pressable
                        key={key}
                        onPress={() => setEditMascot(key)}
                        style={[
                          styles.mascotOption,
                          {
                            borderColor: active ? theme.primary : theme.outlineVariant + '44',
                            backgroundColor: active ? theme.primary + '15' : theme.surfaceLow,
                          },
                        ]}
                      >
                        <Image
                          source={getMascotImage(key)}
                          style={styles.mascotOptionImage}
                          contentFit="contain"
                        />
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.modalButtons}>
                <Pressable
                  style={({ pressed }) => [
                    styles.modalBtn,
                    {
                      borderColor: theme.outlineVariant + '55',
                      backgroundColor: theme.surfaceLow,
                    },
                    pressed && { opacity: 0.75 },
                  ]}
                  onPress={() => setIsEditVisible(false)}
                >
                  <ThemedText style={[styles.modalBtnText, { color: theme.text }]}>
                    Cancel
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.modalBtn,
                    {
                      backgroundColor: editName.trim() ? theme.primary : theme.outlineVariant + '44',
                    },
                    pressed && { opacity: 0.85 },
                  ]}
                  onPress={handleSaveEdit}
                  disabled={!editName.trim()}
                >
                  <ThemedText style={[styles.modalBtnText, { color: '#ffffff' }]}>
                    Save Changes
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* MODAL 2: SQUAD — view, add & remove players */}
        <Modal
          visible={isPlayersVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setIsPlayersVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalOverlay}
          >
            <View
              style={[
                styles.modalContent,
                styles.squadModalContent,
                { backgroundColor: theme.surfaceLowest },
              ]}
            >
              <View style={styles.modalHeaderRow}>
                <ThemedText style={[styles.modalTitle, { color: theme.text }]}>
                  {liveActiveTeam?.name} Squad
                </ThemedText>
                <Pressable
                  onPress={() => setIsPlayersVisible(false)}
                  hitSlop={8}
                  style={({ pressed }) => [styles.modalCloseBtn, pressed && { opacity: 0.7 }]}
                >
                  <Ionicons name="close" size={20} color={theme.textSecondary} />
                </Pressable>
              </View>

              <ScrollView
                style={{ maxHeight: height * 0.42 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: 4 }}
              >
                {liveActiveTeam && liveActiveTeam.players.length > 0 ? (
                  liveActiveTeam.players.map((p, playerIdx) => {
                    const initials = p.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase();
                    return (
                      <View
                        key={`${p.id}-${playerIdx}`}
                        style={[
                          styles.squadPlayerRow,
                          {
                            backgroundColor: theme.surfaceLow,
                            borderColor: theme.outlineVariant + '33',
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.squadAvatarCircle,
                            { backgroundColor: theme.primary },
                          ]}
                        >
                          <ThemedText style={styles.squadAvatarText}>{initials}</ThemedText>
                        </View>
                        <View style={styles.squadPlayerInfo}>
                          <ThemedText
                            style={[styles.squadPlayerName, { color: theme.text }]}
                            numberOfLines={1}
                          >
                            {p.name}
                          </ThemedText>
                          <ThemedText
                            style={[styles.squadPlayerPosition, { color: theme.textSecondary }]}
                            numberOfLines={1}
                          >
                            {p.position} • {p.skillLevel}
                            {p.jerseyNumber !== undefined ? ` • #${p.jerseyNumber}` : ''}
                          </ThemedText>
                        </View>
                        <Pressable
                          onPress={() => handleRemovePlayer(p.id, p.name)}
                          style={({ pressed }) => [
                            styles.squadRemoveBtn,
                            pressed && { opacity: 0.7 },
                          ]}
                          hitSlop={8}
                          accessibilityRole="button"
                          accessibilityLabel={`Remove ${p.name}`}
                        >
                          <Ionicons name="trash-outline" size={15} color="#EF4444" />
                        </Pressable>
                      </View>
                    );
                  })
                ) : (
                  <View style={styles.squadEmptyState}>
                    <Ionicons name="people-outline" size={20} color={theme.textSecondary} />
                    <ThemedText
                      style={[styles.squadEmptyText, { color: theme.textSecondary }]}
                    >
                      No squad members yet. Add your first player below.
                    </ThemedText>
                  </View>
                )}
              </ScrollView>

              {showAddPlayer ? (
                <View
                  style={[
                    styles.addPlayerForm,
                    {
                      borderColor: theme.outlineVariant + '44',
                      backgroundColor: theme.surfaceLow,
                    },
                  ]}
                >
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TextInput
                      maxFontSizeMultiplier={MAX_FONT_SCALE}
                      style={[
                        styles.textInput,
                        styles.addPlayerNameInput,
                        {
                          borderColor: theme.outlineVariant + '44',
                          backgroundColor: theme.surfaceLowest,
                          color: theme.text,
                        },
                      ]}
                      value={newPlayerName}
                      onChangeText={setNewPlayerName}
                      placeholder="Player name"
                      placeholderTextColor={theme.textSecondary}
                    />
                    <TextInput
                      maxFontSizeMultiplier={MAX_FONT_SCALE}
                      style={[
                        styles.textInput,
                        styles.addPlayerJerseyInput,
                        {
                          borderColor: theme.outlineVariant + '44',
                          backgroundColor: theme.surfaceLowest,
                          color: theme.text,
                        },
                      ]}
                      value={newPlayerJersey}
                      onChangeText={(t) => setNewPlayerJersey(t.replace(/\D/g, '').slice(0, 3))}
                      placeholder="#"
                      placeholderTextColor={theme.textSecondary}
                      keyboardType="number-pad"
                    />
                  </View>
                  <TextInput
                    maxFontSizeMultiplier={MAX_FONT_SCALE}
                    style={[
                      styles.textInput,
                      {
                        borderColor: theme.outlineVariant + '44',
                        backgroundColor: theme.surfaceLowest,
                        color: theme.text,
                        marginTop: 8,
                      },
                    ]}
                    value={newPlayerPosition}
                    onChangeText={setNewPlayerPosition}
                    placeholder="Position (e.g. Batsman, Striker)"
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
                            {
                              borderColor: active ? theme.primary : theme.outlineVariant + '44',
                              backgroundColor: active ? theme.primary : theme.surfaceLowest,
                            },
                          ]}
                        >
                          <ThemedText
                            style={[
                              styles.skillChipText,
                              { color: active ? '#ffffff' : theme.textSecondary },
                            ]}
                          >
                            {lvl}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                  <View style={styles.modalButtons}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.modalBtn,
                        {
                          borderColor: theme.outlineVariant + '55',
                          backgroundColor: theme.surfaceLowest,
                          height: 40,
                        },
                        pressed && { opacity: 0.75 },
                      ]}
                      onPress={resetAddPlayerForm}
                    >
                      <ThemedText style={[styles.modalBtnText, { color: theme.text }]}>
                        Cancel
                      </ThemedText>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [
                        styles.modalBtn,
                        {
                          backgroundColor: newPlayerName.trim()
                            ? theme.primary
                            : theme.outlineVariant + '44',
                          height: 40,
                        },
                        pressed && { opacity: 0.85 },
                      ]}
                      onPress={handleAddPlayer}
                      disabled={!newPlayerName.trim()}
                    >
                      <ThemedText style={[styles.modalBtnText, { color: '#ffffff' }]}>
                        Add Player
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable
                  style={({ pressed }) => [
                    styles.addPlayerTrigger,
                    {
                      borderColor: theme.primary + '60',
                      backgroundColor: theme.primary + '0D',
                    },
                    pressed && { opacity: 0.8 },
                  ]}
                  onPress={() => setShowAddPlayer(true)}
                >
                  <Ionicons name="add-circle" size={16} color={theme.primary} />
                  <ThemedText style={[styles.addPlayerTriggerText, { color: theme.primary }]}>
                    Add New Player
                  </ThemedText>
                </Pressable>
              )}
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* MODAL 3: DELETE CONFIRMATION — favourite-aware */}
        <Modal
          visible={isDeleteVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsDeleteVisible(false)}
        >
          <View style={styles.modalOverlayCenter}>
            <View
              style={[
                styles.deleteModalContent,
                {
                  backgroundColor: theme.surfaceLowest,
                  borderColor: theme.outlineVariant + '33',
                },
                Shadows.level2,
              ]}
            >
              <View style={[styles.deleteIconCircle, { backgroundColor: '#EF444415' }]}>
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </View>
              <ThemedText style={[styles.deleteModalTitle, { color: theme.text }]}>
                Remove Team?
              </ThemedText>
              <ThemedText style={[styles.deleteModalDesc, { color: theme.textSecondary }]}>
                Are you sure you want to remove{' '}
                <ThemedText style={{ fontFamily: 'Sora_600SemiBold', color: theme.text }}>
                  {activeTeam?.name}
                </ThemedText>
                ? This action will remove their squad and recorded match logs.
              </ThemedText>

              {activeTeam?.isFavourite && (
                <View
                  style={[
                    styles.favWarningBox,
                    { backgroundColor: '#F59E0B15', borderColor: '#F59E0B33' },
                  ]}
                >
                  <FavouriteTeamIcon size={16} />
                  <ThemedText style={[styles.favWarningText, { color: '#B45309' }]}>
                    This is marked as a Favourite Team — removing it will also clear its bookmark.
                  </ThemedText>
                </View>
              )}

              <View style={styles.modalButtons}>
                <Pressable
                  style={({ pressed }) => [
                    styles.modalBtn,
                    {
                      borderColor: theme.outlineVariant + '55',
                      backgroundColor: theme.surfaceLow,
                    },
                    pressed && { opacity: 0.75 },
                  ]}
                  onPress={() => setIsDeleteVisible(false)}
                >
                  <ThemedText style={[styles.modalBtnText, { color: theme.text }]}>
                    Cancel
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.modalBtn,
                    { backgroundColor: '#EF4444' },
                    pressed && { opacity: 0.85 },
                  ]}
                  onPress={handleDeleteConfirm}
                >
                  <ThemedText style={[styles.modalBtnText, { color: '#ffffff' }]}>
                    Yes, Remove
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>

      {/* Floating Toast Notification */}
      {toastMsg && (
        <Animated.View
          style={[
            styles.toastContainer,
            { opacity: toastOpacity, backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '44' },
            Shadows.level2,
          ]}
        >
          <Ionicons name="checkmark-circle" size={15} color={theme.primary} style={{ marginRight: 6 }} />
          <ThemedText style={[styles.toastText, { color: theme.text }]}>
            {toastMsg}
          </ThemedText>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 48,
    zIndex: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Sora_500Medium',
    fontSize: 14.5,
  },
  ambientWash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  listScroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  heroSummaryCard: {
    borderRadius: 20,
    borderWidth: 1.2,
    padding: 16,
    marginBottom: 16,
  },
  heroSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroSummaryTitle: {
    fontFamily: 'Sora_500Medium',
    fontSize: 15,
  },
  heroSummarySubtitle: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11.5,
    marginTop: 3,
    lineHeight: 16,
  },
  favCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  favCountText: {
    fontSize: 11,
    fontFamily: 'Sora_500Medium',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionIndicatorBar: {
    width: 3.5,
    height: 14,
    borderRadius: 2,
    marginRight: 7,
  },
  sectionLabel: {
    fontFamily: 'Sora_500Medium',
    fontSize: 10,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  countBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
  },
  countBadgeText: {
    fontFamily: 'Sora_500Medium',
    fontSize: 9.5,
  },
  cardsContainer: {
    gap: 12,
  },
  teamCard: {
    borderRadius: 20,
    borderWidth: 1.2,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  crestWrap: {
    position: 'relative',
  },
  logoSquircle: {
    width: 50,
    height: 50,
    borderRadius: 15,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 32,
    height: 32,
  },
  sportBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  crestFavBadge: {
    position: 'absolute',
    top: -5,
    left: -5,
  },
  teamMetaCol: {
    flex: 1,
    marginLeft: 12,
  },
  teamNameText: {
    fontFamily: 'Sora_500Medium',
    fontSize: 14.5,
  },
  sportPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    marginTop: 3,
  },
  sportPillText: {
    fontSize: 9.5,
    fontFamily: 'Sora_500Medium',
    letterSpacing: 0.2,
  },
  favToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 4,
    marginTop: 12,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 18,
  },
  statValue: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 13.5,
  },
  statLabel: {
    fontFamily: 'Sora_500Medium',
    fontSize: 8.5,
    letterSpacing: 0.5,
    marginTop: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  cardBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 34,
    borderWidth: 1,
    borderRadius: 999,
  },
  cardBtnText: {
    fontFamily: 'Sora_500Medium',
    fontSize: 11,
  },
  emptyStateCard: {
    borderRadius: 20,
    borderWidth: 1.2,
    padding: 28,
    alignItems: 'center',
    marginTop: 12,
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    fontFamily: 'Sora_500Medium',
    fontSize: 14.5,
  },
  emptySubtitle: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11.5,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 21, 30, 0.55)',
    justifyContent: 'flex-end',
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(5, 21, 30, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 36,
    gap: 14,
  },
  squadModalContent: {
    gap: 12,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: 'Sora_500Medium',
    fontSize: 14.5,
  },
  modalCloseBtn: {
    padding: 4,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontFamily: 'Sora_500Medium',
    fontSize: 11,
    letterSpacing: 0.3,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    fontSize: 13,
    fontFamily: 'Sora_400Regular',
    includeFontPadding: false,
  },
  sportChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1.2,
  },
  sportChipText: {
    fontFamily: 'Sora_500Medium',
    fontSize: 11,
  },
  mascotOption: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mascotOptionImage: {
    width: 28,
    height: 28,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  modalBtn: {
    flex: 1,
    height: 44,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  modalBtnText: {
    fontFamily: 'Sora_500Medium',
    fontSize: 12,
  },
  squadPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 9,
    marginBottom: 8,
    borderWidth: 1,
  },
  squadAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  squadAvatarText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Sora_500Medium',
  },
  squadPlayerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  squadPlayerName: {
    fontSize: 12.5,
    fontFamily: 'Sora_500Medium',
  },
  squadPlayerPosition: {
    fontSize: 10.5,
    fontFamily: 'Sora_400Regular',
    marginTop: 1,
  },
  squadRemoveBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  squadEmptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  squadEmptyText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11.5,
    marginTop: 6,
    textAlign: 'center',
  },
  addPlayerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 999,
    borderWidth: 1.2,
    borderStyle: 'dashed',
    marginTop: 4,
  },
  addPlayerTriggerText: {
    fontFamily: 'Sora_500Medium',
    fontSize: 11.5,
    marginLeft: 6,
  },
  addPlayerForm: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginTop: 4,
  },
  addPlayerNameInput: {
    flex: 1,
  },
  addPlayerJerseyInput: {
    width: 52,
    textAlign: 'center',
  },
  skillChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1.2,
    alignItems: 'center',
  },
  skillChipText: {
    fontSize: 9.5,
    fontFamily: 'Sora_500Medium',
  },
  deleteModalContent: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    width: Math.min(340, width - 40),
    alignItems: 'center',
  },
  deleteIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  deleteModalTitle: {
    fontFamily: 'Sora_500Medium',
    fontSize: 14.5,
  },
  deleteModalDesc: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 12,
    lineHeight: 17,
  },
  favWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 9,
    marginBottom: 14,
    gap: 8,
  },
  favWarningText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 10.5,
    flex: 1,
    lineHeight: 14,
  },
  toastContainer: {
    position: 'absolute',
    top: 56,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    zIndex: 999,
  },
  toastText: {
    fontFamily: 'Sora_500Medium',
    fontSize: 11.5,
  },
});
