import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/workouts - Add a new workout
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, name, duration, intensity, caloriesBurned } = body;

    if (!userId || !name || !duration || !intensity) {
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

    const workout = await prisma.workout.create({
      data: {
        userId: user.id,
        name,
        duration: parseInt(duration),
        intensity,
        caloriesBurned: caloriesBurned ? parseInt(caloriesBurned) : null,
      },
    });

    return NextResponse.json(workout, { status: 201 });
  } catch (error) {
    console.error('Error creating workout:', error);
    return NextResponse.json(
      { error: 'Failed to create workout' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/workouts - Fetch workouts for a user
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const email = searchParams.get('userId');
    const date = searchParams.get('date');

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

    const whereClause: Record<string, unknown> = { userId: user.id };

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      whereClause.timestamp = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const workouts = await prisma.workout.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
    });

    return NextResponse.json(workouts, { status: 200 });
  } catch (error) {
    console.error('Error fetching workouts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workouts' },
      { status: 500 }
    );
  }
}
