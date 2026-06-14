import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "../lib/api";
import Layout from "../components/Layout";
import { Modal, FormRow, Select, Empty } from "../components/UI";
import { Database, Plus, Trash2, Box, Boxes, Columns3, Lock } from "lucide-react";

const FIELD_TYPES = ["text", "number", "currency", "boolean", "date", "datetime", "select", "multiselect", "email", "url", "phone", "relation", "json"];

export default function DataModelPage() {
  const { data: objects } = useQuery<any>({ queryKey: ["/api/metadata/objects"] });
  const [selected, setSelected] = useState<string | null>(null);
  const [showObj, setShowObj] = useState(false);
  const [showField, setShowField] = useState(false);
  const [err, setErr] = useState("");

  const [objForm, setObjForm] = useState({ labelSingular: "", labelPlural: "", description: "" });
  const [fieldForm, setFieldForm] = useState<any>({ name: "", label: "", type: "text", isRequired: false, isUnique: false });

  const all: any[] = objects?.all ?? [];
  const customDefs: any[] = objects?.custom ?? [];
  const activeKey = selected ?? all[0]?.key ?? null;

  const { data: fields } = useQuery<any>({ queryKey: [`/api/metadata/objects/${activeKey}/fields`], enabled: !!activeKey });

  const createObj = useMutation({
    mutationFn: (d: any) => apiRequest("POST", "/api/metadata/objects", d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/metadata/objects"] }); setShowObj(false); setErr(""); },
    onError: (e: any) => setErr(e.message || "Failed to create object"),
  });
  const deleteObj = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/metadata/objects/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/metadata/objects"] }),
  });
  const addField = useMutation({
    mutationFn: (d: any) => apiRequest("POST", `/api/metadata/objects/${activeKey}/fields`, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/metadata/objects/${activeKey}/fields`] }); setShowField(false); setErr(""); },
    onError: (e: any) => setErr(e.message || "Failed to add field"),
  });
  const deleteField = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/metadata/fields/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/metadata/objects/${activeKey}/fields`] }),
  });

  function submitObj() {
    // Derive machine names from the plural label.
    const base = objForm.labelSingular.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "object";
    const basePlural = objForm.labelPlural.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || base + "s";
    createObj.mutate({ ...objForm, nameSingular: base, namePlural: basePlural });
  }

  const customForActive = customDefs.find((o) => o.name_plural === activeKey || o.name_singular === activeKey);

  return (
    <Layout title="Data Model" subtitle="Define custom objects & fields — no code. Backed by real tables.">
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 16, alignItems: "start" }}>
        {/* Objects list */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)" }}>Objects</span>
            <button data-testid="button-create-object" onClick={() => { setObjForm({ labelSingular: "", labelPlural: "", description: "" }); setErr(""); setShowObj(true); }} title="New object" style={{ background: "var(--accent)", color: "#fff", border: "none", borderRadius: 7, padding: 5, cursor: "pointer", display: "flex" }}><Plus size={14} /></button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {all.map((o) => {
              const active = o.key === activeKey;
              return (
                <button key={o.key} data-testid={`object-${o.key}`} onClick={() => setSelected(o.key)} style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 10px", borderRadius: 8, cursor: "pointer", border: "none", textAlign: "left", background: active ? "var(--bg-overlay)" : "transparent", color: "var(--text-primary)" }}>
                  {o.isCustom ? <Boxes size={15} style={{ color: "var(--accent)" }} /> : <Box size={15} style={{ color: "var(--text-muted)" }} />}
                  <span style={{ fontSize: 13, fontWeight: active ? 600 : 500, textTransform: "capitalize" }}>{o.labelPlural || o.key}</span>
                  {!o.isCustom && <Lock size={11} style={{ marginLeft: "auto", color: "var(--text-muted)" }} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Fields */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Columns3 size={18} style={{ color: "var(--accent)" }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, textTransform: "capitalize" }}>{activeKey || "Select an object"} fields</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{customForActive ? "Custom object · real table" : "Built-in object · add custom fields"}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {customForActive && (
                <button data-testid="button-delete-object" onClick={() => { if (confirm(`Delete object "${activeKey}" and its data?`)) { deleteObj.mutate(customForActive.id); setSelected(null); } }} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 13 }}><Trash2 size={13} /> Delete object</button>
              )}
              <button data-testid="button-add-field" disabled={!activeKey} onClick={() => { setFieldForm({ name: "", label: "", type: "text", isRequired: false, isUnique: false }); setErr(""); setShowField(true); }} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 13, fontWeight: 600, opacity: activeKey ? 1 : 0.5 }}><Plus size={14} /> Add field</button>
            </div>
          </div>

          {!fields ? (
            <Empty icon={Database} title="No object selected" desc="Pick an object on the left." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {(fields.system ?? []).map((f: any) => (
                <div key={`sys-${f.name}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 11px", background: "var(--bg)", borderRadius: 8 }}>
                  <Lock size={12} style={{ color: "var(--text-muted)" }} />
                  <span style={{ fontSize: 13, fontFamily: "monospace" }}>{f.name}</span>
                  <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted)" }}>system</span>
                </div>
              ))}
              {(fields.custom ?? []).map((f: any) => (
                <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 11px", background: "var(--bg-overlay)", borderRadius: 8 }}>
                  <Columns3 size={12} style={{ color: "var(--accent)" }} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{f.label}</span>
                  <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "monospace" }}>{f.column_name} · {f.type}{f.is_required ? " · required" : ""}</span>
                  <button data-testid={`button-delete-field-${f.id}`} onClick={() => deleteField.mutate(f.id)} title="Delete field" style={{ marginLeft: "auto", background: "none", border: "1px solid var(--border)", borderRadius: 7, padding: 6, cursor: "pointer", color: "#f87171", display: "flex" }}><Trash2 size={12} /></button>
                </div>
              ))}
              {(fields.custom ?? []).length === 0 && (fields.system ?? []).length === 0 && (
                <Empty icon={Columns3} title="No fields yet" desc="Add your first field." />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create object modal */}
      <Modal open={showObj} onClose={() => setShowObj(false)} title="New custom object" width={480}>
        {err && <div style={{ color: "#f87171", fontSize: 12.5, marginBottom: 10 }}>{err}</div>}
        <FormRow label="Singular label" required><input data-testid="input-obj-singular" value={objForm.labelSingular} onChange={(e) => setObjForm({ ...objForm, labelSingular: e.target.value })} placeholder="e.g. Property" style={inp} /></FormRow>
        <FormRow label="Plural label" required><input data-testid="input-obj-plural" value={objForm.labelPlural} onChange={(e) => setObjForm({ ...objForm, labelPlural: e.target.value })} placeholder="e.g. Properties" style={inp} /></FormRow>
        <FormRow label="Description"><input value={objForm.description} onChange={(e) => setObjForm({ ...objForm, description: e.target.value })} placeholder="Optional" style={inp} /></FormRow>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
          <button onClick={() => setShowObj(false)} style={btnGhost}>Cancel</button>
          <button data-testid="button-submit-object" disabled={!objForm.labelSingular || !objForm.labelPlural || createObj.isPending} onClick={submitObj} style={{ ...btnPrimary, opacity: (!objForm.labelSingular || !objForm.labelPlural) ? 0.5 : 1 }}>{createObj.isPending ? "Creating…" : "Create object"}</button>
        </div>
      </Modal>

      {/* Add field modal */}
      <Modal open={showField} onClose={() => setShowField(false)} title={`Add field to ${activeKey}`} width={480}>
        {err && <div style={{ color: "#f87171", fontSize: 12.5, marginBottom: 10 }}>{err}</div>}
        <FormRow label="Field label" required><input data-testid="input-field-label" value={fieldForm.label} onChange={(e) => setFieldForm({ ...fieldForm, label: e.target.value, name: e.target.value })} placeholder="e.g. Square meters" style={inp} /></FormRow>
        <FormRow label="Type" required>
          <Select data-testid="select-field-type" value={fieldForm.type} onChange={(e: any) => setFieldForm({ ...fieldForm, type: e.target.value })} options={FIELD_TYPES.map((t) => ({ value: t, label: t }))} />
        </FormRow>
        <div style={{ display: "flex", gap: 16, margin: "4px 0 8px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, cursor: "pointer" }}><input type="checkbox" checked={fieldForm.isRequired} onChange={(e) => setFieldForm({ ...fieldForm, isRequired: e.target.checked })} /> Required</label>
          <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, cursor: "pointer" }}><input type="checkbox" checked={fieldForm.isUnique} onChange={(e) => setFieldForm({ ...fieldForm, isUnique: e.target.checked })} /> Unique</label>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
          <button onClick={() => setShowField(false)} style={btnGhost}>Cancel</button>
          <button data-testid="button-submit-field" disabled={!fieldForm.label || addField.isPending} onClick={() => addField.mutate(fieldForm)} style={{ ...btnPrimary, opacity: !fieldForm.label ? 0.5 : 1 }}>{addField.isPending ? "Adding…" : "Add field"}</button>
        </div>
      </Modal>
    </Layout>
  );
}

const inp: React.CSSProperties = { width: "100%", padding: "9px 11px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 13 };
const btnGhost: React.CSSProperties = { background: "var(--bg-overlay)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 14px", cursor: "pointer", color: "var(--text-primary)", fontSize: 13 };
const btnPrimary: React.CSSProperties = { background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600 };
