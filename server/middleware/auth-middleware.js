
import { auth } from '../firebase-admin.js';

// Cache anonymous user to prevent excessive logging
let hasLoggedAnonymousWarning = false;

export async function verifyFirebaseToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = req.headers['x-firebase-token'] || 
                  (authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null);

    if (!token) {
      // No token provided - create anonymous user session
      req.user = {
        uid: 'anonymous',
        email: null,
        isAnonymous: true
      };
      
      // Only log once to prevent spam
      if (!hasLoggedAnonymousWarning) {
        console.log('No token provided, using anonymous user (further anonymous requests will be silent)');
        hasLoggedAnonymousWarning = true;
      }
      return next();
    }

    try {
      const decodedToken = await auth.verifyIdToken(token);
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        isAnonymous: decodedToken.firebase?.sign_in_provider === 'anonymous'
      };
      console.log('Token verified successfully for user:', req.user.uid);
      // Reset anonymous warning flag since we have a real user
      hasLoggedAnonymousWarning = false;
    } catch (error) {
      console.error('Firebase token verification failed:', error.message);
      // If token verification fails, treat as anonymous
      req.user = {
        uid: 'anonymous',
        email: null,
        isAnonymous: true
      };
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    req.user = {
      uid: 'anonymous',
      email: null,
      isAnonymous: true
    };
    next();
  }
}
