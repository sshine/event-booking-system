import axios from 'axios';
import type { Event, User, Booking, AuthResponse } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: async (userData: { email: string; password: string; name: string }): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  login: async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  getProfile: async (): Promise<{ user: User }> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  checkEmail: async (data: { email: string }): Promise<{ exists: boolean; name: string | null }> => {
    const response = await api.post('/auth/check-email', data);
    return response.data;
  },
};

export const eventsApi = {
  getAll: async (): Promise<Event[]> => {
    const response = await api.get('/events');
    return response.data;
  },

  getById: async (id: number): Promise<Event> => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  create: async (eventData: Omit<Event, 'id' | 'created_by' | 'created_at' | 'available_spots' | 'is_full'>): Promise<{ message: string; eventId: number }> => {
    const response = await api.post('/events', eventData);
    return response.data;
  },

  update: async (id: number, eventData: Omit<Event, 'id' | 'created_by' | 'created_at' | 'available_spots' | 'is_full'>): Promise<{ message: string }> => {
    const response = await api.put(`/events/${id}`, eventData);
    return response.data;
  },

  delete: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  },
};

export const bookingsApi = {
  getAll: async (): Promise<Booking[]> => {
    const response = await api.get('/bookings');
    return response.data;
  },

  getById: async (id: number): Promise<Booking> => {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },

  create: async (bookingData: {
    event_id: number;
    attendee_name: string;
    attendee_email: string;
    attendee_phone?: string;
    quantity?: number;
  }): Promise<{ message: string; bookingId: number }> => {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  },

  cancel: async (id: number): Promise<{ message: string }> => {
    const response = await api.put(`/bookings/${id}/cancel`);
    return response.data;
  },

  getByEvent: async (eventId: number): Promise<Booking[]> => {
    const response = await api.get(`/bookings/event/${eventId}`);
    return response.data;
  },
};

export default api;