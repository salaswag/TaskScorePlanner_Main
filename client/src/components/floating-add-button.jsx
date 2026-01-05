
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import TaskFormModal from "./task-form-modal";

export default function FloatingAddButton({ onSubmit, isLoading }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSubmit = (taskData) => {
    onSubmit(taskData);
    setIsModalOpen(false);
  };

  return (
    <>
      {/* Floating Add Button */}
      <Button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-black dark:bg-white text-white dark:text-black shadow-lg hover:shadow-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-200 transform hover:scale-105"
        title="Add New Task"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Task Form Modal */}
      <TaskFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </>
  );
}
