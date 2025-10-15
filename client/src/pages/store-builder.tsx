import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Store, ShoppingCart, Users, BarChart3, Settings, Eye, Edit, Trash2, Package, DollarSign, Globe, Palette, Upload, Image, Share2, Facebook, Twitter, Instagram, Linkedin, Layout, Move, Activity, Zap } from "lucide-react";
import { SpreadsheetUpload } from "@/components/spreadsheet-upload";
import SmartPricingDashboard from "@/components/smart-pricing-dashboard";
import { SimpleStoreEditor } from "@/components/simple-store-editor";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CURRENCIES } from "@shared/currencies";

const createStoreSchema = z.object({
  name: z.string().min(1, "Store name is required"),
  description: z.string().optional(),
  subdomain: z.string().min(1, "Subdomain is required").regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens allowed"),
  primaryColor: z.string().default("#3b82f6"),
  secondaryColor: z.string().default("#1f2937"),
  currency: z.string().default("USD"),
  timezone: z.string().default("UTC")
});

const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  slug: z.string().min(1, "Product slug is required"),
  description: z.string().optional(),
  price: z.union([z.string(), z.number()]).transform((val) => String(val)),
  sku: z.string().optional(),
  inventoryQuantity: z.number().min(0, "Inventory must be 0 or greater").default(0),
  isActive: z.boolean().default(true),
  images: z.array(z.string()).default([])
});

type CreateStoreForm = z.infer<typeof createStoreSchema>;
type CreateProductForm = z.infer<typeof createProductSchema>;

export default function StoreBuilder() {
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [shareProduct, setShareProduct] = useState<{ product: any; store: any } | null>(null);
  const [spreadsheetUploadOpen, setSpreadsheetUploadOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: storesData, isLoading: storesLoading, error: storesError } = useQuery({
    queryKey: ["/api/ecommerce/stores"],
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  // Ensure stores is always an array
  const stores = Array.isArray(storesData) ? storesData : [];

  const createStoreMutation = useMutation({
    mutationFn: (data: CreateStoreForm) => apiRequest("POST", "/api/ecommerce/stores", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ecommerce/stores"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Store Created",
        description: "Your online store has been created successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create store",
        variant: "destructive",
      });
    }
  });

  const deleteStoreMutation = useMutation({
    mutationFn: (storeId: number) => apiRequest("DELETE", `/api/ecommerce/stores/${storeId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ecommerce/stores"] });
      toast({
        title: "Store Deleted",
        description: "Store has been deleted successfully",
      });
    }
  });

  const form = useForm<CreateStoreForm>({
    resolver: zodResolver(createStoreSchema),
    defaultValues: {
      name: "",
      description: "",
      subdomain: "",
      primaryColor: "#3b82f6",
      secondaryColor: "#1f2937",
      currency: "USD",
      timezone: "UTC"
    }
  });

  const onSubmit = (data: CreateStoreForm) => {
    createStoreMutation.mutate(data);
  };

  const handleDeleteStore = (storeId: number) => {
    if (confirm("Are you sure you want to delete this store? This action cannot be undone.")) {
      deleteStoreMutation.mutate(storeId);
    }
  };

  const toggleProductStatus = useMutation({
    mutationFn: async ({ storeId, productId, isActive }: { storeId: number; productId: number; isActive: boolean }) => {
      return apiRequest("PATCH", `/api/ecommerce/stores/${storeId}/products/${productId}`, { 
        isActive 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ecommerce/stores"] });
      toast({
        title: "Product Updated",
        description: "Product status has been updated successfully!"
      });
    },
    onError: (error) => {
      console.error("Error updating product status:", error);
      toast({
        title: "Error",
        description: "Failed to update product status. Please try again.",
        variant: "destructive"
      });
    }
  });

  const deleteProduct = useMutation({
    mutationFn: async ({ storeId, productId }: { storeId: number; productId: number }) => {
      return apiRequest("DELETE", `/api/ecommerce/stores/${storeId}/products/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ecommerce/stores"] });
      toast({
        title: "Product Deleted",
        description: "Product has been deleted successfully!"
      });
    },
    onError: (error) => {
      console.error("Error deleting product:", error);
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive"
      });
    }
  });

  if (storesLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-gray-900 dark:to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <Store className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  AI-Powered Store Builder
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-lg">
                  Create and manage your online stores with integrated payment processing and AI optimization
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                E-commerce Ready
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                Stripe Integration
              </Badge>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
                AI Optimized
              </Badge>
            </div>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="mt-4 sm:mt-0">
                <Plus className="w-5 h-5 mr-2" />
                Create New Store
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Store</DialogTitle>
                <DialogDescription>
                  Set up your new online store with Stripe payment integration
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Store Name</FormLabel>
                        <FormControl>
                          <Input placeholder="My Awesome Store" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="subdomain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subdomain</FormLabel>
                        <FormControl>
                          <div className="flex">
                            <Input placeholder="my-store" {...field} />
                            <span className="inline-flex items-center px-3 text-sm text-gray-500 bg-gray-50 border border-l-0 border-gray-300 rounded-r-md">
                              .argilette-store.com
                            </span>
                          </div>
                        </FormControl>
                        <FormDescription>
                          This will be your store's web address
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Brief description of your store..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="primaryColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Color</FormLabel>
                          <FormControl>
                            <div className="flex gap-2">
                              <Input type="color" className="w-12 h-10 p-1" {...field} />
                              <Input placeholder="#3b82f6" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select currency" />
                              </SelectTrigger>
                            </FormControl>
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
                                  {currency.code} - {currency.name}
                                </SelectItem>
                              ))}

                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <DialogFooter>
                    <Button type="submit" disabled={createStoreMutation.isPending}>
                      {createStoreMutation.isPending ? "Creating..." : "Create Store"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stores Grid */}
        {storesError && (
          <Card className="text-center py-12 border-red-200 bg-red-50">
            <CardContent>
              <p className="text-red-600">Error loading stores: {storesError.message}</p>
              <Button 
                onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/ecommerce/stores"] })}
                className="mt-4"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        )}
        
        {!storesError && storesLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading stores...</p>
          </div>
        )}
        
        {!storesError && !storesLoading && stores.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No stores yet
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Create your first online store to start selling products with integrated payment processing
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Store
              </Button>
            </CardContent>
          </Card>
        )}
        
        {!storesError && !storesLoading && stores.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.map((store: any) => (
              <StoreCard
                key={store.id}
                store={store}
                onDelete={handleDeleteStore}
                onSelect={setSelectedStore}
              />
            ))}
          </div>
        )}

        {/* Store Details Modal */}
        {selectedStore && (
          <>
            <StoreDetailsModal
              store={selectedStore}
              open={!!selectedStore}
              onOpenChange={(open) => !open && setSelectedStore(null)}
              toggleProductStatus={toggleProductStatus}
              setEditingProduct={setEditingProduct}
              deleteProduct={deleteProduct}
              setSpreadsheetUploadOpen={setSpreadsheetUploadOpen}
            />
            <ProductCreationModal 
              store={selectedStore}
            />
            <ProductEditModal 
              product={editingProduct}
              store={selectedStore}
              open={!!editingProduct}
              onOpenChange={(open) => !open && setEditingProduct(null)}
            />
            <SocialMediaShareModal 
              shareData={shareProduct}
              open={!!shareProduct}
              onOpenChange={(open) => !open && setShareProduct(null)}
            />
            <StoreSettingsDialogs store={selectedStore} />
            <SpreadsheetUpload 
              store={selectedStore}
              open={spreadsheetUploadOpen}
              onOpenChange={setSpreadsheetUploadOpen}
              onSuccess={() => {
                // Force refresh the products query when import completes
                queryClient.invalidateQueries({ queryKey: ["/api/ecommerce/stores", selectedStore.id, "products"] });
                queryClient.refetchQueries({ queryKey: ["/api/ecommerce/stores", selectedStore.id, "products"] });
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}

function StoreCard({ store, onDelete, onSelect }: { store: any; onDelete: (id: number) => void; onSelect: (store: any) => void; }) {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: store.primaryColor }}
            >
              {store.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <CardTitle className="text-lg">{store.name}</CardTitle>
              <CardDescription className="flex items-center gap-1">
                <Globe className="w-4 h-4" />
                {store.domain || `${store.subdomain}.argilette-store.com`}
              </CardDescription>
            </div>
          </div>
          
          <Badge variant={store.isActive ? "default" : "secondary"}>
            {store.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
            {store.description || "No description provided"}
          </p>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Currency:</span>
            <span className="font-medium">{store.currency}</span>
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onSelect(store)}
            >
              <Eye className="w-4 h-4 mr-1" />
              View
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const storeUrl = store.domain ? `https://${store.domain}` : `https://${store.subdomain}.argilette-store.com`;
                window.open(storeUrl, '_blank');
              }}
            >
              <Globe className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(store.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StoreDetailsModal({ store, open, onOpenChange, toggleProductStatus, setEditingProduct, deleteProduct, setSpreadsheetUploadOpen }: { 
  store: any; 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  toggleProductStatus: any;
  setEditingProduct: (product: any) => void;
  deleteProduct: any;
  setSpreadsheetUploadOpen: (open: boolean) => void;
}) {
  const [shareProduct, setShareProduct] = useState<{product: any, store: any} | null>(null);
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [isEditingTheme, setIsEditingTheme] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();



  const { data: analytics } = useQuery({
    queryKey: ["/api/ecommerce/stores", store.id, "analytics"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/ecommerce/stores/${store.id}/analytics`);
      return response.json();
    },
    enabled: open
  });

  const { data: products } = useQuery({
    queryKey: ["/api/ecommerce/stores", store.id, "products"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/ecommerce/stores/${store.id}/products`);
      return response.json();
    },
    enabled: open
  });

  const { data: orders } = useQuery({
    queryKey: ["/api/ecommerce/stores", store.id, "orders"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/ecommerce/stores/${store.id}/orders`);
      return response.json();
    },
    enabled: open
  });



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: store.primaryColor }}
            >
              {store.name.charAt(0).toUpperCase()}
            </div>
            {store.name}
          </DialogTitle>
          <DialogDescription>
            Store management and analytics dashboard
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="pricing">
              <Zap className="w-4 h-4 mr-1" />
              Pricing
            </TabsTrigger>
            <TabsTrigger value="layout">Layout</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Revenue</p>
                      <p className="text-xl font-bold">${analytics?.totalRevenue?.toFixed(2) || '0.00'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Orders</p>
                      <p className="text-xl font-bold">{analytics?.totalOrders || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Products</p>
                      <p className="text-xl font-bold">{analytics?.totalProducts || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="text-sm text-gray-600">Customers</p>
                      <p className="text-xl font-bold">{analytics?.totalCustomers || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Store Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Domain:</span>
                    <span className="font-medium">{store.domain}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subdomain:</span>
                    <span className="font-medium">{store.subdomain}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Currency:</span>
                    <span className="font-medium">{store.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <Badge variant={store.isActive ? "default" : "secondary"}>
                      {store.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Order Value:</span>
                    <span className="font-medium">${analytics?.averageOrderValue?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Revenue:</span>
                    <span className="font-medium">${analytics?.monthlyRevenue?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Conversion Rate:</span>
                    <span className="font-medium">{analytics?.conversionRate?.toFixed(1) || '0.0'}%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Products</h3>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setSpreadsheetUploadOpen(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Spreadsheet
                </Button>
                <Button onClick={() => setProductDialogOpenGlobal?.(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </div>
            </div>
            
            {!products || products.length === 0 ? (
              <Card className="text-center py-8">
                <CardContent>
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No products added yet</p>
                  <Button className="mt-4" onClick={() => setProductDialogOpenGlobal?.(true)}>Add Your First Product</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {products.map((product: any) => (
                  <Card key={product.id}>
                    <CardContent className="p-4">
                      <div className="flex gap-4 items-start">
                        {product.images && product.images.length > 0 ? (
                          <img 
                            src={product.images[0]} 
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded-md border flex-shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 rounded-md border flex items-center justify-center flex-shrink-0">
                            <Image className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-medium">{product.name}</h4>
                              <p className="text-sm text-gray-600">{product.description}</p>
                              <p className="text-lg font-bold text-green-600">${product.price}</p>
                              {product.images && product.images.length > 1 && (
                                <p className="text-xs text-gray-500">+{product.images.length - 1} more images</p>
                              )}
                            </div>
                            <Badge variant={product.isActive ? "default" : "secondary"}>
                              {product.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant={product.isActive ? "destructive" : "default"}
                              onClick={() => toggleProductStatus.mutate({ storeId: store.id, productId: product.id, isActive: !product.isActive })}
                              disabled={toggleProductStatus.isPending}
                              className="h-7 text-xs"
                            >
                              {toggleProductStatus.isPending ? "..." : (product.isActive ? "Deactivate" : "Activate")}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => setEditingProduct(product)}
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => setShareProduct({ product, store })}
                            >
                              <Share2 className="w-3 h-3 mr-1" />
                              Share
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-7 text-xs"
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
                                  deleteProduct.mutate({ storeId: store.id, productId: product.id });
                                }
                              }}
                              disabled={deleteProduct.isPending}
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              {deleteProduct.isPending ? "..." : "Delete"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <h3 className="text-lg font-semibold">Recent Orders</h3>
            
            {!orders || orders.length === 0 ? (
              <Card className="text-center py-8">
                <CardContent>
                  <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No orders yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {orders.map((order: any) => (
                  <Card key={order.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">Order #{order.orderNumber}</h4>
                          <p className="text-sm text-gray-600">{order.customerName} - {order.customerEmail}</p>
                          <p className="text-lg font-bold">${order.totalAmount}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={
                            order.status === 'delivered' ? "default" :
                            order.status === 'shipped' ? "secondary" :
                            order.status === 'processing' ? "outline" : "destructive"
                          }>
                            {order.status}
                          </Badge>
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pricing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Smart Pricing</CardTitle>
                <CardDescription>AI-powered pricing optimization</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Pricing optimization features will be available soon.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="layout" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Layout Builder</CardTitle>
                <CardDescription>Drag and drop store layout customization</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Layout builder features will be available soon.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Heatmap</CardTitle>
                <CardDescription>Visual inventory management</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Inventory visualization features will be available soon.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Store Settings
                </CardTitle>
                <CardDescription>
                  Configure your store details and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleStoreEditor store={store} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        

      </DialogContent>
    </Dialog>
  );
}

// Global state for product dialog
let isProductDialogOpen = false;
let setProductDialogOpenGlobal: (open: boolean) => void;

function ProductCreationModal({ store }: { store: any }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Set global reference for opening dialog
  useEffect(() => {
    setProductDialogOpenGlobal = setOpen;
    isProductDialogOpen = open;
  }, [open]);

  const createProductMutation = useMutation({
    mutationFn: (data: CreateProductForm) => 
      apiRequest("POST", `/api/ecommerce/stores/${store.id}/products`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ecommerce/stores", store.id, "products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ecommerce/stores", store.id, "analytics"] });
      setOpen(false);
      productForm.reset();
      toast({
        title: "Product Created",
        description: "Your product has been added to the store successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create product",
        variant: "destructive",
      });
    }
  });

  const productForm = useForm<CreateProductForm>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      price: "",
      sku: "",
      inventoryQuantity: 0,
      isActive: true,
      images: []
    }
  });

  const onProductSubmit = (data: CreateProductForm) => {
    createProductMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Create a new product for {store.name}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...productForm}>
          <form onSubmit={productForm.handleSubmit(onProductSubmit)} className="space-y-4">
            <FormField
              control={productForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter product name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={productForm.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="product-slug" {...field} />
                  </FormControl>
                  <FormDescription>
                    URL-friendly version of the product name
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={productForm.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Product description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={productForm.control}
              name="images"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Images</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      {field.value && field.value.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {field.value.map((imageUrl: string, index: number) => (
                            <div key={index} className="relative">
                              <img 
                                src={imageUrl} 
                                alt={`Product image ${index + 1}`} 
                                className="w-full h-24 object-cover rounded-md border"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-1 right-1 h-6 w-6 p-0"
                                onClick={() => {
                                  const newImages = field.value.filter((_: string, i: number) => i !== index);
                                  field.onChange(newImages);
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : null}
                      
                      <div 
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (e) => {
                                const dataUrl = e.target?.result as string;
                                const currentImages = field.value || [];
                                field.onChange([...currentImages, dataUrl]);
                              };
                              reader.readAsDataURL(file);
                            }
                          };
                          input.click();
                        }}
                        className="w-full h-24 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
                      >
                        <div className="text-center">
                          <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                          <p className="text-xs text-gray-600">Add image</p>
                        </div>
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Upload product images to showcase your item (supports multiple images)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={productForm.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input placeholder="0.00" type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={productForm.control}
                name="inventoryQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inventory</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="0" 
                        type="number" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={productForm.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="PROD-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" disabled={createProductMutation.isPending}>
                  {createProductMutation.isPending ? "Creating..." : "Create Product"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    );
  }

function ProductEditModal({ product, store, open, onOpenChange }: { 
  product: any; 
  store: any; 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateProductMutation = useMutation({
    mutationFn: (data: CreateProductForm) => 
      apiRequest("PATCH", `/api/ecommerce/stores/${store.id}/products/${product?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ecommerce/stores", store.id, "products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ecommerce/stores", store.id, "analytics"] });
      toast({
        title: "Product Updated",
        description: "Product has been updated successfully!"
      });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Error updating product:", error);
      toast({
        title: "Error",
        description: "Failed to update product. Please try again.",
        variant: "destructive"
      });
    }
  });

  const editForm = useForm<CreateProductForm>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: product?.name || "",
      slug: product?.slug || "",
      description: product?.description || "",
      price: product?.price || "",
      sku: product?.sku || "",
      inventoryQuantity: product?.inventoryQuantity || 0,
      isActive: product?.isActive || true,
      images: product?.images || []
    }
  });

  // Reset form when product changes
  React.useEffect(() => {
    if (product) {
      editForm.reset({
        name: product.name || "",
        slug: product.slug || "",
        description: product.description || "",
        price: product.price || "",
        sku: product.sku || "",
        inventoryQuantity: product.inventoryQuantity || 0,
        isActive: product.isActive || true,
        images: product.images || []
      });
    }
  }, [product, editForm]);

  const onEditSubmit = (data: CreateProductForm) => {
    updateProductMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>
            Update product details for {store?.name}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...editForm}>
          <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
            <FormField
              control={editForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter product name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={editForm.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="product-slug" {...field} />
                  </FormControl>
                  <FormDescription>
                    URL-friendly version of the product name
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={editForm.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Product description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={editForm.control}
              name="images"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Images</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      {field.value && field.value.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {field.value.map((imageUrl: string, index: number) => (
                            <div key={index} className="relative">
                              <img 
                                src={imageUrl} 
                                alt={`Product image ${index + 1}`} 
                                className="w-full h-24 object-cover rounded-md border"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-1 right-1 h-6 w-6 p-0"
                                onClick={() => {
                                  const newImages = field.value.filter((_: string, i: number) => i !== index);
                                  field.onChange(newImages);
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : null}
                      
                      <div 
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (e) => {
                                const dataUrl = e.target?.result as string;
                                const currentImages = field.value || [];
                                field.onChange([...currentImages, dataUrl]);
                              };
                              reader.readAsDataURL(file);
                            }
                          };
                          input.click();
                        }}
                        className="w-full h-24 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
                      >
                        <div className="text-center">
                          <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                          <p className="text-xs text-gray-600">Add image</p>
                        </div>
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Upload product images to showcase your item
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={editForm.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input placeholder="0.00" type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="inventoryQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inventory</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="0" 
                        type="number" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={editForm.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="PROD-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
              
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateProductMutation.isPending}>
                {updateProductMutation.isPending ? "Updating..." : "Update Product"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function SocialMediaShareModal({ shareData, open, onOpenChange }: { 
  shareData: { product: any; store: any } | null; 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
}) {
  const { toast } = useToast();
  
  if (!shareData) return null;
  
  const { product, store } = shareData;
  
  const generateShareContent = (platform: string) => {
    const baseUrl = `https://${store.domain || `${store.subdomain}.store.com`}`;
    const productUrl = `${baseUrl}/products/${product.slug}`;
    
    const content = {
      facebook: {
        url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`,
        title: `Check out ${product.name} at ${store.name}`,
        description: product.description || `Amazing ${product.name} available now at ${store.name}!`
      },
      twitter: {
        url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`🔥 Just discovered ${product.name} at ${store.name}! ${product.description?.substring(0, 100) || 'Check it out!'} ${productUrl}`)}`,
        title: `Share ${product.name} on Twitter`,
        description: `Tweet about ${product.name}`
      },
      linkedin: {
        url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(productUrl)}`,
        title: `Share ${product.name} on LinkedIn`,
        description: `Professional networking share for ${product.name}`
      },
      instagram: {
        url: productUrl,
        title: `Share ${product.name} on Instagram`,
        description: `Copy link to share on Instagram Stories or posts`
      }
    };
    
    return content[platform as keyof typeof content] || content.facebook;
  };
  
  const handleShare = (platform: string) => {
    const shareContent = generateShareContent(platform);
    
    if (platform === 'instagram') {
      navigator.clipboard.writeText(shareContent.url).then(() => {
        toast({
          title: "Link Copied!",
          description: "Product link copied to clipboard. You can now paste it in Instagram!"
        });
      });
    } else {
      const width = 600;
      const height = 400;
      const left = (window.innerWidth - width) / 2;
      const top = (window.innerHeight - height) / 2;
      
      window.open(
        shareContent.url,
        'share-window',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );
      
      toast({
        title: "Sharing Opened",
        description: `${platform.charAt(0).toUpperCase() + platform.slice(1)} sharing window opened!`
      });
    }
  };
  
  const copyProductLink = () => {
    const baseUrl = `https://${store.domain || `${store.subdomain}.store.com`}`;
    const linkUrl = `${baseUrl}/products/${product.slug}`;
    
    navigator.clipboard.writeText(linkUrl).then(() => {
      toast({
        title: "Link Copied!",
        description: "Product link copied to clipboard!"
      });
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Product
          </DialogTitle>
          <DialogDescription>
            Share {product.name} from {store.name} on social media
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Product Preview */}
          <div className="flex gap-3 p-3 border rounded-lg bg-gray-50">
            {product.images?.[0] && (
              <img 
                src={product.images[0]} 
                alt={product.name} 
                className="w-16 h-16 object-cover rounded-md"
              />
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-sm">{product.name}</h3>
              <p className="text-sm text-gray-600 line-clamp-2">
                {product.description || "No description available"}
              </p>
              <p className="text-sm font-medium text-green-600">
                {store.currency} {product.price}
              </p>
            </div>
          </div>
          
          {/* Social Media Buttons */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Share on social media:</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="flex items-center gap-2 h-12"
                onClick={() => handleShare('facebook')}
              >
                <Facebook className="w-4 h-4 text-blue-600" />
                Facebook
              </Button>
              
              <Button
                variant="outline"
                className="flex items-center gap-2 h-12"
                onClick={() => handleShare('twitter')}
              >
                <Twitter className="w-4 h-4 text-blue-400" />
                Twitter
              </Button>
              
              <Button
                variant="outline"
                className="flex items-center gap-2 h-12"
                onClick={() => handleShare('linkedin')}
              >
                <Linkedin className="w-4 h-4 text-blue-700" />
                LinkedIn
              </Button>
              
              <Button
                variant="outline"
                className="flex items-center gap-2 h-12"
                onClick={() => handleShare('instagram')}
              >
                <Instagram className="w-4 h-4 text-pink-600" />
                Instagram
              </Button>
            </div>
          </div>
          
          {/* Direct Link Sharing */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Or copy direct link:</h4>
            <div className="flex gap-2">
              <Input 
                readOnly 
                value={`https://${store.domain || `${store.subdomain}.store.com`}/products/${product.slug}`}
                className="text-sm"
              />
              <Button onClick={copyProductLink} variant="outline">
                Copy
              </Button>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StoreSettingsDialogs({ store }: { store: any }) {
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [isCustomizingTheme, setIsCustomizingTheme] = useState(false);
  const { toast } = useToast();

  // Set global references for opening dialogs
  useEffect(() => {
    (window as any).openStoreSettings = () => setIsEditingSettings(true);
    (window as any).openThemeCustomizer = () => setIsCustomizingTheme(true);
  }, []);

  return (
    <>
      {/* Store Settings Edit Dialog */}
      <Dialog open={isEditingSettings} onOpenChange={setIsEditingSettings}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Store Settings</DialogTitle>
            <DialogDescription>
              Update your store configuration and details
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Store Name</label>
              <Input defaultValue={store.name} className="mt-1" />
            </div>
            
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea defaultValue={store.description} className="mt-1" />
            </div>
            
            <div>
              <label className="text-sm font-medium">Store URL</label>
              <Input defaultValue={store.subdomain} className="mt-1" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Currency</label>
                <select className="w-full p-2 border rounded mt-1">
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                  <option value="CAD">CAD (C$) - Canadian Dollar</option>
                  <option value="AUD">AUD (A$) - Australian Dollar</option>
                  <option value="JPY">JPY (¥) - Japanese Yen</option>
                  <option value="CNY">CNY (¥) - Chinese Yuan</option>
                  <option value="CHF">CHF - Swiss Franc</option>
                  
                  <optgroup label="African Currencies">
                    <option value="DZD">DZD (د.ج) - Algerian Dinar</option>
                    <option value="AOA">AOA (Kz) - Angolan Kwanza</option>
                    <option value="BWP">BWP (P) - Botswana Pula</option>
                    <option value="BIF">BIF (FBu) - Burundian Franc</option>
                    <option value="CVE">CVE ($) - Cape Verdean Escudo</option>
                    <option value="XAF">XAF (FCFA) - Central African CFA Franc</option>
                    <option value="KMF">KMF (CF) - Comorian Franc</option>
                    <option value="CDF">CDF (FC) - Congolese Franc</option>
                    <option value="DJF">DJF (Fdj) - Djiboutian Franc</option>
                    <option value="EGP">EGP (E£) - Egyptian Pound</option>
                    <option value="ERN">ERN (Nfk) - Eritrean Nakfa</option>
                    <option value="SZL">SZL (L) - Eswatini Lilangeni</option>
                    <option value="ETB">ETB (Br) - Ethiopian Birr</option>
                    <option value="GMD">GMD (D) - Gambian Dalasi</option>
                    <option value="GHS">GHS (₵) - Ghanaian Cedi</option>
                    <option value="GNF">GNF (FG) - Guinean Franc</option>
                    <option value="KES">KES (KSh) - Kenyan Shilling</option>
                    <option value="LSL">LSL (L) - Lesotho Loti</option>
                    <option value="LRD">LRD (L$) - Liberian Dollar</option>
                    <option value="LYD">LYD (ل.د) - Libyan Dinar</option>
                    <option value="MGA">MGA (Ar) - Malagasy Ariary</option>
                    <option value="MWK">MWK (MK) - Malawian Kwacha</option>
                    <option value="MRU">MRU (UM) - Mauritanian Ouguiya</option>
                    <option value="MUR">MUR (₨) - Mauritian Rupee</option>
                    <option value="MAD">MAD (د.م.) - Moroccan Dirham</option>
                    <option value="MZN">MZN (MT) - Mozambican Metical</option>
                    <option value="NAD">NAD (N$) - Namibian Dollar</option>
                    <option value="NGN">NGN (₦) - Nigerian Naira</option>
                    <option value="RWF">RWF (RF) - Rwandan Franc</option>
                    <option value="STN">STN (Db) - São Tomé and Príncipe Dobra</option>
                    <option value="SCR">SCR (₨) - Seychellois Rupee</option>
                    <option value="SLL">SLL (Le) - Sierra Leonean Leone</option>
                    <option value="SOS">SOS (S) - Somali Shilling</option>
                    <option value="ZAR">ZAR (R) - South African Rand</option>
                    <option value="SSP">SSP (£) - South Sudanese Pound</option>
                    <option value="SDG">SDG (ج.س.) - Sudanese Pound</option>
                    <option value="TZS">TZS (TSh) - Tanzanian Shilling</option>
                    <option value="TND">TND (د.ت) - Tunisian Dinar</option>
                    <option value="UGX">UGX (USh) - Ugandan Shilling</option>
                    <option value="XOF">XOF (CFA) - West African CFA Franc</option>
                    <option value="ZMW">ZMW (ZK) - Zambian Kwacha</option>
                    <option value="ZWL">ZWL (Z$) - Zimbabwean Dollar</option>
                  </optgroup>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Status</label>
                <select className="w-full p-2 border rounded mt-1">
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingSettings(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast({ title: "Settings Updated", description: "Store settings have been saved successfully!" });
              setIsEditingSettings(false);
            }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Theme Customization Dialog */}
      <Dialog open={isCustomizingTheme} onOpenChange={setIsCustomizingTheme}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Customize Theme</DialogTitle>
            <DialogDescription>
              Personalize your store's appearance and colors
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Primary Color</label>
              <div className="flex gap-2 mt-1">
                <input 
                  type="color" 
                  defaultValue={store.primaryColor} 
                  className="w-12 h-10 border rounded cursor-pointer"
                />
                <Input defaultValue={store.primaryColor} placeholder="#3B82F6" />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Secondary Color</label>
              <div className="flex gap-2 mt-1">
                <input 
                  type="color" 
                  defaultValue={store.secondaryColor} 
                  className="w-12 h-10 border rounded cursor-pointer"
                />
                <Input defaultValue={store.secondaryColor} placeholder="#10B981" />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Theme Style</label>
              <select className="w-full p-2 border rounded mt-1">
                <option value="modern">Modern</option>
                <option value="classic">Classic</option>
                <option value="minimal">Minimal</option>
                <option value="bold">Bold</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Layout</label>
              <select className="w-full p-2 border rounded mt-1">
                <option value="grid">Grid Layout</option>
                <option value="list">List Layout</option>
                <option value="masonry">Masonry Layout</option>
              </select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCustomizingTheme(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast({ title: "Theme Updated", description: "Your store theme has been customized successfully!" });
              setIsCustomizingTheme(false);
            }}>
              Apply Theme
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Drag and Drop Layout Builder Component
function DragDropLayoutBuilder({ store }: { store: any }) {
  const { toast } = useToast();
  
  const defaultLayout = [
    { id: 'header', type: 'header', content: 'Store Header', x: 0, y: 0, width: 12, height: 2 },
    { id: 'hero', type: 'hero', content: 'Hero Section', x: 0, y: 2, width: 12, height: 4 },
    { id: 'products', type: 'products', content: 'Product Grid', x: 0, y: 6, width: 8, height: 6 },
    { id: 'sidebar', type: 'sidebar', content: 'Sidebar', x: 8, y: 6, width: 4, height: 6 },
    { id: 'footer', type: 'footer', content: 'Footer', x: 0, y: 12, width: 12, height: 2 }
  ];

  const [layoutElements, setLayoutElements] = useState(() => {
    const savedLayout = localStorage.getItem(`store-layout-${store.id}`);
    return savedLayout ? JSON.parse(savedLayout) : defaultLayout;
  });

  const [isDragging, setIsDragging] = useState(false);
  const [draggedElement, setDraggedElement] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, elementId: string) => {
    setDraggedElement(elementId);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', elementId);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedElement(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedElement) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert pixel coordinates to grid coordinates
    const gridX = Math.round((x / rect.width) * 12);
    const gridY = Math.round(y / 40);

    const element = layoutElements.find(el => el.id === draggedElement);
    if (element) {
      handleElementMove(draggedElement, Math.max(0, Math.min(11, gridX)), Math.max(0, gridY));
      
      // Show success feedback
      toast({
        title: "Element Moved",
        description: `${element.content} repositioned to (${gridX}, ${gridY})`,
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleElementMove = (id: string, newX: number, newY: number) => {
    setLayoutElements(prev => prev.map(el => 
      el.id === id ? { ...el, x: Math.max(0, newX), y: Math.max(0, newY) } : el
    ));
  };

  const handleElementResize = (id: string, newWidth: number, newHeight: number) => {
    setLayoutElements(prev => prev.map(el => 
      el.id === id ? { 
        ...el, 
        width: Math.max(1, Math.min(12, newWidth)), 
        height: Math.max(1, newHeight) 
      } : el
    ));
  };

  const addNewElement = () => {
    const newElement = {
      id: `element-${Date.now()}`,
      type: 'custom',
      content: 'New Element',
      x: 0,
      y: Math.max(...layoutElements.map(el => el.y + el.height)) + 1,
      width: 6,
      height: 3
    };
    setLayoutElements(prev => [...prev, newElement]);
    toast({
      title: "Element Added",
      description: "New element added to the layout",
    });
  };

  const previewLayout = () => {
    const previewUrl = `https://${store.subdomain}.store.com/preview`;
    window.open(previewUrl, '_blank');
    toast({
      title: "Preview Opened",
      description: "Layout preview opened in new tab",
    });
  };

  const saveLayout = () => {
    // Here you would typically save to the backend
    localStorage.setItem(`store-layout-${store.id}`, JSON.stringify(layoutElements));
    toast({
      title: "Layout Saved",
      description: "Your store layout has been saved successfully",
    });
  };

  const resetLayout = () => {
    setLayoutElements(defaultLayout);
    localStorage.removeItem(`store-layout-${store.id}`);
    toast({
      title: "Layout Reset",
      description: "Layout has been reset to default configuration",
    });
  };

  const removeElement = (elementId: string) => {
    setLayoutElements(prev => prev.filter(el => el.id !== elementId));
    toast({
      title: "Element Removed",
      description: "Element has been removed from the layout",
    });
  };

  const getElementColor = (type: string) => {
    const colors: Record<string, string> = {
      header: '#3b82f6',
      hero: '#8b5cf6',
      products: '#10b981',
      sidebar: '#f59e0b',
      footer: '#6b7280',
      custom: '#ec4899'
    };
    return colors[type] || '#6b7280';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layout className="w-5 h-5" />
          Drag & Drop Layout Builder
        </CardTitle>
        <CardDescription>
          Design your store layout by dragging and dropping elements. Click and drag any colored block to move it to a new position.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Layout Grid */}
          <div 
            className={`relative border-2 border-dashed rounded-lg transition-colors ${
              isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
            }`}
            style={{ 
              height: '600px',
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 35px, #f3f4f6 35px, #f3f4f6 36px), repeating-linear-gradient(90deg, transparent, transparent calc(100%/12), #f3f4f6 calc(100%/12), #f3f4f6 calc(100%/12 + 1px))'
            }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={(e) => e.preventDefault()}
          >
            {layoutElements.map((element) => (
              <div
                key={element.id}
                className={`absolute border rounded cursor-move shadow-sm transition-all hover:shadow-md ${
                  draggedElement === element.id 
                    ? 'opacity-50 scale-105 border-blue-500 z-50' 
                    : 'border-gray-400 hover:border-blue-300'
                }`}
                style={{
                  left: `${(element.x / 12) * 100}%`,
                  top: `${element.y * 40}px`,
                  width: `${(element.width / 12) * 100}%`,
                  height: `${element.height * 40}px`,
                  backgroundColor: getElementColor(element.type),
                  color: 'white'
                }}
                draggable
                onDragStart={(e) => handleDragStart(e, element.id)}
                onDragEnd={handleDragEnd}
              >
                <div className="p-2 h-full flex items-center justify-center relative group">
                  <div className="text-center">
                    <Move className="w-4 h-4 mx-auto mb-1" />
                    <div className="text-sm font-medium">{element.content}</div>
                    <div className="text-xs opacity-75">
                      {element.width}x{element.height}
                    </div>
                  </div>
                  {element.type === 'custom' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeElement(element.id);
                      }}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Element Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Layout Elements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {layoutElements.map((element) => (
                  <div key={element.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: getElementColor(element.type) }}
                      />
                      <span className="text-sm font-medium">{element.content}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      ({element.x}, {element.y}) - {element.width}×{element.height}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={addNewElement}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Element
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={previewLayout}>
                  <Eye className="w-4 h-4 mr-2" />
                  Preview Layout
                </Button>
                <Button className="w-full justify-start" onClick={saveLayout}>
                  <Upload className="w-4 h-4 mr-2" />
                  Save Layout
                </Button>
                <Button variant="destructive" className="w-full justify-start" onClick={resetLayout}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Reset Layout
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Inventory Heatmap Component
function InventoryHeatmap({ store, products }: { store: any; products: any[] }) {
  const [viewMode, setViewMode] = useState<'grid' | 'chart'>('grid');

  const getInventoryStatus = (quantity: number) => {
    if (quantity === 0) return { status: 'out-of-stock', color: '#ef4444', label: 'Out of Stock' };
    if (quantity <= 5) return { status: 'low', color: '#f97316', label: 'Low Stock' };
    if (quantity <= 20) return { status: 'medium', color: '#eab308', label: 'Medium Stock' };
    return { status: 'high', color: '#22c55e', label: 'In Stock' };
  };

  const inventoryData = products?.map(product => ({
    ...product,
    inventoryStatus: getInventoryStatus(product.inventory || 0)
  })) || [];

  const statusCounts = inventoryData.reduce((acc, product) => {
    acc[product.inventoryStatus.status] = (acc[product.inventoryStatus.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Real-time Inventory Heatmap
        </CardTitle>
        <CardDescription>
          Visual overview of your inventory levels across all products
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* View Mode Toggle */}
          <div className="flex gap-2">
            <Button 
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              Grid View
            </Button>
            <Button 
              variant={viewMode === 'chart' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('chart')}
            >
              Chart View
            </Button>
          </div>

          {/* Inventory Status Legend */}
          <div className="flex flex-wrap gap-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm">In Stock ({statusCounts.high || 0})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-sm">Medium Stock ({statusCounts.medium || 0})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="text-sm">Low Stock ({statusCounts.low || 0})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm">Out of Stock ({statusCounts['out-of-stock'] || 0})</span>
            </div>
          </div>

          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {inventoryData.length === 0 ? (
                <div className="col-span-full text-center py-8 text-gray-500">
                  No products available
                </div>
              ) : (
                inventoryData.map((product) => (
                  <div
                    key={product.id}
                    className="relative p-3 rounded-lg border transition-all hover:shadow-md cursor-pointer"
                    style={{ backgroundColor: `${product.inventoryStatus.color}15` }}
                  >
                    <div 
                      className="absolute top-2 right-2 w-3 h-3 rounded-full"
                      style={{ backgroundColor: product.inventoryStatus.color }}
                    ></div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium truncate">{product.name}</h4>
                      <p className="text-xs text-gray-600">${product.price}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">Stock: {product.inventory || 0}</span>
                        <Badge 
                          variant="outline" 
                          className="text-xs"
                          style={{ 
                            borderColor: product.inventoryStatus.color,
                            color: product.inventoryStatus.color 
                          }}
                        >
                          {product.inventoryStatus.label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Chart View */}
          {viewMode === 'chart' && (
            <div className="space-y-4">
              <div className="h-64 border rounded-lg p-4 bg-gray-50">
                <div className="h-full flex items-end justify-around">
                  {Object.entries(statusCounts).map(([status, count]) => {
                    const statusInfo = getInventoryStatus(
                      status === 'high' ? 50 : 
                      status === 'medium' ? 15 : 
                      status === 'low' ? 3 : 0
                    );
                    const countValue = Number(count);
                    const maxCount = Math.max(...Object.values(statusCounts).map(c => Number(c)));
                    const height = Math.max(20, (countValue / maxCount) * 200);
                    
                    return (
                      <div key={status} className="flex flex-col items-center">
                        <div
                          className="w-12 rounded-t transition-all hover:opacity-75"
                          style={{ 
                            height: `${height}px`, 
                            backgroundColor: statusInfo.color 
                          }}
                        ></div>
                        <div className="mt-2 text-center">
                          <div className="text-lg font-bold">{countValue}</div>
                          <div className="text-xs text-gray-600 capitalize">
                            {status.replace('-', ' ')}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Detailed List */}
              <div className="space-y-2">
                <h4 className="font-medium">Detailed Inventory</h4>
                {inventoryData.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: product.inventoryStatus.color }}
                      ></div>
                      <span className="font-medium">{product.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">${product.price}</span>
                      <Badge variant="outline">
                        {product.inventory || 0} units
                      </Badge>
                      <span 
                        className="text-sm font-medium"
                        style={{ color: product.inventoryStatus.color }}
                      >
                        {product.inventoryStatus.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Store Settings Modal Component
function StoreSettingsModal({ store, open, onOpenChange, onSuccess }: { 
  store: any; 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: store?.name || "",
    description: store?.description || "",
    subdomain: store?.subdomain || "",
    currency: store?.currency || "USD",
    isActive: store?.isActive || true
  });

  const updateStoreMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/api/ecommerce/stores/${store.id}`, data),
    onSuccess: () => {
      onSuccess();
      onOpenChange(false);
      toast({
        title: "Store Updated",
        description: "Store settings have been saved successfully!"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update store",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreMutation.mutate(formData);
  };



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Store Settings</DialogTitle>
          <DialogDescription>
            Update your store configuration and details
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Store Name</label>
            <Input 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="mt-1" 
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="mt-1" 
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Store URL</label>
            <Input 
              value={formData.subdomain}
              onChange={(e) => setFormData({...formData, subdomain: e.target.value})}
              className="mt-1" 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Currency</label>
              <select 
                value={formData.currency}
                onChange={(e) => setFormData({...formData, currency: e.target.value})}
                className="w-full p-2 border rounded mt-1"
              >
                <option value="USD">USD ($) - US Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
                <option value="CAD">CAD (C$) - Canadian Dollar</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Status</label>
              <select 
                value={formData.isActive ? "active" : "inactive"}
                onChange={(e) => setFormData({...formData, isActive: e.target.value === "active"})}
                className="w-full p-2 border rounded mt-1"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateStoreMutation.isPending}>
              {updateStoreMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Theme Customizer Modal Component
function ThemeCustomizerModal({ store, open, onOpenChange, onSuccess }: { 
  store: any; 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [themeData, setThemeData] = useState({
    primaryColor: store?.primaryColor || "#3b82f6",
    secondaryColor: store?.secondaryColor || "#1f2937",
    themeStyle: "modern",
    layout: "grid"
  });

  const updateThemeMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/api/ecommerce/stores/${store.id}`, data),
    onSuccess: () => {
      onSuccess();
      onOpenChange(false);
      toast({
        title: "Theme Updated",
        description: "Your store theme has been customized successfully!"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update theme",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateThemeMutation.mutate(themeData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Customize Theme</DialogTitle>
          <DialogDescription>
            Personalize your store's appearance and colors
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Primary Color</label>
            <div className="flex gap-2 mt-1">
              <input 
                type="color" 
                value={themeData.primaryColor}
                onChange={(e) => setThemeData({...themeData, primaryColor: e.target.value})}
                className="w-12 h-10 border rounded cursor-pointer"
              />
              <Input 
                value={themeData.primaryColor}
                onChange={(e) => setThemeData({...themeData, primaryColor: e.target.value})}
                placeholder="#3B82F6" 
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">Secondary Color</label>
            <div className="flex gap-2 mt-1">
              <input 
                type="color" 
                value={themeData.secondaryColor}
                onChange={(e) => setThemeData({...themeData, secondaryColor: e.target.value})}
                className="w-12 h-10 border rounded cursor-pointer"
              />
              <Input 
                value={themeData.secondaryColor}
                onChange={(e) => setThemeData({...themeData, secondaryColor: e.target.value})}
                placeholder="#10B981" 
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">Theme Style</label>
            <select 
              value={themeData.themeStyle}
              onChange={(e) => setThemeData({...themeData, themeStyle: e.target.value})}
              className="w-full p-2 border rounded mt-1"
            >
              <option value="modern">Modern</option>
              <option value="classic">Classic</option>
              <option value="minimal">Minimal</option>
              <option value="bold">Bold</option>
            </select>
          </div>
          
          <div>
            <label className="text-sm font-medium">Layout</label>
            <select 
              value={themeData.layout}
              onChange={(e) => setThemeData({...themeData, layout: e.target.value})}
              className="w-full p-2 border rounded mt-1"
            >
              <option value="grid">Grid Layout</option>
              <option value="list">List Layout</option>
              <option value="masonry">Masonry Layout</option>
            </select>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateThemeMutation.isPending}>
              {updateThemeMutation.isPending ? "Applying..." : "Apply Theme"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

