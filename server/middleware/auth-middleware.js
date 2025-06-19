import { admin } from '../firebase-admin.js';

// Cache for anonymous users to avoid repeated logs
const loggedAnonymousUsers = new Set();
const lastLogTime = new Map();
const rateLimitMap = new Map();

// Rate limiting for failed authentication attempts
const isRateLimited = (identifier) => {
  const now = Date.now();
  const attempts = rateLimitMap.get(identifier) || { count: 0, lastAttempt: now };
  
  // Reset counter if more than 15 minutes have passed
  if (now - attempts.lastAttempt > 15 * 60 * 1000) {
    rateLimitMap.set(identifier, { count: 1, lastAttempt: now });
    return false;
  }
  
  // Allow up to 10 failed attempts per 15 minutes
  if (attempts.count >= 10) {
    return true;
  }
  
  rateLimitMap.set(identifier, { count: attempts.count + 1, lastAttempt: now });
  return false;
};

export const authenticateUser = async (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  const rateLimitId = `${clientIP}-${userAgent}`;
  
  try {
    const authHeader = req.headers.authorization;
    
    // Validate user agent to prevent basic bot attacks
    if (!userAgent || userAgent === 'unknown' || userAgent.length < 10) {
      console.warn('⚠️ Suspicious user agent detected:', userAgent);
    }
    
    // Create a more unique anonymous identifier with error handling
    let anonymousId;
    try {
      anonymousId = `anonymous-${clientIP}-${Buffer.from(userAgent).toString('base64').substring(0, 8)}`;
    } catch (bufferError) {
      console.warn('⚠️ Failed to create user agent hash, using fallback');
      anonymousId = `anonymous-${clientIP}-fallback`;
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Only log once per unique anonymous ID to reduce spam
      if (!loggedAnonymousUsers.has(anonymousId)) {
        console.log(`👤 No token provided, using anonymous user: ${anonymousId}`);
        loggedAnonymousUsers.add(anonymousId);
        
        // Clean up old anonymous users periodically
        if (loggedAnonymousUsers.size > 1000) {
          loggedAnonymousUsers.clear();
          console.log('🧹 Cleared anonymous users cache');
        }
      }

      req.user = { 
        uid: anonymousId, 
        email: null, 
        isAnonymous: true 
      };
      return next();
    }

    const token = authHeader.split(' ')[1];
    
    // Validate token format
    if (!token || token.length < 100) {
      console.warn('⚠️ Invalid token format detected');
      throw new Error('Invalid token format');
    }

    // Check rate limiting for this IP/User-Agent combination
    if (isRateLimited(rateLimitId)) {
      console.warn(`🚫 Rate limit exceeded for ${rateLimitId}`);
      req.user = { 
        uid: anonymousId, 
        email: null, 
        isAnonymous: true 
      };
      return next();
    }

    console.log('🔐 Verifying Firebase token...');
    
    // Add timeout to token verification
    const verificationPromise = admin.auth().verifyIdToken(token, true);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Token verification timeout')), 10000)
    );
    
    const decodedToken = await Promise.race([verificationPromise, timeoutPromise]);

    // Validate decoded token structure
    if (!decodedToken || !decodedToken.uid || !decodedToken.email) {
      throw new Error('Invalid token structure');
    }

    // Check if token is not expired (additional safety check)
    const now = Math.floor(Date.now() / 1000);
    if (decodedToken.exp && decodedToken.exp < now) {
      throw new Error('Token expired');
    }

    console.log(`✅ Token verified for user: ${decodedToken.email}`);
    
    // Reset rate limit on successful authentication
    rateLimitMap.delete(rateLimitId);
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      isAnonymous: false,
      emailVerified: decodedToken.email_verified || false,
      authTime: decodedToken.auth_time,
      iat: decodedToken.iat,
      exp: decodedToken.exp
    };

    next();
  } catch (error) {
    // Log different types of errors with appropriate severity
    const errorCode = error.code || 'unknown';
    const errorMessage = error.message || 'Unknown error';
    
    if (errorCode === 'auth/id-token-expired') {
      console.warn('⏰ Token expired for request from:', clientIP);
    } else if (errorCode === 'auth/id-token-revoked') {
      console.warn('🚫 Token revoked for request from:', clientIP);
    } else if (errorCode === 'auth/invalid-id-token') {
      console.warn('❌ Invalid token format from:', clientIP);
    } else if (errorMessage.includes('timeout')) {
      console.error('⏱️ Token verification timeout from:', clientIP);
    } else {
      console.error('❌ Token verification failed:', errorCode, '-', errorMessage, 'from:', clientIP);
    }

    // Fall back to anonymous user on error with error handling
    let anonymousId;
    try {
      anonymousId = `anonymous-${clientIP}-${Buffer.from(userAgent).toString('base64').substring(0, 8)}`;
    } catch (bufferError) {
      anonymousId = `anonymous-${clientIP}-fallback`;
    }
    
    console.log(`🔄 Falling back to anonymous user: ${anonymousId}`);
    req.user = { 
      uid: anonymousId, 
      email: null, 
      isAnonymous: true,
      fallbackReason: errorCode || 'verification-failed'
    };
    next();
  }
};