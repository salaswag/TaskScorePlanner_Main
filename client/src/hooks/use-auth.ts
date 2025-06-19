
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

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        localStorage.setItem('firebase-token', token);
        
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email || undefined,
          isAnonymous: firebaseUser.isAnonymous
        });
      } else {
        localStorage.removeItem('firebase-token');
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sign in anonymously if no user exists
  useEffect(() => {
    const signInAnonymouslyIfNeeded = async () => {
      if (!isLoading && !user) {
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error('Anonymous sign in failed:', error);
          setIsLoading(false);
        }
      }
    };

    signInAnonymouslyIfNeeded();
  }, [isLoading, user]);

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      if (firebaseUser?.isAnonymous) {
        // Link anonymous account with email/password
        const credential = EmailAuthProvider.credential(data.email, data.password);
        try {
          await linkWithCredential(firebaseUser, credential);
        } catch (error: any) {
          if (error.code === 'auth/email-already-in-use') {
            // Sign in to existing account and transfer data
            const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
            // Transfer anonymous user data
            await transferAnonymousData(firebaseUser.uid, userCredential.user.uid);
          } else {
            throw error;
          }
        }
      } else {
        await signInWithEmailAndPassword(auth, data.email, data.password);
      }
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
