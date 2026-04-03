/**
 * PUBLIC STOREFRONT — Shopify-grade commerce experience
 * Features: real images, cart with quantities, Stripe checkout, supplier products
 */
import React, { useState, useEffect, useCallback } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";

// ── Theme configs ────────────────────────────────────────────────────────────
const THEMES: Record<string, { primary: string; accent: string; bg: string; surface: string; text: string; heroGrad: string; font: string }> = {
  modern:  { primary: "#6366f1", accent: "#3b82f6",  bg: "#f8fafc", surface: "#fff",     text: "#0f172a", heroGrad: "linear-gradient(135deg,#1e1b4b 0%,#312e81 60%,#1d4ed8 100%)", font: "Inter" },
  minimal: { primary: "#18181b", accent: "#71717a",  bg: "#ffffff", surface: "#fafafa",  text: "#18181b", heroGrad: "linear-gradient(135deg,#18181b 0%,#3f3f46 100%)",              font: "Inter" },
  vibrant: { primary: "#f97316", accent: "#eab308",  bg: "#fffbeb", surface: "#fff",     text: "#1c1917", heroGrad: "linear-gradient(135deg,#9a3412 0%,#c2410c 50%,#d97706 100%)", font: "Inter" },
  elegant: { primary: "#7c3aed", accent: "#a78bfa",  bg: "#faf5ff", surface: "#fff",     text: "#1e1040", heroGrad: "linear-gradient(135deg,#1e1040 0%,#4c1d95 60%,#6d28d9 100%)", font: "Inter" },
  nature:  { primary: "#16a34a", accent: "#84cc16",  bg: "#f0fdf4", surface: "#fff",     text: "#14532d", heroGrad: "linear-gradient(135deg,#14532d 0%,#166534 60%,#15803d 100%)", font: "Inter" },
  ocean:   { primary: "#0369a1", accent: "#0ea5e9",  bg: "#f0f9ff", surface: "#fff",     text: "#0c4a6e", heroGrad: "linear-gradient(135deg,#0c4a6e 0%,#075985 60%,#0369a1 100%)", font: "Inter" },
};

function fmt(amount: number | string, currency = "USD") {
  const n = Number(amount);
  if (isNaN(n)) return String(amount);
  try { return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 0 }).format(n); }
  catch { return `${currency} ${n.toFixed(2)}`; }
}

type CartItem = { productId: string; name: string; price: number; qty: number; image?: string; sku?: string };

// ── Checkout Modal ────────────────────────────────────────────────────────────
function CheckoutModal({ cart, store, theme, onClose, onSuccess }: {
  cart: CartItem[]; store: any; theme: any; onClose: () => void; onSuccess: (orderNum: string) => void;
}) {
  const [step, setStep] = useState<"info" | "payment" | "processing" | "done">("info");
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", city: "", state: "", zip: "", country: "US" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [payMode, setPayMode] = useState<"stripe" | "manual" | null>(null);
  const [clientSecret, setClientSecret] = useState("");
  const [stripeKey, setStripeKey] = useState("");
  const [stripeInstance, setStripeInstance] = useState<any>(null);
  const [cardElement, setCardElement] = useState<any>(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const [orderNum, setOrderNum] = useState("");

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const slug = store.slug;

  const fld = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const validateInfo = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name required";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = "Valid email required";
    if (!form.address.trim()) e.address = "Address required";
    if (!form.city.trim()) e.city = "City required";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const initPayment = async () => {
    if (!validateInfo()) return;
    setStep("payment");
    try {
      const res = await fetch(`/api/public/stores/${slug}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart, customerEmail: form.email, customerName: form.name, shippingAddress: form }),
      });
      const data = await res.json();
      setPayMode(data.mode || "manual");
      if (data.mode === "stripe" && data.clientSecret && data.stripePublishableKey) {
        setClientSecret(data.clientSecret);
        setStripeKey(data.stripePublishableKey);
        // Load Stripe.js dynamically
        if (!(window as any).Stripe) {
          await new Promise<void>((resolve, reject) => {
            const s = document.createElement("script");
            s.src = "https://js.stripe.com/v3/";
            s.onload = () => resolve();
            s.onerror = () => reject();
            document.head.appendChild(s);
          });
        }
        const stripe = (window as any).Stripe(data.stripePublishableKey);
        setStripeInstance(stripe);
        const elements = stripe.elements();
        const card = elements.create("card", { style: { base: { fontSize: "16px", color: theme.text } } });
        setTimeout(() => {
          const el = document.getElementById("stripe-card-element");
          if (el) { card.mount(el); setCardElement(card); }
        }, 100);
      }
    } catch { setPayMode("manual"); }
  };

  const completeOrder = async (paymentIntentId?: string) => {
    setPaying(true); setPayError("");
    try {
      const res = await fetch(`/api/public/stores/${slug}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map(i => ({ productId: i.productId, name: i.name, price: i.price, qty: i.qty, total: i.price * i.qty })),
          customerName: form.name, customerEmail: form.email, customerPhone: form.phone,
          shippingAddress: { address: form.address, city: form.city, state: form.state, zip: form.zip, country: form.country },
          paymentIntentId, paymentMethod: paymentIntentId ? "stripe" : "manual",
        }),
      });
      const data = await res.json();
      setOrderNum(data.orderNumber);
      onSuccess(data.orderNumber);
      setStep("done");
    } catch (e: any) { setPayError(e.message || "Order failed"); }
    finally { setPaying(false); }
  };

  const payWithStripe = async () => {
    if (!stripeInstance || !cardElement) return;
    setPaying(true); setPayError("");
    try {
      const { paymentIntent, error } = await stripeInstance.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement, billing_details: { name: form.name, email: form.email } },
      });
      if (error) { setPayError(error.message || "Payment failed"); setPaying(false); return; }
      if (paymentIntent?.status === "succeeded") await completeOrder(paymentIntent.id);
    } catch (e: any) { setPayError(e.message || "Payment error"); setPaying(false); }
  };

  const inputSt = (err?: string): React.CSSProperties => ({
    width: "100%", padding: "10px 14px", border: `1.5px solid ${err ? "#ef4444" : "#e2e8f0"}`,
    borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box",
    fontFamily: "inherit", backgroundColor: "#fff",
  });
  const labelSt: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 4, display: "block" };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.25)" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: "#0f172a" }}>
            {step === "done" ? "Order Confirmed!" : "Checkout"}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8", lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ padding: 24 }}>
          {/* Order summary */}
          {step !== "done" && (
            <div style={{ background: "#f8fafc", borderRadius: 10, padding: "14px 16px", marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 10, textTransform: "uppercase" }}>Order Summary</div>
              {cart.map(i => (
                <div key={i.productId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, fontSize: 14 }}>
                  <span style={{ color: "#334155" }}>{i.name} <span style={{ color: "#94a3b8" }}>×{i.qty}</span></span>
                  <span style={{ fontWeight: 700, color: "#0f172a" }}>{fmt(i.price * i.qty, store.currency)}</span>
                </div>
              ))}
              <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 10, marginTop: 4, display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 16 }}>
                <span>Total</span><span style={{ color: theme.primary }}>{fmt(subtotal, store.currency)}</span>
              </div>
            </div>
          )}

          {/* Step: Info */}
          {step === "info" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ fontWeight: 700, marginBottom: 4, color: "#0f172a" }}>Contact & Shipping</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelSt}>Full Name *</label>
                  <input data-testid="input-checkout-name" style={inputSt(errors.name)} placeholder="Jane Smith" value={form.name} onChange={e => fld("name", e.target.value)} />
                  {errors.name && <div style={{ color: "#ef4444", fontSize: 11, marginTop: 3 }}>{errors.name}</div>}
                </div>
                <div>
                  <label style={labelSt}>Email *</label>
                  <input data-testid="input-checkout-email" style={inputSt(errors.email)} placeholder="jane@email.com" type="email" value={form.email} onChange={e => fld("email", e.target.value)} />
                  {errors.email && <div style={{ color: "#ef4444", fontSize: 11, marginTop: 3 }}>{errors.email}</div>}
                </div>
              </div>
              <div>
                <label style={labelSt}>Phone (optional)</label>
                <input style={inputSt()} placeholder="+1 555 000 0000" value={form.phone} onChange={e => fld("phone", e.target.value)} />
              </div>
              <div>
                <label style={labelSt}>Shipping Address *</label>
                <input data-testid="input-checkout-address" style={inputSt(errors.address)} placeholder="123 Main Street" value={form.address} onChange={e => fld("address", e.target.value)} />
                {errors.address && <div style={{ color: "#ef4444", fontSize: 11, marginTop: 3 }}>{errors.address}</div>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelSt}>City *</label>
                  <input style={inputSt(errors.city)} placeholder="New York" value={form.city} onChange={e => fld("city", e.target.value)} />
                  {errors.city && <div style={{ color: "#ef4444", fontSize: 11, marginTop: 3 }}>{errors.city}</div>}
                </div>
                <div>
                  <label style={labelSt}>State</label>
                  <input style={inputSt()} placeholder="NY" value={form.state} onChange={e => fld("state", e.target.value)} />
                </div>
                <div>
                  <label style={labelSt}>ZIP</label>
                  <input style={inputSt()} placeholder="10001" value={form.zip} onChange={e => fld("zip", e.target.value)} />
                </div>
              </div>
              <button
                data-testid="button-proceed-payment"
                onClick={initPayment}
                style={{ padding: "14px", background: theme.primary, border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer", marginTop: 4 }}>
                Continue to Payment →
              </button>
            </div>
          )}

          {/* Step: Payment */}
          {step === "payment" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {payMode === "stripe" && stripeInstance ? (
                <>
                  <div style={{ fontWeight: 700, color: "#0f172a" }}>Card Payment</div>
                  <div id="stripe-card-element" style={{ padding: "14px 16px", border: "1.5px solid #e2e8f0", borderRadius: 8, minHeight: 44 }} />
                  {payError && <div style={{ color: "#ef4444", fontSize: 13, padding: "8px 12px", background: "#fef2f2", borderRadius: 6 }}>{payError}</div>}
                  <button
                    data-testid="button-pay-stripe"
                    disabled={paying}
                    onClick={payWithStripe}
                    style={{ padding: "14px", background: paying ? "#94a3b8" : "#10b981", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 16, cursor: paying ? "not-allowed" : "pointer" }}>
                    {paying ? "Processing…" : `Pay ${fmt(subtotal, store.currency)}`}
                  </button>
                </>
              ) : (
                <>
                  <div style={{ padding: 20, background: "#f8fafc", borderRadius: 10, textAlign: "center" }}>
                    <div style={{ fontSize: 32, marginBottom: 10 }}>📦</div>
                    <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Manual Order</div>
                    <div style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
                      We'll review your order and contact you with payment instructions.
                    </div>
                  </div>
                  {payError && <div style={{ color: "#ef4444", fontSize: 13, padding: "8px 12px", background: "#fef2f2", borderRadius: 6 }}>{payError}</div>}
                  <button
                    data-testid="button-place-order"
                    disabled={paying}
                    onClick={() => completeOrder()}
                    style={{ padding: "14px", background: paying ? "#94a3b8" : theme.primary, border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 16, cursor: paying ? "not-allowed" : "pointer" }}>
                    {paying ? "Placing Order…" : "Place Order"}
                  </button>
                </>
              )}
              <button onClick={() => setStep("info")} style={{ background: "none", border: "none", color: "#64748b", fontSize: 14, cursor: "pointer", textDecoration: "underline" }}>
                ← Back to shipping info
              </button>
            </div>
          )}

          {/* Step: Done */}
          {step === "done" && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 36 }}>✓</div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", marginBottom: 10 }}>Thank you, {form.name.split(" ")[0]}!</h2>
              <p style={{ color: "#64748b", fontSize: 15, lineHeight: 1.7, marginBottom: 20 }}>
                Order <strong style={{ color: "#0f172a" }}>{orderNum}</strong> has been placed.{" "}
                We'll send a confirmation to <strong>{form.email}</strong>.
              </p>
              <button
                onClick={onClose}
                style={{ padding: "12px 32px", background: theme.primary, border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                Continue Shopping
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Product Image with fallback ──────────────────────────────────────────────
function ProductImage({ images, name, theme, height = 200 }: { images?: string[]; name: string; theme: any; height?: number }) {
  const [imgIndex, setImgIndex] = useState(0);
  const [errored, setErrored] = useState(false);
  const src = images?.[imgIndex];
  if (!src || errored) {
    return (
      <div style={{ height, background: `linear-gradient(135deg,${theme.primary}18,${theme.accent}28)`, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
        <div style={{ fontSize: 40, opacity: 0.4 }}>🛍️</div>
        <div style={{ fontSize: 12, color: theme.primary, fontWeight: 600, opacity: 0.6 }}>{name.slice(0, 20)}</div>
      </div>
    );
  }
  return (
    <img
      src={src} alt={name}
      onError={() => { if (imgIndex < (images?.length || 0) - 1) setImgIndex(i => i + 1); else setErrored(true); }}
      style={{ width: "100%", height, objectFit: "cover", display: "block" }}
    />
  );
}

// ── Product Quick-View Modal ─────────────────────────────────────────────────
function QuickViewModal({ product, store, theme, onAddToCart, onClose }: {
  product: any; store: any; theme: any; onAddToCart: (item: CartItem) => void; onClose: () => void;
}) {
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);
  const images: string[] = product.images || [];
  const hasDiscount = product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price);
  const discount = hasDiscount ? Math.round((1 - Number(product.price) / Number(product.compareAtPrice)) * 100) : 0;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 800, maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.2)", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        {/* Images */}
        <div style={{ position: "relative" }}>
          <ProductImage images={images} name={product.name} theme={theme} height={400} />
          {images.length > 1 && (
            <div style={{ position: "absolute", bottom: 12, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 6 }}>
              {images.map((_, i) => (
                <button key={i} onClick={() => setImgIdx(i)} style={{ width: i === imgIdx ? 20 : 8, height: 8, borderRadius: 4, background: i === imgIdx ? "#fff" : "rgba(255,255,255,0.5)", border: "none", cursor: "pointer", transition: "all 0.2s" }} />
              ))}
            </div>
          )}
          {hasDiscount && <div style={{ position: "absolute", top: 12, left: 12, background: "#ef4444", color: "#fff", fontSize: 12, fontWeight: 700, padding: "4px 8px", borderRadius: 6 }}>-{discount}%</div>}
        </div>

        {/* Details */}
        <div style={{ padding: 28, display: "flex", flexDirection: "column" }}>
          <button onClick={onClose} style={{ alignSelf: "flex-end", background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8", marginBottom: 12 }}>✕</button>
          {product.category && <div style={{ fontSize: 11, fontWeight: 700, color: theme.primary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{product.category}</div>}
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 12, lineHeight: 1.3 }}>{product.name}</h2>
          {product.description && <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.7, marginBottom: 16, flex: 1 }}>{product.description}</p>}

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <span style={{ fontSize: 28, fontWeight: 900, color: "#0f172a" }}>{fmt(product.price, product.currency || store.currency)}</span>
            {hasDiscount && <span style={{ fontSize: 16, color: "#94a3b8", textDecoration: "line-through" }}>{fmt(product.compareAtPrice, product.currency || store.currency)}</span>}
          </div>

          {product.sku && <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 16 }}>SKU: {product.sku}</div>}

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", border: "1.5px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
              <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ padding: "8px 14px", background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#334155" }}>−</button>
              <span style={{ padding: "8px 12px", fontWeight: 700, minWidth: 32, textAlign: "center" }}>{qty}</span>
              <button onClick={() => setQty(q => q + 1)} style={{ padding: "8px 14px", background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#334155" }}>+</button>
            </div>
            <button
              data-testid={`button-add-cart-${product.id}`}
              onClick={() => { onAddToCart({ productId: product.id, name: product.name, price: Number(product.price), qty, image: images[0], sku: product.sku }); onClose(); }}
              style={{ flex: 1, padding: "12px", background: theme.primary, border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
              Add to Cart — {fmt(Number(product.price) * qty, product.currency || store.currency)}
            </button>
          </div>

          {product.inventory !== undefined && product.inventory <= 10 && product.inventory > 0 && (
            <div style={{ fontSize: 13, color: "#f97316", fontWeight: 600 }}>⚡ Only {product.inventory} left in stock!</div>
          )}
          {product.inventory === 0 && <div style={{ fontSize: 13, color: "#ef4444", fontWeight: 600 }}>Out of stock</div>}

          {product.tags && product.tags.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 16 }}>
              {(product.tags as string[]).map((tag: string) => (
                <span key={tag} style={{ padding: "4px 10px", background: `${theme.primary}12`, borderRadius: 20, fontSize: 12, color: theme.primary, fontWeight: 600 }}>{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Cart Drawer ──────────────────────────────────────────────────────────────
function CartDrawer({ cart, theme, store, onUpdate, onCheckout, onClose }: {
  cart: CartItem[]; theme: any; store: any; onUpdate: (id: string, qty: number) => void; onCheckout: () => void; onClose: () => void;
}) {
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9990, display: "flex", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ flex: 1, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(2px)" }} />
      <div style={{ width: 380, maxWidth: "100vw", background: "#fff", display: "flex", flexDirection: "column", boxShadow: "-8px 0 40px rgba(0,0,0,0.15)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: "#0f172a" }}>Your Cart ({cart.reduce((s, i) => s + i.qty, 0)})</div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>✕</button>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "16px 24px" }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
              <div style={{ fontWeight: 600 }}>Your cart is empty</div>
            </div>
          ) : cart.map(item => (
            <div key={item.productId} style={{ display: "flex", gap: 14, marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ width: 64, height: 64, borderRadius: 8, overflow: "hidden", flexShrink: 0, background: `${theme.primary}12` }}>
                {item.image ? <img src={item.image} alt={item.name} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🛍️</div>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#0f172a", marginBottom: 4 }}>{item.name}</div>
                <div style={{ fontWeight: 700, color: theme.primary, fontSize: 15 }}>{fmt(item.price, store.currency)}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", border: "1px solid #e2e8f0", borderRadius: 6 }}>
                    <button onClick={() => onUpdate(item.productId, item.qty - 1)} style={{ padding: "4px 10px", background: "none", border: "none", cursor: "pointer", color: "#334155" }}>−</button>
                    <span style={{ padding: "4px 8px", fontSize: 13, fontWeight: 700 }}>{item.qty}</span>
                    <button onClick={() => onUpdate(item.productId, item.qty + 1)} style={{ padding: "4px 10px", background: "none", border: "none", cursor: "pointer", color: "#334155" }}>+</button>
                  </div>
                  <button onClick={() => onUpdate(item.productId, 0)} style={{ background: "none", border: "none", color: "#ef4444", fontSize: 12, cursor: "pointer" }}>Remove</button>
                </div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a", flexShrink: 0 }}>{fmt(item.price * item.qty, store.currency)}</div>
            </div>
          ))}
        </div>

        {cart.length > 0 && (
          <div style={{ padding: "20px 24px", borderTop: "1px solid #f1f5f9" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <span style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>Total</span>
              <span style={{ fontWeight: 900, fontSize: 20, color: theme.primary }}>{fmt(total, store.currency)}</span>
            </div>
            <button
              data-testid="button-checkout"
              onClick={onCheckout}
              style={{ width: "100%", padding: "14px", background: theme.primary, border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
              Checkout →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── MAIN STOREFRONT ──────────────────────────────────────────────────────────
export default function StorefrontPage() {
  const [, params] = useRoute("/store/:slug");
  const slug = params?.slug || "";

  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [quickView, setQuickView] = useState<any>(null);
  const [activeSection, setActiveSection] = useState("shop");
  const [selectedCat, setSelectedCat] = useState("all");
  const [search, setSearch] = useState("");
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [contactSent, setContactSent] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "price-asc" | "price-desc" | "name">("default");

  const { data, isLoading, isError } = useQuery<{ store: any; products: any[] }>({
    queryKey: [`/api/public/stores/${slug}`],
    enabled: !!slug,
  });

  const addToCart = useCallback((item: CartItem) => {
    setCart(prev => {
      const idx = prev.findIndex(i => i.productId === item.productId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + item.qty };
        return next;
      }
      return [...prev, item];
    });
    setShowCart(true);
  }, []);

  const updateCart = useCallback((productId: string, qty: number) => {
    if (qty <= 0) setCart(prev => prev.filter(i => i.productId !== productId));
    else setCart(prev => prev.map(i => i.productId === productId ? { ...i, qty } : i));
  }, []);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  if (isLoading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a", flexDirection: "column", gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: "50%", border: "3px solid rgba(99,102,241,0.3)", borderTopColor: "#6366f1", animation: "spin 0.8s linear infinite" }} />
      <div style={{ color: "#94a3b8", fontSize: 14 }}>Loading store…</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (isError || !data?.store) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, background: "#0f172a", color: "#fff" }}>
      <div style={{ fontSize: 64 }}>🏪</div>
      <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Store Not Found</h1>
      <p style={{ color: "#94a3b8", margin: 0 }}>This store doesn't exist or has been removed.</p>
      <a href="/" style={{ padding: "10px 24px", background: "#6366f1", borderRadius: 9, color: "#fff", textDecoration: "none", fontWeight: 600 }}>Go Home</a>
    </div>
  );

  const { store, products } = data;
  const theme = THEMES[store.theme] || THEMES.modern;
  const storeData: any = store.storeData || {};
  const hero = storeData.hero || {};
  const cats: any[] = store.categories || [];

  let filtered = products;
  if (search) filtered = filtered.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase()));
  if (selectedCat !== "all") filtered = filtered.filter(p => p.category?.toLowerCase() === selectedCat.toLowerCase());
  if (sortBy === "price-asc") filtered = [...filtered].sort((a, b) => Number(a.price) - Number(b.price));
  else if (sortBy === "price-desc") filtered = [...filtered].sort((a, b) => Number(b.price) - Number(a.price));
  else if (sortBy === "name") filtered = [...filtered].sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  const featured = products.filter(p => p.isFeatured).slice(0, 4);

  const sendContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`/api/public/stores/${slug}/contact`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(contactForm) });
      setContactSent(true);
    } catch { setContactSent(true); }
  };

  const inputCss = `width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:14px;outline:none;font-family:inherit;box-sizing:border-box;`;

  return (
    <div style={{ minHeight: "100vh", background: theme.bg, fontFamily: `'${theme.font}', system-ui, sans-serif`, color: theme.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        .sf-product { transition: transform 0.2s, box-shadow 0.2s; cursor: pointer; }
        .sf-product:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.12); }
        .sf-pill { transition: all 0.15s; }
        .sf-pill:hover { background: ${theme.primary}18; color: ${theme.primary}; }
        .sf-nav-btn:hover { color: ${theme.primary} !important; }
        .sf-input { ${inputCss} transition: border 0.15s; }
        .sf-input:focus { border-color: ${theme.primary}; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        .sf-fade { animation: fadeUp 0.5s ease-out; }
        select.sf-input { appearance: none; }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 1000, background: "rgba(255,255,255,0.96)", backdropFilter: "blur(16px)", borderBottom: "1px solid #f1f5f9", padding: "0 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64, gap: 20 }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            {store.logoUrl ? (
              <img src={store.logoUrl} alt={store.name} style={{ height: 36, width: 36, borderRadius: 8, objectFit: "cover" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
            ) : (
              <div style={{ width: 36, height: 36, borderRadius: 9, background: theme.primary, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 15 }}>
                {store.name?.[0]?.toUpperCase()}
              </div>
            )}
            <span style={{ fontWeight: 800, fontSize: 18, color: theme.text }}>{store.name}</span>
          </div>

          {/* Nav links */}
          <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
            {[{ id: "shop", label: "Shop" }, { id: "about", label: "About" }, { id: "contact", label: "Contact" }].map(s => (
              <button key={s.id} className="sf-nav-btn" onClick={() => { setActiveSection(s.id); document.getElementById(`sf-${s.id}`)?.scrollIntoView({ behavior: "smooth" }); }}
                style={{ background: "none", border: "none", fontWeight: 600, fontSize: 14, color: activeSection === s.id ? theme.primary : "#475569", cursor: "pointer", transition: "color 0.15s" }}>
                {s.label}
              </button>
            ))}
          </div>

          {/* Cart button */}
          <button
            data-testid="button-cart"
            onClick={() => setShowCart(true)}
            style={{ position: "relative", display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", background: theme.primary, border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            🛒 Cart
            {cartCount > 0 && (
              <span style={{ position: "absolute", top: -6, right: -6, background: "#ef4444", color: "#fff", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ background: theme.heroGrad, padding: "90px 24px 80px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        {store.bannerUrl && (
          <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${store.bannerUrl})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.2 }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="sf-fade" style={{ maxWidth: 720, margin: "0 auto", position: "relative" }}>
          {store.tagline && <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.65)", marginBottom: 16 }}>{store.tagline}</div>}
          <h1 style={{ fontSize: "clamp(36px,6vw,64px)", fontWeight: 900, color: "#fff", lineHeight: 1.12, marginBottom: 20 }}>
            {hero.headline || `Welcome to ${store.name}`}
          </h1>
          <p style={{ fontSize: "clamp(15px,2.5vw,20px)", color: "rgba(255,255,255,0.78)", lineHeight: 1.7, marginBottom: 36, maxWidth: 600, margin: "0 auto 36px" }}>
            {hero.subheadline || store.description}
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => document.getElementById("sf-shop")?.scrollIntoView({ behavior: "smooth" })}
              style={{ padding: "14px 36px", borderRadius: 10, border: "none", background: "#fff", color: theme.primary, fontWeight: 800, fontSize: 16, cursor: "pointer" }}>
              {hero.ctaText || "Shop Now"} →
            </button>
            {products.length > 0 && (
              <button onClick={() => setShowCart(true)}
                style={{ padding: "14px 28px", borderRadius: 10, border: "2px solid rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.12)", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                View Cart
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ── */}
      {featured.length > 0 && (
        <section style={{ maxWidth: 1280, margin: "0 auto", padding: "60px 24px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
            <div style={{ width: 4, height: 24, borderRadius: 2, background: theme.primary }} />
            <h2 style={{ fontSize: 22, fontWeight: 800, color: theme.text }}>Featured Products</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 20 }}>
            {featured.map(p => (
              <div key={p.id} data-testid={`card-featured-${p.id}`} className="sf-product"
                style={{ background: theme.surface, borderRadius: 14, overflow: "hidden", border: "1px solid #e2e8f0", position: "relative" }}
                onClick={() => setQuickView(p)}>
                <ProductImage images={p.images} name={p.name} theme={theme} height={200} />
                {p.compareAtPrice && Number(p.compareAtPrice) > Number(p.price) && (
                  <div style={{ position: "absolute", top: 10, right: 10, background: "#ef4444", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 7px", borderRadius: 5 }}>
                    -{Math.round((1 - Number(p.price) / Number(p.compareAtPrice)) * 100)}%
                  </div>
                )}
                <div style={{ padding: "16px 18px" }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: theme.text, marginBottom: 6 }}>{p.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 800, fontSize: 18, color: theme.text }}>{fmt(p.price, p.currency || store.currency)}</span>
                    {p.compareAtPrice && Number(p.compareAtPrice) > Number(p.price) && (
                      <span style={{ fontSize: 13, color: "#94a3b8", textDecoration: "line-through" }}>{fmt(p.compareAtPrice, p.currency || store.currency)}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── SHOP SECTION ── */}
      <section id="sf-shop" style={{ maxWidth: 1280, margin: "0 auto", padding: "60px 24px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <div style={{ width: 4, height: 24, borderRadius: 2, background: theme.primary }} />
              <h2 style={{ fontSize: 22, fontWeight: 800, color: theme.text }}>Our Products</h2>
            </div>
            <p style={{ color: "#64748b", fontSize: 14 }}>{filtered.length} item{filtered.length !== 1 ? "s" : ""}</p>
          </div>

          {/* Search + Sort */}
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <input
              data-testid="input-search-products"
              className="sf-input"
              placeholder="Search products…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: 200 }}
            />
            <select className="sf-input" value={sortBy} onChange={e => setSortBy(e.target.value as any)} style={{ width: 160 }}>
              <option value="default">Sort: Default</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>
        </div>

        {/* Category pills */}
        {cats.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
            {[{ name: "All", slug: "all" }, ...cats].map(c => (
              <button
                key={c.slug}
                className="sf-pill"
                onClick={() => setSelectedCat(c.slug === "all" ? "all" : c.name)}
                style={{ padding: "7px 18px", borderRadius: 20, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13, transition: "all 0.15s",
                  background: (c.slug === "all" ? selectedCat === "all" : selectedCat === c.name) ? theme.primary : "#e2e8f0",
                  color: (c.slug === "all" ? selectedCat === "all" : selectedCat === c.name) ? "#fff" : "#475569" }}>
                {c.name}
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 24px", background: theme.surface, borderRadius: 16, border: "2px dashed #e2e8f0" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📦</div>
            <h3 style={{ fontWeight: 700, color: theme.text, marginBottom: 8 }}>{search ? "No results found" : "Products Coming Soon"}</h3>
            <p style={{ color: "#64748b", fontSize: 14 }}>{search ? "Try a different search term" : "The store owner is adding products. Check back soon!"}</p>
            {search && <button onClick={() => setSearch("")} style={{ marginTop: 16, padding: "8px 20px", background: theme.primary, border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, cursor: "pointer" }}>Clear Search</button>}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 24 }}>
            {filtered.map(p => {
              const hasDiscount = p.compareAtPrice && Number(p.compareAtPrice) > Number(p.price);
              const discount = hasDiscount ? Math.round((1 - Number(p.price) / Number(p.compareAtPrice)) * 100) : 0;
              return (
                <div key={p.id} data-testid={`card-product-${p.id}`} className="sf-product"
                  style={{ background: theme.surface, borderRadius: 14, overflow: "hidden", border: "1px solid #e2e8f0", position: "relative", display: "flex", flexDirection: "column" }}>
                  <div onClick={() => setQuickView(p)} style={{ flex: 1 }}>
                    <div style={{ position: "relative" }}>
                      <ProductImage images={p.images} name={p.name} theme={theme} height={200} />
                      {hasDiscount && <div style={{ position: "absolute", top: 10, left: 10, background: "#ef4444", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 7px", borderRadius: 5 }}>-{discount}%</div>}
                      {p.isFeatured && <div style={{ position: "absolute", top: 10, right: 10, background: theme.primary, color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 7px", borderRadius: 5 }}>⭐ Featured</div>}
                    </div>
                    <div style={{ padding: "14px 16px 10px" }}>
                      {p.category && <div style={{ fontSize: 10, fontWeight: 700, color: theme.primary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>{p.category}</div>}
                      <h3 style={{ fontWeight: 700, fontSize: 15, color: theme.text, marginBottom: 6, lineHeight: 1.3 }}>{p.name}</h3>
                      {p.description && (
                        <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6, marginBottom: 10, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as any}>
                          {p.description}
                        </p>
                      )}
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 19, fontWeight: 800, color: theme.text }}>{fmt(p.price, p.currency || store.currency)}</span>
                        {hasDiscount && <span style={{ fontSize: 13, color: "#94a3b8", textDecoration: "line-through" }}>{fmt(p.compareAtPrice, p.currency || store.currency)}</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: "10px 16px 16px", display: "flex", gap: 8 }}>
                    <button
                      onClick={() => setQuickView(p)}
                      style={{ flex: 0, padding: "9px 12px", background: "#f1f5f9", border: "none", borderRadius: 8, color: "#475569", fontWeight: 600, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>
                      Quick View
                    </button>
                    <button
                      data-testid={`button-add-cart-${p.id}`}
                      disabled={p.inventory === 0}
                      onClick={() => addToCart({ productId: p.id, name: p.name, price: Number(p.price), qty: 1, image: p.images?.[0], sku: p.sku })}
                      style={{ flex: 1, padding: "9px", background: p.inventory === 0 ? "#e2e8f0" : theme.primary, border: "none", borderRadius: 8, color: p.inventory === 0 ? "#94a3b8" : "#fff", fontWeight: 700, fontSize: 13, cursor: p.inventory === 0 ? "not-allowed" : "pointer" }}>
                      {p.inventory === 0 ? "Out of Stock" : "Add to Cart"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── ABOUT ── */}
      <section id="sf-about" style={{ background: theme.surface, borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "70px 24px", textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center", marginBottom: 24 }}>
            <div style={{ width: 4, height: 24, borderRadius: 2, background: theme.primary }} />
            <h2 style={{ fontSize: 28, fontWeight: 800, color: theme.text }}>About {store.name}</h2>
          </div>
          <p style={{ fontSize: 17, color: "#475569", lineHeight: 1.85 }}>{storeData.about || store.description}</p>
          {storeData.targetAudience && (
            <div style={{ marginTop: 28, padding: "16px 24px", background: `${theme.primary}08`, borderRadius: 12, fontSize: 15, color: "#475569" }}>
              <strong style={{ color: theme.primary }}>Who we serve:</strong> {storeData.targetAudience}
            </div>
          )}
          {/* Trust badges */}
          <div style={{ display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap", marginTop: 36 }}>
            {["🔒 Secure Checkout", "📦 Fast Shipping", "✅ Quality Guarantee", "💬 24/7 Support"].map(b => (
              <div key={b} style={{ fontSize: 14, fontWeight: 600, color: "#475569" }}>{b}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="sf-contact" style={{ maxWidth: 640, margin: "0 auto", padding: "70px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center", marginBottom: 12 }}>
          <div style={{ width: 4, height: 24, borderRadius: 2, background: theme.primary }} />
          <h2 style={{ fontSize: 28, fontWeight: 800, color: theme.text }}>Get in Touch</h2>
        </div>
        <p style={{ color: "#64748b", textAlign: "center", marginBottom: 36 }}>Have questions about a product or your order? We'd love to help.</p>
        {contactSent ? (
          <div style={{ textAlign: "center", padding: 40, background: `${theme.primary}08`, borderRadius: 16, border: `1.5px solid ${theme.primary}20` }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <h3 style={{ fontWeight: 700, color: theme.text, marginBottom: 6 }}>Message Sent!</h3>
            <p style={{ color: "#64748b", fontSize: 14 }}>We'll get back to you as soon as possible.</p>
          </div>
        ) : (
          <form onSubmit={sendContact} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 5, display: "block" }}>Your Name *</label>
                <input data-testid="input-contact-name" className="sf-input" placeholder="Jane Smith" required value={contactForm.name} onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 5, display: "block" }}>Email *</label>
                <input data-testid="input-contact-email" className="sf-input" type="email" placeholder="jane@email.com" required value={contactForm.email} onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 5, display: "block" }}>Message *</label>
              <textarea data-testid="input-contact-message" className="sf-input" placeholder="What can we help you with?" rows={5} required value={contactForm.message} onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))} style={{ resize: "vertical" }} />
            </div>
            <button type="submit" style={{ padding: "13px", background: theme.primary, border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
              Send Message →
            </button>
          </form>
        )}
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#0f172a", color: "rgba(255,255,255,0.6)", padding: "40px 24px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 32, marginBottom: 40 }}>
            <div style={{ maxWidth: 280 }}>
              <div style={{ fontWeight: 800, color: "#fff", fontSize: 20, marginBottom: 10 }}>{store.name}</div>
              {store.tagline && <div style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}>{store.tagline}</div>}
              <div style={{ fontSize: 13 }}>{store.description?.slice(0, 100)}</div>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: "#fff", marginBottom: 12, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.06em" }}>Quick Links</div>
              {["Shop", "About", "Contact"].map(l => (
                <div key={l} style={{ marginBottom: 8 }}>
                  <button onClick={() => document.getElementById(`sf-${l.toLowerCase()}`)?.scrollIntoView({ behavior: "smooth" })}
                    style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 14, padding: 0 }}>{l}</button>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: "#fff", marginBottom: 12, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.06em" }}>Customer Service</div>
              {["Shipping Policy", "Return Policy", "FAQ"].map(l => (
                <div key={l} style={{ marginBottom: 8, fontSize: 14, color: "rgba(255,255,255,0.5)" }}>{l}</div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 20, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, fontSize: 12 }}>
            <span>© {new Date().getFullYear()} {store.name}. All rights reserved.</span>
            <span>Powered by <a href="/" style={{ color: theme.primary, textDecoration: "none", fontWeight: 700 }}>ARGILETTE</a></span>
          </div>
        </div>
      </footer>

      {/* ── CART DRAWER ── */}
      {showCart && (
        <CartDrawer
          cart={cart} theme={theme} store={store}
          onUpdate={updateCart}
          onCheckout={() => { setShowCart(false); setShowCheckout(true); }}
          onClose={() => setShowCart(false)}
        />
      )}

      {/* ── CHECKOUT MODAL ── */}
      {showCheckout && cart.length > 0 && (
        <CheckoutModal
          cart={cart} store={store} theme={theme}
          onClose={() => setShowCheckout(false)}
          onSuccess={(num) => { setOrderConfirmed(num); setCart([]); }}
        />
      )}

      {/* ── QUICK VIEW ── */}
      {quickView && (
        <QuickViewModal
          product={quickView} store={store} theme={theme}
          onAddToCart={addToCart}
          onClose={() => setQuickView(null)}
        />
      )}

      {/* ── ORDER SUCCESS TOAST ── */}
      {orderConfirmed && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: "#10b981", color: "#fff", padding: "16px 24px", borderRadius: 12, fontWeight: 700, boxShadow: "0 8px 24px rgba(0,0,0,0.2)", animation: "fadeUp 0.3s ease-out" }}>
          ✅ Order {orderConfirmed} placed!
          <button onClick={() => setOrderConfirmed("")} style={{ background: "none", border: "none", color: "#fff", marginLeft: 12, cursor: "pointer", opacity: 0.7 }}>✕</button>
        </div>
      )}
    </div>
  );
}
