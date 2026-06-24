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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GradientContainer } from '@/components/gradient-container';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const { width, height } = Dimensions.get('window');

interface Team {
  id: string;
  name: string;
  logo: string;
  manager: string;
  played: number;
  wins: number;
  losses: number;
  nrr: string;
  players: { name: string; number: number; role: string }[];
}

export default function TeamManagementScreen() {
  const theme = useTheme();
  const router = useRouter();

  // Mock Teams List State
  const [teams, setTeams] = useState<Team[]>([
    {
      id: 'tm1',
      name: 'Red Devils FC',
      logo: '⚽',
      manager: 'John Doe',
      played: 3,
      wins: 3,
      losses: 0,
      nrr: '+1.45',
      players: [
        { name: 'Marcus Rashford', number: 10, role: 'Forward' },
        { name: 'Bruno Fernandes', number: 8, role: 'Midfielder' },
        { name: 'Casemiro', number: 18, role: 'Defender' },
        { name: 'Andre Onana', number: 1, role: 'Goalkeeper' }
      ]
    },
    {
      id: 'tm2',
      name: 'Blue Tigers',
      logo: '🐯',
      manager: 'Marcus Vance',
      played: 3,
      wins: 1,
      losses: 2,
      nrr: '-0.32',
      players: [
        { name: 'Leo Carter', number: 7, role: 'Striker' },
        { name: 'Sam Wilson', number: 4, role: 'Midfielder' },
        { name: 'Rob Miller', number: 12, role: 'Defender' }
      ]
    },
    {
      id: 'tm3',
      name: 'Apex Warriors',
      logo: '🏆',
      manager: 'Alex Smith',
      played: 3,
      wins: 2,
      losses: 1,
      nrr: '+0.88',
      players: [
        { name: 'Alex Smith', number: 9, role: 'Captain / Midfielder' },
        { name: 'Roy Keane', number: 16, role: 'Midfielder' },
        { name: 'Gary Neville', number: 2, role: 'Defender' }
      ]
    }
  ]);

  // Modal Control States
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [isEditVisible, setIsEditVisible] = useState(false);
  const [isPlayersVisible, setIsPlayersVisible] = useState(false);
  const [isDeleteVisible, setIsDeleteVisible] = useState(false);
  
  // Edit Fields State
  const [editName, setEditName] = useState('');
  const [editManager, setEditManager] = useState('');

  // Toast States
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

  // Operations
  const openEditModal = (team: Team) => {
    setActiveTeam(team);
    setEditName(team.name);
    setEditManager(team.manager);
    setIsEditVisible(true);
  };

  const handleSaveEdit = () => {
    if (!activeTeam) return;
    setTeams(teams.map(t => t.id === activeTeam.id ? { ...t, name: editName, manager: editManager } : t));
    setIsEditVisible(false);
    triggerToast('Team details updated!');
  };

  const openPlayersModal = (team: Team) => {
    setActiveTeam(team);
    setIsPlayersVisible(true);
  };

  const openDeleteModal = (team: Team) => {
    setActiveTeam(team);
    setIsDeleteVisible(true);
  };

  const handleDeleteConfirm = () => {
    if (!activeTeam) return;
    setTeams(teams.filter(t => t.id !== activeTeam.id));
    setIsDeleteVisible(false);
    triggerToast(`${activeTeam.name} removed successfully.`);
  };

  return (
    <GradientContainer screenName="team-management" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header Stack Bar */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </Pressable>
          <ThemedText type="headlineMd" style={{ color: theme.text, flex: 1, marginLeft: 12 }}>
            Manage Teams
          </ThemedText>
        </View>

        <ScrollView style={styles.listScroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.welcomeSection}>
            <ThemedText type="headlineSm" style={{ color: theme.text }}>Roster Management</ThemedText>
            <ThemedText type="bodySm" style={{ color: theme.textSecondary, marginTop: 4 }}>
              Update team lineups, NRR standings, and coordinate matches.
            </ThemedText>
          </View>

          <View style={styles.cardsContainer}>
            {teams.map(team => (
              <View key={team.id} style={[styles.teamCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.logoCircle, { backgroundColor: theme.surfaceLow }]}>
                    <ThemedText style={{ fontSize: 24 }}>{team.logo}</ThemedText>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <ThemedText type="headlineSm" style={{ color: theme.text }}>{team.name}</ThemedText>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: 10 }}>Manager: {team.manager}</ThemedText>
                  </View>
                </View>

                {/* Net Run Rate Stats Grid */}
                <View style={[styles.statsGrid, { backgroundColor: theme.surfaceLow }]}>
                  <View style={styles.statCell}>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>PLAYED</ThemedText>
                    <ThemedText type="bodySm" style={{ color: theme.text, fontWeight: 'bold' }}>{team.played}</ThemedText>
                  </View>
                  <View style={styles.statCell}>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>WINS</ThemedText>
                    <ThemedText type="bodySm" style={{ color: '#0f9f58', fontWeight: 'bold' }}>{team.wins}</ThemedText>
                  </View>
                  <View style={styles.statCell}>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>LOSSES</ThemedText>
                    <ThemedText type="bodySm" style={{ color: '#ba1a1a', fontWeight: 'bold' }}>{team.losses}</ThemedText>
                  </View>
                  <View style={styles.statCell}>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>NRR</ThemedText>
                    <ThemedText type="bodySm" style={{ color: theme.secondaryContainer, fontWeight: 'bold' }}>{team.nrr}</ThemedText>
                  </View>
                </View>

                {/* Inline Action Buttons */}
                <View style={[styles.actionsRow, { borderTopColor: theme.outlineVariant + '22' }]}>
                  <Pressable 
                    style={[styles.cardBtn, { borderColor: theme.outlineVariant }]} 
                    onPress={() => openPlayersModal(team)}
                  >
                    <Ionicons name="people-outline" size={14} color={theme.text} />
                    <ThemedText type="labelSm" style={{ color: theme.text, marginLeft: 4 }}>Roster</ThemedText>
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
            ))}
          </View>
        </ScrollView>

        {/* MODAL 1: EDIT TEAM */}
        <Modal visible={isEditVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.surfaceLowest }]}>
              <ThemedText type="headlineSm" style={styles.modalTitle}>Edit Team</ThemedText>
              
              <View style={styles.inputGroup}>
                <ThemedText type="labelSm" style={styles.inputLabel}>Team name</ThemedText>
                <TextInput
                  style={[styles.textInput, { borderColor: theme.outlineVariant, color: theme.text }]}
                  value={editName}
                  onChangeText={setEditName}
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText type="labelSm" style={styles.inputLabel}>Manager name</ThemedText>
                <TextInput
                  style={[styles.textInput, { borderColor: theme.outlineVariant, color: theme.text }]}
                  value={editManager}
                  onChangeText={setEditManager}
                />
              </View>

              <View style={styles.modalButtons}>
                <Pressable style={[styles.modalBtn, { borderColor: theme.outlineVariant }]} onPress={() => setIsEditVisible(false)}>
                  <ThemedText type="labelSm" style={{ color: theme.text }}>Cancel</ThemedText>
                </Pressable>
                <Pressable style={[styles.modalBtn, { backgroundColor: theme.primary }]} onPress={handleSaveEdit}>
                  <ThemedText type="labelSm" style={{ color: '#ffffff' }}>Save Changes</ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* MODAL 2: PLAYERS LIST */}
        <Modal visible={isPlayersVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.surfaceLowest }]}>
              <View style={styles.rowBetween}>
                <ThemedText type="headlineSm" style={styles.modalTitle}>{activeTeam?.name} Roster</ThemedText>
                <Pressable onPress={() => setIsPlayersVisible(false)}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </Pressable>
              </View>

              <View style={styles.playersTable}>
                <View style={[styles.tableHeader, { backgroundColor: theme.surfaceLow }]}>
                  <ThemedText type="labelSm" style={{ fontWeight: 'bold', width: 35 }}>NO.</ThemedText>
                  <ThemedText type="labelSm" style={{ fontWeight: 'bold', flex: 1 }}>PLAYER NAME</ThemedText>
                  <ThemedText type="labelSm" style={{ fontWeight: 'bold', width: 100 }}>ROLE</ThemedText>
                </View>
                
                {activeTeam?.players.map((p, idx) => (
                  <View key={idx} style={[styles.playerRow, { borderBottomColor: theme.outlineVariant + '22' }]}>
                    <ThemedText type="bodySm" style={{ width: 35, color: theme.text }}>#{p.number}</ThemedText>
                    <ThemedText type="bodySm" style={{ flex: 1, color: theme.text, fontWeight: '500' }}>{p.name}</ThemedText>
                    <ThemedText type="bodySm" style={{ width: 100, color: theme.textSecondary }}>{p.role}</ThemedText>
                  </View>
                ))}
              </View>

              <Pressable style={[styles.modalBtnClose, { backgroundColor: theme.primary }]} onPress={() => setIsPlayersVisible(false)}>
                <ThemedText type="labelSm" style={{ color: '#ffffff' }}>Close Roster</ThemedText>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* MODAL 3: DELETE CONFIRMATION */}
        <Modal visible={isDeleteVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.deleteModalContent, { backgroundColor: theme.surfaceLowest }]}>
              <Ionicons name="warning" size={48} color="#ba1a1a" style={{ alignSelf: 'center', marginBottom: 12 }} />
              <ThemedText type="headlineSm" style={{ textAlign: 'center', color: theme.text }}>Remove Team?</ThemedText>
              <ThemedText type="bodySm" style={{ textAlign: 'center', color: theme.textSecondary, marginVertical: 12 }}>
                Are you sure you want to remove <ThemedText style={{ fontWeight: 'bold', color: theme.text }}>{activeTeam?.name}</ThemedText>? This action will delete their registration and match logs.
              </ThemedText>

              <View style={styles.modalButtons}>
                <Pressable style={[styles.modalBtn, { borderColor: theme.outlineVariant }]} onPress={() => setIsDeleteVisible(false)}>
                  <ThemedText type="labelSm" style={{ color: theme.text }}>Cancel</ThemedText>
                </Pressable>
                <Pressable style={[styles.modalBtn, { backgroundColor: '#ffdad6' }]} onPress={handleDeleteConfirm}>
                  <ThemedText type="labelSm" style={{ color: '#ba1a1a', fontWeight: 'bold' }}>Yes, Remove</ThemedText>
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
  cardsContainer: {
    paddingHorizontal: Spacing.containerMargin,
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  teamCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: BorderRadius.lg,
    paddingVertical: 10,
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
    fontWeight: 'bold',
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
  modalBtnClose: {
    height: 48,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  playersTable: {
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    padding: 8,
    borderRadius: BorderRadius.md,
  },
  playerRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
