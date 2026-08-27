import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { getAuthUser } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuthUser(req);
    const body = await req.json();
    const { name, sets, reps, exerciseId, bodyPart, target, equipment, timestamp } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const workoutsCollection = await getCollection('Workout');

    const totalReps = (sets || 0) * (reps || 0);
    const estimatedCalories = Math.round(totalReps * 0.5);

    const workoutTimestamp = timestamp ? new Date(timestamp) : new Date();

    const result = await workoutsCollection.insertOne({
      userId,
      name,
      sets: sets ? parseInt(sets) : null,
      reps: reps ? parseInt(reps) : null,
      exerciseId: exerciseId || null,
      bodyPart: bodyPart || null,
      target: target || null,
      equipment: equipment || null,
      caloriesBurned: estimatedCalories,
      timestamp: workoutTimestamp,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      id: result.insertedId.toString(),
      ...body,
      caloriesBurned: estimatedCalories,
      timestamp: new Date().toISOString(),
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    logger.error('Error creating workout:', error);
    return NextResponse.json(
      { error: 'Failed to create workout' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuthUser(req);
    const searchParams = req.nextUrl.searchParams;
    const date = searchParams.get('date');

    const workoutsCollection = await getCollection('Workout');

    const query: Record<string, unknown> = { userId };

    if (date) {
      const [year, month, day] = date.split('-').map(Number);
      const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
      const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

      query.timestamp = {
        $gte: startOfDay,
        $lte: endOfDay,
      };
    }

    const workouts = await workoutsCollection.find(query).sort({ timestamp: -1 }).toArray();

    const formattedWorkouts = workouts.map((workout: { _id: { toString: () => string }; [key: string]: unknown }) => {
      const { _id, ...rest } = workout;
      return {
        ...rest,
        id: _id.toString(),
      };
    });

    return NextResponse.json(formattedWorkouts, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    logger.error('Error fetching workouts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workouts' },
      { status: 500 }
    );
  }
}
