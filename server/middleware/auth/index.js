import { authHelpers } from '../../utils/auth.js';
import { ApiError } from '../../utils/error.js';
import { HTTP_STATUS } from '../../constants/http.js';
import { User } from '../../models/index.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'No token provided');
    }

    const decoded = authHelpers.verifyToken(token);

    if (!decoded) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid or expired token');
    }

    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'User not found');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (resource, action) => {
  return async (req, res, next) => {
    try {
      const { user } = req;

      if (!user) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'User not authenticated');
      }

      const hasAccess = authHelpers.hasPermission(user.role, resource, action);

      if (!hasAccess) {
        throw new ApiError(
          HTTP_STATUS.FORBIDDEN, 
          `Insufficient permissions to ${action} ${resource}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Common middleware combinations
export const requireAuth = [authenticate];
export const requireAdmin = [authenticate, authorize('admin', 'access')];

export default {
  authenticate,
  authorize,
  requireAuth,
  requireAdmin
};
