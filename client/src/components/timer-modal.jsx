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
            Task Timer
          </DialogTitle>
        </DialogHeader>

        <div className="text-center space-y-4 sm:space-y-6">
          <h3 className="text-base sm:text-lg font-medium text-gray-800 dark:text-gray-200 px-2 break-words">
            {task?.title}
          </h3>

          <div className="text-2xl sm:text-3xl font-mono font-bold text-gray-900 dark:text-gray-100 py-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            {formatTimeMinutes(actualTime)}
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-2">
            <Button
              onClick={() => {}}
              className="w-full sm:w-auto px-6 py-3 h-12 text-base font-medium bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-lg transition-all duration-200"
            >
              Pause
            </Button>

            <Button
              onClick={() => {}}
              variant="outline"
              className="w-full sm:w-auto px-6 py-3 h-12 text-base font-medium border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
            >
              Reset
            </Button>
          </div>

          <div className="pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 px-2">
              Mark this task as completed?
            </p>
            <Button
              onClick={() => {}}
              className="w-full py-3 h-12 text-base font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              Complete Task
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}