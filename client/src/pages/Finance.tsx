// ═══════════════════════════════════════════════════════
// FINANCE PAGE
// ═══════════════════════════════════════════════════════
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "../components/Layout";
import { useLanguage } from "../contexts/LanguageContext";
import { Modal, FormRow, Select, Empty, Loader } from "../components/UI";
import { apiRequest } from "../lib/api";
import {
  DollarSign, TrendingUp, TrendingDown, Plus, FileText,
  RefreshCw, Landmark, BarChart2, Calculator, Zap, Edit, Trash2,
  ArrowUpRight, ArrowDownLeft, Target, Globe, Upload, CheckCircle2, Bot, X,
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
  const { t } = useLanguage();
  const [tab, setTab] = useState<typeof TABS_F[number]>("Transactions");
  const [txModal, setTxModal] = useState(false);
  const [bankModal, setBankModal] = useState(false);
  const [form, setForm] = useState<any>(BLANK_TX);
  const [bankForm, setBankForm] = useState(BLANK_BANK);
  const [saving, setSaving] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [syncModal, setSyncModal] = useState<any | null>(null);
  const [csvText, setCsvText] = useState("");
  const [syncResult, setSyncResult] = useState<any>(null);
  const [syncError, setSyncError] = useState("");

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

  const openSync = (acct: any) => {
    setSyncModal(acct);
    setCsvText("");
    setSyncResult(null);
    setSyncError("");
  };
  const closeSync = () => { setSyncModal(null); setSyncResult(null); setSyncError(""); };

  const runSync = async () => {
    if (!syncModal || !csvText.trim()) return;
    setSyncingId(syncModal.id);
    setSyncError("");
    setSyncResult(null);
    try {
      const res = await apiRequest<any>("POST", `/api/finance/accounts/${syncModal.id}/sync`, {
        csvText,
        currency: syncModal.currency || "USD",
      });
      setSyncResult(res);
      qc.invalidateQueries({ queryKey: ["/api/finance/transactions"] });
      qc.invalidateQueries({ queryKey: ["/api/finance/accounts"] });
    } catch (e: any) {
      setSyncError(e?.message || "Import failed — check your CSV format.");
    } finally { setSyncingId(null); }
  };

  const REGION_COLORS: Record<string, string> = { "Global": "#3b82f6", "West Africa": "#10b981", "East Africa": "#f59e0b", "North Africa": "#8b5cf6", "Central Africa": "#06b6d4", "Southern Africa": "#f97316", "Island Nations": "#ec4899", "Asia": "#14b8a6", "Americas": "#6366f1" };

  return (
    <Layout title={t("finance_title")} subtitle={t("finance_subtitle")}
      actions={<button className="btn btn-primary btn-sm" onClick={() => { setForm(BLANK_TX); setTxModal(true); }}><Plus size={14} /> {t("finance_add_transaction", "Add Transaction")}</button>}
    >
      {/* KPI bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { label: t("finance_total_income", "Total Income"), value: `$${Number(txData?.totals?.income || 0).toLocaleString()}`, icon: TrendingUp, color: "#10b981", trend: "+12%" },
          { label: t("finance_total_expenses", "Total Expenses"), value: `$${Number(txData?.totals?.expenses || 0).toLocaleString()}`, icon: TrendingDown, color: "#ef4444", trend: "-3%" },
          { label: t("finance_net_profit", "Net Profit"), value: `$${(Number(txData?.totals?.income || 0) - Number(txData?.totals?.expenses || 0)).toLocaleString()}`, icon: DollarSign, color: "#3b82f6", trend: "" },
          { label: t("transactions", "Transactions"), value: txData?.totals?.count || 0, icon: FileText, color: "#8b5cf6", trend: "" },
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
        {TABS_F.map(tabLabel => <button key={tabLabel} onClick={() => setTab(tabLabel)} className={`btn btn-sm ${tab === tabLabel ? "btn-primary" : "btn-secondary"}`}>{tabLabel}</button>)}
      </div>

      {/* ── TRANSACTIONS ── */}
      {tab === "Transactions" && (
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "100px 1fr 120px 100px 120px 100px", padding: "10px 16px", borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
            {[t("type","Type"), t("description","Description"), t("amount","Amount"), t("currency","Currency"), t("category","Category"), t("date","Date")].map(h => (
              <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</span>
            ))}
          </div>
          {!txData?.data?.length ? <Empty icon={DollarSign} title={t("finance_no_transactions", "No transactions yet")} action={<button className="btn btn-primary" onClick={() => setTxModal(true)}><Plus size={15} /> {t("finance_add_transaction", "Add Transaction")}</button>} /> :
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
            <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>{t("finance_pl_summary", "P&L Summary")} — {new Date().getFullYear()}</h3>
            {[
              { label: t("income", "Revenue"), value: plReport?.revenue, color: "#10b981" },
              { label: t("expenses", "Expenses"), value: plReport?.expenses, color: "#ef4444" },
              { label: t("finance_gross_profit", "Gross Profit"), value: plReport?.grossProfit, color: "#3b82f6" },
              { label: t("finance_profit_margin", "Profit Margin"), value: `${plReport?.margin || 0}%`, color: "#8b5cf6", raw: true },
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
            <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>{t("finance_cashflow_title", "Cash Flow — Last 6 Months")}</h3>
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
            ) : <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>{t("finance_cashflow_empty", "Add transactions to see cash flow chart")}</div>}
          </div>
        </div>
      )}

      {/* ── BANK ACCOUNTS ── */}
      {tab === "Bank Accounts" && (
        <div>
          {/* Explain what bank sync does */}
          <div style={{ padding: "14px 18px", background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 12, marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 12 }}>
            <Bot size={18} style={{ color: "#6366f1", flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>{t("finance_bank_sync_title", "Bank Account Sync — How It Works")}</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Link a bank account and paste your bank statement CSV export. The platform parses every transaction row and uses AI to automatically categorize each one (Payroll, Rent, Software, Revenue, etc.) before saving them to your bookkeeping ledger. All transactions appear in the Transactions tab immediately after sync.
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
                Supported CSV formats: <strong>date, description, amount</strong> — or — <strong>date, description, debit, credit</strong>. Export from any bank (Chase, GTBank, Ecobank, Barclays, etc.)
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
            <button className="btn btn-primary btn-sm" onClick={() => setBankModal(true)}><Plus size={14} /> {t("finance_add_account", "Add Account")}</button>
          </div>

          {!bankAccts?.length ? (
            <Empty icon={Landmark} title={t("finance_no_bank_accounts", "No bank accounts linked")} desc={t("finance_no_bank_accounts_desc", "Add your first bank account to start syncing transactions for bookkeeping")} action={<button className="btn btn-primary" onClick={() => setBankModal(true)}><Plus size={15} /> {t("finance_add_bank_account", "Add Bank Account")}</button>} />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(290px,1fr))", gap: 14 }}>
              {bankAccts.map((a: any) => (
                <div key={a.id} className="card" style={{ padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Landmark size={20} style={{ color: "#3b82f6" }} />
                    </div>
                    <button
                      data-testid={`button-sync-${a.id}`}
                      className="btn btn-primary btn-sm"
                      onClick={() => openSync(a)}
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <Upload size={13} /> {t("finance_import_csv", "Import CSV")}
                    </button>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{a.name}</div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 10 }}>{a.institution} · <span style={{ textTransform: "capitalize" }}>{a.accountType || a.account_type}</span></div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#10b981" }}>{a.currency} {Number(a.balance || 0).toLocaleString()}</div>
                  {a.lastSyncedAt && (
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8, display: "flex", alignItems: "center", gap: 5 }}>
                      <CheckCircle2 size={11} style={{ color: "#10b981" }} />
                      {t("finance_last_synced", "Last synced")} {new Date(a.lastSyncedAt).toLocaleDateString()}
                    </div>
                  )}
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
            <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>{t("finance_tax_rates", "Tax Rates")}</h3>
            {!taxRates?.length ? <p style={{ color: "var(--text-muted)", fontSize: 14 }}>{t("finance_no_tax_rates", "No tax rates configured yet.")}</p> :
              taxRates.map(r => (
                <div key={r.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 14 }}>{r.name} {r.country && `(${r.country})`}</span>
                  <span style={{ fontWeight: 700 }}>{(Number(r.rate) * 100).toFixed(1)}%</span>
                </div>
              ))
            }
            <button className="btn btn-primary btn-sm" style={{ marginTop: 14 }} onClick={async () => {
              await apiRequest("POST", "/api/finance/tax-rates", { name: "Standard Tax", rate: "0.20", country: "US" }); // "Standard Tax" is a default data value, not UI chrome
              qc.invalidateQueries({ queryKey: ["/api/finance/tax-rates"] });
            }}><Plus size={13} /> {t("finance_add_tax_rate", "Add Tax Rate")}</button>
          </div>
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>{t("finance_tax_calculator", "Tax Calculator")}</h3>
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

      {/* ── CSV Import / Sync Modal ── */}
      <Modal open={!!syncModal} onClose={closeSync} title={`Import Transactions — ${syncModal?.name}`}>
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
          {!syncResult ? (
            <>
              <div style={{ padding: "12px 14px", background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.18)", borderRadius: 10, fontSize: 12, lineHeight: 1.6, color: "var(--text-secondary)" }}>
                <strong style={{ color: "var(--text-primary)" }}>How to export your CSV:</strong>
                <ol style={{ margin: "6px 0 0 16px", padding: 0 }}>
                  <li>Log in to your bank's internet banking portal</li>
                  <li>Go to Statements or Transaction History</li>
                  <li>Select your date range and download as <strong>CSV</strong></li>
                  <li>Open the file, copy all content, and paste it below</li>
                </ol>
                <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-muted)" }}>
                  Required columns: <code>date</code>, <code>description</code>, and <code>amount</code> (or <code>debit</code> + <code>credit</code>)
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Paste CSV Content</label>
                <textarea
                  data-testid="input-csv-text"
                  className="input"
                  rows={10}
                  style={{ width: "100%", resize: "vertical", fontFamily: "monospace", fontSize: 12 }}
                  value={csvText}
                  onChange={e => setCsvText(e.target.value)}
                  placeholder={`date,description,amount\n2024-01-05,Client Payment - Acme Corp,5000\n2024-01-07,Office Rent,-1200\n2024-01-10,Stripe Payout,3200\n2024-01-12,AWS Cloud Services,-180`}
                />
              </div>

              {syncError && (
                <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 9, color: "#ef4444", fontSize: 13 }}>
                  {syncError}
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderTop: "1px solid var(--border)" }}>
                <Bot size={14} style={{ color: "#6366f1" }} />
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>AI will auto-categorize each transaction (Payroll, Rent, Revenue, etc.)</span>
              </div>
            </>
          ) : (
            /* Success state */
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "10px 0" }}>
              <CheckCircle2 size={44} style={{ color: "#10b981" }} />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 800, fontSize: 18 }}>{syncResult.synced} Transactions Imported</div>
                <div style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>AI categorized and saved to your bookkeeping ledger</div>
              </div>
              {syncResult.transactions?.length > 0 && (
                <div style={{ width: "100%", maxHeight: 240, overflowY: "auto", border: "1px solid var(--border)", borderRadius: 10 }}>
                  {syncResult.transactions.slice(0, 20).map((tx: any, i: number) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 14px", borderBottom: "1px solid var(--border)" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{tx.description}</div>
                        <div style={{ fontSize: 11, color: "#6366f1" }}>{tx.category}</div>
                      </div>
                      <div style={{ fontWeight: 700, color: tx.type === "income" ? "#10b981" : "#ef4444", fontSize: 14 }}>
                        {tx.type === "income" ? "+" : "-"}{tx.currency} {Number(tx.amount).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>View all transactions in the Transactions tab</div>
            </div>
          )}
        </div>
        <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          {!syncResult ? (
            <>
              <button type="button" className="btn btn-secondary" onClick={closeSync}>Cancel</button>
              <button
                data-testid="button-run-sync"
                type="button"
                className="btn btn-primary"
                disabled={!csvText.trim() || !!syncingId}
                onClick={runSync}
                style={{ display: "flex", alignItems: "center", gap: 7 }}
              >
                <RefreshCw size={13} style={{ animation: syncingId ? "spin 0.6s linear infinite" : "none" }} />
                {syncingId ? "Importing & categorizing…" : "Import & Sync"}
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={closeSync}>Done</button>
          )}
        </div>
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
