import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Folder } from "lucide-react";
import { useKeyboardAware } from "@/hooks/use-keyboard-aware";
import { useInputFocus } from "@/hooks/use-input-focus";
import { WorkTypeToggle } from "./task-form";

export default function TaskEditModal({
  task,
  isOpen,
  onClose,
  onSave,
  isLoading,
  categories = [],
}) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState(5);
  const [estimatedTime, setEstimatedTime] = useState(30);
  const [workType, setWorkType] = useState(null);
  const [category, setCategory] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { isKeyboardVisible } = useKeyboardAware();
  const { handleInputFocus, handleInputBlur, focusNextInput } = useInputFocus();

  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setPriority(task.priority || 5);
      setEstimatedTime(task.estimatedTime || 30);
      setWorkType(task.workType || null);
      setCategory(task.category || "");
    }
  }, [task]);

  const handleSave = async () => {
    if (title.trim() && priority >= 1 && priority <= 10 && estimatedTime > 0) {
      setIsSaving(true);
      try {
        await onSave({
          ...task,
          title: title.trim(),
          priority: Number(priority),
          estimatedTime: Number(estimatedTime),
          workType: workType,
          category: category || null,
        });
        handleClose();
      } catch (error) {
        console.error("Save failed:", error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleClose = () => {
    setTitle("");
    setPriority(5);
    setEstimatedTime(30);
    setWorkType(null);
    setCategory("");
    onClose();
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (!isOpen || !task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`w-[90vw] max-w-md mx-auto max-h-[85vh] overflow-y-auto rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-0 transition-all duration-300 ${
          isKeyboardVisible ? "translate-y-[-10vh]" : ""
        }`}
      >
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
            Edit Task
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 px-6 pb-8">
          {/* Task Input */}
          <div>
            <Input
              type="text"
              placeholder="Edit task title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-gray-900 text-black dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Work Type Toggle */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-black dark:text-white">
              Work Type
            </label>
            <WorkTypeToggle value={workType} onChange={setWorkType} />
          </div>

          {/* Category Selector */}
          {categories.length > 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-black dark:text-white">
                Category
              </label>
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4 text-gray-400" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  <option value="">No category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Priority and Time Controls */}
          <div className="space-y-6">
            {/* Priority Slider */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-black dark:text-white">
                Priority: {priority}
              </label>
              <div className="relative px-2">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={priority}
                  onChange={(e) => setPriority(parseInt(e.target.value))}
                  className="slider w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2 px-1">
                  <span>Low (1)</span>
                  <span>High (10)</span>
                </div>
              </div>
            </div>

            {/* Time Slider */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-black dark:text-white">
                Time: {formatTime(estimatedTime)}
              </label>
              <div className="relative px-2">
                <input
                  type="range"
                  min="5"
                  max="180"
                  step="5"
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(parseInt(e.target.value))}
                  className="slider w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2 px-1">
                  <span>5 min</span>
                  <span>3 hours</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-8 border-t border-gray-100 dark:border-gray-800">
            <Button onClick={handleClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors duration-200"
              disabled={
                !title.trim() ||
                priority < 1 ||
                priority > 10 ||
                estimatedTime <= 0 ||
                isSaving
              }
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
