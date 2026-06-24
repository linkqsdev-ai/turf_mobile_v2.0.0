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
  status: 'Draft' | 'Registering' | 'Ongoing' | 'Completed';
  createdAt: string;
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
