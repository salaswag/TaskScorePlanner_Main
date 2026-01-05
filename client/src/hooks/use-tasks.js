import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import * as React from "react";
const { useRef, useEffect } = React;

// Local storage helpers for anonymous users
const getAnonymousTasks = () => {
  try {
    const tasks = localStorage.getItem('anonymous_tasks');
    return tasks ? JSON.parse(tasks) : [];
  } catch (error) {
    console.error('Error reading anonymous tasks from localStorage:', error);
    return [];
  }
};

const saveAnonymousTasks = (tasks) => {
  try {
    localStorage.setItem('anonymous_tasks', JSON.stringify(tasks));
  } catch (error) {
    console.error('Error saving anonymous tasks to localStorage:', error);
  }
};

const generateLocalId = () => {
  return Date.now() + Math.random();
};

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
      const isAnonymous = user?.isAnonymous || !user;
      
      console.log('🔍 Fetching tasks for user:', currentUserId, 'anonymous:', isAnonymous);
      
      // For anonymous users, use localStorage
      if (isAnonymous) {
        const localTasks = getAnonymousTasks();
        console.log('📋 Fetched tasks from localStorage (anonymous):', localTasks.length, 'tasks');
        return localTasks;
      }
      
      // For authenticated users, use server API
      const response = await apiRequest("/api/tasks");
      const data = await response.json();
      console.log('📋 Fetched tasks from server (authenticated):', data.length, 'tasks');
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
      const isAnonymous = user?.isAnonymous || !user;
      
      // For anonymous users, save to localStorage
      if (isAnonymous) {
        const currentTasks = getAnonymousTasks();
        const newTask = {
          id: generateLocalId(),
          ...taskData,
          createdAt: new Date().toISOString(),
          completed: false,
          isLater: Boolean(taskData.isLater),
          isFocus: Boolean(taskData.isFocus),
          actualTime: null,
          distractionLevel: null,
          completedAt: null,
        };
        
        currentTasks.push(newTask);
        saveAnonymousTasks(currentTasks);
        console.log('Anonymous task created in localStorage:', newTask);
        return newTask;
      }
      
      // For authenticated users, use server API
      try {
        const response = await apiRequest("/api/tasks", {
          method: "POST",
          body: JSON.stringify(taskData)
        });
        const result = await response.json();
        console.log('Authenticated task created on server:', result);
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
      const isAnonymous = user?.isAnonymous || !user;
      
      // For anonymous users, update in localStorage
      if (isAnonymous) {
        const currentTasks = getAnonymousTasks();
        const taskIndex = currentTasks.findIndex(task => task.id === taskData.id);
        
        if (taskIndex === -1) {
          throw new Error('Task not found in local storage');
        }
        
        // Handle completion timestamp
        const updateFields = { ...taskData };
        if (updateFields.completed === true && !updateFields.completedAt) {
          updateFields.completedAt = new Date().toISOString();
        } else if (updateFields.completed === false) {
          updateFields.completedAt = null;
        }
        
        // Ensure boolean fields are properly handled
        if (updateFields.isLater !== undefined) {
          updateFields.isLater = Boolean(updateFields.isLater);
        }
        if (updateFields.isFocus !== undefined) {
          updateFields.isFocus = Boolean(updateFields.isFocus);
        }
        if (updateFields.completed !== undefined) {
          updateFields.completed = Boolean(updateFields.completed);
        }
        
        const updatedTask = { ...currentTasks[taskIndex], ...updateFields };
        currentTasks[taskIndex] = updatedTask;
        saveAnonymousTasks(currentTasks);
        console.log('Anonymous task updated in localStorage:', updatedTask);
        return updatedTask;
      }
      
      // For authenticated users, use server API
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
      const isAnonymous = user?.isAnonymous || !user;
      
      // For anonymous users, delete from localStorage
      if (isAnonymous) {
        const currentTasks = getAnonymousTasks();
        const filteredTasks = currentTasks.filter(task => task.id !== taskId);
        saveAnonymousTasks(filteredTasks);
        console.log('Anonymous task deleted from localStorage:', taskId);
        return taskId;
      }
      
      // For authenticated users, use server API
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
      const isAnonymous = user?.isAnonymous || !user;
      
      // For anonymous users, just delete from localStorage (no archive support)
      if (isAnonymous) {
        const currentTasks = getAnonymousTasks();
        const filteredTasks = currentTasks.filter(task => task.id !== taskId);
        saveAnonymousTasks(filteredTasks);
        console.log('Anonymous task "archived" (deleted) from localStorage:', taskId);
        return { message: "Task archived successfully" };
      }
      
      // For authenticated users, use server API
      const response = await apiRequest(`/api/tasks/${taskId}/archive`, {
        method: "POST",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  // Transfer anonymous tasks to authenticated account
  const transferAnonymousData = useMutation({
    mutationFn: async () => {
      const anonymousTasks = getAnonymousTasks();
      if (anonymousTasks.length === 0) {
        return { transferred: 0 };
      }

      let transferred = 0;
      for (const task of anonymousTasks) {
        try {
          // Remove the local ID and let server assign new one
          const { id, ...taskData } = task;
          await apiRequest("/api/tasks", {
            method: "POST",
            body: JSON.stringify(taskData)
          });
          transferred++;
        } catch (error) {
          console.error('Failed to transfer task:', task.title, error);
        }
      }

      // Clear localStorage after successful transfer
      if (transferred > 0) {
        localStorage.removeItem('anonymous_tasks');
        console.log(`Transferred ${transferred} tasks and cleared localStorage`);
      }

      return { transferred };
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
    transferAnonymousData,
    mainTasks,
    laterTasks,
    focusTasks,
  };
}