// ─────────────────────────────────────────────────────────────
//  ARGILETTE CRM — Unified Subscription Plan Definitions
//  Single source of truth for frontend + backend
// ─────────────────────────────────────────────────────────────

export const PLAN_HIERARCHY = ["trial", "starter", "professional", "business", "enterprise"] as const;
export type PlanId = typeof PLAN_HIERARCHY[number];

export interface PlanDefinition {
  id: PlanId;
  name: string;
  price: string;
  priceMonthly: number;          // 0 = free/custom
  period: string;
  desc: string;
  color: string;
  popular: boolean;
  maxUsers: number;              // -1 = unlimited
  maxContacts: number;           // -1 = unlimited
  emailsPerMonth: number;        // -1 = unlimited
  smsPerMonth: number;
  apiCalls: number;
  storageMb: number;
  highlights: string[];          // Short bullets shown on pricing cards
}

export const PLANS: PlanDefinition[] = [
  {
    id: "trial",
    name: "Free Trial",
    price: "$0",
    priceMonthly: 0,
    period: "14 days",
    desc: "Try everything, no card needed",
    color: "#64748b",
    popular: false,
    maxUsers: 3,
    maxContacts: 500,
    emailsPerMonth: 200,
    smsPerMonth: 0,
    apiCalls: 500,
    storageMb: 256,
    highlights: ["3 users", "500 contacts", "Basic CRM", "14-day trial"],
  },
  {
    id: "starter",
    name: "Starter",
    price: "$69",
    priceMonthly: 69,
    period: "/mo",
    desc: "For small teams getting started",
    color: "#3b82f6",
    popular: false,
    maxUsers: 5,
    maxContacts: 2000,
    emailsPerMonth: 1000,
    smsPerMonth: 100,
    apiCalls: 1000,
    storageMb: 1024,
    highlights: ["5 users", "2,000 contacts", "Full CRM", "Email campaigns", "Basic reporting"],
  },
  {
    id: "professional",
    name: "Professional",
    price: "$179",
    priceMonthly: 179,
    period: "/mo",
    desc: "Most popular for growing teams",
    color: "#8b5cf6",
    popular: true,
    maxUsers: 25,
    maxContacts: 10000,
    emailsPerMonth: 10000,
    smsPerMonth: 1000,
    apiCalls: 10000,
    storageMb: 10240,
    highlights: ["25 users", "10,000 contacts", "AI email generation", "Lead scoring", "Advanced analytics", "Priority support"],
  },
  {
    id: "business",
    name: "Business",
    price: "$349",
    priceMonthly: 349,
    period: "/mo",
    desc: "For scaling organizations",
    color: "#10b981",
    popular: false,
    maxUsers: -1,
    maxContacts: 50000,
    emailsPerMonth: 100000,
    smsPerMonth: 10000,
    apiCalls: 100000,
    storageMb: 102400,
    highlights: ["Unlimited users", "50,000 contacts", "White-label branding", "API access", "Dedicated support", "Custom integrations"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    priceMonthly: 0,
    period: "",
    desc: "Unlimited everything, custom contract",
    color: "#f59e0b",
    popular: false,
    maxUsers: -1,
    maxContacts: -1,
    emailsPerMonth: -1,
    smsPerMonth: -1,
    apiCalls: -1,
    storageMb: -1,
    highlights: ["Unlimited users", "Unlimited contacts", "All features", "SLA guarantee", "Custom contract"],
  },
];

/** Map from plan ID → plan definition */
export const PLAN_MAP = Object.fromEntries(PLANS.map(p => [p.id, p])) as Record<PlanId, PlanDefinition>;

/**
 * Returns true if `plan` meets or exceeds the `required` tier.
 * enterprise ≥ business ≥ professional ≥ starter ≥ trial
 */
export function planAtLeast(plan: string, required: PlanId): boolean {
  const planIdx = PLAN_HIERARCHY.indexOf(plan as PlanId);
  const reqIdx  = PLAN_HIERARCHY.indexOf(required);
  if (planIdx === -1) return false;
  return planIdx >= reqIdx;
}

// ── Feature access matrix ────────────────────────────────────
//  Each key is a feature slug. Value is the minimum plan required.
export const FEATURE_PLAN: Record<string, PlanId> = {
  // Core CRM — available from starter
  "contacts.basic":         "starter",
  "leads.basic":            "starter",
  "deals.basic":            "starter",
  "accounts.basic":         "starter",
  "tasks.basic":            "starter",
  "analytics.basic":        "starter",
  "reports.basic":          "starter",
  "team.basic":             "starter",
  "security.basic":         "starter",
  "integrations.basic":     "starter",

  // Professional tier
  "contacts.advanced":      "professional",
  "contacts.bulk_import":   "professional",
  "contacts.export":        "professional",
  "leads.scoring":          "professional",
  "deals.pipeline":         "professional",
  "accounts.hierarchy":     "professional",
  "email.basic":            "professional",
  "sms.basic":              "professional",
  "campaigns.basic":        "professional",
  "forms.basic":            "professional",
  "landing_pages.basic":    "professional",
  "analytics.advanced":     "professional",
  "reports.custom":         "professional",
  "tasks.automation":       "professional",
  "projects.basic":         "professional",
  "tickets.basic":          "professional",
  "scheduling.basic":       "professional",
  "invoices.basic":         "professional",
  "bookkeeping.basic":      "professional",
  "tax.basic":              "professional",
  "team.advanced":          "professional",
  "security.advanced":      "professional",
  "integrations.advanced":  "professional",
  "ai.tools":               "professional",      // AI email, meeting summary, etc.
  "ai.sentiment_analysis":  "professional",

  // Business tier
  "leads.automation":       "business",
  "email.automation":       "business",
  "sms.automation":         "business",
  "campaigns.advanced":     "business",
  "forms.advanced":         "business",
  "landing_pages.advanced": "business",
  "deals.forecasting":      "business",
  "accounts.territory":     "business",
  "reports.automated":      "business",
  "tasks.advanced_workflow":"business",
  "projects.advanced":      "business",
  "tickets.sla":            "business",
  "scheduling.advanced":    "business",
  "invoices.automation":    "business",
  "bookkeeping.advanced":   "business",
  "tax.advanced":           "business",
  "security.enterprise":    "business",
  "integrations.api_access":"business",
  "ai.lead_generation":     "business",         // LeadGen module
  "ai.predictive_scoring":  "business",

  // Enterprise tier
  "ai.agents":              "enterprise",        // AI Agents module
  "ai.automation":          "enterprise",
  "email.advanced_analytics":"enterprise",
  "forms.unlimited":        "enterprise",
  "analytics.custom_reports":"enterprise",
  "analytics.real_time":    "enterprise",
  "reports.cross_tenant":   "enterprise",
  "team.unlimited_users":   "enterprise",
  "security.audit_logs":    "enterprise",
  "integrations.webhooks":  "enterprise",
  "invoices.multi_currency":"enterprise",
  "bookkeeping.multi_currency":"enterprise",
  "tax.compliance":         "enterprise",
  "tickets.automation":     "enterprise",
};
