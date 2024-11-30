import dotenv from 'dotenv';
import mongoose from 'mongoose';
import crypto from 'crypto';
import sharp from 'sharp';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import { promises as fs } from 'fs';

// Load environment variables
dotenv.config();

// ====== Constants ======
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

// Role-based permissions
export const PERMISSIONS = {
  USER: {
    profile: ['read', 'update'],
    newsletter: ['subscribe', 'unsubscribe'],
    events: ['read'],
    contact: ['create']
  },
  ADMIN: {
    users: ['read', 'update', 'delete'],
    admins: ['read', 'update', 'changePassword'],
    newsletter: ['read', 'send'],
    events: ['create', 'read', 'update', 'delete'],
    contact: ['read', 'update']
  }
};

// ====== Configuration ======
export const config = {
  // Database configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ateleslie',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex'),
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },

  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    environment: process.env.NODE_ENV || 'development'
  },

  // Image configuration
  image: {
    uploadDir: 'uploads/events',
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    thumbnailSizes: {
      small: 100,
      medium: 300,
      large: 600
    }
  },

  // Email configuration
  email: {
    from: process.env.EMAIL_FROM || 'noreply@ateleslie.com',
    smtp: {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    }
  }
};

// ====== Database ======
export const connectDB = async () => {
  try {
    await mongoose.connect(config.database.uri, config.database.options);
    console.log('MongoDB Connected:', config.database.uri);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
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
    console.error('Async handler caught error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      originalError: error
    });

    next(error instanceof ApiError ? error : new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      error.message || 'An unexpected error occurred'
    ));
  });
};

// ====== Response Helpers ======
export const sendResponse = (res, { statusCode = 200, success = true, message, data }) => {
  res.status(statusCode).json({
    success,
    message,
    data
  });
};

export const sendError = (res, error) => {
  const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = error.message || 'An unexpected error occurred';
  
  res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? error : undefined
  });
};

// ====== Auth Helpers ======
export const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id,
      role: user.role
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid token');
  }
};

export const hasPermission = (userRole, resource, action) => {
  const rolePermissions = PERMISSIONS[userRole];
  if (!rolePermissions) return false;

  const resourcePermissions = rolePermissions[resource];
  if (!resourcePermissions) return false;

  return resourcePermissions.includes(action);
};

// ====== Image Service ======
export const imageService = {
  async processImage(file) {
    const originalDir = path.join(config.image.uploadDir, 'original');
    const thumbnailsDir = path.join(config.image.uploadDir, 'thumbnails');
    
    await fs.mkdir(originalDir, { recursive: true });
    await fs.mkdir(thumbnailsDir, { recursive: true });

    const metadata = await sharp(file.path).metadata();
    const originalWidth = metadata.width;

    const originalFilename = `original_${file.filename}`;
    const originalPath = path.join(originalDir, originalFilename);
    await fs.rename(file.path, originalPath);

    const imageInfo = {
      original: {
        filename: originalFilename,
        path: originalPath,
        width: metadata.width,
        height: metadata.height
      },
      thumbnails: {}
    };

    for (const [size, targetWidth] of Object.entries(config.image.thumbnailSizes)) {
      if (targetWidth < originalWidth) {
        const thumbnailFilename = `${size}_${file.filename}`;
        const thumbnailPath = path.join(thumbnailsDir, thumbnailFilename);

        await sharp(originalPath)
          .resize(targetWidth, null, { withoutEnlargement: true })
          .toFile(thumbnailPath);

        imageInfo.thumbnails[size] = {
          filename: thumbnailFilename,
          path: thumbnailPath
        };
      }
    }

    return imageInfo;
  },

  async deleteImage(imageInfo) {
    try {
      if (imageInfo.original?.path) {
        await fs.unlink(imageInfo.original.path);
      }

      for (const thumbnail of Object.values(imageInfo.thumbnails || {})) {
        if (thumbnail?.path) {
          await fs.unlink(thumbnail.path);
        }
      }
    } catch (error) {
      console.error('Error deleting image files:', error);
      throw error;
    }
  }
};

// ====== Email Service ======
export const emailService = {
  async sendEmail(to, subject, html) {
    // TODO: Implement email sending logic
    console.log('Sending email to:', to);
    console.log('Subject:', subject);
    console.log('Content:', html);
  },

  async sendPasswordReset(user, resetToken) {
    const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const html = `
      <h1>Password Reset Request</h1>
      <p>Please click the link below to reset your password:</p>
      <a href="${resetURL}">${resetURL}</a>
      <p>If you didn't request this, please ignore this email.</p>
    `;

    await this.sendEmail(
      user.email,
      'Password Reset Request',
      html
    );
  },

  async sendWelcome(user) {
    const html = `
      <h1>Welcome to Ate Leslie!</h1>
      <p>We're excited to have you on board.</p>
      <p>Your account has been successfully created.</p>
    `;

    await this.sendEmail(
      user.email,
      'Welcome to Ate Leslie',
      html
    );
  }
};

// ====== Admin Management ======
export const createAdmins = async (force = false) => {
  const defaultAdmins = [
    {
      email: process.env.ADMIN_EMAIL || 'admin@example.com',
      password: process.env.ADMIN_PASSWORD || 'Admin123!',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin'
    }
  ];

  try {
    if (force) {
      await User.deleteMany({ role: 'admin' });
      console.log('Existing admin accounts deleted');
    }

    for (const adminData of defaultAdmins) {
      const existingAdmin = await User.findOne({ email: adminData.email });
      
      if (existingAdmin) {
        console.log(`Admin ${adminData.email} already exists`);
        continue;
      }

      const salt = await bcryptjs.genSalt(10);
      const hashedPassword = await bcryptjs.hash(adminData.password, salt);

      await User.create({
        ...adminData,
        password: hashedPassword,
        isVerified: true
      });

      console.log(`Admin ${adminData.email} created successfully`);
    }

    console.log('Admin creation completed');
  } catch (error) {
    console.error('Error creating admin accounts:', error);
    throw error;
  }
};

export default {
  config,
  connectDB,
  HTTP_STATUS,
  USER_ROLES,
  PERMISSIONS,
  ApiError,
  asyncHandler,
  sendResponse,
  sendError,
  generateToken,
  verifyToken,
  hasPermission,
  imageService,
  emailService,
  createAdmins
};
