'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Activity, Trash2, TrendingUp, Loader2, X, Search,
  Plus, ChevronDown, ChevronUp, Dumbbell, Brain,
  BookOpen, History, Save, Play, Check,
  AlertTriangle, ArrowUp, ArrowDown, Minus,
} from 'lucide-react';
import { DatePicker } from '../DatePicker';

// ─── Types (mirrors types/workout.ts, kept inline for component isolation) ───

interface SetEntry {
  setNumber: number;
  weight: number;
  reps: number;
  unit: 'lbs' | 'kg';
  isFailure: boolean;
  rpe?: number;
  restTime?: number;
}

interface PerformedExercise {
  exerciseId: string;
  exerciseName: string;
  orderIndex: number;
  notes?: string;
  sets: SetEntry[];
}

interface TemplateExercise {
  exerciseId: string;
  exerciseName: string;
  targetSets: number;
  targetReps: number;
  orderIndex: number;
  notes?: string;
}

interface WorkoutTemplate {
  _id: string;
  userId: string;
  name: string;
  goal: 'hypertrophy' | 'strength' | 'endurance';
  exercises: TemplateExercise[];
}

interface WorkoutSession {
  _id: string;
  userId: string;
  templateId?: string;
  templateName?: string;
  date: string;
  duration?: number;
  notes?: string;
  goal: 'hypertrophy' | 'strength' | 'endurance';
  experienceLevel?: string;
  exercises: PerformedExercise[];
  estimatedCalories?: number;
  coachFeedback?: CoachFeedback;
}

interface ExerciseSearch {
  id: string;
  _id: string;
  name: string;
  bodyPart: string;
  target: string;
  equipment: string | string[];
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  movementPattern?: string;
  difficulty?: string;
  category?: string;
  instructions?: string;
  aliases?: string[];
  variations?: string[];
  rating?: number;
  defaultRepRange?: { min: number; max: number };
  isCustom?: boolean;
}

interface CoachFeedback {
  nextSessionTargets: { exerciseName: string; targetSets: number; targetReps: string; targetWeight: number; targetUnit: string; notes?: string }[];
  progressionAdjustments: { exerciseName: string; type: string; description: string; value?: number }[];
  volumeBalance: { muscleGroup: string; currentSets: number; recommendedRange: { min: number; max: number }; action: string; suggestion?: string }[];
  warnings: { type: string; severity: string; message: string; affectedExercise?: string; affectedMuscle?: string }[];
  substitutions: { current: string; suggested: string; reason: string }[];
  summary: string;
}

interface AuthUser { id: string; email: string; name?: string; }

type Tab = 'log' | 'history' | 'library';

// ─── Main Component ──────────────────────────────────────────────────────────

export const WorkoutsModule: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('log');
  // seed flag kept intentionally disabled
  const [/* seeded */] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try { setCurrentUser(JSON.parse(stored)); } catch { /* skip */ }
    }
  }, []);

  // Seed endpoint still available at POST /api/exercises/seed if needed manually

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'log', label: 'Log Session', icon: <Play className="w-4 h-4" /> },
    { key: 'history', label: 'History', icon: <History className="w-4 h-4" /> },
    { key: 'library', label: 'Exercises', icon: <BookOpen className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 animate-fadeIn">
      {/* Tab Bar */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all
              ${activeTab === t.key
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                : 'glass text-gray-300 hover:bg-white/10'}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'log' && <SessionLogger user={currentUser} />}
      {activeTab === 'history' && <SessionHistory user={currentUser} />}
      {activeTab === 'library' && <ExerciseLibrary user={currentUser} />}
    </div>
  );
};

export default WorkoutsModule;

// ═══════════════════════════════════════════════════════════════════════════════
// SESSION LOGGER
// ═══════════════════════════════════════════════════════════════════════════════

function SessionLogger({ user }: { user: AuthUser | null }) {
  const [goal, setGoal] = useState<'hypertrophy' | 'strength' | 'endurance'>('hypertrophy');
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [exercises, setExercises] = useState<PerformedExercise[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [expandedEx, setExpandedEx] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weightUnit, setWeightUnit] = useState<'lbs' | 'kg'>('lbs');

  useEffect(() => {
    if (user) {
      fetch(`/api/workout-templates?userId=${encodeURIComponent(user.email)}`)
        .then(r => r.json())
        .then(setTemplates)
        .catch(() => {});
    }
  }, [user]);

  const loadTemplate = (templateId: string) => {
    const tpl = templates.find(t => t._id === templateId);
    if (!tpl) return;
    setGoal(tpl.goal);
    setSelectedTemplate(templateId);
    setExercises(tpl.exercises.map((e, i) => ({
      exerciseId: e.exerciseId,
      exerciseName: e.exerciseName,
      orderIndex: i,
      notes: e.notes,
      sets: Array.from({ length: e.targetSets }, (_, j) => ({
        setNumber: j + 1, weight: 0, reps: e.targetReps, unit: weightUnit, isFailure: false,
      })),
    })));
    setExpandedEx(0);
  };

  const addExercise = (ex: ExerciseSearch) => {
    setExercises(prev => [
      ...prev,
      {
        exerciseId: ex.id || ex._id,
        exerciseName: ex.name,
        orderIndex: prev.length,
        sets: [{ setNumber: 1, weight: 0, reps: 0, unit: weightUnit, isFailure: false }],
      },
    ]);
    setSearchOpen(false);
    setExpandedEx(exercises.length);
  };

  const removeExercise = (idx: number) => {
    setExercises(prev => prev.filter((_, i) => i !== idx).map((e, i) => ({ ...e, orderIndex: i })));
    if (expandedEx === idx) setExpandedEx(null);
  };

  const addSet = (exIdx: number) => {
    setExercises(prev => prev.map((e, i) => {
      if (i !== exIdx) return e;
      const prevSet = e.sets[e.sets.length - 1];
      return {
        ...e,
        sets: [...e.sets, {
          setNumber: e.sets.length + 1,
          weight: prevSet?.weight ?? 0,
          reps: prevSet?.reps ?? 0,
          unit: weightUnit,
          isFailure: false,
        }],
      };
    }));
  };

  const removeSet = (exIdx: number, setIdx: number) => {
    setExercises(prev => prev.map((e, i) => {
      if (i !== exIdx) return e;
      return { ...e, sets: e.sets.filter((_, j) => j !== setIdx).map((s, j) => ({ ...s, setNumber: j + 1 })) };
    }));
  };

  const updateSet = (exIdx: number, setIdx: number, field: string, value: number | boolean) => {
    setExercises(prev => prev.map((e, i) => {
      if (i !== exIdx) return e;
      return {
        ...e,
        sets: e.sets.map((s, j) => j === setIdx ? { ...s, [field]: value } : s),
      };
    }));
  };

  const saveSession = async () => {
    if (!user || !exercises.length) return;
    setSaving(true);
    try {
      const sessionDate = new Date(selectedDate);
      sessionDate.setHours(new Date().getHours(), new Date().getMinutes());

      const res = await fetch('/api/workout-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.email,
          goal,
          experienceLevel,
          exercises,
          notes: sessionNotes,
          templateId: selectedTemplate || undefined,
          templateName: templates.find(t => t._id === selectedTemplate)?.name,
          date: sessionDate.toISOString(),
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => {
          setExercises([]);
          setSessionNotes('');
          setSelectedTemplate('');
          setSaved(false);
        }, 2000);
      }
    } catch (e) {
      console.error('Save error:', e);
      alert('Failed to save session');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header controls */}
      <div className="glass rounded-2xl p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="w-6 h-6 text-purple-400" />
          <h3 className="text-xl font-semibold text-white">Log Workout Session</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Goal */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Goal</label>
            <select value={goal} onChange={e => setGoal(e.target.value as typeof goal)}
              className="w-full px-3 py-2 glass-light rounded-lg text-white border border-white/10 focus:border-purple-500 focus:outline-none">
              <option value="hypertrophy">Hypertrophy</option>
              <option value="strength">Strength</option>
              <option value="endurance">Endurance</option>
            </select>
          </div>
          {/* Experience */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Experience</label>
            <select value={experienceLevel} onChange={e => setExperienceLevel(e.target.value as typeof experienceLevel)}
              className="w-full px-3 py-2 glass-light rounded-lg text-white border border-white/10 focus:border-purple-500 focus:outline-none">
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          {/* Unit */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Weight Unit</label>
            <select value={weightUnit} onChange={e => setWeightUnit(e.target.value as 'lbs' | 'kg')}
              className="w-full px-3 py-2 glass-light rounded-lg text-white border border-white/10 focus:border-purple-500 focus:outline-none">
              <option value="lbs">lbs</option>
              <option value="kg">kg</option>
            </select>
          </div>
          {/* Template */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Template (optional)</label>
            <select value={selectedTemplate} onChange={e => { if (e.target.value) loadTemplate(e.target.value); else setSelectedTemplate(''); }}
              className="w-full px-3 py-2 glass-light rounded-lg text-white border border-white/10 focus:border-purple-500 focus:outline-none">
              <option value="">Start blank</option>
              {templates.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
          </div>
        </div>

        <div className="mb-4">
          <DatePicker onDateSelect={d => setSelectedDate(d)} />
        </div>

        {/* Notes */}
        <input
          type="text"
          placeholder="Session notes (optional)..."
          value={sessionNotes}
          onChange={e => setSessionNotes(e.target.value)}
          className="w-full px-3 py-2 glass-light rounded-lg text-white border border-white/10 focus:border-purple-500 focus:outline-none placeholder-gray-500 text-sm"
        />
      </div>

      {/* Exercise list */}
      <div className="space-y-3">
        {exercises.map((ex, exIdx) => (
          <div key={exIdx} className="glass rounded-xl overflow-hidden">
            {/* Exercise header */}
            <button
              onClick={() => setExpandedEx(expandedEx === exIdx ? null : exIdx)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-purple-400 bg-purple-500/20 w-6 h-6 rounded-full flex items-center justify-center">
                  {exIdx + 1}
                </span>
                <div>
                  <p className="font-semibold text-white capitalize">{ex.exerciseName}</p>
                  <p className="text-xs text-gray-400">{ex.sets.length} set{ex.sets.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={e => { e.stopPropagation(); removeExercise(exIdx); }}
                  className="text-red-400/60 hover:text-red-400 p-1 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
                {expandedEx === exIdx ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </div>
            </button>

            {/* Sets table */}
            {expandedEx === exIdx && (
              <div className="px-4 pb-4">
                {/* Header row */}
                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-400 mb-2 px-1">
                  <span className="col-span-1">Set</span>
                  <span className="col-span-3">Weight</span>
                  <span className="col-span-2">Reps</span>
                  <span className="col-span-2">RPE</span>
                  <span className="col-span-2">Fail?</span>
                  <span className="col-span-2"></span>
                </div>
                {ex.sets.map((set, sIdx) => (
                  <div key={sIdx} className="grid grid-cols-12 gap-2 items-center mb-2">
                    <span className="col-span-1 text-sm text-gray-400 text-center">{set.setNumber}</span>
                    <div className="col-span-3">
                      <input type="number" min="0" step="2.5" value={set.weight || ''} placeholder="0"
                        onChange={e => updateSet(exIdx, sIdx, 'weight', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 glass-light rounded text-white text-sm border border-white/10 focus:border-purple-500 focus:outline-none" />
                    </div>
                    <div className="col-span-2">
                      <input type="number" min="0" value={set.reps || ''} placeholder="0"
                        onChange={e => updateSet(exIdx, sIdx, 'reps', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 glass-light rounded text-white text-sm border border-white/10 focus:border-purple-500 focus:outline-none" />
                    </div>
                    <div className="col-span-2">
                      <input type="number" min="1" max="10" step="0.5" value={set.rpe || ''} placeholder="—"
                        onChange={e => updateSet(exIdx, sIdx, 'rpe', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 glass-light rounded text-white text-sm border border-white/10 focus:border-purple-500 focus:outline-none" />
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <button onClick={() => updateSet(exIdx, sIdx, 'isFailure', !set.isFailure)}
                        className={`w-6 h-6 rounded border flex items-center justify-center transition-colors
                          ${set.isFailure ? 'bg-red-500/30 border-red-500 text-red-400' : 'border-white/20 text-transparent hover:border-white/40'}`}>
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <button onClick={() => removeSet(exIdx, sIdx)}
                        className="text-gray-500 hover:text-red-400 p-1 transition-colors"
                        disabled={ex.sets.length <= 1}>
                        <Minus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
                <button onClick={() => addSet(exIdx)}
                  className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 mt-2 transition-colors">
                  <Plus className="w-3 h-3" /> Add Set
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add exercise / Search */}
      {searchOpen ? (
        <ExerciseSearchPopup
          user={user}
          onSelect={addExercise}
          onClose={() => setSearchOpen(false)}
        />
      ) : (
        <button onClick={() => setSearchOpen(true)}
          className="w-full py-3 border-2 border-dashed border-white/20 rounded-xl text-gray-400 hover:text-purple-400 hover:border-purple-500/50 transition-all flex items-center justify-center gap-2">
          <Plus className="w-5 h-5" /> Add Exercise
        </button>
      )}

      {/* Save button */}
      {exercises.length > 0 && (
        <button onClick={saveSession} disabled={saving || saved}
          className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2
            ${saved
              ? 'bg-green-600 text-white'
              : 'bg-linear-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white hover:shadow-lg hover:shadow-purple-500/30'
            } disabled:opacity-60`}>
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
            : saved ? <><Check className="w-4 h-4" /> Saved!</>
            : <><Save className="w-4 h-4" /> Save Session</>}
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXERCISE SEARCH POPUP (used in SessionLogger + TemplateManager)
// ═══════════════════════════════════════════════════════════════════════════════

function ExerciseSearchPopup({ user, onSelect, onClose }: {
  user: AuthUser | null;
  onSelect: (ex: ExerciseSearch) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ExerciseSearch[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const url = `/api/exercises/search?q=${encodeURIComponent(q)}${user ? `&userId=${encodeURIComponent(user.email)}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      setResults(data ?? []);
    } catch { setResults([]); }
    finally { setSearching(false); }
  }, [user]);

  useEffect(() => {
    const t = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(t);
  }, [query, doSearch]);

  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Search className="w-4 h-4 text-gray-400" />
        <input ref={inputRef} type="text" placeholder="Search exercises..."
          value={query} onChange={e => setQuery(e.target.value)}
          className="flex-1 bg-transparent text-white"
        />
        <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
      </div>
      {searching && <p className="text-xs text-gray-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Searching...</p>}
      <div className="max-h-60 overflow-y-auto space-y-1">
        {results.map(ex => (
          <button key={ex.id} onClick={() => onSelect(ex)}
            className="w-full text-left p-2.5 rounded-lg hover:bg-white/10 transition-colors">
            <p className="font-medium text-white capitalize text-sm">{ex.name}</p>
            <div className="flex gap-1.5 mt-1 flex-wrap">
              {ex.bodyPart && <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 capitalize">{ex.bodyPart}</span>}
              {ex.equipment && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 capitalize">{Array.isArray(ex.equipment) ? ex.equipment.join(', ').replace(/_/g, ' ') : String(ex.equipment).replace(/_/g, ' ')}</span>}
              {ex.movementPattern && <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 capitalize">{ex.movementPattern}</span>}
            </div>
          </button>
        ))}
        {!searching && query.length >= 2 && results.length === 0 && (
          <p className="text-xs text-gray-500 py-2 text-center">No exercises found</p>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATE MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// SESSION HISTORY + AI COACH
// ═══════════════════════════════════════════════════════════════════════════════

function SessionHistory({ user }: { user: AuthUser | null }) {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [coachLoading, setCoachLoading] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'date' | 'recent'>('recent');

  const fetchSessions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const params = viewMode === 'date'
        ? `userId=${encodeURIComponent(user.email)}&date=${selectedDate.toISOString().split('T')[0]}`
        : `userId=${encodeURIComponent(user.email)}&weeks=4&limit=20`;
      const res = await fetch(`/api/workout-sessions?${params}`);
      const data = await res.json();
      setSessions(Array.isArray(data) ? data : []);
    } catch { setSessions([]); }
    finally { setLoading(false); }
  }, [user, selectedDate, viewMode]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const getCoachFeedback = async (sessionId: string) => {
    if (!user) return;
    setCoachLoading(sessionId);
    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, userId: user.email }),
      });
      if (res.ok) {
        const feedback = await res.json();
        setSessions(prev => prev.map(s => s._id === sessionId ? { ...s, coachFeedback: feedback } : s));
      }
    } catch (e) {
      console.error('Coach error:', e);
      alert('Failed to get coaching feedback');
    } finally {
      setCoachLoading(null);
    }
  };

  const deleteSession = async (id: string) => {
    try {
      await fetch(`/api/workout-sessions/${id}`, { method: 'DELETE' });
      setSessions(prev => prev.filter(s => s._id !== id));
    } catch { /* skip */ }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-yellow-400" />
          <h3 className="text-xl font-semibold text-white">Session History</h3>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setViewMode('recent')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${viewMode === 'recent' ? 'bg-purple-600 text-white' : 'glass text-gray-300 hover:bg-white/10'}`}>
            Recent
          </button>
          <button onClick={() => setViewMode('date')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${viewMode === 'date' ? 'bg-purple-600 text-white' : 'glass text-gray-300 hover:bg-white/10'}`}>
            By Date
          </button>
        </div>
      </div>

      {viewMode === 'date' && (
        <div className="glass rounded-xl p-4">
          <DatePicker onDateSelect={d => setSelectedDate(d)} />
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 text-center py-8 flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</p>
      ) : sessions.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center">
          <History className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No sessions found. Start logging workouts!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map(session => (
            <div key={session._id} className="glass rounded-xl overflow-hidden">
              {/* Session header */}
              <button onClick={() => setExpanded(expanded === session._id ? null : session._id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors">
                <div>
                  <p className="font-semibold text-white">
                    {session.templateName || 'Free Session'}
                    <span className="text-xs text-gray-400 ml-2">
                      {new Date(session.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                  </p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 capitalize">{session.goal}</span>
                    <span className="text-[10px] text-gray-400">{session.exercises?.length || 0} exercises</span>
                    {session.estimatedCalories && (
                      <span className="text-[10px] text-yellow-400">{session.estimatedCalories} kcal</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {session.coachFeedback && <Brain className="w-4 h-4 text-green-400" />}
                  <button onClick={e => { e.stopPropagation(); deleteSession(session._id); }}
                    className="text-red-400/60 hover:text-red-400 p-1"><Trash2 className="w-4 h-4" /></button>
                  {expanded === session._id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </button>

              {/* Expanded content */}
              {expanded === session._id && (
                <div className="px-4 pb-4 space-y-4">
                  {/* Exercise details */}
                  {session.exercises?.map((ex, i) => (
                    <div key={i} className="glass-light rounded-lg p-3">
                      <p className="text-sm font-semibold text-white capitalize mb-2">{ex.exerciseName}</p>
                      <div className="space-y-1">
                        {ex.sets?.map((set, j) => (
                          <div key={j} className="flex items-center gap-3 text-xs text-gray-300">
                            <span className="text-gray-500 w-8">Set {set.setNumber}</span>
                            <span className="font-medium text-white">{set.weight}{set.unit}</span>
                            <span>× {set.reps}</span>
                            {set.rpe && <span className="text-purple-400">RPE {set.rpe}</span>}
                            {set.isFailure && <span className="text-red-400 font-medium">FAIL</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Coach feedback button / display */}
                  {!session.coachFeedback ? (
                    <button onClick={() => getCoachFeedback(session._id)}
                      disabled={coachLoading === session._id}
                      className="w-full py-2.5 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-60">
                      {coachLoading === session._id
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
                        : <><Brain className="w-4 h-4" /> Get AI Coach Feedback</>}
                    </button>
                  ) : (
                    <CoachFeedbackDisplay feedback={session.coachFeedback} />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COACH FEEDBACK DISPLAY
// ═══════════════════════════════════════════════════════════════════════════════

function CoachFeedbackDisplay({ feedback }: { feedback: CoachFeedback }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="space-y-3">
      {/* AI Summary */}
      <div className="glass-light rounded-lg p-4 border-l-4 border-blue-500">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-semibold text-blue-400">AI Coach Analysis</span>
        </div>
        <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
          {feedback.summary}
        </div>
      </div>

      <button onClick={() => setShowDetails(!showDetails)}
        className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors">
        {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {showDetails ? 'Hide' : 'Show'} detailed breakdown
      </button>

      {showDetails && (
        <div className="space-y-3">
          {/* Next session targets */}
          {feedback.nextSessionTargets?.length > 0 && (
            <div className="glass-light rounded-lg p-3">
              <p className="text-xs font-semibold text-purple-400 mb-2 flex items-center gap-1">
                <Dumbbell className="w-3 h-3" /> Next Session Targets
              </p>
              <div className="space-y-1.5">
                {feedback.nextSessionTargets.map((t, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-gray-300 capitalize">{t.exerciseName}</span>
                    <span className="text-white font-medium">{t.targetSets}×{t.targetReps} @ {t.targetWeight}{t.targetUnit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progression adjustments */}
          {feedback.progressionAdjustments?.length > 0 && (
            <div className="glass-light rounded-lg p-3">
              <p className="text-xs font-semibold text-green-400 mb-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Progression Adjustments
              </p>
              <div className="space-y-1.5">
                {feedback.progressionAdjustments.map((adj, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    {adj.type.includes('increase') ? <ArrowUp className="w-3 h-3 text-green-400 mt-0.5 shrink-0" />
                      : adj.type.includes('decrease') || adj.type === 'deload' ? <ArrowDown className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />
                      : <Minus className="w-3 h-3 text-gray-400 mt-0.5 shrink-0" />}
                    <span className="text-gray-300">{adj.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {feedback.warnings?.length > 0 && (
            <div className="glass-light rounded-lg p-3">
              <p className="text-xs font-semibold text-yellow-400 mb-2 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Warnings
              </p>
              <div className="space-y-1.5">
                {feedback.warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className={`shrink-0 w-2 h-2 rounded-full mt-1 ${w.severity === 'high' ? 'bg-red-500' : w.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                    <span className="text-gray-300">{w.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXERCISE LIBRARY
// ═══════════════════════════════════════════════════════════════════════════════

function ExerciseLibrary({ user }: { user: AuthUser | null }) {
  const [exercises, setExercises] = useState<ExerciseSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);


  const muscles = [
    '', 'chest', 'front_delts', 'side_delts', 'rear_delts',
    'upper_back', 'lats', 'lower_back', 'traps',
    'biceps', 'triceps', 'forearms',
    'quads', 'hamstrings', 'glutes', 'calves',
    'abs', 'obliques',
  ];

  const fetchExercises = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim().length >= 2) params.set('q', searchQuery);
      if (muscleFilter) params.set('muscle', muscleFilter);
      if (user) params.set('userId', user.email);
      params.set('limit', '50');

      const url = searchQuery.trim().length >= 2 || muscleFilter
        ? `/api/exercises/search?${params}`
        : `/api/exercises?${params}`;

      const res = await fetch(url);
      const data = await res.json();
      setExercises(Array.isArray(data) ? data : []);
    } catch { setExercises([]); }
    finally { setLoading(false); }
  }, [searchQuery, muscleFilter, user]);

  useEffect(() => {
    const t = setTimeout(fetchExercises, 300);
    return () => clearTimeout(t);
  }, [fetchExercises]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <BookOpen className="w-6 h-6 text-purple-400" />
        <h3 className="text-xl font-semibold text-white">Exercise Library</h3>
        <span className="text-xs text-gray-400 ml-auto">{exercises.length} exercise{exercises.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Filters */}
      <div className="glass rounded-xl p-4">
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2 glass-light rounded-lg border border-white/10 px-3 py-2">
              <Search className="w-4 h-4 text-white-400" />
              <input type="text" placeholder="Search exercises..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent flex-1 text-white  focus:outline-none text-sm" />
              {searchQuery && <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-white"><X className="w-3 h-3" /></button>}
            </div>
          </div>
          <select value={muscleFilter} onChange={e => setMuscleFilter(e.target.value)}
            className="px-3 py-2 glass-light rounded-lg text-white border border-white/10 focus:border-purple-500 focus:outline-none text-sm min-w-[150px]">
            <option value="">All Muscles</option>
            {muscles.filter(Boolean).map(m => (
              <option key={m} value={m}>{m.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Exercise list */}
      {loading ? (
        <p className="text-gray-400 text-center py-8 flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</p>
      ) : exercises.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center">
          <Dumbbell className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No exercises found. Try a different search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {exercises.map(ex => (
            <div key={ex.id} className="glass rounded-xl overflow-hidden hover:bg-white/5 transition-colors">
              <button onClick={() => setExpanded(expanded === ex.id ? null : ex.id)}
                className="w-full text-left p-4">
                <p className="font-semibold text-white capitalize text-sm">{ex.name}</p>
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {ex.bodyPart && <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 capitalize">{String(ex.bodyPart).replace(/_/g, ' ')}</span>}
                  {ex.equipment && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 capitalize">{Array.isArray(ex.equipment) ? ex.equipment.join(', ').replace(/_/g, ' ') : String(ex.equipment).replace(/_/g, ' ')}</span>}
                  {ex.movementPattern && <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 capitalize">{ex.movementPattern}</span>}
                  {ex.difficulty && <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-300 capitalize">{ex.difficulty}</span>}
                </div>
              </button>
              {expanded === ex.id && (
                <div className="px-4 pb-4 text-xs text-gray-400 space-y-2">
                  {ex.primaryMuscles?.length ? <p><span className="text-gray-300 font-medium">Primary Muscles:</span> {ex.primaryMuscles.join(', ').replace(/_/g, ' ')}</p> : null}
                  {ex.secondaryMuscles?.length ? <p><span className="text-gray-300 font-medium">Secondary Muscles:</span> {ex.secondaryMuscles.join(', ').replace(/_/g, ' ')}</p> : null}
                  {ex.movementPattern && <p><span className="text-gray-300 font-medium">Movement:</span> <span className="capitalize">{ex.movementPattern}</span></p>}
                  {ex.category && <p><span className="text-gray-300 font-medium">Category:</span> <span className="capitalize">{ex.category}</span></p>}
                  {ex.difficulty && <p><span className="text-gray-300 font-medium">Difficulty:</span> <span className="capitalize">{ex.difficulty}</span></p>}
                  {ex.equipment && <p><span className="text-gray-300 font-medium">Equipment:</span> <span className="capitalize">{Array.isArray(ex.equipment) ? ex.equipment.join(', ').replace(/_/g, ' ') : String(ex.equipment).replace(/_/g, ' ')}</span></p>}
                  {ex.defaultRepRange && <p><span className="text-gray-300 font-medium">Rep Range:</span> {ex.defaultRepRange.min}–{ex.defaultRepRange.max}</p>}
                  {ex.aliases?.length ? <p><span className="text-gray-300 font-medium">Aliases:</span> {ex.aliases.join(', ')}</p> : null}
                  {ex.variations?.length ? <p><span className="text-gray-300 font-medium">Variations:</span> {ex.variations.join(', ')}</p> : null}
                  {ex.rating != null && ex.rating > 0 && <p><span className="text-gray-300 font-medium">Rating:</span> {ex.rating.toFixed(1)}</p>}
                  {ex.isCustom && <p><span className="text-purple-400 font-medium">★ Custom Exercise</span></p>}
                  {ex.instructions && (
                    <div className="mt-2 pt-2 border-t border-white/10">
                      <p className="text-gray-300 font-medium mb-1">Instructions:</p>
                      <p className="text-gray-400 leading-relaxed whitespace-pre-line">{ex.instructions}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
