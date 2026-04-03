import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "../components/Layout";
import { Modal, FormRow, Select, Empty, Badge, Loader } from "../components/UI";
import { apiRequest } from "../lib/api";
import { ShoppingCart, Package, Plus, Store, Zap, TrendingUp, AlertTriangle, Edit, Trash2, BarChart2, DollarSign } from "lucide-react";

const TABS = ["Products", "Orders", "Stores", "Inventory"] as const;
const ORDER_STATUS = [{ value: "pending", label: "Pending" }, { value: "processing", label: "Processing" }, { value: "shipped", label: "Shipped" }, { value: "delivered", label: "Delivered" }, { value: "cancelled", label: "Cancelled" }];
const BLANK_PRODUCT = { name: "", description: "", sku: "", price: "", currency: "USD", category: "", inventory: "100", trackInventory: true, isAvailable: true };
const BLANK_STORE = { name: "", description: "", currency: "USD", theme: "modern" };
const STORE_THEMES = [
  { value: "modern", label: "Modern", color: "#3b82f6", desc: "Clean, contemporary look" },
  { value: "minimal", label: "Minimal", color: "#64748b", desc: "Simple, distraction-free" },
  { value: "vibrant", label: "Vibrant", color: "#f59e0b", desc: "Bold, eye-catching design" },
  { value: "elegant", label: "Elegant", color: "#8b5cf6", desc: "Sophisticated & premium" },
];

export default function EcommercePage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<typeof TABS[number]>("Products");
  const [productModal, setProductModal] = useState(false);
  const [storeModal, setStoreModal] = useState(false);
  const [storeStep, setStoreStep] = useState(1);
  const [orderModal, setOrderModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(BLANK_PRODUCT);
  const [storeForm, setStoreForm] = useState(BLANK_STORE);
  const [saving, setSaving] = useState(false);
  const [optimizing, setOptimizing] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<any>(null);

  const { data: stats } = useQuery<any>({ queryKey: ["/api/ecommerce/stats"] });
  const { data: productsData } = useQuery<{ data: any[]; total: number }>({ queryKey: ["/api/ecommerce/products"], enabled: tab === "Products" || tab === "Inventory" });
  const { data: ordersData } = useQuery<{ data: any[]; stats: any }>({ queryKey: ["/api/ecommerce/orders"], enabled: tab === "Orders" });
  const { data: storesData } = useQuery<any[]>({ queryKey: ["/api/ecommerce/stores"], enabled: tab === "Stores" });
  const { data: lowStock } = useQuery<any[]>({ queryKey: ["/api/ecommerce/inventory/low-stock"], enabled: tab === "Inventory" });

  const delProduct = useMutation({ mutationFn: (id: string) => apiRequest("DELETE", `/api/ecommerce/products/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/ecommerce/products"] }) });

  const openAdd = () => { setEditing(null); setForm(BLANK_PRODUCT); setProductModal(true); };
  const openEdit = (p: any) => { setEditing(p); setForm({ name: p.name, description: p.description || "", sku: p.sku || "", price: p.price, currency: p.currency, category: p.category || "", inventory: String(p.inventory), trackInventory: p.trackInventory, isAvailable: p.isAvailable }); setProductModal(true); };

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) await apiRequest("PUT", `/api/ecommerce/products/${editing.id}`, form);
      else await apiRequest("POST", "/api/ecommerce/products", form);
      qc.invalidateQueries({ queryKey: ["/api/ecommerce/products"] });
      qc.invalidateQueries({ queryKey: ["/api/ecommerce/stats"] });
      setProductModal(false);
    } finally { setSaving(false); }
  };

  const closeStoreModal = () => { setStoreModal(false); setStoreForm(BLANK_STORE); setStoreStep(1); };

  const saveStore = async () => {
    setSaving(true);
    try {
      await apiRequest("POST", "/api/ecommerce/stores", storeForm);
      qc.invalidateQueries({ queryKey: ["/api/ecommerce/stores"] });
      closeStoreModal();
    } finally { setSaving(false); }
  };

  const optimizeProduct = async (id: string) => {
    setOptimizing(id); setAiResult(null);
    try { const result = await apiRequest("POST", "/api/ecommerce/products/ai-optimize", { productId: id }); setAiResult(result); }
    finally { setOptimizing(null); }
  };

  const STATUS_COLORS: Record<string, string> = { pending: "badge-gray", processing: "badge-blue", shipped: "badge-purple", delivered: "badge-green", cancelled: "badge-red" };

  return (
    <Layout title="E-commerce" subtitle="Stores, products, orders & inventory management"
      actions={
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setStoreModal(true)}><Store size={14} /> New Store</button>
          <button className="btn btn-primary btn-sm" onClick={openAdd}><Plus size={14} /> Add Product</button>
        </div>
      }
    >
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Stores", value: stats?.stores || 0, icon: Store, color: "#3b82f6" },
          { label: "Products", value: stats?.products || 0, icon: Package, color: "#8b5cf6" },
          { label: "Total Orders", value: stats?.orders?.total || 0, icon: ShoppingCart, color: "#10b981" },
          { label: "Revenue", value: `$${Number(stats?.orders?.revenue || 0).toLocaleString()}`, icon: DollarSign, color: "#f59e0b" },
          { label: "Low Stock", value: stats?.lowStockAlerts || 0, icon: AlertTriangle, color: "#ef4444" },
        ].map(s => { const Icon = s.icon; return (
          <div key={s.label} className="card" style={{ padding: "14px 16px", borderLeft: s.label === "Low Stock" && (stats?.lowStockAlerts || 0) > 0 ? "3px solid #ef4444" : "none" }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
              <Icon size={14} style={{ color: s.color }} />
            </div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.label}</div>
          </div>
        );})}
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {TABS.map(t => <button key={t} onClick={() => setTab(t)} className={`btn btn-sm ${tab === t ? "btn-primary" : "btn-secondary"}`}>{t}</button>)}
      </div>

      {/* ── PRODUCTS ── */}
      {tab === "Products" && (
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 80px 120px 100px", padding: "10px 16px", borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
            {["Product", "Price", "Inventory", "Status", "Category", "Actions"].map(h => (
              <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</span>
            ))}
          </div>
          {!productsData?.data?.length ? <Empty icon={Package} title="No products yet" action={<button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> Add Product</button>} /> :
            productsData.data.map((p: any) => (
              <div key={p.id} className="table-row" style={{ gridTemplateColumns: "1fr 100px 100px 80px 120px 100px", gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                  {p.sku && <div style={{ fontSize: 11, color: "var(--text-muted)" }}>SKU: {p.sku}</div>}
                </div>
                <div style={{ fontWeight: 700 }}>{p.currency} {Number(p.price).toLocaleString()}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontWeight: 700, color: (p.inventory || 0) <= (p.lowStockThreshold || 10) ? "#ef4444" : "var(--text-primary)" }}>{p.inventory}</span>
                  {(p.inventory || 0) <= (p.lowStockThreshold || 10) && <AlertTriangle size={12} style={{ color: "#ef4444" }} />}
                </div>
                <div><span className={`badge ${p.isAvailable ? "badge-green" : "badge-gray"}`}>{p.isAvailable ? "Active" : "Inactive"}</span></div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{p.category || "—"}</div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button className="btn btn-ghost btn-sm" style={{ padding: 5 }} onClick={() => openEdit(p)}><Edit size={13} /></button>
                  <button className="btn btn-primary btn-sm" style={{ padding: "4px 6px", fontSize: 11 }} disabled={optimizing === p.id} onClick={() => optimizeProduct(p.id)}><Zap size={11} /></button>
                  <button className="btn btn-ghost btn-sm" style={{ padding: 5, color: "#ef4444" }} onClick={() => { if (confirm("Delete product?")) delProduct.mutate(p.id); }}><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* ── ORDERS ── */}
      {tab === "Orders" && (
        <div>
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            {(stats?.ordersByStatus || []).map((s: any) => (
              <div key={s.status} className="card" style={{ padding: "10px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{s.count}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "capitalize" }}>{s.status}</div>
              </div>
            ))}
          </div>
          <div className="card" style={{ overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 120px 120px 100px 100px", padding: "10px 16px", borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
              {["Order #", "Customer", "Total", "Status", "Payment", "Date"].map(h => (
                <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</span>
              ))}
            </div>
            {!ordersData?.data?.length ? <Empty icon={ShoppingCart} title="No orders yet" /> :
              ordersData.data.map((o: any) => (
                <div key={o.id} className="table-row" style={{ gridTemplateColumns: "120px 1fr 120px 120px 100px 100px", gap: 12 }}>
                  <div style={{ fontWeight: 700, color: "var(--brand-light)" }}>{o.orderNumber}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{o.customerName || "Unknown"}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{o.customerEmail}</div>
                  </div>
                  <div style={{ fontWeight: 700 }}>{o.currency} {Number(o.total).toLocaleString()}</div>
                  <div><span className={`badge ${STATUS_COLORS[o.status] || "badge-gray"}`}>{o.status}</span></div>
                  <div><span className={`badge ${o.paymentStatus === "paid" ? "badge-green" : "badge-amber"}`}>{o.paymentStatus}</span></div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{new Date(o.createdAt).toLocaleDateString()}</div>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* ── STORES ── */}
      {tab === "Stores" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
          {!storesData?.length ? <div style={{ gridColumn: "1/-1" }}><Empty icon={Store} title="No stores yet" action={<button className="btn btn-primary" onClick={() => setStoreModal(true)}><Plus size={15} /> Create Store</button>} /></div> :
            storesData.map((s: any) => {
              const themeColor = STORE_THEMES.find(t => t.value === s.theme)?.color ?? "#3b82f6";
              return (
                <div key={s.id} data-testid={`card-store-${s.id}`} className="card" style={{ padding: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: themeColor + "22", border: `2px solid ${themeColor}44`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Store size={20} style={{ color: themeColor }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 15 }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.currency} · {s.theme}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <span className={`badge ${s.isPublished ? "badge-green" : "badge-gray"}`}>{s.isPublished ? "Live" : "Draft"}</span>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* ── INVENTORY ── */}
      {tab === "Inventory" && (
        <div>
          {(lowStock?.length || 0) > 0 && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "14px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
              <AlertTriangle size={18} style={{ color: "#ef4444" }} />
              <div><strong>{lowStock?.length} products</strong> are low on stock and need restocking</div>
            </div>
          )}
          <div className="card" style={{ overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 120px 120px 100px", padding: "10px 16px", borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
              {["Product", "In Stock", "Low Stock Alert", "Track", "Status"].map(h => (
                <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</span>
              ))}
            </div>
            {(productsData?.data || []).map((p: any) => {
              const isLow = p.trackInventory && p.inventory <= p.lowStockThreshold;
              return (
                <div key={p.id} className="table-row" style={{ gridTemplateColumns: "1fr 120px 120px 120px 100px", gap: 12, background: isLow ? "rgba(239,68,68,0.04)" : undefined }}>
                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontWeight: 700, color: isLow ? "#ef4444" : "var(--text-primary)" }}>{p.inventory}</div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{p.lowStockThreshold} units</div>
                  <div><span className={`badge ${p.trackInventory ? "badge-green" : "badge-gray"}`}>{p.trackInventory ? "Tracked" : "Untracked"}</span></div>
                  <div>
                    {isLow ? <span className="badge badge-red">Low Stock</span> : <span className="badge badge-green">OK</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Result Modal */}
      {aiResult && (
        <Modal open={!!aiResult} onClose={() => setAiResult(null)} title="🤖 AI Product Optimization">
          <div style={{ padding: "20px", display: "grid", gap: 14 }}>
            {aiResult.improvedTitle && <div><div className="label">Improved Title</div><div className="card" style={{ padding: "10px 14px", fontWeight: 600 }}>{aiResult.improvedTitle}</div></div>}
            {aiResult.improvedDescription && <div><div className="label">Improved Description</div><div className="card" style={{ padding: "10px 14px", fontSize: 13, lineHeight: 1.7 }}>{aiResult.improvedDescription}</div></div>}
            {aiResult.seoTitle && <div><div className="label">SEO Title</div><div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{aiResult.seoTitle}</div></div>}
            {aiResult.suggestedTags && <div><div className="label">Tags</div><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{aiResult.suggestedTags.map((t: string) => <span key={t} className="badge badge-blue">{t}</span>)}</div></div>}
            {aiResult.pricingSuggestion && <div><div className="label">Pricing Advice</div><div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{aiResult.pricingSuggestion}</div></div>}
            {aiResult.marketingAngles && <div><div className="label">Marketing Angles</div>{aiResult.marketingAngles.map((a: string, i: number) => <div key={i} style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4 }}>• {a}</div>)}</div>}
          </div>
          <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end" }}>
            <button className="btn btn-secondary" onClick={() => setAiResult(null)}>Close</button>
          </div>
        </Modal>
      )}

      {/* Product Modal */}
      <Modal open={productModal} onClose={() => setProductModal(false)} title={editing ? "Edit Product" : "Add Product"}>
        <form onSubmit={saveProduct}>
          <div style={{ padding: "20px", display: "grid", gap: 12 }}>
            <FormRow label="Product name" required><input className="input" value={form.name} onChange={e => setForm((p: any) => ({ ...p, name: e.target.value }))} required /></FormRow>
            <FormRow label="Description"><textarea className="input" value={form.description} onChange={e => setForm((p: any) => ({ ...p, description: e.target.value }))} rows={3} /></FormRow>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <FormRow label="Price" required><input type="number" className="input" value={form.price} onChange={e => setForm((p: any) => ({ ...p, price: e.target.value }))} required /></FormRow>
              <FormRow label="Currency"><input className="input" value={form.currency} onChange={e => setForm((p: any) => ({ ...p, currency: e.target.value }))} /></FormRow>
              <FormRow label="SKU"><input className="input" value={form.sku} onChange={e => setForm((p: any) => ({ ...p, sku: e.target.value }))} /></FormRow>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormRow label="Category"><input className="input" value={form.category} onChange={e => setForm((p: any) => ({ ...p, category: e.target.value }))} /></FormRow>
              <FormRow label="Inventory"><input type="number" className="input" value={form.inventory} onChange={e => setForm((p: any) => ({ ...p, inventory: e.target.value }))} /></FormRow>
            </div>
          </div>
          <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-secondary" onClick={() => setProductModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : editing ? "Save" : "Add Product"}</button>
          </div>
        </form>
      </Modal>

      {/* Store Creation Wizard */}
      <Modal open={storeModal} onClose={closeStoreModal} title={`Create Store — Step ${storeStep} of 3`}>
        <div>
          {/* Progress dots */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 20px 0" }}>
            {[1, 2, 3].map(s => (
              <div key={s} style={{ width: s === storeStep ? 28 : 10, height: 10, borderRadius: 5, background: s <= storeStep ? "var(--accent)" : "var(--border)", transition: "all 0.2s" }} />
            ))}
          </div>

          {/* Step 1: Store Details */}
          {storeStep === 1 && (
            <div style={{ padding: "20px", display: "grid", gap: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>Store Details</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>Give your store a name that customers will recognise.</div>
              <FormRow label="Store Name" required>
                <input data-testid="input-store-name" className="input" value={storeForm.name} onChange={e => setStoreForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. My Boutique" autoFocus />
              </FormRow>
              <FormRow label="Description">
                <textarea className="input" value={storeForm.description} onChange={e => setStoreForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="Briefly describe what you sell…" />
              </FormRow>
            </div>
          )}

          {/* Step 2: Currency & Theme */}
          {storeStep === 2 && (
            <div style={{ padding: "20px", display: "grid", gap: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>Currency & Appearance</div>
              <FormRow label="Store Currency">
                <input data-testid="input-store-currency" className="input" value={storeForm.currency} onChange={e => setStoreForm(p => ({ ...p, currency: e.target.value.toUpperCase() }))} placeholder="USD, EUR, NGN, XOF…" maxLength={5} />
              </FormRow>
              <div>
                <div className="label" style={{ marginBottom: 10 }}>Theme</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {STORE_THEMES.map(t => (
                    <button key={t.value} type="button" data-testid={`button-theme-${t.value}`} onClick={() => setStoreForm(p => ({ ...p, theme: t.value }))}
                      style={{ padding: "12px 14px", borderRadius: 10, border: `2px solid ${storeForm.theme === t.value ? t.color : "var(--border)"}`, background: storeForm.theme === t.value ? t.color + "18" : "var(--bg-card)", textAlign: "left", cursor: "pointer" }}>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: t.color, marginBottom: 6 }} />
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{t.label}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {storeStep === 3 && (
            <div style={{ padding: "20px", display: "grid", gap: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>Review & Launch</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>Confirm your store details before launching.</div>
              {[
                ["Store Name", storeForm.name],
                ["Description", storeForm.description || "—"],
                ["Currency", storeForm.currency],
                ["Theme", STORE_THEMES.find(t => t.value === storeForm.theme)?.label ?? storeForm.theme],
              ].map(([label, value]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "var(--bg-elevated)", borderRadius: 8, fontSize: 13 }}>
                  <span style={{ color: "var(--text-muted)" }}>{label}</span>
                  <span style={{ fontWeight: 600 }}>{value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, justifyContent: "space-between" }}>
            <button type="button" className="btn btn-secondary" onClick={storeStep === 1 ? closeStoreModal : () => setStoreStep(s => s - 1)}>
              {storeStep === 1 ? "Cancel" : "Back"}
            </button>
            {storeStep < 3 ? (
              <button data-testid="button-store-next" type="button" className="btn btn-primary" disabled={storeStep === 1 && !storeForm.name.trim()} onClick={() => setStoreStep(s => s + 1)}>
                Next
              </button>
            ) : (
              <button data-testid="button-launch-store" type="button" className="btn btn-primary" disabled={saving} onClick={saveStore}>
                {saving ? "Launching…" : "Launch Store"}
              </button>
            )}
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
