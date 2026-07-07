import { createHmac } from 'crypto';

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

  const signature = createHmac('sha256', SECRET)
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
    const expectedSignature = createHmac('sha256', SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    return signature === expectedSignature;
  } catch {
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
  } catch {
    throw new Error('Failed to decode token');
  }
}
