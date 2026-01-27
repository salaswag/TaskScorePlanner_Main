import * as React from "react";
const { useState } = React;
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, CheckCircle2, Circle } from "lucide-react";
import TaskFormModal from "./task-form-modal";

export function MindMapView() {
  const [nodes, setNodes] = useState([
    { id: 1, text: "Main Goal", x: 400, y: 300, completed: false, children: [2, 3] },
    { id: 2, text: "Sub Task 1", x: 200, y: 200, completed: false, children: [] },
    { id: 3, text: "Sub Task 2", x: 600, y: 200, completed: false, children: [] },
  ]);

  const toggleComplete = (id) => {
    setNodes(nodes.map(node => 
      node.id === id ? { ...node, completed: !node.completed } : node
    ));
  };

  return (
    <div className="w-full space-y-6">
      <div className="hidden lg:block">
        <TaskFormModal
          isInline={true}
          onSubmit={(data) => console.log("New node task:", data)}
          isLoading={false}
        />
      </div>

      <Card className="min-h-[600px] relative overflow-hidden bg-gray-50 dark:bg-gray-950 border-dashed border-2">
        <CardHeader>
          <CardTitle>Task Mind Map</CardTitle>
        </CardHeader>
        <CardContent className="h-full">
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none">
             Mind Map Canvas (Coming Soon: Drag & Drop, Hierarchy)
          </div>
          
          {nodes.map((node) => (
            <div
              key={node.id}
              className="absolute group transition-all"
              style={{ left: node.x, top: node.y }}
            >
              <div 
                className={`flex items-center gap-3 p-4 rounded-full shadow-lg border-2 bg-white dark:bg-gray-900 
                ${node.completed ? "border-green-500 opacity-75" : "border-blue-500"} 
                hover:scale-110 transition-transform cursor-pointer`}
              >
                <button onClick={() => toggleComplete(node.id)}>
                  {node.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-blue-500" />
                  )}
                </button>
                <span className={`font-medium ${node.completed ? "line-through text-gray-500" : ""}`}>
                  {node.text}
                </span>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
