/**
 * Wraps an async Express handler so thrown/rejected errors are forwarded
 * to next(), landing in the centralized error handler instead of crashing
 * the process or requiring try/catch in every controller.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
