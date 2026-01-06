export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type Gender = 'male' | 'female';
export type FastingProtocol = '16' | '18' | '20' | '24' | 'custom';

export interface Meal {
  id: string;
  name: string;
  calories: number;
  type: MealType;
}

export interface UserStats {
  caloriesConsumed: number;
  caloriesGoal: number;
  fastingProgress: number;
  fastingGoal: number;
  workoutsThisWeek: number;
  workoutGoal: number;
  currentWeight: number;
  weightGoal?: number;
  weightChange: number;
}

export interface Calculations {
  bmr: number | null;
  tdee: number | null;
}

export interface FastingState {
  isActive: boolean;
  startTime: Date | null;
  endTime: Date | null;
  protocol: FastingProtocol;
  customHours: number | null;
}

export interface BMRFormData {
  age: number;
  weight: number;
  height: number;
  weightUnit: 'lbs' | 'kg';
  heightUnit: 'in' | 'cm';
  gender: Gender;
  activityLevel: number;
}

export interface BMIFormData {
  weight: number;
  height: number;
  weightUnit: 'lbs' | 'kg';
  heightUnit: 'in' | 'cm';
}

export interface BodyFatFormData {
  gender: Gender;
  height: number;
  heightUnit: 'in' | 'cm';
  waist: number;
  waistUnit: 'in' | 'cm';
  neck: number;
  neckUnit: 'in' | 'cm';
  hip?: number;
  hipUnit?: 'in' | 'cm';
}
