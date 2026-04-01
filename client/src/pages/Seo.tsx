import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "../components/Layout";
import { Modal, FormRow, Empty, Loader, Badge } from "../components/UI";
import { apiRequest } from "../lib/api";
import { Search, Plus, TrendingUp, Link, AlertCircle, Zap, BarChart2, BookOpen, Globe, Target, RefreshCw, Trash2, ChevronUp, ChevronDown, Minus } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";

const TABS = ["Keywords", "Site Audit", "Backlinks", "Competitor", "Content Ideas"] as const;
const DIFF_COLOR = (d: number) => d >= 70 ? "#ef4444" : d >= 40 ? "#f59e0b" : "#10b981";

export default function SeoPage() {
  const qc = useQueryClient();
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
  const [auditResult, setAuditResult] = useState<any>(null);
  const [competitorResult, setCompetitorResult] = useState<any>(null);
  const [contentIdeas, setContentIdeas] = useState<any[]>([]);

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

  const runResearch = async () => {
    if (!researchForm.seed) return;
    setRunning(true);
    try {
      await apiRequest("POST", "/api/seo/keywords/research", { ...researchForm, projectId: selectedProject || null });
      qc.invalidateQueries({ queryKey: ["/api/seo/keywords"] });
      qc.invalidateQueries({ queryKey: ["/api/seo/stats"] });
    } finally { setRunning(false); }
  };

  const runAudit = async () => {
    if (!auditDomain) return;
    setRunning(true);
    try {
      const result = await apiRequest<any>("POST", "/api/seo/audit", { domain: auditDomain, projectId: selectedProject || null });
      setAuditResult(result);
      qc.invalidateQueries({ queryKey: ["/api/seo/audits"] });
    } finally { setRunning(false); }
  };

  const runCompetitor = async () => {
    setRunning(true);
    try { setCompetitorResult(await apiRequest<any>("POST", "/api/seo/competitor/analyze", competitorForm)); }
    finally { setRunning(false); }
  };

  const runContent = async () => {
    setRunning(true);
    try { setContentIdeas(await apiRequest<any[]>("POST", "/api/seo/content/ideas", { ...contentForm, projectId: selectedProject || null })); }
    finally { setRunning(false); }
  };

  const runBacklinks = async () => {
    if (!backlinksForm.domain) return;
    setRunning(true);
    try {
      await apiRequest("POST", "/api/seo/backlinks/analyze", { domain: backlinksForm.domain, projectId: selectedProject || null });
      qc.invalidateQueries({ queryKey: ["/api/seo/backlinks"] });
    } finally { setRunning(false); }
  };

  const deleteKw = async (id: string) => {
    await apiRequest("DELETE", `/api/seo/keywords/${id}`);
    qc.invalidateQueries({ queryKey: ["/api/seo/keywords"] });
  };

  const SEVERITY_COLORS: Record<string, string> = { critical: "#ef4444", warning: "#f59e0b", passed: "#10b981" };

  return (
    <Layout title="SEO Platform" subtitle="Keyword research, audits, backlinks & competitor analysis"
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
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <input className="input" placeholder="Seed keyword (e.g. CRM software)" value={researchForm.seed} onChange={e => setResearchForm(p => ({ ...p, seed: e.target.value }))} onKeyDown={e => e.key === "Enter" && runResearch()} style={{ flex: 1 }} />
            <button className="btn btn-primary" disabled={running || !researchForm.seed} onClick={runResearch}>{running ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Search size={14} />} Research</button>
          </div>

          <div className="card" style={{ overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 100px 100px 80px 80px 50px", padding: "10px 16px", borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
              {["Keyword", "Search Volume", "Difficulty", "CPC", "Intent", "Rank", ""].map(h => (
                <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</span>
              ))}
            </div>
            {!keywordsData?.data?.length ? (
              <Empty icon={Search} title="No keywords yet" desc='Enter a seed keyword above and click "Research" to discover opportunities' />
            ) : keywordsData.data.map((kw: any) => (
              <div key={kw.id} className="table-row" style={{ gridTemplateColumns: "1fr 120px 100px 100px 80px 80px 50px", gap: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{kw.keyword}</div>
                <div style={{ fontWeight: 700, color: "var(--brand-light)" }}>{Number(kw.searchVolume).toLocaleString()}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 40, height: 5, borderRadius: 3, background: "var(--bg-overlay)" }}>
                    <div style={{ width: `${kw.difficulty}%`, height: "100%", borderRadius: 3, background: DIFF_COLOR(kw.difficulty) }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: DIFF_COLOR(kw.difficulty) }}>{kw.difficulty}</span>
                </div>
                <div style={{ fontSize: 13 }}>${Number(kw.cpc || 0).toFixed(2)}</div>
                <div><span className={`badge ${kw.intent === "transactional" ? "badge-green" : kw.intent === "commercial" ? "badge-blue" : kw.intent === "navigational" ? "badge-purple" : "badge-gray"}`}>{kw.intent || "—"}</span></div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{kw.currentRank ? `#${kw.currentRank}` : "—"}</div>
                <button className="btn btn-ghost btn-sm" style={{ padding: 4, color: "#ef4444" }} onClick={() => deleteKw(kw.id)}><Trash2 size={12} /></button>
              </div>
            ))}
          </div>
          {keywordsData && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8, textAlign: "right" }}>{keywordsData.total} keywords in database</div>}
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
              <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
                <div className="card" style={{ padding: 20, textAlign: "center", minWidth: 120 }}>
                  <div style={{ fontSize: 48, fontWeight: 800, color: auditResult.score >= 70 ? "#10b981" : auditResult.score >= 40 ? "#f59e0b" : "#ef4444" }}>{auditResult.score}</div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>SEO Score</div>
                </div>
                <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  {[
                    { label: "Critical Issues", value: auditResult.summary?.critical || 0, color: "#ef4444" },
                    { label: "Warnings", value: auditResult.summary?.warnings || 0, color: "#f59e0b" },
                    { label: "Passed", value: auditResult.summary?.passed || 0, color: "#10b981" },
                  ].map(s => (
                    <div key={s.label} className="card" style={{ padding: 16, borderLeft: `3px solid ${s.color}` }}>
                      <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {(auditResult.issues || []).map((issue: any, i: number) => (
                  <div key={i} className="card" style={{ padding: "14px 16px", borderLeft: `3px solid ${SEVERITY_COLORS[issue.severity] || "#64748b"}` }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{issue.type.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}</div>
                      <span className={`badge ${issue.severity === "critical" ? "badge-red" : "badge-amber"}`}>{issue.severity}</span>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>{issue.description}</div>
                    {issue.urls?.length > 0 && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>Affected: {issue.urls.slice(0, 3).join(", ")}</div>}
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
          <div className="card" style={{ overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 180px 80px 80px 100px", padding: "10px 16px", borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
              {["Source Domain", "Anchor Text", "DA", "PA", "Type"].map(h => (
                <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</span>
              ))}
            </div>
            {!backlinksData?.data?.length ? <Empty icon={Link} title="No backlinks yet" desc='Enter your domain and click "Analyze Backlinks"' /> :
              backlinksData.data.map((bl: any) => (
                <div key={bl.id} className="table-row" style={{ gridTemplateColumns: "1fr 180px 80px 80px 100px", gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{bl.sourceDomain}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 300 }}>{bl.sourceUrl}</div>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{bl.anchorText}</div>
                  <div style={{ fontWeight: 700, color: bl.domainAuthority >= 60 ? "#10b981" : "#f59e0b" }}>{bl.domainAuthority}</div>
                  <div style={{ fontSize: 13 }}>{bl.pageAuthority}</div>
                  <div><span className={`badge ${bl.isDoFollow ? "badge-green" : "badge-gray"}`}>{bl.isDoFollow ? "dofollow" : "nofollow"}</span></div>
                </div>
              ))
            }
          </div>
          {backlinksData && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8, textAlign: "right" }}>{backlinksData.total} backlinks tracked</div>}
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
