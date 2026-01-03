'use client';

import React, { useState, useEffect } from 'react';
import { Activity, Trash2, TrendingUp, Loader2 } from 'lucide-react';

interface Workout {
  id: string;
  name: string;
  duration: number;
  intensity: 'low' | 'medium' | 'high';
  caloriesBurned: number;
  timestamp: string;
}

interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

export const WorkoutsModule: React.FC = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [formState, setFormState] = useState({
    name: '',
    duration: '',
    intensity: 'medium' as 'low' | 'medium' | 'high',
    caloriesBurned: '',
  });

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

  useEffect(() => {
    if (currentUser) {
      fetchWorkouts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const fetchWorkouts = async () => {
    if (!currentUser?.email) return;
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(
        `/api/workouts?userId=${encodeURIComponent(currentUser.email)}&date=${today}`
      );
      const data = await response.json();
      setWorkouts(data || []);
    } catch (error) {
      console.error('Error fetching workouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWorkout = async (e: React.FormEvent) => {
    e.preventDefault();

    const duration = parseInt(formState.duration);
    const calories = parseInt(formState.caloriesBurned);

    if (!formState.name.trim() || isNaN(duration) || duration <= 0 || isNaN(calories) || calories < 0) {
      alert('Please fill in all fields with valid values');
      return;
    }

    if (!currentUser) {
      alert('User not authenticated');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.email,
          name: formState.name,
          duration,
          intensity: formState.intensity,
          caloriesBurned: calories,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add workout');
      }

      const newWorkout = await response.json();
      setWorkouts([newWorkout, ...workouts]);
      setFormState({ name: '', duration: '', intensity: 'medium', caloriesBurned: '' });
    } catch (error) {
      console.error('Error adding workout:', error);
      alert('Failed to add workout');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWorkout = async (id: string) => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/workouts/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete workout');
      }

      setWorkouts(workouts.filter((w) => w.id !== id));
    } catch (error) {
      console.error('Error deleting workout:', error);
      alert('Failed to delete workout');
    } finally {
      setLoading(false);
    }
  };

  const totalCaloriesBurned = workouts.reduce((sum, w) => sum + w.caloriesBurned, 0);
  const intensityColor = (intensity: string) => {
    switch (intensity) {
      case 'low':
        return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30';
      case 'high':
        return 'bg-red-500/20 text-red-300 border border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border border-gray-500/30';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto p-4">
      {/* Add Workout Card */}
      <div className="glass rounded-2xl p-6 hover:scale-105 transition-transform duration-300 animate-fadeIn">
        <div className="flex items-center gap-3 mb-6">
          <Activity className="w-6 h-6 text-purple-400" />
          <h3 className="text-2xl font-semibold text-white">Log Workout</h3>
        </div>

        <form onSubmit={handleAddWorkout} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Workout name"
              value={formState.name}
              onChange={(e) => setFormState({ ...formState, name: e.target.value })}
              required
              className="w-full px-4 py-2 glass-light rounded-lg focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/50 text-white placeholder-gray-400 border border-white/10"
            />
          </div>

          <div>
            <input
              type="number"
              placeholder="Duration (minutes)"
              value={formState.duration}
              onChange={(e) => setFormState({ ...formState, duration: e.target.value })}
              required
              className="w-full px-4 py-2 glass-light rounded-lg focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/50 text-white placeholder-gray-400 border border-white/10"
            />
          </div>

          <div>
            <select
              value={formState.intensity}
              onChange={(e) =>
                setFormState({ ...formState, intensity: e.target.value as 'low' | 'medium' | 'high' })
              }
              className="w-full px-4 py-2 glass-light rounded-lg focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/50 text-white border border-white/10"
            >
              <option value="low">Low Intensity</option>
              <option value="medium">Medium Intensity</option>
              <option value="high">High Intensity</option>
            </select>
          </div>

          <div>
            <input
              type="number"
              placeholder="Calories burned"
              value={formState.caloriesBurned}
              onChange={(e) => setFormState({ ...formState, caloriesBurned: e.target.value })}
              required
              className="w-full px-4 py-2 glass-light rounded-lg focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/50 text-white placeholder-gray-400 border border-white/10"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-purple-500/50 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Logging...
              </>
            ) : (
              'Log Workout'
            )}
          </button>
        </form>
      </div>

      {/* Today's Workouts Card */}
      <div className="glass rounded-2xl p-6 hover:scale-105 transition-transform duration-300 animate-fadeIn">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-6 h-6 text-yellow-400" />
          <h3 className="text-2xl font-semibold text-white">Today&apos;s Workouts</h3>
        </div>

        {loading && workouts.length === 0 ? (
          <p className="text-gray-400 text-center py-8 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading workouts...
          </p>
        ) : workouts.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No workouts logged yet</p>
        ) : (
          <div className="space-y-3 mb-4">
            {workouts.map((workout) => (
              <div
                key={workout.id}
                className="flex items-center justify-between p-3 glass-light border-l-4 border-purple-500 rounded-lg hover:scale-[1.02] transition-transform"
              >
                <div className="flex-1">
                  <p className="font-semibold text-white">{workout.name}</p>
                  <div className="flex gap-2 mt-1">
                    <span className={`text-xs px-2 py-1 rounded capitalize ${intensityColor(workout.intensity)}`}>
                      {workout.intensity}
                    </span>
                    <span className="text-sm text-gray-400">{workout.duration} min</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-lg font-semibold text-yellow-400">{workout.caloriesBurned} kcal</p>
                  <button
                    onClick={() => handleDeleteWorkout(workout.id)}
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

        <div className="flex items-center justify-between p-4 glass-light rounded-lg border-t-2 border-purple-500/30">
          <p className="font-semibold text-white">Total Burned:</p>
          <p className="text-2xl font-bold text-yellow-400">{totalCaloriesBurned.toLocaleString()} kcal</p>
        </div>
      </div>
    </div>
  );
};

export default WorkoutsModule;
