import request from 'supertest';
import { createApp } from '../index';
import { database } from '../models/database';
import { CreateUserRequest, CreateEventRequest, CreateBookingRequest } from '../types';

// Create a fresh app instance for each test
const getApp = () => createApp();

export interface TestUser {
  id?: number;
  email: string;
  password: string;
  name: string;
  role?: 'user' | 'admin';
  token?: string;
}

export interface TestEvent {
  id?: number;
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  capacity: number;
  price: number;
  created_by?: number;
}

export interface TestBooking {
  id?: number;
  event_id: number;
  user_id?: number;
  attendee_name: string;
  attendee_email: string;
  attendee_phone?: string;
}

// Test data factorie
export const createTestUser = (overrides: Partial<TestUser> = {}): TestUser => ({
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User',
  role: 'user',
  ...overrides,
});

export const createTestAdmin = (overrides: Partial<TestUser> = {}): TestUser => ({
  email: 'admin@example.com',
  password: 'adminpass123',
  name: 'Test Admin',
  role: 'admin',
  ...overrides,
});

export const createTestEvent = (overrides: Partial<TestEvent> = {}): TestEvent => ({
  title: 'Test Event',
  description: 'A test event for testing purposes',
  date: '2025-12-25',
  start_time: '14:00',
  end_time: '16:00',
  location: 'Test Location',
  capacity: 10,
  price: 25.00,
  ...overrides,
});

export const createTestBooking = (overrides: Partial<TestBooking> = {}): TestBooking => ({
  event_id: 1,
  attendee_name: 'Test Attendee',
  attendee_email: 'attendee@example.com',
  attendee_phone: '+1234567890',
  ...overrides,
});

// Authentication helper
export const registerUser = async (userData: TestUser): Promise<{ user: any; token: string }> => {
  const app = getApp();
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      email: userData.email,
      password: userData.password,
      name: userData.name,
    });

  expect(response.status).toBe(201);
  expect(response.body.token).toBeDefined();

  return {
    user: response.body.user,
    token: response.body.token,
  };
};

export const loginUser = async (email: string, password: string): Promise<{ user: any; token: string }> => {
  const app = getApp();
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  expect(response.status).toBe(200);
  expect(response.body.token).toBeDefined();

  return {
    user: response.body.user,
    token: response.body.token,
  };
};

// Database helper
export const createUserInDb = async (userData: TestUser): Promise<{ user: any; token: string }> => {
  return registerUser(userData);
};

export const createAdminInDb = async (): Promise<{ user: any; token: string }> => {
  const db = database.getDb();

  // First create the admin user directly in the database
  return new Promise((resolve, reject) => {
    const adminData = createTestAdmin();
    const bcrypt = require('bcryptjs');

    bcrypt.hash(adminData.password, 10, (err: any, hashedPassword: string) => {
      if (err) {
        reject(err);
        return;
      }

      db.run(
        `INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, 'admin')`,
        [adminData.email, hashedPassword, adminData.name],
        async function(err: any) {
          if (err) {
            reject(err);
            return;
          }

          try {
            const { user, token } = await loginUser(adminData.email, adminData.password);
            resolve({ user, token });
          } catch (loginError) {
            reject(loginError);
          }
        }
      );
    });
  });
};

export const createEventInDb = async (eventData: TestEvent, adminToken: string): Promise<any> => {
  const app = getApp();
  const response = await request(app)
    .post('/api/events')
    .set('Authorization', `Bearer ${adminToken}`)
    .send(eventData);

  expect(response.status).toBe(201);

  return {
    id: response.body.eventId,
    ...eventData,
  };
};

export const createBookingInDb = async (bookingData: TestBooking, userToken: string): Promise<any> => {
  const app = getApp();
  const response = await request(app)
    .post('/api/bookings')
    .set('Authorization', `Bearer ${userToken}`)
    .send(bookingData);

  expect(response.status).toBe(201);

  return {
    id: response.body.bookingId,
    ...bookingData,
  };
};

// Utility function
export const expectError = (response: any, status: number, errorMessage?: string) => {
  expect(response.status).toBe(status);
  expect(response.body.error).toBeDefined();
  if (errorMessage) {
    expect(response.body.error).toContain(errorMessage);
  }
};

export const expectValidationError = (response: any, field?: string) => {
  expect(response.status).toBe(400);
  expect(response.body.errors).toBeDefined();
  expect(Array.isArray(response.body.errors)).toBe(true);
  if (field) {
    expect(response.body.errors.some((error: any) => error.path === field)).toBe(true);
  }
};

export const expectSuccessResponse = (response: any, status: number = 200) => {
  expect(response.status).toBe(status);
  expect(response.body.error).toBeUndefined();
};