import crypto from "crypto";

// Refresh tokens are stored hashed (never plaintext) so a DB leak doesn't
// hand out valid sessions. SHA-256 is sufficient here since the token itself
// already has high entropy (it's a signed JWT), unlike a user password.
export const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
