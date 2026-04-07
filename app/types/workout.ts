// ─── Enums / Literal Types ───────────────────────────────────────────────────

export type MovementPattern = 'push' | 'pull' | 'hinge' | 'squat' | 'carry' | 'isolation' | 'core';

export type EquipmentType =
  | 'barbell' | 'dumbbell' | 'machine' | 'cable'
  | 'bodyweight' | 'kettlebell' | 'band'
  | 'smith_machine' | 'ez_bar' | 'trap_bar';

export type MuscleGroup =
  | 'chest' | 'front_delts' | 'side_delts' | 'rear_delts'
  | 'upper_back' | 'lats' | 'lower_back' | 'traps'
  | 'biceps' | 'triceps' | 'forearms'
  | 'quads' | 'hamstrings' | 'glutes' | 'calves'
  | 'abs' | 'obliques' | 'hip_flexors';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type WorkoutGoal = 'hypertrophy' | 'strength' | 'endurance';

// ─── Reference Data ──────────────────────────────────────────────────────────

export interface Exercise {
  _id?: string;
  name: string;
  aliases: string[];
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  movementPattern: MovementPattern;
  equipment: EquipmentType[];
  defaultRepRange?: { min: number; max: number };
  difficulty: Difficulty;
  category: string; // e.g. "compound", "isolation", "accessory"
  instructions?: string;
  isCustom: boolean;
  createdBy?: string; // userId for custom exercises
  variations?: string[]; // exercise names
  createdAt?: Date;
  updatedAt?: Date;
}

// ─── User Performance Data ───────────────────────────────────────────────────

export interface SetEntry {
  setNumber: number;
  weight: number;
  reps: number;
  unit: 'lbs' | 'kg';
  isFailure: boolean;
  rpe?: number;       // 1-10
  restTime?: number;  // seconds
}

export interface PerformedExercise {
  exerciseId: string;
  exerciseName: string;
  orderIndex: number;
  notes?: string;
  sets: SetEntry[];
}

export interface TemplateExercise {
  exerciseId: string;
  exerciseName: string;
  targetSets: number;
  targetReps: number;
  orderIndex: number;
  notes?: string;
  targetWeight?: number;
  targetUnit?: 'lbs' | 'kg';
  setData?: Array<{ weight: number; reps: number; unit: 'lbs' | 'kg' }>;
}

export interface WorkoutTemplate {
  _id?: string;
  userId: string;
  name: string;
  goal: WorkoutGoal;
  exercises: TemplateExercise[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WorkoutSession {
  _id?: string;
  userId: string;
  templateId?: string;
  templateName?: string;
  status?: 'planned' | 'loaded' | 'completed';
  date: Date;
  duration?: number; // minutes
  notes?: string;
  goal: WorkoutGoal;
  experienceLevel?: Difficulty;
  exercises: PerformedExercise[];
  coachFeedback?: CoachRecommendation;
  createdAt?: Date;
  updatedAt?: Date;
}

// ─── Coach Outputs ───────────────────────────────────────────────────────────

export interface ExerciseTarget {
  exerciseName: string;
  exerciseId: string;
  targetSets: number;
  targetReps: string; // e.g. "8-10"
  targetWeight: number;
  targetUnit: 'lbs' | 'kg';
  notes?: string;
}

export interface ProgressionAdjustment {
  exerciseName: string;
  type: 'load_increase' | 'load_decrease' | 'add_set' | 'remove_set' | 'rep_increase' | 'deload';
  description: string;
  value?: number;
}

export interface VolumeBalance {
  muscleGroup: string;
  currentSets: number;
  recommendedRange: { min: number; max: number };
  action: 'increase' | 'decrease' | 'maintain';
  suggestion?: string;
}

export interface CoachWarning {
  type: 'failure_pattern' | 'fatigue' | 'imbalance' | 'overvolume' | 'undervolume' | 'plateau';
  severity: 'low' | 'medium' | 'high';
  message: string;
  affectedExercise?: string;
  affectedMuscle?: string;
}

export interface CoachRecommendation {
  nextSessionTargets: ExerciseTarget[];
  progressionAdjustments: ProgressionAdjustment[];
  volumeBalance: VolumeBalance[];
  warnings: CoachWarning[];
  substitutions: { current: string; suggested: string; reason: string }[];
  summary: string; // AI-generated human-friendly summary
  generatedAt: Date;
}
