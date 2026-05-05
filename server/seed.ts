import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { db } from "./db.js";
import { tenants, users } from "@shared/schema";
import { pipelines } from "@shared/schema-extended";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

// ─── Password generation ────────────────────────────────
// Random URL-safe 32-char password. Used as the bootstrap admin password
// whenever PLATFORM_OWNER_PASSWORD is not provided (and rejected outright
// in production — the auto-generated flow is the only supported one there).
function generateRandomPassword(): string {
  return crypto.randomBytes(24).toString("base64url"); // ~32 chars, URL-safe
}

// Resolve the bootstrap password according to the documented contract:
//   - Production: env vars are ignored. Always auto-generate. Caller writes
//     the result to ./bootstrap-credentials.txt (mode 0600).
//   - Development: if PLATFORM_OWNER_PASSWORD is set, use it. Otherwise
//     auto-generate and write the file (same as production).
function resolveBootstrapPassword(): { password: string; persisted: boolean } {
  const envPwd = process.env.PLATFORM_OWNER_PASSWORD;
  const isProd = process.env.NODE_ENV === "production";
  if (envPwd && !isProd) return { password: envPwd, persisted: false };
  if (envPwd && isProd) {
    console.warn(
      "[SEED] PLATFORM_OWNER_PASSWORD is set in production and will be ignored. " +
      "Production bootstraps must use the auto-generated flow."
    );
  }
  return { password: generateRandomPassword(), persisted: true };
}

function writeBootstrapCredentialsFile(email: string, password: string): string {
  const file = path.resolve(process.cwd(), "bootstrap-credentials.txt");
  const body =
    `# Argilette CRM — bootstrap credentials\n` +
    `# Generated: ${new Date().toISOString()}\n` +
    `#\n` +
    `# Read this file ONCE, log in, change the password immediately, then delete it.\n` +
    `# This file is mode 0600 and is .gitignored — do not commit.\n` +
    `\n` +
    `email:    ${email}\n` +
    `password: ${password}\n`;
  fs.writeFileSync(file, body, { mode: 0o600, flag: "w" });
  try { fs.chmodSync(file, 0o600); } catch { /* best-effort on platforms without chmod */ }
  return file;
}

async function seed() {
  console.log("🌱 Seeding database (clean — no mock data)...\n");

  // ─── Platform Owner Tenant ──────────────────────────────
  let platformTenant = await db.query.tenants.findFirst({ where: eq(tenants.name, "ARGILETTE") });

  if (!platformTenant) {
    [platformTenant] = await db.insert(tenants).values({
      name: "ARGILETTE",
      domain: "argilette.argilette.org",
      subscriptionPlan: "enterprise",
      subscriptionStatus: "active",
      plan: "enterprise",
      maxUsers: 999,
      isActive: true,
      settings: { timezone: "America/Chicago", currency: "USD", language: "en" },
    }).returning();
    console.log("✅ Platform tenant:", platformTenant.name);
  } else {
    console.log("⏭️  Tenant already exists");
  }

  // ─── Platform Owner ──────────────────────────────────────
  const ownerEmail = process.env.PLATFORM_OWNER_EMAIL || "abel@argilette.com";
  const existing = await db.query.users.findFirst({ where: eq(users.email, ownerEmail) });

  if (!existing) {
    const { password, persisted } = resolveBootstrapPassword();
    const hash = await bcrypt.hash(password, 12);
    await db.insert(users).values({
      tenantId: platformTenant.id,
      email: ownerEmail,
      firstName: "Abel",
      lastName: "Nkawula",
      passwordHash: hash,
      role: "platform_owner",
      isActive: true,
      emailVerified: true,
      isAdmin: true,
    });
    console.log("✅ Owner created:", ownerEmail);

    if (persisted) {
      const file = writeBootstrapCredentialsFile(ownerEmail, password);
      console.log("\n🔐 Bootstrap credentials written to:");
      console.log(`   ${file}`);
      console.log("   (mode 0600, .gitignored — read once, log in, rotate, delete)\n");
    } else {
      console.log("\n🔐 Bootstrap password sourced from PLATFORM_OWNER_PASSWORD env var.");
      console.log("   Rotate immediately after first login.\n");
    }
  } else {
    console.log("⏭️  Owner already exists (no bootstrap-credentials.txt rewritten)");
  }

  // ─── Default Pipeline ────────────────────────────────────
  const existingPipeline = await db.select().from(pipelines).where(eq(pipelines.tenantId, platformTenant.id)).limit(1);
  if (!existingPipeline.length) {
    await db.insert(pipelines).values({
      tenantId: platformTenant.id,
      name: "Sales Pipeline",
      isDefault: true,
      stages: [
        { id: "prospecting",   name: "Prospecting",   order: 1, color: "#6366f1", probability: 10 },
        { id: "qualification", name: "Qualification", order: 2, color: "#3b82f6", probability: 25 },
        { id: "proposal",      name: "Proposal",      order: 3, color: "#f59e0b", probability: 50 },
        { id: "negotiation",   name: "Negotiation",   order: 4, color: "#f97316", probability: 75 },
        { id: "closed_won",    name: "Closed Won",    order: 5, color: "#10b981", probability: 100 },
        { id: "closed_lost",   name: "Closed Lost",   order: 6, color: "#ef4444", probability: 0 },
      ],
    });
    console.log("✅ Default pipeline created");
  } else {
    console.log("⏭️  Pipeline already exists");
  }

  console.log("\n✨ Done — clean workspace.\n");
  process.exit(0);
}

seed().catch((err) => { console.error("❌ Seed failed:", err); process.exit(1); });
