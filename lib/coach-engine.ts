/**
 * Deterministic "Coach Engine"
 *
 * Computes volume, detects failure frequency, suggests progression,
 * and produces structured recommendation JSON.
 *
 * The AI layer reads this output and writes a human-friendly explanation.
 */

import type {
  WorkoutSession,
  SetEntry,
  CoachRecommendation,
  ExerciseTarget,
  ProgressionAdjustment,
  VolumeBalance,
  CoachWarning,
  WorkoutGoal,
  MuscleGroup,
} from '@/app/types/workout';

// ─── Constants ───────────────────────────────────────────────────────────────

/** Recommended weekly sets per muscle group by goal */
const VOLUME_TARGETS: Record<WorkoutGoal, Record<string, { min: number; max: number }>> = {
  hypertrophy: {
    chest: { min: 10, max: 20 }, front_delts: { min: 6, max: 12 }, side_delts: { min: 10, max: 20 },
    rear_delts: { min: 8, max: 16 }, upper_back: { min: 10, max: 20 }, lats: { min: 10, max: 20 },
    lower_back: { min: 3, max: 8 }, traps: { min: 6, max: 12 }, biceps: { min: 8, max: 16 },
    triceps: { min: 8, max: 14 }, forearms: { min: 4, max: 8 }, quads: { min: 10, max: 20 },
    hamstrings: { min: 10, max: 16 }, glutes: { min: 8, max: 16 }, calves: { min: 8, max: 16 },
    abs: { min: 6, max: 14 }, obliques: { min: 4, max: 8 }, hip_flexors: { min: 0, max: 4 },
  },
  strength: {
    chest: { min: 6, max: 12 }, front_delts: { min: 4, max: 8 }, side_delts: { min: 4, max: 10 },
    rear_delts: { min: 4, max: 10 }, upper_back: { min: 8, max: 16 }, lats: { min: 6, max: 14 },
    lower_back: { min: 4, max: 8 }, traps: { min: 4, max: 8 }, biceps: { min: 4, max: 10 },
    triceps: { min: 4, max: 10 }, forearms: { min: 2, max: 6 }, quads: { min: 6, max: 14 },
    hamstrings: { min: 6, max: 12 }, glutes: { min: 6, max: 12 }, calves: { min: 4, max: 8 },
    abs: { min: 4, max: 8 }, obliques: { min: 2, max: 6 }, hip_flexors: { min: 0, max: 4 },
  },
  endurance: {
    chest: { min: 8, max: 16 }, front_delts: { min: 6, max: 10 }, side_delts: { min: 6, max: 14 },
    rear_delts: { min: 6, max: 12 }, upper_back: { min: 8, max: 16 }, lats: { min: 8, max: 16 },
    lower_back: { min: 4, max: 8 }, traps: { min: 4, max: 8 }, biceps: { min: 6, max: 12 },
    triceps: { min: 6, max: 12 }, forearms: { min: 4, max: 8 }, quads: { min: 8, max: 16 },
    hamstrings: { min: 8, max: 14 }, glutes: { min: 6, max: 14 }, calves: { min: 8, max: 14 },
    abs: { min: 6, max: 14 }, obliques: { min: 4, max: 8 }, hip_flexors: { min: 0, max: 4 },
  },
};

/** Upper-body exercises get smaller load increments */
const UPPER_MUSCLES: MuscleGroup[] = ['chest', 'front_delts', 'side_delts', 'rear_delts', 'upper_back', 'lats', 'traps', 'biceps', 'triceps', 'forearms'];
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const LOWER_MUSCLES: MuscleGroup[] = ['quads', 'hamstrings', 'glutes', 'calves', 'hip_flexors'];

function isUpper(muscles: string[]): boolean {
  return muscles.some(m => UPPER_MUSCLES.includes(m as MuscleGroup));
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function avgRpe(sets: SetEntry[]): number {
  const rpeVals = sets.filter(s => s.rpe != null).map(s => s.rpe!);
  return rpeVals.length ? rpeVals.reduce((a, b) => a + b, 0) / rpeVals.length : 7; // default 7
}

function failureRate(sets: SetEntry[]): number {
  if (!sets.length) return 0;
  return sets.filter(s => s.isFailure).length / sets.length;
}

function maxWeight(sets: SetEntry[]): number {
  return Math.max(0, ...sets.map(s => s.weight));
}

function avgReps(sets: SetEntry[]): number {
  if (!sets.length) return 0;
  return sets.reduce((a, s) => a + s.reps, 0) / sets.length;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function totalVolume(sets: SetEntry[]): number {
  return sets.reduce((v, s) => v + s.weight * s.reps, 0);
}

// ─── Build muscle → sets mapping across sessions ─────────────────────────────

interface ExerciseMuscleMap {
  [exerciseId: string]: { primary: string[]; secondary: string[] };
}

function weeklyMuscleSets(
  sessions: WorkoutSession[],
  muscleMap: ExerciseMuscleMap,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const session of sessions) {
    for (const ex of session.exercises) {
      const muscles = muscleMap[ex.exerciseId];
      if (!muscles) continue;
      const numSets = ex.sets.length;
      for (const m of muscles.primary) {
        counts[m] = (counts[m] || 0) + numSets;
      }
      // Secondary contributes ~0.5 sets for volume accounting
      for (const m of muscles.secondary) {
        counts[m] = (counts[m] || 0) + numSets * 0.5;
      }
    }
  }
  return counts;
}

// ─── Main Engine ─────────────────────────────────────────────────────────────

export interface CoachInput {
  currentSession: WorkoutSession;
  recentSessions: WorkoutSession[]; // last 4-12 weeks, newest first
  muscleMap: ExerciseMuscleMap;     // exerciseId → muscles (from Exercise collection)
}

export function runCoachEngine(input: CoachInput): Omit<CoachRecommendation, 'summary'> {
  const { currentSession, recentSessions, muscleMap } = input;
  const goal = currentSession.goal || 'hypertrophy';

  const targets: ExerciseTarget[] = [];
  const adjustments: ProgressionAdjustment[] = [];
  const warnings: CoachWarning[] = [];
  const substitutions: { current: string; suggested: string; reason: string }[] = [];

  // ── Per-exercise analysis ──────────────────────────────────────────────────

  for (const performed of currentSession.exercises) {
    const sets = performed.sets;
    if (!sets.length) continue;

    const exMuscles = muscleMap[performed.exerciseId] ?? { primary: [], secondary: [] };
    const upper = isUpper(exMuscles.primary);
    const loadStep = upper ? 2.5 : 5; // lbs increment
    const unit = sets[0]?.unit ?? 'lbs';

    const fr = failureRate(sets);
    const rpe = avgRpe(sets);
    const mw = maxWeight(sets);
    const ar = avgReps(sets);

    // Find same exercise in recent history for trend detection
    const history = recentSessions
      .flatMap(s => s.exercises.filter(e => e.exerciseId === performed.exerciseId))
      .slice(0, 12); // last 12 occurrences

    // ── Progression logic (double progression) ───────────────────────────────

    if (fr > 0.5) {
      // Failed on more than half the sets → too heavy
      adjustments.push({
        exerciseName: performed.exerciseName,
        type: 'load_decrease',
        description: `Failed on ${Math.round(fr * 100)}% of sets. Reduce weight by ${loadStep * 2}${unit} or maintain and target lower reps.`,
        value: -(loadStep * 2),
      });
      targets.push({
        exerciseName: performed.exerciseName,
        exerciseId: performed.exerciseId,
        targetSets: sets.length,
        targetReps: `${Math.max(3, Math.round(ar) - 2)}-${Math.round(ar)}`,
        targetWeight: Math.max(0, mw - loadStep * 2),
        targetUnit: unit,
        notes: 'Reduce load after excessive failure',
      });
    } else if (fr > 0.25) {
      // Some failure — maintain weight, try more reps next time
      adjustments.push({
        exerciseName: performed.exerciseName,
        type: 'rep_increase',
        description: `Partial failure. Keep weight at ${mw}${unit}, aim for ${Math.round(ar) + 1} reps on working sets.`,
      });
      targets.push({
        exerciseName: performed.exerciseName,
        exerciseId: performed.exerciseId,
        targetSets: sets.length,
        targetReps: `${Math.round(ar)}-${Math.round(ar) + 1}`,
        targetWeight: mw,
        targetUnit: unit,
      });
    } else if (rpe <= 7.5 && ar >= 10 && goal !== 'strength') {
      // Comfortable — increase load (hypertrophy / endurance)
      adjustments.push({
        exerciseName: performed.exerciseName,
        type: 'load_increase',
        description: `All sets completed comfortably (RPE ≤ 7.5, avg ${Math.round(ar)} reps). Increase weight by +${loadStep}${unit}.`,
        value: loadStep,
      });
      targets.push({
        exerciseName: performed.exerciseName,
        exerciseId: performed.exerciseId,
        targetSets: sets.length,
        targetReps: `${Math.max(5, Math.round(ar) - 2)}-${Math.round(ar)}`,
        targetWeight: mw + loadStep,
        targetUnit: unit,
        notes: 'Progressive overload — increase weight',
      });
    } else if (rpe <= 7 && goal === 'strength') {
      // Strength: need higher loads at lower reps
      adjustments.push({
        exerciseName: performed.exerciseName,
        type: 'load_increase',
        description: `Comfortable top set at RPE ${rpe.toFixed(1)}. Add +${loadStep * 2}${unit} to top set.`,
        value: loadStep * 2,
      });
      targets.push({
        exerciseName: performed.exerciseName,
        exerciseId: performed.exerciseId,
        targetSets: sets.length,
        targetReps: `${Math.max(1, Math.round(ar) - 1)}-${Math.round(ar)}`,
        targetWeight: mw + loadStep * 2,
        targetUnit: unit,
      });
    } else {
      // Maintain current targets
      targets.push({
        exerciseName: performed.exerciseName,
        exerciseId: performed.exerciseId,
        targetSets: sets.length,
        targetReps: `${Math.round(ar)}-${Math.round(ar) + 1}`,
        targetWeight: mw,
        targetUnit: unit,
        notes: 'Maintain current loading',
      });
    }

    // ── Fatigue / RPE warnings ───────────────────────────────────────────────

    if (rpe >= 9.5) {
      warnings.push({
        type: 'fatigue',
        severity: 'high',
        message: `${performed.exerciseName}: Average RPE is ${rpe.toFixed(1)} — very high fatigue. Consider a deload or reducing volume.`,
        affectedExercise: performed.exerciseName,
      });
    } else if (rpe >= 8.5) {
      warnings.push({
        type: 'fatigue',
        severity: 'medium',
        message: `${performed.exerciseName}: Average RPE ${rpe.toFixed(1)} is accumulating fatigue. Monitor closely.`,
        affectedExercise: performed.exerciseName,
      });
    }

    // ── Plateau detection (same weight & reps for 3+ sessions) ───────────────

    if (history.length >= 3) {
      const recentMaxes = history.slice(0, 3).map(h => maxWeight(h.sets));
      const recentAvgReps = history.slice(0, 3).map(h => avgReps(h.sets));
      const weightStagnant = recentMaxes.every(w => Math.abs(w - mw) < loadStep);
      const repsStagnant = recentAvgReps.every(r => Math.abs(r - ar) < 1);

      if (weightStagnant && repsStagnant) {
        warnings.push({
          type: 'plateau',
          severity: 'medium',
          message: `${performed.exerciseName}: Weight and reps have been stagnant for 3+ sessions. Consider changing rep range, exercise variation, or a strategic deload.`,
          affectedExercise: performed.exerciseName,
        });
      }
    }

    // ── Repeated failure pattern ─────────────────────────────────────────────

    if (history.length >= 2) {
      const recentFailureRates = history.slice(0, 2).map(h => failureRate(h.sets));
      if (fr > 0.3 && recentFailureRates.every(r => r > 0.3)) {
        warnings.push({
          type: 'failure_pattern',
          severity: 'high',
          message: `${performed.exerciseName}: Failing on 30%+ of sets for 3 consecutive sessions. Weight is likely too heavy — reduce by ${loadStep * 2}-${loadStep * 3}${unit}.`,
          affectedExercise: performed.exerciseName,
        });
        adjustments.push({
          exerciseName: performed.exerciseName,
          type: 'deload',
          description: `Persistent failure pattern → deload to ${Math.round(mw * 0.85)}${unit} (85% of current) for a recovery week, then rebuild.`,
          value: Math.round(mw * 0.85),
        });
      }
    }
  }

  // ── Volume balance (weekly across all sessions) ────────────────────────────

  // Collect sessions from the last 7 days
  const oneWeekAgo = new Date(currentSession.date);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weekSessions = [
    currentSession,
    ...recentSessions.filter(s => new Date(s.date) >= oneWeekAgo),
  ];

  const muscleSets = weeklyMuscleSets(weekSessions, muscleMap);
  const volumeTargets = VOLUME_TARGETS[goal];
  const volumeBalance: VolumeBalance[] = [];

  for (const [muscle, range] of Object.entries(volumeTargets)) {
    const current = Math.round(muscleSets[muscle] || 0);
    let action: 'increase' | 'decrease' | 'maintain' = 'maintain';
    let suggestion: string | undefined;

    if (current < range.min) {
      action = 'increase';
      suggestion = `Add ${range.min - current} more sets for ${muscle} this week.`;
      warnings.push({
        type: 'undervolume',
        severity: current < range.min * 0.5 ? 'medium' : 'low',
        message: `${muscle}: Only ${current} sets this week (target ${range.min}-${range.max}). Underdeveloped volume.`,
        affectedMuscle: muscle,
      });
    } else if (current > range.max) {
      action = 'decrease';
      suggestion = `Reduce ${current - range.max} sets for ${muscle} — approaching junk volume.`;
      warnings.push({
        type: 'overvolume',
        severity: current > range.max * 1.3 ? 'high' : 'medium',
        message: `${muscle}: ${current} sets this week exceeds max (${range.max}). Risk of junk volume and recovery issues.`,
        affectedMuscle: muscle,
      });
    }

    // Only report muscles with actionable imbalances
    if (action !== 'maintain' || current > 0) {
      volumeBalance.push({
        muscleGroup: muscle,
        currentSets: current,
        recommendedRange: range,
        action,
        suggestion,
      });
    }
  }

  // ── Push / pull imbalance check ────────────────────────────────────────────

  const pushSets = (muscleSets['chest'] || 0) + (muscleSets['front_delts'] || 0) + (muscleSets['triceps'] || 0);
  const pullSets = (muscleSets['upper_back'] || 0) + (muscleSets['lats'] || 0) + (muscleSets['biceps'] || 0) + (muscleSets['rear_delts'] || 0);

  if (pushSets > 0 && pullSets > 0) {
    const ratio = pushSets / pullSets;
    if (ratio > 1.5) {
      warnings.push({
        type: 'imbalance',
        severity: 'medium',
        message: `Push/pull imbalance: ${Math.round(pushSets)} push sets vs ${Math.round(pullSets)} pull sets (${ratio.toFixed(1)}:1). Aim for ~1:1 ratio — add more pulling work.`,
      });
    } else if (ratio < 0.67) {
      warnings.push({
        type: 'imbalance',
        severity: 'low',
        message: `Pull-heavy balance: ${Math.round(pullSets)} pull vs ${Math.round(pushSets)} push sets. Generally fine for posture, but ensure chest/shoulder pressing is adequate.`,
      });
    }
  }

  // ── Quad / hamstring imbalance ─────────────────────────────────────────────

  const quadSets = muscleSets['quads'] || 0;
  const hamSets = muscleSets['hamstrings'] || 0;
  if (quadSets > 0 && hamSets > 0 && quadSets / hamSets > 2) {
    warnings.push({
      type: 'imbalance',
      severity: 'medium',
      message: `Quad-dominant: ${Math.round(quadSets)} quad sets vs ${Math.round(hamSets)} hamstring sets. Add RDLs or leg curls to reduce injury risk.`,
    });
  }

  return {
    nextSessionTargets: targets,
    progressionAdjustments: adjustments,
    volumeBalance: volumeBalance.filter(v => v.action !== 'maintain'),
    warnings,
    substitutions,
    generatedAt: new Date(),
  };
}
