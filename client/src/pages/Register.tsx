import React, { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "../contexts/AuthContext";
import { ArrowRight, ArrowLeft, Check, Building2, User, Lock, Zap } from "lucide-react";
import { useSeoPage } from "../hooks/useSeoPage";
import { PLANS as ALL_PLANS } from "@shared/plans";

// Only show the self-serve plans on the register page (not enterprise)
const PLANS = ALL_PLANS.filter(p => p.id !== "enterprise");

export default function RegisterPage() {
  useSeoPage("Get Started Free — ARGILETTE CRM", "Create your ARGILETTE CRM workspace in 2 minutes. Start a free 14-day trial. No credit card required.");
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ companyName: "", domain: "", firstName: "", lastName: "", email: "", password: "", plan: "trial" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (field: string, value: string) => {
    setForm(p => ({ ...p, [field]: value }));
    if (field === "companyName" && !form.domain) {
      setForm(p => ({ ...p, companyName: value, domain: value.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").slice(0, 30) }));
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message || "Registration failed");
      setStep(2); // go back to form step
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <div style={{ width: "100%", maxWidth: 480 }} className="animate-slide-up">
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32, justifyContent: "center" }}>
          <img src="/assets/logo.png" alt="ARGI CRM" style={{ height: 48, width: "auto", objectFit: "contain" }} />
        </div>

        {/* Accessible page H1 — visually hidden but present for SEO and screen readers */}
        <h1 style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap" }}>
          Create Your ARGILETTE CRM Account — Free 14-Day Trial
        </h1>

        {/* Progress */}
        <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s <= step ? "var(--brand)" : "var(--bg-overlay)", transition: "background 0.3s" }} />
          ))}
        </div>

        <div className="card" style={{ padding: "32px" }}>
          {/* Step 1: Plan */}
          {step === 1 && (
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Choose your plan</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 24 }}>Start free, upgrade anytime.</p>

              <div style={{ display: "grid", gap: 10 }}>
                {PLANS.map(plan => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, plan: plan.id }))}
                    style={{
                      background: form.plan === plan.id ? `rgba(${plan.color === "#3b82f6" ? "59,130,246" : plan.color === "#8b5cf6" ? "139,92,246" : plan.color === "#10b981" ? "16,185,129" : "100,116,139"},0.1)` : "var(--bg-overlay)",
                      border: `1.5px solid ${form.plan === plan.id ? plan.color : "var(--border)"}`,
                      borderRadius: 10,
                      padding: "14px 16px",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s",
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                    }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: `${plan.color}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Zap size={16} style={{ color: plan.color }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{plan.name}</span>
                        {plan.popular && <span className="badge badge-purple" style={{ fontSize: 10 }}>Popular</span>}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{plan.highlights.slice(0, 3).join(" · ")}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: plan.color }}>{plan.price}{plan.period}</div>
                      {form.plan === plan.id && <Check size={14} style={{ color: plan.color, marginTop: 2 }} />}
                    </div>
                  </button>
                ))}
              </div>

              <button className="btn btn-primary btn-lg" style={{ width: "100%", marginTop: 24 }} onClick={() => setStep(2)}>
                Continue <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* Step 2: Company + User info */}
          {step === 2 && (
            <form onSubmit={e => { e.preventDefault(); setStep(3); }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Set up your workspace</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 24 }}>Just a few details to get started.</p>

              {error && (
                <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 14, color: "#f87171" }}>
                  {error}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label className="label">First name</label>
                  <input className="input" placeholder="Abel" value={form.firstName} onChange={e => update("firstName", e.target.value)} required />
                </div>
                <div>
                  <label className="label">Last name</label>
                  <input className="input" placeholder="Nkawula" value={form.lastName} onChange={e => update("lastName", e.target.value)} />
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label className="label">Work email</label>
                <input type="email" className="input" placeholder="you@company.com" value={form.email} onChange={e => update("email", e.target.value)} required />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label className="label">Company name</label>
                <input className="input" placeholder="Acme Corp" value={form.companyName} onChange={e => update("companyName", e.target.value)} required />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label className="label">Workspace URL</label>
                <div style={{ position: "relative" }}>
                  <input
                    className="input"
                    placeholder="acme"
                    value={form.domain}
                    onChange={e => update("domain", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    required
                    style={{ paddingRight: 160 }}
                  />
                  <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--text-muted)", pointerEvents: "none" }}>
                    .argilette.com
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label className="label">Password</label>
                <input type="password" className="input" placeholder="Min. 8 characters" value={form.password} onChange={e => update("password", e.target.value)} required minLength={8} />
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" className="btn btn-secondary btn-lg" onClick={() => setStep(1)}>
                  <ArrowLeft size={16} /> Back
                </button>
                <button type="submit" className="btn btn-primary btn-lg" style={{ flex: 1 }}>
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Review + Submit */}
          {step === 3 && (
            <form onSubmit={submit}>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Almost there!</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 24 }}>Review your workspace details.</p>

              <div style={{ background: "var(--bg-overlay)", borderRadius: 10, padding: "16px", marginBottom: 24 }}>
                {[
                  { icon: Building2, label: "Company", value: form.companyName },
                  { icon: User, label: "Admin", value: `${form.firstName} ${form.lastName} · ${form.email}` },
                  { icon: Lock, label: "Workspace", value: `${form.domain}.argilette.com` },
                  { icon: Zap, label: "Plan", value: PLANS.find(p => p.id === form.plan)?.name },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                    <Icon size={15} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "var(--text-muted)", width: 70, flexShrink: 0 }}>{label}</span>
                    <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>{value}</span>
                  </div>
                ))}
              </div>

              {error && (
                <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 14, color: "#f87171" }}>
                  {error}
                </div>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" className="btn btn-secondary btn-lg" onClick={() => setStep(2)}>
                  <ArrowLeft size={16} /> Back
                </button>
                <button type="submit" className="btn btn-primary btn-lg" style={{ flex: 1 }} disabled={loading}>
                  {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} />Creating workspace...</> : <>Launch workspace <ArrowRight size={16} /></>}
                </button>
              </div>
            </form>
          )}
        </div>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "var(--text-muted)" }}>
          Already have an account?{" "}
          <Link href="/login"><a style={{ color: "var(--brand-light)", fontWeight: 600 }}>Sign in</a></Link>
        </p>
      </div>
    </div>
  );
}
