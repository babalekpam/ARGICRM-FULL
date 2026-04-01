import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: number;
}

export function Modal({ open, onClose, title, children, width = 480 }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-overlay" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} className="card-elevated animate-slide-up" style={{ width: "100%", maxWidth: width, maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: "4px" }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

interface FormRowProps { label: string; required?: boolean; children: React.ReactNode; hint?: string; }
export function FormRow({ label, required, children, hint }: FormRowProps) {
  return (
    <div>
      <label className="label">{label}{required && <span style={{ color: "#ef4444", marginLeft: 3 }}>*</span>}</label>
      {children}
      {hint && <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "4px 0 0" }}>{hint}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
  placeholder?: string;
}
export function Select({ options, placeholder, ...props }: SelectProps) {
  return (
    <select {...props} className={`input ${props.className || ""}`} style={{ cursor: "pointer", ...props.style }}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function Empty({ icon: Icon, title, desc, action }: { icon: any; title: string; desc?: string; action?: React.ReactNode }) {
  return (
    <div style={{ textAlign: "center", padding: "64px 32px" }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--bg-overlay)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
        <Icon size={24} style={{ color: "var(--text-muted)" }} />
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 6px" }}>{title}</h3>
      {desc && <p style={{ fontSize: 14, color: "var(--text-muted)", margin: "0 0 20px" }}>{desc}</p>}
      {action}
    </div>
  );
}

export function Avatar({ name, size = 32 }: { name?: string | null; size?: number }) {
  const initials = (name || "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const colors = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `${color}22`, border: `1.5px solid ${color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 700, color, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

export function Badge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "badge-green", customer: "badge-blue", lead: "badge-purple", inactive: "badge-gray", churned: "badge-red",
    new: "badge-blue", contacted: "badge-purple", qualified: "badge-green", unqualified: "badge-gray", converted: "badge-green",
    todo: "badge-gray", in_progress: "badge-blue", done: "badge-green", cancelled: "badge-red",
    low: "badge-gray", medium: "badge-blue", high: "badge-amber", urgent: "badge-red",
    draft: "badge-gray", sent: "badge-blue", paid: "badge-green", overdue: "badge-red",
    prospecting: "badge-gray", qualification: "badge-blue", proposal: "badge-amber", negotiation: "badge-purple",
    closed_won: "badge-green", closed_lost: "badge-red",
  };
  return <span className={`badge ${map[status] || "badge-gray"}`}>{status.replace("_", " ")}</span>;
}

export function Loader() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "48px" }}>
      <div className="spinner" style={{ width: 28, height: 28 }} />
    </div>
  );
}
