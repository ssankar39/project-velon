'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Activity, Trash2, TrendingUp, Loader2, X, Search } from 'lucide-react';
import { DatePicker } from '../DatePicker';

interface Workout {
  id: string;
  name: string;
  sets?: number;
  reps?: number;
  exerciseId?: string;
  bodyPart?: string;
  target?: string;
  equipment?: string;
  caloriesBurned: number;
  timestamp: string;
}

interface Exercise {
  id: string;
  name: string;
  bodyPart: string;
  target: string;
  equipment: string;
  gifUrl: string;
}

interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

export const WorkoutsModule: React.FC = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [suggestions, setSuggestions] = useState<Exercise[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  const [formState, setFormState] = useState({
    name: '',
    sets: '',
    reps: '',
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
  }, [currentUser, selectedDate]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchExercises = async (query: string) => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      setSearching(true);
      const url = `/api/exercises/search?q=${encodeURIComponent(query)}`;
      
      const response = await fetch(url);
      const data = await response.json();
      setSuggestions(data || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error searching exercises:', error);
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchClick = () => {
    if (formState.name.trim().length >= 2) {
      searchExercises(formState.name);
    }
  };

  const handleNameChange = (value: string) => {
    setFormState({ ...formState, name: value });
    setSelectedExercise(null);
  };

  const handleSelectExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setFormState({ ...formState, name: exercise.name });
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleClearSelection = () => {
    setSelectedExercise(null);
    setFormState({ ...formState, name: '' });
    setSuggestions([]);
  };

  const handleClearFilters = () => {
    setFormState({ name: '', sets: '', reps: '' });
    setSelectedExercise(null);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const fetchWorkouts = async () => {
    if (!currentUser?.email) return;
    try {
      setLoading(true);
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await fetch(
        `/api/workouts?userId=${encodeURIComponent(currentUser.email)}&date=${dateStr}`
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

    const sets = parseInt(formState.sets);
    const reps = parseInt(formState.reps);

    if (!formState.name.trim()) {
      alert('Please enter a workout name');
      return;
    }

    if (!currentUser) { 
      alert('User not authenticated');
      return;
    }

    try {
      setLoading(true);
      // Create timestamp for the selected date at current time
      const workoutTimestamp = new Date(selectedDate);
      workoutTimestamp.setHours(new Date().getHours());
      workoutTimestamp.setMinutes(new Date().getMinutes());
      workoutTimestamp.setSeconds(new Date().getSeconds());

      const workoutData = {
        userId: currentUser.email,
        name: formState.name,
        sets: isNaN(sets) ? null : sets,
        reps: isNaN(reps) ? null : reps,
        exerciseId: selectedExercise?.id || null,
        bodyPart: selectedExercise?.bodyPart || null,
        target: selectedExercise?.target || null,
        equipment: selectedExercise?.equipment || null,
        timestamp: workoutTimestamp.toISOString(),
      };

      const response = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workoutData),
      });

      if (!response.ok) {
        throw new Error('Failed to add workout');
      }

      const newWorkout = await response.json();
      setWorkouts([newWorkout, ...workouts]);
      setFormState({ name: '', sets: '', reps: '' });
      setSelectedExercise(null);
      setSuggestions([]);
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto p-4">
      {/* Add Workout Card */}
      <div className="glass rounded-2xl p-6 hover:scale-105 transition-transform duration-300 animate-fadeIn">
        <div className="flex items-center gap-3 mb-6">
          <Activity className="w-6 h-6 text-purple-400" />
          <h3 className="text-2xl font-semibold text-white">Log Workout</h3>
        </div>

        <form onSubmit={handleAddWorkout} className="space-y-4">
          {/* Exercise Name with Search Button */}
          <div className="relative" ref={suggestionsRef}>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <span>Exercise Name</span>
              <div className="flex gap-2 mt-1">
                {formState.name && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="text-xs px-3 py-1 bg-gray-600/20 hover:bg-gray-600/40 text-gray-300 rounded-md flex items-center gap-1 transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSearchClick}
                  disabled={searching || formState.name.trim().length < 2}
                  className="text-xs px-3 py-1 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 rounded-md flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {searching ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Search className="w-3 h-3" />
                  )}
                  Search
                </button>
              </div>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Enter exercise name..."
                value={formState.name}
                onChange={(e) => handleNameChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearchClick();
                  }
                }}
                required
                className="w-full px-4 py-2 glass-light rounded-lg focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/50 text-white placeholder-gray-400 border border-white/10"
              />
              {selectedExercise && (
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 glass-light rounded-lg border border-white/10 max-h-60 overflow-y-auto shadow-xl">
                {suggestions.map((exercise) => (
                  <button
                    key={exercise.id}
                    type="button"
                    onClick={() => handleSelectExercise(exercise)}
                    className="w-full text-left px-4 py-3 hover:bg-purple-600/20 transition-colors border-b border-white/5 last:border-b-0"
                  >
                    <p className="font-semibold text-white capitalize">{exercise.name}</p>
                    <div className="flex gap-2 mt-1 text-xs text-gray-400">
                      <span className="bg-purple-500/20 px-2 py-0.5 rounded capitalize">{exercise.bodyPart}</span>
                      <span className="bg-blue-500/20 px-2 py-0.5 rounded capitalize">{exercise.target}</span>
                      {exercise.equipment !== 'body weight' && (
                        <span className="bg-yellow-500/20 px-2 py-0.5 rounded capitalize">{exercise.equipment}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Selected Exercise Info */}
            {selectedExercise && (
              <div className="mt-2 p-2 glass-light rounded border-l-4 border-purple-500">
                <p className="text-xs text-gray-300">
                  <span className="font-semibold">Target:</span> {selectedExercise.target} • 
                  <span className="font-semibold ml-2">Body Part:</span> {selectedExercise.bodyPart}
                </p>
              </div>
            )}
          </div>

          {/* Sets and Reps */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Sets</label>
              <input
                type="number"
                placeholder="e.g., 3"
                min="0"
                value={formState.sets}
                onChange={(e) => setFormState({ ...formState, sets: e.target.value })}
                className="w-full px-4 py-2 glass-light rounded-lg focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/50 text-white placeholder-gray-400 border border-white/10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Reps</label>
              <input
                type="number"
                placeholder="e.g., 10"
                min="0"
                value={formState.reps}
                onChange={(e) => setFormState({ ...formState, reps: e.target.value })}
                className="w-full px-4 py-2 glass-light rounded-lg focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/50 text-white placeholder-gray-400 border border-white/10"
              />
            </div>
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

      {/* Workouts Card */}
      <div className="glass rounded-2xl p-6 hover:scale-105 transition-transform duration-300 animate-fadeIn">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-6 h-6 text-yellow-400" />
          <h3 className="text-2xl font-semibold text-white">
            {selectedDate.toDateString() === new Date().toDateString()
              ? "Today's Workouts"
              : `Workouts - ${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
          </h3>
        </div>

        {/* Date Picker */}
        <div className="mb-6">
          <DatePicker onDateSelect={(date) => setSelectedDate(date)} />
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
                  <p className="font-semibold text-white capitalize">{workout.name}</p>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {workout.bodyPart && (
                      <span className="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 capitalize">
                        {workout.bodyPart}
                      </span>
                    )}
                    {workout.sets && workout.reps && (
                      <span className="text-sm text-gray-400">
                        {workout.sets} sets × {workout.reps} reps
                      </span>
                    )}
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
