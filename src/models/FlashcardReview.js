import mongoose from "mongoose";

const flashcardReviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    deckId: { type: mongoose.Schema.Types.ObjectId, ref: "FlashcardDeck", required: true },
    cardId: { type: mongoose.Schema.Types.ObjectId, ref: "Flashcard", required: true },
    rating: { type: String, enum: ["again", "hard", "good", "easy"], required: true },
  },
  { timestamps: true },
);

export default mongoose.model("FlashcardReview", flashcardReviewSchema);
