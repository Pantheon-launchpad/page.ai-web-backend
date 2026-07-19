import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    body: { type: String, default: "" },
    type: {
      type: String,
      enum: ["achievement", "streak", "mission", "system", "reminder"],
      default: "system",
    },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);
