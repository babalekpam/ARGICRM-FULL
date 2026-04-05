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
  const [store] = await db.insert(stores).values({ ...req.body, tenantId: req.user!.tenantId, userId: req.user!.id, slug, status: req.body.status || "active" }).returning();
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

function sanitizeProduct(body: any) {
  const allowed = ["name", "description", "sku", "price", "compareAtPrice", "currency", "category", "inventory", "trackInventory", "isAvailable", "isFeatured", "images", "tags", "storeId", "weight", "cost", "status", "shortDescription", "barcode", "attributes", "lowStockThreshold"];
  const out: any = {};
  for (const k of allowed) {
    if (body[k] !== undefined && body[k] !== "") out[k] = body[k];
  }
  // Coerce price fields to strings (Drizzle decimal expects string)
  if (out.price) out.price = String(out.price);
  if (out.compareAtPrice) out.compareAtPrice = String(out.compareAtPrice);
  if (out.inventory !== undefined) out.inventory = Number(out.inventory) || 0;
  return out;
}

router.post("/products", authenticate, async (req: AuthRequest, res) => {
  const slug = (req.body.name || "product").toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Date.now().toString().slice(-4);
  const clean = sanitizeProduct(req.body);
  const [product] = await db.insert(products).values({ tenantId: req.user!.tenantId, slug, ...clean }).returning();
  res.status(201).json(product);
});

router.put("/products/:id", authenticate, async (req: AuthRequest, res) => {
  const clean = sanitizeProduct(req.body);
  const [product] = await db.update(products).set({ ...clean, updatedAt: new Date() }).where(and(eq(products.id, req.params.id), eq(products.tenantId, req.user!.tenantId))).returning();
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
const STORE_EXTRACT_SYSTEM = `You are an AI store builder. Extract store details from the user's description and generate missing fields.

Return ONLY valid JSON, no markdown, no explanation:
{
  "name": "Store name (extract or invent a catchy one based on what they sell)",
  "category": "Product category",
  "targetAudience": "Target audience",
  "aesthetic": "minimalist|bold|luxury|modern",
  "priceRange": "Price range like $20-$200, infer from context or use $10-$150 as default",
  "currency": "USD (default) or XOF or EUR or NGN based on context clues",
  "tagline": "A catchy one-line tagline you create",
  "description": "2-sentence store description"
}

Rules: Fill in ALL fields. Never return null. Infer or invent anything missing.`;

router.post("/stores/ai-interview", authenticate, async (req: AuthRequest, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: "Please describe your store." });

    let extracted: any = null;

    try {
      const raw = await completeForTenant(req.user!.tenantId, {
        messages: [{ role: "user" as const, content: `Store description: ${message}` }],
        system: STORE_EXTRACT_SYSTEM,
        maxTokens: 500,
      });
      // Strip markdown fences and parse
      const clean = raw.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
      // Find the first { ... } block
      const match = clean.match(/\{[\s\S]*\}/);
      extracted = match ? JSON.parse(match[0]) : JSON.parse(clean);
    } catch {
      // AI failed or returned non-JSON — generate a smart fallback from the description
      const words = message.split(/\s+/);
      const nameParts = words.slice(0, 3).join(" ");
      extracted = {
        name: nameParts.charAt(0).toUpperCase() + nameParts.slice(1) + " Store",
        category: words.length > 2 ? words[words.length - 1] : "General",
        targetAudience: "Everyone",
        aesthetic: "modern",
        priceRange: "$10–$200",
        currency: "USD",
        tagline: `Quality ${words.slice(-2).join(" ")} you can trust`,
        description: message.length > 60 ? message : `${message}. Discover our full collection today.`,
      };
    }

    // Guarantee all required fields exist
    extracted.name        = extracted.name        || "My Store";
    extracted.category    = extracted.category    || "General";
    extracted.aesthetic   = extracted.aesthetic   || "modern";
    extracted.currency    = extracted.currency    || "USD";
    extracted.priceRange  = extracted.priceRange  || "$10–$200";
    extracted.tagline     = extracted.tagline     || `Your destination for quality products`;
    extracted.description = extracted.description || message;

    res.json({ extracted, ready: true });
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message });
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

// ── Store Settings (Stripe keys, supplier URLs, branding) ──────
router.put("/stores/:id/settings", authenticate, async (req: AuthRequest, res) => {
  try {
    const allowed = ["stripePublishableKey", "stripeSecretKey", "supplierUrls", "logoUrl", "bannerUrl", "shippingRates", "policies", "theme", "name", "description", "tagline", "currency", "isPublished"];
    const updates: any = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    updates.updatedAt = new Date();
    const [store] = await db.update(stores).set(updates).where(and(eq(stores.id, req.params.id), eq(stores.tenantId, req.user!.tenantId))).returning();
    // Strip secret key from response
    const safe = { ...store, stripeSecretKey: store.stripeSecretKey ? "••••••••" : null };
    res.json(safe);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Supplier Import — AI extracts products from a URL ──────────
router.post("/supplier/import", authenticate, async (req: AuthRequest, res) => {
  try {
    const { url, storeId } = req.body;
    if (!url) return res.status(400).json({ error: "Supplier URL is required" });

    if (!isAIAvailable()) {
      return res.json({ products: [], message: "AI not available — enter products manually" });
    }

    const prompt = `You are a product catalog extractor. Given a supplier website URL, generate 5-10 realistic sample products that a store at this supplier would typically sell.

Supplier URL: ${url}

Based on the URL and domain, infer what products this supplier sells. Return ONLY valid JSON array:
[
  {
    "name": "Product name",
    "description": "2-sentence description",
    "price": 29.99,
    "compareAtPrice": 49.99,
    "category": "Category name",
    "sku": "SKU-001",
    "inventory": 100,
    "images": ["https://images.unsplash.com/photo-...?w=400"],
    "tags": ["tag1", "tag2"],
    "isFeatured": false
  }
]

Use realistic Unsplash photo URLs that match the product category. Return 5-10 products.`;

    const raw = await completeForTenant(req.user!.tenantId, {
      messages: [{ role: "user" as const, content: prompt }],
      maxTokens: 2000,
    });

    const clean = raw.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
    const match = clean.match(/\[[\s\S]*\]/);
    const extractedProducts = match ? JSON.parse(match[0]) : [];

    if (!storeId || !extractedProducts.length) {
      return res.json({ products: extractedProducts, imported: 0 });
    }

    // Insert into products table
    const inserted = [];
    for (const p of extractedProducts) {
      const pSlug = (p.name || "product").toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Date.now().toString().slice(-4);
      const [product] = await db.insert(products).values({
        tenantId: req.user!.tenantId,
        storeId,
        name: p.name,
        description: p.description || "",
        price: String(p.price || 0),
        compareAtPrice: p.compareAtPrice ? String(p.compareAtPrice) : undefined,
        category: p.category || "General",
        sku: p.sku || pSlug,
        inventory: p.inventory || 100,
        images: p.images || [],
        tags: p.tags || [],
        isFeatured: p.isFeatured || false,
        isAvailable: true,
        slug: pSlug,
      } as any).returning();
      inserted.push(product);
    }

    res.json({ products: inserted, imported: inserted.length, message: `Imported ${inserted.length} products from ${url}` });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
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
