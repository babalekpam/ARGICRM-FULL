import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface State { error: Error | null; }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "var(--bg, #f9fafb)" }}>
        <div style={{ textAlign: "center", maxWidth: 440 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <AlertTriangle size={26} style={{ color: "#ef4444" }} />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px", color: "var(--text-primary, #111827)" }}>Something went wrong</h1>
          <p style={{ fontSize: 14, color: "var(--text-muted, #6b7280)", margin: "0 0 24px", lineHeight: 1.6 }}>
            An unexpected error occurred while displaying this page. Your data is safe — try reloading, or head back to the dashboard.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button className="btn btn-primary" onClick={() => window.location.reload()} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <RefreshCw size={14} /> Reload page
            </button>
            <button className="btn btn-ghost" onClick={() => { window.location.href = "/dashboard"; }} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Home size={14} /> Dashboard
            </button>
          </div>
          {this.state.error.message && (
            <p style={{ fontSize: 12, color: "var(--text-muted, #9ca3af)", marginTop: 20, fontFamily: "monospace", wordBreak: "break-word" }}>
              {this.state.error.message}
            </p>
          )}
        </div>
      </div>
    );
  }
}
