import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { storage } from '../storage.js';
import { TenantRequest } from './tenant.js';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';

export interface AuthUser {
  id: string;
  tenantId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  permissions: string[];
}

// Generate JWT token
export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

// Verify JWT token
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
}

// Authentication middleware
export async function authenticate(req: TenantRequest, res: Response, next: NextFunction) {
  try {
    // SECURITY FIX: Check both Authorization header AND httpOnly cookies for JWT token
    let token: string | undefined;
    
    // First, try Authorization header (Bearer token)
    const authHeader = req.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    // If no Authorization header, try httpOnly cookie (consistent with /api/auth/me)
    if (!token) {
      token = req.cookies['auth-token'];
    }
    
    // If no token found in either location
    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const decoded = verifyToken(token);
    console.log('Auth middleware - decoded JWT:', { id: decoded.id, email: decoded.email });

    // Get user details with permissions  
    const user = await storage.getUserWithPermissions(decoded.id);
    console.log('Auth middleware - getUserWithPermissions result:', user ? { id: user.id, email: user.email, isActive: user.isActive } : 'null');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    req.user = {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
      permissions: user.permissions || []
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Invalid authentication token' });
  }
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Login handler
export async function login(req: Request, res: Response) {
  try {
    const { email, password, tenantDomain } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find tenant
    const tenant = await storage.getTenantByDomain(tenantDomain || 'default');
    if (!tenant || !tenant.isActive) {
      return res.status(404).json({ error: 'Invalid tenant or tenant inactive' });
    }

    // Find user
    const user = await storage.getUserByEmailAndTenant(email, tenant.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get user permissions
    const userWithPermissions = await storage.getUserWithPermissions(user.id);

    // Generate token
    const token = generateToken({
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      role: user.role,
      permissions: userWithPermissions.permissions || []
    });

    // Update last login
    await storage.updateUserLastLogin(user.id);

    // SECURITY: Set JWT token as httpOnly cookie (prevents XSS attacks)
    res.cookie('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({
      success: true,
      token,  // Also send in response body for backward compatibility
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        permissions: userWithPermissions.permissions,
        isPlatformOwner: email === 'abel@argilette.com' || email === 'admin@default.com'
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        domain: tenant.domain,
        settings: tenant.settings
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
}

// Register new tenant with super admin
export async function registerTenant(req: Request, res: Response) {
  try {
    const { 
      tenantName, 
      domain, 
      adminEmail, 
      adminPassword, 
      adminFirstName, 
      adminLastName,
      subscriptionPlan = 'starter'
    } = req.body;

    if (!tenantName || !domain || !adminEmail || !adminPassword) {
      return res.status(400).json({ error: 'All fields required' });
    }

    // Check if domain is available
    const existingTenant = await storage.getTenantByDomain(domain);
    if (existingTenant) {
      return res.status(409).json({ error: 'Domain already taken' });
    }

    // Create tenant
    const tenant = await storage.createTenant({
      name: tenantName,
      domain,
      subscriptionPlan,
      maxUsers: subscriptionPlan === 'enterprise' ? 100 : subscriptionPlan === 'professional' ? 25 : 5,
      settings: {
        theme: 'default',
        timezone: 'UTC',
        currency: 'USD',
        features: []
      },
      isActive: true
    });

    // Create super admin user
    const hashedPassword = await hashPassword(adminPassword);
    const superAdmin = await storage.createUser({
      tenantId: tenant.id,
      email: adminEmail,
      firstName: adminFirstName,
      lastName: adminLastName,
      passwordHash: hashedPassword,
      role: 'super_admin',
      isActive: true
    });

    // Create default roles for the tenant
    await storage.createDefaultRoles(tenant.id);

    res.status(201).json({
      message: 'Tenant and super admin created successfully',
      tenant: {
        id: tenant.id,
        name: tenant.name,
        domain: tenant.domain
      },
      adminUser: {
        id: superAdmin.id,
        email: superAdmin.email,
        role: superAdmin.role
      }
    });
  } catch (error) {
    console.error('Tenant registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
}