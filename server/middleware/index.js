import { configureMiddleware } from './config/index.js';
import { upload } from './upload/index.js';
import { 
  authenticate, 
  authorize, 
  requireAuth, 
  requireAdmin 
} from './auth/index.js';
import { requirePermission } from './checkPermission.js';
import { validateRequest } from '../validators/index.js';

// Validation des champs individuels
const fieldValidators = {
  username: function(value) {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return {
      isValid: usernameRegex.test(value),
      message: 'Username must be 3-20 characters, alphanumeric or underscore'
    };
  },
  
  email: function(value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return {
      isValid: emailRegex.test(value),
      message: 'Invalid email format'
    };
  },
  
  password: function(value) {
    return {
      isValid: value.length >= 8 && 
               /[A-Z]/.test(value) && 
               /[a-z]/.test(value) && 
               /[0-9]/.test(value),
      message: 'Password must be at least 8 characters, with uppercase, lowercase, and number'
    };
  },
  
  phone: function(value) {
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    return {
      isValid: !value || phoneRegex.test(value),
      message: 'Invalid phone number format'
    };
  }
};

// Fonctions de validation de requête (placeholders)
const requestValidators = {
  validateRegistration: function() {
    // TODO: Implémenter la validation complète de l'inscription
    return function(req, res, next) { next(); };
  },
  
  validateLogin: function() {
    // TODO: Implémenter la validation de connexion
    return function(req, res, next) { next(); };
  },
  
  validateProfileUpdate: function() {
    // TODO: Implémenter la validation de mise à jour de profil
    return function(req, res, next) { next(); };
  },
  
  validatePasswordChange: function() {
    // TODO: Implémenter la validation de changement de mot de passe
    return function(req, res, next) { next(); };
  },
  
  validatePasswordReset: function() {
    // TODO: Implémenter la validation de réinitialisation de mot de passe
    return function(req, res, next) { next(); };
  }
};

// Exports individuels
export const username = fieldValidators.username;
export const email = fieldValidators.email;
export const password = fieldValidators.password;
export const phone = fieldValidators.phone;

export const validateRegistration = requestValidators.validateRegistration;
export const validateLogin = requestValidators.validateLogin;
export const validateProfileUpdate = requestValidators.validateProfileUpdate;
export const validatePasswordChange = requestValidators.validatePasswordChange;
export const validatePasswordReset = requestValidators.validatePasswordReset;

// Exports groupés
export { 
  configureMiddleware,
  upload,
  authenticate, 
  authorize, 
  requireAuth, 
  requireAdmin,
  requirePermission,
  validateRequest
};

// Alias d'export
export { requirePermission as checkPermission };
