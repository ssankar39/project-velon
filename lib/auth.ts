import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { NextRequest } from 'next/server';

const SESSION_COOKIE = 'velon_session';
const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.MONGODB_URI || 'fallback-dev-secret-change-in-production'
);

export interface SessionPayload extends JWTPayload {
  sub: string;   // MongoDB _id
  email: string;
}

export async function createSessionToken(userId: string, email: string): Promise<string> {
  return new SignJWT({ sub: userId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export function setSessionCookie(token: string, maxAge = 7 * 24 * 60 * 60) {
  return {
    'Set-Cookie': `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`,
  };
}

export function clearSessionCookie() {
  return {
    'Set-Cookie': `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
  };
}

export function getSessionTokenFromRequest(req: NextRequest): string | null {
  const cookie = req.cookies.get(SESSION_COOKIE);
  return cookie?.value ?? null;
}

export async function getSessionFromRequest(req: NextRequest): Promise<SessionPayload | null> {
  const token = getSessionTokenFromRequest(req);
  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireSession(req: NextRequest): Promise<SessionPayload> {
  const session = await getSessionFromRequest(req);
  if (!session) {
    throw new Error('UNAUTHORIZED');
  }
  return session;
}

export function getAuthUser(req: NextRequest): { userId: string; email: string } {
  const userId = req.headers.get('x-user-id');
  const email = req.headers.get('x-user-email');
  if (!userId || !email) {
    throw new Error('UNAUTHORIZED');
  }
  return { userId, email };
}
