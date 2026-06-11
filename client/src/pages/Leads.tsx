// ═══ LEADS PAGE ═══════════════════════════════════════════════════════
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "../components/Layout";
import { Modal, FormRow, Select, Empty, Badge, Avatar, Loader } from "../components/UI";
import { toast, confirmDialog } from "../components/Toast";
import { apiRequest } from "../lib/api";
import { useShortcut } from "../lib/useShortcut";
import { useLanguage } from "../contexts/LanguageContext";
import { UserPlus, Trash2, Edit, UserCheck, Search, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 50;

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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  // Debounce search so we don't refetch on every keystroke
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(id);
  }, [search]);

  // Reset to page 1 whenever search or filter changes
  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter]);

  const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String((page - 1) * PAGE_SIZE) });
  if (debouncedSearch) params.set("search", debouncedSearch);
  if (statusFilter) params.set("status", statusFilter);
  const queryKey = `/api/leads?${params.toString()}`;

  const { data, isLoading } = useQuery<{ data: any[]; total: number }>({ queryKey: [queryKey] });
  const totalPages = Math.max(1, Math.ceil((data?.total || 0) / PAGE_SIZE));

  const delMut = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/leads/${id}`),
    onSuccess: () => { qc.invalidateQueries({ predicate: q => String(q.queryKey[0]).startsWith("/api/leads") }); toast.success(t("leads_deleted", "Lead deleted.")); },
    onError: (err: any) => toast.error(err.message || t("leads_delete_failed", "Failed to delete lead")),
  });

  const openAdd = () => { setEditing(null); setForm(BLANK_LEAD); setError(""); setModal(true); };
  useShortcut("n", openAdd);
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
      qc.invalidateQueries({ predicate: q => String(q.queryKey[0]).startsWith("/api/leads") });
      qc.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setModal(false);
      toast.success(editing ? t("leads_updated", "Lead updated.") : t("leads_added", "Lead added."));
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  };

  const convertToContact = async (lead: any) => {
    const name = [lead.firstName, lead.lastName].filter(Boolean).join(" ");
    if (!(await confirmDialog({ title: t("leads_convert_confirm_title", "Convert to contact?"), message: `${t("convert", "Convert")} "${name}" ${t("leads_convert_suffix", "to a contact?")}`, confirmLabel: t("convert", "Convert") }))) return;
    setConverting(lead.id);
    try {
      const result: any = await apiRequest("POST", `/api/leads/${lead.id}/convert`);
      qc.invalidateQueries({ predicate: q => String(q.queryKey[0]).startsWith("/api/leads") || String(q.queryKey[0]).startsWith("/api/contacts") });
      qc.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast.success(result.alreadyExisted ? t("leads_convert_existing", "Lead marked as converted — contact already existed.") : t("leads_convert_success", "Lead successfully converted to contact!"));
    } catch (err: any) { toast.error(err.message || t("leads_convert_failed", "Conversion failed")); }
    finally { setConverting(null); }
  };

  return (
    <Layout
      title={t("leads_title")}
      subtitle={data ? `${data.total} ${t("nav_leads").toLowerCase()}` : undefined}
      actions={<button className="btn btn-primary btn-sm" onClick={openAdd} data-testid="btn-add-lead"><UserPlus size={15} /> {t("add_lead_btn")}</button>}
    >
      <div className="card" style={{ overflow: "hidden" }}>
        {/* Toolbar: search + status filter */}
        <div style={{ display: "flex", gap: 10, padding: "12px 16px", borderBottom: "1px solid var(--border)", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: "1 1 220px", maxWidth: 360 }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} aria-hidden="true" />
            <input
              className="input"
              style={{ paddingLeft: 32 }}
              placeholder={t("search") || "Search leads…"}
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label={t("search_leads", "Search leads…")}
              data-testid="input-search-leads"
            />
          </div>
          <Select
            options={LEAD_STATUS}
            placeholder={t("status") || "All statuses"}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            aria-label={t("filter_by_status", "Filter by status")}
            style={{ width: "auto", minWidth: 150 }}
            data-testid="select-filter-status"
          />
        </div>

        {/* Desktop header */}
        <div className="leads-table-header">
          {[t("name"), t("company"), t("status"), t("lead_score"), t("actions")].map(h => (
            <span key={h}>{h}</span>
          ))}
        </div>

        {isLoading ? <Loader /> : !data?.data?.length ? (
          debouncedSearch || statusFilter ? (
            <Empty
              icon={Search}
              title={t("leads_no_match", "No matching leads")}
              desc={t("leads_no_match_desc", "Try adjusting your search or filter.")}
              action={<button className="btn btn-secondary" onClick={() => { setSearch(""); setStatusFilter(""); }}>{t("clear_filters", "Clear filters")}</button>}
            />
          ) : (
          <Empty
            icon={UserPlus}
            title={t("no_leads")}
            desc={t("no_leads_desc")}
            action={<button className="btn btn-primary" onClick={openAdd}><UserPlus size={15} /> {t("add_lead_btn")}</button>}
          />
          )
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
                    title={t("convert_lead", "Convert to Contact")}
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
                  title={t("edit")}
                  onClick={() => openEdit(l)}
                  data-testid={`btn-edit-lead-${l.id}`}
                >
                  <Edit size={14} />
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ padding: 6, color: "#ef4444" }}
                  title={t("delete")}
                  onClick={async () => { if (await confirmDialog({ title: t("leads_delete_confirm_title", "Delete lead?"), message: `${t("delete")} "${displayName}"? ${t("cannot_be_undone", "This cannot be undone.")}`, confirmLabel: t("delete"), danger: true })) delMut.mutate(l.id); }}
                  data-testid={`btn-delete-lead-${l.id}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}

        {/* Pagination */}
        {(data?.total || 0) > PAGE_SIZE && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderTop: "1px solid var(--border)", flexWrap: "wrap", gap: 10 }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {`${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, data!.total)} ${t("of", "of")} ${data!.total}`}
            </span>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)} aria-label={t("previous")} data-testid="btn-leads-page-prev">
                <ChevronLeft size={14} />
              </button>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{page} / {totalPages}</span>
              <button className="btn btn-ghost btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} aria-label={t("next")} data-testid="btn-leads-page-next">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
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
