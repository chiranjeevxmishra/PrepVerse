import { ENV } from '../config/env.js';

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);

  res.status(statusCode).json({
    success: false,
    message: statusCode >= 500 && ENV.NODE_ENV === 'production'
      ? 'An unexpected server error occurred.'
      : err.message || 'Internal Server Error',
    ...(ENV.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
