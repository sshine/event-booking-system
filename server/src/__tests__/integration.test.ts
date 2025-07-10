import request from 'supertest';
import { createApp } from '../index';
import {
  createTestUser,
  createTestEvent,
  createTestBooking,
  createAdminInDb,
  createUserInDb,
  createEventInDb,
  expectSuccessResponse,
} from './helpers';

const getApp = () => createApp();

describe('Integration Tests', () => {
  describe('API Health Check', () => {
    it('should return health status', async () => {
      const response = await request(getApp())
        .get('/api/health');

      expectSuccessResponse(response);
      expect(response.body.status).toBe('OK');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(getApp())
        .get('/api/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Route not found');
    });
  });

  describe('Complete User Journey', () => {
    it('should handle complete booking flow', async () => {
      // 1. Create admin and regular user
      const { token: adminToken } = await createAdminInDb();
      const userData = createTestUser();
      const { user, token: userToken } = await createUserInDb(userData);

      // 2. Admin creates an event
      const eventData = createTestEvent({
        title: 'Integration Test Event',
        capacity: 2,
      });
      const event = await createEventInDb(eventData, adminToken);

      // 3. User views all events
      const eventsResponse = await request(getApp())
        .get('/api/events');
      
      expectSuccessResponse(eventsResponse);
      expect(eventsResponse.body).toHaveLength(1);
      expect(eventsResponse.body[0].title).toBe('Integration Test Event');
      expect(eventsResponse.body[0].available_spots).toBe(2);

      // 4. User views specific event
      const eventResponse = await request(getApp())
        .get(`/api/events/${event.id}`);
      
      expectSuccessResponse(eventResponse);
      expect(eventResponse.body.title).toBe('Integration Test Event');

      // 5. User checks their profile
      const profileResponse = await request(getApp())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${userToken}`);
      
      expectSuccessResponse(profileResponse);
      expect(profileResponse.body.user.name).toBe(userData.name);

      // 6. User creates a booking
      const bookingData = createTestBooking({
        event_id: event.id,
        attendee_name: 'Integration Test Attendee',
      });

      const bookingResponse = await request(getApp())
        .post('/api/bookings')
        .set('Authorization', `Bearer ${userToken}`)
        .send(bookingData);

      expectSuccessResponse(bookingResponse, 201);
      const bookingId = bookingResponse.body.bookingId;

      // 7. Verify event availability updated
      const updatedEventResponse = await request(getApp())
        .get(`/api/events/${event.id}`);
      
      expect(updatedEventResponse.body.available_spots).toBe(1);

      // 8. User views their bookings
      const userBookingsResponse = await request(getApp())
        .get('/api/bookings')
        .set('Authorization', `Bearer ${userToken}`);
      
      expectSuccessResponse(userBookingsResponse);
      expect(userBookingsResponse.body).toHaveLength(1);
      expect(userBookingsResponse.body[0].event_title).toBe('Integration Test Event');

      // 9. User views specific booking
      const specificBookingResponse = await request(getApp())
        .get(`/api/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expectSuccessResponse(specificBookingResponse);
      expect(specificBookingResponse.body.attendee_name).toBe('Integration Test Attendee');

      // 10. Admin views event bookings
      const adminBookingsResponse = await request(getApp())
        .get(`/api/bookings/event/${event.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expectSuccessResponse(adminBookingsResponse);
      expect(adminBookingsResponse.body).toHaveLength(1);
      expect(adminBookingsResponse.body[0].user_name).toBe(userData.name);

      // 11. User cancels booking
      const cancelResponse = await request(getApp())
        .put(`/api/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expectSuccessResponse(cancelResponse);

      // 12. Verify booking is cancelled and availability restored
      const finalEventResponse = await request(getApp())
        .get(`/api/events/${event.id}`);
      
      expect(finalEventResponse.body.available_spots).toBe(2);

      const cancelledBookingResponse = await request(getApp())
        .get(`/api/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(cancelledBookingResponse.body.status).toBe('cancelled');

      // 13. Admin updates event
      const updatedEventData = createTestEvent({
        title: 'Updated Integration Test Event',
        capacity: 5,
      });

      const updateEventResponse = await request(getApp())
        .put(`/api/events/${event.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatedEventData);
      
      expectSuccessResponse(updateEventResponse);

      // 14. Verify event was updated
      const finalEventCheckResponse = await request(getApp())
        .get(`/api/events/${event.id}`);
      
      expect(finalEventCheckResponse.body.title).toBe('Updated Integration Test Event');
      expect(finalEventCheckResponse.body.capacity).toBe(5);

      // 15. User logs out
      const logoutResponse = await request(getApp())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${userToken}`);
      
      expectSuccessResponse(logoutResponse);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Test with invalid data that might cause database errors
      const { token: userToken } = await createUserInDb(createTestUser());

      const response = await request(getApp())
        .post('/api/bookings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          event_id: 'not-a-number',
          attendee_name: 'Test',
          attendee_email: 'test@example.com',
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    it('should not be affected by rate limiting in test environment', async () => {
      // Make multiple requests quickly to ensure rate limiting doesn't interfere with tests
      const promises = Array.from({ length: 10 }, () =>
        request(getApp()).get('/api/health')
      );

      const responses = await Promise.all(promises);
      responses.forEach(response => {
        expectSuccessResponse(response);
      });
    });
  });

  describe('CORS Headers', () => {
    it('should include proper CORS headers', async () => {
      const response = await request(getApp())
        .get('/api/health')
        .set('Origin', 'http://localhost:5173');

      expectSuccessResponse(response);
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('Security Headers', () => {
    it('should include security headers from helmet', async () => {
      const response = await request(getApp())
        .get('/api/health');

      expectSuccessResponse(response);
      // Helmet adds various security headers
      expect(response.headers['x-content-type-options']).toBeDefined();
    });
  });
});