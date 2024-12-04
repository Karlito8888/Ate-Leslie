import { jest } from '@jest/globals';
import { HTTP_STATUS } from '../../../constants/http.js';
import { ApiError } from '../../../utils/error.js';
import { User } from '../../../models/index.js';
import crypto from 'crypto';

describe('Password Controller', () => {
  let forgotPassword, resetPassword, changePassword;

  // Dynamic imports after mocking
  beforeAll(async () => {
    const authModule = await import('../../../controllers/auth/index.js');
    forgotPassword = authModule.forgotPassword;
    resetPassword = authModule.resetPassword;
    changePassword = authModule.changePassword;
  });

  let req, res, next;
  let mockUser;

  beforeEach(() => {
    req = {
      body: {},
      user: null,
      params: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn()
    };
    next = jest.fn();

    // Create mock user
    mockUser = {
      _id: 'mockUserId',
      email: 'test@example.com',
      createPasswordResetToken: jest.fn().mockReturnValue('mockResetToken'),
      comparePassword: jest.fn().mockResolvedValue(true),
      save: jest.fn()
    };

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('forgotPassword', () => {
    it('should send reset token successfully', async () => {
      const email = 'test@example.com';
      req.body = { email };

      jest.spyOn(User, 'findOne').mockResolvedValue(mockUser);

      await forgotPassword(req, res, next);

      expect(User.findOne).toHaveBeenCalledWith({ email });
      expect(mockUser.createPasswordResetToken).toHaveBeenCalled();
      expect(mockUser.save).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle non-existent email', async () => {
      const email = 'nonexistent@example.com';
      req.body = { email };

      jest.spyOn(User, 'findOne').mockResolvedValue(null);

      await forgotPassword(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
      expect(next.mock.calls[0][0].statusCode).toBe(HTTP_STATUS.NOT_FOUND);
    });

    it('should handle missing email', async () => {
      req.body = {};

      await forgotPassword(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
      expect(next.mock.calls[0][0].statusCode).toBe(HTTP_STATUS.NOT_FOUND);
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const token = 'mockResetToken';
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      
      req.params = { token };
      req.body = {
        newPassword: 'newpassword123',
        confirmNewPassword: 'newpassword123'
      };

      const mockUserWithToken = {
        ...mockUser,
        passwordResetToken: hashedToken,
        passwordResetExpires: Date.now() + 3600000, // 1 hour in the future
        save: jest.fn()
      };

      jest.spyOn(User, 'findOne').mockResolvedValue(mockUserWithToken);

      await resetPassword(req, res, next);

      expect(User.findOne).toHaveBeenCalledWith({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: expect.any(Number) }
      });
      expect(mockUserWithToken.password).toBe('newpassword123');
      expect(mockUserWithToken.passwordResetToken).toBeUndefined();
      expect(mockUserWithToken.passwordResetExpires).toBeUndefined();
      expect(mockUserWithToken.save).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle password mismatch', async () => {
      req.params = { token: 'mockResetToken' };
      req.body = {
        newPassword: 'newpassword123',
        confirmNewPassword: 'differentpassword'
      };

      await resetPassword(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
      expect(next.mock.calls[0][0].statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(next.mock.calls[0][0].message).toBe('Passwords do not match');
    });

    it('should handle invalid or expired token', async () => {
      const token = 'mockResetToken';
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      
      req.params = { token };
      req.body = {
        newPassword: 'newpassword123',
        confirmNewPassword: 'newpassword123'
      };

      jest.spyOn(User, 'findOne').mockResolvedValue(null);

      await resetPassword(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
      expect(next.mock.calls[0][0].statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(next.mock.calls[0][0].message).toBe('Token is invalid or has expired');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const passwordData = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123',
        confirmNewPassword: 'newpassword123'
      };

      req.user = { id: 'mockUserId' };
      req.body = passwordData;

      const mockUserToChange = {
        ...mockUser,
        _id: 'mockUserId',
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn()
      };

      jest.spyOn(User, 'findById').mockResolvedValue(mockUserToChange);

      await changePassword(req, res, next);

      expect(User.findById).toHaveBeenCalledWith(req.user.id);
      expect(mockUserToChange.comparePassword).toHaveBeenCalledWith(passwordData.currentPassword);
      expect(mockUserToChange.password).toBe(passwordData.newPassword);
      expect(mockUserToChange.save).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle incorrect current password', async () => {
      req.user = { id: 'mockUserId' };
      req.body = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123',
        confirmNewPassword: 'newpassword123'
      };

      const mockUserToChange = {
        ...mockUser,
        _id: 'mockUserId',
        comparePassword: jest.fn().mockResolvedValue(false)
      };

      jest.spyOn(User, 'findById').mockResolvedValue(mockUserToChange);

      await changePassword(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
      expect(next.mock.calls[0][0].statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(next.mock.calls[0][0].message).toBe('Current password is incorrect');
    });

    it('should handle password mismatch', async () => {
      req.user = { id: 'mockUserId' };
      req.body = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123',
        confirmNewPassword: 'differentpassword'
      };

      const mockUserToChange = {
        ...mockUser,
        _id: 'mockUserId',
        comparePassword: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(User, 'findById').mockResolvedValue(mockUserToChange);

      await changePassword(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
      expect(next.mock.calls[0][0].statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(next.mock.calls[0][0].message).toBe('New passwords do not match');
    });

    it('should handle missing current password', async () => {
      req.user = { id: 'mockUserId' };
      req.body = {
        newPassword: 'newpassword123',
        confirmNewPassword: 'newpassword123'
      };

      await changePassword(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
      expect(next.mock.calls[0][0].statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(next.mock.calls[0][0].message).toBe('Current password is required');
    });

    it('should handle missing new password', async () => {
      req.user = { id: 'mockUserId' };
      req.body = {
        currentPassword: 'oldpassword'
      };

      await changePassword(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
      expect(next.mock.calls[0][0].statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(next.mock.calls[0][0].message).toBe('New password is required');
    });
  });
});
