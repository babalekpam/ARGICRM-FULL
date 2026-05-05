import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

interface UsageData {
  plan: string;
  monthlyLimit: number;       // -1 = unlimited
  used: number;
  remaining: number;          // -1 = unlimited
  totalCredits: number;
  totalCostUsd: string;
  avgConfidence: number;      // 0..1
  statusBreakdown: {
    succeeded: number; failed: number; applied: number; rejected: number;
  };
  byTopic: Array<{
    topic: string; calls: number; avg_confidence: number; avg_dissent: number;
    credits: number; cost_usd: number;
  }>;
  history: Array<{ day: string; calls: number; credits: number }>;
}

export default function CouncilUsage() {
  const { data, isLoading, error } = useQuery<UsageData>({
    queryKey: ["/api/council/usage"],
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return <div className="p-6 text-sm text-gray-500">Loading usage…</div>;
  }
  if (error || !data) {
    return <div className="p-6 text-sm text-red-600">Failed to load council usage.</div>;
  }

  const usagePct = data.monthlyLimit === -1
    ? 0
    : Math.min(100, Math.round((data.used / Math.max(1, data.monthlyLimit)) * 100));
  const projectionPct = (() => {
    if (data.monthlyLimit === -1 || data.history.length === 0) return null;
    const dailyAvg = data.history.reduce((a, h) => a + h.calls, 0) / Math.max(1, data.history.length);
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const dayOfMonth = today.getDate();
    const projected = Math.round(dailyAvg * daysInMonth);
    return { projected, ofLimit: Math.round((projected / Math.max(1, data.monthlyLimit)) * 100), daysLeft: daysInMonth - dayOfMonth };
  })();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Council Usage</h1>
          <p className="text-sm text-gray-500 mt-1">
            Per-tenant cost transparency. Every council decision is shown
            with its cost in credits + USD, success rate, and outcome
            distribution. The dashboard is live (auto-refreshes every 30s).
          </p>
        </div>
        <Link href="/council" className="text-sm text-blue-600 hover:underline">
          ← Back to Council
        </Link>
      </header>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="This month"
          value={`${data.used}${data.monthlyLimit === -1 ? "" : ` / ${data.monthlyLimit}`}`}
          sub={data.monthlyLimit === -1 ? "unlimited" : `${usagePct}% of plan quota`}
        />
        <KpiCard
          label="Total credits"
          value={data.totalCredits.toLocaleString()}
          sub="AI ops consumed"
        />
        <KpiCard
          label="Total spend"
          value={`$${data.totalCostUsd}`}
          sub="current month"
        />
        <KpiCard
          label="Avg confidence"
          value={`${Math.round(data.avgConfidence * 100)}%`}
          sub={`${data.statusBreakdown.applied} applied · ${data.statusBreakdown.rejected} rejected`}
        />
      </div>

      {/* Quota bar */}
      {data.monthlyLimit !== -1 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <div>
              <span className="font-medium text-gray-900">Plan quota</span>
              <span className="text-gray-500 ml-2 capitalize">({data.plan})</span>
            </div>
            <div className="text-gray-600">
              {data.used} / {data.monthlyLimit} decisions · {data.remaining} remaining
            </div>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                usagePct >= 90 ? "bg-red-500" : usagePct >= 75 ? "bg-amber-500" : "bg-blue-500"
              }`}
              style={{ width: `${usagePct}%` }}
            />
          </div>
          {projectionPct && (
            <div className="mt-2 text-xs text-gray-500">
              Projection at current pace: <span className="font-medium text-gray-700">{projectionPct.projected}</span>{" "}
              decisions by month-end ({projectionPct.ofLimit}% of quota · {projectionPct.daysLeft} day{projectionPct.daysLeft === 1 ? "" : "s"} left)
              {projectionPct.ofLimit > 100 && (
                <span className="ml-2 text-red-600 font-medium">— will exceed quota</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* By topic */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-3">By topic</h2>
        {data.byTopic.length === 0 ? (
          <p className="text-sm text-gray-500">No decisions this month yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase text-gray-500 border-b border-gray-200">
                <th className="text-left py-2">Topic</th>
                <th className="text-right py-2">Decisions</th>
                <th className="text-right py-2">Avg confidence</th>
                <th className="text-right py-2">Avg dissent</th>
                <th className="text-right py-2">Credits</th>
                <th className="text-right py-2">Cost (USD)</th>
              </tr>
            </thead>
            <tbody>
              {data.byTopic.map((t) => {
                const conf = Math.round(Number(t.avg_confidence) * 100);
                const highDissent = Number(t.avg_dissent) >= 0.5;
                return (
                  <tr key={t.topic} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 font-medium text-gray-900">{t.topic}</td>
                    <td className="py-2 text-right tabular-nums">{t.calls}</td>
                    <td className="py-2 text-right tabular-nums">
                      <span className={conf < 60 ? "text-amber-600" : "text-gray-700"}>{conf}%</span>
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      <span className={highDissent ? "text-amber-600 font-medium" : "text-gray-700"}>
                        {Number(t.avg_dissent).toFixed(2)}
                      </span>
                    </td>
                    <td className="py-2 text-right tabular-nums">{t.credits}</td>
                    <td className="py-2 text-right tabular-nums">${Number(t.cost_usd).toFixed(4)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {data.byTopic.some(t => Number(t.avg_dissent) >= 0.5) && (
          <p className="mt-3 text-xs text-amber-600">
            ⚠ High dissent on at least one topic. The council frequently disagrees —
            consider clarifying the inputs or refining the topic prompt.
          </p>
        )}
      </div>

      {/* 30-day history sparkline */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="text-base font-semibold text-gray-900 mb-3">30-day activity</h2>
        {data.history.length === 0 ? (
          <p className="text-sm text-gray-500">No activity in the last 30 days.</p>
        ) : (
          <Sparkline points={data.history.map(h => ({ label: h.day, value: h.calls }))} />
        )}
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="text-xs uppercase text-gray-500 font-medium">{label}</div>
      <div className="text-2xl font-semibold text-gray-900 mt-1 tabular-nums">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{sub}</div>
    </div>
  );
}

function Sparkline({ points }: { points: Array<{ label: string; value: number }> }) {
  const max = Math.max(1, ...points.map(p => p.value));
  const W = 800, H = 80, pad = 4;
  const stepX = (W - pad * 2) / Math.max(1, points.length - 1);
  const path = points.map((p, i) => {
    const x = pad + i * stepX;
    const y = H - pad - (p.value / max) * (H - pad * 2);
    return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-20" preserveAspectRatio="none">
        <path d={path} fill="none" stroke="#3b82f6" strokeWidth="2" />
        {points.map((p, i) => {
          const x = pad + i * stepX;
          const y = H - pad - (p.value / max) * (H - pad * 2);
          return <circle key={i} cx={x} cy={y} r="2" fill="#3b82f6" />;
        })}
      </svg>
      <div className="flex justify-between text-xs text-gray-400 mt-1 tabular-nums">
        <span>{points[0].label}</span>
        <span>{points[points.length - 1].label}</span>
      </div>
    </div>
  );
}
