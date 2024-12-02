import { HTTP_STATUS } from '../../constants/http.js';

export const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      const validationContext = {
        body: req.body,
        query: req.query,
        params: req.params,
        headers: req.headers
      };

      // Validation de chaque partie de la requête
      const result = schema.safeParse(validationContext);

      if (!result.success) {
        const errors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));

        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          errors
        });
      }

      // Attache les données validées à la requête
      req.validatedData = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};
