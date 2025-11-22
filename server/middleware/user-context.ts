import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

export interface AuthenticatedRequest extends Request {
  user?: {
    email: string;
    tenantId: string;
    isPlatformOwner: boolean;
  };
  storage?: DatabaseStorage;
}

export function userContextMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Extract user context from request headers or session
  const userEmail = req.headers['x-user-email'] as string || 'demo@example.com';
  const isPlatformOwner = userEmail === 'abel@argilette.com';
  
  // Generate tenant ID based on user email (simple approach for demo)
  const tenantId = isPlatformOwner ? 'platform-tenant' : `tenant-${userEmail.replace('@', '-').replace('.', '-')}`;
  
  // Set user context
  req.user = {
    email: userEmail,
    tenantId,
    isPlatformOwner
  };
  
  // Create user-specific storage instance
  req.storage = new DatabaseStorage(userEmail, tenantId, isPlatformOwner);
  
  
  next();
}