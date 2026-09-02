/**
 * match-store.ts
 * Manages match state, team squads, and scores.
 */

export interface Player {
  id: string;
  name: string;
  position: string;
  avatarUrl?: string;
  jerseyNumber?: number;
  skillLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Pro';
}

export interface Team {
  id: string;
  name: string;
  sport: string;
  mascot?: string;
  players: Player[];
  wins: number;
  losses: number;
  draws: number;
  isFavourite?: boolean;
  phone?: string;
  createdAt: string;
}

export interface Match {
  id: string;
  sport: string;
  matchType: 'Quick' | 'Bid' | 'Tournament';
  homeTeam: Team | null;
  awayTeam: Team | null;
  homeScore: number;
  awayScore: number;
  status: 'pending' | 'live' | 'completed' | 'cancelled';
  venueId?: string;
  venueName?: string;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export function generateMatchId(): string {
  return `match-${Date.now()}`;
}

export function generateTeamId(): string {
  return `team-${Date.now()}`;
}

export function generatePlayerId(): string {
  return `player-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
}

/**
 * The identity of a *person*, for de-duplication.
 *
 * Player ids are synthetic and minted per team, so the same human seeded into
 * two different teams (e.g. the logged-in captain, who is auto-added to every
 * team they create) carries two different ids. Any pool that merges rosters
 * from more than one team must therefore compare people by normalized name,
 * not by id, or the same person appears twice.
 */
export function playerIdentity(player: Pick<Player, 'name'>): string {
  return player.name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Collapses a merged player list to one entry per person, keeping the first
 * occurrence (which is the richer roster record when a curated list is
 * concatenated ahead of raw team rosters).
 */
export function dedupePlayers<T extends Pick<Player, 'id' | 'name'>>(players: T[]): T[] {
  const seenIds = new Set<string>();
  const seenPeople = new Set<string>();
  const out: T[] = [];
  for (const p of players) {
    if (!p || !p.name || !p.name.trim()) continue;
    const identity = playerIdentity(p);
    if (seenIds.has(p.id) || seenPeople.has(identity)) continue;
    seenIds.add(p.id);
    seenPeople.add(identity);
    out.push(p);
  }
  return out;
}

export function createTeam(params: Omit<Team, 'id' | 'wins' | 'losses' | 'draws' | 'createdAt'>): Team {
  return {
    ...params,
    id: generateTeamId(),
    wins: 0,
    losses: 0,
    draws: 0,
    createdAt: new Date().toISOString(),
  };
}

export function createMatch(params: Omit<Match, 'id' | 'homeScore' | 'awayScore' | 'status' | 'createdAt'>): Match {
  return {
    ...params,
    id: generateMatchId(),
    homeScore: 0,
    awayScore: 0,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
}
