import { Router } from "express";
import { authenticate, type AuthRequest } from "../middleware/auth.js";
import { db } from "../db.js";
import { stores } from "@shared/schema";
import { products, orders } from "@shared/schema-extended";
import { eq, and, desc, sql, like, lte } from "drizzle-orm";
import { isAIAvailable, getActiveProvider } from "../services/ai-adapter.js";
import { completeForTenant } from "../services/tenant-ai.js";

const router = Router();

// ── Stores ─────────────────────────────────────────────────────
router.get("/stores", authenticate, async (req: AuthRequest, res) => {
  const rows = await db.select().from(stores).where(eq(stores.tenantId, req.user!.tenantId)).orderBy(desc(stores.createdAt));
  res.json(rows);
});

router.post("/stores", authenticate, async (req: AuthRequest, res) => {
  const slug = req.body.name?.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-") + "-" + Date.now().toString().slice(-4);
  const [store] = await db.insert(stores).values({ tenantId: req.user!.tenantId, userId: req.user!.id, slug, ...req.body }).returning();
  res.status(201).json(store);
});

router.put("/stores/:id", authenticate, async (req: AuthRequest, res) => {
  const [store] = await db.update(stores).set({ ...req.body, updatedAt: new Date() }).where(and(eq(stores.id, req.params.id), eq(stores.tenantId, req.user!.tenantId))).returning();
  res.json(store);
});

// ── Products ───────────────────────────────────────────────────
router.get("/products", authenticate, async (req: AuthRequest, res) => {
  const { storeId, search, category, limit = "50", offset = "0" } = req.query as any;
  const rows = await db.select().from(products).where(
    and(
      eq(products.tenantId, req.user!.tenantId),
      storeId ? eq(products.storeId, storeId) : undefined,
      search ? like(products.name, `%${search}%`) : undefined,
      category ? eq(products.category, category) : undefined,
    )
  ).orderBy(desc(products.createdAt)).limit(Number(limit)).offset(Number(offset));

  const [{ total }] = await db.select({ total: sql<number>`count(*)` }).from(products).where(eq(products.tenantId, req.user!.tenantId));
  res.json({ data: rows, total: Number(total) });
});

router.post("/products", authenticate, async (req: AuthRequest, res) => {
  const slug = req.body.name?.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Date.now().toString().slice(-4);
  const [product] = await db.insert(products).values({ tenantId: req.user!.tenantId, slug, ...req.body }).returning();
  res.status(201).json(product);
});

router.put("/products/:id", authenticate, async (req: AuthRequest, res) => {
  const [product] = await db.update(products).set({ ...req.body, updatedAt: new Date() }).where(and(eq(products.id, req.params.id), eq(products.tenantId, req.user!.tenantId))).returning();
  res.json(product);
});

router.delete("/products/:id", authenticate, async (req: AuthRequest, res) => {
  await db.delete(products).where(and(eq(products.id, req.params.id), eq(products.tenantId, req.user!.tenantId)));
  res.json({ success: true });
});

// ── AI Product Recommendations ─────────────────────────────────
router.post("/products/ai-optimize", authenticate, async (req: AuthRequest, res) => {
  try {
    const { productId } = req.body;
    const [product] = await db.select().from(products).where(and(eq(products.id, productId), eq(products.tenantId, req.user!.tenantId)));
    if (!product) return res.status(404).json({ error: "Product not found" });

    if (!isAIAvailable()) {
      return res.json({ suggestions: ["Improve product description", "Add more images", "Consider bundle pricing", "Optimize for SEO with better title"] });
    }

    const msg = await completeForTenant(req.user!.tenantId, { messages: [{ role: "user", content: `Optimize this e-commerce product listing:
Name: ${product.name}
Description: ${product.description || "None"}
Price: ${product.price} ${product.currency}
Category: ${product.category || "Unknown"}
Inventory: ${product.inventory}

Return ONLY JSON:
{
  "improvedTitle": "better product title",
  "improvedDescription": "compelling 2-paragraph description",
  "seoTitle": "SEO-optimized meta title",
  "seoDescription": "meta description under 160 chars",
  "suggestedTags": ["tag1","tag2","tag3"]
}` }], maxTokens: 600 });
    const result = JSON.parse(msg.replace(/```json|```/g, "").trim());
    res.json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Inventory alerts ───────────────────────────────────────────
router.get("/inventory/low-stock", authenticate, async (req: AuthRequest, res) => {
  const rows = await db.select().from(products).where(
    and(
      eq(products.tenantId, req.user!.tenantId),
      eq(products.trackInventory, true),
      sql`inventory <= low_stock_threshold`
    )
  ).orderBy(products.inventory);
  res.json(rows);
});

router.put("/products/:id/inventory", authenticate, async (req: AuthRequest, res) => {
  const { adjustment, reason } = req.body; // adjustment can be +/- number
  const [product] = await db.select().from(products).where(and(eq(products.id, req.params.id), eq(products.tenantId, req.user!.tenantId)));
  if (!product) return res.status(404).json({ error: "Product not found" });

  const newInventory = (product.inventory || 0) + adjustment;
  const [updated] = await db.update(products).set({ inventory: newInventory, updatedAt: new Date() }).where(eq(products.id, req.params.id)).returning();
  res.json(updated);
});

// ── Orders ─────────────────────────────────────────────────────
router.get("/orders", authenticate, async (req: AuthRequest, res) => {
  const { storeId, status, limit = "50" } = req.query as any;
  const rows = await db.select().from(orders).where(
    and(
      eq(orders.tenantId, req.user!.tenantId),
      storeId ? eq(orders.storeId, storeId) : undefined,
      status ? eq(orders.status, status) : undefined,
    )
  ).orderBy(desc(orders.createdAt)).limit(Number(limit));

  const [stats] = await db.select({ total: sql<number>`count(*)`, revenue: sql<number>`coalesce(sum(total::numeric),0)` }).from(orders).where(and(eq(orders.tenantId, req.user!.tenantId), eq(orders.paymentStatus, "paid")));
  res.json({ data: rows, stats: { total: Number(stats.total), revenue: Number(stats.revenue) } });
});

router.post("/orders", authenticate, async (req: AuthRequest, res) => {
  const orderNumber = `ORD-${Date.now().toString().slice(-8)}`;
  const [order] = await db.insert(orders).values({ tenantId: req.user!.tenantId, orderNumber, ...req.body }).returning();

  // Deduct inventory for each item
  for (const item of req.body.items || []) {
    if (item.productId) {
      await db.update(products).set({ inventory: sql`inventory - ${item.qty}`, updatedAt: new Date() }).where(and(eq(products.id, item.productId), eq(products.tenantId, req.user!.tenantId)));
    }
  }
  res.status(201).json(order);
});

router.put("/orders/:id", authenticate, async (req: AuthRequest, res) => {
  const [order] = await db.update(orders).set({ ...req.body, updatedAt: new Date() }).where(and(eq(orders.id, req.params.id), eq(orders.tenantId, req.user!.tenantId))).returning();
  res.json(order);
});

// ── AI Store Builder ───────────────────────────────────────────
const STORE_INTERVIEW_SYSTEM = `You are an AI store builder for ArgiCRM. Help the user create an online store through natural conversation.

You need to collect: store name, product category/niche, target audience, brand aesthetic, price range, currency.

Rules:
- Ask ONE follow-up question at a time if critical info is missing
- Be warm and encouraging
- Suggest a store name if none given
- Set "ready": true only when you have name + category + at least 2 other fields

ALWAYS respond with ONLY valid JSON (no markdown):
{
  "message": "Your conversational response",
  "extracted": {
    "name": "Store name or null",
    "category": "Product category or null",
    "targetAudience": "Target audience or null",
    "aesthetic": "minimalist|bold|luxury|marketplace or null",
    "priceRange": "e.g. $20-$200 or null",
    "currency": "USD|XOF|EUR|NGN or null",
    "language": "en|fr",
    "tagline": "A catchy tagline or null",
    "description": "Store description or null"
  },
  "ready": false
}`;

router.post("/stores/ai-interview", authenticate, async (req: AuthRequest, res) => {
  try {
    const { message, history = [] } = req.body;
    const messages = [
      ...history.slice(-8),
      { role: "user" as const, content: message },
    ];
    const raw = await completeForTenant(req.user!.tenantId, {
      messages,
      system: STORE_INTERVIEW_SYSTEM,
      maxTokens: 600,
    });
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    res.json(parsed);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/stores/ai-build", authenticate, async (req: AuthRequest, res) => {
  try {
    const { extracted } = req.body;
    const user = req.user!;

    const cleanName = (extracted.name || "store")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .substring(0, 24);
    const suffix = Date.now().toString().slice(-4);
    const subdomain = `${cleanName}-${suffix}.argicrm.app`;
    const slug = `${cleanName}-${suffix}`;

    const themeMap: Record<string, string> = {
      minimalist: "minimal",
      bold: "vibrant",
      luxury: "elegant",
      marketplace: "modern",
    };
    const theme = themeMap[extracted.aesthetic] || "modern";

    const categories = extracted.category
      ? [{ name: extracted.category, slug: extracted.category.toLowerCase().replace(/\s+/g, "-") }]
      : [{ name: "General", slug: "general" }];

    const storeData = {
      hero: {
        headline: `Welcome to ${extracted.name}`,
        subheadline: extracted.tagline || `Your destination for ${extracted.category || "quality products"}`,
        ctaText: "Shop Now",
      },
      about: extracted.description || `${extracted.name} is your go-to destination for ${extracted.category || "great products"}. We serve ${extracted.targetAudience || "customers"} with quality products${extracted.priceRange ? ` priced ${extracted.priceRange}` : ""}.`,
      pages: ["Home", "Shop", "About", "Contact", "Shipping Policy", "Return Policy", "Privacy Policy"],
      targetAudience: extracted.targetAudience,
      priceRange: extracted.priceRange,
    };

    const [store] = await db
      .insert(stores)
      .values({
        tenantId: user.tenantId,
        userId: user.id,
        slug,
        name: extracted.name,
        description: extracted.description || `${extracted.category || "Products"} store`,
        tagline: extracted.tagline,
        currency: extracted.currency || "USD",
        theme,
        isPublished: false,
        aiBuilt: true,
        subdomain,
        domainStatus: "none",
        storeData,
        categories,
      })
      .returning();

    const progressLog = [
      `Store identity created: ${extracted.name}`,
      `Theme selected: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`,
      "Homepage layout built with hero section",
      `Product categories configured: ${categories.map((c: any) => c.name).join(", ")}`,
      "Pages generated: Home, Shop, About, Contact, Policies",
      `Temporary subdomain assigned: ${subdomain}`,
      "Store ready to launch",
    ];

    res.json({ store, progressLog });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/stores/:id/domain", authenticate, async (req: AuthRequest, res) => {
  const { customDomain } = req.body;
  const [store] = await db
    .update(stores)
    .set({ customDomain, domainStatus: "pending", updatedAt: new Date() })
    .where(and(eq(stores.id, req.params.id), eq(stores.tenantId, req.user!.tenantId)))
    .returning();
  res.json(store);
});

router.post("/stores/:id/domain/verify", authenticate, async (req: AuthRequest, res) => {
  const [store] = await db.select().from(stores).where(and(eq(stores.id, req.params.id), eq(stores.tenantId, req.user!.tenantId)));
  if (!store) return res.status(404).json({ error: "Store not found" });
  if (!store.customDomain) return res.status(400).json({ error: "No custom domain set" });

  // In production: poll real DNS. For demo, simulate a check.
  const isVerified = store.domainStatus === "pending" || store.domainStatus === "verifying";
  if (isVerified) {
    const [updated] = await db.update(stores).set({ domainStatus: "verified", isPublished: true, updatedAt: new Date() }).where(eq(stores.id, store.id)).returning();
    return res.json({ verified: true, store: updated });
  }
  res.json({ verified: false, message: "DNS not yet propagated. Please check your DNS records and try again in a few minutes." });
});

// ── Stats ──────────────────────────────────────────────────────
router.get("/stats", authenticate, async (req: AuthRequest, res) => {
  const [pc] = await db.select({ total: sql<number>`count(*)` }).from(products).where(eq(products.tenantId, req.user!.tenantId));
  const [oc] = await db.select({ total: sql<number>`count(*)`, revenue: sql<number>`coalesce(sum(total::numeric),0)` }).from(orders).where(and(eq(orders.tenantId, req.user!.tenantId), eq(orders.paymentStatus, "paid")));
  const [sc] = await db.select({ total: sql<number>`count(*)` }).from(stores).where(eq(stores.tenantId, req.user!.tenantId));
  const [lowStock] = await db.select({ total: sql<number>`count(*)` }).from(products).where(and(eq(products.tenantId, req.user!.tenantId), sql`inventory <= low_stock_threshold AND track_inventory = true`));
  const ordersByStatus = await db.select({ status: orders.status, count: sql<number>`count(*)` }).from(orders).where(eq(orders.tenantId, req.user!.tenantId)).groupBy(orders.status);

  res.json({
    stores: Number(sc.total),
    products: Number(pc.total),
    orders: { total: Number(oc.total), revenue: Number(oc.revenue) },
    lowStockAlerts: Number(lowStock.total),
    ordersByStatus: ordersByStatus.map(o => ({ status: o.status, count: Number(o.count) })),
  });
});

export default router;
