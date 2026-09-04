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
  /**
   * The player's mobile number — the canonical identity key across the app.
   *
   * Optional at entry (a casual player can be added by name alone), but it is
   * what makes a player record durable: team rosters sync on it, score history
   * is attributed to it across matches and devices, and the friend-of-friend
   * graph is built from phone-to-phone edges (see services/fof-network.ts).
   * A player without one exists only inside the match they were typed into.
   */
  phone?: string;
}

/** Digits only, last 10 — tolerates +91 / spaces / dashes between sources. */
export function normalizePhone(phone?: string | null): string {
  const digits = (phone || '').replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

/** A mobile number is usable as an identity key once it has enough digits. */
export function isUsablePhone(phone?: string | null): boolean {
  return normalizePhone(phone).length >= 10;
}

/** Returns 2-letter uppercase monogram initials for a person or team. */
export function getTwoLetterLogo(name?: string | null): string {
  if (!name || !name.trim()) return 'PL';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
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
export function playerIdentity(player: Pick<Player, 'name'> & { phone?: string }): string {
  // Phone wins when present: it distinguishes two different people who share a
  // name, and merges one person entered under different spellings. Name is only
  // the fallback for players added without a number.
  const digits = normalizePhone(player.phone);
  if (digits.length >= 10) return `tel:${digits}`;
  return `name:${player.name.trim().toLowerCase().replace(/\s+/g, ' ')}`;
}

/**
 * Collapses a merged player list to one entry per person, keeping the first
 * occurrence (which is the richer roster record when a curated list is
 * concatenated ahead of raw team rosters).
 */
export function dedupePlayers<T extends Pick<Player, 'id' | 'name'> & { phone?: string }>(players: T[]): T[] {
  const seenIds = new Set<string>();
  const seenPeople = new Set<string>();
  const out: T[] = [];
  for (const raw of players) {
    if (!raw || !raw.name || !raw.name.trim()) continue;
    const p = {
      ...raw,
      id: raw.id || generatePlayerId(),
    };
    const identity = playerIdentity(p);
    if (seenIds.has(p.id) || seenPeople.has(identity)) continue;
    seenIds.add(p.id);
    seenPeople.add(identity);
    out.push(p as T);
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
