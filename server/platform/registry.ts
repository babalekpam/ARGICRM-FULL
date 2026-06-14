/**
 * Object registry — the metadata backbone shared by the public API, the MCP
 * server and the no-code data-model builder.
 *
 * Built-in CRM objects are described statically here (physical table + the
 * user-writable column whitelist, which doubles as mass-assignment protection).
 * Custom objects are resolved at runtime from object_definitions /
 * field_definitions and merged in via getDescriptor() in custom-objects.ts.
 */
export interface ObjectDescriptor {
  key: string;            // url/object key, e.g. "contacts"
  singular: string;       // "contact"
  scope: string;          // API scope resource, e.g. "contacts"
  table: string;          // physical table name
  columns: string[];      // writable columns (snake_case)
  searchCols: string[];   // columns scanned by ?search=
  hasCustomFields: boolean; // built-ins carry a custom_fields jsonb column
  isCustom: boolean;
  webhookSingular?: string; // event prefix, e.g. "contact" -> contact.created
  hasCreatedBy?: boolean;   // table has a created_by column to stamp
  jsonbCols?: string[];     // columns that must be cast ::jsonb on write
}

export const BUILTIN_DESCRIPTORS: Record<string, ObjectDescriptor> = {
  contacts: {
    key: "contacts", singular: "contact", scope: "contacts", table: "contacts",
    columns: ["first_name", "last_name", "email", "phone", "company", "job_title", "status", "source", "tags", "notes", "name", "account_id", "lead_source", "assigned_to", "location", "bio", "linkedin", "company_website", "number_of_employees", "lead_score", "opt_in", "locale", "industry", "website", "city", "country", "state"],
    searchCols: ["first_name", "last_name", "email", "company"],
    hasCustomFields: true, isCustom: false, webhookSingular: "contact", hasCreatedBy: true,
  },
  leads: {
    key: "leads", singular: "lead", scope: "leads", table: "leads",
    columns: ["first_name", "last_name", "email", "phone", "company", "job_title", "source", "status", "score", "notes", "lead_source"],
    searchCols: ["first_name", "last_name", "email", "company"],
    hasCustomFields: true, isCustom: false, webhookSingular: "lead", hasCreatedBy: true,
  },
  deals: {
    key: "deals", singular: "deal", scope: "deals", table: "deals",
    columns: ["contact_id", "title", "value", "currency", "stage", "probability", "expected_close_date", "status", "notes", "account_id", "name", "amount", "score", "owner_id", "source"],
    searchCols: ["title", "name"],
    hasCustomFields: true, isCustom: false, webhookSingular: "deal", hasCreatedBy: true,
  },
  tasks: {
    key: "tasks", singular: "task", scope: "tasks", table: "tasks",
    columns: ["user_id", "contact_id", "deal_id", "title", "description", "due_date", "priority", "status", "type", "assigned_to"],
    searchCols: ["title", "description"],
    hasCustomFields: true, isCustom: false, webhookSingular: "task", hasCreatedBy: true,
  },
  accounts: {
    key: "accounts", singular: "account", scope: "accounts", table: "accounts",
    columns: ["name", "industry", "website", "phone", "email", "address", "city", "state", "country", "postal_code", "annual_revenue", "employee_count", "status", "notes", "billing_address", "shipping_address", "account_type", "parent_account_id", "owner_id"],
    searchCols: ["name", "email"],
    hasCustomFields: true, isCustom: false, webhookSingular: "account", hasCreatedBy: true,
  },
  campaigns: {
    key: "campaigns", singular: "campaign", scope: "campaigns", table: "campaigns",
    columns: ["name", "type", "status", "start_date", "end_date", "budget", "actual_cost", "target_audience", "goals"],
    searchCols: ["name"],
    hasCustomFields: false, isCustom: false, webhookSingular: "campaign",
  },
  invoices: {
    key: "invoices", singular: "invoice", scope: "invoices", table: "invoices",
    columns: ["invoice_number", "contact_id", "account_id", "deal_id", "status", "subtotal", "tax_amount", "discount_amount", "total", "currency", "due_date", "paid_at", "notes", "line_items"],
    searchCols: ["invoice_number", "notes"],
    hasCustomFields: false, isCustom: false, webhookSingular: "invoice", hasCreatedBy: true, jsonbCols: ["line_items"],
  },
  activities: {
    key: "activities", singular: "activity", scope: "activities", table: "activities",
    columns: ["contact_id", "deal_id", "type", "channel", "direction", "content", "meta"],
    searchCols: ["content"],
    hasCustomFields: false, isCustom: false, webhookSingular: undefined, jsonbCols: ["meta"],
  },
};

export const BUILTIN_KEYS = Object.keys(BUILTIN_DESCRIPTORS);

/** All API scopes offered when minting a key. */
export function listApiScopes(): { scope: string; description: string }[] {
  const out: { scope: string; description: string }[] = [{ scope: "*", description: "Full access to all resources" }];
  for (const d of Object.values(BUILTIN_DESCRIPTORS)) {
    out.push({ scope: `${d.scope}:read`, description: `Read ${d.key}` });
    out.push({ scope: `${d.scope}:write`, description: `Create / update / delete ${d.key}` });
  }
  out.push({ scope: "custom:read", description: "Read custom objects" });
  out.push({ scope: "custom:write", description: "Write custom objects" });
  return out;
}
