import { admin } from '../firebase-admin.js';

// Cache for anonymous users to avoid repeated logs
const loggedAnonymousUsers = new Set();
const lastLogTime = new Map();

export const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Only log once per IP to reduce spam
      if (!loggedAnonymousUsers.has(clientIP)) {
        console.log(`👤 No token provided, using anonymous user for IP: ${clientIP}`);
        loggedAnonymousUsers.add(clientIP);
      }

      req.user = { 
        uid: `anonymous-${clientIP}`, 
        email: null, 
        isAnonymous: true 
      };
      return next();
    }

    const token = authHeader.split(' ')[1];
    console.log('🔐 Verifying Firebase token...');
    const decodedToken = await admin.auth().verifyIdToken(token);

    console.log(`✅ Token verified for user: ${decodedToken.email}`);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      isAnonymous: false
    };

    next();
  } catch (error) {
    console.error('❌ Token verification failed:', error.code || 'unknown', '-', error.message);

    // Fall back to anonymous user on error
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    console.log(`🔄 Falling back to anonymous user for IP: ${clientIP}`);
    req.user = { 
      uid: `anonymous-${clientIP}`, 
      email: null, 
      isAnonymous: true 
    };
    next();
  }
};