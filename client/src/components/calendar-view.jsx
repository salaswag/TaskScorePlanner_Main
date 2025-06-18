
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
                  min-h-[90px] p-2 border-b border-r border-gray-200 dark:border-gray-600
                  ${!isCurrentMonth ? 'bg-gray-50 dark:bg-gray-800/30 text-gray-400' : 'bg-white dark:bg-gray-900'}
                  ${isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                  ${isCurrentMonth && dayData.hasData ? getDayBackgroundColor(dayData.priorityPercentage) : ''}
                `}
              >
                <div className="flex flex-col h-full">
                  {/* Date Number */}
                  <div className={`
                    text-sm font-medium mb-1
                    ${isToday ? 'text-blue-600 dark:text-blue-400' : ''}
                    ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-900 dark:text-gray-100'}
                  `}>
                    {format(day, 'd')}
                  </div>

                  {/* Day Data */}
                  {isCurrentMonth && dayData.hasData && (
                    <div className="flex-1 space-y-1">
                      {/* Priority Percentage */}
                      <div className="flex items-center justify-center">
                        <Badge 
                          className={`text-xs px-1 py-0 ${getPriorityBadgeColor(dayData.priorityPercentage)}`}
                        >
                          {Math.round(dayData.priorityPercentage)}%
                        </Badge>
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
                                className="w-12 h-6 text-xs p-1 text-center"
                                autoFocus
                              />
                              <span className="text-xs">m</span>
                            </div>
                          ) : (
                            <Badge 
                              variant="outline" 
                              className="text-xs px-1 py-0 bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/70"
                              onClick={() => handleTimeEdit(dateKey, dayData.timeSpent)}
                            >
                              <Clock className="w-3 h-3 mr-1" />
                              {formatTime(dayData.timeSpent)}
                            </Badge>
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
    </div>
  );
}
