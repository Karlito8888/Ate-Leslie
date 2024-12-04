import { jest } from '@jest/globals';
import { HTTP_STATUS } from '../../../constants/http.js';
import { ApiError } from '../../../utils/error.js';
import { User } from '../../../models/index.js';

describe('Profile Controller', () => {
  let profile, updateProfile;

  // Dynamic imports after mocking
  beforeAll(async () => {
    const authModule = await import('../../../controllers/auth/index.js');
    profile = authModule.profile;
    updateProfile = authModule.updateProfile;
  });

  let req, res, next;

  beforeEach(() => {
    req = {
      user: { id: 'mockUserId' },
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('profile', () => {
    it('should return user profile successfully', async () => {
      const mockUser = {
        _id: 'mockUserId',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        permissions: ['read:profile'],
        interests: ['sports', 'music'],
        newsletterSubscribed: true
      };

      jest.spyOn(User, 'findById').mockImplementation(() => ({
        select: jest.fn().mockResolvedValue(mockUser)
      }));

      await profile(req, res, next);

      expect(User.findById).toHaveBeenCalledWith(req.user.id);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '',
        data: {
          user: {
            id: mockUser._id,
            username: mockUser.username,
            email: mockUser.email,
            role: mockUser.role,
            permissions: mockUser.permissions,
            interests: mockUser.interests,
            newsletterSubscribed: mockUser.newsletterSubscribed,
          },
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle user not found', async () => {
      jest.spyOn(User, 'findById').mockImplementation(() => ({
        select: jest.fn().mockResolvedValue(null)
      }));

      await profile(req, res, next);

      expect(User.findById).toHaveBeenCalledWith(req.user.id);
      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
      expect(next.mock.calls[0][0].statusCode).toBe(HTTP_STATUS.NOT_FOUND);
      expect(next.mock.calls[0][0].message).toBe('User not found');
    });

    it('should handle database error', async () => {
      const dbError = new Error('Database error');
      jest.spyOn(User, 'findById').mockImplementation(() => ({
        select: jest.fn().mockRejectedValue(dbError)
      }));

      await profile(req, res, next);

      expect(User.findById).toHaveBeenCalledWith(req.user.id);
      expect(next).toHaveBeenCalledWith(dbError);
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      req.body = {
        username: 'newUsername',
        email: 'newemail@example.com',
        phoneNumber: '1234567890',
        interests: ['technology', 'art']
      };

      const updatedUser = {
        _id: 'mockUserId',
        ...req.body
      };

      jest.spyOn(User, 'findByIdAndUpdate').mockImplementation(() => ({
        select: jest.fn().mockResolvedValue(updatedUser)
      }));

      await updateProfile(req, res, next);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        req.user.id,
        { $set: req.body },
        { new: true, runValidators: true }
      );
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: {
            username: updatedUser.username,
            email: updatedUser.email,
            phoneNumber: updatedUser.phoneNumber,
            interests: updatedUser.interests,
          },
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle user not found during update', async () => {
      req.body = {
        username: 'newUsername',
        email: 'newemail@example.com'
      };

      jest.spyOn(User, 'findByIdAndUpdate').mockImplementation(() => ({
        select: jest.fn().mockResolvedValue(null)
      }));

      await updateProfile(req, res, next);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        req.user.id,
        { $set: req.body },
        { new: true, runValidators: true }
      );
      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
      expect(next.mock.calls[0][0].statusCode).toBe(HTTP_STATUS.NOT_FOUND);
      expect(next.mock.calls[0][0].message).toBe('User not found');
    });

    it('should handle validation error during update', async () => {
      req.body = {
        username: 'newUsername',
        email: 'invalid-email'
      };

      const validationError = new Error('Validation error');
      validationError.name = 'ValidationError';
      jest.spyOn(User, 'findByIdAndUpdate').mockImplementation(() => ({
        select: jest.fn().mockRejectedValue(validationError)
      }));

      await updateProfile(req, res, next);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        req.user.id,
        { $set: req.body },
        { new: true, runValidators: true }
      );
      expect(next).toHaveBeenCalledWith(validationError);
    });

    it('should handle database error during update', async () => {
      req.body = {
        username: 'newUsername',
        email: 'newemail@example.com'
      };

      const dbError = new Error('Database error');
      jest.spyOn(User, 'findByIdAndUpdate').mockImplementation(() => ({
        select: jest.fn().mockRejectedValue(dbError)
      }));

      await updateProfile(req, res, next);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        req.user.id,
        { $set: req.body },
        { new: true, runValidators: true }
      );
      expect(next).toHaveBeenCalledWith(dbError);
    });
  });
});
