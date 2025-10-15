import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { TenantRequest } from '../middleware/tenant.js';
import { storage } from '../storage.js';

const router = Router();

// Get current user with permissions
router.get('/me', authenticate, async (req: TenantRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get full user details with permissions
    const userWithPermissions = await storage.getUserWithPermissions(req.user.id);
    if (!userWithPermissions) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get tenant details
    const tenant = await storage.getTenantByDomain(req.tenant?.domain || 'default');

    res.json({
      user: {
        id: userWithPermissions.id,
        email: userWithPermissions.email,
        firstName: userWithPermissions.firstName,
        lastName: userWithPermissions.lastName,
        role: userWithPermissions.role,
        permissions: userWithPermissions.permissions || []
      },
      tenant: tenant ? {
        id: tenant.id,
        name: tenant.name,
        domain: tenant.domain,
        settings: tenant.settings
      } : null
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to get user data' });
  }
});

export default router;