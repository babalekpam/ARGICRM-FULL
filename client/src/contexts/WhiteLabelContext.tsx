import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

interface WhiteLabelSettings {
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  customDomain?: string;
  companyName?: string;
  supportEmail?: string;
}

interface WhiteLabelContextValue {
  settings: WhiteLabelSettings;
  loading: boolean;
  brandName: string;
  logoUrl: string | null;
}

const WhiteLabelContext = createContext<WhiteLabelContextValue>({
  settings: {},
  loading: false,
  brandName: "ARGILETTE CRM",
  logoUrl: null,
});

export function WhiteLabelProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [settings, setSettings] = useState<WhiteLabelSettings>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    fetch("/api/ops/whitelabel", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then(r => r.ok ? r.json() : {})
      .then(data => setSettings(data || {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  // Apply brand colours as CSS variables whenever settings change
  useEffect(() => {
    const root = document.documentElement;

    if (settings.primaryColor) {
      root.style.setProperty("--wl-primary", settings.primaryColor);
      root.style.setProperty("--accent", settings.primaryColor);
    } else {
      root.style.removeProperty("--wl-primary");
      root.style.removeProperty("--accent");
    }

    if (settings.secondaryColor) {
      root.style.setProperty("--wl-secondary", settings.secondaryColor);
    } else {
      root.style.removeProperty("--wl-secondary");
    }

    if (settings.companyName) {
      document.title = `${settings.companyName} CRM`;
    } else {
      document.title = "ARGILETTE CRM — by ARGILETTE LLC";
    }

    if (settings.faviconUrl) {
      const link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      if (link) link.href = settings.faviconUrl;
    }
  }, [settings]);

  const brandName = settings.companyName ? `${settings.companyName} CRM` : "ARGILETTE CRM";
  const logoUrl = settings.logoUrl || null;

  return (
    <WhiteLabelContext.Provider value={{ settings, loading, brandName, logoUrl }}>
      {children}
    </WhiteLabelContext.Provider>
  );
}

export function useWhiteLabel() {
  return useContext(WhiteLabelContext);
}
