import React, { useState, useRef, useEffect } from "react";
import { useParams } from "wouter";
import { CheckCircle, XCircle, FileText, PenLine, Type, AlertCircle } from "lucide-react";

export default function SignPage() {
  const { token } = useParams<{ token: string }>();
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"draw" | "type">("draw");
  const [typedName, setTypedName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<"signed" | "declined" | null>(null);
  const [agreed, setAgreed] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    fetch(`/api/sign/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error);
        else if (data.status === "signed") setDone("signed");
        else if (data.status === "declined") setDone("declined");
        else setContract(data);
        setLoading(false);
      })
      .catch(() => { setError("Failed to load contract. Please try again."); setLoading(false); });
  }, [token]);

  // Canvas drawing
  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current; if (!canvas) return;
    isDrawing.current = true;
    lastPos.current = getPos(e, canvas);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPos.current = pos;
  };

  const stopDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isDrawing.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
  };

  const isCanvasEmpty = () => {
    const canvas = canvasRef.current; if (!canvas) return true;
    const ctx = canvas.getContext("2d"); if (!ctx) return true;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    return !data.some(v => v !== 0);
  };

  const getSignatureData = (): string | null => {
    if (mode === "type") return typedName.trim() || null;
    if (isCanvasEmpty()) return null;
    return canvasRef.current?.toDataURL("image/png") || null;
  };

  const submit = async (action: "sign" | "decline") => {
    if (action === "sign") {
      const sig = getSignatureData();
      if (!sig) { alert(mode === "draw" ? "Please draw your signature." : "Please type your name."); return; }
      if (!agreed) { alert("Please confirm that you agree to sign electronically."); return; }
      setSubmitting(true);
      const r = await fetch(`/api/sign/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signerName: mode === "type" ? typedName.trim() : (contract?.contactName || "Signed"), signatureData: sig }),
      });
      const data = await r.json();
      setSubmitting(false);
      if (data.error) { alert(data.error); return; }
      setDone("signed");
    } else {
      if (!confirm("Are you sure you want to decline this contract?")) return;
      setSubmitting(true);
      await fetch(`/api/sign/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "decline" }),
      });
      setSubmitting(false);
      setDone("declined");
    }
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: "3px solid #e2e8f0", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
        <p style={{ color: "#64748b", fontSize: 14 }}>Loading contract…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", padding: 24 }}>
      <div style={{ maxWidth: 480, textAlign: "center" }}>
        <AlertCircle size={48} style={{ color: "#ef4444", marginBottom: 16 }} />
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Link Unavailable</h2>
        <p style={{ color: "#64748b", fontSize: 14 }}>{error}</p>
      </div>
    </div>
  );

  if (done === "signed") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", padding: 24 }}>
      <div style={{ maxWidth: 480, textAlign: "center" }}>
        <CheckCircle size={56} style={{ color: "#10b981", marginBottom: 20 }} />
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", marginBottom: 10 }}>Contract Signed</h2>
        <p style={{ color: "#475569", fontSize: 15, lineHeight: 1.6 }}>
          Thank you. Your signature has been recorded and the contract is now complete. A confirmation has been logged with the date, time, and IP address for legal records.
        </p>
        <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 20 }}>You may close this window.</p>
      </div>
    </div>
  );

  if (done === "declined") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", padding: 24 }}>
      <div style={{ maxWidth: 480, textAlign: "center" }}>
        <XCircle size={56} style={{ color: "#ef4444", marginBottom: 20 }} />
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", marginBottom: 10 }}>Contract Declined</h2>
        <p style={{ color: "#475569", fontSize: 15 }}>You have declined to sign this contract. The sender has been notified.</p>
        <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 20 }}>You may close this window.</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", padding: "40px 16px" }}>
      <style>{`@media(max-width:640px){.sign-layout{padding:24px 16px!important}}`}</style>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.12em", color: "#6366f1", marginBottom: 8 }}>ARGILETTE · E-SIGN</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>{contract.title}</h1>
          {contract.contactName && <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>Prepared for <strong>{contract.contactName}</strong> · {contract.contactEmail}</p>}
        </div>

        {/* Contract body */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "32px 36px", marginBottom: 28, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }} className="sign-layout">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #e2e8f0" }}>
            <FileText size={18} style={{ color: "#6366f1" }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.06em" }}>Contract Document</span>
          </div>
          <pre style={{ fontSize: 13, color: "#374151", whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.8, fontFamily: "Georgia, 'Times New Roman', serif", margin: 0 }}>
            {contract.body}
          </pre>
        </div>

        {/* Signature section */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "28px 32px", marginBottom: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }} className="sign-layout">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #e2e8f0" }}>
            <PenLine size={18} style={{ color: "#6366f1" }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.06em" }}>Your Signature</span>
          </div>

          {/* Mode toggle */}
          <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
            <button onClick={() => setMode("draw")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: `2px solid ${mode === "draw" ? "#6366f1" : "#e2e8f0"}`, background: mode === "draw" ? "#eef2ff" : "#fff", color: mode === "draw" ? "#4338ca" : "#64748b", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              <PenLine size={14} /> Draw
            </button>
            <button onClick={() => setMode("type")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: `2px solid ${mode === "type" ? "#6366f1" : "#e2e8f0"}`, background: mode === "type" ? "#eef2ff" : "#fff", color: mode === "type" ? "#4338ca" : "#64748b", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              <Type size={14} /> Type
            </button>
          </div>

          {mode === "draw" && (
            <div>
              <div style={{ marginBottom: 6, fontSize: 12, color: "#64748b" }}>Sign below using your mouse or finger:</div>
              <canvas ref={canvasRef} width={680} height={140}
                style={{ border: "2px dashed #cbd5e1", borderRadius: 8, background: "#fafafa", cursor: "crosshair", width: "100%", maxWidth: 680, display: "block", touchAction: "none" }}
                onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
              />
              <button onClick={clearCanvas} style={{ marginTop: 8, fontSize: 12, color: "#94a3b8", background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}>
                Clear signature
              </button>
            </div>
          )}

          {mode === "type" && (
            <div>
              <div style={{ marginBottom: 6, fontSize: 12, color: "#64748b" }}>Type your full legal name:</div>
              <input
                value={typedName}
                onChange={e => setTypedName(e.target.value)}
                placeholder="Your full name"
                style={{ width: "100%", padding: "12px 16px", fontSize: 22, fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", color: "#1e293b", border: "2px solid #e2e8f0", borderRadius: 8, outline: "none", boxSizing: "border-box" }}
              />
            </div>
          )}

          {/* Consent checkbox */}
          <div style={{ marginTop: 20, display: "flex", alignItems: "flex-start", gap: 10 }}>
            <input type="checkbox" id="agree" checked={agreed} onChange={e => setAgreed(e.target.checked)}
              style={{ width: 16, height: 16, marginTop: 2, accentColor: "#6366f1", flexShrink: 0, cursor: "pointer" }} />
            <label htmlFor="agree" style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, cursor: "pointer" }}>
              I agree that my electronic signature is the legally binding equivalent of my handwritten signature. I have read and understood all terms in this contract.
            </label>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button onClick={() => submit("decline")} disabled={submitting}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 24px", borderRadius: 8, border: "2px solid #fca5a5", background: "#fff", color: "#ef4444", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
            <XCircle size={16} /> Decline
          </button>
          <button onClick={() => submit("sign")} disabled={submitting || !agreed}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 28px", borderRadius: 8, border: "none", background: agreed ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "#e2e8f0", color: agreed ? "#fff" : "#94a3b8", fontWeight: 700, fontSize: 14, cursor: agreed ? "pointer" : "not-allowed" }}>
            {submitting ? <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} /> : <CheckCircle size={16} />}
            Sign Contract
          </button>
        </div>

        {/* Legal footer */}
        <div style={{ textAlign: "center", marginTop: 32, fontSize: 11, color: "#94a3b8", lineHeight: 1.6 }}>
          This document is powered by ARGILETTE e-Sign. Electronic signatures are legally binding under the US ESIGN Act and EU eIDAS Regulation.
          Your IP address, browser fingerprint, and timestamp are recorded for audit purposes.
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
