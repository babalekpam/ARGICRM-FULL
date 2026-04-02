import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "../components/Layout";
import { apiRequest } from "../lib/api";
import {
  Zap, Plus, Play, Pause, Trash2, Clock, Target,
  Bell, Mail, Tag, Users, TrendingUp, RefreshCw, Check, X, BookOpen,
  Bot, Eye, ChevronDown, ChevronRight, AlertTriangle, CheckCircle2,
  XCircle, Timer, Shield, Cpu
} from "lucide-react";

const TRIGGER_TYPES = [
  { value: "deal_inactive",       label: "Deal Inactive",         icon: Clock,      color: "#f59e0b" },
  { value: "deal_stage_changed",  label: "Deal Stage Changed",    icon: TrendingUp, color: "#3b82f6" },
  { value: "lead_created",        label: "New Lead Created",      icon: Users,      color: "#10b981" },
  { value: "lead_score_updated",  label: "Lead Score Updated",    icon: Target,     color: "#8b5cf6" },
  { value: "contact_birthday",    label: "Contact Birthday",      icon: Bell,       color: "#ec4899" },
  { value: "invoice_overdue",     label: "Invoice Overdue",       icon: Clock,      color: "#ef4444" },
  { value: "manual",              label: "Manual / On-demand",    icon: Play,       color: "#6366f1" },
];

const ACTION_TYPES = [
  { value: "create_task",         label: "Create Task",           icon: Check },
  { value: "send_notification",   label: "Send Notification",     icon: Bell },
  { value: "compose_email",       label: "Compose Email",         icon: Mail },
  { value: "assign_lead",         label: "Assign Lead",           icon: Users },
  { value: "update_deal_stage",   label: "Update Deal Stage",     icon: TrendingUp },
  { value: "add_tag",             label: "Add Tag",               icon: Tag },
];

const FIELD_OPTIONS = ["stage", "value", "score", "status", "source"];
const OPERATORS    = ["equals", "not_equals", "greater_than", "less_than", "contains", "not_in", "gte"];

function TriggerIcon({ type, size = 16 }: { type: string; size?: number }) {
  const t = TRIGGER_TYPES.find(x => x.value === type);
  const Icon = t?.icon || Zap;
  return <Icon size={size} style={{ color: t?.color || "#6366f1" }} />;
}

function ModeBadge({ mode }: { mode: string }) {
  const isAuto = mode === "auto";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: isAuto ? "#3b82f620" : "#f59e0b20",
      color: isAuto ? "#3b82f6" : "#f59e0b",
      border: `1px solid ${isAuto ? "#3b82f640" : "#f59e0b40"}`,
    }}>
      {isAuto ? <Cpu size={10} /> : <Eye size={10} />}
      {isAuto ? "Auto" : "Supervised"}
    </span>
  );
}

// ── Approval card ────────────────────────────────────────────────
function ApprovalCard({ ap, onApprove, onReject }: { ap: any; onApprove: () => void; onReject: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const at = ACTION_TYPES.find(a => a.value === ap.action_type);
  const Icon = at?.icon || Zap;

  const handleApprove = async () => { setLoading("approve"); await onApprove(); setLoading(null); };
  const handleReject  = async () => { setLoading("reject");  await onReject();  setLoading(null); };

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid #f59e0b40", borderRadius: 10, padding: "14px 16px" }} data-testid={`approval-card-${ap.id}`}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: "#f59e0b18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={16} style={{ color: "#f59e0b" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: "var(--text-primary)" }}>{at?.label || ap.action_type}</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>from</span>
            <span style={{ color: "#f59e0b" }}>{ap.workflow_name}</span>
          </div>
          {ap.action_config?.title && (
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>"{ap.action_config.title}"</div>
          )}
          {ap.action_config?.message && (
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>"{ap.action_config.message}"</div>
          )}
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
            <Timer size={10} style={{ display: "inline", marginRight: 3 }} />
            Queued {new Date(ap.created_at).toLocaleString()}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
          <button onClick={() => setExpanded(e => !e)} title="Details"
            style={{ padding: "5px 8px", background: "var(--bg-overlay)", border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
            {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>
          <button onClick={handleReject} disabled={loading !== null} data-testid={`btn-reject-${ap.id}`}
            style={{ padding: "6px 12px", background: "#ef444415", border: "1px solid #ef444440", borderRadius: 7, cursor: loading ? "not-allowed" : "pointer", color: "#ef4444", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, opacity: loading ? 0.6 : 1 }}>
            {loading === "reject" ? <RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} /> : <X size={12} />}
            Reject
          </button>
          <button onClick={handleApprove} disabled={loading !== null} data-testid={`btn-approve-${ap.id}`}
            style={{ padding: "6px 12px", background: "#10b98120", border: "1px solid #10b98140", borderRadius: 7, cursor: loading ? "not-allowed" : "pointer", color: "#10b981", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, opacity: loading ? 0.6 : 1 }}>
            {loading === "approve" ? <RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={12} />}
            Approve & Run
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Action Config</div>
          <pre style={{ fontSize: 12, color: "var(--text-secondary)", background: "var(--bg-overlay)", borderRadius: 7, padding: 10, margin: 0, overflowX: "auto", fontFamily: "monospace" }}>
            {JSON.stringify(ap.action_config, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// ── Workflow card ────────────────────────────────────────────────
function WorkflowCard({ wf, onToggle, onDelete, onRun, onModeChange }: any) {
  const [running, setRunning] = useState(false);

  const handleRun = async () => { setRunning(true); await onRun(wf.id); setRunning(false); };

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 20px" }} data-testid={`workflow-card-${wf.id}`}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 12, flex: 1, minWidth: 0 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--bg-overlay)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <TriggerIcon type={wf.trigger_type} size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{wf.name}</span>
              <ModeBadge mode={wf.execution_mode || "auto"} />
              <span style={{
                padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                background: wf.is_active ? "#10b98120" : "var(--bg-overlay)",
                color: wf.is_active ? "#10b981" : "var(--text-muted)",
              }}>
                {wf.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            {wf.description && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{wf.description}</div>}
            <div style={{ display: "flex", gap: 14, marginTop: 8, flexWrap: "wrap" }}>
              <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                <TriggerIcon type={wf.trigger_type} size={11} />
                {TRIGGER_TYPES.find(t => t.value === wf.trigger_type)?.label || wf.trigger_type}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {(wf.actions || []).length} action{(wf.actions || []).length !== 1 ? "s" : ""}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Ran {wf.run_count || 0}×</div>
              {wf.last_run_at && (
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Last: {new Date(wf.last_run_at).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
          {/* Mode quick toggle */}
          <button
            onClick={() => onModeChange(wf.id, wf.execution_mode === "auto" ? "supervised" : "auto")}
            title={`Switch to ${wf.execution_mode === "auto" ? "Supervised" : "Auto"} mode`}
            data-testid={`btn-mode-${wf.id}`}
            style={{ padding: "6px 10px", background: wf.execution_mode === "supervised" ? "#f59e0b15" : "var(--bg-overlay)", border: `1px solid ${wf.execution_mode === "supervised" ? "#f59e0b40" : "var(--border)"}`, borderRadius: 7, cursor: "pointer", color: wf.execution_mode === "supervised" ? "#f59e0b" : "var(--text-muted)", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
            {wf.execution_mode === "supervised" ? <Eye size={13} /> : <Cpu size={13} />}
            {wf.execution_mode === "supervised" ? "Supervised" : "Auto"}
          </button>
          <button onClick={handleRun} disabled={running} title="Run now" data-testid={`btn-run-${wf.id}`}
            style={{ padding: "6px 10px", background: "var(--bg-overlay)", border: "1px solid var(--border)", borderRadius: 7, cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
            {running ? <RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Play size={13} />}
            Run
          </button>
          <button onClick={() => onToggle(wf.id)} title={wf.is_active ? "Pause" : "Activate"}
            style={{ padding: "6px 10px", background: wf.is_active ? "#f59e0b15" : "#10b98115", border: `1px solid ${wf.is_active ? "#f59e0b40" : "#10b98140"}`, borderRadius: 7, cursor: "pointer", color: wf.is_active ? "#f59e0b" : "#10b981", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
            {wf.is_active ? <Pause size={13} /> : <Play size={13} />}
            {wf.is_active ? "Pause" : "Activate"}
          </button>
          <button onClick={() => onDelete(wf.id)} title="Delete"
            style={{ padding: "6px 8px", background: "#ef444415", border: "1px solid #ef444430", borderRadius: 7, cursor: "pointer", color: "#ef4444", display: "flex", alignItems: "center" }}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {(wf.actions || []).length > 0 && (
        <div style={{ display: "flex", gap: 6, marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)", flexWrap: "wrap" }}>
          {(wf.actions || []).map((a: any, i: number) => {
            const at = ACTION_TYPES.find(x => x.value === a.type);
            const Icon = at?.icon || Zap;
            return (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", background: "var(--bg-overlay)", border: "1px solid var(--border)", borderRadius: 20, fontSize: 12 }}>
                <Icon size={11} style={{ color: "#6366f1" }} />
                {at?.label || a.type}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Builder modal ────────────────────────────────────────────────
function BuilderModal({ onClose, onSave }: { onClose: () => void; onSave: (data: any) => void }) {
  const [form, setForm] = useState({
    name: "", description: "", triggerType: "deal_inactive",
    executionMode: "auto" as "auto" | "supervised",
    conditions: [] as any[], actions: [] as any[],
  });
  const [newCondition, setNewCondition] = useState({ field: "stage", operator: "equals", value: "" });
  const [newAction, setNewAction] = useState({ type: "create_task", config: { title: "", description: "", priority: "medium" } });

  const inputStyle: React.CSSProperties = { width: "100%", padding: "9px 12px", background: "var(--bg-overlay)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 13, boxSizing: "border-box", outline: "none" };
  const labelStyle: React.CSSProperties = { fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "var(--bg-card)", borderRadius: 12, width: "100%", maxWidth: 700, maxHeight: "92vh", overflow: "auto", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "var(--bg-card)", zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Zap size={18} style={{ color: "#3b82f6" }} />
            <span style={{ fontSize: 16, fontWeight: 700 }}>Create Workflow</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4, display: "flex" }}><X size={18} /></button>
        </div>

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Basic info */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={labelStyle}>Workflow Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Stale Deal Alert" style={inputStyle} data-testid="input-workflow-name" />
            </div>
            <div>
              <label style={labelStyle}>Description</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What does this workflow do?" style={inputStyle} />
            </div>
          </div>

          {/* Execution mode */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 22, height: 22, background: "#6366f1", color: "#fff", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>1</span>
              Execution Mode
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {/* Auto */}
              <button
                onClick={() => setForm(f => ({ ...f, executionMode: "auto" }))}
                data-testid="mode-auto"
                style={{ padding: "16px", background: form.executionMode === "auto" ? "#3b82f620" : "var(--bg-overlay)", border: `2px solid ${form.executionMode === "auto" ? "#3b82f6" : "var(--border)"}`, borderRadius: 10, cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: form.executionMode === "auto" ? "#3b82f630" : "var(--bg-overlay)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Cpu size={16} style={{ color: form.executionMode === "auto" ? "#3b82f6" : "var(--text-muted)" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: form.executionMode === "auto" ? "#3b82f6" : "var(--text-primary)" }}>Fully Automatic</div>
                  </div>
                  {form.executionMode === "auto" && <CheckCircle2 size={16} style={{ color: "#3b82f6", marginLeft: "auto" }} />}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
                  All actions run instantly when the trigger fires. No human review needed.
                  Best for high-confidence, low-risk automations.
                </div>
                <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {["Task creation", "Notifications", "Stage updates"].map(t => (
                    <span key={t} style={{ fontSize: 11, padding: "2px 8px", background: "#3b82f615", color: "#3b82f6", borderRadius: 20 }}>{t}</span>
                  ))}
                </div>
              </button>

              {/* Supervised */}
              <button
                onClick={() => setForm(f => ({ ...f, executionMode: "supervised" }))}
                data-testid="mode-supervised"
                style={{ padding: "16px", background: form.executionMode === "supervised" ? "#f59e0b18" : "var(--bg-overlay)", border: `2px solid ${form.executionMode === "supervised" ? "#f59e0b" : "var(--border)"}`, borderRadius: 10, cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: form.executionMode === "supervised" ? "#f59e0b25" : "var(--bg-overlay)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Shield size={16} style={{ color: form.executionMode === "supervised" ? "#f59e0b" : "var(--text-muted)" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: form.executionMode === "supervised" ? "#f59e0b" : "var(--text-primary)" }}>Supervised Mode</div>
                  </div>
                  {form.executionMode === "supervised" && <CheckCircle2 size={16} style={{ color: "#f59e0b", marginLeft: "auto" }} />}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
                  Each action is queued for your review first. You approve or reject before anything runs.
                  Best for emails, lead reassignment, and sensitive changes.
                </div>
                <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {["Email sending", "Lead assignment", "Data changes"].map(t => (
                    <span key={t} style={{ fontSize: 11, padding: "2px 8px", background: "#f59e0b15", color: "#f59e0b", borderRadius: 20 }}>{t}</span>
                  ))}
                </div>
              </button>
            </div>
          </div>

          {/* Trigger */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 22, height: 22, background: "#3b82f6", color: "#fff", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>2</span>
              Trigger
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 8 }}>
              {TRIGGER_TYPES.map(t => {
                const Icon = t.icon;
                const selected = form.triggerType === t.value;
                return (
                  <button key={t.value} onClick={() => setForm(f => ({ ...f, triggerType: t.value }))}
                    style={{ padding: "10px 12px", background: selected ? `${t.color}20` : "var(--bg-overlay)", border: `1px solid ${selected ? t.color : "var(--border)"}`, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, textAlign: "left" }}>
                    <Icon size={14} style={{ color: t.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: selected ? 600 : 400, color: selected ? t.color : "var(--text-secondary)" }}>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conditions */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 22, height: 22, background: "#8b5cf6", color: "#fff", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>3</span>
              Conditions <span style={{ fontSize: 11, fontWeight: 400, color: "var(--text-muted)" }}>(optional filters)</span>
            </div>
            {form.conditions.map((c, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, padding: "8px 10px", background: "var(--bg-overlay)", borderRadius: 8, alignItems: "center" }}>
                <span style={{ fontSize: 12, flex: 1 }}>{c.field} {c.operator} <strong>{c.value}</strong></span>
                <button onClick={() => setForm(f => ({ ...f, conditions: f.conditions.filter((_, j) => j !== i) }))} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: 2, display: "flex" }}><X size={13} /></button>
              </div>
            ))}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 8, marginTop: 6 }}>
              <select value={newCondition.field} onChange={e => setNewCondition(c => ({ ...c, field: e.target.value }))} style={{ ...inputStyle }}>
                {FIELD_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <select value={newCondition.operator} onChange={e => setNewCondition(c => ({ ...c, operator: e.target.value }))} style={{ ...inputStyle }}>
                {OPERATORS.map(o => <option key={o} value={o}>{o.replace("_", " ")}</option>)}
              </select>
              <input value={newCondition.value} onChange={e => setNewCondition(c => ({ ...c, value: e.target.value }))} placeholder="Value" style={inputStyle} />
              <button onClick={() => { if (!newCondition.value) return; setForm(f => ({ ...f, conditions: [...f.conditions, { ...newCondition }] })); setNewCondition({ field: "stage", operator: "equals", value: "" }); }}
                style={{ padding: "9px 14px", background: "#8b5cf6", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>+ Add</button>
            </div>
          </div>

          {/* Actions */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 22, height: 22, background: "#10b981", color: "#fff", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>4</span>
              Actions <span style={{ fontSize: 11, fontWeight: 400, color: "var(--text-muted)" }}>(at least one required)</span>
              {form.executionMode === "supervised" && (
                <span style={{ fontSize: 11, padding: "2px 8px", background: "#f59e0b15", color: "#f59e0b", borderRadius: 20, fontWeight: 400 }}>
                  Each will need your approval
                </span>
              )}
            </div>
            {form.actions.map((a, i) => {
              const at = ACTION_TYPES.find(x => x.value === a.type);
              const Icon = at?.icon || Zap;
              return (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, padding: "8px 10px", background: "var(--bg-overlay)", borderRadius: 8, alignItems: "center" }}>
                  <Icon size={14} style={{ color: "#10b981", flexShrink: 0 }} />
                  <span style={{ fontSize: 12, flex: 1 }}>{at?.label || a.type}{a.config?.title ? `: "${a.config.title}"` : ""}</span>
                  {form.executionMode === "supervised" && <Eye size={12} style={{ color: "#f59e0b", flexShrink: 0 }} title="Requires approval" />}
                  <button onClick={() => setForm(f => ({ ...f, actions: f.actions.filter((_, j) => j !== i) }))} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: 2, display: "flex" }}><X size={13} /></button>
                </div>
              );
            })}
            <div style={{ padding: 14, background: "var(--bg-overlay)", borderRadius: 8, marginTop: 6 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={labelStyle}>Action Type</label>
                  <select value={newAction.type} onChange={e => setNewAction(a => ({ ...a, type: e.target.value }))} style={inputStyle}>
                    {ACTION_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Task / Message Title</label>
                  <input value={newAction.config.title} onChange={e => setNewAction(a => ({ ...a, config: { ...a.config, title: e.target.value } }))} placeholder="e.g. Follow up on {{deal.name}}" style={inputStyle} />
                </div>
              </div>
              <button
                onClick={() => { setForm(f => ({ ...f, actions: [...f.actions, { ...newAction }] })); setNewAction({ type: "create_task", config: { title: "", description: "", priority: "medium" } }); }}
                style={{ padding: "8px 16px", background: "#10b981", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                + Add Action
              </button>
            </div>
          </div>
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, justifyContent: "flex-end", position: "sticky", bottom: 0, background: "var(--bg-card)" }}>
          <button onClick={onClose} style={{ padding: "9px 18px", background: "none", border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer", fontSize: 13, color: "var(--text-secondary)" }}>Cancel</button>
          <button
            onClick={() => onSave(form)}
            disabled={!form.name || !form.actions.length}
            data-testid="btn-save-workflow"
            style={{ padding: "9px 18px", background: !form.name || !form.actions.length ? "var(--bg-overlay)" : form.executionMode === "supervised" ? "#f59e0b" : "#3b82f6", color: !form.name || !form.actions.length ? "var(--text-muted)" : "#fff", border: "none", borderRadius: 8, cursor: !form.name || !form.actions.length ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600 }}>
            Create {form.executionMode === "supervised" ? "Supervised" : "Auto"} Workflow
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────
export default function WorkflowsPage() {
  const qc = useQueryClient();
  const [showBuilder, setShowBuilder]     = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [runResult, setRunResult]         = useState<any>(null);
  const [activeTab, setActiveTab]         = useState<"workflows" | "approvals" | "history">("workflows");

  const { data: workflows = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/workflows"] });
  const { data: templates = [] }            = useQuery<any[]>({ queryKey: ["/api/workflows/templates"] });
  const { data: pendingApprovals = [], refetch: refetchApprovals } = useQuery<any[]>({
    queryKey: ["/api/workflows/approvals"],
    refetchInterval: 10000,
  });
  const { data: historyApprovals = [] } = useQuery<any[]>({
    queryKey: ["/api/workflows/approvals?status=approved"],
    enabled: activeTab === "history",
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/workflows", { ...data, triggerType: data.triggerType, executionMode: data.executionMode }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/workflows"] }); setShowBuilder(false); setShowTemplates(false); },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/workflows/${id}/toggle`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/workflows"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/workflows/${id}`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/workflows"] }),
  });

  const modeMutation = useMutation({
    mutationFn: ({ id, executionMode }: { id: string; executionMode: string }) => apiRequest("PATCH", `/api/workflows/${id}/mode`, { executionMode }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/workflows"] }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/workflows/approvals/${id}/approve`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/workflows/approvals"] }); qc.invalidateQueries({ queryKey: ["/api/workflows"] }); },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/workflows/approvals/${id}/reject`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/workflows/approvals"] }),
  });

  const runWorkflow = async (id: string) => {
    const result = await apiRequest("POST", `/api/workflows/${id}/run`, {});
    setRunResult(result);
    qc.invalidateQueries({ queryKey: ["/api/workflows"] });
    qc.invalidateQueries({ queryKey: ["/api/workflows/approvals"] });
    if (result.mode === "supervised") setActiveTab("approvals");
  };

  const activeCount   = Array.isArray(workflows) ? workflows.filter((w: any) => w.is_active).length : 0;
  const autoCount     = Array.isArray(workflows) ? workflows.filter((w: any) => (w.execution_mode || "auto") === "auto").length : 0;
  const supervisedCount = Array.isArray(workflows) ? workflows.filter((w: any) => w.execution_mode === "supervised").length : 0;
  const totalRuns     = Array.isArray(workflows) ? workflows.reduce((s: number, w: any) => s + (w.run_count || 0), 0) : 0;
  const pendingCount  = Array.isArray(pendingApprovals) ? pendingApprovals.length : 0;

  const TabBtn = ({ id, label, count }: { id: typeof activeTab; label: string; count?: number }) => (
    <button onClick={() => setActiveTab(id)}
      style={{ padding: "8px 16px", background: activeTab === id ? "var(--bg-overlay)" : "none", border: activeTab === id ? "1px solid var(--border)" : "1px solid transparent", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: activeTab === id ? 600 : 400, color: activeTab === id ? "var(--text-primary)" : "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
      {label}
      {count !== undefined && count > 0 && (
        <span style={{ minWidth: 18, height: 18, borderRadius: 9, background: id === "approvals" ? "#f59e0b" : "#3b82f6", color: "#fff", fontSize: 10, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>{count}</span>
      )}
    </button>
  );

  return (
    <Layout
      title="Workflow Automation"
      subtitle="Build automations that run fully autonomously or with your approval on each step"
      actions={
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowTemplates(true)}
            style={{ padding: "8px 14px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer", fontSize: 13, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
            <BookOpen size={14} /> Templates
          </button>
          <button data-testid="btn-create-workflow" onClick={() => setShowBuilder(true)}
            style={{ padding: "8px 14px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
            <Plus size={14} /> New Workflow
          </button>
        </div>
      }
    >
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total", value: Array.isArray(workflows) ? workflows.length : 0, color: "#3b82f6" },
          { label: "Active",      value: activeCount,      color: "#10b981" },
          { label: "Auto",        value: autoCount,        color: "#3b82f6", icon: Cpu },
          { label: "Supervised",  value: supervisedCount,  color: "#f59e0b", icon: Shield },
          { label: "Total Runs",  value: totalRuns,        color: "#8b5cf6" },
          { label: "Pending",     value: pendingCount,     color: "#f59e0b", icon: AlertTriangle },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 18px" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
              {Icon && <Icon size={11} style={{ color }} />}
              {label}
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, padding: "4px", background: "var(--bg-overlay)", borderRadius: 10, width: "fit-content" }}>
        <TabBtn id="workflows" label="Workflows" />
        <TabBtn id="approvals" label="Pending Approvals" count={pendingCount} />
        <TabBtn id="history"   label="Approval History" />
      </div>

      {/* Run result banner */}
      {runResult && (
        <div style={{ marginBottom: 16, padding: 14, background: runResult.mode === "supervised" ? "#f59e0b10" : "#10b98110", border: `1px solid ${runResult.mode === "supervised" ? "#f59e0b30" : "#10b98130"}`, borderRadius: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontWeight: 600, fontSize: 13, color: runResult.mode === "supervised" ? "#f59e0b" : "#10b981", display: "flex", alignItems: "center", gap: 6 }}>
              {runResult.mode === "supervised" ? <Eye size={14} /> : <Cpu size={14} />}
              {runResult.mode === "supervised"
                ? `${runResult.message} — check Pending Approvals tab`
                : "Workflow executed automatically"}
            </span>
            <button onClick={() => setRunResult(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 2, display: "flex" }}><X size={14} /></button>
          </div>
          {runResult.results?.map((r: any, i: number) => (
            <div key={i} style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 3 }}>
              <strong>{r.action}</strong>: {r.detail}
            </div>
          ))}
        </div>
      )}

      {/* ── Workflows tab ── */}
      {activeTab === "workflows" && (
        isLoading ? (
          <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>Loading…</div>
        ) : !Array.isArray(workflows) || workflows.length === 0 ? (
          <div style={{ background: "var(--bg-card)", border: "2px dashed var(--border)", borderRadius: 12, padding: 60, textAlign: "center" }}>
            <Zap size={40} style={{ color: "var(--text-muted)", margin: "0 auto 14px" }} />
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>No workflows yet</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>Start with a template or build your own automation</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => setShowTemplates(true)} style={{ padding: "9px 18px", background: "var(--bg-overlay)", border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Browse Templates</button>
              <button onClick={() => setShowBuilder(true)} style={{ padding: "9px 18px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Create Workflow</button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(workflows as any[]).map((wf: any) => (
              <WorkflowCard key={wf.id} wf={wf}
                onToggle={(id: string) => toggleMutation.mutate(id)}
                onDelete={(id: string) => deleteMutation.mutate(id)}
                onRun={runWorkflow}
                onModeChange={(id: string, mode: string) => modeMutation.mutate({ id, executionMode: mode })}
              />
            ))}
          </div>
        )
      )}

      {/* ── Approvals tab ── */}
      {activeTab === "approvals" && (
        <div>
          {pendingCount === 0 ? (
            <div style={{ background: "var(--bg-card)", border: "2px dashed var(--border)", borderRadius: 12, padding: 60, textAlign: "center" }}>
              <CheckCircle2 size={40} style={{ color: "#10b981", margin: "0 auto 14px" }} />
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>All clear!</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>No actions pending your review. Run a supervised workflow to see approval requests here.</div>
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-muted)" }}>
                  <AlertTriangle size={14} style={{ color: "#f59e0b" }} />
                  <span><strong style={{ color: "var(--text-primary)" }}>{pendingCount}</strong> action{pendingCount !== 1 ? "s" : ""} waiting for your approval before execution</span>
                </div>
                <button onClick={() => { refetchApprovals(); }}
                  style={{ padding: "5px 10px", background: "var(--bg-overlay)", border: "1px solid var(--border)", borderRadius: 7, cursor: "pointer", fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                  <RefreshCw size={12} /> Refresh
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {(pendingApprovals as any[]).map((ap: any) => (
                  <ApprovalCard
                    key={ap.id}
                    ap={ap}
                    onApprove={() => approveMutation.mutateAsync(ap.id)}
                    onReject={() => rejectMutation.mutateAsync(ap.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── History tab ── */}
      {activeTab === "history" && (
        <div>
          {!Array.isArray(historyApprovals) || historyApprovals.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)", fontSize: 14 }}>No approval history yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(historyApprovals as any[]).map((ap: any) => {
                const at = ACTION_TYPES.find(a => a.value === ap.action_type);
                const Icon = at?.icon || Zap;
                const isApproved = ap.status === "approved";
                return (
                  <div key={ap.id} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, opacity: 0.85 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: isApproved ? "#10b98115" : "#ef444415", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={15} style={{ color: isApproved ? "#10b981" : "#ef4444" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{at?.label || ap.action_type} <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>from</span> {ap.workflow_name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                        {isApproved ? "Approved" : "Rejected"} · {ap.resolved_at ? new Date(ap.resolved_at).toLocaleString() : "—"}
                      </div>
                    </div>
                    {isApproved
                      ? <CheckCircle2 size={16} style={{ color: "#10b981", flexShrink: 0 }} />
                      : <XCircle size={16} style={{ color: "#ef4444", flexShrink: 0 }} />
                    }
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Builder modal */}
      {showBuilder && (
        <BuilderModal
          onClose={() => setShowBuilder(false)}
          onSave={(data) => createMutation.mutate(data)}
        />
      )}

      {/* Templates modal */}
      {showTemplates && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "var(--bg-card)", borderRadius: 12, width: "100%", maxWidth: 680, maxHeight: "85vh", overflow: "auto" }}>
            <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "var(--bg-card)" }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>Workflow Templates</span>
              <button onClick={() => setShowTemplates(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}><X size={18} /></button>
            </div>
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              {(templates as any[]).map((t: any, i: number) => (
                <div key={i} style={{ padding: "14px 16px", background: "var(--bg-overlay)", borderRadius: 10, border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{t.name}</div>
                        <ModeBadge mode={t.executionMode || "auto"} />
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>{t.description}</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {(t.actions || []).map((a: any, j: number) => {
                          const at = ACTION_TYPES.find(x => x.value === a.type);
                          const Icon = at?.icon || Zap;
                          return (
                            <span key={j} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, fontSize: 11 }}>
                              <Icon size={10} style={{ color: "#6366f1" }} /> {at?.label || a.type}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <button
                      onClick={() => createMutation.mutate(t)}
                      style={{ padding: "8px 14px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
                      Use
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </Layout>
  );
}
