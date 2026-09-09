import { apiClient } from './api-client';

export const tournamentApi = {
  createTournament: async (data: {
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
  }) => {
    const response = await apiClient.post('/tournaments', data);
    return response.tournament;
  },

  listTournaments: async (sport?: string, status?: string) => {
    const params: Record<string, string> = {};
    if (sport) params.sport = sport;
    if (status) params.status = status;
    const response = await apiClient.get('/tournaments', params);
    return response.tournaments;
  },

  getTournamentDetails: async (id: string) => {
    const response = await apiClient.get(`/tournaments/${id}`);
    return response.tournament;
  },

  registerTeam: async (tournamentId: string, teamId: string, paymentStatus?: 'unpaid' | 'partial' | 'paid') => {
    const response = await apiClient.post(`/tournaments/${tournamentId}/register`, {
      teamId,
      paymentStatus: paymentStatus || 'unpaid',
    });
    return response.registration;
  },
};
