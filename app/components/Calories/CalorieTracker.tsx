'use client';

import React, { useState, useEffect } from 'react';
import { Meal, MealType } from '@/app/types';
import { Plus, Trash2, Calendar, Loader2, Search, X } from 'lucide-react';
import { DatePicker } from '../DatePicker';
import { calculateBMR_KatchMcArdle, atwaterAdjustMacros } from '@/app/utils/calculations';

interface CalorieTrackerProps {
  onMealsUpdate: (meals: Meal[]) => void;
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
}

interface CurrentUser {
  id: string;
  email: string;
  name?: string;
}

interface UserPreferences {
  age?: number;
  gender?: 'male' | 'female';
  height?: number;
  heightUnit?: 'in' | 'cm';
  activityLevel?: number;
  weightGoal?: number;
}

interface FoodSearchResult {
  fdcId: number;
  description: string;
  brandName?: string;
  calories: number;
  servingSize?: number;
  servingSizeUnit?: string;
  protein?: number;
  carbs?: number;
  fat?: number;
  portions?: Array<{
    amount: number;
    gramWeight: number;
    description?: string;
    unit?: string;
    calories: number;
  }>;
}

export const CalorieTracker: React.FC<CalorieTrackerProps> = ({
  onMealsUpdate,
  selectedDate,
  onDateChange,
}) => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [currentWeight, setCurrentWeight] = useState<number>(0);
  const [latestBodyFat, setLatestBodyFat] = useState<number | null>(null);
  const [formState, setFormState] = useState({
    foodName: '',
    calories: '',
    servingSize: '',
    mealType: 'breakfast' as MealType,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodSearchResult | null>(null);
  const [selectedServingAmount, setSelectedServingAmount] = useState(100);
  const [selectedServingUnit, setSelectedServingUnit] = useState('g');
  // Store original per-100g nutrient values to avoid compounding errors
  const [nutrientsPer100g, setNutrientsPer100g] = useState<{ calories: number; protein: number; carbs: number; fat: number } | null>(null);

  // Get current user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse stored user:', e);
      }
    }
  }, []);

  // Load user preferences, current weight, and body fat
  useEffect(() => {
    if (currentUser) {
      fetchUserPreferences();
      fetchCurrentWeight();
      fetchLatestBodyFat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Load today's meals from database
  useEffect(() => {
    if (currentUser) {
      fetchTodaysMeals();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, selectedDate]);

  // Update parent component when meals change
  useEffect(() => {
    onMealsUpdate(meals);
  }, [meals, onMealsUpdate]);

  const fetchUserPreferences = async () => {
    if (!currentUser?.email) return;
    try {
      const response = await fetch(
        `/api/user/preferences?userId=${encodeURIComponent(currentUser.email)}`
      );
      if (response.ok) {
        const data = await response.json();
        setUserPreferences(data);
      }
    } catch (error) {
      console.error('Error fetching user preferences:', error);
    }
  };

  const fetchCurrentWeight = async () => {
    if (!currentUser?.email) return;
    try {
      const response = await fetch(
        `/api/user/stats?userId=${encodeURIComponent(currentUser.email)}`
      );
      if (response.ok) {
        const data = await response.json();
        setCurrentWeight(data.currentWeight || 0);
      }
    } catch (error) {
      console.error('Error fetching current weight:', error);
    }
  };

  const fetchLatestBodyFat = async () => {
    if (!currentUser?.email) return;
    try {
      const response = await fetch(
        `/api/metrics?userId=${encodeURIComponent(currentUser.email)}`
      );
      if (response.ok) {
        const metrics = await response.json();
        // metrics are sorted newest-first; find the first one with a bodyFat value
        const withBf = (metrics as Record<string, unknown>[]).find(
          (m) => typeof m.bodyFat === 'number' && (m.bodyFat as number) > 0
        );
        if (withBf) setLatestBodyFat(withBf.bodyFat as number);
      }
    } catch (error) {
      console.error('Error fetching body fat:', error);
    }
  };

  // Calculate macro goals based on user data
  const calculateMacroGoals = () => {
    if (!userPreferences || !currentWeight) {
      // Default values if no user data available
      return { proteinGoal: 150, carbsGoal: 200, fatGoal: 65, calorieGoal: 2000 };
    }

    const { age, gender, height, heightUnit, activityLevel } = userPreferences;

    if (!age || !gender || !height || !heightUnit || !activityLevel) {
      return { proteinGoal: 150, carbsGoal: 200, fatGoal: 65, calorieGoal: 2000 };
    }

    // Weight is stored in lbs, convert to kg
    const weightKg = currentWeight * 0.453592;

    // Convert height to cm
    let heightCm = height;
    if (heightUnit === 'in') {
      heightCm = height * 2.54;
    }

    // Use Katch-McArdle when body fat is known (more accurate for individuals
    // with known body composition); fall back to Mifflin-St Jeor otherwise.
    let bmr: number;
    let equation: string;
    if (latestBodyFat && latestBodyFat > 0) {
      const km = calculateBMR_KatchMcArdle(weightKg, latestBodyFat, activityLevel);
      bmr = km.bmr;
      equation = 'Katch-McArdle';
    } else {
      if (gender === 'male') {
        bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
      } else {
        bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
      }
      equation = 'Mifflin-St Jeor';
    }

    // Calculate TDEE
    const tdee = Math.round(bmr * activityLevel);

    // Atwater-based macro split for general fitness (50/25/25)
    // Protein: 4 kcal/g | Carbs: 4 kcal/g | Fat: 9 kcal/g
    const carbsGoal = Math.round((tdee * 0.50) / 4);
    const proteinGoal = Math.round((tdee * 0.25) / 4);
    const fatGoal = Math.round((tdee * 0.25) / 9);

    console.log('Macro Calculation:', {
      equation,
      bodyFat: latestBodyFat,
      weight: currentWeight,
      weightKg,
      height,
      heightCm,
      age,
      gender,
      activityLevel,
      bmr,
      tdee,
      proteinGoal,
      carbsGoal,
      fatGoal
    });

    return { proteinGoal, carbsGoal, fatGoal, calorieGoal: tdee };
  };

  const fetchTodaysMeals = async () => {
    if (!currentUser?.email) return;
    try {
      setLoading(true);
      const dateToFetch = selectedDate || new Date();
      const dateStr = dateToFetch.toISOString().split('T')[0];
      const response = await fetch(
        `/api/meals?userId=${encodeURIComponent(currentUser.email)}&date=${dateStr}`
      );
      const data = await response.json();
      // Ensure numeric macro fields (API may return strings or different keys from older entries)
      // using component-scoped toNumber

      const normalized = (data || []).map((m: unknown) => {
        const mealRaw = m as Record<string, unknown>;
        // Try several possible locations/names for macros used in older documents
        const nutrients = mealRaw['nutrients'] as Record<string, unknown> | undefined;
        const macros = mealRaw['macros'] as Record<string, unknown> | undefined;

        const caloriesVal = toNumber(
          mealRaw['calories'] ?? mealRaw['kcal'] ?? nutrients?.['calories'] ?? nutrients?.['energy_kcal']
        );

        const proteinVal = toNumber(
          mealRaw['protein'] ?? mealRaw['protein_g'] ?? nutrients?.['protein'] ?? nutrients?.['protein_g'] ?? macros?.['protein']
        );

        const carbsVal = toNumber(
          mealRaw['carbs'] ?? mealRaw['carbs_g'] ?? nutrients?.['carbohydrates'] ?? nutrients?.['carbs'] ?? macros?.['carbs']
        );

        const fatVal = toNumber(
          mealRaw['fat'] ?? mealRaw['fat_g'] ?? nutrients?.['fat'] ?? nutrients?.['lipids'] ?? macros?.['fat']
        );

        return {
          id: String(mealRaw['id'] ?? mealRaw['_id'] ?? ''),
          name: String(mealRaw['name'] ?? mealRaw['title'] ?? ''),
          calories: caloriesVal,
          type: (String(mealRaw['type'] ?? 'breakfast') as MealType),
          protein: proteinVal,
          carbs: carbsVal,
          fat: fatVal,
        } as Meal;
      });
      // Enrich meals with macros via food search API when missing
      const enriched = await enrichMealsWithMacros(normalized);
      setMeals(enriched);
      onMealsUpdate(enriched);
    } catch (error) {
      console.error('Error fetching meals:', error);
    } finally {
      setLoading(false);
    }
  };

  // Enrich meals that are missing macros by searching the food API
  const enrichMealsWithMacros = async (mealsList: Meal[]): Promise<Meal[]> => {
    if (!mealsList || mealsList.length === 0) return mealsList;

    const results = await Promise.all(
      mealsList.map(async (meal) => {
        try {
            const getNum = (keyCandidates: (string | number | symbol)[]) => {
            for (const k of keyCandidates) {
              const v = (meal as unknown as Record<string, unknown>)[k as string];
              if (typeof v === 'number') return v as number;
              if (typeof v === 'string' && v.trim() !== '') return Number(v as string);
            }
            return 0;
          };

          const hasMacros = getNum(['protein']) > 0 || getNum(['carbs']) > 0 || getNum(['fat']) > 0;
          if (hasMacros) return meal;

          const name = meal.name as string | undefined;
          if (!name) return meal;

          const q = encodeURIComponent(name.split('-').pop()?.trim() || name);
          const resp = await fetch(`/api/food/search?query=${q}`);
          if (!resp.ok) return meal;
          const body = await resp.json();
          const first = body.foods && body.foods[0];
          if (!first) return meal;

          const sourceCalories = toNumber((first as Record<string, unknown>).calories);
          let factor = 0;
          const mealCalories = toNumber(meal.calories);
          if (sourceCalories > 0 && mealCalories > 0) {
            factor = mealCalories / sourceCalories;
          }

          const rawP = factor > 0 ? Math.round(toNumber((first as Record<string, unknown>).protein) * factor) : toNumber((first as Record<string, unknown>).protein);
          const rawC = factor > 0 ? Math.round(toNumber((first as Record<string, unknown>).carbs) * factor) : toNumber((first as Record<string, unknown>).carbs);
          const rawF = factor > 0 ? Math.round(toNumber((first as Record<string, unknown>).fat) * factor) : toNumber((first as Record<string, unknown>).fat);
          // Atwater cross-check to prevent inflated macros
          const adjusted = atwaterAdjustMacros(mealCalories, rawP, rawC, rawF);

          return {
            ...meal,
            protein: toNumber((meal as unknown as Record<string, unknown>).protein) || adjusted.protein,
            carbs: toNumber((meal as unknown as Record<string, unknown>).carbs) || adjusted.carbs,
            fat: toNumber((meal as unknown as Record<string, unknown>).fat) || adjusted.fat,
          } as Meal;
        } catch {
          return meal;
        }
      })
    );

    return results as Meal[];
  };

  const searchFoods = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const response = await fetch(
        `/api/food/search?query=${encodeURIComponent(searchQuery)}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to search foods');
      }

      const data = await response.json();
      setSearchResults(data.foods || []);
    } catch (error) {
      console.error('Error searching foods:', error);
      alert('Failed to search foods. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchFoods();
    }
  };

  const selectFood = (food: FoodSearchResult) => {
    // Store original per-100g values from the API
    const origNutrients = {
      calories: food.calories,
      protein: food.protein || 0,
      carbs: food.carbs || 0,
      fat: food.fat || 0,
    };
    setNutrientsPer100g(origNutrients);
    
    // Check if food has USDA portions
    if (food.portions && food.portions.length > 0) {
      const firstPortion = food.portions[0];
      setSelectedServingAmount(firstPortion.amount);
      setSelectedServingUnit(firstPortion.unit || 'serving');

      // Scale macros for the first portion's gram weight, then Atwater-adjust
      const grams = firstPortion.gramWeight || 100;
      const rawP = Math.round((origNutrients.protein * grams) / 100);
      const rawC = Math.round((origNutrients.carbs * grams) / 100);
      const rawF = Math.round((origNutrients.fat * grams) / 100);
      const adjusted = atwaterAdjustMacros(firstPortion.calories, rawP, rawC, rawF);

      setSelectedFood({
        ...food,
        protein: adjusted.protein,
        carbs: adjusted.carbs,
        fat: adjusted.fat,
      });

      setFormState({
        ...formState,
        foodName: food.brandName
          ? `${food.brandName} - ${food.description}`
          : food.description,
        calories: firstPortion.calories.toString(),
        servingSize: firstPortion.description || `${firstPortion.amount} ${firstPortion.unit}`,
      });
    } else {
      const baseAmount = food.servingSize || 100;
      const baseUnit = food.servingSizeUnit || 'g';
      setSelectedServingAmount(baseAmount);
      setSelectedServingUnit(baseUnit);
      setSelectedFood(food);

      setFormState({
        ...formState,
        foodName: food.brandName
          ? `${food.brandName} - ${food.description}`
          : food.description,
        calories: food.calories.toString(),
        servingSize: `${baseAmount}${baseUnit}`,
      });
    }

    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleServingAmountChange = (amount: string) => {
    const numAmount = parseFloat(amount) || 0;
    setSelectedServingAmount(numAmount);
    
    // Auto-convert if not using grams
    if (selectedServingUnit !== 'g' && selectedFood) {
      setTimeout(() => handleConvertMeasurement(), 0);
    }
  };

  const handleServingUnitChange = (unit: string) => {
    setSelectedServingUnit(unit);
    
    // Auto-convert if not using grams
    if (unit !== 'g' && selectedFood) {
      setTimeout(() => handleConvertMeasurement(), 0);
    }
  };

  const handleConvertMeasurement = () => {
    if (!selectedFood || !nutrientsPer100g) return;
    
    // Convert unit to grams for calculation
    const gramsAmount = convertToGrams(selectedServingAmount, selectedServingUnit);
    
    // Always calculate from original per-100g values to avoid compounding
    const newCalories = Math.round((nutrientsPer100g.calories * gramsAmount) / 100);
    const rawP = Math.round((nutrientsPer100g.protein * gramsAmount) / 100);
    const rawC = Math.round((nutrientsPer100g.carbs * gramsAmount) / 100);
    const rawF = Math.round((nutrientsPer100g.fat * gramsAmount) / 100);
    // Atwater cross-check: scale macros so 4/4/9 sum ≈ stated calories
    const adjusted = atwaterAdjustMacros(newCalories, rawP, rawC, rawF);
    
    setFormState({
      ...formState,
      calories: newCalories.toString(),
      servingSize: `${selectedServingAmount}${selectedServingUnit}`,
    });
    
    // Update selected food with Atwater-adjusted macros
    setSelectedFood({
      ...selectedFood,
      protein: adjusted.protein,
      carbs: adjusted.carbs,
      fat: adjusted.fat,
    });
  };

  const handleMeasurementKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConvertMeasurement();
    }
  };

  // Unit conversion to grams
  const convertToGrams = (amount: number, unit: string): number => {
    const conversions: Record<string, number> = {
      'g': 1,
      'kg': 1000,
      'mg': 0.001,
      'oz': 28.3495,
      'lb': 453.592,
      'ml': 1, // Assumes density of water (1g/ml)
      'L': 1000,
      'cup': 240, // Standard US cup
      'tbsp': 15,
      'tsp': 5,
    };
    
    return amount * (conversions[unit] || 1);
  };

  const handlePortionChange = (portionIndex: number) => {
    if (!selectedFood || !selectedFood.portions || !nutrientsPer100g) return;
    
    const portion = selectedFood.portions[portionIndex];
    setSelectedServingAmount(portion.amount);
    setSelectedServingUnit(portion.unit || 'serving');
    
    // Calculate macros from original per-100g values using portion gram weight
    const grams = portion.gramWeight || 100;
    const rawP = Math.round((nutrientsPer100g.protein * grams) / 100);
    const rawC = Math.round((nutrientsPer100g.carbs * grams) / 100);
    const rawF = Math.round((nutrientsPer100g.fat * grams) / 100);
    // Atwater cross-check against stated portion calories
    const adjusted = atwaterAdjustMacros(portion.calories, rawP, rawC, rawF);
    
    setSelectedFood({
      ...selectedFood,
      protein: adjusted.protein,
      carbs: adjusted.carbs,
      fat: adjusted.fat,
    });
    
    // Use pre-calculated calories from API
    setFormState({
      ...formState,
      calories: portion.calories.toString(),
      servingSize: portion.description || `${portion.amount} ${portion.unit}`,
    });
  };



  const handleAddFood = async (e: React.FormEvent) => {
    e.preventDefault();

    const calories = parseInt(formState.calories);
    if (!formState.foodName.trim() || isNaN(calories) || calories <= 0) {
      alert('Please fill in all fields with valid values');
      return;
    }

    if (!currentUser?.email) {
      alert('User not authenticated');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.email,
          name: formState.foodName,
          calories,
          type: formState.mealType,
          protein: selectedFood?.protein || 0,
          carbs: selectedFood?.carbs || 0,
          fat: selectedFood?.fat || 0,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add meal');
      }

      const newMeal = await response.json();
      // Normalize macros to numbers in case API returns strings
      const normalizedNewMeal = {
        ...newMeal,
        calories: Number(newMeal.calories) || 0,
        protein: Number(newMeal.protein) || 0,
        carbs: Number(newMeal.carbs) || 0,
        fat: Number(newMeal.fat) || 0,
      };
      const updatedMeals = [...meals, normalizedNewMeal];
      setMeals(updatedMeals);
      onMealsUpdate(updatedMeals);

      setFormState({ foodName: '', calories: '', servingSize: '', mealType: 'breakfast' });
      setSelectedFood(null);
      setNutrientsPer100g(null);
      setSelectedServingAmount(100);
      setSelectedServingUnit('g');
      
    } catch (error) {
      console.error('Error adding meal:', error);
      alert('Failed to add meal');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMeal = async (id: string) => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/meals/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete meal');
      }

      const updatedMeals = meals.filter((meal) => meal.id !== id);
      setMeals(updatedMeals);
      onMealsUpdate(updatedMeals);
    } catch (error) {
      console.error('Error deleting meal:', error);
      alert('Failed to delete meal');
    } finally {
      setLoading(false);
    }
  };

  const toNumber = (v: unknown) => {
    if (typeof v === 'number') return v;
    if (typeof v === 'string' && v.trim() !== '') return Number(v);
    return 0;
  };

  const totalCalories = meals.reduce((sum, meal) => sum + toNumber(meal.calories), 0);
  const totalProtein = meals.reduce((sum, meal) => sum + toNumber(meal.protein), 0);
  const totalCarbs = meals.reduce((sum, meal) => sum + toNumber(meal.carbs), 0);
  const totalFat = meals.reduce((sum, meal) => sum + toNumber(meal.fat), 0);

  // Calculate macro goals dynamically based on user data
  const { proteinGoal, carbsGoal, fatGoal } = calculateMacroGoals();

  // Helper to coerce unknown values to numbers

  // Calculate totals for the selected date (already handled by meals state)
  // The meals state is updated by fetchTodaysMeals, which uses selectedDate
  // So totalCalories, totalProtein, totalCarbs, totalFat already reflect the selected date

  // No change needed for the calculation, but update the Macros Card title to reflect the date
  const formattedDate = selectedDate ? new Date(selectedDate).toLocaleDateString() : new Date().toLocaleDateString();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto p-4 sm:p-6">
      {/* Add Food Card */}
      <div className="glass rounded-2xl p-6 hover:scale-105 transition-transform duration-300 animate-fadeIn">
        <div className="flex items-center gap-3 mb-6">
          <Plus className="w-6 h-6 text-purple-400" />
          <h3 className="text-2xl font-semibold text-white">Add Food</h3>
        </div>

        <form onSubmit={handleAddFood} className="space-y-4">
          {/* Food Search Toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowSearch(!showSearch)}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                showSearch
                  ? 'bg-purple-600 text-white'
                  : 'glass-light text-gray-300 hover:text-white'
              }`}
            >
              <Search className="w-4 h-4 inline mr-2" />
              Search
            </button>
            <button
              type="button"
              onClick={() => setShowSearch(false)}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                !showSearch
                  ? 'bg-purple-600 text-white'
                  : 'glass-light text-gray-300 hover:text-white'
              }`}
            >
              Manual Entry
            </button>
          </div>

          {/* Food Search */}
          {showSearch && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search for foods (press Enter)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleSearchKeyPress}
                    className="w-full pl-10 pr-10 py-2.5 glass-light rounded-lg focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/50 text-white placeholder-gray-400 border border-white/10"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={searchFoods}
                  disabled={searching || !searchQuery.trim()}
                  className="px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                </button>
              </div>

              {/* Search Results */}
              {searching && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                </div>
              )}

              {!searching && searchResults.length > 0 && (
                <div className="max-h-64 overflow-y-auto space-y-2 glass-light rounded-lg p-2">
                  {searchResults.map((food) => (
                    <button
                      key={food.fdcId}
                      type="button"
                      onClick={() => selectFood(food)}
                      className="w-full text-left p-3 rounded-lg hover:bg-white/10 transition-colors border border-white/5"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-white font-medium text-sm">
                            {food.brandName && (
                              <span className="text-purple-400">{food.brandName} - </span>
                            )}
                            {food.description}
                          </p>
                          {food.servingSize && (
                            <p className="text-xs text-gray-400 mt-1">
                              Serving: {food.servingSize}{food.servingSizeUnit}
                            </p>
                          )}
                          <div className="flex gap-3 mt-1 text-xs text-gray-400">
                            {food.protein && food.protein > 0 && <span>P: {Math.round(food.protein)}g</span>}
                            {food.carbs && food.carbs > 0 && <span>C: {Math.round(food.carbs)}g</span>}
                            {food.fat && food.fat > 0 && <span>F: {Math.round(food.fat)}g</span>}
                          </div>
                        </div>
                        <div className="text-purple-400 font-bold ml-3">
                          {food.calories} cal
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {!searching && searchQuery && searchResults.length === 0 && (
                <p className="text-center text-gray-400 py-4">
                  No foods found. Try a different search term.
                </p>
              )}
            </div>
          )}

          {/* Selected Food Display */}
          {selectedFood && (
            <div className="glass-light rounded-lg p-4 border border-purple-500/50">
              <div className="flex items-center justify-between mb-2">
                <p className="text-white font-medium">
                  {selectedFood.brandName && (
                    <span className="text-purple-400">{selectedFood.brandName} - </span>
                  )}
                  {selectedFood.description}
                </p>
                <button
                  type="button"
                  onClick={() => {
                      setSelectedFood(null);
                      setSelectedServingAmount(100);
                      setSelectedServingUnit('g');
                      setFormState({ ...formState, foodName: '', calories: '', servingSize: '' });
                    }}
                  className="text-red-400 hover:text-red-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-gray-400">
                Base: {selectedFood.calories} cal per {selectedFood.servingSize || 100}{selectedFood.servingSizeUnit || 'g'}
              </p>
            </div>
          )}

          {/* Manual Entry Fields */}
          {!selectedFood && (
            <div>
              <input
                type="text"
                placeholder="Food name"
                value={formState.foodName}
                onChange={(e) => setFormState({ ...formState, foodName: e.target.value })}
                required
                className="w-full px-3 py-2.5 glass-light rounded-lg focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/50 text-white placeholder-gray-400 border border-white/10"
              />
            </div>
          )}

          {/* Serving Size Input for Selected Food */}
          {selectedFood && (
            <div>
              <label className="text-sm text-gray-300 mb-1 block">Serving Size</label>
              
              {/* Show USDA portions dropdown if available */}
              {selectedFood.portions && selectedFood.portions.length > 0 ? (
                <div className="space-y-2">
                  <select
                    onChange={(e) => handlePortionChange(parseInt(e.target.value))}
                    className="w-full px-3 py-2.5 glass-light rounded-lg focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/50 text-white border border-white/10"
                  >
                    {selectedFood.portions.map((portion, index) => (
                      <option key={index} value={index}>
                        {portion.description} ({portion.gramWeight}g - {portion.calories} cal)
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400">
                    USDA household portions available
                  </p>
                </div>
              ) : (
                // Fallback to manual input
                <div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Amount"
                      value={selectedServingAmount}
                      onChange={(e) => handleServingAmountChange(e.target.value)}
                      onKeyPress={handleMeasurementKeyPress}
                      min="0"
                      step="0.1"
                      className="flex-1 px-3 py-2.5 glass-light rounded-lg focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/50 text-white placeholder-gray-400 border border-white/10"
                    />
                    <select
                      value={selectedServingUnit}
                      onChange={(e) => handleServingUnitChange(e.target.value)}
                      className="w-28 px-3 py-2.5 glass-light rounded-lg focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/50 text-white border border-white/10"
                    >
                      <option value="g">g</option>
                      <option value="kg">kg</option>
                      <option value="ml">ml</option>
                      <option value="L">L</option>
                      <option value="oz">oz</option>
                      <option value="lb">lb</option>
                      <option value="cup">cup</option>
                      <option value="tbsp">tbsp</option>
                      <option value="tsp">tsp</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Manual Serving Size for Non-Selected Food */}
          {!selectedFood && (
            <div>
              <input
                type="text"
                placeholder="Serving size (e.g., 100g, 1 cup, 2 slices)"
                value={formState.servingSize}
                onChange={(e) => setFormState({ ...formState, servingSize: e.target.value })}
                className="w-full px-3 py-2.5 glass-light rounded-lg focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/50 text-white placeholder-gray-400 border border-white/10"
              />
            </div>
          )}

          <div>
            <input
              type="number"
              placeholder="Calories"
              value={formState.calories}
              onChange={(e) => setFormState({ ...formState, calories: e.target.value })}
              required
              className="w-full px-3 py-2.5 glass-light rounded-lg focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/50 text-white placeholder-gray-400 border border-white/10"
            />
          </div>

          <div>
            <select
              value={formState.mealType}
              onChange={(e) =>
                setFormState({ ...formState, mealType: e.target.value as MealType })
              }
              className="w-full px-3 py-2.5 glass-light rounded-lg focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/50 text-white border border-white/10"
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-linear-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-purple-800 hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Adding...
              </>
            ) : (
              'Add Food'
            )}
          </button>
        </form>
      </div>

      {/* Today's Meals Card */}
      <div className="glass rounded-2xl p-6 hover:scale-105 transition-transform duration-300 animate-fadeIn">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-6 h-6 text-yellow-400" />
            <h3 className="text-2xl font-semibold text-white">Meals</h3>
          </div>
          <div className="mb-6">
            <DatePicker onDateSelect={(date: Date) => onDateChange ? onDateChange(date) : undefined} />
          </div>

        {loading && meals.length === 0 ? (
          <p className="text-gray-300 text-center py-8 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading meals...
          </p>
        ) : meals.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No meals added yet</p>
        ) : (
          <div className="space-y-3 mb-4">
            {meals.map((meal) => (
              <div
                key={meal.id}
                className="flex items-center justify-between p-3 glass-light border-l-4 border-purple-500 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-semibold text-white">{meal.name}</p>
                  <p className="text-sm text-gray-400 capitalize">{meal.type}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-lg font-semibold text-purple-400">{meal.calories} cal</p>
                  <button
                    onClick={() => handleDeleteMeal(meal.id)}
                    disabled={loading}
                    className="text-red-400 hover:text-red-300 hover:scale-125 transition-transform disabled:opacity-50"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between p-4 glass-light rounded-lg border-t-2 border-purple-500/50">
          <p className="font-semibold text-white">Total Calories:</p>
          <p className="text-2xl font-bold text-purple-400">{totalCalories.toLocaleString()}</p>
        </div>
      </div>

      {/* Macros Card */}
      <div className="glass rounded-2xl p-6 hover:scale-105 transition-transform duration-300 animate-fadeIn lg:col-span-2">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-blue-500 rounded"></div>
          <h3 className="text-2xl font-semibold text-white">Macronutrients ({formattedDate})</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Protein */}
          <div className="glass-light rounded-lg p-4 border border-green-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-300 font-medium">Protein</span>
              <span className="text-green-400 font-bold">{Math.round(totalProtein)}g</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((totalProtein / proteinGoal) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-400">
              {Math.round(totalProtein)} / {proteinGoal}g ({Math.round((totalProtein / proteinGoal) * 100)}%)
            </p>
          </div>

          {/* Carbs */}
          <div className="glass-light rounded-lg p-4 border border-blue-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-300 font-medium">Carbs</span>
              <span className="text-blue-400 font-bold">{Math.round(totalCarbs)}g</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((totalCarbs / carbsGoal) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-400">
              {Math.round(totalCarbs)} / {carbsGoal}g ({Math.round((totalCarbs / carbsGoal) * 100)}%)
            </p>
          </div>

          {/* Fat */}
          <div className="glass-light rounded-lg p-4 border border-yellow-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-300 font-medium">Fat</span>
              <span className="text-yellow-400 font-bold">{Math.round(totalFat)}g</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
              <div
                className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((totalFat / fatGoal) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-400">
              {Math.round(totalFat)} / {fatGoal}g ({Math.round((totalFat / fatGoal) * 100)}%)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalorieTracker;
