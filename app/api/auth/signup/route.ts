import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { createSessionToken, setSessionCookie } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const usersCollection = await getCollection('User');
    const normalizedEmail = email.toLowerCase();
    const existingUser = await usersCollection.findOne({ email: normalizedEmail });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await usersCollection.insertOne({
      email: normalizedEmail,
      password: hashedPassword,
      name: name || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const userId = result.insertedId.toString();

    const preferencesCollection = await getCollection('UserPreferences');
    await preferencesCollection.insertOne({
      userId,
      onboardingComplete: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const token = await createSessionToken(userId, normalizedEmail);

    const response = NextResponse.json(
      { message: 'User created successfully', user: { id: userId, email: normalizedEmail, name, onboardingComplete: false } },
      { status: 201 }
    );

    const cookieHeaders = setSessionCookie(token);
    response.headers.set('Set-Cookie', cookieHeaders['Set-Cookie']);

    return response;
  } catch (error) {
    logger.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
