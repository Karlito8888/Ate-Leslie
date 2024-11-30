import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { HTTP_STATUS, asyncHandler, ApiError } from '../utils/index.js';

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

// ====== Auth Middleware ======
export const verifyToken = asyncHandler(async (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    throw new ApiError(
      HTTP_STATUS.UNAUTHORIZED,
      'Accès non autorisé - Token manquant'
    );
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (error) {
    throw new ApiError(
      HTTP_STATUS.UNAUTHORIZED,
      'Token invalide ou expiré'
    );
  }
});

export const isAdmin = asyncHandler(async (req, res, next) => {
  if (req.user?.role !== 'admin') {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      'Accès réservé aux administrateurs'
    );
  }
  next();
});

// ====== Validation Middleware ======
export const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      const { error } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        const errorMessage = error.details
          .map(detail => detail.message)
          .join(', ');

        throw new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          `Données invalides: ${errorMessage}`
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};
