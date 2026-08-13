import { createHmac, timingSafeEqual } from 'crypto';

export const ADMIN_SESSION_COOKIE = 'anyai_admin_session';
const SESSION_LIFETIME_SECONDS = 60 * 60 * 8;

function signingSecret(): string {
  // A dedicated secret is preferred. The service key is a safe server-only
  // fallback so existing deployments do not need a fourth variable to work.
  return process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

function sign(value: string): string {
  return createHmac('sha256', signingSecret()).update(value).digest('base64url');
}

export function createAdminSession(): string | null {
  if (!signingSecret()) return null;
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_LIFETIME_SECONDS;
  const payload = `admin.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

export function validateAdminToken(token: string | null | undefined): boolean {
  if (!token || !signingSecret()) return false;
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'admin') return false;
  const expiresAt = Number(parts[1]);
  if (!Number.isFinite(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) return false;

  const expected = sign(`${parts[0]}.${parts[1]}`);
  const actualBuffer = Buffer.from(parts[2]);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export function isValidAdminSession(cookieHeader: string | null, authHeader?: string | null): boolean {
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (validateAdminToken(token)) return true;
  }
  if (cookieHeader) {
    const cookie = cookieHeader.split(';').map(part => part.trim()).find(part => part.startsWith(`${ADMIN_SESSION_COOKIE}=`));
    const token = cookie?.slice(ADMIN_SESSION_COOKIE.length + 1);
    if (token && validateAdminToken(token)) return true;
  }
  return false;
}

export function passwordsMatch(input: string, stored: string): boolean {
  const inputBuffer = Buffer.from(input);
  const storedBuffer = Buffer.from(stored);
  return inputBuffer.length === storedBuffer.length && timingSafeEqual(inputBuffer, storedBuffer);
}
