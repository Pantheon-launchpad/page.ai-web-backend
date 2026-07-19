import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    sourceId: { type: mongoose.Schema.Types.ObjectId, ref: "ChatSource", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
  },
  { timestamps: true },
);

chatMessageSchema.index({ sourceId: 1, createdAt: 1 });

export default mongoose.model("ChatMessage", chatMessageSchema);
