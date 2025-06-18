import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isAfter } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [sliderTime, setSliderTime] = useState(0);
  const [timeData, setTimeData] = useState({}); // Store manual time entries

  const formatTime = (timeInMinutes) => {
    if (!timeInMinutes || timeInMinutes === 0) return '0m';
    if (timeInMinutes >= 60) {
      const hours = Math.floor(timeInMinutes / 60);
      const minutes = timeInMinutes % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    } else {
      return `${timeInMinutes}m`;
    }
  };

  const formatSliderTime = (timeInMinutes) => {
    if (timeInMinutes === 0) return '0m';
    if (timeInMinutes >= 60) {
      const hours = Math.floor(timeInMinutes / 60);
      const minutes = timeInMinutes % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    } else {
      return `${timeInMinutes}m`;
    }
  };

  const handleTimeEdit = (date) => {
    // Don't allow editing future dates
    if (isAfter(date, new Date())) {
      return;
    }

    const dateKey = format(date, 'yyyy-MM-dd');
    setSelectedDate(date);
    setSliderTime(timeData[dateKey] || 0);
    setShowTimeModal(true);
  };

  const handleTimeSave = () => {
    if (selectedDate) {
      const dateKey = format(selectedDate, 'yyyy-MM-dd');
      setTimeData(prev => ({
        ...prev,
        [dateKey]: sliderTime
      }));
    }
    setShowTimeModal(false);
    setSelectedDate(null);
    setSliderTime(0);
  };

  const handleTimeCancel = () => {
    setShowTimeModal(false);
    setSelectedDate(null);
    setSliderTime(0);
  };

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const navigateMonth = (direction) => {
    if (direction === 'prev') {
      setCurrentMonth(subMonths(currentMonth, 1));
    } else {
      setCurrentMonth(addMonths(currentMonth, 1));
    }
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  return (
    <div className="w-full space-y-4">
      {/* Disclaimer */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-yellow-600 dark:text-yellow-400">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.485 3.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 3.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Manual Time Tracking</h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              This calendar is for manual time entry only. Times entered here are not connected to your tasks and do not reflect actual task completion data.
            </p>
          </div>
        </div>
      </div>

      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={goToToday}
            className="text-xs"
          >
            Today
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-800">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-600 dark:text-gray-300">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const timeSpent = timeData[dateKey] || 0;
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());
            const isFuture = isAfter(day, new Date());

            return (
              <div
                key={index}
                className={`
                  min-h-[120px] p-2 border-b border-r border-gray-200 dark:border-gray-600 relative
                  ${!isCurrentMonth ? 'bg-gray-50 dark:bg-gray-800/30 text-gray-400' : ''}
                  ${isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                  ${isFuture ? 'opacity-50' : ''}
                  ${isCurrentMonth && !isFuture ? 'bg-white dark:bg-gray-900' : ''}
                `}
              >
                <div className="flex flex-col h-full relative z-10">
                  {/* Date Number */}
                  <div className={`
                    text-sm font-medium mb-2
                    ${isToday ? 'text-blue-600 dark:text-blue-400 font-bold' : ''}
                    ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-900 dark:text-gray-100'}
                  `}>
                    {format(day, 'd')}
                  </div>

                  {/* Time Display and Edit */}
                  {isCurrentMonth && !isFuture && (
                    <div className="flex-1 flex flex-col items-center justify-center">
                      <div 
                        className="cursor-pointer hover:bg-black/10 dark:hover:bg-white/20 rounded p-3 transition-colors border border-transparent hover:border-gray-300 dark:hover:border-gray-600 w-full text-center"
                        onClick={() => handleTimeEdit(day)}
                        title="Double-click to edit time"
                        onDoubleClick={() => handleTimeEdit(day)}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Clock className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                          <span className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                            {formatTime(timeSpent)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Double-click to edit
                        </div>
                      </div>
                    </div>
                  )}

                  {isFuture && isCurrentMonth && (
                    <div className="flex-1 flex items-center justify-center">
                      <span className="text-xs text-gray-400">Future date</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Instructions */}
      <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-300">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>Double-click any day to manually enter time worked</span>
        </div>
        <div className="text-xs text-gray-500">
          Note: You can only edit today and past dates
        </div>
      </div>

      {/* Time Edit Modal */}
      <Dialog open={showTimeModal} onOpenChange={setShowTimeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Manual Time Entry</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 p-4">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : ''}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enter the total time you worked on this day
              </p>
            </div>

            {/* Time Slider */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Time worked: <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">{formatSliderTime(sliderTime)}</span>
              </label>
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="720"
                  step="15"
                  value={sliderTime}
                  onChange={(e) => setSliderTime(parseInt(e.target.value))}
                  className="slider w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                  <span>0m</span>
                  <span>3h</span>
                  <span>6h</span>
                  <span>9h</span>
                  <span>12h</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button onClick={handleTimeCancel} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleTimeSave} 
                className="flex-1 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
              >
                Save Time
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}