import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

export function useTasks() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const {
    data: tasks,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/tasks"],
  });

  const createTask = useMutation({
    mutationFn: async (taskData) => {
      const response = await apiRequest("/api/tasks", {
        method: "POST",
        body: JSON.stringify(taskData)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  const updateTask = useMutation({
    mutationFn: async (taskData) => {
      const response = await apiRequest(`/api/tasks/${taskData.id}`, {
        method: "PATCH",
        body: JSON.stringify(taskData)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId) => {
      await apiRequest(`/api/tasks/${taskId}`, {
        method: "DELETE"
      });
      return taskId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

   const archiveTask = useMutation({
    mutationFn: async (taskId) => {
      const response = await apiRequest(`/api/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ isArchived: true }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  const mainTasks = tasks?.filter(task => !task.isLater && !task.isFocus) || [];
  const laterTasks = tasks?.filter(task => Boolean(task.isLater)) || [];
  const focusTasks = tasks?.filter(task => Boolean(task.isFocus)) || [];

  return {
    tasks,
    isLoading,
    error,
    createTask,
    updateTask,
    deleteTask,
    archiveTask,
    mainTasks,
    laterTasks,
    focusTasks,
  };
}