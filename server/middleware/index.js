import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const configureMiddleware = (app) => {
  app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use('/uploads', express.static(join(__dirname, '../public/uploads')));
};
