import mongoose from "mongoose";

const userBookmarkSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    resourceId: { type: mongoose.Schema.Types.ObjectId, ref: "Resource", required: true },
  },
  { timestamps: true },
);

userBookmarkSchema.index({ userId: 1, resourceId: 1 }, { unique: true });

export default mongoose.model("UserBookmark", userBookmarkSchema);
