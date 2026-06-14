import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "../lib/api";
import Layout from "../components/Layout";
import { Modal, FormRow, Empty } from "../components/UI";
import {
  KeyRound, Plus, Trash2, Copy, Check, Webhook, Plug, ShieldAlert, Radio,
} from "lucide-react";

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      data-testid="button-copy"
      onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "var(--bg-overlay)", border: "1px solid var(--border)", borderRadius: 7, padding: "5px 9px", cursor: "pointer", color: "var(--text-primary)", fontSize: 12 }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}{copied ? "Copied" : "Copy"}
    </button>
  );
}

function Section({ icon: Icon, title, desc, action, children }: any) {
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: 18, marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--bg-overlay)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon size={17} style={{ color: "var(--accent)" }} /></div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{title}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{desc}</div>
          </div>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function DeveloperPage() {
  const { data: meta } = useQuery<any>({ queryKey: ["/api/developer/scopes"] });
  const { data: keys = [] } = useQuery<any[]>({ queryKey: ["/api/developer/keys"] });
  const { data: hooks = [] } = useQuery<any[]>({ queryKey: ["/api/developer/webhooks"] });

  const [showKey, setShowKey] = useState(false);
  const [keyForm, setKeyForm] = useState<{ name: string; scopes: string[] }>({ name: "", scopes: ["*"] });
  const [newKey, setNewKey] = useState<string | null>(null);
  const [err, setErr] = useState("");

  const [showHook, setShowHook] = useState(false);
  const [hookForm, setHookForm] = useState<{ url: string; events: string[] }>({ url: "", events: [] });
  const [newSecret, setNewSecret] = useState<string | null>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://your-domain";

  const createKey = useMutation({
    mutationFn: (d: any) => apiRequest("POST", "/api/developer/keys", d),
    onSuccess: (data: any) => { queryClient.invalidateQueries({ queryKey: ["/api/developer/keys"] }); setNewKey(data.key); setErr(""); },
    onError: (e: any) => setErr(e.message || "Failed to create key"),
  });
  const revokeKey = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/developer/keys/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/developer/keys"] }),
  });
  const createHook = useMutation({
    mutationFn: (d: any) => apiRequest("POST", "/api/developer/webhooks", d),
    onSuccess: (data: any) => { queryClient.invalidateQueries({ queryKey: ["/api/developer/webhooks"] }); setNewSecret(data.secret); setErr(""); },
    onError: (e: any) => setErr(e.message || "Failed to create webhook"),
  });
  const deleteHook = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/developer/webhooks/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/developer/webhooks"] }),
  });

  const allScopes: { scope: string; description: string }[] = meta?.scopes ?? [];
  const allEvents: string[] = meta?.events ?? [];

  function toggle(list: string[], v: string): string[] {
    return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
  }

  const activeKey = keys.find((k) => !k.revoked_at);
  const mcpSnippet = `claude mcp add --transport http argicrm ${origin}/mcp \\\n  --header "Authorization: Bearer ${activeKey ? "<YOUR_API_KEY>" : "<CREATE_A_KEY_FIRST>"}"`;

  return (
    <Layout title="Developer" subtitle="API keys, webhooks & MCP — drive your CRM programmatically">
      {/* MCP connect */}
      <Section icon={Plug} title="Connect Claude Code (MCP)" desc="Point any MCP client at your CRM. Create a key below, then run:">
        <pre style={{ margin: 0, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: 14, fontSize: 12.5, color: "var(--text-primary)", overflowX: "auto", whiteSpace: "pre-wrap" }}>{mcpSnippet}</pre>
        <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <CopyButton value={mcpSnippet} />
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Base API: <code>{origin}/api/v1</code></span>
        </div>
      </Section>

      {/* API keys */}
      <Section
        icon={KeyRound} title="API Keys" desc="Authenticate the public API and MCP server"
        action={<button data-testid="button-create-key" onClick={() => { setKeyForm({ name: "", scopes: ["*"] }); setNewKey(null); setErr(""); setShowKey(true); }} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}><Plus size={14} /> Create key</button>}
      >
        {keys.length === 0 ? (
          <Empty icon={KeyRound} title="No API keys yet" desc="Create one to start using the API or MCP server." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {keys.map((k) => (
              <div key={k.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 12px", background: "var(--bg-overlay)", borderRadius: 9, opacity: k.revoked_at ? 0.5 : 1 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{k.name} {k.revoked_at && <span style={{ fontSize: 11, color: "#f87171" }}>· revoked</span>}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "monospace" }}>{k.prefix}_…{k.last4} · {(k.scopes || []).join(", ") || "no scopes"}</div>
                </div>
                {!k.revoked_at && (
                  <button data-testid={`button-revoke-${k.id}`} onClick={() => revokeKey.mutate(k.id)} title="Revoke" style={{ background: "none", border: "1px solid var(--border)", borderRadius: 7, padding: 7, cursor: "pointer", color: "#f87171", display: "flex" }}><Trash2 size={13} /></button>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Webhooks */}
      <Section
        icon={Webhook} title="Webhooks" desc="Receive signed events when records change"
        action={<button data-testid="button-create-webhook" onClick={() => { setHookForm({ url: "", events: [] }); setNewSecret(null); setErr(""); setShowHook(true); }} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}><Plus size={14} /> Add webhook</button>}
      >
        {hooks.length === 0 ? (
          <Empty icon={Radio} title="No webhooks" desc="Subscribe an endpoint to record events." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {hooks.map((h) => (
              <div key={h.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 12px", background: "var(--bg-overlay)", borderRadius: 9 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.url}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{(h.events || []).length} event(s){h.is_active ? "" : " · paused"}</div>
                </div>
                <button data-testid={`button-delete-hook-${h.id}`} onClick={() => deleteHook.mutate(h.id)} title="Delete" style={{ background: "none", border: "1px solid var(--border)", borderRadius: 7, padding: 7, cursor: "pointer", color: "#f87171", display: "flex" }}><Trash2 size={13} /></button>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Create key modal */}
      <Modal open={showKey} onClose={() => setShowKey(false)} title="Create API key" width={520}>
        {newKey ? (
          <div>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 9, padding: 10, marginBottom: 12 }}>
              <ShieldAlert size={16} style={{ color: "#fbbf24", flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 12.5, color: "var(--text-primary)" }}>Copy this key now — it won’t be shown again.</div>
            </div>
            <pre style={{ margin: 0, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 9, padding: 12, fontSize: 12.5, overflowX: "auto" }}>{newKey}</pre>
            <div style={{ marginTop: 10, display: "flex", gap: 8 }}><CopyButton value={newKey} /><button onClick={() => setShowKey(false)} style={{ marginLeft: "auto", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Done</button></div>
          </div>
        ) : (
          <div>
            {err && <div style={{ color: "#f87171", fontSize: 12.5, marginBottom: 10 }}>{err}</div>}
            <FormRow label="Name" required><input data-testid="input-key-name" value={keyForm.name} onChange={(e) => setKeyForm({ ...keyForm, name: e.target.value })} placeholder="e.g. Zapier integration" style={{ width: "100%", padding: "9px 11px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 13 }} /></FormRow>
            <FormRow label="Scopes" hint="What this key can access">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, maxHeight: 180, overflowY: "auto" }}>
                {allScopes.map((s) => (
                  <button key={s.scope} type="button" onClick={() => setKeyForm({ ...keyForm, scopes: toggle(keyForm.scopes, s.scope) })} title={s.description}
                    style={{ fontSize: 12, padding: "5px 10px", borderRadius: 7, cursor: "pointer", border: "1px solid var(--border)", background: keyForm.scopes.includes(s.scope) ? "var(--accent)" : "var(--bg)", color: keyForm.scopes.includes(s.scope) ? "#fff" : "var(--text-muted)", fontFamily: "monospace" }}>{s.scope}</button>
                ))}
              </div>
            </FormRow>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
              <button onClick={() => setShowKey(false)} style={{ background: "var(--bg-overlay)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 14px", cursor: "pointer", color: "var(--text-primary)", fontSize: 13 }}>Cancel</button>
              <button data-testid="button-submit-key" disabled={!keyForm.name || createKey.isPending} onClick={() => createKey.mutate(keyForm)} style={{ background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600, opacity: !keyForm.name ? 0.5 : 1 }}>{createKey.isPending ? "Creating…" : "Create key"}</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create webhook modal */}
      <Modal open={showHook} onClose={() => setShowHook(false)} title="Add webhook" width={560}>
        {newSecret ? (
          <div>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 9, padding: 10, marginBottom: 12 }}>
              <ShieldAlert size={16} style={{ color: "#fbbf24", flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 12.5 }}>Signing secret — store it now. Verify the <code>X-Argicrm-Signature</code> HMAC header with it.</div>
            </div>
            <pre style={{ margin: 0, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 9, padding: 12, fontSize: 12.5, overflowX: "auto" }}>{newSecret}</pre>
            <div style={{ marginTop: 10, display: "flex", gap: 8 }}><CopyButton value={newSecret} /><button onClick={() => setShowHook(false)} style={{ marginLeft: "auto", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Done</button></div>
          </div>
        ) : (
          <div>
            {err && <div style={{ color: "#f87171", fontSize: 12.5, marginBottom: 10 }}>{err}</div>}
            <FormRow label="Endpoint URL" required><input data-testid="input-hook-url" value={hookForm.url} onChange={(e) => setHookForm({ ...hookForm, url: e.target.value })} placeholder="https://example.com/webhooks/argicrm" style={{ width: "100%", padding: "9px 11px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 13 }} /></FormRow>
            <FormRow label="Events" required hint="Which events to deliver">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, maxHeight: 200, overflowY: "auto" }}>
                {allEvents.map((ev) => (
                  <button key={ev} type="button" onClick={() => setHookForm({ ...hookForm, events: toggle(hookForm.events, ev) })}
                    style={{ fontSize: 12, padding: "5px 10px", borderRadius: 7, cursor: "pointer", border: "1px solid var(--border)", background: hookForm.events.includes(ev) ? "var(--accent)" : "var(--bg)", color: hookForm.events.includes(ev) ? "#fff" : "var(--text-muted)", fontFamily: "monospace" }}>{ev}</button>
                ))}
              </div>
            </FormRow>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
              <button onClick={() => setShowHook(false)} style={{ background: "var(--bg-overlay)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 14px", cursor: "pointer", color: "var(--text-primary)", fontSize: 13 }}>Cancel</button>
              <button data-testid="button-submit-hook" disabled={!hookForm.url || hookForm.events.length === 0 || createHook.isPending} onClick={() => createHook.mutate(hookForm)} style={{ background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600, opacity: (!hookForm.url || hookForm.events.length === 0) ? 0.5 : 1 }}>{createHook.isPending ? "Adding…" : "Add webhook"}</button>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
}
