import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

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
    const preferencesCollection = await getCollection('UserPreferences');

    const user = await usersCollection.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const preferences = await preferencesCollection.findOne({ userId: user._id.toString() });

    return NextResponse.json(preferences || {}, { status: 200 });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user preferences' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, weightGoal, calorieGoal, workoutGoal, fastingGoal, age, gender, height, heightUnit, activityLevel } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId (email) is required' },
        { status: 400 }
      );
    }

    const usersCollection = await getCollection('User');
    const preferencesCollection = await getCollection('UserPreferences');

    const user = await usersCollection.findOne({ email: userId });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const updateData: Record<string, string | number | Date> = {
      userId: user._id.toString(),
      updatedAt: new Date(),
    };

    if (weightGoal !== undefined) updateData.weightGoal = parseFloat(weightGoal);
    if (calorieGoal !== undefined) updateData.calorieGoal = parseInt(calorieGoal);
    if (workoutGoal !== undefined) updateData.workoutGoal = parseInt(workoutGoal);
    if (fastingGoal !== undefined) updateData.fastingGoal = parseInt(fastingGoal);
    if (age !== undefined) updateData.age = parseInt(age);
    if (gender !== undefined) updateData.gender = gender;
    if (height !== undefined) updateData.height = parseFloat(height);
    if (heightUnit !== undefined) updateData.heightUnit = heightUnit;
    if (activityLevel !== undefined) updateData.activityLevel = parseFloat(activityLevel);

    await preferencesCollection.updateOne(
      { userId: user._id.toString() },
      { 
        $set: updateData,
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true, ...updateData }, { status: 200 });
  } catch (error) {
    console.error('Error saving user preferences:', error);
    return NextResponse.json(
      { error: 'Failed to save user preferences' },
      { status: 500 }
    );
  }
}
