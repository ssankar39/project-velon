import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

// Mark this route as dynamic since it uses query parameters
export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/status - Get current user's authentication and onboarding status
 * Query: userId (email) - required
 * Returns: { id, email, name, onboardingComplete }
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId (email) is required' },
        { status: 400 }
      );
    }

    const usersCollection = await getCollection('User');
    const user = await usersCollection.findOne({ email: userId });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Fetch onboarding status from preferences
    const preferencesCollection = await getCollection('UserPreferences');
    const preferences = await preferencesCollection.findOne({ userId: user._id.toString() });
    const onboardingComplete = preferences?.onboardingComplete ?? false;

    return NextResponse.json({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      onboardingComplete,
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching auth status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch auth status' },
      { status: 500 }
    );
  }
}
