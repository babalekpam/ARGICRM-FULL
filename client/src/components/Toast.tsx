import React, { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";

// ---------------------------------------------------------------------------
// Lightweight global toast + confirm system (no external dependencies).
// Call toast.success("...") / toast.error("...") / toast.info("...") from
// anywhere (components, mutation callbacks, plain functions). <ToastHost />
// must be mounted once near the app root.
// ---------------------------------------------------------------------------

type ToastKind = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
  duration: number;
}

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

type ToastListener = (toasts: ToastItem[]) => void;
type ConfirmListener = (req: ConfirmRequest | null) => void;

interface ConfirmRequest extends ConfirmOptions {
  resolve: (ok: boolean) => void;
}

let nextId = 1;
let toasts: ToastItem[] = [];
let toastListener: ToastListener | null = null;
let confirmListener: ConfirmListener | null = null;

function push(kind: ToastKind, message: string, duration = 4000) {
  const item: ToastItem = { id: nextId++, kind, message, duration };
  toasts = [...toasts.slice(-3), item]; // keep at most 4 visible
  toastListener?.(toasts);
  if (duration > 0) {
    setTimeout(() => dismiss(item.id), duration);
  }
}

function dismiss(id: number) {
  toasts = toasts.filter(t => t.id !== id);
  toastListener?.(toasts);
}

export const toast = {
  success: (message: string, duration?: number) => push("success", message, duration),
  error: (message: string, duration?: number) => push("error", message, duration ?? 6000),
  info: (message: string, duration?: number) => push("info", message, duration),
  warning: (message: string, duration?: number) => push("warning", message, duration ?? 5000),
};

/** Styled drop-in replacement for window.confirm(). Resolves to true/false. */
export function confirmDialog(options: ConfirmOptions | string): Promise<boolean> {
  const opts: ConfirmOptions = typeof options === "string" ? { message: options } : options;
  return new Promise(resolve => {
    if (!confirmListener) { resolve(window.confirm(opts.message)); return; }
    confirmListener({ ...opts, resolve });
  });
}

const KIND_STYLES: Record<ToastKind, { icon: typeof CheckCircle2; color: string; bg: string; border: string }> = {
  success: { icon: CheckCircle2, color: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.3)" },
  error: { icon: XCircle, color: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.3)" },
  info: { icon: Info, color: "#3b82f6", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.3)" },
  warning: { icon: AlertTriangle, color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.3)" },
};

export function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);
  const [confirmReq, setConfirmReq] = useState<ConfirmRequest | null>(null);

  useEffect(() => {
    toastListener = setItems;
    confirmListener = setConfirmReq;
    return () => { toastListener = null; confirmListener = null; };
  }, []);

  const answer = (ok: boolean) => {
    confirmReq?.resolve(ok);
    setConfirmReq(null);
  };

  useEffect(() => {
    if (!confirmReq) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") answer(false);
      if (e.key === "Enter") answer(true);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [confirmReq]);

  return (
    <>
      {/* Toast stack */}
      <div aria-live="polite" style={{ position: "fixed", bottom: 20, right: 20, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8, maxWidth: "min(380px, calc(100vw - 40px))" }}>
        {items.map(t => {
          const s = KIND_STYLES[t.kind];
          const Icon = s.icon;
          return (
            <div key={t.id} role="status" className="animate-slide-up" style={{
              display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px",
              background: "var(--bg-card)", border: `1px solid ${s.border}`, borderLeft: `3px solid ${s.color}`,
              borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", fontSize: 13.5, color: "var(--text-primary)",
            }}>
              <Icon size={17} style={{ color: s.color, flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
              <div style={{ flex: 1, lineHeight: 1.45, wordBreak: "break-word" }}>{t.message}</div>
              <button onClick={() => dismiss(t.id)} aria-label="Dismiss notification" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 2, display: "flex", flexShrink: 0 }}>
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Confirm dialog */}
      {confirmReq && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={confirmReq.title || "Confirm"} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 10000 }}
          onClick={e => { if (e.target === e.currentTarget) answer(false); }}>
          <div className="card-elevated animate-slide-up" style={{ width: "100%", maxWidth: 400, padding: "22px 24px" }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700 }}>{confirmReq.title || "Are you sure?"}</h3>
            <p style={{ margin: "0 0 20px", fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.55 }}>{confirmReq.message}</p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => answer(false)}>{confirmReq.cancelLabel || "Cancel"}</button>
              <button className="btn btn-primary" autoFocus
                style={confirmReq.danger ? { background: "#ef4444", borderColor: "#ef4444" } : undefined}
                onClick={() => answer(true)}>
                {confirmReq.confirmLabel || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
