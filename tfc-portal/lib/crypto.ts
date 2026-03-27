/**
 * AES-256-GCM encryption for sensitive values stored in the database.
 * Requires ENCRYPTION_KEY env var — a 64-character hex string (32 bytes).
 *
 * Generate one with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error("ENCRYPTION_KEY must be a 64-character hex string (32 bytes).");
  }
  return Buffer.from(hex, "hex");
}

export interface EncryptedValue {
  iv: string;
  data: string;
  tag: string;
}

export function encrypt(plaintext: string): EncryptedValue {
  const key = getKey();
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    iv: iv.toString("hex"),
    data: encrypted.toString("hex"),
    tag: tag.toString("hex"),
  };
}

export function decrypt(encryptedValue: EncryptedValue): string {
  const key = getKey();
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(encryptedValue.iv, "hex")
  );
  decipher.setAuthTag(Buffer.from(encryptedValue.tag, "hex"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedValue.data, "hex")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

/** Encrypt a JSON-serialisable value (e.g. an OAuth token object). */
export function encryptJson(value: unknown): EncryptedValue {
  return encrypt(JSON.stringify(value));
}

/** Decrypt back to a JSON-parsed value. Returns null if decryption fails. */
export function decryptJson<T = unknown>(encryptedValue: EncryptedValue | null | undefined): T | null {
  if (!encryptedValue) return null;
  try {
    return JSON.parse(decrypt(encryptedValue)) as T;
  } catch {
    return null;
  }
}

/**
 * Detects whether a stored value is already encrypted (has iv/data/tag shape)
 * or is legacy plaintext JSON. Handles the transition period.
 */
export function isEncrypted(value: unknown): value is EncryptedValue {
  return (
    typeof value === "object" &&
    value !== null &&
    "iv" in value &&
    "data" in value &&
    "tag" in value
  );
}
