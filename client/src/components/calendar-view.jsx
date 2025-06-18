import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function CalendarView({ tasks, onUpdateTask }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [editingTime, setEditingTime] = useState(null);
  const [tempTimeValue, setTempTimeValue] = useState('');

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
    if (timeInMinutes >= 60) {
      return `${Math.floor(timeInMinutes / 60)}h ${timeInMinutes % 60}m`;
    } else {
      return `${timeInMinutes}m`;
    }
  };

  // Get background color based on priority percentage - full cell coloring
  const getCellBackgroundColor = (percentage) => {
    if (percentage === 0) return 'bg-gray-50 dark:bg-gray-900';

    // More subtle colors for better dark mode contrast
    if (percentage < 25) return 'bg-red-100 dark:bg-red-900/30';
    if (percentage < 50) return 'bg-orange-100 dark:bg-orange-900/30';
    if (percentage < 75) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-green-100 dark:bg-green-900/30';
  };

  const getCellBorderColor = (percentage) => {
    if (percentage === 0) return 'border-gray-300 dark:border-gray-600';

    if (percentage < 25) return 'border-red-300 dark:border-red-700';
    if (percentage < 50) return 'border-orange-300 dark:border-orange-700';
    if (percentage < 75) return 'border-yellow-300 dark:border-yellow-700';
    return 'border-green-300 dark:border-green-700';
  };

  const getTextColor = (percentage) => {
    if (percentage === 0) return 'text-gray-600 dark:text-gray-300';

    if (percentage < 25) return 'text-red-700 dark:text-red-300';
    if (percentage < 50) return 'text-orange-700 dark:text-orange-300';
    if (percentage < 75) return 'text-yellow-700 dark:text-yellow-300';
    return 'text-green-700 dark:text-green-300';
  };

  const handleTimeEdit = (dateKey, currentTime) => {
    setEditingTime(dateKey);
    setTempTimeValue(currentTime.toString());
  };

  const handleTimeSave = async (dateKey) => {
    const newTime = parseInt(tempTimeValue);
    if (!isNaN(newTime) && newTime >= 0) {
      const date = new Date(dateKey);
      const dayTasks = getDayData(date).tasks;

      // Update all tasks for this day with proportional time distribution
      if (dayTasks.length > 0) {
        const totalCurrentTime = dayTasks.reduce((sum, task) => sum + (task.actualTime || 0), 0);

        for (const task of dayTasks) {
          const proportion = totalCurrentTime > 0 ? (task.actualTime || 0) / totalCurrentTime : 1 / dayTasks.length;
          const newTaskTime = Math.round(newTime * proportion);

          if (onUpdateTask) {
            await onUpdateTask(task.id, { ...task, actualTime: newTaskTime });
          }
        }
      }
    }
    setEditingTime(null);
    setTempTimeValue('');
  };

  const handleTimeCancel = () => {
    setEditingTime(null);
    setTempTimeValue('');
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
                  min-h-[120px] p-3 border-b border-r border-gray-200 dark:border-gray-600
                  ${!isCurrentMonth ? 'bg-gray-50 dark:bg-gray-800/30 text-gray-400' : ''}
                  ${isToday ? 'ring-2 ring-blue-500 ring-inset' : ''}
                  ${isCurrentMonth && dayData.hasData ? getCellBackgroundColor(dayData.priorityPercentage) : 'bg-white dark:bg-gray-900'}
                  ${isCurrentMonth && dayData.hasData ? getCellBorderColor(dayData.priorityPercentage) : ''}
                `}
              >
                <div className="flex flex-col h-full">
                  {/* Date Number */}
                  <div className={`
                    text-sm font-semibold mb-2
                    ${isToday ? 'text-blue-600 dark:text-blue-400' : ''}
                    ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-900 dark:text-gray-100'}
                  `}>
                    {format(day, 'd')}
                  </div>

                  {/* Day Data */}
                  {isCurrentMonth && dayData.hasData && (
                    <div className="flex-1 space-y-2">
                      {/* Priority Percentage */}
                      <div className="flex items-center justify-center">
                        <div className={`
                          text-lg font-bold px-2 py-1 rounded
                          ${getTextColor(dayData.priorityPercentage)}
                        `}>
                          {Math.round(dayData.priorityPercentage)}%
                        </div>
                      </div>

                      {/* Time Spent - Editable */}
                      {dayData.timeSpent > 0 && (
                        <div className="flex items-center justify-center">
                          {editingTime === dateKey ? (
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                value={tempTimeValue}
                                onChange={(e) => setTempTimeValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleTimeSave(dateKey);
                                  if (e.key === 'Escape') handleTimeCancel();
                                }}
                                onBlur={() => handleTimeSave(dateKey)}
                                className="w-16 h-8 text-xs p-1 text-center"
                                autoFocus
                              />
                              <span className="text-xs">m</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleTimeEdit(dateKey, dayData.timeSpent)}
                              className={`
                                flex items-center gap-1 text-sm font-medium px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800
                                ${getTextColor(dayData.priorityPercentage)}
                              `}
                            >
                              <Clock className="h-3 w-3" />
                              {formatTime(dayData.timeSpent)}
                            </button>
                          )}
                        </div>
                      )}
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
            <div className="w-4 h-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded"></div>
            <span>Low Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded"></div>
            <span>Medium Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded"></div>
            <span>High Priority</span>
          </div>
        </div>
        <div className="text-xs">
          Click time to edit manually
        </div>
      </div>
    </div>
  );
}