import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/user/stats - Get aggregated stats for a user
 * Query params: userId (required - email), date (optional - ISO string for specific day)
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const email = searchParams.get('userId');
    const date = searchParams.get('date'); // If provided, get stats for that day

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
      return NextResponse.json(
        {
          totalCalories: 0,
          calorieGoal: 2000,
          caloriesRemaining: 2000,
          workoutCount: 0,
          workoutGoal: 5,
          latestWeight: null,
          fastingStats: { active: false, protocol: null },
        },
        { status: 200 }
      );
    }

    const userId = user.id;

    // Get user preferences for goals
    const userPreferences = await prisma.userPreferences.findUnique({
      where: { userId },
    });

    // Default preferences
    const defaultPreferences = {
      calorieGoal: 2000,
      workoutGoal: 5,
    };

    const preferences = userPreferences || defaultPreferences;

    // Calculate date range for today or specified date
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get meals for the day
    const meals = await prisma.meal.findMany({
      where: {
        userId,
        timestamp: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    const caloriesConsumed = meals.reduce((sum, meal) => sum + meal.calories, 0);

    // Get latest metric (weight)
    const latestMetric = await prisma.metric.findFirst({
      where: { userId },
      orderBy: { timestamp: 'desc' },
    });

    // Get active fasting session
    const activeFasting = await prisma.fastingSession.findFirst({
      where: {
        userId,
        isActive: true,
      },
      orderBy: { startTime: 'desc' },
    });

    let fastingProgress = 0;
    if (activeFasting) {
      const now = new Date();
      const hoursElapsed = (now.getTime() - activeFasting.startTime.getTime()) / (1000 * 60 * 60);
      fastingProgress = Math.min(hoursElapsed, parseInt(activeFasting.protocol) || 16);
    }

    // Get workouts this week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const workoutsThisWeek = await prisma.workout.count({
      where: {
        userId,
        timestamp: {
          gte: weekStart,
        },
      },
    });

    const stats = {
      caloriesConsumed,
      caloriesGoal: preferences.calorieGoal,
      fastingProgress: Math.round(fastingProgress * 100) / 100,
      fastingGoal: parseInt(activeFasting?.protocol || '16'),
      workoutsThisWeek,
      workoutGoal: preferences.workoutGoal,
      currentWeight: latestMetric?.weight || 0,
      weightChange: 0, // TODO: Calculate month-over-month change
    };

    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user stats' },
      { status: 500 }
    );
  }
}
