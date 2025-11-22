import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthUser, verifyToken } from './auth.js';

interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

// SECURITY: JWT_SECRET is required - fail fast if not set
const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || (() => {
  throw new Error('CRITICAL SECURITY ERROR: JWT_SECRET or SESSION_SECRET environment variable must be set');
})();
const SECURE_COOKIE_NAME = 'auth_token';

// Secure cookie options
const SECURE_COOKIE_OPTIONS = {
  httpOnly: true, // Prevents XSS attacks
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: 'strict' as const, // CSRF protection
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  path: '/'
};

// Set secure authentication cookie
export function setSecureAuthCookie(res: Response, token: string) {
  res.cookie(SECURE_COOKIE_NAME, token, SECURE_COOKIE_OPTIONS);
}

// Clear authentication cookie
export function clearAuthCookie(res: Response) {
  res.clearCookie(SECURE_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  });
}

// Secure authentication middleware using httpOnly cookies
export function secureAuthenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    // Try to get token from secure cookie first
    let token = req.cookies?.[SECURE_COOKIE_NAME];
    
    // Fallback to Authorization header for API compatibility
    if (!token) {
      const authHeader = req.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify the token
    const decoded = verifyToken(token);
    
    // Set user data on request
    req.user = {
      id: decoded.userId || decoded.id,
      tenantId: decoded.tenantId,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions || []
    };

    next();
  } catch (error) {
    // Clear invalid cookie
    clearAuthCookie(res);
    
    return res.status(401).json({ error: 'Invalid authentication' });
  }
}

// Optional authentication (doesn't fail if no token)
export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    // Try to get token from secure cookie first
    let token = req.cookies?.[SECURE_COOKIE_NAME];
    
    // Fallback to Authorization header
    if (!token) {
      const authHeader = req.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (token) {
      try {
        const decoded = verifyToken(token);
        req.user = {
          id: decoded.userId || decoded.id,
          tenantId: decoded.tenantId,
          email: decoded.email,
          role: decoded.role,
          permissions: decoded.permissions || []
        };
      } catch {
        // Invalid token - clear it but continue
        clearAuthCookie(res);
      }
    }

    next();
  } catch (error) {
    // On any error, just continue without authentication
    next();
  }
}

// Generate secure token with enhanced payload
export function generateSecureToken(user: AuthUser): string {
  return jwt.sign(
    {
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      iat: Math.floor(Date.now() / 1000)
    },
    JWT_SECRET,
    { 
      expiresIn: '24h',
      issuer: 'argilette-crm',
      audience: 'argilette-users'
    }
  );
}

// Secure logout handler
export function secureLogout(req: Request, res: Response) {
  clearAuthCookie(res);
  res.json({ success: true, message: 'Logged out successfully' });
}