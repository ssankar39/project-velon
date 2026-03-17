'use client';

import React, { useState, useEffect } from 'react';
import { Activity, Save, Loader2 } from 'lucide-react';

interface CurrentUser {
  id: string;
  email: string;
  name?: string;
}

interface PreferencesData {
  age: string;
  gender: 'male' | 'female';
  height: string;
  heightUnit: 'in' | 'cm';
  activityLevel: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  fitnessGoal: 'hypertrophy' | 'strength' | 'endurance';
  weightUnit: 'lbs' | 'kg';
}

export const SettingsPage: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' }>({ text: '', type: 'success' });
  const [preferences, setPreferences] = useState<PreferencesData>({
    age: '',
    gender: 'male',
    height: '',
    heightUnit: 'in',
    activityLevel: '1.55',
    experienceLevel: 'beginner',
    fitnessGoal: 'hypertrophy',
    weightUnit: 'lbs',
  });
  const [goals, setGoals] = useState({
    calorieGoal: '',
    fastingGoal: '',
    workoutGoal: '',
    weightGoal: '',
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        fetchPreferences(user.email);
      } catch (e) {
        console.error('Failed to parse stored user:', e);
      }
    }
  }, []);

  const fetchPreferences = async (email: string) => {
    try {
      const response = await fetch(`/api/user/preferences?userId=${encodeURIComponent(email)}`);
      const data = await response.json();
      if (data) {
        setPreferences(prev => ({
          ...prev,
          age: data.age?.toString() || '',
          gender: data.gender || 'male',
          height: data.height?.toString() || '',
          heightUnit: data.heightUnit || 'in',
          activityLevel: data.activityLevel?.toString() || '1.55',
          experienceLevel: data.experienceLevel || 'beginner',
          fitnessGoal: data.fitnessGoal || 'hypertrophy',
          weightUnit: data.weightUnit || 'lbs',
        }));
        setGoals({
          calorieGoal: data.calorieGoal?.toString() || '',
          fastingGoal: data.fastingGoal?.toString() || '',
          workoutGoal: data.workoutGoal?.toString() || '',
          weightGoal: data.weightGoal?.toString() || '',
        });
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    }
  };

  const handlePreferenceChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setPreferences({ ...preferences, [e.target.name]: e.target.value });
    setMessage({ text: '', type: 'success' });
  };

  const handleGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGoals({ ...goals, [e.target.name]: e.target.value });
    setMessage({ text: '', type: 'success' });
  };

  const handleUpdatePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ text: '', type: 'success' });

    if (!currentUser) {
      setMessage({ text: 'User not authenticated', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.email,
          age: preferences.age ? parseInt(preferences.age) : null,
          gender: preferences.gender,
          height: preferences.height ? parseFloat(preferences.height) : null,
          heightUnit: preferences.heightUnit,
          activityLevel: preferences.activityLevel ? parseFloat(preferences.activityLevel) : null,
          experienceLevel: preferences.experienceLevel,
          fitnessGoal: preferences.fitnessGoal,
          weightUnit: preferences.weightUnit,
          calorieGoal: goals.calorieGoal ? parseInt(goals.calorieGoal) : null,
          fastingGoal: goals.fastingGoal ? parseInt(goals.fastingGoal) : null,
          workoutGoal: goals.workoutGoal ? parseInt(goals.workoutGoal) : null,
          weightGoal: goals.weightGoal ? parseFloat(goals.weightGoal) : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ text: data.error || 'Failed to update preferences', type: 'error' });
        return;
      }

      setMessage({ text: 'Settings updated successfully! TDEE calculations will now use these values.', type: 'success' });
    } catch (error) {
      console.error('Error updating preferences:', error);
      setMessage({ text: 'Failed to update preferences', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 animate-fadeIn">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-3">
          <Activity className="w-8 h-8 text-purple-400" />
          Settings
        </h1>
        <p className="text-gray-300 mt-2 text-center">Configure your TDEE calculation preferences</p>
      </div>

      {/* TDEE Calculation Settings Card */}
      <div className="glass rounded-2xl p-8 hover:scale-[1.01] transition-transform duration-300 animate-fadeIn">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-400" />
          TDEE Calculation Settings
        </h2>
        <p className="text-sm text-gray-300 mb-6">
          Set your physical details and activity level for automatic TDEE calculations in Metrics
        </p>

        <form onSubmit={handleUpdatePreferences} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Age */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Age
              </label>
              <input
                type="number"
                name="age"
                value={preferences.age}
                onChange={handlePreferenceChange}
                placeholder="e.g., 30"
                className="w-full px-4 py-3 glass-light rounded-lg focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/50 text-white placeholder-gray-400 border border-white/10"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Gender
              </label>
              <select
                name="gender"
                value={preferences.gender}
                onChange={handlePreferenceChange}
                className="w-full px-4 py-3 glass-light rounded-lg focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/50 text-white border border-white/10"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            {/* Height */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Height
              </label>
              <input
                type="number"
                name="height"
                value={preferences.height}
                onChange={handlePreferenceChange}
                step="0.1"
                placeholder={preferences.heightUnit === 'in' ? 'e.g., 70' : 'e.g., 178'}
                className="w-full px-4 py-3 glass-light rounded-lg focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/50 text-white placeholder-gray-400 border border-white/10"
              />
            </div>

            {/* Height Unit */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Height Unit
              </label>
              <select
                name="heightUnit"
                value={preferences.heightUnit}
                onChange={handlePreferenceChange}
                className="w-full px-4 py-3 glass-light rounded-lg focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/50 text-white border border-white/10"
              >
                <option value="in">Inches</option>
                <option value="cm">Centimeters</option>
              </select>
            </div>
          </div>

          {/* Activity Level */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Activity Level
            </label>
            <select
              name="activityLevel"
              value={preferences.activityLevel}
              onChange={handlePreferenceChange}
              className="w-full px-4 py-3 glass-light rounded-lg focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/50 text-white border border-white/10"
            >
              <option value="1.2">Sedentary (little or no exercise)</option>
              <option value="1.375">Light (exercise 1-3 days/week)</option>
              <option value="1.55">Moderate (exercise 3-5 days/week)</option>
              <option value="1.725">Active (exercise 6-7 days/week)</option>
              <option value="1.9">Very Active (intense exercise daily)</option>
            </select>
          </div>

          {/* Workout Preferences */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Experience Level */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Experience Level
              </label>
              <select
                name="experienceLevel"
                value={preferences.experienceLevel}
                onChange={handlePreferenceChange}
                className="w-full px-4 py-3 glass-light rounded-lg focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/50 text-white border border-white/10"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            {/* Fitness Goal */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Fitness Goal
              </label>
              <select
                name="fitnessGoal"
                value={preferences.fitnessGoal}
                onChange={handlePreferenceChange}
                className="w-full px-4 py-3 glass-light rounded-lg focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/50 text-white border border-white/10"
              >
                <option value="hypertrophy">Hypertrophy</option>
                <option value="strength">Strength</option>
                <option value="endurance">Endurance</option>
              </select>
            </div>

            {/* Weight Unit */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Weight Unit
              </label>
              <select
                name="weightUnit"
                value={preferences.weightUnit}
                onChange={handlePreferenceChange}
                className="w-full px-4 py-3 glass-light rounded-lg focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/50 text-white border border-white/10"
              >
                <option value="lbs">lbs</option>
                <option value="kg">kg</option>
              </select>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/10 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Goals</h3>
            <p className="text-sm text-gray-300 mb-4">
              Set your daily and weekly goals to track your progress
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Calorie Goal */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Daily Calorie Goal
                </label>
                <input
                  type="number"
                  name="calorieGoal"
                  value={goals.calorieGoal}
                  onChange={handleGoalChange}
                  placeholder="e.g., 2000"
                  className="w-full px-4 py-3 glass-light rounded-lg focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/50 text-white placeholder-gray-400 border border-white/10"
                />
              </div>

              {/* Fasting Goal */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Fasting Goal (hours)
                </label>
                <input
                  type="number"
                  name="fastingGoal"
                  value={goals.fastingGoal}
                  onChange={handleGoalChange}
                  placeholder="e.g., 16"
                  className="w-full px-4 py-3 glass-light rounded-lg focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/50 text-white placeholder-gray-400 border border-white/10"
                />
              </div>

              {/* Workout Goal */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Weekly Workout Goal
                </label>
                <input
                  type="number"
                  name="workoutGoal"
                  value={goals.workoutGoal}
                  onChange={handleGoalChange}
                  placeholder="e.g., 5"
                  className="w-full px-4 py-3 glass-light rounded-lg focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/50 text-white placeholder-gray-400 border border-white/10"
                />
              </div>

              {/* Weight Goal */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Weight Goal (lbs)
                </label>
                <input
                  type="number"
                  name="weightGoal"
                  value={goals.weightGoal}
                  onChange={handleGoalChange}
                  step="0.1"
                  placeholder="e.g., 175"
                  className="w-full px-4 py-3 glass-light rounded-lg focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/50 text-white placeholder-gray-400 border border-white/10"
                />
              </div>
            </div>
          </div>

          {/* Message */}
          {message.text && (
            <div
              className={`p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-500/20 border border-green-500/50 text-green-300'
                  : 'bg-red-500/20 border border-red-500/50 text-red-300'
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-linear-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-purple-500/50 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Settings
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
