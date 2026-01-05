'use client';

import React, { useState, useEffect } from 'react';
import { GlassSidebar } from '@/app/components/GlassSidebar';
import { ModernTopBar } from '@/app/components/ModernTopBar';
import { RightSidebar } from '@/app/components/RightSidebar';
import { DashboardModule } from '@/app/components/Dashboard/DashboardModule';
import { CalorieTracker } from '@/app/components/Calories/CalorieTracker';
import CalculatorModule from '@/app/components/Calculators/CalculatorModule';
import { FastingTracker } from '@/app/components/Fasting/FastingTracker';
import WorkoutsModule from '@/app/components/Workouts/WorkoutsModule';
import MetricsModule from '@/app/components/Metrics/MetricsModule';
import { ProfilePage } from '@/app/components/Profile/ProfilePage';
import { SettingsPage } from '@/app/components/Settings/SettingsPage';
import { UserStats, Meal, FastingState } from '@/app/types';

interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

type ModuleType = 'dashboard' | 'calories' | 'calculator' | 'fasting' | 'workouts' | 'metrics' | 'profile' | 'settings';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState<ModuleType>('dashboard');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
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
        const user = JSON.parse(storedUser) as AuthUser;
        setCurrentUser(user);
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
    // Only trigger refresh when fasting state changes (start/end), not on progress updates
    // This is handled by checking if isActive changed
  };

  const handleFastingStateChange = () => {
    // This is called only when starting or ending a fast
    setRefreshKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-semibold text-gray-300">Loading...</div>
      </div>
    );
  }

  // Calculate active goals vs total
  const activeGoals = [
    userStats.caloriesConsumed < userStats.caloriesGoal,
    userStats.fastingProgress < userStats.fastingGoal,
    userStats.workoutsThisWeek < userStats.workoutGoal,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen relative">
      {/* Glassmorphic Sidebar */}
      <GlassSidebar
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        onLogout={handleLogout}
      />

      {/* Modern Top Bar */}
      <ModernTopBar
        userName={currentUser?.name}
        userEmail={currentUser?.email}
        activeUsers={activeGoals}
        totalUsers={3}
        onBreak={3 - activeGoals}
      />

      {/* Main Content Area */}
      <main className="ml-20 mr-80 mt-20 min-h-screen p-8">
        {activeModule === 'dashboard' && <DashboardModule key={refreshKey} stats={userStats} />}
        {activeModule === 'calories' && <CalorieTracker onMealsUpdate={handleMealsUpdate} />}
        {activeModule === 'calculator' && <CalculatorModule />}
        {activeModule === 'fasting' && <FastingTracker onFastingUpdate={handleFastingUpdate} onStateChange={handleFastingStateChange} />}
        {activeModule === 'workouts' && <WorkoutsModule />}
        {activeModule === 'metrics' && <MetricsModule />}
        {activeModule === 'profile' && <ProfilePage />}
        {activeModule === 'settings' && <SettingsPage />}
      </main>

      {/* Right Sidebar */}
      <RightSidebar key={refreshKey} />
    </div>
  );
}
