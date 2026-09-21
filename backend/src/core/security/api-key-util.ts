import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { ApiKeyPrefix } from '../enums/api-key-prefix';
import { ZatcaEnvironment } from '../enums/zatca-environment';

const SECRET_BYTES = 32;

export function getApiKeyHashSecret(): string {
  const secret = process.env.API_KEY_HASH_SECRET;
  if (!secret) {
    throw new Error('API_KEY_HASH_SECRET is not configured');
  }
  return secret;
}

/** HMAC-SHA256(secret, apiKey) → hex */
export function hashKey(apiKey: string, secret = getApiKeyHashSecret()): string {
  return createHmac('sha256', secret).update(apiKey, 'utf8').digest('hex');
}

export function generatePlaintext(prefix: ApiKeyPrefix): {
  key: string;
  last4: string;
} {
  const random = randomBytes(SECRET_BYTES).toString('base64url');
  const key = `${prefix}${random}`;
  return { key, last4: key.slice(-4) };
}

export function prefixToEnvironment(
  prefix: ApiKeyPrefix,
): ZatcaEnvironment {
  return prefix === ApiKeyPrefix.SK_LIVE
    ? ZatcaEnvironment.PRODUCTION
    : ZatcaEnvironment.SIMULATION;
}

export function scopeMatches(
  prefix: ApiKeyPrefix,
  expectedScope?: ZatcaEnvironment,
): boolean {
  if (!expectedScope) {
    return true;
  }
  return prefixToEnvironment(prefix) === expectedScope;
}

export function safeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}
