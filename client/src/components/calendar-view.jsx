
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { Button } from '@/components/ui/button';

export function CalendarView({ tasks }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get data for a specific date
  const getDayData = (date) => {
    const completedTasks = tasks.filter(task => 
      task.completed && 
      task.completedAt && 
      isSameDay(new Date(task.completedAt), date)
    );

    const priorityScore = completedTasks.reduce((sum, task) => sum + (task.priority || 0), 0);
    const timeSpent = completedTasks.reduce((sum, task) => sum + (task.actualTime || 0), 0);

    return {
      priorityScore,
      timeSpent,
      hasData: completedTasks.length > 0
    };
  };

  const formatTime = (timeInMinutes) => {
    if (timeInMinutes >= 60) {
      return `${Math.floor(timeInMinutes / 60)}h ${timeInMinutes % 60}m`;
    } else {
      return `${timeInMinutes}m`;
    }
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
      <div className="bg-white dark:bg-gray-900 border rounded-lg overflow-hidden">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-800">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-600 dark:text-gray-400">
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

            return (
              <div
                key={index}
                className={`
                  min-h-[80px] p-2 border-b border-r border-gray-200 dark:border-gray-700
                  ${!isCurrentMonth ? 'bg-gray-50 dark:bg-gray-800/50 text-gray-400' : 'bg-white dark:bg-gray-900'}
                  ${isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
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
                      {/* Priority Score */}
                      <div className="flex items-center justify-center">
                        <Badge 
                          variant="secondary" 
                          className="text-xs px-1 py-0 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        >
                          {dayData.priorityScore}
                        </Badge>
                      </div>

                      {/* Time Spent */}
                      {dayData.timeSpent > 0 && (
                        <div className="flex items-center justify-center">
                          <Badge 
                            variant="outline" 
                            className="text-xs px-1 py-0 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                          >
                            {formatTime(dayData.timeSpent)}
                          </Badge>
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
      <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            10
          </Badge>
          <span>Priority Score</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            2h 30m
          </Badge>
          <span>Time Spent</span>
        </div>
      </div>
    </div>
  );
}
