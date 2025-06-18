import { useState } from "react";
import ScoreDisplay from "@/components/score-display";
import TaskForm from "@/components/task-form";
import TaskTable from "@/components/task-table";
import TaskEditModal from "@/components/task-edit-modal";
import LaterSection from "@/components/later-section";
import TimerModal from "@/components/timer-modal";
import NotificationToast from "@/components/notification-toast";
import { DashboardView } from "@/components/dashboard-view";

import { useTasks } from "@/hooks/use-tasks";
import { useTheme } from "@/components/theme-provider";
import { Moon, Sun, CheckSquare, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function TodoApp() {
  const [currentTask, setCurrentTask] = useState(null);
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState("tasks");

  const { tasks, isLoading, createTask, updateTask, deleteTask, archiveTask } = useTasks();
  const { theme, setTheme } = useTheme();

  const handleCompleteTask = (task) => {
    setCurrentTask(task);
    setIsTimerModalOpen(true);
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const showNotification = (
    message,
    type = "success",
    hasUndo = false,
    undoAction = null,
  ) => {
    const id = Date.now();
    const notification = { id, message, type, hasUndo, undoAction };
    setNotifications((prev) => [...prev, notification]);

    setTimeout(() => {
      hideNotification(id);
    }, 5000);
  };

  const hideNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Filter tasks into main and later sections - include completed tasks in main view
  const mainTasks =
    tasks && Array.isArray(tasks) ? tasks.filter((task) => !task.isLater) : [];
  const laterTasks =
    tasks && Array.isArray(tasks)
      ? tasks.filter((task) => Boolean(task.isLater))
      : [];

  // Calculate statistics (only from main tasks, excluding later tasks and archived tasks)
  const completedTasks = mainTasks.filter((task) => task.completed && !task.isLater && !task.archived) || [];
  const pendingTasks = mainTasks.filter((task) => !task.completed && !task.isLater && !task.archived) || [];
  const totalScore = completedTasks.reduce(
    (sum, task) => sum + (task.priority || 0),
    0,
  );
  const totalEstimatedTime = pendingTasks.reduce(
    (sum, task) => sum + (task.estimatedTime || 0),
    0,
  );

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
        "success",
        true,
        () => handleUndoCompletion(currentTask.id),
      );
    }
    setIsTimerModalOpen(false);
    setCurrentTask(null);
  };

  const handleUndoCompletion = (task) => {
    updateTask.mutate({
      ...task,
      actualTime: null,
      distractionLevel: null,
      completed: false,
      completedAt: null,
    });
    showNotification("Task completion undone", "success");
  };

  const handleDeleteTask = (task) => {
    deleteTask.mutate(task.id);
    showNotification(
      `Task "${task.title}" deleted`,
      "success",
      true,
      () => handleUndoDelete(task),
    );
  };

  const handleUndoDelete = (task) => {
    createTask.mutate({
      title: task.title,
      priority: task.priority,
      estimatedTime: task.estimatedTime,
    });
    showNotification("Task deletion undone", "success");
  };

  const handleMoveToLater = (task) => {
    updateTask.mutate({
      ...task,
      isLater: true,
      isFocus: false,
    });
  };

  const handleEditTask = (task) => {
    setTaskToEdit(task);
    setIsEditModalOpen(true);
  };

  const handleSaveEditedTask = (editedTask) => {
    updateTask.mutate(editedTask, {
      onSuccess: () => {
        showNotification(
          `Task "${editedTask.title}" updated successfully!`,
          "success"
        );
      },
      onError: (error) => {
        console.error('Update error:', error);
        showNotification(
          `Failed to update task "${editedTask.title}"`,
          "error"
        );
      }
    });
  };

  const handleMoveToMain = (task) => {
    updateTask.mutate({
      ...task,
      isLater: false,
      isFocus: false,
    });
  };

  const handleArchiveTask = async (task) => {
    try {
      console.log('Archiving task:', task);
      await archiveTask.mutateAsync(task.id);
    } catch (error) {
      console.error('Failed to archive task:', error);
    }
  };

  const handleArchive = (task) => {
    console.log("Archive task:", task);
    archiveTask.mutate(task.id, {
      onSuccess: () => {
        showNotification(
          `Task "${task.title}" archived successfully!`,
          "success",
          true,
          () => handleUndoArchive(task),
        );
      },
      onError: (error) => {
        console.error("Archive error:", error);
        showNotification(
          `Failed to archive task "${task.title}"`,
          "error"
        );
      }
    });
  };

  const handleUndoArchive = (task) => {
    // Recreate the task to undo archive
    createTask.mutate({
      title: task.title,
      priority: task.priority,
      estimatedTime: task.estimatedTime,
      completed: task.completed,
      actualTime: task.actualTime,
      distractionLevel: task.distractionLevel,
      isLater: task.isLater
    });
    showNotification("Task archive undone", "success");
  };

  const handleCreateTask = (taskData) => {
    console.log('Creating task from form:', taskData);
    createTask.mutate(taskData, {
      onSuccess: (result) => {
        console.log('Task created successfully:', result);
        showNotification(
          `Task "${taskData.title}" added to Main Tasks!`,
          "success"
        );
      },
      onError: (error) => {
        console.error('Task creation failed:', error);
        showNotification(
          `Failed to create task "${taskData.title}"`,
          "error"
        );
      }
    });
  };


  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Header */}
      <header className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckSquare className="h-8 w-8 text-black dark:text-white" />
              <h1 className="text-xl font-semibold text-black dark:text-white">
                Task Master Pro
              </h1>
            </div>

            {/* Navigation Tabs - Center */}
            <div className="flex-1 flex justify-center">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="tasks">Task Management</TabsTrigger>
                  <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {theme === "light" ? (
                  <Moon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                ) : (
                  <Sun className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="h-[calc(100vh-125px)] overflow-y-auto">
        <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsContent value="tasks" className="mt-0">
              {/* Main Layout: Left sidebar with scoring/form, Right main area with tasks */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
                {/* Left Sidebar */}
                <div className="lg:col-span-1 space-y-4 lg:space-y-6">
                  <ScoreDisplay
                    totalScore={totalScore}
                    completedTasks={completedTasks}
                    totalTasks={mainTasks.length}
                    pendingTasks={pendingTasks}
                    totalEstimatedTime={totalEstimatedTime}
                  />
                  <TaskForm
                    onSubmit={handleCreateTask}
                    isLoading={createTask.isPending}
                  />
                </div>

                {/* Right Main Area */}
                <div className="lg:col-span-2">
                  <TaskTable
                    tasks={mainTasks}
                    onCompleteTask={handleCompleteTask}
                    onUndoCompletion={handleUndoCompletion}
                    onDeleteTask={handleDeleteTask}
                    onEditTask={handleEditTask}
                    onMoveToLater={handleMoveToLater}
                    onMoveToMain={handleMoveToMain}
                    onArchive={handleArchive}
                  />
                  <LaterSection
                    tasks={laterTasks}
                    onMoveToMain={handleMoveToMain}
                    onDeleteTask={handleDeleteTask}
                    onEditTask={handleEditTask}
                    onMoveToLater={handleMoveToLater}
                    onCompleteTask={handleCompleteTask}
                    onUndoCompletion={handleUndoCompletion}
                    onArchiveTask={handleArchiveTask}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="dashboard" className="mt-0">
              <DashboardView tasks={tasks || []} />
            </TabsContent>
          </Tabs>
        </main>
      </div>

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
      {/* Edit Task Modal */}
      <TaskEditModal
        isOpen={isEditModalOpen}
        task={taskToEdit}
        onClose={() => {
          setIsEditModalOpen(false);
          setTaskToEdit(null);
        }}
        onSave={handleSaveEditedTask}
      />

      {/* Notifications */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
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