'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Activity, Trash2, TrendingUp, Loader2, X, Search,
  Plus, ChevronDown, ChevronUp, Dumbbell, Brain,
  BookOpen, History, Save, Play, Check,
  AlertTriangle, ArrowUp, ArrowDown, Minus, Upload,
  Info, Star, Zap, Target, Clock, RefreshCw, MessageCircle,
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
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [expandedEx, setExpandedEx] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weightUnit, setWeightUnit] = useState<'lbs' | 'kg'>('lbs');

  // Load user preferences (goal, experience, weight unit)
  useEffect(() => {
    if (!user) return;
    fetch(`/api/user/preferences?userId=${encodeURIComponent(user.email)}`)
      .then(r => r.json())
      .then(prefs => {
        if (prefs.experienceLevel) setExperienceLevel(prefs.experienceLevel);
        if (prefs.fitnessGoal) setGoal(prefs.fitnessGoal);
        if (prefs.weightUnit) setWeightUnit(prefs.weightUnit);
      })
      .catch(() => {});
  }, [user]);

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
          templateId: selectedTemplate || undefined,
          templateName: templates.find(t => t._id === selectedTemplate)?.name,
          date: sessionDate.toISOString(),
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => {
          setExercises([]);
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

        <div className="mb-4">
          <DatePicker onDateSelect={d => setSelectedDate(d)} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <select
            value={selectedTemplate}
            onChange={(e) => {
              const value = e.target.value;
              setSelectedTemplate(value);
              if (value) loadTemplate(value);
            }}
            className="px-3 py-2.5 glass-light rounded-lg text-white border border-white/10 focus:border-purple-500 focus:outline-none"
          >
            <option value="" className="bg-slate-900">Start from scratch</option>
            {templates.map(t => (
              <option key={t._id} value={t._id} className="bg-slate-900">
                {t.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              setSelectedTemplate('');
              setExercises([]);
              setExpandedEx(null);
            }}
            className="px-3 py-2.5 rounded-lg border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            Clear Session
          </button>
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
                  className="flex items-center justify-center text-red-400/60 hover:text-red-400 p-1 transition-colors">
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
                        className="flex items-center justify-center text-gray-500 hover:text-red-400 p-1 transition-colors"
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
      </div>

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
        <button onClick={onClose} className="flex items-center justify-center text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
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
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null);
  const [coachLoading, setCoachLoading] = useState<string | null>(null);
  const [savingTemplateId, setSavingTemplateId] = useState<string | null>(null);
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
        setSelectedSession(prev => prev && prev._id === sessionId ? { ...prev, coachFeedback: feedback } : prev);
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

  const saveSessionAsTemplate = async (session: WorkoutSession) => {
    if (!user || !session.exercises?.length) return;

    const defaultName = session.templateName
      || `${session.goal.charAt(0).toUpperCase()}${session.goal.slice(1)} Day`;
    const name = window.prompt('Template name', defaultName)?.trim();
    if (!name) return;

    setSavingTemplateId(session._id);
    try {
      const exercises: TemplateExercise[] = session.exercises.map((ex, index) => {
        const reps = ex.sets?.map(set => set.reps).filter(r => Number.isFinite(r) && r > 0) ?? [];
        const avgReps = reps.length
          ? Math.round(reps.reduce((sum, repsValue) => sum + repsValue, 0) / reps.length)
          : 8;

        return {
          exerciseId: ex.exerciseId,
          exerciseName: ex.exerciseName,
          targetSets: Math.max(ex.sets?.length ?? 0, 1),
          targetReps: avgReps,
          orderIndex: index,
          notes: ex.notes,
        };
      });

      const res = await fetch('/api/workout-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.email,
          name,
          goal: session.goal,
          exercises,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData?.error || 'Failed to save template');
      }

      const createdTemplate = await res.json();

      await fetch(`/api/workout-sessions/${session._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: createdTemplate?._id ?? null,
          templateName: name,
        }),
      });

      setSessions(prev => prev.map(s => s._id === session._id
        ? { ...s, templateId: createdTemplate?._id ?? s.templateId, templateName: name }
        : s,
      ));
      setSelectedSession(prev => prev && prev._id === session._id
        ? { ...prev, templateId: createdTemplate?._id ?? prev.templateId, templateName: name }
        : prev,
      );

      alert(`Saved template: ${name}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save template';
      alert(message);
    } finally {
      setSavingTemplateId(null);
    }
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
                  <button onClick={e => { e.stopPropagation(); setSelectedSession(session); }}
                    className="flex items-center justify-center text-purple-400/60 hover:text-purple-400 p-1" title="View details">
                    <Info className="w-4 h-4" />
                  </button>
                  <button onClick={e => { e.stopPropagation(); deleteSession(session._id); }}
                    className="flex items-center justify-center text-red-400/60 hover:text-red-400 p-1"><Trash2 className="w-4 h-4" /></button>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        onClick={() => saveSessionAsTemplate(session)}
                        disabled={savingTemplateId === session._id}
                        className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                      >
                        {savingTemplateId === session._id
                          ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving template...</>
                          : <><Save className="w-4 h-4" /> Save As Template</>}
                      </button>
                      <button onClick={() => getCoachFeedback(session._id)}
                        disabled={coachLoading === session._id}
                        className="w-full py-2.5 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-60">
                        {coachLoading === session._id
                          ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
                          : <><Brain className="w-4 h-4" /> Get AI Coach Feedback</>}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <button
                        onClick={() => saveSessionAsTemplate(session)}
                        disabled={savingTemplateId === session._id}
                        className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                      >
                        {savingTemplateId === session._id
                          ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving template...</>
                          : <><Save className="w-4 h-4" /> Save As Template</>}
                      </button>
                      <CoachFeedbackDisplay
                        feedback={session.coachFeedback}
                        onRefresh={() => getCoachFeedback(session._id)}
                        refreshing={coachLoading === session._id}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Session Detail Modal ── */}
      {selectedSession && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={() => setSelectedSession(null)}
        >
          <div
            className="glass rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-purple-500/30 shadow-2xl shadow-purple-500/20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-purple-400" />
                <h2 className="text-sm tracking-widest text-purple-400 font-medium uppercase">
                  Session Details
                </h2>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="flex items-center justify-center text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="overflow-y-auto flex-1 px-6 py-6 space-y-6">
              {/* Session Name & Date */}
              <div>
                <h2 className="text-2xl font-semibold text-white">
                  {selectedSession.templateName || 'Free Session'}
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  {new Date(selectedSession.date).toLocaleDateString('en-US', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </p>
              </div>

              {/* Goal & Stats Badges */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30 capitalize">
                  <Target className="w-3.5 h-3.5" />
                  {selectedSession.goal}
                </div>
                {selectedSession.experienceLevel && (
                  <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30 capitalize">
                    {selectedSession.experienceLevel}
                  </div>
                )}
                {selectedSession.estimatedCalories && (
                  <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                    <Zap className="w-3.5 h-3.5" />
                    {selectedSession.estimatedCalories} kcal
                  </div>
                )}
                {selectedSession.duration && (
                  <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                    <Clock className="w-3.5 h-3.5" />
                    {selectedSession.duration} min
                  </div>
                )}
              </div>

              {selectedSession.notes && (
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-sm text-gray-300 font-light">{selectedSession.notes}</p>
                </div>
              )}

              {/* Exercises */}
              {selectedSession.exercises && selectedSession.exercises.length > 0 && (
                <div>
                  <p className="text-xs tracking-widest text-purple-400 font-medium mb-3 uppercase">
                    Exercises ({selectedSession.exercises.length})
                  </p>
                  <div className="space-y-3">
                    {selectedSession.exercises.map((ex, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-lg bg-white/5 border border-white/10"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-purple-400 bg-purple-500/20 w-6 h-6 rounded-full flex items-center justify-center">
                              {i + 1}
                            </span>
                            <p className="text-sm font-semibold text-white capitalize">{ex.exerciseName}</p>
                          </div>
                          <span className="text-xs text-gray-400">{ex.sets?.length || 0} sets</span>
                        </div>
                        <div className="space-y-1.5">
                          {ex.sets?.map((set, j) => (
                            <div key={j} className="flex items-center gap-4 text-xs">
                              <span className="text-gray-500 w-12">Set {set.setNumber}</span>
                              <span className="text-white font-medium">{set.weight} {set.unit}</span>
                              <span className="text-gray-300">× {set.reps} reps</span>
                              {set.rpe != null && set.rpe > 0 && <span className="text-purple-400">RPE {set.rpe}</span>}
                              {set.isFailure && <span className="text-red-400 font-medium">FAIL</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Coach Feedback inside modal */}
              {selectedSession.coachFeedback ? (
                <div>
                  <p className="text-xs tracking-widest text-purple-400 font-medium mb-3 uppercase">
                    AI Coach Feedback
                  </p>
                  <CoachFeedbackDisplay
                    feedback={selectedSession.coachFeedback}
                    onRefresh={() => getCoachFeedback(selectedSession._id)}
                    refreshing={coachLoading === selectedSession._id}
                  />
                </div>
              ) : (
                <button
                  onClick={() => {
                    getCoachFeedback(selectedSession._id);
                    setSessions(prev => {
                      const updated = prev.find(s => s._id === selectedSession._id);
                      if (updated) setSelectedSession(updated);
                      return prev;
                    });
                  }}
                  disabled={coachLoading === selectedSession._id}
                  className="w-full py-2.5 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                >
                  {coachLoading === selectedSession._id
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
                    : <><Brain className="w-4 h-4" /> Get AI Coach Feedback</>}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COACH FEEDBACK DISPLAY
// ═══════════════════════════════════════════════════════════════════════════════

function CoachFeedbackDisplay({
  feedback,
  onRefresh,
  refreshing,
}: {
  feedback: CoachFeedback;
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  const [showDetails, setShowDetails] = useState(false);

  const handleDiscuss = () => {
    const context = `Here's my latest session feedback:\n\n${feedback.summary}\n\nCan you dive deeper and give me specific recommendations for next session?`;
    window.dispatchEvent(new CustomEvent('coach-context', { detail: { context } }));
  };

  return (
    <div className="space-y-3">
      {/* AI Summary */}
      <div className="glass-light rounded-lg p-4 border-l-4 border-blue-500">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold text-blue-400">AI Coach Analysis</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleDiscuss}
              className="flex items-center justify-center p-1.5 rounded-lg text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 transition-colors"
              title="Discuss with AI Coach"
            >
              <MessageCircle className="w-3.5 h-3.5" />
            </button>
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={refreshing}
                className="flex items-center justify-center p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40"
                title="Refresh feedback"
              >
                {refreshing
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <RefreshCw className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
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
  const [selectedExercise, setSelectedExercise] = useState<ExerciseSearch | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


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

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      setImportResult({ success: false, message: 'Please select a .csv file' });
      return;
    }
    setImporting(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/exercises/import', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        setImportResult({ success: true, message: `Imported ${data.imported} exercises (${data.skippedDuplicates ?? 0} duplicates skipped)` });
        fetchExercises();
      } else {
        setImportResult({ success: false, message: data.error || 'Import failed' });
      }
    } catch {
      setImportResult({ success: false, message: 'Network error during import' });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <BookOpen className="w-6 h-6 text-purple-400" />
        <h3 className="text-xl font-semibold text-white">Exercise Library</h3>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-gray-400">{exercises.length} exercise{exercises.length !== 1 ? 's' : ''}</span>
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleCSVImport} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} disabled={importing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-600 hover:bg-purple-500 text-white transition-colors disabled:opacity-50">
            {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {importing ? 'Importing...' : 'Import CSV'}
          </button>
        </div>
      </div>
      {importResult && (
        <div className={`rounded-lg px-4 py-2 text-sm flex items-center gap-2 ${importResult.success ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
          {importResult.success ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {importResult.message}
          <button onClick={() => setImportResult(null)} className="ml-auto flex items-center justify-center text-white/60 hover:text-white"><X className="w-3 h-3" /></button>
        </div>
      )}

      {/* Filters */}
      <div className="glass rounded-xl p-4">
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input type="text" placeholder="Search exercises..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 glass-light rounded-lg text-white border border-white/10 focus:border-purple-500 focus:outline-none placeholder-gray-500 text-sm" />
              {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"><X className="w-3 h-3" /></button>}
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
            <div
              key={ex.id}
              onClick={() => setSelectedExercise(ex)}
              className="glass rounded-xl overflow-hidden hover:bg-white/5 transition-all cursor-pointer hover:border-purple-500/40 border border-transparent hover:shadow-lg hover:shadow-purple-500/10"
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <p className="font-semibold text-white capitalize text-sm">{ex.name}</p>
                  <Info className="w-4 h-4 text-purple-400/60 shrink-0 ml-2 mt-0.5" />
                </div>
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {ex.bodyPart && <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 capitalize">{String(ex.bodyPart).replace(/_/g, ' ')}</span>}
                  {ex.equipment && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 capitalize">{Array.isArray(ex.equipment) ? ex.equipment.join(', ').replace(/_/g, ' ') : String(ex.equipment).replace(/_/g, ' ')}</span>}
                  {ex.movementPattern && <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 capitalize">{ex.movementPattern}</span>}
                  {ex.difficulty && <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-300 capitalize">{ex.difficulty}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Exercise Detail Modal ── */}
      {selectedExercise && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={() => setSelectedExercise(null)}
        >
          <div
            className="glass rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-purple-500/30 shadow-2xl shadow-purple-500/20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Dumbbell className="w-5 h-5 text-purple-400" />
                <h2 className="text-sm tracking-widest text-purple-400 font-medium uppercase">
                  Exercise Details
                </h2>
              </div>
              <button
                onClick={() => setSelectedExercise(null)}
                className="flex items-center justify-center text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="overflow-y-auto flex-1 px-6 py-6 space-y-6">
              {/* Name & Body Part */}
              <div>
                <h2 className="text-2xl font-semibold text-white capitalize">
                  {selectedExercise.name}
                </h2>
                {selectedExercise.bodyPart && (
                  <p className="text-sm text-gray-400 capitalize mt-1">
                    {String(selectedExercise.bodyPart).replace(/_/g, ' ')}
                  </p>
                )}
                {selectedExercise.isCustom && (
                  <span className="inline-flex items-center gap-1 text-xs text-purple-400 mt-2">
                    <Star className="w-3 h-3" /> Custom Exercise
                  </span>
                )}
              </div>

              {/* Difficulty Badge + Rating */}
              <div className="flex items-center gap-3">
                {selectedExercise.difficulty && (
                  <div className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium
                    ${selectedExercise.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : selectedExercise.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                    <Zap className="w-3.5 h-3.5" />
                    <span className="capitalize">{selectedExercise.difficulty}</span>
                  </div>
                )}
                {selectedExercise.rating != null && selectedExercise.rating > 0 && (
                  <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    <Star className="w-3.5 h-3.5" />
                    {selectedExercise.rating.toFixed(1)}
                  </div>
                )}
              </div>

              {/* Primary Muscles */}
              {selectedExercise.primaryMuscles && selectedExercise.primaryMuscles.length > 0 && (
                <div>
                  <p className="text-xs tracking-widest text-purple-400 font-medium mb-3 uppercase">
                    Primary Muscles ({selectedExercise.primaryMuscles.length})
                  </p>
                  <div className="space-y-2">
                    {selectedExercise.primaryMuscles.map((m, i) => (
                      <p key={i} className="text-sm text-green-400 font-light capitalize flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                        {m.replace(/_/g, ' ')}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Secondary Muscles */}
              {selectedExercise.secondaryMuscles && selectedExercise.secondaryMuscles.length > 0 && (
                <div>
                  <p className="text-xs tracking-widest text-purple-400 font-medium mb-3 uppercase">
                    Secondary Muscles ({selectedExercise.secondaryMuscles.length})
                  </p>
                  <div className="space-y-2">
                    {selectedExercise.secondaryMuscles.map((m, i) => (
                      <p key={i} className="text-sm text-yellow-400/80 font-light capitalize flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400/80 shrink-0" />
                        {m.replace(/_/g, ' ')}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Info Breakdown */}
              {(selectedExercise.movementPattern || selectedExercise.category || selectedExercise.equipment || selectedExercise.defaultRepRange) && (
                <div>
                  <p className="text-xs tracking-widest text-purple-400 font-medium mb-3 uppercase">
                    Details
                  </p>
                  <div className="space-y-2.5">
                    {selectedExercise.movementPattern && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400 font-light">Movement Pattern</span>
                        <span className="text-sm text-white font-medium capitalize">{selectedExercise.movementPattern}</span>
                      </div>
                    )}
                    {selectedExercise.category && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400 font-light">Category</span>
                        <span className="text-sm text-white font-medium capitalize">{selectedExercise.category}</span>
                      </div>
                    )}
                    {selectedExercise.equipment && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400 font-light">Equipment</span>
                        <span className="text-sm text-white font-medium capitalize">
                          {Array.isArray(selectedExercise.equipment)
                            ? selectedExercise.equipment.join(', ').replace(/_/g, ' ')
                            : String(selectedExercise.equipment).replace(/_/g, ' ')}
                        </span>
                      </div>
                    )}
                    {selectedExercise.defaultRepRange && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400 font-light">Rep Range</span>
                        <span className="text-sm text-white font-medium">{selectedExercise.defaultRepRange.min}–{selectedExercise.defaultRepRange.max} reps</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Variations */}
              {selectedExercise.variations && selectedExercise.variations.length > 0 && (
                <div>
                  <p className="text-xs tracking-widest text-purple-400 font-medium mb-3 uppercase">
                    Variations ({selectedExercise.variations.length})
                  </p>
                  <div className="space-y-2">
                    {selectedExercise.variations.map((v, i) => (
                      <div
                        key={i}
                        className="px-3 py-2.5 rounded-lg bg-white/5 border border-white/10"
                      >
                        <p className="text-sm text-white font-medium capitalize">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Aliases */}
              {selectedExercise.aliases && selectedExercise.aliases.length > 0 && (
                <div>
                  <p className="text-xs tracking-widest text-purple-400 font-medium mb-3 uppercase">
                    Also Known As
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {selectedExercise.aliases.map((a, i) => (
                      <span
                        key={i}
                        className="text-xs px-2.5 py-1.5 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Instructions */}
              {selectedExercise.instructions && (
                <div>
                  <p className="text-xs tracking-widest text-purple-400 font-medium mb-3 uppercase">
                    Instructions
                  </p>
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-sm text-gray-300 font-light leading-relaxed whitespace-pre-line">
                      {selectedExercise.instructions}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
