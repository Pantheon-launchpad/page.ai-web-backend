import dotenv from "dotenv";
dotenv.config();

const required = ["MONGO_URI", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"];

const missing = required.filter((key) => !process.env[key]);
if (missing.length && process.env.NODE_ENV !== "test") {
  // eslint-disable-next-line no-console
  console.warn(
    `[env] Missing recommended environment variables: ${missing.join(", ")}. Falling back to insecure defaults for local development only.`,
  );
}

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "5000", 10),

  MONGO_URI: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/pageai",

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "dev_access_secret_change_me",
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "dev_refresh_secret_change_me",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  JWT_REFRESH_EXPIRES_IN_MS: 30 * 24 * 60 * 60 * 1000,

  CORS_ORIGINS: (process.env.CORS_ORIGINS || "http://localhost:3000")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",

  MAIL_FROM: process.env.MAIL_FROM || "noreply@page.ai",
  MAIL_PROVIDER_API_KEY: process.env.MAIL_PROVIDER_API_KEY || "",

  UPLOAD_PROVIDER: process.env.UPLOAD_PROVIDER || "local", // local | cloudinary
  UPLOAD_BUCKET: process.env.UPLOAD_BUCKET || "pageai-uploads",
  UPLOAD_PUBLIC_BASE_URL: process.env.UPLOAD_PUBLIC_BASE_URL || "http://localhost:5000/uploads",

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",
  CLOUDINARY_FOLDER: process.env.CLOUDINARY_FOLDER || "pageai",

  REDIS_URL: process.env.REDIS_URL || "redis://127.0.0.1:6379",
  // If Redis is unreachable, jobs fall back to running inline instead of
  // crashing the request — see src/jobs/queues.js. Set to "true" to make
  // that fallback loud (throw) instead, e.g. in a CI environment where
  // Redis absence should fail fast.
  REQUIRE_REDIS: process.env.REQUIRE_REDIS === "true",

  AI_PROVIDER: process.env.AI_PROVIDER || "local", // local | cloud | gemma-ondevice
  AI_DAILY_MESSAGE_LIMIT_FREE: parseInt(process.env.AI_DAILY_MESSAGE_LIMIT_FREE || "50", 10),

  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10),
};

export default env;
