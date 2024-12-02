import { z } from 'zod';
import { baseSchema } from './base.js';
import { ROLES } from '../../config/permissions.js';

// Liste des intérêts prédéfinis
const PREDEFINED_INTERESTS = [
  'technology', 
  'arts', 
  'sports', 
  'music', 
  'travel', 
  'food', 
  'science', 
  'education'
];

export const userSchemas = {
  // Schéma de création d'utilisateur
  create: z.object({
    username: baseSchema.username,
    email: baseSchema.email,
    password: baseSchema.password,
    confirmPassword: z.string(),
    role: z.enum(Object.values(ROLES)).default(ROLES.USER),
    interests: z.array(z.enum(PREDEFINED_INTERESTS)).optional(),
    newsletterSubscribed: z.boolean().default(false),
    phoneNumber: baseSchema.phone.optional()
  }).refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  }),

  // Schéma de mise à jour du profil
  update: z.object({
    username: baseSchema.username.optional(),
    email: baseSchema.email.optional(),
    phoneNumber: baseSchema.phone.optional(),
    interests: z.array(z.enum(PREDEFINED_INTERESTS)).optional(),
    newsletterSubscribed: z.boolean().optional(),
    role: z.enum(Object.values(ROLES)).optional()
  }),

  // Schéma de connexion
  login: z.object({
    email: baseSchema.email,
    password: z.string().min(1, 'Password is required')
  }),

  // Schéma de changement de mot de passe
  changePassword: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: baseSchema.password,
    confirmNewPassword: z.string()
  }).refine(data => data.newPassword === data.confirmNewPassword, {
    message: 'New passwords do not match',
    path: ['confirmNewPassword']
  }),

  // Schéma de requête pour lister les utilisateurs
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().optional().default(10),
    search: z.string().optional(),
    role: z.enum(Object.values(ROLES)).optional()
  })
};

// Exporter les intérêts pour référence
export const INTERESTS = PREDEFINED_INTERESTS;
