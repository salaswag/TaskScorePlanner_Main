import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, Edit, Trash2, Clock, CheckCircle, CheckSquare, GripVertical } from "lucide-react";
import { Archive } from 'lucide-react';

export default function TaskTable({
  tasks,
  isLoading,
  onCompleteTask,
  onDeleteTask,
  onEditTask,
  onUndoCompletion,
  onArchive,
  onMoveToMain,
  onMoveToLater,
}) {
  const formatTime = (minutes) => {
    if (!minutes) return "-";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getPriorityColor = (priority, isCompleted = false) => {
    if (isCompleted) {
      if (priority >= 8) return "bg-red-200 text-red-900";
      if (priority >= 5) return "bg-yellow-200 text-yellow-900";
      return "bg-green-200 text-green-900";
    }
    if (priority >= 8) return "bg-red-100 text-red-800";
    if (priority >= 5) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const getDistractionColor = (level) => {
    if (!level) return '';
    const colors = [
      'text-green-600', // 1
      'text-green-500', // 2
      'text-yellow-500', // 3
      'text-orange-500', // 4
      'text-red-500'    // 5
    ];
    return colors[level - 1];
  };

  const getDistractionBackgroundColor = (level) => {
    if (!level) return '';
    const colors = [
      'bg-green-50 dark:bg-green-900/20', // 1
      'bg-green-50 dark:bg-green-900/20', // 2
      'bg-yellow-50 dark:bg-yellow-900/20', // 3
      'bg-orange-50 dark:bg-orange-900/20', // 4
      'bg-red-50 dark:bg-red-900/20'    // 5
    ];
    return colors[level - 1];
  };

  // Sort tasks: incomplete first (by priority desc), then completed at the bottom (by completion time desc)
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed && !b.completed) return 1;
    if (!a.completed && b.completed) return -1;

    // If both completed, sort by completion time (most recent first)
    if (a.completed && b.completed) {
      if (a.completedAt && b.completedAt) {
        return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
      }
    }

    // If both incomplete, sort by priority (highest first)
    if (!a.completed && !b.completed) {
      return (b.priority || 0) - (a.priority || 0);
    }

    return 0;
  });

  if (isLoading) {
    return (
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading tasks...</p>
          </div>
        </CardContent>
      </Card>
    );
  }



  return (
    <Card 
      className="bg-white dark:bg-black shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden transition-colors"
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        e.currentTarget.classList.add('border-green-400', 'bg-green-50/50', 'dark:bg-green-900/20');
      }}
      onDragLeave={(e) => {
        // Only remove classes if we're actually leaving the card
        if (!e.currentTarget.contains(e.relatedTarget)) {
          e.currentTarget.classList.remove('border-green-400', 'bg-green-50/50', 'dark:bg-green-900/20');
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('border-green-400', 'bg-green-50/50', 'dark:bg-green-900/20');

        try {
          const taskData = JSON.parse(e.dataTransfer.getData('text/plain'));
          console.log('Dropped task data to main:', taskData);
          if (taskData && taskData.id && taskData.isLater && !taskData.completed) {
            onMoveToMain && onMoveToMain(taskData);
          }
        } catch (error) {
          console.error('Error parsing dropped task data:', error);
        }
      }}
    >
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-black z-10">
        <h3 className="text-lg font-semibold text-black dark:text-white">Main Tasks</h3>
      </div>

      {/* Table Header */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-[73px] z-10">
        <div className="grid grid-cols-12 gap-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          <div className="col-span-1 text-center"></div>
          <div className="col-span-1 text-center">Done</div>
          <div className="col-span-1 text-center">Priority</div>
          <div className="col-span-4 text-left">Task</div>
          <div className="col-span-1 text-center">Est Time</div>
          <div className="col-span-1 text-center">Actual Time</div>
          <div className="col-span-1 text-center">Dist</div>
          <div className="col-span-2 text-center">Actions</div>
        </div>
      </div>

      {/* Task Rows */}
      <div className="divide-y divide-gray-200 dark:divide-gray-800">
        {sortedTasks.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
            <CheckSquare className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-400 dark:text-gray-500 mb-2">No tasks found</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">Add a new task to get started!</p>
          </div>
        ) : (
          sortedTasks.map((task) => {
            return (
              <div 
                key={task.id}
                draggable={!task.completed}
                onDragStart={(e) => {
                  if (!task.completed) {
                    const taskData = { ...task, id: task.id };
                    e.dataTransfer.setData('text/plain', JSON.stringify(taskData));
                    e.dataTransfer.effectAllowed = 'move';
                    e.currentTarget.classList.add('opacity-50');
                  } else {
                    e.preventDefault();
                  }
                }}
                onDragEnd={(e) => {
                  e.currentTarget.classList.remove('opacity-50');
                }}
                className={`px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors group ${
                  task.completed 
                    ? `${getDistractionBackgroundColor(task.distractionLevel) || 'bg-gray-50 dark:bg-gray-800'}` 
                    : 'cursor-grab active:cursor-grabbing'
                }`}
              >
                <div className="grid grid-cols-12 gap-1 items-center">
                  <div className="col-span-1 flex justify-center">
                    {!task.completed ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onMoveToLater && onMoveToLater(task)}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs px-2 py-1 h-6 font-medium"
                        title="Move to Later"
                      >
                        Later
                      </Button>
                    ) : (
                      <div className="w-8 h-8 flex items-center justify-center">
                        <GripVertical className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <Checkbox 
                      checked={task.completed} 
                      onCheckedChange={(checked) => {
                        if (checked && !task.completed) {
                          onCompleteTask(task);
                        } else if (!checked && task.completed) {
                          onUndoCompletion(task);
                        }
                      }}
                      className="cursor-pointer"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-extrabold border-2 flex-shrink-0 ${getPriorityColor(
                        task.priority,
                        task.completed,
                      )}`}
                    >
                      {task.priority}
                    </span>
                  </div>
                  <div className="col-span-4">
                    <span className={`font-medium block ${
                      task.completed 
                        ? 'text-gray-400 dark:text-gray-500 line-through' 
                        : 'text-gray-900 dark:text-gray-100'
                    }`} title={task.title}>
                      {task.title}
                    </span>
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                      <Clock className="h-3 w-3 mr-1" />
                      <span className="font-semibold">{formatTime(task.estimatedTime)}</span>
                    </div>
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {task.completed && task.actualTime !== null && task.actualTime !== undefined ? (
                      <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        <span className="font-medium">{formatTime(task.actualTime)}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500 dark:text-gray-400">-</span>
                    )}
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {task.completed && task.distractionLevel !== null && task.distractionLevel !== undefined && task.distractionLevel >= 1 && task.distractionLevel <= 5 ? (
                      <span className={`text-xs font-bold ${getDistractionColor(task.distractionLevel)}`}>
                        {task.distractionLevel}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-500">-</span>
                    )}
                  </div>
                  <div className="col-span-2 flex justify-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditTask && onEditTask(task)}
                      className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      title="Edit Task"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    {/* Show Archive for completed tasks, Delete for incomplete tasks */}
                    {task.completed ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onArchive && onArchive(task)}
                        className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                        title="Archive Task"
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteTask && onDeleteTask(task)}
                        className="text-red-400 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Delete Task"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}