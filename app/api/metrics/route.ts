import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { getAuthUser } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuthUser(req);
    const body = await req.json();
    const { weight, bodyFat, bmr, tdee, bmi } = body;

    const metricsCollection = await getCollection('Metric');

    const timestamp = new Date();
    const metric = await metricsCollection.insertOne({
      userId,
      weight: weight ? parseFloat(weight) : null,
      bodyFat: bodyFat ? parseFloat(bodyFat) : null,
      bmr: bmr ? parseFloat(bmr) : null,
      tdee: tdee ? parseFloat(tdee) : null,
      bmi: bmi ? parseFloat(bmi) : null,
      timestamp,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      id: metric.insertedId.toString(),
      weight: weight ? parseFloat(weight) : null,
      bodyFat: bodyFat ? parseFloat(bodyFat) : null,
      bmr: bmr ? parseFloat(bmr) : null,
      tdee: tdee ? parseFloat(tdee) : null,
      bmi: bmi ? parseFloat(bmi) : null,
      timestamp: timestamp.toISOString(),
      userId,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    logger.error('Error creating metric:', error);
    return NextResponse.json(
      { error: 'Failed to create metric' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuthUser(req);

    const metricsCollection = await getCollection('Metric');

    const metrics = await metricsCollection
      .find({ userId })
      .sort({ timestamp: -1 })
      .toArray();

    const formatted = metrics.map(({ _id, ...rest }) => ({ id: _id.toString(), ...rest }));

    return NextResponse.json(formatted, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    logger.error('Error fetching metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
