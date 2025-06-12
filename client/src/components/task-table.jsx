import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, Edit, Trash2, Clock, CheckCircle, CheckSquare } from "lucide-react";

export default function TaskTable({ tasks, isLoading, onCompleteTask, onDeleteTask }) {
  const formatTime = (minutes) => {
    if (!minutes) return "-";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getPriorityColor = (priority) => {
    if (priority >= 8) return "bg-red-100 text-red-800";
    if (priority >= 5) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  if (isLoading) {
    return (
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading tasks...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-black">Tasks</h3>
      </div>
      
      {/* Table Header */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
          <div className="col-span-1">
            <Checkbox />
          </div>
          <div className="col-span-1">Priority</div>
          <div className="col-span-4">Task</div>
          <div className="col-span-2">Estimated Time</div>
          <div className="col-span-2">Actual Time</div>
          <div className="col-span-2">Actions</div>
        </div>
      </div>

      {/* Task Rows */}
      <div className="divide-y divide-gray-200">
        {tasks.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <CheckSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-400 mb-2">No tasks found</p>
            <p className="text-sm text-gray-400">Add a new task to get started!</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div 
              key={task.id} 
              className={`px-6 py-4 hover:bg-gray-50 transition-colors ${
                task.completed ? 'bg-green-50' : ''
              }`}
            >
              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-1">
                  <Checkbox 
                    checked={task.completed} 
                    disabled={task.completed}
                  />
                </div>
                <div className="col-span-1">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
                <div className="col-span-4">
                  <span className={`font-medium ${task.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                    {task.title}
                  </span>
                </div>
                <div className="col-span-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{formatTime(task.estimatedTime)} est.</span>
                  </div>
                </div>
                <div className="col-span-2">
                  {task.actualTime ? (
                    <div className="flex items-center text-sm text-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      <span>{formatTime(task.actualTime)} actual</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">-</span>
                  )}
                </div>
                <div className="col-span-2 flex space-x-2">
                  {task.completed ? (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Completed
                    </span>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onCompleteTask(task)}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        title="Complete Task"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                        title="Edit Task"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteTask(task)}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50"
                        title="Delete Task"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
