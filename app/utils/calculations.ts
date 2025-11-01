import { BMRFormData } from '@/app/types';

export const validateInputs = (
  age: number,
  weight: number,
  height: number,
  heightUnit: 'in' | 'cm'
): string[] => {
  const errors: string[] = [];

  if (age <= 0 || age > 150) {
    errors.push('Age must be between 1 and 150 years');
  }

  if (weight <= 0 || weight > 1000) {
    errors.push('Weight must be a positive number (max 1000)');
  }

  if (height <= 0) {
    errors.push('Height must be greater than 0');
  } else {
    if (heightUnit === 'in' && height > 105) {
      errors.push('Height in inches must not exceed 105');
    }
    if (heightUnit === 'cm' && height > 267) {
      errors.push('Height in cm must not exceed 267');
    }
  }

  return errors;
};

export const calculateBMR = (data: BMRFormData): { bmr: number; tdee: number } => {
  let weight = data.weight;
  let height = data.height;

  // Convert to metric
  if (data.weightUnit === 'lbs') {
    weight = weight * 0.453592;
  }

  if (data.heightUnit === 'in') {
    height = height * 2.54;
  }

  // Mifflin-St Jeor Equation
  let bmr: number;
  if (data.gender === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * data.age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * data.age - 161;
  }

  const tdee = bmr * data.activityLevel;

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
  };
};

export const calculateBMI = (
  weight: number,
  height: number,
  weightUnit: 'lbs' | 'kg',
  heightUnit: 'in' | 'cm'
): { bmi: number; category: string } => {
  let weightKg = weight;
  let heightM = height;

  if (weightUnit === 'lbs') {
    weightKg = weight * 0.453592;
  }

  if (heightUnit === 'in') {
    heightM = (height * 2.54) / 100;
  } else {
    heightM = height / 100;
  }

  const bmi = weightKg / (heightM * heightM);

  let category: string;
  if (bmi < 18.5) category = 'Underweight';
  else if (bmi < 25) category = 'Normal weight';
  else if (bmi < 30) category = 'Overweight';
  else category = 'Obese';

  return {
    bmi: Math.round(bmi * 10) / 10,
    category,
  };
};

export const calculateBodyFat = (
  gender: 'male' | 'female',
  height: number,
  waist: number,
  neck: number,
  hip?: number,
  heightUnit: 'in' | 'cm' = 'in',
  waistUnit: 'in' | 'cm' = 'in',
  neckUnit: 'in' | 'cm' = 'in',
  hipUnit: 'in' | 'cm' = 'in'
): { bodyFat: number } => {
  // Convert all to inches
  let h = height;
  let w = waist;
  let n = neck;
  let hp = hip || 0;

  if (heightUnit === 'cm') h = height / 2.54;
  if (waistUnit === 'cm') w = waist / 2.54;
  if (neckUnit === 'cm') n = neck / 2.54;
  if (hip && hipUnit === 'cm') hp = hip / 2.54;

  let bodyFat: number;

  if (gender === 'male') {
    // US Navy method for men: %BF = 86.010 * log10(abdomen - neck) - 70.041 * log10(height) + 36.76
    bodyFat = 86.01 * Math.log10(w - n) - 70.041 * Math.log10(h) + 36.76;
  } else {
    // US Navy method for women: %BF = 163.205 * log10(waist + hip - neck) - 97.684 * log10(height) - 78.387
    bodyFat = 163.205 * Math.log10(w + hp - n) - 97.684 * Math.log10(h) - 78.387;
  }

  return {
    bodyFat: Math.max(0, Math.round(bodyFat * 10) / 10),
  };
};
