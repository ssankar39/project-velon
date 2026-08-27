import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { getAuthUser } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { logger } from '@/lib/logger';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { userId } = getAuthUser(req);
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    const body = await req.json();
    const { isActive, completedAt, endTime } = body;

    const fastingCollection = await getCollection('FastingSession');
    const result = await fastingCollection.updateOne(
      { _id: objectId, userId },
      {
        $set: {
          isActive: isActive ?? false,
          completedAt: completedAt ? new Date(completedAt) : null,
          endTime: endTime ? new Date(endTime) : null,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Fasting session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    logger.error('Error updating fasting session:', error);
    return NextResponse.json(
      { error: 'Failed to update fasting session' },
      { status: 500 }
    );
  }
}
