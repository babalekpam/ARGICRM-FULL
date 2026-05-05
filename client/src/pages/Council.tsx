import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { apiRequest, queryClient } from "../lib/api";

interface Topic {
  name: string;
  description: string;
  defaultMode: "ensemble" | "debate";
  defaultParticipants: Array<{ kind: string; name: string }>;
  requiresManualApproval: boolean;
  minPlan: string;
}

interface Decision {
  id: string;
  topic: string;
  mode: string;
  status: "pending" | "running" | "succeeded" | "failed" | "rejected_by_human" | "applied";
  inputs: Record<string, any>;
  participants: Array<{ kind: string; name: string }>;
  rounds: any[];
  outcome: { recommendation?: string; confidence?: number; reasons?: string[] } | null;
  dissent: Array<{ participant: string; position: string; why: string }> | null;
  costCredits: number;
  costUsd: string;
  latencyMs: number | null;
  createdAt: string;
}

const statusBadge = (s: Decision["status"]) => {
  const map: Record<string, string> = {
    succeeded: "bg-green-100 text-green-700",
    running:   "bg-blue-100 text-blue-700",
    pending:   "bg-gray-100 text-gray-700",
    failed:    "bg-red-100 text-red-700",
    applied:   "bg-purple-100 text-purple-700",
    rejected_by_human: "bg-amber-100 text-amber-700",
  };
  return map[s] || "bg-gray-100 text-gray-700";
};

export default function Council() {
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(null);

  const topicsQ = useQuery<Topic[]>({
    queryKey: ["/api/council/topics"],
    refetchInterval: false,
  });
  const decisionsQ = useQuery<Decision[]>({
    queryKey: ["/api/council/decisions"],
    refetchInterval: 5000, // poll while any decision is running
  });
  const detailQ = useQuery<Decision>({
    queryKey: [`/api/council/decisions/${selectedDecisionId}`],
    enabled: !!selectedDecisionId,
    refetchInterval: (q) => {
      const d = q.state.data as Decision | undefined;
      return d && (d.status === "running" || d.status === "pending") ? 2000 : false;
    },
  });

  const conveneM = useMutation({
    mutationFn: (vars: { topic: string; inputs: Record<string, any> }) =>
      apiRequest<{ decisionId: string; status: string }>("POST", "/api/council/decisions", vars),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/council/decisions"] });
      setSelectedDecisionId(data.decisionId);
    },
  });

  const applyM = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/council/decisions/${id}/apply`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/council/decisions"] });
      if (selectedDecisionId) queryClient.invalidateQueries({ queryKey: [`/api/council/decisions/${selectedDecisionId}`] });
    },
  });
  const rejectM = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/council/decisions/${id}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/council/decisions"] });
      if (selectedDecisionId) queryClient.invalidateQueries({ queryKey: [`/api/council/decisions/${selectedDecisionId}`] });
    },
  });

  function handleConvene(topicName: string) {
    const example = topicName === "discount.approve"
      ? '{"dealId":"deal-123","amount":50000,"discountPct":15,"reason":"competitive deal"}'
      : topicName === "lead.score"
      ? '{"name":"Jane Smith","company":"Acme Corp","title":"VP Sales","industry":"SaaS","size":"500-1000"}'
      : '{"dealId":"deal-456","stage":"negotiation","value":120000,"momentum":"strong"}';
    const raw = window.prompt(`Inputs for ${topicName} (JSON):`, example);
    if (!raw) return;
    try {
      const inputs = JSON.parse(raw);
      conveneM.mutate({ topic: topicName, inputs });
    } catch {
      alert("Invalid JSON. Please check your input.");
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">AI Council</h1>
        <p className="text-sm text-gray-500 mt-1">
          Multi-provider deliberation for high-stakes decisions. Every decision
          is audit-logged and replayable. Money-touching topics always require
          human approval.
        </p>
      </header>

      {/* Topics */}
      <section className="mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-3">Topics</h2>
        {topicsQ.isLoading && <div className="text-sm text-gray-500">Loading topics…</div>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(topicsQ.data || []).map((t) => (
            <div key={t.name} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="font-medium text-gray-900">{t.name}</div>
                {t.requiresManualApproval && (
                  <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md border border-amber-200">
                    manual approval
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">{t.description}</p>
              <div className="mt-3 text-xs text-gray-400">
                Mode: <span className="font-medium text-gray-600">{t.defaultMode}</span>
                {" · "}
                Min plan: <span className="font-medium text-gray-600">{t.minPlan}</span>
                {" · "}
                Participants: <span className="font-medium text-gray-600">{t.defaultParticipants.length}</span>
              </div>
              <button
                className="mt-3 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                onClick={() => handleConvene(t.name)}
                disabled={conveneM.isPending}
              >
                {conveneM.isPending ? "Convening…" : "Convene"}
              </button>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent decisions */}
        <section>
          <h2 className="text-lg font-medium text-gray-900 mb-3">Recent decisions</h2>
          <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
            {decisionsQ.isLoading && <div className="p-4 text-sm text-gray-500">Loading…</div>}
            {(decisionsQ.data || []).length === 0 && !decisionsQ.isLoading && (
              <div className="p-4 text-sm text-gray-500">No decisions yet. Convene a topic above.</div>
            )}
            {(decisionsQ.data || []).map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDecisionId(d.id)}
                className={`w-full text-left p-4 hover:bg-gray-50 ${selectedDecisionId === d.id ? "bg-blue-50" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{d.topic}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {d.mode} · {new Date(d.createdAt).toLocaleString()} · {d.costCredits} credits
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-md font-medium ${statusBadge(d.status)}`}>{d.status}</span>
                </div>
                {d.outcome?.recommendation && (
                  <div className="mt-2 text-sm">
                    Recommends:{" "}
                    <span className="font-medium">{d.outcome.recommendation}</span>
                    {" · "}
                    Confidence:{" "}
                    <span className="font-medium">{Math.round((d.outcome.confidence || 0) * 100)}%</span>
                    {(d.dissent?.length || 0) > 0 && (
                      <span className="ml-2 text-xs text-amber-600">
                        ({d.dissent!.length} dissent{d.dissent!.length === 1 ? "" : "s"})
                      </span>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Decision detail */}
        <section>
          <h2 className="text-lg font-medium text-gray-900 mb-3">Decision detail</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            {!selectedDecisionId && (
              <div className="text-sm text-gray-500">Select a decision to see the deliberation.</div>
            )}
            {selectedDecisionId && detailQ.isLoading && (
              <div className="text-sm text-gray-500">Loading…</div>
            )}
            {detailQ.data && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-gray-900">{detailQ.data.topic}</div>
                  <span className={`text-xs px-2 py-1 rounded-md font-medium ${statusBadge(detailQ.data.status)}`}>
                    {detailQ.data.status}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {detailQ.data.mode} · {detailQ.data.participants?.length || 0} participants ·
                  {" "}{detailQ.data.costCredits} credits
                  {detailQ.data.latencyMs ? ` · ${detailQ.data.latencyMs}ms` : ""}
                </div>

                {/* Inputs */}
                <div className="mt-4">
                  <div className="text-xs uppercase text-gray-400 font-medium mb-1">Inputs</div>
                  <pre className="text-xs bg-gray-50 border border-gray-200 rounded p-2 overflow-auto max-h-32">
{JSON.stringify(detailQ.data.inputs, null, 2)}
                  </pre>
                </div>

                {/* Outcome */}
                {detailQ.data.outcome && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                    <div className="text-xs uppercase text-blue-600 font-medium mb-1">Outcome</div>
                    <div className="text-sm font-medium text-gray-900">
                      {detailQ.data.outcome.recommendation || "—"}
                    </div>
                    {typeof detailQ.data.outcome.confidence === "number" && (
                      <div className="text-xs text-gray-600 mt-0.5">
                        Confidence: {Math.round((detailQ.data.outcome.confidence || 0) * 100)}%
                      </div>
                    )}
                    {detailQ.data.outcome.reasons && detailQ.data.outcome.reasons.length > 0 && (
                      <ul className="mt-2 text-xs text-gray-700 list-disc pl-4 space-y-0.5">
                        {detailQ.data.outcome.reasons.map((r: string, i: number) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Dissent */}
                {detailQ.data.dissent && detailQ.data.dissent.length > 0 && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded">
                    <div className="text-xs uppercase text-amber-700 font-medium mb-1">Dissent</div>
                    <ul className="text-xs text-gray-700 space-y-1">
                      {detailQ.data.dissent.map((d, i) => (
                        <li key={i}>
                          <span className="font-medium">{d.participant}</span> ({d.position}): {d.why}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Rounds */}
                {detailQ.data.rounds && detailQ.data.rounds.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs uppercase text-gray-400 font-medium mb-1">Deliberation</div>
                    {detailQ.data.rounds.map((r: any, i: number) => (
                      <div key={i} className="mb-2">
                        <div className="text-xs font-medium text-gray-600">Round {r.round}</div>
                        <div className="mt-1 space-y-1">
                          {(r.statements || []).map((s: any, j: number) => (
                            <div key={j} className="text-xs bg-gray-50 border border-gray-200 rounded p-2">
                              <div className="font-medium text-gray-700">{s.participant}</div>
                              <div className="text-gray-600 mt-0.5 whitespace-pre-wrap">{s.text}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Apply / Reject */}
                {detailQ.data.status === "succeeded" && (
                  <div className="mt-4 flex gap-2">
                    <button
                      className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                      onClick={() => applyM.mutate(detailQ.data.id)}
                      disabled={applyM.isPending}
                    >
                      {applyM.isPending ? "Applying…" : "Apply"}
                    </button>
                    <button
                      className="px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
                      onClick={() => rejectM.mutate(detailQ.data.id)}
                      disabled={rejectM.isPending}
                    >
                      {rejectM.isPending ? "Rejecting…" : "Reject"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
