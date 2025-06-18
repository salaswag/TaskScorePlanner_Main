import { useState } from "react";
import ScoreDisplay from "@/components/score-display";
import TaskForm from "@/components/task-form";
import TaskTable from "@/components/task-table";
import LaterSection from "@/components/later-section";
import TimelineSection from "@/components/timeline-section";
import TimerModal from "@/components/timer-modal";
import NotificationToast from "@/components/notification-toast";
import UserMenu from "@/components/user-menu";
import { useTasks } from "@/hooks/use-tasks";
import { useTimeline } from "@/hooks/use-timeline";
import { useTheme } from "@/components/theme-provider";
import { Moon, Sun, CheckSquare, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TodoApp() {
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const { tasks, isLoading, createTask, updateTask, deleteTask } = useTasks();
  const { events, isLoading: isTimelineLoading, createEvent, updateEvent, deleteEvent } = useTimeline();
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

  // Calculate statistics (only from main tasks)
  const completedTasks = mainTasks.filter((task) => task.completed) || [];
  const pendingTasks = mainTasks.filter((task) => !task.completed) || [];
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
      `Task "${task.title}" deleted successfully!`,
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
    // For now, just show a notification that edit functionality is coming
    showNotification("Edit functionality coming soon!", "info");
  };

  const handleMoveToLater = (task) => {
    updateTask.mutate({
      ...task,
      isLater: true,
    });
    showNotification(`Task "${task.title}" moved to Later section`, "success");
  };

  const handleMoveToMain = (task) => {
    updateTask.mutate({
      ...task,
      isLater: false,
    });
    showNotification(
      `Task "${task.title}" moved back to main tasks`,
      "success",
    );
  };

  

  const handleCreateTimelineEvent = (eventData) => {
    createEvent.mutate(eventData);
    showNotification(`Timeline event "${eventData.title}" created successfully!`, "success");
  };

  const handleUpdateTimelineEvent = (eventData) => {
    updateEvent.mutate(eventData);
    const action = eventData.completed ? "completed" : "updated";
    showNotification(`Timeline event "${eventData.title}" ${action}!`, "success");
  };

  const handleDeleteTimelineEvent = (eventId) => {
    const event = events.find(e => e.id === eventId);
    deleteEvent.mutate(eventId);
    showNotification(
      `Timeline event "${event?.title}" deleted successfully!`,
      "success",
      true,
      () => handleUndoTimelineDelete(event)
    );
  };

  const handleUndoTimelineDelete = (event) => {
    createEvent.mutate({
      title: event.title,
      description: event.description,
      dueDate: event.dueDate,
      priority: event.priority,
    });
    showNotification("Timeline event deletion undone", "success");
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Header */}
      <header className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CheckSquare className="h-8 w-8 text-black dark:text-white" />
            <h1 className="text-xl font-semibold text-black dark:text-white">
              Task Master Pro
            </h1>
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
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
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
                  onSubmit={(taskData) => {
                    createTask.mutate(taskData);
                    showNotification(
                      `Task "${taskData.title}" added successfully!`,
                      "success",
                    );
                  }}
                  isLoading={createTask.isPending}
                />
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
                />
              </div>
            </div>
          </div>
        </main>

        {/* Timeline Side Panel */}
        <TimelineSection
          events={events}
          onCreateEvent={handleCreateTimelineEvent}
          onUpdateEvent={handleUpdateTimelineEvent}
          onDeleteEvent={handleDeleteTimelineEvent}
          isLoading={isTimelineLoading}
        />
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
