import { useState } from "react";
import ScoreDisplay from "@/components/score-display";
import TaskForm from "@/components/task-form";
import TaskTable from "@/components/task-table";
import LaterSection from "@/components/later-section";
import FocusSwitchList from "@/components/focus-switch-list";
import TimerModal from "@/components/timer-modal";
import NotificationToast from "@/components/notification-toast";
import UserMenu from "@/components/user-menu";
import { useTasks } from "@/hooks/use-tasks";
import { useTheme } from "@/components/theme-provider";
import { Moon, Sun, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TodoApp() {
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [focusTasks, setFocusTasks] = useState([]);
  const [panelOrder, setPanelOrder] = useState(['score', 'form', 'focus']);

  const { tasks, isLoading, createTask, updateTask, deleteTask } = useTasks();
  const { theme, setTheme } = useTheme();

  const handleCompleteTask = (task) => {
    setCurrentTask(task);
    setIsTimerModalOpen(true);
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const showNotification = (message, type = 'success', hasUndo = false, undoAction = null) => {
    const id = Date.now();
    const notification = { id, message, type, hasUndo, undoAction };
    setNotifications(prev => [...prev, notification]);

    setTimeout(() => {
      hideNotification(id);
    }, 5000);
  };

  const hideNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Filter tasks into main and later sections
  const mainTasks = tasks?.filter(task => !task.isLater && !task.completed) || [];
  const laterTasks = tasks?.filter(task => Boolean(task.isLater)) || [];
  
  // Calculate statistics (only from main tasks)
  const completedTasks = mainTasks.filter(task => task.completed) || [];
  const pendingTasks = mainTasks.filter(task => !task.completed) || [];
  const totalScore = completedTasks.reduce((sum, task) => sum + (task.priority || 0), 0);
  const totalEstimatedTime = pendingTasks.reduce((sum, task) => sum + (task.estimatedTime || 0), 0);

  const handleConfirmCompletion = (actualTime, distractionLevel) => {
    if (currentTask) {
      updateTask.mutate({
        id: currentTask.id,
        title: currentTask.title,
        priority: currentTask.priority,
        estimatedTime: currentTask.estimatedTime,
        actualTime,
        distractionLevel,
        completed: true,
        completedAt: new Date().toISOString(),
      });

      const hours = Math.floor(actualTime / 60);
      const minutes = actualTime % 60;
      const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

      showNotification(
        `Task completed successfully! - ${currentTask.title} (${timeStr} actual time)`,
        'success',
        true,
        () => handleUndoCompletion(currentTask.id)
      );
    }
    setIsTimerModalOpen(false);
    setCurrentTask(null);
  };

  const handleUndoCompletion = (task) => {
    updateTask.mutate({
      id: task.id,
      title: task.title,
      priority: task.priority,
      estimatedTime: task.estimatedTime,
      actualTime: null,
      distractionLevel: null,
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

  const handleEditTask = (task) => {
    // For now, just show a notification that edit functionality is coming
    showNotification('Edit functionality coming soon!', 'info');
  };

  const handleMoveToLater = (task) => {
    updateTask.mutate({
      ...task,
      isLater: true,
    });
    showNotification(`Task "${task.title}" moved to Later section`, 'success');
  };

  const handleMoveToMain = (task) => {
    updateTask.mutate({
      ...task,
      isLater: false,
    });
    showNotification(`Task "${task.title}" moved back to main tasks`, 'success');
  };

  const handleAddToFocus = (task) => {
    // Create a duplicate with a unique key for focus list
    const focusTask = {
      ...task,
      focusId: `focus-${task.id}-${Date.now()}` // Unique identifier for focus list
    };
    
    setFocusTasks(prev => [...prev, focusTask]);
    showNotification(`Task "${task.title}" added to Focus Switch List`, 'success');
  };

  const handleRemoveFromFocus = (task) => {
    setFocusTasks(prev => prev.filter(ft => ft.focusId !== task.focusId));
    showNotification(`Task "${task.title}" removed from Focus Switch List`, 'success');
  };

  const handleReorderFocusTasks = (fromIndex, toIndex) => {
    setFocusTasks(prev => {
      const newTasks = [...prev];
      const [removed] = newTasks.splice(fromIndex, 1);
      newTasks.splice(toIndex, 0, removed);
      return newTasks;
    });
  };

  const handleReorderPanels = (fromIndex, toIndex) => {
    setPanelOrder(prev => {
      const newOrder = [...prev];
      const [removed] = newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, removed);
      return newOrder;
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Header */}
      <header className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CheckSquare className="h-8 w-8 text-black dark:text-white" />
            <h1 className="text-xl font-semibold text-black dark:text-white">Task Master Pro</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <Sun className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              )}
            </Button>
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 bg-white dark:bg-black">
        {/* Main Layout: Left sidebar with scoring/form/focus, Right main area with tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {panelOrder.map((panelType, index) => {
              const panelComponents = {
                score: (
                  <div 
                    key="score"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', JSON.stringify({type: 'panel', index}));
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                      if (data.type === 'panel') {
                        handleReorderPanels(data.index, index);
                      }
                    }}
                    className="cursor-move"
                  >
                    <ScoreDisplay 
                      totalScore={totalScore}
                      completedTasks={completedTasks}
                      totalTasks={mainTasks.length}
                      pendingTasks={pendingTasks}
                      totalEstimatedTime={totalEstimatedTime}
                    />
                  </div>
                ),
                form: (
                  <div 
                    key="form"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', JSON.stringify({type: 'panel', index}));
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                      if (data.type === 'panel') {
                        handleReorderPanels(data.index, index);
                      }
                    }}
                    className="cursor-move"
                  >
                    <TaskForm 
                      onSubmit={(taskData) => {
                        createTask.mutate(taskData);
                        showNotification(`Task "${taskData.title}" added successfully!`, 'success');
                      }}
                      isLoading={createTask.isPending}
                    />
                  </div>
                ),
                focus: (
                  <div 
                    key="focus"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', JSON.stringify({type: 'panel', index}));
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                      if (data.type === 'panel') {
                        handleReorderPanels(data.index, index);
                      }
                    }}
                    className="cursor-move"
                  >
                    <FocusSwitchList 
                      tasks={focusTasks}
                      onMoveToMain={handleMoveToMain}
                      onDeleteTask={handleRemoveFromFocus}
                      onEditTask={handleEditTask}
                      onAddToFocus={handleAddToFocus}
                      onReorder={handleReorderFocusTasks}
                    />
                  </div>
                )
              };
              return panelComponents[panelType];
            })}
          </div>

          {/* Right Main Area */}
          <div className="lg:col-span-2">
            <TaskTable 
              tasks={mainTasks}
              isLoading={isLoading}
              onCompleteTask={handleCompleteTask}
              onDeleteTask={handleDeleteTask}
              onEditTask={handleEditTask}
              onUndoCompletion={handleUndoCompletion}
              onMoveToLater={handleMoveToLater}
            />
            <LaterSection 
              tasks={laterTasks}
              onMoveToMain={handleMoveToMain}
              onDeleteTask={handleDeleteTask}
              onEditTask={handleEditTask}
              onMoveToLater={handleMoveToLater}
              onAddToFocus={handleAddToFocus}
            />
          </div>
        </div>
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
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
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