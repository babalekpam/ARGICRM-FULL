import { useState, useEffect, createContext, useContext } from 'react';

interface WhiteLabelSettings {
  companyName: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  faviconUrl: string;
  customDomain: string;
  removeBranding: boolean;
  customFooter: string;
  supportEmail: string;
  privacyPolicyUrl: string;
  termsOfServiceUrl: string;
}

const defaultSettings: WhiteLabelSettings = {
  companyName: "NODE CRM",
  primaryColor: "#7C3AED",
  secondaryColor: "#1E40AF", 
  logoUrl: "",
  faviconUrl: "",
  customDomain: "",
  removeBranding: false,
  customFooter: "",
  supportEmail: "support@argilette.org",
  privacyPolicyUrl: "",
  termsOfServiceUrl: ""
};

export const WhiteLabelContext = createContext<{
  settings: WhiteLabelSettings;
  updateSettings: (newSettings: Partial<WhiteLabelSettings>) => void;
  isCustomized: boolean;
}>({
  settings: defaultSettings,
  updateSettings: () => {},
  isCustomized: false
});

export function useWhiteLabel() {
  const context = useContext(WhiteLabelContext);
  if (!context) {
    throw new Error('useWhiteLabel must be used within a WhiteLabelProvider');
  }
  return context;
}

export function useWhiteLabelSettings() {
  const [settings, setSettings] = useState<WhiteLabelSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('whiteLabelSettings');
      if (saved) {
        try {
          return { ...defaultSettings, ...JSON.parse(saved) };
        } catch {
          return defaultSettings;
        }
      }
    }
    return defaultSettings;
  });

  const updateSettings = (newSettings: Partial<WhiteLabelSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('whiteLabelSettings', JSON.stringify(updated));
      
      // Apply CSS custom properties immediately
      const root = document.documentElement;
      root.style.setProperty('--primary-color', updated.primaryColor);
      root.style.setProperty('--secondary-color', updated.secondaryColor);
      
      // Update page title
      document.title = updated.companyName;
      
      // Update favicon if provided
      if (updated.faviconUrl) {
        const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
        if (favicon) {
          favicon.href = updated.faviconUrl;
        }
      }
    }
  };

  const isCustomized = settings.companyName !== defaultSettings.companyName ||
                      settings.primaryColor !== defaultSettings.primaryColor ||
                      settings.logoUrl !== defaultSettings.logoUrl ||
                      settings.removeBranding;

  useEffect(() => {
    // Apply settings on mount
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      root.style.setProperty('--primary-color', settings.primaryColor);
      root.style.setProperty('--secondary-color', settings.secondaryColor);
      document.title = settings.companyName;
    }
  }, [settings]);

  return {
    settings,
    updateSettings,
    isCustomized
  };
}