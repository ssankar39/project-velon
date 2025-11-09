import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

function generateId(): string {
  return (Date.now().toString(36) + Math.random().toString(36).substr(2)).substr(0, 20);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name } = body;

    // Validate input
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

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = generateId();
    const now = new Date();
    
    // Create user with raw query
    await (prisma.$executeRaw as (query: TemplateStringsArray, ...values: Array<string | Date>) => Promise<number>)`
      INSERT INTO [dbo].[User] (id, email, password, name, createdAt, updatedAt)
      VALUES (${userId}, ${email}, ${hashedPassword}, ${name || null}, ${now}, ${now})
    `;

    return NextResponse.json(
      { message: 'User created successfully', user: { id: userId, email, name } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
