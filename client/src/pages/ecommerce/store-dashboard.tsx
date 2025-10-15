import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Store, 
  Package, 
  ShoppingCart, 
  Users, 
  DollarSign,
  TrendingUp,
  Eye,
  Settings,
  Plus,
  ExternalLink,
  BarChart3,
  Globe,
  ShoppingBag,
  CreditCard
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Store creation form schema
const storeFormSchema = z.object({
  name: z.string().min(1, "Store name is required").max(50, "Store name must be less than 50 characters"),
  subdomain: z.string().min(1, "Subdomain is required").max(20, "Subdomain must be less than 20 characters")
    .regex(/^[a-z0-9-]+$/, "Subdomain can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  category: z.string().min(1, "Category is required"),
  currency: z.string().min(1, "Currency is required"),
});

type StoreFormData = z.infer<typeof storeFormSchema>;

export default function StoreDashboard() {
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch store data
  const { data: stores = [], isLoading: storesLoading } = useQuery<any[]>({
    queryKey: ["/api/stores"],
  });

  const { data: storeStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stores/stats", selectedStore],
    enabled: !!selectedStore,
  });

  // Form setup
  const form = useForm<StoreFormData>({
    resolver: zodResolver(storeFormSchema),
    defaultValues: {
      name: "",
      subdomain: "",
      description: "",
      category: "",
      currency: "USD",
    },
  });

  // Store creation mutation
  const createStoreMutation = useMutation({
    mutationFn: async (data: StoreFormData) => {
      // Add userId for the API requirement
      const storeData = {
        ...data,
        userId: localStorage.getItem('userEmail') || 'demo-user',
        tenantId: '00000000-0000-0000-0000-000000000001'
      };
      
      const response = await apiRequest("POST", "/api/stores", storeData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Store Created Successfully",
        description: `${data.name} has been created and is ready for setup.`,
      });
      setIsCreateDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      setSelectedStore(data.id);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Store",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleCreateStore = (data: StoreFormData) => {
    createStoreMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              E-commerce Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Manage your online stores, products, and orders
            </p>
          </div>
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
            >
              <BarChart3 size={16} />
              Analytics
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus size={16} />
                  Create Store
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Create New Store</DialogTitle>
                  <DialogDescription>
                    Set up your new e-commerce store. You can customize it further after creation.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleCreateStore)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              <Input placeholder="awesome-store" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Brief description of your store..." 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Store Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="fashion">Fashion & Apparel</SelectItem>
                                <SelectItem value="electronics">Electronics</SelectItem>
                                <SelectItem value="home">Home & Garden</SelectItem>
                                <SelectItem value="health">Health & Beauty</SelectItem>
                                <SelectItem value="sports">Sports & Outdoors</SelectItem>
                                <SelectItem value="books">Books & Media</SelectItem>
                                <SelectItem value="food">Food & Beverage</SelectItem>
                                <SelectItem value="jewelry">Jewelry & Accessories</SelectItem>
                                <SelectItem value="toys">Toys & Games</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
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
                                <SelectItem value="USD">USD - US Dollar</SelectItem>
                                <SelectItem value="EUR">EUR - Euro</SelectItem>
                                <SelectItem value="GBP">GBP - British Pound</SelectItem>
                                <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                                <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                                <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex gap-4 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsCreateDialogOpen(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createStoreMutation.isPending}
                        className="flex-1"
                      >
                        {createStoreMutation.isPending ? "Creating..." : "Create Store"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Store Selection */}
        {stores.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Your Stores</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {stores.map((store: any) => (
                <Card 
                  key={store.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedStore === store.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedStore(store.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <Store className="text-white" size={20} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{store.name}</h3>
                        <p className="text-sm text-gray-500">{store.subdomain}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <Badge variant={store.status === 'active' ? 'default' : 'secondary'}>
                        {store.status}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <ExternalLink size={14} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {stores.length === 0 && !storesLoading && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Store className="text-blue-600" size={40} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Create Your First Store
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Build a professional e-commerce store with our advanced platform. 
              Manage products, process orders, and grow your business.
            </p>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="flex items-center gap-2">
                  <Plus size={20} />
                  Get Started
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        )}

        {/* Store Dashboard Content */}
        {selectedStore && (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="customers">Customers</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Revenue Card */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Total Revenue
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold">$12,345</p>
                        <p className="text-sm text-green-600">+12.5% this month</p>
                      </div>
                      <DollarSign className="text-green-600" size={24} />
                    </div>
                  </CardContent>
                </Card>

                {/* Orders Card */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Orders
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold">156</p>
                        <p className="text-sm text-blue-600">+8 new today</p>
                      </div>
                      <ShoppingCart className="text-blue-600" size={24} />
                    </div>
                  </CardContent>
                </Card>

                {/* Products Card */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Products
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold">89</p>
                        <p className="text-sm text-purple-600">12 out of stock</p>
                      </div>
                      <Package className="text-purple-600" size={24} />
                    </div>
                  </CardContent>
                </Card>

                {/* Customers Card */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Customers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold">234</p>
                        <p className="text-sm text-orange-600">+15 this week</p>
                      </div>
                      <Users className="text-orange-600" size={24} />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Orders</CardTitle>
                    <CardDescription>Latest customer orders</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <ShoppingBag className="text-blue-600" size={16} />
                          </div>
                          <div>
                            <p className="font-medium">Order #ORD-00{i}23</p>
                            <p className="text-sm text-gray-500">Customer Name</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${(Math.random() * 200 + 50).toFixed(2)}</p>
                          <Badge variant="outline" className="text-xs">
                            Processing
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Products</CardTitle>
                    <CardDescription>Best selling products this month</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                          <div>
                            <p className="font-medium">Product Name {i}</p>
                            <p className="text-sm text-gray-500">{Math.floor(Math.random() * 50 + 10)} sold</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${(Math.random() * 100 + 20).toFixed(2)}</p>
                          <p className="text-sm text-green-600">
                            <TrendingUp className="inline" size={12} /> 12%
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="products">
              <ProductManagement />
            </TabsContent>

            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle>Orders</CardTitle>
                  <CardDescription>Manage customer orders</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <ShoppingCart className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-500">No orders yet. Orders will appear here once customers start shopping.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="customers">
              <Card>
                <CardHeader>
                  <CardTitle>Customers</CardTitle>
                  <CardDescription>Manage your customer base</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Users className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-500">No customers yet. Customer data will appear here once you have orders.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <AnalyticsTab />
            </TabsContent>

            <TabsContent value="settings">
              <StoreSettingsTab />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

// Product Management Component
function ProductManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  // Product creation form schema
  const productFormSchema = z.object({
    name: z.string().min(1, "Product name is required"),
    price: z.string().min(1, "Price is required"),
    description: z.string().optional(),
    category: z.string().min(1, "Category is required"),
    currency: z.string().min(1, "Currency is required"),
    images: z.array(z.string()).min(1, "At least 1 product image is required"),
  });

  type ProductFormData = z.infer<typeof productFormSchema>;

  // Form setup
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      price: "",
      description: "",
      category: "",
      currency: "USD",
      images: [],
    },
  });

  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  // Fetch products
  const { data: products = [], isLoading: productsLoading } = useQuery<any[]>({
    queryKey: ["/api/products"],
  });

  // Product creation mutation
  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const response = await apiRequest("POST", "/api/products", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Product Created Successfully",
        description: `${data.name} has been added to your catalog.`,
      });
      setIsCreateDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Product",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleCreateProduct = (data: ProductFormData) => {
    // Include uploaded images in the product data
    const productData = {
      ...data,
      images: uploadedImages.length > 0 ? uploadedImages : [
        'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&h=600&fit=crop'
      ]
    };
    createProductMutation.mutate(productData);
  };

  const addImageUrl = (url: string) => {
    if (url && uploadedImages.length < 10) {
      const newImages = [...uploadedImages, url];
      setUploadedImages(newImages);
      form.setValue('images', newImages);
    }
  };

  const removeImage = (index: number) => {
    const newImages = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(newImages);
    form.setValue('images', newImages);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Products</CardTitle>
            <CardDescription>Manage your product catalog</CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus size={16} />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Product</DialogTitle>
                <DialogDescription>
                  Add a new product to your store catalog.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreateProduct)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Premium Wireless Headphones" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price</FormLabel>
                            <FormControl>
                              <Input placeholder="99.99" {...field} />
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
                                  <SelectValue placeholder="Currency" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="max-h-40 overflow-y-auto">
                                {/* Americas */}
                                <SelectItem value="USD">🇺🇸 USD - US Dollar</SelectItem>
                                <SelectItem value="CAD">🇨🇦 CAD - Canadian Dollar</SelectItem>
                                <SelectItem value="MXN">🇲🇽 MXN - Mexican Peso</SelectItem>
                                <SelectItem value="BRL">🇧🇷 BRL - Brazilian Real</SelectItem>
                                <SelectItem value="ARS">🇦🇷 ARS - Argentine Peso</SelectItem>
                                <SelectItem value="CLP">🇨🇱 CLP - Chilean Peso</SelectItem>
                                <SelectItem value="COP">🇨🇴 COP - Colombian Peso</SelectItem>
                                <SelectItem value="PEN">🇵🇪 PEN - Peruvian Sol</SelectItem>
                                
                                {/* Europe */}
                                <SelectItem value="EUR">🇪🇺 EUR - Euro</SelectItem>
                                <SelectItem value="GBP">🇬🇧 GBP - British Pound</SelectItem>
                                <SelectItem value="CHF">🇨🇭 CHF - Swiss Franc</SelectItem>
                                <SelectItem value="SEK">🇸🇪 SEK - Swedish Krona</SelectItem>
                                <SelectItem value="NOK">🇳🇴 NOK - Norwegian Krone</SelectItem>
                                <SelectItem value="DKK">🇩🇰 DKK - Danish Krone</SelectItem>
                                <SelectItem value="PLN">🇵🇱 PLN - Polish Złoty</SelectItem>
                                <SelectItem value="CZK">🇨🇿 CZK - Czech Koruna</SelectItem>
                                <SelectItem value="HUF">🇭🇺 HUF - Hungarian Forint</SelectItem>
                                <SelectItem value="RON">🇷🇴 RON - Romanian Leu</SelectItem>
                                <SelectItem value="BGN">🇧🇬 BGN - Bulgarian Lev</SelectItem>
                                <SelectItem value="HRK">🇭🇷 HRK - Croatian Kuna</SelectItem>
                                
                                {/* Asia-Pacific */}
                                <SelectItem value="JPY">🇯🇵 JPY - Japanese Yen</SelectItem>
                                <SelectItem value="CNY">🇨🇳 CNY - Chinese Yuan</SelectItem>
                                <SelectItem value="KRW">🇰🇷 KRW - South Korean Won</SelectItem>
                                <SelectItem value="INR">🇮🇳 INR - Indian Rupee</SelectItem>
                                <SelectItem value="AUD">🇦🇺 AUD - Australian Dollar</SelectItem>
                                <SelectItem value="NZD">🇳🇿 NZD - New Zealand Dollar</SelectItem>
                                <SelectItem value="SGD">🇸🇬 SGD - Singapore Dollar</SelectItem>
                                <SelectItem value="HKD">🇭🇰 HKD - Hong Kong Dollar</SelectItem>
                                <SelectItem value="TWD">🇹🇼 TWD - Taiwan Dollar</SelectItem>
                                <SelectItem value="THB">🇹🇭 THB - Thai Baht</SelectItem>
                                <SelectItem value="MYR">🇲🇾 MYR - Malaysian Ringgit</SelectItem>
                                <SelectItem value="IDR">🇮🇩 IDR - Indonesian Rupiah</SelectItem>
                                <SelectItem value="PHP">🇵🇭 PHP - Philippine Peso</SelectItem>
                                <SelectItem value="VND">🇻🇳 VND - Vietnamese Dong</SelectItem>
                                
                                {/* Middle East */}
                                <SelectItem value="AED">🇦🇪 AED - UAE Dirham</SelectItem>
                                <SelectItem value="SAR">🇸🇦 SAR - Saudi Riyal</SelectItem>
                                <SelectItem value="QAR">🇶🇦 QAR - Qatari Riyal</SelectItem>
                                <SelectItem value="KWD">🇰🇼 KWD - Kuwaiti Dinar</SelectItem>
                                <SelectItem value="BHD">🇧🇭 BHD - Bahraini Dinar</SelectItem>
                                <SelectItem value="OMR">🇴🇲 OMR - Omani Rial</SelectItem>
                                <SelectItem value="JOD">🇯🇴 JOD - Jordanian Dinar</SelectItem>
                                <SelectItem value="LBP">🇱🇧 LBP - Lebanese Pound</SelectItem>
                                <SelectItem value="IQD">🇮🇶 IQD - Iraqi Dinar</SelectItem>
                                <SelectItem value="IRR">🇮🇷 IRR - Iranian Rial</SelectItem>
                                
                                {/* North Africa */}
                                <SelectItem value="EGP">🇪🇬 EGP - Egyptian Pound</SelectItem>
                                <SelectItem value="LYD">🇱🇾 LYD - Libyan Dinar</SelectItem>
                                <SelectItem value="MAD">🇲🇦 MAD - Moroccan Dirham</SelectItem>
                                <SelectItem value="TND">🇹🇳 TND - Tunisian Dinar</SelectItem>
                                <SelectItem value="DZD">🇩🇿 DZD - Algerian Dinar</SelectItem>
                                <SelectItem value="SDG">🇸🇩 SDG - Sudanese Pound</SelectItem>
                                
                                {/* West Africa */}
                                <SelectItem value="NGN">🇳🇬 NGN - Nigerian Naira</SelectItem>
                                <SelectItem value="GHS">🇬🇭 GHS - Ghanaian Cedi</SelectItem>
                                <SelectItem value="XOF">🇸🇳 XOF - CFA Franc (West)</SelectItem>
                                <SelectItem value="SLL">🇸🇱 SLL - Sierra Leonean Leone</SelectItem>
                                <SelectItem value="LRD">🇱🇷 LRD - Liberian Dollar</SelectItem>
                                <SelectItem value="GNF">🇬🇳 GNF - Guinean Franc</SelectItem>
                                <SelectItem value="GMD">🇬🇲 GMD - Gambian Dalasi</SelectItem>
                                <SelectItem value="CVE">🇨🇻 CVE - Cape Verdean Escudo</SelectItem>
                                
                                {/* East Africa */}
                                <SelectItem value="KES">🇰🇪 KES - Kenyan Shilling</SelectItem>
                                <SelectItem value="UGX">🇺🇬 UGX - Ugandan Shilling</SelectItem>
                                <SelectItem value="TZS">🇹🇿 TZS - Tanzanian Shilling</SelectItem>
                                <SelectItem value="ETB">🇪🇹 ETB - Ethiopian Birr</SelectItem>
                                <SelectItem value="RWF">🇷🇼 RWF - Rwandan Franc</SelectItem>
                                <SelectItem value="BIF">🇧🇮 BIF - Burundian Franc</SelectItem>
                                <SelectItem value="SOS">🇸🇴 SOS - Somali Shilling</SelectItem>
                                <SelectItem value="DJF">🇩🇯 DJF - Djiboutian Franc</SelectItem>
                                <SelectItem value="ERN">🇪🇷 ERN - Eritrean Nakfa</SelectItem>
                                
                                {/* Central Africa */}
                                <SelectItem value="XAF">🇨🇲 XAF - CFA Franc (Central)</SelectItem>
                                <SelectItem value="CDF">🇨🇩 CDF - Congolese Franc</SelectItem>
                                <SelectItem value="AOA">🇦🇴 AOA - Angolan Kwanza</SelectItem>
                                <SelectItem value="STP">🇸🇹 STP - São Tomé Dobra</SelectItem>
                                
                                {/* Southern Africa */}
                                <SelectItem value="ZAR">🇿🇦 ZAR - South African Rand</SelectItem>
                                <SelectItem value="BWP">🇧🇼 BWP - Botswanan Pula</SelectItem>
                                <SelectItem value="NAD">🇳🇦 NAD - Namibian Dollar</SelectItem>
                                <SelectItem value="ZMW">🇿🇲 ZMW - Zambian Kwacha</SelectItem>
                                <SelectItem value="ZWL">🇿🇼 ZWL - Zimbabwean Dollar</SelectItem>
                                <SelectItem value="SZL">🇸🇿 SZL - Swazi Lilangeni</SelectItem>
                                <SelectItem value="LSL">🇱🇸 LSL - Lesotho Loti</SelectItem>
                                <SelectItem value="MWK">🇲🇼 MWK - Malawian Kwacha</SelectItem>
                                <SelectItem value="MZN">🇲🇿 MZN - Mozambican Metical</SelectItem>
                                <SelectItem value="MGA">🇲🇬 MGA - Malagasy Ariary</SelectItem>
                                <SelectItem value="MUR">🇲🇺 MUR - Mauritian Rupee</SelectItem>
                                <SelectItem value="SCR">🇸🇨 SCR - Seychellois Rupee</SelectItem>
                                <SelectItem value="KMF">🇰🇲 KMF - Comorian Franc</SelectItem>
                                
                                {/* Other Major Currencies */}
                                <SelectItem value="RUB">🇷🇺 RUB - Russian Ruble</SelectItem>
                                <SelectItem value="TRY">🇹🇷 TRY - Turkish Lira</SelectItem>
                                <SelectItem value="ILS">🇮🇱 ILS - Israeli Shekel</SelectItem>
                                <SelectItem value="PKR">🇵🇰 PKR - Pakistani Rupee</SelectItem>
                                <SelectItem value="BDT">🇧🇩 BDT - Bangladeshi Taka</SelectItem>
                                <SelectItem value="LKR">🇱🇰 LKR - Sri Lankan Rupee</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Product description..." 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="electronics">Electronics</SelectItem>
                            <SelectItem value="fashion">Fashion</SelectItem>
                            <SelectItem value="home">Home & Garden</SelectItem>
                            <SelectItem value="health">Health & Beauty</SelectItem>
                            <SelectItem value="sports">Sports & Outdoors</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Product Images Section */}
                  <FormField
                    control={form.control}
                    name="images"
                    render={() => (
                      <FormItem>
                        <FormLabel>Product Images (Minimum 1, Maximum 10)</FormLabel>
                        <FormControl>
                          <div className="space-y-4">
                            {/* Image URL Input */}
                            <div className="flex gap-2">
                              <Input
                                placeholder="Paste high-resolution image URL (800x600 recommended)"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const input = e.target as HTMLInputElement;
                                    if (input.value) {
                                      addImageUrl(input.value);
                                      input.value = '';
                                    }
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  const input = document.querySelector('input[placeholder*="image URL"]') as HTMLInputElement;
                                  if (input?.value) {
                                    addImageUrl(input.value);
                                    input.value = '';
                                  }
                                }}
                              >
                                Add Image
                              </Button>
                            </div>
                            
                            {/* Sample Images for Demo */}
                            <div className="text-sm text-gray-500">
                              <p>Quick add sample images:</p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => addImageUrl('https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop')}
                                >
                                  Add Product 1
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => addImageUrl('https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=600&fit=crop')}
                                >
                                  Add Product 2
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => addImageUrl('https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop')}
                                >
                                  Add Product 3
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => addImageUrl('https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&h=600&fit=crop')}
                                >
                                  Add Product 4
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => addImageUrl('https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&h=600&fit=crop')}
                                >
                                  Add Product 5
                                </Button>
                              </div>
                            </div>
                            
                            {/* Image Preview Grid */}
                            {uploadedImages.length > 0 && (
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {uploadedImages.map((url, index) => (
                                  <div key={index} className="relative group">
                                    <img
                                      src={url}
                                      alt={`Product ${index + 1}`}
                                      className="w-full h-24 object-cover rounded-lg border"
                                    />
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="sm"
                                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={() => removeImage(index)}
                                    >
                                      ×
                                    </Button>
                                    <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 rounded">
                                      {index + 1}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createProductMutation.isPending}>
                      {createProductMutation.isPending ? "Creating..." : "Create Product"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {productsLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : products.length > 0 ? (
          <div className="space-y-4">
            {products.map((product: any) => (
              <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">${product.basePrice}</p>
                  <Badge variant="outline" className="text-xs">
                    {product.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Package className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500">No products yet. Add your first product to get started.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Analytics Tab Component
function AnalyticsTab() {
  const { data: analyticsData, isLoading } = useQuery<any>({
    queryKey: ["/api/analytics"],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">${analyticsData?.revenue || '45,231'}</p>
                <p className="text-sm text-green-600">+23.1% this month</p>
              </div>
              <DollarSign className="text-green-600" size={24} />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{analyticsData?.orders || '892'}</p>
                <p className="text-sm text-blue-600">+12.3% this month</p>
              </div>
              <ShoppingCart className="text-blue-600" size={24} />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{analyticsData?.customers || '1,234'}</p>
                <p className="text-sm text-purple-600">+8.7% this month</p>
              </div>
              <Users className="text-purple-600" size={24} />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{analyticsData?.conversionRate || '3.24'}%</p>
                <p className="text-sm text-orange-600">+0.5% this month</p>
              </div>
              <TrendingUp className="text-orange-600" size={24} />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
          <CardDescription>Key metrics for your store performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BarChart3 className="mx-auto text-blue-600 mb-4" size={64} />
            <p className="text-lg font-medium text-gray-900 mb-2">Analytics Dashboard</p>
            <p className="text-gray-500">Detailed charts and insights available in full analytics view</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Store Settings Tab Component  
function StoreSettingsTab() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Settings form schema
  const settingsFormSchema = z.object({
    name: z.string().min(1, "Store name is required"),
    currency: z.string().min(1, "Currency is required"),
    primaryColor: z.string().min(1, "Primary color is required"),
    theme: z.string().min(1, "Theme is required"),
  });

  type SettingsFormData = z.infer<typeof settingsFormSchema>;

  // Form setup
  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      name: "My Store",
      currency: "USD",
      primaryColor: "#3b82f6",
      theme: "modern",
    },
  });

  // Settings update mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: SettingsFormData) => {
      const response = await apiRequest("PUT", "/api/store-settings", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Settings Updated Successfully",
        description: "Your store settings have been saved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update Settings",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleUpdateSettings = (data: SettingsFormData) => {
    updateSettingsMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Basic store configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdateSettings)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Store Name</FormLabel>
                      <FormControl>
                        <Input placeholder="My Store" {...field} />
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
                            <SelectValue placeholder="Select store currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-40 overflow-y-auto">
                          {/* Americas */}
                          <SelectItem value="USD">🇺🇸 USD - US Dollar</SelectItem>
                          <SelectItem value="CAD">🇨🇦 CAD - Canadian Dollar</SelectItem>
                          <SelectItem value="MXN">🇲🇽 MXN - Mexican Peso</SelectItem>
                          <SelectItem value="BRL">🇧🇷 BRL - Brazilian Real</SelectItem>
                          <SelectItem value="ARS">🇦🇷 ARS - Argentine Peso</SelectItem>
                          <SelectItem value="CLP">🇨🇱 CLP - Chilean Peso</SelectItem>
                          <SelectItem value="COP">🇨🇴 COP - Colombian Peso</SelectItem>
                          <SelectItem value="PEN">🇵🇪 PEN - Peruvian Sol</SelectItem>
                          
                          {/* Europe */}
                          <SelectItem value="EUR">🇪🇺 EUR - Euro</SelectItem>
                          <SelectItem value="GBP">🇬🇧 GBP - British Pound</SelectItem>
                          <SelectItem value="CHF">🇨🇭 CHF - Swiss Franc</SelectItem>
                          <SelectItem value="SEK">🇸🇪 SEK - Swedish Krona</SelectItem>
                          <SelectItem value="NOK">🇳🇴 NOK - Norwegian Krone</SelectItem>
                          <SelectItem value="DKK">🇩🇰 DKK - Danish Krone</SelectItem>
                          <SelectItem value="PLN">🇵🇱 PLN - Polish Złoty</SelectItem>
                          <SelectItem value="CZK">🇨🇿 CZK - Czech Koruna</SelectItem>
                          <SelectItem value="HUF">🇭🇺 HUF - Hungarian Forint</SelectItem>
                          <SelectItem value="RON">🇷🇴 RON - Romanian Leu</SelectItem>
                          <SelectItem value="BGN">🇧🇬 BGN - Bulgarian Lev</SelectItem>
                          <SelectItem value="HRK">🇭🇷 HRK - Croatian Kuna</SelectItem>
                          
                          {/* Asia-Pacific */}
                          <SelectItem value="JPY">🇯🇵 JPY - Japanese Yen</SelectItem>
                          <SelectItem value="CNY">🇨🇳 CNY - Chinese Yuan</SelectItem>
                          <SelectItem value="KRW">🇰🇷 KRW - South Korean Won</SelectItem>
                          <SelectItem value="INR">🇮🇳 INR - Indian Rupee</SelectItem>
                          <SelectItem value="AUD">🇦🇺 AUD - Australian Dollar</SelectItem>
                          <SelectItem value="NZD">🇳🇿 NZD - New Zealand Dollar</SelectItem>
                          <SelectItem value="SGD">🇸🇬 SGD - Singapore Dollar</SelectItem>
                          <SelectItem value="HKD">🇭🇰 HKD - Hong Kong Dollar</SelectItem>
                          <SelectItem value="TWD">🇹🇼 TWD - Taiwan Dollar</SelectItem>
                          <SelectItem value="THB">🇹🇭 THB - Thai Baht</SelectItem>
                          <SelectItem value="MYR">🇲🇾 MYR - Malaysian Ringgit</SelectItem>
                          <SelectItem value="IDR">🇮🇩 IDR - Indonesian Rupiah</SelectItem>
                          <SelectItem value="PHP">🇵🇭 PHP - Philippine Peso</SelectItem>
                          <SelectItem value="VND">🇻🇳 VND - Vietnamese Dong</SelectItem>
                          
                          {/* Middle East */}
                          <SelectItem value="AED">🇦🇪 AED - UAE Dirham</SelectItem>
                          <SelectItem value="SAR">🇸🇦 SAR - Saudi Riyal</SelectItem>
                          <SelectItem value="QAR">🇶🇦 QAR - Qatari Riyal</SelectItem>
                          <SelectItem value="KWD">🇰🇼 KWD - Kuwaiti Dinar</SelectItem>
                          <SelectItem value="BHD">🇧🇭 BHD - Bahraini Dinar</SelectItem>
                          <SelectItem value="OMR">🇴🇲 OMR - Omani Rial</SelectItem>
                          <SelectItem value="JOD">🇯🇴 JOD - Jordanian Dinar</SelectItem>
                          <SelectItem value="LBP">🇱🇧 LBP - Lebanese Pound</SelectItem>
                          <SelectItem value="IQD">🇮🇶 IQD - Iraqi Dinar</SelectItem>
                          <SelectItem value="IRR">🇮🇷 IRR - Iranian Rial</SelectItem>
                          
                          {/* North Africa */}
                          <SelectItem value="EGP">🇪🇬 EGP - Egyptian Pound</SelectItem>
                          <SelectItem value="LYD">🇱🇾 LYD - Libyan Dinar</SelectItem>
                          <SelectItem value="MAD">🇲🇦 MAD - Moroccan Dirham</SelectItem>
                          <SelectItem value="TND">🇹🇳 TND - Tunisian Dinar</SelectItem>
                          <SelectItem value="DZD">🇩🇿 DZD - Algerian Dinar</SelectItem>
                          <SelectItem value="SDG">🇸🇩 SDG - Sudanese Pound</SelectItem>
                          
                          {/* West Africa */}
                          <SelectItem value="NGN">🇳🇬 NGN - Nigerian Naira</SelectItem>
                          <SelectItem value="GHS">🇬🇭 GHS - Ghanaian Cedi</SelectItem>
                          <SelectItem value="XOF">🇸🇳 XOF - CFA Franc (West)</SelectItem>
                          <SelectItem value="SLL">🇸🇱 SLL - Sierra Leonean Leone</SelectItem>
                          <SelectItem value="LRD">🇱🇷 LRD - Liberian Dollar</SelectItem>
                          <SelectItem value="GNF">🇬🇳 GNF - Guinean Franc</SelectItem>
                          <SelectItem value="GMD">🇬🇲 GMD - Gambian Dalasi</SelectItem>
                          <SelectItem value="CVE">🇨🇻 CVE - Cape Verdean Escudo</SelectItem>
                          
                          {/* East Africa */}
                          <SelectItem value="KES">🇰🇪 KES - Kenyan Shilling</SelectItem>
                          <SelectItem value="UGX">🇺🇬 UGX - Ugandan Shilling</SelectItem>
                          <SelectItem value="TZS">🇹🇿 TZS - Tanzanian Shilling</SelectItem>
                          <SelectItem value="ETB">🇪🇹 ETB - Ethiopian Birr</SelectItem>
                          <SelectItem value="RWF">🇷🇼 RWF - Rwandan Franc</SelectItem>
                          <SelectItem value="BIF">🇧🇮 BIF - Burundian Franc</SelectItem>
                          <SelectItem value="SOS">🇸🇴 SOS - Somali Shilling</SelectItem>
                          <SelectItem value="DJF">🇩🇯 DJF - Djiboutian Franc</SelectItem>
                          <SelectItem value="ERN">🇪🇷 ERN - Eritrean Nakfa</SelectItem>
                          
                          {/* Central Africa */}
                          <SelectItem value="XAF">🇨🇲 XAF - CFA Franc (Central)</SelectItem>
                          <SelectItem value="CDF">🇨🇩 CDF - Congolese Franc</SelectItem>
                          <SelectItem value="AOA">🇦🇴 AOA - Angolan Kwanza</SelectItem>
                          <SelectItem value="STP">🇸🇹 STP - São Tomé Dobra</SelectItem>
                          
                          {/* Southern Africa */}
                          <SelectItem value="ZAR">🇿🇦 ZAR - South African Rand</SelectItem>
                          <SelectItem value="BWP">🇧🇼 BWP - Botswanan Pula</SelectItem>
                          <SelectItem value="NAD">🇳🇦 NAD - Namibian Dollar</SelectItem>
                          <SelectItem value="ZMW">🇿🇲 ZMW - Zambian Kwacha</SelectItem>
                          <SelectItem value="ZWL">🇿🇼 ZWL - Zimbabwean Dollar</SelectItem>
                          <SelectItem value="SZL">🇸🇿 SZL - Swazi Lilangeni</SelectItem>
                          <SelectItem value="LSL">🇱🇸 LSL - Lesotho Loti</SelectItem>
                          <SelectItem value="MWK">🇲🇼 MWK - Malawian Kwacha</SelectItem>
                          <SelectItem value="MZN">🇲🇿 MZN - Mozambican Metical</SelectItem>
                          <SelectItem value="MGA">🇲🇬 MGA - Malagasy Ariary</SelectItem>
                          <SelectItem value="MUR">🇲🇺 MUR - Mauritian Rupee</SelectItem>
                          <SelectItem value="SCR">🇸🇨 SCR - Seychellois Rupee</SelectItem>
                          <SelectItem value="KMF">🇰🇲 KMF - Comorian Franc</SelectItem>
                          
                          {/* Other Major Currencies */}
                          <SelectItem value="RUB">🇷🇺 RUB - Russian Ruble</SelectItem>
                          <SelectItem value="TRY">🇹🇷 TRY - Turkish Lira</SelectItem>
                          <SelectItem value="ILS">🇮🇱 ILS - Israeli Shekel</SelectItem>
                          <SelectItem value="PKR">🇵🇰 PKR - Pakistani Rupee</SelectItem>
                          <SelectItem value="BDT">🇧🇩 BDT - Bangladeshi Taka</SelectItem>
                          <SelectItem value="LKR">🇱🇰 LKR - Sri Lankan Rupee</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="primaryColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Color</FormLabel>
                      <FormControl>
                        <Input type="color" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="theme"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Theme</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select theme" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="modern">Modern</SelectItem>
                          <SelectItem value="classic">Classic</SelectItem>
                          <SelectItem value="minimalist">Minimalist</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={updateSettingsMutation.isPending}>
                  {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard size={20} />
              Payment Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Configure Payment Methods
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe size={20} />
              Domain Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Manage Custom Domain
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}