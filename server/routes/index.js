import express from 'express';
import { authController, userController } from '../controllers/index.js';
import { verifyToken, isAdmin } from '../middleware/index.js';
import { HTTP_STATUS } from '../utils/index.js';

export const configureRoutes = (app) => {
  // Health check route
  app.get('/health', (req, res) => {
    res.status(HTTP_STATUS.OK).json({
      status: 'success',
      message: 'Server is running'
    });
  });

  // Auth routes
  const authRoutes = express.Router();
  
  // Public auth routes
  authRoutes.post('/register', authController.register);
  authRoutes.post('/login', authController.login);
  authRoutes.post('/forgot-password', authController.forgotPassword);
  authRoutes.post('/reset-password/:token', authController.resetPassword);
  
  // Protected profile routes
  authRoutes.use('/profile', verifyToken);
  authRoutes.get('/profile', authController.getProfile);
  authRoutes.put('/profile', authController.updateProfile);
  authRoutes.put('/profile/password', authController.changePassword);

  // User management routes (admin only)
  const userRoutes = express.Router();
  userRoutes.use(verifyToken, isAdmin);
  
  userRoutes.get('/admins', userController.getAdmins);
  userRoutes.get('/users', userController.getUsers);
  userRoutes.put('/admin/:id', userController.updateAdmin);
  userRoutes.put('/admin/:id/password', userController.changeAdminPassword);

  // Mount routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', userRoutes);

  // 404 handler
  app.use('*', (req, res) => {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      status: 'error',
      message: 'Route not found'
    });
  });
};
