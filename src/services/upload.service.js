import UploadedFile from "../models/UploadedFile.js";
import { StorageProvider } from "./storage/index.js";
import { ApiError } from "../utils/ApiError.js";

const MAX_SIZE_BYTES = {
  image: 10 * 1024 * 1024,
  pdf: 50 * 1024 * 1024,
  video: 500 * 1024 * 1024,
  document: 50 * 1024 * 1024,
};

export const signUpload = async (userId, { fileName, kind }) => {
  const { storageKey, uploadUrl, method, fields } = StorageProvider.getSignedUploadUrl(fileName, kind);

  const file = await UploadedFile.create({
    userId,
    fileName,
    kind,
    storageKey,
    status: "pending",
  });

  // `fields` are extra multipart form fields the client must attach
  // alongside the file bytes (only non-empty for providers like Cloudinary
  // that need a signature/timestamp/public_id on the direct-to-cloud POST).
  return { fileId: file._id, uploadUrl, method, fields, maxSizeBytes: MAX_SIZE_BYTES[kind] };
};

export const confirmUpload = async (userId, fileId, { sizeBytes, mimeType } = {}) => {
  const file = await UploadedFile.findOne({ _id: fileId, userId });
  if (!file) throw ApiError.notFound("Upload not found");

  // Prefer provider-verified metadata (Cloudinary Admin API lookup) over
  // whatever the client claims — closes the obvious "lie about the file"
  // spoofing vector local-only storage can't protect against.
  const verified = await StorageProvider.confirmAndFetchMeta(file.storageKey, file.kind);

  const finalSizeBytes = verified?.sizeBytes ?? sizeBytes ?? file.sizeBytes;
  const finalMimeType = verified?.mimeType ?? mimeType ?? file.mimeType;
  const finalUrl = verified?.url ?? StorageProvider.publicUrlFor(file.storageKey);

  if (finalSizeBytes && finalSizeBytes > (MAX_SIZE_BYTES[file.kind] || Infinity)) {
    throw ApiError.badRequest(`File exceeds the maximum allowed size for kind "${file.kind}"`);
  }

  file.sizeBytes = finalSizeBytes;
  file.mimeType = finalMimeType;
  file.url = finalUrl;
  file.status = "confirmed";
  await file.save();

  return {
    id: file._id,
    fileName: file.fileName,
    kind: file.kind,
    url: file.url,
    sizeBytes: file.sizeBytes,
  };
};
