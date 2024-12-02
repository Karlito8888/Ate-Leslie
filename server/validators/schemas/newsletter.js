import { z } from 'zod';
import { baseSchema } from './base.js';
import { INTERESTS } from './user.js';

export const newsletterSchemas = {
  subscribe: z.object({
    email: baseSchema.email,
    firstName: z.string()
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name must be less than 50 characters')
      .optional(),
    interests: z.array(z.enum(INTERESTS)).optional(),
    preferences: z.object({
      events: z.boolean().optional().default(true),
      news: z.boolean().optional().default(true),
      promotions: z.boolean().optional().default(false)
    }).optional(),
    source: z.enum(['website', 'event', 'social_media']).optional()
  }),

  unsubscribe: z.object({
    email: baseSchema.email,
    reason: z.string().optional()
  }),

  create: z.object({
    title: z.string()
      .min(3, 'Title must be at least 3 characters')
      .max(100, 'Title must be less than 100 characters'),
    content: z.string()
      .min(10, 'Content must be at least 10 characters')
      .max(5000, 'Content must be less than 5000 characters'),
    category: z.enum(INTERESTS).optional(),
    tags: z.array(z.string()).optional(),
    scheduledDate: baseSchema.date.optional()
  }),

  query: z.object({
    page: baseSchema.pagination.page,
    limit: baseSchema.pagination.limit,
    search: z.string().optional(),
    category: z.enum(INTERESTS).optional(),
    tags: z.array(z.string()).optional(),
    status: z.enum(['draft', 'scheduled', 'sent']).optional()
  })
};
