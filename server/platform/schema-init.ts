/**
 * Platform schema bootstrap.
 *
 * Mirrors the project's established pattern (see server/index.ts and
 * server/routes/workflows.ts): idempotent `CREATE TABLE IF NOT EXISTS`
 * executed at boot, so we never touch the Drizzle schema diff / publish dialog.
 *
 * Powers three platform capabilities:
 *   - Public Developer API + Webhooks   (api_keys, webhooks, webhook_deliveries)
 *   - Native MCP server                 (reuses api_keys)
 *   - Custom objects / fields / views   (object_definitions, field_definitions, saved_views)
 *
 * Custom OBJECTS are backed by real, per-object physical tables (created on
 * demand in server/platform/custom-objects.ts) — not a generic jsonb bucket.
 * Custom FIELDS on the built-in CRM objects live in an additive `custom_fields`
 * jsonb column so we never alter the shape of the core tables column-by-column.
 */
import { db } from "../db.js";
import { sql } from "drizzle-orm";

let initialized = false;

export async function ensurePlatformTables(): Promise<void> {
  if (initialized) return;

  // ── Public API keys ───────────────────────────────────────────────────────
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "api_keys" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "tenant_id" uuid NOT NULL,
      "name" text NOT NULL,
      "key_hash" text NOT NULL,
      "prefix" text NOT NULL,
      "last4" text NOT NULL,
      "scopes" text[] DEFAULT '{}',
      "rate_limit" integer NOT NULL DEFAULT 100,
      "last_used_at" timestamp,
      "expires_at" timestamp,
      "revoked_at" timestamp,
      "created_by" uuid,
      "created_at" timestamp DEFAULT now()
    )
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "api_keys_hash_idx" ON "api_keys" ("key_hash")`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "api_keys_tenant_idx" ON "api_keys" ("tenant_id")`);

  // ── Outbound webhooks ─────────────────────────────────────────────────────
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "webhooks" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "tenant_id" uuid NOT NULL,
      "url" text NOT NULL,
      "events" text[] DEFAULT '{}',
      "secret" text NOT NULL,
      "is_active" boolean DEFAULT true,
      "description" text,
      "created_by" uuid,
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now()
    )
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "webhooks_tenant_idx" ON "webhooks" ("tenant_id")`);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "webhook_deliveries" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "webhook_id" uuid NOT NULL,
      "tenant_id" uuid NOT NULL,
      "event" text NOT NULL,
      "payload" jsonb DEFAULT '{}'::jsonb,
      "status" text NOT NULL DEFAULT 'pending',
      "attempts" integer NOT NULL DEFAULT 0,
      "response_status" integer,
      "response_body" text,
      "next_retry_at" timestamp,
      "delivered_at" timestamp,
      "created_at" timestamp DEFAULT now()
    )
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "webhook_deliveries_pending_idx" ON "webhook_deliveries" ("status", "next_retry_at")`);

  // ── Metadata: custom objects, fields, saved views ─────────────────────────
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "object_definitions" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "tenant_id" uuid NOT NULL,
      "name_singular" text NOT NULL,
      "name_plural" text NOT NULL,
      "label_singular" text NOT NULL,
      "label_plural" text NOT NULL,
      "icon" text DEFAULT 'Box',
      "description" text,
      "is_custom" boolean NOT NULL DEFAULT true,
      "is_active" boolean NOT NULL DEFAULT true,
      "table_name" text NOT NULL,
      "created_by" uuid,
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now()
    )
  `);
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS "object_definitions_tenant_name_idx" ON "object_definitions" ("tenant_id", "name_singular")`);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "field_definitions" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "tenant_id" uuid NOT NULL,
      "object_key" text NOT NULL,
      "name" text NOT NULL,
      "label" text NOT NULL,
      "type" text NOT NULL DEFAULT 'text',
      "options" jsonb DEFAULT '[]'::jsonb,
      "is_required" boolean NOT NULL DEFAULT false,
      "is_unique" boolean NOT NULL DEFAULT false,
      "default_value" text,
      "target_object_key" text,
      "column_name" text NOT NULL,
      "is_custom" boolean NOT NULL DEFAULT true,
      "position" integer NOT NULL DEFAULT 0,
      "created_at" timestamp DEFAULT now()
    )
  `);
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS "field_definitions_unique_idx" ON "field_definitions" ("tenant_id", "object_key", "name")`);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "saved_views" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "tenant_id" uuid NOT NULL,
      "object_key" text NOT NULL,
      "name" text NOT NULL,
      "type" text NOT NULL DEFAULT 'table',
      "filters" jsonb DEFAULT '[]'::jsonb,
      "sort" jsonb DEFAULT '{}'::jsonb,
      "group_by" text,
      "visible_fields" jsonb DEFAULT '[]'::jsonb,
      "is_default" boolean NOT NULL DEFAULT false,
      "created_by" uuid,
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now()
    )
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "saved_views_object_idx" ON "saved_views" ("tenant_id", "object_key")`);

  // ── Additive custom_fields jsonb on built-in CRM objects ──────────────────
  // One additive column per table (never per-field churn) so user-defined
  // fields on standard objects flow through the API/MCP automatically.
  for (const table of ["contacts", "leads", "deals", "accounts", "tasks"]) {
    await db
      .execute(sql.raw(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "custom_fields" jsonb DEFAULT '{}'::jsonb`))
      .catch(() => {});
  }

  initialized = true;
  console.log("[platform] tables ready (api_keys, webhooks, metadata, custom_fields)");
}
