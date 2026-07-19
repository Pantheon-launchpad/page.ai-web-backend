import mongoose from "mongoose";

const flashcardSchema = new mongoose.Schema(
  {
    deckId: { type: mongoose.Schema.Types.ObjectId, ref: "FlashcardDeck", required: true, index: true },
    front: { type: String, required: true },
    back: { type: String, required: true },
    // SM-2-lite spaced repetition state
    easeFactor: { type: Number, default: 2.5 },
    intervalDays: { type: Number, default: 0 },
    repetitions: { type: Number, default: 0 },
    dueAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

flashcardSchema.index({ deckId: 1, dueAt: 1 });

export default mongoose.model("Flashcard", flashcardSchema);
