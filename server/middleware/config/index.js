import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { promises as fs } from 'fs';
import path from 'path';
import { config } from '../../config/index.js';

export const configureMiddleware = async (app) => {
  const uploadsDir = path.join(process.cwd(), config.uploads.dir);
  const imageUploadDir = path.join(process.cwd(), config.uploads.image.uploadDir);

  // Créer les répertoires d'uploads s'ils n'existent pas
  await fs.mkdir(uploadsDir, { recursive: true });
  await fs.mkdir(imageUploadDir, { recursive: true });

  // Security middlewares
  app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
  }));

  // Body parsing middlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Static files
  app.use('/uploads', express.static(uploadsDir));
};

export default configureMiddleware;
