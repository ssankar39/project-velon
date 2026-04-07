import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

interface PlannedExerciseInput {
  exerciseId?: string;
  exerciseName: string;
  targetSets: number;
  targetReps: string | number;
  targetWeight: number;
  targetUnit: 'lbs' | 'kg';
  notes?: string;
}

function slugifyExerciseName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'planned-exercise';
}

function parseRepTarget(targetReps: string | number): number {
  if (typeof targetReps === 'number' && Number.isFinite(targetReps)) {
    return Math.max(1, Math.round(targetReps));
  }

  const text = String(targetReps).trim();
  const rangeMatch = text.match(/(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)/);
  if (rangeMatch) {
    const first = Number(rangeMatch[1]);
    const second = Number(rangeMatch[2]);
    return Math.max(1, Math.round((first + second) / 2));
  }

  const singleMatch = text.match(/\d+(?:\.\d+)?/);
  if (singleMatch) {
    return Math.max(1, Math.round(Number(singleMatch[0])));
  }

  return 8;
}

function buildPlannedExercises(exercises: PlannedExerciseInput[]) {
  return exercises.map((exercise, index) => {
    const repTarget = parseRepTarget(exercise.targetReps);
    const setCount = Math.max(Number(exercise.targetSets) || 0, 1);

    return {
      exerciseId: exercise.exerciseId || slugifyExerciseName(exercise.exerciseName),
      exerciseName: exercise.exerciseName,
      orderIndex: index,
      notes: exercise.notes,
      sets: Array.from({ length: setCount }, (_, setIndex) => ({
        setNumber: setIndex + 1,
        weight: Number(exercise.targetWeight) || 0,
        reps: repTarget,
        unit: exercise.targetUnit === 'kg' ? 'kg' : 'lbs',
        isFailure: false,
      })),
    };
  });
}

/** POST /api/workout-sessions/planned – create a planned session */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, date, goal, exercises, templateName } = body as {
      userId?: string;
      date?: string;
      goal?: 'hypertrophy' | 'strength' | 'endurance';
      exercises?: PlannedExerciseInput[];
      templateName?: string;
    };

    if (!userId || !date || !goal || !Array.isArray(exercises) || exercises.length === 0) {
      return NextResponse.json({ error: 'Missing required fields (userId, date, goal, exercises)' }, { status: 400 });
    }

    const usersCol = await getCollection('User');
    const user = await usersCol.findOne({ email: userId });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const now = new Date();
    const plannedExercises = buildPlannedExercises(exercises);

    let estimatedCalories = 0;
    for (const exercise of plannedExercises) {
      for (const set of exercise.sets ?? []) {
        estimatedCalories += ((set.weight || 0) * (set.reps || 0)) * 0.002 + 5;
      }
    }

    const doc = {
      userId: user._id.toString(),
      templateId: body.templateId ?? null,
      templateName: templateName ?? null,
      date: new Date(date),
      duration: body.duration ?? null,
      notes: body.notes ?? '',
      goal,
      experienceLevel: body.experienceLevel ?? 'beginner',
      exercises: plannedExercises,
      status: 'planned' as const,
      estimatedCalories: Math.round(estimatedCalories),
      coachFeedback: null,
      createdAt: now,
      updatedAt: now,
    };

    const col = await getCollection('WorkoutSession');
    const result = await col.insertOne(doc);

    return NextResponse.json({ _id: result.insertedId.toString(), ...doc }, { status: 201 });
  } catch (error) {
    console.error('Error creating planned session:', error);
    return NextResponse.json({ error: 'Failed to create planned session' }, { status: 500 });
  }
}
