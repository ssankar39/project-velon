'use client';

import React from 'react';

const ComingSoonModule: React.FC<{
  title: string;
  emoji: string;
  description: string;
  features: string[];
}> = ({ title, emoji, description, features }) => {
  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white rounded-lg p-12 shadow-sm text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          {emoji} {title}
        </h2>
        <p className="text-gray-600 text-lg mb-8">{description}</p>

        <ul className="list-none space-y-3 my-8 text-left max-w-md mx-auto">
          {features.map((feature, idx) => (
            <li key={idx} className="text-gray-700 font-medium">
              🚀 {feature}
            </li>
          ))}
        </ul>

        <p className="text-xl font-semibold text-blue-500">
          <strong className="text-gray-900">Coming Soon!</strong> This feature is currently in development.
        </p>
      </div>
    </div>
  );
};

export const WorkoutsModule: React.FC = () => (
  <ComingSoonModule
    title="Workout Tracker"
    emoji="💪"
    description="Log your workouts and track your fitness progress"
    features={[
      'Exercise library with instructions',
      'Customizable workout routines',
      'Progress tracking and analytics',
      'Rest timer and workout timer',
      'Personal records (PR) tracking',
    ]}
  />
);

export const MetricsModule: React.FC = () => (
  <ComingSoonModule
    title="Body Metrics Tracker"
    emoji="📊"
    description="Monitor your body composition and physical measurements"
    features={[
      'Weight tracking with trends',
      'Body measurements (waist, chest, arms, etc.)',
      'Body fat percentage calculator',
      'BMI tracking and health ranges',
      'Progress photos with timeline',
    ]}
  />
);
