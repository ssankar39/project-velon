import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, name, sets, reps, exerciseId, bodyPart, target, equipment, timestamp } = body;

    if (!userId || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const usersCollection = await getCollection('User');
    const workoutsCollection = await getCollection('Workout');

    const user = await usersCollection.findOne({ email: userId });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Calculate calories burned based on sets and reps
    // Simple formula: (sets * reps) * 0.5 (can be adjusted)
    const totalReps = (sets || 0) * (reps || 0);
    const estimatedCalories = Math.round(totalReps * 0.5);

    // Use provided timestamp or current time
    const workoutTimestamp = timestamp ? new Date(timestamp) : new Date();

    const result = await workoutsCollection.insertOne({
      userId: user._id.toString(),
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
    console.error('Error creating workout:', error);
    return NextResponse.json(
      { error: 'Failed to create workout' },
      { status: 500 }
    );
  }
}

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
    const workoutsCollection = await getCollection('Workout');

    const user = await usersCollection.findOne({ email });

    if (!user) {
      return NextResponse.json([], { status: 200 });
    }

    // eslint-disable-next-line prefer-const
    let query: Record<string, unknown> = { userId: user._id.toString() };

    if (date) {
      // Parse the date string and create dates in local timezone
      const [year, month, day] = date.split('-').map(Number);
      const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
      const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

      query.timestamp = {
        $gte: startOfDay,
        $lte: endOfDay,
      };
    }

    const workouts = await workoutsCollection.find(query).sort({ timestamp: -1 }).toArray();

    // Convert MongoDB _id to string id for frontend
    const formattedWorkouts = workouts.map((workout: any) => {
      const { _id, ...rest } = workout;
      return {
        ...rest,
        id: _id.toString(),
      };
    });

    return NextResponse.json(formattedWorkouts, { status: 200 });
  } catch (error) {
    console.error('Error fetching workouts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workouts' },
      { status: 500 }
    );
  }
}
