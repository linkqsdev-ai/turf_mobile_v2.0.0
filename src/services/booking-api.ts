import { apiClient } from './api-client';

export const bookingApi = {
  createBooking: async (data: {
    turfId: string;
    date: string;
    dayLabel: string;
    slots: string[];
    totalAmount: number;
    advancePaid: number;
    remaining: number;
    paymentMethod: string;
    coachAdded?: boolean;
    recordingAdded?: boolean;
  }) => {
    const response = await apiClient.post('/bookings', data);
    return response.booking;
  },

  listMyBookings: async () => {
    const response = await apiClient.get('/bookings');
    return response.bookings;
  },

  getBookingDetails: async (id: string) => {
    const response = await apiClient.get(`/bookings/${id}`);
    return response.booking;
  },

  cancelBooking: async (id: string) => {
    const response = await apiClient.put(`/bookings/${id}/cancel`);
    return response.booking;
  },
};
