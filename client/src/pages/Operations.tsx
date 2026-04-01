// ═══ PROJECTS + GANTT ══════════════════════════════════════════
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "../components/Layout";
import { Modal, FormRow, Select, Empty, Badge, Loader, Avatar } from "../components/UI";
import { apiRequest } from "../lib/api";
import { Briefcase, Plus, Edit, Trash2, CheckSquare, Users, BarChart2, Calendar, Target, Zap, Megaphone, Globe, Star, Check, FileText, Link, Image, Type, Play } from "lucide-react";
import { Link as WouterLink } from "wouter";

const PROJECT_STATUS = [{ value: "planning", label: "Planning" }, { value: "active", label: "Active" }, { value: "on_hold", label: "On Hold" }, { value: "completed", label: "Completed" }, { value: "cancelled", label: "Cancelled" }];
const PRIORITY = [{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }, { value: "urgent", label: "Urgent" }];
const STATUS_COLOR: Record<string, string> = { planning: "#64748b", active: "#3b82f6", on_hold: "#f59e0b", completed: "#10b981", cancelled: "#ef4444" };
const BLANK_P = { name: "", description: "", status: "planning", priority: "medium", color: "#3b82f6", budget: "" };

export function ProjectsPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(BLANK_P);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [taskForm, setTaskForm] = useState({ title: "", status: "todo", priority: "medium", dueDate: "" });
  const [saving, setSaving] = useState(false);

  const { data: projects } = useQuery<any[]>({ queryKey: ["/api/ops/projects"] });
  const { data: tasks } = useQuery<any[]>({ queryKey: [`/api/ops/projects/${selectedProject?.id}/tasks`], enabled: !!selectedProject?.id });
  const delMut = useMutation({ mutationFn: (id: string) => apiRequest("DELETE", `/api/ops/projects/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/ops/projects"] }) });

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) await apiRequest("PUT", `/api/ops/projects/${editing.id}`, form);
      else await apiRequest("POST", "/api/ops/projects", form);
      qc.invalidateQueries({ queryKey: ["/api/ops/projects"] }); setModal(false);
    } finally { setSaving(false); }
  };

  const addTask = async () => {
    if (!taskForm.title || !selectedProject) return;
    await apiRequest("POST", `/api/ops/projects/${selectedProject.id}/tasks`, taskForm);
    qc.invalidateQueries({ queryKey: [`/api/ops/projects/${selectedProject.id}/tasks`] });
    setTaskForm({ title: "", status: "todo", priority: "medium", dueDate: "" });
  };

  const updateTaskStatus = async (taskId: string, projectId: string, status: string) => {
    await apiRequest("PUT", `/api/ops/projects/${projectId}/tasks/${taskId}`, { status, completedAt: status === "done" ? new Date().toISOString() : null });
    qc.invalidateQueries({ queryKey: [`/api/ops/projects/${projectId}/tasks`] });
    qc.invalidateQueries({ queryKey: ["/api/ops/projects"] });
  };

  return (
    <Layout title="Projects" subtitle="Project management with Gantt charts & task tracking"
      actions={<button className="btn btn-primary btn-sm" onClick={() => { setEditing(null); setForm(BLANK_P); setModal(true); }}><Plus size={14} /> New Project</button>}
    >
      <div style={{ display: "grid", gridTemplateColumns: selectedProject ? "280px 1fr" : "1fr", gap: 20 }}>
        {/* Project List */}
        <div>
          <div style={{ display: "grid", gap: 10 }}>
            {!projects?.length ? <Empty icon={Briefcase} title="No projects yet" action={<button className="btn btn-primary" onClick={() => setModal(true)}><Plus size={15} /> New Project</button>} /> :
              projects.map((p: any) => (
                <div key={p.id} className="card" style={{ padding: 16, cursor: "pointer", borderLeft: `3px solid ${STATUS_COLOR[p.status] || "#64748b"}`, border: selectedProject?.id === p.id ? `1.5px solid ${STATUS_COLOR[p.status]}` : undefined }}
                  onClick={() => setSelectedProject(selectedProject?.id === p.id ? null : p)}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button className="btn btn-ghost btn-sm" style={{ padding: 4 }} onClick={e => { e.stopPropagation(); setEditing(p); setForm({ name: p.name, description: p.description || "", status: p.status, priority: p.priority, color: p.color, budget: p.budget || "" }); setModal(true); }}><Edit size={12} /></button>
                      <button className="btn btn-ghost btn-sm" style={{ padding: 4, color: "#ef4444" }} onClick={e => { e.stopPropagation(); if (confirm("Delete project?")) delMut.mutate(p.id); }}><Trash2 size={12} /></button>
                    </div>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>
                      <span>Progress</span><span>{p.progress || 0}%</span>
                    </div>
                    <div style={{ width: "100%", height: 6, borderRadius: 3, background: "var(--bg-overlay)" }}>
                      <div style={{ width: `${p.progress || 0}%`, height: "100%", borderRadius: 3, background: STATUS_COLOR[p.status] || "#3b82f6", transition: "width 0.3s" }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span className="badge badge-gray">{p.status.replace("_", " ")}</span>
                    <span className="badge badge-gray">{p.priority}</span>
                    {p.dueDate && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Due {new Date(p.dueDate).toLocaleDateString()}</span>}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Gantt / Task view */}
        {selectedProject && (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{selectedProject.name} — Tasks</h3>
                <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>Progress: {selectedProject.progress || 0}%</p>
              </div>
            </div>
            {/* Add task bar */}
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", gap: 8 }}>
              <input className="input" placeholder="Add task..." value={taskForm.title} onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))} onKeyDown={e => e.key === "Enter" && addTask()} style={{ flex: 1 }} />
              <Select options={PRIORITY} value={taskForm.priority} onChange={e => setTaskForm(p => ({ ...p, priority: e.target.value }))} style={{ width: 110 }} />
              <input type="date" className="input" value={taskForm.dueDate} onChange={e => setTaskForm(p => ({ ...p, dueDate: e.target.value }))} style={{ width: 140 }} />
              <button className="btn btn-primary btn-sm" onClick={addTask}><Plus size={14} /></button>
            </div>
            {/* Gantt rows */}
            <div>
              {(["todo", "in_progress", "done"] as const).map(status => {
                const statusTasks = (tasks || []).filter(t => t.status === status);
                const colors = { todo: "#64748b", in_progress: "#3b82f6", done: "#10b981" };
                const labels = { todo: "To Do", in_progress: "In Progress", done: "Done" };
                return (
                  <div key={status}>
                    <div style={{ padding: "8px 16px", background: "var(--bg-elevated)", borderTop: "1px solid var(--border)", fontSize: 11, fontWeight: 700, color: colors[status], textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      {labels[status]} ({statusTasks.length})
                    </div>
                    {statusTasks.map((task: any) => {
                      const hasDue = !!task.dueDate;
                      const isOverdue = hasDue && new Date(task.dueDate) < new Date() && status !== "done";
                      const daysTotal = hasDue ? (new Date(task.dueDate).getTime() - new Date(task.startDate || task.createdAt).getTime()) / 86400000 : 0;
                      const daysLeft = hasDue ? (new Date(task.dueDate).getTime() - Date.now()) / 86400000 : 0;
                      const barWidth = daysTotal > 0 ? Math.max(5, Math.min(100, ((daysTotal - daysLeft) / daysTotal) * 100)) : 50;

                      return (
                        <div key={task.id} style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", display: "grid", gridTemplateColumns: "1fr 160px 80px 80px", gap: 12, alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <button onClick={() => updateTaskStatus(task.id, selectedProject.id, status === "done" ? "todo" : "done")} style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${colors[status]}`, background: status === "done" ? colors[status] : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                              {status === "done" && <Check size={11} style={{ color: "#fff" }} />}
                            </button>
                            <span style={{ fontSize: 14, textDecoration: status === "done" ? "line-through" : "none", color: status === "done" ? "var(--text-muted)" : "var(--text-primary)" }}>{task.title}</span>
                          </div>
                          {/* Mini Gantt bar */}
                          <div>
                            {hasDue && (
                              <div style={{ height: 8, borderRadius: 4, background: "var(--bg-overlay)", overflow: "hidden" }}>
                                <div style={{ width: `${barWidth}%`, height: "100%", borderRadius: 4, background: isOverdue ? "#ef4444" : colors[status] }} />
                              </div>
                            )}
                            {task.dueDate && <div style={{ fontSize: 10, color: isOverdue ? "#ef4444" : "var(--text-muted)", marginTop: 2 }}>{isOverdue ? "Overdue" : `Due ${new Date(task.dueDate).toLocaleDateString()}`}</div>}
                          </div>
                          <Badge status={task.priority} />
                          <button className="btn btn-ghost btn-sm" style={{ padding: 4, color: "#ef4444", justifyContent: "center" }} onClick={() => { apiRequest("DELETE", `/api/ops/projects/${selectedProject.id}/tasks/${task.id}`).then(() => qc.invalidateQueries({ queryKey: [`/api/ops/projects/${selectedProject.id}/tasks`] })); }}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              {!tasks?.length && <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>No tasks yet. Add your first task above.</div>}
            </div>
          </div>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Edit Project" : "New Project"}>
        <form onSubmit={save}>
          <div style={{ padding: "20px", display: "grid", gap: 12 }}>
            <FormRow label="Project name" required><input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required /></FormRow>
            <FormRow label="Description"><textarea className="input" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} /></FormRow>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <FormRow label="Status"><Select options={PROJECT_STATUS} value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} /></FormRow>
              <FormRow label="Priority"><Select options={PRIORITY} value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} /></FormRow>
              <FormRow label="Budget"><input type="number" className="input" value={form.budget} onChange={e => setForm(p => ({ ...p, budget: e.target.value }))} /></FormRow>
            </div>
          </div>
          <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : editing ? "Save" : "Create"}</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}

// ═══ EMPLOYEES ══════════════════════════════════════════════════
const BLANK_E = { firstName: "", lastName: "", email: "", phone: "", department: "", jobTitle: "", employmentType: "full_time", status: "active", salary: "", currency: "USD", location: "" };
const EMP_STATUS = [{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }, { value: "on_leave", label: "On Leave" }];
const EMP_TYPE = [{ value: "full_time", label: "Full Time" }, { value: "part_time", label: "Part Time" }, { value: "contractor", label: "Contractor" }];

export function EmployeesPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(BLANK_E);
  const [saving, setSaving] = useState(false);

  const { data: empList } = useQuery<any[]>({ queryKey: ["/api/ops/employees"] });
  const delMut = useMutation({ mutationFn: (id: string) => apiRequest("DELETE", `/api/ops/employees/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/ops/employees"] }) });

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) await apiRequest("PUT", `/api/ops/employees/${editing.id}`, form);
      else await apiRequest("POST", "/api/ops/employees", form);
      qc.invalidateQueries({ queryKey: ["/api/ops/employees"] }); setModal(false);
    } finally { setSaving(false); }
  };

  const depts = [...new Set((empList || []).map((e: any) => e.department).filter(Boolean))];
  const active = (empList || []).filter(e => e.status === "active").length;

  return (
    <Layout title="Employees" subtitle={`${empList?.length || 0} team members · ${active} active`}
      actions={<button className="btn btn-primary btn-sm" onClick={() => { setEditing(null); setForm(BLANK_E); setModal(true); }}><Plus size={14} /> Add Employee</button>}
    >
      {/* Dept breakdown */}
      {depts.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {depts.map(dept => {
            const count = (empList || []).filter(e => e.department === dept).length;
            return <div key={dept} className="card" style={{ padding: "8px 14px", display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontWeight: 700 }}>{count}</span><span style={{ fontSize: 12, color: "var(--text-muted)" }}>{dept}</span></div>;
          })}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
        {!empList?.length ? <div style={{ gridColumn: "1/-1" }}><Empty icon={Users} title="No employees yet" action={<button className="btn btn-primary" onClick={() => setModal(true)}><Plus size={15} /> Add Employee</button>} /></div> :
          empList.map((emp: any) => (
            <div key={emp.id} className="card" style={{ padding: "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <Avatar name={`${emp.firstName} ${emp.lastName}`} size={40} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{emp.firstName} {emp.lastName}</div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{emp.jobTitle}</div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button className="btn btn-ghost btn-sm" style={{ padding: 4 }} onClick={() => { setEditing(emp); setForm({ firstName: emp.firstName, lastName: emp.lastName || "", email: emp.email || "", phone: emp.phone || "", department: emp.department || "", jobTitle: emp.jobTitle || "", employmentType: emp.employmentType, status: emp.status, salary: emp.salary || "", currency: emp.currency, location: emp.location || "" }); setModal(true); }}><Edit size={12} /></button>
                  <button className="btn btn-ghost btn-sm" style={{ padding: 4, color: "#ef4444" }} onClick={() => { if (confirm("Delete employee?")) delMut.mutate(emp.id); }}><Trash2 size={12} /></button>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {emp.department && <span className="badge badge-blue">{emp.department}</span>}
                <span className={`badge ${emp.status === "active" ? "badge-green" : emp.status === "on_leave" ? "badge-amber" : "badge-gray"}`}>{emp.status.replace("_", " ")}</span>
                <span className="badge badge-gray">{emp.employmentType.replace("_", " ")}</span>
              </div>
              {emp.salary && <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}>💰 {emp.currency} {Number(emp.salary).toLocaleString()}/yr</div>}
            </div>
          ))}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Edit Employee" : "Add Employee"}>
        <form onSubmit={save}>
          <div style={{ padding: "20px", display: "grid", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormRow label="First name" required><input className="input" value={form.firstName} onChange={e => setForm((p: any) => ({ ...p, firstName: e.target.value }))} required /></FormRow>
              <FormRow label="Last name"><input className="input" value={form.lastName} onChange={e => setForm((p: any) => ({ ...p, lastName: e.target.value }))} /></FormRow>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormRow label="Email"><input type="email" className="input" value={form.email} onChange={e => setForm((p: any) => ({ ...p, email: e.target.value }))} /></FormRow>
              <FormRow label="Phone"><input className="input" value={form.phone} onChange={e => setForm((p: any) => ({ ...p, phone: e.target.value }))} /></FormRow>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormRow label="Department"><input className="input" value={form.department} onChange={e => setForm((p: any) => ({ ...p, department: e.target.value }))} /></FormRow>
              <FormRow label="Job title"><input className="input" value={form.jobTitle} onChange={e => setForm((p: any) => ({ ...p, jobTitle: e.target.value }))} /></FormRow>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <FormRow label="Type"><Select options={EMP_TYPE} value={form.employmentType} onChange={e => setForm((p: any) => ({ ...p, employmentType: e.target.value }))} /></FormRow>
              <FormRow label="Status"><Select options={EMP_STATUS} value={form.status} onChange={e => setForm((p: any) => ({ ...p, status: e.target.value }))} /></FormRow>
              <FormRow label="Currency"><input className="input" value={form.currency} onChange={e => setForm((p: any) => ({ ...p, currency: e.target.value }))} /></FormRow>
            </div>
            <FormRow label="Annual Salary"><input type="number" className="input" value={form.salary} onChange={e => setForm((p: any) => ({ ...p, salary: e.target.value }))} /></FormRow>
          </div>
          <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : editing ? "Save" : "Add Employee"}</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}

// ═══ MARKETING HUB ══════════════════════════════════════════════
export function MarketingPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("Funnels");
  const [funnelModal, setFunnelModal] = useState(false);
  const [lpModal, setLpModal] = useState(false);
  const [funnelForm, setFunnelForm] = useState({ offer: "", audience: "", goal: "lead_generation" });
  const [lpForm, setLpForm] = useState({ offer: "", audience: "", tone: "professional" });
  const [generating, setGenerating] = useState(false);
  const [generatedFunnel, setGeneratedFunnel] = useState<any>(null);
  const [generatedLP, setGeneratedLP] = useState<any>(null);

  const { data: funnels } = useQuery<any[]>({ queryKey: ["/api/ops/funnels"], enabled: tab === "Funnels" });
  const { data: lps } = useQuery<any[]>({ queryKey: ["/api/ops/landing-pages"], enabled: tab === "Landing Pages" });
  const { data: abTests } = useQuery<any[]>({ queryKey: ["/api/ops/ab-tests"], enabled: tab === "A/B Tests" });
  const { data: reviews } = useQuery<any[]>({ queryKey: ["/api/ops/reviews"], enabled: tab === "Reputation" });

  const genFunnel = async () => {
    setGenerating(true);
    try { const result = await apiRequest<any>("POST", "/api/ops/funnels/generate", funnelForm); setGeneratedFunnel(result); qc.invalidateQueries({ queryKey: ["/api/ops/funnels"] }); setFunnelModal(false); }
    finally { setGenerating(false); }
  };

  const genLP = async () => {
    setGenerating(true);
    try { setGeneratedLP(await apiRequest<any>("POST", "/api/ops/landing-pages/generate", lpForm)); setLpModal(false); }
    finally { setGenerating(false); }
  };

  const MTABS = ["Funnels", "Landing Pages", "A/B Tests", "Reputation"];

  return (
    <Layout title="Marketing Hub" subtitle="AI Funnels, landing pages, A/B testing & reputation management"
      actions={
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setLpModal(true)}><Globe size={14} /> New Landing Page</button>
          <button className="btn btn-primary btn-sm" onClick={() => setFunnelModal(true)}><Zap size={14} /> Build Funnel</button>
        </div>
      }
    >
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {MTABS.map(t => <button key={t} onClick={() => setTab(t)} className={`btn btn-sm ${tab === t ? "btn-primary" : "btn-secondary"}`}>{t}</button>)}
      </div>

      {/* ── FUNNELS ── */}
      {tab === "Funnels" && (
        <>
          {generatedFunnel && (
            <div className="card" style={{ padding: 20, marginBottom: 20, border: "1px solid rgba(59,130,246,0.3)" }}>
              <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 16 }}>⚡ Generated: {generatedFunnel.funnel?.name}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", marginBottom: 10, textTransform: "uppercase" }}>Funnel Steps</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {(generatedFunnel.steps || []).map((s: any) => (
                      <div key={s.id} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(59,130,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12, flexShrink: 0 }}>{s.stepNumber || s.order}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name} <span style={{ fontSize: 11, color: "var(--text-muted)" }}>({s.type})</span></div>
                          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.content?.headline}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", marginBottom: 10, textTransform: "uppercase" }}>Email Sequence</div>
                  {(generatedFunnel.emailSequence || []).map((e: any, i: number) => (
                    <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>Day {e.delayDays}: {e.subject}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{e.body?.slice(0, 80)}...</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {!funnels?.length && !generatedFunnel ? <Empty icon={Target} title="No funnels yet" desc="Build a complete marketing funnel with AI — landing page, email sequence, and ad copy in one click" action={<button className="btn btn-primary" onClick={() => setFunnelModal(true)}><Zap size={15} /> Build Funnel</button>} /> : (
            <div style={{ display: "grid", gap: 12 }}>
              {(funnels || []).map((f: any) => (
                <div key={f.id} className="card" style={{ padding: "16px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{f.name}</div>
                      <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{f.offer} · {f.targetAudience}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span className={`badge ${f.status === "active" ? "badge-green" : "badge-gray"}`}>{f.status}</span>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{(f.steps || []).length} steps</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── LANDING PAGES ── */}
      {tab === "Landing Pages" && (
        <>
          {generatedLP && (
            <div className="card" style={{ padding: 24, marginBottom: 20, border: "1px solid rgba(139,92,246,0.3)" }}>
              <div style={{ fontWeight: 800, fontSize: 24, marginBottom: 8 }}>{generatedLP.headline}</div>
              <div style={{ fontSize: 16, color: "var(--text-secondary)", marginBottom: 20 }}>{generatedLP.subheadline}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12, marginBottom: 20 }}>
                {(generatedLP.features || []).map((f: any, i: number) => (
                  <div key={i} className="card" style={{ padding: "12px 14px" }}>
                    <div style={{ fontSize: 20, marginBottom: 6 }}>{f.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{f.title}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{f.description}</div>
                  </div>
                ))}
              </div>
              {generatedLP.socialProof && <div style={{ fontSize: 14, color: "var(--text-muted)", textAlign: "center" }}>{generatedLP.socialProof}</div>}
            </div>
          )}
          {!lps?.length && !generatedLP ? <Empty icon={Globe} title="No landing pages yet" action={<button className="btn btn-primary" onClick={() => setLpModal(true)}><Zap size={15} /> Generate Landing Page</button>} /> : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
              {(lps || []).map((p: any) => (
                <div key={p.id} className="card" style={{ padding: 16 }}>
                  <div style={{ fontWeight: 700 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>/{p.slug}</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <span className={`badge ${p.isPublished ? "badge-green" : "badge-gray"}`}>{p.isPublished ? "Live" : "Draft"}</span>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{p.views || 0} views · {p.conversions || 0} conversions</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── A/B TESTS ── */}
      {tab === "A/B Tests" && (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
            <button className="btn btn-primary btn-sm" onClick={async () => {
              await apiRequest("POST", "/api/ops/ab-tests", {
                name: `Test ${Date.now().toString().slice(-4)}`,
                type: "email",
                status: "draft",
                variants: [{ id: "A", name: "Variant A", content: { subject: "Subject A" }, visitors: 0, conversions: 0 }, { id: "B", name: "Variant B", content: { subject: "Subject B" }, visitors: 0, conversions: 0 }]
              });
              qc.invalidateQueries({ queryKey: ["/api/ops/ab-tests"] });
            }}><Plus size={14} /> New A/B Test</button>
          </div>
          {!abTests?.length ? <Empty icon={BarChart2} title="No A/B tests yet" desc="Test different versions of emails, landing pages, and ads to find what converts best" /> : (
            <div style={{ display: "grid", gap: 12 }}>
              {abTests.map((t: any) => (
                <div key={t.id} className="card" style={{ padding: "16px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{t.name}</div>
                      <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{t.type} test · {(t.variants || []).length} variants</div>
                    </div>
                    <span className={`badge ${t.status === "running" ? "badge-green" : "badge-gray"}`}>{t.status}</span>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    {(t.variants || []).map((v: any) => {
                      const cvr = v.visitors > 0 ? ((v.conversions / v.visitors) * 100).toFixed(1) : "0.0";
                      const isWinner = t.winnerVariantId === v.id;
                      return (
                        <div key={v.id} style={{ flex: 1, padding: "10px 12px", background: isWinner ? "rgba(16,185,129,0.1)" : "var(--bg-overlay)", borderRadius: 8, border: isWinner ? "1px solid rgba(16,185,129,0.3)" : "1px solid var(--border)" }}>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{v.name} {isWinner && "🏆"}</div>
                          <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{v.visitors} visitors</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#10b981" }}>{cvr}% CVR</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── REPUTATION ── */}
      {tab === "Reputation" && (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
            <button className="btn btn-primary btn-sm" onClick={async () => {
              await apiRequest("POST", "/api/ops/reviews", { platform: "google", reviewerName: "Jane D.", rating: 4, content: "Great CRM platform! Easy to use and packed with features.", sentiment: "positive", publishedAt: new Date().toISOString() });
              qc.invalidateQueries({ queryKey: ["/api/ops/reviews"] });
            }}><Plus size={14} /> Add Review</button>
          </div>
          {!reviews?.length ? <Empty icon={Star} title="No reviews tracked" desc="Monitor and respond to customer reviews across Google, G2, Trustpilot and more" /> : (
            <div style={{ display: "grid", gap: 10 }}>
              {reviews.map((r: any) => (
                <div key={r.id} className="card" style={{ padding: "16px 20px", borderLeft: `3px solid ${r.sentiment === "positive" ? "#10b981" : r.sentiment === "negative" ? "#ef4444" : "#f59e0b"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ fontWeight: 700 }}>{r.reviewerName}</span>
                      <span className="badge badge-gray">{r.platform}</span>
                      <div style={{ display: "flex", gap: 2 }}>
                        {[1,2,3,4,5].map(s => <Star key={s} size={12} fill={s <= r.rating ? "#f59e0b" : "transparent"} style={{ color: "#f59e0b" }} />)}
                      </div>
                    </div>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{r.publishedAt && new Date(r.publishedAt).toLocaleDateString()}</span>
                  </div>
                  <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 8 }}>{r.content}</div>
                  {r.response && (
                    <div style={{ background: "var(--bg-overlay)", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "var(--text-muted)" }}>
                      <strong>Business reply:</strong> {r.response}
                    </div>
                  )}
                  {!r.response && (
                    <button className="btn btn-secondary btn-sm" style={{ fontSize: 12 }} onClick={async () => {
                      await apiRequest("POST", `/api/ops/reviews/${r.id}/respond`, { response: "" });
                      qc.invalidateQueries({ queryKey: ["/api/ops/reviews"] });
                    }}><Zap size={12} /> AI Auto-Respond</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Funnel Modal */}
      <Modal open={funnelModal} onClose={() => setFunnelModal(false)} title="⚡ AI Funnel Builder">
        <div style={{ padding: "20px", display: "grid", gap: 14 }}>
          <div style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#93c5fd" }}>
            AI will build a complete funnel: funnel steps + 4-email sequence + ad copy for Google, LinkedIn & Facebook.
          </div>
          <FormRow label="Your offer" required><input className="input" value={funnelForm.offer} onChange={e => setFunnelForm(p => ({ ...p, offer: e.target.value }))} placeholder="14-day free CRM trial" required /></FormRow>
          <FormRow label="Target audience"><input className="input" value={funnelForm.audience} onChange={e => setFunnelForm(p => ({ ...p, audience: e.target.value }))} placeholder="Sales teams at B2B SaaS companies" /></FormRow>
          <FormRow label="Goal"><Select options={[{ value: "lead_generation", label: "Lead Generation" }, { value: "sales", label: "Direct Sales" }, { value: "webinar", label: "Webinar Registration" }, { value: "demo", label: "Book a Demo" }]} value={funnelForm.goal} onChange={e => setFunnelForm(p => ({ ...p, goal: e.target.value }))} /></FormRow>
        </div>
        <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="btn btn-secondary" onClick={() => setFunnelModal(false)}>Cancel</button>
          <button className="btn btn-primary" disabled={generating || !funnelForm.offer} onClick={genFunnel}>
            {generating ? <><span className="spinner" style={{ width: 14, height: 14 }} />Building...</> : <><Zap size={14} /> Build Full Funnel</>}
          </button>
        </div>
      </Modal>

      {/* Landing Page Modal */}
      <Modal open={lpModal} onClose={() => setLpModal(false)} title="🚀 AI Landing Page Generator">
        <div style={{ padding: "20px", display: "grid", gap: 12 }}>
          <FormRow label="Your offer" required><input className="input" value={lpForm.offer} onChange={e => setLpForm(p => ({ ...p, offer: e.target.value }))} placeholder="ARGILETTE CRM - Free 14-day trial" required /></FormRow>
          <FormRow label="Target audience"><input className="input" value={lpForm.audience} onChange={e => setLpForm(p => ({ ...p, audience: e.target.value }))} placeholder="B2B sales teams" /></FormRow>
          <FormRow label="Tone"><Select options={[{ value: "professional", label: "Professional" }, { value: "friendly", label: "Friendly" }, { value: "direct", label: "Direct & Bold" }, { value: "premium", label: "Premium / Luxury" }]} value={lpForm.tone} onChange={e => setLpForm(p => ({ ...p, tone: e.target.value }))} /></FormRow>
        </div>
        <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="btn btn-secondary" onClick={() => setLpModal(false)}>Cancel</button>
          <button className="btn btn-primary" disabled={generating || !lpForm.offer} onClick={genLP}>
            {generating ? <><span className="spinner" style={{ width: 14, height: 14 }} />Generating...</> : <><Zap size={14} /> Generate Page</>}
          </button>
        </div>
      </Modal>
    </Layout>
  );
}

export default ProjectsPage;
