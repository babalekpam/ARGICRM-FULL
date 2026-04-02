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
  if (process.env.NODE_ENV !== "production") return;
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
    ];
    let created = 0, skipped = 0;
    for (const stmt of statements) {
      try { await client.query(stmt); created++; }
      catch (e: any) { if (e.message?.includes("already exists")) skipped++; }
    }
    if (created > 0) console.log(`[MIGRATE] Created ${created} tables, ${skipped} already existed`);

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

  // ─── Register all API routes ───────────────────────────
  const server = await registerRoutes(app);

  // ─── Start Code Healing System ─────────────────────────
  const { startHealingScheduler, healingMiddleware } = await import("./services/healing.js");
  app.use(healingMiddleware());
  startHealingScheduler();

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
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
