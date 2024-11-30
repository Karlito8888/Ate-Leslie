import express from 'express';
import { userController } from '../../../controllers/user.controller.js';
import { verifyToken, isAdmin } from '../../../middleware/auth/authMiddleware.js';

const router = express.Router();

// Routes protégées pour les admins
router.get('/admins', verifyToken, isAdmin, userController.getAdmins);
router.put('/admin/:id', verifyToken, isAdmin, userController.updateAdmin);
router.put('/admin/:id/password', verifyToken, isAdmin, userController.changePassword);

export default router;
