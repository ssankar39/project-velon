import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

/** GET /api/workout-sessions – list sessions for user, optionally filtered by date */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const userId = sp.get('userId');
    const date = sp.get('date');
    const weeks = Number(sp.get('weeks') || 0); // fetch last N weeks of history
    const limit = Math.min(Number(sp.get('limit') || 50), 200);

    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    const usersCol = await getCollection('User');
    const user = await usersCol.findOne({ email: userId });
    if (!user) return NextResponse.json([], { status: 200 });

    const col = await getCollection('WorkoutSession');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = { userId: user._id.toString() };

    if (date) {
      const [y, m, d] = date.split('-').map(Number);
      query.date = {
        $gte: new Date(y, m - 1, d, 0, 0, 0, 0),
        $lte: new Date(y, m - 1, d, 23, 59, 59, 999),
      };
    } else if (weeks > 0) {
      const since = new Date();
      since.setDate(since.getDate() - weeks * 7);
      query.date = { $gte: since };
    }

    const sessions = await col.find(query).sort({ date: -1 }).limit(limit).toArray();
    const formatted = sessions.map(({ _id, ...rest }) => ({ _id: _id.toString(), ...rest }));

    return NextResponse.json(formatted, { status: 200 });
  } catch (error) {
    console.error('Error listing sessions:', error);
    return NextResponse.json({ error: 'Failed to list sessions' }, { status: 500 });
  }
}

/** POST /api/workout-sessions – create/log a session */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, exercises, goal } = body;

    if (!userId || !exercises?.length || !goal) {
      return NextResponse.json({ error: 'Missing required fields (userId, exercises, goal)' }, { status: 400 });
    }

    const usersCol = await getCollection('User');
    const user = await usersCol.findOne({ email: userId });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const col = await getCollection('WorkoutSession');
    const now = new Date();

    // Compute basic calorie estimate: sum of (sets × reps × weight × 0.002) + base per set
    let estCalories = 0;
    for (const ex of exercises) {
      for (const s of ex.sets ?? []) {
        const vol = (s.weight || 0) * (s.reps || 0);
        estCalories += vol * 0.002 + 5; // 5 kcal base per set
      }
    }

    const doc = {
      userId: user._id.toString(),
      templateId: body.templateId ?? null,
      templateName: body.templateName ?? null,
      date: body.date ? new Date(body.date) : now,
      duration: body.duration ?? null,
      notes: body.notes ?? '',
      goal,
      experienceLevel: body.experienceLevel ?? 'beginner',
      exercises,
      estimatedCalories: Math.round(estCalories),
      coachFeedback: null,
      createdAt: now,
      updatedAt: now,
    };

    const result = await col.insertOne(doc);

    // Also insert a legacy Workout record for backwards-compat with dashboard stats
    const legacyCol = await getCollection('Workout');
    for (const ex of exercises) {
      const totalSets = ex.sets?.length ?? 0;
      const totalReps = ex.sets?.reduce((s: number, set: { reps?: number }) => s + (set.reps || 0), 0) ?? 0;
      await legacyCol.insertOne({
        userId: user._id.toString(),
        name: ex.exerciseName,
        sets: totalSets,
        reps: Math.round(totalReps / Math.max(totalSets, 1)),
        caloriesBurned: Math.round(estCalories / exercises.length),
        timestamp: doc.date,
        createdAt: now,
        updatedAt: now,
      });
    }

    return NextResponse.json({ _id: result.insertedId.toString(), ...doc }, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
