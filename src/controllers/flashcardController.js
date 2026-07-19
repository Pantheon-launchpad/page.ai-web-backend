import * as flashcardService from "../services/flashcard.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const listDecks = asyncHandler(async (req, res) => {
  const data = await flashcardService.listDecks(req.user._id);
  sendSuccess(res, { data });
});

export const reviewCard = asyncHandler(async (req, res) => {
  const { deckId, cardId } = req.params;
  const data = await flashcardService.reviewCard(req.user._id, deckId, cardId, req.body.rating);
  sendSuccess(res, { data });
});

export const generateDeck = asyncHandler(async (req, res) => {
  const data = await flashcardService.generateDeck(req.user._id, req.body);
  sendSuccess(res, { data, status: 201 });
});
