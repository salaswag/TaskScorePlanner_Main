import { QueryClient } from "@tanstack/react-query";
import { auth } from "./firebase-config";

const API_BASE_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL;

async function apiRequest(url: string, options: RequestInit = {}): Promise<Response> {
  // Get Firebase token if user is authenticated
  const token = localStorage.getItem('firebase-token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['X-Firebase-Token'] = token;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const response = await apiRequest(queryKey[0] as string);
        return response.json();
      },
      staleTime: 1000 * 60, // 1 minute
      retry: (failureCount, error) => {
        if (error instanceof Error && error.message.includes('401')) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

export { queryClient, apiRequest };