'use client';

import React, { useState, useEffect } from 'react';

interface DataPoint {
  day: string;
  actual: number;
  target: number;
}

interface ActivityGraphProps {
  data?: DataPoint[];
  title?: string;
  metricType?: 'calories' | 'workouts' | 'weight' | 'fasting';
  userId?: string;
}

interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

interface Workout {
  caloriesBurned: number;
  timestamp: string;
}

interface FastingSession {
  protocol: string;
  completedAt?: string;
  timestamp: string;
}

interface Metric {
  weight?: number;
  timestamp: string;
}

export const ActivityGraph: React.FC<ActivityGraphProps> = ({
  data: externalData,
  title = 'Weekly Progress',
  metricType = 'calories',
  userId,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (externalData) {
      setData(externalData);
      setLoading(false);
    } else {
      fetchWeeklyData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metricType, userId]);

  const fetchWeeklyData = async () => {
    try {
      setLoading(true);
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        setDefaultData();
        return;
      }

      const user: AuthUser = JSON.parse(storedUser);
      const userEmail = userId || user.email;

      // Get last 7 days
      const weekData: DataPoint[] = [];
      const today = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

        weekData.push({
          day: dayName,
          actual: 0,
          target: 0,
        });
      }

      // Fetch data based on metric type
      if (metricType === 'calories') {
        // Fetch workouts for the week
        const response = await fetch(`/api/workouts?userId=${encodeURIComponent(userEmail)}`);
        const workouts: Workout[] = await response.json();
        
        const caloriesGoal = 2000; // Daily calorie burn goal
        workouts.forEach((workout) => {
          const workoutDate = new Date(workout.timestamp);
          const dayIndex = Math.floor((today.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24));
          if (dayIndex >= 0 && dayIndex < 7) {
            weekData[6 - dayIndex].actual += workout.caloriesBurned;
            weekData[6 - dayIndex].target = caloriesGoal;
          }
        });
      } else if (metricType === 'workouts') {
        // Fetch workout count for the week
        const response = await fetch(`/api/workouts?userId=${encodeURIComponent(userEmail)}`);
        const workouts: Workout[] = await response.json();
        
        const workoutGoal = 1; // Daily workout goal
        const workoutCounts: Record<string, number> = {};
        
        workouts.forEach((workout) => {
          const workoutDate = new Date(workout.timestamp).toISOString().split('T')[0];
          workoutCounts[workoutDate] = (workoutCounts[workoutDate] || 0) + 1;
        });

        weekData.forEach((day, index) => {
          const date = new Date(today);
          date.setDate(date.getDate() - (6 - index));
          const dateStr = date.toISOString().split('T')[0];
          day.actual = workoutCounts[dateStr] || 0;
          day.target = workoutGoal;
        });
      } else if (metricType === 'fasting') {
        // Fetch fasting sessions for the week
        const response = await fetch(`/api/fasting?userId=${encodeURIComponent(userEmail)}`);
        const sessions: FastingSession[] = await response.json();
        
        const fastingGoal = 16; // Hours
        sessions.forEach((session) => {
          if (session.completedAt) {
            const sessionDate = new Date(session.completedAt);
            const dayIndex = Math.floor((today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
            if (dayIndex >= 0 && dayIndex < 7) {
              weekData[6 - dayIndex].actual = parseInt(session.protocol);
              weekData[6 - dayIndex].target = fastingGoal;
            }
          }
        });
      } else if (metricType === 'weight') {
        // Fetch metrics for the week
        const response = await fetch(`/api/metrics?userId=${encodeURIComponent(userEmail)}`);
        const metrics: Metric[] = await response.json();
        
        const weightGoal = metrics.length > 0 && metrics[0].weight ? metrics[0].weight * 0.99 : 180; // 1% reduction goal
        
        metrics.forEach((metric) => {
          if (metric.weight) {
            const metricDate = new Date(metric.timestamp);
            const dayIndex = Math.floor((today.getTime() - metricDate.getTime()) / (1000 * 60 * 60 * 24));
            if (dayIndex >= 0 && dayIndex < 7) {
              weekData[6 - dayIndex].actual = metric.weight;
              weekData[6 - dayIndex].target = weightGoal;
            }
          }
        });
      }

      setData(weekData);
    } catch (error) {
      console.error('Error fetching weekly data:', error);
      setDefaultData();
    } finally {
      setLoading(false);
    }
  };

  const setDefaultData = () => {
    const defaultWeekData: DataPoint[] = [
      { day: 'Mon', actual: 0, target: 2000 },
      { day: 'Tue', actual: 0, target: 2000 },
      { day: 'Wed', actual: 0, target: 2000 },
      { day: 'Thu', actual: 0, target: 2000 },
      { day: 'Fri', actual: 0, target: 2000 },
      { day: 'Sat', actual: 0, target: 2000 },
      { day: 'Sun', actual: 0, target: 2000 },
    ];
    setData(defaultWeekData);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6 animate-fadeIn">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-400">Loading weekly data...</p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => Math.max(d.actual, d.target)), 1);
  const padding = 60;
  const graphHeight = 300;
  const graphWidth = 800;

  const getY = (value: number) => {
    return graphHeight - (value / maxValue) * (graphHeight - padding) - padding / 2;
  };

  const getX = (index: number) => {
    return (index / (data.length - 1)) * (graphWidth - padding * 2) + padding;
  };

  const actualPath = data
    .map((point, i) => {
      const x = getX(i);
      const y = getY(point.actual);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  const targetPath = data
    .map((point, i) => {
      const x = getX(i);
      const y = getY(point.target);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  const actualAreaPath = `${actualPath} L ${getX(data.length - 1)} ${graphHeight - padding / 2} L ${padding} ${graphHeight - padding / 2} Z`;

  return (
    <div className="glass rounded-2xl p-6 animate-fadeIn">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-purple-500" />
            <span className="text-sm text-gray-400">Actual Performance</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 border-b-2 border-dashed border-yellow-400" />
            <span className="text-sm text-gray-400">Target Goals</span>
          </div>
        </div>
      </div>

      <div className="relative">
        <svg
          width={graphWidth}
          height={graphHeight}
          className="overflow-visible"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map((i) => {
            const y = graphHeight - (i / 4) * (graphHeight - padding) - padding / 2;
            return (
              <line
                key={i}
                x1={padding}
                y1={y}
                x2={graphWidth - padding}
                y2={y}
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="1"
              />
            );
          })}

          {/* Area fill for actual */}
          <path d={actualAreaPath} fill="url(#purpleGradient)" opacity="0.2" />

          {/* Gradients */}
          <defs>
            <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Target line (dashed) */}
          <path
            d={targetPath}
            fill="none"
            stroke="#fbbf24"
            strokeWidth="2"
            strokeDasharray="8 4"
            opacity="0.8"
          />

          {/* Actual line */}
          <path d={actualPath} fill="none" stroke="#8b5cf6" strokeWidth="3" />

          {/* Data points */}
          {data.map((point, i) => {
            const x = getX(i);
            const yActual = getY(point.actual);
            const yTarget = getY(point.target);

            return (
              <g key={i}>
                {/* Target point */}
                <circle cx={x} cy={yTarget} r="4" fill="#fbbf24" opacity="0.6" />

                {/* Actual point */}
                <circle
                  cx={x}
                  cy={yActual}
                  r={hoveredIndex === i ? '6' : '5'}
                  fill="#8b5cf6"
                  className="cursor-pointer transition-all"
                  onMouseEnter={() => setHoveredIndex(i)}
                />

                {/* Hover area */}
                <rect
                  x={x - 15}
                  y={0}
                  width={30}
                  height={graphHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(i)}
                />
              </g>
            );
          })}

          {/* Hover tooltip */}
          {hoveredIndex !== null && (
            <>
              <line
                x1={getX(hoveredIndex)}
                y1={padding / 2}
                x2={getX(hoveredIndex)}
                y2={graphHeight - padding / 2}
                stroke="#8b5cf6"
                strokeWidth="1"
                strokeDasharray="4 2"
                opacity="0.5"
              />
              <foreignObject
                x={getX(hoveredIndex) - 60}
                y={Math.min(getY(data[hoveredIndex].actual), getY(data[hoveredIndex].target)) - 70}
                width="120"
                height="60"
              >
                <div className="glass-light rounded-lg p-3 text-center shadow-xl">
                  <p className="text-xs text-gray-400 mb-1">{data[hoveredIndex].day}</p>
                  <p className="text-sm text-purple-400 font-semibold">
                    Actual: {data[hoveredIndex].actual}
                  </p>
                  <p className="text-sm text-yellow-400 font-semibold">
                    Target: {data[hoveredIndex].target}
                  </p>
                </div>
              </foreignObject>
            </>
          )}

          {/* X-axis labels */}
          {data.map((point, i) => {
            const x = getX(i);
            return (
              <text
                key={i}
                x={x}
                y={graphHeight - 10}
                textAnchor="middle"
                fontSize="12"
                fill="#9ca3af"
              >
                {point.day}
              </text>
            );
          })}

          {/* Y-axis labels */}
          {[0, 1, 2, 3, 4].map((i) => {
            const value = Math.round((maxValue / 4) * i);
            const y = graphHeight - (i / 4) * (graphHeight - padding) - padding / 2;
            return (
              <text key={i} x={padding - 10} y={y + 4} textAnchor="end" fontSize="12" fill="#9ca3af">
                {value}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
