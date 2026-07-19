import { verifyAccessToken } from "../utils/generateToken.js";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/User.js";

/**
 * Verifies the access JWT, attaches req.user (full lean user doc, minus password).
 * Rejects with 401/UNAUTHORIZED so the frontend's axios interceptor triggers its
 * silent-refresh-then-retry flow correctly (see TECHNICAL_DOCUMENTATION.md §4).
 */
export const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw ApiError.unauthorized("Missing or malformed Authorization header");
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw ApiError.unauthorized("Invalid or expired token");
  }

  const user = await User.findById(payload.id).lean();
  if (!user) throw ApiError.unauthorized("User no longer exists");
  if (user.status === "banned") throw ApiError.forbidden("This account has been banned");
  if (user.status === "suspended") throw ApiError.forbidden("This account is suspended");

  req.user = user;
  next();
});

/**
 * Best-effort auth: attaches req.user if a valid token is present, otherwise
 * continues anonymously. Used for endpoints marked "Public" in the contract
 * that still want to behave differently for a logged-in caller (e.g. /auth/session).
 */
export const optionalAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme === "Bearer" && token) {
    try {
      const payload = verifyAccessToken(token);
      const user = await User.findById(payload.id).lean();
      if (user) req.user = user;
    } catch {
      // ignore — anonymous
    }
  }
  next();
});
