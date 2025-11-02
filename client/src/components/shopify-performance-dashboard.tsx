import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUp, 
  ArrowDown,
  Zap,
  Target,
  Users,
  ShoppingCart,
  Clock,
  Globe,
  Star,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Activity,
  Smartphone,
  Search,
  PlusCircle,
  BarChart3
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface PerformanceMetrics {
  storeId: string;
  conversionRate: number;
  averageOrderValue: number;
  customerRetentionRate: number;
  pageLoadSpeed: number;
  mobileOptimization: number;
  seoScore: number;
  customerSatisfaction: number;
  abandonnedCartRate: number;
  socialProofScore: number;
}

interface OptimizationRecommendation {
  priority: 'high' | 'medium' | 'low';
  category: 'conversion' | 'speed' | 'seo' | 'ux' | 'marketing';
  title: string;
  description: string;
  implementation: string;
  expectedImpact: string;
  timeToImplement: string;
}

const ShopifyPerformanceDashboard = () => {
  const [selectedStore, setSelectedStore] = useState<string>('store-1');

  // Fetch stores for selector
  const { data: stores = [] } = useQuery({
    queryKey: ['/api/ecommerce/stores'],
    queryFn: async () => {
      return await apiRequest('GET', '/api/ecommerce/stores', undefined, {
        'x-auth-email': 'abel@argilette.org',
        'authorization': 'Bearer demo-token'
      });
    }
  });

  // Fetch performance metrics
  const { data: performanceData, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/ecommerce/performance', selectedStore],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/ecommerce/performance/${selectedStore}`, undefined, {
        'x-auth-email': 'abel@argilette.org',
        'authorization': 'Bearer demo-token'
      });
      return response.metrics;
    },
    enabled: !!selectedStore
  });

  // Fetch optimization plan
  const { data: optimizationData, isLoading: optimizationLoading } = useQuery({
    queryKey: ['/api/ecommerce/optimization', selectedStore],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/ecommerce/optimization/${selectedStore}`, undefined, {
        'x-auth-email': 'abel@argilette.org',
        'authorization': 'Bearer demo-token'
      });
      return response.optimization;
    },
    enabled: !!selectedStore
  });

  // Fetch feature implementation plan
  const { data: featuresData, isLoading: featuresLoading } = useQuery({
    queryKey: ['/api/ecommerce/features', selectedStore],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/ecommerce/features/${selectedStore}`, undefined, {
        'x-auth-email': 'abel@argilette.org',
        'authorization': 'Bearer demo-token'
      });
      return response.features;
    },
    enabled: !!selectedStore
  });

  // Fetch benchmarks
  const { data: benchmarks } = useQuery({
    queryKey: ['/api/ecommerce/benchmarks'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/ecommerce/benchmarks', undefined, {
        'x-auth-email': 'abel@argilette.org',
        'authorization': 'Bearer demo-token'
      });
      return response.benchmarks;
    }
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'conversion': return <Target className="h-4 w-4" />;
      case 'speed': return <Zap className="h-4 w-4" />;
      case 'seo': return <Search className="h-4 w-4" />;
      case 'ux': return <Users className="h-4 w-4" />;
      case 'marketing': return <TrendingUp className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getMetricColor = (value: number, benchmark: number) => {
    if (value >= benchmark * 1.1) return 'text-green-600';
    if (value >= benchmark * 0.9) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatMetricValue = (value: number, type: string) => {
    switch (type) {
      case 'percentage': return `${value.toFixed(1)}%`;
      case 'currency': return `$${value.toFixed(2)}`;
      case 'seconds': return `${value.toFixed(1)}s`;
      case 'score': return `${value.toFixed(0)}/100`;
      case 'rating': return `${value.toFixed(1)}/5`;
      default: return value.toFixed(1);
    }
  };

  if (metricsLoading || optimizationLoading || featuresLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Shopify Performance Engine</h2>
            <p className="text-gray-600">Transform your stores into high-performing e-commerce platforms</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-blue-600" />
            Shopify Performance Engine
          </h2>
          <p className="text-gray-600">Transform your stores into high-performing e-commerce platforms like Shopify</p>
        </div>
        
        {/* Store Selector */}
        {stores.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Store:</label>
            <select 
              value={selectedStore} 
              onChange={(e) => setSelectedStore(e.target.value)}
              className="border rounded px-3 py-1 text-sm"
            >
              {stores.map((store: any) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Performance Metrics Grid */}
      {performanceData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                  <p className="text-2xl font-bold">{formatMetricValue(performanceData.conversionRate, 'percentage')}</p>
                  <p className="text-xs text-gray-500">vs 3.2% industry avg</p>
                </div>
                <Target className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                  <p className="text-2xl font-bold">{formatMetricValue(performanceData.averageOrderValue, 'currency')}</p>
                  <p className="text-xs text-gray-500">vs $85 industry avg</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Page Load Speed</p>
                  <p className="text-2xl font-bold">{formatMetricValue(performanceData.pageLoadSpeed, 'seconds')}</p>
                  <p className="text-xs text-gray-500">vs 1.8s benchmark</p>
                </div>
                <Zap className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Mobile Score</p>
                  <p className="text-2xl font-bold">{formatMetricValue(performanceData.mobileOptimization, 'score')}</p>
                  <p className="text-xs text-gray-500">vs 92 benchmark</p>
                </div>
                <Smartphone className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Customer Satisfaction</p>
                  <p className="text-2xl font-bold">{formatMetricValue(performanceData.customerSatisfaction, 'rating')}</p>
                  <p className="text-xs text-gray-500">vs 4.3 industry avg</p>
                </div>
                <Star className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Performance Analysis */}
      <Tabs defaultValue="optimization" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="optimization">Optimization Plan</TabsTrigger>
          <TabsTrigger value="features">Shopify Features</TabsTrigger>
          <TabsTrigger value="competition">Competition</TabsTrigger>
          <TabsTrigger value="roadmap">Implementation</TabsTrigger>
        </TabsList>

        {/* Optimization Recommendations */}
        <TabsContent value="optimization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Performance Optimization Recommendations
              </CardTitle>
              <CardDescription>
                Actionable steps to make your store perform like top Shopify stores
              </CardDescription>
            </CardHeader>
            <CardContent>
              {optimizationData?.recommendations && (
                <div className="space-y-4">
                  {optimizationData.recommendations.map((rec: OptimizationRecommendation, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(rec.category)}
                          <h3 className="font-semibold">{rec.title}</h3>
                          <Badge variant={getPriorityColor(rec.priority)}>
                            {rec.priority} priority
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-green-600">{rec.expectedImpact}</p>
                          <p className="text-xs text-gray-500">{rec.timeToImplement}</p>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mb-2">{rec.description}</p>
                      <p className="text-sm text-blue-600 font-medium">Implementation: {rec.implementation}</p>
                      
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" className="flex-1">
                          <PlusCircle className="h-4 w-4 mr-1" />
                          Implement Now
                        </Button>
                        <Button size="sm" variant="outline">
                          Learn More
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shopify Features Implementation */}
        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Shopify-Level Feature Implementation
              </CardTitle>
              <CardDescription>
                Essential e-commerce features to compete with Shopify stores
              </CardDescription>
            </CardHeader>
            <CardContent>
              {featuresData?.features && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(featuresData.features).map(([feature, implemented]: [string, any]) => (
                    <div key={feature} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">
                          {feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </h4>
                        {implemented ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-orange-600" />
                        )}
                      </div>
                      <Badge variant={implemented ? 'default' : 'outline'} className="text-xs">
                        {implemented ? 'Active' : 'Needs Implementation'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
              
              {featuresData?.implementationPlan && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-4">Implementation Roadmap</h3>
                  <div className="space-y-3">
                    {featuresData.implementationPlan.map((phase: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">Phase {phase.phase}</h4>
                          <Badge variant="outline">{phase.timeline}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {phase.features.map((feature: string, featureIndex: number) => (
                            <Badge key={featureIndex} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-sm text-gray-600">
                          Resources: {phase.resources.join(', ')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Competitive Analysis */}
        <TabsContent value="competition" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Competitive Analysis vs Shopify Stores
              </CardTitle>
              <CardDescription>
                See how your store compares to top-performing Shopify stores
              </CardDescription>
            </CardHeader>
            <CardContent>
              {optimizationData?.competitorAnalysis && (
                <div className="space-y-4">
                  {optimizationData.competitorAnalysis.map((comp: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">{comp.feature}</h3>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Your Score</p>
                            <p className="text-xl font-bold">{comp.ourScore.toFixed(0)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Shopify Avg</p>
                            <p className="text-xl font-bold text-blue-600">{comp.competitorAverage.toFixed(0)}</p>
                          </div>
                        </div>
                      </div>
                      <Progress 
                        value={(comp.ourScore / comp.competitorAverage) * 100} 
                        className="mb-2"
                      />
                      <p className="text-sm text-blue-600 font-medium">{comp.improvement}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Roadmap */}
        <TabsContent value="roadmap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Performance Enhancement Roadmap
              </CardTitle>
              <CardDescription>
                Step-by-step plan to achieve Shopify-level performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {optimizationData?.performanceGaps && (
                <div className="space-y-4">
                  {optimizationData.performanceGaps.map((gap: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">{gap.metric}</h3>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Current</p>
                            <p className="text-xl font-bold">{gap.currentValue.toFixed(1)}</p>
                          </div>
                          <ArrowUp className="h-4 w-4 text-green-600" />
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Shopify Benchmark</p>
                            <p className="text-xl font-bold text-green-600">{gap.shopifyBenchmark.toFixed(1)}</p>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-blue-600 font-medium">{gap.improvementPotential}</p>
                      <div className="mt-3">
                        <Button size="sm" className="w-full">
                          Start Improvement Plan
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ShopifyPerformanceDashboard;