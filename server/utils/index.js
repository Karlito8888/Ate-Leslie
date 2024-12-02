export * from './database.js';
export * from './auth.js';
export * from './response.js';
export * from './image.js';
export * from './error.js';

export { ApiError } from './error.js';
export { imageService } from './image.js';
export { responseHelpers } from './response.js';
export { config } from '../config/index.js';
export { authHelpers } from './auth.js';

export { HTTP_STATUS } from '../constants/http.js';
export { USER_ROLES } from '../constants/roles.js';

// Centraliser les utilitaires génériques
export const utils = {
  formatDate: (date) => new Date(date).toISOString().split('T')[0],
  generateRandomString: (length = 10) => 
    Math.random().toString(36).substring(2, length + 2),
  sanitizeInput: (input) => input.trim().replace(/[<>]/g, '')
};
