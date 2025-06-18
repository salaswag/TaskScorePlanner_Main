
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function TaskEditModal({ isOpen, task, onClose, onSave }) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState(5);
  const [estimatedTime, setEstimatedTime] = useState(30);

  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setPriority(task.priority || 5);
      setEstimatedTime(task.estimatedTime || 30);
    }
  }, [task]);

  const handleSave = () => {
    if (title.trim() && priority >= 1 && priority <= 10 && estimatedTime > 0) {
      onSave({
        ...task,
        title: title.trim(),
        priority: Number(priority),
        estimatedTime: Number(estimatedTime),
      });
      handleClose();
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

  if (!isOpen || !task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 p-4">
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

          {/* Priority and Time Controls */}
          <div className="space-y-4">
            {/* Priority Slider */}
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                Priority: {priority}
              </label>
              <div className="relative">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={priority}
                  onChange={(e) => setPriority(parseInt(e.target.value))}
                  className="slider w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>Low (1)</span>
                  <span>High (10)</span>
                </div>
              </div>
            </div>

            {/* Estimated Time Slider */}
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                Estimated Time: {formatTime(estimatedTime)}
              </label>
              <div className="relative">
                <input
                  type="range"
                  min="5"
                  max="120"
                  step="5"
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(parseInt(e.target.value))}
                  className="slider w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>5m</span>
                  <span>2h</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button onClick={handleClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              className="flex-1 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors duration-200"
              disabled={!title.trim() || priority < 1 || priority > 10 || estimatedTime <= 0}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
