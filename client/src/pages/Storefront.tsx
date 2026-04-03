/**
 * PUBLIC STOREFRONT PAGE — no login required
 * Accessible at /store/:slug
 */
import React, { useState } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";

const THEME_CONFIGS: Record<string, { primary: string; accent: string; bg: string; heroGrad: string }> = {
  modern:     { primary: "#6366f1", accent: "#3b82f6", bg: "#f8fafc", heroGrad: "linear-gradient(135deg,#1e1b4b,#312e81)" },
  minimal:    { primary: "#18181b", accent: "#52525b", bg: "#ffffff", heroGrad: "linear-gradient(135deg,#18181b,#3f3f46)" },
  vibrant:    { primary: "#f97316", accent: "#eab308", bg: "#fffbeb", heroGrad: "linear-gradient(135deg,#c2410c,#ea580c)" },
  elegant:    { primary: "#7c3aed", accent: "#a78bfa", bg: "#faf5ff", heroGrad: "linear-gradient(135deg,#1e1040,#4c1d95)" },
  default:    { primary: "#6366f1", accent: "#3b82f6", bg: "#f8fafc", heroGrad: "linear-gradient(135deg,#1e1b4b,#312e81)" },
};

function formatPrice(amount: number | string, currency = "USD") {
  const n = Number(amount);
  if (isNaN(n)) return `${currency} —`;
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 0 }).format(n);
  } catch {
    return `${currency} ${n.toLocaleString()}`;
  }
}

export default function StorefrontPage() {
  const [, params] = useRoute("/store/:slug");
  const slug = params?.slug || "";
  const [cartCount, setCartCount] = useState(0);
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [contactSent, setContactSent] = useState(false);
  const [activeSection, setActiveSection] = useState("shop");
  const [selectedCat, setSelectedCat] = useState<string>("all");

  const { data, isLoading, isError } = useQuery<{ store: any; products: any[] }>({
    queryKey: [`/api/public/stores/${slug}`],
    enabled: !!slug,
  });

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
      <p style={{ color: "#94a3b8", margin: 0 }}>The store you're looking for doesn't exist or has been removed.</p>
      <a href="/" style={{ padding: "10px 24px", background: "#6366f1", borderRadius: 9, color: "#fff", textDecoration: "none", fontWeight: 600, marginTop: 8 }}>Go Home</a>
    </div>
  );

  const { store, products } = data;
  const theme = THEME_CONFIGS[store.theme] || THEME_CONFIGS.default;
  const storeData: any = store.storeData || {};
  const hero = storeData.hero || {};
  const cats: any[] = store.categories || [];

  const filteredProducts = selectedCat === "all"
    ? products
    : products.filter(p => p.category?.toLowerCase() === selectedCat.toLowerCase());

  const sendContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`/api/public/stores/${slug}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm),
      });
      setContactSent(true);
    } catch { setContactSent(true); }
  };

  return (
    <div style={{ minHeight: "100vh", background: theme.bg, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .sf-product-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.12); }
        .sf-product-card { transition: transform 0.2s, box-shadow 0.2s; }
        .sf-nav-link:hover { color: ${theme.primary} !important; }
        .sf-btn-primary { background: ${theme.primary} !important; }
        .sf-btn-primary:hover { opacity: 0.9; }
        .sf-cat-pill.active { background: ${theme.primary}; color: #fff; }
        .sf-cat-pill { background: #e2e8f0; color: #475569; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; transition: all 0.15s; }
        .sf-cat-pill:hover { background: ${theme.primary}20; color: ${theme.primary}; }
        .sf-input { width: 100%; padding: 10px 14px; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: 14px; outline: none; transition: border 0.15s; }
        .sf-input:focus { border-color: ${theme.primary}; }
      `}</style>

      {/* ── TOP NAV ── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #e2e8f0", padding: "0 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: theme.primary, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 16 }}>
              {store.name[0].toUpperCase()}
            </div>
            <span style={{ fontWeight: 800, fontSize: 18, color: "#0f172a" }}>{store.name}</span>
          </div>
          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            {[{ id: "shop", label: "Shop" }, { id: "about", label: "About" }, { id: "contact", label: "Contact" }].map(s => (
              <button key={s.id} className="sf-nav-link" onClick={() => { setActiveSection(s.id); document.getElementById(`section-${s.id}`)?.scrollIntoView({ behavior: "smooth" }); }}
                style={{ background: "none", border: "none", fontWeight: 600, fontSize: 14, color: activeSection === s.id ? theme.primary : "#475569", cursor: "pointer", transition: "color 0.15s" }}>
                {s.label}
              </button>
            ))}
            <div style={{ position: "relative" }}>
              <button
                data-testid="button-cart"
                onClick={() => setCartCount(0)}
                style={{ background: theme.primary, border: "none", borderRadius: 9, padding: "8px 16px", color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                🛒 Cart {cartCount > 0 && <span style={{ background: "#ef4444", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800 }}>{cartCount}</span>}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ background: theme.heroGrad, padding: "80px 24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div style={{ maxWidth: 700, margin: "0 auto", animation: "fadeUp 0.6s ease-out", position: "relative" }}>
          {store.tagline && <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)", marginBottom: 16 }}>{store.tagline}</div>}
          <h1 style={{ fontSize: "clamp(36px,6vw,60px)", fontWeight: 900, color: "#fff", lineHeight: 1.15, marginBottom: 20 }}>
            {hero.headline || `Welcome to ${store.name}`}
          </h1>
          <p style={{ fontSize: "clamp(15px,2.5vw,19px)", color: "rgba(255,255,255,0.75)", lineHeight: 1.7, marginBottom: 36 }}>
            {hero.subheadline || store.description}
          </p>
          <button
            className="sf-btn-primary"
            onClick={() => document.getElementById("section-shop")?.scrollIntoView({ behavior: "smooth" })}
            style={{ padding: "14px 36px", borderRadius: 10, border: "none", color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
            {hero.ctaText || "Shop Now"} →
          </button>
        </div>
      </section>

      {/* ── SHOP ── */}
      <section id="section-shop" style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: "#0f172a" }}>Our Products</h2>
            <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>{filteredProducts.length} item{filteredProducts.length !== 1 ? "s" : ""}</p>
          </div>
          {cats.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className={`sf-cat-pill ${selectedCat === "all" ? "active" : ""}`} onClick={() => setSelectedCat("all")}>All</button>
              {cats.map((c: any) => (
                <button key={c.slug} className={`sf-cat-pill ${selectedCat === c.name ? "active" : ""}`} onClick={() => setSelectedCat(c.name)}>{c.name}</button>
              ))}
            </div>
          )}
        </div>

        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 24px", background: "#f8fafc", borderRadius: 16, border: "2px dashed #e2e8f0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
            <h3 style={{ fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Products Coming Soon</h3>
            <p style={{ color: "#64748b", fontSize: 14 }}>The store owner is adding products. Check back soon!</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 24 }}>
            {filteredProducts.map((p: any) => (
              <div key={p.id} data-testid={`card-product-${p.id}`} className="sf-product-card" style={{ background: "#fff", borderRadius: 14, overflow: "hidden", border: "1px solid #e2e8f0" }}>
                {/* Product image placeholder */}
                <div style={{ height: 180, background: `linear-gradient(135deg,${theme.primary}12,${theme.accent}18)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>
                  🛍️
                </div>
                <div style={{ padding: 18 }}>
                  {p.category && <div style={{ fontSize: 11, fontWeight: 700, color: theme.primary, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{p.category}</div>}
                  <h3 style={{ fontWeight: 700, fontSize: 16, color: "#0f172a", marginBottom: 6, lineHeight: 1.3 }}>{p.name}</h3>
                  {p.description && <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6, marginBottom: 12, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.description}</p>}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>{formatPrice(p.price, p.currency || store.currency)}</span>
                    <button
                      data-testid={`button-add-cart-${p.id}`}
                      onClick={() => setCartCount(c => c + 1)}
                      style={{ padding: "8px 16px", background: theme.primary, border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── ABOUT ── */}
      <section id="section-about" style={{ background: "#fff", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "60px 24px", textAlign: "center" }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", marginBottom: 20 }}>About {store.name}</h2>
          <p style={{ fontSize: 16, color: "#475569", lineHeight: 1.8 }}>{storeData.about || store.description}</p>
          {storeData.targetAudience && (
            <div style={{ marginTop: 24, padding: "14px 20px", background: `${theme.primary}08`, borderRadius: 10, fontSize: 14, color: "#475569" }}>
              <strong style={{ color: theme.primary }}>Who we serve:</strong> {storeData.targetAudience}
            </div>
          )}
          {storeData.priceRange && (
            <div style={{ marginTop: 12, fontSize: 14, color: "#94a3b8" }}>Price range: {storeData.priceRange}</div>
          )}
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="section-contact" style={{ maxWidth: 600, margin: "0 auto", padding: "60px 24px" }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", marginBottom: 8, textAlign: "center" }}>Get in Touch</h2>
        <p style={{ color: "#64748b", textAlign: "center", marginBottom: 32 }}>Have questions? We'd love to hear from you.</p>
        {contactSent ? (
          <div style={{ textAlign: "center", padding: "40px", background: `${theme.primary}08`, borderRadius: 14, border: `1.5px solid ${theme.primary}20` }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
            <h3 style={{ fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Message Sent!</h3>
            <p style={{ color: "#64748b", fontSize: 14 }}>We'll get back to you as soon as possible.</p>
          </div>
        ) : (
          <form onSubmit={sendContact} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <input data-testid="input-contact-name" className="sf-input" placeholder="Your name" required value={contactForm.name} onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))} />
              <input data-testid="input-contact-email" className="sf-input" type="email" placeholder="Email address" required value={contactForm.email} onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <textarea data-testid="input-contact-message" className="sf-input" placeholder="Your message…" rows={5} required value={contactForm.message} onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))} style={{ resize: "vertical" }} />
            <button type="submit" style={{ padding: "12px", background: theme.primary, border: "none", borderRadius: 9, color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
              Send Message
            </button>
          </form>
        )}
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#0f172a", color: "rgba(255,255,255,0.6)", padding: "32px 24px", textAlign: "center" }}>
        <div style={{ fontWeight: 700, color: "#fff", marginBottom: 8, fontSize: 16 }}>{store.name}</div>
        {store.tagline && <div style={{ fontSize: 13, marginBottom: 16 }}>{store.tagline}</div>}
        <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap", fontSize: 13, marginBottom: 20 }}>
          {(storeData.pages || ["Home", "Shop", "About", "Contact"]).slice(0, 6).map((pg: string) => (
            <span key={pg} style={{ cursor: "pointer", color: "rgba(255,255,255,0.5)" }}>{pg}</span>
          ))}
        </div>
        <div style={{ fontSize: 12, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 20 }}>
          © {new Date().getFullYear()} {store.name}. Powered by <a href="/" style={{ color: theme.accent, textDecoration: "none" }}>ARGILETTE</a>
        </div>
      </footer>
    </div>
  );
}
