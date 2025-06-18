import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, Edit, Trash2, Clock, CheckCircle, CheckSquare, GripVertical } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Archive, ArchiveRestore } from 'lucide-react';

export default function TaskTable({ tasks, isLoading, onCompleteTask, onDeleteTask, onEditTask, onUndoCompletion, onMoveToLater }) {
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

    const handleDelete = (taskId) => {
        onDeleteTask(taskId);
    };

    const handleArchive = (taskId) => {
        // Implement archive functionality here
        console.log(`Archive task with ID: ${taskId}`);
    };

  return (
    <Card className="bg-white dark:bg-black shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-semibold text-black dark:text-white">Main Tasks</h3>
      </div>

      {/* Table Header */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="grid grid-cols-12 gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          <div className="col-span-1 text-center"></div>
          <div className="col-span-1 text-center">Done</div>
          <div className="col-span-1 text-center">Priority</div>
          <div className="col-span-2 text-left">Task</div>
          <div className="col-span-2 text-center">Est Time</div>
          <div className="col-span-2 text-center">Actual Time</div>
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
                className={`px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors group ${
                  task.completed 
                    ? `${getDistractionBackgroundColor(task.distractionLevel) || 'bg-gray-50 dark:bg-gray-800'}` 
                    : ''
                }`}
              >
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-1 flex justify-center">
                    <div
                      draggable={!task.completed}
                      onDragStart={(e) => {
                        if (!task.completed) {
                          e.dataTransfer.setData('text/plain', JSON.stringify(task));
                          e.dataTransfer.effectAllowed = 'copy';
                        }
                      }}
                      className={`${!task.completed ? 'cursor-grab active:cursor-grabbing opacity-50 group-hover:opacity-100' : 'opacity-30'} transition-opacity`}
                    >
                      <GripVertical className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <Checkbox 
                      checked={task.completed} 
                      onCheckedChange={() => task.completed ? onUndoCompletion(task) : onCompleteTask(task)}
                      className="cursor-pointer"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                      task.completed ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400' : getPriorityColor(task.priority, false)
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className={`font-medium truncate block ${
                      task.completed 
                        ? 'text-gray-400 dark:text-gray-500 line-through' 
                        : 'text-gray-900 dark:text-gray-100'
                    }`} title={task.title}>
                      {task.title}
                    </span>
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <div className={`flex items-center text-sm ${
                      task.completed ? 'text-gray-400' : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{formatTime(task.estimatedTime)}</span>
                    </div>
                  </div>
                  <div className="col-span-2 flex justify-center">
                    {task.completed && task.actualTime !== null && task.actualTime !== undefined ? (
                      <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        <span className="font-medium">{formatTime(task.actualTime)}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                    )}
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {task.completed && task.distractionLevel !== null && task.distractionLevel !== undefined && task.distractionLevel >= 1 && task.distractionLevel <= 5 ? (
                      <span className={`text-sm font-bold ${getDistractionColor(task.distractionLevel)}`}>
                        {task.distractionLevel}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
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
                    {/* Archive/Unarchive Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleArchive(task.id)}
                      className={task.archived ? "text-blue-600 hover:text-blue-700" : "text-orange-600 hover:text-orange-700"}
                    >
                      {task.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                    </Button>

                    {/* Delete Button with Confirmation */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Delete Task"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the task "{task.title}" and remove all associated data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(task.id)} className="bg-red-600 hover:bg-red-700">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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