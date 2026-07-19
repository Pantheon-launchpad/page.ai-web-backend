import env from "../../config/env.js";
import { localProvider } from "./local.provider.js";
import { ApiError } from "../../utils/ApiError.js";

/**
 * Resolves the active AiProvider by env (AI_PROVIDER=local|cloud|gemma-ondevice).
 * Only `local` has a real implementation in this pass — `cloud` and
 * `gemma-ondevice` are documented seams, not stubs pretending to work.
 */
const resolveProvider = () => {
  switch (env.AI_PROVIDER) {
    case "local":
      return localProvider;
    case "cloud":
    case "gemma-ondevice":
      throw ApiError.badRequest(
        `AI_PROVIDER=${env.AI_PROVIDER} is not wired up in this deployment yet. ` +
          `See services/ai/provider.interface.js for the seam to implement it.`,
      );
    default:
      return localProvider;
  }
};

export const AiService = {
  chat: (messages) => resolveProvider().chat(messages),
  remediate: (context) => resolveProvider().remediate(context),
  mnemonic: (concept, subject) => resolveProvider().mnemonic(concept, subject),
};
