import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Upload, FileSpreadsheet, CheckCircle, AlertCircle, Brain, 
  Package, DollarSign, Hash, FileText, Tag, Eye, Download, 
  Loader2, Sparkles, BarChart3, TrendingUp 
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SpreadsheetUploadProps {
  store: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type?: "ecommerce" | "inventory" | "operations" | "orders";
  onSuccess?: () => void;
}

interface ProcessedProduct {
  name: string;
  description?: string;
  price?: number;
  quantity?: number;
  sku?: string;
  categories?: string[];
  tags?: string[];
  shortDescription?: string;
  seoTitle?: string;
  seoDescription?: string;
  slug?: string;
  suggestedCompareAtPrice?: number;
  suggestedCost?: number;
  confidence: number;
  reasoning: string;
  // Operations fields
  type?: string;
  status?: string;
  priority?: string;
  assignedTo?: string;
  dueDate?: string;
  // Orders fields
  customerName?: string;
  customerEmail?: string;
  totalAmount?: number;
  orderDate?: string;
  orderNumber?: string;
}

export function SpreadsheetUpload({ store, open, onOpenChange, type = "ecommerce", onSuccess }: SpreadsheetUploadProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [processedProducts, setProcessedProducts] = useState<ProcessedProduct[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Error boundary function
  const handleError = (error: any, context: string) => {
    console.error(`${context} error:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    setError(`${context}: ${errorMessage}`);
    toast({
      title: "Error",
      description: `${context} failed. Please try again.`,
      variant: "destructive",
    });
  };

  const previewUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      try {
        const formData = new FormData();
        formData.append(type === 'inventory' || type === 'operations' || type === 'orders' ? 'file' : 'spreadsheet', file);
        
        const endpoint = 
          type === 'inventory' ? '/api/inventory/preview-upload' :
          type === 'operations' ? '/api/operations/preview-upload' :
          type === 'orders' ? '/api/orders/preview-upload' :
          '/api/ecommerce/products/preview-upload';
          
        console.log('Preview upload:', { endpoint, type, fileName: file.name, fileSize: file.size });
        
        const response = await fetch(endpoint, {
          method: 'POST',
          body: formData,
          headers: {
            'x-auth-email': 'abel@argilette.com',
            'authorization': 'Bearer demo-token'
          }
        });
        
        console.log('Preview response:', { status: response.status, ok: response.ok });
        
        if (!response.ok) {
          let errorMessage = 'Failed to preview spreadsheet';
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }
        
        const result = await response.json();
        console.log('Preview success:', result);
        return result;
      } catch (error) {
        console.error('Preview upload mutation error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      try {
        console.log('Preview onSuccess data:', data);
        console.log('Preview data structure:', JSON.stringify(data, null, 2));
        
        if (!data || !data.data) {
          throw new Error('Invalid response structure from server');
        }
        
        setPreviewData(data.data);
        setCurrentStep(2);
        toast({
          title: "File Uploaded Successfully",
          description: `Found ${data.data?.totalRows || 0} rows in your spreadsheet`,
        });
      } catch (error) {
        handleError(error, 'Preview processing');
      }
    },
    onError: (error: any) => {
      handleError(error, 'File upload');
    }
  });

  const processUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      try {
        const formData = new FormData();
        formData.append(type === 'inventory' || type === 'operations' || type === 'orders' ? 'file' : 'spreadsheet', file);
        
        const endpoint = 
          type === 'inventory' ? '/api/inventory/process-upload' :
          type === 'operations' ? '/api/operations/process-upload' :
          type === 'orders' ? '/api/orders/process-upload' :
          `/api/ecommerce/stores/${store.id}/products/upload`;
          
        console.log('Process upload:', { endpoint, type, fileName: file.name });
        
        const response = await fetch(endpoint, {
          method: 'POST',
          body: formData,
          headers: {
            'x-auth-email': 'abel@argilette.com',
            'authorization': 'Bearer demo-token'
          }
        });
        
        console.log('Process response:', { status: response.status, ok: response.ok });
        
        if (!response.ok) {
          let errorMessage = 'Failed to process spreadsheet';
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }
        
        const result = await response.json();
        console.log('Process success:', result);
        return result;
      } catch (error) {
        console.error('Process upload mutation error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      try {
        console.log('Process onSuccess data:', data);
        
        // Handle different data structures based on upload type
        if (type === 'operations' || type === 'orders') {
          // For operations and orders, use the 'products' key from backend (which contains operations/orders data)
          const items = data.data.products || data.data.items || data.data.records || [];
          setProcessedProducts(items);
          setSelectedProducts(new Set(items.map((_: any, index: number) => index)));
          setCurrentStep(3);
          toast({
            title: "Processing Complete",
            description: `Successfully processed ${items.length} ${type} records`,
          });
        } else {
          // For e-commerce products and inventory
          const products = data.data.products || [];
          setProcessedProducts(products);
          setSelectedProducts(new Set(products.map((_: any, index: number) => index)));
          setCurrentStep(3);
          toast({
            title: "AI Processing Complete",
            description: `Successfully categorized ${products.length} products with ${data.data.averageConfidence || 0}% average confidence`,
          });
        }
      } catch (error) {
        console.error('Process onSuccess error:', error);
        toast({
          title: "Processing Error",
          description: "Data processed but there was an error handling the results. Please try again.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error('Processing upload error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        cause: error.cause
      });
      toast({
        title: "Processing Failed",
        description: `Upload processing error: ${error.message || 'Unknown error occurred'}`,
        variant: "destructive",
      });
    }
  });

  const bulkCreateMutation = useMutation({
    mutationFn: async (products: ProcessedProduct[]) => {
      if (type === 'inventory') {
        const response = await apiRequest("POST", "/api/inventory/bulk-create", {
          items: products
        });
        return response.json();
      } else if (type === 'operations') {
        const response = await apiRequest("POST", "/api/operations/bulk-create", {
          items: products
        });
        return response.json();
      } else if (type === 'orders') {
        const response = await apiRequest("POST", "/api/orders/bulk-create", {
          items: products
        });
        return response.json();
      } else {
        const response = await apiRequest("POST", `/api/ecommerce/stores/${store.id}/products/bulk-create`, {
          products,
          createCategories: true
        });
        return response.json();
      }
    },
    onSuccess: (data) => {
      if (type === 'inventory') {
        queryClient.invalidateQueries({ queryKey: ["/api/products"] });
        setCurrentStep(4);
        toast({
          title: "Inventory Items Created Successfully",
          description: `Created ${data.data.totalSuccessful} inventory items`,
        });
      } else if (type === 'operations') {
        queryClient.invalidateQueries({ queryKey: ["/api/operations"] });
        setCurrentStep(4);
        toast({
          title: "Operations Records Created Successfully",
          description: `Created ${data.data?.totalSuccessful || data.created} operations records`,
        });
      } else if (type === 'orders') {
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
        setCurrentStep(4);
        toast({
          title: "Orders Created Successfully",
          description: `Created ${data.data?.totalSuccessful || data.created} orders`,
        });
      } else {
        // Invalidate multiple related queries to ensure data refresh
        queryClient.invalidateQueries({ queryKey: ["/api/ecommerce/stores", store.id, "products"] });
        queryClient.invalidateQueries({ queryKey: ["/api/ecommerce/stores", store.id, "analytics"] });
        queryClient.invalidateQueries({ queryKey: ["/api/ecommerce/stores"] });
        
        // Force refetch for immediate update
        queryClient.refetchQueries({ queryKey: ["/api/ecommerce/stores", store.id, "products"] });
        
        setCurrentStep(4);
        toast({
          title: "Import Complete!",
          description: `Successfully imported ${data.data.totalSuccessful} products with ${data.data.categoriesCreated} new categories`,
        });
        
        // Call success callback to refresh parent component
        onSuccess?.();
      }
    },
    onError: (error: any) => {
      console.error('Bulk create error:', error);
      console.error('Bulk create error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        cause: error.cause
      });
      toast({
        title: "Creation Failed",
        description: `Bulk creation error: ${error.message || 'Unknown error occurred'}`,
        variant: "destructive",
      });
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (file) {
        setUploadedFile(file);
        previewUploadMutation.mutate(file);
      }
    } catch (error) {
      console.error('File selection error:', error);
      toast({
        title: "File Selection Error",
        description: "There was an error selecting the file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleProcessWithAI = () => {
    if (uploadedFile) {
      processUploadMutation.mutate(uploadedFile);
    }
  };

  const handleCreateProducts = () => {
    const selectedProductsArray = Array.from(selectedProducts).map(index => processedProducts[index]);
    bulkCreateMutation.mutate(selectedProductsArray);
  };

  const toggleProductSelection = (index: number) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedProducts(newSelected);
  };

  const selectAllProducts = () => {
    setSelectedProducts(new Set(processedProducts.map((_, index) => index)));
  };

  const deselectAllProducts = () => {
    setSelectedProducts(new Set());
  };

  const resetUpload = () => {
    setCurrentStep(1);
    setUploadedFile(null);
    setPreviewData(null);
    setProcessedProducts([]);
    setSelectedProducts(new Set());
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStepStatus = (step: number) => {
    if (step < currentStep) return 'completed';
    if (step === currentStep) return 'current';
    return 'pending';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            AI-Powered {type === 'ecommerce' ? 'Product' : type.charAt(0).toUpperCase() + type.slice(1)} Import
          </DialogTitle>
          <DialogDescription>
            Upload a spreadsheet with your {type === 'ecommerce' ? 'products' : type} data and let AI automatically process them with intelligent insights
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {[
              { step: 1, title: "Upload", icon: Upload },
              { step: 2, title: "Preview", icon: Eye },
              { step: 3, title: "AI Processing", icon: Brain },
              { step: 4, title: "Complete", icon: CheckCircle }
            ].map(({ step, title, icon: Icon }) => {
              const status = getStepStatus(step);
              return (
                <div key={step} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    status === 'completed' ? 'bg-green-100 text-green-600' :
                    status === 'current' ? 'bg-purple-100 text-purple-600' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    status === 'completed' ? 'text-green-600' :
                    status === 'current' ? 'text-purple-600' :
                    'text-gray-400'
                  }`}>
                    {title}
                  </span>
                  {step < 4 && (
                    <div className={`w-16 h-0.5 ml-4 ${
                      status === 'completed' ? 'bg-green-200' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>

          <Separator />

          {/* Step Content */}
          <div className="min-h-[400px]">
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-lg p-12 hover:border-purple-400 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FileSpreadsheet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Upload {type === 'ecommerce' ? 'Product' : type.charAt(0).toUpperCase() + type.slice(1)} Spreadsheet
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Drop your Excel (.xlsx, .xls) or CSV file here, or click to browse
                    </p>
                    <Button disabled={previewUploadMutation.isPending}>
                      {previewUploadMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Choose File
                        </>
                      )}
                    </Button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Supported Formats & Columns</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <h4 className="font-medium mb-2">File Types:</h4>
                      <div className="flex gap-2">
                        <Badge variant="outline">Excel (.xlsx, .xls)</Badge>
                        <Badge variant="outline">CSV (.csv)</Badge>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Expected Columns (flexible naming):</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>• <strong>Name/Title:</strong> Product name</div>
                        <div>• <strong>Price/Cost:</strong> Product price</div>
                        <div>• <strong>Quantity/Stock:</strong> Inventory count</div>
                        <div>• <strong>Description:</strong> Product details</div>
                        <div>• <strong>SKU/Code:</strong> Product identifier</div>
                        <div>• <strong>Brand:</strong> Manufacturer</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {currentStep === 2 && previewData && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Spreadsheet Preview</h3>
                  <Button onClick={handleProcessWithAI} disabled={processUploadMutation.isPending}>
                    {processUploadMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing with AI...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Process with AI
                      </>
                    )}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-gray-600">File Details</p>
                          <p className="font-medium">{previewData.fileName}</p>
                          <p className="text-sm text-gray-500">{(previewData.fileSize / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-sm text-gray-600">Data Summary</p>
                          <p className="font-medium">{previewData.totalRows} rows</p>
                          <p className="text-sm text-gray-500">{(previewData.columns || previewData.headers || []).length} columns</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {previewData.columnMapping && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Column Mapping</CardTitle>
                      <CardDescription>AI has detected these column mappings</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        {Object.entries(previewData.columnMapping.detected || {}).map(([field, column]) => (
                          <div key={field} className="flex items-center gap-2">
                            <Badge variant={column ? "default" : "secondary"}>
                              {field}
                            </Badge>
                            <span className={column ? "text-green-600" : "text-gray-400"}>
                              {column ? String(column) : "Not detected"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Data Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-40">
                      <div className="space-y-2">
                        {(previewData.preview || previewData.sample || []).map((row: any, index: number) => (
                          <div key={index} className="p-2 bg-gray-50 rounded text-xs">
                            <div className="font-medium">Row {index + 1}:</div>
                            <div className="text-gray-600">{JSON.stringify(row).substring(0, 100)}...</div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            )}

            {currentStep === 3 && processedProducts.length > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">AI-Processed Products</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={selectAllProducts}>
                      Select All
                    </Button>
                    <Button variant="outline" size="sm" onClick={deselectAllProducts}>
                      Deselect All
                    </Button>
                    <Button 
                      onClick={handleCreateProducts} 
                      disabled={selectedProducts.size === 0 || bulkCreateMutation.isPending}
                    >
                      {bulkCreateMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating Products...
                        </>
                      ) : (
                        <>
                          <Package className="w-4 h-4 mr-2" />
                          Create {selectedProducts.size} Products
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-sm text-gray-600">Average Confidence</p>
                          <p className="text-xl font-bold">
                            {processedProducts.length > 0 ? Math.round(processedProducts.reduce((sum, p) => sum + (p.confidence || 0), 0) / processedProducts.length) : 0}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-gray-600">Total Products</p>
                          <p className="text-xl font-bold">{processedProducts.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-purple-600" />
                        <div>
                          <p className="text-sm text-gray-600">Total Value</p>
                          <p className="text-xl font-bold">
                            {type === 'operations' || type === 'orders' ? 
                              `${processedProducts.length} items` : 
                              `$${processedProducts.reduce((sum, p) => sum + ((p.price || 0) * (p.quantity || 0)), 0).toFixed(2)}`
                            }
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {processedProducts.map((product, index) => (
                      <Card key={index} className={`border ${selectedProducts.has(index) ? 'border-purple-400 bg-purple-50' : ''}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <input
                              type="checkbox"
                              checked={selectedProducts.has(index)}
                              onChange={() => toggleProductSelection(index)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h4 className="font-medium">{product.name}</h4>
                                  <p className="text-sm text-gray-600">{product.shortDescription || product.description || 'No description available'}</p>
                                </div>
                                <Badge variant={product.confidence > 80 ? "default" : product.confidence > 60 ? "secondary" : "destructive"}>
                                  {product.confidence}% confidence
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-4 gap-4 text-sm">
                                {type === 'operations' ? (
                                  <>
                                    <div>
                                      <span className="text-gray-600">Type:</span>
                                      <span className="font-medium ml-1">{product.type || 'N/A'}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Status:</span>
                                      <span className="font-medium ml-1">{product.status || 'N/A'}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Priority:</span>
                                      <span className="font-medium ml-1">{product.priority || 'N/A'}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Assigned To:</span>
                                      <span className="font-medium ml-1">{product.assignedTo || 'Unassigned'}</span>
                                    </div>
                                  </>
                                ) : type === 'orders' ? (
                                  <>
                                    <div>
                                      <span className="text-gray-600">Customer:</span>
                                      <span className="font-medium ml-1">{product.customerName || 'N/A'}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Total:</span>
                                      <span className="font-medium ml-1">${product.totalAmount || 0}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Status:</span>
                                      <span className="font-medium ml-1">{product.status || 'N/A'}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Date:</span>
                                      <span className="font-medium ml-1">{product.orderDate || 'N/A'}</span>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div>
                                      <span className="text-gray-600">Price:</span>
                                      <span className="font-medium ml-1">${product.price || 0}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Quantity:</span>
                                      <span className="font-medium ml-1">{product.quantity || 0}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Categories:</span>
                                      <div className="mt-1">
                                        {(product.categories || []).map((cat, i) => (
                                          <Badge key={i} variant="outline" className="text-xs mr-1">
                                            {cat}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Tags:</span>
                                      <div className="mt-1">
                                        {(product.tags || []).slice(0, 3).map((tag, i) => (
                                          <Badge key={i} variant="secondary" className="text-xs mr-1">
                                            {tag}
                                          </Badge>
                                        ))}
                                        {(product.tags || []).length > 3 && (
                                          <span className="text-xs text-gray-500">+{(product.tags || []).length - 3} more</span>
                                        )}
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                              
                              <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                                <span className="font-medium">AI Reasoning:</span> {product.reasoning}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {currentStep === 4 && (
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-green-600 mb-2">Import Complete!</h3>
                  <p className="text-gray-600">
                    Your products have been successfully imported and are now available in your store.
                  </p>
                </div>
                <div className="flex justify-center gap-4">
                  <Button onClick={resetUpload} variant="outline">
                    Import More Products
                  </Button>
                  <Button onClick={() => onOpenChange(false)}>
                    View Products
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {currentStep > 1 && currentStep < 4 && (
            <Button variant="outline" onClick={resetUpload}>
              Start Over
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}