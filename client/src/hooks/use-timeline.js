
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE = "/api/timeline";

export function useTimeline() {
  const queryClient = useQueryClient();

  const timelineQuery = useQuery({
    queryKey: ["timeline"],
    queryFn: async () => {
      const response = await fetch(API_BASE);
      if (!response.ok) {
        throw new Error("Failed to fetch timeline events");
      }
      return response.json();
    },
  });

  const createEvent = useMutation({
    mutationFn: async (eventData) => {
      const response = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });
      if (!response.ok) {
        throw new Error("Failed to create timeline event");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeline"] });
    },
  });

  const updateEvent = useMutation({
    mutationFn: async (eventData) => {
      const response = await fetch(`${API_BASE}/${eventData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });
      if (!response.ok) {
        throw new Error("Failed to update timeline event");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeline"] });
    },
  });

  const deleteEvent = useMutation({
    mutationFn: async (id) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete timeline event");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeline"] });
    },
  });

  return {
    events: timelineQuery.data || [],
    isLoading: timelineQuery.isLoading,
    createEvent,
    updateEvent,
    deleteEvent,
  };
}
