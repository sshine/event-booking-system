export interface User {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'admin';
  created_at: string;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  capacity: number;
  price: number;
  image_url?: string;
  created_by: number;
  created_at: string;
  available_spots: number;
  is_full: boolean;
}

export interface Booking {
  id: number;
  event_id: number;
  user_id: number;
  attendee_name: string;
  attendee_email: string;
  attendee_phone?: string;
  booking_date: string;
  status: 'confirmed' | 'cancelled';
  event_title?: string;
  event_date?: string;
  event_start_time?: string;
  event_location?: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface ApiError {
  error: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}