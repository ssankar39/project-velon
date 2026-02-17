import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

/** GET  /api/exercises – list all or filter by muscle/pattern/equipment */
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

    // Show built-in + user's custom exercises
    if (userId) {
      query.$or = [{ isCustom: false }, { isCustom: true, createdBy: userId }];
    } else {
      query.isCustom = false;
    }

    const exercises = await col.find(query).limit(limit).sort({ name: 1 }).toArray();
    const formatted = exercises.map(({ _id, ...rest }) => ({ _id: _id.toString(), ...rest }));

    return NextResponse.json(formatted, { status: 200 });
  } catch (error) {
    console.error('Error listing exercises:', error);
    return NextResponse.json({ error: 'Failed to list exercises' }, { status: 500 });
  }
}

/** POST /api/exercises – create a custom exercise */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, name, primaryMuscles, movementPattern, equipment } = body;

    if (!userId || !name || !primaryMuscles?.length) {
      return NextResponse.json({ error: 'Missing required fields (userId, name, primaryMuscles)' }, { status: 400 });
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
    console.error('Error creating exercise:', error);
    return NextResponse.json({ error: 'Failed to create exercise' }, { status: 500 });
  }
}
