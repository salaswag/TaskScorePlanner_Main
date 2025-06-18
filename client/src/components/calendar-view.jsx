import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Clock, Check, X } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isAfter } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ReactClock from 'react-clock';
import 'react-clock/dist/Clock.css';

// Professional Clock Time Picker Component using react-clock
function ClockTimePicker({ onTimeChange, initialMinutes = 0 }) {
  const [startTime, setStartTime] = useState(new Date(2023, 0, 1, 9, 0)); // 9:00 AM
  const [endTime, setEndTime] = useState(new Date(2023, 0, 1, 9, 0)); // Initial end time
  const [isSettingStart, setIsSettingStart] = useState(true); // Toggle between setting start/end

  // Convert minutes to Date object for today
  const minutesToDate = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return new Date(2023, 0, 1, hours, mins);
  };

  // Convert Date object to minutes
  const dateToMinutes = (date) => {
    return date.getHours() * 60 + date.getMinutes();
  };

  // Initialize times based on initialMinutes
  useEffect(() => {
    if (initialMinutes === 0) {
      setStartTime(new Date(2023, 0, 1, 9, 0)); // 9:00 AM
      setEndTime(new Date(2023, 0, 1, 9, 0)); // 9:00 AM
    } else {
      const start = new Date(2023, 0, 1, 9, 0); // 9:00 AM
      const end = new Date(start.getTime() + initialMinutes * 60000); // Add minutes
      setStartTime(start);
      setEndTime(end);
    }
  }, [initialMinutes]);

  // Calculate and notify parent of total work time
  useEffect(() => {
    const startMinutes = dateToMinutes(startTime);
    const endMinutes = dateToMinutes(endTime);
    let totalMinutes = endMinutes - startMinutes;

    // Handle case where end time is next day
    if (totalMinutes < 0) {
      totalMinutes += 24 * 60; // Add 24 hours
    }

    onTimeChange(totalMinutes);
  }, [startTime, endTime, onTimeChange]);

  const handleTimeChange = (newTime) => {
    if (isSettingStart) {
      setStartTime(newTime);
      // If start time is after end time, adjust end time
      if (newTime >= endTime) {
        const newEndTime = new Date(newTime.getTime() + 60000); // Add 1 minute
        setEndTime(newEndTime);
      }
    } else {
      setEndTime(newTime);
      // If end time is before start time, adjust start time
      if (newTime <= startTime) {
        const newStartTime = new Date(newTime.getTime() - 60000); // Subtract 1 minute
        setStartTime(newStartTime);
      }
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTotalWorkTime = () => {
    const startMinutes = dateToMinutes(startTime);
    const endMinutes = dateToMinutes(endTime);
    let totalMinutes = endMinutes - startMinutes;

    if (totalMinutes < 0) {
      totalMinutes += 24 * 60;
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="text-center space-y-2">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Click to set {isSettingStart ? 'start' : 'end'} time
        </h4>

        {/* Toggle buttons */}
        <div className="flex space-x-2">
          <button
            onClick={() => setIsSettingStart(true)}
            className={`px-3 py-1 rounded text-sm ${
              isSettingStart 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Start Time
          </button>
          <button
            onClick={() => setIsSettingStart(false)}
            className={`px-3 py-1 rounded text-sm ${
              !isSettingStart 
                ? 'bg-red-500 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            End Time
          </button>
        </div>
      </div>

      {/* Professional Clock */}
      <div className="flex justify-center">
        <ReactClock
          value={isSettingStart ? startTime : endTime}
          onChange={handleTimeChange}
          size={200}
          className="react-clock"
        />
      </div>

      {/* Time Display */}
      <div className="text-center space-y-2">
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-300">Start: {formatTime(startTime)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-300">End: {formatTime(endTime)}</span>
          </div>
        </div>
        <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
          Total: {getTotalWorkTime()}
        </div>
      </div>
    </div>
  );
}

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
    } else if (hours >= 7) {
      // Light green for 7+ hours
      return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300';
    } else if (hours <= 1) {
      // Red for 1 hour or less
      return 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-800 dark:text-red-200';
    } else {
      // Scale from red to green (2-6 hours)
      const ratio = (hours - 1) / 6; // 0 to 1 scale for 2-6 hours
      if (ratio < 0.2) {
        // Red-ish
        return 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-800 dark:text-red-200';
      }
      else if (ratio < 0.4) {
        // Orange-ish
        return 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700 text-orange-800 dark:text-orange-200';
      } else if (ratio < 0.6) {
        // Yellow-ish
        return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200';
      } else if (ratio < 0.8) {
        // Lime-ish
        return 'bg-lime-100 dark:bg-lime-900/30 border-lime-300 dark:border-lime-700 text-lime-800 dark:text-lime-200';
      } else {
        // Light lime approaching green
        return 'bg-lime-50 dark:bg-lime-900/20 border-lime-200 dark:border-lime-800 text-lime-700 dark:text-lime-300';
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

  const handleTimeSave = async () => {
    setIsLoading(true);
    if (selectedDate) {
      const dateKey = format(selectedDate, 'yyyy-MM-dd');

      try {
        // Save to MongoDB via API
        const response = await apiRequest('/api/time-entries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            date: dateKey,
            timeInMinutes: sliderTime
          })
        });

        if (response.ok) {
          // Update local state
          setTimeData(prev => ({
            ...prev,
            [dateKey]: sliderTime
          }));

          // Also update localStorage as backup
          const newTimeData = { ...timeData, [dateKey]: sliderTime };
          localStorage.setItem('timeData', JSON.stringify(newTimeData));

          console.log('Time entry saved successfully to MongoDB');
        } else {
          console.error('Failed to save time entry to MongoDB');
          // Fallback to localStorage only
          setTimeData(prev => ({
            ...prev,
            [dateKey]: sliderTime
          }));
          localStorage.setItem('timeData', JSON.stringify({ ...timeData, [dateKey]: sliderTime }));
        }
      } catch (error) {
        console.error('Error saving time entry:', error);
        // Fallback to localStorage
        setTimeData(prev => ({
          ...prev,
          [dateKey]: sliderTime
        }));
        localStorage.setItem('timeData', JSON.stringify({ ...timeData, [dateKey]: sliderTime }));
      }
    }

    setShowTimeModal(false);
    setSelectedDate(null);
    setSliderTime(0);
    setIsLoading(false);
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
                          className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg p-2 transition-colors w-full text-center"
                          onClick={() => handleTimeEdit(day)}
                          title="Click to add time"
                        >
                          <div className="flex items-center justify-center gap-1 text-gray-400 dark:text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span className="text-xs">Add</span>
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

            {/* Clock Time Picker */}
            <div className="space-y-4">
              <div className="text-center">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Drag to set work hours
                </h4>
                <div className="flex justify-center">
                  <ClockTimePicker 
                    onTimeChange={(minutes) => setSliderTime(minutes)}
                    initialMinutes={sliderTime}
                  />
                </div>
              </div>

              {/* Time Display */}
              <div className="text-center">
                <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  Total: {formatSliderTime(sliderTime)}
                </span>
              </div>
            </div>

            {/* Alternative: Direct Time Slider */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Or use slider: <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">{formatSliderTime(sliderTime)}</span>
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