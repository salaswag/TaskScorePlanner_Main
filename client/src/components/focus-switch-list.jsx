import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Edit, Trash2, GripVertical } from "lucide-react";

export default function FocusSwitchList({
  tasks,
  onMoveToMain,
  onDeleteTask,
  onEditTask,
  onAddToFocus,
  onReorder,
}) {
  const formatTime = (minutes) => {
    if (!minutes) return "-";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getPriorityColor = (priority) => {
    if (priority >= 8)
      return "border-red-200 text-red-600 bg-red-50 dark:bg-red-900/20";
    if (priority >= 5)
      return "border-yellow-200 text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20";
    return "border-green-200 text-green-600 bg-green-50 dark:bg-green-900/20";
  };

  const getPriorityBgColor = (priority) => {
    if (priority >= 8)
      return "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800";
    if (priority >= 5)
      return "bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800";
    return "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800";
  };

  return (
    <Card
      className="bg-blue-50/30 dark:bg-blue-900/20 shadow-sm border border-blue-200 dark:border-blue-700 border-dashed overflow-hidden"
      onDragOver={(e) => {
        e.preventDefault();
        e.currentTarget.classList.add("border-blue-400", "bg-blue-100/50");
      }}
      onDragLeave={(e) => {
        e.currentTarget.classList.remove("border-blue-400", "bg-blue-100/50");
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.currentTarget.classList.remove("border-blue-400", "bg-blue-100/50");

        try {
          const taskData = JSON.parse(e.dataTransfer.getData("text/plain"));
          if (taskData && taskData.id && !taskData.type) {
            onAddToFocus && onAddToFocus(taskData);
          }
        } catch (error) {
          console.error("Error parsing dropped task data:", error);
        }
      }}
    >
      <div className="px-4 py-3 border-b border-blue-200 dark:border-blue-700 border-dashed">
        <h3 className="text-sm font-medium text-blue-700 dark:text-blue-300">
          Focus Switch List
        </h3>
        <p className="text-xs text-blue-600 dark:text-blue-400">
          Drag tasks here to focus on them
        </p>
      </div>

      {/* Task Rows */}
      <div className="divide-y divide-blue-200 dark:divide-blue-700 divide-dashed max-h-96 overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="px-4 py-6 text-center text-blue-500 dark:text-blue-400">
            <p className="text-xs">Drag tasks here to focus</p>
          </div>
        ) : (
          tasks.map((task, index) => (
            <div
              key={
                task.focusId ||
                `focus-${task.id}-${index}-${Math.random().toString(36).substring(2, 11)}`
              }
              className={`px-4 py-4 transition-all duration-300 ease-in-out group border-l-4 ${getPriorityBgColor(task.priority)} hover:shadow-md transform hover:scale-[1.02]`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold border-2 flex-shrink-0 ${getPriorityColor(task.priority)}`}
                >
                  {task.priority}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-base font-medium text-gray-900 dark:text-gray-100 block leading-tight">
                    {task.title}
                  </span>
                </div>
                <div className="flex space-x-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditTask && onEditTask(task)}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1"
                    title="Edit Task"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteTask(task)}
                    className="text-red-500 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/20 px-2 py-1"
                    title="Remove from Focus"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}