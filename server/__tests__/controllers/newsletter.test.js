import { jest } from '@jest/globals';
import { User } from '../../models/index.js';
import { toggleSubscription, sendNewsletter } from '../../controllers/newsletter/index.js';
import { HTTP_STATUS } from '../../constants/http.js';

// Mock User model
jest.mock('../../models/index.js');

describe('Newsletter Controller', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      user: { id: 'mockUserId' },
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('toggleSubscription', () => {
    it('should subscribe user to newsletter', async () => {
      const mockUser = {
        _id: 'mockUserId',
        newsletterSubscribed: false,
        save: jest.fn()
      };

      User.findById.mockResolvedValue(mockUser);

      await toggleSubscription(req, res, next);

      expect(User.findById).toHaveBeenCalledWith('mockUserId');
      expect(mockUser.newsletterSubscribed).toBe(true);
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Successfully subscribed to the newsletter'
      }));
    });

    it('should unsubscribe user from newsletter', async () => {
      const mockUser = {
        _id: 'mockUserId',
        newsletterSubscribed: true,
        save: jest.fn()
      };

      User.findById.mockResolvedValue(mockUser);

      await toggleSubscription(req, res, next);

      expect(mockUser.newsletterSubscribed).toBe(false);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Successfully unsubscribed from the newsletter'
      }));
    });

    it('should handle non-existent user', async () => {
      User.findById.mockResolvedValue(null);

      await toggleSubscription(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'User not found'
      }));
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      User.findById.mockRejectedValue(error);

      await toggleSubscription(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('sendNewsletter', () => {
    it('should send newsletter to all subscribers', async () => {
      const mockSubscribers = [
        { email: 'user1@example.com' },
        { email: 'user2@example.com' }
      ];

      User.find.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockSubscribers)
      });

      await sendNewsletter(req, res, next);

      expect(User.find).toHaveBeenCalledWith({ newsletterSubscribed: true });
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Newsletter sent to 2 subscribers'
      }));
    });

    it('should handle case with no subscribers', async () => {
      User.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([])
      });

      await sendNewsletter(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: 'No subscribers found'
      }));
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      User.find.mockReturnValue({
        select: jest.fn().mockRejectedValue(error)
      });

      await sendNewsletter(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
