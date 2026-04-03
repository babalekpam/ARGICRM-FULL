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
  ArrowUpCircle, ToggleLeft, Save, X,
  ShieldAlert, UserCheck, Mail, Calendar, UserCog,
  UserMinus, ToggleRight, RefreshCw,
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
const USER_ROLES = ["admin", "manager", "sales_rep", "viewer"] as const;

const TABS = [
  { id: "overview",  label: "Overview",    icon: Activity },
  { id: "tenants",   label: "Subscribers", icon: Building2 },
  { id: "agents",    label: "AI Agents",   icon: Bot },
  { id: "settings",  label: "Platform",    icon: Settings },
] as const;

function initials(name: string) {
  return (name || "?")[0].toUpperCase();
}

export default function SuperAdminPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<typeof TABS[number]["id"]>("overview");
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [drawerTab, setDrawerTab] = useState<"plan" | "users">("plan");
  const [editPlan, setEditPlan] = useState("");
  const [editMaxUsers, setEditMaxUsers] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<string | null>(null);

  const { data: overview, isLoading: ovLoading } = useQuery<any>({ queryKey: ["/api/superadmin/overview"] });
  const { data: tenants, isLoading: tenantsLoading } = useQuery<any[]>({
    queryKey: ["/api/superadmin/tenants"], enabled: tab === "tenants",
  });
  const { data: agentStats } = useQuery<any>({
    queryKey: ["/api/superadmin/agent-stats"], enabled: tab === "agents",
  });
  const { data: tenantUsers, isLoading: usersLoading } = useQuery<any[]>({
    queryKey: ["/api/superadmin/tenants", selectedTenant?.id, "users"],
    queryFn: () => apiRequest("GET", `/api/superadmin/tenants/${selectedTenant.id}/users`),
    enabled: !!selectedTenant && drawerTab === "users",
  });

  const openPanel = (t: any) => {
    setSelectedTenant(t);
    setEditPlan(t.subscriptionPlan || "starter");
    setEditMaxUsers(String(t.maxUsers || 10));
    setEditStatus(t.subscriptionStatus || "active");
    setConfirmBlock(false);
    setDrawerTab("plan");
    setConfirmDeleteUser(null);
  };
  const closePanel = () => { setSelectedTenant(null); setConfirmBlock(false); setConfirmDeleteUser(null); };

  const manageMutation = useMutation({
    mutationFn: (body: any) => apiRequest("PUT", `/api/superadmin/tenants/${selectedTenant.id}/manage`, body),
    onSuccess: (updated: any) => {
      qc.invalidateQueries({ queryKey: ["/api/superadmin/tenants"] });
      qc.invalidateQueries({ queryKey: ["/api/superadmin/overview"] });
      setSelectedTenant(updated);
    },
  });

  const userRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      apiRequest("PUT", `/api/superadmin/users/${userId}/role`, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/superadmin/tenants", selectedTenant?.id, "users"] }),
  });

  const userToggleMutation = useMutation({
    mutationFn: (userId: string) => apiRequest("PUT", `/api/superadmin/users/${userId}/toggle`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/superadmin/tenants", selectedTenant?.id, "users"] }),
  });

  const userDeleteMutation = useMutation({
    mutationFn: (userId: string) => apiRequest("DELETE", `/api/superadmin/users/${userId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/superadmin/tenants", selectedTenant?.id, "users"] });
      qc.invalidateQueries({ queryKey: ["/api/superadmin/tenants"] });
      setConfirmDeleteUser(null);
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
              <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 100px 110px 32px", padding: "10px 18px", borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)", gap: 12 }}>
                {["Workspace", "Plan", "Users / Contacts", "Status", ""].map(h => (
                  <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</span>
                ))}
              </div>

              {!tenants?.length
                ? <Empty icon={Building2} title="No subscribers yet" />
                : tenants.map((t: any) => {
                  const ss = STATUS_STYLES[t.subscriptionStatus] || STATUS_STYLES.inactive;
                  const pc = PLAN_COLORS[t.subscriptionPlan] || "#64748b";
                  return (
                    <div
                      key={t.id}
                      data-testid={`row-tenant-${t.id}`}
                      onClick={() => openPanel(t)}
                      style={{ display: "grid", gridTemplateColumns: "1fr 140px 100px 110px 32px", gap: 12, padding: "14px 18px", borderBottom: "1px solid var(--border)", cursor: "pointer", transition: "background 0.12s" }}
                      className="hover-elevate"
                    >
                      {/* Workspace */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${pc}18`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15, color: pc, flexShrink: 0 }}>
                          {initials(t.name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{t.domain || t.slug}</div>
                        </div>
                      </div>

                      {/* Plan */}
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 6, background: `${pc}18`, color: pc, textTransform: "capitalize" }}>
                          {t.subscriptionPlan || "free"}
                        </span>
                      </div>

                      {/* Users / Contacts */}
                      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 1 }}>
                        <div style={{ fontSize: 13 }}>
                          <span style={{ fontWeight: 600 }}>{t.stats?.users}</span>
                          <span style={{ color: "var(--text-muted)" }}>/{t.maxUsers === 999999 ? "∞" : t.maxUsers} users</span>
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{(t.stats?.contacts || 0).toLocaleString()} contacts</div>
                      </div>

                      {/* Status */}
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 5, background: ss.bg, color: ss.color }}>
                          {ss.label}
                        </span>
                      </div>

                      {/* Arrow */}
                      <div style={{ display: "flex", alignItems: "center", color: "var(--text-muted)" }}>
                        <ChevronRight size={15} />
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
                style={{ width: 520, height: "100vh", borderRadius: "16px 0 0 16px", overflow: "auto", display: "flex", flexDirection: "column" }}
                onClick={e => e.stopPropagation()}
              >
                {/* Drawer header */}
                <div style={{ padding: "22px 24px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 12, background: `${PLAN_COLORS[selectedTenant.subscriptionPlan] || "#64748b"}18`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 20, color: PLAN_COLORS[selectedTenant.subscriptionPlan] || "#64748b" }}>
                    {initials(selectedTenant.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 17, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedTenant.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{selectedTenant.domain || selectedTenant.slug}</div>
                  </div>
                  <button className="btn btn-ghost btn-sm" style={{ padding: 5, flexShrink: 0 }} onClick={closePanel}><X size={15} /></button>
                </div>

                {/* Status banner */}
                <div style={{ margin: "16px 24px 0", padding: "10px 14px", borderRadius: 10, background: statusInfo.bg, border: `1px solid ${statusInfo.color}30`, display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                  {isBlocked   && <ShieldAlert size={14} style={{ color: statusInfo.color, flexShrink: 0 }} />}
                  {isSuspended && <AlertTriangle size={14} style={{ color: statusInfo.color, flexShrink: 0 }} />}
                  {isActive    && <CheckCircle2 size={14} style={{ color: statusInfo.color, flexShrink: 0 }} />}
                  <span style={{ fontWeight: 700, color: statusInfo.color, fontSize: 13 }}>Account is {statusInfo.label}</span>
                  {isBlocked && <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 2 }}>— login denied for all users</span>}
                </div>

                {/* Quick stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, margin: "14px 24px 0", flexShrink: 0 }}>
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

                {/* Sub-tabs */}
                <div style={{ display: "flex", gap: 4, margin: "16px 24px 0", background: "var(--bg-overlay)", padding: 4, borderRadius: 10, flexShrink: 0 }}>
                  {([
                    { id: "plan",  label: "Plan & Access", icon: ArrowUpCircle },
                    { id: "users", label: "Users",         icon: Users },
                  ] as const).map(dt => {
                    const Icon = dt.icon;
                    return (
                      <button key={dt.id} onClick={() => setDrawerTab(dt.id)} className={`btn btn-sm ${drawerTab === dt.id ? "btn-primary" : "btn-ghost"}`} style={{ flex: 1, gap: 6, justifyContent: "center" }}>
                        <Icon size={12} /> {dt.label}
                      </button>
                    );
                  })}
                </div>

                {/* ── PLAN & ACCESS TAB ── */}
                {drawerTab === "plan" && (
                  <div style={{ flex: 1, overflow: "auto", padding: "16px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* Plan management */}
                    <div style={{ padding: "16px 18px", border: "1px solid var(--border)", borderRadius: 12, display: "flex", flexDirection: "column", gap: 14 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
                        <ArrowUpCircle size={15} style={{ color: "#6366f1" }} /> Subscription Plan
                      </div>

                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 8, letterSpacing: "0.05em" }}>SELECT PLAN</label>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {PLANS.map(p => (
                            <button
                              key={p}
                              data-testid={`button-plan-${p}`}
                              onClick={() => { setEditPlan(p); setEditMaxUsers(String(PLAN_LIMITS[p])); }}
                              style={{
                                padding: "6px 14px", borderRadius: 8,
                                border: `2px solid ${editPlan === p ? PLAN_COLORS[p] : "var(--border)"}`,
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

                      <div style={{ display: "flex", gap: 16, alignItems: "flex-end" }}>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6, letterSpacing: "0.05em" }}>MAX SEATS</label>
                          <input
                            data-testid="input-max-users"
                            type="number"
                            className="input"
                            value={editMaxUsers}
                            onChange={e => setEditMaxUsers(e.target.value)}
                            min={1}
                            style={{ width: 100 }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6, letterSpacing: "0.05em" }}>BILLING STATUS</label>
                          <div style={{ display: "flex", gap: 6 }}>
                            {(["active", "trialing", "suspended"] as const).map(s => (
                              <button
                                key={s}
                                onClick={() => setEditStatus(s)}
                                style={{
                                  padding: "5px 10px", borderRadius: 8,
                                  border: `2px solid ${editStatus === s ? STATUS_STYLES[s].color : "var(--border)"}`,
                                  background: editStatus === s ? STATUS_STYLES[s].bg : "var(--bg-elevated)",
                                  color: editStatus === s ? STATUS_STYLES[s].color : "var(--text-secondary)",
                                  fontWeight: editStatus === s ? 700 : 500, fontSize: 11,
                                  cursor: "pointer", textTransform: "capitalize",
                                }}
                              >
                                {STATUS_STYLES[s].label}
                              </button>
                            ))}
                          </div>
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

                    {/* Access control */}
                    <div style={{ padding: "16px 18px", border: "1px solid var(--border)", borderRadius: 12, display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
                        <ShieldAlert size={15} style={{ color: "#ef4444" }} /> Access Control
                      </div>

                      <div style={{ display: "flex", gap: 10 }}>
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

                      {confirmBlock && (
                        <div style={{ padding: 14, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10 }}>
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
                        <strong>Suspend</strong> = soft lock · <strong>Block</strong> = hard lock (login denied, error shown)
                      </div>
                    </div>

                    {/* Account meta */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                      {[
                        { label: "Tenant ID", value: selectedTenant.id?.slice(0, 22) + "…" },
                        { label: "Created",   value: new Date(selectedTenant.createdAt).toLocaleDateString() },
                        { label: "Trial ends", value: selectedTenant.trialEndsAt ? new Date(selectedTenant.trialEndsAt).toLocaleDateString() : "N/A" },
                      ].map(({ label, value }) => (
                        <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, fontFamily: "monospace" }}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── USERS TAB ── */}
                {drawerTab === "users" && (
                  <div style={{ flex: 1, overflow: "auto", padding: "16px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>
                        {usersLoading ? "Loading…" : `${tenantUsers?.length || 0} user${(tenantUsers?.length || 0) !== 1 ? "s" : ""} in this workspace`}
                      </span>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ gap: 5 }}
                        onClick={() => qc.invalidateQueries({ queryKey: ["/api/superadmin/tenants", selectedTenant?.id, "users"] })}
                      >
                        <RefreshCw size={12} /> Refresh
                      </button>
                    </div>

                    {usersLoading ? <Loader /> : !tenantUsers?.length
                      ? <Empty icon={Users} title="No users in this workspace" />
                      : tenantUsers.map((u: any) => {
                        const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email;
                        const ini = (u.firstName || u.email || "?")[0].toUpperCase();
                        const isDeleting = confirmDeleteUser === u.id;
                        return (
                          <div key={u.id} data-testid={`card-user-${u.id}`} style={{ padding: "14px 16px", border: "1px solid var(--border)", borderRadius: 12, background: "var(--bg-elevated)", display: "flex", flexDirection: "column", gap: 10 }}>
                            {/* User header */}
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 36, height: 36, borderRadius: "50%", background: u.isActive ? "linear-gradient(135deg,#3b82f6,#6366f1)" : "var(--bg-overlay)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: u.isActive ? "#fff" : "var(--text-muted)", flexShrink: 0 }}>
                                {ini}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                                  {name}
                                  {!u.isActive && (
                                    <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: "rgba(239,68,68,0.12)", color: "#ef4444" }}>Deactivated</span>
                                  )}
                                </div>
                                <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                                  <Mail size={10} /> {u.email}
                                </div>
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 5, background: "var(--bg-overlay)", color: "var(--text-secondary)", textTransform: "capitalize" }}>
                                {u.role?.replace(/_/g, " ")}
                              </span>
                            </div>

                            {/* Last login */}
                            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--text-muted)" }}>
                              <Calendar size={10} />
                              {u.lastLoginAt
                                ? `Last login: ${new Date(u.lastLoginAt).toLocaleDateString()}`
                                : "Never logged in"}
                              <span style={{ marginLeft: 6, color: "var(--border)" }}>·</span>
                              <span>Joined {new Date(u.createdAt).toLocaleDateString()}</span>
                            </div>

                            {/* Action row */}
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                              {/* Role change */}
                              <select
                                data-testid={`select-role-${u.id}`}
                                className="input"
                                value={u.role}
                                onChange={e => userRoleMutation.mutate({ userId: u.id, role: e.target.value })}
                                style={{ fontSize: 12, padding: "4px 8px", height: "auto", flex: 1, minWidth: 130 }}
                              >
                                {USER_ROLES.map(r => (
                                  <option key={r} value={r}>{r.replace(/_/g, " ")}</option>
                                ))}
                              </select>

                              {/* Toggle active */}
                              <button
                                data-testid={`button-toggle-user-${u.id}`}
                                className="btn btn-secondary btn-sm"
                                onClick={() => userToggleMutation.mutate(u.id)}
                                disabled={userToggleMutation.isPending}
                                style={{ display: "flex", alignItems: "center", gap: 5 }}
                              >
                                {u.isActive
                                  ? <><ToggleRight size={12} style={{ color: "#10b981" }} /> Active</>
                                  : <><ToggleLeft size={12} style={{ color: "#ef4444" }} /> Deactivated</>
                                }
                              </button>

                              {/* Remove */}
                              <button
                                data-testid={`button-remove-user-${u.id}`}
                                className="btn btn-ghost btn-sm"
                                onClick={() => setConfirmDeleteUser(u.id)}
                                style={{ display: "flex", alignItems: "center", gap: 5, color: "#ef4444" }}
                                title="Remove user"
                              >
                                <UserMinus size={12} />
                              </button>
                            </div>

                            {/* Delete confirmation */}
                            {isDeleting && (
                              <div style={{ padding: "10px 12px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8 }}>
                                <div style={{ fontSize: 12, color: "#ef4444", fontWeight: 600, marginBottom: 8 }}>Remove <strong>{u.email}</strong> from this workspace?</div>
                                <div style={{ display: "flex", gap: 6 }}>
                                  <button
                                    data-testid={`button-confirm-remove-${u.id}`}
                                    onClick={() => userDeleteMutation.mutate(u.id)}
                                    disabled={userDeleteMutation.isPending}
                                    style={{ padding: "5px 12px", borderRadius: 7, background: "#ef4444", border: "none", color: "#fff", fontWeight: 700, fontSize: 11, cursor: "pointer" }}
                                  >
                                    {userDeleteMutation.isPending ? "Removing…" : "Yes, Remove"}
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteUser(null)}
                                    style={{ padding: "5px 12px", borderRadius: 7, background: "var(--bg-overlay)", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: 11, cursor: "pointer" }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    }
                  </div>
                )}
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
