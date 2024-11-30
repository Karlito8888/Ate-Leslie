// Constants
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user'
};

// ====== Error Handling ======
export class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode >= 500 ? 'error' : 'fail';
    Error.captureStackTrace(this, this.constructor);
  }
}

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    next(error instanceof ApiError ? error : new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'An unexpected error occurred'
    ));
  });
};

// ====== Validation ======
const VALIDATION_PATTERNS = {
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  USERNAME: /^[a-zA-Z][a-zA-Z0-9_]{2,29}$/
};

const VALIDATION_RULES = {
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 50
  },
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 30
  }
};

export const validate = {
  password: (password) => {
    if (!password || typeof password !== 'string') {
      return { isValid: false, message: 'Password is required' };
    }
    
    if (password.length < VALIDATION_RULES.PASSWORD.MIN_LENGTH) {
      return { 
        isValid: false, 
        message: `Password must be at least ${VALIDATION_RULES.PASSWORD.MIN_LENGTH} characters long` 
      };
    }

    if (password.length > VALIDATION_RULES.PASSWORD.MAX_LENGTH) {
      return { 
        isValid: false, 
        message: `Password cannot exceed ${VALIDATION_RULES.PASSWORD.MAX_LENGTH} characters` 
      };
    }
    
    if (!VALIDATION_PATTERNS.PASSWORD.test(password)) {
      return {
        isValid: false,
        message: 'Password must contain uppercase, lowercase, number, and special character'
      };
    }
    
    return { isValid: true };
  },

  email: (email) => {
    if (!email || typeof email !== 'string') {
      return { isValid: false, message: 'Email is required' };
    }
    
    if (!VALIDATION_PATTERNS.EMAIL.test(email)) {
      return { isValid: false, message: 'Invalid email format' };
    }
    
    return { isValid: true };
  },

  username: (username) => {
    if (!username || typeof username !== 'string') {
      return { isValid: false, message: 'Username is required' };
    }

    if (username.length < VALIDATION_RULES.USERNAME.MIN_LENGTH) {
      return { 
        isValid: false, 
        message: `Username must be at least ${VALIDATION_RULES.USERNAME.MIN_LENGTH} characters long` 
      };
    }

    if (username.length > VALIDATION_RULES.USERNAME.MAX_LENGTH) {
      return { 
        isValid: false, 
        message: `Username cannot exceed ${VALIDATION_RULES.USERNAME.MAX_LENGTH} characters` 
      };
    }
    
    if (!VALIDATION_PATTERNS.USERNAME.test(username)) {
      return {
        isValid: false,
        message: 'Username must start with a letter and contain only letters, numbers, and underscores'
      };
    }
    
    return { isValid: true };
  }
};

// ====== Response Helpers ======
export const sendResponse = (res, { statusCode = 200, success = true, message, data }) => {
  const response = {
    success,
    message,
    ...(data && { data })
  };
  
  res.status(statusCode).json(response);
};

export const sendError = (res, error) => {
  const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = error.message || 'An unexpected error occurred';
  
  const response = {
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  };
  
  res.status(statusCode).json(response);
};

// Services
export { sendEmail } from './services/email.js';
