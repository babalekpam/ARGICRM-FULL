import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "../components/Layout";
import { Modal, FormRow, Select, Empty, Badge, Loader } from "../components/UI";
import { toast, confirmDialog } from "../components/Toast";
import { apiRequest } from "../lib/api";
import { useShortcut } from "../lib/useShortcut";
import { useLanguage } from "../contexts/LanguageContext";
import { TrendingUp, Plus, Trash2, Edit, DollarSign } from "lucide-react";

const STAGES = [
  { id: "prospecting", name: "Prospecting", color: "#6366f1" },
  { id: "qualification", name: "Qualification", color: "#3b82f6" },
  { id: "proposal", name: "Proposal", color: "#f59e0b" },
  { id: "negotiation", name: "Negotiation", color: "#f97316" },
  { id: "closed_won", name: "Closed Won", color: "#10b981" },
  { id: "closed_lost", name: "Closed Lost", color: "#ef4444" },
];

const BLANK = { title: "", stage: "prospecting", value: "", probability: "25", notes: "" };

export default function DealsPage() {
  const qc = useQueryClient();
  const { t } = useLanguage();
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ data: any[]; pipeline: any[] }>({ queryKey: ["/api/deals"] });
  const delMut = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/deals/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/deals"] }); toast.success(t("deals_deleted", "Deal deleted.")); },
    onError: (err: any) => toast.error(err.message || t("deals_delete_failed", "Failed to delete deal")),
  });
  const updateStage = useMutation({
    mutationFn: ({ id, stage }: any) => apiRequest("PUT", `/api/deals/${id}`, { stage }),
    // Optimistic update: move the card immediately, roll back on failure
    onMutate: async ({ id, stage }: any) => {
      await qc.cancelQueries({ queryKey: ["/api/deals"] });
      const previous = qc.getQueryData<{ data: any[]; pipeline: any[] }>(["/api/deals"]);
      if (previous) {
        qc.setQueryData(["/api/deals"], { ...previous, data: previous.data.map(d => d.id === id ? { ...d, stage } : d) });
      }
      return { previous };
    },
    onError: (err: any, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(["/api/deals"], ctx.previous);
      toast.error(err.message || t("deals_move_failed", "Failed to move deal"));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["/api/deals"] }),
  });

  const openAdd = () => { setEditing(null); setForm(BLANK); setModal(true); };
  useShortcut("n", openAdd);
  const openEdit = (d: any) => { setEditing(d); setForm({ title: d.title, stage: d.stage, value: d.value || "", probability: String(d.probability || 25), notes: d.notes || "" }); setModal(true); };
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) await apiRequest("PUT", `/api/deals/${editing.id}`, form);
      else await apiRequest("POST", "/api/deals", form);
      qc.invalidateQueries({ queryKey: ["/api/deals"] }); qc.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setModal(false);
      toast.success(editing ? t("deals_updated", "Deal updated.") : t("deals_added", "Deal added."));
    } catch (err: any) {
      toast.error(err.message || t("deals_save_failed", "Failed to save deal"));
    } finally { setSaving(false); }
  };

  const deals = data?.data || [];
  const totalValue = deals.filter(d => !["closed_won", "closed_lost"].includes(d.stage)).reduce((s, d) => s + Number(d.value || 0), 0);
  const wonValue = deals.filter(d => d.stage === "closed_won").reduce((s, d) => s + Number(d.value || 0), 0);

  return (
    <Layout
      title={t("deals_title")}
      subtitle={`${deals.length} ${t("nav_deals").toLowerCase()} · $${totalValue.toLocaleString()} ${t("pipeline").toLowerCase()}`}
      actions={
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ display: "flex", background: "var(--bg-overlay)", borderRadius: 8, padding: 3, gap: 2 }}>
            {(["kanban", "list"] as const).map(v => (
              <button key={v} className={`btn btn-sm ${view === v ? "btn-primary" : "btn-ghost"}`} style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => setView(v)}>
                {v === "kanban" ? t("kanban") : t("view")}
              </button>
            ))}
          </div>
          <button className="btn btn-primary btn-sm" onClick={openAdd}><Plus size={15} /> {t("add_deal_btn")}</button>
        </div>
      }
    >
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
        {STAGES.slice(0, 4).map(stage => {
          const stageDeals = deals.filter(d => d.stage === stage.id);
          const stageValue = stageDeals.reduce((s, d) => s + Number(d.value || 0), 0);
          return (
            <div key={stage.id} className="card" style={{ padding: "12px 16px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: stage.color, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{stage.name}</div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{stageDeals.length}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>${stageValue.toLocaleString()}</div>
            </div>
          );
        })}
      </div>

      {isLoading ? <Loader /> : view === "kanban" ? (
        <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 12 }} className="no-scrollbar">
          {STAGES.map(stage => {
            const stageDeals = deals.filter(d => d.stage === stage.id);
            const isDropTarget = dragOverStage === stage.id && dragId != null;
            return (
              <div
                key={stage.id}
                style={{ minWidth: 240, width: 240, flexShrink: 0 }}
                onDragOver={e => { e.preventDefault(); setDragOverStage(stage.id); }}
                onDragLeave={() => setDragOverStage(s => (s === stage.id ? null : s))}
                onDrop={e => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData("text/deal-id") || dragId;
                  setDragOverStage(null); setDragId(null);
                  const deal = deals.find(d => d.id === id);
                  if (id && deal && deal.stage !== stage.id) updateStage.mutate({ id, stage: stage.id });
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: stage.color }} />
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{stage.name}</span>
                  </div>
                  <span className="badge badge-gray">{stageDeals.length}</span>
                </div>
                <div style={{
                  display: "flex", flexDirection: "column", gap: 8, minHeight: 100, borderRadius: 10,
                  outline: isDropTarget ? `2px dashed ${stage.color}` : "none", outlineOffset: 4,
                  background: isDropTarget ? `${stage.color}0d` : "transparent", transition: "background 0.15s",
                }}>
                  {stageDeals.map(d => (
                    <div
                      key={d.id}
                      className="card"
                      style={{ padding: "12px", cursor: "grab", opacity: dragId === d.id ? 0.4 : 1 }}
                      onClick={() => openEdit(d)}
                      draggable
                      onDragStart={e => { e.dataTransfer.setData("text/deal-id", d.id); e.dataTransfer.effectAllowed = "move"; setDragId(d.id); }}
                      onDragEnd={() => { setDragId(null); setDragOverStage(null); }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{d.title}</div>
                      {d.value && <div style={{ fontSize: 14, fontWeight: 700, color: stage.color }}>${Number(d.value).toLocaleString()}</div>}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{`${d.probability}% ${t("deals_prob_abbr", "prob.")}`}</span>
                        <button className="btn btn-ghost btn-sm" style={{ padding: 4, color: "#ef4444" }} aria-label={`${t("delete")} ${d.title}`} onClick={async e => { e.stopPropagation(); if (await confirmDialog({ title: t("deals_delete_confirm_title", "Delete deal?"), message: `${t("delete")} "${d.title}"? ${t("cannot_be_undone", "This cannot be undone.")}`, confirmLabel: t("delete"), danger: true })) delMut.mutate(d.id); }}><Trash2 size={12} /></button>
                      </div>
                    </div>
                  ))}
                  {stageDeals.length === 0 && (
                    <div style={{ padding: "20px", textAlign: "center", border: "2px dashed var(--border)", borderRadius: 10, color: "var(--text-muted)", fontSize: 13 }}>
                      {isDropTarget ? t("deals_drop_here", "Drop here") : t("no_deals", "No deals yet")}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card" style={{ overflow: "hidden" }}>
          <div className="deals-table-header">
            {[t("deals_col_deal", "Deal"), t("deal_stage", "Stage"), t("value", "Value"), t("deal_probability", "Probability"), t("actions", "Actions")].map(h => <span key={h}>{h}</span>)}
          </div>
          {deals.length === 0 ? <Empty icon={TrendingUp} title={t("no_deals", "No deals yet")} action={<button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> {t("add_deal_btn", "Add Deal")}</button>} /> :
            deals.map((d: any) => (
              <div key={d.id} className="deal-row">
                <div style={{ fontWeight: 600, fontSize: 14 }}>{d.title}</div>
                <div><Badge status={d.stage} /></div>
                <div style={{ fontWeight: 700, color: "var(--brand-light)" }}>${Number(d.value || 0).toLocaleString()}</div>
                <div style={{ fontSize: 13 }}>{d.probability}%</div>
                <div className="deal-cell-actions">
                  <button className="btn btn-ghost btn-sm" style={{ padding: 6 }} aria-label={`${t("edit")} ${d.title}`} onClick={() => openEdit(d)}><Edit size={14} /></button>
                  <button className="btn btn-ghost btn-sm" style={{ padding: 6, color: "#ef4444" }} aria-label={`${t("delete")} ${d.title}`} onClick={async () => { if (await confirmDialog({ title: t("deals_delete_confirm_title", "Delete deal?"), message: `${t("delete")} "${d.title}"? ${t("cannot_be_undone", "This cannot be undone.")}`, confirmLabel: t("delete"), danger: true })) delMut.mutate(d.id); }}><Trash2 size={14} /></button>
                </div>
              </div>
            ))
          }
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? t("edit_deal", "Edit Deal") : t("add_deal_btn")}>
        <form onSubmit={save}>
          <div style={{ padding: "20px", display: "grid", gap: 12 }}>
            <FormRow label={t("deal_name")} required><input className="input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required placeholder={t("deals_name_ph", "e.g. Enterprise License - Acme Corp")} /></FormRow>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormRow label={t("deal_stage")}><Select options={STAGES.map(s => ({ value: s.id, label: s.name }))} value={form.stage} onChange={e => setForm(p => ({ ...p, stage: e.target.value }))} /></FormRow>
              <FormRow label={t("deal_value")}><input type="number" className="input" value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} min={0} /></FormRow>
            </div>
            <FormRow label={t("deal_probability")}><input type="number" className="input" value={form.probability} onChange={e => setForm(p => ({ ...p, probability: e.target.value }))} min={0} max={100} /></FormRow>
            <FormRow label={t("notes")}><textarea className="input" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} /></FormRow>
          </div>
          <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>{t("cancel")}</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? t("loading") : editing ? t("save") : t("add_deal_btn")}</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
