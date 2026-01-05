import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;
    
    console.log('PATCH /api/fasting/[id] - ID:', id);
    
    const body = await req.json();
    const { isActive, completedAt, endTime } = body;

    console.log('PATCH /api/fasting/[id] - Body:', body);

    const fastingCollection = await getCollection('FastingSession');
    const result = await fastingCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          isActive: isActive ?? false,
          completedAt: completedAt ? new Date(completedAt) : null,
          endTime: endTime ? new Date(endTime) : null,
          updatedAt: new Date(),
        },
      }
    );

    console.log('PATCH /api/fasting/[id] - Update result:', result);

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Fasting session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error updating fasting session:', error);
    return NextResponse.json(
      { error: 'Failed to update fasting session' },
      { status: 500 }
    );
  }
}
