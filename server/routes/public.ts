/**
 * PUBLIC STOREFRONT API — no authentication required
 * Serves store data + products for the live storefront pages
 */
import { Router } from "express";
import { db } from "../db.js";
import { sql } from "drizzle-orm";

const router = Router();

// GET /api/public/stores/:slug  — full store data + products
router.get("/stores/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;

    // Fetch store by slug
    const storeRows = await db.execute(
      sql`SELECT * FROM stores WHERE slug = ${slug} LIMIT 1`
    );
    const store = storeRows.rows?.[0] as any;
    if (!store) return res.status(404).json({ error: "Store not found" });

    // Fetch available products for this store
    const productRows = await db.execute(
      sql`SELECT * FROM products WHERE store_id = ${store.id}::uuid ORDER BY created_at DESC LIMIT 100`
    );

    // Normalize snake_case to camelCase for frontend compatibility
    const normalize = (obj: any) => {
      const result: any = {};
      for (const [k, v] of Object.entries(obj)) {
        const camel = k.replace(/_([a-z])/g, (_: string, c: string) => c.toUpperCase());
        result[camel] = v;
      }
      return result;
    };

    res.json({ store: normalize(store), products: (productRows.rows || []).map(normalize) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/public/stores/:slug/contact  — customer contact form
router.post("/stores/:slug/contact", async (req, res) => {
  // Could save to leads table in future; for now just acknowledge
  res.json({ success: true, message: "Message received! The store will get back to you soon." });
});

export default router;
