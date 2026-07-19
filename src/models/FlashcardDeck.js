import mongoose from "mongoose";

const flashcardDeckSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
    topic: { type: String, default: "" },
    source: { type: String, enum: ["ai_generated", "manual"], default: "ai_generated" },
    status: { type: String, enum: ["generating", "ready", "failed"], default: "ready" },
  },
  { timestamps: true },
);

export default mongoose.model("FlashcardDeck", flashcardDeckSchema);
