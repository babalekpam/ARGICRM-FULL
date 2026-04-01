import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "../components/Layout";
import { Avatar, Badge, Loader, Empty } from "../components/UI";
import { apiRequest } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import {
  Building2, Users, Globe, TrendingUp, Zap, Shield, Crown,
  ToggleLeft, ToggleRight, ChevronRight, Activity, Bot,
  MessageSquare, Database, ArrowUpRight, Settings, AlertCircle
} from "lucide-react";

export default function SuperAdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "tenants" | "agents" | "settings">("overview");
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const qc = useQueryClient();

  const { data: overview, isLoading: overviewLoading } = useQuery<any>({ queryKey: ["/api/superadmin/overview"] });
  const { data: tenants, isLoading: tenantsLoading } = useQuery<any[]>({ queryKey: ["/api/superadmin/tenants"], enabled: activeTab === "tenants" });
  const { data: agentStats } = useQuery<any>({ queryKey: ["/api/superadmin/agent-stats"], enabled: activeTab === "agents" });

  const toggleTenant = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiRequest("PUT", `/api/superadmin/tenants/${id}/status`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/superadmin/tenants"] }),
  });

  const TABS = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "tenants", label: "Tenants", icon: Building2 },
    { id: "agents", label: "AI Agents", icon: Bot },
    { id: "settings", label: "Platform", icon: Settings },
  ] as const;

  const PLAN_COLORS: Record<string, string> = {
    trial: "#64748b", starter: "#3b82f6", pro: "#8b5cf6", business: "#10b981", enterprise: "#f59e0b"
  };

  return (
    <Layout title="Platform Admin" subtitle="Super administrator — full platform access">
      {/* Crown banner */}
      <div style={{ background: "linear-gradient(135deg,rgba(245,158,11,0.12),rgba(251,191,36,0.06))", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 14, padding: "14px 20px", marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
        <Crown size={18} style={{ color: "#f59e0b" }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Platform Owner Access</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Logged in as {user?.email} · Full unrestricted access to all tenants</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "var(--bg-overlay)", padding: 4, borderRadius: 10, width: "fit-content" }}>
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`btn btn-sm ${activeTab === t.id ? "btn-primary" : "btn-ghost"}`} style={{ gap: 6 }}>
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* ── OVERVIEW ── */}
      {activeTab === "overview" && (
        overviewLoading ? <Loader /> : (
          <div className="stagger">
            {/* Stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 14, marginBottom: 24 }}>
              {[
                { label: "Total Tenants", value: overview?.tenants?.total, sub: `+${overview?.tenants?.new30d} this month`, icon: Building2, color: "#3b82f6" },
                { label: "Total Users", value: overview?.users, sub: "Across all workspaces", icon: Users, color: "#8b5cf6" },
                { label: "Contacts", value: overview?.contacts?.toLocaleString(), sub: "Platform-wide", icon: Globe, color: "#10b981" },
                { label: "Revenue Tracked", value: `$${(overview?.deals?.revenue || 0).toLocaleString()}`, sub: `${overview?.deals?.won} deals won`, icon: TrendingUp, color: "#f59e0b" },
                { label: "Agent Sessions", value: overview?.agents?.sessions, sub: `${overview?.agents?.messages} messages`, icon: Bot, color: "#ec4899" },
              ].map(s => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="card" style={{ padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon size={16} style={{ color: s.color }} />
                      </div>
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 800 }}>{s.value}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginTop: 2 }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.sub}</div>
                  </div>
                );
              })}
            </div>

            {/* Plan distribution */}
            <div className="card" style={{ padding: "20px" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>Plan Distribution</h3>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {(overview?.plans || []).map((p: any) => (
                  <div key={p.plan} style={{ padding: "10px 16px", background: "var(--bg-overlay)", borderRadius: 10, minWidth: 100, textAlign: "center", border: `1px solid ${PLAN_COLORS[p.plan] || "#64748b"}33` }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: PLAN_COLORS[p.plan] || "#64748b" }}>{p.count}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", textTransform: "capitalize" }}>{p.plan}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      )}

      {/* ── TENANTS ── */}
      {activeTab === "tenants" && (
        <div>
          {tenantsLoading ? <Loader /> : (
            <div className="card" style={{ overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 80px 100px 100px 80px 80px", padding: "10px 16px", borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
                {["Workspace", "Plan", "Users", "Contacts", "Deals", "Status", "Actions"].map(h => (
                  <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</span>
                ))}
              </div>
              {(tenants || []).map((t: any) => (
                <div key={t.id} className="table-row" style={{ gridTemplateColumns: "1fr 120px 80px 100px 100px 80px 80px", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: "#fff", flexShrink: 0 }}>
                      {t.name[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{t.slug}</div>
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: `${PLAN_COLORS[t.subscriptionPlan] || "#64748b"}18`, color: PLAN_COLORS[t.subscriptionPlan] || "#64748b", textTransform: "capitalize" }}>{t.subscriptionPlan}</span>
                  </div>
                  <div style={{ fontSize: 14 }}>{t.stats?.users}</div>
                  <div style={{ fontSize: 14 }}>{t.stats?.contacts?.toLocaleString()}</div>
                  <div style={{ fontSize: 14 }}>{t.stats?.deals}</div>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 5, background: t.isActive ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", color: t.isActive ? "#10b981" : "#ef4444" }}>
                      {t.isActive ? "Active" : "Suspended"}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ padding: 5, color: t.isActive ? "#ef4444" : "#10b981" }}
                      title={t.isActive ? "Suspend" : "Activate"}
                      onClick={() => toggleTenant.mutate({ id: t.id, isActive: !t.isActive })}
                    >
                      {t.isActive ? <ToggleLeft size={16} /> : <ToggleRight size={16} />}
                    </button>
                    <button className="btn btn-ghost btn-sm" style={{ padding: 5 }} onClick={() => setSelectedTenant(t)}>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tenant detail panel */}
          {selectedTenant && (
            <div className="modal-overlay" style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }} onClick={() => setSelectedTenant(null)}>
              <div className="card-elevated animate-slide-in-right" style={{ width: 440, height: "100vh", borderRadius: "16px 0 0 16px", overflow: "auto", padding: 28 }} onClick={e => e.stopPropagation()}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 20, color: "#fff" }}>{selectedTenant.name[0]}</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 18 }}>{selectedTenant.name}</div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{selectedTenant.domain}</div>
                  </div>
                  <button className="btn btn-ghost btn-sm" style={{ marginLeft: "auto", padding: 4 }} onClick={() => setSelectedTenant(null)}>✕</button>
                </div>

                <div style={{ display: "grid", gap: 12 }}>
                  {[
                    { label: "Plan", value: selectedTenant.subscriptionPlan, color: PLAN_COLORS[selectedTenant.subscriptionPlan] },
                    { label: "Status", value: selectedTenant.subscriptionStatus },
                    { label: "Users", value: `${selectedTenant.stats?.users} / ${selectedTenant.maxUsers}` },
                    { label: "Created", value: new Date(selectedTenant.createdAt).toLocaleDateString() },
                    { label: "Trial ends", value: selectedTenant.trialEndsAt ? new Date(selectedTenant.trialEndsAt).toLocaleDateString() : "N/A" },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                      <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{label}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: color || "var(--text-primary)", textTransform: "capitalize" }}>{value}</span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 24, display: "flex", gap: 10 }}>
                  <button className="btn btn-secondary" style={{ flex: 1, fontSize: 13 }} onClick={() => toggleTenant.mutate({ id: selectedTenant.id, isActive: !selectedTenant.isActive })}>
                    {selectedTenant.isActive ? "Suspend" : "Reactivate"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── AGENT STATS ── */}
      {activeTab === "agents" && (
        <div style={{ display: "grid", gap: 16 }}>
          <div className="card" style={{ overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Agent Usage by Type</h3>
            </div>
            {(agentStats?.byAgent || []).map((a: any) => (
              <div key={a.agentType} className="table-row" style={{ gridTemplateColumns: "1fr 100px 100px 100px", gap: 12 }}>
                <div style={{ fontWeight: 600, textTransform: "capitalize" }}>{a.agentType.replace("_", " ")}</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{a.sessions} sessions</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{a.messages} messages</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{a.tokens?.toLocaleString()} tokens</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PLATFORM SETTINGS ── */}
      {activeTab === "settings" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {[
            { label: "Platform Version", value: "2.0.0" },
            { label: "AI Provider", value: "Anthropic Claude Sonnet 4" },
            { label: "Database", value: "PostgreSQL (Neon)" },
            { label: "Runtime", value: "Node.js 20 + Vite" },
            { label: "Auth", value: "JWT + bcrypt (12 rounds)" },
            { label: "Owner Email", value: process.env.PLATFORM_OWNER_EMAIL || "abel@argilette.com" },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: "16px 20px" }}>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
