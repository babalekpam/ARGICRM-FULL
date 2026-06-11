import { Request, Response, NextFunction } from 'express';
import * as storage from '../storage';

export interface AuthenticatedRequest extends Request {
  user?: {
    email: string;
    tenantId: string;
    isPlatformOwner: boolean;
  };
  storage?: typeof storage;
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

  // Attach the storage module so downstream handlers can query per-tenant data
  req.storage = storage;


  next();
}
