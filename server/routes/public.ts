/**
 * PUBLIC STOREFRONT API — no authentication required
 * Serves store data, products, checkout, and contact for live storefront pages
 */
import { Router } from "express";
import { db } from "../db.js";
import { sql } from "drizzle-orm";
import { getStripeForKey } from "../stripeClient.js";

const router = Router();

// Normalize snake_case → camelCase for frontend
const normalize = (obj: any): any => {
  if (!obj || typeof obj !== "object") return obj;
  const result: any = {};
  for (const [k, v] of Object.entries(obj)) {
    const camel = k.replace(/_([a-z])/g, (_: string, c: string) => c.toUpperCase());
    result[camel] = v;
  }
  return result;
};

// GET /api/public/stores/:slug  — full store data + products
router.get("/stores/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;
    const storeRows = await db.execute(sql`SELECT * FROM stores WHERE slug = ${slug} LIMIT 1`);
    const store = storeRows.rows?.[0] as any;
    if (!store) return res.status(404).json({ error: "Store not found" });

    const productRows = await db.execute(
      sql`SELECT * FROM products WHERE store_id = ${store.id}::uuid AND is_available = true ORDER BY is_featured DESC, created_at DESC LIMIT 200`
    );

    // Strip secret key before sending to client
    const safeStore = normalize({ ...store, stripe_secret_key: undefined });
    res.json({ store: safeStore, products: (productRows.rows || []).map(normalize) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/public/stores/:slug/checkout  — create Stripe payment intent
router.post("/stores/:slug/checkout", async (req, res) => {
  try {
    const slug = req.params.slug;
    const { items, customerEmail, customerName, shippingAddress, currency = "USD" } = req.body;

    const storeRows = await db.execute(sql`SELECT * FROM stores WHERE slug = ${slug} LIMIT 1`);
    const store = storeRows.rows?.[0] as any;
    if (!store) return res.status(404).json({ error: "Store not found" });

    // Calculate total from items
    const total = (items || []).reduce((sum: number, item: any) => sum + (Number(item.price) * (item.qty || 1)), 0);
    const totalCents = Math.round(total * 100);

    // Try Stripe if the store has keys configured
    const secretKey = store.stripe_secret_key || process.env.STRIPE_SECRET_KEY;
    if (secretKey && totalCents > 0) {
      try {
        const stripe = getStripeForKey(secretKey);
        const intent = await stripe.paymentIntents.create({
          amount: totalCents,
          currency: (store.currency || currency).toLowerCase(),
          receipt_email: customerEmail,
          metadata: {
            storeSlug: slug,
            storeName: store.name,
            customerName: customerName || "",
            itemCount: String((items || []).length),
          },
        });
        return res.json({
          clientSecret: intent.client_secret,
          paymentIntentId: intent.id,
          total,
          currency: (store.currency || currency),
          stripePublishableKey: store.stripe_publishable_key || process.env.STRIPE_PUBLISHABLE_KEY,
          mode: "stripe",
        });
      } catch (stripeErr: any) {
        console.warn("[Checkout] Stripe error, falling back to manual:", stripeErr.message);
      }
    }

    // Fallback: manual order (no Stripe)
    res.json({ mode: "manual", total, currency: store.currency || currency });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/public/stores/:slug/orders  — create order after payment
router.post("/stores/:slug/orders", async (req, res) => {
  try {
    const slug = req.params.slug;
    const { items, customerName, customerEmail, customerPhone, shippingAddress, paymentIntentId, paymentMethod = "manual" } = req.body;

    const storeRows = await db.execute(sql`SELECT * FROM stores WHERE slug = ${slug} LIMIT 1`);
    const store = storeRows.rows?.[0] as any;
    if (!store) return res.status(404).json({ error: "Store not found" });

    const subtotal = (items || []).reduce((s: number, i: any) => s + Number(i.price) * (i.qty || 1), 0);
    const total = subtotal;
    const orderNumber = `ORD-${Date.now().toString().slice(-8)}`;
    const paymentStatus = paymentIntentId ? "paid" : "pending";

    await db.execute(sql`
      INSERT INTO orders (tenant_id, store_id, order_number, status, customer_name, customer_email, customer_phone, shipping_address, items, subtotal, total, currency, payment_status, payment_method)
      VALUES (${store.tenant_id}::uuid, ${store.id}::uuid, ${orderNumber}, 'pending', ${customerName}, ${customerEmail}, ${customerPhone || ""}, ${JSON.stringify(shippingAddress || {})}::jsonb, ${JSON.stringify(items || [])}::jsonb, ${subtotal}, ${total}, ${store.currency || "USD"}, ${paymentStatus}, ${paymentMethod})
    `);

    // Deduct inventory
    for (const item of (items || [])) {
      if (item.productId) {
        await db.execute(sql`UPDATE products SET inventory = GREATEST(0, inventory - ${item.qty || 1}) WHERE id = ${item.productId}::uuid`);
      }
    }

    res.status(201).json({ orderNumber, total, currency: store.currency || "USD", paymentStatus });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/public/stores/:slug/contact  — customer contact form
router.post("/stores/:slug/contact", async (req, res) => {
  res.json({ success: true, message: "Message received! The store will get back to you soon." });
});

export default router;
