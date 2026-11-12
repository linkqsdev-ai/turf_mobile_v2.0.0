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
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTournamentStore, useMatchStore } from '@/store/app-store';
import {
  hasTournamentStarted,
  registrationBlocker,
  registrationBlockedMessage,
  isLegacyPitch,
  RegistrationBlocker,
} from '@/store/tournament-store';
import { durableImages } from '@/utils/persist-image';
import { getMascotImage } from '@/constants/mascots';
import { formatIsoDate } from '@/constants/tournament';
import { useUserProfile } from '@/hooks/use-user-profile';
import { LinearGradient } from 'expo-linear-gradient';
import {
  DashboardCard,
  DashboardSectionLabel,
  DashboardTabs,
  ProgressPill,
  StatTiles,
} from '@/components/dashboard/analytics-kit';
import { ACCENTS } from '@/constants/dashboard-accents';
import { formatRegistrationCountdown } from '@/store/tournament-store';
import { CashbackOutputCard } from '@/components/cashback-output-card';

/**
 * All seven fit on one row without scrolling, so nothing is hidden off-screen.
 * "Live Matches" is shortened to "Live" to buy the room.
 *
 * Standings and Live are disabled and sit last: Standings until the bracket
 * produces results, Live until live scoring is tied to a tournament's matches.
 */
/** Bracket geometry: vertical room per opening match, card width, connector gap. */
const BRACKET_SLOT = 120;
const BRACKET_CARD_W = 172;
const BRACKET_GAP = 28;

/** What the register button says when a tournament can't take more teams. */
const REG_BLOCK_LABEL: Record<RegistrationBlocker, string> = {
  full: 'Registration Full',
  closed: 'Registration Closed',
  cancelled: 'Tournament Cancelled',
  not_open: 'Registration Not Open',
};

/** A small visual anchor per sport, in place of a per-team crest we don't store. */
const TEAM_BADGE: Record<string, string> = {
  Football: '⚽', Cricket: '🏏', Tennis: '🎾', Basketball: '🏀', Volleyball: '🏐',
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
    { key: 'Sponsors', label: 'Sponsors' },
    { key: 'Media', label: 'Media' },
    { key: 'Standings', label: 'Standings', disabled: true },
    { key: 'Live Matches', label: 'Live', disabled: true },
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
  const { profile } = useUserProfile();
  /** Only a host manages the draw; players read it. */
  const isHost = profile.role === 'Organizer' || profile.role === 'Super Admin';
  const [fixtureView, setFixtureView] = useState<'bracket' | 'list'>('bracket');
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

  /** Why this tournament can't take another team, if it can't. */
  const regBlock = tournament
    ? registrationBlocker(tournament, registeredTeams.filter((r: any) => r.status !== 'rejected').length)
    : null;
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
  /** A live match as a dashboard card; tappable where there is somewhere to go. */
  const renderLiveCard = (m: any, onPress?: () => void) => (
    <DashboardCard
      key={m.id}
      style={{ marginBottom: 10 }}
      title={`${m.homeTeam?.name || 'Home'} vs ${m.awayTeam?.name || 'Away'}`}
      metric={`${m.homeScore ?? 0} – ${m.awayScore ?? 0}`}
      tag="🔴 LIVE"
      icon="radio"
      accent={ACCENTS.red}
      onPress={onPress}
      accessibilityLabel={`Live: ${m.homeTeam?.name || 'Home'} ${m.homeScore ?? 0}, ${m.awayTeam?.name || 'Away'} ${m.awayScore ?? 0}`}
      footer={m.venueName ? { label: 'Venue', value: m.venueName } : undefined}
    />
  );

  const renderNoLive = () => (
    <DashboardCard
      title="No live matches"
      metric="Scores appear as soon as a fixture starts"
      icon="radio-outline"
      accent={ACCENTS.slate}
    />
  );

  /** A footer action in the card's accent, e.g. "Get directions ›". */
  const renderCardLink = (label: string, color: string, onPress: () => void, a11y: string) => (
    <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button" accessibilityLabel={a11y} style={styles.cardLink}>
      <ThemedText style={[styles.cardLinkText, { color }]}>{label}</ThemedText>
      <Ionicons name="chevron-forward" size={12} color={color} />
    </Pressable>
  );

  const renderOverview = () => {
    const hasCashback = Boolean((tournament?.cashbackEnabled ?? (Number(tournament?.cashbackAmount) > 0)) && Number(tournament?.cashbackAmount) > 0);
    const cbAmount = Number(tournament?.cashbackAmount) || 0;
    const cbType = tournament?.cashbackType || 'flat';
    const entryFeeNum = Number(tournament?.entryFee) || 150;
    const calculatedReward = cbType === 'flat' ? cbAmount : Math.min(tournament?.cashbackMaxAmount ? Number(tournament.cashbackMaxAmount) : Infinity, Math.round((entryFeeNum * cbAmount) / 100));

    return (
      <View style={styles.tabContent}>
        {/* Active Cashback Reward Offer */}
        {hasCashback && (
          <View style={{ marginBottom: Spacing.md }}>
            <DashboardSectionLabel label="Cashback Reward" color={ACCENTS.green.main} style={{ marginBottom: Spacing.sm }} />
            <CashbackOutputCard
              sourceTitle={tournament?.name || 'Tournament'}
              cashbackTitle={tournament?.cashbackName || `${tournament?.name || 'Tournament'} Cashback Reward`}
              cashbackCode={tournament?.cashbackCode || 'CUP50'}
              cashbackAmount={cbAmount}
              cashbackType={cbType}
              cashbackMaxAmount={tournament?.cashbackMaxAmount}
              cashbackOneTime={tournament?.cashbackOneTime}
              calculatedReward={calculatedReward}
              variant="compact"
            />
          </View>
        )}

        {/* Real venue, from the tournament record, with working directions. */}
        <DashboardSectionLabel label="Ground Directions" color={ACCENTS.primary.main} style={{ marginBottom: Spacing.sm }} />
        <DashboardCard
          title={venueName}
          titleLines={2}
          metric="Tournament venue"
          icon="map"
          accent={ACCENTS.primary}
          footer={{
            label: 'Opens in',
            value: 'Maps',
            status: renderCardLink('Get directions', theme.primary, openVenueInMaps, `Get directions to ${venueName}`),
          }}
        >
          {!!venueAddress && (
            <ThemedText style={[styles.addressText, { color: theme.textSecondary }]} numberOfLines={3}>
              {venueAddress}
            </ThemedText>
          )}
        </DashboardCard>

      {/* The rules the organizer actually ticked when publishing. */}
      <DashboardSectionLabel label="Tournament Rules" color={ACCENTS.green.main} style={{ marginTop: Spacing.lg, marginBottom: Spacing.sm }} />
      <DashboardCard
        title="Rules & Conditions"
        metric={
          tournamentRules.length > 0
            ? `${tournamentRules.length} ${tournamentRules.length === 1 ? 'rule' : 'rules'} published`
            : 'No rules published yet'
        }
        icon="document-text"
        accent={ACCENTS.green}
      >
        {tournamentRules.length > 0 && (
          <View style={styles.ruleList}>
            {tournamentRules.map((rule, idx) => (
              <View key={idx} style={styles.ruleItem}>
                <Ionicons name="checkmark-circle" size={15} color={ACCENTS.green.main} style={{ marginRight: 8, marginTop: 1 }} />
                <ThemedText style={[styles.infoLine, { color: theme.text, flex: 1, marginTop: 0 }]}>{rule}</ThemedText>
              </View>
            ))}
          </View>
        )}
      </DashboardCard>

      {/* The organiser who published this tournament. */}
      <DashboardSectionLabel label="Organizer Contacts" color={ACCENTS.orange.main} style={{ marginTop: Spacing.lg, marginBottom: Spacing.sm }} />
      <DashboardCard
        title={organizerName}
        metric={organizerContact || 'No contact number published'}
        icon="call"
        accent={ACCENTS.orange}
        footer={
          organizerContact
            ? {
                label: 'Organizer',
                status: renderCardLink(
                  'Call',
                  ACCENTS.orange.dark,
                  () => Linking.openURL(`tel:${organizerContact.replace(/\s/g, '')}`),
                  `Call ${organizerName}`
                ),
              }
            : undefined
        }
      />

      {/* Live now — only this tournament's matches, capped at two. Nothing
          links to the Live tab while it is disabled. */}
      {(started || ALWAYS_SHOW_MATCH_TABS) && (
        <>
          <DashboardSectionLabel label="Live Now" color={ACCENTS.red.main} style={{ marginTop: Spacing.lg, marginBottom: Spacing.sm }} />
          {liveMatches.length === 0 ? renderNoLive() : liveMatches.slice(0, 2).map((m: any) => renderLiveCard(m))}
        </>
      )}

      {/* Sponsors — the same tiles as the Sponsors and Media tabs, first four. */}
      {sponsors.length > 0 && (
        <>
          <DashboardSectionLabel
            label="Sponsors"
            color={ACCENTS.orange.main}
            style={{ marginTop: Spacing.lg, marginBottom: Spacing.sm }}
            right={renderCardLink('View all', theme.primary, () => setActiveTab('Sponsors'), 'View all sponsors')}
          />
          {renderSponsorTiles(sponsors.slice(0, 4))}
        </>
      )}
    </View>
    );
  };

  /**
   * Registered teams as a list rather than a grid, one per row, each opening
   * its squad. The grid showed a crest and a name in a tile with nowhere to go.
   */
  const renderTeams = () => (
    <View style={styles.tabContent}>
      <DashboardSectionLabel label={`Registered Teams (${teamsCount})`} color={ACCENTS.primary.main} style={{ marginBottom: Spacing.sm }} />

      {registeredTeams.length === 0 ? (
        <DashboardCard
          title="No teams yet"
          metric="Registrations appear as soon as a team signs up"
          icon="people-outline"
          accent={ACCENTS.slate}
        />
      ) : (
        <View style={{ gap: 10 }}>
          {registeredTeams.map((reg: any) => {
            const open = expandedTeamId === reg.id;
            const squad = Array.isArray(reg.squad) ? reg.squad : [];
            const accent = reg.status === 'confirmed' ? ACCENTS.green : reg.status === 'rejected' ? ACCENTS.red : ACCENTS.orange;
            const statusTag = reg.status === 'pending' ? '⏳ Awaiting' : reg.status === 'confirmed' ? '✅ Confirmed' : '✖ Rejected';
            return (
              <DashboardCard
                key={reg.id}
                title={reg.teamName}
                metric={squad.length > 0 ? `${squad.length} ${squad.length === 1 ? 'player' : 'players'}` : 'Squad not submitted'}
                tag={statusTag}
                accent={accent}
                leading={
                  reg.teamLogo ? (
                    <Image source={{ uri: reg.teamLogo }} style={[styles.teamCrest, { borderRadius: 10 }]} contentFit="cover" />
                  ) : reg.teamMascot ? (
                    <Image source={getMascotImage(reg.teamMascot)} style={styles.teamCrest} contentFit="contain" />
                  ) : (
                    <ThemedText style={styles.teamLogo}>{TEAM_BADGE[reg.sport] || '🏅'}</ThemedText>
                  )
                }
                trailing={
                  <View style={[styles.chevronTile, { backgroundColor: theme.surfaceLow }]}>
                    <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={theme.textSecondary} />
                  </View>
                }
                onPress={() => setExpandedTeamId(open ? null : reg.id)}
                accessibilityLabel={`${reg.teamName}, ${statusTag.slice(2)}, ${squad.length} players. ${open ? 'Hide' : 'Show'} squad`}
                footer={
                  reg.registeredAt
                    ? { label: 'Joined', value: formatIsoDate(String(reg.registeredAt).slice(0, 10)) }
                    : undefined
                }
              >
                {open && (
                  <View style={[styles.squadList, { borderTopColor: theme.outlineVariant + '1A' }]}>
                    {squad.length === 0 ? (
                      <ThemedText style={[styles.infoLine, { color: theme.textSecondary }]}>
                        This team has not submitted a squad yet.
                      </ThemedText>
                    ) : (
                      squad.map((pl: any, i: number) => (
                        <View key={pl.id || i} style={styles.squadRow}>
                          <View style={[styles.squadNo, { backgroundColor: accent.main + '1A' }]}>
                            <ThemedText style={[styles.linkText, { color: accent.dark }]}>{pl.jersey || i + 1}</ThemedText>
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
              </DashboardCard>
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
  /** A slot the bracket hasn't decided yet — "Winner SF 1", or a bye. */
  const isPendingTeam = (name: string) => /^Winner\s/i.test(String(name)) || name === 'Bye';

  /** Where a match is played: its own venue, or the tournament's for old placeholder pitches. */
  const venueOf = (f: any) => (f.pitch && !isLegacyPitch(f.pitch) ? f.pitch : venueName);

  /**
   * The knockout as a tree: one column per round, each match centred between
   * the two it is fed by, joined by connector lines, ending at the trophy.
   */
  const renderBracketTree = () => {
    const firstCount = Math.max(fixtureRounds[0]?.[1].length || 1, 1);
    const height = firstCount * BRACKET_SLOT;
    const line = theme.outlineVariant + '99';

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: Spacing.sm }} contentContainerStyle={styles.bracketScroll}>
        {fixtureRounds.map(([round, list], col) => {
          const slotH = height / list.length;
          const last = col === fixtureRounds.length - 1;
          return (
            <View key={round} style={{ width: BRACKET_CARD_W + BRACKET_GAP }}>
              <ThemedText style={[styles.bracketRoundTitle, { color: theme.primary }]} numberOfLines={1}>
                {round.toUpperCase()}
              </ThemedText>
              <View style={{ height }}>
                {list.map((f: any, i: number) => (
                  <View key={f.id} style={[styles.bracketSlot, { top: slotH * i, height: slotH }]}>
                    {col > 0 && <View style={[styles.bracketStubIn, { backgroundColor: line }]} />}
                    <View
                      style={[styles.bracketCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '44' }]}
                      accessible
                      accessibilityLabel={`${f.matchNo}: ${f.teamA} versus ${f.teamB}, ${f.date ? formatIsoDate(f.date) : 'date to be set'} ${f.time || ''}`}
                    >
                      <View style={styles.bracketCardHead}>
                        <ThemedText style={[styles.bracketMatchNo, { color: theme.primary }]} numberOfLines={1}>
                          {f.matchNo}
                        </ThemedText>
                        <ThemedText style={[styles.bracketMeta, { color: theme.textSecondary }]} numberOfLines={1}>
                          {[f.date ? formatIsoDate(f.date).replace(/\s\d{4}$/, '') : null, f.time].filter(Boolean).join(' · ')}
                        </ThemedText>
                      </View>
                      <ThemedText
                        numberOfLines={1}
                        style={[styles.bracketTeam, { color: isPendingTeam(f.teamA) ? theme.textSecondary : theme.text }]}
                      >
                        {f.teamA}
                      </ThemedText>
                      <View style={[styles.bracketDivider, { backgroundColor: theme.outlineVariant + '33' }]} />
                      <ThemedText
                        numberOfLines={1}
                        style={[styles.bracketTeam, { color: isPendingTeam(f.teamB) ? theme.textSecondary : theme.text }]}
                      >
                        {f.teamB}
                      </ThemedText>
                      <View style={styles.bracketVenueRow}>
                        <Ionicons name="location-outline" size={10} color={theme.textSecondary} />
                        <ThemedText style={[styles.bracketMeta, { color: theme.textSecondary, flex: 1 }]} numberOfLines={1}>
                          {venueOf(f)}
                        </ThemedText>
                      </View>
                    </View>
                    {last && <View style={[styles.bracketStubOut, { backgroundColor: line }]} />}
                  </View>
                ))}
                {/* Each pair of matches joins into the one they feed. */}
                {!last &&
                  list.map((f: any, i: number) =>
                    i % 2 === 0 && i + 1 < list.length ? (
                      <View
                        key={`join-${f.id}`}
                        style={[styles.bracketJoin, { top: slotH * i + slotH / 2, height: slotH, borderColor: line }]}
                      />
                    ) : null
                  )}
              </View>
            </View>
          );
        })}

        <View style={{ width: 48 }}>
          <View style={styles.bracketRoundTitle} />
          <View style={{ height, justifyContent: 'center', alignItems: 'center' }}>
            <View style={[styles.bracketTrophy, { backgroundColor: '#F59E0B1A' }]}>
              <Ionicons name="trophy" size={18} color="#F59E0B" />
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderFixtureList = () => (
    <View style={{ marginTop: Spacing.sm }}>
      {/* Grouped by round so the path to the final is legible. */}
      {fixtureRounds.map(([round, list]) => (
        <View key={round} style={{ marginBottom: 16 }}>
          <DashboardSectionLabel
            label={round}
            color={ACCENTS.primary.main}
            style={{ marginBottom: Spacing.sm }}
            right={
              <ThemedText style={[styles.infoLine, { color: theme.textSecondary, marginTop: 0 }]}>
                {list.length} {list.length === 1 ? 'match' : 'matches'}
              </ThemedText>
            }
          />
          <View style={{ gap: 10 }}>
            {list.map((f: any) => {
              const accent =
                f.status === 'Live' || f.status === 'Cancelled'
                  ? ACCENTS.red
                  : f.status === 'Finished'
                    ? ACCENTS.slate
                    : ACCENTS.primary;
              return (
                <DashboardCard
                  key={f.id}
                  title={`${f.teamA} v ${f.teamB}`}
                  metric={[f.date ? formatIsoDate(f.date) : null, f.time].filter(Boolean).join(' · ') || 'Schedule TBC'}
                  tag={f.matchNo}
                  accent={accent}
                  trailing={
                    <View style={[styles.fixtureStatusTag, { backgroundColor: accent.main + '1A' }]}>
                      <ThemedText style={[styles.fixtureStatusText, { color: accent.dark }]}>{f.status}</ThemedText>
                    </View>
                  }
                  footer={{ label: 'Venue', value: venueOf(f) }}
                />
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );

  const renderFixtures = () => (
    <View style={styles.tabContent}>
      <View style={styles.rowBetween}>
        <DashboardSectionLabel label="Upcoming Fixtures" color={theme.primary} style={{ marginBottom: Spacing.sm }} />
        {/* No planner button: hosts manage the draw from the fixtures icon on
            their tournament card in the host screen. */}
        {tournamentFixtures.length > 0 && (
          <View style={[styles.viewToggle, { backgroundColor: theme.surfaceLow }]} accessibilityRole="tablist">
            {([
              ['bracket', 'git-network-outline', 'Bracket view'],
              ['list', 'list-outline', 'List view'],
            ] as const).map(([key, icon, label]) => {
              const active = fixtureView === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => setFixtureView(key)}
                  hitSlop={4}
                  accessibilityRole="tab"
                  accessibilityLabel={label}
                  accessibilityState={{ selected: active }}
                  style={[styles.viewToggleBtn, active && { backgroundColor: theme.surfaceLowest }, active && Shadows.level1]}
                >
                  <Ionicons name={icon} size={16} color={active ? theme.primary : theme.textSecondary} />
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {tournamentFixtures.length === 0 ? (
        <DashboardCard
          style={{ marginTop: Spacing.sm }}
          title="No fixtures yet"
          metric={isHost ? 'Drawn once registration fills' : 'The draw appears once registration closes'}
          icon="calendar-outline"
          accent={ACCENTS.slate}
        >
          {isHost && (
            <ThemedText style={[styles.addressText, { color: theme.textSecondary }]}>
              You can also draw them from the fixtures icon on your tournament card.
            </ThemedText>
          )}
        </DashboardCard>
      ) : (
        <>
          {fixtureView === 'bracket' ? renderBracketTree() : renderFixtureList()}
        </>
      )}
    </View>
  );

  const renderStandings = () => (
    <View style={styles.tabContent}>
      <DashboardSectionLabel label="Group A Point Table" color={theme.primary} style={{ marginBottom: Spacing.sm }} />
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
      <DashboardSectionLabel label="Live Matches" color={ACCENTS.red.main} style={{ marginBottom: Spacing.sm }} />
      {liveMatches.length === 0
        ? renderNoLive()
        : liveMatches.map((m: any) =>
            renderLiveCard(m, () => router.push({ pathname: '/scoring', params: { matchId: m.id } }))
          )}
    </View>
  );

  const renderStats = () => (
    <View style={styles.tabContent}>
      <DashboardSectionLabel label="Top Players (MVP Rankings)" color={theme.primary} style={{ marginBottom: Spacing.sm }} />
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
   * Sponsor tiles — the Media tab's two-column grid of full-bleed artwork, with
   * name and tier on a dark scrim. Shared by the Overview and the Sponsors tab
   * so the two can't drift apart. The headline sponsor gets a star.
   */
  const renderSponsorTiles = (list: typeof sponsors) => (
    <View style={styles.mediaGrid}>
      {list.map((sp, idx) => (
        <View key={`${sp.name}-${idx}`} style={[styles.mediaFrame, styles.sponsorTile]}>
          <Image source={sp.logo} style={styles.mediaImage} contentFit="cover" />
          <LinearGradient
            colors={['rgba(15,23,42,0)', 'rgba(15,23,42,0.85)']}
            style={styles.sponsorScrim}
          >
            <ThemedText style={styles.sponsorTileName} numberOfLines={1}>{sp.name}</ThemedText>
            <ThemedText style={styles.sponsorTileTier} numberOfLines={1}>{sp.type}</ThemedText>
          </LinearGradient>
          {idx === 0 && (
            <View style={styles.sponsorStar}>
              <Ionicons name="star" size={10} color="#F59E0B" />
            </View>
          )}
        </View>
      ))}
    </View>
  );

  const renderSponsors = () => (
    <View style={styles.tabContent}>
      <DashboardSectionLabel label="Event Sponsors" color={ACCENTS.orange.main} style={{ marginBottom: Spacing.sm }} />

      {sponsors.length === 0 ? (
        <DashboardCard
          title="No sponsors yet"
          metric="The organizer adds sponsors from the tournament editor"
          icon="ribbon-outline"
          accent={ACCENTS.slate}
        />
      ) : (
        <DashboardCard
          title="Backed by"
          metric={`${sponsors.length} ${sponsors.length === 1 ? 'sponsor' : 'sponsors'}`}
          tag="🤝 Partners"
          icon="ribbon"
          accent={ACCENTS.orange}
        >
          {renderSponsorTiles(sponsors)}
        </DashboardCard>
      )}
    </View>
  );

  const renderMedia = () => (
    <View style={styles.tabContent}>
      <DashboardSectionLabel label="Highlights & Photos" color={ACCENTS.primary.main} style={{ marginBottom: Spacing.sm }} />
      {/* Photos the organizer uploaded at publish time. */}
      {tournamentMedia.length === 0 ? (
        <DashboardCard
          title="No photos yet"
          metric="The organizer adds match photos from the tournament editor"
          icon="images-outline"
          accent={ACCENTS.slate}
        />
      ) : (
        <DashboardCard
          title="Gallery"
          metric={`${tournamentMedia.length} ${tournamentMedia.length === 1 ? 'photo' : 'photos'}`}
          tag="📸 From the organizer"
          icon="images"
          accent={ACCENTS.primary}
        >
          <View style={styles.mediaGrid}>
            {tournamentMedia.map((uri, idx) => (
              <Pressable
                key={`${uri}-${idx}`}
                style={styles.mediaFrame}
                onPress={() => triggerToast('Opening full-screen photo...')}
                accessibilityRole="imagebutton"
                accessibilityLabel={`Photo ${idx + 1} of ${tournamentMedia.length}`}
              >
                <Image source={{ uri }} style={styles.mediaImage} contentFit="cover" />
              </Pressable>
            ))}
          </View>
        </DashboardCard>
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
            <Ionicons name="arrow-back" size={20} color={theme.text} />
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
          </View>

          {/* At a glance — the Home analytics card, with the registration countdown */}
          <DashboardCard
            style={{ marginHorizontal: Spacing.containerMargin, marginTop: Spacing.md }}
            title="Tournament at a Glance"
            metric={`${teamsCount}/${maxTeams} Teams Registered`}
            tag={
              regCountdown
                ? regCountdown === 'Registration closed'
                  ? '🔒 Registration closed'
                  : `⏳ ${regCountdown} left`
                : `${TEAM_BADGE[tournamentSport] || '🏅'} ${tournamentSport}`
            }
            icon="trophy"
            accent={regBlock ? ACCENTS.slate : ACCENTS.green}
            footer={{
              label: 'Starts',
              value: tournament?.startDate ? formatIsoDate(tournament.startDate) : 'TBC',
              status: regBlock ? REG_BLOCK_LABEL[regBlock] : 'Open for registration',
            }}
          >
            <ProgressPill progress={maxTeams > 0 ? teamsCount / maxTeams : 0} accent={regBlock ? ACCENTS.slate : ACCENTS.green} />
            <StatTiles
              items={[
                { value: `${teamsCount}/${maxTeams}`, label: 'Teams' },
                { value: tournamentPrize, label: 'Prize', color: ACCENTS.orange.dark },
                { value: String(matchCount), label: 'Matches' },
              ]}
            />
          </DashboardCard>

          {/* Tabs — grey track, raised white active tab; every tab visible */}
          <DashboardTabs
            compact
            style={{ marginHorizontal: Spacing.sm, marginTop: Spacing.md }}
            options={tabsFor(started).map((tab) => ({ key: tab.key, label: tab.label, disabled: tab.disabled }))}
            active={activeTab}
            onChange={setActiveTab}
          />

          {/* Tab Sub-View Render */}
          {renderActiveTabContent()}
        </ScrollView>

        {/* Floating Call to Action Register Button — locked once every place is
            taken, play has started, or the tournament was cancelled. */}
        <View style={[styles.ctaFooter, { backgroundColor: theme.surfaceLowest, borderTopColor: theme.outlineVariant + '33' }]}>
          <Pressable 
            style={[styles.registerCtaBtn, { backgroundColor: regBlock ? '#64748B' : theme.secondaryContainer }]}
            disabled={!!regBlock}
            accessibilityRole="button"
            accessibilityState={{ disabled: !!regBlock }}
            accessibilityLabel={regBlock ? registrationBlockedMessage(regBlock, tournamentName) : `Register a team for ${tournamentName}`}
            onPress={() => router.push({
              pathname: '/team-registration',
              params: { id: params.id || 't1', name: tournamentName }
            })}
          >
            <Ionicons name={regBlock ? 'lock-closed' : 'medal'} size={20} color="#ffffff" style={{ marginRight: 8 }} />
            <ThemedText type="labelMd" style={{ color: '#ffffff', fontWeight: '500' }}>
              {regBlock ? REG_BLOCK_LABEL[regBlock] : 'Register Team Now'}
            </ThemedText>
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
  scrollContent: {
    paddingBottom: 80,
  },
bannerContainer: {
    height: 150,
    marginHorizontal: Spacing.containerMargin,
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.premium,
    overflow: 'hidden',
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
gradientOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(5, 21, 30, 0.12)',
  },
  // flex:1 per tab distributes the row evenly; minWidth:0 lets the longer
  // labels shrink rather than forcing the row wider than the screen.
  cardLink: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  cardLinkText: { fontSize: 10, fontFamily: 'Sora_500Medium' },
  addressText: { fontSize: 11, lineHeight: 16, fontFamily: 'Sora_400Regular' },
  ruleList: { gap: 6 },
  chevronTile: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  squadList: { gap: 8, paddingTop: 10, borderTopWidth: 1 },
  fixtureStatusTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  fixtureStatusText: { fontSize: 10, fontFamily: 'Sora_600SemiBold' },
  tabContent: {
    paddingHorizontal: Spacing.containerMargin,
    paddingTop: Spacing.md,
    paddingBottom: 40,
  },
  // Matched to components/home/player-dashboard.tsx: Sora Medium/Regular only,
  // nothing above 15.5px, so this screen shares the app's dominant voice.
  teamCrest: { width: 40, height: 40 },
teamRow: { borderRadius: BorderRadius.premium, borderWidth: 1, ...Shadows.level1 },
  // The logo sits on a white plaque so artwork reads cleanly against the
  // gradient rather than fighting it.
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
    borderRadius: BorderRadius.premium,
    borderWidth: 1,
    padding: 12,
    ...Shadows.level1,
  },
  infoTitle: { fontSize: 13, lineHeight: 18, fontFamily: 'Sora_500Medium' },
  infoLine: { fontSize: 11, lineHeight: 16, fontFamily: 'Sora_400Regular', marginTop: 2 },
  linkText: { fontSize: 10.5, fontFamily: 'Sora_500Medium', letterSpacing: 0.4 },
infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: BorderRadius.premium,
    borderWidth: 1,
    borderColor: '#c3c7cb33',
    ...Shadows.level1,
  },
rulesList: {
    borderWidth: 1,
    borderRadius: BorderRadius.premium,
    padding: Spacing.md,
    ...Shadows.level1,
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
viewToggle: { flexDirection: 'row', borderRadius: BorderRadius.premium, padding: 3, gap: 2 },
viewToggleBtn: { width: 32, height: 30, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },

  bracketScroll: { paddingVertical: 4, paddingRight: 16 },
  bracketRoundTitle: { height: 18, marginBottom: 6, fontSize: 10, letterSpacing: 0.8, fontFamily: 'Sora_500Medium' },
  bracketSlot: { position: 'absolute', left: 0, width: BRACKET_CARD_W, justifyContent: 'center' },
  bracketCard: { width: BRACKET_CARD_W, borderRadius: 12, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8 },
  bracketCardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 2 },
  bracketMatchNo: { fontSize: 10, letterSpacing: 0.4, fontFamily: 'Sora_500Medium' },
  bracketMeta: { fontSize: 9.5, fontFamily: 'Sora_400Regular', flexShrink: 1 },
  bracketTeam: { fontSize: 12.5, fontFamily: 'Sora_500Medium', paddingVertical: 3 },
  bracketDivider: { height: 1 },
  bracketVenueRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  bracketStubIn: { position: 'absolute', left: -BRACKET_GAP / 2, width: BRACKET_GAP / 2, height: 1.5, top: '50%' },
  bracketStubOut: { position: 'absolute', left: BRACKET_CARD_W, width: BRACKET_GAP + 4, height: 1.5, top: '50%' },
  bracketJoin: {
    position: 'absolute',
    left: BRACKET_CARD_W,
    width: BRACKET_GAP / 2,
    borderTopWidth: 1.5,
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  bracketTrophy: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },

  teamLogo: {
    fontSize: 24,
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
liveMiniCard: { borderRadius: BorderRadius.premium, borderWidth: 1, padding: 12, marginBottom: 10, ...Shadows.level1 },


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
  sponsorTile: { position: 'relative' },
  sponsorScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 8,
    paddingTop: 16,
    paddingBottom: 6,
  },
  sponsorTileName: { color: '#ffffff', fontSize: 11.5, fontFamily: 'Sora_500Medium' },
  sponsorTileTier: { color: 'rgba(255,255,255,0.8)', fontSize: 9.5, fontFamily: 'Sora_400Regular' },
  sponsorStar: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
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
    top: 56,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    zIndex: 999,
  },
});
