import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "../components/Layout";
import { useLanguage } from "../contexts/LanguageContext";
import { Modal, FormRow, Select, Empty, Badge, Avatar, Loader } from "../components/UI";
import { toast } from "../components/Toast";
import { apiRequest } from "../lib/api";
import {
  Search, Filter, Zap, Target, Plus, Download, Upload,
  Building2, Users, Mail, Phone, Globe, Linkedin, TrendingUp,
  BarChart2, RefreshCw, ChevronRight, Check, AlertCircle,
  BookOpen, Layers, Activity, Eye, MapPin, Briefcase, Star
} from "lucide-react";

const INDUSTRIES = ["SaaS / Software", "Healthcare", "Fintech", "E-commerce", "Manufacturing", "Consulting", "Real Estate", "Education", "Logistics", "Media", "Insurance", "Cybersecurity"];
const SENIORITIES = ["c-suite", "vp", "director", "manager", "individual"];
const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-500", "500-1000", "1000+"];
const TABS = ["Prospects", "Companies", "Sequences", "Intent Signals", "Visitors", "Org Charts"] as const;

const SCORE_COLOR = (s: number) => s >= 80 ? "#10b981" : s >= 60 ? "#3b82f6" : s >= 40 ? "#f59e0b" : "#ef4444";
const STATUS_BADGE: Record<string, string> = {
  new: "badge-gray", contacted: "badge-blue", replied: "badge-green",
  meeting_booked: "badge-purple", not_interested: "badge-red", converted: "badge-green"
};

export default function IntelligencePage() {
  const qc = useQueryClient();
  const { t } = useLanguage();
  const [tab, setTab] = useState<typeof TABS[number]>("Prospects");
  const [searchModal, setSearchModal] = useState(false);
  const [sequenceModal, setSequenceModal] = useState(false);
  const [orgModal, setOrgModal] = useState(false);
  const [emailFinderModal, setEmailFinderModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<any>({});
  const [searching, setSearching] = useState(false);
  const [orgChart, setOrgChart] = useState<any[]>([]);
  const [emailResult, setEmailResult] = useState<any>(null);

  // Forms
  const [searchForm, setSearchForm] = useState({
    industries: [] as string[], titles: ["VP Sales", "Head of Sales"], seniorities: ["vp", "director"],
    companySizes: ["51-200", "201-500"], countries: ["US"], technologies: [] as string[],
    keywords: [] as string[], enrichmentDepth: "standard"
  });
  const [seqForm, setSeqForm] = useState({ name: "", targetPersona: "", product: "ARGILETTE CRM", tone: "professional", steps: 5 });
  const [orgForm, setOrgForm] = useState({ company: "", domain: "", focusDepartment: "" });
  const [emailForm, setEmailForm] = useState({ firstName: "", lastName: "", domain: "" });

  const { data: stats } = useQuery<any>({ queryKey: ["/api/intelligence/stats"] });
  const { data: prospectsData } = useQuery<{ data: any[]; total: number }>({ queryKey: ["/api/intelligence/prospects"], enabled: tab === "Prospects" });
  const { data: companiesData } = useQuery<{ data: any[]; total: number }>({ queryKey: ["/api/intelligence/companies"], enabled: tab === "Companies" });
  const { data: sequences } = useQuery<any[]>({ queryKey: ["/api/intelligence/sequences"], enabled: tab === "Sequences" });
  const { data: intentData } = useQuery<any[]>({ queryKey: ["/api/intelligence/intent"], enabled: tab === "Intent Signals" });
  const { data: visitors } = useQuery<any[]>({ queryKey: ["/api/intelligence/visitors"], enabled: tab === "Visitors" });

  const runSearch = async () => {
    setSearching(true);
    try {
      await apiRequest("POST", "/api/intelligence/prospects/search", { filters: searchForm, limit: 25, enrichmentDepth: searchForm.enrichmentDepth });
      qc.invalidateQueries({ queryKey: ["/api/intelligence/prospects"] });
      qc.invalidateQueries({ queryKey: ["/api/intelligence/stats"] });
      setSearchModal(false);
    } finally { setSearching(false); }
  };

  const toLeadMut = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/intelligence/prospects/${id}/to-lead`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/leads"] }); qc.invalidateQueries({ queryKey: ["/api/intelligence/prospects"] }); }
  });
  const toContactMut = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/intelligence/prospects/${id}/to-contact`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/contacts"] }); }
  });
  const delProspectMut = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/intelligence/prospects/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/intelligence/prospects"] })
  });

  const createSequence = async () => {
    await apiRequest("POST", "/api/intelligence/sequences/generate", seqForm);
    qc.invalidateQueries({ queryKey: ["/api/intelligence/sequences"] });
    setSequenceModal(false);
  };

  const buildOrg = async () => {
    const result = await apiRequest<any[]>("POST", "/api/intelligence/org-chart", orgForm);
    setOrgChart(result);
    setOrgModal(false);
  };

  const findEmail = async () => {
    const result = await apiRequest<any>("POST", "/api/intelligence/email-finder", emailForm);
    setEmailResult(result);
  };

  return (
    <Layout
      title={t("intelligence_title")}
      subtitle={t("intelligence_subtitle")}
      actions={
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setEmailFinderModal(true)}><Mail size={14} /> Email Finder</button>
          <button className="btn btn-secondary btn-sm" onClick={() => { setOrgForm({ company: "", domain: "", focusDepartment: "" }); setOrgModal(true); }}><Users size={14} /> Org Chart</button>
          <button className="btn btn-primary btn-sm" onClick={() => setSearchModal(true)}><Zap size={14} /> Find Prospects</button>
        </div>
      }
    >
      {/* Stats bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Prospects", value: stats?.prospects?.total || 0, sub: `Avg score: ${stats?.prospects?.avgScore || 0}`, color: "#3b82f6", icon: Users },
          { label: "Companies", value: stats?.companies || 0, sub: "Enriched", color: "#8b5cf6", icon: Building2 },
          { label: "Sequences", value: stats?.sequences || 0, sub: "Active", color: "#10b981", icon: Layers },
          { label: "Intent Signals", value: stats?.intentSignals || 0, sub: "Buying indicators", color: "#f59e0b", icon: TrendingUp },
          { label: "Website Visitors", value: stats?.visitors || 0, sub: "Identified companies", color: "#06b6d4", icon: Eye },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card" style={{ padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={15} style={{ color: s.color }} />
                </div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{s.value.toLocaleString()}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)" }}>{s.label}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }} className="no-scrollbar">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`btn btn-sm ${tab === t ? "btn-primary" : "btn-secondary"}`} style={{ whiteSpace: "nowrap", flexShrink: 0 }}>
            {t}
          </button>
        ))}
      </div>

      {/* ── PROSPECTS TAB ── */}
      {tab === "Prospects" && (
        <div>
          {/* Search bar */}
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
              <input className="input" placeholder="Search by name, email, company, title..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setSearchModal(true)}><Filter size={14} /> Filter</button>
            <button className="btn btn-ghost btn-sm" onClick={() => { apiRequest("GET", "/api/intelligence/export").then(() => {}); }} title="Export CSV"><Download size={14} /></button>
          </div>

          <div className="card" style={{ overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 160px 100px 80px 100px 120px", padding: "10px 16px", borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
              {["Prospect", "Company", "Score", "Intent", "Status", "Actions"].map(h => (
                <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</span>
              ))}
            </div>

            {!prospectsData?.data?.length ? (
              <Empty icon={Users} title="No prospects yet"
                desc="Click 'Find Prospects' to search the B2B database and discover your ideal customers"
                action={<button className="btn btn-primary" onClick={() => setSearchModal(true)}><Zap size={15} /> Find Prospects</button>}
              />
            ) : prospectsData.data.map((p: any) => (
              <div key={p.id} className="table-row" style={{ gridTemplateColumns: "1fr 160px 100px 80px 100px 120px", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Avatar name={`${p.firstName} ${p.lastName}`} size={32} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{p.firstName} {p.lastName}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                      {p.jobTitle}
                      {p.linkedinUrl && <Linkedin size={11} style={{ color: "#0077b5" }} />}
                    </div>
                    {p.email && <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}><Mail size={10} />{p.email}</div>}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{p.company}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                    <MapPin size={10} />{p.city}{p.country ? `, ${p.country}` : ""}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 36, height: 5, borderRadius: 3, background: "var(--bg-overlay)" }}>
                    <div style={{ width: `${p.score}%`, height: "100%", borderRadius: 3, background: SCORE_COLOR(p.score) }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: SCORE_COLOR(p.score) }}>{p.score}</span>
                </div>
                <div>
                  {p.intentScore > 60 ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", animation: "pulse 2s infinite" }} />
                      <span style={{ fontSize: 12, color: "#10b981", fontWeight: 600 }}>High</span>
                    </div>
                  ) : (
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{p.intentScore}</span>
                  )}
                </div>
                <div><span className={`badge ${STATUS_BADGE[p.outreachStatus] || "badge-gray"}`}>{(p.outreachStatus || "new").replace("_", " ")}</span></div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button className="btn btn-primary btn-sm" style={{ fontSize: 11, padding: "4px 8px" }}
                    disabled={!!p.importedAsLeadId}
                    onClick={() => !p.importedAsLeadId && toLeadMut.mutate(p.id)}
                    title="Add to CRM as Lead"
                  >
                    {p.importedAsLeadId ? <Check size={12} /> : "→ Lead"}
                  </button>
                  <button className="btn btn-secondary btn-sm" style={{ fontSize: 11, padding: "4px 8px" }}
                    disabled={!!p.importedAsContactId}
                    onClick={() => !p.importedAsContactId && toContactMut.mutate(p.id)}
                    title="Add to CRM as Contact"
                  >
                    {p.importedAsContactId ? <Check size={12} /> : "Contact"}
                  </button>
                </div>
              </div>
            ))}
          </div>
          {prospectsData && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8, textAlign: "right" }}>{prospectsData.total} total prospects in database</div>}
        </div>
      )}

      {/* ── COMPANIES TAB ── */}
      {tab === "Companies" && (
        <div>
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
              <input id="enrich-domain-input" className="input" placeholder="Enter domain to enrich (e.g. yourprospect.com)" style={{ paddingLeft: 36 }} />
            </div>
            <button className="btn btn-primary btn-sm" onClick={async () => {
              const val = (document.getElementById("enrich-domain-input") as HTMLInputElement)?.value?.trim();
              if (!val) { toast.warning("Please enter a company domain or name to enrich."); return; }
              const isDomain = val.includes(".");
              await apiRequest("POST", "/api/intelligence/companies/enrich", isDomain ? { domain: val } : { name: val });
              qc.invalidateQueries({ queryKey: ["/api/intelligence/companies"] });
            }}><Zap size={14} /> Enrich Company</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 14 }}>
            {!companiesData?.data?.length ? (
              <div style={{ gridColumn: "1/-1" }}>
                <Empty icon={Building2} title="No companies enriched yet"
                  desc="Enrich a company to see their full profile — size, tech stack, funding, and key contacts"
                />
              </div>
            ) : companiesData.data.map((c: any) => (
              <div key={c.id} className="card" style={{ padding: 16 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{c.domain}</div>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: SCORE_COLOR(c.score || 0) }}>{c.score}</div>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                  {c.industry && <span className="badge badge-blue">{c.industry}</span>}
                  {c.size && <span className="badge badge-gray">{c.size} emp</span>}
                  {c.fundingStage && <span className="badge badge-purple">{c.fundingStage}</span>}
                  {c.revenue && <span className="badge badge-green">{c.revenue}</span>}
                </div>
                {c.techStack?.length > 0 && (
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    <strong>Tech:</strong> {c.techStack.slice(0, 4).join(", ")}
                  </div>
                )}
                {c.description && <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "8px 0 0", lineHeight: 1.5 }}>{c.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SEQUENCES TAB ── */}
      {tab === "Sequences" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
            <button className="btn btn-primary btn-sm" onClick={() => setSequenceModal(true)}><Plus size={14} /> Generate Sequence</button>
          </div>
          {!sequences?.length ? (
            <Empty icon={Layers} title="No sequences yet"
              desc="Generate AI-powered multi-touch outreach sequences personalized for your target persona"
              action={<button className="btn btn-primary" onClick={() => setSequenceModal(true)}><Plus size={15} /> Generate Sequence</button>}
            />
          ) : sequences.map((s: any) => (
            <div key={s.id} className="card" style={{ padding: "16px 20px", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.description}</div>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span className={`badge ${s.status === "active" ? "badge-green" : "badge-gray"}`}>{s.status}</span>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.steps?.length || 0} steps</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, overflowX: "auto" }} className="no-scrollbar">
                {(s.steps || []).map((step: any, i: number) => (
                  <div key={i} style={{ flexShrink: 0, background: "var(--bg-overlay)", borderRadius: 8, padding: "8px 12px", minWidth: 120 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>Day {step.delayDays}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                      {step.type === "email" ? <Mail size={11} style={{ color: "#3b82f6" }} /> : step.type === "linkedin" ? <Linkedin size={11} style={{ color: "#0077b5" }} /> : step.type === "call" ? <Phone size={11} style={{ color: "#10b981" }} /> : <Briefcase size={11} />}
                      {step.type.charAt(0).toUpperCase() + step.type.slice(1)}
                    </div>
                    {step.subject && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 120 }}>{step.subject}</div>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── INTENT SIGNALS TAB ── */}
      {tab === "Intent Signals" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
            <button className="btn btn-primary btn-sm" onClick={async () => {
              await apiRequest("POST", "/api/intelligence/intent", { companyName: "Target Company", companyDomain: "target.com" });
              qc.invalidateQueries({ queryKey: ["/api/intelligence/intent"] });
            }}><RefreshCw size={14} /> Scan for Signals</button>
          </div>
          {!intentData?.length ? (
            <Empty icon={TrendingUp} title="No intent signals yet" desc="Intent signals show which companies are actively researching topics related to your product — a powerful buying indicator" />
          ) : intentData.map((s: any) => (
            <div key={s.id} className="card" style={{ padding: "14px 16px", marginBottom: 8, display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 50, height: 50, borderRadius: 12, background: `${s.strength > 70 ? "#10b981" : s.strength > 50 ? "#f59e0b" : "#64748b"}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <TrendingUp size={20} style={{ color: s.strength > 70 ? "#10b981" : s.strength > 50 ? "#f59e0b" : "#64748b" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{s.companyName || s.companyDomain}</div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{s.topic}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{s.description}</div>
              </div>
              <div style={{ textAlign: "center", flexShrink: 0 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.strength > 70 ? "#10b981" : "#f59e0b" }}>{s.strength}</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600 }}>SCORE</div>
              </div>
              <div style={{ flexShrink: 0 }}>
                <span className="badge badge-gray">{s.signalType?.replace("_", " ")}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── VISITORS TAB ── */}
      {tab === "Visitors" && (
        <div>
          {!visitors?.length ? (
            <Empty icon={Eye} title="No identified visitors yet" desc="Website visitor intelligence de-anonymizes your B2B traffic, showing which companies are browsing your site" />
          ) : (
            <div className="card" style={{ overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 80px 100px 80px", padding: "10px 16px", borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
                {["Company", "Location", "Pages", "Time", "Score"].map(h => (
                  <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</span>
                ))}
              </div>
              {visitors.map((v: any) => (
                <div key={v.id} className="table-row" style={{ gridTemplateColumns: "1fr 120px 80px 100px 80px", gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{v.companyName || "Unknown"}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{v.companyDomain}</div>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{v.city}{v.country ? `, ${v.country}` : ""}</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{v.pages?.length || 0}</div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{Math.round((v.totalTimeOnSite || 0) / 60)}m</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: SCORE_COLOR(v.score || 0) }}>{v.score || 0}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ORG CHARTS TAB ── */}
      {tab === "Org Charts" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
            <button className="btn btn-primary btn-sm" onClick={() => setOrgModal(true)}><Users size={14} /> Build Org Chart</button>
          </div>
          {orgChart.length === 0 ? (
            <Empty icon={Users} title="No org charts yet" desc="Map the decision-making hierarchy of your target accounts to find the right buyer faster" action={<button className="btn btn-primary" onClick={() => setOrgModal(true)}><Users size={15} /> Build Org Chart</button>} />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12 }}>
              {orgChart.map((p: any, i: number) => (
                <div key={i} className="card" style={{ padding: 14, borderLeft: `3px solid ${p.isDecisionMaker ? "#3b82f6" : "#64748b"}` }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{p.title}</div>
                  {p.reportsTo && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>↑ {p.reportsTo}</div>}
                  <div style={{ marginTop: 6 }}>
                    {p.isDecisionMaker && <span className="badge badge-blue">Decision Maker</span>}
                    <span className="badge badge-gray" style={{ marginLeft: 4 }}>{p.seniority}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ MODALS ═══ */}

      {/* Prospect Search Modal */}
      <Modal open={searchModal} onClose={() => setSearchModal(false)} title="🔍 Find Prospects" width={560}>
        <div style={{ padding: "20px", display: "grid", gap: 14 }}>
          <div style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#93c5fd" }}>
            Our AI searches millions of B2B profiles to find your ideal customers.
          </div>
          <FormRow label="Target Industries">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", padding: 8, background: "var(--bg-overlay)", borderRadius: 8 }}>
              {INDUSTRIES.map(ind => (
                <button key={ind} type="button"
                  onClick={() => setSearchForm(p => ({
                    ...p, industries: (p.industries as string[]).includes(ind)
                      ? (p.industries as string[]).filter(i => i !== ind)
                      : [...(p.industries as string[]), ind]
                  }))}
                  style={{ padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1px solid", transition: "all 0.1s",
                    background: (searchForm.industries as string[]).includes(ind) ? "rgba(59,130,246,0.2)" : "transparent",
                    color: (searchForm.industries as string[]).includes(ind) ? "#60a5fa" : "var(--text-muted)",
                    borderColor: (searchForm.industries as string[]).includes(ind) ? "#3b82f6" : "var(--border)"
                  }}
                >{ind}</button>
              ))}
            </div>
          </FormRow>
          <FormRow label="Job Titles (comma-separated)">
            <input className="input" value={(searchForm.titles as string[]).join(", ")}
              onChange={e => setSearchForm(p => ({ ...p, titles: e.target.value.split(",").map(t => t.trim()).filter(Boolean) }))}
              placeholder="VP Sales, Head of Marketing, CTO" />
          </FormRow>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FormRow label="Seniority">
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {SENIORITIES.map(s => (
                  <button key={s} type="button"
                    onClick={() => setSearchForm(p => ({
                      ...p, seniorities: (p.seniorities as string[]).includes(s)
                        ? (p.seniorities as string[]).filter(x => x !== s) : [...(p.seniorities as string[]), s]
                    }))}
                    style={{ padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid",
                      background: (searchForm.seniorities as string[]).includes(s) ? "rgba(139,92,246,0.2)" : "transparent",
                      color: (searchForm.seniorities as string[]).includes(s) ? "#a78bfa" : "var(--text-muted)",
                      borderColor: (searchForm.seniorities as string[]).includes(s) ? "#8b5cf6" : "var(--border)"
                    }}
                  >{s}</button>
                ))}
              </div>
            </FormRow>
            <FormRow label="Company Size">
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {COMPANY_SIZES.map(s => (
                  <button key={s} type="button"
                    onClick={() => setSearchForm(p => ({
                      ...p, companySizes: (p.companySizes as string[]).includes(s)
                        ? (p.companySizes as string[]).filter(x => x !== s) : [...(p.companySizes as string[]), s]
                    }))}
                    style={{ padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid",
                      background: (searchForm.companySizes as string[]).includes(s) ? "rgba(16,185,129,0.2)" : "transparent",
                      color: (searchForm.companySizes as string[]).includes(s) ? "#34d399" : "var(--text-muted)",
                      borderColor: (searchForm.companySizes as string[]).includes(s) ? "#10b981" : "var(--border)"
                    }}
                  >{s}</button>
                ))}
              </div>
            </FormRow>
          </div>
          <FormRow label="Technologies Used (e.g., Salesforce, HubSpot)">
            <input className="input" value={(searchForm.technologies as string[]).join(", ")}
              onChange={e => setSearchForm(p => ({ ...p, technologies: e.target.value.split(",").map(t => t.trim()).filter(Boolean) }))}
              placeholder="Salesforce, Slack, AWS..." />
          </FormRow>
          <FormRow label="Enrichment Depth">
            <Select options={[{ value: "basic", label: "Basic (fast)" }, { value: "standard", label: "Standard (recommended)" }, { value: "full", label: "Full (with intent signals)" }]}
              value={searchForm.enrichmentDepth}
              onChange={e => setSearchForm(p => ({ ...p, enrichmentDepth: e.target.value }))} />
          </FormRow>
        </div>
        <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="btn btn-secondary" onClick={() => setSearchModal(false)}>Cancel</button>
          <button className="btn btn-primary" disabled={searching} onClick={runSearch} style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)" }}>
            {searching ? <><span className="spinner" style={{ width: 14, height: 14 }} />Searching...</> : <><Zap size={14} /> Find Prospects</>}
          </button>
        </div>
      </Modal>

      {/* Sequence Generator Modal */}
      <Modal open={sequenceModal} onClose={() => setSequenceModal(false)} title="Generate Outreach Sequence">
        <div style={{ padding: "20px", display: "grid", gap: 12 }}>
          <FormRow label="Sequence name"><input className="input" value={seqForm.name} onChange={e => setSeqForm(p => ({ ...p, name: e.target.value }))} placeholder="Cold Outreach - VP Sales SaaS" /></FormRow>
          <FormRow label="Target persona"><input className="input" value={seqForm.targetPersona} onChange={e => setSeqForm(p => ({ ...p, targetPersona: e.target.value }))} placeholder="VP of Sales at 50-200 person SaaS companies" /></FormRow>
          <FormRow label="Your product/offer"><input className="input" value={seqForm.product} onChange={e => setSeqForm(p => ({ ...p, product: e.target.value }))} /></FormRow>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FormRow label="Tone"><Select options={[{ value: "professional", label: "Professional" }, { value: "friendly", label: "Friendly" }, { value: "direct", label: "Direct" }]} value={seqForm.tone} onChange={e => setSeqForm(p => ({ ...p, tone: e.target.value }))} /></FormRow>
            <FormRow label="Steps"><Select options={[3, 4, 5, 6, 7].map(n => ({ value: String(n), label: `${n} touches` }))} value={String(seqForm.steps)} onChange={e => setSeqForm(p => ({ ...p, steps: Number(e.target.value) }))} /></FormRow>
          </div>
        </div>
        <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="btn btn-secondary" onClick={() => setSequenceModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={createSequence}><Zap size={14} /> Generate Sequence</button>
        </div>
      </Modal>

      {/* Org Chart Modal */}
      <Modal open={orgModal} onClose={() => setOrgModal(false)} title="Build Org Chart">
        <div style={{ padding: "20px", display: "grid", gap: 12 }}>
          <FormRow label="Company name" required><input className="input" value={orgForm.company} onChange={e => setOrgForm(p => ({ ...p, company: e.target.value }))} required /></FormRow>
          <FormRow label="Domain (optional)"><input className="input" value={orgForm.domain} onChange={e => setOrgForm(p => ({ ...p, domain: e.target.value }))} placeholder="company.com" /></FormRow>
          <FormRow label="Focus department"><input className="input" value={orgForm.focusDepartment} onChange={e => setOrgForm(p => ({ ...p, focusDepartment: e.target.value }))} placeholder="Sales, Marketing, Engineering..." /></FormRow>
        </div>
        <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="btn btn-secondary" onClick={() => setOrgModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={buildOrg}><Users size={14} /> Build Org Chart</button>
        </div>
      </Modal>

      {/* Email Finder Modal */}
      <Modal open={emailFinderModal} onClose={() => setEmailFinderModal(false)} title="Email Finder & Verifier">
        <div style={{ padding: "20px", display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FormRow label="First name"><input className="input" value={emailForm.firstName} onChange={e => setEmailForm(p => ({ ...p, firstName: e.target.value }))} /></FormRow>
            <FormRow label="Last name"><input className="input" value={emailForm.lastName} onChange={e => setEmailForm(p => ({ ...p, lastName: e.target.value }))} /></FormRow>
          </div>
          <FormRow label="Company domain" required><input className="input" value={emailForm.domain} onChange={e => setEmailForm(p => ({ ...p, domain: e.target.value }))} placeholder="company.com" required /></FormRow>
          {emailResult && (
            <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#34d399", marginBottom: 4 }}>{emailResult.email}</div>
              <div style={{ display: "flex", gap: 10, fontSize: 13, color: "var(--text-secondary)" }}>
                <span>Status: <strong>{emailResult.status}</strong></span>
                <span>Confidence: <strong>{emailResult.confidence}%</strong></span>
                <span>Pattern: <strong>{emailResult.pattern}</strong></span>
              </div>
            </div>
          )}
        </div>
        <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="btn btn-secondary" onClick={() => { setEmailFinderModal(false); setEmailResult(null); }}>Close</button>
          <button className="btn btn-primary" onClick={findEmail} disabled={!emailForm.domain}><Mail size={14} /> Find Email</button>
        </div>
      </Modal>
    </Layout>
  );
}
