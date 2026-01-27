import * as React from "react";
const { useState, useEffect, useRef, useCallback } = React;
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, CheckCircle2, Circle, Target, Trash2, Edit2, X, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const springPhysics = (current, target, velocity, stiffness = 0.12, damping = 0.75) => {
  const force = (target - current) * stiffness;
  const newVelocity = (velocity + force) * damping;
  const newPosition = current + newVelocity;
  return { position: newPosition, velocity: newVelocity };
};

function DraggableNode({ 
  node, 
  nodes, 
  onDrag, 
  onAddSubtask, 
  onToggleComplete, 
  onDelete,
  onEditText,
  onAutoRearrange,
  isGoal 
}) {
  const nodeRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [jellyOffset, setJellyOffset] = useState({ x: 0, y: 0 });
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });
  const [showPlusButtons, setShowPlusButtons] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(node.text);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!isDragging && (Math.abs(jellyOffset.x) > 0.5 || Math.abs(jellyOffset.y) > 0.5 || 
        Math.abs(velocity.x) > 0.5 || Math.abs(velocity.y) > 0.5)) {
      const animate = () => {
        setJellyOffset(prev => {
          const xResult = springPhysics(prev.x, 0, velocity.x);
          const yResult = springPhysics(prev.y, 0, velocity.y);
          setVelocity({ x: xResult.velocity, y: yResult.velocity });
          
          if (Math.abs(xResult.position) < 0.5 && Math.abs(yResult.position) < 0.5 &&
              Math.abs(xResult.velocity) < 0.5 && Math.abs(yResult.velocity) < 0.5) {
            return { x: 0, y: 0 };
          }
          return { x: xResult.position, y: yResult.position };
        });
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isDragging, velocity.x, velocity.y]);

  const handleMouseDown = (e) => {
    if (isEditing) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    const parentRect = nodeRef.current?.parentElement?.getBoundingClientRect();
    if (!parentRect) return;
    setDragOffset({
      x: e.clientX - (node.x + parentRect.left),
      y: e.clientY - (node.y + parentRect.top)
    });
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    const parentRect = nodeRef.current?.parentElement?.getBoundingClientRect();
    if (!parentRect) return;
    
    const newX = e.clientX - dragOffset.x - parentRect.left;
    const newY = e.clientY - dragOffset.y - parentRect.top;
    
    const boundedX = Math.max(80, Math.min(parentRect.width - 80, newX));
    const boundedY = Math.max(50, Math.min(parentRect.height - 50, newY));
    
    const dx = boundedX - node.x;
    const dy = boundedY - node.y;
    setJellyOffset({ x: dx * 0.4, y: dy * 0.4 });
    setVelocity({ x: dx * 0.15, y: dy * 0.15 });
    
    onDrag(node.id, boundedX, boundedY);
  }, [isDragging, dragOffset, node, onDrag]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleTouchStart = (e) => {
    if (isEditing) return;
    e.stopPropagation();
    const touch = e.touches[0];
    setIsDragging(true);
    const parentRect = nodeRef.current?.parentElement?.getBoundingClientRect();
    if (!parentRect) return;
    setDragOffset({
      x: touch.clientX - (node.x + parentRect.left),
      y: touch.clientY - (node.y + parentRect.top)
    });
  };

  const handleTouchMove = useCallback((e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const parentRect = nodeRef.current?.parentElement?.getBoundingClientRect();
    if (!parentRect) return;
    
    const newX = touch.clientX - dragOffset.x - parentRect.left;
    const newY = touch.clientY - dragOffset.y - parentRect.top;
    
    const boundedX = Math.max(80, Math.min(parentRect.width - 80, newX));
    const boundedY = Math.max(50, Math.min(parentRect.height - 50, newY));
    
    const dx = boundedX - node.x;
    const dy = boundedY - node.y;
    setJellyOffset({ x: dx * 0.4, y: dy * 0.4 });
    setVelocity({ x: dx * 0.15, y: dy * 0.15 });
    
    onDrag(node.id, boundedX, boundedY);
  }, [isDragging, dragOffset, node, onDrag]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('touchmove', handleTouchMove, { passive: true });
      window.addEventListener('touchend', handleMouseUp);
      return () => {
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleMouseUp);
      };
    }
  }, [isDragging, handleTouchMove, handleMouseUp]);

  const handleSaveEdit = () => {
    if (editText.trim()) {
      onEditText(node.id, editText.trim());
    }
    setIsEditing(false);
  };

  const plusButtonPositions = [
    { angle: 0, label: 'right' },
    { angle: 90, label: 'bottom' },
    { angle: 180, label: 'left' },
    { angle: 270, label: 'top' },
  ];

  const jellyScale = isDragging ? 1.08 : 1 + Math.abs(jellyOffset.x + jellyOffset.y) * 0.002;
  const jellyRotate = jellyOffset.x * 0.15;
  const jellySkew = jellyOffset.y * 0.05;

  return (
    <div
      ref={nodeRef}
      className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
      style={{ 
        left: node.x + jellyOffset.x, 
        top: node.y + jellyOffset.y,
        zIndex: isDragging ? 100 : (isGoal ? 10 : 5),
        cursor: isEditing ? 'text' : (isDragging ? 'grabbing' : 'grab'),
      }}
      onMouseEnter={() => setShowPlusButtons(true)}
      onMouseLeave={() => {
        if (!isDragging) {
          // Add a small delay to allow moving mouse to the buttons
          setTimeout(() => {
            if (nodeRef.current && !nodeRef.current.matches(':hover')) {
              setShowPlusButtons(false);
            }
          }, 300);
        }
      }}
    >
      <div className="absolute inset-[-40px] pointer-events-none group-hover:pointer-events-auto" />
      {showPlusButtons && !isEditing && plusButtonPositions.map(({ angle, label }, index) => {
        const radiusX = isGoal ? 85 : 70;
        const radiusY = isGoal ? 45 : 35;
        const rad = (angle * Math.PI) / 180;
        const btnX = Math.cos(rad) * radiusX;
        const btnY = Math.sin(rad) * radiusY;
        
        return (
          <button
            key={label}
            onClick={(e) => {
              e.stopPropagation();
              onAddSubtask(node.id, angle);
            }}
            className="absolute w-6 h-6 rounded-full bg-white/80 hover:bg-white
              text-blue-500 shadow-sm flex items-center justify-center transition-all duration-300 hover:scale-125 z-20
              opacity-0 group-hover:opacity-100 border border-blue-200"
            style={{
              left: `calc(50% + ${btnX}px)`,
              top: `calc(50% + ${btnY}px)`,
              transform: 'translate(-50%, -50%)',
              animation: `popIn 0.3s ease-out forwards`,
              animationDelay: `${index * 50}ms`,
            }}
            title={`Add task ${label}`}
          >
            <Plus className="h-3 w-3" />
          </button>
        );
      })}

      <div 
        className={`flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl border-2 backdrop-blur-sm
          ${isGoal 
            ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 border-white/30 text-white min-w-[150px]' 
            : node.completed 
              ? 'bg-white/50 dark:bg-gray-800/50 border-gray-300 opacity-60' 
              : 'bg-white/90 dark:bg-gray-900/90 border-blue-300 hover:border-blue-500'
          }
          transition-all duration-200`}
        style={{
          transform: `scale(${jellyScale}) rotate(${jellyRotate}deg) skewX(${jellySkew}deg)`,
          transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
          boxShadow: isDragging 
            ? `0 25px 50px rgba(0,0,0,0.25), 0 0 0 3px ${isGoal ? 'rgba(168, 85, 247, 0.5)' : 'rgba(59, 130, 246, 0.5)'}` 
            : isGoal
              ? '0 8px 30px rgba(168, 85, 247, 0.3), 0 4px 15px rgba(236, 72, 153, 0.2)'
              : '0 4px 20px rgba(0,0,0,0.1)',
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {isGoal ? (
          <Target className="h-5 w-5 text-white flex-shrink-0 animate-pulse" />
        ) : (
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              onToggleComplete(node); 
            }}
            className="flex-shrink-0 transition-transform hover:scale-110"
          >
            {node.completed ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <Circle className="h-5 w-5 text-blue-400 hover:text-blue-600" />
            )}
          </button>
        )}
        
        {isEditing ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit();
                if (e.key === 'Escape') setIsEditing(false);
              }}
              className={`${isGoal ? 'text-lg' : 'text-sm'} font-medium bg-transparent border-b border-current outline-none w-32`}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
            <button onClick={(e) => { e.stopPropagation(); handleSaveEdit(); }} className="p-0.5">
              <Check className="h-4 w-4" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setIsEditing(false); }} className="p-0.5">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <span 
            className={`${isGoal ? 'text-lg py-1' : 'text-sm'} font-medium truncate max-w-[150px] ${
              node.completed && !isGoal ? 'line-through text-gray-500' : ''
            } ${isGoal ? 'text-white font-bold tracking-tight' : ''}`}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setEditText(node.text);
              setIsEditing(true);
            }}
          >
            {node.text}
          </span>
        )}

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isEditing && (
            <button 
              onClick={(e) => { 
                e.stopPropagation();
                setEditText(node.text);
                setIsEditing(true);
              }}
              className={`p-1 rounded-full transition-colors flex-shrink-0
                ${isGoal ? 'hover:bg-white/20' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              title="Edit"
            >
              <Edit2 className={`h-3 w-3 ${isGoal ? 'text-white' : 'text-gray-500'}`} />
            </button>
          )}
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              onDelete(node.id); 
            }}
            className={`p-1 rounded-full transition-colors flex-shrink-0
              ${isGoal ? 'hover:bg-white/20' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            title="Delete"
          >
            <Trash2 className={`h-3 w-3 ${isGoal ? 'text-white' : 'text-red-500'}`} />
          </button>
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              onAutoRearrange(node.id);
            }}
            className={`p-1 rounded-full transition-colors flex-shrink-0
              ${isGoal ? 'hover:bg-white/20' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            title="Rearrange Branch"
          >
            <Plus className={`h-3 w-3 ${isGoal ? 'text-white' : 'text-blue-500'} rotate-45`} />
          </button>
        </div>
      </div>
    </div>
  );
}

function FloatingParticle({ delay, size, left, top }) {
  return (
    <div 
      className="absolute rounded-full bg-gradient-to-br from-purple-400/20 to-pink-400/20 pointer-events-none"
      style={{
        width: size,
        height: size,
        left: `${left}%`,
        top: `${top}%`,
        animation: `float ${8 + delay}s ease-in-out infinite ${delay}s`,
      }}
    />
  );
}

const particleConfigs = [
  { size: 60, left: 15, top: 25 },
  { size: 45, left: 75, top: 20 },
  { size: 35, left: 85, top: 55 },
  { size: 50, left: 25, top: 70 },
  { size: 40, left: 60, top: 80 },
  { size: 55, left: 45, top: 40 },
];

export function MindMapView() {
  const queryClient = useQueryClient();
  const [newTitle, setNewTitle] = useState("");
  const canvasRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const updateSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setCanvasSize({ width: rect.width, height: rect.height });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const { data: nodes = [] } = useQuery({
    queryKey: ["/api/mind-map/nodes"],
  });

  const createMutation = useMutation({
    mutationFn: async (newNode) => {
      const res = await apiRequest("/api/mind-map/nodes", {
        method: "POST",
        body: JSON.stringify(newNode)
      });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/mind-map/nodes"] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }) => {
      const res = await apiRequest(`/api/mind-map/nodes/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data)
      });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/mind-map/nodes"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await apiRequest(`/api/mind-map/nodes/${id}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/mind-map/nodes"] }),
  });

  const handleAddGoal = (e) => {
    e?.preventDefault();
    if (newTitle.trim()) {
      const goalNodes = nodes.filter(n => !n.parentId);
      const spacing = 250;
      const startX = canvasSize.width / 2;
      const startY = 120;
      
      const angle = goalNodes.length * 0.8;
      const radius = 100 + goalNodes.length * 80;
      
      const xOffset = Math.cos(angle) * radius * 0.5;
      const yOffset = Math.abs(Math.sin(angle)) * 100 + (Math.floor(goalNodes.length / 3) * 150);
      
      const newNode = {
        text: newTitle.trim(),
        parentId: null,
        x: Math.max(120, Math.min(canvasSize.width - 120, startX + xOffset)),
        y: Math.max(100, startY + yOffset),
        completed: false,
        isGoal: true
      };
      createMutation.mutate(newNode);
      setNewTitle("");
    }
  };

  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleZoom = (delta) => {
    setZoom(prev => Math.max(0.2, Math.min(3, prev + delta)));
  };

  const handleAddSubtask = (parentId, angle) => {
    const text = window.prompt("What should the task be?");
    if (!text) return;

    const parentNode = nodes.find(n => n.id === parentId);
    if (!parentNode) return;

    const existingChildren = nodes.filter(n => n.parentId === parentId);
    const radius = 130 + existingChildren.length * 20;
    const angleOffset = existingChildren.length * 15;
    const finalAngle = angle + angleOffset;
    
    const rad = (finalAngle * Math.PI) / 180;
    const newX = parentNode.x + Math.cos(rad) * radius;
    const newY = parentNode.y + Math.sin(rad) * radius;

    const boundedX = Math.max(100, Math.min(canvasSize.width - 100, newX));
    const boundedY = Math.max(80, Math.min(canvasSize.height - 80, newY));

    const newNode = {
      text: text,
      parentId,
      x: boundedX,
      y: boundedY,
      completed: false,
      isGoal: false
    };
    createMutation.mutate(newNode);
  };

  const handleAutoRearrange = (parentId) => {
    const children = nodes.filter(n => n.parentId === parentId);
    if (children.length === 0) return;

    const parent = nodes.find(n => n.id === parentId);
    if (!parent) return;

    const radius = 150;
    children.forEach((child, index) => {
      const angle = (index / children.length) * 2 * Math.PI;
      const x = parent.x + Math.cos(angle) * radius;
      const y = parent.y + Math.sin(angle) * radius;
      updateMutation.mutate({ id: child.id, x, y });
    });
  };

  const handleDrag = (id, x, y) => {
    updateMutation.mutate({ id, x, y });
  };

  const toggleComplete = (node) => {
    updateMutation.mutate({ id: node.id, completed: !node.completed });
  };

  const handleEditText = (id, text) => {
    updateMutation.mutate({ id, text });
  };

  const handleDelete = (id) => {
    const childNodes = nodes.filter(n => n.parentId === id);
    childNodes.forEach(child => {
      const grandChildren = nodes.filter(n => n.parentId === child.id);
      grandChildren.forEach(gc => deleteMutation.mutate(gc.id));
      deleteMutation.mutate(child.id);
    });
    deleteMutation.mutate(id);
  };

  const goalNodes = nodes.filter(n => !n.parentId || n.isGoal);
  const taskNodes = nodes.filter(n => n.parentId && !n.isGoal);

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-center">
        <form onSubmit={handleAddGoal} className="flex gap-3 w-full max-w-xl">
          <div className="relative flex-1">
            <Target className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-purple-500" />
            <Input 
              placeholder="What's your big goal?" 
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="pl-12 h-12 text-lg border-2 border-purple-200 focus:border-purple-500 focus:ring-purple-500 rounded-xl shadow-sm"
            />
          </div>
          <Button 
            type="submit" 
            disabled={createMutation.isPending || !newTitle.trim()}
            className="h-12 px-6 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 hover:from-purple-600 hover:via-pink-600 hover:to-rose-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Goal
          </Button>
        </form>
      </div>

      <Card className="min-h-[700px] relative overflow-hidden border-2 border-purple-100 dark:border-purple-900/50">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30 dark:from-gray-950 dark:via-purple-950/20 dark:to-pink-950/20" />
        
        {particleConfigs.map((config, i) => (
          <FloatingParticle key={i} delay={i * 1.5} {...config} />
        ))}

        <div className="absolute top-4 right-4 flex flex-col gap-2 z-50">
          <Button 
            variant="secondary" 
            size="icon" 
            onClick={() => handleZoom(0.1)}
            className="rounded-full shadow-md bg-white/80 backdrop-blur-sm"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button 
            variant="secondary" 
            size="icon" 
            onClick={() => handleZoom(-0.1)}
            className="rounded-full shadow-md bg-white/80 backdrop-blur-sm"
          >
            <X className="h-4 w-4 rotate-45" />
          </Button>
        </div>

        <CardContent ref={canvasRef} className="h-[650px] relative p-0 overflow-hidden pt-4">
          <div 
            className="h-[650px] relative p-0 overflow-hidden pt-4"
            style={{ 
              transform: `scale(${zoom}) translate(${offset.x}px, ${offset.y}px)`,
              transformOrigin: 'center center',
              transition: 'transform 0.2s ease-out'
            }}
          >
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#EC4899" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#F43F5E" stopOpacity="0.8" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            {nodes.map(node => {
              if (!node.parentId) return null;
              const parent = nodes.find(n => n.id === node.parentId);
              if (!parent) return null;
              
              const dx = node.x - parent.x;
              const dy = node.y - parent.y;
              const midX = (parent.x + node.x) / 2;
              const midY = (parent.y + node.y) / 2;
              const curvature = Math.min(Math.abs(dx), Math.abs(dy)) * 0.3;
              const controlY = midY - curvature;
              
              return (
                <g key={`line-${node.id}`}>
                  <path 
                    d={`M ${parent.x} ${parent.y} Q ${midX} ${controlY} ${node.x} ${node.y}`}
                    fill="none"
                    stroke="url(#lineGradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    filter="url(#glow)"
                    className="transition-all duration-300"
                    style={{ opacity: node.completed ? 0.4 : 1 }}
                  />
                  <circle 
                    cx={midX} 
                    cy={(controlY + midY) / 2} 
                    r="4" 
                    fill="url(#lineGradient)"
                    className="animate-pulse"
                    style={{ opacity: node.completed ? 0.3 : 0.6 }}
                  />
                </g>
              );
            })}
          </svg>

          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 z-10">
              <div className="text-center animate-float">
                <Target className="h-16 w-16 mx-auto mb-4 text-purple-300 animate-pulse" />
                <p className="text-lg font-semibold text-gray-500 dark:text-gray-400">No goals yet</p>
                <p className="text-sm mt-1 text-gray-400">Add your first goal above to get started!</p>
              </div>
            </div>
          )}

          {goalNodes.map((node) => (
            <DraggableNode
              key={node.id}
              node={node}
              nodes={nodes}
              onDrag={handleDrag}
              onAddSubtask={handleAddSubtask}
              onToggleComplete={toggleComplete}
              onDelete={handleDelete}
              onEditText={handleEditText}
              onAutoRearrange={handleAutoRearrange}
              isGoal={true}
            />
          ))}

          {taskNodes.map((node) => (
            <DraggableNode
              key={node.id}
              node={node}
              nodes={nodes}
              onDrag={handleDrag}
              onAddSubtask={handleAddSubtask}
              onToggleComplete={toggleComplete}
              onDelete={handleDelete}
              onEditText={handleEditText}
              onAutoRearrange={handleAutoRearrange}
              isGoal={false}
            />
          ))}
          </div>
        </CardContent>
        
        <div className="absolute bottom-2 left-0 right-0 text-center z-10">
          <p className="text-xs text-muted-foreground/60">
            Drag to move nodes. Hover for add buttons. Double-click to edit.
          </p>
        </div>
      </Card>

      <style>{`
        @keyframes popIn {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0); }
          70% { transform: translate(-50%, -50%) scale(1.2); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-10px) rotate(2deg); }
          50% { transform: translateY(-5px) rotate(0deg); }
          75% { transform: translateY(-15px) rotate(-2deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
