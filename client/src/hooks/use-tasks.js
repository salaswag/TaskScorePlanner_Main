import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useTasks() {
  const queryClient = useQueryClient();

  const {
    data: tasks,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/tasks"],
  });

  const createTask = useMutation({
    mutationFn: async (taskData) => {
      const response = await apiRequest("POST", "/api/tasks", taskData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  const updateTask = useMutation({
    mutationFn: async (taskData) => {
      const response = await apiRequest("PATCH", `/api/tasks/${taskData.id}`, taskData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId) => {
      await apiRequest("DELETE", `/api/tasks/${taskId}`);
      return taskId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  return {
    tasks,
    isLoading,
    error,
    createTask,
    updateTask,
    deleteTask,
  };
}
