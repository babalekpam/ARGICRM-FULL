import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "../components/Layout";
import { apiRequest } from "../lib/api";
import { Mail, MousePointer, Eye, Share2, TrendingUp, Send, ChevronDown, ChevronRight, Clock, Zap, Users } from "lucide-react";

const EVENT_ICONS: Record<string, any> = { open: Eye, click: MousePointer, forward: Share2 };
const EVENT_COLORS: Record<string, string> = { open: "#3b82f6", click: "#10b981", forward: "#f59e0b" };
const EVENT_LABELS: Record<string, string> = { open: "Opened", click: "Clicked link", forward: "Forwarded" };

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 60 ? "#10b981" : score >= 30 ? "#f59e0b" : "#6b7280";
  const label = score >= 60 ? "Hot" : score >= 30 ? "Warm" : "Cold";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: `${color}18`, color, border: `1px solid ${color}30`, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, display: "inline-block" }} />
      {label} · {score}
    </span>
  );
}

function ComposeModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ toEmail: "", toName: "", subject: "", body: "" });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const send = async () => {
    if (!form.toEmail || !form.subject || !form.body) { setError("All fields are required"); return; }
    setSending(true); setError(""); setSuccess("");
    try {
      const html = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">${form.body.split("\n").map(l => `<p style="margin:0 0 12px">${l}</p>`).join("")}</div>`;
      await apiRequest("POST", "/api/email/send", { toEmail: form.toEmail, toName: form.toName, subject: form.subject, html });
      setSuccess(`Email sent to ${form.toEmail} with tracking enabled`);
      qc.invalidateQueries({ queryKey: ["/api/email/analytics"] });
      qc.invalidateQueries({ queryKey: ["/api/email/sends"] });
    } catch (e: any) {
      setError(e.message || "Failed to send email");
    } finally { setSending(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "var(--bg-card)", borderRadius: 14, width: "100%", maxWidth: 560, padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Compose Tracked Email</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 20 }}>✕</button>
        </div>
        {success ? (
          <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 10, padding: 16, color: "#10b981", fontWeight: 600, textAlign: "center" }}>
            {success}
            <div style={{ fontSize: 12, marginTop: 6, opacity: 0.8 }}>Opens, clicks, and forwards will appear in your dashboard automatically.</div>
            <button onClick={onClose} style={{ marginTop: 14, background: "#10b981", color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", cursor: "pointer", fontWeight: 600 }}>Done</button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, display: "block", marginBottom: 4 }}>To Email *</label>
                <input data-testid="input-to-email" value={form.toEmail} onChange={e => setForm(f => ({ ...f, toEmail: e.target.value }))}
                  placeholder="recipient@company.com" style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, display: "block", marginBottom: 4 }}>To Name</label>
                <input data-testid="input-to-name" value={form.toName} onChange={e => setForm(f => ({ ...f, toName: e.target.value }))}
                  placeholder="John Doe" style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", boxSizing: "border-box" }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, display: "block", marginBottom: 4 }}>Subject *</label>
              <input data-testid="input-subject" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                placeholder="Email subject" style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, display: "block", marginBottom: 4 }}>Message *</label>
              <textarea data-testid="input-body" value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                placeholder="Write your message here..." rows={8}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit", fontSize: 14 }} />
            </div>
            {error && <div style={{ color: "#ef4444", fontSize: 13, background: "rgba(239,68,68,0.08)", padding: "8px 12px", borderRadius: 8 }}>{error}</div>}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid var(--border)", background: "none", cursor: "pointer", color: "var(--text)" }}>Cancel</button>
              <button data-testid="button-send-email" onClick={send} disabled={sending}
                style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#3b82f6,#6366f1)", color: "#fff", cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 8, opacity: sending ? 0.7 : 1 }}>
                <Send size={14} /> {sending ? "Sending…" : "Send & Track"}
              </button>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", paddingTop: 4 }}>
              A tracking pixel and click-tracking links will be automatically embedded in your email.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }: any) {
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{ background: `${color}18`, borderRadius: 8, padding: 8 }}>
          <Icon size={16} style={{ color }} />
        </div>
        <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text)" }}>{value ?? "—"}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function EmailRow({ send, onExpand, expanded }: any) {
  const opens = Number(send.open_count || 0);
  const clicks = Number(send.click_count || 0);
  const forwards = Number(send.forward_count || 0);
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 10, marginBottom: 8, overflow: "hidden" }}>
      <div onClick={onExpand} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer", background: "var(--bg-card)" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{send.subject}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>To: {send.contact_name || send.to_email} · {new Date(send.sent_at).toLocaleDateString()}</div>
        </div>
        <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: opens > 0 ? "#3b82f6" : "var(--text-muted)" }}><Eye size={12} />{opens}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: clicks > 0 ? "#10b981" : "var(--text-muted)" }}><MousePointer size={12} />{clicks}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: forwards > 0 ? "#f59e0b" : "var(--text-muted)" }}><Share2 size={12} />{forwards}</span>
        </div>
        <div style={{ color: "var(--text-muted)" }}>{expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</div>
      </div>
      {expanded && (
        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", background: "var(--bg)", fontSize: 12 }}>
          {opens === 0 && clicks === 0 && forwards === 0
            ? <span style={{ color: "var(--text-muted)" }}>No engagement yet — email may not have been opened.</span>
            : <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {opens > 0 && <span style={{ color: "#3b82f6" }}><Eye size={11} style={{ display: "inline", marginRight: 4 }} />{opens} open{opens !== 1 ? "s" : ""}</span>}
                {clicks > 0 && <span style={{ color: "#10b981" }}><MousePointer size={11} style={{ display: "inline", marginRight: 4 }} />{clicks} click{clicks !== 1 ? "s" : ""}</span>}
                {forwards > 0 && <span style={{ color: "#f59e0b" }}><Share2 size={11} style={{ display: "inline", marginRight: 4 }} />{forwards} forward{forwards !== 1 ? "s" : ""} detected</span>}
              </div>
          }
          {send.first_opened_at && <div style={{ marginTop: 6, color: "var(--text-muted)" }}>First opened: {new Date(send.first_opened_at).toLocaleString()}</div>}
        </div>
      )}
    </div>
  );
}

export default function EmailTrackingPage() {
  const [compose, setCompose] = useState(false);
  const [expandedSend, setExpandedSend] = useState<string | null>(null);
  const [tab, setTab] = useState<"overview" | "sends" | "hot_leads" | "activity">("overview");

  const { data: analytics, isLoading } = useQuery<any>({ queryKey: ["/api/email/analytics"] });
  const { data: sends = [] } = useQuery<any[]>({ queryKey: ["/api/email/sends"] });

  const totals = analytics?.totals || {};
  const hotLeads: any[] = analytics?.hotLeads || [];
  const recentEvents: any[] = analytics?.recentEvents || [];

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "sends", label: `Sent (${sends.length})` },
    { id: "hot_leads", label: `Hot Leads (${hotLeads.length})` },
    { id: "activity", label: "Live Activity" },
  ];

  return (
    <Layout title="Email Tracking" subtitle="Track opens, clicks, and forwards in real time">
      {compose && <ComposeModal onClose={() => setCompose(false)} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 8 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              style={{ padding: "7px 16px", borderRadius: 8, border: "1px solid var(--border)", background: tab === t.id ? "var(--primary)" : "var(--bg-card)", color: tab === t.id ? "#fff" : "var(--text)", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
              {t.label}
            </button>
          ))}
        </div>
        <button data-testid="button-compose" onClick={() => setCompose(true)}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#3b82f6,#6366f1)", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
          <Send size={14} /> Compose & Track
        </button>
      </div>

      {tab === "overview" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 28 }}>
            <StatCard icon={Mail} label="Total Sent" value={totals.total_sent} color="#6366f1" />
            <StatCard icon={Eye} label="Opens" value={totals.total_opened} sub={totals.open_rate ? `${totals.open_rate}% open rate` : undefined} color="#3b82f6" />
            <StatCard icon={MousePointer} label="Clicks" value={totals.total_clicked} sub={totals.click_rate ? `${totals.click_rate}% click rate` : undefined} color="#10b981" />
            <StatCard icon={Share2} label="Forwards Detected" value={totals.total_forwarded} color="#f59e0b" />
            <StatCard icon={Zap} label="Hot Leads" value={hotLeads.filter((l: any) => l.engagement_score >= 60).length} sub="Score 60+" color="#ef4444" />
          </div>

          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>How scores are calculated</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 14 }}>Every engagement action updates the contact's score in real time.</div>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              {[["Email opened", "+5 pts", "#3b82f6"], ["Link clicked", "+15 pts", "#10b981"], ["Forward detected", "+25 pts", "#f59e0b"]].map(([label, pts, color]) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <TrendingUp size={14} style={{ color }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</div>
                    <div style={{ fontWeight: 700, color }}>{pts}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {hotLeads.length > 0 && (
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Top Engaged Contacts</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {hotLeads.slice(0, 5).map((lead: any) => (
                  <div key={lead.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "var(--bg)", borderRadius: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                      {(lead.first_name || lead.name || "?")[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{lead.first_name ? `${lead.first_name} ${lead.last_name || ""}`.trim() : lead.name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{lead.company} · {lead.email}</div>
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 12, color: "var(--text-muted)" }}>
                      <span title="Opens"><Eye size={11} /> {lead.email_opens || 0}</span>
                      <span title="Clicks"><MousePointer size={11} /> {lead.email_clicks || 0}</span>
                      <span title="Forwards"><Share2 size={11} /> {lead.email_forwards || 0}</span>
                    </div>
                    <ScoreBadge score={lead.engagement_score || 0} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isLoading && sends.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
              <Mail size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
              <div style={{ fontWeight: 600, marginBottom: 6 }}>No tracked emails yet</div>
              <div style={{ fontSize: 13, marginBottom: 18 }}>Send your first tracked email to start seeing opens, clicks, and forwards.</div>
              <button onClick={() => setCompose(true)} style={{ padding: "10px 22px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#3b82f6,#6366f1)", color: "#fff", cursor: "pointer", fontWeight: 600 }}>
                Send your first tracked email
              </button>
            </div>
          )}
        </div>
      )}

      {tab === "sends" && (
        <div>
          {sends.length === 0
            ? <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}><Mail size={36} style={{ opacity: 0.3, marginBottom: 10 }} /><div>No emails sent yet</div></div>
            : sends.map((s: any) => (
              <EmailRow key={s.id} send={s} expanded={expandedSend === s.id} onExpand={() => setExpandedSend(expandedSend === s.id ? null : s.id)} />
            ))
          }
        </div>
      )}

      {tab === "hot_leads" && (
        <div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>Contacts ranked by engagement score — the higher the score, the warmer the lead.</div>
          {hotLeads.length === 0
            ? <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}><Users size={36} style={{ opacity: 0.3, marginBottom: 10 }} /><div>No engagement data yet</div></div>
            : hotLeads.map((lead: any) => (
              <div key={lead.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, marginBottom: 8 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, flexShrink: 0 }}>
                  {(lead.first_name || lead.name || "?")[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{lead.first_name ? `${lead.first_name} ${lead.last_name || ""}`.trim() : lead.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{lead.job_title} · {lead.company}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{lead.email}</div>
                </div>
                <div style={{ display: "flex", gap: 14, fontSize: 13, color: "var(--text-secondary)", flexShrink: 0 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Eye size={13} style={{ color: "#3b82f6" }} />{lead.email_opens || 0} opens</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MousePointer size={13} style={{ color: "#10b981" }} />{lead.email_clicks || 0} clicks</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Share2 size={13} style={{ color: "#f59e0b" }} />{lead.email_forwards || 0} forwards</span>
                </div>
                <ScoreBadge score={lead.engagement_score || 0} />
                {lead.last_engaged_at && (
                  <div style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>
                    <Clock size={10} style={{ display: "inline", marginRight: 3 }} />
                    {new Date(lead.last_engaged_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))
          }
        </div>
      )}

      {tab === "activity" && (
        <div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>Real-time feed of every email engagement event across all your tracked emails.</div>
          {recentEvents.length === 0
            ? <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}><Clock size={36} style={{ opacity: 0.3, marginBottom: 10 }} /><div>No activity yet</div></div>
            : recentEvents.map((ev: any, i: number) => {
              const Icon = EVENT_ICONS[ev.event_type] || Eye;
              const color = EVENT_COLORS[ev.event_type] || "#6366f1";
              return (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                    <Icon size={13} style={{ color }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13 }}>
                      <span style={{ fontWeight: 600 }}>{ev.contact_name || ev.to_email}</span>
                      {ev.company && <span style={{ color: "var(--text-muted)" }}> · {ev.company}</span>}
                      <span style={{ color }}> {EVENT_LABELS[ev.event_type] || ev.event_type}</span>
                      {ev.is_forward && <span style={{ marginLeft: 6, background: "#f59e0b18", color: "#f59e0b", padding: "1px 7px", borderRadius: 10, fontSize: 10, fontWeight: 700 }}>FORWARD</span>}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>"{ev.subject}"</div>
                    {ev.url && ev.event_type === "click" && <div style={{ fontSize: 11, color: "#6366f1", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.url}</div>}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0, whiteSpace: "nowrap" }}>
                    {new Date(ev.occurred_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    <br />{new Date(ev.occurred_at).toLocaleDateString()}
                  </div>
                </div>
              );
            })
          }
        </div>
      )}
    </Layout>
  );
}
