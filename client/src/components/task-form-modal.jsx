
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pin, PinOff } from "lucide-react";
import TaskForm from "./task-form";

export default function TaskFormModal({ isOpen, onClose, onSubmit, isLoading, isInline = false }) {
  const [formData, setFormData] = useState({
    title: "",
    priority: 5,
    estimatedTime: 30,
    isFocus: false,
  });
  const [isPinned, setIsPinned] = useState(false);

  const handleSubmit = (taskData) => {
    console.log('Submitting task with data:', taskData);
    onSubmit(taskData);
    if (!isInline) {
      onClose();
    }
    setFormData({
      title: "",
      priority: 5,
      estimatedTime: 30,
      isFocus: false,
    });
  };

  const togglePin = () => {
    setIsPinned(!isPinned);
  };

  if (isInline) {
    return (
      <div className={`transition-all duration-300 ${isPinned ? 'fixed top-0 left-0 right-0 z-50 bg-white dark:bg-black shadow-lg' : 'relative'}`}>
        <Card className={`bg-white dark:bg-black shadow-lg border border-gray-200 dark:border-gray-800 ${isPinned ? 'rounded-none border-x-0 border-t-0' : 'rounded-lg mx-auto max-w-6xl'}`}>
          <CardContent className={isPinned ? "p-4" : "p-6"}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1" />
              {/* Desktop-only pin toggle button */}
              <Button
                onClick={togglePin}
                variant="ghost"
                size="sm"
                className="hidden lg:flex items-center gap-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2"
                title={isPinned ? "Unpin form" : "Pin form to top"}
              >
                {isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
              </Button>
            </div>
            <TaskForm 
              onSubmit={handleSubmit} 
              isLoading={isLoading}
              formData={formData}
              setFormData={setFormData}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-md mx-auto max-h-[85vh] overflow-y-auto rounded-xl shadow-2xl border-0 bg-white dark:bg-gray-900 p-6">
        <div className="px-2">
          <TaskForm 
            onSubmit={handleSubmit} 
            isLoading={isLoading}
            formData={formData}
            setFormData={setFormData}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
