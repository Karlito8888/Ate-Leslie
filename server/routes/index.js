import express from 'express';
import { authController, userController } from '../controllers/index.js';
import { newsletterController } from '../controllers/newsletter.controller.js';
import { eventController } from '../controllers/event.controller.js';
import { contactController } from '../controllers/contact.controller.js';
import { verifyToken, isAdmin } from '../middleware/index.js';
import upload from '../middleware/upload.js';
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

  // Event routes
  const eventRoutes = express.Router();
  eventRoutes.get('/events', eventController.getEvents);
  eventRoutes.get('/events/:id', eventController.getEvent);
  eventRoutes.post('/events', verifyToken, isAdmin, upload.array('images', 5), eventController.createEvent);
  eventRoutes.put('/events/:id', verifyToken, isAdmin, upload.array('images', 5), eventController.updateEvent);
  eventRoutes.delete('/events/:id', verifyToken, isAdmin, eventController.deleteEvent);

  // Newsletter routes
  const newsletterRoutes = express.Router();
  
  // Route pour s'inscrire/se désinscrire (utilisateur connecté)
  newsletterRoutes.put('/subscription', verifyToken, newsletterController.toggleSubscription);
  
  // Route pour envoyer une newsletter (admin uniquement)
  newsletterRoutes.post('/send', verifyToken, isAdmin, newsletterController.sendNewsletter);

  // Contact routes
  const contactRoutes = express.Router();
  contactRoutes.post('/contact', contactController.createContact);
  contactRoutes.get('/contact', verifyToken, isAdmin, contactController.getContacts);
  contactRoutes.put('/contact/:id', verifyToken, isAdmin, contactController.updateContactStatus);

  // Mount routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/events', eventRoutes);
  app.use('/api/v1/newsletter', newsletterRoutes);
  app.use('/api/v1/contact', contactRoutes);

  // 404 handler
  app.use('*', (req, res) => {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      status: 'error',
      message: 'Route not found'
    });
  });
};
