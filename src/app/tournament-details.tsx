import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Animated,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GradientContainer } from '@/components/gradient-container';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTournamentStore, useMatchStore } from '@/store/app-store';
import { hasTournamentStarted } from '@/store/tournament-store';
import { durableImages } from '@/utils/persist-image';
import { getMascotImage } from '@/constants/mascots';
import { LinearGradient } from 'expo-linear-gradient';
import { formatRegistrationCountdown } from '@/store/tournament-store';

/**
 * All seven fit on one row without scrolling, so nothing is hidden off-screen.
 * "Live Matches" is shortened to "Live" to buy the room.
 *
 * Standings is disabled until the bracket produces results — with no fixtures
 * played there is nothing to rank, and it sits last for the same reason.
 */
/** A small visual anchor per sport, in place of a per-team crest we don't store. */
const TEAM_BADGE: Record<string, string> = {
  Football: '⚽', Cricket: '🏏', Tennis: '🎾', Basketball: '🏀', Volleyball: '🏐',
};

const REG_TINT: Record<string, string> = {
  pending: '#E08A3C', confirmed: '#10B981', rejected: '#EF4444',
};

/**
 * Fixtures and Live are inert until play begins: before then there is no
 * schedule to read and no score to follow, so opening them shows an empty
 * shell that looks broken rather than early.
 */
/**
 * Temporarily opens Fixtures and Live regardless of tournament status, so they
 * can be exercised before a tournament is under way.
 *
 * Set back to `false` to restore the real gate: those tabs are empty shells
 * until play begins, which reads as broken rather than early.
 */
const ALWAYS_SHOW_MATCH_TABS = true;

function tabsFor(started: boolean): { key: string; label: string; disabled?: boolean }[] {
  const matchTabsOpen = started || ALWAYS_SHOW_MATCH_TABS;
  return [
    { key: 'Overview', label: 'Overview' },
    { key: 'Teams', label: 'Teams' },
    { key: 'Fixtures', label: 'Fixtures', disabled: !matchTabsOpen },
    { key: 'Live Matches', label: 'Live', disabled: !matchTabsOpen },
    { key: 'Sponsors', label: 'Sponsors' },
    { key: 'Media', label: 'Media' },
    { key: 'Standings', label: 'Standings', disabled: true },
  ];
}

export default function TournamentDetailsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();

  // Selected Tab State
  const [activeTab, setActiveTab] = useState('Overview');
  const [bannerFailed, setBannerFailed] = useState(false);
  /** Which team's squad is open; one at a time keeps the list scannable. */
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

  // Custom Toast State
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


  // Mock Info based on params or default
  /**
   * The real record, looked up by id. This screen previously rendered purely
   * from nav params with hard-coded metrics ("12/16 teams", "32 matches"),
   * so a freshly published cup with zero teams still advertised a full draw.
   * Params remain the fallback for links that predate the store.
   */
  const { publishedTournaments, registrations } = useTournamentStore();
  const { matches } = useMatchStore();
  const tournament = useMemo(
    () => (publishedTournaments || []).find((t: any) => t.id === params.id),
    [publishedTournaments, params.id]
  );

  const tournamentName = tournament?.name || (params.name as string) || 'London Cup 2026';
  const tournamentSport = tournament?.sport || (params.sport as string) || 'Football';
  const tournamentPrize =
    tournament?.prizePoolAmount
      ? `₹${Number(tournament.prizePoolAmount).toLocaleString('en-IN')}`
      : tournament?.prizePool || (params.prize as string) || '₹2,500';

  /** Registrations attached to this tournament, newest first. */
  const registeredTeams = useMemo(
    () => (registrations || []).filter((r: any) => r.tournamentId === params.id),
    [registrations, params.id]
  );

  // Prefer the actual registration count over the denormalised counter, which
  // can drift if a write fails midway.
  const venueName = tournament?.location?.trim() || (params.location as string) || 'Venue to be confirmed';
  const venueAddress = tournament?.venueAddress?.trim() || '';
  const organizerName = tournament?.organizerName?.trim() || 'Tournament organiser';
  const organizerContact = tournament?.organizerContact?.trim() || '';

  /** Registration deadline, computed rather than the fixed string that was here. */
  const regCountdown = formatRegistrationCountdown(tournament?.regEnd);

  const openVenueInMaps = () => {
    const query = encodeURIComponent([venueName, venueAddress].filter(Boolean).join(', '));
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`).catch(() =>
      triggerToast('Could not open maps')
    );
  };

  /** The draw held on the tournament record; the planner writes it there. */
  const tournamentFixtures = Array.isArray(tournament?.fixtures) ? tournament!.fixtures! : [];

  /** Fixtures grouped by round, in the order the rounds are played. */
  const fixtureRounds = useMemo(() => {
    const groups = new Map<string, any[]>();
    for (const f of tournamentFixtures as any[]) {
      const key = f.round || 'Fixtures';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(f);
    }
    return [...groups.entries()];
  }, [tournamentFixtures]);

  const started = hasTournamentStarted(tournament?.status);

  /**
   * Sponsors the organiser uploaded, falling back to the sample set so the
   * strip is never an empty band. Normalised to one shape so the strip and the
   * Sponsors tab render from a single list.
   */
  /**
   * Sponsors the organiser uploaded. The four samples that used to fill this
   * when empty appeared on every tournament, implying endorsements that were
   * never given.
   */
  const sponsors = useMemo(
    () =>
      (Array.isArray(tournament?.sponsors) ? tournament!.sponsors! : [])
        .filter((sp: any) => sp?.logo)
        .map((sp: any) => ({
          name: sp.name?.trim() || 'Sponsor',
          type: sp.tier?.trim() || 'Partner',
          logo: { uri: sp.logo } as any,
        })),
    [tournament]
  );

  /**
   * Live matches belonging to this tournament, newest first, capped at two for
   * the Overview strip. Scoped by `tournamentId` rather than by
   * `matchType === 'Tournament'`, which would surface another cup's matches.
   */
  const liveMatches = useMemo(
    () =>
      (matches || [])
        .filter((m: any) => m.status === 'live' && m.tournamentId === params.id)
        .sort(
          (a: any, b: any) =>
            new Date(b.startedAt || b.createdAt).getTime() -
            new Date(a.startedAt || a.createdAt).getTime()
        ),
    [matches, params.id]
  );

  const tournamentRules: string[] = Array.isArray(tournament?.rules) ? tournament!.rules! : [];
  // Only photos that can still render; see utils/persist-image.ts.
  const tournamentMedia: string[] = durableImages(tournament?.mediaImages);

  const teamsCount = registeredTeams.length || tournament?.teamsCount || 0;
  const maxTeams = tournament?.maxTeams ?? 16;

  /**
   * A knockout of N teams plays N-1 matches; a round-robin plays N*(N-1)/2.
   * With no teams yet there are no matches — which is the honest answer, and
   * what the hard-coded 32 was hiding.
   */
  const matchCount = useMemo(() => {
    if (teamsCount < 2) return 0;
    return (tournament?.type || '').toLowerCase().includes('league')
      ? (teamsCount * (teamsCount - 1)) / 2
      : teamsCount - 1;
  }, [teamsCount, tournament]);

  // Sub-renders for each tab
  const renderOverview = () => (
    <View style={styles.tabContent}>
      {/* Real venue, from the tournament record. This showed a fixed
          "Elms Field Ground A, Elms Road, London SE1" for every tournament,
          and the directions link only raised a toast. */}
      <ThemedText style={styles.sectionHeader}>Ground Directions</ThemedText>
      <View style={[styles.infoCard, { backgroundColor: theme.surfaceLow }]}>
        <Ionicons name="map-outline" size={20} color={theme.primary} />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <ThemedText style={[styles.infoTitle, { color: theme.text }]} numberOfLines={2}>
            {venueName}
          </ThemedText>
          {!!venueAddress && (
            <ThemedText style={[styles.infoLine, { color: theme.textSecondary }]} numberOfLines={3}>
              {venueAddress}
            </ThemedText>
          )}
          <Pressable
            style={styles.directionLink}
            onPress={openVenueInMaps}
            accessibilityRole="button"
            accessibilityLabel={`Get directions to ${venueName}`}
          >
            <ThemedText style={[styles.linkText, { color: theme.secondaryContainer }]}>
              GET DIRECTIONS
            </ThemedText>
            <Ionicons name="chevron-forward" size={12} color={theme.secondaryContainer} />
          </Pressable>
        </View>
      </View>

      <ThemedText style={[styles.sectionHeader, { marginTop: Spacing.lg }]}>Tournament Rules</ThemedText>
      {/* The rules the organizer actually ticked when publishing. */}
      <View style={[styles.rulesList, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
        {(tournamentRules.length > 0 ? tournamentRules : ['No specific rules have been published for this tournament.']).map((rule, idx) => (
          <View key={idx} style={styles.ruleItem}>
            <Ionicons name="checkmark-circle" size={16} color={theme.secondaryContainer} style={{ marginRight: 8, marginTop: 2 }} />
            <ThemedText style={[styles.infoLine, { color: theme.text, flex: 1 }]}>{rule}</ThemedText>
          </View>
        ))}
      </View>

      {/* The organiser who published this tournament, not a fixed
          "Apex Sports Club / +44 20 7946 0958". */}
      <ThemedText style={[styles.sectionHeader, { marginTop: Spacing.lg }]}>Organizer Contacts</ThemedText>
      <View style={[styles.infoCard, { backgroundColor: theme.surfaceLow }]}>
        <Ionicons name="call-outline" size={20} color={theme.primary} />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <ThemedText style={[styles.infoTitle, { color: theme.text }]} numberOfLines={2}>
            {organizerName}
          </ThemedText>
          {organizerContact ? (
            <Pressable
              onPress={() => Linking.openURL(`tel:${organizerContact.replace(/\s/g, '')}`)}
              accessibilityRole="button"
              accessibilityLabel={`Call ${organizerName}`}
            >
              <ThemedText style={[styles.infoLine, { color: theme.secondaryContainer }]}>
                {organizerContact}
              </ThemedText>
            </Pressable>
          ) : (
            <ThemedText style={[styles.infoLine, { color: theme.textSecondary }]}>
              No contact number published
            </ThemedText>
          )}
        </View>
      </View>

      {/* Live now — only once play has begun, and only this tournament's
          matches. Capped at two; the Live tab carries the rest. */}
      {(started || ALWAYS_SHOW_MATCH_TABS) && (
        <>
          <View style={[styles.rowBetween, { marginTop: Spacing.lg, alignItems: 'center' }]}>
            <ThemedText style={styles.sectionHeader}>Live Now</ThemedText>
            {liveMatches.length > 2 && (
              <Pressable onPress={() => setActiveTab('Live Matches')} accessibilityRole="button">
                <ThemedText type="labelSm" style={{ color: theme.primary }}>
                  View all {liveMatches.length} ›
                </ThemedText>
              </Pressable>
            )}
          </View>

          {liveMatches.length === 0 ? (
            <View style={[styles.infoCard, { backgroundColor: theme.surfaceLow }]}>
              <Ionicons name="radio-outline" size={20} color={theme.textSecondary} />
              <ThemedText type="bodySm" style={{ color: theme.textSecondary, marginLeft: 12, flex: 1 }}>
                No matches are being scored right now. Live scores appear here as soon as a
                fixture starts.
              </ThemedText>
            </View>
          ) : (
            liveMatches.slice(0, 2).map((m: any) => (
              <Pressable
                key={m.id}
                onPress={() => setActiveTab('Live Matches')}
                accessibilityRole="button"
                accessibilityLabel={`Live: ${m.homeTeam?.name || 'Home'} versus ${m.awayTeam?.name || 'Away'}`}
                style={({ pressed }) => [
                  styles.liveMiniCard,
                  {
                    backgroundColor: theme.surfaceLowest,
                    borderColor: theme.outlineVariant + '33',
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <View style={styles.liveMiniHeader}>
                  <View style={styles.liveDotRow}>
                    <View style={styles.liveDot} />
                    <ThemedText style={styles.liveMiniLabel}>LIVE</ThemedText>
                  </View>
                  {!!m.venueName && (
                    <ThemedText
                      type="labelSm"
                      numberOfLines={1}
                      style={{ color: theme.textSecondary, fontSize: 10, flexShrink: 1 }}
                    >
                      {m.venueName}
                    </ThemedText>
                  )}
                </View>

                <View style={styles.liveMiniScoreRow}>
                  <ThemedText type="bodySm" numberOfLines={1} style={{ color: theme.text, flex: 1 }}>
                    {m.homeTeam?.name || 'Home'}
                  </ThemedText>
                  <ThemedText type="bodyLg" style={{ color: theme.text, fontFamily: 'Sora_500Medium' }}>
                    {m.homeScore} - {m.awayScore}
                  </ThemedText>
                  <ThemedText
                    type="bodySm"
                    numberOfLines={1}
                    style={{ color: theme.text, flex: 1, textAlign: 'right' }}
                  >
                    {m.awayTeam?.name || 'Away'}
                  </ThemedText>
                </View>
              </Pressable>
            ))
          )}
        </>
      )}

      {/* Sponsors strip — fills the space below the fold and gives sponsors
          visibility on the tab everyone lands on, not one they must find. */}
      {sponsors.length > 0 && (
      <>
      <View style={[styles.rowBetween, { marginTop: Spacing.lg, alignItems: 'center' }]}>
        <ThemedText style={styles.sectionHeader}>Sponsors</ThemedText>
        <Pressable onPress={() => setActiveTab('Sponsors')} accessibilityRole="button">
          <ThemedText type="labelSm" style={{ color: theme.primary }}>View all ›</ThemedText>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sponsorStrip}
      >
        {sponsors.map((sp, idx) => (
          <View
            key={idx}
            style={[
              styles.sponsorStripCard,
              { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' },
            ]}
          >
            <Image source={sp.logo} style={styles.sponsorStripLogo} contentFit="contain" />
            <ThemedText type="labelSm" numberOfLines={1} style={{ color: theme.text, fontSize: 10.5 }}>
              {sp.name}
            </ThemedText>
            <ThemedText type="labelSm" numberOfLines={1} style={{ color: theme.textSecondary, fontSize: 9 }}>
              {sp.type}
            </ThemedText>
          </View>
        ))}
      </ScrollView>
      </>
      )}
    </View>
  );

  /**
   * Registered teams as a list rather than a grid, one per row, each opening
   * its squad. The grid showed a crest and a name in a tile with nowhere to go.
   */
  const renderTeams = () => (
    <View style={styles.tabContent}>
      <ThemedText style={styles.sectionHeader}>
        Registered Teams ({teamsCount})
      </ThemedText>

      {registeredTeams.length === 0 ? (
        <View style={[styles.emptyTeams, { borderColor: theme.outlineVariant + '55' }]}>
          <Ionicons name="people-outline" size={22} color={theme.textSecondary} />
          <ThemedText type="bodySm" style={{ color: theme.textSecondary, textAlign: 'center' }}>
            No teams have registered yet.
          </ThemedText>
          <ThemedText type="labelSm" style={{ color: theme.textSecondary, textAlign: 'center', fontSize: 10 }}>
            Registrations will appear here as soon as a team signs up.
          </ThemedText>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {registeredTeams.map((reg: any) => {
            const open = expandedTeamId === reg.id;
            const squad = Array.isArray(reg.squad) ? reg.squad : [];
            return (
              <View
                key={reg.id}
                style={[styles.teamRow, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}
              >
                <Pressable
                  onPress={() => setExpandedTeamId(open ? null : reg.id)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: open }}
                  accessibilityLabel={`${reg.teamName} squad`}
                  style={styles.teamRowHead}
                >
                  {reg.teamMascot ? (
                    <Image source={getMascotImage(reg.teamMascot)} style={styles.teamCrest} contentFit="contain" />
                  ) : (
                    <ThemedText style={styles.teamLogo}>{TEAM_BADGE[reg.sport] || '🏅'}</ThemedText>
                  )}

                  <View style={{ flex: 1, minWidth: 0 }}>
                    <ThemedText style={[styles.infoTitle, { color: theme.text }]} numberOfLines={1}>
                      {reg.teamName}
                    </ThemedText>
                    <ThemedText style={[styles.infoLine, { color: theme.textSecondary }]} numberOfLines={1}>
                      {squad.length > 0 ? `${squad.length} players` : 'Squad not submitted'}
                      {reg.registeredAt ? ` · joined ${new Date(reg.registeredAt).toLocaleDateString()}` : ''}
                    </ThemedText>
                  </View>

                  <View style={[styles.regStatusPill, { backgroundColor: (REG_TINT[reg.status] || '#6B7280') + '1F' }]}>
                    <ThemedText type="labelSm" style={{ color: REG_TINT[reg.status] || '#6B7280', fontSize: 9 }}>
                      {reg.status === 'pending' ? 'Awaiting' : reg.status === 'confirmed' ? 'Confirmed' : 'Rejected'}
                    </ThemedText>
                  </View>

                  <Ionicons
                    name={open ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={theme.textSecondary}
                  />
                </Pressable>

                {open && (
                  <View style={[styles.squadPanel, { borderTopColor: theme.outlineVariant + '33' }]}>
                    {squad.length === 0 ? (
                      <ThemedText style={[styles.infoLine, { color: theme.textSecondary }]}>
                        This team has not submitted a squad yet.
                      </ThemedText>
                    ) : (
                      squad.map((pl: any, i: number) => (
                        <View key={pl.id || i} style={styles.squadRow}>
                          <View style={[styles.squadNo, { backgroundColor: theme.primary + '14' }]}>
                            <ThemedText style={[styles.linkText, { color: theme.primary }]}>
                              {pl.jersey || i + 1}
                            </ThemedText>
                          </View>
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <ThemedText style={[styles.infoTitle, { color: theme.text }]} numberOfLines={1}>
                              {pl.name || `Player ${i + 1}`}
                            </ThemedText>
                            {!!pl.phone && (
                              <ThemedText style={[styles.infoLine, { color: theme.textSecondary }]} numberOfLines={1}>
                                {pl.phone}
                              </ThemedText>
                            )}
                          </View>
                          {!!(pl.role || pl.position) && (
                            <ThemedText style={[styles.infoLine, { color: theme.textSecondary, marginTop: 0 }]}>
                              {pl.role || pl.position}
                            </ThemedText>
                          )}
                        </View>
                      ))
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );

  /**
   * Fixtures for this tournament.
   *
   * Three mock matches ("Red Devils FC vs Blue Tigers, Pitch A, June 15") used
   * to render here regardless, so a tournament with no schedule still showed a
   * full day's play.
   */
  const renderFixtures = () => (
    <View style={styles.tabContent}>
      <View style={styles.rowBetween}>
        <ThemedText style={styles.sectionHeader}>Upcoming Fixtures</ThemedText>
        <Pressable
          style={[styles.manageBtn, { backgroundColor: theme.primary }]}
          onPress={() => router.push({ pathname: '/fixture-management', params: { tournamentId: String(params.id || '') } })}
          accessibilityRole="button"
        >
          <ThemedText type="labelSm" style={{ color: '#ffffff' }}>Open Fixtures Planner</ThemedText>
        </Pressable>
      </View>

      {tournamentFixtures.length === 0 ? (
        <View style={[styles.infoCard, { backgroundColor: theme.surfaceLow, marginTop: Spacing.sm }]}>
          <Ionicons name="calendar-outline" size={20} color={theme.textSecondary} />
          <ThemedText style={[styles.infoLine, { color: theme.textSecondary, marginLeft: 12, flex: 1 }]}>
            No fixtures have been scheduled yet. They are drawn automatically once
            registration fills, or you can build them in the planner.
          </ThemedText>
        </View>
      ) : (
        <View style={{ marginTop: Spacing.sm }}>
          {/* Grouped by round so the path to the final is legible — every
              fixture previously sat in one flat list labelled "Round 1". */}
          {fixtureRounds.map(([round, matches]) => (
            <View key={round} style={{ marginBottom: 16 }}>
              <View style={styles.roundHeaderRow}>
                <View style={[styles.roundDot, { backgroundColor: theme.primary }]} />
                <ThemedText style={[styles.linkText, { color: theme.primary }]}>
                  {round.toUpperCase()}
                </ThemedText>
                <View style={[styles.roundRule, { backgroundColor: theme.outlineVariant + '44' }]} />
                <ThemedText style={[styles.infoLine, { color: theme.textSecondary, marginTop: 0 }]}>
                  {matches.length} {matches.length === 1 ? 'match' : 'matches'}
                </ThemedText>
              </View>

              <View style={{ gap: 10 }}>
          {matches.map((f: any) => (
            <View
              key={f.id}
              style={[styles.fixtureRow, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <ThemedText style={[styles.infoTitle, { color: theme.text }]} numberOfLines={1}>
                  {f.teamA} <ThemedText style={{ color: theme.textSecondary }}>v</ThemedText> {f.teamB}
                </ThemedText>
                <ThemedText style={[styles.infoLine, { color: theme.textSecondary }]} numberOfLines={1}>
                  {[f.matchNo, f.pitch, f.time].filter(Boolean).join(' · ')}
                </ThemedText>
              </View>
              <View style={[styles.fixtureStatus, { backgroundColor: theme.primary + '14' }]}>
                <ThemedText style={[styles.linkText, { color: theme.primary }]}>{f.status}</ThemedText>
              </View>
            </View>
          ))}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderStandings = () => (
    <View style={styles.tabContent}>
      <ThemedText type="headlineSm" style={styles.sectionHeader}>Group A Point Table</ThemedText>
      <View style={[styles.tableContainer, { borderColor: theme.outlineVariant + '33' }]}>
        {/* Table Header */}
        <View style={[styles.tableRow, styles.tableHeaderRow, { backgroundColor: theme.surfaceLow }]}>
          <ThemedText type="labelSm" style={[styles.colName, { fontWeight: '500', color: theme.text }]}>TEAM</ThemedText>
          <ThemedText type="labelSm" style={[styles.colVal, { fontWeight: '500', color: theme.text }]}>P</ThemedText>
          <ThemedText type="labelSm" style={[styles.colVal, { fontWeight: '500', color: theme.text }]}>W</ThemedText>
          <ThemedText type="labelSm" style={[styles.colVal, { fontWeight: '500', color: theme.text }]}>L</ThemedText>
          <ThemedText type="labelSm" style={[styles.colVal, { fontWeight: '500', color: theme.text }]}>PTS</ThemedText>
          <ThemedText type="labelSm" style={[styles.colVal, { fontWeight: '500', color: theme.text, width: 50 }]}>NRR</ThemedText>
        </View>
        {/* Table Rows */}
        {[
          { name: 'Red Devils FC', p: 3, w: 3, l: 0, pts: 9, nrr: '+1.45' },
          { name: 'Apex Warriors', p: 3, w: 2, l: 1, pts: 6, nrr: '+0.88' },
          { name: 'Blue Tigers', p: 3, w: 1, l: 2, pts: 3, nrr: '-0.32' },
          { name: 'Strikers City', p: 3, w: 0, l: 3, pts: 0, nrr: '-1.89' },
        ].map((row, idx) => (
          <View key={idx} style={[styles.tableRow, { borderBottomColor: theme.outlineVariant + '22' }]}>
            <ThemedText type="bodySm" numberOfLines={1} style={[styles.colName, { color: theme.text, fontWeight: '500' }]}>{row.name}</ThemedText>
            <ThemedText type="bodySm" style={[styles.colVal, { color: theme.text }]}>{row.p}</ThemedText>
            <ThemedText type="bodySm" style={[styles.colVal, { color: theme.text }]}>{row.w}</ThemedText>
            <ThemedText type="bodySm" style={[styles.colVal, { color: theme.text }]}>{row.l}</ThemedText>
            <ThemedText type="bodySm" style={[styles.colVal, { color: theme.text, fontWeight: '500' }]}>{row.pts}</ThemedText>
            <ThemedText type="bodySm" style={[styles.colVal, { color: row.nrr.startsWith('+') ? '#0f9f58' : '#ba1a1a', width: 50 }]}>{row.nrr}</ThemedText>
          </View>
        ))}
      </View>
    </View>
  );

  /**
   * Live scores for this tournament.
   *
   * A fixed scoreboard ("Apex Warriors 164/4 vs Titans CC, Pitch A") was drawn
   * here whether or not any match existed. Real matches are scoped by
   * `tournamentId`; until a match carries one, this is honestly empty.
   */
  const renderLiveMatches = () => (
    <View style={styles.tabContent}>
      <ThemedText style={styles.sectionHeader}>Live Matches</ThemedText>

      {liveMatches.length === 0 ? (
        <View style={[styles.infoCard, { backgroundColor: theme.surfaceLow }]}>
          <Ionicons name="radio-outline" size={20} color={theme.textSecondary} />
          <ThemedText style={[styles.infoLine, { color: theme.textSecondary, marginLeft: 12, flex: 1 }]}>
            No match is being scored right now. Live scores appear here the moment
            a fixture kicks off.
          </ThemedText>
        </View>
      ) : (
        liveMatches.map((m: any) => (
          <Pressable
            key={m.id}
            onPress={() => router.push({ pathname: '/scoring', params: { matchId: m.id } })}
            accessibilityRole="button"
            accessibilityLabel={`Open live scoring for ${m.homeTeam?.name || 'home'} versus ${m.awayTeam?.name || 'away'}`}
            style={({ pressed }) => [
              styles.liveMiniCard,
              {
                backgroundColor: theme.surfaceLowest,
                borderColor: theme.outlineVariant + '33',
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <View style={styles.liveMiniHeader}>
              <View style={styles.liveDotRow}>
                <View style={styles.liveDot} />
                <ThemedText style={styles.liveMiniLabel}>LIVE</ThemedText>
              </View>
              {!!m.venueName && (
                <ThemedText
                  numberOfLines={1}
                  style={[styles.infoLine, { color: theme.textSecondary, flexShrink: 1, marginTop: 0 }]}
                >
                  {m.venueName}
                </ThemedText>
              )}
            </View>

            <View style={styles.liveMiniScoreRow}>
              <ThemedText numberOfLines={1} style={[styles.infoTitle, { color: theme.text, flex: 1 }]}>
                {m.homeTeam?.name || 'Home'}
              </ThemedText>
              <ThemedText style={[styles.infoTitle, { color: theme.text }]}>
                {m.homeScore} - {m.awayScore}
              </ThemedText>
              <ThemedText
                numberOfLines={1}
                style={[styles.infoTitle, { color: theme.text, flex: 1, textAlign: 'right' }]}
              >
                {m.awayTeam?.name || 'Away'}
              </ThemedText>
            </View>
          </Pressable>
        ))
      )}
    </View>
  );

  const renderStats = () => (
    <View style={styles.tabContent}>
      <ThemedText type="headlineSm" style={styles.sectionHeader}>Top Players (MVP Rankings)</ThemedText>
      <View style={styles.statsList}>
        {[
          { rank: 1, name: 'Marcus Rashford', team: 'Red Devils FC', value: '8 Goals', rating: '9.2' },
          { rank: 2, name: 'Harry Kane', team: 'London United', value: '6 Goals', rating: '8.7' },
          { rank: 3, name: 'Bruno Fernandes', team: 'Red Devils FC', value: '4 Assists', rating: '8.5' },
          { rank: 4, name: 'Alex Smith', team: 'Apex Warriors', value: '3 Goals', rating: '8.1' },
        ].map((p, idx) => (
          <View key={idx} style={[styles.statRowCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
            <View style={{ flex: 1 }}>
              <ThemedText type="bodySm" numberOfLines={1} style={{ fontWeight: '500', color: theme.text }}>{p.name}</ThemedText>
              <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: 10 }}>{p.team}</ThemedText>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <ThemedText type="bodySm" style={{ fontWeight: '500', color: theme.secondaryContainer }}>{p.value}</ThemedText>
              <ThemedText type="labelSm" style={{ color: '#0f9f58', fontSize: 10 }}>Rating: {p.rating}</ThemedText>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  /**
   * Sponsors, led by the headline partner.
   *
   * A flat four-up grid gave a ground sponsor the same weight as the title
   * sponsor, which is the one thing a sponsor page has to get right. The first
   * uploaded sponsor is treated as the headline and gets a full-width card;
   * the rest sit beneath it as a supporting row.
   */
  /**
   * Sponsors, presented as a partner wall rather than a flat logo grid.
   *
   * The headline partner gets a gradient plaque — its logo on a white card so
   * the artwork reads cleanly against the colour — with the tier on a ribbon.
   * Everyone else appears as a numbered row, which keeps the hierarchy legible
   * when a tournament has one big name and several smaller ones.
   */
  const renderSponsors = () => {
    return (
      <View style={styles.tabContent}>
        <View style={styles.rowBetween}>
          <ThemedText style={styles.sectionHeader}>Event Sponsors</ThemedText>
          {sponsors.length > 0 && (
            <ThemedText style={[styles.infoLine, { color: theme.textSecondary, marginTop: 0 }]}>
              {sponsors.length} {sponsors.length === 1 ? 'partner' : 'partners'}
            </ThemedText>
          )}
        </View>

        {sponsors.length === 0 ? (
          <View style={[styles.infoCard, { backgroundColor: theme.surfaceLow }]}>
            <Ionicons name="ribbon-outline" size={20} color={theme.textSecondary} />
            <ThemedText style={[styles.infoLine, { color: theme.textSecondary, marginLeft: 12, flex: 1 }]}>
              No sponsors have been added for this tournament yet.
            </ThemedText>
          </View>
        ) : (
          <>
            {/* One sponsor per row. The gradient hero gave the first sponsor a
                half-width plaque, which stretched portrait artwork oddly and
                made the tab read as one big advert rather than a partner list. */}
            <View style={{ gap: 10 }}>
              {sponsors.map((sp, idx) => {
                const isHeadline = idx === 0;
                return (
                  <View
                    key={idx}
                    style={[
                      styles.sponsorPartnerRow,
                      {
                        backgroundColor: theme.surfaceLowest,
                        borderColor: isHeadline ? theme.primary + '55' : theme.outlineVariant + '33',
                        borderWidth: isHeadline ? 1.5 : 1,
                      },
                    ]}
                  >
                    <View style={[styles.sponsorPartnerLogoWrap, { borderColor: theme.outlineVariant + '33' }]}>
                      <Image source={sp.logo} style={styles.sponsorPartnerLogo} contentFit="contain" />
                    </View>

                    <View style={{ flex: 1, minWidth: 0 }}>
                      <ThemedText style={[styles.infoTitle, { color: theme.text }]} numberOfLines={1}>
                        {sp.name}
                      </ThemedText>
                      <View
                        style={[
                          styles.sponsorTierChip,
                          { backgroundColor: isHeadline ? theme.primary + '1F' : theme.outlineVariant + '22' },
                        ]}
                      >
                        {isHeadline && <Ionicons name="star" size={9} color={theme.primary} />}
                        <ThemedText
                          style={[styles.linkText, { color: isHeadline ? theme.primary : theme.textSecondary }]}
                          numberOfLines={1}
                        >
                          {sp.type}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

          </>
        )}
      </View>
    );
  };

  const renderMedia = () => (
    <View style={styles.tabContent}>
      <ThemedText type="headlineSm" style={styles.sectionHeader}>Highlights & Photos</ThemedText>
      {/* Photos the organizer uploaded at publish time. */}
      {tournamentMedia.length === 0 ? (
        <View style={[styles.emptyTeams, { borderColor: theme.outlineVariant + '55' }]}>
          <Ionicons name="images-outline" size={22} color={theme.textSecondary} />
          <ThemedText type="bodySm" style={{ color: theme.textSecondary, textAlign: 'center' }}>
            No photos yet.
          </ThemedText>
          <ThemedText type="labelSm" style={{ color: theme.textSecondary, textAlign: 'center', fontSize: 10 }}>
            The organizer can add match photos from the tournament editor.
          </ThemedText>
        </View>
      ) : (
        <View style={styles.mediaGrid}>
          {tournamentMedia.map((uri, idx) => (
            <Pressable key={`${uri}-${idx}`} style={styles.mediaFrame} onPress={() => triggerToast('Opening full-screen photo...')}>
              <Image source={{ uri }} style={styles.mediaImage} contentFit="cover" />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'Overview': return renderOverview();
      case 'Teams': return renderTeams();
      case 'Fixtures': return renderFixtures();
      case 'Standings': return renderStandings();
      case 'Live Matches': return renderLiveMatches();
      case 'Stats': return renderStats();
      case 'Sponsors': return renderSponsors();
      case 'Media': return renderMedia();
      default: return null;
    }
  };

  return (
    <GradientContainer screenName="tournament-details" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Detail Header Navigation */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/tournaments')}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </Pressable>
          <ThemedText type="headlineMd" numberOfLines={1} style={{ color: theme.text, flex: 1, marginLeft: 12 }}>
            {tournamentName}
          </ThemedText>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Banner with Registration Countdown */}
          <View style={styles.bannerContainer}>
            <Image 
              source={require('@/assets/images/illustrations/tournament_cover.png')} 
              style={styles.bannerImage} 
              contentFit="cover" 
              onError={() => setBannerFailed(true)}
            />
            <View style={styles.gradientOverlay} />
            {/* Computed from the tournament's own registration deadline. This
                printed a fixed "02d : 14h : 45m" for every tournament, which
                looked live while counting to a date that did not exist. */}
            {!!regCountdown && (
              <View style={styles.countdownBadge}>
                <Ionicons name="hourglass-outline" size={14} color="#ffffff" style={{ marginRight: 6 }} />
                <ThemedText style={styles.countdownText}>
                  {regCountdown === 'Registration closed'
                    ? regCountdown
                    : `Reg Ends In: ${regCountdown}`}
                </ThemedText>
              </View>
            )}
          </View>

          {/* Quick Metrics Statistics Grid */}
          <View style={styles.metricsGrid}>
            <View style={[styles.metricCard, { backgroundColor: theme.surfaceLow }]}>
              <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Teams</ThemedText>
              <ThemedText type="headlineMd" numberOfLines={1} style={{ color: theme.text }}>{teamsCount}/{maxTeams}</ThemedText>
            </View>
            <View style={[styles.metricCard, { backgroundColor: theme.surfaceLow }]}>
              <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Prize</ThemedText>
              <ThemedText type="headlineMd" numberOfLines={1} adjustsFontSizeToFit style={{ color: theme.secondaryContainer, textAlign: 'center' }}>{tournamentPrize}</ThemedText>
            </View>
            <View style={[styles.metricCard, { backgroundColor: theme.surfaceLow }]}>
              <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Matches</ThemedText>
              <ThemedText type="headlineMd" numberOfLines={1} style={{ color: theme.text }}>{matchCount}</ThemedText>
            </View>
          </View>

          {/* Segmented Tab Bar — every tab visible, no horizontal scroll */}
          <View style={styles.tabsSection}>
            <View style={styles.tabsRow}>
              {tabsFor(started).map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <Pressable
                     key={tab.key}
                     disabled={tab.disabled}
                     accessibilityState={{ disabled: !!tab.disabled, selected: isActive }}
                     onPress={() => { if (!tab.disabled) setActiveTab(tab.key); }}
                     style={[
                       styles.tabPill,
                       isActive && { backgroundColor: theme.primary },
                       tab.disabled && { opacity: 0.4 },
                     ]}
                  >
                    <ThemedText
                      numberOfLines={1}
                      style={{
                        fontSize: 10,
                        textAlign: 'center',
                        fontFamily: isActive ? 'Sora_600SemiBold' : 'Sora_500Medium',
                        color: isActive ? '#ffffff' : theme.textSecondary,
                      }}
                    >
                      {tab.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Tab Sub-View Render */}
          {renderActiveTabContent()}
        </ScrollView>

        {/* Floating Call to Action Register Button */}
        <View style={[styles.ctaFooter, { backgroundColor: theme.surfaceLowest, borderTopColor: theme.outlineVariant + '33' }]}>
          <Pressable 
            style={[styles.registerCtaBtn, { backgroundColor: theme.secondaryContainer }]}
            onPress={() => router.push({
              pathname: '/team-registration',
              params: { id: params.id || 't1', name: tournamentName }
            })}
          >
            <Ionicons name="medal" size={20} color="#ffffff" style={{ marginRight: 8 }} />
            <ThemedText type="labelMd" style={{ color: '#ffffff', fontWeight: '500' }}>Register Team Now</ThemedText>
          </Pressable>
        </View>
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
  iconBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  bannerContainer: {
    height: 180,
    width: '100%',
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(5, 21, 30, 0.4)',
  },
  countdownBadge: {
    position: 'absolute',
    bottom: 12,
    left: Spacing.containerMargin,
    backgroundColor: 'rgba(186, 26, 26, 0.85)', // Vibrant error-like red
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.containerMargin,
    marginTop: Spacing.md,
    gap: 8,
  },
  metricCard: {
    flex: 1,
    // minWidth:0 lets a long prize string shrink instead of stretching its
    // card, which is what pushed the three cards out of alignment; the fixed
    // height keeps all three level whatever their content.
    minWidth: 0,
    height: 62,
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabsSection: {
    marginTop: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#0000000a',
    paddingBottom: 8,
  },
  // flex:1 per tab distributes the row evenly; minWidth:0 lets the longer
  // labels shrink rather than forcing the row wider than the screen.
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.sm,
    gap: 2,
  },
  tabPill: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 4,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    paddingHorizontal: Spacing.containerMargin,
    paddingTop: Spacing.md,
    paddingBottom: 40,
  },
  // Matched to components/home/player-dashboard.tsx: Sora Medium/Regular only,
  // nothing above 15.5px, so this screen shares the app's dominant voice.
  sectionHeader: {
    fontSize: 13.5,
    fontFamily: 'Sora_500Medium',
    marginBottom: Spacing.sm,
  },
  countdownText: { color: '#ffffff', fontSize: 11, fontFamily: 'Sora_500Medium' },
  teamCrest: { width: 40, height: 40 },
  teamRow: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  // The logo sits on a white plaque so artwork reads cleanly against the
  // gradient rather than fighting it.
  sponsorPartnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  sponsorPartnerLogoWrap: {
    width: 58,
    height: 58,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  sponsorPartnerLogo: { width: 42, height: 42 },
  sponsorTierChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 4,
  },
  teamRowHead: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  squadPanel: { borderTopWidth: 1, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  squadRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  squadNo: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fixtureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  fixtureStatus: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 },
  roundHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  roundDot: { width: 6, height: 6, borderRadius: 3 },
  roundRule: { flex: 1, height: 1 },
  infoTitle: { fontSize: 13, lineHeight: 18, fontFamily: 'Sora_500Medium' },
  infoLine: { fontSize: 11, lineHeight: 16, fontFamily: 'Sora_400Regular', marginTop: 2 },
  linkText: { fontSize: 10.5, fontFamily: 'Sora_500Medium', letterSpacing: 0.4 },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
  },
  directionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  rulesList: {
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  manageBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  emptyTeams: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingVertical: 28,
    paddingHorizontal: Spacing.base,
    alignItems: 'center',
    gap: 6,
  },
  regStatusPill: { marginTop: 6, paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.full },
  teamsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: Spacing.sm,
  },
  teamCard: {
    width: '48%',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
  },
  teamLogo: {
    fontSize: 32,
  },
  fixturesList: {
    gap: 12,
    marginTop: Spacing.sm,
  },
  fixtureCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
  },
  matchTeamsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
  },
  fixtureTeamName: {
    flex: 1,
    fontWeight: '500',
  },
  fixtureCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: Spacing.xs,
  },
  tableContainer: {
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginTop: Spacing.sm,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  tableHeaderRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#0000000a',
  },
  colName: {
    flex: 2,
  },
  colVal: {
    width: 35,
    textAlign: 'center',
  },
  liveScoreCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  cricketScores: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  versusDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#ffffff33',
    marginHorizontal: 16,
  },
  liveFooterStats: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 8,
  },
  footballScores: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  footballScoreTeam: {
    flex: 1,
  },
  scoreNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
  },
  statsList: {
    gap: 10,
    marginTop: Spacing.sm,
  },
  statRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  liveMiniCard: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 10 },
  liveMiniHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  liveDotRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 0 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#EF4444' },
  liveMiniLabel: { fontSize: 9.5, letterSpacing: 0.6, color: '#EF4444', fontFamily: 'Sora_500Medium' },
  liveMiniScoreRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },

  sponsorStrip: { gap: 10, paddingRight: 16, paddingVertical: 2 },
  sponsorStripCard: {
    width: 104,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 2,
  },
  sponsorStripLogo: { width: 34, height: 34, marginBottom: 4 },

  sponsorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: Spacing.sm,
  },
  sponsorCard: {
    width: '48%',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
  },
  sponsorLogo: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.lg,
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: Spacing.sm,
  },
  mediaFrame: {
    width: '48%',
    height: 100,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(5, 21, 30, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.containerMargin,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
  },
  registerCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: BorderRadius.full,
  },
  toastContainer: {
    position: 'absolute',
    bottom: 90,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: BorderRadius.premium,
    zIndex: 999,
  },
});
