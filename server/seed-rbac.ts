/**
 * RBAC Seeding Functions
 * 
 * This module provides functions to seed default permissions and roles for the RBAC system.
 * 
 * Functions:
 * - seedPermissions(): Seeds all system permissions into the permissions table
 * - seedSystemRoles(tenantId): Creates default system roles for a tenant
 * - initializeRBAC(): Initializes the RBAC system (called on server startup)
 * - seedRBACForNewTenant(tenantId): Seeds roles for a new tenant (called on tenant creation)
 */

import { db } from './db.js';
import { permissions, roles } from '../shared/schema.js';
import { 
  PERMISSIONS, 
  SYSTEM_ROLES, 
  DEFAULT_ROLE_PERMISSIONS,
  getPermissionLabel 
} from '../shared/permissions.js';
import { eq, sql } from 'drizzle-orm';

/**
 * Seeds all system permissions into the permissions table
 * This should be called once during initial system setup
 * Permissions are global across all tenants
 */
export async function seedPermissions(): Promise<void> {
  try {
    
    // Get all permissions from PERMISSIONS constant
    const permissionEntries = Object.entries(PERMISSIONS).map(([key, value]) => {
      const [module, action] = value.split('.');
      return {
        id: value, // e.g., "contacts.create"
        name: getPermissionLabel(value), // e.g., "Contacts - Create"
        description: `Permission to ${action} ${module}`,
        module,
        action
      };
    });

    // Insert permissions (ignore duplicates)
    for (const permission of permissionEntries) {
      await db
        .insert(permissions)
        .values(permission)
        .onConflictDoNothing()
        .catch((err) => {
          // Permission might already exist, that's okay
          if (!err.message.includes('duplicate key')) {
            console.error(`Error inserting permission ${permission.id}:`, err);
          }
        });
    }

  } catch (error) {
    console.error('❌ Error seeding permissions:', error);
    throw error;
  }
}

/**
 * Seeds system roles for a specific tenant
 * Creates: platform_owner, admin, manager, user, viewer roles with their default permissions
 * 
 * @param tenantId - The tenant ID to create roles for
 */
export async function seedSystemRoles(tenantId: string): Promise<void> {
  try {

    const systemRoles = [
      {
        name: 'Platform Owner',
        roleKey: SYSTEM_ROLES.PLATFORM_OWNER,
        description: 'Unrestricted super admin with access to everything across all tenants',
        permissions: DEFAULT_ROLE_PERMISSIONS[SYSTEM_ROLES.PLATFORM_OWNER]
      },
      {
        name: 'Admin',
        roleKey: SYSTEM_ROLES.ADMIN,
        description: 'Full tenant administrator with access to all features and settings',
        permissions: DEFAULT_ROLE_PERMISSIONS[SYSTEM_ROLES.ADMIN]
      },
      {
        name: 'Manager',
        roleKey: SYSTEM_ROLES.MANAGER,
        description: 'Department or team manager with elevated permissions',
        permissions: DEFAULT_ROLE_PERMISSIONS[SYSTEM_ROLES.MANAGER]
      },
      {
        name: 'User',
        roleKey: SYSTEM_ROLES.USER,
        description: 'Standard user with basic CRM and task permissions',
        permissions: DEFAULT_ROLE_PERMISSIONS[SYSTEM_ROLES.USER]
      },
      {
        name: 'Viewer',
        roleKey: SYSTEM_ROLES.VIEWER,
        description: 'Read-only access to most resources',
        permissions: DEFAULT_ROLE_PERMISSIONS[SYSTEM_ROLES.VIEWER]
      }
    ];

    let createdCount = 0;
    
    for (const role of systemRoles) {
      // Check if role already exists for this tenant
      const existingRole = await db
        .select()
        .from(roles)
        .where(
          sql`${roles.tenantId} = ${tenantId} AND ${roles.name} = ${role.name}`
        )
        .limit(1);

      if (existingRole.length > 0) {
        continue;
      }

      // Create the system role
      await db.insert(roles).values({
        tenantId,
        name: role.name,
        description: role.description,
        permissions: role.permissions,
        isSystemRole: true
      });

      createdCount++;
    }

  } catch (error) {
    console.error(`❌ Error seeding system roles for tenant ${tenantId}:`, error);
    throw error;
  }
}

/**
 * Initializes the RBAC system
 * - Seeds permissions table if it's empty
 * - Should be called on server startup
 */
export async function initializeRBAC(): Promise<void> {
  try {

    // Check if permissions table is empty
    const existingPermissions = await db
      .select({ count: sql<number>`count(*)` })
      .from(permissions);

    const permissionCount = Number(existingPermissions[0]?.count || 0);

    if (permissionCount === 0) {
      await seedPermissions();
    } else {
    }

    // Note: System roles are seeded per-tenant when tenants are created
  } catch (error) {
    console.error('❌ Error initializing RBAC:', error);
    // Don't throw - we don't want to crash the server on RBAC init failure
  }
}

/**
 * Seeds RBAC data for a newly created tenant
 * This should be called whenever a new tenant is created
 * 
 * @param tenantId - The ID of the newly created tenant
 */
export async function seedRBACForNewTenant(tenantId: string): Promise<void> {
  try {

    // Ensure permissions are seeded globally (idempotent)
    const existingPermissions = await db
      .select({ count: sql<number>`count(*)` })
      .from(permissions);

    const permissionCount = Number(existingPermissions[0]?.count || 0);
    
    if (permissionCount === 0) {
      await seedPermissions();
    }

    // Seed system roles for this tenant
    await seedSystemRoles(tenantId);

  } catch (error) {
    console.error(`❌ Error setting up RBAC for tenant ${tenantId}:`, error);
    throw error;
  }
}

/**
 * Updates existing roles with latest permissions from DEFAULT_ROLE_PERMISSIONS
 * Useful for updating system roles when permissions change
 * 
 * @param tenantId - Optional: Update roles for specific tenant only
 */
export async function updateSystemRolePermissions(tenantId?: string): Promise<void> {
  try {

    const systemRolesConfig = [
      { name: 'Platform Owner', permissions: DEFAULT_ROLE_PERMISSIONS[SYSTEM_ROLES.PLATFORM_OWNER] },
      { name: 'Admin', permissions: DEFAULT_ROLE_PERMISSIONS[SYSTEM_ROLES.ADMIN] },
      { name: 'Manager', permissions: DEFAULT_ROLE_PERMISSIONS[SYSTEM_ROLES.MANAGER] },
      { name: 'User', permissions: DEFAULT_ROLE_PERMISSIONS[SYSTEM_ROLES.USER] },
      { name: 'Viewer', permissions: DEFAULT_ROLE_PERMISSIONS[SYSTEM_ROLES.VIEWER] }
    ];

    for (const roleConfig of systemRolesConfig) {
      const query = tenantId
        ? sql`${roles.name} = ${roleConfig.name} AND ${roles.tenantId} = ${tenantId} AND ${roles.isSystemRole} = true`
        : sql`${roles.name} = ${roleConfig.name} AND ${roles.isSystemRole} = true`;

      const result = await db
        .update(roles)
        .set({
          permissions: roleConfig.permissions,
          updatedAt: new Date()
        })
        .where(query);

    }

  } catch (error) {
    console.error('❌ Error updating system role permissions:', error);
    throw error;
  }
}
