import express from 'express';
import { userController } from '../../controllers/index.js';
import { 
  requireAdmin, 
  validateRequest, 
  requirePermission 
} from '../../middleware/index.js';
import { userSchemas } from '../../validators/schemas/user.js';
import { PERMISSIONS } from '../../config/permissions.js';

const router = express.Router();

// Admins management routes
router.get('/admins', 
  requirePermission(PERMISSIONS.USER_MANAGE), 
  validateRequest(userSchemas.query), 
  userController.getAdmins
);

router.get('/users', 
  requirePermission(PERMISSIONS.USER_READ), 
  validateRequest(userSchemas.query), 
  userController.getUsers
);

router.put('/admin/:id', 
  requirePermission(PERMISSIONS.USER_MANAGE), 
  validateRequest(userSchemas.update), 
  userController.updateAdmin
);

router.put('/admin/:id/password', 
  requirePermission(PERMISSIONS.USER_MANAGE), 
  validateRequest(userSchemas.changePassword), 
  userController.changeAdminPassword
);

export default router;
