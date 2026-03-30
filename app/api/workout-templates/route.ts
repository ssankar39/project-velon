import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

function normalizeTemplateName(name: string): string {
  const simplified = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return simplified
    .replace(/\b(day|days|workout|workouts|template|templates|session|sessions|training)\b/g, ' ')
    .replace(/\s+/g, '')
    .trim();
}

function hasTemplateNameClash(a: string, b: string): boolean {
  const aTrim = a.trim().toLowerCase();
  const bTrim = b.trim().toLowerCase();
  if (aTrim === bTrim) return true;

  const aNorm = normalizeTemplateName(aTrim);
  const bNorm = normalizeTemplateName(bTrim);
  if (!aNorm || !bNorm) return false;

  return aNorm === bNorm;
}

/** GET /api/workout-templates – list templates for a user */
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    const col = await getCollection('WorkoutTemplate');
    const templates = await col.find({ userId }).sort({ updatedAt: -1 }).toArray();
    const formatted = templates.map(({ _id, ...rest }) => ({ _id: _id.toString(), ...rest }));

    return NextResponse.json(formatted, { status: 200 });
  } catch (error) {
    console.error('Error listing templates:', error);
    return NextResponse.json({ error: 'Failed to list templates' }, { status: 500 });
  }
}

/** POST /api/workout-templates – create a template */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, name, goal, exercises, overrideExisting } = body;

    if (!userId || !name || !goal) {
      return NextResponse.json({ error: 'Missing required fields (userId, name, goal)' }, { status: 400 });
    }

    const col = await getCollection('WorkoutTemplate');
    const now = new Date();
    const trimmedName = String(name).trim();

    const existingTemplates = await col
      .find({ userId })
      .project({ _id: 1, name: 1 })
      .toArray() as Array<{ _id: { toString(): string }; name?: string }>;

    const clash = existingTemplates.find(t => t.name && hasTemplateNameClash(trimmedName, t.name));

    if (clash && !overrideExisting) {
      return NextResponse.json({
        error: 'Template name clashes with an existing template',
        clash: {
          _id: clash._id.toString(),
          name: clash.name,
        },
        options: ['rename', 'override'],
      }, { status: 409 });
    }

    if (clash && overrideExisting) {
      const updatedDoc = {
        userId,
        name: trimmedName,
        goal,
        exercises: exercises ?? [],
        updatedAt: now,
      };

      await col.updateOne({ _id: clash._id }, { $set: updatedDoc });
      return NextResponse.json({ _id: clash._id.toString(), ...updatedDoc, overridden: true }, { status: 200 });
    }

    const doc = {
      userId,
      name: trimmedName,
      goal,
      exercises: exercises ?? [],
      createdAt: now,
      updatedAt: now,
    };

    const result = await col.insertOne(doc);
    return NextResponse.json({ _id: result.insertedId.toString(), ...doc }, { status: 201 });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}
