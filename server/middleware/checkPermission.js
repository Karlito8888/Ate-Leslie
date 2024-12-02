import { HTTP_STATUS } from '../constants/http.js';
import { checkPermission } from '../config/permissions.js';
import { ApiError } from '../utils/index.js';

export const requirePermission = (requiredPermission) => {
  return (req, res, next) => {
    // Vérifier si un utilisateur est connecté
    if (!req.user) {
      return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication required'));
    }

    // Vérifier les permissions
    const hasPermission = checkPermission(req.user.role, requiredPermission);

    if (!hasPermission) {
      return next(new ApiError(
        HTTP_STATUS.FORBIDDEN, 
        'Insufficient permissions to perform this action'
      ));
    }

    next();
  };
};
