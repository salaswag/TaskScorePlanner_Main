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
      return 'No account found with this email address. Please check your email or sign up.';
    case 'auth/wrong-password':
    case 'auth/invalid-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please check your credentials and try again.';
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
      return 'Authentication service is not properly configured. Please contact support.';
    case 'auth/operation-not-allowed':
      return 'Email/password authentication is not enabled. Please contact support.';
    case 'auth/missing-password':
      return 'Please enter a password.';
    case 'auth/missing-email':
      return 'Please enter an email address.';
    default:
      console.error('Unhandled auth error code:', errorCode);
      return `Authentication error: ${errorCode}. Please try again or contact support.`;
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
    let previousUser: User | null = null;
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Detect user switching
      if (previousUser && user && 
          previousUser.uid !== user.uid && 
          !previousUser.isAnonymous && 
          !user.isAnonymous) {
        console.log('🔄 User switch detected, clearing data...');
        // Clear cached data when switching between authenticated users
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user-tasks');
          localStorage.removeItem('user-preferences');
          // Reload to start fresh with new user
          window.location.reload();
          return;
        }
      }

      if (user && !user.isAnonymous) {
        console.log('✅ User authenticated:', user.email);
      } else {
        console.log('👤 No user authenticated, continuing as anonymous');
      }
      
      previousUser = user;
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
      console.log('🔓 Starting logout process...');
      await signOut(auth);
      console.log('✅ Logout successful');
      
      // Clear any cached data and reload to start fresh as anonymous
      if (typeof window !== 'undefined') {
        // Clear any local storage related to user data
        localStorage.removeItem('user-tasks');
        localStorage.removeItem('user-preferences');
        
        // Force page reload to clear all state and start fresh as anonymous
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    } catch (error: any) {
      console.error('❌ Logout failed:', error.message);
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