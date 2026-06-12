import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Layout from "../components/Layout";
import { useLanguage } from "../contexts/LanguageContext";
import { apiRequest } from "../lib/api";
import { UpgradeBanner } from "../components/UpgradeBanner";
import {
  Brain, Mail, Mic, Search, Zap, Copy, Check, ChevronDown,
  BarChart2, AlertCircle, TrendingUp, Lightbulb, RefreshCw,
  Globe, Users, MapPin, Building2, UserPlus, CheckSquare, Square,
  Sparkles, Download
} from "lucide-react";

const TABS = ["Deal Intelligence", "Email Composer", "Meeting Summarizer", "Data Enrichment", "Lead Finder"] as const;
type Tab = typeof TABS[number];
const TAB_KEYS: Record<Tab, string> = {
  "Deal Intelligence": "aitools_tab_deal_intelligence",
  "Email Composer": "aitools_tab_email_composer",
  "Meeting Summarizer": "aitools_tab_meeting_summarizer",
  "Data Enrichment": "aitools_tab_data_enrichment",
  "Lead Finder": "aitools_tab_lead_finder",
};

const TONES = ["professional", "friendly", "urgent", "consultative", "casual"];
const PURPOSES = [
  { value: "followup", label: "Follow-up (no response)" },
  { value: "intro", label: "Cold Introduction" },
  { value: "proposal", label: "Sending Proposal" },
  { value: "checkin", label: "Friendly Check-in" },
  { value: "close", label: "Closing Push" },
  { value: "winback", label: "Win-back / Re-engage" },
];

function CopyButton({ text }: { text: string }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}
    >
      {copied ? <Check size={12} style={{ color: "#10b981" }} /> : <Copy size={12} />}
      {copied ? t("copied", "Copied!") : t("copy", "Copy")}
    </button>
  );
}

function SectionCard({ title, icon: Icon, color, children }: any) {
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
        <Icon size={16} style={{ color }} />
        <span style={{ fontSize: 14, fontWeight: 600 }}>{title}</span>
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );
}

function HealthBar({ score }: { score: number }) {
  const { t } = useLanguage();
  const color = score >= 70 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{t("aitools_deal_health_score", "Deal Health Score")}</span>
        <span style={{ fontSize: 20, fontWeight: 700, color }}>{score}</span>
      </div>
      <div style={{ height: 8, background: "var(--bg-overlay)", borderRadius: 4 }}>
        <div style={{ height: "100%", width: `${score}%`, background: color, borderRadius: 4, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

function DealIntelligenceTab() {
  const { t } = useLanguage();
  const { data: deals } = useQuery<any[]>({ queryKey: ["/api/deals"] });
  const [selectedDeal, setSelectedDeal] = useState("");
  const [result, setResult] = useState<any>(null);

  const mutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/ai/deal-intelligence", { dealId: selectedDeal }),
    onSuccess: (data: any) => setResult(data),
  });

  const dealList = Array.isArray(deals) ? deals : (deals as any)?.deals || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SectionCard title={t("aitools_select_deal_title", "Select a Deal to Analyze")} icon={BarChart2} color="#3b82f6">
        <div style={{ display: "flex", gap: 10 }}>
          <select
            value={selectedDeal}
            onChange={e => setSelectedDeal(e.target.value)}
            data-testid="select-deal"
            style={{ flex: 1, padding: "9px 12px", background: "var(--bg-overlay)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 13 }}
          >
            <option value="">{t("aitools_select_deal_ph", "Select a deal…")}</option>
            {dealList.map((d: any) => (
              <option key={d.id} value={d.id}>{d.name} — {d.stage}</option>
            ))}
          </select>
          <button
            data-testid="btn-analyze-deal"
            onClick={() => mutation.mutate()}
            disabled={!selectedDeal || mutation.isPending}
            style={{ padding: "9px 18px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, cursor: selectedDeal ? "pointer" : "not-allowed", fontSize: 13, fontWeight: 600, opacity: !selectedDeal ? 0.5 : 1, display: "flex", alignItems: "center", gap: 6 }}
          >
            {mutation.isPending ? <><RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} /> Analyzing…</> : <><Zap size={13} /> Analyze</>}
          </button>
        </div>
        {mutation.error && <UpgradeBanner error={mutation.error} />}
      </SectionCard>

      {result && (
        <>
          <SectionCard title="Deal Health" icon={TrendingUp} color="#10b981">
            <HealthBar score={result.healthScore} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 16 }}>
              {[
                { label: "Days in Pipeline", value: result.daysInPipeline },
                { label: "Days Since Activity", value: result.daysSinceLastActivity },
                { label: "Status", value: result.isStale ? "Stale" : "Active" },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: "var(--bg-overlay)", borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{value}</div>
                </div>
              ))}
            </div>
            {result.risks.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#ef4444", marginBottom: 6 }}>Risk Factors</div>
                {result.risks.map((r: string, i: number) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-secondary)", marginBottom: 4 }}>
                    <AlertCircle size={13} style={{ color: "#ef4444", flexShrink: 0 }} /> {r}
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {result.aiInsights && (
            <SectionCard title="AI Insights" icon={Brain} color="#8b5cf6">
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.6 }}>{result.aiInsights.summary}</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Next Actions</div>
                  {result.aiInsights.nextActions?.map((a: string, i: number) => (
                    <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, marginBottom: 6 }}>
                      <span style={{ width: 18, height: 18, background: "#3b82f620", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#3b82f6", fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                      {a}
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Talking Points</div>
                  {result.aiInsights.talkingPoints?.map((p: string, i: number) => (
                    <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, marginBottom: 6 }}>
                      <Lightbulb size={14} style={{ color: "#f59e0b", flexShrink: 0, marginTop: 1 }} /> {p}
                    </div>
                  ))}
                </div>
              </div>
              {result.aiInsights.recommendation && (
                <div style={{ marginTop: 14, padding: "10px 14px", background: "#8b5cf620", borderRadius: 8, fontSize: 13, color: "#8b5cf6", fontWeight: 500 }}>
                  Recommendation: {result.aiInsights.recommendation}
                </div>
              )}
            </SectionCard>
          )}
        </>
      )}
    </div>
  );
}

function EmailComposerTab() {
  const [form, setForm] = useState({ contactName: "", company: "", dealName: "", stage: "", purpose: "followup", tone: "professional", additionalContext: "" });
  const [result, setResult] = useState<any>(null);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/ai/compose-email", form),
    onSuccess: (data: any) => setResult(data),
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SectionCard title="Email Context" icon={Mail} color="#3b82f6">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { key: "contactName", label: "Contact Name", placeholder: "Jane Smith" },
            { key: "company", label: "Company", placeholder: "Acme Corp" },
            { key: "dealName", label: "Deal Name (optional)", placeholder: "Enterprise Plan" },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>{label}</label>
              <input
                value={(form as any)[key]}
                onChange={e => set(key, e.target.value)}
                data-testid={`input-${key}`}
                placeholder={placeholder}
                style={{ width: "100%", padding: "9px 12px", background: "var(--bg-overlay)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 13, boxSizing: "border-box" }}
              />
            </div>
          ))}
          <div>
            <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Purpose</label>
            <select value={form.purpose} onChange={e => set("purpose", e.target.value)} data-testid="select-purpose"
              style={{ width: "100%", padding: "9px 12px", background: "var(--bg-overlay)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 13 }}>
              {PURPOSES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Tone</label>
            <select value={form.tone} onChange={e => set("tone", e.target.value)} data-testid="select-tone"
              style={{ width: "100%", padding: "9px 12px", background: "var(--bg-overlay)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 13 }}>
              {TONES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Additional Context (optional)</label>
          <textarea
            value={form.additionalContext}
            onChange={e => set("additionalContext", e.target.value)}
            placeholder="E.g. We met at SaaStr, they mentioned a Q2 budget…"
            rows={3}
            style={{ width: "100%", padding: "9px 12px", background: "var(--bg-overlay)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 13, resize: "vertical", boxSizing: "border-box" }}
          />
        </div>
        <button
          data-testid="btn-compose-email"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          style={{ marginTop: 14, padding: "10px 20px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}
        >
          {mutation.isPending ? <><RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} /> Writing…</> : <><Zap size={13} /> Generate Email</>}
        </button>
        {mutation.error && <UpgradeBanner error={mutation.error} />}
      </SectionCard>

      {result && (
        <SectionCard title="Generated Email" icon={Mail} color="#10b981">
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Subject line</span>
              <CopyButton text={result.subject} />
            </div>
            <div style={{ padding: "10px 14px", background: "var(--bg-overlay)", borderRadius: 8, fontSize: 14, fontWeight: 600 }}>{result.subject}</div>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Email body</span>
              <CopyButton text={result.body} />
            </div>
            <pre style={{ padding: "12px 14px", background: "var(--bg-overlay)", borderRadius: 8, fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap", fontFamily: "inherit", margin: 0 }}>{result.body}</pre>
          </div>
          {result.followUpTips?.length > 0 && (
            <div style={{ marginTop: 14, padding: "10px 14px", background: "#f59e0b10", borderRadius: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#f59e0b", marginBottom: 6 }}>Send Tips</div>
              {result.followUpTips.map((tip: string, i: number) => (
                <div key={i} style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 3 }}>• {tip}</div>
              ))}
            </div>
          )}
        </SectionCard>
      )}
    </div>
  );
}

function MeetingSummarizerTab() {
  const [transcript, setTranscript] = useState("");
  const [contactName, setContactName] = useState("");
  const [dealName, setDealName] = useState("");
  const [result, setResult] = useState<any>(null);

  const mutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/ai/summarize-meeting", { transcript, contactName, dealName }),
    onSuccess: (data: any) => setResult(data),
  });

  const SENTIMENT_COLOR = { positive: "#10b981", neutral: "#f59e0b", negative: "#ef4444" };
  const INTENT_COLOR = { high: "#10b981", medium: "#f59e0b", low: "#ef4444" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SectionCard title="Meeting Transcript" icon={Mic} color="#8b5cf6">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Contact Name (optional)</label>
            <input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Jane Smith"
              style={{ width: "100%", padding: "9px 12px", background: "var(--bg-overlay)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 13, boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Deal Name (optional)</label>
            <input value={dealName} onChange={e => setDealName(e.target.value)} placeholder="Enterprise Plan"
              style={{ width: "100%", padding: "9px 12px", background: "var(--bg-overlay)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 13, boxSizing: "border-box" }} />
          </div>
        </div>
        <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Paste your meeting transcript</label>
        <textarea
          value={transcript}
          onChange={e => setTranscript(e.target.value)}
          data-testid="input-transcript"
          placeholder="[10:00] Rep: Thanks for joining today. I wanted to follow up on your requirements...&#10;[10:01] Prospect: Yes, we're evaluating 3 vendors and need to decide by end of quarter..."
          rows={10}
          style={{ width: "100%", padding: "9px 12px", background: "var(--bg-overlay)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 13, resize: "vertical", boxSizing: "border-box" }}
        />
        <button
          data-testid="btn-summarize"
          onClick={() => mutation.mutate()}
          disabled={!transcript.trim() || mutation.isPending}
          style={{ marginTop: 12, padding: "10px 20px", background: "#8b5cf6", color: "#fff", border: "none", borderRadius: 8, cursor: transcript.trim() ? "pointer" : "not-allowed", fontSize: 13, fontWeight: 600, opacity: !transcript.trim() ? 0.5 : 1, display: "flex", alignItems: "center", gap: 6 }}
        >
          {mutation.isPending ? <><RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} /> Analyzing…</> : <><Brain size={13} /> Analyze Meeting</>}
        </button>
        {mutation.error && <UpgradeBanner error={mutation.error} />}
      </SectionCard>

      {result && (
        <>
          <SectionCard title="Summary" icon={Brain} color="#8b5cf6">
            <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
              <span style={{ padding: "4px 10px", background: `${(SENTIMENT_COLOR as any)[result.sentiment]}20`, color: (SENTIMENT_COLOR as any)[result.sentiment], borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                {result.sentiment?.charAt(0).toUpperCase() + result.sentiment?.slice(1)} Sentiment
              </span>
              {result.dealSignals?.buyingIntent && (
                <span style={{ padding: "4px 10px", background: `${(INTENT_COLOR as any)[result.dealSignals.buyingIntent]}20`, color: (INTENT_COLOR as any)[result.dealSignals.buyingIntent], borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                  {result.dealSignals.buyingIntent?.charAt(0).toUpperCase() + result.dealSignals.buyingIntent?.slice(1)} Buying Intent
                </span>
              )}
              {result.suggestedStageUpdate && (
                <span style={{ padding: "4px 10px", background: "#3b82f620", color: "#3b82f6", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                  Suggested: Move to {result.suggestedStageUpdate}
                </span>
              )}
            </div>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, margin: 0 }}>{result.summary}</p>
          </SectionCard>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <SectionCard title="Action Items" icon={Check} color="#10b981">
              {result.actionItems?.length === 0 ? (
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>No action items identified</div>
              ) : (
                result.actionItems?.map((a: any, i: number) => (
                  <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, padding: "8px 10px", background: "var(--bg-overlay)", borderRadius: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: a.priority === "high" ? "#ef4444" : a.priority === "medium" ? "#f59e0b" : "#10b981", marginTop: 5, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13 }}>{a.task}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{a.owner} · {a.dueDate || "No deadline"}</div>
                    </div>
                  </div>
                ))
              )}
            </SectionCard>

            <SectionCard title="Key Points & Objections" icon={Lightbulb} color="#f59e0b">
              {result.keyPoints?.map((p: string, i: number) => (
                <div key={i} style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6, display: "flex", gap: 6 }}>
                  <span style={{ color: "#f59e0b", flexShrink: 0 }}>•</span> {p}
                </div>
              ))}
              {result.objections?.length > 0 && (
                <>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#ef4444", marginTop: 12, marginBottom: 6 }}>Objections</div>
                  {result.objections.map((o: string, i: number) => (
                    <div key={i} style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6, display: "flex", gap: 6 }}>
                      <AlertCircle size={13} style={{ color: "#ef4444", flexShrink: 0, marginTop: 1 }} /> {o}
                    </div>
                  ))}
                </>
              )}
              {result.nextSteps && (
                <div style={{ marginTop: 12, padding: "8px 12px", background: "#10b98115", borderRadius: 8, fontSize: 13, color: "#10b981" }}>
                  Next: {result.nextSteps}
                </div>
              )}
            </SectionCard>
          </div>
        </>
      )}
    </div>
  );
}

function EnrichmentTab() {
  const [mode, setMode] = useState<"company" | "contact">("company");
  const [form, setForm] = useState({ domain: "", companyName: "", email: "", firstName: "", lastName: "", company: "" });
  const [result, setResult] = useState<any>(null);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: () => apiRequest("POST", mode === "company" ? "/api/ai/enrich-company" : "/api/ai/enrich-contact", form),
    onSuccess: (data: any) => setResult(data),
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 6, background: "var(--bg-overlay)", borderRadius: 8, padding: 4, width: "fit-content" }}>
        {(["company", "contact"] as const).map(m => (
          <button key={m} onClick={() => { setMode(m); setResult(null); }}
            style={{ padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, background: mode === m ? "var(--bg-card)" : "transparent", color: mode === m ? "var(--text-primary)" : "var(--text-muted)" }}>
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      <SectionCard title={mode === "company" ? "Company Enrichment" : "Contact Enrichment"} icon={Search} color="#6366f1">
        {mode === "company" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[{ k: "domain", l: "Domain", p: "acme.com" }, { k: "companyName", l: "Company Name", p: "Acme Corp" }].map(({ k, l, p }) => (
              <div key={k}>
                <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>{l}</label>
                <input value={(form as any)[k]} onChange={e => set(k, e.target.value)} placeholder={p}
                  style={{ width: "100%", padding: "9px 12px", background: "var(--bg-overlay)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 13, boxSizing: "border-box" }} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[{ k: "email", l: "Email", p: "jane@acme.com" }, { k: "firstName", l: "First Name", p: "Jane" }, { k: "lastName", l: "Last Name", p: "Smith" }, { k: "company", l: "Company", p: "Acme Corp" }].map(({ k, l, p }) => (
              <div key={k}>
                <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>{l}</label>
                <input value={(form as any)[k]} onChange={e => set(k, e.target.value)} placeholder={p}
                  style={{ width: "100%", padding: "9px 12px", background: "var(--bg-overlay)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 13, boxSizing: "border-box" }} />
              </div>
            ))}
          </div>
        )}
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          data-testid="btn-enrich"
          style={{ marginTop: 14, padding: "10px 20px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}
        >
          {mutation.isPending ? <><RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} /> Enriching…</> : <><Zap size={13} /> Enrich {mode === "company" ? "Company" : "Contact"}</>}
        </button>
        {mutation.error && <UpgradeBanner error={mutation.error} />}
      </SectionCard>

      {result && (
        <SectionCard title="Enriched Data" icon={Brain} color="#10b981">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Confidence:</span>
            <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: result.confidence === "high" ? "#10b98120" : "#f59e0b20", color: result.confidence === "high" ? "#10b981" : "#f59e0b" }}>
              {result.confidence?.charAt(0).toUpperCase() + result.confidence?.slice(1)}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {Object.entries(result).filter(([k]) => !["confidence", "technologies", "keyDecisionMakers", "skills", "competitorsMentioned"].includes(k)).map(([k, v]) => (
              <div key={k} style={{ padding: "10px 12px", background: "var(--bg-overlay)", borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "capitalize", marginBottom: 2 }}>{k.replace(/([A-Z])/g, " $1")}</div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{String(v) || "—"}</div>
              </div>
            ))}
          </div>
          {result.technologies?.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>Technologies</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {result.technologies.map((t: string) => (
                  <span key={t} style={{ padding: "3px 10px", background: "var(--bg-overlay)", border: "1px solid var(--border)", borderRadius: 20, fontSize: 12 }}>{t}</span>
                ))}
              </div>
            </div>
          )}
        </SectionCard>
      )}
    </div>
  );
}

const INDUSTRIES = ["SaaS / Software", "Marketing Agency", "E-commerce", "Healthcare", "Finance / FinTech", "Real Estate", "Manufacturing", "Consulting", "Logistics", "Education", "Legal", "Hospitality", "Other"];
const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-500", "500+", "Any"];
const TITLE_PRESETS = ["CEO, Founder", "VP Sales, Sales Director", "CMO, Marketing Director", "CTO, VP Engineering", "HR Director, CHRO", "CFO, Finance Director"];

function LeadFinderTab() {
  const [form, setForm] = useState({
    industry: "", location: "", titles: "CEO, Founder", companySize: "Any", keywords: "", targetCount: 15,
  });
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<any>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const prospects: any[] = jobStatus?.result?.prospects || [];

  function startPoll(jid: string) {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await apiRequest("GET", `/api/leadgen/status/${jid}`);
        setJobStatus(res);
        if ((res as any).status !== "running") clearInterval(pollRef.current!);
      } catch {}
    }, 3000);
  }

  React.useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  async function runSearch() {
    setError(null); setJobId(null); setJobStatus(null); setSelected(new Set()); setImported(null);
    const titles = form.titles.split(",").map(t => t.trim()).filter(Boolean);
    try {
      const res = await apiRequest("POST", "/api/leadgen/campaign", {
        targetIndustry: form.industry,
        targetLocation: form.location || undefined,
        targetTitles: titles,
        companySize: form.companySize !== "Any" ? form.companySize : undefined,
        keywords: form.keywords ? form.keywords.split(",").map(k => k.trim()) : [],
        targetCount: form.targetCount,
        enrichmentDepth: "standard",
      }) as any;
      if (res.jobId) { setJobId(res.jobId); setJobStatus({ status: "running", progress: 0 }); startPoll(res.jobId); }
      else setError(res.error || "Failed to start search");
    } catch (e: any) { setError(e.message || "Failed to start search"); }
  }

  function toggleSelect(i: number) {
    setSelected(prev => { const s = new Set(prev); s.has(i) ? s.delete(i) : s.add(i); return s; });
  }
  function toggleAll() {
    setSelected(selected.size === prospects.length ? new Set() : new Set(prospects.map((_: any, i: number) => i)));
  }

  async function importSelected() {
    const items = [...selected].map(i => prospects[i]);
    setImporting(true);
    try {
      const res = await apiRequest("POST", "/api/leadgen/import-contacts", { prospects: items }) as any;
      setImported(res.imported || 0);
    } catch (e: any) { setError(e.message); }
    finally { setImporting(false); }
  }

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const isRunning = jobStatus?.status === "running";
  const isDone = jobStatus?.status === "completed";
  const isFailed = jobStatus?.status === "failed";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Search form */}
      <SectionCard title="Lead Search Criteria" icon={Globe} color="#6366f1">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}>Industry *</div>
            <select value={form.industry} onChange={e => set("industry", e.target.value)} data-testid="select-lead-industry"
              style={{ width: "100%", padding: "9px 12px", background: "var(--bg-overlay)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 13 }}>
              <option value="">Select industry…</option>
              {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}>Location <span style={{ fontWeight: 400 }}>(optional)</span></div>
            <div style={{ position: "relative" }}>
              <MapPin size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input value={form.location} onChange={e => set("location", e.target.value)} placeholder="e.g. New York, France, Remote…" data-testid="input-lead-location"
                style={{ width: "100%", padding: "9px 12px 9px 30px", background: "var(--bg-overlay)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 13, boxSizing: "border-box" }} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}>Job Titles to Target</div>
            <select value={form.titles} onChange={e => set("titles", e.target.value)} data-testid="select-lead-titles"
              style={{ width: "100%", padding: "9px 12px", background: "var(--bg-overlay)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 13 }}>
              {TITLE_PRESETS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}>Company Size</div>
            <select value={form.companySize} onChange={e => set("companySize", e.target.value)} data-testid="select-lead-size"
              style={{ width: "100%", padding: "9px 12px", background: "var(--bg-overlay)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 13 }}>
              {COMPANY_SIZES.map(s => <option key={s} value={s}>{s} employees</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}>Keywords <span style={{ fontWeight: 400 }}>(optional)</span></div>
            <input value={form.keywords} onChange={e => set("keywords", e.target.value)} placeholder="e.g. Series A, hiring, remote-first" data-testid="input-lead-keywords"
              style={{ width: "100%", padding: "9px 12px", background: "var(--bg-overlay)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 13, boxSizing: "border-box" }} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}>Number of leads: <strong>{form.targetCount}</strong></div>
            <input type="range" min={5} max={50} step={5} value={form.targetCount} onChange={e => set("targetCount", Number(e.target.value))} data-testid="range-lead-count"
              style={{ width: "100%", accentColor: "#6366f1" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)" }}><span>5</span><span>50</span></div>
          </div>
        </div>

        <div style={{ marginTop: 16, padding: "10px 14px", background: "rgba(99,102,241,0.06)", borderRadius: 8, fontSize: 12, color: "var(--text-muted)" }}>
          <strong style={{ color: "#818cf8" }}>Sources searched:</strong>{" "}
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(99,102,241,0.15)", color: "#818cf8", borderRadius: 4, padding: "1px 7px", fontWeight: 600 }}>Apollo.io</span>
          {" · "}DuckDuckGo · Tavily · SerpAPI · Yellow Pages · OpenCorporates · GitHub · Company websites · Job boards
        </div>

        <button onClick={runSearch} disabled={!form.industry || isRunning} data-testid="btn-find-leads"
          style={{ marginTop: 16, padding: "11px 22px", background: !form.industry || isRunning ? "var(--bg-overlay)" : "linear-gradient(135deg,#6366f1,#8b5cf6)", color: !form.industry || isRunning ? "var(--text-muted)" : "#fff", border: "none", borderRadius: 8, cursor: !form.industry ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s" }}>
          {isRunning ? <><RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> Searching Apollo + web sources…</> : <><Sparkles size={14} /> Find {form.targetCount} Leads</>}
        </button>

        {error && <div style={{ marginTop: 10, padding: "10px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, fontSize: 13, color: "#f87171" }}>{error}</div>}
      </SectionCard>

      {/* Progress */}
      {jobStatus && isRunning && (
        <SectionCard title="Searching Public Sources…" icon={Globe} color="#6366f1">
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>
            Scanning DuckDuckGo, Yellow Pages, OpenCorporates, GitHub and company websites for matching leads. This takes 30–90 seconds.
          </div>
          <div style={{ height: 6, background: "var(--bg-overlay)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", background: "linear-gradient(90deg,#6366f1,#8b5cf6)", borderRadius: 3, width: "100%", animation: "progress 2s ease infinite alternate" }} />
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
            {["DuckDuckGo", "Yellow Pages", "OpenCorporates", "GitHub", "Company sites", "Job boards"].map(s => (
              <span key={s} style={{ padding: "3px 10px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 20, fontSize: 11, color: "#818cf8" }}>{s}</span>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Error */}
      {isFailed && (
        <div style={{ padding: "14px 18px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, fontSize: 13, color: "#f87171" }}>
          Search failed: {jobStatus?.error || "Unknown error"}. Try again or adjust your search criteria.
        </div>
      )}

      {/* Results */}
      {isDone && prospects.length === 0 && (
        <div style={{ padding: "24px", textAlign: "center", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 14, color: "var(--text-muted)" }}>
          No leads found for those criteria. Try a broader industry, different titles, or remove the location filter.
        </div>
      )}

      {isDone && prospects.length > 0 && (
        <SectionCard title={`${prospects.length} Leads Found`} icon={Users} color="#10b981">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={toggleAll} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                {selected.size === prospects.length ? <CheckSquare size={14} style={{ color: "#6366f1" }} /> : <Square size={14} />}
                {selected.size === prospects.length ? "Deselect all" : "Select all"}
              </button>
              {selected.size > 0 && <span style={{ fontSize: 12, color: "#818cf8" }}>{selected.size} selected</span>}
            </div>
            {selected.size > 0 && (
              <button onClick={importSelected} disabled={importing} data-testid="btn-import-leads"
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#10b981", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                {importing ? <><RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} /> Importing…</> : <><UserPlus size={13} /> Import {selected.size} to Contacts</>}
              </button>
            )}
          </div>

          {imported !== null && (
            <div style={{ padding: "10px 14px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8, fontSize: 13, color: "#34d399", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <Check size={14} /> {imported} contacts successfully imported to your CRM
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {prospects.map((p: any, i: number) => (
              <div key={i} data-testid={`card-lead-${i}`}
                onClick={() => toggleSelect(i)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: selected.has(i) ? "rgba(99,102,241,0.08)" : "var(--bg-overlay)", border: `1px solid ${selected.has(i) ? "rgba(99,102,241,0.3)" : "var(--border)"}`, borderRadius: 10, cursor: "pointer", transition: "all 0.15s" }}>
                <div style={{ flexShrink: 0 }}>
                  {selected.has(i) ? <CheckSquare size={16} style={{ color: "#6366f1" }} /> : <Square size={16} style={{ color: "var(--text-muted)" }} />}
                </div>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: `hsl(${(i * 73) % 360},60%,40%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                  {(p.name || p.firstName || "?")[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{p.name || `${p.firstName || ""} ${p.lastName || ""}`.trim() || "Unknown"}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {p.title && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Users size={11} />{p.title}</span>}
                    {p.company && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Building2 size={11} />{p.company}</span>}
                    {p.email && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Globe size={11} />{p.email}</span>}
                  </div>
                </div>
                {p.score !== undefined && (
                  <div style={{ textAlign: "center", flexShrink: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: p.score >= 70 ? "#10b981" : p.score >= 40 ? "#f59e0b" : "#ef4444" }}>{p.score}</div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)" }}>score</div>
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                  {p.dataSource === "apollo" && (
                    <span style={{ padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 700, background: "rgba(99,102,241,0.12)", color: "#818cf8", letterSpacing: "0.03em" }}>
                      Apollo
                    </span>
                  )}
                  {p.emailStatus && (
                    <span style={{ padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 600, background: p.emailStatus === "valid" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)", color: p.emailStatus === "valid" ? "#34d399" : "#fbbf24" }}>
                      {p.emailStatus}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <style>{`@keyframes progress { from { opacity:0.6; } to { opacity:1; } } @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}

export default function AIToolsPage() {
  const [tab, setTab] = useState<Tab>("Deal Intelligence");

  const TAB_ICONS: Record<Tab, any> = {
    "Deal Intelligence": BarChart2,
    "Email Composer": Mail,
    "Meeting Summarizer": Mic,
    "Data Enrichment": Search,
    "Lead Finder": Globe,
  };

  return (
    <Layout title="AI Tools" subtitle="AI-powered sales intelligence">
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {TABS.map(t => {
          const Icon = TAB_ICONS[t];
          return (
            <button
              key={t}
              data-testid={`tab-ai-${t.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => setTab(t)}
              style={{
                padding: "8px 14px", borderRadius: 8, border: "1px solid", cursor: "pointer", fontSize: 13, fontWeight: 500,
                background: tab === t ? "#3b82f6" : "var(--bg-card)",
                borderColor: tab === t ? "#3b82f6" : "var(--border)",
                color: tab === t ? "#fff" : "var(--text-secondary)",
                display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s",
              }}
            >
              <Icon size={14} /> {t}
            </button>
          );
        })}
      </div>

      {tab === "Deal Intelligence" && <DealIntelligenceTab />}
      {tab === "Email Composer" && <EmailComposerTab />}
      {tab === "Meeting Summarizer" && <MeetingSummarizerTab />}
      {tab === "Data Enrichment" && <EnrichmentTab />}
      {tab === "Lead Finder" && <LeadFinderTab />}
    </Layout>
  );
}
