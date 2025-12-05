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
import { saasFeatures } from "@/services/saas-features";
import { globalSettings } from "@/services/settings-service";
import { CURRENCIES, formatCurrencyDisplay } from "@shared/currencies";

interface TenantSettings {
  companyName: string;
  companyLogo?: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite: string;
  
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl?: string;
  faviconUrl?: string;
  customCSS?: string;
  
  defaultLanguage: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  currency: string;
  numberFormat: string;
  
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
  
  twoFactorAuth: boolean;
  sessionTimeout: number;
  passwordPolicy: {
    minLength: number;
    requireNumbers: boolean;
    requireSymbols: boolean;
    requireUppercase: boolean;
    requireLowercase: boolean;
  };
  
  smtpSettings: {
    host: string;
    port: number;
    username: string;
    password: string;
    encryption: 'none' | 'ssl' | 'tls';
    fromName: string;
    fromEmail: string;
  };
  
  apiKeys: {
    openai?: string;
    sendgrid?: string;
    twilio?: string;
    stripe?: string;
  };
  
  features: {
    aiPredictions: boolean;
    reputationManagement: boolean;
    advancedAnalytics: boolean;
    whiteLabel: boolean;
    customDomain: boolean;
    apiAccess: boolean;
  };
  
  businessHours: {
    monday: { start: string; end: string; enabled: boolean };
    tuesday: { start: string; end: string; enabled: boolean };
    wednesday: { start: string; end: string; enabled: boolean };
    thursday: { start: string; end: string; enabled: boolean };
    friday: { start: string; end: string; enabled: boolean };
    saturday: { start: string; end: string; enabled: boolean };
    sunday: { start: string; end: string; enabled: boolean };
  };
  
  dataRetention: number;
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
  sessionTimeout: 1440,
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

const inputStyles = "bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)] placeholder:text-[hsl(215,16%,47%)] focus:border-[hsl(227,89%,63%)] focus:ring-[hsl(227,89%,63%)]";
const labelStyles = "text-[hsl(215,20%,65%)]";
const cardStyles = "bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg";
const cardTitleStyles = "text-lg font-semibold text-[hsl(210,17%,98%)]";
const selectTriggerStyles = "bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)]";
const selectContentStyles = "bg-[hsl(228,47%,12%)] border-[hsl(217,33%,17%)]";
const selectItemStyles = "text-[hsl(210,17%,98%)] focus:bg-[hsl(229,41%,16%)] focus:text-[hsl(210,17%,98%)]";
const switchStyles = "data-[state=checked]:bg-[hsl(227,89%,63%)]";
const separatorStyles = "bg-[hsl(217,33%,17%)]";
const textareaStyles = "bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)] placeholder:text-[hsl(215,16%,47%)]";

export default function SettingsPage() {
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
    const currentSettings = globalSettings.getSettings();
    if (Object.keys(currentSettings).length > 0) {
      setSettings({ ...defaultSettings, ...currentSettings });
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      globalSettings.updateSettings(settings);
      
      await saasFeatures.updateTenantConfig({
        companyName: settings.companyName,
        primaryColor: settings.primaryColor,
        secondaryColor: settings.secondaryColor,
        timezone: settings.timezone,
        currency: settings.currency,
        language: settings.defaultLanguage
      });
      
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
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `argilette-crm-settings-backup-${new Date().toISOString().split('T')[0]}.json`;
      
      link.style.display = 'none';
      document.body.appendChild(link);
      
      link.click();
      
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[hsl(210,17%,98%)] tracking-tight">
              Settings
            </h1>
            <p className="text-sm text-[hsl(215,20%,65%)]">
              Configure your platform settings and preferences
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Badge className="bg-[hsl(229,41%,16%)] text-[hsl(227,89%,63%)] border-0">
              <div className="w-2 h-2 bg-[hsl(227,89%,63%)] rounded-full mr-2 animate-pulse"></div>
              Advanced Config
            </Badge>
            <Badge className="bg-[hsl(229,41%,16%)] text-[hsl(142,76%,36%)] border-0">
              White Label
            </Badge>
            <Badge className="bg-[hsl(229,41%,16%)] text-[hsl(227,89%,63%)] border-0">
              Multi-Tenant
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 justify-end">
          <Button 
            variant="outline" 
            className="border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)] hover:bg-[hsl(229,41%,16%)] hover:text-[hsl(210,17%,98%)]"
            onClick={exportSettingsBackup}
            data-testid="button-backup-settings"
          >
            <Download className="w-4 h-4 mr-2" />
            Backup Settings
          </Button>
          <Button 
            variant="outline" 
            className="border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)] hover:bg-[hsl(229,41%,16%)] hover:text-[hsl(210,17%,98%)]"
            onClick={loadSettings}
            data-testid="button-reset-settings"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button 
            className="bg-[hsl(227,89%,63%)] hover:bg-[hsl(227,89%,55%)] text-white"
            onClick={saveSettings} 
            disabled={isSaving}
            data-testid="button-save-settings"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-[hsl(229,41%,16%)] border border-[hsl(217,33%,17%)] p-1">
            <TabsTrigger 
              value="general"
              className="data-[state=active]:bg-[hsl(227,89%,63%)] data-[state=active]:text-white text-[hsl(215,20%,65%)]"
              data-testid="tab-general"
            >
              <Building className="h-4 w-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger 
              value="branding"
              className="data-[state=active]:bg-[hsl(227,89%,63%)] data-[state=active]:text-white text-[hsl(215,20%,65%)]"
              data-testid="tab-branding"
            >
              <Palette className="h-4 w-4 mr-2" />
              Branding
            </TabsTrigger>
            <TabsTrigger 
              value="localization"
              className="data-[state=active]:bg-[hsl(227,89%,63%)] data-[state=active]:text-white text-[hsl(215,20%,65%)]"
              data-testid="tab-localization"
            >
              <Globe className="h-4 w-4 mr-2" />
              Localization
            </TabsTrigger>
            <TabsTrigger 
              value="notifications"
              className="data-[state=active]:bg-[hsl(227,89%,63%)] data-[state=active]:text-white text-[hsl(215,20%,65%)]"
              data-testid="tab-notifications"
            >
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger 
              value="security"
              className="data-[state=active]:bg-[hsl(227,89%,63%)] data-[state=active]:text-white text-[hsl(215,20%,65%)]"
              data-testid="tab-security"
            >
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger 
              value="integrations"
              className="data-[state=active]:bg-[hsl(227,89%,63%)] data-[state=active]:text-white text-[hsl(215,20%,65%)]"
              data-testid="tab-integrations"
            >
              <Key className="h-4 w-4 mr-2" />
              Integrations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6 mt-6">
            <Card className={cardStyles}>
              <CardHeader>
                <CardTitle className={cardTitleStyles}>Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyName" className={labelStyles}>Company Name</Label>
                    <Input
                      id="companyName"
                      value={settings.companyName}
                      onChange={(e) => updateSetting('companyName', e.target.value)}
                      className={inputStyles}
                      data-testid="input-company-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="companyEmail" className={labelStyles}>Company Email</Label>
                    <Input
                      id="companyEmail"
                      type="email"
                      value={settings.companyEmail}
                      onChange={(e) => updateSetting('companyEmail', e.target.value)}
                      className={inputStyles}
                      data-testid="input-company-email"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyPhone" className={labelStyles}>Company Phone</Label>
                    <Input
                      id="companyPhone"
                      value={settings.companyPhone}
                      onChange={(e) => updateSetting('companyPhone', e.target.value)}
                      className={inputStyles}
                      data-testid="input-company-phone"
                    />
                  </div>
                  <div>
                    <Label htmlFor="companyWebsite" className={labelStyles}>Company Website</Label>
                    <Input
                      id="companyWebsite"
                      type="url"
                      value={settings.companyWebsite}
                      onChange={(e) => updateSetting('companyWebsite', e.target.value)}
                      className={inputStyles}
                      data-testid="input-company-website"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="companyAddress" className={labelStyles}>Company Address</Label>
                  <Textarea
                    id="companyAddress"
                    value={settings.companyAddress}
                    onChange={(e) => updateSetting('companyAddress', e.target.value)}
                    rows={3}
                    className={textareaStyles}
                    data-testid="textarea-company-address"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className={cardStyles}>
              <CardHeader>
                <CardTitle className={cardTitleStyles}>{t('businessHours', 'Business Hours')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(settings.businessHours).map(([day, hours]) => (
                    <div key={day} className="flex items-center gap-4">
                      <div className="w-24">
                        <Label className={`capitalize ${labelStyles}`}>{day}</Label>
                      </div>
                      <Switch
                        checked={hours.enabled}
                        onCheckedChange={(checked) => updateSetting(`businessHours.${day}.enabled`, checked)}
                        className={switchStyles}
                        data-testid={`switch-${day}-enabled`}
                      />
                      {hours.enabled && (
                        <>
                          <Input
                            type="time"
                            value={hours.start}
                            onChange={(e) => updateSetting(`businessHours.${day}.start`, e.target.value)}
                            className={`w-32 ${inputStyles}`}
                            data-testid={`input-${day}-start`}
                          />
                          <span className="text-[hsl(215,20%,65%)]">to</span>
                          <Input
                            type="time"
                            value={hours.end}
                            onChange={(e) => updateSetting(`businessHours.${day}.end`, e.target.value)}
                            className={`w-32 ${inputStyles}`}
                            data-testid={`input-${day}-end`}
                          />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branding" className="space-y-6 mt-6">
            <Card className={cardStyles}>
              <CardHeader>
                <CardTitle className={cardTitleStyles}>{t('brandColors', 'Brand Colors')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="primaryColor" className={labelStyles}>{t('primaryColor', 'Primary Color')}</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={settings.primaryColor}
                        onChange={(e) => updateSetting('primaryColor', e.target.value)}
                        className="w-16 h-10 p-1 bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)]"
                        data-testid="input-primary-color-picker"
                      />
                      <Input
                        value={settings.primaryColor}
                        onChange={(e) => updateSetting('primaryColor', e.target.value)}
                        className={`flex-1 ${inputStyles}`}
                        data-testid="input-primary-color-text"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="secondaryColor" className={labelStyles}>{t('secondaryColor', 'Secondary Color')}</Label>
                    <div className="flex gap-2">
                      <Input
                        id="secondaryColor"
                        type="color"
                        value={settings.secondaryColor}
                        onChange={(e) => updateSetting('secondaryColor', e.target.value)}
                        className="w-16 h-10 p-1 bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)]"
                        data-testid="input-secondary-color-picker"
                      />
                      <Input
                        value={settings.secondaryColor}
                        onChange={(e) => updateSetting('secondaryColor', e.target.value)}
                        className={`flex-1 ${inputStyles}`}
                        data-testid="input-secondary-color-text"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="accentColor" className={labelStyles}>{t('accentColor', 'Accent Color')}</Label>
                    <div className="flex gap-2">
                      <Input
                        id="accentColor"
                        type="color"
                        value={settings.accentColor}
                        onChange={(e) => updateSetting('accentColor', e.target.value)}
                        className="w-16 h-10 p-1 bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)]"
                        data-testid="input-accent-color-picker"
                      />
                      <Input
                        value={settings.accentColor}
                        onChange={(e) => updateSetting('accentColor', e.target.value)}
                        className={`flex-1 ${inputStyles}`}
                        data-testid="input-accent-color-text"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={cardStyles}>
              <CardHeader>
                <CardTitle className={cardTitleStyles}>{t('logoAndBranding', 'Logo & Branding')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="logo" className={labelStyles}>{t('companyLogo', 'Company Logo')}</Label>
                  <div className="flex items-center gap-4 mt-2">
                    {settings.logoUrl && (
                      <img src={settings.logoUrl} alt="Logo" className="w-16 h-16 object-contain border border-[hsl(217,33%,17%)] rounded bg-[hsl(229,41%,16%)]" />
                    )}
                    <div className="flex-1">
                      <Input
                        id="logo"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className={`mb-2 ${inputStyles}`}
                        data-testid="input-logo-upload"
                      />
                      <p className="text-sm text-[hsl(215,16%,47%)]">{t('logoHint', 'Recommended: 200x60px, PNG or SVG')}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="customCSS" className={labelStyles}>{t('customCSS', 'Custom CSS')}</Label>
                  <Textarea
                    id="customCSS"
                    value={settings.customCSS || ''}
                    onChange={(e) => updateSetting('customCSS', e.target.value)}
                    placeholder="/* Add your custom CSS here */"
                    rows={6}
                    className={textareaStyles}
                    data-testid="textarea-custom-css"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="localization" className="space-y-6 mt-6">
            <Card className={cardStyles}>
              <CardHeader>
                <CardTitle className={cardTitleStyles}>{t('languageAndRegion', 'Language & Region')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className={labelStyles}>{t('defaultLanguage', 'Default Language')}</Label>
                    <LanguageSelector 
                      variant="dropdown"
                      className="w-full mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="timezone" className={labelStyles}>{t('timezone', 'Timezone')}</Label>
                    <Select 
                      value={settings.timezone} 
                      onValueChange={(value) => updateSetting('timezone', value)}
                    >
                      <SelectTrigger className={selectTriggerStyles} data-testid="select-timezone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={selectContentStyles}>
                        {timeZones.map((tz) => (
                          <SelectItem key={tz} value={tz} className={selectItemStyles}>{tz}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="dateFormat" className={labelStyles}>{t('dateFormat', 'Date Format')}</Label>
                    <Select 
                      value={settings.dateFormat} 
                      onValueChange={(value) => updateSetting('dateFormat', value)}
                    >
                      <SelectTrigger className={selectTriggerStyles} data-testid="select-date-format">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={selectContentStyles}>
                        <SelectItem value="MM/DD/YYYY" className={selectItemStyles}>MM/DD/YYYY</SelectItem>
                        <SelectItem value="DD/MM/YYYY" className={selectItemStyles}>DD/MM/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD" className={selectItemStyles}>YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="timeFormat" className={labelStyles}>{t('timeFormat', 'Time Format')}</Label>
                    <Select 
                      value={settings.timeFormat} 
                      onValueChange={(value) => updateSetting('timeFormat', value)}
                    >
                      <SelectTrigger className={selectTriggerStyles} data-testid="select-time-format">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={selectContentStyles}>
                        <SelectItem value="12h" className={selectItemStyles}>12 Hour</SelectItem>
                        <SelectItem value="24h" className={selectItemStyles}>24 Hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="currency" className={labelStyles}>{t('currency', 'Currency')}</Label>
                    <Select 
                      value={settings.currency} 
                      onValueChange={(value) => updateSetting('currency', value)}
                    >
                      <SelectTrigger className={selectTriggerStyles} data-testid="select-currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={selectContentStyles}>
                        <SelectItem value="USD" className={selectItemStyles}>USD - US Dollar</SelectItem>
                        <SelectItem value="EUR" className={selectItemStyles}>EUR - Euro</SelectItem>
                        <SelectItem value="GBP" className={selectItemStyles}>GBP - British Pound</SelectItem>
                        <SelectItem value="CAD" className={selectItemStyles}>CAD - Canadian Dollar</SelectItem>
                        <SelectItem value="AUD" className={selectItemStyles}>AUD - Australian Dollar</SelectItem>
                        <SelectItem value="JPY" className={selectItemStyles}>JPY - Japanese Yen</SelectItem>
                        <SelectItem value="CNY" className={selectItemStyles}>CNY - Chinese Yuan</SelectItem>
                        <SelectItem value="CHF" className={selectItemStyles}>CHF - Swiss Franc</SelectItem>
                        
                        {CURRENCIES.filter(c => c.region === "Africa").map((currency) => (
                          <SelectItem key={currency.code} value={currency.code} className={selectItemStyles}>
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

          <TabsContent value="notifications" className="space-y-6 mt-6">
            <Card className={cardStyles}>
              <CardHeader>
                <CardTitle className={cardTitleStyles}>{t('notificationPreferences', 'Notification Preferences')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <Label className={labelStyles}>{t('emailNotifications', 'Email Notifications')}</Label>
                      <p className="text-sm text-[hsl(215,16%,47%)]">{t('emailNotificationsDesc', 'Receive notifications via email')}</p>
                    </div>
                    <Switch
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
                      className={switchStyles}
                      data-testid="switch-email-notifications"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <Label className={labelStyles}>{t('smsNotifications', 'SMS Notifications')}</Label>
                      <p className="text-sm text-[hsl(215,16%,47%)]">{t('smsNotificationsDesc', 'Receive notifications via SMS')}</p>
                    </div>
                    <Switch
                      checked={settings.smsNotifications}
                      onCheckedChange={(checked) => updateSetting('smsNotifications', checked)}
                      className={switchStyles}
                      data-testid="switch-sms-notifications"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <Label className={labelStyles}>{t('browserNotifications', 'Browser Notifications')}</Label>
                      <p className="text-sm text-[hsl(215,16%,47%)]">{t('browserNotificationsDesc', 'Show browser push notifications')}</p>
                    </div>
                    <Switch
                      checked={settings.browserNotifications}
                      onCheckedChange={(checked) => updateSetting('browserNotifications', checked)}
                      className={switchStyles}
                      data-testid="switch-browser-notifications"
                    />
                  </div>
                </div>
                
                <Separator className={separatorStyles} />
                
                <div className="space-y-4">
                  <Label className={`text-base font-medium ${labelStyles}`}>{t('notificationTypes', 'Notification Types')}</Label>
                  {Object.entries(settings.notificationTypes).map(([type, enabled]) => (
                    <div key={type} className="flex items-center justify-between gap-4">
                      <Label className={`capitalize ${labelStyles}`}>{type.replace(/([A-Z])/g, ' $1').trim()}</Label>
                      <Switch
                        checked={enabled}
                        onCheckedChange={(checked) => updateSetting(`notificationTypes.${type}`, checked)}
                        className={switchStyles}
                        data-testid={`switch-notification-${type}`}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6 mt-6">
            <Card className={cardStyles}>
              <CardHeader>
                <CardTitle className={cardTitleStyles}>{t('securitySettings', 'Security Settings')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label className={labelStyles}>{t('twoFactorAuth', 'Two-Factor Authentication')}</Label>
                    <p className="text-sm text-[hsl(215,16%,47%)]">{t('twoFactorAuthDesc', 'Add an extra layer of security')}</p>
                  </div>
                  <Switch
                    checked={settings.twoFactorAuth}
                    onCheckedChange={(checked) => updateSetting('twoFactorAuth', checked)}
                    className={switchStyles}
                    data-testid="switch-two-factor-auth"
                  />
                </div>
                
                <div>
                  <Label htmlFor="sessionTimeout" className={labelStyles}>{t('sessionTimeout', 'Session Timeout (minutes)')}</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))}
                    className={`w-32 ${inputStyles}`}
                    data-testid="input-session-timeout"
                  />
                </div>
                
                <Separator className={separatorStyles} />
                
                <div className="space-y-4">
                  <Label className={`text-base font-medium ${labelStyles}`}>{t('passwordPolicy', 'Password Policy')}</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="minLength" className={labelStyles}>{t('minimumLength', 'Minimum Length')}</Label>
                      <Input
                        id="minLength"
                        type="number"
                        value={settings.passwordPolicy.minLength}
                        onChange={(e) => updateSetting('passwordPolicy.minLength', parseInt(e.target.value))}
                        className={`w-24 ${inputStyles}`}
                        data-testid="input-password-min-length"
                      />
                    </div>
                    <div className="space-y-2">
                      {Object.entries(settings.passwordPolicy).filter(([key]) => key !== 'minLength').map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2">
                          <Switch
                            checked={value as boolean}
                            onCheckedChange={(checked) => updateSetting(`passwordPolicy.${key}`, checked)}
                            className={switchStyles}
                            data-testid={`switch-password-${key}`}
                          />
                          <Label className={`capitalize ${labelStyles}`}>{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6 mt-6">
            <Card className={cardStyles}>
              <CardHeader>
                <CardTitle className={cardTitleStyles}>{t('emailConfiguration', 'Email Configuration')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="smtpHost" className={labelStyles}>{t('smtpHost', 'SMTP Host')}</Label>
                    <Input
                      id="smtpHost"
                      value={settings.smtpSettings.host}
                      onChange={(e) => updateSetting('smtpSettings.host', e.target.value)}
                      className={inputStyles}
                      data-testid="input-smtp-host"
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtpPort" className={labelStyles}>{t('smtpPort', 'SMTP Port')}</Label>
                    <Input
                      id="smtpPort"
                      type="number"
                      value={settings.smtpSettings.port}
                      onChange={(e) => updateSetting('smtpSettings.port', parseInt(e.target.value))}
                      className={inputStyles}
                      data-testid="input-smtp-port"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="smtpUsername" className={labelStyles}>{t('smtpUsername', 'Username')}</Label>
                    <Input
                      id="smtpUsername"
                      value={settings.smtpSettings.username}
                      onChange={(e) => updateSetting('smtpSettings.username', e.target.value)}
                      className={inputStyles}
                      data-testid="input-smtp-username"
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtpPassword" className={labelStyles}>{t('smtpPassword', 'Password')}</Label>
                    <Input
                      id="smtpPassword"
                      type="password"
                      value={settings.smtpSettings.password}
                      onChange={(e) => updateSetting('smtpSettings.password', e.target.value)}
                      className={inputStyles}
                      data-testid="input-smtp-password"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={cardStyles}>
              <CardHeader>
                <CardTitle className={cardTitleStyles}>{t('apiKeys', 'API Keys')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries({
                  openai: 'Argilette AI Key',
                  sendgrid: 'SendGrid API Key',
                  twilio: 'Twilio API Key',
                  stripe: 'Stripe API Key'
                }).map(([key, label]) => (
                  <div key={key}>
                    <Label htmlFor={key} className={labelStyles}>{label}</Label>
                    <div className="flex gap-2">
                      <Input
                        id={key}
                        type={showApiKeys[key] ? "text" : "password"}
                        value={settings.apiKeys[key as keyof typeof settings.apiKeys] || ''}
                        onChange={(e) => updateSetting(`apiKeys.${key}`, e.target.value)}
                        className={`flex-1 ${inputStyles}`}
                        data-testid={`input-api-key-${key}`}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => toggleApiKeyVisibility(key)}
                        className="border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)] hover:bg-[hsl(229,41%,16%)] hover:text-[hsl(210,17%,98%)]"
                        data-testid={`button-toggle-api-key-${key}`}
                      >
                        {showApiKeys[key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className={cardStyles}>
              <CardHeader>
                <CardTitle className={cardTitleStyles}>{t('featureToggles', 'Feature Toggles')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(settings.features).map(([feature, enabled]) => {
                  const featureAvailability = saasFeatures.getFeatureAvailability(feature);
                  const isAvailable = featureAvailability.available;
                  
                  return (
                    <div key={feature} className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <Label className={`capitalize ${labelStyles}`}>{feature.replace(/([A-Z])/g, ' $1').trim()}</Label>
                        {!isAvailable && (
                          <Badge className="bg-[hsl(229,41%,16%)] text-[hsl(45,93%,47%)] border-0 text-xs">
                            Upgrade Required
                          </Badge>
                        )}
                      </div>
                      <Switch
                        checked={enabled && isAvailable}
                        onCheckedChange={(checked) => updateSetting(`features.${feature}`, checked)}
                        disabled={!isAvailable}
                        className={switchStyles}
                        data-testid={`switch-feature-${feature}`}
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
