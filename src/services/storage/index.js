import env from "../../config/env.js";
import { localProvider } from "./local.provider.js";
import { cloudinaryProvider } from "./cloudinary.provider.js";

/**
 * Storage-provider abstraction for the signed-upload pattern. Every
 * provider implements the same shape:
 *   - getSignedUploadUrl(fileName, kind) -> { storageKey, uploadUrl, method, fields }
 *   - confirmAndFetchMeta(storageKey, kind) -> { url, sizeBytes, mimeType } | null
 *   - publicUrlFor(storageKey) -> string   (fallback only; prefer confirmAndFetchMeta's url)
 *
 * UPLOAD_PROVIDER=cloudinary is the real, verifiable implementation.
 * UPLOAD_PROVIDER=local remains as a no-external-dependency dev fallback
 * (see local.provider.js for why it can't verify uploads server-side).
 */
const resolveProvider = () => {
  switch (env.UPLOAD_PROVIDER) {
    case "cloudinary":
      return cloudinaryProvider;
    case "local":
      return localProvider;
    default:
      return localProvider;
  }
};

export const StorageProvider = {
  getSignedUploadUrl: (fileName, kind) => resolveProvider().getSignedUploadUrl(fileName, kind),
  confirmAndFetchMeta: (storageKey, kind) => resolveProvider().confirmAndFetchMeta(storageKey, kind),
  publicUrlFor: (storageKey) => resolveProvider().publicUrlFor(storageKey),
};
