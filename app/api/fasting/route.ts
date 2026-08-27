import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { getAuthUser } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuthUser(req);
    const body = await req.json();
    const { protocol, startTime, endTime, completedAt } = body;

    if (!protocol || !startTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const fastingCollection = await getCollection('FastingSession');

    const result = await fastingCollection.insertOne({
      userId,
      protocol,
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : null,
      completedAt: completedAt ? new Date(completedAt) : null,
      isActive: !completedAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ id: result.insertedId.toString(), ...body }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    logger.error('Error creating fasting session:', error);
    return NextResponse.json(
      { error: 'Failed to create fasting session' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuthUser(req);

    const fastingCollection = await getCollection('FastingSession');

    const sessions = await fastingCollection.find({ userId }).sort({ startTime: -1 }).toArray();

    // Auto-complete sessions that have passed their end time
    const now = new Date();
    const updatedSessions = await Promise.all(
      sessions.map(async (session) => {
        if (session.isActive && session.endTime && new Date(session.endTime) < now) {
          await fastingCollection.updateOne(
            { _id: session._id },
            {
              $set: {
                isActive: false,
                completedAt: session.endTime,
                updatedAt: new Date()
              }
            }
          );
          return { ...session, id: session._id.toString(), isActive: false, completedAt: session.endTime };
        }
        return { ...session, id: session._id.toString() };
      })
    );

    return NextResponse.json(updatedSessions, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    logger.error('Error fetching fasting sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fasting sessions' },
      { status: 500 }
    );
  }
}
