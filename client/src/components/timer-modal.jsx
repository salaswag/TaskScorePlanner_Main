import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock } from "lucide-react";

export default function TimerModal({ isOpen, task, onClose, onConfirm }) {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(30);

  useEffect(() => {
    if (task) {
      const estimatedHours = Math.floor(task.estimatedTime / 60);
      const estimatedMinutes = task.estimatedTime % 60;
      setHours(estimatedHours);
      setMinutes(estimatedMinutes);
    }
  }, [task]);

  const handleConfirm = () => {
    const totalMinutes = parseInt(hours) * 60 + parseInt(minutes);
    onConfirm(totalMinutes);
  };

  const formatTime = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="text-center mb-6">
            <Clock className="h-12 w-12 text-black mx-auto mb-4" />
            <DialogTitle className="text-xl font-semibold text-black mb-2">
              Task Completion
            </DialogTitle>
            <p className="text-gray-600">How long did this task actually take?</p>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label className="block text-sm font-medium text-black mb-2">
              Actual Time Spent
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="block text-xs text-gray-500 mb-1">Hours</Label>
                <Input
                  type="number"
                  min="0"
                  max="23"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <Label className="block text-xs text-gray-500 mb-1">Minutes</Label>
                <Input
                  type="number"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Estimated:</span>
              <span className="font-medium">{formatTime(task.estimatedTime)}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-600">Actual:</span>
              <span className="font-medium">{formatTime(parseInt(hours) * 60 + parseInt(minutes))}</span>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-3 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className="flex-1 bg-black text-white hover:bg-gray-800"
          >
            Complete Task
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
