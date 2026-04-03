// ═══════════════════════════════════════════════════════
// FINANCE PAGE
// ═══════════════════════════════════════════════════════
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "../components/Layout";
import { Modal, FormRow, Select, Empty, Loader } from "../components/UI";
import { apiRequest } from "../lib/api";
import {
  DollarSign, TrendingUp, TrendingDown, Plus, FileText,
  RefreshCw, Landmark, BarChart2, Calculator, Zap, Edit, Trash2,
  ArrowUpRight, ArrowDownLeft, Target, Globe
} from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Link } from "wouter";

const TABS_F = ["Transactions", "Reports", "Bank Accounts", "Tax", "Currencies"] as const;
const TX_TYPES = [{ value: "income", label: "Income" }, { value: "expense", label: "Expense" }, { value: "transfer", label: "Transfer" }];
const BLANK_TX = { type: "income", description: "", amount: "", currency: "USD", category: "", date: new Date().toISOString().slice(0, 10) };
const BLANK_BANK = { name: "", institution: "", accountType: "checking", currency: "USD" };
const BANK_TYPES = [{ value: "checking", label: "Checking" }, { value: "savings", label: "Savings" }, { value: "credit", label: "Credit Card" }, { value: "investment", label: "Investment" }, { value: "other", label: "Other" }];

export function FinancePage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<typeof TABS_F[number]>("Transactions");
  const [txModal, setTxModal] = useState(false);
  const [bankModal, setBankModal] = useState(false);
  const [form, setForm] = useState<any>(BLANK_TX);
  const [bankForm, setBankForm] = useState(BLANK_BANK);
  const [saving, setSaving] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const { data: txData } = useQuery<{ data: any[]; totals: any }>({ queryKey: ["/api/finance/transactions"], enabled: tab === "Transactions" });
  const { data: plReport } = useQuery<any>({ queryKey: ["/api/finance/reports/pl"], enabled: tab === "Reports" });
  const { data: cashflow } = useQuery<any[]>({ queryKey: ["/api/finance/reports/cashflow"], enabled: tab === "Reports" });
  const { data: bankAccts } = useQuery<any[]>({ queryKey: ["/api/finance/accounts"], enabled: tab === "Bank Accounts" });
  const { data: taxRates } = useQuery<any[]>({ queryKey: ["/api/finance/tax-rates"], enabled: tab === "Tax" });
  const { data: currencies } = useQuery<any[]>({ queryKey: ["/api/finance/currencies"] });

  const saveTx = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { await apiRequest("POST", "/api/finance/transactions", form); qc.invalidateQueries({ queryKey: ["/api/finance/transactions"] }); setTxModal(false); }
    finally { setSaving(false); }
  };

  const saveBankAcct = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      await apiRequest("POST", "/api/finance/accounts", bankForm);
      qc.invalidateQueries({ queryKey: ["/api/finance/accounts"] });
      setBankModal(false);
      setBankForm(BLANK_BANK);
    } finally { setSaving(false); }
  };

  const syncAccount = async (id: string) => {
    setSyncingId(id);
    try { await apiRequest("POST", `/api/finance/accounts/${id}/sync`, {}); qc.invalidateQueries({ queryKey: ["/api/finance/transactions"] }); qc.invalidateQueries({ queryKey: ["/api/finance/accounts"] }); }
    finally { setSyncingId(null); }
  };

  const REGION_COLORS: Record<string, string> = { "Global": "#3b82f6", "West Africa": "#10b981", "East Africa": "#f59e0b", "North Africa": "#8b5cf6", "Central Africa": "#06b6d4", "Southern Africa": "#f97316", "Island Nations": "#ec4899", "Asia": "#14b8a6", "Americas": "#6366f1" };

  return (
    <Layout title="Financial Management" subtitle="Multi-currency bookkeeping, invoicing, bank feeds & tax"
      actions={<button className="btn btn-primary btn-sm" onClick={() => { setForm(BLANK_TX); setTxModal(true); }}><Plus size={14} /> Add Transaction</button>}
    >
      {/* KPI bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Total Income", value: `$${Number(txData?.totals?.income || 0).toLocaleString()}`, icon: TrendingUp, color: "#10b981", trend: "+12%" },
          { label: "Total Expenses", value: `$${Number(txData?.totals?.expenses || 0).toLocaleString()}`, icon: TrendingDown, color: "#ef4444", trend: "-3%" },
          { label: "Net Profit", value: `$${(Number(txData?.totals?.income || 0) - Number(txData?.totals?.expenses || 0)).toLocaleString()}`, icon: DollarSign, color: "#3b82f6", trend: "" },
          { label: "Transactions", value: txData?.totals?.count || 0, icon: FileText, color: "#8b5cf6", trend: "" },
        ].map(k => { const Icon = k.icon; return (
          <div key={k.label} className="card" style={{ padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${k.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={16} style={{ color: k.color }} /></div>
              {k.trend && <span style={{ fontSize: 12, fontWeight: 700, color: k.trend.startsWith("+") ? "#10b981" : "#ef4444" }}>{k.trend}</span>}
            </div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{k.value}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{k.label}</div>
          </div>
        );})}
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 16, flexWrap: "wrap" }}>
        {TABS_F.map(t => <button key={t} onClick={() => setTab(t)} className={`btn btn-sm ${tab === t ? "btn-primary" : "btn-secondary"}`}>{t}</button>)}
      </div>

      {/* ── TRANSACTIONS ── */}
      {tab === "Transactions" && (
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "100px 1fr 120px 100px 120px 100px", padding: "10px 16px", borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
            {["Type", "Description", "Amount", "Currency", "Category", "Date"].map(h => (
              <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</span>
            ))}
          </div>
          {!txData?.data?.length ? <Empty icon={DollarSign} title="No transactions yet" action={<button className="btn btn-primary" onClick={() => setTxModal(true)}><Plus size={15} /> Add Transaction</button>} /> :
            txData.data.map((tx: any) => (
              <div key={tx.id} className="table-row" style={{ gridTemplateColumns: "100px 1fr 120px 100px 120px 100px", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {tx.type === "income" ? <ArrowDownLeft size={14} style={{ color: "#10b981" }} /> : <ArrowUpRight size={14} style={{ color: "#ef4444" }} />}
                  <span style={{ fontSize: 12, fontWeight: 700, color: tx.type === "income" ? "#10b981" : "#ef4444", textTransform: "capitalize" }}>{tx.type}</span>
                </div>
                <div style={{ fontSize: 14 }}>{tx.description}</div>
                <div style={{ fontWeight: 700, color: tx.type === "income" ? "#10b981" : "#ef4444" }}>
                  {tx.type === "income" ? "+" : "-"}${Math.abs(Number(tx.amount)).toLocaleString()}
                </div>
                <div style={{ fontSize: 12 }}>{tx.currency}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{tx.category || "—"}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{new Date(tx.date).toLocaleDateString()}</div>
              </div>
            ))}
        </div>
      )}

      {/* ── REPORTS ── */}
      {tab === "Reports" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>P&L Summary — {new Date().getFullYear()}</h3>
            {[
              { label: "Revenue", value: plReport?.revenue, color: "#10b981" },
              { label: "Expenses", value: plReport?.expenses, color: "#ef4444" },
              { label: "Gross Profit", value: plReport?.grossProfit, color: "#3b82f6" },
              { label: "Profit Margin", value: `${plReport?.margin || 0}%`, color: "#8b5cf6", raw: true },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>{r.label}</span>
                <span style={{ fontWeight: 800, fontSize: 16, color: r.color }}>
                  {r.raw ? r.value : `$${Number(r.value || 0).toLocaleString()}`}
                </span>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>Cash Flow — Last 6 Months</h3>
            {(cashflow?.length || 0) > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={cashflow}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.1)" }} />
                  <Bar dataKey="income" fill="#10b981" radius={[3, 3, 0, 0]} name="Income" />
                  <Bar dataKey="expense" fill="#ef4444" radius={[3, 3, 0, 0]} name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            ) : <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>Add transactions to see cash flow chart</div>}
          </div>
        </div>
      )}

      {/* ── BANK ACCOUNTS ── */}
      {tab === "Bank Accounts" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
            <button className="btn btn-primary btn-sm" onClick={() => setBankModal(true)}><Plus size={14} /> Add Account</button>
          </div>
          {!bankAccts?.length ? <Empty icon={Landmark} title="No bank accounts" desc="Connect your bank accounts to sync transactions automatically" /> : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
              {bankAccts.map((a: any) => (
                <div key={a.id} className="card" style={{ padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 11, background: "rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🏦</div>
                    <button className="btn btn-secondary btn-sm" disabled={syncingId === a.id} onClick={() => syncAccount(a.id)}>
                      <RefreshCw size={13} style={{ animation: syncingId === a.id ? "spin 0.6s linear infinite" : "none" }} /> Sync
                    </button>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{a.name}</div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{a.institution} · {a.accountType || a.account_type}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#10b981", marginTop: 10 }}>{a.currency} {Number(a.balance || 0).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAX ── */}
      {tab === "Tax" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>Tax Rates</h3>
            {!taxRates?.length ? <p style={{ color: "var(--text-muted)", fontSize: 14 }}>No tax rates configured yet.</p> :
              taxRates.map(r => (
                <div key={r.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 14 }}>{r.name} {r.country && `(${r.country})`}</span>
                  <span style={{ fontWeight: 700 }}>{(Number(r.rate) * 100).toFixed(1)}%</span>
                </div>
              ))
            }
            <button className="btn btn-primary btn-sm" style={{ marginTop: 14 }} onClick={async () => {
              await apiRequest("POST", "/api/finance/tax-rates", { name: "Standard Tax", rate: "0.20", country: "US" });
              qc.invalidateQueries({ queryKey: ["/api/finance/tax-rates"] });
            }}><Plus size={13} /> Add Tax Rate</button>
          </div>
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>Tax Calculator</h3>
            <TaxCalculatorWidget />
          </div>
        </div>
      )}

      {/* ── CURRENCIES ── */}
      {tab === "Currencies" && (
        <div>
          <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 16 }}>
            Supports <strong>{currencies?.length || 54}+</strong> currencies including all 54 African currencies across all regions.
          </div>
          {Object.entries(
            (currencies || []).reduce((acc: Record<string, any[]>, c: any) => { (acc[c.region] = acc[c.region] || []).push(c); return acc; }, {})
          ).map(([region, curs]) => (
            <div key={region} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: REGION_COLORS[region] || "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>{region}</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {(curs as any[]).map((c: any) => (
                  <div key={c.code} style={{ padding: "8px 12px", background: "var(--bg-overlay)", borderRadius: 8, border: "1px solid var(--border)", minWidth: 120 }}>
                    <div style={{ fontSize: 14, fontWeight: 800 }}>{c.symbol} {c.code}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{c.name}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={txModal} onClose={() => setTxModal(false)} title="Add Transaction">
        <form onSubmit={saveTx}>
          <div style={{ padding: "20px", display: "grid", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormRow label="Type"><Select options={TX_TYPES} value={form.type} onChange={e => setForm((p: any) => ({ ...p, type: e.target.value }))} /></FormRow>
              <FormRow label="Date"><input type="date" className="input" value={form.date} onChange={e => setForm((p: any) => ({ ...p, date: e.target.value }))} /></FormRow>
            </div>
            <FormRow label="Description" required><input className="input" value={form.description} onChange={e => setForm((p: any) => ({ ...p, description: e.target.value }))} required /></FormRow>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormRow label="Amount" required><input type="number" className="input" value={form.amount} onChange={e => setForm((p: any) => ({ ...p, amount: e.target.value }))} required /></FormRow>
              <FormRow label="Currency"><input className="input" value={form.currency} onChange={e => setForm((p: any) => ({ ...p, currency: e.target.value }))} placeholder="USD, XOF, NGN..." /></FormRow>
            </div>
            <FormRow label="Category"><input className="input" value={form.category} onChange={e => setForm((p: any) => ({ ...p, category: e.target.value }))} placeholder="Revenue, Payroll, Software..." /></FormRow>
          </div>
          <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-secondary" onClick={() => setTxModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "Add Transaction"}</button>
          </div>
        </form>
      </Modal>

      {/* Bank Account Modal */}
      <Modal open={bankModal} onClose={() => { setBankModal(false); setBankForm(BLANK_BANK); }} title="Add Bank Account">
        <form onSubmit={saveBankAcct}>
          <div style={{ padding: "20px", display: "grid", gap: 14 }}>
            <FormRow label="Account Name" required>
              <input data-testid="input-bank-name" className="input" value={bankForm.name} onChange={e => setBankForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Business Checking" required />
            </FormRow>
            <FormRow label="Institution">
              <input data-testid="input-bank-institution" className="input" value={bankForm.institution} onChange={e => setBankForm(p => ({ ...p, institution: e.target.value }))} placeholder="e.g. Chase, GTBank, Ecobank" />
            </FormRow>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormRow label="Account Type">
                <Select options={BANK_TYPES} value={bankForm.accountType} onChange={e => setBankForm(p => ({ ...p, accountType: e.target.value }))} />
              </FormRow>
              <FormRow label="Currency">
                <input data-testid="input-bank-currency" className="input" value={bankForm.currency} onChange={e => setBankForm(p => ({ ...p, currency: e.target.value.toUpperCase() }))} placeholder="USD, EUR, NGN…" maxLength={5} />
              </FormRow>
            </div>
          </div>
          <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-secondary" onClick={() => { setBankModal(false); setBankForm(BLANK_BANK); }}>Cancel</button>
            <button data-testid="button-save-bank" type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Adding..." : "Add Account"}</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}

function TaxCalculatorWidget() {
  const [amount, setAmount] = useState("");
  const [country, setCountry] = useState("US");
  const [result, setResult] = useState<any>(null);

  const calculate = async () => {
    const r = await apiRequest<any>("POST", "/api/finance/calculate-tax", { amount, country });
    setResult(r);
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div><label className="label">Amount</label><input type="number" className="input" value={amount} onChange={e => setAmount(e.target.value)} placeholder="1000" /></div>
      <div><label className="label">Country</label><input className="input" value={country} onChange={e => setCountry(e.target.value)} placeholder="US, GB, NG..." /></div>
      <button className="btn btn-primary" onClick={calculate} disabled={!amount}><Calculator size={14} /> Calculate</button>
      {result && (
        <div style={{ background: "var(--bg-overlay)", borderRadius: 10, padding: "14px 16px" }}>
          {[["Subtotal", `$${Number(result.amount).toFixed(2)}`], ["Tax Rate", `${(result.taxRate * 100).toFixed(1)}%`], ["Tax Amount", `$${result.taxAmount.toFixed(2)}`], ["Total", `$${result.total.toFixed(2)}`]].map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border)", fontSize: 14 }}>
              <span style={{ color: "var(--text-muted)" }}>{l}</span>
              <span style={{ fontWeight: 700 }}>{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const REGION_COLORS: Record<string, string> = { "Global": "#3b82f6", "West Africa": "#10b981", "East Africa": "#f59e0b", "North Africa": "#8b5cf6", "Central Africa": "#06b6d4", "Southern Africa": "#f97316", "Island Nations": "#ec4899", "Asia": "#14b8a6", "Americas": "#6366f1" };

export default FinancePage;
