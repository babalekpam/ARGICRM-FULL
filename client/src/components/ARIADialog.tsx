import React, { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Bot, X, Minus, Send, Loader2, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { apiRequest } from "../lib/api";
import { useQueryClient } from "@tanstack/react-query";

// Keys to refresh whenever ARIA modifies data
const CRM_QUERY_KEYS = [
  "/api/contacts", "/api/leads", "/api/deals", "/api/tasks",
  "/api/accounts", "/api/invoices", "/api/campaigns", "/api/dashboard",
];

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  module?: string;
  pending?: boolean;
};

type ARIAStatus = "ready" | "working" | "done";

const MODULE_LABELS: Record<string, string> = {
  crm: "CRM",
  ecommerce: "E-Commerce",
  projects: "Projects",
  billing: "Billing",
  marketing: "Marketing",
  settings: "Settings",
  general: "General",
};

const SUGGESTIONS = [
  "Show me my recent contacts",
  "Create a new project called Q3 Campaign",
  "Add a contact: John Doe, john@example.com",
  "What are my top priorities today?",
  "Give me a summary of today's activity",
];

export default function ARIADialog() {
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [status, setStatus] = useState<ARIAStatus>("ready");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hello! I'm ARIA, your AI command agent. I can help you manage contacts, create projects, find information, and much more across ArgiCRM. What would you like to do?",
      module: "general",
    },
  ]);
  const [currentModule, setCurrentModule] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 50);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === " ") {
        e.preventDefault();
        setIsOpen(prev => !prev);
        setIsMinimized(false);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const sendMessage = useCallback(async (text?: string) => {
    const messageText = (text || input).trim();
    if (!messageText || status === "working") return;

    setInput("");
    setMessages(prev => [
      ...prev,
      { role: "user", content: messageText },
      { role: "assistant", content: "", pending: true },
    ]);
    setStatus("working");
    setCurrentModule(null);

    const historyForApi = messages
      .filter(m => !m.pending)
      .map(m => ({ role: m.role, content: m.content }));

    try {
      const result: any = await apiRequest("POST", "/api/aria/chat", {
        message: messageText,
        history: historyForApi,
      });

      setMessages(prev => {
        const updated = prev.filter(m => !m.pending);
        return [...updated, {
          role: "assistant",
          content: result.response || "Done.",
          module: result.module,
        }];
      });

      if (result.module) setCurrentModule(result.module);
      if (result.pendingAction) setPendingAction(result.pendingAction);
      if (result.navigateTo) {
        setTimeout(() => {
          setLocation(result.navigateTo);
          setIsOpen(false);
        }, 800);
      }

      // Invalidate all CRM caches so pages refresh with ARIA's changes
      if (!result.pendingAction) {
        CRM_QUERY_KEYS.forEach(key => qc.invalidateQueries({ predicate: q => String(q.queryKey[0]).startsWith(key) }));
      }

      setStatus("done");
      setTimeout(() => setStatus("ready"), 2000);
    } catch (err: any) {
      setMessages(prev => {
        const updated = prev.filter(m => !m.pending);
        return [...updated, {
          role: "assistant",
          content: `I ran into an issue: ${err.message || "Please try again."}`,
          module: "general",
        }];
      });
      setStatus("ready");
    }
  }, [input, messages, status, setLocation]);

  const confirmAction = async () => {
    if (!pendingAction) return;
    setStatus("working");
    try {
      const result: any = await apiRequest("POST", "/api/aria/confirm", { action: pendingAction });
      setMessages(prev => [...prev, { role: "assistant", content: result.response || "Done.", module: "general" }]);
      setPendingAction(null);
      CRM_QUERY_KEYS.forEach(key => qc.invalidateQueries({ predicate: q => String(q.queryKey[0]).startsWith(key) }));
      setStatus("done");
      setTimeout(() => setStatus("ready"), 2000);
    } catch {
      setStatus("ready");
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const statusColors: Record<ARIAStatus, string> = {
    ready: "#10b981",
    working: "#f59e0b",
    done: "#3b82f6",
  };

  const statusLabels: Record<ARIAStatus, string> = {
    ready: "ARIA is ready",
    working: "ARIA is working...",
    done: "ARIA is done",
  };

  return (
    <>
      {/* Floating trigger button */}
      <button
        data-testid="button-aria-trigger"
        onClick={() => { setIsOpen(true); setIsMinimized(false); }}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 9000,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #6366f1, #3b82f6)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 20px rgba(99,102,241,0.5)",
          transition: "transform 0.15s, box-shadow 0.15s",
          animation: isOpen ? "none" : undefined,
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 28px rgba(99,102,241,0.65)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(99,102,241,0.5)";
        }}
        title="Ask ARIA (Ctrl+Space)"
      >
        <Bot size={24} color="#fff" />
      </button>

      {/* Dialog panel */}
      {isOpen && (
        <div
          data-testid="panel-aria-dialog"
          style={{
            position: "fixed",
            bottom: 92,
            right: 24,
            zIndex: 9001,
            width: "min(420px, calc(100vw - 48px))",
            height: isMinimized ? "56px" : "520px",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
            transition: "height 0.2s ease",
          }}
        >
          {/* Header */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 16px",
            borderBottom: isMinimized ? "none" : "1px solid var(--border)",
            background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(59,130,246,0.08))",
            flexShrink: 0,
          }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #6366f1, #3b82f6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              <Bot size={17} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>ARIA</span>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  background: "var(--bg-overlay)",
                  padding: "2px 8px",
                  borderRadius: 20,
                  fontSize: 10,
                  fontWeight: 600,
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: statusColors[status], flexShrink: 0 }} />
                  {statusLabels[status]}
                </div>
              </div>
              {currentModule && !isMinimized && (
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>
                  → acting on: {MODULE_LABELS[currentModule] || currentModule}
                </div>
              )}
            </div>
            <button
              data-testid="button-aria-minimize"
              onClick={() => setIsMinimized(prev => !prev)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4, display: "flex", borderRadius: 6 }}
              title={isMinimized ? "Expand" : "Minimize"}
            >
              <Minus size={14} />
            </button>
            <button
              data-testid="button-aria-close"
              onClick={() => setIsOpen(false)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4, display: "flex", borderRadius: 6 }}
            >
              <X size={14} />
            </button>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div
                ref={scrollRef}
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "12px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  scrollbarWidth: "none",
                }}
              >
                {messages.length === 1 && (
                  <div style={{ marginTop: 4 }}>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Try saying…</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {SUGGESTIONS.map(s => (
                        <button
                          key={s}
                          onClick={() => sendMessage(s)}
                          style={{
                            background: "var(--bg-overlay)",
                            border: "1px solid var(--border)",
                            borderRadius: 8,
                            padding: "7px 12px",
                            fontSize: 12,
                            color: "var(--text-secondary)",
                            cursor: "pointer",
                            textAlign: "left",
                            transition: "background 0.1s",
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-elevated)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "var(--bg-overlay)")}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                      gap: 8,
                      alignItems: "flex-end",
                    }}
                  >
                    {msg.role === "assistant" && (
                      <div style={{
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #6366f1, #3b82f6)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginBottom: 2,
                      }}>
                        <Sparkles size={12} color="#fff" />
                      </div>
                    )}
                    <div
                      style={{
                        maxWidth: "82%",
                        padding: "9px 13px",
                        borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                        background: msg.role === "user"
                          ? "linear-gradient(135deg, #6366f1, #3b82f6)"
                          : "var(--bg-elevated)",
                        color: msg.role === "user" ? "#fff" : "var(--text-primary)",
                        fontSize: 13,
                        lineHeight: 1.55,
                        border: msg.role === "assistant" ? "1px solid var(--border)" : "none",
                      }}
                    >
                      {msg.pending ? (
                        <div style={{ display: "flex", gap: 4, alignItems: "center", padding: "2px 0" }}>
                          {[0, 1, 2].map(d => (
                            <div key={d} style={{
                              width: 6, height: 6, borderRadius: "50%",
                              background: "var(--text-muted)",
                              animation: `bounce 1.2s ${d * 0.2}s ease-in-out infinite`,
                            }} />
                          ))}
                        </div>
                      ) : msg.content}
                      {msg.module && msg.role === "assistant" && !msg.pending && (
                        <div style={{ marginTop: 5, fontSize: 10, color: msg.role === "user" ? "rgba(255,255,255,0.6)" : "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          {MODULE_LABELS[msg.module] || msg.module}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {pendingAction && (
                  <div style={{
                    background: "rgba(245,158,11,0.08)",
                    border: "1px solid rgba(245,158,11,0.25)",
                    borderRadius: 10,
                    padding: "10px 12px",
                    fontSize: 12,
                  }}>
                    <div style={{ fontWeight: 600, color: "#f59e0b", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                      <AlertCircle size={13} /> Confirmation needed
                    </div>
                    <div style={{ color: "var(--text-secondary)", marginBottom: 8 }}>
                      This action requires your confirmation. Shall I proceed?
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={confirmAction} style={{ flex: 1, padding: "6px 12px", borderRadius: 8, background: "#f59e0b", border: "none", color: "#fff", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
                        Yes, go ahead
                      </button>
                      <button onClick={() => setPendingAction(null)} style={{ padding: "6px 12px", borderRadius: 8, background: "var(--bg-overlay)", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: 12, cursor: "pointer" }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div style={{
                padding: "10px 12px",
                borderTop: "1px solid var(--border)",
                display: "flex",
                gap: 8,
                alignItems: "center",
                background: "var(--bg-elevated)",
                flexShrink: 0,
              }}>
                <input
                  ref={inputRef}
                  data-testid="input-aria-message"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="What do you want to do?"
                  disabled={status === "working"}
                  style={{
                    flex: 1,
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    padding: "9px 13px",
                    fontSize: 13,
                    color: "var(--text-primary)",
                    outline: "none",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = "#6366f1")}
                  onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                />
                <button
                  data-testid="button-aria-send"
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || status === "working"}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: input.trim() && status !== "working"
                      ? "linear-gradient(135deg, #6366f1, #3b82f6)"
                      : "var(--bg-overlay)",
                    border: "none",
                    cursor: input.trim() && status !== "working" ? "pointer" : "not-allowed",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "background 0.15s",
                  }}
                >
                  {status === "working"
                    ? <Loader2 size={16} color="var(--text-muted)" style={{ animation: "spin 0.8s linear infinite" }} />
                    : <Send size={15} color={input.trim() ? "#fff" : "var(--text-muted)"} />
                  }
                </button>
              </div>
              <div style={{ padding: "4px 16px 8px", fontSize: 10, color: "var(--text-muted)", textAlign: "center" }}>
                Press Ctrl+Space to open/close · Enter to send
              </div>
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
