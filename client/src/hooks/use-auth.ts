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
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [authListenerError, setAuthListenerError] = useState<string | null>(null);

  useEffect(() => {
    // Monitor network connectivity
    const handleOnline = () => {
      console.log('🌐 Network connection restored');
      setIsOnline(true);
    };
    
    const handleOffline = () => {
      console.log('📵 Network connection lost');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    console.log('🔧 Setting up Firebase auth listener...');
    let previousUser: User | null = null;
    let retryCount = 0;
    const maxRetries = 3;

    const setupAuthListener = () => {
      try {
        const unsubscribe = onAuthStateChanged(auth, 
          (user) => {
            setAuthListenerError(null);
            retryCount = 0; // Reset retry count on successful connection
            
            // Detect any user change that requires data clearing
            if (previousUser && user) {
              const userIdChanged = previousUser.uid !== user.uid;
              const authStatusChanged = previousUser.isAnonymous !== user.isAnonymous;

              if (userIdChanged || authStatusChanged) {
                console.log('🔄 User/auth change detected, clearing data...');
                console.log(`Previous: ${previousUser.uid} (anonymous: ${previousUser.isAnonymous})`);
                console.log(`Current: ${user.uid} (anonymous: ${user.isAnonymous})`);

                // Clear all cached data immediately with error handling
                try {
                  if (typeof window !== 'undefined') {
                    sessionStorage.removeItem('currentUser');
                    sessionStorage.removeItem('authToken');
                    localStorage.removeItem('user-tasks');
                    localStorage.removeItem('user-preferences');

                    // Force task refresh for user changes
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent('auth-state-changed', {
                        detail: { user, previousUser }
                      }));
                    }, 200);
                  }
                } catch (storageError) {
                  console.warn('⚠️ Failed to clear storage:', storageError);
                }
              }
            }

            if (user && !user.isAnonymous) {
              console.log('✅ User authenticated:', user.email);
              
              // Validate user object structure
              if (!user.uid || !user.email) {
                console.error('❌ Invalid user object structure');
                setAuthListenerError('Invalid user data received');
                return;
              }
            } else {
              console.log('👤 No user authenticated, continuing as anonymous');
            }

            previousUser = user;
            setUser(user);
          },
          (error) => {
            console.error('❌ Auth state change error:', error);
            setAuthListenerError(error.message);
            
            // Retry logic for auth listener
            if (retryCount < maxRetries && isOnline) {
              retryCount++;
              console.log(`🔄 Retrying auth listener setup (${retryCount}/${maxRetries})...`);
              setTimeout(() => setupAuthListener(), 2000 * retryCount);
            } else {
              console.error('💥 Auth listener failed after maximum retries');
            }
          }
        );

        return unsubscribe;
      } catch (error) {
        console.error('❌ Failed to setup auth listener:', error);
        setAuthListenerError('Failed to initialize authentication');
        return null;
      }
    };

    const unsubscribe = setupAuthListener();

    return () => {
      console.log('🔧 Cleaning up Firebase auth listener');
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (error) {
          console.warn('⚠️ Error during auth listener cleanup:', error);
        }
      }
    };
  }, [isOnline]);

  const login = useCallback(async (email: string, password: string, retryCount = 0) => {
    setIsLoginLoading(true);
    setLoginError(null);

    // Input validation
    if (!email || !password) {
      const error = 'Email and password are required';
      setLoginError(error);
      setIsLoginLoading(false);
      throw new Error(error);
    }

    if (!email.includes('@') || email.length < 3) {
      const error = 'Please enter a valid email address';
      setLoginError(error);
      setIsLoginLoading(false);
      throw new Error(error);
    }

    if (!isOnline) {
      const error = 'No internet connection. Please check your network and try again.';
      setLoginError(error);
      setIsLoginLoading(false);
      throw new Error(error);
    }

    try {
      console.log('🔐 Attempting login for:', email);
      
      // Add timeout to login attempt
      const loginPromise = signInWithEmailAndPassword(auth, email, password);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Login timeout')), 30000)
      );
      
      const userCredential = await Promise.race([loginPromise, timeoutPromise]);
      
      // Validate user credential
      if (!userCredential || !userCredential.user) {
        throw new Error('Invalid login response');
      }
      
      console.log('✅ Login successful:', userCredential.user.email);
      return userCredential.user;
    } catch (error: any) {
      console.error('❌ Login failed:', error.code, '-', error.message);
      
      const errorCode = error.code || 'unknown';
      
      // Retry logic for network-related errors
      if ((errorCode === 'auth/network-request-failed' || error.message?.includes('timeout')) && retryCount < 2 && isOnline) {
        console.log(`🔄 Retrying login (${retryCount + 1}/2)...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return login(email, password, retryCount + 1);
      }
      
      const friendlyMessage = getErrorMessage(errorCode);
      console.log('🔄 Displaying error to user:', friendlyMessage);
      setLoginError(friendlyMessage);
      throw error;
    } finally {
      setIsLoginLoading(false);
    }
  }, [isOnline]);

  const signup = useCallback(async (email: string, password: string, retryCount = 0) => {
    setIsSignupLoading(true);
    setSignupError(null);

    // Input validation
    if (!email || !password) {
      const error = 'Email and password are required';
      setSignupError(error);
      setIsSignupLoading(false);
      throw new Error(error);
    }

    if (!email.includes('@') || email.length < 3) {
      const error = 'Please enter a valid email address';
      setSignupError(error);
      setIsSignupLoading(false);
      throw new Error(error);
    }

    if (password.length < 6) {
      const error = 'Password must be at least 6 characters long';
      setSignupError(error);
      setIsSignupLoading(false);
      throw new Error(error);
    }

    if (!isOnline) {
      const error = 'No internet connection. Please check your network and try again.';
      setSignupError(error);
      setIsSignupLoading(false);
      throw new Error(error);
    }

    try {
      console.log('📝 Attempting signup for:', email);
      
      // Add timeout to signup attempt
      const signupPromise = createUserWithEmailAndPassword(auth, email, password);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Signup timeout')), 30000)
      );
      
      const userCredential = await Promise.race([signupPromise, timeoutPromise]);
      
      // Validate user credential
      if (!userCredential || !userCredential.user) {
        throw new Error('Invalid signup response');
      }
      
      console.log('✅ Signup successful:', userCredential.user.email);
      return userCredential.user;
    } catch (error: any) {
      console.error('❌ Signup failed:', error.code, '-', error.message);
      
      const errorCode = error.code || 'unknown';
      
      // Retry logic for network-related errors
      if ((errorCode === 'auth/network-request-failed' || error.message?.includes('timeout')) && retryCount < 2 && isOnline) {
        console.log(`🔄 Retrying signup (${retryCount + 1}/2)...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return signup(email, password, retryCount + 1);
      }
      
      const friendlyMessage = getErrorMessage(errorCode);
      console.log('🔄 Displaying error to user:', friendlyMessage);
      setSignupError(friendlyMessage);
      throw error;
    } finally {
      setIsSignupLoading(false);
    }
  }, [isOnline]);

  const logout = useCallback(async () => {
    try {
      console.log('🔓 Starting logout process...');
      const previousUser = user; // Store current user before logout

      // Clear session data immediately before signing out
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('authToken');
        localStorage.removeItem('user-tasks');
        localStorage.removeItem('user-preferences');
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

  const logout = useCallback(async () => {
    try {
      console.log('🔓 Starting logout process...');
      const previousUser = user; // Store current user before logout

      // Clear session data immediately before signing out
      try {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('currentUser');
          sessionStorage.removeItem('authToken');
          localStorage.removeItem('user-tasks');
          localStorage.removeItem('user-preferences');
        }
      } catch (storageError) {
        console.warn('⚠️ Failed to clear storage during logout:', storageError);
      }

      // Add timeout to logout
      const logoutPromise = signOut(auth);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Logout timeout')), 10000)
      );
      
      await Promise.race([logoutPromise, timeoutPromise]);
      console.log('✅ Logout successful');

      // Force page reload to ensure clean state
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('auth-state-changed', {
            detail: { user: null, previousUser }
          }));
        }, 50);
      }
    } catch (error: any) {
      console.error('❌ Logout failed:', error.message);
      
      // Even if logout fails, clear local state
      try {
        setUser(null);
        if (typeof window !== 'undefined') {
          sessionStorage.clear();
          localStorage.removeItem('user-tasks');
          localStorage.removeItem('user-preferences');
        }
      } catch (cleanupError) {
        console.error('❌ Failed to clean up state after logout error:', cleanupError);
      }
      
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
    signupError,
    isOnline,
    authListenerError
  };
}