import express from 'express';
import { authController } from '../../controllers/index.js';
import { requireAuth } from '../../middleware/index.js';

const router = express.Router();

// Public auth routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', requireAuth, authController.logout);

// Password management routes
router.post('/password/forgot', authController.forgotPassword);
router.put('/password/reset/:token', authController.resetPassword);
router.put('/password/change', requireAuth, authController.changePassword);

// Profile routes
router.get('/profile', requireAuth, authController.profile);
router.put('/profile', requireAuth, authController.updateProfile);

export default router;
