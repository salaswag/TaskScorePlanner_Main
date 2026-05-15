import React, { useState, useEffect } from "react";
import TaskTable from "@/components/task-table";
import TaskEditModal from "@/components/task-edit-modal";
import TimerModal from "@/components/timer-modal";
import LaterSection from "@/components/later-section";
import FloatingAddButton from "@/components/floating-add-button";
import TaskFormModal from "@/components/task-form-modal";
import DataTransferDialog from "@/components/data-transfer-dialog";

import NotificationToast from "@/components/notification-toast";
import { DashboardView } from "@/components/dashboard-view";
const PlanningView = React.lazy(() => import("@/components/planning-view"));

import { useTasks } from "@/hooks/use-tasks";
// Theme is managed via UserMenu settings popups
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import {
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Calendar,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import UserMenu from "../components/user-menu";
import { useKeyboardAware } from "@/hooks/use-keyboard-aware";
import { useInputFocus } from "@/hooks/use-input-focus";

export default function TodoApp() {
  const [location, setLocation] = useLocation();
  const { user, login, register, logout, isLoading: authLoading } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [notification, setNotification] = useState(null);
  const { isKeyboardVisible } = useKeyboardAware();
  const { handleInputFocus, handleInputBlur, focusNextInput } = useInputFocus();

  const [currentTask, setCurrentTask] = useState(null);
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState(() => {
    const routeToTab = {
      "/time-tracker": "dashboard",
      "/planning": "planning",
      "/": "tasks",
    };
    return routeToTab[location] || "tasks";
  });
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [dashboardViewMode, setDashboardViewMode] = useState("calendar");

  // Sync tab with URL
  useEffect(() => {
    const routeToTab = {
      "/time-tracker": "dashboard",
      "/planning": "planning",
      "/": "tasks",
    };
    const expectedTab = routeToTab[location];
    if (expectedTab && activeTab !== expectedTab) {
      setActiveTab(expectedTab);
    }
  }, [location]);

  const handleTabChange = (value) => {
    setActiveTab(value);
    const tabToRoute = {
      tasks: "/",
      dashboard: "/time-tracker",
      planning: "/planning",
    };
    setLocation(tabToRoute[value] || "/");
  };

  const { tasks, isLoading, createTask, updateTask, deleteTask, archiveTask, archiveAllCompleted } =
    useTasks();
  // Theme is handled by UserMenu component directly via useTheme()

  const handleCompleteTask = (task, actualTime, distractionLevel) => {
    // Inline completion — receives values directly from the panel
    if (actualTime !== undefined && distractionLevel !== undefined) {
      const updatedTask = {
        id: task.id,
        title: task.title,
        priority: task.priority,
        estimatedTime: task.estimatedTime,
        actualTime,
        distractionLevel,
        completed: true,
        completedAt: new Date().toISOString(),
      };
      console.log("Completing task with data:", updatedTask);
      updateTask.mutate(updatedTask);

      const hours = Math.floor(actualTime / 60);
      const minutes = actualTime % 60;
      const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
      showNotification(
        `Task completed! — ${task.title} (${timeStr})`,
        "success",
        true,
        () => handleUndoCompletion(task),
      );
      return;
    }
    // Fallback (shouldn't happen with inline panel)
    setCurrentTask(task);
    setIsTimerModalOpen(true);
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
  const mainTasks =
    tasks && Array.isArray(tasks)
      ? tasks.filter((task) => !task.archived && !task.isLater)
      : [];
  const laterTasks =
    tasks && Array.isArray(tasks)
      ? tasks.filter((task) => !task.archived && Boolean(task.isLater))
      : [];

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

      console.log("Completing task with data:", updatedTask);
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
    console.log("Undoing completion with data:", undoTask);
    updateTask.mutate(undoTask);
    showNotification("Task completion undone", "success");
  };

  const handleDeleteTask = (task) => {
    deleteTask.mutate(task.id);
    showNotification(`Task "${task.title}" deleted`, "success", true, () =>
      handleUndoDelete(task),
    );
  };

  const handleUndoDelete = (task) => {
    createTask.mutate({
      title: task.title,
      priority: task.priority,
      estimatedTime: task.estimatedTime,
      workType: task.workType || null,
      subtasks: task.subtasks || [],
    });
    showNotification("Task deletion undone", "success");
  };

  const handleEditTask = (task) => {
    setTaskToEdit(task);
    setIsEditModalOpen(true);
  };

  const handleSaveEditedTask = (editedTask) => {
    console.log("Saving edited task:", editedTask);
    updateTask.mutate(editedTask, {
      onSuccess: () => {
        showNotification(
          `Task "${editedTask.title}" updated successfully!`,
          "success",
        );
      },
      onError: (error) => {
        console.error("Update error:", error);
        showNotification(
          `Failed to update task "${editedTask.title}"`,
          "error",
        );
      },
    });
  };

  const handleUpdateTask = (taskData) => {
    console.log("Updating task:", taskData);
    const properTaskData = {
      id: taskData.id,
      ...taskData,
    };
    updateTask.mutate(properTaskData);
  };

  const handleArchiveTask = async (task) => {
    try {
      console.log("Archiving task:", task);
      await archiveTask.mutateAsync(task.id);
    } catch (error) {
      console.error("Failed to archive task:", error);
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
        showNotification(`Failed to archive task "${task.title}"`, "error");
      },
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
      isLater: task.isLater,
      workType: task.workType || null,
      subtasks: task.subtasks || [],
    });
    showNotification("Task archive undone", "success");
  };

  const handleCreateTask = (taskData) => {
    console.log("Creating task from form:", taskData);
    createTask.mutate(taskData, {
      onSuccess: (result) => {
        console.log("Task created successfully:", result);
        const section = taskData.isLater ? "Later Tasks" : "Main Tasks";
        showNotification(
          `Task "${taskData.title}" added to ${section}!`,
          "success",
        );
      },
      onError: (error) => {
        console.error("Task creation failed:", error);
        showNotification(`Failed to create task "${taskData.title}"`, "error");
      },
    });
  };

  const handleArchiveAllCompleted = () => {
    if (completedTasks.length === 0) return;

    archiveAllCompleted.mutate(undefined, {
      onSuccess: (result) => {
        const count = result?.count || completedTasks.length;
        const isAnon = user?.isAnonymous || !user;
        showNotification(
          `${count} completed task${count !== 1 ? 's' : ''} ${isAnon ? 'cleared' : 'archived'}!`,
          "success",
        );
      },
      onError: (error) => {
        console.error("Archive all completed failed:", error);
        showNotification("Failed to archive completed tasks", "error");
      },
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
    showNotification(
      `Task "${task.title}" moved back to main tasks`,
      "success",
    );
  };

  // Add touch handling for swipe gestures
  const handleTouchStart = (e) => {
    if (window.innerWidth >= 1024) return; // Only on mobile/tablet
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    if (window.innerWidth >= 1024) return; // Only on mobile/tablet
    if (!touchStart) return;

    const currentTouch = e.touches[0].clientY;
    const diff = touchStart - currentTouch;

    // Swipe up to hide header (when header is visible)
    if (diff > 50 && isHeaderVisible && user && !user.isAnonymous) {
      setIsHeaderVisible(false);
    }
    // Swipe down to show header (when header is hidden)
    else if (diff < -50 && !isHeaderVisible && user && !user.isAnonymous) {
      setIsHeaderVisible(true);
    }
  };

  const handleTouchEnd = () => {
    setTouchStart(null);
  };

  const [touchStart, setTouchStart] = useState(null);

  // Auto-show header when switching to desktop view
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && !isHeaderVisible) {
        setIsHeaderVisible(true);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isHeaderVisible]);

  return (
    <div
      className="min-h-screen bg-white dark:bg-black"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Collapsible Header for Authenticated Users */}
      {user && !user.isAnonymous && !isHeaderVisible && (
        <div className="fixed top-2 left-1/2 transform -translate-x-1/2 z-50 lg:hidden">
          <Button
            onClick={() => setIsHeaderVisible(true)}
            variant="ghost"
            size="sm"
            className="bg-white/70 dark:bg-black/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-md hover:shadow-lg transition-all opacity-60 hover:opacity-90 rounded-full p-2"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Header */}
      <header
        className={`bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 px-6 py-3 transition-all duration-300 ${
          user && !user.isAnonymous && !isHeaderVisible ? "hidden" : ""
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <CheckSquare className="h-5 w-5 sm:h-8 sm:w-8 text-black dark:text-white" />
              <h1 className="text-xs sm:text-xl font-semibold text-black dark:text-white">
                Task Master Pro
              </h1>
            </div>

            {/* Navigation Tabs - Center */}
            <div className="flex-1 flex justify-center">
              <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger
                    value="tasks"
                    className="text-xs sm:text-sm px-1.5 sm:px-3"
                  >
                    <span className="hidden sm:inline">To Do List</span>
                    <span className="sm:hidden">Tasks</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="dashboard"
                    className="text-xs sm:text-sm px-1.5 sm:px-3"
                  >
                    <span className="hidden sm:inline">Time Tracking</span>
                    <span className="sm:hidden">Time</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="planning"
                    className="text-xs sm:text-sm px-1.5 sm:px-3"
                  >
                    <span className="hidden sm:inline">Planning</span>
                    <span className="sm:hidden">Plan</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Calendar/Journal toggle — visible only when Time Tracking active */}
              {activeTab === "dashboard" && (
                <div className="hidden sm:flex gap-0.5 bg-gray-100 dark:bg-gray-800 rounded-md p-0.5 ml-2">
                  <button
                    onClick={() => setDashboardViewMode("calendar")}
                    className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                      dashboardViewMode === "calendar"
                        ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                  >
                    <Calendar className="h-3 w-3" />
                    Calendar
                  </button>
                  <button
                    onClick={() => setDashboardViewMode("journal")}
                    className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                      dashboardViewMode === "journal"
                        ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                  >
                    <BookOpen className="h-3 w-3" />
                    Journal
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-1 sm:space-x-2">
              {user && !user.isAnonymous && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsHeaderVisible(false)}
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors lg:hidden"
                  title="Hide menu"
                >
                  <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-400" />
                </Button>
              )}

              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div
        className={`${user && !user.isAnonymous && !isHeaderVisible ? "h-screen" : "h-[calc(100vh-60px)]"} overflow-y-auto transition-all duration-300`}
      >
        <main className={`mx-auto px-2 md:px-4 py-2 md:py-3 ${activeTab === "planning" ? "" : "max-w-7xl"}`}>
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsContent value="tasks" className="mt-0">
              <div className="space-y-4">
                {/* Task Form - Desktop only */}
                <div className="hidden lg:block">
                  <TaskFormModal
                    isInline={true}
                    onSubmit={handleCreateTask}
                    isLoading={createTask.isPending}
                  />
                </div>

                {/* Tasks Section */}
                <div className="space-y-4">
                  {/* Main Tasks */}
                  <TaskTable
                    tasks={mainTasks}
                    onCompleteTask={handleCompleteTask}
                    onUndoCompletion={handleUndoCompletion}
                    onDeleteTask={handleDeleteTask}
                    onEditTask={handleEditTask}
                    onArchive={handleArchive}
                    onArchiveAllCompleted={handleArchiveAllCompleted}
                    onUpdateTask={handleUpdateTask}
                    onMoveToMain={handleMoveToMain}
                    onMoveToLater={handleMoveToLater}
                    totalScore={totalScore}
                    totalPossibleScore={totalPossibleScore}
                    totalEstimatedTime={totalEstimatedTime}
                    isAnonymous={!user || user.isAnonymous}
                  />

                  {/* Later Section */}
                  <LaterSection
                    tasks={laterTasks}
                    onMoveToMain={handleMoveToMain}
                    onDeleteTask={handleDeleteTask}
                    onEditTask={handleEditTask}
                    onUpdateTask={handleUpdateTask}
                    onMoveToLater={handleMoveToLater}
                    onCompleteTask={handleCompleteTask}
                    onUndoCompletion={handleUndoCompletion}
                    onArchiveTask={handleArchive}
                  />
                </div>
              </div>

              {/* Floating Add Button - Only on mobile/tablet */}
              <div className="lg:hidden">
                <FloatingAddButton
                  onSubmit={handleCreateTask}
                  isLoading={createTask.isPending}
                />
              </div>
            </TabsContent>

            <TabsContent value="dashboard" className="mt-0">
              <DashboardView viewMode={dashboardViewMode} onViewModeChange={setDashboardViewMode} />
            </TabsContent>

            <TabsContent value="planning" className="mt-0">
              <React.Suspense fallback={<div className="text-center py-12 text-gray-500">Loading planning view...</div>}>
                <PlanningView />
              </React.Suspense>
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

      {/* Data Transfer Dialog */}
      <DataTransferDialog />
    </div>
  );
}
