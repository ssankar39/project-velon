import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

/** GET /api/workout-sessions/[id] */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const col = await getCollection('WorkoutSession');
    const doc = await col.findOne({ _id: new ObjectId(id) });
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ ...doc, _id: doc._id.toString() }, { status: 200 });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}

/** PUT /api/workout-sessions/[id] – update exercises / notes / coach feedback */
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const col = await getCollection('WorkoutSession');

    const allowed = ['exercises', 'notes', 'duration', 'coachFeedback', 'goal', 'experienceLevel', 'templateId', 'templateName', 'status'];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update: Record<string, any> = { updatedAt: new Date() };
    for (const key of allowed) {
      if (body[key] !== undefined) update[key] = body[key];
    }

    const result = await col.updateOne({ _id: new ObjectId(id) }, { $set: update });
    if (result.matchedCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}

/** DELETE /api/workout-sessions/[id] */
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const col = await getCollection('WorkoutSession');
    const result = await col.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}
