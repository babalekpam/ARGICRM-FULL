import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production-secret-key";
const SALT_ROUNDS = 12;

export interface AuthUser {
  id: string;
  tenantId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: string;
  permissions: string[];
}

export interface AuthRequest extends Request {
  user?: AuthUser;
  tenantId?: string;
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, tenantId: user.tenantId, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token: string): any {
  return jwt.verify(token, JWT_SECRET);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : req.cookies?.["auth-token"];

    if (!token) return res.status(401).json({ error: "Authentication required" });

    const decoded = verifyToken(token);
    req.user = { id: decoded.id, tenantId: decoded.tenantId, email: decoded.email, role: decoded.role, permissions: decoded.permissions || [] };
    req.tenantId = decoded.tenantId;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });
    const OWNER_EMAIL = process.env.PLATFORM_OWNER_EMAIL || "abel@argilette.com";
    if (
      req.user.role === "platform_owner" ||
      req.user.email === OWNER_EMAIL
    ) return next();
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: "Insufficient permissions" });
    next();
  };
}

export function isPlatformOwner(req: AuthRequest): boolean {
  return req.user?.email === (process.env.PLATFORM_OWNER_EMAIL || "abel@argilette.com");
}
