import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "../components/Layout";
import { useLanguage } from "../contexts/LanguageContext";
import { apiRequest } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { Loader, Modal, FormRow } from "../components/UI";
import {
  Send, Brain, Zap, Plus, ChevronLeft, Trash2, Sparkles,
  History, Settings, UserPlus, Target, RefreshCw, Download,
  MessageSquare, CheckCircle, Clock, AlertCircle, BookOpen, Filter
} from "lucide-react";

// Agent type metadata (colors/emojis defined server-side, mirrored here for UI)
const AGENT_META: Record<string, { emoji: string; color: string; gradient: string }> = {
  chief_of_staff: { emoji: "👑", color: "#f59e0b", gradient: "linear-gradient(135deg,#f59e0b,#f97316)" },
  sales: { emoji: "⚡", color: "#3b82f6", gradient: "linear-gradient(135deg,#3b82f6,#6366f1)" },
  marketing: { emoji: "✨", color: "#8b5cf6", gradient: "linear-gradient(135deg,#8b5cf6,#ec4899)" },
  customer_support: { emoji: "💙", color: "#06b6d4", gradient: "linear-gradient(135deg,#06b6d4,#3b82f6)" },
  finance: { emoji: "💰", color: "#10b981", gradient: "linear-gradient(135deg,#10b981,#059669)" },
  hr_recruiting: { emoji: "🤝", color: "#ec4899", gradient: "linear-gradient(135deg,#ec4899,#f43f5e)" },
  operations: { emoji: "⚙️", color: "#f97316", gradient: "linear-gradient(135deg,#f97316,#ef4444)" },
  compliance: { emoji: "🛡️", color: "#6366f1", gradient: "linear-gradient(135deg,#6366f1,#8b5cf6)" },
  bi_insights: { emoji: "📊", color: "#14b8a6", gradient: "linear-gradient(135deg,#14b8a6,#06b6d4)" },
  devops: { emoji: "🔧", color: "#94a3b8", gradient: "linear-gradient(135deg,#94a3b8,#64748b)" },
  product: { emoji: "🎯", color: "#a855f7", gradient: "linear-gradient(135deg,#a855f7,#8b5cf6)" },
  research: { emoji: "🔍", color: "#64748b", gradient: "linear-gradient(135deg,#64748b,#475569)" },
};

interface Message { role: "user" | "assistant"; content: string; toolsUsed?: string[]; createdAt?: string; }

export default function AgentsPage() {
  const { user, tenant } = useAuth();
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [activeView, setActiveView] = useState<"chat" | "memories" | "history" | "lead-gen">("chat");
  const [leadGenModal, setLeadGenModal] = useState(false);
  const [leadGenForm, setLeadGenForm] = useState({ targetIndustry: "SaaS", targetTitle: "VP Sales", targetCompanySize: "51-200", value: "$25,000", outreachPurpose: "product demo" });
  const [leadGenRunning, setLeadGenRunning] = useState(false);
  const [leadGenResults, setLeadGenResults] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: agentTypes, isLoading: typesLoading } = useQuery<any[]>({ queryKey: ["/api/agents/types"] });
  const { data: sessions } = useQuery<any[]>({ queryKey: ["/api/agents/sessions"] });
  const { data: memories } = useQuery<any[]>({
    queryKey: [`/api/agents/memories/${activeAgent}`],
    enabled: !!activeAgent && activeView === "memories",
  });
  const { data: leadGenHistory } = useQuery<any[]>({
    queryKey: ["/api/agents/lead-gen/results"],
    enabled: activeView === "lead-gen",
  });
  const { data: agentStats } = useQuery<any>({ queryKey: ["/api/agents/stats"] });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectAgent = (type: string) => {
    setActiveAgent(type);
    setSessionId(null);
    setMessages([]);
    setActiveView("chat");
    // Load recent session for this agent
    const recentSession = sessions?.find(s => s.agentType === type);
    if (recentSession) {
      setSessionId(recentSession.id);
      // Load messages
      apiRequest("GET", `/api/agents/sessions/${recentSession.id}/messages`)
        .then((msgs: any[]) => setMessages(msgs.map(m => ({ role: m.role, content: m.content, toolsUsed: m.toolCalls?.map((t: any) => t.tool) }))))
        .catch(() => {});
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeAgent || sending) return;
    const userMsg: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const res = await apiRequest<any>("POST", "/api/agents/chat", {
        agentType: activeAgent,
        message: input,
        sessionId,
        businessContext: {},
      });

      setSessionId(res.sessionId);
      const agentMsg: Message = {
        role: "assistant",
        content: res.response,
        toolsUsed: res.toolsUsed,
      };
      setMessages(prev => [...prev, agentMsg]);
      qc.invalidateQueries({ queryKey: ["/api/agents/sessions"] });
      qc.invalidateQueries({ queryKey: [`/api/agents/memories/${activeAgent}`] });
    } catch (err: any) {
      setMessages(prev => [...prev, { role: "assistant", content: `Error: ${err.message}` }]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const newChat = () => { setSessionId(null); setMessages([]); };

  const runLeadGen = async () => {
    setLeadGenRunning(true);
    try {
      const res = await apiRequest<any>("POST", "/api/agents/lead-gen", leadGenForm);
      setLeadGenResults(res.leads || []);
      qc.invalidateQueries({ queryKey: ["/api/agents/lead-gen/results"] });
    } finally {
      setLeadGenRunning(false);
      setLeadGenModal(false);
    }
  };

  const importLead = async (resultId: string) => {
    await apiRequest("POST", `/api/agents/lead-gen/${resultId}/import`, {});
    qc.invalidateQueries({ queryKey: ["/api/leads"] });
    qc.invalidateQueries({ queryKey: ["/api/agents/lead-gen/results"] });
  };

  const selectedAgentDef = agentTypes?.find(a => a.type === activeAgent);
  const meta = activeAgent ? AGENT_META[activeAgent] : null;

  // Quick prompts per agent
  const QUICK_PROMPTS: Record<string, string[]> = {
    chief_of_staff: ["Summarize what needs my attention today", "What are our biggest risks right now?", "Prioritize my task list", "Give me a board-ready business update"],
    sales: ["Score my top 5 leads", "Write a cold email to a SaaS VP of Sales", "Which deals should I focus on this week?", "Generate 10 new prospects in healthcare"],
    marketing: ["Write a LinkedIn post about our CRM features", "Create a 3-email nurture sequence for new trials", "Suggest a content calendar for next month", "Write a cold email subject line that gets opens"],
    customer_support: ["Help me write a response to an angry customer", "Identify at-risk customers in our CRM", "Create an FAQ template for onboarding", "What's our average response time trend?"],
    finance: ["Analyze our current pipeline and forecast Q1 revenue", "What's our estimated MRR based on closed deals?", "Create an invoice template", "Explain our unit economics"],
    hr_recruiting: ["Write a job description for a Senior Sales Rep", "Create 5 interview questions for a product role", "Build a 30/60/90 day onboarding plan", "How should we structure our sales team?"],
    operations: ["Map out our lead-to-close process", "Identify bottlenecks in our current workflow", "Create an SOP for client onboarding", "What manual tasks can we automate?"],
    compliance: ["Review our data handling practices for GDPR", "Draft an NDA template", "What compliance risks should we be aware of?", "Create a vendor due diligence checklist"],
    bi_insights: ["Analyze our deal pipeline health", "What's our lead conversion rate?", "Show me funnel drop-off analysis", "Compare this month's performance to last month"],
    devops: ["Review this API endpoint code", "Help me design a database schema", "Write tests for our auth middleware", "Optimize this SQL query"],
    product: ["Prioritize our feature backlog using RICE", "Write a PRD for a customer portal feature", "What metrics should we track for onboarding?", "Create user stories for email automation"],
    research: ["Research our top 3 competitors", "Summarize the B2B CRM market landscape", "Find information about a prospect company", "What are the latest trends in sales automation?"],
  };

  const prompts = activeAgent ? (QUICK_PROMPTS[activeAgent] || []) : [];

  return (
    <Layout title={t("agents_title")} subtitle={t("agents_subtitle")}>
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 16, height: "calc(100vh - 140px)" }}>

        {/* ── Sidebar: Agent List ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, overflow: "hidden" }}>
          {/* Stats bar */}
          <div className="card" style={{ padding: "12px 14px", display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{agentStats?.sessions?.reduce((s: number, a: any) => s + Number(a.count || 0), 0) || 0}</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Sessions</div>
            </div>
            <div style={{ width: 1, height: 28, background: "var(--border)" }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{agentStats?.memories?.reduce((s: number, a: any) => s + Number(a.count || 0), 0) || 0}</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Memories</div>
            </div>
            <div style={{ width: 1, height: 28, background: "var(--border)" }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{agentStats?.totalLeadsGenerated || 0}</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Leads</div>
            </div>
          </div>

          {/* Agent list */}
          <div style={{ flex: 1, overflowY: "auto" }} className="no-scrollbar">
            {typesLoading ? <Loader /> : (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {(agentTypes || []).map(a => {
                  const m = AGENT_META[a.type];
                  const sessionCount = sessions?.filter(s => s.agentType === a.type).length || 0;
                  const memCount = agentStats?.memories?.find((ms: any) => ms.agent === a.type)?.count || 0;
                  return (
                    <button
                      key={a.type}
                      onClick={() => selectAgent(a.type)}
                      style={{
                        display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10,
                        background: activeAgent === a.type ? `${m?.color}18` : "transparent",
                        border: activeAgent === a.type ? `1px solid ${m?.color}33` : "1px solid transparent",
                        cursor: "pointer", textAlign: "left", width: "100%", transition: "all 0.15s",
                      }}
                      onMouseEnter={e => { if (activeAgent !== a.type) e.currentTarget.style.background = "var(--bg-hover)"; }}
                      onMouseLeave={e => { if (activeAgent !== a.type) e.currentTarget.style.background = "transparent"; }}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: m?.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                        {a.emoji}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: activeAgent === a.type ? m?.color : "var(--text-primary)" }}>{a.name}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.role}</div>
                      </div>
                      {(sessionCount > 0 || Number(memCount) > 0) && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-end" }}>
                          {sessionCount > 0 && <span style={{ fontSize: 10, color: "var(--text-muted)" }}>💬 {sessionCount}</span>}
                          {Number(memCount) > 0 && <span style={{ fontSize: 10, color: "var(--text-muted)" }}>🧠 {memCount}</span>}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Main Area ── */}
        {!activeAgent ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }} className="card">
            <div style={{ textAlign: "center", maxWidth: 400 }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🤖</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Your AI Business Team</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
                12 specialized agents, each with deep expertise and persistent memory. Select an agent to start a conversation.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, textAlign: "left" }}>
                {[
                  { emoji: "👑", text: "Executive strategy & priorities" },
                  { emoji: "⚡", text: "Lead generation & outreach" },
                  { emoji: "✨", text: "Content & campaigns" },
                  { emoji: "📊", text: "Business intelligence" },
                  { emoji: "💰", text: "Revenue forecasting" },
                  { emoji: "🔍", text: "Research & competitive intel" },
                ].map(f => (
                  <div key={f.text} style={{ padding: "10px 12px", background: "var(--bg-overlay)", borderRadius: 8, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                    <span>{f.emoji}</span> {f.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }} className="card">
            {/* Agent header */}
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: meta?.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                {selectedAgentDef?.emoji}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: meta?.color }}>{selectedAgentDef?.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{selectedAgentDef?.role} · {selectedAgentDef?.department}</div>
              </div>
              {/* Tab switcher */}
              <div style={{ marginLeft: "auto", display: "flex", gap: 4, background: "var(--bg-overlay)", padding: 3, borderRadius: 8 }}>
                {[
                  { id: "chat", icon: MessageSquare, label: "Chat" },
                  { id: "memories", icon: Brain, label: "Memory" },
                  { id: "history", icon: History, label: "History" },
                  ...(activeAgent === "sales" ? [{ id: "lead-gen", icon: Target, label: "Lead Gen" }] : []),
                ].map(t => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveView(t.id as any)}
                      className={`btn btn-sm ${activeView === t.id ? "btn-primary" : "btn-ghost"}`}
                      style={{ padding: "4px 10px", fontSize: 12, gap: 4 }}
                    >
                      <Icon size={12} /> {t.label}
                    </button>
                  );
                })}
              </div>
              {activeView === "chat" && (
                <button className="btn btn-ghost btn-sm" style={{ padding: 6 }} onClick={newChat} title="New conversation">
                  <Plus size={15} />
                </button>
              )}
            </div>

            {/* ── CHAT VIEW ── */}
            {activeView === "chat" && (
              <>
                {/* Messages */}
                <div style={{ flex: 1, overflowY: "auto", padding: "16px" }} className="no-scrollbar">
                  {messages.length === 0 && (
                    <div style={{ padding: "24px 0" }}>
                      <div style={{ textAlign: "center", marginBottom: 24 }}>
                        <div style={{ fontSize: 40, marginBottom: 8 }}>{selectedAgentDef?.emoji}</div>
                        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Hi, I'm {selectedAgentDef?.name}</div>
                        <div style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 360, margin: "0 auto" }}>
                          I specialize in: {selectedAgentDef?.skills?.slice(0, 4).join(", ")} and more.
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10, textAlign: "center" }}>Try asking me</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          {prompts.map((p, i) => (
                            <button key={i} onClick={() => { setInput(p); }} className="btn btn-secondary btn-sm" style={{ textAlign: "left", justifyContent: "flex-start", fontSize: 12, lineHeight: 1.4, height: "auto", padding: "8px 12px" }}>
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {messages.map((m, i) => (
                    <div key={i} style={{ marginBottom: 16, display: "flex", gap: 10, flexDirection: m.role === "user" ? "row-reverse" : "row" }}>
                      {m.role === "assistant" && (
                        <div style={{ width: 32, height: 32, borderRadius: 9, background: meta?.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0, marginTop: 4 }}>
                          {selectedAgentDef?.emoji}
                        </div>
                      )}
                      <div style={{ maxWidth: "75%" }}>
                        <div style={{
                          padding: "12px 16px",
                          borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                          background: m.role === "user" ? meta?.color || "#3b82f6" : "var(--bg-elevated)",
                          border: m.role === "user" ? "none" : "1px solid var(--border)",
                          fontSize: 14,
                          lineHeight: 1.7,
                          color: m.role === "user" ? "#fff" : "var(--text-primary)",
                          whiteSpace: "pre-wrap",
                        }}>
                          {m.content}
                        </div>
                        {m.toolsUsed && m.toolsUsed.length > 0 && (
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
                            {m.toolsUsed.map(t => (
                              <span key={t} style={{ fontSize: 10, padding: "2px 8px", background: "rgba(59,130,246,0.1)", color: "#60a5fa", borderRadius: 4, fontWeight: 600 }}>
                                🔧 {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {sending && (
                    <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 9, background: meta?.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                        {selectedAgentDef?.emoji}
                      </div>
                      <div style={{ padding: "12px 16px", background: "var(--bg-elevated)", borderRadius: "14px 14px 14px 4px", border: "1px solid var(--border)" }}>
                        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                          {[0, 1, 2].map(i => (
                            <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: meta?.color, animation: `pulse 1.2s ${i * 0.2}s infinite` }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
                  <div style={{ display: "flex", gap: 10, background: "var(--bg-overlay)", borderRadius: 12, padding: "8px 12px", border: "1px solid var(--border)" }}>
                    <textarea
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={`Message ${selectedAgentDef?.name}... (Enter to send, Shift+Enter for newline)`}
                      style={{ flex: 1, background: "none", border: "none", outline: "none", resize: "none", fontFamily: "inherit", fontSize: 14, color: "var(--text-primary)", minHeight: 44, maxHeight: 120 }}
                      rows={1}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!input.trim() || sending}
                      style={{ width: 36, height: 36, borderRadius: 9, background: input.trim() && !sending ? meta?.color : "var(--bg-hover)", border: "none", cursor: input.trim() && !sending ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.15s" }}
                    >
                      {sending ? <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} /> : <Send size={15} style={{ color: "#fff" }} />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ── MEMORIES VIEW ── */}
            {activeView === "memories" && (
              <div style={{ flex: 1, overflowY: "auto", padding: 16 }} className="no-scrollbar">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>🧠 Long-term Memory</h3>
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-muted)" }}>Facts {selectedAgentDef?.name} has learned about your business</p>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => {/* Add memory modal */}}>
                    <Plus size={13} /> Add Memory
                  </button>
                </div>

                {!memories?.length ? (
                  <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--text-muted)" }}>
                    <Brain size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                    <p>No memories yet. Start chatting and {selectedAgentDef?.name} will learn from your conversations.</p>
                  </div>
                ) : (
                  <div>
                    {Object.entries(
                      memories.reduce((acc: Record<string, any[]>, m: any) => {
                        (acc[m.category] = acc[m.category] || []).push(m);
                        return acc;
                      }, {})
                    ).map(([category, items]) => (
                      <div key={category} style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                          {category.replace(/_/g, " ")}
                        </div>
                        <div style={{ display: "grid", gap: 8 }}>
                          {items.map((m: any) => (
                            <div key={m.id} style={{ background: "var(--bg-overlay)", borderRadius: 10, padding: "12px 14px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                              <div style={{ width: 8, height: 8, borderRadius: "50%", background: meta?.color, flexShrink: 0, marginTop: 6 }} />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 2 }}>{m.key}</div>
                                <div style={{ fontSize: 14, color: "var(--text-primary)" }}>{m.value}</div>
                                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, display: "flex", gap: 12 }}>
                                  <span>Importance: {m.importance}/10</span>
                                  <span>Source: {m.source}</span>
                                  <span>{new Date(m.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ padding: 4, color: "#ef4444", flexShrink: 0 }}
                                onClick={() => {
                                  apiRequest("DELETE", `/api/agents/memories/${m.id}`)
                                    .then(() => qc.invalidateQueries({ queryKey: [`/api/agents/memories/${activeAgent}`] }));
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── HISTORY VIEW ── */}
            {activeView === "history" && (
              <div style={{ flex: 1, overflowY: "auto", padding: 16 }} className="no-scrollbar">
                <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>💬 Conversation History</h3>
                {!(sessions?.filter(s => s.agentType === activeAgent).length) ? (
                  <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--text-muted)" }}>
                    <History size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                    <p>No conversation history yet.</p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 8 }}>
                    {sessions?.filter(s => s.agentType === activeAgent).map((s: any) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setSessionId(s.id);
                          setActiveView("chat");
                          apiRequest("GET", `/api/agents/sessions/${s.id}/messages`)
                            .then((msgs: any[]) => setMessages(msgs.map(m => ({ role: m.role, content: m.content }))));
                        }}
                        style={{ background: "var(--bg-overlay)", borderRadius: 10, padding: "12px 14px", cursor: "pointer", textAlign: "left", border: s.id === sessionId ? `1px solid ${meta?.color}44` : "1px solid transparent" }}
                      >
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{s.title || "Conversation"}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", gap: 12 }}>
                          <span>{s.messageCount} messages</span>
                          <span>{new Date(s.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── LEAD GEN VIEW (Sales Agent only) ── */}
            {activeView === "lead-gen" && activeAgent === "sales" && (
              <div style={{ flex: 1, overflowY: "auto", padding: 16 }} className="no-scrollbar">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>⚡ AI Lead Generation</h3>
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-muted)" }}>BOLT prospects, scores, and writes outreach for your ideal customers</p>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => setLeadGenModal(true)}>
                    <Target size={13} /> Run Campaign
                  </button>
                </div>

                {leadGenResults.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 10 }}>Latest Results ({leadGenResults.length} prospects)</div>
                    <div style={{ display: "grid", gap: 8 }}>
                      {leadGenResults.map((p: any, i: number) => (
                        <div key={i} style={{ background: "var(--bg-overlay)", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 14 }}>
                          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: "#fff" }}>
                            {(p.name || "?")[0]}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{p.title} · {p.company}</div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: 40, height: 5, borderRadius: 3, background: "var(--bg-elevated)" }}>
                              <div style={{ width: `${p.score}%`, height: "100%", borderRadius: 3, background: p.score >= 70 ? "#10b981" : "#f59e0b" }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)" }}>{p.score}</span>
                          </div>
                          <button className="btn btn-primary btn-sm" style={{ fontSize: 12 }} onClick={() => importLead(p.id || String(i))}>
                            Import to CRM
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {leadGenHistory && leadGenHistory.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 10 }}>All Generated Leads ({leadGenHistory.length})</div>
                    <div style={{ display: "grid", gap: 6 }}>
                      {leadGenHistory.map((l: any) => (
                        <div key={l.id} className="table-row" style={{ gridTemplateColumns: "1fr 140px 120px 100px 110px", gap: 12 }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{l.firstName} {l.lastName}</div>
                            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{l.jobTitle} · {l.company}</div>
                          </div>
                          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{l.email}</div>
                          <div>
                            <span className="badge badge-gray">{l.source?.replace("_", " ")}</span>
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>Score: {l.score}</div>
                          <div>
                            {l.importedAsLeadId ? (
                              <span style={{ fontSize: 12, color: "#10b981", fontWeight: 600 }}>✓ Imported</span>
                            ) : (
                              <button className="btn btn-primary btn-sm" style={{ fontSize: 11 }} onClick={() => importLead(l.id)}>Import</button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(!leadGenResults.length && !leadGenHistory?.length) && (
                  <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--text-muted)" }}>
                    <Target size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                    <p>No lead generation campaigns yet. Click "Run Campaign" to let BOLT find your ideal customers.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lead Gen Modal */}
      <Modal open={leadGenModal} onClose={() => setLeadGenModal(false)} title="⚡ AI Lead Generation Campaign">
        <div style={{ padding: "20px", display: "grid", gap: 14 }}>
          <div style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#93c5fd" }}>
            BOLT will find {5} matching prospects, score them, and write personalized outreach.
          </div>
          <FormRow label="Target Industry"><input className="input" value={leadGenForm.targetIndustry} onChange={e => setLeadGenForm(p => ({ ...p, targetIndustry: e.target.value }))} placeholder="SaaS, Healthcare, Fintech..." /></FormRow>
          <FormRow label="Target Job Title"><input className="input" value={leadGenForm.targetTitle} onChange={e => setLeadGenForm(p => ({ ...p, targetTitle: e.target.value }))} placeholder="VP Sales, CTO, CEO..." /></FormRow>
          <FormRow label="Company Size"><input className="input" value={leadGenForm.targetCompanySize} onChange={e => setLeadGenForm(p => ({ ...p, targetCompanySize: e.target.value }))} placeholder="11-50, 51-200, 200+..." /></FormRow>
          <FormRow label="Estimated Deal Value"><input className="input" value={leadGenForm.value} onChange={e => setLeadGenForm(p => ({ ...p, value: e.target.value }))} placeholder="$25,000" /></FormRow>
          <FormRow label="Outreach Purpose"><input className="input" value={leadGenForm.outreachPurpose} onChange={e => setLeadGenForm(p => ({ ...p, outreachPurpose: e.target.value }))} placeholder="product demo, free trial, partnership..." /></FormRow>
        </div>
        <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="btn btn-secondary" onClick={() => setLeadGenModal(false)}>Cancel</button>
          <button className="btn btn-primary" disabled={leadGenRunning} onClick={runLeadGen} style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)" }}>
            {leadGenRunning ? <><span className="spinner" style={{ width: 14, height: 14 }} />Running campaign...</> : <><Zap size={14} /> Launch Campaign</>}
          </button>
        </div>
      </Modal>
    </Layout>
  );
}
