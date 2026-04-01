import "dotenv/config";
import { db } from "./db.js";
import { tenants, users } from "@shared/schema";
import { pipelines } from "@shared/schema-extended";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding database (clean — no mock data)...\n");

  // ─── Platform Owner Tenant ──────────────────────────────
  let platformTenant = await db.query.tenants.findFirst({ where: eq(tenants.slug, "argilette") });

  if (!platformTenant) {
    [platformTenant] = await db.insert(tenants).values({
      name: "ARGILETTE",
      domain: "argilette.argilette.com",
      slug: "argilette",
      subscriptionPlan: "enterprise",
      subscriptionStatus: "active",
      maxUsers: 999,
      maxContacts: 999999,
      primaryColor: "#3b82f6",
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
    const hash = await bcrypt.hash(process.env.PLATFORM_OWNER_PASSWORD || "ArgiletteSecure2024!", 12);
    await db.insert(users).values({
      tenantId: platformTenant.id,
      email: ownerEmail,
      firstName: "Abel",
      lastName: "Nkawula",
      passwordHash: hash,
      role: "platform_owner",
      isActive: true,
      emailVerified: true,
      permissions: ["*"],
    });
    console.log("✅ Owner created:", ownerEmail);
  } else {
    console.log("⏭️  Owner already exists");
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
  console.log("  Login: abel@argilette.com / ArgiletteSecure2024!\n");
  process.exit(0);
}

seed().catch((err) => { console.error("❌ Seed failed:", err); process.exit(1); });
