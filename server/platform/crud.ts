/**
 * Generic, metadata-driven CRUD engine.
 *
 * One code path serves built-in CRM tables and dynamic custom-object tables
 * alike — it operates purely off an ObjectDescriptor (table + writable column
 * whitelist). All access is tenant-scoped, mass-assignment is constrained to
 * the whitelist, and mutations fan out to webhook subscribers.
 */
import { db } from "../db.js";
import { sql, SQL } from "drizzle-orm";
import { emitEvent } from "./webhooks.js";
import type { ObjectDescriptor } from "./registry.js";

const ident = (name: string): SQL => sql.raw(`"${name}"`);
const toSnake = (s: string) => s.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
const toCamel = (s: string) => s.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());

export function serialize(row: Record<string, any> | undefined): any {
  if (!row) return row;
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(row)) out[toCamel(k)] = v;
  return out;
}

function valChunk(d: ObjectDescriptor, col: string, v: any): SQL {
  if (d.jsonbCols?.includes(col)) return sql`${JSON.stringify(v ?? null)}::jsonb`;
  return sql`${v}`;
}

/** Project a request body onto the descriptor's writable columns. */
function projectBody(d: ObjectDescriptor, body: Record<string, any>): { col: string; value: any }[] {
  const out: { col: string; value: any }[] = [];
  for (const [rawKey, value] of Object.entries(body || {})) {
    if (rawKey === "customFields" || rawKey === "id") continue;
    const col = toSnake(rawKey);
    if (d.columns.includes(col)) out.push({ col, value });
  }
  return out;
}

export interface ListOptions {
  limit?: number;
  offset?: number;
  search?: string;
  filters?: Record<string, any>;
  sort?: string; // "field:asc" | "field:desc"
}

export async function listRecords(d: ObjectDescriptor, tenantId: string, opts: ListOptions = {}) {
  const limit = Math.min(Math.max(opts.limit ?? 25, 1), 100);
  const offset = Math.max(opts.offset ?? 0, 0);

  const where: SQL[] = [sql`tenant_id = ${tenantId}`];

  for (const [k, v] of Object.entries(opts.filters || {})) {
    const col = toSnake(k);
    if (d.columns.includes(col)) where.push(sql`${ident(col)} = ${v}`);
  }

  if (opts.search && d.searchCols.length) {
    const term = `%${opts.search.toLowerCase()}%`;
    const likes = d.searchCols.map((c) => sql`LOWER(COALESCE(${ident(c)}::text, '')) LIKE ${term}`);
    where.push(sql`(${sql.join(likes, sql` OR `)})`);
  }

  const whereSql = sql.join(where, sql` AND `);

  let orderCol = "created_at";
  let orderDir = sql.raw("DESC");
  if (opts.sort) {
    const [f, dir] = opts.sort.split(":");
    const col = toSnake(f);
    if (d.columns.includes(col) || col === "created_at" || col === "id") {
      orderCol = col;
      orderDir = sql.raw(dir?.toLowerCase() === "asc" ? "ASC" : "DESC");
    }
  }

  const totalRes = await db.execute(sql`SELECT COUNT(*)::int AS count FROM ${ident(d.table)} WHERE ${whereSql}`);
  const rowsRes = await db.execute(sql`
    SELECT * FROM ${ident(d.table)} WHERE ${whereSql}
    ORDER BY ${ident(orderCol)} ${orderDir} NULLS LAST
    LIMIT ${limit} OFFSET ${offset}
  `);

  return {
    data: (rowsRes.rows as any[]).map(serialize),
    total: (totalRes.rows[0] as any).count as number,
    limit,
    offset,
  };
}

export async function getRecord(d: ObjectDescriptor, id: string, tenantId: string) {
  const res = await db.execute(sql`
    SELECT * FROM ${ident(d.table)} WHERE id = ${id} AND tenant_id = ${tenantId} LIMIT 1
  `);
  return serialize((res.rows as any[])[0]);
}

export async function createRecord(
  d: ObjectDescriptor,
  tenantId: string,
  body: Record<string, any>,
  createdBy?: string | null,
) {
  const fields = projectBody(d, body);

  const cols: SQL[] = [ident("tenant_id")];
  const vals: SQL[] = [sql`${tenantId}`];

  for (const f of fields) {
    cols.push(ident(f.col));
    vals.push(valChunk(d, f.col, f.value));
  }
  if (d.hasCreatedBy) {
    cols.push(ident("created_by"));
    vals.push(sql`${createdBy ?? null}`);
  }
  if (d.hasCustomFields && body.customFields && typeof body.customFields === "object") {
    cols.push(ident("custom_fields"));
    vals.push(sql`${JSON.stringify(body.customFields)}::jsonb`);
  }

  const res = await db.execute(sql`
    INSERT INTO ${ident(d.table)} (${sql.join(cols, sql`, `)})
    VALUES (${sql.join(vals, sql`, `)})
    RETURNING *
  `);
  const row = serialize((res.rows as any[])[0]);
  if (d.webhookSingular) void emitEvent(tenantId, `${d.webhookSingular}.created`, row);
  return row;
}

export async function updateRecord(
  d: ObjectDescriptor,
  id: string,
  tenantId: string,
  body: Record<string, any>,
) {
  const fields = projectBody(d, body);
  const sets: SQL[] = [];
  for (const f of fields) sets.push(sql`${ident(f.col)} = ${valChunk(d, f.col, f.value)}`);

  if (d.hasCustomFields && body.customFields && typeof body.customFields === "object") {
    // Merge rather than replace, so partial updates don't drop keys.
    sets.push(sql`custom_fields = COALESCE(custom_fields, '{}'::jsonb) || ${JSON.stringify(body.customFields)}::jsonb`);
  }
  if (d.columns.includes("updated_at") || true) sets.push(sql`updated_at = now()`);

  if (!sets.length) return getRecord(d, id, tenantId);

  const res = await db.execute(sql`
    UPDATE ${ident(d.table)} SET ${sql.join(sets, sql`, `)}
    WHERE id = ${id} AND tenant_id = ${tenantId}
    RETURNING *
  `);
  const row = serialize((res.rows as any[])[0]);
  if (row && d.webhookSingular) void emitEvent(tenantId, `${d.webhookSingular}.updated`, row);
  return row;
}

export async function deleteRecord(d: ObjectDescriptor, id: string, tenantId: string) {
  const res = await db.execute(sql`
    DELETE FROM ${ident(d.table)} WHERE id = ${id} AND tenant_id = ${tenantId} RETURNING id
  `);
  const deleted = (res.rows as any[])[0];
  if (deleted && d.webhookSingular) void emitEvent(tenantId, `${d.webhookSingular}.deleted`, { id });
  return !!deleted;
}
