import { auth } from '@/lib/firebase-config';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { useState, useEffect, useCallback } from 'react';

// Detect Brave browser
const isBrave = () => {
  return (navigator.brave && navigator.brave.isBrave) || false;
};

// Check if storage is available (Brave can block this)
const isStorageAvailable = (type: 'localStorage' | 'sessionStorage') => {
  try {
    const storage = window[type];
    const x = '__storage_test__';
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (e) {
    return false;
  }
};

// Safe storage operations with fallbacks for Brave
const safeStorageOperation = (operation: () => void, fallback?: () => void) => {
  try {
    if (isBrave() && !isStorageAvailable('localStorage')) {
      console.log('🦁 Brave browser detected - storage blocked, using fallback');
      if (fallback) fallback();
      return;
    }
    operation();
  } catch (error) {
    console.warn('Storage operation failed:', error);
    if (fallback) fallback();
  }
};

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

    // Check if Firebase auth is available (might be blocked in Brave)
    if (!auth) {
      console.log('🦁 Firebase auth not available - likely blocked by Brave Shields');
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Detect any user change that requires data clearing
      if (previousUser && user) {
        const userIdChanged = previousUser.uid !== user.uid;
        const authStatusChanged = previousUser.isAnonymous !== user.isAnonymous;

        if (userIdChanged || authStatusChanged) {
          console.log('🔄 User/auth change detected, clearing data...');
          console.log(`Previous: ${previousUser.uid} (anonymous: ${previousUser.isAnonymous})`);
          console.log(`Current: ${user.uid} (anonymous: ${user.isAnonymous})`);

          // Clear all cached data immediately with Brave compatibility
          if (typeof window !== 'undefined') {
            safeStorageOperation(() => {
              sessionStorage.removeItem('currentUser');
              sessionStorage.removeItem('authToken');
              localStorage.removeItem('user-tasks');
              localStorage.removeItem('user-preferences');
            });

            // Force task refresh for user changes
            if (typeof window !== 'undefined') {
              // Use a small delay to ensure auth state is fully updated
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('auth-state-changed', {
                  detail: { user, previousUser }
                }));
              }, 200);
            }
          }
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
      if (!auth) {
        throw new Error('auth/service-unavailable');
      }

      console.log('🔐 Attempting login for:', email);
      if (isBrave()) {
        console.log('🦁 Brave browser detected - using enhanced auth flow');
      }
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Login successful:', userCredential.user.email);
      return userCredential.user;
    } catch (error: any) {
      console.error('❌ Login failed:', error.code, '-', error.message);
      const errorCode = error.code || 'unknown';
      
      // Special handling for Brave-specific errors
      if (isBrave() && (errorCode === 'auth/network-request-failed' || errorCode === 'auth/service-unavailable')) {
        setLoginError('Brave browser detected. Please disable Brave Shields for this site or try a different browser.');
      } else {
        const friendlyMessage = getErrorMessage(errorCode);
        console.log('🔄 Displaying error to user:', friendlyMessage);
        setLoginError(friendlyMessage);
      }
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
      const previousUser = user; // Store current user before logout

      // Clear session data immediately before signing out with Brave compatibility
      if (typeof window !== 'undefined') {
        safeStorageOperation(() => {
          sessionStorage.removeItem('currentUser');
          sessionStorage.removeItem('authToken');
          localStorage.removeItem('user-tasks');
          localStorage.removeItem('user-preferences');
        });
      }

      await signOut(auth);
      console.log('✅ Logout successful');

      // Force page reload to ensure clean state
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('auth-state-changed', {
            detail: { user: null, previousUser }
          }));
        }, 50); // Reduced delay for faster response
      }
    } catch (error: any) {
      console.error('❌ Logout failed:', error.message);
      throw error;
    }
  }, [user]);

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