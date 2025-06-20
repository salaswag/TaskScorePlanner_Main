import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useRef, useEffect } from "react";

const apiRequest = async (url, options = {}) => {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Get user from auth context
  const authData = JSON.parse(sessionStorage.getItem('currentUser') || 'null');

  // Add authorization header if user is authenticated
  if (authData && !authData.isAnonymous) {
    try {
      const token = sessionStorage.getItem('authToken');
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Failed to get auth token:", error);
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response;
};

export function useTasks() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const previousUserRef = useRef(null);

  // Detect user changes and clear cache immediately with forced refetch
  useEffect(() => {
    const currentUserId = user?.uid;
    const previousUserId = previousUserRef.current;
    const currentIsAnonymous = user?.isAnonymous || false;
    const previousUser = previousUserRef.current ? 
      JSON.parse(sessionStorage.getItem('currentUser') || '{}') : null;
    const previousIsAnonymous = previousUser?.isAnonymous || false;

    // Clear cache and force refetch when:
    // 1. Switching between different authenticated users
    // 2. Switching from authenticated to anonymous
    // 3. Switching from anonymous to authenticated
    // 4. Any user state change
    if (previousUserId !== null && currentUserId) {
      const userChanged = previousUserId !== currentUserId;
      const authStatusChanged = previousIsAnonymous !== currentIsAnonymous;
      
      if (userChanged || authStatusChanged) {
        console.log('🔄 User/auth status changed, clearing cache and forcing refresh...');
        console.log(`Previous: ${previousUserId} (anonymous: ${previousIsAnonymous})`);
        console.log(`Current: ${currentUserId} (anonymous: ${currentIsAnonymous})`);
        
        // Immediately clear all cached queries and data
        queryClient.clear();
        queryClient.removeQueries();
        
        // Clear session storage
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('authToken');
        
        // Force immediate refetch of tasks for the new user
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
          queryClient.refetchQueries({ queryKey: ["/api/tasks"] });
        }, 100);
      }
    }

    // Update ref before storing new user data
    previousUserRef.current = currentUserId;

    // Store user info for API requests
    if (user) {
      sessionStorage.setItem('currentUser', JSON.stringify({
        uid: user.uid,
        email: user.email,
        isAnonymous: user.isAnonymous || false
      }));

      // Store auth token if available
      if (!user.isAnonymous && user.getIdToken) {
        user.getIdToken().then(token => {
          sessionStorage.setItem('authToken', token);
        }).catch(error => {
          console.error('Failed to get auth token:', error);
        });
      }
    } else {
      // Clear session data if no user
      sessionStorage.removeItem('currentUser');
      sessionStorage.removeItem('authToken');
    }
  }, [user, queryClient]);

  // Listen for forced task refresh events
  useEffect(() => {
    const handleForceRefresh = () => {
      console.log('🔄 Forcing task refresh due to auth state change...');
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.refetchQueries({ queryKey: ["/api/tasks"] });
    };

    window.addEventListener('force-task-refresh', handleForceRefresh);
    window.addEventListener('auth-state-changed', handleForceRefresh);
    
    return () => {
      window.removeEventListener('force-task-refresh', handleForceRefresh);
      window.removeEventListener('auth-state-changed', handleForceRefresh);
    };
  }, [queryClient]);

  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ["/api/tasks", user?.uid || 'anonymous', user?.isAnonymous], // Include user ID and auth status in query key
    queryFn: async () => {
      const currentUserId = user?.uid || 'anonymous';
      console.log('🔍 Fetching tasks for user:', currentUserId, 'anonymous:', user?.isAnonymous);
      const response = await apiRequest("/api/tasks");
      const data = await response.json();
      console.log('📋 Fetched tasks for user', currentUserId, ':', data.length, 'tasks');
      return data;
    },
    staleTime: 0, // Always consider data stale to ensure fresh fetch on user change
    cacheTime: 0, // Don't cache between user switches
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Always refetch when component mounts
    enabled: true, // Always fetch tasks (for both authenticated and anonymous users)
  });

  const createTask = useMutation({
    mutationFn: async (taskData) => {
      console.log('Creating task with data:', taskData);
      try {
        const response = await apiRequest("/api/tasks", {
          method: "POST",
          body: JSON.stringify(taskData)
        });
        const result = await response.json();
        console.log('Task created successfully:', result);
        return result;
      } catch (error) {
        console.error('Task creation failed:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
    onError: (error) => {
      console.error('Task creation mutation failed:', error);
    },
  });

  const updateTask = useMutation({
    mutationFn: async (taskData) => {
      console.log('Updating task with data:', taskData);
      const response = await apiRequest(`/api/tasks/${taskData.id}`, {
        method: "PATCH",
        headers: {
          'Content-Type': 'application/json',
        },
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
      const response = await apiRequest(`/api/tasks/${taskId}/archive`, {
        method: "POST",
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