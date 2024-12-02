import { HTTP_STATUS } from '../constants/http.js';

export const responseHelpers = {
  // Gestionnaire asynchrone pour les routes
  asyncHandler: (fn) => {
    return async (req, res, next) => {
      try {
        await fn(req, res, next);
      } catch (error) {
        next(error);
      }
    };
  },

  // Envoi de réponse standardisé
  sendResponse: (res, { 
    statusCode = HTTP_STATUS.OK, 
    success = true, 
    message = '', 
    data = null 
  }) => {
    return res.status(statusCode).json({
      success,
      message,
      data
    });
  },

  // Gestion des erreurs
  sendError: (res, error) => {
    const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { 
        stack: error.stack,
        details: error
      })
    });
  },

  // Pagination standardisée
  paginate: (data, page = 1, limit = 10) => {
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    return {
      currentPage: page,
      totalItems: data.length,
      totalPages: Math.ceil(data.length / limit),
      itemsPerPage: limit,
      items: data.slice(startIndex, endIndex)
    };
  }
};
