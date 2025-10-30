import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { 
  Store, 
  Palette, 
  Package, 
  CreditCard,
  Eye,
  Check,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Globe,
  ShoppingCart,
  Truck,
  DollarSign,
  Zap,
  Upload,
  FileSpreadsheet,
  Wand2,
  Plus,
  Settings
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CURRENCIES } from "@shared/currencies";

interface StoreData {
  name: string;
  description: string;
  subdomain: string;
  customDomain?: string;
  theme: string;
  primaryColor: string;
  secondaryColor: string;
  currency: string;
  timezone: string;
  products: any[];
  paymentMethods: {
    stripe?: boolean;
    paypal?: boolean;
    bankTransfer?: boolean;
  };
  shippingSettings: {
    freeShippingThreshold?: number;
    shippingRates?: Array<{
      name: string;
      price: number;
      estimatedDays: string;
    }>;
  };
}

const THEMES = [
  {
    id: 'modern',
    name: 'Modern Minimal',
    description: 'Clean, contemporary design with focus on products',
    preview: '/themes/modern.png',
    colors: { primary: '#3b82f6', secondary: '#1f2937' }
  },
  {
    id: 'elegant',
    name: 'Elegant Luxury',
    description: 'Sophisticated design for premium brands',
    preview: '/themes/elegant.png',
    colors: { primary: '#8b5cf6', secondary: '#1e1b4b' }
  },
  {
    id: 'vibrant',
    name: 'Vibrant Energy',
    description: 'Bold, colorful design that stands out',
    preview: '/themes/vibrant.png',
    colors: { primary: '#f59e0b', secondary: '#78350f' }
  },
  {
    id: 'nature',
    name: 'Natural Organic',
    description: 'Earth tones for eco-friendly products',
    preview: '/themes/nature.png',
    colors: { primary: '#10b981', secondary: '#064e3b' }
  },
  {
    id: 'tech',
    name: 'Tech Forward',
    description: 'Modern tech aesthetic with sharp edges',
    preview: '/themes/tech.png',
    colors: { primary: '#06b6d4', secondary: '#164e63' }
  },
  {
    id: 'classic',
    name: 'Classic Timeless',
    description: 'Traditional design that never goes out of style',
    preview: '/themes/classic.png',
    colors: { primary: '#6366f1', secondary: '#312e81' }
  }
];

const STEPS = [
  { id: 1, name: 'Store Basics', icon: Store },
  { id: 2, name: 'Theme & Design', icon: Palette },
  { id: 3, name: 'Products', icon: Package },
  { id: 4, name: 'Payment & Shipping', icon: CreditCard },
  { id: 5, name: 'Review & Launch', icon: Eye }
];

export function StoreLaunchWizard({ onClose }: { onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [storeData, setStoreData] = useState<StoreData>({
    name: '',
    description: '',
    subdomain: '',
    theme: 'modern',
    primaryColor: '#3b82f6',
    secondaryColor: '#1f2937',
    currency: 'USD',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    products: [],
    paymentMethods: {
      stripe: true,
      paypal: false,
      bankTransfer: false
    },
    shippingSettings: {
      freeShippingThreshold: 50,
      shippingRates: [
        { name: 'Standard Shipping', price: 5.99, estimatedDays: '5-7' },
        { name: 'Express Shipping', price: 14.99, estimatedDays: '2-3' }
      ]
    }
  });

  const createStoreMutation = useMutation({
    mutationFn: async (data: StoreData) => {
      const response = await apiRequest('POST', '/api/ecommerce/stores', {
        name: data.name,
        description: data.description,
        subdomain: data.subdomain,
        customDomain: data.customDomain,
        theme: data.theme,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        currency: data.currency,
        timezone: data.timezone,
        paymentMethods: data.paymentMethods,
        shippingSettings: data.shippingSettings,
        status: 'active',
        isPublic: true
      });
      return await response.json();
    },
    onSuccess: async (store: any) => {
      toast({
        title: "Store Created Successfully!",
        description: `Your store is live at ${storeData.subdomain}.argilette-store.com`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ecommerce/stores'] });
      
      // If products were added, create them using bulk endpoint
      if (storeData.products.length > 0) {
        try {
          const productsWithStore = storeData.products.map(product => ({
            ...product,
            storeId: store.id
          }));
          
          const bulkResponse = await apiRequest('POST', '/api/ecommerce/products/bulk', {
            products: productsWithStore
          });
          
          const bulkResult = await bulkResponse.json();
          
          toast({
            title: "Products Added!",
            description: `Successfully added ${bulkResult.created || storeData.products.length} products to your store`,
          });
          
          queryClient.invalidateQueries({ queryKey: ['/api/ecommerce/products'] });
        } catch (error) {
          console.error('Error creating products:', error);
          toast({
            title: "Product Creation Warning",
            description: "Store created but some products may not have been added",
            variant: "destructive"
          });
        }
      }
      
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Store",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    }
  });

  const generateAIContent = async (prompt: string, type: 'name' | 'description' | 'product') => {
    setIsGeneratingContent(true);
    try {
      const response = await apiRequest('POST', '/api/ai/generate-content', {
        prompt,
        type,
        context: { storeName: storeData.name, theme: storeData.theme }
      });
      const data = await response.json();
      setIsGeneratingContent(false);
      return data;
    } catch (error) {
      setIsGeneratingContent(false);
      toast({
        title: "AI Generation Failed",
        description: "Could not generate content. Please try manually.",
        variant: "destructive"
      });
      return null;
    }
  };

  const handleNext = () => {
    if (currentStep === 1 && (!storeData.name || !storeData.subdomain)) {
      toast({
        title: "Missing Information",
        description: "Please fill in store name and subdomain",
        variant: "destructive"
      });
      return;
    }
    
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      // Launch store
      createStoreMutation.mutate(storeData);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateStoreData = (updates: Partial<StoreData>) => {
    setStoreData({ ...storeData, ...updates });
  };

  const selectTheme = (theme: typeof THEMES[0]) => {
    updateStoreData({
      theme: theme.id,
      primaryColor: theme.colors.primary,
      secondaryColor: theme.colors.secondary
    });
  };

  const progress = (currentStep / 5) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full mb-4">
            <Zap className="h-4 w-4" />
            <span className="text-sm font-semibold">AI-Powered Store Creation</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Launch Your Store in Minutes
          </h1>
          <p className="text-gray-600">
            Follow our guided wizard to create a professional online store
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <Progress value={progress} className="h-2 mb-4" data-testid="progress-wizard" />
          <div className="flex justify-between">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;
              
              return (
                <div 
                  key={step.id}
                  className={`flex flex-col items-center gap-2 ${
                    isActive ? 'opacity-100' : isCompleted ? 'opacity-70' : 'opacity-40'
                  }`}
                  data-testid={`step-${step.id}`}
                >
                  <div className={`
                    h-12 w-12 rounded-full flex items-center justify-center
                    ${isActive ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 
                      isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}
                  `}>
                    {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className="text-xs font-medium text-center">{step.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <Card className="mb-6">
          <CardContent className="p-8">
            {/* Step 1: Store Basics */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Let's Start with the Basics</h2>
                  <p className="text-gray-600">Tell us about your store and we'll help you get started</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="storeName">Store Name *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="storeName"
                        placeholder="My Awesome Store"
                        value={storeData.name}
                        onChange={(e) => {
                          const name = e.target.value;
                          const subdomain = name.toLowerCase()
                            .replace(/[^a-z0-9]/g, '-')
                            .replace(/-+/g, '-')
                            .replace(/^-|-$/g, '');
                          updateStoreData({ name, subdomain });
                        }}
                        data-testid="input-store-name"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={async () => {
                          const content = await generateAIContent("Generate a creative store name for an e-commerce business", 'name');
                          if (content?.name) {
                            const subdomain = content.name.toLowerCase()
                              .replace(/[^a-z0-9]/g, '-')
                              .replace(/-+/g, '-')
                              .replace(/^-|-$/g, '');
                            updateStoreData({ name: content.name, subdomain });
                          }
                        }}
                        disabled={isGeneratingContent}
                        data-testid="button-ai-generate-name"
                      >
                        <Wand2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Use AI to generate a creative name</p>
                  </div>

                  <div>
                    <Label htmlFor="subdomain">Store URL *</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="subdomain"
                        placeholder="mystore"
                        value={storeData.subdomain}
                        onChange={(e) => updateStoreData({ 
                          subdomain: e.target.value.toLowerCase()
                            .replace(/[^a-z0-9-]/g, '')
                        })}
                        data-testid="input-subdomain"
                      />
                      <span className="text-gray-500">.argilette-store.com</span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Store Description</Label>
                    <div className="flex gap-2">
                      <Textarea
                        id="description"
                        placeholder="Describe what makes your store special..."
                        value={storeData.description}
                        onChange={(e) => updateStoreData({ description: e.target.value })}
                        rows={4}
                        data-testid="input-description"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={async () => {
                        const content = await generateAIContent(
                          `Generate a compelling store description for ${storeData.name || 'an e-commerce store'}`,
                          'description'
                        );
                        if (content?.description) {
                          updateStoreData({ description: content.description });
                        }
                      }}
                      disabled={isGeneratingContent || !storeData.name}
                      data-testid="button-ai-generate-description"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      {isGeneratingContent ? 'Generating...' : 'Generate with AI'}
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="currency">Currency</Label>
                      <Select
                        value={storeData.currency}
                        onValueChange={(value) => updateStoreData({ currency: value })}
                      >
                        <SelectTrigger id="currency" data-testid="select-currency">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map((curr) => (
                            <SelectItem key={curr.code} value={curr.code}>
                              {curr.code} - {curr.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="customDomain">Custom Domain (Optional)</Label>
                      <Input
                        id="customDomain"
                        placeholder="www.mystore.com"
                        value={storeData.customDomain || ''}
                        onChange={(e) => updateStoreData({ customDomain: e.target.value })}
                        data-testid="input-custom-domain"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Theme & Design */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Choose Your Store Theme</h2>
                  <p className="text-gray-600">Select a professional design that matches your brand</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {THEMES.map((theme) => (
                    <Card
                      key={theme.id}
                      className={`cursor-pointer transition-all hover-elevate ${
                        storeData.theme === theme.id 
                          ? 'ring-2 ring-blue-600 shadow-lg' 
                          : ''
                      }`}
                      onClick={() => selectTheme(theme)}
                      data-testid={`theme-${theme.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="aspect-video bg-gradient-to-br rounded-md mb-3 relative overflow-hidden" 
                             style={{ 
                               background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%)`
                             }}>
                          {storeData.theme === theme.id && (
                            <div className="absolute top-2 right-2 bg-white rounded-full p-1">
                              <Check className="h-4 w-4 text-blue-600" />
                            </div>
                          )}
                          <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-sm rounded p-2">
                            <div className="h-2 bg-gray-300 rounded mb-1 w-3/4"></div>
                            <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                        <h3 className="font-semibold mb-1">{theme.name}</h3>
                        <p className="text-xs text-gray-600">{theme.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-4">Customize Colors</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="primaryColor">Primary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="primaryColor"
                          type="color"
                          value={storeData.primaryColor}
                          onChange={(e) => updateStoreData({ primaryColor: e.target.value })}
                          className="w-20 h-10"
                          data-testid="input-primary-color"
                        />
                        <Input
                          value={storeData.primaryColor}
                          onChange={(e) => updateStoreData({ primaryColor: e.target.value })}
                          placeholder="#3b82f6"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="secondaryColor">Secondary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="secondaryColor"
                          type="color"
                          value={storeData.secondaryColor}
                          onChange={(e) => updateStoreData({ secondaryColor: e.target.value })}
                          className="w-20 h-10"
                          data-testid="input-secondary-color"
                        />
                        <Input
                          value={storeData.secondaryColor}
                          onChange={(e) => updateStoreData({ secondaryColor: e.target.value })}
                          placeholder="#1f2937"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Products */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Add Your Products</h2>
                  <p className="text-gray-600">Import products or add them manually</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Card className="cursor-pointer hover-elevate" data-testid="button-add-manual">
                    <CardContent className="p-6 text-center">
                      <Package className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                      <h3 className="font-semibold mb-2">Add Manually</h3>
                      <p className="text-sm text-gray-600 mb-4">Create products one by one with AI assistance</p>
                      <Button variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Products
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover-elevate" data-testid="button-import-bulk">
                    <CardContent className="p-6 text-center">
                      <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-purple-600" />
                      <h3 className="font-semibold mb-2">Import from File</h3>
                      <p className="text-sm text-gray-600 mb-4">Upload Excel or CSV file with products</p>
                      <Button variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        Import File
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {storeData.products.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Added Products ({storeData.products.length})</h3>
                    <div className="space-y-2">
                      {storeData.products.map((product, index) => (
                        <Card key={index}>
                          <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 bg-gray-100 rounded flex items-center justify-center">
                                <Package className="h-6 w-6 text-gray-400" />
                              </div>
                              <div>
                                <h4 className="font-medium">{product.name}</h4>
                                <p className="text-sm text-gray-600">${product.price}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              Edit
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <Sparkles className="h-4 w-4 inline mr-2" />
                    <strong>Pro Tip:</strong> You can skip this step and add products later from your dashboard
                  </p>
                </div>
              </div>
            )}

            {/* Step 4: Payment & Shipping */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Payment & Shipping Setup</h2>
                  <p className="text-gray-600">Configure how you'll get paid and ship products</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Payment Methods</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium">Stripe</p>
                          <p className="text-sm text-gray-600">Accept credit cards and digital wallets</p>
                        </div>
                      </div>
                      <Switch
                        checked={storeData.paymentMethods.stripe}
                        onCheckedChange={(checked) => 
                          updateStoreData({ 
                            paymentMethods: { ...storeData.paymentMethods, stripe: checked }
                          })
                        }
                        data-testid="switch-stripe"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-5 w-5 text-purple-600" />
                        <div>
                          <p className="font-medium">PayPal</p>
                          <p className="text-sm text-gray-600">Popular payment platform</p>
                        </div>
                      </div>
                      <Switch
                        checked={storeData.paymentMethods.paypal}
                        onCheckedChange={(checked) => 
                          updateStoreData({ 
                            paymentMethods: { ...storeData.paymentMethods, paypal: checked }
                          })
                        }
                        data-testid="switch-paypal"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Truck className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium">Bank Transfer</p>
                          <p className="text-sm text-gray-600">Direct bank deposits</p>
                        </div>
                      </div>
                      <Switch
                        checked={storeData.paymentMethods.bankTransfer}
                        onCheckedChange={(checked) => 
                          updateStoreData({ 
                            paymentMethods: { ...storeData.paymentMethods, bankTransfer: checked }
                          })
                        }
                        data-testid="switch-bank-transfer"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-3">Shipping Options</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="freeShipping">Free Shipping Threshold ($)</Label>
                      <Input
                        id="freeShipping"
                        type="number"
                        value={storeData.shippingSettings.freeShippingThreshold}
                        onChange={(e) => 
                          updateStoreData({
                            shippingSettings: {
                              ...storeData.shippingSettings,
                              freeShippingThreshold: parseFloat(e.target.value) || 0
                            }
                          })
                        }
                        placeholder="50"
                        data-testid="input-free-shipping"
                      />
                      <p className="text-sm text-gray-500 mt-1">Offer free shipping above this amount</p>
                    </div>

                    {storeData.shippingSettings.shippingRates?.map((rate, index) => (
                      <div key={index} className="flex gap-3 items-end">
                        <div className="flex-1">
                          <Label>Shipping Option</Label>
                          <Input value={rate.name} disabled />
                        </div>
                        <div className="w-24">
                          <Label>Price ($)</Label>
                          <Input value={rate.price} disabled />
                        </div>
                        <div className="w-32">
                          <Label>Delivery</Label>
                          <Input value={rate.estimatedDays} disabled />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Review & Launch */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Review Your Store</h2>
                  <p className="text-gray-600">Everything looks good? Let's launch your store!</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Store className="h-5 w-5" />
                      Store Details
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">{storeData.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">URL:</span>
                        <span className="font-medium text-blue-600">
                          {storeData.subdomain}.argilette-store.com
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Theme:</span>
                        <span className="font-medium capitalize">{storeData.theme}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Currency:</span>
                        <span className="font-medium">{storeData.currency}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Configuration
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Methods:</span>
                        <span className="font-medium">
                          {Object.entries(storeData.paymentMethods).filter(([_, v]) => v).length} enabled
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Free Shipping:</span>
                        <span className="font-medium">
                          ${storeData.shippingSettings.freeShippingThreshold}+
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Products:</span>
                        <span className="font-medium">{storeData.products.length}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Automated Marketing Setup</h3>
                      <p className="text-sm text-gray-700 mb-3">
                        When you launch, we'll automatically:
                      </p>
                      <ul className="space-y-1 text-sm text-gray-700">
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          Generate SEO metadata for your store
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          Create social media announcement posts
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          Set up email welcome sequence
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          Submit your store to search engines
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Card className="border-2 border-dashed">
                  <CardContent className="p-8 text-center">
                    <Globe className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="font-semibold mb-2">Store Preview Coming Soon</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      See a live preview of your store before launching
                    </p>
                    <Button variant="outline" disabled>
                      <Eye className="h-4 w-4 mr-2" />
                      Preview Store
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? onClose : handleBack}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </Button>

          <div className="flex gap-2">
            {currentStep < 5 && (
              <Button
                variant="ghost"
                onClick={() => setCurrentStep(5)}
                data-testid="button-skip"
              >
                Skip to Review
              </Button>
            )}
            
            <Button
              onClick={handleNext}
              disabled={createStoreMutation.isPending}
              data-testid="button-next"
            >
              {createStoreMutation.isPending ? 'Creating...' : 
               currentStep === 5 ? 'Launch Store' : 'Continue'}
              {currentStep < 5 && <ArrowRight className="h-4 w-4 ml-2" />}
              {currentStep === 5 && <Zap className="h-4 w-4 ml-2" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
