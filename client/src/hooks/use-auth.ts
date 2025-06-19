import { auth } from '@/lib/firebase-config';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { useState, useEffect, useCallback } from 'react';

// Error message mapping for better user experience
const getErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No account found with this email address. Please sign up first.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-password':
      return 'Invalid password. Please try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please sign in instead.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    case 'auth/api-key-not-valid':
      return 'Authentication service is temporarily unavailable. Please try again later.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isSignupLoading, setIsSignupLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [signupError, setSignupError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user);
      setUser(user);
      if (!user) {
        console.log('No user authenticated, continuing as anonymous');
      }
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoginLoading(true);
    setLoginError(null);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful:', userCredential.user);
      return userCredential.user;
    } catch (error: any) {
      console.error('Login failed:', error.message);
      const errorCode = error.code || 'unknown';
      const friendlyMessage = getErrorMessage(errorCode);
      setLoginError(friendlyMessage);
      throw error;
    } finally {
      setIsLoginLoading(false);
    }
  }, []);

  const signup = useCallback(async (email: string, password: string) => {
    setIsSignupLoading(true);
    setSignupError(null);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Signup successful:', userCredential.user);
      return userCredential.user;
    } catch (error: any) {
      console.error('Signup failed:', error.message);
      const errorCode = error.code || 'unknown';
      const friendlyMessage = getErrorMessage(errorCode);
      setSignupError(friendlyMessage);
      throw error;
    } finally {
      setIsSignupLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      console.log('Logout successful');
    } catch (error: any) {
      console.error('Logout failed:', error.message);
      throw error;
    }
  }, []);

  return {
    user,
    login,
    signup,
    logout,
    isLoginLoading,
    isSignupLoading,
    loginError,
    signupError
  };
}