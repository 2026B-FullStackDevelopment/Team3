/**
 * Central error handler. Every DomainError subclass (NotFoundError,
 * ValidationError, etc. -- see shared/errors/errors.js) already carries its
 * own statusCode, so this middleware just reads that instead of each
 * controller re-deciding the HTTP status for the same error type. Anything
 * without a statusCode is an unexpected bug, not a domain error, so it falls
 * back to 500 and gets logged.
 */
export function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode ?? 500;

  if (statusCode === 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    error: err.name ?? "InternalServerError",
    message: err.message ?? "An unexpected error occurred",
  });
}
