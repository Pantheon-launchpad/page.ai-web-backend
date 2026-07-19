import mongoose from "mongoose";
import { ALL_ROLES, ROLES } from "../constants/roles.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    password: {
      type: String,
      required: function () {
        return this.authProvider === "local";
      },
      select: false,
      trim: true,
      minlength: 6,
    },
    avatar: {
      type: String,
      default: "",
    },
    avatarInitial: {
      type: String,
      default: function () {
        return (this.name || "?").trim().charAt(0).toUpperCase();
      },
    },
    role: {
      type: String,
      enum: ALL_ROLES,
      default: ROLES.STUDENT,
    },
    classLevel: { type: String, default: "" },
    targetExams: { type: [String], default: [] },
    focusSubjects: { type: [String], default: [] },
    school: { type: String, default: "" }, // free-text display name (kept for backward compat)
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "School", default: null, index: true },

    status: {
      type: String,
      enum: ["active", "suspended", "banned"],
      default: "active",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: { type: String, select: false },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpiresAt: { type: Date, select: false },

    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    providerId: {
      type: String,
      unique: true,
      sparse: true,
    },

    lastActiveAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

userSchema.index({ role: 1 });
userSchema.index({ status: 1 });

export default mongoose.model("User", userSchema);
