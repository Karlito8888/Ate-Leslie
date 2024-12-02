import { z } from 'zod';
import { baseSchema } from './base.js';

export const eventSchemas = {
  create: z.object({
    title: z.string()
      .min(3, 'Title must be at least 3 characters')
      .max(100, 'Title must be less than 100 characters'),
    description: z.string()
      .min(10, 'Description must be at least 10 characters')
      .max(1000, 'Description must be less than 1000 characters')
      .optional(),
    date: baseSchema.date,
    location: z.object({
      address: z.string().optional(),
      city: z.string().optional(),
      country: z.string().optional()
    }).optional(),
    images: z.array(z.string().url('Invalid image URL')).optional(),
    tags: z.array(z.string()).optional(),
    capacity: z.number().int().positive('Capacity must be a positive number').optional(),
    price: z.number().min(0, 'Price cannot be negative').optional(),
    isPublic: z.boolean().optional().default(true)
  }),

  update: z.object({
    title: z.string()
      .min(3, 'Title must be at least 3 characters')
      .max(100, 'Title must be less than 100 characters')
      .optional(),
    description: z.string()
      .min(10, 'Description must be at least 10 characters')
      .max(1000, 'Description must be less than 1000 characters')
      .optional(),
    date: baseSchema.date.optional(),
    location: z.object({
      address: z.string().optional(),
      city: z.string().optional(),
      country: z.string().optional()
    }).optional(),
    images: z.array(z.string().url('Invalid image URL')).optional(),
    tags: z.array(z.string()).optional(),
    capacity: z.number().int().positive('Capacity must be a positive number').optional(),
    price: z.number().min(0, 'Price cannot be negative').optional(),
    isPublic: z.boolean().optional()
  }),

  query: z.object({
    page: baseSchema.pagination.page,
    limit: baseSchema.pagination.limit,
    search: z.string().optional(),
    startDate: baseSchema.date.optional(),
    endDate: baseSchema.date.optional(),
    tags: z.array(z.string()).optional()
  })
};
