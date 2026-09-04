/**
 * tournament-store.ts
 * Manages tournament registrations and tournament data.
 */

export interface TournamentRegistration {
  id: string;
  tournamentId: string;
  tournamentName: string;
  teamId: string;
  teamName: string;
  sport: string;
  registeredAt: string;
  status: 'pending' | 'confirmed' | 'rejected';
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  entryFee: number;
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
