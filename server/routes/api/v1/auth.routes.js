import express from 'express';
import { authController } from '../../../controllers/auth.controller.js';
import { verifyToken } from '../../../middleware/auth/authMiddleware.js';

const router = express.Router();

// Routes publiques
router.post('/register', authController.register);
router.post('/login', authController.login);

// Routes protégées (nécessitent un token)
router.get('/profile', verifyToken, authController.getProfile);
router.put('/profile', verifyToken, authController.updateProfile);
router.put('/change-password', verifyToken, authController.changePassword);

export default router;
