/**
 * tournament-store.ts
 * Manages tournament registrations and tournament data.
 */

/** A player named on a team's registration. */
export interface RegisteredPlayer {
  id: string;
  name: string;
  role?: string;
  jersey?: string;
  /** Optional — a squad can be named without contact details for every player. */
  phone?: string;
}

export interface TournamentRegistration {
  id: string;
  tournamentId: string;
  tournamentName: string;
  teamId: string;
  teamName: string;
  /** Mascot key for the team's crest — see constants/mascots.ts. */
  teamMascot?: string;
  /**
   * The squad, when the team chose to name one. Optional: a team can register
   * first and submit players later, so an empty list is a valid state rather
   * than a failure.
   */
  squad?: RegisteredPlayer[];
  sport: string;
  registeredAt: string;
  status: 'pending' | 'confirmed' | 'rejected';
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  entryFee: number;
}

/**
 * A sponsor shown on the tournament's Overview strip and Sponsors tab.
 * `logo` is a persisted data URI — a picker's blob: uri does not survive a
 * reload, so it must be converted before it is stored.
 */
export interface StoredFixture {
  id: string;
  matchNo: string;
  round?: string;
  teamA: string;
  teamB: string;
  pitch: string;
  time: string;
  date: string;
  status: 'Scheduled' | 'Live' | 'Finished' | 'Cancelled';
}

export interface TournamentSponsor {
  id: string;
  name: string;
  tier: string;
  logo: string;
}

export interface PublishedTournament {
  id: string;
  name: string;
  sport: string;
  type: string;
  location: string;
  startDate: string;
  endDate: string;
  prizePool: string;
  prizePoolAmount: number;
  entryFee: number;
  maxTeams: number;
  teamsCount: number;
  banner: any;
  organizerName: string;
  /**
   * Stable owner key, set once at creation from the signed-in profile.
   *
   * Ownership must NOT be inferred from `organizerName`: that is an editable
   * display field, so renaming the organizer made the tournament vanish from
   * its own creator's list. This never changes on edit.
   */
  organizerId?: string;
  status: 'Draft' | 'Registering' | 'Ongoing' | 'Completed' | 'Cancelled';
  createdAt: string;

  /**
   * The rest of the create-wizard answers. Optional so records published
   * before this existed still load, but without them an edit cannot round-trip
   * — reopening the wizard would silently reset every field the card doesn't
   * happen to display.
   */
  description?: string;
  organizerContact?: string;
  regStart?: string;
  regEnd?: string;
  venueAddress?: string;
  matchDuration?: string;
  teamSize?: string;
  overs?: string;
  pointSystem?: string;
  registrationFee?: string;
  deposit?: string;
  winnerPrize?: string;
  runnerPrize?: string;
  mvpPrize?: string;
  /** Rules the organizer ticked, in display order. */
  rules?: string[];
  /** Extra gallery images; surfaced under the Media tab. */
  mediaImages?: string[];
  /**
   * The draw. Held on the tournament so the Fixtures tab, the planner and the
   * auto-generator all read the same list — it previously lived only in the
   * planner's local state, so nothing else could see it and it vanished on
   * leaving the screen.
   */
  fixtures?: StoredFixture[];
  /** Sponsors the organiser uploaded for this tournament. */
  sponsors?: TournamentSponsor[];
  /**
   * The three cover photo slots, positions preserved (a `null` is an empty
   * slot). Stored alongside `banner` rather than derived from it so that
   * re-opening the form for an edit restores exactly the grid the organizer
   * built — which slot was empty, and which photo sat where.
   */
  coverImages?: (string | null)[];
  /** Index into `coverImages` of the pinned photo that became `banner`. */
  coverIndex?: number;
}

/**
 * Rule presets offered at publish time. Cricket gets its own set because its
 * conditions (overs per bowler, free hit, DLS) have no equivalent in the
 * field sports, which share the generic list.
 */
export const CRICKET_RULE_PRESETS: string[] = [
  'Teams must report 15 minutes before the scheduled start.',
  'A minimum of 7 players is required to start a match.',
  'Standard ICC playing conditions apply unless stated otherwise.',
  'One bowler may bowl a maximum of one-fifth of the total overs.',
  'A wide or no-ball concedes one extra run and is re-bowled.',
  'A free hit follows every no-ball.',
  'The umpire\'s decision is final and binding.',
  'Rain-affected matches are decided on DLS par score.',
  'Spiked footwear is not permitted on turf pitches.',
  'A team arriving more than 15 minutes late forfeits the match.',
];

export const GENERIC_RULE_PRESETS: string[] = [
  'Teams must report 15 minutes before kick-off.',
  'A minimum of 5 players is required to start a match.',
  'Match length is as stated in the fixture; halves are equal.',
  'A maximum of 5 substitutions are allowed per game.',
  'Shin guards are mandatory for all players.',
  'Two yellow cards in a match result in a red.',
  'A red card carries a minimum one-match suspension.',
  'Referee decisions are final and binding.',
  'Organizer decisions on disputes are final.',
  'A team arriving more than 15 minutes late forfeits the match.',
];

export function rulePresetsForSport(sport: string): string[] {
  return (sport || '').toLowerCase() === 'cricket' ? CRICKET_RULE_PRESETS : GENERIC_RULE_PRESETS;
}

/**
 * Legal tournament lifecycle moves.
 *
 *   Draft -> Registering        opened to teams
 *   Registering -> Ongoing      play has begun; registration closes
 *   Registering -> Cancelled    called off before it started
 *   Ongoing -> Completed        finished
 *
 * Completed and Cancelled are terminal: a finished cup must not silently
 * reopen for registration, which would let teams join a decided bracket.
 */
const TOURNAMENT_TRANSITIONS: Record<string, string[]> = {
  Draft: ['Registering', 'Cancelled'],
  Registering: ['Ongoing', 'Cancelled'],
  Ongoing: ['Completed', 'Cancelled'],
  Completed: [],
  Cancelled: [],
};

export function canTransitionTournament(from: string | undefined, to: string): boolean {
  if (!from) return false;
  if (from === to) return true;
  return (TOURNAMENT_TRANSITIONS[from] || []).includes(to);
}

export function generateTournamentId(): string {
  return `tournament-${Date.now()}`;
}

export function createRegistration(params: Omit<TournamentRegistration, 'id' | 'registeredAt'>): TournamentRegistration {
  return {
    ...params,
    id: `reg-${Date.now()}`,
    registeredAt: new Date().toISOString(),
  };
}


/**
 * Whether play has begun.
 *
 * Fixtures and live scores only exist once a tournament is under way, so the
 * tabs that show them stay inert until this is true. A completed tournament
 * counts — its fixtures and results are still worth reading.
 */
export function hasTournamentStarted(status?: string | null): boolean {
  return status === 'Ongoing' || status === 'Completed';
}

/**
 * Time left before registration closes.
 *
 * The detail screen printed a fixed "02d : 14h : 45m" for every tournament,
 * which is worse than showing nothing: it looks live and counts down to a
 * deadline that does not exist.
 *
 * Returns null when there is no usable date, so the caller can hide the row
 * rather than invent one.
 */
export function registrationCountdown(
  regEnd?: string | null,
  now: Date = new Date()
): { days: number; hours: number; minutes: number; closed: boolean } | null {
  if (!regEnd) return null;

  const end = new Date(regEnd);
  if (Number.isNaN(end.getTime())) return null;

  const ms = end.getTime() - now.getTime();
  if (ms <= 0) return { days: 0, hours: 0, minutes: 0, closed: true };

  const totalMinutes = Math.floor(ms / 60_000);
  return {
    days: Math.floor(totalMinutes / 1440),
    hours: Math.floor((totalMinutes % 1440) / 60),
    minutes: totalMinutes % 60,
    closed: false,
  };
}

/** "02d : 14h : 45m", or a closed/absent message. */
export function formatRegistrationCountdown(
  regEnd?: string | null,
  now: Date = new Date()
): string | null {
  const left = registrationCountdown(regEnd, now);
  if (!left) return null;
  if (left.closed) return 'Registration closed';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(left.days)}d : ${pad(left.hours)}h : ${pad(left.minutes)}m`;
}

/** Why a team cannot register right now, or null when it can. */
export type RegistrationBlocker = 'full' | 'closed' | 'not_open' | 'cancelled';

/**
 * Whether a tournament is still accepting teams.
 *
 * Registration had no cap at all: a 16-team cup would happily take a 17th and
 * the progress bar simply read "17/16".
 */
export function registrationBlocker(
  t: { status?: string; teamsCount?: number; maxTeams?: number } | null | undefined,
  registeredCount?: number
): RegistrationBlocker | null {
  if (!t) return 'not_open';
  if (t.status === 'Cancelled') return 'cancelled';
  if (t.status === 'Ongoing' || t.status === 'Completed') return 'closed';

  const max = Number(t.maxTeams) || 0;
  // Prefer the real count of registrations; the denormalised counter can drift
  // if a write fails midway.
  const taken = typeof registeredCount === 'number' ? registeredCount : Number(t.teamsCount) || 0;
  if (max > 0 && taken >= max) return 'full';
  return null;
}

/** Places still available, or null when the tournament is uncapped. */
export function spotsRemaining(
  t: { teamsCount?: number; maxTeams?: number } | null | undefined,
  registeredCount?: number
): number | null {
  const max = Number(t?.maxTeams) || 0;
  if (max <= 0) return null;
  const taken = typeof registeredCount === 'number' ? registeredCount : Number(t?.teamsCount) || 0;
  return Math.max(0, max - taken);
}

/** Message shown to a team that cannot register. */
export function registrationBlockedMessage(
  reason: RegistrationBlocker,
  name = 'This tournament'
): string {
  switch (reason) {
    case 'full':
      return `${name} is full — every place has been taken.`;
    case 'closed':
      return `${name} has already started, so registration is closed.`;
    case 'cancelled':
      return `${name} has been cancelled.`;
    default:
      return `${name} is not open for registration yet.`;
  }
}

export interface GeneratedFixture {
  id: string;
  matchNo: string;
  teamA: string;
  teamB: string;
  round: string;
}

/**
 * Name a knockout round by how many matches it contains.
 *
 * A 4-team draw's first round IS the semi-final; calling it "Round 1" hid the
 * shape of the competition, which is the whole point of a bracket.
 */
export function roundName(matchCount: number): string {
  if (matchCount === 1) return 'Final';
  if (matchCount === 2) return 'Semi Final';
  if (matchCount === 4) return 'Quarter Final';
  if (matchCount === 8) return 'Round of 16';
  if (matchCount === 16) return 'Round of 32';
  return `Round of ${matchCount * 2}`;
}

/** Short label used on a fixture card, e.g. "QF 3". */
function shortRoundLabel(matchCount: number, index: number): string {
  const name = roundName(matchCount);
  if (name === 'Final') return 'Final';
  if (name === 'Semi Final') return `SF ${index + 1}`;
  if (name === 'Quarter Final') return `QF ${index + 1}`;
  return `${name} · ${index + 1}`;
}

/**
 * Build the whole knockout bracket from the teams that registered.
 *
 * The first round pairs first-v-last, second-v-second-last — a standard seeded
 * draw. Later rounds are created as placeholders ("Winner QF 1") so the path to
 * the final is visible before a ball is bowled; this previously stopped after
 * one round, so a cup never showed its semi-finals or final.
 *
 * An odd count gives the unpaired team a bye rather than inventing an opponent.
 */
export function generateFixtures(teamNames: string[]): GeneratedFixture[] {
  const teams = (teamNames || []).map(t => String(t || '').trim()).filter(Boolean);
  if (teams.length < 2) return [];

  const fixtures: GeneratedFixture[] = [];
  let n = 1;

  // ── First round, from the real teams ──────────────────────────────────────
  const first: { a: string; b: string }[] = [];
  let lo = 0;
  let hi = teams.length - 1;
  while (lo < hi) {
    first.push({ a: teams[lo], b: teams[hi] });
    lo += 1;
    hi -= 1;
  }
  if (lo === hi) first.push({ a: teams[lo], b: 'Bye' });

  const firstRoundName = roundName(first.length);
  const firstLabels: string[] = [];
  first.forEach((m, i) => {
    const label = shortRoundLabel(first.length, i);
    firstLabels.push(label);
    fixtures.push({
      id: `fx-${n}`,
      matchNo: label,
      teamA: m.a,
      teamB: m.b,
      round: firstRoundName,
    });
    n += 1;
  });

  // ── Later rounds, as placeholders ────────────────────────────────────────
  let previous = firstLabels;
  while (previous.length > 1) {
    const count = Math.floor(previous.length / 2);
    const name = roundName(count);
    const labels: string[] = [];
    for (let i = 0; i < count; i++) {
      const label = shortRoundLabel(count, i);
      labels.push(label);
      fixtures.push({
        id: `fx-${n}`,
        matchNo: label,
        teamA: `Winner ${previous[i * 2]}`,
        teamB: `Winner ${previous[i * 2 + 1]}`,
        round: name,
      });
      n += 1;
    }
    // An odd number of winners carries the last one straight through.
    previous = previous.length % 2 === 0 ? labels : [...labels, previous[previous.length - 1]];
  }

  return fixtures;
}
