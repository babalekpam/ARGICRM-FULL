import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Layout from "../components/Layout";
import { useLanguage } from "../contexts/LanguageContext";
import { Modal, FormRow, Select, Empty, Loader } from "../components/UI";
import { apiRequest } from "../lib/api";
import { Zap, Search, Copy, Download, ChevronRight, ArrowLeft, Play, Sparkles, Globe, BarChart2, Users, DollarSign, Settings, Shield, Code, Brain, Target, RefreshCw } from "lucide-react";

const DOMAIN_ICONS: Record<string, any> = {
  sales: Zap, marketing: Sparkles, customer_success: Users, finance: DollarSign,
  hr: Users, operations: Settings, legal: Shield, product: Code,
  intelligence: BarChart2, strategy: Brain, africa: Globe, ai_automation: Zap,
};

const DOMAIN_COLORS: Record<string, string> = {
  sales: "#3b82f6", marketing: "#8b5cf6", customer_success: "#06b6d4",
  finance: "#10b981", hr: "#f59e0b", operations: "#f97316",
  legal: "#64748b", product: "#ec4899", intelligence: "#14b8a6",
  strategy: "#a855f7", africa: "#22c55e", ai_automation: "#6366f1",
};

export default function SkillsPage() {
  const { t } = useLanguage();
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [result, setResult] = useState<string>("");
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: domains } = useQuery<any[]>({ queryKey: ["/api/skills/domains"] });
  const { data: skillsData } = useQuery<{ skills: any[]; total: number }>({
    queryKey: [`/api/skills${selectedDomain ? `?domain=${selectedDomain}` : ""}${search ? `&search=${search}` : ""}`],
  });

  const runSkill = async () => {
    if (!selectedSkill) return;
    setRunning(true);
    setResult("");
    try {
      const res = await apiRequest<any>("POST", `/api/skills/${selectedSkill.id}/run`, { inputs });
      setResult(res.result);
    } catch (err: any) {
      setResult(`Error: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  const copyResult = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openSkill = (skill: any) => {
    setSelectedSkill(skill);
    setInputs({});
    setResult("");
  };

  useEffect(() => {
    if (search) setSelectedDomain(null);
  }, [search]);

  const gridSkills = skillsData?.skills || [];

  return (
    <Layout
      title={t("skills_title")}
      subtitle={t("skills_subtitle_count", `${skillsData?.total || 0} production-grade skills for every business function`).replace("{count}", String(skillsData?.total || 0))}
      actions={
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input className="input" placeholder={t("search_skills", "Search skills...")} value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 30, width: 200, fontSize: 12 }} />
          </div>
        </div>
      }
    >
      <div style={{ display: "grid", gridTemplateColumns: selectedSkill ? "260px 1fr" : "1fr", gap: 20 }}>

        {/* Left panel — domains + skill list */}
        <div>
          {/* Domain filter pills */}
          {!search && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
              <button onClick={() => setSelectedDomain(null)} className={`btn btn-sm ${!selectedDomain ? "btn-primary" : "btn-secondary"}`} style={{ fontSize: 11 }}>
                {t("skills_all_domains", "All Domains")}
              </button>
              {(domains || []).map((d: any) => (
                <button key={d.id} onClick={() => setSelectedDomain(d.id)}
                  className={`btn btn-sm ${selectedDomain === d.id ? "btn-primary" : "btn-secondary"}`}
                  style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                  <span>{d.emoji}</span> {d.label.split(" ")[0]}
                  <span style={{ background: "rgba(255,255,255,0.15)", borderRadius: 4, padding: "1px 5px", fontSize: 10 }}>{d.skillCount}</span>
                </button>
              ))}
            </div>
          )}

          {/* Domain cards (when no domain selected and no search) */}
          {!selectedDomain && !search && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 10, marginBottom: 20 }}>
              {(domains || []).map((d: any) => {
                const Icon = DOMAIN_ICONS[d.id] || Zap;
                const color = DOMAIN_COLORS[d.id] || "#3b82f6";
                return (
                  <div key={d.id} className="card" style={{ padding: "14px 16px", cursor: "pointer", borderLeft: `3px solid ${color}` }}
                    onClick={() => setSelectedDomain(d.id)}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <span style={{ fontSize: 22 }}>{d.emoji}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color, background: `${color}18`, padding: "2px 7px", borderRadius: 4 }}>{d.skillCount} {t("skills_label", "skills")}</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{d.label}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>{d.description}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Skill list */}
          {(selectedDomain || search) && (
            <div>
              {selectedDomain && !search && (
                <button className="btn btn-ghost btn-sm" style={{ marginBottom: 12, fontSize: 12 }} onClick={() => setSelectedDomain(null)}>
                  <ArrowLeft size={12} /> {t("skills_back_domains", "Back to all domains")}
                </button>
              )}
              <div style={{ display: "grid", gap: 8 }}>
                {gridSkills.length === 0 ? (
                  <Empty icon={Search} title={t("no_skills", "No skills found")} desc={t("skills_empty_desc", "Try a different search or domain")} />
                ) : gridSkills.map((skill: any) => {
                  const color = DOMAIN_COLORS[skill.domain] || "#3b82f6";
                  return (
                    <div key={skill.id} className="card" style={{ padding: "12px 14px", cursor: "pointer", border: selectedSkill?.id === skill.id ? `1.5px solid ${color}` : undefined }}
                      onClick={() => openSkill(skill)}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3, display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 14 }}>
                              {domains?.find(d => d.id === skill.domain)?.emoji || "⚡"}
                            </span>
                            {skill.name}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>{skill.description}</div>
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
                            {skill.tags?.slice(0, 3).map((tag: string) => (
                              <span key={tag} style={{ fontSize: 9, padding: "2px 6px", background: `${color}15`, color, borderRadius: 3, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{tag}</span>
                            ))}
                          </div>
                        </div>
                        <ChevronRight size={14} style={{ color: "var(--text-muted)", flexShrink: 0, marginTop: 2 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Show all skills when nothing selected */}
          {!selectedDomain && !search && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>{t("skills_all_label", "All Skills")} ({skillsData?.total || 0})</div>
              <div style={{ display: "grid", gap: 6 }}>
                {gridSkills.slice(0, 12).map((skill: any) => {
                  const color = DOMAIN_COLORS[skill.domain] || "#3b82f6";
                  return (
                    <div key={skill.id} className="card" style={{ padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
                      onClick={() => { openSkill(skill); }}>
                      <span style={{ fontSize: 16 }}>{domains?.find(d => d.id === skill.domain)?.emoji || "⚡"}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 12 }}>{skill.name}</div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{skill.description?.slice(0, 55)}...</div>
                      </div>
                      <span style={{ fontSize: 9, padding: "2px 6px", background: `${color}15`, color, borderRadius: 3, fontWeight: 600, textTransform: "uppercase", flexShrink: 0 }}>
                        {skill.domain?.replace("_", " ")}
                      </span>
                    </div>
                  );
                })}
                {(skillsData?.total || 0) > 12 && (
                  <div style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)", padding: 10 }}>
                    + {(skillsData?.total || 0) - 12} {t("skills_more_hint", "more — use search or select a domain")}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right panel — skill runner */}
        {selectedSkill && (
          <div>
            <div className="card" style={{ overflow: "hidden" }}>
              {/* Skill header */}
              <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)", background: `${DOMAIN_COLORS[selectedSkill.domain]}08` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 22 }}>{domains?.find(d => d.id === selectedSkill.domain)?.emoji}</span>
                      <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>{selectedSkill.name}</h2>
                    </div>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>{selectedSkill.description}</p>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                      {selectedSkill.tags?.map((tag: string) => (
                        <span key={tag} style={{ fontSize: 10, padding: "2px 8px", background: "var(--bg-overlay)", borderRadius: 4, color: "var(--text-muted)", border: "1px solid var(--border)" }}>{tag}</span>
                      ))}
                      <span style={{ fontSize: 10, padding: "2px 8px", background: "var(--bg-overlay)", borderRadius: 4, color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                        ~{selectedSkill.estimatedTokens} {t("tokens_used", "tokens")}
                      </span>
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setSelectedSkill(null); setResult(""); }}>✕</button>
                </div>
              </div>

              {/* Input form */}
              <div style={{ padding: "20px", display: "grid", gap: 14 }}>
                {(selectedSkill.inputs || []).map((input: any) => (
                  <FormRow key={input.name} label={input.label} required={input.required} hint={input.placeholder}>
                    {input.type === "select" ? (
                      <Select options={(input.options || []).map((o: string) => ({ value: o, label: o }))}
                        value={inputs[input.name] || ""}
                        onChange={e => setInputs(p => ({ ...p, [input.name]: e.target.value }))} />
                    ) : input.type === "textarea" ? (
                      <textarea className="input" rows={3}
                        placeholder={input.placeholder}
                        value={inputs[input.name] || ""}
                        onChange={e => setInputs(p => ({ ...p, [input.name]: e.target.value }))}
                        style={{ resize: "vertical" }} />
                    ) : (
                      <input type={input.type} className="input"
                        placeholder={input.placeholder}
                        value={inputs[input.name] || ""}
                        onChange={e => setInputs(p => ({ ...p, [input.name]: e.target.value }))} />
                    )}
                  </FormRow>
                ))}

                <button className="btn btn-primary" onClick={runSkill} disabled={running}
                  style={{ background: `linear-gradient(135deg, ${DOMAIN_COLORS[selectedSkill.domain]}, #6366f1)`, border: "none", padding: "12px 20px" }}>
                  {running ? (
                    <><span className="spinner" style={{ width: 14, height: 14 }} /> {t("skills_running", "Running skill...")}</>
                  ) : (
                    <><Play size={14} /> {t("run_skill", "Run Skill")}</>
                  )}
                </button>
              </div>

              {/* Result */}
              {result && (
                <div style={{ padding: "0 20px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{t("skill_output", "Output")}</span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={copyResult} style={{ fontSize: 11 }}>
                        <Copy size={12} /> {copied ? t("copied", "Copied!") : t("copy", "Copy")}
                      </button>
                    </div>
                  </div>
                  <div style={{
                    background: "var(--bg-overlay)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    padding: "16px",
                    fontSize: 13,
                    lineHeight: 1.75,
                    color: "var(--text-primary)",
                    whiteSpace: "pre-wrap",
                    maxHeight: 500,
                    overflowY: "auto",
                    fontFamily: selectedSkill.outputFormat === "json" ? "var(--font-mono)" : "var(--font-sans)",
                  }}>
                    {result}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
