'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { GlassSidebar } from '@/app/components/GlassSidebar';
import { ModernTopBar } from '@/app/components/ModernTopBar';
import { DashboardModule } from '@/app/components/Dashboard/DashboardModule';
import { CalorieTracker } from '@/app/components/Calories/CalorieTracker';
import CalculatorModule from '@/app/components/Calculators/CalculatorModule';
import { FastingTracker } from '@/app/components/Fasting/FastingTracker';
import WorkoutsModule from '@/app/components/Workouts/WorkoutsModule';
import MetricsModule from '@/app/components/Metrics/MetricsModule';
import { ProfilePage } from '@/app/components/Profile/ProfilePage';
import { SettingsPage } from '@/app/components/Settings/SettingsPage';
import LandingPage from '@/app/components/LandingPage';
import AIChatWidget from '@/app/components/AIChatWidget';
import { UserStats, Meal, FastingState } from '@/app/types';
import { useAuth } from '@/app/hooks/useAuth';

type ModuleType = 'dashboard' | 'calories' | 'calculator' | 'fasting' | 'workouts' | 'metrics' | 'profile' | 'settings';

export default function Home() {
  const { user: currentUser, loading, logout } = useAuth();
  const [activeModule, setActiveModule] = useState<ModuleType>('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
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

  const handleLogout = () => {
    logout();
  };

  const handleMealsUpdate = useCallback((updatedMeals: Meal[]) => {
    setMeals(updatedMeals);
    const totalCalories = updatedMeals.reduce((sum, meal) => sum + meal.calories, 0);
    setUserStats((prev) => ({
      ...prev,
      caloriesConsumed: totalCalories,
    }));
  }, []);

  const handleFastingUpdate = useCallback((state: FastingState, progress: number) => {
    setUserStats((prev) => ({
      ...prev,
      fastingProgress: progress,
    }));
  }, []);

  const handleFastingStateChange = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  useEffect(() => {
    if (!loading && currentUser && !currentUser.onboardingComplete) {
      window.location.href = '/onboarding';
    }
  }, [loading, currentUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-semibold text-gray-300">Loading...</div>
      </div>
    );
  }

  // If not logged in, show landing page
  if (!currentUser) {
    return <LandingPage />;
  }

  if (!currentUser.onboardingComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-semibold text-gray-300">Redirecting to onboarding...</div>
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
        onModuleChange={(module) => {
          setActiveModule(module);
          setMobileMenuOpen(false);
        }}
        mobileMenuOpen={mobileMenuOpen}
        onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
      />

      {/* Modern Top Bar */}
      <ModernTopBar
        userName={currentUser?.name}
        userEmail={currentUser?.email}
        activeUsers={activeGoals}
        totalUsers={3}
        onBreak={3 - activeGoals}
        onModuleChange={setActiveModule}
        onLogout={handleLogout}
        onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
      />

      {/* Main Content Area - Responsive margins */}
      <main className="ml-0 md:ml-24 mt-20 min-h-screen p-4 md:p-6 lg:p-8 transition-all duration-300">
        {activeModule === 'dashboard' && <DashboardModule key={refreshKey} stats={userStats} />}
        {activeModule === 'calories' && <CalorieTracker onMealsUpdate={handleMealsUpdate} selectedDate={selectedDate} onDateChange={setSelectedDate} />}
        {activeModule === 'calculator' && <CalculatorModule />}
        {activeModule === 'fasting' && <FastingTracker onFastingUpdate={handleFastingUpdate} onStateChange={handleFastingStateChange} />}
        {activeModule === 'workouts' && <WorkoutsModule />}
        {activeModule === 'metrics' && <MetricsModule />}
        {activeModule === 'profile' && <ProfilePage />}
        {activeModule === 'settings' && <SettingsPage />}
      </main>

      {/* AI Coach Chat Widget - Workouts only */}
      {activeModule === 'workouts' && <AIChatWidget />}
    </div>
  );
}
