import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/meals - Add a new meal
 * Body: { userId: string (email), name: string, calories: number, type: 'breakfast'|'lunch'|'dinner'|'snack' }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, name, calories, type } = body;

    if (!userId || !name || !calories || !type) {
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

    const meal = await prisma.meal.create({
      data: {
        userId: user.id,
        name,
        calories: parseInt(calories),
        type,
      },
    });

    return NextResponse.json(meal, { status: 201 });
  } catch (error) {
    console.error('Error creating meal:', error);
    return NextResponse.json(
      { error: 'Failed to create meal' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/meals - Fetch meals for a user
 * Query params: userId (required - email), date (optional - ISO string)
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

    // If date is provided, filter by that day
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

    const meals = await prisma.meal.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
    });

    return NextResponse.json(meals, { status: 200 });
  } catch (error) {
    console.error('Error fetching meals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meals' },
      { status: 500 }
    );
  }
}
