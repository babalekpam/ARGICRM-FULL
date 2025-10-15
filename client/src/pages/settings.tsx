import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Mail, 
  MessageSquare,
  Calendar,
  DollarSign,
  Database,
  Key,
  Upload,
  Download,
  Save,
  RefreshCw,
  Check,
  X,
  Camera,
  Eye,
  EyeOff,
  Clock,
  MapPin,
  Phone,
  Building
} from "lucide-react";
import Layout from "@/components/layout";
import { LanguageSelector } from "@/components/language-selector";
// Translation hook temporarily disabled due to type issues
// import { useTranslation } from "@/hooks/useTranslation";
import { saasFeatures } from "@/services/saas-features";
import { globalSettings } from "@/services/settings-service";
import { CURRENCIES, formatCurrencyDisplay } from "@shared/currencies";

interface TenantSettings {
  // Company Information
  companyName: string;
  companyLogo?: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite: string;
  
  // Branding
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl?: string;
  faviconUrl?: string;
  customCSS?: string;
  
  // Localization
  defaultLanguage: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  currency: string;
  numberFormat: string;
  
  // Notifications
  emailNotifications: boolean;
  smsNotifications: boolean;
  browserNotifications: boolean;
  notificationTypes: {
    newLeads: boolean;
    dealUpdates: boolean;
    taskReminders: boolean;
    systemAlerts: boolean;
    marketingCampaigns: boolean;
  };
  
  // Security
  twoFactorAuth: boolean;
  sessionTimeout: number;
  passwordPolicy: {
    minLength: number;
    requireNumbers: boolean;
    requireSymbols: boolean;
    requireUppercase: boolean;
    requireLowercase: boolean;
  };
  
  // Email Configuration
  smtpSettings: {
    host: string;
    port: number;
    username: string;
    password: string;
    encryption: 'none' | 'ssl' | 'tls';
    fromName: string;
    fromEmail: string;
  };
  
  // API Configuration
  apiKeys: {
    openai?: string;
    sendgrid?: string;
    twilio?: string;
    stripe?: string;
  };
  
  // Feature Toggles
  features: {
    aiPredictions: boolean;
    reputationManagement: boolean;
    advancedAnalytics: boolean;
    whiteLabel: boolean;
    customDomain: boolean;
    apiAccess: boolean;
  };
  
  // Business Settings
  businessHours: {
    monday: { start: string; end: string; enabled: boolean };
    tuesday: { start: string; end: string; enabled: boolean };
    wednesday: { start: string; end: string; enabled: boolean };
    thursday: { start: string; end: string; enabled: boolean };
    friday: { start: string; end: string; enabled: boolean };
    saturday: { start: string; end: string; enabled: boolean };
    sunday: { start: string; end: string; enabled: boolean };
  };
  
  // Data & Privacy
  dataRetention: number; // days
  gdprCompliance: boolean;
  cookieConsent: boolean;
  analyticsTracking: boolean;
}

const defaultSettings: TenantSettings = {
  companyName: "ARGILETTE CRM",
  companyAddress: "123 Business St, City, State 12345",
  companyPhone: "+1 (314) 472-3839",
  companyEmail: "support@argilette.org",
  companyWebsite: "https://company.com",
  
  primaryColor: "#3b82f6",
  secondaryColor: "#1e40af",
  accentColor: "#06b6d4",
  
  defaultLanguage: "en",
  timezone: "UTC",
  dateFormat: "MM/DD/YYYY",
  timeFormat: "12h",
  currency: "USD",
  numberFormat: "en-US",
  
  emailNotifications: true,
  smsNotifications: false,
  browserNotifications: true,
  notificationTypes: {
    newLeads: true,
    dealUpdates: true,
    taskReminders: true,
    systemAlerts: true,
    marketingCampaigns: false,
  },
  
  twoFactorAuth: false,
  sessionTimeout: 1440, // 24 hours
  passwordPolicy: {
    minLength: 8,
    requireNumbers: true,
    requireSymbols: false,
    requireUppercase: true,
    requireLowercase: true,
  },
  
  smtpSettings: {
    host: "",
    port: 587,
    username: "",
    password: "",
    encryption: "tls",
    fromName: "ARGILETTE CRM",
    fromEmail: "",
  },
  
  apiKeys: {},
  
  features: {
    aiPredictions: true,
    reputationManagement: true,
    advancedAnalytics: true,
    whiteLabel: true,
    customDomain: true,
    apiAccess: true,
  },
  
  businessHours: {
    monday: { start: "09:00", end: "17:00", enabled: true },
    tuesday: { start: "09:00", end: "17:00", enabled: true },
    wednesday: { start: "09:00", end: "17:00", enabled: true },
    thursday: { start: "09:00", end: "17:00", enabled: true },
    friday: { start: "09:00", end: "17:00", enabled: true },
    saturday: { start: "10:00", end: "16:00", enabled: false },
    sunday: { start: "10:00", end: "16:00", enabled: false },
  },
  
  dataRetention: 365,
  gdprCompliance: true,
  cookieConsent: true,
  analyticsTracking: true,
};

export default function SettingsPage() {
  // Simple translation fallback functions
  const t = (key: string, fallback: string) => fallback;
  const changeLanguage = (lang: string) => console.log('Language change:', lang);
  const getAvailableLanguages = () => [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' }
  ];
  const [settings, setSettings] = useState<TenantSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [logoFile, setLogoFile] = useState<File | null>(null);
  
  const currentTenant = saasFeatures.getCurrentTenant();
  const currentPlan = saasFeatures.getCurrentPlan();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    // Load from global settings service
    const currentSettings = globalSettings.getSettings();
    if (Object.keys(currentSettings).length > 0) {
      setSettings({ ...defaultSettings, ...currentSettings });
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // Update global settings service
      globalSettings.updateSettings(settings);
      
      // Apply settings immediately via SaaS service
      await saasFeatures.updateTenantConfig({
        companyName: settings.companyName,
        primaryColor: settings.primaryColor,
        secondaryColor: settings.secondaryColor,
        timezone: settings.timezone,
        currency: settings.currency,
        language: settings.defaultLanguage
      });
      
      // Change language if updated
      changeLanguage(settings.defaultLanguage);
      
      alert('Settings saved successfully!');
    } catch (error) {
      alert('Error saving settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (path: string, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      const keys = path.split('.');
      let current: any = newSettings;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!(keys[i] in current)) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        updateSetting('logoUrl', e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleApiKeyVisibility = (key: string) => {
    setShowApiKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const exportSettingsBackup = () => {
    try {
      console.log('Starting settings backup...');
      const backupData = {
        settings,
        tenantInfo: {
          tenantId: currentTenant,
          plan: currentPlan,
          exportDate: new Date().toISOString(),
          version: "1.0"
        }
      };
      
      const dataStr = JSON.stringify(backupData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      // Create download URL and trigger browser save dialog
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `argilette-crm-settings-backup-${new Date().toISOString().split('T')[0]}.json`;
      
      // Ensure the link triggers the browser's save dialog
      link.style.display = 'none';
      document.body.appendChild(link);
      
      // Trigger the download with save dialog
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
      
      console.log('Settings backup popup triggered successfully');
      alert('Backup file created! Check your browser\'s download dialog.');
    } catch (error) {
      console.error('Error creating backup:', error);
      alert('Error creating backup. Please try again.');
    }
  };

  const timeZones = [
    'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai',
    'Australia/Sydney', 'Pacific/Auckland'
  ];

  const currencies = [
    { code: 'USD', name: 'US Dollar' },
    { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'British Pound' },
    { code: 'JPY', name: 'Japanese Yen' },
    { code: 'CAD', name: 'Canadian Dollar' },
    { code: 'AUD', name: 'Australian Dollar' }
  ];

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <Settings className="h-8 w-8 text-slate-600" />
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-600 to-gray-600 bg-clip-text text-transparent">
                  Platform Settings
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-lg">
                  Configure your CRM platform with advanced customization options
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-slate-100 text-slate-800 border-slate-200">
                <div className="w-2 h-2 bg-slate-500 rounded-full mr-2 animate-pulse"></div>
                Advanced Config
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                White Label
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                Multi-Tenant
              </Badge>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <Button 
              variant="outline" 
              className="bg-white shadow-md border-slate-200"
              onClick={exportSettingsBackup}
            >
              <Download className="w-4 h-4 mr-2" />
              Backup Settings
            </Button>
            <Button variant="outline" onClick={loadSettings}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button onClick={saveSettings} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="general">
              <Building className="h-4 w-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="branding">
              <Palette className="h-4 w-4 mr-2" />
              Branding
            </TabsTrigger>
            <TabsTrigger value="localization">
              <Globe className="h-4 w-4 mr-2" />
              Localization
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="integrations">
              <Key className="h-4 w-4 mr-2" />
              Integrations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={settings.companyName}
                      onChange={(e) => updateSetting('companyName', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="companyEmail">Company Email</Label>
                    <Input
                      id="companyEmail"
                      type="email"
                      value={settings.companyEmail}
                      onChange={(e) => updateSetting('companyEmail', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyPhone">Company Phone</Label>
                    <Input
                      id="companyPhone"
                      value={settings.companyPhone}
                      onChange={(e) => updateSetting('companyPhone', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="companyWebsite">Company Website</Label>
                    <Input
                      id="companyWebsite"
                      type="url"
                      value={settings.companyWebsite}
                      onChange={(e) => updateSetting('companyWebsite', e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="companyAddress">Company Address</Label>
                  <Textarea
                    id="companyAddress"
                    value={settings.companyAddress}
                    onChange={(e) => updateSetting('companyAddress', e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('businessHours', 'Business Hours')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(settings.businessHours).map(([day, hours]) => (
                    <div key={day} className="flex items-center space-x-4">
                      <div className="w-24">
                        <Label className="capitalize">{day}</Label>
                      </div>
                      <Switch
                        checked={hours.enabled}
                        onCheckedChange={(checked) => updateSetting(`businessHours.${day}.enabled`, checked)}
                      />
                      {hours.enabled && (
                        <>
                          <Input
                            type="time"
                            value={hours.start}
                            onChange={(e) => updateSetting(`businessHours.${day}.start`, e.target.value)}
                            className="w-32"
                          />
                          <span>to</span>
                          <Input
                            type="time"
                            value={hours.end}
                            onChange={(e) => updateSetting(`businessHours.${day}.end`, e.target.value)}
                            className="w-32"
                          />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branding" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('brandColors', 'Brand Colors')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="primaryColor">{t('primaryColor', 'Primary Color')}</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={settings.primaryColor}
                        onChange={(e) => updateSetting('primaryColor', e.target.value)}
                        className="w-16 h-10"
                      />
                      <Input
                        value={settings.primaryColor}
                        onChange={(e) => updateSetting('primaryColor', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="secondaryColor">{t('secondaryColor', 'Secondary Color')}</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="secondaryColor"
                        type="color"
                        value={settings.secondaryColor}
                        onChange={(e) => updateSetting('secondaryColor', e.target.value)}
                        className="w-16 h-10"
                      />
                      <Input
                        value={settings.secondaryColor}
                        onChange={(e) => updateSetting('secondaryColor', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="accentColor">{t('accentColor', 'Accent Color')}</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="accentColor"
                        type="color"
                        value={settings.accentColor}
                        onChange={(e) => updateSetting('accentColor', e.target.value)}
                        className="w-16 h-10"
                      />
                      <Input
                        value={settings.accentColor}
                        onChange={(e) => updateSetting('accentColor', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('logoAndBranding', 'Logo & Branding')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="logo">{t('companyLogo', 'Company Logo')}</Label>
                  <div className="flex items-center space-x-4 mt-2">
                    {settings.logoUrl && (
                      <img src={settings.logoUrl} alt="Logo" className="w-16 h-16 object-contain border rounded" />
                    )}
                    <div className="flex-1">
                      <Input
                        id="logo"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="mb-2"
                      />
                      <p className="text-sm text-gray-600">{t('logoHint', 'Recommended: 200x60px, PNG or SVG')}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="customCSS">{t('customCSS', 'Custom CSS')}</Label>
                  <Textarea
                    id="customCSS"
                    value={settings.customCSS || ''}
                    onChange={(e) => updateSetting('customCSS', e.target.value)}
                    placeholder="/* Add your custom CSS here */"
                    rows={6}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="localization" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('languageAndRegion', 'Language & Region')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>{t('defaultLanguage', 'Default Language')}</Label>
                    <LanguageSelector 
                      variant="dropdown"
                      className="w-full mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="timezone">{t('timezone', 'Timezone')}</Label>
                    <Select 
                      value={settings.timezone} 
                      onValueChange={(value) => updateSetting('timezone', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeZones.map((tz) => (
                          <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="dateFormat">{t('dateFormat', 'Date Format')}</Label>
                    <Select 
                      value={settings.dateFormat} 
                      onValueChange={(value) => updateSetting('dateFormat', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="timeFormat">{t('timeFormat', 'Time Format')}</Label>
                    <Select 
                      value={settings.timeFormat} 
                      onValueChange={(value) => updateSetting('timeFormat', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12h">12 Hour</SelectItem>
                        <SelectItem value="24h">24 Hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="currency">{t('currency', 'Currency')}</Label>
                    <Select 
                      value={settings.currency} 
                      onValueChange={(value) => updateSetting('currency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Major Global Currencies */}
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                        <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                        <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                        <SelectItem value="CNY">CNY - Chinese Yuan</SelectItem>
                        <SelectItem value="CHF">CHF - Swiss Franc</SelectItem>
                        
                        {/* African Currencies */}
                        {CURRENCIES.filter(c => c.region === "Africa").map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {formatCurrencyDisplay(currency)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('notificationPreferences', 'Notification Preferences')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{t('emailNotifications', 'Email Notifications')}</Label>
                      <p className="text-sm text-gray-600">{t('emailNotificationsDesc', 'Receive notifications via email')}</p>
                    </div>
                    <Switch
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{t('smsNotifications', 'SMS Notifications')}</Label>
                      <p className="text-sm text-gray-600">{t('smsNotificationsDesc', 'Receive notifications via SMS')}</p>
                    </div>
                    <Switch
                      checked={settings.smsNotifications}
                      onCheckedChange={(checked) => updateSetting('smsNotifications', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{t('browserNotifications', 'Browser Notifications')}</Label>
                      <p className="text-sm text-gray-600">{t('browserNotificationsDesc', 'Show browser push notifications')}</p>
                    </div>
                    <Switch
                      checked={settings.browserNotifications}
                      onCheckedChange={(checked) => updateSetting('browserNotifications', checked)}
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <Label className="text-base font-medium">{t('notificationTypes', 'Notification Types')}</Label>
                  {Object.entries(settings.notificationTypes).map(([type, enabled]) => (
                    <div key={type} className="flex items-center justify-between">
                      <Label className="capitalize">{type.replace(/([A-Z])/g, ' $1').trim()}</Label>
                      <Switch
                        checked={enabled}
                        onCheckedChange={(checked) => updateSetting(`notificationTypes.${type}`, checked)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('securitySettings', 'Security Settings')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t('twoFactorAuth', 'Two-Factor Authentication')}</Label>
                    <p className="text-sm text-gray-600">{t('twoFactorAuthDesc', 'Add an extra layer of security')}</p>
                  </div>
                  <Switch
                    checked={settings.twoFactorAuth}
                    onCheckedChange={(checked) => updateSetting('twoFactorAuth', checked)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="sessionTimeout">{t('sessionTimeout', 'Session Timeout (minutes)')}</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))}
                    className="w-32"
                  />
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <Label className="text-base font-medium">{t('passwordPolicy', 'Password Policy')}</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="minLength">{t('minimumLength', 'Minimum Length')}</Label>
                      <Input
                        id="minLength"
                        type="number"
                        value={settings.passwordPolicy.minLength}
                        onChange={(e) => updateSetting('passwordPolicy.minLength', parseInt(e.target.value))}
                        className="w-24"
                      />
                    </div>
                    <div className="space-y-2">
                      {Object.entries(settings.passwordPolicy).filter(([key]) => key !== 'minLength').map(([key, value]) => (
                        <div key={key} className="flex items-center space-x-2">
                          <Switch
                            checked={value as boolean}
                            onCheckedChange={(checked) => updateSetting(`passwordPolicy.${key}`, checked)}
                          />
                          <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('emailConfiguration', 'Email Configuration')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="smtpHost">{t('smtpHost', 'SMTP Host')}</Label>
                    <Input
                      id="smtpHost"
                      value={settings.smtpSettings.host}
                      onChange={(e) => updateSetting('smtpSettings.host', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtpPort">{t('smtpPort', 'SMTP Port')}</Label>
                    <Input
                      id="smtpPort"
                      type="number"
                      value={settings.smtpSettings.port}
                      onChange={(e) => updateSetting('smtpSettings.port', parseInt(e.target.value))}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="smtpUsername">{t('smtpUsername', 'Username')}</Label>
                    <Input
                      id="smtpUsername"
                      value={settings.smtpSettings.username}
                      onChange={(e) => updateSetting('smtpSettings.username', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtpPassword">{t('smtpPassword', 'Password')}</Label>
                    <Input
                      id="smtpPassword"
                      type="password"
                      value={settings.smtpSettings.password}
                      onChange={(e) => updateSetting('smtpSettings.password', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('apiKeys', 'API Keys')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries({
                  openai: 'OpenAI API Key',
                  sendgrid: 'SendGrid API Key',
                  twilio: 'Twilio API Key',
                  stripe: 'Stripe API Key'
                }).map(([key, label]) => (
                  <div key={key}>
                    <Label htmlFor={key}>{label}</Label>
                    <div className="flex space-x-2">
                      <Input
                        id={key}
                        type={showApiKeys[key] ? "text" : "password"}
                        value={settings.apiKeys[key as keyof typeof settings.apiKeys] || ''}
                        onChange={(e) => updateSetting(`apiKeys.${key}`, e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleApiKeyVisibility(key)}
                      >
                        {showApiKeys[key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('featureToggles', 'Feature Toggles')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(settings.features).map(([feature, enabled]) => {
                  const featureAvailability = saasFeatures.getFeatureAvailability(feature);
                  const isAvailable = featureAvailability.available;
                  
                  return (
                    <div key={feature} className="flex items-center justify-between">
                      <div>
                        <Label className="capitalize">{feature.replace(/([A-Z])/g, ' $1').trim()}</Label>
                        {!isAvailable && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Upgrade Required
                          </Badge>
                        )}
                      </div>
                      <Switch
                        checked={enabled && isAvailable}
                        onCheckedChange={(checked) => updateSetting(`features.${feature}`, checked)}
                        disabled={!isAvailable}
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}