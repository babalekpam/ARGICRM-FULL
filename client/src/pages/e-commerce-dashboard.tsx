import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ShoppingCart, 
  Package, 
  Users, 
  TrendingUp, 
  Search, 
  Star,
  Heart,
  ShoppingBag,
  CreditCard,
  Truck,
  Mail,
  Tag,
  BarChart3,
  Filter,
  Settings,
  Link,
  Store,
  Globe,
  Copy,
  ExternalLink,
  RefreshCw,
  Trash2,
  Zap,
  Sparkles,
  Eye,
  CheckCircle,
  Clock
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { CURRENCIES } from '@shared/currencies';
import Layout from '@/components/layout';

import ShoppingCartComponent, { AddToCartButton } from '@/components/shopping-cart';
import ShopifyPerformanceDashboard from '@/components/shopify-performance-dashboard';
import { StoreLaunchWizard } from '@/components/store-launch-wizard';

export default function EcommerceDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [showLaunchWizard, setShowLaunchWizard] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [newReview, setNewReview] = useState({ productId: '', rating: 5, comment: '' });
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    type: 'percentage',
    value: 0,
    expiresAt: '',
    minOrderAmount: 0
  });
  const [unpublishDialogOpen, setUnpublishDialogOpen] = useState(false);
  const [storeToUnpublish, setStoreToUnpublish] = useState<{ id: number; name: string } | null>(null);

  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    compareAtPrice: '',
    sku: '',
    inventoryQuantity: '',
    categoryId: '',
    images: [],
    isActive: true
  });

  const [newStore, setNewStore] = useState({
    name: '',
    description: '',
    subdomain: '',
    domain: '',
    primaryColor: '#3b82f6',
    secondaryColor: '#1f2937',
    currency: 'USD',
    timezone: 'UTC'
  });

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['/api/ecommerce/products', searchQuery, selectedCategory, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      params.append('sort', sortBy);
      
      const response = await apiRequest('GET', `/api/ecommerce/products?${params.toString()}`);
      return await response.json();
    }
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/ecommerce/categories'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/ecommerce/categories');
      return await response.json();
    }
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['/api/ecommerce/orders'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/ecommerce/orders');
      return await response.json();
    }
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['/api/ecommerce/customers'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/ecommerce/customers');
      return await response.json();
    }
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['/api/ecommerce/reviews'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/ecommerce/reviews');
      return await response.json();
    }
  });

  const { data: coupons = [] } = useQuery({
    queryKey: ['/api/ecommerce/coupons'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/ecommerce/coupons');
      return await response.json();
    }
  });

  const { data: stores = [], refetch: refetchStores } = useQuery({
    queryKey: ['/api/ecommerce/stores'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/ecommerce/stores');
      return await response.json();
    }
  });

  const totalRevenue = 0;
  const averageOrderValue = 0;
  const conversionRate = 0;
  const totalOrders = 0;
  const totalProducts = 0;
  const totalCustomers = 0;
  const totalStores = 0;

  const createReviewMutation = useMutation({
    mutationFn: async (reviewData: any) => {
      const response = await apiRequest('POST', '/api/ecommerce/reviews', reviewData);
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "Review Added", description: "Product review submitted successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/ecommerce/reviews'] });
      setNewReview({ productId: '', rating: 5, comment: '' });
    },
    onError: (error: any) => {
      toast({
        title: "Review Failed",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      });
    }
  });

  const createCouponMutation = useMutation({
    mutationFn: async (couponData: any) => {
      const response = await apiRequest('POST', '/api/ecommerce/coupons', couponData);
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "Coupon Created", description: "Discount coupon created successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/ecommerce/coupons'] });
      setNewCoupon({
        code: '',
        type: 'percentage',
        value: 0,
        expiresAt: '',
        minOrderAmount: 0
      });
    },
    onError: (error: any) => {
      toast({
        title: "Coupon Failed",
        description: error.message || "Failed to create coupon",
        variant: "destructive",
      });
    }
  });

  const createProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      const response = await apiRequest('POST', '/api/ecommerce/products', productData);
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "Product Created", description: "Product added successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/ecommerce/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ecommerce/categories'] });
      setNewProduct({
        name: '',
        description: '',
        price: '',
        compareAtPrice: '',
        sku: '',
        inventoryQuantity: '',
        categoryId: '',
        images: [],
        isActive: true
      });
    },
    onError: (error: any) => {
      toast({
        title: "Product Creation Failed",
        description: error.message || "Failed to create product",
        variant: "destructive",
      });
    }
  });

  const deleteStoreMutation = useMutation({
    mutationFn: async (storeId: number) => {
      const response = await apiRequest('DELETE', `/api/ecommerce/stores/${storeId}`);
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "Store Deleted", description: "Store removed successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/ecommerce/stores'] });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete store",
        variant: "destructive",
      });
    }
  });

  const handleDeleteStore = (storeId: number, storeName: string) => {
    if (window.confirm(`Are you sure you want to delete the store "${storeName}"? This action cannot be undone.`)) {
      deleteStoreMutation.mutate(storeId);
    }
  };

  const togglePublishMutation = useMutation({
    mutationFn: async ({ storeId, isPublic }: { storeId: number; isPublic: boolean }) => {
      const response = await apiRequest('PUT', `/api/ecommerce/stores/${storeId}`, {
        isPublic,
        status: isPublic ? 'active' : 'inactive'
      });
      return await response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: variables.isPublic ? "Store Published" : "Store Unpublished",
        description: variables.isPublic 
          ? "Your store is now live and visible to customers" 
          : "Your store is now hidden from customers"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ecommerce/stores'] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update store status",
        variant: "destructive",
      });
    }
  });

  const handleTogglePublish = (storeId: number, isPublic: boolean, storeName: string) => {
    if (!isPublic) {
      setStoreToUnpublish({ id: storeId, name: storeName });
      setUnpublishDialogOpen(true);
    } else {
      togglePublishMutation.mutate({ storeId, isPublic });
    }
  };

  const confirmUnpublish = () => {
    if (storeToUnpublish) {
      togglePublishMutation.mutate({ storeId: storeToUnpublish.id, isPublic: false });
      setUnpublishDialogOpen(false);
      setStoreToUnpublish(null);
    }
  };

  const createStoreMutation = useMutation({
    mutationFn: async (storeData: any) => {
      const response = await apiRequest('POST', '/api/ecommerce/stores', storeData);
      return await response.json();
    },
    onSuccess: (data: any) => {
      const webUrl = data.domain || `${data.subdomain}.argilette-store.com`;
      const subdomainMessage = data.subdomain !== newStore.subdomain ? 
        ` (subdomain adjusted to "${data.subdomain}" for uniqueness)` : '';
      
      toast({ 
        title: "Store Created Successfully", 
        description: `Store created with URL: ${webUrl}${subdomainMessage}` 
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/ecommerce/stores'] });
      refetchStores();
      
      setNewStore({
        name: '',
        description: '',
        subdomain: '',
        domain: '',
        primaryColor: '#3b82f6',
        secondaryColor: '#1f2937',
        currency: 'USD',
        timezone: 'UTC'
      });
    },
    onError: (error: any) => {
      toast({
        title: "Store Creation Failed",
        description: error.message || "Failed to create store",
        variant: "destructive",
      });
    }
  });

  const filteredProducts = Array.isArray(products) ? products.filter(product => {
    const matchesSearch = !searchQuery || 
      product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
      product.categories?.some((cat: any) => cat.name === selectedCategory);
    
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return parseFloat(a.price) - parseFloat(b.price);
      case 'price-high':
        return parseFloat(b.price) - parseFloat(a.price);
      case 'rating':
        return (b.averageRating || 0) - (a.averageRating || 0);
      default:
        return a.name?.localeCompare(b.name);
    }
  }) : [];

  if (showLaunchWizard) {
    return <StoreLaunchWizard onClose={() => setShowLaunchWizard(false)} />;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-[hsl(228,47%,8%)]">
        <div className="container mx-auto p-6 space-y-8">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[hsl(210,17%,98%)] tracking-tight">E-commerce Dashboard</h1>
              <p className="text-sm text-[hsl(215,20%,65%)]">Complete e-commerce management system</p>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                size="lg"
                className="bg-[hsl(227,89%,63%)] hover:bg-[hsl(227,89%,55%)] text-white"
                onClick={() => setShowLaunchWizard(true)}
                data-testid="button-launch-store"
              >
                <Zap className="h-4 w-4 mr-2" />
                Launch New Store
              </Button>
              <ShoppingCartComponent />
              <Button variant="outline" className="border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)] hover:bg-[hsl(229,41%,16%)]">
                <Settings className="h-4 w-4 mr-2" />
                Store Settings
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[hsl(215,20%,65%)] uppercase tracking-wide">Total Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-[hsl(215,20%,65%)]" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-[hsl(210,17%,98%)] tabular-nums">$0.00</p>
                <p className="text-xs text-[hsl(215,20%,65%)]">
                  0% from last month
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[hsl(215,20%,65%)] uppercase tracking-wide">Orders</CardTitle>
                <ShoppingBag className="h-4 w-4 text-[hsl(215,20%,65%)]" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-[hsl(210,17%,98%)] tabular-nums">0</p>
                <p className="text-xs text-[hsl(215,20%,65%)]">
                  0% from last month
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[hsl(215,20%,65%)] uppercase tracking-wide">Customers</CardTitle>
                <Users className="h-4 w-4 text-[hsl(215,20%,65%)]" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-[hsl(210,17%,98%)] tabular-nums">0</p>
                <p className="text-xs text-[hsl(215,20%,65%)]">
                  0% from last month
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[hsl(215,20%,65%)] uppercase tracking-wide">Conversion Rate</CardTitle>
                <BarChart3 className="h-4 w-4 text-[hsl(215,20%,65%)]" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-[hsl(210,17%,98%)] tabular-nums">{conversionRate.toFixed(1)}%</p>
                <p className="text-xs text-[hsl(215,20%,65%)]">
                  0% from last month
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="products" className="space-y-6">
            <TabsList className="w-full justify-start bg-[hsl(229,41%,16%)] border border-[hsl(217,33%,17%)] p-1 flex-wrap">
              <TabsTrigger value="products" className="gap-2 data-[state=active]:bg-[hsl(227,89%,63%)] data-[state=active]:text-white text-[hsl(215,20%,65%)]" data-testid="tab-products">
                <Package className="h-4 w-4" />
                Products
              </TabsTrigger>
              <TabsTrigger value="stores" className="gap-2 data-[state=active]:bg-[hsl(227,89%,63%)] data-[state=active]:text-white text-[hsl(215,20%,65%)]" data-testid="tab-stores">
                <Store className="h-4 w-4" />
                Stores
              </TabsTrigger>
              <TabsTrigger value="performance" className="gap-2 data-[state=active]:bg-[hsl(227,89%,63%)] data-[state=active]:text-white text-[hsl(215,20%,65%)]" data-testid="tab-performance">
                <TrendingUp className="h-4 w-4" />
                Performance
              </TabsTrigger>
              <TabsTrigger value="orders" className="gap-2 data-[state=active]:bg-[hsl(227,89%,63%)] data-[state=active]:text-white text-[hsl(215,20%,65%)]" data-testid="tab-orders">
                <ShoppingCart className="h-4 w-4" />
                Orders
              </TabsTrigger>
              <TabsTrigger value="customers" className="gap-2 data-[state=active]:bg-[hsl(227,89%,63%)] data-[state=active]:text-white text-[hsl(215,20%,65%)]" data-testid="tab-customers">
                <Users className="h-4 w-4" />
                Customers
              </TabsTrigger>
              <TabsTrigger value="reviews" className="gap-2 data-[state=active]:bg-[hsl(227,89%,63%)] data-[state=active]:text-white text-[hsl(215,20%,65%)]" data-testid="tab-reviews">
                <Star className="h-4 w-4" />
                Reviews
              </TabsTrigger>
              <TabsTrigger value="coupons" className="gap-2 data-[state=active]:bg-[hsl(227,89%,63%)] data-[state=active]:text-white text-[hsl(215,20%,65%)]" data-testid="tab-coupons">
                <Tag className="h-4 w-4" />
                Coupons
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2 data-[state=active]:bg-[hsl(227,89%,63%)] data-[state=active]:text-white text-[hsl(215,20%,65%)]" data-testid="tab-analytics">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2 data-[state=active]:bg-[hsl(227,89%,63%)] data-[state=active]:text-white text-[hsl(215,20%,65%)]" data-testid="tab-settings">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            <div>
              <TabsContent value="products" className="space-y-6">
                <div className="flex flex-wrap justify-between items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-[hsl(210,17%,98%)] tracking-tight">Products</h2>
                    <p className="text-sm text-[hsl(215,20%,65%)]">Manage your product catalog</p>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="flex items-center gap-2 bg-[hsl(227,89%,63%)] hover:bg-[hsl(227,89%,55%)] text-white">
                        <Package className="h-4 w-4" />
                        Add Product
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[hsl(228,47%,12%)] border-[hsl(217,33%,17%)]">
                      <DialogHeader>
                        <DialogTitle className="text-[hsl(210,17%,98%)]">Add New Product</DialogTitle>
                        <DialogDescription className="text-[hsl(215,20%,65%)]">
                          Create a new product for your store
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name" className="text-[hsl(215,20%,65%)]">Product Name *</Label>
                            <Input
                              id="name"
                              placeholder="Enter product name"
                              value={newProduct.name}
                              onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                              className="bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)] placeholder:text-[hsl(215,20%,65%)]"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="sku" className="text-[hsl(215,20%,65%)]">SKU</Label>
                            <Input
                              id="sku"
                              placeholder="Product SKU"
                              value={newProduct.sku}
                              onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})}
                              className="bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)] placeholder:text-[hsl(215,20%,65%)]"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="description" className="text-[hsl(215,20%,65%)]">Description</Label>
                          <Textarea
                            id="description"
                            placeholder="Product description"
                            value={newProduct.description}
                            onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                            rows={3}
                            className="bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)] placeholder:text-[hsl(215,20%,65%)]"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="price" className="text-[hsl(215,20%,65%)]">Price *</Label>
                            <Input
                              id="price"
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={newProduct.price}
                              onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                              className="bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)] placeholder:text-[hsl(215,20%,65%)]"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="compareAtPrice" className="text-[hsl(215,20%,65%)]">Compare at Price</Label>
                            <Input
                              id="compareAtPrice"
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={newProduct.compareAtPrice}
                              onChange={(e) => setNewProduct({...newProduct, compareAtPrice: e.target.value})}
                              className="bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)] placeholder:text-[hsl(215,20%,65%)]"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="inventoryQuantity" className="text-[hsl(215,20%,65%)]">Inventory Quantity *</Label>
                            <Input
                              id="inventoryQuantity"
                              type="number"
                              placeholder="0"
                              value={newProduct.inventoryQuantity}
                              onChange={(e) => setNewProduct({...newProduct, inventoryQuantity: e.target.value})}
                              className="bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)] placeholder:text-[hsl(215,20%,65%)]"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="category" className="text-[hsl(215,20%,65%)]">Category</Label>
                            <Select 
                              value={newProduct.categoryId} 
                              onValueChange={(value) => setNewProduct({...newProduct, categoryId: value})}
                            >
                              <SelectTrigger className="bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)]">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent className="bg-[hsl(228,47%,12%)] border-[hsl(217,33%,17%)]">
                                {Array.isArray(categories) && categories.map((category: any) => (
                                  <SelectItem key={category.id} value={category.id.toString()} className="text-[hsl(210,17%,98%)] focus:bg-[hsl(229,41%,16%)]">
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                          <DialogTrigger asChild>
                            <Button variant="outline" className="border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)] hover:bg-[hsl(229,41%,16%)]">Cancel</Button>
                          </DialogTrigger>
                          <Button 
                            onClick={() => {
                              if (!newProduct.name || !newProduct.price || !newProduct.inventoryQuantity) {
                                toast({
                                  title: "Validation Error",
                                  description: "Please fill in all required fields",
                                  variant: "destructive",
                                });
                                return;
                              }
                              createProductMutation.mutate({
                                name: newProduct.name,
                                description: newProduct.description,
                                price: parseFloat(newProduct.price),
                                compareAtPrice: newProduct.compareAtPrice ? parseFloat(newProduct.compareAtPrice) : undefined,
                                sku: newProduct.sku,
                                inventoryQuantity: parseInt(newProduct.inventoryQuantity),
                                categoryId: newProduct.categoryId ? parseInt(newProduct.categoryId) : undefined,
                                isActive: newProduct.isActive
                              });
                            }}
                            disabled={createProductMutation.isPending}
                            className="bg-[hsl(227,89%,63%)] hover:bg-[hsl(227,89%,55%)] text-white"
                          >
                            {createProductMutation.isPending ? 'Creating...' : 'Create Product'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-[hsl(215,20%,65%)] uppercase tracking-wide">
                      <Search className="h-5 w-5" />
                      Product Search & Filter
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-4">
                      <div className="flex-1 min-w-[200px]">
                        <Input
                          placeholder="Search products..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)] placeholder:text-[hsl(215,20%,65%)]"
                        />
                      </div>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-[180px] bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)]">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent className="bg-[hsl(228,47%,12%)] border-[hsl(217,33%,17%)]">
                          <SelectItem value="all" className="text-[hsl(210,17%,98%)] focus:bg-[hsl(229,41%,16%)]">All Categories</SelectItem>
                          {Array.isArray(categories) && categories.map((category: any) => (
                            <SelectItem key={category.id} value={category.name} className="text-[hsl(210,17%,98%)] focus:bg-[hsl(229,41%,16%)]">
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-[150px] bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)]">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent className="bg-[hsl(228,47%,12%)] border-[hsl(217,33%,17%)]">
                          <SelectItem value="name" className="text-[hsl(210,17%,98%)] focus:bg-[hsl(229,41%,16%)]">Name</SelectItem>
                          <SelectItem value="price-low" className="text-[hsl(210,17%,98%)] focus:bg-[hsl(229,41%,16%)]">Price: Low to High</SelectItem>
                          <SelectItem value="price-high" className="text-[hsl(210,17%,98%)] focus:bg-[hsl(229,41%,16%)]">Price: High to Low</SelectItem>
                          <SelectItem value="rating" className="text-[hsl(210,17%,98%)] focus:bg-[hsl(229,41%,16%)]">Rating</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {productsLoading ? (
                    <div className="col-span-full text-center py-8 text-[hsl(215,20%,65%)]">Loading products...</div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="col-span-full text-center py-8">
                      <Package className="h-12 w-12 mx-auto text-[hsl(215,20%,65%)] mb-4" />
                      <p className="text-[hsl(215,20%,65%)]">No products found</p>
                    </div>
                  ) : (
                    filteredProducts.map((product: any) => (
                      <Card key={product.id} className="overflow-hidden bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg">
                        {product.images?.[0] && (
                          <img 
                            src={product.images[0]} 
                            alt={product.name}
                            className="w-full h-48 object-cover"
                          />
                        )}
                        <CardContent className="p-4">
                          <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                            <h3 className="font-semibold text-lg text-[hsl(210,17%,98%)]">{product.name}</h3>
                            <Badge className={product.inventoryQuantity > 0 ? "bg-[hsl(160,84%,39%)/30%] text-[hsl(160,84%,39%)]" : "bg-red-500/30 text-red-400"}>
                              {product.inventoryQuantity > 0 ? "In Stock" : "Out of Stock"}
                            </Badge>
                          </div>
                          
                          <p className="text-[hsl(215,20%,65%)] text-sm mb-3 line-clamp-2">
                            {product.description}
                          </p>
                          
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-2xl font-bold text-[hsl(210,17%,98%)]">${product.price}</span>
                            {product.compareAtPrice && (
                              <span className="text-sm text-[hsl(215,20%,65%)] line-through">
                                ${product.compareAtPrice}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`h-4 w-4 ${
                                    i < (product.averageRating || 0) 
                                      ? 'text-[hsl(38,92%,50%)] fill-current' 
                                      : 'text-[hsl(215,20%,65%)]'
                                  }`} 
                                />
                              ))}
                            </div>
                            <span className="text-sm text-[hsl(215,20%,65%)]">
                              ({product.reviewCount || 0} reviews)
                            </span>
                          </div>

                          <div className="flex gap-2">
                            <AddToCartButton product={product} />
                            <Button variant="outline" size="sm" className="border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)] hover:bg-[hsl(229,41%,16%)]">
                              <Heart className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="stores" className="space-y-6">
                <div className="flex flex-wrap justify-between items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-[hsl(210,17%,98%)] tracking-tight">Store Configuration</h2>
                    <p className="text-sm text-[hsl(215,20%,65%)]">Manage your online stores and generate web links</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => refetchStores()}
                      className="border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)] hover:bg-[hsl(229,41%,16%)]"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="flex items-center gap-2 bg-[hsl(227,89%,63%)] hover:bg-[hsl(227,89%,55%)] text-white">
                          <Store className="h-4 w-4" />
                          Create Store
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[hsl(228,47%,12%)] border-[hsl(217,33%,17%)]">
                        <DialogHeader>
                          <DialogTitle className="text-[hsl(210,17%,98%)]">Create New Store</DialogTitle>
                          <DialogDescription className="text-[hsl(215,20%,65%)]">
                            Set up a new online store with a unique web link
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="storeName" className="text-[hsl(215,20%,65%)]">Store Name *</Label>
                              <Input
                                id="storeName"
                                placeholder="Enter store name"
                                value={newStore.name}
                                onChange={(e) => {
                                  const name = e.target.value;
                                  const subdomain = name.toLowerCase()
                                    .replace(/[^a-z0-9]/g, '-')
                                    .replace(/-+/g, '-')
                                    .replace(/^-|-$/g, '');
                                  setNewStore({...newStore, name, subdomain});
                                }}
                                className="bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)] placeholder:text-[hsl(215,20%,65%)]"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="subdomain" className="text-[hsl(215,20%,65%)]">Subdomain *</Label>
                              <div className="flex items-center gap-2">
                                <Input
                                  id="subdomain"
                                  placeholder="mystore"
                                  value={newStore.subdomain}
                                  onChange={(e) => setNewStore({...newStore, subdomain: e.target.value.toLowerCase()})}
                                  className="bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)] placeholder:text-[hsl(215,20%,65%)]"
                                />
                                <span className="text-sm text-[hsl(215,20%,65%)]">.argilette-store.com</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="storeDescription" className="text-[hsl(215,20%,65%)]">Description</Label>
                            <Textarea
                              id="storeDescription"
                              placeholder="Store description"
                              value={newStore.description}
                              onChange={(e) => setNewStore({...newStore, description: e.target.value})}
                              rows={3}
                              className="bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)] placeholder:text-[hsl(215,20%,65%)]"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="primaryColor" className="text-[hsl(215,20%,65%)]">Primary Color</Label>
                              <Input
                                id="primaryColor"
                                type="color"
                                value={newStore.primaryColor}
                                onChange={(e) => setNewStore({...newStore, primaryColor: e.target.value})}
                                className="bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)]"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="secondaryColor" className="text-[hsl(215,20%,65%)]">Secondary Color</Label>
                              <Input
                                id="secondaryColor"
                                type="color"
                                value={newStore.secondaryColor}
                                onChange={(e) => setNewStore({...newStore, secondaryColor: e.target.value})}
                                className="bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)]"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="currency" className="text-[hsl(215,20%,65%)]">Currency</Label>
                              <Select 
                                value={newStore.currency} 
                                onValueChange={(value) => setNewStore({...newStore, currency: value})}
                              >
                                <SelectTrigger className="bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)]">
                                  <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                                <SelectContent className="bg-[hsl(228,47%,12%)] border-[hsl(217,33%,17%)]">
                                  {CURRENCIES.map((currency) => (
                                    <SelectItem key={currency.code} value={currency.code} className="text-[hsl(210,17%,98%)] focus:bg-[hsl(229,41%,16%)]">
                                      {currency.symbol} {currency.code} - {currency.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="customDomain" className="text-[hsl(215,20%,65%)]">Custom Domain (Optional)</Label>
                              <Input
                                id="customDomain"
                                placeholder="www.mystore.com"
                                value={newStore.domain}
                                onChange={(e) => setNewStore({...newStore, domain: e.target.value})}
                                className="bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)] placeholder:text-[hsl(215,20%,65%)]"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-4">
                            <DialogTrigger asChild>
                              <Button variant="outline" className="border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)] hover:bg-[hsl(229,41%,16%)]">Cancel</Button>
                            </DialogTrigger>
                            <Button 
                              onClick={() => {
                                if (!newStore.name || !newStore.subdomain) {
                                  toast({
                                    title: "Validation Error",
                                    description: "Please fill in store name and subdomain",
                                    variant: "destructive",
                                  });
                                  return;
                                }
                                createStoreMutation.mutate({
                                  name: newStore.name,
                                  description: newStore.description,
                                  subdomain: newStore.subdomain,
                                  domain: newStore.domain,
                                  primaryColor: newStore.primaryColor,
                                  secondaryColor: newStore.secondaryColor,
                                  currency: newStore.currency,
                                  timezone: newStore.timezone
                                });
                              }}
                              disabled={createStoreMutation.isPending}
                              className="bg-[hsl(227,89%,63%)] hover:bg-[hsl(227,89%,55%)] text-white"
                            >
                              {createStoreMutation.isPending ? 'Creating...' : 'Create Store'}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.isArray(stores) && stores.length === 0 ? (
                    <div className="col-span-full text-center py-8">
                      <Store className="h-12 w-12 mx-auto text-[hsl(215,20%,65%)] mb-4" />
                      <p className="text-[hsl(215,20%,65%)]">No stores created yet</p>
                      <p className="text-sm text-[hsl(215,20%,65%)] mt-2">Create your first store to get started</p>
                    </div>
                  ) : (
                    Array.isArray(stores) && stores.map((store: any) => (
                      <Card key={store.id} className="overflow-hidden bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg" data-testid={`card-store-${store.id}`}>
                        <CardHeader className="pb-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <CardTitle className="text-lg text-[hsl(210,17%,98%)]">{store.name}</CardTitle>
                            <Badge 
                              className={store.isPublic ? "bg-[hsl(160,84%,39%)/30%] text-[hsl(160,84%,39%)]" : "bg-[hsl(229,41%,16%)] text-[hsl(227,89%,63%)]"}
                              data-testid={`badge-status-${store.id}`}
                            >
                              {store.isPublic ? (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Published
                                </>
                              ) : (
                                <>
                                  <Clock className="h-3 w-3 mr-1" />
                                  Draft
                                </>
                              )}
                            </Badge>
                          </div>
                          {store.description && (
                            <p className="text-sm text-[hsl(215,20%,65%)] mt-2">{store.description}</p>
                          )}
                        </CardHeader>
                        <CardContent className="p-6 pt-0">
                          <div className="flex items-center gap-2 mb-4 p-3 bg-[hsl(229,41%,16%)] rounded-lg">
                            <Switch 
                              checked={store.isPublic || false}
                              onCheckedChange={(checked) => handleTogglePublish(store.id, checked, store.name)}
                              disabled={togglePublishMutation.isPending}
                              data-testid={`switch-publish-${store.id}`}
                            />
                            <span className="text-sm text-[hsl(215,20%,65%)]">
                              {store.isPublic ? "Store is live" : "Store is in draft mode"}
                            </span>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 p-2 bg-[hsl(229,41%,16%)] rounded">
                              <Globe className="h-4 w-4 text-[hsl(215,20%,65%)]" />
                              <span className="text-sm font-mono text-[hsl(210,17%,98%)]">
                                {store.domain || `${store.subdomain}.argilette-store.com`}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-[hsl(215,20%,65%)] hover:bg-[hsl(228,47%,12%)]"
                                onClick={() => {
                                  const url = store.domain || `${store.subdomain}.argilette-store.com`;
                                  navigator.clipboard.writeText(`https://${url}`);
                                  toast({
                                    title: "Copied!",
                                    description: "Store URL copied to clipboard",
                                  });
                                }}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>

                            <div className="flex items-center gap-2">
                              <div 
                                className="w-4 h-4 rounded border border-[hsl(217,33%,17%)]"
                                style={{ backgroundColor: store.primaryColor }}
                              />
                              <span className="text-xs text-[hsl(215,20%,65%)]">Primary</span>
                              <div 
                                className="w-4 h-4 rounded border border-[hsl(217,33%,17%)] ml-2"
                                style={{ backgroundColor: store.secondaryColor }}
                              />
                              <span className="text-xs text-[hsl(215,20%,65%)]">Secondary</span>
                              <Badge className="ml-auto bg-[hsl(229,41%,16%)] text-[hsl(227,89%,63%)]">
                                {store.currency}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 mt-4">
                            <Button 
                              size="sm" 
                              className="flex-1 bg-[hsl(227,89%,63%)] hover:bg-[hsl(227,89%,55%)] text-white"
                              onClick={() => {
                                const url = store.domain || `${store.subdomain}.argilette-store.com`;
                                window.open(`https://${url}`, '_blank');
                              }}
                              data-testid={`button-visit-store-${store.id}`}
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Visit Store
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setLocation(`/store-preview/${store.id}`)}
                              className="border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)] hover:bg-[hsl(229,41%,16%)]"
                              data-testid={`button-preview-store-${store.id}`}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Preview
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)] hover:bg-[hsl(229,41%,16%)]"
                              data-testid={`button-edit-store-${store.id}`}
                            >
                              <Settings className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDeleteStore(store.id, store.name)}
                              disabled={deleteStoreMutation.isPending}
                              className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                              data-testid={`button-delete-store-${store.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="performance" className="space-y-6">
                <ShopifyPerformanceDashboard />
              </TabsContent>

              <TabsContent value="orders" className="space-y-6">
                <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-[hsl(210,17%,98%)]">
                      <ShoppingBag className="h-5 w-5" />
                      Order Management
                    </CardTitle>
                    <CardDescription className="text-[hsl(215,20%,65%)]">
                      Manage customer orders and fulfillment
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {Array.isArray(orders) && orders.length === 0 ? (
                      <div className="text-center py-8">
                        <ShoppingBag className="h-12 w-12 mx-auto text-[hsl(215,20%,65%)] mb-4" />
                        <p className="text-[hsl(215,20%,65%)]">No orders yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {Array.isArray(orders) && orders.map((order: any) => (
                          <div key={order.id} className="border border-[hsl(217,33%,17%)] rounded-lg p-4 bg-[hsl(229,41%,16%)]">
                            <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                              <div>
                                <h3 className="font-semibold text-[hsl(210,17%,98%)]">Order #{order.orderNumber}</h3>
                                <p className="text-sm text-[hsl(215,20%,65%)]">{order.customerEmail}</p>
                              </div>
                              <div className="text-right">
                                <Badge 
                                  className={
                                    order.status === 'delivered' ? 'bg-[hsl(160,84%,39%)/30%] text-[hsl(160,84%,39%)]' :
                                    order.status === 'shipped' ? 'bg-[hsl(227,89%,63%)/30%] text-[hsl(227,89%,63%)]' :
                                    order.status === 'processing' ? 'bg-[hsl(38,92%,50%)/30%] text-[hsl(38,92%,50%)]' : 'bg-red-500/30 text-red-400'
                                  }
                                >
                                  {order.status}
                                </Badge>
                                <p className="text-lg font-bold mt-1 text-[hsl(210,17%,98%)]">${order.totalAmount}</p>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-sm text-[hsl(215,20%,65%)]">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </span>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)] hover:bg-[hsl(228,47%,12%)]">
                                  <Mail className="h-4 w-4 mr-1" />
                                  Email Customer
                                </Button>
                                <Button size="sm" variant="outline" className="border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)] hover:bg-[hsl(228,47%,12%)]">
                                  <Truck className="h-4 w-4 mr-1" />
                                  Track Shipment
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="customers" className="space-y-6">
                <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-[hsl(210,17%,98%)]">
                      <Users className="h-5 w-5" />
                      Customer Management
                    </CardTitle>
                    <CardDescription className="text-[hsl(215,20%,65%)]">
                      View and manage your customers
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {Array.isArray(customers) && customers.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 mx-auto text-[hsl(215,20%,65%)] mb-4" />
                        <p className="text-[hsl(215,20%,65%)]">No customers yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {Array.isArray(customers) && customers.map((customer: any) => (
                          <div key={customer.id} className="border border-[hsl(217,33%,17%)] rounded-lg p-4 bg-[hsl(229,41%,16%)]">
                            <div className="flex flex-wrap justify-between items-start gap-2">
                              <div>
                                <h3 className="font-semibold text-[hsl(210,17%,98%)]">{customer.name}</h3>
                                <p className="text-sm text-[hsl(215,20%,65%)]">{customer.email}</p>
                              </div>
                              <Badge className="bg-[hsl(229,41%,16%)] text-[hsl(227,89%,63%)]">
                                {customer.orderCount || 0} orders
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews" className="space-y-6">
                <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-[hsl(210,17%,98%)]">
                      <Star className="h-5 w-5" />
                      Customer Reviews
                    </CardTitle>
                    <CardDescription className="text-[hsl(215,20%,65%)]">
                      Manage product reviews and ratings
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="border border-[hsl(217,33%,17%)] rounded-lg p-4 bg-[hsl(229,41%,16%)]">
                        <h3 className="font-semibold mb-3 text-[hsl(210,17%,98%)]">Add New Review</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="productSelect" className="text-[hsl(215,20%,65%)]">Product</Label>
                            <Select 
                              value={newReview.productId} 
                              onValueChange={(value) => setNewReview({...newReview, productId: value})}
                            >
                              <SelectTrigger className="bg-[hsl(228,47%,12%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)]">
                                <SelectValue placeholder="Select product" />
                              </SelectTrigger>
                              <SelectContent className="bg-[hsl(228,47%,12%)] border-[hsl(217,33%,17%)]">
                                {Array.isArray(products) && products.map((product: any) => (
                                  <SelectItem key={product.id} value={product.id.toString()} className="text-[hsl(210,17%,98%)] focus:bg-[hsl(229,41%,16%)]">
                                    {product.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="rating" className="text-[hsl(215,20%,65%)]">Rating</Label>
                            <Select 
                              value={newReview.rating.toString()} 
                              onValueChange={(value) => setNewReview({...newReview, rating: parseInt(value)})}
                            >
                              <SelectTrigger className="bg-[hsl(228,47%,12%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-[hsl(228,47%,12%)] border-[hsl(217,33%,17%)]">
                                {[5, 4, 3, 2, 1].map(rating => (
                                  <SelectItem key={rating} value={rating.toString()} className="text-[hsl(210,17%,98%)] focus:bg-[hsl(229,41%,16%)]">
                                    {rating} Star{rating !== 1 ? 's' : ''}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="md:col-span-2">
                            <Label htmlFor="comment" className="text-[hsl(215,20%,65%)]">Review Comment</Label>
                            <Textarea
                              value={newReview.comment}
                              onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                              placeholder="Write your review..."
                              className="bg-[hsl(228,47%,12%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)] placeholder:text-[hsl(215,20%,65%)]"
                            />
                          </div>
                        </div>
                        <Button 
                          onClick={() => createReviewMutation.mutate(newReview)}
                          disabled={createReviewMutation.isPending || !newReview.productId}
                          className="mt-4 bg-[hsl(227,89%,63%)] hover:bg-[hsl(227,89%,55%)] text-white"
                        >
                          {createReviewMutation.isPending ? 'Adding...' : 'Add Review'}
                        </Button>
                      </div>

                      {Array.isArray(reviews) && reviews.length === 0 ? (
                        <div className="text-center py-8">
                          <Star className="h-12 w-12 mx-auto text-[hsl(215,20%,65%)] mb-4" />
                          <p className="text-[hsl(215,20%,65%)]">No reviews yet</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {Array.isArray(reviews) && reviews.map((review: any) => (
                            <div key={review.id} className="border border-[hsl(217,33%,17%)] rounded-lg p-4 bg-[hsl(229,41%,16%)]">
                              <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                                <div>
                                  <h4 className="font-semibold text-[hsl(210,17%,98%)]">{review.productName}</h4>
                                  <div className="flex items-center gap-2">
                                    <div className="flex">
                                      {[...Array(5)].map((_, i) => (
                                        <Star 
                                          key={i} 
                                          className={`h-4 w-4 ${
                                            i < review.rating 
                                              ? 'text-[hsl(38,92%,50%)] fill-current' 
                                              : 'text-[hsl(215,20%,65%)]'
                                          }`} 
                                        />
                                      ))}
                                    </div>
                                    <span className="text-sm text-[hsl(215,20%,65%)]">{review.rating}/5</span>
                                  </div>
                                </div>
                                <span className="text-sm text-[hsl(215,20%,65%)]">
                                  {new Date(review.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-[hsl(210,17%,98%)]">{review.comment}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="coupons" className="space-y-6">
                <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-[hsl(210,17%,98%)]">
                      <Tag className="h-5 w-5" />
                      Discount Coupons
                    </CardTitle>
                    <CardDescription className="text-[hsl(215,20%,65%)]">
                      Create and manage discount coupons
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="border border-[hsl(217,33%,17%)] rounded-lg p-4 bg-[hsl(229,41%,16%)]">
                        <h3 className="font-semibold mb-3 text-[hsl(210,17%,98%)]">Create New Coupon</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="couponCode" className="text-[hsl(215,20%,65%)]">Coupon Code</Label>
                            <Input
                              value={newCoupon.code}
                              onChange={(e) => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})}
                              placeholder="SAVE20"
                              className="bg-[hsl(228,47%,12%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)] placeholder:text-[hsl(215,20%,65%)]"
                            />
                          </div>
                          <div>
                            <Label htmlFor="couponType" className="text-[hsl(215,20%,65%)]">Discount Type</Label>
                            <Select 
                              value={newCoupon.type} 
                              onValueChange={(value) => setNewCoupon({...newCoupon, type: value})}
                            >
                              <SelectTrigger className="bg-[hsl(228,47%,12%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-[hsl(228,47%,12%)] border-[hsl(217,33%,17%)]">
                                <SelectItem value="percentage" className="text-[hsl(210,17%,98%)] focus:bg-[hsl(229,41%,16%)]">Percentage</SelectItem>
                                <SelectItem value="fixed" className="text-[hsl(210,17%,98%)] focus:bg-[hsl(229,41%,16%)]">Fixed Amount</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="couponValue" className="text-[hsl(215,20%,65%)]">
                              {newCoupon.type === 'percentage' ? 'Percentage (%)' : 'Amount ($)'}
                            </Label>
                            <Input
                              type="number"
                              value={newCoupon.value}
                              onChange={(e) => setNewCoupon({...newCoupon, value: parseFloat(e.target.value)})}
                              placeholder={newCoupon.type === 'percentage' ? '20' : '10.00'}
                              className="bg-[hsl(228,47%,12%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)] placeholder:text-[hsl(215,20%,65%)]"
                            />
                          </div>
                          <div>
                            <Label htmlFor="minOrder" className="text-[hsl(215,20%,65%)]">Minimum Order ($)</Label>
                            <Input
                              type="number"
                              value={newCoupon.minOrderAmount}
                              onChange={(e) => setNewCoupon({...newCoupon, minOrderAmount: parseFloat(e.target.value)})}
                              placeholder="50.00"
                              className="bg-[hsl(228,47%,12%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)] placeholder:text-[hsl(215,20%,65%)]"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label htmlFor="expiresAt" className="text-[hsl(215,20%,65%)]">Expiration Date</Label>
                            <Input
                              type="datetime-local"
                              value={newCoupon.expiresAt}
                              onChange={(e) => setNewCoupon({...newCoupon, expiresAt: e.target.value})}
                              className="bg-[hsl(228,47%,12%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)]"
                            />
                          </div>
                        </div>
                        <Button 
                          onClick={() => createCouponMutation.mutate(newCoupon)}
                          disabled={createCouponMutation.isPending || !newCoupon.code}
                          className="mt-4 bg-[hsl(227,89%,63%)] hover:bg-[hsl(227,89%,55%)] text-white"
                        >
                          {createCouponMutation.isPending ? 'Creating...' : 'Create Coupon'}
                        </Button>
                      </div>

                      {Array.isArray(coupons) && coupons.length === 0 ? (
                        <div className="text-center py-8">
                          <Tag className="h-12 w-12 mx-auto text-[hsl(215,20%,65%)] mb-4" />
                          <p className="text-[hsl(215,20%,65%)]">No coupons created yet</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Array.isArray(coupons) && coupons.map((coupon: any) => (
                            <div key={coupon.id} className="border border-[hsl(217,33%,17%)] rounded-lg p-4 bg-[hsl(229,41%,16%)]">
                              <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                                <div>
                                  <h4 className="font-bold text-lg text-[hsl(210,17%,98%)]">{coupon.code}</h4>
                                  <p className="text-sm text-[hsl(215,20%,65%)]">
                                    {coupon.type === 'percentage' 
                                      ? `${coupon.value}% off` 
                                      : `$${coupon.value} off`
                                    }
                                  </p>
                                </div>
                                <Badge className={coupon.isActive ? "bg-[hsl(160,84%,39%)/30%] text-[hsl(160,84%,39%)]" : "bg-[hsl(229,41%,16%)] text-[hsl(215,20%,65%)]"}>
                                  {coupon.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                              
                              <div className="space-y-1 text-sm text-[hsl(215,20%,65%)]">
                                {coupon.minOrderAmount > 0 && (
                                  <p>Min order: ${coupon.minOrderAmount}</p>
                                )}
                                {coupon.expiresAt && (
                                  <p>Expires: {new Date(coupon.expiresAt).toLocaleDateString()}</p>
                                )}
                                <p>Used: {coupon.usedCount || 0} times</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-[hsl(210,17%,98%)]">
                      <BarChart3 className="h-5 w-5" />
                      E-commerce Analytics
                    </CardTitle>
                    <CardDescription className="text-[hsl(215,20%,65%)]">
                      Advanced analytics and conversion tracking
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="font-semibold text-[hsl(210,17%,98%)]">Sales Metrics</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-[hsl(215,20%,65%)]">Total Revenue:</span>
                            <span className="font-bold text-[hsl(210,17%,98%)]">${totalRevenue.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[hsl(215,20%,65%)]">Average Order Value:</span>
                            <span className="font-bold text-[hsl(210,17%,98%)]">${averageOrderValue.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[hsl(215,20%,65%)]">Conversion Rate:</span>
                            <span className="font-bold text-[hsl(210,17%,98%)]">{conversionRate.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[hsl(215,20%,65%)]">Total Orders:</span>
                            <span className="font-bold text-[hsl(210,17%,98%)]">{Array.isArray(orders) ? orders.length : 0}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="font-semibold text-[hsl(210,17%,98%)]">Customer Metrics</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-[hsl(215,20%,65%)]">Total Customers:</span>
                            <span className="font-bold text-[hsl(215,20%,65%)]">0</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[hsl(215,20%,65%)]">Active Products:</span>
                            <span className="font-bold text-[hsl(215,20%,65%)]">0</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[hsl(215,20%,65%)]">Total Reviews:</span>
                            <span className="font-bold text-[hsl(215,20%,65%)]">0</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[hsl(215,20%,65%)]">Active Coupons:</span>
                            <span className="font-bold text-[hsl(210,17%,98%)]">
                              {Array.isArray(coupons) ? coupons.filter(c => c.isActive).length : 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-[hsl(210,17%,98%)]">
                      <Settings className="h-5 w-5" />
                      E-commerce Settings
                    </CardTitle>
                    <CardDescription className="text-[hsl(215,20%,65%)]">
                      Configure your e-commerce platform
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="storeName" className="text-[hsl(215,20%,65%)]">Store Name</Label>
                          <Input 
                            defaultValue="ARGILETTE Store" 
                            className="bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)]"
                          />
                        </div>
                        <div>
                          <Label htmlFor="currency" className="text-[hsl(215,20%,65%)]">Currency</Label>
                          <Select defaultValue="USD">
                            <SelectTrigger className="bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[hsl(228,47%,12%)] border-[hsl(217,33%,17%)]">
                              <SelectItem value="USD" className="text-[hsl(210,17%,98%)] focus:bg-[hsl(229,41%,16%)]">USD ($) - US Dollar</SelectItem>
                              <SelectItem value="EUR" className="text-[hsl(210,17%,98%)] focus:bg-[hsl(229,41%,16%)]">EUR (€) - Euro</SelectItem>
                              <SelectItem value="GBP" className="text-[hsl(210,17%,98%)] focus:bg-[hsl(229,41%,16%)]">GBP (£) - British Pound</SelectItem>
                              <SelectItem value="CAD" className="text-[hsl(210,17%,98%)] focus:bg-[hsl(229,41%,16%)]">CAD (C$) - Canadian Dollar</SelectItem>
                              <SelectItem value="AUD" className="text-[hsl(210,17%,98%)] focus:bg-[hsl(229,41%,16%)]">AUD (A$) - Australian Dollar</SelectItem>
                              <SelectItem value="JPY" className="text-[hsl(210,17%,98%)] focus:bg-[hsl(229,41%,16%)]">JPY (¥) - Japanese Yen</SelectItem>
                              
                              {CURRENCIES.filter(c => c.region === "Africa").map((currency) => (
                                <SelectItem key={currency.code} value={currency.code} className="text-[hsl(210,17%,98%)] focus:bg-[hsl(229,41%,16%)]">
                                  {currency.code} ({currency.symbol}) - {currency.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="taxRate" className="text-[hsl(215,20%,65%)]">Tax Rate (%)</Label>
                          <Input 
                            type="number" 
                            defaultValue="8" 
                            className="bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)]"
                          />
                        </div>
                        <div>
                          <Label htmlFor="shipping" className="text-[hsl(215,20%,65%)]">Free Shipping Threshold ($)</Label>
                          <Input 
                            type="number" 
                            defaultValue="50" 
                            className="bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)]"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="font-semibold text-[hsl(210,17%,98%)]">Features</h3>
                        <div className="space-y-2">
                          <label className="flex items-center space-x-2">
                            <input type="checkbox" defaultChecked className="accent-[hsl(227,89%,63%)]" />
                            <span className="text-[hsl(210,17%,98%)]">Enable customer reviews</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input type="checkbox" defaultChecked className="accent-[hsl(227,89%,63%)]" />
                            <span className="text-[hsl(210,17%,98%)]">Enable coupon system</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input type="checkbox" defaultChecked className="accent-[hsl(227,89%,63%)]" />
                            <span className="text-[hsl(210,17%,98%)]">Send order confirmation emails</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input type="checkbox" defaultChecked className="accent-[hsl(227,89%,63%)]" />
                            <span className="text-[hsl(210,17%,98%)]">Enable inventory tracking</span>
                          </label>
                        </div>
                      </div>

                      <Button className="bg-[hsl(227,89%,63%)] hover:bg-[hsl(227,89%,55%)] text-white">Save Settings</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>

          <AlertDialog open={unpublishDialogOpen} onOpenChange={setUnpublishDialogOpen}>
            <AlertDialogContent data-testid="dialog-unpublish-confirm" className="bg-[hsl(228,47%,12%)] border-[hsl(217,33%,17%)]">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-[hsl(210,17%,98%)]">Unpublish Store?</AlertDialogTitle>
                <AlertDialogDescription className="text-[hsl(215,20%,65%)]">
                  Are you sure you want to unpublish "{storeToUnpublish?.name}"? 
                  Customers will no longer be able to access this store.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel 
                  data-testid="button-cancel-unpublish"
                  className="border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)] hover:bg-[hsl(229,41%,16%)]"
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={confirmUnpublish}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  data-testid="button-confirm-unpublish"
                >
                  Unpublish Store
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Layout>
  );
}
