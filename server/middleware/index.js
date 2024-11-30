import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { HTTP_STATUS, ApiError, verifyToken, hasPermission, config } from '../utils.js';
import { User } from '../models/index.js';

// ====== Configuration Middleware ======
export const configureMiddleware = (app) => {
  // Security middlewares
  app.use(cors({
    origin: config.client.url,
    ...config.cors
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
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (config.image.allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'Invalid file type. Only JPG, PNG and WebP are allowed.'
    ), false);
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: config.image.maxSize,
    files: 5
  }
});

// ====== Auth Middleware ======
export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication required');
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    next(new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid token'));
  }
};

export const authorize = (resource, action) => {
  return (req, res, next) => {
    const { role } = req.user;
    
    if (!hasPermission(role, resource, action)) {
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        'You do not have permission to perform this action'
      );
    }
    
    next();
  };
};

// Common middleware combinations
export const requireAuth = [authenticate];
export const requireAdmin = [authenticate, authorize('admin', 'access')];

// ====== Validation Middleware ======
export const validators = {
  // User registration validation
  validateRegistration: async (req, res, next) => {
    try {
      const { username, email, password, confirmPassword } = req.body;

      // Validate username
      if (!username || username.length < 3) {
        throw new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          'Username must be at least 3 characters long'
        );
      }

      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        throw new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          'Please provide a valid email address'
        );
      }

      // Validate password
      if (!password || password.length < 8) {
        throw new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          'Password must be at least 8 characters long'
        );
      }

      // Check password confirmation
      if (confirmPassword && password !== confirmPassword) {
        throw new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          'Passwords do not match'
        );
      }

      // Check if user already exists
      const existingUser = await User.findOne({ $or: [{ email }, { username }] });
      if (existingUser) {
        throw new ApiError(
          HTTP_STATUS.CONFLICT,
          existingUser.email === email 
            ? 'Email already exists'
            : 'Username already exists'
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  },

  // Login validation
  validateLogin: (req, res, next) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          'Please provide both email and password'
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  },

  // Profile update validation
  validateProfileUpdate: async (req, res, next) => {
    try {
      const { username, email } = req.body;
      const userId = req.user.id;

      if (username) {
        if (username.length < 3) {
          throw new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            'Username must be at least 3 characters long'
          );
        }

        const existingUsername = await User.findOne({
          username,
          _id: { $ne: userId }
        });
        if (existingUsername) {
          throw new ApiError(
            HTTP_STATUS.CONFLICT,
            'Username already exists'
          );
        }
      }

      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          throw new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            'Please provide a valid email address'
          );
        }

        const existingEmail = await User.findOne({
          email,
          _id: { $ne: userId }
        });
        if (existingEmail) {
          throw new ApiError(
            HTTP_STATUS.CONFLICT,
            'Email already exists'
          );
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  },

  // Password change validation
  validatePasswordChange: (req, res, next) => {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;

      if (!currentPassword || !newPassword) {
        throw new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          'Please provide both current and new password'
        );
      }

      if (newPassword.length < 8) {
        throw new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          'New password must be at least 8 characters long'
        );
      }

      if (confirmPassword && newPassword !== confirmPassword) {
        throw new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          'Passwords do not match'
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  },

  // Password reset validation
  validatePasswordReset: (req, res, next) => {
    try {
      const { password, confirmPassword } = req.body;

      if (!password || password.length < 8) {
        throw new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          'Password must be at least 8 characters long'
        );
      }

      if (confirmPassword && password !== confirmPassword) {
        throw new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          'Passwords do not match'
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  }
};

export default {
  configureMiddleware,
  upload,
  authenticate,
  authorize,
  requireAuth,
  requireAdmin,
  validators
};
