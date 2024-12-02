import { newsletterService } from '../../services/newsletter.js';
import { responseHelpers } from '../../utils/response.js';
import { HTTP_STATUS } from '../../constants/http.js';

const { sendResponse } = responseHelpers;

export const newsletterController = {
  /**
   * Subscribe to the newsletter
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Next middleware
   */
  async subscribe(req, res, next) {
    try {
      const result = await newsletterService.subscribe(req.body);
      
      sendResponse(res, {
        statusCode: HTTP_STATUS.CREATED,
        ...result
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Unsubscribe from the newsletter
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Next middleware
   */
  async unsubscribe(req, res, next) {
    try {
      const result = await newsletterService.unsubscribe(req.body);
      
      sendResponse(res, {
        statusCode: HTTP_STATUS.OK,
        ...result
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create a newsletter
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Next middleware
   */
  async create(req, res, next) {
    try {
      const result = await newsletterService.create(req.body);
      
      sendResponse(res, {
        statusCode: HTTP_STATUS.CREATED,
        ...result
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Search newsletters
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Next middleware
   */
  async query(req, res, next) {
    try {
      const result = await newsletterService.query(req.query);
      
      sendResponse(res, {
        statusCode: HTTP_STATUS.OK,
        ...result
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Schedule newsletter sending
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Next middleware
   */
  async schedule(req, res, next) {
    try {
      const { id } = req.params;
      const { scheduledDate } = req.body;
      
      const result = await newsletterService.schedule(id, new Date(scheduledDate));
      
      sendResponse(res, {
        statusCode: HTTP_STATUS.OK,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }
};
