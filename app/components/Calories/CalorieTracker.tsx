'use client';

import React, { useState, useEffect } from 'react';
import { Meal, MealType } from '@/app/types';
import { Plus, Trash2, Calendar, Loader2 } from 'lucide-react';

interface CalorieTrackerProps {
  onMealsUpdate: (meals: Meal[]) => void;
}

interface CurrentUser {
  id: string;
  email: string;
  name?: string;
}

export const CalorieTracker: React.FC<CalorieTrackerProps> = ({
  onMealsUpdate,
}) => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [formState, setFormState] = useState({
    foodName: '',
    calories: '',
    mealType: 'breakfast' as MealType,
  });

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

  // Load today's meals from database
  useEffect(() => {
    if (currentUser) {
      fetchTodaysMeals();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const fetchTodaysMeals = async () => {
    if (!currentUser?.email) return;
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(
        `/api/meals?userId=${encodeURIComponent(currentUser.email)}&date=${today}`
      );
      const data = await response.json();
      setMeals(data || []);
      onMealsUpdate(data || []);
    } catch (error) {
      console.error('Error fetching meals:', error);
    } finally {
      setLoading(false);
    }
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
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add meal');
      }

      const newMeal = await response.json();
      const updatedMeals = [...meals, newMeal];
      setMeals(updatedMeals);
      onMealsUpdate(updatedMeals);

      setFormState({ foodName: '', calories: '', mealType: 'breakfast' });
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
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-900 placeholder-gray-400"
            />
          </div>

          <div>
            <input
              type="number"
              placeholder="Calories"
              value={formState.calories}
              onChange={(e) => setFormState({ ...formState, calories: e.target.value })}
              required
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-900 placeholder-gray-400"
            />
          </div>

          <div>
            <select
              value={formState.mealType}
              onChange={(e) =>
                setFormState({ ...formState, mealType: e.target.value as MealType })
              }
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-900"
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
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-6 h-6 text-gray-700" />
          <h3 className="text-2xl font-semibold text-gray-900">Today&apos;s Meals</h3>
        </div>

        {loading && meals.length === 0 ? (
          <p className="text-gray-500 text-center py-8 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading meals...
          </p>
        ) : meals.length === 0 ? (
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
                    disabled={loading}
                    className="text-red-500 hover:text-red-700 hover:scale-125 transition-transform disabled:opacity-50"
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

export default CalorieTracker;
