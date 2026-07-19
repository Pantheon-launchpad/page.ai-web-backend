import { ApiError } from "../utils/ApiError.js";
import { ERROR_CODES } from "../constants/errorCodes.js";
import env from "../config/env.js";

// 404 fallback for unmatched routes
export const notFoundHandler = (req, res, next) => {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
};

// Maps any thrown error to API_CONTRACT.md's error envelope: { message, code, details? }
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    // Mongoose validation error
    if (error.name === "ValidationError") {
      const details = Object.fromEntries(
        Object.entries(error.errors || {}).map(([k, v]) => [k, v.message]),
      );
      error = ApiError.validation("Validation failed", details);
    } else if (error.code === 11000) {
      // Mongo duplicate key
      const field = Object.keys(error.keyPattern || { field: 1 })[0];
      error = ApiError.conflict(`${field} already in use`, { field });
    } else if (error.name === "CastError") {
      error = ApiError.badRequest(`Invalid ${error.path}: ${error.value}`);
    } else if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      error = ApiError.unauthorized("Invalid or expired token");
    } else {
      error = new ApiError(
        error.statusCode || 500,
        error.message || "Something went wrong",
        error.code || ERROR_CODES.INTERNAL_ERROR,
      );
    }
  }

  if (env.NODE_ENV !== "production" && !(err instanceof ApiError)) {
    console.error(err);
  }

  const body = { message: error.message, code: error.code };
  if (error.details) body.details = error.details;
  if (env.NODE_ENV !== "production" && error.statusCode >= 500) {
    body.stack = err.stack;
  }

  res.status(error.statusCode || 500).json(body);
};
