import { ApiKeyPrefix } from '../enums/api-key-prefix';
import { ZatcaEnvironment } from '../enums/zatca-environment';
import {
  generatePlaintext,
  hashKey,
  prefixToEnvironment,
  scopeMatches,
} from './api-key-util';

describe('api-key-util', () => {
  const secret = 'test-api-key-hash-secret';

  it('hashes with HMAC-SHA256(secret, apiKey) deterministically', () => {
    const key = 'sk_test_abc123';
    const a = hashKey(key, secret);
    const b = hashKey(key, secret);
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
    expect(a).not.toContain('sk_');
  });

  it('generatePlaintext includes prefix and last4', () => {
    const { key, last4 } = generatePlaintext(ApiKeyPrefix.SK_TEST);
    expect(key.startsWith(ApiKeyPrefix.SK_TEST)).toBe(true);
    expect(last4).toBe(key.slice(-4));
  });

  it('maps prefix to environment scope', () => {
    expect(prefixToEnvironment(ApiKeyPrefix.SK_TEST)).toBe(
      ZatcaEnvironment.SIMULATION,
    );
    expect(prefixToEnvironment(ApiKeyPrefix.SK_SANDBOX)).toBe(
      ZatcaEnvironment.DEVELOPER_PORTAL,
    );
    expect(prefixToEnvironment(ApiKeyPrefix.SK_LIVE)).toBe(
      ZatcaEnvironment.PRODUCTION,
    );
    expect(scopeMatches(ApiKeyPrefix.SK_TEST, ZatcaEnvironment.SIMULATION)).toBe(
      true,
    );
    expect(
      scopeMatches(ApiKeyPrefix.SK_SANDBOX, ZatcaEnvironment.DEVELOPER_PORTAL),
    ).toBe(true);
    expect(scopeMatches(ApiKeyPrefix.SK_TEST, ZatcaEnvironment.PRODUCTION)).toBe(
      false,
    );
    expect(
      scopeMatches(ApiKeyPrefix.SK_SANDBOX, ZatcaEnvironment.SIMULATION),
    ).toBe(false);
  });
});
