import FlashcardDeck from "../models/FlashcardDeck.js";
import Flashcard from "../models/Flashcard.js";
import FlashcardReview from "../models/FlashcardReview.js";
import { ApiError } from "../utils/ApiError.js";
import { aiQueue, enqueueOrRun } from "../jobs/queues.js";
import { generateDeckCards } from "../jobs/processors/ai.processor.js";

// SM-2-lite spaced repetition scheduler, per API_CONTRACT.md §8's instruction
// ("Production should implement SM-2 or similar").
const SM2_INTERVALS = { again: 0, hard: 1, good: 3, easy: 6 };

export const listDecks = async (userId) => {
  const decks = await FlashcardDeck.find({ userId }).sort({ createdAt: -1 });
  const decksWithDue = await Promise.all(
    decks.map(async (d) => {
      const dueCount = await Flashcard.countDocuments({ deckId: d._id, dueAt: { $lte: new Date() } });
      const totalCount = await Flashcard.countDocuments({ deckId: d._id });
      return {
        id: d._id,
        title: d.title,
        topic: d.topic,
        source: d.source,
        status: d.status,
        dueCount,
        totalCount,
      };
    }),
  );
  return decksWithDue;
};

export const reviewCard = async (userId, deckId, cardId, rating) => {
  const card = await Flashcard.findOne({ _id: cardId, deckId });
  if (!card) throw ApiError.notFound("Flashcard not found");

  if (rating === "again") {
    card.repetitions = 0;
    card.intervalDays = SM2_INTERVALS.again;
  } else {
    card.repetitions += 1;
    card.easeFactor = Math.max(1.3, card.easeFactor + (rating === "easy" ? 0.15 : rating === "hard" ? -0.15 : 0));
    const base = SM2_INTERVALS[rating];
    card.intervalDays = card.repetitions <= 1 ? base : Math.round(card.intervalDays * card.easeFactor) || base;
  }

  card.dueAt = new Date(Date.now() + card.intervalDays * 24 * 60 * 60 * 1000);
  await card.save();

  await FlashcardReview.create({ userId, deckId, cardId, rating });

  return { nextDueAt: card.dueAt };
};

export const generateDeck = async (userId, { topic, subjectId, cardCount = 10 }) => {
  const deck = await FlashcardDeck.create({
    userId,
    title: `${topic} — AI Deck`,
    subjectId,
    topic,
    source: "ai_generated",
    status: "generating",
  });

  // Card content generation is dispatched to the `ai` queue (see
  // jobs/workers/ai.worker.js) so this call returns immediately rather than
  // blocking on however long AI generation takes — important once a real
  // (non-instant) AI provider is wired in. If Redis isn't running, it falls
  // back to generating inline so local dev without Redis still works.
  await enqueueOrRun(
    aiQueue,
    "generate-deck",
    { deckId: deck._id.toString(), topic, cardCount },
    generateDeckCards,
  );

  const deckAfter = await FlashcardDeck.findById(deck._id);
  return { id: deck._id, title: deck.title, status: deckAfter.status, cardCount };
};
