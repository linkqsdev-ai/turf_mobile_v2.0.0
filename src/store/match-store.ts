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
