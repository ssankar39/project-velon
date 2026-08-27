import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { createSessionToken, setSessionCookie } from '@/lib/auth';
import { logger } from '@/lib/logger';

const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function checkRateLimit(email: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = loginAttempts.get(email);

  if (!entry || now > entry.resetAt) {
    loginAttempts.set(email, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  entry.count++;
  return { allowed: true };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const rateLimit = checkRateLimit(email.toLowerCase());
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } }
      );
    }

    const usersCollection = await getCollection('User');
    const userData = await usersCollection.findOne({ email: email.toLowerCase() });

    if (!userData) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, userData.password);

    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    loginAttempts.delete(email.toLowerCase());

    const userId = userData._id.toString();
    const token = await createSessionToken(userId, email);

    const preferencesCollection = await getCollection('UserPreferences');
    const preferences = await preferencesCollection.findOne({ userId });
    const onboardingComplete = preferences?.onboardingComplete ?? false;

    const response = NextResponse.json(
      {
        message: 'Login successful',
        user: { id: userId, email: userData.email, name: userData.name, onboardingComplete },
      },
      { status: 200 }
    );

    const cookieHeaders = setSessionCookie(token);
    response.headers.set('Set-Cookie', cookieHeaders['Set-Cookie']);

    return response;
  } catch (error) {
    logger.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    );
  }
}
