import express from 'express';
import { eventController } from '../../controllers/index.js';
import { 
  requireAuth, 
  validateRequest, 
  requirePermission,
  upload 
} from '../../middleware/index.js';
import { eventSchemas } from '../../validators/schemas/event.js';
import { PERMISSIONS } from '../../config/permissions.js';

// Create a new instance of the Express router
const router = express.Router();

// Public routes for retrieving events
router.get('/events', 
  validateRequest(eventSchemas.query), 
  eventController.getEvents
);
router.get('/events/:id', 
  validateRequest(eventSchemas.params), 
  eventController.getEvent
);

// Admin routes for event management
// These routes require admin authentication and handle event creation, update, and deletion
router.post(
  '/events', 
  // Require authentication for this route
  requireAuth, 
  // Require permission to create events
  requirePermission(PERMISSIONS.EVENT_CREATE),
  // Allow uploading of up to 5 images
  upload.array('images', 5), 
  validateRequest(eventSchemas.create),
  // Handle event creation
  eventController.createEvent
);

router.put(
  '/events/:id', 
  // Require authentication for this route
  requireAuth, 
  // Require permission to update events
  requirePermission(PERMISSIONS.EVENT_UPDATE),
  // Allow uploading of up to 5 images
  upload.array('images', 5), 
  validateRequest(eventSchemas.update),
  // Handle event update
  eventController.updateEvent
);

router.delete(
  '/events/:id', 
  // Require authentication for this route
  requireAuth, 
  // Require permission to delete events
  requirePermission(PERMISSIONS.EVENT_DELETE),
  // Handle event deletion
  eventController.deleteEvent
);

// Export the router instance
export default router;
