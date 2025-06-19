
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

export default function TaskFormModal({ isOpen, onClose, onSubmit, isLoading }) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState(5);
  const [estimatedTime, setEstimatedTime] = useState(30);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title.trim() && priority >= 1 && priority <= 10 && estimatedTime > 0) {
      const taskData = {
        title: title.trim(),
        priority: Number(priority),
        estimatedTime: Number(estimatedTime),
        isFocus: false,
      };
      console.log('Submitting task with data:', taskData);
      onSubmit(taskData);
      setTitle("");
      setPriority(5);
      setEstimatedTime(30);
      onClose();
    }
  };

  const handleClose = () => {
    setTitle("");
    setPriority(5);
    setEstimatedTime(30);
    onClose();
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-md mx-auto">
        <DialogHeader className="text-center space-y-2">
          <DialogTitle className="text-lg sm:text-xl flex items-center justify-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Task
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Task Title */}
          <div className="space-y-2">
            <Label htmlFor="task-title" className="text-sm font-medium">Task Title</Label>
            <Input
              id="task-title"
              type="text"
              placeholder="Enter task description..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 text-sm"
              autoFocus
            />
          </div>

          {/* Priority Slider */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Priority: {priority}
            </Label>
            <div className="px-1">
              <input
                type="range"
                min="1"
                max="10"
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value))}
                className="slider w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1 px-1">
                <span>Low (1)</span>
                <span>Med (5)</span>
                <span>High (10)</span>
              </div>
            </div>
          </div>

          {/* Time Slider */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Estimated Time: {formatTime(estimatedTime)}
            </Label>
            <div className="px-1">
              <input
                type="range"
                min="5"
                max="120"
                step="5"
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(parseInt(e.target.value))}
                className="slider w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1 px-1">
                <span>5m</span>
                <span>1h</span>
                <span>2h</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 h-10"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || isLoading}
              className="flex-1 h-10 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
            >
              {isLoading ? 'Adding...' : 'Add Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
