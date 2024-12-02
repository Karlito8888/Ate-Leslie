import { databaseConfig } from './database.js';
import { jwtConfig } from './jwt.js';
import { serverConfig } from './server.js';
import { uploadsConfig } from './uploads.js';
import { EMAIL_CONFIG } from './email.js';
import { USER_ROLES } from '../constants/roles.js';

export const config = {
  database: databaseConfig,
  jwt: jwtConfig,
  server: serverConfig,
  uploads: uploadsConfig,
  email: EMAIL_CONFIG,
  
  // Configuration centralisée des permissions
  permissions: {
    [USER_ROLES.ADMIN]: {
      users: ['read', 'update', 'delete'],
      admins: ['read', 'update', 'changePassword'],
      events: ['create', 'read', 'update', 'delete'],
      newsletters: ['send', 'manage'],
      contacts: ['read', 'update', 'delete']
    },
    [USER_ROLES.USER]: {
      profile: ['read', 'update'],
      events: ['read'],
      newsletters: ['subscribe'],
      contacts: ['create']
    }
  },

  // Validation centralisée
  validation: {
    username: {
      minLength: 3,
      maxLength: 20,
      allowedChars: /^[a-zA-Z0-9_]+$/
    },
    password: {
      minLength: 8,
      requireSpecialChar: true,
      requireNumber: true,
      requireUppercase: true
    },
    email: {
      allowedDomains: null, // Optionnel : liste de domaines autorisés
      maxLength: 100
    }
  }
};
