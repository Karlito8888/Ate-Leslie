import { z } from 'zod';
import { baseSchema } from './base.js';

export const contactSchemas = {
  create: z.object({
    firstName: z.string()
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name must be less than 50 characters'),
    lastName: z.string()
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name must be less than 50 characters'),
    email: baseSchema.email,
    phone: z.string()
      .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
      .optional(),
    address: z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      country: z.string().optional(),
      postalCode: z.string().optional()
    }).optional(),
    tags: z.array(z.string()).optional(),
    notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
    source: z.enum(['website', 'event', 'referral', 'other']).optional()
  }),

  update: z.object({
    firstName: z.string()
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name must be less than 50 characters')
      .optional(),
    lastName: z.string()
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name must be less than 50 characters')
      .optional(),
    email: baseSchema.email.optional(),
    phone: z.string()
      .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
      .optional(),
    address: z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      country: z.string().optional(),
      postalCode: z.string().optional()
    }).optional(),
    tags: z.array(z.string()).optional(),
    notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
    source: z.enum(['website', 'event', 'referral', 'other']).optional()
  }),

  query: z.object({
    page: baseSchema.pagination.page,
    limit: baseSchema.pagination.limit,
    search: z.string().optional(),
    tags: z.array(z.string()).optional(),
    source: z.enum(['website', 'event', 'referral', 'other']).optional()
  })
};
