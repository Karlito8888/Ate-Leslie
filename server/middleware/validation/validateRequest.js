import { HTTP_STATUS } from '../../utils/constants/index.js';

// Middleware de validation des requêtes
export const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      const { error } = schema.validate(req.body, { abortEarly: false });
      
      if (error) {
        const errors = error.details.map((detail) => ({
          field: detail.path[0],
          message: detail.message
        }));

        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: 'Erreur de validation',
          errors
        });
      }
      
      next();
    } catch (err) {
      next(err);
    }
  };
};
