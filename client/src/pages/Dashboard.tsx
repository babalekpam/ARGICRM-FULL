import React from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "../components/Layout";
import { useAuth } from "../contexts/AuthContext";
import { Users, UserPlus, TrendingUp, CheckSquare, DollarSign, Activity, ArrowUpRight, Clock, Phone, Mail, MessageSquare } from "lucide-react";
import { Link } from "wouter";

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${n.toLocaleString()}`;
}

const ACTIVITY_ICONS: Record<string, any> = {
  call: Phone,
  email: Mail,
  meeting: Users,
  note: MessageSquare,
  task_completed: CheckSquare,
};

const ACTIVITY_COLORS: Record<string, string> = {
  call: "#10b981",
  email: "#3b82f6",
  meeting: "#8b5cf6",
  note: "#f59e0b",
  task_completed: "#06b6d4",
};

export default function DashboardPage() {
  const { user, tenant } = useAuth();
  const { data: stats, isLoading } = useQuery<any>({ queryKey: ["/api/dashboard"] });

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const name = user?.firstName || user?.email?.split("@")[0] || "there";

  return (
    <Layout
      title={`${greeting}, ${name} 👋`}
      subtitle={`Here's what's happening at ${tenant?.name || "your workspace"} today`}
      actions={
        <Link href="/contacts">
          <a className="btn btn-primary btn-sm"><UserPlus size={15} /> Add Contact</a>
        </Link>
      }
    >
      {isLoading ? (
        <div className="stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="shimmer" style={{ height: 100, borderRadius: 14 }} />
          ))}
        </div>
      ) : (
        <>
          {/* Stats grid */}
          <div className="stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
            <StatCard
              icon={Users}
              label="Total Contacts"
              value={stats?.contacts?.total ?? 0}
              sub={`+${stats?.contacts?.new30d ?? 0} this month`}
              color="#3b82f6"
              href="/contacts"
            />
            <StatCard
              icon={UserPlus}
              label="Active Leads"
              value={stats?.leads?.total ?? 0}
              sub="In pipeline"
              color="#8b5cf6"
              href="/leads"
            />
            <StatCard
              icon={TrendingUp}
              label="Open Deals"
              value={stats?.deals?.active ?? 0}
              sub={`${fmt(stats?.deals?.activeValue ?? 0)} pipeline value`}
              color="#f59e0b"
              href="/deals"
            />
            <StatCard
              icon={DollarSign}
              label="Won Revenue"
              value={fmt(stats?.deals?.wonValue ?? 0).replace("$", "")}
              prefix="$"
              sub={`${stats?.deals?.won ?? 0} deals closed`}
              color="#10b981"
              href="/deals"
            />
          </div>

          {/* Two columns */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>
            {/* Recent Activities */}
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Recent Activity</h3>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>Latest updates across your CRM</p>
                </div>
                <Link href="/contacts"><a className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}>View all <ArrowUpRight size={13} /></a></Link>
              </div>
              <div>
                {(stats?.recentActivities?.length ?? 0) === 0 ? (
                  <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
                    <Activity size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
                    <p>No activities yet. Start by adding contacts.</p>
                  </div>
                ) : (
                  stats?.recentActivities?.map((act: any, i: number) => {
                    const Icon = ACTIVITY_ICONS[act.type] || Activity;
                    const color = ACTIVITY_COLORS[act.type] || "#64748b";
                    return (
                      <div key={act.id} className="table-row" style={{ gridTemplateColumns: "auto 1fr auto", gap: "12px" }}>
                        <div style={{ width: 34, height: 34, borderRadius: "50%", background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Icon size={15} style={{ color }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{act.title}</div>
                          {act.description && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{act.description}</div>}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                          {new Date(act.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Tasks sidebar */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Tasks</h3>
                  <Link href="/tasks"><a className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}>View all <ArrowUpRight size={13} /></a></Link>
                </div>
                <div style={{ padding: "12px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Open</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{stats?.tasks?.open ?? 0}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0" }}>
                    <span style={{ fontSize: 13, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
                      <Clock size={13} style={{ color: "#ef4444" }} /> Overdue
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: stats?.tasks?.overdue > 0 ? "#ef4444" : "var(--text-primary)" }}>
                      {stats?.tasks?.overdue ?? 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick actions */}
              <div className="card" style={{ padding: "16px 20px" }}>
                <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700 }}>Quick actions</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[
                    { label: "New Contact", href: "/contacts", color: "#3b82f6" },
                    { label: "Add Lead", href: "/leads", color: "#8b5cf6" },
                    { label: "Create Deal", href: "/deals", color: "#f59e0b" },
                    { label: "New Campaign", href: "/campaigns", color: "#10b981" },
                  ].map(a => (
                    <Link key={a.label} href={a.href}>
                      <a className="btn btn-secondary btn-sm" style={{ width: "100%", justifyContent: "flex-start" }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: a.color, flexShrink: 0 }} />
                        {a.label}
                      </a>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}

function StatCard({ icon: Icon, label, value, sub, color, href, prefix = "" }: any) {
  return (
    <Link href={href}>
      <a className="stat-card" style={{ display: "block", textDecoration: "none" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon size={18} style={{ color }} />
          </div>
          <ArrowUpRight size={15} style={{ color: "var(--text-muted)", opacity: 0.6 }} />
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>
          {prefix}{typeof value === "number" ? value.toLocaleString() : value}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginTop: 4 }}>{label}</div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{sub}</div>
      </a>
    </Link>
  );
}
