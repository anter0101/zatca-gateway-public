import { csrToBase64 } from './csr-builder';

const SAMPLE_PEM = [
  '-----BEGIN CERTIFICATE REQUEST-----',
  'MIIBFTCBuwIBADAvMQswCQYDVQQGEwJTQTEgMB4GA1UEAwwXVFNULXRlc3QtdmF0',
  '-----END CERTIFICATE REQUEST-----',
].join('\n');

describe('csrToBase64', () => {
  it('UTF-8-base64 encodes full PEM so decode starts with BEGIN header', () => {
    const encoded = csrToBase64(SAMPLE_PEM);
    const decoded = Buffer.from(encoded, 'base64').toString('utf8');
    expect(decoded.startsWith('-----BEGIN CERTIFICATE REQUEST-----')).toBe(
      true,
    );
    expect(decoded).toContain('-----END CERTIFICATE REQUEST-----');
    expect(encoded.startsWith('LS0tLS1CRUdJTi')).toBe(true);
    expect(encoded).not.toMatch(/\s/);
  });

  it('normalizes literal \\n escapes into real newlines before encoding', () => {
    const literal = SAMPLE_PEM.replace(/\n/g, '\\n');
    const encoded = csrToBase64(literal);
    const decoded = Buffer.from(encoded, 'base64').toString('utf8');
    expect(decoded).toBe(SAMPLE_PEM);
    expect(encoded).toBe(csrToBase64(SAMPLE_PEM));
  });

  it('leaves already-encoded LS0t… payloads unchanged (whitespace stripped)', () => {
    const already = Buffer.from(SAMPLE_PEM, 'utf8').toString('base64');
    const withSpaces = already.slice(0, 20) + '\n' + already.slice(20);
    expect(csrToBase64(already)).toBe(already);
    expect(csrToBase64(withSpaces)).toBe(already);
  });

  it('wraps bare body as CERTIFICATE REQUEST PEM then encodes', () => {
    const body = 'MIIBFTCBuwIBADAvMQswCQYDVQQGEwJTQTEgMB4GA1UEAwwXVFNULXRlc3QtdmF0';
    const encoded = csrToBase64(body);
    const decoded = Buffer.from(encoded, 'base64').toString('utf8');
    expect(decoded.startsWith('-----BEGIN CERTIFICATE REQUEST-----')).toBe(
      true,
    );
    expect(decoded).toContain(body);
    expect(decoded.endsWith('-----END CERTIFICATE REQUEST-----')).toBe(true);
  });
});
