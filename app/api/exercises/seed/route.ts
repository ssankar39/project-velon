import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { EXERCISE_SEED } from '@/app/data/exercise-seed';
import { getAuthUser } from '@/lib/auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuthUser(req);

    // Only admin users can seed — for now, allow any authenticated user
    // TODO: Add admin role check
    void userId;

    const col = await getCollection('Exercise');
    const count = await col.countDocuments({ isCustom: false });

    if (count >= EXERCISE_SEED.length) {
      return NextResponse.json({ message: 'Exercises already seeded', count }, { status: 200 });
    }

    await col.deleteMany({ isCustom: false });
    const now = new Date();
    const docs = EXERCISE_SEED.map(e => ({ ...e, createdAt: now, updatedAt: now }));
    const result = await col.insertMany(docs);

    await col.createIndex({ name: 'text', aliases: 'text' });
    await col.createIndex({ primaryMuscles: 1 });
    await col.createIndex({ equipment: 1 });
    await col.createIndex({ movementPattern: 1 });
    await col.createIndex({ isCustom: 1, createdBy: 1 });

    return NextResponse.json(
      { message: 'Seeded exercises', count: result.insertedCount },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    logger.error('Seed error:', error);
    return NextResponse.json({ error: 'Failed to seed exercises' }, { status: 500 });
  }
}
