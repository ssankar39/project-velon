import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, protocol, startTime, endTime, completedAt } = body;

    if (!userId || !protocol || !startTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const usersCollection = await getCollection('User');
    const fastingCollection = await getCollection('FastingSession');

    const user = await usersCollection.findOne({ email: userId });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const result = await fastingCollection.insertOne({
      userId: user._id.toString(),
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
    console.error('Error creating fasting session:', error);
    return NextResponse.json(
      { error: 'Failed to create fasting session' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const email = searchParams.get('userId');

    if (!email) {
      return NextResponse.json(
        { error: 'userId (email) is required' },
        { status: 400 }
      );
    }

    const usersCollection = await getCollection('User');
    const fastingCollection = await getCollection('FastingSession');

    const user = await usersCollection.findOne({ email });

    if (!user) {
      return NextResponse.json([], { status: 200 });
    }

    const sessions = await fastingCollection.find({ userId: user._id.toString() }).sort({ startTime: -1 }).toArray();

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
    console.error('Error fetching fasting sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fasting sessions' },
      { status: 500 }
    );
  }
}
