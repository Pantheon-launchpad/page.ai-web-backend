import crypto from "crypto";

const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

// Minimal dependency-free ID generator (avoids pulling in the `nanoid` package
// just for short codes like referral codes / file ids).
export const nanoid = (size = 12) => {
  const bytes = crypto.randomBytes(size);
  let id = "";
  for (let i = 0; i < size; i++) {
    id += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return id;
};
