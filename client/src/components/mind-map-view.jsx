import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, CheckCircle2, Circle } from "lucide-react";
import TaskFormModal from "./task-form-modal";

export function MindMapView({ tasks, onUpdateTask, onCreateTask }) {
  // Use tasks from props for persistent data
  const handleToggleComplete = (task) => {
    onUpdateTask({ ...task, completed: !task.completed });
  };

  const handleDragStart = (e, task) => {
    e.dataTransfer.setData("application/json", JSON.stringify(task));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    try {
      const task = JSON.parse(e.dataTransfer.getData("application/json"));
      if (!task.isMindMapOnly) {
        onUpdateTask({ ...task, isMindMapOnly: true });
      }
    } catch (err) {
      console.error("Drop failed", err);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div className="w-full space-y-6">
      <div className="hidden lg:block">
        <TaskFormModal
          isInline={true}
          onSubmit={onCreateTask}
          isLoading={false}
        />
      </div>

      <Card 
        className="min-h-[600px] relative overflow-hidden bg-gray-50 dark:bg-gray-950 border-dashed border-2"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <CardHeader>
          <CardTitle>Task Mind Map</CardTitle>
          <p className="text-sm text-muted-foreground">Drag tasks here from "To Do" or add new ones below.</p>
        </CardHeader>
        <CardContent className="h-full relative">
          {tasks.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none">
               No tasks in Mind Map yet.
            </div>
          )}
          
          <div className="flex flex-wrap gap-6 p-8">
            {tasks.map((task, index) => {
               // Simple automatic positioning logic for "bubble" feel
               const angle = (index / tasks.length) * 2 * Math.PI;
               const radius = 150 + (index * 20);
               const x = index === 0 ? 0 : Math.cos(angle) * radius;
               const y = index === 0 ? 0 : Math.sin(angle) * radius;

               return (
                <div
                  key={task.id}
                  className="transition-all"
                >
                  <div 
                    className={`flex items-center gap-3 p-4 rounded-full shadow-lg border-2 bg-white dark:bg-gray-900 
                    ${task.completed ? "border-green-500 opacity-75" : "border-blue-500"} 
                    hover:scale-110 transition-transform cursor-pointer min-w-[150px]`}
                  >
                    <button onClick={() => handleToggleComplete(task)}>
                      {task.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-blue-500" />
                      )}
                    </button>
                    <span className={`font-medium ${task.completed ? "line-through text-gray-500" : ""}`}>
                      {task.title}
                    </span>
                  </div>
                </div>
               );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
