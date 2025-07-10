import request from 'supertest';
import { createApp } from '../index';
import {
  createTestUser,
  createTestEvent,
  createAdminInDb,
  createUserInDb,
  createEventInDb,
  expectError,
  expectValidationError,
  expectSuccessResponse,
} from './helpers';

const getApp = () => createApp();

describe('Events API', () => {
  describe('GET /api/events', () => {
    it('should return empty array when no events exist', async () => {
      const response = await request(getApp())
        .get('/api/events');

      expectSuccessResponse(response);
      expect(response.body).toEqual([]);
    });

    it('should return list of upcoming events', async () => {
      const { token: adminToken } = await createAdminInDb();

      // Create a future event
      const eventData = createTestEvent({
        date: '2025-12-25',
        title: 'Christmas Workshop'
      });

      await createEventInDb(eventData, adminToken);

      const response = await request(getApp())
        .get('/api/events');

      expectSuccessResponse(response);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].title).toBe('Christmas Workshop');
      expect(response.body[0].available_spots).toBe(10);
      expect(response.body[0].is_full).toBe(false);
    });

    it('should not return past events', async () => {
      const { token: adminToken } = await createAdminInDb();

      // Create a past event
      const pastEvent = createTestEvent({
        date: '2020-01-01',
        title: 'Past Event'
      });

      await request(getApp())
        .post('/api/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(pastEvent);

      const response = await request(getApp())
        .get('/api/events');

      expectSuccessResponse(response);
      expect(response.body).toHaveLength(0);
    });

    it('should return events sorted by date and time', async () => {
      const { token: adminToken } = await createAdminInDb();

      const event1 = createTestEvent({
        date: '2025-12-25',
        start_time: '14:00',
        title: 'Event 1'
      });

      const event2 = createTestEvent({
        date: '2025-12-24',
        start_time: '10:00',
        title: 'Event 2'
      });

      const event3 = createTestEvent({
        date: '2025-12-25',
        start_time: '10:00',
        title: 'Event 3'
      });

      await createEventInDb(event1, adminToken);
      await createEventInDb(event2, adminToken);
      await createEventInDb(event3, adminToken);

      const response = await request(getApp())
        .get('/api/events');

      expectSuccessResponse(response);
      expect(response.body).toHaveLength(3);
      expect(response.body[0].title).toBe('Event 2'); // Dec 24
      expect(response.body[1].title).toBe('Event 3'); // Dec 25 10:00
      expect(response.body[2].title).toBe('Event 1'); // Dec 25 14:00
    });
  });

  describe('GET /api/events/:id', () => {
    it('should return specific event by ID', async () => {
      const { token: adminToken } = await createAdminInDb();
      const eventData = createTestEvent();
      const event = await createEventInDb(eventData, adminToken);

      const response = await request(getApp())
        .get(`/api/events/${event.id}`);

      expectSuccessResponse(response);
      expect(response.body.id).toBe(event.id);
      expect(response.body.title).toBe(eventData.title);
      expect(response.body.available_spots).toBe(eventData.capacity);
      expect(response.body.is_full).toBe(false);
    });

    it('should return 404 for non-existent event', async () => {
      const response = await request(getApp())
        .get('/api/events/999');

      expectError(response, 404, 'Event not found');
    });

    it('should return 400 for invalid event ID', async () => {
      const response = await request(getApp())
        .get('/api/events/invalid');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid event ID');
    });
  });

  describe('POST /api/events', () => {
    it('should create event successfully with admin credentials', async () => {
      const { token: adminToken } = await createAdminInDb();
      const eventData = createTestEvent();

      const response = await request(getApp())
        .post('/api/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(eventData);

      expectSuccessResponse(response, 201);
      expect(response.body.message).toBe('Event created successfully');
      expect(response.body.eventId).toBeDefined();
    });

    it('should not create event without admin credentials', async () => {
      const { token: userToken } = await createUserInDb(createTestUser());
      const eventData = createTestEvent();

      const response = await request(getApp())
        .post('/api/events')
        .set('Authorization', `Bearer ${userToken}`)
        .send(eventData);

      expectError(response, 403, 'Admin access required');
    });

    it('should not create event without authentication', async () => {
      const eventData = createTestEvent();

      const response = await request(getApp())
        .post('/api/events')
        .send(eventData);

      expectError(response, 401);
    });

    it('should validate required fields', async () => {
      const { token: adminToken } = await createAdminInDb();

      const response = await request(getApp())
        .post('/api/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expectValidationError(response);
    });

    it('should validate field formats', async () => {
      const { token: adminToken } = await createAdminInDb();

      const invalidEventData = {
        title: '', // empty title
        description: 'Valid description',
        date: 'invalid-date', // invalid date format
        start_time: '25:00', // invalid time
        end_time: '14:00',
        location: '',
        capacity: -1, // negative capacity
        price: -10, // negative price
      };

      const response = await request(getApp())
        .post('/api/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidEventData);

      expectValidationError(response);
    });

    it('should handle optional image_url field', async () => {
      const { token: adminToken } = await createAdminInDb();
      const eventData = {
        ...createTestEvent(),
        image_url: 'https://example.com/image.jpg'
      };

      const response = await request(getApp())
        .post('/api/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(eventData);

      expectSuccessResponse(response, 201);
    });
  });

  describe('PUT /api/events/:id', () => {
    it('should update event successfully with admin credentials', async () => {
      const { token: adminToken } = await createAdminInDb();
      const eventData = createTestEvent();
      const event = await createEventInDb(eventData, adminToken);

      const updatedData = createTestEvent({
        title: 'Updated Event Title',
        capacity: 20,
      });

      const response = await request(getApp())
        .put(`/api/events/${event.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatedData);

      expectSuccessResponse(response);
      expect(response.body.message).toBe('Event updated successfully');
    });

    it('should not update event without admin credentials', async () => {
      const { token: adminToken } = await createAdminInDb();
      const { token: userToken } = await createUserInDb(createTestUser());

      const eventData = createTestEvent();
      const event = await createEventInDb(eventData, adminToken);

      const updatedData = createTestEvent({ title: 'Updated Title' });

      const response = await request(getApp())
        .put(`/api/events/${event.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updatedData);

      expectError(response, 403, 'Admin access required');
    });

    it('should return 404 for non-existent event', async () => {
      const { token: adminToken } = await createAdminInDb();
      const updatedData = createTestEvent();

      const response = await request(getApp())
        .put('/api/events/999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatedData);

      expectError(response, 404, 'Event not found');
    });

    it('should validate updated data', async () => {
      const { token: adminToken } = await createAdminInDb();
      const eventData = createTestEvent();
      const event = await createEventInDb(eventData, adminToken);

      const invalidData = {
        title: '', // empty title
        capacity: -1, // negative capacity
      };

      const response = await request(getApp())
        .put(`/api/events/${event.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expectValidationError(response);
    });
  });

  describe('DELETE /api/events/:id', () => {
    it('should delete event successfully with admin credentials', async () => {
      const { token: adminToken } = await createAdminInDb();
      const eventData = createTestEvent();
      const event = await createEventInDb(eventData, adminToken);

      const response = await request(getApp())
        .delete(`/api/events/${event.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expectSuccessResponse(response);
      expect(response.body.message).toBe('Event deleted successfully');

      // Verify event is deleted
      const getResponse = await request(getApp())
        .get(`/api/events/${event.id}`);

      expectError(getResponse, 404);
    });

    it('should not delete event without admin credentials', async () => {
      const { token: adminToken } = await createAdminInDb();
      const { token: userToken } = await createUserInDb(createTestUser());

      const eventData = createTestEvent();
      const event = await createEventInDb(eventData, adminToken);

      const response = await request(getApp())
        .delete(`/api/events/${event.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expectError(response, 403, 'Admin access required');
    });

    it('should return 404 for non-existent event', async () => {
      const { token: adminToken } = await createAdminInDb();

      const response = await request(getApp())
        .delete('/api/events/999')
        .set('Authorization', `Bearer ${adminToken}`);

      expectError(response, 404, 'Event not found');
    });

    it('should not delete event without authentication', async () => {
      const { token: adminToken } = await createAdminInDb();
      const eventData = createTestEvent();
      const event = await createEventInDb(eventData, adminToken);

      const response = await request(getApp())
        .delete(`/api/events/${event.id}`);

      expectError(response, 401);
    });
  });

  describe('Event Availability Calculation', () => {
    it('should calculate available spots correctly', async () => {
      const { token: adminToken } = await createAdminInDb();
      const { token: userToken } = await createUserInDb(createTestUser());

      const eventData = createTestEvent({ capacity: 3 });
      const event = await createEventInDb(eventData, adminToken);

      // Check initial availability
      const initialResponse = await request(getApp())
        .get(`/api/events/${event.id}`);

      expect(initialResponse.body.available_spots).toBe(3);
      expect(initialResponse.body.is_full).toBe(false);

      // Create a booking to reduce availability
      await request(getApp())
        .post('/api/bookings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          event_id: event.id,
          attendee_name: 'Test Attendee',
          attendee_email: 'attendee@example.com',
        });

      // Check updated availability
      const updatedResponse = await request(getApp())
        .get(`/api/events/${event.id}`);

      expect(updatedResponse.body.available_spots).toBe(2);
      expect(updatedResponse.body.is_full).toBe(false);
    });
  });
});