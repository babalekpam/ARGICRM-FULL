import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Store, 
  Globe,
  Palette,
  CreditCard,
  Truck,
  Shield,
  Mail,
  Settings,
  Save,
  Eye,
  Upload,
  ExternalLink,
  Smartphone,
  Monitor,
  Tablet,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Linkedin
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function StoreSettings() {
  const [activeTab, setActiveTab] = useState("general");
  const [previewMode, setPreviewMode] = useState("desktop");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch store settings
  const { data: storeSettings, isLoading } = useQuery({
    queryKey: ["/api/ecommerce/store-settings"],
  });

  const [settings, setSettings] = useState({
    // General Settings
    name: "My Store",
    description: "Your premier online store",
    subdomain: "my-store",
    customDomain: "",
    logo: "",
    favicon: "",
    currency: "USD",
    timezone: "UTC",
    language: "en",
    
    // Design Settings
    theme: "modern",
    primaryColor: "#3b82f6",
    secondaryColor: "#1f2937",
    fontFamily: "Inter",
    
    // SEO Settings
    metaTitle: "My Store - Premium Products Online",
    metaDescription: "Discover our amazing collection of premium products with fast shipping and great customer service.",
    keywords: ["store", "products", "shopping"],
    ogImage: "",
    
    // Social Links
    socialLinks: {
      facebook: "",
      twitter: "",
      instagram: "",
      linkedin: "",
      youtube: "",
    },
    
    // Payment Methods
    paymentMethods: {
      stripe: true,
      paypal: false,
      applePay: false,
      googlePay: false,
      bankTransfer: false,
    },
    
    // Shipping Settings
    freeShippingThreshold: 50,
    shippingRates: [
      { name: "Standard", price: 5.99, estimatedDays: "3-5 days" },
      { name: "Express", price: 12.99, estimatedDays: "1-2 days" },
    ],
    
    // Tax Settings
    includeTax: false,
    taxRate: 8.5,
    taxName: "Sales Tax",
    
    // Notification Settings
    orderNotifications: true,
    lowStockAlerts: true,
    customerEmails: true,
    
    // Store Status
    isPublic: true,
    maintenanceMode: false,
    ...storeSettings
  });

  // Update store settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PUT", "/api/ecommerce/store-settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ecommerce/store-settings"] });
      toast({
        title: "Success",
        description: "Store settings updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateSettingsMutation.mutate(settings);
  };

  const handleInputChange = (field: string, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleNestedInputChange = (parent: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof typeof prev],
        [field]: value
      }
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Store Settings
            </h1>
            <p className="text-gray-600 mt-2">
              Customize your store appearance and functionality
            </p>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" className="flex items-center gap-2">
              <Eye size={16} />
              Preview Store
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={updateSettingsMutation.isPending}
              className="flex items-center gap-2"
            >
              <Save size={16} />
              {updateSettingsMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Settings Panel */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="design">Design</TabsTrigger>
                <TabsTrigger value="seo">SEO</TabsTrigger>
                <TabsTrigger value="payments">Payments</TabsTrigger>
                <TabsTrigger value="shipping">Shipping</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>

              <TabsContent value="general">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Store size={20} />
                      General Settings
                    </CardTitle>
                    <CardDescription>Basic store information and configuration</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="storeName">Store Name</Label>
                        <Input
                          id="storeName"
                          value={settings.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          placeholder="Enter store name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="subdomain">Subdomain</Label>
                        <div className="flex">
                          <Input
                            id="subdomain"
                            value={settings.subdomain}
                            onChange={(e) => handleInputChange('subdomain', e.target.value)}
                            placeholder="my-store"
                          />
                          <span className="inline-flex items-center px-3 text-sm text-gray-500 bg-gray-50 border border-l-0 rounded-r">
                            .nodecrm.com
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Store Description</Label>
                      <Textarea
                        id="description"
                        value={settings.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Describe your store"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="customDomain">Custom Domain (Optional)</Label>
                      <Input
                        id="customDomain"
                        value={settings.customDomain}
                        onChange={(e) => handleInputChange('customDomain', e.target.value)}
                        placeholder="www.mystore.com"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Connect your own domain name
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="currency">Currency</Label>
                        <Select value={settings.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD - US Dollar</SelectItem>
                            <SelectItem value="EUR">EUR - Euro</SelectItem>
                            <SelectItem value="GBP">GBP - British Pound</SelectItem>
                            <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="timezone">Timezone</Label>
                        <Select value={settings.timezone} onValueChange={(value) => handleInputChange('timezone', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UTC">UTC</SelectItem>
                            <SelectItem value="America/New_York">Eastern Time</SelectItem>
                            <SelectItem value="America/Chicago">Central Time</SelectItem>
                            <SelectItem value="America/Denver">Mountain Time</SelectItem>
                            <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="language">Language</Label>
                        <Select value={settings.language} onValueChange={(value) => handleInputChange('language', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Spanish</SelectItem>
                            <SelectItem value="fr">French</SelectItem>
                            <SelectItem value="de">German</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Store Status</h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Store Visibility</Label>
                          <p className="text-sm text-gray-500">Make your store public</p>
                        </div>
                        <Switch
                          checked={settings.isPublic}
                          onCheckedChange={(checked) => handleInputChange('isPublic', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Maintenance Mode</Label>
                          <p className="text-sm text-gray-500">Temporarily disable store</p>
                        </div>
                        <Switch
                          checked={settings.maintenanceMode}
                          onCheckedChange={(checked) => handleInputChange('maintenanceMode', checked)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="design">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette size={20} />
                      Design & Branding
                    </CardTitle>
                    <CardDescription>Customize your store's appearance</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label>Store Logo</Label>
                      <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        <Upload className="mx-auto text-gray-400 mb-2" size={24} />
                        <p className="text-sm text-gray-500">Upload your store logo</p>
                        <Button variant="outline" size="sm" className="mt-2">
                          Choose File
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="primaryColor">Primary Color</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            id="primaryColor"
                            type="color"
                            value={settings.primaryColor}
                            onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                            className="w-16 h-10 p-1"
                          />
                          <Input
                            value={settings.primaryColor}
                            onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                            placeholder="#3b82f6"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="secondaryColor">Secondary Color</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            id="secondaryColor"
                            type="color"
                            value={settings.secondaryColor}
                            onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                            className="w-16 h-10 p-1"
                          />
                          <Input
                            value={settings.secondaryColor}
                            onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                            placeholder="#1f2937"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="theme">Theme</Label>
                      <Select value={settings.theme} onValueChange={(value) => handleInputChange('theme', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="modern">Modern</SelectItem>
                          <SelectItem value="classic">Classic</SelectItem>
                          <SelectItem value="minimal">Minimal</SelectItem>
                          <SelectItem value="bold">Bold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Social Media Links</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="facebook" className="flex items-center gap-2">
                            <Facebook size={16} />
                            Facebook
                          </Label>
                          <Input
                            id="facebook"
                            value={settings.socialLinks.facebook}
                            onChange={(e) => handleNestedInputChange('socialLinks', 'facebook', e.target.value)}
                            placeholder="https://facebook.com/yourstore"
                          />
                        </div>
                        <div>
                          <Label htmlFor="twitter" className="flex items-center gap-2">
                            <Twitter size={16} />
                            Twitter
                          </Label>
                          <Input
                            id="twitter"
                            value={settings.socialLinks.twitter}
                            onChange={(e) => handleNestedInputChange('socialLinks', 'twitter', e.target.value)}
                            placeholder="https://twitter.com/yourstore"
                          />
                        </div>
                        <div>
                          <Label htmlFor="instagram" className="flex items-center gap-2">
                            <Instagram size={16} />
                            Instagram
                          </Label>
                          <Input
                            id="instagram"
                            value={settings.socialLinks.instagram}
                            onChange={(e) => handleNestedInputChange('socialLinks', 'instagram', e.target.value)}
                            placeholder="https://instagram.com/yourstore"
                          />
                        </div>
                        <div>
                          <Label htmlFor="youtube" className="flex items-center gap-2">
                            <Youtube size={16} />
                            YouTube
                          </Label>
                          <Input
                            id="youtube"
                            value={settings.socialLinks.youtube}
                            onChange={(e) => handleNestedInputChange('socialLinks', 'youtube', e.target.value)}
                            placeholder="https://youtube.com/yourstore"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="seo">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe size={20} />
                      SEO Settings
                    </CardTitle>
                    <CardDescription>Optimize your store for search engines</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label htmlFor="metaTitle">Meta Title</Label>
                      <Input
                        id="metaTitle"
                        value={settings.metaTitle}
                        onChange={(e) => handleInputChange('metaTitle', e.target.value)}
                        placeholder="Your Store - Best Products Online"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        {settings.metaTitle.length}/60 characters
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="metaDescription">Meta Description</Label>
                      <Textarea
                        id="metaDescription"
                        value={settings.metaDescription}
                        onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                        placeholder="Discover amazing products with fast shipping and excellent customer service."
                        rows={3}
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        {settings.metaDescription.length}/160 characters
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="keywords">Keywords</Label>
                      <Input
                        id="keywords"
                        value={settings.keywords.join(', ')}
                        onChange={(e) => handleInputChange('keywords', e.target.value.split(', '))}
                        placeholder="store, products, shopping, online"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Separate keywords with commas
                      </p>
                    </div>

                    <div>
                      <Label>Open Graph Image</Label>
                      <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        <Upload className="mx-auto text-gray-400 mb-2" size={24} />
                        <p className="text-sm text-gray-500">Upload image for social media sharing</p>
                        <p className="text-xs text-gray-400">Recommended: 1200x630 pixels</p>
                        <Button variant="outline" size="sm" className="mt-2">
                          Choose File
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="payments">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard size={20} />
                      Payment Methods
                    </CardTitle>
                    <CardDescription>Configure payment processing</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      {Object.entries(settings.paymentMethods).map(([method, enabled]) => (
                        <div key={method} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h4 className="font-medium capitalize">{method.replace(/([A-Z])/g, ' $1').trim()}</h4>
                            <p className="text-sm text-gray-500">
                              {method === 'stripe' && 'Credit cards, debit cards'}
                              {method === 'paypal' && 'PayPal payments'}
                              {method === 'applePay' && 'Apple Pay'}
                              {method === 'googlePay' && 'Google Pay'}
                              {method === 'bankTransfer' && 'Bank transfer'}
                            </p>
                          </div>
                          <Switch
                            checked={enabled as boolean}
                            onCheckedChange={(checked) => 
                              handleNestedInputChange('paymentMethods', method, checked)
                            }
                          />
                        </div>
                      ))}
                    </div>

                    {settings.paymentMethods.stripe && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">Stripe Configuration</h4>
                        <p className="text-sm text-blue-700 mb-4">
                          Your Stripe keys are configured and ready to process payments.
                        </p>
                        <Button variant="outline" size="sm">
                          View Stripe Settings
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="shipping">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck size={20} />
                      Shipping Settings
                    </CardTitle>
                    <CardDescription>Configure shipping options and rates</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label htmlFor="freeShipping">Free Shipping Threshold</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-500">$</span>
                        <Input
                          id="freeShipping"
                          type="number"
                          value={settings.freeShippingThreshold}
                          onChange={(e) => handleInputChange('freeShippingThreshold', parseFloat(e.target.value))}
                          placeholder="50"
                        />
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Minimum order amount for free shipping
                      </p>
                    </div>

                    <div>
                      <Label>Shipping Rates</Label>
                      <div className="space-y-3 mt-2">
                        {settings.shippingRates.map((rate, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                            <Input
                              value={rate.name}
                              onChange={(e) => {
                                const newRates = [...settings.shippingRates];
                                newRates[index] = { ...rate, name: e.target.value };
                                handleInputChange('shippingRates', newRates);
                              }}
                              placeholder="Shipping method"
                              className="flex-1"
                            />
                            <div className="flex items-center gap-1">
                              <span className="text-sm text-gray-500">$</span>
                              <Input
                                type="number"
                                step="0.01"
                                value={rate.price}
                                onChange={(e) => {
                                  const newRates = [...settings.shippingRates];
                                  newRates[index] = { ...rate, price: parseFloat(e.target.value) };
                                  handleInputChange('shippingRates', newRates);
                                }}
                                placeholder="0.00"
                                className="w-24"
                              />
                            </div>
                            <Input
                              value={rate.estimatedDays}
                              onChange={(e) => {
                                const newRates = [...settings.shippingRates];
                                newRates[index] = { ...rate, estimatedDays: e.target.value };
                                handleInputChange('shippingRates', newRates);
                              }}
                              placeholder="3-5 days"
                              className="w-32"
                            />
                          </div>
                        ))}
                        <Button variant="outline" size="sm">
                          Add Shipping Rate
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Tax Settings</h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Include Tax in Prices</Label>
                          <p className="text-sm text-gray-500">Show prices with tax included</p>
                        </div>
                        <Switch
                          checked={settings.includeTax}
                          onCheckedChange={(checked) => handleInputChange('includeTax', checked)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="taxRate">Tax Rate (%)</Label>
                          <Input
                            id="taxRate"
                            type="number"
                            step="0.01"
                            value={settings.taxRate}
                            onChange={(e) => handleInputChange('taxRate', parseFloat(e.target.value))}
                            placeholder="8.5"
                          />
                        </div>
                        <div>
                          <Label htmlFor="taxName">Tax Name</Label>
                          <Input
                            id="taxName"
                            value={settings.taxName}
                            onChange={(e) => handleInputChange('taxName', e.target.value)}
                            placeholder="Sales Tax"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="advanced">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings size={20} />
                      Advanced Settings
                    </CardTitle>
                    <CardDescription>Advanced configuration options</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Notifications</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Order Notifications</Label>
                            <p className="text-sm text-gray-500">Email alerts for new orders</p>
                          </div>
                          <Switch
                            checked={settings.orderNotifications}
                            onCheckedChange={(checked) => handleInputChange('orderNotifications', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Low Stock Alerts</Label>
                            <p className="text-sm text-gray-500">Get notified when inventory is low</p>
                          </div>
                          <Switch
                            checked={settings.lowStockAlerts}
                            onCheckedChange={(checked) => handleInputChange('lowStockAlerts', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Customer Emails</Label>
                            <p className="text-sm text-gray-500">Send order confirmations to customers</p>
                          </div>
                          <Switch
                            checked={settings.customerEmails}
                            onCheckedChange={(checked) => handleInputChange('customerEmails', checked)}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-red-600">Danger Zone</h3>
                      <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                        <h4 className="font-medium text-red-900 mb-2">Delete Store</h4>
                        <p className="text-sm text-red-700 mb-4">
                          Permanently delete this store and all associated data. This action cannot be undone.
                        </p>
                        <Button variant="destructive" size="sm">
                          Delete Store
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Live Preview */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye size={20} />
                  Live Preview
                </CardTitle>
                <CardDescription>See how your store looks</CardDescription>
                
                {/* Device Toggle */}
                <div className="flex items-center gap-1 p-1 bg-gray-100 rounded">
                  <Button
                    variant={previewMode === 'desktop' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setPreviewMode('desktop')}
                  >
                    <Monitor size={16} />
                  </Button>
                  <Button
                    variant={previewMode === 'tablet' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setPreviewMode('tablet')}
                  >
                    <Tablet size={16} />
                  </Button>
                  <Button
                    variant={previewMode === 'mobile' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setPreviewMode('mobile')}
                  >
                    <Smartphone size={16} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className={`
                  mx-auto border rounded-lg overflow-hidden bg-white
                  ${previewMode === 'desktop' ? 'w-full h-80' : ''}
                  ${previewMode === 'tablet' ? 'w-64 h-80' : ''}
                  ${previewMode === 'mobile' ? 'w-48 h-80' : ''}
                `}>
                  {/* Mock Store Preview */}
                  <div 
                    className="h-12 flex items-center px-4 text-white text-sm font-medium"
                    style={{ backgroundColor: settings.primaryColor }}
                  >
                    {settings.name}
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="h-2 bg-gray-200 rounded"></div>
                    <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <div className="h-16 bg-gray-100 rounded"></div>
                      <div className="h-16 bg-gray-100 rounded"></div>
                    </div>
                    <button 
                      className="w-full py-2 text-white text-xs rounded mt-4"
                      style={{ backgroundColor: settings.primaryColor }}
                    >
                      Shop Now
                    </button>
                  </div>
                </div>
                
                <Button variant="outline" size="sm" className="w-full mt-4">
                  <ExternalLink className="mr-2" size={14} />
                  Open Full Preview
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}