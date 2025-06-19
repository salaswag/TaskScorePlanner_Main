import { QueryClient } from "@tanstack/react-query";
import { auth } from './firebase-config.js';

export async function apiRequest(url: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add Firebase token if user is authenticated
  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      // Always try to get token, even for anonymous users in case they were upgraded
      const idToken = await currentUser.getIdToken(false); // false = don't force refresh
      headers['Authorization'] = `Bearer ${idToken}`;
    } catch (error) {
      // Silently handle token errors for anonymous users
      if (!currentUser.isAnonymous) {
        console.error('Failed to get ID token:', error);
      }
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const response = await apiRequest(queryKey[0] as string);
        return response.json();
      },
    },
  },
});