
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, RotateCcw } from "lucide-react";

export default function NotificationToast({ notification, onClose, onUndo }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleUndo = () => {
    if (onUndo) {
      onUndo();
    }
    handleClose();
  };

  return (
    <div
      className={`transform transition-all duration-300 ease-in-out ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      } bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-sm min-w-[300px]`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-900 dark:text-gray-100">
            {notification.message}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="ml-2 h-6 w-6 p-0 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {notification.hasUndo && (
        <div className="mt-3 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleUndo}
            className="text-xs px-3 py-1 h-7"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Undo
          </Button>
        </div>
      )}
    </div>
  );
}
