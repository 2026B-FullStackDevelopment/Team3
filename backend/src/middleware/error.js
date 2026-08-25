import { DomainError } from "../shared/errors/errors.js";
import { env } from "../config/env.js";

/**
 * Central Express error handler — mounted after all routes.
 * Known DomainErrors carry their own statusCode and a safe message. Anything
 * else is treated as an unexpected 500: log it server-side, but never leak
 * internals (stack, driver messages) to the client.
 */
// eslint-disable-next-line no-unused-vars -- Express needs the 4-arg signature.
export function errorHandler(err, req, res, next) {
  if (err instanceof DomainError) {
    return res.status(err.statusCode).json({
      error: err.name,
      message: err.message,
    });
  }

  console.error("Unhandled error:", err);
  return res.status(500).json({
    error: "INTERNAL_SERVER_ERROR",
    message: env.isProduction ? "Something went wrong" : String(err?.message),
  });
}
