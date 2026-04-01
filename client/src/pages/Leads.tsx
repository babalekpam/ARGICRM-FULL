// ═══ LEADS PAGE ═══════════════════════════════════════════════════════
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "../components/Layout";
import { Modal, FormRow, Select, Empty, Badge, Avatar, Loader } from "../components/UI";
import { apiRequest } from "../lib/api";
import { UserPlus, Trash2, Edit, TrendingUp } from "lucide-react";

const LEAD_STATUS = [
  { value: "new", label: "New" }, { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" }, { value: "unqualified", label: "Unqualified" },
  { value: "converted", label: "Converted" },
];
const LEAD_SOURCE = [
  { value: "website", label: "Website" }, { value: "cold_email", label: "Cold Email" },
  { value: "linkedin", label: "LinkedIn" }, { value: "referral", label: "Referral" },
  { value: "ad", label: "Ad" }, { value: "conference", label: "Conference" },
];
const BLANK_LEAD = { firstName: "", lastName: "", email: "", phone: "", company: "", jobTitle: "", status: "new", source: "", score: "50", estimatedValue: "", notes: "" };

export function LeadsPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(BLANK_LEAD);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const { data, isLoading } = useQuery<{ data: any[]; total: number }>({ queryKey: ["/api/leads"] });
  const delMut = useMutation({ mutationFn: (id: string) => apiRequest("DELETE", `/api/leads/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/leads"] }) });

  const openAdd = () => { setEditing(null); setForm(BLANK_LEAD); setError(""); setModal(true); };
  const openEdit = (l: any) => { setEditing(l); setForm({ firstName: l.firstName, lastName: l.lastName || "", email: l.email || "", phone: l.phone || "", company: l.company || "", jobTitle: l.jobTitle || "", status: l.status, source: l.source || "", score: String(l.score || 50), estimatedValue: l.estimatedValue || "", notes: l.notes || "" }); setError(""); setModal(true); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      if (editing) await apiRequest("PUT", `/api/leads/${editing.id}`, form);
      else await apiRequest("POST", "/api/leads", form);
      qc.invalidateQueries({ queryKey: ["/api/leads"] });
      qc.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setModal(false);
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <Layout title="Leads" subtitle={data ? `${data.total} leads` : undefined} actions={<button className="btn btn-primary btn-sm" onClick={openAdd}><UserPlus size={15} /> Add Lead</button>}>
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 180px 120px 90px 90px", padding: "10px 16px", borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
          {["Lead", "Company / Source", "Status", "Score", "Actions"].map(h => <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</span>)}
        </div>
        {isLoading ? <Loader /> : !data?.data?.length ? (
          <Empty icon={UserPlus} title="No leads yet" desc="Add your first lead to start filling your pipeline" action={<button className="btn btn-primary" onClick={openAdd}><UserPlus size={15} /> Add Lead</button>} />
        ) : data.data.map((l: any) => (
          <div key={l.id} className="table-row" style={{ gridTemplateColumns: "1fr 180px 120px 90px 90px", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Avatar name={`${l.firstName} ${l.lastName}`} size={32} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{l.firstName} {l.lastName}</div>
                {l.email && <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{l.email}</div>}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>{l.company || "—"}</div>
              {l.source && <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{l.source}</div>}
            </div>
            <div><Badge status={l.status} /></div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 50, height: 6, borderRadius: 3, background: "var(--bg-overlay)" }}>
                  <div style={{ width: `${l.score || 0}%`, height: "100%", borderRadius: 3, background: l.score >= 70 ? "#10b981" : l.score >= 40 ? "#f59e0b" : "#ef4444" }} />
                </div>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{l.score}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <button className="btn btn-ghost btn-sm" style={{ padding: 6 }} onClick={() => openEdit(l)}><Edit size={14} /></button>
              <button className="btn btn-ghost btn-sm" style={{ padding: 6, color: "#ef4444" }} onClick={() => { if (confirm("Delete lead?")) delMut.mutate(l.id); }}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Edit Lead" : "Add Lead"}>
        <form onSubmit={save}>
          <div style={{ padding: "20px", display: "grid", gap: 12 }}>
            {error && <div style={{ background: "rgba(239,68,68,0.1)", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#f87171" }}>{error}</div>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormRow label="First name" required><input className="input" value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} required /></FormRow>
              <FormRow label="Last name"><input className="input" value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} /></FormRow>
            </div>
            <FormRow label="Email"><input type="email" className="input" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></FormRow>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormRow label="Company"><input className="input" value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} /></FormRow>
              <FormRow label="Job title"><input className="input" value={form.jobTitle} onChange={e => setForm(p => ({ ...p, jobTitle: e.target.value }))} /></FormRow>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <FormRow label="Status"><Select options={LEAD_STATUS} value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} /></FormRow>
              <FormRow label="Source"><Select options={LEAD_SOURCE} placeholder="Select" value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))} /></FormRow>
              <FormRow label="Score (0-100)"><input type="number" className="input" min={0} max={100} value={form.score} onChange={e => setForm(p => ({ ...p, score: e.target.value }))} /></FormRow>
            </div>
            <FormRow label="Est. Value ($)"><input type="number" className="input" value={form.estimatedValue} onChange={e => setForm(p => ({ ...p, estimatedValue: e.target.value }))} /></FormRow>
            <FormRow label="Notes"><textarea className="input" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} /></FormRow>
          </div>
          <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : editing ? "Save" : "Add Lead"}</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
export { LeadsPage as default };
