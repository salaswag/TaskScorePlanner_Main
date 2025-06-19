
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle } from "lucide-react";

export default function TimerModal({ isOpen, task, onClose, onConfirm }) {
  const [actualTime, setActualTime] = useState(30);
  const [distractionLevel, setDistractionLevel] = useState(1);

  const handleConfirm = () => {
    if (actualTime > 0) {
      onConfirm(actualTime, distractionLevel);
      setActualTime(30);
      setDistractionLevel(1);
    }
  };

  const handleClose = () => {
    setActualTime(30);
    setDistractionLevel(1);
    onClose();
  };

  const formatTimeMinutes = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getDistractionColor = (level) => {
    const colors = [
      'text-green-600', // 1 - Not distracted
      'text-green-500', // 2
      'text-yellow-500', // 3 - Moderately distracted
      'text-orange-500', // 4
      'text-red-500'    // 5 - Fully distracted
    ];
    return colors[level - 1];
  };

  const getDistractionLabel = (level) => {
    const labels = [
      'Not distracted',
      'Slightly distracted',
      'Moderately distracted',
      'Very distracted',
      'Fully distracted'
    ];
    return labels[level - 1];
  };

  if (!isOpen || !task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md mx-auto max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-semibold text-center text-gray-900 dark:text-gray-100">
            Complete Task
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          <h3 className="text-base sm:text-lg font-medium text-center text-gray-800 dark:text-gray-200 px-2 break-words">
            {task?.title}
          </h3>

          {/* Actual Time Slider */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
              Actual Time: {formatTimeMinutes(actualTime)}
            </label>
            <div className="relative">
              <input
                type="range"
                min="5"
                max="240"
                step="5"
                value={actualTime}
                onChange={(e) => setActualTime(parseInt(e.target.value))}
                className="slider w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>5m</span>
                <span>4h</span>
              </div>
            </div>
          </div>

          {/* Distraction Level */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
              How distracted were you?
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setDistractionLevel(level)}
                  className={`px-3 py-2 text-xs rounded-lg border transition-all ${
                    distractionLevel === level
                      ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <p className={`text-xs font-medium ${getDistractionColor(distractionLevel)}`}>
              {getDistractionLabel(distractionLevel)}
            </p>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button onClick={handleClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white transition-colors duration-200"
            >
              Complete Task
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
