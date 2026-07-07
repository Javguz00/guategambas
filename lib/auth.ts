import { cookies } from 'next/headers';

const ADMIN_TOKEN_KEY = 'admin_token';
const ADMIN_EMAIL_KEY = 'admin_email';

export async function setAdminSession(token: string, email: string) {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_TOKEN_KEY, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  cookieStore.set(ADMIN_EMAIL_KEY, email, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_TOKEN_KEY)?.value;
  const email = cookieStore.get(ADMIN_EMAIL_KEY)?.value;

  if (!token || !email) {
    return null;
  }

  return { token, email };
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_TOKEN_KEY);
  cookieStore.delete(ADMIN_EMAIL_KEY);
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
