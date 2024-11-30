import jwt from 'jsonwebtoken';
import { HTTP_STATUS } from '../../utils/constants/index.js';

// Middleware de vérification du token JWT
export const verifyToken = (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: 'Accès non autorisé - Token manquant'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      message: 'Token invalide ou expiré'
    });
  }
};

// Middleware de vérification du rôle admin
export const isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      message: 'Accès réservé aux administrateurs'
    });
  }
  next();
};
