import { z } from 'zod';
import validator from 'validator';

// Validations de base réutilisables
export const baseValidators = {
  email: (value) => ({
    isValid: validator.isEmail(value),
    message: 'Invalid email format'
  }),
  
  phone: (value) => ({
    isValid: validator.isMobilePhone(value, 'any'),
    message: 'Invalid phone number'
  }),
  
  username: (value) => ({
    isValid: /^[a-zA-Z0-9_]{3,20}$/.test(value),
    message: 'Username must be 3-20 characters, alphanumeric or underscore'
  }),
  
  password: (value) => ({
    isValid: value.length >= 8 && 
             /[A-Z]/.test(value) && 
             /[a-z]/.test(value) && 
             /[0-9]/.test(value),
    message: 'Password must be at least 8 characters long, with uppercase, lowercase, and number'
  }),
  
  stringLength: (value, min, max) => ({
    isValid: value.length >= min && value.length <= max,
    message: `Length must be between ${min} and ${max} characters`
  })
};

// Schémas de validation Zod existants
export const baseSchema = {
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format'),
  
  email: z.string().email('Invalid email format'),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number')
    .regex(/[!@#$%^&*()]/, 'Password must contain a special character'),
  
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name contains invalid characters'),
  
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .optional(),
  
  date: z.date().or(z.string().datetime()),
  
  pagination: z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(10)
  })
};

export default {
  baseValidators,
  baseSchema
};
