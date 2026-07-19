import mongoose from "mongoose";

// Refresh tokens are stored hashed + per-device, enabling rotation and
// server-side invalidation on /auth/logout (contract §1).
const refreshTokenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    userAgent: { type: String, default: "" },
    ip: { type: String, default: "" },
    revoked: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("RefreshToken", refreshTokenSchema);
