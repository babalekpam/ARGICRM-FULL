import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Palette, 
  Upload, 
  Eye, 
  Download,
  Settings,
  Crown,
  Check,
  X,
  RefreshCw
} from "lucide-react";
import Layout from "@/components/layout";
import { useToast } from "@/hooks/use-toast";
import { useWhiteLabel } from "@/hooks/useWhiteLabel";
import { useAuth } from "@/hooks/useAuth";
import { saasFeatures } from "@/services/saas-features";
import { isPlatformOwner } from "@/utils/permissions";

export default function WhiteLabelSettingsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { settings, updateSettings, isCustomized } = useWhiteLabel();
  const [preview, setPreview] = useState(false);
  const isPlatformOwnerUser = isPlatformOwner(user);

  const handleSettingChange = (key: string, value: any) => {
    updateSettings({ [key]: value });
  };

  const handleSave = () => {
    toast({
      title: "White label settings saved",
      description: "Your branding changes have been applied across the platform.",
    });
  };

  const handleReset = () => {
    updateSettings({
      companyName: "ARGILETTE CRM",
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
    });
    toast({
      title: "Settings reset",
      description: "White label settings have been reset to defaults.",
    });
  };

  const handleExport = () => {
    const config = JSON.stringify(settings, null, 2);
    const blob = new Blob([config], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'white-label-config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (key: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = key === 'faviconUrl' ? '.ico,.png' : 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          handleSettingChange(key, dataUrl);
          toast({
            title: "File uploaded",
            description: `${key === 'faviconUrl' ? 'Favicon' : 'Logo'} updated successfully.`,
          });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const isPremiumFeature = !isPlatformOwnerUser; // Platform owners get free access

  if (isPremiumFeature) {
    return (
      <Layout>
        <div className="container mx-auto p-6 space-y-6">
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <Crown className="h-8 w-8 text-purple-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">White Label Customization</h1>
            <p className="text-gray-600 mb-6">Enterprise feature - Customize the platform with your branding</p>
            
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center justify-center">
                  <Palette className="h-5 w-5 mr-2" />
                  Upgrade Required
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-purple-900">Branding Features</h3>
                    <ul className="space-y-2">
                      <li className="flex items-center text-sm">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        Custom logo and favicon
                      </li>
                      <li className="flex items-center text-sm">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        Custom color schemes
                      </li>
                      <li className="flex items-center text-sm">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        Remove ARGILETTE branding
                      </li>
                      <li className="flex items-center text-sm">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        Custom domain setup
                      </li>
                    </ul>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold text-purple-900">Customization Options</h3>
                    <ul className="space-y-2">
                      <li className="flex items-center text-sm">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        Branded email templates
                      </li>
                      <li className="flex items-center text-sm">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        Custom footer content
                      </li>
                      <li className="flex items-center text-sm">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        Privacy & terms pages
                      </li>
                      <li className="flex items-center text-sm">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        Support contact branding
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div className="text-center pt-4">
                  <Badge className="bg-purple-600 text-white mb-4">
                    <Crown className="h-3 w-3 mr-1" />
                    Enterprise Plan Required
                  </Badge>
                  <div className="space-y-2">
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                      <Crown className="h-4 w-4 mr-2" />
                      Upgrade to Enterprise
                    </Button>
                    <p className="text-sm text-gray-500">Starting at $99/month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Palette className="mr-3 h-8 w-8 text-purple-600" />
              White Label Settings
            </h1>
            <p className="text-gray-600 mt-1">Customize the platform with your company branding</p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={handleReset}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export Config
            </Button>
            <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700">
              Apply Changes
            </Button>
          </div>
        </div>

        {isCustomized && (
          <Card className="bg-green-50 border-green-200 mb-6">
            <CardContent className="py-4">
              <div className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-600" />
                <span className="text-green-800 font-medium">
                  White label customizations are active and applied across the platform
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="branding" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="domain">Domain</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
          </TabsList>

          <TabsContent value="branding" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Branding</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        value={settings.companyName}
                        onChange={(e) => handleSettingChange('companyName', e.target.value)}
                        placeholder="Your Company Name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="logoUpload">Company Logo</Label>
                      <div className="flex items-center space-x-3 mt-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleFileUpload('logoUrl')}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Logo
                        </Button>
                        {settings.logoUrl && (
                          <img src={settings.logoUrl} alt="Logo" className="h-8 rounded" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Recommended: 200x60px, PNG format</p>
                    </div>

                    <div>
                      <Label htmlFor="faviconUpload">Favicon</Label>
                      <div className="flex items-center space-x-3 mt-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleFileUpload('faviconUrl')}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Favicon
                        </Button>
                        {settings.faviconUrl && (
                          <img src={settings.faviconUrl} alt="Favicon" className="h-4 w-4" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Recommended: 32x32px, ICO or PNG format</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Remove ARGILETTE Branding</Label>
                        <p className="text-sm text-gray-500">Hide "Powered by ARGILETTE" footer</p>
                      </div>
                      <Switch
                        checked={settings.removeBranding}
                        onCheckedChange={(checked) => handleSettingChange('removeBranding', checked)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="supportEmail">Support Email</Label>
                      <Input
                        id="supportEmail"
                        type="email"
                        value={settings.supportEmail}
                        onChange={(e) => handleSettingChange('supportEmail', e.target.value)}
                        placeholder="support@yourcompany.com"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="colors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Color Scheme</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex items-center space-x-3 mt-2">
                      <input
                        type="color"
                        id="primaryColor"
                        value={settings.primaryColor}
                        onChange={(e) => handleSettingChange('primaryColor', e.target.value)}
                        className="w-12 h-10 rounded border"
                      />
                      <Input
                        value={settings.primaryColor}
                        onChange={(e) => handleSettingChange('primaryColor', e.target.value)}
                        placeholder="#7C3AED"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="secondaryColor">Secondary Color</Label>
                    <div className="flex items-center space-x-3 mt-2">
                      <input
                        type="color"
                        id="secondaryColor"
                        value={settings.secondaryColor}
                        onChange={(e) => handleSettingChange('secondaryColor', e.target.value)}
                        className="w-12 h-10 rounded border"
                      />
                      <Input
                        value={settings.secondaryColor}
                        onChange={(e) => handleSettingChange('secondaryColor', e.target.value)}
                        placeholder="#1E40AF"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-3">Color Preview</h4>
                  <div className="flex space-x-4">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-6 h-6 rounded"
                        style={{ backgroundColor: settings.primaryColor }}
                      ></div>
                      <span className="text-sm">Primary</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-6 h-6 rounded"
                        style={{ backgroundColor: settings.secondaryColor }}
                      ></div>
                      <span className="text-sm">Secondary</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="domain" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Custom Domain</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="customDomain">Custom Domain</Label>
                  <Input
                    id="customDomain"
                    value={settings.customDomain}
                    onChange={(e) => handleSettingChange('customDomain', e.target.value)}
                    placeholder="crm.yourcompany.com"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Point your domain's CNAME record to: argilette-custom.replit.app
                  </p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Domain Setup Instructions</h4>
                  <ol className="text-sm text-blue-800 space-y-1">
                    <li>1. Add CNAME record in your DNS settings</li>
                    <li>2. Point to: argilette-custom.replit.app</li>
                    <li>3. SSL certificate will be automatically provisioned</li>
                    <li>4. Allow 24-48 hours for propagation</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Custom Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="customFooter">Custom Footer Text</Label>
                  <Input
                    id="customFooter"
                    value={settings.customFooter}
                    onChange={(e) => handleSettingChange('customFooter', e.target.value)}
                    placeholder="© 2025 Your Company. All rights reserved."
                  />
                </div>

                <div>
                  <Label htmlFor="privacyPolicy">Privacy Policy URL</Label>
                  <Input
                    id="privacyPolicy"
                    value={settings.privacyPolicyUrl}
                    onChange={(e) => handleSettingChange('privacyPolicyUrl', e.target.value)}
                    placeholder="https://yourcompany.com/privacy"
                  />
                </div>

                <div>
                  <Label htmlFor="termsOfService">Terms of Service URL</Label>
                  <Input
                    id="termsOfService"
                    value={settings.termsOfServiceUrl}
                    onChange={(e) => handleSettingChange('termsOfServiceUrl', e.target.value)}
                    placeholder="https://yourcompany.com/terms"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}