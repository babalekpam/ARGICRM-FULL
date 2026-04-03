import { Request, Response, NextFunction } from "express";
import { db } from "../db.js";
import { tenants } from "@shared/schema";
import { eq } from "drizzle-orm";
import { PLAN_MAP, FEATURE_PLAN, planAtLeast, type PlanId } from "@shared/plans";

export interface FeatureCheckRequest extends Request {
  tenant?: any;
  user?: any;
  subscription?: any;
}

// ── Core helper: get tenant plan from DB ────────────────────────
async function getTenantPlan(tenantId: string): Promise<PlanId> {
  try {
    const [tenant] = await db.select({ subscriptionPlan: tenants.subscriptionPlan, isActive: tenants.isActive })
      .from(tenants)
      .where(eq(tenants.id, tenantId));
    if (!tenant || !tenant.isActive) return "trial";
    return (tenant.subscriptionPlan as PlanId) || "trial";
  } catch {
    return "trial";
  }
}

// ── requireFeature middleware ───────────────────────────────────
//  Usage: router.get("/endpoint", authenticate, requireFeature("ai.tools"), handler)
//  Returns 402 with upgrade info if the tenant's plan doesn't include the feature.
export function requireFeature(featureSlug: string) {
  return async (req: FeatureCheckRequest, res: Response, next: NextFunction) => {
    try {
      // Platform owner bypasses all checks
      if (req.user?.email === "abel@argilette.com" || req.user?.role === "platform_owner") {
        return next();
      }

      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(403).json({ error: "No tenant context", code: "NO_TENANT" });
      }

      const currentPlan = await getTenantPlan(tenantId);
      const requiredPlan = FEATURE_PLAN[featureSlug] as PlanId | undefined;

      if (!requiredPlan) {
        // Feature not in matrix — allow by default (unknown = unrestricted)
        return next();
      }

      if (planAtLeast(currentPlan, requiredPlan)) {
        return next();
      }

      const required = PLAN_MAP[requiredPlan];
      return res.status(402).json({
        error: `This feature requires the ${required.name} plan or higher.`,
        code: "UPGRADE_REQUIRED",
        feature: featureSlug,
        currentPlan,
        requiredPlan,
        upgradeTo: required.name,
        upgradePrice: required.price !== "Custom" ? `${required.price}${required.period}` : "Contact us",
      });
    } catch (err) {
      console.error("[feature-check] error:", err);
      next(); // fail open — don't block on middleware errors
    }
  };
}

// ── planAtLeast exported for use in route handlers ──────────────
export { planAtLeast, FEATURE_PLAN, PLAN_MAP };

// ── checkUsageLimit middleware ──────────────────────────────────
//  Checks a numeric limit (users, contacts) against the plan definition.
export function checkUsageLimit(resource: keyof typeof PLAN_MAP["starter"]) {
  return async (req: FeatureCheckRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user?.email === "abel@argilette.com" || req.user?.role === "platform_owner") {
        return next();
      }
      const tenantId = req.user?.tenantId;
      if (!tenantId) return next();

      const plan = await getTenantPlan(tenantId);
      const planDef = PLAN_MAP[plan] || PLAN_MAP["trial"];
      const limit = planDef[resource] as number;
      if (limit === -1) return next(); // unlimited

      // Attach limit to req for the route handler to use if needed
      (req as any).planLimit = limit;
      (req as any).planId = plan;
      next();
    } catch {
      next();
    }
  };
}
