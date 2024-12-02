import express from 'express';
import { newsletterController } from '../../controllers/newsletter/index.js';
import { authenticate, checkPermission } from '../../middleware/index.js';
import { validateRequest } from '../../validators/index.js';
import { newsletterSchemas } from '../../validators/schemas/newsletter.js';
import { ROLES } from '../../config/permissions.js';

const router = express.Router();

// Public route to subscribe to the newsletter
router.post('/subscribe', 
  validateRequest(newsletterSchemas.subscribe),
  newsletterController.subscribe
);

// Public route to unsubscribe
router.post('/unsubscribe', 
  validateRequest(newsletterSchemas.unsubscribe),
  newsletterController.unsubscribe
);

// Protected routes requiring permissions
router.use(authenticate);

// Create a newsletter (admin only)
router.post('/', 
  checkPermission(ROLES.ADMIN),
  validateRequest(newsletterSchemas.create),
  newsletterController.create
);

// Search newsletters (admin only)
router.get('/', 
  checkPermission(ROLES.ADMIN),
  validateRequest(newsletterSchemas.query),
  newsletterController.query
);

// Schedule newsletter sending (admin only)
router.post('/:id/schedule', 
  checkPermission(ROLES.ADMIN),
  validateRequest(newsletterSchemas.schedule),
  newsletterController.schedule
);

export default router;
