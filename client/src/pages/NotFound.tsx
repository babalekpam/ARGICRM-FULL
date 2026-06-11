import React from "react";
import { Link } from "wouter";
import { Home } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

export default function NotFoundPage() {
  const { t } = useLanguage();
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "40px" }}>
      <div>
        <div style={{ fontSize: 80, marginBottom: 16 }}>404</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{t("notfound_title", "Page not found")}</h1>
        <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>{t("notfound_desc", "The page you're looking for doesn't exist.")}</p>
        <Link href="/dashboard"><a className="btn btn-primary btn-lg"><Home size={16} /> {t("notfound_cta", "Go to Dashboard")}</a></Link>
      </div>
    </div>
  );
}
