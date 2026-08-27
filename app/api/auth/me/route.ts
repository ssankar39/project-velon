import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const usersCollection = await getCollection('User');
    const user = await usersCollection.findOne({ _id: new ObjectId(session.sub) });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const preferencesCollection = await getCollection('UserPreferences');
    const preferences = await preferencesCollection.findOne({ userId: user._id.toString() });
    const onboardingComplete = preferences?.onboardingComplete ?? false;

    return NextResponse.json({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      onboardingComplete,
    });
  } catch (error) {
    logger.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}
