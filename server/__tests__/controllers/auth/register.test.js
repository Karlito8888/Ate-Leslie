import { jest } from '@jest/globals';
import { ROLES } from '../../../config/permissions.js';
import { HTTP_STATUS } from '../../../constants/http.js';

// Use unstable_mockModule for ESM mocking
jest.unstable_mockModule('../../../models/index.js', () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn()
  }
}));

jest.unstable_mockModule('../../../services/newsletter.js', () => ({
  newsletterService: {
    subscribe: jest.fn()
  }
}));

describe('Register Controller', () => {
  let register, User, newsletterService;

  // Dynamic imports after mocking
  beforeAll(async () => {
    const authModule = await import('../../../controllers/auth/index.js');
    const modelsModule = await import('../../../models/index.js');
    const newsletterModule = await import('../../../services/newsletter.js');

    register = authModule.register;
    User = modelsModule.User;
    newsletterService = newsletterModule.newsletterService;
  });

  let req, res, next;

  beforeEach(() => {
    req = {
      body: {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: ROLES.USER,
        interests: ['technology'],
        newsletterSubscribed: true
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should successfully register a new user', async () => {
    // Simulate no existing user
    User.findOne.mockResolvedValue(null);

    // Mock create to return a user-like object
    User.create.mockResolvedValue({
      ...req.body,
      _id: 'mockUserId',
      updatePermissionsBasedOnRole: jest.fn(),
      generateAuthToken: jest.fn().mockReturnValue('mockToken'),
      save: jest.fn()
    });

    // Mock newsletter service
    newsletterService.subscribe.mockResolvedValue({});

    await register(req, res, next);

    // Assertions
    expect(User.findOne).toHaveBeenCalledWith({
      $or: [{ email: req.body.email }, { username: req.body.username }]
    });

    const createdUser = await User.create.mock.results[0].value;

    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
      username: req.body.username,
      email: req.body.email,
      role: ROLES.USER,
      interests: ['technology'],
      newsletterSubscribed: true,
      isActive: true
    }));

    expect(createdUser.updatePermissionsBasedOnRole).toHaveBeenCalled();
    expect(createdUser.save).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.CREATED);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'User registered successfully',
      data: expect.objectContaining({
        user: expect.objectContaining({
          username: req.body.username,
          email: req.body.email
        })
      })
    }));
  }, 20000);

  it('should throw an error if user already exists', async () => {
    // Simulate existing user
    User.findOne.mockResolvedValue({
      username: req.body.username,
      email: req.body.email
    });

    await register(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: HTTP_STATUS.CONFLICT,
      message: 'Email or username already exists'
    }));
  });

  it('should throw an error for invalid role', async () => {
    // Modify the request body to have an invalid role
    req.body.role = 'INVALID_ROLE';

    // Simulate no existing user to prevent conflict error
    User.findOne.mockResolvedValue(null);

    // Expect the next function to be called with an error
    await register(req, res, next);

    // Check if next was called with the correct error
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message: 'Invalid role'
    }));
  }, 20000);

  it('should use default role if not specified', async () => {
    // Remove role from request body
    delete req.body.role;

    // Simulate no existing user
    User.findOne.mockResolvedValue(null);

    // Mock create to return a user with default role
    User.create.mockImplementation((data) => {
      return Promise.resolve({
        ...data,
        role: ROLES.USER,
        _id: 'mockUserId',
        updatePermissionsBasedOnRole: jest.fn(),
        generateAuthToken: jest.fn().mockReturnValue('mockToken'),
        save: jest.fn()
      });
    });

    // Mock newsletter service
    newsletterService.subscribe.mockResolvedValue({});

    await register(req, res, next);

    // Check that create was called with default user role
    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
      role: ROLES.USER
    }));
  }, 20000);

  it('should handle newsletter subscription', async () => {
    // Simulate no existing user
    User.findOne.mockResolvedValue(null);

    // Mock create to return a user
    User.create.mockImplementation((data) => {
      return Promise.resolve({
        ...data,
        _id: 'mockUserId',
        updatePermissionsBasedOnRole: jest.fn(),
        generateAuthToken: jest.fn().mockReturnValue('mockToken'),
        save: jest.fn()
      });
    });

    // Mock newsletter service
    newsletterService.subscribe.mockResolvedValue({});

    await register(req, res, next);

    // Check that newsletter service was called with correct parameters
    expect(newsletterService.subscribe).toHaveBeenCalledWith({
      email: req.body.email,
      firstName: req.body.username,
      interests: req.body.interests
    });
  }, 20000);
});
