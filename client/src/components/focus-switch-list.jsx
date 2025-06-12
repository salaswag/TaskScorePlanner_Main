
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Edit, Trash2, GripVertical } from "lucide-react";

export default function FocusSwitchList({ tasks, onMoveToMain, onDeleteTask, onEditTask, onAddToFocus }) {
  const formatTime = (minutes) => {
    if (!minutes) return "-";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getPriorityColor = (priority) => {
    if (priority >= 8) return "border-red-200 text-red-600";
    if (priority >= 5) return "border-yellow-200 text-yellow-600";
    return "border-green-200 text-green-600";
  };

  return (
    <Card 
      className="bg-blue-50/30 dark:bg-blue-900/20 shadow-sm border border-blue-200 dark:border-blue-700 border-dashed overflow-hidden"
      onDragOver={(e) => {
        e.preventDefault();
        e.currentTarget.classList.add('border-blue-400', 'bg-blue-100/50');
      }}
      onDragLeave={(e) => {
        e.currentTarget.classList.remove('border-blue-400', 'bg-blue-100/50');
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('border-blue-400', 'bg-blue-100/50');
        
        try {
          const taskData = JSON.parse(e.dataTransfer.getData('text/plain'));
          if (taskData && taskData.id) {
            onAddToFocus && onAddToFocus(taskData);
          }
        } catch (error) {
          console.error('Error parsing dropped task data:', error);
        }
      }}
    >
      <div className="px-4 py-3 border-b border-blue-200 dark:border-blue-700 border-dashed">
        <h3 className="text-sm font-medium text-blue-700 dark:text-blue-300">Focus Switch List</h3>
        <p className="text-xs text-blue-600 dark:text-blue-400">Drag tasks here to focus on them</p>
      </div>
      
      {/* Task Rows */}
      <div className="divide-y divide-blue-200 dark:divide-blue-700 divide-dashed max-h-96 overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="px-4 py-6 text-center text-blue-500 dark:text-blue-400">
            <p className="text-xs">Drag tasks here to focus</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div 
              key={`focus-${task.id}-${task.priority}-${task.title}`}
              className="px-4 py-2 hover:bg-blue-100/50 dark:hover:bg-blue-800/30 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <GripVertical className="h-3 w-3 text-blue-400 opacity-50 group-hover:opacity-100 cursor-grab active:cursor-grabbing flex-shrink-0" />
                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-medium border flex-shrink-0 ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
                <span className="text-xs text-blue-700 dark:text-blue-300 truncate flex-1 min-w-0">
                  {task.title}
                </span>
                <div className="flex items-center text-xs text-blue-500 dark:text-blue-400 flex-shrink-0">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>{formatTime(task.estimatedTime)}</span>
                </div>
                <div className="flex space-x-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditTask && onEditTask(task)}
                    className="text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800 text-xs px-1 py-0.5 h-5"
                    title="Edit Task"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteTask(task)}
                    className="text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/20 text-xs px-1 py-0.5 h-5"
                    title="Remove from Focus"
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
