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
import {
  buildTournamentFixtures,
  hasTournamentStarted,
  kickoffSlots,
  matchLengthMinutes,
  scheduleAtVenue,
  findOverlap,
  datesInWindow,
  isoDateParts,
  parseKickoff,
  formatKickoff,
  fixtureDateIssue,
} from '@/store/tournament-store';
import { todayIso, formatIsoDate } from '@/constants/tournament';
import { useUserProfile } from '@/hooks/use-user-profile';

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

export default function FixtureManagementScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ tournamentId?: string }>();
  const { publishedTournaments, registrations, updateTournament } = useTournamentStore();
  const { profile } = useUserProfile();
  /** Drawing and rescheduling are the host's job; players only read the draw. */
  const isHost = profile.role === 'Organizer' || profile.role === 'Super Admin';

  const tournament = useMemo(
    () => (publishedTournaments || []).find((t: any) => t.id === params.tournamentId),
    [publishedTournaments, params.tournamentId]
  );

  /** Match length from the tournament's format; kick-offs are spaced by it. */
  const matchMinutes = matchLengthMinutes(tournament?.matchDuration);
  const kickoffTimes = kickoffSlots(matchMinutes);

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
  const [viewMode, setViewMode] = useState<'bracket' | 'list'>('list');
  /**
   * The draw is read straight from the tournament record, so every save here
   * is exactly what the Fixtures tab and the Cups screen show. It used to be a
   * local copy loaded once on open: when the store redrew or re-timed the draw
   * afterwards, the next edit wrote that stale copy back over it.
   */
  const fixtures = useMemo<Fixture[]>(
    () => (Array.isArray(tournament?.fixtures) ? (tournament!.fixtures as Fixture[]) : []),
    [tournament?.fixtures]
  );

  const setFixtures = (next: Fixture[] | ((prev: Fixture[]) => Fixture[])) => {
    if (!params.tournamentId) return;
    const value = typeof next === 'function' ? (next as (p: Fixture[]) => Fixture[])(fixtures) : next;
    updateTournament(params.tournamentId, { fixtures: value });
  };

  /**
   * The tournament's own days, plus any a fixture already sits on — the days
   * offered in the reschedule date picker.
   */
  const calendarDates = useMemo(() => {
    const start = tournament?.startDate || todayIso();
    const days = datesInWindow(start, tournament?.endDate || start);
    const extra = fixtures.map(f => f.date).filter(d => d && !days.includes(d));
    return [...new Set([...days, ...extra])].sort();
  }, [tournament?.startDate, tournament?.endDate, fixtures]);

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
  const [editDate, setEditDate] = useState('');
  /** Custom kick-off, typed in parts; a valid entry becomes `editTime`. */
  const [customTime, setCustomTime] = useState<{ hour: string; minute: string; meridiem: 'AM' | 'PM' }>({
    hour: '',
    minute: '',
    meridiem: 'AM',
  });

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
      // One match at a time per venue; kick-offs that already fit are kept.
      const optimized = scheduleAtVenue(fixtures, matchMinutes);
      const moved = optimized.filter((f, i) => f.time !== fixtures[i].time || f.date !== fixtures[i].date).length;
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
    // Overlapping matches, not just identical kick-offs: at 90 minutes a match,
    // 09:00 and 10:00 at the same venue clash too.
    const clashes: string[] = [];
    fixtures.forEach((f, i) => {
      const other = findOverlap(fixtures.slice(0, i), f, matchMinutes);
      if (other) {
        clashes.push(`${f.teamA} vs ${f.teamB} overlaps ${other.teamA} vs ${other.teamB} at ${f.pitch} on ${formatIsoDate(f.date)}.`);
      }
    });
    return clashes;
  }, [fixtures, matchMinutes]);

  const conflictSummary = conflicts[0] || 'No scheduling clashes.';

  /**
   * The draw, dated across the tournament window.
   *
   * Every fixture used to take the tournament's start date, so a quarter-final
   * and the final were scheduled for the same day. Each round now gets its own
   * date — opening round on the start date, final on the end date — and pitch
   * and kick-off restart per round, since each round is its own match day.
   */
  // Same builder the store uses to draw a full tournament automatically.
  const buildFixtures = (): Fixture[] =>
    buildTournamentFixtures(registeredTeamNames, tournament?.startDate, tournament?.endDate, todayIso(), {
      venue: tournament?.location,
      matchDuration: tournament?.matchDuration,
    });

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
    setEditDate(fix.date);
    fillCustomFrom(fix.time);
    setEditStatus(fix.status);
    setIsEditVisible(true);
  };

  /** Mirror a kick-off into the custom hh:mm fields. */
  const fillCustomFrom = (time: string) => {
    const parsed = parseKickoff(time);
    setCustomTime(
      parsed
        ? { hour: String(parsed.hour), minute: String(parsed.minute).padStart(2, '0'), meridiem: parsed.meridiem }
        : { hour: '', minute: '', meridiem: 'AM' }
    );
  };

  const selectKickoff = (slot: string) => {
    setEditTime(slot);
    fillCustomFrom(slot);
  };

  const updateCustomTime = (patch: Partial<typeof customTime>) => {
    const next = { ...customTime, ...patch };
    setCustomTime(next);
    const formatted = formatKickoff(next.hour, next.minute, next.meridiem);
    if (formatted) setEditTime(formatted);
  };

  const customTimeInvalid =
    (customTime.hour !== '' || customTime.minute !== '') &&
    !formatKickoff(customTime.hour, customTime.minute, customTime.meridiem);

  /** Days offered in the picker — the window, plus the fixture's own day if outside it. */
  const editDateOptions =
    editDate && !calendarDates.includes(editDate) ? [...calendarDates, editDate].sort() : calendarDates;

  /** Another match at this venue that would still be playing at this kick-off. */
  const editClash = editingFixture
    ? findOverlap(fixtures, { id: editingFixture.id, date: editDate, time: editTime, pitch: editPitch }, matchMinutes)
    : undefined;

  const editDateIssue = editingFixture ? fixtureDateIssue(fixtures, editingFixture.id, editDate) : null;

  const saveFixtureEdits = () => {
    if (!editingFixture) return;
    if (customTimeInvalid) {
      triggerToast('Fix the custom kick-off time before saving');
      return;
    }
    setFixtures(fixtures.map(f => f.id === editingFixture.id ? {
      ...f,
      date: editDate || f.date,
      pitch: editPitch,
      time: editTime,
      status: editStatus
    } : f));
    setIsEditVisible(false);
    triggerToast(`${editingFixture.matchNo} set for ${formatIsoDate(editDate || editingFixture.date)}, ${editTime}`);
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
              <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontWeight: '500' }}>{fix.matchNo} • {formatIsoDate(fix.date)}</ThemedText>
              
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
          <Ionicons name="git-branch-outline" size={20} color={theme.textSecondary} />
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

  if (!isHost) {
    return (
      <GradientContainer screenName="fixture-management" style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.header}>
            <Pressable
              style={styles.backBtn}
              onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/tournaments')}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={20} color={theme.text} />
            </Pressable>
            <ThemedText type="headlineMd" style={{ color: theme.text, flex: 1, marginLeft: 12 }}>
              Fixture Management
            </ThemedText>
          </View>
          <View style={[styles.emptyBox, { borderColor: theme.outlineVariant + '55', marginHorizontal: Spacing.containerMargin, marginTop: 24 }]}>
            <Ionicons name="lock-closed-outline" size={20} color={theme.textSecondary} />
            <ThemedText type="bodySm" style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 8 }}>
              Only the tournament host can generate or change fixtures. The draw is on the tournament's Fixtures tab.
            </ThemedText>
          </View>
        </SafeAreaView>
      </GradientContainer>
    );
  }

  return (
    <GradientContainer screenName="fixture-management" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header stack navigation */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/tournaments')}>
            <Ionicons name="arrow-back" size={20} color={theme.text} />
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
        </ScrollView>

        {/* MODAL: EDIT FIXTURE DETAILS */}
        <Modal visible={isEditVisible} transparent animationType="slide" onRequestClose={() => setIsEditVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.surfaceLowest }]}>
              <View style={styles.rowBetween}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <ThemedText type="headlineSm" style={{ color: theme.text, fontWeight: '500' }}>Modify Fixture</ThemedText>
                  {editingFixture && (
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary }} numberOfLines={1}>
                      {editingFixture.matchNo} · {editingFixture.teamA} v {editingFixture.teamB}
                    </ThemedText>
                  )}
                </View>
                <Pressable onPress={() => setIsEditVisible(false)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Close">
                  <Ionicons name="close" size={20} color={theme.text} />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingBottom: 4 }}>
                {/* Date — limited to the tournament's days. */}
                <View>
                  <ThemedText type="labelSm" style={styles.inputLabel}>Match date</ThemedText>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                    {editDateOptions.map((iso) => {
                      const parts = isoDateParts(iso);
                      const active = iso === editDate;
                      return (
                        <Pressable
                          key={iso}
                          onPress={() => setEditDate(iso)}
                          accessibilityRole="button"
                          accessibilityState={{ selected: active }}
                          accessibilityLabel={`Play on ${formatIsoDate(iso)}`}
                          style={[
                            styles.dateChip,
                            { borderColor: active ? theme.primary : theme.outlineVariant + '66', backgroundColor: active ? theme.primary : theme.surfaceLowest },
                          ]}
                        >
                          <ThemedText style={[styles.dateChipSmall, { color: active ? '#ffffffcc' : theme.textSecondary }]}>{parts?.weekday}</ThemedText>
                          <ThemedText style={[styles.dateChipDay, { color: active ? '#ffffff' : theme.text }]}>{parts?.day}</ThemedText>
                          <ThemedText style={[styles.dateChipSmall, { color: active ? '#ffffffcc' : theme.textSecondary }]}>{parts?.month}</ThemedText>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                  <ThemedText type="labelSm" style={[styles.hintText, { color: theme.textSecondary }]}>
                    {tournament?.startDate
                      ? `Tournament runs ${formatIsoDate(tournament.startDate)} – ${formatIsoDate(tournament.endDate || tournament.startDate)}`
                      : 'No tournament dates set'}
                  </ThemedText>
                </View>

                {/* Kick-off — a preset slot, or any time typed in. */}
                <View>
                  <ThemedText type="labelSm" style={styles.inputLabel}>Kick-off time</ThemedText>
                  <View style={styles.timeChipWrap}>
                    {kickoffTimes.map((slot) => {
                      const active = slot === editTime;
                      return (
                        <Pressable
                          key={slot}
                          onPress={() => selectKickoff(slot)}
                          accessibilityRole="button"
                          accessibilityState={{ selected: active }}
                          style={[
                            styles.timeChip,
                            { borderColor: active ? theme.primary : theme.outlineVariant + '66', backgroundColor: active ? theme.primary : theme.surfaceLowest },
                          ]}
                        >
                          <ThemedText type="labelSm" style={{ color: active ? '#ffffff' : theme.text, fontSize: 11 }}>{slot}</ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>

                  <View style={styles.customTimeRow}>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginRight: 4 }}>Custom</ThemedText>
                    <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                      style={[styles.textInput, styles.timeBox, { borderColor: theme.outlineVariant, color: theme.text }]}
                      value={customTime.hour}
                      onChangeText={(t) => updateCustomTime({ hour: t.replace(/\D/g, '').slice(0, 2) })}
                      placeholder="hh"
                      placeholderTextColor="#94a3b8"
                      keyboardType="number-pad"
                      maxLength={2}
                      accessibilityLabel="Kick-off hour"
                    />
                    <ThemedText style={{ color: theme.text }}>:</ThemedText>
                    <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                      style={[styles.textInput, styles.timeBox, { borderColor: theme.outlineVariant, color: theme.text }]}
                      value={customTime.minute}
                      onChangeText={(t) => updateCustomTime({ minute: t.replace(/\D/g, '').slice(0, 2) })}
                      placeholder="mm"
                      placeholderTextColor="#94a3b8"
                      keyboardType="number-pad"
                      maxLength={2}
                      accessibilityLabel="Kick-off minutes"
                    />
                    {(['AM', 'PM'] as const).map((mer) => {
                      const active = customTime.meridiem === mer;
                      return (
                        <Pressable
                          key={mer}
                          onPress={() => updateCustomTime({ meridiem: mer })}
                          accessibilityRole="button"
                          accessibilityState={{ selected: active }}
                          style={[
                            styles.meridiemBtn,
                            { borderColor: active ? theme.primary : theme.outlineVariant + '66', backgroundColor: active ? theme.primary + '14' : 'transparent' },
                          ]}
                        >
                          <ThemedText type="labelSm" style={{ color: active ? theme.primary : theme.textSecondary }}>{mer}</ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                  {customTimeInvalid && (
                    <ThemedText type="labelSm" style={[styles.hintText, { color: '#DC2626' }]}>
                      Enter an hour from 1 to 12 and minutes from 00 to 59.
                    </ThemedText>
                  )}
                </View>

                <View>
                  <ThemedText type="labelSm" style={styles.inputLabel}>Venue</ThemedText>
                  <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                    style={[styles.textInput, { borderColor: theme.outlineVariant, color: theme.text }]}
                    value={editPitch}
                    onChangeText={setEditPitch}
                  />
                </View>

                <View>
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

                {(editClash || editDateIssue) && (
                  <View style={[styles.editWarn, { backgroundColor: '#F59E0B14', borderColor: '#F59E0B55' }]}>
                    <Ionicons name="warning-outline" size={14} color="#B45309" />
                    <ThemedText type="labelSm" style={{ color: '#B45309', flex: 1 }}>
                      {editClash
                        ? `${editClash.matchNo} (${editClash.teamA} v ${editClash.teamB}) kicks off at ${editClash.time} at ${editClash.pitch} — ${matchMinutes}-minute matches would overlap.`
                        : editDateIssue}
                    </ThemedText>
                  </View>
                )}
              </ScrollView>

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
    top: 56,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
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
  // Reschedule pickers
  chipRow: { gap: 8, paddingVertical: 2, paddingRight: 8 },
  dateChip: {
    width: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingTop: 6,
    paddingBottom: 10,
    alignItems: 'center',
    position: 'relative',
  },
  dateChipSmall: { fontSize: 9.5, fontFamily: 'Sora_400Regular' },
  dateChipDay: { fontSize: 14.5, fontFamily: 'Sora_500Medium', marginVertical: 1 },
  timeChipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  customTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  timeBox: { width: 48, minWidth: 0, paddingHorizontal: 0, textAlign: 'center' },
  meridiemBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  hintText: { fontSize: 10, marginTop: 6 },
  editWarn: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, borderWidth: 1, borderRadius: 10, padding: 10 },
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
    maxHeight: '88%',
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
