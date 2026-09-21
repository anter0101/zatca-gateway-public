import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'crypto';

const ALGO = 'aes-256-gcm';
const IV_LENGTH = 12;

function deriveKey(secret: string): Buffer {
  return createHash('sha256').update(secret, 'utf8').digest();
}

function getAppSecret(): string {
  const secret = process.env.APP_SECRET_KEY;
  if (!secret) {
    throw new Error('APP_SECRET_KEY is not configured');
  }
  return secret;
}

/** Encrypt plaintext with AES-256-GCM using APP_SECRET_KEY. Returns base64(iv + tag + ciphertext). */
export function encryptSecret(
  plaintext: string,
  secret = getAppSecret(),
): string {
  const key = deriveKey(secret);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

/** Decrypt a value produced by encryptSecret. */
export function decryptSecret(
  payload: string,
  secret = getAppSecret(),
): string {
  const key = deriveKey(secret);
  const buf = Buffer.from(payload, 'base64');
  const iv = buf.subarray(0, IV_LENGTH);
  const tag = buf.subarray(IV_LENGTH, IV_LENGTH + 16);
  const data = buf.subarray(IV_LENGTH + 16);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString(
    'utf8',
  );
}
