import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "../components/Layout";
import { useLanguage } from "../contexts/LanguageContext";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { TrendingUp, TrendingDown, Award, Users, Zap, BarChart2, Target, Clock } from "lucide-react";

const TABS = ["Revenue Forecast", "Win / Loss", "Sales Velocity", "Rep Performance"] as const;
type Tab = typeof TABS[number];
const TAB_KEYS: Record<Tab, string> = {
  "Revenue Forecast": "analytics_tab_forecast",
  "Win / Loss": "analytics_tab_win_loss",
  "Sales Velocity": "analytics_tab_velocity",
  "Rep Performance": "analytics_tab_rep_performance",
};

const fmt = (n: number) => n >= 1000000 ? `$${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${Math.round(n)}`;
const STAGE_COLORS: Record<string, string> = {
  prospecting: "#6366f1", qualification: "#3b82f6", proposal: "#8b5cf6",
  negotiation: "#f59e0b", closed_won: "#10b981", closed_lost: "#ef4444",
};
const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#6366f1", "#8b5cf6"];

function StatCard({ label, value, sub, icon: Icon, trend, color = "#3b82f6" }: any) {
  const { t } = useLanguage();
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 20px", display: "flex", alignItems: "flex-start", gap: 14 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{sub}</div>}
        {trend !== undefined && (
          <div style={{ fontSize: 11, marginTop: 4, display: "flex", alignItems: "center", gap: 3, color: trend >= 0 ? "#10b981" : "#ef4444" }}>
            {trend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {Math.abs(trend)}% {t("analytics_vs_last_period", "vs last period")}
          </div>
        )}
      </div>
    </div>
  );
}

function ForecastTab() {
  const { t } = useLanguage();
  const { data, isLoading } = useQuery<any>({ queryKey: ["/api/analytics/forecast"] });
  if (isLoading) return <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>{t("loading", "Loading...")}</div>;
  if (!data) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14 }}>
        <StatCard label={t("analytics_total_pipeline", "Total Pipeline")} value={fmt(data.totalPipeline)} icon={TrendingUp} color="#3b82f6" />
        <StatCard label={t("analytics_weighted_forecast", "Weighted Forecast")} value={fmt(data.weightedForecast)} icon={Target} color="#8b5cf6" sub={t("analytics_probability_adjusted", "Probability-adjusted")} />
        <StatCard label={t("analytics_closed_won_alltime", "Closed Won (All Time)")} value={fmt(data.closedWon)} icon={Award} color="#10b981" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>{t("analytics_revenue_trend", "Revenue Trend (6 months)")}</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.trend}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
              <YAxis tickFormatter={v => fmt(v)} tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
              <Tooltip formatter={(v: any) => [fmt(v), "Revenue"]} contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#revGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>{t("analytics_pipeline_by_stage", "Pipeline by Stage")}</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.stageBreakdown} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tickFormatter={v => fmt(v)} tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
              <YAxis type="category" dataKey="stage" tick={{ fontSize: 11, fill: "var(--text-muted)" }} width={90} />
              <Tooltip formatter={(v: any) => [fmt(Number(v)), "Value"]} contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                {data.stageBreakdown.map((entry: any, index: number) => (
                  <Cell key={index} fill={STAGE_COLORS[entry.stage] || PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", fontSize: 14, fontWeight: 600 }}>{t("analytics_stage_breakdown", "Stage Breakdown")}</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--bg-overlay)" }}>
              {[t("analytics_col_stage","Stage"), t("analytics_col_deals","Deals"), t("analytics_col_total_value","Total Value"), t("analytics_col_weighted","Weighted Value"), t("analytics_col_probability","Probability")].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.stageBreakdown.map((row: any) => (
              <tr key={row.stage} style={{ borderTop: "1px solid var(--border)" }}>
                <td style={{ padding: "10px 16px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: STAGE_COLORS[row.stage] || "#6366f1" }} />
                    <span style={{ fontSize: 13, textTransform: "capitalize" }}>{row.stage.replace("_", " ")}</span>
                  </span>
                </td>
                <td style={{ padding: "10px 16px", fontSize: 13 }}>{row.count}</td>
                <td style={{ padding: "10px 16px", fontSize: 13, fontWeight: 500 }}>{fmt(row.total)}</td>
                <td style={{ padding: "10px 16px", fontSize: 13, color: "#10b981" }}>{fmt(row.weighted)}</td>
                <td style={{ padding: "10px 16px", fontSize: 13 }}>{row.probability}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WinLossTab() {
  const { t } = useLanguage();
  const { data, isLoading } = useQuery<any>({ queryKey: ["/api/analytics/win-loss"] });
  if (isLoading) return <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>{t("loading", "Loading...")}</div>;
  if (!data) return null;
  const { summary, monthlyTrend, bySource } = data;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14 }}>
        <StatCard label={t("win_rate", "Win Rate")} value={`${summary.winRate}%`} icon={Award} color="#10b981" />
        <StatCard label={t("analytics_deals_won", "Deals Won")} value={summary.won} icon={TrendingUp} color="#3b82f6" sub={`of ${summary.total} ${t("analytics_closed","closed")}`} />
        <StatCard label={t("analytics_deals_lost", "Deals Lost")} value={summary.lost} icon={TrendingDown} color="#ef4444" />
        <StatCard label={t("analytics_avg_won_value", "Avg Won Value")} value={fmt(summary.avgWonValue)} icon={Target} color="#8b5cf6" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>{t("analytics_won_vs_lost", "Won vs Lost (6 months)")}</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
              <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="won" name="Won" fill="#10b981" radius={[3, 3, 0, 0]} />
              <Bar dataKey="lost" name="Lost" fill="#ef4444" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>{t("analytics_by_source", "By Source")}</div>
          {bySource.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--text-muted)", padding: 40, fontSize: 13 }}>{t("analytics_no_closed_deals", "No closed deals yet")}</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {bySource.map((s: any) => (
                <div key={s.source}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span style={{ textTransform: "capitalize" }}>{s.source}</span>
                    <span style={{ color: "#10b981", fontWeight: 600 }}>{s.winRate}% win rate</span>
                  </div>
                  <div style={{ height: 6, background: "var(--bg-overlay)", borderRadius: 3 }}>
                    <div style={{ height: "100%", width: `${s.winRate}%`, background: "#10b981", borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function VelocityTab() {
  const { t } = useLanguage();
  const { data, isLoading } = useQuery<any>({ queryKey: ["/api/analytics/velocity"] });
  if (isLoading) return <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>{t("loading", "Loading...")}</div>;
  if (!data) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14 }}>
        <StatCard label={t("analytics_avg_sales_cycle", "Avg Sales Cycle")} value={`${data.avgCycleLength} ${t("analytics_days","days")}`} icon={Clock} color="#6366f1" sub={t("analytics_won_deals_only","Won deals only")} />
        <StatCard label={t("analytics_avg_deal_age", "Avg Deal Age")} value={`${data.avgOpenAge} ${t("analytics_days","days")}`} icon={Clock} color="#f59e0b" sub={t("analytics_open_pipeline","Open pipeline")} />
        <StatCard label={t("analytics_sales_velocity", "Sales Velocity")} value={fmt(data.salesVelocity) + "/day"} icon={Zap} color="#3b82f6" sub={t("analytics_revenue_per_day","Revenue generated per day")} />
        <StatCard label={t("analytics_open_deals", "Open Deals")} value={data.openDeals} icon={TrendingUp} color="#10b981" sub={`${fmt(data.totalPipeline)} ${t("analytics_total_value","total value")}`} />
      </div>

      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>{t("analytics_avg_days_in_stage", "Average Days in Stage")}</div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data.byStage}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="stage" tick={{ fontSize: 12, fill: "var(--text-muted)" }} tickFormatter={v => v.replace("_", " ")} />
            <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} unit=" days" />
            <Tooltip
              formatter={(v: any) => [`${v} days`, "Avg duration"]}
              contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
            />
            <Bar dataKey="avgDays" name="Avg Days" radius={[4, 4, 0, 0]}>
              {data.byStage.map((entry: any, index: number) => (
                <Cell key={index} fill={STAGE_COLORS[entry.stage] || PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10 }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", fontSize: 14, fontWeight: 600 }}>{t("analytics_stage_velocity_details", "Stage Velocity Details")}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 0 }}>
          {data.byStage.map((s: any, i: number) => (
            <div key={s.stage} style={{ padding: "16px 20px", borderRight: i < data.byStage.length - 1 ? "1px solid var(--border)" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: STAGE_COLORS[s.stage] || "#6366f1" }} />
                <span style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "capitalize" }}>{s.stage.replace("_", " ")}</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{s.avgDays}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{t("analytics_avg_days","avg days")} · {s.count} {t("analytics_col_deals","deals")}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RepPerformanceTab() {
  const { t } = useLanguage();
  const { data, isLoading } = useQuery<any>({ queryKey: ["/api/analytics/rep-performance"] });
  if (isLoading) return <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>{t("loading", "Loading...")}</div>;
  if (!data) return null;
  const { reps } = data;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14 }}>
        <StatCard label={t("analytics_team_members", "Team Members")} value={reps.length} icon={Users} color="#3b82f6" />
        <StatCard label={t("analytics_total_won_revenue", "Total Won Revenue")} value={fmt(reps.reduce((s: number, r: any) => s + r.wonValue, 0))} icon={Award} color="#10b981" />
        <StatCard label={t("analytics_total_open_deals", "Total Open Deals")} value={reps.reduce((s: number, r: any) => s + r.openDeals, 0)} icon={Target} color="#f59e0b" />
      </div>

      {reps.length === 0 ? (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: 60, textAlign: "center", color: "var(--text-muted)" }}>
          {t("analytics_no_team_members", "No team members found. Invite your team to see performance data.")}
        </div>
      ) : (
        <>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>{t("analytics_revenue_by_rep", "Revenue by Rep")}</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={reps.slice(0, 8).map((r: any) => ({
                name: r.user?.firstName || r.user?.email?.split("@")[0] || "Rep",
                won: r.wonValue, open: r.totalValue - r.wonValue,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                <YAxis tickFormatter={v => fmt(v)} tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                <Tooltip formatter={(v: any) => [fmt(Number(v)), ""]} contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="won" name="Won" fill="#10b981" radius={[3, 3, 0, 0]} stackId="a" />
                <Bar dataKey="open" name="Open" fill="#3b82f6" radius={[3, 3, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", fontSize: 14, fontWeight: 600 }}>{t("analytics_leaderboard", "Leaderboard")}</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg-overlay)" }}>
                  {["#", t("analytics_rep","Rep"), t("analytics_col_won","Won"), t("analytics_col_lost","Lost"), t("analytics_col_open","Open"), t("win_rate","Win Rate"), t("analytics_revenue_won","Revenue Won"), t("analytics_activity","Activity")].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reps.map((r: any, i: number) => (
                  <tr key={r.user?.id || i} style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 700, color: i === 0 ? "#f59e0b" : "var(--text-muted)" }}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff" }}>
                          {(r.user?.firstName?.[0] || r.user?.email?.[0] || "?").toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{r.user?.firstName ? `${r.user.firstName} ${r.user.lastName || ""}`.trim() : r.user?.email}</div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "capitalize" }}>{r.user?.role?.replace("_", " ")}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: 13, color: "#10b981", fontWeight: 600 }}>{r.wonDeals}</td>
                    <td style={{ padding: "12px 14px", fontSize: 13, color: "#ef4444" }}>{r.lostDeals}</td>
                    <td style={{ padding: "12px 14px", fontSize: 13, color: "#3b82f6" }}>{r.openDeals}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ flex: 1, height: 5, background: "var(--bg-overlay)", borderRadius: 3 }}>
                          <div style={{ height: "100%", width: `${r.winRate}%`, background: r.winRate >= 50 ? "#10b981" : "#f59e0b", borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, minWidth: 32 }}>{r.winRate}%</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 600 }}>{fmt(r.wonValue)}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        {r.tasksCompleted} {t("analytics_tasks_done","done")} · {r.tasksOpen} {t("analytics_col_open","open")}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<Tab>("Revenue Forecast");

  return (
    <Layout title={t("analytics_title")} subtitle={t("analytics_subtitle")}>
      <div style={{ display: "flex", gap: 6, marginBottom: 20, background: "var(--bg-overlay)", borderRadius: 10, padding: 4, width: "fit-content" }}>
        {TABS.map(tabKey => (
          <button
            key={tabKey}
            data-testid={`tab-${tabKey.toLowerCase().replace(/\s+/g, "-")}`}
            onClick={() => setTab(tabKey)}
            style={{
              padding: "7px 14px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500,
              background: tab === tabKey ? "var(--bg-card)" : "transparent",
              color: tab === tabKey ? "var(--text-primary)" : "var(--text-muted)",
              boxShadow: tab === tabKey ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
              transition: "all 0.15s",
            }}
          >{t(TAB_KEYS[tabKey], tabKey)}</button>
        ))}
      </div>

      {tab === "Revenue Forecast" && <ForecastTab />}
      {tab === "Win / Loss" && <WinLossTab />}
      {tab === "Sales Velocity" && <VelocityTab />}
      {tab === "Rep Performance" && <RepPerformanceTab />}
    </Layout>
  );
}
