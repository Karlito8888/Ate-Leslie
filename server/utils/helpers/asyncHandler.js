import { HTTP_STATUS } from '../constants/index.js';

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    // Si next est fourni, on passe l'erreur au gestionnaire d'erreur global
    if (next) {
      return next(error);
    }
    // Sinon, on gère l'erreur ici
    res.status(HTTP_STATUS.INTERNAL_SERVER).json({ 
      message: error.message 
    });
  });
};

export default asyncHandler;
