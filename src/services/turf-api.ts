import { apiClient } from './api-client';

export interface TurfSlotAvailability {
  id: string;
  day: string;
  time: string;
  configStatus: 'available' | 'blocked' | 'maintenance';
  status: 'available' | 'blocked' | 'maintenance' | 'booked';
}

export const turfApi = {
  listTurfs: async (search?: string, sport?: string) => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (sport) params.sport = sport;
    const response = await apiClient.get('/turfs', params);
    return response.turfs;
  },

  getTurfDetails: async (id: string) => {
    const response = await apiClient.get(`/turfs/${id}`);
    return response.turf;
  },

  getAvailability: async (id: string, date: string): Promise<TurfSlotAvailability[]> => {
    const response = await apiClient.get(`/turfs/${id}/availability`, { date });
    return response.availability;
  },

  createTurf: async (data: any) => {
    const response = await apiClient.post('/turfs', data);
    return response.turf;
  },

  updateTurf: async (id: string, data: any) => {
    const response = await apiClient.put(`/turfs/${id}`, data);
    return response.turf;
  },
};
