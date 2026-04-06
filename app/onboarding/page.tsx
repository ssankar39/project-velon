'use client';

import { useState, useEffect } from 'react';
import { Loader2, Zap, ChevronRight, ChevronLeft, Check } from 'lucide-react';

interface AuthUser { id: string; email: string; name?: string; }

const STEPS = ['Welcome', 'Body', 'Fitness', 'Goals'] as const;

export default function OnboardingPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    age: '',
    gender: 'male' as 'male' | 'female',
    height: '',
    heightUnit: 'in' as 'in' | 'cm',
    currentWeight: '',
    activityLevel: '1.55',
    experienceLevel: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    fitnessGoal: 'hypertrophy' as 'hypertrophy' | 'strength' | 'endurance',
    weightUnit: 'lbs' as 'lbs' | 'kg',
    workoutGoal: '5' as 'hypertrophy' | 'strength' | 'endurance' | string,
    weightGoal: '',
    calorieGoal: '',
  });

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { window.location.href = '/login'; return; }
    try { setUser(JSON.parse(stored)); } catch { window.location.href = '/login'; }
  }, []);

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const canAdvance = () => {
    if (step === 1) return form.age && form.height && form.currentWeight;
    if (step === 2) return true;
    if (step === 3) return true;
    return true;
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Save preferences
      await fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.email,
          age: parseInt(form.age) || null,
          gender: form.gender,
          height: parseFloat(form.height) || null,
          heightUnit: form.heightUnit,
          activityLevel: parseFloat(form.activityLevel),
          experienceLevel: form.experienceLevel,
          fitnessGoal: form.fitnessGoal,
          weightUnit: form.weightUnit,
          currentWeight: parseFloat(form.currentWeight) || null,
          weightGoal: form.weightGoal ? parseFloat(form.weightGoal) : null,
          calorieGoal: form.calorieGoal ? parseInt(form.calorieGoal) : null,
          onboardingComplete: true,
        }),
      });

      // Also save initial weight as a metric entry
      if (form.currentWeight) {
        await fetch('/api/metrics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.email,
            weight: parseFloat(form.currentWeight),
          }),
        });
      }

      const updatedUser: AuthUser & { onboardingComplete: boolean } = {
        ...user,
        onboardingComplete: true,
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      window.location.href = '/';
    } catch {
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass rounded-2xl shadow-2xl w-full max-w-lg animate-fadeIn overflow-hidden">
        {/* Progress */}
        <div className="flex gap-1 p-4 pb-0">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-purple-500' : 'bg-white/10'}`} />
          ))}
        </div>

        <div className="p-8">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-linear-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg">
                <Zap className="w-10 h-10 text-white" fill="currentColor" />
              </div>
              <h1 className="text-3xl font-bold text-white">Welcome{user.name ? `, ${user.name}` : ''}!</h1>
              <p className="text-gray-400">Let&apos;s set up your profile so we can personalize your fitness experience. This only takes a minute.</p>
            </div>
          )}

          {/* Step 1: Body metrics */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Your Body</h2>
                <p className="text-gray-400 text-sm">Used for accurate calorie and macro calculations.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Age</label>
                  <input type="number" value={form.age} onChange={e => set('age', e.target.value)}
                    placeholder="e.g. 25" className="w-full px-3 py-2.5 glass-light rounded-lg text-white border border-white/10 focus:border-purple-500 focus:outline-none placeholder-gray-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Gender</label>
                  <select value={form.gender} onChange={e => set('gender', e.target.value)}
                    className="w-full px-3 py-2.5 glass-light rounded-lg text-white border border-white/10 focus:border-purple-500 focus:outline-none">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Height</label>
                  <input type="number" value={form.height} onChange={e => set('height', e.target.value)}
                    placeholder={form.heightUnit === 'in' ? 'e.g. 70' : 'e.g. 178'}
                    className="w-full px-3 py-2.5 glass-light rounded-lg text-white border border-white/10 focus:border-purple-500 focus:outline-none placeholder-gray-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Height Unit</label>
                  <select value={form.heightUnit} onChange={e => set('heightUnit', e.target.value)}
                    className="w-full px-3 py-2.5 glass-light rounded-lg text-white border border-white/10 focus:border-purple-500 focus:outline-none">
                    <option value="in">Inches</option>
                    <option value="cm">Centimeters</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Current Weight ({form.weightUnit})</label>
                <input type="number" value={form.currentWeight} onChange={e => set('currentWeight', e.target.value)}
                  placeholder={form.weightUnit === 'lbs' ? 'e.g. 175' : 'e.g. 79'} className="w-full px-3 py-2.5 glass-light rounded-lg text-white border border-white/10 focus:border-purple-500 focus:outline-none placeholder-gray-500" />
              </div>
            </div>
          )}

          {/* Step 2: Fitness */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Fitness Level</h2>
                <p className="text-gray-400 text-sm">Helps us calibrate workout recommendations.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Experience Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['beginner', 'intermediate', 'advanced'] as const).map(lvl => (
                    <button key={lvl} onClick={() => set('experienceLevel', lvl)}
                      className={`py-3 rounded-xl text-sm font-medium capitalize transition-all ${
                        form.experienceLevel === lvl
                          ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                          : 'glass text-gray-300 hover:bg-white/10'
                      }`}>
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Activity Level</label>
                <select value={form.activityLevel} onChange={e => set('activityLevel', e.target.value)}
                  className="w-full px-3 py-2.5 glass-light rounded-lg text-white border border-white/10 focus:border-purple-500 focus:outline-none">
                  <option value="1.2">Sedentary (little or no exercise)</option>
                  <option value="1.375">Light (exercise 1-3 days/week)</option>
                  <option value="1.55">Moderate (exercise 3-5 days/week)</option>
                  <option value="1.725">Active (exercise 6-7 days/week)</option>
                  <option value="1.9">Very Active (intense exercise daily)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Fitness Goal</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['hypertrophy', 'strength', 'endurance'] as const).map(g => (
                    <button key={g} onClick={() => set('fitnessGoal', g)}
                      className={`py-3 rounded-xl text-sm font-medium capitalize transition-all ${
                        form.fitnessGoal === g
                          ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                          : 'glass text-gray-300 hover:bg-white/10'
                      }`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Preferred Weight Unit</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['lbs', 'kg'] as const).map(u => (
                    <button key={u} onClick={() => set('weightUnit', u)}
                      className={`py-3 rounded-xl text-sm font-medium transition-all ${
                        form.weightUnit === u
                          ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                          : 'glass text-gray-300 hover:bg-white/10'
                      }`}>
                      {u}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Goals */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Your Goals</h2>
                <p className="text-gray-400 text-sm">Optional — you can always change these in Settings.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Target Weight ({form.weightUnit})</label>
                <input type="number" step="0.1" value={form.weightGoal} onChange={e => set('weightGoal', e.target.value)}
                  placeholder={form.weightUnit === 'lbs' ? 'e.g. 165' : 'e.g. 75'} className="w-full px-3 py-2.5 glass-light rounded-lg text-white border border-white/10 focus:border-purple-500 focus:outline-none placeholder-gray-500" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Daily Calorie Goal</label>
                <input type="number" value={form.calorieGoal} onChange={e => set('calorieGoal', e.target.value)}
                  placeholder="Leave blank to auto-calculate from TDEE" className="w-full px-3 py-2.5 glass-light rounded-lg text-white border border-white/10 focus:border-purple-500 focus:outline-none placeholder-gray-500" />
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-8">
            {step > 0 ? (
              <button onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-1 px-4 py-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all text-sm">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            ) : <div />}

            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)} disabled={!canAdvance()}
                className="flex items-center gap-1 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium transition-all text-sm disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-purple-500/30">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleFinish} disabled={saving}
                className="flex items-center gap-1 px-6 py-2.5 rounded-xl bg-linear-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium transition-all text-sm disabled:opacity-60 shadow-lg shadow-purple-500/30">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Check className="w-4 h-4" /> Finish</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
