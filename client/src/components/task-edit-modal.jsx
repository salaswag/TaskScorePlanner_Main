
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  const formatTimeMinutes = (minutes) => {
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
        <div className="space-y-4 pt-4">
          {/* Task Title */}
          <div>
            <Label htmlFor="edit-title" className="text-sm font-medium">
              Task Title
            </Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              className="mt-1"
            />
          </div>

          {/* Priority */}
          <div>
            <Label htmlFor="edit-priority" className="text-sm font-medium">
              Priority (1-10)
            </Label>
            <Input
              id="edit-priority"
              type="number"
              min="1"
              max="10"
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              className="mt-1"
            />
          </div>

          {/* Estimated Time */}
          <div>
            <Label htmlFor="edit-time" className="text-sm font-medium">
              Estimated Time (minutes) - {formatTimeMinutes(estimatedTime)}
            </Label>
            <Input
              id="edit-time"
              type="number"
              min="5"
              step="5"
              value={estimatedTime}
              onChange={(e) => setEstimatedTime(Number(e.target.value))}
              className="mt-1"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <Button onClick={handleClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              className="flex-1"
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
