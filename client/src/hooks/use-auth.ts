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
      return 'Firebase authentication is not properly configured. Please contact support.';
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
    console.log('🔧 Setting up Firebase auth listener...');
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && !user.isAnonymous) {
        console.log('✅ User authenticated:', user.email);
      } else {
        console.log('👤 No user authenticated, continuing as anonymous');
      }
      setUser(user);
    });

    return () => {
      console.log('🔧 Cleaning up Firebase auth listener');
      unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoginLoading(true);
    setLoginError(null);

    try {
      console.log('🔐 Attempting login for:', email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Login successful:', userCredential.user.email);
      return userCredential.user;
    } catch (error: any) {
      console.error('❌ Login failed:', error.code, '-', error.message);
      const errorCode = error.code || 'unknown';
      const friendlyMessage = getErrorMessage(errorCode);
      console.log('🔄 Displaying error to user:', friendlyMessage);
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
      console.log('📝 Attempting signup for:', email);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('✅ Signup successful:', userCredential.user.email);
      return userCredential.user;
    } catch (error: any) {
      console.error('❌ Signup failed:', error.code, '-', error.message);
      const errorCode = error.code || 'unknown';
      const friendlyMessage = getErrorMessage(errorCode);
      console.log('🔄 Displaying error to user:', friendlyMessage);
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