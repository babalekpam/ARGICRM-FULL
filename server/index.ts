import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import session from "express-session";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes.js";

// Prevent database disconnections or unhandled promise rejections from crashing the process
process.on("uncaughtException", (err) => {
  console.error("[SERVER] Uncaught exception (non-fatal):", err.message);
});
process.on("unhandledRejection", (reason) => {
  console.error("[SERVER] Unhandled rejection (non-fatal):", reason);
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === "production";
const PORT = Number(process.env.PORT) || 5000;

async function runStartupMigrations() {
  if (!process.env.DATABASE_URL) return;
  try {
    const { Pool } = await import("pg");
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });
    const client = await pool.connect();
    const statements = [
      `CREATE TABLE IF NOT EXISTS "agents" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,"tenant_id" uuid NOT NULL,"name" text NOT NULL,"role" text NOT NULL,"description" text,"capabilities" jsonb DEFAULT '[]'::jsonb,"model" text DEFAULT 'claude-opus-4-5',"created_at" timestamp DEFAULT now())`,
      `CREATE TABLE IF NOT EXISTS "agent_sessions" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,"tenant_id" uuid NOT NULL,"agent_id" uuid NOT NULL,"user_id" uuid NOT NULL,"title" text,"status" text DEFAULT 'active',"context" jsonb DEFAULT '{}'::jsonb,"created_at" timestamp DEFAULT now(),"updated_at" timestamp DEFAULT now())`,
      `CREATE TABLE IF NOT EXISTS "agent_messages" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,"session_id" uuid NOT NULL,"tenant_id" uuid NOT NULL,"role" text NOT NULL,"content" text NOT NULL,"metadata" jsonb DEFAULT '{}'::jsonb,"tokens_used" integer DEFAULT 0,"created_at" timestamp DEFAULT now())`,
      `CREATE TABLE IF NOT EXISTS "agent_memories" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,"agent_id" uuid NOT NULL,"tenant_id" uuid NOT NULL,"key" text NOT NULL,"value" text NOT NULL,"category" text DEFAULT 'general',"importance" integer DEFAULT 5,"expires_at" timestamp,"created_at" timestamp DEFAULT now(),"updated_at" timestamp DEFAULT now())`,
      `CREATE TABLE IF NOT EXISTS "agent_tasks" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,"tenant_id" uuid NOT NULL,"agent_id" uuid NOT NULL,"session_id" uuid,"assigned_to" uuid,"title" text NOT NULL,"description" text,"status" text DEFAULT 'pending',"priority" text DEFAULT 'medium',"result" jsonb,"due_date" timestamp,"completed_at" timestamp,"created_at" timestamp DEFAULT now())`,
      `CREATE TABLE IF NOT EXISTS "agent_lead_gen_results" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,"tenant_id" uuid NOT NULL,"agent_id" uuid NOT NULL,"session_id" uuid,"company_name" text,"company_domain" text,"industry" text,"employee_count" integer,"revenue_range" text,"location" text,"contacts" jsonb DEFAULT '[]'::jsonb,"technologies" jsonb DEFAULT '[]'::jsonb,"score" integer DEFAULT 0,"status" text DEFAULT 'new',"imported_as_lead_id" uuid,"created_at" timestamp DEFAULT now())`,
      `CREATE TABLE IF NOT EXISTS "ai_usage" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,"tenant_id" uuid NOT NULL,"user_id" uuid,"model" text NOT NULL,"tokens_input" integer DEFAULT 0,"tokens_output" integer DEFAULT 0,"cost_usd" numeric(10,6) DEFAULT '0',"feature" text,"created_at" timestamp DEFAULT now())`,
      `CREATE TABLE IF NOT EXISTS "error_logs" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,"severity" text NOT NULL,"category" text NOT NULL,"message" text NOT NULL,"stack" text,"context" jsonb DEFAULT '{}'::jsonb,"tenant_id" uuid,"user_id" uuid,"endpoint" text,"resolved" boolean DEFAULT false,"healing_attempts" integer DEFAULT 0,"resolved_by" text,"resolved_at" timestamp,"created_at" timestamp DEFAULT now())`,
      `CREATE TABLE IF NOT EXISTS "health_checks" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,"check_type" text NOT NULL,"status" text NOT NULL,"latency_ms" integer,"message" text,"details" jsonb DEFAULT '{}'::jsonb,"created_at" timestamp DEFAULT now())`,
      `CREATE TABLE IF NOT EXISTS "healing_rules" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,"name" text NOT NULL,"pattern" text NOT NULL,"category" text NOT NULL,"action" text NOT NULL,"enabled" boolean DEFAULT true,"priority" integer DEFAULT 5,"created_at" timestamp DEFAULT now())`,
      `CREATE TABLE IF NOT EXISTS "performance_metrics" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,"metric_name" text NOT NULL,"value" numeric(15,4) NOT NULL,"unit" text,"tags" jsonb DEFAULT '{}'::jsonb,"recorded_at" timestamp DEFAULT now())`,
      `CREATE TABLE IF NOT EXISTS "companies" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,"tenant_id" uuid NOT NULL,"name" text NOT NULL,"domain" text,"industry" text,"size" text,"revenue_range" text,"location" text,"country" text,"description" text,"technologies" jsonb DEFAULT '[]'::jsonb,"funding_stage" text,"linkedin_url" text,"website" text,"phone" text,"email" text,"employee_count" integer,"founded_year" integer,"sic_code" text,"naics_code" text,"is_public" boolean DEFAULT false,"stock_ticker" text,"annual_revenue" numeric(15,2),"score" integer DEFAULT 0,"tags" jsonb DEFAULT '[]'::jsonb,"custom_fields" jsonb DEFAULT '{}'::jsonb,"created_at" timestamp DEFAULT now(),"updated_at" timestamp DEFAULT now())`,
      `CREATE TABLE IF NOT EXISTS "prospects" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,"tenant_id" uuid NOT NULL,"first_name" text,"last_name" text,"email" text,"phone" text,"title" text,"company" text,"company_domain" text,"linkedin_url" text,"location" text,"country" text,"seniority" text,"department" text,"skills" jsonb DEFAULT '[]'::jsonb,"technologies" jsonb DEFAULT '[]'::jsonb,"score" integer DEFAULT 0,"status" text DEFAULT 'new',"source" text,"enrichment_data" jsonb DEFAULT '{}'::jsonb,"imported_as_lead_id" uuid,"imported_as_contact_id" uuid,"created_at" timestamp DEFAULT now(),"updated_at" timestamp DEFAULT now())`,
      `CREATE TABLE IF NOT EXISTS "prospect_lists" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,"tenant_id" uuid NOT NULL,"name" text NOT NULL,"description" text,"filters" jsonb DEFAULT '{}'::jsonb,"count" integer DEFAULT 0,"created_by" uuid,"created_at" timestamp DEFAULT now(),"updated_at" timestamp DEFAULT now())`,
      `CREATE TABLE IF NOT EXISTS "sequences" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,"tenant_id" uuid NOT NULL,"name" text NOT NULL,"description" text,"type" text DEFAULT 'email',"status" text DEFAULT 'draft',"steps" jsonb DEFAULT '[]'::jsonb,"created_by" uuid,"created_at" timestamp DEFAULT now(),"updated_at" timestamp DEFAULT now())`,
      `CREATE TABLE IF NOT EXISTS "website_visitors" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,"tenant_id" uuid NOT NULL,"session_id" text NOT NULL,"ip_address" text,"user_agent" text,"pages_visited" jsonb DEFAULT '[]'::jsonb,"referrer" text,"utm_source" text,"utm_medium" text,"utm_campaign" text,"identified_company" text,"identified_domain" text,"visit_count" integer DEFAULT 1,"first_visit_at" timestamp DEFAULT now(),"last_visit_at" timestamp DEFAULT now())`,
      `CREATE TABLE IF NOT EXISTS "technographics" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,"tenant_id" uuid NOT NULL,"domain" text NOT NULL,"technologies" jsonb DEFAULT '[]'::jsonb,"categories" jsonb DEFAULT '{}'::jsonb,"detected_at" timestamp DEFAULT now())`,
      `CREATE TABLE IF NOT EXISTS "intent_signals" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,"tenant_id" uuid NOT NULL,"company_domain" text,"signal_type" text NOT NULL,"signal_data" jsonb DEFAULT '{}'::jsonb,"score" integer DEFAULT 0,"detected_at" timestamp DEFAULT now())`,
      `CREATE TABLE IF NOT EXISTS "invoices" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,"tenant_id" uuid NOT NULL,"contact_id" uuid,"account_id" uuid,"deal_id" uuid,"invoice_number" text NOT NULL,"status" text DEFAULT 'draft',"currency" text DEFAULT 'USD',"subtotal" numeric(15,2) DEFAULT '0',"tax_amount" numeric(15,2) DEFAULT '0',"discount_amount" numeric(15,2) DEFAULT '0',"total" numeric(15,2) DEFAULT '0',"line_items" jsonb DEFAULT '[]'::jsonb,"due_date" timestamp,"paid_at" timestamp,"notes" text,"created_by" uuid,"created_at" timestamp DEFAULT now(),"updated_at" timestamp DEFAULT now())`,
      `CREATE TABLE IF NOT EXISTS "bank_accounts" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,"tenant_id" uuid NOT NULL,"name" text NOT NULL,"account_type" text DEFAULT 'checking',"currency" text DEFAULT 'USD',"balance" numeric(15,2) DEFAULT '0',"institution" text,"account_number_last4" text,"is_default" boolean DEFAULT false,"created_at" timestamp DEFAULT now())`,
      `CREATE TABLE IF NOT EXISTS "transactions" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,"tenant_id" uuid NOT NULL,"contact_id" uuid,"type" text NOT NULL,"amount" numeric(15,2) NOT NULL,"currency" text DEFAULT 'USD',"description" text,"category" text,"reference" text,"status" text DEFAULT 'completed',"transaction_date" timestamp DEFAULT now(),"created_at" timestamp DEFAULT now())`,
      `CREATE TABLE IF NOT EXISTS "tax_rates" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,"tenant_id" uuid NOT NULL,"name" text NOT NULL,"rate" numeric(6,4) NOT NULL,"country" text,"region" text,"is_default" boolean DEFAULT false,"created_at" timestamp DEFAULT now())`,
      `CREATE TABLE IF NOT EXISTS "employees" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,"tenant_id" uuid NOT NULL,"user_id" uuid,"first_name" text NOT NULL,"last_name" text NOT NULL,"email" text NOT NULL,"phone" text,"title" text,"department" text,"manager_id" uuid,"hire_date" timestamp,"salary" numeric(15,2),"employment_type" text DEFAULT 'full_time',"status" text DEFAULT 'active',"skills" jsonb DEFAULT '[]'::jsonb,"created_at" timestamp DEFAULT now(),"updated_at" timestamp DEFAULT now())`,
      `CREATE TABLE IF NOT EXISTS "projects" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,"tenant_id" uuid NOT NULL,"name" text NOT NULL,"description" text,"status" text DEFAULT 'active',"priority" text DEFAULT 'medium',"owner_id" uuid,"deal_id" uuid,"contact_id" uuid,"budget" numeric(15,2),"start_date" timestamp,"end_date" timestamp,"created_at" timestamp DEFAULT now(),"updated_at" timestamp DEFAULT now())`,
      `CREATE TABLE IF NOT EXISTS "project_tasks" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,"tenant_id" uuid NOT NULL,"project_id" uuid NOT NULL,"title" text NOT NULL,"description" text,"status" text DEFAULT 'todo',"priority" text DEFAULT 'medium',"assignee_id" uuid,"due_date" timestamp,"completed_at" timestamp,"created_at" timestamp DEFAULT now(),"updated_at" timestamp DEFAULT now())`,
      `CREATE TABLE IF NOT EXISTS "documents" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,"tenant_id" uuid NOT NULL,"name" text NOT NULL,"type" text,"content" text,"file_url" text,"file_size" integer,"mime_type" text,"tags" jsonb DEFAULT '[]'::jsonb,"uploaded_by" uuid,"created_at" timestamp DEFAULT now(),"updated_at" timestamp DEFAULT now())`,
      `CREATE TABLE IF NOT EXISTS "funnels" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,"tenant_id" uuid NOT NULL,"name" text NOT NULL,"description" text,"status" text DEFAULT 'draft',"landing_page_id" uuid,"steps" jsonb DEFAULT '[]'::jsonb,"settings" jsonb DEFAULT '{}'::jsonb,"created_at" timestamp DEFAULT now(),"updated_at" timestamp DEFAULT now())`,
      `CREATE TABLE IF NOT EXISTS "content_ideas" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,"tenant_id" uuid NOT NULL,"title" text NOT NULL,"type" text,"description" text,"keywords" jsonb DEFAULT '[]'::jsonb,"status" text DEFAULT 'idea',"assigned_to" uuid,"created_at" timestamp DEFAULT now(),"updated_at" timestamp DEFAULT now())`,
      `CREATE TABLE IF NOT EXISTS "seo_projects" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,"tenant_id" uuid NOT NULL,"name" text NOT NULL,"domain" text NOT NULL,"status" text DEFAULT 'active',"settings" jsonb DEFAULT '{}'::jsonb,"created_at" timestamp DEFAULT now(),"updated_at" timestamp DEFAULT now())`,
      `CREATE TABLE IF NOT EXISTS "seo_audits" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,"tenant_id" uuid NOT NULL,"project_id" uuid,"url" text NOT NULL,"score" integer,"issues" jsonb DEFAULT '[]'::jsonb,"recommendations" jsonb DEFAULT '[]'::jsonb,"status" text DEFAULT 'pending',"created_at" timestamp DEFAULT now())`,
      `CREATE TABLE IF NOT EXISTS "reputation_reviews" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,"tenant_id" uuid NOT NULL,"platform" text NOT NULL,"rating" integer,"review_text" text,"reviewer_name" text,"reviewer_url" text,"sentiment" text,"responded" boolean DEFAULT false,"response_text" text,"review_date" timestamp,"created_at" timestamp DEFAULT now())`,
      `CREATE TABLE IF NOT EXISTS "client_portal_access" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,"tenant_id" uuid NOT NULL,"contact_id" uuid NOT NULL,"email" text NOT NULL,"password_hash" text,"access_level" text DEFAULT 'read',"last_login" timestamp,"is_active" boolean DEFAULT true,"created_at" timestamp DEFAULT now(),"updated_at" timestamp DEFAULT now())`,
      `CREATE TABLE IF NOT EXISTS "whitelabel_settings" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,"tenant_id" uuid NOT NULL,"logo_url" text,"favicon_url" text,"primary_color" text,"secondary_color" text,"custom_domain" text,"company_name" text,"support_email" text,"created_at" timestamp DEFAULT now(),"updated_at" timestamp DEFAULT now())`,
      `CREATE TABLE IF NOT EXISTS "pipelines" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,"tenant_id" uuid NOT NULL,"name" text NOT NULL,"stages" jsonb DEFAULT '[]'::jsonb,"is_default" boolean DEFAULT false,"created_at" timestamp DEFAULT now(),"updated_at" timestamp DEFAULT now())`,
      `CREATE TABLE IF NOT EXISTS "orders" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,"tenant_id" uuid NOT NULL,"store_id" uuid NOT NULL,"order_number" text NOT NULL,"status" text DEFAULT 'pending',"customer_name" text,"customer_email" text,"items" jsonb DEFAULT '[]'::jsonb,"subtotal" numeric(15,2) DEFAULT '0',"tax" numeric(15,2) DEFAULT '0',"shipping" numeric(15,2) DEFAULT '0',"total" numeric(15,2) DEFAULT '0',"shipping_address" jsonb DEFAULT '{}'::jsonb,"payment_method" text,"payment_status" text DEFAULT 'pending',"notes" text,"created_at" timestamp DEFAULT now(),"updated_at" timestamp DEFAULT now())`,
      `CREATE TABLE IF NOT EXISTS "products" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,"tenant_id" uuid NOT NULL,"store_id" uuid NOT NULL,"name" text NOT NULL,"description" text,"sku" text,"price" numeric(15,2) NOT NULL,"compare_at_price" numeric(15,2),"cost" numeric(15,2),"inventory" integer DEFAULT 0,"category" text,"tags" jsonb DEFAULT '[]'::jsonb,"images" jsonb DEFAULT '[]'::jsonb,"status" text DEFAULT 'active',"weight" numeric(8,2),"created_at" timestamp DEFAULT now(),"updated_at" timestamp DEFAULT now())`,
      `CREATE TABLE IF NOT EXISTS "crm_projects" ("id" varchar PRIMARY KEY DEFAULT gen_random_uuid()::varchar NOT NULL,"tenant_id" varchar NOT NULL,"owner_id" varchar,"name" text NOT NULL,"description" text,"status" text DEFAULT 'planning',"priority" text DEFAULT 'medium',"color" text DEFAULT '#3b82f6',"budget" numeric(15,2),"progress" integer DEFAULT 0,"due_date" timestamp,"start_date" timestamp,"created_at" timestamp DEFAULT now(),"updated_at" timestamp DEFAULT now())`,
      `CREATE TABLE IF NOT EXISTS "aria_audit_log" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,"tenant_id" varchar NOT NULL,"user_id" varchar NOT NULL,"instruction" text NOT NULL,"intent_module" text,"intent_action" text,"result" text,"status" text DEFAULT 'success',"created_at" timestamp DEFAULT now())`,
      `CREATE TABLE IF NOT EXISTS "marketplace_leads" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,"source" text NOT NULL,"market" text NOT NULL DEFAULT 'US',"category" text,"full_name" text,"company_name" text,"title" text,"email" text,"phone" text,"website" text,"address" text,"city" text,"state" text,"country" text DEFAULT 'US',"zip" text,"industry" text,"specialty" text,"employee_size" text,"revenue_range" text,"rating" numeric(3,1),"linkedin_url" text,"language" text DEFAULT 'EN',"verified" boolean DEFAULT false,"quality_score" integer DEFAULT 0,"times_sold" integer DEFAULT 0,"available" boolean DEFAULT true,"external_id" text,"raw_data" jsonb,"last_updated" timestamp DEFAULT now(),"created_at" timestamp DEFAULT now())`,
      `CREATE TABLE IF NOT EXISTS "ingestion_logs" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,"source" text NOT NULL,"market" text,"records_added" integer DEFAULT 0,"records_updated" integer DEFAULT 0,"records_skipped" integer DEFAULT 0,"errors" jsonb DEFAULT '[]'::jsonb,"duration" integer,"status" text DEFAULT 'success',"started_at" timestamp DEFAULT now(),"completed_at" timestamp)`,
      `CREATE TABLE IF NOT EXISTS "marketplace_exports" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,"tenant_id" uuid NOT NULL,"lead_id" uuid REFERENCES marketplace_leads(id),"exported_at" timestamp DEFAULT now())`,
      `CREATE TABLE IF NOT EXISTS "marketplace_usage" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,"tenant_id" uuid NOT NULL,"month" text NOT NULL,"exports_used" integer DEFAULT 0,"updated_at" timestamp DEFAULT now())`,
      `CREATE TABLE IF NOT EXISTS "email_sends" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,"tenant_id" varchar NOT NULL,"contact_id" varchar,"lead_id" varchar,"tracking_id" uuid NOT NULL DEFAULT gen_random_uuid(),"from_email" text,"from_name" text,"to_email" text NOT NULL,"subject" text NOT NULL,"html" text,"first_opener_ip" text,"first_opener_ua" text,"first_opened_at" timestamp,"status" text DEFAULT 'sent',"sent_at" timestamp DEFAULT now())`,
      `CREATE TABLE IF NOT EXISTS "email_events" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,"tenant_id" varchar NOT NULL,"email_send_id" uuid REFERENCES email_sends(id) ON DELETE CASCADE,"contact_id" varchar,"tracking_id" uuid NOT NULL,"event_type" text NOT NULL,"ip" text,"user_agent" text,"url" text,"is_forward" boolean DEFAULT false,"occurred_at" timestamp DEFAULT now())`,
    ];
    let created = 0, skipped = 0;
    for (const stmt of statements) {
      try { await client.query(stmt); created++; }
      catch (e: any) { if (e.message?.includes("already exists")) skipped++; }
    }
    if (created > 0) console.log(`[MIGRATE] Created ${created} tables, ${skipped} already existed`);

    // ── Add missing columns to stores and products tables ──
    try {
      // Stores columns
      await client.query(`ALTER TABLE stores ADD COLUMN IF NOT EXISTS slug varchar`);
      await client.query(`ALTER TABLE stores ADD COLUMN IF NOT EXISTS logo_url text`);
      await client.query(`ALTER TABLE stores ADD COLUMN IF NOT EXISTS banner_url text`);
      await client.query(`ALTER TABLE stores ADD COLUMN IF NOT EXISTS supplier_urls jsonb DEFAULT '[]'::jsonb`);
      await client.query(`ALTER TABLE stores ADD COLUMN IF NOT EXISTS stripe_publishable_key text`);
      await client.query(`ALTER TABLE stores ADD COLUMN IF NOT EXISTS stripe_secret_key text`);
      await client.query(`ALTER TABLE stores ADD COLUMN IF NOT EXISTS shipping_rates jsonb DEFAULT '[]'::jsonb`);
      await client.query(`ALTER TABLE stores ADD COLUMN IF NOT EXISTS policies jsonb DEFAULT '{}'::jsonb`);
      // Backfill slug from subdomain prefix
      await client.query(`UPDATE stores SET slug = split_part(subdomain, '.', 1) WHERE slug IS NULL AND subdomain IS NOT NULL AND subdomain != ''`);
      // Backfill slug from name for stores without subdomain
      await client.query(`UPDATE stores SET slug = regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g') || '-' || right(id::text, 4) WHERE slug IS NULL OR slug = ''`);

      // Fix whitelabel_settings column name mismatches
      await client.query(`ALTER TABLE whitelabel_settings ADD COLUMN IF NOT EXISTS brand_name text`).catch(() => {});
      await client.query(`ALTER TABLE whitelabel_settings ADD COLUMN IF NOT EXISTS logo text`).catch(() => {});
      await client.query(`ALTER TABLE whitelabel_settings ADD COLUMN IF NOT EXISTS favicon text`).catch(() => {});
      await client.query(`ALTER TABLE whitelabel_settings ADD COLUMN IF NOT EXISTS hide_argilette_branding boolean DEFAULT false`).catch(() => {});
      await client.query(`ALTER TABLE whitelabel_settings ADD COLUMN IF NOT EXISTS email_from_name text`).catch(() => {});
      await client.query(`ALTER TABLE whitelabel_settings ADD COLUMN IF NOT EXISTS email_from_address text`).catch(() => {});
      await client.query(`ALTER TABLE whitelabel_settings ADD COLUMN IF NOT EXISTS privacy_url text`).catch(() => {});
      await client.query(`ALTER TABLE whitelabel_settings ADD COLUMN IF NOT EXISTS terms_url text`).catch(() => {});
      await client.query(`ALTER TABLE whitelabel_settings ADD COLUMN IF NOT EXISTS custom_css text`).catch(() => {});
      await client.query(`ALTER TABLE whitelabel_settings ADD COLUMN IF NOT EXISTS custom_domain text`).catch(() => {});
      // Sync company_name → brand_name
      await client.query(`UPDATE whitelabel_settings SET brand_name = company_name WHERE brand_name IS NULL AND company_name IS NOT NULL`).catch(() => {});

      // Make store_id nullable (allow products without a store)
      await client.query(`ALTER TABLE products ALTER COLUMN store_id DROP NOT NULL`).catch(() => {});

      // Products columns
      await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS is_available boolean DEFAULT true`);
      await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false`);
      await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS track_inventory boolean DEFAULT true`);
      await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold integer DEFAULT 10`);
      await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS short_description text`);
      await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode text`);
      await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS slug text`);
      await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS dimensions jsonb DEFAULT '{}'::jsonb`);
      await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS attributes jsonb DEFAULT '{}'::jsonb`);
      await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS ai_score integer DEFAULT 0`);
      await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD'`);
      // Normalize status → is_available
      await client.query(`UPDATE products SET is_available = (status = 'active') WHERE is_available IS NULL`);

      // ── Fix agent_sessions schema (add missing columns) ──
      await client.query(`ALTER TABLE agent_sessions ADD COLUMN IF NOT EXISTS agent_type text`).catch(() => {});
      await client.query(`ALTER TABLE agent_sessions ADD COLUMN IF NOT EXISTS summary text`).catch(() => {});
      await client.query(`ALTER TABLE agent_sessions ADD COLUMN IF NOT EXISTS message_count integer DEFAULT 0`).catch(() => {});
      await client.query(`ALTER TABLE agent_sessions ADD COLUMN IF NOT EXISTS tokens_used integer DEFAULT 0`).catch(() => {});
      await client.query(`ALTER TABLE agent_sessions ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true`).catch(() => {});
      // Backfill agent_type from agents table where possible
      await client.query(`UPDATE agent_sessions s SET agent_type = a.role FROM agents a WHERE s.agent_type IS NULL AND s.agent_id = a.id`).catch(() => {});
      // Default any still-null agent_type to 'sales'
      await client.query(`UPDATE agent_sessions SET agent_type = 'sales' WHERE agent_type IS NULL`).catch(() => {});
      // Add NOT NULL constraint workaround — set default for future inserts
      await client.query(`ALTER TABLE agent_sessions ALTER COLUMN agent_type SET DEFAULT 'sales'`).catch(() => {});

      // ── Fix agent_memories schema ──
      await client.query(`ALTER TABLE agent_memories ADD COLUMN IF NOT EXISTS agent_type text`).catch(() => {});
      await client.query(`ALTER TABLE agent_memories ADD COLUMN IF NOT EXISTS source text DEFAULT 'system'`).catch(() => {});
      await client.query(`ALTER TABLE agent_memories ADD COLUMN IF NOT EXISTS context jsonb DEFAULT '{}'::jsonb`).catch(() => {});
      // Backfill agent_type from agents table
      await client.query(`UPDATE agent_memories m SET agent_type = a.role FROM agents a WHERE m.agent_type IS NULL AND m.agent_id = a.id`).catch(() => {});
      await client.query(`UPDATE agent_memories SET agent_type = 'sales' WHERE agent_type IS NULL`).catch(() => {});
      await client.query(`ALTER TABLE agent_memories ALTER COLUMN agent_type SET DEFAULT 'sales'`).catch(() => {});

      // ── Fix agent_messages schema ──
      await client.query(`ALTER TABLE agent_messages ADD COLUMN IF NOT EXISTS tool_calls jsonb DEFAULT '[]'::jsonb`).catch(() => {});
      await client.query(`ALTER TABLE agent_messages ADD COLUMN IF NOT EXISTS memories_used jsonb DEFAULT '[]'::jsonb`).catch(() => {});
      await client.query(`ALTER TABLE agent_messages ADD COLUMN IF NOT EXISTS memories_created jsonb DEFAULT '[]'::jsonb`).catch(() => {});

      // ── Fix agent_tasks schema ──
      await client.query(`ALTER TABLE agent_tasks ADD COLUMN IF NOT EXISTS agent_type text DEFAULT 'sales'`).catch(() => {});
      await client.query(`ALTER TABLE agent_tasks ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now()`).catch(() => {});
      await client.query(`ALTER TABLE agent_tasks ADD COLUMN IF NOT EXISTS assigned_to_user_id uuid`).catch(() => {});

      // ── Fix seo_audits schema (columns added after table was created) ──
      await client.query(`ALTER TABLE seo_audits ADD COLUMN IF NOT EXISTS summary jsonb DEFAULT '{"critical":0,"warnings":0,"passed":0,"totalPages":0}'::jsonb`).catch(() => {});
      await client.query(`ALTER TABLE seo_audits ADD COLUMN IF NOT EXISTS crawled_at timestamp DEFAULT now()`).catch(() => {});
      // url was NOT NULL in original CREATE TABLE but Drizzle schema omits it — make it nullable
      await client.query(`ALTER TABLE seo_audits ALTER COLUMN url DROP NOT NULL`).catch(() => {});

      // ── Add missing columns to contacts table ──
      await client.query(`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS industry varchar`).catch(() => {});
      await client.query(`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS website varchar`).catch(() => {});
      await client.query(`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS city varchar`).catch(() => {});
      await client.query(`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS country varchar`).catch(() => {});
      await client.query(`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS state varchar`).catch(() => {});

      // ── Make keywords.project_id and backlinks.project_id nullable ──
      await client.query(`ALTER TABLE keywords ALTER COLUMN project_id DROP NOT NULL`).catch(() => {});
      await client.query(`ALTER TABLE backlinks ALTER COLUMN project_id DROP NOT NULL`).catch(() => {});

      // ── Email tracking columns on email_sends ──
      await client.query(`ALTER TABLE email_sends ADD COLUMN IF NOT EXISTS link_map jsonb DEFAULT '{}'::jsonb`).catch(() => {});

      // ── Email tracking columns on contacts ──
      await client.query(`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS engagement_score integer DEFAULT 0`).catch(() => {});
      await client.query(`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS email_opens integer DEFAULT 0`).catch(() => {});
      await client.query(`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS email_clicks integer DEFAULT 0`).catch(() => {});
      await client.query(`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS email_forwards integer DEFAULT 0`).catch(() => {});
      await client.query(`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_engaged_at timestamp`).catch(() => {});

      // ── Fix agent_lead_gen_results schema ──
      await client.query(`ALTER TABLE agent_lead_gen_results ADD COLUMN IF NOT EXISTS first_name text`).catch(() => {});
      await client.query(`ALTER TABLE agent_lead_gen_results ADD COLUMN IF NOT EXISTS last_name text`).catch(() => {});
      await client.query(`ALTER TABLE agent_lead_gen_results ADD COLUMN IF NOT EXISTS email text`).catch(() => {});
      await client.query(`ALTER TABLE agent_lead_gen_results ADD COLUMN IF NOT EXISTS job_title text`).catch(() => {});
      await client.query(`ALTER TABLE agent_lead_gen_results ADD COLUMN IF NOT EXISTS phone text`).catch(() => {});
      await client.query(`ALTER TABLE agent_lead_gen_results ADD COLUMN IF NOT EXISTS linkedin_url text`).catch(() => {});
      await client.query(`ALTER TABLE agent_lead_gen_results ADD COLUMN IF NOT EXISTS source text`).catch(() => {});
      await client.query(`ALTER TABLE agent_lead_gen_results ADD COLUMN IF NOT EXISTS score integer DEFAULT 0`).catch(() => {});
      await client.query(`ALTER TABLE agent_lead_gen_results ADD COLUMN IF NOT EXISTS notes text`).catch(() => {});
      await client.query(`ALTER TABLE agent_lead_gen_results ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT now()`).catch(() => {});
      await client.query(`ALTER TABLE agent_lead_gen_results ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now()`).catch(() => {});

      // ── Contracts & Contract Templates ──
      await client.query(`CREATE TABLE IF NOT EXISTS "contract_templates" ("id" varchar PRIMARY KEY DEFAULT gen_random_uuid()::varchar NOT NULL,"tenant_id" varchar NOT NULL,"name" text NOT NULL,"description" text,"body" text NOT NULL,"variables" jsonb DEFAULT '[]'::jsonb,"is_active" boolean DEFAULT true,"created_by" varchar,"created_at" timestamp DEFAULT now(),"updated_at" timestamp DEFAULT now())`).catch(() => {});
      await client.query(`CREATE TABLE IF NOT EXISTS "contracts" ("id" varchar PRIMARY KEY DEFAULT gen_random_uuid()::varchar NOT NULL,"tenant_id" varchar NOT NULL,"template_id" varchar,"title" text NOT NULL,"body" text NOT NULL,"status" text DEFAULT 'draft',"contact_id" varchar,"contact_name" text,"contact_email" text NOT NULL,"signer_name" text,"signer_ip" text,"signer_user_agent" text,"signature_data" text,"sign_token" varchar UNIQUE,"token_expires_at" timestamp,"sent_at" timestamp,"viewed_at" timestamp,"signed_at" timestamp,"declined_at" timestamp,"variables" jsonb DEFAULT '{}'::jsonb,"notes" text,"created_by" varchar,"created_at" timestamp DEFAULT now(),"updated_at" timestamp DEFAULT now())`).catch(() => {});

      // ── Fix prospects schema ──
      await client.query(`ALTER TABLE prospects ADD COLUMN IF NOT EXISTS company_id uuid`).catch(() => {});
      await client.query(`ALTER TABLE prospects ADD COLUMN IF NOT EXISTS email_status text DEFAULT 'unknown'`).catch(() => {});
      await client.query(`ALTER TABLE prospects ADD COLUMN IF NOT EXISTS work_email text`).catch(() => {});
      await client.query(`ALTER TABLE prospects ADD COLUMN IF NOT EXISTS personal_email text`).catch(() => {});
      await client.query(`ALTER TABLE prospects ADD COLUMN IF NOT EXISTS direct_phone text`).catch(() => {});
      await client.query(`ALTER TABLE prospects ADD COLUMN IF NOT EXISTS mobile_phone text`).catch(() => {});
      await client.query(`ALTER TABLE prospects ADD COLUMN IF NOT EXISTS seniority text`).catch(() => {});
      await client.query(`ALTER TABLE prospects ADD COLUMN IF NOT EXISTS department text`).catch(() => {});
      await client.query(`ALTER TABLE prospects ADD COLUMN IF NOT EXISTS company_domain text`).catch(() => {});
      await client.query(`ALTER TABLE prospects ADD COLUMN IF NOT EXISTS twitter_url text`).catch(() => {});
      await client.query(`ALTER TABLE prospects ADD COLUMN IF NOT EXISTS timezone text`).catch(() => {});
      await client.query(`ALTER TABLE prospects ADD COLUMN IF NOT EXISTS bio text`).catch(() => {});
      await client.query(`ALTER TABLE prospects ADD COLUMN IF NOT EXISTS intent_score integer DEFAULT 0`).catch(() => {});
      await client.query(`ALTER TABLE prospects ADD COLUMN IF NOT EXISTS buying_signals jsonb DEFAULT '[]'::jsonb`).catch(() => {});
      await client.query(`ALTER TABLE prospects ADD COLUMN IF NOT EXISTS tech_stack jsonb DEFAULT '[]'::jsonb`).catch(() => {});
      await client.query(`ALTER TABLE prospects ADD COLUMN IF NOT EXISTS skills jsonb DEFAULT '[]'::jsonb`).catch(() => {});
      await client.query(`ALTER TABLE prospects ADD COLUMN IF NOT EXISTS tags jsonb DEFAULT '[]'::jsonb`).catch(() => {});
      await client.query(`ALTER TABLE prospects ADD COLUMN IF NOT EXISTS outreach_status text DEFAULT 'new'`).catch(() => {});
      await client.query(`ALTER TABLE prospects ADD COLUMN IF NOT EXISTS last_contacted_at timestamp`).catch(() => {});
      await client.query(`ALTER TABLE prospects ADD COLUMN IF NOT EXISTS sequence_id uuid`).catch(() => {});
      await client.query(`ALTER TABLE prospects ADD COLUMN IF NOT EXISTS imported_as_lead_id uuid`).catch(() => {});
      await client.query(`ALTER TABLE prospects ADD COLUMN IF NOT EXISTS imported_as_contact_id uuid`).catch(() => {});
      await client.query(`ALTER TABLE prospects ADD COLUMN IF NOT EXISTS data_source text DEFAULT 'enriched'`).catch(() => {});
      await client.query(`ALTER TABLE prospects ADD COLUMN IF NOT EXISTS last_enriched_at timestamp`).catch(() => {});
      await client.query(`ALTER TABLE prospects ADD COLUMN IF NOT EXISTS verified_at timestamp`).catch(() => {});
      await client.query(`ALTER TABLE prospects ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now()`).catch(() => {});

      // ── Fix companies schema ──
      await client.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS sub_industry text`).catch(() => {});
      await client.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS employee_count integer`).catch(() => {});
      await client.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS revenue text`).catch(() => {});
      await client.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS founded integer`).catch(() => {});
      await client.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS hq_city text`).catch(() => {});
      await client.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS hq_state text`).catch(() => {});
      await client.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS hq_country text`).catch(() => {});
      await client.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS twitter_url text`).catch(() => {});
      await client.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS crunchbase_url text`).catch(() => {});
      await client.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS tech_stack jsonb DEFAULT '[]'::jsonb`).catch(() => {});
      await client.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS keywords jsonb DEFAULT '[]'::jsonb`).catch(() => {});
      await client.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS funding_stage text`).catch(() => {});
      await client.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS total_funding text`).catch(() => {});
      await client.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS last_funding_date text`).catch(() => {});
      await client.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS intent_signals jsonb DEFAULT '[]'::jsonb`).catch(() => {});
      await client.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS score integer DEFAULT 0`).catch(() => {});
      await client.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS tags jsonb DEFAULT '[]'::jsonb`).catch(() => {});
      await client.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS data_source text DEFAULT 'enriched'`).catch(() => {});
      await client.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS last_enriched_at timestamp`).catch(() => {});
      await client.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now()`).catch(() => {});

      // ── AI Credits & Usage ──────────────────────────────────────────────────
      await client.query(`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS ai_credits_remaining INTEGER DEFAULT 200`).catch(() => {});
      await client.query(`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS ai_credits_monthly INTEGER DEFAULT 200`).catch(() => {});
      await client.query(`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS ai_spend_mtd DECIMAL(10,4) DEFAULT 0`).catch(() => {});
      // Extend existing ai_usage table with markup column
      await client.query(`ALTER TABLE ai_usage ADD COLUMN IF NOT EXISTS markup_charged DECIMAL(10,4) DEFAULT 0`).catch(() => {});
      // Monthly summary table
      await client.query(`
        CREATE TABLE IF NOT EXISTS ai_usage_summary (
          id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id    uuid NOT NULL,
          month        DATE NOT NULL,
          total_calls  INTEGER DEFAULT 0,
          total_tokens INTEGER DEFAULT 0,
          total_cost_usd DECIMAL(10,4) DEFAULT 0,
          total_charged  DECIMAL(10,4) DEFAULT 0,
          margin         DECIMAL(10,4) DEFAULT 0,
          UNIQUE(tenant_id, month)
        )
      `).catch(() => {});
      // Backfill ai_credits_remaining based on plan if still null / 0
      await client.query(`
        UPDATE tenants SET ai_credits_remaining = CASE
          WHEN COALESCE(subscription_plan, plan) IN ('trial','trialing','free') THEN 50
          WHEN COALESCE(subscription_plan, plan) = 'starter'      THEN 200
          WHEN COALESCE(subscription_plan, plan) = 'professional' THEN 500
          WHEN COALESCE(subscription_plan, plan) = 'business'     THEN 1000
          ELSE 200
        END
        WHERE ai_credits_remaining IS NULL OR ai_credits_remaining = 0
      `).catch(() => {});
      // Enterprise tenants get unlimited marker (-1)
      await client.query(`
        UPDATE tenants SET ai_credits_remaining = -1
        WHERE COALESCE(subscription_plan, plan) = 'enterprise'
          AND ai_credits_remaining != -1
      `).catch(() => {});

      // ── Fix transactions schema (add columns missing from original CREATE TABLE) ──
      await client.query(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS exchange_rate decimal(10,6) DEFAULT 1`).catch(() => {});
      await client.query(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS amount_usd decimal(15,2)`).catch(() => {});
      await client.query(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS account_id text`).catch(() => {});
      await client.query(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS tags jsonb DEFAULT '[]'::jsonb`).catch(() => {});
      await client.query(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS reconciled boolean DEFAULT false`).catch(() => {});

      // ── Fix orders schema ──
      await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone text DEFAULT ''`).catch(() => {});
      await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD'`).catch(() => {});

      // ── Fix seo_projects schema ──
      await client.query(`ALTER TABLE seo_projects ADD COLUMN IF NOT EXISTS country text DEFAULT 'US'`).catch(() => {});
      await client.query(`ALTER TABLE seo_projects ADD COLUMN IF NOT EXISTS language text DEFAULT 'en'`).catch(() => {});
      await client.query(`ALTER TABLE seo_projects ADD COLUMN IF NOT EXISTS competitors jsonb DEFAULT '[]'::jsonb`).catch(() => {});
      await client.query(`ALTER TABLE seo_projects ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true`).catch(() => {});

      console.log("[MIGRATE] Agent table schemas synced");
    } catch (e: any) { console.warn("[MIGRATE] Column migration warning:", e.message?.slice(0, 80)); }

    // ── Ensure platform owner credentials are correct on every boot ──
    try {
      const bcrypt = await import("bcrypt");
      const ownerEmail = process.env.PLATFORM_OWNER_EMAIL || "abel@argilette.com";
      const ownerPassword = process.env.PLATFORM_OWNER_PASSWORD || "ArgiletteSecure2024!";
      const hash = await bcrypt.hash(ownerPassword, 12);
      const existing = await client.query("SELECT id, tenant_id FROM users WHERE email = $1 LIMIT 1", [ownerEmail]);
      if (existing.rows.length > 0) {
        await client.query(
          "UPDATE users SET password_hash = $1, role = 'platform_owner', is_active = true, email_verified = true WHERE email = $2",
          [hash, ownerEmail]
        );
        // Ensure the platform owner's tenant is always on the unlimited enterprise plan
        const ownerRow = existing.rows[0];
        await client.query(
          `UPDATE tenants SET
            subscription_plan = 'enterprise',
            plan = 'enterprise',
            max_users = 999999,
            subscription_status = 'active',
            updated_at = now()
          WHERE id = $1`,
          [ownerRow.tenant_id]
        );
        console.log(`[MIGRATE] Platform owner credentials refreshed for ${ownerEmail}`);
      } else {
        // No user yet — find or create tenant then create user
        let tenantId: string;
        const tenantRow = await client.query("SELECT id FROM tenants LIMIT 1");
        if (tenantRow.rows.length > 0) {
          tenantId = tenantRow.rows[0].id;
        } else {
          const t = await client.query(
            "INSERT INTO tenants (name, domain, is_active) VALUES ($1, $2, true) RETURNING id",
            ["ARGILETTE LLC", `argilette.argilette.org`]
          );
          tenantId = t.rows[0].id;
        }
        await client.query(
          "INSERT INTO users (tenant_id, email, password_hash, role, is_active, email_verified) VALUES ($1, $2, $3, 'platform_owner', true, true)",
          [tenantId, ownerEmail, hash]
        );
        console.log(`[MIGRATE] Platform owner created: ${ownerEmail}`);
      }
    } catch (e: any) {
      console.warn("[MIGRATE] Owner credential setup skipped:", e.message);
    }

    client.release();
    await pool.end();
  } catch (e: any) {
    console.warn("[MIGRATE] Startup migration skipped:", e.message);
  }
}

async function main() {
  await runStartupMigrations();
  const app = express();

  // ─── Security ─────────────────────────────────────────
  app.set("trust proxy", 1);

  app.use(helmet({
    contentSecurityPolicy: false, // Allow Vite in development
    crossOriginEmbedderPolicy: false,
  }));

  app.use(cors({
    origin: isProd
      ? [
          process.env.APP_URL || "https://argilette.org",
          "https://www.argilette.org",
          /\.argilette\.org$/,
          /\.argilette\.com$/,
        ]
      : true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }));

  // ─── Rate limiting (production only) ──────────────────
  if (isProd) {
    app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: "Too many requests, please try again later" } }));
    app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));
  }

  // ─── Middleware ────────────────────────────────────────
  app.use(cookieParser());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  app.use(session({
    secret: process.env.SESSION_SECRET || "dev-session-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, secure: isProd, maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: "lax" },
    name: "argilette-session",
  }));

  // ─── Request logging ──────────────────────────────────
  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      if (req.path.startsWith("/api")) {
        const ms = Date.now() - start;
        const color = res.statusCode >= 400 ? "\x1b[31m" : "\x1b[32m";
        console.log(`${color}${req.method} ${req.path} ${res.statusCode} ${ms}ms\x1b[0m`);
      }
    });
    next();
  });

  // ─── Social media bot pre-renderer ────────────────────
  // Returns a 200 with full OG meta tags for crawlers (Facebook, Twitter, etc.)
  const SOCIAL_BOTS = /facebookexternalhit|facebot|twitterbot|linkedinbot|whatsapp|slackbot|discordbot|telegrambot|pinterest|googlebot|bingbot/i;

  const OG_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ARGILETTE CRM | AI-Powered CRM for Sales Teams &amp; Agencies</title>
  <meta name="description" content="Full CRM + 6 AI employees + white-label branding. Sell it under your own name at your own price, or use it for your team. 90% cheaper than piecing it together." />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="ARGILETTE CRM" />
  <meta property="og:url" content="https://www.argilette.org/" />
  <meta property="og:title" content="ARGILETTE CRM | AI-Powered CRM for Sales Teams &amp; Agencies" />
  <meta property="og:description" content="Full CRM + 6 AI employees + white-label branding. Sell it under your own name at your own price, or use it for your team. 90% cheaper than piecing it together." />
  <meta property="og:image" content="https://www.argilette.org/assets/og-image.png?v=3" />
  <meta property="og:image:width" content="1075" />
  <meta property="og:image:height" content="418" />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:alt" content="ARGILETTE CRM — AI-Powered CRM for Sales Teams and Agencies" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@argilette" />
  <meta name="twitter:title" content="ARGILETTE CRM | AI-Powered CRM for Sales Teams &amp; Agencies" />
  <meta name="twitter:description" content="Full CRM + 6 AI employees + white-label branding. Sell it under your own name. 90% cheaper than alternatives." />
  <meta name="twitter:image" content="https://www.argilette.org/assets/og-image.png?v=3" />
  <link rel="canonical" href="https://www.argilette.org/" />
</head>
<body>
  <h1>ARGILETTE CRM</h1>
  <p>AI-Powered CRM for Sales Teams and Agencies. Full CRM + 6 AI employees + white-label branding.</p>
  <a href="https://www.argilette.org/">Visit ARGILETTE CRM</a>
</body>
</html>`;

  app.use((req, res, next) => {
    const ua = req.headers["user-agent"] || "";
    if (SOCIAL_BOTS.test(ua) && req.method === "GET" && !req.path.startsWith("/api/")) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=3600");
      return res.status(200).send(OG_HTML);
    }
    next();
  });

  // ─── Public email tracking routes (no auth — hit by email clients) ──
  const { default: emailTrackingRouter } = await import("./routes/email-tracking.js");
  app.use("/track", emailTrackingRouter);

  // ─── Register all API routes ───────────────────────────
  const server = await registerRoutes(app);

  // ─── Seed Demo Data (runs once if tables are empty) ───
  const { seedDemoData } = await import("./seed-demo.js");
  seedDemoData().catch(err => console.error("[SEED] Error:", err));

  // ─── Start Code Healing System ─────────────────────────
  const { startHealingScheduler, healingMiddleware } = await import("./services/healing.js");
  app.use(healingMiddleware());
  startHealingScheduler();

  // ─── Start Data Marketplace Ingestion ───────────────
  const { startMarketplaceIngestion } = await import("./services/marketplace-ingestion.js");
  startMarketplaceIngestion();

  // ─── Start Workflow Automation Scheduler ─────────────
  const { startWorkflowScheduler } = await import("./routes/workflows.js");
  startWorkflowScheduler();

  // ─── Start Webhook Delivery Worker ──────────────────
  const { startWebhookWorker } = await import("./platform/webhooks.js");
  startWebhookWorker();

  // ─── Serve frontend ────────────────────────────────────
  if (isProd) {
    const distPath = path.resolve(__dirname, "public");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    // In development, Vite serves the frontend
    const { setupVite } = await import("./vite.js");
    await setupVite(app, server);
  }

  // ─── Error handler ─────────────────────────────────────
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Unhandled error:", err);
    const status = err.status || err.statusCode || 500;
    res.status(status).json({ error: err.message || "Internal server error" });
  });

  // ─── Start ─────────────────────────────────────────────
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`\n🚀 \x1b[36mARGILETTE CRM\x1b[0m is running`);
    console.log(`   Mode:    ${isProd ? "production" : "development"}`);
    console.log(`   Port:    \x1b[33m${PORT}\x1b[0m`);
    console.log(`   URL:     \x1b[34mhttp://localhost:${PORT}\x1b[0m\n`);

    if (!process.env.DATABASE_URL) {
      console.warn("⚠️  DATABASE_URL not set — database features will fail");
    }

    // Warm the healing health checks directly so first user request is fast
    setTimeout(async () => {
      try {
        const { runAllHealthChecks } = await import("./services/healing.js");
        await runAllHealthChecks();
        console.log("[WARMUP] Healing health cache warmed");
      } catch (err) {
        console.warn("[WARMUP] Cache warm failed (non-critical):", err);
      }
    }, 2000); // 2s delay to ensure all middleware is ready
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
