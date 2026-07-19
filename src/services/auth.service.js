import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import RefreshToken from "../models/RefreshToken.js";
import Referral from "../models/Referral.js";
import Wallet from "../models/Wallet.js";
import Streak from "../models/Streak.js";
import UserSettings from "../models/UserSettings.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/generateToken.js";
import { sha256 } from "../utils/hash.js";
import { nanoid } from "../utils/nanoid.js";
import { ApiError } from "../utils/ApiError.js";
import env from "../config/env.js";
import { toUserDto } from "../dto/userDto.js";
import { emailQueue, enqueueOrRun } from "../jobs/queues.js";
import { sendPasswordResetEmail, sendWelcomeEmail } from "../jobs/processors/email.processor.js";
import { resolveSchoolByCode } from "./school.service.js";

const googleClient = env.GOOGLE_CLIENT_ID ? new OAuth2Client(env.GOOGLE_CLIENT_ID) : null;

/** Creates the per-user side-collections a brand new account needs. */
const provisionNewUser = async (user, referralCode) => {
  await Promise.all([
    Wallet.create({ userId: user._id }),
    Streak.create({ userId: user._id }),
    UserSettings.create({ userId: user._id }),
    Referral.create({ userId: user._id, code: nanoid(8).toUpperCase() }),
  ]);

  if (referralCode) {
    const referrer = await Referral.findOne({ code: referralCode.toUpperCase() });
    if (referrer) {
      referrer.totalReferrals += 1;
      referrer.activeReferrals += 1;
      referrer.monthlyProgress += 1;
      await referrer.save();
    }
    // Silently ignore an unknown code — signup should not fail over a bad referral code.
  }
};

const issueTokenPair = async (user, req) => {
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  await RefreshToken.create({
    userId: user._id,
    tokenHash: sha256(refreshToken),
    userAgent: req?.headers?.["user-agent"] || "",
    ip: req?.ip || "",
    expiresAt: new Date(Date.now() + env.JWT_REFRESH_EXPIRES_IN_MS),
  });

  return {
    accessToken,
    refreshToken,
    tokenType: "Bearer",
  };
};

export const signup = async (
  { name, email, password, classLevel, targetExams, focusSubjects, referralCode, schoolCode },
  req,
) => {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw ApiError.conflict("User already registered with this email");

  const hashedPassword = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);
  const school = await resolveSchoolByCode(schoolCode);

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    classLevel,
    targetExams,
    focusSubjects,
    schoolId: school?._id || null,
    school: school?.name || "",
  });

  await provisionNewUser(user, referralCode);

  await enqueueOrRun(
    emailQueue,
    "welcome",
    { email: user.email, name: user.name },
    sendWelcomeEmail,
  );

  const tokens = await issueTokenPair(user, req);
  return { user: toUserDto(user), tokens };
};

export const login = async ({ email, password }, req) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user) throw ApiError.unauthorized("Invalid credentials");

  if (user.status === "banned") throw ApiError.forbidden("This account has been banned");
  if (user.status === "suspended") throw ApiError.forbidden("This account is suspended");

  if (user.authProvider !== "local") {
    throw ApiError.badRequest(
      `This account uses ${user.authProvider} sign-in. Please log in that way instead.`,
    );
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) throw ApiError.unauthorized("Invalid credentials");

  user.lastActiveAt = new Date();
  await user.save();

  const tokens = await issueTokenPair(user, req);
  return { user: toUserDto(user), tokens };
};

export const googleAuth = async ({ idToken }, req) => {
  if (!googleClient) {
    throw ApiError.badRequest(
      "Google sign-in is not configured on this server (missing GOOGLE_CLIENT_ID)",
    );
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken, audience: env.GOOGLE_CLIENT_ID });
    payload = ticket.getPayload();
  } catch {
    throw ApiError.unauthorized("Invalid Google token");
  }

  const { sub: providerId, email, name, picture } = payload;

  let user = await User.findOne({ $or: [{ providerId }, { email: email.toLowerCase() }] });

  if (!user) {
    user = await User.create({
      name: name || email.split("@")[0],
      email: email.toLowerCase(),
      avatar: picture || "",
      authProvider: "google",
      providerId,
      isVerified: true,
    });
    await provisionNewUser(user);
  } else if (!user.providerId) {
    // Existing local account signing in with Google for the first time — link it.
    user.providerId = providerId;
    user.authProvider = "google";
    await user.save();
  }

  user.lastActiveAt = new Date();
  await user.save();

  const tokens = await issueTokenPair(user, req);
  return { user: toUserDto(user), tokens };
};

export const refresh = async ({ refreshToken }) => {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }

  const tokenHash = sha256(refreshToken);
  const stored = await RefreshToken.findOne({ tokenHash, userId: payload.id, revoked: false });
  if (!stored || stored.expiresAt < new Date()) {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }

  const user = await User.findById(payload.id);
  if (!user) throw ApiError.unauthorized("User no longer exists");

  const accessToken = generateAccessToken(user._id, user.role);
  return { accessToken };
};

export const logout = async ({ refreshToken }) => {
  if (!refreshToken) return;
  await RefreshToken.updateOne({ tokenHash: sha256(refreshToken) }, { revoked: true });
};

export const forgotPassword = async ({ email }) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  // Always respond success (don't leak whether an email is registered).
  if (!user || user.authProvider !== "local") return;

  const resetToken = nanoid(32);
  user.passwordResetTokenHash = sha256(resetToken);
  user.passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h
  await user.save();

  await enqueueOrRun(
    emailQueue,
    "password-reset",
    { email: user.email, resetToken },
    sendPasswordResetEmail,
  );
};

export const getSession = async (userId) => {
  if (!userId) return null;
  const user = await User.findById(userId);
  return user ? toUserDto(user) : null;
};
