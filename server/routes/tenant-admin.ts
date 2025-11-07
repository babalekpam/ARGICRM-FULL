import { Router } from 'express';
import { storage } from '../storage.js';
import { TenantRequest, requireRole, requirePermission } from '../middleware/tenant.js';
import { authenticate } from '../middleware/auth.js';
import { hashPassword } from '../middleware/auth.js';

const router = Router();

// Apply authentication and tenant validation to all routes
router.use(authenticate);
router.use(requireRole(['platform_owner', 'admin']));

// Get tenant dashboard overview
router.get('/dashboard', async (req: TenantRequest, res) => {
  try {
    const tenantId = req.tenant!.id;
    
    const [
      userCount,
      contactCount,
      dealCount,
      recentActivity
    ] = await Promise.all([
      storage.getUserCountByTenant(tenantId),
      storage.getContactCountByTenant(tenantId),
      storage.getDealCountByTenant(tenantId),
      storage.getRecentActivityByTenant(tenantId, 10)
    ]);

    res.json({
      tenant: req.tenant,
      stats: {
        users: userCount,
        contacts: contactCount,
        deals: dealCount
      },
      recentActivity
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

// User management - Super admin only
router.get('/users', requireRole('platform_owner'), async (req: TenantRequest, res) => {
  try {
    const users = await storage.getUsersByTenant(req.tenant!.id);
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

router.post('/users', requireRole('platform_owner'), async (req: TenantRequest, res) => {
  try {
    const { email, firstName, lastName, password, role } = req.body;
    
    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, password, and role required' });
    }

    // Check if user already exists
    const existingUser = await storage.getUserByEmailAndTenant(email, req.tenant!.id);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hashedPassword = await hashPassword(password);
    const user = await storage.createUser({
      tenantId: req.tenant!.id,
      email,
      firstName,
      lastName,
      passwordHash: hashedPassword,
      role,
      isActive: true
    });

    res.status(201).json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

router.put('/users/:userId', requireRole('platform_owner'), async (req: TenantRequest, res) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, role, isActive } = req.body;

    // CRITICAL: Get the target user first to check if they are protected
    const targetUser = await storage.getUserById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // ACCOUNT PROTECTION: Platform owner is the unique super admin account
    // Use email-based protection (immutable identifier)
    // Only abel@argilette.com is the platform owner - cannot be deactivated OR have role changed
    const isPlatformOwner = targetUser.email === 'abel@argilette.com';

    if (isPlatformOwner) {
      // Block deactivation attempts (strict check to prevent type coercion bypass)
      if (isActive !== undefined && isActive !== true) {
        return res.status(403).json({ 
          error: 'Platform owner account cannot be deactivated for security reasons'
        });
      }
      
      // Block role changes (strict check prevents null/empty string bypass)
      if (role !== undefined && role !== targetUser.role) {
        return res.status(403).json({ 
          error: 'Platform owner account role cannot be changed for security reasons'
        });
      }
    }

    const user = await storage.updateUser(userId, {
      firstName,
      lastName,
      role,
      isActive
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error: any) {
    console.error('Update user error:', error);
    // Return proper error codes from storage layer
    if (error.message && error.message.includes('cannot be deactivated')) {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Role management
router.get('/roles', async (req: TenantRequest, res) => {
  try {
    const roles = await storage.getRolesByTenant(req.tenant!.id);
    res.json(roles);
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({ error: 'Failed to get roles' });
  }
});

router.post('/roles', requireRole('platform_owner'), async (req: TenantRequest, res) => {
  try {
    const { name, description, permissions } = req.body;
    
    if (!name || !permissions) {
      return res.status(400).json({ error: 'Name and permissions required' });
    }

    const role = await storage.createRole({
      tenantId: req.tenant!.id,
      name,
      description,
      permissions,
      isSystemRole: false
    });

    res.status(201).json(role);
  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({ error: 'Failed to create role' });
  }
});

router.put('/roles/:roleId', requireRole('platform_owner'), async (req: TenantRequest, res) => {
  try {
    const { roleId } = req.params;
    const { name, description, permissions } = req.body;

    const role = await storage.updateRole(roleId, {
      name,
      description,
      permissions
    });

    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    res.json(role);
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

router.delete('/roles/:roleId', requireRole('platform_owner'), async (req: TenantRequest, res) => {
  try {
    const { roleId } = req.params;
    
    const role = await storage.getRole(roleId);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    if (role.isSystemRole) {
      return res.status(400).json({ error: 'Cannot delete system role' });
    }

    await storage.deleteRole(roleId);
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({ error: 'Failed to delete role' });
  }
});

// Permissions management
router.get('/permissions', async (req: TenantRequest, res) => {
  try {
    const permissions = await storage.getAllPermissions();
    res.json(permissions);
  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({ error: 'Failed to get permissions' });
  }
});

// Tenant settings
router.get('/settings', async (req: TenantRequest, res) => {
  try {
    res.json(req.tenant);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

router.put('/settings', requireRole('platform_owner'), async (req: TenantRequest, res) => {
  try {
    const { name, settings } = req.body;
    
    const tenant = await storage.updateTenant(req.tenant!.id, {
      name,
      settings: {
        ...req.tenant!.settings,
        ...settings
      }
    });

    res.json(tenant);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;