import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

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

    const usersCollection = await getCollection('User');
    const user = await usersCollection.findOne({ email });

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

    const userId = user._id.toString();

    // Get user preferences for goals
    const preferencesCollection = await getCollection('UserPreferences');
    const userPreferences = await preferencesCollection.findOne({ userId });

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
    const caloriesConsumed = meals.reduce((sum, meal: any) => sum + (meal.calories || 0), 0);

    // Get latest metric (weight)
    const metricsCollection = await getCollection('Metric');
    const latestMetric = await metricsCollection
      .findOne({ userId }, { sort: { timestamp: -1 } });

    // Get active fasting session
    const fastingCollection = await getCollection('FastingSession');
    const activeFasting = await fastingCollection
      .findOne({ userId, isActive: true }, { sort: { startTime: -1 } });

    let fastingProgress = 0;
    if (activeFasting) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const now = new Date();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hoursElapsed = (now.getTime() - new Date((activeFasting as any).startTime).getTime()) / (1000 * 60 * 60);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fastingProgress = Math.min(hoursElapsed, parseInt((activeFasting as any).protocol) || 16);
    }

    // Get workouts this week
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stats = {
      caloriesConsumed,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      caloriesGoal: (preferences as any).calorieGoal,
      fastingProgress: Math.round(fastingProgress * 100) / 100,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fastingGoal: parseInt((activeFasting as any)?.protocol || '16'),
      workoutsThisWeek,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      workoutGoal: (preferences as any).workoutGoal,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      currentWeight: (latestMetric as any)?.weight || 0,
      weightChange: 0,
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
