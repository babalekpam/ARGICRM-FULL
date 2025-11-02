import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, ShoppingCart, AlertTriangle, TrendingUp, TrendingDown, BarChart3, Search, Plus, Edit, Trash2, Eye, RefreshCw, Truck, Calendar, DollarSign, Archive, Upload, FileSpreadsheet, Trash, CheckSquare, Square } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { SpreadsheetUpload } from "@/components/spreadsheet-upload";

interface Product {
  id: string;
  name: string;
  sku?: string;
  description?: string;
  category?: string;
  price: number;
  cost?: number;
  quantityOnHand?: number;
  reorderLevel?: number;
  maxStockLevel?: number;
  status?: string;
  supplier?: string;
  location?: string;
  lastRestocked?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  status: string;
  type: 'purchase' | 'sale';
  totalAmount: number;
  orderDate: Date;
  expectedDelivery?: Date;
  items: OrderItem[];
  notes?: string;
}

interface Operation {
  id: string;
  name: string;
  type: string;
  status: string;
  priority?: string;
  assignedTo?: string;
  dueDate?: string;
  createdAt: string;
}

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export default function InventoryManagementPage() {
  const [activeTab, setActiveTab] = useState("inventory");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateProductOpen, setIsCreateProductOpen] = useState(false);
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [operationsSpreadsheetUploadOpen, setOperationsSpreadsheetUploadOpen] = useState(false);
  const [ordersSpreadsheetUploadOpen, setOrdersSpreadsheetUploadOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch products
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['/api/products'],
    enabled: true,
  });

  // Fetch orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['/api/orders'],
    enabled: true,
  });

  // Fetch operations
  const { data: operationsResponse, isLoading: operationsLoading } = useQuery({
    queryKey: ['/api/operations'],
    enabled: true,
  });

  const operations: Operation[] = operationsResponse?.data || [];

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/products', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setIsCreateProductOpen(false);
      toast({ title: "Product created successfully" });
      // Reset form
      const form = document.querySelector('#product-form') as HTMLFormElement;
      if (form) form.reset();
    },
    onError: (error: any) => {
      console.error('Product creation error:', error);
      toast({ 
        title: "Error creating product", 
        description: error?.message || "Please try again",
        variant: "destructive" 
      });
    }
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/orders', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      setIsCreateOrderOpen(false);
      toast({ title: "Order created successfully" });
    },
    onError: (error: any) => {
      console.error('Order creation error:', error);
      toast({ 
        title: "Error creating order", 
        description: error?.message || 'Unknown error occurred',
        variant: "destructive" 
      });
    }
  });

  // Bulk delete products mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: (productIds: string[]) => apiRequest('DELETE', '/api/products/bulk', { productIds }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setSelectedProducts(new Set());
      setIsDeleteDialogOpen(false);
      toast({ 
        title: `Successfully deleted ${selectedProducts.size} products`,
        description: `Products have been permanently removed from inventory.`
      });
    },
    onError: (error: any) => {
      console.error('Bulk delete error:', error);
      toast({ 
        title: "Error deleting products", 
        description: error?.message || 'Failed to delete selected products',
        variant: "destructive" 
      });
    }
  });

  // Edit product mutation
  const editProductMutation = useMutation({
    mutationFn: async (data: { id: string; updates: any }) => {
      const response = await fetch(`/api/products/${data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-email': 'abel@argilette.org',
          'authorization': 'Bearer demo-token'
        },
        body: JSON.stringify(data.updates)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update product');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setIsEditDialogOpen(false);
      setEditingProduct(null);
      toast({ 
        title: "Product updated successfully",
        description: "Product information has been saved."
      });
    },
    onError: (error: any) => {
      console.error('Product edit error:', error);
      toast({ 
        title: "Error updating product", 
        description: error?.message || 'Failed to update product',
        variant: "destructive" 
      });
    }
  });

  // Helper functions for multi-select
  const toggleProductSelection = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map((p: Product) => p.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedProducts.size === 0) return;
    setIsDeleteDialogOpen(true);
  };

  const confirmBulkDelete = () => {
    const productIds = Array.from(selectedProducts);
    bulkDeleteMutation.mutate(productIds);
  };

  // Edit product functions
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsEditDialogOpen(true);
  };

  const handleSaveProduct = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingProduct) return;
    
    const formData = new FormData(event.currentTarget);
    const updates = {
      name: formData.get('name') as string,
      sku: formData.get('sku') as string,
      description: formData.get('description') as string,
      category: formData.get('category') as string,
      price: parseFloat(formData.get('price') as string),
      cost: parseFloat(formData.get('cost') as string) || undefined,
      quantityOnHand: parseInt(formData.get('quantityOnHand') as string) || 0,
      reorderLevel: parseInt(formData.get('reorderLevel') as string) || 0,
      maxStockLevel: parseInt(formData.get('maxStockLevel') as string) || undefined,
      supplier: formData.get('supplier') as string,
      status: formData.get('status') as string
    };
    
    editProductMutation.mutate({ id: editingProduct.id, updates });
  };

  // Filter products
  const filteredProducts = products.filter((product: Product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || (product.status && product.status === statusFilter);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Calculate inventory statistics
  const inventoryStats = {
    totalProducts: products.length,
    lowStock: products.filter((p: Product) => (p.stockQuantity || p.quantityOnHand) && p.reorderLevel && (p.stockQuantity || p.quantityOnHand) <= p.reorderLevel).length,
    outOfStock: products.filter((p: Product) => (p.stockQuantity || p.quantityOnHand) === 0).length,
    totalValue: products.reduce((sum: number, p: Product) => sum + (((p.stockQuantity || p.quantityOnHand) || 0) * (p.cost || p.price)), 0),
  };

  const getStockStatus = (product: Product) => {
    const stock = product.stockQuantity || product.quantityOnHand || 0;
    if (!stock || stock === 0) return { status: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    if (product.reorderLevel && stock <= product.reorderLevel) return { status: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    if (product.maxStockLevel && stock > product.maxStockLevel) return { status: 'Overstock', color: 'bg-purple-100 text-purple-800' };
    return { status: product.isActive ? 'Active' : 'Inactive', color: product.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800' };
  };

  const getOrderStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'processing': 'bg-blue-100 text-blue-800',
      'shipped': 'bg-purple-100 text-purple-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <Package className="h-8 w-8 text-amber-600" />
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                Inventory & Order Management
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-lg">
                Manage products, stock levels, and orders with intelligent automation
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
              <div className="w-2 h-2 bg-amber-500 rounded-full mr-2 animate-pulse"></div>
              Smart Inventory
            </Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
              Real-time Updates
            </Badge>
            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
              AI Analytics
            </Badge>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <Button variant="outline" className="bg-white shadow-md border-slate-200">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </Button>
          <Dialog open={isCreateOrderOpen} onOpenChange={setIsCreateOrderOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-lg">
                <ShoppingCart className="h-4 w-4 mr-2" />
                New Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Order</DialogTitle>
                <DialogDescription>
                  Add a new purchase or sales order
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const orderData = {
                  customerName: formData.get('customerName'),
                  type: formData.get('type'),
                  totalAmount: parseFloat(formData.get('totalAmount') as string),
                  notes: formData.get('notes'),
                };
                console.log('Creating order with data:', orderData);
                createOrderMutation.mutate(orderData);
              }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input name="customerName" placeholder="Customer/Supplier name" required />
                  <Select name="type" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Order type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sale">Sales Order</SelectItem>
                      <SelectItem value="purchase">Purchase Order</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input 
                  name="totalAmount" 
                  type="number" 
                  step="0.01" 
                  placeholder="Total amount" 
                  required 
                />
                <Textarea name="notes" placeholder="Order notes (optional)" />
                <Button type="submit" disabled={createOrderMutation.isPending}>
                  {createOrderMutation.isPending ? "Creating..." : "Create Order"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateProductOpen} onOpenChange={setIsCreateProductOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>
                  Add a new product to your inventory
                </DialogDescription>
              </DialogHeader>
              <form id="product-form" onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                
                const productData = {
                  name: formData.get('name') as string || '',
                  sku: formData.get('sku') as string || '',
                  description: formData.get('description') as string || '',
                  category: formData.get('category') as string || '',
                  price: parseFloat(formData.get('price') as string) || 0,
                  cost: parseFloat(formData.get('cost') as string) || 0,
                  stockQuantity: parseInt(formData.get('quantityOnHand') as string) || 0,
                  reorderLevel: parseInt(formData.get('reorderLevel') as string) || 0,
                  supplierId: formData.get('supplier') as string || null,
                };
                
                console.log('Submitting product data:', productData);
                createProductMutation.mutate(productData);
              }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input name="name" placeholder="Product name" required />
                  <Input name="sku" placeholder="SKU" required />
                </div>
                <Textarea name="description" placeholder="Product description" />
                <div className="grid grid-cols-2 gap-4">
                  <Input name="category" placeholder="Category" />
                  <Input name="supplier" placeholder="Supplier" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input name="price" type="number" step="0.01" placeholder="Sale price" required />
                  <Input name="cost" type="number" step="0.01" placeholder="Cost price" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Input name="quantityOnHand" type="number" placeholder="Current stock" />
                  <Input name="reorderLevel" type="number" placeholder="Reorder level" />
                  <Input name="maxStockLevel" type="number" placeholder="Max stock" />
                </div>
                <Input name="location" placeholder="Storage location" />
                <Button type="submit" disabled={createProductMutation.isPending}>
                  {createProductMutation.isPending ? "Adding..." : "Add Product"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold">{inventoryStats.totalProducts}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Stock Items</p>
                <p className="text-2xl font-bold text-yellow-600">{inventoryStats.lowStock}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{inventoryStats.outOfStock}</p>
              </div>
              <Archive className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inventory Value</p>
                <p className="text-2xl font-bold">${inventoryStats.totalValue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Layout */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="w-full justify-start bg-gray-100 dark:bg-gray-800 p-1">
          <TabsTrigger value="inventory" className="gap-2" data-testid="tab-inventory">
            <Package className="h-4 w-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2" data-testid="tab-orders">
            <ShoppingCart className="h-4 w-4" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="operations" className="gap-2" data-testid="tab-operations">
            <Upload className="h-4 w-4" />
            Operations
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2" data-testid="tab-analytics">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="gap-2" data-testid="tab-suppliers">
            <Truck className="h-4 w-4" />
            Suppliers
          </TabsTrigger>
        </TabsList>

        <div>

        <TabsContent value="inventory" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="electronics">Electronics</SelectItem>
                  <SelectItem value="clothing">Clothing</SelectItem>
                  <SelectItem value="books">Books</SelectItem>
                  <SelectItem value="home">Home & Garden</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="discontinued">Discontinued</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
              {selectedProducts.size > 0 && (
                <Button 
                  variant="destructive" 
                  onClick={handleBulkDelete}
                  disabled={bulkDeleteMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Trash className="h-4 w-4" />
                  Delete Selected ({selectedProducts.size})
                </Button>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      <Checkbox
                        checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all products"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Supplier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredProducts.map((product: Product) => {
                    const stockStatus = getStockStatus(product);
                    return (
                      <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Checkbox
                            checked={selectedProducts.has(product.id)}
                            onCheckedChange={() => toggleProductSelection(product.id)}
                            aria-label={`Select ${product.name}`}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {product.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {product.category || 'Software'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {product.sku || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {product.stockQuantity || product.quantityOnHand || 0} units
                          </div>
                          <div className="text-xs text-gray-500">
                            Reorder at {product.reorderLevel || 'Not set'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={stockStatus.color} variant="secondary">
                            {stockStatus.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            ${parseFloat(product.price?.toString() || '0').toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Cost: ${parseFloat((product.cost || product.price)?.toString() || '0').toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {product.supplier || 'Internal'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditProduct(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {filteredProducts.length === 0 && !productsLoading && (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500 mb-4">Get started by adding your first product.</p>
              <Button onClick={() => setIsCreateProductOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Order #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Customer/Supplier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {orders.map((order: Order) => (
                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {order.orderNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {order.customerName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={order.type === 'sale' ? 'default' : 'secondary'}>
                          {order.type === 'sale' ? 'Sales' : 'Purchase'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getOrderStatusColor(order.status)} variant="secondary">
                          {order.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        ${order.totalAmount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(order.orderDate), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Truck className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {orders.length === 0 && !ordersLoading && (
            <div className="text-center py-8">
              <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-500 mb-4">Start by creating your first order.</p>
              <Button onClick={() => setIsCreateOrderOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Order
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="operations" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="border-2 border-dashed border-blue-200 hover:border-blue-300 transition-colors">
              <CardContent className="p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-blue-500 mb-4" />
                <h3 className="font-semibold text-lg mb-2">Bulk Inventory Upload</h3>
                <p className="text-gray-600 mb-4">Upload inventory data from Excel or CSV files with AI-powered categorization</p>
                <Button 
                  onClick={() => setOperationsSpreadsheetUploadOpen(true)}
                  className="w-full"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Upload Spreadsheet
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-dashed border-green-200 hover:border-green-300 transition-colors">
              <CardContent className="p-6 text-center">
                <ShoppingCart className="mx-auto h-12 w-12 text-green-500 mb-4" />
                <h3 className="font-semibold text-lg mb-2">Bulk Order Import</h3>
                <p className="text-gray-600 mb-4">Import purchase and sales orders from external systems</p>
                <Button 
                  onClick={() => setOrdersSpreadsheetUploadOpen(true)}
                  className="w-full"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Upload Orders
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-dashed border-purple-200 hover:border-purple-300 transition-colors">
              <CardContent className="p-6 text-center">
                <BarChart3 className="mx-auto h-12 w-12 text-purple-500 mb-4" />
                <h3 className="font-semibold text-lg mb-2">Data Sync</h3>
                <p className="text-gray-600 mb-4">Synchronize inventory data with external platforms and systems</p>
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    toast({
                      title: "Coming Soon", 
                      description: "Data synchronization features will be available soon.",
                    });
                  }}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sync Data
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Operations</CardTitle>
                <CardDescription>Latest bulk operations and data imports</CardDescription>
              </CardHeader>
              <CardContent>
                {operationsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                  </div>
                ) : operations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-lg font-medium mb-2">No Operations Yet</p>
                    <p className="text-sm">Upload operations data to see them listed here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {operations.slice(0, 5).map((operation) => (
                      <div key={operation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${
                            operation.status === 'active' ? 'bg-green-500' :
                            operation.status === 'pending' ? 'bg-yellow-500' :
                            operation.status === 'completed' ? 'bg-blue-500' :
                            'bg-gray-500'
                          }`}></div>
                          <div>
                            <p className="font-medium">{operation.name}</p>
                            <p className="text-sm text-gray-600">
                              {operation.type} • {operation.priority && `Priority: ${operation.priority}`}
                              {operation.assignedTo && ` • Assigned: ${operation.assignedTo}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={operation.status === 'active' ? 'default' : 'secondary'}>
                            {operation.status}
                          </Badge>
                          <p className="text-sm text-gray-500 mt-1">
                            {operation.dueDate ? `Due: ${format(new Date(operation.dueDate), 'MMM dd')}` : 
                             `Created: ${format(new Date(operation.createdAt), 'MMM dd')}`}
                          </p>
                        </div>
                      </div>
                    ))}
                    {operations.length > 5 && (
                      <p className="text-center text-sm text-gray-500 pt-2">
                        Showing 5 of {operations.length} operations
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Operations Analytics</CardTitle>
                <CardDescription>Performance metrics for bulk operations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Success Rate</span>
                    <span className="font-semibold text-green-600">98.2%</span>
                  </div>
                  <Progress value={98.2} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Processing Speed</span>
                    <span className="font-semibold">1,250 items/min</span>
                  </div>
                  <Progress value={85} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Data Accuracy</span>
                    <span className="font-semibold text-blue-600">99.7%</span>
                  </div>
                  <Progress value={99.7} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Turnover</CardTitle>
                <CardDescription>
                  Track how quickly inventory is sold
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Inventory turnover chart would be implemented here
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stock Levels by Category</CardTitle>
                <CardDescription>
                  Current stock distribution across categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Stock levels chart would be implemented here
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Trends</CardTitle>
                <CardDescription>
                  Sales and purchase order trends over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Order trends chart would be implemented here
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Products</CardTitle>
                <CardDescription>
                  Best performing products by sales volume
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: "Product A", sales: 245, trend: "up" },
                    { name: "Product B", sales: 189, trend: "up" },
                    { name: "Product C", sales: 156, trend: "down" },
                    { name: "Product D", sales: 134, trend: "up" },
                  ].map((product, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium">{product.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">{product.sales} units</span>
                        {product.trend === "up" ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Supplier Management</CardTitle>
              <CardDescription>
                Manage your supplier relationships and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "Tech Supplies Inc.", products: 45, rating: 4.8, status: "Active" },
                  { name: "Global Electronics", products: 23, rating: 4.5, status: "Active" },
                  { name: "Office Direct", products: 67, rating: 4.2, status: "Active" },
                  { name: "Industrial Parts Co.", products: 12, rating: 3.9, status: "Review" },
                ].map((supplier, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{supplier.name}</h4>
                      <p className="text-sm text-gray-600">{supplier.products} products</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="text-sm font-medium">Rating</div>
                        <div className="text-lg font-bold text-yellow-600">★ {supplier.rating}</div>
                      </div>
                      <Badge className={supplier.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {supplier.status}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        </div>
      </Tabs>

      {/* Operations Spreadsheet Upload Dialog */}
      <SpreadsheetUpload
        store={{ id: 1, name: "Inventory Operations" }}
        open={operationsSpreadsheetUploadOpen}
        onOpenChange={setOperationsSpreadsheetUploadOpen}
        type="operations"
        onSuccess={() => {
          // Refresh operations data after successful upload
          queryClient.invalidateQueries({ queryKey: ['/api/operations'] });
          toast({
            title: "Operations uploaded successfully",
            description: "Operations data has been imported and is now visible",
          });
        }}
      />

      {/* Orders Spreadsheet Upload Dialog */}
      <SpreadsheetUpload
        store={{ id: 1, name: "Orders Management" }}
        open={ordersSpreadsheetUploadOpen}
        onOpenChange={setOrdersSpreadsheetUploadOpen}
        type="orders"
      />

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Bulk Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedProducts.size} selected products? 
              This action cannot be undone and will permanently remove the products from your inventory.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={bulkDeleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmBulkDelete}
              disabled={bulkDeleteMutation.isPending}
            >
              {bulkDeleteMutation.isPending ? 'Deleting...' : `Delete ${selectedProducts.size} Products`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product information and inventory details.
            </DialogDescription>
          </DialogHeader>
          {editingProduct && (
            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingProduct.name}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU
                  </label>
                  <input
                    type="text"
                    name="sku"
                    defaultValue={editingProduct.sku || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  defaultValue={editingProduct.description || ''}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    name="category"
                    defaultValue={editingProduct.category || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier
                  </label>
                  <input
                    type="text"
                    name="supplier"
                    defaultValue={editingProduct.supplier || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price *
                  </label>
                  <input
                    type="number"
                    name="price"
                    step="0.01"
                    defaultValue={editingProduct.price}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cost
                  </label>
                  <input
                    type="number"
                    name="cost"
                    step="0.01"
                    defaultValue={editingProduct.cost || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity on Hand
                  </label>
                  <input
                    type="number"
                    name="quantityOnHand"
                    defaultValue={editingProduct.quantityOnHand || 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reorder Level
                  </label>
                  <input
                    type="number"
                    name="reorderLevel"
                    defaultValue={editingProduct.reorderLevel || 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Stock Level
                  </label>
                  <input
                    type="number"
                    name="maxStockLevel"
                    defaultValue={editingProduct.maxStockLevel || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  defaultValue={editingProduct.status || 'active'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="discontinued">Discontinued</option>
                  <option value="draft">Draft</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={editProductMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={editProductMutation.isPending}
                >
                  {editProductMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}