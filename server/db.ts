import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";
import * as schemaExtended from "@shared/schema-extended";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Add it to your .env file or Replit Secrets.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  keepAlive: true,
});

pool.on("error", (err) => {
  console.error("PostgreSQL pool error:", err.message);
});

pool.on("connect", (client) => {
  client.on("error", (err) => {
    console.error("PostgreSQL client error:", err.message);
  });
});

export const db = drizzle(pool, { schema: { ...schema, ...schemaExtended } });
export { pool };
