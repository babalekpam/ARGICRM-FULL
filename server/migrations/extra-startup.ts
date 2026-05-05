/**
 * Idempotent startup migrations for tables added by the security/AI-council
 * hardening track. Called from server/routes.ts at the top of registerRoutes()
 * so the tables exist before any handler runs that might insert into them.
 *
 * These statements are excluded from drizzle-kit (drizzle.config.ts only
 * includes shared/schema.ts) by design — see schema-extended.ts header.
 */
import { db } from "../db.js";
import { sql } from "drizzle-orm";

const STATEMENTS: string[] = [
  // ─── audit_logs (§8.5) ──────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS "audit_logs" (
     "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
     "tenant_id" varchar,
     "actor_user_id" varchar,
     "actor_type" varchar NOT NULL DEFAULT 'user',
     "action" varchar NOT NULL,
     "entity" varchar NOT NULL,
     "entity_id" varchar,
     "method" varchar,
     "path" text,
     "status_code" integer,
     "ip" varchar,
     "user_agent" text,
     "request_body" jsonb,
     "response_meta" jsonb,
     "latency_ms" integer,
     "created_at" timestamp DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS "idx_audit_logs_tenant_created"
     ON "audit_logs" ("tenant_id", "created_at" DESC)`,
  `CREATE INDEX IF NOT EXISTS "idx_audit_logs_tenant_entity"
     ON "audit_logs" ("tenant_id", "entity", "entity_id")`,
  `CREATE INDEX IF NOT EXISTS "idx_audit_logs_actor"
     ON "audit_logs" ("tenant_id", "actor_user_id")`,

  // ─── council_topics (§9) ─────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS "council_topics" (
     "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
     "tenant_id" varchar,
     "name" varchar NOT NULL,
     "description" text,
     "default_mode" varchar NOT NULL,
     "default_participants" jsonb NOT NULL DEFAULT '[]'::jsonb,
     "system_prompt_template" text NOT NULL,
     "guardrails" jsonb NOT NULL DEFAULT '{}'::jsonb,
     "requires_manual_approval" boolean NOT NULL DEFAULT true,
     "min_plan" varchar NOT NULL DEFAULT 'starter',
     "created_at" timestamp DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS "idx_council_topics_tenant"
     ON "council_topics" ("tenant_id")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "idx_council_topics_name"
     ON "council_topics" (COALESCE("tenant_id", ''), "name")`,

  // ─── council_decisions (§9) ──────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS "council_decisions" (
     "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
     "tenant_id" varchar NOT NULL,
     "topic" varchar NOT NULL,
     "mode" varchar NOT NULL,
     "status" varchar NOT NULL DEFAULT 'pending',
     "inputs" jsonb NOT NULL,
     "participants" jsonb NOT NULL,
     "rounds" jsonb NOT NULL DEFAULT '[]'::jsonb,
     "outcome" jsonb,
     "dissent" jsonb,
     "cost_credits" integer NOT NULL DEFAULT 0,
     "cost_usd" numeric(10,6) NOT NULL DEFAULT 0,
     "latency_ms" integer,
     "triggered_by" varchar,
     "trigger_source" varchar,
     "approved_by" varchar,
     "applied_at" timestamp,
     "created_at" timestamp DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS "idx_council_decisions_tenant_created"
     ON "council_decisions" ("tenant_id", "created_at" DESC)`,
  `CREATE INDEX IF NOT EXISTS "idx_council_decisions_tenant_topic"
     ON "council_decisions" ("tenant_id", "topic", "status")`,
  `CREATE INDEX IF NOT EXISTS "idx_council_decisions_triggered_by"
     ON "council_decisions" ("tenant_id", "triggered_by")`,

  // ─── users TOTP + force_password_change columns (§8.1) ─────────────────
  // Idempotent ALTERs so existing production rows pick up the new columns
  // with safe defaults. Recovery codes are stored as bcrypt hashes (text[]).
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "force_password_change" boolean DEFAULT false`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "totp_secret" text`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "totp_enabled" boolean DEFAULT false`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "mfa_recovery_codes" text[]`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "totp_enrolled_at" timestamp`,

  // ─── api_keys (§8.6) ───────────────────────────────────────────────
  // Stores bcrypt hashes only; the plaintext is shown ONCE on creation.
  `CREATE TABLE IF NOT EXISTS "api_keys" (
     "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
     "tenant_id" varchar NOT NULL,
     "name" text NOT NULL,
     "hashed_key" text NOT NULL,
     "prefix" varchar(8) NOT NULL,
     "scopes" text[] NOT NULL DEFAULT ARRAY[]::text[],
     "last_used_at" timestamp,
     "created_by" varchar,
     "revoked_at" timestamp,
     "created_at" timestamp DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS "idx_api_keys_tenant"
     ON "api_keys" ("tenant_id")`,
  `CREATE INDEX IF NOT EXISTS "idx_api_keys_prefix"
     ON "api_keys" ("prefix")`,

  // ─── webhook_endpoints + webhook_deliveries (§8.6) ───────────────────
  `CREATE TABLE IF NOT EXISTS "webhook_endpoints" (
     "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
     "tenant_id" varchar NOT NULL,
     "url" text NOT NULL,
     "events" text[] NOT NULL DEFAULT ARRAY[]::text[],
     "secret" text NOT NULL,
     "is_active" boolean NOT NULL DEFAULT true,
     "last_success_at" timestamp,
     "last_failure_at" timestamp,
     "failure_count" integer NOT NULL DEFAULT 0,
     "created_by" varchar,
     "created_at" timestamp DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS "idx_webhook_endpoints_tenant"
     ON "webhook_endpoints" ("tenant_id")`,

  `CREATE TABLE IF NOT EXISTS "webhook_deliveries" (
     "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
     "tenant_id" varchar NOT NULL,
     "endpoint_id" uuid NOT NULL,
     "event" varchar NOT NULL,
     "payload" jsonb NOT NULL,
     "status" varchar NOT NULL DEFAULT 'pending',
     "attempts" integer NOT NULL DEFAULT 0,
     "last_status_code" integer,
     "last_response" text,
     "last_attempt_at" timestamp,
     "delivered_at" timestamp,
     "created_at" timestamp DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS "idx_webhook_deliveries_tenant_created"
     ON "webhook_deliveries" ("tenant_id", "created_at" DESC)`,
  `CREATE INDEX IF NOT EXISTS "idx_webhook_deliveries_endpoint"
     ON "webhook_deliveries" ("endpoint_id", "status")`,
];

let didRun = false;

export async function runExtraMigrations(): Promise<void> {
  if (didRun) return;
  if (!process.env.DATABASE_URL) {
    console.warn("[STARTUP] Skipping extra migrations — DATABASE_URL not set");
    return;
  }

  for (const stmt of STATEMENTS) {
    try {
      await db.execute(sql.raw(stmt));
    } catch (e: any) {
      // Don't crash boot on a single statement — log and continue.
      // Most failures here are race conditions on multi-replica startups.
      console.warn(
        "[STARTUP] Extra migration statement failed (non-fatal):",
        String(e?.message || e).slice(0, 200)
      );
    }
  }
  didRun = true;
  console.log(
    "[STARTUP] Extra migrations completed " +
    "(audit_logs, council_topics, council_decisions, users.mfa_columns, api_keys, webhooks)"
  );
}
