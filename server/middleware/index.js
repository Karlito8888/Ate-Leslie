import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { promises as fs } from 'fs';
import { HTTP_STATUS, ApiError, verifyToken, hasPermission, config } from '../utils.js';
import { User } from '../models/index.js';

// ====== Configuration Middleware ======
export const configureMiddleware = async (app) => {
  // Créer les répertoires d'uploads s'ils n'existent pas
  await fs.mkdir(config.app.uploadsDir, { recursive: true });
  await fs.mkdir(config.image.uploadDir, { recursive: true });

  // Security middlewares
  app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173', // URL par défaut pour le développement
    credentials: true
  }));

  // Body parsing middlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Static files
  app.use('/uploads', express.static(config.app.uploadsDir));
};

// ====== Upload Middleware ======
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.image.uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(8).toString('hex');
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (config.image.allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'Invalid file type. Only JPEG, PNG and WebP images are allowed.'
    ), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.image.maxSize
  }
});

// ====== Auth Middleware ======
export const authMiddleware = {
  authenticate: async (req, res, next) => {
    try {
      const token = req.cookies.token;
      if (!token) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication required');
      }

      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'User not found');
      }

      req.user = user;
      next();
    } catch (error) {
      next(new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid authentication'));
    }
  },

  authorize: (resource, action) => {
    return (req, res, next) => {
      if (!req.user) {
        return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication required'));
      }

      if (!hasPermission(req.user.role, resource, action)) {
        return next(new ApiError(HTTP_STATUS.FORBIDDEN, 'Permission denied'));
      }

      next();
    };
  }
};

// Common middleware combinations
export const requireAuth = [authMiddleware.authenticate];
export const requireAdmin = [authMiddleware.authenticate, authMiddleware.authorize('admin', 'access')];

export const { authenticate, authorize } = authMiddleware;

// ====== Validators ======
export const validators = {
  // Validation des champs individuels
  username: (value) => {
    if (!value || value.length < 3) {
      return { isValid: false, message: 'Username must be at least 3 characters long' };
    }
    if (!value.match(/^[a-zA-Z0-9_-]+$/)) {
      return { isValid: false, message: 'Username can only contain letters, numbers, underscores and hyphens' };
    }
    return { isValid: true, message: '' };
  },

  email: (value) => {
    if (!value || !value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return { isValid: false, message: 'Invalid email address' };
    }
    return { isValid: true, message: '' };
  },

  password: (value) => {
    if (!value || value.length < 8) {
      return { isValid: false, message: 'Password must be at least 8 characters long' };
    }
    if (!value.match(/[A-Z]/)) {
      return { isValid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!value.match(/[a-z]/)) {
      return { isValid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!value.match(/[0-9]/)) {
      return { isValid: false, message: 'Password must contain at least one number' };
    }
    return { isValid: true, message: '' };
  },

  phone: (value) => {
    if (!value) return { isValid: true, message: '' }; // Optional field
    if (!value.match(/^\+?[\d\s-]{10,}$/)) {
      return { isValid: false, message: 'Invalid phone number format' };
    }
    return { isValid: true, message: '' };
  },

  validateRegistration: (req, res, next) => {
    const { email, password, firstName, lastName } = req.body;

    const errors = [];

    // Email validation
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      errors.push('Invalid email address');
    }

    // Password validation
    if (!password || password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!password.match(/[A-Z]/)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!password.match(/[a-z]/)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!password.match(/[0-9]/)) {
      errors.push('Password must contain at least one number');
    }

    // Name validation
    if (!firstName || firstName.length < 2) {
      errors.push('First name must be at least 2 characters long');
    }

    if (!lastName || lastName.length < 2) {
      errors.push('Last name must be at least 2 characters long');
    }

    if (errors.length > 0) {
      return next(new ApiError(HTTP_STATUS.BAD_REQUEST, errors.join(', ')));
    }

    next();
  },

  validateLogin: (req, res, next) => {
    const { email, password } = req.body;

    const errors = [];

    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      errors.push('Invalid email address');
    }

    if (!password) {
      errors.push('Password is required');
    }

    if (errors.length > 0) {
      return next(new ApiError(HTTP_STATUS.BAD_REQUEST, errors.join(', ')));
    }

    next();
  },

  validateProfileUpdate: (req, res, next) => {
    const { email, firstName, lastName, currentPassword, newPassword } = req.body;

    const errors = [];

    if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      errors.push('Invalid email address');
    }

    if (firstName && firstName.length < 2) {
      errors.push('First name must be at least 2 characters long');
    }

    if (lastName && lastName.length < 2) {
      errors.push('Last name must be at least 2 characters long');
    }

    // Password update validation
    if (newPassword) {
      if (!currentPassword) {
        errors.push('Current password is required to set a new password');
      }

      if (newPassword.length < 8) {
        errors.push('New password must be at least 8 characters long');
      }

      if (!newPassword.match(/[A-Z]/)) {
        errors.push('New password must contain at least one uppercase letter');
      }

      if (!newPassword.match(/[a-z]/)) {
        errors.push('New password must contain at least one lowercase letter');
      }

      if (!newPassword.match(/[0-9]/)) {
        errors.push('New password must contain at least one number');
      }
    }

    if (errors.length > 0) {
      return next(new ApiError(HTTP_STATUS.BAD_REQUEST, errors.join(', ')));
    }

    next();
  },

  validatePasswordChange: (req, res, next) => {
    const { currentPassword, newPassword } = req.body;

    const errors = [];

    if (!currentPassword) {
      errors.push('Current password is required');
    }

    if (!newPassword) {
      errors.push('New password is required');
    } else {
      if (newPassword.length < 8) {
        errors.push('New password must be at least 8 characters long');
      }

      if (!newPassword.match(/[A-Z]/)) {
        errors.push('New password must contain at least one uppercase letter');
      }

      if (!newPassword.match(/[a-z]/)) {
        errors.push('New password must contain at least one lowercase letter');
      }

      if (!newPassword.match(/[0-9]/)) {
        errors.push('New password must contain at least one number');
      }
    }

    if (errors.length > 0) {
      return next(new ApiError(HTTP_STATUS.BAD_REQUEST, errors.join(', ')));
    }

    next();
  },

  validatePasswordReset: (req, res, next) => {
    const { password } = req.body;

    const errors = [];

    if (!password) {
      errors.push('Password is required');
    } else {
      if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
      }

      if (!password.match(/[A-Z]/)) {
        errors.push('Password must contain at least one uppercase letter');
      }

      if (!password.match(/[a-z]/)) {
        errors.push('Password must contain at least one lowercase letter');
      }

      if (!password.match(/[0-9]/)) {
        errors.push('Password must contain at least one number');
      }
    }

    if (errors.length > 0) {
      return next(new ApiError(HTTP_STATUS.BAD_REQUEST, errors.join(', ')));
    }

    next();
  }
};

export const { username, email, password, phone } = validators;

export default {
  configureMiddleware,
  upload,
  authMiddleware,
  requireAuth,
  requireAdmin,
  validators
};
