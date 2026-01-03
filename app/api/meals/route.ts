import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, name, calories, type } = body;

    if (!userId || !name || !calories || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const usersCollection = await getCollection('User');
    const mealsCollection = await getCollection('Meal');

    const user = await usersCollection.findOne({ email: userId });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const result = await mealsCollection.insertOne({
      userId: user._id.toString(),
      name,
      calories: parseInt(calories),
      type,
      timestamp: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ id: result.insertedId.toString(), ...body }, { status: 201 });
  } catch (error) {
    console.error('Error creating meal:', error);
    return NextResponse.json(
      { error: 'Failed to create meal' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const email = searchParams.get('userId');
    const date = searchParams.get('date');

    if (!email) {
      return NextResponse.json(
        { error: 'userId (email) is required' },
        { status: 400 }
      );
    }

    const usersCollection = await getCollection('User');
    const mealsCollection = await getCollection('Meal');

    const user = await usersCollection.findOne({ email });

    if (!user) {
      return NextResponse.json([], { status: 200 });
    }

    // eslint-disable-next-line prefer-const
    const query: Record<string, unknown> = { userId: user._id.toString() };

    if (date) {
      // Parse date in local timezone to match the timestamps stored in the database
      const [year, month, day] = date.split('-').map(Number);
      const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
      const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);
      query.timestamp = { $gte: startOfDay, $lte: endOfDay };
    }

    const meals = await mealsCollection.find(query).sort({ timestamp: -1 }).toArray();

    // Transform MongoDB documents to match the expected format
    const transformedMeals = meals.map((meal) => ({
      id: meal._id.toString(),
      name: meal.name,
      calories: meal.calories,
      type: meal.type,
    }));

    return NextResponse.json(transformedMeals, { status: 200 });
  } catch (error) {
    console.error('Error fetching meals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meals' },
      { status: 500 }
    );
  }
}
