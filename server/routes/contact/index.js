import express from 'express';
import { contactController } from '../../controllers/index.js';
import { 
  validateRequest, 
  requirePermission 
} from '../../middleware/index.js';
import { contactSchemas } from '../../validators/schemas/contact.js';
import { PERMISSIONS } from '../../config/permissions.js';

const router = express.Router();

// Public routes
router.post('/contacts', 
  validateRequest(contactSchemas.create), 
  contactController.createContact
);

// Admin routes
router.get('/contacts', 
  requirePermission(PERMISSIONS.CONTACT_READ), 
  validateRequest(contactSchemas.query), 
  contactController.getContacts
);

router.put(
  '/contacts/:id/status', 
  requirePermission(PERMISSIONS.CONTACT_MANAGE), 
  validateRequest(contactSchemas.update), 
  contactController.updateContactStatus
);

export default router;
