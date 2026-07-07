// Simple JWT implementation without external dependencies
// NOTE: For production, use a proper JWT library

const SECRET = process.env.JWT_SECRET || 'dev-secret-key-guategambas';

interface Header {
  alg: string;
  typ: string;
}

function base64Encode(str: string): string {
  return Buffer.from(str, 'utf-8').toString('base64');
}

function base64Decode(str: string): string {
  return Buffer.from(str, 'base64').toString('utf-8');
}

function sign(payload: object): string {
  const header: Header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const encodedHeader = base64Encode(JSON.stringify(header));
  const encodedPayload = base64Encode(JSON.stringify(payload));

  // Simple HMAC-SHA256 signature (simplified - just using a hash)
  const crypto = require('crypto');
  const signature = crypto
    .createHmac('sha256', SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function verify(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const [encodedHeader, encodedPayload, signature] = parts;
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    return signature === expectedSignature;
  } catch (error) {
    return false;
  }
}

export function jwtEncode<T extends object>(payload: T): string {
  return sign(payload);
}

export function jwtDecode<T extends object>(token: string): T {
  try {
    if (!verify(token)) {
      throw new Error('Invalid token signature');
    }

    const parts = token.split('.');
    const payload = JSON.parse(base64Decode(parts[1]));
    return payload as T;
  } catch (error) {
    throw new Error('Failed to decode token');
  }
}
