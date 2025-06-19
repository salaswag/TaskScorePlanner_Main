import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TaskForm from "./task-form";

export default function TaskFormModal({ isOpen, onClose, onSubmit, isLoading, isInline = false }) {
  const [formData, setFormData] = useState({
    title: "",
    priority: 5,
    estimatedTime: 30,
    isFocus: false,
  });

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

  if (isInline) {
    return (
      <Card className="bg-white dark:bg-black shadow-sm border border-gray-200 dark:border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Add New Task</CardTitle>
        </CardHeader>
        <CardContent>
          <TaskForm 
            onSubmit={handleSubmit} 
            isLoading={isLoading}
            formData={formData}
            setFormData={setFormData}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-md mx-auto max-h-[85vh] overflow-y-auto rounded-xl shadow-2xl border-0 bg-white dark:bg-gray-900 p-6">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-lg font-semibold text-center">Add New Task</DialogTitle>
        </DialogHeader>
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