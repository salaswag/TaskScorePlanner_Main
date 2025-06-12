
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Edit, Trash2, ArrowUp } from "lucide-react";

export default function LaterSection({ tasks, onMoveToMain, onDeleteTask, onEditTask, onMoveToLater }) {
  const formatTime = (minutes) => {
    if (!minutes) return "-";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getPriorityColor = (priority) => {
    if (priority >= 8) return "border-red-200 text-red-400";
    if (priority >= 5) return "border-yellow-200 text-yellow-400";
    return "border-green-200 text-green-400";
  };

  return (
    <Card 
      className="bg-gray-50/50 dark:bg-gray-900/50 shadow-sm border border-gray-200 dark:border-gray-700 border-dashed overflow-hidden mt-4"
      onDragOver={(e) => {
        e.preventDefault();
        e.currentTarget.classList.add('border-blue-400', 'bg-blue-50/50');
      }}
      onDragLeave={(e) => {
        e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50/50');
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50/50');
        
        try {
          const taskData = JSON.parse(e.dataTransfer.getData('text/plain'));
          if (taskData && taskData.id) {
            onMoveToLater && onMoveToLater(taskData);
          }
        } catch (error) {
          console.error('Error parsing dropped task data:', error);
        }
      }}
    >
      <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 border-dashed">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Later (Not counted in score)</h3>
      </div>
      
      {/* Table Header */}
      <div className="px-6 py-2 bg-gray-100/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 border-dashed">
        <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 dark:text-gray-400">
          <div className="col-span-1">Priority</div>
          <div className="col-span-4">Task</div>
          <div className="col-span-3">Est Time</div>
          <div className="col-span-4">Actions</div>
        </div>
      </div>

      {/* Task Rows */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700 divide-dashed">
        {tasks.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-400 dark:text-gray-500">
            <p className="text-sm">Drag tasks here for later</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div 
              key={task.id} 
              className="px-6 py-3 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors opacity-60"
            >
              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-1">
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
                <div className="col-span-4">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {task.title}
                  </span>
                </div>
                <div className="col-span-3">
                  <div className="flex items-center text-xs text-gray-400">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{formatTime(task.estimatedTime)}</span>
                  </div>
                </div>
                <div className="col-span-4 flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onMoveToMain(task)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs px-2 py-1 h-6"
                    title="Move to Main"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditTask && onEditTask(task)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs px-2 py-1 h-6"
                    title="Edit Task"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteTask(task)}
                    className="text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/20 text-xs px-2 py-1 h-6"
                    title="Delete Task"
                  >
                    <Trash2 className="h-3 w-3" />
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
