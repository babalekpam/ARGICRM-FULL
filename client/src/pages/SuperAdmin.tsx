import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "../components/Layout";
import { Loader, Empty } from "../components/UI";
import { apiRequest } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import {
  Building2, Users, Globe, TrendingUp, Bot,
  MessageSquare, Settings, Crown, Activity,
  ChevronRight, CheckCircle2, Ban, AlertTriangle,
  ArrowUpCircle, ToggleLeft, ToggleRight, Save, X,
  ShieldAlert, UserCheck,
} from "lucide-react";

const PLAN_COLORS: Record<string, string> = {
  trial: "#64748b", trialing: "#64748b",
  starter: "#3b82f6", free: "#64748b",
  professional: "#8b5cf6", pro: "#8b5cf6",
  business: "#10b981",
  enterprise: "#f59e0b",
};
const PLANS = ["trial", "starter", "professional", "business", "enterprise"] as const;
const PLAN_LIMITS: Record<string, number> = {
  trial: 5, starter: 10, professional: 25, business: 50, enterprise: 999999,
};
const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  active:    { bg: "rgba(16,185,129,0.12)", color: "#10b981", label: "Active" },
  trialing:  { bg: "rgba(59,130,246,0.12)", color: "#3b82f6", label: "Trialing" },
  suspended: { bg: "rgba(245,158,11,0.12)", color: "#f59e0b", label: "Suspended" },
  blocked:   { bg: "rgba(239,68,68,0.12)",  color: "#ef4444", label: "Blocked" },
  inactive:  { bg: "rgba(100,116,139,0.12)", color: "#64748b", label: "Inactive" },
};

const TABS = [
  { id: "overview",  label: "Overview",    icon: Activity },
  { id: "tenants",   label: "Subscribers", icon: Building2 },
  { id: "agents",    label: "AI Agents",   icon: Bot },
  { id: "settings",  label: "Platform",    icon: Settings },
] as const;

export default function SuperAdminPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<typeof TABS[number]["id"]>("overview");
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [editPlan, setEditPlan] = useState("");
  const [editMaxUsers, setEditMaxUsers] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);

  const { data: overview, isLoading: ovLoading } = useQuery<any>({ queryKey: ["/api/superadmin/overview"] });
  const { data: tenants, isLoading: tenantsLoading } = useQuery<any[]>({
    queryKey: ["/api/superadmin/tenants"], enabled: tab === "tenants",
  });
  const { data: agentStats } = useQuery<any>({
    queryKey: ["/api/superadmin/agent-stats"], enabled: tab === "agents",
  });

  const openPanel = (t: any) => {
    setSelectedTenant(t);
    setEditPlan(t.subscriptionPlan || "starter");
    setEditMaxUsers(String(t.maxUsers || 10));
    setEditStatus(t.subscriptionStatus || "active");
    setConfirmBlock(false);
  };

  const closePanel = () => { setSelectedTenant(null); setConfirmBlock(false); };

  const manageMutation = useMutation({
    mutationFn: (body: any) => apiRequest("PUT", `/api/superadmin/tenants/${selectedTenant.id}/manage`, body),
    onSuccess: (updated: any) => {
      qc.invalidateQueries({ queryKey: ["/api/superadmin/tenants"] });
      qc.invalidateQueries({ queryKey: ["/api/superadmin/overview"] });
      setSelectedTenant(updated);
    },
  });

  const savePlan = async () => {
    setSaving(true);
    try {
      await manageMutation.mutateAsync({
        plan: editPlan,
        maxUsers: Number(editMaxUsers),
        subscriptionStatus: editStatus === "blocked" ? "active" : editStatus,
        isActive: true,
      });
    } finally { setSaving(false); }
  };

  const toggleSuspend = async () => {
    const isCurrentlySuspended = !selectedTenant.isActive && selectedTenant.subscriptionStatus !== "blocked";
    await manageMutation.mutateAsync({
      isActive: isCurrentlySuspended,
      subscriptionStatus: isCurrentlySuspended ? "active" : "suspended",
    });
  };

  const blockAccount = async () => {
    await manageMutation.mutateAsync({ isActive: false, subscriptionStatus: "blocked" });
    setConfirmBlock(false);
  };

  const unblockAccount = async () => {
    await manageMutation.mutateAsync({ isActive: true, subscriptionStatus: "active" });
  };

  const statusInfo = selectedTenant
    ? (STATUS_STYLES[selectedTenant.subscriptionStatus] || STATUS_STYLES.inactive)
    : STATUS_STYLES.active;

  const isBlocked   = selectedTenant?.subscriptionStatus === "blocked";
  const isSuspended = !selectedTenant?.isActive && !isBlocked;
  const isActive    = selectedTenant?.isActive && !isBlocked;

  return (
    <Layout title="Platform Admin" subtitle="Super administrator — full platform access">
      {/* Crown banner */}
      <div style={{ background: "linear-gradient(135deg,rgba(245,158,11,0.1),rgba(251,191,36,0.05))", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 12, padding: "12px 18px", marginBottom: 22, display: "flex", alignItems: "center", gap: 10 }}>
        <Crown size={16} style={{ color: "#f59e0b", flexShrink: 0 }} />
        <div>
          <span style={{ fontWeight: 700, fontSize: 13 }}>Platform Owner</span>
          <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 10 }}>{user?.email} · Unlimited enterprise access</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 22, background: "var(--bg-overlay)", padding: 4, borderRadius: 10, width: "fit-content" }}>
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className={`btn btn-sm ${tab === t.id ? "btn-primary" : "btn-ghost"}`} style={{ gap: 6 }}>
              <Icon size={13} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === "overview" && (
        ovLoading ? <Loader /> : (
          <div style={{ display: "grid", gap: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(175px,1fr))", gap: 14 }}>
              {[
                { label: "Total Subscribers", value: overview?.tenants?.total, sub: `+${overview?.tenants?.new30d} this month`, icon: Building2, color: "#3b82f6" },
                { label: "Total Users",        value: overview?.users,          sub: "Across all workspaces",    icon: Users,     color: "#8b5cf6" },
                { label: "Contacts",           value: overview?.contacts?.toLocaleString(), sub: "Platform-wide", icon: Globe, color: "#10b981" },
                { label: "Revenue Tracked",    value: `$${(overview?.deals?.revenue || 0).toLocaleString()}`, sub: `${overview?.deals?.won} deals won`, icon: TrendingUp, color: "#f59e0b" },
                { label: "AI Sessions",        value: overview?.agents?.sessions, sub: `${overview?.agents?.messages} messages`, icon: MessageSquare, color: "#ec4899" },
              ].map(s => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="card" style={{ padding: 16 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                      <Icon size={16} style={{ color: s.color }} />
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 800 }}>{s.value ?? "—"}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginTop: 2 }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.sub}</div>
                  </div>
                );
              })}
            </div>

            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Plan Distribution</div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {(overview?.plans || []).map((p: any) => (
                  <div key={p.plan} style={{ padding: "10px 16px", background: "var(--bg-elevated)", borderRadius: 10, minWidth: 90, textAlign: "center", border: `1px solid ${PLAN_COLORS[p.plan] || "#64748b"}30` }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: PLAN_COLORS[p.plan] || "#64748b" }}>{p.count}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", textTransform: "capitalize" }}>{p.plan}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      )}

      {/* ── SUBSCRIBERS ── */}
      {tab === "tenants" && (
        <div>
          {tenantsLoading ? <Loader /> : (
            <div className="card" style={{ overflow: "hidden" }}>
              {/* Header */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 130px 70px 80px 110px 80px", padding: "10px 16px", borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
                {["Workspace", "Plan", "Users", "Contacts", "Status", ""].map(h => (
                  <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</span>
                ))}
              </div>

              {!tenants?.length
                ? <Empty icon={Building2} title="No subscribers yet" />
                : tenants.map((t: any) => {
                  const ss = STATUS_STYLES[t.subscriptionStatus] || STATUS_STYLES.inactive;
                  return (
                    <div key={t.id} data-testid={`row-tenant-${t.id}`} className="table-row" style={{ gridTemplateColumns: "1fr 130px 70px 80px 110px 80px", gap: 12 }}>
                      {/* Name */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 9, background: `${PLAN_COLORS[t.subscriptionPlan] || "#64748b"}18`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: PLAN_COLORS[t.subscriptionPlan] || "#64748b", flexShrink: 0 }}>
                          {t.name[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{t.domain || t.slug}</div>
                        </div>
                      </div>
                      {/* Plan */}
                      <div>
                        <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 6, background: `${PLAN_COLORS[t.subscriptionPlan] || "#64748b"}18`, color: PLAN_COLORS[t.subscriptionPlan] || "#64748b", textTransform: "capitalize" }}>
                          {t.subscriptionPlan || "free"}
                        </span>
                      </div>
                      {/* Users */}
                      <div style={{ fontSize: 13 }}>{t.stats?.users} / {t.maxUsers === 999999 ? "∞" : t.maxUsers}</div>
                      {/* Contacts */}
                      <div style={{ fontSize: 13 }}>{t.stats?.contacts?.toLocaleString()}</div>
                      {/* Status */}
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 5, background: ss.bg, color: ss.color }}>
                          {ss.label}
                        </span>
                      </div>
                      {/* Actions */}
                      <div style={{ display: "flex", gap: 4 }}>
                        <button
                          data-testid={`button-manage-${t.id}`}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: 5 }}
                          title="Manage"
                          onClick={() => openPanel(t)}
                        >
                          <ChevronRight size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* ── MANAGEMENT DRAWER ── */}
          {selectedTenant && (
            <div className="modal-overlay" style={{ display: "flex", alignItems: "stretch", justifyContent: "flex-end" }} onClick={closePanel}>
              <div
                className="card-elevated"
                style={{ width: 480, height: "100vh", borderRadius: "16px 0 0 16px", overflow: "auto", display: "flex", flexDirection: "column" }}
                onClick={e => e.stopPropagation()}
              >
                {/* Drawer header */}
                <div style={{ padding: "22px 24px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 12, background: `${PLAN_COLORS[selectedTenant.subscriptionPlan] || "#64748b"}18`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 20, color: PLAN_COLORS[selectedTenant.subscriptionPlan] || "#64748b" }}>
                    {selectedTenant.name[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 17, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedTenant.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{selectedTenant.domain || selectedTenant.slug}</div>
                  </div>
                  <button className="btn btn-ghost btn-sm" style={{ padding: 5, flexShrink: 0 }} onClick={closePanel}><X size={15} /></button>
                </div>

                <div style={{ flex: 1, overflow: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
                  {/* Status banner */}
                  <div style={{ padding: "12px 14px", borderRadius: 10, background: statusInfo.bg, border: `1px solid ${statusInfo.color}30`, display: "flex", alignItems: "center", gap: 10 }}>
                    {isBlocked   && <ShieldAlert size={15} style={{ color: statusInfo.color, flexShrink: 0 }} />}
                    {isSuspended && <AlertTriangle size={15} style={{ color: statusInfo.color, flexShrink: 0 }} />}
                    {isActive    && <CheckCircle2 size={15} style={{ color: statusInfo.color, flexShrink: 0 }} />}
                    <span style={{ fontWeight: 700, color: statusInfo.color, fontSize: 13 }}>Account is {statusInfo.label}</span>
                    {isBlocked && (
                      <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 4 }}>— login is denied for all users</span>
                    )}
                  </div>

                  {/* Quick stats */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    {[
                      { label: "Users",    value: selectedTenant.stats?.users },
                      { label: "Contacts", value: selectedTenant.stats?.contacts?.toLocaleString() },
                      { label: "Deals",    value: selectedTenant.stats?.deals },
                    ].map(s => (
                      <div key={s.label} style={{ padding: "10px 12px", background: "var(--bg-elevated)", borderRadius: 10, textAlign: "center" }}>
                        <div style={{ fontSize: 20, fontWeight: 800 }}>{s.value ?? 0}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* ── PLAN MANAGEMENT ── */}
                  <div style={{ padding: "16px 18px", border: "1px solid var(--border)", borderRadius: 12, display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
                      <ArrowUpCircle size={15} style={{ color: "#6366f1" }} /> Plan &amp; Subscription
                    </div>

                    {/* Plan selector */}
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 8 }}>SUBSCRIPTION PLAN</label>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {PLANS.map(p => (
                          <button
                            key={p}
                            data-testid={`button-plan-${p}`}
                            onClick={() => {
                              setEditPlan(p);
                              setEditMaxUsers(String(PLAN_LIMITS[p]));
                            }}
                            style={{
                              padding: "6px 14px", borderRadius: 8, border: `2px solid ${editPlan === p ? PLAN_COLORS[p] : "var(--border)"}`,
                              background: editPlan === p ? `${PLAN_COLORS[p]}14` : "var(--bg-elevated)",
                              color: editPlan === p ? PLAN_COLORS[p] : "var(--text-secondary)",
                              fontWeight: editPlan === p ? 700 : 500, fontSize: 12,
                              cursor: "pointer", transition: "all 0.15s", textTransform: "capitalize",
                            }}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Max users */}
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>MAX SEATS</label>
                      <input
                        data-testid="input-max-users"
                        type="number"
                        className="input"
                        value={editMaxUsers}
                        onChange={e => setEditMaxUsers(e.target.value)}
                        min={1}
                        style={{ width: 120 }}
                      />
                    </div>

                    {/* Subscription status */}
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 8 }}>BILLING STATUS</label>
                      <div style={{ display: "flex", gap: 8 }}>
                        {(["active", "trialing", "suspended"] as const).map(s => (
                          <button
                            key={s}
                            onClick={() => setEditStatus(s)}
                            style={{
                              padding: "5px 12px", borderRadius: 8,
                              border: `2px solid ${editStatus === s ? STATUS_STYLES[s].color : "var(--border)"}`,
                              background: editStatus === s ? STATUS_STYLES[s].bg : "var(--bg-elevated)",
                              color: editStatus === s ? STATUS_STYLES[s].color : "var(--text-secondary)",
                              fontWeight: editStatus === s ? 700 : 500, fontSize: 12,
                              cursor: "pointer", textTransform: "capitalize",
                            }}
                          >
                            {STATUS_STYLES[s].label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      data-testid="button-save-plan"
                      className="btn btn-primary"
                      onClick={savePlan}
                      disabled={saving}
                      style={{ display: "flex", alignItems: "center", gap: 7, alignSelf: "flex-start" }}
                    >
                      <Save size={13} /> {saving ? "Saving…" : "Save Changes"}
                    </button>
                  </div>

                  {/* ── ACCESS CONTROL ── */}
                  <div style={{ padding: "16px 18px", border: "1px solid var(--border)", borderRadius: 12, display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
                      <ShieldAlert size={15} style={{ color: "#ef4444" }} /> Access Control
                    </div>

                    <div style={{ display: "flex", gap: 10 }}>
                      {/* Suspend / Reactivate */}
                      {!isBlocked && (
                        <button
                          data-testid="button-suspend-toggle"
                          className="btn btn-secondary"
                          onClick={toggleSuspend}
                          style={{ display: "flex", alignItems: "center", gap: 7, flex: 1 }}
                        >
                          {isSuspended
                            ? <><UserCheck size={13} style={{ color: "#10b981" }} /> Reactivate Account</>
                            : <><ToggleLeft size={13} style={{ color: "#f59e0b" }} /> Suspend Account</>
                          }
                        </button>
                      )}

                      {/* Unblock */}
                      {isBlocked && (
                        <button
                          data-testid="button-unblock"
                          className="btn btn-secondary"
                          onClick={unblockAccount}
                          style={{ display: "flex", alignItems: "center", gap: 7, flex: 1, color: "#10b981" }}
                        >
                          <UserCheck size={13} /> Unblock Account
                        </button>
                      )}

                      {/* Block button */}
                      {!isBlocked && (
                        <button
                          data-testid="button-block"
                          onClick={() => setConfirmBlock(true)}
                          style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.07)", color: "#ef4444", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}
                        >
                          <Ban size={13} /> Block
                        </button>
                      )}
                    </div>

                    {/* Block confirmation */}
                    {confirmBlock && (
                      <div style={{ padding: "14px", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10 }}>
                        <div style={{ fontWeight: 700, color: "#ef4444", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                          <AlertTriangle size={14} /> Confirm Block
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 12 }}>
                          This will immediately deny login to all users in <strong>{selectedTenant.name}</strong>. They will see an error message. You can unblock at any time.
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            data-testid="button-confirm-block"
                            onClick={blockAccount}
                            style={{ padding: "7px 14px", borderRadius: 8, background: "#ef4444", border: "none", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}
                          >
                            Yes, Block Account
                          </button>
                          <button
                            onClick={() => setConfirmBlock(false)}
                            style={{ padding: "7px 14px", borderRadius: 8, background: "var(--bg-overlay)", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: 12, cursor: "pointer" }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>
                      <strong>Suspend</strong> = soft lock (can reactivate easily) ·{" "}
                      <strong>Block</strong> = hard lock (login denied, shows error to users)
                    </div>
                  </div>

                  {/* Account info */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    {[
                      { label: "Tenant ID", value: selectedTenant.id?.slice(0, 20) + "…" },
                      { label: "Created",   value: new Date(selectedTenant.createdAt).toLocaleDateString() },
                      { label: "Trial ends", value: selectedTenant.trialEndsAt ? new Date(selectedTenant.trialEndsAt).toLocaleDateString() : "N/A" },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--border)" }}>
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, fontFamily: "monospace" }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── AI AGENTS ── */}
      {tab === "agents" && (
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", fontWeight: 700, fontSize: 15 }}>Agent Usage by Type</div>
          {!(agentStats?.byAgent?.length)
            ? <Empty icon={Bot} title="No agent sessions yet" />
            : agentStats.byAgent.map((a: any) => (
              <div key={a.agentType} className="table-row" style={{ gridTemplateColumns: "1fr 120px 120px 120px", gap: 12 }}>
                <div style={{ fontWeight: 600, textTransform: "capitalize" }}>{a.agentType.replace(/_/g, " ")}</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{a.sessions} sessions</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{a.messages} messages</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{Number(a.tokens || 0).toLocaleString()} tokens</div>
              </div>
            ))
          }
        </div>
      )}

      {/* ── PLATFORM SETTINGS ── */}
      {tab === "settings" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {[
            { label: "Platform Version",  value: "2.0.0" },
            { label: "AI Provider",       value: "Anthropic Claude Sonnet 4" },
            { label: "Database",          value: "PostgreSQL (Neon)" },
            { label: "Runtime",           value: "Node.js 20 + Vite" },
            { label: "Auth",              value: "JWT + bcrypt (12 rounds)" },
            { label: "Owner Email",       value: "abel@argilette.com" },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: "16px 20px" }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
