
import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Plus, Calendar, Clock } from "lucide-react";

export default function NotionStyleTable({ 
  tasks, 
  isLoading, 
  onCompleteTask, 
  onDeleteTask, 
  onEditTask, 
  onCreateTask,
  onUpdateTask 
}) {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [draggedWidth, setDraggedWidth] = useState(0);

  const formatDate = (date) => {
    if (!date) return "No date";
    return new Date(date).toLocaleDateString();
  };

  const formatTime = (minutes) => {
    if (!minutes) return "0h";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h${mins > 0 ? ` ${mins}m` : ''}` : `${mins}m`;
  };

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      onCreateTask({
        title: newTaskTitle.trim(),
        priority: 5,
        estimatedTime: 60,
        dueDate: new Date().toISOString()
      });
      setNewTaskTitle("");
    }
  };

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    setDragStartX(e.clientX);
    setDraggedWidth(task.estimatedTime || 60);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    if (draggedTask && draggedWidth !== (draggedTask.estimatedTime || 60)) {
      onUpdateTask({
        ...draggedTask,
        estimatedTime: Math.max(15, draggedWidth) // Minimum 15 minutes
      });
    }
    setDraggedTask(null);
    setDragStartX(0);
    setDraggedWidth(0);
  };

  const handleMouseMove = (e) => {
    if (draggedTask) {
      const deltaX = e.clientX - dragStartX;
      const newWidth = Math.max(15, (draggedTask.estimatedTime || 60) + Math.floor(deltaX / 2));
      setDraggedWidth(newWidth);
    }
  };

  // Separate completed and pending tasks
  const pendingTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-black shadow-sm border border-gray-200 dark:border-gray-800">
        <CardContent className="p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white mx-auto"></div>
            <p className="text-gray-500 dark:text-gray-400 mt-4">Loading tasks...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" onMouseMove={handleMouseMove}>
      {/* To-do Section */}
      <Card className="bg-white dark:bg-black shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">To-do</h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">{pendingTasks.length}</span>
          </div>
        </div>

        {/* Header */}
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
          <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            <div className="col-span-4">Name</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-3">Due Date</div>
            <div className="col-span-3">Timeline</div>
          </div>
        </div>

        {/* Add new task row */}
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50">
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-4 flex items-center space-x-2">
              <Plus className="h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="New task"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                className="border-none bg-transparent p-0 focus:ring-0 text-sm placeholder-gray-400"
              />
            </div>
            <div className="col-span-8">
              {newTaskTitle && (
                <Button 
                  onClick={handleAddTask}
                  size="sm"
                  className="h-6 px-2 text-xs"
                >
                  Add
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Pending Tasks */}
        {pendingTasks.map((task) => (
          <div key={task.id} className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 group">
            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-4 flex items-center space-x-2">
                <Checkbox 
                  checked={false}
                  onCheckedChange={() => onCompleteTask(task)}
                  className="h-4 w-4"
                />
                <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                  {task.title}
                </span>
              </div>
              <div className="col-span-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
                  Not started
                </span>
              </div>
              <div className="col-span-3 flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(task.dueDate)}</span>
              </div>
              <div className="col-span-3">
                <div 
                  className="flex items-center space-x-2 cursor-grab active:cursor-grabbing"
                  draggable
                  onDragStart={(e) => handleDragStart(e, task)}
                  onDragEnd={handleDragEnd}
                >
                  <div 
                    className="h-6 bg-blue-200 dark:bg-blue-800 rounded flex items-center justify-center text-xs text-blue-800 dark:text-blue-200 font-medium px-2"
                    style={{ 
                      width: `${Math.max(60, (draggedTask?.id === task.id ? draggedWidth : task.estimatedTime || 60) / 2)}px`,
                      minWidth: '40px'
                    }}
                  >
                    {formatTime(draggedTask?.id === task.id ? draggedWidth : task.estimatedTime)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {pendingTasks.length === 0 && (
          <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
            <p className="text-sm">No pending tasks</p>
          </div>
        )}
      </Card>

      {/* Complete Section */}
      {completedTasks.length > 0 && (
        <Card className="bg-white dark:bg-black shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Complete</h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">{completedTasks.length}</span>
            </div>
          </div>

          {/* Header */}
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
            <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              <div className="col-span-4">Name</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-3">Due Date</div>
              <div className="col-span-3">Timeline</div>
            </div>
          </div>

          {/* Completed Tasks */}
          {completedTasks.map((task) => (
            <div key={task.id} className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 group opacity-60">
              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-4 flex items-center space-x-2">
                  <Checkbox 
                    checked={true}
                    onCheckedChange={() => onCompleteTask(task)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                    {task.title}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                    Done
                  </span>
                </div>
                <div className="col-span-3 flex items-center space-x-1 text-sm text-gray-400">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(task.dueDate)}</span>
                </div>
                <div className="col-span-3">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-xs text-gray-600 dark:text-gray-400 font-medium px-2 max-w-fit">
                    {formatTime(task.actualTime || task.estimatedTime)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
