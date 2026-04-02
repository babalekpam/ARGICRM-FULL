import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL required");

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL },
  tablesFilter: [
    "tenants",
    "users",
    "contacts",
    "leads",
    "deals",
    "tasks",
    "accounts",
    "activities",
    "campaigns",
    "keywords",
    "backlinks",
    "stores",
    "projects",
    "landing_pages",
    "ab_tests",
  ],
});
