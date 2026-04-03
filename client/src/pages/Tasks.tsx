import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "../components/Layout";
import { Modal, FormRow, Select, Empty, Badge, Avatar, Loader } from "../components/UI";
import { apiRequest } from "../lib/api";
import { useLanguage } from "../contexts/LanguageContext";
import { CheckSquare, Plus, Trash2, Edit, Building2, Megaphone, FileText, Settings as SettingsIcon, Users, Home, Check, AlertCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "wouter";

// ═══════════════════════════════════════════════════
// TASKS
// ═══════════════════════════════════════════════════
const TASK_STATUS = [{ value: "todo", label: "To Do" }, { value: "in_progress", label: "In Progress" }, { value: "done", label: "Done" }, { value: "cancelled", label: "Cancelled" }];
const TASK_PRIORITY = [{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }, { value: "urgent", label: "Urgent" }];
const BLANK_TASK = { title: "", description: "", status: "todo", priority: "medium", dueDate: "" };

export function TasksPage() {
  const qc = useQueryClient();
  const { t } = useLanguage();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(BLANK_TASK);
  const [saving, setSaving] = useState(false);

  const { data: tasks, isLoading } = useQuery<any[]>({ queryKey: ["/api/tasks"] });
  const delMut = useMutation({ mutationFn: (id: string) => apiRequest("DELETE", `/api/tasks/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/tasks"] }) });
  const toggleMut = useMutation({ mutationFn: ({ id, status }: any) => apiRequest("PUT", `/api/tasks/${id}`, { status }), onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/tasks"] }) });

  const openAdd = () => { setEditing(null); setForm(BLANK_TASK); setModal(true); };
  const openEdit = (t: any) => { setEditing(t); setForm({ title: t.title, description: t.description || "", status: t.status, priority: t.priority, dueDate: t.dueDate ? t.dueDate.slice(0, 10) : "" }); setModal(true); };
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...form, dueDate: form.dueDate || null };
      if (editing) await apiRequest("PUT", `/api/tasks/${editing.id}`, payload);
      else await apiRequest("POST", "/api/tasks", payload);
      qc.invalidateQueries({ queryKey: ["/api/tasks"] }); setModal(false);
    } finally { setSaving(false); }
  };

  const grouped = { todo: [] as any[], in_progress: [] as any[], done: [] as any[] };
  (tasks || []).forEach(t => { if (t.status === "todo") grouped.todo.push(t); else if (t.status === "in_progress") grouped.in_progress.push(t); else grouped.done.push(t); });

  const TaskCard = ({ t }: { t: any }) => {
    const isOverdue = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done";
    return (
      <div className="card" style={{ padding: "12px 14px", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <button
            className="btn btn-ghost btn-sm"
            style={{ padding: 2, marginTop: 2, flexShrink: 0, color: t.status === "done" ? "#10b981" : "var(--text-muted)" }}
            onClick={() => toggleMut.mutate({ id: t.id, status: t.status === "done" ? "todo" : "done" })}
          >
            <Check size={16} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, textDecoration: t.status === "done" ? "line-through" : "none", color: t.status === "done" ? "var(--text-muted)" : "var(--text-primary)" }}>{t.title}</div>
            {t.description && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{t.description}</div>}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
              <Badge status={t.priority} />
              {t.dueDate && (
                <span style={{ fontSize: 11, color: isOverdue ? "#ef4444" : "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                  {isOverdue && <AlertCircle size={11} />}
                  {new Date(t.dueDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
            <button className="btn btn-ghost btn-sm" style={{ padding: 4 }} onClick={() => openEdit(t)}><Edit size={13} /></button>
            <button className="btn btn-ghost btn-sm" style={{ padding: 4, color: "#ef4444" }} onClick={() => { if (confirm("Delete task?")) delMut.mutate(t.id); }}><Trash2 size={13} /></button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout title={t("tasks_title")} subtitle={`${tasks?.length ?? 0} ${t("nav_tasks").toLowerCase()}`} actions={<button className="btn btn-primary btn-sm" onClick={openAdd}><Plus size={15} /> {t("add_task_btn")}</button>}>
      {isLoading ? <Loader /> : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          {[{ key: "todo", label: "To Do", color: "#64748b" }, { key: "in_progress", label: "In Progress", color: "#3b82f6" }, { key: "done", label: "Done", color: "#10b981" }].map(col => (
            <div key={col.key}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: col.color }} />
                <span style={{ fontSize: 13, fontWeight: 700 }}>{col.label}</span>
                <span className="badge badge-gray">{(grouped as any)[col.key].length}</span>
              </div>
              {(grouped as any)[col.key].map((t: any) => <TaskCard key={t.id} t={t} />)}
            </div>
          ))}
        </div>
      )}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? t("edit") + " " + t("nav_tasks").slice(0,-1) : t("add_task_btn")}>
        <form onSubmit={save}>
          <div style={{ padding: "20px", display: "grid", gap: 12 }}>
            <FormRow label={t("task_title")} required><input className="input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required /></FormRow>
            <FormRow label={t("description")}><textarea className="input" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} /></FormRow>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <FormRow label={t("status")}><Select options={TASK_STATUS} value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} /></FormRow>
              <FormRow label={t("task_priority")}><Select options={TASK_PRIORITY} value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} /></FormRow>
              <FormRow label={t("task_due_date")}><input type="date" className="input" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} /></FormRow>
            </div>
          </div>
          <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>{t("cancel")}</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? t("loading") : editing ? t("save") : t("add_task_btn")}</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}

// ═══════════════════════════════════════════════════
// ACCOUNTS
// ═══════════════════════════════════════════════════
const BLANK_ACCOUNT = { name: "", website: "", industry: "", size: "", phone: "", email: "", city: "", country: "", notes: "" };
const INDUSTRIES = ["Technology", "Healthcare", "Finance", "Retail", "Manufacturing", "Education", "Real Estate", "Consulting", "Media", "Logistics", "Other"].map(v => ({ value: v, label: v }));
const SIZES = ["1-10", "11-50", "51-200", "201-500", "500+"].map(v => ({ value: v, label: v }));

export function AccountsPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(BLANK_ACCOUNT);
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery<{ data: any[]; total: number }>({ queryKey: ["/api/accounts"] });
  const delMut = useMutation({ mutationFn: (id: string) => apiRequest("DELETE", `/api/accounts/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/accounts"] }) });

  const openAdd = () => { setEditing(null); setForm(BLANK_ACCOUNT); setModal(true); };
  const openEdit = (a: any) => { setEditing(a); setForm({ name: a.name, website: a.website || "", industry: a.industry || "", size: a.size || "", phone: a.phone || "", email: a.email || "", city: a.city || "", country: a.country || "", notes: a.notes || "" }); setModal(true); };
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) await apiRequest("PUT", `/api/accounts/${editing.id}`, form);
      else await apiRequest("POST", "/api/accounts", form);
      qc.invalidateQueries({ queryKey: ["/api/accounts"] }); setModal(false);
    } finally { setSaving(false); }
  };

  return (
    <Layout title="Accounts" subtitle={data ? `${data.total} companies` : undefined} actions={<button className="btn btn-primary btn-sm" onClick={openAdd}><Plus size={15} /> Add Account</button>}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {isLoading ? [...Array(6)].map((_, i) => <div key={i} className="shimmer" style={{ height: 120, borderRadius: 14 }} />) :
          !data?.data?.length ? <div style={{ gridColumn: "1/-1" }}><Empty icon={Building2} title="No accounts yet" action={<button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> Add Account</button>} /></div> :
            data.data.map((a: any) => (
              <div key={a.id} className="card" style={{ padding: "16px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--bg-overlay)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Building2 size={18} style={{ color: "var(--text-muted)" }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{a.name}</div>
                      {a.industry && <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{a.industry}</div>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 2 }}>
                    <button className="btn btn-ghost btn-sm" style={{ padding: 5 }} onClick={() => openEdit(a)}><Edit size={13} /></button>
                    <button className="btn btn-ghost btn-sm" style={{ padding: 5, color: "#ef4444" }} onClick={() => { if (confirm("Delete account?")) delMut.mutate(a.id); }}><Trash2 size={13} /></button>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {a.size && <span className="badge badge-gray">{a.size} employees</span>}
                  {a.city && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{a.city}{a.country ? `, ${a.country}` : ""}</span>}
                </div>
              </div>
            ))
        }
      </div>
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Edit Account" : "New Account"}>
        <form onSubmit={save}>
          <div style={{ padding: "20px", display: "grid", gap: 12 }}>
            <FormRow label="Company name" required><input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required /></FormRow>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormRow label="Industry"><Select options={INDUSTRIES} placeholder="Select industry" value={form.industry} onChange={e => setForm(p => ({ ...p, industry: e.target.value }))} /></FormRow>
              <FormRow label="Company size"><Select options={SIZES} placeholder="Select size" value={form.size} onChange={e => setForm(p => ({ ...p, size: e.target.value }))} /></FormRow>
            </div>
            <FormRow label="Website"><input className="input" value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} placeholder="https://..." /></FormRow>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormRow label="Email"><input type="email" className="input" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></FormRow>
              <FormRow label="Phone"><input className="input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></FormRow>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormRow label="City"><input className="input" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} /></FormRow>
              <FormRow label="Country"><input className="input" value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} /></FormRow>
            </div>
          </div>
          <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : editing ? "Save" : "Add Account"}</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}

// ═══════════════════════════════════════════════════
// CAMPAIGNS
// ═══════════════════════════════════════════════════
const BLANK_CAMPAIGN = { name: "", subject: "", type: "email", status: "draft", content: "" };

export function CampaignsPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(BLANK_CAMPAIGN);
  const [saving, setSaving] = useState(false);

  const { data: campaigns, isLoading } = useQuery<any[]>({ queryKey: ["/api/campaigns"] });

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { await apiRequest("POST", "/api/campaigns", form); qc.invalidateQueries({ queryKey: ["/api/campaigns"] }); setModal(false); }
    finally { setSaving(false); }
  };

  return (
    <Layout title="Campaigns" subtitle={`${campaigns?.length ?? 0} campaigns`} actions={<button className="btn btn-primary btn-sm" onClick={() => { setForm(BLANK_CAMPAIGN); setModal(true); }}><Plus size={15} /> New Campaign</button>}>
      {isLoading ? <Loader /> : !campaigns?.length ? (
        <Empty icon={Megaphone} title="No campaigns yet" desc="Create email, SMS, or LinkedIn campaigns" action={<button className="btn btn-primary" onClick={() => setModal(true)}><Plus size={15} /> New Campaign</button>} />
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {campaigns.map((c: any) => (
            <div key={c.id} className="card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(59,130,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Megaphone size={18} style={{ color: "#3b82f6" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{c.name}</div>
                {c.subject && <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{c.subject}</div>}
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <Badge status={c.status} />
                <span className="badge badge-gray">{c.type}</span>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{new Date(c.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={modal} onClose={() => setModal(false)} title="New Campaign">
        <form onSubmit={save}>
          <div style={{ padding: "20px", display: "grid", gap: 12 }}>
            <FormRow label="Campaign name" required><input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required /></FormRow>
            <FormRow label="Subject line"><input className="input" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} /></FormRow>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormRow label="Type"><Select options={[{ value: "email", label: "Email" }, { value: "sms", label: "SMS" }, { value: "linkedin", label: "LinkedIn" }]} value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} /></FormRow>
              <FormRow label="Status"><Select options={[{ value: "draft", label: "Draft" }, { value: "scheduled", label: "Scheduled" }, { value: "sending", label: "Sending" }]} value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} /></FormRow>
            </div>
            <FormRow label="Content"><textarea className="input" value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={4} /></FormRow>
          </div>
          <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Creating..." : "Create Campaign"}</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}

// ═══════════════════════════════════════════════════
// INVOICES
// ═══════════════════════════════════════════════════
export function InvoicesPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ number: `INV-${Date.now().toString().slice(-6)}`, status: "draft", subtotal: "", tax: "", total: "", currency: "USD", notes: "" });
  const [saving, setSaving] = useState(false);

  const { data: invoices, isLoading } = useQuery<any[]>({ queryKey: ["/api/invoices"] });

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { await apiRequest("POST", "/api/invoices", form); qc.invalidateQueries({ queryKey: ["/api/invoices"] }); setModal(false); }
    finally { setSaving(false); }
  };

  return (
    <Layout title="Invoices" subtitle={`${invoices?.length ?? 0} invoices`} actions={<button className="btn btn-primary btn-sm" onClick={() => setModal(true)}><Plus size={15} /> New Invoice</button>}>
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 120px 120px 100px", padding: "10px 16px", borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
          {["Number", "Details", "Amount", "Status", "Date"].map(h => <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</span>)}
        </div>
        {isLoading ? <Loader /> : !invoices?.length ? <Empty icon={FileText} title="No invoices yet" action={<button className="btn btn-primary" onClick={() => setModal(true)}><Plus size={15} /> New Invoice</button>} /> :
          invoices.map((inv: any) => (
            <div key={inv.id} className="table-row" style={{ gridTemplateColumns: "120px 1fr 120px 120px 100px", gap: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "var(--brand-light)" }}>{inv.number}</div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{inv.notes || "No description"}</div>
              <div style={{ fontWeight: 700 }}>${Number(inv.total || 0).toLocaleString()}</div>
              <div><Badge status={inv.status} /></div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{new Date(inv.createdAt).toLocaleDateString()}</div>
            </div>
          ))
        }
      </div>
      <Modal open={modal} onClose={() => setModal(false)} title="New Invoice">
        <form onSubmit={save}>
          <div style={{ padding: "20px", display: "grid", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormRow label="Invoice number"><input className="input" value={form.number} onChange={e => setForm(p => ({ ...p, number: e.target.value }))} /></FormRow>
              <FormRow label="Currency"><Select options={[{ value: "USD", label: "USD" }, { value: "EUR", label: "EUR" }, { value: "XOF", label: "XOF (CFA)" }, { value: "GBP", label: "GBP" }]} value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))} /></FormRow>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <FormRow label="Subtotal"><input type="number" className="input" value={form.subtotal} onChange={e => setForm(p => ({ ...p, subtotal: e.target.value, total: String(Number(e.target.value) + Number(p.tax || 0)) }))} /></FormRow>
              <FormRow label="Tax"><input type="number" className="input" value={form.tax} onChange={e => setForm(p => ({ ...p, tax: e.target.value, total: String(Number(p.subtotal || 0) + Number(e.target.value)) }))} /></FormRow>
              <FormRow label="Total"><input type="number" className="input" value={form.total} readOnly style={{ opacity: 0.7 }} /></FormRow>
            </div>
            <FormRow label="Status"><Select options={[{ value: "draft", label: "Draft" }, { value: "sent", label: "Sent" }, { value: "paid", label: "Paid" }, { value: "overdue", label: "Overdue" }]} value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} /></FormRow>
            <FormRow label="Notes"><textarea className="input" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} /></FormRow>
          </div>
          <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Creating..." : "Create Invoice"}</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}

// ═══════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════
export function SettingsPage() {
  const { user, tenant, refreshUser } = useAuth();
  const [profile, setProfile] = useState({ firstName: user?.firstName || "", lastName: user?.lastName || "", email: user?.email || "" });
  const [workspace, setWorkspace] = useState({ name: tenant?.name || "", primaryColor: tenant?.primaryColor || "#3b82f6" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { await apiRequest("PUT", "/api/profile", profile); await refreshUser(); setSaved(true); setTimeout(() => setSaved(false), 2000); }
    finally { setSaving(false); }
  };
  const saveWorkspace = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { await apiRequest("PUT", "/api/settings", workspace); await refreshUser(); setSaved(true); setTimeout(() => setSaved(false), 2000); }
    finally { setSaving(false); }
  };

  return (
    <Layout title="Settings">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, maxWidth: 900 }}>
        <form onSubmit={saveProfile} className="card" style={{ padding: "24px" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700 }}>Profile</h3>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 20px" }}>Your personal account details</p>
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormRow label="First name"><input className="input" value={profile.firstName} onChange={e => setProfile(p => ({ ...p, firstName: e.target.value }))} /></FormRow>
              <FormRow label="Last name"><input className="input" value={profile.lastName} onChange={e => setProfile(p => ({ ...p, lastName: e.target.value }))} /></FormRow>
            </div>
            <FormRow label="Email"><input type="email" className="input" value={profile.email} readOnly style={{ opacity: 0.7 }} /></FormRow>
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: 20 }} disabled={saving}>
            {saved ? <><Check size={15} /> Saved!</> : saving ? "Saving..." : "Save Profile"}
          </button>
        </form>

        <form onSubmit={saveWorkspace} className="card" style={{ padding: "24px" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700 }}>Workspace</h3>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 20px" }}>Your organization settings</p>
          <div style={{ display: "grid", gap: 12 }}>
            <FormRow label="Company name"><input className="input" value={workspace.name} onChange={e => setWorkspace(p => ({ ...p, name: e.target.value }))} /></FormRow>
            <FormRow label="Brand color" hint="Used throughout the interface"><div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input type="color" value={workspace.primaryColor} onChange={e => setWorkspace(p => ({ ...p, primaryColor: e.target.value }))} style={{ width: 44, height: 36, borderRadius: 8, border: "1px solid var(--border)", cursor: "pointer", background: "none" }} />
              <input className="input" value={workspace.primaryColor} onChange={e => setWorkspace(p => ({ ...p, primaryColor: e.target.value }))} />
            </div></FormRow>
            <div className="card" style={{ padding: "12px 14px", background: "var(--bg-overlay)" }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Plan details</div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--text-secondary)" }}>
                <span>Current plan</span>
                <span style={{ fontWeight: 600, color: "var(--brand-light)", textTransform: "capitalize" }}>{tenant?.plan}</span>
              </div>
              {tenant?.trialEndsAt && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
                  <span>Trial ends</span>
                  <span>{new Date(tenant.trialEndsAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: 20 }} disabled={saving}>
            {saved ? <><Check size={15} /> Saved!</> : saving ? "Saving..." : "Save Settings"}
          </button>
        </form>
      </div>
    </Layout>
  );
}

// ═══════════════════════════════════════════════════
// TEAM
// ═══════════════════════════════════════════════════
export function TeamPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ email: "", firstName: "", lastName: "", role: "user", password: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const { data: members, isLoading } = useQuery<any[]>({ queryKey: ["/api/users"] });
  const canInvite = user?.role === "super_admin" || user?.role === "admin";

  const invite = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError("");
    try { await apiRequest("POST", "/api/auth/invite", form); qc.invalidateQueries({ queryKey: ["/api/users"] }); setModal(false); }
    catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  };

  const ROLE_COLORS: Record<string, string> = { platform_owner: "badge-amber", super_admin: "badge-purple", admin: "badge-blue", manager: "badge-green", user: "badge-gray", viewer: "badge-gray" };

  return (
    <Layout title="Team" subtitle={`${members?.length ?? 0} members`} actions={canInvite && <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}><Plus size={15} /> Invite Member</button>}>
      {isLoading ? <Loader /> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
          {(members || []).map((m: any) => (
            <div key={m.id} className="card" style={{ padding: "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <Avatar name={`${m.firstName} ${m.lastName}`} size={40} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{m.firstName} {m.lastName}</div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{m.email}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className={`badge ${ROLE_COLORS[m.role] || "badge-gray"}`}>{m.role.replace("_", " ")}</span>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{m.lastLoginAt ? `Last seen ${new Date(m.lastLoginAt).toLocaleDateString()}` : "Never logged in"}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={modal} onClose={() => setModal(false)} title="Invite Team Member">
        <form onSubmit={invite}>
          <div style={{ padding: "20px", display: "grid", gap: 12 }}>
            {error && <div style={{ background: "rgba(239,68,68,0.1)", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#f87171" }}>{error}</div>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormRow label="First name" required><input className="input" value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} required /></FormRow>
              <FormRow label="Last name"><input className="input" value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} /></FormRow>
            </div>
            <FormRow label="Email" required><input type="email" className="input" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required /></FormRow>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormRow label="Role"><Select options={[{ value: "admin", label: "Admin" }, { value: "manager", label: "Manager" }, { value: "user", label: "User" }, { value: "viewer", label: "Viewer" }]} value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} /></FormRow>
              <FormRow label="Temporary password" required><input type="password" className="input" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required minLength={8} /></FormRow>
            </div>
          </div>
          <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Inviting..." : "Invite Member"}</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}

// ═══════════════════════════════════════════════════
// NOT FOUND
// ═══════════════════════════════════════════════════
export function NotFoundPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "40px" }}>
      <div>
        <div style={{ fontSize: 80, marginBottom: 16 }}>404</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Page not found</h1>
        <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>The page you're looking for doesn't exist.</p>
        <Link href="/dashboard"><a className="btn btn-primary btn-lg"><Home size={16} /> Go to Dashboard</a></Link>
      </div>
    </div>
  );
}

export default TasksPage;
