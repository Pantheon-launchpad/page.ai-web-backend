import path from "path";
import env from "../../config/env.js";
import { nanoid } from "../../utils/nanoid.js";

/**
 * Local-dev fallback: client uploads via multipart PUT directly to this
 * server (see middleware/localUpload.middleware.js + the /uploads/direct
 * route in app.js) instead of a real bucket. No server-side verification of
 * the uploaded content is possible here (there's no third-party API to ask
 * "does this file really exist/what size is it") — confirmUpload trusts the
 * client-reported size/mimeType. Fine for local dev; not a substitute for a
 * real provider in production, which is why UPLOAD_PROVIDER=cloudinary
 * exists (see cloudinary.provider.js).
 */
export const localProvider = {
  getSignedUploadUrl(fileName, kind) {
    const ext = path.extname(fileName || "");
    const storageKey = `${kind}/${nanoid(16)}${ext}`;
    return {
      storageKey,
      uploadUrl: `${env.UPLOAD_PUBLIC_BASE_URL}/direct/${encodeURIComponent(storageKey)}`,
      method: "PUT",
      fields: {},
    };
  },

  // No third-party API to verify against locally — caller falls back to
  // client-supplied metadata when this returns null.
  async confirmAndFetchMeta() {
    return null;
  },

  publicUrlFor(storageKey) {
    return `${env.UPLOAD_PUBLIC_BASE_URL}/${storageKey}`;
  },
};
