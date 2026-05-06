import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";

type Tab = "mfa" | "keys" | "webhooks";

export default function SettingsSecurity() {
  const [tab, setTab] = useState<Tab>("mfa");

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Security</h1>
        <p className="text-sm text-gray-500 mt-1">
          Multi-factor authentication, API keys for the public API, and
          outbound webhooks. All actions are recorded in the audit log.
        </p>
      </header>

      <div className="flex gap-1 border-b border-gray-200 mb-6">
        <TabButton active={tab === "mfa"} onClick={() => setTab("mfa")}>Multi-factor (TOTP)</TabButton>
        <TabButton active={tab === "keys"} onClick={() => setTab("keys")}>API Keys</TabButton>
        <TabButton active={tab === "webhooks"} onClick={() => setTab("webhooks")}>Webhooks</TabButton>
      </div>

      {tab === "mfa" && <MfaSection />}
      {tab === "keys" && <ApiKeysSection />}
      {tab === "webhooks" && <WebhooksSection />}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
        active ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-900"
      }`}
    >
      {children}
    </button>
  );
}

// ─── MFA / TOTP section ───────────────────────────────────────────────
function MfaSection() {
  const { refreshUser } = useAuth();
  const status = useQuery<{ enabled: boolean; enrolled: boolean; recoveryCodesRemaining: number }>({
    queryKey: ["/api/auth/totp/status"],
  });
  const [enrollData, setEnrollData] = useState<{ qrDataUrl: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [disablePassword, setDisablePassword] = useState("");
  const [error, setError] = useState("");

  const enrollM = useMutation({
    mutationFn: () => apiRequest<any>("POST", "/api/auth/totp/enroll"),
    onSuccess: (d) => { setEnrollData({ qrDataUrl: d.qrDataUrl, secret: d.secret }); setError(""); },
    onError: (e: any) => setError(e?.message || "Failed to start enrollment"),
  });
  const verifyM = useMutation({
    mutationFn: (c: string) => apiRequest<{ recoveryCodes: string[] }>("POST", "/api/auth/totp/verify", { code: c }),
    onSuccess: (d) => {
      setRecoveryCodes(d.recoveryCodes);
      setEnrollData(null);
      setCode("");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/totp/status"] });
      refreshUser();
    },
    onError: (e: any) => setError(e?.message || "Invalid code"),
  });
  const disableM = useMutation({
    mutationFn: ({ password, code: c }: { password: string; code: string }) =>
      apiRequest("POST", "/api/auth/totp/disable", { password, code: c }),
    onSuccess: () => {
      setDisablePassword(""); setCode(""); setRecoveryCodes(null);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/totp/status"] });
      refreshUser();
    },
    onError: (e: any) => setError(e?.message || "Failed to disable"),
  });
  const regenM = useMutation({
    mutationFn: ({ password, code: c }: { password: string; code: string }) =>
      apiRequest<{ recoveryCodes: string[] }>("POST", "/api/auth/totp/regenerate-recovery-codes", { password, code: c }),
    onSuccess: (d) => {
      setRecoveryCodes(d.recoveryCodes);
      setDisablePassword(""); setCode("");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/totp/status"] });
    },
    onError: (e: any) => setError(e?.message || "Failed to regenerate codes"),
  });

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900">Multi-factor authentication</h2>
      <p className="text-sm text-gray-500 mt-1">
        Require a 6-digit code from an authenticator app on every login.
      </p>

      {status.isLoading ? (
        <p className="mt-4 text-sm text-gray-500">Loading…</p>
      ) : status.data?.enabled ? (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-sm">
          <span className="font-medium text-green-800">TOTP is enabled.</span>
          <span className="ml-2 text-green-700">{status.data.recoveryCodesRemaining} recovery codes remaining.</span>
        </div>
      ) : (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded text-sm">
          <span className="font-medium text-amber-800">TOTP is not enabled.</span>
          <span className="ml-2 text-amber-700">Strongly recommended for admin accounts.</span>
        </div>
      )}

      {/* Enrollment flow */}
      {!status.data?.enabled && !enrollData && !recoveryCodes && (
        <button
          className="mt-4 px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
          onClick={() => enrollM.mutate()}
          disabled={enrollM.isPending}
        >
          {enrollM.isPending ? "Generating…" : "Enable TOTP"}
        </button>
      )}

      {enrollData && (
        <div className="mt-4 p-4 border border-blue-200 bg-blue-50 rounded">
          <p className="text-sm text-gray-700">Scan this QR code with your authenticator app, then enter the 6-digit code below.</p>
          <img src={enrollData.qrDataUrl} alt="TOTP QR" className="mt-3 mx-auto bg-white p-2 border border-gray-200 rounded" />
          <details className="mt-2 text-xs text-gray-600">
            <summary className="cursor-pointer">Can't scan? Enter the secret manually</summary>
            <code className="mt-1 block break-all bg-white px-2 py-1 border border-gray-200 rounded">{enrollData.secret}</code>
          </details>
          <div className="mt-3 flex gap-2">
            <input
              type="text" inputMode="numeric" pattern="\d{6}" maxLength={6}
              placeholder="123456"
              value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="flex-1 px-3 py-2 border border-gray-200 rounded text-sm tabular-nums focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <button
              className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
              onClick={() => verifyM.mutate(code)}
              disabled={code.length !== 6 || verifyM.isPending}
            >
              {verifyM.isPending ? "Verifying…" : "Verify & enable"}
            </button>
          </div>
        </div>
      )}

      {recoveryCodes && (
        <div className="mt-4 p-4 border border-amber-300 bg-amber-50 rounded">
          <h3 className="font-medium text-amber-900">Recovery codes — save these now</h3>
          <p className="text-xs text-amber-800 mt-1">
            Each code can be used ONCE if you lose access to your authenticator. They will not be shown again.
          </p>
          <ul className="mt-3 grid grid-cols-2 gap-1 font-mono text-sm">
            {recoveryCodes.map(c => (
              <li key={c} className="px-2 py-1 bg-white border border-amber-200 rounded">{c}</li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            <button
              className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded"
              onClick={() => navigator.clipboard.writeText(recoveryCodes.join("\n"))}
            >Copy</button>
            <button
              className="px-3 py-1.5 text-sm bg-amber-600 text-white rounded"
              onClick={() => setRecoveryCodes(null)}
            >I've saved them</button>
          </div>
        </div>
      )}

      {/* Disable + regenerate */}
      {status.data?.enabled && !recoveryCodes && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
          <DangerForm
            title="Regenerate recovery codes"
            note="Invalidates all existing codes."
            password={disablePassword} setPassword={setDisablePassword}
            code={code} setCode={setCode}
            disabled={!disablePassword || code.length !== 6 || regenM.isPending}
            onSubmit={() => regenM.mutate({ password: disablePassword, code })}
            cta={regenM.isPending ? "Regenerating…" : "Regenerate"}
            color="blue"
          />
          <DangerForm
            title="Disable TOTP"
            note="Account will lose its second factor."
            password={disablePassword} setPassword={setDisablePassword}
            code={code} setCode={setCode}
            disabled={!disablePassword || code.length !== 6 || disableM.isPending}
            onSubmit={() => disableM.mutate({ password: disablePassword, code })}
            cta={disableM.isPending ? "Disabling…" : "Disable"}
            color="red"
          />
        </div>
      )}

      {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
    </div>
  );
}

function DangerForm(props: {
  title: string; note: string;
  password: string; setPassword: (v: string) => void;
  code: string; setCode: (v: string) => void;
  disabled: boolean; onSubmit: () => void; cta: string;
  color: "red" | "blue";
}) {
  const colorMap = { red: "bg-red-600 hover:bg-red-700", blue: "bg-blue-600 hover:bg-blue-700" };
  return (
    <div className="border border-gray-200 rounded p-3">
      <h4 className="font-medium text-sm text-gray-900">{props.title}</h4>
      <p className="text-xs text-gray-500 mt-0.5">{props.note}</p>
      <input
        type="password" placeholder="Current password"
        value={props.password} onChange={e => props.setPassword(e.target.value)}
        className="mt-2 w-full px-2 py-1.5 border border-gray-200 rounded text-sm"
      />
      <input
        type="text" inputMode="numeric" maxLength={6} placeholder="6-digit code"
        value={props.code} onChange={e => props.setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        className="mt-2 w-full px-2 py-1.5 border border-gray-200 rounded text-sm tabular-nums"
      />
      <button
        className={`mt-2 px-3 py-1.5 text-white text-sm rounded disabled:opacity-60 ${colorMap[props.color]}`}
        disabled={props.disabled}
        onClick={props.onSubmit}
      >{props.cta}</button>
    </div>
  );
}

// ─── API Keys section ──────────────────────────────────────────────────
function ApiKeysSection() {
  const keys = useQuery<any[]>({ queryKey: ["/api/api-keys"] });
  const scopes = useQuery<string[]>({ queryKey: ["/api/api-keys/scopes/list"] });
  const [name, setName] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["contacts:read"]);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [error, setError] = useState("");

  const createM = useMutation({
    mutationFn: (vars: { name: string; scopes: string[] }) =>
      apiRequest<{ key: string }>("POST", "/api/api-keys", vars),
    onSuccess: (d) => { setCreatedKey(d.key); setName(""); setSelectedScopes(["contacts:read"]); setError(""); queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] }); },
    onError: (e: any) => setError(e?.message || "Failed to create key"),
  });
  const revokeM = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/api-keys/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] }),
  });

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900">API keys</h2>
      <p className="text-sm text-gray-500 mt-1">
        For programmatic access via <code className="text-xs bg-gray-100 px-1 rounded">/api/v1/*</code>.
        Use as <code className="text-xs bg-gray-100 px-1 rounded">Authorization: Bearer argi_...</code>.
      </p>

      {/* Create */}
      <div className="mt-4 border border-gray-200 rounded p-3">
        <h3 className="font-medium text-sm text-gray-900">Create new key</h3>
        <input
          type="text" placeholder="Name (e.g. 'Zapier integration')"
          value={name} onChange={e => setName(e.target.value)}
          className="mt-2 w-full px-2 py-1.5 border border-gray-200 rounded text-sm"
        />
        <div className="mt-2">
          <label className="text-xs text-gray-500">Scopes</label>
          <div className="mt-1 flex flex-wrap gap-1">
            {(scopes.data || []).filter(s => s !== "*").map(s => (
              <button
                key={s}
                onClick={() => setSelectedScopes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                className={`px-2 py-0.5 text-xs rounded border ${
                  selectedScopes.includes(s) ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-white border-gray-200 text-gray-600"
                }`}
              >{s}</button>
            ))}
          </div>
        </div>
        <button
          className="mt-3 px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
          disabled={!name || selectedScopes.length === 0 || createM.isPending}
          onClick={() => createM.mutate({ name, scopes: selectedScopes })}
        >{createM.isPending ? "Creating…" : "Create key"}</button>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </div>

      {createdKey && (
        <div className="mt-4 p-4 border border-amber-300 bg-amber-50 rounded">
          <h4 className="font-medium text-amber-900">Save this key now</h4>
          <p className="text-xs text-amber-800 mt-1">It will not be shown again.</p>
          <code className="mt-2 block break-all bg-white px-2 py-1.5 border border-amber-200 rounded text-xs">{createdKey}</code>
          <div className="mt-2 flex gap-2">
            <button
              className="px-3 py-1 text-xs bg-white border border-gray-300 rounded"
              onClick={() => navigator.clipboard.writeText(createdKey)}
            >Copy</button>
            <button
              className="px-3 py-1 text-xs bg-amber-600 text-white rounded"
              onClick={() => setCreatedKey(null)}
            >I've saved it</button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="mt-4 border border-gray-200 rounded">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs uppercase text-gray-500 border-b border-gray-200">
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Prefix</th>
              <th className="text-left p-2">Scopes</th>
              <th className="text-left p-2">Last used</th>
              <th className="text-right p-2"></th>
            </tr>
          </thead>
          <tbody>
            {(keys.data || []).map((k) => (
              <tr key={k.id} className="border-b border-gray-100 last:border-0">
                <td className="p-2 font-medium text-gray-900">{k.name}</td>
                <td className="p-2 font-mono text-xs text-gray-500">argi_{k.prefix}…</td>
                <td className="p-2 text-xs text-gray-600">{(k.scopes || []).join(", ")}</td>
                <td className="p-2 text-xs text-gray-500">{k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : "never"}</td>
                <td className="p-2 text-right">
                  {!k.revoked_at ? (
                    <button
                      className="text-xs text-red-600 hover:underline"
                      onClick={() => { if (confirm(`Revoke ${k.name}?`)) revokeM.mutate(k.id); }}
                    >Revoke</button>
                  ) : (
                    <span className="text-xs text-gray-400">revoked</span>
                  )}
                </td>
              </tr>
            ))}
            {(keys.data || []).length === 0 && (
              <tr><td colSpan={5} className="p-3 text-sm text-gray-500">No API keys yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Webhooks section ─────────────────────────────────────────────────
function WebhooksSection() {
  const endpoints = useQuery<any[]>({ queryKey: ["/api/webhooks"] });
  const events = useQuery<string[]>({ queryKey: ["/api/webhooks/events/list"] });
  const deliveries = useQuery<any[]>({ queryKey: ["/api/webhooks/deliveries"] });
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [error, setError] = useState("");

  const createM = useMutation({
    mutationFn: (vars: { url: string; events: string[] }) =>
      apiRequest<{ secret: string }>("POST", "/api/webhooks", vars),
    onSuccess: (d) => { setCreatedSecret(d.secret); setUrl(""); setSelectedEvents([]); setError(""); queryClient.invalidateQueries({ queryKey: ["/api/webhooks"] }); },
    onError: (e: any) => setError(e?.message || "Failed to create webhook"),
  });
  const deleteM = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/webhooks/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/webhooks"] }),
  });
  const testM = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/webhooks/${id}/test`),
    onSuccess: () => setTimeout(() => queryClient.invalidateQueries({ queryKey: ["/api/webhooks/deliveries"] }), 1000),
  });
  const toggleM = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiRequest("PUT", `/api/webhooks/${id}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/webhooks"] }),
  });

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900">Webhooks</h2>
      <p className="text-sm text-gray-500 mt-1">
        Argilette will POST a JSON payload to your URL on each event,
        signed with HMAC-SHA256 in the <code className="text-xs bg-gray-100 px-1 rounded">X-Argilette-Signature</code> header.
      </p>

      <div className="mt-4 border border-gray-200 rounded p-3">
        <h3 className="font-medium text-sm text-gray-900">Add endpoint</h3>
        <input
          type="url" placeholder="https://your-server.example.com/webhook"
          value={url} onChange={e => setUrl(e.target.value)}
          className="mt-2 w-full px-2 py-1.5 border border-gray-200 rounded text-sm"
        />
        <div className="mt-2">
          <label className="text-xs text-gray-500">
            Events <span className="text-gray-400">(empty = all events)</span>
          </label>
          <div className="mt-1 flex flex-wrap gap-1 max-h-32 overflow-auto">
            {(events.data || []).map(ev => (
              <button
                key={ev}
                onClick={() => setSelectedEvents(prev => prev.includes(ev) ? prev.filter(x => x !== ev) : [...prev, ev])}
                className={`px-2 py-0.5 text-xs rounded border ${
                  selectedEvents.includes(ev) ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-white border-gray-200 text-gray-600"
                }`}
              >{ev}</button>
            ))}
          </div>
        </div>
        <button
          className="mt-3 px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
          disabled={!url || createM.isPending}
          onClick={() => createM.mutate({ url, events: selectedEvents })}
        >{createM.isPending ? "Creating…" : "Add endpoint"}</button>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </div>

      {createdSecret && (
        <div className="mt-4 p-4 border border-amber-300 bg-amber-50 rounded">
          <h4 className="font-medium text-amber-900">Save the signing secret</h4>
          <p className="text-xs text-amber-800 mt-1">
            Use it on your server to verify the X-Argilette-Signature header.
            It will not be shown again.
          </p>
          <code className="mt-2 block break-all bg-white px-2 py-1.5 border border-amber-200 rounded text-xs">{createdSecret}</code>
          <div className="mt-2 flex gap-2">
            <button className="px-3 py-1 text-xs bg-white border border-gray-300 rounded" onClick={() => navigator.clipboard.writeText(createdSecret)}>Copy</button>
            <button className="px-3 py-1 text-xs bg-amber-600 text-white rounded" onClick={() => setCreatedSecret(null)}>I've saved it</button>
          </div>
        </div>
      )}

      <div className="mt-4 border border-gray-200 rounded">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs uppercase text-gray-500 border-b border-gray-200">
              <th className="text-left p-2">URL</th>
              <th className="text-left p-2">Events</th>
              <th className="text-left p-2">Status</th>
              <th className="text-right p-2"></th>
            </tr>
          </thead>
          <tbody>
            {(endpoints.data || []).map((e) => (
              <tr key={e.id} className="border-b border-gray-100 last:border-0">
                <td className="p-2 font-medium text-gray-900 truncate max-w-xs">{e.url}</td>
                <td className="p-2 text-xs text-gray-600">{(e.events || []).length === 0 ? "all" : (e.events || []).join(", ")}</td>
                <td className="p-2 text-xs">
                  {e.is_active ? (
                    <span className="text-green-700">active</span>
                  ) : (
                    <span className="text-amber-700">disabled</span>
                  )}
                  {e.failure_count > 0 && <span className="ml-1 text-red-600">({e.failure_count} fails)</span>}
                </td>
                <td className="p-2 text-right whitespace-nowrap">
                  <button className="text-xs text-blue-600 hover:underline mr-2" onClick={() => testM.mutate(e.id)} disabled={testM.isPending}>Test</button>
                  <button className="text-xs text-gray-600 hover:underline mr-2" onClick={() => toggleM.mutate({ id: e.id, isActive: !e.is_active })}>{e.is_active ? "Disable" : "Enable"}</button>
                  <button className="text-xs text-red-600 hover:underline" onClick={() => { if (confirm("Delete this webhook?")) deleteM.mutate(e.id); }}>Delete</button>
                </td>
              </tr>
            ))}
            {(endpoints.data || []).length === 0 && (
              <tr><td colSpan={4} className="p-3 text-sm text-gray-500">No webhook endpoints yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Recent deliveries */}
      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Recent deliveries</h3>
        <div className="border border-gray-200 rounded">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase text-gray-500 border-b border-gray-200">
                <th className="text-left p-2">Event</th>
                <th className="text-left p-2">URL</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Code</th>
                <th className="text-left p-2">Attempts</th>
                <th className="text-left p-2">When</th>
              </tr>
            </thead>
            <tbody>
              {(deliveries.data || []).slice(0, 25).map(d => (
                <tr key={d.id} className="border-b border-gray-100 last:border-0">
                  <td className="p-2 text-xs font-mono">{d.event}</td>
                  <td className="p-2 text-xs text-gray-500 truncate max-w-xs">{d.endpoint_url}</td>
                  <td className="p-2 text-xs">
                    <span className={
                      d.status === "delivered" ? "text-green-700" :
                      d.status === "failed"   ? "text-red-600" :
                      "text-gray-600"
                    }>{d.status}</span>
                  </td>
                  <td className="p-2 text-xs tabular-nums">{d.last_status_code || "—"}</td>
                  <td className="p-2 text-xs tabular-nums">{d.attempts}</td>
                  <td className="p-2 text-xs text-gray-500">{new Date(d.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {(deliveries.data || []).length === 0 && (
                <tr><td colSpan={6} className="p-3 text-sm text-gray-500">No deliveries yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
