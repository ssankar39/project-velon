import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ObjectId } from 'mongodb';

/**
 * POST /api/metrics - Log a weight/body metrics entry
 * Body: { userId: string (user email), weight?: number, bodyFat?: number, bmr?: number, tdee?: number, bmi?: number }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, weight, bodyFat, bmr, tdee, bmi } = body;

    console.log('POST /api/metrics - Received body:', body);

    if (!userId) {
      console.error('Missing userId');
      return NextResponse.json(
        { error: 'userId (email) is required' },
        { status: 400 }
      );
    }

    const usersCollection = await getCollection('User');
    const metricsCollection = await getCollection('Metric');

    // Find user by email
    console.log('Looking for user with email:', userId);
    const user = await usersCollection.findOne({ email: userId });

    if (!user) {
      console.error('User not found for email:', userId);
      // Debug: Show all users in the collection
      const allUsers = await usersCollection.find({}).toArray();
      console.log('All users in database:', allUsers.map(u => ({ id: u._id, email: u.email, name: u.name })));
      return NextResponse.json(
        { error: 'User not found', details: `No user with email ${userId}. Available users: ${allUsers.map(u => u.email).join(', ')}` },
        { status: 404 }
      );
    }

    console.log('User found:', user._id);

    const timestamp = new Date();
    const metric = await metricsCollection.insertOne({
      userId: user._id.toString(),
      weight: weight ? parseFloat(weight) : null,
      bodyFat: bodyFat ? parseFloat(bodyFat) : null,
      bmr: bmr ? parseFloat(bmr) : null,
      tdee: tdee ? parseFloat(tdee) : null,
      bmi: bmi ? parseFloat(bmi) : null,
      timestamp,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log('Metric inserted:', metric.insertedId);
    return NextResponse.json({ 
      id: metric.insertedId.toString(), 
      weight: weight ? parseFloat(weight) : null,
      bodyFat: bodyFat ? parseFloat(bodyFat) : null,
      bmr: bmr ? parseFloat(bmr) : null,
      tdee: tdee ? parseFloat(tdee) : null,
      bmi: bmi ? parseFloat(bmi) : null,
      timestamp: timestamp.toISOString(),
      userId: user._id.toString()
    }, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error creating metric:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to create metric', details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * GET /api/metrics - Fetch metrics for a user
 * Query params: userId (required - user email)
 */
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
    const metricsCollection = await getCollection('Metric');

    // Get the database user ID from email
    const user = await usersCollection.findOne({ email });

    if (!user) {
      return NextResponse.json([], { status: 200 });
    }

    const metrics = await metricsCollection
      .find({ userId: user._id.toString() })
      .sort({ timestamp: -1 })
      .toArray();

    return NextResponse.json(metrics, { status: 200 });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
