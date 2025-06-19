import { useState } from "react";
import TaskForm from "@/components/task-form";
import TaskTable from "@/components/task-table";
import TaskEditModal from "@/components/task-edit-modal";
import TimerModal from "@/components/timer-modal";
import LaterSection from "@/components/later-section";

import NotificationToast from "@/components/notification-toast";
import { DashboardView } from "@/components/dashboard-view";
import ScoreDisplay from "@/components/score-display";

import { useTasks } from "@/hooks/use-tasks";
import { useTheme } from "@/components/theme-provider";
import { Moon, Sun, CheckSquare, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import UserMenu from '../components/user-menu';

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

  // Filter tasks into main and later sections
  const mainTasks = tasks && Array.isArray(tasks) ? tasks.filter((task) => !task.archived && !task.isLater) : [];
  const laterTasks = tasks && Array.isArray(tasks) ? tasks.filter((task) => !task.archived && Boolean(task.isLater)) : [];

  // Calculate statistics
  const completedTasks = mainTasks.filter((task) => task.completed) || [];
  const pendingTasks = mainTasks.filter((task) => !task.completed) || [];
  const totalScore = completedTasks.reduce(
    (sum, task) => sum + (task.priority || 0),
    0,
  );
  const totalPossibleScore = mainTasks.reduce(
    (sum, task) => sum + (task.priority || 0),
    0,
  );
  const totalEstimatedTime = pendingTasks.reduce(
    (sum, task) => sum + (task.estimatedTime || 0),
    0,
  );

  const handleConfirmCompletion = (actualTime, distractionLevel) => {
    if (currentTask) {
      const updatedTask = {
        id: currentTask.id,
        title: currentTask.title,
        priority: currentTask.priority,
        estimatedTime: currentTask.estimatedTime,
        actualTime,
        distractionLevel,
        completed: true,
        completedAt: new Date().toISOString(),
      };

      console.log('Completing task with data:', updatedTask);
      updateTask.mutate(updatedTask);

      const hours = Math.floor(actualTime / 60);
      const minutes = actualTime % 60;
      const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

      showNotification(
        `Task completed successfully! - ${currentTask.title} (${timeStr} actual time)`,
        "success",
        true,
        () => handleUndoCompletion(currentTask),
      );
    }
    setIsTimerModalOpen(false);
    setCurrentTask(null);
  };

  const handleUndoCompletion = (task) => {
    const undoTask = {
      ...task,
      actualTime: null,
      distractionLevel: null,
      completed: false,
      completedAt: null,
    };
    console.log('Undoing completion with data:', undoTask);
    updateTask.mutate(undoTask);
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

  const handleEditTask = (task) => {
    setTaskToEdit(task);
    setIsEditModalOpen(true);
  };

  const handleSaveEditedTask = (editedTask) => {
    console.log('Saving edited task:', editedTask);
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

  const handleUpdateTask = (taskData) => {
    console.log('Updating task:', taskData);
    const properTaskData = {
      id: taskData.id,
      ...taskData
    };
    updateTask.mutate(properTaskData);
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
        const section = taskData.isLater ? 'Later Tasks' : 'Main Tasks';
        showNotification(
          `Task "${taskData.title}" added to ${section}!`,
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

  const handleMoveToLater = (task) => {
    const updatedTask = {
      ...task,
      isLater: true,
    };
    updateTask.mutate(updatedTask);
    showNotification(`Task "${task.title}" moved to Later section`, "success");
  };

  const handleMoveToMain = (task) => {
    const updatedTask = {
      ...task,
      isLater: false,
    };
    updateTask.mutate(updatedTask);
    showNotification(`Task "${task.title}" moved back to main tasks`, "success");
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
                  <TabsTrigger value="dashboard">Time Tracking</TabsTrigger>
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
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="h-[calc(100vh-125px)] overflow-y-auto">
        <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsContent value="tasks" className="mt-0">
              <div className="space-y-4">
                {/* Top Section: Score Display and Task Form */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  {/* Score Display - Compact */}
                  <ScoreDisplay
                    totalScore={totalScore}
                    totalPossibleScore={totalPossibleScore}
                    totalEstimatedTime={totalEstimatedTime}
                  />

                  {/* Task Form - Takes remaining space */}
                  <div className="lg:col-span-3">
                    <TaskForm
                      onSubmit={handleCreateTask}
                      isLoading={createTask.isPending}
                    />
                  </div>
                </div>

                {/* Bottom Section: Tasks */}
                <div className="space-y-4">
                  {/* Main Tasks */}
                  <TaskTable
                    tasks={mainTasks}
                    onCompleteTask={handleCompleteTask}
                    onUndoCompletion={handleUndoCompletion}
                    onDeleteTask={handleDeleteTask}
                    onEditTask={handleEditTask}
                    onArchive={handleArchive}
                    onUpdateTask={handleUpdateTask}
                    onMoveToMain={handleMoveToMain}
                    onMoveToLater={handleMoveToLater}
                  />

                  {/* Later Section */}
                  <LaterSection
                    tasks={laterTasks}
                    onMoveToMain={handleMoveToMain}
                    onDeleteTask={handleDeleteTask}
                    onEditTask={handleEditTask}
                    onMoveToLater={handleMoveToLater}
                    onCompleteTask={handleCompleteTask}
                    onUndoCompletion={handleUndoCompletion}
                    onArchiveTask={handleArchive}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="dashboard" className="mt-0">
              <DashboardView />
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

      {/* Edit Modal */}
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