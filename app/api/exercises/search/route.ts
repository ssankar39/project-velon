import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const q = sp.get('q')?.trim();
    const muscle = sp.get('muscle') || sp.get('bodyPart');
    const userId = sp.get('userId');
    const limit = Math.min(Number(sp.get('limit') || 20), 50);

    if (!q && !muscle) {
      return NextResponse.json([], { status: 200 });
    }

    const col = await getCollection('Exercise');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {};

    if (q && q.length >= 2) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { aliases: { $regex: escaped, $options: 'i' } },
      ];
    }

    if (muscle) {
      query.primaryMuscles = muscle;
    }

    if (userId) {
      const visibility = [{ isCustom: false }, { isCustom: true, createdBy: userId }];
      if (query.$or) {
        const textOr = query.$or;
        delete query.$or;
        query.$and = [{ $or: textOr }, { $or: visibility }];
      } else {
        query.$or = visibility;
      }
    }

    const exercises = await col.find(query).limit(limit).sort({ name: 1 }).toArray();

    const results = exercises.map(e => ({
      id: e._id.toString(),
      _id: e._id.toString(),
      name: e.name,
      bodyPart: e.primaryMuscles?.[0] ?? 'general',
      target: e.primaryMuscles?.join(', ') ?? '',
      equipment: e.equipment ?? ['bodyweight'],
      primaryMuscles: e.primaryMuscles ?? [],
      secondaryMuscles: e.secondaryMuscles ?? [],
      movementPattern: e.movementPattern,
      difficulty: e.difficulty,
      category: e.category,
      instructions: e.instructions ?? '',
      aliases: e.aliases ?? [],
      variations: e.variations ?? [],
      rating: e.rating ?? 0,
      defaultRepRange: e.defaultRepRange ?? { min: 8, max: 12 },
      isCustom: e.isCustom ?? false,
    }));

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    logger.error('Error searching exercises:', error);
    return NextResponse.json({ error: 'Failed to search exercises' }, { status: 500 });
  }
}
