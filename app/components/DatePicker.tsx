'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  onDateSelect?: (date: Date) => void;
}

export const DatePicker: React.FC<DatePickerProps> = ({ onDateSelect }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startDate, setStartDate] = useState(new Date());

  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    return date;
  });

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    onDateSelect?.(date);
  };

  const handlePrevWeek = () => {
    const newStart = new Date(startDate);
    newStart.setDate(startDate.getDate() - 7);
    setStartDate(newStart);
  };

  const handleNextWeek = () => {
    const newStart = new Date(startDate);
    newStart.setDate(startDate.getDate() + 7);
    setStartDate(newStart);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date) => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  return (
    <div className="glass rounded-2xl p-3 sm:p-4 mb-6 animate-fadeIn">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-white font-semibold text-sm sm:text-base">
          {startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <div className="flex gap-1 sm:gap-2">
          <button
            onClick={handlePrevWeek}
            className="glass-light w-8 h-8 rounded-lg flex items-center justify-center hover:bg-purple-600/30 transition-all active:scale-95"
          >
            <ChevronLeft size={16} className="text-gray-300" />
          </button>
          <button
            onClick={handleNextWeek}
            className="glass-light w-8 h-8 rounded-lg flex items-center justify-center hover:bg-purple-600/30 transition-all active:scale-95"
          >
            <ChevronRight size={16} className="text-gray-300" />
          </button>
        </div>
      </div>

      <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-hide snap-x snap-mandatory">
        {dates.map((date, index) => {
          const selected = isSelected(date);
          const today = isToday(date);

          return (
            <button
              key={index}
              onClick={() => handleDateSelect(date)}
              className={`flex-shrink-0 min-w-[60px] sm:min-w-[70px] md:min-w-[80px] px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-xl transition-all duration-300 snap-center active:scale-95 ${
                selected
                  ? 'bg-purple-600 shadow-lg'
                  : 'glass-light hover:bg-purple-600/30'
              }`}
            >
              <div className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className={`text-xl sm:text-2xl font-bold ${selected ? 'text-white' : 'text-gray-300'}`}>
                {date.getDate()}
              </div>
              {today && !selected && (
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-green-500 rounded-full mx-auto mt-1 sm:mt-2" />
              )}
              {today && selected && (
                <div className="text-[10px] sm:text-xs text-purple-200 mt-0.5 sm:mt-1">Today</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
