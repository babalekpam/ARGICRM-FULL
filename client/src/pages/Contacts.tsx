import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "../components/Layout";
import { Modal, FormRow, Select, Empty, Loader } from "../components/UI";
import { apiRequest } from "../lib/api";
import { useLanguage } from "../contexts/LanguageContext";
import {
  UserPlus, Search, Mail, Phone, Building2, Trash2, Edit,
  MapPin, Globe,
} from "lucide-react";

const STATUS_OPTIONS = [
  { value: "active",    label: "Active" },
  { value: "lead",      label: "Lead" },
  { value: "customer",  label: "Customer" },
  { value: "inactive",  label: "Inactive" },
  { value: "churned",   label: "Churned" },
  { value: "new",       label: "New" },
];

const SOURCE_OPTIONS = [
  { value: "website",       label: "Website" },
  { value: "referral",      label: "Referral" },
  { value: "cold_outreach", label: "Cold Outreach" },
  { value: "linkedin",      label: "LinkedIn" },
  { value: "conference",    label: "Conference" },
  { value: "ad",            label: "Advertisement" },
  { value: "other",         label: "Other" },
];

const BLANK = {
  firstName: "", lastName: "", email: "", phone: "",
  company: "", jobTitle: "", status: "active", source: "", notes: "",
};

function initials(firstName: string, lastName: string) {
  return `${(firstName || "?")[0]}${(lastName || "")[0] || ""}`.toUpperCase();
}

function avatarColor(name: string) {
  const colors = [
    "#6366f1","#8b5cf6","#ec4899","#f59e0b",
    "#10b981","#3b82f6","#ef4444","#14b8a6",
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active:    { bg: "rgba(16,185,129,0.12)",  text: "#34d399" },
  customer:  { bg: "rgba(59,130,246,0.12)",  text: "#60a5fa" },
  lead:      { bg: "rgba(139,92,246,0.12)",  text: "#a78bfa" },
  new:       { bg: "rgba(59,130,246,0.12)",  text: "#60a5fa" },
  inactive:  { bg: "rgba(156,163,175,0.15)", text: "#9ca3af" },
  churned:   { bg: "rgba(239,68,68,0.12)",   text: "#f87171" },
};

function StatusPill({ status }: { status: string }) {
  const s = STATUS_COLORS[status] || { bg: "rgba(156,163,175,0.15)", text: "#9ca3af" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "3px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 600, letterSpacing: "0.04em",
      background: s.bg, color: s.text, textTransform: "capitalize", whiteSpace: "nowrap",
    }}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export default function ContactsPage() {
  const qc = useQueryClient();
  const { t } = useLanguage();
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen]     = useState(false);
  const [editing, setEditing]         = useState<any>(null);
  const [form, setForm]               = useState(BLANK);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState("");

  const queryKey = `/api/contacts${search || statusFilter ? `?search=${search}&status=${statusFilter}` : ""}`;
  const { data, isLoading } = useQuery<{ data: any[]; total: number }>({ queryKey: [queryKey] });

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/contacts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/contacts"] }),
  });

  const openAdd = () => { setEditing(null); setForm(BLANK); setError(""); setModalOpen(true); };
  const openEdit = (c: any) => {
    setEditing(c);
    setForm({
      firstName: c.firstName || "", lastName: c.lastName || "",
      email: c.email || "", phone: c.phone || "",
      company: c.company || "", jobTitle: c.jobTitle || "",
      status: c.status || "active", source: c.source || "", notes: c.notes || "",
    });
    setError("");
    setModalOpen(true);
  };

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

  const contacts: any[] = data?.data || [];

  return (
    <Layout
      title={t("contacts_title")}
      subtitle={data ? `${data.total} ${t("total_contacts").toLowerCase()}` : undefined}
      actions={
        <button className="btn btn-primary btn-sm" onClick={openAdd} data-testid="btn-add-contact">
          <UserPlus size={15} /> {t("add_contact_btn")}
        </button>
      }
    >
      {/* Search + Filter Bar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
          <input
            className="input"
            placeholder={t("search_contacts")}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 36 }}
            data-testid="input-search-contacts"
          />
        </div>
        <select
          className="input"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ width: "auto", minWidth: 140 }}
          data-testid="select-status-filter"
        >
          <option value="">{t("all")}</option>
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Contact List */}
      <div className="card" style={{ overflow: "hidden", padding: 0 }}>

        {isLoading ? (
          <Loader />
        ) : !contacts.length ? (
          <Empty
            icon={UserPlus}
            title={t("no_contacts")}
            desc={t("no_contacts_desc")}
            action={
              <button className="btn btn-primary" onClick={openAdd}>
                <UserPlus size={15} /> {t("add_contact_btn")}
              </button>
            }
          />
        ) : (
          <>
            {/* Desktop header — hidden on mobile */}
            <div className="contacts-table-header">
              <span>Contact</span>
              <span>Company</span>
              <span>Reach</span>
              <span>Status</span>
              <span></span>
            </div>

            {contacts.map((c: any, i: number) => {
              const fullName  = `${c.firstName || ""} ${c.lastName || ""}`.trim() || c.company || "Unknown";
              const color     = avatarColor(fullName);
              const abbr      = initials(c.firstName || c.company || "?", c.lastName || "");
              const location  = [c.city, c.state, c.country].filter(Boolean).join(", ");

              return (
                <div
                  key={c.id}
                  className="contact-row"
                  data-testid={`contact-row-${c.id}`}
                  style={{ borderTop: i === 0 ? "none" : undefined }}
                >
                  {/* Avatar + Name + Title */}
                  <div className="contact-cell-identity">
                    <div style={{
                      width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                      background: color, display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff",
                    }}>
                      {abbr}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {fullName}
                      </div>
                      {c.jobTitle && (
                        <div style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {c.jobTitle}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Company + Location */}
                  <div className="contact-cell-company">
                    {c.company ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Building2 size={13} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {c.company}
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: "var(--text-muted)", fontSize: 13 }}>—</span>
                    )}
                    {location && (
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
                        <MapPin size={11} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {location}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Email + Phone */}
                  <div className="contact-cell-reach">
                    {c.email ? (
                      <a href={`mailto:${c.email}`} style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-secondary)", textDecoration: "none", fontSize: 13 }}>
                        <Mail size={13} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.email}</span>
                      </a>
                    ) : null}
                    {c.phone ? (
                      <a href={`tel:${c.phone}`} style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-secondary)", textDecoration: "none", fontSize: 13, marginTop: c.email ? 4 : 0 }}>
                        <Phone size={13} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.phone}</span>
                      </a>
                    ) : null}
                    {!c.email && !c.phone && (
                      <span style={{ color: "var(--text-muted)", fontSize: 13 }}>—</span>
                    )}
                  </div>

                  {/* Status */}
                  <div className="contact-cell-status">
                    <StatusPill status={c.status || "active"} />
                    {c.industry && (
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {c.industry}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="contact-cell-actions">
                    {c.website && (
                      <a
                        href={c.website.startsWith("http") ? c.website : `https://${c.website}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Website"
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 6, background: "var(--bg-elevated)", color: "var(--text-muted)", transition: "all 0.15s" }}
                        data-testid={`link-website-${c.id}`}
                      >
                        <Globe size={14} />
                      </a>
                    )}
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ padding: "5px 8px", display: "flex", alignItems: "center", gap: 5 }}
                      title="Edit"
                      onClick={() => openEdit(c)}
                      data-testid={`btn-edit-${c.id}`}
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ padding: "5px 8px", color: "#ef4444", display: "flex", alignItems: "center" }}
                      title="Delete"
                      onClick={() => { if (confirm(`Delete ${fullName}?`)) deleteMut.mutate(c.id); }}
                      data-testid={`btn-delete-${c.id}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t("edit_contact") : t("add_contact_btn")}>
        <form onSubmit={save}>
          <div style={{ padding: "20px", display: "grid", gap: 14 }}>
            {error && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#f87171" }}>
                {error}
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormRow label={t("first_name")} required>
                <input className="input" value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} required data-testid="input-first-name" />
              </FormRow>
              <FormRow label={t("last_name")}>
                <input className="input" value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} data-testid="input-last-name" />
              </FormRow>
            </div>
            <FormRow label={t("email")}>
              <input type="email" className="input" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} data-testid="input-email" />
            </FormRow>
            <FormRow label={t("phone")}>
              <input className="input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} data-testid="input-phone" />
            </FormRow>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormRow label={t("company")}>
                <input className="input" value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} data-testid="input-company" />
              </FormRow>
              <FormRow label={t("contact_position")}>
                <input className="input" value={form.jobTitle} onChange={e => setForm(p => ({ ...p, jobTitle: e.target.value }))} data-testid="input-job-title" />
              </FormRow>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormRow label={t("status")}>
                <Select options={STATUS_OPTIONS} value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} />
              </FormRow>
              <FormRow label={t("contact_source")}>
                <Select options={SOURCE_OPTIONS} placeholder={t("filter")} value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))} />
              </FormRow>
            </div>
            <FormRow label={t("notes")}>
              <textarea className="input" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3} style={{ resize: "vertical" }} data-testid="textarea-notes" />
            </FormRow>
          </div>
          <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>{t("cancel")}</button>
            <button type="submit" className="btn btn-primary" disabled={saving} data-testid="btn-save-contact">
              {saving
                ? <><span className="spinner" style={{ width: 14, height: 14 }} />{t("loading")}</>
                : editing ? t("save_changes") : t("add_contact_btn")
              }
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
