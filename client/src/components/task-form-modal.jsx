import * as React from "react";
const { useState } = React;
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
      <div className="w-full">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">Add New Task</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create a new task with priority and time estimate</p>
        </div>
        <TaskForm 
          onSubmit={handleSubmit} 
          isLoading={isLoading}
          formData={formData}
          setFormData={setFormData}
        />
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-md mx-auto max-h-[85vh] overflow-y-auto rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-0">
        <div className="relative">
          <div className="p-8 pt-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">Add New Task</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create a new task with priority and time estimate</p>
            </div>
            <TaskForm 
              onSubmit={handleSubmit} 
              isLoading={isLoading}
              formData={formData}
              setFormData={setFormData}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}