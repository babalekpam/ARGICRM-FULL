import React, { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { useSeoPage } from "../hooks/useSeoPage";

export default function LoginPage() {
  useSeoPage("Sign In — ARGILETTE CRM", "Sign in to your ARGILETTE CRM workspace. Manage contacts, deals, campaigns and AI agents.");
  const { login } = useAuth();
  const { t } = useLanguage();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message || t("login_failed", "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex" }}>
      {/* Left panel */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px", minHeight: "100vh" }}>
        <div style={{ width: "100%", maxWidth: 400 }} className="animate-slide-up">
          {/* Logo */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ marginBottom: 32 }}>
              <img src="/assets/logo.png" alt="ARGI CRM" style={{ height: 56, width: "auto", objectFit: "contain" }} />
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 8px" }}>{t("login_title", "Welcome back")}</h1>
            <p style={{ fontSize: 15, color: "var(--text-secondary)", margin: 0 }}>{t("login_subtitle", "Sign in to your workspace")}</p>
          </div>

          <form onSubmit={submit}>
            {error && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, padding: "10px 14px", marginBottom: 20, fontSize: 14, color: "#f87171" }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label className="label">{t("email_address", "Email address")}</label>
              <input
                type="email"
                className="input"
                placeholder="you@company.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required
                autoFocus
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label className="label">{t("password_label", "Password")}</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"}
                  className="input"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: "100%" }} disabled={loading}>
              {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} />{t("signing_in", "Signing in...")}</> : <>{t("sign_in", "Sign in")} <ArrowRight size={16} /></>}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "var(--text-muted)" }}>
            {t("no_account", "Don't have an account?")}{" "}
            <Link href="/register"><a style={{ color: "var(--brand-light)", fontWeight: 600 }}>{t("start_trial", "Start free trial")}</a></Link>
          </p>
        </div>
      </div>

      {/* Right decorative panel */}
      <div style={{ flex: 1, background: "linear-gradient(135deg, #0d1426 0%, #111827 100%)", display: "none", position: "relative", overflow: "hidden" }} className="hidden lg:flex">
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 50%, rgba(59,130,246,0.08) 0%, transparent 60%), radial-gradient(ellipse at 70% 20%, rgba(139,92,246,0.06) 0%, transparent 50%)" }} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 60, width: "100%" }}>
          <div style={{ textAlign: "center", maxWidth: 400 }}>
            <div style={{ fontSize: 48, marginBottom: 24 }}>🚀</div>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: "var(--text-primary)", marginBottom: 16, lineHeight: 1.2 }}>
              {t("login_promo_pre", "Your complete")} <span className="gradient-text">{t("login_promo_highlight", "AI business")}</span> {t("login_promo_post", "platform")}
            </h2>
            <p style={{ fontSize: 16, color: "var(--text-secondary)", lineHeight: 1.7 }}>
              {t("login_promo_sub", "CRM, email campaigns, deal pipelines, invoicing, and AI automation — all in one place.")}
            </p>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 48, width: "100%", maxWidth: 360 }}>
            {[
              { value: "10k+", label: t("login_stat_users", "Active Users") },
              { value: "50M+", label: t("login_stat_emails", "Emails Sent") },
              { value: "99.9%", label: t("login_stat_uptime", "Uptime") },
              { value: "150+", label: t("login_stat_countries", "Countries") },
            ].map(stat => (
              <div key={stat.label} className="card" style={{ padding: "16px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--brand-light)" }}>{stat.value}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
