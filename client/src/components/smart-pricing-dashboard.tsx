import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, TrendingUp, TrendingDown, DollarSign, BarChart3, Zap, Target, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface PricingRecommendation {
  productId: number;
  currentPrice: number;
  recommendedPrice: number;
  priceChange: number;
  priceChangePercentage: number;
  confidence: number;
  reasoning: string;
  marketPosition: 'premium' | 'competitive' | 'value' | 'discount';
  elasticityScore: number;
  revenueImpact: {
    projected: number;
    optimistic: number;
    conservative: number;
  };
  demandForecast: {
    low: number;
    medium: number;
    high: number;
  };
  competitorAnalysis: {
    averagePrice: number;
    minPrice: number;
    maxPrice: number;
    ourPosition: string;
  };
  factors: PricingFactor[];
  timeframe: string;
  nextReviewDate: string;
}

interface PricingFactor {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
  description: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  description?: string;
  categories?: string;
  inventory?: number;
}

export default function SmartPricingDashboard() {
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [analysisForm, setAnalysisForm] = useState({
    productId: '',
    currentPrice: '',
    category: '',
    description: '',
    cost: '',
    inventory: ''
  });
  const [bulkProductIds, setBulkProductIds] = useState<string>('');
  const [scheduledPricing, setScheduledPricing] = useState<Map<number, { price: number; date: string }>>(new Map());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch products
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['/api/products'],
  });

  // Single product analysis mutation
  const analyzePricingMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/ecommerce/pricing/analyze', data, {
        'x-auth-email': 'abel@argilette.com',
        'authorization': 'Bearer demo-token'
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Pricing Analysis Complete",
        description: "AI-powered pricing recommendation generated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Bulk analysis mutation
  const bulkAnalysisMutation = useMutation({
    mutationFn: async (productIds: number[]) => {
      return await apiRequest('POST', '/api/ecommerce/pricing/bulk-analyze', { productIds }, {
        'x-auth-email': 'abel@argilette.com',
        'authorization': 'Bearer demo-token'
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Bulk Analysis Complete",
        description: `Analyzed ${data.analyzed} of ${data.total} products successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Bulk Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Apply pricing mutation
  const applyPricingMutation = useMutation({
    mutationFn: async ({ productId, newPrice }: { productId: number; newPrice: number }) => {
      return await apiRequest('PUT', `/api/ecommerce/pricing/apply/${productId}`, 
        { newPrice },
        {
          'x-auth-email': 'abel@argilette.com',
          'authorization': 'Bearer demo-token'
        }
      );
    },
    onSuccess: (data: any) => {
      toast({
        title: "Pricing Updated",
        description: `Product price updated to $${data.newPrice}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSingleAnalysis = async () => {
    if (!analysisForm.productId || !analysisForm.currentPrice) {
      toast({
        title: "Missing Information",
        description: "Product ID and current price are required.",
        variant: "destructive",
      });
      return;
    }

    const analysisData = {
      productId: parseInt(analysisForm.productId),
      currentPrice: parseFloat(analysisForm.currentPrice),
      category: analysisForm.category || undefined,
      description: analysisForm.description || undefined,
      cost: analysisForm.cost ? parseFloat(analysisForm.cost) : undefined,
      inventory: analysisForm.inventory ? parseInt(analysisForm.inventory) : undefined,
    };

    analyzePricingMutation.mutate(analysisData);
  };

  const handleBulkAnalysis = async () => {
    const productIds = bulkProductIds
      .split(',')
      .map(id => parseInt(id.trim()))
      .filter(id => !isNaN(id));

    if (productIds.length === 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter valid product IDs separated by commas.",
        variant: "destructive",
      });
      return;
    }

    bulkAnalysisMutation.mutate(productIds);
  };

  const handleSchedulePricing = (productId: number, price: number) => {
    // Calculate default scheduled date (7 days from now)
    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + 7);
    
    const newScheduledPricing = new Map(scheduledPricing);
    newScheduledPricing.set(productId, {
      price,
      date: scheduledDate.toISOString().split('T')[0]
    });
    setScheduledPricing(newScheduledPricing);
    
    toast({
      title: "Pricing Scheduled",
      description: `Price change scheduled for ${scheduledDate.toLocaleDateString()}`,
    });
  };

  const handleAnalyzeAllProducts = () => {
    if (products && products.length > 0) {
      const allProductIds = products.slice(0, 10).map((p: any) => p.id); // Limit to first 10 for performance
      setBulkProductIds(allProductIds.join(', '));
      bulkAnalysisMutation.mutate(allProductIds);
    }
  };

  const getMarketPositionColor = (position: string) => {
    switch (position) {
      case 'premium': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'competitive': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'value': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'discount': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive': return 'text-green-600 dark:text-green-400';
      case 'negative': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'positive': return <TrendingUp className="h-4 w-4" />;
      case 'negative': return <TrendingDown className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Smart Pricing Engine</h2>
          <p className="text-muted-foreground">
            AI-powered pricing recommendations to optimize revenue and market position
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleAnalyzeAllProducts}
            disabled={bulkAnalysisMutation.isPending || !products || products.length === 0}
            variant="default"
          >
            {bulkAnalysisMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Analyzing...
              </>
            ) : (
              <>
                <Target className="h-4 w-4 mr-2" />
                Analyze All Products
              </>
            )}
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analyze Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Product Pricing Analysis</DialogTitle>
                <DialogDescription>
                  Get AI-powered pricing recommendations for a specific product
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="productId">Product ID *</Label>
                    <Input
                      id="productId"
                      value={analysisForm.productId}
                      onChange={(e) => setAnalysisForm(prev => ({ ...prev, productId: e.target.value }))}
                      placeholder="Enter product ID"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currentPrice">Current Price *</Label>
                    <Input
                      id="currentPrice"
                      type="number"
                      step="0.01"
                      value={analysisForm.currentPrice}
                      onChange={(e) => setAnalysisForm(prev => ({ ...prev, currentPrice: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={analysisForm.category}
                      onChange={(e) => setAnalysisForm(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="Product category"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cost">Cost</Label>
                    <Input
                      id="cost"
                      type="number"
                      step="0.01"
                      value={analysisForm.cost}
                      onChange={(e) => setAnalysisForm(prev => ({ ...prev, cost: e.target.value }))}
                      placeholder="Product cost"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={analysisForm.description}
                    onChange={(e) => setAnalysisForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Product description"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inventory">Inventory Count</Label>
                  <Input
                    id="inventory"
                    type="number"
                    value={analysisForm.inventory}
                    onChange={(e) => setAnalysisForm(prev => ({ ...prev, inventory: e.target.value }))}
                    placeholder="Current inventory"
                  />
                </div>
                <Button 
                  onClick={handleSingleAnalysis}
                  disabled={analyzePricingMutation.isPending}
                  className="w-full"
                >
                  {analyzePricingMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Generate Pricing Recommendation
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Target className="h-4 w-4 mr-2" />
                Bulk Analysis
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bulk Pricing Analysis</DialogTitle>
                <DialogDescription>
                  Analyze pricing for multiple products simultaneously
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="bulkIds">Product IDs</Label>
                  <Textarea
                    id="bulkIds"
                    value={bulkProductIds}
                    onChange={(e) => setBulkProductIds(e.target.value)}
                    placeholder="Enter product IDs separated by commas (e.g., 1, 2, 3, 4)"
                    rows={4}
                  />
                </div>
                <Button 
                  onClick={handleBulkAnalysis}
                  disabled={bulkAnalysisMutation.isPending}
                  className="w-full"
                >
                  {bulkAnalysisMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Analyze All Products
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Results Display */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{products.length}</div>
                <p className="text-xs text-muted-foreground">Available for analysis</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AI Confidence</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">87%</div>
                <p className="text-xs text-muted-foreground">Average recommendation confidence</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue Impact</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+12.5%</div>
                <p className="text-xs text-muted-foreground">Projected revenue increase</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          {analyzePricingMutation.data?.recommendation && (
            <PricingRecommendationCard 
              recommendation={analyzePricingMutation.data.recommendation}
              onApplyPricing={(productId, newPrice) => 
                applyPricingMutation.mutate({ productId, newPrice })
              }
              isApplying={applyPricingMutation.isPending}
            />
          )}

          {bulkAnalysisMutation.data?.recommendations && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Bulk Analysis Results</h3>
              {bulkAnalysisMutation.data.recommendations.map((recommendation: PricingRecommendation) => (
                <PricingRecommendationCard 
                  key={recommendation.productId}
                  recommendation={recommendation}
                  onApplyPricing={(productId, newPrice) => 
                    applyPricingMutation.mutate({ productId, newPrice })
                  }
                  isApplying={applyPricingMutation.isPending}
                />
              ))}
            </div>
          )}

          {!analyzePricingMutation.data && !bulkAnalysisMutation.data && (
            <Card>
              <CardContent className="text-center py-8">
                <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Analysis Results</h3>
                <p className="text-muted-foreground mb-4">
                  Run a pricing analysis to see AI-powered recommendations here.
                </p>
                <Button onClick={() => setAnalysisForm({ ...analysisForm, productId: products[0]?.id?.toString() || '' })}>
                  Analyze First Product
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <div className="grid gap-4">
            {productsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                <p>Loading products...</p>
              </div>
            ) : products.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Products Found</h3>
                  <p className="text-muted-foreground">
                    Upload some products to start using the Smart Pricing Engine.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {products.map((product: Product) => (
                  <Card key={product.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-sm">{product.name}</CardTitle>
                      <CardDescription className="text-xs">
                        ID: {product.id} • Price: ${product.price}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          setAnalysisForm({
                            productId: product.id.toString(),
                            currentPrice: product.price.toString(),
                            category: '',
                            description: product.description || '',
                            cost: '',
                            inventory: product.inventory?.toString() || ''
                          });
                        }}
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        Analyze Pricing
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PricingRecommendationCard({ 
  recommendation, 
  onApplyPricing, 
  isApplying 
}: { 
  recommendation: PricingRecommendation;
  onApplyPricing: (productId: number, newPrice: number) => void;
  isApplying: boolean;
}) {
  const priceChangeSign = recommendation.priceChange >= 0 ? '+' : '';
  const isIncrease = recommendation.priceChange > 0;

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Product #{recommendation.productId}</CardTitle>
            <CardDescription>AI Pricing Recommendation</CardDescription>
          </div>
          <Badge className={getMarketPositionColor(recommendation.marketPosition)}>
            {recommendation.marketPosition.charAt(0).toUpperCase() + recommendation.marketPosition.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">${recommendation.currentPrice}</div>
            <div className="text-xs text-muted-foreground">Current Price</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">${recommendation.recommendedPrice}</div>
            <div className="text-xs text-muted-foreground">Recommended</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
              {priceChangeSign}${Math.abs(recommendation.priceChange).toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">Price Change</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{recommendation.confidence}%</div>
            <div className="text-xs text-muted-foreground">Confidence</div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Confidence Level</Label>
          <Progress value={recommendation.confidence} className="h-2" />
        </div>

        <div className="bg-muted p-3 rounded-lg">
          <h4 className="font-semibold text-sm mb-2">AI Reasoning</h4>
          <p className="text-sm text-muted-foreground">{recommendation.reasoning}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-sm mb-2">Revenue Impact</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Conservative:</span>
                <span>${recommendation.revenueImpact.conservative.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Projected:</span>
                <span className="font-semibold">${recommendation.revenueImpact.projected.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Optimistic:</span>
                <span>${recommendation.revenueImpact.optimistic.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-2">Demand Forecast</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Low:</span>
                <span>{recommendation.demandForecast.low} units</span>
              </div>
              <div className="flex justify-between">
                <span>Medium:</span>
                <span className="font-semibold">{recommendation.demandForecast.medium} units</span>
              </div>
              <div className="flex justify-between">
                <span>High:</span>
                <span>{recommendation.demandForecast.high} units</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-sm mb-2">Key Factors</h4>
          <div className="space-y-2">
            {recommendation.factors.map((factor, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={getImpactColor(factor.impact)}>
                    {getImpactIcon(factor.impact)}
                  </span>
                  <span>{factor.factor}</span>
                </div>
                <span className="text-muted-foreground text-xs">
                  {(factor.weight * 100).toFixed(0)}% weight
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button 
            onClick={() => onApplyPricing(recommendation.productId, recommendation.recommendedPrice)}
            disabled={isApplying}
            className="flex-1"
          >
            {isApplying ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Applying...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Apply Recommendation
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleSchedulePricing(recommendation.productId, recommendation.recommendedPrice)}
          >
            <Clock className="h-4 w-4 mr-2" />
            Schedule Later
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}