import React, { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "../components/Layout";
import { apiRequest } from "../lib/api";
import { FileText, Plus, Send, Eye, CheckCircle, XCircle, Clock, Trash2, Copy, Check, Edit2, ChevronDown, ChevronRight, AlertCircle } from "lucide-react";

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  draft:    { label: "Draft",    color: "#64748b", bg: "rgba(100,116,139,0.12)", icon: <Edit2 size={12} /> },
  sent:     { label: "Sent",     color: "#3b82f6", bg: "rgba(59,130,246,0.12)",  icon: <Send size={12} /> },
  viewed:   { label: "Viewed",   color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  icon: <Eye size={12} /> },
  signed:   { label: "Signed",   color: "#10b981", bg: "rgba(16,185,129,0.12)", icon: <CheckCircle size={12} /> },
  declined: { label: "Declined", color: "#ef4444", bg: "rgba(239,68,68,0.12)",  icon: <XCircle size={12} /> },
  expired:  { label: "Expired",  color: "#64748b", bg: "rgba(100,116,139,0.12)", icon: <Clock size={12} /> },
};

const STARTER_TEMPLATES = [
  {
    name: "Service Agreement",
    description: "Standard services contract for client engagements",
    body: `SERVICE AGREEMENT

This Service Agreement ("Agreement") is entered into as of {{date}} between {{company_name}} ("Client") and {{provider_name}} ("Provider").

1. SERVICES
Provider agrees to perform the following services: {{services_description}}

2. COMPENSATION
Client agrees to pay Provider {{amount}} {{payment_terms}}.

3. TERM
This Agreement begins on {{start_date}} and continues until {{end_date}}, unless earlier terminated.

4. CONFIDENTIALITY
Each party agrees to keep the other party's Confidential Information strictly confidential.

5. INTELLECTUAL PROPERTY
All work product created under this Agreement shall be the property of the Client upon full payment.

6. TERMINATION
Either party may terminate this Agreement with {{notice_days}} days written notice.

7. GOVERNING LAW
This Agreement shall be governed by the laws of {{jurisdiction}}.

IN WITNESS WHEREOF, the parties have executed this Agreement.

Client: {{client_name}}
Date: {{date}}

Provider: {{provider_name}}
Date: {{date}}`,
    variables: ["date", "company_name", "provider_name", "services_description", "amount", "payment_terms", "start_date", "end_date", "notice_days", "jurisdiction", "client_name"],
  },
  {
    name: "NDA — Non-Disclosure Agreement",
    description: "Mutual confidentiality agreement for business discussions",
    body: `NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement ("Agreement") is made on {{date}} between {{party_a}} and {{party_b}} (collectively, the "Parties").

1. PURPOSE
The Parties wish to explore a potential business relationship concerning {{purpose}}.

2. CONFIDENTIAL INFORMATION
"Confidential Information" means any non-public information disclosed by either Party.

3. OBLIGATIONS
Each Party agrees to: (a) hold all Confidential Information in strict confidence; (b) not disclose it to third parties without prior written consent; (c) use it solely for the Purpose stated above.

4. EXCLUSIONS
These obligations do not apply to information that: (a) is or becomes publicly known through no breach; (b) was independently developed; (c) is required by law to be disclosed.

5. TERM
This Agreement remains in effect for {{term_years}} years from the date signed.

6. GOVERNING LAW
This Agreement is governed by the laws of {{jurisdiction}}.

Agreed and accepted:

{{party_a_name}} ({{party_a}})
Signature: ___________________________   Date: {{date}}

{{party_b_name}} ({{party_b}})
Signature: ___________________________   Date: {{date}}`,
    variables: ["date", "party_a", "party_b", "purpose", "term_years", "jurisdiction", "party_a_name", "party_b_name"],
  },
  {
    name: "Proposal Acceptance",
    description: "Simple letter of acceptance for a proposal or quote",
    body: `PROPOSAL ACCEPTANCE

Date: {{date}}

To: {{provider_name}}
From: {{client_name}} ({{company_name}})

Re: Acceptance of Proposal — {{proposal_title}}

Dear {{provider_contact}},

We are pleased to accept your proposal dated {{proposal_date}} for {{proposal_title}}.

Project scope: {{scope_summary}}
Total value: {{amount}}
Start date: {{start_date}}

By signing below, {{client_name}} confirms acceptance of all terms and conditions outlined in the proposal.

Authorized Signature: ___________________________
Name: {{client_name}}
Title: {{client_title}}
Date: {{date}}`,
    variables: ["date", "provider_name", "client_name", "company_name", "proposal_title", "proposal_date", "provider_contact", "scope_summary", "amount", "start_date", "client_title"],
  },
];

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] || STATUS_META.draft;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: m.bg, color: m.color }}>
      {m.icon} {m.label}
    </span>
  );
}

function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button onClick={copy} className="btn btn-ghost btn-sm" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }} title="Copy signing link">
      {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? "Copied" : "Copy link"}
    </button>
  );
}

export default function ContractsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"contracts" | "templates">("contracts");
  const [showNew, setShowNew] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sending, setSending] = useState<string | null>(null);
  const [sendResult, setSendResult] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "", contactName: "", contactEmail: "", templateId: "", notes: "",
    body: "", variables: {} as Record<string, string>,
  });
  const [tplForm, setTplForm] = useState({ name: "", description: "", body: "", variables: "" });
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [varValues, setVarValues] = useState<Record<string, string>>({});

  const { data: contracts = [] } = useQuery<any[]>({ queryKey: ["/api/contracts"] });
  const { data: templates = [] } = useQuery<any[]>({ queryKey: ["/api/contracts/templates"] });

  const allTemplates = [...STARTER_TEMPLATES.map((t, i) => ({ ...t, id: `starter-${i}`, isStarter: true })), ...(templates as any[])];

  const selectTemplate = (tpl: any) => {
    setSelectedTemplate(tpl);
    const vars: Record<string, string> = {};
    (tpl.variables || []).forEach((v: string) => { vars[v] = ""; });
    setVarValues(vars);
    setForm(f => ({ ...f, templateId: tpl.isStarter ? "" : tpl.id, body: tpl.body }));
  };

  const buildBody = () => {
    if (!selectedTemplate) return form.body;
    return (selectedTemplate.body || form.body).replace(/\{\{(\w+)\}\}/g, (_: string, k: string) => varValues[k] || `{{${k}}}`);
  };

  const submitContract = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiRequest("POST", "/api/contracts", {
        title: form.title,
        contactName: form.contactName,
        contactEmail: form.contactEmail,
        templateId: form.templateId || null,
        body: buildBody(),
        variables: varValues,
        notes: form.notes,
      });
      qc.invalidateQueries({ queryKey: ["/api/contracts"] });
      setShowNew(false);
      setForm({ title: "", contactName: "", contactEmail: "", templateId: "", notes: "", body: "", variables: {} });
      setSelectedTemplate(null);
      setVarValues({});
    } catch (err: any) {
      setError(err.message || "Failed to create contract");
    }
  };

  const sendContract = async (id: string) => {
    setSending(id);
    try {
      const result = await apiRequest<any>("POST", `/api/contracts/${id}/send`);
      setSendResult(r => ({ ...r, [id]: result.signLink }));
      qc.invalidateQueries({ queryKey: ["/api/contracts"] });
    } catch (err: any) {
      setError(err.message || "Failed to send contract");
    } finally {
      setSending(null);
    }
  };

  const deleteContract = async (id: string) => {
    if (!confirm("Delete this contract?")) return;
    await apiRequest("DELETE", `/api/contracts/${id}`);
    qc.invalidateQueries({ queryKey: ["/api/contracts"] });
  };

  const saveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: tplForm.name,
      description: tplForm.description,
      body: tplForm.body,
      variables: tplForm.variables.split(",").map(v => v.trim()).filter(Boolean),
    };
    if (editingTemplate) {
      await apiRequest("PUT", `/api/contracts/templates/${editingTemplate.id}`, payload);
    } else {
      await apiRequest("POST", "/api/contracts/templates", payload);
    }
    qc.invalidateQueries({ queryKey: ["/api/contracts/templates"] });
    setShowTemplateEditor(false);
    setEditingTemplate(null);
    setTplForm({ name: "", description: "", body: "", variables: "" });
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    await apiRequest("DELETE", `/api/contracts/templates/${id}`);
    qc.invalidateQueries({ queryKey: ["/api/contracts/templates"] });
  };

  return (
    <Layout
      title="Contracts"
      subtitle="Prepare, send, and collect e-signatures from prospects"
      actions={
        <div style={{ display: "flex", gap: 8 }}>
          {tab === "templates" && (
            <button className="btn btn-secondary btn-sm" onClick={() => { setEditingTemplate(null); setTplForm({ name: "", description: "", body: "", variables: "" }); setShowTemplateEditor(true); }}>
              <Plus size={14} /> New Template
            </button>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}>
            <Plus size={14} /> New Contract
          </button>
        </div>
      }
    >
      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>
          <AlertCircle size={15} style={{ color: "#ef4444", flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: "#ef4444", flex: 1 }}>{error}</span>
          <button onClick={() => setError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}>×</button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
        {(["contracts", "templates"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`btn btn-sm ${tab === t ? "btn-primary" : "btn-secondary"}`} style={{ textTransform: "capitalize" }}>
            {t === "contracts" ? <><FileText size={13} /> Contracts</> : <><Edit2 size={13} /> Templates</>}
          </button>
        ))}
      </div>

      {/* ── CONTRACTS LIST ── */}
      {tab === "contracts" && (
        <div>
          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 20 }}>
            {(["draft", "sent", "viewed", "signed", "declined"] as const).map(s => {
              const count = (contracts as any[]).filter(c => c.status === s).length;
              const m = STATUS_META[s];
              return (
                <div key={s} className="card" style={{ padding: "12px 14px", textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: m.color }}>{count}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginTop: 2 }}>{m.label}</div>
                </div>
              );
            })}
          </div>

          {(contracts as any[]).length === 0 ? (
            <div className="card" style={{ padding: 60, textAlign: "center" }}>
              <FileText size={40} style={{ color: "var(--text-muted)", marginBottom: 16 }} />
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No contracts yet</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>Create your first contract and send it to a prospect for e-signature</div>
              <button className="btn btn-primary" onClick={() => setShowNew(true)}><Plus size={14} /> New Contract</button>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {(contracts as any[]).map((c: any) => (
                <div key={c.id} className="card" style={{ padding: 0, overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", cursor: "pointer" }} onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{c.title}</span>
                        <StatusBadge status={c.status} />
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>
                        {c.contactName && <span>{c.contactName} · </span>}
                        <span>{c.contactEmail}</span>
                        {c.signedAt && <span style={{ color: "#10b981" }}> · Signed {new Date(c.signedAt).toLocaleDateString()}</span>}
                        {c.sentAt && !c.signedAt && <span> · Sent {new Date(c.sentAt).toLocaleDateString()}</span>}
                        {!c.sentAt && <span> · Created {new Date(c.createdAt).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      {(c.status === "draft" || c.status === "sent" || c.status === "viewed") && (
                        <button className="btn btn-primary btn-sm" disabled={sending === c.id} onClick={ev => { ev.stopPropagation(); sendContract(c.id); }}
                          style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          {sending === c.id ? <span className="spinner" style={{ width: 12, height: 12 }} /> : <Send size={12} />}
                          {c.status === "draft" ? "Send" : "Resend"}
                        </button>
                      )}
                      {sendResult[c.id] && <CopyLink url={sendResult[c.id]} />}
                      {c.signToken && c.status !== "draft" && !sendResult[c.id] && (
                        <CopyLink url={`${window.location.origin}/sign/${c.signToken}`} />
                      )}
                      <button className="btn btn-ghost btn-sm" style={{ color: "#ef4444", padding: "4px 6px" }} onClick={ev => { ev.stopPropagation(); deleteContract(c.id); }}>
                        <Trash2 size={13} />
                      </button>
                      {expandedId === c.id ? <ChevronDown size={14} style={{ color: "var(--text-muted)" }} /> : <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />}
                    </div>
                  </div>

                  {expandedId === c.id && (
                    <div style={{ borderTop: "1px solid var(--border)", padding: "16px 18px", background: "var(--bg-elevated)" }}>
                      {c.signerName && (
                        <div style={{ marginBottom: 12, padding: "10px 14px", background: "rgba(16,185,129,0.08)", borderRadius: 6, fontSize: 13 }}>
                          <strong style={{ color: "#10b981" }}>Signed by:</strong> {c.signerName}
                          {c.signerIp && <span style={{ color: "var(--text-muted)" }}> · IP: {c.signerIp}</span>}
                          {c.signedAt && <span style={{ color: "var(--text-muted)" }}> · {new Date(c.signedAt).toLocaleString()}</span>}
                        </div>
                      )}
                      {c.signatureData && c.signatureData.startsWith("data:image") && (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>Signature</div>
                          <img src={c.signatureData} alt="Signature" style={{ maxWidth: 240, background: "#fff", borderRadius: 4, border: "1px solid var(--border)", padding: 8 }} />
                        </div>
                      )}
                      {c.signatureData && !c.signatureData.startsWith("data:image") && (
                        <div style={{ marginBottom: 12, fontStyle: "italic", fontSize: 20, color: "#3b82f6", fontFamily: "Georgia, serif" }}>
                          {c.signatureData}
                        </div>
                      )}
                      <pre style={{ fontSize: 12, color: "var(--text-secondary)", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0, lineHeight: 1.7, maxHeight: 300, overflow: "auto" }}>
                        {c.body}
                      </pre>
                      {c.notes && (
                        <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-muted)", borderTop: "1px solid var(--border)", paddingTop: 10 }}>
                          <strong>Notes:</strong> {c.notes}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TEMPLATES ── */}
      {tab === "templates" && (
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>
            3 starter templates are included. Create your own custom templates below.
          </div>
          {allTemplates.map((tpl: any) => (
            <div key={tpl.id} className="card" style={{ padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{tpl.name}</span>
                    {tpl.isStarter && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10, background: "rgba(99,102,241,0.12)", color: "#818cf8" }}>STARTER</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>{tpl.description}</div>
                  {(tpl.variables || []).length > 0 && (
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {(tpl.variables || []).map((v: string) => (
                        <span key={v} style={{ fontSize: 11, padding: "2px 7px", background: "var(--bg-overlay)", borderRadius: 4, color: "var(--text-muted)", fontFamily: "monospace" }}>{`{{${v}}}`}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button className="btn btn-primary btn-sm" onClick={() => { setShowNew(true); selectTemplate(tpl); }}>
                    Use template
                  </button>
                  {!tpl.isStarter && (
                    <>
                      <button className="btn btn-secondary btn-sm" onClick={() => {
                        setEditingTemplate(tpl);
                        setTplForm({ name: tpl.name, description: tpl.description || "", body: tpl.body, variables: (tpl.variables || []).join(", ") });
                        setShowTemplateEditor(true);
                      }}>Edit</button>
                      <button className="btn btn-ghost btn-sm" style={{ color: "#ef4444", padding: "4px 6px" }} onClick={() => deleteTemplate(tpl.id)}><Trash2 size={13} /></button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── NEW CONTRACT MODAL ── */}
      {showNew && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 1000, padding: "40px 16px", overflowY: "auto" }}>
          <div className="card" style={{ width: "100%", maxWidth: 720, padding: 0 }}>
            <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>New Contract</div>
              <button onClick={() => { setShowNew(false); setSelectedTemplate(null); setVarValues({}); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "var(--text-muted)", lineHeight: 1 }}>×</button>
            </div>
            <form onSubmit={submitContract}>
              <div style={{ padding: "20px 22px", display: "grid", gap: 14 }}>

                {/* Pick template */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Start from template (optional)</label>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button type="button" onClick={() => { setSelectedTemplate(null); setVarValues({}); setForm(f => ({ ...f, body: "" })); }}
                      className={`btn btn-sm ${!selectedTemplate ? "btn-primary" : "btn-secondary"}`}>Blank</button>
                    {allTemplates.map((tpl: any) => (
                      <button key={tpl.id} type="button" onClick={() => selectTemplate(tpl)}
                        className={`btn btn-sm ${selectedTemplate?.id === tpl.id ? "btn-primary" : "btn-secondary"}`}>
                        {tpl.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Contract Title *</label>
                    <input className="input" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Service Agreement — Acme Corp" />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Recipient Name</label>
                    <input className="input" value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} placeholder="John Smith" />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Recipient Email *</label>
                  <input className="input" type="email" required value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} placeholder="prospect@company.com" />
                </div>

                {/* Variable fields */}
                {selectedTemplate && Object.keys(varValues).length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>Fill in variables</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {Object.keys(varValues).map(key => (
                        <div key={key}>
                          <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 3, fontFamily: "monospace" }}>{`{{${key}}}`}</label>
                          <input className="input" value={varValues[key] || ""} onChange={e => setVarValues(v => ({ ...v, [key]: e.target.value }))} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Body editor */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Contract Body *</label>
                  <textarea className="input" rows={12} required style={{ resize: "vertical", fontFamily: "monospace", fontSize: 12, lineHeight: 1.7 }}
                    value={selectedTemplate ? buildBody() : form.body}
                    onChange={e => { if (!selectedTemplate) setForm(f => ({ ...f, body: e.target.value })); }}
                    readOnly={!!selectedTemplate}
                    placeholder="Write or paste the contract text here. Use {{variable_name}} for dynamic values."
                  />
                  {selectedTemplate && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>Fill in variables above to update the contract text</div>}
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Internal Notes</label>
                  <input className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Private notes (not shown to recipient)" />
                </div>

              </div>
              <div style={{ padding: "14px 22px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowNew(false); setSelectedTemplate(null); setVarValues({}); }}>Cancel</button>
                <button type="submit" className="btn btn-primary"><FileText size={14} /> Save as Draft</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── TEMPLATE EDITOR MODAL ── */}
      {showTemplateEditor && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 1000, padding: "40px 16px", overflowY: "auto" }}>
          <div className="card" style={{ width: "100%", maxWidth: 680, padding: 0 }}>
            <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{editingTemplate ? "Edit Template" : "New Template"}</div>
              <button onClick={() => setShowTemplateEditor(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "var(--text-muted)", lineHeight: 1 }}>×</button>
            </div>
            <form onSubmit={saveTemplate}>
              <div style={{ padding: "20px 22px", display: "grid", gap: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Template Name *</label>
                    <input className="input" required value={tplForm.name} onChange={e => setTplForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Description</label>
                    <input className="input" value={tplForm.description} onChange={e => setTplForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Variables (comma-separated)</label>
                  <input className="input" value={tplForm.variables} onChange={e => setTplForm(f => ({ ...f, variables: e.target.value }))} placeholder="client_name, date, amount, start_date" />
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>Use {"{{variable_name}}"} syntax in the body below</div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Template Body *</label>
                  <textarea className="input" rows={14} required style={{ resize: "vertical", fontFamily: "monospace", fontSize: 12, lineHeight: 1.7 }}
                    value={tplForm.body} onChange={e => setTplForm(f => ({ ...f, body: e.target.value }))}
                    placeholder="Write your contract template here. Use {{variable_name}} for fields that change per contract." />
                </div>
              </div>
              <div style={{ padding: "14px 22px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowTemplateEditor(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Template</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
