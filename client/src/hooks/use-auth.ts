import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInAnonymously,
  linkWithCredential,
  EmailAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { auth } from "@/lib/firebase-config";

type User = {
  id: string;
  email?: string;
  isAnonymous: boolean;
};

export function useAuth() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [previousAnonymousUid, setPreviousAnonymousUid] = useState<string | null>(null);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check if this is a newly authenticated user who was previously anonymous
        if (previousAnonymousUid && !user.isAnonymous && user.uid !== previousAnonymousUid) {
          console.log('User authenticated, transferring data from anonymous session');
          await transferAnonymousData(previousAnonymousUid, user.uid);
          setPreviousAnonymousUid(null);
        }

        setFirebaseUser(user);
        setUser({
          id: user.uid,
          email: user.email || undefined,
          isAnonymous: user.isAnonymous
        });
      } else {
        // Don't try anonymous sign-in if it's not configured
        // Just set user to null and continue
        console.log('No user authenticated, continuing as anonymous');
        setFirebaseUser(null);
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [previousAnonymousUid]);

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      // Store current user state for potential data transfer
      const currentUser = firebaseUser;
      if (currentUser && !currentUser.email) {
        // This could be an anonymous user or unauthenticated state
        setPreviousAnonymousUid(currentUser.uid || 'anonymous');
      }

      await signInWithEmailAndPassword(auth, data.email, data.password);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    },
    onError: (error: any) => {
      console.error('Login failed:', error.message);
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      if (firebaseUser?.isAnonymous) {
        // Link anonymous account with email/password
        const credential = EmailAuthProvider.credential(data.email, data.password);
        await linkWithCredential(firebaseUser, credential);
      } else {
        await createUserWithEmailAndPassword(auth, data.email, data.password);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    },
    onError: (error: any) => {
      console.error('Signup failed:', error.message);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await firebaseSignOut(auth);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    },
  });

  const transferAnonymousData = async (anonymousUid: string, permanentUid: string) => {
    try {
      const response = await fetch('/api/auth/transfer-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`
        },
        body: JSON.stringify({ anonymousUid, permanentUid })
      });

      if (!response.ok) {
        console.error('Failed to transfer anonymous data');
      }
    } catch (error) {
      console.error('Error transferring data:', error);
    }
  };

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