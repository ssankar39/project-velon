import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/fasting - Start/log a fasting session
 * Body: { userId: string (email), protocol: string, startTime: ISO date, endTime?: ISO date, completedAt?: ISO date }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, protocol, startTime, endTime, completedAt } = body;

    if (!userId || !protocol || !startTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const session = await prisma.fastingSession.create({
      data: {
        userId: user.id,
        protocol,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        completedAt: completedAt ? new Date(completedAt) : null,
        isActive: !completedAt,
      },
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('Error creating fasting session:', error);
    return NextResponse.json(
      { error: 'Failed to create fasting session' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/fasting - Fetch fasting sessions for a user
 * Query params: userId (required - email)
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const email = searchParams.get('userId');

    if (!email) {
      return NextResponse.json(
        { error: 'userId (email) is required' },
        { status: 400 }
      );
    }

    // Get the database user ID from email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json([], { status: 200 });
    }

    const sessions = await prisma.fastingSession.findMany({
      where: { userId: user.id },
      orderBy: { startTime: 'desc' },
    });

    return NextResponse.json(sessions, { status: 200 });
  } catch (error) {
    console.error('Error fetching fasting sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fasting sessions' },
      { status: 500 }
    );
  }
}
