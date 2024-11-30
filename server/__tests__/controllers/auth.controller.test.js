import request from 'supertest';
import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import { app } from '../../index.js';
import User from '../../models/user.model.js';
import config from '../../config/index.js';

// Configurer le secret JWT pour les tests
process.env.JWT_SECRET = 'test-secret-key';

describe('Authentication Controller', () => {
  // Setup and teardown
  beforeAll(async () => {
    await mongoose.connect(config.database.uri, config.database.options);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  // Helpers
  const createTestUser = async () => {
    const hashedPassword = await bcryptjs.hash('ValidPass123!', 10);
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: hashedPassword
    });
    return user;
  };

  const getAuthToken = async () => {
    const user = await createTestUser();
    const token = user.generateAuthToken();
    return token;
  };

  // Registration Tests
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'ValidPass123!',
          confirmPassword: 'ValidPass123!'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.username).toBe('newuser');
    });

    it('should prevent registering with existing email', async () => {
      // First, create a user
      await createTestUser();

      // Try to register with same email
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'anotheruser',
          email: 'test@example.com',
          password: 'ValidPass123!',
          confirmPassword: 'ValidPass123!'
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should prevent registering with mismatched passwords', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'ValidPass123!',
          confirmPassword: 'DifferentPass123!'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // Login Tests
  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await createTestUser();
    });

    it('should login user with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'ValidPass123!'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });

    it('should reject login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword123!'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // Profile Tests
  describe('GET /api/auth/profile', () => {
    it('should retrieve user profile when authenticated', async () => {
      const token = await getAuthToken();

      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('test@example.com');
    });

    it('should reject profile access without token', async () => {
      const res = await request(app)
        .get('/api/auth/profile');

      expect(res.statusCode).toBe(401);
    });
  });

  // Password Change Tests
  describe('PUT /api/auth/profile/password', () => {
    it('should change password when current password is correct', async () => {
      const token = await getAuthToken();

      const res = await request(app)
        .put('/api/auth/profile/password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'ValidPass123!',
          newPassword: 'NewValidPass123!',
          confirmPassword: 'NewValidPass123!'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Password changed successfully');
    });

    it('should reject password change with incorrect current password', async () => {
      const token = await getAuthToken();

      const res = await request(app)
        .put('/api/auth/profile/password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'WrongPassword123!',
          newPassword: 'NewValidPass123!',
          confirmPassword: 'NewValidPass123!'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // Forgot Password Tests
  describe('POST /api/auth/password/forgot', () => {
    beforeEach(async () => {
      await createTestUser();
    });

    it('should send password reset link for existing email', async () => {
      const res = await request(app)
        .post('/api/auth/password/forgot')
        .send({ email: 'test@example.com' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Password reset link sent to email');
    });

    it('should reject forgot password for non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/password/forgot')
        .send({ email: 'nonexistent@example.com' });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
