import jwt from "jsonwebtoken";
import env from "../config/env.js";

/**
 * Short-lived access token. Preserves the original single-token generator's
 * signature/behavior as the "access token" half of the new access+refresh pair.
 */
export const generateAccessToken = (userId, role) =>
  jwt.sign({ id: userId, role }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });

export const generateRefreshToken = (userId) =>
  jwt.sign({ id: userId, type: "refresh" }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });

export const verifyAccessToken = (token) => jwt.verify(token, env.JWT_ACCESS_SECRET);
export const verifyRefreshToken = (token) => jwt.verify(token, env.JWT_REFRESH_SECRET);

// Backward-compatible default export (old callers used generateToken(id) -> 7d token)
const generateToken = (userId) => generateAccessToken(userId);
export default generateToken;
