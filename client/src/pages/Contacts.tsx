import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "../components/Layout";
import { Modal, FormRow, Select, Empty, Avatar, Badge, Loader } from "../components/UI";
import { apiRequest } from "../lib/api";
import { UserPlus, Search, Filter, Trash2, Edit, Phone, Mail, Building2, ExternalLink } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "lead", label: "Lead" },
  { value: "customer", label: "Customer" },
  { value: "inactive", label: "Inactive" },
  { value: "churned", label: "Churned" },
];

const SOURCE_OPTIONS = [
  { value: "website", label: "Website" },
  { value: "referral", label: "Referral" },
  { value: "cold_outreach", label: "Cold Outreach" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "conference", label: "Conference" },
  { value: "ad", label: "Advertisement" },
  { value: "other", label: "Other" },
];

const BLANK = { firstName: "", lastName: "", email: "", phone: "", company: "", jobTitle: "", status: "active", source: "", notes: "" };

export default function ContactsPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const queryKey = `/api/contacts${search || statusFilter ? `?search=${search}&status=${statusFilter}` : ""}`;
  const { data, isLoading } = useQuery<{ data: any[]; total: number }>({ queryKey: [queryKey] });

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/contacts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/contacts"] }),
  });

  const openAdd = () => { setEditing(null); setForm(BLANK); setError(""); setModalOpen(true); };
  const openEdit = (c: any) => { setEditing(c); setForm({ firstName: c.firstName, lastName: c.lastName || "", email: c.email || "", phone: c.phone || "", company: c.company || "", jobTitle: c.jobTitle || "", status: c.status, source: c.source || "", notes: c.notes || "" }); setError(""); setModalOpen(true); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim()) return setError("First name is required");
    setSaving(true); setError("");
    try {
      if (editing) {
        await apiRequest("PUT", `/api/contacts/${editing.id}`, form);
      } else {
        await apiRequest("POST", "/api/contacts", form);
      }
      qc.invalidateQueries({ queryKey: ["/api/contacts"] });
      qc.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setModalOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout
      title="Contacts"
      subtitle={data ? `${data.total} total contacts` : undefined}
      actions={<button className="btn btn-primary btn-sm" onClick={openAdd}><UserPlus size={15} /> Add Contact</button>}
    >
      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
          <input
            className="input"
            placeholder="Search contacts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 36 }}
          />
        </div>
        <select className="input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: "auto", minWidth: 140 }}>
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 200px 180px 120px 100px", padding: "10px 16px", borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
          {["Contact", "Company", "Contact Info", "Status", "Actions"].map(h => (
            <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</span>
          ))}
        </div>

        {isLoading ? (
          <Loader />
        ) : !data?.data?.length ? (
          <Empty icon={UserPlus} title="No contacts yet" desc="Add your first contact to get started" action={<button className="btn btn-primary" onClick={openAdd}><UserPlus size={15} /> Add Contact</button>} />
        ) : (
          data.data.map((c: any) => (
            <div key={c.id} className="table-row" style={{ gridTemplateColumns: "1fr 200px 180px 120px 100px", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar name={`${c.firstName} ${c.lastName}`} size={34} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>{c.firstName} {c.lastName}</div>
                  {c.jobTitle && <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{c.jobTitle}</div>}
                </div>
              </div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>{c.company || "—"}</div>
              <div>
                {c.email && <div style={{ fontSize: 12, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 4 }}><Mail size={12} />{c.email}</div>}
                {c.phone && <div style={{ fontSize: 12, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 4 }}><Phone size={12} />{c.phone}</div>}
              </div>
              <div><Badge status={c.status} /></div>
              <div style={{ display: "flex", gap: 4 }}>
                <button className="btn btn-ghost btn-sm" style={{ padding: 6 }} title="Edit" onClick={() => openEdit(c)}><Edit size={14} /></button>
                <button className="btn btn-ghost btn-sm" style={{ padding: 6, color: "#ef4444" }} title="Delete" onClick={() => { if (confirm(`Delete ${c.firstName}?`)) deleteMut.mutate(c.id); }}><Trash2 size={14} /></button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Contact" : "Add Contact"}>
        <form onSubmit={save}>
          <div style={{ padding: "20px", display: "grid", gap: 14 }}>
            {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#f87171" }}>{error}</div>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormRow label="First name" required><input className="input" value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} required /></FormRow>
              <FormRow label="Last name"><input className="input" value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} /></FormRow>
            </div>
            <FormRow label="Email"><input type="email" className="input" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></FormRow>
            <FormRow label="Phone"><input className="input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></FormRow>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormRow label="Company"><input className="input" value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} /></FormRow>
              <FormRow label="Job title"><input className="input" value={form.jobTitle} onChange={e => setForm(p => ({ ...p, jobTitle: e.target.value }))} /></FormRow>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormRow label="Status"><Select options={STATUS_OPTIONS} value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} /></FormRow>
              <FormRow label="Source"><Select options={SOURCE_OPTIONS} placeholder="Select source" value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))} /></FormRow>
            </div>
            <FormRow label="Notes"><textarea className="input" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3} style={{ resize: "vertical" }} /></FormRow>
          </div>
          <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} />Saving...</> : editing ? "Save changes" : "Add Contact"}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
