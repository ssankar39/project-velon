import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { toCSV } from '@/lib/csv';

export const dynamic = 'force-dynamic';

const CSV_HEADERS = [
  'name', 'aliases', 'primaryMuscles', 'secondaryMuscles',
  'movementPattern', 'equipment', 'repRangeMin', 'repRangeMax',
  'difficulty', 'category', 'instructions', 'variations',
];

/**
 * GET /api/exercises/export
 *
 * Query params:
 *   - muscle: filter by primaryMuscle
 *   - equipment: filter by equipment
 *   - userId: include user's custom exercises
 *
 * Returns a CSV download with all matching exercises.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const muscle = searchParams.get('muscle');
    const equipment = searchParams.get('equipment');
    const userId = searchParams.get('userId');

    const filter: Record<string, unknown> = {};
    if (muscle) filter['primaryMuscles'] = muscle;
    if (equipment) filter['equipment'] = equipment;
    if (userId) {
      filter['$or'] = [{ isCustom: false }, { createdBy: userId }];
    }

    const col = await getCollection('Exercise');
    const exercises = await col.find(filter).sort({ category: 1, name: 1 }).toArray();

    const rows = exercises.map(e => ({
      name: e.name ?? '',
      aliases: (e.aliases ?? []).join('|'),
      primaryMuscles: (e.primaryMuscles ?? []).join('|'),
      secondaryMuscles: (e.secondaryMuscles ?? []).join('|'),
      movementPattern: e.movementPattern ?? '',
      equipment: (e.equipment ?? []).join('|'),
      repRangeMin: String(e.defaultRepRange?.min ?? 8),
      repRangeMax: String(e.defaultRepRange?.max ?? 12),
      difficulty: e.difficulty ?? 'beginner',
      category: e.category ?? '',
      instructions: e.instructions ?? '',
      variations: (e.variations ?? []).join('|'),
    }));

    const csv = toCSV(rows, CSV_HEADERS);

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="exercises.csv"',
      },
    });
  } catch (error) {
    console.error('CSV export error:', error);
    return NextResponse.json({ error: 'Failed to export exercises' }, { status: 500 });
  }
}
