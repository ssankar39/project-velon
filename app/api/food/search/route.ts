import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Type definitions
interface USDANutrient {
  nutrientId: number;
  nutrientName: string;
  value: number;
}

interface FoodPortion {
  id?: number;
  amount: number;
  gramWeight: number;
  modifier?: string;
  measureUnit?: {
    name: string;
  };
  portionDescription?: string;
}

interface USDAFood {
  fdcId: number;
  description: string;
  brandName?: string;
  brandOwner?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  dataType: string;
  foodNutrients?: USDANutrient[];
  foodPortions?: FoodPortion[];
}

async function searchUSDA(query: string, dataTypes?: string[], brandOwner?: string): Promise<unknown[]> {
  const apiKey = process.env.USDA_API_KEY || 'DEMO_KEY';
  
  // Build search criteria with all data types included by default
  const allDataTypes = ['Foundation', 'SR Legacy', 'Survey (FNDDS)', 'Experimental', 'Branded'];
  
  const searchCriteria: Record<string, unknown> = {
    query: query.toUpperCase(), // Convert to uppercase for better USDA search results
    dataType: dataTypes && dataTypes.length > 0 ? dataTypes : allDataTypes, // Use all data types if none specified
    pageSize: 100, // Increased for better coverage
    pageNumber: 1,
    sortBy: 'dataType.keyword', // Sort by data type for better relevance
    sortOrder: 'asc',
  };

  if (brandOwner) {
    searchCriteria.brandOwner = brandOwner;
  }

  // Use POST for more powerful search
  const response = await fetch(
    `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchCriteria),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch from USDA API');
  }

  const data = await response.json();

  return data.foods?.map((food: USDAFood) => {
    const calorieNutrient = food.foodNutrients?.find(
      (nutrient: USDANutrient) => 
        nutrient.nutrientName === 'Energy' || 
        nutrient.nutrientId === 1008
    );

    const caloriesPer100g = calorieNutrient ? calorieNutrient.value : 0;

    // Format portions for easier consumption with calorie calculations
    const portions = food.foodPortions?.map((portion: FoodPortion) => {
      // Calculate calories for this portion based on gram weight
      // USDA nutrients are per 100g
      const portionCalories = Math.round((caloriesPer100g * portion.gramWeight) / 100);
      
      return {
        amount: portion.amount,
        gramWeight: portion.gramWeight,
        description: portion.portionDescription || 
          (portion.measureUnit?.name ? `${portion.amount} ${portion.measureUnit.name}` : undefined),
        unit: portion.measureUnit?.name || portion.modifier,
        calories: portionCalories,
      };
    })
    .filter(p => {
      // Filter out portions with descriptions and exclude vague measurements
      if (!p.description) return false;
      const lowerDesc = p.description.toLowerCase();
      const lowerUnit = (p.unit || '').toLowerCase();
      // Exclude piece, slice, serving as they're not accurate enough
      const excludeTerms = ['piece', 'slice', 'serving'];
      return !excludeTerms.some(term => lowerDesc.includes(term) || lowerUnit.includes(term));
    }) || [];

    return {
      fdcId: food.fdcId,
      description: food.description,
      brandName: food.brandName || food.brandOwner,
      calories: Math.round(caloriesPer100g), // Per 100g
      servingSize: 100, // USDA nutrients are always per 100g
      servingSizeUnit: 'g',
      dataType: food.dataType,
      protein: food.foodNutrients?.find((n: USDANutrient) => n.nutrientId === 1003)?.value || 0,
      carbs: food.foodNutrients?.find((n: USDANutrient) => n.nutrientId === 1005)?.value || 0,
      fat: food.foodNutrients?.find((n: USDANutrient) => n.nutrientId === 1004)?.value || 0,
      portions: portions,
      source: 'usda',
    };
  }) || [];
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('query');
    const dataTypes = searchParams.get('dataTypes');
    const brandOwner = searchParams.get('brandOwner');
    
    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Parse dataTypes if provided (comma-separated)
    const dataTypeArray = dataTypes ? dataTypes.split(',').filter(Boolean) : undefined;

    // Search USDA with optional filters
    const foods = await searchUSDA(query, dataTypeArray, brandOwner || undefined);

    return NextResponse.json({ foods }, { status: 200 });
  } catch (error) {
    console.error('Error searching foods:', error);
    return NextResponse.json(
      { error: 'Failed to search foods' },
      { status: 500 }
    );
  }
}
