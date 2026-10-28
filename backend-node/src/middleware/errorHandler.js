const config = require('../config');

/**
 * 404 Not Found Handler for undefined routes
 */
function notFoundHandler(req, res, next) {
  res.status(404).json({
    message: `Endpoint ${req.originalUrl} was not found on this server.`,
    status: 404,
  });
}

/**
 * Centralized Error Handling Middleware
 */
function errorHandler(err, req, res, next) {
  // If already sent, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    const formattedErrors = {};
    for (const issue of err.issues) {
      const path = issue.path.join('.');
      if (!formattedErrors[path]) {
        formattedErrors[path] = [];
      }
      formattedErrors[path].push(issue.message);
    }

    return res.status(422).json({
      message: 'The given data was invalid.',
      errors: formattedErrors,
    });
  }

  // Handle custom 4xx errors
  if (err.status && err.status < 500) {
    return res.status(err.status).json({
      message: err.message || 'Client error',
      errors: err.errors || undefined,
    });
  }

  // Default 500 Internal Server Error
  console.error('Unhandled Application Error:', err);
  const response = {
    message: 'An unexpected internal server error occurred.',
  };

  if (config.nodeEnv === 'development') {
    response.debug = err.message;
  }

  res.status(500).json(response);
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
