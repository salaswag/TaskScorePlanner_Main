
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function CalendarView({ tasks, onUpdateTask }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [editingTime, setEditingTime] = useState(null);
  const [tempTimeValue, setTempTimeValue] = useState('');
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [sliderTime, setSliderTime] = useState(0);

  // Get data for a specific date
  const getDayData = (date) => {
    const completedTasks = tasks.filter(task => 
      task.completed && 
      task.completedAt && 
      isSameDay(new Date(task.completedAt), date)
    );

    const priorityScore = completedTasks.reduce((sum, task) => sum + (task.priority || 0), 0);
    const maxPossibleScore = completedTasks.length * 10; // Assuming max priority is 10
    const priorityPercentage = maxPossibleScore > 0 ? (priorityScore / maxPossibleScore) * 100 : 0;
    const timeSpent = completedTasks.reduce((sum, task) => sum + (task.actualTime || 0), 0);

    return {
      priorityScore,
      priorityPercentage,
      timeSpent,
      hasData: completedTasks.length > 0,
      tasks: completedTasks
    };
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

  // Get background color based on priority percentage
  const getDayBackgroundColor = (percentage) => {
    if (percentage === 0) return '';
    if (percentage < 30) return 'bg-red-100 dark:bg-red-950/30';
    if (percentage < 60) return 'bg-yellow-100 dark:bg-yellow-950/30';
    return 'bg-green-100 dark:bg-green-950/30';
  };

  // Get priority badge color based on percentage
  const getPriorityBadgeColor = (percentage) => {
    if (percentage < 30) return 'bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-300';
    if (percentage < 60) return 'bg-yellow-200 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
    return 'bg-green-200 text-green-800 dark:bg-green-900/50 dark:text-green-300';
  };

  const handleTimeEdit = (date, currentTime) => {
    setSelectedDate(date);
    setSliderTime(currentTime);
    setShowTimeModal(true);
  };

  const handleTimeSave = async () => {
    if (selectedDate && sliderTime >= 0) {
      const dayTasks = getDayData(selectedDate).tasks;
      
      // Override the time for all tasks on this day with proportional distribution
      if (dayTasks.length > 0) {
        const totalCurrentTime = dayTasks.reduce((sum, task) => sum + (task.actualTime || 0), 0);
        
        for (const task of dayTasks) {
          const proportion = totalCurrentTime > 0 ? (task.actualTime || 0) / totalCurrentTime : 1 / dayTasks.length;
          const newTaskTime = Math.round(sliderTime * proportion);
          
          if (onUpdateTask) {
            await onUpdateTask(task.id, { ...task, actualTime: newTaskTime });
          }
        }
      }
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
            const dayData = getDayData(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());
            const dateKey = day.toISOString();

            return (
              <div
                key={index}
                className={`
                  min-h-[120px] p-2 border-b border-r border-gray-200 dark:border-gray-600 relative
                  ${!isCurrentMonth ? 'bg-gray-50 dark:bg-gray-800/30 text-gray-400' : ''}
                  ${isToday && !dayData.hasData ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                  ${isCurrentMonth && dayData.hasData ? getDayBackgroundColor(dayData.priorityPercentage) : (!isCurrentMonth ? '' : 'bg-white dark:bg-gray-900')}
                `}
              >
                <div className="flex flex-col h-full relative z-10">
                  {/* Date Number */}
                  <div className={`
                    text-sm font-medium mb-2
                    ${isToday ? 'text-blue-600 dark:text-blue-400 font-bold' : ''}
                    ${!isCurrentMonth ? 'text-gray-400' : dayData.hasData ? 'text-gray-800 dark:text-gray-200' : 'text-gray-900 dark:text-gray-100'}
                  `}>
                    {format(day, 'd')}
                  </div>

                  {/* Day Data */}
                  {isCurrentMonth && dayData.hasData && (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-2">
                      {/* Priority Percentage - Larger */}
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-1">
                          {Math.round(dayData.priorityPercentage)}%
                        </div>
                      </div>

                      {/* Time Spent - Larger and Editable */}
                      <div className="text-center">
                        <div 
                          className="cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 rounded p-1 transition-colors"
                          onClick={() => handleTimeEdit(day, dayData.timeSpent)}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                              {formatTime(dayData.timeSpent)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-300">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 dark:bg-red-950/30 border rounded"></div>
            <span>Low Performance (&lt;30%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-100 dark:bg-yellow-950/30 border rounded"></div>
            <span>Medium Performance (30-60%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 dark:bg-green-950/30 border rounded"></div>
            <span>High Performance (&gt;60%)</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>Click time to edit</span>
        </div>
      </div>

      {/* Time Edit Modal */}
      <Dialog open={showTimeModal} onOpenChange={setShowTimeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span>Edit Time Spent</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 p-4">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : ''}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Adjust the total time spent on this day
              </p>
            </div>

            {/* Time Slider */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Time spent: {formatSliderTime(sliderTime)}
              </label>
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="720"
                  step="15"
                  value={sliderTime}
                  onChange={(e) => setSliderTime(parseInt(e.target.value))}
                  className="slider w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>0m</span>
                  <span>6h</span>
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
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
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
