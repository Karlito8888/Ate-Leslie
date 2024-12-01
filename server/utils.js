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
export const CONSTANTS = {
  HTTP_STATUS: {
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
  },
  USER_ROLES: {
    ADMIN: 'admin',
    USER: 'user'
  },
  PERMISSIONS: {
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
  }
};

export const { HTTP_STATUS, USER_ROLES, PERMISSIONS } = CONSTANTS;

// ====== Configuration ======
export const config = {
  // Database configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ateleslie',
    options: {
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

  // App configuration
  app: {
    uploadsDir: process.env.UPLOADS_DIR || 'uploads',
  },

  // Image configuration
  image: {
    uploadDir: process.env.IMAGE_UPLOAD_DIR || 'uploads/images',
    thumbnailSizes: {
      small: 100,
      medium: 300,
      large: 600
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedFormats: ['jpeg', 'png', 'webp'],
    maxDimension: 5000
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
    if (mongoose.connection.readyState === 1) {
      console.log('MongoDB already connected');
      return;
    }
    
    const dbUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ateleslie';
    const dbOptions = {
      // Mongoose 6+ n'a plus besoin de ces options
    };
    
    await mongoose.connect(dbUri, dbOptions);
    console.log('MongoDB Connected:', dbUri);
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

// ====== Response Helpers ======
export const responseHelpers = {
  asyncHandler: (fn) => (req, res, next) => {
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
  },

  sendResponse: (res, { statusCode = 200, success = true, message, data }) => {
    res.status(statusCode).json({
      success,
      message,
      data
    });
  },

  sendError: (res, error) => {
    const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const message = error.message || 'An unexpected error occurred';
  
    res.status(statusCode).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

export const { asyncHandler, sendResponse, sendError } = responseHelpers;

// ====== Auth Helpers ======
export const authHelpers = {
  generateToken: (user) => {
    return jwt.sign(
      { 
        id: user._id,
        role: user.role
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  },

  verifyToken: (token) => {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid token');
    }
  },

  hasPermission: (userRole, resource, action) => {
    const rolePermissions = PERMISSIONS[userRole];
    if (!rolePermissions) return false;

    const resourcePermissions = rolePermissions[resource];
    if (!resourcePermissions) return false;

    return resourcePermissions.includes(action);
  }
};

export const { generateToken, verifyToken, hasPermission } = authHelpers;

// ====== Services ======
export const services = {
  image: {
    async validateImage(file) {
      if (!file || !file.path) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'No file provided');
      }

      try {
        // Vérifier que le fichier existe
        await fs.access(file.path);

        // Vérifier le type MIME
        const metadata = await sharp(file.path).metadata();
        const format = metadata.format;
        
        if (!['jpeg', 'png', 'webp'].includes(format)) {
          throw new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            `Invalid image format: ${format}. Allowed formats: jpeg, png, webp`
          );
        }

        // Vérifier la taille du fichier
        const stats = await fs.stat(file.path);
        const maxSize = config.image.maxSize;
        if (stats.size > maxSize) {
          throw new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            `File too large: ${(stats.size / 1024 / 1024).toFixed(2)}MB. Maximum allowed: ${(maxSize / 1024 / 1024).toFixed(2)}MB`
          );
        }

        // Vérifier les dimensions
        const maxDimension = config.image.maxDimension; // 5000px maximum
        if (metadata.width > maxDimension || metadata.height > maxDimension) {
          throw new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            `Image dimensions too large: ${metadata.width}x${metadata.height}. Maximum allowed: ${maxDimension}x${maxDimension}`
          );
        }

        return metadata;
      } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          `Invalid image file: ${error.message}`
        );
      }
    },

    async cleanupOnError(createdFiles) {
      try {
        for (const filePath of createdFiles) {
          await fs.unlink(filePath).catch(() => {});
        }
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    },

    async processImage(file) {
      const createdFiles = [];
      try {
        // Valider l'image avant traitement
        const metadata = await this.validateImage(file);

        // Créer les dossiers nécessaires
        await fs.mkdir('uploads/test/thumbnails', { recursive: true });

        const result = {
          original: {
            path: file.path,
            width: metadata.width,
            height: metadata.height
          },
          thumbnails: {}
        };

        // Créer les vignettes
        for (const [size, width] of Object.entries(config.image.thumbnailSizes)) {
          // Si l'image originale est plus petite que la vignette, utiliser l'original
          if (metadata.width <= width && size !== 'small') {
            result.thumbnails[size] = {
              path: file.path,
              width: metadata.width,
              height: metadata.height
            };
            continue;
          }

          // Calculer la hauteur proportionnelle
          const height = Math.round(width * (metadata.height / metadata.width));
          
          // Créer le chemin pour la vignette
          const thumbnailFilename = `${size}_${path.basename(file.path)}`;
          const thumbnailPath = path.join('uploads/test/thumbnails', thumbnailFilename);
          
          try {
            // Créer la vignette
            await sharp(file.path)
              .resize(width, height, {
                fit: 'cover',
                withoutEnlargement: true
              })
              .toFile(thumbnailPath);
            
            createdFiles.push(thumbnailPath);
            result.thumbnails[size] = {
              path: thumbnailPath,
              width,
              height
            };
          } catch (error) {
            // Si une vignette échoue, nettoyer et relancer l'erreur
            await this.cleanupOnError(createdFiles);
            throw new Error(`Error creating ${size} thumbnail: ${error.message}`);
          }
        }

        return result;
      } catch (error) {
        // En cas d'erreur, nettoyer tous les fichiers créés
        await this.cleanupOnError(createdFiles);
        throw new Error(`Error processing image: ${error.message}`);
      }
    },

    async deleteImage(imageData) {
      try {
        // Supprimer l'original seulement s'il est différent des vignettes
        const thumbnailPaths = Object.values(imageData.thumbnails).map(t => t.path);
        if (!thumbnailPaths.includes(imageData.original.path)) {
          await fs.unlink(imageData.original.path);
        }

        // Supprimer les vignettes (sauf celles qui pointent vers l'original)
        for (const [size, thumbnail] of Object.entries(imageData.thumbnails)) {
          if (thumbnail.path !== imageData.original.path) {
            await fs.unlink(thumbnail.path);
          }
        }
      } catch (error) {
        throw new Error(`Error deleting image: ${error.message}`);
      }
    }
  },

  email: {
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
  }
};

export const { image: imageService, email: emailService } = services;

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
  CONSTANTS,
  responseHelpers,
  authHelpers,
  services,
  createAdmins
};
