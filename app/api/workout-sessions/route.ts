import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { getAuthUser } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuthUser(req);
    const sp = req.nextUrl.searchParams;
    const date = sp.get('date');
    const status = sp.get('status');
    const weeks = Number(sp.get('weeks') || 0);
    const limit = Math.min(Number(sp.get('limit') || 50), 200);

    const col = await getCollection('WorkoutSession');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = { userId };

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

    if (status && ['planned', 'loaded', 'completed'].includes(status)) {
      if (status === 'completed') {
        query.$or = [{ status: 'completed' }, { status: { $exists: false } }, { status: null }];
      } else {
        query.status = status;
      }
    }

    const sessions = await col.find(query).sort({ date: -1 }).limit(limit).toArray();
    const formatted = sessions.map(({ _id, ...rest }) => ({ _id: _id.toString(), ...rest }));

    return NextResponse.json(formatted, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    logger.error('Error listing sessions:', error);
    return NextResponse.json({ error: 'Failed to list sessions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuthUser(req);
    const body = await req.json();
    const { exercises, goal } = body;
    const status = body.status === 'planned' || body.status === 'loaded' ? body.status : 'completed';

    if (!exercises?.length || !goal) {
      return NextResponse.json({ error: 'Missing required fields (exercises, goal)' }, { status: 400 });
    }

    const col = await getCollection('WorkoutSession');
    const now = new Date();

    let estCalories = 0;
    for (const ex of exercises) {
      for (const s of ex.sets ?? []) {
        const vol = (s.weight || 0) * (s.reps || 0);
        estCalories += vol * 0.002 + 5;
      }
    }

    const doc = {
      userId,
      templateId: body.templateId ?? null,
      templateName: body.templateName ?? null,
      date: body.date ? new Date(body.date) : now,
      duration: body.duration ?? null,
      notes: body.notes ?? '',
      goal,
      experienceLevel: body.experienceLevel ?? 'beginner',
      exercises,
      status,
      estimatedCalories: Math.round(estCalories),
      coachFeedback: status === 'completed' ? null : body.coachFeedback ?? null,
      createdAt: now,
      updatedAt: now,
    };

    const result = await col.insertOne(doc);

    if (status === 'completed') {
      const legacyCol = await getCollection('Workout');
      const legacyDocs = exercises.map((ex: { exerciseName: string; sets?: { reps?: number }[] }) => {
        const totalSets = ex.sets?.length ?? 0;
        const totalReps = ex.sets?.reduce((s: number, set: { reps?: number }) => s + (set.reps || 0), 0) ?? 0;
        return {
          userId,
          name: ex.exerciseName,
          sets: totalSets,
          reps: Math.round(totalReps / Math.max(totalSets, 1)),
          caloriesBurned: Math.round(estCalories / exercises.length),
          timestamp: doc.date,
          createdAt: now,
          updatedAt: now,
        };
      });
      if (legacyDocs.length) {
        await legacyCol.insertMany(legacyDocs);
      }
    }

    return NextResponse.json({ _id: result.insertedId.toString(), ...doc }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    logger.error('Error creating session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
