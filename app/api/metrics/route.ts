import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/metrics - Log a weight/body metrics entry
 * Body: { userId: string (user email), weight?: number, bodyFat?: number, bmr?: number, tdee?: number, bmi?: number }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, weight, bodyFat, bmr, tdee, bmi } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId (email) is required' },
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

    const metric = await prisma.metric.create({
      data: {
        userId: user.id,
        weight: weight ? parseFloat(weight) : null,
        bodyFat: bodyFat ? parseFloat(bodyFat) : null,
        bmr: bmr ? parseFloat(bmr) : null,
        tdee: tdee ? parseFloat(tdee) : null,
        bmi: bmi ? parseFloat(bmi) : null,
      },
    });

    return NextResponse.json(metric, { status: 201 });
  } catch (error) {
    console.error('Error creating metric:', error);
    return NextResponse.json(
      { error: 'Failed to create metric' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/metrics - Fetch metrics for a user
 * Query params: userId (required - user email)
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

    const metrics = await prisma.metric.findMany({
      where: { userId: user.id },
      orderBy: { timestamp: 'desc' },
    });

    return NextResponse.json(metrics, { status: 200 });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
