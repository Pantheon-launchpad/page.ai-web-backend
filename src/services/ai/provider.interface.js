/**
 * AiProvider — the interface every provider implementation must satisfy.
 * Mirrors the frontend's services/ai.api.ts AiProvider abstraction
 * ("gemma-ondevice" | "cloud") so swapping providers never touches callers.
 *
 * IMPORTANT (see TECHNICAL_DOCUMENTATION.md §9): this product is designed
 * around Gemma 4 running on-device via LiteRT-LM, not a conventional cloud
 * LLM API. A real "gemma-ondevice" provider is NOT a thing this Express
 * server can implement — that inference happens in-process on the client
 * (native bridge in Electron/Flutter) or via a thin proxy to a self-hosted
 * runtime this repo doesn't own. This abstraction exists so that seam is a
 * one-file swap (`providers/gemmaProxy.provider.js` or similar) rather than
 * a rewrite, and so the rest of the backend (rate limiting, logging, context
 * assembly) never needs to change when that infrastructure decision lands.
 *
 * @typedef {Object} AiProvider
 * @property {(messages: {role: string, content: string}[]) => Promise<string>} chat
 * @property {(context: object) => Promise<object>} remediate
 * @property {(concept: string, subject: string) => Promise<string>} mnemonic
 */
export {};
