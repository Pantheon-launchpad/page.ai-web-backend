import { ApiError } from "../utils/ApiError.js";

/**
 * validate({ body?, query?, params? }) — each value is a zod schema.
 * Rejects with 422/VALIDATION_ERROR (matching ApiError.validation) before
 * the request reaches business logic, per TECHNICAL_DOCUMENTATION.md §16.
 */
export const validate =
  (schemas = {}) =>
  (req, res, next) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query) req.query = schemas.query.parse(req.query);
      if (schemas.params) req.params = schemas.params.parse(req.params);
      next();
    } catch (err) {
      const details = err.errors?.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      }));
      next(ApiError.validation("Validation failed", details));
    }
  };
