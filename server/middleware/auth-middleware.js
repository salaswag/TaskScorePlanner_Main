
import { auth } from '../firebase-admin.js';

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
      return next();
    }

    try {
      const decodedToken = await auth.verifyIdToken(token);
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        isAnonymous: decodedToken.firebase?.sign_in_provider === 'anonymous'
      };
    } catch (error) {
      console.error('Firebase token verification failed:', error);
      // If token verification fails, treat as anonymous
      req.user = {
        uid: 'anonymous',
        email: null,
        isAnonymous: true
      };
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    req.user = {
      uid: 'anonymous',
      email: null,
      isAnonymous: true
    };
    next();
  }
}
