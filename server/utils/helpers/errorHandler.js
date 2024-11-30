import { HTTP_STATUS } from '../constants/index.js';

export class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const handleError = (err, res) => {
  err.statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }

  // Production error
  return res.status(err.statusCode).json({
    status: err.status,
    message: err.message
  });
};
