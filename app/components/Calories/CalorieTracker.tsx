'use client';

import React, { useState } from 'react';
import { Meal, MealType } from '@/app/types';
import { Plus, Trash2, Calendar } from 'lucide-react';

interface CalorieTrackerProps {
  onMealsUpdate: (meals: Meal[]) => void;
}

export const CalorieTracker: React.FC<CalorieTrackerProps> = ({
  onMealsUpdate,
}) => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [formState, setFormState] = useState({
    foodName: '',
    calories: '',
    mealType: 'breakfast' as MealType,
  });

  const handleAddFood = (e: React.FormEvent) => {
    e.preventDefault();

    const calories = parseInt(formState.calories);
    if (!formState.foodName.trim() || isNaN(calories) || calories <= 0) {
      alert('Please fill in all fields with valid values');
      return;
    }

    const newMeal: Meal = {
      id: Date.now(),
      name: formState.foodName,
      calories,
      type: formState.mealType,
    };

    const updatedMeals = [...meals, newMeal];
    setMeals(updatedMeals);
    onMealsUpdate(updatedMeals);

    setFormState({ foodName: '', calories: '', mealType: 'breakfast' });
  };

  const handleDeleteMeal = (id: number) => {
    const updatedMeals = meals.filter((meal) => meal.id !== id);
    setMeals(updatedMeals);
    onMealsUpdate(updatedMeals);
  };

  const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto p-4">
      {/* Add Food Card */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Plus className="w-6 h-6 text-gray-700" />
          <h3 className="text-2xl font-semibold text-gray-900">Add Food</h3>
        </div>

        <form onSubmit={handleAddFood} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Food name"
              value={formState.foodName}
              onChange={(e) => setFormState({ ...formState, foodName: e.target.value })}
              required
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <input
              type="number"
              placeholder="Calories"
              value={formState.calories}
              onChange={(e) => setFormState({ ...formState, calories: e.target.value })}
              required
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <select
              value={formState.mealType}
              onChange={(e) =>
                setFormState({ ...formState, mealType: e.target.value as MealType })
              }
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg hover:scale-105 transition-all"
          >
            Add Food
          </button>
        </form>
      </div>

      {/* Today's Meals Card */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-6 h-6 text-gray-700" />
          <h3 className="text-2xl font-semibold text-gray-900">Today&apos;s Meals</h3>
        </div>

        {meals.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No meals added yet</p>
        ) : (
          <div className="space-y-3 mb-4">
            {meals.map((meal) => (
              <div
                key={meal.id}
                className="flex items-center justify-between p-3 bg-gray-50 border-l-4 border-indigo-500 rounded"
              >
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{meal.name}</p>
                  <p className="text-sm text-gray-500 capitalize">{meal.type}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-lg font-semibold text-purple-600">{meal.calories} cal</p>
                  <button
                    onClick={() => handleDeleteMeal(meal.id)}
                    className="text-red-500 hover:text-red-700 hover:scale-125 transition-transform"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg border-t-2 border-gray-300">
          <p className="font-semibold text-gray-900">Total Calories:</p>
          <p className="text-2xl font-bold text-purple-600">{totalCalories.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};
