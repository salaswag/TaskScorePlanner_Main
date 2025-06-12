import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { loginSchema, insertUserSchema } from "@shared/schema";

type User = {
  id: string;
  username: string;
};

type AuthResponse = {
  user: User;
};

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.status === 401) return null;
        if (!response.ok) throw new Error('Failed to fetch user');
        const data = await response.json();
        return data.user;
      } catch {
        return null;
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const loginMutation = useMutation({
    mutationFn: async (data: z.infer<typeof loginSchema>) => {
      const response = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: (data: AuthResponse) => {
      queryClient.setQueryData(['/api/auth/me'], data.user);
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertUserSchema>) => {
      const response = await apiRequest('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: (data: AuthResponse) => {
      queryClient.setQueryData(['/api/auth/me'], data.user);
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/auth/logout', {
        method: 'POST',
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.setQueryData(['/api/auth/me'], null);
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    },
  });

  return {
    user,
    isLoading,
    login: loginMutation.mutate,
    signup: signupMutation.mutate,
    logout: logoutMutation.mutate,
    isLoginLoading: loginMutation.isPending,
    isSignupLoading: signupMutation.isPending,
    isLogoutLoading: logoutMutation.isPending,
    loginError: loginMutation.error,
    signupError: signupMutation.error,
  };
}