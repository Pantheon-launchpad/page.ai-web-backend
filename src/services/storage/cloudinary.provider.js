import { v2 as cloudinary } from "cloudinary";
import env from "../../config/env.js";
import { nanoid } from "../../utils/nanoid.js";
import { ApiError } from "../../utils/ApiError.js";

if (env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

const KIND_TO_RESOURCE_TYPE = {
  image: "image",
  video: "video",
  pdf: "raw",
  document: "raw",
};

const assertConfigured = () => {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw ApiError.badRequest(
      "UPLOAD_PROVIDER=cloudinary but CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET are not set",
    );
  }
};

/**
 * Direct-to-Cloudinary signed upload pattern: the client never sends file
 * bytes through this server. We hand back a signature + params; the client
 * does a multipart POST straight to Cloudinary's own upload endpoint with
 * those params attached. This keeps large files (video especially) off our
 * server entirely, matching the storage-provider abstraction's contract
 * (see services/storage/index.js and provider.interface expectations).
 */
export const cloudinaryProvider = {
  getSignedUploadUrl(fileName, kind) {
    assertConfigured();

    const resourceType = KIND_TO_RESOURCE_TYPE[kind] || "auto";
    const publicId = `${env.CLOUDINARY_FOLDER}/${kind}/${nanoid(16)}`;
    const timestamp = Math.floor(Date.now() / 1000);

    const paramsToSign = { timestamp, public_id: publicId, folder: env.CLOUDINARY_FOLDER };
    const signature = cloudinary.utils.api_sign_request(paramsToSign, env.CLOUDINARY_API_SECRET);

    return {
      storageKey: publicId,
      uploadUrl: `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
      method: "POST",
      // The client attaches these as multipart form fields alongside the
      // file itself when POSTing directly to `uploadUrl`.
      fields: {
        api_key: env.CLOUDINARY_API_KEY,
        timestamp,
        signature,
        public_id: publicId,
        folder: env.CLOUDINARY_FOLDER,
      },
    };
  },

  /**
   * Server-side verification via Cloudinary's Admin API: confirms the
   * asset actually exists (rather than trusting whatever the client
   * reports) and returns its real size/url/format. This is the part a
   * local-only storage provider can't do — there's no third party to ask.
   */
  async confirmAndFetchMeta(storageKey, kind) {
    assertConfigured();
    const resourceType = KIND_TO_RESOURCE_TYPE[kind] || "auto";

    try {
      const resource = await cloudinary.api.resource(storageKey, { resource_type: resourceType });
      return {
        url: resource.secure_url,
        sizeBytes: resource.bytes,
        mimeType: resource.format ? `${resourceType}/${resource.format}` : undefined,
      };
    } catch (err) {
      throw ApiError.badRequest(
        `Could not verify the uploaded file with Cloudinary (public_id="${storageKey}"): ${err.message}`,
      );
    }
  },

  publicUrlFor(storageKey) {
    // Only reached if confirmAndFetchMeta wasn't called first; prefer that
    // path since it returns the real secure_url including format/version.
    return `https://res.cloudinary.com/${env.CLOUDINARY_CLOUD_NAME}/image/upload/${storageKey}`;
  },
};
