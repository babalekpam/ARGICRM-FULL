/**
 * Resolve an object key (built-in or custom) to an ObjectDescriptor the CRUD
 * engine can operate on. Custom objects are read from object_definitions /
 * field_definitions; their physical tables are created in custom-objects.ts.
 */
import { db } from "../db.js";
import { sql } from "drizzle-orm";
import { BUILTIN_DESCRIPTORS, type ObjectDescriptor } from "./registry.js";

const TEXTY = new Set(["text", "string", "email", "url", "phone"]);
const JSONB_TYPES = new Set(["json", "jsonb", "multiselect"]);

export async function resolveDescriptor(tenantId: string, key: string): Promise<ObjectDescriptor | null> {
  const builtin = BUILTIN_DESCRIPTORS[key];
  if (builtin) return builtin;

  const objRes = await db.execute(sql`
    SELECT id, name_singular, name_plural, table_name
    FROM object_definitions
    WHERE tenant_id = ${tenantId} AND is_active = true
      AND (name_plural = ${key} OR name_singular = ${key})
    LIMIT 1
  `);
  const obj = (objRes.rows as any[])[0];
  if (!obj) return null;

  const fieldsRes = await db.execute(sql`
    SELECT column_name, type FROM field_definitions
    WHERE tenant_id = ${tenantId} AND object_key = ${obj.id}
    ORDER BY position ASC
  `);
  const fields = fieldsRes.rows as any[];

  return {
    key: obj.name_plural,
    singular: obj.name_singular,
    scope: "custom",
    table: obj.table_name,
    columns: fields.map((f) => f.column_name),
    searchCols: fields.filter((f) => TEXTY.has(f.type)).map((f) => f.column_name),
    hasCustomFields: false,
    isCustom: true,
    hasCreatedBy: true,
    jsonbCols: fields.filter((f) => JSONB_TYPES.has(f.type)).map((f) => f.column_name),
    webhookSingular: undefined,
  };
}

/** List every object available to a tenant (built-in + custom) for discovery. */
export async function listObjects(tenantId: string) {
  const builtins = Object.values(BUILTIN_DESCRIPTORS).map((d) => ({
    key: d.key,
    singular: d.singular,
    isCustom: false,
  }));
  const customRes = await db.execute(sql`
    SELECT name_singular, name_plural, label_singular, label_plural, icon
    FROM object_definitions
    WHERE tenant_id = ${tenantId} AND is_active = true
    ORDER BY label_plural ASC
  `);
  const customs = (customRes.rows as any[]).map((o) => ({
    key: o.name_plural,
    singular: o.name_singular,
    labelSingular: o.label_singular,
    labelPlural: o.label_plural,
    icon: o.icon,
    isCustom: true,
  }));
  return [...builtins, ...customs];
}
