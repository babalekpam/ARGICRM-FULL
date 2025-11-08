import { Router, type Request, type Response } from "express";
import { db } from "../db";
import { 
  roles, 
  permissions, 
  userRoles, 
  users,
  insertRoleSchema,
  updateRoleSchema,
  type Role,
  type Permission,
  type UserRole
} from "../../shared/schema";
import { 
  PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
  SYSTEM_ROLES,
  hasPermission,
  isPlatformOwner,
  isAdmin,
  getPermissionLabel,
  getModulePermissions
} from "../../shared/permissions";
import { eq, and, sql, desc } from "drizzle-orm";
import { authenticate, type AuthUser } from "../middleware/auth";
import { z } from "zod";

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Helper to check if user has admin rights
function requireAdmin(req: Request & { user?: AuthUser }, res: Response, next: Function) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const userRole = req.user.role;
  const userEmail = req.user.email;

  if (!isPlatformOwner(userEmail) && !isAdmin(userRole)) {
    return res.status(403).json({ error: "Admin access required" });
  }

  next();
}

// ============================================================================
// ROLES MANAGEMENT
// ============================================================================

// GET /api/rbac/roles - List all roles for current tenant
router.get("/roles", async (req: Request & { user?: AuthUser }, res: Response) => {
  try {
    const user = req.user!;
    const tenantId = user.tenantId;

    const tenantRoles = await db
      .select()
      .from(roles)
      .where(eq(roles.tenantId, tenantId))
      .orderBy(desc(roles.createdAt));

    res.json(tenantRoles);
  } catch (error: any) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ error: "Failed to fetch roles" });
  }
});

// GET /api/rbac/roles/:id - Get specific role
router.get("/roles/:id", async (req: Request & { user?: AuthUser }, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const role = await db
      .select()
      .from(roles)
      .where(and(
        eq(roles.id, id),
        eq(roles.tenantId, user.tenantId)
      ))
      .limit(1);

    if (!role || role.length === 0) {
      return res.status(404).json({ error: "Role not found" });
    }

    res.json(role[0]);
  } catch (error: any) {
    console.error("Error fetching role:", error);
    res.status(500).json({ error: "Failed to fetch role" });
  }
});

// POST /api/rbac/roles - Create new role (admin only)
router.post("/roles", requireAdmin, async (req: Request & { user?: AuthUser }, res: Response) => {
  try {
    const user = req.user!;
    const data = insertRoleSchema.parse({
      ...req.body,
      tenantId: user.tenantId,
      isSystemRole: false // Custom roles are never system roles
    });

    const newRole = await db
      .insert(roles)
      .values(data)
      .returning();

    res.status(201).json(newRole[0]);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: "Invalid role data", details: error.errors });
    }
    console.error("Error creating role:", error);
    res.status(500).json({ error: "Failed to create role" });
  }
});

// PATCH /api/rbac/roles/:id - Update role (admin only)
router.patch("/roles/:id", requireAdmin, async (req: Request & { user?: AuthUser }, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    // Check if role exists and belongs to tenant
    const existingRole = await db
      .select()
      .from(roles)
      .where(and(
        eq(roles.id, id),
        eq(roles.tenantId, user.tenantId)
      ))
      .limit(1);

    if (!existingRole || existingRole.length === 0) {
      return res.status(404).json({ error: "Role not found" });
    }

    // Prevent editing system roles
    if (existingRole[0].isSystemRole && !isPlatformOwner(user.email)) {
      return res.status(403).json({ error: "Cannot edit system roles" });
    }

    // Validate update payload - omits tenantId and isSystemRole
    const validatedData = updateRoleSchema.parse(req.body);

    const updatedRole = await db
      .update(roles)
      .set({
        ...validatedData,
        updatedAt: new Date()
      })
      .where(eq(roles.id, id))
      .returning();

    res.json(updatedRole[0]);
  } catch (error: any) {
    console.error("Error updating role:", error);
    res.status(500).json({ error: "Failed to update role" });
  }
});

// DELETE /api/rbac/roles/:id - Delete role (admin only)
router.delete("/roles/:id", requireAdmin, async (req: Request & { user?: AuthUser }, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    // Check if role exists and belongs to tenant
    const existingRole = await db
      .select()
      .from(roles)
      .where(and(
        eq(roles.id, id),
        eq(roles.tenantId, user.tenantId)
      ))
      .limit(1);

    if (!existingRole || existingRole.length === 0) {
      return res.status(404).json({ error: "Role not found" });
    }

    // Prevent deleting system roles
    if (existingRole[0].isSystemRole) {
      return res.status(403).json({ error: "Cannot delete system roles" });
    }

    // Delete role assignments first
    await db
      .delete(userRoles)
      .where(eq(userRoles.roleId, id));

    // Delete the role
    await db
      .delete(roles)
      .where(eq(roles.id, id));

    res.status(204).send();
  } catch (error: any) {
    console.error("Error deleting role:", error);
    res.status(500).json({ error: "Failed to delete role" });
  }
});

// ============================================================================
// PERMISSIONS MANAGEMENT
// ============================================================================

// GET /api/rbac/permissions - List all available permissions
router.get("/permissions", async (req: Request & { user?: AuthUser }, res: Response) => {
  try {
    // Return all available permissions from the constants
    const allPermissions = Object.entries(PERMISSIONS).map(([key, value]) => ({
      id: value,
      name: getPermissionLabel(value),
      module: value.split('.')[0],
      action: value.split('.')[1],
    }));

    res.json(allPermissions);
  } catch (error: any) {
    console.error("Error fetching permissions:", error);
    res.status(500).json({ error: "Failed to fetch permissions" });
  }
});

// GET /api/rbac/permissions/by-module - Get permissions grouped by module
router.get("/permissions/by-module", async (req: Request & { user?: AuthUser }, res: Response) => {
  try {
    const allPermissions = Object.values(PERMISSIONS);
    
    // Group by module
    const byModule: Record<string, string[]> = {};
    allPermissions.forEach(permission => {
      const [module] = permission.split('.');
      if (!byModule[module]) {
        byModule[module] = [];
      }
      byModule[module].push(permission);
    });

    res.json(byModule);
  } catch (error: any) {
    console.error("Error fetching permissions by module:", error);
    res.status(500).json({ error: "Failed to fetch permissions by module" });
  }
});

// ============================================================================
// USER ROLE ASSIGNMENTS
// ============================================================================

// GET /api/rbac/user-roles/:userId - Get roles assigned to a user
router.get("/user-roles/:userId", async (req: Request & { user?: AuthUser }, res: Response) => {
  try {
    const user = req.user!;
    const { userId } = req.params;

    // Verify user belongs to same tenant
    const targetUser = await db
      .select()
      .from(users)
      .where(and(
        eq(users.id, userId),
        eq(users.tenantId, user.tenantId)
      ))
      .limit(1);

    if (!targetUser || targetUser.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get assigned roles
    const assignments = await db
      .select({
        assignment: userRoles,
        role: roles
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));

    res.json(assignments);
  } catch (error: any) {
    console.error("Error fetching user roles:", error);
    res.status(500).json({ error: "Failed to fetch user roles" });
  }
});

// POST /api/rbac/user-roles - Assign role to user (admin only)
router.post("/user-roles", requireAdmin, async (req: Request & { user?: AuthUser }, res: Response) => {
  try {
    const user = req.user!;
    const { userId, roleId } = req.body;

    // Verify user belongs to same tenant
    const targetUser = await db
      .select()
      .from(users)
      .where(and(
        eq(users.id, userId),
        eq(users.tenantId, user.tenantId)
      ))
      .limit(1);

    if (!targetUser || targetUser.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify role belongs to same tenant
    const role = await db
      .select()
      .from(roles)
      .where(and(
        eq(roles.id, roleId),
        eq(roles.tenantId, user.tenantId)
      ))
      .limit(1);

    if (!role || role.length === 0) {
      return res.status(404).json({ error: "Role not found" });
    }

    // Check if assignment already exists
    const existing = await db
      .select()
      .from(userRoles)
      .where(and(
        eq(userRoles.userId, userId),
        eq(userRoles.roleId, roleId)
      ))
      .limit(1);

    if (existing && existing.length > 0) {
      return res.status(409).json({ error: "Role already assigned to user" });
    }

    // Create assignment
    const assignment = await db
      .insert(userRoles)
      .values({
        userId,
        roleId,
        assignedBy: user.id
      })
      .returning();

    res.status(201).json(assignment[0]);
  } catch (error: any) {
    console.error("Error assigning role:", error);
    res.status(500).json({ error: "Failed to assign role" });
  }
});

// DELETE /api/rbac/user-roles/:assignmentId - Remove role assignment (admin only)
router.delete("/user-roles/:assignmentId", requireAdmin, async (req: Request & { user?: AuthUser }, res: Response) => {
  try {
    const user = req.user!;
    const { assignmentId } = req.params;

    // Verify assignment exists and verify tenant ownership through user
    const assignment = await db
      .select({
        assignment: userRoles,
        user: users
      })
      .from(userRoles)
      .innerJoin(users, eq(userRoles.userId, users.id))
      .where(and(
        eq(userRoles.id, assignmentId),
        eq(users.tenantId, user.tenantId)
      ))
      .limit(1);

    if (!assignment || assignment.length === 0) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    // Delete assignment
    await db
      .delete(userRoles)
      .where(eq(userRoles.id, assignmentId));

    res.status(204).send();
  } catch (error: any) {
    console.error("Error removing role assignment:", error);
    res.status(500).json({ error: "Failed to remove role assignment" });
  }
});

// ============================================================================
// USER PERMISSIONS QUERY
// ============================================================================

// GET /api/rbac/my-permissions - Get current user's effective permissions
router.get("/my-permissions", async (req: Request & { user?: AuthUser }, res: Response) => {
  try {
    const user = req.user!;

    // Platform owner gets all permissions
    if (isPlatformOwner(user.email)) {
      return res.json({
        permissions: ['*'],
        role: SYSTEM_ROLES.PLATFORM_OWNER,
        isAdmin: true,
        isPlatformOwner: true
      });
    }

    // Get user's base role permissions
    const basePermissions = DEFAULT_ROLE_PERMISSIONS[user.role as keyof typeof DEFAULT_ROLE_PERMISSIONS] || [];

    // Get additional permissions from custom role assignments
    const customRoles = await db
      .select({
        rolePermissions: roles.permissions
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, user.id));

    // Combine all permissions
    const allPermissions = new Set([
      ...basePermissions,
      ...customRoles.flatMap(r => (r.rolePermissions as string[] || []))
    ]);

    res.json({
      permissions: Array.from(allPermissions),
      role: user.role,
      isAdmin: isAdmin(user.role),
      isPlatformOwner: false
    });
  } catch (error: any) {
    console.error("Error fetching user permissions:", error);
    res.status(500).json({ error: "Failed to fetch user permissions" });
  }
});

// GET /api/rbac/users/:userId/permissions - Get effective permissions for a user (admin only)
router.get("/users/:userId/permissions", requireAdmin, async (req: Request & { user?: AuthUser }, res: Response) => {
  try {
    const user = req.user!;
    const { userId } = req.params;

    // Verify user belongs to same tenant
    const targetUser = await db
      .select()
      .from(users)
      .where(and(
        eq(users.id, userId),
        eq(users.tenantId, user.tenantId)
      ))
      .limit(1);

    if (!targetUser || targetUser.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const targetUserData = targetUser[0];

    // Platform owner gets all permissions
    if (isPlatformOwner(targetUserData.email)) {
      return res.json({
        permissions: ['*'],
        role: SYSTEM_ROLES.PLATFORM_OWNER,
        isAdmin: true,
        isPlatformOwner: true
      });
    }

    // Get base role permissions
    const basePermissions = DEFAULT_ROLE_PERMISSIONS[targetUserData.role as keyof typeof DEFAULT_ROLE_PERMISSIONS] || [];

    // Get custom role permissions
    const customRoles = await db
      .select({
        rolePermissions: roles.permissions
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));

    // Combine all permissions
    const allPermissions = new Set([
      ...basePermissions,
      ...customRoles.flatMap(r => (r.rolePermissions as string[] || []))
    ]);

    res.json({
      permissions: Array.from(allPermissions),
      role: targetUserData.role,
      isAdmin: isAdmin(targetUserData.role),
      isPlatformOwner: false
    });
  } catch (error: any) {
    console.error("Error fetching user permissions:", error);
    res.status(500).json({ error: "Failed to fetch user permissions" });
  }
});

// ============================================================================
// SYSTEM ROLES REFERENCE
// ============================================================================

// GET /api/rbac/system-roles - Get list of system roles with their default permissions
router.get("/system-roles", async (req: Request & { user?: AuthUser }, res: Response) => {
  try {
    const systemRoles = Object.entries(SYSTEM_ROLES).map(([key, value]) => ({
      id: value,
      name: key.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' '),
      permissions: DEFAULT_ROLE_PERMISSIONS[value] || [],
      isSystemRole: true
    }));

    res.json(systemRoles);
  } catch (error: any) {
    console.error("Error fetching system roles:", error);
    res.status(500).json({ error: "Failed to fetch system roles" });
  }
});

export default router;
