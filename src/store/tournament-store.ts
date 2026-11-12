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
  /** Uploaded team logo (persisted data URI). Takes precedence over the mascot. */
  teamLogo?: string;
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
  /** The turf picked from the venue list, when the venue wasn't typed in. */
  turfId?: string;
  /** Hosted at a listed turf, or at a ground typed in by the organiser. */
  venueType?: 'Turf' | 'Ground';
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
  /** Cashback rewards configuration for tournament registration. */
  cashbackEnabled?: boolean;
  cashbackType?: 'flat' | 'percent';
  cashbackAmount?: number;
  cashbackName?: string;
  cashbackCode?: string;
  cashbackMaxAmount?: number;
  cashbackOneTime?: boolean;
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

/** Whole days between two `yyyy-mm-dd` dates, parsed by parts (no TZ shift). */
function isoToUtcMs(iso?: string | null): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso ?? '').trim());
  if (!m) return null;
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function utcMsToIso(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

/**
 * A play date for each round, spread across the tournament window.
 *
 * Every fixture used to carry the tournament's start date, so a quarter-final
 * and the final were scheduled for the same day. The first round opens on the
 * start date, the final lands on the end date, and rounds between are spaced
 * evenly. A window too short for every round gives later rounds the end date
 * rather than inventing days beyond it.
 */
export function scheduleRoundDates(
  roundNames: string[],
  startIso?: string | null,
  endIso?: string | null
): Record<string, string> {
  const rounds = [...new Set(roundNames.filter(Boolean))];
  const start = isoToUtcMs(startIso);
  const end = isoToUtcMs(endIso);
  const out: Record<string, string> = {};
  if (rounds.length === 0 || start === null) return out;

  const last = end !== null && end >= start ? end : start;
  const spanDays = Math.round((last - start) / 86_400_000);

  rounds.forEach((round, i) => {
    const offset = rounds.length === 1 ? spanDays : Math.round((spanDays * i) / (rounds.length - 1));
    out[round] = utcMsToIso(start + offset * 86_400_000);
  });
  return out;
}

/** Break between matches at one venue, so a late finish doesn't eat the next kick-off. */
export const MATCH_TURNAROUND_MINUTES = 30;
const DEFAULT_MATCH_MINUTES = 90;
const FIRST_KICKOFF_MINUTE = 9 * 60;
const LAST_KICKOFF_MINUTE = 18 * 60;

/** "02:30 PM" → 870 minutes after midnight; null when unreadable. */
export function kickoffToMinutes(time?: string | null): number | null {
  const p = parseKickoff(time);
  if (!p) return null;
  return ((p.hour % 12) + (p.meridiem === 'PM' ? 12 : 0)) * 60 + p.minute;
}

/** 870 → "02:30 PM". */
export function minutesToKickoff(total: number): string {
  const h24 = Math.floor(total / 60) % 24;
  const minute = ((total % 60) + 60) % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return formatKickoff(h12, minute, h24 >= 12 ? 'PM' : 'AM') as string;
}

/** The tournament's match length in minutes ("120" → 120), defaulting to 90. */
export function matchLengthMinutes(value?: string | number | null): number {
  const n = Math.round(Number(String(value ?? '').replace(/[^\d.]/g, '')));
  return Number.isFinite(n) && n >= 10 && n <= 600 ? n : DEFAULT_MATCH_MINUTES;
}

/** Kick-offs across a match day, spaced by match length plus the turnaround. */
export function kickoffSlots(matchMinutes: number): string[] {
  const step = matchLengthMinutes(matchMinutes) + MATCH_TURNAROUND_MINUTES;
  const out: string[] = [];
  for (let m = FIRST_KICKOFF_MINUTE; m <= LAST_KICKOFF_MINUTE; m += step) out.push(minutesToKickoff(m));
  return out;
}

/** The planner's old placeholder pitch names, from before fixtures carried the venue. */
export function isLegacyPitch(pitch?: string | null): boolean {
  return /^Pitch [A-Z]$/.test(String(pitch ?? '').trim());
}

/**
 * Stagger matches so no two at the same venue overlap. Kick-offs that already
 * fit are kept; a clashing match moves to after the one it clashes with, and
 * past the last kick-off of the day it moves to the next morning.
 *
 * Generated draws used to start every match of a round at 09:00 on separate
 * "pitches" — at a single-ground tournament that is two matches at once.
 */
export function scheduleAtVenue<T extends { date: string; time: string; pitch: string }>(
  fixtures: T[],
  matchMinutes: number
): T[] {
  const length = matchLengthMinutes(matchMinutes);
  const step = length + MATCH_TURNAROUND_MINUTES;
  const booked = new Map<string, number[]>();

  return (fixtures || []).map(f => {
    const venue = String(f.pitch ?? '').trim().toLowerCase();
    let date = f.date;
    let start = kickoffToMinutes(f.time) ?? FIRST_KICKOFF_MINUTE;

    for (let guard = 0; guard < 1000; guard++) {
      const clashes = (booked.get(`${venue}@${date}`) || []).filter(s => Math.abs(s - start) < length);
      if (clashes.length === 0) break;
      start = Math.max(...clashes) + step;
      if (start > LAST_KICKOFF_MINUTE) {
        const ms = isoToUtcMs(date);
        if (ms === null) break;
        date = utcMsToIso(ms + 86_400_000);
        start = FIRST_KICKOFF_MINUTE;
      }
    }

    const key = `${venue}@${date}`;
    booked.set(key, [...(booked.get(key) || []), start]);
    const time = minutesToKickoff(start);
    return time === f.time && date === f.date ? f : { ...f, time, date };
  });
}

/** A fixture at the same venue and date whose match would overlap `candidate`. */
export function findOverlap<T extends { id: string; date: string; time: string; pitch: string }>(
  fixtures: T[],
  candidate: { id: string; date: string; time: string; pitch: string },
  matchMinutes: number
): T | undefined {
  const length = matchLengthMinutes(matchMinutes);
  const start = kickoffToMinutes(candidate.time);
  if (start === null || !candidate.date) return undefined;
  const venue = String(candidate.pitch ?? '').trim().toLowerCase();
  return (fixtures || []).find(f => {
    if (f.id === candidate.id || f.date !== candidate.date) return false;
    if (String(f.pitch ?? '').trim().toLowerCase() !== venue) return false;
    const s = kickoffToMinutes(f.time);
    return s !== null && Math.abs(s - start) < length;
  });
}

/**
 * A draw still on placeholder "Pitch A/B", moved to the tournament venue and
 * re-timed so its matches no longer overlap. Null when nothing needs changing,
 * which is what stops the store from rewriting it again.
 */
export function refreshLegacyFixtures<T extends { date: string; time: string; pitch: string }>(
  fixtures: T[] | null | undefined,
  venue?: string | null,
  matchDuration?: string | number | null
): T[] | null {
  if (!Array.isArray(fixtures) || !fixtures.some(f => isLegacyPitch(f.pitch))) return null;
  const named = String(venue ?? '').trim();
  const place = named && !isLegacyPitch(named) ? named : 'Venue TBD';
  return scheduleAtVenue(
    fixtures.map(f => (isLegacyPitch(f.pitch) ? { ...f, pitch: place } : f)),
    matchLengthMinutes(matchDuration)
  );
}

/**
 * The complete draw, ready to store: bracket, a date per round, the tournament
 * venue, and kick-offs staggered by match length. Shared by the planner and the
 * automatic draw on a full roster so both produce the same fixtures.
 */
export function buildTournamentFixtures(
  teamNames: string[],
  startIso?: string | null,
  endIso?: string | null,
  fallbackDate = '',
  options: { venue?: string | null; matchDuration?: string | number | null } = {}
): StoredFixture[] {
  const draw = generateFixtures(teamNames);
  const roundDates = scheduleRoundDates(draw.map(f => f.round), startIso, endIso);
  const venue = String(options.venue ?? '').trim() || 'Venue TBD';
  const minutes = matchLengthMinutes(options.matchDuration);
  const fixtures: StoredFixture[] = draw.map(f => ({
    id: f.id,
    matchNo: f.matchNo,
    round: f.round,
    teamA: f.teamA,
    teamB: f.teamB,
    pitch: venue,
    time: minutesToKickoff(FIRST_KICKOFF_MINUTE),
    date: roundDates[f.round] || startIso || fallbackDate,
    status: 'Scheduled' as const,
  }));
  return scheduleAtVenue(fixtures, minutes);
}

/**
 * Whether a tournament should be drawn automatically: its roster is full, at
 * least two teams are in, and it has no fixtures yet. An existing draw is never
 * replaced — that would throw away the organiser's edits.
 */
export function shouldAutoGenerateFixtures(
  t: { maxTeams?: number | string | null; fixtures?: unknown[] | null } | null | undefined,
  registeredCount: number
): boolean {
  if (!t) return false;
  if (Array.isArray(t.fixtures) && t.fixtures.length > 0) return false;
  const max = Number(t.maxTeams) || 0;
  return max > 0 && registeredCount >= 2 && registeredCount >= max;
}

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Every date from start to end, inclusive — the days a match may be moved to.
 * Capped so a mistyped year can't build thousands of date chips.
 */
export function datesInWindow(startIso?: string | null, endIso?: string | null, maxDays = 62): string[] {
  const start = isoToUtcMs(startIso);
  if (start === null) return [];
  const endMs = isoToUtcMs(endIso);
  const end = endMs !== null && endMs >= start ? endMs : start;
  const out: string[] = [];
  for (let ms = start; ms <= end && out.length < maxDays; ms += 86_400_000) out.push(utcMsToIso(ms));
  return out;
}

/** "2026-10-01" → { weekday: 'Thu', day: 1, month: 'Oct' }, parsed by parts. */
export function isoDateParts(iso?: string | null): { weekday: string; day: number; month: string } | null {
  const ms = isoToUtcMs(iso);
  if (ms === null) return null;
  const d = new Date(ms);
  return { weekday: WEEKDAY_SHORT[d.getUTCDay()], day: d.getUTCDate(), month: MONTH_SHORT[d.getUTCMonth()] };
}

/** "09:30 AM" → { hour: 9, minute: 30, meridiem: 'AM' }; anything else → null. */
export function parseKickoff(time?: string | null): { hour: number; minute: number; meridiem: 'AM' | 'PM' } | null {
  const m = /^\s*(\d{1,2}):(\d{2})\s*(AM|PM)\s*$/i.exec(String(time ?? ''));
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (hour < 1 || hour > 12 || minute > 59) return null;
  return { hour, minute, meridiem: m[3].toUpperCase() as 'AM' | 'PM' };
}

/**
 * A kick-off in the stored "09:30 AM" shape, or null when the hour isn't 1–12
 * or the minutes aren't 00–59. Blank parts are invalid rather than zero, so a
 * half-typed time is never saved as midnight.
 */
export function formatKickoff(hour: number | string, minute: number | string, meridiem: 'AM' | 'PM'): string | null {
  if (String(hour).trim() === '' || String(minute).trim() === '') return null;
  const h = Number(hour);
  const mi = Number(minute);
  if (!Number.isInteger(h) || !Number.isInteger(mi) || h < 1 || h > 12 || mi < 0 || mi > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')} ${meridiem}`;
}

/**
 * Why moving a fixture to `date` would break the bracket's order, or null.
 * A semi-final can't be played after the final it feeds, nor a final before
 * its semis. Rounds are ordered as they appear in the draw.
 */
export function fixtureDateIssue(
  fixtures: { id: string; matchNo: string; round?: string; date: string }[],
  fixtureId: string,
  date: string
): string | null {
  const target = (fixtures || []).find(f => f.id === fixtureId);
  if (!target || !date) return null;
  const rounds = [...new Set(fixtures.map(f => f.round || 'Fixtures'))];
  const at = rounds.indexOf(target.round || 'Fixtures');
  const day = (iso: string) => {
    const p = isoDateParts(iso);
    return p ? `${p.day} ${p.month}` : iso;
  };
  for (const f of fixtures) {
    if (f.id === fixtureId || !f.date) continue;
    const idx = rounds.indexOf(f.round || 'Fixtures');
    if (idx < at && f.date > date) {
      return `${f.matchNo} is on ${day(f.date)} — this match would be played before it.`;
    }
    if (idx > at && f.date < date) {
      return `${f.matchNo} is on ${day(f.date)} — this match would be played after it.`;
    }
  }
  return null;
}

/**
 * The fixture a follower cares about now: a match in play, otherwise the
 * earliest scheduled one from today on. Null once nothing is left to play.
 */
export function nextFixture<T extends { date: string; time: string; status: string }>(
  fixtures: T[] | null | undefined,
  now: Date = new Date()
): T | null {
  const list = Array.isArray(fixtures) ? fixtures : [];
  const live = list.find(f => f.status === 'Live');
  if (live) return live;
  const pad = (n: number) => String(n).padStart(2, '0');
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const upcoming = list
    .filter(f => f.status === 'Scheduled' && !!f.date && f.date >= today)
    .sort((a, b) =>
      a.date === b.date
        ? (kickoffToMinutes(a.time) ?? 0) - (kickoffToMinutes(b.time) ?? 0)
        : a.date < b.date ? -1 : 1
    );
  return upcoming[0] || null;
}

/** One line for a tournament card: "Next: SF 1 · 1 Oct, 09:00 AM" or "Live now · SF 1". */
export function describeFixture(f: { matchNo: string; date: string; time: string; status: string }): string {
  if (f.status === 'Live') return `Live now · ${f.matchNo}`;
  const p = isoDateParts(f.date);
  return `Next: ${f.matchNo} · ${p ? `${p.day} ${p.month}` : 'Date TBC'}${f.time ? `, ${f.time}` : ''}`;
}

/**
 * Fixtures at `from` moved to `to`, for when an organiser changes the venue of
 * a tournament that already has a draw. Fixtures the host put somewhere else
 * are left alone. Null when nothing needs changing.
 */
export function renameFixtureVenue<T extends { pitch: string }>(
  fixtures: T[] | null | undefined,
  from?: string | null,
  to?: string | null
): T[] | null {
  const oldName = String(from ?? '').trim().toLowerCase();
  const newName = String(to ?? '').trim();
  if (!Array.isArray(fixtures) || !oldName || !newName || oldName === newName.toLowerCase()) return null;
  const atOld = (f: T) => String(f.pitch ?? '').trim().toLowerCase() === oldName;
  if (!fixtures.some(atOld)) return null;
  return fixtures.map(f => (atOld(f) ? { ...f, pitch: newName } : f));
}

export type HostTournamentStatus =
  | 'Draft'
  | 'Upcoming'
  | 'Registering'
  | 'Full'
  | 'Registration closed'
  | 'Ongoing'
  | 'Completed'
  | 'Cancelled';

/**
 * The status an organizer should see, worked out from the tournament's dates
 * and its real registrations. The stored status is set to "Registering" at
 * publish and nothing moves it on, so a full cup, a closed registration window
 * and a cup already in play all still read "Registering".
 */
export function hostTournamentStatus(
  t: {
    status?: string;
    startDate?: string;
    endDate?: string;
    regStart?: string;
    regEnd?: string;
    maxTeams?: number | string;
  },
  registeredCount: number,
  now: Date = new Date()
): HostTournamentStatus {
  if (t.status === 'Cancelled') return 'Cancelled';
  if (t.status === 'Draft') return 'Draft';

  const pad = (n: number) => String(n).padStart(2, '0');
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const day = (iso?: string) => String(iso ?? '').slice(0, 10);
  const start = day(t.startDate);
  const end = day(t.endDate) || start;

  if (t.status === 'Completed' || (end && end < today)) return 'Completed';
  if (t.status === 'Ongoing' || (start && start <= today)) return 'Ongoing';

  const max = Number(t.maxTeams) || 0;
  if (max > 0 && registeredCount >= max) return 'Full';
  if (day(t.regEnd) && day(t.regEnd) < today) return 'Registration closed';
  if (day(t.regStart) && day(t.regStart) > today) return 'Upcoming';
  return 'Registering';
}

/**
 * Longest a voucher may run: until the tournament ends. A voucher valid past
 * the last match can never be redeemed against an entry fee.
 */
export function voucherMaxDays(tournEndIso?: string | null, now: Date = new Date()): number | null {
  const end = isoToUtcMs(tournEndIso);
  if (end === null) return null;
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(1, Math.round((end - today) / 86_400_000));
}

/**
 * Squad places besides the captain. Team size counts the captain, so an
 * 11-a-side team registers the captain plus 10. Reads "11" and older
 * "11 players" alike; null when no team size is set, leaving the squad open.
 */
export function squadPlayerLimit(teamSize?: string | number | null): number | null {
  const n = parseInt(String(teamSize ?? '').replace(/[^\d]/g, ''), 10);
  if (!Number.isFinite(n) || n < 1) return null;
  return n - 1;
}

/**
 * Format defaults per sport. Switching sport kept a football points string
 * ("3 pts Win, 1 pt Draw") and football squad size on a cricket tournament.
 */
export const FORMAT_DEFAULTS: Record<string, { pointSystem: string; matchDuration: string; teamSize: string }> = {
  Cricket: { pointSystem: '2 pts Win, 1 pt Tie / No Result, 0 pts Loss · NRR tie-break', matchDuration: '120', teamSize: '11' },
  Football: { pointSystem: '3 pts Win, 1 pt Draw, 0 pts Loss · Goal difference tie-break', matchDuration: '90', teamSize: '11' },
};

export function formatDefaultsFor(sport?: string | null) {
  return FORMAT_DEFAULTS[String(sport ?? '')] ?? FORMAT_DEFAULTS.Football;
}
