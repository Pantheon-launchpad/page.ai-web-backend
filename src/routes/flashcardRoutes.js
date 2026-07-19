import express from "express";
import * as flashcardController from "../controllers/flashcardController.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { reviewSchema, generateDeckSchema } from "../validators/flashcard.validators.js";

const router = express.Router();
router.use(requireAuth);
router.get("/decks", flashcardController.listDecks);
router.post("/:deckId/cards/:cardId/review", validate({ body: reviewSchema }), flashcardController.reviewCard);
router.post("/generate", validate({ body: generateDeckSchema }), flashcardController.generateDeck);
export default router;
