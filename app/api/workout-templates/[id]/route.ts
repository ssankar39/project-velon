import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

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

/** GET /api/workout-templates/[id] */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const col = await getCollection('WorkoutTemplate');
    const doc = await col.findOne({ _id: new ObjectId(id) });
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ ...doc, _id: doc._id.toString() }, { status: 200 });
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
  }
}

/** PUT /api/workout-templates/[id] */
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const col = await getCollection('WorkoutTemplate');

    const existing = await col.findOne({ _id: new ObjectId(id) });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const requestedName = typeof body.name === 'string' ? body.name.trim() : undefined;
    if (requestedName) {
      const siblings = await col
        .find({ userId: existing.userId, _id: { $ne: new ObjectId(id) } })
        .project({ _id: 1, name: 1 })
        .toArray() as Array<{ _id: { toString(): string }; name?: string }>;

      const clash = siblings.find(t => t.name && hasTemplateNameClash(requestedName, t.name));
      if (clash) {
        return NextResponse.json({
          error: 'Template name clashes with an existing template',
          clash: {
            _id: clash._id.toString(),
            name: clash.name,
          },
        }, { status: 409 });
      }
    }

    const update = {
      ...(requestedName && { name: requestedName }),
      ...(body.goal && { goal: body.goal }),
      ...(body.exercises && { exercises: body.exercises }),
      updatedAt: new Date(),
    };

    const result = await col.updateOne({ _id: new ObjectId(id) }, { $set: update });
    if (result.matchedCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}

/** DELETE /api/workout-templates/[id] */
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const col = await getCollection('WorkoutTemplate');
    const result = await col.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}
