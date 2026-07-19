import { ERROR_CODES } from "../constants/errorCodes.js";

/**
 * Standard application error. Thrown from anywhere in services/controllers;
 * caught centrally by middleware/errorHandler.middleware.js and mapped to
 * the API_CONTRACT.md error envelope: { message, code, details? }.
 */
export class ApiError extends Error {
  constructor(statusCode, message, code = ERROR_CODES.INTERNAL_ERROR, details) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace?.(this, this.constructor);
  }

  static badRequest(message, details) {
    return new ApiError(400, message, ERROR_CODES.BAD_REQUEST, details);
  }
  static validation(message, details) {
    return new ApiError(422, message, ERROR_CODES.VALIDATION_ERROR, details);
  }
  static unauthorized(message = "Unauthorized") {
    return new ApiError(401, message, ERROR_CODES.UNAUTHORIZED);
  }
  static forbidden(message = "Forbidden") {
    return new ApiError(403, message, ERROR_CODES.FORBIDDEN);
  }
  static notFound(message = "Not found") {
    return new ApiError(404, message, ERROR_CODES.NOT_FOUND);
  }
  static conflict(message, details) {
    return new ApiError(409, message, ERROR_CODES.CONFLICT, details);
  }
}

export default ApiError;
