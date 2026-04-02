import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "../components/Layout";
import { apiRequest } from "../lib/api";
import {
  Zap, Plus, Play, Pause, Trash2, ChevronRight, Clock, Target,
  Bell, Mail, Tag, Users, TrendingUp, RefreshCw, Check, X, BookOpen
} from "lucide-react";

const TRIGGER_TYPES = [
  { value: "deal_inactive", label: "Deal Inactive", icon: Clock, color: "#f59e0b" },
  { value: "deal_stage_changed", label: "Deal Stage Changed", icon: TrendingUp, color: "#3b82f6" },
  { value: "lead_created", label: "New Lead Created", icon: Users, color: "#10b981" },
  { value: "lead_score_updated", label: "Lead Score Updated", icon: Target, color: "#8b5cf6" },
  { value: "contact_birthday", label: "Contact Birthday", icon: Bell, color: "#ec4899" },
  { value: "invoice_overdue", label: "Invoice Overdue", icon: Clock, color: "#ef4444" },
  { value: "manual", label: "Manual / On-demand", icon: Play, color: "#6366f1" },
];

const ACTION_TYPES = [
  { value: "create_task", label: "Create Task", icon: Check },
  { value: "send_notification", label: "Send Notification", icon: Bell },
  { value: "compose_email", label: "Compose Email", icon: Mail },
  { value: "assign_lead", label: "Assign Lead", icon: Users },
  { value: "update_deal_stage", label: "Update Deal Stage", icon: TrendingUp },
  { value: "add_tag", label: "Add Tag", icon: Tag },
];

const FIELD_OPTIONS = ["stage", "value", "score", "status", "source"];
const OPERATORS = ["equals", "not_equals", "greater_than", "less_than", "contains", "not_in", "gte"];
const STAGES = ["prospecting", "qualification", "proposal", "negotiation", "closed_won", "closed_lost"];

function TriggerIcon({ type, size = 16 }: { type: string; size?: number }) {
  const t = TRIGGER_TYPES.find(x => x.value === type);
  if (!t) return <Zap size={size} style={{ color: "#6366f1" }} />;
  const Icon = t.icon;
  return <Icon size={size} style={{ color: t.color }} />;
}

function WorkflowCard({ wf, onToggle, onDelete, onRun }: any) {
  const [running, setRunning] = useState(false);

  const handleRun = async () => {
    setRunning(true);
    await onRun(wf.id);
    setRunning(false);
  };

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
              <span style={{
                padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                background: wf.is_active ? "#10b98120" : "var(--bg-overlay)",
                color: wf.is_active ? "#10b981" : "var(--text-muted)",
              }}>
                {wf.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            {wf.description && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{wf.description}</div>}
            <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
              <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                <TriggerIcon type={wf.trigger_type} size={12} />
                {TRIGGER_TYPES.find(t => t.value === wf.trigger_type)?.label || wf.trigger_type}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {(wf.actions || []).length} action{(wf.actions || []).length !== 1 ? "s" : ""}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Ran {wf.run_count || 0} times
              </div>
              {wf.last_run_at && (
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Last: {new Date(wf.last_run_at).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button onClick={handleRun} disabled={running} title="Run now"
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

      {/* Action pills */}
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

function BuilderModal({ onClose, onSave }: { onClose: () => void; onSave: (data: any) => void }) {
  const [form, setForm] = useState({
    name: "", description: "", triggerType: "deal_inactive",
    conditions: [] as any[], actions: [] as any[],
  });
  const [newCondition, setNewCondition] = useState({ field: "stage", operator: "equals", value: "" });
  const [newAction, setNewAction] = useState({ type: "create_task", config: { title: "", description: "", priority: "medium" } });

  const addCondition = () => {
    if (!newCondition.value) return;
    setForm(f => ({ ...f, conditions: [...f.conditions, { ...newCondition }] }));
    setNewCondition({ field: "stage", operator: "equals", value: "" });
  };

  const addAction = () => {
    setForm(f => ({ ...f, actions: [...f.actions, { ...newAction }] }));
    setNewAction({ type: "create_task", config: { title: "", description: "", priority: "medium" } });
  };

  const inputStyle: React.CSSProperties = { width: "100%", padding: "9px 12px", background: "var(--bg-overlay)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 13, boxSizing: "border-box" };
  const labelStyle: React.CSSProperties = { fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "var(--bg-card)", borderRadius: 12, width: "100%", maxWidth: 680, maxHeight: "90vh", overflow: "auto", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "var(--bg-card)", zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Zap size={18} style={{ color: "#3b82f6" }} />
            <span style={{ fontSize: 16, fontWeight: 700 }}>Create Workflow</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4, display: "flex" }}><X size={18} /></button>
        </div>

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Basic info */}
          <div>
            <label style={labelStyle}>Workflow Name *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Stale Deal Alert" style={inputStyle} data-testid="input-workflow-name" />
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What does this workflow do?" style={inputStyle} />
          </div>

          {/* Trigger */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 22, height: 22, background: "#3b82f6", color: "#fff", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>1</span>
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
              <span style={{ width: 22, height: 22, background: "#8b5cf6", color: "#fff", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>2</span>
              Conditions <span style={{ fontSize: 11, fontWeight: 400, color: "var(--text-muted)" }}>(optional filters)</span>
            </div>
            {form.conditions.map((c, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, padding: "8px 10px", background: "var(--bg-overlay)", borderRadius: 8, alignItems: "center" }}>
                <span style={{ fontSize: 12, flex: 1 }}>{c.field} {c.operator} <strong>{c.value}</strong></span>
                <button onClick={() => setForm(f => ({ ...f, conditions: f.conditions.filter((_, j) => j !== i) }))} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: 2, display: "flex" }}><X size={13} /></button>
              </div>
            ))}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 8, marginTop: 6 }}>
              <select value={newCondition.field} onChange={e => setNewCondition(c => ({ ...c, field: e.target.value }))} style={{ ...inputStyle, width: "100%" }}>
                {FIELD_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <select value={newCondition.operator} onChange={e => setNewCondition(c => ({ ...c, operator: e.target.value }))} style={{ ...inputStyle, width: "100%" }}>
                {OPERATORS.map(o => <option key={o} value={o}>{o.replace("_", " ")}</option>)}
              </select>
              <input value={newCondition.value} onChange={e => setNewCondition(c => ({ ...c, value: e.target.value }))} placeholder="Value" style={{ ...inputStyle, width: "100%" }} />
              <button onClick={addCondition} style={{ padding: "9px 14px", background: "#8b5cf6", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>+ Add</button>
            </div>
          </div>

          {/* Actions */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 22, height: 22, background: "#10b981", color: "#fff", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>3</span>
              Actions <span style={{ fontSize: 11, fontWeight: 400, color: "var(--text-muted)" }}>(at least one required)</span>
            </div>
            {form.actions.map((a, i) => {
              const at = ACTION_TYPES.find(x => x.value === a.type);
              const Icon = at?.icon || Zap;
              return (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, padding: "8px 10px", background: "var(--bg-overlay)", borderRadius: 8, alignItems: "center" }}>
                  <Icon size={14} style={{ color: "#10b981", flexShrink: 0 }} />
                  <span style={{ fontSize: 12, flex: 1 }}>{at?.label || a.type}{a.config?.title ? `: "${a.config.title}"` : ""}</span>
                  <button onClick={() => setForm(f => ({ ...f, actions: f.actions.filter((_, j) => j !== i) }))} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: 2, display: "flex" }}><X size={13} /></button>
                </div>
              );
            })}
            <div style={{ padding: 14, background: "var(--bg-overlay)", borderRadius: 8, marginTop: 6 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={labelStyle}>Action Type</label>
                  <select value={newAction.type} onChange={e => setNewAction(a => ({ ...a, type: e.target.value }))} style={{ ...inputStyle, width: "100%" }}>
                    {ACTION_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Task/Message Title</label>
                  <input value={newAction.config.title} onChange={e => setNewAction(a => ({ ...a, config: { ...a.config, title: e.target.value } }))} placeholder="e.g. Follow up on {{deal.name}}" style={{ ...inputStyle, width: "100%" }} />
                </div>
              </div>
              <button onClick={addAction} style={{ padding: "8px 16px", background: "#10b981", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>+ Add Action</button>
            </div>
          </div>
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, justifyContent: "flex-end", position: "sticky", bottom: 0, background: "var(--bg-card)" }}>
          <button onClick={onClose} style={{ padding: "9px 18px", background: "none", border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer", fontSize: 13, color: "var(--text-secondary)" }}>Cancel</button>
          <button
            onClick={() => onSave(form)}
            disabled={!form.name || !form.actions.length}
            data-testid="btn-save-workflow"
            style={{ padding: "9px 18px", background: !form.name || !form.actions.length ? "var(--bg-overlay)" : "#3b82f6", color: !form.name || !form.actions.length ? "var(--text-muted)" : "#fff", border: "none", borderRadius: 8, cursor: !form.name || !form.actions.length ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600 }}
          >
            Create Workflow
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WorkflowsPage() {
  const qc = useQueryClient();
  const [showBuilder, setShowBuilder] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [runResult, setRunResult] = useState<any>(null);

  const { data: workflows = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/workflows"] });
  const { data: templates = [] } = useQuery<any[]>({ queryKey: ["/api/workflows/templates"] });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/workflows", { ...data, triggerType: data.triggerType }),
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

  const runWorkflow = async (id: string) => {
    const result = await apiRequest("POST", `/api/workflows/${id}/run`, {});
    setRunResult(result);
    qc.invalidateQueries({ queryKey: ["/api/workflows"] });
  };

  const activeCount = Array.isArray(workflows) ? workflows.filter((w: any) => w.is_active).length : 0;
  const totalRuns = Array.isArray(workflows) ? workflows.reduce((s: number, w: any) => s + (w.run_count || 0), 0) : 0;

  return (
    <Layout
      title="Workflow Automation"
      subtitle="Build IF/THEN automation rules for your CRM"
      actions={
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setShowTemplates(true)}
            style={{ padding: "8px 14px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer", fontSize: 13, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
            <BookOpen size={14} /> Templates
          </button>
          <button
            data-testid="btn-create-workflow"
            onClick={() => setShowBuilder(true)}
            style={{ padding: "8px 14px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
            <Plus size={14} /> New Workflow
          </button>
        </div>
      }
    >
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Total Workflows", value: Array.isArray(workflows) ? workflows.length : 0, color: "#3b82f6" },
          { label: "Active", value: activeCount, color: "#10b981" },
          { label: "Total Runs", value: totalRuns, color: "#8b5cf6" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 18px" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Run result */}
      {runResult && (
        <div style={{ marginBottom: 16, padding: 14, background: "#10b98110", border: "1px solid #10b98130", borderRadius: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontWeight: 600, fontSize: 13, color: "#10b981" }}>Workflow executed</span>
            <button onClick={() => setRunResult(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 2, display: "flex" }}><X size={14} /></button>
          </div>
          {runResult.results?.map((r: any, i: number) => (
            <div key={i} style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 3 }}>
              <strong>{r.action}</strong>: {r.detail}
            </div>
          ))}
        </div>
      )}

      {/* Workflow list */}
      {isLoading ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>Loading workflows…</div>
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
            />
          ))}
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
          <div style={{ background: "var(--bg-card)", borderRadius: 12, width: "100%", maxWidth: 660, maxHeight: "85vh", overflow: "auto" }}>
            <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "var(--bg-card)" }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>Workflow Templates</span>
              <button onClick={() => setShowTemplates(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}><X size={18} /></button>
            </div>
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              {(templates as any[]).map((t: any, i: number) => (
                <div key={i} style={{ padding: "14px 16px", background: "var(--bg-overlay)", borderRadius: 10, border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>{t.name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>{t.description}</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ padding: "2px 8px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, fontSize: 11 }}>
                          {TRIGGER_TYPES.find(x => x.value === t.triggerType)?.label || t.triggerType}
                        </span>
                        {t.actions.map((a: any, j: number) => (
                          <span key={j} style={{ padding: "2px 8px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, fontSize: 11 }}>
                            {ACTION_TYPES.find(x => x.value === a.type)?.label || a.type}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => createMutation.mutate({ name: t.name, description: t.description, triggerType: t.triggerType, triggerConfig: t.triggerConfig, conditions: t.conditions, actions: t.actions })}
                      style={{ padding: "7px 14px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
                      Use Template
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
