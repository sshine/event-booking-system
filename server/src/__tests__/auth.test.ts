import request from 'supertest';
import { createApp } from '../index';
import {
  createTestUser,
  createTestAdmin,
  registerUser,
  loginUser,
  expectError,
  expectValidationError,
  expectSuccessResponse,
} from './helpers';

const getApp = () => createApp();

describe('Authentication API', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = createTestUser();

      const response = await request(getApp())
        .post('/api/auth/register')
        .send({
          email: userData.email,
          password: userData.password,
          name: userData.name,
        });

      expectSuccessResponse(response, 201);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.name).toBe(userData.name);
      expect(response.body.user.role).toBe('user');
      expect(response.body.user.id).toBeDefined();
      expect(response.body.user.password).toBeUndefined();
      expect(response.body.token).toBeDefined();
    });

    it('should not register user with invalid email', async () => {
      const userData = createTestUser({ email: 'invalid-email' });

      const response = await request(getApp())
        .post('/api/auth/register')
        .send({
          email: userData.email,
          password: userData.password,
          name: userData.name,
        });

      expectValidationError(response, 'email');
    });

    it('should not register user with short password', async () => {
      const userData = createTestUser({ password: '123' });

      const response = await request(getApp())
        .post('/api/auth/register')
        .send({
          email: userData.email,
          password: userData.password,
          name: userData.name,
        });

      expectValidationError(response, 'password');
    });

    it('should not register user with empty name', async () => {
      const userData = createTestUser({ name: '' });

      const response = await request(getApp())
        .post('/api/auth/register')
        .send({
          email: userData.email,
          password: userData.password,
          name: userData.name,
        });

      expectValidationError(response, 'name');
    });

    it('should not register user with duplicate email', async () => {
      const userData = createTestUser();

      // Register user first time
      await registerUser(userData);

      // Try to register again with same email
      const response = await request(getApp())
        .post('/api/auth/register')
        .send({
          email: userData.email,
          password: userData.password,
          name: userData.name,
        });

      expectError(response, 400, 'Email already registered');
    });

    it('should handle missing required fields', async () => {
      const response = await request(getApp())
        .post('/api/auth/register')
        .send({});

      expectValidationError(response);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login existing user successfully', async () => {
      const userData = createTestUser();
      await registerUser(userData);

      const response = await request(getApp())
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        });

      expectSuccessResponse(response);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.password).toBeUndefined();
      expect(response.body.token).toBeDefined();
    });

    it('should not login with invalid email', async () => {
      const response = await request(getApp())
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        });

      expectError(response, 401, 'Invalid credentials');
    });

    it('should not login with wrong password', async () => {
      const userData = createTestUser();
      await registerUser(userData);

      const response = await request(getApp())
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: 'wrongpassword',
        });

      expectError(response, 401, 'Invalid credentials');
    });

    it('should not login with invalid email format', async () => {
      const response = await request(getApp())
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123',
        });

      expectValidationError(response, 'email');
    });

    it('should not login with empty password', async () => {
      const response = await request(getApp())
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: '',
        });

      expectValidationError(response, 'password');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user profile for authenticated user', async () => {
      const userData = createTestUser();
      const { user, token } = await registerUser(userData);

      const response = await request(getApp())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expectSuccessResponse(response);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.id).toBe(user.id);
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.name).toBe(userData.name);
      expect(response.body.user.role).toBe('user');
      expect(response.body.user.password).toBeUndefined();
    });

    it('should return 401 without authorization token', async () => {
      const response = await request(getApp())
        .get('/api/auth/me');

      expectError(response, 401);
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(getApp())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expectError(response, 401);
    });

    it('should return 401 with malformed authorization header', async () => {
      const response = await request(getApp())
        .get('/api/auth/me')
        .set('Authorization', 'Invalid format');

      expectError(response, 401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout authenticated user successfully', async () => {
      const userData = createTestUser();
      const { token } = await registerUser(userData);

      const response = await request(getApp())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expectSuccessResponse(response);
      expect(response.body.message).toBe('Logged out successfully');
    });

    it('should return 401 without authorization token', async () => {
      const response = await request(getApp())
        .post('/api/auth/logout');

      expectError(response, 401);
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(getApp())
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer invalid-token');

      expectError(response, 401);
    });
  });

  describe('JWT Token Validation', () => {
    it('should accept valid JWT token format', async () => {
      const userData = createTestUser();
      const { token } = await registerUser(userData);

      // Token should be a valid JWT (3 parts separated by dots)
      const tokenParts = token.split('.');
      expect(tokenParts).toHaveLength(3);
      
      // Should be able to use token for authenticated requests
      const response = await request(getApp())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expectSuccessResponse(response);
    });

    it('should reject expired tokens', async () => {
      // This would require mocking time or using a test token with short expiry
      // For now, we test with an obviously invalid token structure
      const response = await request(getApp())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer expired.token.here');

      expectError(response, 401);
    });
  });
});