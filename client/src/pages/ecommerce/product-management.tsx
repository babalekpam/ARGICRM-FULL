import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { usePermissions } from "@/hooks/usePermissions";
import { ProtectedButton } from "@/components/protected-button";
import { ProtectedSection } from "@/components/protected-section";
import { 
  Package, 
  Plus, 
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Upload,
  DollarSign,
  Tag,
  BarChart3,
  Settings,
  Image as ImageIcon,
  Layers,
  ShoppingCart,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  X
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function ProductManagement() {
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch products
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products"],
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Filter products
  const filteredProducts = (products as any[]).filter((product: any) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || product.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Add product mutation
  const addProductMutation = useMutation({
    mutationFn: (productData: any) => apiRequest("POST", "/api/products", productData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Product added successfully",
      });
      setShowAddProduct(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add product",
        variant: "destructive",
      });
    },
  });

  const ProductForm = () => {
    const [formData, setFormData] = useState({
      name: "",
      sku: "",
      shortDescription: "",
      longDescription: "",
      category: "",
      basePrice: "",
      salePrice: "",
      costPrice: "",
      stockQuantity: "",
      weight: "",
      status: "draft",
      trackInventory: true,
      taxable: true,
      featured: false,
      images: [] as string[],
    });

    const [dragActive, setDragActive] = useState(false);
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Handle file selection
    const handleFileSelect = (files: FileList | null) => {
      if (!files) return;
      
      const filesArray = Array.from(files).slice(0, 10 - imageUrls.length);
      let processedCount = 0;
      const newImageUrls: string[] = [];
      
      filesArray.forEach((file) => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result as string;
            if (result) {
              newImageUrls.push(result);
              processedCount++;
              
              // Update state when all files are processed
              if (processedCount === filesArray.length) {
                setImageUrls(prev => [...prev, ...newImageUrls]);
                setFormData(prev => ({ ...prev, images: [...prev.images, ...newImageUrls] }));
                toast({
                  title: "Images uploaded",
                  description: `${newImageUrls.length} image(s) added successfully`,
                });
              }
            }
          };
          reader.readAsDataURL(file);
        } else {
          processedCount++;
          toast({
            title: "Invalid file type",
            description: `${file.name} is not a valid image file`,
            variant: "destructive",
          });
        }
      });
    };

    // Handle URL input for images
    const handleImageUrlAdd = (url: string) => {
      if (url && imageUrls.length < 10) {
        setImageUrls(prev => [...prev, url]);
        setFormData(prev => ({ ...prev, images: [...prev.images, url] }));
        toast({
          title: "Image added",
          description: "Image URL added successfully",
        });
      } else if (imageUrls.length >= 10) {
        toast({
          title: "Limit reached",
          description: "Maximum 10 images allowed",
          variant: "destructive",
        });
      }
    };

    // Remove image
    const removeImage = (index: number) => {
      setImageUrls(prev => prev.filter((_, i) => i !== index));
      setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
      toast({
        title: "Image removed",
        description: "Image removed successfully",
      });
    };

    // Drag and drop handlers
    const handleDrag = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === "dragenter" || e.type === "dragover") {
        setDragActive(true);
      } else if (e.type === "dragleave") {
        setDragActive(false);
      }
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileSelect(e.dataTransfer.files);
      }
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      console.log("Submitting product with data:", formData);
      console.log("Images array:", formData.images);
      
      // Transform form data to match API expectations
      const productData = {
        name: formData.name,
        description: formData.longDescription || formData.shortDescription,
        price: formData.basePrice,
        category: formData.category,
        currency: "USD", // Default currency
        images: imageUrls, // Use the actual uploaded image URLs
        sku: formData.sku,
        status: formData.status,
        weight: formData.weight,
        inventory: {
          trackQuantity: formData.trackInventory,
          quantity: parseInt(formData.stockQuantity) || 0
        }
      };
      
      console.log("Transformed product data:", productData);
      addProductMutation.mutate(productData);
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle>Add New Product</CardTitle>
          <CardDescription>Create a new product for your store</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="basic" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
                <TabsTrigger value="media">Media</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Product Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter product name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      placeholder="Enter product SKU"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electronics">Electronics</SelectItem>
                      <SelectItem value="clothing">Clothing</SelectItem>
                      <SelectItem value="home">Home & Garden</SelectItem>
                      <SelectItem value="sports">Sports</SelectItem>
                      <SelectItem value="books">Books</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="shortDescription">Short Description</Label>
                  <Input
                    id="shortDescription"
                    value={formData.shortDescription}
                    onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                    placeholder="Brief product description"
                  />
                </div>

                <div>
                  <Label htmlFor="longDescription">Full Description</Label>
                  <Textarea
                    id="longDescription"
                    value={formData.longDescription}
                    onChange={(e) => setFormData({ ...formData, longDescription: e.target.value })}
                    placeholder="Detailed product description"
                    rows={4}
                  />
                </div>
              </TabsContent>

              <TabsContent value="pricing" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="basePrice">Base Price ($)</Label>
                    <Input
                      id="basePrice"
                      type="number"
                      step="0.01"
                      value={formData.basePrice}
                      onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="salePrice">Sale Price ($)</Label>
                    <Input
                      id="salePrice"
                      type="number"
                      step="0.01"
                      value={formData.salePrice}
                      onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="costPrice">Cost Price ($)</Label>
                    <Input
                      id="costPrice"
                      type="number"
                      step="0.01"
                      value={formData.costPrice}
                      onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="taxable"
                    checked={formData.taxable}
                    onCheckedChange={(checked) => setFormData({ ...formData, taxable: checked })}
                  />
                  <Label htmlFor="taxable">Taxable product</Label>
                </div>
              </TabsContent>

              <TabsContent value="inventory" className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Switch
                    id="trackInventory"
                    checked={formData.trackInventory}
                    onCheckedChange={(checked) => setFormData({ ...formData, trackInventory: checked })}
                  />
                  <Label htmlFor="trackInventory">Track inventory</Label>
                </div>

                {formData.trackInventory && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="stockQuantity">Stock Quantity</Label>
                      <Input
                        id="stockQuantity"
                        type="number"
                        value={formData.stockQuantity}
                        onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="weight">Weight (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        step="0.01"
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    id="featured"
                    checked={formData.featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                  />
                  <Label htmlFor="featured">Featured product</Label>
                </div>
              </TabsContent>

              <TabsContent value="media" className="space-y-4">
                {/* Image Upload Area */}
                <div className="space-y-4">
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      dragActive 
                        ? "border-blue-400 bg-blue-50" 
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        console.log("File input change event:", e.target.files);
                        handleFileSelect(e.target.files);
                      }}
                      className="hidden"
                    />
                    <ImageIcon className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-500 mb-4">
                      Drag & drop images here, or click to select files
                    </p>
                    <p className="text-sm text-gray-400 mb-4">
                      Upload up to 10 images (JPG, PNG, GIF)
                    </p>
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => {
                        console.log("Choose Files button clicked");
                        console.log("File input ref:", fileInputRef.current);
                        fileInputRef.current?.click();
                      }}
                    >
                      <Upload className="mr-2" size={16} />
                      Choose Files
                    </Button>
                  </div>

                  {/* URL Input */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Or paste image URL here..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const input = e.target as HTMLInputElement;
                          handleImageUrlAdd(input.value);
                          input.value = '';
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const input = document.querySelector('input[placeholder*="paste image URL"]') as HTMLInputElement;
                        if (input?.value) {
                          handleImageUrlAdd(input.value);
                          input.value = '';
                        }
                      }}
                    >
                      Add URL
                    </Button>
                  </div>

                  {/* Image Preview Grid */}
                  {imageUrls.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {imageUrls.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Product image ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(index)}
                          >
                            <X size={12} />
                          </Button>
                          {index === 0 && (
                            <Badge className="absolute bottom-2 left-2">
                              Main Image
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <Separator />

            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowAddProduct(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={addProductMutation.isPending}>
                {addProductMutation.isPending ? "Adding..." : "Add Product"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Product Management
            </h1>
            <p className="text-gray-600 mt-2">
              Create and manage your product catalog
            </p>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" className="flex items-center gap-2">
              <BarChart3 size={16} />
              Analytics
            </Button>
            <Button 
              className="flex items-center gap-2"
              onClick={() => setShowAddProduct(true)}
            >
              <Plus size={16} />
              Add Product
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold">{(products as any[]).length}</p>
                </div>
                <Package className="text-blue-600" size={24} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Products</p>
                  <p className="text-2xl font-bold">
                    {(products as any[]).filter((p: any) => p.status === 'active').length}
                  </p>
                </div>
                <CheckCircle className="text-green-600" size={24} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Low Stock</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {(products as any[]).filter((p: any) => p.inventory?.quantity < 10).length}
                  </p>
                </div>
                <AlertCircle className="text-orange-600" size={24} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold">
                    ${(products as any[]).reduce((total: number, p: any) => total + (parseFloat(p.basePrice) * (p.inventory?.quantity || 0)), 0).toFixed(2)}
                  </p>
                </div>
                <DollarSign className="text-purple-600" size={24} />
              </div>
            </CardContent>
          </Card>
        </div>

        {showAddProduct ? (
          <ProductForm />
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Products</CardTitle>
                  <CardDescription>Manage your product inventory</CardDescription>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <Input
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="clothing">Clothing</SelectItem>
                    <SelectItem value="home">Home & Garden</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="mx-auto text-gray-400 mb-4" size={48} />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                  <p className="text-gray-500 mb-6">
                    {(products as any[]).length === 0 
                      ? "Get started by creating your first product"
                      : "Try adjusting your search or filters"}
                  </p>
                  <ProtectedButton 
                    permission="products.create"
                    onClick={() => setShowAddProduct(true)}
                    data-testid="button-add-product"
                  >
                    <Plus className="mr-2" size={16} />
                    Add Product
                  </ProtectedButton>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredProducts.map((product: any) => (
                    <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                          {product.images && product.images.length > 0 ? (
                            <img 
                              src={product.images[0]} 
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = '<div class="flex items-center justify-center w-full h-full"><svg class="text-gray-400" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.29,7 12,12 20.71,7"></polyline><line x1="12" y1="22" x2="12" y2="12"></line></svg></div>';
                                }
                              }}
                            />
                          ) : (
                            <Package className="text-gray-400" size={24} />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{product.name}</h3>
                          <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                              {product.status}
                            </Badge>
                            <span className="text-sm text-gray-500">{product.category}</span>
                            <span className="text-sm font-medium">${product.basePrice}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <ProtectedButton 
                          permission="products.read"
                          variant="ghost" 
                          size="sm"
                          data-testid={`button-view-product-${product.id}`}
                        >
                          <Eye size={16} />
                        </ProtectedButton>
                        <ProtectedButton 
                          permission="products.update"
                          variant="ghost" 
                          size="sm"
                          data-testid={`button-edit-product-${product.id}`}
                        >
                          <Edit size={16} />
                        </ProtectedButton>
                        <ProtectedButton 
                          permission="products.delete"
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700"
                          data-testid={`button-delete-product-${product.id}`}
                        >
                          <Trash2 size={16} />
                        </ProtectedButton>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}