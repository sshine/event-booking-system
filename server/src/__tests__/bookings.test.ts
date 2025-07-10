import request from 'supertest';
import { createApp } from '../index';
import {
  createTestUser,
  createTestEvent,
  createTestBooking,
  createAdminInDb,
  createUserInDb,
  createEventInDb,
  createBookingInDb,
  expectError,
  expectValidationError,
  expectSuccessResponse,
} from './helpers';

const getApp = () => createApp();

describe('Bookings API', () => {
  describe('GET /api/bookings', () => {
    it('should return empty array when user has no bookings', async () => {
      const { token: userToken } = await createUserInDb(createTestUser());

      const response = await request(getApp())
        .get('/api/bookings')
        .set('Authorization', `Bearer ${userToken}`);

      expectSuccessResponse(response);
      expect(response.body).toEqual([]);
    });

    it('should return user bookings with event details', async () => {
      const { token: adminToken } = await createAdminInDb();
      const { token: userToken } = await createUserInDb(createTestUser());

      const eventData = createTestEvent();
      const event = await createEventInDb(eventData, adminToken);

      const bookingData = createTestBooking({ event_id: event.id });
      await createBookingInDb(bookingData, userToken);

      const response = await request(getApp())
        .get('/api/bookings')
        .set('Authorization', `Bearer ${userToken}`);

      expectSuccessResponse(response);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].event_title).toBe(eventData.title);
      expect(response.body[0].event_date).toBe(eventData.date);
      expect(response.body[0].attendee_name).toBe(bookingData.attendee_name);
      expect(response.body[0].attendee_email).toBe(bookingData.attendee_email);
      expect(response.body[0].status).toBe('confirmed');
    });

    it('should only return bookings for authenticated user', async () => {
      const { token: adminToken } = await createAdminInDb();
      const { token: user1Token } = await createUserInDb(createTestUser({ email: 'user1@example.com' }));
      const { token: user2Token } = await createUserInDb(createTestUser({ email: 'user2@example.com' }));

      const eventData = createTestEvent();
      const event = await createEventInDb(eventData, adminToken);

      // Create booking for user1
      await createBookingInDb(createTestBooking({ event_id: event.id }), user1Token);

      // Get bookings for user2 (should be empty)
      const response = await request(getApp())
        .get('/api/bookings')
        .set('Authorization', `Bearer ${user2Token}`);

      expectSuccessResponse(response);
      expect(response.body).toEqual([]);
    });

    it('should not return bookings without authentication', async () => {
      const response = await request(getApp())
        .get('/api/bookings');

      expectError(response, 401);
    });
  });

  describe('GET /api/bookings/:id', () => {
    it('should return specific booking by ID', async () => {
      const { token: adminToken } = await createAdminInDb();
      const { token: userToken } = await createUserInDb(createTestUser());

      const eventData = createTestEvent();
      const event = await createEventInDb(eventData, adminToken);

      const bookingData = createTestBooking({ event_id: event.id });
      const booking = await createBookingInDb(bookingData, userToken);

      const response = await request(getApp())
        .get(`/api/bookings/${booking.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expectSuccessResponse(response);
      expect(response.body.id).toBe(booking.id);
      expect(response.body.event_title).toBe(eventData.title);
      expect(response.body.event_description).toBe(eventData.description);
      expect(response.body.attendee_name).toBe(bookingData.attendee_name);
    });

    it('should not return booking for different user', async () => {
      const { token: adminToken } = await createAdminInDb();
      const { token: user1Token } = await createUserInDb(createTestUser({ email: 'user1@example.com' }));
      const { token: user2Token } = await createUserInDb(createTestUser({ email: 'user2@example.com' }));

      const eventData = createTestEvent();
      const event = await createEventInDb(eventData, adminToken);

      const bookingData = createTestBooking({ event_id: event.id });
      const booking = await createBookingInDb(bookingData, user1Token);

      const response = await request(getApp())
        .get(`/api/bookings/${booking.id}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expectError(response, 404, 'Booking not found');
    });

    it('should return 404 for non-existent booking', async () => {
      const { token: userToken } = await createUserInDb(createTestUser());

      const response = await request(getApp())
        .get('/api/bookings/999')
        .set('Authorization', `Bearer ${userToken}`);

      expectError(response, 404, 'Booking not found');
    });
  });

  describe('POST /api/bookings', () => {
    it('should create booking successfully for valid event', async () => {
      const { token: adminToken } = await createAdminInDb();
      const { token: userToken } = await createUserInDb(createTestUser());

      const eventData = createTestEvent();
      const event = await createEventInDb(eventData, adminToken);

      const bookingData = createTestBooking({ event_id: event.id });

      const response = await request(getApp())
        .post('/api/bookings')
        .set('Authorization', `Bearer ${userToken}`)
        .send(bookingData);

      expectSuccessResponse(response, 201);
      expect(response.body.message).toBe('Booking created successfully');
      expect(response.body.bookingId).toBeDefined();
    });

    it('should not create booking for non-existent event', async () => {
      const { token: userToken } = await createUserInDb(createTestUser());

      const bookingData = createTestBooking({ event_id: 999 });

      const response = await request(getApp())
        .post('/api/bookings')
        .set('Authorization', `Bearer ${userToken}`)
        .send(bookingData);

      expectError(response, 404, 'Event not found or has already passed');
    });

    it('should not create booking for past event', async () => {
      const { token: adminToken } = await createAdminInDb();
      const { token: userToken } = await createUserInDb(createTestUser());

      // Create past event directly in database
      const pastEventData = createTestEvent({ date: '2020-01-01' });

      const createPastEventResponse = await request(getApp())
        .post('/api/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(pastEventData);

      const eventId = createPastEventResponse.body.eventId;
      const bookingData = createTestBooking({ event_id: eventId });

      const response = await request(getApp())
        .post('/api/bookings')
        .set('Authorization', `Bearer ${userToken}`)
        .send(bookingData);

      expectError(response, 404, 'Event not found or has already passed');
    });

    it('should not create duplicate booking for same user and event', async () => {
      const { token: adminToken } = await createAdminInDb();
      const { token: userToken } = await createUserInDb(createTestUser());

      const eventData = createTestEvent();
      const event = await createEventInDb(eventData, adminToken);

      const bookingData = createTestBooking({ event_id: event.id });

      // Create first booking
      await createBookingInDb(bookingData, userToken);

      // Try to create second booking for same user and event
      const response = await request(getApp())
        .post('/api/bookings')
        .set('Authorization', `Bearer ${userToken}`)
        .send(bookingData);

      expectError(response, 400, 'You have already booked this event');
    });

    it('should not create booking when event is at capacity', async () => {
      const { token: adminToken } = await createAdminInDb();
      const { token: user1Token } = await createUserInDb(createTestUser({ email: 'user1@example.com' }));
      const { token: user2Token } = await createUserInDb(createTestUser({ email: 'user2@example.com' }));

      const eventData = createTestEvent({ capacity: 1 });
      const event = await createEventInDb(eventData, adminToken);

      const bookingData = createTestBooking({ event_id: event.id });

      // Fill the event to capacity
      await createBookingInDb(bookingData, user1Token);

      // Try to create another booking
      const response = await request(getApp())
        .post('/api/bookings')
        .set('Authorization', `Bearer ${user2Token}`)
        .send(createTestBooking({
          event_id: event.id,
          attendee_email: 'different@example.com'
        }));

      expectError(response, 400, 'Event is fully booked');
    });

    it('should validate required fields', async () => {
      const { token: userToken } = await createUserInDb(createTestUser());

      const response = await request(getApp())
        .post('/api/bookings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      expectValidationError(response);
    });

    it('should validate field formats', async () => {
      const { token: userToken } = await createUserInDb(createTestUser());

      const invalidData = {
        event_id: 'invalid', // should be integer
        attendee_name: '', // empty name
        attendee_email: 'invalid-email', // invalid email format
        attendee_phone: 'invalid-phone'
      };

      const response = await request(getApp())
        .post('/api/bookings')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidData);

      expectValidationError(response);
    });

    it('should not create booking without authentication', async () => {
      const bookingData = createTestBooking();

      const response = await request(getApp())
        .post('/api/bookings')
        .send(bookingData);

      expectError(response, 401);
    });
  });

  describe('PUT /api/bookings/:id/cancel', () => {
    it('should cancel booking successfully', async () => {
      const { token: adminToken } = await createAdminInDb();
      const { token: userToken } = await createUserInDb(createTestUser());

      const eventData = createTestEvent();
      const event = await createEventInDb(eventData, adminToken);

      const bookingData = createTestBooking({ event_id: event.id });
      const booking = await createBookingInDb(bookingData, userToken);

      const response = await request(getApp())
        .put(`/api/bookings/${booking.id}/cancel`)
        .set('Authorization', `Bearer ${userToken}`);

      expectSuccessResponse(response);
      expect(response.body.message).toBe('Booking cancelled successfully');

      // Verify booking is cancelled
      const getResponse = await request(getApp())
        .get(`/api/bookings/${booking.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(getResponse.body.status).toBe('cancelled');
    });

    it('should not cancel booking for different user', async () => {
      const { token: adminToken } = await createAdminInDb();
      const { token: user1Token } = await createUserInDb(createTestUser({ email: 'user1@example.com' }));
      const { token: user2Token } = await createUserInDb(createTestUser({ email: 'user2@example.com' }));

      const eventData = createTestEvent();
      const event = await createEventInDb(eventData, adminToken);

      const bookingData = createTestBooking({ event_id: event.id });
      const booking = await createBookingInDb(bookingData, user1Token);

      const response = await request(getApp())
        .put(`/api/bookings/${booking.id}/cancel`)
        .set('Authorization', `Bearer ${user2Token}`);

      expectError(response, 404, 'Booking not found');
    });

    it('should not cancel already cancelled booking', async () => {
      const { token: adminToken } = await createAdminInDb();
      const { token: userToken } = await createUserInDb(createTestUser());

      const eventData = createTestEvent();
      const event = await createEventInDb(eventData, adminToken);

      const bookingData = createTestBooking({ event_id: event.id });
      const booking = await createBookingInDb(bookingData, userToken);

      // Cancel booking first time
      await request(getApp())
        .put(`/api/bookings/${booking.id}/cancel`)
        .set('Authorization', `Bearer ${userToken}`);

      // Try to cancel again
      const response = await request(getApp())
        .put(`/api/bookings/${booking.id}/cancel`)
        .set('Authorization', `Bearer ${userToken}`);

      expectError(response, 400, 'Booking is already cancelled');
    });

    it('should return 404 for non-existent booking', async () => {
      const { token: userToken } = await createUserInDb(createTestUser());

      const response = await request(getApp())
        .put('/api/bookings/999/cancel')
        .set('Authorization', `Bearer ${userToken}`);

      expectError(response, 404, 'Booking not found');
    });
  });

  describe('GET /api/bookings/event/:eventId (Admin only)', () => {
    it('should return event bookings for admin', async () => {
      const { token: adminToken } = await createAdminInDb();
      const { token: userToken } = await createUserInDb(createTestUser());

      const eventData = createTestEvent();
      const event = await createEventInDb(eventData, adminToken);

      const bookingData = createTestBooking({ event_id: event.id });
      await createBookingInDb(bookingData, userToken);

      const response = await request(getApp())
        .get(`/api/bookings/event/${event.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expectSuccessResponse(response);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].attendee_name).toBe(bookingData.attendee_name);
      expect(response.body[0].user_name).toBeDefined();
      expect(response.body[0].user_email).toBeDefined();
    });

    it('should not return event bookings for regular user', async () => {
      const { token: adminToken } = await createAdminInDb();
      const { token: userToken } = await createUserInDb(createTestUser());

      const eventData = createTestEvent();
      const event = await createEventInDb(eventData, adminToken);

      const response = await request(getApp())
        .get(`/api/bookings/event/${event.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expectError(response, 403, 'Admin access required');
    });

    it('should return empty array for event with no bookings', async () => {
      const { token: adminToken } = await createAdminInDb();

      const eventData = createTestEvent();
      const event = await createEventInDb(eventData, adminToken);

      const response = await request(getApp())
        .get(`/api/bookings/event/${event.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expectSuccessResponse(response);
      expect(response.body).toEqual([]);
    });
  });

  describe('Booking Business Logic', () => {
    it('should handle concurrent booking attempts correctly', async () => {
      const { token: adminToken } = await createAdminInDb();
      const { token: user1Token } = await createUserInDb(createTestUser({ email: 'user1@example.com' }));
      const { token: user2Token } = await createUserInDb(createTestUser({ email: 'user2@example.com' }));

      const eventData = createTestEvent({ capacity: 1 });
      const event = await createEventInDb(eventData, adminToken);

      const booking1Data = createTestBooking({
        event_id: event.id,
        attendee_email: 'user1@example.com'
      });

      const booking2Data = createTestBooking({
        event_id: event.id,
        attendee_email: 'user2@example.com'
      });

      // Try to create bookings simultaneously
      const [response1, response2] = await Promise.all([
        request(getApp())
          .post('/api/bookings')
          .set('Authorization', `Bearer ${user1Token}`)
          .send(booking1Data),
        request(getApp())
          .post('/api/bookings')
          .set('Authorization', `Bearer ${user2Token}`)
          .send(booking2Data)
      ]);

      // One should succeed, one should fail
      const responses = [response1, response2];
      const successResponses = responses.filter(r => r.status === 201);
      const failureResponses = responses.filter(r => r.status === 400);

      expect(successResponses).toHaveLength(1);
      expect(failureResponses).toHaveLength(1);
      if (failureResponses[0]) {
        expect(failureResponses[0].body.error).toContain('Event is fully booked');
      }
    });
  });
});