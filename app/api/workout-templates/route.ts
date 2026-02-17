import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

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
    const { userId, name, goal, exercises } = body;

    if (!userId || !name || !goal) {
      return NextResponse.json({ error: 'Missing required fields (userId, name, goal)' }, { status: 400 });
    }

    const col = await getCollection('WorkoutTemplate');
    const now = new Date();

    const doc = {
      userId,
      name,
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
