'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/app/components/Header';
import { DashboardModule } from '@/app/components/Dashboard/DashboardModule';
import { CalorieTracker } from '@/app/components/Calories/CalorieTracker';
import CalculatorModule from '@/app/components/Calculators/CalculatorModule';
import { FastingTracker } from '@/app/components/Fasting/FastingTracker';
import WorkoutsModule from '@/app/components/Workouts/WorkoutsModule';
import MetricsModule from '@/app/components/Metrics/MetricsModule';
import { UserStats, Meal, FastingState } from '@/app/types';

interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

type ModuleType = 'dashboard' | 'calories' | 'calculator' | 'fasting' | 'workouts' | 'metrics';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState<ModuleType>('dashboard');
  const [userStats, setUserStats] = useState<UserStats>({
    caloriesConsumed: 1847,
    caloriesGoal: 2000,
    fastingProgress: 14.38,
    fastingGoal: 16,
    workoutsThisWeek: 4,
    workoutGoal: 5,
    currentWeight: 165,
    weightChange: -2.3,
  });

  const [, setMeals] = useState<Meal[]>([]);

  useEffect(() => {
    // Check localStorage for user
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        JSON.parse(storedUser) as AuthUser;
        setLoading(false);
      } catch (e) {
        console.error('Failed to parse stored user:', e);
        window.location.href = '/login';
      }
    } else {
      window.location.href = '/login';
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const handleMealsUpdate = (updatedMeals: Meal[]) => {
    setMeals(updatedMeals);
    const totalCalories = updatedMeals.reduce((sum, meal) => sum + meal.calories, 0);
    setUserStats((prev) => ({
      ...prev,
      caloriesConsumed: totalCalories,
    }));
  };

  const handleFastingUpdate = (state: FastingState, progress: number) => {
    setUserStats((prev) => ({
      ...prev,
      fastingProgress: progress,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-semibold text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header onModuleChange={setActiveModule} activeModule={activeModule} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto py-8 animate-fadeIn">
        {activeModule === 'dashboard' && <DashboardModule stats={userStats} />}
        {activeModule === 'calories' && <CalorieTracker onMealsUpdate={handleMealsUpdate} />}
        {activeModule === 'calculator' && <CalculatorModule />}
        {activeModule === 'fasting' && <FastingTracker onFastingUpdate={handleFastingUpdate} />}
        {activeModule === 'workouts' && <WorkoutsModule />}
        {activeModule === 'metrics' && <MetricsModule />}
      </main>
    </div>
  );
}
