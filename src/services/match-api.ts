import { apiClient } from './api-client';

export interface ScoreEventSync {
  minute: number;
  type: string;
  team: 'home' | 'away';
  playerName: string;
  assistName?: string | null;
  metadata?: any;
}

export interface CricketInningsSync {
  teamId?: string | null;
  runs: number;
  wickets: number;
  overs: number;
  balls: number;
  runRate: number;
  batsmen: Array<{
    playerName: string;
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
    isOut: boolean;
    dismissalType?: string | null;
  }>;
  bowlers: Array<{
    playerName: string;
    overs: number;
    maidens: number;
    runs: number;
    wickets: number;
  }>;
}

export interface CompleteMatchPayload {
  homeScore: number;
  awayScore: number;
  events: ScoreEventSync[];
  cricketData?: CricketInningsSync[];
}

export const matchApi = {
  createMatch: async (data: {
    sport: string;
    matchType: 'Quick' | 'Bid' | 'Tournament';
    homeTeamId?: string | null;
    awayTeamId?: string | null;
    venueId?: string | null;
    venueName?: string | null;
    scheduledAt?: string;
  }) => {
    const response = await apiClient.post('/matches', data);
    return response.match;
  },

  startMatch: async (id: string) => {
    const response = await apiClient.put(`/matches/${id}/start`);
    return response.match;
  },

  completeMatch: async (id: string, payload: CompleteMatchPayload) => {
    const response = await apiClient.post(`/matches/${id}/complete`, payload);
    return response.match;
  },

  getMatchDetails: async (id: string) => {
    const response = await apiClient.get(`/matches/${id}`);
    return response.match;
  },

  listMatches: async (sport?: string, status?: string) => {
    const params: Record<string, string> = {};
    if (sport) params.sport = sport;
    if (status) params.status = status;
    const response = await apiClient.get('/matches', params);
    return response.matches;
  },
};
