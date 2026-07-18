import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
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
      default: ''
    },
    role: {
      type: String,
      enum: ["user", "admin", "teacher", "school"],
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
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
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
