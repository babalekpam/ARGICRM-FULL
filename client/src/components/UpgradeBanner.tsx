import { ArrowUpCircle, X } from "lucide-react";
import { useState } from "react";
import { UpgradeRequiredError } from "../lib/api";
import { PLAN_MAP } from "@shared/plans";

interface Props {
  error: unknown;
  onDismiss?: () => void;
}

/**
 * Shows a prominent upgrade prompt when an API call returns 402.
 * Usage: {error && <UpgradeBanner error={error} />}
 */
export function UpgradeBanner({ error, onDismiss }: Props) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !(error instanceof UpgradeRequiredError)) return null;

  const requiredPlan = PLAN_MAP[error.requiredPlan as keyof typeof PLAN_MAP] || PLAN_MAP["professional"];
  const planColor = requiredPlan.color || "#8b5cf6";

  const dismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div
      data-testid="upgrade-banner"
      style={{
        padding: "16px 20px",
        background: `${planColor}12`,
        border: `1px solid ${planColor}35`,
        borderRadius: 12,
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
      }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 9, background: `${planColor}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <ArrowUpCircle size={18} style={{ color: planColor }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: "var(--text-primary)" }}>
          {requiredPlan.name} plan required
        </div>
        <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12, lineHeight: 1.5 }}>
          {error.message} Upgrade to unlock this feature and everything in the{" "}
          <strong style={{ color: planColor }}>{requiredPlan.name}</strong> plan
          {requiredPlan.priceMonthly > 0 && (
            <span> — starting at <strong>{requiredPlan.price}{requiredPlan.period}</strong></span>
          )}.
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <a
            href="/contact"
            data-testid="button-upgrade-plan"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "7px 16px", borderRadius: 8,
              background: planColor, color: "#fff",
              fontWeight: 700, fontSize: 13, textDecoration: "none",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >
            <ArrowUpCircle size={13} /> Upgrade to {requiredPlan.name}
          </a>
          <button
            onClick={dismiss}
            style={{
              padding: "7px 14px", borderRadius: 8,
              background: "var(--bg-overlay)", border: "1px solid var(--border)",
              color: "var(--text-secondary)", fontWeight: 500, fontSize: 13, cursor: "pointer",
            }}
          >
            Dismiss
          </button>
        </div>
      </div>

      <button
        onClick={dismiss}
        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 2, flexShrink: 0 }}
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}
