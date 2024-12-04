import { jest } from '@jest/globals';
import { newsletterService } from '../../services/newsletter.js';
import { newsletterController } from '../../controllers/newsletter/index.js';
import { HTTP_STATUS } from '../../constants/http.js';

// Mock dependencies
jest.mock('../../services/newsletter.js');

describe('Newsletter Controller', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {}
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

  describe('subscribe', () => {
    it('should successfully subscribe an email', async () => {
      const mockSubscribeData = { email: 'test@example.com' };
      req.body = mockSubscribeData;

      const mockResult = {
        message: 'Successfully subscribed',
        data: { email: mockSubscribeData.email },
        success: true
      };

      newsletterService.subscribe = jest.fn().mockResolvedValue(mockResult);

      await newsletterController.subscribe(req, res, next);

      expect(newsletterService.subscribe).toHaveBeenCalledWith(mockSubscribeData);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.CREATED);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle subscription errors', async () => {
      const mockSubscribeData = { email: 'test@example.com' };
      req.body = mockSubscribeData;

      const mockError = new Error('Subscription failed');
      newsletterService.subscribe = jest.fn().mockRejectedValue(mockError);

      await newsletterController.subscribe(req, res, next);

      expect(newsletterService.subscribe).toHaveBeenCalledWith(mockSubscribeData);
      expect(next).toHaveBeenCalledWith(mockError);
    });
  });

  describe('unsubscribe', () => {
    it('should successfully unsubscribe an email', async () => {
      const mockUnsubscribeData = { email: 'test@example.com' };
      req.body = mockUnsubscribeData;

      const mockResult = {
        message: 'Successfully unsubscribed',
        data: { email: mockUnsubscribeData.email },
        success: true
      };

      newsletterService.unsubscribe = jest.fn().mockResolvedValue(mockResult);

      await newsletterController.unsubscribe(req, res, next);

      expect(newsletterService.unsubscribe).toHaveBeenCalledWith(mockUnsubscribeData);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle unsubscription errors', async () => {
      const mockUnsubscribeData = { email: 'test@example.com' };
      req.body = mockUnsubscribeData;

      const mockError = new Error('Unsubscription failed');
      newsletterService.unsubscribe = jest.fn().mockRejectedValue(mockError);

      await newsletterController.unsubscribe(req, res, next);

      expect(newsletterService.unsubscribe).toHaveBeenCalledWith(mockUnsubscribeData);
      expect(next).toHaveBeenCalledWith(mockError);
    });
  });

  describe('create', () => {
    it('should successfully create a newsletter', async () => {
      const mockNewsletterData = {
        title: 'Test Newsletter',
        content: 'Newsletter content'
      };
      req.body = mockNewsletterData;

      const mockResult = {
        message: 'Newsletter created successfully',
        data: { ...mockNewsletterData, _id: 'mockId' },
        success: true
      };

      newsletterService.create = jest.fn().mockResolvedValue(mockResult);

      await newsletterController.create(req, res, next);

      expect(newsletterService.create).toHaveBeenCalledWith(mockNewsletterData);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.CREATED);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle newsletter creation errors', async () => {
      const mockNewsletterData = {
        title: 'Test Newsletter',
        content: 'Newsletter content'
      };
      req.body = mockNewsletterData;

      const mockError = new Error('Newsletter creation failed');
      newsletterService.create = jest.fn().mockRejectedValue(mockError);

      await newsletterController.create(req, res, next);

      expect(newsletterService.create).toHaveBeenCalledWith(mockNewsletterData);
      expect(next).toHaveBeenCalledWith(mockError);
    });
  });

  describe('query', () => {
    it('should successfully query newsletters', async () => {
      const mockQueryParams = {
        page: 1,
        limit: 10
      };
      req.query = mockQueryParams;

      const mockResult = {
        message: 'Newsletters retrieved successfully',
        data: {
          newsletters: [{ _id: 'newsletter1' }, { _id: 'newsletter2' }],
          pagination: { totalPages: 1, currentPage: 1 }
        },
        success: true
      };

      newsletterService.query = jest.fn().mockResolvedValue(mockResult);

      await newsletterController.query(req, res, next);

      expect(newsletterService.query).toHaveBeenCalledWith(mockQueryParams);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle newsletter query errors', async () => {
      const mockQueryParams = {
        page: 1,
        limit: 10
      };
      req.query = mockQueryParams;

      const mockError = new Error('Newsletter query failed');
      newsletterService.query = jest.fn().mockRejectedValue(mockError);

      await newsletterController.query(req, res, next);

      expect(newsletterService.query).toHaveBeenCalledWith(mockQueryParams);
      expect(next).toHaveBeenCalledWith(mockError);
    });
  });

  describe('schedule', () => {
    it('should successfully schedule a newsletter', async () => {
      const newsletterId = 'mockId';
      const scheduledDate = new Date('2023-12-31');
      
      req.params = { id: newsletterId };
      req.body = { scheduledDate: scheduledDate.toISOString() };

      const mockResult = {
        message: 'Newsletter scheduled successfully',
        data: { 
          newsletterId, 
          scheduledDate 
        },
        success: true
      };

      newsletterService.schedule = jest.fn().mockResolvedValue(mockResult);

      await newsletterController.schedule(req, res, next);

      expect(newsletterService.schedule).toHaveBeenCalledWith(newsletterId, scheduledDate);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle newsletter scheduling errors', async () => {
      const newsletterId = 'mockId';
      const scheduledDate = new Date('2023-12-31');
      
      req.params = { id: newsletterId };
      req.body = { scheduledDate: scheduledDate.toISOString() };

      const mockError = new Error('Newsletter scheduling failed');
      newsletterService.schedule = jest.fn().mockRejectedValue(mockError);

      await newsletterController.schedule(req, res, next);

      expect(newsletterService.schedule).toHaveBeenCalledWith(newsletterId, scheduledDate);
      expect(next).toHaveBeenCalledWith(mockError);
    });
  });
});
