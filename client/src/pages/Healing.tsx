import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "../components/Layout";
import { useLanguage } from "../contexts/LanguageContext";
import { Loader } from "../components/UI";
import { apiRequest } from "../lib/api";
import {
  Shield, Activity, AlertTriangle, CheckCircle, XCircle, RefreshCw,
  Zap, Clock, Database, Key, Cpu, Server, Wifi, ToggleRight,
  TrendingUp, AlertCircle, ChevronRight, Bot, BarChart2
} from "lucide-react";

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: any; label: string }> = {
  healthy: { color: "#10b981", bg: "rgba(16,185,129,0.12)", icon: CheckCircle, label: "Healthy" },
  degraded: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", icon: AlertTriangle, label: "Degraded" },
  critical: { color: "#ef4444", bg: "rgba(239,68,68,0.12)", icon: XCircle, label: "Critical" },
  offline: { color: "#64748b", bg: "rgba(100,116,139,0.12)", icon: Server, label: "Offline" },
};

const CIRCUIT_STATE: Record<string, { color: string; label: string }> = {
  closed: { color: "#10b981", label: "CLOSED ✓" },
  open: { color: "#ef4444", label: "OPEN ⛔" },
  "half-open": { color: "#f59e0b", label: "HALF-OPEN ⚠" },
};

const CHECK_ICONS: Record<string, any> = {
  database: Database, auth: Key, ai_service: Bot, memory: Cpu, environment: Server, uptime: Clock
};

export default function HealingPage() {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [runningCheck, setRunningCheck] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "errors" | "performance" | "circuits">("dashboard");

  const { data: health, isLoading: healthLoading, refetch: refetchHealth } = useQuery<any>({ queryKey: ["/api/healing/health"] });
  const { data: stats } = useQuery<any>({ queryKey: ["/api/healing/stats"] });
  const { data: errors } = useQuery<any[]>({ queryKey: ["/api/healing/errors"], enabled: activeTab === "errors" });
  const { data: perf } = useQuery<any>({ queryKey: ["/api/healing/performance"], enabled: activeTab === "performance" });
  const { data: circuits } = useQuery<any>({ queryKey: ["/api/healing/circuits"], enabled: activeTab === "circuits" });

  const runChecks = async () => {
    setRunningCheck(true);
    await refetchHealth();
    setRunningCheck(false);
    qc.invalidateQueries({ queryKey: ["/api/healing/stats"] });
  };

  const healMut = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/healing/errors/${id}/heal`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/healing/errors"] }),
  });

  const resolveMut = useMutation({
    mutationFn: (id: string) => apiRequest("PUT", `/api/healing/errors/${id}/resolve`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/healing/errors"] }),
  });

  const resetCircuit = useMutation({
    mutationFn: (name: string) => apiRequest("POST", `/api/healing/circuits/${name}/reset`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/healing/circuits"] }),
  });

  const TABS = [
    { id: "dashboard", label: "Dashboard", icon: Shield },
    { id: "errors", label: "Error Log", icon: AlertTriangle },
    { id: "performance", label: "Performance", icon: BarChart2 },
    { id: "circuits", label: "Circuit Breakers", icon: ToggleRight },
  ] as const;

  const overallStatus = health?.overall || "healthy";
  const cfg = STATUS_CONFIG[overallStatus] || STATUS_CONFIG.healthy;
  const CfgIcon = cfg.icon;

  return (
    <Layout
      title={t("healing_title")}
      subtitle={t("healing_subtitle")}
      actions={
        <button className="btn btn-primary btn-sm" onClick={runChecks} disabled={runningCheck}>
          {runningCheck ? <><span className="spinner" style={{ width: 14, height: 14 }} />Running...</> : <><RefreshCw size={14} /> Run Health Checks</>}
        </button>
      }
    >
      {/* Overall status banner */}
      <div style={{ background: cfg.bg, border: `1px solid ${cfg.color}33`, borderRadius: 14, padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CfgIcon size={22} style={{ color: cfg.color }} />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18, color: cfg.color }}>System {cfg.label}</div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            Last checked: {new Date().toLocaleTimeString()} · Auto-healing: Active · Checks every 5 minutes
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 16 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#10b981" }}>{stats?.healingRate || 0}%</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>HEAL RATE</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#f59e0b" }}>{stats?.errors?.unresolved || 0}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>UNRESOLVED</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#3b82f6" }}>{stats?.errors?.autoHealed || 0}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>AUTO-HEALED</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "var(--bg-overlay)", padding: 4, borderRadius: 10, width: "fit-content" }}>
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`btn btn-sm ${activeTab === t.id ? "btn-primary" : "btn-ghost"}`} style={{ gap: 6 }}>
              <Icon size={13} />{t.label}
            </button>
          );
        })}
      </div>

      {/* ── DASHBOARD ── */}
      {activeTab === "dashboard" && (
        <>
          {/* Health checks grid */}
          {healthLoading ? <Loader /> : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 14, marginBottom: 24 }}>
              {Object.entries(health?.checks || {}).map(([name, check]: [string, any]) => {
                const cfg = STATUS_CONFIG[check.status] || STATUS_CONFIG.healthy;
                const Icon = CHECK_ICONS[name] || Activity;
                const CfgIcon2 = cfg.icon;
                return (
                  <div key={name} className="card" style={{ padding: 16, borderLeft: `3px solid ${cfg.color}` }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Icon size={16} style={{ color: cfg.color }} />
                        <span style={{ fontWeight: 700, fontSize: 14, textTransform: "capitalize" }}>{name.replace("_", " ")}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 8px", borderRadius: 6, background: cfg.bg }}>
                        <CfgIcon2 size={12} style={{ color: cfg.color }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 8 }}>{check.message}</div>
                    {check.latencyMs > 0 && (
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        Latency: <strong style={{ color: check.latencyMs > 300 ? "#f59e0b" : "var(--text-primary)" }}>{check.latencyMs}ms</strong>
                      </div>
                    )}
                    {check.details?.heapPercent !== undefined && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 11, color: "var(--text-muted)" }}>
                          <span>Heap</span>
                          <span>{check.details.heapPercent}%</span>
                        </div>
                        <div style={{ width: "100%", height: 4, borderRadius: 2, background: "var(--bg-overlay)" }}>
                          <div style={{ width: `${check.details.heapPercent}%`, height: "100%", borderRadius: 2, background: check.details.heapPercent > 80 ? "#ef4444" : "#10b981", transition: "width 0.3s" }} />
                        </div>
                      </div>
                    )}
                    {check.details?.poolTotal !== undefined && (
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                        Pool: {check.details.poolTotal} total · {check.details.poolIdle} idle
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Stats row */}
          {stats && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>Errors by Severity</h3>
                {(stats.bySeverity || []).map((s: any) => (
                  <div key={s.severity} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", flexShrink: 0, background: s.severity === "critical" ? "#ef4444" : s.severity === "error" ? "#f97316" : s.severity === "warning" ? "#f59e0b" : "#64748b" }} />
                    <span style={{ flex: 1, fontSize: 13, textTransform: "capitalize" }}>{s.severity}</span>
                    <span style={{ fontWeight: 700 }}>{s.count}</span>
                    <div style={{ width: 80, height: 4, borderRadius: 2, background: "var(--bg-overlay)" }}>
                      <div style={{ width: `${Math.min(100, (s.count / stats.errors.total) * 100)}%`, height: "100%", borderRadius: 2, background: s.severity === "critical" ? "#ef4444" : "#f59e0b" }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>Errors by Category</h3>
                {(stats.byCategory || []).slice(0, 6).map((c: any) => (
                  <div key={c.category} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <span style={{ flex: 1, fontSize: 13 }}>{c.category}</span>
                    <span style={{ fontWeight: 700 }}>{c.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── ERROR LOG ── */}
      {activeTab === "errors" && (
        <div>
          <div className="card" style={{ overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "80px 100px 1fr 100px 80px 120px", padding: "10px 16px", borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
              {["Severity", "Category", "Message", "Attempts", "Status", "Actions"].map(h => (
                <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</span>
              ))}
            </div>
            {!(errors?.length) ? (
              <div style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>
                <CheckCircle size={40} style={{ marginBottom: 12, opacity: 0.3, color: "#10b981" }} />
                <p>No errors logged. System running clean.</p>
              </div>
            ) : errors!.map((e: any) => (
              <div key={e.id} className="table-row" style={{ gridTemplateColumns: "80px 100px 1fr 100px 80px 120px", gap: 12 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 7px", borderRadius: 5,
                    background: e.severity === "critical" ? "rgba(239,68,68,0.15)" : e.severity === "error" ? "rgba(249,115,22,0.15)" : "rgba(245,158,11,0.15)",
                    color: e.severity === "critical" ? "#ef4444" : e.severity === "error" ? "#f97316" : "#f59e0b"
                  }}>{e.severity}</span>
                </div>
                <div style={{ fontSize: 12 }}>{e.category}</div>
                <div>
                  <div style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 400 }}>{e.message}</div>
                  {e.healingLog?.length > 0 && (
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                      Last heal: {e.healingLog[e.healingLog.length - 1]?.action?.slice(0, 60)}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 13 }}>{e.healingAttempts || 0} attempts</div>
                <div>
                  {e.resolved
                    ? <span style={{ fontSize: 11, color: "#10b981", fontWeight: 700 }}>✓ {e.resolvedBy === "auto_healer" ? "Auto" : "Manual"}</span>
                    : <span style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700 }}>Pending</span>}
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {!e.resolved && <>
                    <button className="btn btn-primary btn-sm" style={{ fontSize: 11, padding: "4px 8px" }} onClick={() => healMut.mutate(e.id)}><Zap size={11} /> Heal</button>
                    <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, padding: "4px 8px" }} onClick={() => resolveMut.mutate(e.id)}>Resolve</button>
                  </>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PERFORMANCE ── */}
      {activeTab === "performance" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 14 }}>
          {Object.entries(perf?.summary || {}).map(([type, data]: [string, any]) => (
            <div key={type} className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 10 }}>{type.replace("_", " ")}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: data.avg > 300 ? "#ef4444" : "#10b981" }}>{data.avg}</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>AVG</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#f59e0b" }}>{data.max}</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>MAX</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 800 }}>{data.count}</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>COUNT</div>
                </div>
              </div>
            </div>
          ))}
          {!Object.keys(perf?.summary || {}).length && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 48, color: "var(--text-muted)" }}>
              <BarChart2 size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p>Performance metrics will appear after API activity.</p>
            </div>
          )}
        </div>
      )}

      {/* ── CIRCUIT BREAKERS ── */}
      {activeTab === "circuits" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
          {Object.entries(circuits || {}).map(([name, c]: [string, any]) => {
            const stateCfg = CIRCUIT_STATE[c.state] || CIRCUIT_STATE.closed;
            return (
              <div key={name} className="card" style={{ padding: 20, borderTop: `3px solid ${stateCfg.color}` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, textTransform: "capitalize" }}>{name.replace("_", " ")}</div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: stateCfg.color }}>{stateCfg.label}</span>
                </div>
                <div style={{ display: "grid", gap: 6, marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--text-secondary)" }}>
                    <span>Failures</span>
                    <span style={{ fontWeight: 700, color: c.failures > 0 ? "#f59e0b" : "var(--text-primary)" }}>{c.failures} / {c.threshold}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--text-secondary)" }}>
                    <span>Timeout</span>
                    <span>{c.timeout / 1000}s</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--text-secondary)" }}>
                    <span>State</span>
                    <span style={{ fontWeight: 700, color: stateCfg.color }}>{c.state.toUpperCase()}</span>
                  </div>
                </div>
                <div style={{ width: "100%", height: 6, borderRadius: 3, background: "var(--bg-overlay)", marginBottom: 12 }}>
                  <div style={{ width: `${Math.min(100, (c.failures / c.threshold) * 100)}%`, height: "100%", borderRadius: 3, background: c.state === "open" ? "#ef4444" : "#f59e0b", transition: "width 0.3s" }} />
                </div>
                {c.state !== "closed" && (
                  <button className="btn btn-primary btn-sm" style={{ width: "100%", fontSize: 12 }} onClick={() => resetCircuit.mutate(name)}>
                    <RefreshCw size={12} /> Reset Circuit
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
