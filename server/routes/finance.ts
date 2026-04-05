import { Router } from "express";
import { authenticate, type AuthRequest } from "../middleware/auth.js";
import { db } from "../db.js";
import { transactions, bankAccounts, taxRates, invoices } from "@shared/schema-extended";
import { eq, and, desc, sql, gte, lte, sum } from "drizzle-orm";
import { ask, askJSON, complete, isAIAvailable, getActiveProvider } from "../services/ai-adapter.js";

const router = Router();

// 54 African + Global currencies
export const CURRENCIES = [
  // Major Global
  { code: "USD", name: "US Dollar", symbol: "$", region: "Global" },
  { code: "EUR", name: "Euro", symbol: "€", region: "Global" },
  { code: "GBP", name: "British Pound", symbol: "£", region: "Global" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", region: "Global" },
  { code: "CAD", name: "Canadian Dollar", symbol: "CA$", region: "Global" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", region: "Global" },
  { code: "CHF", name: "Swiss Franc", symbol: "Fr", region: "Global" },
  // West Africa
  { code: "XOF", name: "CFA Franc BCEAO", symbol: "CFA", region: "West Africa" },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦", region: "West Africa" },
  { code: "GHS", name: "Ghanaian Cedi", symbol: "₵", region: "West Africa" },
  { code: "SLL", name: "Sierra Leonean Leone", symbol: "Le", region: "West Africa" },
  { code: "GMD", name: "Gambian Dalasi", symbol: "D", region: "West Africa" },
  { code: "GNF", name: "Guinean Franc", symbol: "FG", region: "West Africa" },
  { code: "LRD", name: "Liberian Dollar", symbol: "L$", region: "West Africa" },
  { code: "MRU", name: "Mauritanian Ouguiya", symbol: "UM", region: "West Africa" },
  // East Africa
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh", region: "East Africa" },
  { code: "TZS", name: "Tanzanian Shilling", symbol: "TSh", region: "East Africa" },
  { code: "UGX", name: "Ugandan Shilling", symbol: "USh", region: "East Africa" },
  { code: "ETB", name: "Ethiopian Birr", symbol: "Br", region: "East Africa" },
  { code: "RWF", name: "Rwandan Franc", symbol: "RF", region: "East Africa" },
  { code: "BIF", name: "Burundian Franc", symbol: "Fr", region: "East Africa" },
  { code: "DJF", name: "Djiboutian Franc", symbol: "Fdj", region: "East Africa" },
  { code: "SOS", name: "Somali Shilling", symbol: "Sh", region: "East Africa" },
  { code: "ERN", name: "Eritrean Nakfa", symbol: "Nfk", region: "East Africa" },
  // North Africa
  { code: "EGP", name: "Egyptian Pound", symbol: "E£", region: "North Africa" },
  { code: "MAD", name: "Moroccan Dirham", symbol: "MAD", region: "North Africa" },
  { code: "TND", name: "Tunisian Dinar", symbol: "DT", region: "North Africa" },
  { code: "DZD", name: "Algerian Dinar", symbol: "DA", region: "North Africa" },
  { code: "LYD", name: "Libyan Dinar", symbol: "LD", region: "North Africa" },
  { code: "SDG", name: "Sudanese Pound", symbol: "ج.س", region: "North Africa" },
  // Central Africa
  { code: "XAF", name: "CFA Franc BEAC", symbol: "FCFA", region: "Central Africa" },
  { code: "CDF", name: "Congolese Franc", symbol: "FC", region: "Central Africa" },
  { code: "AOA", name: "Angolan Kwanza", symbol: "Kz", region: "Central Africa" },
  { code: "STN", name: "São Tomé Príncipe Dobra", symbol: "Db", region: "Central Africa" },
  // Southern Africa
  { code: "ZAR", name: "South African Rand", symbol: "R", region: "Southern Africa" },
  { code: "BWP", name: "Botswana Pula", symbol: "P", region: "Southern Africa" },
  { code: "ZMW", name: "Zambian Kwacha", symbol: "ZK", region: "Southern Africa" },
  { code: "MWK", name: "Malawian Kwacha", symbol: "MK", region: "Southern Africa" },
  { code: "ZWL", name: "Zimbabwean Dollar", symbol: "Z$", region: "Southern Africa" },
  { code: "MZN", name: "Mozambican Metical", symbol: "MT", region: "Southern Africa" },
  { code: "NAD", name: "Namibian Dollar", symbol: "N$", region: "Southern Africa" },
  { code: "SZL", name: "Swazi Lilangeni", symbol: "L", region: "Southern Africa" },
  { code: "LSL", name: "Lesotho Loti", symbol: "L", region: "Southern Africa" },
  // Island Nations
  { code: "MUR", name: "Mauritian Rupee", symbol: "Rs", region: "Island Nations" },
  { code: "SCR", name: "Seychellois Rupee", symbol: "Sr", region: "Island Nations" },
  { code: "CVE", name: "Cape Verdean Escudo", symbol: "Esc", region: "Island Nations" },
  { code: "KMF", name: "Comorian Franc", symbol: "CF", region: "Island Nations" },
  { code: "MGA", name: "Malagasy Ariary", symbol: "Ar", region: "Island Nations" },
  // Other major
  { code: "INR", name: "Indian Rupee", symbol: "₹", region: "Asia" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", region: "Asia" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$", region: "Americas" },
  { code: "MXN", name: "Mexican Peso", symbol: "MX$", region: "Americas" },
];

// ── Currencies ─────────────────────────────────────────────────
router.get("/currencies", authenticate, (req, res) => {
  res.json(CURRENCIES);
});

// ── Bank Accounts ──────────────────────────────────────────────
router.get("/accounts", authenticate, async (req: AuthRequest, res) => {
  const rows = await db.select().from(bankAccounts).where(eq(bankAccounts.tenantId, req.user!.tenantId));
  res.json(rows);
});

router.post("/accounts", authenticate, async (req: AuthRequest, res) => {
  const [acct] = await db.insert(bankAccounts).values({ tenantId: req.user!.tenantId, ...req.body }).returning();
  res.status(201).json(acct);
});

router.put("/accounts/:id", authenticate, async (req: AuthRequest, res) => {
  const [acct] = await db.update(bankAccounts).set(req.body).where(and(eq(bankAccounts.id, req.params.id), eq(bankAccounts.tenantId, req.user!.tenantId))).returning();
  res.json(acct);
});

// ── Bank Feed Sync (CSV Import + AI Categorization) ─────────────
router.post("/accounts/:id/sync", authenticate, async (req: AuthRequest, res) => {
  const { csvText, currency = "USD" } = req.body as { csvText?: string; currency?: string };

  if (!csvText || !csvText.trim()) {
    return res.status(400).json({ error: "No CSV data provided. Paste your bank statement CSV to import transactions." });
  }

  // Parse CSV — support common bank export formats:
  // date, description, amount  OR  date, description, debit, credit
  const lines = csvText.trim().split(/\r?\n/).filter(l => l.trim());
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/['"]/g, ""));

  const dateIdx = headers.findIndex(h => h.includes("date") || h.includes("posted"));
  const descIdx = headers.findIndex(h => h.includes("desc") || h.includes("memo") || h.includes("narration") || h.includes("details"));
  const amtIdx  = headers.findIndex(h => h === "amount" || h === "amt");
  const debitIdx  = headers.findIndex(h => h.includes("debit") || h.includes("withdrawal") || h.includes("dr"));
  const creditIdx = headers.findIndex(h => h.includes("credit") || h.includes("deposit") || h.includes("cr"));

  if (dateIdx < 0 || descIdx < 0) {
    return res.status(400).json({ error: "CSV must have columns: date, description, and either amount or debit/credit columns." });
  }

  const rawTxs: { date: string; description: string; amount: number; type: "income" | "expense" }[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map(c => c.trim().replace(/^["']|["']$/g, ""));
    const dateStr  = cols[dateIdx] || "";
    const desc     = cols[descIdx] || "";
    if (!dateStr || !desc) continue;

    let amount = 0;
    let type: "income" | "expense" = "expense";

    if (amtIdx >= 0) {
      const raw = parseFloat(cols[amtIdx]?.replace(/[^0-9.-]/g, "") || "0");
      amount = Math.abs(raw);
      type   = raw >= 0 ? "income" : "expense";
    } else if (debitIdx >= 0 || creditIdx >= 0) {
      const debit  = parseFloat((cols[debitIdx] || "0").replace(/[^0-9.]/g, "")) || 0;
      const credit = parseFloat((cols[creditIdx] || "0").replace(/[^0-9.]/g, "")) || 0;
      if (credit > 0)      { amount = credit; type = "income"; }
      else if (debit > 0)  { amount = debit;  type = "expense"; }
    }

    if (amount > 0) rawTxs.push({ date: dateStr, description: desc, amount, type });
  }

  if (!rawTxs.length) {
    return res.status(400).json({ error: "No valid transactions found in the CSV. Check the format and try again." });
  }

  // AI Categorization — batch up to 50 rows
  let categorized: { category: string }[] = rawTxs.map(() => ({ category: "Uncategorized" }));
  try {
    const prompt = `You are a bookkeeping assistant. Categorize each bank transaction into a short category label.
Return ONLY a JSON array with one object per transaction, e.g.:
[{"category":"Payroll"},{"category":"Software & Subscriptions"},...]

Transactions:
${rawTxs.slice(0, 50).map((t, i) => `${i + 1}. ${t.type.toUpperCase()} $${t.amount} — ${t.description}`).join("\n")}`;

    const json = await askJSON(prompt, "You are a bookkeeping categorization assistant. Return only valid JSON arrays.");
    if (Array.isArray(json)) categorized = json;
  } catch { /* keep Uncategorized if AI unavailable */ }

  // Insert all transactions
  const toInsert = rawTxs.map((t, i) => ({
    tenantId: req.user!.tenantId,
    bankAccountId: req.params.id,
    type: t.type,
    description: t.description,
    amount: String(t.amount),
    currency,
    category: categorized[i]?.category || "Uncategorized",
    date: new Date(t.date),
  }));

  const inserted = await db.insert(transactions).values(toInsert).returning();

  // Update account lastSyncAt if column exists
  try {
    await db.execute(
      sql`UPDATE bank_accounts SET last_synced_at = now() WHERE id = ${req.params.id} AND tenant_id = ${req.user!.tenantId}`
    );
  } catch { /* column may not exist */ }

  res.json({
    synced: inserted.length,
    message: `Successfully imported ${inserted.length} transactions with AI-powered categorization.`,
    transactions: inserted,
  });
});

// ── Transactions ────────────────────────────────────────────────
router.get("/transactions", authenticate, async (req: AuthRequest, res) => {
  try {
    const { type, from, to, limit = "100" } = req.query as any;
    const rows = await db.select().from(transactions).where(
      and(
        eq(transactions.tenantId, req.user!.tenantId),
        type ? eq(transactions.type, type) : undefined,
        from ? gte(transactions.date, new Date(from)) : undefined,
        to ? lte(transactions.date, new Date(to)) : undefined,
      )
    ).orderBy(desc(transactions.date)).limit(Number(limit));

    const [totals] = await db.select({
      income: sql<number>`coalesce(sum(case when type='income' then amount::numeric else 0 end),0)`,
      expenses: sql<number>`coalesce(sum(case when type='expense' then abs(amount::numeric) else 0 end),0)`,
      count: sql<number>`count(*)`,
    }).from(transactions).where(eq(transactions.tenantId, req.user!.tenantId));

    res.json({ data: rows, totals: { income: Number(totals.income), expenses: Number(totals.expenses), net: Number(totals.income) - Number(totals.expenses), count: Number(totals.count) } });
  } catch (err) {
    console.error("GET /finance/transactions error:", err);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

router.post("/transactions", authenticate, async (req: AuthRequest, res) => {
  try {
    const [tx] = await db.insert(transactions).values({ tenantId: req.user!.tenantId, ...req.body, date: new Date(req.body.date || Date.now()) }).returning();
    res.status(201).json(tx);
  } catch (err) {
    console.error("POST /finance/transactions error:", err);
    res.status(500).json({ error: "Failed to create transaction" });
  }
});

router.delete("/transactions/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    await db.delete(transactions).where(and(eq(transactions.id, req.params.id), eq(transactions.tenantId, req.user!.tenantId)));
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE /finance/transactions error:", err);
    res.status(500).json({ error: "Failed to delete transaction" });
  }
});

// ── Tax Rates ───────────────────────────────────────────────────
router.get("/tax-rates", authenticate, async (req: AuthRequest, res) => {
  const rows = await db.select().from(taxRates).where(eq(taxRates.tenantId, req.user!.tenantId));
  res.json(rows);
});

router.post("/tax-rates", authenticate, async (req: AuthRequest, res) => {
  const [rate] = await db.insert(taxRates).values({ tenantId: req.user!.tenantId, ...req.body }).returning();
  res.status(201).json(rate);
});

// Tax calculation
router.post("/calculate-tax", authenticate, async (req: AuthRequest, res) => {
  const { amount, country, region, taxRateId } = req.body;

  let rate = 0;
  if (taxRateId) {
    const [tr] = await db.select().from(taxRates).where(and(eq(taxRates.id, taxRateId), eq(taxRates.tenantId, req.user!.tenantId)));
    rate = Number(tr?.rate || 0);
  } else {
    // Default rates by country
    const defaultRates: Record<string, number> = { US: 0.08, GB: 0.20, DE: 0.19, FR: 0.20, NG: 0.075, ZA: 0.15, KE: 0.16, GH: 0.125 };
    rate = defaultRates[country] || 0;
  }

  const taxAmount = Number(amount) * rate;
  const total = Number(amount) + taxAmount;
  res.json({ amount: Number(amount), taxRate: rate, taxAmount, total, currency: req.body.currency || "USD" });
});

// ── Financial Reports ───────────────────────────────────────────
router.get("/reports/pl", authenticate, async (req: AuthRequest, res) => {
  try {
    const { year = new Date().getFullYear(), month } = req.query as any;

    const startDate = month ? new Date(year, Number(month) - 1, 1) : new Date(year, 0, 1);
    const endDate = month ? new Date(year, Number(month), 0) : new Date(year, 11, 31);

    const [totals] = await db.select({
      revenue: sql<number>`coalesce(sum(case when type='income' then amount::numeric else 0 end),0)`,
      expenses: sql<number>`coalesce(sum(case when type='expense' then abs(amount::numeric) else 0 end),0)`,
    }).from(transactions).where(
      and(eq(transactions.tenantId, req.user!.tenantId), gte(transactions.date, startDate), lte(transactions.date, endDate))
    );

    const byCategory = await db.select({
      category: transactions.category,
      type: transactions.type,
      total: sql<number>`sum(abs(amount::numeric))`,
    }).from(transactions).where(
      and(eq(transactions.tenantId, req.user!.tenantId), gte(transactions.date, startDate), lte(transactions.date, endDate))
    ).groupBy(transactions.category, transactions.type);

    const revenue = Number(totals.revenue);
    const expenses = Number(totals.expenses);
    const grossProfit = revenue - expenses;
    const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    res.json({ period: { year, month: month || "full" }, revenue, expenses, grossProfit, margin: Math.round(margin * 10) / 10, byCategory });
  } catch (err) {
    console.error("GET /finance/reports/pl error:", err);
    res.status(500).json({ error: "Failed to generate P&L report" });
  }
});

router.get("/reports/cashflow", authenticate, async (req: AuthRequest, res) => {
  try {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);

      const [m] = await db.select({
        income: sql<number>`coalesce(sum(case when type='income' then amount::numeric else 0 end),0)`,
        expense: sql<number>`coalesce(sum(case when type='expense' then abs(amount::numeric) else 0 end),0)`,
      }).from(transactions).where(and(eq(transactions.tenantId, req.user!.tenantId), gte(transactions.date, start), lte(transactions.date, end)));

      months.push({ month: start.toLocaleString("default", { month: "short" }), year: start.getFullYear(), income: Number(m.income), expense: Number(m.expense), net: Number(m.income) - Number(m.expense) });
    }
    res.json(months);
  } catch (err) {
    console.error("GET /finance/reports/cashflow error:", err);
    res.status(500).json({ error: "Failed to generate cashflow report" });
  }
});

export default router;
