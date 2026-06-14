/**
 * Data-model builder API — manage custom objects, fields and saved views.
 * JWT-authenticated; mutations require admin. Mounted at /api/metadata.
 */
import { Router } from "express";
import { authenticate, requireRole, type AuthRequest } from "../middleware/auth.js";
import { db } from "../db.js";
import { sql } from "drizzle-orm";
import { z } from "zod";
import {
  createObjectDefinition, listObjectDefinitions, deleteObjectDefinition,
  addField, listFields, deleteField, FIELD_TYPES,
} from "../platform/custom-objects.js";
import { listObjects } from "../platform/objects.js";

const router = Router();
router.use(authenticate);

// ── Objects ───────────────────────────────────────────────────────────────--
router.get("/objects", async (req: AuthRequest, res) => {
  res.json({ all: await listObjects(req.tenantId!), custom: await listObjectDefinitions(req.tenantId!) });
});

const objectSchema = z.object({
  nameSingular: z.string().min(1).max(48),
  namePlural: z.string().min(1).max(48),
  labelSingular: z.string().min(1).max(80),
  labelPlural: z.string().min(1).max(80),
  icon: z.string().max(40).optional(),
  description: z.string().max(280).optional(),
});

router.post("/objects", requireRole("super_admin", "admin"), async (req: AuthRequest, res) => {
  const parsed = objectSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
  try {
    const obj = await createObjectDefinition(req.tenantId!, parsed.data, req.user!.id);
    res.status(201).json(obj);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.delete("/objects/:id", requireRole("super_admin", "admin"), async (req: AuthRequest, res) => {
  try {
    await deleteObjectDefinition(req.tenantId!, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// ── Fields ──────────────────────────────────────────────────────────────────
router.get("/objects/:objectKey/fields", async (req: AuthRequest, res) => {
  res.json(await listFields(req.tenantId!, req.params.objectKey));
});

const fieldSchema = z.object({
  name: z.string().min(1).max(48),
  label: z.string().min(1).max(80),
  type: z.enum(FIELD_TYPES),
  options: z.array(z.any()).optional(),
  isRequired: z.boolean().optional(),
  isUnique: z.boolean().optional(),
  defaultValue: z.string().optional(),
  targetObjectKey: z.string().optional(),
});

router.post("/objects/:objectKey/fields", requireRole("super_admin", "admin"), async (req: AuthRequest, res) => {
  const parsed = fieldSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
  try {
    const field = await addField(req.tenantId!, req.params.objectKey, parsed.data);
    res.status(201).json(field);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.delete("/fields/:id", requireRole("super_admin", "admin"), async (req: AuthRequest, res) => {
  try {
    await deleteField(req.tenantId!, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// ── Saved views ─────────────────────────────────────────────────────────────
router.get("/views", async (req: AuthRequest, res) => {
  const objectKey = req.query.object as string | undefined;
  const rows = objectKey
    ? await db.execute(sql`SELECT * FROM saved_views WHERE tenant_id = ${req.tenantId} AND object_key = ${objectKey} ORDER BY created_at ASC`)
    : await db.execute(sql`SELECT * FROM saved_views WHERE tenant_id = ${req.tenantId} ORDER BY created_at ASC`);
  res.json(rows.rows);
});

const viewSchema = z.object({
  objectKey: z.string().min(1),
  name: z.string().min(1).max(80),
  type: z.enum(["table", "kanban", "list", "board"]).default("table"),
  filters: z.array(z.any()).optional(),
  sort: z.record(z.any()).optional(),
  groupBy: z.string().optional(),
  visibleFields: z.array(z.string()).optional(),
  isDefault: z.boolean().optional(),
});

router.post("/views", async (req: AuthRequest, res) => {
  const parsed = viewSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
  const v = parsed.data;
  const inserted = await db.execute(sql`
    INSERT INTO saved_views (tenant_id, object_key, name, type, filters, sort, group_by, visible_fields, is_default, created_by)
    VALUES (${req.tenantId}, ${v.objectKey}, ${v.name}, ${v.type},
            ${JSON.stringify(v.filters ?? [])}::jsonb, ${JSON.stringify(v.sort ?? {})}::jsonb,
            ${v.groupBy ?? null}, ${JSON.stringify(v.visibleFields ?? [])}::jsonb, ${v.isDefault ?? false}, ${req.user!.id})
    RETURNING *
  `);
  res.status(201).json(inserted.rows[0]);
});

router.put("/views/:id", async (req: AuthRequest, res) => {
  const parsed = viewSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
  const v = parsed.data;
  const sets = [sql`updated_at = now()`];
  if (v.name !== undefined) sets.push(sql`name = ${v.name}`);
  if (v.type !== undefined) sets.push(sql`type = ${v.type}`);
  if (v.filters !== undefined) sets.push(sql`filters = ${JSON.stringify(v.filters)}::jsonb`);
  if (v.sort !== undefined) sets.push(sql`sort = ${JSON.stringify(v.sort)}::jsonb`);
  if (v.groupBy !== undefined) sets.push(sql`group_by = ${v.groupBy}`);
  if (v.visibleFields !== undefined) sets.push(sql`visible_fields = ${JSON.stringify(v.visibleFields)}::jsonb`);
  if (v.isDefault !== undefined) sets.push(sql`is_default = ${v.isDefault}`);

  const updated = await db.execute(sql`
    UPDATE saved_views SET ${sql.join(sets, sql`, `)}
    WHERE id = ${req.params.id} AND tenant_id = ${req.tenantId} RETURNING *
  `);
  if (!updated.rows.length) return res.status(404).json({ error: "View not found" });
  res.json(updated.rows[0]);
});

router.delete("/views/:id", async (req: AuthRequest, res) => {
  await db.execute(sql`DELETE FROM saved_views WHERE id = ${req.params.id} AND tenant_id = ${req.tenantId}`);
  res.json({ success: true });
});

export default router;
