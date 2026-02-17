import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { EXERCISE_SEED } from '@/app/data/exercise-seed';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const col = await getCollection('Exercise');
    const count = await col.countDocuments({ isCustom: false });

    if (count >= EXERCISE_SEED.length) {
      return NextResponse.json({ message: 'Exercises already seeded', count }, { status: 200 });
    }

    // Drop existing non-custom exercises and re-seed
    await col.deleteMany({ isCustom: false });
    const now = new Date();
    const docs = EXERCISE_SEED.map(e => ({ ...e, createdAt: now, updatedAt: now }));
    const result = await col.insertMany(docs);

    // Create indexes for fast search
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
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Failed to seed exercises' }, { status: 500 });
  }
}
