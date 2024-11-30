import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { config } from '../config/index.js';
import { HTTP_STATUS, asyncHandler, ApiError, validate, sendResponse, sendEmail } from '../utils/index.js';
import crypto from 'crypto';

// ====== Auth Controller ======
export const authController = {
  register: asyncHandler(async (req, res) => {
    const { username, email, password, confirmPassword, newsletterSubscribed = true } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      throw new ApiError(
        HTTP_STATUS.CONFLICT,
        'User with this email or username already exists'
      );
    }

    // Validate password
    const passwordValidation = validate.password(password);
    if (!passwordValidation.isValid) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, passwordValidation.message);
    }

    // Validate email
    const emailValidation = validate.email(email);
    if (!emailValidation.isValid) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, emailValidation.message);
    }

    // Validate username
    const usernameValidation = validate.username(username);
    if (!usernameValidation.isValid) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, usernameValidation.message);
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Passwords do not match');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      newsletterSubscribed,
      role: 'user'
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      config.jwt.secret,
      { expiresIn: '30d' }
    );

    sendResponse(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: 'Registration successful',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      }
    });
  }),

  login: asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid password');
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      config.jwt.secret,
      { expiresIn: '30d' }
    );

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      }
    });
  }),

  getProfile: asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
    }

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      data: user
    });
  }),

  updateProfile: asyncHandler(async (req, res) => {
    const { username, email } = req.body;

    // Check if email is already in use
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.user.id } });
      if (existingUser) {
        throw new ApiError(HTTP_STATUS.CONFLICT, 'Email is already in use');
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { username, email } },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
    }

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  }),

  changePassword: asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Current password is incorrect');
    }

    const passwordValidation = validate.password(newPassword);
    if (!passwordValidation.isValid) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, passwordValidation.message);
    }

    // Hash and update new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Password changed successfully'
    });
  }),

  forgotPassword: asyncHandler(async (req, res) => {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'No user found with this email address');
    }

    // Generate reset token
    const resetToken = user.createPasswordResetToken();
    await user.save();

    try {
      // Create reset URL
      const resetURL = `${config.cors.origin}/reset-password/${resetToken}`;
      
      // Send email
      await sendEmail({
        to: user.email,
        subject: 'Password Reset Request',
        text: `To reset your password, click on this link: ${resetURL}\nIf you didn't request this, please ignore this email.`,
        html: `
          <p>To reset your password, click on this link:</p>
          <a href="${resetURL}" target="_blank">Reset Password</a>
          <p>If you didn't request this, please ignore this email.</p>
        `
      });

      sendResponse(res, {
        statusCode: HTTP_STATUS.OK,
        message: 'Password reset link sent to email'
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      throw new ApiError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Error sending password reset email'
      );
    }
  }),

  resetPassword: asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    // Hash token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user by token and check if token is expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid or expired password reset token');
    }

    // Validate new password
    const passwordValidation = validate.password(password);
    if (!passwordValidation.isValid) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, passwordValidation.message);
    }

    // Update password and clear reset token
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Password has been reset successfully'
    });
  })
};

// ====== User Controller ======
export const userController = {
  getUsers: asyncHandler(async (req, res) => {
    const users = await User.find({ role: 'user' }).select('-password');
    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      data: users
    });
  }),

  getAdmins: asyncHandler(async (req, res) => {
    const admins = await User.find({ role: 'admin' }).select('-password');
    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      data: admins
    });
  }),

  updateAdmin: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { username, email } = req.body;

    const admin = await User.findById(id);
    if (!admin) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Admin not found');
    }

    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: id } });
      if (existingUser) {
        throw new ApiError(HTTP_STATUS.CONFLICT, 'Email is already in use');
      }
    }

    // Update fields
    if (username) admin.username = username;
    if (email) admin.email = email;

    await admin.save();
    
    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Admin updated successfully',
      data: { ...admin.toObject(), password: undefined }
    });
  }),

  changeAdminPassword: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    const admin = await User.findById(id).select('+password');
    if (!admin) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Admin not found');
    }

    const isValidPassword = await bcrypt.compare(currentPassword, admin.password);
    if (!isValidPassword) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Current password is incorrect');
    }

    const passwordValidation = validate.password(newPassword);
    if (!passwordValidation.isValid) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, passwordValidation.message);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    admin.password = hashedPassword;
    await admin.save();

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Password changed successfully'
    });
  })
};
