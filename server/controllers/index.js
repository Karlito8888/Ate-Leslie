import { User, Event, Contact } from '../models/index.js';
import { HTTP_STATUS, ApiError, sendResponse, sendError, imageService, emailService } from '../utils.js';

// ====== Auth Controller ======
export const authController = {
  // Register new user
  async register(req, res, next) {
    try {
      const { username, email, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ $or: [{ email }, { username }] });
      if (existingUser) {
        throw new ApiError(
          HTTP_STATUS.CONFLICT,
          'Email or username already exists'
        );
      }

      // Create new user
      const user = await User.create({
        username,
        email,
        password
      });

      // Generate token
      const token = user.generateAuthToken();

      sendResponse(res, {
        statusCode: HTTP_STATUS.CREATED,
        message: 'User registered successfully',
        data: { token }
      });
    } catch (error) {
      next(error);
    }
  },

  // Login user
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email });
      if (!user || !(await user.comparePassword(password))) {
        throw new ApiError(
          HTTP_STATUS.UNAUTHORIZED,
          'Invalid email or password'
        );
      }

      // Generate token
      const token = user.generateAuthToken();

      sendResponse(res, {
        message: 'Login successful',
        data: { token }
      });
    } catch (error) {
      next(error);
    }
  },

  // Logout user
  async logout(req, res) {
    sendResponse(res, {
      message: 'Logout successful'
    });
  },

  // Get user profile
  async profile(req, res, next) {
    try {
      const user = await User.findById(req.user.id).select('-password');
      if (!user) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
      }

      sendResponse(res, {
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  },

  // Update user profile
  async updateProfile(req, res, next) {
    try {
      const updates = {
        username: req.body.username,
        email: req.body.email,
        phoneNumber: req.body.phoneNumber
      };

      const user = await User.findByIdAndUpdate(
        req.user.id,
        { $set: updates },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
      }

      sendResponse(res, {
        message: 'Profile updated successfully',
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  },

  // Forgot password
  async forgotPassword(req, res, next) {
    try {
      const user = await User.findOne({ email: req.body.email });
      if (!user) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'No user with this email');
      }

      // Generate reset token
      const resetToken = user.createPasswordResetToken();
      await user.save();

      // TODO: Send reset email
      
      sendResponse(res, {
        message: 'Reset token sent to email'
      });
    } catch (error) {
      next(error);
    }
  },

  // Reset password
  async resetPassword(req, res, next) {
    try {
      const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

      const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() }
      });

      if (!user) {
        throw new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          'Invalid or expired reset token'
        );
      }

      user.password = req.body.password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      sendResponse(res, {
        message: 'Password reset successful'
      });
    } catch (error) {
      next(error);
    }
  },

  // Change password
  async changePassword(req, res, next) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
      }

      // Check current password
      if (!(await user.comparePassword(req.body.currentPassword))) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Current password is incorrect');
      }

      // Update password
      user.password = req.body.newPassword;
      await user.save();

      sendResponse(res, {
        message: 'Password changed successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};

// ====== User Controller ======
export const userController = {
  // Get all users (admin only)
  async getUsers(req, res, next) {
    try {
      const users = await User.find({ role: 'user' }).select('-password');
      
      sendResponse(res, {
        data: { users }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get all admins (admin only)
  async getAdmins(req, res, next) {
    try {
      const admins = await User.find({ role: 'admin' }).select('-password');
      
      sendResponse(res, {
        data: { admins }
      });
    } catch (error) {
      next(error);
    }
  },

  // Update admin (admin only)
  async updateAdmin(req, res, next) {
    try {
      const admin = await User.findOneAndUpdate(
        { _id: req.params.id, role: 'admin' },
        { $set: req.body },
        { new: true, runValidators: true }
      ).select('-password');

      if (!admin) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Admin not found');
      }

      sendResponse(res, {
        message: 'Admin updated successfully',
        data: { admin }
      });
    } catch (error) {
      next(error);
    }
  }
};

// ====== Event Controller ======
export const eventController = {
  // Create event
  async createEvent(req, res, next) {
    try {
      const eventData = {
        ...req.body,
        images: []
      };

      // Process uploaded images
      if (req.files?.length) {
        for (const file of req.files) {
          const imageInfo = await imageService.processImage(file);
          eventData.images.push(imageInfo);
        }
      }

      const event = await Event.create(eventData);

      sendResponse(res, {
        statusCode: HTTP_STATUS.CREATED,
        message: 'Event created successfully',
        data: { event }
      });
    } catch (error) {
      // Clean up uploaded images if event creation fails
      if (req.files?.length) {
        for (const file of req.files) {
          await imageService.deleteImage(file);
        }
      }
      next(error);
    }
  },

  // Get all events
  async getEvents(req, res, next) {
    try {
      const events = await Event.find()
        .sort({ date: 'asc' })
        .select('-__v');

      sendResponse(res, {
        data: { events }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get single event
  async getEvent(req, res, next) {
    try {
      const event = await Event.findById(req.params.id);
      if (!event) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Event not found');
      }

      sendResponse(res, {
        data: { event }
      });
    } catch (error) {
      next(error);
    }
  },

  // Update event
  async updateEvent(req, res, next) {
    try {
      const event = await Event.findById(req.params.id);
      if (!event) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Event not found');
      }

      // Update basic info
      Object.assign(event, req.body);

      // Process new images
      if (req.files?.length) {
        for (const file of req.files) {
          const imageInfo = await imageService.processImage(file);
          event.images.push(imageInfo);
        }
      }

      await event.save();

      sendResponse(res, {
        message: 'Event updated successfully',
        data: { event }
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete event
  async deleteEvent(req, res, next) {
    try {
      const event = await Event.findById(req.params.id);
      if (!event) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Event not found');
      }

      // Delete associated images
      for (const imageInfo of event.images) {
        await imageService.deleteImage(imageInfo);
      }

      await event.remove();

      sendResponse(res, {
        message: 'Event deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};

// ====== Contact Controller ======
export const contactController = {
  // Create contact message
  async createContact(req, res, next) {
    try {
      const contact = await Contact.create(req.body);

      sendResponse(res, {
        statusCode: HTTP_STATUS.CREATED,
        message: 'Message sent successfully',
        data: { contact }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get all contacts (admin only)
  async getContacts(req, res, next) {
    try {
      const contacts = await Contact.find()
        .sort({ createdAt: 'desc' });

      sendResponse(res, {
        data: { contacts }
      });
    } catch (error) {
      next(error);
    }
  },

  // Update contact status (admin only)
  async updateContactStatus(req, res, next) {
    try {
      const contact = await Contact.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status },
        { new: true, runValidators: true }
      );

      if (!contact) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Contact not found');
      }

      sendResponse(res, {
        message: 'Contact status updated successfully',
        data: { contact }
      });
    } catch (error) {
      next(error);
    }
  }
};

// ====== Newsletter Controller ======
export const newsletterController = {
  // Toggle newsletter subscription
  async toggleSubscription(req, res, next) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
      }

      user.newsletterSubscribed = !user.newsletterSubscribed;
      await user.save();

      const action = user.newsletterSubscribed ? 'subscribed to' : 'unsubscribed from';
      
      sendResponse(res, {
        message: `Successfully ${action} the newsletter`
      });
    } catch (error) {
      next(error);
    }
  },

  // Send newsletter (admin only)
  async sendNewsletter(req, res, next) {
    try {
      const subscribers = await User.find({ newsletterSubscribed: true })
        .select('email');

      if (!subscribers.length) {
        throw new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          'No subscribers found'
        );
      }

      // TODO: Implement newsletter sending logic
      
      sendResponse(res, {
        message: `Newsletter sent to ${subscribers.length} subscribers`
      });
    } catch (error) {
      next(error);
    }
  }
};

// Export all controllers
export default {
  authController,
  userController,
  eventController,
  contactController,
  newsletterController
};
