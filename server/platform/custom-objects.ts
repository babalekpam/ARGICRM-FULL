/**
 * Custom-object engine — the no-code data model.
 *
 * Each custom object is a REAL physical table (co_<id>) with REAL typed columns,
 * created/altered via DDL — not a generic jsonb bucket. Definitions live in
 * object_definitions / field_definitions so the registry, public API and MCP
 * server can resolve and operate on them uniformly.
 *
 * Custom fields added to BUILT-IN objects are metadata only — their values ride
 * in each core table's additive custom_fields jsonb column, so they flow through
 * the API/MCP automatically without altering the core tables column-by-column.
 */
import { db } from "../db.js";
import { sql } from "drizzle-orm";
import { randomBytes } from "crypto";
import { BUILTIN_DESCRIPTORS } from "./registry.js";

export const FIELD_TYPES = [
  "text", "number", "currency", "boolean", "date", "datetime",
  "select", "multiselect", "email", "url", "phone", "relation", "json",
] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

function sqlType(type: FieldType): string {
  switch (type) {
    case "number": return "numeric";
    case "currency": return "numeric";
    case "boolean": return "boolean";
    case "date": return "date";
    case "datetime": return "timestamp";
    case "multiselect":
    case "json": return "jsonb";
    case "relation": return "uuid";
    default: return "text"; // text, select, email, url, phone
  }
}

/** Snake_case, alnum-only identifier that always starts with a letter. */
export function sanitizeIdent(raw: string): string {
  let s = raw.trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "");
  if (!s) s = "field";
  if (!/^[a-z]/.test(s)) s = `f_${s}`;
  return s.slice(0, 48);
}

const RESERVED_COLUMNS = new Set(["id", "tenant_id", "created_at", "updated_at", "created_by"]);

// ── Objects ───────────────────────────────────────────────────────────────--
export interface CreateObjectInput {
  nameSingular: string;
  namePlural: string;
  labelSingular: string;
  labelPlural: string;
  icon?: string;
  description?: string;
}

export async function createObjectDefinition(tenantId: string, input: CreateObjectInput, userId?: string) {
  const nameSingular = sanitizeIdent(input.nameSingular);
  const namePlural = sanitizeIdent(input.namePlural);

  if (BUILTIN_DESCRIPTORS[namePlural] || BUILTIN_DESCRIPTORS[nameSingular]) {
    throw new Error(`"${namePlural}" collides with a built-in object`);
  }

  const tableName = `co_${randomBytes(6).toString("hex")}`;

  // Real, typed physical table with standard system columns.
  await db.execute(
    sql.raw(`
      CREATE TABLE IF NOT EXISTS "${tableName}" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "tenant_id" uuid NOT NULL,
        "created_by" uuid,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      )
    `),
  );
  await db.execute(sql.raw(`CREATE INDEX IF NOT EXISTS "${tableName}_tenant_idx" ON "${tableName}" ("tenant_id")`));

  const res = await db.execute(sql`
    INSERT INTO object_definitions
      (tenant_id, name_singular, name_plural, label_singular, label_plural, icon, description, is_custom, table_name, created_by)
    VALUES
      (${tenantId}, ${nameSingular}, ${namePlural}, ${input.labelSingular}, ${input.labelPlural},
       ${input.icon ?? "Box"}, ${input.description ?? null}, true, ${tableName}, ${userId ?? null})
    RETURNING *
  `);
  return (res.rows as any[])[0];
}

export async function listObjectDefinitions(tenantId: string) {
  const res = await db.execute(sql`
    SELECT * FROM object_definitions WHERE tenant_id = ${tenantId} ORDER BY created_at DESC
  `);
  return res.rows;
}

export async function deleteObjectDefinition(tenantId: string, objectId: string) {
  const obj = (
    await db.execute(sql`SELECT table_name, is_custom FROM object_definitions WHERE id = ${objectId} AND tenant_id = ${tenantId} LIMIT 1`)
  ).rows[0] as any;
  if (!obj) throw new Error("Object not found");
  if (!obj.is_custom) throw new Error("Cannot delete a built-in object");

  await db.execute(sql.raw(`DROP TABLE IF EXISTS "${obj.table_name}"`));
  await db.execute(sql`DELETE FROM field_definitions WHERE tenant_id = ${tenantId} AND object_key = ${objectId}`);
  await db.execute(sql`DELETE FROM saved_views WHERE tenant_id = ${tenantId} AND object_key = ${objectId}`);
  await db.execute(sql`DELETE FROM object_definitions WHERE id = ${objectId} AND tenant_id = ${tenantId}`);
  return true;
}

// ── Fields ──────────────────────────────────────────────────────────────────
export interface AddFieldInput {
  name: string;
  label: string;
  type: FieldType;
  options?: any[];
  isRequired?: boolean;
  isUnique?: boolean;
  defaultValue?: string;
  targetObjectKey?: string;
}

/**
 * Resolve an objectKey to { objectKey for field_definitions, customObject? }.
 * For custom objects, objectKey passed by the UI is the plural name; we store
 * field rows under the object's id and ALTER its physical table.
 */
export async function addField(tenantId: string, objectKey: string, input: AddFieldInput) {
  if (!FIELD_TYPES.includes(input.type)) throw new Error(`Invalid field type "${input.type}"`);
  const columnName = sanitizeIdent(input.name);
  if (RESERVED_COLUMNS.has(columnName)) throw new Error(`"${columnName}" is reserved`);

  const isBuiltin = !!BUILTIN_DESCRIPTORS[objectKey];
  let storedObjectKey = objectKey;
  let tableName: string | null = null;

  if (!isBuiltin) {
    const obj = (
      await db.execute(sql`
        SELECT id, table_name FROM object_definitions
        WHERE tenant_id = ${tenantId} AND (name_plural = ${objectKey} OR name_singular = ${objectKey}) LIMIT 1
      `)
    ).rows[0] as any;
    if (!obj) throw new Error(`Unknown object "${objectKey}"`);
    storedObjectKey = obj.id;
    tableName = obj.table_name;

    // Real typed column on the custom object's table.
    await db.execute(sql.raw(`ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "${columnName}" ${sqlType(input.type)}`));
    if (input.isUnique) {
      await db.execute(sql.raw(`CREATE UNIQUE INDEX IF NOT EXISTS "${tableName}_${columnName}_uniq" ON "${tableName}" ("tenant_id", "${columnName}")`)).catch(() => {});
    }
  }
  // For built-ins: no DDL — values live in the table's custom_fields jsonb,
  // and this row is the field's metadata for validation + UI.

  const posRes = await db.execute(sql`
    SELECT COALESCE(MAX(position), 0) + 1 AS pos FROM field_definitions
    WHERE tenant_id = ${tenantId} AND object_key = ${storedObjectKey}
  `);
  const position = (posRes.rows[0] as any).pos;

  const res = await db.execute(sql`
    INSERT INTO field_definitions
      (tenant_id, object_key, name, label, type, options, is_required, is_unique, default_value, target_object_key, column_name, is_custom, position)
    VALUES
      (${tenantId}, ${storedObjectKey}, ${columnName}, ${input.label}, ${input.type},
       ${JSON.stringify(input.options ?? [])}::jsonb, ${input.isRequired ?? false}, ${input.isUnique ?? false},
       ${input.defaultValue ?? null}, ${input.targetObjectKey ?? null}, ${columnName}, true, ${position})
    RETURNING *
  `);
  return (res.rows as any[])[0];
}

export async function listFields(tenantId: string, objectKey: string) {
  const isBuiltin = BUILTIN_DESCRIPTORS[objectKey];
  let storedKey = objectKey;
  if (!isBuiltin) {
    const obj = (
      await db.execute(sql`SELECT id FROM object_definitions WHERE tenant_id = ${tenantId} AND (name_plural = ${objectKey} OR name_singular = ${objectKey}) LIMIT 1`)
    ).rows[0] as any;
    if (obj) storedKey = obj.id;
  }
  const custom = (
    await db.execute(sql`SELECT * FROM field_definitions WHERE tenant_id = ${tenantId} AND object_key = ${storedKey} ORDER BY position ASC`)
  ).rows;

  // Surface built-in columns as read-only "system" fields for the UI.
  const system = isBuiltin
    ? isBuiltin.columns.map((c) => ({ name: c, label: c, type: "text", isCustom: false, isSystem: true }))
    : [];
  return { system, custom };
}

export async function deleteField(tenantId: string, fieldId: string) {
  const field = (
    await db.execute(sql`SELECT object_key, column_name FROM field_definitions WHERE id = ${fieldId} AND tenant_id = ${tenantId} LIMIT 1`)
  ).rows[0] as any;
  if (!field) throw new Error("Field not found");

  // If the owner is a custom object, drop the physical column too.
  const obj = (
    await db.execute(sql`SELECT table_name FROM object_definitions WHERE id = ${field.object_key} AND tenant_id = ${tenantId} LIMIT 1`)
  ).rows[0] as any;
  if (obj?.table_name) {
    await db.execute(sql.raw(`ALTER TABLE "${obj.table_name}" DROP COLUMN IF EXISTS "${field.column_name}"`)).catch(() => {});
  }
  await db.execute(sql`DELETE FROM field_definitions WHERE id = ${fieldId} AND tenant_id = ${tenantId}`);
  return true;
}
