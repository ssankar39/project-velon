'use client';

import React, { useState } from 'react';

interface DataPoint {
  time: string;
  actual: number;
  target: number;
}

interface ActivityGraphProps {
  data?: DataPoint[];
  title?: string;
}

const defaultData: DataPoint[] = [
  { time: '7 AM', actual: 200, target: 180 },
  { time: '8 AM', actual: 450, target: 400 },
  { time: '9 AM', actual: 780, target: 650 },
  { time: '10 AM', actual: 1100, target: 900 },
  { time: '11 AM', actual: 1350, target: 1200 },
  { time: '12 PM', actual: 1580, target: 1450 },
  { time: '1 PM', actual: 1720, target: 1600 },
  { time: '2 PM', actual: 1850, target: 1750 },
  { time: '3 PM', actual: 1900, target: 1850 },
  { time: '4 PM', actual: 1920, target: 1900 },
  { time: '5 PM', actual: 1950, target: 1950 },
  { time: '6 PM', actual: 1980, target: 2000 },
  { time: '7 PM', actual: 1990, target: 2000 },
  { time: '8 PM', actual: 1995, target: 2000 },
  { time: '9 PM', actual: 2000, target: 2000 },
  { time: '10 PM', actual: 2000, target: 2000 },
];

export const ActivityGraph: React.FC<ActivityGraphProps> = ({
  data = defaultData,
  title = 'Activity Statistics',
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxValue = Math.max(...data.map((d) => Math.max(d.actual, d.target)));
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
                  <p className="text-xs text-gray-400 mb-1">{data[hoveredIndex].time}</p>
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
            if (i % 2 === 0) {
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
                  {point.time}
                </text>
              );
            }
            return null;
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
