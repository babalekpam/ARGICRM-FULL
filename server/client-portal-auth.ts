import { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { clientPortalUsers, clientAccounts } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { DatabaseStorage } from "./database-storage";

export interface ClientContext {
  clientUserId: string;
  clientAccountId: string;
  tenantId: string;
  email: string;
}

export interface RequestWithClientContext extends Request {
  clientContext?: ClientContext;
}

export async function authenticateClient(
  req: RequestWithClientContext,
  res: Response,
  next: NextFunction
) {
  try {
    const sessionId = req.cookies?.clientSessionId || req.headers["x-client-session-id"];

    if (!sessionId) {
      return res.status(401).json({ error: "No session token provided" });
    }

    const storage = new DatabaseStorage('', '', false);
    const sessionData = await storage.validateClientSession(sessionId);

    if (!sessionData) {
      return res.status(401).json({ error: "Invalid or expired session" });
    }

    const [user] = await db
      .select()
      .from(clientPortalUsers)
      .where(
        and(
          eq(clientPortalUsers.id, sessionData.clientUserId),
          eq(clientPortalUsers.clientAccountId, sessionData.clientAccountId),
          eq(clientPortalUsers.tenantId, sessionData.tenantId),
          eq(clientPortalUsers.isActive, true)
        )
      )
      .limit(1);

    if (!user) {
      return res.status(401).json({ error: "User not found or inactive" });
    }

    req.clientContext = {
      clientUserId: sessionData.clientUserId,
      clientAccountId: sessionData.clientAccountId,
      tenantId: sessionData.tenantId,
      email: user.email,
    };

    next();
  } catch (error) {
    console.error("Client authentication error:", error);
    return res.status(500).json({ error: "Authentication failed" });
  }
}

export async function verifyClientPassword(email: string, password: string): Promise<{
  user: any;
  account: any;
} | null> {
  try {
    const [user] = await db
      .select()
      .from(clientPortalUsers)
      .where(and(
        eq(clientPortalUsers.email, email),
        eq(clientPortalUsers.isActive, true)
      ))
      .limit(1);

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    const [account] = await db
      .select()
      .from(clientAccounts)
      .where(eq(clientAccounts.id, user.clientAccountId))
      .limit(1);

    return {
      user,
      account
    };
  } catch (error) {
    console.error("Password verification error:", error);
    return null;
  }
}

export function generateClientSessionId(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function calculateSessionExpiry(days: number = 30): Date {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + days);
  return expiry;
}
