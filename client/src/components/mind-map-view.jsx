import * as React from "react";
const { useState, useEffect } = React;
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, CheckCircle2, Circle, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function MindMapView() {
  const queryClient = useQueryClient();
  const [newTitle, setNewTitle] = useState("");
  const [selectedNode, setSelectedNode] = useState(null);

  const { data: nodes = [] } = useQuery({
    queryKey: ["/api/mind-map/nodes"],
  });

  const createMutation = useMutation({
    mutationFn: async (newNode) => {
      const res = await apiRequest("POST", "/api/mind-map/nodes", newNode);
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/mind-map/nodes"] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }) => {
      const res = await apiRequest("PATCH", `/api/mind-map/nodes/${id}`, data);
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/mind-map/nodes"] }),
  });

  const handleAddNode = (e, parentId = null) => {
    e?.preventDefault();
    const title = parentId ? "New Sub-task" : newTitle;
    if (parentId || title.trim()) {
      const parentNode = nodes.find(n => n.id === parentId);
      const newNode = {
        text: title.trim() || "New Task",
        parentId,
        x: parentNode ? parentNode.x + 150 : 400,
        y: parentNode ? parentNode.y + (Math.random() * 100 - 50) : 300,
        completed: false
      };
      createMutation.mutate(newNode);
      setNewTitle("");
    }
  };

  const toggleComplete = (node) => {
    updateMutation.mutate({ id: node.id, completed: !node.completed });
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-center">
        <form onSubmit={(e) => handleAddNode(e)} className="flex gap-2 w-full max-w-md">
          <Input 
            placeholder="Add main goal to mind map..." 
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={createMutation.isPending}>
            <Plus className="h-4 w-4 mr-2" />
            Add Goal
          </Button>
        </form>
      </div>

      <Card className="min-h-[700px] relative overflow-hidden bg-gray-50 dark:bg-gray-950 border-2">
        <CardHeader>
          <CardTitle>Task Mind Map</CardTitle>
          <p className="text-sm text-muted-foreground">Click a node to add a sub-task. Dragging is disabled for hierarchy view.</p>
        </CardHeader>
        <CardContent className="h-full relative p-0">
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {nodes.map(node => {
              if (!node.parentId) return null;
              const parent = nodes.find(n => n.id === node.parentId);
              if (!parent) return null;
              return (
                <line 
                  key={`line-${node.id}`}
                  x1={parent.x} y1={parent.y}
                  x2={node.x} y2={node.y}
                  stroke="currentColor" 
                  strokeWidth="2"
                  className="text-gray-300 dark:text-gray-700"
                />
              );
            })}
          </svg>

          {nodes.map((node) => (
            <div
              key={node.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
              style={{ left: node.x, top: node.y }}
            >
              <div 
                className={`flex items-center gap-2 p-3 px-4 rounded-full shadow-md border-2 bg-white dark:bg-gray-900 
                ${node.completed ? "border-green-500 opacity-75" : "border-blue-500"} 
                hover:scale-105 transition-all cursor-pointer min-w-[120px]`}
              >
                <button onClick={(e) => { e.stopPropagation(); toggleComplete(node); }}>
                  {node.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Circle className="h-4 w-4 text-blue-500" />
                  )}
                </button>
                <span className={`text-sm font-medium ${node.completed ? "line-through text-gray-500" : ""}`}>
                  {node.text}
                </span>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleAddNode(null, node.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-opacity"
                >
                  <Plus className="h-3 w-3 text-blue-500" />
                </button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
