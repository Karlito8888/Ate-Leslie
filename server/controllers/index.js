import * as authController from './auth/index.js';
import * as userController from './user/index.js';
import * as eventController from './event/index.js';
import * as contactController from './contact/index.js';
import * as newsletterController from './newsletter/index.js';

export {
  authController,
  userController,
  eventController,
  contactController,
  newsletterController
};

export default {
  auth: authController,
  user: userController,
  event: eventController,
  contact: contactController,
  newsletter: newsletterController
};
