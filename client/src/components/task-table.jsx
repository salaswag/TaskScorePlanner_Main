import React, { useState, useMemo, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  Check, Edit, Trash2, Clock, CheckCircle, CheckSquare, GripVertical,
  MoreHorizontal, ChevronDown, ChevronRight, Archive, ListPlus, Plus,
  Brain, Coffee, X, FolderPlus, Folder, Pencil, Rows3, Rows4, ArrowDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InlineCompletionPanel } from "./timer-modal";

// Work type badge component
function WorkTypeBadge({ workType }) {
  if (!workType) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
      workType === 'deep'
        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
    }`}>
      {workType === 'deep' ? <Brain className="h-3 w-3" /> : <Coffee className="h-3 w-3" />}
      {workType === 'deep' ? 'Deep' : 'Shallow'}
    </span>
  );
}

// Subtask progress indicator
function SubtaskProgress({ subtasks }) {
  if (!subtasks || subtasks.length === 0) return null;
  const done = subtasks.filter(s => s.completed).length;
  const total = subtasks.length;
  const remainingTime = subtasks
    .filter(s => !s.completed && s.estimatedTime)
    .reduce((sum, s) => sum + s.estimatedTime, 0);

  return (
    <span className="inline-flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 ml-1">
      <ListPlus className="h-3 w-3" />
      {done}/{total}
      {remainingTime > 0 && (
        <span className="text-gray-400">
          ({remainingTime >= 60 ? `${Math.floor(remainingTime / 60)}h ${remainingTime % 60}m` : `${remainingTime}m`})
        </span>
      )}
    </span>
  );
}

// Inline subtask input
function SubtaskInput({ onAdd }) {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState(null);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (title.trim()) {
      onAdd(title.trim(), time ? Number(time) : null);
      setTitle("");
      setTime(null);
    }
  };

  const formatTime = (m) => {
    if (!m) return "";
    return m >= 60 ? `${Math.floor(m/60)}h${m%60 ? ` ${m%60}m` : ''}` : `${m}m`;
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-3">
      <input
        type="text"
        placeholder="Add subtask..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="flex-1 min-w-0 px-3 py-1.5 text-sm rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:focus:border-blue-400 placeholder:text-gray-400 dark:placeholder:text-gray-500"
      />
      <div className="flex items-center gap-1.5 shrink-0" onMouseDown={(e) => e.stopPropagation()} onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}>
        <Clock className="h-3 w-3 text-gray-400" />
        <input
          type="range"
          min="5"
          max="120"
          step="5"
          value={time || 30}
          onChange={(e) => setTime(Number(e.target.value))}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="slider w-20 cursor-pointer"
        />
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-8 text-right whitespace-nowrap">
          {time ? formatTime(time) : "—"}
        </span>
      </div>
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        disabled={!title.trim()}
        className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1 h-7 shrink-0"
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </form>
  );
}

// Subtask section component
function SubtaskSection({ task, onUpdateTask }) {
  const subtasks = task.subtasks || [];

  // Auto-bump parent estimated time if subtask total exceeds it
  const syncEstimatedTime = (updatedSubtasks, taskObj) => {
    const subtaskTotal = updatedSubtasks
      .filter(s => s.estimatedTime)
      .reduce((sum, s) => sum + s.estimatedTime, 0);
    if (subtaskTotal > (taskObj.estimatedTime || 0)) {
      return { ...taskObj, subtasks: updatedSubtasks, estimatedTime: subtaskTotal };
    }
    return { ...taskObj, subtasks: updatedSubtasks };
  };

  const handleAdd = (title, estimatedTime) => {
    const newSubtask = {
      id: crypto.randomUUID(),
      title,
      completed: false,
      estimatedTime: estimatedTime,
    };
    const newSubtasks = [...subtasks, newSubtask];
    onUpdateTask(syncEstimatedTime(newSubtasks, task));
  };

  const handleToggle = (subtaskId, completed) => {
    const updated = subtasks.map(s =>
      s.id === subtaskId ? { ...s, completed } : s
    );
    onUpdateTask({ ...task, subtasks: updated });
  };

  const handleDelete = (subtaskId) => {
    const updated = subtasks.filter(s => s.id !== subtaskId);
    onUpdateTask(syncEstimatedTime(updated, task));
  };

  const formatSubTime = (minutes) => {
    if (!minutes) return null;
    if (minutes >= 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  return (
    <div className="mt-2 pl-3 border-l-2 border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 rounded-r-lg py-2 pr-3 ml-4 lg:ml-[11rem]">
      {subtasks.map((sub, idx) => (
        <div key={sub.id} className={`flex items-center gap-2 py-1.5 group/sub hover:bg-gray-100/50 dark:hover:bg-gray-800/30 rounded px-1 ${
          idx < subtasks.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''
        }`}>
          <Checkbox
            checked={sub.completed}
            onCheckedChange={(checked) => handleToggle(sub.id, Boolean(checked))}
            className="w-4 h-4 flex-shrink-0"
          />
          <span className={`text-sm flex-1 ${
            sub.completed
              ? 'line-through text-gray-400 dark:text-gray-500'
              : 'text-gray-700 dark:text-gray-300'
          }`}>
            {sub.title}
          </span>
          {sub.estimatedTime && (
            <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-0.5">
              <Clock className="h-3 w-3" />
              {formatSubTime(sub.estimatedTime)}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(sub.id)}
            className="opacity-0 group-hover/sub:opacity-100 text-gray-400 hover:text-red-500 px-1 py-0 h-5 transition-opacity"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
      <SubtaskInput onAdd={handleAdd} />
    </div>
  );
}

export { WorkTypeBadge, SubtaskProgress, SubtaskSection };

const TASK_GRID = "grid-cols-[7.5rem_3.5rem_1fr_5rem_5rem_5rem_5rem]";

export default function TaskTable({
  tasks,
  isLoading,
  onCompleteTask,
  onDeleteTask,
  onEditTask,
  onUpdateTask,
  onUndoCompletion,
  onArchive,
  onArchiveAllCompleted,
  onMoveToMain,
  onMoveToLater,
  totalScore,
  totalPossibleScore,
  totalEstimatedTime,
  isAnonymous = false,
  categories = [],
  onCreateCategory,
  onDeleteCategory,
  onRenameCategory,
  onMoveCategoryToLater,
  viewDensity = 'extended',
  onToggleDensity,
  layoutWidth = 'compact',
  onToggleLayout,
}) {
  const isCompact = viewDensity === 'compact';
  const [expandedTasks, setExpandedTasks] = useState(new Set());
  const [expandedSubtasks, setExpandedSubtasks] = useState(new Set());
  const [completingTaskId, setCompletingTaskId] = useState(null);
  const [collapsedCategories, setCollapsedCategories] = useState(new Set());
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [renamingCategoryId, setRenamingCategoryId] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  // Track which task IDs we've already auto-expanded so we don't re-open after user closes
  const autoExpandedRef = useRef(new Set());

  // Auto-expand subtasks for tasks that have them (only on first appearance)
  useEffect(() => {
    if (!tasks || tasks.length === 0) return;
    const newExpanded = new Set(expandedSubtasks);
    let changed = false;
    for (const task of tasks) {
      if (task.subtasks && task.subtasks.length > 0 && !autoExpandedRef.current.has(task.id)) {
        newExpanded.add(task.id);
        autoExpandedRef.current.add(task.id);
        changed = true;
      }
    }
    if (changed) setExpandedSubtasks(newExpanded);
  }, [tasks]);

  const toggleExpanded = (taskId) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const toggleSubtasks = (taskId) => {
    const newExpanded = new Set(expandedSubtasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedSubtasks(newExpanded);
  };

  const formatTime = (minutes) => {
    if (!minutes) return "-";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getPriorityColor = (priority, isCompleted = false) => {
    if (isCompleted) {
      if (priority >= 8) return "bg-red-200 text-red-900";
      if (priority >= 5) return "bg-yellow-200 text-yellow-900";
      return "bg-green-200 text-green-900";
    }
    if (priority >= 8) return "bg-red-100 text-red-800";
    if (priority >= 5) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const getDistractionColor = (level) => {
    if (!level) return '';
    const colors = [
      'text-green-600', // 1
      'text-green-500', // 2
      'text-yellow-500', // 3
      'text-orange-500', // 4
      'text-red-500'    // 5
    ];
    return colors[level - 1];
  };

  const getDistractionBackgroundColor = (level) => {
    if (!level) return '';
    const colors = [
      'bg-green-50 dark:bg-green-900/20', // 1
      'bg-green-50 dark:bg-green-900/20', // 2
      'bg-yellow-50 dark:bg-yellow-900/20', // 3
      'bg-orange-50 dark:bg-orange-900/20', // 4
      'bg-red-50 dark:bg-red-900/20'    // 5
    ];
    return colors[level - 1];
  };

  const getScoreColor = (percent) => {
    if (percent >= 80) return "text-green-600 dark:text-green-400";
    if (percent >= 60) return "text-yellow-600 dark:text-yellow-400";
    if (percent >= 40) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  // Sort tasks: incomplete first (by priority desc), then completed at the bottom (by completion time desc)
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed && !b.completed) return 1;
    if (!a.completed && b.completed) return -1;

    // If both completed, sort by completion time (most recent first)
    if (a.completed && b.completed) {
      if (a.completedAt && b.completedAt) {
        return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
      }
    }

    // If both incomplete, sort by priority (highest first)
    if (!a.completed && !b.completed) {
      return (b.priority || 0) - (a.priority || 0);
    }

    return 0;
  });

  const completedCount = tasks.filter(t => t.completed).length;

  const toggleCategory = (catName) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(catName)) next.delete(catName);
      else next.add(catName);
      return next;
    });
  };

  const handleCreateCategory = () => {
    if (newCategoryName.trim() && onCreateCategory) {
      onCreateCategory({ name: newCategoryName.trim() });
      setNewCategoryName("");
      setShowNewCategoryInput(false);
    }
  };

  const handleRenameCategory = (catId) => {
    if (renameValue.trim() && onRenameCategory) {
      onRenameCategory({ id: catId, name: renameValue.trim() });
      setRenamingCategoryId(null);
      setRenameValue("");
    }
  };

  // Group tasks by category
  const categoryGroups = useMemo(() => {
    const uncategorized = sortedTasks.filter(t => !t.category);
    const groups = [];

    // Order categories by their order field
    const orderedCats = [...categories].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    for (const cat of orderedCats) {
      const catTasks = sortedTasks.filter(t => t.category === cat.name);
      if (catTasks.length > 0) {
        groups.push({ ...cat, tasks: catTasks });
      } else {
        // Show empty categories too so user can drag tasks into them
        groups.push({ ...cat, tasks: [] });
      }
    }

    return { uncategorized, groups };
  }, [sortedTasks, categories]);

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
    <Card
      className="bg-white dark:bg-black shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden transition-colors"
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        e.currentTarget.classList.add('border-green-400', 'bg-green-50/50', 'dark:bg-green-900/20');
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          e.currentTarget.classList.remove('border-green-400', 'bg-green-50/50', 'dark:bg-green-900/20');
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('border-green-400', 'bg-green-50/50', 'dark:bg-green-900/20');

        try {
          const taskData = JSON.parse(e.dataTransfer.getData('text/plain'));
          console.log('Dropped task data to main:', taskData);
          if (taskData && taskData.id && taskData.isLater && !taskData.completed) {
            onMoveToMain && onMoveToMain(taskData);
          }
        } catch (error) {
          console.error('Error parsing dropped task data:', error);
        }
      }}
    >
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-black z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg sm:text-xl font-semibold text-black dark:text-white">Main Tasks</h3>
            {onCreateCategory && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNewCategoryInput(prev => !prev)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 px-1.5 py-1 h-7"
                title="New Category"
              >
                <FolderPlus className="h-4 w-4" />
              </Button>
            )}
            {onToggleDensity && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleDensity}
                className={`px-1.5 py-1 h-7 transition-colors ${
                  isCompact
                    ? 'text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300'
                    : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
                }`}
                title={isCompact ? 'Switch to Extended view' : 'Switch to Compact view'}
              >
                {isCompact ? <Rows4 className="h-4 w-4" /> : <Rows3 className="h-4 w-4" />}
              </Button>
            )}
          </div>

          {/* Score Display + Archive Done */}
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-end divide-x divide-gray-300 dark:divide-gray-600">
              {/* Score Fraction */}
              <div className="text-center px-3">
                <div className={`text-lg sm:text-xl font-bold ${getScoreColor(totalPossibleScore > 0 ? Math.round((totalScore / totalPossibleScore) * 100) : 0)}`}>
                  {totalScore} / {totalPossibleScore}
                </div>
              </div>

              {/* Percentage */}
              <div className="text-center px-3">
                <div className={`text-lg sm:text-xl font-bold ${getScoreColor(totalPossibleScore > 0 ? Math.round((totalScore / totalPossibleScore) * 100) : 0)}`}>
                  {totalPossibleScore > 0 ? Math.round((totalScore / totalPossibleScore) * 100) : 0}%
                </div>
              </div>

              {/* Time Left */}
              <div className="text-center px-3">
                <div className="text-xs sm:text-sm font-medium text-black dark:text-white">
                  {formatTime(totalEstimatedTime)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Time Left
                </div>
              </div>
            </div>

            {/* Archive All Completed Button */}
            {completedCount > 0 && onArchiveAllCompleted && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onArchiveAllCompleted}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 h-8 border border-gray-300 dark:border-gray-600"
                title={isAnonymous ? "Clear all completed tasks" : "Archive all completed tasks"}
              >
                <Archive className="h-3.5 w-3.5 mr-1" />
                <span className="hidden sm:inline text-xs">
                  {isAnonymous ? "Clear Done" : "Archive Done"}
                </span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Table Header - Only visible on larger screens */}
      <div className="hidden lg:block px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-[65px] z-10">
        <div className={`grid ${TASK_GRID} gap-1 text-xs font-medium text-gray-500 dark:text-gray-400`}>
          <div></div>
          <div className="text-center">Priority</div>
          <div className="text-left pl-1">Task</div>
          <div className="text-right">Est</div>
          <div className="text-right">Actual</div>
          <div className="text-right">Distract</div>
          <div className="text-right">Actions</div>
        </div>
      </div>

      {/* New Category Input */}
      {showNewCategoryInput && (
        <div className="px-4 sm:px-6 py-2 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex items-center gap-2">
          <Folder className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Category name..."
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreateCategory(); if (e.key === 'Escape') { setShowNewCategoryInput(false); setNewCategoryName(""); } }}
            autoFocus
            className="flex-1 min-w-0 px-3 py-1.5 text-sm rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
          <Button variant="ghost" size="sm" onClick={handleCreateCategory} disabled={!newCategoryName.trim()} className="text-blue-500 hover:text-blue-700 px-2 py-1 h-7">
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { setShowNewCategoryInput(false); setNewCategoryName(""); }} className="text-gray-400 hover:text-gray-600 px-2 py-1 h-7">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Task Rows */}
      <div className="divide-y divide-gray-200 dark:divide-gray-800">
        {sortedTasks.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
            <CheckSquare className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-400 dark:text-gray-500 mb-2">No tasks found</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">Add a new task to get started!</p>
          </div>
        ) : (<>
          {/* Uncategorized tasks */}
          {categoryGroups.uncategorized.map((task) => {
            const isExpanded = expandedTasks.has(task.id);
            const isSubtasksOpen = expandedSubtasks.has(task.id);
            const hasSubtasks = task.subtasks && task.subtasks.length > 0;

            return (
              <div
                key={task.id}
                className={`${isCompact ? 'px-3 sm:px-4 py-1.5 sm:py-2' : 'px-4 sm:px-6 py-3 sm:py-4'} hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors group ${
                  task.completed
                    ? `${getDistractionBackgroundColor(task.distractionLevel) || 'bg-gray-50 dark:bg-gray-800'}`
                    : ''
                }`}
              >
                {/* Desktop Layout - Hidden on mobile/tablet */}
                <div className={`hidden lg:grid ${TASK_GRID} gap-1 items-center`}>
                  {/* Controls group: drag + later + checkbox + subtask */}
                  <div className="flex items-center justify-end gap-2 pr-3">
                    <div
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", JSON.stringify(task));
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      className="cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      title="Drag to move"
                    >
                      <GripVertical className={`${isCompact ? 'h-3 w-3' : 'h-3.5 w-3.5'} text-gray-400`} />
                    </div>
                    {!task.completed && onMoveToLater && (
                      <button
                        onClick={() => onMoveToLater(task)}
                        className="p-0.5 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                        title="Move to Later"
                      >
                        <ArrowDown className={`${isCompact ? 'h-3 w-3' : 'h-3.5 w-3.5'}`} />
                      </button>
                    )}
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={(checked) => {
                        if (checked && !task.completed) {
                          setCompletingTaskId(task.id);
                        } else if (!checked && task.completed) {
                          onUndoCompletion(task);
                        }
                      }}
                      className={`cursor-pointer ${isCompact ? 'w-4 h-4' : 'w-5 h-5'}`}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSubtasks(task.id)}
                      className={`text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 px-1 py-0.5 h-6 ${
                        isSubtasksOpen ? 'text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                      title="Subtasks"
                    >
                      <ListPlus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="flex justify-center">
                    <span
                      className={`inline-flex items-center justify-center ${isCompact ? 'w-8 h-7 rounded text-sm' : 'w-10 h-8 rounded-md text-lg'} font-extrabold border-2 flex-shrink-0 ${getPriorityColor(
                      task.priority,
                      task.completed,
                    )}`}
                    >
                      {task.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className={`font-medium ${isCompact ? 'text-sm leading-snug' : 'text-base leading-relaxed'} ${
                      task.completed
                        ? 'text-gray-400 dark:text-gray-500 line-through'
                        : 'text-gray-900 dark:text-gray-100'
                    } truncate`} title={task.title}>
                      {task.title}
                    </span>
                    <WorkTypeBadge workType={task.workType} />
                    {!isCompact && <SubtaskProgress subtasks={task.subtasks} />}
                  </div>
                  <div className="flex justify-end">
                    <div className={`flex items-center ${isCompact ? 'text-xs' : 'text-sm'} text-gray-600 dark:text-gray-400`}>
                      <Clock className={`${isCompact ? 'h-3 w-3' : 'h-3.5 w-3.5'} mr-0.5`} />
                      <span className="font-semibold">{formatTime(task.estimatedTime)}</span>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    {task.completed && task.actualTime !== null && task.actualTime !== undefined ? (
                      <div className={`flex items-center ${isCompact ? 'text-xs' : 'text-sm'} text-green-600 dark:text-green-400`}>
                        <CheckCircle className={`${isCompact ? 'h-3 w-3' : 'h-3.5 w-3.5'} mr-0.5`} />
                        <span className="font-medium">{formatTime(task.actualTime)}</span>
                      </div>
                    ) : (
                      <span className={`${isCompact ? 'text-xs' : 'text-sm'} text-gray-500 dark:text-gray-400`}>-</span>
                    )}
                  </div>
                  <div className="flex justify-end">
                    {task.completed && task.distractionLevel !== null && task.distractionLevel !== undefined && task.distractionLevel >= 1 && task.distractionLevel <= 5 ? (
                      <span className={`${isCompact ? 'text-xs' : 'text-sm'} font-bold ${getDistractionColor(task.distractionLevel)}`}>
                        {task.distractionLevel}
                      </span>
                    ) : (
                      <span className={`${isCompact ? 'text-xs' : 'text-sm'} text-gray-400 dark:text-gray-500`}>-</span>
                    )}
                  </div>
                  <div className="flex justify-end gap-0.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditTask && onEditTask(task)}
                      className={`text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 ${isCompact ? 'px-1 py-0.5 h-6' : 'px-1.5 py-1 h-7'}`}
                      title="Edit"
                    >
                      <Edit className={`${isCompact ? 'h-3 w-3' : 'h-3.5 w-3.5'}`} />
                    </Button>
                    {task.completed && !isAnonymous ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onArchive && onArchive(task)}
                        className={`text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 ${isCompact ? 'px-1 py-0.5 h-6' : 'px-1.5 py-1 h-7'}`}
                        title="Archive"
                      >
                        <Archive className={`${isCompact ? 'h-3 w-3' : 'h-3.5 w-3.5'}`} />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteTask && onDeleteTask(task)}
                        className={`text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 ${isCompact ? 'px-1 py-0.5 h-6' : 'px-1.5 py-1 h-7'}`}
                        title="Delete"
                      >
                        <Trash2 className={`${isCompact ? 'h-3 w-3' : 'h-3.5 w-3.5'}`} />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Mobile/Tablet Layout */}
                <div className="lg:hidden">
                  <div className={`flex items-center ${isCompact ? 'gap-2' : 'gap-3'}`}>
                    {/* Checkbox */}
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={(checked) => {
                        if (checked && !task.completed) {
                          setCompletingTaskId(task.id);
                        } else if (!checked && task.completed) {
                          onUndoCompletion(task);
                        }
                      }}
                      className={`cursor-pointer flex-shrink-0 ${isCompact ? 'w-4 h-4' : 'w-5 h-5'}`}
                    />

                    {/* Priority */}
                    <span
                      className={`inline-flex items-center justify-center ${isCompact ? 'w-6 h-6 rounded text-sm' : 'w-8 h-8 sm:w-9 sm:h-9 rounded-md text-lg sm:text-xl'} font-extrabold border-2 flex-shrink-0 ${getPriorityColor(
                      task.priority,
                      task.completed,
                    )}`}
                    >
                      {task.priority}
                    </span>

                    {/* Task Title and Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className={`flex flex-wrap items-center ${isCompact ? 'gap-1' : 'gap-1.5'} min-w-0`}>
                          <span className={`font-medium ${isCompact ? 'text-sm leading-snug' : 'text-base sm:text-lg leading-relaxed'} break-words ${
                            task.completed
                              ? 'text-gray-400 dark:text-gray-500 line-through'
                              : 'text-gray-900 dark:text-gray-100'
                          }`}>
                            {task.title}
                          </span>
                          <WorkTypeBadge workType={task.workType} />
                          {!isCompact && <SubtaskProgress subtasks={task.subtasks} />}
                        </div>

                        {/* Time and Actions Row */}
                        <div className="flex items-start gap-2 flex-shrink-0 mt-1">
                          {/* Estimated Time */}
                          <div className={`flex items-center ${isCompact ? 'text-[10px]' : 'text-xs'} text-gray-600 dark:text-gray-400`}>
                            <Clock className={`${isCompact ? 'h-2.5 w-2.5' : 'h-3 w-3'} mr-1`} />
                            <span className="font-semibold">{formatTime(task.estimatedTime)}</span>
                          </div>

                          {/* Expand Details Button (for completed tasks) */}
                          {task.completed && (task.actualTime !== null || task.distractionLevel !== null) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpanded(task.id)}
                              className={`text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 px-1 py-1 ${isCompact ? 'h-5' : 'h-6'}`}
                              title="Show Details"
                            >
                              {isExpanded ? (
                                <ChevronDown className={`${isCompact ? 'h-2.5 w-2.5' : 'h-3 w-3'}`} />
                              ) : (
                                <ChevronRight className={`${isCompact ? 'h-2.5 w-2.5' : 'h-3 w-3'}`} />
                              )}
                            </Button>
                          )}

                          {/* Actions Menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 px-1 py-1 ${isCompact ? 'h-5' : 'h-6'}`}
                              >
                                <MoreHorizontal className={`${isCompact ? 'h-2.5 w-2.5' : 'h-3 w-3'}`} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {!task.completed && (
                                <DropdownMenuItem onClick={() => onMoveToLater && onMoveToLater(task)}>
                                  Move to Later
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => toggleSubtasks(task.id)}>
                                <ListPlus className="h-4 w-4 mr-2" />
                                Subtasks
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onEditTask && onEditTask(task)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              {task.completed ? (
                                isAnonymous ? (
                                  <DropdownMenuItem
                                    onClick={() => onDeleteTask && onDeleteTask(task)}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => onArchive && onArchive(task)}>
                                    <Archive className="h-4 w-4 mr-2" />
                                    Archive
                                  </DropdownMenuItem>
                                )
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => onDeleteTask && onDeleteTask(task)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Details for Mobile/Tablet */}
                  {isExpanded && task.completed && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 rounded-md p-3">
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        {task.actualTime !== null && task.actualTime !== undefined && (
                          <div className="flex items-center justify-center bg-green-50 dark:bg-green-900/20 rounded-md p-2">
                            <CheckCircle className="h-3 w-3 mr-2 text-green-600 dark:text-green-400" />
                            <span className="font-medium text-green-600 dark:text-green-400">
                              Actual: {formatTime(task.actualTime)}
                            </span>
                          </div>
                        )}
                        {task.distractionLevel !== null && task.distractionLevel !== undefined && task.distractionLevel >= 1 && task.distractionLevel <= 5 && (
                          <div className="flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-md p-2">
                            <span className="text-gray-600 dark:text-gray-400 mr-2">Distraction:</span>
                            <span className={`font-bold ${getDistractionColor(task.distractionLevel)}`}>
                              {task.distractionLevel}/5
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Inline Completion Panel */}
                {completingTaskId === task.id && !task.completed && (
                  <InlineCompletionPanel
                    task={task}
                    onConfirm={(t, actualTime, distractionLevel) => {
                      onCompleteTask(t, actualTime, distractionLevel);
                      setCompletingTaskId(null);
                    }}
                    onCancel={() => setCompletingTaskId(null)}
                  />
                )}

                {/* Subtasks Section (shared for desktop & mobile) */}
                {isSubtasksOpen && (
                  <SubtaskSection task={task} onUpdateTask={onUpdateTask} />
                )}
              </div>
            );
          })}

          {/* Category Groups */}
          {categoryGroups.groups.map((cat) => {
            const isCollapsed = collapsedCategories.has(cat.name);
            const incompleteTasks = cat.tasks.filter(t => !t.completed);
            const totalTime = incompleteTasks.reduce((sum, t) => sum + (t.estimatedTime || 0), 0);

            return (
              <div key={cat.id || cat.name} className="border-t-2 border-gray-300 dark:border-gray-700">
                {/* Category Header */}
                <div
                  className="px-4 sm:px-6 py-2.5 bg-gray-50 dark:bg-gray-900/80 flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => toggleCategory(cat.name)}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", JSON.stringify({
                      type: 'category',
                      name: cat.name,
                      taskIds: cat.tasks.filter(t => !t.completed).map(t => t.id),
                    }));
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.dataTransfer.dropEffect = 'move';
                    e.currentTarget.classList.add('bg-blue-100', 'dark:bg-blue-900/30', 'ring-2', 'ring-blue-400');
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.classList.remove('bg-blue-100', 'dark:bg-blue-900/30', 'ring-2', 'ring-blue-400');
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.currentTarget.classList.remove('bg-blue-100', 'dark:bg-blue-900/30', 'ring-2', 'ring-blue-400');
                    try {
                      const taskData = JSON.parse(e.dataTransfer.getData('text/plain'));
                      if (taskData && taskData.id && !taskData.type) {
                        onUpdateTask({ ...taskData, category: cat.name });
                      }
                    } catch (err) {
                      console.error('Error parsing dropped task for category:', err);
                    }
                  }}
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                  )}
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color || '#6b7280' }}
                  />
                  {renamingCategoryId === cat.id ? (
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameCategory(cat.id);
                        if (e.key === 'Escape') { setRenamingCategoryId(null); setRenameValue(""); }
                      }}
                      onBlur={() => handleRenameCategory(cat.id)}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                      className="flex-1 min-w-0 px-2 py-0.5 text-sm font-semibold rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                      {cat.name}
                    </span>
                  )}
                  <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                    {cat.tasks.length} {cat.tasks.length === 1 ? 'task' : 'tasks'}
                  </span>
                  {isCollapsed && totalTime > 0 && (
                    <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 shrink-0">
                      <Clock className="h-3 w-3" />
                      {formatTime(totalTime)}
                    </span>
                  )}
                  <div className="ml-auto flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 px-1.5 py-1 h-6">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setRenamingCategoryId(cat.id); setRenameValue(cat.name); }}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        {onMoveCategoryToLater && (
                          <DropdownMenuItem onClick={() => onMoveCategoryToLater(cat.name)}>
                            Move All to Later
                          </DropdownMenuItem>
                        )}
                        {onDeleteCategory && (
                          <DropdownMenuItem onClick={() => onDeleteCategory(cat.id)} className="text-red-600 focus:text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Category
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Category Tasks */}
                {!isCollapsed && cat.tasks.map((task) => {
                  const isExpanded = expandedTasks.has(task.id);
                  const isSubtasksOpen = expandedSubtasks.has(task.id);
                  const hasSubtasks = task.subtasks && task.subtasks.length > 0;

                  return (
                    <div
                      key={task.id}
                      className={`${isCompact ? 'px-3 sm:px-4 py-1.5 sm:py-2' : 'px-4 sm:px-6 py-3 sm:py-4'} hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors group border-t border-gray-100 dark:border-gray-800/50 ${
                        task.completed
                          ? `${getDistractionBackgroundColor(task.distractionLevel) || 'bg-gray-50 dark:bg-gray-800'}`
                          : ''
                      }`}
                    >
                      {/* Desktop Layout */}
                      <div className={`hidden lg:grid ${TASK_GRID} gap-1 items-center`}>
                        {/* Controls group: drag + checkbox + subtask (NO Later for categorized tasks) */}
                        <div className="flex items-center justify-end gap-2 pr-3">
                          <div
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData("text/plain", JSON.stringify(task));
                              e.dataTransfer.effectAllowed = "move";
                            }}
                            className="cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            title="Drag to move"
                          >
                            <GripVertical className={`${isCompact ? 'h-3 w-3' : 'h-3.5 w-3.5'} text-gray-400`} />
                          </div>
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={(checked) => {
                              if (checked && !task.completed) setCompletingTaskId(task.id);
                              else if (!checked && task.completed) onUndoCompletion(task);
                            }}
                            className={`cursor-pointer ${isCompact ? 'w-4 h-4' : 'w-5 h-5'}`}
                          />
                          <Button
                            variant="ghost" size="sm"
                            onClick={() => toggleSubtasks(task.id)}
                            className={`text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 px-1 py-0.5 h-6 ${
                              isSubtasksOpen ? 'text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : ''
                            }`}
                            title="Subtasks"
                          >
                            <ListPlus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <div className="flex justify-center">
                          <span className={`inline-flex items-center justify-center ${isCompact ? 'w-8 h-7 rounded text-sm' : 'w-10 h-8 rounded-md text-lg'} font-extrabold border-2 flex-shrink-0 ${getPriorityColor(task.priority, task.completed)}`}>
                            {task.priority}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          <span className={`font-medium ${isCompact ? 'text-sm leading-snug' : 'text-base leading-relaxed'} ${
                            task.completed ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-900 dark:text-gray-100'
                          } truncate`} title={task.title}>
                            {task.title}
                          </span>
                          <WorkTypeBadge workType={task.workType} />
                          {!isCompact && <SubtaskProgress subtasks={task.subtasks} />}
                        </div>
                        <div className="flex justify-end">
                          <div className={`flex items-center ${isCompact ? 'text-xs' : 'text-sm'} text-gray-600 dark:text-gray-400`}>
                            <Clock className={`${isCompact ? 'h-3 w-3' : 'h-3.5 w-3.5'} mr-0.5`} />
                            <span className="font-semibold">{formatTime(task.estimatedTime)}</span>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          {task.completed && task.actualTime != null ? (
                            <div className={`flex items-center ${isCompact ? 'text-xs' : 'text-sm'} text-green-600 dark:text-green-400`}>
                              <CheckCircle className={`${isCompact ? 'h-3 w-3' : 'h-3.5 w-3.5'} mr-0.5`} />
                              <span className="font-medium">{formatTime(task.actualTime)}</span>
                            </div>
                          ) : (<span className={`${isCompact ? 'text-xs' : 'text-sm'} text-gray-500 dark:text-gray-400`}>-</span>)}
                        </div>
                        <div className="flex justify-end">
                          {task.completed && task.distractionLevel != null && task.distractionLevel >= 1 && task.distractionLevel <= 5 ? (
                            <span className={`${isCompact ? 'text-xs' : 'text-sm'} font-bold ${getDistractionColor(task.distractionLevel)}`}>{task.distractionLevel}</span>
                          ) : (<span className={`${isCompact ? 'text-xs' : 'text-sm'} text-gray-400 dark:text-gray-500`}>-</span>)}
                        </div>
                        <div className="flex justify-end gap-0.5">
                          <Button variant="ghost" size="sm" onClick={() => onEditTask && onEditTask(task)} className={`text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 ${isCompact ? 'px-1 py-0.5 h-6' : 'px-1.5 py-1 h-7'}`} title="Edit">
                            <Edit className={`${isCompact ? 'h-3 w-3' : 'h-3.5 w-3.5'}`} />
                          </Button>
                          {task.completed && !isAnonymous ? (
                            <Button variant="ghost" size="sm" onClick={() => onArchive && onArchive(task)} className={`text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 ${isCompact ? 'px-1 py-0.5 h-6' : 'px-1.5 py-1 h-7'}`} title="Archive">
                              <Archive className={`${isCompact ? 'h-3 w-3' : 'h-3.5 w-3.5'}`} />
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm" onClick={() => onDeleteTask && onDeleteTask(task)} className={`text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 ${isCompact ? 'px-1 py-0.5 h-6' : 'px-1.5 py-1 h-7'}`} title="Delete">
                              <Trash2 className={`${isCompact ? 'h-3 w-3' : 'h-3.5 w-3.5'}`} />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Mobile Layout */}
                      <div className="lg:hidden">
                        <div className={`flex items-center ${isCompact ? 'gap-2' : 'gap-3'}`}>
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={(checked) => {
                              if (checked && !task.completed) setCompletingTaskId(task.id);
                              else if (!checked && task.completed) onUndoCompletion(task);
                            }}
                            className={`cursor-pointer flex-shrink-0 ${isCompact ? 'w-4 h-4' : 'w-5 h-5'}`}
                          />
                          <span className={`inline-flex items-center justify-center ${isCompact ? 'w-6 h-6 rounded text-sm' : 'w-8 h-8 sm:w-9 sm:h-9 rounded-md text-lg sm:text-xl'} font-extrabold border-2 flex-shrink-0 ${getPriorityColor(task.priority, task.completed)}`}>
                            {task.priority}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className={`flex flex-wrap items-center ${isCompact ? 'gap-1' : 'gap-1.5'} min-w-0`}>
                                <span className={`font-medium ${isCompact ? 'text-sm leading-snug' : 'text-base sm:text-lg leading-relaxed'} break-words ${
                                  task.completed ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-900 dark:text-gray-100'
                                }`}>{task.title}</span>
                                <WorkTypeBadge workType={task.workType} />
                                {!isCompact && <SubtaskProgress subtasks={task.subtasks} />}
                              </div>
                              <div className="flex items-start gap-2 flex-shrink-0 mt-1">
                                <div className={`flex items-center ${isCompact ? 'text-[10px]' : 'text-xs'} text-gray-600 dark:text-gray-400`}>
                                  <Clock className={`${isCompact ? 'h-2.5 w-2.5' : 'h-3 w-3'} mr-1`} /><span className="font-semibold">{formatTime(task.estimatedTime)}</span>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className={`text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 px-1 py-1 ${isCompact ? 'h-5' : 'h-6'}`}>
                                      <MoreHorizontal className={`${isCompact ? 'h-2.5 w-2.5' : 'h-3 w-3'}`} />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => toggleSubtasks(task.id)}><ListPlus className="h-4 w-4 mr-2" />Subtasks</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onEditTask && onEditTask(task)}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                                    {task.completed ? (
                                      isAnonymous ? (
                                        <DropdownMenuItem onClick={() => onDeleteTask && onDeleteTask(task)} className="text-red-600 focus:text-red-600"><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                                      ) : (
                                        <DropdownMenuItem onClick={() => onArchive && onArchive(task)}><Archive className="h-4 w-4 mr-2" />Archive</DropdownMenuItem>
                                      )
                                    ) : (
                                      <DropdownMenuItem onClick={() => onDeleteTask && onDeleteTask(task)} className="text-red-600 focus:text-red-600"><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Inline Completion Panel */}
                      {completingTaskId === task.id && !task.completed && (
                        <InlineCompletionPanel
                          task={task}
                          onConfirm={(t, actualTime, distractionLevel) => { onCompleteTask(t, actualTime, distractionLevel); setCompletingTaskId(null); }}
                          onCancel={() => setCompletingTaskId(null)}
                        />
                      )}

                      {/* Subtasks Section */}
                      {isSubtasksOpen && (
                        <SubtaskSection task={task} onUpdateTask={onUpdateTask} />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </>)}
      </div>
    </Card>
  );
}
