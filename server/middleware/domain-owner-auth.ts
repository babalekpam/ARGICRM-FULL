import { RequestHandler } from 'express';

/**
 * Middleware to verify domain ownership for security.argilette.org
 * Provides full access to platform owner without subscription requirements
 * while enforcing subscription requirements for tenant users
 */
export const domainOwnerAuth: RequestHandler = (req, res, next) => {
  const userEmail = req.headers['x-user-email'] as string || req.headers['x-auth-email'] as string;
  const subdomain = req.headers['host']?.split('.')[0] || req.query.subdomain as string;
  
  // Check if accessing security.argilette.org subdomain
  const isSecurityDomain = subdomain === 'security' || req.path.includes('argilette-security-org');
  
  if (!isSecurityDomain) {
    return next();
  }

  // Platform owner gets full access without subscription requirements
  const isPlatformOwner = userEmail === 'abel@argilette.com' || 
                         userEmail?.includes('argilette.com') ||
                         req.user?.role === 'platform_owner';

  if (isPlatformOwner) {
    // Grant full owner access
    req.user = {
      ...req.user,
      id: 'platform-owner-1',
      email: userEmail || 'abel@argilette.com',
      role: 'platform_owner',
      isPlatformOwner: true,
      subscriptionStatus: 'owner_access',
      hasFullAccess: true,
      accessLevel: 'owner'
    };
    return next();
  }

  // For tenant users, check subscription status
  const subscriptionStatus = req.user?.subscriptionStatus;
  const hasValidSubscription = ['enterprise', 'ultimate', 'security_professional', 'security_enterprise'].includes(subscriptionStatus);

  if (!hasValidSubscription) {
    return res.status(403).json({
      error: 'Security platform access requires subscription',
      message: 'This security platform requires an active subscription. Please upgrade your plan to access security monitoring features.',
      requiredPlans: ['Security Professional', 'Security Enterprise', 'Enterprise', 'Ultimate'],
      upgradeUrl: '/pricing?category=security'
    });
  }

  // Grant limited tenant access
  req.user = {
    ...req.user,
    accessLevel: 'tenant',
    hasFullAccess: false
  };

  next();
};

/**
 * Check if user has owner-level access to security platform
 */
export const hasOwnerAccess = (req: any): boolean => {
  const userEmail = req.headers['x-user-email'] as string || req.headers['x-auth-email'] as string;
  return userEmail === 'abel@argilette.com' || 
         userEmail?.includes('argilette.com') ||
         req.user?.role === 'platform_owner' ||
         req.user?.accessLevel === 'owner';
};

/**
 * Middleware to require owner access for specific routes
 */
export const requireOwnerAccess: RequestHandler = (req, res, next) => {
  if (!hasOwnerAccess(req)) {
    return res.status(403).json({
      error: 'Owner access required',
      message: 'This feature is restricted to domain owners only.'
    });
  }
  next();
};