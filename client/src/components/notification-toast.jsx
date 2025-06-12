import { useEffect, useState } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotificationToast({ notification, onClose, onUndo }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show toast with animation
    setTimeout(() => setIsVisible(true), 100);
    
    return () => {
      setIsVisible(false);
    };
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

  const icon = notification.type === 'success' 
    ? <CheckCircle className="h-4 w-4 text-green-500" />
    : <XCircle className="h-4 w-4 text-red-500" />;

  return (
    <div 
      className={`bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[300px] transform transition-transform duration-300 ${
        isVisible ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{notification.message}</p>
        </div>
        <div className="flex space-x-2">
          {notification.hasUndo && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleUndo}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium p-1 h-auto"
            >
              Undo
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 p-1 h-auto"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
