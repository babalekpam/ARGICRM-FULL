import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "../components/Layout";
import { useLanguage } from "../contexts/LanguageContext";
import { apiRequest } from "../lib/api";
import {
  Store, Search, Filter, Download, UserPlus, Globe, MapPin,
  Building2, Phone, Mail, Briefcase, RefreshCw, Check, Lock,
  ChevronDown, ChevronUp, BarChart2, AlertCircle, Zap, CheckSquare,
  Square, Settings, Play, Eye, TrendingUp,
} from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────
const INDUSTRIES = [
  "All Industries", "Healthcare", "Legal", "Real Estate", "Retail",
  "Restaurant", "Finance", "Technology", "Education", "Construction",
  "Manufacturing", "Transportation", "Hospitality", "Insurance",
];

const MARKETS = ["Both", "US", "Africa"];
const LANGUAGES = ["Any", "EN", "FR"];
const FRESH_DAYS = [
  { label: "All time", value: 0 },
  { label: "Last 30 days", value: 30 },
  { label: "Last 90 days", value: 90 },
];

const SOURCE_COLORS: Record<string, string> = {
  npi: "#3b82f6",
  cms: "#8b5cf6",
  overpass: "#10b981",
  opencorporates: "#f59e0b",
  yelp: "#ef4444",
  yellowpages: "#f97316",
};

const SOURCE_LABELS: Record<string, string> = {
  npi: "NPI Registry",
  cms: "CMS Medicare",
  overpass: "OpenStreetMap",
  opencorporates: "OpenCorporates",
  yelp: "Yelp",
  yellowpages: "Yellow Pages",
};

// ── Sub-components ─────────────────────────────────────────────────

function QuotaMeter({ used, quota }: { used: number; quota: number }) {
  const isUnlimited = quota === -1;
  const pct = isUnlimited ? 0 : Math.min(100, (used / quota) * 100);
  const color = pct >= 90 ? "#ef4444" : pct >= 70 ? "#f59e0b" : "#10b981";
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: 180 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12, color: "var(--text-muted)" }}>
          <span style={{ fontWeight: 600 }}>Monthly Export Quota</span>
          <span style={{ fontWeight: 700, color }}>
            {isUnlimited ? "Unlimited" : `${used} / ${quota}`}
          </span>
        </div>
        {!isUnlimited && (
          <div style={{ height: 6, background: "var(--bg-overlay)", borderRadius: 3 }}>
            <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width 0.5s ease" }} />
          </div>
        )}
      </div>
      {!isUnlimited && (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 700, color }}>{Math.max(0, quota - used)}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>remaining</div>
        </div>
      )}
    </div>
  );
}

function SourceBadge({ source }: { source: string }) {
  const color = SOURCE_COLORS[source] || "#64748b";
  const label = SOURCE_LABELS[source] || source;
  return (
    <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700, background: `${color}18`, color, letterSpacing: "0.02em" }}>
      {label}
    </span>
  );
}

function MarketBadge({ market }: { market: string }) {
  const color = market === "Africa" ? "#10b981" : "#3b82f6";
  return (
    <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700, background: `${color}15`, color }}>
      {market}
    </span>
  );
}

function QualityDot({ score }: { score: number }) {
  const color = score >= 7 ? "#10b981" : score >= 4 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{score}/10</span>
    </div>
  );
}

function LeadCard({ lead, selected, onToggle, canExport }: {
  lead: any; selected: boolean; onToggle: () => void; canExport: boolean;
}) {
  return (
    <div
      onClick={canExport ? onToggle : undefined}
      data-testid={`card-marketplace-lead-${lead.id}`}
      style={{
        display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
        background: selected ? "rgba(99,102,241,0.06)" : "var(--bg-card)",
        border: `1px solid ${selected ? "rgba(99,102,241,0.25)" : "var(--border)"}`,
        borderRadius: 10, cursor: canExport ? "pointer" : "default",
        transition: "all 0.15s",
        filter: lead.blurred ? "none" : undefined,
      }}>
      {/* Checkbox */}
      {canExport && (
        <div style={{ flexShrink: 0 }}>
          {selected
            ? <CheckSquare size={16} style={{ color: "#6366f1" }} />
            : <Square size={16} style={{ color: "var(--text-muted)" }} />}
        </div>
      )}

      {/* Avatar */}
      <div style={{
        width: 38, height: 38, borderRadius: 8,
        background: lead.blurred ? "var(--bg-overlay)" : `hsl(${lead.id?.charCodeAt(0) * 7 % 360},55%,42%)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 15, fontWeight: 700, color: "#fff", flexShrink: 0,
        filter: lead.blurred ? "blur(4px)" : undefined,
      }}>
        {lead.blurred ? <Lock size={16} style={{ color: "var(--text-muted)" }} /> : (lead.companyName?.[0] || lead.fullName?.[0] || "?")}
      </div>

      {/* Main info */}
      <div style={{ flex: 1, minWidth: 0, filter: lead.blurred ? "blur(4px)" : undefined }}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>
          {lead.companyName || lead.fullName || "—"}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", gap: 10, flexWrap: "wrap" }}>
          {lead.title && <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Briefcase size={10} />{lead.title}</span>}
          {lead.city && <span style={{ display: "flex", alignItems: "center", gap: 3 }}><MapPin size={10} />{lead.city}{lead.state ? `, ${lead.state}` : ""}</span>}
          {lead.email && <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Mail size={10} />{lead.email}</span>}
          {lead.phone && <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Phone size={10} />{lead.phone}</span>}
        </div>
      </div>

      {/* Right badges */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5, flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <SourceBadge source={lead.source} />
          <MarketBadge market={lead.market} />
        </div>
        <QualityDot score={lead.qualityScore || 0} />
      </div>

      {lead.blurred && (
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--text-muted)" }}>
          <Lock size={12} /> Export to unlock
        </div>
      )}
    </div>
  );
}

// ── Admin Panel ─────────────────────────────────────────────────────
function AdminPanel() {
  const { data: adminStats, isLoading } = useQuery<any>({ queryKey: ["/api/marketplace/admin/stats"] });
  const [triggering, setTriggering] = useState<string | null>(null);
  const qc = useQueryClient();

  async function triggerSource(source?: string) {
    setTriggering(source || "all");
    try {
      await apiRequest("POST", "/api/marketplace/admin/trigger", { source });
      setTimeout(() => { qc.invalidateQueries({ queryKey: ["/api/marketplace/admin/stats"] }); }, 3000);
    } finally { setTriggering(null); }
  }

  if (isLoading) return <div style={{ padding: 20, color: "var(--text-muted)", fontSize: 13 }}>Loading admin data…</div>;

  const logs: any[] = adminStats?.recentLogs || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Overview cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
        {[
          { label: "Total Leads", value: adminStats?.totalLeads?.toLocaleString() || "0", color: "#6366f1", icon: Store },
          { label: "US Leads", value: adminStats?.byMarket?.find((m: any) => m.market === "US")?.count?.toLocaleString() || "0", color: "#3b82f6", icon: Globe },
          { label: "Africa Leads", value: adminStats?.byMarket?.find((m: any) => m.market === "Africa")?.count?.toLocaleString() || "0", color: "#10b981", icon: Globe },
          { label: "Total Exports", value: adminStats?.totalExports?.toLocaleString() || "0", color: "#f59e0b", icon: Download },
          { label: "Low Quality", value: adminStats?.lowQualityLeads?.toLocaleString() || "0", color: "#ef4444", icon: AlertCircle },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: 16 }}>
            <Icon size={16} style={{ color, marginBottom: 8 }} />
            <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Source breakdown + manual triggers */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Data Sources</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { key: "npi", label: "NPI Registry (US Healthcare)" },
            { key: "cms", label: "CMS Medicare (US Healthcare)" },
            { key: "overpass", label: "OpenStreetMap/Africa" },
          ].map(({ key, label }) => {
            const srcData = adminStats?.bySource?.find((s: any) => s.source === key);
            return (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", background: "var(--bg-overlay)", borderRadius: 8 }}>
                <SourceBadge source={key} />
                <span style={{ flex: 1, fontSize: 13 }}>{label}</span>
                <span style={{ fontSize: 12, color: "var(--text-muted)", marginRight: 8 }}>{srcData?.count?.toLocaleString() || "0"} records</span>
                <button
                  onClick={() => triggerSource(key)}
                  disabled={triggering !== null || adminStats?.ingestionRunning}
                  data-testid={`btn-trigger-${key}`}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  {triggering === key ? <RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Play size={12} />}
                  Run
                </button>
              </div>
            );
          })}
        </div>
        <button
          onClick={() => triggerSource()}
          disabled={triggering !== null || adminStats?.ingestionRunning}
          data-testid="btn-trigger-all"
          style={{ marginTop: 12, width: "100%", padding: "10px 0", background: adminStats?.ingestionRunning ? "var(--bg-overlay)" : "#6366f1", color: adminStats?.ingestionRunning ? "var(--text-muted)" : "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {adminStats?.ingestionRunning
            ? <><RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> Ingestion running…</>
            : <><Zap size={14} /> Run All Sources Now</>}
        </button>
      </div>

      {/* Ingestion log */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Recent Ingestion Logs</div>
        {logs.length === 0
          ? <div style={{ fontSize: 12, color: "var(--text-muted)", padding: "20px 0", textAlign: "center" }}>No ingestion logs yet — first run starts 15s after server boot</div>
          : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {logs.map((log: any) => (
                <div key={log.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "var(--bg-overlay)", borderRadius: 8, fontSize: 12 }}>
                  <SourceBadge source={log.source} />
                  <span style={{ flex: 1 }}>{log.market}</span>
                  <span style={{ color: "#10b981", fontWeight: 600 }}>+{log.recordsAdded}</span>
                  <span style={{ color: "var(--text-muted)" }}>{log.recordsSkipped} skipped</span>
                  <span style={{ color: log.status === "success" ? "#10b981" : "#f59e0b", fontWeight: 600 }}>{log.status}</span>
                  <span style={{ color: "var(--text-muted)" }}>{log.duration ? `${(log.duration / 1000).toFixed(1)}s` : "—"}</span>
                  <span style={{ color: "var(--text-muted)" }}>{log.startedAt ? new Date(log.startedAt).toLocaleDateString() : "—"}</span>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}

// ── Main Marketplace page ────────────────────────────────────────────
export default function MarketplacePage() {
  const { t } = useLanguage();
  const qc = useQueryClient();

  const PAGE_SIZE = 50;

  const [filters, setFilters] = useState({
    market: "Both", industry: "", specialty: "", country: "", state: "",
    city: "", language: "Any", freshDays: 0, search: "",
  });
  const [searchSubmitted, setSearchSubmitted] = useState(false);
  const [page, setPage]                       = useState(1);
  const [selected, setSelected]               = useState<Set<string>>(new Set());
  const [showAdmin, setShowAdmin]             = useState(false);
  const [exporting, setExporting]             = useState(false);
  const [pushingCRM, setPushingCRM]           = useState(false);
  const [exportResult, setExportResult]       = useState<{ count: number; skipped?: number; duplicates?: number; type: "csv" | "crm" } | null>(null);

  const { data: statsData } = useQuery<any>({ queryKey: ["/api/marketplace/stats"] });

  const { data: searchData, isLoading: searching } = useQuery<any>({
    queryKey: ["/api/marketplace/search", filters, page],
    queryFn: async () => {
      if (!searchSubmitted) return null;
      return apiRequest("POST", "/api/marketplace/search", {
        ...filters,
        language: filters.language === "Any" ? undefined : filters.language,
        industry: filters.industry === "All Industries" ? undefined : filters.industry,
        freshDays: filters.freshDays || undefined,
        limit: PAGE_SIZE,
        page,
      });
    },
    enabled: searchSubmitted,
  });

  const results: any[] = searchData?.results || [];
  const total: number  = searchData?.total || 0;
  const totalPages     = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const quota: number          = statsData?.quota ?? 0;
  const exportsUsed: number    = searchData?.exportsUsed ?? statsData?.exportsUsed ?? 0;
  const canExport: boolean     = quota === -1 || (exportsUsed < quota);

  function setFilter(k: string, v: any) {
    setFilters(f => ({ ...f, [k]: v }));
  }

  function runSearch() {
    setSelected(new Set());
    setExportResult(null);
    setPage(1);
    setSearchSubmitted(true);
    qc.invalidateQueries({ queryKey: ["/api/marketplace/search"] });
  }

  function goToPage(p: number) {
    const clamped = Math.max(1, Math.min(p, totalPages));
    if (clamped === page) return;
    setPage(clamped);
    setSelected(new Set());
    setExportResult(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleSelect(id: string) {
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }

  function toggleAll() {
    const exportable = results.filter(r => !r.blurred).map(r => r.id);
    if (exportable.every(id => selected.has(id))) {
      setSelected(new Set());
    } else {
      setSelected(new Set(exportable));
    }
  }

  async function exportCSV() {
    if (selected.size === 0) return;
    setExporting(true);
    setExportResult(null);
    try {
      const res: any = await apiRequest("POST", "/api/marketplace/export", { leadIds: [...selected] });
      if (res.upgrade) { alert(res.error); return; }

      // Generate CSV
      const headers = ["Name", "Company", "Title", "Email", "Phone", "Website", "Address", "City", "State", "Country", "Industry", "Specialty", "Source", "Market", "Language"];
      const rows = (res.leads || []).map((l: any) => [
        l.fullName, l.companyName, l.title, l.email, l.phone, l.website,
        l.address, l.city, l.state, l.country, l.industry, l.specialty,
        l.source, l.market, l.language,
      ].map(v => `"${(v || "").replace(/"/g, '""')}"`).join(","));
      const csv = [headers.join(","), ...rows].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `marketplace_leads_${Date.now()}.csv`; a.click();
      URL.revokeObjectURL(url);
      setExportResult({ count: res.exported || 0, type: "csv" });
      qc.invalidateQueries({ queryKey: ["/api/marketplace/stats"] });
    } finally { setExporting(false); }
  }

  async function pushToCRM() {
    if (selected.size === 0) return;
    setPushingCRM(true);
    setExportResult(null);
    try {
      const res: any = await apiRequest("POST", "/api/marketplace/push-to-crm", { leadIds: [...selected] });
      if (res.error) { alert(res.error); return; }
      setExportResult({ count: res.pushed || 0, duplicates: res.duplicates || 0, skipped: res.skipped || 0, type: "crm" });
      qc.invalidateQueries({ queryKey: ["/api/marketplace/stats"] });
      setSelected(new Set());
    } catch (e: any) {
      alert(`Import failed: ${e.message || "Unknown error"}`);
    } finally { setPushingCRM(false); }
  }

  return (
    <Layout title="Data Marketplace" subtitle="Verified leads from public sources — included in your plan">
      <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 1100, margin: "0 auto" }}>

        {/* Stats bar */}
        {statsData && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10 }}>
            {[
              { label: "Total Records", value: Number(statsData.total).toLocaleString(), color: "#6366f1" },
              { label: "US Records", value: Number(statsData.us).toLocaleString(), color: "#3b82f6" },
              { label: "Africa Records", value: Number(statsData.africa).toLocaleString(), color: "#10b981" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color }}>{value}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{label}</div>
              </div>
            ))}
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Sources Active</div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center" }}>
                {(statsData.sources || []).slice(0, 3).map((s: string) => (
                  <span key={s} style={{ fontSize: 9, padding: "2px 6px", background: "rgba(99,102,241,0.1)", color: "#818cf8", borderRadius: 8, fontWeight: 600 }}>{s.split("/")[0]}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Quota meter */}
        {statsData && <QuotaMeter used={exportsUsed} quota={quota} />}

        {/* Search & filters */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <Filter size={16} style={{ color: "#6366f1" }} /> Search & Filter
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12, marginBottom: 14 }}>
            {/* Market */}
            <div>
              <label style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, display: "block", marginBottom: 5 }}>Market</label>
              <div style={{ display: "flex", gap: 6 }}>
                {MARKETS.map(m => (
                  <button key={m} onClick={() => setFilter("market", m)} data-testid={`btn-market-${m}`}
                    style={{ flex: 1, padding: "7px 0", border: "1px solid", borderColor: filters.market === m ? "#6366f1" : "var(--border)", background: filters.market === m ? "rgba(99,102,241,0.1)" : "var(--bg-overlay)", color: filters.market === m ? "#818cf8" : "var(--text-muted)", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Industry */}
            <div>
              <label style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, display: "block", marginBottom: 5 }}>Industry</label>
              <select value={filters.industry || "All Industries"} onChange={e => setFilter("industry", e.target.value)} data-testid="select-marketplace-industry"
                style={{ width: "100%", padding: "8px 10px", background: "var(--bg-overlay)", border: "1px solid var(--border)", borderRadius: 7, color: "var(--text-primary)", fontSize: 12 }}>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>

            {/* Language */}
            <div>
              <label style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, display: "block", marginBottom: 5 }}>Language</label>
              <div style={{ display: "flex", gap: 6 }}>
                {LANGUAGES.map(l => (
                  <button key={l} onClick={() => setFilter("language", l)}
                    style={{ flex: 1, padding: "7px 0", border: "1px solid", borderColor: filters.language === l ? "#6366f1" : "var(--border)", background: filters.language === l ? "rgba(99,102,241,0.1)" : "var(--bg-overlay)", color: filters.language === l ? "#818cf8" : "var(--text-muted)", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Freshness */}
            <div>
              <label style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, display: "block", marginBottom: 5 }}>Data Freshness</label>
              <select value={filters.freshDays} onChange={e => setFilter("freshDays", Number(e.target.value))}
                style={{ width: "100%", padding: "8px 10px", background: "var(--bg-overlay)", border: "1px solid var(--border)", borderRadius: 7, color: "var(--text-primary)", fontSize: 12 }}>
                {FRESH_DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>

            {/* Country */}
            <div>
              <label style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, display: "block", marginBottom: 5 }}>Country</label>
              <input value={filters.country} onChange={e => setFilter("country", e.target.value)} placeholder="e.g. US, Nigeria, Ghana…" data-testid="input-marketplace-country"
                style={{ width: "100%", padding: "8px 10px", background: "var(--bg-overlay)", border: "1px solid var(--border)", borderRadius: 7, color: "var(--text-primary)", fontSize: 12, boxSizing: "border-box" }} />
            </div>

            {/* City */}
            <div>
              <label style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, display: "block", marginBottom: 5 }}>City / State</label>
              <input value={filters.city} onChange={e => setFilter("city", e.target.value)} placeholder="e.g. New York, Lagos…" data-testid="input-marketplace-city"
                style={{ width: "100%", padding: "8px 10px", background: "var(--bg-overlay)", border: "1px solid var(--border)", borderRadius: 7, color: "var(--text-primary)", fontSize: 12, boxSizing: "border-box" }} />
            </div>
          </div>

          {/* Full-text search */}
          <div style={{ position: "relative", marginBottom: 14 }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input value={filters.search} onChange={e => setFilter("search", e.target.value)}
              onKeyDown={e => e.key === "Enter" && runSearch()}
              placeholder="Search by name, company, specialty, city…" data-testid="input-marketplace-search"
              style={{ width: "100%", padding: "10px 12px 10px 36px", background: "var(--bg-overlay)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 13, boxSizing: "border-box" }} />
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={runSearch} disabled={searching} data-testid="btn-marketplace-search"
              style={{ padding: "10px 22px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}>
              {searching ? <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Search size={14} />}
              {searching ? "Searching…" : "Search Leads"}
            </button>

            {quota === 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#f59e0b", padding: "0 12px", background: "rgba(245,158,11,0.08)", borderRadius: 8, border: "1px solid rgba(245,158,11,0.2)" }}>
                <AlertCircle size={13} /> Upgrade to Professional to export leads
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        {searchSubmitted && (
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
            {/* Results header */}
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>
                  {searching ? "Searching…" : `${total.toLocaleString()} leads found`}
                </span>
                {canExport && results.length > 0 && (
                  <button onClick={toggleAll} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}>
                    <Square size={13} /> {selected.size > 0 ? `${selected.size} selected` : "Select all visible"}
                  </button>
                )}
              </div>

              {selected.size > 0 && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={exportCSV} disabled={exporting} data-testid="btn-export-csv"
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    {exporting ? <RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Download size={12} />}
                    Export {selected.size} CSV
                  </button>
                  <button onClick={pushToCRM} disabled={pushingCRM} data-testid="btn-push-crm"
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "#10b981", color: "#fff", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    {pushingCRM ? <RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} /> : <UserPlus size={12} />}
                    Push to CRM
                  </button>
                </div>
              )}
            </div>

            {/* Export result message */}
            {exportResult && (
              <div style={{ padding: "10px 20px", background: "rgba(16,185,129,0.06)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#34d399" }}>
                <Check size={14} />
                {exportResult.type === "csv"
                  ? `${exportResult.count} leads exported to CSV — check your downloads`
                  : (() => {
                    const parts = [`${exportResult.count} lead${exportResult.count !== 1 ? "s" : ""} added to CRM`];
                    if (exportResult.duplicates) parts.push(`${exportResult.duplicates} duplicate${exportResult.duplicates !== 1 ? "s" : ""} skipped`);
                    if (exportResult.skipped)    parts.push(`${exportResult.skipped} error${exportResult.skipped !== 1 ? "s" : ""}`);
                    return parts.join(" · ");
                  })()
                }
              </div>
            )}

            {/* Lead list */}
            {searching ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                <RefreshCw size={20} style={{ animation: "spin 1s linear infinite", marginBottom: 10 }} /><br />
                Searching {Number(statsData?.total || 0).toLocaleString()} records…
              </div>
            ) : results.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                No leads found. Try different filters or a broader search.
              </div>
            ) : (
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                {/* Preview note for blurred rows */}
                {results.some(r => r.blurred) && (
                  <div style={{ padding: "10px 14px", background: "rgba(99,102,241,0.06)", borderRadius: 8, fontSize: 12, color: "#818cf8", marginBottom: 4 }}>
                    <Lock size={12} style={{ verticalAlign: "middle", marginRight: 5 }} />
                    First 3 leads shown in full. Select and export to unlock the rest — counts against your monthly quota.
                  </div>
                )}
                {results.map(lead => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    selected={selected.has(lead.id)}
                    onToggle={() => toggleSelect(lead.id)}
                    canExport={canExport && !lead.blurred}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {!searching && totalPages > 1 && (
              <div style={{
                padding: "14px 20px",
                borderTop: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  Page <strong style={{ color: "var(--text-primary)" }}>{page}</strong> of <strong style={{ color: "var(--text-primary)" }}>{totalPages.toLocaleString()}</strong>
                  {" "}·{" "}
                  <span style={{ color: "var(--text-secondary)" }}>{total.toLocaleString()} total leads</span>
                </span>

                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {/* First */}
                  <button
                    onClick={() => goToPage(1)}
                    disabled={page === 1}
                    data-testid="btn-page-first"
                    style={{
                      padding: "5px 10px", fontSize: 12, fontWeight: 600, borderRadius: 6, border: "1px solid var(--border)",
                      background: page === 1 ? "var(--bg-elevated)" : "var(--bg-card)",
                      color: page === 1 ? "var(--text-muted)" : "var(--text-primary)",
                      cursor: page === 1 ? "not-allowed" : "pointer",
                    }}
                  >«</button>

                  {/* Prev */}
                  <button
                    onClick={() => goToPage(page - 1)}
                    disabled={page === 1}
                    data-testid="btn-page-prev"
                    style={{
                      padding: "5px 10px", fontSize: 12, fontWeight: 600, borderRadius: 6, border: "1px solid var(--border)",
                      background: page === 1 ? "var(--bg-elevated)" : "var(--bg-card)",
                      color: page === 1 ? "var(--text-muted)" : "var(--text-primary)",
                      cursor: page === 1 ? "not-allowed" : "pointer",
                    }}
                  >‹ Prev</button>

                  {/* Page number buttons — show window of 5 */}
                  {(() => {
                    const half = 2;
                    let start = Math.max(1, page - half);
                    let end   = Math.min(totalPages, start + 4);
                    if (end - start < 4) start = Math.max(1, end - 4);
                    const pages: number[] = [];
                    for (let i = start; i <= end; i++) pages.push(i);
                    return pages.map(p => (
                      <button
                        key={p}
                        onClick={() => goToPage(p)}
                        data-testid={`btn-page-${p}`}
                        style={{
                          padding: "5px 10px", fontSize: 12, fontWeight: 600, borderRadius: 6,
                          border: p === page ? "1px solid #6366f1" : "1px solid var(--border)",
                          background: p === page ? "#6366f1" : "var(--bg-card)",
                          color: p === page ? "#fff" : "var(--text-primary)",
                          cursor: "pointer", minWidth: 34,
                        }}
                      >{p}</button>
                    ));
                  })()}

                  {/* Next */}
                  <button
                    onClick={() => goToPage(page + 1)}
                    disabled={page === totalPages}
                    data-testid="btn-page-next"
                    style={{
                      padding: "5px 10px", fontSize: 12, fontWeight: 600, borderRadius: 6, border: "1px solid var(--border)",
                      background: page === totalPages ? "var(--bg-elevated)" : "var(--bg-card)",
                      color: page === totalPages ? "var(--text-muted)" : "var(--text-primary)",
                      cursor: page === totalPages ? "not-allowed" : "pointer",
                    }}
                  >Next ›</button>

                  {/* Last */}
                  <button
                    onClick={() => goToPage(totalPages)}
                    disabled={page === totalPages}
                    data-testid="btn-page-last"
                    style={{
                      padding: "5px 10px", fontSize: 12, fontWeight: 600, borderRadius: 6, border: "1px solid var(--border)",
                      background: page === totalPages ? "var(--bg-elevated)" : "var(--bg-card)",
                      color: page === totalPages ? "var(--text-muted)" : "var(--text-primary)",
                      cursor: page === totalPages ? "not-allowed" : "pointer",
                    }}
                  >»</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Admin panel */}
        {(
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
            <button onClick={() => setShowAdmin(a => !a)} data-testid="btn-toggle-admin"
              style={{ width: "100%", padding: "14px 20px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 700 }}>
                <Settings size={16} style={{ color: "#6366f1" }} /> Data Ingestion Admin
              </span>
              {showAdmin ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {showAdmin && (
              <div style={{ padding: "0 20px 20px" }}>
                <AdminPanel />
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </Layout>
  );
}
