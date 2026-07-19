import * as authService from "../services/auth.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const signup = asyncHandler(async (req, res) => {
  const result = await authService.signup(req.body, req);
  sendSuccess(res, { data: result, status: 201, message: "Account created successfully" });
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body, req);
  sendSuccess(res, { data: result, message: "Login successful" });
});

export const googleAuth = asyncHandler(async (req, res) => {
  const result = await authService.googleAuth(req.body, req);
  sendSuccess(res, { data: result, message: "Login successful" });
});

export const refresh = asyncHandler(async (req, res) => {
  const result = await authService.refresh(req.body);
  sendSuccess(res, { data: result });
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.body);
  sendSuccess(res, { data: null, message: "Logged out" });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body);
  sendSuccess(res, { data: null, message: "If that email is registered, a reset link has been sent" });
});

export const session = asyncHandler(async (req, res) => {
  const user = await authService.getSession(req.user?._id);
  sendSuccess(res, { data: user });
});
