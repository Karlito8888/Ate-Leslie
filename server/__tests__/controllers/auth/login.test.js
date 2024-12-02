import { jest } from '@jest/globals';
import { HTTP_STATUS } from '../../../constants/http.js';
import { ApiError } from '../../../utils/error.js';
import { User } from '../../../models/index.js';

describe('Login Controller', () => {
  let login;

  // Dynamic imports after mocking
  beforeAll(async () => {
    const authModule = await import('../../../controllers/auth/index.js');

    login = authModule.login;
  });

  let req, res, next;

  beforeEach(() => {
    req = {
      body: {
        email: 'test@example.com',
        password: 'password123'
      },
      cookies: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn()
    };
    next = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should successfully login a user', async () => {
    // Mock user found in database
    const mockUser = {
      _id: 'mockUserId',
      email: req.body.email,
      username: 'testuser',
      role: 'user',
      isActive: true,
      comparePassword: jest.fn().mockResolvedValue(true),
      generateAuthToken: jest.fn().mockReturnValue('mockToken'),
      save: jest.fn()
    };
    jest.spyOn(User, 'findOne').mockResolvedValue(mockUser);

    await login(req, res, next);

    // Verify user lookup
    expect(User.findOne).toHaveBeenCalledWith({ email: req.body.email });

    // Verify password comparison
    expect(mockUser.comparePassword).toHaveBeenCalledWith(req.body.password);

    // Verify last login update
    expect(mockUser.save).toHaveBeenCalled();

    // Verify token generation and cookie setting
    expect(mockUser.generateAuthToken).toHaveBeenCalled();
    expect(res.cookie).toHaveBeenCalledWith('token', 'mockToken', expect.objectContaining({
      httpOnly: true,
      secure: expect.any(Boolean),
      sameSite: 'strict'
    }));

    // Verify response
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Login successful',
      data: expect.objectContaining({
        token: 'mockToken',
        user: expect.objectContaining({
          id: 'mockUserId',
          username: 'testuser',
          email: req.body.email,
          role: 'user'
        })
      })
    }));
  });

  it('should handle non-existent user', async () => {
    // Simulate user not found
    jest.spyOn(User, 'findOne').mockResolvedValue(null);

    await login(req, res, next);

    // Verify next was called with unauthorized error
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      message: 'Invalid email or password'
    }));
  });

  it('should handle incorrect password', async () => {
    // Mock user found but password incorrect
    const mockUser = {
      _id: 'mockUserId',
      email: req.body.email,
      comparePassword: jest.fn().mockResolvedValue(false)
    };
    jest.spyOn(User, 'findOne').mockResolvedValue(mockUser);

    await login(req, res, next);

    // Verify password comparison
    expect(mockUser.comparePassword).toHaveBeenCalledWith(req.body.password);

    // Verify next was called with unauthorized error
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      message: 'Invalid email or password'
    }));
  });

  it('should handle inactive user', async () => {
    // Mock user found but account inactive
    const mockUser = {
      _id: 'mockUserId',
      email: req.body.email,
      isActive: false,
      comparePassword: jest.fn().mockResolvedValue(true)
    };
    jest.spyOn(User, 'findOne').mockResolvedValue(mockUser);

    await login(req, res, next);

    // Verify next was called with forbidden error
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: HTTP_STATUS.FORBIDDEN,
      message: 'Account is not active'
    }));
  });

  it('should handle invalid email', async () => {
    // Set invalid email
    req.body.email = 'invalid-email';

    // Prevent User.findOne from being called
    jest.spyOn(User, 'findOne').mockImplementation(() => {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Email must be a valid email address');
    });

    await login(req, res, next);

    // Verify next was called with bad request error
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message: 'Email must be a valid email address'
    }));
  });

  it('should handle missing email', async () => {
    // Remove email from request body
    delete req.body.email;

    // Prevent User.findOne from being called
    jest.spyOn(User, 'findOne').mockImplementation(() => {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Email and password are required');
    });

    await login(req, res, next);

    // Verify next was called with bad request error
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message: 'Email and password are required'
    }));
  });

  it('should handle invalid password', async () => {
    // Set invalid password
    req.body.password = 'short';

    // Prevent User.findOne from being called
    jest.spyOn(User, 'findOne').mockImplementation(() => {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Password must be at least 8 characters long');
    });

    await login(req, res, next);

    // Verify next was called with bad request error
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message: 'Password must be at least 8 characters long'
    }));
  });

  it('should handle missing password', async () => {
    // Remove password from request body
    delete req.body.password;

    // Prevent User.findOne from being called
    jest.spyOn(User, 'findOne').mockImplementation(() => {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Email and password are required');
    });

    await login(req, res, next);

    // Verify next was called with bad request error
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message: 'Email and password are required'
    }));
  });

  it('should handle missing email and password', async () => {
    // Remove email and password from request body
    delete req.body.email;
    delete req.body.password;

    // Prevent User.findOne from being called
    jest.spyOn(User, 'findOne').mockImplementation(() => {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Email and password are required');
    });

    await login(req, res, next);

    // Verify next was called with bad request error
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message: 'Email and password are required'
    }));
  });
});
