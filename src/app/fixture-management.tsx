import React, { useState, useMemo } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTournamentStore } from '@/store/app-store';
import { generateFixtures, hasTournamentStarted } from '@/store/tournament-store';
import { todayIso } from '@/constants/tournament';

import { ThemedText, MAX_FONT_SCALE } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GradientContainer } from '@/components/gradient-container';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const { width } = Dimensions.get('window');

interface Fixture {
  id: string;
  matchNo: string;
  /** Quarter Final / Semi Final / Final — grouped by this in the UI. */
  round?: string;
  teamA: string;
  teamB: string;
  pitch: string;
  time: string;
  date: string;
  status: 'Scheduled' | 'Live' | 'Finished' | 'Cancelled';
}

/**
 * The planner previously opened on four invented matches — "Red Devils FC vs
 * Blue Tigers, Pitch A" — complete with a staged scheduling conflict, on every
 * tournament. It now starts empty and builds the draw from the teams that
 * actually registered.
 */
const KICKOFF_TIMES = ['09:00 AM', '10:30 AM', '12:00 PM', '01:30 PM', '03:00 PM', '04:30 PM'];
const PITCHES = ['Pitch A', 'Pitch B'];

export default function FixtureManagementScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ tournamentId?: string }>();
  const { publishedTournaments, registrations, updateTournament } = useTournamentStore();

  const tournament = useMemo(
    () => (publishedTournaments || []).find((t: any) => t.id === params.tournamentId),
    [publishedTournaments, params.tournamentId]
  );

  /** Confirmed teams, in the order they registered — the seeding order. */
  const registeredTeamNames = useMemo(
    () =>
      (registrations || [])
        .filter((r: any) => r.tournamentId === params.tournamentId && r.status !== 'rejected')
        .map((r: any) => r.teamName)
        .filter(Boolean),
    [registrations, params.tournamentId]
  );

  // State Variables
  const [viewMode, setViewMode] = useState<'calendar' | 'bracket' | 'list'>('list');
  const [fixtures, setFixturesLocal] = useState<Fixture[]>([]);

  /** Persist alongside local state so every screen sees the same draw. */
  const setFixtures = (next: Fixture[] | ((prev: Fixture[]) => Fixture[])) => {
    setFixturesLocal(prev => {
      const value = typeof next === 'function' ? (next as (p: Fixture[]) => Fixture[])(prev) : next;
      if (params.tournamentId) updateTournament(params.tournamentId, { fixtures: value });
      return value;
    });
  };

  // Load whatever the tournament already holds.
  React.useEffect(() => {
    if (Array.isArray(tournament?.fixtures)) setFixturesLocal(tournament!.fixtures as Fixture[]);
  }, [tournament?.id]);
  const [selectedDate, setSelectedDate] = useState(todayIso());
  // Derived from the fixtures actually present, not asserted up front.
  const [conflictDismissed, setConflictDismissed] = useState(false);

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
  /**
   * Spread clashing matches onto free slots.
   *
   * This used to hardcode a fix for mock fixture 'f3'. It now finds real
   * collisions — two matches on the same pitch at the same time — and moves
   * the later one to the next free kick-off.
   */
  const handleOptimizeSchedule = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      const seen = new Set<string>();
      const optimized = fixtures.map(f => {
        let time = f.time;
        let slot = KICKOFF_TIMES.indexOf(time);
        if (slot < 0) slot = 0;
        while (seen.has(`${f.pitch}@${time}`) && slot < KICKOFF_TIMES.length - 1) {
          slot += 1;
          time = KICKOFF_TIMES[slot];
        }
        seen.add(`${f.pitch}@${time}`);
        return time === f.time ? f : { ...f, time };
      });
      const moved = optimized.filter((f, i) => f.time !== fixtures[i].time).length;
      setFixtures(optimized);
      setConflictDismissed(true);
      setIsOptimizing(false);
      triggerToast(moved > 0 ? `Moved ${moved} ${moved === 1 ? 'match' : 'matches'} to free slots` : 'No clashes to resolve');
    }, 700);
  };

  /**
   * Build the draw from the teams that registered.
   *
   * This returned a fixed 8-team bracket of invented clubs ("Real Madrid UK vs
   * Barca London") regardless of who had entered. Slots are spread across the
   * available pitches and kick-off times so two matches never open on the same
   * pitch at the same time.
   */
  /** Pitch/time collisions in the current draw. */
  const conflicts = useMemo(() => {
    const seen = new Map<string, Fixture>();
    const clashes: string[] = [];
    for (const f of fixtures) {
      const key = `${f.pitch}@${f.time}@${f.date}`;
      const first = seen.get(key);
      if (first) {
        clashes.push(`${f.teamA} vs ${f.teamB} clashes with ${first.teamA} vs ${first.teamB} on ${f.pitch} at ${f.time}.`);
      } else {
        seen.set(key, f);
      }
    }
    return clashes;
  }, [fixtures]);

  const conflictSummary = conflicts[0] || 'No scheduling clashes.';

  const buildFixtures = (): Fixture[] =>
    generateFixtures(registeredTeamNames).map((f, i) => ({
      id: f.id,
      matchNo: f.matchNo,
      round: f.round,
      teamA: f.teamA,
      teamB: f.teamB,
      pitch: PITCHES[i % PITCHES.length],
      time: KICKOFF_TIMES[Math.floor(i / PITCHES.length) % KICKOFF_TIMES.length],
      date: tournament?.startDate || selectedDate,
      status: 'Scheduled' as const,
    }));

  const handleGenerateBrackets = () => {
    if (registeredTeamNames.length < 2) {
      triggerToast('At least two teams must register before a draw can be made');
      return;
    }
    setIsGenerating(true);
    setTimeout(() => {
      const generated = buildFixtures();
      setFixtures(generated);
      setConflictDismissed(true);
      setViewMode('bracket');
      setIsGenerating(false);
      triggerToast(`Generated ${generated.length} ${generated.length === 1 ? 'match' : 'matches'} from ${registeredTeamNames.length} teams`);
    }, 900);
  };

  /**
   * Draw automatically once registration has closed and play has begun, but
   * only while no fixtures exist — regenerating would discard an organiser's
   * manual edits.
   */
  React.useEffect(() => {
    if (!tournament) return;
    if (fixtures.length > 0) return;
    // Full counts as "registration complete" — waiting for the status to flip
    // to Ongoing meant a full cup still showed no fixtures.
    const full =
      Number(tournament.maxTeams) > 0 &&
      registeredTeamNames.length >= Number(tournament.maxTeams);
    if (!full && !hasTournamentStarted(tournament.status)) return;
    if (registeredTeamNames.length < 2) return;

    setFixtures(buildFixtures());
    triggerToast('Fixtures generated automatically — registration has closed');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournament?.status, tournament?.maxTeams, registeredTeamNames.length]);

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
              <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontWeight: '500' }}>{fix.matchNo} • {fix.date}</ThemedText>
              
              <View style={[
                styles.statusTag,
                fix.status === 'Finished' && { backgroundColor: '#f0f0f2' },
                fix.status === 'Live' && { backgroundColor: '#ffdad6' },
                fix.status === 'Scheduled' && { backgroundColor: '#e6f0fa' },
                fix.status === 'Cancelled' && { backgroundColor: '#feebeb' }
              ]}>
                <ThemedText type="labelSm" style={[
                  { fontSize: 9, fontWeight: '500' },
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

  /**
   * The draw, rendered from the fixtures that exist.
   *
   * This was a fixed 8-team bracket with invented clubs and invented scores —
   * "Real Madrid UK 1 – 4 Barca London" — shown on every tournament.
   */
  const renderBracketView = () => (
    <View style={styles.viewContent}>
      <ThemedText type="headlineSm" style={styles.sectionHeader}>Tournament Bracket</ThemedText>

      {fixtures.length === 0 ? (
        <View style={[styles.emptyBox, { borderColor: theme.outlineVariant + '55' }]}>
          <Ionicons name="git-branch-outline" size={22} color={theme.textSecondary} />
          <ThemedText type="bodySm" style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 8 }}>
            {registeredTeamNames.length < 2
              ? 'At least two teams must register before a draw can be made.'
              : 'No draw yet — tap Generate Brackets to build one from the registered teams.'}
          </ThemedText>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bracketScroll}>
          {/* One column per round, so the bracket reads left-to-right from the
              opening ties through to the final. */}
          {[...new Map(fixtures.map(f => [f.round || 'Fixtures', null])).keys()].map((round) => (
          <View key={round} style={styles.bracketColumn}>
            <ThemedText type="labelSm" style={styles.bracketStageTitle}>
              {String(round).toUpperCase()}
            </ThemedText>
            <View style={styles.bracketMatches}>
              {fixtures.filter(f => (f.round || 'Fixtures') === round).map((m) => (
                <View
                  key={m.id}
                  style={[styles.bracketMatchBox, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant }]}
                >
                  <View style={[styles.bracketTeamRow, { borderBottomWidth: 1, borderBottomColor: theme.outlineVariant + '22' }]}>
                    <ThemedText type="bodySm" numberOfLines={1} style={{ flex: 1, color: theme.text }}>{m.teamA}</ThemedText>
                  </View>
                  <View style={styles.bracketTeamRow}>
                    <ThemedText type="bodySm" numberOfLines={1} style={{ flex: 1, color: theme.text }}>{m.teamB}</ThemedText>
                  </View>
                  <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: 9, marginTop: 4 }}>
                    {m.pitch} · {m.time}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>
          ))}
        </ScrollView>
      )}
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
            <ThemedText type="bodySm" style={{ fontWeight: '500', color: theme.text, marginVertical: 6 }}>
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
              <ThemedText type="labelSm" style={{ color: theme.text, fontWeight: '500', marginLeft: 6 }}>SCHEDULE TOOLS</ThemedText>
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
        {conflicts.length > 0 && !conflictDismissed && viewMode === 'list' && (
          <View style={[styles.conflictAlertBox, { backgroundColor: '#fff8e1', borderColor: '#ffe082' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <Ionicons name="warning-sharp" size={20} color="#ffb300" style={{ marginTop: 2 }} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <ThemedText type="labelSm" style={{ color: '#6b4500', fontWeight: '500' }}>Schedule Conflict Detected</ThemedText>
                <ThemedText type="bodySm" style={{ color: '#7f5800', marginTop: 2 }}>
                  {conflictSummary}
                </ThemedText>
                <Pressable style={styles.conflictResolveBtn} onPress={handleResolveConflict}>
                  <ThemedText type="labelSm" style={{ color: '#ffffff', fontWeight: '500' }}>AUTO RESOLVE</ThemedText>
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
                <ThemedText type="headlineSm" style={{ color: theme.text, fontWeight: '500' }}>Modify Fixture</ThemedText>
                <Pressable onPress={() => setIsEditVisible(false)}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </Pressable>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText type="labelSm" style={styles.inputLabel}>Selected pitch</ThemedText>
                <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                  style={[styles.textInput, { borderColor: theme.outlineVariant, color: theme.text }]}
                  value={editPitch}
                  onChangeText={setEditPitch}
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText type="labelSm" style={styles.inputLabel}>Scheduled time</ThemedText>
                <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
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
                <ThemedText type="labelSm" style={{ color: '#ffffff', fontWeight: '500' }}>Save Changes</ThemedText>
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
    fontWeight: '500',
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
    fontWeight: '500',
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
  emptyBox: {
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 30,
    paddingHorizontal: 22,
    marginTop: 8,
  },
  bracketScroll: {
    paddingVertical: 10,
    gap: 24,
  },
  bracketColumn: {
    width: width - 80,
  },
  bracketStageTitle: {
    textAlign: 'center',
    fontWeight: '500',
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
    includeFontPadding: false,
    paddingVertical: 0,
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
