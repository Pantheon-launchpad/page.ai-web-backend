import multer from "multer";
import path from "path";
import fs from "fs";

const UPLOAD_DIR = path.resolve("uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storageKeyFromParams = (req) => {
  const raw = req.params.storageKey;
  return Array.isArray(raw) ? raw.join("/") : raw || "";
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const key = storageKeyFromParams(req);
    const dest = path.join(UPLOAD_DIR, path.dirname(key));
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => cb(null, path.basename(storageKeyFromParams(req) || file.originalname)),
});

// Local-dev-only stand-in for a pre-signed bucket PUT (see services/storage).
// Not used when UPLOAD_PROVIDER is s3/r2/gcs.
export const localUpload = multer({ storage, limits: { fileSize: 500 * 1024 * 1024 } });
