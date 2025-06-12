import { useState } from "react";
import ScoreDisplay from "@/components/score-display";
import TaskForm from "@/components/task-form";
import TaskTable from "@/components/task-table";
import TimerModal from "@/components/timer-modal";
import NotificationToast from "@/components/notification-toast";
import { useTasks } from "@/hooks/use-tasks";
import { Moon, CheckSquare } from "lucide-react";

export default function TodoApp() {
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [notifications, setNotifications] = useState([]);
  
  const { tasks, isLoading, createTask, updateTask, deleteTask } = useTasks();

  const handleCompleteTask = (task) => {
    setCurrentTask(task);
    setIsTimerModalOpen(true);
  };

  const handleConfirmCompletion = (actualTime) => {
    if (currentTask) {
      updateTask.mutate({
        id: currentTask.id,
        actualTime,
        completed: true,
        completedAt: new Date().toISOString(),
      });
      
      const hours = Math.floor(actualTime / 60);
      const minutes = actualTime % 60;
      const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
      
      showNotification(
        `Task completed successfully! ${currentTask.title} - ${timeStr} actual`,
        'success',
        true,
        () => handleUndoCompletion(currentTask.id)
      );
    }
    setIsTimerModalOpen(false);
    setCurrentTask(null);
  };

  const handleUndoCompletion = (taskId) => {
    updateTask.mutate({
      id: taskId,
      actualTime: null,
      completed: false,
      completedAt: null,
    });
    showNotification('Task completion undone', 'success');
  };

  const handleDeleteTask = (task) => {
    deleteTask.mutate(task.id);
    showNotification(
      `Task "${task.title}" deleted successfully!`,
      'success',
      true,
      () => handleUndoDelete(task)
    );
  };

  const handleUndoDelete = (task) => {
    createTask.mutate({
      title: task.title,
      priority: task.priority,
      estimatedTime: task.estimatedTime,
    });
    showNotification('Task deletion undone', 'success');
  };

  const showNotification = (message, type = 'success', hasUndo = false, undoAction = null) => {
    const id = Date.now();
    const notification = { id, message, type, hasUndo, undoAction };
    setNotifications(prev => [...prev, notification]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const hideNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const completedTasks = tasks?.filter(task => task.completed) || [];
  const pendingTasks = tasks?.filter(task => !task.completed) || [];
  const totalScore = completedTasks.reduce((sum, task) => sum + task.priority, 0);
  const totalEstimatedTime = pendingTasks.reduce((sum, task) => sum + task.estimatedTime, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CheckSquare className="h-8 w-8 text-black" />
            <h1 className="text-xl font-semibold text-black">Todo Priority App</h1>
          </div>
          <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Moon className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Top Section: Score Display and Task Form Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <ScoreDisplay 
            totalScore={totalScore}
            completedTasks={completedTasks.length}
            totalTasks={tasks?.length || 0}
            pendingTasks={pendingTasks.length}
            totalEstimatedTime={totalEstimatedTime}
          />
          <TaskForm 
            onSubmit={(taskData) => {
              createTask.mutate(taskData);
              showNotification(`Task "${taskData.title}" added successfully!`, 'success');
            }}
            isLoading={createTask.isPending}
          />
        </div>

        {/* Task List Table */}
        <TaskTable 
          tasks={tasks || []}
          isLoading={isLoading}
          onCompleteTask={handleCompleteTask}
          onDeleteTask={handleDeleteTask}
        />
      </main>

      {/* Timer Modal */}
      <TimerModal 
        isOpen={isTimerModalOpen}
        task={currentTask}
        onClose={() => {
          setIsTimerModalOpen(false);
          setCurrentTask(null);
        }}
        onConfirm={handleConfirmCompletion}
      />

      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map(notification => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            onClose={() => hideNotification(notification.id)}
            onUndo={notification.undoAction}
          />
        ))}
      </div>
    </div>
  );
}
