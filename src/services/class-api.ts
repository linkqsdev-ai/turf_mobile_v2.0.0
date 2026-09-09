import { apiClient } from './api-client';

export interface BackendClass {
  id: string;
  coachId?: string;
  title: string;
  sport: string;
  schedule?: string;
  maxStudents?: number;
  price?: number;
  location?: string;
  status?: string;
  coach?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    avatarUrl?: string;
  };
  students?: Array<{
    id: string;
    studentId: string;
    student?: {
      id: string;
      name: string;
    };
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export const classApi = {
  listClasses: async (): Promise<BackendClass[]> => {
    try {
      const response = await apiClient.get('/classes');
      return response.classes || [];
    } catch (err) {
      console.warn('classApi.listClasses failed:', err);
      return [];
    }
  },

  createClass: async (data: {
    title: string;
    sport: string;
    schedule: string;
    maxStudents: number;
    price: number;
    location: string;
  }): Promise<BackendClass | null> => {
    try {
      const response = await apiClient.post('/classes', data);
      return response.class;
    } catch (err) {
      console.warn('classApi.createClass failed:', err);
      return null;
    }
  },

  enrollInClass: async (classId: string) => {
    const response = await apiClient.post(`/classes/${classId}/enroll`);
    return response.enrollment;
  },
};
