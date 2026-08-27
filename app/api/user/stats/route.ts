import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { getAuthUser } from '@/lib/auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuthUser(req);
    const searchParams = req.nextUrl.searchParams;
    const date = searchParams.get('date');

    const preferencesCollection = await getCollection('UserPreferences');
    const userPreferences = await preferencesCollection.findOne({ userId });

    const defaultPreferences = {
      calorieGoal: 2000,
      workoutGoal: 5,
    };

    const preferences = userPreferences || defaultPreferences;

    // Fix: Parse date manually to avoid UTC/local timezone off-by-one
    let startOfDay: Date;
    let endOfDay: Date;
    if (date) {
      const [year, month, day] = date.split('-').map(Number);
      startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
      endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);
    } else {
      const now = new Date();
      startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    }

    const mealsCollection = await getCollection('Meal');
    const meals = await mealsCollection
      .find({
        userId,
        timestamp: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      })
      .toArray();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const caloriesConsumed = meals.reduce((sum: number, meal: any) => sum + (meal.calories || 0), 0);

    const metricsCollection = await getCollection('Metric');
    const latestMetric = await metricsCollection
      .findOne({ userId }, { sort: { timestamp: -1 } });

    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const previousMetric = await metricsCollection
      .findOne(
        {
          userId,
          timestamp: { $lte: monthAgo }
        },
        { sort: { timestamp: -1 } }
      );

    let weightChange = 0;
    if (latestMetric && 'weight' in latestMetric && typeof latestMetric.weight === 'number') {
      if (previousMetric && 'weight' in previousMetric && typeof previousMetric.weight === 'number') {
        weightChange = latestMetric.weight - previousMetric.weight;
      }
    }

    const fastingCollection = await getCollection('FastingSession');
    const now = new Date();
    const activeFasting = await fastingCollection
      .findOne({
        userId,
        isActive: true,
        endTime: { $gt: now }
      }, { sort: { startTime: -1 } });

    let fastingProgress = 0;
    let fastingGoal = 16;

    if (activeFasting) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hoursElapsed = (now.getTime() - new Date((activeFasting as any).startTime).getTime()) / (1000 * 60 * 60);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fastingGoal = parseInt((activeFasting as any).protocol) || 16;
      fastingProgress = Math.min(hoursElapsed, fastingGoal);
    } else {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const completedFasting = await fastingCollection
        .findOne({
          userId,
          isActive: false,
          completedAt: { $gte: startOfToday }
        }, { sort: { completedAt: -1 } });

      if (completedFasting) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const startTime = new Date((completedFasting as any).startTime);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const completedTime = new Date((completedFasting as any).completedAt);
        const hoursCompleted = (completedTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fastingGoal = parseInt((completedFasting as any).protocol) || 16;
        fastingProgress = hoursCompleted;
      }
    }

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const workoutsCollection = await getCollection('Workout');
    const workoutsThisWeek = await workoutsCollection.countDocuments({
      userId,
      timestamp: {
        $gte: weekStart,
      },
    });

    const stats = {
      caloriesConsumed,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      caloriesGoal: (preferences as any).calorieGoal,
      fastingProgress: Math.round(fastingProgress * 100) / 100,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fastingGoal: (preferences as any).fastingGoal || fastingGoal,
      workoutsThisWeek,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      workoutGoal: (preferences as any).workoutGoal,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      currentWeight: (latestMetric as any)?.weight || 0,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      weightGoal: (preferences as any).weightGoal,
      weightChange: Math.round(weightChange * 10) / 10,
    };

    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    logger.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user stats' },
      { status: 500 }
    );
  }
}
