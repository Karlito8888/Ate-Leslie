import { jest } from '@jest/globals';
import { User, Newsletter } from '../../models/index.js';
import { register, login, logout, profile, updateProfile, forgotPassword, resetPassword, changePassword } from '../../controllers/auth/index.js';
import { HTTP_STATUS } from '../../constants/http.js';
import { newsletterService } from '../../services/newsletter.js';

// Mock the newsletter service
jest.mock('../../services/newsletter.js', () => ({
  newsletterService: {
    subscribe: jest.fn().mockImplementation((data) => Promise.resolve({
      message: 'Successfully subscribed to newsletter',
      data: { email: data.email }
    }))
  }
}));

// Mock the models
jest.mock('../../models/index.js', () => {
  const mockUser = {
    _id: 'mockUserId',
    username: 'testuser',
    email: 'test@example.com',
    role: 'user',
    generateAuthToken: jest.fn().mockReturnValue('mockToken'),
    comparePassword: jest.fn().mockResolvedValue(true),
    updatePermissionsBasedOnRole: jest.fn(),
    generatePasswordResetToken: jest.fn().mockReturnValue('mockResetToken'),
    save: jest.fn().mockResolvedValue(true)
  };

  const mockUserModel = {
    findOne: jest.fn((query) => Promise.resolve(null)),
    create: jest.fn((data) => Promise.resolve(mockUser)),
    findById: jest.fn((id) => Promise.resolve(mockUser)),
    findByIdAndUpdate: jest.fn((id, update, options) => 
      Promise.resolve({ ...mockUser, ...update.$set })
    )
  };

  const mockNewsletter = {
    findOneAndUpdate: jest.fn(() => Promise.resolve({}))
  };

  return {
    __esModule: true,
    User: mockUserModel,
    Newsletter: mockNewsletter,
    default: { 
      User: mockUserModel,
      Newsletter: mockNewsletter 
    }
  };
});

describe('Auth Controller', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      body: {},
      user: {},
      cookies: {},
      params: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
      clearCookie: jest.fn()
    };
    next = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        newsletterSubscribed: true,
        interests: ['technology']
      };
      
      req.body = userData;

      // Setup mocks
      User.findOne.mockResolvedValue(null);
      User.create.mockImplementation((data) => {
        const mockUser = {
          _id: 'mockUserId',
          ...data,
          generateAuthToken: jest.fn().mockReturnValue('mockToken'),
          comparePassword: jest.fn().mockResolvedValue(true),
          updatePermissionsBasedOnRole: jest.fn(),
          save: jest.fn().mockResolvedValue(true)
        };
        return Promise.resolve(mockUser);
      });

      await register(req, res, next);

      // Verify calls
      expect(User.findOne).toHaveBeenCalledWith({
        $or: [{ email: userData.email }, { username: userData.username }]
      });
      expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
        username: userData.username,
        email: userData.email,
        role: 'user',
        isActive: true,
        newsletterSubscribed: true,
        interests: ['technology']
      }));
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.CREATED);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'User registered successfully',
        data: expect.objectContaining({
          token: 'mockToken',
          user: expect.objectContaining({
            username: userData.username,
            email: userData.email
          })
        })
      }));
    }, 20000);

    it('should throw error if passwords do not match', async () => {
      req.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password456'
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

      User.findOne.mockResolvedValue(mockUser);

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

      User.findOne.mockResolvedValue(mockUser);

      await login(req, res, next);

      expect(User.findOne).toHaveBeenCalledWith({ email: loginData.email });
      expect(mockUser.comparePassword).toHaveBeenCalledWith(loginData.password);
      expect(res.cookie).toHaveBeenCalledWith('token', 'mockToken', expect.any(Object));
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Login successful',
        data: expect.objectContaining({
          token: 'mockToken'
        })
      }));
    });

    it('should throw error for invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };
      
      req.body = loginData;

      mockUser.comparePassword.mockResolvedValue(false);
      User.findOne.mockResolvedValue(mockUser);

      await login(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: HTTP_STATUS.UNAUTHORIZED,
        message: 'Invalid email or password'
      }));
    });
  });

  describe('profile', () => {
    it('should return user profile', async () => {
      req.user = { id: mockUser._id };

      User.findById.mockResolvedValue(mockUser);

      await profile(req, res, next);

      expect(User.findById).toHaveBeenCalledWith(mockUser._id);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          user: expect.objectContaining({
            id: mockUser._id,
            username: mockUser.username,
            email: mockUser.email
          })
        })
      }));
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const updateData = {
        username: 'newusername',
        email: 'newemail@example.com',
        interests: ['newinterest']
      };
      
      req.body = updateData;
      req.user = { id: 'mockUserId' };

      const updatedUser = { ...mockUser, ...updateData };
      User.findByIdAndUpdate.mockResolvedValue(updatedUser);

      await updateProfile(req, res, next);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        req.user.id,
        { $set: expect.objectContaining(updateData) },
        { new: true, runValidators: true }
      );
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Profile updated successfully',
        data: expect.objectContaining({
          user: expect.objectContaining(updateData)
        })
      }));
    });
  });

  describe('forgotPassword', () => {
    it('should send reset token successfully', async () => {
      const email = 'test@example.com';
      req.body = { email };

      User.findOne.mockResolvedValue(mockUser);

      await forgotPassword(req, res, next);

      expect(User.findOne).toHaveBeenCalledWith({ email });
      expect(mockUser.generatePasswordResetToken).toHaveBeenCalled();
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Password reset instructions sent to email'
      }));
    });

    it('should handle non-existent email', async () => {
      req.body = { email: 'nonexistent@example.com' };
      User.findOne.mockResolvedValue(null);

      await forgotPassword(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'No user found with this email'
      }));
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const resetData = {
        token: 'validtoken',
        password: 'newpassword123',
        confirmPassword: 'newpassword123'
      };
      
      req.body = resetData;

      User.findOne.mockResolvedValue({ ...mockUser, resetPasswordToken: resetData.token, resetPasswordExpires: new Date(Date.now() + 3600000) });

      await resetPassword(req, res, next);

      expect(mockUser.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Password reset successful'
      }));
    });

    it('should handle invalid or expired token', async () => {
      req.body = {
        token: 'expiredtoken',
        password: 'newpassword',
        confirmPassword: 'newpassword'
      };

      User.findOne.mockResolvedValue({ ...mockUser, resetPasswordToken: 'expiredtoken', resetPasswordExpires: new Date(Date.now() - 3600000) });

      await resetPassword(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: 'Password reset token is invalid or has expired'
      }));
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const passwordData = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123'
      };
      
      req.body = passwordData;
      req.user = mockUser;

      await changePassword(req, res, next);

      expect(mockUser.comparePassword).toHaveBeenCalledWith(passwordData.currentPassword);
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Password changed successfully'
      }));
    });

    it('should handle incorrect current password', async () => {
      req.body = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123'
      };
      
      req.user = mockUser;
      mockUser.comparePassword.mockResolvedValue(false);

      await changePassword(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: HTTP_STATUS.UNAUTHORIZED,
        message: 'Current password is incorrect'
      }));
    });

    it('should handle password mismatch', async () => {
      req.body = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123',
        confirmPassword: 'differentpassword'
      };

      await changePassword(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: 'Passwords do not match'
      }));
    });
  });

  describe('logout', () => {
    it('should clear the token cookie', () => {
      logout(req, res);
      
      expect(res.clearCookie).toHaveBeenCalledWith('token');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Logout successful'
      }));
    });
  });
});
