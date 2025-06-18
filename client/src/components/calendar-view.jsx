import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CalendarDays, CheckCircle, Clock, Target } from 'lucide-react';
import { format, isSameDay, startOfDay, endOfDay } from 'date-fns';

export function CalendarView({ tasks }) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Get tasks for the selected date
  const getTasksForDate = (date) => {
    return tasks.filter(task => {
      const taskDate = task.completedAt ? new Date(task.completedAt) : new Date(task.createdAt);
      return isSameDay(taskDate, date);
    });
  };

  // Get completed tasks for the selected date
  const getCompletedTasksForDate = (date) => {
    return tasks.filter(task => 
      task.completed && 
      task.completedAt && 
      isSameDay(new Date(task.completedAt), date)
    );
  };

  // Get created tasks for the selected date (main tasks only, not later tasks)
  const getCreatedTasksForDate = (date) => {
    return tasks.filter(task => 
      task.createdAt && 
      !task.isLater && // Only count main tasks
      isSameDay(new Date(task.createdAt), date)
    );
  };

  const selectedDateTasks = getTasksForDate(selectedDate);
  const completedTasks = getCompletedTasksForDate(selectedDate);
  const createdTasks = getCreatedTasksForDate(selectedDate);

  // Calculate metrics for selected date
  const totalPriorityPoints = completedTasks.reduce((sum, task) => sum + task.priority, 0);
  const totalCreatedPriorityPoints = createdTasks.reduce((sum, task) => sum + task.priority, 0);
  const totalTimeSpent = completedTasks.reduce((sum, task) => sum + (task.actualTime || 0), 0);
  const completionRate = createdTasks.length > 0 ? (completedTasks.length / createdTasks.length) * 100 : 0;
  const priorityCompletionRate = totalCreatedPriorityPoints > 0 ? (totalPriorityPoints / totalCreatedPriorityPoints) * 100 : 0;

  // Check if a date has any tasks
  const hasTasksOnDate = (date) => {
    return tasks.some(task => {
      const taskDate = task.completedAt ? new Date(task.completedAt) : new Date(task.createdAt);
      return isSameDay(taskDate, date);
    });
  };

    const formatTime = (timeInMinutes) => {
        if (timeInMinutes >= 60) {
            return `${Math.floor(timeInMinutes / 60)}h ${timeInMinutes % 60}m`;
        } else {
            return `${timeInMinutes}m`;
        }
    };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Task Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
              modifiers={{
                hasTask: (date) => hasTasksOnDate(date)
              }}
              modifiersStyles={{
                hasTask: { 
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                  fontWeight: 'bold'
                }
              }}
            />
            <div className="mt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded"></div>
                <span>Days with tasks</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily Analytics */}
        <Card>
          <CardHeader>
            <CardTitle>
              Analytics for {format(selectedDate, 'MMMM d, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Priority Completion Rate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Priority Completion Rate</span>
                <span className="text-sm text-muted-foreground">{priorityCompletionRate.toFixed(0)}%</span>
              </div>
              <Progress value={priorityCompletionRate} className="h-2" />
            </div>

            {/* Priority Points */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Priority Points</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{totalPriorityPoints}</Badge>
                <span className="text-xs text-muted-foreground">of {totalCreatedPriorityPoints}</span>
              </div>
            </div>

            {/* Time Spent */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Time Spent</span>
              </div>
              <Badge variant="outline">{formatTime(totalTimeSpent)}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task List for Selected Date */}
      {selectedDateTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tasks for {format(selectedDate, 'MMMM d, yyyy')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedDateTasks.map(task => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className={`h-4 w-4 ${task.completed ? 'text-green-500' : 'text-gray-400'}`} />
                    <span className={task.completed ? 'line-through text-muted-foreground' : ''}>{task.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Priority {task.priority}</Badge>
                    {task.completed && task.actualTime && (
                      <Badge variant="secondary">{Math.round(task.actualTime / 60)}min</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}