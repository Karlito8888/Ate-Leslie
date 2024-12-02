import express from 'express';
import { HTTP_STATUS } from '../constants/http.js';
import authRoutes from './auth/index.js';
import userRoutes from './user/index.js';
import eventRoutes from './event/index.js';
import newsletterRoutes from './newsletter/index.js';
import contactRoutes from './contact/index.js';

export const configureRoutes = (app) => {
  // Health check route
  app.get('/health', (req, res) => {
    res.status(HTTP_STATUS.OK).json({
      status: 'success',
      message: 'Server is running'
    });
  });

  // Mount all routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/events', eventRoutes);
  app.use('/api/newsletter', newsletterRoutes);
  app.use('/api/contact', contactRoutes);
};

export default configureRoutes;
