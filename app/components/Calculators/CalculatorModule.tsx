'use client';

import React, { useState } from 'react';
import { validateInputs, calculateBMR, calculateBMI } from '@/app/utils/calculations';
import { Calculator, Activity } from 'lucide-react';

const CalculatorModule: React.FC = () => {
  // BMR State
  const [bmrResult, setBmrResult] = useState<{ bmr: number; tdee: number } | null>(null);
  const [bmrError, setBmrError] = useState<string[]>([]);

  // BMI State
  const [bmiResult, setBmiResult] = useState<{ bmi: number; category: string } | null>(null);
  const [bmiError, setBmiError] = useState<string[]>([]);

  const handleBMRSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const age = parseInt(formData.get('age') as string);
    const weight = parseFloat(formData.get('weight') as string);
    const height = parseFloat(formData.get('height') as string);
    const weightUnit = formData.get('weight-unit') as 'lbs' | 'kg';
    const heightUnit = formData.get('height-unit') as 'in' | 'cm';
    const gender = formData.get('gender') as 'male' | 'female';
    const activityLevel = parseFloat(formData.get('activity-level') as string);

    const errors = validateInputs(age, weight, height, heightUnit);

    if (errors.length > 0) {
      setBmrError(errors);
      setBmrResult(null);
      return;
    }

    setBmrError([]);
    const result = calculateBMR({
      age,
      weight,
      height,
      weightUnit,
      heightUnit,
      gender,
      activityLevel,
    });
    setBmrResult(result);
  };

  const handleBMISubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const weight = parseFloat(formData.get('bmi-weight') as string);
    const height = parseFloat(formData.get('bmi-height') as string);
    const weightUnit = formData.get('bmi-weight-unit') as 'lbs' | 'kg';
    const heightUnit = formData.get('bmi-height-unit') as 'in' | 'cm';

    const errors = validateInputs(25, weight, height, heightUnit);

    if (errors.length > 0) {
      setBmiError(errors);
      setBmiResult(null);
      return;
    }

    setBmiError([]);
    const result = calculateBMI(weight, height, weightUnit, heightUnit);
    setBmiResult(result);
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="text-center py-10">
        <h2 className="text-4xl font-bold font-semiboldtext-white">Calculators</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* BMR Calculator */}
        <div className="glass rounded-2xl p-6 hover:scale-105 transition-transform duration-300 animate-fadeIn">
          <div className="flex items-center gap-3 mb-6">
            <Calculator className="w-6 h-6 text-purple-400" />
            <h3 className="text-2xl font-semibold text-white">BMR Calculator</h3>
          </div>

          <p className="text-gray-300 mb-6 text-sm">
            Calculate your Basal Metabolic Rate (BMR) to understand your baseline calorie needs at rest.
          </p>

          <form onSubmit={handleBMRSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Age</label>
                <input
                  type="number"
                  name="age"
                  placeholder="Enter your age"
                  required
                  className="w-full px-3 py-2 glass-light rounded-lg focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/50 text-white placeholder-gray-400 border border-white/10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Gender</label>
                <select
                  name="gender"
                  className="w-full px-3 py-2 glass-light rounded-lg focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/50 text-white border border-white/10"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Weight</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  name="weight"
                  placeholder="Enter weight"
                  required
                  className="flex-1 px-3 py-2 glass-light rounded-lg focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/50 text-white placeholder-gray-400 border border-white/10"
                />
                <select
                  name="weight-unit"
                  className="px-3 py-2 glass-light rounded-lg focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/50 text-white border border-white/10"
                >
                  <option value="lbs">lbs</option>
                  <option value="kg">kg</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Height</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  name="height"
                  placeholder="Enter height"
                  required
                  className="flex-1 px-3 py-2 glass-light rounded-lg focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/50 text-white placeholder-gray-400 border border-white/10"
                />
                <select
                  name="height-unit"
                  className="px-3 py-2 glass-light rounded-lg focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/50 text-white border border-white/10"
                >
                  <option value="in">in</option>
                  <option value="cm">cm</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Activity Level
              </label>
              <select
                name="activity-level"
                className="w-full px-3 py-2 glass-light rounded-lg focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/50 text-white border border-white/10"
              >
                <option value="1.2">Sedentary (little or no exercise)</option>
                <option value="1.375">Lightly active (light exercise 1-3 days/week)</option>
                <option value="1.55">Moderately active (moderate exercise 3-5 days/week)</option>
                <option value="1.725">Very active (hard exercise 6-7 days/week)</option>
                <option value="1.9">Super active (very hard exercise, physical job)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full px-4 py-3 bg-linear-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-purple-500/50 hover:scale-105 transition-all"
            >
              Calculate BMR
            </button>
          </form>

          {bmrError.length > 0 && (
            <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded">
              {bmrError.map((error, idx) => (
                <p key={idx} className="text-red-700 text-sm">
                  • {error}
                </p>
              ))}
            </div>
          )}

          {bmrResult && (
            <div className="mt-4 p-4 glass-light border-l-4 border-purple-500 rounded space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-300">BMR</p>
                  <p className="text-2xl font-bold text-purple-400">{bmrResult.bmr} cal/day</p>
                  <p className="text-xs text-gray-400">Calories burned at rest</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-300">TDEE</p>
                  <p className="text-2xl font-bold text-purple-400">{bmrResult.tdee} cal/day</p>
                  <p className="text-xs text-gray-400">Total daily needs</p>
                </div>
              </div>
              <div className="text-xs text-gray-300 mt-3 pt-3 border-t border-white/10">
                <strong>Weight Goals:</strong><br/>
                • Weight loss: {bmrResult.tdee - 500} cal/day (-1 lb/week)<br/>
                • Maintain: {bmrResult.tdee} cal/day<br/>
                • Weight gain: {bmrResult.tdee + 500} cal/day (+1 lb/week)
              </div>
            </div>
          )}
        </div>

        {/* BMI Calculator */}
        <div className="glass rounded-2xl p-6 hover:scale-105 transition-transform duration-300 animate-fadeIn">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-6 h-6 text-yellow-400" />
            <h3 className="text-2xl font-semibold text-white">BMI Calculator</h3>
          </div>

          <p className="text-gray-300 mb-6 text-sm">
            Calculate your Body Mass Index (BMI) to assess if your weight is in a healthy range.
          </p>

          <form onSubmit={handleBMISubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Weight</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  name="bmi-weight"
                  placeholder="Enter weight"
                  required
                  className="flex-1 px-3 py-2 glass-light rounded-lg focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/50 text-white placeholder-gray-400 border border-white/10"
                />
                <select
                  name="bmi-weight-unit"
                  className="px-3 py-2 glass-light rounded-lg focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/50 text-white border border-white/10"
                >
                  <option value="lbs">lbs</option>
                  <option value="kg">kg</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Height</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  name="bmi-height"
                  placeholder="Enter height"
                  required
                  className="flex-1 px-3 py-2 glass-light rounded-lg focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/50 text-white placeholder-gray-400 border border-white/10"
                />
                <select
                  name="bmi-height-unit"
                  className="px-3 py-2 glass-light rounded-lg focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/50 text-white border border-white/10"
                >
                  <option value="in">in</option>
                  <option value="cm">cm</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full px-4 py-3 bg-linear-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-purple-500/50 hover:scale-105 transition-all"
            >
              Calculate BMI
            </button>
          </form>

          {bmiError.length > 0 && (
            <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded">
              {bmiError.map((error, idx) => (
                <p key={idx} className="text-red-700 text-sm">
                  • {error}
                </p>
              ))}
            </div>
          )}

          {bmiResult && (
            <div className="mt-4 p-4 glass-light border-l-4 border-yellow-500 rounded">
              <p className="text-sm font-medium text-gray-300 mb-1">Your BMI</p>
              <p className="text-3xl font-bold text-yellow-400 mb-2">{bmiResult.bmi}</p>
              <p className="text-lg font-semibold text-white">{bmiResult.category}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalculatorModule;
