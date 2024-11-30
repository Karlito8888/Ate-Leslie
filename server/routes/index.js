import express from 'express';
import { authController, userController, eventController, contactController, newsletterController } from '../controllers/index.js';
import { authenticate, authorize, requireAuth, requireAdmin, upload } from '../middleware/index.js';
import { HTTP_STATUS } from '../utils.js';

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
  authRoutes.post('/logout', requireAuth, authController.logout);
  
  // Password management routes
  authRoutes.post('/password/forgot', authController.forgotPassword);
  authRoutes.put('/password/reset/:token', authController.resetPassword);
  authRoutes.put('/password/change', requireAuth, authController.changePassword);
  
  // Profile routes
  authRoutes.get('/profile', requireAuth, authController.profile);
  authRoutes.put('/profile', requireAuth, authController.updateProfile);

  // Mount auth routes
  app.use('/api/auth', authRoutes);

  // User management routes (admin only)
  const userRoutes = express.Router();
  userRoutes.use(requireAdmin);
  
  userRoutes.get('/admins', userController.getAdmins);
  userRoutes.get('/users', userController.getUsers);
  userRoutes.put('/admin/:id', userController.updateAdmin);
  userRoutes.put('/admin/:id/password', userController.changeAdminPassword);

  // Mount user routes
  app.use('/api/users', userRoutes);

  // Event routes
  const eventRoutes = express.Router();
  eventRoutes.get('/events', eventController.getEvents);
  eventRoutes.get('/events/:id', eventController.getEvent);
  eventRoutes.post('/events', requireAdmin, upload.array('images', 5), eventController.createEvent);
  eventRoutes.put('/events/:id', requireAdmin, upload.array('images', 5), eventController.updateEvent);
  eventRoutes.delete('/events/:id', requireAdmin, eventController.deleteEvent);

  // Mount event routes
  app.use('/api/events', eventRoutes);

  // Newsletter routes
  const newsletterRoutes = express.Router();
  
  newsletterRoutes.put('/subscription', requireAuth, newsletterController.toggleSubscription);
  newsletterRoutes.post('/send', requireAdmin, newsletterController.sendNewsletter);

  // Mount newsletter routes
  app.use('/api/newsletter', newsletterRoutes);

  // Contact routes
  const contactRoutes = express.Router();
  contactRoutes.post('/contact', contactController.createContact);
  contactRoutes.get('/contact', requireAdmin, contactController.getContacts);
  contactRoutes.put('/contact/:id', requireAdmin, contactController.updateContactStatus);

  // Mount contact routes
  app.use('/api/contact', contactRoutes);
};
