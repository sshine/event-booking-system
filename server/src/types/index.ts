export interface User {
  id: number;
  email: string;
  password: string;
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
}

export interface Booking {
  id: number;
  event_id: number;
  user_id: number;
  attendee_name: string;
  attendee_email: string;
  attendee_phone?: string;
  quantity: number;
  booking_date: string;
  status: 'confirmed' | 'cancelled';
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateEventRequest {
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  capacity: number;
  price: number;
  image_url?: string;
}

export interface CreateBookingRequest {
  event_id: number;
  attendee_name: string;
  attendee_email: string;
  attendee_phone?: string;
  quantity?: number;
}

export interface EventWithAvailability extends Event {
  available_spots: number;
  is_full: boolean;
}