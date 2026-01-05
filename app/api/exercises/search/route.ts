import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('q');
    const bodyPart = searchParams.get('bodyPart');

    if ((!query || query.trim().length < 2) && !bodyPart) {
      return NextResponse.json([], { status: 200 });
    }

    let apiUrl = '';
    
    // If bodyPart is specified, use the bodypart-specific endpoint or filter
    if (bodyPart && !query) {
      // Search by body part only
      apiUrl = `https://www.exercisedb.dev/api/v1/bodyparts/${encodeURIComponent(bodyPart)}/exercises?limit=20`;
    } else if (bodyPart && query) {
      // Search with both query and body part filter
      apiUrl = `https://www.exercisedb.dev/api/v1/exercises/filter?search=${encodeURIComponent(query)}&bodyParts=${encodeURIComponent(bodyPart)}&limit=20`;
    } else {
      // Search by query only
      apiUrl = `https://www.exercisedb.dev/api/v1/exercises/search?q=${encodeURIComponent(query)}&limit=20`;
    }

    const response = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('ExerciseDB API error:', response.statusText);
      return NextResponse.json([], { status: 200 });
    }

    const result = await response.json();

    // Check if the response is successful
    if (!result.success || !result.data) {
      return NextResponse.json([], { status: 200 });
    }

    // Transform the data to match our interface
    const suggestions = result.data.map((exercise: any) => ({
      id: exercise.exerciseId,
      name: exercise.name,
      bodyPart: exercise.bodyParts?.[0] || 'general',
      target: exercise.targetMuscles?.[0] || 'various',
      equipment: exercise.equipments?.[0] || 'body weight',
      gifUrl: exercise.gifUrl,
    }));

    return NextResponse.json(suggestions, { status: 200 });
  } catch (error) {
    console.error('Error searching exercises:', error);
    return NextResponse.json([], { status: 200 });
  }
}
