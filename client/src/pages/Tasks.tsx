import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "../components/Layout";
import { Modal, FormRow, Select, Badge, Loader } from "../components/UI";
import { confirmDialog } from "../components/Toast";
import { apiRequest } from "../lib/api";
import { useLanguage } from "../contexts/LanguageContext";
import { useShortcut } from "../lib/useShortcut";
import { Plus, Trash2, Edit, Check, AlertCircle } from "lucide-react";

const BLANK_TASK = { title: "", description: "", status: "todo", priority: "medium", dueDate: "" };

export function TasksPage() {
  const qc = useQueryClient();
  const { t } = useLanguage();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(BLANK_TASK);
  const [saving, setSaving] = useState(false);

  const TASK_STATUS = [
    { value: "todo", label: t("tasks_col_todo", "To Do") },
    { value: "in_progress", label: t("tasks_col_in_progress", "In Progress") },
    { value: "done", label: t("tasks_col_done", "Done") },
    { value: "cancelled", label: t("status_cancelled", "Cancelled") },
  ];
  const TASK_PRIORITY = [
    { value: "low", label: t("priority_low", "Low") },
    { value: "medium", label: t("priority_medium", "Medium") },
    { value: "high", label: t("priority_high", "High") },
    { value: "urgent", label: t("priority_urgent", "Urgent") },
  ];

  const { data: tasks, isLoading } = useQuery<any[]>({ queryKey: ["/api/tasks"] });
  const delMut = useMutation({ mutationFn: (id: string) => apiRequest("DELETE", `/api/tasks/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/tasks"] }) });
  const toggleMut = useMutation({ mutationFn: ({ id, status }: any) => apiRequest("PUT", `/api/tasks/${id}`, { status }), onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/tasks"] }) });

  const openAdd = () => { setEditing(null); setForm(BLANK_TASK); setModal(true); };
  useShortcut("n", openAdd);
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

  const TaskCard = ({ task }: { task: any }) => {
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";
    return (
      <div className="card" style={{ padding: "12px 14px", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <button
            className="btn btn-ghost btn-sm"
            style={{ padding: 2, marginTop: 2, flexShrink: 0, color: task.status === "done" ? "#10b981" : "var(--text-muted)" }}
            aria-label={task.status === "done" ? t("tasks_mark_open", "Mark as to do") : t("tasks_mark_done", "Mark as done")}
            onClick={() => toggleMut.mutate({ id: task.id, status: task.status === "done" ? "todo" : "done" })}
          >
            <Check size={16} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, textDecoration: task.status === "done" ? "line-through" : "none", color: task.status === "done" ? "var(--text-muted)" : "var(--text-primary)" }}>{task.title}</div>
            {task.description && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{task.description}</div>}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
              <Badge status={task.priority} />
              {task.dueDate && (
                <span style={{ fontSize: 11, color: isOverdue ? "#ef4444" : "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                  {isOverdue && <AlertCircle size={11} />}
                  {new Date(task.dueDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
            <button className="btn btn-ghost btn-sm" style={{ padding: 4 }} aria-label={t("edit", "Edit")} onClick={() => openEdit(task)}><Edit size={13} /></button>
            <button className="btn btn-ghost btn-sm" style={{ padding: 4, color: "#ef4444" }} aria-label={t("delete", "Delete")} onClick={async () => { if (await confirmDialog({ title: t("tasks_delete_confirm_title", "Delete task?"), message: `${t("delete", "Delete")} "${task.title}"? ${t("cannot_be_undone", "This cannot be undone.")}`, confirmLabel: t("delete", "Delete"), danger: true })) delMut.mutate(task.id); }}><Trash2 size={13} /></button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout title={t("tasks_title")} subtitle={`${tasks?.length ?? 0} ${t("nav_tasks").toLowerCase()}`} actions={<button className="btn btn-primary btn-sm" onClick={openAdd} title={t("shortcut_new_hint", "Shortcut: N")}><Plus size={15} /> {t("add_task_btn")}</button>}>
      {isLoading ? <Loader /> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          {[
            { key: "todo", label: t("tasks_col_todo", "To Do"), color: "#64748b" },
            { key: "in_progress", label: t("tasks_col_in_progress", "In Progress"), color: "#3b82f6" },
            { key: "done", label: t("tasks_col_done", "Done"), color: "#10b981" },
          ].map(col => (
            <div key={col.key}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: col.color }} />
                <span style={{ fontSize: 13, fontWeight: 700 }}>{col.label}</span>
                <span className="badge badge-gray">{(grouped as any)[col.key].length}</span>
              </div>
              {(grouped as any)[col.key].map((task: any) => <TaskCard key={task.id} task={task} />)}
            </div>
          ))}
        </div>
      )}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? `${t("edit")} — ${t("task_title")}` : t("add_task_btn")}>
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

export default TasksPage;
