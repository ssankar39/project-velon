import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { getAuthUser } from '@/lib/auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const muscle = sp.get('muscle');
    const pattern = sp.get('pattern');
    const equipment = sp.get('equipment');
    const userId = sp.get('userId');
    const limit = Math.min(Number(sp.get('limit') || 100), 200);

    const col = await getCollection('Exercise');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {};

    if (muscle) query.primaryMuscles = muscle;
    if (pattern) query.movementPattern = pattern;
    if (equipment) query.equipment = equipment;

    if (userId) {
      query.$or = [{ isCustom: false }, { isCustom: true, createdBy: userId }];
    } else {
      query.isCustom = false;
    }

    const exercises = await col.find(query).limit(limit).sort({ name: 1 }).toArray();
    const formatted = exercises.map(({ _id, ...rest }) => ({ _id: _id.toString(), ...rest }));

    return NextResponse.json(formatted, { status: 200 });
  } catch (error) {
    logger.error('Error listing exercises:', error);
    return NextResponse.json({ error: 'Failed to list exercises' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuthUser(req);
    const body = await req.json();
    const { name, primaryMuscles, movementPattern, equipment } = body;

    if (!name || !primaryMuscles?.length) {
      return NextResponse.json({ error: 'Missing required fields (name, primaryMuscles)' }, { status: 400 });
    }

    const col = await getCollection('Exercise');
    const now = new Date();

    const doc = {
      name,
      aliases: body.aliases ?? [],
      primaryMuscles,
      secondaryMuscles: body.secondaryMuscles ?? [],
      movementPattern: movementPattern ?? 'isolation',
      equipment: equipment ?? ['bodyweight'],
      defaultRepRange: body.defaultRepRange ?? { min: 8, max: 12 },
      difficulty: body.difficulty ?? 'beginner',
      category: body.category ?? 'custom',
      instructions: body.instructions ?? '',
      isCustom: true,
      createdBy: userId,
      variations: body.variations ?? [],
      createdAt: now,
      updatedAt: now,
    };

    const result = await col.insertOne(doc);
    return NextResponse.json({ _id: result.insertedId.toString(), ...doc }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    logger.error('Error creating exercise:', error);
    return NextResponse.json({ error: 'Failed to create exercise' }, { status: 500 });
  }
}
