import { jest } from '@jest/globals';
import { User } from '../../models/index.js';
import { register, login, logout, profile, updateProfile, forgotPassword, resetPassword, changePassword } from '../../controllers/auth/index.js';
import { HTTP_STATUS } from '../../constants/http.js';

// Mock User model
jest.mock('../../models/index.js');

describe('Auth Controller', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      body: {},
      user: {},
      cookies: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
      clearCookie: jest.fn()
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      };
      
      req.body = userData;
      
      const mockUser = {
        username: userData.username,
        email: userData.email,
        generateAuthToken: jest.fn().mockReturnValue('mockToken')
      };

      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue(mockUser);
      mockUser.updatePermissionsBasedOnRole = jest.fn();
      mockUser.save = jest.fn();

      await register(req, res, next);

      expect(User.findOne).toHaveBeenCalledWith({
        $or: [{ email: userData.email }, { username: userData.username }]
      });
      expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
        username: userData.username,
        email: userData.email,
        role: 'user',
        isActive: true
      }));
      expect(mockUser.updatePermissionsBasedOnRole).toHaveBeenCalled();
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.CREATED);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          user: expect.objectContaining({
            username: userData.username,
            email: userData.email
          }),
          token: 'mockToken'
        }),
        message: 'User registered successfully'
      }));
    });

    it('should throw error if passwords do not match', async () => {
      req.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password124'
      };

      await register(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: 'Passwords do not match'
      }));
    });

    it('should throw error if user already exists', async () => {
      req.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      };

      User.findOne.mockResolvedValue({ username: 'testuser' });

      await register(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: HTTP_STATUS.CONFLICT,
        message: 'Email or username already exists'
      }));
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      req.body = loginData;
      
      const mockUser = {
        email: loginData.email,
        comparePassword: jest.fn().mockResolvedValue(true),
        generateAuthToken: jest.fn().mockReturnValue('mockToken')
      };

      User.findOne.mockResolvedValue(mockUser);

      await login(req, res, next);

      expect(User.findOne).toHaveBeenCalledWith({ email: loginData.email });
      expect(mockUser.comparePassword).toHaveBeenCalledWith(loginData.password);
      expect(res.cookie).toHaveBeenCalledWith('token', 'mockToken', expect.any(Object));
    });

    it('should throw error for invalid credentials', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const mockUser = {
        email: req.body.email,
        comparePassword: jest.fn().mockResolvedValue(false)
      };

      User.findOne.mockResolvedValue(mockUser);

      await login(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: HTTP_STATUS.UNAUTHORIZED,
        message: 'Invalid email or password'
      }));
    });
  });

  describe('logout', () => {
    it('should clear the token cookie', () => {
      logout(req, res);
      
      expect(res.clearCookie).toHaveBeenCalledWith('token');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Logged out successfully'
      }));
    });
  });

  describe('profile', () => {
    it('should return user profile', async () => {
      const mockUser = {
        _id: 'userId',
        username: 'testuser',
        email: 'test@example.com'
      };

      req.user = mockUser;

      await profile(req, res, next);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        data: { user: mockUser }
      }));
    });
  });
});
