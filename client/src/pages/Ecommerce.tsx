import React, { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "../components/Layout";
import { Modal, FormRow, Empty, Loader } from "../components/UI";
import { apiRequest } from "../lib/api";
import {
  ShoppingCart, Package, Plus, Store, Zap, AlertTriangle, Edit,
  Trash2, Bot, Send, CheckCircle2, Globe, Copy, ExternalLink,
  Sparkles, ArrowLeft, RefreshCw, BarChart2, DollarSign,
} from "lucide-react";

const TABS = ["Products", "Orders", "Stores", "Inventory"] as const;
const ORDER_STATUS = [
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];
const BLANK_PRODUCT = {
  name: "", description: "", sku: "", price: "", currency: "USD",
  category: "", inventory: "100", trackInventory: true, isAvailable: true,
};

type StoreBuilderMode = "list" | "interview" | "building" | "complete" | "domain";
type ChatMessage = { role: "user" | "assistant"; content: string; pending?: boolean };

const ARIA_AVATAR = (
  <div style={{
    width: 28, height: 28, borderRadius: "50%",
    background: "linear-gradient(135deg,#6366f1,#3b82f6)",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  }}>
    <Bot size={13} color="#fff" />
  </div>
);

export default function EcommercePage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<typeof TABS[number]>("Products");

  // Product/Order state
  const [productModal, setProductModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(BLANK_PRODUCT);
  const [saving, setSaving] = useState(false);
  const [optimizing, setOptimizing] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<any>(null);

  // AI Store Builder state
  const [storeMode, setStoreMode] = useState<StoreBuilderMode>("list");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hi! I'm your AI store builder. Tell me about your store idea — what do you sell, who are your customers, and what's your brand like? Just describe it naturally!",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<any>({});
  const [isReady, setIsReady] = useState(false);
  const [buildProgress, setBuildProgress] = useState<string[]>([]);
  const [buildingStep, setBuildingStep] = useState(0);
  const [builtStore, setBuiltStore] = useState<any>(null);
  const [domainInput, setDomainInput] = useState("");
  const [domainSaving, setDomainSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [selectedStore, setSelectedStore] = useState<any>(null);

  const chatScrollRef = useRef<HTMLDivElement>(null);

  const scrollChat = useCallback(() => {
    setTimeout(() => {
      if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }, 50);
  }, []);

  useEffect(() => { scrollChat(); }, [chatMessages, scrollChat]);

  const { data: stats } = useQuery<any>({ queryKey: ["/api/ecommerce/stats"] });
  const { data: productsData } = useQuery<{ data: any[]; total: number }>({
    queryKey: ["/api/ecommerce/products"],
    enabled: tab === "Products" || tab === "Inventory",
  });
  const { data: ordersData } = useQuery<{ data: any[]; stats: any }>({
    queryKey: ["/api/ecommerce/orders"],
    enabled: tab === "Orders",
  });
  const { data: storesData } = useQuery<any[]>({
    queryKey: ["/api/ecommerce/stores"],
    enabled: tab === "Stores",
  });
  const { data: lowStock } = useQuery<any[]>({
    queryKey: ["/api/ecommerce/inventory/low-stock"],
    enabled: tab === "Inventory",
  });

  const delProduct = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/ecommerce/products/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/ecommerce/products"] }),
  });

  const openAdd = () => { setEditing(null); setForm(BLANK_PRODUCT); setProductModal(true); };
  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      name: p.name, description: p.description || "", sku: p.sku || "",
      price: p.price, currency: p.currency, category: p.category || "",
      inventory: String(p.inventory), trackInventory: p.trackInventory, isAvailable: p.isAvailable,
    });
    setProductModal(true);
  };

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

  const optimizeProduct = async (id: string) => {
    setOptimizing(id); setAiResult(null);
    try {
      const result = await apiRequest("POST", "/api/ecommerce/products/ai-optimize", { productId: id });
      setAiResult(result);
    } finally { setOptimizing(null); }
  };

  // ── AI Store Builder ──────────────────────────────────────────
  const openStoreBuilder = () => {
    setChatMessages([{
      role: "assistant",
      content: "Hi! I'm your AI store builder. Tell me about your store idea — what do you sell, who are your customers, and what's your brand vibe? Just describe it in plain language!",
    }]);
    setChatInput("");
    setExtractedData({});
    setIsReady(false);
    setBuildProgress([]);
    setBuildingStep(0);
    setBuiltStore(null);
    setDomainInput("");
    setStoreMode("interview");
  };

  const sendInterviewMessage = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    setChatInput("");

    const userMsg: ChatMessage = { role: "user", content: text };
    const pendingMsg: ChatMessage = { role: "assistant", content: "", pending: true };
    setChatMessages(prev => [...prev, userMsg, pendingMsg]);
    setChatLoading(true);

    const history = chatMessages
      .filter(m => !m.pending)
      .map(m => ({ role: m.role, content: m.content }));

    try {
      const result: any = await apiRequest("POST", "/api/ecommerce/stores/ai-interview", {
        message: text,
        history,
        extracted: extractedData,
      });

      setChatMessages(prev => {
        const filtered = prev.filter(m => !m.pending);
        return [...filtered, { role: "assistant", content: result.message }];
      });

      if (result.extracted) {
        setExtractedData((prev: any) => {
          const merged = { ...prev };
          Object.entries(result.extracted || {}).forEach(([k, v]) => {
            if (v && v !== "null" && v !== null) merged[k] = v;
          });
          return merged;
        });
      }

      if (result.ready) setIsReady(true);
    } catch {
      setChatMessages(prev => {
        const filtered = prev.filter(m => !m.pending);
        return [...filtered, { role: "assistant", content: "Sorry, I ran into an issue. Please try again." }];
      });
    } finally {
      setChatLoading(false);
    }
  };

  const buildStore = async () => {
    setStoreMode("building");
    setBuildingStep(0);
    setBuildProgress([]);

    try {
      const result: any = await apiRequest("POST", "/api/ecommerce/stores/ai-build", {
        extracted: extractedData,
      });

      const logs: string[] = result.progressLog || [];
      for (let i = 0; i < logs.length; i++) {
        await new Promise(r => setTimeout(r, 500));
        setBuildProgress(prev => [...prev, logs[i]]);
        setBuildingStep(i + 1);
      }

      await new Promise(r => setTimeout(r, 400));
      setBuiltStore(result.store);
      qc.invalidateQueries({ queryKey: ["/api/ecommerce/stores"] });
      qc.invalidateQueries({ queryKey: ["/api/ecommerce/stats"] });
      setStoreMode("complete");
    } catch (err: any) {
      setBuildProgress(prev => [...prev, `Error: ${err.message}`]);
    }
  };

  const saveDomain = async () => {
    if (!builtStore || !domainInput.trim()) return;
    setDomainSaving(true);
    try {
      const updated: any = await apiRequest("POST", `/api/ecommerce/stores/${builtStore.id}/domain`, {
        customDomain: domainInput.trim(),
      });
      setBuiltStore(updated);
      qc.invalidateQueries({ queryKey: ["/api/ecommerce/stores"] });
    } finally { setDomainSaving(false); }
  };

  const verifyDomain = async () => {
    if (!builtStore) return;
    setVerifying(true);
    try {
      const result: any = await apiRequest("POST", `/api/ecommerce/stores/${builtStore.id}/domain/verify`);
      if (result.verified) {
        setBuiltStore(result.store);
        qc.invalidateQueries({ queryKey: ["/api/ecommerce/stores"] });
      }
    } finally { setVerifying(false); }
  };

  const openDomainPanel = (store: any) => {
    setBuiltStore(store);
    setDomainInput(store.customDomain || "");
    setStoreMode("domain");
  };

  const STATUS_COLORS: Record<string, string> = {
    pending: "badge-gray", processing: "badge-blue", shipped: "badge-purple",
    delivered: "badge-green", cancelled: "badge-red",
  };

  const handleChatKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendInterviewMessage(); }
  };

  // ── Store Builder Full-Screen Overlay ────────────────────────
  if (storeMode !== "list" && tab === "Stores") {
    return (
      <Layout title="E-commerce" subtitle="AI Store Builder">
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          {/* Back button */}
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setStoreMode("list")}
            style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}
          >
            <ArrowLeft size={14} /> Back to Stores
          </button>

          {/* ── INTERVIEW MODE ── */}
          {storeMode === "interview" && (
            <div className="card" style={{ overflow: "hidden" }}>
              <div style={{
                padding: "16px 20px",
                borderBottom: "1px solid var(--border)",
                background: "linear-gradient(135deg,rgba(99,102,241,0.1),rgba(59,130,246,0.06))",
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: "linear-gradient(135deg,#6366f1,#3b82f6)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Sparkles size={18} color="#fff" />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>AI Store Builder</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Describe your store in plain language — ARIA will build it for you</div>
                </div>
              </div>

              {/* Chat messages */}
              <div
                ref={chatScrollRef}
                style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12, minHeight: 320, maxHeight: 400, overflowY: "auto", scrollbarWidth: "none" }}
              >
                {chatMessages.map((msg, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", gap: 8, alignItems: "flex-end" }}>
                    {msg.role === "assistant" && ARIA_AVATAR}
                    <div style={{
                      maxWidth: "80%",
                      padding: "10px 14px",
                      borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                      background: msg.role === "user"
                        ? "linear-gradient(135deg,#6366f1,#3b82f6)"
                        : "var(--bg-elevated)",
                      color: msg.role === "user" ? "#fff" : "var(--text-primary)",
                      fontSize: 13,
                      lineHeight: 1.6,
                      border: msg.role === "assistant" ? "1px solid var(--border)" : "none",
                    }}>
                      {msg.pending ? (
                        <div style={{ display: "flex", gap: 4, padding: "2px 0" }}>
                          {[0, 1, 2].map(d => (
                            <div key={d} style={{
                              width: 6, height: 6, borderRadius: "50%", background: "var(--text-muted)",
                              animation: `bounce 1.2s ${d * 0.2}s ease-in-out infinite`,
                            }} />
                          ))}
                        </div>
                      ) : msg.content}
                    </div>
                  </div>
                ))}
              </div>

              {/* Extracted preview */}
              {Object.keys(extractedData).some(k => extractedData[k]) && (
                <div style={{ margin: "0 20px 12px", padding: "12px 14px", background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Collected so far</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {extractedData.name && <span className="badge badge-blue">{extractedData.name}</span>}
                    {extractedData.category && <span className="badge badge-purple">{extractedData.category}</span>}
                    {extractedData.targetAudience && <span className="badge badge-gray">Audience: {extractedData.targetAudience}</span>}
                    {extractedData.priceRange && <span className="badge badge-green">{extractedData.priceRange}</span>}
                    {extractedData.currency && <span className="badge badge-amber">{extractedData.currency}</span>}
                    {extractedData.aesthetic && <span className="badge badge-gray">{extractedData.aesthetic}</span>}
                  </div>
                </div>
              )}

              {/* Ready to build */}
              {isReady && (
                <div style={{ margin: "0 20px 12px", padding: "14px 16px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 10 }}>
                  <div style={{ fontWeight: 700, color: "#10b981", marginBottom: 4 }}>Ready to build your store!</div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>
                    ARIA has everything needed to build <strong>{extractedData.name || "your store"}</strong>. Click below to start the automated build process.
                  </div>
                  <button
                    data-testid="button-build-store"
                    className="btn btn-primary"
                    onClick={buildStore}
                    style={{ background: "linear-gradient(135deg,#6366f1,#3b82f6)", border: "none", display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <Sparkles size={15} /> Build My Store Automatically
                  </button>
                </div>
              )}

              {/* Input */}
              <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  data-testid="input-store-interview"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={handleChatKey}
                  placeholder={isReady ? "Any changes before building?" : "Describe your store..."}
                  disabled={chatLoading}
                  style={{
                    flex: 1, background: "var(--bg-elevated)", border: "1px solid var(--border)",
                    borderRadius: 10, padding: "10px 14px", fontSize: 13,
                    color: "var(--text-primary)", outline: "none",
                  }}
                  autoFocus
                />
                <button
                  data-testid="button-interview-send"
                  onClick={sendInterviewMessage}
                  disabled={!chatInput.trim() || chatLoading}
                  className="btn btn-primary"
                  style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 6 }}
                >
                  {chatLoading ? <RefreshCw size={14} style={{ animation: "spin 0.8s linear infinite" }} /> : <Send size={14} />}
                </button>
              </div>
            </div>
          )}

          {/* ── BUILDING MODE ── */}
          {storeMode === "building" && (
            <div className="card" style={{ padding: 28, textAlign: "center" }}>
              <div style={{
                width: 60, height: 60, borderRadius: "50%",
                background: "linear-gradient(135deg,#6366f1,#3b82f6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px",
                animation: "spin 2s linear infinite",
              }}>
                <Sparkles size={26} color="#fff" />
              </div>
              <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 6 }}>Building Your Store</div>
              <div style={{ color: "var(--text-muted)", marginBottom: 24, fontSize: 13 }}>ARIA is generating your complete store — this takes just a moment</div>

              <div style={{ textAlign: "left", maxWidth: 400, margin: "0 auto", display: "flex", flexDirection: "column", gap: 10 }}>
                {buildProgress.map((step, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 13 }}>{step}</span>
                  </div>
                ))}
                {buildProgress.length < 7 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: "50%",
                      border: "2px solid #6366f1",
                      borderTopColor: "transparent",
                      animation: "spin 0.8s linear infinite",
                      flexShrink: 0,
                    }} />
                    <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Working…</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── COMPLETE MODE ── */}
          {storeMode === "complete" && builtStore && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="card" style={{ padding: 28, textAlign: "center" }}>
                <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: "rgba(16,185,129,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 16px",
                  border: "2px solid rgba(16,185,129,0.3)",
                }}>
                  <CheckCircle2 size={28} color="#10b981" />
                </div>
                <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 6 }}>Your Store is Ready!</div>
                <div style={{ color: "var(--text-muted)", marginBottom: 16, fontSize: 14 }}>
                  <strong>{builtStore.name}</strong> has been built successfully
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 20 }}>
                  <span className="badge badge-green">Live</span>
                  <span className="badge badge-blue">{builtStore.theme}</span>
                  <span className="badge badge-gray">{builtStore.currency}</span>
                  {builtStore.aiBuilt && <span className="badge badge-purple">AI Built</span>}
                </div>
                {builtStore.subdomain && (
                  <div style={{ padding: "12px 16px", background: "var(--bg-elevated)", borderRadius: 10, border: "1px solid var(--border)", marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Temporary subdomain</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                      <Globe size={14} color="#6366f1" />
                      <code style={{ fontSize: 13, color: "#6366f1", fontWeight: 600 }}>{builtStore.subdomain}</code>
                      <button
                        onClick={() => navigator.clipboard?.writeText(builtStore.subdomain)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 2, display: "flex" }}
                        title="Copy"
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                  </div>
                )}
                <button
                  data-testid="button-connect-domain"
                  className="btn btn-primary"
                  onClick={() => setStoreMode("domain")}
                  style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 auto" }}
                >
                  <Globe size={15} /> Connect Your Domain
                </button>
              </div>

              {/* Build log */}
              <div className="card" style={{ padding: 20 }}>
                <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>Build Log</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {buildProgress.map((step, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <CheckCircle2 size={14} color="#10b981" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── DOMAIN MODE ── */}
          {storeMode === "domain" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="card" style={{ padding: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: "rgba(99,102,241,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Globe size={20} color="#6366f1" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16 }}>Connect Your Domain</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Point your custom domain to {builtStore?.name || "your store"}</div>
                  </div>
                </div>

                <FormRow label="Your domain (e.g. www.mystore.com)">
                  <input
                    data-testid="input-custom-domain"
                    className="input"
                    value={domainInput}
                    onChange={e => setDomainInput(e.target.value)}
                    placeholder="www.yourdomain.com"
                  />
                </FormRow>

                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button
                    data-testid="button-save-domain"
                    className="btn btn-primary"
                    onClick={saveDomain}
                    disabled={!domainInput.trim() || domainSaving}
                    style={{ flex: 1 }}
                  >
                    {domainSaving ? "Saving…" : "Save Domain"}
                  </button>
                  {builtStore?.customDomain && builtStore?.domainStatus === "pending" && (
                    <button
                      data-testid="button-verify-domain"
                      className="btn btn-secondary"
                      onClick={verifyDomain}
                      disabled={verifying}
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <RefreshCw size={13} style={{ animation: verifying ? "spin 0.8s linear infinite" : "none" }} />
                      Verify DNS
                    </button>
                  )}
                </div>

                {builtStore?.domainStatus === "verified" && (
                  <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8, display: "flex", alignItems: "center", gap: 8 }}>
                    <CheckCircle2 size={14} color="#10b981" />
                    <span style={{ fontSize: 13, color: "#10b981", fontWeight: 600 }}>Domain verified! Your store is live at {builtStore.customDomain}</span>
                  </div>
                )}
              </div>

              {/* DNS Records */}
              {builtStore?.customDomain && (
                <div className="card" style={{ padding: 24 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 14 }}>Required DNS Records</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
                    Add these records at your domain registrar (Namecheap, GoDaddy, etc.)
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      { type: "A", host: "@", value: "76.76.21.21", desc: "Root domain" },
                      { type: "CNAME", host: "www", value: "stores.argicrm.app", desc: "www subdomain" },
                    ].map((r, i) => (
                      <div key={i} style={{
                        display: "grid", gridTemplateColumns: "60px 80px 1fr 80px",
                        gap: 10, padding: "10px 14px",
                        background: "var(--bg-elevated)", borderRadius: 8,
                        alignItems: "center", fontSize: 13,
                      }}>
                        <span className="badge badge-blue" style={{ justifySelf: "start" }}>{r.type}</span>
                        <code style={{ fontFamily: "monospace", fontSize: 12 }}>{r.host}</code>
                        <code style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.value}</code>
                        <button
                          onClick={() => navigator.clipboard?.writeText(r.value)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4, fontSize: 11, padding: "4px 8px", borderRadius: 6 }}
                        >
                          <Copy size={10} /> Copy
                        </button>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 14, padding: "12px 14px", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, fontSize: 12, color: "var(--text-secondary)" }}>
                    DNS changes can take up to 24–48 hours to propagate. Your store is accessible at{" "}
                    <code style={{ color: "#6366f1" }}>{builtStore.subdomain}</code> in the meantime.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <style>{`
          @keyframes bounce {
            0%, 60%, 100% { transform: translateY(0); }
            30% { transform: translateY(-5px); }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </Layout>
    );
  }

  // ── Main layout ───────────────────────────────────────────────
  return (
    <Layout
      title="E-commerce"
      subtitle="Stores, products, orders & inventory management"
      actions={
        <div style={{ display: "flex", gap: 8 }}>
          {tab === "Stores" && (
            <button className="btn btn-primary btn-sm" onClick={() => { setTab("Stores"); openStoreBuilder(); }}>
              <Bot size={14} /> AI Store Builder
            </button>
          )}
          {tab === "Products" && (
            <button className="btn btn-primary btn-sm" onClick={openAdd}><Plus size={14} /> Add Product</button>
          )}
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
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card" style={{ padding: "14px 16px", borderLeft: s.label === "Low Stock" && (stats?.lowStockAlerts || 0) > 0 ? "3px solid #ef4444" : "none" }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                <Icon size={14} style={{ color: s.color }} />
              </div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.label}</div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`btn btn-sm ${tab === t ? "btn-primary" : "btn-secondary"}`}>{t}</button>
        ))}
      </div>

      {/* ── PRODUCTS ── */}
      {tab === "Products" && (
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 80px 120px 100px", padding: "10px 16px", borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
            {["Product", "Price", "Inventory", "Status", "Category", "Actions"].map(h => (
              <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</span>
            ))}
          </div>
          {!productsData?.data?.length
            ? <Empty icon={Package} title="No products yet" action={<button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> Add Product</button>} />
            : productsData.data.map((p: any) => (
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
            ))
          }
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
            {!ordersData?.data?.length
              ? <Empty icon={ShoppingCart} title="No orders yet" />
              : ordersData.data.map((o: any) => (
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
        <div>
          {!storesData?.length ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", gap: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: "linear-gradient(135deg,rgba(99,102,241,0.15),rgba(59,130,246,0.1))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Store size={28} color="#6366f1" />
              </div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>No stores yet</div>
              <div style={{ color: "var(--text-muted)", textAlign: "center", maxWidth: 360, fontSize: 14 }}>
                Create your first store using our AI builder — just describe your idea in plain language and ARIA will build it for you.
              </div>
              <button
                data-testid="button-create-store-ai"
                className="btn btn-primary"
                onClick={openStoreBuilder}
                style={{ display: "flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg,#6366f1,#3b82f6)", border: "none" }}
              >
                <Bot size={16} /> Create Store with AI
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
              <div
                className="card"
                onClick={openStoreBuilder}
                style={{ padding: 20, border: "2px dashed var(--border)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, minHeight: 160, textAlign: "center" }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,rgba(99,102,241,0.12),rgba(59,130,246,0.08))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Bot size={20} color="#6366f1" />
                </div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Create New Store</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>AI-powered store builder</div>
              </div>

              {storesData.map((s: any) => (
                <div key={s.id} data-testid={`card-store-${s.id}`} className="card" style={{ padding: 20 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(99,102,241,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Store size={18} color="#6366f1" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 14 }}>{s.name}</div>
                        {s.tagline && <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.tagline}</div>}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <span className={`badge ${s.isPublished ? "badge-green" : "badge-gray"}`}>{s.isPublished ? "Live" : "Draft"}</span>
                      {s.aiBuilt && <span className="badge badge-purple">AI</span>}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10 }}>{s.currency} · {s.theme}</div>
                  {s.subdomain && (
                    <div style={{ fontSize: 11, color: "#6366f1", marginBottom: 10 }}>
                      <Globe size={10} style={{ display: "inline", marginRight: 4 }} />{s.customDomain || s.subdomain}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => openDomainPanel(s)}
                      style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
                    >
                      <Globe size={12} /> Domain
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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

      {/* AI Product Optimization Result Modal */}
      {aiResult && (
        <Modal open={!!aiResult} onClose={() => setAiResult(null)} title="AI Product Optimization">
          <div style={{ padding: "20px", display: "grid", gap: 14 }}>
            {aiResult.improvedTitle && <div><div className="label">Improved Title</div><div className="card" style={{ padding: "10px 14px", fontWeight: 600 }}>{aiResult.improvedTitle}</div></div>}
            {aiResult.improvedDescription && <div><div className="label">Improved Description</div><div className="card" style={{ padding: "10px 14px", fontSize: 13, lineHeight: 1.7 }}>{aiResult.improvedDescription}</div></div>}
            {aiResult.seoTitle && <div><div className="label">SEO Title</div><div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{aiResult.seoTitle}</div></div>}
            {aiResult.suggestedTags && <div><div className="label">Tags</div><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{aiResult.suggestedTags.map((t: string) => <span key={t} className="badge badge-blue">{t}</span>)}</div></div>}
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

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Layout>
  );
}
