import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  Eye
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { CURRENCIES } from '@shared/currencies';
import Layout from '@/components/layout';

// Import our shopping cart component
import ShoppingCartComponent, { AddToCartButton } from '@/components/shopping-cart';
import ShopifyPerformanceDashboard from '@/components/shopify-performance-dashboard';
import { StoreLaunchWizard } from '@/components/store-launch-wizard';

export default function EcommerceDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
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

  // Product creation state
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

  // Store configuration state
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

  // Fetch products with search and filtering
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

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/ecommerce/categories'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/ecommerce/categories');
      return await response.json();
    }
  });

  // Fetch orders
  const { data: orders = [] } = useQuery({
    queryKey: ['/api/ecommerce/orders'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/ecommerce/orders');
      return await response.json();
    }
  });

  // Fetch customers
  const { data: customers = [] } = useQuery({
    queryKey: ['/api/ecommerce/customers'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/ecommerce/customers');
      return await response.json();
    }
  });

  // Fetch reviews
  const { data: reviews = [] } = useQuery({
    queryKey: ['/api/ecommerce/reviews'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/ecommerce/reviews');
      return await response.json();
    }
  });

  // Fetch coupons
  const { data: coupons = [] } = useQuery({
    queryKey: ['/api/ecommerce/coupons'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/ecommerce/coupons');
      return await response.json();
    }
  });

  // Fetch stores
  const { data: stores = [], refetch: refetchStores } = useQuery({
    queryKey: ['/api/ecommerce/stores'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/ecommerce/stores');
      return await response.json();
    }
  });

  // Analytics data - all counters reset to zero
  const totalRevenue = 0;
  const averageOrderValue = 0;
  const conversionRate = 0;
  const totalOrders = 0;
  const totalProducts = 0;
  const totalCustomers = 0;
  const totalStores = 0;

  // Create review mutation
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

  // Create coupon mutation
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

  // Create product mutation
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

  // Delete store mutation
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

  // Handle store deletion with confirmation
  const handleDeleteStore = (storeId: number, storeName: string) => {
    if (window.confirm(`Are you sure you want to delete the store "${storeName}"? This action cannot be undone.`)) {
      deleteStoreMutation.mutate(storeId);
    }
  };

  // Create store mutation
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
      
      // Force immediate refetch of stores data
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

  // Filter products based on search and category
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

  // Show wizard if triggered
  if (showLaunchWizard) {
    return <StoreLaunchWizard onClose={() => setShowLaunchWizard(false)} />;
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-8">
      {/* Header with Shopping Cart */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">E-commerce Dashboard</h1>
          <p className="text-gray-600">Complete e-commerce management system</p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            onClick={() => setShowLaunchWizard(true)}
            data-testid="button-launch-store"
          >
            <Zap className="h-4 w-4 mr-2" />
            Launch New Store
          </Button>
          <ShoppingCartComponent />
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Store Settings
          </Button>
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-400">$0.00</div>
            <p className="text-xs text-muted-foreground">
              0% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-400">0</div>
            <p className="text-xs text-muted-foreground">
              0% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-400">0</div>
            <p className="text-xs text-muted-foreground">
              0% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              0% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="products" className="space-y-6">
        <TabsList className="w-full justify-start bg-gray-100 dark:bg-gray-800 p-1">
          <TabsTrigger value="products" className="gap-2" data-testid="tab-products">
            <Package className="h-4 w-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="stores" className="gap-2" data-testid="tab-stores">
            <Store className="h-4 w-4" />
            Stores
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-2" data-testid="tab-performance">
            <TrendingUp className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2" data-testid="tab-orders">
            <ShoppingCart className="h-4 w-4" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="customers" className="gap-2" data-testid="tab-customers">
            <Users className="h-4 w-4" />
            Customers
          </TabsTrigger>
          <TabsTrigger value="reviews" className="gap-2" data-testid="tab-reviews">
            <Star className="h-4 w-4" />
            Reviews
          </TabsTrigger>
          <TabsTrigger value="coupons" className="gap-2" data-testid="tab-coupons">
            <Tag className="h-4 w-4" />
            Coupons
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2" data-testid="tab-analytics">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2" data-testid="tab-settings">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <div>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          {/* Products Header with Add Button */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Products</h2>
              <p className="text-gray-600">Manage your product catalog</p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                  <DialogDescription>
                    Create a new product for your store
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Product Name *</Label>
                      <Input
                        id="name"
                        placeholder="Enter product name"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sku">SKU</Label>
                      <Input
                        id="sku"
                        placeholder="Product SKU"
                        value={newProduct.sku}
                        onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Product description"
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Price *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="compareAtPrice">Compare at Price</Label>
                      <Input
                        id="compareAtPrice"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={newProduct.compareAtPrice}
                        onChange={(e) => setNewProduct({...newProduct, compareAtPrice: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="inventoryQuantity">Inventory Quantity *</Label>
                      <Input
                        id="inventoryQuantity"
                        type="number"
                        placeholder="0"
                        value={newProduct.inventoryQuantity}
                        onChange={(e) => setNewProduct({...newProduct, inventoryQuantity: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select 
                        value={newProduct.categoryId} 
                        onValueChange={(value) => setNewProduct({...newProduct, categoryId: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.isArray(categories) && categories.map((category: any) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <DialogTrigger asChild>
                      <Button variant="outline">Cancel</Button>
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
                    >
                      {createProductMutation.isPending ? 'Creating...' : 'Create Product'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search and Filter Bar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
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
                    className="w-full"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {Array.isArray(categories) && categories.map((category: any) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {productsLoading ? (
              <div className="col-span-full text-center py-8">Loading products...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No products found</p>
              </div>
            ) : (
              filteredProducts.map((product: any) => (
                <Card key={product.id} className="overflow-hidden">
                  {product.images?.[0] && (
                    <img 
                      src={product.images[0]} 
                      alt={product.name}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">{product.name}</h3>
                      <Badge variant={product.inventoryQuantity > 0 ? "default" : "destructive"}>
                        {product.inventoryQuantity > 0 ? "In Stock" : "Out of Stock"}
                      </Badge>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {product.description}
                    </p>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl font-bold">${product.price}</span>
                      {product.compareAtPrice && (
                        <span className="text-sm text-gray-500 line-through">
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
                                ? 'text-yellow-400 fill-current' 
                                : 'text-gray-300'
                            }`} 
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        ({product.reviewCount || 0} reviews)
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <AddToCartButton product={product} />
                      <Button variant="outline" size="sm">
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Store Configuration Tab */}
        <TabsContent value="stores" className="space-y-6">
          {/* Store Header with Create Button */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Store Configuration</h2>
              <p className="text-gray-600">Manage your online stores and generate web links</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => refetchStores()}
                className="border-gray-300 hover:border-gray-400"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Store className="h-4 w-4" />
                    Create Store
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Store</DialogTitle>
                  <DialogDescription>
                    Set up a new online store with a unique web link
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="storeName">Store Name *</Label>
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
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subdomain">Subdomain *</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="subdomain"
                          placeholder="mystore"
                          value={newStore.subdomain}
                          onChange={(e) => setNewStore({...newStore, subdomain: e.target.value.toLowerCase()})}
                        />
                        <span className="text-sm text-gray-500">.argilette-store.com</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="storeDescription">Description</Label>
                    <Textarea
                      id="storeDescription"
                      placeholder="Store description"
                      value={newStore.description}
                      onChange={(e) => setNewStore({...newStore, description: e.target.value})}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primaryColor">Primary Color</Label>
                      <Input
                        id="primaryColor"
                        type="color"
                        value={newStore.primaryColor}
                        onChange={(e) => setNewStore({...newStore, primaryColor: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="secondaryColor">Secondary Color</Label>
                      <Input
                        id="secondaryColor"
                        type="color"
                        value={newStore.secondaryColor}
                        onChange={(e) => setNewStore({...newStore, secondaryColor: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select 
                        value={newStore.currency} 
                        onValueChange={(value) => setNewStore({...newStore, currency: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map((currency) => (
                            <SelectItem key={currency.code} value={currency.code}>
                              {currency.symbol} {currency.code} - {currency.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customDomain">Custom Domain (Optional)</Label>
                      <Input
                        id="customDomain"
                        placeholder="www.mystore.com"
                        value={newStore.domain}
                        onChange={(e) => setNewStore({...newStore, domain: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <DialogTrigger asChild>
                      <Button variant="outline">Cancel</Button>
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
                    >
                      {createStoreMutation.isPending ? 'Creating...' : 'Create Store'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            </div>
          </div>

          {/* Stores Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.isArray(stores) && stores.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <Store className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No stores created yet</p>
                <p className="text-sm text-gray-400 mt-2">Create your first store to get started</p>
              </div>
            ) : (
              Array.isArray(stores) && stores.map((store: any) => (
                <Card key={store.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{store.name}</h3>
                        <p className="text-sm text-gray-600">{store.description}</p>
                      </div>
                      <Badge variant={store.isActive ? "default" : "secondary"}>
                        {store.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <Globe className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-mono">
                          {store.domain || `${store.subdomain}.argilette-store.com`}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
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
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: store.primaryColor }}
                        />
                        <span className="text-xs text-gray-500">Primary</span>
                        <div 
                          className="w-4 h-4 rounded border ml-2"
                          style={{ backgroundColor: store.secondaryColor }}
                        />
                        <span className="text-xs text-gray-500">Secondary</span>
                        <Badge variant="outline" className="ml-auto">
                          {store.currency}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button 
                        size="sm" 
                        className="flex-1"
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
                        onClick={() => navigate(`/store-preview/${store.id}`)}
                        data-testid={`button-preview-store-${store.id}`}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
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
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
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

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <ShopifyPerformanceDashboard />
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Order Management
              </CardTitle>
              <CardDescription>
                Manage customer orders and fulfillment
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Array.isArray(orders) && orders.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingBag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No orders yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Array.isArray(orders) && orders.map((order: any) => (
                    <div key={order.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">Order #{order.orderNumber}</h3>
                          <p className="text-sm text-gray-600">{order.customerEmail}</p>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={
                              order.status === 'delivered' ? 'default' :
                              order.status === 'shipped' ? 'secondary' :
                              order.status === 'processing' ? 'outline' : 'destructive'
                            }
                          >
                            {order.status}
                          </Badge>
                          <p className="text-lg font-bold mt-1">${order.totalAmount}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Mail className="h-4 w-4 mr-1" />
                            Email Customer
                          </Button>
                          <Button size="sm" variant="outline">
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

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Customer Reviews
              </CardTitle>
              <CardDescription>
                Manage product reviews and ratings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Add Review Form */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="font-semibold mb-3">Add New Review</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="productSelect">Product</Label>
                      <Select 
                        value={newReview.productId} 
                        onValueChange={(value) => setNewReview({...newReview, productId: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.isArray(products) && products.map((product: any) => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="rating">Rating</Label>
                      <Select 
                        value={newReview.rating.toString()} 
                        onValueChange={(value) => setNewReview({...newReview, rating: parseInt(value)})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[5, 4, 3, 2, 1].map(rating => (
                            <SelectItem key={rating} value={rating.toString()}>
                              {rating} Star{rating !== 1 ? 's' : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="comment">Review Comment</Label>
                      <Textarea
                        value={newReview.comment}
                        onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                        placeholder="Write your review..."
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={() => createReviewMutation.mutate(newReview)}
                    disabled={createReviewMutation.isPending || !newReview.productId}
                    className="mt-4"
                  >
                    {createReviewMutation.isPending ? 'Adding...' : 'Add Review'}
                  </Button>
                </div>

                {/* Reviews List */}
                {Array.isArray(reviews) && reviews.length === 0 ? (
                  <div className="text-center py-8">
                    <Star className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">No reviews yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Array.isArray(reviews) && reviews.map((review: any) => (
                      <div key={review.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold">{review.productName}</h4>
                            <div className="flex items-center gap-2">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`h-4 w-4 ${
                                      i < review.rating 
                                        ? 'text-yellow-400 fill-current' 
                                        : 'text-gray-300'
                                    }`} 
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-gray-600">{review.rating}/5</span>
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-700">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Coupons Tab */}
        <TabsContent value="coupons" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Discount Coupons
              </CardTitle>
              <CardDescription>
                Create and manage discount coupons
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Create Coupon Form */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="font-semibold mb-3">Create New Coupon</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="couponCode">Coupon Code</Label>
                      <Input
                        value={newCoupon.code}
                        onChange={(e) => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})}
                        placeholder="SAVE20"
                      />
                    </div>
                    <div>
                      <Label htmlFor="couponType">Discount Type</Label>
                      <Select 
                        value={newCoupon.type} 
                        onValueChange={(value) => setNewCoupon({...newCoupon, type: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="fixed">Fixed Amount</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="couponValue">
                        {newCoupon.type === 'percentage' ? 'Percentage (%)' : 'Amount ($)'}
                      </Label>
                      <Input
                        type="number"
                        value={newCoupon.value}
                        onChange={(e) => setNewCoupon({...newCoupon, value: parseFloat(e.target.value)})}
                        placeholder={newCoupon.type === 'percentage' ? '20' : '10.00'}
                      />
                    </div>
                    <div>
                      <Label htmlFor="minOrder">Minimum Order ($)</Label>
                      <Input
                        type="number"
                        value={newCoupon.minOrderAmount}
                        onChange={(e) => setNewCoupon({...newCoupon, minOrderAmount: parseFloat(e.target.value)})}
                        placeholder="50.00"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="expiresAt">Expiration Date</Label>
                      <Input
                        type="datetime-local"
                        value={newCoupon.expiresAt}
                        onChange={(e) => setNewCoupon({...newCoupon, expiresAt: e.target.value})}
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={() => createCouponMutation.mutate(newCoupon)}
                    disabled={createCouponMutation.isPending || !newCoupon.code}
                    className="mt-4"
                  >
                    {createCouponMutation.isPending ? 'Creating...' : 'Create Coupon'}
                  </Button>
                </div>

                {/* Coupons List */}
                {Array.isArray(coupons) && coupons.length === 0 ? (
                  <div className="text-center py-8">
                    <Tag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">No coupons created yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.isArray(coupons) && coupons.map((coupon: any) => (
                      <div key={coupon.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-bold text-lg">{coupon.code}</h4>
                            <p className="text-sm text-gray-600">
                              {coupon.type === 'percentage' 
                                ? `${coupon.value}% off` 
                                : `$${coupon.value} off`
                              }
                            </p>
                          </div>
                          <Badge variant={coupon.isActive ? "default" : "secondary"}>
                            {coupon.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1 text-sm text-gray-600">
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

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                E-commerce Analytics
              </CardTitle>
              <CardDescription>
                Advanced analytics and conversion tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Sales Metrics</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Revenue:</span>
                      <span className="font-bold">${totalRevenue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Order Value:</span>
                      <span className="font-bold">${averageOrderValue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Conversion Rate:</span>
                      <span className="font-bold">{conversionRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Orders:</span>
                      <span className="font-bold">{Array.isArray(orders) ? orders.length : 0}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Customer Metrics</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Customers:</span>
                      <span className="font-bold text-gray-400">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Products:</span>
                      <span className="font-bold text-gray-400">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Reviews:</span>
                      <span className="font-bold text-gray-400">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Coupons:</span>
                      <span className="font-bold">
                        {Array.isArray(coupons) ? coupons.filter(c => c.isActive).length : 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                E-commerce Settings
              </CardTitle>
              <CardDescription>
                Configure your e-commerce platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="storeName">Store Name</Label>
                    <Input defaultValue="ARGILETTE Store" />
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select defaultValue="USD">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Major Global Currencies */}
                        <SelectItem value="USD">USD ($) - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR (€) - Euro</SelectItem>
                        <SelectItem value="GBP">GBP (£) - British Pound</SelectItem>
                        <SelectItem value="CAD">CAD (C$) - Canadian Dollar</SelectItem>
                        <SelectItem value="AUD">AUD (A$) - Australian Dollar</SelectItem>
                        <SelectItem value="JPY">JPY (¥) - Japanese Yen</SelectItem>
                        
                        {/* African Currencies */}
                        {CURRENCIES.filter(c => c.region === "Africa").map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.code} ({currency.symbol}) - {currency.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                    <Input type="number" defaultValue="8" />
                  </div>
                  <div>
                    <Label htmlFor="shipping">Free Shipping Threshold ($)</Label>
                    <Input type="number" defaultValue="50" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold">Features</h3>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked />
                      <span>Enable customer reviews</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked />
                      <span>Enable coupon system</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked />
                      <span>Send order confirmation emails</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked />
                      <span>Enable inventory tracking</span>
                    </label>
                  </div>
                </div>

                <Button>Save Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        </div>
      </Tabs>
      </div>
    </Layout>
  );
}