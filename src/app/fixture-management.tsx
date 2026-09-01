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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GradientContainer } from '@/components/gradient-container';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const { width } = Dimensions.get('window');

interface Fixture {
  id: string;
  matchNo: string;
  teamA: string;
  teamB: string;
  pitch: string;
  time: string;
  date: string;
  status: 'Scheduled' | 'Live' | 'Finished' | 'Cancelled';
}

const INITIAL_FIXTURES: Fixture[] = [
  { id: 'f1', matchNo: 'Match 1', teamA: 'Red Devils FC', teamB: 'Blue Tigers', pitch: 'Pitch A', time: '10:00 AM', date: '2026-06-15', status: 'Finished' },
  { id: 'f2', matchNo: 'Match 2', teamA: 'Apex Warriors', teamB: 'Strikers City', pitch: 'Pitch B', time: '12:30 PM', date: '2026-06-15', status: 'Live' },
  { id: 'f3', matchNo: 'Match 3', teamA: 'London United', teamB: 'Titans CC', pitch: 'Pitch A', time: '12:30 PM', date: '2026-06-15', status: 'Scheduled' }, // Overlap conflict
  { id: 'f4', matchNo: 'Match 4', teamA: 'Arsenal Fans', teamB: 'Chelsea Fans', pitch: 'Pitch B', time: '03:00 PM', date: '2026-06-15', status: 'Scheduled' },
];

export default function FixtureManagementScreen() {
  const theme = useTheme();
  const router = useRouter();

  // State Variables
  const [viewMode, setViewMode] = useState<'calendar' | 'bracket' | 'list'>('list');
  const [fixtures, setFixtures] = useState<Fixture[]>(INITIAL_FIXTURES);
  const [selectedDate, setSelectedDate] = useState('2026-06-15');
  const [hasConflict, setHasConflict] = useState(true);

  // Schedule tools state
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Edit Fixture states
  const [editingFixture, setEditingFixture] = useState<Fixture | null>(null);
  const [isEditVisible, setIsEditVisible] = useState(false);
  const [editPitch, setEditPitch] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editStatus, setEditStatus] = useState<'Scheduled' | 'Live' | 'Finished' | 'Cancelled'>('Scheduled');

  // Custom Toast state
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
      Animated.delay(2000),
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => setToastMsg(null));
  };

  // Schedule tools
  const handleOptimizeSchedule = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      // Rearrange schedules: resolve the overlap at 12:30 PM on Pitch A
      const optimized = fixtures.map(f => {
        if (f.id === 'f3') {
          return { ...f, time: '01:45 PM', pitch: 'Pitch A' }; // Rescheduled to resolve conflict
        }
        return f;
      });
      setFixtures(optimized);
      setHasConflict(false);
      setIsOptimizing(false);
      triggerToast('Schedule optimised — pitch idle time reduced by 28 mins.');
    }, 1500);
  };

  const handleGenerateBrackets = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const generated: Fixture[] = [
        { id: 'g1', matchNo: 'QF 1', teamA: 'Red Devils FC', teamB: 'Blue Tigers', pitch: 'Pitch A', time: '09:00 AM', date: '2026-06-16', status: 'Scheduled' },
        { id: 'g2', matchNo: 'QF 2', teamA: 'Apex Warriors', teamB: 'Strikers City', pitch: 'Pitch B', time: '10:30 AM', date: '2026-06-16', status: 'Scheduled' },
        { id: 'g3', matchNo: 'QF 3', teamA: 'London United', teamB: 'Titans CC', pitch: 'Pitch A', time: '12:00 PM', date: '2026-06-16', status: 'Scheduled' },
        { id: 'g4', matchNo: 'QF 4', teamA: 'Real Madrid UK', teamB: 'Barca London', pitch: 'Pitch B', time: '01:30 PM', date: '2026-06-16', status: 'Scheduled' },
        { id: 'g5', matchNo: 'SF 1', teamA: 'Winner QF 1', teamB: 'Winner QF 2', pitch: 'Pitch A', time: '03:30 PM', date: '2026-06-16', status: 'Scheduled' },
        { id: 'g6', matchNo: 'SF 2', teamA: 'Winner QF 3', teamB: 'Winner QF 4', pitch: 'Pitch B', time: '05:00 PM', date: '2026-06-16', status: 'Scheduled' },
        { id: 'g7', matchNo: 'Final', teamA: 'Winner SF 1', teamB: 'Winner SF 2', pitch: 'Pitch A', time: '07:30 PM', date: '2026-06-17', status: 'Scheduled' },
      ];
      setFixtures(generated);
      setHasConflict(false);
      setViewMode('bracket');
      setIsGenerating(false);
      triggerToast('Generated a perfect 8-team knockout bracket!');
    }, 1800);
  };

  const handleResolveConflict = () => {
    handleOptimizeSchedule();
  };

  // Edit Fixture Functions
  const openEditModal = (fix: Fixture) => {
    setEditingFixture(fix);
    setEditPitch(fix.pitch);
    setEditTime(fix.time);
    setEditStatus(fix.status);
    setIsEditVisible(true);
  };

  const saveFixtureEdits = () => {
    if (!editingFixture) return;
    setFixtures(fixtures.map(f => f.id === editingFixture.id ? {
      ...f,
      pitch: editPitch,
      time: editTime,
      status: editStatus
    } : f));
    setIsEditVisible(false);
    triggerToast(`Fixture ${editingFixture.matchNo} details modified.`);
  };

  // Sub-renders
  const renderListView = () => (
    <View style={styles.viewContent}>
      <View style={styles.rowBetween}>
        <ThemedText type="headlineSm" style={styles.sectionHeader}>List View ({fixtures.length} matches)</ThemedText>
      </View>
      <View style={styles.fixturesList}>
        {fixtures.map((fix) => (
          <Pressable 
            key={fix.id} 
            style={[styles.fixtureCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}
            onPress={() => openEditModal(fix)}
          >
            <View style={styles.rowBetween}>
              <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontWeight: 'bold' }}>{fix.matchNo} • {fix.date}</ThemedText>
              
              <View style={[
                styles.statusTag,
                fix.status === 'Finished' && { backgroundColor: '#f0f0f2' },
                fix.status === 'Live' && { backgroundColor: '#ffdad6' },
                fix.status === 'Scheduled' && { backgroundColor: '#e6f0fa' },
                fix.status === 'Cancelled' && { backgroundColor: '#feebeb' }
              ]}>
                <ThemedText type="labelSm" style={[
                  { fontSize: 9, fontWeight: 'bold' },
                  fix.status === 'Finished' && { color: '#7f8c8d' },
                  fix.status === 'Live' && { color: '#ba1a1a' },
                  fix.status === 'Scheduled' && { color: '#2980b9' },
                  fix.status === 'Cancelled' && { color: '#ba1a1a' }
                ]}>
                  {fix.status}
                </ThemedText>
              </View>
            </View>

            <View style={styles.matchTeamsRow}>
              <ThemedText type="bodySm" style={[styles.teamNameText, { color: theme.text }]}>{fix.teamA}</ThemedText>
              <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginHorizontal: 8 }}>VS</ThemedText>
              <ThemedText type="bodySm" style={[styles.teamNameText, { color: theme.text, textAlign: 'right' }]}>{fix.teamB}</ThemedText>
            </View>

            <View style={[styles.fixtureFooter, { borderTopColor: theme.outlineVariant + '22' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="location-outline" size={12} color={theme.textSecondary} />
                <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginLeft: 4 }}>{fix.pitch}</ThemedText>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="time-outline" size={12} color={theme.textSecondary} />
                <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginLeft: 4 }}>{fix.time}</ThemedText>
              </View>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );

  const renderBracketView = () => (
    <View style={styles.viewContent}>
      <ThemedText type="headlineSm" style={styles.sectionHeader}>Tournament Bracket Tree</ThemedText>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bracketScroll}>
        {/* Quarter Finals */}
        <View style={styles.bracketColumn}>
          <ThemedText type="labelSm" style={styles.bracketStageTitle}>QUARTER FINALS</ThemedText>
          <View style={styles.bracketMatches}>
            {[
              { teamA: 'Red Devils FC', scoreA: '2', teamB: 'Blue Tigers', scoreB: '1', date: 'June 16 09:00' },
              { teamA: 'Apex Warriors', scoreA: '3', teamB: 'Strikers City', scoreB: '2', date: 'June 16 10:30' },
              { teamA: 'London United', scoreA: '0', teamB: 'Titans CC', scoreB: '1', date: 'June 16 12:00' },
              { teamA: 'Real Madrid UK', scoreA: '1', teamB: 'Barca London', scoreB: '4', date: 'June 16 13:30' },
            ].map((m, idx) => (
              <View key={idx} style={[styles.bracketMatchBox, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant }]}>
                <View style={[styles.bracketTeamRow, { borderBottomWidth: 1, borderBottomColor: theme.outlineVariant + '22' }]}>
                  <ThemedText type="bodySm" numberOfLines={1} style={{ flex: 1, color: theme.text }}>{m.teamA}</ThemedText>
                  <ThemedText type="bodySm" style={{ fontWeight: 'bold', color: theme.text }}>{m.scoreA}</ThemedText>
                </View>
                <View style={styles.bracketTeamRow}>
                  <ThemedText type="bodySm" numberOfLines={1} style={{ flex: 1, color: theme.text }}>{m.teamB}</ThemedText>
                  <ThemedText type="bodySm" style={{ fontWeight: 'bold', color: theme.text }}>{m.scoreB}</ThemedText>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Semi Finals */}
        <View style={styles.bracketColumn}>
          <ThemedText type="labelSm" style={styles.bracketStageTitle}>SEMI FINALS</ThemedText>
          <View style={styles.bracketMatches}>
            {[
              { teamA: 'Red Devils FC', scoreA: '-', teamB: 'Apex Warriors', scoreB: '-', date: 'June 16 15:30' },
              { teamA: 'Titans CC', scoreA: '-', teamB: 'Barca London', scoreB: '-', date: 'June 16 17:00' },
            ].map((m, idx) => (
              <View key={idx} style={[styles.bracketMatchBox, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant, marginTop: 45, marginBottom: 45 }]}>
                <View style={[styles.bracketTeamRow, { borderBottomWidth: 1, borderBottomColor: theme.outlineVariant + '22' }]}>
                  <ThemedText type="bodySm" style={{ flex: 1, color: theme.text }}>{m.teamA}</ThemedText>
                  <ThemedText type="bodySm" style={{ color: theme.text }}>{m.scoreA}</ThemedText>
                </View>
                <View style={styles.bracketTeamRow}>
                  <ThemedText type="bodySm" style={{ flex: 1, color: theme.text }}>{m.teamB}</ThemedText>
                  <ThemedText type="bodySm" style={{ color: theme.text }}>{m.scoreB}</ThemedText>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Final */}
        <View style={styles.bracketColumn}>
          <ThemedText type="labelSm" style={styles.bracketStageTitle}>FINAL</ThemedText>
          <View style={styles.bracketMatches}>
            <View style={[styles.bracketMatchBox, { backgroundColor: theme.surfaceLowest, borderColor: theme.secondaryContainer, borderWidth: 2, marginTop: 140 }]}>
              <View style={[styles.bracketTeamRow, { borderBottomWidth: 1, borderBottomColor: theme.outlineVariant + '22' }]}>
                <ThemedText type="bodySm" style={{ flex: 1, color: theme.text }}>Winner Semis 1</ThemedText>
                <ThemedText type="bodySm" style={{ color: theme.text }}>-</ThemedText>
              </View>
              <View style={styles.bracketTeamRow}>
                <ThemedText type="bodySm" style={{ flex: 1, color: theme.text }}>Winner Semis 2</ThemedText>
                <ThemedText type="bodySm" style={{ color: theme.text }}>-</ThemedText>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );

  const renderCalendarView = () => (
    <View style={styles.viewContent}>
      <ThemedText type="headlineSm" style={styles.sectionHeader}>Calendar Agenda</ThemedText>
      
      {/* Horizontal Month calendar mock */}
      <View style={[styles.calendarGrid, { backgroundColor: theme.surfaceLow }]}>
        <View style={styles.calendarHeaderRow}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
            <ThemedText key={i} type="labelSm" style={{ flex: 1, textAlign: 'center', color: theme.textSecondary }}>{day}</ThemedText>
          ))}
        </View>
        <View style={styles.calendarDaysRow}>
          {[12, 13, 14, 15, 16, 17, 18].map((day) => {
            const isSelected = selectedDate === `2026-06-${day}`;
            return (
              <Pressable
                key={day}
                onPress={() => setSelectedDate(`2026-06-${day}`)}
                style={[
                  styles.calendarDayCell,
                  isSelected && { backgroundColor: theme.primary }
                ]}
              >
                <ThemedText type="bodySm" style={{ color: isSelected ? '#ffffff' : theme.text, fontWeight: isSelected ? 'bold' : 'normal' }}>
                  {day}
                </ThemedText>
                {day === 15 && <View style={[styles.dotIndicator, { backgroundColor: theme.secondaryContainer }]} />}
                {day === 16 && <View style={[styles.dotIndicator, { backgroundColor: theme.secondaryContainer }]} />}
              </Pressable>
            );
          })}
        </View>
      </View>

      <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginTop: 12 }}>Matches Scheduled for June {selectedDate.split('-')[2]}, 2026:</ThemedText>
      
      <View style={[styles.fixturesList, { marginTop: 8 }]}>
        {fixtures.filter(f => f.date === selectedDate).map((fix) => (
          <Pressable 
            key={fix.id} 
            style={[styles.fixtureCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}
            onPress={() => openEditModal(fix)}
          >
            <View style={styles.rowBetween}>
              <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>{fix.matchNo} • {fix.time}</ThemedText>
              <ThemedText type="labelSm" style={{ color: theme.secondaryContainer }}>{fix.pitch}</ThemedText>
            </View>
            <ThemedText type="bodySm" style={{ fontWeight: 'bold', color: theme.text, marginVertical: 6 }}>
              {fix.teamA} VS {fix.teamB}
            </ThemedText>
          </Pressable>
        ))}
        {fixtures.filter(f => f.date === selectedDate).length === 0 && (
          <ThemedText type="bodySm" style={{ color: theme.textSecondary, fontStyle: 'italic', textAlign: 'center', marginTop: 16 }}>
            No matches scheduled for this date.
          </ThemedText>
        )}
      </View>
    </View>
  );

  return (
    <GradientContainer screenName="fixture-management" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header stack navigation */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/tournaments')}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </Pressable>
          <ThemedText type="headlineMd" style={{ color: theme.text, flex: 1, marginLeft: 12 }}>
            Fixture Management
          </ThemedText>
        </View>

        {/* View mode toggle controls */}
        <View style={styles.viewModesRow}>
          <Pressable 
            style={[styles.modeBtn, viewMode === 'list' && [styles.modeBtnActive, { backgroundColor: theme.primary }]]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons name="list-outline" size={16} color={viewMode === 'list' ? '#ffffff' : theme.text} />
            <ThemedText type="labelSm" style={{ color: viewMode === 'list' ? '#ffffff' : theme.text, marginLeft: 6 }}>List View</ThemedText>
          </Pressable>

          <Pressable 
            style={[styles.modeBtn, viewMode === 'bracket' && [styles.modeBtnActive, { backgroundColor: theme.primary }]]}
            onPress={() => setViewMode('bracket')}
          >
            <Ionicons name="git-network-outline" size={16} color={viewMode === 'bracket' ? '#ffffff' : theme.text} />
            <ThemedText type="labelSm" style={{ color: viewMode === 'bracket' ? '#ffffff' : theme.text, marginLeft: 6 }}>Brackets</ThemedText>
          </Pressable>

          <Pressable 
            style={[styles.modeBtn, viewMode === 'calendar' && [styles.modeBtnActive, { backgroundColor: theme.primary }]]}
            onPress={() => setViewMode('calendar')}
          >
            <Ionicons name="calendar-outline" size={16} color={viewMode === 'calendar' ? '#ffffff' : theme.text} />
            <ThemedText type="labelSm" style={{ color: viewMode === 'calendar' ? '#ffffff' : theme.text, marginLeft: 6 }}>Calendar</ThemedText>
          </Pressable>
        </View>

        {/* Schedule Tools Panel */}
        <View style={[styles.toolsPanel, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant }]}>
          <View style={styles.rowBetween}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="options-outline" size={18} color={theme.secondaryContainer} />
              <ThemedText type="labelSm" style={{ color: theme.text, fontWeight: 'bold', marginLeft: 6 }}>SCHEDULE TOOLS</ThemedText>
            </View>
            {isOptimizing || isGenerating ? (
              <ActivityIndicator size="small" color={theme.secondaryContainer} />
            ) : null}
          </View>

          <View style={styles.toolsButtonsRow}>
            <Pressable style={[styles.toolsBtn, { backgroundColor: theme.primary }]} onPress={handleOptimizeSchedule}>
              <Ionicons name="options-outline" size={14} color="#ffffff" />
              <ThemedText type="labelSm" style={{ color: '#ffffff', marginLeft: 4 }}>Optimize Times</ThemedText>
            </Pressable>
            <Pressable style={[styles.toolsBtn, { backgroundColor: theme.primary }]} onPress={handleGenerateBrackets}>
              <Ionicons name="git-branch-outline" size={14} color="#ffffff" />
              <ThemedText type="labelSm" style={{ color: '#ffffff', marginLeft: 4 }}>Auto-Gen Brackets</ThemedText>
            </Pressable>
          </View>
        </View>

        {/* CONFLICT DETECTOR WARNING BOX */}
        {hasConflict && viewMode === 'list' && (
          <View style={[styles.conflictAlertBox, { backgroundColor: '#fff8e1', borderColor: '#ffe082' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <Ionicons name="warning-sharp" size={20} color="#ffb300" style={{ marginTop: 2 }} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <ThemedText type="labelSm" style={{ color: '#6b4500', fontWeight: 'bold' }}>Schedule Conflict Detected</ThemedText>
                <ThemedText type="bodySm" style={{ color: '#7f5800', marginTop: 2 }}>
                  Blue Tigers vs London United scheduled on Pitch A at 12:30 PM, overlapping with Red Devils FC.
                </ThemedText>
                <Pressable style={styles.conflictResolveBtn} onPress={handleResolveConflict}>
                  <ThemedText type="labelSm" style={{ color: '#ffffff', fontWeight: 'bold' }}>AUTO RESOLVE</ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        )}

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {viewMode === 'list' && renderListView()}
          {viewMode === 'bracket' && renderBracketView()}
          {viewMode === 'calendar' && renderCalendarView()}
        </ScrollView>

        {/* MODAL: EDIT FIXTURE DETAILS */}
        <Modal visible={isEditVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.surfaceLowest }]}>
              <View style={styles.rowBetween}>
                <ThemedText type="headlineSm" style={{ color: theme.text, fontWeight: 'bold' }}>Modify Fixture</ThemedText>
                <Pressable onPress={() => setIsEditVisible(false)}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </Pressable>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText type="labelSm" style={styles.inputLabel}>Selected pitch</ThemedText>
                <TextInput
                  style={[styles.textInput, { borderColor: theme.outlineVariant, color: theme.text }]}
                  value={editPitch}
                  onChangeText={setEditPitch}
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText type="labelSm" style={styles.inputLabel}>Scheduled time</ThemedText>
                <TextInput
                  style={[styles.textInput, { borderColor: theme.outlineVariant, color: theme.text }]}
                  value={editTime}
                  onChangeText={setEditTime}
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText type="labelSm" style={styles.inputLabel}>Status</ThemedText>
                <View style={styles.statusSelectors}>
                  {['Scheduled', 'Live', 'Finished', 'Cancelled'].map((st) => (
                    <Pressable
                      key={st}
                      onPress={() => setEditStatus(st as any)}
                      style={[
                        styles.statusPill,
                        { borderColor: theme.outlineVariant },
                        editStatus === st && { backgroundColor: theme.primary, borderColor: theme.primary }
                      ]}
                    >
                      <ThemedText type="labelSm" style={{ color: editStatus === st ? '#ffffff' : theme.text, fontSize: 10 }}>
                        {st}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>

              <Pressable style={[styles.modalSaveBtn, { backgroundColor: theme.secondaryContainer }]} onPress={saveFixtureEdits}>
                <ThemedText type="labelSm" style={{ color: '#ffffff', fontWeight: 'bold' }}>Save Changes</ThemedText>
              </Pressable>
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
  viewModesRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.containerMargin,
    gap: 8,
    marginBottom: Spacing.md,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#c3c7cb55',
    borderRadius: BorderRadius.full,
  },
  modeBtnActive: {
    borderWidth: 0,
  },
  toolsPanel: {
    marginHorizontal: Spacing.containerMargin,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  toolsButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: Spacing.sm,
  },
  toolsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
  },
  conflictAlertBox: {
    marginHorizontal: Spacing.containerMargin,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  conflictResolveBtn: {
    backgroundColor: '#ffb300',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  viewContent: {
    paddingHorizontal: Spacing.containerMargin,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
  },
  fixturesList: {
    gap: 12,
  },
  fixtureCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.md,
  },
  matchTeamsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
  },
  teamNameText: {
    flex: 1,
    fontWeight: 'bold',
  },
  fixtureFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: Spacing.xs,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  // Bracket View styles
  bracketScroll: {
    paddingVertical: 10,
    gap: 24,
  },
  bracketColumn: {
    width: width - 80,
  },
  bracketStageTitle: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: Spacing.md,
    letterSpacing: 1,
  },
  bracketMatches: {
    gap: 20,
  },
  bracketMatchBox: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  bracketTeamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  // Calendar View styles
  calendarGrid: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  calendarDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calendarDayCell: {
    width: 32,
    height: 38,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dotIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: 4,
  },
  // Modal Edit styles
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
  statusSelectors: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  modalSaveBtn: {
    height: 48,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
});
