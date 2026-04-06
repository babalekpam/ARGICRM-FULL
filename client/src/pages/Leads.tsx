// ═══ LEADS PAGE ═══════════════════════════════════════════════════════
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "../components/Layout";
import { Modal, FormRow, Select, Empty, Badge, Avatar, Loader } from "../components/UI";
import { apiRequest } from "../lib/api";
import { useLanguage } from "../contexts/LanguageContext";
import { UserPlus, Trash2, Edit, UserCheck } from "lucide-react";

const LEAD_STATUS = [
  { value: "new", label: "New" }, { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" }, { value: "unqualified", label: "Unqualified" },
  { value: "converted", label: "Converted" },
];
const LEAD_SOURCE = [
  { value: "website", label: "Website" }, { value: "cold_email", label: "Cold Email" },
  { value: "linkedin", label: "LinkedIn" }, { value: "referral", label: "Referral" },
  { value: "ad", label: "Ad" }, { value: "conference", label: "Conference" },
  { value: "other", label: "Other" },
];
const BLANK_LEAD = { firstName: "", lastName: "", email: "", phone: "", company: "", jobTitle: "", status: "new", source: "", score: "50", estimatedValue: "", notes: "" };

function scoreColor(score: number) {
  if (score >= 70) return "#10b981";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}

export function LeadsPage() {
  const qc = useQueryClient();
  const { t } = useLanguage();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(BLANK_LEAD);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [converting, setConverting] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ data: any[]; total: number }>({ queryKey: ["/api/leads"] });
  const delMut = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/leads/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/leads"] }),
  });

  const openAdd = () => { setEditing(null); setForm(BLANK_LEAD); setError(""); setModal(true); };
  const openEdit = (l: any) => {
    setEditing(l);
    setForm({ firstName: l.firstName, lastName: l.lastName || "", email: l.email || "", phone: l.phone || "", company: l.company || "", jobTitle: l.jobTitle || "", status: l.status, source: l.source || "", score: String(l.score || 50), estimatedValue: l.estimatedValue || "", notes: l.notes || "" });
    setError(""); setModal(true);
  };

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

  const convertToContact = async (lead: any) => {
    const name = [lead.firstName, lead.lastName].filter(Boolean).join(" ");
    if (!confirm(`Convert "${name}" to a contact?`)) return;
    setConverting(lead.id);
    try {
      const result: any = await apiRequest("POST", `/api/leads/${lead.id}/convert`);
      qc.invalidateQueries({ queryKey: ["/api/leads"] });
      qc.invalidateQueries({ queryKey: ["/api/contacts"] });
      qc.invalidateQueries({ queryKey: ["/api/dashboard"] });
      alert(result.alreadyExisted ? "Lead marked as converted — contact already existed." : "Lead successfully converted to contact!");
    } catch (err: any) { alert(err.message || "Conversion failed"); }
    finally { setConverting(null); }
  };

  return (
    <Layout
      title={t("leads_title")}
      subtitle={data ? `${data.total} ${t("nav_leads").toLowerCase()}` : undefined}
      actions={<button className="btn btn-primary btn-sm" onClick={openAdd} data-testid="btn-add-lead"><UserPlus size={15} /> {t("add_lead_btn")}</button>}
    >
      <div className="card" style={{ overflow: "hidden" }}>
        {/* Desktop header */}
        <div className="leads-table-header">
          {[t("name"), t("company"), t("status"), t("lead_score"), t("actions")].map(h => (
            <span key={h}>{h}</span>
          ))}
        </div>

        {isLoading ? <Loader /> : !data?.data?.length ? (
          <Empty
            icon={UserPlus}
            title={t("no_leads")}
            desc={t("no_leads_desc")}
            action={<button className="btn btn-primary" onClick={openAdd}><UserPlus size={15} /> {t("add_lead_btn")}</button>}
          />
        ) : data.data.map((l: any) => {
          const displayName = [l.firstName, l.lastName].filter(Boolean).join(" ") || l.company || "—";
          const score = l.score || 0;

          return (
            <div key={l.id} className="lead-row" data-testid={`row-lead-${l.id}`}>

              {/* Identity */}
              <div className="lead-cell-identity">
                <Avatar name={displayName} size={36} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {displayName}
                  </div>
                  {l.jobTitle && (
                    <div style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {l.jobTitle}
                    </div>
                  )}
                  {l.email && !l.jobTitle && (
                    <div style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {l.email}
                    </div>
                  )}
                </div>
              </div>

              {/* Company + source */}
              <div className="lead-cell-company">
                <div style={{ color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {l.company || "—"}
                </div>
                {l.source && (
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, textTransform: "capitalize" }}>
                    {l.source.replace(/_/g, " ")}
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="lead-cell-status">
                <Badge status={l.status} />
              </div>

              {/* Score */}
              <div className="lead-cell-score">
                <div style={{ flex: 1, maxWidth: 80, height: 6, borderRadius: 3, background: "var(--bg-overlay)" }}>
                  <div style={{ width: `${score}%`, height: "100%", borderRadius: 3, background: scoreColor(score), transition: "width 0.3s" }} />
                </div>
                <span style={{ fontSize: 12, color: "var(--text-muted)", minWidth: 22, textAlign: "right" }}>{score}</span>
              </div>

              {/* Actions */}
              <div className="lead-cell-actions">
                {l.status !== "converted" && (
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ padding: 6, color: "#10b981" }}
                    title="Convert to Contact"
                    disabled={converting === l.id}
                    onClick={() => convertToContact(l)}
                    data-testid={`btn-convert-lead-${l.id}`}
                  >
                    <UserCheck size={14} />
                  </button>
                )}
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ padding: 6 }}
                  title="Edit"
                  onClick={() => openEdit(l)}
                  data-testid={`btn-edit-lead-${l.id}`}
                >
                  <Edit size={14} />
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ padding: 6, color: "#ef4444" }}
                  title="Delete"
                  onClick={() => { if (confirm("Delete lead?")) delMut.mutate(l.id); }}
                  data-testid={`btn-delete-lead-${l.id}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? t("edit_lead") : t("add_lead_btn")}>
        <form onSubmit={save}>
          <div style={{ padding: "20px", display: "grid", gap: 12 }}>
            {error && <div style={{ background: "rgba(239,68,68,0.1)", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#f87171" }}>{error}</div>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormRow label={t("first_name")} required><input className="input" value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} required /></FormRow>
              <FormRow label={t("last_name")}><input className="input" value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} /></FormRow>
            </div>
            <FormRow label={t("email")}><input type="email" className="input" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></FormRow>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormRow label={t("company")}><input className="input" value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} /></FormRow>
              <FormRow label={t("contact_position")}><input className="input" value={form.jobTitle} onChange={e => setForm(p => ({ ...p, jobTitle: e.target.value }))} /></FormRow>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <FormRow label={t("status")}><Select options={LEAD_STATUS} value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} /></FormRow>
              <FormRow label={t("contact_source")}><Select options={LEAD_SOURCE} placeholder={t("filter")} value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))} /></FormRow>
              <FormRow label={t("lead_score")}><input type="number" className="input" min={0} max={100} value={form.score} onChange={e => setForm(p => ({ ...p, score: e.target.value }))} /></FormRow>
            </div>
            <FormRow label={t("lead_value")}><input type="number" className="input" value={form.estimatedValue} onChange={e => setForm(p => ({ ...p, estimatedValue: e.target.value }))} /></FormRow>
            <FormRow label={t("notes")}><textarea className="input" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} /></FormRow>
          </div>
          <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>{t("cancel")}</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? t("loading") : editing ? t("save") : t("add_lead_btn")}</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
export { LeadsPage as default };
