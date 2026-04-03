import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "../components/Layout";
import { Modal, FormRow, Select, Empty, Badge, Avatar, Loader } from "../components/UI";
import { apiRequest } from "../lib/api";
import { UpgradeBanner } from "../components/UpgradeBanner";
import { useLanguage } from "../contexts/LanguageContext";
import {
  Zap, Search, Globe, Building2, Mail, Phone, CheckCircle,
  AlertCircle, Clock, Play, BarChart2, TrendingUp, Target,
  RefreshCw, Download, ArrowRight, Linkedin, Github, MapPin,
  Shield, Activity, Database, Filter, Plus, ExternalLink
} from "lucide-react";

const SCORE_COLOR = (s: number) => s >= 75 ? "#10b981" : s >= 50 ? "#3b82f6" : s >= 30 ? "#f59e0b" : "#ef4444";
const STATUS_BADGE: Record<string, string> = {
  valid: "badge-green", likely: "badge-blue", risky: "badge-amber",
  invalid: "badge-red", unknown: "badge-gray", new: "badge-gray",
  contacted: "badge-blue", replied: "badge-green", converted: "badge-green"
};

const INDUSTRIES = [
  "SaaS / Software", "Healthcare", "Fintech", "E-commerce", "Manufacturing",
  "Consulting", "Real Estate", "Education", "Logistics", "Media",
  "Insurance", "Cybersecurity", "HR Tech", "Legal Tech", "AgriTech"
];

const TITLES = ["CEO", "CTO", "VP Sales", "VP Marketing", "Head of Sales", "Director of Sales", "COO", "CMO", "Founder", "Co-Founder", "CFO", "Head of Marketing"];
const SENIORITIES = ["c-suite", "vp", "director", "manager"];
const DEPTHS = [{ value: "fast", label: "Fast (companies only, ~1 min)" }, { value: "standard", label: "Standard (companies + contacts, ~3 min)" }, { value: "deep", label: "Deep (+ tech stack + intent signals, ~8 min)" }];

const TABS = ["Dashboard", "Prospects", "Companies", "Intent Signals", "Email Verifier", "Tech Scanner"] as const;

export default function LeadGenPage() {
  const qc = useQueryClient();
  const { t } = useLanguage();
  const [tab, setTab] = useState<typeof TABS[number]>("Dashboard");
  const [campaignModal, setCampaignModal] = useState(false);
  const [emailVerifyInput, setEmailVerifyInput] = useState("");
  const [emailResult, setEmailResult] = useState<any>(null);
  const [emailVerifying, setEmailVerifying] = useState(false);
  const [techScanDomain, setTechScanDomain] = useState("");
  const [techResult, setTechResult] = useState<any>(null);
  const [techScanning, setTechScanning] = useState(false);
  const [activeCampaignJob, setActiveCampaignJob] = useState<string | null>(null);
  const [intentHunting, setIntentHunting] = useState(false);
  const [intentHuntResult, setIntentHuntResult] = useState<{ signalsFound: number; prospectsCreated: number; sources: string[] } | null>(null);
  const [intentHuntForm, setIntentHuntForm] = useState({ industry: "SaaS / Software", keywords: "" });
  const [jobResult, setJobResult] = useState<any>(null);
  const [campaignError, setCampaignError] = useState<unknown>(null);
  const [campaignForm, setCampaignForm] = useState({
    targetIndustry: "SaaS / Software",
    targetTitles: ["CEO", "VP Sales"],
    targetSeniorities: ["c-suite", "vp"],
    targetLocation: "",
    keywords: "",
    targetCount: "15",
    enrichmentDepth: "standard",
  });

  const { data: stats } = useQuery<any>({ queryKey: ["/api/leadgen/stats"] });
  const { data: prospectsData } = useQuery<{ data: any[]; total: number }>({
    queryKey: ["/api/intelligence/prospects"],
    enabled: tab === "Prospects"
  });
  const { data: companiesData } = useQuery<{ data: any[]; total: number }>({
    queryKey: ["/api/intelligence/companies"],
    enabled: tab === "Companies"
  });
  const { data: intentData } = useQuery<any[]>({
    queryKey: ["/api/intelligence/intent"],
    enabled: tab === "Intent Signals"
  });

  // Poll job status
  useEffect(() => {
    if (!activeCampaignJob) return;
    const interval = setInterval(async () => {
      try {
        const status = await apiRequest<any>("GET", `/api/leadgen/status/${activeCampaignJob}`);
        if (status.status === "completed" || status.status === "failed") {
          setJobResult(status);
          setActiveCampaignJob(null);
          qc.invalidateQueries({ queryKey: ["/api/leadgen/stats"] });
          qc.invalidateQueries({ queryKey: ["/api/intelligence/prospects"] });
          qc.invalidateQueries({ queryKey: ["/api/intelligence/companies"] });
          qc.invalidateQueries({ queryKey: ["/api/contacts"] });
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [activeCampaignJob]);

  const runCampaign = async () => {
    setJobResult(null);
    setCampaignError(null);
    const payload = {
      ...campaignForm,
      targetCount: Number(campaignForm.targetCount),
      keywords: campaignForm.keywords.split(",").map(k => k.trim()).filter(Boolean),
    };
    try {
      const res = await apiRequest<any>("POST", "/api/leadgen/campaign", payload);
      setActiveCampaignJob(res.jobId);
      setCampaignModal(false);
    } catch (err) {
      setCampaignError(err);
    }
  };

  const verifyEmail = async () => {
    if (!emailVerifyInput.trim()) return;
    setEmailVerifying(true);
    setEmailResult(null);
    try {
      const result = await apiRequest<any>("POST", "/api/leadgen/verify-email", { email: emailVerifyInput });
      setEmailResult(result);
    } finally { setEmailVerifying(false); }
  };

  const scanTech = async () => {
    if (!techScanDomain.trim()) return;
    setTechScanning(true);
    setTechResult(null);
    try {
      const result = await apiRequest<any>("POST", "/api/leadgen/tech-scan", { domain: techScanDomain.replace(/^https?:\/\//, "").replace(/\/.*/, "") });
      setTechResult(result);
    } finally { setTechScanning(false); }
  };

  const toLeadMut = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/intelligence/prospects/${id}/to-lead`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/leads"] }); qc.invalidateQueries({ queryKey: ["/api/intelligence/prospects"] }); }
  });

  const toggleTitle = (t: string) => setCampaignForm(p => ({
    ...p, targetTitles: p.targetTitles.includes(t) ? p.targetTitles.filter(x => x !== t) : [...p.targetTitles, t]
  }));

  const DATA_SOURCES = [
    { label: "DuckDuckGo Search", icon: Search, color: "#f97316", desc: "Real web search results" },
    { label: "Yellow Pages", icon: Globe, color: "#f59e0b", desc: "US business directory" },
    { label: "OpenCorporates", icon: Building2, color: "#3b82f6", desc: "80+ country company registry" },
    { label: "GitHub API", icon: Github, color: "#64748b", desc: "Tech stack + company signals" },
    { label: "Company Websites", icon: ExternalLink, color: "#8b5cf6", desc: "Direct HTML scraping" },
    { label: "Indeed Jobs", icon: Target, color: "#10b981", desc: "Job postings → buying intent" },
    { label: "DNS/MX Records", icon: Shield, color: "#06b6d4", desc: "Free email verification" },
    { label: "LinkedIn (public)", icon: Linkedin, color: "#0077b5", desc: "Public company pages" },
  ];

  return (
    <Layout
      title={t("leadgen_title", "AI Lead Generation")}
      subtitle={t("leadgen_subtitle", "Autonomous prospecting powered by AI")}
      actions={
        <div style={{ display: "flex", gap: 8 }}>
          {activeCampaignJob && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 8, fontSize: 12 }}>
              <span className="spinner" style={{ width: 12, height: 12 }} />
              <span style={{ color: "#60a5fa", fontWeight: 600 }}>{t("campaign_running", "Campaign Running")}...</span>
            </div>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => setCampaignModal(true)}>
            <Zap size={14} /> {t("new_campaign", "New Campaign")}
          </button>
        </div>
      }
    >
      {/* Job completed banner */}
      {jobResult?.status === "completed" && (
        <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 12, padding: "14px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 14 }}>
          <CheckCircle size={20} style={{ color: "#10b981", flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#10b981" }}>Pipeline completed!</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              Found {jobResult.result?.companies} companies · {jobResult.result?.prospects} prospects · {jobResult.result?.emailsVerified} verified emails · {jobResult.result?.intentSignals} intent signals
              {jobResult.result?.autoImportedToContacts > 0 && (
                <span style={{ marginLeft: 6, color: "#6366f1", fontWeight: 600 }}>· {jobResult.result.autoImportedToContacts} contacts auto-saved to CRM</span>
              )}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: "auto" }} onClick={() => setJobResult(null)}>✕</button>
        </div>
      )}

      {/* Tabs */}
      {(() => {
        const TAB_KEYS: Record<string, string> = {
          "Dashboard": "tab_dashboard",
          "Prospects": "tab_prospects",
          "Companies": "tab_companies",
          "Intent Signals": "tab_intent",
          "Email Verifier": "tab_email_verifier",
          "Tech Scanner": "tab_tech_scanner",
        };
        return (
          <div style={{ display: "flex", gap: 4, marginBottom: 20, overflowX: "auto" }} className="no-scrollbar">
            {TABS.map(tabName => (
              <button key={tabName} onClick={() => setTab(tabName)} className={`btn btn-sm ${tab === tabName ? "btn-primary" : "btn-secondary"}`} style={{ flexShrink: 0 }}>
                {t(TAB_KEYS[tabName] || tabName, tabName)}
              </button>
            ))}
          </div>
        );
      })()}

      {/* ── DASHBOARD ── */}
      {tab === "Dashboard" && (
        <div>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Prospects", value: stats?.prospects?.total || 0, sub: `Avg score: ${stats?.prospects?.avgScore || 0}`, icon: Target, color: "#3b82f6" },
              { label: "Verified Emails", value: stats?.prospects?.verified || 0, sub: "Via DNS MX lookup", icon: Mail, color: "#10b981" },
              { label: "Companies", value: stats?.companies || 0, sub: "Enriched from web", icon: Building2, color: "#8b5cf6" },
              { label: "Intent Signals", value: stats?.intentSignals || 0, sub: "Real buying signals", icon: TrendingUp, color: "#f59e0b" },
              { label: "Tech Findings", value: stats?.techFindings || 0, sub: "From live scans", icon: Activity, color: "#06b6d4" },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="card" style={{ padding: "14px 16px" }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                    <Icon size={14} style={{ color: s.color }} />
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{s.value.toLocaleString()}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)" }}>{s.label}</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{s.sub}</div>
                </div>
              );
            })}
          </div>

          {/* Data sources */}
          <div className="card" style={{ padding: "20px", marginBottom: 20 }}>
            <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700 }}>Data Sources</h3>
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 16px" }}>All public sources — zero paid API costs</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 10 }}>
              {DATA_SOURCES.map(s => {
                const Icon = s.icon;
                return (
                  <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "var(--bg-overlay)", borderRadius: 9, border: "1px solid var(--border)" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: `${s.color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={15} style={{ color: s.color }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{s.label}</div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{s.desc}</div>
                    </div>
                    <CheckCircle size={13} style={{ color: "#10b981", marginLeft: "auto", flexShrink: 0 }} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* How it works */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>How the pipeline works</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 10 }}>
              {[
                { step: "1", title: "Discover", desc: "DuckDuckGo + Yellow Pages + OpenCorporates find companies matching your ICP", color: "#3b82f6" },
                { step: "2", title: "Enrich", desc: "Scrapes company website, LinkedIn, GitHub to build full firmographic profile", color: "#8b5cf6" },
                { step: "3", title: "Contacts", desc: "AI + web search finds decision-makers at each company", color: "#10b981" },
                { step: "4", title: "Verify", desc: "DNS MX lookup confirms email domains accept mail — no API cost", color: "#f59e0b" },
                { step: "5", title: "Tech Scan", desc: "Live scan of company website detects their full tech stack", color: "#06b6d4" },
                { step: "6", title: "Intent", desc: "Job postings + news + funding signals = real buying intent", color: "#ec4899" },
                { step: "7", title: "Score", desc: "Multi-factor ICP scoring: seniority + email quality + intent + tech fit", color: "#f97316" },
                { step: "8", title: "Import", desc: "One-click import to CRM as leads or contacts", color: "#10b981" },
              ].map(s => (
                <div key={s.step} style={{ padding: "12px", background: "var(--bg-overlay)", borderRadius: 9, borderLeft: `3px solid ${s.color}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: s.color, marginBottom: 4 }}>STAGE {s.step}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{s.title}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── PROSPECTS ── */}
      {tab === "Prospects" && (
        <div>
          <div className="card" style={{ overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 160px 80px 70px 110px 110px", padding: "10px 16px", borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
              {["Prospect", "Company", "Score", "Intent", "Email Status", "Actions"].map(h => (
                <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</span>
              ))}
            </div>
            {!prospectsData?.data?.length ? (
              <Empty icon={Target} title="No prospects yet"
                desc='Run a campaign to let the AI engine discover and enrich real prospects from the web'
                action={<button className="btn btn-primary" onClick={() => setCampaignModal(true)}><Zap size={15} /> Run Campaign</button>}
              />
            ) : prospectsData.data.map((p: any) => (
              <div key={p.id} className="table-row" style={{ gridTemplateColumns: "1fr 160px 80px 70px 110px 110px", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Avatar name={`${p.firstName} ${p.lastName}`} size={30} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{p.firstName} {p.lastName}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{p.jobTitle}</div>
                    {p.email && <div style={{ fontSize: 10, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 3 }}><Mail size={9} />{p.email}</div>}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{p.company}</div>
                  {p.city && <div style={{ fontSize: 10, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 3 }}><MapPin size={9} />{p.city}{p.country ? `, ${p.country}` : ""}</div>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 36, height: 5, borderRadius: 3, background: "var(--bg-overlay)" }}>
                    <div style={{ width: `${p.score || 0}%`, height: "100%", borderRadius: 3, background: SCORE_COLOR(p.score || 0) }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: SCORE_COLOR(p.score || 0) }}>{p.score || 0}</span>
                </div>
                <div>
                  {p.intentScore > 60 ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981" }} />
                      <span style={{ fontSize: 10, color: "#10b981", fontWeight: 600 }}>High</span>
                    </div>
                  ) : (
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{p.intentScore || 0}</span>
                  )}
                </div>
                <div>
                  <span className={`badge ${STATUS_BADGE[p.emailStatus] || "badge-gray"}`}>
                    {p.emailStatus === "valid" ? "✓ Valid" : p.emailStatus === "likely" ? "~ Likely" : p.emailStatus || "Unknown"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button className="btn btn-primary btn-sm" style={{ fontSize: 10, padding: "3px 8px" }}
                    disabled={!!p.importedAsLeadId} onClick={() => !p.importedAsLeadId && toLeadMut.mutate(p.id)}>
                    {p.importedAsLeadId ? "✓" : t("import_as_lead", "→ Lead")}
                  </button>
                </div>
              </div>
            ))}
          </div>
          {prospectsData && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8, textAlign: "right" }}>{prospectsData.total} prospects — source: public web</div>}
        </div>
      )}

      {/* ── COMPANIES ── */}
      {tab === "Companies" && (
        <div>
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <input id="enrich-domain" className="input" placeholder="Enter domain to scrape (e.g. company.com)" style={{ flex: 1 }} />
            <button className="btn btn-primary btn-sm" onClick={async () => {
              const val = (document.getElementById("enrich-domain") as HTMLInputElement)?.value?.trim();
              if (!val) return;
              const domain = val.replace(/^https?:\/\//, "").replace(/\/.*/, "");
              await apiRequest("POST", "/api/leadgen/scrape-website", { domain });
              qc.invalidateQueries({ queryKey: ["/api/intelligence/companies"] });
            }}><Globe size={14} /> Scrape Website</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
            {!companiesData?.data?.length ? (
              <div style={{ gridColumn: "1/-1" }}>
                <Empty icon={Building2} title="No companies yet"
                  desc="Run a campaign or enter a domain above to start enriching companies"
                  action={<button className="btn btn-primary" onClick={() => setCampaignModal(true)}><Zap size={15} /> Run Campaign</button>}
                />
              </div>
            ) : companiesData.data.map((c: any) => (
              <div key={c.id} className="card" style={{ padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{c.domain}</div>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: SCORE_COLOR(c.score || 0) }}>{c.score || 0}</div>
                </div>
                {c.industry && <div style={{ marginBottom: 8 }}><span className="badge badge-blue">{c.industry}</span></div>}
                {c.description && <p style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.5, margin: "0 0 8px" }}>{c.description?.slice(0, 100)}...</p>}
                <div style={{ display: "flex", gap: 8, fontSize: 10, color: "var(--text-muted)" }}>
                  {c.techStack?.length > 0 && <span>🔧 {c.techStack.slice(0, 3).join(", ")}</span>}
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                  <span className="badge badge-gray">{c.dataSource?.replace("_", " ")}</span>
                  {c.linkedinUrl && <Linkedin size={12} style={{ color: "#0077b5" }} />}
                  {c.hqCity && <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{c.hqCity}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── INTENT SIGNALS ── */}
      {tab === "Intent Signals" && (
        <div>
          {/* Hunt Intent launcher */}
          <div className="card" style={{ padding: 20, marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(139,92,246,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Search size={18} style={{ color: "#8b5cf6" }} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>Public Intent Hunter</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
                  Scans Reddit, LinkedIn, Quora, Indie Hackers, and Product Hunt for people actively asking for solutions in your industry — right now. Auto-creates them as prospects.
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ flex: "1 1 200px" }}>
                <label style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, display: "block", marginBottom: 5 }}>INDUSTRY</label>
                <select
                  data-testid="select-intent-industry"
                  className="input"
                  value={intentHuntForm.industry}
                  onChange={e => setIntentHuntForm(f => ({ ...f, industry: e.target.value }))}
                  style={{ width: "100%" }}
                >
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div style={{ flex: "2 1 280px" }}>
                <label style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, display: "block", marginBottom: 5 }}>KEYWORDS <span style={{ fontWeight: 400 }}>(comma separated, optional)</span></label>
                <input
                  data-testid="input-intent-keywords"
                  className="input"
                  placeholder="e.g. CRM, agency software, client portal"
                  value={intentHuntForm.keywords}
                  onChange={e => setIntentHuntForm(f => ({ ...f, keywords: e.target.value }))}
                  style={{ width: "100%" }}
                />
              </div>
              <button
                data-testid="button-start-intent-hunt"
                className="btn btn-primary"
                disabled={intentHunting}
                onClick={async () => {
                  setIntentHunting(true);
                  setIntentHuntResult(null);
                  try {
                    const kws = intentHuntForm.keywords.split(",").map(k => k.trim()).filter(Boolean);
                    const res = await apiRequest("POST", "/api/leadgen/intent-hunt", {
                      industry: intentHuntForm.industry,
                      keywords: kws,
                      maxResults: 40,
                    });
                    const data = await res.json();
                    setIntentHuntResult(data);
                    qc.invalidateQueries({ queryKey: ["/api/intelligence/intent"] });
                    qc.invalidateQueries({ queryKey: ["/api/intelligence/prospects"] });
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setIntentHunting(false);
                  }
                }}
                style={{ flexShrink: 0, alignSelf: "flex-end" }}
              >
                {intentHunting
                  ? <><span className="spinner" style={{ width: 14, height: 14, marginRight: 6 }} />Hunting...</>
                  : <><Search size={14} style={{ marginRight: 6 }} />Hunt Intent Now</>
                }
              </button>
            </div>

            {/* Result banner */}
            {intentHunting && (
              <div style={{ marginTop: 14, background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#a78bfa", display: "flex", alignItems: "center", gap: 8 }}>
                <span className="spinner" style={{ width: 13, height: 13 }} />
                Crawling Reddit, LinkedIn, Quora, Indie Hackers, Product Hunt... this takes 30–60 seconds.
              </div>
            )}
            {intentHuntResult && !intentHunting && (
              <div style={{ marginTop: 14, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8, padding: "12px 16px", fontSize: 13 }}>
                <div style={{ fontWeight: 700, color: "#10b981", marginBottom: 4 }}>
                  Hunt complete — {intentHuntResult.signalsFound} intent signals found · {intentHuntResult.prospectsCreated} prospects created
                </div>
                <div style={{ color: "var(--text-muted)" }}>
                  Sources crawled: {intentHuntResult.sources.join(", ") || "Reddit, LinkedIn, Quora, Indie Hackers, Product Hunt"}
                </div>
              </div>
            )}
          </div>

          {/* How it works */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
            {[
              { icon: "💬", name: "Reddit", desc: "Threads where people ask for tool recommendations" },
              { icon: "💼", name: "LinkedIn", desc: "Posts asking peers for product/service advice" },
              { icon: "❓", name: "Quora", desc: "Questions about industry challenges & solutions" },
              { icon: "🚀", name: "Indie Hackers", desc: "Founders discussing tools they need" },
              { icon: "🐱", name: "Product Hunt", desc: "Discussion threads around product categories" },
            ].map(p => (
              <div key={p.name} style={{ flex: "1 1 160px", background: "var(--bg-overlay)", borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4 }}>{p.desc}</div>
              </div>
            ))}
          </div>

          {/* Signals list, split by type */}
          {(() => {
            const publicTypes = ["reddit_intent", "linkedin_intent", "quora_intent", "forum_intent"];
            const publicSignals = intentData?.filter((s: any) => publicTypes.includes(s.signalType)) || [];
            const companySignals = intentData?.filter((s: any) => !publicTypes.includes(s.signalType)) || [];

            const typeIcon: Record<string, string> = {
              reddit_intent: "Reddit",
              linkedin_intent: "LinkedIn",
              quora_intent: "Quora",
              forum_intent: "Forum",
              job_posting: "Hiring",
              funding: "Funding",
              tech_stack: "Tech Stack",
              news: "News",
            };
            const typeColor: Record<string, string> = {
              reddit_intent: "#ff4500",
              linkedin_intent: "#0077b5",
              quora_intent: "#b92b27",
              forum_intent: "#6366f1",
              job_posting: "#10b981",
              funding: "#f59e0b",
              tech_stack: "#3b82f6",
              news: "#8b5cf6",
            };

            return (
              <>
                {publicSignals.length > 0 && (
                  <>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
                      Public Intent Signals ({publicSignals.length})
                    </div>
                    {publicSignals.map((s: any) => (
                      <div key={s.id} data-testid={`row-intent-signal-${s.id}`} className="card" style={{ padding: "12px 16px", marginBottom: 8, display: "flex", alignItems: "flex-start", gap: 14 }}>
                        <div style={{ textAlign: "center", flexShrink: 0, width: 46 }}>
                          <div style={{ fontSize: 19, fontWeight: 800, color: s.strength > 70 ? "#10b981" : "#f59e0b" }}>{s.strength}</div>
                          <div style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>score</div>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                            <span className="badge" style={{ background: `${typeColor[s.signalType] || "#6366f1"}20`, color: typeColor[s.signalType] || "#6366f1", border: `1px solid ${typeColor[s.signalType] || "#6366f1"}40`, fontSize: 11 }}>
                              {typeIcon[s.signalType] || s.signalType}
                            </span>
                            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.topic}</span>
                          </div>
                          <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.4 }}>{s.description}</div>
                        </div>
                        {s.sourceUrl && (
                          <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer" data-testid={`link-intent-source-${s.id}`}
                            style={{ flexShrink: 0, color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    ))}
                    <div style={{ marginBottom: 20 }} />
                  </>
                )}

                {companySignals.length > 0 && (
                  <>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
                      Company-Level Intent ({companySignals.length})
                    </div>
                    {companySignals.map((s: any) => (
                      <div key={s.id} data-testid={`row-company-signal-${s.id}`} className="card" style={{ padding: "12px 16px", marginBottom: 8, display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ textAlign: "center", flexShrink: 0, width: 46 }}>
                          <div style={{ fontSize: 19, fontWeight: 800, color: s.strength > 70 ? "#10b981" : "#f59e0b" }}>{s.strength}</div>
                          <div style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>score</div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{s.companyName || s.companyDomain}</div>
                          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{s.topic}</div>
                          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{s.description}</div>
                        </div>
                        <span className="badge badge-gray">{typeIcon[s.signalType] || s.signalType?.replace("_", " ")}</span>
                      </div>
                    ))}
                  </>
                )}

                {!intentData?.length && !intentHunting && (
                  <Empty icon={TrendingUp} title="No intent signals yet"
                    desc='Click "Hunt Intent Now" to find people publicly asking for solutions in your industry, or run a deep campaign for company-level signals.' />
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* ── EMAIL VERIFIER ── */}
      {tab === "Email Verifier" && (
        <div style={{ maxWidth: 600 }}>
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700 }}>DNS MX Email Verifier</h3>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 20px" }}>Validates emails using DNS MX record lookups — 100% free, no API key required.</p>
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <input className="input" placeholder="email@company.com" value={emailVerifyInput} onChange={e => setEmailVerifyInput(e.target.value)} onKeyDown={e => e.key === "Enter" && verifyEmail()} style={{ flex: 1 }} />
              <button className="btn btn-primary" onClick={verifyEmail} disabled={emailVerifying || !emailVerifyInput.trim()}>
                {emailVerifying ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Shield size={14} />} Verify
              </button>
            </div>

            {emailResult && (
              <div style={{ background: "var(--bg-overlay)", borderRadius: 10, padding: "16px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  {emailResult.status === "valid" ? <CheckCircle size={20} style={{ color: "#10b981" }} /> :
                   emailResult.status === "likely" ? <CheckCircle size={20} style={{ color: "#3b82f6" }} /> :
                   emailResult.status === "invalid" || emailResult.status === "invalid_domain" ? <AlertCircle size={20} style={{ color: "#ef4444" }} /> :
                   <AlertCircle size={20} style={{ color: "#f59e0b" }} />}
                  <div style={{ fontSize: 16, fontWeight: 700, color: emailResult.status === "valid" ? "#10b981" : emailResult.status === "likely" ? "#3b82f6" : "#ef4444" }}>
                    {emailResult.status === "valid" ? "Valid email domain" : emailResult.status === "likely" ? "Likely valid" : emailResult.status === "risky" ? "Risky — free provider" : "Invalid / No MX record"}
                  </div>
                  <div style={{ marginLeft: "auto", fontSize: 22, fontWeight: 800, color: SCORE_COLOR(emailResult.confidence) }}>{emailResult.confidence}%</div>
                </div>
                <div style={{ display: "grid", gap: 8, fontSize: 13 }}>
                  {[
                    ["Email format", emailResult.format ? "✓ Valid" : "✗ Invalid", emailResult.format],
                    ["Domain exists", emailResult.domain ? "✓ Resolves" : "✗ No DNS", emailResult.domain],
                    ["MX record found", emailResult.mxRecord ? `✓ ${emailResult.mxHost || "exists"}` : "✗ No mail server", emailResult.mxRecord],
                    ["Confidence score", `${emailResult.confidence}%`, emailResult.confidence > 60],
                    ["Verification cost", "$0.00 — DNS only", true],
                  ].map(([label, val, ok]) => (
                    <div key={String(label)} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                      <span style={{ color: "var(--text-muted)" }}>{label}</span>
                      <span style={{ fontWeight: 600, color: ok ? "var(--text-primary)" : "#ef4444" }}>{String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TECH SCANNER ── */}
      {tab === "Tech Scanner" && (
        <div style={{ maxWidth: 700 }}>
          <div className="card" style={{ padding: 24, marginBottom: 16 }}>
            <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700 }}>Live Tech Stack Scanner</h3>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 20px" }}>Scans the target domain's HTML in real-time to detect 30+ technologies. No API cost.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <input className="input" placeholder="company.com" value={techScanDomain} onChange={e => setTechScanDomain(e.target.value)} onKeyDown={e => e.key === "Enter" && scanTech()} style={{ flex: 1 }} />
              <button className="btn btn-primary" onClick={scanTech} disabled={techScanning || !techScanDomain.trim()}>
                {techScanning ? <><span className="spinner" style={{ width: 14, height: 14 }} />Scanning...</> : <><Activity size={14} /> Scan Tech Stack</>}
              </button>
            </div>
          </div>

          {techResult && (
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>
                {techResult.technologies?.length > 0 ? `Found ${techResult.technologies.length} technologies` : "No technologies detected"}
              </div>
              {techResult.technologies?.length === 0 && (
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>The site may block scraping or use client-side only rendering. Try a different domain.</p>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 10 }}>
                {(techResult.technologies || []).map((t: any) => (
                  <div key={t.name} style={{ padding: "10px 12px", background: "var(--bg-overlay)", borderRadius: 8, border: "1px solid var(--border)" }}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>{t.name}</div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 6 }}>{t.category}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ flex: 1, height: 4, borderRadius: 2, background: "var(--border)" }}>
                        <div style={{ width: `${t.confidence}%`, height: "100%", borderRadius: 2, background: t.confidence >= 80 ? "#10b981" : "#3b82f6" }} />
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700 }}>{t.confidence}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Campaign Modal */}
      <Modal open={campaignModal} onClose={() => { setCampaignModal(false); setCampaignError(null); }} title={t("new_campaign", "New Campaign")} width={560}>
        <div style={{ padding: "20px", display: "grid", gap: 16 }}>
          {campaignError && <UpgradeBanner error={campaignError} onDismiss={() => setCampaignError(null)} />}
          <div style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#93c5fd" }}>
            Our engine will crawl DuckDuckGo, Yellow Pages, OpenCorporates, GitHub, LinkedIn (public), Indeed, and live websites — no API costs.
          </div>

          <FormRow label={t("target_industry", "Target Industry")} required>
            <Select options={INDUSTRIES.map(i => ({ value: i, label: i }))} value={campaignForm.targetIndustry} onChange={e => setCampaignForm(p => ({ ...p, targetIndustry: e.target.value }))} />
          </FormRow>

          <FormRow label="Target Job Titles">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", padding: 8, background: "var(--bg-overlay)", borderRadius: 8 }}>
              {TITLES.map(titleOpt => (
                <button key={titleOpt} type="button" onClick={() => toggleTitle(titleOpt)}
                  style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid",
                    background: campaignForm.targetTitles.includes(titleOpt) ? "rgba(59,130,246,0.2)" : "transparent",
                    color: campaignForm.targetTitles.includes(titleOpt) ? "#60a5fa" : "var(--text-muted)",
                    borderColor: campaignForm.targetTitles.includes(titleOpt) ? "#3b82f6" : "var(--border)"
                  }}
                >{titleOpt}</button>
              ))}
            </div>
          </FormRow>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FormRow label={t("target_location", "Location (optional)")}>
              <input className="input" value={campaignForm.targetLocation} onChange={e => setCampaignForm(p => ({ ...p, targetLocation: e.target.value }))} placeholder="New York, US" />
            </FormRow>
            <FormRow label={t("target_count", "Target count")}>
              <input type="number" className="input" value={campaignForm.targetCount} onChange={e => setCampaignForm(p => ({ ...p, targetCount: e.target.value }))} min={5} max={100} />
            </FormRow>
          </div>

          <FormRow label={t("campaign_keywords", "Keywords (comma-separated)")}>
            <input className="input" value={campaignForm.keywords} onChange={e => setCampaignForm(p => ({ ...p, keywords: e.target.value }))} placeholder="CRM, sales automation, pipeline management" />
          </FormRow>

          <FormRow label={t("enrichment_depth", "Enrichment depth")} hint="Deeper = more data, more time">
            <Select options={DEPTHS} value={campaignForm.enrichmentDepth} onChange={e => setCampaignForm(p => ({ ...p, enrichmentDepth: e.target.value }))} />
          </FormRow>
        </div>
        <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="btn btn-secondary" onClick={() => setCampaignModal(false)}>{t("cancel", "Cancel")}</button>
          <button className="btn btn-primary" onClick={runCampaign} style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)" }}>
            <Zap size={14} /> {t("run_campaign", "Run Campaign")}
          </button>
        </div>
      </Modal>
    </Layout>
  );
}
