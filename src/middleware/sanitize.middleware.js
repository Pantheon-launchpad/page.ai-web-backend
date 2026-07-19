/**
 * Strips Mongo operator keys ($gt, $where, etc.) and dotted keys from
 * req.body / req.query / req.params, to prevent NoSQL-injection via
 * operator-shaped input.
 *
 * NOTE: express-mongo-sanitize (as of 2.x) reassigns `req.query = ...`,
 * which throws under Express 5 ("Cannot set property query of
 * #<IncomingMessage> which has only a getter") because Express 5 exposes
 * req.query as a getter-only accessor. This middleware avoids that by
 * mutating each object IN PLACE (deleting/rewriting its own keys) instead
 * of ever reassigning req.query/req.body/req.params themselves.
 */
const isPlainObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

const isBadKey = (key) => key.startsWith("$") || key.includes(".");

const sanitizeInPlace = (obj) => {
  if (!isPlainObject(obj)) return obj;

  for (const key of Object.keys(obj)) {
    if (isBadKey(key)) {
      delete obj[key];
      continue;
    }
    const value = obj[key];
    if (isPlainObject(value)) {
      sanitizeInPlace(value);
    } else if (Array.isArray(value)) {
      value.forEach((item) => sanitizeInPlace(item));
    }
  }
  return obj;
};

export const sanitizeRequest = (req, res, next) => {
  sanitizeInPlace(req.body);
  sanitizeInPlace(req.query);
  sanitizeInPlace(req.params);
  next();
};
