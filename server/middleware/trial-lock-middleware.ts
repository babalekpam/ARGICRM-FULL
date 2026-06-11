import type { Request, Response, NextFunction } from 'express';

// NOTE: There is no subscription-service module in this codebase yet.
// This local stub fails open (no locking) so the middleware never blocks
// requests until a real subscription service is implemented.
interface AccountLockStatus {
  locked: boolean;
  reason: string | null;
  daysLocked: number;
}

const subscriptionService = {
  async isAccountLocked(_userId: string): Promise<AccountLockStatus> {
    return { locked: false, reason: null, daysLocked: 0 };
  },
  async isTrialExpired(_userId: string): Promise<boolean> {
    return false;
  },
  async lockAccountForExpiredTrial(_userId: string): Promise<void> {
    // no-op until a real subscription service exists
  },
  async getTrialRemainingDays(_userId: string): Promise<number | null> {
    return null;
  },
};

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    tenantId: string;
  };
}

// Middleware to check trial status and lock account if expired
export const trialLockMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // Skip trial lock for e-commerce demo and testing
  const isEcommerceRoute = req.path.startsWith('/api/stores') || 
                          req.path.startsWith('/e-commerce') ||
                          req.path.startsWith('/api/analytics') ||
                          req.path.startsWith('/api/products') ||
                          req.path.startsWith('/api/orders') ||
                          req.path.startsWith('/api/customers') ||
                          req.path.startsWith('/api/categories');
  if (isEcommerceRoute) {
    // Set demo user context for e-commerce routes
    req.headers['x-user-email'] = req.headers['x-user-email'] || 'demo@nodecrm.com';
    req.headers['x-auth-email'] = req.headers['x-auth-email'] || 'demo@nodecrm.com';
    return next();
  }
  try {
    // Skip for platform owners and certain routes
    if (!req.user || req.user.role === 'platform_owner') {
      return next();
    }

    // Skip for authentication and payment-related routes
    const skipRoutes = [
      '/api/auth/',
      '/api/subscription/',
      '/api/trial/',
      '/api/payment/',
      '/api/ecommerce/create-payment',
      '/api/unlock-account'
    ];

    const shouldSkip = skipRoutes.some(route => req.path.startsWith(route));
    if (shouldSkip) {
      return next();
    }

    // Check if account is locked
    const lockStatus = await subscriptionService.isAccountLocked(req.user.id).catch(error => {
      console.error('Error checking lock status:', error);
      return { locked: false, reason: null, daysLocked: 0 };
    });
    
    if (lockStatus.locked) {
      return res.status(423).json({
        success: false,
        error: 'account_locked',
        message: 'Your account has been locked due to trial expiration. Please add payment information to continue.',
        lockReason: lockStatus.reason,
        daysLocked: lockStatus.daysLocked,
        unlockUrl: '/unlock-account'
      });
    }

    // Check if trial is expired and needs to be locked
    const isTrialExpired = await subscriptionService.isTrialExpired(req.user.id);
    
    if (isTrialExpired) {
      // Lock the account
      await subscriptionService.lockAccountForExpiredTrial(req.user.id);
      
      return res.status(423).json({
        success: false,
        error: 'trial_expired',
        message: 'Your free trial has expired. Please upgrade to a paid plan to continue using ARGILETTE CRM.',
        unlockUrl: '/unlock-account'
      });
    }

    // Check trial remaining days for warnings
    const remainingDays = await subscriptionService.getTrialRemainingDays(req.user.id);
    
    if (remainingDays !== null && remainingDays <= 3 && remainingDays > 0) {
      // Add warning header for frontend to display trial expiration warning
      res.setHeader('X-Trial-Warning', `${remainingDays} days remaining`);
      res.setHeader('X-Trial-Days-Remaining', remainingDays.toString());
    }

    next();
  } catch (error) {
    console.error('Trial lock middleware error:', error);
    // Don't block the request on middleware errors
    next();
  }
};

// Middleware specifically for critical operations that require active subscription
export const requireActiveSubscription = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user || req.user.role === 'platform_owner') {
      return next();
    }

    const lockStatus = await subscriptionService.isAccountLocked(req.user.id);
    const isTrialExpired = await subscriptionService.isTrialExpired(req.user.id);

    if (lockStatus.locked || isTrialExpired) {
      return res.status(402).json({
        success: false,
        error: 'payment_required',
        message: 'This feature requires an active subscription. Please upgrade your plan.',
        unlockUrl: '/unlock-account'
      });
    }

    next();
  } catch (error) {
    console.error('Active subscription middleware error:', error);
    next();
  }
};