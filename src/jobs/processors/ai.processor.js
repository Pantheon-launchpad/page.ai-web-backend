import FlashcardDeck from "../../models/FlashcardDeck.js";
import Flashcard from "../../models/Flashcard.js";
import { AiService } from "../../services/ai/index.js";

/**
 * Flashcard-deck content generation moved off the request path: the API
 * returns a deck in "generating" status immediately, and this processor
 * fills in the cards asynchronously. With the local mock AI provider this
 * finishes near-instantly either way, but the seam matters once a real
 * (slower) AI provider is wired in — see services/ai/provider.interface.js.
 */
export const generateDeckCards = async ({ deckId, topic, cardCount }) => {
  const cards = [];
  for (let i = 0; i < cardCount; i++) {
    // Routed through the same provider abstraction as the rest of the AI
    // surface, one card at a time, so a real provider can be prompted
    // per-card rather than needing a single giant structured-output call.
    const back = await AiService.mnemonic(`${topic} — key idea #${i + 1}`, topic);
    cards.push({ deckId, front: `${topic} — Key idea #${i + 1}`, back });
  }
  await Flashcard.insertMany(cards);
  await FlashcardDeck.findByIdAndUpdate(deckId, { status: "ready" });
};

export const aiProcessors = {
  "generate-deck": generateDeckCards,
};
