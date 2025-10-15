interface SettingsService {
  // Theme and Branding
  applyTheme(settings: any): void;
  applyBranding(settings: any): void;
  
  // Localization
  applyLocalization(settings: any): void;
  
  // Business Logic
  applyBusinessHours(settings: any): void;
  applyNotificationSettings(settings: any): void;
  
  // Security
  applySecuritySettings(settings: any): void;
}

export class GlobalSettingsService implements SettingsService {
  private static instance: GlobalSettingsService;
  private currentSettings: any = {};
  private settingsChangeListeners: Array<(settings: any) => void> = [];

  static getInstance(): GlobalSettingsService {
    if (!GlobalSettingsService.instance) {
      GlobalSettingsService.instance = new GlobalSettingsService();
    }
    return GlobalSettingsService.instance;
  }

  constructor() {
    this.loadSettings();
  }

  private loadSettings() {
    const savedSettings = localStorage.getItem('tenant-settings');
    if (savedSettings) {
      this.currentSettings = JSON.parse(savedSettings);
      this.applyAllSettings();
    }
  }

  public updateSettings(newSettings: any) {
    this.currentSettings = { ...this.currentSettings, ...newSettings };
    localStorage.setItem('tenant-settings', JSON.stringify(this.currentSettings));
    this.applyAllSettings();
    this.notifySettingsChange();
  }

  public getSettings() {
    return this.currentSettings;
  }

  private applyAllSettings() {
    this.applyTheme(this.currentSettings);
    this.applyBranding(this.currentSettings);
    this.applyLocalization(this.currentSettings);
    this.applyBusinessHours(this.currentSettings);
    this.applyNotificationSettings(this.currentSettings);
    this.applySecuritySettings(this.currentSettings);
  }

  public applyTheme(settings: any) {
    if (settings.primaryColor) {
      document.documentElement.style.setProperty('--primary-color', settings.primaryColor);
    }
    if (settings.secondaryColor) {
      document.documentElement.style.setProperty('--secondary-color', settings.secondaryColor);
    }
    if (settings.accentColor) {
      document.documentElement.style.setProperty('--accent-color', settings.accentColor);
    }
  }

  public applyBranding(settings: any) {
    // Update page title
    if (settings.companyName) {
      document.title = `${settings.companyName} - CRM`;
    }
    
    // Update favicon if provided
    if (settings.faviconUrl) {
      const favicon = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (favicon) {
        favicon.href = settings.faviconUrl;
      }
    }
    
    // Apply custom CSS
    if (settings.customCSS) {
      let customStyleElement = document.getElementById('custom-tenant-styles') as HTMLStyleElement;
      if (!customStyleElement) {
        customStyleElement = document.createElement('style');
        customStyleElement.id = 'custom-tenant-styles';
        document.head.appendChild(customStyleElement);
      }
      customStyleElement.textContent = settings.customCSS;
    }
  }

  public applyLocalization(settings: any) {
    // Set document language
    if (settings.defaultLanguage) {
      document.documentElement.lang = settings.defaultLanguage;
    }
    
    // Apply RTL if needed
    const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
    if (settings.defaultLanguage && rtlLanguages.includes(settings.defaultLanguage)) {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  }

  public applyBusinessHours(settings: any) {
    // Store business hours in global context for features to use
    if (settings.businessHours) {
      window.businessHours = settings.businessHours;
    }
  }

  public applyNotificationSettings(settings: any) {
    // Configure notification permissions and preferences
    if (settings.browserNotifications && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
    
    // Store notification preferences globally
    window.notificationSettings = {
      email: settings.emailNotifications,
      sms: settings.smsNotifications,
      browser: settings.browserNotifications,
      types: settings.notificationTypes
    };
  }

  public applySecuritySettings(settings: any) {
    // Apply session timeout
    if (settings.sessionTimeout) {
      this.setupSessionTimeout(settings.sessionTimeout);
    }
    
    // Store security settings globally
    window.securitySettings = {
      twoFactorAuth: settings.twoFactorAuth,
      sessionTimeout: settings.sessionTimeout,
      passwordPolicy: settings.passwordPolicy
    };
  }

  private setupSessionTimeout(timeoutMinutes: number) {
    // Clear existing timeout
    if (window.sessionTimeoutId) {
      clearTimeout(window.sessionTimeoutId);
    }
    
    // Set new timeout
    window.sessionTimeoutId = setTimeout(() => {
      if (confirm('Your session is about to expire. Do you want to extend it?')) {
        this.setupSessionTimeout(timeoutMinutes);
      } else {
        window.location.href = '/login';
      }
    }, timeoutMinutes * 60 * 1000);
  }

  public addSettingsChangeListener(listener: (settings: any) => void) {
    this.settingsChangeListeners.push(listener);
  }

  public removeSettingsChangeListener(listener: (settings: any) => void) {
    const index = this.settingsChangeListeners.indexOf(listener);
    if (index > -1) {
      this.settingsChangeListeners.splice(index, 1);
    }
  }

  private notifySettingsChange() {
    this.settingsChangeListeners.forEach(listener => listener(this.currentSettings));
  }

  // Feature-specific settings applications
  public getEmailSettings() {
    return this.currentSettings.smtpSettings || {};
  }

  public getSMSSettings() {
    return {
      enabled: this.currentSettings.smsNotifications,
      twilioKey: this.currentSettings.apiKeys?.twilio
    };
  }

  public getPaymentSettings() {
    return {
      currency: this.currentSettings.currency || 'USD',
      stripeKey: this.currentSettings.apiKeys?.stripe
    };
  }

  public getAISettings() {
    return {
      enabled: this.currentSettings.features?.aiPredictions,
      openaiKey: this.currentSettings.apiKeys?.openai
    };
  }

  public getReputationSettings() {
    return {
      enabled: this.currentSettings.features?.reputationManagement,
      monitoringEnabled: true
    };
  }

  public getFormattingSettings() {
    return {
      dateFormat: this.currentSettings.dateFormat || 'MM/DD/YYYY',
      timeFormat: this.currentSettings.timeFormat || '12h',
      timezone: this.currentSettings.timezone || 'UTC',
      currency: this.currentSettings.currency || 'USD',
      language: this.currentSettings.defaultLanguage || 'en'
    };
  }

  public isFeatureEnabled(featureName: string): boolean {
    return this.currentSettings.features?.[featureName] || false;
  }

  public getCompanyInfo() {
    return {
      name: this.currentSettings.companyName || 'ARGILETTE CRM',
      email: this.currentSettings.companyEmail || '',
      phone: this.currentSettings.companyPhone || '',
      address: this.currentSettings.companyAddress || '',
      website: this.currentSettings.companyWebsite || '',
      logo: this.currentSettings.logoUrl || ''
    };
  }
}

// Extend window interface for global settings
declare global {
  interface Window {
    businessHours?: any;
    notificationSettings?: any;
    securitySettings?: any;
    sessionTimeoutId?: number;
  }
}

export const globalSettings = GlobalSettingsService.getInstance();