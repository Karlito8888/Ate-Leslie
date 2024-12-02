import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { USER_ROLES } from '../constants/roles.js';

export const authHelpers = {
  generateToken: (user) => {
    return jwt.sign(
      { 
        id: user._id, 
        role: user.role 
      }, 
      config.jwt.secret, 
      { expiresIn: config.jwt.expiresIn }
    );
  },

  verifyToken: (token) => {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      return null;
    }
  },

  // Permissions basées sur la configuration centralisée
  hasPermission: (userRole, resource, action) => {
    const rolePermissions = config.permissions[userRole] || {};
    return rolePermissions[resource]?.includes(action) || false;
  },

  // Validation des rôles
  isAdmin: (userRole) => userRole === USER_ROLES.ADMIN,
  isUser: (userRole) => userRole === USER_ROLES.USER,

  // Validation de mot de passe centralisée
  validatePassword: (password) => {
    const { minLength, requireSpecialChar, requireNumber, requireUppercase } = config.validation.password;
    
    if (password.length < minLength) {
      return { valid: false, message: `Password must be at least ${minLength} characters long` };
    }

    if (requireSpecialChar && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return { valid: false, message: 'Password must contain a special character' };
    }

    if (requireNumber && !/\d/.test(password)) {
      return { valid: false, message: 'Password must contain a number' };
    }

    if (requireUppercase && !/[A-Z]/.test(password)) {
      return { valid: false, message: 'Password must contain an uppercase letter' };
    }

    return { valid: true };
  }
};
