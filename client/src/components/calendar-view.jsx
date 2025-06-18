import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Clock, Check, X } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isAfter } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [sliderTime, setSliderTime] = useState(0);
  const [timeData, setTimeData] = useState({}); // Store manual time entries
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchTimeEntries();
  }, []);

  const fetchTimeEntries = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest('/api/time-entries');
      const data = await response.json();
      setTimeData(data);
    } catch (error) {
      console.error('Error fetching time entries:', error);
      // Fallback to localStorage for offline functionality
      const saved = localStorage.getItem('timeData');
      if (saved) {
        setTimeData(JSON.parse(saved));
      }
    } finally {
      setIsLoading(false);
    }
  };

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

  const getTimeColorClasses = (timeInMinutes) => {
    if (!timeInMinutes || timeInMinutes === 0) return '';

    const hours = timeInMinutes / 60;

    if (hours >= 8) {
      // Green for 8+ hours
      return 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-800 dark:text-green-200';
    } else if (hours <= 1) {
      // Red for 1 hour or less
      return 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-800 dark:text-red-200';
    } else {
      // Scale from red to green (2-7 hours)
      const ratio = (hours - 1) / 7; // 0 to 1 scale
      if (ratio < 0.16) {
        // Red-ish
        return 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-800 dark:text-red-200';
      }
      else if (ratio < 0.33) {
        // Orange-ish
        return 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700 text-orange-800 dark:text-orange-200';
      } else if (ratio < 0.5) {
        // Yellow-ish
        return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200';
      } else if (ratio < 0.66) {
        // Lime-ish
        return 'bg-lime-100 dark:bg-lime-900/30 border-lime-300 dark:border-lime-700 text-lime-800 dark:text-lime-200';
      }
       else {
        // Light green
        return 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-800 dark:text-green-200';
      }
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
    setIsLoading(true);
    if (selectedDate) {
      const dateKey = format(selectedDate, 'yyyy-MM-dd');
      setTimeData(prev => ({
        ...prev,
        [dateKey]: sliderTime
      }));
    }
    setTimeout(() => { // Simulate saving delay
      setShowTimeModal(false);
      setSelectedDate(null);
      setSliderTime(0);
      setIsLoading(false);
    }, 500);
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
      {isLoading ? (
        <Card className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <CardContent className="p-6">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 dark:text-gray-400 mt-4">Loading calendar...</p>
            </div>
          </CardContent>
        </Card>
      ) : (
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
                  min-h-[120px] p-2 border-b border-r border-gray-200 dark:border-gray-600 relative cursor-pointer
                  ${!isCurrentMonth ? 'bg-gray-50 dark:bg-gray-800/30 text-gray-400' : ''}
                  ${isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                  ${isFuture ? 'opacity-50' : ''}
                  ${isCurrentMonth && !isFuture && timeSpent > 0 ? getTimeColorClasses(timeSpent) : ''}
                  ${isCurrentMonth && !isFuture && timeSpent === 0 ? 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800' : ''}
                `}
                  onClick={() => !isFuture && isCurrentMonth && handleTimeEdit(day)}
                  title={!isFuture && isCurrentMonth ? (timeSpent > 0 ? `${formatTime(timeSpent)} worked - Click to edit` : "Click to add time") : ""}
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
                    {isCurrentMonth && !isFuture && timeSpent === 0 && (
                      <div className="flex-1 flex flex-col items-center justify-center">
                        <div
                          className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg p-3 transition-colors border-2 border-dashed border-gray-300 dark:border-gray-600 w-full text-center"
                          onClick={() => handleTimeEdit(day)}
                          title="Click to add time"
                        >
                          <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm">Add time</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Time display for cells with time */}
                    {isCurrentMonth && !isFuture && timeSpent > 0 && (
                      <div className="flex-1 flex items-center justify-center">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span className="text-lg font-semibold">
                            {formatTime(timeSpent)}
                          </span>
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
      )}

      {/* Instructions and Small Disclaimer */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>Click any day to manually enter time worked</span>
        </div>
        <div className="text-xs text-gray-400 dark:text-gray-500">
          Manual time tracking - not connected to tasks
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
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Time'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}