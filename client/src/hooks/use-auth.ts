import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
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
      setFirebaseUser(user);
      
      if (user) {
        setUser({
          id: user.uid,
          email: user.email || undefined,
          isAnonymous: user.isAnonymous
        });
        
        // Transfer data if we have a previous anonymous UID and now have a permanent user
        if (!user.isAnonymous && previousAnonymousUid && user.uid !== previousAnonymousUid) {
          try {
            const response = await fetch('/api/auth/transfer-data', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${await user.getIdToken()}`,
              },
              body: JSON.stringify({
                anonymousUid: previousAnonymousUid,
                permanentUid: user.uid,
              }),
            });

            if (response.ok) {
              console.log('Data transfer successful');
              setPreviousAnonymousUid(null);
              queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
            }
          } catch (error) {
            console.error('Failed to transfer data:', error);
          }
        }
      } else {
        // No user authenticated - treat as anonymous
        setUser({
          id: 'anonymous',
          email: undefined,
          isAnonymous: true
        });
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [previousAnonymousUid, queryClient]);

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      // Store current anonymous state for potential data transfer
      if (!firebaseUser || (!firebaseUser.email && !firebaseUser.isAnonymous)) {
        setPreviousAnonymousUid('anonymous');
      }

      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      return userCredential.user;
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