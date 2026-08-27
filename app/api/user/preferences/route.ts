import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { getAuthUser } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuthUser(req);

    const preferencesCollection = await getCollection('UserPreferences');
    const preferences = await preferencesCollection.findOne({ userId });

    return NextResponse.json(preferences || {}, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    logger.error('Error fetching user preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user preferences' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuthUser(req);
    const body = await req.json();
    const { weightGoal, calorieGoal, workoutGoal, fastingGoal, age, gender, height, heightUnit, activityLevel, experienceLevel, fitnessGoal, weightUnit, onboardingComplete, currentWeight } = body;

    const preferencesCollection = await getCollection('UserPreferences');

    const updateData: Record<string, string | number | Date | boolean> = {
      userId,
      updatedAt: new Date(),
    };

    // Guard all numeric parses to prevent NaN persistence
    if (weightGoal !== undefined) { const v = parseFloat(weightGoal); if (!isNaN(v)) updateData.weightGoal = v; }
    if (calorieGoal !== undefined) { const v = parseInt(calorieGoal); if (!isNaN(v)) updateData.calorieGoal = v; }
    if (workoutGoal !== undefined) { const v = parseInt(workoutGoal); if (!isNaN(v)) updateData.workoutGoal = v; }
    if (fastingGoal !== undefined) { const v = parseInt(fastingGoal); if (!isNaN(v)) updateData.fastingGoal = v; }
    if (age !== undefined) { const v = parseInt(age); if (!isNaN(v)) updateData.age = v; }
    if (gender !== undefined) updateData.gender = gender;
    if (height !== undefined) { const v = parseFloat(height); if (!isNaN(v)) updateData.height = v; }
    if (heightUnit !== undefined) updateData.heightUnit = heightUnit;
    if (activityLevel !== undefined) { const v = parseFloat(activityLevel); if (!isNaN(v)) updateData.activityLevel = v; }
    if (experienceLevel !== undefined) updateData.experienceLevel = experienceLevel;
    if (fitnessGoal !== undefined) updateData.fitnessGoal = fitnessGoal;
    if (weightUnit !== undefined) updateData.weightUnit = weightUnit;
    if (onboardingComplete !== undefined) updateData.onboardingComplete = onboardingComplete;
    if (currentWeight !== undefined) { const v = parseFloat(currentWeight); if (!isNaN(v)) updateData.currentWeight = v; }

    await preferencesCollection.updateOne(
      { userId },
      {
        $set: updateData,
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true, ...updateData }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    logger.error('Error saving user preferences:', error);
    return NextResponse.json(
      { error: 'Failed to save user preferences' },
      { status: 500 }
    );
  }
}
