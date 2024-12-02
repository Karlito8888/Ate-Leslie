import { Newsletter, User } from '../models/index.js';
import { newsletterSchemas } from '../validators/schemas/newsletter.js';
import { ApiError } from '../utils/index.js';
import { HTTP_STATUS } from '../constants/http.js';
import { emailService } from './email.js';

class NewsletterService {
  /**
   * Subscribe a user to the newsletter
   * @param {Object} subscribeData - Subscription data
   * @returns {Promise<Object>} Subscription result
   */
  async subscribe(subscribeData) {
    try {
      // Validate subscription data
      const validatedData = newsletterSchemas.subscribe.parse(subscribeData);

      // Check if email exists
      let subscriber = await User.findOne({ email: validatedData.email });

      if (!subscriber) {
        // Create a new user if not existing
        subscriber = await User.create({
          email: validatedData.email,
          username: validatedData.firstName || validatedData.email.split('@')[0],
          interests: validatedData.interests || [],
          newsletterSubscribed: true
        });
      } else {
        // Update preferences for existing user
        subscriber.newsletterSubscribed = true;
        subscriber.interests = [
          ...new Set([...subscriber.interests, ...(validatedData.interests || [])])
        ];
        await subscriber.save();
      }

      // Create or update newsletter subscription
      const newsletterSubscription = await Newsletter.findOneAndUpdate(
        { email: validatedData.email },
        {
          email: validatedData.email,
          firstName: validatedData.firstName,
          interests: validatedData.interests || [],
          preferences: validatedData.preferences || {},
          source: validatedData.source || 'website',
          subscribedAt: new Date()
        },
        { upsert: true, new: true }
      );

      return {
        message: 'Successfully subscribed to newsletter',
        data: newsletterSubscription
      };
    } catch (error) {
      if (error.name === 'ZodError') {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid subscription data', error.errors);
      }
      throw error;
    }
  }

  /**
   * Unsubscribe a user from the newsletter
   * @param {Object} unsubscribeData - Unsubscription data
   * @returns {Promise<Object>} Unsubscription result
   */
  async unsubscribe(unsubscribeData) {
    try {
      // Validate unsubscription data
      const validatedData = newsletterSchemas.unsubscribe.parse(unsubscribeData);

      // Update user
      const user = await User.findOne({ email: validatedData.email });
      if (user) {
        user.newsletterSubscribed = false;
        await user.save();
      }

      // Remove newsletter subscription
      const result = await Newsletter.findOneAndDelete({ 
        email: validatedData.email 
      });

      if (!result) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Subscription not found');
      }

      return {
        message: 'Successfully unsubscribed from newsletter',
        data: { 
          email: validatedData.email,
          reason: validatedData.reason 
        }
      };
    } catch (error) {
      if (error.name === 'ZodError') {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid unsubscription data', error.errors);
      }
      throw error;
    }
  }

  /**
   * Create a newsletter draft
   * @param {Object} newsletterData - Newsletter data
   * @returns {Promise<Object>} Created newsletter
   */
  async create(newsletterData) {
    try {
      // Validate newsletter data
      const validatedData = newsletterSchemas.create.parse(newsletterData);

      const newsletter = await Newsletter.create({
        ...validatedData,
        status: 'draft',
        createdAt: new Date()
      });

      return {
        message: 'Newsletter draft created successfully',
        data: newsletter
      };
    } catch (error) {
      if (error.name === 'ZodError') {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid newsletter data', error.errors);
      }
      throw error;
    }
  }

  /**
   * Search and filter newsletters
   * @param {Object} queryParams - Search parameters
   * @returns {Promise<Object>} Search results
   */
  async query(queryParams) {
    try {
      // Validate query parameters
      const validatedParams = newsletterSchemas.query.parse(queryParams);

      const { 
        page = 1, 
        limit = 10, 
        search, 
        category, 
        tags, 
        status 
      } = validatedParams;

      // Build search filters
      const filter = {};
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } }
        ];
      }
      if (category) filter.category = category;
      if (tags) filter.tags = { $in: tags };
      if (status) filter.status = status;

      // Pagination
      const skip = (page - 1) * limit;

      // Search with pagination
      const newsletters = await Newsletter.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Newsletter.countDocuments(filter);

      return {
        message: 'Newsletters retrieved successfully',
        data: {
          newsletters,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      };
    } catch (error) {
      if (error.name === 'ZodError') {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid query parameters', error.errors);
      }
      throw error;
    }
  }

  /**
   * Send a newsletter
   * @param {string} newsletterId - Newsletter ID
   * @returns {Promise<Object>} Sending result
   */
  async send(newsletterId) {
    try {
      // Retrieve the newsletter
      const newsletter = await Newsletter.findById(newsletterId);
      if (!newsletter) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Newsletter not found');
      }

      // Check status
      if (newsletter.status !== 'scheduled') {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Newsletter is not ready to be sent');
      }

      // Retrieve subscribers
      const query = { 
        newsletterSubscribed: true 
      };
      
      // Filter by category if specified
      if (newsletter.category) {
        query.interests = { $in: [newsletter.category] };
      }

      const subscribers = await User.find(query)
        .select('email name interests');

      // Send the newsletter
      const result = await emailService.sendNewsletter(
        {
          title: newsletter.title,
          content: newsletter.content,
          category: newsletter.category
        },
        subscribers
      );

      // Update newsletter status
      newsletter.status = 'sent';
      newsletter.sentAt = new Date();
      newsletter.openRate = 0;  // To be updated dynamically
      newsletter.clickRate = 0; // To be updated dynamically
      await newsletter.save();

      return result;
    } catch (error) {
      console.error('Newsletter sending error:', error);
      throw error;
    }
  }

  /**
   * Schedule a newsletter
   * @param {string} newsletterId - Newsletter ID
   * @param {Date} scheduledDate - Scheduling date
   * @returns {Promise<Object>} Updated newsletter
   */
  async schedule(newsletterId, scheduledDate) {
    try {
      const newsletter = await Newsletter.findByIdAndUpdate(
        newsletterId,
        { 
          status: 'scheduled', 
          scheduledDate 
        },
        { new: true }
      );

      if (!newsletter) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Newsletter not found');
      }

      // TODO: Implement a scheduled task system (e.g., node-cron)
      // Simplified example: 
      setTimeout(async () => {
        try {
          await this.send(newsletterId);
        } catch (error) {
          console.error('Scheduled newsletter sending error:', error);
        }
      }, scheduledDate.getTime() - Date.now());

      return {
        message: 'Newsletter scheduled successfully',
        data: newsletter
      };
    } catch (error) {
      throw error;
    }
  }
}

export const newsletterService = new NewsletterService();
