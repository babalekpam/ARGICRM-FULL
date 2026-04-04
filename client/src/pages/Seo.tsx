import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "../components/Layout";
import { useLanguage } from "../contexts/LanguageContext";
import { Modal, FormRow, Empty, Loader, Badge } from "../components/UI";
import { apiRequest } from "../lib/api";
import { Search, Plus, TrendingUp, Link, AlertCircle, Zap, BarChart2, BookOpen, Globe, Target, RefreshCw, Trash2, Tag, Code2, Copy, Check } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";

const TABS = ["Keywords", "Site Audit", "Backlinks", "Competitor", "Content Ideas", "Meta Tags", "Schema"] as const;
const DIFF_COLOR = (d: number) => d >= 70 ? "#ef4444" : d >= 40 ? "#f59e0b" : "#10b981";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button className="btn btn-secondary btn-sm" onClick={copy} style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export default function SeoPage() {
  const qc = useQueryClient();
  const { t } = useLanguage();
  const [tab, setTab] = useState<typeof TABS[number]>("Keywords");
  const [projectModal, setProjectModal] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: "", domain: "", country: "US" });
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [researchForm, setResearchForm] = useState({ seed: "", count: 20 });
  const [auditDomain, setAuditDomain] = useState("");
  const [competitorForm, setCompetitorForm] = useState({ domain: "", competitor: "" });
  const [contentForm, setContentForm] = useState({ topic: "", audience: "", count: 10 });
  const [backlinksForm, setBacklinksForm] = useState({ domain: "" });
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [auditResult, setAuditResult] = useState<any>(null);
  const [competitorResult, setCompetitorResult] = useState<any>(null);
  const [contentIdeas, setContentIdeas] = useState<any[]>([]);

  // Meta Tags state
  const [metaForm, setMetaForm] = useState({ pageTitle: "", pageDescription: "", url: "", keywords: "", pageType: "website", brand: "" });
  const [metaResult, setMetaResult] = useState<any>(null);

  // Schema Builder state
  const SCHEMA_TYPES = ["Organization", "LocalBusiness", "Article", "Product", "FAQ", "BreadcrumbList", "SoftwareApplication"] as const;
  const [schemaType, setSchemaType] = useState<string>("Organization");
  const [schemaData, setSchemaData] = useState<Record<string, any>>({});
  const [schemaResult, setSchemaResult] = useState<any>(null);
  const [faqItems, setFaqItems] = useState([{ question: "", answer: "" }]);
  const [breadcrumbs, setBreadcrumbs] = useState([{ name: "", url: "" }]);

  const { data: stats } = useQuery<any>({ queryKey: ["/api/seo/stats"] });
  const { data: projectsList } = useQuery<any[]>({ queryKey: ["/api/seo/projects"] });
  const { data: keywordsData } = useQuery<{ data: any[]; total: number }>({ queryKey: [`/api/seo/keywords${selectedProject ? `?projectId=${selectedProject}` : ""}`], enabled: tab === "Keywords" });
  const { data: backlinksData } = useQuery<{ data: any[]; total: number }>({ queryKey: ["/api/seo/backlinks"], enabled: tab === "Backlinks" });
  const { data: audits } = useQuery<any[]>({ queryKey: ["/api/seo/audits"], enabled: tab === "Site Audit" });

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiRequest("POST", "/api/seo/projects", projectForm);
    qc.invalidateQueries({ queryKey: ["/api/seo/projects"] });
    setProjectModal(false);
  };

  const withRun = async (fn: () => Promise<void>) => {
    setRunning(true);
    setRunError(null);
    try { await fn(); }
    catch (e: any) { setRunError(e?.message || "Something went wrong. Check your AI configuration in Settings."); }
    finally { setRunning(false); }
  };

  const runResearch = () => withRun(async () => {
    if (!researchForm.seed) return;
    await apiRequest("POST", "/api/seo/keywords/research", { ...researchForm, projectId: selectedProject || null });
    qc.invalidateQueries({ queryKey: ["/api/seo/keywords"] });
    qc.invalidateQueries({ queryKey: ["/api/seo/stats"] });
  });

  const runAudit = () => withRun(async () => {
    if (!auditDomain) return;
    const result = await apiRequest<any>("POST", "/api/seo/audit", { domain: auditDomain, projectId: selectedProject || null });
    setAuditResult(result);
    qc.invalidateQueries({ queryKey: ["/api/seo/audits"] });
    qc.invalidateQueries({ queryKey: ["/api/seo/stats"] });
  });

  const runCompetitor = () => withRun(async () => {
    if (!competitorForm.domain || !competitorForm.competitor) return;
    setCompetitorResult(await apiRequest<any>("POST", "/api/seo/competitor/analyze", competitorForm));
  });

  const runContent = () => withRun(async () => {
    if (!contentForm.topic) return;
    setContentIdeas(await apiRequest<any[]>("POST", "/api/seo/content/ideas", { ...contentForm, projectId: selectedProject || null }));
  });

  const runBacklinks = () => withRun(async () => {
    if (!backlinksForm.domain) return;
    await apiRequest("POST", "/api/seo/backlinks/analyze", { domain: backlinksForm.domain, projectId: selectedProject || null });
    qc.invalidateQueries({ queryKey: ["/api/seo/backlinks"] });
  });

  const deleteKw = async (id: string) => {
    await apiRequest("DELETE", `/api/seo/keywords/${id}`);
    qc.invalidateQueries({ queryKey: ["/api/seo/keywords"] });
  };

  const runMetaTags = () => withRun(async () => {
    if (!metaForm.pageTitle) return;
    const result = await apiRequest<any>("POST", "/api/seo/meta-tags/generate", metaForm);
    setMetaResult(result);
  });

  const runSchema = () => withRun(async () => {
    const payload = schemaType === "FAQ"
      ? { ...schemaData, faqs: faqItems }
      : schemaType === "BreadcrumbList"
      ? { ...schemaData, items: breadcrumbs }
      : schemaData;
    const result = await apiRequest<any>("POST", "/api/seo/schema/generate", { schemaType, data: payload });
    setSchemaResult(result);
  });

  const sd = (field: string, value: any) => setSchemaData(p => ({ ...p, [field]: value }));

  const SEVERITY_COLORS: Record<string, string> = { critical: "#ef4444", warning: "#f59e0b", passed: "#10b981" };

  return (
    <Layout title={t("seo_title")} subtitle={t("seo_subtitle")}
      actions={<button className="btn btn-primary btn-sm" onClick={() => setProjectModal(true)}><Plus size={14} /> New Project</button>}
    >
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Projects", value: stats?.projects || 0, icon: Globe, color: "#3b82f6" },
          { label: "Keywords", value: stats?.keywords?.total || 0, sub: `Avg vol: ${stats?.keywords?.avgVolume || 0}`, icon: Search, color: "#8b5cf6" },
          { label: "Avg Difficulty", value: stats?.keywords?.avgDifficulty || 0, sub: "Keyword competition", icon: Target, color: "#f59e0b" },
          { label: "Backlinks", value: stats?.backlinks?.total || 0, sub: `Avg DA: ${stats?.backlinks?.avgDA || 0}`, icon: Link, color: "#10b981" },
          { label: "SEO Score", value: stats?.latestScore ? `${stats.latestScore}/100` : "—", sub: "Latest audit", icon: BarChart2, color: "#06b6d4" },
        ].map(s => { const Icon = s.icon; return (
          <div key={s.label} className="card" style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={14} style={{ color: s.color }} />
              </div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{s.value}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)" }}>{s.label}</div>
            {s.sub && <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{s.sub}</div>}
          </div>
        );})}
      </div>

      {/* Error banner */}
      {runError && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
          <AlertCircle size={16} style={{ color: "#ef4444", flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: "#ef4444" }}>Action failed</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{runError}</div>
          </div>
          <button onClick={() => setRunError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0 }}>
            <AlertCircle size={14} />
          </button>
        </div>
      )}

      {/* Project selector */}
      {(projectsList?.length || 0) > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <button onClick={() => setSelectedProject("")} className={`btn btn-sm ${!selectedProject ? "btn-primary" : "btn-secondary"}`}>All Projects</button>
          {projectsList?.map(p => (
            <button key={p.id} onClick={() => setSelectedProject(p.id)} className={`btn btn-sm ${selectedProject === p.id ? "btn-primary" : "btn-secondary"}`}><Globe size={12} /> {p.name}</button>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {TABS.map(t => <button key={t} onClick={() => setTab(t)} className={`btn btn-sm ${tab === t ? "btn-primary" : "btn-secondary"}`}>{t}</button>)}
      </div>

      {/* ── KEYWORDS ── */}
      {tab === "Keywords" && (
        <div>
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <input className="input" placeholder="Seed keyword (e.g. CRM software)" value={researchForm.seed}
              onChange={e => setResearchForm(p => ({ ...p, seed: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && runResearch()} style={{ flex: 1 }} />
            <select className="input" value={researchForm.count} onChange={e => setResearchForm(p => ({ ...p, count: Number(e.target.value) }))} style={{ width: 90 }}>
              {[10, 20, 50].map(n => <option key={n} value={n}>{n} results</option>)}
            </select>
            <button className="btn btn-primary" disabled={running || !researchForm.seed} onClick={runResearch}>
              {running ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Search size={14} />} Research
            </button>
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {!keywordsData?.data?.length ? (
              <Empty icon={Search} title="No keywords yet" desc='Enter a seed keyword above and click "Research" to discover keyword opportunities' />
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", minWidth: 620, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)" }}>
                      {[
                        { label: "Keyword",       w: "auto" },
                        { label: "Volume",         w: 100 },
                        { label: "Difficulty",     w: 130 },
                        { label: "CPC",            w: 80 },
                        { label: "Intent",         w: 110 },
                        { label: "Rank",           w: 70 },
                        { label: "",               w: 44 },
                      ].map(h => (
                        <th key={h.label} style={{ width: h.w, padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                          {h.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {keywordsData.data.map((kw: any, i: number) => (
                      <tr key={kw.id} style={{ borderBottom: i < keywordsData.data.length - 1 ? "1px solid var(--border)" : "none", transition: "background 0.1s" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-hover)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>{kw.keyword}</span>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: "#3b82f6" }}>{Number(kw.searchVolume || 0).toLocaleString()}</span>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ flex: 1, maxWidth: 60, height: 6, borderRadius: 4, background: "var(--bg-overlay)", overflow: "hidden" }}>
                              <div style={{ width: `${Math.min(kw.difficulty, 100)}%`, height: "100%", borderRadius: 4, background: DIFF_COLOR(kw.difficulty) }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: DIFF_COLOR(kw.difficulty), minWidth: 24 }}>{kw.difficulty}</span>
                          </div>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>${Number(kw.cpc || 0).toFixed(2)}</span>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{
                            display: "inline-block", padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                            background: kw.intent === "transactional" ? "rgba(16,185,129,0.12)" : kw.intent === "commercial" ? "rgba(59,130,246,0.12)" : kw.intent === "navigational" ? "rgba(139,92,246,0.12)" : "var(--bg-elevated)",
                            color: kw.intent === "transactional" ? "#10b981" : kw.intent === "commercial" ? "#3b82f6" : kw.intent === "navigational" ? "#8b5cf6" : "var(--text-muted)",
                          }}>
                            {kw.intent || "—"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: kw.currentRank ? "var(--text-primary)" : "var(--text-muted)" }}>
                            {kw.currentRank ? `#${kw.currentRank}` : "—"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 8px", textAlign: "center" }}>
                          <button className="btn btn-ghost btn-sm" style={{ padding: "4px 6px", color: "#ef4444" }} onClick={() => deleteKw(kw.id)} title="Delete">
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {keywordsData && keywordsData.total > 0 && (
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8, textAlign: "right" }}>
              {keywordsData.total} keyword{keywordsData.total !== 1 ? "s" : ""} tracked
            </div>
          )}
        </div>
      )}

      {/* ── SITE AUDIT ── */}
      {tab === "Site Audit" && (
        <div>
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <input className="input" placeholder="Domain to audit (e.g. mysite.com)" value={auditDomain} onChange={e => setAuditDomain(e.target.value)} style={{ flex: 1 }} />
            <button className="btn btn-primary" disabled={running || !auditDomain} onClick={runAudit}>{running ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Zap size={14} />} Run Audit</button>
          </div>

          {auditResult && (
            <div>
              {/* Score + summary row */}
              <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
                <div className="card" style={{ padding: 20, textAlign: "center", minWidth: 120 }}>
                  <div style={{ fontSize: 48, fontWeight: 800, color: auditResult.score >= 70 ? "#10b981" : auditResult.score >= 40 ? "#f59e0b" : "#ef4444" }}>{auditResult.score}</div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>SEO Score</div>
                  {auditResult.pagesChecked > 0 && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{auditResult.pagesChecked} pages crawled</div>}
                </div>
                <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, minWidth: 260 }}>
                  {[
                    { label: "Critical Issues", value: auditResult.summary?.critical || 0, color: "#ef4444" },
                    { label: "Warnings",         value: auditResult.summary?.warnings || 0, color: "#f59e0b" },
                    { label: "Passed Checks",    value: auditResult.summary?.passed   || 0, color: "#10b981" },
                  ].map(s => (
                    <div key={s.label} className="card" style={{ padding: 16 }}>
                      <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Issues list */}
              <div style={{ display: "grid", gap: 10 }}>
                {(auditResult.issues || []).map((issue: any, i: number) => (
                  <div key={i} className="card" style={{ padding: "14px 16px", borderLeft: `3px solid ${SEVERITY_COLORS[issue.severity] || "#64748b"}` }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>
                        {issue.type.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                      </div>
                      <span className={`badge ${issue.severity === "critical" ? "badge-red" : "badge-amber"}`}>{issue.severity}</span>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>{issue.description}</div>
                    {issue.urls?.length > 0 && (
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 5, lineHeight: 1.6 }}>
                        <strong>Affected:</strong> {issue.urls.slice(0, 5).join("  ·  ")}
                        {issue.urls.length > 5 && <span> + {issue.urls.length - 5} more</span>}
                      </div>
                    )}
                    {issue.recommendation && (
                      <div style={{ fontSize: 12, color: "#06b6d4", marginTop: 6, display: "flex", alignItems: "flex-start", gap: 5 }}>
                        <span style={{ flexShrink: 0, marginTop: 1 }}>→</span>
                        <span>{issue.recommendation}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!auditResult && audits?.length === 0 && <Empty icon={AlertCircle} title="No audits yet" desc='Enter a domain above and click "Run Audit"' />}
          {!auditResult && (audits?.length || 0) > 0 && (
            <div style={{ display: "grid", gap: 10 }}>
              {audits!.map((a: any) => (
                <div key={a.id} className="card" style={{ padding: 16, cursor: "pointer" }} onClick={() => setAuditResult(a)}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>Audit — {new Date(a.crawledAt).toLocaleDateString()}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{a.summary?.critical} critical · {a.summary?.warnings} warnings · {a.summary?.passed} passed</div>
                    </div>
                    <div style={{ fontSize: 32, fontWeight: 800, color: a.score >= 70 ? "#10b981" : "#f59e0b" }}>{a.score}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── BACKLINKS ── */}
      {tab === "Backlinks" && (
        <div>
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <input className="input" placeholder="Domain (e.g. mysite.com)" value={backlinksForm.domain} onChange={e => setBacklinksForm(p => ({ ...p, domain: e.target.value }))} style={{ flex: 1 }} />
            <button className="btn btn-primary" disabled={running || !backlinksForm.domain} onClick={runBacklinks}>{running ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Link size={14} />} Analyze Backlinks</button>
          </div>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {!backlinksData?.data?.length ? (
              <Empty icon={Link} title="No backlinks yet" desc='Enter your domain and click "Analyze Backlinks"' />
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", minWidth: 540, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)" }}>
                      {[
                        { label: "Source Domain", w: "auto" },
                        { label: "Anchor Text",   w: 160 },
                        { label: "DA",            w: 70 },
                        { label: "PA",            w: 70 },
                        { label: "Type",          w: 100 },
                      ].map(h => (
                        <th key={h.label} style={{ width: h.w, padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                          {h.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {backlinksData.data.map((bl: any, i: number) => (
                      <tr key={bl.id} style={{ borderBottom: i < backlinksData.data.length - 1 ? "1px solid var(--border)" : "none", transition: "background 0.1s" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-hover)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{bl.sourceDomain}</div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 280 }}>{bl.sourceUrl}</div>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ fontSize: 12, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block", maxWidth: 150 }}>{bl.anchorText}</span>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: bl.domainAuthority >= 60 ? "#10b981" : bl.domainAuthority >= 30 ? "#f59e0b" : "#ef4444" }}>{bl.domainAuthority}</span>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{bl.pageAuthority}</span>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{
                            display: "inline-block", padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                            background: bl.isDoFollow ? "rgba(16,185,129,0.12)" : "var(--bg-elevated)",
                            color: bl.isDoFollow ? "#10b981" : "var(--text-muted)",
                          }}>
                            {bl.isDoFollow ? "dofollow" : "nofollow"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {backlinksData && backlinksData.total > 0 && (
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8, textAlign: "right" }}>
              {backlinksData.total} backlink{backlinksData.total !== 1 ? "s" : ""} tracked
            </div>
          )}
        </div>
      )}

      {/* ── COMPETITOR ── */}
      {tab === "Competitor" && (
        <div>
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <input className="input" placeholder="Your domain" value={competitorForm.domain} onChange={e => setCompetitorForm(p => ({ ...p, domain: e.target.value }))} />
            <input className="input" placeholder="Competitor domain" value={competitorForm.competitor} onChange={e => setCompetitorForm(p => ({ ...p, competitor: e.target.value }))} />
            <button className="btn btn-primary" disabled={running || !competitorForm.competitor} onClick={runCompetitor}>{running ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Zap size={14} />} Analyze</button>
          </div>
          {competitorResult ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>Competitor Metrics — {competitorResult.competitor}</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {Object.entries(competitorResult.metrics || {}).map(([k, v]: [string, any]) => (
                    <div key={k} className="card" style={{ padding: "10px 12px", background: "var(--bg-overlay)" }}>
                      <div style={{ fontSize: 18, fontWeight: 800 }}>{typeof v === "number" ? v.toLocaleString() : v}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "capitalize" }}>{k.replace(/([A-Z])/g, " $1")}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: "grid", gap: 12 }}>
                {[
                  { title: "💪 Strengths", items: competitorResult.strengths, color: "#ef4444" },
                  { title: "⚠️ Weaknesses", items: competitorResult.weaknesses, color: "#10b981" },
                  { title: "🎯 Your Opportunities", items: competitorResult.opportunities, color: "#3b82f6" },
                ].map(s => (
                  <div key={s.title} className="card" style={{ padding: 14, borderLeft: `3px solid ${s.color}` }}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>{s.title}</div>
                    {(s.items || []).map((item: string, i: number) => <div key={i} style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>• {item}</div>)}
                  </div>
                ))}
              </div>
            </div>
          ) : <Empty icon={BarChart2} title="No competitor analysis yet" desc="Enter your domain and a competitor domain to get a full comparison" />}
        </div>
      )}

      {/* ── CONTENT IDEAS ── */}
      {tab === "Content Ideas" && (
        <div>
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <input className="input" placeholder="Topic (e.g. B2B CRM)" value={contentForm.topic} onChange={e => setContentForm(p => ({ ...p, topic: e.target.value }))} />
            <input className="input" placeholder="Target audience" value={contentForm.audience} onChange={e => setContentForm(p => ({ ...p, audience: e.target.value }))} />
            <button className="btn btn-primary" disabled={running || !contentForm.topic} onClick={runContent}>{running ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <BookOpen size={14} />} Generate</button>
          </div>
          {contentIdeas.length === 0 ? <Empty icon={BookOpen} title="No content ideas yet" desc="Enter a topic to generate SEO-optimized content ideas" /> : (
            <div style={{ display: "grid", gap: 10 }}>
              {contentIdeas.map((idea: any, i: number) => (
                <div key={i} className="card" style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{idea.title}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Keyword: <strong>{idea.keyword}</strong></div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "var(--brand-light)" }}>{Number(idea.searchVolume || 0).toLocaleString()}</div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)" }}>VOL</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: DIFF_COLOR(idea.difficulty) }}>{idea.difficulty}</div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)" }}>DIFF</div>
                      </div>
                      <span className="badge badge-purple">{idea.contentType}</span>
                    </div>
                  </div>
                  {idea.outline?.length > 0 && (
                    <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {idea.outline.map((s: string, j: number) => <span key={j} style={{ fontSize: 11, padding: "2px 8px", background: "var(--bg-overlay)", borderRadius: 4, color: "var(--text-muted)" }}>{s}</span>)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── META TAGS ── */}
      {tab === "Meta Tags" && (
        <div style={{ display: "grid", gridTemplateColumns: metaResult ? "1fr 1fr" : "1fr", gap: 20 }}>
          {/* Input form */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <Tag size={16} style={{ color: "var(--brand-light)" }} /> Meta Tag Generator
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Page Title *</label>
                <input className="input" placeholder="e.g. Best CRM Software for Agencies" value={metaForm.pageTitle} onChange={e => setMetaForm(p => ({ ...p, pageTitle: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Page Description</label>
                <textarea className="input" rows={3} placeholder="Short description of the page content..." value={metaForm.pageDescription} onChange={e => setMetaForm(p => ({ ...p, pageDescription: e.target.value }))} style={{ resize: "vertical" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Page URL</label>
                  <input className="input" placeholder="https://yoursite.com/page" value={metaForm.url} onChange={e => setMetaForm(p => ({ ...p, url: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Brand Name</label>
                  <input className="input" placeholder="e.g. ARGILETTE" value={metaForm.brand} onChange={e => setMetaForm(p => ({ ...p, brand: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Page Type</label>
                  <select className="input" value={metaForm.pageType} onChange={e => setMetaForm(p => ({ ...p, pageType: e.target.value }))}>
                    {["website", "article", "product", "profile", "video.other"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Focus Keywords</label>
                  <input className="input" placeholder="CRM, agency software, AI" value={metaForm.keywords} onChange={e => setMetaForm(p => ({ ...p, keywords: e.target.value }))} />
                </div>
              </div>
              <button className="btn btn-primary" disabled={running || !metaForm.pageTitle} onClick={runMetaTags} style={{ marginTop: 4 }}>
                {running ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Tag size={14} />} Generate Meta Tags
              </button>
            </div>
          </div>

          {/* Results */}
          {metaResult && (
            <div style={{ display: "grid", gap: 12 }}>
              {/* Preview card */}
              <div className="card" style={{ padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Google Preview</div>
                <div style={{ fontSize: 13, color: "#3b82f6", fontWeight: 600, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{metaResult.title}</div>
                {metaResult.canonical && <div style={{ fontSize: 11, color: "#10b981", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{metaResult.canonical}</div>}
                <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>{metaResult.metaDescription}</div>
              </div>

              {/* All tags with copy */}
              {[
                { label: "Title Tag", value: metaResult.title, tag: `<title>${metaResult.title}</title>` },
                { label: "Meta Description", value: metaResult.metaDescription, tag: `<meta name="description" content="${metaResult.metaDescription}">` },
                { label: "Canonical URL", value: metaResult.canonical, tag: `<link rel="canonical" href="${metaResult.canonical}">` },
                { label: "Robots", value: metaResult.robots, tag: `<meta name="robots" content="${metaResult.robots}">` },
                { label: "OG Title", value: metaResult.ogTitle, tag: `<meta property="og:title" content="${metaResult.ogTitle}">` },
                { label: "OG Description", value: metaResult.ogDescription, tag: `<meta property="og:description" content="${metaResult.ogDescription}">` },
                { label: "Twitter Title", value: metaResult.twitterTitle, tag: `<meta name="twitter:title" content="${metaResult.twitterTitle}">` },
                { label: "Twitter Description", value: metaResult.twitterDescription, tag: `<meta name="twitter:description" content="${metaResult.twitterDescription}">` },
              ].filter(row => row.value).map(row => (
                <div key={row.label} className="card" style={{ padding: "10px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{row.label}</span>
                    <CopyButton text={row.tag} />
                  </div>
                  <code style={{ fontSize: 12, color: "var(--text-secondary)", wordBreak: "break-all", fontFamily: "JetBrains Mono, monospace" }}>{row.tag}</code>
                </div>
              ))}

              {/* Keywords */}
              {metaResult.keywords?.length > 0 && (
                <div className="card" style={{ padding: "10px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Keywords Tag</span>
                    <CopyButton text={`<meta name="keywords" content="${metaResult.keywords.join(", ")}">`} />
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {metaResult.keywords.map((kw: string) => (
                      <span key={kw} style={{ padding: "2px 8px", background: "rgba(99,102,241,0.12)", color: "#818cf8", borderRadius: 12, fontSize: 11, fontWeight: 600 }}>{kw}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Full HTML block */}
              <div className="card" style={{ padding: "10px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Full HTML Block</span>
                  <CopyButton text={[
                    `<title>${metaResult.title}</title>`,
                    `<meta name="description" content="${metaResult.metaDescription}">`,
                    metaResult.canonical ? `<link rel="canonical" href="${metaResult.canonical}">` : "",
                    `<meta name="robots" content="${metaResult.robots}">`,
                    metaResult.keywords?.length ? `<meta name="keywords" content="${metaResult.keywords.join(", ")}">` : "",
                    `<meta property="og:title" content="${metaResult.ogTitle}">`,
                    `<meta property="og:description" content="${metaResult.ogDescription}">`,
                    `<meta name="twitter:title" content="${metaResult.twitterTitle}">`,
                    `<meta name="twitter:description" content="${metaResult.twitterDescription}">`,
                  ].filter(Boolean).join("\n")} />
                </div>
                <pre style={{ fontSize: 11, color: "var(--text-secondary)", overflowX: "auto", margin: 0, fontFamily: "JetBrains Mono, monospace", lineHeight: 1.6 }}>{[
                  `<title>${metaResult.title}</title>`,
                  `<meta name="description" content="${metaResult.metaDescription}">`,
                  metaResult.canonical ? `<link rel="canonical" href="${metaResult.canonical}">` : null,
                  `<meta name="robots" content="${metaResult.robots}">`,
                  metaResult.keywords?.length ? `<meta name="keywords" content="${metaResult.keywords.join(", ")}">` : null,
                  `<meta property="og:title" content="${metaResult.ogTitle}">`,
                  `<meta property="og:description" content="${metaResult.ogDescription}">`,
                  `<meta name="twitter:title" content="${metaResult.twitterTitle}">`,
                  `<meta name="twitter:description" content="${metaResult.twitterDescription}">`,
                ].filter(Boolean).join("\n")}</pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SCHEMA BUILDER ── */}
      {tab === "Schema" && (
        <div style={{ display: "grid", gridTemplateColumns: schemaResult ? "1fr 1fr" : "1fr", gap: 20 }}>
          {/* Input form */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <Code2 size={16} style={{ color: "var(--brand-light)" }} /> Structured Data Builder
            </div>

            {/* Schema type selector */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Schema Type</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {SCHEMA_TYPES.map(t => (
                  <button key={t} onClick={() => { setSchemaType(t); setSchemaData({}); setSchemaResult(null); }}
                    className={`btn btn-sm ${schemaType === t ? "btn-primary" : "btn-secondary"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              {/* Organization fields */}
              {schemaType === "Organization" && (<>
                <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Organization Name *</label><input className="input" value={schemaData.name || ""} onChange={e => sd("name", e.target.value)} placeholder="ARGILETTE LLC" /></div>
                <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Website URL</label><input className="input" value={schemaData.url || ""} onChange={e => sd("url", e.target.value)} placeholder="https://argilette.org" /></div>
                <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Logo URL</label><input className="input" value={schemaData.logo || ""} onChange={e => sd("logo", e.target.value)} placeholder="https://argilette.org/logo.png" /></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Email</label><input className="input" value={schemaData.email || ""} onChange={e => sd("email", e.target.value)} placeholder="info@company.com" /></div>
                  <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Phone</label><input className="input" value={schemaData.telephone || ""} onChange={e => sd("telephone", e.target.value)} placeholder="+1-800-000-0000" /></div>
                </div>
                <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Social Media URLs (one per line)</label><textarea className="input" rows={3} value={schemaData.sameAs || ""} onChange={e => sd("sameAs", e.target.value)} placeholder={"https://twitter.com/company\nhttps://linkedin.com/company/name"} style={{ resize: "vertical" }} /></div>
              </>)}

              {/* LocalBusiness fields */}
              {schemaType === "LocalBusiness" && (<>
                <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Business Name *</label><input className="input" value={schemaData.name || ""} onChange={e => sd("name", e.target.value)} /></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Phone</label><input className="input" value={schemaData.telephone || ""} onChange={e => sd("telephone", e.target.value)} /></div>
                  <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Email</label><input className="input" value={schemaData.email || ""} onChange={e => sd("email", e.target.value)} /></div>
                </div>
                <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Street Address</label><input className="input" value={schemaData.street || ""} onChange={e => sd("street", e.target.value)} /></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>City</label><input className="input" value={schemaData.city || ""} onChange={e => sd("city", e.target.value)} /></div>
                  <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>State/Region</label><input className="input" value={schemaData.region || ""} onChange={e => sd("region", e.target.value)} /></div>
                  <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Country</label><input className="input" value={schemaData.country || ""} onChange={e => sd("country", e.target.value)} placeholder="US" /></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Opening Hours</label><input className="input" value={schemaData.openingHours || ""} onChange={e => sd("openingHours", e.target.value)} placeholder="Mo-Fr 09:00-17:00" /></div>
                  <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Price Range</label><input className="input" value={schemaData.priceRange || ""} onChange={e => sd("priceRange", e.target.value)} placeholder="$$" /></div>
                </div>
              </>)}

              {/* Article fields */}
              {schemaType === "Article" && (<>
                <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Headline *</label><input className="input" value={schemaData.headline || ""} onChange={e => sd("headline", e.target.value)} /></div>
                <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Description</label><textarea className="input" rows={2} value={schemaData.description || ""} onChange={e => sd("description", e.target.value)} style={{ resize: "vertical" }} /></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Author Name</label><input className="input" value={schemaData.authorName || ""} onChange={e => sd("authorName", e.target.value)} /></div>
                  <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Publisher Name</label><input className="input" value={schemaData.publisherName || ""} onChange={e => sd("publisherName", e.target.value)} /></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Published Date</label><input className="input" type="date" value={schemaData.datePublished || ""} onChange={e => sd("datePublished", e.target.value)} /></div>
                  <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Modified Date</label><input className="input" type="date" value={schemaData.dateModified || ""} onChange={e => sd("dateModified", e.target.value)} /></div>
                </div>
                <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Article URL</label><input className="input" value={schemaData.url || ""} onChange={e => sd("url", e.target.value)} /></div>
              </>)}

              {/* Product fields */}
              {schemaType === "Product" && (<>
                <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Product Name *</label><input className="input" value={schemaData.name || ""} onChange={e => sd("name", e.target.value)} /></div>
                <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Description</label><textarea className="input" rows={2} value={schemaData.description || ""} onChange={e => sd("description", e.target.value)} style={{ resize: "vertical" }} /></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Brand</label><input className="input" value={schemaData.brand || ""} onChange={e => sd("brand", e.target.value)} /></div>
                  <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Price</label><input className="input" type="number" value={schemaData.price || ""} onChange={e => sd("price", e.target.value)} /></div>
                  <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Currency</label><input className="input" value={schemaData.currency || "USD"} onChange={e => sd("currency", e.target.value)} /></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Rating (1-5)</label><input className="input" type="number" min={1} max={5} step={0.1} value={schemaData.ratingValue || ""} onChange={e => sd("ratingValue", e.target.value)} /></div>
                  <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Review Count</label><input className="input" type="number" value={schemaData.reviewCount || ""} onChange={e => sd("reviewCount", e.target.value)} /></div>
                </div>
              </>)}

              {/* FAQ fields */}
              {schemaType === "FAQ" && (<>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4 }}>Add your frequently asked questions below:</div>
                {faqItems.map((faq, i) => (
                  <div key={i} className="card" style={{ padding: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>Question {i + 1}</span>
                      {faqItems.length > 1 && <button className="btn btn-ghost btn-sm" style={{ color: "#ef4444", padding: "2px 6px" }} onClick={() => setFaqItems(p => p.filter((_, j) => j !== i))}><Trash2 size={12} /></button>}
                    </div>
                    <input className="input" placeholder="Question" value={faq.question} onChange={e => setFaqItems(p => p.map((f, j) => j === i ? { ...f, question: e.target.value } : f))} style={{ marginBottom: 6 }} />
                    <textarea className="input" rows={2} placeholder="Answer" value={faq.answer} onChange={e => setFaqItems(p => p.map((f, j) => j === i ? { ...f, answer: e.target.value } : f))} style={{ resize: "vertical" }} />
                  </div>
                ))}
                <button className="btn btn-secondary btn-sm" onClick={() => setFaqItems(p => [...p, { question: "", answer: "" }])}><Plus size={12} /> Add Question</button>
              </>)}

              {/* BreadcrumbList fields */}
              {schemaType === "BreadcrumbList" && (<>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4 }}>Add your breadcrumb items in order:</div>
                {breadcrumbs.map((crumb, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "var(--text-muted)", minWidth: 16 }}>{i + 1}.</span>
                    <input className="input" placeholder="Label (e.g. Home)" value={crumb.name} onChange={e => setBreadcrumbs(p => p.map((c, j) => j === i ? { ...c, name: e.target.value } : c))} style={{ flex: 1 }} />
                    <input className="input" placeholder="URL" value={crumb.url} onChange={e => setBreadcrumbs(p => p.map((c, j) => j === i ? { ...c, url: e.target.value } : c))} style={{ flex: 1 }} />
                    {breadcrumbs.length > 1 && <button className="btn btn-ghost btn-sm" style={{ color: "#ef4444", padding: "2px 6px", flexShrink: 0 }} onClick={() => setBreadcrumbs(p => p.filter((_, j) => j !== i))}><Trash2 size={12} /></button>}
                  </div>
                ))}
                <button className="btn btn-secondary btn-sm" onClick={() => setBreadcrumbs(p => [...p, { name: "", url: "" }])}><Plus size={12} /> Add Breadcrumb</button>
              </>)}

              {/* SoftwareApplication fields */}
              {schemaType === "SoftwareApplication" && (<>
                <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>App Name *</label><input className="input" value={schemaData.name || ""} onChange={e => sd("name", e.target.value)} /></div>
                <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Description</label><textarea className="input" rows={2} value={schemaData.description || ""} onChange={e => sd("description", e.target.value)} style={{ resize: "vertical" }} /></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Category</label><input className="input" value={schemaData.category || "BusinessApplication"} onChange={e => sd("category", e.target.value)} /></div>
                  <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Operating System</label><input className="input" value={schemaData.os || "Web"} onChange={e => sd("os", e.target.value)} /></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Price</label><input className="input" value={schemaData.price || "0"} onChange={e => sd("price", e.target.value)} /></div>
                  <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Rating (1-5)</label><input className="input" type="number" min={1} max={5} step={0.1} value={schemaData.ratingValue || ""} onChange={e => sd("ratingValue", e.target.value)} /></div>
                  <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Review Count</label><input className="input" type="number" value={schemaData.reviewCount || ""} onChange={e => sd("reviewCount", e.target.value)} /></div>
                </div>
                <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>App URL</label><input className="input" value={schemaData.url || ""} onChange={e => sd("url", e.target.value)} /></div>
              </>)}

              <button className="btn btn-primary" disabled={running} onClick={runSchema} style={{ marginTop: 4 }}>
                {running ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Code2 size={14} />} Generate JSON-LD
              </button>
            </div>
          </div>

          {/* Schema output */}
          {schemaResult && (
            <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
              <div className="card" style={{ padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>JSON-LD Output</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Paste this inside your {"<head>"} tag</div>
                  </div>
                  <CopyButton text={schemaResult.html} />
                </div>
                <pre style={{ fontSize: 11, color: "#10b981", overflowX: "auto", margin: 0, fontFamily: "JetBrains Mono, monospace", lineHeight: 1.7, background: "rgba(16,185,129,0.05)", padding: 12, borderRadius: 6 }}>
                  {schemaResult.html}
                </pre>
              </div>

              <div className="card" style={{ padding: 14 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Validation Tips</div>
                {[
                  { icon: "✓", text: "Test with Google's Rich Results Test tool", color: "#10b981" },
                  { icon: "✓", text: "Validate JSON syntax at jsonlint.com", color: "#10b981" },
                  { icon: "✓", text: `Schema type: ${schemaType} — supported by Google`, color: "#3b82f6" },
                  { icon: "→", text: "Place in <head> before </head> closing tag", color: "var(--text-muted)" },
                ].map((tip, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6 }}>
                    <span style={{ color: tip.color, fontSize: 13, flexShrink: 0 }}>{tip.icon}</span>
                    <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{tip.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Project modal */}
      <Modal open={projectModal} onClose={() => setProjectModal(false)} title="New SEO Project">
        <form onSubmit={createProject}>
          <div style={{ padding: "20px", display: "grid", gap: 12 }}>
            <FormRow label="Project name" required><input className="input" value={projectForm.name} onChange={e => setProjectForm(p => ({ ...p, name: e.target.value }))} required /></FormRow>
            <FormRow label="Domain" required><input className="input" placeholder="yourdomain.com" value={projectForm.domain} onChange={e => setProjectForm(p => ({ ...p, domain: e.target.value }))} required /></FormRow>
            <FormRow label="Country"><input className="input" value={projectForm.country} onChange={e => setProjectForm(p => ({ ...p, country: e.target.value }))} placeholder="US" /></FormRow>
          </div>
          <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-secondary" onClick={() => setProjectModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Project</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
